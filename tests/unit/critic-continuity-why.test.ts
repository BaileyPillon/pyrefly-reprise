/**
 * T-01 and T-02 of the motion-fluidity pass (lane L5; both games, critic plumbing): the see-through time in milliseconds as the primary number, and the NAMED CLASSES of a pose swap
 * (`critic/runner/lib/continuity-ghostms.mjs`, `continuity-why.mjs`): the interlude family, hurt strings, the stance split, the swap log's reasons, and the designed blend (a switchable rule).
 * Pure functions over swaps in the shape of continuity.json, plus the whole analysis on the synthetic recording of critic-continuity-analyze.test.ts. Nothing opens a browser.
 */
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { analyzeRun, anchorsForPoses } from '../../critic/runner/lib/continuity-analyze.mjs';
import { continuityConfig, aggregate } from '../../critic/runner/lib/continuity.mjs';
import { aggregateGhostMs, ghostMsBlock, ghostRateText, FRAME_MS_60 } from '../../critic/runner/lib/continuity-ghostms.mjs';
import { classPolicy, classReport, findHurtStrings, findInterludes, groupStats, neighbours, prepareClasses, stanceReading, swapClass, tagDesigned, tagWhy } from '../../critic/runner/lib/continuity-why.mjs';
import { continuityReportLine, frameTimeOf } from '../../critic/runner/lib/continuity-pure.mjs';
import type { PoseMeasure } from '../../critic/runner/lib/continuity-silhouette.mjs';
import type { ProbeFrame, ProbeMeta } from '../../critic/runner/lib/continuity-probe.mjs';

interface Sw {
  id: number;
  figure: string;
  fromPose: string;
  toPose: string;
  tMs: number;
  counted?: boolean;
  notShowing?: boolean;
  smear?: object;
  ghost?: { frames: number; ms: number; severity: number };
  why?: { reason: string };
}
let id = 0;
const sw = (figure: string, fromPose: string, toPose: string, tMs: number, frames = 3, severity = 0.25): Sw => ({ id: ++id, figure, fromPose, toPose, tMs, counted: true, ghost: { frames, ms: frames * 17, severity } });

describe('T-01: the see-through time in milliseconds is the primary number', () => {
  it('sums the counted swaps\' own milliseconds and says what they are worth in 60 Hz frames', () => {
    const swaps = [sw('a', 'idle', 'ready', 0, 6), sw('a', 'ready', 'idle', 900, 4)];
    const b = ghostMsBlock(swaps, 0.5); // half a minute
    expect(b.ghostMs).toBe(170);
    expect(b.ghostMsPerMinute).toBe(340);
    expect(b.ghostFramesPerMinute).toBe(20); // 10 frames in half a minute
    expect(b.ghostFrames60PerMinute).toBeCloseTo(340 / FRAME_MS_60 , 1);
  });

  it('a 144 Hz capture reads 2.4 times the frames but the same milliseconds', () => {
    // 120 ms of double image: 7 frames at 60 Hz, 17 at 144 Hz (the plan\'s correction 5)
    const at60 = ghostMsBlock([{ ghost: { frames: 7, ms: 120 } }], 1);
    const at144 = ghostMsBlock([{ ghost: { frames: 17, ms: 120 } }], 1);
    expect(at144.ghostFramesPerMinute! / at60.ghostFramesPerMinute!).toBeCloseTo(2.43, 1);
    expect(at144.ghostMsPerMinute).toBe(at60.ghostMsPerMinute);
    expect(at144.ghostFrames60PerMinute).toBe(at60.ghostFrames60PerMinute);
  });

  it('aggregates chapters, and leaves the whole block out when a chapter was summarised before the unit existed (unknown is not zero)', () => {
    const a = aggregateGhostMs([{ ghostMs: 600, ghostFrames: 30 }, { ghostMs: 300, ghostFrames: 20 }], 2);
    expect(a).toMatchObject({ ghostMs: 900, ghostMsPerMinute: 450, ghostFramesPerMinute: 25 });
    expect(aggregateGhostMs([{ ghostMs: 600 }, { ghostFrames: 20 }], 2)).toBeNull();
    expect(aggregateGhostMs([], 2)).toBeNull();
  });

  it('puts the milliseconds in the report line, beside the frame count, and nothing when the run has none', () => {
    const line = (motion: object | undefined) => continuityReportLine({ battleSeconds: 120, chapters: [{ fps: 60, dedicated: true }], checks: { 'CHK-026': { result: 'PASS' }, 'CHK-027': { result: 'PASS' } }, motion });
    expect(line({ ghostMsPerMinute: 1719, ghostFrames60PerMinute: 103 })).toContain('1,719 ms of see-through a minute (103 frames a minute at 60 Hz)');
    expect(line(undefined)).not.toContain('see-through');
    expect(ghostRateText({})).toBe('');
  });

  it('labels the probe\'s frame times as the harness\'s load, not the game\'s pacing (PACE-08)', () => {
    expect(frameTimeOf([16.7, 16.7, 50], 34)).toMatchObject({ source: 'continuity-probe', pacingNumber: false });
  });
});

