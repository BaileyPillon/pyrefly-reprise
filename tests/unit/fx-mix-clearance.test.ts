/**
 * The MAX mix's CHAPTER FRAMING clearance (D-316 and the judges' must-fix lists): a member under a
 * panel fails, a nearer member covering a farther one is the overlap (Evrae: Tidus must not hide Wakka),
 * a member inside a boss's painted silhouette is the boss cover (Paine inside Bahamut), the party floor
 * is today's height minus 10 %, and the fit takes the pose nearest the master that passes. Game case:
 * both (shared plumbing).
 */
import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { bossCoverOf, clearBoxes, fitClear, limitsFor, measure, overlapOf, type Field } from '../../src/engine/fx/mix/clearance.ts';
import { cameraAt, figBox, partyPx, stillActor, type Actor, type Fig, type Mask, type Pose } from '../../src/engine/fx/mix/geometry.ts';
import { hudFree } from '../../src/engine/fx/mix/hudPanels.ts';
import { RigWatch, type BattleCameraLike } from '../../src/engine/fx/mix/rigWatch.ts';

const field = (panels: Field['panels'] = []): Field => ({ W: 1600, H: 900, view: { l: 0, r: 1600, t: 0, b: 900 }, panels });
const fig = (x: number, z: number, h: number, enemy = false, id = 'f', mask?: Mask): Fig => ({ feet: new Vector3(x, 0, z), h, halfW: h * 0.25, enemy, id, ...(mask ? { mask } : {}) });
const pose = (z = 12, fov = 32): Pose => ({ pos: new Vector3(0, 1.6, z), look: new Vector3(0, 1.2, 0), fov });

describe('measure', () => {
  it('reads the share in view and the share under a panel', () => {
    const f = field([{ l: 0, r: 800, t: 0, b: 900 }]);
    expect(measure({ l: 700, r: 900, t: 100, b: 300 }, f).underHud).toBeCloseTo(0.5, 1);
    expect(measure({ l: 1500, r: 1700, t: 100, b: 300 }, f).inView).toBeCloseTo(0.5, 2);
  });

  it('counts only a boss painting\'s own pixels with a mask (a serpent\'s box is mostly sky)', () => {
    const f = field([{ l: 0, r: 800, t: 0, b: 900 }]);
    const rightHalf: Mask = { at: (fx) => (fx > 0.5 ? 1 : 0) };
    expect(measure({ l: 600, r: 1000, t: 100, b: 300 }, f, rightHalf).underHud).toBe(0); // the painted half is clear
    expect(measure({ l: 600, r: 1000, t: 100, b: 300 }, f).underHud).toBeGreaterThan(0.4);
  });
});

describe('overlap and boss cover', () => {
  it('a nearer member covering a farther one is an overlap; side by side is none', () => {
    const cam = cameraAt(pose(), 1600 / 900);
    const near = fig(-1, 1.5, 1.8, false, 'tidus');
    const far = fig(-1.1, -0.5, 1.8, false, 'wakka');
    const apart = fig(1.5, 0, 1.8, false, 'rikku');
    const boxes = [near, far, apart].map((g) => figBox(g, cam, 1600, 900));
    expect(overlapOf(boxes, [near, far, apart], cam.position)).toBeGreaterThan(0.5);
    expect(overlapOf([boxes[0]!, boxes[2]!], [near, apart], cam.position)).toBe(0);
  });

  it('a member inside the boss\'s painted silhouette is covered; inside its box but on sky is not', () => {
    const party = fig(0, 0, 1.8, false, 'paine');
    const solid = fig(0.2, -3, 8, true, 'bahamut', { at: () => 1 });
    const sky = fig(0.2, -3, 8, true, 'bahamut', { at: () => 0 });
    const cam = cameraAt(pose(), 1600 / 900);
    const b = [figBox(party, cam, 1600, 900), figBox(solid, cam, 1600, 900)];
    expect(bossCoverOf(b, [party, solid])).toBeGreaterThan(0.5);
    expect(bossCoverOf(b, [party, sky])).toBe(0);
  });
});

