// @vitest-environment jsdom
/**
 * THE REVIEW OF r74-omnis (895cb6bb3; 2026-11-02): the minor findings that are about what the lane's own numbers say and what its tests left unkilled. FFX only (rule 14): everything here is Chapter XII's F1 HUD; the dock's
 * skew arithmetic is read from the recorded flag boxes of the FFX chapter, and the plate code it speaks of is shared plumbing that this file changes not at all. (M1, the release cut's stop, is `r74-omnis-gate.test.ts`.)
 *
 *  - m1 (the diagnosed cause): the flag's bounding box is wider than `plateWidth` by its own height times tan 12 degrees, the `skewX(-12deg)` of `.ffx-target__plate--*`, to within a pixel in every recorded window. `plateWidth` is
 *    right; `plateBox` lays an unskewed box. The note, the `flagSteer.ts` header and the open question say so, and the arithmetic is computed from the recorded boxes below.
 *  - m2 (the Sensor steer's flag branch): the two behaviours no test pinned (the figure's steer already clearing the flag; "neither side has room, the figure's answer stands"), and the wiring through the real HUD, which only a
 *    source-text pin held.
 *  - m3 (ally and self flags): the gate is the chapter and the F1 HUD, not the flag's kind, and the recorded walks are all the enemy flag. A sweep of flag places through the real builders and the real solver (the model of
 *    `helpers/r74OmnisModel.ts`) reads 0 overlaps wherever a flag goes, across the whole stage.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { TargetingPort } from '../../src/engine/HudPort.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FLAG_SELECTOR } from '../../src/ui/ffx/flagSteer.ts';
import { GAP, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';
import { SENSOR_STAGE_MARGIN, sensorSteerDx, type GridBox } from '../../src/ui/ffx/sensorSteer.ts';
import { plateWidth } from '../../src/ui/ffx/targetCursorParts.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { apart, hits } from './helpers/r72HudBoards.ts';
import { Model, WINDOWS, gridPx, harnessPair, paintedBoxes } from './helpers/r74OmnisModel.ts';
import { WALKS, type Stop } from './helpers/r74OmnisWalk.ts';

const text = (rel: string): string => readFileSync(resolve(rel), 'utf8').replace(/\r\n/g, '\n');
const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });

afterEach(() => {
  document.body.replaceChildren();
});

// ---- m1 ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('m1: the flag is wider than plateWidth by its own skew, and plateWidth is right', () => {
  const SKEW_DEG = 12; // ffx-hud.css `.ffx-target__plate--below|above|right|left`: `skewX(var(--ig-skew, -12deg))`
  const tan = Math.tan((SKEW_DEG * Math.PI) / 180);
  const at100 = WINDOWS.filter((w) => w.ts === 1);
  const estimate = (viewW: number): number => plateWidth({ name: 'Seymour Omnis' }, true, viewW, 'PHYSICAL DAMAGE'); // `proHelpLine('Physical damage')`, the line the walk's Attack showed

  it('the skew is what the stylesheet says (the one number the arithmetic leans on): all four dock sides', () => {
    const css = text('src/ui/ffx/ffx-hud.css');
    const lines = css.split('\n').filter((l) => /^\.ffx-target__plate--(below|above|right|left) \{/.test(l));
    expect(lines).toHaveLength(4);
    for (const l of lines) expect(l, l).toContain('skewX(var(--ig-skew, -12deg))');
  });

  it('at every recorded window at TEXT SIZE 100 the bounding width minus plateWidth is the flag height times tan 12 degrees, to 1 px', () => {
    for (const w of at100) {
      const widths = new Set(WALKS[w.key]!.map((s) => s[3]));
      const heights = new Set(WALKS[w.key]!.map((s) => s[4]));
      expect(widths.size, `${w.key} one flag width`).toBe(1);
      expect(heights.size, `${w.key} one flag height`).toBe(1);
      const excess = [...widths][0]! * gridPx(w) - estimate(w.w);
      const shear = [...heights][0]! * gridPx(w) * tan;
      expect(Math.abs(excess - shear), `${w.key}: excess ${excess.toFixed(1)} px, shear ${shear.toFixed(1)} px`).toBeLessThan(1);
    }
    expect(at100).toHaveLength(8);
  });

  it('the excess the note first called an under-read ranges 15.6 to 21.9 px (5.5 to 7.8 grid px) and the shear 16.5 to 22.7 px: the same quantity', () => {
    const rows = at100.filter((w) => !w.key.includes('3440')).map((w) => ({ excess: WALKS[w.key]![0]![3] * gridPx(w) - estimate(w.w), shear: WALKS[w.key]![0]![4] * gridPx(w) * tan }));
    expect(Math.min(...rows.map((r) => r.excess))).toBeGreaterThan(15.5);
    expect(Math.max(...rows.map((r) => r.excess))).toBeLessThan(22);
    expect(Math.min(...rows.map((r) => r.shear))).toBeGreaterThan(16.4);
    expect(Math.max(...rows.map((r) => r.shear))).toBeLessThan(22.8);
  });

  it('the note and the module header name the skew, not an "under-read" estimate; the open question names plateBox as the root-cause lane and says plateWidth is right', () => {
    const note = text('docs/handoff/r74-omnis.md');
    const flagSteer = text('src/ui/ffx/flagSteer.ts');
    const header = flagSteer.slice(0, flagSteer.indexOf('import '));
    for (const [name, s] of [['note', note], ['header', header]] as const) {
      expect(s.match(/under-reads?|PLATE WIDTH ESTIMATE/), name).toBeNull();
      expect(s, name).toMatch(/skewX\(-12deg\)/);
    }
    const q = note.slice(note.indexOf('## 9. '), note.indexOf('## 10. '));
    expect(q).toMatch(/plateBox/);
    expect(q).toMatch(/plateWidth` is right/);
  });
});

// ---- m2 ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('m2: the Sensor steer\'s flag branch, the cases the first tests left unpinned', () => {
  const box = (left: number, top: number, right: number, bottom: number): GridBox => ({ left, top, right, bottom });
  const STAGE_W = 640;

  it('the figure\'s steer already clears the flag (the flag lies on the card\'s RESTING place only): the answer is the figure\'s, not a second steer against the pair', () => {
    const card = box(300, 79, 400, 157);
    const figure = box(280, 60, 330, 300);
    const flag = box(270, 79, 335, 120); // on the resting card (x 300..400), but the figure's steer leaves the card at x 336..436, one grid px clear
    expect(sensorSteerDx(card, figure, STAGE_W)).toBe(36);
    expect(sensorSteerDx(card, figure, STAGE_W, SENSOR_STAGE_MARGIN, flag), 'a flag the moved card already clears changes nothing (against the pair it would be 41)').toBe(36);
  });

  it('the figure\'s steer lands on the flag and the pair has room: the card goes against the pair; with no room on either side of the pair the figure\'s answer STANDS (not null)', () => {
    const card = box(110, 79, 210, 157);
    const figure = box(100, 60, 150, 300);
    const flag = box(190, 79, 277, 111); // on the card where the figure's steer leaves it (x 156..256)
    expect(sensorSteerDx(card, figure, 640)).toBe(46);
    expect(sensorSteerDx(card, figure, 640, SENSOR_STAGE_MARGIN, flag), 'against the pair: right of x 277').toBe(173);
    // a stage so narrow that the pair has no room (left of it the margin, right of it the edge) while the figure alone does
    expect(sensorSteerDx(card, figure, 380)).toBe(46);
    expect(sensorSteerDx(card, figure, 380, SENSOR_STAGE_MARGIN, flag), 'the figure\'s answer stands').toBe(46);
  });

  // ---- the wiring, through the real HUD (a source-text pin was all that held it) ----
  const K = 1.6; // the jsdom window is 1024 x 768: scale 1.6, the stage's origin at (-512, -288) viewport px (`r74-omnis-flag.test.ts`)
  const toViewport = (r: Rect): DOMRect => {
    const left = r.left * K - 512, top = r.top * K - 288, right = r.right * K - 512, bottom = r.bottom * K - 288;
    return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) } as DOMRect;
  };
  const place = (el: Element, grid: Rect | null): void => {
    (el as HTMLElement).getBoundingClientRect = (): DOMRect => toViewport(grid ?? R(0, 0, 0, 0));
  };
  const CARD = R(428, 79, 544, 157); // the F1 layout's Sensor card at its resting place (1600 x 900), read by the walk
  const FIGURE = R(372, 220, 480, 330); // a figure the card does not reach: only a flag can move it

  function mount(state: { f1: boolean; omnis: boolean }): { card: HTMLElement; plate: HTMLElement; aim: () => void; dx: () => string; cardBox: () => Rect } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    if (state.f1) hud.el.classList.add('hud-f1');
    if (state.omnis) hud.el.setAttribute('data-omnis-readout', '');
    hud.update(16);
    const fig = toViewport(FIGURE);
    const port: TargetingPort = { rect: () => ({ x: fig.left, y: fig.top, w: fig.width, h: fig.height }), select() {}, xray() {}, visibility: () => 1, setPanels() {} };
    hud.setTargetingPort(port);
    const card = (hud as unknown as { sensorPanel: { el: HTMLElement } }).sensorPanel.el;
    card.hidden = false;
    const dx = (): number => parseFloat(card.style.getPropertyValue('--ffx-sensor-dx')) || 0;
    card.getBoundingClientRect = (): DOMRect => toViewport(R(CARD.left + dx(), CARD.top, CARD.right + dx(), CARD.bottom)); // what a browser measures: the stylesheet translates the card by the property
    const plate = document.createElement('div');
    plate.className = FLAG_SELECTOR.slice(1);
    hud.el.append(plate);
    place(plate, null);
    const aim = (): void => (hud as unknown as { applySelection: (s: unknown) => void }).applySelection({ ids: ['seymour-flux'], mode: 'single', kind: 'enemy', activeId: 'seymour-flux' });
    return { card, plate, aim, dx: () => card.style.getPropertyValue('--ffx-sensor-dx'), cardBox: () => R(CARD.left + dx(), CARD.top, CARD.right + dx(), CARD.bottom) };
  }
  const FLAG_ON_CARD = R(470, 120, 560, 160);

  it('the real HUD, Chapter XII on the F1 HUD: a flag on the Sensor card sets the steer property, the card stands clear of the flag, and the property goes with the flag', () => {
    const m = mount({ f1: true, omnis: true });
    m.aim();
    expect(m.dx(), 'no flag: nothing to steer from').toBe('');
    place(m.plate, FLAG_ON_CARD);
    m.aim();
    expect(m.dx(), 'a flag on the card').not.toBe('');
    expect(hits(m.cardBox(), FLAG_ON_CARD), 'the card is clear of the flag').toBe(false);
    place(m.plate, null);
    m.aim();
    expect(m.dx(), 'the flag gone: the card comes home').toBe('');
  });

  it('outside the gate (the F1 HUD off, or the read-out not live) the flag is nobody\'s business: the card is not steered', () => {
    for (const s of [{ f1: false, omnis: true }, { f1: true, omnis: false }, { f1: false, omnis: false }]) {
      const m = mount(s);
      place(m.plate, FLAG_ON_CARD);
      m.aim();
      expect(m.dx(), JSON.stringify(s)).toBe('');
    }
  });
});

// ---- m3 ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('m3: ally and self flags: wherever a flag goes the steer leaves the advisor clear of it (the gate is the chapter and the F1 HUD, not the flag\'s kind)', () => {
  const win = WINDOWS.find((w) => w.key === '100@1600x900')!;
  const proto = WALKS[win.key]![0]!;
  const FLAG_W = 87;
  const FLAG_H = 32;
  const stopAt = (x: number, y: number): Stop => ['sweep', x, y, FLAG_W, FLAG_H, 0, 0, 0, 0, proto[9], proto[10], proto[11], proto[12], ''];

  it('800+ flag places on the 1600 board (a fine grid around the home card, a coarse one across the rest of the stage): 0 overlaps with the advisor, the card, its chip and the tip kept GAP clear wherever the steer acts, and the card where it was wherever the flag is not on it', () => {
    const home = new Model(win, false).step(stopAt(0, 0)).zone; // the flag-free placement is the same for every place
    const homeBoxes = paintedBoxes(home!);
    let places = 0;
    let onHome = 0;
    let tips = 0;
    let declines = 0;
    let nearest = Infinity;
    // the flag lies on the home card (x 203 to 300, y 83 to 162) from x 116 and y 51: a fine grid there, then 30 x 23 grid px over the whole stage
    const grid: Array<[number, number]> = [];
    for (let x = 108; x <= 304; x += 6) for (let y = 48; y <= 168; y += 6) grid.push([x, y]);
    for (let x = 0; x <= 640 - FLAG_W; x += 30) for (let y = 40; y <= 270; y += 23) grid.push([x, y]);
    for (const [x, y] of grid) {
      places++;
      const flag = R(x, y, x + FLAG_W, y + FLAG_H);
      const { zone, ink } = new Model(win, true).step(stopAt(x, y));
      if (!homeBoxes.some((b) => hits(b, flag))) {
        expect(zone, `(${x}, ${y}) the flag is not on the card: it stands`).toEqual(home);
        expect(ink, `(${x}, ${y}) nothing given to the solver`).toBe(false);
        continue;
      }
      onHome++;
      expect(ink, `(${x}, ${y}) the flag is on the card: the solver is given it`).toBe(true);
      if (!zone) {
        declines++;
        continue;
      }
      if (zone.kind === 'tip') tips++;
      for (const p of paintedBoxes(zone)) {
        expect(harnessPair(win, p, flag), `(${x}, ${y}) ${zone.kind} on the flag`).toBe(false);
        nearest = Math.min(nearest, apart(p, flag));
      }
    }
    expect(places).toBeGreaterThan(800);
    expect(onHome, `the sweep is not vacuous: the flag lay on the home card at many places (the card fell to the tip at ${tips} and was put away at ${declines}: the solver's own answers)`).toBeGreaterThan(100);
    expect(nearest, 'nearest approach where the steer acted').toBeGreaterThanOrEqual(GAP - 0.01);
  }, 180_000);

  it('the ally flag\'s own place: a flag docked beside a party member (x 440 to 600) never reaches the advisor, so the steer is silent there and the walk\'s card stands', () => {
    const home = new Model(win, false).step(stopAt(0, 0)).zone;
    for (const y of [60, 140, 220]) {
      const m = new Model(win, true);
      const { zone, ink } = m.step(stopAt(470, y));
      expect(ink).toBe(false);
      expect(zone).toEqual(home);
    }
  });
});