describe('T-02: the swap classes carry the audit\'s names', () => {
  it('names the stance, cause and return swaps in the player\'s words', () => {
    expect(swapClass({ fromPose: 'idle', toPose: 'ready' })).toBe('Stance up (idle to ready)');
    expect(swapClass({ fromPose: 'ready', toPose: 'idle' })).toBe('Stance down (ready to idle)');
    expect(swapClass({ fromPose: 'cast', toPose: 'ready' })).toBe('Back to ready after an action (cast/item/OD)');
    expect(swapClass({ fromPose: 'hurt', toPose: 'idle' })).toBe('Hurt recovery');
    expect(swapClass({ fromPose: 'idle', toPose: 'hurt' })).toBe('Hurt (hit lands)');
    expect(swapClass({ fromPose: 'ready', toPose: 'cast' })).toBe('Cast begins (ready to cast)');
    expect(swapClass({ fromPose: 'follow', toPose: 'idle' })).toBe('Return home (follow to idle)');
    expect(swapClass({ rig: true, fromPose: 'a', toPose: 'b' } as never)).toBe('RIG key flip (boss)');
    expect(swapClass({ fromPose: 'zig', toPose: 'zag' })).toBe('other zig>zag');
  });
});

describe('T-02: the interlude family (ready>idle then idle>X within 150 ms)', () => {
  it('finds the attack triple, the cast and the item, whichever X; not two separate turns; tags both swaps', () => {
    const swaps = [
      sw('rikku', 'ready', 'idle', 5000), sw('rikku', 'idle', 'ready', 5100),
      sw('yuna', 'ready', 'idle', 6000), sw('yuna', 'idle', 'cast', 6117),
      sw('yuna', 'ready', 'idle', 9000), sw('yuna', 'idle', 'item', 9118),
      sw('paine', 'ready', 'idle', 12000), sw('paine', 'idle', 'ready', 15300), // two real turns, 3.3 s apart
    ];
    const found = findInterludes(swaps as never, classPolicy({}));
    expect(found.map((f) => `${f.figure}>${f.to}`)).toEqual(['rikku>ready', 'yuna>cast', 'yuna>item']);
    expect(found[0]).toMatchObject({ gapMs: 100, counted: true, ghostFrames: 6, ghostMs: 102 });
    expect((swaps[0] as never as { interlude: object }).interlude).toMatchObject({ role: 'out', to: 'ready' });
    expect((swaps[1] as never as { interlude: object }).interlude).toMatchObject({ role: 'back' });
    expect('interlude' in swaps[6]!).toBe(false);
  });

  it('a swap belongs to one interlude at most, and another figure\'s swap in between does not join them', () => {
    const swaps = [sw('a', 'ready', 'idle', 0), sw('b', 'idle', 'cast', 50), sw('a', 'idle', 'ready', 120)];
    const found = findInterludes(swaps as never, classPolicy({}));
    expect(found).toHaveLength(1);
    expect(found[0]!.figure).toBe('a');
  });

  it('reads the window from the policy', () => {
    const swaps = [sw('a', 'ready', 'idle', 0), sw('a', 'idle', 'cast', 200)];
    expect(findInterludes(swaps as never, classPolicy({}))).toHaveLength(0);
    expect(findInterludes(swaps as never, classPolicy({ classes: { interludeMs: 250 } }))).toHaveLength(1);
  });
});

describe('T-02: hurt strings (hurt>idle>hurt)', () => {
  it('finds the string inside the window and tags both swaps', () => {
    const swaps = [sw('seymour', 'idle', 'hurt', 1000), sw('seymour', 'hurt', 'idle', 1300), sw('seymour', 'idle', 'hurt', 1560), sw('tidus', 'hurt', 'idle', 4000), sw('tidus', 'idle', 'hurt', 6000)];
    const found = findHurtStrings(swaps as never, classPolicy({}));
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ figure: 'seymour', gapMs: 260 });
    expect('hurtString' in swaps[3]!).toBe(false); // two seconds apart: two hits, not a string
  });
});

