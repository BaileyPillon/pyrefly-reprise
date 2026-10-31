/**
 * THE F1 HUD AGAINST THE TWO CHAPTER PANELS THAT MET IT (lane booth-ffx-b4-hud, 2026-10-31; FFX ONLY: Chapter IX `yojimbo-cavern`, Chapter XII `seymour-omnis`; rule 14: FFX-2 has no panel of this kind, and Chapter IV's F1 HUD is not touched).
 *
 * The r70 verdict pass (`docs/handoff/booth-b3.md` section 12.4) took both chapters off the treated list for one major each: the Zanmato gauge ended against the F1 turn strip (IX), and the Enemy Intent card clipped the acting hero's HP numeral against the F1
 * party panel (XII). jsdom has no layout, so this file computes the layout: it reads the REAL stylesheets (`zanmato-gauge.css`, `omnis-readout.css`, `text-size.css`, the F1 sheets and the new `hudf1-chapters.css`), picks the winning declaration of each property by
 * specificity at each TEXT SIZE, builds every box on the 640 x 360 grid, shears the slabs the way the HUD does (`skewX(-12deg)` about each box's own centre, `SKEW` of `hudSafeZones`) and reports the smallest horizontal clearance over the rows two boxes share.
 *
 * The numbers are the unit-level proof; the browser read (the first menu at 1600 x 900, 2560 x 1440, 3440 x 1440 and 1280 x 720, every HUD rect against every other) is the job `HUD-1` of `docs/handoff/booth-ffx-b4-hud.md`, with its predictions.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cmpSpec, evalLength, evalPair, lastDecl, leafRules, readSource, specificity, type CssRule } from './helpers/cssEval.ts';
import { FFX_PFX, FFX_ZONES, SIZES, ctx, f1, f1ffx, f1ffx2, f1text, num, painted, tsFfx, type Box } from './helpers/f1Zones.ts';
import { GAP, SKEW } from '../../src/ui/ffx/hudSafeZones.ts';

const zg = leafRules(readSource('src/ui/ffx/zanmato-gauge.css'));
const omr = leafRules(readSource('src/ui/ffx/omnis-readout.css'));
const chap = leafRules(readSource('src/ui/hudf1/hudf1-chapters.css'));

/** The 1440 x 810 frame of the gauge and the 1600 x 900 frame of the Omnis read-out, as grid scale factors (`ZanmatoGauge`, `OmnisReadout`). */
const ZG_K = 640 / 1440;
const OMR_K = 640 / 1600;

const ZONE = (name: string): Box => painted(FFX_ZONES.find((z) => z.name === name)!, 1);

// ---------------------------------------------------------------------------------------------------------------- the cascade, and the shear

interface Cand {
  rules: readonly CssRule[];
  sel: string;
  /** Does this rule apply at this TEXT SIZE? (the `text-size.css` rules need an attribute at 115 / 130 and never match at 100) */
  at: (ts: number) => boolean;
}

/** The winning value of `prop` among the candidates that apply at `ts`: the greatest specificity, the later one on a tie (the order below is the load order of the sheets); undefined when no rule declares it. */
function declared(cands: readonly Cand[], prop: string, ts: number): string | undefined {
  let best: { v: string; s: [number, number, number] } | undefined;
  for (const c of cands) {
    if (!c.at(ts)) continue;
    const v = lastDecl(c.rules, c.sel, prop);
    if (v === undefined) continue;
    const s = specificity(c.sel);
    if (best === undefined || cmpSpec(s, best.s) >= 0) best = { v, s };
  }
  return best?.v;
}
function winner(cands: readonly Cand[], prop: string, ts: number): string {
  const v = declared(cands, prop, ts);
  if (v === undefined) throw new Error(`no ${prop}`);
  return v;
}
/**
 * Where a panel's skew pivots, as a fraction of its height from its top (REVIEW m1, 2026-10-31). `transform: skewX()` turns about `transform-origin`, which the `scale` rules of `text-size.css` set to `center top` for the gauge and the disc strip at 115 and 130:
 * the skew then pivots on the TOP edge and every row sits `SKEW x h / 2` further left than the browser's default, the centre, which is where it pivots at 100 (no rule sets one). A first version of this file sheared every box about its centre and so could not see it.
 */
