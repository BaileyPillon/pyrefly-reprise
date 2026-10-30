/**
 * rigs-v3, review fix M1 (2026-10-29; both games, shared plumbing; Tidus FFX and Rikku's Dark Knight FFX-2 are the rigs it reaches, behind `?partyrigs=`): the KO and the revive of the REAL pilot rigs, measured
 * on what is drawn. `rigs-v3-ko.test.ts` runs a three-part fixture whose lying head is placed to match, and its "head step under 0.12" held only there: on the real files the fall's head stepped 0.166 and 0.228, a
 * revive's 0.378 and 0.385, and the feet, the sword and the hands jumped 0.4 to 0.9 world units (22 to 43 percent of the figure's 1.82) on the frame of the cut, where the painting set crosses its two paintings
 * over 75 ms. The fixes: the revive cuts on the first frame of its cross (the toppled standing key is nearest the lying head then) and every cut HOLDS the pose drawn so far (`RigHold.ts`) and crosses it out.
 */
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { reset } from '../engine/head-lock-fixture.ts';
import type { RigActorT } from './rigs-v3-fixture.ts';
import { REAL, HEIGHT, drawnNow, maxGap, realActor, stepper, type Drawn } from './rigs-v3-real.ts';

afterEach(() => reset());

interface Rec { key: string; roll: number; head: [number, number]; pelvis: [number, number]; fading: boolean; live: Map<string, Drawn>; held: Map<string, Drawn>; groupVisible: boolean | null; life: string }
interface Played { fall: Rec[]; revive: Rec[]; beforeRevive: Map<string, Drawn>; headLying: [number, number]; actor: RigActorT }

async function play(subject: string, folder: string, game: 'ffx' | 'ffx2'): Promise<Played> {
  const a = await realActor(subject, folder);
  const s = stepper(a, game);
  for (let i = 0; i < 31; i++) s.frame();
  const rec = (): Rec => {
    const d = drawnNow(a);
    const h = a.landmark('head')!, p = a.landmark('pelvis')!;
    return { key: a.pose, roll: s.roll(), head: [h.x + a.position.x, h.y], pelvis: [p.x + a.position.x, p.y], fading: a.figure.fading, live: d.live, held: d.held, groupVisible: d.heldGroupVisible, life: a.lifeState };
  };
  a.setPose('ko');
  const fall: Rec[] = [];
  for (let i = 0; i < 50; i++) { s.frame(); fall.push(rec()); }
  for (let i = 0; i < 30; i++) s.frame();
  const beforeRevive = drawnNow(a).live;
  const hl = a.landmark('head')!;
  const headLying: [number, number] = [hl.x + a.position.x, hl.y];
  a.setPose('idle');
  const revive: Rec[] = [];
  for (let i = 0; i < 40; i++) { s.frame(); revive.push(rec()); }
  return { fall, revive, beforeRevive, headLying, actor: a };
}

const step = (a: [number, number], b: [number, number]): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
const cutOf = (r: Rec[], from: string): number => r.findIndex((f) => f.key !== from);
const deg = (rad: number): number => Math.abs(rad) * (180 / Math.PI);

