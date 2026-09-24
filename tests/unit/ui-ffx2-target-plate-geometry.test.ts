// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { plateInputFromDom, TargetPlates } from '../../src/ui/ffx2/TargetPlates.ts';
import {
  BAR_HINT_TOP,
  GAP,
  GRID_H,
  GRID_W,
  HINT_HEIGHT,
  LEFT_EDGE,
  MIN_TARGET_W,
  RIGHT_EDGE,
  ROW_HEIGHT,
  hintBarDrop,
  hintPlacement,
  plateMode,
  plateRow,
  type GridRect,
  type PlacedPlate,
} from '../../src/ui/ffx2/targetPlateGeometry.ts';

/**
 * PR-0150, the HUD half: where the approved Targeting s3 tile's TARGET plate,
 * actor plate and controls hint go on the 640x360 grid
 * (`targetPlateGeometry.ts`), kept clear of the chip, the command window, the
 * telegraph, the help band (D-040), the party column and the field cursor's
 * own name plates and group label. FFX-2 only (AGENTS.md rule 14). The HUD
 * wiring, the text and the victory close are in `ui-ffx2-target-plates.test.ts`.
 */
const overlaps = (a: GridRect, b: GridRect): boolean =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const box = (p: PlacedPlate, h = ROW_HEIGHT): GridRect => ({ left: p.left, top: p.top, right: p.left + p.width, bottom: p.top + h });

/** The Active/Wait chip's authored box (`ffx2-hud.css`: left 21.33, top 22, 17 high, ~116 wide at 1600x900). */
const CHIP: GridRect = { left: 21.33, top: 22, right: 135, bottom: 39 };
/** The help band (D-040): grid rows 0 to 17.33. */
const BAND_BOTTOM = 17.33;
/** The boss strip's top (`--x2-enemies-top`). */
const STRIP_TOP = 41;
/** The four-row command window as measured at 1600x900 (1246,351 324x258 -> grid). */
const COMMAND: GridRect = { left: 498.4, top: 140.4, right: 628, bottom: 243.6 };

describe('the s3 plates on the 640x360 grid (targetPlateGeometry)', () => {
  it('puts the actor plate top right and the TARGET plate top centre, on the chip row, as the tile does', () => {
    const g = plateRow({ chip: CHIP, command: COMMAND, telegraph: null, bandBottom: BAND_BOTTOM, targetW: 100, actorW: 96 });
    expect(g.actor).not.toBeNull();
    expect(g.target).not.toBeNull();
    expect(g.actor!.left + g.actor!.width).toBeCloseTo(RIGHT_EDGE);
    expect(g.target!.left + g.target!.width / 2).toBeCloseTo(320);
    for (const p of [g.actor!, g.target!]) {
      expect(p.top).toBeGreaterThanOrEqual(BAND_BOTTOM + GAP); // under the help band
      expect(p.top + ROW_HEIGHT).toBeLessThanOrEqual(STRIP_TOP); // above the boss strip
      expect(overlaps(box(p), CHIP)).toBe(false);
      expect(overlaps(box(p), COMMAND)).toBe(false);
    }
    expect(overlaps(box(g.actor!), box(g.target!))).toBe(false);
  });

  it('moves the actor plate left of a submenu tall enough to reach the top row', () => {
    const tall: GridRect = { left: 498.4, top: 23.56, right: 628, bottom: 243.6 }; // max-height 220
    const g = plateRow({ chip: CHIP, command: tall, telegraph: null, bandBottom: BAND_BOTTOM, targetW: 100, actorW: 96 });
    expect(g.actor).not.toBeNull();
    expect(overlaps(box(g.actor!), tall)).toBe(false);
    expect(g.actor!.left + g.actor!.width).toBeLessThanOrEqual(tall.left - GAP + 1e-9);
    expect(overlaps(box(g.target!), box(g.actor!))).toBe(false);
  });

  it('steps out of the telegraph banner instead of drawing over it', () => {
    const banner: GridRect = { left: 420, top: 17.78, right: 618.67, bottom: 48 };
    const g = plateRow({ chip: CHIP, command: COMMAND, telegraph: banner, bandBottom: BAND_BOTTOM, targetW: 100, actorW: 96 });
    for (const p of [g.actor, g.target]) if (p) expect(overlaps(box(p), banner)).toBe(false);
  });

  it('hides a plate with no free room rather than covering anything', () => {
    const wall: GridRect = { left: 140, top: 0, right: 640, bottom: 60 };
    const g = plateRow({ chip: CHIP, command: wall, telegraph: null, bandBottom: BAND_BOTTOM, targetW: 100, actorW: 96 });
    for (const p of [g.actor, g.target]) if (p) expect(overlaps(box(p), wall)).toBe(false);
  });

  it('keeps the controls hint bottom centre, under the advisor card and left of the party column', () => {
    const partyLeft = 455;
    const h = hintPlacement({ width: 180, partyLeft })!;
    expect(h.left + h.width).toBeLessThanOrEqual(partyLeft - GAP);
    expect(h.top).toBeGreaterThanOrEqual(GRID_H - 26); // the advisor card's base (`ADVISOR_BOTTOM`)
    expect(h.top + 12).toBeLessThanOrEqual(GRID_H);
    const narrow = hintPlacement({ width: 600, partyLeft })!;
    expect(narrow.left + narrow.width).toBeLessThanOrEqual(partyLeft - GAP);
  });

  it('moves into the letterbox bars on a portrait phone, at 11 px text or more, and stays on the grid elsewhere', () => {
    const phone = plateMode({ scale: 390 / 640, stageY: (844 - 360 * (390 / 640)) / 2 });
    expect(phone.mode).toBe('bar');
    expect(5 * (390 / 640) * phone.zoom).toBeGreaterThanOrEqual(11 - 1e-9);
    for (const [w, h] of [[1280, 720], [1600, 900], [2000, 1012]] as const) {
      const scale = Math.min(w / 640, h / 360);
      expect(plateMode({ scale, stageY: (h - 360 * scale) / 2 }).mode).toBe('stage');
    }
  });
});