function pivot(cands: readonly Cand[], ts: number): number {
  const v = declared(cands, 'transform-origin', ts);
  if (v === undefined) return 0.5;
  const words = v.split(/\s+/);
  if (words.includes('top')) return 0;
  if (words.includes('bottom')) return 1;
  if (words.every((w) => w === 'center')) return 0.5;
  throw new Error(`transform-origin ${v} is not modelled`);
}
const always = (): boolean => true;
const grown = (ts: number): boolean => ts !== 1;
const only = (n: number) => (ts: number): boolean => Math.abs(ts - n) < 1e-9;

const px = (v: string, ts: number): number => (v === 'none' ? 1 : evalLength(v, ctx(ts)));

/** A box and the point its skew pivots on (a fraction of its height from the top: 0.5, the centre, unless a `transform-origin` says otherwise). */
type PBox = Box & { pv?: number };

/** The horizontal extent of a box at row `y`; a slab is sheared about its pivot (`skewX(-12deg)`: rows below the pivot move left). */
function xs(b: PBox, y: number, slab: boolean): [number, number] {
  const d = slab ? SKEW * (b.t + b.h * (b.pv ?? 0.5) - y) : 0;
  return [b.l + d, b.l + b.w + d];
}
/** The smallest horizontal clearance of `a` (to the left) from `b` over the rows they share; negative is an overlap, `Infinity` means they share no row. Both ends of the shared rows are enough: the clearance is linear in `y`. */
function clearance(a: PBox, aSlab: boolean, b: PBox, bSlab: boolean): number {
  const y0 = Math.max(a.t, b.t);
  const y1 = Math.min(a.t + a.h, b.t + b.h);
  if (y1 <= y0) return Infinity;
  return Math.min(...[y0, y1].map((y) => xs(b, y, bSlab)[0] - xs(a, y, aSlab)[1]));
}

// ---------------------------------------------------------------------------------------------------------------- the F1 zones the panels sit between

const ribbonAt = (ts: number): Box => painted(FFX_ZONES.find((z) => z.name === 'boss ribbon')!, ts);
/** The turn strip's box including its TURN ORDER caption (14 grid px above the row, grown with the strip about its top right). */
function stripAt(ts: number): Box {
  const b = painted(FFX_ZONES.find((z) => z.name === 'turn strip')!, ts);
  const cap = 14 * ts;
  return { l: b.l, t: b.t - cap, w: b.w, h: b.h + cap };
}
const partyAt = (ts: number): Box => painted(FFX_ZONES.find((z) => z.name === 'party cards')!, ts);

// ---------------------------------------------------------------------------------------------------------------- Chapter IX: the Zanmato gauge

const ZG_PANEL = '.ffx-zg__panel';
const ZG_F1 = '.ffxhud.hud-f1 .ffx-zg:not(.ffx-zg--phone) .ffx-zg__panel';
const ZG_TS = `${FFX_PFX} .ffxhud .ffx-zg__panel`;
const ZG_F1_TS = `${FFX_PFX} .ffxhud.hud-f1 .ffx-zg:not(.ffx-zg--phone) .ffx-zg__panel`;
const ZG_CANDS: readonly Cand[] = [
  { rules: zg, sel: ZG_PANEL, at: always },
  { rules: chap, sel: ZG_F1, at: always },
  { rules: tsFfx, sel: ZG_TS, at: grown },
  { rules: chap, sel: ZG_F1_TS, at: grown },
];
/** The panel's height: 131.6 frame px measured (58.5 grid at 2560 x 1440, `l1-yojimbo-cavern-now-2560x1440`); 140 is the generous bound the layout is checked with. */
const ZG_H = 140;

