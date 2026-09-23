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

/**
 * A label that tells two combatants apart when the game gives them the same
 * name.
 *
 * Vegnagun's tail, leg, body and head are all literally called "Vegnagun" in
 * the data (`src/data/ffx2/enemies/vegnagun-*.ts`) — faithful, since that is
 * what the game's own target list says — which makes five chain rows reading
 * "Vegnagun" useless and is not what the approved frames show ("Tail",
 * "Leg", "Body / Core", "Head"). Their **ids** already carry the distinction,
 * so when a name is shared this drops the shared name off the front of the
 * id and humanises what is left: `vegnagun-tail` + "Vegnagun" -> "Tail".
 *
 * When what is left is only a letter or two — the three Nodes are `node-a`,
 * `node-b`, `node-c` — dropping the name would leave a chip reading "A", so
 * the letter is appended instead: "Node A", "Bulwark L", "Redoubt R", which
 * is exactly how the inventory frame labels them.
 *
 * This is formatting, not a new claim: no number, stat or behaviour is
 * invented, and a name the id does not extend is returned untouched.
 */
export function distinguishName(name: string, id: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (slug.length === 0 || !id.startsWith(`${slug}-`)) return name;
  const rest = id.slice(slug.length + 1);
  if (rest.length === 0) return name;
  return rest.length <= 2 ? `${name} ${rest.toUpperCase()}` : humanizeId(rest);
}

/**
 * The one noun a set of sibling names shares, when they all end in it:
 * `['Right Bulwark', 'Left Bulwark']` -> `'Bulwark'`, `['Node', 'Node']` ->
 * `'Node'`, `['Node A', 'Node B']` -> `'Node'` (a trailing one-letter tag is
 * the game's own designator — FFX-2 names the parts "Node A/B/C", research
 * `ffx2-vegnagun-shuyin.md` §13.2 S3 — not the noun). `undefined` when they
 * have no last word in common, so a caller can fall back to a generic noun
 * instead of picking one arbitrarily.
 */
export function sharedLastWord(names: readonly string[]): string | undefined {
  if (names.length === 0) return undefined;
  const lastWords = names.map((n) => {
    const words = n.trim().split(/\s+/);
    const last = words.at(-1) ?? '';
    return words.length > 1 && /^[A-Z]$/.test(last) ? (words.at(-2) ?? '') : last;
  });
  const first = lastWords[0];
  if (first === undefined || first.length === 0) return undefined;
  return lastWords.every((w) => w === first) ? first : undefined;
}