/**
 * Verifier finding on 21154c36: in chapter 6 at 390x844 the field cursor's own
 * name plate (`.ffx-target__plate`, docked under Dr. Goon, who stands low on
 * the stage) reached into the bar under the stage and covered the middle of
 * the controls hint ("ENTER CONFI ... ANGE TARGET", 101x18 px). The measured
 * boxes below are that frame's, converted to the grid (scale 390/640, stage
 * top 312.19 px).
 */
describe('the controls hint never sits under a field name plate', () => {
  const PHONE_SCALE = 390 / 640;
  const PHONE_Y = (844 - 360 * PHONE_SCALE) / 2;
  const g = (top: number, bottom: number, left: number, right: number): GridRect => ({
    left: left / PHONE_SCALE,
    right: right / PHONE_SCALE,
    top: (top - PHONE_Y) / PHONE_SCALE,
    bottom: (bottom - PHONE_Y) / PHONE_SCALE,
  });
  /** "Dr. Goon" docked below the figure: viewport 106..204 x 545..575. */
  const DR_GOON = g(545, 575, 106, 204);
  const VIEW_BOTTOM = (844 - PHONE_Y) / PHONE_SCALE;
  /** The bar hint's box at 390x844: 26 px high. */
  const HINT_H = 26 / PHONE_SCALE;
  const hintAt = (drop: number): GridRect => ({ left: 0, right: GRID_W, top: BAR_HINT_TOP + drop, bottom: BAR_HINT_TOP + drop + HINT_H });

  it('drops the bar hint under Dr. Goon\'s plate on a portrait phone (chapter 6, 390x844)', () => {
    expect(overlaps(hintAt(0), DR_GOON)).toBe(true); // the refuted frame
    const drop = hintBarDrop({ height: HINT_H, viewBottom: VIEW_BOTTOM, field: [DR_GOON] });
    expect(drop).not.toBeNull();
    expect(overlaps(hintAt(drop!), DR_GOON)).toBe(false);
    expect(BAR_HINT_TOP + drop! + HINT_H).toBeLessThanOrEqual(VIEW_BOTTOM);
    // Still right under the plate, not flung to the bottom of the screen.
    expect(BAR_HINT_TOP + drop!).toBeCloseTo(DR_GOON.bottom + GAP);
  });

  it('stays put when nothing reaches into the bar, and clears two stacked plates', () => {
    expect(hintBarDrop({ height: HINT_H, viewBottom: VIEW_BOTTOM, field: [] })).toBe(0);
    const high: GridRect = { left: 100, right: 200, top: 300, bottom: 350 }; // on the stage, above the bar
    expect(hintBarDrop({ height: HINT_H, viewBottom: VIEW_BOTTOM, field: [high] })).toBe(0);
    const lower: GridRect = { left: 300, right: 420, top: DR_GOON.bottom + 10, bottom: DR_GOON.bottom + 40 };
    const drop = hintBarDrop({ height: HINT_H, viewBottom: VIEW_BOTTOM, field: [lower, DR_GOON] })!;
    for (const f of [DR_GOON, lower]) expect(overlaps(hintAt(drop), f)).toBe(false);
  });

  it('hides the bar hint rather than cover a plate when the bar runs out', () => {
    expect(hintBarDrop({ height: HINT_H, viewBottom: DR_GOON.bottom + 10, field: [DR_GOON] })).toBeNull();
  });

  it('slides the on-stage hint off a field plate on its row, or hides it with no clear spot', () => {
    const row = GRID_H - 3 - HINT_HEIGHT;
    const plate: GridRect = { left: 250, right: 330, top: row - 5, bottom: row + 8 };
    const h = hintPlacement({ width: 180, partyLeft: 455, field: [plate] })!;
    expect(h).not.toBeNull();
    expect(overlaps(box(h, HINT_HEIGHT), plate)).toBe(false);
    expect(h.left + h.width).toBeLessThanOrEqual(455 - GAP + 1e-9);
    const wide: GridRect = { left: 0, right: 640, top: row, bottom: row + 4 };
    expect(hintPlacement({ width: 180, partyLeft: 455, field: [wide] })).toBeNull();
    // A plate off the hint's row changes nothing.
    const above: GridRect = { left: 250, right: 330, top: 200, bottom: 230 };
    expect(hintPlacement({ width: 180, partyLeft: 455, field: [above] })).toEqual(hintPlacement({ width: 180, partyLeft: 455 }));
  });

  it('reads the field cursor\'s name plates off the overlay, on the grid', () => {
    const overlay = document.createElement('div');
    const fieldPlate = document.createElement('div');
    fieldPlate.className = 'ffx-target__plate ffx-target__plate--enemy ffx-target__plate--below';
    fieldPlate.getBoundingClientRect = () => ({ left: 106, right: 204, top: 545, bottom: 575, width: 98, height: 30, x: 106, y: 545, toJSON: () => ({}) }) as DOMRect;
    overlay.append(fieldPlate);
    const host = { left: 0, top: 0, right: 390, bottom: 844, width: 390, height: 844, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
    const input = plateInputFromDom({
      host, stageX: 0, stageY: PHONE_Y, scale: PHONE_SCALE,
      chip: null, command: null, telegraph: null, band: null, bandGridHeight: 17.33, partyFence: null, overlay,
    });
    expect(input.field).toHaveLength(1);
    expect(input.field[0]!.top).toBeCloseTo(DR_GOON.top);
    expect(input.field[0]!.bottom).toBeCloseTo(DR_GOON.bottom);
    expect(input.viewBottom).toBeCloseTo(VIEW_BOTTOM);
  });

  it('TargetPlates.layout pushes the bar hint down past the plate, keeps it there while the cursor steps, and resets it next time', () => {
    const stage = document.createElement('div');
    const plates = new TargetPlates();
    plates.mount(stage);
    plates.show({ target: { name: 'Dr. Goon', tag: null }, actor: { name: 'Yuna', job: 'GUNNER' }, canStep: true });
    Object.defineProperty(plates.hint, 'offsetHeight', { configurable: true, get: () => 26 / PHONE_SCALE / 1.4 });
    const base = {
      scale: PHONE_SCALE, stageY: PHONE_Y, chip: null, command: null, telegraph: null,
      bandBottom: 0, bandBarHeight: 30, partyLeft: 455, viewBottom: VIEW_BOTTOM,
    };
    plates.layout({ ...base, field: [DR_GOON] });
    expect(plates.hint.classList.contains('ffx2-ctlhint--bar')).toBe(true);
    const drop = parseFloat(plates.hint.style.getPropertyValue('--tp-drop'));
    expect(drop).toBeGreaterThan(0);
    expect(plates.hint.classList.contains('ffx2-tplate--off')).toBe(false);
    // The cursor steps to a target whose plate is higher (Ormi): the hint stays settled, it does not hop.
    plates.layout({ ...base, field: [] });
    expect(parseFloat(plates.hint.style.getPropertyValue('--tp-drop'))).toBeCloseTo(drop);
    // A new target select starts from the top of the bar again.
    plates.hide();
    plates.show({ target: { name: 'Ormi', tag: null }, actor: { name: 'Yuna', job: 'GUNNER' }, canStep: true });
    plates.layout({ ...base, field: [] });
    expect(parseFloat(plates.hint.style.getPropertyValue('--tp-drop'))).toBe(0);
    plates.layout({ ...base, field: [DR_GOON], viewBottom: DR_GOON.bottom + 5 });
    expect(plates.hint.classList.contains('ffx2-tplate--off')).toBe(true);
    plates.unmount();
  });
});

/**
 * Verifier finding on 863a5076: a whole-side command (Rikku's Darkness and
 * Demi in chapter 4; Darkness, Demi, Bio and Black Sky in chapter 5) hangs the
 * field cursor's "ALL ENEMIES" label (`.ffx-target__all`) over the top of the
 * formation, on the plates' own row, and the TARGET plate cut it in half
 * (104x25 px at 1280x720, up to 152x17 px at 1600x900). `plateRow` never saw
 * the field rects; now it steps both top plates off them.
 */
describe('the top plates never sit over the field cursor\'s group label or name plates', () => {
  /** The label as hung over a centred formation: ~160x30 px at 1280x720 (scale 2), on the chip row. */
  const ALL_CENTRED: GridRect = { left: 280, top: 16, right: 360, bottom: 31 };
  const base = { chip: CHIP, command: COMMAND, telegraph: null, bandBottom: BAND_BOTTOM, targetW: 110, actorW: 96 };

  it('steps the TARGET plate off an ALL ENEMIES label centred on its row, keeping everything else clear', () => {
    const before = plateRow(base);
    expect(overlaps(box(before.target!), ALL_CENTRED)).toBe(true); // the refuted frame
    const g = plateRow({ ...base, field: [ALL_CENTRED] });
    expect(g.target).not.toBeNull();
    expect(g.actor).not.toBeNull();
    for (const p of [g.target!, g.actor!]) {
      expect(overlaps(box(p), ALL_CENTRED)).toBe(false);
      expect(overlaps(box(p), CHIP)).toBe(false);
      expect(overlaps(box(p), COMMAND)).toBe(false);
      expect(p.top).toBeGreaterThanOrEqual(BAND_BOTTOM + GAP);
      expect(p.top + ROW_HEIGHT).toBeLessThanOrEqual(STRIP_TOP);
      expect(p.left).toBeGreaterThanOrEqual(LEFT_EDGE - 1e-9);
      expect(p.left + p.width).toBeLessThanOrEqual(RIGHT_EDGE + 1e-9);
    }
    expect(overlaps(box(g.target!), box(g.actor!))).toBe(false);
    // At its natural width, and as near the centre as the label allows.
    expect(g.target!.width).toBe(110);
    const gapToLabel = Math.min(Math.abs(g.target!.left + g.target!.width - (ALL_CENTRED.left - GAP)), Math.abs(g.target!.left - (ALL_CENTRED.right + GAP)));
    expect(gapToLabel).toBeLessThan(1e-9);
  });

  it('leaves the TARGET plate centred when the label sits clear of the centre', () => {
    const off: GridRect = { left: 390, top: 20, right: 460, bottom: 35 };
    const g = plateRow({ ...base, field: [off] });
    expect(g.target!.left + g.target!.width / 2).toBeCloseTo(320);
    expect(overlaps(box(g.target!), off)).toBe(false);
  });

  it('moves the actor plate out of the corner when a label or name plate lands there', () => {
    const corner: GridRect = { left: 520, top: 18, right: 600, bottom: 34 };
    const g = plateRow({ ...base, field: [corner] });
    if (g.actor) expect(overlaps(box(g.actor), corner)).toBe(false);
    if (g.target) expect(overlaps(box(g.target), corner)).toBe(false);
  });

  it('keeps the actor plate on screen left of the label when a tall submenu already holds the corner (chapter 5, 2000x1012)', () => {
    // Black Sky's 13-row Skill list reaches the top row; the label hangs left of it, as measured.
    const tall: GridRect = { left: 498.4, top: 23.56, right: 628, bottom: 243.6 };
    const label: GridRect = { left: 410, top: 33, right: 463, bottom: 46 };
    const g = plateRow({ ...base, command: tall, field: [label] });
    expect(g.actor).not.toBeNull();
    expect(g.target).not.toBeNull();
    for (const p of [g.actor!, g.target!]) {
      for (const o of [label, tall, CHIP]) expect(overlaps(box(p), o)).toBe(false);
    }
    expect(overlaps(box(g.actor!), box(g.target!))).toBe(false);
    expect(g.actor!.left + g.actor!.width).toBeCloseTo(label.left - GAP);
  });

  it('shrinks the TARGET plate into the widest clear span, and hides it when none is wide enough', () => {
    const left: GridRect = { left: 150, top: 20, right: 230, bottom: 35 };
    const right: GridRect = { left: 330, top: 20, right: 420, bottom: 35 };
    const g = plateRow({ ...base, targetW: 200, field: [left, right] });
    expect(g.target).not.toBeNull();
    expect(g.target!.width).toBeGreaterThanOrEqual(MIN_TARGET_W);
    for (const f of [left, right]) expect(overlaps(box(g.target!), f)).toBe(false);
    const wide: GridRect = { left: 140, top: 25, right: 500, bottom: 32 };
    const none = plateRow({ ...base, field: [wide] });
    if (none.target) expect(overlaps(box(none.target), wide)).toBe(false);
    if (none.actor) expect(overlaps(box(none.actor), wide)).toBe(false);
  });

  it('a label off the plates\' row changes nothing', () => {
    const low: GridRect = { left: 280, top: 60, right: 360, bottom: 75 };
    expect(plateRow({ ...base, field: [low] })).toEqual(plateRow(base));
  });

  it('TargetPlates.layout hands the field rects to the top row, not only to the hint', () => {
    const stage = document.createElement('div');
    const plates = new TargetPlates();
    plates.mount(stage);
    plates.show({ target: { name: 'All enemies', tag: null }, actor: { name: 'Rikku', job: 'BLACK MAGE' }, canStep: false });
    // jsdom does not lay out: give the plates their measured widths.
    for (const [el, w] of [[plates.target, 108], [plates.actor, 94], [plates.hint, 150]] as const) {
      Object.defineProperty(el, 'offsetWidth', { configurable: true, get: () => w });
    }
    plates.show({ target: { name: 'All enemies', tag: null }, actor: { name: 'Rikku', job: 'BLACK MAGE' }, canStep: false });
    plates.layout({
      scale: 2, stageY: 0, chip: CHIP, command: COMMAND, telegraph: null,
      bandBottom: BAND_BOTTOM, bandBarHeight: 0, partyLeft: 455, field: [ALL_CENTRED], viewBottom: GRID_H,
    });
    expect(plates.target.classList.contains('ffx2-tplate--off')).toBe(false);
    const left = parseFloat(plates.target.style.left);
    const width = parseFloat(plates.target.style.width);
    const top = parseFloat(plates.target.style.top);
    expect(overlaps({ left, top, right: left + width, bottom: top + ROW_HEIGHT }, ALL_CENTRED)).toBe(false);
    plates.unmount();
  });
});
