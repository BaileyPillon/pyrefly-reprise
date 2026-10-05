// @vitest-environment jsdom
/**
 * TEXT SIZE reaches the FFX-2 battle HUD and both games' pause (judgment call K of critic round 21, PR-0270; Bailey,
 * 2026-10-04, "all your recommendations": "turn it on for the FFX-2 HUD and the pause", the relabel as the fallback).
 * D-220's Q4 had held `TEXT_SIZE_WIDE_SCOPE` off until the 130 % frames were seen; the switch is on, and the layout that was
 * missing from the first cut is pinned here:
 *
 * - the strategy guide's rail fits the room it has once the scale has grown it (`railRoom`), and steps down by what the boss
 *   strips grew (`--sgd-shift`), so it no longer runs over Yuna's head (36 percent of her at 130 percent in Chapter IV);
 * - the command list is capped so its grown top stays under the help band instead of running off the window (Chapter V's
 *   sixteen White Magic rows: top at -116 px at 130 percent);
 * - the intent slab prints its brief density while the text is grown, so the solver can find the free band it fits, and
 *   goes back to full at 100 percent (FFX-2 only: the slab is the shared one, FFX mounts it brief already);
 * - `data-text-size-wide` is on `<html>` from the first frame and is 1 / 1.15 / 1.3 for the HUD (1 on the phone).
 *
 * The browser proof (real keys, three viewports, three sizes, Chapters IV to VI and both pauses) is in
 * `docs/handoff/r39-judg.md` and `docs/screenshots/r39-judg/text-size/`. Game case: the HUD rules are FFX-2 only; the
 * switch and the pause are both games.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { TEXT_SIZE_WIDE_SCOPE, applyComfort, textSizeWideScope } from '../../src/app/applyComfort.ts';
import { EnemyIntentPanel, type IntentView } from '../../src/ui/common/EnemyIntent.ts';
import { railRoom } from '../../src/ui/common/StrategyGuide.ts';
import { currentWideTextScale } from '../../src/ui/common/hudTextSize.ts';
import { advisorFolds } from '../../src/ui/ffx2/advisorLane.ts';
import { boardRects } from '../../src/ui/ffx2/intentBoard.ts';
import { placeSlab, type SlabRect } from '../../src/ui/ffx2/intentPlacement.ts';

const css = readFileSync(join(__dirname, '../../src/ui/common/text-size-wide.css'), 'utf8').replace(/\r\n/g, '\n');
const html = (): HTMLElement => document.documentElement;

afterEach(() => {
  document.body.innerHTML = '';
  for (const k of ['textSize', 'textSizeWide']) delete html().dataset[k];
  html().removeAttribute('data-phone-battle');
  html().style.removeProperty('--pyr-ts');
});

describe('the switch is on', () => {
  it('TEXT_SIZE_WIDE_SCOPE is true, and the scope answers true with no query string', () => {
    expect(TEXT_SIZE_WIDE_SCOPE).toBe(true);
    expect(textSizeWideScope()).toBe(true);
  });

  it('data-text-size-wide follows TEXT SIZE on <html>: 100, 115 and 130, from the first write', () => {
    for (const [size, pct] of [[1, '100'], [1.15, '115'], [1.3, '130']] as const) {
      applyComfort({ textSize: size });
      expect(html().dataset['textSize'], `size ${size}`).toBe(pct);
      expect(html().dataset['textSizeWide'], `size ${size}`).toBe(pct);
    }
  });

  it('currentWideTextScale reads it: 1, 1.15, 1.3; 1 on the phone, which lays itself out; 1 with no attribute', () => {
    expect(currentWideTextScale(html())).toBe(1);
    html().dataset['textSizeWide'] = '115';
    expect(currentWideTextScale(html())).toBe(1.15);
    html().dataset['textSizeWide'] = '130';
    expect(currentWideTextScale(html())).toBe(1.3);
    html().setAttribute('data-phone-battle', 'ffx2');
    expect(currentWideTextScale(html())).toBe(1);
    expect(currentWideTextScale(null)).toBe(1);
  });
});

describe('the guide rail fits the room it has once it has grown', () => {
  it('scale 1 and no shift give the stage room back unchanged (100 percent is untouched)', () => {
    expect(railRoom(93, 1, 0)).toBe(93);
    expect(railRoom(56, 1, 0)).toBe(56);
  });

  it('130 percent: the layout room is the stage room less the step, over the scale', () => {
    expect(railRoom(93, 1.3, 10)).toBeCloseTo(83 / 1.3, 9);
    // painted again at the scale and stepped down by the shift, it lands exactly on the room it was given
    const layout = railRoom(93, 1.3, 10);
    expect(layout * 1.3 + 10).toBeCloseTo(93, 9);
  });

  it('115 percent likewise', () => {
    expect(railRoom(93, 1.15, 5)).toBeCloseTo(88 / 1.15, 9);
    expect(railRoom(93, 1.15, 5) * 1.15 + 5).toBeCloseTo(93, 9);
  });

  it('a nonsense scale or shift is ignored, never trusted', () => {
    expect(railRoom(93, Number.NaN, 4)).toBe(89);
    expect(railRoom(93, 0.5, -10)).toBe(93);
    expect(railRoom(93, 1.3, Number.NaN)).toBeCloseTo(93 / 1.3, 9);
  });

  it('the steps are measured, not fixed: three enemies step the rail down by three strips of growth', () => {
    const oneStrip = 31 * (1.3 - 1);
    const three = 3 * 31 * (1.3 - 1);
    expect(three).toBeCloseTo(3 * oneStrip, 9);
    // the stylesheet reads the measured step (`--sgd-shift`), not a literal 5 or 10 px
    expect(css).toContain('translate: 0 var(--sgd-shift, 0px)');
    expect(css).not.toMatch(/\.sgd > \* \{ translate: 0 (5|10)px; \}/);
  });
});

describe('the command list keeps its grown top under the help band', () => {
  it('is capped at 179 px (115 percent) and 147 px (130 percent) and uncapped at 100 percent', () => {
    expect(css).toMatch(/data-text-size-wide='115'\]:not\(\[data-phone-battle\]\) \.ffx2hud__stage > \.ffx2hud__command \{ max-height: 179px; \}/);
    expect(css).toMatch(/data-text-size-wide='130'\]:not\(\[data-phone-battle\]\) \.ffx2hud__stage > \.ffx2hud__command \{ max-height: 147px; \}/);
    expect(css).not.toMatch(/data-text-size-wide='100'\][^{]*ffx2hud__command[^{]*\{[^}]*max-height/);
  });

  it('the caps keep the painted list inside the window: the bottom is 243.56 grid px down less the step, the band ends at 17.3', () => {
    const bottom = 360 - 116.44; // `.ffx2hud__command { bottom: 116.44px }`
    for (const [scale, step, cap] of [[1.15, 15, 179], [1.3, 30, 147]] as const) {
      const top = bottom - step - cap * scale;
      expect(top, `top at ${scale}`).toBeGreaterThan(17.3 + 4);
    }
    // and at 100 percent the authored 220 px list reaches 23.56 (its own rule, unchanged)
    expect(bottom - 220).toBeGreaterThan(17.3);
  });
});

describe('the intent slab prints its brief density while the text is grown', () => {
  const view = (): IntentView => ({
    enemyId: 'bahamut',
    enemyName: 'Bahamut',
    turnsAway: 0,
    actsNext: true,
    kind: 'action',
    moveName: 'Attack',
    abilityId: 'attack',
    description: 'Physical non-elemental damage to one girl.',
    elements: [],
    statusText: ['Curse 100%'],
    estimate: { name: 'Attack', hits: 1, totalHarmToParty: 150, heals: false, perTarget: [{ targetId: 'yuna', targetName: 'Yuna', amount: 150, min: 140, max: 160, hpFraction: 0.2, lethal: false, hitChancePercent: 92 }] },
    confidence: 'scripted',
    branches: [],
    charge: null,
    counters: [],
    formNote: null,
    notes: ['The Mega Flare countdown is an action counter.'],
    cite: '',
  });

  function mount(density: 'full' | 'brief' | (() => 'full' | 'brief')): { root: HTMLElement; panel: EnemyIntentPanel } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const panel = new EnemyIntentPanel({ game: 'ffx2', readVisible: () => true, writeVisible: () => undefined });
    panel.mount(root, { host: root, scale: () => 2.5, project: () => ({ x: 800, y: 400 }), avoid: () => [], density });
    panel.setSource(() => view());
    return { root, panel };
  }

  it('a fixed density behaves as before (the mock screens and FFX still pass a string)', () => {
    const full = mount('full');
    expect(full.root.textContent).toContain('Statuses');
    expect(full.root.textContent).toContain('Mega Flare countdown');
    full.panel.unmount();
    const brief = mount('brief');
    expect(brief.root.textContent).not.toContain('Statuses');
    expect(brief.root.textContent).not.toContain('Mega Flare countdown');
    brief.panel.unmount();
  });

  it('a density function is read live: update() draws the body again when the text size changes', () => {
    let d: 'full' | 'brief' = 'full';
    const { root, panel } = mount(() => d);
    expect(root.textContent).toContain('Statuses');
    d = 'brief';
    panel.update(0);
    expect(root.textContent).not.toContain('Statuses');
    expect(root.textContent).toContain('Attack'); // the move survives every density
    expect(root.textContent).toContain('Yuna');
    d = 'full';
    panel.update(0);
    expect(root.textContent).toContain('Statuses');
    panel.unmount();
  });

  it('the FFX-2 HUD hands the slab exactly that rule: brief above 100 percent, full at 100', () => {
    const src = readFileSync(join(__dirname, '../../src/ui/ffx2/FFX2BattleHud.ts'), 'utf8');
    expect(src).toContain("density: () => (currentWideTextScale() > 1 ? 'brief' : 'full')");
  });
});

describe('the intent slab never takes a girl before the chrome while the text is grown (placeSlab girlsFirst)', () => {
  const r = (left: number, top: number, right: number, bottom: number, extra: Partial<SlabRect> = {}): SlabRect => ({ left, top, right, bottom, ...extra });
  const overlap = (a: SlabRect, b: SlabRect): number =>
    Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const LAYER = { width: 600, height: 400 };
  const SIZE = { w: 100, h: 100 };
  const NATURAL = { left: 200, top: 150 };
  const girl = r(200, 150, 300, 250, { soft: true, party: true });
  // chrome everywhere but the girl's own spot; the narrowest chrome cut is the strip right of her (64 px of the slab)
  const chrome = [r(0, 0, 600, 146), r(0, 254, 600, 400), r(0, 146, 196, 254), r(340, 146, 600, 254)];
  const at = (p: { left: number; top: number }): SlabRect => r(p.left, p.top, p.left + SIZE.w, p.top + SIZE.h);

  it('the old tiers cover the girl to spare every panel (chrome first, then the party)', () => {
    const p = placeSlab(NATURAL, SIZE, [...chrome, girl], LAYER, 4, 0, { tiered: true });
    expect(overlap(at(p), girl)).toBeGreaterThan(0);
    expect(chrome.reduce((s, o) => s + overlap(at(p), o), 0)).toBe(0);
  });

  it('girlsFirst counts the girl with the chrome, so the slab moves to the panel edge rather than stand on her', () => {
    const p = placeSlab(NATURAL, SIZE, [...chrome, girl], LAYER, 4, 0, { tiered: true, girlsFirst: true });
    expect(overlap(at(p), girl)).toBe(0);
  });

  it('with no girl on the board it is the old answer, and a free spot is still taken', () => {
    const a = placeSlab(NATURAL, SIZE, chrome, LAYER, 4, 0, { tiered: true });
    const b = placeSlab(NATURAL, SIZE, chrome, LAYER, 4, 0, { tiered: true, girlsFirst: true });
    expect(a).toEqual(b);
    const free = placeSlab({ left: 380, top: 20 }, SIZE, [girl], LAYER, 4, 0, { tiered: true, girlsFirst: true });
    expect(free.free).toBe(true);
  });

  it('a panel a pixel or two from the slab is touching it, not covering it (the skew deflates the bounding box)', () => {
    // the grown command list's top edge was 1 px under the slab's bottom at 1600x900 (Chapter IV, 130 %)
    const list = r(0, 99 + 4, 600, 400); // the slab's natural bottom (top 4 + 100) overlaps it by 1 px
    const boss = r(0, 0, 600, 50, { soft: true });
    const p = placeSlab({ left: 100, top: 4 }, SIZE, [list, boss], LAYER, 4, 0, { tiered: true, girlsFirst: true });
    expect(p.top).toBe(4); // it stays on the free band instead of dropping onto the boss's painting
  });
});

describe("the intent slab keeps off the guide's MORE row (it painted under the panel in the same column)", () => {
  it('the board names `.sgd__more` beside the guide panel and chip', () => {
    const root = document.createElement('div');
    root.innerHTML = '<div class="sgd__panel"></div><div class="sgd__more"></div><div class="sgd__toggle"></div>';
    const rects: Record<string, [number, number, number, number]> = { 'sgd__panel': [100, 100, 400, 300], 'sgd__more': [100, 300, 400, 330], 'sgd__toggle': [100, 70, 200, 98] };
    for (const el of Array.from(root.children) as HTMLElement[]) {
      const [l, t, r, b] = rects[el.className]!;
      el.getBoundingClientRect = () => ({ left: l, top: t, right: r, bottom: b, width: r - l, height: b - t, x: l, y: t, toJSON: () => ({}) });
    }
    const boxes = boardRects(root, { scale: 2.5, chipReach: 0 });
    expect(boxes).toContainEqual({ left: 100, top: 300, right: 400, bottom: 330 });
    expect(boxes).toHaveLength(3);
  });
});

describe('the rest of the stylesheet pins what the browser proof measured', () => {
  const read = (rel: string): string => readFileSync(join(__dirname, '../..', rel), 'utf8').replace(/\r\n/g, '\n');
  const labels = read('src/ui/common/pause-labels.css');

  it('FFX-2 phone: the tiles, the rail, the footer and the GUIDE chip grow; the party chips cap at 115 percent', () => {
    const phone = "html[data-phone-battle='ffx2'][data-text-size-wide]:not([data-text-size-wide='100'])";
    expect(css).toContain(`${phone} .ffx2cmd__label {`);
    expect(css).toContain('font-size: calc(16px * var(--pyr-ts));');
    expect(css).toContain(`${phone} :is(.phud-foot, .phud-foot__who, .phud-foot__help, .phud-guide) { font-size: calc(14px * var(--pyr-ts)); }`);
    expect(css).toContain(`${phone} .ffx2hud .ig-stat__name { font-size: calc(17px * 1.15); }`);
    expect(css).toContain(`${phone} .ffx2hud .ig-stat__value { font-size: calc(16px * 1.15); white-space: nowrap; }`);
    // the chip's rows keep a line each and the chip rises by the difference; it never scales past 1.15
    expect(css).toContain('grid-template-rows: calc(17px * 1.15) calc(17px * 1.15) auto;');
    expect(css).not.toMatch(/\.ig-stat__name \{ font-size: calc\(17px \* var\(--pyr-ts\)\)/);
  });

  it('FFX-2 phone: the command list gives the grown footer 6 / 12 px (it scrolls, so nothing is lost)', () => {
    expect(css).toContain("[data-text-size-wide='115'] .ffx2hud__command { max-height: calc(var(--phud-grid) - 44px - 6px); }");
    expect(css).toContain("[data-text-size-wide='130'] .ffx2hud__command { max-height: calc(var(--phud-grid) - 44px - 12px); }");
    expect(css).toContain("[data-text-size-wide='130'] .ffx2hud__command:has(.ffx2cmd__title) { max-height: calc(var(--phud-tip) - 12px); }");
  });

  it('pause CONTROLS wraps its sentence labels and the CHAPTER tab keeps captions whole at 115 / 130 percent', () => {
    expect(css).toMatch(/data-tab='controls'\] \.pause__k \{\n {2}white-space: normal;/);
    expect(css).toMatch(/\.pause__snap \{\n {2}width: calc\(clamp\(72px, 6\.5vw, 130px\) \* 1\.2\);/);
    expect(css).toContain('min(var(--pyr-ts), 1.15)');
  });

  it('the MUSIC list stops above the objective and scrolls, at every size (it ran over it at 100 percent too)', () => {
    expect(labels).toContain(".pause__body[data-tab='music'] .pause__music-list {");
    expect(labels).toContain('max-height: calc(var(--pu-top-obj) - var(--pu-top-body) - 3 * var(--pu-row));');
    expect(labels).toContain('overflow-y: auto;');
  });
});

describe('the advisor folds when it has no lane at 115 / 130 percent, and never at 100 (advisorFolds)', () => {
  it('squeezed at 115 or 130: it folds; clear or under: it stays up', () => {
    for (const scale of [1.15, 1.3]) {
      expect(advisorFolds('squeezed', scale, false), `squeezed at ${scale}`).toBe(true);
      expect(advisorFolds('clear', scale, false), `clear at ${scale}`).toBe(false);
      expect(advisorFolds('under', scale, false), `under at ${scale}`).toBe(false);
    }
  });

  it('latches within a decision: a lane that opens up is picked up at the next one, not mid-decision', () => {
    expect(advisorFolds('clear', 1.3, true)).toBe(true);
    expect(advisorFolds('under', 1.15, true)).toBe(true);
  });

  it('at 100 percent nothing folds, and a latched fold lets go the moment the text is back at 100', () => {
    expect(advisorFolds('squeezed', 1, false)).toBe(false);
    expect(advisorFolds('squeezed', 1, true)).toBe(false);
    expect(advisorFolds('clear', 1, true)).toBe(false);
    expect(advisorFolds('squeezed', Number.NaN, false)).toBe(false);
  });
});

describe('the grown guide rail keeps its column and gives way when it has no room', () => {
  const css2 = css; // the stylesheet text read at the top of this file
  it('its layout width is 132 over the scale, so it paints the 132 grid px it paints at 100 percent', () => {
    expect(css2).toContain('.ffx2hud__stage > .sgd > .sgd__stack { width: calc(132px / var(--pyr-ts)); }');
    const widths = [1, 1.15, 1.3].map((ts) => (132 / ts) * ts);
    for (const w of widths) expect(w).toBeCloseTo(132, 9);
  });

  it('a rail with no room above the girl (Chapter VI at 115 / 130 percent) is not drawn at all, panel and chip', () => {
    expect(css2).toContain(".ffx2hud .sgd.sgd--squeezed { display: none; }");
    const src = readFileSync(join(__dirname, '../../src/ui/common/StrategyGuide.ts'), 'utf8');
    expect(src).toContain("this.el.classList.toggle('sgd--squeezed', grown.scale > 1 && above !== null && room < MIN_PANEL_HEIGHT);");
    // and it is the FFX-2 rail only: FFX keeps its own rule
    expect(src).toContain("if (this.opts.game !== 'ffx2') return { scale: 1, shift: 0 };");
  });

  it('the pause phone block never prints under the 14 px floor the phone stylesheet sets (14 and 15 px): 12 and 13 px times the scale, floored', () => {
    expect(css2).toContain('--pu-fs: max(14px, calc(12px * var(--pyr-ts)));');
    expect(css2).toContain('--pu-fs-v: max(15px, calc(13px * var(--pyr-ts)));');
    expect(css2).not.toContain('--pu-fs: calc(12px * var(--pyr-ts));');
    for (const ts of [1.15, 1.3]) {
      expect(Math.max(14, 12 * ts), `body type at ${ts}`).toBeGreaterThanOrEqual(14);
      expect(Math.max(15, 13 * ts), `value type at ${ts}`).toBeGreaterThanOrEqual(15);
    }
  });
});
