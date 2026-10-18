/**
 * The span of one command, in logic steps: how long its actor stays EXECUTING between the command's start (physical) or release (a charge
 * kind) and its completion (re-parity lane X2-A, row XA6 slice A; **FFX-2 only**). Pure and DOM-free; no random number.
 *
 * What a command's time is made of (note FFX2-G11 section 2, from the game's own scripts and a live session):
 *
 * - **A physical command** (sequence class 1, 0xD to 0x14, 0x1D, 0x25, 0x26, 0x2B) completes at its last planned hit, not when its follow-through
 *   and return clips end (those only hold the NEXT command's start). So its span is the wait for the idle clip's break (a girl's tag script always
 *   begins with it; a monster only when its motion type carries `idle_wait` or `energy_attack`), then the run-up (bodies with a run bit; the macro
 *   polls once a step until the distance falls to the attack-start distance), then the `attack_00` clip up to the hit.
 * - **A charge kind** (classes 2 to 4, 0x15 to 0x1C, 0x1F to 0x24, 0x29, 0x2C to 0x2F) spans from the release to the end of the effect module's
 *   timeline: the module's own length (a measured total for three effects, a labelled class default for every other) plus, for a command that has no
 *   countdown, the girl's idle break and cast-start clip (with a countdown they play during it). A monster whose motion type carries a start-wait
 *   bit waits for an idle break before the command starts (its queue's ready test) or, for class 0x1F, at the start gate.
 *   The throw clip plays INSIDE the effect, so it is not added; the measured totals already hold the measured body's own start gate.
 * - **Haste** (animation ratio 2.0) halves every clip term (the idle break, the run-up, the attack clip, the cast-start clip); the effect term is
 *   NOT scaled, because nothing says Haste shortens an effect module (FFX2-G11 section 2.2 item 3; open). Slow slows only the stance loops, so it
 *   lengthens only the idle break (`animationRatio`: motion ids 0x10 to 0x2a).
 *
 * The waits are EXPECTATIONS, not draws: the idle clip a body is in when its command starts is a script random pick (G08) and a phase, so the
 * idle break is taken as half the idle clip, which keeps every replay's random streams where they were. Labelled; a live stopwatch session
 * (note FFX2-G11 section 7 items 3 and 4) settles them.
 */

import { STEPS_PER_SECOND } from '../clock.ts';

/** What a command's class says the actor does. */
export const SpanKind = { None: 0, Attack: 1, Cast: 2 } as const;
export type SpanKindValue = (typeof SpanKind)[keyof typeof SpanKind];

/**
 * Sequence class (command row byte +0x0C) to what the actor plays: note FFX2-G01 section 8.2's table of classes, tags and ActionRec kinds.
 * Attack = the kinds whose hits come from the motion's signals (1, 5 to 9 of the table) that a body plays an attack clip for; Cast = the charge
 * kinds (2 to 4) and the wait-magic class; None = a command that plays no clip or whose completion was not read (Defend, Escape, Wait, resident
 * magic, the Sandals), which owe no span.
 */
export function spanKindOfClass(cls: number): SpanKindValue {
  if (cls === 1 || (cls >= 0xd && cls <= 0x14) || cls === 0x1d || cls === 0x25 || cls === 0x26 || cls === 0x2b) return SpanKind.Attack;
  if ((cls >= 2 && cls <= 4) || (cls >= 0x15 && cls <= 0x1c) || (cls >= 0x1f && cls <= 0x24) || cls === 0x29 || (cls >= 0x2c && cls <= 0x2f)) return SpanKind.Cast;
  return SpanKind.None;
}

/** The classes whose attack starts with a run-up: the ones with a return (1, 0xD to 0x14, the Steal and the dressphere-table Mug); the gun and trainer attacks stay where they stand. */
export function classRuns(cls: number): boolean {
  return cls === 1 || (cls >= 0xd && cls <= 0x14) || cls === 0x1d || cls === 0x2b;
}

/** Which cast-start clip a class plays: items 2 and 0x24, skills 4 and the skill-tag classes, everything else the magic clip. */
export type CastClip = 'magic' | 'skill' | 'item';

export function castClipOfClass(cls: number): CastClip {
  if (cls === 2 || cls === 0x24) return 'item';
  if (cls === 4 || cls === 0x22 || cls === 0x23 || cls === 0x29 || cls === 0x2e || cls === 0x2f) return 'skill';
  return 'magic';
}

