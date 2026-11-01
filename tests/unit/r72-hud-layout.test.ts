// @vitest-environment jsdom
/**
 * THE F1 HUD AGAINST CHAPTER IX AND CHAPTER XII, SECOND PASS (lane r72-hud, 2026-11-01; FFX ONLY: Chapter IX `yojimbo-cavern`, Chapter XII `seymour-omnis`; rule 14: FFX-2 has no panel of this kind; Chapter I, Chapter IV and every other treated chapter are not touched).
 *
 * The r71 browser read (`docs/handoff/booth-b4.md` section 12) took both chapters off the list again: IX for the advisor's one-row tip over the Zanmato gauge (HUD-3), XII for the disc strip over the F1 turn strip (HUD-1) and the Sensor card
 * over the pro target flag (HUD-3). `docs/handoff/r72-hud.md` has the causes and the fixes; this file is their unit-level proof, with no browser (the browser read is that note's jobs HUD-1 to HUD-7):
 *
 *  - the stylesheet half READS THE REAL SHEETS (`hudf1-chapters.css` and the ones it answers) with the evaluator the other layout tests use, and sets their numbers against the r71 sheets' measured boxes (grid px; `D:/Tools/pyrefly-scratch/2026-10-31/r71/ffx/evidence/`);
 *  - the solver half (the real `tipZone` and advisor chain on boards rebuilt from the same sheets, with and without the ribbon as an obstacle) is `r72-hud-solver.test.ts`, with the boards in `helpers/r72HudBoards.ts`;
 *  - the DOM half runs `f1RibbonEls` and the new selectors on small trees (Chapter I, IX, XII, F1 off, the phone gauge, a hidden gauge).
 *
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cmpSpec, evalPair, evalLength, lastDecl, leafRules, readSource, specificity } from './helpers/cssEval.ts';
import { FFX_PFX, FFX_ZONES, ctx, f1, f1text, ffxTipRow, painted, type Box } from './helpers/f1Zones.ts';
import { TIP_BADGE, TIP_HEIGHT } from '../../src/ui/ffx/advisorTip.ts';
import { SKEW } from '../../src/ui/ffx/hudSafeZones.ts';
import { f1RibbonEls, topChipEls } from '../../src/ui/ffx/hudAvoidSelectors.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const chap = leafRules(readSource('src/ui/hudf1/hudf1-chapters.css'));

afterEach(() => {
  document.body.replaceChildren();
});

// ---------------------------------------------------------------------------------------------------------------- the r71 sheets' measured boxes (grid px), the stylesheet half

const OMR_K = 640 / 1600;
/**
 * The disc strip's bounding box (the shear included) before this lane, read from the r71 sheets at each window (`hud-seymour-omnis-now-t100.json`, `rects.omrstrip`): width and height in grid px. 1366, 1440 and 1536 are the widths the r71 overlaps give
 * (43.8, 30.8 and 16.2 px against the turn strip at 465 x lb: 212.8, 206.0 and 199.1).
 */
const STRIP_AT: ReadonlyArray<{ win: string; lb: number; w: number; h: number }> = [
  { win: '1280x720', lb: 2, w: 221.65, h: 31.2 },
  { win: '1366x768', lb: 2.1333, w: 212.8, h: 30.9 },
  { win: '1440x810', lb: 2.25, w: 206.0, h: 30.3 },
  { win: '1536x864', lb: 2.4, w: 199.1, h: 29.9 },
  { win: '1600x900', lb: 2.5, w: 195.88, h: 29.6 },
  { win: '2560x1440', lb: 4, w: 190.2, h: 29.6 },
  { win: '3440x1440', lb: 4, w: 190.2, h: 29.6 },
];
const STRIP_SEL = '.ffxhud.hud-f1 .ffx-omr:not(.ffx-omr--phone) .ffx-omr__strip';
const STRIP_TS_SEL = `${FFX_PFX} .ffxhud.hud-f1 .ffx-omr:not(.ffx-omr--phone) .ffx-omr__strip`;
const px = (v: string, vars: Record<string, string> = {}): number => evalLength(v, { vw: 1600, vh: 900, vars });

