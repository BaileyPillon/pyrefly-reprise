/**
 * The chapter numeral in Roman figures (I, II, ... IX, X, XI ...) for any
 * whole number from 1 to 3999; anything else falls back to its digits. Both
 * games: shared plumbing. It once stopped at V (until Chapter 7 was
 * registered, which is why Leblanc's cutscene eyebrow and prep header read
 * "6" while its pause meta read "VI"), then at VIII, so the registered but
 * unlisted chapters 9 and 10 read "FFX · 9" on the phone prep page.
 */
const FIGURES: ReadonlyArray<readonly [number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/**
 * The numeral a chapter wears: its Roman figure, or `EXP` for an experiment (the FFX-2 Leblanc preview is number 19 on the board but is
 * no "Chapter XIX": it is Chapter VI's mission in new paintings, `data/chapter-exp-leblanc.ts`).
 */
export function chapterNumeral(chapter: { number: number; experimental?: true }): string {
  return chapter.experimental ? 'EXP' : romanNumeral(chapter.number);
}

/** The eyebrow over a chapter's opening cards: `CHAPTER VI`, or `EXPERIMENTAL` for the preview. */
export function chapterLabel(chapter: { number: number; experimental?: true }): string {
  return chapter.experimental ? 'EXPERIMENTAL' : `CHAPTER ${romanNumeral(chapter.number)}`;
}

export function romanNumeral(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 3999) return String(n);
  let rest = n;
  let out = '';
  for (const [value, figure] of FIGURES) {
    while (rest >= value) {
      out += figure;
      rest -= value;
    }
  }
  return out;
}
