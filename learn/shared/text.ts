/**
 * Small, framework-free text helpers the DOM modules share. Pure string-in,
 * string-out — no DOM, so these are unit tested directly.
 */

/** Escapes the five HTML-significant characters. Every helper below runs its plain-text input through this before building markup. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Wraps every run of digits (with internal commas, e.g. `"1,234"`) in `<b>`,
 * for lines like a specimen's `factsLine` ("134 pieces · 5 battles · ...")
 * where the frames set the counts in the numeral face and everything else
 * plain. Safe against HTML injection: everything else is escaped first.
 */
export function highlightNumbers(line: string): string {
  return line
    .split(/(\d[\d,]*)/)
    .map((chunk) => (/^\d[\d,]*$/.test(chunk) ? `<b>${escapeHtml(chunk)}</b>` : escapeHtml(chunk)))
    .join('');
}
