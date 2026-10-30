// @vitest-environment jsdom
/**
 * Release 67, the driver's follow-on to the `?curves=real-snappy` pick (2026-10-28, under Bailey's delegation; his to overturn): `?strikeshape` reads `travel`. Without it the real-snappy strike
 * squeezes the real clips to 1.1 s and Paine's lunge becomes one frame (the clip's 66 ms swing is 34 ms: 228.5 px per 60 Hz frame at 2,560 wide, the plan's guard is about 60 at 1,600; the CP-05 cards).
 * With it the dash is the game's house dash (FFX 250 ms, FFX-2 200), the wind-up and the hold are at least 300 ms, and the return and the settle pay for it (`RealMotion.phasesOf`, pinned in depth by
 * `mf14-strike-shape.test.ts`, which names its word on every case).
 *
 * Pinned here: the default and its scope (exactly where `?curves=real-snappy` plays), that `?strikeshape=today` is the old shape, and what "the dash" is per figure. **A figure whose clip leaps
 * (`APPROACH_LEAP_MIN`: Tidus, Wakka, Seymour Flux, Bahamut) has no separate dash:** `RealStrike.realPre` plays its arc and its x path over wind-up PLUS travel as one leap (Tidus 308 + 250 = 558 ms, about half a
 * second); only a figure that crouches into the lunge (Yuna, Auron, Kimahri, Lulu, every FFX-2 girl) stands in a wind-up of 300 ms or more and then dashes for the house 250 or 200 ms.
 *
 * Game case: both (shared plumbing; the strike plays in Chapter I FFX and Chapter IV FFX-2, the pack on, a desktop-class screen).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { REAL_MOTION } from '../../src/data/motion/realMotion.ts';
import { curvesMode, realKind, setCurvesMode } from '../../src/engine/motion/CurvesSwitch.ts';
import { setDemoChapter, setPackScreen } from '../../src/engine/motion/DemoGate.ts';
import { MOVE_WORDS, moveWord, setMoveWord, type MoveKey } from '../../src/engine/motion/MoveSwitch.ts';
import { APPROACH_LEAP_MIN, houseTravel, phasesOf, profileOfRow } from '../../src/engine/motion/RealMotion.ts';
import { PROFILES, resolveStrike, sampleAt, type StrikeSample } from '../../src/engine/motion/StrikeCurve.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';

/** Point the page at an address and make every switch read it again (they read once). */
function visit(search: string): void {
  window.history.pushState({}, '', `/${search}`);
  setCurvesMode(null);
  for (const k of Object.keys(MOVE_WORDS) as MoveKey[]) setMoveWord(k, null);
}

afterEach(() => {
  visit('');
  setDemoChapter(undefined);
  setPackScreen(null);
  setPaceGame('other');
  setPace('steady');
});

const CH1 = 'seymour-flux';
const CH4 = 'ffx2-bahamut';
const ELSEWHERE = 'sinspawn-gui'; // a hidden chapter the treatment never reaches (Chapter II joined the treated list in release 69: a listed chapter is no longer a stable control, the inventory's 7.4)
const GAMES = [
  ['ffx', ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'seymourFlux']],
  ['ffx2', ['yuna', 'rikku', 'paine', 'bahamut']],
] as const;

/** The strike's dash is the house one now: the real-snappy strike is playing and `houseTravel` says so (its one reader). */
function houseDashNow(): boolean {
  const kind = realKind();
  return kind !== null && houseTravel(kind);
}

