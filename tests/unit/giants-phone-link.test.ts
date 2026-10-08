/**
 * r3942-stage wave 2 repair, **FFX-2 only** (AGENTS.md rule 14; the independent check of 2026-10-08): Chapter XIII's second link on an upright phone is fitted as it always was.
 *
 * The whole chain on the real classes, with painted quads for the figures: `BattleMoments.battleStart` -> `ShotRules.fitPhone` -> `BattleCamera.fitSlice` -> `FrameFit.LinkFits` ->
 * `fitRigToSlice`, and CHAPTER FRAMING's re-registration of the resting rig between the two links (`fx/mix/rigWatch.ts`, replayed here as an `addRig` of a copy at the same pose).
 * Link 1 is the giant (Paragon: held whole under the boss gauge, so the camera stands far back); link 2 is Trema, who is no giant. Before the repair Trema's link started where
 * Paragon's fit left the camera and stood the girls 35 percent smaller than live (18.17 against 12.45 at 390x844); now it is the fit it would have been had link 1 never held a giant.
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { BattleMoments } from '../../src/engine/BattleMoments.ts';
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

function build(link: 'paragon' | 'trema'): { stage: FakeStage; moments: BattleMoments; bc: BattleCamera } {
  const live = new PerspectiveCamera(40, 16 / 9, 0.1, 200);
  const bc = new BattleCamera(live, { rigs: { idle: { position: [0, 1, 10], lookAt: [0, 1, 0] }, intro: { position: [0, 2, 12], lookAt: [0, 1, 0] } }, initial: 'idle' });
  const stage = new FakeStage(['yuna', 'rikku', 'paine'], [link]);
  const cam = stage.camera as unknown as { fitSlice?: unknown; rigNames: string[] };
  cam.fitSlice = (rig: string, slice: number, subjects: Parameters<BattleCamera['fitSlice']>[2], top?: number) => bc.fitSlice(rig, slice, subjects, top);
  for (const [id, actor] of stage.actors) dress(actor as unknown as Record<string, unknown>, id);
  const overlay = { letterbox: async () => {}, nameSlab: async () => {}, vignette: () => {}, clear: () => {}, phoneSlice: () => 0.42 };
  const moments = new BattleMoments({ stage, moments: overlay, sleep: noSleep, speed: () => 'normal' });
  moments.shots.ffx2Framing = true;
  return { stage, moments, bc };
}
function dress(actor: Record<string, unknown>, id: string): void {
  actor['name'] = id; // a stage actor is named by its combatant id (`PaintedActor`)
  actor['contentQuad'] = SHAPES[id]!;
}
const zOf = (bc: BattleCamera): number => (bc.getRig('idle')!.position as Vector3).z;
function reRegister(bc: BattleCamera): void {
  const r = bc.getRig('idle')!;
  bc.addRig('idle', { position: (r.position as Vector3).clone(), lookAt: (r.lookAt as Vector3).clone(), ...(r.fov !== undefined ? { fov: r.fov } : {}) });
}
/** The battle start of the next link: the giant leaves, the next fiend arrives, the presenter fits the phone again. */
async function nextLink(stage: FakeStage, moments: BattleMoments, from: string, to: string): Promise<void> {
  stage.removeCombatant(from);
  const actor = await stage.addCombatant(to, { artId: to, side: 'enemy', slot: 0 });
  dress(actor as unknown as Record<string, unknown>, to);
  moments.shots.fitPhone();
}

describe('the fight after a giant on the upright phone is fitted as it always was (FFX-2 only)', () => {
  it('Paragon\'s link stands the camera far back; Trema\'s link, after CHAPTER FRAMING re-registered the rig, is the fit it would have been with no giant before it', async () => {
    const { stage, moments, bc } = build('paragon');
    moments.shots.fitPhone();
    const zGiant = zOf(bc);
    expect(zGiant).toBeGreaterThan(14); // the whole figure, 9 wide and 8 tall, in a 0.42 slice

    reRegister(bc);
    await nextLink(stage, moments, 'paragon', 'trema');
    const zTrema = zOf(bc);

    // the control: the same second link on a camera that never saw a giant
    const control = build('trema');
    control.moments.shots.fitPhone();
    expect(zTrema).toBeCloseTo(zOf(control.bc), 6);
    expect(zTrema).toBeLessThan(zGiant - 1.5);
    expect(zTrema).toBeGreaterThan(10); // the girls' own stand-back, still wider than the authored rig
  });

  it('without the re-registration the same rig object is refitted from its authored base, and the result is the same', async () => {
    const { stage, moments, bc } = build('paragon');
    moments.shots.fitPhone();
    await nextLink(stage, moments, 'paragon', 'trema');
    const control = build('trema');
    control.moments.shots.fitPhone();
    expect(zOf(bc)).toBeCloseTo(zOf(control.bc), 6);
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

  it('an FFX stage (CTB, no FFX-2 framing) never marks a giant: the ids are FFX-2\'s', () => {
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
  });
});
