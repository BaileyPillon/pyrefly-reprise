/**
 * **What the even revive cross changes and what it leaves alone** (r74-revive, PR-0570; BOTH games; the harness reading is `revive-even-cross.test.ts`): the run's numbers (200 ms cross, 300 ms rise, 500 ms in all,
 * inside the presenter's 520), `?revive=today` as release 73's run frame by frame, the held eased revive and the figures that never topple keeping the capped cross, REDUCE MOTION, the fall, the cross's maths, the
 * address and the default read through `reviveWord()` with no address, the camera the fixture shares with the page, and the table of KO silhouette stances the harness tests use.
 *
 * Both worlds are read where it matters: a HEADLESS engine (no `location`: the demo motion is off, a revive's old cross is `KO_CROSS_MS`, 75 ms) and a PAGE (the demo motion is on by default, `koCrossMs()` is 100 ms,
 * `motion/DemoMotion.ts`), because the first r74 commit's tests ran the first and the game plays the second.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { KO_CROSS_PEAK } from '../../../src/engine/PoseBlend.ts';
import { TIMING } from '../../../src/engine/BattlePresenterEvents.ts';
import { KO_CROSS_MS, REVIVE_EVEN_MS, REVIVE_MS, RISE_EASED_MS, RISE_MS, koCrossMs, reviveRun } from '../../../src/engine/KoFall.ts';
import { demoMotionOn } from '../../../src/engine/motion/DemoMotion.ts';
import { setMoveWord } from '../../../src/engine/motion/MoveSwitch.ts';
import { REVIVE_CROSS_MS, REVIVE_DEFAULT, REVIVE_RISE_MS, reviveCross, reviveEvenOn, reviveWord, reviveWordFromSearch, setReviveWord, type ReviveWord } from '../../../src/engine/motion/ReviveCross.ts';
import { reset } from './head-lock-fixture.ts';
import { corners, lying, rig, slots } from './ko-fall-fixture.ts';
import { decodeMask, estimateStance } from '../../../critic/runner/lib/continuity-silhouette.mjs';
import { FFX, FFX2, HZS, KO_STANCE, LIVE_CAM_Z, LIVE_WAKKA_QUAD_PX, ROOT, downed, leavePage, pageWorld, step } from './revive-even-fixture.ts';

beforeEach(() => setMoveWord('kotopple', 'today'));
afterEach(() => {
  reset();
  leavePage();
  setMoveWord('kotopple', null);
  setReviveWord(null);
});

/** Run `body` in the headless world (the demo motion off: no `location`) and in the page's (on). */
const WORLDS: Array<{ name: string; page: boolean; cross: number }> = [
  { name: 'headless engine', page: false, cross: KO_CROSS_MS },
  { name: 'page (demo motion on)', page: true, cross: 100 },
];
const enter = (page: boolean): void => (page ? pageWorld() : leavePage());

