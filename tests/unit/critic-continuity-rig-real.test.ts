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
type RigActorT = import('../../src/engine/rig/RigActor.ts').RigActor;
type ProbeFrame = import('../../critic/runner/lib/continuity-probe.mjs').ProbeFrame;

const CFG = { ringScale: 0.6, ringFrames: 16, maxStrips: 50, cellHeight: 120, encodePerFrame: 2, jpegQuality: 0.7, recentFrames: 14, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 6, afterFrames: 6, cutPx: 120 };
const DT = 1 / 60;

async function riggedActor(): Promise<RigActorT> {
  const r = readRig(makeRigFile());
  if (!r.ok) throw new Error(r.reason);
  const idle = { texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780 }, placeholder: false, url: '/art/characters/testfig/idle.png' };
  const a = await RigActor.createRigged({ name: 'testfig', worldHeight: 1.82, side: 'party', shadow: false }, { data: r.data, base: '/art/rigs/testfig', idlePainting: idle, loadTexture: async () => new Texture() });
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
