import { describe, expect, it } from 'vitest';

import { advisorZone as withStrip } from '../../src/ui/ffx/advisorStrip.ts';
import { cardArea, roomier, roomiestCompactZone, shortFullZone, SHORT_ADVISOR_HEIGHT } from '../../src/ui/ffx/advisorRoomy.ts';
import {
  MIN_ADVISOR_WIDTH,
  SKEW,
  advisorZone,
  obstaclesOf,
  type AdvisorZone,
  type AdvisorZoneInput,
  type Rect,
} from '../../src/ui/ffx/hudSafeZones.ts';

/**
 * PR-0330 (round 19b, FFX only: the FFX HUD's solver): under the colossus framing the move-advisor
 * card lost its effect, number and hit-chance lines in Chapter III and Chapter IX. The inputs below
 * are the ones the FFX HUD handed the solver on a real run at 1600x900, seed 1, first menu, read
 * off `FFXBattleHud.solveAdvisorPlacement` (the 640x360 grid); `*_FIELD` is the same fight without
 * the colossus framing (today's rig, which printed the card in full).
 */
const BFA_COLOSSUS: AdvisorZoneInput = {
  cmdArea: { left: 30, top: 177, right: 218, bottom: 335 },
  cmdInfo: { left: 24, top: 121, right: 196, bottom: 154 },
  partyStatus: { left: 402, top: 258, right: 617, bottom: 348 },
  guide: { left: 21, top: 44, right: 154, bottom: 100 },
  sensor: null,
  chipReserve: 0,
  intent: null,
  intentChip: { left: 552, top: 36, right: 620, bottom: 52 },
  ctb: { left: 547, top: 49, right: 621, bottom: 201 },
  sprites: [
    { left: 196, top: 180, right: 316, bottom: 320 },
    { left: 316, top: 180, right: 440, bottom: 320 },
    { left: 264, top: 164, right: 360, bottom: 276 },
  ],
  enemies: [
    { left: 348, top: 64, right: 500, bottom: 216 },
    { left: 284, top: 92, right: 376, bottom: 192 },
    { left: 468, top: 92, right: 552, bottom: 188 },
  ],
};

const BFA_FIELD: AdvisorZoneInput = {
  cmdArea: { left: 30, top: 177, right: 218, bottom: 335 },
  cmdInfo: { left: 24, top: 121, right: 196, bottom: 154 },
  partyStatus: { left: 402, top: 258, right: 617, bottom: 348 },
  guide: { left: 21, top: 44, right: 154, bottom: 100 },
  sensor: null,
  chipReserve: 0,
  intent: null,
  intentChip: { left: 552, top: 36, right: 620, bottom: 52 },
  ctb: { left: 547, top: 49, right: 621, bottom: 201 },
  sprites: [
    { left: 136, top: 196, right: 264, bottom: 344 },
    { left: 264, top: 196, right: 392, bottom: 340 },
    { left: 216, top: 180, right: 316, bottom: 292 },
  ],
  enemies: [
    { left: 320, top: 76, right: 480, bottom: 232 },
    { left: 260, top: 104, right: 348, bottom: 208 },
    { left: 448, top: 104, right: 532, bottom: 204 },
  ],
};

const YOJIMBO_COLOSSUS: AdvisorZoneInput = {
  cmdArea: { left: 30, top: 231, right: 204, bottom: 335 },
  cmdInfo: { left: 24, top: 121, right: 196, bottom: 154 },
  partyStatus: { left: 402, top: 258, right: 617, bottom: 348 },
  guide: { left: 21, top: 44, right: 154, bottom: 100 },
  sensor: { left: 434, top: 166, right: 478, bottom: 176 },
  chipReserve: 0,
  intent: null,
  intentChip: { left: 552, top: 36, right: 620, bottom: 52 },
  ctb: { left: 554, top: 49, right: 621, bottom: 201 },
  sprites: [
    { left: 196, top: 212, right: 280, bottom: 308 },
    { left: 244, top: 204, right: 324, bottom: 296 },
    { left: 316, top: 212, right: 400, bottom: 308 },
  ],
  enemies: [
    { left: 356, top: 96, right: 440, bottom: 216 },
    { left: 304, top: 128, right: 356, bottom: 184 },
    { left: 340, top: 184, right: 368, bottom: 216 },
    { left: 287, top: 4, right: 491, bottom: 64 },
  ],
};

