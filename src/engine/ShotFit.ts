/**
 * The framing rules a *moment* checks before it takes a shot (iteration 2 B2).
 *
 * - **A-11, the party inside the frame (both games).** A push-in (an action's,
 *   an Overdrive's, a telegraph's, a reveal's) stops short rather than cut a
 *   living party figure that the rig had at least {@link PARTY_MIN} inside the
 *   frame. The rig itself is not moved: FFX's impact cut frames the target,
 *   and a figure it already leaves out stays out.
 * - **A-1, the FFX-2 wait camera (FFX-2 only).** While the gauges fill, an
 *   FFX-2 shot must keep the enemy in play at least {@link FFX2_BOSS_MIN} on
 *   screen and every party figure at least {@link FFX2_PARTY_MIN}; a shot that
 *   does not falls back through `action` to the first-menu master, `idle`
 *   (`presentation-program-2026-09-26.md` A-1; round 13's `23-midfight`
 *   frames lost Vegnagun, Shiva and Trema). FFX's CTB keeps its cuts.
 *
 * No `three`, no DOM: the measuring is the camera port's (`FrameFit.ts`), and
 * a port without `frame` plays every shot as asked, as before.
 */

import type { CombatantId } from '../battle/common/types.ts';
import { FFX2_GIANT_SHARE } from '../data/ffx2/fiend-stature.ts';
import type { ActorHandle, BattleStage, CameraPort } from './BattlePresenterPorts.ts';

/** A-11: share of a party figure's quad a push-in may not cut into. */
export const PARTY_MIN = 0.85;
/** A-1 (FFX-2): share of each party figure a wait shot keeps on screen. */
export const FFX2_PARTY_MIN = 0.9;
/** A-1 (FFX-2): share of the enemy in play a wait shot keeps on screen. */
export const FFX2_BOSS_MIN = 0.75;
/**
 * Headroom the fit keeps over each minimum: the rig is measured at rest, and
 * the idle sway and a hit's shake move the live frame a little off it.
 */
export const FIT_MARGIN = 0.03;

type Subject = { actor: ActorHandle; min: number; floor: number };

/** The party figures still standing (a KO'd member lies down and is not framed for). */
export function partySubjects(stage: BattleStage, min: number): Subject[] {
  const out: Subject[] = [];
  for (const id of stage.staged()) {
    const side = stage.sideOf(id);
    if (side !== 'party' && side !== 'aeon') continue;
    const actor = stage.actor(id);
    if (!actor || (actor as { pose?: string }).pose === 'ko') continue;
    out.push({ actor, min: Math.min(1, min + FIT_MARGIN), floor: min });
  }
  return out;
}

/** A-11: the push to use on `rig`, never cutting a party figure the rig had in frame. */
export function fittedPush(stage: BattleStage, cam: CameraPort, rig: string | null, push: number): number {
  if (!rig || push <= 0 || !cam.frame) return push;
  return cam.frame(rig, push, partySubjects(stage, PARTY_MIN))?.push ?? push;
}

/**
 * A-1 (FFX-2): the party at 90% and the enemy in play at 75%, with the sway margin.
 * r3942-stage wave 2 repair (FFX-2 only): an enemy that is one of the giants (Bahamut, Paragon, Anima) is in play only whole ({@link GIANT_WHOLE_MIN}): the scenes' close rigs were authored for the
 * figure each room was built for, and under them a giant three times as tall passed the 75 percent with its head above the frame (Bahamut's `action` shot, 0.78 inside). A wait shot that would cut one
 * falls back to the master (`ffx2Shot`), whose frame holds him whole, and the push is the one that keeps him so.
 */
function ffx2Subjects(stage: BattleStage, focus: CombatantId | null): Subject[] {
  const subjects = partySubjects(stage, FFX2_PARTY_MIN);
  const boss = focus ? stage.actor(focus) : undefined;
  if (boss && focus) {
    const giant = FFX2_GIANT_SHARE[focus] !== undefined && stage.sideOf(focus) === 'enemy';
    subjects.push(giant ? { actor: boss, min: Math.min(1, GIANT_WHOLE_MIN + FIT_MARGIN), floor: GIANT_WHOLE_MIN } : { actor: boss, min: FFX2_BOSS_MIN + FIT_MARGIN, floor: FFX2_BOSS_MIN });
  }
  return subjects;
}

