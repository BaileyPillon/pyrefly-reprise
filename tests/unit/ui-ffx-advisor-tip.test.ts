// @vitest-environment jsdom
/**
 * The advisor card's last resort, the one-row tip (`src/ui/ffx/advisorTip.ts`; r3942-giants-ffx, FFX only).
 *
 * ## The regression this file pins
 *
 * Bailey's giants (2026-10-08) filled Chapters I and III, and `advisorZone`'s three passes found no clear box on either frame at any desktop shape: the card and its `N` chip were gone on
 * every capture the independent check took (16 of 16), and nothing in the unit suite could say so, because every test there asserts arithmetic on boards somebody wrote down. The boards below are
 * not written down by hand: each is the solver's input as the FFX HUD built it in a headless Chromium (real GPU, seed 1, the first command menu, the Sensor card up as a player has it), read off
 * `FFXBattleHud` (`stageRect`, `partySpriteRects`, `enemySpriteRects`, `topChipEls`) at 1600x900, 1440x900, 1024x768 and 1280x720, on this branch's code before the tip existed. They are the boards on
 * which the designed card has nowhere to go: the strategy guide holds the top left, the fight holds the sky the card stood in on live, and what is clear is a band along the top (or, in Chapter III
 * at 16:10 and 4:3, the deck under the party) 22 to 40 grid px tall.
 *
 * What the tip must do on them: be there (`advisorZone(board, false, true)` is a zone, kind `tip`), clear of every panel, fighter and key chip by the same clearances as the designed card, and be
 * what the page solved (the measured left and bottom of each board's tip are pinned from the browser run). What it must not do: appear while the enemy-move read-out takes the band (the caller
 * passes `tip` off), move a board the designed passes serve, or invent ground on a screen with none.
 *
 * Two things the page taught after the first version, both pinned below: the bar must **stay where it is** (it stands on the top row of the stage whenever that row holds the whole bar, whatever the
 * command stack, a submenu or the party's step is doing, so it does not jump between decisions), and it must read the fighters **where the camera's shot comes to rest** (for the first seconds of a
 * decision the camera is still gliding and a fighter's live painted box stands 25 to 30 grid px over the top row, which the first version took for a wall and stood in the bottom right for the whole decision).
 *
 * Browser truth is `tests/e2e/advisor-present.spec.ts` (every FFX chapter at three shapes, and the next decision of the two tip chapters).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the FFX HUD's solver; FFX-2's HUD places its card by its own lane and never takes it down.
 */

import { afterEach, describe, expect, it } from 'vitest';
import type { AdvisorView, MoveSuggestion } from '../../src/engine/tactics/advisor.ts';
import { MAX_DENSITY, MoveAdvisor } from '../../src/ui/common/MoveAdvisor.ts';
import { advisorZone as withTip } from '../../src/ui/ffx/advisorStrip.ts';
import { TIP_BADGE, TIP_HEIGHT, TIP_MIN_WIDTH, tipZone } from '../../src/ui/ffx/advisorTip.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { advisorZone, GAP, obstaclesOf, SKEW, STAGE, type AdvisorZoneInput, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });

/** The solver's input as the HUD built it, in grid px (the 640x360 stage). `cmdInfo` is the HUD's own reserved slot, not a measurement. */
const CHROME = { cmdInfo: R(24, 121, 196, 154), partyStatus: R(402, 258, 617, 348), intent: null } as const;

