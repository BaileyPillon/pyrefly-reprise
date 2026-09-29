/**
 * **The Sin HUD, what it says** (Chapters XVII and XVIII): the link 4 clock
 * (package M's M1-A, the mouth ring) and the Fins' range and charge plate (M4-B),
 * read off the engine's published `state.flags` alone.
 *
 * Pure and DOM-free, so the widget (`SinHud.ts`) only paints and the tests can
 * pin every word without a browser. **Game case: FFX only** [AGENTS.md rule 14;
 * research/ffx-sin.md §0.3]: CTB, the airship's range and Cid's orders are FFX.
 *
 * Both views are `null` in every battle whose state lacks the flags, so the
 * widget stays hidden in every other chapter:
 *
 * - the clock needs `sin.turn` (set only by `applyOverdriveSinSetup`, the same
 *   marker `isOverdriveSinBattle` reads);
 * - the plate needs `airship.range` **and** a living Left or Right Fin on the
 *   field (Evrae also publishes the range, but has no Fin).
 *
 * The picks are the driver's under D-279 (Bailey delegated them for the night),
 * from `docs/concepts/chapters/sin-2026-09-27/hud/README.md`; they are not
 * Bailey's words.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { AIRSHIP_RANGE } from '../../battle/ffx/ai/evrae-rules.ts';
import {
  AIRSHIP_COUNTS_TARGETINGS,
  GAZE_THRESHOLD,
  GIGA_GRAVITON_TURN,
  GIGA_GRAVITON_TURN_GESTAHL,
  PULL_TURNS,
  SIN_GAZE,
  SIN_LAST_TURN,
  SIN_MOUTH,
  SIN_TURN,
  SIN_TURNS_LEFT,
} from '../../battle/ffx/ai/overdrive-sin-rules.ts';
import { SIN_FIN_CHARGED, SIN_FIN_IDS } from '../../battle/ffx/ai/sin-ids.ts';
import { isAlive } from '../../battle/ffx/predicates.ts';

/**
 * **S-1 is open** (12 or 13; only a check in the Steam HD Remaster settles it,
 * D-266). While it is, the clock carries the estimate line. One switch, turned
 * off when the check lands.
 */
export const S1_OPEN = true;

export type SinSegmentKind = 'pull' | 'window' | 'last';

export interface SinClockSegment {
  /** 1-based: Sin's turn this segment stands for. */
  index: number;
  /** Pulls ivory, the melee window gold, the last one alarm red (M1-A). */
  kind: SinSegmentKind;
  /** `index <= sin.turn`. */
  lit: boolean;
  /** The segment for the turn Sin just took (the white outline). */
  now: boolean;
}

export interface SinClockView {
  /** N: the turn Giga-Graviton comes on (`sin.gigaGravitonTurn`, S-1). */
  total: number;
  /** Sin's turns taken (`sin.turn`). */
  turn: number;
  /** `sin.turnsLeft`. */
  left: number;
  /** `sin.mouthStage`: 0 pulls, 1 to 3 opening, 4 fully open. */
  stage: number;
  segments: SinClockSegment[];
  /** The last segment pulses, from one turn left. */
  alarm: boolean;
  /** The desk chip ("Mouth open 2 of 3"); the CSS sets it in capitals. */
  stageWord: string;
  /** The phone chip ("Open 2 of 3"). */
  stageWordShort: string;
  /** The Gaze pill: party targetings toward the threshold (M1, held constant). */
  gaze: { count: number; threshold: number; left: number };
  /** The S-1 line, desk and phone; `null` once S-1 is settled. */
  estimate: { desk: string; phone: string } | null;
}

export interface SinFinPlateView {
  finId: CombatantId;
  /** The Fin's own name ("Left Fin"). */
  name: string;
  range: 'near' | 'far';
  /** `sin.fin.charged`: "Core gathers energy." has sounded and Gravija is next. */
  charged: boolean;
  /** Under the name: the red charge bar, the quiet FAR line, or nothing (NEAR, uncharged). */
  line: 'charged' | 'far' | null;
}

