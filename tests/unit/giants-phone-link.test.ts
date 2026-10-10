/**
 * r3942-stage wave 2 repair, **FFX-2 only** (AGENTS.md rule 14; the independent check of 2026-10-08): Chapter XIII's second link on an upright phone is fitted as it always was.
 *
 * The whole chain on the real classes, with painted quads for the figures: `BattleMoments.battleStart` -> `ShotRules.fitPhone` -> `BattleCamera.fitSlice` -> `FrameFit.LinkFits` ->
 * `fitRigToSlice`, and CHAPTER FRAMING between the two links: the real `RigWatch` (`fx/mix/rigWatch.ts`) registering the masters it plans, with the drift the clearance fit adds (measured on a
 * 360x740 phone: 0.65 back from the fitted rig, and 1.32 once the giant has gone and the next link's figures stand). Link 1 is the giant (Paragon: held whole under the boss gauge, so the
 * camera stands far back); link 2 is Trema, who is no giant. Before the repair Trema's link started where Paragon's fit left the camera and stood the girls 35 percent smaller than live
 * (18.17 against 12.45 at 390x844); the first repair put the camera back only while it stood where the giant's fit left it, which CHAPTER FRAMING's plans broke on every small phone
 * (the girls 57 to 66 percent of live); now it is the fit it would have been had link 1 never held a giant, whatever CHAPTER FRAMING did in between.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
import { RigWatch, type BattleCameraLike } from '../../src/engine/fx/mix/rigWatch.ts';
import { FakeStage, noSleep } from './helpers/FakeStage.ts';

type Quad = [Vector3, Vector3, Vector3, Vector3];
const quadOf = (x0: number, x1: number, y1: number, z: number) => (out?: Quad): Quad => {
  const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  q[0].set(x0, 0, z);
  q[1].set(x1, 0, z);
  q[2].set(x1, y1, z);
  q[3].set(x0, y1, z);
  return q;
};

/** The three girls across 7 world units (wider than the slice at the authored distance), Paragon (9 wide, 8 tall, behind them) and Trema (one narrow fiend by the girls). */
const SHAPES: Record<string, ReturnType<typeof quadOf>> = {
  yuna: quadOf(-3.5, -2.5, 2, 0),
  rikku: quadOf(-0.5, 0.5, 2, 0),
  paine: quadOf(2.5, 3.5, 2, 0),
  paragon: quadOf(-4.5, 4.5, 8, -2),
  trema: quadOf(0.6, 1.6, 2, -0.5),
};

function build(link: 'paragon' | 'trema', slice = 0.42): { stage: FakeStage; moments: BattleMoments; bc: BattleCamera; rw: RigWatch } {
  const live = new PerspectiveCamera(40, 16 / 9, 0.1, 200);
  const bc = new BattleCamera(live, { rigs: { idle: { position: [0, 1, 10], lookAt: [0, 1, 0] }, intro: { position: [0, 2, 12], lookAt: [0, 1, 0] } }, initial: 'idle' });
  const stage = new FakeStage(['yuna', 'rikku', 'paine'], [link]);
  const cam = stage.camera as unknown as { fitSlice?: unknown; rigNames: string[] };
  cam.fitSlice = (rig: string, slice2: number, subjects: Parameters<BattleCamera['fitSlice']>[2], top?: number) => bc.fitSlice(rig, slice2, subjects, top);
  for (const [id, actor] of stage.actors) dress(actor as unknown as Record<string, unknown>, id);
  const overlay = { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => slice };
  const moments = new BattleMoments({ stage, moments: overlay, sleep: noSleep, speed: () => 'normal' });
  moments.shots.ffx2Framing = true;
  return { stage, moments, bc, rw: new RigWatch(bc as never as BattleCameraLike, bc.camera) };
}
function dress(actor: Record<string, unknown>, id: string): void {
  actor['name'] = id; // a stage actor is named by its combatant id (`PaintedActor`)
  actor['contentQuad'] = SHAPES[id]!;
}
const zOf = (bc: BattleCamera): number => (bc.getRig('idle')!.position as Vector3).z;
const poseOf = (bc: BattleCamera): number[] => {
  const r = bc.getRig('idle')!;
  return [...(r.position as Vector3).toArray(), ...(r.lookAt as Vector3).toArray()];
};
/**
 * CHAPTER FRAMING plans a master from the rig the scene has fitted and installs it (`Framing.commit` -> `RigWatch.install`): `back` further along the view axis and a little higher
 * (the clearance fit's drift). `back` 0 is the copy at the same pose, as a plan that finds the rig already clear leaves it.
 */
