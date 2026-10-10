/**
 * The NEXT BEST MOVE card in the folded strategy guide's place (`src/ui/ffx/advisorFolded.ts`; FFX only, Chapters I and III; branch r3943-int, Bailey's pick "A2" of 2026-10-09).
 *
 * ## What Bailey picked, and the defect its first picture had
 *
 * At the start of Seymour Flux's fight and of Braska's Final Aeon's the strategy guide is folded to its `G` chip and the full designed card stands in the guide's place; `G` opens the guide
 * and **while it is open the card is the one-row tip** (`ui-ffx-advisor-tip.test.ts`). The options sheet's first picture of that (the branch as it stood, with `G` pressed) had a defect it measured in all
 * six frames: the designed passes place the card in the rail's room, which begins where the guide's sheet began, so the card (30 to 100 percent of the chip) or the `N` chip riding above it
 * (17 to 94 percent) stood on the folded `G` chip, the key that brings the guide back. Nothing told the designed passes the chip was there: it is not an obstacle while the sheet is open.
 *
 * ## What is pinned here
 *
 * The boards are not written by hand: each is the solver's input as the FFX HUD built it in a headless Chromium (real GPU, seed 1, the first command menu) at 1600x900, 1440x900 and 1024x768,
 * with the guide folded as the fight opens (the HUD's `guideChip` and the `N` chip's two sizes as `advisorChipSizes.ts` measures them). On every one of them:
 *
 *  - the card is the **designed card** (`shelf`, or `compact` in Chapter III at 4:3 where the left pagoda leaves a narrow rail), never the tip;
 *  - **neither the card nor the `N` chip stands on the `G` chip**, nor on the chip beside it, a panel or a fighter; the chip is in the chip row, on the `G` chip's baseline, `CHIP_BESIDE_GAP` right of it;
 *  - the card's box starts `FOLDED_CHIP_CLEARANCE` grid px under the chip row and ends `FOLDED_SLAB_GAP` grid px above the help slab's slot: 70 grid px tall at 16:9 and 16:10, 66 at 4:3 (the left and bottom edges and the height budget do not depend on the decision);
 *  - where the chip's whole label does not fit in the row (Chapter III at 4:3: the left pagoda reaches into it) the chip is the key-only badge, and the zone says so;
 *  - the card never takes more than `COMFORTABLE_ADVISOR_WIDTH`, so the first menu (the scene stands 25 grid px further right and leaves the card 36 more) is not a card of another width.
 *
 * And the fall-backs: with the guide open there is no `guideChip` and the tip is the card, as before; with no measured chip the dock is declined and the designed passes run against the same band, so the
 * card and its chip still stay off the `G` chip, or the tip stands in.
 *
 * Browser truth is `tests/e2e/advisor-present.spec.ts` (the first menu of both chapters at three shapes: the card, the chip, the `G` chip, `G` and `G` again).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the FFX HUD's solver, and only the two scenes that set `SceneStaging.guideFolded`; FFX-2's HUD places its card by its own lane.
 */

import { describe, expect, it } from 'vitest';
import { CHIP_BESIDE_GAP, FOLDED_CHIP_CLEARANCE, FOLDED_SLAB_GAP, chipBeside, foldedBand, foldedFloor, foldedGuideZone, underTheChipRow } from '../../src/ui/ffx/advisorFolded.ts';
import { advisorZone as withTip } from '../../src/ui/ffx/advisorStrip.ts';
import { ADVISOR_CHIP_RESERVE, COMFORTABLE_ADVISOR_WIDTH, GAP, SKEW, STAGE, advisorChipDock, obstaclesOf, type AdvisorZone, type AdvisorZoneInput, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';

const R = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });

/** The solver's input as the HUD built it, in grid px (the 640x360 stage). `cmdInfo` is the HUD's own reserved slot, not a measurement. */
const CHROME = { cmdInfo: R(24, 121, 196, 154), partyStatus: R(402, 258, 617, 348), intent: null, guide: null } as const;

