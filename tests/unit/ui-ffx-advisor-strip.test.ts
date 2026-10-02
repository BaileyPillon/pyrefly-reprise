import { describe, expect, it } from 'vitest';

import { advisorZone as withStrip, STRIP_MIN_HEIGHT } from '../../src/ui/ffx/advisorStrip.ts';
import { advisorZone, obstaclesOf, type AdvisorZoneInput, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';

/**
 * F3 / PR-0274 (FFX only): at the first command menu of both Sin chapters the
 * designed solver finds no clear box, so the card was declined and the player saw no
 * advice. The inputs below are the ones the FFX HUD handed the solver, read off a
 * real run at 2000x1012 (XVII) and 1600x900 (XVIII); the grid is 640x360.
 */
const COMMON = {
  cmdArea: { left: 30, top: 177, right: 218, bottom: 335 },
  cmdInfo: { left: 24, top: 121, right: 196, bottom: 154 },
  partyStatus: { left: 402, top: 258, right: 617, bottom: 348 },
  guide: { left: 21, top: 44, right: 154, bottom: 100 },
  sensor: null,
  chipReserve: 0,
  intent: null,
  ctb: { left: 561, top: 49, right: 621, bottom: 201 },
  sprites: [
    { left: 268, top: 188, right: 348, bottom: 280 },
    { left: 240, top: 184, right: 304, bottom: 256 },
    { left: 352, top: 184, right: 416, bottom: 256 },
  ],
} as const;

const XVII: AdvisorZoneInput = {
  ...COMMON,
  intentChip: { left: 556, top: 36, right: 620, bottom: 52 },
  enemies: [
    { left: 212, top: 48, right: 648, bottom: 228 },
    { left: 324, top: 22, right: 520, bottom: 54 },
  ],
};
const XVIII: AdvisorZoneInput = {
  ...COMMON,
  intentChip: { left: 552, top: 36, right: 620, bottom: 52 },
  enemies: [
    { left: 284, top: -48, right: 676, bottom: 168 },
    { left: 200, top: 12, right: 295, bottom: 132 },
    { left: 200, top: 140, right: 295, bottom: 152 },
  ],
};

const overlap = (a: Rect, b: Rect): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

describe('the advisor card keeps a strip on the deck when no designed box exists', () => {
  for (const [name, input] of [['XVII', XVII], ['XVIII', XVIII]] as const) {
    it(`${name}: the designed solver declines, the strip does not, and it is clear of every panel and fighter`, () => {
      expect(advisorZone(input)).toBeNull();
      expect(withStrip(input)).toBeNull(); // not a Sin fight: the designed answer stands
      const zone = withStrip(input, true);
      expect(zone).not.toBeNull();
      expect(zone!.kind).toBe('compact');
      expect(zone!.maxHeight).toBeGreaterThanOrEqual(STRIP_MIN_HEIGHT);
      expect(zone!.width).toBeGreaterThanOrEqual(120);
      const top = 360 - zone!.bottom - zone!.maxHeight;
      const card: Rect = { left: zone!.left, right: zone!.left + zone!.width, top, bottom: 360 - zone!.bottom };
      for (const o of obstaclesOf(input)) expect(overlap(card, o), JSON.stringify(o)).toBe(false);
    });
  }

  it('a screen the designed solver can serve is answered by it, unchanged (no other chapter moves)', () => {
    const open: AdvisorZoneInput = { ...COMMON, intentChip: null, guide: null, enemies: [{ left: 420, top: 20, right: 560, bottom: 150 }] };
    const designed = advisorZone(open);
    expect(designed).not.toBeNull();
    expect(withStrip(open, true)).toEqual(designed);
  });

  it('a screen with no clear ground at all still declines', () => {
    const full: AdvisorZoneInput = { ...XVII, enemies: [{ left: 0, top: 0, right: 640, bottom: 360 }] };
    expect(withStrip(full, true)).toBeNull();
  });
});