/** The plate's words (M4-B), desk and phone. */
export const FIN_CHARGED_TEXT = 'Core charged · Gravija on its next turn';
export const FIN_CHARGED_TEXT_PHONE = 'Core charged · Gravija next';
/** research §5.1.2 (three sources): the core does not charge while the ship is FAR. */
export const FIN_FAR_TEXT = 'The core does not charge at range';

function num(flags: Readonly<Record<string, unknown>>, key: string): number | null {
  const v = flags[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function ordinal(n: number): string {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`;
}

function stageWords(stage: number): { desk: string; short: string } {
  if (stage <= 0) return { desk: 'Mouth shut', short: 'Shut' };
  if (stage >= 4) return { desk: 'Mouth fully open', short: 'Fully open' };
  return { desk: `Mouth open ${stage} of 3`, short: `Open ${stage} of 3` };
}

/** The segment kinds for a clock of `total` turns: 3 pulls, (N - 4) melee, 1 last. */
export function segmentKind(index: number, total: number): SinSegmentKind {
  if (index >= total) return 'last';
  return index <= PULL_TURNS ? 'pull' : 'window';
}

/** The link 4 clock, or `null` outside Overdrive Sin's battle. */
export function sinClockView(state: Readonly<BattleState> | null): SinClockView | null {
  if (!state || state.result) return null;
  const flags = state.flags as Readonly<Record<string, unknown>>;
  const turn = num(flags, SIN_TURN);
  if (turn === null) return null;
  const total = Math.max(PULL_TURNS + 2, Math.round(num(flags, SIN_LAST_TURN) ?? GIGA_GRAVITON_TURN));
  const left = Math.max(0, num(flags, SIN_TURNS_LEFT) ?? total - turn);
  const stage = Math.max(0, Math.min(4, num(flags, SIN_MOUTH) ?? 0));
  const segments: SinClockSegment[] = [];
  for (let i = 1; i <= total; i++) segments.push({ index: i, kind: segmentKind(i, total), lit: i <= turn, now: i === turn });
  const count = Math.max(0, Math.min(GAZE_THRESHOLD, num(flags, SIN_GAZE) ?? 0));
  const words = stageWords(stage);
  const open = S1_OPEN && (total === GIGA_GRAVITON_TURN || total === GIGA_GRAVITON_TURN_GESTAHL);
  return {
    total,
    turn,
    left,
    stage,
    segments,
    alarm: left <= 1,
    stageWord: words.desk,
    stageWordShort: words.short,
    gaze: { count, threshold: GAZE_THRESHOLD, left: GAZE_THRESHOLD - count },
    estimate: open
      ? {
          desk: `Giga-Graviton on Sin's ${ordinal(total)} turn: our estimate (the sources say ${GIGA_GRAVITON_TURN_GESTAHL} or ${GIGA_GRAVITON_TURN})`,
          phone: `${ordinal(total)} turn: our estimate (${GIGA_GRAVITON_TURN_GESTAHL} or ${GIGA_GRAVITON_TURN})`,
        }
      : null,
  };
}

/**
 * The Fin the plate names: the counted foe (`airship.countsTargetings`) when it
 * is a living Fin, otherwise the first living Fin in formation order.
 */
function finOf(state: Readonly<BattleState>): CombatantId | null {
  const counted = state.flags[AIRSHIP_COUNTS_TARGETINGS];
  const living = (id: unknown): id is CombatantId => {
    if (typeof id !== 'string' || !SIN_FIN_IDS.includes(id)) return false;
    const c = state.combatants[id];
    return !!c && c.side === 'enemy' && isAlive(c);
  };
  if (living(counted)) return counted;
  return state.enemyIds.find((id) => living(id)) ?? null;
}

/** The Fins' range and charge plate (links I and II), or `null` in every other battle. */
export function sinFinPlateView(state: Readonly<BattleState> | null): SinFinPlateView | null {
  if (!state || state.result) return null;
  const range = state.flags[AIRSHIP_RANGE];
  if (range !== 'near' && range !== 'far') return null;
  const finId = finOf(state);
  if (!finId) return null;
  const charged = state.flags[SIN_FIN_CHARGED] === true;
  return {
    finId,
    name: state.combatants[finId]?.name ?? finId,
    range,
    charged,
    line: charged ? 'charged' : range === 'far' ? 'far' : null,
  };
}
