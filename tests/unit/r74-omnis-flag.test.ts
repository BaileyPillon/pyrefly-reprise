// @vitest-environment jsdom
/**
 * THE TARGET FLAG AND THE ADVISOR IN CHAPTER XII, THE REAL CODE (lane r74-omnis, 2026-11-02; FFX ONLY, rule 14: the gate is the F1 HUD AND the disc read-out's marker, so Chapter I, every other chapter, the F1 HUD off and the phone move by not one pixel).
 *
 * `r74-omnis-walk.test.ts` runs the recorded cursor walks through the steer; this file pins the pieces it is made of, on small trees and on the real `FFXBattleHud` (jsdom: nothing is laid out, so the boxes a browser would measure are supplied through
 * `getBoundingClientRect` in the stage's grid px, as `r72-hud-wiring.test.ts` does):
 *  - `flagSteer.ts` on trees: the gate, "only once the flag lies on the advisor", the held box and its margin, the release when the flag goes, one box per HUD;
 *  - the two builders the HUD calls hand the flag to the solver (ink for the designed card, `keepOff` for the tip);
 *  - the real HUD: a card the flag lies on steps clear (or falls to the tip or is put away), a card it does not touch stays, the card comes home when the flag goes, and Chapter I, the F1 HUD off and the other chapters are untouched;
 *  - the Sensor card steers clear of the flag too (`sensorSteerDx`, `flag`), and the flag docks off the Enemy Intent line (`omnisFlagPanelRects`, `FFXBattleHud.applySelection`);
 *  - the source: `FFXBattleHud.ts` did not grow.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FLAG_PAD, FLAG_SELECTOR, flagInkRects, omnisF1On, omnisFlagPanelRects, omnisFlagRect } from '../../src/ui/ffx/flagSteer.ts';
import { advisorInkRects, advisorKeepOffRects } from '../../src/ui/ffx/hudAvoidSelectors.ts';
import { ADVISOR_CHIP_RESERVE, GAP, STAGE, type AdvisorZone, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';
import { SENSOR_STAGE_MARGIN, sensorSteerDx } from '../../src/ui/ffx/sensorSteer.ts';
import { dockPlate } from '../../src/ui/ffx/targetCursorParts.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { apart, badge, bar } from './helpers/r72HudBoards.ts';
import { WALKS } from './helpers/r74OmnisWalk.ts';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });

afterEach(() => {
  document.body.replaceChildren();
});

/** The window the HUD is laid out in under jsdom: 1024 x 768, so scale 1.6 and the stage's origin at (-512, -288) viewport px (`ui-ffx-advisor-tip.test.ts`). */
const K = 1.6;
const toViewport = (r: Rect): DOMRect => {
  const left = r.left * K - 512, top = r.top * K - 288, right = r.right * K - 512, bottom = r.bottom * K - 288;
  return { left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top, toJSON: () => ({}) } as DOMRect;
};
const place = (el: Element, grid: Rect | null): void => {
  (el as HTMLElement).getBoundingClientRect = (): DOMRect => toViewport(grid ?? R(0, 0, 0, 0));
};
/** The grid rect a placed element measures as (the HUD's `stageRect` and this file's `rectOf` read the same box). */
const gridOf = (el: HTMLElement | null): Rect | null => {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  if (b.width <= 0 || b.height <= 0) return null;
  const g = (v: number): number => Math.round(v * 1e6) / 1e6;
  return R(g((b.left + 512) / K), g((b.top + 288) / K), g((b.right + 512) / K), g((b.bottom + 288) / K));
};