/** The `N` chip, measured on the page as `advisorChipSizes.ts` does: its longer label, and the key-only badge. */
const SIZES = {
  '1600x900': { chipSize: { width: 65, height: 11 }, badgeSize: { width: 18, height: 11 } },
  '1440x900': { chipSize: { width: 70, height: 11 }, badgeSize: { width: 18, height: 11 } },
  '1024x768': { chipSize: { width: 93, height: 15 }, badgeSize: { width: 21, height: 15 } },
} as const;

interface Board {
  input: AdvisorZoneInput;
  /** What the page solved: the box (`left`, `bottom`, `maxHeight`) and the chip's dock, `bottom` from the stage's bottom edge. */
  left: number;
  maxHeight: number;
  kind: AdvisorZone['kind'];
  chip: { left: number; bottom: number; badge?: boolean };
}

const BOARDS: Record<string, Board> = {
  'I 1600x900': {
    input: {
      ...CHROME, ...SIZES['1600x900'],
      cmdArea: R(30, 177, 218, 335), sensor: R(406, 165, 526, 255), intentChip: R(552, 36, 620, 52), ctb: R(547, 49, 621, 201), guideChip: R(20, 33, 61, 44),
      sprites: [R(224, 208, 328, 328), R(328, 212, 420, 316), R(260, 156, 372, 284)], // tidus, yuna, kimahri
      enemies: [R(356, 4, 544, 220), R(232, 52, 408, 192)], // seymour-flux, mortiorchis
      keepOff: [R(20, 33, 61, 44), R(7, 7, 47, 17)],
    },
    left: 13.44, maxHeight: 70, kind: 'shelf', chip: { left: 65, bottom: 316 },
  },
  'I 1440x900': {
    input: {
      ...CHROME, ...SIZES['1440x900'],
      cmdArea: R(30, 177, 218, 335), sensor: R(401, 152, 520, 242), intentChip: R(544, 36, 620, 52), ctb: R(541, 49, 621, 201), guideChip: R(20, 33, 64, 44),
      sprites: [R(216, 208, 328, 340), R(324, 216, 424, 324), R(252, 152, 368, 288)], // tidus, yuna, kimahri
      enemies: [R(336, -8, 540, 224), R(200, 40, 388, 192)], // seymour-flux, mortiorchis
      keepOff: [R(20, 33, 64, 44), R(8, -12, 52, -1)],
    },
    left: 13.44, maxHeight: 70, kind: 'shelf', chip: { left: 68, bottom: 316 },
  },
  'I 1024x768': {
    input: {
      ...CHROME, ...SIZES['1024x768'],
      cmdArea: R(30, 177, 218, 335), sensor: R(376, 158, 498, 259), intentChip: R(520, 36, 620, 56), ctb: R(519, 49, 621, 207), guideChip: R(19, 33, 76, 48),
      sprites: [R(208, 216, 336, 360), R(336, 220, 444, 348), R(252, 148, 388, 308)], // tidus, yuna, kimahri
      enemies: [R(372, -40, 608, 232), R(216, 16, 436, 196)], // seymour-flux, mortiorchis
      keepOff: [R(19, 33, 76, 48), R(12, -49, 72, -33)],
    },
    left: 13.01, maxHeight: 66, kind: 'shelf', chip: { left: 80, bottom: 312 },
  },
  'III 1600x900': {
    input: {
      ...CHROME, ...SIZES['1600x900'],
      cmdArea: R(30, 177, 218, 335), sensor: null, intentChip: R(552, 36, 620, 52), ctb: R(547, 49, 621, 201), guideChip: R(20, 33, 61, 44),
      sprites: [R(192, 144, 320, 292), R(320, 160, 432, 288), R(232, 152, 336, 268)], // tidus, yuna, auron
      enemies: [R(316, 8, 540, 240), R(196, 52, 332, 208), R(408, 44, 552, 208)], // braskas-final-aeon, yu-pagoda-left, yu-pagoda-right
      keepOff: [R(20, 33, 61, 44), R(7, 7, 47, 17)],
    },
    left: 13.44, maxHeight: 70, kind: 'shelf', chip: { left: 65, bottom: 316 },
  },
  'III 1440x900': {
    input: {
      ...CHROME, ...SIZES['1440x900'],
      cmdArea: R(30, 177, 218, 335), sensor: null, intentChip: R(544, 36, 620, 52), ctb: R(541, 49, 621, 201), guideChip: R(20, 33, 64, 44),
      sprites: [R(180, 128, 320, 288), R(320, 140, 444, 284), R(224, 132, 336, 264)], // tidus, yuna, auron
      enemies: [R(312, -24, 564, 232), R(180, 20, 336, 196), R(420, 16, 576, 196)], // braskas-final-aeon, yu-pagoda-left, yu-pagoda-right
      keepOff: [R(20, 33, 64, 44), R(8, -12, 52, -1)],
    },
    left: 13.44, maxHeight: 70, kind: 'shelf', chip: { left: 68, bottom: 316 },
  },
  'III 1024x768': {
    input: {
      ...CHROME, ...SIZES['1024x768'],
      cmdArea: R(30, 177, 218, 335), sensor: null, intentChip: R(520, 36, 620, 56), ctb: R(519, 49, 621, 204), guideChip: R(19, 33, 76, 48),
      sprites: [R(152, 116, 320, 308), R(320, 136, 468, 304), R(204, 124, 340, 280)], // tidus, yuna, auron
      enemies: [R(312, -64, 612, 244), R(156, -8, 336, 200), R(440, -20, 628, 200)], // braskas-final-aeon, yu-pagoda-left, yu-pagoda-right
      keepOff: [R(19, 33, 76, 48), R(12, -49, 72, -33)],
    },
    left: 13.01, maxHeight: 66, kind: 'compact', chip: { left: 80, bottom: 312, badge: true },
  },
};

