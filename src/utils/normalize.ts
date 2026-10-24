const STOP_WORDS = new Set<string>([
  'a', 'an', 'the', 'of', 'for', 'and', 'or', 'to', 'with', 'in', 'on',
  'is', 'are', 'rate', 'gst', 'hsn', 'code', 'what', 'which', 'find',
  'show', 'me', 'please', 'product', 'tell'
]);

export function normalize(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenize(value: unknown): string[] {
  return normalize(value)
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOP_WORDS.has(token));
}