/** Which rules apply: with the F1 sheet (`f1on`) or without it (today's cascade, release 68's). */
const gaugeCands = (f1on: boolean): readonly Cand[] => (f1on ? ZG_CANDS : ZG_CANDS.filter((c) => c.rules !== chap));
/** `scale` is declared by `text-size.css` (and answered by the F1 sheet) only at 115 and 130: at 100 there is none. */
function gaugeScale(ts: number, f1on: boolean): number {
  const cands = gaugeCands(f1on).filter((c) => lastDecl(c.rules, c.sel, 'scale') !== undefined);
  return cands.some((c) => c.at(ts)) ? px(winner(cands, 'scale', ts), ts) : 1;
}
/** The gauge panel on the grid at a TEXT SIZE (grown about its top centre, `transform-origin: center top` of `text-size.css`), with the point its skew pivots on. */
function gauge(ts: number, f1on: boolean): PBox {
  const cands = gaugeCands(f1on);
  const k = gaugeScale(ts, f1on);
  const l = px(winner(cands, 'left', ts), ts) * ZG_K;
  const w = px(winner(cands, 'width', ts), ts) * ZG_K;
  const t = px(winner(cands, 'top', ts), ts) * ZG_K;
  return { l: l + w / 2 - (w * k) / 2, t, w: w * k, h: ZG_H * ZG_K * k, pv: pivot(cands, ts) };
}