const NAMES = Object.keys(BOARDS);
const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** The card as it is painted: the skew's reach either side of the layout box, on the stage. */
function painted(z: { left: number; width: number; bottom: number; maxHeight: number }): Rect {
  const reach = (SKEW * z.maxHeight) / 2;
  return R(z.left - reach, STAGE.height - z.bottom - z.maxHeight, z.left + z.width + reach, STAGE.height - z.bottom);
}

/** Where the `N` chip stands, from the zone, with the size the zone docked. */
function dockOf(z: AdvisorZone, board: Board): Rect {
  const size = z.chip?.badge ? board.input.badgeSize! : board.input.chipSize!;
  const bottom = STAGE.height - z.chip!.bottom;
  return R(z.chip!.left, bottom - size.height, z.chip!.left + size.width, bottom);
}

describe('the designed card in the folded guide\'s place, on the boards the page measured', () => {
  for (const name of NAMES) {
    const board = BOARDS[name]!;
    const input = board.input;
    const chip = input.guideChip!;

    describe(name, () => {
      const zone = withTip(input, false, true)!;

      it('is the designed card, the way the HUD asks for it (`advisorZone(input, strip, tip)`), and it is the folded path\'s', () => {
        expect(zone, 'a zone').not.toBeNull();
        expect(zone.kind, 'not the tip').toBe(board.kind);
        expect(zone).toEqual(foldedGuideZone(input));
        expect(zone.chip, 'the chip is docked by the zone').toBeDefined();
      });

      it('stands where the page put it (left, bottom edge and height budget), and its chip beside the G chip', () => {
        expect(zone.left).toBeCloseTo(board.left, 1);
        expect(zone.bottom, 'FOLDED_SLAB_GAP above the help slab\'s reserved slot').toBe(STAGE.height - (input.cmdInfo!.top - FOLDED_SLAB_GAP));
        expect(zone.bottom).toBe(243);
        expect(zone.maxHeight).toBe(board.maxHeight);
        expect(zone.chip).toEqual(board.chip);
      });

      it('starts under the chip row (the clearance below the G chip) and keeps the designed card\'s own clearances', () => {
        const box = painted(zone);
        expect(box.top, 'under the G chip').toBeGreaterThanOrEqual(chip.bottom + FOLDED_CHIP_CLEARANCE - 1e-6);
        expect(zone.width, 'never past comfortable').toBeLessThanOrEqual(COMFORTABLE_ADVISOR_WIDTH + 1e-6);
        expect(zone.maxHeight, 'at least the short card').toBeGreaterThanOrEqual(60);
      });

      it('does not touch the G chip, the N chip, any chip along the top, any panel or any fighter', () => {
        const box = painted(zone);
        const dock = dockOf(zone, board);
        expect(overlap(box, chip), 'card on the G chip').toBe(false);
        expect(overlap(dock, chip), 'N chip on the G chip').toBe(false);
        expect(overlap(box, dock), 'card on the N chip').toBe(false);
        for (const k of input.keepOff!) {
          expect(overlap(box, k), `card on the chip ${JSON.stringify(k)}`).toBe(false);
          if (k !== chip) expect(overlap(dock, k), `N chip on the chip ${JSON.stringify(k)}`).toBe(false);
        }
        for (const o of obstaclesOf(input)) {
          expect(overlap(box, o), `card on ${JSON.stringify(o)}`).toBe(false);
          expect(overlap(dock, o), `N chip on ${JSON.stringify(o)}`).toBe(false);
        }
      });

      it('parks the chip in the chip row: the same baseline as the G chip, CHIP_BESIDE_GAP to its right', () => {
        const dock = dockOf(zone, board);
        expect(dock.left).toBe(chip.right + CHIP_BESIDE_GAP);
        expect(dock.bottom).toBe(chip.bottom);
        expect(dock.right, 'on the stage').toBeLessThanOrEqual(STAGE.width - GAP);
      });
    });
  }

  it('is the key-only badge only where the whole label does not fit in the row: Chapter III at 4:3 (the left pagoda reaches into it)', () => {
    expect(NAMES.filter((n) => foldedGuideZone(BOARDS[n]!.input)!.chip!.badge === true)).toEqual(['III 1024x768']);
    const board = BOARDS['III 1024x768']!;
    const whole = chipBeside(board.input.guideChip!, board.input.chipSize);
    expect(whole && obstaclesOf(board.input).some((o) => overlap(R(whole.left - 1, whole.top - 1, whole.right + 1, whole.bottom + 1), o)), 'the whole label would stand in the pagoda').toBe(true);
  });

  it('is a card of the same left edge, bottom edge and height budget whatever the room to its right (the first menu has 36 grid px more of it)', () => {
    const board = BOARDS['I 1600x900']!;
    const first = foldedGuideZone(board.input)!;
    // the scene 25 grid px to the left, as at the second decision of the same fight (measured: 209.5 and 173.5 wide uncapped)
    const shift = (r: Rect): Rect => R(r.left - 25.6, r.top, r.right - 25.6, r.bottom);
    const later = foldedGuideZone({ ...board.input, sprites: board.input.sprites.map(shift), enemies: board.input.enemies!.map(shift) })!;
    expect(later.left).toBeCloseTo(first.left, 6);
    expect(later.bottom).toBe(first.bottom);
    expect(later.maxHeight).toBe(first.maxHeight);
    expect(later.chip).toEqual(first.chip);
    expect(first.width, 'the first menu\'s card is capped').toBe(COMFORTABLE_ADVISOR_WIDTH);
    expect(first.width - later.width, 'and the other differs by what the room below the cap differs by').toBeLessThan(12);
  });
});

