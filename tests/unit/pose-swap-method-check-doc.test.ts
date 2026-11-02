/**
 * The written method check for the pose-swap family (docs/plans/pose-swap-method-check-2026-11.md and its handoff docs/handoff/r73-method.md), held to what the
 * review of its first draft found (2026-11-01; both games, a document and its guard, no product code).
 *
 * The round files the page's numbers come from are gitignored (`critic/rounds/*`), so what a test can hold is (1) the page's own arithmetic, (2) the facts it cites
 * that live in the repo (the rig's data, the probe's reading, the vertical head guard's table), and (3) that the wrong claims of the first draft are gone. Each
 * test below fails on the first draft:
 *
 *   1. M1: the 34 gated swap jerks are all placed, and the victory class is split into the 6 on a camera-cut swap and the 11 that are not (the draft said 13 of 30 and
 *      called all of them the camera);
 *   2. M2: the 34 are split by the frame they fell on (18 steady, 16 long) in the group table, the section 2 row and the ticket split (the draft never said);
 *   3. M3: item 2 does not claim a new reading from "the part's own box" (the probe already reads the head part's mesh area) and predicts a count by construction;
 *      the repo facts it rests on hold (`fit.scales.head` is 1 to 1, the head part is the head-top polygon plus locks, the probe reads the mesh named `head`);
 *   4. the handoff's job specs name the split items, and neither document carries a local path, an address or an account id.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BLEND_HEAD_CHAPTERS } from '../../src/engine/motion/SwapSwitch.ts';

const ROOT = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const PLAN = read('docs/plans/pose-swap-method-check-2026-11.md');
const HANDOFF = read('docs/handoff/r73-method.md');
/** The page without its revision log, which quotes the first draft's wrong claims on purpose. */
const BODY = PLAN.slice(0, PLAN.indexOf('## 9. Revision log'));

/** One section of the page, from its heading to the next heading of the same or a higher level. */
const section = (text: string, heading: string): string => {
  const start = text.indexOf(heading);
  expect(start, `heading "${heading}" is in the page`).toBeGreaterThanOrEqual(0);
  const level = /^#+/.exec(heading)![0].length;
  const rest = text.slice(start + heading.length);
  const next = new RegExp(`\\n#{1,${level}} `).exec(rest);
  return heading + (next ? rest.slice(0, next.index) : rest);
};

/** The group labels of the 3.4 table: `**name (count; steady / long):**`. */
const groups = (): { name: string; count: number; steady: number; long: number }[] => {
  const s = section(PLAN, '### 3.4 ');
  return [...s.matchAll(/\*\*([^*]+?) \((\d+); (\d+) \/ (\d+)\):/g)].map((m) => ({ name: m[1]!, count: Number(m[2]), steady: Number(m[3]), long: Number(m[4]) }));
};

describe('1. the victory class (review M1)', () => {
  it('places all 34 gated swap jerks, and every group adds up', () => {
    const g = groups();
    expect(g.length).toBe(6);
    expect(g.reduce((n, x) => n + x.count, 0)).toBe(34);
    for (const x of g) expect(x.steady + x.long, x.name).toBe(x.count);
  });

  it('splits the 17 victory jerks into 6 on a camera-cut swap and 11 that are not, and says so in the headline row', () => {
    const g = groups();
    const cam = g.find((x) => /victory pose, at a camera-cut swap/.test(x.name));
    const hard = g.find((x) => /victory pose, hard swap with no camera cut/.test(x.name));
    expect(cam?.count).toBe(6);
    expect(hard?.count).toBe(11);
    const row = PLAN.split('\n').find((l) => l.startsWith('| gated swap jerks of 40 px or more (027)'))!;
    expect(row).toContain('17 at a victory pose (6 on a camera-cut swap, 11 not)');
    expect(row).toContain('exactly the 34');
  });

  it('no longer calls the victory class the camera, and does not promise "about 21"', () => {
    expect(BODY).not.toContain('13 of the 30');
    expect(BODY).not.toContain('30 of the 34');
    expect(BODY).not.toContain('about 21');
    expect(BODY).not.toContain('the camera has just cut to a close-up');
    expect(PLAN).toContain('34 to 28');
    expect(PLAN).toMatch(/Den of Woe, Fallen Aeons and Sin core have no victory swap at a camera cut \(0 of 15, 0 of 15, 0 of 10\)/);
    expect(HANDOFF).not.toContain('13 of the 30');
    expect(HANDOFF).not.toContain('gated swap jerks 34 to about 21');
  });

  it('names the held-chapters lever for the hard victory swaps and the repo still has it untaken for those chapters (the page says it is not taken)', () => {
    expect(PLAN).toContain('BLEND_HEAD_CHAPTERS');
    expect(PLAN).toContain('open question 3');
    // the page says the lever is one line per chapter and has not been taken; if a later change adds one of these chapters, this page is stale and must be updated
    for (const id of ['ffx2-den-of-woe', 'ffx2-fallen-aeons', 'sin-fins-core']) expect(Object.keys(BLEND_HEAD_CHAPTERS), id).not.toContain(id);
  });
});