interface Tree { root: HTMLElement; card: HTMLElement; chip: HTMLElement; flag: HTMLElement; intent: HTMLElement }
function tree(o: { f1?: boolean; omnis?: boolean } = {}): Tree {
  const root = document.createElement('div');
  root.className = o.f1 === false ? 'ffxhud' : 'ffxhud hud-f1';
  if (o.omnis !== false) root.setAttribute('data-omnis-readout', '');
  const mk = (cls: string, role?: string): HTMLElement => {
    const e = document.createElement('div');
    e.className = cls;
    if (role) e.setAttribute('data-role', role);
    root.append(e);
    return e;
  };
  const t = { root, card: mk('mad__card', 'move-advisor-card'), chip: mk('mad__toggle', 'move-advisor-toggle'), flag: mk('ffx-target__plate ffx-target__plate--enemy'), intent: mk('ffx-omr__intent') };
  document.body.append(root);
  place(t.card, R(203, 83, 300, 162));
  place(t.chip, R(203, 69, 259, 80));
  place(t.flag, null);
  return t;
}
const FAR = R(360, 168, 447, 200); // the flag docked low and right: nowhere near the card
const ON_CARD = R(295, 137, 382, 169); // the first recorded overlap at 1600 x 900 (stop 3): the flag's left edge 5.3 grid px onto the card's right
const rect = (e: HTMLElement | null): Rect | null => gridOf(e);

describe('the gate: Chapter XII on the F1 HUD, and nothing else', () => {
  it('the F1 HUD with the disc read-out live is the gate; the marker alone, the F1 class alone or neither is not', () => {
    expect(omnisF1On(tree().root)).toBe(true);
    expect(omnisF1On(tree({ f1: false }).root)).toBe(false); // ?hud=today, ?treated=pack, TEXT SIZE 130, the phone
    expect(omnisF1On(tree({ omnis: false }).root)).toBe(false); // Chapter I, every other chapter
    expect(omnisF1On(tree({ f1: false, omnis: false }).root)).toBe(false);
  });

  it('outside the gate a flag lying squarely on the card gives the solver nothing, asks for no panel and reads as no flag', () => {
    for (const o of [{ f1: false }, { omnis: false }, { f1: false, omnis: false }]) {
      const t = tree(o);
      place(t.flag, ON_CARD);
      expect(omnisFlagRect(t.root, rect), JSON.stringify(o)).toBeNull();
      expect(flagInkRects(t.root, rect), JSON.stringify(o)).toEqual([]);
      expect(advisorInkRects(t.root, [], rect), JSON.stringify(o)).toEqual([]);
      expect(advisorKeepOffRects(t.root, rect), JSON.stringify(o)).toEqual([]);
      place(t.intent, R(429, 203, 622, 245)); // the line, up: the chapter's own panel is ink to the card as it always was, but it is no business of the flag's dock outside the gate
      expect(omnisFlagPanelRects(t.root), JSON.stringify(o)).toEqual([]);
    }
  });
});