describe('what does not change', () => {
  for (const w of WORLDS) {
    it(`[${w.name}] ?revive=today is release 73's run: ${w.cross} ms capped cross, ${w.cross + RISE_MS} ms in all`, () => {
      enter(w.page);
      setReviveWord('today');
      expect(reviveEvenOn()).toBe(false);
      const run = reviveRun(true, false, reviveEvenOn());
      expect(run.opts).toEqual(reviveRun(true).opts);
      expect(run.opts.crossMs).toBe(w.cross);
      expect(run.opts.crossMs).toBe(koCrossMs());
      expect(run.opts.riseMs).toBe(RISE_MS);
      expect(run.opts.even).toBeUndefined();
      if (!w.page) {
        expect(KO_CROSS_MS + RISE_MS).toBe(REVIVE_MS);
        expect(REVIVE_MS).toBe(395);
      }
    });

    it(`[${w.name}] the even run: ${REVIVE_CROSS_MS} ms cross, ${REVIVE_RISE_MS} ms rise, ${REVIVE_EVEN_MS} ms in all, inside the presenter's revive wait`, () => {
      enter(w.page);
      const run = reviveRun(true, false, true);
      expect(run.opts).toMatchObject({ kind: 'revive', crossMs: REVIVE_CROSS_MS, riseMs: REVIVE_RISE_MS, travel: true, buckle: true, even: true });
      expect(REVIVE_CROSS_MS).toBe(200);
      expect(REVIVE_RISE_MS).toBe(300);
      expect(REVIVE_EVEN_MS).toBe(500);
      expect(REVIVE_EVEN_MS).toBeLessThan(TIMING.revive);
      expect(TIMING.revive - REVIVE_EVEN_MS, 'a frame and a fifth at 60 Hz to spare').toBeGreaterThanOrEqual(1000 / 60);
      expect(REVIVE_CROSS_MS, 'longer than either world\'s old cross, so the Math.max in the run never picks the old one').toBeGreaterThan(Math.max(KO_CROSS_MS, koCrossMs()));
    });

    it(`[${w.name}] the held eased revive (?kotopple=eased, rise 420) and a figure that never topples keep the capped cross: the even word reads on neither`, () => {
      enter(w.page);
      const eased = reviveRun(true, true, true);
      expect(eased.opts.crossMs).toBe(w.cross);
      expect(eased.opts.riseMs).toBe(RISE_EASED_MS);
      expect(eased.opts.even).toBeUndefined();
      expect(w.cross + RISE_EASED_MS, 'not changed here: in a page the held eased revive is 100 + 420 = the 520 wait exactly (its comment said 495, the headless sum)').toBeLessThanOrEqual(TIMING.revive);
      const flat = reviveRun(false, false, true);
      expect(flat.opts).toEqual(reviveRun(false).opts);
      expect(flat.opts.crossMs).toBe(w.cross);
    });

    it(`[${w.name}] a revive under ?revive=today through the real actor takes ${w.cross + RISE_MS} ms and its fades are the old cross's (the standing plane in on a square, the lying one out linearly)`, () => {
      enter(w.page);
      setReviveWord('today');
      for (const hz of HZS) {
        const s = downed('wakka', hz);
        const a = s.r.a;
        a.setPose('idle');
        const idle = slots(a).find((p) => p.pose === 'idle')!;
        const dt = 1000 / hz;
        let t = 0;
        let checked = 0;
        let upright = -1;
        for (let i = 1; i <= Math.round(0.7 * hz); i++) {
          step(s);
          t += dt;
          const u = Math.min(1, t / w.cross);
          if (u < 1) {
            expect(lying(a).fade, `${hz} Hz frame ${i}`).toBeCloseTo(1 - u, 6);
            expect(idle.fade, `${hz} Hz frame ${i}`).toBeCloseTo(u * u, 6);
            checked++;
          }
          if (upright < 0 && idle.mesh.rotation.z === 0) upright = i;
        }
        expect(checked).toBeGreaterThanOrEqual(Math.floor((w.cross / 1000) * hz) - 1);
        expect((upright * 1000) / hz, `${hz} Hz: upright at`).toBeGreaterThanOrEqual(w.cross + RISE_MS - 1000 / hz);
        expect((upright * 1000) / hz, `${hz} Hz: upright at`).toBeLessThan(w.cross + RISE_MS + 2000 / hz);
      }
    });

    it(`[${w.name}] the fall is untouched by the word: a knock-out plays the same fades with either`, () => {
      enter(w.page);
      const fades = (word: ReviveWord): number[][] => {
        setReviveWord(word);
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
  }

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
});

describe('the address and the default', () => {
  it('?revive=today is release 73\'s, anything else (and no address) reads the pick', () => {
    expect(reviveWordFromSearch(undefined)).toBe(REVIVE_DEFAULT);
    expect(reviveWordFromSearch('')).toBe(REVIVE_DEFAULT);
    expect(reviveWordFromSearch('?revive=today')).toBe('today');
    expect(reviveWordFromSearch('?revive=TODAY')).toBe('today');
    expect(reviveWordFromSearch('?revive=even')).toBe('even');
    expect(reviveWordFromSearch('?revive=nope&x=1')).toBe(REVIVE_DEFAULT);
    expect(reviveWordFromSearch('?curves=today')).toBe(REVIVE_DEFAULT);
  });

  it('with no word forced and no address, reviveWord() and reviveEvenOn() read the default (the path the page takes)', () => {
    setReviveWord(null);
    expect(globalThis.location, 'a headless test has no address').toBeUndefined();
    expect(reviveWord()).toBe(REVIVE_DEFAULT);
    expect(reviveEvenOn()).toBe(REVIVE_DEFAULT === 'even');
  });

  for (const w of WORLDS) {
    it(`[${w.name}] a real revive with no word forced plays the DEFAULT's cross end to end: the lying painting is gone at ${REVIVE_DEFAULT === 'even' ? REVIVE_CROSS_MS : w.cross} ms`, () => {
      enter(w.page);
      setReviveWord(null);
      const want = REVIVE_DEFAULT === 'even' ? REVIVE_CROSS_MS : w.cross;
      for (const hz of HZS) {
        const s = downed('wakka', hz);
        const a = s.r.a;
        a.setPose('idle');
        let gone = -1;
        for (let i = 1; i <= Math.round(0.6 * hz) && gone < 0; i++) {
          step(s);
          if (lying(a).fade === 0) gone = i;
        }
        expect((gone * 1000) / hz, `${hz} Hz`).toBeGreaterThanOrEqual(want - 1);
        expect((gone * 1000) / hz, `${hz} Hz`).toBeLessThan(want + 2000 / hz);
      }
    });
  }

  it('THE PICK, pinned (the driver\'s call under Bailey\'s delegation, his to overturn): REVIVE_DEFAULT is even. Flipping it to today is that constant (motion/ReviveCross.ts) and this one line; every other test follows the default', () => {
    expect(REVIVE_DEFAULT).toBe('even');
  });
});

describe('the fixture shares the page\'s world', () => {
  it('the demo motion is the page default, and the fixture\'s camera draws Wakka\'s standing painting as tall as the live recording did (460 to 474 px)', () => {
    expect(demoMotionOn(), 'a headless test has the demo motion off').toBe(false);
    pageWorld();
    expect(demoMotionOn()).toBe(true);
    expect(koCrossMs(), 'a page\'s old cross is the demo\'s 100 ms').toBe(100);
    const s = downed('wakka', 60, 100);
    s.r.a.setPose('idle', { immediate: true, force: true });
    for (let i = 0; i < 40; i++) step(s);
    const idle = slots(s.r.a).find((p) => p.pose === 'idle')!;
    const c = corners(s.r.cam, idle.mesh.matrixWorld);
    const h = (c[7]! - c[1]! + (c[5]! - c[3]!)) / 2;
    expect(h, `Wakka's idle quad at z ${LIVE_CAM_Z}, px`).toBeGreaterThan(LIVE_WAKKA_QUAD_PX[0]);
    expect(h).toBeLessThan(LIVE_WAKKA_QUAD_PX[1]);
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
  });
});