/**
 * The strip's bounding box in grid px at a window and a TEXT SIZE with this lane's rules: its right edge is anchored (`right`, the shear's half height on top, and at 115 the first lane's `translate`), its left edge is where its width puts it, the width
 * less what `--omr-tight` takes off the two paddings and the two gaps.
 */
function stripBox(w: (typeof STRIP_AT)[number], ts: number): { left: number; right: number } {
  const tightFrame = px(lastDecl(chap, STRIP_SEL, '--omr-tight')!, { '--lb-scale': String(w.lb) });
  const rightPx = px(lastDecl(chap, STRIP_SEL, 'right')!);
  const shift = ts === 1 ? 0 : evalPair(lastDecl(chap, STRIP_TS_SEL, 'translate')!, ctx(ts))[0] * OMR_K;
  const right = (1600 - rightPx) * OMR_K + (SKEW * w.h) / 2 + shift;
  const width = w.w - 4 * tightFrame * OMR_K; // four places lose `tightFrame` frame px each: padding left and right, two gaps
  return { left: right - width, right };
}
const ribbonRight = (ts: number): number => {
  const b = painted(FFX_ZONES.find((z) => z.name === 'boss ribbon')!, ts);
  return b.l + b.w + (SKEW * b.h) / 2;
};
/** The F1 turn strip's left edge (`hudf1-ffx.css` 465; text-size grows it to the left from its right edge 625.5) and its foot as the r71 sheets read it (`ctb`: y 22 to 66.5 at 100, to 73.2 at 115). */
const TURN_LEFT: Record<number, number> = { 1: 465, 1.15: 440.9 };
const TURN_FOOT: Record<number, number> = { 1: 66.5, 1.15: 73.2 };

