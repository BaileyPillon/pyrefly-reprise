/**
 * rigs-v3, review fix passes (2026-10-29 and 2026-10-30; both games, shared plumbing; Tidus FFX and Rikku's Dark Knight FFX-2 are the rigs it reaches, behind `?partyrigs=`): the KO and the revive of the REAL pilot
 * rigs, measured on what is drawn. `rigs-v3-ko.test.ts` runs a three-part fixture whose lying head is placed to match, and its "head step under 0.12" held only there: on the real files the fall's head stepped
 * 0.166 and 0.228, a revive's 0.378 and 0.385, and the feet, the sword and the hands jumped 0.4 to 0.9 world units (22 to 43 percent of the figure's 1.82) on the frame of the cut, where the painting set crosses its
 * two paintings over 75 ms. The fixes: the revive cuts on the first frame of its cross (the toppled standing key is nearest the lying head then) and every cut HOLDS the pose drawn so far (`RigHold.ts`) and crosses it out.
 *
 * Round 3 (review round 2, M1 and M2): every number is pinned under BOTH regimes of the page. The unit tests have no address, so the demo motion is off (a 75 ms cross); a page runs it ON unless `?motion=off`
 * (the default since release 60, and the browser jobs pass no `motion=` word): the cross is 100 ms, the KO cuts a frame later, and the held figure is drawn for 5 frames, not 4. And a blow finds the figure in its `hurt`
 * flinch (the damage beat is 240 ms, the flinch holds 360): the run is fitted to the idle, so the bones ease to the idle key during the hold (`RigKoHost.settle`) and every start reaches the cut as the idle's does.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { reset } from '../engine/head-lock-fixture.ts';
import type { RigActorT } from './rigs-v3-fixture.ts';
import { REAL, HEIGHT, drawnNow, maxGap, realActor, stepper, type Drawn } from './rigs-v3-real.ts';

const { setDemoMotion } = await import('../../../src/engine/motion/DemoMotion.ts');
const { setPace, setPaceGame } = await import('../../../src/engine/pace.ts');

afterEach(() => reset());
afterAll(() => { setDemoMotion(null); setPaceGame('other'); setPace('steady'); });

/**
 * The two regimes a rig is played in. Measured with the real files (`rigs-v3-real.test.ts`, the review's probes agree to the third decimal): the cut frame, the head's step on it, the frames the held figure is drawn.
 * `head` is the live head's step across the cut in world units (a figure 1.82 tall); a band of about +-0.03 around the measure.
 */
const REGIME = {
  off: { demo: false, label: '?motion=off (a 75 ms cross)', held: 4, revive: 4, cut: { ffx: 16, ffx2: 13 }, head: { ffx: [0.14, 0.20], ffx2: [0.19, 0.26] }, roll: [66, 70] },
  on: { demo: true, label: 'the page default, ?motion on (a 100 ms cross)', held: 5, revive: 5, cut: { ffx: 17, ffx2: 14 }, head: { ffx: [0.19, 0.25], ffx2: [0.25, 0.32] }, roll: [63, 68] },
} as const;

interface Rec { key: string; roll: number; head: [number, number]; pelvis: [number, number]; fading: boolean; live: Map<string, Drawn>; held: Map<string, Drawn>; groupVisible: boolean | null; life: string; busy: boolean }
interface Played { fall: Rec[]; revive: Rec[]; beforeRevive: Map<string, Drawn>; headLying: [number, number]; actor: RigActorT }

