// @vitest-environment jsdom
/**
 * CHAPTER XII'S SENSOR CARD AGAINST THE TARGET FLAG IN THE OLD LOOKS (R72-1; driver decision 219r, 2026-11-03; FFX only, rule 14: Chapter XII is an FFX chapter and the card is FFX's; no FFX-2 HUD reaches it).
 *
 * R72-1 was read with the F1 HUD held: release 71's frame, the Sensor card at the foot of the turn order (top 135 grid px at TEXT SIZE 100), over the pro target flag at alternate stops of the cursor's walk. r74-omnis fixed it for
 * the F1 HUD (`flagSteer.omnisFlagRect`, gated on `hud-f1` AND the disc read-out's marker) and left the old looks open (r74-omnis section 9, question 1; r74.md section 7, question 9): TEXT SIZE 130 (Chapter XII steps down from
 * the F1 HUD above 115: `HudF1Switch.F1_TEXT_CEILING`), `?hud=today` and `?treated=pack`. The driver decided to apply the same steer there. Only the SENSOR CARD's steer is extended (`flagSteer.omnisSensorFlagRect`, gated on
 * the read-out's marker alone, and not on the upright phone); the advisor card, its ink and the dock's panels stay on the F1 gate. Pins:
 *
 * 1. the old looks ARE old looks, by the product's own switches: at TEXT SIZE 130, with `?hud=today`, and with `?treated=pack`, `hudF1On()` answers false for Chapter XII, and at 100 and 115 in the default look it answers true;
 * 2. the gate: the marker alone (F1 on or off) gives the flag; no marker (Chapter I, every other chapter) gives nothing in every look; the phone gives nothing; the advisor's `omnisFlagRect` is unchanged (F1 only);
 * 3. the real `FFXBattleHud`, in each old look: a flag on the Sensor card sets `--ffx-sensor-dx`, the card stands clear of the flag, the property goes with the flag; with the F1 HUD on it does what it always did; with no marker it is not
 *    steered at any size, and the advisor card is not touched in an old look;
 * 4. THE MODEL AT TEXT SIZE 130 (and at 100): the 290 recorded flag positions of r72's walks against the old look's Sensor card: the card lies on the flag at many stops without the steer and at none with it; at TEXT SIZE 100 and 115 in the
 *    default look (the F1 card) the steer is silent at every recorded stop, as before. The old look's card box is derived from the stylesheets (read here), and the model is the browser job OM-4's to confirm.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FLAG_SELECTOR, flagInkRects, omnisFlagPanelRects, omnisFlagRect, omnisReadoutOn, omnisSensorFlagRect } from '../../src/ui/ffx/flagSteer.ts';
import { STAGE, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';
import { sensorSteerDx } from '../../src/ui/ffx/sensorSteer.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { setHudF1Mode, hudF1On } from '../../src/ui/hudf1/HudF1Switch.ts';
import { setDemoChapter, setTreatedScope } from '../../src/engine/motion/DemoGate.ts';
import { WALKS } from './helpers/r74OmnisWalk.ts';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
const hits = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const OMNIS = 'seymour-omnis';

/** The look a player is in: TEXT SIZE, the address's `hud` word and the treated scope. */
interface Look { text: 100 | 115 | 130; hud?: 'today'; scope?: 'pack' }
const LOOKS: Record<string, Look> = {
  'default, TEXT SIZE 100 (the F1 HUD)': { text: 100 },
  'default, TEXT SIZE 115 (the F1 HUD)': { text: 115 },
  'TEXT SIZE 130 (above the ceiling)': { text: 130 },
  '?hud=today, TEXT SIZE 100': { text: 100, hud: 'today' },
  '?hud=today, TEXT SIZE 130': { text: 130, hud: 'today' },
  '?treated=pack, TEXT SIZE 100': { text: 100, scope: 'pack' },
  '?treated=pack, TEXT SIZE 130': { text: 130, scope: 'pack' },
};
/** Put the page in a look (what `applyComfort` and the address do) and say whether the F1 HUD plays there, by the product's own switch. */
function enter(look: Look): boolean {
  document.documentElement.dataset['textSize'] = String(look.text);
  document.documentElement.dataset['textSizeWide'] = String(look.text);
  setHudF1Mode(look.hud ?? 'f1');
  setTreatedScope(look.scope ?? 'all');
  setDemoChapter(OMNIS);
  return hudF1On();
}

beforeEach(() => {
  document.documentElement.removeAttribute('data-phone-battle');
});
afterEach(() => {
  document.body.replaceChildren();
  delete document.documentElement.dataset['textSize'];
  delete document.documentElement.dataset['textSizeWide'];
  document.documentElement.removeAttribute('data-phone-battle');
  setHudF1Mode(null);
  setTreatedScope(null);
  setDemoChapter(undefined);
});

