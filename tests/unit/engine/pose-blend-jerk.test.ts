/**
 * FB-2 DISCLOSURE (visual-and-feel pass, r40-int fixer, 2026-10-11; both games): what the stepped dissolve costs the harness's CHK-027 jerk reading.
 *
 * Status (decision 53b, 2026-10-11): the stepped dissolve is built and pinned here, but OFF by default (`?poseblend=stepped` turns it on), because of exactly the
 * reading below; every actor runs the plain dissolve until Bailey has seen new loops and picked. `swap()` sets the switch itself, so this file reads both shapes whatever
 * the default is.
 *
 * Finding (the integration review): the stepped dissolve (Bailey's P2-A) was the actor's shape for every pose change. It moves the weight between the two
 * paintings in ONE frame at its step (1.00 / 0.21 to 0.29 / 0.71), so the harness's tracked head and feet, which are the FADE-WEIGHTED mean of the planes that
 * show (`figureTrack`), jump about twice as far in a single frame as under the plain dissolve, which spreads the same displacement over six or seven frames.
 * CHK-027 therefore reads MORE jerks at pose swaps than the plain dissolve did, where the plan (section 4) expected the count to fall. This is not a code bug: it
 * is what P2-A is. The FB-2 tests report the ghost metric only (`pose-blend-stepped.test.ts`, `pose-blend-composite.test.ts`); this file reports the other side
 * of the same trade, so the release can disclose it and nobody reads the jerk count as a regression of something else.
 *
 * Two things are pinned.
 *
 * 1. **Why the step cannot be spread (the finding's option b).** With the lesser painting capped at 0.30 and the body never thinning (the two fades add to at
 *    least 1), the pair of fades is always in one of two regions, the old painting whole (out at least 0.70, in at most 0.30) or the new one (out at most
 *    0.30, in at least 0.70), and for a cap under one half those two regions do not touch. Going from one to the other must therefore be a jump of at least
 *    1 - 2 * cap = 0.40 of a painting in one frame, at any frame rate. Spreading the step over two or three frames would put both paintings above the cap
 *    (a double image over the check's 0.40) or thin the body (a see-through dip), which is what the shape exists to avoid.
 * 2. **What it reads.** The REAL `PaintedActor`, the REAL registered heads and the harness's own `figureTrack` / `detectJerks` with the policy's thresholds, on the
 *    64 key-chain and hurt pairs of eight characters at the production-like camera (7.7 up, 9.9 back, about 1600 px wide): the stepped dissolve reads a jump of
 *    40 px or more in a single frame on some pairs and the plain dissolve on none. The numbers are bounds on the measured ones (measured: 15 pairs of 64 against 0;
 *    the same probe over every ordered pair of the nine poses, 560 swaps, read 78 against 0 and 260 jerk events against 10), so a change to the shape that makes
 *    this worse fails here, and a change that makes it better has to say so.
 *
 * What would change it is a look change (a higher cap shrinks the jump: 0.39 reads 18 pairs of 560 against 78), which needs Bailey's pick first (rule 9); the
 * numbers and the question are in `docs/handoff/r40-blend-jerk.md`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PaintedActor, cameraAt, painting, reset, viewOf } from './head-lock-fixture.ts';
import { CFG, FRAME, anchors, record } from './ko-fall-fixture.ts';
import { PoseBlend, STEPPED_CAP, STEPPED_DISSOLVE, setPoseBlendStepped, type BlendPlane } from '../../../src/engine/PoseBlend.ts';
import { detectJerks, figureTrack } from '../../../critic/runner/lib/continuity-pure.mjs';

afterEach(() => {
  reset();
  setPoseBlendStepped(null);
});

const EPS = 1e-9;

describe('the step cannot be spread: with a cap under one half and no thinning, the trade is one jump of at least 1 - 2 * cap', () => {
  it('every sampled state of the shape is in the old painting\'s region or the new one\'s, and the two regions are a gap of 1 - 2 * cap apart', () => {
    expect(STEPPED_CAP).toBeLessThan(0.5);
    const gap = 1 - 2 * STEPPED_CAP;
    for (let i = 0; i <= 4000; i++) {
      const u = i / 4000;
      const out = STEPPED_DISSOLVE.out(u);
      const inn = STEPPED_DISSOLVE.inn(u);
      expect(out + inn, `u ${u}`).toBeGreaterThanOrEqual(1 - EPS); // the body never thins
      expect(Math.min(out, inn), `u ${u}`).toBeLessThanOrEqual(STEPPED_CAP + EPS); // the lesser painting is never over the cap
      const oldWhole = out >= 1 - STEPPED_CAP - EPS && inn <= STEPPED_CAP + EPS;
      const newWhole = out <= STEPPED_CAP + EPS && inn >= 1 - STEPPED_CAP - EPS;
      expect(oldWhole || newWhole, `u ${u}: out ${out.toFixed(3)} in ${inn.toFixed(3)} is in neither region`).toBe(true);
    }
    // the regions are separated on the outgoing plane's fade by exactly the gap
    expect(1 - STEPPED_CAP - STEPPED_CAP).toBeCloseTo(gap, 12);
  });

  it('at 30, 60, 120 and 144 fps and any phase the outgoing plane drops by at least the gap in a single frame (it cannot be spread over two)', () => {
    let seed = 7;
    const rnd = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const gap = 1 - 2 * STEPPED_CAP;
    for (const fps of [30, 60, 120, 144]) {
      const dt = 1000 / fps;
      for (let n = 0; n < 400; n++) {
        const planes: [BlendPlane, BlendPlane] = [{ fade: 1, pose: 'a' }, { fade: 0, pose: '' }];
        const blend = new PoseBlend(planes, STEPPED_DISSOLVE);
        const plan = blend.request('b', 120, 0);
        if (plan.same) throw new Error('same');
        planes[plan.to].pose = 'b';
        blend.advance(rnd() * dt); // a random phase inside the first frame
        let prev = planes[0].fade;
        let biggest = 0;
        for (let f = 0; f < 40 && blend.blending; f++) {
          blend.advance(dt);
          biggest = Math.max(biggest, prev - planes[0].fade);
          prev = planes[0].fade;
        }
        expect(biggest, `${fps} fps, run ${n}`).toBeGreaterThanOrEqual(gap - EPS);
      }
    }
  });
});

// ------------------------------------------------------------------ what the harness reads, through the real actor

const measure = JSON.parse(readFileSync(resolve(__dirname, '..', '..', '..', 'docs', 'target', 'pose-measure.json'), 'utf8')) as { subjects: Record<string, { poses: Record<string, unknown> }> };
const PAIRS: ReadonlyArray<readonly [string, string]> = [['ready', 'attack'], ['attack', 'follow'], ['follow', 'idle'], ['idle', 'ready'], ['hurt', 'idle'], ['idle', 'hurt'], ['attack', 'idle'], ['follow', 'ready']];
const CHARACTERS = ['tidus', 'auron', 'kimahri', 'lulu', 'rikku', 'wakka', 'yuna', 'paine-warrior'];

/** One pose change at 60 fps, the production-like camera: the biggest single-frame step of the harness's fade-weighted tracked head or feet, and the jerk events it flags. */
function swap(subject: string, from: string, to: string, plain: boolean): { worst: number; jerks: number } {
  setPoseBlendStepped(!plain);
  const a = new PaintedActor({ name: subject, worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  const poses: Record<string, ReturnType<typeof painting>> = {};
  for (const p of new Set(['idle', from, to])) poses[p] = painting(subject, p);
  a.adoptPoses(poses, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose(from, { immediate: true, force: true });
  const cam = cameraAt(7.7, 9.9);
  const step = (): void => {
    a.update(FRAME / 1000, FRAME / 1000);
    a.holdHead(viewOf(cam));
    a.updateMatrixWorld(true);
  };
  for (let i = 0; i < 6; i++) step();
  a.setPose(to);
  const an = anchors(a);
  const rec = (): ReturnType<typeof record> => record({ a, cam, living: null, over: {}, frame: () => {} } as never);
  const frames = [rec()];
  for (let i = 0; i < 16; i++) {
    step();
    frames.push(rec());
  }
  const track = frames.map((f, k) => {
    const t = figureTrack(f as never, an as never);
    return { n: k, t: k * FRAME, feet: t?.feet ?? null, head: t?.head ?? null, cam: [0, 0] as [number, number] };
  });
  let worst = 0;
  for (let i = 1; i < track.length; i++) {
    for (const part of ['feet', 'head'] as const) {
      const p = track[i - 1]![part];
      const q = track[i]![part];
      if (p && q) worst = Math.max(worst, Math.hypot(q[0] - p[0], q[1] - p[1]));
    }
  }
  return { worst, jerks: detectJerks(track, 1, CFG).length };
}

describe('through the real PaintedActor and the harness\'s own track: the stepped dissolve reads more jerks at a pose change than the plain one (disclosed)', () => {
  const rows: Array<{ id: string; stepped: { worst: number; jerks: number }; plain: { worst: number; jerks: number } }> = [];
  for (const subject of CHARACTERS) {
    const have = Object.keys(measure.subjects[subject]?.poses ?? {});
    for (const [from, to] of PAIRS) {
      if (!have.includes(from) || !have.includes(to)) continue;
      rows.push({ id: `${subject} ${from} to ${to}`, stepped: swap(subject, from, to, false), plain: swap(subject, from, to, true) });
    }
  }

  it('covers the eight characters and their key-chain and hurt pairs', () => {
    expect(rows.length).toBeGreaterThanOrEqual(56);
    expect(new Set(rows.map((r) => r.id.split(' ')[0])).size).toBe(CHARACTERS.length);
  });

  it('the plain dissolve never moves the tracked head or feet 40 px in a frame on these pairs, and flags almost no jerk', () => {
    for (const r of rows) expect(r.plain.worst, r.id).toBeLessThan(40);
    expect(rows.reduce((n, r) => n + r.plain.jerks, 0)).toBeLessThanOrEqual(4);
  });

  it('the stepped dissolve does: some pairs step 40 px or more in one frame (measured 15 of 64), and it flags more jerk events than the plain one, by a bounded amount', () => {
    const over40 = rows.filter((r) => r.stepped.worst >= 40).length;
    const steppedJerks = rows.reduce((n, r) => n + r.stepped.jerks, 0);
    const plainJerks = rows.reduce((n, r) => n + r.plain.jerks, 0);
    expect(over40, 'the disclosed consequence is there to be seen').toBeGreaterThan(0);
    expect(over40, 'and not worse than measured (15 of 64)').toBeLessThanOrEqual(20);
    expect(steppedJerks).toBeGreaterThan(plainJerks);
    expect(steppedJerks, 'bounded: measured 38 events over 64 pairs, the plain dissolve 2').toBeLessThanOrEqual(rows.length);
  });

  it('the single-frame step of the stepped dissolve is about twice the plain one\'s (measured 2.06 on average, 2.23 at the most), and never more than two and a half times it', () => {
    for (const r of rows) {
      expect(r.stepped.worst, r.id).toBeLessThanOrEqual(2.5 * r.plain.worst + 1);
    }
    const mean = (f: (r: (typeof rows)[number]) => number): number => rows.reduce((n, r) => n + f(r), 0) / rows.length;
    const ratio = mean((r) => r.stepped.worst) / mean((r) => r.plain.worst);
    expect(ratio).toBeGreaterThan(1.7);
    expect(ratio).toBeLessThan(2.4);
  });
});