describe('T-02: the stance split of MF-05', () => {
  it('reads the log\'s reason when the swap has one', () => {
    const swaps = [sw('paine', 'idle', 'ready', 1000), sw('paine', 'idle', 'ready', 9000), sw('paine', 'cast', 'ready', 20000), sw('paine', 'ready', 'idle', 30000)];
    const reasons = [
      { at: 960, actor: 'paine', pose: 'ready', reason: 'menu' },
      { at: 8990, actor: 'paine', pose: 'ready', reason: 'wind-up' },
      { at: 19990, actor: 'paine', pose: 'ready', reason: 'menu' }, // the menu opens on the drawing of her last action: a cast
      { at: 29950, actor: 'paine', pose: 'idle', reason: 'turn-start' },
    ];
    expect(tagWhy(swaps as never, reasons)).toBe(4);
    const nb = neighbours(swaps as never);
    expect(swaps.map((s) => stanceReading(s as never, nb)?.reading)).toEqual(['menu', 'wind-up', 'menu', 'turn-start']);
    expect(swaps.map((s) => stanceReading(s as never, nb)?.source)).toEqual(['log', 'log', 'log', 'log']);
  });

  it('ignores a reason for another figure, another pose, or one asked too long before the flip', () => {
    const swaps = [sw('paine', 'idle', 'ready', 1000)];
    expect(tagWhy(swaps as never, [{ at: 990, actor: 'rikku', pose: 'ready', reason: 'menu' }, { at: 990, actor: 'paine', pose: 'cast', reason: 'cast' }, { at: 100, actor: 'paine', pose: 'ready', reason: 'menu' }])).toBe(0);
  });

  it('falls back on the neighbours, and says so', () => {
    const swaps = [
      sw('rikku', 'idle', 'ready', 1000), sw('rikku', 'ready', 'attack', 1400), // a wind-up: her own strike follows within 600 ms
      sw('rikku', 'idle', 'ready', 9000), // the menu: nothing follows
      sw('rikku', 'ready', 'idle', 14000), sw('rikku', 'idle', 'cast', 14110), // a turn start: the next swap follows inside the interlude window
      sw('rikku', 'ready', 'idle', 30000), // after an action
    ];
    const nb = neighbours(swaps as never);
    const read = swaps.map((s) => stanceReading(s as never, nb));
    expect(read.map((r) => r?.reading ?? null)).toEqual(['wind-up', null, 'menu', 'turn-start', null, 'after-action']);
    expect(read.filter(Boolean).every((r) => r!.source === 'neighbours')).toBe(true);
  });
});

describe('T-02: the designed blend, a switchable rule', () => {
  const designedLog = [{ at: 1000, actor: 'hero', from: 'hurt', to: 'idle', cls: 'recover', ms: 50 }];

  it('matches a declared blend by figure, pair and window, once', () => {
    const swaps = [sw('hero', 'hurt', 'idle', 1040), sw('hero', 'hurt', 'idle', 1042), sw('hero', 'idle', 'hurt', 1040), sw('villain', 'hurt', 'idle', 1040), sw('hero', 'hurt', 'idle', 3000)];
    const n = tagDesigned(swaps as never, designedLog, classPolicy({}));
    expect(n).toBe(1);
    expect((swaps[0] as never as { designed: object }).designed).toEqual({ cls: 'recover', ms: 50 });
    expect(swaps.slice(1).some((s) => 'designed' in s)).toBe(false); // one entry, one swap; another pair, another figure, a window missed
  });

  it('reports a designed blend apart by default and excuses nothing', () => {
    const swaps = [sw('hero', 'hurt', 'idle', 1040, 3, 0.45), sw('hero', 'idle', 'hurt', 5000, 5, 0.45)];
    const prepared = prepareClasses(swaps as never, { reasons: [], designed: designedLog }, {});
    const rep = classReport(swaps as never, { battleSeconds: 60, totalGhostFrames: 8, prepared, swapLog: { reasons: [], designed: designedLog } });
    expect(rep.designedBlend).toMatchObject({ report: true, excuse: false, logged: 1, matched: 1, swaps: 1, ghostFrames: 3, ghostMs: 51, excused: 0, undesignedGhostMsPerMinute: 85 });
    expect(rep.source.designed).toBe('log');
    expect((swaps[0] as never as { designedExcused?: boolean }).designedExcused).toBeUndefined();
  });

  it('excuses a designed blend of at most maxSeverity when the policy says so, and only that one', () => {
    const swaps = [sw('hero', 'hurt', 'idle', 1040, 3, 0.25), sw('hero', 'hurt', 'idle', 2040, 3, 0.45)];
    const log = [{ at: 1000, actor: 'hero', from: 'hurt', to: 'idle', cls: 'recover', ms: 50 }, { at: 2000, actor: 'hero', from: 'hurt', to: 'idle', cls: 'recover', ms: 50 }];
    tagDesigned(swaps as never, log, classPolicy({ classes: { designedBlend: { excuse: true, maxSeverity: 0.3 } } }));
    expect(swaps.map((s) => (s as never as { designedExcused?: boolean }).designedExcused ?? false)).toEqual([true, false]); // 0.45 is over the cap: still a double image
  });

  it('report false switches the whole rule off', () => {
    const swaps = [sw('hero', 'hurt', 'idle', 1040)];
    const prepared = prepareClasses(swaps as never, { reasons: [], designed: designedLog }, { classes: { designedBlend: { report: false } } });
    expect(prepared.designedN).toBe(0);
    expect('designed' in swaps[0]!).toBe(false);
  });
});

