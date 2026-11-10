/**
 * The beat plans of a Special dress-up, as data in milliseconds, plus the pure functions that scale them (FFX-2 only: the three Special dresspheres exist only in
 * FFX-2; pure, no port, no DOM, no clock, and nothing plays a plan while the switch `specialDressUp` is OFF).
 *
 * A plan is a list of steps on the presenter's timeline from the confirm. The presenter (step C2) walks it; the HUD list, the Wait chip and the effects layer are asked
 * for at the step that names them. Times follow the measured readings of the game's own frames (`research/re-ffx2-special-look-game-reading.md`, "GR L<n>"): the middle
 * from "she is alone" to the cut to the field is 16 s (Yuna), 20 s (Rikku) and 17 s (Paine); the preamble before it is one constant per girl. The splits inside one
 * reading, the preambles, the reduce-motion scale and the fall splits are our own table values, marked `[ours]` below and in the handoff.
 *
 * **The rows swap to the parts and the chip returns at the `cut` step, never at a flash** (the frames keep one row and Wait Mode through the reveal). The short plan has
 * no `chip` field: the tag stays as it was. Camera names are plan labels; the presenter maps them to its existing rigs (no rig is added here).
 */

import type { SpecialId } from '../battle/ffx2/special/forms.ts';
import { specialSeenId } from './SpecialFormTracker.ts';

export type PlanKind = 'full' | 'short' | 'exit' | 'fall';
export type Girl = 'yuna' | 'rikku' | 'paine';
/** The held list the HUD draws: the three girls, her row alone, or the three parts. */
export type HudRows = 'girls' | 'one' | 'parts';

/** The closed list of what a plan asks the effects layer to draw. The presenter forwards each to `VfxPort.special?` (a no-op while that member is absent); idle life (falling petals, orbiting swords) is not a plan step. */
export const EFFECT_IDS = [
  'light-column', 'silhouette', 'silhouette-out', 'pink-ring', 'ray-burst', 'dim', 'Y1', 'Y2', 'Y3', 'petals', 'R1', 'R2', 'R3', 'blue-disc',
  'P1', 'swords', 'disc-halo', 'cloud-bubble-sky', 'P2', 'P3', 'feather-burst',
] as const;
export type EffectId = (typeof EFFECT_IDS)[number];

export interface PlanStep {
  readonly id: string;
  /** From the confirm, in plan milliseconds. A step with `atMs === endMs` is a mark. */
  readonly atMs: number;
  readonly endMs: number;
  /** The held list the HUD draws from this step on. */
  readonly rows?: HudRows;
  /** The Wait/Active chip from this step on: `'wait'` shows it at Wait; `'config'` sets it back to the Config's mode. */
  readonly chip?: 'wait' | 'config';
  readonly camera?: 'wide' | 'low-close' | 'rise' | 'orbit' | 'pull-back' | 'low-form';
  readonly pieces?: readonly EffectId[];
  readonly flash?: boolean;
}

export interface BeatPlan {
  readonly kind: PlanKind;
  readonly girl: Girl | null;
  readonly steps: readonly PlanStep[];
  readonly totalMs: number;
  /** When her row alone replaces the three (full plan only). */
  readonly oneRowMs: number | null;
  /** The moment the HUD swaps to the parts (full and short plans only). */
  readonly cutMs: number | null;
}

/** Confirm to "she is alone": one constant per girl, `[ours]` (GR L38 to L39: Yuna's 6.0 s is the low end of the HD clip's 6 to 8 s; Rikku's is her 3 s; Paine's reading is 2 s but the flourish and the portrait need about 2.5). */
export const PREAMBLE_MS: Readonly<Record<Girl, number>> = { yuna: 6000, rikku: 3000, paine: 3000 };
/** "She is alone" to the cut to the field, measured on the frames (`[frame]`). */
export const MIDDLE_MS: Readonly<Record<Girl, number>> = { yuna: 16000, rikku: 20000, paine: 17000 };
/** When the HUD shows her row alone: 4 s for Yuna, 3 s for Rikku and Paine (`[frame]`, GR L38). */
export const ONE_ROW_MS: Readonly<Record<Girl, number>> = { yuna: 4000, rikku: 3000, paine: 3000 };
/** What "collapse under reduce motion" keeps: a quarter of the time, no camera, no pieces, no flash; the HUD swaps and the chip keep their order. `[ours]`, a table value. */
export const REDUCE_MOTION_SCALE = 0.25;
/** The other two girls fade over this long (the summon's `PARTY_SWAP_MS`; `tests/unit/special-beat-plans.test.ts` asserts they are equal). */
export const FADE_OTHERS_MS = 620;
/** The figure squashes to this fraction of its height in the fall's grey stretch. `[ours]` (preflight D-21). */
export const FALL_SQUASH = 0.8;

