export function normalizeSummary(text: string) {
  if (!text) return '';
  const t = text.trim().replace(/\u2028|\r\n/g, '\n');
  return t;
}
