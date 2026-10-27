/**
 * MF-09 (motion-fluidity pass, lane L2 "moves"; curves audit C-02; both games, shared plumbing; NO look change): the knock-out's thud lands on the frame the body arrives.
 *
 * What was wrong (measured at an exact 120 Hz in the r64 build): the topple (`KoRun`, `fx/mix/living.ts`) runs on the UNPACED field clock and cuts to the lying painting at
 * 295 ms (FFX) / 245 ms (FFX-2) of the fall; the landing (squash, ground shake, KO settle) fired from the end of a 300 ms tween on the PACED clock (x1.2 FFX, x1.1 FFX-2 at the
 * default `steady` pace), so it came 58 ms (FFX) / 92 ms (FFX-2) after the body was already on the floor.
 *
 * The REAL `PaintedActor` under the REAL `LivingFigure`, stepped frame by frame the way the game steps it (`living.update`, then the actor), on a display of 60, 120 and 144 Hz
 * (exact fractional frames; the game's virtual-clock captures use 17/17/16, 8/8/9 and 7/7/7/7/7/7/6 ms, the same within a millisecond). The cut is the first frame the KO painting
 * is at least half drawn (the curves audit's own definition); the landing is the first frame the actor's ground shake or landing squash shows.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PaintedActor, painting, reset, slotsOf, type Actor } from './engine/head-lock-fixture.ts';
import { LivingFigure, type LifeCtx } from '../../src/engine/fx/mix/living.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setMomentsMode } from '../../src/engine/motion/MomentsSwitch.ts';
import { setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';

afterEach(() => {
  reset();
  setPaceGame('other');
  setPace('steady');
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setMomentsMode(null);
  setSmearStyle(null);
});

type Game = 'ffx' | 'ffx2';
const FRAME_MS: Record<number, number> = { 60: 1000 / 60, 120: 1000 / 120, 144: 1000 / 144 };

function tidus(): Actor {
  const a = new PaintedActor({ name: 'tidus', worldHeight: 1.82, side: 'party', breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting('tidus', 'idle'), ko: painting('tidus', 'ko') }, 'idle');
  a.position.set(-2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}

interface Landing {
  /** ms from the KO call to the first frame the KO painting is at least half drawn. */
  cutMs: number;
  /** ms from the KO call to the first frame the landing shows (the ground shake or the squash). */
  landMs: number;
  gap: number;
  /** How many times the squash was started (must be 1: the landing happens once). */
  landings: number;
}

/** A KO in `game` at `hz`. `demo` plays it as the live game does in Chapters I and IV (the pack on: the smear's cut). */
function ko(game: Game, hz: number, demo: boolean, rm = false): Landing {
  setPaceGame(game);
  setPace('steady');
  if (demo) {
    setCurvesChapter(game === 'ffx' ? 'seymour-flux' : 'ffx2-bahamut');
    setCurvesMode('new');
    setMomentsMode('new');
    setSmearStyle('paint');
  }
  const a = tidus();
  const living = new LivingFigure(a);
  const dt = FRAME_MS[hz]!;
  const ctx = (d: number): LifeCtx => ({ dt: d / 1000, realDt: d / 1000, game, breath: false, collapse: true, rm, grid: [4, 6] });
  const step = (d: number): void => {
    living.update(ctx(d));
    a.update(d / 1000, d / 1000);
  };
  for (let i = 0; i < 40; i++) step(dt); // the figure has stood a while (the smear's frame average settles)
  let landings = 0;
  const real = a as unknown as { squash: (ms?: number, amount?: number) => Promise<void> };
  const squash = real.squash.bind(a);
  real.squash = (ms?: number, amount?: number): Promise<void> => {
    if (amount === 0.5) landings++; // the fall's landing slap (280 ms, 0.5); other squashes are not counted
    return squash(ms, amount);
  };
  a.setPose('ko');
  let t = 0;
  let cutMs = -1;
  let landMs = -1;
  for (let i = 0; i < Math.round((1200 / 1000) * hz); i++) {
    step(dt);
    t += dt;
    const lying = slotsOf(a).find((s) => s.pose === 'ko');
    if (cutMs < 0 && lying && lying.fade >= 0.5) cutMs = t;
    const inner = (a as unknown as { inner: { scale: { y: number } } }).inner;
    const shaking = ((a as unknown as { shakeLeftMs: number }).shakeLeftMs ?? 0) > 0;
    if (landMs < 0 && t > 60 && (shaking || Math.abs(inner.scale.y - 1) > 0.02)) landMs = t;
  }
  return { cutMs, landMs, gap: landMs - cutMs, landings };
}

describe('MF-09: the KO landing is on the frame the body arrives', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    for (const demo of [true, false]) {
      for (const hz of [60, 120, 144]) {
        it(`${game} ${demo ? 'with the pack (the smear cut)' : 'plain cross'} at ${hz} Hz: the landing shows within one display frame of the cut`, () => {
          const r = ko(game, hz, demo);
          if (process.env['MF_LOG']) console.log(JSON.stringify({ game, demo, hz, ...r }));
          expect(r.cutMs, 'the KO painting is drawn').toBeGreaterThan(0);
          expect(r.landMs, 'the landing shows').toBeGreaterThan(0);
          expect(r.gap).toBeLessThanOrEqual(FRAME_MS[hz]! * 1.01);
          expect(r.gap).toBeGreaterThanOrEqual(-FRAME_MS[hz]! * 1.01);
          expect(r.landings, 'the landing fires once').toBe(1);
        });
      }
    }
  }

  it('REDUCE MOTION (a plain cut, no run) keeps the tween\'s own landing: nothing moves earlier', () => {
    const r = ko('ffx', 120, true, true);
    expect(r.landings).toBe(1);
    expect(r.landMs).toBeGreaterThan(0.3 * 1000 * 1.0); // the 300 ms fall tween, stretched by the pace: the landing is not pulled forward
  });

  it('the landing never fires twice: the tween\'s later end finds it already done', () => {
    const r = ko('ffx2', 120, false);
    expect(r.landings).toBe(1);
  });
});