describe('the old looks are old looks, by the product\'s own switches', () => {
  it('the F1 HUD plays in Chapter XII at TEXT SIZE 100 and 115 in the default look, and not at 130, with ?hud=today or with ?treated=pack', () => {
    const on = Object.fromEntries(Object.entries(LOOKS).map(([name, look]) => [name, enter(look)]));
    expect(on).toEqual({
      'default, TEXT SIZE 100 (the F1 HUD)': true,
      'default, TEXT SIZE 115 (the F1 HUD)': true,
      'TEXT SIZE 130 (above the ceiling)': false,
      '?hud=today, TEXT SIZE 100': false,
      '?hud=today, TEXT SIZE 130': false,
      '?treated=pack, TEXT SIZE 100': false,
      '?treated=pack, TEXT SIZE 130': false,
    });
  });
});

// ---- trees -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const K = 1.6; // the jsdom window is 1024 x 768: scale 1.6, the stage's origin at (-512, -288) viewport px (`r74-omnis-flag.test.ts`)
const toViewport = (r: Rect): DOMRect => {
  const left = r.left * K - 512, top = r.top * K - 288, right = r.right * K - 512, bottom = r.bottom * K - 288;
  return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) } as DOMRect;
};
const place = (el: Element, grid: Rect | null): void => {
  (el as HTMLElement).getBoundingClientRect = (): DOMRect => toViewport(grid ?? R(0, 0, 0, 0));
};
const gridOf = (el: HTMLElement | null): Rect | null => {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  if (b.width <= 0 || b.height <= 0) return null;
  return R((b.left + 512) / K, (b.top + 288) / K, (b.right + 512) / K, (b.bottom + 288) / K);
};
function tree(o: { f1: boolean; omnis: boolean }): { root: HTMLElement; flag: HTMLElement } {
  const root = document.createElement('div');
  root.className = o.f1 ? 'ffxhud hud-f1' : 'ffxhud';
  if (o.omnis) root.setAttribute('data-omnis-readout', '');
  const flag = document.createElement('div');
  flag.className = 'ffx-target__plate ffx-target__plate--enemy';
  root.append(flag);
  const card = document.createElement('div');
  card.setAttribute('data-role', 'move-advisor-card');
  root.append(card);
  document.body.append(root);
  place(card, R(203, 83, 300, 162));
  place(flag, R(295, 137, 382, 169));
  return { root, flag };
}

describe('the gate: the read-out\'s marker, in every layout, and not on the phone', () => {
  it('the marker alone gives the Sensor card the flag, with the F1 HUD on or off; the F1 class alone or neither gives nothing', () => {
    for (const [name, o] of Object.entries({ 'F1 on, marker': { f1: true, omnis: true }, 'F1 off, marker (an old look)': { f1: false, omnis: true } })) {
      const t = tree(o);
      expect(omnisReadoutOn(t.root), name).toBe(true);
      expect(omnisSensorFlagRect(t.root, gridOf), name).toEqual(R(295, 137, 382, 169));
    }
    for (const [name, o] of Object.entries({ 'F1 on, no marker (Chapter I and the others)': { f1: true, omnis: false }, 'F1 off, no marker': { f1: false, omnis: false } })) {
      const t = tree(o);
      expect(omnisReadoutOn(t.root), name).toBe(false);
      expect(omnisSensorFlagRect(t.root, gridOf), name).toBeNull();
    }
  });

  it('the upright phone gives nothing, whatever the layout: the marker with the phone attribute is no flag', () => {
    document.documentElement.setAttribute('data-phone-battle', '');
    for (const f1 of [true, false]) expect(omnisSensorFlagRect(tree({ f1, omnis: true }).root, gridOf), `f1 ${f1}`).toBeNull();
  });

  it('the advisor\'s side is unchanged: the flag for the advisor card, its ink and the dock\'s panels still wants the F1 HUD, so an old look gives them nothing', () => {
    const old = tree({ f1: false, omnis: true });
    expect(omnisFlagRect(old.root, gridOf)).toBeNull();
    expect(flagInkRects(old.root, gridOf)).toEqual([]);
    expect(omnisFlagPanelRects(old.root)).toEqual([]);
    const f1 = tree({ f1: true, omnis: true });
    expect(omnisFlagRect(f1.root, gridOf)).toEqual(R(295, 137, 382, 169)); // and with the F1 HUD on it is what it was
    expect(FLAG_SELECTOR).toBe('.ffx-target__plate');
  });
});

