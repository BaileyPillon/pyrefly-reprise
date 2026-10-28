/**
 * MF-09, a FOE's knock-out (review F-3, 2026-10-27; both games, shared plumbing): the landing on the cut belongs to the runs that ARE the whole fall (the party's topple, a plain cross: `fallGain` 0).
 * A foe in `buckle-cross` (or `flip`) mode keeps the generic fall tween (`fallGain` 1: the body keeps sinking while the lying painting crosses in), so its thud stays on that tween's end, where the sink is done,
 * exactly as before the lane: the lane moved it 83 to 100 ms early (sink at 62 and 50 percent), the reverse of the glitch MF-09 fixes.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PaintedActor, painting, reset, type Actor } from './engine/head-lock-fixture.ts';
import { LivingFigure, type LifeCtx } from '../../src/engine/fx/mix/living.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import { setCurvesChapter, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setMomentsMode } from '../../src/engine/motion/MomentsSwitch.ts';
import { setSmearStyle } from '../../src/engine/motion/SmearSwitch.ts';

afterEach(() => {
  vi.restoreAllMocks();
  reset();
  setPaceGame('other');
  setPace('steady');
  setCurvesChapter(undefined);
  setCurvesMode(null);
  setMomentsMode(null);
  setSmearStyle(null);
});

type Game = 'ffx' | 'ffx2';
interface Row {
  landMs: number;
  cutMs: number;
  dropAtLand: number;
  fallGain: number;
}

function body(art: string, side: 'party' | 'enemy'): Actor {
  const a = new PaintedActor({ name: art, worldHeight: 1.82, side, breathe: false, sway: false, shadow: false });
  a.adoptPoses({ idle: painting(art, 'idle'), hurt: painting(art, 'hurt'), ko: painting(art, 'ko') }, 'idle');
  if (side === 'enemy') a.setFacing(-1);
  a.position.set(side === 'enemy' ? 2 : -2, 0, 0);
  a.setPose('idle', { immediate: true, force: true });
  return a;
}

function koRow(game: Game, demo: boolean, art: string, side: 'party' | 'enemy', hz = 120): Row {
  vi.spyOn(Math, 'random').mockImplementation(() => 0.3);
  setPaceGame(game);
  setPace('steady');
  if (demo) {
    setCurvesChapter(game === 'ffx' ? 'seymour-flux' : 'ffx2-bahamut');
    setCurvesMode('new');
    setMomentsMode('new');
    setSmearStyle('paint');
  }
  const a = body(art, side);
  const living = new LivingFigure(a);
  const dt = 1 / hz;
  const ctx = (d: number): LifeCtx => ({ dt: d, realDt: d, game, breath: false, collapse: true, rm: false, grid: [4, 6] });
  const A = a as unknown as { squashAmount: number; fallDrop: number; fallGain: number; slots: Array<{ fade: number; pose?: string } | undefined> };
  let landF = -1;
  let cutF = -1;
  let dropAt = 0;
  const koF = 12;
  for (let f = 0; f < 2 * hz; f++) {
    living.update(ctx(dt));
    if (f === koF) a.setPose('ko');
    a.update(dt, dt);
    if (f < koF) continue;
    if (landF < 0 && A.squashAmount > 0.02) {
      landF = f;
      dropAt = A.fallDrop;
    }
    const ko = A.slots.find((s) => s && s.pose === 'ko');
    if (cutF < 0 && ko && ko.fade >= 0.5) cutF = f;
  }
  const ms = (f: number): number => (f < 0 ? -1 : Math.round(((f - koF) * 1000) / hz));
  return { landMs: ms(landF), cutMs: ms(cutF), dropAtLand: dropAt, fallGain: A.fallGain };
}

describe('MF-09 leaves a foe\'s knock-out where it was: the thud when its own sink is done', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    for (const demo of [true, false]) {
      for (const art of ['tidus', 'bahamut']) {
        it(`${game} demo=${demo} ${art} (foe, buckle-cross)`, () => {
          const r = koRow(game, demo, art, 'enemy');
          if (process.env.MF_LOG) console.log('MF09-foe', game, demo, art, JSON.stringify(r));
          expect(r.fallGain).toBe(1); // the generic sink is on: the run is not the whole fall
          expect(r.landMs).toBeGreaterThanOrEqual(r.cutMs); // not before the lying painting is half drawn
          expect(r.dropAtLand).toBeGreaterThan(0.9); // the sink is done (it was 0.5 to 0.62 when the lane put the thud on the cut)
        });
      }
    }
  }
  for (const game of ['ffx', 'ffx2'] as const) {
    for (const demo of [true, false]) {
      it(`${game} demo=${demo} (a party figure's topple: the landing is still on the cut)`, () => {
        const r = koRow(game, demo, 'tidus', 'party');
        if (process.env.MF_LOG) console.log('MF09-party', game, demo, JSON.stringify(r));
        expect(r.landMs - r.cutMs).toBeLessThanOrEqual(9); // one frame at 120 Hz
        expect(r.landMs).toBeGreaterThanOrEqual(0);
      });
    }
  }
});
