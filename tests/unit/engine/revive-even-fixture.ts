/**
 * The fixture of the r74 revive tests (`revive-even-cross.test.ts`, `revive-even-cross-run.test.ts`; both games): the REAL `PaintedActor` under the REAL `LivingFigure` and `layProneFigures`, stepped at any rate
 * (with the stage's clock for the eased slide, or with a live run's frame times), and read the way the continuity harness reads a figure (`figureTrack`, `detectJerks`, the policy's own thresholds) with the
 * harness's own anchors. See `revive-even-cross.test.ts` for what is asserted and why.
 */
import { resolve } from 'node:path';
import { layProneFigures } from '../../../src/engine/ProneLay.ts';
import { setDemoMotion } from '../../../src/engine/motion/DemoMotion.ts';
import { cameraAt, viewOf } from './head-lock-fixture.ts';
import { CFG, ctxOf, figure, record, rig, slots, type Rig } from './ko-fall-fixture.ts';
import { detectJerks, figureTrack } from '../../../critic/runner/lib/continuity-pure.mjs';
import { anchorsFor, loadPoseMeasure } from '../../../critic/runner/lib/continuity-silhouette.mjs';

export const ROOT = resolve(__dirname, '..', '..', '..');
export const measure = loadPoseMeasure(resolve(ROOT, 'docs', 'target', 'pose-measure.json'));
export const HZS = [60, 120, 144];

/**
 * **The page, not the headless engine** (round 33b's review of the first r74 commit): in a page the demo motion is ON by default (`DemoMotion.ts`, release 60), so a revive's old cross is `koCrossMs()` = 100 ms (six frames
 * at 60 Hz), not the 75 ms of a test with no `location`; and the live stage's camera draws Wakka's standing painting 460 to 474 px tall at 1600 wide (the release-73 Yunalesca recording, its live arm: 462, 471, 460 px),
 * not the 398 px of `cameraAt(3)` at 8 units out. The first commit's tests ran the headless world and so read its 160 ms cross a quarter too small (34.7 px for Wakka; the page world reads 43.4, over the 40 px line). Every test that reads a
 * step in px runs in this world: {@link pageWorld} in `beforeEach`, {@link leavePage} in `afterEach`.
 */
export const LIVE_CAM_Z = 6.4;
/** Wakka's standing (idle) painting at rest, px tall at 1600 wide, in the live recording: 460 to 474 (a guard in `revive-even-cross-run.test.ts` holds the fixture's camera to it). */
export const LIVE_WAKKA_QUAD_PX = [455, 480] as const;
/** Put the process in the page's world: the demo motion on, as in a page with no `?motion=` word. */
export function pageWorld(): void {
  setDemoMotion(true);
}
/** Leave it again (the headless default: off). */
export function leavePage(): void {
  setDemoMotion(null);
}
/** The harness's jerk limit for one frame (`policy.json` continuity.motion.jerkFailPx), px at 1600 wide. */
export const LIMIT = CFG.motion.jerkFailPx;

/**
 * Where each KO painting's silhouette is lowest, as the harness reads a lying body's "stance" (`estimateStance` of the alpha at 320 px, normalised): the registration leaves a lying body's stance null, so
 * the feet of a lying painting are this point (Wakka's is at the head end of the painting, which is why the weighted feet travel so far). Measured 2026-11-02 from the approved paintings.
 */
export const KO_STANCE: Record<string, { u: number; t: number }> = {
  wakka: { u: 0.7969, t: 0.9909 },
  kimahri: { u: 0.5297, t: 0.981 },
  rikku: { u: 0.7734, t: 0.9675 },
  auron: { u: 0.275, t: 1 },
  lulu: { u: 0.0453, t: 0.9704 },
  yuna: { u: 0.6297, t: 0.986 },
  tidus: { u: 0.0828, t: 0.9697 },
  'yuna-songstress': { u: 0.3969, t: 0.9485 },
  'rikku-thief': { u: 0.5672, t: 0.9669 },
  'paine-warrior': { u: 0.1672, t: 0.9636 },
};
/** FFX: Tidus, Yuna, Auron, Wakka, Lulu, Kimahri, Rikku. FFX-2: the dresspheres (Yuna's songstress, Rikku's thief, Paine's warrior). */
export const FFX = ['tidus', 'yuna', 'auron', 'wakka', 'lulu', 'kimahri', 'rikku'];
export const FFX2 = ['yuna-songstress', 'rikku-thief', 'paine-warrior'];
/** Every figure the tests revive: in the page world release 73's cross steps each of them 42 to 85 px in one frame at 60 Hz (the harness's maths, real masks). */
export const ALL = [...FFX, ...FFX2];

