/**
 * THE PRESENTER'S SIDE OF THE AUDIO PASS (conference demo sound pass, 2026-10-22; decision 184). Two jobs, both inert unless the pass is on (`audio/pass/passSwitch.ts`: `?audio=new` or
 * `?pack=demo`, Chapter I and Chapter IV only):
 *
 *  1. **The dip before a big blow.** The music is dipped 90 to 120 ms before a critical, an Overdrive's finisher or a boss's headline blow lands, so the blow comes out of a hole. Two places know how far
 *     the blow is: `attackBeat` (a plain attack: the strike's contact is `strikeBeatNow` after the swing cue, and the action's own later events say whether it is a critical) and `landingBeat` (a spell
 *     or a boss move: the effect's own wait to its mark). The dip is a gain on the music bus alone (`AudioManager.musicDip`), scheduled on the audio clock, so it does not wobble with a frame.
 *  2. **A spell's landing sound on its effect's mark.** `landingWaitMs` reads how far the effect's own clock still is from the mark of this blow (`VfxPort.markIn`) at the moment the cue is asked; the
 *     mixer waits that long less the sound's own silence, so the sound is never heard before the effect it belongs to. The presenter's numeral already waits for the same mark
 *     (`motion/SkillTravel.drawnStrike`); the cue was asked before that wait.
 *
 * Presentation only: no `three`, no DOM, ports only. Game case: both (the tables in `audio/pass/` are per game).
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import { bigKindOf, dipTimes } from '../audio/pass/passPlanner.ts';
import { passLogPush, passNow } from '../audio/pass/passLog.ts';
import { passVictoryCue } from '../audio/pass/passResults.ts';
import { noteBlowAt, noteGather } from '../audio/pass/passMask.ts';
import { DIPS } from '../audio/pass/passRecipes.ts';
import { passGame } from '../audio/pass/passSwitch.ts';
import type { BigKind } from '../audio/pass/passTypes.ts';
import { TIMING, type EventCtx } from './BattlePresenterEvents.ts';
import { SPEED_SCALE } from './BattlePresenterUtil.ts';
import { paceFactor } from './pace.ts';
import { actionOfBlow, type ActingAction } from './BattlePresenterSpellFx.ts';

type Damage = Extract<BattleEvent, { type: 'damage' }>;

/**
 * The first big blow among the events that follow `at` in a burst, up to the end of the action that `at` opens; null when there is none. A critical or a headline hit counts; an Overdrive's
 * finisher is the LAST blow of a flurry whose timing nothing here knows, so it gets its thump but no dip.
 */
export function firstBigAhead(events: readonly BattleEvent[], at: number): { kind: BigKind; index: number } | null {
  const start = events[at];
  if (!start || start.type !== 'action-start') return null;
  const commandKind = (start.command as { kind?: string }).kind ?? null;
  for (let i = at + 1; i < events.length; i++) {
    const e = events[i]!;
    if (e.type === 'action-end' && e.actorId === start.actorId) return null;
    if (e.type !== 'damage' || e.sourceId !== start.actorId || e.amount <= 0) continue;
    const kind = bigKindOf({ crit: e.crit === true, abilityId: start.abilityId ?? null, hitIndex: e.hitIndex ?? 0, hitCount: e.hitCount ?? 1, commandKind, actorSide: null });
    if (kind === 'overdrive') return null;
    if (kind) return { kind, index: i };
    return null; // the action's first blow decides: a later big hit's moment is not known here
  }
  return null;
}

/** Ask the mixer for a dip `aheadMs` before a blow. A mixer without the method (a test fake, a build without the pass) does nothing. */
function dip(ctx: EventCtx, kind: BigKind, aheadMs: number, why: string): void {
  const audio = ctx.deps.audio as { musicDip?: (aheadMs: number, plan: (typeof DIPS)[BigKind]) => void } | undefined;
  if (!audio?.musicDip) return;
  const plan = DIPS[kind];
  const t = dipTimes(aheadMs, plan);
  audio.musicDip(aheadMs, plan);
  passLogPush({ kind: 'dip', big: kind, why, aheadMs: Math.round(aheadMs), downAtMs: Math.round(t.downAt), holdUntilMs: Math.round(t.holdUntil) });
}