/** [board, the tip's `left` and `bottom` as the page solved them: `FFXBattleHud.advisorPlacement`; the top row of the stage in all but Chapter III at 1024x768, where the top is 144 wide and the deck is not] */
const BOARDS: Record<string, { input: AdvisorZoneInput; left: number; bottom: number }> = {
  'I 1600x900': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 44, 154, 115), sensor: R(406, 165, 526, 255), intentChip: R(552, 36, 620, 52), ctb: R(547, 49, 621, 201),
      sprites: [R(224, 208, 328, 328), R(328, 212, 420, 316), R(260, 156, 372, 284)], // tidus, yuna, kimahri
      enemies: [R(356, 4, 544, 220), R(228, 52, 404, 192)], // seymour-flux, mortiorchis
      keepOff: [R(20, 33, 80, 44), R(79, 33, 130, 44), R(7, 7, 47, 17)],
    },
    left: 82.9,
    bottom: 333,
  },
  'I 1440x900': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 44, 154, 115), sensor: R(401, 152, 520, 242), intentChip: R(544, 36, 620, 52), ctb: R(541, 49, 621, 201),
      sprites: [R(216, 208, 328, 340), R(324, 216, 424, 324), R(252, 152, 368, 288)], // tidus, yuna, kimahri
      enemies: [R(336, -8, 540, 224), R(196, 40, 384, 192)], // seymour-flux, mortiorchis
      keepOff: [R(20, 33, 84, 44), R(83, 33, 137, 44), R(8, -12, 52, -1)],
    },
    left: 35.9,
    bottom: 333,
  },
  'I 1024x768': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 43, 154, 115), sensor: R(376, 158, 498, 259), intentChip: R(520, 36, 620, 56), ctb: R(519, 49, 621, 207),
      sprites: [R(208, 216, 336, 360), R(336, 220, 444, 348), R(252, 148, 388, 308)], // tidus, yuna, kimahri
      enemies: [R(372, -40, 608, 232), R(212, 16, 432, 196)], // seymour-flux, mortiorchis
      keepOff: [R(19, 33, 104, 48), R(103, 33, 173, 48), R(12, -49, 72, -33)],
    },
    left: 35.9,
    bottom: 333,
  },
  'I 1280x720': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 44, 154, 115), sensor: R(391, 153, 514, 256), intentChip: R(536, 36, 620, 52), ctb: R(534, 49, 621, 201),
      sprites: [R(200, 208, 300, 324), R(300, 212, 388, 312), R(236, 156, 344, 280)], // tidus, yuna, kimahri
      enemies: [R(328, 8, 512, 220), R(204, 56, 372, 192)], // seymour-flux, mortiorchis
      keepOff: [R(20, 33, 90, 45), R(89, 33, 148, 45), R(9, 9, 58, 21)],
    },
    left: 93.9,
    bottom: 333,
  },
  'III 1600x900': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 44, 154, 115), sensor: null, intentChip: R(552, 36, 620, 52), ctb: R(547, 49, 621, 201),
      sprites: [R(192, 144, 320, 292), R(320, 160, 432, 288), R(232, 152, 336, 268)], // tidus, yuna, auron
      enemies: [R(312, 8, 540, 240), R(196, 52, 332, 208), R(408, 44, 552, 208)], // braskas-final-aeon, yu-pagoda-left, yu-pagoda-right
      keepOff: [R(20, 33, 80, 44), R(79, 33, 130, 44), R(7, 7, 47, 17)],
    },
    left: 82.9,
    bottom: 333,
  },
  'III 1440x900': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 44, 154, 115), sensor: null, intentChip: R(544, 36, 620, 52), ctb: R(541, 49, 621, 201),
      sprites: [R(180, 128, 320, 288), R(320, 140, 444, 284), R(224, 132, 336, 264)], // tidus, yuna, auron
      enemies: [R(312, -24, 564, 232), R(180, 20, 336, 196), R(420, 16, 576, 196)], // braskas-final-aeon, yu-pagoda-left, yu-pagoda-right
      keepOff: [R(20, 33, 84, 44), R(83, 33, 137, 44), R(8, -12, 52, -1)],
    },
    left: 35.9,
    bottom: 333,
  },
  'III 1024x768': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 43, 154, 115), sensor: null, intentChip: R(520, 36, 620, 56), ctb: R(519, 49, 621, 204),
      sprites: [R(152, 116, 320, 308), R(320, 136, 468, 304), R(204, 124, 340, 280)], // tidus, yuna, auron
      enemies: [R(312, -64, 612, 244), R(156, -8, 336, 200), R(440, -20, 628, 200)], // braskas-final-aeon, yu-pagoda-left, yu-pagoda-right
      keepOff: [R(19, 33, 104, 48), R(103, 33, 173, 48), R(12, -49, 72, -33)],
    },
    left: 253.9,
    bottom: 26,
  },
  'III 1280x720': {
    input: {
      ...CHROME,
      cmdArea: R(30, 177, 218, 335), guide: R(21, 44, 154, 115), sensor: null, intentChip: R(536, 36, 620, 52), ctb: R(534, 49, 621, 201),
      sprites: [R(192, 144, 320, 292), R(320, 160, 432, 288), R(232, 152, 336, 268)], // tidus, yuna, auron
      enemies: [R(312, 8, 540, 240), R(196, 52, 332, 208), R(408, 44, 552, 208)], // braskas-final-aeon, yu-pagoda-left, yu-pagoda-right
      keepOff: [R(20, 33, 90, 45), R(89, 33, 148, 45), R(9, 9, 58, 21)],
    },
    left: 93.9,
    bottom: 333,
  },
};

