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

function extractAmounts(text: string): { value: number; index: number; raw: string }[] {
  const results: { value: number; index: number; raw: string }[] = [];
  const re = new RegExp(AMOUNT_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const isNeg = raw.startsWith('-') || raw.startsWith('(');
    const value = parseFloat(raw.replace(/[$,()]/g, ''));
    if (isNaN(value) || value === 0) continue;
    results.push({ value: Math.abs(value), index: m.index, raw });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Section detection — determines whether we're in a transaction area or not
// ---------------------------------------------------------------------------

/** Sections we should PARSE for transactions */
const TRANSACTION_SECTION_RE =
  /\b(new\s*charges|purchases|transactions?|activity\s*detail|account\s*activity|payments?\s*and\s*credits|checks?\s*and\s*other\s*deductions|online\s*and\s*electronic|banking.?debit\s*card|deposits?\s*and\s*other\s*additions|withdrawals?|other\s*debits|other\s*credits|card\s*activity|recent\s*activity)\b/i;

/** Sections we should SKIP entirely (summaries, balance tables, etc.) */
const SKIP_SECTION_RE =
  /\b(account\s*summary|balance\s*summary|daily\s*balance|interest\s*summary|year.?to.?date|account\s*information|important\s*information|important\s*messages|rewards?\s*summary|fee\s*summary|rate\s*summary|disclosure|notice|how\s*to\s*reach\s*us|customer\s*service)\b/i;

/** Lines that are headers/footers/noise — always skip */
const SKIP_LINE_RE =
  /^\s*(page\s+\d|continued\b|total\b|totals\b|subtotal|balance\s*forward|previous\s*balance|new\s*balance|opening\s*balance|closing\s*balance|ending\s*balance|beginning\s*balance|statement\s*(period|date|closing)|account\s*(number|ending|type)|member\s*since|credit\s*limit|available\s*credit|minimum\s*payment|payment\s*due|amount\s*due|rewards|points|cashback|annual\s*percentage|apr\b|interest\s*charge|annual\s*fee|fee\s*charged|days?\s*in\s*(period|billing)|average\s*(daily\s*)?balance|there\s*were\s*no|no\s*transactions)/i;

/** Date column header — skip these */
const COLUMN_HEADER_RE =
  /^\s*(date|trans\.?\s*date|post\.?\s*date|posting\s*date|description|merchant|amount|debit|credit|balance|reference|ref\.?\s*#?|check\s*#?)\s*$/i;

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
// Main parser
// ---------------------------------------------------------------------------

/**
 * Parse a PDF bank or credit-card statement into transactions.
 *
 * Handles Amex credit card statements and PNC checking statements specifically,
 * plus a generic fallback for other institutions.
 *
 * Strategy:
 *  1. Extract text items → build visual lines across all pages
 *  2. Track which "section" we're in (transaction area vs summary/skip)
 *  3. For transaction lines: match date + amount, extract description between
 *  4. Multi-line descriptions: continuation lines (no date, no amount) are
 *     appended to the previous transaction's description
 *  5. Look-ahead for amounts on the next line when the date line has none
 */
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

  // Section tracking
  let inTransactionSection = false;
  let inSkipSection = false;
  // Once we see the first real transaction, we're "warmed up" — helps with
  // statements that don't have clear section headers
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

    // Skip lines we know are noise
    if (SKIP_LINE_RE.test(line)) continue;
    if (COLUMN_HEADER_RE.test(line)) continue;

    // If we're in an explicit skip section, ignore everything
    if (inSkipSection) continue;

    const date = extractDate(line);

    // --- Continuation line (no date): append to previous transaction ---
    if (!date && txns.length > 0 && (inTransactionSection || seenFirstTxn)) {
      // Only append if this line has no amount (pure description continuation)
      // and isn't a section header
      const lineAmounts = extractAmounts(line);
      if (lineAmounts.length === 0 && line.length > 2 && !SKIP_LINE_RE.test(line)) {
        const cleaned = line.replace(/\s+/g, ' ').replace(/^[,\-–—*#\s]+/, '').trim();
        if (cleaned && !SKIP_SECTION_RE.test(cleaned)) {
          txns[txns.length - 1].description += ' ' + cleaned;
          // Re-categorize with the fuller description
          txns[txns.length - 1].category = categorizeTransaction(txns[txns.length - 1].description);
        }
      }
      continue;
    }

    if (!date) continue;

    // --- Try to find amount on this line ---
    let amounts = extractAmounts(line);
    let amountLine = line;
    let lookAhead = 0;

    // Look ahead up to 2 lines for the amount if not on this line
    if (amounts.length === 0) {
      for (let j = 1; j <= 2 && i + j < allLines.length; j++) {
        const nextLine = allLines[i + j];
        if (extractDate(nextLine)) break; // next transaction starts
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

    // Pick the transaction amount (not a running balance):
    // - If only one amount, use it
    // - Amex: typically one amount per line (the charge)
    // - PNC: may have amount + running balance; the first is usually the txn
    // - If two amounts and the second is much larger, it's likely a balance
    let amount: number;
    if (amounts.length === 1) {
      amount = amounts[0].value;
    } else if (amounts.length === 2 && amounts[1].value > amounts[0].value * 3) {
      // Second is probably a running balance
      amount = amounts[0].value;
    } else {
      // Default: use the last amount (most statements put txn amount last
      // before an optional balance column)
      amount = amounts[amounts.length - 1].value;
    }
    if (amount === 0) continue;

    // --- Extract description ---
    let description = '';

    if (amountLine === line) {
      const dateIdx = line.indexOf(date);
      const firstAmt = amounts[0];
      description = line.substring(dateIdx + date.length, firstAmt.index).trim();

      // If there's a second date (post date), skip past it
      const descDate = extractDate(description);
      if (descDate) {
        const dIdx = description.indexOf(descDate);
        description = description.substring(dIdx + descDate.length).trim();
      }
    } else {
      // Amount is on a subsequent line — description is rest of the date line
      // plus any intermediate lines
      const dateIdx = line.indexOf(date);
      description = line.substring(dateIdx + date.length).trim();

      // Skip past a second date (posting date) if present
      const descDate = extractDate(description);
      if (descDate) {
        const dIdx = description.indexOf(descDate);
        description = description.substring(dIdx + descDate.length).trim();
      }

      for (let j = 1; j < lookAhead; j++) {
        const midLine = allLines[i + j].trim();
        if (midLine && !SKIP_LINE_RE.test(midLine)) {
          description += ' ' + midLine;
        }
      }
    }

    // Clean up description
    description = description
      .replace(/\s+/g, ' ')
      .replace(/^[,\-–—*#\s]+/, '')
      .replace(/[,\-–—*#\s]+$/, '')
      .trim();

    if (!description) continue;
    if (SKIP_LINE_RE.test(description)) continue;

    const category = categorizeTransaction(description);
    txns.push({ date, description, amount, category });

    seenFirstTxn = true;
    inTransactionSection = true; // auto-enter transaction mode once we see one

    if (lookAhead > 0) i += lookAhead;
  }

  return txns;
}
