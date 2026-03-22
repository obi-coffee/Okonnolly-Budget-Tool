/**
 * Persists user-confirmed description→category mappings so that the same
 * merchant is auto-categorized correctly on future imports.
 */

const STORAGE_KEY = 'okonnolly-category-memory';

/** Normalize a description for consistent lookup (lowercase, collapse whitespace, strip trailing digits/refs) */
function normalize(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*#\d+.*$/, '')       // strip reference numbers
    .replace(/\s*\d{4,}$/, '')       // strip trailing long numbers
    .replace(/\s*(xx+|x{2}\d+).*$/i, '') // strip card masks like "xx1234"
    .trim();
}

function load(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function save(mem: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mem));
  } catch { /* ignore */ }
}

/** Look up a previously-confirmed category for this description */
export function lookupCategory(description: string): string | null {
  const mem = load();
  return mem[normalize(description)] ?? null;
}

/** Record one or more description→category mappings after user confirmation */
export function rememberCategories(entries: { description: string; category: string }[]) {
  const mem = load();
  for (const { description, category } of entries) {
    const key = normalize(description);
    if (key) mem[key] = category;
  }
  save(mem);
}

/** Clear all learned categories */
export function clearCategoryMemory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
