/** I-V for the five chapters; falls back to the digits for anything else. */
export function romanNumeral(n: number): string {
  return ['I', 'II', 'III', 'IV', 'V'][n - 1] ?? String(n);
}