describe('the card stands in the rail at every decision', () => {
  it('does not drop to a box above the command stack when the actor has a shorter stack (measured: Chapter III at 1024x768, the second decision, the card moved 110 grid px down)', () => {
    for (const name of ['III 1024x768', 'III 1600x900', 'I 1024x768']) {
      const board = BOARDS[name]!;
      const rail = foldedGuideZone(board.input)!;
      for (const top of [200, 231, 240, 260]) {
        const shorter = foldedGuideZone({ ...board.input, cmdArea: { ...board.input.cmdArea, top } })!;
        expect(shorter, `${name}, stack from ${top}`).toEqual(rail);
        expect(shorter.bottom).toBe(243);
      }
    }
  });

  it("foldedFloor is the help slab's top edge down across the stage (less what the rail takes back), and the stack's top when no slab is given", () => {
    const taken = GAP - FOLDED_SLAB_GAP; // the solver puts GAP round the floor; the rail takes this much of it back
    expect(foldedFloor({ cmdInfo: R(24, 121, 196, 154), cmdArea: R(30, 177, 218, 335) })).toEqual({ left: 0, top: 121 + taken, right: STAGE.width, bottom: STAGE.height });
    expect(foldedFloor({ cmdInfo: null, cmdArea: R(30, 177, 218, 335) }).top).toBe(177 + taken);
  });
});

