/**
 * A REAL `RigActor` in the continuity harness (R58-T1 of the release 58 focused review).
 *
 * Release 58 shipped the harness's rig reader (R57-002) and tested it against fakes: a hand-built actor whose `showFigure` was `true`. The running game's `RigActor` passes `figure: false` to
 * `PaintedActor` (a rig draws no plane, so the carrier's meshes are never shown), which leaves `showFigure === false` and every carrier mesh invisible. The probe's `sampleRig` read that as
 * "the figure is not showing": it logged the change of key as a swap, then returned before it stored a frame, so the analysis found no frame at the swap and set `notShowing` on all of them
 * (`coverage.rigs`: every swap listed, `counted` 0, in Chapter III, Chapter XIV and Seymour Flux; nothing for a rig was ever measured, and CHK-026 and CHK-027 passed on painted figures only).
 *
 * This test builds the engine's own `RigActor` from the rig test fixture, puts it on a stage as the probe finds it in the game, drives it through a fight's worth of key changes with the
 * engine's own `update`, and reads the recording back through `analyzeRun`. Nothing about the actor is faked but the stage around it (a camera, a canvas, the debug surface).
 *
 * Game case: both (shared critic plumbing; the rigs it reads are FFX's Kimahri, Lulu and aeons and Valefor, which FFX-2's Besaid chapter shares).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PerspectiveCamera, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { makeRigFile } from './rig/rig-fixture.ts';

// a canvas the three side never uploads (the same stand-ins `rig/rig-actor.test.ts` uses)
vi.mock('../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../src/engine/rig/RigData.ts');
const { createProbe } = await import('../../critic/runner/lib/continuity-probe.mjs');
const { createRigReader } = await import('../../critic/runner/lib/continuity-rig-probe.mjs');
const { analyzeRun } = await import('../../critic/runner/lib/continuity-analyze.mjs');
const { continuityConfig } = await import('../../critic/runner/lib/continuity.mjs');
const { rigProbeConfig } = await import('../../critic/runner/lib/continuity-rig.mjs');
const { loadPoseMeasure } = await import('../../critic/runner/lib/continuity-silhouette.mjs');
type RigActorT = import('../../src/engine/rig/RigActor.ts').RigActor;
type ProbeFrame = import('../../critic/runner/lib/continuity-probe.mjs').ProbeFrame;

const CFG = { ringScale: 0.6, ringFrames: 16, maxStrips: 50, cellHeight: 120, encodePerFrame: 2, jpegQuality: 0.7, recentFrames: 14, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 6, afterFrames: 6, cutPx: 120 };
const DT = 1 / 60;

/** The test fixture's rig, or (with `shipped`) a rig file as the game ships it, built into the engine's own RigActor with the textures stubbed. */
async function riggedActor(shipped?: { name: string; json: unknown }): Promise<RigActorT> {
  const name = shipped?.name ?? 'testfig';
  const r = readRig(shipped ? shipped.json : makeRigFile());
  if (!r.ok) throw new Error(r.reason);
  const idle = { texture: new Texture(), meta: { width: r.data.image.w, height: r.data.image.h, baselineY: r.data.baselineY }, placeholder: false, url: `/art/characters/${name}/idle.png` };
  const a = await RigActor.createRigged({ name, worldHeight: 1.82, side: 'party', shadow: false }, { data: r.data, base: `/art/rigs/${name}`, idlePainting: idle, loadTexture: async () => new Texture() });
  a.position.set(0, 0, 0);
  return a;
}

/** The game's stage around one actor, as the probe finds it: a battle screen on the app's stack, a camera looking at the actor, a canvas, the debug surface's `battleState`. */
function stageOf(actor: RigActorT, key: string): { probe: ReturnType<typeof createProbe>; camera: PerspectiveCamera; step(): Promise<void> } {
  let now = 1000;
  const waiters: (() => void)[] = [];
  const camera = new PerspectiveCamera(30, 16 / 9, 0.1, 100);
  camera.position.set(0, 1.0, 9);
  camera.lookAt(0, 0.9, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  const canvas = { width: 1600, height: 900, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) };
  const screen = { name: 'battle', fieldShown: true, stage: { actors: new Map([[key, { actor, side: 'party', kind: 'party', artId: key }]]), opts: { camera, canvas } } };
  const app = { screens: [screen], nextFrame: () => new Promise<void>((resolve) => waiters.push(resolve)) };
  const win = { __pyrefly: { app, battleState: () => ({ log: [] }) } };
  const doc = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: () => undefined }), toDataURL: () => 'data:image/jpeg;base64,QUJD' }) };
  const probe = createProbe(CFG, { window: win, document: doc, performance: { now: () => now }, rig: createRigReader(rigProbeConfig(continuityConfig())!) });
  const step = async (): Promise<void> => {
    now += 1000 / 60;
    actor.update(DT);
    actor.updateMatrixWorld(true); // the game's renderer does this before the probe runs
    for (const w of waiters.splice(0)) w();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { probe, camera, step };
}