describe('Chapter IX (FFX only): the Zanmato gauge against the F1 ribbon and turn strip', () => {
  it('REPRODUCES the r70 defect: today\'s gauge (left 660 of the 1440 frame, 430 wide) ends 19.4 grid px inside the strip\'s box at 100, over the TURN ORDER caption rows', () => {
    const old = gauge(1, false);
    expect(old.l).toBeCloseTo(293.33, 1);
    expect(old.l + old.w).toBeCloseTo(484.44, 1);
    const strip = stripAt(1);
    expect(strip.l).toBe(465);
    expect(clearance(old, true, strip, false)).toBeLessThan(-19); // the "0%" at the panel's right edge sat over the caption (the evidence's 1155 to 1196 px at 1600 wide)
    expect(old.t).toBeLessThan(strip.t + strip.h); // and they share rows
  });

  it('at TEXT SIZE 100 the gauge stands in the top band 41 grid px (164 px at 2560 x 1440) clear of the ribbon and of the strip, the same both sides', () => {
    const g = gauge(1, true);
    expect(g.l).toBeCloseTo(227.11, 1);
    expect(g.w).toBeCloseTo(191.11, 1);
    expect(g.l + g.w).toBeCloseTo(418.22, 1); // the box ends 46.8 before the strip's left edge (465)
    const toRibbon = clearance(ribbonAt(1), true, g, true);
    const toStrip = clearance(g, true, stripAt(1), false);
    expect(toRibbon).toBeGreaterThan(36); // 144 px at 2560 x 1440
    expect(toStrip).toBeGreaterThan(36);
    expect(Math.abs(toRibbon - toStrip), 'balanced').toBeLessThan(1);
    expect(toRibbon).toBeCloseTo(41.35, 1);
    expect(toStrip).toBeCloseTo(40.9, 1);
    // the banner under it stays centred on the stage (`left: 50%`): the panel's centre is within 3 grid px of x = 320
    expect(g.l + g.w / 2).toBeGreaterThan(317);
    expect(g.l + g.w / 2).toBeLessThan(327);
  });

  it('keeps its size at 115 and 130 (the old growth about its top centre would reach into the strip); at 115 it clears both by 16 grid px', () => {
    expect(gaugeScale(1.15, true)).toBe(1);
    expect(gaugeScale(1.3, true)).toBe(1);
    expect(gaugeScale(1.15, false)).toBe(1.15); // today's HUD still grows it
    expect(gaugeScale(1.3, false)).toBe(1.3);
    const g = gauge(1.15, true);
    expect(clearance(ribbonAt(1.15), true, g, true)).toBeGreaterThan(16);
    expect(clearance(g, true, stripAt(1.15), false)).toBeGreaterThan(16);
  });

  it('at 130 the band between the grown ribbon and the grown strip (181 grid px) is narrower than the panel (191): the one residual, pinned so a later edit sees it', () => {
    const g = gauge(1.3, true);
    const toRibbon = clearance(ribbonAt(1.3), true, g, true);
    const toStrip = clearance(g, true, stripAt(1.3), false);
    expect(toRibbon).toBeCloseTo(-7.44, 1);
    expect(toStrip).toBeCloseTo(-7.99, 1); // against the strip's BOX (its caption rows included); its first caption starts 11.7 grid px inside the box
    const stripInk = stripAt(1.3).l + 9 * 1.3; // the TURN ORDER caption's left (`left: 9px`, grown with the strip)
    const row = (y: number): number => xs(g, y, true)[1];
    expect(stripInk - Math.max(row(8), row(g.t + g.h)), 'the caption itself is clear').toBeGreaterThan(0);
    // the same panel with the old growth at 130 would have been far worse: 1.3 x 191 = 248 grid px in a 181 band
    const oldGrown = gauge(1.3, false);
    expect(clearance(ribbonAt(1.3), true, oldGrown, true) + clearance(oldGrown, true, stripAt(1.3), false)).toBeLessThan(toRibbon + toStrip - 40);
  });

  it('REVIEW m1: the skew pivots on the panel\'s centre at 115 and 130 as it does at 100, because the F1 rule answers the `transform-origin: center top` that `text-size.css` sets for the growth it switches off', () => {
    for (const ts of SIZES) expect(gauge(ts, true).pv, `${ts}`).toBe(0.5);
    expect(lastDecl(tsFfx, ZG_TS, 'transform-origin')).toBe('center top'); // the rule being answered is still where this file reads it
    expect(lastDecl(chap, ZG_F1_TS, 'transform-origin')).toBe('center');
    expect(gauge(1.15, false).pv, 'today\'s HUD keeps the top pivot of its growth').toBe(0);
    expect(gauge(1.3, false).pv).toBe(0);
    // what the pivot on the top edge would have cost: the rows sit SKEW x h / 2 (6.6 grid px, 26 px at 2560 x 1440) further left, so the clearances the file pins below are the centre pivot's, and these are the top pivot's
    const topPivot = (ts: number): PBox => ({ ...gauge(ts, true), pv: 0 });
    expect(clearance(ribbonAt(1.15), true, topPivot(1.15), true)).toBeCloseTo(10.34, 1);
    expect(clearance(ribbonAt(1.3), true, topPivot(1.3), true)).toBeCloseTo(-14.06, 1);
    expect(clearance(ribbonAt(1.15), true, gauge(1.15, true), true) - clearance(ribbonAt(1.15), true, topPivot(1.15), true), 'the pivot is worth 6.6 grid px at 115').toBeGreaterThan(6.5);
    expect(clearance(ribbonAt(1.3), true, gauge(1.3, true), true), 'the 130 residual is the one the handoff discloses, not the pivot\'s').toBeGreaterThan(-7.5);
  });

  it('the rule that does it beats the one it overrides: specificity of the F1 selectors against the ones of `zanmato-gauge.css` and `text-size.css`, and the phone panel is excluded', () => {
    expect(cmpSpec(specificity(ZG_F1), specificity(ZG_PANEL))).toBeGreaterThan(0);
    expect(cmpSpec(specificity(ZG_F1_TS), specificity(ZG_TS))).toBeGreaterThan(0);
    expect(cmpSpec(specificity(ZG_F1), specificity('.ffx-zg--phone .ffx-zg__panel'))).toBeGreaterThan(0); // why the phone panel needs the :not() instead of relying on order
    expect(ZG_F1).toContain(':not(.ffx-zg--phone)');
    expect(lastDecl(tsFfx, ZG_TS, 'scale')).toBe('var(--pyr-ts)'); // the rule being overridden is still where this file thinks it is
  });
});

