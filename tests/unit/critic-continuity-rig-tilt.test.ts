/**
 * The critic's head-to-soles reading of a rigged figure does not fall when the HEAD TURNS (r77 review M1; both games, shared critic plumbing: Tidus is FFX's, Rikku's Dark Knight FFX-2's).
 *
 * The probe read the stature of a rig with a `crown` landmark from that one point to the feet. The point turns with the head bone, so a head tilted 35 degrees (Rikku's cast, rot -0.6061) carried it
 * 2.3 percent of the body below the top of the silhouette and one tilted 64 degrees (Tidus's hurt, rot -1.1106) 7 percent: Tidus's hurt read 0.8596 and his Overdrive 0.8948 against the 0.885 floor
 * (0.90 less the two slacks) while the rig gate, reading the silhouette, gave the painting's own 0.909, and the integration moved Rikku's art to clear the same artefact for her cast key alone. The probe
 * now reads the head as a disc: the head landmark's height plus the posed distance from it to the crown landmark, which a turn of the head leaves where it was.
 *
 * Part 1 pins the reader against a fake actor whose head is turned. Part 2 plays every key of the two shipped pilots (the bones, keys, landmarks and gate of `tools/rig`'s `tidus-v2` and
 * `rikku-dark-knight-v2`, parts cut to quads: `tests/fixtures/rig/real/`) through the real `RigActor`, the real probe and `analyzeRun`, and pins what CHK-026 reads for each change of key.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PerspectiveCamera, Texture } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { createRigReader } from '../../critic/runner/lib/continuity-rig-probe.mjs';

// a canvas the three side never uploads (the same stand-ins `critic-continuity-rig-real.test.ts` uses)
vi.mock('../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});

const { RigActor } = await import('../../src/engine/rig/RigActor.ts');
const { readRig } = await import('../../src/engine/rig/RigData.ts');
const { createProbe } = await import('../../critic/runner/lib/continuity-probe.mjs');
const { analyzeRun } = await import('../../critic/runner/lib/continuity-analyze.mjs');
const { continuityConfig } = await import('../../critic/runner/lib/continuity.mjs');
const { rigProbeConfig } = await import('../../critic/runner/lib/continuity-rig.mjs');
const { loadPoseMeasure } = await import('../../critic/runner/lib/continuity-silhouette.mjs');
type RigActorT = import('../../src/engine/rig/RigActor.ts').RigActor;
type ProbeFrame = import('../../critic/runner/lib/continuity-probe.mjs').ProbeFrame;

const ROOT = resolve(__dirname, '..', '..');
const CFG = { ringScale: 0.6, ringFrames: 16, maxStrips: 50, cellHeight: 120, encodePerFrame: 2, jpegQuality: 0.7, recentFrames: 14, jerkCandidatePx: 28, jerkCandidateRatio: 3, candidateWindow: 8, beforeFrames: 6, afterFrames: 6, cutPx: 120 };
const DT = 1 / 60;

// ---------------------------------------------------------------- part 1: the reader, against a fake actor
const RIG_CFG = { head: ['headCenter', 'head'], centroid: ['bodyCenter', 'pelvisCenter'], feet: ['toeN', 'toeF'], headPart: 'head', crown: ['crown'] };
const P = (p: number[]): number[] => [p[0]!, 900 - p[1]!];
const IDENT = (): number[] => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const v3 = (x: number, y: number) => ({ x, y, z: 0 });
/** The idle plane is 200 x 400 centred on world (400, 500) and the actor sits at (10, 20); `landmarks` are in the actor's local space. */
function fake(landmarks: Record<string, { x: number; y: number }>, roll = 0) {
  const c = Math.cos(roll), s = Math.sin(roll);
  const am = IDENT();
  am[12] = 10; am[13] = 20;
  const plane = { visible: false, matrixWorld: { elements: [200 * c, 200 * s, 0, 0, -400 * s, 400 * c, 0, 0, 0, 0, 1, 0, 400, 500, 0, 1] } };
  return {
    visible: true, showFigure: false, _alpha: 1, active: 0,
    slots: [{ pose: 'idle', fade: 1, meta: { width: 800, height: 1000 }, mesh: plane }, { pose: 'idle', fade: 0, meta: { width: 800, height: 1000 }, mesh: plane }],
    matrixWorld: { elements: am }, pose: 'idle', blending: false,
    rigInfo: () => ({ name: 'tilted', key: 'idle' }),
    landmark: (n: string) => landmarks[n] ?? null,
    feetPoint: () => v3(350, 300), contentQuad: () => [v3(320, 330), v3(480, 330), v3(480, 690), v3(320, 690)],
    figure: { plane: { visible: true, children: [] } },
  };
}
const tuOf = (a: ReturnType<typeof fake>): number[] | undefined => (createRigReader(RIG_CFG).sample(a as never, P, null) as { rg: { tu?: number[] } }).rg.tu;

