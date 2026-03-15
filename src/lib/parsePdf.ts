import type { Transaction } from './types';
import { categorizeTransaction } from './categorize';

// ---------------------------------------------------------------------------
// Date patterns — most specific first
// ---------------------------------------------------------------------------
const DATE_PATTERNS = [
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,          // MM/DD/YYYY or M/D/YY
  /(\d{4}-\d{2}-\d{2})/,                    // YYYY-MM-DD
  /(\d{1,2}-\d{1,2}-\d{2,4})/,             // MM-DD-YYYY
  /(\w{3}\s+\d{1,2},?\s+\d{4})/,           // Jan 01, 2024
  /(\w{3}\s+\d{1,2})/,                      // Jan 01 (no year)
  /(\d{1,2}\/\d{1,2})\b/,                   // MM/DD (no year)
];

// Amount: optional negative/parens, optional $, digits with commas, required .XX
const AMOUNT_RE = /[(-]?\$?\d{1,3}(?:,\d{3})*\.\d{2}\)?\b/g;

function extractDate(text: string): string | null {
  for (const p of DATE_PATTERNS) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractAmounts(text: string): { value: number; index: number; raw: string; end: number }[] {
  const results: { value: number; index: number; raw: string; end: number }[] = [];
  const re = new RegExp(AMOUNT_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const value = parseFloat(raw.replace(/[$,()]/g, ''));
    if (isNaN(value) || value === 0) continue;
    results.push({ value: Math.abs(value), index: m.index, raw, end: m.index + raw.length });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Section detection
// ---------------------------------------------------------------------------

/** Sections we should PARSE for transactions */
const TRANSACTION_SECTION_RE =
  /\b(new\s*charges|purchases|transactions?|activity\s*detail|account\s*activity|payments?\s*and\s*credits|checks?\s*and\s*other\s*deductions|online\s*and\s*electronic|banking.?debit\s*card|deposits?\s*and\s*other\s*additions|withdrawals?|other\s*debits|other\s*credits|card\s*activity|recent\s*activity|electronic\s*(banking|transfers?))\b/i;

/** Sections we should SKIP entirely */
const SKIP_SECTION_RE =
  /\b(account\s*summary|balance\s*summary|daily\s*(ledger\s*)?balance|interest\s*summary|year.?to.?date|account\s*information|important\s*information|important\s*messages|rewards?\s*summary|fee\s*summary|rate\s*summary|disclosure|notice|how\s*to\s*reach\s*us|customer\s*service|service\s*charges?\s*and\s*fees|transaction\s*summary)\b/i;

/** Lines that are headers/footers/noise — always skip */
const SKIP_LINE_RE =
  /^\s*(page\s+\d|continued\b|total\b|totals\b|subtotal|balance\s*forward|previous\s*balance|new\s*balance|opening\s*balance|closing\s*balance|ending\s*balance|beginning\s*balance|statement\s*(period|date|closing)|account\s*(number|ending|type)|member\s*since|credit\s*limit|available\s*credit|minimum\s*payment|payment\s*due|amount\s*due|rewards|points|cashback|annual\s*percentage|apr\b|interest\s*charge|annual\s*fee|fee\s*charged|days?\s*in\s*(period|billing)|average\s*(daily\s*|monthly\s*)?balance|there\s*were\s*no|no\s*transactions|items\s+amount)/i;

/** Column header lines — skip these */
const COLUMN_HEADER_RE =
  /^\s*(date\s*(posted)?|trans\.?\s*date|post\.?\s*date|posting\s*date|description|merchant|amount|debit|credit|balance|reference|ref\.?\s*#?|check\s*#?|date\s+amount\s+description|date\s+description\s+amount)\s*$/i;

// ---------------------------------------------------------------------------
// Text item and line building
// ---------------------------------------------------------------------------
interface TextItem {
  text: string;
  x: number;
  y: number;
}

function buildLines(items: TextItem[], tolerance = 4): string[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: string[] = [];
  let currentLineY = sorted[0].y;
  let currentItems: TextItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentLineY) <= tolerance) {
      currentItems.push(item);
    } else {
      currentItems.sort((a, b) => a.x - b.x);
      const text = joinItems(currentItems);
      if (text) lines.push(text);
      currentLineY = item.y;
      currentItems = [item];
    }
  }
  currentItems.sort((a, b) => a.x - b.x);
  const text = joinItems(currentItems);
  if (text) lines.push(text);

  return lines;
}

function joinItems(items: TextItem[]): string {
  if (items.length === 0) return '';
  let result = items[0].text;
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const curr = items[i];
    const gap = curr.x - (prev.x + prev.text.length * 4);
    if (gap > 2 && !result.endsWith(' ') && !curr.text.startsWith(' ')) {
      result += ' ';
    }
    result += curr.text;
  }
  return result.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Description extraction — handles both column orders
// ---------------------------------------------------------------------------

/**
 * Extract the description from a line that has a date and amount(s).
 *
 * Handles two common layouts:
 *   Layout A (Amex, most CCs):  Date ... Description ... Amount
 *   Layout B (PNC, some banks): Date ... Amount ... Description
 *
 * The heuristic: try Layout A first (text between date and first amount).
 * If that yields nothing meaningful, try Layout B (text after last amount).
 */
function extractDescription(
  line: string,
  date: string,
  amounts: { value: number; index: number; raw: string; end: number }[],
): string {
  const dateIdx = line.indexOf(date);
  const afterDate = dateIdx + date.length;
  const firstAmt = amounts[0];

  // --- Layout A: description is between date and first amount ---
  let descA = line.substring(afterDate, firstAmt.index).trim();

  // If there's a second date (posting date), skip past it
  const postDate = extractDate(descA);
  if (postDate) {
    const pdIdx = descA.indexOf(postDate);
    descA = descA.substring(pdIdx + postDate.length).trim();
  }

  // --- Layout B: description is after the last amount ---
  const lastAmt = amounts[amounts.length - 1];
  const descB = line.substring(lastAmt.end).trim();

  // Decide which layout to use
  const cleanA = cleanDesc(descA);
  const cleanB = cleanDesc(descB);

  // If Layout A has a meaningful description, prefer it
  if (cleanA.length >= 3) return cleanA;

  // Otherwise use Layout B (PNC-style: date → amount → description)
  if (cleanB.length >= 3) return cleanB;

  // Last resort: try everything after the date that isn't an amount
  const everything = line.substring(afterDate).trim();
  // Remove all amount strings from it
  let stripped = everything;
  for (const a of amounts) {
    stripped = stripped.replace(a.raw, ' ');
  }
  return cleanDesc(stripped);
}

function cleanDesc(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^[,\-–—*#\s]+/, '')
    .replace(/[,\-–—*#\s]+$/, '')
    .trim();
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export async function parsePdf(file: File): Promise<Transaction[]> {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    const items: TextItem[] = [];
    for (const item of content.items) {
      if (!('str' in item) || !('transform' in item)) continue;
      const ti = item as { str: string; transform: number[] };
      if (!ti.str.trim()) continue;
      items.push({ text: ti.str, x: ti.transform[4], y: ti.transform[5] });
    }

    allLines.push(...buildLines(items));
  }

  return parseLines(allLines);
}

function parseLines(allLines: string[]): Transaction[] {
  const txns: Transaction[] = [];

  let inTransactionSection = false;
  let inSkipSection = false;
  let seenFirstTxn = false;

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];

    // --- Section header detection ---
    if (TRANSACTION_SECTION_RE.test(line) && !extractDate(line)) {
      inTransactionSection = true;
      inSkipSection = false;
      continue;
    }
    if (SKIP_SECTION_RE.test(line) && !extractDate(line)) {
      inTransactionSection = false;
      inSkipSection = true;
      continue;
    }

    // Skip noise
    if (SKIP_LINE_RE.test(line)) continue;
    if (COLUMN_HEADER_RE.test(line)) continue;
    if (inSkipSection) continue;

    const date = extractDate(line);

    // --- Continuation line: append to previous transaction's description ---
    if (!date && txns.length > 0 && (inTransactionSection || seenFirstTxn)) {
      const lineAmounts = extractAmounts(line);
      if (lineAmounts.length === 0 && line.length > 2 && !SKIP_LINE_RE.test(line)) {
        const cleaned = cleanDesc(line);
        if (cleaned && !SKIP_SECTION_RE.test(cleaned)) {
          txns[txns.length - 1].description += ' ' + cleaned;
          txns[txns.length - 1].category = categorizeTransaction(txns[txns.length - 1].description);
        }
      }
      continue;
    }

    if (!date) continue;

    // --- Find amounts (same line or look-ahead) ---
    let amounts = extractAmounts(line);
    let amountLine = line;
    let lookAhead = 0;

    if (amounts.length === 0) {
      for (let j = 1; j <= 2 && i + j < allLines.length; j++) {
        const nextLine = allLines[i + j];
        if (extractDate(nextLine)) break;
        if (SKIP_LINE_RE.test(nextLine)) continue;
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

    // --- Pick the transaction amount (not a running balance) ---
    let amount: number;
    if (amounts.length === 1) {
      amount = amounts[0].value;
    } else if (amounts.length === 2 && amounts[1].value > amounts[0].value * 3) {
      // Second is likely a running balance
      amount = amounts[0].value;
    } else {
      // For PNC (date → amount → desc): first amount is the transaction
      // For most CCs (date → desc → amount): last amount is the transaction
      // We rely on description extraction to figure out the layout
      amount = amounts[0].value;
    }
    if (amount === 0) continue;

    // --- Extract description ---
    let description = '';

    if (amountLine === line) {
      description = extractDescription(line, date, amounts);
    } else {
      // Amount on a subsequent line — description is text after the date on the current line
      const dateIdx = line.indexOf(date);
      description = line.substring(dateIdx + date.length).trim();

      // Skip a second date (posting date) if present
      const postDate = extractDate(description);
      if (postDate) {
        const pdIdx = description.indexOf(postDate);
        description = description.substring(pdIdx + postDate.length).trim();
      }

      // Include intermediate continuation lines
      for (let j = 1; j < lookAhead; j++) {
        const midLine = allLines[i + j].trim();
        if (midLine && !SKIP_LINE_RE.test(midLine)) {
          description += ' ' + midLine;
        }
      }
      description = cleanDesc(description);
    }

    if (!description || description.length < 2) continue;
    if (SKIP_LINE_RE.test(description)) continue;

    const category = categorizeTransaction(description);
    txns.push({ date, description, amount, category });

    seenFirstTxn = true;
    inTransactionSection = true;

    if (lookAhead > 0) i += lookAhead;
  }

  return txns;
}