describe('2. the frame the jerks fell on (review M2)', () => {
  it('splits the 34 into 18 on a steady frame and 16 on a long one, in the group table and the section 2 row', () => {
    const g = groups();
    expect(g.reduce((n, x) => n + x.steady, 0)).toBe(18);
    expect(g.reduce((n, x) => n + x.long, 0)).toBe(16);
    const row = PLAN.split('\n').find((l) => l.startsWith('| gated swap jerks of 40 px or more (027)'))!;
    expect(row).toContain('18 on a steady frame, 16 on a frame over 34 ms');
    expect(PLAN).toContain('swapJerksSteadyOverFail');
  });

  it('states every PR-0380 baseline for both counts, and has the ticket for the hard victory swaps', () => {
    expect(PLAN).toContain('both counts, 34 on every frame and 18 on steady frames');
    expect(PLAN).toContain('0380e the hard victory-to-idle swaps on stretched frames (11');
    expect(PLAN).toMatch(/\*\*M9\. The frame clock is inside the swap-jerk count\.\*\*/);
    expect(HANDOFF).toContain('18 on a steady frame, 16 on a frame over 34 ms');
  });

  it('has the item 3 jobs: the camera rule offline and in the browser, and the steady-frame read', () => {
    for (const id of ['J-MP-3a', 'J-MP-3b', 'J-MP-3c']) expect(HANDOFF, id).toContain(`**${id}**`);
    expect(PLAN).toMatch(/\| 3a \| change method \|/);
    expect(PLAN).toMatch(/\| 3b \| change method, then maybe a look \|/);
  });
});

describe('3. the rig head (review M3)', () => {
  it('does not ask for a new "part box" reading the probe already takes, and splits item 2 into a decision and a motion read', () => {
    expect(BODY).not.toContain('**Read Lulu\'s rig head from the part\'s own box**');
    expect(PLAN).toContain('The harness already reads the head part\'s own mesh');
    expect(PLAN).toMatch(/\| 2a \| change method \(a decision, not a reading\) \|/);
    expect(PLAN).toMatch(/\| 2b \| change method \(one browser job, a rig judged in motion\) \|/);
    expect(PLAN).toContain('By construction, a count and not a measurement');
    expect(BODY).not.toContain('at most 10 on the kept r68 recordings');
    expect(HANDOFF).toContain('**J-MP-2a**');
    expect(HANDOFF).toContain('**J-MP-2b**');
    expect(HANDOFF).not.toContain('with the rig head read from the part\'s own box');
  });

  it('does not rest "no size change" on a still strip', () => {
    expect(PLAN).toContain('no evidence either way');
    expect(BODY).not.toContain('shows no size change at the swap');
    expect(BODY).not.toContain('no visible change in the strip');
  });

  it('rests on facts that hold in the repo: the head bone scale is 1 to 1, the head part is the head-top polygon plus locks, the probe reads the mesh named head', () => {
    const lulu = JSON.parse(read('tools/rig/subjects/lulu.json')) as { fit: { scales: Record<string, number[]> }; cut: { parts: Record<string, { include: unknown[] }> } };
    expect(lulu.fit.scales['head']).toEqual([1, 1]);
    const head = JSON.stringify(lulu.cut.parts['head']);
    expect(head).toContain('head_top');
    expect(head).toContain('locks');
    const probe = read('critic/runner/lib/continuity-rig-probe.mjs');
    expect(probe).toContain("if (m.name === (cfg.headPart || 'head')) ha = ar;");
    expect(read('critic/runner/lib/continuity-rig.mjs')).toContain("const key = metric === 'head' ? 'ha' : 'ma';");
    // the page cites both
    expect(PLAN).toContain('fit.scales.head');
    expect(PLAN).toContain('cut.parts.head');
  });
});

describe('4. the documents themselves', () => {
  it('carry no local path, scratch folder, address or account id, and stay short', () => {
    for (const [name, text] of [['plan', PLAN], ['handoff', HANDOFF]] as const) {
      expect(/[A-Za-z]:[\\/]/.test(text), `${name}: a drive path`).toBe(false);
      expect(/pyrefly-scratch|pyrefly-release|Users[\\/]/i.test(text), `${name}: a local folder`).toBe(false);
      expect(text.includes(String.fromCharCode(64)), `${name}: an at sign`).toBe(false);
      expect(text.split('\n').length, `${name}: lines`).toBeLessThan(400);
    }
  });

  it('keep the revision log, and the handoff says what each finding became', () => {
    expect(PLAN).toContain('## 9. Revision log');
    expect(HANDOFF).toContain('## Review findings to fixes');
    for (const id of ['M1', 'M2', 'M3']) expect(HANDOFF, id).toContain(`**${id}`);
  });
});
