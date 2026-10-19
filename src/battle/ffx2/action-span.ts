/**
 * **Action time per command** (re-parity lane X2-A, row XA6 slice A; **FFX-2 only**): how many logic steps a command stays EXECUTING, from the
 * command's own class, its actor's body and the animation ratio, instead of one flat estimate for every command. Behind ONE switch,
 * `ACTION_TIME_PER_COMMAND` in `action-time.ts`, **OFF**: with it off nothing here is read and every FFX-2 battle is byte for byte what it was.
 *
 * The maths is the pure kernel `kernel/action-span.ts` (its header lists the stages and the waits); the numbers are `data/ffx2/action-frames.ts`
 * (the game's frame tables, motion macros, command classes and first-hit frames; measured lengths for four effects and one item, labelled estimates for the rest). This module is the
 * adapter: it finds the actor's body (the same motion-set maps the hit reaction uses, `reaction.ts`), the command row's class, the unit's
 * animation ratios, and applies the precedence of the switches.
 *
 * Precedence (most specific first): `Ffx2EngineOptions.actionTimeSeconds` (one engine, a measurement run) always wins; then, with the per-command
 * switch ON, the span (a formation's flat 3 s is superseded, because it was a placeholder for exactly this; `supersedeFormation: false` keeps it, for a
 * measurement); then the formation's flat value; then the global flat estimate. A command that plays nothing (Defend, Escape, a Wait-class command,
 * a refused item) owes 0 under the per-command switch.
 *
 * Not modelled, on purpose (each a later slice or an open question of note FFX2-G11): the global executing flag that freezes the group-2 status clocks
 * during a cast (slice B1); hits that land at their real steps instead of at the command's start (B2); the flinch that replays a cast's start clip (XA9);
 * the blends between clips; the run-up's acceleration and turning; the one-cast-at-a-time release, and with it the wait a cast can spend in the game's manager queue before it
 * begins (measured once, 53 steps, behind a monster's cast: no queue is modelled, so an action starts the step it is chosen and a cast's span is its own length only);
 * per-effect lengths beyond the ones measured.
 */

import type { AbilityDef, Command } from '../common/types.ts';
import { actionTimeSeconds, actionTimeSteps, ACTION_TIME_FLAG, ACTION_TIME_PER_COMMAND } from './action-time.ts';
import type { Ffx2Unit } from './internal.ts';
import { commandCosts } from './adapt/command.ts';
import { ratioOf } from './reaction.ts';
import { actionSpan, SpanKind, spanKindOfClass, type SpanBody } from './kernel/action-span.ts';
import {
  COMMAND_ROW_ACTION,
  EFFECT_STEPS_ENEMY_ESTIMATE,
  EFFECT_STEPS_PARTY_ESTIMATE,
  FALLBACK_GIRL,
  FALLBACK_MONSTER,
  GIRL_ACTION_FRAMES,
  GIRL_HIT_FRAMES,
  GIRL_NO_RUN,
  GIRL_RUN,
  ITEM_EFFECT_STEPS,
  MEASURED_EFFECT_STEPS,
  MONSTER_ACTION_FRAMES,
  MONSTER_HIT_FRAMES,
  MT_CHANT_START_WAIT,
  MT_ENERGY_ATTACK,
  MT_IDLE_WAIT,
  MT_MAGIC_THROW_WAIT,
  MT_RUN_00_01,
  MT_RUN_01,
  RUN_DISTANCE_ESTIMATE,
  type GirlFrames,
  type MonsterFrames,
} from '../../data/ffx2/action-frames.ts';
import { DRESSPHERE_SLOT, GIRL_MOTION_SETS, MONSTER_MOTION_SET, type GirlId } from '../../data/ffx2/hit-reaction-frames.ts';

