/**
 * MF-14 V3 (motion-fluidity pass, lane L2; review F-6, 2026-10-27; both games): `?strikeshape=travel`, the strike of `?curves=real-snappy` with the dash kept at the house travel.
 * V1 (`real-snappy`) squeezes the real clips to 1.1 s, which makes Paine's 66 ms swing 34 ms (a teleport: 228 px in one 60 Hz frame at 2,560 wide, the plan's guard is about 60 at 1,600).
 * The plan's V3: the travel stays the house's (FFX 250 ms, FFX-2 200), the wind-up and the hold at least 300 ms, the return and the settle pay for it, the total stays the pick.
 * Default words are today: the row's own phases, the same object.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { REAL_MOTION } from '../../src/data/motion/realMotion.ts';
import { setMoveWord } from '../../src/engine/motion/MoveSwitch.ts';
import { TRAVEL_MIN_MS, TRAVEL_REST_SHARE, phasesOf, profileOfRow } from '../../src/engine/motion/RealMotion.ts';
import { PROFILES, defaultPaceFactor, resolveStrike, sampleAt, type StrikeSample } from '../../src/engine/motion/StrikeCurve.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';

afterEach(() => {
  setMoveWord('strikeshape', null);
  setPaceGame('other');
  setPace('steady');
});

const GAMES = [
  ['ffx', ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'seymourFlux']],
  ['ffx2', ['yuna', 'rikku', 'paine', 'bahamut']],
] as const;
const total = (p: { windupMs: number; travelMs: number; holdMs: number; returnMs: number; settleMs: number }): number => p.windupMs + p.travelMs + p.holdMs + p.returnMs + p.settleMs;

describe('MF-14 V3: the phases of the 1.1 s pick with the house travel', () => {
  it('today (the default) is the row\'s own object, and the real speed never reads the word', () => {
    for (const [game, keys] of GAMES) {
      for (const k of keys) {
        const row = REAL_MOTION[game][k]!.attack!;
        expect(phasesOf(game, row, 'snappy')).toBe(row.snappy);
        setMoveWord('strikeshape', 'travel');
        expect(phasesOf(game, row, 'real')).toBe(row.real);
        setMoveWord('strikeshape', null);
      }
    }
  });
  for (const [game, keys] of GAMES) {
    for (const k of keys) {
      it(`${game} ${k}: the same total, the house travel, wind-up and hold of at least 300 ms, the rest never under a fifth`, () => {
        const row = REAL_MOTION[game][k]!.attack!;
        setMoveWord('strikeshape', 'travel');
        const p = phasesOf(game, row, 'snappy');
        expect(Math.abs(total(p) - total(row.snappy))).toBeLessThanOrEqual(1);
        expect(p.travelMs).toBe(PROFILES[game].travelMs);
        expect(p.windupMs).toBeGreaterThanOrEqual(TRAVEL_MIN_MS);
        expect(p.windupMs).toBeGreaterThanOrEqual(row.snappy.windupMs); // never shortened
        expect(p.returnMs + p.settleMs).toBeGreaterThanOrEqual(TRAVEL_REST_SHARE * total(row.snappy) - 1);
        expect(p.holdMs).toBeGreaterThanOrEqual(0);
        for (const v of Object.values(p)) expect(Number.isInteger(v) && v >= 0).toBe(true);
        if (row.snappy.returnMs === 0) expect(p.returnMs).toBe(0); // Lulu's doll does not come back
      });
    }
  }
  it('the numbers behind the card: Tidus (FFX) and Paine (FFX-2)', () => {
    setMoveWord('strikeshape', 'travel');
    const t = phasesOf('ffx', REAL_MOTION.ffx['tidus']!.attack!, 'snappy');
    const p = phasesOf('ffx2', REAL_MOTION.ffx2['paine']!.attack!, 'snappy');
    if (process.env.MF_LOG) console.log('MF14-V3', JSON.stringify({ tidus: t, paine: p }));
    expect(t.travelMs).toBe(250);
    expect(p.travelMs).toBe(200);
    expect(p.windupMs).toBe(300);
    expect(p.holdMs).toBe(300);
  });
});

/** The largest move of the strike's x between two 60 Hz frames, as a share of the lunge distance, over wind-up plus travel. */
function peakShareAFrame(game: 'ffx' | 'ffx2', key: string, word: 'today' | 'travel' | 'house'): number {
  setPaceGame(game);
  setPace('steady');
  setMoveWord('strikeshape', word === 'travel' ? 'travel' : 'today');
  const row = REAL_MOTION[game][key]!.attack!;
  const shape = resolveStrike(word === 'house' ? PROFILES[game] : profileOfRow(game, row, 'snappy'), { distance: 1.4, height: 1.82, timeScale: 1 }); // 'house': today's own strike, no real clip
  const out: StrikeSample = { x: 0, lift: 0, sy: 1, lean: 0 };
  let last = sampleAt(shape, 'pre', 0, out).x;
  let peak = 0;
  for (let t = 1000 / 60; t <= shape.windupMs + shape.travelMs + 17; t += 1000 / 60) {
    const x = sampleAt(shape, 'pre', Math.min(t, shape.windupMs + shape.travelMs), out).x;
    peak = Math.max(peak, Math.abs(x - last));
    last = x;
  }
  setMoveWord('strikeshape', null);
  return peak;
}

describe('MF-14 V3: the dash no longer reads as a teleport', () => {
  it('Paine (FFX-2): nearly all of the lunge in one frame at the 1.1 s pick; with the house travel, the dash of the house strike', () => {
    const v1 = peakShareAFrame('ffx2', 'paine', 'today');
    const v3 = peakShareAFrame('ffx2', 'paine', 'travel');
    const v0 = peakShareAFrame('ffx2', 'paine', 'house');
    if (process.env.MF_LOG) console.log('MF14-peak-share-a-frame paine v1/v3/house', v1.toFixed(3), v3.toFixed(3), v0.toFixed(3));
    expect(v1).toBeGreaterThan(0.5);
    expect(v3).toBeLessThan(0.25);
    expect(Math.abs(v3 - v0)).toBeLessThan(0.02); // the same dash as the house one: the only change is what surrounds it
  });
  it('Tidus (FFX) and Rikku (FFX-2): the V3 dash is never faster than V1\'s', () => {
    for (const [g, k] of [['ffx', 'tidus'], ['ffx2', 'rikku']] as const) {
      const v1 = peakShareAFrame(g, k, 'today');
      const v3 = peakShareAFrame(g, k, 'travel');
      if (process.env.MF_LOG) console.log('MF14-peak-share-a-frame', k, v1.toFixed(3), v3.toFixed(3));
      expect(v3).toBeLessThanOrEqual(v1 + 1e-9);
    }
  });
  it('the paced total is the pick at the game\'s default pace', () => {
    for (const [game, keys] of GAMES) {
      setPaceGame(game);
      setPace('steady');
      for (const k of keys) {
        const row = REAL_MOTION[game][k]!.attack!;
        setMoveWord('strikeshape', 'travel');
        const s = resolveStrike(profileOfRow(game, row, 'snappy'), { distance: 1.4, height: 1.82, timeScale: 1 });
        setMoveWord('strikeshape', null);
        expect(Math.abs(s.windupMs + s.travelMs + s.holdMs + s.returnMs + s.settleMs - total(row.snappy) / defaultPaceFactor(game))).toBeLessThan(2);
      }
    }
  });
});
