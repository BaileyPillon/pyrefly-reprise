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
 * Every case that says "measured" below is a model of the browser (named in the case); the browser read is the next review's (jobs FIN-1 to FIN-4 of the handoff, with predictions).
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { F1_TEXT_CEILING, hudF1On, hudF1TextSizeOk, setHudF1Mode, setHudF1TextMode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { GAP, SKEW } from '../../src/ui/ffx/hudSafeZones.ts';
import { SIN_HUD_SELECTORS } from '../../src/ui/ffx/hudAvoidSelectors.ts';
import { FIN_CHARGED_TEXT } from '../../src/ui/ffx/sinHudModel.ts';
import { FFX_ZONES, painted, overlap, ctx, type Box } from './helpers/f1Zones.ts';
import { declsOf, evalPair, lastDecl, leafRules, readSource } from './helpers/cssEval.ts';
import { fontMetrics, textWidth } from './helpers/woff2Width.ts';

const ID = 'sin-fins-core';
const root = document.documentElement;
const sin = leafRules(readSource('src/ui/ffx/sin-hud.css'));
/** The Sin HUD's frame is 1600 wide and scaled into the 640 grid by 0.4 (`SinHud.ts`: `GRID_W / MOCK_W`). */
const K = 640 / 1600;

const ZONE = (name: string, ts: number): Box => painted(FFX_ZONES.find((z) => z.name === name)!, ts);
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
/** The charge row: padding, the diamond (12), the gap and the line (Chakra Petch Bold 15 px, 0.14em, uppercase). */
const chargeRow = (): number => {
  const [, pr, , pl] = pad(sin, '.ffx-sinfin__charge');
  const gap = parseFloat(lastDecl(sin, '.ffx-sinfin__charge', 'gap')!);
  const icon = parseFloat(lastDecl(sin, '.ffx-sinfin__charge i', 'width')!);
  return pl + icon + gap + textWidth(CHAKRA, FIN_CHARGED_TEXT.toUpperCase(), 15, 0.14) + pr;
};
/** The plate in the charged state, frame px: the left border, the padding and the charge row (the widest content), over the sheet's minimum. */
const plateWidth = (): number => {
  const [, pr, , pl] = pad(sin, BASE);
  const border = parseFloat(/(\d+)px/.exec(lastDecl(sin, BASE, 'border-left')!)![1]!);
  return Math.max(parseFloat(lastDecl(sin, BASE, 'min-width')!), border + pl + pr + chargeRow());
};
/** The plate's height, a content-sized estimate (named): padding 10 + 12, the name row (30, the serif's line-height 1), the charge row's margin 8 and its own height (padding 6 + 7, a 15 px line at 1.3). */
const PLATE_H = 92;

/** The plate's PAINTED box at a text size: the layout box under the sheet's declarations for it, widened by the shear (`SKEW x height`, half each side), moved by the `translate` the sheet declares for that size. */
function plateAt(ts: number, f1: boolean): Box {
  const w = plateWidth();
  const right = f1 ? lastDecl(sin, F1, 'right') : undefined;
  const left = f1 && right !== undefined ? 1600 - parseFloat(right) - w : parseFloat(lastDecl(sin, BASE, 'left')!);
  const t = f1 && ts === 1.15 ? lastDecl(sin, F1_115, 'translate') : undefined;
  const dx = t === undefined ? 0 : evalPair(t, ctx(ts))[0];
  const top = parseFloat(lastDecl(sin, BASE, 'top')!);
  return { l: (left + dx - (SKEW * PLATE_H) / 2) * K, t: top * K, w: (w + SKEW * PLATE_H) * K, h: PLATE_H * K };
}
const tip = (b: Box): number => b.l + b.w;

describe("the plate's width is its charge line's, read from the font the page loads", () => {
  it('the font has every character of the line (the middle dot too), so the read is the face and not a fallback', () => {
    for (const ch of FIN_CHARGED_TEXT.toUpperCase()) expect(CHAKRA.has(ch), JSON.stringify(ch)).toBe(true);
    expect(CHAKRA.upm).toBeGreaterThan(0);
  });

  it('the line is 406.8 frame px (39 characters, 15 px, 0.14em spacing), the row 448.8, the plate 489.8 = 195.9 grid px: wider than the sheet\'s 470 minimum, as the first lane\'s "at least 188" said', () => {
    expect(textWidth(CHAKRA, FIN_CHARGED_TEXT.toUpperCase(), 15, 0.14)).toBeCloseTo(406.8, 0);
    expect(chargeRow()).toBeCloseTo(448.8, 0);
    expect(plateWidth()).toBeCloseTo(489.8, 0);
    expect(plateWidth() * K).toBeCloseTo(195.9, 0);
    expect(plateWidth()).toBeGreaterThan(parseFloat(lastDecl(sin, BASE, 'min-width')!));
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
    const hits = FFX_ZONES.filter((z) => z.name !== 'sensor card (Intel)' && overlap(unmoved, painted(z, 1)) > 0).map((z) => z.name);
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
      expect(overlap(plate, painted(z, ts)), `${z.name} at ${ts}`).toBe(0);
      expect(sep(plate, painted(z, ts)), `${z.name} at ${ts}`).toBeGreaterThanOrEqual(GAP);
    }
  });

  it('the painted tip is 7.9 grid px short of the turn strip at 100 and 7.8 at 115 (the strip grows left by 24.1 and the plate follows by 24), the same shape as Chapter XII\'s disc strip (7.8)', () => {
    expect(ZONE('turn strip', 1).l - tip(plateAt(1, true))).toBeCloseTo(7.9, 1);
    expect(ZONE('turn strip', 1.15).l - tip(plateAt(1.15, true))).toBeCloseTo(7.8, 1);
  });

  it('the left end clears the boss ribbon by 65 grid px at 100 and by 17 at 115 (the ribbon grows to 212), the painted lowest-left corner included', () => {
    const r100 = ZONE('boss ribbon', 1);
    const r115 = ZONE('boss ribbon', 1.15);
    expect(plateAt(1, true).l - (r100.l + r100.w)).toBeGreaterThan(60);
    expect(plateAt(1, true).l).toBeCloseTo(253.4, 0);
    expect(plateAt(1.15, true).l - (r115.l + r115.w)).toBeGreaterThanOrEqual(GAP);
    expect(plateAt(1.15, true).l - (r115.l + r115.w)).toBeCloseTo(17.4, 0);
    expect(plateAt(1.15, true).l).toBeCloseTo(229.4, 0);
  });

  it('the layout box ends at 453.2 grid px at 100 (right: 467px of the 1600 frame) and the plate does not move vertically (top 22.4, y 22.4 to 59.2 against the strip\'s 22 to 82)', () => {
    expect((1600 - parseFloat(lastDecl(sin, F1, 'right')!)) * K).toBeCloseTo(453.2, 6);
    expect(lastDecl(sin, F1, 'top')).toBeUndefined(); // the rule moves the plate sideways only
    expect(lastDecl(sin, F1, 'left')).toBe('auto');
    expect(plateAt(1, true).t).toBeCloseTo(22.4, 6);
  });

  it("the band is wide enough at 100 and 115 and NOT at 130: 277, 228.9 and 180.9 grid px against the plate's 195.9 plus a GAP on each side (207.9)", () => {
    const band = (ts: number): number => ZONE('turn strip', ts).l - (ZONE('boss ribbon', ts).l + ZONE('boss ribbon', ts).w);
    const need = plateWidth() * K + 2 * GAP;
    expect(band(1)).toBeCloseTo(277, 6);
    expect(band(1.15)).toBeCloseTo(228.9, 1);
    expect(band(1.3)).toBeCloseTo(180.9, 1);
    expect(band(1)).toBeGreaterThan(need);
    expect(band(1.15)).toBeGreaterThan(need);
    expect(band(1.3)).toBeLessThan(need);
  });
});

// ---------------------------------------------------------------------------------------------------------------- scope: nothing else moves

describe('the new rules reach only the F1 HUD in the landscape widget (the old HUD, ?treated=pack, the phone and TEXT SIZE 130 draw the plate where it always stood)', () => {
  /** The rules that place the plate itself (a selector that ENDS in the plate's class: its children and its modifiers are other rules). */
  const placing = sin.filter((r) => /\.ffx-sinfin$/.test(r.sel)).map((r) => r.sel);

  it("exactly four rules place the plate: the sheet's base rule, the phone rule (also the sheet's own, and it stays), the F1 rule and the 115 step", () => {
    expect([...placing].sort()).toEqual([BASE, '.ffx-sinhud--phone .ffx-sinfin', F1, F1_115].sort());
  });

  it('the F1 rule sets `left` and `right` only; the 115 step sets `translate` only; there is no 130 rule', () => {
    const body = (sel: string): string[] => declsOf(sin.find((r) => r.sel === sel)!.body).map(([p]) => p).sort();
    expect(body(F1)).toEqual(['left', 'right']);
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
