/**
 * R13-02 (release 13 focused review, FFX only, Chapter I): the advisor card's
 * enemy obstacle is the union of the head/feet estimate and the painted
 * silhouette the target bracket is drawn on, so the NEXT BEST MOVE card can no
 * longer be solved onto the box the bracket will frame.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */
import { describe, expect, it } from 'vitest';
import { AIRSHIP_RANGE } from '../../src/battle/ffx/ai/evrae-rules.ts';
import { EVRAE_ID } from '../../src/data/ffx/enemies/evrae.ts';
import { enemyObstacleRect } from '../../src/ui/ffx/enemyObstacleRect.ts';
import { advisorZone, SKEW, type AdvisorZoneInput, type Rect } from '../../src/ui/ffx/hudSafeZones.ts';

const noFlags = { flags: {} };
/** 1600x900 has no letterbox: one grid px is 2.5 CSS px. */
const toGrid = (x: number, y: number) => ({ x: x / 2.5, y: y / 2.5 });

describe('enemyObstacleRect', () => {
  const estimate: Rect = { left: 300, top: 60, right: 380, bottom: 170 };

  it('keeps the estimate when the field cannot answer (mocks, fixtures)', () => {
    expect(enemyObstacleRect(estimate, 'mortiorchis', noFlags, null, toGrid)).toEqual(estimate);
    expect(enemyObstacleRect(estimate, 'mortiorchis', noFlags, { x: 0, y: 0, w: 0, h: 10 }, toGrid)).toEqual(estimate);
  });

  it('grows to the painted silhouette and never shrinks the estimate', () => {
    // Mortiorchis's bracket at the release-13 build, 1600x900: x 646..973, y 185..433 CSS px.
    const got = enemyObstacleRect(estimate, 'mortiorchis', noFlags, { x: 646, y: 185, w: 327, h: 248 }, toGrid);
    expect(got.left).toBeCloseTo(258.4, 5);
    expect(got.top).toBe(60);
    expect(got.right).toBeCloseTo(389.2, 5);
    expect(got.bottom).toBeCloseTo(173.2, 5);
  });

  it('leaves Evrae at FAR to its own sourced rule (the real box replaces the estimate)', () => {
    const far = { flags: { [AIRSHIP_RANGE]: 'far' } };
    const got = enemyObstacleRect(estimate, EVRAE_ID, far, { x: 1000, y: 250, w: 250, h: 100 }, toGrid);
    expect(got).toEqual({ left: 400, top: 100, right: 500, bottom: 140 });
  });
});

/** The card's painted box on the grid (the skew widens it by `SKEW * height`). */
function painted(zone: { left: number; width: number; bottom: number }, height: number): Rect {
  const reach = (SKEW * height) / 2;
  return { left: zone.left - reach, right: zone.left + zone.width + reach, top: 360 - zone.bottom - height, bottom: 360 - zone.bottom };
}
const overlap = (a: Rect, b: Rect): number =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

describe('R13-02: the advisor card is solved clear of the bracketed silhouette', () => {
  // A Chapter I-shaped board on the 640x360 grid: the guide top-left, the
  // command stack bottom-left, the party-status column and the turn list right.
  const board: AdvisorZoneInput = {
    cmdArea: { left: 30, top: 178, right: 211, bottom: 334 },
    cmdInfo: { left: 28, top: 135, right: 192, bottom: 154 },
    partyStatus: { left: 403, top: 258, right: 617, bottom: 348 },
    guide: { left: 20, top: 32, right: 153, bottom: 111 },
    sensor: null,
    intent: null,
    intentChip: null,
    ctb: { left: 540, top: 38, right: 620, bottom: 196 },
    sprites: [
      { left: 205, top: 160, right: 262, bottom: 315 },
      { left: 245, top: 155, right: 300, bottom: 290 },
      { left: 290, top: 165, right: 345, bottom: 300 },
    ],
    enemies: [],
  };
  // The estimate Mortiorchis was given, and the silhouette the bracket frames.
  const estimate: Rect = { left: 300, top: 88, right: 372, bottom: 175 };
  const real = { x: 646, y: 185, w: 327, h: 248 };
  const silhouette: Rect = { left: 258.4, top: 74, right: 389.2, bottom: 173.2 };

  it('with the estimate alone the card may take the band the bracket crosses', () => {
    const zone = advisorZone({ ...board, enemies: [estimate] });
    expect(zone).not.toBeNull();
    const card = painted(zone!, zone!.maxHeight);
    expect(overlap(card, silhouette)).toBeGreaterThan(0);
  });

  it('with the union the card, at its tallest, touches none of the silhouette', () => {
    const obstacle = enemyObstacleRect(estimate, 'mortiorchis', noFlags, real, toGrid);
    const zone = advisorZone({ ...board, enemies: [obstacle] });
    expect(zone).not.toBeNull();
    expect(overlap(painted(zone!, zone!.maxHeight), silhouette)).toBe(0);
  });
});