describe('only once the flag lies on the advisor, then held while the flag is up', () => {
  it('no flag up, or a flag that touches neither the card nor the chip: no box', () => {
    const t = tree();
    expect(flagInkRects(t.root, rect)).toEqual([]);
    place(t.flag, FAR);
    expect(omnisFlagRect(t.root, rect)).toEqual(FAR);
    expect(flagInkRects(t.root, rect)).toEqual([]);
    expect(advisorKeepOffRects(t.root, rect)).toEqual([]);
  });

  it('a flag on the card: one box, the flag grown by FLAG_PAD each way and snapped outwards, in the ink and in keepOff', () => {
    const t = tree();
    place(t.flag, R(295.3, 137.4, 382.4, 169.2));
    const ink = flagInkRects(t.root, rect);
    expect(ink).toEqual([R(291, 133, 387, 174)]); // 295.3 - 4 -> 291, 137.4 - 4 -> 133, 382.4 + 4 -> 387, 169.2 + 4 -> 174
    expect(FLAG_PAD).toBe(4);
    expect(advisorInkRects(t.root, [], rect)).toContainEqual(ink[0]);
    expect(advisorKeepOffRects(t.root, rect)).toContainEqual(ink[0]);
  });

  it('a flag on the chip alone latches too, and the builders agree within a frame (asking twice is the same answer)', () => {
    const t = tree();
    place(t.flag, R(230, 66, 290, 76));
    const a = flagInkRects(t.root, rect);
    expect(a).toHaveLength(1);
    expect(flagInkRects(t.root, rect)).toEqual(a);
    expect(advisorKeepOffRects(t.root, rect)).toEqual(a);
  });

  it('once latched it holds the box while the flag stays inside it, and replaces it when the flag leaves (even a flag that no longer touches the card)', () => {
    const t = tree();
    place(t.flag, ON_CARD);
    const first = flagInkRects(t.root, rect)[0]!;
    place(t.flag, R(298.2, 138.5, 385.3, 170.3)); // the next stops' drift: 3 grid px right and 1 down, inside the 4 px margin
    expect(flagInkRects(t.root, rect)).toEqual([first]);
    place(t.flag, R(303.3, 139.8, 390.4, 171.6)); // 8.2 px right of where it landed: out of the box
    const second = flagInkRects(t.root, rect)[0]!;
    expect(second).not.toEqual(first);
    expect(second.left).toBeLessThanOrEqual(303.3 - FLAG_PAD);
    place(t.flag, FAR); // docked somewhere else altogether: the box follows the flag, not the card
    const third = flagInkRects(t.root, rect)[0]!;
    expect(third.left).toBeLessThanOrEqual(FAR.left);
    expect(third.right).toBeGreaterThanOrEqual(FAR.right);
  });

  it('the flag going away lets go of the box, and a flag that comes up again must lie on the advisor again to be given', () => {
    const t = tree();
    place(t.flag, ON_CARD);
    expect(flagInkRects(t.root, rect)).toHaveLength(1);
    place(t.flag, null); // the cursor closes
    expect(flagInkRects(t.root, rect)).toEqual([]);
    place(t.flag, FAR);
    expect(flagInkRects(t.root, rect)).toEqual([]);
    place(t.flag, ON_CARD);
    expect(flagInkRects(t.root, rect)).toHaveLength(1);
  });

  it('a hidden card (the solver put it away) has no box to lie on; two HUDs keep two boxes', () => {
    const a = tree();
    const b = tree();
    place(a.card, null);
    place(a.chip, null);
    place(a.flag, ON_CARD);
    expect(flagInkRects(a.root, rect)).toEqual([]);
    place(b.flag, ON_CARD);
    expect(flagInkRects(b.root, rect)).toHaveLength(1);
    expect(flagInkRects(a.root, rect)).toEqual([]);
  });

  it('the flag is found by its class and the first one measured with a size is the flag (a stale zero-size plate is skipped)', () => {
    const t = tree();
    expect(FLAG_SELECTOR).toBe('.ffx-target__plate');
    const stale = document.createElement('div');
    stale.className = 'ffx-target__plate';
    place(stale, null);
    t.root.prepend(stale);
    place(t.flag, FAR);
    expect(omnisFlagRect(t.root, rect)).toEqual(FAR);
  });
});

describe('the Enemy Intent line is a panel the flag docks off (Chapter XII on the F1 HUD)', () => {
  it('the panel list holds the visible intent line in viewport px, and nothing for a hidden one', () => {
    const t = tree();
    place(t.intent, R(429, 203, 622, 245));
    const [p, ...more] = omnisFlagPanelRects(t.root);
    expect(more).toEqual([]);
    expect([p!.x, p!.y, p!.w, p!.h].map((v) => Math.round(v * 100) / 100)).toEqual([429 * K - 512, 203 * K - 288, (622 - 429) * K, (245 - 203) * K].map((v) => Math.round(v * 100) / 100));
    place(t.intent, null);
    expect(omnisFlagPanelRects(t.root)).toEqual([]);
  });

  it('REPRODUCES the walk\'s one stop over the line (1280 x 720, stop 16: the flag\'s foot 204.3 against the line\'s top 203) and answers it: with the line a panel the dock leaves the side that lands on it', () => {
    const stop = WALKS['100@1280x720']![16]!;
    expect(stop[13]).toBe('omrintentxtplate');
    expect(stop[2] + stop[4], 'the recorded foot of the flag, grid px').toBeCloseTo(204.3, 1);
    // 1280 x 720: 2 px per grid px. The glove's box, the plate the dock estimates (the recorded size, 217 x 77 px) and the line (429..622 x 203..245 grid).
    const glove = { x: 745, y: 320, w: 50, h: 30 };
    const line = { x: 858, y: 406, w: 386, h: 84 };
    expect(dockPlate(glove, 217, 78, []).side, 'no panel: the dock\'s first choice, under the glove').toBe('below');
    const side = dockPlate(glove, 217, 78, [line]);
    expect(side.side, 'with the line a panel').not.toBe('below');
    const plateX = side.side === 'above' ? side.x - 108.5 : side.side === 'right' ? side.x + 6 : side.x - 217 - 6;
    const plateY = side.side === 'above' ? side.y - 78 - 6 : side.y - 39;
    const overlap = Math.max(0, Math.min(plateX + 217, line.x + line.w) - Math.max(plateX, line.x)) * Math.max(0, Math.min(plateY + 78, line.y + line.h) - Math.max(plateY, line.y));
    expect(overlap, 'the plate on the line').toBe(0);
  });
});