/** Which parts of the per-command action time are on. Production runs the defaults; a measurement run picks others through {@link withActionSpanKnobs}. */
export interface ActionSpanKnobs {
  /** The switch itself ({@link ACTION_TIME_PER_COMMAND}). */
  perCommand: boolean;
  /** The physical spans (idle break, run-up, attack clip). Off = physical commands owe nothing. */
  physical: boolean;
  /** The charge-kind spans (effect length, idle break, cast-start clip). Off = casts, skills, items and specials owe nothing. */
  casts: boolean;
  /** A formation's flat 3 s gives way to the per-command span (the default); false keeps the flat value where a formation sets one. */
  supersedeFormation: boolean;
  /** A measurement run only: the run-up distance as a multiple of the estimate (0 = no run-up, 2 = twice as far); the run-up is the least known term. */
  runDistanceScale: number;
  /**
   * A measurement run only: 'read' (production) takes a monster's READ first-hit frame, and the END of its `attack_00` clip where none was read; 'estimate' takes the longer of the
   * clip and the macro's normal-attack-frames estimate; 'half' takes half the clip (a long wind-up and follow-through around an early hit). The last two ignore the read frames:
   * they are the earlier sensitivity arms of the clip-as-hit-time reading.
   */
  monsterHit: 'read' | 'estimate' | 'half';
  /** A measurement run only: every effect length (measured and class default) times this; 1 in production. */
  effectScale: number;
  /** A measurement run only: told each span the per-command rule computed (the unit, its steps), so a run can report the mean span a side's actions took. */
  record?: (unit: Ffx2Unit, steps: number) => void;
}

const PRODUCTION: ActionSpanKnobs = { perCommand: ACTION_TIME_PER_COMMAND, physical: true, casts: true, supersedeFormation: true, runDistanceScale: 1, monsterHit: 'read', effectScale: 1 };
let knobs: ActionSpanKnobs = PRODUCTION;

/** Run `fn` with other knobs (a measurement run); the production ones come back whatever happens. */
export function withActionSpanKnobs<T>(k: Partial<ActionSpanKnobs>, fn: () => T): T {
  const before = knobs;
  knobs = { ...PRODUCTION, ...k };
  try {
    return fn();
  } finally {
    knobs = before;
  }
}

/** {@link withActionSpanKnobs} for a run that awaits (a chain of links): the knobs stay for the whole run. */
export async function withActionSpanKnobsAsync<T>(k: Partial<ActionSpanKnobs>, fn: () => Promise<T>): Promise<T> {
  const before = knobs;
  knobs = { ...PRODUCTION, ...k };
  try {
    return await fn();
  } finally {
    knobs = before;
  }
}

/** The motion ids the ratio is asked for: an idle clip is a stance loop (0x10, which Slow slows), every other clip is not (2). */
const MOTION_STANCE = 0x10;
const MOTION_ACTION = 0x2;

function girlSet(unit: Ffx2Unit): number | undefined {
  const sets = Object.hasOwn(GIRL_MOTION_SETS, unit.id) ? GIRL_MOTION_SETS[unit.id as GirlId] : undefined;
  const slot = DRESSPHERE_SLOT[unit.dresspheres?.current ?? ''];
  return sets !== undefined && slot !== undefined ? sets[slot - 1] : undefined;
}

function girlBody(unit: Ffx2Unit): SpanBody {
  const set = girlSet(unit);
  const frames: GirlFrames = (set !== undefined ? GIRL_ACTION_FRAMES[set] : undefined) ?? FALLBACK_GIRL;
  const slot = DRESSPHERE_SLOT[unit.dresspheres?.current ?? ''];
  const noRun = GIRL_NO_RUN.some(([girl, s]) => girl === unit.id && s === slot);
  const run = Object.hasOwn(GIRL_RUN, unit.id) ? GIRL_RUN[unit.id] : undefined;
  return {
    side: 'girl',
    idle: frames[0],
    // the girl's hit: the READ first-hit frame of her set (note FFX2-G12 section 5) where there is one, else the END of her clip (an ESTIMATE, an upper bound; her clips are 2 to 40 frames)
    attack: (set !== undefined ? GIRL_HIT_FRAMES[set] : undefined) ?? frames[1],
    castStart: frames[2],
    skillStart: frames[3],
    itemStart: frames[4],
    runs: !noRun,
    runSpeed: run?.[0] ?? 40,
    startDist: run?.[1] ?? 15,
    waitAttack: false,
    waitCharge: false,
    waitGate: false,
  };
}