describe('the fighters where the shot comes to rest', () => {
  const board = BOARDS['I 1440x900']!;

  it('is solved against `enemiesAtRest` when the HUD gives it (a fresh solve), and against `enemies` otherwise', () => {
    const base = foldedGuideZone(board.input)!;
    const nearer = board.input.enemies!.map((r) => R(r.left - 30, r.top, r.right - 30, r.bottom));
    expect(foldedGuideZone({ ...board.input, enemiesAtRest: board.input.enemies })).toEqual(base);
    const atRest = foldedGuideZone({ ...board.input, enemiesAtRest: nearer })!;
    expect(atRest.width, 'narrower for fighters 30 grid px nearer').toBeLessThan(base.width);
    expect(atRest.left).toBeCloseTo(base.left, 6);
    expect(foldedGuideZone({ ...board.input, enemies: nearer })).toEqual(atRest);
  });
});

describe('when it cannot', () => {
  it('declines with no G chip (the guide is open, or this is not one of the two fights): the designed passes and the tip are as they were', () => {
    for (const name of NAMES) {
      const open = { ...BOARDS[name]!.input, guideChip: null, chipSize: null, badgeSize: null, guide: R(21, 44, 154, 115) };
      expect(foldedGuideZone(open), name).toBeNull();
      expect(withTip(open, false, true)!.kind, `${name}: the guide open, the card is the tip`).toBe('tip');
    }
  });

  it('declines with no measured chip, and the designed passes run against the same band: whatever they return stays off the G chip, with its chip above it', () => {
    for (const name of NAMES) {
      const bare = { ...BOARDS[name]!.input, chipSize: null, badgeSize: null };
      expect(foldedGuideZone(bare), name).toBeNull();
      const z = withTip(bare, false, true);
      expect(z, `${name}: something is placed`).not.toBeNull();
      const chip = bare.guideChip!;
      const box = painted(z!);
      expect(overlap(box, chip), `${name}: the ${z!.kind} on the G chip`).toBe(false);
      if (z!.kind !== 'tip') {
        // the chip rides above the card, in the reserve the box was solved with (`ADVISOR_CHIP_RESERVE`: 11 grid px)
        expect(overlap(R(z!.left, box.top - 11, z!.left + 60, box.top), chip), `${name}: the chip above the card on the G chip`).toBe(false);
      }
    }
  });

  it('declines when neither chip fits in the row (a dock off the stage)', () => {
    const board = BOARDS['I 1600x900']!;
    const wide = { ...board.input, chipSize: { width: 700, height: 11 }, badgeSize: { width: 650, height: 11 } };
    expect(foldedGuideZone(wide)).toBeNull();
    expect(chipBeside(board.input.guideChip!, null)).toBeNull();
    expect(chipBeside(board.input.guideChip!, { width: 0, height: 11 })).toBeNull();
  });

  it('declines when no clear box holds even the short card under the chip row', () => {
    const board = BOARDS['I 1600x900']!;
    const walled = { ...board.input, enemies: [...board.input.enemies!, R(0, 44, STAGE.width, 150)] };
    expect(foldedGuideZone(walled)).toBeNull();
  });
});

