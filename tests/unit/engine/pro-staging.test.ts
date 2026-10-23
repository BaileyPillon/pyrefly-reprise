/**
 * The pro staging (lane "pro-staging"; branch pro-staging from playtest-1022): the switch, the move table, the held breath's plan and the mask of its windows. Both games; Chapter I (FFX) and Chapter IV (FFX-2) only.
 * The presenter's cues are in `pro-staging-presenter.test.ts`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import {
  setStagingMode,
  setStagingPieceOff,
  stagingGame,
  stagingModeFromSearch,
  stagingOffFromSearch,
  stagingOn,
  stagingPieceOn,
} from '../../../src/engine/pro/staging/StagingSwitch.ts';
import { bigMoveOf } from '../../../src/engine/pro/staging/StagingPort.ts';
import {
  BREATH_GUARD_MS,
  HUD_SINK_TO,
  LIFT_MS,
  TELL_MAX_MS,
  TELL_MIN_MS,
  breathExpired,
  breathFrame,
  tellLength,
  washMask,
  windowOf,
  type BreathMarks,
} from '../../../src/engine/pro/staging/BreathPlan.ts';

afterEach(() => {
  setStagingMode(null);
  setStagingPieceOff(null);
  setDemoChapter(undefined);
});

describe('the switch', () => {
  it('is off with no address key, on with ?pack=demo, and ?staging=today wins over the pack', () => {
    expect(stagingModeFromSearch(undefined)).toBe('today');
    expect(stagingModeFromSearch('')).toBe('today');
    expect(stagingModeFromSearch('?demo=1')).toBe('today');
    expect(stagingModeFromSearch('?staging=pro')).toBe('pro');
    expect(stagingModeFromSearch('?pack=demo')).toBe('pro');
    expect(stagingModeFromSearch('?pack=demo&staging=today')).toBe('today');
  });

  it('takes pieces back one by one', () => {
    expect([...stagingOffFromSearch('?stagingoff=card,ending')].sort()).toEqual(['card', 'ending']);
    expect([...stagingOffFromSearch('?stagingoff=nonsense')]).toEqual([]);
    expect(stagingOffFromSearch(undefined).size).toBe(0);
  });

  it('acts only in the two demo chapters', () => {
    setStagingMode('pro');
    expect(stagingOn()).toBe(false); // no chapter named
    setDemoChapter('seymour-flux');
    expect(stagingOn()).toBe(true);
    expect(stagingGame()).toBe('ffx');
    setDemoChapter('ffx2-bahamut');
    expect(stagingOn()).toBe(true);
    expect(stagingGame()).toBe('ffx2');
    setDemoChapter('braskas-final-aeon');
    expect(stagingOn()).toBe(false);
  });

  it('a piece taken back is off and the others stay on', () => {
    setStagingMode('pro');
    setDemoChapter('seymour-flux');
    setStagingPieceOff('card');
    expect(stagingPieceOn('card')).toBe(false);
    expect(stagingPieceOn('breath')).toBe(true);
    setStagingPieceOff('card', false);
    expect(stagingPieceOn('card')).toBe(true);
  });

  it('today is off even in a demo chapter', () => {
    setStagingMode('today');
    setDemoChapter('ffx2-bahamut');
    expect(stagingOn()).toBe(false);
    expect(stagingPieceOn('breath')).toBe(false);
  });
});

describe('the move table (game case: Total Annihilation is FFX only, Mega Flare FFX-2 only)', () => {
  it('names each move in its own game', () => {
    expect(bigMoveOf('total-annihilation', 'ffx')).toBe('total-annihilation');
    expect(bigMoveOf('mega-flare', 'ffx2')).toBe('mega-flare');
    expect(bigMoveOf('x2-bahamut-mega-flare', 'ffx2')).toBe('mega-flare');
  });
  it('never names the other game\'s move (FFX shares the id mega-flare for the aeon Bahamut: never staged)', () => {
    expect(bigMoveOf('mega-flare', 'ffx')).toBeNull();
    expect(bigMoveOf('x2-bahamut-mega-flare', 'ffx')).toBeNull();
    expect(bigMoveOf('total-annihilation', 'ffx2')).toBeNull();
  });
  it('knows no other move', () => {
    expect(bigMoveOf('cross-cleave', 'ffx')).toBeNull();
    expect(bigMoveOf('lance-of-atrophy', 'ffx')).toBeNull();
    expect(bigMoveOf(undefined, 'ffx')).toBeNull();
  });
});

describe('the held breath\'s plan', () => {
  const marks = (over: Partial<BreathMarks> = {}): BreathMarks => ({ markAt: 0, tellAt: 1000, tellMs: 1200, blowAt: null, liftAt: null, game: 'ffx', flood: false, tame: false, ...over });

  it('a tell is the effect\'s own lead-in, inside bounds', () => {
    expect(tellLength(1450)).toBe(TELL_MAX_MS);
    expect(tellLength(200)).toBe(TELL_MIN_MS);
    expect(tellLength(900)).toBe(900);
    expect(tellLength(Number.NaN)).toBe(TELL_MAX_MS);
  });

  it('nothing is drawn before the move is marked, and the name alone shows at the mark', () => {
    const none = breathFrame(500, marks({ markAt: null, tellAt: null }));
    expect(none).toMatchObject({ name: 0, drain: 0, ring: 0, core: 0, flash: 0, flood: 0, alive: false });
    expect(none.hud).toBe(1);
    const marked = breathFrame(600, marks({ tellAt: null }));
    expect(marked.name).toBeGreaterThan(0.9);
    expect(marked.drain).toBe(0);
    expect(marked.hud).toBe(1);
    expect(marked.alive).toBe(true);
  });

  it('the arena drains and the HUD sinks to a sixth over the tell, monotonically, and the ring gathers in', () => {
    let drain = 0;
    let hud = 1;
    let scale = 9;
    for (let t = 1000; t <= 2200; t += 50) {
      const f = breathFrame(t, marks());
      expect(f.drain).toBeGreaterThanOrEqual(drain - 1e-9);
      expect(f.hud).toBeLessThanOrEqual(hud + 1e-9);
      expect(f.ringScale).toBeLessThanOrEqual(scale + 1e-9);
      [drain, hud, scale] = [f.drain, f.hud, f.ringScale];
    }
    const end = breathFrame(2200, marks());
    expect(end.drain).toBeCloseTo(1, 5);
    expect(end.hud).toBeCloseTo(HUD_SINK_TO, 5);
    expect(end.ringScale).toBeCloseTo(1, 5);
    expect(end.ring).toBeGreaterThan(0.99);
    expect(end.core).toBeGreaterThan(0.99);
  });

  it('the blow flashes, then holds the wash a hair under full; the flash is a glow at most under REDUCE FLASHES', () => {
    const at = (ms: number, over: Partial<BreathMarks> = {}) => breathFrame(2200 + ms, marks({ blowAt: 2200, ...over }));
    expect(at(30).flash).toBeGreaterThan(0.7);
    expect(at(400).flash).toBe(0);
    expect(at(2000).drain).toBeGreaterThan(0.9);
    expect(at(2000).drain).toBeLessThan(1);
    expect(at(30, { tame: true }).flash).toBeLessThanOrEqual(0.3);
    expect(at(30).flood).toBe(0); // Total Annihilation opens no flood
  });

  it('Mega Flare opens a flood at the blow that settles but never goes (capped under REDUCE FLASHES)', () => {
    const at = (ms: number, over: Partial<BreathMarks> = {}) => breathFrame(2200 + ms, marks({ blowAt: 2200, flood: true, game: 'ffx2', ...over }));
    expect(at(0).flood).toBe(0);
    expect(at(200).flood).toBeGreaterThan(0.9);
    expect(at(3000).flood).toBeGreaterThan(0.3);
    expect(at(200, { tame: true }).flood).toBeLessThanOrEqual(0.35);
  });

  it('the lift takes everything away, the HUD included, and the layer is dead after it', () => {
    const base = { blowAt: 2200, liftAt: 4000 };
    const mid = breathFrame(4000 + LIFT_MS / 2, marks(base));
    expect(mid.drain).toBeGreaterThan(0.1);
    expect(mid.drain).toBeLessThan(0.9);
    expect(mid.hud).toBeGreaterThan(HUD_SINK_TO);
    const done = breathFrame(4000 + LIFT_MS, marks(base));
    expect(done.drain).toBeCloseTo(0, 5);
    expect(done.hud).toBeCloseTo(1, 5);
    expect(done.name).toBeCloseTo(0, 5);
    expect(done.alive).toBe(false);
  });

  it('a move whose end never arrives is let go; a marker that waits for its turn is not (for two minutes)', () => {
    expect(breathExpired(2200 + BREATH_GUARD_MS - 1, marks({ blowAt: 2200 }))).toBe(false);
    expect(breathExpired(2200 + BREATH_GUARD_MS + 1, marks({ blowAt: 2200 }))).toBe(true);
    expect(breathExpired(60000, marks({ tellAt: null }))).toBe(false);
    expect(breathExpired(130000, marks({ tellAt: null }))).toBe(true);
  });
});

describe('the windows in the wash', () => {
  it('a window is an ellipse around the figure\'s middle, with a floor so a small figure still gets a pool', () => {
    const w = windowOf({ x: 100, y: 200, w: 200, h: 300 });
    expect(w.cx).toBe(200);
    expect(w.cy).toBe(350);
    expect(w.rx).toBeCloseTo(128, 5);
    expect(w.ry).toBeCloseTo(192, 5);
    const small = windowOf({ x: 0, y: 0, w: 20, h: 20 });
    expect(small.rx).toBe(48);
    expect(small.ry).toBe(64);
  });
  it('the mask has one radial gradient per window, intersected, and a solid one for none', () => {
    const m = washMask([windowOf({ x: 0, y: 0, w: 100, h: 100 }), windowOf({ x: 300, y: 0, w: 100, h: 100 })]);
    expect(m.image.match(/radial-gradient/g)?.length).toBe(2);
    expect(m.composite).toBe('intersect');
    expect(washMask([]).image).not.toContain('radial');
  });
});