describe('?strikeshape=travel is the default, with the scope of ?curves=real-snappy', () => {
  it('reads travel in a pack chapter, and ?strikeshape=today brings back the clip\'s own dash (the row\'s phases, the same object)', () => {
    for (const chapter of [CH1, CH4]) {
      visit('');
      setDemoChapter(chapter);
      expect([moveWord('strikeshape'), curvesMode(), houseDashNow()]).toEqual(['travel', 'real-snappy', true]);
    }
    for (const [game, keys] of GAMES) {
      for (const k of keys) {
        const row = REAL_MOTION[game][k]!.attack!;
        visit('');
        expect(phasesOf(game, row, 'snappy').travelMs).toBe(PROFILES[game].travelMs); // 250 ms in FFX, 200 in FFX-2 (the clips' own are 17 to 147 ms at the 1.1 s pick)
        visit('?strikeshape=today');
        expect(phasesOf(game, row, 'snappy')).toBe(row.snappy);
      }
    }
  });

  it('is read only where the real-snappy strike plays: ?curves=new, today and real, ?pack=off, a phone and another chapter never read it (the word itself is not gated)', () => {
    const NOT_SNAPPY: Array<[string, string]> = [['?curves=new', CH4], ['?curves=today', CH4], ['?curves=real', CH4], ['?pack=off', CH1], ['?pack=today', CH1], ['', ELSEWHERE]];
    for (const [s, chapter] of NOT_SNAPPY) {
      visit(s);
      setDemoChapter(chapter);
      expect(houseDashNow()).toBe(false);
      expect(moveWord('strikeshape')).toBe('travel');
    }
    const row = REAL_MOTION.ffx2['paine']!.attack!;
    expect(phasesOf('ffx2', row, 'real')).toBe(row.real); // the real speed never reads the word
    visit('');
    setPackScreen('phone');
    setDemoChapter(CH4);
    expect(houseDashNow()).toBe(false);
    visit('?pack=demo'); // the booth address forces the pack on a phone, and the pick with it
    setDemoChapter(CH4);
    expect(houseDashNow()).toBe(true);
    visit('?curves=real-snappy&strikeshape=today');
    setDemoChapter(CH1);
    expect(houseDashNow()).toBe(false);
  });

  it('a forced word (the debug API\'s) beats the default, and null reads the address again', () => {
    visit('');
    setDemoChapter(CH4);
    setMoveWord('strikeshape', 'today');
    expect(houseDashNow()).toBe(false);
    setMoveWord('strikeshape', null);
    expect(houseDashNow()).toBe(true);
  });
});

describe('what "the dash" is per figure, at the default (the discrepancy the card agent found: Tidus measured as a 0.5 s approach)', () => {
  /** x of the strike (a share of the lunge) at the end of the wind-up, with the pick's strike at the game's default pace. */
  function xAtWindupEnd(game: 'ffx' | 'ffx2', key: string): { x: number; leaps: boolean; windupToContactMs: number } {
    setPaceGame(game);
    setPace('steady');
    const row = REAL_MOTION[game][key]!.attack!;
    const prof = profileOfRow(game, row, 'snappy');
    const shape = resolveStrike(prof, { distance: 1.4, height: 1.82, timeScale: 1 });
    const out: StrikeSample = { x: 0, lift: 0, sy: 1, lean: 0 };
    return { x: sampleAt(shape, 'pre', shape.windupMs, out).x, leaps: prof.real!.approach, windupToContactMs: prof.windupMs + prof.travelMs };
  }

  it('a figure whose clip leaps is already on its way when the wind-up time is over (one move over wind-up plus travel); a figure that crouches into the lunge is still pulled back (a stand, then the dash)', () => {
    visit('');
    for (const [game, keys] of GAMES) {
      for (const k of keys) {
        const row = REAL_MOTION[game][k]!.attack!;
        const { x, leaps } = xAtWindupEnd(game, k);
        expect(leaps).toBe(row.arc >= APPROACH_LEAP_MIN);
        if (leaps) expect(x).toBeGreaterThan(0.05);
        else expect(x).toBeLessThan(0);
      }
    }
    expect(['tidus', 'wakka', 'seymourFlux'].map((k) => xAtWindupEnd('ffx', k).leaps)).toEqual([true, true, true]);
    expect(['yuna', 'auron', 'kimahri', 'lulu'].map((k) => xAtWindupEnd('ffx', k).leaps)).toEqual([false, false, false, false]);
    expect(['yuna', 'rikku', 'paine'].map((k) => xAtWindupEnd('ffx2', k).leaps)).toEqual([false, false, false]);
    expect(xAtWindupEnd('ffx2', 'bahamut').leaps).toBe(true);
  });

  it('Tidus approaches over about half a second (wind-up 300 ms or more plus the 250 ms house travel), Paine stands 300 ms and dashes 200: neither is a one-frame jump', () => {
    visit('');
    const t = xAtWindupEnd('ffx', 'tidus').windupToContactMs;
    expect(t).toBeGreaterThanOrEqual(300 + 250);
    expect(t).toBeLessThan(650);
    const p = phasesOf('ffx2', REAL_MOTION.ffx2['paine']!.attack!, 'snappy');
    expect([p.windupMs, p.travelMs]).toEqual([300, 200]);
    visit('?strikeshape=today');
    expect(xAtWindupEnd('ffx', 'tidus').windupToContactMs).toBeLessThan(400); // the clip's own: 308 + 54 at the pick
    const old = phasesOf('ffx2', REAL_MOTION.ffx2['paine']!.attack!, 'snappy');
    expect(old.travelMs).toBeLessThan(50); // Paine's 34 ms: the one-frame dash
  });
});
