// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { plateInputFromDom, TargetPlates, targetPlateText } from '../../src/ui/ffx2/TargetPlates.ts';
import {
  BAR_HINT_TOP,
  GAP,
  GRID_H,
  GRID_W,
  HINT_HEIGHT,
  RIGHT_EDGE,
  ROW_HEIGHT,
  hintBarDrop,
  hintPlacement,
  plateMode,
  plateRow,
  type GridRect,
  type PlacedPlate,
} from '../../src/ui/ffx2/targetPlateGeometry.ts';
import { menuOwnsCancel } from '../../src/ui/common/menuCancel.ts';
import type {
  AvailableCommand,
  BattleEvent,
  BattleResult,
  BattleState,
  Command,
  FFX2Combatant,
} from '../../src/battle/common/types.ts';

/**
 * PR-0150, the HUD half (critic round 10): the approved Targeting s3 tile
 * (`docs/concepts/targeting/b-ring-and-dim/s3.png`) draws a TARGET plate, an
 * actor/dressphere plate and an ENTER / arrows / ESC controls hint that the
 * FFX-2 build lacked. And a victory that lands under an open Active-ATB menu
 * left the command stack and the reticle standing in the victory shot.
 *
 * FFX-2 only (AGENTS.md rule 14): the tile is the FFX-2 frame, the FFX frames
 * draw none of the three, and only FFX-2's clock runs under an open menu.
 * jsdom does not lay out, so placement is asserted on the pure solver
 * (`targetPlateGeometry.ts`) and on real screens by the browser pass in
 * `docs/screenshots/pr0150-hud/`.
 */

function unit(id: string, name: string, side: 'party' | 'enemy', extra: Partial<FFX2Combatant> = {}): FFX2Combatant {
  return {
    id,
    name,
    side,
    spriteKey: id,
    stats: { hp: 1000, mp: 100, str: 10, def: 10, mag: 10, mdef: 10, agi: 10, luck: 10, eva: 10, acc: 10, maxHp: 1000, maxMp: 100 },
    hp: 1000,
    mp: 80,
    statuses: {},
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: side === 'party' ? 'player' : 'ai',
    alive: true,
    removed: false,
    slot: 0,
    flags: {},
    level: 10,
    atb: { ticks: 0, required: 16000, gauge: 0, charging: null, recovery: 0 },
    accessories: [],
    chainCount: 0,
    chainWindowTicks: 0,
    ...extra,
  } as FFX2Combatant;
}

function gunnerYuna(): FFX2Combatant {
  return unit('yuna', 'Yuna', 'party', {
    dresspheres: {
      current: 'gunner',
      owned: ['gunner'],
      garmentGrid: { id: 'g1', nodePosition: 0, passedGates: [], wornThisBattle: [] },
      abilitiesLearned: {},
    },
  });
}

function state(): BattleState {
  const yuna = gunnerYuna();
  const boss = unit('vegnagun-leg', 'Vegnagun', 'enemy', { flags: { isBoss: true } });
  const node = unit('node-a', 'Node A', 'enemy', { flags: { isPart: true, partOf: 'vegnagun-leg' } });
  return {
    game: 'ffx2',
    combatants: { yuna, 'vegnagun-leg': boss, 'node-a': node },
    activeIds: ['yuna'],
    reserveIds: [],
    enemyIds: ['vegnagun-leg', 'node-a'],
    aeonId: null,
    turn: 1,
    ticks: 0,
    log: [],
    nextSeq: 1,
    triggers: [],
    firedTriggerIds: [],
    result: null,
    seed: 1,
    flags: {},
  } as BattleState;
}

const ATTACK: AvailableCommand = {
  command: { kind: 'attack', targets: [] },
  label: 'Attack',
  category: 'attack',
  mpCost: 0,
  enabled: true,
  validTargets: ['vegnagun-leg', 'node-a'],
  targeting: 'single-enemy',
} as AvailableCommand;

const RESULT: BattleResult = { outcome: 'victory', turns: 3, elapsedTicks: 9000, elapsedMs: 3000, ap: 0, exp: 10, gil: 0 } as BattleResult;

function key(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
}

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

describe('what the plates say (targetPlateText)', () => {
  it('names the target from data, tags a part PART, and names the actor with her dressphere', () => {
    const s = state();
    const t = targetPlateText({ ids: ['node-a'], mode: 'single', kind: 'enemy', activeId: 'node-a' }, 2, s, 'yuna');
    expect(t.target).toEqual({ name: 'Node A', tag: 'PART' });
    expect(t.actor).toEqual({ name: 'Yuna', job: 'GUNNER' });
    expect(t.canStep).toBe(true);
    const boss = targetPlateText({ ids: ['vegnagun-leg'], mode: 'single', kind: 'enemy', activeId: 'vegnagun-leg' }, 2, s, 'yuna');
    expect(boss.target).toEqual({ name: 'Vegnagun', tag: null });
  });

  it('drops the change-target key when there is nothing to step to', () => {
    const s = state();
    expect(targetPlateText({ ids: ['vegnagun-leg'], mode: 'single', kind: 'enemy', activeId: 'vegnagun-leg' }, 1, s, 'yuna').canStep).toBe(false);
    const all = targetPlateText({ ids: ['vegnagun-leg', 'node-a'], mode: 'all', kind: 'enemy', activeId: null }, 2, s, 'yuna');
    expect(all.canStep).toBe(false);
    expect(all.target.name).toBe('All enemies');
  });
});

