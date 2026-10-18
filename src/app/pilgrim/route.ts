/**
 * **The Pilgrimage's road** (prototype, FFX only; Bailey, 2026-10-18, "Option 2 + B: branching, boons (Recommended)", decision 122).
 *
 * Four stops, built from chapters that already exist, in the order the story ran (the Elite is the one road that steps out of it):
 *
 * ```
 *   stop 1            stop 2              stop 3                     stop 4
 *   Seymour and  -->  Evrae          -->  Seymour Natus        -->   Braska's
 *   Anima (VII)       Yojimbo (IX)        Mirror Aeons (ELITE)       Final Aeon (III)
 * ```
 *
 * Every stop is the chapter exactly as it ships: its own party, its own formation, its own numbers. **Nothing here tunes a boss**; the only thing a run changes is what the player carries into
 * one fight (`./boons.ts`, `./applyBoons.ts`). The Elite is an existing, harder chapter (Chapter XXVII, Mirror Aeons, a fixed party at S.Lv 150 to 180), never a tuned copy; it **pays two boons**
 * for the finale where an ordinary stop pays one. That payout and the shape of the road are ours (the mockup, `b-compare.png`, marks them "ours"), not game data.
 *
 * Pure data and lookups: no DOM, no `three`, no storage.
 *
 * Game case: FFX only (every stop is an FFX chapter; the run plumbing around it, `./runState.ts` and `./PilgrimFlow.ts`, is game-neutral).
 */

import type { ChapterId } from '../../data/encounters.ts';

/** A stop's id on the road (not the chapter's id: a stop is a place on the road, a chapter is what is fought there). */
export type StopId = 'macalania' | 'evrae' | 'yojimbo' | 'natus' | 'mirror' | 'braska';

/** One place on the road. */
export interface RouteStop {
  readonly id: StopId;
  /** The existing chapter fought here. */
  readonly chapter: ChapterId;
  /** The card's title (the chapter's own, short). */
  readonly title: string;
  /** The chapter's number as the board prints it. */
  readonly numeral: string;
  /** An Elite road: harder, and it pays more. */
  readonly elite: boolean;
  /** How many boons a win here pays for the next fight (the finale pays none: the run is over). Ours. */
  readonly pays: number;
  /** The Elite's party is fixed by its chapter (it does not lend the player's): said on the card. */
  readonly fixedParty: boolean;
}

/** The four tiers of the road; a tier with two stops is a fork. */
export const ROUTE: readonly (readonly RouteStop[])[] = [
  [
    { id: 'macalania', chapter: 'seymour-anima-macalania', title: 'Seymour and Anima', numeral: 'VII', elite: false, pays: 1, fixedParty: false },
  ],
  [
    { id: 'evrae', chapter: 'evrae-airship', title: 'Evrae', numeral: 'VIII', elite: false, pays: 1, fixedParty: false },
    { id: 'yojimbo', chapter: 'yojimbo-cavern', title: 'Yojimbo', numeral: 'IX', elite: false, pays: 1, fixedParty: false },
  ],
  [
    { id: 'natus', chapter: 'seymour-natus', title: 'Seymour Natus', numeral: 'X', elite: false, pays: 1, fixedParty: false },
    { id: 'mirror', chapter: 'mirror-aeons', title: 'Mirror Aeons', numeral: 'XXVII', elite: true, pays: 2, fixedParty: true },
  ],
  [
    { id: 'braska', chapter: 'braskas-final-aeon', title: "Braska's Final Aeon", numeral: 'III', elite: false, pays: 0, fixedParty: false },
  ],
];

/** Every stop, in tier order. */
export const STOPS: readonly RouteStop[] = ROUTE.flat();

/** How many stops a run walks (one per tier). */
export const ROUTE_LENGTH = ROUTE.length;

/** The first stop: the road always starts here. */
export const FIRST_STOP: RouteStop = ROUTE[0]![0]!;

/** The chapter the door word settles the board on: the first stop's. Nothing else leads to it from a door (`chapterDoors.ts`). */
export const PILGRIM_FIRST_CHAPTER: ChapterId = FIRST_STOP.chapter;

/** A stop by id. */
export function stopById(id: StopId): RouteStop {
  const stop = STOPS.find((s) => s.id === id);
  if (!stop) throw new Error(`pilgrimage: no stop "${id}"`);
  return stop;
}

/** The tier a stop is on, 0-based. */
export function tierOf(id: StopId): number {
  return ROUTE.findIndex((tier) => tier.some((s) => s.id === id));
}

/** The stops one can walk to from tier `tier` (0-based): that tier's whole row. Empty past the finale. */
export function stopsAt(tier: number): readonly RouteStop[] {
  return ROUTE[tier] ?? [];
}

/** True for the last tier: winning there ends the run. */
export function isFinale(id: StopId): boolean {
  return tierOf(id) === ROUTE_LENGTH - 1;
}
