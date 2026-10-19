/**
 * A RIGGED figure in the continuity harness (R57-002 of the release 57 focused review): the page-side reader (`critic/runner/lib/continuity-rig-probe.mjs`) against a fake rig actor with the
 * public surface of `RigActor` (`rigInfo`, `pose`, `blending`, `landmark`, `feetPoint`, `contentQuad`, `figure.plane.children`), and the probe (`continuity-probe.mjs`) with that reader beside it.
 * Release 57 and every release before it read a rig as a painted figure: its carrier plane stays on the idle painting, so a rigged knock-out was no swap, no stature and no feet, and the
 * checks passed having measured nothing. What the harness does with what these record is in `critic-continuity-rig-analyze.test.ts`.
 *
 * Game case: both (shared critic plumbing; the rigs it reads are FFX's Kimahri, Lulu and aeons and Valefor, which FFX-2's Besaid chapter shares).
 */
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { createProbe } from '../../critic/runner/lib/continuity-probe.mjs';
import type { ProbeConfig } from '../../critic/runner/lib/continuity-probe.mjs';
import { createRigReader } from '../../critic/runner/lib/continuity-rig-probe.mjs';
import type { RigSample } from '../../critic/runner/lib/continuity-rig-probe.mjs';

const CFG: ProbeConfig = { ringScale: 0.6, ringFrames: 16, maxStrips: 50, cellHeight: 120, encodePerFrame: 2, jpegQuality: 0.7, recentFrames: 14, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 6, afterFrames: 6, cutPx: 120 };
const RIG_CFG = { head: ['headCenter', 'head'], centroid: ['bodyCenter', 'pelvisCenter'], feet: ['toeN', 'toeF'], headPart: 'head' };
/** Screen (x, y down) = (world x, 900 - world y): a camera that looks straight at a 1600x900 canvas, y up in the world. */
const PROJ = [1 / 800, 0, 0, 0, 0, 1 / 450, 0, 0, 0, 0, 1, 0, -1, -1, 0, 1];
const IDENT = (): number[] => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const P = (p: number[]): number[] => [p[0]!, 900 - p[1]!];

/** A mesh whose position attribute holds `tris` triangles (x, y, z each), not indexed: the area of the first is a half of the area of the two. */
const mesh = (name: string, w: number, h: number, visible = true) => ({ name, visible, geometry: { index: null, getAttribute: () => ({ array: new Float32Array([0, 0, 0, w, 0, 0, w, h, 0, 0, 0, 0, w, h, 0, 0, h, 0]) }) } });
const v3 = (x: number, y: number) => ({ x, y, z: 0 });

/** The idle plane is 200 x 400 centred on world (400, 500); the actor sits at (10, 20), so a landmark's local (390, 640) is the world's (400, 660). */
function fakeRig(over: { rigInfo?: () => unknown } = {}) {
  const state = { pose: 'idle', busy: false, box: [v3(320, 330), v3(480, 330), v3(480, 690), v3(320, 690)] as { x: number; y: number; z: number }[], feet: v3(350, 300) as { x: number; y: number; z: number } | null };
  const plane = { visible: true, matrixWorld: { elements: [200, 0, 0, 0, 0, 400, 0, 0, 0, 0, 1, 0, 400, 500, 0, 1] } };
  const am = IDENT();
  am[12] = 10; am[13] = 20;
  const actor = {
    // as the running game's RigActor is: it hands PaintedActor `figure: false` (a rig draws no plane), so showFigure is false and the carrier's meshes are hidden for its whole life (R58-T1:
    // the reader's fake had showFigure true, which is why release 58's tests passed while no rig swap was ever counted in a real run; `critic-continuity-rig-real.test.ts` drives the real RigActor)
    visible: true, showFigure: false, _alpha: 1, active: 0,
    slots: [{ pose: 'idle', fade: 1, meta: { width: 800, height: 1000 }, mesh: { ...plane, visible: false } }, { pose: 'idle', fade: 0, meta: { width: 800, height: 1000 }, mesh: { ...plane, visible: false } }],
    poseUrls: { idle: '/art/characters/valefor/idle.png' } as Record<string, string>,
    matrixWorld: { elements: am },
    get pose() { return state.pose; }, get blending() { return state.busy; },
    rigInfo: over.rigInfo ?? (() => ({ name: 'valefor', key: state.pose })),
    landmark: (n: string) => (n === 'head' ? { x: 390, y: 640 } : n === 'bodyCenter' ? { x: 390, y: 480 } : null),
    feetPoint: () => state.feet,
    contentQuad: () => state.box,
    figure: { plane: { visible: true, children: [mesh('head', 0.2, 0.1), mesh('body', 0.5, 0.3), mesh('wing', 0.4, 0.4, false)] } },
  };
  return { actor, state };
}

