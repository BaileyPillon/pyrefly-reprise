/**
 * The hit reaction of a body (re-parity lane X2-A, slice 1; **FFX-2 only**).
 *
 * The game has no chain window. It has the target's hit REACTION: the damage tag the hit asks for (`kernel/hit-reaction.ts#chooseReaction`)
 * plays the body's `dmg1` clip (`hdmg1` after a critical), and the chain counter lives exactly as long as that tag is in flight; the
 * halving of the target's ATB tick and the forced hit (a target in reaction cannot evade) last as long. This module turns a landed hit
 * into those lengths, in logic steps:
 *
 *     steps = ceil(clip frames / animation ratio) + HIT_REACTION_SCHEDULING_STEPS
 *
 * The ratio is the game's (`animationRatio`): 2.0 under Haste, 1.0 under Slow for a damage clip (Slow slows only the stance loops), 0 when
 * Stopped or Petrified, which have no reaction at all. The clip is the body's (`data/ffx2/hit-reaction-frames.ts`). A body outside the data
 * keeps today's 2 s / 3 s window and the 15-step halving, and so does every body when `CHAIN_WINDOW_PER_BODY` is off.
 *
 * Not modelled here, on purpose (slices that need an action timeline, or a live reading): the start gate that keeps a reacting target from
 * starting a command (XA3, `chain.ts isActionLocked` stays the window), the armour of a command in progress and its two-step freeze (XA8:
 * an armoured target would show a 2-step window), the guard reaction of a defending target (tag 25, the `guard_00` clip) and a flinch
 * that replays a cast's start tag (XA9). A status-only hit (result kind 8) and the immune kinds 3 and 4 keep an existing chain alive in
 * the game without raising it; the engine does not classify a status-only hit as a reaction yet (`pp_result_kind` is not recovered), and
 * IC-1 (D-242) keeps an immune hit out of the chain.
 */

import type { FFX2Combatant } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import {
  CHAIN_WINDOW_PER_BODY,
  CHAIN_WINDOW_TICKS,
  CHAIN_WINDOW_TICKS_CRIT,
  HIT_REACTION_SCHEDULING_STEPS,
  HIT_REACTION_STEPS,
} from './constants.ts';
import {
  DRESSPHERE_SLOT,
  GIRL_CLIP_FRAMES,
  GIRL_MOTION_SETS,
  MONSTER_CLIP_FRAMES,
  MONSTER_MOTION_SET,
  type GirlId,
} from '../../data/ffx2/hit-reaction-frames.ts';
import { animationRatio, chooseReaction, MotionTag, ResultKind, type ReactionTarget } from './kernel/hit-reaction.ts';
import { has } from './adapt/words.ts';

/**
 * Which parts of the slice are on. Production runs `NEW_REACTION` (or `OLD_REACTION` with the switch off); a measurement run picks the others
 * through {@link withReactionKnobs} to take the slice apart: one side at a time, the halved-tick span and forced hit alone (`coupling`, XA2 and XA4)
 * and the Haste ratio alone on today's numbers (`ratio`, XA7).
 */
export interface ReactionKnobs {
  /** The girls' windows are their own clips, with the span, the forced hit and the Haste ratio that go with them. */
  girls: boolean;
  /** The same for monsters, parts and bosses. */
  monsters: boolean;
  /** Alone: bodies in the data halve the tick for their own reaction and are forced-hit for it; windows stay 2 s / 3 s. */
  coupling: boolean;
  /** Alone: today's numbers (the windows and the 15-step span) are scaled by the animation ratio: Haste halves them, Stop and Petrify clear them. */
  ratio: boolean;
}

export const NEW_REACTION: ReactionKnobs = { girls: true, monsters: true, coupling: false, ratio: false };
export const OLD_REACTION: ReactionKnobs = { girls: false, monsters: false, coupling: false, ratio: false };

let knobs: ReactionKnobs = CHAIN_WINDOW_PER_BODY ? NEW_REACTION : OLD_REACTION;

/** Run `fn` with other knobs (a measurement run); the production ones come back whatever happens. */
export function withReactionKnobs<T>(k: Partial<ReactionKnobs>, fn: () => T): T {
  const before = knobs;
  knobs = { ...OLD_REACTION, ...k };
  try {
    return fn();
  } finally {
    knobs = before;
  }
}

/** A body in the data: its two clips in motion frames. */
interface Body {
  side: 'girl' | 'monster';
  dmg1: number;
  hdmg1: number;
}

/** The motion ids of the clips (`dmg1` 0x38, `hdmg1` 0x40): outside the Slow range 0x10 to 0x2a, so Slow leaves a damage clip at full speed. */
const MOTION_DMG1 = 0x38;
const MOTION_HDMG1 = 0x40;

/** The body of a unit, or null when the data does not have it (no motion set for her dressphere or its monster row, or the set has no damage clip). */
export function bodyOf(unit: FFX2Combatant): Body | null {
  let side: Body['side'];
  let clips: readonly [number, number] | undefined;
  if (unit.side === 'party') {
    side = 'girl';
    const sets = Object.hasOwn(GIRL_MOTION_SETS, unit.id) ? GIRL_MOTION_SETS[unit.id as GirlId] : undefined;
    const slot = DRESSPHERE_SLOT[unit.dresspheres?.current ?? ''];
    const set = sets !== undefined && slot !== undefined ? sets[slot - 1] : undefined;
    clips = set === undefined ? undefined : GIRL_CLIP_FRAMES[set];
  } else {
    side = 'monster';
    const row = unit.enemy?.ffx2Record?.row;
    const set = row === undefined ? undefined : MONSTER_MOTION_SET[row];
    clips = set === undefined ? undefined : MONSTER_CLIP_FRAMES[set];
  }
  if (clips === undefined || clips[0] < 0 || clips[1] < 0) return null;
  return { side, dmg1: clips[0], hdmg1: clips[1] };
}

