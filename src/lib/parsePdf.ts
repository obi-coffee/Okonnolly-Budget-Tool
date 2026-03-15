import type { Transaction } from './types';
import { categorizeTransaction } from './categorize';

// Date patterns — ordered from most specific to least
const DATE_PATTERNS = [
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,          // MM/DD/YYYY or M/D/YY
  /(\d{4}-\d{2}-\d{2})/,                    // YYYY-MM-DD
  /(\d{1,2}-\d{1,2}-\d{2,4})/,             // MM-DD-YYYY
  /(\w{3}\s+\d{1,2},?\s+\d{4})/,           // Jan 01, 2024
  /(\w{3}\s+\d{1,2})/,                      // Jan 01 (no year — common on CC statements)
  /(\d{1,2}\/\d{1,2})\b/,                   // MM/DD (no year)
];

// Amount: optional negative, optional $, digits with optional commas, required .XX cents
const AMOUNT_RE = /-?\$?\d{1,3}(?:,\d{3})*\.\d{2}\b/g;

// Lines that are clearly headers/footers/summaries — skip these
const SKIP_LINE_RE = /^\s*(page\s+\d|continued|total|balance|previous|opening|closing|summary|statement|account\s*(number|ending)|member\s*since|credit\s*limit|available|minimum\s*payment|payment\s*due|rewards|cashback|apr\b|interest\s*charge|annual\s*fee|fee\s*charged)/i;

interface TextItem {
  text: string;
  x: number;
  y: number;
}

function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[1];
  }
  return null;
}

function extractAmounts(text: string): { value: number; index: number }[] {
  const results: { value: number; index: number }[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(AMOUNT_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    const value = Math.abs(parseFloat(m[0].replace(/[$,]/g, '')));
    results.push({ value, index: m.index });
  }
  return results;
}

/**
 * Group text items into visual lines using Y-coordinate proximity.
 * Items within `tolerance` points of each other are considered same line.
 * Within each line, items are sorted left-to-right by X coordinate.
 */
function buildLines(items: TextItem[], tolerance = 4): string[] {
  if (items.length === 0) return [];

  // Sort by Y descending (PDF coords go bottom-up), then X ascending
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: string[] = [];
  let currentLineY = sorted[0].y;
  let currentItems: TextItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentLineY) <= tolerance) {
      // Same line
      currentItems.push(item);
    } else {
      // Flush current line
      currentItems.sort((a, b) => a.x - b.x);
      const text = joinItems(currentItems);
      if (text) lines.push(text);
      // Start new line
      currentLineY = item.y;
      currentItems = [item];
    }
  }
  // Flush last line
  currentItems.sort((a, b) => a.x - b.x);
  const text = joinItems(currentItems);
  if (text) lines.push(text);

  return lines;
}

/** Join text items with smart spacing */
function joinItems(items: TextItem[]): string {
  if (items.length === 0) return '';
  let result = items[0].text;
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const curr = items[i];
    // Add space if there's a gap between items (> ~2 points)
    const gap = curr.x - (prev.x + prev.text.length * 4); // rough char width estimate
    if (gap > 2 && !result.endsWith(' ') && !curr.text.startsWith(' ')) {
      result += ' ';
    }
    result += curr.text;
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Parse a PDF bank/credit-card statement into transactions.
 *
 * Strategy:
 * 1. Extract all text items with coordinates from every page
 * 2. Group into visual lines using Y-proximity (tolerance handles slight misalignment)
 * 3. For each line with a date: try to find an amount on the same line
 * 4. If a date-line has no amount, look at the next 1-2 lines for the amount
 *    (handles wrapped descriptions or amount on a separate sub-line)
 * 5. Extract the description from text between the date and amount
 */
export async function parsePdf(file: File): Promise<Transaction[]> {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Collect all lines across all pages
  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const items: TextItem[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !('transform' in item)) continue;
      const ti = item as { str: string; transform: number[] };
      if (!ti.str.trim()) continue;
      items.push({
        text: ti.str,
        x: ti.transform[4],
        y: ti.transform[5],
      });
    }

    const pageLines = buildLines(items);
    allLines.push(...pageLines);
  }

  // Parse lines into transactions
  const txns: Transaction[] = [];

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    // Skip headers/footers
    if (SKIP_LINE_RE.test(line)) continue;

    const date = extractDate(line);
    if (!date) continue;

    // Try to find amount on this line
    let amounts = extractAmounts(line);
    let amountLine = line;
    let lookAhead = 0;

    // If no amount on this line, check the next 1-2 lines
    // (CC statements sometimes put the amount on a sub-line)
    if (amounts.length === 0) {
      for (let j = 1; j <= 2 && i + j < allLines.length; j++) {
        const nextLine = allLines[i + j];
        // Stop if the next line is itself a new transaction (has a date)
        if (extractDate(nextLine)) break;
        const nextAmounts = extractAmounts(nextLine);
        if (nextAmounts.length > 0) {
          amounts = nextAmounts;
          amountLine = nextLine;
          lookAhead = j;
          break;
        }
      }
    }

    if (amounts.length === 0) continue;

    // Pick the right amount:
    // - If there's only one, use it
    // - If there are two on the same line, the last is usually the transaction amount
    //   (first might be a date-like number or running balance)
    // - For CC statements with transaction + balance columns, we want the transaction amount
    const amount = amounts.length === 1 ? amounts[0].value : amounts[amounts.length - 1].value;
    if (amount === 0) continue;

    // Extract description
    let description = '';

    if (amountLine === line) {
      // Amount is on the same line as the date — description is between them
      const dateIdx = line.indexOf(date);
      const lastAmt = amounts[amounts.length - 1];
      const amtStr = line.substring(lastAmt.index).match(AMOUNT_RE)?.[0] || '';
      description = line.substring(dateIdx + date.length, lastAmt.index).trim();

      // If there's a second date (post date), skip past it
      const descDate = extractDate(description);
      if (descDate) {
        const dIdx = description.indexOf(descDate);
        description = description.substring(dIdx + descDate.length).trim();
      }
    } else {
      // Amount is on a subsequent line — description is rest of the date line
      const dateIdx = line.indexOf(date);
      description = line.substring(dateIdx + date.length).trim();

      // Also prepend any intermediate lines as part of the description
      for (let j = 1; j < lookAhead; j++) {
        description += ' ' + allLines[i + j].trim();
      }
    }

    // Clean up
    description = description
      .replace(/\s+/g, ' ')
      .replace(/^[,\-–—*#\s]+/, '')
      .replace(/[,\-–—*#\s]+$/, '')
      .trim();

    if (!description) continue;
    // Skip if description looks like a summary/balance line
    if (SKIP_LINE_RE.test(description)) continue;

    const category = categorizeTransaction(description);
    txns.push({ date, description, amount, category });

    // Skip lines we already consumed
    if (lookAhead > 0) i += lookAhead;
  }

  return txns;
}