/**
 * B5 (release 39.1, FFX-2 only): share of each girl the boss reveal keeps on screen. All of her: the defect was a girl the reveal's push pulled
 * out of the frame (Den of Woe and Fallen Aeons, Yuna at the left edge for about 2.7 s of the 6 s opening).
 */
export const REVEAL_PARTY_MIN = 0.97;

/**
 * B5: the standing girls whole (at `whole`, {@link REVEAL_PARTY_MIN} unless the reveal asks for more, with the sway margin) and the enemy in play at A-1's 75 percent.
 * r392-motion: `whole` is how whole the reveal asks the girls to stay, up to all of each ({@link import('./ShotRules.ts').ShotRules.reveal}).
 */
export function ffx2RevealSubjects(stage: BattleStage, focus: CombatantId | null, whole = REVEAL_PARTY_MIN): Subject[] {
  const subjects = partySubjects(stage, whole);
  const boss = focus ? stage.actor(focus) : undefined;
  if (boss) subjects.push({ actor: boss, min: FFX2_BOSS_MIN + FIT_MARGIN, floor: FFX2_BOSS_MIN });
  return subjects;
}

/**
 * r3942-stage wave 2 repair (FFX-2 only: Bahamut, Paragon and Anima; the independent check of 2026-10-08): how whole the opening keeps a giant at the least. The scenes' `intro` and `enemy` rigs
 * were authored for the figure each scene was built for, and a giant three times its height filled the frame past its top edge for 2 to 3 s of the reveal (the head out of frame, the name plate
 * up). The reveal and the opening shot hold a giant as whole as the master keeps it, and never under this (`ShotRules.reveal`, `ShotRules.opening`), and a wait shot holds it to this ({@link ffx2Subjects}).
 */
export const GIANT_WHOLE_MIN = 0.97;

/**
 * r3942-stage wave 2 repair: the room a reveal's shot leaves a giant, as a dolly: the camera may stand this fraction of its distance nearer the aim and still keep the giant whole, so the idle sway
 * and the push never put its crown on the frame's edge (the furthest blend that is merely whole stood the head flush with the top edge).
 */
export const REVEAL_GIANT_ROOM = 0.1;

/** A giant held to `whole` of its painted quad (with the sway margin), as one subject for `CameraPort.frame`; null with no such actor staged. */
export function giantWholeSubject(stage: BattleStage, id: CombatantId, whole: number): Subject | null {
  const actor = stage.actor(id);
  return actor ? { actor, min: Math.min(1, whole + FIT_MARGIN), floor: whole } : null;
}

/** A-1 (FFX-2): the push to use on `rig`, never cutting the party or the enemy in play. */
export function ffx2Push(stage: BattleStage, cam: CameraPort, rig: string | null, push: number, focus: CombatantId | null): number {
  if (!rig || push <= 0 || !cam.frame) return push;
  return cam.frame(rig, push, ffx2Subjects(stage, focus))?.push ?? push;
}

/**
 * A-1 (FFX-2): the first of `rig`, `action`, `idle` that keeps the enemy in
 * play and the whole party on screen at `push`; `idle` when none measures.
 */
export function ffx2Shot(
  stage: BattleStage,
  cam: CameraPort,
  rig: string | null,
  push: number,
  focus: CombatantId | null,
): string | null {
  if (!rig || !cam.frame) return rig;
  const subjects = ffx2Subjects(stage, focus);
  const have = cam.rigNames;
  for (const name of [rig, 'action', 'idle']) {
    if (!have.includes(name)) continue;
    if (name === 'idle') return name;
    const v = cam.frame(name, 0, subjects);
    if (!v || v.fits) {
      // The rig holds everyone at rest; the push must too, or the next rig is tried.
      const pushed = push > 0 ? cam.frame(name, push, subjects) : v;
      if (!pushed || pushed.push >= push - 1e-6) return name;
    }
  }
  return have.includes('idle') ? 'idle' : rig;
}