const CONFIRM_MS = 600;
const PORTRAIT_FULL_END_MS = 1300; // the flourish, then the slab's entrance, the 450 ms hold and its exit: the nominal end; the real end is the slab's own promise
const PORTRAIT_SHORT_END_MS = 1000; // the quick 110 ms hold
const FADE_OTHERS_AT_MS = 2000; // `[ours]`: the frames still show all three girls at 1 to 2 s
const SHORT_MS = 3000;
const EXIT_MS = 4500;

type Extra = Partial<Omit<PlanStep, 'id' | 'atMs' | 'endMs'>>;
const step = (id: string, atMs: number, endMs: number, extra: Extra = {}): PlanStep => ({ id, atMs, endMs, ...extra });

/** The girl's own steps, from "she is alone" to the reveal's end (GR L44 to L48; the splits inside one reading are `[ours]`). */
function ownSteps(girl: Girl): PlanStep[] {
  if (girl === 'yuna') {
    return [
      step('alone', 6000, 8000, { camera: 'low-close', pieces: ['silhouette', 'pink-ring'], flash: true }),
      step('bud', 8000, 10000, { pieces: ['Y1'] }),
      step('rise', 10000, 12000, { pieces: ['silhouette'] }),
      step('burst', 12000, 14000, { pieces: ['ray-burst', 'Y2'] }),
      step('open', 14000, 16000, { pieces: ['Y2'] }),
      step('bloom', 16000, 20000, { pieces: ['Y2', 'Y3', 'petals'] }),
      step('reveal', 20000, 22000, { camera: 'low-close', pieces: ['silhouette-out'] }),
    ];
  }
  if (girl === 'rikku') {
    return [
      step('alone', 3000, 5000, { camera: 'low-close', pieces: ['silhouette', 'R1', 'dim'], flash: true }),
      step('shards', 5000, 9000, { pieces: ['R1', 'dim'] }),
      step('flash-1', 9000, 10000, { flash: true }),
      step('pool', 10000, 15000, { pieces: ['blue-disc', 'R1'] }),
      step('flash-2', 15000, 16000, { flash: true }),
      step('assemble-above', 16000, 18500, { camera: 'rise', pieces: ['R2'] }),
      step('assemble', 18500, 21000, { camera: 'rise', pieces: ['R3'] }),
      step('reveal', 21000, 23000, { camera: 'orbit', pieces: ['silhouette-out'] }),
    ];
  }
  return [
    step('alone', 3000, 4000, { camera: 'low-close', pieces: ['silhouette'], flash: true }),
    step('turn', 4000, 5000, { pieces: ['silhouette'] }),
    step('swords', 5000, 7000, { pieces: ['P1', 'swords', 'disc-halo'] }),
    step('rise', 7000, 14000, { camera: 'rise', pieces: ['cloud-bubble-sky'] }),
    step('wing-tips', 14000, 15000, { pieces: ['P2'] }),
    step('feathers', 15000, 17000, { pieces: ['P3'] }),
    step('armour-close', 17000, 18000),
    step('burst', 18000, 19000, { camera: 'pull-back', pieces: ['feather-burst'], flash: true }),
    step('reveal', 19000, 20000, { camera: 'low-form', pieces: ['silhouette-out'] }),
  ];
}

const byTime = (a: PlanStep, b: PlanStep): number => a.atMs - b.atMs;

/** The first-time plan: flourish, portrait, the field with time halted and the light column, her row alone, her own sequence, the reveal, the cut. 22000 (Yuna), 23000 (Rikku), 20000 (Paine) ms. */
export function fullPlan(girl: Girl): BeatPlan {
  const preamble = PREAMBLE_MS[girl];
  const oneRow = ONE_ROW_MS[girl];
  const totalMs = preamble + MIDDLE_MS[girl];
  const steps = [
    step('confirm', 0, CONFIRM_MS, { rows: 'girls' }),
    step('portrait', CONFIRM_MS, PORTRAIT_FULL_END_MS),
    step('field', PORTRAIT_FULL_END_MS, oneRow, { chip: 'wait', camera: 'wide', pieces: ['light-column'] }),
    step('fade-others', FADE_OTHERS_AT_MS, FADE_OTHERS_AT_MS + FADE_OTHERS_MS),
    step('one-row', oneRow, preamble, { rows: 'one' }),
    ...ownSteps(girl),
    step('cut', totalMs, totalMs, { rows: 'parts', chip: 'config', camera: 'wide' }),
  ].sort(byTime);
  return { kind: 'full', girl, steps, totalMs, oneRowMs: oneRow, cutMs: totalMs };
}