describe('the party rule and the fit', () => {
  const party = [fig(-2.2, 0, 1.8, false, 'a'), fig(-1.2, 0.2, 1.7, false, 'b'), fig(-0.2, -0.1, 1.9, false, 'c')];
  const boss = fig(2.5, -2, 4.5, true, 'boss');
  const figs = [...party, boss];

  it('the floor is today\'s party height minus 10 %', () => {
    const today = pose();
    const { rule, todayPx } = limitsFor(figs, today, field());
    expect(todayPx).toBeCloseTo(partyPx(figs, cameraAt(today, 1600 / 900), 1600, 900), 3);
    expect(rule.floorPx).toBeCloseTo(0.9 * todayPx, 3);
    expect(rule.overlapMax).toBeGreaterThanOrEqual(0.12);
  });

  it('a pose that shrinks the party under the floor fails, even with everything clear of the HUD', () => {
    const today = pose();
    const { limits, rule } = limitsFor(figs, today, field());
    const far = pose(30);
    const cl = clearBoxes(figs.map((g) => figBox(g, cameraAt(far, 1600 / 900), 1600, 900)), figs, far.pos, field(), [0, 0], limits, rule);
    expect(cl.floorOk).toBe(false);
    expect(cl.ok).toBe(false);
  });

  it('keeps today\'s rig when it already passes (an approved composition changes only as much as the rule needs)', () => {
    const today = pose();
    const { limits, rule } = limitsFor(figs, today, field());
    const fit = fitClear(today, today, figs, field(), true, limits, rule);
    expect(fit.clear.ok).toBe(true);
    expect(fit.back).toBe(1);
    expect(fit.lens).toEqual([0, 0]);
  });

  it('steps the frame (a lens shift) to take a member out from under a panel, never below the floor', () => {
    const today = pose();
    const cam = cameraAt(today, 1600 / 900);
    const left = figBox(party[0]!, cam, 1600, 900);
    // A command menu over the first member's left half.
    const panel = { l: 0, r: (left.l + left.r) / 2, t: 0, b: 900 };
    const f = field([panel]);
    const { limits, rule } = limitsFor(figs, today, f);
    const fit = fitClear(today, today, figs, f, true, limits, rule);
    expect(fit.clear.ok).toBe(true);
    expect(fit.lens[0]).toBeGreaterThan(0);
    expect(fit.clear.partyPx).toBeGreaterThanOrEqual(rule.floorPx);
  });
});

describe('when the framing measures (a calm frame) and what it composes into', () => {
  const actor = (busy: number, lifeState: string): Actor => ({ tweens: { size: busy }, lifeState }) as never as Actor;

  it('judges a figure only while it stands at its place: not acting, nothing in flight (a menu lean counts)', () => {
    expect(stillActor(actor(0, 'idle'))).toBe(true);
    expect(stillActor(actor(0, 'ready'))).toBe(true);
    expect(stillActor(actor(1, 'idle'))).toBe(false); // a lunge, a knockback, a run home
    expect(stillActor(actor(0, 'act'))).toBe(false);
  });

  it('judges the camera only on the resting rig with no move in flight (Active ATB opens menus mid-action)', () => {
    const bc = { camera: new PerspectiveCamera(), rigName: 'idle', rigNames: ['idle'], pushAmount: 0, tweens: { size: 0 }, getRig: () => ({ position: [0, 2, 10], lookAt: [0, 1, 0] }), addRig: () => undefined, moveTo: async () => undefined, snapTo: () => undefined };
    const rw = new RigWatch(bc as never as BattleCameraLike, bc.camera);
    expect(rw.atRest()).toBe(true);
    bc.rigName = 'idle~near';
    expect(rw.atRest()).toBe(true);
    bc.tweens.size = 1;
    expect(rw.atRest()).toBe(false);
    bc.tweens.size = 0;
    bc.rigName = 'action';
    expect(rw.atRest()).toBe(false);
  });

  it('adds no cut: a master installed at rest waits for the presenter\'s next move, one in flight is retargeted', () => {
    const rigs = new Map<string, { position: number[]; lookAt: number[]; fov?: number }>([['idle', { position: [0, 2, 10], lookAt: [0, 1, 0], fov: 30 }]]);
    const calls: string[] = [];
    const bc = {
      camera: new PerspectiveCamera(), rigName: 'idle', rigNames: ['idle'], pushAmount: 0, tweens: { size: 0 },
      getRig: (n: string) => rigs.get(n), addRig: (n: string, r: { position: number[] | Vector3; lookAt: number[] | Vector3; fov?: number }) => void rigs.set(n, { position: r.position instanceof Vector3 ? r.position.toArray() : r.position, lookAt: r.lookAt instanceof Vector3 ? r.lookAt.toArray() : r.lookAt, ...(r.fov !== undefined ? { fov: r.fov } : {}) }),
      moveTo: async (n: string, ms?: number) => void calls.push(`move ${n} ${Math.round(ms ?? 0)}`), snapTo: (n: string) => void calls.push(`snap ${n}`),
    };
    const rw = new RigWatch(bc as never as BattleCameraLike, bc.camera);
    const master: Pose = { pos: new Vector3(3, 1, 18), look: new Vector3(0, 2, 0), fov: 34 };
    rw.install(master, true);
    expect(calls).toEqual([]); // at rest: no cut, no move
    expect(rw.sinceInstall()).toBe(0); // the lens shift waits too
    void (bc as never as BattleCameraLike).moveTo('idle', 0); // the presenter's next move (here, instantaneous)
    expect(rw.sinceInstall()).toBe(1);
    bc.tweens.size = 1; // a move onto the resting rig in flight: retargeted, not cut
    rw.install({ ...master, pos: new Vector3(4, 1, 18) }, true);
    expect(calls.filter((c) => c.startsWith('snap'))).toEqual([]);
    expect(calls.at(-1)).toMatch(/^move idle \d+$/);
  });

  it('composes a colossus into one fixed area, never one read from the HUD of the moment', () => {
    // The battle-start moment collapses the HUD: a rectangle read from it gave the first plan one
    // composition and every re-plan another (Natus and Bahamut re-composed in their first minute).
    const a = hudFree(1600, 900);
    expect([a.l, a.r, a.t, a.b].map(Math.round)).toEqual([480, 1360, 72, 648]);
  });
});