const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** The tip as it is painted: the badge, the bar and the skew's reach either side, on the stage. */
function painted(z: { left: number; width: number; bottom: number; maxHeight: number }): Rect {
  const reach = (SKEW * z.maxHeight) / 2;
  return R(z.left - TIP_BADGE - reach, STAGE.height - z.bottom - z.maxHeight, z.left + z.width + reach, STAGE.height - z.bottom);
}

describe('the boards: Chapters I and III at four desktop shapes, as the page measured them', () => {
  for (const [name, { input, left, bottom }] of Object.entries(BOARDS)) {
    it(`${name}: the designed card has nowhere to go, the tip does, clear of every panel, fighter and key chip`, () => {
      // The regression: asked as before (`tip` off), the card is declined.
      expect(advisorZone(input)).toBeNull();
      expect(withTip(input)).toBeNull();
      // The repair: one row, on the clear ground that is left.
      const zone = withTip(input, false, true);
      expect(zone, 'the card finds a place').not.toBeNull();
      expect(zone!.kind).toBe('tip');
      expect(zone!.maxHeight).toBe(TIP_HEIGHT);
      expect(zone!.width + TIP_BADGE).toBeGreaterThanOrEqual(TIP_MIN_WIDTH - 2 * (SKEW * TIP_HEIGHT));
      expect(zone).toEqual(tipZone(input));
      const bar = painted(zone!);
      // On the stage, with the margin the designed card keeps from its edge.
      expect(bar.left).toBeGreaterThanOrEqual(GAP - 1e-6);
      expect(bar.right).toBeLessThanOrEqual(STAGE.width - GAP + 1e-6);
      expect(bar.top).toBeGreaterThanOrEqual(GAP - 1e-6);
      expect(bar.bottom).toBeLessThanOrEqual(STAGE.height);
      // Clear of everything the designed card keeps off, and of the chips only the tip meets.
      for (const o of [...obstaclesOf(input), ...(input.keepOff ?? [])]) expect(overlap(bar, o), JSON.stringify(o)).toBe(false);
      // What the page solved, to the pixel the browser reported it at.
      expect(zone!.left).toBeCloseTo(left, 1);
      expect(zone!.bottom).toBeCloseTo(bottom, 1);
    });
  }

  it('a read-out that takes the band takes the card with it: asked with `tip` off, every board declines, as before', () => {
    for (const { input } of Object.values(BOARDS)) expect(withTip(input, false, false)).toBeNull();
  });

  it('stands on the top row of the stage wherever the top row is wide enough for the whole bar, so it does not move from decision to decision', () => {
    for (const [name, { input }] of Object.entries(BOARDS)) {
      const zone = tipZone(input)!;
      const bar = painted(zone);
      if (name === 'III 1024x768') expect(bar.top, name).toBeGreaterThan(300); // the deck: its top is 144 wide, under the 160 a whole bar wants
      else expect(bar.bottom, name).toBeLessThan(40);
    }
  });

  it('does not take the ground a submenu frees: with the command stack shrunk to what a submenu leaves, the tip is where it was', () => {
    for (const [name, { input }] of Object.entries(BOARDS)) {
      const submenu: AdvisorZoneInput = { ...input, cmdArea: R(30, 222, 188, 335) };
      expect(tipZone(submenu), name).toEqual(tipZone(input));
    }
  });

  it('does not move when the party steps: the sprites standing a quarter of the stage to the right leave the tip on the top row', () => {
    for (const [name, { input }] of Object.entries(BOARDS)) {
      const stepped: AdvisorZoneInput = { ...input, sprites: input.sprites.map((s) => R(s.left + 24, s.top, s.right + 24, s.bottom)) };
      expect(tipZone(stepped), name).toEqual(tipZone(input));
    }
  });

  describe('the second decision of Chapter I at 1600x900, as the camera comes to rest (the solve the HUD makes the moment the menu opens)', () => {
    // Recorded off `FFXBattleHud.solveAdvisorPlacement` (headless Chromium, real GPU, seed 1, a real Attack and a real wait for the next menu): the camera is still gliding to the menu shot, so
    // Seymour Flux and Mortiorchis are drawn 28 grid px higher than they settle (the live silhouette the designed card must keep off, the gold bracket being drawn on it), and the tip's top
    // row, 21 tall under the guide's chips, has 12 under him.
    const OPENING: AdvisorZoneInput = {
      ...CHROME,
      cmdInfo: R(24, 131, 196, 154),
      cmdArea: R(30, 177, 218, 335), guide: R(21, 44, 154, 115), sensor: R(434, 166, 500, 177), intentChip: R(552, 36, 620, 52), ctb: R(547, 49, 621, 201),
      sprites: [R(196, 208, 304, 328), R(328, 272, 368, 316), R(232, 156, 344, 284)], // tidus, yuna (down), kimahri
      enemies: [R(328, -24, 528, 220), R(212, 24, 408, 176)], // seymour-flux, mortiorchis: where the glide has them
      keepOff: [R(20, 33, 80, 44), R(79, 33, 130, 44), R(7, 7, 47, 17)],
    };
    const RESTING: readonly Rect[] = [R(328, 4, 520, 244), R(200, 52, 396, 208)]; // the same two with the glide taken out (`FFXBattleHud.enemySpriteRectsAtRest`)

    it('read from the live silhouettes alone the top row is blocked and the tip goes to the bottom right, and stays there for the whole decision (the placement is held)', () => {
      const live = tipZone(OPENING)!;
      expect(live.left).toBeGreaterThan(300);
      expect(live.bottom).toBeLessThan(150);
    });

    it('read with the fighters where the shot comes to rest, it stands on the top row where the first decision had it, whatever the camera is doing', () => {
      const rest = tipZone({ ...OPENING, enemiesAtRest: RESTING })!;
      const first = tipZone(BOARDS['I 1600x900']!.input)!;
      expect(rest.left).toBeCloseTo(first.left, 1);
      expect(rest.bottom).toBeCloseTo(first.bottom, 1);
      expect(rest.width).toBeCloseTo(first.width, 1);
      expect(rest.bottom).toBeGreaterThan(300); // the top row
    });

    it('is still clear of every fighter where it rests, and of the key chips: the resting list is the one the bar is checked against', () => {
      const rest = tipZone({ ...OPENING, enemiesAtRest: RESTING })!;
      const bar = painted(rest);
      for (const o of [...obstaclesOf({ ...OPENING, enemies: RESTING }), ...(OPENING.keepOff ?? [])]) expect(overlap(bar, o), JSON.stringify(o)).toBe(false);
    });
  });
});