/** The body of the actor, as the span reads it (frames are motion frames; one frame is one logic step at the normal animation ratio). */
export interface SpanBody {
  side: 'girl' | 'monster';
  /** `idle1` (`idle2` when there is no idle1): the clip the idle break waits on. 0 = none. */
  idle: number;
  attack: number;
  castStart: number;
  skillStart: number;
  itemStart: number;
  /** The body runs up to its target (a run bit in its motion type; every girl job but one). */
  runs: boolean;
  /** Field units a second, and the distance the attack starts at. */
  runSpeed: number;
  startDist: number;
  /** A monster: its motion type waits for an idle break before an attack (`idle_wait`, `energy_attack`) / a charge kind (`chant_start_wait`, `idle_wait`) / the start gate (`magic_throw_wait`). */
  waitAttack: boolean;
  waitCharge: boolean;
  waitGate: boolean;
}

/** One command's inputs. Ratios are 8.8 fixed point (0x100 = 1.0, Haste 0x200, a Slow stance 0x80, 0 = Stopped or Petrified). */
export interface SpanInput {
  kind: SpanKindValue;
  cls: number;
  body: SpanBody;
  /** The ratio of the stance loops (the idle break) and of every other clip. */
  stanceRatio: number;
  actionRatio: number;
  /** The row's cast cost: a charge kind with 0 has no countdown to hide the girl's idle break and cast-start clip in. */
  costCast: number;
  /** The effect module's length from release to its end, in steps (unscaled by Haste). */
  effectSteps: number;
  /** Field units the run-up covers. */
  runDistance: number;
  /** Measurement switches: turn one side of the span off. */
  physical: boolean;
  casts: boolean;
}

const FIXED_ONE = 0x100;

/** `frames` of a clip at a ratio, in whole steps (a frame is a step at ratio 1.0). */
function clipSteps(frames: number, ratio: number): number {
  if (frames <= 0 || ratio <= 0) return 0;
  return Math.ceil((frames * FIXED_ONE) / ratio);
}

/** The idle break, as an expectation: half of the idle clip, at the stance ratio. */
export function idleBreakSteps(body: SpanBody, stanceRatio: number): number {
  if (body.idle <= 0 || stanceRatio <= 0) return 0;
  return Math.ceil((body.idle * FIXED_ONE) / (2 * stanceRatio));
}

/**
 * Steps of a run-up covering `distance` field units to an attack-start distance `startDist` at `speed` units a second: the whole steps the macro's
 * poll takes, with no acceleration ramp and no turning, so a lower bound. A body that does not run, or is already inside the start distance, owes none.
 */
export function runUpSteps(body: SpanBody, distance: number, actionRatio: number): number {
  if (!body.runs || body.runSpeed <= 0 || actionRatio <= 0) return 0;
  const gap = distance - body.startDist;
  if (gap <= 0) return 0;
  return Math.ceil(((gap / body.runSpeed) * STEPS_PER_SECOND * FIXED_ONE) / actionRatio);
}

function castStartFrames(body: SpanBody, clip: CastClip): number {
  return clip === 'item' ? body.itemStart : clip === 'skill' ? body.skillStart : body.castStart;
}

/** The span of one command in logic steps (0 = it plays nothing, or the part is switched off). */
export function actionSpan(i: SpanInput): number {
  if (i.actionRatio <= 0) return 0; // a Stopped or Petrified actor plays nothing
  if (i.kind === SpanKind.Attack) {
    if (!i.physical) return 0;
    const wait = i.body.side === 'girl' || i.body.waitAttack ? idleBreakSteps(i.body, i.stanceRatio) : 0;
    const run = classRuns(i.cls) ? runUpSteps(i.body, i.runDistance, i.actionRatio) : 0;
    return wait + run + clipSteps(i.body.attack, i.actionRatio);
  }
  if (i.kind === SpanKind.Cast) {
    if (!i.casts) return 0;
    let pre = 0;
    if (i.body.side === 'monster') {
      const waits = i.cls === 0x1f ? i.body.waitGate : i.body.waitCharge;
      if (waits) pre = idleBreakSteps(i.body, i.stanceRatio);
    } else if (i.costCast <= 0) {
      pre = idleBreakSteps(i.body, i.stanceRatio) + clipSteps(castStartFrames(i.body, castClipOfClass(i.cls)), i.actionRatio);
    }
    return pre + Math.max(0, i.effectSteps);
  }
  return 0;
}
