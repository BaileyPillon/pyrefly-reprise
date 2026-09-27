/**
 * **PR-0136: the Syndicate stands across the floor from the party (FFX-2 only, Chapter VI).**
 *
 * Round 09 to 13: at party scale the goons, Logos and Ormi queued in one file
 * right behind Paine, about 70 px (later 100 px) from her at 1600x900. The
 * acceptance: no enemy within 150 px of a girl in the default framing, and the
 * enemies in the right half. The lane the formation solver packs them into
 * (`LEBLANC_ENEMY_LANE_X`) is measured here through the scene's own `idle`
 * camera at 1600x900; the browser pass (docs/handoff/t1-b2b.md) measured the
 * real rectangles at links 1 to 3.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: Chateau Leblanc, FFX-2 Chapter 2.
 */

import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  LEBLANC_ENEMY_LANE_X,
  LEBLANC_LAST_ROOM_RIGS,
  LEBLANC_LAST_ROOM_SLOTS,
} from '../../../src/scenes/leblanc-last-room.ts';

const W = 1600;
const H = 900;
/** Half a Syndicate figure's painted width, world units (Dr. Goon 57 px at ~115 px per unit). */
const HALF_FIGURE = 0.25;
/** The FFX-2 HUD rail: fiends stay left of 0.72 of the canvas (ENGINE-API "HUD safe area"). */
const RAIL = 0.72 * W;

function idleCamera(): PerspectiveCamera {
  const r = LEBLANC_LAST_ROOM_RIGS.idle!;
  const c = new PerspectiveCamera(r.fov ?? 32, W / H, 0.1, 200);
  c.position.set(...(r.position as [number, number, number]));
  c.lookAt(new Vector3(...(r.lookAt as [number, number, number])));
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
}
const px = (c: PerspectiveCamera, x: number, z: number): number => ((new Vector3(x, 0.9, z).project(c).x + 1) / 2) * W;

describe('PR-0136: the Chapter VI enemy lane, at 1600x900 (FFX-2)', () => {
  const cam = idleCamera();
  const depths = LEBLANC_LAST_ROOM_SLOTS.enemy.map((s) => s[2]!);
  const paineRight = Math.max(...LEBLANC_LAST_ROOM_SLOTS.party.map((s) => px(cam, s[0]! + HALF_FIGURE, s[2]!)));
  const [left, right] = LEBLANC_ENEMY_LANE_X;

  it('puts the leftmost fiend at least 150 px right of the nearest girl, at every enemy depth', () => {
    for (const z of depths) expect(px(cam, left - HALF_FIGURE, z) - paineRight, `z ${z}`).toBeGreaterThanOrEqual(150);
  });

  it('stands the lane in the right half of the frame', () => {
    for (const z of depths) expect(px(cam, left, z), `z ${z}`).toBeGreaterThanOrEqual(W / 2);
  });

  it('keeps the rightmost fiend inside the FFX-2 HUD rail', () => {
    for (const z of depths) expect(px(cam, right + HALF_FIGURE, z), `z ${z}`).toBeLessThan(RAIL);
  });
});