describe('what the tip does not touch', () => {
  /** Chapter I at 2000x1012, the first decision: a board the designed passes serve (`ui-ffx-hud-safe-zones-2000.test.ts`). */
  const out = (r: Rect, q: number): Rect => R(Math.floor(r.left / q) * q, Math.floor(r.top / q) * q, Math.ceil(r.right / q) * q, Math.ceil(r.bottom / q) * q);
  const SERVED: AdvisorZoneInput = {
    cmdArea: out(R(30.2, 177.8, 217.8, 334.2), 1),
    cmdInfo: R(24, 121, 196, 154),
    partyStatus: out(R(402.7, 258.3, 616.9, 348), 1),
    guide: out(R(21.3, 44, 153.3, 100), 1),
    sensor: out(R(426.6, 166, 545.3, 254), 1),
    intent: null,
    intentChip: out(R(566.8, 38.8, 618.9, 46.3), 4),
    ctb: out(R(547.6, 49.8, 620.4, 200.4), 1),
    sprites: [R(147.5, 171.6, 272.2, 315), R(275.4, 165.5, 392.3, 299.9), R(227.6, 149.2, 323.4, 259.3)].map((r) => out(r, 4)),
    enemies: [R(373.5, 33.5, 512.1, 192.9), R(283, 68.2, 413, 172.9)].map((r) => out(r, 4)),
  };

  it('a screen the designed passes serve is answered by them, whatever `tip` says', () => {
    const designed = advisorZone(SERVED);
    expect(designed).not.toBeNull();
    expect(withTip(SERVED, false, true)).toEqual(withTip(SERVED));
    expect(withTip(SERVED, true, true)).toEqual(withTip(SERVED, true));
  });

  it('the list the tip reads at rest belongs to the tip alone: the designed passes and the strip answer from the live fighters, whatever it holds', () => {
    const walled: AdvisorZoneInput = { ...SERVED, enemiesAtRest: [R(0, 0, 640, 360)] };
    expect(withTip(walled, false, true)).toEqual(withTip(SERVED));
    expect(withTip(walled, true, true)).toEqual(withTip(SERVED, true));
    expect(advisorZone(walled)).toEqual(advisorZone(SERVED));
  });

  it('a screen with no clear ground still declines: a fighter filling the stage leaves the tip nothing', () => {
    const wall = { ...BOARDS['I 1600x900']!.input, enemies: [R(0, 0, 640, 360)] };
    expect(withTip(wall, true, true)).toBeNull();
  });

  it('a band narrower than the tip needs is not a place for it', () => {
    // Everything but a 120-wide, 40-tall gap at the top is covered: under TIP_MIN_WIDTH.
    const narrow: AdvisorZoneInput = { ...BOARDS['I 1600x900']!.input, enemies: [R(0, 0, 100, 360), R(250, 0, 640, 360)], keepOff: [] };
    expect(tipZone({ ...narrow, sprites: [], guide: null, sensor: null, ctb: null, intentChip: null, cmdArea: R(0, 200, 10, 210), partyStatus: R(0, 200, 10, 210), cmdInfo: null })).toBeNull();
  });

  it('the guide chips and the PAUSE chip are ground the tip keeps off, and the designed card ignores', () => {
    const board = BOARDS['III 1600x900']!.input;
    const bare = tipZone({ ...board, keepOff: [] })!;
    const kept = tipZone(board)!;
    expect(bare).not.toBeNull();
    // With no chips on the frame the widest clear band is the strip along the top and the bar stands on the guide's chips; with them it is not allowed to.
    for (const chip of board.keepOff!) expect(overlap(painted(kept), chip)).toBe(false);
    expect(board.keepOff!.some((c) => overlap(painted(bare), c))).toBe(true);
  });
});

