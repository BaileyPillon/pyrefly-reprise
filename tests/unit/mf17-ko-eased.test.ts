/**
 * MF-17 (motion-fluidity pass, lane L2 "moves"; curves audit C-03 and C-12; both games, shared plumbing): a party figure's KO topple and revive, behind `?kotopple=` (`today` default, `eased`).
 *
 * Today the standing figure is already turning at 2.2 rad/s on its first 8 ms frame (40 percent of its final speed), speeds up to 6.2 rad/s in the last frame before the cut and has no weight shift
 * before it and no ease-out; a revive arrives upright at 7 to 12 px a frame and stops in two. `eased`: a longer collapse (500 ms FFX, 400 ms FFX-2 plus the cross), the turn and the slide on a
 * smootherstep (speed zero at both ends), the revive's rise on its mirror. The pure run (`KoFall.ts`) and the real actor under the real KO part, at 60, 120 and 144 Hz.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { KO_BUCKLE_EASED_MS, KO_BUCKLE_MS, RISE_EASED_MS, RISE_MS, fallRun, reviveRun, softEase, toppleEase, riseEase } from '../../src/engine/KoFall.ts';
import { TOPPLE_RAD } from '../../src/engine/KoTip.ts';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './engine/head-lock-fixture.ts';
import { LivingFigure, type LifeCtx } from '../../src/engine/fx/mix/living.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';

afterEach(() => {
  reset();
  setMoveWord('kotopple', null);
  setPaceGame('other');
  setPace('steady');
});

const FRAME: Record<number, number> = { 60: 1000 / 60, 120: 1000 / 120, 144: 1000 / 144 };

/** The tip (0..1 of TOPPLE_RAD) of a run at each frame of `hz`, and the angular speed in rad/s. */
function tips(run: NonNullable<ReturnType<typeof fallRun>>, hz: number): { tip: number[]; rate: number[] } {
  const dt = FRAME[hz]!;
  const tip: number[] = [run.pose.tip];
  for (let k = 0; k < 4000 && !run.done; k++) {
    run.step(dt, dt);
    if (!run.done) tip.push(run.pose.tip); // the frame the run ends resets the pose (the cut has been made): not a frame of the turn
  }
  const rate = tip.map((v, i) => (i ? (Math.abs(v - tip[i - 1]!) * TOPPLE_RAD) / (dt / 1000) : 0));
  return { tip, rate };
}

describe('the pure eases', () => {
  it('softEase has no speed at either end and is monotone', () => {
    expect(softEase(0)).toBe(0);
    expect(softEase(1)).toBe(1);
    expect(softEase(0.001)).toBeLessThan(1e-8);
    expect(1 - softEase(0.999)).toBeLessThan(1e-8);
    let last = 0;
    for (let i = 1; i <= 1000; i++) {
      const v = softEase(i / 1000);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
  });
});

describe('an eased topple', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    for (const hz of [60, 120, 144]) {
      it(`${game} at ${hz} Hz: the first frame turns at 1 rad/s or less and the last frame before the cut at 1.5 or less (today 2.2 to 2.6 and 5.9 to 6.2)`, () => {
        const today = tips(fallRun('topple', game)!, hz);
        const eased = tips(fallRun('topple', game, undefined, undefined, true)!, hz);
        expect(today.rate[1]!).toBeGreaterThan(1.8);
        expect(Math.max(...today.rate.slice(-3))).toBeGreaterThan(3);
        expect(eased.rate[1]!).toBeLessThanOrEqual(1.0);
        expect(Math.max(...eased.rate.slice(-3))).toBeLessThanOrEqual(1.5);
      });
    }
    it(`${game}: the collapse lasts ${game === 'ffx' ? 500 : 400} ms plus the cross, the turn reaches the lying painting exactly, the slide is the same ease`, () => {
      const run = fallRun('topple', game, undefined, undefined, true)!;
      expect(run.opts.holdMs).toBe(KO_BUCKLE_EASED_MS[game]);
      expect(run.opts.eased).toBe(true);
      expect(KO_BUCKLE_EASED_MS[game]).toBeGreaterThan(KO_BUCKLE_MS[game]);
      const { tip } = tips(run, 120);
      expect(tip.at(-1)!).toBeGreaterThan(0.99);
      expect(run.pose.slide).toBe(0); // done: reset
      const r2 = fallRun('topple', game, undefined, undefined, true)!;
      r2.step(300, 300);
      expect(r2.pose.slide).toBeCloseTo(r2.pose.tip, 9);
    });
    it(`${game}: today's run is exactly as it was (the word off, the mode the same)`, () => {
      const run = fallRun('topple', game)!;
      expect(run.opts.eased).toBeUndefined();
      expect(run.opts.holdMs).toBe(KO_BUCKLE_MS[game]);
      run.step(100, 100);
      expect(run.pose.tip).toBeCloseTo(toppleEase(100 / (KO_BUCKLE_MS[game] + 75)), 9);
    });
  }

  it('only a party figure\'s topple is eased: a colossus\'s buckle-cross and the real-clip modes keep today\'s', () => {
    expect(fallRun('buckle-cross', 'ffx', undefined, undefined, true)!.opts.eased).toBeUndefined();
    expect(fallRun('buckle-cross', 'ffx', undefined, undefined, true)!.opts.holdMs).toBe(KO_BUCKLE_MS.ffx);
    expect(fallRun('topple', 'ffx', undefined, 600, true)!.opts.eased).toBeUndefined();
    expect(fallRun('topple', 'ffx', undefined, 600, true)!.opts.holdMs).toBe(600);
  });
});