// ---------------------------------------------------------------------------------------------------------------- Chapter XII: the Enemy Intent card and the disc strip

const INTENT = '.ffx-omr__intent';
const INTENT_F1 = '.ffxhud.hud-f1 .ffx-omr:not(.ffx-omr--phone) .ffx-omr__intent';
const tsSel = (n: number, tail: string): string => `html[data-text-size='${n}']:not([data-phone-battle]) ${tail}`;
const INTENT_CANDS: readonly Cand[] = [
  { rules: omr, sel: INTENT, at: always },
  { rules: chap, sel: INTENT_F1, at: always },
  { rules: tsFfx, sel: tsSel(115, '.ffxhud .ffx-omr__intent'), at: only(1.15) },
  { rules: tsFfx, sel: tsSel(130, '.ffxhud .ffx-omr__intent'), at: only(1.3) },
  { rules: chap, sel: tsSel(115, INTENT_F1), at: only(1.15) },
  { rules: chap, sel: tsSel(130, INTENT_F1), at: only(1.3) },
];
const INTENT_TS_SCALE = `${FFX_PFX} .ffxhud .ffx-omr__intent`;
/** A two-line card is 98 frame px tall (39.25 grid px measured at 2560 x 1440: the evidence's 157 px), a three-line one 122 (the line is 19 x 1.3 = 24.7). */
const INTENT_H2 = 98;
const INTENT_H3 = 122.7;

/** The card's foot (its bottom edge, the anchor it grows up from) and its top, in grid px, at a TEXT SIZE, with the F1 rules or without. */
function intentAt(ts: number, f1on: boolean, lines: 2 | 3): { foot: number; top: number; left: number; right: number } {
  const cands = f1on ? INTENT_CANDS : INTENT_CANDS.filter((c) => c.rules !== chap);
  const bottom = px(winner(cands, 'bottom', ts), ts) * OMR_K;
  const k = ts === 1 ? 1 : px(lastDecl(tsFfx, INTENT_TS_SCALE, 'scale')!, ts); // `text-size.css`: grown about its bottom right
  const right = 640 - px(winner(cands, 'right', ts), ts) * OMR_K;
  const w = px(winner(cands, 'width', ts), ts) * OMR_K * k;
  const h = (lines === 2 ? INTENT_H2 : INTENT_H3) * OMR_K * k;
  const foot = 360 - bottom;
  return { foot, top: foot - h, left: right - w, right };
}

