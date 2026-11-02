// @vitest-environment jsdom
/**
 * R74-FINS, THE HUD HALF (2026-11-02; FFX only, rule 14: Chapter XVII, `sin-fins-core`, is FFX's: CTB, Cid's Trigger Command, the airship range; the Fin plate is the Sin HUD's, `SinHud`, an FFX widget; FFX-2 has no panel of this kind
 * and its HUD never reads `sin-hud.css`). Class 9 of the earlier batches (`booth-b4-last-classes.test.ts`): a chapter-specific HUD panel against the F1 slab, read from the REAL stylesheets with the a11y-text lane's instrument
 * (`helpers/f1Zones.ts`, a 640 x 360 grid) and, new here, the plate's WIDTH read from the font file the page loads (`helpers/woff2Width.ts`), because the plate's width is its charge line's and a guessed character width is how a
 * "fits" turns into a major.
 *
 * What the release 71 lane found offline and kept the chapter out for (`docs/handoff/booth-b4-last.md` section 1): the plate (`left: 820`, `top: 56`, `min-width: 470` of the 1600 frame, so x 328 to at least 516 of the grid) sat on
 * the F1 turn strip (x 465 to 625.5, y 22 to 82) by at least 51 grid px. What this lane changed: under `.hud-f1` the plate is anchored by its right edge (`right: 467px`), 7.9 grid px short of the strip, and at TEXT SIZE 115 it
 * follows the strip left by 24 grid px (`translate: -60px`); above 115 the band between the ribbon and the strip is narrower than the plate, so the chapter keeps today's HUD (`HudF1Switch.F1_TEXT_CEILING`, as IX and XII do).
 *
 * After the review of f55189837 (2026-11-02; handoff section 12): the plate stands lower (top 82.3 px of the frame) under the HELP bar, the action banner steps under the plate (a `:has()` rule), the ribbon's skew is in the zone model, and the charge line's style and the plate's height are read from the sheet and the font.
 *
 * Every case that says "measured" below is a model of the browser (named in the case); the browser read is the next review's (jobs FIN-1 to FIN-4, FIN-9 and FIN-10 of the handoff, with predictions).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { F1_TEXT_CEILING, hudF1On, hudF1TextSizeOk, setHudF1Mode, setHudF1TextMode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { GAP, SKEW } from '../../src/ui/ffx/hudSafeZones.ts';
import { SIN_HUD_SELECTORS } from '../../src/ui/ffx/hudAvoidSelectors.ts';
import { FIN_CHARGED_TEXT } from '../../src/ui/ffx/sinHudModel.ts';
import { FFX_ZONES, f1ffx, f1text, ffxHud, painted, overlap, ctx, type Box } from './helpers/f1Zones.ts';
import { declsOf, evalLength, evalPair, lastDecl, leafRules, readSource } from './helpers/cssEval.ts';
import { fontMetrics, textWidth } from './helpers/woff2Width.ts';

const ID = 'sin-fins-core';
const root = document.documentElement;
const sin = leafRules(readSource('src/ui/ffx/sin-hud.css'));
const slabs = leafRules(readSource('src/ui/inkgold/slabs.css'));
/** The Sin HUD's frame is 1600 wide and scaled into the 640 grid by 0.4 (`SinHud.ts`: `GRID_W / MOCK_W`). */
const K = 640 / 1600;

/** The F1 slabs near the plate (`HudF1.ts`: the ribbon, the cue and the prompt bar are `.f1-slab`, sheared by `skewX`): their painted box is `SKEW x height` wider than the declared one, half each side. The review of f55189837 found the ribbon's missing from the zone model. */
const SLABS = new Set(['boss ribbon', 'cue', 'prompt bar']);
/** A zone's painted box at a text size, widened by the shear where the zone is a skewed slab. */
const ZONE = (name: string, ts: number): Box => {
  const b = painted(FFX_ZONES.find((z) => z.name === name)!, ts);
  const grow = SLABS.has(name) ? (SKEW * b.h) / 2 : 0;
  return { l: b.l - grow, t: b.t, w: b.w + 2 * grow, h: b.h };
};
const sep = (a: Box, b: Box): number => Math.hypot(Math.max(0, a.l - (b.l + b.w), b.l - (a.l + a.w)), Math.max(0, a.t - (b.t + b.h), b.t - (a.t + a.h)));

const BASE = '.ffx-sinfin';
const F1 = '.ffxhud.hud-f1 .ffx-sinhud:not(.ffx-sinhud--phone) .ffx-sinfin';
const F1_115 = `html[data-text-size='115']:not([data-phone-battle]) ${F1}`;