/** A fight's worth of key changes of one figure: hurt, back to idle, a lunge (ready, attack, back), a knock-out and the stand-up. */
async function playFight(): Promise<{ probe: ReturnType<typeof createProbe>; actor: RigActorT; frames: number }> {
  const actor = await riggedActor();
  const { probe, step } = stageOf(actor, 'testfig');
  probe.start();
  let frames = 0;
  const run = async (n: number): Promise<void> => { for (let i = 0; i < n; i++) { await step(); frames++; } };
  await run(30);
  actor.setPose('hurt'); await run(40);
  actor.setPose('idle'); await run(40);
  actor.setPose('ready'); await run(40);
  actor.setPose('attack'); await run(50);
  actor.setPose('idle'); await run(40);
  actor.setPose('ko'); await run(60);
  actor.setPose('idle', { force: true }); await run(60);
  return { probe, actor, frames };
}

describe('a real RigActor on the probe\'s stage', () => {
  it('is what the game builds: a rig draws no plane, so the actor is not "showing a figure" and its carrier meshes are hidden (the surface the first reader got wrong)', async () => {
    const actor = await riggedActor();
    const a = actor as unknown as { showFigure: boolean; slots: { mesh: { visible: boolean } }[]; visible: boolean };
    expect(a.showFigure).toBe(false);
    expect(a.slots.every((s) => !s.mesh.visible)).toBe(true);
    expect(a.visible).toBe(true);
    expect(actor.alpha).toBe(1);
  });

  it('records the rigged figure on every frame it is on the field, not only the frames a painted figure would be "showing"', async () => {
    const { probe, frames } = await playFight();
    const meta = probe.meta();
    expect(meta.figs.map((f: { id: string; rig?: string }) => [f.id, f.rig])).toEqual([['testfig', 'testfig']]);
    const drained = probe.drain(100000).records as ProbeFrame[];
    expect(drained.length).toBeGreaterThanOrEqual(frames - 2); // before the fix: 0 of them (sampleRig returned before it stored a frame)
    const f = drained.at(-1)!.f[0]!;
    expect(f.rg).toBeDefined();
    expect(f.rg!.pw).toBeGreaterThan(0);
  });

  it('measures the figure\'s changes of key: every swap of the fight is counted, none is dropped as "not showing"', async () => {
    const { probe } = await playFight();
    const meta = probe.meta();
    const records = probe.drain(100000).records as ProbeFrame[];
    const keys = meta.swaps.map((s: { from: number; to: number }) => `${meta.poses[s.from]!.pose}>${meta.poses[s.to]!.pose}`);
    expect(keys).toEqual(['idle>hurt', 'hurt>idle', 'idle>ready', 'ready>attack', 'attack>idle', 'idle>ko', 'ko>idle']);
    expect(meta.errors).toEqual([]);
    expect(meta.strips.length).toBeGreaterThan(0); // the strips of a rig's swaps are made too (before the fix none was: a strip starts only for a figure that is showing)
    const run = analyzeRun({ meta, records, anchors: meta.poses.map(() => null), cfg: continuityConfig() });
    const mine = run.swaps.filter((s) => s.figure === 'testfig');
    expect(mine).toHaveLength(keys.length);
    expect(mine.filter((s) => s.notShowing)).toHaveLength(0);
    expect(mine.filter((s) => s.counted).length).toBeGreaterThanOrEqual(keys.length - 1); // a swap interrupted by the next one is not counted as settled, never dropped
    const coverage = run.coverage as { rigs: { figure: string; swaps: number; counted: number; settled: number; headMeasured: number }[]; measuredFromRig: string[] };
    const cov = coverage.rigs.find((r) => r.figure === 'testfig')!;
    expect(cov.swaps).toBe(keys.length);
    expect(cov.counted).toBeGreaterThanOrEqual(keys.length - 1);
    expect(cov.settled).toBeGreaterThan(0);
    expect(cov.headMeasured).toBeGreaterThan(0);
    expect(coverage.measuredFromRig).toContain('testfig');
    expect(run.summary.size.rigSwaps).toBeGreaterThan(0);
  });

  it('still leaves a rig that is hidden or faded out unrecorded: the field flag, not the carrier\'s, decides', async () => {
    const actor = await riggedActor();
    const { probe, step } = stageOf(actor, 'testfig');
    probe.start();
    for (let i = 0; i < 6; i++) await step();
    const shown = probe.records.length;
    expect(shown).toBeGreaterThan(0);
    actor.visible = false;
    for (let i = 0; i < 6; i++) await step();
    expect(probe.records.length).toBe(shown);
    actor.visible = true;
    actor.setAlpha(0);
    for (let i = 0; i < 6; i++) await step();
    expect(probe.records.length).toBe(shown);
    actor.setAlpha(1);
    for (let i = 0; i < 6; i++) await step();
    expect(probe.records.length).toBeGreaterThan(shown);
  });
});