for (const rig of REAL) {
  describe(`${rig.folder} (${rig.game === 'ffx' ? 'FFX' : 'FFX-2'} tempo): the cut of a fall and of a revive, on the real file`, () => {
    let p: Played;
    beforeAll(async () => { p = await play(rig.subject, rig.folder, rig.game); });

    it('the fall cuts in the 75 ms cross, with the standing pieces tipped 66 to 70 degrees, and the head and the pelvis go on at the fall\'s own speed across the cut', () => {
      const cut = cutOf(p.fall, 'idle');
      expect(cut, 'FFX 220 ms hold + part of the cross: frame 16; FFX-2 170 ms: frame 13').toBe(rig.game === 'ffx' ? 16 : 13);
      expect(deg(p.fall[cut - 1]!.roll)).toBeGreaterThan(66);
      expect(deg(p.fall[cut - 1]!.roll)).toBeLessThan(70);
      expect(p.fall[cut]!.roll, 'the plane is upright from the cut').toBe(0);
      const headSteps = p.fall.slice(1, cut + 1).map((f, i) => step(p.fall[i]!.head, f.head));
      const before = Math.max(...headSteps.slice(cut - 4, cut - 1)), across = headSteps[cut - 1]!;
      expect(across, 'the head\'s step across the cut is the speed it already had').toBeLessThan(before * 1.5);
      expect(across).toBeLessThan(0.27); // Tidus 0.166, Rikku 0.228 (FFX-2 tempo: the same fall in fewer frames); 15 percent of the figure
      expect(step(p.fall[cut - 1]!.pelvis, p.fall[cut]!.pelvis)).toBeLessThan(0.23);
    });

    it('the pieces as drawn the frame before the cut are held, whole and where they were, and cross out over four frames while the lying key comes up under them', () => {
      const cut = cutOf(p.fall, 'idle');
      const f0 = p.fall[cut]!;
      const prev = p.fall[cut - 1]!.live;
      expect(f0.fading).toBe(true);
      expect(f0.held.size, 'every piece that was drawn').toBe(prev.size);
      for (const [name, was] of prev) {
        expect(maxGap(f0.held.get(name)!.verts, was.verts), `${name} is where it was (the actor's own motion is not in this frame of reference)`).toBeLessThan(2e-3);
        expect(f0.held.get(name)!.z, `${name} keeps its place in the draw order, a hair behind the piece that comes up over it`).toBeCloseTo(was.z - 0.0004, 9);
      }
      const ops = p.fall.slice(cut, cut + 6).map((f) => [f.live.values().next().value!.opacity, f.held.size ? f.held.values().next().value!.opacity : 0]);
      expect(ops[0]![1], 'the held figure is nearly whole on the first frame it is drawn').toBeGreaterThan(0.7);
      expect(ops[0]![0], 'and the lying key hardly there').toBeLessThan(0.1);
      for (let i = 1; i < 4; i++) {
        expect(ops[i]![0], `frame ${i}: the lying key comes up`).toBeGreaterThan(ops[i - 1]![0]!);
        expect(ops[i]![1], `frame ${i}: the held figure goes out`).toBeLessThan(ops[i - 1]![1]!);
        expect(1 - (1 - ops[i]![0]!) * (1 - ops[i]![1]!), `frame ${i}: no hole in the figure (the painting set's cross dips to 0.62)`).toBeGreaterThan(0.6);
        expect(maxGap(p.fall[cut + i]!.held.get('head')!.verts, f0.held.get('head')!.verts), 'the held set stays where it was frozen').toBe(0);
      }
      expect(ops[4]![0], 'the lying key is whole after the cross').toBe(1);
      expect(p.fall[cut + 4]!.fading, 'the cross is over after 75 ms (4 frames drawn)').toBe(false);
      expect(p.fall[cut + 4]!.groupVisible).toBe(false);
      expect(p.fall[cut + 4]!.held.size).toBe(0);
    });

    it('the revive cuts on the first frame of its cross: the head steps like a frame of the rise (under 0.17), not the 0.378 the half-way cut gave, and the lying pieces cross out under it', () => {
      expect(cutOf(p.revive, 'ko')).toBe(0);
      const heads = p.revive.map((f, i) => step(i ? p.revive[i - 1]!.head : p.headLying, f.head));
      expect(Math.max(...heads.slice(0, 8)), 'no frame of the first eight steps the head more than a tenth of the figure').toBeLessThan(0.17);
      expect(Math.max(...heads.slice(0, 8))).toBeLessThan(HEIGHT / 10);
      expect(deg(p.revive[0]!.roll), 'toppled where it lay').toBeGreaterThan(70);
      const f0 = p.revive[0]!;
      expect(f0.held.size).toBe(p.beforeRevive.size);
      for (const [name, was] of p.beforeRevive) expect(maxGap(f0.held.get(name)!.verts, was.verts), `${name}: the lying pose is held where it lay`).toBeLessThan(2e-3);
      expect(f0.held.values().next().value!.opacity).toBeGreaterThan(0.7);
      expect(f0.live.values().next().value!.opacity).toBeLessThan(0.1);
      expect(p.revive[4]!.fading).toBe(false);
    });

    it('the rise after the cut only gets more upright, ends upright, and the life layer is idle', () => {
      const rolls = p.revive.map((f) => deg(f.roll));
      for (let i = 1; i < rolls.length; i++) expect(rolls[i]!, `frame ${i}`).toBeLessThanOrEqual(rolls[i - 1]! + 1e-9);
      expect(rolls.at(-1)).toBe(0);
      expect(p.revive.at(-1)!.life).toBe('idle');
      expect(p.revive.at(-1)!.key).toBe('idle');
    });
  });
}