/** An open sky (no party in the way): the designed card stands at x 213 to 439, y 95 to 199, its chip above it (`r72-hud-wiring.test.ts`). */
function mountHud(state: { f1: boolean; omnis: boolean }): { hud: FFXBattleHud; plate: HTMLElement; cardEl: HTMLElement; zone: () => AdvisorZone | null; box: () => Rect } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  if (state.f1) hud.el.classList.add('hud-f1');
  if (state.omnis) hud.el.setAttribute('data-omnis-readout', '');
  hud.update(16);
  const cardEl = hud.el.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
  const plate = document.createElement('div');
  plate.className = FLAG_SELECTOR.slice(1);
  hud.el.append(plate);
  place(plate, null);
  const cardBox = (z: AdvisorZone): Rect => R(z.left - 9, STAGE.height - z.bottom - z.maxHeight - ADVISOR_CHIP_RESERVE, z.left + z.width + 9, STAGE.height - z.bottom);
  const standing = (): void => {
    const z = hud.advisorPlacement;
    place(cardEl, z ? cardBox(z) : null); // what a browser would measure: the card where the HUD put it
  };
  standing();
  return {
    hud,
    plate,
    cardEl,
    zone: () => {
      hud.update(16);
      const z = hud.advisorPlacement;
      standing();
      return z;
    },
    box: () => {
      const z = hud.advisorPlacement!;
      return z.kind === 'tip' ? R(Math.min(bar(z).left, badge(z).left), bar(z).top, bar(z).right, bar(z).bottom) : cardBox(z);
    },
  };
}

describe('the real HUD, Chapter XII on the F1 HUD: the card steps off a flag that lies on it and comes home when the flag goes', () => {
  it('the control: with no flag the card stands in the open sky (a designed card, not the tip)', () => {
    const m = mountHud({ f1: true, omnis: true });
    expect(m.zone()?.kind).not.toBe('tip');
    expect(m.zone()).not.toBeNull();
  });

  it('a flag on the card: the placement changes, the card (or the tip it falls to) stands clear of the flag by GAP, and with the flag gone it is exactly where it was', () => {
    const m = mountHud({ f1: true, omnis: true });
    const home = m.zone()!;
    const homeBox = m.box();
    const flag = R(homeBox.right - 12, homeBox.top + 20, homeBox.right + 80, homeBox.top + 52); // 12 grid px onto the card's right edge
    place(m.plate, flag);
    const steered = m.zone();
    expect(steered).not.toEqual(home);
    if (steered) expect(apart(m.box(), flag), `${steered.kind} against the flag`).toBeGreaterThanOrEqual(GAP - 0.01);
    place(m.plate, null);
    expect(m.zone()).toEqual(home);
  });

  it('a flag that does not touch the card changes nothing, and neither does one drifting a few grid px while the card holds still', () => {
    const m = mountHud({ f1: true, omnis: true });
    const home = m.zone()!;
    place(m.plate, R(520, 150, 610, 190));
    expect(m.zone()).toBe(home); // the held placement: the same object, not a re-solve to the same answer
    const homeBox = m.box();
    place(m.plate, R(homeBox.right - 6, homeBox.top + 20, homeBox.right + 80, homeBox.top + 52));
    const first = m.zone();
    place(m.plate, R(homeBox.right - 3, homeBox.top + 22, homeBox.right + 83, homeBox.top + 54)); // 3 px of drift, inside the held box
    expect(m.zone()).toBe(first);
  });

  it('the F1 HUD off, or the read-out not live (Chapter I, every other chapter): a flag on the card is not the HUD\'s business and the card stays', () => {
    for (const s of [{ f1: false, omnis: true }, { f1: true, omnis: false }, { f1: false, omnis: false }]) {
      const m = mountHud(s);
      const home = m.zone()!;
      const b = m.box();
      place(m.plate, R(b.right - 12, b.top + 20, b.right + 80, b.top + 52));
      expect(m.zone(), JSON.stringify(s)).toBe(home);
    }
  });
});