// ------------------------------------------------------ the HUD applying the tip (jsdom: nothing is laid out, so the party is the one thing a test can place)

afterEach(() => {
  document.body.innerHTML = '';
});

function mountHud(): FFXBattleHud {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  return hud;
}

/**
 * Three sprites shoulder to shoulder from grid y 60 down, the HUD's own reconstruction of them (`partySpriteRects`, window 1024x768 so scale 1.6, origin (-512, -288)): the top 54 grid
 * px clear, which is too short for any card the designed passes lay out (83 with the chip) and holds a tip (16).
 */
function topBandProjector(): (id: string, anchor: string) => { x: number; y: number } {
  const xs = new Map<string, number>();
  const columns = [-352, 0, 352];
  return (id, anchor) => {
    if (!xs.has(id)) xs.set(id, columns[xs.size % columns.length]!);
    const x = xs.get(id)!;
    return anchor === 'head' ? { x, y: -133.6 } : { x, y: 283.8 };
  };
}

const els = (hud: FFXBattleHud): { root: HTMLElement; card: HTMLElement; chip: HTMLElement } => ({
  root: hud.el.querySelector<HTMLElement>('[data-role="move-advisor"]')!,
  card: hud.el.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!,
  chip: hud.el.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]')!,
});

describe('the FFX HUD placing the tip', () => {
  it('takes the tip when no card fits: the card is up, in zone tip, with the chip as its badge, at the one-row height', () => {
    const hud = mountHud();
    hud.setProjector(topBandProjector() as never);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const { root, card, chip } = els(hud);
    const zone = hud.advisorPlacement;
    expect(zone?.kind).toBe('tip');
    expect(card.hidden).toBe(false);
    expect(root.dataset['zone']).toBe('tip');
    expect(card.dataset['zone']).toBe('tip');
    expect(root.classList.contains('mad--tip')).toBe(true);
    expect(parseFloat(card.style.maxHeight)).toBeCloseTo(TIP_HEIGHT, 1);
    expect(parseFloat(card.style.left)).toBeCloseTo(zone!.left, 1);
    expect(parseFloat(chip.style.left)).toBeCloseTo(zone!.left - TIP_BADGE, 1);
    expect(chip.hidden).toBe(false);
  });

  describe('a camera still gliding at the start of a decision', () => {
    // Mortiorchis is drawn 40 grid px (64 viewport px at scale 1.6) higher than he settles, so his painted box (the live silhouette the gold bracket is drawn on) reaches grid y 12, over the
    // top band the tip stands in: it is 48 tall from the stage's margin to the party's rects, and the live box leaves it none.
    const GLIDE = 64;
    const SILHOUETTE = { x: 200 * 1.6 - 512, y: 12 * 1.6 - 288, w: 240 * 1.6, h: 108 * 1.6 };
    const targeting = { rect: (id: string) => (id === 'mortiorchis' ? SILHOUETTE : null), select: () => undefined, xray: () => undefined, visibility: () => 1, setPanels: () => undefined };

    function mountGliding(withLayout: boolean): FFXBattleHud {
      const hud = mountHud();
      const rest = topBandProjector();
      const gliding = (id: string, anchor: string): { x: number; y: number } => {
        const p = rest(id, anchor);
        return id === 'mortiorchis' ? { x: p.x, y: p.y - GLIDE } : p;
      };
      hud.setProjector(gliding as never);
      if (withLayout) hud.setLayoutProjector({ point: rest as never, rect: () => null });
      hud.setTargetingPort(targeting as never);
      hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
      hud.update(16);
      return hud;
    }

    it('takes the fighters where the shot comes to rest: the tip is on the top band, whole width, as it is once the camera has settled', () => {
      const hud = mountGliding(true);
      const zone = hud.advisorPlacement;
      expect(zone?.kind).toBe('tip');
      expect(zone!.bottom).toBeGreaterThan(300);
      expect(els(hud).card.hidden).toBe(false);
    });

    it('with no layout projector to say where the shot comes to rest, the live silhouette is all there is, and it squeezes the tip into the corner beside it', () => {
      const squeezed = mountGliding(false).advisorPlacement;
      const rested = mountGliding(true).advisorPlacement;
      expect(squeezed?.kind).toBe('tip');
      expect(squeezed!.width).toBeLessThan(rested!.width - 40);
    });
  });

  it('does not take it while the enemy-move read-out is open: the read-out takes the band, and the card with it', () => {
    const hud = mountHud();
    hud.setProjector(topBandProjector() as never);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    // The painted read-out over the grid band y 20..300 (the one thing a jsdom run has to stand in for the browser: `intentToggle` test, "paintIntentReadOut").
    const panel = hud.el.querySelector<HTMLElement>('.eint__panel')!;
    const k = 1.6;
    const painted = { left: 6 * k - 512, top: 20 * k - 288, right: 634 * k - 512, bottom: 300 * k - 288, width: 628 * k, height: 280 * k, x: 6 * k - 512, y: 20 * k - 288, toJSON: () => ({}) } as DOMRect;
    panel.getBoundingClientRect = (): DOMRect => painted;
    panel.hidden = false;
    hud.update(16);
    const { card, root } = els(hud);
    expect(hud.advisorPlacement).toBeNull();
    expect(card.hidden).toBe(true);
    expect(root.dataset['zone']).toBe('free');
    expect(root.classList.contains('mad--tip')).toBe(false);
  });

  it('N puts the tip away (the chip then reads "best move", where the badge was) and brings it back', () => {
    const hud = mountHud();
    hud.setProjector(topBandProjector() as never);
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.update(16);
    const { root, card, chip } = els(hud);
    const left = chip.style.left;
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }));
    hud.update(16);
    expect(card.hidden).toBe(true);
    expect(root.classList.contains('mad--tip')).toBe(false);
    expect(chip.textContent?.toLowerCase()).toContain('best move');
    expect(chip.style.left).toBe(left);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyN' }));
    hud.update(16);
    expect(card.hidden).toBe(false);
    expect(root.classList.contains('mad--tip')).toBe(true);
    expect(chip.textContent?.toLowerCase()).toContain('hide moves');
  });
});