// ---- the real HUD -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
describe('the real FFXBattleHud: the Sensor card steps off a flag that lies on it, in each look', () => {
  const FIGURE = R(372, 220, 480, 330); // a figure the card does not reach: only a flag can move it
  /** The Sensor card's resting box in a look, in grid px: the F1 layout's (read by the walk at 1600 x 900), release 71's at TEXT SIZE 100 (R72-1: 98 x 79 at top 135, left 436), and at TEXT SIZE 130 (the model below). */
  const OLD_100 = R(436, 135, 534, 214);
  const OLD_130 = oldCard130();
  const HOME: Record<string, Rect> = { f1: R(428, 79, 544, 157), old100: OLD_100, old130: OLD_130 };

  function mount(state: { f1: boolean; omnis: boolean }, home: Rect): { aim: () => void; flag: HTMLElement; dx: () => string; cardBox: () => Rect; card: HTMLElement } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    if (state.f1) hud.el.classList.add('hud-f1');
    if (state.omnis) hud.el.setAttribute('data-omnis-readout', '');
    hud.update(16);
    const fig = toViewport(FIGURE);
    hud.setTargetingPort({ rect: () => ({ x: fig.left, y: fig.top, w: fig.width, h: fig.height }), select() {}, xray() {}, visibility: () => 1, setPanels() {} });
    const card = (hud as unknown as { sensorPanel: { el: HTMLElement } }).sensorPanel.el;
    card.hidden = false;
    const dx = (): number => parseFloat(card.style.getPropertyValue('--ffx-sensor-dx')) || 0;
    card.getBoundingClientRect = (): DOMRect => toViewport(R(home.left + dx(), home.top, home.right + dx(), home.bottom)); // what a browser measures: the stylesheet moves the card by the property
    const flag = document.createElement('div');
    flag.className = FLAG_SELECTOR.slice(1);
    hud.el.append(flag);
    place(flag, null);
    const aim = (): void => (hud as unknown as { applySelection: (s: unknown) => void }).applySelection({ ids: ['seymour-flux'], mode: 'single', kind: 'enemy', activeId: 'seymour-flux' });
    return { aim, flag, card, dx: () => card.style.getPropertyValue('--ffx-sensor-dx'), cardBox: () => R(home.left + dx(), home.top, home.right + dx(), home.bottom) };
  }

  // a flag on the card in each layout: the recorded overlap of the first walk (1600 x 900, stop 3: x 295.1, y 137.4, 87.1 x 31.8) lands on the old 130 card; for the others the flag is put on the card's own box
  const onCard = (home: Rect): Rect => R(home.left + 10, home.top + 8, home.left + 97, home.top + 40);

  it('each old look: a flag on the card sets the steer property, the card stands clear of the flag, and the card comes home when the flag goes', () => {
    for (const [name, look] of Object.entries(LOOKS)) {
      const f1 = enter(look);
      if (f1) continue; // the F1 looks are the next case
      const home = look.text === 130 ? HOME['old130']! : HOME['old100']!;
      const m = mount({ f1: false, omnis: true }, home);
      m.aim();
      expect(m.dx(), `${name}: no flag, nothing to steer from`).toBe('');
      const flag = onCard(home);
      place(m.flag, flag);
      m.aim();
      expect(m.dx(), `${name}: a flag on the card`).not.toBe('');
      expect(hits(m.cardBox(), flag), `${name}: the card is clear of the flag`).toBe(false);
      place(m.flag, null);
      m.aim();
      expect(m.dx(), `${name}: the flag gone, the card comes home`).toBe('');
    }
  });

  it('the F1 looks (TEXT SIZE 100 and 115, default): what r74-omnis built, unchanged', () => {
    for (const [name, look] of Object.entries(LOOKS)) {
      if (!enter(look)) continue;
      const m = mount({ f1: true, omnis: true }, HOME['f1']!);
      const flag = onCard(HOME['f1']!);
      place(m.flag, flag);
      m.aim();
      expect(m.dx(), name).not.toBe('');
      expect(hits(m.cardBox(), flag), name).toBe(false);
    }
  });

  it('no read-out marker (Chapter I, every other chapter): the card is not steered by a flag in ANY look, at any size', () => {
    for (const [name, look] of Object.entries(LOOKS)) {
      const f1 = enter(look);
      const home = f1 ? HOME['f1']! : look.text === 130 ? HOME['old130']! : HOME['old100']!;
      const m = mount({ f1, omnis: false }, home);
      place(m.flag, onCard(home));
      m.aim();
      expect(m.dx(), name).toBe('');
    }
  });

  it('the upright phone: a flag on the card steers nothing, in an old look or the F1 HUD', () => {
    document.documentElement.setAttribute('data-phone-battle', '');
    for (const f1 of [false, true]) {
      const home = f1 ? HOME['f1']! : HOME['old100']!;
      const m = mount({ f1, omnis: true }, home);
      place(m.flag, onCard(home));
      m.aim();
      expect(m.dx(), `f1 ${f1}`).toBe('');
    }
  });
});