describe('Chapter XII (FFX only): the disc strip lies left of the F1 turn strip at every window, and right of the ribbon', () => {
  it('the rule anchors the strip by its right edge, 454 grid px of the 1600 frame (465 frame px from its right edge), and says so in numbers this file reads', () => {
    expect(lastDecl(chap, STRIP_SEL, 'right')).toBe('465px');
    expect(lastDecl(chap, STRIP_SEL, 'left')).toBe('auto');
    expect((1600 - 465) * OMR_K).toBeCloseTo(454, 6);
  });

  it('REPRODUCES r71: left 690 of the frame (grid 276) puts the right end over the turn strip at every window under 1920 wide (9.3 px at 1600, 58.7 px at 1280) and 2 grid px short of it at 2560', () => {
    const over = (w: (typeof STRIP_AT)[number]): number => (w.lb === 2 ? 272.7 : 272.85) + w.w - 465; // the r71 sheets' bbox left (545.4 px at 1280, 682.1 at 1600, 1091.4 at 2560) plus the width, against the strip's left edge
    expect(over(STRIP_AT[0]!) * 2).toBeCloseTo(58.7, 0);
    expect(over(STRIP_AT[4]!) * 2.5).toBeCloseTo(9.3, 0);
    expect(over(STRIP_AT[5]!)).toBeCloseTo(-1.95, 1);
    for (const w of STRIP_AT.slice(0, 5)) expect(over(w), w.win).toBeGreaterThan(0);
  });

  for (const ts of [1, 1.15]) {
    for (const w of STRIP_AT) {
      it(`TEXT SIZE ${ts * 100}, ${w.win}: 7.5 to 8 grid px of clear air to the turn strip, and to the ribbon ${ts === 1 ? '40' : '4.2'} or more`, () => {
        const b = stripBox(w, ts);
        expect(TURN_LEFT[ts]! - b.right, 'to the turn strip').toBeGreaterThanOrEqual(7.5);
        expect(TURN_LEFT[ts]! - b.right, 'at most 8 (a hand number is a row, not a cushion)').toBeLessThan(8.1);
        expect(b.left - ribbonRight(ts), 'to the ribbon').toBeGreaterThanOrEqual(ts === 1 ? 40 : 4.2);
      });
    }
  }

  it('the strip\'s left end at 115 is 219.4 at 1280 x 720 (the one tight window) and 267 at 2560 x 1440 at 100', () => {
    expect(stripBox(STRIP_AT[0]!, 1.15).left).toBeCloseTo(219.4, 0);
    expect(stripBox(STRIP_AT[5]!, 1).left).toBeCloseTo(267, 0);
    expect(ribbonRight(1)).toBeCloseTo(190.7, 1);
    expect(ribbonRight(1.15)).toBeCloseTo(215.05, 1);
  });

  it('the compaction is 0 from 1600 x 900 up (nothing changes in the padding and gap there), grows to 5 frame px at 1280 x 720 and is clamped at 5 below it', () => {
    const tight = (lb: number): number => px(lastDecl(chap, STRIP_SEL, '--omr-tight')!, { '--lb-scale': String(lb) });
    expect(tight(4)).toBe(0);
    expect(tight(2.5)).toBe(0);
    expect(tight(2.25)).toBeCloseTo(2.5, 6);
    expect(tight(2)).toBeCloseTo(5, 6);
    expect(tight(1.6)).toBe(5);
    expect(tight(1)).toBe(5);
    // the four places it comes off, as the rule writes them: the gap, then the padding (top right bottom left)
    expect(lastDecl(chap, STRIP_SEL, 'gap')).toBe('calc(14px - var(--omr-tight))');
    expect(lastDecl(chap, STRIP_SEL, 'padding')).toBe('8px calc(18px - var(--omr-tight)) 8px calc(14px - var(--omr-tight))');
    expect(px('calc(14px - var(--omr-tight))', { '--omr-tight': '5px' })).toBe(9);
    // and what it is taken from: the sheet it answers declares 14 for the gap and 8 18 8 14 for the padding
    const omr = leafRules(readSource('src/ui/ffx/omnis-readout.css'));
    expect(lastDecl(omr, '.ffx-omr__strip', 'gap')).toBe('14px');
    expect(lastDecl(omr, '.ffx-omr__strip', 'padding')).toBe('8px 18px 8px 14px');
  });

  it('the rule beats the ones it answers and is the F1 landscape strip only; the first lane\'s 115 and 130 rule sets none of the same properties', () => {
    expect(cmpSpec(specificity(STRIP_SEL), specificity('.ffx-omr__strip'))).toBeGreaterThan(0);
    expect(STRIP_SEL).toContain('.ffxhud.hud-f1');
    expect(STRIP_SEL).toContain(':not(.ffx-omr--phone)');
    for (const p of ['left', 'right', 'gap', 'padding']) expect(lastDecl(chap, STRIP_TS_SEL, p), p).toBeUndefined();
    expect(lastDecl(chap, STRIP_TS_SEL, 'scale')).toBe('none');
  });
});