/** A `padding` shorthand's four numbers (top, right, bottom, left), frame px. */
const pad = (rules: typeof sin, sel: string): [number, number, number, number] => {
  const p = lastDecl(rules, sel, 'padding')!.split(/\s+/).map(parseFloat);
  return [p[0]!, p[1] ?? p[0]!, p[2] ?? p[0]!, p[3] ?? p[1] ?? p[0]!];
};

// ---------------------------------------------------------------------------------------------------------------- the plate's width, from the font

const CHAKRA = fontMetrics('public/fonts/chakra-petch/ChakraPetch-Bold-700.woff2');
/** A `font` shorthand's size in px (the first number before `px`: `700 15px var(...)`, `italic 700 30px/1 var(...)`). */
const fontPx = (sel: string): number => parseFloat(/(\d+(?:\.\d+)?)px/.exec(lastDecl(sin, sel, 'font')!)![1]!);
/** The charge line's style, read from the sheet (review of f55189837, minor 2: the first cut hard-coded 15 px and 0.14em, so a wider letter-spacing in the sheet passed every case). */
const CHARGE = '.ffx-sinfin__charge';
const chargePx = (): number => fontPx(CHARGE);
const chargeSpacing = (): number => parseFloat(lastDecl(sin, CHARGE, 'letter-spacing')!); // em
/** The charge row: padding, the diamond (12), the gap and the line (Chakra Petch Bold at the sheet's size and spacing, uppercase). */
const chargeRow = (spacing: number = chargeSpacing()): number => {
  const [, pr, , pl] = pad(sin, CHARGE);
  const gap = parseFloat(lastDecl(sin, CHARGE, 'gap')!);
  const icon = parseFloat(lastDecl(sin, '.ffx-sinfin__charge i', 'width')!);
  return pl + icon + gap + textWidth(CHAKRA, FIN_CHARGED_TEXT.toUpperCase(), chargePx(), spacing) + pr;
};
/** The plate in the charged state, frame px: the left border, the padding and the charge row (the widest content), over the sheet's minimum. */
const plateWidth = (spacing: number = chargeSpacing()): number => {
  const [, pr, , pl] = pad(sin, BASE);
  const border = parseFloat(/(\d+)px/.exec(lastDecl(sin, BASE, 'border-left')!)![1]!);
  return Math.max(parseFloat(lastDecl(sin, BASE, 'min-width')!), border + pl + pr + chargeRow(spacing));
};
/**
 * The plate's height in the charged state, frame px, from the sheet: the padding (10 + 12), the name row (the serif's 30 px at line-height 1, or the range chip's padding 3 + 4 and a Chakra Petch 15 px line, whichever is taller), the charge
 * row's margin (8) and its own height (padding 6 + 7 and a 15 px line at the face's `line-height: normal`, 1.30 from the font file's `hhea`). 92.5 in the sheet as it stands (the first cut said 92: an estimate that stayed a guess).
 */
const plateHeight = (): number => {
  const [pt, , pb] = pad(sin, BASE);
  const [rt, , rb] = pad(sin, '.ffx-sinfin__range');
  const nameRow = Math.max(fontPx('.ffx-sinfin__name'), rt + rb + fontPx('.ffx-sinfin__range') * CHAKRA.lineHeight);
  const [ct, , cb] = pad(sin, CHARGE);
  return pt + pb + nameRow + parseFloat(lastDecl(sin, CHARGE, 'margin-top')!) + ct + cb + chargePx() * CHAKRA.lineHeight;
};
const PLATE_H = plateHeight();

/** The plate's PAINTED box at a text size: the layout box under the sheet's declarations for it, widened by the shear (`SKEW x height`, half each side), moved by the `translate` the sheet declares for that size, and down by the `top` the F1 rule declares. */
function plateAt(ts: number, f1: boolean): Box {
  const w = plateWidth();
  const right = f1 ? lastDecl(sin, F1, 'right') : undefined;
  const left = f1 && right !== undefined ? 1600 - parseFloat(right) - w : parseFloat(lastDecl(sin, BASE, 'left')!);
  const t = f1 && ts === 1.15 ? lastDecl(sin, F1_115, 'translate') : undefined;
  const dx = t === undefined ? 0 : evalPair(t, ctx(ts))[0];
  const top = parseFloat((f1 ? lastDecl(sin, F1, 'top') : undefined) ?? lastDecl(sin, BASE, 'top')!);
  return { l: (left + dx - (SKEW * PLATE_H) / 2) * K, t: top * K, w: (w + SKEW * PLATE_H) * K, h: PLATE_H * K };
}
const tip = (b: Box): number => b.l + b.w;