describe('the FFX-2 HUD during target select', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(state(), { elapsedMs: 0, bars: [] });
  });

  afterEach(() => {
    hud.unmount();
    root.remove();
  });

  const plate = (role: string): HTMLElement => root.querySelector<HTMLElement>(`[data-role="${role}"]`)!;
  // Up or down by the HUD's own say-so (`hidden`). Whether a plate that is up
  // found room (`ffx2-tplate--off`) needs a layout, which jsdom does not do.
  const shown = (el: HTMLElement): boolean => {
    for (let e: HTMLElement | null = el; e; e = e.parentElement) if (e.hidden) return false;
    return true;
  };

  function openToTarget(): Promise<Command> {
    const done = hud.chooseCommand('yuna', [ATTACK], () => ({ elapsedMs: 0, bars: [] }));
    key('Enter'); // Attack -> target select
    return done;
  }

  it('shows the three plates with real keys, follows the cursor, and takes them down on Esc', () => {
    void openToTarget();
    for (const role of ['target-plate', 'actor-plate', 'controls-hint']) expect(shown(plate(role))).toBe(true);
    expect(plate('actor-plate').textContent).toContain('Yuna');
    expect(plate('actor-plate').textContent).toContain('GUNNER');
    expect(plate('controls-hint').textContent).toMatch(/ENTER CONFIRM.*CHANGE TARGET.*ESC BACK/);
    const first = plate('target-plate').textContent;
    key('ArrowRight');
    const second = plate('target-plate').textContent;
    expect(new Set([first, second])).toEqual(new Set(['TARGETVegnagun', 'TARGETNode APART']));
    key('Escape');
    for (const role of ['target-plate', 'controls-hint']) expect(shown(plate(role))).toBe(false);
  });

  it('draws the plates above the reticle layer, so the petals never paint over them', () => {
    const layers = [...root.querySelector('.ffx2hud')!.children].map((c) => c.className);
    expect(layers.indexOf('ffx2hud__plates')).toBeGreaterThan(layers.indexOf('ffx2hud__overlay'));
    expect(root.querySelector('.ffx2hud__plates [data-role="target-plate"]')).not.toBeNull();
  });

  it('the plates layer is stacked at least as high as the reticle layer, not just later in the DOM', async () => {
    // `.ffx-targeting` carries a z-index, so DOM order alone lost: a petal painted
    // across the actor plate on a portrait phone (repair pass, chapter 4, 390x844).
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const z = (file: string[], selector: string): number => {
      const sheet = readFileSync(join(process.cwd(), 'src', 'ui', ...file), 'utf8');
      const at = sheet.indexOf(`\n${selector} {`);
      if (at < 0) return 0;
      const body = sheet.slice(at, sheet.indexOf('}', at));
      const m = /z-index:\s*(\d+)/.exec(body);
      return m ? Number(m[1]) : 0;
    };
    const reticle = z(['ffx', 'ffx-hud.css'], '.ffx-targeting');
    expect(reticle).toBeGreaterThan(0);
    expect(z(['ffx2', 'target-plates.css'], '.ffx2hud__plates')).toBeGreaterThanOrEqual(reticle);
  });

  it('a victory under an open menu closes the command stack, the reticle and the plates before the shot plays', () => {
    let resolved = false;
    void openToTarget().then(() => (resolved = true));
    expect(root.querySelector('.ffx-targeting')).not.toBeNull();
    expect(menuOwnsCancel()).toBe(true);
    const victory = { type: 'victory', seq: 99, result: RESULT } as BattleEvent;
    hud.onEvent(victory);
    const command = root.querySelector<HTMLElement>('.ffx2hud__command')!;
    expect(command.hidden).toBe(true);
    expect(command.innerHTML).toBe('');
    expect(root.querySelector('.ffx-targeting')).toBeNull();
    expect(shown(plate('target-plate'))).toBe(false);
    expect(root.querySelector<HTMLElement>('.ffx2-atbmode')!.hidden).toBe(true);
    // Esc belongs to the pause key again, and nothing was submitted for her.
    expect(menuOwnsCancel()).toBe(false);
    key('Enter');
    expect(resolved).toBe(false);
  });

  it('a decided state from sync does the same, for a defeat as much as a victory', () => {
    void openToTarget();
    const s = state();
    s.result = { ...RESULT, outcome: 'defeat' };
    hud.sync(s, { elapsedMs: 0, bars: [] });
    expect(root.querySelector<HTMLElement>('.ffx2hud__command')!.hidden).toBe(true);
    expect(root.querySelector('.ffx-targeting')).toBeNull();
    expect(shown(plate('controls-hint'))).toBe(false);
  });
});

describe('the plates keep the HUD type floor', () => {
  it('every font size in target-plates.css renders at 12 px or more at 1600x900 (scale 2.5)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const sheet = readFileSync(join(process.cwd(), 'src', 'ui', 'ffx2', 'target-plates.css'), 'utf8');
    const sizes = [...sheet.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length).toBeGreaterThan(0);
    for (const px of sizes) expect(px * 2.5).toBeGreaterThanOrEqual(12);
  });
});

describe('FFX never gets the plates (rule 14)', () => {
  it('a mounted FFX HUD has no TARGET plate, actor plate or controls hint', async () => {
    const { FFXBattleHud } = await import('../../src/ui/ffx/FFXBattleHud.ts');
    const root = document.createElement('div');
    document.body.append(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    expect(root.querySelector('.ffx2-tplate, .ffx2-aplate, .ffx2-ctlhint, .ffx2hud__plates')).toBeNull();
    hud.unmount();
    root.remove();
  });
});