describe('Chapter XII (FFX only): the Sensor card stands in the band under the turn strip, clear of the pro target flag at every window the r71 sheets read', () => {
  const SENSOR_SEL = '.ffxhud.hud-f1.f1-intel[data-omnis-readout] .ffx-sensor';
  const SENSOR_TS_SEL = `${FFX_PFX} .ffxhud.hud-f1.f1-intel[data-omnis-readout] .ffx-sensor`;
  const SENSOR_H = 78; // the plate's height at 1600 x 900 (the r71 sheets: 195 px / 2.5)
  /** The open card's height by window: the type floor adds a chip row's worth at the small ones (r71: 300 px / 4, 195 / 2.5 and 162 / 2). */
  const HEIGHT_AT: Record<string, number> = { '1280x720': 81, '1600x900': 78, '2560x1440': 75 };
  /** The flag (`.ffx-target__plate`, pro look) the r71 sheets read with Intel and the target cursor up on Seymour Omnis, grid px. */
  const FLAGS: Record<string, Box> = {
    '1280x720': { l: 419.45, t: 165.35, w: 108.7, h: 38.7 },
    '1600x900': { l: 369.3, t: 169, w: 87.1, h: 31.8 },
    '2560x1440': { l: 296.55, t: 146.35, w: 72.8, h: 26.5 },
  };
  const top = (): number => px(lastDecl(chap, SENSOR_SEL, 'top')!);

  it('REPRODUCES r71: today\'s card (top 166, less the F1 sheet\'s 22 and the read-out\'s own 22) stands at y 122 to 200, across the flag (71.6 x 78 px at 1600, 201 x 67 at 1280)', () => {
    const margin = parseFloat(lastDecl(f1, '.hud-f1.f1-intel .ffx-sensor', 'margin-top')!);
    expect(margin).toBe(-22);
    const y0 = 166 + margin - 22;
    expect(y0).toBe(122);
    const x = { l: 427.7, w: 116.6 };
    const hit = (f: Box): number => Math.max(0, Math.min(x.l + x.w, f.l + f.w) - Math.max(x.l, f.l)) * Math.max(0, Math.min(y0 + SENSOR_H, f.t + f.h) - Math.max(y0, f.t));
    expect(hit(FLAGS['1600x900']!)).toBeGreaterThan(500); // 28.6 x 31 grid px = the 71.6 x 78 px of the read
    expect(hit(FLAGS['1280x720']!)).toBeGreaterThan(1500);
  });

  it('with the rule: top 79, no margin: its foot is 160 at 1280 x 720 (5.4 grid px above the flag), 157 at 1600 x 900 (12 above it), 154 at 2560 x 1440 (the flag is left of the card), and 43 above the intent card at the worst', () => {
    expect(top()).toBe(79);
    expect(lastDecl(chap, SENSOR_SEL, 'margin-top')).toBe('0');
    const foot = (win: string): number => top() + HEIGHT_AT[win]!;
    expect(foot('1280x720')).toBe(160);
    expect(foot('1600x900')).toBe(157);
    expect(foot('2560x1440')).toBe(154);
    expect(FLAGS['1280x720']!.t - foot('1280x720')).toBeCloseTo(5.35, 1);
    expect(FLAGS['1600x900']!.t - foot('1600x900')).toBeCloseTo(12, 1);
    expect(203 - foot('1280x720'), 'the intent card (r71: y 203 to 245)').toBeGreaterThan(42);
    // the lift the read-out writes (--ffx-sensor-dy) and the MAX mix's pin (--ffx-sensor-py) still add to it: the declaration keeps both
    expect(lastDecl(chap, SENSOR_SEL, 'top')).toBe('calc(79px + var(--ffx-sensor-dy, 0px) + var(--ffx-sensor-py, 0px))');
  });

  it('and clear of the turn strip: 12.5 grid px under its foot at 100, 5.8 at 115 (the card keeps its size at 115: `scale: none`)', () => {
    expect(top() - TURN_FOOT[1]!).toBeCloseTo(12.5, 6);
    expect(top() - TURN_FOOT[1.15]!).toBeCloseTo(5.8, 6);
    expect(lastDecl(chap, SENSOR_TS_SEL, 'scale')).toBe('none');
    // what it answers: `text-size.css` grows the card about its foot, which at 115 would have put its top at 79 + 78 - 89.7 = 67.3, 5.9 grid px INTO the strip
    const grownTop = top() + SENSOR_H - SENSOR_H * 1.15;
    expect(grownTop).toBeCloseTo(67.3, 1);
    expect(grownTop).toBeLessThan(TURN_FOOT[1.15]!);
  });

  it('is clear of the flag in every window: either the rows are apart (5 grid px and more) or the columns are (the card is x 428 to 544, steered at most to 476 to 592)', () => {
    for (const [win, f] of Object.entries(FLAGS)) {
      const apart = f.t - (top() + HEIGHT_AT[win]!);
      const columns = f.l + f.w < 428 || f.l > 592;
      expect(apart > 5 || columns, win).toBe(true);
    }
  });

  it('the rule beats the F1 sheet\'s margin, the card\'s own `top` and the growth, and names only the XII root marker with Intel on; the F1 sheets\' own rules for every other chapter are the ones they were', () => {
    expect(cmpSpec(specificity(SENSOR_SEL), specificity('.hud-f1.f1-intel .ffx-sensor'))).toBeGreaterThan(0);
    expect(cmpSpec(specificity(SENSOR_SEL), specificity('.ffx-sensor'))).toBeGreaterThan(0);
    expect(cmpSpec(specificity(SENSOR_TS_SEL), specificity(`${FFX_PFX} .ffxhud__stage > .ffx-sensor`))).toBeGreaterThan(0);
    expect(SENSOR_SEL).toContain('[data-omnis-readout]');
    expect(SENSOR_SEL).toContain('.f1-intel');
    expect(lastDecl(f1, '.hud-f1.f1-intel .ffx-sensor', 'margin-top')).toBe('-22px');
    expect(lastDecl(f1text, `${FFX_PFX} .ffxhud.hud-f1:not(.f1-acting) .ffx-sensor`, 'translate')).toBe('none');
  });
});