describe('Chapter XII (FFX only): the Enemy Intent card against the F1 party panel', () => {
  it('REPRODUCES the r70 defect: today\'s card (bottom 258 of the 1600 frame) ends 5.8 grid px inside the first party card at 100, 4.2 at 115 and 2.7 at 130 (the F1 party list is 91 grid px tall and grows from its bottom right)', () => {
    expect(partyAt(1).t).toBeCloseTo(251, 6);
    expect(partyAt(1.15).t).toBeCloseTo(237.35, 3);
    expect(partyAt(1.3).t).toBeCloseTo(223.7, 3);
    const over = SIZES.map((ts) => intentAt(ts, false, 2).foot - partyAt(ts).t);
    expect(over[0]).toBeCloseTo(5.8, 1); // the evidence: 23 px at 2560 x 1440
    expect(over[1]).toBeCloseTo(4.25, 1);
    expect(over[2]).toBeCloseTo(2.7, 1);
    for (const o of over) expect(o).toBeGreaterThan(0);
  });

  it('with the F1 rules the card\'s foot stands GAP (6) grid px above the first party card at every TEXT SIZE, 6.2 at 100, 115 and 130', () => {
    for (const ts of SIZES) {
      const gap = partyAt(ts).t - intentAt(ts, true, 2).foot;
      expect(gap, `at ${ts}`).toBeGreaterThanOrEqual(GAP);
      expect(gap, `at ${ts}`).toBeLessThan(GAP + 0.7); // a hand number is a row, not a cushion: it does not leave a hole
    }
    expect(intentAt(1, true, 2).foot).toBeCloseTo(244.8, 3);
    expect(intentAt(1.15, true, 2).foot).toBeCloseTo(231.2, 3);
    expect(intentAt(1.3, true, 2).foot).toBeCloseTo(217.6, 3);
  });

  it('keeps its right edge (22.4 grid px from the stage\'s edge) and its width; a third line grows it upward and still clears the turn strip\'s foot by 113 grid px at 100 and 54 at 130', () => {
    for (const ts of SIZES) {
      expect(intentAt(ts, true, 2).right, `${ts}`).toBeCloseTo(617.6, 3);
      const k = ts;
      expect(intentAt(ts, true, 2).right - intentAt(ts, true, 2).left, `${ts}`).toBeCloseTo(184 * k, 3);
      const stripFoot = stripAt(ts).t + stripAt(ts).h;
      expect(intentAt(ts, true, 3).top - stripFoot, `${ts}`).toBeGreaterThan(50);
    }
  });

  it('the rules that do it beat the ones they override (`omnis-readout.css`, and the two `bottom` rules of `text-size.css`), and exclude the phone card', () => {
    expect(cmpSpec(specificity(INTENT_F1), specificity(INTENT))).toBeGreaterThan(0);
    for (const n of [115, 130]) expect(cmpSpec(specificity(tsSel(n, INTENT_F1)), specificity(tsSel(n, '.ffxhud .ffx-omr__intent')))).toBeGreaterThan(0);
    expect(cmpSpec(specificity(INTENT_F1), specificity('.ffx-omr--phone .ffx-omr__intent'))).toBeGreaterThan(0);
    expect(INTENT_F1).toContain(':not(.ffx-omr--phone)');
    expect(lastDecl(tsFfx, tsSel(115, '.ffxhud .ffx-omr__intent'), 'bottom')).toBe('296px'); // today's lifts, still where this file reads them
    expect(lastDecl(tsFfx, tsSel(130, '.ffxhud .ffx-omr__intent'), 'bottom')).toBe('334px');
    expect(lastDecl(omr, INTENT, 'bottom')).toBe('258px');
  });
});

