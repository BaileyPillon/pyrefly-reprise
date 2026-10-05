/**
 * The analysis of a chapter's recording (`critic/runner/lib/continuity-analyze.mjs`), end to end on a small synthetic one: a
 * hero with two paintings, an idle and an attack, whose attack plane is drawn 25 percent bigger (the defect Bailey saw), swapping
 * back and forth through crossfades, with one camera cut, one pop and a battle log. The paintings are drawn in the test and
 * served through a fake `fetchImage`; the registration records are written here. Nothing opens a browser.
 *
 * Game case: both (shared critic plumbing).
 */
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { analyzeRun, anchorsForPoses, causeOf } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig } from '../../critic/runner/lib/continuity.mjs';
import type { PoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';

const CFG = continuityConfig();
const W = 200, H = 300;

async function painting(): Promise<Buffer> {
  const px = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const head = (x - 100) ** 2 + (y - 55) ** 2 <= 28 ** 2;
    const body = x >= 72 && x <= 128 && y >= 85 && y <= 270;
    if (head || body) { const i = (y * W + x) * 4; px[i] = 200; px[i + 1] = 120; px[i + 2] = 90; px[i + 3] = 255; }
  }
  return sharp(px, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

/** The registered head and stance of both poses: the head 40 painting px square, the feet at x 100, row 270. */
const pose = { size: [W, H], head: [80, 20, 120, 60], stance: { x: 100, row: 270 }, prone: false, standing: true };
const MEASURE: PoseMeasure = { path: 'test', sha256: 'x', count: 1, subjects: { hero: { poses: { idle: pose, attack: pose } } } };

/** The idle plane: the painting at screen scale 1, top-left at (300, 200); the attack plane 1.25 times as big with its feet on the same spot. */
const QA = [300, 200, 500, 200, 500, 500, 300, 500];
const QB = [275, 132.5, 525, 132.5, 525, 507.5, 275, 507.5];
const FROM = [1, 0.85, 0.65, 0.45, 0.25, 0.1, 0, 0];
const TO = [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1, 1];

const slot = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];
const FRAME_MS = 1000 / 60;

interface Built { meta: ProbeMeta; records: ProbeFrame[] }

/** `swaps` crossfades alternating idle to attack and back, 30 frames apart, plus what `tweak` changes. */
function build(swaps: number, tweak: (records: ProbeFrame[], meta: ProbeMeta) => void = () => undefined): Built {
  const records: ProbeFrame[] = [];
  const meta: ProbeMeta = {
    version: 1, figs: [{ id: 'hero', side: 'party', kind: 'party', artId: 'hero' }],
    poses: [{ fig: 0, pose: 'idle', url: '/art/characters/hero/idle.png', w: W, h: H }, { fig: 0, pose: 'attack', url: '/art/characters/hero/attack.png', w: W, h: H }],
    swaps: [], logEvents: [{ n: 10, i: 0, type: 'action-start', actorId: 'hero', abilityId: 'slash' }, { n: 12, i: 1, type: 'damage', targetId: 'boss' }], view: [0, 0, 1600, 900], errors: [],
    stats: { frames: 30 * (swaps + 2), battleFrames: 30 * (swaps + 2), battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
  };
  let current = 0; // plane key showing
  for (let n = 0; n < 30 * (swaps + 2); n++) {
    const s = Math.floor((n - 20) / 30); // which swap's window this frame is in
    const start = 20 + s * 30;
    const k = n - start;
    let slots: (number[] | 0)[];
    if (s >= 0 && s < swaps && k >= 0 && k < FROM.length) {
      const from = s % 2, to = 1 - s % 2;
      const q = (key: number): number[] => (key === 0 ? QA : QB);
      slots = [slot(from, FROM[k]!, q(from)), slot(to, TO[k]!, q(to))];
      if (k === 3) meta.swaps.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, i: 0, from, to, a: 1 });
      if (k === FROM.length - 1) current = to;
    } else {
      slots = [slot(current, 1, current === 0 ? QA : QB), 0];
    }
    records.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: 0, s: slots, g: [0, 0] }] });
  }
  tweak(records, meta);
  return { meta, records };
}

