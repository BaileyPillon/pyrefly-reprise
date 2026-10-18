/**
 * **The boon pool and its draw** (Pilgrimage prototype, FFX only; Bailey, 2026-10-18, decision 122).
 *
 * After each win the player takes one of three boons (two after the Elite) for the NEXT fight only. A boon is one of:
 *
 * - **an item** the game itself has (`src/data/ffx/items/*`, research/ffx-combat-core.md section 8): the engine already knows what it does, so a boon only puts it in the pack;
 * - **an auto-ability** the game itself has (`AutoAbilityId`, ffx-combat-core section 9): worn by one ally for the fight, the way an accessory would be (a loan, gone when the fight ends);
 * - **NEW, ours**: "Overdrive charged", an ally starts the fight with a full gauge. No FFX item does this, so the card says NEW.
 *
 * **Never invent game data (AGENTS.md rule 6).** Every row names its source. What is ours is the choice of which ones are offered, the counts of an item that one pick adds and who is
 * preferred as the wearer; the cards and the RUN panel say so (`ours`). **No boss number and no engine rule is touched**: a run is never harder than the chapter is today (the worst case, no
 * boon, is the live fight), and `./applyBoons.ts` uses only inputs the engine already takes (inventory rows, a worn auto-ability, a starting gauge).
 *
 * The draw is seeded and pure: the same run seed and pick number offer the same three, so a run replays and the tests can pin it.
 *
 * Game case: FFX only (FFX's items and its auto-abilities; FFX-2 has neither as these are).
 */

import type { AutoAbilityId } from '../../battle/common/types.ts';

/** A boon's id. */
export type BoonId =
  | 'light-curtain' | 'lunar-curtain' | 'star-curtain' | 'healing-spring' | 'stamina-tablet' | 'mega-phoenix'
  | 'auto-haste' | 'auto-regen' | 'auto-phoenix'
  | 'overdrive-charged';

/** What a boon does to the next fight's setup. */
export type BoonEffect =
  | { readonly kind: 'item'; readonly itemId: string; readonly count: number }
  | { readonly kind: 'auto-ability'; readonly ability: AutoAbilityId; readonly prefer: readonly string[] }
  | { readonly kind: 'overdrive'; readonly prefer: readonly string[] };

/** One row of the pool. */
export interface BoonDef {
  readonly id: BoonId;
  readonly name: string;
  /** The card's kind line. */
  readonly kind: 'ITEM' | 'ARMOUR' | 'NEW';
  /** What it does, in plain words. */
  readonly fx: string;
  /** Where it comes from: the repo file and the research section, or NEW. */
  readonly src: string;
  readonly effect: BoonEffect;
  /** True for a row the game does not have (the card wears a NEW tag). */
  readonly isNew: boolean;
}

const ITEM_SRC = (file: string): string => `FFX item (src/data/ffx/items/${file}.ts, combat-core 8.2). Count ours.`;
const ABILITY_SRC = 'FFX auto-ability (combat-core 9). A one-fight loan, wearer ours.';

