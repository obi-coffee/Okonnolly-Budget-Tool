import type { Transaction } from './types';
import { categorizeTransaction } from './categorize';

// Common date patterns found in bank statements
const DATE_PATTERNS = [
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,       // MM/DD/YYYY or M/D/YY
  /(\d{4}-\d{2}-\d{2})/,                 // YYYY-MM-DD
  /(\d{1,2}-\d{1,2}-\d{2,4})/,          // MM-DD-YYYY
  /(\w{3}\s+\d{1,2},?\s+\d{4})/,        // Jan 01, 2024
];

// Amount pattern: optional minus, optional $, digits with commas, optional decimal
const AMOUNT_RE = /-?\$?\d{1,3}(?:,\d{3})*(?:\.\d{2})\b/g;

function extractDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[1];
  }
  return null;
}

function extractAmounts(text: string): number[] {
  const matches = text.match(AMOUNT_RE) || [];
  return matches.map(s => Math.abs(parseFloat(s.replace(/[$,]/g, ''))));
}

/**
 * Parse a PDF file into transactions by extracting text and scanning for
 * lines that contain a date, some description text, and an amount.
 */
export async function parsePdf(file: File): Promise<Transaction[]> {
  const pdfjsLib = await import('pdfjs-dist');

  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Extract all text content page by page
  const lines: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Group text items into lines by Y position
    const lineMap = new Map<number, string[]>();
    for (const item of content.items) {
      if (!('str' in item)) continue;
      // Round Y to nearest integer to group items on the same line
      const y = Math.round((item as { transform: number[] }).transform[5]);
      if (!lineMap.has(y)) lineMap.set(y, []);
      lineMap.get(y)!.push((item as { str: string }).str);
    }

    // Sort by Y descending (PDF coordinates go bottom-up) and join
    const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const text = lineMap.get(y)!.join(' ').trim();
      if (text) lines.push(text);
    }
  }

  // Parse lines into transactions
  const txns: Transaction[] = [];
  // Skip header/summary lines — only consider lines that start with or contain a date
  for (const line of lines) {
    const date = extractDate(line);
    if (!date) continue;

    const amounts = extractAmounts(line);
    if (amounts.length === 0) continue;

    // Use the last amount on the line (typically the transaction amount, not a running balance)
    // If there are two amounts, the first is usually the transaction, the second is the balance
    const amount = amounts.length >= 2 ? amounts[0] : amounts[0];
    if (amount === 0) continue;

    // Extract description: text between the date and the first amount
    const dateIdx = line.indexOf(date);
    const amountMatch = line.match(AMOUNT_RE);
    const amountIdx = amountMatch ? line.indexOf(amountMatch[0]) : line.length;
    let description = line.substring(dateIdx + date.length, amountIdx).trim();

    // Clean up description
    description = description.replace(/\s+/g, ' ').replace(/^[,\-–—\s]+/, '').replace(/[,\-–—\s]+$/, '');

    if (!description) continue;

    const category = categorizeTransaction(description);
    txns.push({ date, description, amount, category });
  }

  return txns;
}
