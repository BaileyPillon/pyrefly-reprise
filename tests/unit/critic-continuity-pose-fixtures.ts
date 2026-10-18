/**
 * Fixtures for the critic's pose-continuity tests (W4; both games): a painted figure, a probe recording of crossfades between two of its paintings, a registration record
 * and a fake `fetchImage`, so the harness is run on drawn pictures and no browser is opened. Split out of `critic-continuity-pose.test.ts`, which had passed 400 lines.
 */
import sharp from 'sharp';
import { analyzeRun, anchorsForPoses } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import type { PoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';
import type { PoseWaivers } from '../../critic/runner/lib/continuity-waivers.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';

export const CFG = continuityConfig();
export const FRAME_MS = 1000 / 60;
export const W = 200, H = 300, SOLE = 270;

/** A standing figure: a head disc over a body whose soles end at row `sole`; `dx` moves the whole figure sideways inside the painting. */
export async function painting(dx = 0, sole = SOLE): Promise<Buffer> {
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const head = (x - 100 - dx) ** 2 + (y - 55) ** 2 <= 28 ** 2;
    const body = x >= 72 + dx && x <= 128 + dx && y >= 85 && y <= sole;
    if (head || body) { const i = (y * W + x) * 4; px[i] = 200; px[i + 1] = 120; px[i + 2] = 90; px[i + 3] = 255; }
  }
  return sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

/** The plane of a painting drawn at `scale`, with painting pixel (`px`, `py`) on screen point (`sx`, `sy`): [x0,y0,x1,y1,x2,y2,x3,y3]. */
export const quad = (scale: number, px: number, py: number, sx: number, sy: number): number[] => {
  const x0 = sx - px * scale, y0 = sy - py * scale, x1 = x0 + W * scale, y1 = y0 + H * scale;
  return [x0, y0, x1, y0, x1, y1, x0, y1];
};
export const IDLE_Q = quad(1, 100, SOLE, 400, 470); // soles at (400, 470)

export const FROM = [1, 0.85, 0.65, 0.45, 0.25, 0.1, 0, 0];
export const TO = [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1, 1];
export const slot = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];

export interface Built { meta: ProbeMeta; records: ProbeFrame[] }

/** `swaps` crossfades idle (key 0) to the pose (key 1) and back, 30 frames apart; `subject`'s paintings are `/art/characters/<subject>/<pose>.png`. */
export function build(subject: string, pose: string, qPose: number[], swaps = 10, over: { qIdle?: number[]; hard?: boolean; version?: number } = {}): Built {
  const qIdle = over.qIdle ?? IDLE_Q;
  const q = (k: number): number[] => (k === 0 ? qIdle : qPose);
  const records: ProbeFrame[] = [];
  const meta: ProbeMeta = {
    version: over.version ?? 1, figs: [{ id: subject, side: 'party', kind: 'party', artId: subject }],
    poses: [{ fig: 0, pose: 'idle', url: `/art/characters/${subject}/idle.png`, w: W, h: H }, { fig: 0, pose, url: `/art/characters/${subject}/${pose}.png`, w: W, h: H }],
    swaps: [], logEvents: [], view: [0, 0, 1600, 900], errors: [],
    stats: { frames: 30 * (swaps + 2), battleFrames: 30 * (swaps + 2), battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
  };
  let current = 0;
  for (let n = 0; n < 30 * (swaps + 2); n++) {
    const s = Math.floor((n - 20) / 30), k = n - (20 + s * 30);
    let slots: (number[] | 0)[];
    if (s >= 0 && s < swaps && k >= 0 && k < FROM.length) {
      const from = s % 2, to = 1 - s % 2;
      const fa = over.hard ? (k < 3 ? 1 : 0) : FROM[k]!;
      const ta = over.hard ? 1 - fa : TO[k]!;
      slots = [slot(from, fa, q(from)), slot(to, ta, q(to))];
      if (k === 3) meta.swaps.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, i: 0, from, to, a: 1 });
      if (k === FROM.length - 1) current = to;
    } else slots = [slot(current, 1, q(current)), 0];
    records.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: 0, s: slots, g: [0, 0] }] });
  }
  return { meta, records };
}

/** A registration record: the head box (painting px), the feet (x, row), the painting's sha, a hold's real head if any. */
export const rec = (head: number[], stance: { x: number; row: number }, extra: Record<string, unknown> = {}) => ({ size: [W, H], head, stance, prone: false, standing: true, ...extra });
export const measureOf = (subject: string, poses: Record<string, unknown>): PoseMeasure => ({ path: 'test', sha256: 'x', count: 1, subjects: { [subject]: { poses } } }) as unknown as PoseMeasure;
export const IDLE_HEAD = [80, 20, 120, 60]; // 40 px square

export const fetcher = (files: Record<string, Buffer>) => async (url: string): Promise<Buffer> => {
  const hit = files[url.replace(/[?#].*$/, '')];
  if (!hit) throw new Error('HTTP 404');
  return hit;
};

export async function run(subject: string, pose: string, b: Built, measure: PoseMeasure | null, opts: { poseDx?: number; poseSole?: number; waivers?: PoseWaivers | null; cfg?: typeof CFG } = {}) {
  const files = { [`/art/characters/${subject}/idle.png`]: await painting(), [`/art/characters/${subject}/${pose}.png`]: await painting(opts.poseDx ?? 0, opts.poseSole ?? SOLE) };
  const { anchors } = await anchorsForPoses({ poses: b.meta.poses, fetchImage: fetcher(files), measure, waivers: opts.waivers ?? null });
  return { anchors, r: analyzeRun({ meta: b.meta, records: b.records, anchors, cfg: opts.cfg ?? CFG }) };
}

