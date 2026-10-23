// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { HUD_F1_TUNE, hudF1Game, hudF1ModeFromSearch, hudF1On, onHudF1Change, setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { F1_ROWS, commandRowsCap } from '../../src/ui/common/hudTextSize.ts';

/**
 * The F1 HUD's switch (lane "hud-f1", `ui/hudf1/HudF1Switch.ts`): default OFF, on with `?hud=f1` or the shared `?pack=demo`, `?hud=today` wins over the pack, and only in the two demo chapters
 * (Chapter I `seymour-flux` FFX, Chapter IV `ffx2-bahamut` FFX-2). Everything off is today's HUD (the command window keeps its six rows).
 */
afterEach(() => {
  setHudF1Mode(null);
  setDemoChapter(undefined);
  document.documentElement.removeAttribute('data-phone-battle');
});

describe('the switch (pure address reader)', () => {
  it('is today by default and with unrelated keys', () => {
    expect(hudF1ModeFromSearch(undefined)).toBe('today');
    expect(hudF1ModeFromSearch('')).toBe('today');
    expect(hudF1ModeFromSearch('?demo=1')).toBe('today');
    expect(hudF1ModeFromSearch('?look=pro')).toBe('today');
  });
  it('is on with ?hud=f1 and with ?pack=demo, and ?hud=today wins over the pack', () => {
    expect(hudF1ModeFromSearch('?hud=f1')).toBe('f1');
    expect(hudF1ModeFromSearch('?hud=F1')).toBe('f1');
    expect(hudF1ModeFromSearch('?demo=1&pack=demo')).toBe('f1');
    expect(hudF1ModeFromSearch('?pack=demo&hud=today')).toBe('today');
    expect(hudF1ModeFromSearch('?hud=other')).toBe('today');
  });
});

describe('where it plays', () => {
  it('only in the two demo chapters, whatever the address says', () => {
    setHudF1Mode('f1');
    expect(hudF1On()).toBe(false); // no chapter named yet
    setDemoChapter('seymour-flux');
    expect(hudF1On()).toBe(true);
    expect(hudF1Game()).toBe('ffx');
    setDemoChapter('ffx2-bahamut');
    expect(hudF1On()).toBe(true);
    expect(hudF1Game()).toBe('ffx2');
    setDemoChapter('braska-final-aeon');
    expect(hudF1On()).toBe(false);
    expect(hudF1Game()).toBeUndefined();
  });
  it('is off in the demo chapters when the mode is today', () => {
    setHudF1Mode('today');
    setDemoChapter('seymour-flux');
    expect(hudF1On()).toBe(false);
  });
  it('tells a listener when the mode flips, and only then', () => {
    let n = 0;
    const off = onHudF1Change(() => (n += 1));
    setHudF1Mode('today');
    setHudF1Mode('today');
    expect(n).toBe(0);
    setHudF1Mode('f1');
    expect(n).toBe(1);
    off();
    setHudF1Mode('today');
    expect(n).toBe(1);
  });
});

describe('the command window keeps today\'s six rows with the switch off, and four verbs plus the faded tail with it on', () => {
  it('commandRowsCap', () => {
    setDemoChapter('seymour-flux');
    setHudF1Mode('today');
    expect(commandRowsCap(6)).toBe(6);
    setHudF1Mode('f1');
    expect(commandRowsCap(6)).toBe(F1_ROWS);
    expect(F1_ROWS).toBe(5);
    setDemoChapter('braska-final-aeon');
    expect(commandRowsCap(6)).toBe(6);
  });
});

describe('the provisional choices are named constants (one line each)', () => {
  it('holds the mockup\'s choices', () => {
    expect(HUD_F1_TUNE.ribbonStaysInAction).toBe(true);
    expect(HUD_F1_TUNE.floorPx).toBe(28);
    expect(HUD_F1_TUNE.slimDropsOd).toBe(true);
    expect(HUD_F1_TUNE.slideOutMs).toBeGreaterThanOrEqual(160);
    expect(HUD_F1_TUNE.slideOutMs).toBeLessThanOrEqual(180);
    expect(HUD_F1_TUNE.backAfterEndMs).toBe(220);
  });
});