/** The harness's anchors for a figure's two planes: the record's registered head and stance (`anchorsFor`), and a lying painting's silhouette stance from the table. */
export function anchorsOf(r: Rig, subject: string): Array<Record<string, unknown>> {
  return slots(r.a).map((s) => {
    const url = `/art/characters/${subject}/${s.pose}.png`;
    const rec = measure?.subjects?.[subject]?.poses?.[s.pose] as { size: [number, number] } | undefined;
    const mask = { w: 16, h: 16, bits: new Uint8Array(256).fill(1), srcW: rec?.size[0] ?? 16, srcH: rec?.size[1] ?? 16 };
    const an = anchorsFor({ url, mask, measure }) as unknown as Record<string, unknown>;
    return s.pose === 'ko' ? { ...an, stance: KO_STANCE[subject], stanceSrc: 'silhouette' } : an;
  });
}

export interface Scene {
  r: Rig;
  all: ReturnType<typeof figure>[];
  hz: number;
  /** The stage's clock for the eased slide (`slideEaseDt`), or undefined for release 71's whole slide on the first frame. */
  eased: boolean;
  game: 'ffx' | 'ffx2';
  /** Frame times in ms, cycled (a live run's 15 to 19 ms), or undefined for a steady 1000 / hz. */
  frameMs?: readonly number[];
  n: number;
}

/** One frame of the game at `hz`, in the order of the stage: the mix, the actor, `layProneFigures` (with the clock where the slide eases), the head lock. */
export function step(s: Scene): void {
  const dt = (s.frameMs ? s.frameMs[s.n++ % s.frameMs.length]! : 1000 / s.hz) / 1000;
  s.r.living.update(ctxOf({ dt, realDt: dt, game: s.game }));
  for (const a of s.all) a.update(dt, dt);
  layProneFigures(s.all, s.r.cam, undefined, undefined, s.eased ? dt : undefined);
  for (const a of s.all) a.holdHead(viewOf(s.r.cam));
  for (const a of s.all) a.updateMatrixWorld(true);
}

/** A figure knocked down at `hz` and left lying for `lieMs` (a neighbour standing beside it when `neighbour`, so the stage slides the body). */
export function downed(subject: string, hz: number, lieMs = 1200, opts: { neighbour?: boolean; eased?: boolean; game?: 'ffx' | 'ffx2'; camZ?: number } = {}): Scene {
  const r = rig(subject, { game: opts.game ?? 'ffx' });
  r.cam = cameraAt(3, opts.camZ ?? LIVE_CAM_Z); // the live stage's camera (see {@link LIVE_CAM_Z}); the head lock reads it on every frame of {@link step}
  const all = [r.a];
  if (opts.neighbour) {
    const n = figure('yuna');
    n.position.set(-2 + 0.6, 0, 0);
    n.updateMatrixWorld(true);
    all.push(n);
  }
  const s: Scene = { r, all, hz, eased: opts.eased ?? false, game: opts.game ?? 'ffx', n: 0 };
  r.a.setPose('ko');
  for (let i = 0; i < Math.round((lieMs / 1000) * hz); i++) step(s);
  return s;
}

export interface Steps {
  /** The largest one-frame step of the weighted feet / head, px at 1600 wide, and the frame it is on (0 = the frame the revive was called in). */
  feet: number;
  head: number;
  feetAt: number;
  headAt: number;
  jerks: ReturnType<typeof detectJerks>;
  /** The standing plane's fade on each frame, and the lying plane's. */
  fades: Array<[number, number]>;
}

/** Revive and read `ms` of it frame by frame the way the harness does. `onFrame` runs after every frame (1 = the first frame after the revive call). */
export function revived(s: Scene, subject: string, ms: number, onFrame?: (frame: number) => void): Steps {
  s.r.a.setPose('idle');
  const an = anchorsOf(s.r, subject); // after the call: the standing painting takes the plane the hurt painting was in
  const idle = slots(s.r.a).findIndex((p) => p.pose === 'idle');
  const ko = slots(s.r.a).findIndex((p) => p.pose === 'ko');
  const recs = [record(s.r)];
  for (let i = 0; i < Math.round((ms / 1000) * s.hz); i++) {
    step(s);
    recs.push(record(s.r));
    onFrame?.(i + 1);
  }
  const track = recs.map((fig, n) => {
    const t = figureTrack(fig as never, an as never);
    return { n, t: (n * 1000) / s.hz, feet: t?.feet ?? null, head: t?.head ?? null, cam: [0, 0] as [number, number] };
  });
  const out: Steps = { feet: 0, head: 0, feetAt: -1, headAt: -1, jerks: detectJerks(track, 1, CFG), fades: recs.map((f) => [f.s[idle]![1]!, f.s[ko]![1]!]) };
  for (let i = 1; i < track.length; i++) {
    for (const part of ['feet', 'head'] as const) {
      const a = track[i - 1]![part];
      const b = track[i]![part];
      if (!a || !b) continue;
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (d > out[part]) Object.assign(out, { [part]: d, [`${part}At`]: i });
    }
  }
  return out;
}