// ------------------------------------------------------ the card printing the tip (jsdom: no layout, so the box it is measured against is supplied)

/** A lead and a runner-up, with a board note: everything the full card prints and the tip does not. */
function view(lead = 'Hastega'): AdvisorView {
  const base = {
    command: { kind: 'attack', targets: ['seymour-flux'] } as unknown as MoveSuggestion['command'],
    targetId: 'seymour-flux',
    targetName: 'the party',
    estimate: { kind: 'damage' as const, min: 900, mid: 1_100, max: 1_300, hits: 1, killsTarget: false },
    mpCost: 0,
    hitChance: 96,
    critChance: 12,
    statuses: [],
    cures: [],
    warning: '',
    isSwitch: false,
    cite: '',
    score: 1,
    source: 'simulated' as const,
  };
  return {
    actorId: 'tidus',
    actorName: 'Tidus',
    suggestions: [
      { ...base, label: lead, menu: 'White Magic', effect: 'Puts Haste on the whole party for several turns', reason: 'Haste on the party is the opener', source: 'tactic' },
      { ...base, label: 'Mega Phoenix', menu: 'Items', effect: 'Revives all fallen allies', reason: 'Stand Yuna up', warning: 'Seymour Flux uses Lance of Atrophy first' },
    ],
    note: 'Cross Cleave hits the whole party next',
    considered: 12,
  };
}

