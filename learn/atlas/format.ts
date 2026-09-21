/**
 * Small, dependency-free formatting helpers for the atlas data layer.
 *
 * Nothing here reads game data — these only turn values that already came
 * from `src/data/**` into readable strings, so a data file's raw ids and
 * numbers don't leak into a `PieceCard` verbatim.
 */

/** `'action-cancel'` -> `'Action Cancel'`. Used for status/immunity/AI-script ids that carry no dedicated display name in the data. */
export function humanizeId(id: string): string {
  return id
    .split('-')
    .filter((part) => part.length > 0)
    .map((part) => titleCase(part))
    .join(' ');
}

/** `1234567` -> `'1,234,567'`. */
export function fmtNumber(value: number): string {
  return value.toLocaleString('en-US');
}

/** Title-cases a single word, e.g. an `ElementId` (`'fire'` -> `'Fire'`) or an `Affinity` (`'immune'` -> `'Immune'`). */
export function titleCase(word: string): string {
  return word.length === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1);
}

/** Joins a non-empty list into a natural-language sentence fragment: `['a']` -> `'a'`, `['a','b']` -> `'a and b'`, `['a','b','c']` -> `'a, b and c'`. */
export function joinNatural(items: readonly string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] ?? '';
  const last = items[items.length - 1] ?? '';
  const rest = items.slice(0, -1);
  return `${rest.join(', ')} and ${last}`;
}

/** `n` plus a pluralised `noun` (`'combatant'` -> `'1 combatant'` / `'2 combatants'`). Only handles the regular `+s` plural, which is every noun this module needs. */
export function countNoun(n: number, noun: string): string {
  return `${fmtNumber(n)} ${noun}${n === 1 ? '' : 's'}`;
}