// ---------------------------------------------------------------------------------------------------------------- the tip is not slid in these two chapters (the stylesheet half, then the DOM half)

describe('the one-row tip stands where it was solved in Chapters IX and XII; Chapter I keeps its slide', () => {
  const SLIDE_100 = ".ffxhud.hud-f1.f1-intel .mad__card[data-zone='tip']";
  const SLIDE_TS = `${FFX_PFX} .ffxhud.hud-f1.f1-intel .mad__card[data-zone='tip']`;
  const OFF_100 = [".ffxhud.hud-f1.f1-intel[data-omnis-readout] .mad__card[data-zone='tip']", ".ffxhud.hud-f1.f1-intel:has(.ffx-zg:not([hidden]):not(.ffx-zg--phone)) .mad__card[data-zone='tip']"];
  const OFF_TS = OFF_100.map((s) => s.replace('.ffxhud.hud-f1.f1-intel', `${FFX_PFX} .ffxhud.hud-f1.f1-intel`));

  it('Chapter I\'s rules are the ones they were: 166 grid px right at 100, 6 + 160 x scale and a capped width at 115 and 130', () => {
    expect(lastDecl(f1, SLIDE_100, 'transform')).toBe('translateX(166px) skewX(var(--ig-skew))');
    expect(lastDecl(f1text, SLIDE_TS, 'transform')).toBe('translateX(calc(6px + 160px * var(--pyr-ts))) skewX(var(--ig-skew))');
    expect(lastDecl(f1text, SLIDE_TS, 'max-width')).toBe('calc(575.5px - 320.5px * var(--pyr-ts))');
    expect(ffxTipRow(1).left).toBeCloseTo(6 + (SKEW * TIP_HEIGHT) / 2 + TIP_BADGE + 166, 6);
  });

  it('the answers: each is two selectors (the XII marker; the IX gauge up, landscape), puts back the plain skew, and (at 115 and 130) lifts the width cap; each beats the rule it answers', () => {
    for (const [i, sel] of OFF_100.entries()) {
      expect(lastDecl(chap, sel, 'transform'), sel).toBe('skewX(var(--ig-skew))');
      expect(cmpSpec(specificity(sel), specificity(SLIDE_100)), sel).toBeGreaterThan(0);
      const ts = OFF_TS[i]!;
      expect(lastDecl(chap, ts, 'transform'), ts).toBe('skewX(var(--ig-skew))');
      expect(lastDecl(chap, ts, 'max-width'), ts).toBe('none');
      expect(cmpSpec(specificity(ts), specificity(SLIDE_TS)), ts).toBeGreaterThan(0);
    }
  });

  it('the selectors match Chapter XII\'s root (the marker) and Chapter IX\'s (the gauge up), and nothing else: Chapter I, the phone gauge, a hidden gauge, F1 off, Intel off', () => {
    const tree = (o: { cls?: string; omnis?: boolean; gauge?: 'up' | 'hidden' | 'phone' | null }): HTMLElement => {
      const root = document.createElement('div');
      root.className = o.cls ?? 'ffxhud hud-f1 f1-intel';
      if (o.omnis) root.setAttribute('data-omnis-readout', '');
      const stage = document.createElement('div');
      if (o.gauge) {
        const zg = document.createElement('div');
        zg.className = o.gauge === 'phone' ? 'ffx-zg ffx-zg--phone' : 'ffx-zg';
        if (o.gauge === 'hidden') zg.hidden = true;
        stage.append(zg);
      }
      const card = document.createElement('div');
      card.className = 'mad__card';
      card.dataset['zone'] = 'tip';
      stage.append(card);
      root.append(stage);
      document.body.append(root);
      return card;
    };
    const hits = (card: HTMLElement): boolean[] =>
      OFF_100.map((s) => {
        try {
          return card.matches(s);
        } catch {
          return false;
        }
      });
    let hasHas = true;
    try {
      document.createElement('div').matches(':has(a)');
    } catch {
      hasHas = false;
    }
    expect(hits(tree({ omnis: true }))[0], 'XII').toBe(true);
    expect(hits(tree({}))[0], 'Chapter I has no marker').toBe(false);
    expect(hits(tree({ omnis: true, cls: 'ffxhud hud-f1' }))[0], 'XII without Intel: the card is not up').toBe(false);
    expect(hits(tree({ omnis: true, cls: 'ffxhud f1-intel' }))[0], 'XII with the F1 HUD off').toBe(false);
    if (hasHas) {
      expect(hits(tree({ gauge: 'up' }))[1], 'IX gauge up').toBe(true);
      expect(hits(tree({ gauge: 'hidden' }))[1], 'the gauge is mounted hidden in every other chapter').toBe(false);
      expect(hits(tree({ gauge: 'phone' }))[1], 'the phone gauge').toBe(false);
      expect(hits(tree({}))[1], 'Chapter I').toBe(false);
      expect(hits(tree({ gauge: 'up', cls: 'ffxhud f1-intel' }))[1], 'F1 off').toBe(false);
    }
  });
});