describe('the page-side reader of a rigged figure', () => {
  it('knows a rig by the public surface of RigActor and a painted figure by its lack of it', () => {
    const r = createRigReader(RIG_CFG);
    expect(r.is(fakeRig().actor)).toBe(true);
    expect(r.is({ slots: [], pose: 'idle' })).toBe(false);
    expect(r.is(null)).toBe(false);
  });

  it('reads the head, feet and centroid on the screen and in the idle plane\'s own coordinates, the key\'s box and the mesh areas', () => {
    const s = createRigReader(RIG_CFG).sample(fakeRig().actor, P, null) as RigSample;
    expect(s.name).toBe('valefor');
    expect(s.key).toBe('idle');
    expect(s.rg.h).toEqual([400, 240]); // the actor's own transform is in the landmark: local (390, 640) at (10, 20) is world (400, 660)
    expect(s.rg.hu).toEqual([0.5, 0.1]); // 100 px right of the plane's left edge of 200, 40 px below its top of 400
    expect(s.rg.f).toEqual([350, 600]);
    expect(s.rg.fu).toEqual([0.25, 1]);
    expect(s.rg.c).toEqual([400, 400]);
    expect(s.rg.cu).toEqual([0.5, 0.5]);
    expect(s.q).toEqual([320, 210, 480, 210, 480, 570, 320, 570]); // top-left, top-right, bottom-right, bottom-left, as a plane's corners are
    expect(s.rg.bh).toBeCloseTo(0.9, 4); // the box is 360 of the plane's 400 high
    expect(s.rg.bw).toBeCloseTo(0.4, 4);
    expect([s.rg.pw, s.rg.ph]).toEqual([200, 400]);
    expect(s.rg.ha).toBeCloseTo(0.02, 6); // the head part: a 0.2 x 0.1 rectangle
    expect(s.rg.ma).toBeCloseTo(0.02 + 0.15, 6); // every DRAWN part: the hidden wing is not in it
    expect(s.rg.b).toBe(0);
    expect(s.rg.cs).toBeUndefined();
  });

  it('says a move between two keys is in flight, and how far the camera alone moved each point while it moves', () => {
    const { actor, state } = fakeRig();
    state.busy = true;
    const s = createRigReader(RIG_CFG).sample(actor, P, (p) => [p[0]! + 50, 900 - p[1]!]) as RigSample;
    expect(s.busy).toBe(true);
    expect(s.rg.b).toBe(1);
    expect(s.rg.cs).toEqual([-50, 0, -50, 0, -50, 0]); // the head, the feet and the centroid
  });

  it('takes the first landmark name the rig has, and falls back to the soles when the gate stamped no foot', () => {
    const { actor, state } = fakeRig();
    state.feet = null;
    const lm = actor.landmark;
    actor.landmark = (n: string) => (n === 'toeN' ? { x: 340, y: 280 } : n === 'toeF' ? { x: 360, y: 290 } : n === 'headCenter' ? null : lm(n));
    const s = createRigReader(RIG_CFG).sample(actor, P, null) as RigSample;
    expect(s.rg.h).toEqual([400, 240]); // headCenter is not on this rig, head is
    expect(s.rg.f).toEqual([360, 595]); // the mean of the two toes, world (350, 300) and (370, 310): the actor's (10, 20) is in them
  });

  it('is self-contained: stringified into a bare context, as the harness puts it into the page, it reads the same', () => {
    const { actor } = fakeRig();
    const inPage = runInNewContext(`(${createRigReader})(${JSON.stringify(RIG_CFG)})`) as ReturnType<typeof createRigReader>;
    const here = createRigReader(RIG_CFG).sample(actor, P, null);
    const there = inPage.sample(actor, P, null);
    expect(inPage.is(actor)).toBe(true);
    expect(JSON.parse(JSON.stringify(there))).toEqual(JSON.parse(JSON.stringify(here)));
  });

  it('reads nothing of a rig that is not built yet', () => {
    const r = createRigReader(RIG_CFG);
    expect(r.sample(fakeRig({ rigInfo: () => { throw new Error('no rig yet'); } }).actor, P, null)).toBeNull();
  });
});