/** The animation ratio (8.8 fixed point) a damage clip of `unit` plays at: the game's rule, read off the unit's statuses. */
function ratioOf(unit: FFX2Combatant, motion: number): number {
  return animationRatio({
    motion,
    freezeTest: false,
    paused: false,
    self: { motionType: 0, freeze: 0, inBattle: true, partyFlag: true, fixedOn: 0, fixedRatio: 0 },
    root: { status1: has(unit, 'petrify') ? 2 : 0, stop: has(unit, 'stop') ? 1 : 0, haste: has(unit, 'haste'), slow: has(unit, 'slow'), fixedOn: 0, fixedRatio: 0, base: 0x100 },
  });
}

/** Steps a number of today's (frame-free) steps takes at the unit's ratio: Haste halves, Stop and Petrify clear. */
function scaled(unit: FFX2Combatant, steps: number): number {
  const ratio = ratioOf(unit, MOTION_DMG1);
  return ratio === 0 ? 0 : Math.ceil((steps * 0x100) / ratio);
}

/** The target as the chooser reads it: the engine models no armour, script flag or forced motion, so only Stop and Petrify can refuse the reaction. */
function chooserTarget(unit: FFX2Combatant): ReactionTarget {
  return {
    e6d: 0, e6e: 0, e6f: 0, e70: 0, queueCount: 0, actionState: 0, e71: 0, runningTag: 0xffffffff, skip: 0, runningClass: 0, redirect: 0,
    stopped: has(unit, 'stop'),
    petrified: has(unit, 'petrify'),
  };
}

/**
 * Steps the reaction to a damaging hit lasts on a body in the data: the chooser asks for the tag (26 for a hit, 27 for a critical; nothing
 * for a Stopped or Petrified target), the tag names the clip, the ratio and the one scheduling step make the length. 0 = no reaction.
 */
function bodySteps(unit: FFX2Combatant, body: Body, critical: boolean): number {
  const target = chooserTarget(unit);
  const plan = chooseReaction({
    kind: critical ? ResultKind.Critical : ResultKind.Hit,
    extra: 0,
    callFlags: 0,
    resultFlags: 0, // no guard bit: a defending target would ask for tag 25 (its guard clip), which the engine does not model
    redirected: false,
    targetSlot: 0,
    target,
    animator: target,
    queuePending: false,
    deathStarted: 0, // a lethal hit is the KO routine's (`resolve-hp.ts`), which breaks the chain
    requestAccepted: 1,
  });
  const tag = plan.request?.[1];
  if (tag === undefined) return 0;
  const heavy = tag === MotionTag.DamageCritical;
  const ratio = ratioOf(unit, heavy ? MOTION_HDMG1 : MOTION_DMG1);
  if (ratio === 0) return 0;
  return Math.ceil(((heavy ? body.hdmg1 : body.dmg1) * 0x100) / ratio) + HIT_REACTION_SCHEDULING_STEPS;
}

function sideOn(body: Body): boolean {
  return body.side === 'girl' ? knobs.girls : knobs.monsters;
}

/** Logic steps the chain window a damaging hit opens on `target` lasts (0 = none: a Stopped or Petrified target). */
export function reactionWindow(target: FFX2Combatant, critical: boolean): number {
  const body = bodyOf(target);
  if (body !== null && sideOn(body)) return bodySteps(target, body, critical);
  const today = critical ? CHAIN_WINDOW_TICKS_CRIT : CHAIN_WINDOW_TICKS;
  return knobs.ratio ? scaled(target, today) : today;
}

/** Logic steps the hit halves `target`'s ATB tick for (`gauge.hitReaction`): its own reaction, else the measured 15. */
export function reactionSpan(target: FFX2Combatant, critical: boolean): number {
  const body = bodyOf(target);
  if (body !== null && (sideOn(body) || knobs.coupling)) return bodySteps(target, body, critical);
  return knobs.ratio ? scaled(target, HIT_REACTION_STEPS) : HIT_REACTION_STEPS;
}

/**
 * Does the per-step update clear this unit's chain counter the moment it is Stopped or Petrified (`chain.ts advanceChainWindows`)? The game does for every
 * body; here it does for a body in the data on a side that is on, and a body outside the data (or the switch off) keeps the counter until its window ends, as before.
 */
export function clearsOnStop(target: FFX2Combatant): boolean {
  const body = bodyOf(target);
  return body !== null && sideOn(body);
}

/**
 * Is `target` in hit reaction now (`Chr+0xd98`, a damage tag in flight)? A hit on a target in reaction cannot be evaded
 * (`kernel/hit.ts`, accuracy formulas 1 and 2). A body whose reaction is on follows its own reaction; any other follows the window, as it did.
 */
export function inHitReaction(target: Ffx2Unit): boolean {
  const body = bodyOf(target);
  if (body !== null && (sideOn(body) || knobs.coupling)) return target.gauge.hitReaction > 0;
  return target.chainWindowTicks > 0;
}