// The five rigs the game ships, from their own rig.json (the art is gitignored and lives in the release art mirror, so this runs where `public/art/rigs` is and is skipped elsewhere): the key names, the landmark
// names, the gate's stamped boxes and the skinned meshes are the real ones, which a hand-built rig is not. The rigs are played through hurt, knock-out and one more key and back to the idle. This pins that every
// change of key of a real rig is COUNTED (read at both ends, head and feet measured); whether a key passes CHK-026 is the rig's and the check's, not asserted here.
const RIGS_DIR = resolve(__dirname, '..', '..', 'public', 'art', 'rigs');
const SHIPPED = ['kimahri', 'lulu', 'valefor', 'ifrit', 'pterya'].filter((n) => existsSync(resolve(RIGS_DIR, n, 'rig.json')));

describe.skipIf(SHIPPED.length === 0)('the rigs the game ships, from their own files', () => {
  it.each(SHIPPED)('%s: every change of key is counted, settled and measured', async (name) => {
    const json = JSON.parse(readFileSync(resolve(RIGS_DIR, name, 'rig.json'), 'utf8')) as unknown;
    const actor = await riggedActor({ name, json });
    const { probe, step } = stageOf(actor, name);
    probe.start();
    const run = async (n: number): Promise<void> => { for (let i = 0; i < n; i++) await step(); };
    await run(20);
    const keys = ['hurt', 'ko', ...actor.poseNames.filter((k) => !['idle', 'hurt', 'ko'].includes(k)).slice(0, 1)].filter((k) => actor.poseNames.includes(k));
    for (const k of keys) {
      actor.setPose(k, { force: true });
      await run(30);
      actor.setPose('idle', { force: true });
      await run(30);
    }
    const meta = probe.meta();
    const records = probe.drain(100000).records as ProbeFrame[];
    expect(meta.errors).toEqual([]);
    expect(meta.swaps).toHaveLength(keys.length * 2);
    const out = analyzeRun({ meta, records, anchors: meta.poses.map(() => null), cfg: continuityConfig() });
    const cov = (out.coverage as { rigs: { figure: string; rig: string; swaps: number; counted: number; settled: number; headMeasured: number; feetMeasured: number }[] }).rigs.find((r) => r.figure === name);
    expect(cov, `${name} is in coverage.rigs`).toBeDefined();
    expect(cov).toMatchObject({ rig: name, swaps: keys.length * 2, counted: keys.length * 2, settled: keys.length * 2, headMeasured: keys.length * 2, feetMeasured: keys.length * 2 });
    expect(out.swaps.filter((w) => w.figure === name && w.notShowing)).toHaveLength(0);
    expect(out.summary.size.rigSwaps).toBe(keys.length * 2);
  }, 120_000);
});