describe('hudAvoidSelectors.f1RibbonEls: the F1 ribbon is ink in Chapter IX (the gauge up) and Chapter XII (the marker) only, and topChipEls hands it to the tip', () => {
  const hud = (o: { f1?: boolean; omnis?: boolean; gauge?: 'up' | 'hidden' | 'phone' | null }): { root: HTMLElement; ribbon: HTMLElement } => {
    const root = document.createElement('div');
    root.className = o.f1 === false ? 'ffxhud' : 'ffxhud hud-f1';
    if (o.omnis) root.setAttribute('data-omnis-readout', '');
    const stage = document.createElement('div');
    if (o.gauge) {
      const zg = document.createElement('div');
      zg.className = o.gauge === 'phone' ? 'ffx-zg ffx-zg--phone' : 'ffx-zg';
      if (o.gauge === 'hidden') zg.hidden = true;
      stage.append(zg);
    }
    const layer = document.createElement('div');
    layer.className = 'f1-layer';
    const ribbon = document.createElement('div');
    ribbon.className = 'f1-ribbon';
    layer.append(ribbon);
    const toggle = document.createElement('button');
    toggle.className = 'sgd__toggle';
    stage.append(layer, toggle);
    root.append(stage);
    document.body.append(root);
    return { root, ribbon };
  };

  it('Chapter IX with the gauge up and Chapter XII with the marker answer the ribbon; each answers only for its own `only`', () => {
    const ix = hud({ gauge: 'up' });
    expect(f1RibbonEls(ix.root)).toEqual([ix.ribbon]);
    expect(f1RibbonEls(ix.root, 'zanmato')).toEqual([ix.ribbon]);
    expect(f1RibbonEls(ix.root, 'omnis')).toEqual([]);
    const xii = hud({ omnis: true });
    expect(f1RibbonEls(xii.root)).toEqual([xii.ribbon]);
    expect(f1RibbonEls(xii.root, 'omnis')).toEqual([xii.ribbon]);
    expect(f1RibbonEls(xii.root, 'zanmato')).toEqual([]);
  });

  it('every other state answers nothing: Chapter I, a hidden gauge (mounted in every other chapter), the phone gauge, F1 off (today\'s HUD, `?hud=today`, `?treated=pack`, the 130 step-down)', () => {
    expect(f1RibbonEls(hud({}).root), 'Chapter I').toEqual([]);
    expect(f1RibbonEls(hud({ gauge: 'hidden' }).root)).toEqual([]);
    expect(f1RibbonEls(hud({ gauge: 'phone' }).root)).toEqual([]);
    expect(f1RibbonEls(hud({ f1: false, gauge: 'up' }).root), 'IX with F1 off').toEqual([]);
    expect(f1RibbonEls(hud({ f1: false, omnis: true }).root), 'XII with F1 off').toEqual([]);
  });

  it('topChipEls keeps the guide\'s chips and adds the ribbon in these two chapters only (the tip\'s `keepOff` list; Chapter I\'s list is the one it was)', () => {
    const ix = hud({ gauge: 'up' });
    expect(topChipEls(ix.root)).toContain(ix.ribbon);
    expect(topChipEls(ix.root).length).toBe(2);
    const one = hud({});
    expect(topChipEls(one.root).length).toBe(1);
    expect(topChipEls(one.root)).not.toContain(one.ribbon);
  });

  it('FFXBattleHud.ts reads it for the designed card\'s ink in Chapter XII alone, and did not grow (the file is over 400 lines and must not)', () => {
    const src = readFileSync(resolve('src/ui/ffx/FFXBattleHud.ts'), 'utf8');
    expect(src).toContain("...f1RibbonEls(this.el, 'omnis')");
    expect(src).toContain('keepOff: topChipEls(this.el)');
    expect((src.match(/\n/g) ?? []).length).toBeLessThanOrEqual(1811);
  });
});