interface Page {
  probe: ReturnType<typeof createProbe>;
  state: ReturnType<typeof fakeRig>['state'];
  camera: { matrixWorldInverse: { elements: number[] } };
  step(dt?: number): Promise<void>;
}

function page(withReader: boolean): Page {
  let now = 1000;
  const waiters: (() => void)[] = [];
  const { actor, state } = fakeRig();
  const camera = { projectionMatrix: { elements: PROJ }, matrixWorldInverse: { elements: IDENT() } };
  const canvas = { width: 1600, height: 900, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1600, height: 900 }) };
  const screen = { name: 'battle', fieldShown: true, stage: { actors: new Map([['valefor', { actor, side: 'party', kind: 'party', artId: 'valefor' }]]), opts: { camera, canvas } } };
  const app = { screens: [screen], nextFrame: () => new Promise<void>((resolve) => waiters.push(resolve)) };
  const win = { __pyrefly: { app, battleState: () => ({ log: [] }) } };
  const doc = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: () => undefined }), toDataURL: () => 'data:image/jpeg;base64,QUJD' }) };
  const probe = createProbe(CFG, { window: win, document: doc, performance: { now: () => now }, ...(withReader ? { rig: createRigReader(RIG_CFG) } : {}) });
  const step = async (dt = 16.7): Promise<void> => { now += dt; for (const w of waiters.splice(0)) w(); await new Promise((r) => setTimeout(r, 0)); };
  return { probe, state, camera, step };
}

describe('the probe with the rig reader beside it', () => {
  it('records a change of the rig\'s key as a swap, with the rig named and no painting url to read', async () => {
    const p = page(true);
    p.probe.start();
    for (let i = 0; i < 4; i++) await p.step();
    expect(p.probe.swaps).toHaveLength(0);
    p.state.pose = 'ko'; p.state.busy = true;
    await p.step();
    expect(p.probe.swaps).toHaveLength(1);
    expect(p.probe.swaps[0]).toMatchObject({ i: 0, from: 0, to: 1, rig: 1 });
    const m = p.probe.meta();
    expect(m.figs[0]).toEqual({ id: 'valefor', side: 'party', kind: 'party', artId: 'valefor', rig: 'valefor' });
    expect(m.poses.map((q) => [q.pose, q.url, q.rig])).toEqual([['idle', null, 'valefor'], ['ko', null, 'valefor']]);
  });

  it('records, on every frame of the figure, where its head, feet and centroid are, with the key\'s box as its one plane', async () => {
    const p = page(true);
    p.probe.start();
    for (let i = 0; i < 3; i++) await p.step();
    const f = p.probe.records.at(-1)!.f[0]!;
    expect(f.rg).toMatchObject({ b: 0, h: [400, 240], f: [350, 600], c: [400, 400], hu: [0.5, 0.1], fu: [0.25, 1] });
    expect(f.s[0]).toEqual([0, 1, 1, 320, 210, 480, 210, 480, 570, 320, 570]); // the box, in the shape of a plane record
    expect(f.s[1]).toBe(0);
    expect(f.g).toEqual([0, 0]);
  });

  it('follows the camera for a rig as for a painting: how far the camera alone moved the figure, and each tracked point', async () => {
    const p = page(true);
    p.probe.start();
    await p.step(); await p.step();
    p.camera.matrixWorldInverse.elements[12] = -50;
    await p.step();
    const f = p.probe.records.at(-1)!.f[0]!;
    expect(f.g[0]).toBeCloseTo(-50, 0);
    expect(f.rg!.cs).toEqual([-50, 0, -50, 0, -50, 0]);
  });

  it('did not see a rigged key change before the reader: the carrier plane stays on its idle, so there was no swap (the defect)', async () => {
    const p = page(false);
    p.probe.start();
    for (let i = 0; i < 3; i++) await p.step();
    p.state.pose = 'ko'; p.state.busy = true;
    for (let i = 0; i < 3; i++) await p.step();
    expect(p.probe.swaps).toHaveLength(0);
    expect(p.probe.records.at(-1)?.f[0]?.rg).toBeUndefined(); // a real rig has showFigure false, so the painted reader stored no frame of it at all
  });
});
