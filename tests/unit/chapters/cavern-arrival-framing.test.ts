/**
 * **Chapter IX's arrival and enemy shot (FFX only): PR-0184, PR-0185, R15-02.**
 *
 * - PR-0185: the `enemy` rig (the boss reveal's push and every Yojimbo turn)
 *   cut the tops of Lulu's, Kimahri's and Yuna's heads along the bottom edge.
 *   Measured with a real three.js camera on the scene's own rigs, with and
 *   without the reveal's 0.12 dolly push: every party figure is either wholly
 *   in frame or wholly below it, at 1280x720, 1600x900 and 2000x1012.
 *   Yojimbo and Daigoro stay whole on screen.
 * - PR-0184: the approved tree (sheet-arrival A) stands on the floor: the
 *   plane's base is sunk to the painting's own root line, it is drawn after the
 *   night that lies on the floor (which used to darken its trunk away), and its
 *   sides and top fade out through an alpha ramp, so no straight plate edge.
 * - R15-02: the painted tree is loaded by one GET; the HEAD probe that Chromium
 *   aborted on every Chapter IX entry is gone.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { PerspectiveCamera, Vector3 } from 'three';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CAVERN_ACTOR_HEIGHTS as H,
  CAVERN_ENEMY_SLOT,
  CAVERN_STOLEN_FAYTH_SLOTS as SLOTS,
} from '../../../src/scenes/cavern-stolen-fayth.ts';
import { cavernRigsFor } from '../../../src/scenes/cavern-stolen-fayth-rigs.ts';
import { SAKURA_TREE_ROOT, sakuraEdgeAlpha, SAKURA_TREE_URL } from '../../../src/scenes/cavern-stolen-fayth-arrival.ts';
import type { CameraRig } from '../../../src/engine/BattleCamera.ts';

type Box = [number, number, number, number];
const ASPECT: Record<string, number> = { lulu: 0.4, kimahri: 0.631, yuna: 0.739, yojimbo: 0.658, daigoro: 0.989 };

function cam(rig: CameraRig, w: number, h: number, push: number): PerspectiveCamera {
  const p = rig.position as [number, number, number];
  const l = rig.lookAt as [number, number, number];
  const c = new PerspectiveCamera(rig.fov ?? 30, w / h, 0.1, 200);
  c.position.set(...(p.map((v, i) => v + (l[i]! - v) * push) as [number, number, number]));
  c.lookAt(new Vector3(...l));
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
}

function boxOf(c: PerspectiveCamera, spot: readonly number[], height: number, aspect: number, vw: number, vh: number): Box {
  const w = height * aspect;
  const pts = [
    [-w / 2, 0],
    [w / 2, 0],
    [-w / 2, height],
    [w / 2, height],
  ].map(([dx, dy]) => new Vector3(spot[0]! + dx!, spot[1]! + dy!, spot[2]!).project(c));
  const xs = pts.map((p) => ((p.x + 1) / 2) * vw);
  const ys = pts.map((p) => ((1 - p.y) / 2) * vh);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

const SIZES: Array<[number, number]> = [
  [1280, 720],
  [1600, 900],
  [2000, 1012],
  // 4:3: this rig alone did not clear the party there (heights 5.0-6.2 tried, 2026-09-26);
  // with iter2-b2's `holdBottom` (the fov opens upward only) merged in, it does.
  [1280, 960],
];

describe('PR-0185: the enemy shot cuts no party head (Chapter IX, FFX)', () => {
  for (const [w, h] of SIZES) {
    for (const push of [0, 0.06, 0.12]) {
      it(`${w}x${h}, push ${push}: every party figure wholly in or wholly below the frame; Yojimbo and Daigoro whole`, () => {
        const c = cam(cavernRigsFor(w / h).enemy!, w, h, push);
        const [lulu, kimahri, yuna] = SLOTS.party;
        const party = { lulu, kimahri, yuna };
        for (const [id, spot] of Object.entries(party)) {
          const b = boxOf(c, spot!, H.party, ASPECT[id]!, w, h);
          const straddles = b[1] < h && b[3] > h;
          expect(straddles, `${id} top ${b[1].toFixed(0)} bottom ${b[3].toFixed(0)} of ${h}`).toBe(false);
        }
        const e = SLOTS.enemy;
        const yo = boxOf(c, e[CAVERN_ENEMY_SLOT.yojimbo]!, H.yojimbo, ASPECT.yojimbo!, w, h);
        const dg = boxOf(c, e[CAVERN_ENEMY_SLOT.daigoro]!, H.daigoro, ASPECT.daigoro!, w, h);
        for (const b of [yo, dg]) {
          expect(b[0]).toBeGreaterThanOrEqual(0);
          expect(b[1]).toBeGreaterThanOrEqual(0);
          expect(b[2]).toBeLessThanOrEqual(w);
          expect(b[3]).toBeLessThanOrEqual(h);
        }
        // Still his close-up: Yojimbo at least a third of the frame's 16:9 height (a narrower
        // screen keeps 16:9's width and gains rows, so it is measured against that band).
        expect((yo[3] - yo[1]) / Math.min(h, (w * 9) / 16)).toBeGreaterThan(0.33);
      });
    }
  }
});

describe('PR-0184: the sakura tree stands on the floor with no plate edge', () => {
  it("sinks the plane to the painting's root line (the lowest painted row, ~86% down the 1024 canvas)", () => {
    expect(SAKURA_TREE_ROOT).toBeGreaterThan(0.8);
    expect(SAKURA_TREE_ROOT).toBeLessThan(0.92);
  });

  it('fades the sides and the top to nothing and leaves the trunk and root whole', () => {
    // u, v in 0..1 with v = 0 at the top of the canvas.
    expect(sakuraEdgeAlpha(0, 0.5)).toBe(0);
    expect(sakuraEdgeAlpha(1, 0.5)).toBe(0);
    expect(sakuraEdgeAlpha(0.5, 0)).toBe(0);
    expect(sakuraEdgeAlpha(0.5, 0.5)).toBe(1);
    expect(sakuraEdgeAlpha(0.5, 0.86)).toBe(1); // the root line
    expect(sakuraEdgeAlpha(0.5, 1)).toBe(1); // the base is never faded
    // A soft ramp, not a step: the row through the canopy passes through part-transparent values.
    const row = Array.from({ length: 200 }, (_, i) => sakuraEdgeAlpha(i / 199, 0.5));
    expect(row.filter((a) => a > 0.1 && a < 0.9).length).toBeGreaterThanOrEqual(8);
  });

  // L-0 browser check (2026-09-27): a fade that runs parallel to the plate's side still read as a
  // soft vertical column where the canopy ends at 2000x1012. The half-alpha line must wander.
  it('ends the canopy on an irregular line, not a straight fade parallel to the plate edge', () => {
    const halfLine = (side: 'left' | 'right' | 'top', lum = 0): number[] =>
      Array.from({ length: 23 }, (_, j) => {
        const t = 0.12 + (j / 22) * 0.6; // along the edge, through the canopy
        for (let i = 0; i <= 400; i++) {
          const d = i / 800; // inward from the edge
          const a = side === 'left' ? sakuraEdgeAlpha(d, t, lum) : side === 'right' ? sakuraEdgeAlpha(1 - d, t, lum) : sakuraEdgeAlpha(t, d, lum);
          if (a >= 0.5) return d;
        }
        return 0.5;
      });
    // Keyed to the painting: a bright blossom clump in the band keeps more of itself than the dark
    // gap beside it, so the canopy ends along its own clumps; the plate edge is 0 whatever the pixel.
    for (const side of ['left', 'right', 'top'] as const) {
      const dark = halfLine(side, 0);
      const bright = halfLine(side, 1);
      const gain = dark.reduce((s, d, j) => s + d - bright[j]!, 0) / dark.length;
      expect(gain, `${side}: a bright clump keeps itself ${gain.toFixed(3)} nearer the edge`).toBeGreaterThanOrEqual(0.03);
    }
    for (const t of [0.1, 0.3, 0.5, 0.7]) {
      expect(sakuraEdgeAlpha(0, t, 1)).toBe(0);
      expect(sakuraEdgeAlpha(1, t, 1)).toBe(0);
      expect(sakuraEdgeAlpha(t, 0, 1)).toBe(0);
    }
    for (const side of ['left', 'right', 'top'] as const) {
      const line = halfLine(side);
      const range = Math.max(...line) - Math.min(...line);
      expect(range, `${side} half-alpha line spans ${range.toFixed(3)}`).toBeGreaterThanOrEqual(0.05);
      // Not a straight slope either: it turns back at least twice.
      let turns = 0;
      for (let j = 2; j < line.length; j++) if ((line[j]! - line[j - 1]!) * (line[j - 1]! - line[j - 2]!) < 0) turns++;
      expect(turns, `${side} half-alpha line direction changes`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('R15-02: one request for the painted tree, never an aborted HEAD', () => {
  // The factory needs a DOM, so the network half is the browser pass (docs/handoff/t1-b2b.md).
  it('the arrival module makes no HEAD probe for sakura.png', () => {
    const src = readFileSync(new URL('../../../src/scenes/cavern-stolen-fayth-arrival.ts', import.meta.url), 'utf8');
    expect(SAKURA_TREE_URL).toMatch(/sakura\.png$/);
    expect(src).not.toMatch(/method:\s*'HEAD'/);
  });
});