/**
 * A plain attack's swing cue was just asked for: the blow is `beatMs` away (the strike's contact, already scaled by the speed and the pace). When the action's first blow is a critical, dip the music
 * for it. `heal`/item actions have no blow on a foe and add nothing.
 */
export function attackBeat(ctx: EventCtx, beatMs: number): void {
  if (!passGame()) return;
  noteBlowAt(passNow() + beatMs); // the strike's smear zip is kept off the blow (`pass/passMask.ts`)
  const burst = ctx.burst;
  if (!burst) return;
  const big = firstBigAhead(burst.events, burst.at);
  // Only a critical's dip is timed from the swing: a boss's blow lands later than the strike beat says (measured, stepped at 60 Hz: 193 ms later, a dip 313 ms long), so its dip waits for the landing (`landingBeat`).
  if (big && big.kind === 'crit') dip(ctx, big.kind, beatMs, 'attack');
}

/**
 * A spell's or a boss move's landing wait began: the effect reaches the blow's mark in `waitMs`. A boss's headline blow dips the music for it. (`a` is the blow's action.)
 */
export function landingBeat(ctx: EventCtx, event: Damage, a: ActingAction | undefined, waitMs: number): void {
  if (!passGame() || waitMs <= 0) return;
  const blowAt = passNow() + waitMs * sleepScale(ctx);
  noteBlowAt(blowAt);
  noteNextHit(ctx, event, blowAt);
  const kind = bigKindOf({ crit: event.crit === true, abilityId: a?.abilityId ?? null, hitIndex: event.hitIndex ?? 0, hitCount: event.hitCount ?? 1, commandKind: null, actorSide: null });
  if (kind !== 'boss' && kind !== 'crit') return;
  // Timed on the presenter's own clock, not the page's: the wait runs scaled by the playback speed and the pace, so a dip timed from its unscaled length started 68 to 145 ms early on the two long waits measured
  // (stepped at 60 Hz, a dip 188 and 265 ms before the blow instead of 120). The dip starts a lead before the end of the sleep that the blow follows.
  const lead = DIPS[kind].leadMs;
  const f = sleepScale(ctx); // ms of the page's time one ms of the presenter's sleep takes
  if (waitMs <= lead / f) return dip(ctx, kind, waitMs * f, 'landing');
  void ctx.sleep(waitMs - lead / f).then(() => dip(ctx, kind, lead, 'landing'));
}

/**
 * A blow lands NOW: the effect's mark had already passed when the presenter asked, so no `landingBeat` ran ahead of it (stepped at 60 Hz: 62 of Chapter I's 70 spell landings, and the second and third blow of a
 * multi-target move). The motion sounds that fall on it (the smear zip is asked in the same frame, before the blow's own cue) are kept off it all the same (`pass/passMask.ts`); before this call they were not, and
 * about half the zips on a blow stayed at full level (audio-pass review minor 1). Inert with the pass off.
 */
export function landedNow(ctx: EventCtx, event: Damage): void {
  if (!passGame()) return;
  const now = passNow();
  noteBlowAt(now);
  noteNextHit(ctx, event, now);
}

/**
 * A multi-hit move's next blow comes one pacing step after this one (`TIMING.perHit`, scaled like the presenter's own waits: 228 ms measured for Fire's five hits at normal speed, 209 for Mega Flare's three
 * girls), and the smear zip that goes with it is asked 12 to 49 ms AHEAD of it, before that blow can be noted: note it in advance, so the zips between the hits of a Fire are kept off them too. Whether another
 * blow follows is read from the burst (the hits of one move do not arrive in index order: Fire's fifth hit lands on the second target before its second), not from the hit's index.
 */
function noteNextHit(ctx: EventCtx, event: Damage, blowAt: number): void {
  if (moreBlowsAhead(ctx, event)) noteBlowAt(blowAt + TIMING.perHit * sleepScale(ctx));
}

