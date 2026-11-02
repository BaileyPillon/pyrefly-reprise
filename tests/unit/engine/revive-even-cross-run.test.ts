/**
 * **What the even revive cross changes and what it leaves alone** (r74-revive, PR-0570; BOTH games; the harness reading is `revive-even-cross.test.ts`): the run's numbers (160 ms cross, 480 ms in all, inside the
 * presenter's 520), `?revive=today` as release 73's run frame by frame, the held eased revive and the figures that never topple keeping the capped cross, REDUCE MOTION, the fall, the cross's maths, the
 * address, and the table of KO silhouette stances the harness tests use.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { KO_CROSS_PEAK } from '../../../src/engine/PoseBlend.ts';
import { TIMING } from '../../../src/engine/BattlePresenterEvents.ts';
import { KO_CROSS_MS, REVIVE_EVEN_MS, REVIVE_MS, RISE_EASED_MS, RISE_MS, reviveRun } from '../../../src/engine/KoFall.ts';
import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';
import { REVIVE_CROSS_MS, REVIVE_DEFAULT, reviveCross, reviveEvenOn, reviveWordFromSearch, setReviveWord, type ReviveWord } from '../../../src/engine/motion/ReviveCross.ts';
import { cameraAt, reset } from './head-lock-fixture.ts';
import { lying, rig, slots } from './ko-fall-fixture.ts';
import { decodeMask, estimateStance } from '../../../critic/runner/lib/continuity-silhouette.mjs';
import { FFX, FFX2, HZS, KO_STANCE, ROOT, downed, step } from './revive-even-fixture.ts';

beforeEach(() => setMoveWord('kotopple', 'today'));
afterEach(() => {
  reset();
  setMoveWord('kotopple', null);
  setReviveWord(null);
});
describe('what does not change', () => {
  it('?revive=today is release 73\'s run: 75 ms capped cross, 395 ms in all, the old fades frame by frame', () => {
    setReviveWord('today');
    expect(reviveEvenOn()).toBe(false);
    const run = reviveRun(true, false, reviveEvenOn());
    expect(run.opts).toEqual(reviveRun(true).opts);
    expect(run.opts.crossMs).toBe(KO_CROSS_MS);
    expect(KO_CROSS_MS + RISE_MS).toBe(REVIVE_MS);
    expect(REVIVE_MS).toBe(395);
    expect(run.opts.even).toBeUndefined();
  });

  it('the even run: 160 ms cross, 320 ms rise, 480 ms in all, inside the presenter\'s revive wait', () => {
    const run = reviveRun(true, false, true);
    expect(run.opts).toMatchObject({ kind: 'revive', crossMs: REVIVE_CROSS_MS, riseMs: RISE_MS, travel: true, buckle: true, even: true });
    expect(REVIVE_EVEN_MS).toBe(480);
    expect(REVIVE_EVEN_MS).toBeLessThan(TIMING.revive);
  });

  it('the held eased revive (?kotopple=eased, rise 420) and a figure that never topples keep the capped cross: the even word reads on neither', () => {
    const eased = reviveRun(true, true, true);
    expect(eased.opts.crossMs).toBe(KO_CROSS_MS);
    expect(eased.opts.riseMs).toBe(RISE_EASED_MS);
    expect(eased.opts.even).toBeUndefined();
    expect(KO_CROSS_MS + RISE_EASED_MS).toBeLessThan(TIMING.revive);
    const flat = reviveRun(false, false, true);
    expect(flat.opts).toEqual(reviveRun(false).opts);
    expect(flat.opts.crossMs).toBe(KO_CROSS_MS);
  });

  it('a revive under ?revive=today through the real actor takes 395 ms and its fades are the old cross\'s (the standing plane in on a square, the lying one out linearly)', () => {
    setReviveWord('today');
    for (const hz of HZS) {
      const s = downed('wakka', hz);
      const a = s.r.a;
      a.setPose('idle');
      const idle = slots(a).find((p) => p.pose === 'idle')!;
      const dt = 1000 / hz;
      let t = 0;
      let checked = 0;
      for (let i = 0; i < Math.round(0.1 * hz); i++) {
        step(s);
        t += dt;
        const u = Math.min(1, t / KO_CROSS_MS);
        if (u < 1) {
          expect(lying(a).fade, `${hz} Hz frame ${i}`).toBeCloseTo(1 - u, 6);
          expect(idle.fade, `${hz} Hz frame ${i}`).toBeCloseTo(u * u, 6);
          checked++;
        }
      }
      expect(checked).toBeGreaterThan(3);
    }
  });

  it('REDUCE MOTION still revives as the actor\'s own blend: no run, so no cross of either kind', () => {
    for (const w of ['today', 'even'] as ReviveWord[]) {
      setReviveWord(w);
      const r = rig('wakka', { rm: true });
      r.a.setPose('ko');
      for (let i = 0; i < 40; i++) r.frame();
      r.a.setPose('idle');
      expect(r.living.last).toMatchObject({ rises: 0, crosses: 0 });
    }
  });

  it('the fall is untouched by the word: a knock-out plays the same fades with either', () => {
    const fades = (w: ReviveWord): number[][] => {
      setReviveWord(w);
      const r = rig('wakka');
      r.a.setPose('ko');
      const rows: number[][] = [];
      for (let i = 0; i < 40; i++) {
        r.frame();
        const q = slots(r.a);
        rows.push([q[0]!.fade, q[1]!.fade]);
      }
      return rows;
    };
    expect(fades('even')).toEqual(fades('today'));
  });
});

describe('the cross\'s maths', () => {
  it('starts with the lying painting whole and ends with the standing one whole', () => {
    expect(reviveCross(0)).toEqual({ from: 1, to: 0 });
    expect(reviveCross(1)).toEqual({ from: 0, to: 1 });
    expect(reviveCross(-3)).toEqual(reviveCross(0));
    expect(reviveCross(7)).toEqual(reviveCross(1));
  });

  it('the incoming painting\'s share of the pair is u itself (an even share: each frame moves the weighted points the same way), and the lesser plane peaks at the old cap in the middle', () => {
    let lesser = 0;
    for (let i = 1; i < 200; i++) {
      const u = i / 200;
      const c = reviveCross(u);
      expect(c.to / (c.from + c.to), `u ${u}`).toBeCloseTo(u, 12);
      lesser = Math.max(lesser, Math.min(c.from, c.to));
      expect(Math.min(c.from, c.to)).toBeLessThanOrEqual(KO_CROSS_PEAK + 1e-12);
    }
    expect(lesser).toBeCloseTo(KO_CROSS_PEAK, 12);
    expect(reviveCross(0.5).from).toBeCloseTo(KO_CROSS_PEAK, 12);
    expect(reviveCross(0.5).to).toBeCloseTo(KO_CROSS_PEAK, 12);
  });

  it('the lying painting only ever goes down and the standing one only ever comes up', () => {
    let from = 1;
    let to = 0;
    for (let i = 1; i <= 400; i++) {
      const c = reviveCross(i / 400);
      expect(c.from).toBeLessThanOrEqual(from + 1e-12);
      from = c.from;
      if (i <= 200) expect(c.to).toBeGreaterThanOrEqual(to - 1e-12);
      to = c.to;
    }
  });

  it('the address: ?revive=today is release 73\'s, anything else (and no address) reads the pick, even', () => {
    expect(REVIVE_DEFAULT, 'the pick (the driver\'s call under Bailey\'s delegation): one line to flip').toBe('even');
    expect(reviveWordFromSearch(undefined)).toBe(REVIVE_DEFAULT);
    expect(reviveWordFromSearch('')).toBe(REVIVE_DEFAULT);
    expect(reviveWordFromSearch('?revive=today')).toBe('today');
    expect(reviveWordFromSearch('?revive=TODAY')).toBe('today');
    expect(reviveWordFromSearch('?revive=even')).toBe('even');
    expect(reviveWordFromSearch('?revive=nope&x=1')).toBe(REVIVE_DEFAULT);
    expect(reviveWordFromSearch('?curves=today')).toBe(REVIVE_DEFAULT);
  });
});

describe('the table of silhouette stances', () => {
  const art = resolve(ROOT, 'public', 'art', 'characters');
  it.skipIf(!existsSync(resolve(art, 'wakka', 'ko.png')))('matches what the harness reads from the approved KO paintings (runs where the art is on disk)', async () => {
    for (const [subject, want] of Object.entries(KO_STANCE)) {
      const mask = await decodeMask(readFileSync(resolve(art, subject, 'ko.png')));
      const got = estimateStance(mask);
      expect(got?.u, `${subject} u`).toBeCloseTo(want.u, 3);
      expect(got?.t, `${subject} t`).toBeCloseTo(want.t, 3);
    }
  });

  it('names a stance for every figure the tests above revive', () => {
    for (const s of [...FFX, ...FFX2]) expect(KO_STANCE[s], s).toBeDefined();
    expect(cameraAt(3).position.z).toBe(8);
  });
});