async function play(subject: string, folder: string, game: 'ffx' | 'ffx2'): Promise<Played> {
  const a = await realActor(subject, folder);
  const s = stepper(a, game);
  for (let i = 0; i < 31; i++) s.frame();
  const rec = (): Rec => {
    const d = drawnNow(a);
    const h = a.landmark('head')!, p = a.landmark('pelvis')!;
    return { key: a.pose, roll: s.roll(), head: [h.x + a.position.x, h.y], pelvis: [p.x + a.position.x, p.y], fading: a.figure.fading, live: d.live, held: d.held, groupVisible: d.heldGroupVisible, life: a.lifeState, busy: a.blending };
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
/** How many frames from `from` on the held figure is drawn. */
const heldFrames = (r: Rec[], from: number): number => { let n = 0; while (from + n < r.length && r[from + n]!.held.size > 0) n++; return n; };

for (const [regime, R] of Object.entries(REGIME)) {
  for (const rig of REAL) {
    describe(`${rig.folder} (${rig.game === 'ffx' ? 'FFX' : 'FFX-2'} tempo), ${R.label}: the cut of a fall and of a revive, on the real file`, () => {
      let p: Played;
      beforeAll(async () => { setDemoMotion(R.demo); p = await play(rig.subject, rig.folder, rig.game); setDemoMotion(null); });

      it(`the fall cuts on frame ${R.cut[rig.game]} with the standing pieces tipped ${R.roll[0]} to ${R.roll[1]} degrees, and the head and the pelvis go on at the fall's own speed across the cut`, () => {
        const cut = cutOf(p.fall, 'idle');
        expect(cut, 'the hold (220 ms FFX, 170 FFX-2) and part of the cross').toBe(R.cut[rig.game]);
        expect(deg(p.fall[cut - 1]!.roll)).toBeGreaterThan(R.roll[0]);
        expect(deg(p.fall[cut - 1]!.roll)).toBeLessThan(R.roll[1]);
        expect(p.fall[cut]!.roll, 'the plane is upright from the cut').toBe(0);
        const headSteps = p.fall.slice(1, cut + 1).map((f, i) => step(p.fall[i]!.head, f.head));
        const before = Math.max(...headSteps.slice(cut - 4, cut - 1)), across = headSteps[cut - 1]!;
        const [lo, hi] = R.head[rig.game];
        expect(across, `the head's step across the cut, world units (${regime}: the lying head is a fixed point; a longer cross cuts with the body a little less far over)`).toBeGreaterThan(lo);
        expect(across).toBeLessThan(hi);
        expect(across, 'at most twice the speed the head had a frame before').toBeLessThan(before * 2);
        expect(across).toBeLessThan(HEIGHT * 0.18);
        expect(step(p.fall[cut - 1]!.pelvis, p.fall[cut]!.pelvis)).toBeLessThan(0.23);
      });

      it(`the pieces as drawn the frame before the cut are held, whole and where they were, and cross out over ${R.held} frames while the lying key comes up under them`, () => {
        const cut = cutOf(p.fall, 'idle');
        const f0 = p.fall[cut]!;
        const prev = p.fall[cut - 1]!.live;
        expect(f0.fading).toBe(true);
        expect(f0.held.size, 'every piece that was drawn').toBe(prev.size);
        for (const [name, was] of prev) {
          const held = f0.held.get(name)!;
          expect(maxGap(held.verts, was.verts), `${name} is where it was (the actor's own motion is not in this frame of reference)`).toBeLessThan(2e-3);
          expect(held.z, `${name} keeps its place in the draw order, a hair behind the piece that comes up over it`).toBeCloseTo(was.z - 0.0004, 9);
          expect(held.map, `${name} is drawn with the image it was drawn with (the old key's, not the new one's, not the first look)`).toBe(was.map);
          expect(held.uvs, `${name} keeps its uv`).toBe(was.uvs);
          expect(held.uvs).toBeGreaterThan(0);
          expect(held.indices, `${name} keeps its triangles`).toBe(was.indices);
          expect(held.indices).toBeGreaterThan(0);
        }
        const changed = [...prev].filter(([name, was]) => p.fall[cut + 1]!.live.get(name)?.map !== was.map).length;
        expect(changed, 'the lying key draws its own images for most pieces (so the held ones differ from the live ones, and the identity check above has teeth)').toBeGreaterThanOrEqual(3);
        const ops = p.fall.slice(cut, cut + R.held + 2).map((f) => [f.live.values().next().value!.opacity, f.held.size ? f.held.values().next().value!.opacity : 0]);
        expect(ops[0]![1], 'the held figure is nearly whole on the first frame it is drawn').toBeGreaterThan(0.7);
        expect(ops[0]![0], 'and the lying key hardly there').toBeLessThan(0.1);
        for (let i = 1; i < R.held; i++) {
          expect(ops[i]![0], `frame ${i}: the lying key comes up`).toBeGreaterThan(ops[i - 1]![0]!);
          expect(ops[i]![1], `frame ${i}: the held figure goes out`).toBeLessThan(ops[i - 1]![1]!);
          expect(1 - (1 - ops[i]![0]!) * (1 - ops[i]![1]!), `frame ${i}: no hole in the figure (the painting set's cross dips to 0.62)`).toBeGreaterThan(0.6);
          expect(maxGap(p.fall[cut + i]!.held.get('head')!.verts, f0.held.get('head')!.verts), 'the held set stays where it was frozen').toBe(0);
        }
        expect(heldFrames(p.fall, cut), `the held figure is drawn for ${R.held} frames`).toBe(R.held);
        expect(ops[R.held]![0], 'the lying key is whole after the cross').toBe(1);
        expect(p.fall[cut + R.held]!.fading).toBe(false);
        expect(p.fall[cut + R.held]!.groupVisible).toBe(false);
      });

      it('the held pieces are a sibling group of the plane, named `<part>~ghost` under a `~held` group: the continuity probe reads the plane\'s children and skips `~ghost` names, so it never counts one as a part and never sees the cross (ghost readings are blind to it)', () => {
        const plane = p.actor.figure.plane as unknown as { children: Array<{ name: string }>; parent: { children: Array<{ name: string; parent: unknown; children: Array<{ name: string }> }> } };
        expect(plane.children.some((c) => c.name.endsWith('~held')), 'not a child of the plane').toBe(false);
        const group = plane.parent.children.find((c) => c.name.endsWith('~held'))!;
        expect(group, 'a sibling of the plane').toBeDefined();
        expect(group.children.length).toBeGreaterThan(0);
        for (const c of group.children) expect(c.name.endsWith('~ghost'), c.name).toBe(true);
      });

      it(`the revive cuts on the first frame of its cross: the head steps like a frame of the rise (under 0.17), not the 0.378 the half-way cut gave, and the lying pieces cross out under it for ${R.revive} frames`, () => {
        expect(cutOf(p.revive, 'ko')).toBe(0);
        const heads = p.revive.map((f, i) => step(i ? p.revive[i - 1]!.head : p.headLying, f.head));
        expect(Math.max(...heads.slice(0, 8)), 'no frame of the first eight steps the head more than a tenth of the figure').toBeLessThan(0.17);
        expect(Math.max(...heads.slice(0, 8))).toBeLessThan(HEIGHT / 10);
        expect(deg(p.revive[0]!.roll), 'toppled where it lay').toBeGreaterThan(70);
        const f0 = p.revive[0]!;
        expect(f0.held.size).toBe(p.beforeRevive.size);
        for (const [name, was] of p.beforeRevive) {
          expect(maxGap(f0.held.get(name)!.verts, was.verts), `${name}: the lying pose is held where it lay`).toBeLessThan(2e-3);
          expect(f0.held.get(name)!.map, `${name}: with the lying key's image (a held piece pointed at the part's first look would show the standing pose)`).toBe(was.map);
          expect(f0.held.get(name)!.uvs).toBe(was.uvs);
          expect(f0.held.get(name)!.indices).toBe(was.indices);
        }
        expect(f0.held.values().next().value!.opacity).toBeGreaterThan(0.7);
        expect(f0.live.values().next().value!.opacity).toBeLessThan(0.1);
        expect(heldFrames(p.revive, 0)).toBe(R.revive);
        expect(p.revive[R.revive]!.fading).toBe(false);
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
}

// ---------------------------------------------------------------- a blow finds the figure in another key (review round 2, M2)

interface Start { key: string; cut: number; steps: number[]; headAtCut: number; busyAtCut: boolean; keysSeen: string[]; heldAtCut: number }

/** Put the figure in `from` the way the game does (`flinch` for a blow, `setPose` for the rest), then ask for the KO and read 40 frames. */
async function fallFrom(rig: (typeof REAL)[number], from: 'idle' | 'flinch' | 'critical' | 'ready' | 'attack', demo: boolean, pace?: 'relaxed'): Promise<Start> {
  setDemoMotion(demo);
  if (pace) { setPaceGame(rig.game); setPace(pace); }
  const a = await realActor(rig.subject, rig.folder);
  const s = stepper(a, rig.game);
  for (let i = 0; i < 20; i++) s.frame();
  if (from === 'flinch') {
    a.flinch(340, 340);
    for (let i = 0; i < 14; i++) s.frame(); // the damage beat is 240 ms: the KO event comes while the flinch is still held (340 ms)
  } else if (from !== 'idle') {
    a.setPose(from, { immediate: from === 'critical' });
    for (let i = 0; i < (from === 'attack' ? 3 : 40); i++) s.frame(); // an attack is KO'd in the middle of its move
  }
  const key = a.pose;
  const head = (): [number, number] => { const h = a.landmark('head')!; return [h.x + a.position.x, h.y]; };
  const recs: Array<{ key: string; head: [number, number]; busy: boolean; held: number }> = [];
  a.setPose('ko');
  for (let i = 0; i < 40; i++) { s.frame(); recs.push({ key: a.pose, head: head(), busy: a.blending, held: drawnNow(a).held.size }); }
  setDemoMotion(null); setPaceGame('other'); setPace('steady');
  const cut = recs.findIndex((r) => r.key === 'ko');
  const steps = recs.map((r, i) => (i ? step(recs[i - 1]!.head, r.head) : 0));
  return { key, cut, steps, headAtCut: steps[cut]!, busyAtCut: recs[cut - 1]!.busy, keysSeen: recs.slice(0, cut + 1).map((r) => r.key).filter((k, i, all) => i === 0 || k !== all[i - 1]), heldAtCut: recs[cut]!.held };
}

for (const [regime, R] of Object.entries(REGIME)) {
  for (const rig of REAL) {
    describe(`${rig.folder} (${rig.game === 'ffx' ? 'FFX' : 'FFX-2'} tempo), ${R.label}: a blow finds the figure in another key`, () => {
      let idle: Start;
      beforeAll(async () => { idle = await fallFrom(rig, 'idle', R.demo); });

      for (const from of ['flinch', 'critical', 'ready', 'attack'] as const) {
        it(`from ${from === 'flinch' ? 'the hurt flinch (a lethal blow: the flow players see)' : from === 'attack' ? 'the middle of an attack' : `the ${from} stance`} the fall is the idle's: the bones go to the idle key during the hold, so the head steps ${R.head[rig.game][0]} to ${R.head[rig.game][1]} at the cut, not the 0.56 to 0.65 of the hunched key's`, async () => {
          const f = await fallFrom(rig, from, R.demo);
          if (from !== 'critical' && from !== 'ready') expect(['hurt', 'attack'], 'the figure really was in the other key').toContain(f.key);
          expect(f.keysSeen, 'the key is the idle from the request (the move there is in flight), then the lying key at the cut').toEqual(['idle', 'ko']);
          expect(f.cut, 'the same cut frame as from the idle').toBe(idle.cut);
          expect(f.headAtCut, `the head's step at the cut (${regime}), world units`).toBeGreaterThan(R.head[rig.game][0]);
          expect(f.headAtCut).toBeLessThan(R.head[rig.game][1]);
          expect(Math.abs(f.headAtCut - idle.headAtCut), 'what it is from the idle, to a hundredth').toBeLessThan(0.01);
          expect(Math.max(...f.steps), 'no frame of the whole fall steps the head more than the cut frame does').toBeLessThanOrEqual(f.headAtCut + 1e-9);
          expect(f.busyAtCut, 'the bones are at the idle key before the cut: the cut meets the pose the run was fitted to').toBe(false);
          expect(f.heldAtCut, 'the held figure is there as before').toBeGreaterThanOrEqual(6);
        });
      }

      it('at the slowest pace (relaxed: the key moves take 1.4 and 1.25 times as long on the field clock) the bones are still at the idle key before the cut', async () => {
        const f = await fallFrom(rig, 'flinch', R.demo, 'relaxed');
        expect(f.busyAtCut).toBe(false);
        expect(f.headAtCut).toBeLessThan(R.head[rig.game][1]);
      });
    });
  }
}