describe('T-02: the class report', () => {
  it('groups counted swaps with frames, milliseconds and a minute, worst first, and counts the planned ones', () => {
    const swaps = [sw('a', 'idle', 'ready', 0, 6), sw('a', 'idle', 'ready', 20000, 6), sw('a', 'hurt', 'idle', 30000, 2), { ...sw('b', 'idle', 'hurt', 40000, 9), smear: {} }];
    const prepared = prepareClasses(swaps as never, null, {});
    const rep = classReport(swaps as never, { battleSeconds: 120, totalGhostFrames: 23, prepared });
    expect(rep.byClass.map((r) => r.cls)).toEqual(['Stance up (idle to ready)', 'Hurt (hit lands)', 'Hurt recovery']);
    expect(rep.byClass[0]).toMatchObject({ swaps: 2, ghostFrames: 12, ghostMs: 204, ghostMsPerMinute: 102, planned: 0 });
    expect(rep.byClass[1]).toMatchObject({ swaps: 1, planned: 1 });
    expect(rep.source).toMatchObject({ why: 'neighbours', designed: 'none' });
  });

  it('counts only counted swaps in the groups', () => {
    const w = sw('a', 'idle', 'ready', 0, 6);
    const hidden = { ...sw('a', 'idle', 'ready', 100, 6), counted: false };
    expect(groupStats([w as never], 1).swaps).toBe(1);
    const rep = classReport([w, hidden] as never, { battleSeconds: 60, totalGhostFrames: 6, prepared: prepareClasses([w, hidden] as never, null, {}) });
    expect(rep.byClass[0]!.swaps).toBe(1);
  });

  it('classPolicy reads the policy over the defaults and ignores nonsense', () => {
    expect(classPolicy(null)).toMatchObject({ interludeMs: 150, hurtStringMs: 600, windUpMs: 600, whyWindowMs: 400, designedBlend: { report: true, excuse: false, maxSeverity: 0.3 } });
    expect(classPolicy({ classes: { interludeMs: -5, windUpMs: 'x', designedBlend: { report: false, excuse: 'yes' } } })).toMatchObject({ interludeMs: 150, windUpMs: 600, designedBlend: { report: false, excuse: false } });
  });
});

// ---- the whole analysis on the synthetic recording of critic-continuity-analyze.test.ts ----
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
const pose = { size: [W, H], head: [80, 20, 120, 60], stance: { x: 100, row: 270 }, prone: false, standing: true };
const MEASURE: PoseMeasure = { path: 'test', sha256: 'x', count: 1, subjects: { hero: { poses: { idle: pose, attack: pose } } } };
const QA = [300, 200, 500, 200, 500, 500, 300, 500];
const QB = [275, 132.5, 525, 132.5, 525, 507.5, 275, 507.5];
const FROM = [1, 0.85, 0.65, 0.45, 0.25, 0.1, 0, 0];
const TO = [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1, 1];
const slot = (k: number, fade: number, q: number[]): number[] => [k, fade, 1, ...q];
const FRAME_MS = 1000 / 60;