function mountAdvisor(zone: string, cap: number): { advisor: MoveAdvisor; card: HTMLElement } {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const advisor = new MoveAdvisor({ game: 'ffx', anchors: { left: 196, right: 414, bottom: 26 }, readVisible: () => true, writeVisible: () => undefined });
  advisor.mount(stage);
  const card = stage.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
  card.dataset['zone'] = zone;
  card.style.maxHeight = `${cap}px`;
  Object.defineProperty(card, 'clientWidth', { configurable: true, get: () => 180 });
  // Taller than any box the ladder is given until it reaches the tersest rung, as the full card is (14 grid px a paragraph), so the loop under test is the real one.
  const rows = (): number => card.querySelectorAll('p, article').length;
  Object.defineProperty(card, 'scrollHeight', { configurable: true, get: () => (card.dataset['zone'] === 'tip' ? 13 : rows() * 14) });
  Object.defineProperty(card, 'clientHeight', { configurable: true, get: () => Math.min(cap, rows() * 14) });
  return { advisor, card };
}

function show(advisor: MoveAdvisor, v: AdvisorView): void {
  const inner = advisor as unknown as { cached: AdvisorView | null; lastSignature: string; render(): void };
  inner.cached = v;
  inner.lastSignature = '';
  inner.render();
}

