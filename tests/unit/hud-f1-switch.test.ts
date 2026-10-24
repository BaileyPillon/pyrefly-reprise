// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { F1_DAMAGE_K, HUD_F1_TUNE, hudF1Game, hudF1ModeFromSearch, hudF1On, hudF1TextSizeOk, onHudF1Change, setHudF1Mode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { HEAL_SIZE, SMALL_SIZE, sizeFactor, TIER_SIZE } from '../../src/ui/common/proNumbers.ts';
import { F1_ROWS, commandRowsCap } from '../../src/ui/common/hudTextSize.ts';

/**
 * The F1 HUD's switch (lane "hud-f1", `ui/hudf1/HudF1Switch.ts`): default OFF, on with `?hud=f1` or the shared `?pack=demo`, `?hud=today` wins over the pack, and only in the two demo chapters
 * (Chapter I `seymour-flux` FFX, Chapter IV `ffx2-bahamut` FFX-2). Everything off is today's HUD (the command window keeps its six rows).
 */
afterEach(() => {
  setHudF1Mode(null);
  setDemoChapter(undefined);
  document.documentElement.removeAttribute('data-phone-battle');
  document.documentElement.removeAttribute('data-text-size');
  document.documentElement.removeAttribute('data-text-size-wide');
});

describe('the switch (pure address reader)', () => {
  it('is today with no page and with ?pack=off, and f1 with unrelated keys (r64, item 200b: the conference pack is the default)', () => {
    expect(hudF1ModeFromSearch(undefined)).toBe('today');
    expect(hudF1ModeFromSearch('?pack=off')).toBe('today');
    expect(hudF1ModeFromSearch('?demo=1&pack=off')).toBe('today');
    expect(hudF1ModeFromSearch('')).toBe('f1');
    expect(hudF1ModeFromSearch('?demo=1')).toBe('f1');
    expect(hudF1ModeFromSearch('?look=pro')).toBe('f1');
  });
  it('is on with ?hud=f1 and with ?pack=demo, and ?hud=today wins over the pack and over the default', () => {
    expect(hudF1ModeFromSearch('?hud=f1')).toBe('f1');
    expect(hudF1ModeFromSearch('?hud=F1')).toBe('f1');
    expect(hudF1ModeFromSearch('?pack=off&hud=f1')).toBe('f1');
    expect(hudF1ModeFromSearch('?demo=1&pack=demo')).toBe('f1');
    expect(hudF1ModeFromSearch('?pack=demo&hud=today')).toBe('today');
    expect(hudF1ModeFromSearch('?hud=today')).toBe('today');
    expect(hudF1ModeFromSearch('?hud=other')).toBe('f1'); // an unknown word names nothing: the default decides
    expect(hudF1ModeFromSearch('?pack=off&hud=other')).toBe('today');
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
    setHudF1Mode('today'); // r64: the page's own default is f1 now, so start from today's
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

describe("TEXT SIZE other than 100 gives the player today's HUD (hud-f1 review M5: the layout is authored at one size)", () => {
  it('is on at 100 (and with no attribute), off at 115 and 130, in both attributes', () => {
    setHudF1Mode('f1');
    setDemoChapter('seymour-flux');
    expect(hudF1On()).toBe(true);
    document.documentElement.dataset['textSize'] = '100';
    document.documentElement.dataset['textSizeWide'] = '100';
    expect(hudF1TextSizeOk()).toBe(true);
    expect(hudF1On()).toBe(true);
    for (const v of ['115', '130']) {
      document.documentElement.dataset['textSize'] = v;
      expect(hudF1On(), `data-text-size ${v}`).toBe(false);
      document.documentElement.dataset['textSize'] = '100';
      document.documentElement.dataset['textSizeWide'] = v;
      expect(hudF1On(), `data-text-size-wide ${v}`).toBe(false);
      document.documentElement.dataset['textSizeWide'] = '100';
    }
    expect(hudF1On()).toBe(true);
  });
  it("and the command window then keeps TEXT SIZE's own rows", () => {
    setHudF1Mode('f1');
    setDemoChapter('seymour-flux');
    document.documentElement.dataset['textSize'] = '130';
    expect(commandRowsCap(6)).toBe(4);
  });
});

describe('the F1 damage numeral is drawn larger than the glass one, and only while F1 plays (review M6)', () => {
  it('sizeFactor is the glass size times F1_DAMAGE_K for a damage figure and a heal, unchanged for the small words and with F1 off', () => {
    setHudF1Mode('today');
    setDemoChapter('seymour-flux');
    expect(sizeFactor('damage', 'normal')).toBe(TIER_SIZE.normal);
    setHudF1Mode('f1');
    expect(sizeFactor('damage', 'normal')).toBeCloseTo(TIER_SIZE.normal * F1_DAMAGE_K, 6);
    expect(sizeFactor('critical', 'critical')).toBeCloseTo(TIER_SIZE.critical * F1_DAMAGE_K, 6);
    expect(sizeFactor('heal', 'normal')).toBeCloseTo(HEAL_SIZE * F1_DAMAGE_K, 6);
    expect(sizeFactor('miss', 'normal')).toBe(SMALL_SIZE);
    setHudF1Mode('today');
    expect(sizeFactor('heal', 'normal')).toBe(HEAL_SIZE);
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
