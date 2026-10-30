import type { Mesh } from 'three';
import { canTopple, fallRun, koCrossMs, koFallOff, reviveRun } from '../../KoFall.ts';
import { headMiddleU, tipSide } from '../../KoTip.ts';
import { moveWord } from '../../motion/MoveSwitch.ts';
import { realBuckleMs } from '../../motion/RealMoments.ts';
import type { RigKoHost } from '../../rig/RigKoHost.ts';
import type { Guts, LifeCtx, Playing, Slot } from './living.ts';

/**
 * THE KNOCK-OUT RUN OF A RIG DRAWN BY POSE (rigs-v3, 2026-10-29; both games, shared plumbing; the party rigs of Tidus, FFX, and Rikku's Dark Knight, FFX-2, behind `?partyrigs=`).
 *
 * `living.ts` plays the painting set's fall and rise (`KoFall.ts`) on two planes: the standing painting tips about its toe edge and slides until the heads meet, the lying painting crosses in under a
 * dust puff, and a revive plays it backwards. A rig has one plane (the idle's, the "carrier") and drew none of it: its `ko` key was a rigid turn of the standing pieces to 45 degrees and a cut to the lying
 * drawing in mid-air (the clips: "no cut from standing to lying" was the ask). The rig's parts follow the idle plane's mesh (`RigFigure.sync`), so the SAME run tips them: the standing plane is the idle
 * plane, the lying body is a plane-shaped record of the `ko` key ({@link lyingOf}: its head and span, from `RigKoHost`), and the cut of the cross changes the rig's key (`RigKoHost.flip`) instead of
 * fading a plane, holding the pieces as drawn to cross out over it (`RigHold.ts`, review M1). Everything else is the run as it was: the clock (hold, cross, rise), the turn and the slide, the puff, the landing on the cut, `?kotopple=eased`, REDUCE MOTION (a cut, as before), a
 * hit-stop. Not ported: the buckle (a shader bend of the standing plane: the rig's parts do not wear it) and the smear window of the cross (a rig's `ko` is outside the rig smear, `SmearPlan.SKIP`).
 */

const dummy = (pose: string): Slot => ({ fade: 0, pose } as unknown as Slot);

/** A revive's cut falls on the first frame of its cross: the standing key drawn toppled where the body lay is nearest the lying head then (review M1, 2026-10-29: the head stepped 0.378 at the half way, 0.141 at the start); a fall's falls when the lying key is the stronger of the two (half). */
const REVIVE_CUT_AT = 0.0001;
const FALL_CUT_AT = 0.5;

/** Whether the cut of a rig's run is due: `inn` is the incoming share of the run's cross now. */
export const rigCutDue = (p: Playing, inn: number): boolean => p.rig !== undefined && p.rigCut !== true && inn >= (p.run.opts.kind === 'revive' ? REVIVE_CUT_AT : FALL_CUT_AT);

/**
 * The cross's cut of a rig's run: its key becomes the one the run ends in (the pieces as drawn this instant are held and cross out over the run's own cross, `RigHold.ts`), and (a fall) the lying key stands
 * where the lying painting would, the idle plane upright again.
 */
export function cutRig(a: Guts, p: Playing): void {
  p.rigCut = true;
  p.rig!.flip(p.rigKey!, p.run.opts.crossMs);
  if (p.run.opts.kind === 'fall') a.tipSlot(p.stand, null);
}

/** A plane-shaped record of the rig's `ko` key where the run reads a lying plane (its head box, its content span, its place on the idle plane's own frame, untipped). */
export function lyingOf(host: RigKoHost, stand: Slot): Slot {
  const l = host.lying(stand.meta.head);
  const w = stand.scale.width;
  const cb = stand.scale.contentBox;
  const mesh = { position: { x: stand.mesh.position.x, y: stand.mesh.position.y }, scale: { x: stand.mesh.scale.x }, rotation: { z: 0 } } as unknown as Mesh;
  return { mesh, material: null as never, fade: 0, pose: 'ko', scale: { ...stand.scale, prone: true, contentBox: { x0: (l.u0 - 0.5) * w, x1: (l.u1 - 0.5) * w, y0: cb.y0, y1: cb.y1 } }, meta: l.head ? { head: l.head } : {} };
}

/**
 * A KO of a party rig drawn by pose: the life layer moves to `down` (the fall tween, the flinch tokens: `poseLife`, no key move), and the run of a topple is handed back for `LivingFigure.begin`. Null where
 * the painting set's own answer is a cut (REDUCE MOTION, `?kofall=off`, a figure that cannot topple): the rig then plays its own `ko` key move as before.
 */
export function rigFall(a: Guts, host: RigKoHost, name: string, opts: { immediate?: boolean; force?: boolean } | undefined, ctx: LifeCtx): Playing | null {
  if (ctx.rm || koFallOff() || !canTopple(a.name, true)) return null;
  const stand = a.slots[a.active]!;
  const lying = lyingOf(host, stand);
  const run = fallRun('topple', ctx.game, undefined, realBuckleMs(a.name, koCrossMs()), moveWord('kotopple') === 'eased');
  if (!run || !a.poseLife) return null;
  a.poseLife(name, opts);
  const side = tipSide(headMiddleU(lying.meta.head), stand.mesh.scale.x < 0 ? -1 : 1, 1);
  return { run, mode: 'topple', from: dummy(stand.pose), to: dummy('ko'), stand, lying, side, rig: host, rigKey: host.keyFor(name) ?? 'ko' };
}

/**
 * A revive of a party rig that lies in its `ko` key: the life layer moves up (`poseLife`; a body on the ground that ignores the request stays down and nothing runs), the run of a rise is handed back. At the cut the
 * rig's key becomes the standing one, drawn already toppled where the body lay (the same tip and slide the painting's revive plays, `placeTipped` on the idle plane), and it stands up from there.
 */
export function rigRevive(a: Guts, host: RigKoHost, name: string, opts: { immediate?: boolean; force?: boolean } | undefined): Playing | null {
  if (!a.poseLife) return null;
  const stand = a.slots[a.active]!;
  a.poseLife(name, opts);
  if (a.life?.state === 'down') return null; // the actor ignored the request
  const lying = lyingOf(host, stand);
  const side = tipSide(headMiddleU(lying.meta.head), stand.mesh.scale.x < 0 ? -1 : 1, 1);
  return { run: reviveRun(true, moveWord('kotopple') === 'eased'), mode: 'topple', from: dummy('ko'), to: dummy(name), stand, lying, side, rig: host, rigKey: host.keyFor(name) ?? 'idle' };
}
