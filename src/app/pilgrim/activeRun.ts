/**
 * **The fight the Pilgrimage is about to play** (prototype, FFX only): the one fact party prep's RUN tab needs from the run, in memory and nowhere else. `./PilgrimFlow.ts` sets it when the flow derives the fight's chapter
 * and clears it when the fight is over; the tab shows only while it is set, so every other party prep is exactly as it was.
 */

import type { BoonId } from './boons.ts';
import type { RunState } from './runState.ts';

/** What one boon did to the setup, in one line (`./applyBoons.ts`). */
export interface ActiveBoonLine {
  readonly boon: BoonId;
  readonly line: string;
}

export interface ActiveFight {
  readonly run: RunState;
  readonly lines: readonly ActiveBoonLine[];
}

let active: ActiveFight | null = null;

export function setActiveFight(fight: ActiveFight): void {
  active = fight;
}

export function clearActiveFight(): void {
  active = null;
}

/** The fight in front of party prep, or null outside a run. */
export function activeFight(): ActiveFight | null {
  return active;
}