describe('when the HUD measures that the card does not fit the rail (foldedFallback)', () => {
  it('asks for the tip and nothing else: no folded card, no designed card, on every board where the card would have been placed', () => {
    for (const name of NAMES) {
      const input = BOARDS[name]!.input;
      const card = withTip(input, false, true)!;
      expect(card.kind, `${name}: the card without the flag`).not.toBe('tip');
      const tip = withTip({ ...input, foldedFallback: true }, false, true);
      expect(tip, `${name}: a zone`).not.toBeNull();
      expect(tip!.kind, `${name}: the tip`).toBe('tip');
      expect(tip!.chip, `${name}: the chip is the tip's badge, not docked beside the G chip`).toBeUndefined();
      // and it keeps off the folded G chip as every tip does (`keepOff`)
      const bar = painted(tip!);
      expect(overlap(bar, input.guideChip!), `${name}: the tip on the G chip`).toBe(false);
    }
  });

  it('is nothing at all while the enemy-move read-out holds the band (the caller passes no tip), as the tip itself is', () => {
    const input = BOARDS['I 1600x900']!.input;
    expect(withTip({ ...input, foldedFallback: true }, false, false)).toBeNull();
  });

  it('is ignored without a folded guide (no guideChip): the flag only means something with the chip, and the designed passes run as they always did', () => {
    // a board the designed passes serve (a wide clear sky and no guide): with the flag set and no chip, nothing changes
    const sky = { cmdArea: R(30, 177, 218, 335), cmdInfo: R(24, 121, 196, 154), partyStatus: R(402, 258, 617, 348), guide: null, sensor: null, sprites: [R(224, 208, 328, 328)], enemies: [R(430, 4, 560, 220)], intent: null };
    const plain = withTip(sky, false, true);
    expect(plain, 'a zone').not.toBeNull();
    expect(plain!.kind).not.toBe('tip');
    expect(withTip({ ...sky, foldedFallback: true }, false, true)).toEqual(plain);
  });
});

describe("everything else the HUD places in the guide's place keeps off the chip row too", () => {
  it('underTheChipRow is the input with the band as one more fighter, and the same input when the guide is not folded', () => {
    const board = BOARDS['I 1600x900']!.input;
    const guarded = underTheChipRow(board);
    expect(guarded.enemies).toEqual([...board.enemies!, foldedBand(board.guideChip!)]);
    expect(guarded.sprites).toBe(board.sprites);
    const open = { ...board, guideChip: null };
    expect(underTheChipRow(open)).toBe(open);
  });

  it('the chip of a declined card docks under the band, never on the G chip (the HUD asks for it with the guarded input)', () => {
    let docked = 0;
    for (const name of NAMES) {
      const input = BOARDS[name]!.input;
      // a wall under the band: no card fits and the chip must find a pocket elsewhere or none
      const walled = { ...input, enemies: [...input.enemies!, R(0, 51, STAGE.width, 112)] };
      const dock = advisorChipDock(underTheChipRow(walled));
      if (!dock) continue;
      docked++;
      const chipBox = R(dock.left, STAGE.height - dock.bottom - ADVISOR_CHIP_RESERVE, dock.left + 60, STAGE.height - dock.bottom);
      expect(overlap(chipBox, input.guideChip!), `${name}: the chip dock on the G chip`).toBe(false);
    }
    expect(docked, 'the check ran on at least one board').toBeGreaterThan(0);
  });
});

describe("the chip row's band", () => {
  it('spans the stage at the chip\'s height, shortened by GAP minus the clearance so the box under it starts the clearance below the chip', () => {
    const band = foldedBand(R(20, 33, 61, 44));
    expect(band).toEqual({ left: 0, top: 33, right: STAGE.width, bottom: 44 - (GAP - FOLDED_CHIP_CLEARANCE) });
    expect(band.bottom + GAP).toBe(44 + FOLDED_CHIP_CLEARANCE);
  });

  it('is never empty, whatever the chip', () => {
    const band = foldedBand(R(0, 10, 5, 11));
    expect(band.bottom).toBeGreaterThan(band.top);
  });
});