const YOJIMBO_FIELD: AdvisorZoneInput = {
  cmdArea: { left: 30, top: 231, right: 204, bottom: 335 },
  cmdInfo: { left: 24, top: 121, right: 196, bottom: 154 },
  partyStatus: { left: 402, top: 258, right: 617, bottom: 348 },
  guide: { left: 21, top: 44, right: 154, bottom: 100 },
  sensor: { left: 434, top: 166, right: 478, bottom: 176 },
  chipReserve: 0,
  intent: null,
  intentChip: { left: 552, top: 36, right: 620, bottom: 52 },
  ctb: { left: 554, top: 49, right: 621, bottom: 201 },
  sprites: [
    { left: 192, top: 228, right: 280, bottom: 328 },
    { left: 244, top: 220, right: 328, bottom: 316 },
    { left: 316, top: 228, right: 404, bottom: 328 },
  ],
  enemies: [
    { left: 352, top: 132, right: 440, bottom: 232 },
    { left: 300, top: 140, right: 352, bottom: 200 },
    { left: 336, top: 200, right: 364, bottom: 232 },
    { left: 287, top: 4, right: 491, bottom: 64 },
  ],
};

const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** The card's painted box (its layout box plus the shear's reach on both sides). */
function painted(zone: AdvisorZone): Rect {
  const reach = (SKEW * zone.maxHeight) / 2;
  const bottom = 360 - zone.bottom;
  return { left: zone.left - reach, right: zone.left + zone.width + reach, top: bottom - zone.maxHeight, bottom };
}

function expectClear(input: AdvisorZoneInput, zone: AdvisorZone): void {
  const card = painted(zone);
  for (const o of obstaclesOf(input)) expect(overlap(card, o), JSON.stringify(o)).toBe(false);
}

describe('PR-0330: the advisor card keeps its detail lines under the colossus framing', () => {
  it("Chapter III: the designed solver settles for compact, the card gets the full-width box instead", () => {
    expect(advisorZone(BFA_COLOSSUS)!.kind).toBe('compact');
    const zone = withStrip(BFA_COLOSSUS)!;
    expect(zone.kind).not.toBe('compact');
    expect(zone.width).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
    expect(zone.maxHeight).toBeGreaterThanOrEqual(SHORT_ADVISOR_HEIGHT);
    expectClear(BFA_COLOSSUS, zone);
  });

  it('Chapter IX: the compact card takes the slot with the most card, not the tallest raw box', () => {
    const designed = advisorZone(YOJIMBO_COLOSSUS)!;
    expect(designed.kind).toBe('compact');
    expect(shortFullZone(YOJIMBO_COLOSSUS)).toBeNull();
    const zone = withStrip(YOJIMBO_COLOSSUS)!;
    expect(zone.kind).toBe('compact');
    expect(cardArea(zone)).toBeGreaterThan(cardArea(designed));
    // today's rig printed this card in a 100 x 98 slot; the colossus rig now offers the same one
    expect(zone.width).toBeGreaterThanOrEqual(100);
    expect(zone.maxHeight).toBeGreaterThanOrEqual(98);
    expectClear(YOJIMBO_COLOSSUS, zone);
  });

  it("today's rig is not touched: the same answer as the designed solver, to the pixel", () => {
    expect(withStrip(BFA_FIELD)).toEqual(advisorZone(BFA_FIELD));
    expect(advisorZone(BFA_FIELD)!.kind).not.toBe('compact');
    const yoj = withStrip(YOJIMBO_FIELD)!;
    expect(yoj.width).toBeCloseTo(100.17, 1);
    expect(yoj.maxHeight).toBeCloseTo(98, 5);
  });

  it('a declined card stays declined, and a designed full card is returned as it was', () => {
    expect(roomier(BFA_COLOSSUS, null)).toBeNull();
    const full = advisorZone(BFA_FIELD)!;
    expect(roomier(BFA_FIELD, full)).toBe(full);
    expect(roomiestCompactZone({ ...BFA_COLOSSUS, enemies: [{ left: 0, top: 0, right: 640, bottom: 360 }] })).toBeNull();
  });
});