describe('the top of a rigged head, read as the head\'s disc (r77 review M1)', () => {
  const head = { x: 390, y: 640 };
  it('an untilted head reads where the crown landmark is: straight above the head landmark', () => {
    // the actor at (10, 20): the head is the world's (400, 660), the crown 60 above it, the plane's top is at 700: t = (700 - 720) / 400
    expect(tuOf(fake({ head, crown: { x: 390, y: 700 } }))).toEqual([0.5, -0.05]);
  });

  it('a head turned 35 or 64 degrees about its own landmark reads the same top: the crown point moves round the head, the top does not', () => {
    const at = (deg: number) => { const t = (deg * Math.PI) / 180; return { x: 390 + 60 * Math.sin(t), y: 640 + 60 * Math.cos(t) }; };
    for (const deg of [0, -35, 35, -64, 90]) expect(tuOf(fake({ head, crown: at(deg) })), `${deg} degrees`).toEqual([0.5, -0.05]);
  });

  it('a head carried down (a bow, a fall) still lowers it, by the amount it was carried', () => {
    expect(tuOf(fake({ head: { x: 390, y: 540 }, crown: { x: 390, y: 600 } }))).toEqual([0.5, 0.2]); // 100 lower than the first
  });

  it('is read up the PLANE\'s own vertical when the stage rolls the plane (a lunge), so the idle plane\'s coordinates stay the pose\'s own', () => {
    const roll = 0.3;
    // the same head, turned about itself, and the plane rolled: in the plane's own units the top is the head's t less the head-to-crown distance over the plane's height
    const a = fake({ head, crown: { x: 390, y: 700 } }, roll);
    const t = tuOf(a)!;
    const h = (createRigReader(RIG_CFG).sample(a as never, P, null) as { rg: { hu: number[] } }).rg.hu;
    expect(h[1]! - t[1]!).toBeCloseTo(60 / 400, 3);
    expect(t[0]).toBeCloseTo(h[0]!, 3);
  });

  it('with no head landmark the crown is read as it was, and with no crown there is no top', () => {
    const noHead = createRigReader({ ...RIG_CFG, head: ['nothing'] }).sample(fake({ crown: { x: 450, y: 640 } }) as never, P, null) as { rg: { tu?: number[] } };
    expect(noHead.rg.tu).toEqual([0.8, 0.1]); // the crown point itself: world (460, 660) on the plane centred at (400, 500)
    expect(tuOf(fake({ head }))).toBeUndefined();
  });
});

// ---------------------------------------------------------------- part 2: the two pilots, every key, through the real actor and the analysis
async function actorOf(subject: string, folder: string): Promise<RigActorT> {
  const file = JSON.parse(readFileSync(resolve(ROOT, 'tests', 'fixtures', 'rig', 'real', `${folder}.rig.json`), 'utf8')) as unknown;
  const r = readRig(file);
  if (!r.ok) throw new Error(r.reason);
  const idle = { texture: new Texture(), meta: { width: r.data.image.w, height: r.data.image.h, baselineY: r.data.baselineY }, placeholder: false, url: `/art/characters/${subject}/idle.png` };
  const a = await RigActor.createRigged({ name: subject, worldHeight: 1.82, side: 'party', shadow: false, breathe: false, sway: false }, { data: r.data, base: `/art/rigs/${subject}`, idlePainting: idle, loadTexture: async () => new Texture() });
  a.position.set(0, 0, 0);
  return a;
}

function stageOf(actor: RigActorT, key: string) {
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
    actor.updateMatrixWorld(true);
    for (const w of waiters.splice(0)) w();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { probe, step };
}
interface Row { fromPose: string; toPose: string; counted: boolean; failHeight: boolean; height: { stature: number | null; flags: string[]; basis?: string; class: string } | null }

async function replay(subject: string, folder: string): Promise<Row[]> {
  const actor = await actorOf(subject, folder);
  const { probe, step } = stageOf(actor, subject);
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
  expect(meta.errors).toEqual([]);
  const measure = loadPoseMeasure(resolve(ROOT, 'docs', 'target', 'pose-measure.json'));
  const out = analyzeRun({ meta, records, anchors: meta.poses.map(() => null), cfg: continuityConfig(), measure: measure as never });
  expect(out.swaps).toHaveLength(keys.length * 2);
  return out.swaps as unknown as Row[];
}

const PILOTS = [
  { subject: 'tidus', folder: 'tidus-v2', game: 'FFX', tilted: [['hurt', 0.92, 0.95], ['od-energy-rain', 0.9, 0.93]] as Array<[string, number, number]> },
  { subject: 'rikku-dark-knight', folder: 'rikku-dark-knight-v2', game: 'FFX-2', tilted: [['cast', 0.91, 0.945]] as Array<[string, number, number]> },
];

describe.each(PILOTS)('$subject ($game): every change of key from the idle, read by the harness with the real actor', ({ subject, folder, tilted }) => {
  it('is counted, read head to soles, and no key is out of its stature band', async () => {
    const swaps = await replay(subject, folder);
    expect(swaps.every((s) => s.counted)).toBe(true);
    const fromIdle = swaps.filter((s) => s.fromPose === 'idle');
    expect(fromIdle.length).toBeGreaterThan(5);
    for (const s of fromIdle.filter((x) => x.height && x.height.stature !== null)) {
      expect(s.height!.basis, `${s.toPose} is read head to soles`).toBe('body');
      expect(s.height!.flags, `${s.toPose} (stature ${s.height!.stature})`).toEqual([]);
    }
    expect(swaps.filter((s) => s.failHeight)).toHaveLength(0);
  }, 240_000);

  it.each(tilted)('%s, a key with the head turned, reads the painting\'s side of the floor (between %f and %f of the idle), not the crown point\'s', async (key, lo, hi) => {
    const swaps = await replay(subject, folder);
    const s = swaps.find((x) => x.fromPose === 'idle' && x.toPose === key)!;
    expect(s.height!.stature).toBeGreaterThan(lo);
    expect(s.height!.stature).toBeLessThan(hi);
    expect(s.height!.flags).toEqual([]);
  }, 240_000);
});