function monsterBody(unit: Ffx2Unit): SpanBody {
  const row = unit.enemy?.ffx2Record?.row;
  const set = row === undefined ? undefined : MONSTER_MOTION_SET[row];
  const f: MonsterFrames = (set !== undefined ? MONSTER_ACTION_FRAMES[set] : undefined) ?? FALLBACK_MONSTER;
  const bits = f[4];
  return {
    side: 'monster',
    idle: f[0],
    // the monster's hit: the READ first-hit frame of its set where there is one, else the END of its `attack_00` clip (an ESTIMATE, an upper bound)
    attack: knobs.monsterHit === 'estimate' ? Math.max(f[1], f[7]) : knobs.monsterHit === 'half' ? Math.ceil(f[1] / 2) : ((set !== undefined ? MONSTER_HIT_FRAMES[set] : undefined) ?? f[1]),
    castStart: f[2],
    skillStart: f[3],
    itemStart: 0,
    runs: (bits & (MT_RUN_00_01 | MT_RUN_01)) !== 0,
    runSpeed: f[5],
    startDist: f[6],
    waitAttack: (bits & (MT_IDLE_WAIT | MT_ENERGY_ATTACK)) !== 0,
    waitCharge: (bits & (MT_CHANT_START_WAIT | MT_IDLE_WAIT)) !== 0,
    waitGate: (bits & MT_MAGIC_THROW_WAIT) !== 0,
  };
}

/** The body of a unit as the span reads it (a girl by her dressphere's motion set, an enemy by its monster row; outside the data, the labelled fallbacks). */
export function spanBodyOf(unit: Ffx2Unit): SpanBody {
  return unit.side === 'party' ? girlBody(unit) : monsterBody(unit);
}

/** What the span needs to know about the command that just resolved. */
export interface ActionContext {
  /** The ability that fired (a Lady Luck spin's fired ability, not the wrapper). */
  ability: AbilityDef;
  /** The command as chosen. */
  command: Command;
}

/** The class byte and effect id of the command the unit ran: the row's own when the data has it, else read off the ability's fields (a labelled fallback). */
export function classAndEffect(unit: Ffx2Unit, ctx: ActionContext): { cls: number; effect: number; costCast: number } {
  const costs = commandCosts(ctx.ability, unit);
  const row = COMMAND_ROW_ACTION[costs.id];
  if (row !== undefined) return { cls: row[0], effect: row[1], costCast: costs.costCast };
  if (ctx.command.kind === 'item') return { cls: 2, effect: 0, costCast: costs.costCast };
  if (costs.costCast > 0) return { cls: 3, effect: 0, costCast: costs.costCast };
  return { cls: ctx.ability.damageType === 'physical' ? 1 : 3, effect: 0, costCast: costs.costCast };
}

/** The effect module's length: the measured total for the measured effects (Fire, Umbral Gaze, Strength Up, Darkness), else the labelled class default of the actor's side. An item takes `ITEM_EFFECT_STEPS` (see `commandSpanSteps`). */
export function effectStepsOf(unit: Ffx2Unit, effect: number): number {
  const measured = MEASURED_EFFECT_STEPS[effect];
  if (measured !== undefined) return measured;
  return unit.side === 'party' ? EFFECT_STEPS_PARTY_ESTIMATE : EFFECT_STEPS_ENEMY_ESTIMATE;
}

/** The span of the command `unit` just resolved, in logic steps. */
export function commandSpanSteps(unit: Ffx2Unit, ctx: ActionContext): number {
  const { cls, effect, costCast } = classAndEffect(unit, ctx);
  const kind = spanKindOfClass(cls);
  if (kind === SpanKind.None) return 0;
  return actionSpan({
    kind,
    cls,
    body: spanBodyOf(unit),
    stanceRatio: ratioOf(unit, MOTION_STANCE),
    actionRatio: ratioOf(unit, MOTION_ACTION),
    costCast,
    effectSteps: Math.round((ctx.command.kind === 'item' ? ITEM_EFFECT_STEPS : effectStepsOf(unit, effect)) * knobs.effectScale),
    runDistance: RUN_DISTANCE_ESTIMATE * knobs.runDistanceScale,
    physical: knobs.physical,
    casts: knobs.casts,
  });
}

/**
 * Steps the command that just resolved stays EXECUTING for (`execute.ts#finishAction`). `ctx` is absent for a command that played nothing
 * (Defend, Escape, a refused item): it owes 0 under the per-command switch. With the switch off this is exactly `actionTimeSteps`.
 */
export function actionStepsFor(
  option: number | undefined,
  flags: Readonly<Record<string, number | string | boolean>>,
  unit: Ffx2Unit,
  ctx: ActionContext | undefined,
): number {
  if (typeof option === 'number' || !knobs.perCommand) return actionTimeSteps(option, flags);
  if (!knobs.supersedeFormation && typeof flags[ACTION_TIME_FLAG] === 'number' && actionTimeSeconds(undefined, flags) > 0) return actionTimeSteps(undefined, flags);
  const steps = ctx === undefined ? 0 : commandSpanSteps(unit, ctx);
  knobs.record?.(unit, steps);
  return steps;
}