describe('the HUD hands the dock its panels: the Enemy Intent line in Chapter XII on the F1 HUD, nothing more anywhere else', () => {
  type Selector = (sel: { ids: string[]; mode: 'single'; kind: 'enemy'; activeId: string }) => void;
  const aim = (s: { f1: boolean; omnis: boolean }): { panels: Array<{ x: number; y: number; w: number; h: number }> } => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    if (s.f1) hud.el.classList.add('hud-f1');
    if (s.omnis) hud.el.setAttribute('data-omnis-readout', '');
    const intent = document.createElement('div');
    intent.className = 'ffx-omr__intent';
    hud.el.append(intent);
    place(intent, R(429, 203, 622, 245));
    const menu = (hud as unknown as { commandMenu: { setPanels: (p: unknown[]) => void } }).commandMenu;
    const spy = vi.spyOn(menu, 'setPanels');
    (hud as unknown as { applySelection: Selector }).applySelection({ ids: ['seymour-flux'], mode: 'single', kind: 'enemy', activeId: 'seymour-flux' });
    const last = spy.mock.calls.at(-1)![0] as Array<{ x: number; y: number; w: number; h: number }>;
    return { panels: last };
  };
  const line = { x: 429 * K - 512, y: 203 * K - 288, w: 193 * K, h: 42 * K };

  it('Chapter XII on the F1 HUD: the line is among the panels the flag docks off', () => {
    const { panels } = aim({ f1: true, omnis: true });
    expect(panels.some((p) => Math.abs(p.x - line.x) < 0.01 && Math.abs(p.y - line.y) < 0.01 && Math.abs(p.w - line.w) < 0.01 && Math.abs(p.h - line.h) < 0.01)).toBe(true);
  });

  it('the F1 HUD off, or no read-out: the panels are the ones the dock always had (the line is not among them)', () => {
    for (const s of [{ f1: false, omnis: true }, { f1: true, omnis: false }, { f1: false, omnis: false }]) {
      const { panels } = aim(s);
      expect(panels.some((p) => Math.abs(p.x - line.x) < 0.01 && Math.abs(p.y - line.y) < 0.01), JSON.stringify(s)).toBe(false);
    }
  });
});