// ---- the model at TEXT SIZE 130 ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
/**
 * The Sensor card's box at TEXT SIZE 130 in an old look, in grid px, from the stylesheets: `.ffx-sensor` stands at left 436, top 166 + the read-out's lift (R72-1 read top 135, 98 x 79 at TEXT SIZE 100); at 130 `text-size.css` scales it
 * by `--pyr-ts` (1.3) about its right-bottom corner and then translates it (-34, -56). A model, not a read: the browser job OM-4 reads the real card.
 */
function oldCard130(): Rect {
  const b = R(436, 135, 534, 214);
  const w = (b.right - b.left) * 1.3;
  const h = (b.bottom - b.top) * 1.3;
  return R(b.right - w - 34, b.bottom - h - 56, b.right - 34, b.bottom - 56);
}

describe('the model: the 290 recorded flag positions against the old looks\' Sensor card', () => {
  const css = readFileSync(resolve('src/ui/common/text-size.css'), 'utf8').replace(/\r\n/g, '\n');
  const FIGURE_FAR = { left: 372, right: 480, top: 220, bottom: 330 };
  const flags = Object.values(WALKS).flatMap((rows) => rows.map((s) => R(s[1], s[2], s[1] + s[3], s[2] + s[4])));

  it('the arithmetic\'s inputs are the stylesheets\': at 130 the card scales about its right-bottom corner and translates (-34, -56); --pyr-ts is 1.3 at 130', () => {
    expect(css).toMatch(/html\[data-text-size\]:not\(\[data-text-size='100'\]\):not\(\[data-phone-battle\]\) \.ffxhud__stage > \.ffx-sensor \{\s*scale: var\(--pyr-ts\);\s*transform-origin: right bottom;/);
    expect(css).toMatch(/html\[data-text-size='130'\]:not\(\[data-phone-battle\]\) \.ffxhud__stage > \.ffx-sensor \{\s*translate: -34px -56px;/);
    expect(readFileSync(resolve('src/ui/ffx/ffx-hud.css'), 'utf8')).toMatch(/left: calc\(436px \+ var\(--ffx-sensor-dx, 0px\)/);
    const card = oldCard130();
    expect([card.left, card.top, card.right, card.bottom].map((v) => Math.round(v * 10) / 10)).toEqual([372.6, 55.3, 500, 158]);
  });

  for (const [name, home] of [['TEXT SIZE 100 (release 71\'s card, R72-1)', R(436, 135, 534, 214)], ['TEXT SIZE 130', oldCard130()]] as const) {
    it(`${name}: the card lies on the flag at stops of the walk without the steer, and at none with it`, () => {
      expect(flags).toHaveLength(290);
      const over = (dx: number | null, flag: Rect): boolean => hits(R(home.left + (dx ?? 0), home.top, home.right + (dx ?? 0), home.bottom), flag);
      const without = flags.filter((f) => over(null, f)).length;
      const withSteer = flags.filter((f) => over(sensorSteerDx(home, FIGURE_FAR, STAGE.width, undefined, f), f)).length;
      expect(without, 'the overlap R72-1 filed exists in the model').toBeGreaterThan(50);
      expect(withSteer, '0 overlaps with the steer').toBe(0);
      // the same arithmetic with no flag is the old function: the figure half answers null (the card does not reach this figure)
      expect(sensorSteerDx(home, FIGURE_FAR, STAGE.width, undefined, null)).toBeNull();
    });
  }

  it('the F1 looks (TEXT SIZE 100 and 115, default): the recorded Sensor boxes are never on the flag, so the steer stays silent at every recorded stop, as before', () => {
    let stops = 0;
    for (const rows of Object.values(WALKS)) {
      for (const s of rows) {
        stops++;
        const card = { left: s[9], right: s[9] + s[11], top: s[10], bottom: s[10] + s[12] };
        expect(sensorSteerDx(card, FIGURE_FAR, STAGE.width, undefined, { left: s[1], right: s[1] + s[3], top: s[2], bottom: s[2] + s[4] }), s[0]).toBeNull();
      }
    }
    expect(stops).toBe(290);
  });

  it('the wiring is one in-place line in the HUD (the file did not grow), and no stylesheet was touched', () => {
    const hud = readFileSync(resolve('src/ui/ffx/FFXBattleHud.ts'), 'utf8').replace(/\r\n/g, '\n');
    expect(hud).toContain('sensorSteerDx(home, figure, STAGE.width, undefined, omnisSensorFlagRect(this.el, (e) => this.stageRect(e)))');
    expect(hud).not.toMatch(/sensorSteerDx\([^)]*omnisFlagRect/);
    expect((hud.match(/\n/g) ?? []).length).toBeLessThanOrEqual(1811);
    expect((readFileSync(resolve('src/ui/ffx/flagSteer.ts'), 'utf8').match(/\n/g) ?? []).length).toBeLessThan(400);
  });
});