// ---------------------------------------------------------------------------------------------------------------- what this lane may and may not have touched

describe('the sheets the other chapters read are the ones they were', () => {
  it('every rule this lane added to hudf1-chapters.css hangs from the F1 HUD AND from one of the two chapters\' own markers, so it matches nothing in Chapter I, Chapter IV or any other chapter', () => {
    const markers = /\[data-omnis-readout\]|\.ffx-zg:not\(\[hidden\]\)|\.ffx-zg:not\(\.ffx-zg--phone\)|\.ffx-omr:not\(\.ffx-omr--phone\)/;
    expect(chap.length).toBeGreaterThanOrEqual(13);
    for (const r of chap) {
      expect(r.sel, r.sel).toContain('.ffxhud.hud-f1');
      expect(markers.test(r.sel), r.sel).toBe(true);
    }
  });

  it('hudf1.css, hudf1-ffx.css, hudf1-ffx2.css, hudf1-textsize.css and the two panels\' own sheets name neither the new properties nor the new selectors (this lane\'s declarations are all in hudf1-chapters.css)', () => {
    for (const rel of ['src/ui/hudf1/hudf1.css', 'src/ui/hudf1/hudf1-ffx.css', 'src/ui/hudf1/hudf1-ffx2.css', 'src/ui/hudf1/hudf1-textsize.css', 'src/ui/ffx/omnis-readout.css', 'src/ui/ffx/zanmato-gauge.css']) {
      const body = readSource(rel);
      expect(body, rel).not.toContain('--omr-tight');
      if (!rel.endsWith('omnis-readout.css')) expect(body, rel).not.toContain('data-omnis-readout'); // the read-out's own sheet names its marker in its phone rule
    }
  });
});