/** The later-times plan, about 3 s: the ordinary short change plus one motif still. No one-row step and no `chip` field (the tag stays as it was); the rows swap at the cut. `[ours]` in its pieces. */
export function shortPlan(girl: Girl): BeatPlan {
  const motif: EffectId = girl === 'yuna' ? 'Y3' : girl === 'rikku' ? 'R3' : 'P3';
  const steps = [
    step('confirm', 0, CONFIRM_MS, { rows: 'girls' }),
    step('portrait', CONFIRM_MS, PORTRAIT_SHORT_END_MS),
    step('fade-others', PORTRAIT_SHORT_END_MS, 1600, { pieces: ['silhouette'] }),
    step('motif', 1600, 2400, { pieces: [motif], flash: true }),
    step('cut', 2400, SHORT_MS, { rows: 'parts', camera: 'wide' }),
  ];
  return { kind: 'short', girl, steps, totalMs: SHORT_MS, oneRowMs: null, cutMs: 2400 };
}

/** The form ends by choice, 4500 ms and never shortened by the Config (GR L102): chip to Wait, the numbers, whiten, dissolve (green-white, 0x9dffc4), her old dress stands, the others return, the girls' rows, the chip back. */
export function exitPlan(): BeatPlan {
  const steps = [
    step('hold', 0, 500, { rows: 'parts', chip: 'wait' }),
    step('numbers', 500, 500), // the main's row takes the old dress's pools: one full sync
    step('whiten', 500, 1500, { flash: true }), // the flash ramps while the turn ring flares
    step('dissolve', 1500, 2000),
    step('girl-stands', 2000, 3500), // her old-dress painting where the figure stood: nothing moves
    step('others-back', 3500, 3500 + FADE_OTHERS_MS),
    step('girls', 4000, 4000, { rows: 'girls' }),
    step('control', EXIT_MS, EXIT_MS, { chip: 'config' }),
  ];
  return { kind: 'exit', girl: null, steps, totalMs: EXIT_MS, oneRowMs: null, cutMs: null };
}

/**
 * The main body falls for good inside the form (GR L98): the existing hit beat on the standing figure, the tag flips to Wait and the main's row takes the old dress's pools, the grey
 * grade with a squash to {@link FALL_SQUASH}, the dissolve, the old-dress girl lying where the figure stood. The 2000 lead-in and the 0.8 squash are `[ours]`; the 4000, 6000 and
 * 7500 splits are inferred from the frames (flip, grey, dissolve, girl). The same plan for a fall with a part standing (the engine's pick 8) and with every part down.
 */
export function fallPlan(_allPartsDown: boolean): BeatPlan {
  const steps = [
    step('lead-in', 0, 2000),
    step('tag-wait', 2000, 2000, { chip: 'wait' }),
    step('numbers', 2000, 2000),
    step('grey-squash', 2000, 4000),
    step('dissolve', 4000, 6000),
    step('girl-lies', 6000, 7500),
  ];
  return { kind: 'fall', girl: null, steps, totalMs: 7500, oneRowMs: null, cutMs: null };
}

const times = (s: PlanStep, k: number): PlanStep => ({ ...s, atMs: Math.round(s.atMs * k), endMs: Math.round(s.endMs * k) });

/** Every time of the plan times `k`, rounded: `k` is the speed scale (fast 0.32, skip 0). At 0 every time is 0 and no portrait plays. */
export function scalePlan(p: BeatPlan, k: number): BeatPlan {
  return {
    ...p,
    steps: p.steps.map((s) => times(s, k)),
    totalMs: Math.round(p.totalMs * k),
    oneRowMs: p.oneRowMs === null ? null : Math.round(p.oneRowMs * k),
    cutMs: p.cutMs === null ? null : Math.round(p.cutMs * k),
  };
}

/** The plan under reduce motion: a quarter of the time, every camera, piece and flash removed; the rows and chip steps keep their order. */
export function reducedPlan(p: BeatPlan): BeatPlan {
  const scaled = scalePlan(p, REDUCE_MOTION_SCALE);
  return {
    ...scaled,
    steps: scaled.steps.map((s) => {
      const { camera: _camera, pieces: _pieces, flash: _flash, ...kept } = s;
      return kept;
    }),
  };
}

/** The first-time rule, a switch: `'per-save'` is the game's (full the first time a girl enters her Special, short after), `'short-always'` plays the short change every time. */
export type HoldPolicy = 'per-save' | 'short-always';

/** Which entry plays. An absent port or an id not seen is `'full'` (the safe side). The press-and-hold skip is a new control and stays unbuilt. */
export function entryKind(seen: { has(id: string): boolean } | null | undefined, girl: Girl, special: SpecialId, hold: HoldPolicy = 'per-save'): 'full' | 'short' {
  if (hold === 'short-always') return 'short';
  return seen?.has(specialSeenId(girl, special)) === true ? 'short' : 'full';
}