describe('Chapter XII (FFX only): the disc strip keeps its distance from the F1 turn strip as the strip grows left', () => {
  /** The strip's box in grid px: left 690 of the 1600 frame (276), about 185 wide (the evidence: gold rule from 272.6 to 457 at 2560 x 1440 with the shear), top 14 (5.6) and about 36 tall with its note. */
  const OMR_STRIP = { l: 690 * OMR_K, t: 14 * OMR_K, w: 185, h: 36 };
  const STRIP_SEL = `${FFX_PFX} .ffxhud.hud-f1 .ffx-omr:not(.ffx-omr--phone) .ffx-omr__strip`;
  const STRIP_TS = `${FFX_PFX} .ffxhud .ffx-omr__strip`;
  const STRIP_CANDS: readonly Cand[] = [
    { rules: omr, sel: '.ffx-omr__strip', at: always },
    { rules: tsFfx, sel: STRIP_TS, at: grown },
    { rules: chap, sel: STRIP_SEL, at: grown },
  ];
  const stripCands = (f1on: boolean): readonly Cand[] => (f1on ? STRIP_CANDS : STRIP_CANDS.filter((c) => c.rules !== chap));
  const stripBox = (ts: number, f1on: boolean): PBox => {
    const pv = pivot(stripCands(f1on), ts);
    if (ts === 1 || !f1on) {
      // today's: grown about its top centre (`text-size.css`)
      const k = ts === 1 ? 1 : px(lastDecl(tsFfx, STRIP_TS, 'scale')!, ts);
      return { l: OMR_STRIP.l + OMR_STRIP.w / 2 - (OMR_STRIP.w * k) / 2, t: OMR_STRIP.t, w: OMR_STRIP.w * k, h: OMR_STRIP.h * k, pv };
    }
    const shift = evalPair(lastDecl(chap, STRIP_SEL, 'translate')!, ctx(ts))[0] * OMR_K; // frame px to grid px
    expect(lastDecl(chap, STRIP_SEL, 'scale')).toBe('none');
    return { l: OMR_STRIP.l + shift, t: OMR_STRIP.t, w: OMR_STRIP.w, h: OMR_STRIP.h, pv };
  };

  it('at 100 nothing changes (the browser read had no overlap at 1600 or 2560): the strip ends 4 grid px before the turn strip\'s box', () => {
    const b = stripBox(1, true);
    expect(b.l).toBeCloseTo(276, 6);
    expect(clearance(b, true, stripAt(1), false)).toBeGreaterThan(0); // the box is 4 grid px short of the strip's box; the shear moves the lower rows left
  });

  it('REPRODUCES: today\'s growth about the top centre puts the strip across the F1 turn strip at 115 and 130', () => {
    expect(clearance(stripBox(1.15, false), true, stripAt(1.15), false)).toBeLessThan(-20);
    expect(clearance(stripBox(1.3, false), true, stripAt(1.3), false)).toBeLessThan(-40);
  });

  it('with the F1 rule it keeps its size and moves left by 160.5 grid px x (scale - 1): the gap to the strip is the one it has at 100, and at 115 it clears the grown ribbon by 39 grid px', () => {
    expect(clearance(stripBox(1, true), true, stripAt(1), false)).toBeCloseTo(0.68, 1); // the box's top right tip, 0.7 grid px short of the strip's box (its caption starts 9 further in)
    for (const ts of [1.15, 1.3]) {
      expect(stripBox(ts, true).l - 276, `${ts}`).toBeCloseTo(-160.5 * (ts - 1), 1);
      const b = stripBox(ts, true);
      expect(stripAt(ts).l - (b.l + b.w), `${ts}: the plain gap is the one at 100`).toBeCloseTo(4, 2);
      expect(clearance(b, true, stripAt(ts), false), `${ts}: the sheared tip still stops short of the strip's box`).toBeGreaterThan(0);
    }
    expect(clearance(ribbonAt(1.15), true, stripBox(1.15, true), true)).toBeCloseTo(39.23, 1);
  });

  it('at 130 the band (181 grid px) is narrower than the strip (185): its left end reaches the grown ribbon, pinned as the residual', () => {
    const c = clearance(ribbonAt(1.3), true, stripBox(1.3, true), true);
    expect(c).toBeCloseTo(-9.24, 1);
  });

  it('REVIEW m1: the strip\'s skew pivots on its centre at 115 and 130 as at 100 (the F1 rule answers the `center top` of `text-size.css`); the top pivot would put 130 at -13.1 and 115 at 35.4', () => {
    for (const ts of SIZES) expect(stripBox(ts, true).pv, `${ts}`).toBe(0.5);
    expect(lastDecl(tsFfx, STRIP_TS, 'transform-origin')).toBe('center top');
    expect(lastDecl(chap, STRIP_SEL, 'transform-origin')).toBe('center');
    expect(stripBox(1.15, false).pv, 'today\'s HUD keeps the top pivot of its growth').toBe(0);
    const topPivot = (ts: number): PBox => ({ ...stripBox(ts, true), pv: 0 });
    expect(clearance(ribbonAt(1.15), true, topPivot(1.15), true)).toBeCloseTo(35.4, 1);
    expect(clearance(ribbonAt(1.3), true, topPivot(1.3), true)).toBeCloseTo(-13.07, 1);
    expect(clearance(ribbonAt(1.3), true, stripBox(1.3, true), true) - clearance(ribbonAt(1.3), true, topPivot(1.3), true), 'the pivot is worth 3.8 grid px at 130').toBeGreaterThan(3.7);
    expect(clearance(stripBox(1.3, true), true, stripAt(1.3), false), 'and the strip\'s box tip stays short of the turn strip at 130').toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------------------------------------------- what the new sheet may and may not touch

describe('hudf1-chapters.css touches nothing but the two panels, only under the F1 HUD, and the F1 layout sheets are the ones they were', () => {
  const body = readSource('src/ui/hudf1/hudf1-chapters.css');
  it('every rule hangs from .ffxhud.hud-f1 and from one of the two panels, and names no other F1 zone', () => {
    expect(chap.length).toBeGreaterThanOrEqual(6);
    for (const r of chap) {
      expect(r.sel, r.sel).toContain('.ffxhud.hud-f1');
      expect(/\.ffx-zg:not\(\.ffx-zg--phone\) \.ffx-zg__panel$|\.ffx-omr:not\(\.ffx-omr--phone\) \.ffx-omr__(intent|strip)$/.test(r.sel), r.sel).toBe(true);
    }
    for (const bad of ['.ig-ctb', '.ig-stat', '.f1-', '.ffx-cmd', '.ffx2hud', '.ig-cmd']) expect(body, bad).not.toContain(bad);
  });

  it('declares only the properties it means to: left (the gauge), scale, translate and transform-origin (the text-size answers), bottom (the card)', () => {
    const props = new Set<string>();
    for (const r of chap) for (const m of r.body.matchAll(/([a-z-]+)\s*:/g)) props.add(m[1]!);
    expect([...props].sort()).toEqual(['bottom', 'left', 'scale', 'transform-origin', 'translate']);
    // every rule that switches the growth off also puts the skew's pivot back where it is at 100 (review m1): no `scale: none` without a `transform-origin: center` beside it
    const off = chap.filter((r) => /\bscale\s*:\s*none\b/.test(r.body));
    expect(off.length).toBe(2);
    for (const r of off) expect(r.body, r.sel).toMatch(/transform-origin\s*:\s*center\s*;/);
  });

  it('the older F1 sheets say nothing of either panel, and the old layouts keep their numbers (the panels are today\'s unless the F1 HUD is on)', () => {
    for (const rules of [f1, f1ffx, f1ffx2, f1text]) for (const r of rules) expect(r.body + r.sel, r.sel).not.toMatch(/ffx-zg|ffx-omr/);
    expect(num(zg, ZG_PANEL, 'left')).toBe(660);
    expect(num(zg, ZG_PANEL, 'width')).toBe(430);
    expect(num(zg, ZG_PANEL, 'top')).toBe(10);
    expect(num(omr, INTENT, 'bottom')).toBe(258);
    expect(num(omr, INTENT, 'right')).toBe(56);
    expect(num(omr, '.ffx-omr__strip', 'left')).toBe(690);
  });

  it('HudF1.ts imports the sheet after the other F1 sheets, and the HUD stays under 400 lines', () => {
    const src = readFileSync(resolve('src/ui/hudf1/HudF1.ts'), 'utf8');
    expect(src).toMatch(/import '\.\/hudf1-textsize\.css';\s*\r?\nimport '\.\/hudf1-chapters\.css';/);
    expect(src.split('\n').length).toBeLessThan(400);
  });

  it('the ribbon, the strip and the party list are the F1 sheets\' own numbers this file reads (a move of any of them moves the proof)', () => {
    expect(ZONE('boss ribbon')).toEqual({ l: 28, t: 12.5, w: 160, h: 25 });
    expect(ZONE('turn strip').l).toBe(465);
    expect(ZONE('party cards').t).toBe(251);
    expect(num(f1ffx, '.ffxhud.hud-f1 .ig-ctb', 'left')).toBe(465);
  });
});