const fetchImage = async (): Promise<Buffer> => painting();

describe('anchors for the poses of a recording', () => {
  it('reads each painting once and takes the registered head and stance, with the mask for the outline', async () => {
    const { meta } = build(2);
    const { anchors, notes } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
    expect(notes).toEqual([]);
    expect(anchors[0]!.head).toEqual({ u0: 0.4, t0: 20 / 300, u1: 0.6, t1: 60 / 300 });
    expect(anchors[1]!.stanceSrc).toBe('registration');
    expect(anchors[0]!.mask).not.toBeNull();
  });

  it('says so, and goes on, when a painting cannot be fetched or is a stand-in with no url', async () => {
    const poses = [{ fig: 0, pose: 'idle', url: '/art/characters/hero/idle.png' }, { fig: 0, pose: 'placeholder', url: null }];
    const { anchors, notes } = await anchorsForPoses({ poses, fetchImage: async () => { throw new Error('HTTP 404'); }, measure: MEASURE });
    expect(anchors).toEqual([null, null]);
    expect(notes.join(' ')).toMatch(/could not read .*idle\.png: .*404/);
    expect(notes.join(' ')).toMatch(/stand-in/);
  });
});

describe('analysing a recording', () => {
  it('finds the head 25 percent bigger at every swap, from the registered heads, and fails CHK-026 for it', async () => {
    const { meta, records } = build(10);
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
    const r = analyzeRun({ meta, records, anchors, cfg: CFG });
    expect(r.swaps).toHaveLength(10);
    expect(r.swaps.every((s) => s.counted)).toBe(true);
    const up = r.swaps.find((s) => s.fromPose === 'idle')!;
    const down = r.swaps.find((s) => s.fromPose === 'attack')!;
    expect(up.head!.ratio).toBeCloseTo(1.25, 3);
    expect(down.head!.ratio).toBeCloseTo(0.8, 3);
    expect(up.head!.source).toBe('registration');
    expect(up.failHead).toBe(true);
    expect(up.feet!.px).toBeLessThan(0.01); // the feet are where they were: only the size is wrong
    expect(up.failFeet).toBe(false);
    expect(r.summary.size.headOverTolerance).toBe(10);
    expect(r.summary.size.maxHeadJumpPctRegistration).toBe(25);
    expect(r.summary.checks['CHK-026'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-027'].result).toBe('PASS'); // crossfaded, so no snaps and no jerks
    expect(r.summary.motion.snaps).toBe(0);
    expect(r.summary.motion.ghostSwaps).toBe(10);
    expect(r.perFigure['hero']!['headRegistered']).toBe(10);
    expect(r.coverage['measuredWithRegistration']).toEqual(['hero']);
    expect(r.worst.swaps).toHaveLength(10);
  });

  it('passes a build whose attack painting is drawn at the idle\'s size', async () => {
    const same = build(10, (records) => { for (const rec of records) for (const f of rec.f) f.s = f.s.map((s) => (s && s[0] === 1 ? [...s.slice(0, 3), ...QA] : s)); });
    const { anchors } = await anchorsForPoses({ poses: same.meta.poses, fetchImage, measure: MEASURE });
    const r = analyzeRun({ meta: same.meta, records: same.records, anchors, cfg: CFG });
    expect(r.swaps.every((s) => !s.failHead && !s.failFeet)).toBe(true);
    expect(r.summary.checks['CHK-026'].result).toBe('PASS');
    expect(r.summary.checks['CHK-026'].note).toMatch(/10 of 10 measured swaps had a registered head/);
  });

  it('counts a swap with no in-between frames as a snap, and leaves a swap under a camera cut out', async () => {
    const { meta, records } = build(10, (recs) => {
      // swap 2: a hard cut (the fades jump in one frame)
      const start = 20 + 2 * 30;
      for (let k = 0; k < FROM.length; k++) {
        const f = recs[start + k]!.f[0]!;
        const fa = k < 3 ? 1 : 0;
        f.s = [slot(0, fa, QA), slot(1, 1 - fa, QB)];
      }
      // swap 4: the camera cuts on the swap frame
      recs[20 + 4 * 30 + 3]!.f[0]!.g = [400, 0];
    });
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
    const r = analyzeRun({ meta, records, anchors, cfg: CFG });
    const cut = r.swaps[2]!;
    expect(cut.blendFrames).toBe(0);
    expect(cut.hardCut).toBe(true);
    expect(cut.snap).toBe(true); // the head also jumps
    expect(r.summary.motion.snaps).toBe(1);
    expect(r.summary.motion.snapsPerMinute).toBe(0.5); // one in two minutes of battle
    expect(r.swaps[4]!.camCut).toBe(true);
    expect(r.swaps[4]!.counted).toBe(false);
    expect(r.summary.counted).toBe(9);
    expect(r.summary.excludedByCut).toBe(1);
    expect(r.cameraCuts.length).toBeGreaterThan(0);
  });

  it('finds a teleport between swaps, with the camera\'s share taken out, and says whether it fell at a swap', async () => {
    const { meta, records } = build(10, (recs) => {
      // between the swaps (150 to 164 is quiet): the whole figure is 150 px to the right for 15 frames, and comes back
      for (let n = 150; n < 165; n++) for (const f of recs[n]!.f) f.s = f.s.map((s) => (s ? [...s.slice(0, 3), ...s.slice(3).map((v, i) => (i % 2 === 0 ? v + 150 : v))] : s));
    });
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
    const r = analyzeRun({ meta, records, anchors, cfg: CFG });
    const pops = r.jerks.filter((j) => j.n === 150 || j.n === 165);
    expect(pops).toHaveLength(2); // out and back
    expect(Math.max(...pops.map((j) => j.px))).toBeGreaterThan(140);
    expect(pops.every((j) => !j.atSwap)).toBe(true);
    expect(r.summary.motion.jerksOverFail).toBeGreaterThan(0);
    expect(r.summary.checks['CHK-027'].result).toBe('FAIL');
    expect(r.summary.checks['CHK-027'].reasons.join(' ')).toMatch(/jerk\(s\) of 40 px or more/);
  });

  it('is UNVERIFIED when the recording is too short to judge', async () => {
    const { meta, records } = build(3);
    meta.stats.battleSeconds = 20;
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
    const r = analyzeRun({ meta, records, anchors, cfg: CFG });
    expect(r.summary.checks['CHK-026'].result).toBe('UNVERIFIED');
    expect(r.summary.checks['CHK-027'].result).toBe('UNVERIFIED');
  });

  it('is UNVERIFIED when the page ran too slowly to tell two frames apart', async () => {
    const { meta, records } = build(10);
    meta.stats.fps = 9;
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage, measure: MEASURE });
    expect(analyzeRun({ meta, records, anchors, cfg: CFG }).summary.checks['CHK-026'].reasons[0]).toMatch(/9 fps/);
  });
});

describe('what caused a swap', () => {
  const log = [
    { n: 10, type: 'turn-start', actorId: 'a' }, { n: 40, type: 'sensor' }, { n: 41, type: 'action-start', actorId: 'hero', abilityId: 'slash' },
    { n: 44, type: 'damage', targetId: 'boss' }, { n: 200, type: 'turn-start', actorId: 'b' },
  ];
  it('is the last event that moves a figure before the frame, within a window', () => {
    expect(causeOf(log, 50)).toMatchObject({ type: 'damage', targetId: 'boss', framesBefore: 6 });
    expect(causeOf(log, 42)).toMatchObject({ type: 'action-start', actorId: 'hero', abilityId: 'slash' });
    expect(causeOf(log, 150)).toBeNull(); // nothing within 90 frames
    expect(causeOf(log, 5)).toBeNull();
  });
});
