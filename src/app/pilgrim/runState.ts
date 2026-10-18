/**
 * **The Pilgrimage's run, as a state machine** (prototype, FFX only; Bailey, 2026-10-18, decision 122).
 *
 * ```
 *   fight --win, not the finale--> boons (1 pick, 2 after the Elite) --> road (pick the next stop) --> fight
 *   fight --win at the finale-----> over (won)
 *   fight --loss-----------------> over (lost)        any phase --leave--> over (left)
 * ```
 *
 * Pure and immutable: every function takes a state and returns the next one (an illegal call returns the state it was given), so a run replays from its seed and the tests drive it with no screen.
 * Time comes in as an argument. **Nothing here touches the save**: a run lives in memory, and what it leaves behind (the best run) is written by `./runStore.ts` to its own key, never `SaveData`.
 *
 * The boons a pick takes sit in `pack` until the fight they are for ends; then they move to `used` and the pack is empty again, so **a boon lasts one fight** and nothing carries over.
 *
 * Game case: FFX only for this prototype (the road is FFX's); the machine itself is game-neutral.
 */

import { drawOffers, type BoonId } from './boons.ts';
import { FIRST_STOP, ROUTE_LENGTH, isFinale, stopById, stopsAt, type RouteStop, type StopId } from './route.ts';

export type RunEnd = 'won' | 'lost' | 'left';
export type RunPhase = 'fight' | 'boons' | 'road' | 'over';

export interface RunState {
  readonly seed: number;
  readonly phase: RunPhase;
  /** The stops walked so far, in order; the last one is the fight in front of the player (or the one just fought). */
  readonly road: readonly StopId[];
  /** Fights won. */
  readonly won: number;
  /** The boons taken for the fight that is next or under way. */
  readonly pack: readonly BoonId[];
  /** The boons taken into fights that are over (every one was used for one fight and is gone). */
  readonly used: readonly BoonId[];
  /** Picks still owed after the last win. */
  readonly owed: number;
  /** Picks made over the whole run: the draw's index. */
  readonly picks: number;
  /** The three on the table while `phase` is `boons`. */
  readonly offers: readonly BoonId[];
  readonly end: RunEnd | null;
  readonly startedAt: number;
  readonly endedAt: number | null;
}

/** A new run: the road starts on its first stop and the first fight is next (no boon for it). */
export function newRun(seed: number, now: number): RunState {
  return { seed, phase: 'fight', road: [FIRST_STOP.id], won: 0, pack: [], used: [], owed: 0, picks: 0, offers: [], end: null, startedAt: now, endedAt: null };
}

/** The stop in front of the player (or the one the run ended on). */
export function currentStop(run: RunState): RouteStop {
  return stopById(run.road[run.road.length - 1]!);
}

/** The fight number the run is on, 1-based: how many stops it has walked. */
export function reached(run: RunState): number {
  return run.road.length;
}

/** The stops the player may take next: the next tier's row, while the road is being chosen. */
export function nextOptions(run: RunState): readonly RouteStop[] {
  return run.phase === 'road' ? stopsAt(run.road.length) : [];
}

/** The fight is over and the player won it: pay the boons, or end the run on the finale. */
function win(run: RunState, now: number): RunState {
  const used = [...run.used, ...run.pack];
  const won = run.won + 1;
  if (isFinale(currentStop(run).id)) return { ...run, phase: 'over', won, pack: [], used, owed: 0, offers: [], end: 'won', endedAt: now };
  const owed = currentStop(run).pays;
  if (owed <= 0) return { ...run, phase: 'road', won, pack: [], used, owed: 0, offers: [] };
  return { ...run, phase: 'boons', won, pack: [], used, owed, offers: drawOffers(run.seed, run.picks, []) };
}

/** How a fight ended. `left`: the player walked away from it. */
export type FightEnd = 'victory' | 'defeat' | 'left';

/** The fight in front of the player is over. */
export function finishFight(run: RunState, how: FightEnd, now: number): RunState {
  if (run.phase !== 'fight') return run;
  if (how === 'victory') return win(run, now);
  return { ...run, phase: 'over', pack: [], used: [...run.used, ...run.pack], owed: 0, offers: [], end: how === 'defeat' ? 'lost' : 'left', endedAt: now };
}

/** Take the `index`th of the three on the table. */
export function pickBoon(run: RunState, index: number): RunState {
  const taken = run.offers[index];
  if (run.phase !== 'boons' || taken === undefined) return run;
  const pack = [...run.pack, taken];
  const owed = run.owed - 1;
  const picks = run.picks + 1;
  if (owed > 0) return { ...run, pack, owed, picks, offers: drawOffers(run.seed, picks, pack) };
  return { ...run, phase: 'road', pack, owed: 0, picks, offers: [] };
}

/** Walk to `next`, one of the next tier's stops. */
export function chooseRoad(run: RunState, next: StopId): RunState {
  if (run.phase !== 'road' || !stopsAt(run.road.length).some((s) => s.id === next)) return run;
  return { ...run, phase: 'fight', road: [...run.road, next] };
}

/** The player left the run (the pause menu's exits, a restart): it ends where it stands. */
export function leaveRun(run: RunState, now: number): RunState {
  if (run.phase === 'over') return run;
  return { ...run, phase: 'over', used: [...run.used, ...run.pack], pack: [], owed: 0, offers: [], end: 'left', endedAt: now };
}

/** Wall-clock time of the run so far, or all of it once it is over. */
export function elapsedMs(run: RunState, now: number): number {
  return Math.max(0, (run.endedAt ?? now) - run.startedAt);
}

/** What the run-over screen and the store keep of a run. */
export interface RunSummary {
  /** Fights won. */
  readonly won: number;
  /** The fight the run ended on (or is on), 1-based. */
  readonly reached: number;
  readonly total: number;
  readonly cleared: boolean;
  readonly end: RunEnd | null;
  readonly timeMs: number;
  /** Boons taken into finished fights. */
  readonly boonsUsed: number;
  readonly boons: readonly BoonId[];
  /** The stops walked, in order. */
  readonly road: readonly StopId[];
}

export function summarize(run: RunState, now: number): RunSummary {
  return {
    won: run.won,
    reached: reached(run),
    total: ROUTE_LENGTH,
    cleared: run.end === 'won',
    end: run.end,
    timeMs: elapsedMs(run, now),
    boonsUsed: run.used.length,
    boons: run.used,
    road: run.road,
  };
}

/** A kept run: the summary and when it ended. */
export interface BestRun {
  readonly won: number;
  readonly reached: number;
  readonly cleared: boolean;
  readonly timeMs: number;
  readonly boonsUsed: number;
  readonly finishedAt: number;
}

/** True when `candidate` beats `best`: more fights won, or the same fights won, both cleared, and faster. */
export function isBetterRun(candidate: Pick<BestRun, 'won' | 'cleared' | 'timeMs'>, best: Pick<BestRun, 'won' | 'cleared' | 'timeMs'> | null): boolean {
  if (best === null) return true;
  if (candidate.won !== best.won) return candidate.won > best.won;
  return candidate.cleared && best.cleared && candidate.timeMs < best.timeMs;
}