function build(swaps: number): { meta: ProbeMeta; records: ProbeFrame[] } {
  const records: ProbeFrame[] = [];
  const meta: ProbeMeta = {
    version: 1, figs: [{ id: 'hero', side: 'party', kind: 'party', artId: 'hero' }],
    poses: [{ fig: 0, pose: 'idle', url: '/art/characters/hero/idle.png', w: W, h: H }, { fig: 0, pose: 'attack', url: '/art/characters/hero/attack.png', w: W, h: H }],
    swaps: [], logEvents: [], view: [0, 0, 1600, 900], errors: [],
    stats: { frames: 30 * (swaps + 2), battleFrames: 30 * (swaps + 2), battleSeconds: 120, maxDtMs: 20, slowFrames: 0, fps: 59, copyMsMean: 0.03 }, strips: [],
  };
  let current = 0;
  for (let n = 0; n < 30 * (swaps + 2); n++) {
    const s = Math.floor((n - 20) / 30);
    const start = 20 + s * 30;
    const k = n - start;
    let slots: (number[] | 0)[];
    if (s >= 0 && s < swaps && k >= 0 && k < FROM.length) {
      const from = s % 2, to = 1 - s % 2;
      const q = (key: number): number[] => (key === 0 ? QA : QB);
      slots = [slot(from, FROM[k]!, q(from)), slot(to, TO[k]!, q(to))];
      if (k === 3) meta.swaps.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, i: 0, from, to, a: 1 });
      if (k === FROM.length - 1) current = to;
    } else slots = [slot(current, 1, current === 0 ? QA : QB), 0];
    records.push({ n, t: Math.round(n * FRAME_MS * 10) / 10, f: [{ i: 0, a: 1, act: 0, s: slots, g: [0, 0] }] });
  }
  return { meta, records };
}

describe('the whole analysis carries the block', () => {
  const CFG = continuityConfig();
  it('adds ghostMs to the motion summary, the classes block, and changes no existing number', async () => {
    const { meta, records } = build(10);
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage: painting, measure: MEASURE });
    const r = analyzeRun({ meta, records, anchors, cfg: CFG });
    const m = r.summary.motion;
    expect(m.ghostMs).toBeGreaterThan(0);
    expect(m.ghostMsPerMinute).toBeGreaterThan(0);
    expect(m.ghostFrames60PerMinute).toBeGreaterThan(0);
    const cl = (r.summary as unknown as { classes: ReturnType<typeof classReport> }).classes;
    expect(cl.byClass.reduce((n, c) => n + c.ghostFrames, 0)).toBe(m.ghostFrames); // every counted swap is in one class
    expect(cl.byClass.reduce((n, c) => n + c.ghostMs, 0)).toBe(m.ghostMs);
    expect(cl.designedBlend.matched).toBe(0);
    expect(cl.source.why).toBe('none'); // idle<->attack: no stance swap to read
  });

  it('a declared designed blend leaves ghostOverFail only when the rule excuses it', async () => {
    const { meta, records } = build(10);
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage: painting, measure: MEASURE });
    const strict = { ...CFG, motion: { ...CFG.motion, ghostSeverityFail: 0.01 } } as typeof CFG; // every double image fails
    const base = analyzeRun({ meta, records, anchors, cfg: strict });
    expect(base.summary.motion.ghostOverFail).toBeGreaterThan(0);
    const designed = meta.swaps.map((s) => ({ at: s.t - 20, actor: 'hero', from: s.from === 0 ? 'idle' : 'attack', to: s.to === 0 ? 'idle' : 'attack', cls: 'test', ms: 120 }));
    const withLog = { ...meta, swapLog: { reasons: [], designed } };
    const off = analyzeRun({ meta: withLog, records, anchors, cfg: strict });
    expect(off.summary.motion.ghostOverFail).toBe(base.summary.motion.ghostOverFail); // reported, not excused
    expect((off.summary as unknown as { classes: ReturnType<typeof classReport> }).classes.designedBlend.matched).toBe(10);
    const on = analyzeRun({ meta: withLog, records, anchors, cfg: { ...strict, classes: { designedBlend: { excuse: true, maxSeverity: 1 } } } as typeof CFG });
    expect(on.summary.motion.ghostOverFail).toBe(0);
    expect(on.summary.motion.ghostDesignedExcused).toBe(10);
    expect(on.summary.motion.ghostFrames).toBe(base.summary.motion.ghostFrames); // the double images are still counted and shown
    expect(on.summary.checks['CHK-027'].note ?? '').toMatch(/designed blend/);
  });

  it('aggregates the new block across chapters', async () => {
    const { meta, records } = build(10);
    const { anchors } = await anchorsForPoses({ poses: meta.poses, fetchImage: painting, measure: MEASURE });
    const r = analyzeRun({ meta, records, anchors, cfg: CFG });
    const a = aggregate([{ chapter: 'x', summary: r.summary, checks: r.summary.checks } as never, { chapter: 'y', summary: r.summary, checks: r.summary.checks } as never], CFG);
    expect(a.motion.ghostMs).toBe(2 * r.summary.motion.ghostMs!);
    expect(a.motion.ghostMsPerMinute).toBeCloseTo(r.summary.motion.ghostMsPerMinute!, -1);
    expect(a.reportLine).toMatch(/ms of see-through a minute/);
  });
});