describe('an eased revive', () => {
  it('arrives upright at rest: the last two frames turn at 0.5 rad/s or less (today 7 to 12 px a frame, then 0 in two frames)', () => {
    for (const hz of [60, 120, 144]) {
      const today = reviveRun(true);
      const eased = reviveRun(true, true);
      const dt = FRAME[hz]!;
      const speeds = (r: ReturnType<typeof reviveRun>): number[] => {
        const tip: number[] = [r.pose.tip];
        for (let k = 0; k < 4000 && !r.done; k++) {
          r.step(dt, dt);
          if (!r.done) tip.push(r.pose.tip);
        }
        return tip.map((v, i) => (i ? (Math.abs(v - tip[i - 1]!) * TOPPLE_RAD) / (dt / 1000) : 0));
      };
      const t = speeds(today);
      const e = speeds(eased);
      expect(Math.max(...t.slice(-4, -1))).toBeGreaterThan(1.0);
      expect(Math.max(...e.slice(-2))).toBeLessThanOrEqual(0.5);
      expect(e.at(-1)!).toBeLessThanOrEqual(0.2);
      expect(e[1]!).toBeLessThanOrEqual(0.5); // and it leaves the floor from rest
    }
    expect(RISE_EASED_MS + 75).toBeLessThanOrEqual(520); // inside the presenter's revive wait (TIMING.revive)
    expect(RISE_MS).toBeLessThan(RISE_EASED_MS);
    expect(riseEase(1)).toBe(0);
  });
  it('a figure that never topples revives as before (no travel: only the short cross)', () => {
    const r = reviveRun(false, true);
    expect(r.opts.eased).toBeUndefined();
    expect(r.opts.riseMs).toBe(0);
  });
});

// ------------------------------------------------------------------ the real actor under the real KO part

const FRAME_ACTOR = 1000 / 120;
function tidus(): Actor {
  const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('tidus', 'idle'), ko: painting('tidus', 'ko') }, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}
function koLanding(game: 'ffx' | 'ffx2', eased: boolean): { cutMs: number; landMs: number; landings: number } {
  setPaceGame(game);
  setMoveWord('kotopple', eased ? 'eased' : 'today'); // release 68 made eased the default: the baseline names today
  const a = tidus();
  const living = new LivingFigure(a);
  const ctx = (d: number): LifeCtx => ({ dt: d / 1000, realDt: d / 1000, game, breath: false, collapse: true, rm: false, grid: [4, 6] });
  const step = (d: number): void => {
    living.update(ctx(d));
    a.update(d / 1000, d / 1000);
  };
  for (let i = 0; i < 30; i++) step(FRAME_ACTOR);
  let landings = 0;
  const real = a as unknown as { squash: (ms?: number, amount?: number) => Promise<void> };
  const squash = real.squash.bind(a);
  real.squash = (ms?: number, amount?: number): Promise<void> => {
    if (amount === 0.5) landings++;
    return squash(ms, amount);
  };
  a.setPose('ko');
  let t = 0;
  let cutMs = -1;
  let landMs = -1;
  for (let i = 0; i < 200; i++) {
    step(FRAME_ACTOR);
    t += FRAME_ACTOR;
    const lying = slotsOf(a).find((s) => s.pose === 'ko');
    if (cutMs < 0 && lying && lying.fade >= 0.5) cutMs = t;
    if (landMs < 0 && landings > 0) landMs = t;
  }
  return { cutMs, landMs, landings };
}

describe('the real actor', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: an eased topple cuts later (${game === 'ffx' ? '575' : '475'} ms, not ${game === 'ffx' ? '295' : '245'}) and its landing is still on the cut, once, even though the fall tween ends first`, () => {
      const today = koLanding(game, false);
      const eased = koLanding(game, true);
      expect(eased.cutMs).toBeGreaterThan(today.cutMs + 150);
      expect(eased.cutMs).toBeLessThan(today.cutMs + 330);
      expect(eased.landings).toBe(1);
      expect(Math.abs(eased.landMs - eased.cutMs)).toBeLessThanOrEqual(FRAME_ACTOR + 1e-6);
      expect(today.landings).toBe(1);
      expect(Math.abs(today.landMs - today.cutMs)).toBeLessThanOrEqual(FRAME_ACTOR + 1e-6);
    });
  }
});