describe("the plate's width is its charge line's, read from the font the page loads", () => {
  it('the font has every character of the line (the middle dot too), so the read is the face and not a fallback', () => {
    for (const ch of FIN_CHARGED_TEXT.toUpperCase()) expect(CHAKRA.has(ch), JSON.stringify(ch)).toBe(true);
    expect(CHAKRA.upm).toBeGreaterThan(0);
  });

  it("the charge line's style is read from the sheet, and it is the face the font file is: Chakra Petch Bold (700, the display face), uppercase, one line (a sheet that changes the face or the spacing changes the width below)", () => {
    expect(lastDecl(sin, CHARGE, 'font')).toMatch(/^700 [\d.]+px var\(--ig-font-display\)$/);
    expect(lastDecl(sin, CHARGE, 'text-transform')).toBe('uppercase');
    expect(lastDecl(sin, CHARGE, 'white-space')).toBe('nowrap');
    expect(lastDecl(sin, CHARGE, 'letter-spacing')).toMatch(/^[\d.]+em$/);
    expect(chargePx()).toBe(15);
    expect(chargeSpacing()).toBe(0.14);
    expect(lastDecl(sin, '.ffx-sinfin__name', 'font')).toMatch(/\/1 var\(/); // the serif's line-height is 1, which plateHeight() assumes
  });

  it('the line is 406.8 frame px (39 characters, 15 px, 0.14em spacing), the row 448.8, the plate 489.8 = 195.9 grid px: wider than the sheet\'s 470 minimum, as the first lane\'s "at least 188" said', () => {
    expect(textWidth(CHAKRA, FIN_CHARGED_TEXT.toUpperCase(), chargePx(), chargeSpacing())).toBeCloseTo(406.8, 0);
    expect(chargeRow()).toBeCloseTo(448.8, 0);
    expect(plateWidth()).toBeCloseTo(489.8, 0);
    expect(plateWidth() * K).toBeCloseTo(195.9, 0);
    expect(plateWidth()).toBeGreaterThan(parseFloat(lastDecl(sin, BASE, 'min-width')!));
  });

  it("the plate's height is the sheet's: 92.5 frame px = 37.0 grid px in the charged state (the face's line-height normal is 1.30 from its hhea; the first cut's 92 was a guess)", () => {
    expect(CHAKRA.lineHeight).toBeCloseTo(1.3, 6);
    expect(PLATE_H).toBeCloseTo(92.5, 6);
    expect(PLATE_H * K).toBeCloseTo(37.0, 6);
  });

  it("a wider letter-spacing in the sheet would be seen: at 0.30em the plate no longer fits the band the 115 step leaves (review minor 2, mutation M10), at the sheet's 0.14em it does", () => {
    const band = ZONE('turn strip', 1.15).l - (ZONE('boss ribbon', 1.15).l + ZONE('boss ribbon', 1.15).w);
    expect(plateWidth(0.3) * K).toBeGreaterThan(band - 2 * GAP);
    expect(plateWidth() * K).toBeLessThan(band - 2 * GAP);
  });

  it("the other two lines are narrower: the calm line (Exo 2 14 px) is far under the minimum, and the name row (the serif's 30 px name, the chip) cannot reach the charge row", () => {
    // 33 characters at 14 px cannot be wider than 33 x 14 x 0.75 = 346 px (a generous average); the minimum is 470 - 41 of padding and border
    expect(33 * 14 * 0.75).toBeLessThan(470 - 41);
    // the name row: 9 characters of a serif at 30 px (a generous 0.6 em each) + the gap (12) + the chip (the longest word, NEAR) in Chakra Petch 15 px with 0.2em and its padding
    const chip = textWidth(CHAKRA, 'NEAR', 15, 0.2) + 20;
    expect(9 * 30 * 0.6 + 12 + chip).toBeLessThan(chargeRow());
  });
});

// ---------------------------------------------------------------------------------------------------------------- the instrument, validated first

describe('the instrument reads the KNOWN defect first: the plate as release 72 draws it sits ON the F1 turn strip', () => {
  it('at the default text size the unmoved plate (left 820) overlaps the turn strip by 51 grid px or more and no other F1 zone; the release 71 lane read the same from the minimum width', () => {
    const strip = ZONE('turn strip', 1);
    const unmoved = plateAt(1, false);
    const hits = FFX_ZONES.filter((z) => z.name !== 'sensor card (Intel)' && overlap(unmoved, ZONE(z.name, 1)) > 0).map((z) => z.name);
    expect(hits).toEqual(['turn strip']);
    expect(Math.min(tip(unmoved), strip.l + strip.w) - Math.max(unmoved.l, strip.l)).toBeGreaterThanOrEqual(51);
    expect(unmoved.l / K + (SKEW * PLATE_H) / 2).toBeCloseTo(820, 6); // the plate starts where the sheet says
  });
});

// ---------------------------------------------------------------------------------------------------------------- the fix, read from the sheet's own rules

describe('under .hud-f1 the plate stands in the band between the boss ribbon and the turn strip, at the two text sizes the F1 slab draws it', () => {
  it.each([1, 1.15])('at %s: the plate meets no F1 zone and is at least GAP (6) from every one', (ts) => {
    const plate = plateAt(ts, true);
    for (const z of FFX_ZONES) {
      expect(overlap(plate, ZONE(z.name, ts)), `${z.name} at ${ts}`).toBe(0);
      expect(sep(plate, ZONE(z.name, ts)), `${z.name} at ${ts}`).toBeGreaterThanOrEqual(GAP);
    }
  });

  it('the painted tip is 7.9 grid px short of the turn strip at 100 and 7.8 at 115 (the strip grows left by 24.1 and the plate follows by 24), the same shape as Chapter XII\'s disc strip (7.8)', () => {
    expect(ZONE('turn strip', 1).l - tip(plateAt(1, true))).toBeCloseTo(7.9, 1);
    expect(ZONE('turn strip', 1.15).l - tip(plateAt(1.15, true))).toBeCloseTo(7.8, 1);
  });

  it("the left end clears the boss ribbon's PAINTED edge (the ribbon is a skewed slab: its top-right corner is SKEW x height / 2 past the declared box, 2.66 grid px at 100 and 3.06 at 115) by 62.7 grid px at 100 and by 14.3 at 115, the plate's lowest-left corner included", () => {
    const r100 = ZONE('boss ribbon', 1);
    const r115 = ZONE('boss ribbon', 1.15);
    expect(r100.l + r100.w).toBeCloseTo(188 + (SKEW * 25) / 2, 6);
    expect(r115.l + r115.w).toBeCloseTo(212 + (SKEW * 28.75) / 2, 6);
    expect(plateAt(1, true).l - (r100.l + r100.w)).toBeCloseTo(62.7, 0);
    expect(plateAt(1, true).l).toBeCloseTo(253.4, 0);
    expect(plateAt(1.15, true).l - (r115.l + r115.w)).toBeGreaterThanOrEqual(GAP);
    expect(plateAt(1.15, true).l - (r115.l + r115.w)).toBeCloseTo(14.3, 0);
    expect(plateAt(1.15, true).l).toBeCloseTo(229.4, 0);
  });

  it("the layout box ends at 453.2 grid px at 100 (right: 467px of the 1600 frame) and the plate stands lower than release 72's: top 32.9 (82.3 px of the frame), y 32.9 to 69.9, under the HELP bar's foot and beside the strip's 22 to 82", () => {
    expect((1600 - parseFloat(lastDecl(sin, F1, 'right')!)) * K).toBeCloseTo(453.2, 6);
    expect(lastDecl(sin, F1, 'top')).toBe('82.3px');
    expect(lastDecl(sin, F1, 'left')).toBe('auto');
    expect(plateAt(1, true).t).toBeCloseTo(32.92, 6);
    expect(plateAt(1, true).t + plateAt(1, true).h).toBeCloseTo(69.92, 6);
    expect(plateAt(1.15, true).t).toBeCloseTo(32.92, 6); // the 115 step moves it sideways only
  });

  it("the band is wide enough at 100 and 115 and NOT at 130: 274.3, 225.9 and 177.4 grid px (to the ribbon's painted edge) against the plate's 195.9 plus a GAP on each side (207.9)", () => {
    const band = (ts: number): number => ZONE('turn strip', ts).l - (ZONE('boss ribbon', ts).l + ZONE('boss ribbon', ts).w);
    const need = plateWidth() * K + 2 * GAP;
    expect(band(1)).toBeCloseTo(274.3, 1);
    expect(band(1.15)).toBeCloseTo(225.9, 1);
    expect(band(1.3)).toBeCloseTo(177.4, 1);
    expect(band(1)).toBeGreaterThan(need);
    expect(band(1.15)).toBeGreaterThan(need);
    expect(band(1.3)).toBeLessThan(need);
  });
});

// ---------------------------------------------------------------------------------------------------------------- the two panels that share the plate's column: the HELP bar above it and the action banner below it

/*
 * The review of f55189837 (a model, not a browser run) found two panels the zone model does not list: the top HELP bar (`.ffx-helpbar`, the enemy's ability name, centred, y 4 to 26.9) that the plate's old top (22.4) stood under
 * for the plate's whole width, and the action banner (`.ig-banner`, left 21.33, top 43, 32 high) whose longest order lines ("Kimahri orders Cid to pull back": right edge 264.7) ran out past the plate's left end (255.3) while the
 * plate (z-index 12) is above it. The plate now stands 6.0 under the bar's foot, and the banner stands 6.0 under the plate's foot whenever the plate is there.
 */
const HELPBAR = '.ffx-helpbar';
const BANNER = '.ig-banner';
const BANNER_F1 = '.ffxhud.hud-f1 .ig-banner';
const BANNER_SIN = '.ffxhud.hud-f1:has(.ffx-sinhud:not(.ffx-sinhud--phone):not([hidden]) .ffx-sinfin:not([hidden])) .ig-banner';
const BANNER_STEP = f1text.find((r) => /data-text-size/.test(r.sel) && r.sel.endsWith(' .ig-banner'))!.sel;

/** The HELP bar at its MINIMUM width (128; the text widens it, both ways from the centre line x 320), grid px: top, padding, one 12 px line at 1.2 and the 1.5 px underline. */
function helpbar(): Box {
  const top = parseFloat(lastDecl(ffxHud, HELPBAR, 'top')!);
  const [pt, , pb] = lastDecl(ffxHud, HELPBAR, 'padding')!.split(/\s+/).map(parseFloat) as [number, number, number];
  const line = parseFloat(lastDecl(ffxHud, HELPBAR, 'font-size')!) * parseFloat(lastDecl(ffxHud, HELPBAR, 'line-height')!);
  const underline = parseFloat(/([\d.]+)px/.exec(lastDecl(ffxHud, HELPBAR, 'border-bottom')!)![1]!);
  const w = parseFloat(lastDecl(ffxHud, HELPBAR, 'min-width')!);
  expect(lastDecl(ffxHud, HELPBAR, 'left')).toBe('50%');
  return { l: 320 - w / 2, t: top, w, h: pt + line + pb + underline };
}

/** The action banner at a banner `top`, grid px, as wide as `w` (its text sets that): the slab's padding, the name's 20.44 px at line-height 1 and the 1.78 px underline. */
function banner(top: number, w: number): Box {
  const [pt, , pb, pl] = lastDecl(slabs, BANNER, 'padding')!.split(/\s+/).map(parseFloat) as [number, number, number, number];
  expect(lastDecl(slabs, '.ig-banner__name', 'line-height')).toBe('1');
  const name = parseFloat(lastDecl(slabs, '.ig-banner__name', 'font-size')!);
  const underline = parseFloat(/([\d.]+)px/.exec(lastDecl(slabs, BANNER, 'border-bottom')!)![1]!);
  expect(pl).toBeGreaterThan(0);
  return { l: parseFloat(lastDecl(slabs, BANNER, 'left')!), t: top, w, h: pt + name + pb + underline };
}
/** The banner's `top` the sheets give it at a text size: the F1 sheet's 43, the text-size step's 18 + 25 x scale from 115 on, or (with a Fin plate standing) the Sin sheet's own. */
const bannerTop = (ts: number, withPlate: boolean): number => {
  if (withPlate) return parseFloat(lastDecl(sin, BANNER_SIN, 'top')!);
  if (ts === 1) return parseFloat(lastDecl(f1ffx, BANNER_F1, 'top')!);
  return evalLength(lastDecl(f1text, BANNER_STEP, 'top')!, ctx(ts));
};
/** The widest an order line gets before it meets anything at its own height: to the plate's left end at 100 (the band the plate used to stand in). A bound for the checks below, not a measurement. */
const BANNER_W = 253.4 - 21.33;

describe('the HELP bar stands above the plate: the plate\'s top is under the bar\'s foot by a GAP at both text sizes (review minor 1)', () => {
  it('the bar at its minimum width (x 256 to 384, y 4 to 26.9) shares the plate\'s columns, so only the vertical gap keeps them apart; the known defect first: the old top (22.4) stood 4.5 grid px INSIDE the bar', () => {
    const bar = helpbar();
    expect(bar.t + bar.h).toBeCloseTo(26.9, 6);
    for (const ts of [1, 1.15]) {
      const plate = plateAt(ts, true);
      expect(Math.min(bar.l + bar.w, tip(plate)) - Math.max(bar.l, plate.l), `columns at ${ts}`).toBeGreaterThan(100);
    }
    const old = plateAt(1, false); // release 72's top (22.4) with the plate where it stood: the instrument sees the bar over it
    expect(old.t).toBeCloseTo(22.4, 6);
    expect(bar.t + bar.h - old.t).toBeCloseTo(4.5, 6);
    expect(overlap(old, bar)).toBeGreaterThan(0);
  });

  it.each([1, 1.15])('at %s the plate\'s top is at least GAP (6) under the bar\'s foot and the two do not overlap, whatever the bar\'s width up to the strip', (ts) => {
    const bar = helpbar();
    const plate = plateAt(ts, true);
    expect(plate.t - (bar.t + bar.h)).toBeGreaterThanOrEqual(GAP);
    expect(plate.t - (bar.t + bar.h)).toBeCloseTo(6.0, 1);
    expect(overlap(plate, { ...bar, l: 0, w: 640 })).toBe(0); // the full width of the stage: a vertical test
  });
});

describe('the action banner stands under the plate whenever a Fin plate is on the F1 HUD (review major 1: the order line "<name> orders Cid to pull back" ran into the plate)', () => {
  it('the known defect first: at its old top (43 at 100, 46.75 at 115) the banner\'s rows meet the OLD plate\'s (release 72\'s 22.4 to 59.4 and this lane\'s first cut\'s 22.4 to 59.4 alike), so a line as long as 264.7 grid px collided with a left end at 255.3', () => {
    const first = { l: 255.3, t: 22.4, w: 195.9, h: 37.0 }; // the first cut's charged plate at 100: left end (y = 50) 255.3, rows 22.4 to 59.4
    for (const ts of [1, 1.15]) {
      const old = banner(bannerTop(ts, false), 264.7 - 21.33);
      expect(overlap(old, first), `old top at ${ts}`).toBeGreaterThan(0);
    }
    expect(bannerTop(1, false)).toBe(43);
    expect(bannerTop(1.15, false)).toBeCloseTo(46.75, 6);
  });

  it.each([1, 1.15])('at %s the banner\'s top is at least GAP (6) under the plate\'s foot (the banner\'s width does not matter: they share no row)', (ts) => {
    const plate = plateAt(ts, true);
    const under = banner(bannerTop(ts, true), 640 - 21.33 - 6);
    expect(under.t - (plate.t + plate.h)).toBeGreaterThanOrEqual(GAP - 1e-6);
    expect(overlap(under, plate)).toBe(0);
    expect(under.t).toBe(75.95);
  });

  it('the banner stays GAP (6) clear of every F1 zone at 100 and 115 over the band an order line fills (to the plate\'s left end): the hero is the next one down (top 140 at 100, 114 at 115)', () => {
    for (const ts of [1, 1.15]) {
      const b = banner(bannerTop(ts, true), BANNER_W);
      for (const z of FFX_ZONES) {
        expect(overlap(b, ZONE(z.name, ts)), `${z.name} at ${ts}`).toBe(0);
        expect(sep(b, ZONE(z.name, ts)), `${z.name} at ${ts}`).toBeGreaterThanOrEqual(GAP - 1e-6);
      }
    }
    expect(banner(75.95, 100).h).toBeCloseTo(31.99, 2);
    expect(ZONE('hero', 1.15).t - (75.95 + banner(75.95, 100).h)).toBeGreaterThanOrEqual(GAP - 1e-6);
  });

  it('the rule beats the text-size step by SPECIFICITY, not by order (the step\'s `top` is 18 + 25 x scale and its selector starts at `html`)', () => {
    const spec = (sel: string): [number, number, number] => {
      let a = 0;
      let b = 0;
      let c = 0;
      let rest = '';
      for (let i = 0; i < sel.length; ) {
        const m = /^:(not|has|is|where)\(/.exec(sel.slice(i));
        if (m === null) {
          rest += sel[i++];
          continue;
        }
        let depth = 1;
        let j = i + m[0].length;
        while (depth > 0) {
          const ch = sel[j++];
          if (ch === '(') depth++;
          else if (ch === ')') depth--;
        }
        if (m[1] !== 'where') {
          const [x, y, z] = spec(sel.slice(i + m[0].length, j - 1));
          a += x;
          b += y;
          c += z;
        }
        i = j;
        rest += ' ';
      }
      a += (rest.match(/#[\w-]+/g) ?? []).length;
      b += (rest.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
      c += (rest.replace(/\[[^\]]*\]/g, '').match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length;
      return [a, b, c];
    };
    const gt = (x: readonly number[], y: readonly number[]): boolean => (x[0]! !== y[0]! ? x[0]! > y[0]! : x[1]! !== y[1]! ? x[1]! > y[1]! : x[2]! > y[2]!);
    expect(spec(BANNER_STEP)).toEqual([0, 6, 1]); // html[data-text-size]:not([data-text-size='100']):not([data-phone-battle]) .ffxhud.hud-f1 .ig-banner
    expect(gt(spec(BANNER_SIN), spec(BANNER_STEP))).toBe(true);
    expect(gt(spec(BANNER_SIN), spec(BANNER_F1))).toBe(true);
  });

  it('the rule is the only one in the Sin sheet that places the banner, it sets `top` and nothing else, and the F1 sheets\' own banner rules (43; 18 + 25 x scale) are as they were', () => {
    const placing = sin.filter((r) => /\.ig-banner$/.test(r.sel));
    expect(placing.map((r) => r.sel)).toEqual([BANNER_SIN]);
    expect(declsOf(placing[0]!.body).map(([p]) => p)).toEqual(['top']);
    expect(lastDecl(f1ffx, BANNER_F1, 'top')).toBe('43px');
    expect(lastDecl(f1text, BANNER_STEP, 'top')).toBe('calc(18px + 25px * var(--pyr-ts))');
  });

  it('on small DOM trees the rule matches the F1 root of the landscape Sin widget with a visible plate, and nothing else: not a hidden plate, not a hidden widget, not the phone widget, not the old HUD, not an FFX-2 root', () => {
    const tree = (root_: string, widget: string, widgetHidden: boolean, finHidden: boolean): HTMLElement => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<div class="${root_}"><div class="ffx-sinhud ${widget}"${widgetHidden ? ' hidden' : ''}><div class="ffx-sinhud__frame"><div class="ffx-sinfin"${finHidden ? ' hidden' : ''}></div></div></div><div class="ig-banner"></div></div>`;
      document.body.append(wrap);
      return wrap.querySelector<HTMLElement>('.ig-banner')!;
    };
    try {
      expect(tree('ffxhud hud-f1', '', false, false).matches(BANNER_SIN)).toBe(true);
      expect(tree('ffxhud hud-f1', '', false, true).matches(BANNER_SIN)).toBe(false); // links with no Fin on the field (III, the Core)
      expect(tree('ffxhud hud-f1', '', true, false).matches(BANNER_SIN)).toBe(false);
      expect(tree('ffxhud hud-f1', 'ffx-sinhud--phone', false, false).matches(BANNER_SIN)).toBe(false);
      expect(tree('ffxhud', '', false, false).matches(BANNER_SIN)).toBe(false); // ?hud=today, ?treated=pack
      expect(tree('ffx2hud hud-f1', '', false, false).matches(BANNER_SIN)).toBe(false); // FFX-2's root
      expect(tree('ffxhud hud-f1', '', false, false).matches(BANNER)).toBe(true);
    } finally {
      document.body.innerHTML = '';
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------- scope: nothing else moves

describe('the new rules reach only the F1 HUD in the landscape widget (the old HUD, ?treated=pack, the phone and TEXT SIZE 130 draw the plate where it always stood)', () => {
  /** The rules that place the plate itself (a selector that ENDS in the plate's class: its children and its modifiers are other rules). */
  const placing = sin.filter((r) => /\.ffx-sinfin$/.test(r.sel)).map((r) => r.sel);

  it("exactly four rules place the plate: the sheet's base rule, the phone rule (also the sheet's own, and it stays), the F1 rule and the 115 step", () => {
    expect([...placing].sort()).toEqual([BASE, '.ffx-sinhud--phone .ffx-sinfin', F1, F1_115].sort());
  });

  it('the F1 rule sets `left`, `right` and `top` only (sideways and down, nothing else); the 115 step sets `translate` only; there is no 130 rule', () => {
    const body = (sel: string): string[] => declsOf(sin.find((r) => r.sel === sel)!.body).map(([p]) => p).sort();
    expect(body(F1)).toEqual(['left', 'right', 'top']);
    expect(body(F1_115)).toEqual(['translate']);
    expect(sin.some((r) => /data-text-size='130'/.test(r.sel) && /ffx-sinfin/.test(r.sel))).toBe(false);
  });

  it("the base rule is the sheet's own (left 820, top 56, min-width 470) and the phone rule still stretches the plate between 10 px margins", () => {
    expect(lastDecl(sin, BASE, 'left')).toBe('820px');
    expect(lastDecl(sin, BASE, 'top')).toBe('56px');
    expect(lastDecl(sin, BASE, 'min-width')).toBe('470px');
    expect(lastDecl(sin, '.ffx-sinhud--phone .ffx-sinfin', 'left')).toBe('10px');
    expect(lastDecl(sin, '.ffx-sinhud--phone .ffx-sinfin', 'right')).toBe('10px');
  });

  it('on small DOM trees the F1 selectors match the landscape plate under .hud-f1 only: not the old HUD, not the phone widget, not a plate outside the Sin HUD', () => {
    const tree = (hud: string, widget: string): HTMLElement => {
      const wrap = document.createElement('div');
      wrap.innerHTML = `<div class="ffxhud ${hud}"><div class="ffx-sinhud ${widget}"><div class="ffx-sinhud__frame"><div class="ffx-sinfin"></div></div></div></div>`;
      document.body.append(wrap);
      return wrap.querySelector<HTMLElement>('.ffx-sinfin')!;
    };
    try {
      expect(tree('hud-f1', '').matches(F1)).toBe(true);
      expect(tree('', '').matches(F1)).toBe(false);
      expect(tree('hud-f1', 'ffx-sinhud--phone').matches(F1)).toBe(false);
      expect(tree('hud-f1', '').matches(BASE)).toBe(true);
    } finally {
      document.body.innerHTML = '';
    }
    root.dataset['textSize'] = '115';
    const el = tree('hud-f1', '');
    expect(el.matches(F1_115)).toBe(true);
    root.dataset['phoneBattle'] = '';
    expect(el.matches(F1_115)).toBe(false); // the phone's battle layout never takes the step
    root.removeAttribute('data-phone-battle');
    root.dataset['textSize'] = '100';
    expect(el.matches(F1_115)).toBe(false);
    document.body.innerHTML = '';
  });

  it('the advisor card still dodges the plate by its rectangle: `.ffx-sinfin` is one of the Sin HUD selectors the advisor reads', () => {
    expect(SIN_HUD_SELECTORS).toContain('.ffx-sinfin');
  });
});

// ---------------------------------------------------------------------------------------------------------------- the ceiling: above 115 the chapter keeps today's HUD

describe("above TEXT SIZE 115 the chapter draws release 72's HUD (the band is narrower than the plate): F1_TEXT_CEILING, as Chapters IX and XII", () => {
  beforeEach(() => {
    setTreatedScope('all');
    setHudF1Mode('f1');
    setDemoChapter(ID);
  });
  afterEach(() => {
    setHudF1Mode(null);
    setHudF1TextMode(null);
    setDemoChapter(undefined);
    setTreatedScope(null);
    root.removeAttribute('data-text-size');
    root.removeAttribute('data-text-size-wide');
    history.replaceState(null, '', '/');
  });

  const sizeBoth = (v: string): void => {
    root.dataset['textSize'] = v;
    root.dataset['textSizeWide'] = v;
  };

  it('the table names the chapter at 115, beside Chapters IX and XII', () => {
    expect(F1_TEXT_CEILING[ID]).toBe(115);
    expect(Object.keys(F1_TEXT_CEILING).sort()).toEqual(['seymour-omnis', 'sin-fins-core', 'yojimbo-cavern']);
  });

  it('the F1 HUD plays at 100 and 115 and not at 130 in Chapter XVII (the text mode grow, the default for a page)', () => {
    setHudF1TextMode('grow');
    for (const [v, on] of [['100', true], ['115', true], ['130', false]] as const) {
      sizeBoth(v);
      expect(hudF1TextSizeOk(), v).toBe(on);
      expect(hudF1On(), v).toBe(on);
    }
  });

  it('`?f1text=grow` forces it at 130 (the measuring word), and another chapter on the F1 HUD is not touched by the new row', () => {
    sizeBoth('130');
    history.replaceState(null, '', '/?f1text=grow');
    setHudF1TextMode('grow');
    expect(hudF1TextSizeOk()).toBe(true);
    history.replaceState(null, '', '/');
    setDemoChapter('braskas-final-aeon');
    expect(hudF1TextSizeOk()).toBe(true); // Chapter III has no ceiling and draws at 130
  });
});
