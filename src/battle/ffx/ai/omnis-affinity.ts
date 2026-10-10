/**
 * **What the four Mortiphasm discs make Seymour Omnis**, as his own script works it out (re-parity;
 * `research/re-ffx-ai-seymour.md` sections 5.3 and 5.4; D-26, D-31). **Game case: FFX only.** Pure: no engine state.
 *
 * ## The affinity routine
 *
 * Count the discs by the element they show. All sixteen of his Absorb / Null / Resist / Weak flags for the four
 * elements are cleared, then set by the **first matching branch**, tested in this order:
 *
 * 1. an element on **four** discs: Absorb it, Weak to its opposite (Fire / Ice, Water / Thunder);
 * 2. an element on **three** (Fire, Ice, Water, Thunder in turn): Absorb it, Resist the fourth disc's element;
 * 3. **pairs**, the first found in the order Fire, Ice, Water, Thunder: Null that element **(a slip, below)** and,
 *    in the same branch, Null a second pair if there is one, else Resist every single left;
 * 4. all four different: Resist all four.
 *
 * **The Water-pair slip.** When the Water pair is the *first* pair the chain meets (neither Fire nor Ice is a pair),
 * its branch writes Null **Fire** where Null Water was meant. A Water pair that follows a Fire or an Ice pair is
 * correct, because the earlier branch Nulls its second pair itself. So "two Water discs make him immune to Fire" is
 * true for exactly four layouts: Thunder-Thunder-Water-Water, and Water-Water with two different singles from
 * Fire, Ice and Thunder (with Fire among them he is Null Fire *and* Resist Fire: Null wins).
 *
 * ## The cast order
 *
 * He always casts **four** spells, in an order the compiled branches fix per layout: the table below is the one the
 * research note recorded by running his real pre-turn and turn functions over all 256 disc layouts (every
 * arrangement of the same multiset gives the same row). A spell is **-ga** when its element shows on three or four
 * discs and **-ra** otherwise.
 */

import type { Affinity, ElementalAffinities } from '../../common/types.ts';

export type Element4 = 'fire' | 'ice' | 'lightning' | 'water';

/** The order the script tests the elements in: Fire, Ice, Water, Thunder. */
export const TEST_ORDER: readonly Element4[] = ['fire', 'ice', 'water', 'lightning'];

/**
 * Opposite pairs for the four-of-a-kind weakness: **Fire ↔ Ice** (all-Fire opens weak to Ice, verified: 3 sources)
 * and **Thunder ↔ Water** (the script's own pairs, section 5.3).
 */
export const OPPOSITE: Readonly<Record<Element4, Element4>> = { fire: 'ice', ice: 'fire', lightning: 'water', water: 'lightning' };

const RANK: Readonly<Record<Affinity, number>> = { normal: 0, resist: 1, weak: 2, immune: 3, absorb: 4 };

/** How many discs show each element. */
export function countDiscs(discs: readonly Element4[]): Record<Element4, number> {
  const n: Record<Element4, number> = { fire: 0, ice: 0, lightning: 0, water: 0 };
  for (const d of discs) n[d] += 1;
  return n;
}

/** His four elemental affinities for a disc layout. Holy and every other element are not in the result. */
export function omnisAffinities(discs: readonly Element4[]): ElementalAffinities {
  const n = countDiscs(discs);
  const out: Record<Element4, Affinity> = { fire: 'normal', ice: 'normal', lightning: 'normal', water: 'normal' };
  const raise = (e: Element4, a: Affinity): void => {
    if (RANK[a] > RANK[out[e]]) out[e] = a;
  };

  const four = TEST_ORDER.find((e) => n[e] === 4);
  if (four) {
    raise(four, 'absorb');
    raise(OPPOSITE[four], 'weak');
    return out;
  }
  const three = TEST_ORDER.find((e) => n[e] === 3);
  if (three) {
    raise(three, 'absorb');
    const fourth = TEST_ORDER.find((e) => n[e] === 1);
    if (fourth) raise(fourth, 'resist');
    return out;
  }
  const pairs = TEST_ORDER.filter((e) => n[e] === 2);
  const first = pairs[0];
  if (first) {
    raise(first === 'water' ? 'fire' : first, 'immune'); // the Water-pair slip
    const second = pairs[1];
    if (second) raise(second, 'immune');
    else for (const e of TEST_ORDER) if (n[e] === 1) raise(e, 'resist');
    return out;
  }
  for (const e of TEST_ORDER) raise(e, 'resist');
  return out;
}

const LETTER: Readonly<Record<Element4, string>> = { fire: 'F', ice: 'I', water: 'W', lightning: 'T' };
const ELEMENT_OF: Readonly<Record<string, Element4>> = { F: 'fire', I: 'ice', W: 'water', T: 'lightning' };

/** The layout as the table's key: its letters in the order Fire, Ice, Water, Thunder (`'FFWT'`). */
export function layoutKey(discs: readonly Element4[]): string {
  const n = countDiscs(discs);
  return TEST_ORDER.map((e) => LETTER[e].repeat(n[e])).join('');
}

/** Layout key -> the four spells' elements in cast order (35 rows: every multiset of four discs). */
const CAST_ORDER: Readonly<Record<string, string>> = {
  FFFF: 'FFFF', IIII: 'IIII', WWWW: 'WWWW', TTTT: 'TTTT',
  FFFI: 'FFFI', FFFW: 'FFFW', FFFT: 'FFFT',
  FIII: 'IIIF', IIIW: 'IIIW', IIIT: 'IIIT',
  FWWW: 'WWWF', IWWW: 'WWWI', WWWT: 'WWWT',
  FTTT: 'TTTF', ITTT: 'TTTI', WTTT: 'TTTW',
  FFII: 'FFII', FFWW: 'FFWW', FFTT: 'FFTT', IIWW: 'IIWW', IITT: 'IITT', WWTT: 'WWTT',
  FFIW: 'FFIW', FFIT: 'FFIT', FFWT: 'FFWT',
  FIIW: 'IIFW', FIIT: 'IIFT', IIWT: 'IIWT',
  FITT: 'TTIF', FWTT: 'TTWF', IWTT: 'TTIW',
  FIWW: 'WWIF', FWWT: 'WWFT', IWWT: 'WWIT',
  FIWT: 'FIWT',
};

/** The four spells' elements in the order he casts them. */
export function omnisCastOrder(discs: readonly Element4[]): Element4[] {
  const row = CAST_ORDER[layoutKey(discs)];
  if (row === undefined) return [];
  return [...row].map((letter) => ELEMENT_OF[letter] as Element4);
}

/** True for a layout with three or four of a kind: his first three spells then go to Character 1, 2 and 3. */
export function aimsAtSlots(discs: readonly Element4[]): boolean {
  return Math.max(...Object.values(countDiscs(discs))) >= 3;
}
