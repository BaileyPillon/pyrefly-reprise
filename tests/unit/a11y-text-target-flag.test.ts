/**
 * The target flag's TARGET label, damage line and note meet the 14 px floor at every desktop size (lane a11y-text, 2026-10-29; round 30b PR-0551, CHK-003; BOTH games: the flag is the pro look's and
 * FFX-2's ring carries it too; the report measured Chapter I).
 *
 * Round 30b's G1 sweep read the flag's TARGET label and PHYSICAL DAMAGE line at 11.0 and 11.0 px at 1280x720, 11.0 and 11.2 at 1440x1080 and 11.5 and 12.5 at 1600x900 (14.1 or more from 2000x1012): the two
 * `clamp()`s in `pro-markers.css` had an 11 px floor and a `vw` middle term that only passes 14 px at about 1900 px of width. The note ("already Hasted", "HP full") was 11 px at every size (`ffx-hud.css`;
 * the phone already had its 14 px rule). jsdom has no layout, so these tests evaluate the declared `font-size` of the real stylesheets at the sizes the check names.
 */
import { describe, expect, it } from 'vitest';
import { evalLength, lastDecl, leafRules, readSource } from './helpers/cssEval.ts';
import { plateWidth } from '../../src/ui/ffx/targetCursorParts.ts';

const FLOOR = 14;
const WINDOWS: ReadonlyArray<readonly [string, number, number]> = [
  ['1280x720', 1280, 720],
  ['1366x768', 1366, 768],
  ['1440x810', 1440, 810],
  ['1440x1080', 1440, 1080],
  ['1600x900', 1600, 900],
  ['1920x1080', 1920, 1080],
  ['2000x1012', 2000, 1012],
  ['2560x1440', 2560, 1440],
  ['3840x2160', 3840, 2160],
];

const pro = leafRules(readSource('src/ui/common/pro-markers.css'));
const base = leafRules(readSource('src/ui/ffx/ffx-hud.css'));

describe('PR-0551: the flag text is at least 14 px at every desktop window', () => {
  const FLAG: ReadonlyArray<readonly [string, string]> = [
    ['the TARGET label', '.ffx-targeting--pro .ffx-target__plate .ffx-target__lbl'],
    ['the damage line', '.ffx-targeting--pro .ffx-target__plate .ffx-target__help'],
    ['the letter tag', '.ffx-targeting--pro .ffx-target__tag'],
    ['the name', '.ffx-targeting--pro .ffx-target__name'],
  ];
  for (const [what, selector] of FLAG) {
    it(`${what}: the declared size never falls under ${FLOOR} px (${WINDOWS.map((w) => w[0]).join(', ')})`, () => {
      const value = lastDecl(pro, selector, 'font-size');
      expect(value, `${selector} declares a font-size`).toBeDefined();
      for (const [name, vw, vh] of WINDOWS) expect(evalLength(value!, { vw, vh }), `${what} at ${name}`).toBeGreaterThanOrEqual(FLOOR);
    });
  }

  it('the label and the damage line keep their growth with the window above the floor (a larger window is not pinned at 14)', () => {
    const lbl = lastDecl(pro, '.ffx-targeting--pro .ffx-target__plate .ffx-target__lbl', 'font-size')!;
    const help = lastDecl(pro, '.ffx-targeting--pro .ffx-target__plate .ffx-target__help', 'font-size')!;
    expect(evalLength(lbl, { vw: 3840, vh: 2160 })).toBe(18);
    expect(evalLength(help, { vw: 3840, vh: 2160 })).toBe(19);
    expect(evalLength(lbl, { vw: 1280, vh: 720 })).toBe(14);
    expect(evalLength(help, { vw: 1280, vh: 720 })).toBe(14);
  });

  it('the plate\'s note (the plain "already Hasted" / "HP full" line) is 14 px at every window, desktop and phone alike', () => {
    expect(lastDecl(base, '.ffx-target__note', 'font-size')).toBe('14px');
    const phone = leafRules(readSource('src/ui/common/phone-battle-parts.css'));
    expect(lastDecl(phone, 'html[data-phone-battle] .ffx-target__note', 'font-size')).toBe('14px');
  });
});

describe('the dock counts the flag\'s widest row at the floor size', () => {
  it('the damage line sets the width when it is wider than the name row (it is at 14 px: "PHYSICAL DAMAGE" is about 200 px with the flag\'s padding)', () => {
    const w = plateWidth({ name: 'Seymour Flux' }, true, 1280, 'PHYSICAL DAMAGE');
    expect(w).toBeGreaterThan(200);
    const without = plateWidth({ name: 'Seymour Flux' }, true, 1280, '');
    expect(without).toBeLessThan(w);
  });

  it('a long damage line (30 glyphs) is counted whole, and the label alone never counts under 150', () => {
    expect(plateWidth({ name: 'Yu Pagoda A' }, true, 1600, 'A'.repeat(30))).toBeGreaterThan(30 * 14 * 0.7);
    expect(plateWidth({ name: 'A' }, true, 1600, '')).toBeGreaterThanOrEqual(150);
  });

  it('the plain plate (flag off) is as it was: ~10 px a glyph, the tag chip, the padding, 64 at the least; a note counts 8 px a glyph', () => {
    expect(plateWidth({ name: 'Wakka' }, false, 1600)).toBe(Math.max(64, 5 * 10 + 28));
    expect(plateWidth({ name: 'Wakka', tag: 'B' }, false, 1600)).toBe(5 * 10 + 34 + 28);
    expect(plateWidth({ name: 'Wakka', note: 'HP full' }, false, 1600)).toBe(5 * 10 + 28 + 7 * 8);
  });

  it('the flag\'s name row keeps its old estimate (a bigger glyph with the window) when it is the widest', () => {
    // 1920 wide: glyph = clamp(27.8, 22, 38) / 2; 20 glyphs of name and a tag
    const w = plateWidth({ name: 'N'.repeat(20), tag: 'A' }, true, 1920, 'FIRE DAMAGE');
    expect(w).toBeCloseTo(20 * ((1920 * 0.0145) / 2) + 34 + 28, 5);
  });
});