// R59, decision 146 (both games, review tooling). Every key of Lulu and Kimahri played from their own rig.json and read with the pose registration records (docs/target/pose-measure.json), as a real run reads
// them. Lulu's defend and od-fury bring in a front-view upper body and shrink her side head to 0.8, so the head part's mesh read 0.80 and 1.25 (a 25 percent head jump) in those four changes of key; they
// are now read as a change of head (the head the registration gives the key, 0.959 and 1.029 of the idle's, inside the standing band 0.85 to 1.15) and the mesh ratio is not compared. Kimahri's follow key
// (1.29 of the idle's height, PR-0462, the spear bone's scale of 1.327) is a real defect of the rig and still fails on its height. The head meshes of the keys that keep the same head part are read as before.
describe.skipIf(!SHIPPED.includes('lulu') || !SHIPPED.includes('kimahri'))('a front-view key is not a head jump, and a real defect is still one', () => {
  const MEASURE = loadPoseMeasure(resolve(__dirname, '..', '..', 'docs', 'target', 'pose-measure.json'));
  type Row = { fromPose: string; toPose: string; counted: boolean; failHead: boolean; failHeight: boolean; failRealHead?: boolean; head: { metric: string; ratio: number | null } | null; headReal: { ratio: number; outsideBand: boolean; band: number[] } | null; height: { stature: number | null; flags: string[] } | null; rig: { headMetric: string | null } };
  const replay = async (name: string, measure: unknown): Promise<Row[]> => {
    const json = JSON.parse(readFileSync(resolve(RIGS_DIR, name, 'rig.json'), 'utf8')) as unknown;
    const actor = await riggedActor({ name, json });
    const { probe, step } = stageOf(actor, name);
    probe.start();
    const run = async (n: number): Promise<void> => { for (let i = 0; i < n; i++) await step(); };
    await run(20);
    const keys = actor.poseNames.filter((k) => k !== 'idle');
    for (const k of keys) {
      actor.setPose(k, { force: true });
      await run(40);
      actor.setPose('idle', { force: true });
      await run(40);
    }
    const meta = probe.meta();
    const records = probe.drain(100000).records as ProbeFrame[];
    const out = analyzeRun({ meta, records, anchors: meta.poses.map(() => null), cfg: continuityConfig(), measure: measure as never });
    expect(meta.errors).toEqual([]);
    expect(out.swaps).toHaveLength(keys.length * 2);
    expect(out.swaps.every((w) => w.counted)).toBe(true);
    return out.swaps as unknown as Row[];
  };

  it('lulu: defend and od-fury (four changes of key) swap the head and pass on the head the registration gives them; the first reading, without the records, only shows them', async () => {
    const swaps = await replay('lulu', MEASURE);
    const front = swaps.filter((s) => ['defend', 'od-fury'].includes(s.fromPose) || ['defend', 'od-fury'].includes(s.toPose));
    expect(front).toHaveLength(4);
    for (const s of front) {
      expect(s.rig.headMetric).toBe('variant');
      expect(s.head).toMatchObject({ metric: 'variant', ratio: null }); // no mesh ratio: not 0.8, not 1.25
      expect(s.failHead).toBe(false);
      expect(s.headReal!.band).toEqual([0.85, 1.15]);
      expect(s.headReal!.outsideBand).toBe(false);
      expect(s.failRealHead).toBe(false);
    }
    expect(front.filter((s) => s.toPose === 'defend' || s.fromPose === 'defend').map((s) => s.headReal!.ratio)).toEqual([0.959, 0.959]);
    expect(front.filter((s) => s.toPose === 'od-fury' || s.fromPose === 'od-fury').map((s) => s.headReal!.ratio)).toEqual([1.029, 1.029]);
    // every other change of key keeps the head part on both sides and is read by its mesh as before
    expect(swaps.filter((s) => !front.includes(s)).every((s) => s.rig.headMetric === 'head')).toBe(true);
    const bare = await replay('lulu', null); // without the registration records: shown, not judged
    expect(bare.filter((s) => s.rig.headMetric === 'variant').every((s) => s.headReal === null && !s.failHead && !s.failRealHead)).toBe(true);
    expect(bare.filter((s) => s.rig.headMetric === 'variant')).toHaveLength(4);
  }, 240_000);

  it('kimahri: the follow key is still 1.29 of the idle\'s height and still fails CHK-026 on it (PR-0462), with or without the records', async () => {
    for (const measure of [MEASURE, null]) {
      const swaps = await replay('kimahri', measure);
      const follow = swaps.filter((s) => s.fromPose === 'follow' || s.toPose === 'follow');
      expect(follow).toHaveLength(2);
      for (const s of follow) {
        expect(s.height!.stature).toBeGreaterThan(1.28);
        expect(s.height!.stature).toBeLessThan(1.30);
        expect(s.height!.flags).toEqual(['stature-high']);
        expect(s.failHeight).toBe(true);
      }
      expect(swaps.filter((s) => s.failHeight)).toHaveLength(2); // and it is the only key outside its height band
      expect(swaps.every((s) => s.rig.headMetric === 'head')).toBe(true); // Kimahri has no second head: every change of key keeps the mesh reading
    }
  }, 240_000);
});