describe('the move advisor printing the one-row tip', () => {
  it('prints the bare rung whatever the box says: the lead only, its path and its cost, no head, no runner-up text', () => {
    const { advisor, card } = mountAdvisor('tip', 18);
    show(advisor, view());
    advisor.update(0);
    expect(advisor.printedDensity).toBe(MAX_DENSITY);
    expect(card.querySelector('.mad__head')).toBeNull();
    expect(card.querySelector('.mad__label')?.textContent).toBe('Hastega');
    expect(card.querySelector('.mad__target')?.textContent).toBe('the party');
    expect(card.querySelector('.mad__move:not(.mad__move--alt) .mad__effect')).toBeNull();
    expect(card.querySelector('.mad__move:not(.mad__move--alt) .mad__why')).toBeNull();
  });

  it('prints it again at the NEXT decision: a new board starts the ladder from the top, and the tip takes the bare rung straight back', () => {
    const { advisor, card } = mountAdvisor('tip', 18);
    show(advisor, view());
    advisor.update(0);
    expect(advisor.printedDensity).toBe(MAX_DENSITY);
    show(advisor, view('Cure'));
    // Straight after the new board is rendered, before the next frame's update: the full card's rows must not be on screen for a frame, or its second row of chips wraps out of the one-row box.
    expect(advisor.printedDensity).toBe(MAX_DENSITY);
    expect(card.querySelector('.mad__label')?.textContent).toBe('Cure');
    expect(card.querySelector('.mad__move:not(.mad__move--alt) .mad__effect')).toBeNull();
    expect(card.querySelector('.mad__head')).toBeNull();
  });

  it('leaving the tip (the guide folded with G hands the card a real box) starts the ladder over from the full card', () => {
    const { advisor, card } = mountAdvisor('tip', 18);
    show(advisor, view());
    advisor.update(0);
    expect(advisor.printedDensity).toBe(MAX_DENSITY);
    card.dataset['zone'] = 'shelf';
    card.style.maxHeight = '400px'; // room for every row the full card prints
    advisor.update(0);
    expect(advisor.printedDensity).toBe(0);
    expect(card.querySelector('.mad__head')).not.toBeNull();
    expect(card.querySelector('.mad__move:not(.mad__move--alt) .mad__effect')).not.toBeNull();
  });

  it('a chip that does not fit whole is dropped, the last first, and never cut through a word', () => {
    const { advisor, card } = mountAdvisor('tip', 18);
    show(advisor, view());
    advisor.update(0); // the tip's bare rung is printed (a new row of elements)
    const stats = card.querySelector<HTMLElement>('.mad__move:not(.mad__move--alt) .mad__stats')!;
    const chips = Array.from(stats.children) as HTMLElement[];
    expect(chips.length).toBe(2); // where it lives, what it costs
    // The box holds 40 px of chips, each 30 wide: one fits. The width of the card is what a new fit is keyed on.
    let boxWidth = 40;
    Object.defineProperty(stats, 'clientWidth', { configurable: true, get: () => boxWidth });
    Object.defineProperty(stats, 'scrollWidth', { configurable: true, get: () => chips.filter((c) => !c.hidden).length * 30 });
    Object.defineProperty(card, 'clientWidth', { configurable: true, get: () => 176 });
    advisor.update(0);
    expect(chips.map((c) => c.hidden)).toEqual([false, true]);
    // A wider box brings them back.
    boxWidth = 100;
    Object.defineProperty(card, 'clientWidth', { configurable: true, get: () => 260 });
    advisor.update(0);
    expect(chips.map((c) => c.hidden)).toEqual([false, false]);
  });

  it('with the chips gone: the actor goes first (the target outranks it), then the arrow and the target together (a half arrow reads as a dash), the actor coming back if it fits', () => {
    const { advisor, card } = mountAdvisor('tip', 18);
    show(advisor, view());
    advisor.update(0);
    const move = card.querySelector<HTMLElement>('.mad__move:not(.mad__move--alt)')!;
    const line = move.querySelector<HTMLElement>('.mad__line')!;
    const stats = move.querySelector<HTMLElement>('.mad__stats')!;
    const actor = line.querySelector<HTMLElement>('.mad__actor')!;
    const arrow = line.querySelector<HTMLElement>('.mad__arrow')!;
    const target = line.querySelector<HTMLElement>('.mad__target')!;
    const cut = (el: HTMLElement): boolean => el.hasAttribute('data-tip-cut');
    // The row in grid px as the browser lays it out: the move 40, the actor 20 and the arrow 8 are rigid, the target (50 at most) takes what is left of the `room` the line is given (min-width 0),
    // and the chips get none of it. The line overflows only when the rigid parts alone are wider than the room.
    let room = 200;
    const rigid = (): number => 40 + (cut(actor) ? 0 : 20) + (cut(arrow) ? 0 : 8);
    const define = (el: HTMLElement, name: string, get: () => number): void => void Object.defineProperty(el, name, { configurable: true, get });
    define(stats, 'clientWidth', () => 0);
    define(stats, 'scrollWidth', () => 60);
    define(line, 'clientWidth', () => room);
    define(line, 'scrollWidth', () => Math.max(room, rigid()));
    define(target, 'scrollWidth', () => 50);
    define(target, 'clientWidth', () => Math.max(0, Math.min(50, room - rigid())));
    const fit = (w: number): void => {
      room = w;
      define(card, 'clientWidth', () => w + 80); // a new width is what a new fit is keyed on
      advisor.update(0);
    };
    const state = (): boolean[] => [cut(actor), cut(arrow), cut(target)];
    fit(200); // everything fits
    expect(state()).toEqual([false, false, false]);
    fit(100); // the target is squeezed to 32: the actor goes and the answer stays whole
    expect(state()).toEqual([true, false, false]);
    fit(80); // without the actor the target is squeezed to 32 px, six letters and an ellipsis: kept, and the actor is not back
    expect(state()).toEqual([true, false, false]);
    fit(62); // without the actor the target is left 14 px, under three letters: the arrow and the target go together, and the name, which fits (60), comes back
    expect(state()).toEqual([false, true, true]);
    fit(55); // and where the name does not fit either, it stays off
    expect(state()).toEqual([true, true, true]);
    fit(200); // a wider box brings every one of them back
    expect(state()).toEqual([false, false, false]);
  });
});