/** Does the same striker have another damaging blow later in this action? With no burst to read (a test double), the hit count says. */
function moreBlowsAhead(ctx: EventCtx, event: Damage): boolean {
  const burst = ctx.burst;
  if (!burst) return (event.hitCount ?? 1) > 1 && (event.hitIndex ?? 0) < (event.hitCount ?? 1) - 1;
  for (let i = burst.at + 1; i < burst.events.length; i++) {
    const e = burst.events[i]!;
    if (e.type === 'action-end' && e.actorId === event.sourceId) return false;
    if (e.type === 'damage' && e.sourceId === event.sourceId && e.amount > 0) return true;
  }
  return false;
}

/**
 * How far (ms) the effect's own clock still is from the mark of this blow at the moment its landing cue is asked: the mixer waits that long, less the cue's own silence (`landingDelayMs`), so the
 * sound is never heard before the effect it belongs to. 0 when the pass is off, when the blow belongs to no drawn effect, or when the effect has already reached the mark.
 */
export function landingWaitMs(ctx: EventCtx, targetId: CombatantId | null, sourceId: CombatantId | null): number {
  if (!passGame() || !targetId) return 0;
  const markIn = ctx.stage.vfx.markIn;
  if (!markIn) return 0;
  const action = actionOfBlow(ctx, sourceId ?? undefined);
  if (!action) return 0;
  let left = 0;
  try {
    left = markIn.call(ctx.stage.vfx, targetId, action.serial);
  } catch {
    return 0;
  }
  const ms = Math.max(0, Math.round(left));
  passLogPush({ kind: 'landing', target: targetId, markInMs: ms });
  return ms;
}

/** The presenter's own waits run scaled by the playback speed, the fight's time scale and the pace (`BattlePresenterSfx.scaled`): the ratio of page time to presenter time. */
function sleepScale(ctx: EventCtx): number {
  const speed = typeof ctx.speed === 'function' ? ctx.speed() : 'normal';
  const f = SPEED_SCALE[speed] * (ctx.deps.timeScale ?? 1) * paceFactor('action');
  return Number.isFinite(f) && f > 0 ? f : 1;
}

/**
 * Chapter I's last blow (the pass; `audio/pass/passResults.ts`): the chapter's results cue starts now, crossfading the battle theme out over `fadeS`, and the presenter drops its 3.4 s sting, so the win is one
 * fanfare and not two. True when it started the cue (the caller then plays no sting); false with the pass off or when the chapter has no cue.
 */
export function passEarlyVictory(ctx: EventCtx, fadeS: number): boolean {
  const early = passVictoryCue();
  if (!early || !ctx.deps.audio) return false;
  void Promise.resolve(ctx.deps.audio.playMusic(early, { fade: fadeS })).catch(() => undefined);
  passLogPush({ kind: 'victory', cue: early });
  return true;
}

/** An Overdrive's opening began: its gather's landing thud is left out (PC-18). */
export function passGather(_ctx: EventCtx): void {
  if (!passGame()) return;
  noteGather(passNow());
}

/** Release volume, pitch and the longest play, by kind of shot: a spell's orb leaves with a low breath of air, a beam with a lower, shorter one; a gun's tracer is the shot itself (its own cue), so it gets none. */
const RELEASE = { orb: { volume: 0.34, pitch: 0.72, maxMs: 460 }, beam: { volume: 0.38, pitch: 0.6, maxMs: 300 } } as const;

/**
 * A shot leaves its caster (SKILL TRAVEL's release, `motion/SkillTravel.launchShot`): the pass plays the air of its leaving (`whiff` pitched down, the first bank's cloth-and-air cue), cut to the flight
 * so it ends where the shot lands, and so nothing sounds before the shot is out. `flightMs` is the flight the stage sized. Inert with the pass off.
 */
export function passRelease(ctx: EventCtx, kind: 'orb' | 'tracer' | 'beam', flightMs: number): void {
  if (!passGame() || flightMs <= 0 || kind === 'tracer') return;
  const r = RELEASE[kind];
  const trimMs = Math.min(r.maxMs, Math.round(flightMs));
  try {
    ctx.deps.audio?.playSfx('whiff', { volume: r.volume, pitch: r.pitch, trimMs, fadeMs: Math.round(trimMs * 0.45) });
    passLogPush({ kind: 'release', shot: kind, flightMs: Math.round(flightMs), trimMs });
  } catch {
    /* a release that cannot play is silence */
  }
}