/** The pool: ten boons, each a real FFX item or auto-ability, or plainly NEW. */
export const BOON_POOL: readonly BoonDef[] = [
  { id: 'light-curtain', name: 'Light Curtain ×2', kind: 'ITEM', fx: 'Two Light Curtains in your pack: Protect to one ally, twice, in the next fight only.', src: ITEM_SRC('cures-utility-2'), effect: { kind: 'item', itemId: 'light-curtain', count: 2 }, isNew: false },
  { id: 'lunar-curtain', name: 'Lunar Curtain ×2', kind: 'ITEM', fx: 'Two Lunar Curtains in your pack: Shell to one ally, twice, in the next fight only.', src: ITEM_SRC('cures-utility-2'), effect: { kind: 'item', itemId: 'lunar-curtain', count: 2 }, isNew: false },
  { id: 'star-curtain', name: 'Star Curtain ×2', kind: 'ITEM', fx: 'Two Star Curtains in your pack: Reflect to one ally, twice, in the next fight only.', src: ITEM_SRC('cures-utility-2'), effect: { kind: 'item', itemId: 'star-curtain', count: 2 }, isNew: false },
  { id: 'healing-spring', name: 'Healing Spring ×2', kind: 'ITEM', fx: 'Two Healing Springs in your pack: Regen to one ally, twice, in the next fight only.', src: ITEM_SRC('cures-utility-2'), effect: { kind: 'item', itemId: 'healing-spring', count: 2 }, isNew: false },
  { id: 'stamina-tablet', name: 'Stamina Tablet', kind: 'ITEM', fx: "One Stamina Tablet in your pack: doubles one ally's maximum HP for the next fight.", src: ITEM_SRC('cures-utility-2'), effect: { kind: 'item', itemId: 'stamina-tablet', count: 1 }, isNew: false },
  { id: 'mega-phoenix', name: 'Mega Phoenix', kind: 'ITEM', fx: 'One Mega Phoenix in your pack: revives every fallen ally at full HP, once, in the next fight only.', src: ITEM_SRC('restoratives-2'), effect: { kind: 'item', itemId: 'mega-phoenix', count: 1 }, isNew: false },
  { id: 'auto-haste', name: 'Auto-Haste', kind: 'ARMOUR', fx: 'Permanent Haste for the wearer, who is also immune to Slow, for the next fight.', src: ABILITY_SRC, effect: { kind: 'auto-ability', ability: 'auto-haste', prefer: ['tidus', 'rikku', 'wakka', 'auron'] }, isNew: false },
  { id: 'auto-regen', name: 'Auto-Regen', kind: 'ARMOUR', fx: 'Infinite Regen for the wearer, and it cannot be dispelled, for the next fight.', src: ABILITY_SRC, effect: { kind: 'auto-ability', ability: 'auto-regen', prefer: ['kimahri', 'tidus', 'auron', 'yuna'] }, isNew: false },
  { id: 'auto-phoenix', name: 'Auto-Phoenix', kind: 'ARMOUR', fx: 'The wearer uses a Phoenix Down on a fallen ally by themselves, for the next fight.', src: ABILITY_SRC, effect: { kind: 'auto-ability', ability: 'auto-phoenix', prefer: ['auron', 'tidus', 'kimahri', 'yuna'] }, isNew: false },
  { id: 'overdrive-charged', name: 'Overdrive charged', kind: 'NEW', fx: 'One ally starts the next fight with a full Overdrive gauge.', src: 'NEW, ours: no FFX item does this. The gauge is the engine\'s own starting value.', effect: { kind: 'overdrive', prefer: ['wakka', 'auron', 'tidus', 'yuna'] }, isNew: true },
];

const BY_ID: ReadonlyMap<BoonId, BoonDef> = new Map(BOON_POOL.map((b) => [b.id, b]));

/** A boon by id. */
export function boonById(id: BoonId): BoonDef {
  const boon = BY_ID.get(id);
  if (!boon) throw new Error(`pilgrimage: no boon "${id}"`);
  return boon;
}

/** True when `id` names a boon of the pool (a stored or typed value is never trusted). */
export function isBoonId(id: unknown): id is BoonId {
  return typeof id === 'string' && BY_ID.has(id as BoonId);
}

/** How many boons one pick offers. */
export const OFFER_SIZE = 3;

/** A small seeded generator (mulberry32): deterministic, no dependency, never `Math.random`. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The three boons offered at pick number `pickNo` (0-based, counted over the whole run) of the run seeded `seed`: three distinct rows of the pool, none of them in `exclude` (what this fight's
 * pack already holds, so two picks for one fight never name the same boon). The same arguments always give the same three, in the same order.
 */
export function drawOffers(seed: number, pickNo: number, exclude: readonly BoonId[] = []): readonly BoonId[] {
  const rng = seededRandom((seed ^ Math.imul(pickNo + 1, 0x9e3779b1)) >>> 0);
  const rows = BOON_POOL.map((b) => b.id).filter((id) => !exclude.includes(id));
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rows[i], rows[j]] = [rows[j]!, rows[i]!];
  }
  return rows.slice(0, OFFER_SIZE);
}