function plan(bc: BattleCamera, rw: RigWatch, back = 0): void {
  const r = bc.getRig('idle')!;
  const pos = r.position as Vector3;
  const look = r.lookAt as Vector3;
  const axis = new Vector3().subVectors(pos, look).normalize();
  rw.install({ pos: pos.clone().addScaledVector(axis, back).setY(pos.y + back * 0.14), look: look.clone(), fov: bc.camera.fov }, true);
}
/** The battle start of the next link: the giant leaves, the next fiend arrives, the presenter fits the phone again. */
async function nextLink(stage: FakeStage, moments: BattleMoments, from: string, to: string): Promise<void> {
  stage.removeCombatant(from);
  const actor = await stage.addCombatant(to, { artId: to, side: 'enemy', slot: 0 });
  dress(actor as unknown as Record<string, unknown>, to);
  moments.shots.fitPhone();
}
const same = (a: number[], b: number[]): boolean => a.length === b.length && a.every((n, i) => Math.abs(n - b[i]!) < 1e-6);

describe('the fight after a giant on the upright phone is fitted as it always was (FFX-2 only)', () => {
  it('Paragon\'s link stands the camera far back; Trema\'s link, after CHAPTER FRAMING planned the rig, is the fit it would have been with no giant before it', async () => {
    const { stage, moments, bc, rw } = build('paragon');
    moments.shots.fitPhone();
    const zGiant = zOf(bc);
    expect(zGiant).toBeGreaterThan(14); // the whole figure, 9 wide and 8 tall, in a 0.42 slice

    plan(bc, rw);
    await nextLink(stage, moments, 'paragon', 'trema');
    const zTrema = zOf(bc);

    // the control: the same second link on a camera that never saw a giant
    const control = build('trema');
    control.moments.shots.fitPhone();
    expect(zTrema).toBeCloseTo(zOf(control.bc), 6);
    expect(zTrema).toBeLessThan(zGiant - 1.5);
    expect(zTrema).toBeGreaterThan(10); // the girls' own stand-back, still wider than the authored rig
  });

  it('with the drift CHAPTER FRAMING adds on a small phone (0.65 from the giant\'s fit, again at the live check, 1.32 at the link seam) the second link is the same fit, at every phone slice', async () => {
    for (const slice of [0.34, 0.38, 0.42, 0.487, 0.55]) {
      const control = build('trema', slice);
      control.moments.shots.fitPhone();
      const { stage, moments, bc, rw } = build('paragon', slice);
      moments.shots.fitPhone();
      const zGiant = zOf(bc);
      plan(bc, rw, 0.65); // the master planned from the giant's fit
      plan(bc, rw, 0.65); // and re-planned at the live check
      stage.removeCombatant('paragon'); // the giant has gone: planned again for the figures that stand, 1.32 off
      plan(bc, rw, 1.32);
      await nextLink(stage, moments, 'paragon', 'trema');
      expect(zOf(bc), `slice ${slice}`).toBeLessThan(zGiant - 1);
      expect(same(poseOf(bc), poseOf(control.bc)), `slice ${slice}: ${poseOf(bc).map((n) => n.toFixed(3))} against ${poseOf(control.bc).map((n) => n.toFixed(3))}`).toBe(true);
    }
  });

  it('and the same after several links\' worth of plans in a row, however many refits CHAPTER FRAMING made', async () => {
    const control = build('trema', 0.487);
    control.moments.shots.fitPhone();
    const { stage, moments, bc, rw } = build('paragon', 0.487);
    moments.shots.fitPhone();
    for (let i = 0; i < 6; i++) plan(bc, rw, 0.65);
    await nextLink(stage, moments, 'paragon', 'trema');
    expect(same(poseOf(bc), poseOf(control.bc))).toBe(true);
  });

  it('Paragon\'s own link is the fit it was: nothing is kept before it, so the giant\'s framing is untouched', () => {
    const a = build('paragon', 0.487);
    a.moments.shots.fitPhone();
    const b = build('paragon', 0.487);
    b.bc.fitSlice('idle', 0.487, [{ actor: b.stage.actor('yuna'), min: 1, shared: true }, { actor: b.stage.actor('rikku'), min: 1, shared: true }, { actor: b.stage.actor('paine'), min: 1, shared: true }, { actor: b.stage.actor('paragon'), min: 0.75, shared: true }]);
    b.bc.fitSlice('idle', 0.487, [{ actor: b.stage.actor('yuna'), min: 1, shared: true }, { actor: b.stage.actor('rikku'), min: 1, shared: true }, { actor: b.stage.actor('paine'), min: 1, shared: true }, { actor: b.stage.actor('paragon'), min: 1, shared: true, giant: true }], 0.19);
    expect(same(poseOf(a.bc), poseOf(b.bc))).toBe(true);
  });

  it('without CHAPTER FRAMING in between the same rig object is refitted from its authored base, and the result is the same', async () => {
    const { stage, moments, bc } = build('paragon');
    moments.shots.fitPhone();
    await nextLink(stage, moments, 'paragon', 'trema');
    const control = build('trema');
    control.moments.shots.fitPhone();
    expect(zOf(bc)).toBeCloseTo(zOf(control.bc), 6);
  });

  it('a retry of the giant\'s link after CHAPTER FRAMING has planned from its fit fits the same again, link after link, with no creep', async () => {
    const { stage, moments, bc, rw } = build('paragon');
    moments.shots.fitPhone();
    const first = poseOf(bc);
    for (let i = 0; i < 4; i++) {
      plan(bc, rw, 0.65);
      plan(bc, rw, 0.65);
      moments.shots.fitPhone(); // "one more try": the same link's battle start again
      const again = poseOf(bc);
      expect(again.every((n, k) => Math.abs(n - first[k]!) < 5e-3), `retry ${i + 1}: ${again.map((n) => n.toFixed(3))} against ${first.map((n) => n.toFixed(3))}`).toBe(true);
    }
    void stage;
  });

  it('a link with a giant fits twice at the battle start (the fit every fight had, then the giant\'s own), a link with none once', async () => {
    const a = build('paragon');
    const calls: Array<{ giant: boolean; top: number | undefined }> = [];
    const cam = a.stage.camera as unknown as { fitSlice: (rig: string, slice: number, subjects: Array<{ giant?: boolean }>, top?: number) => boolean };
    const real = cam.fitSlice;
    cam.fitSlice = (rig, slice, subjects, top) => {
      calls.push({ giant: subjects.some((s) => s.giant === true), top });
      return real(rig, slice, subjects, top);
    };
    a.moments.shots.fitPhone();
    expect(calls.map((c) => c.giant)).toEqual([false, true]);
    expect(calls[0]!.top).toBe(0);
    expect(calls[1]!.top).toBeGreaterThan(0);
    calls.length = 0;
    await nextLink(a.stage, a.moments, 'paragon', 'trema');
    expect(calls.map((c) => c.giant)).toEqual([false]);
  });

  it('an FFX stage (CTB, no FFX-2 framing) never marks a giant: the ids are FFX-2\'s, and CHAPTER FRAMING\'s plans between the links are carried over as they always were', async () => {
    const { moments, bc } = build('paragon');
    moments.shots.ffx2Framing = false;
    moments.shots.fitPhone();
    const z = zOf(bc);
    const again = build('paragon');
    again.moments.shots.ffx2Framing = false;
    again.moments.shots.fitPhone();
    expect(z).toBeCloseTo(zOf(again.bc), 9);
    // wider than the slice at min 0.75 it is left out, so the camera stands where the girls fit alone: far nearer than the giant's own fit
    const giant = build('paragon');
    giant.moments.shots.fitPhone();
    expect(z).toBeLessThan(zOf(giant.bc) - 1.5);
    // the next link of an FFX chain starts from the master CHAPTER FRAMING planned, drift and all (nothing is put back, nothing is remembered)
    const ffx = build('paragon');
    ffx.moments.shots.ffx2Framing = false;
    ffx.moments.shots.fitPhone();
    const fitted = zOf(ffx.bc);
    plan(ffx.bc, ffx.rw, 0.65);
    plan(ffx.bc, ffx.rw, 1.32);
    await nextLink(ffx.stage, ffx.moments, 'paragon', 'trema');
    expect(zOf(ffx.bc)).toBeGreaterThan(fitted + 1.9);
  });
});
