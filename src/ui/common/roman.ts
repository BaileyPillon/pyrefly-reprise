/**
 * I-VIII for the chapters (five shipped, Leblanc 6, Macalania 7, Evrae 8 to
 * come); falls back to the digits for anything else. Both games: shared
 * plumbing. It stopped at V until Chapter 7 was registered, which is why
 * Leblanc's cutscene eyebrow and prep header read "6" while its pause meta
 * read "VI".
 */
export function romanNumeral(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][n - 1] ?? String(n);
}