describe('the Sensor card steers clear of the flag as well as the figure (Chapter XII on the F1 HUD: `flag`)', () => {
  /** The F1 layout's Sensor card at its resting place: x 428 to 544, top 79, 78 tall (1600 x 900), read by the walk. */
  const CARD = { left: 428, right: 544, top: 79, bottom: 157 };
  const FIGURE_FAR = { left: 372, right: 480, top: 220, bottom: 330 }; // a figure the card does not reach
  const W = STAGE.width;
  const moved = (dx: number | null): typeof CARD => ({ left: CARD.left + (dx ?? 0), right: CARD.right + (dx ?? 0), top: CARD.top, bottom: CARD.bottom });
  const clear = (a: typeof CARD, f: { left: number; right: number; top: number; bottom: number }): boolean => a.right <= f.left || a.left >= f.right || a.bottom <= f.top || a.top >= f.bottom;

  it('no flag: the answer is exactly what it always was (the existing tests pin the figure half)', () => {
    expect(sensorSteerDx(CARD, FIGURE_FAR, W)).toBeNull();
    expect(sensorSteerDx(CARD, FIGURE_FAR, W, SENSOR_STAGE_MARGIN, null)).toBeNull();
    const pagoda = { left: 420, right: 500, top: 60, bottom: 300 };
    expect(sensorSteerDx(CARD, pagoda, W, SENSOR_STAGE_MARGIN, null)).toBe(sensorSteerDx(CARD, pagoda, W));
  });

  it('a flag the card does not touch, or one the figure\'s steer leaves it clear of: the figure\'s answer stands', () => {
    expect(sensorSteerDx(CARD, FIGURE_FAR, W, undefined, { left: 291, right: 380, top: 137, bottom: 170 })).toBeNull();
    expect(sensorSteerDx(CARD, FIGURE_FAR, W, undefined, { left: 520, right: 600, top: 200, bottom: 240 })).toBeNull(); // under the card
  });

  it('a flag on the card that the figure would not move: the card steps off the flag, to the side with room, inside the stage', () => {
    const flag = { left: 470, right: 560, top: 120, bottom: 160 };
    const dx = sensorSteerDx(CARD, FIGURE_FAR, W, undefined, flag);
    expect(dx).not.toBeNull();
    expect(clear(moved(dx), flag), 'clear of the flag').toBe(true);
    expect(CARD.left + dx!).toBeGreaterThanOrEqual(SENSOR_STAGE_MARGIN);
    expect(CARD.right + dx!).toBeLessThanOrEqual(W - SENSOR_STAGE_MARGIN);
  });

  it('the figure\'s steer would land on the flag: the card is steered against the two together', () => {
    const figure = { left: 420, right: 500, top: 100, bottom: 230 }; // the card is on it: the figure alone sends it right of x 500 (dx +78)
    const flag = { left: 506, right: 600, top: 120, bottom: 160 }; // ... which is where the flag docks
    const alone = sensorSteerDx(CARD, figure, W)!;
    expect(clear(moved(alone), flag), 'the figure-only answer lands on the flag').toBe(false);
    const dx = sensorSteerDx(CARD, figure, W, undefined, flag)!;
    expect(dx).not.toBeNull();
    expect(clear(moved(dx), flag), 'clear of the flag').toBe(true);
    expect(clear(moved(dx), figure), 'clear of the figure').toBe(true);
  });

  it('neither side of the two together has room: the figure\'s answer stands (the card is never shoved off the stage)', () => {
    const figure = { left: 60, right: 300, top: 100, bottom: 230 };
    const flag = { left: 306, right: 630, top: 120, bottom: 160 };
    expect(sensorSteerDx(CARD, figure, W, undefined, flag)).toBe(sensorSteerDx(CARD, figure, W));
  });

  it('REPLAYS the 290 recorded stops: the Sensor card (open or folded) and the flag are never on each other, so the flag half is silent at every one of them', () => {
    let stops = 0;
    for (const rows of Object.values(WALKS)) {
      for (const s of rows) {
        stops++;
        const card = { left: s[9], right: s[9] + s[11], top: s[10], bottom: s[10] + s[12] };
        const flag = { left: s[1], right: s[1] + s[3], top: s[2], bottom: s[2] + s[4] };
        expect(sensorSteerDx(card, FIGURE_FAR, W, undefined, flag), s[0]).toBeNull();
      }
    }
    expect(stops).toBe(290);
  });
});

describe('FFXBattleHud.ts passes the flag and the panels by two in-place lines, and did not grow', () => {
  const src = readFileSync(resolve('src/ui/ffx/FFXBattleHud.ts'), 'utf8');

  it('the dock gets omnisFlagPanelRects(this.el) between the phone strip and the party faces; steerSensor gets omnisSensorFlagRect(this.el, ...) as its flag (R72-1, 219r: the old looks too)', () => {
    expect(src).toContain('...intentStrip, ...omnisFlagPanelRects(this.el), ...partyFaceRects(');
    expect(src).toContain('sensorSteerDx(home, figure, STAGE.width, undefined, omnisSensorFlagRect(this.el, (e) => this.stageRect(e)))');
  });

  it('the two builders are still called as r72-hud wrote them (the flag rides inside them), and the file is over 400 lines and must not grow', () => {
    expect(src).toContain('const inkRects = advisorInkRects(this.el, this.zanmato.obstacleEls(), (e) => this.stageRect(e));');
    expect(src).toContain('keepOff: advisorKeepOffRects(this.el, (e) => this.stageRect(e)),');
    expect((src.match(/\n/g) ?? []).length).toBeLessThanOrEqual(1811);
  });

  it('flagSteer.ts is a small module under the house limit, and the sheets were not touched (no stylesheet names the flag\'s steer)', () => {
    expect((readFileSync(resolve('src/ui/ffx/flagSteer.ts'), 'utf8').match(/\n/g) ?? []).length).toBeLessThan(400);
    const sheet = readFileSync(resolve('src/ui/hudf1/hudf1-chapters.css'), 'utf8');
    expect(sheet).not.toMatch(/r74/);
  });
});
