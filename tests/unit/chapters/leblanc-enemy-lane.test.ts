/**
 * **Chapter VI's staging: the Syndicate stands bigger and nearer the party, the camera as it was (FFX-2 only; branch r3941-stage).**
 *
 * Bailey, 2026-10-07, "Option 3: bosses forward": every fiend at its real size (`data/ffx2/syndicate-stature.ts`), the fiends' lane brought closer to the
 * party, the camera, lens and rigs unchanged. This file pins that against the scene's own tables, projected through the camera the battle holds at the first
 * command menu at 1600x900 (the numbers are measured; `docs/handoff/r3941-stage.md` has the pictures and the browser pass).
 *
 * It **replaces PR-0136's lane test** (round 13: "no enemy within 150 px of a girl; the lane in the right half; inside the rail"), whose premise was a
 * lane of small fiends at 3.2 to 6.8 units. The pick moves the lane to the party's depth by design; the nearest fiend now stands 112 px or more from Paine,
 * the left-most fiend's centre is at the middle of the frame, and the rail and the command list are still kept (below).
 *
 * Three HUD boxes bound the fiends, and the staging is solved against them (`scenes/leblanc-staging.ts`):
 * - the enemy-intent card hangs from the acting fiend's head and is held under the top bar: 327 px tall at most, its bottom edge at y 409, so every head
 *   stands level at y 411 or lower in Act I (its one tall card) and within 14 px of the others' in Acts II and III;
 * - the move-advisor card, capped, has its top at y 742, so the nearest feet (Ormi, Act I, y 721) stand clear of it;
 * - the command list begins at x 1246 and the FFX-2 rail is 0.72 of the canvas (1152).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: Chateau Leblanc, FFX-2 Chapter 2.
 */

import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  LEBLANC_ENEMY_LANE_X,
  LEBLANC_ENEMY_SPOTS,
  LEBLANC_FIGURE_HEIGHTS,
  LEBLANC_LAST_ROOM_ACTOR_HEIGHTS,
  LEBLANC_LAST_ROOM_RIGS,
  LEBLANC_LAST_ROOM_SLOTS,
} from '../../../src/scenes/leblanc-last-room.ts';
import { LEBLANC_ENEMY_SLOTS, LEBLANC_PARTY_HEIGHT, LEBLANC_TRIO_POOL } from '../../../src/scenes/leblanc-staging.ts';
import { LEBLANC_ACT_I, LEBLANC_ACT_II, LEBLANC_ACT_III } from '../../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx2/index.ts';
import { syndicateFigureHeights } from '../../../src/data/ffx2/syndicate-stature.ts';

const W = 1600;
const H = 900;
/** The FFX-2 HUD's rail (ENGINE-API "HUD safe area") and the command list's left edge, at 1600x900 (measured). */
const RAIL = 0.72 * W;
const STACK_LEFT = 1246;
/** The capped move-advisor card's top edge at 1600x900 (measured, `LEBLANC_ADVISOR_CAP`), and the intent card's lowest bottom edge (the tall Blizzard card, held under the top bar). */
const ADVISOR_TOP = 742;
const INTENT_BOTTOM = 409;

/**
 * The camera as the battle holds it at the first menu, measured in GPU Chromium (seed 1, 1600x900): the `idle` rig's pose plus the stage's settled drift
 * (0.02 to 0.14 across runs). The rig itself is pinned in the first block; this is the pose the figures are seen through.
 */
const FIRST_MENU_CAMERA = { position: [0.024, 2.869, 9.253], lookAt: [0.54, 1.55, -1.362], fov: 32 } as const;

function camera(): PerspectiveCamera {
  const c = new PerspectiveCamera(FIRST_MENU_CAMERA.fov, W / H, 0.1, 200);
  c.position.set(...FIRST_MENU_CAMERA.position);
  c.lookAt(new Vector3(...FIRST_MENU_CAMERA.lookAt));
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  return c;
}
const cam = camera();
const screen = (x: number, y: number, z: number): { x: number; y: number } => {
  const p = new Vector3(x, y, z).project(cam);
  return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H };
};

/** A figure of world height `h` standing at `(x, z)`: its feet and the top of its stature on screen, its standing height in px. */
function figure(x: number, z: number, h: number): { cx: number; feet: number; top: number; px: number } {
  const f = screen(x, 0, z);
  const t = screen(x, h, z);
  return { cx: f.x, feet: f.y, top: t.y, px: f.y - t.y };
}

/** Half the figure's painted width over its standing height (measured at the first menus; a generous bound, the rail and the list are what it is checked against). */
const HALF_WIDTH = { 'dr-goon': 0.24, 'fem-goon': 0.2, leblanc: 0.33, logos: 0.27, ormi: 0.21 } as const;
const halfWidthOf = (id: string): number => (id.startsWith('ormi') ? HALF_WIDTH.ormi : id.startsWith('logos') ? HALF_WIDTH.logos : HALF_WIDTH[id as 'dr-goon' | 'fem-goon' | 'leblanc']);

const ACTS: ReadonlyArray<{ name: string; id: string; tallCard: boolean }> = [
  { name: 'Act I', id: LEBLANC_ACT_I, tallCard: true }, // Fem-Goon's Blizzard on the whole party: the 327 px card
  { name: 'Act II', id: LEBLANC_ACT_II, tallCard: false },
  { name: 'Act III', id: LEBLANC_ACT_III, tallCard: false },
];
const fiendsOf = (actId: string): string[] => ENEMY_GROUPS_BY_ID[actId]!.enemies.map((e) => e.id);

// The girls' standing height on screen: the unit "bosses forward" is measured in.
const girls = LEBLANC_LAST_ROOM_SLOTS.party.map((s) => figure(s[0]!, s[2]!, LEBLANC_PARTY_HEIGHT));
const girlsMeanPx = girls.reduce((sum, g) => sum + g.px, 0) / girls.length;
const paineRight = Math.max(...girls.map((g) => g.cx + 0.17 * g.px)); // a girl's painted half-width is about 0.17 of her standing height

describe('the camera is as it was (Option 3 leaves the camera, the lens and the rigs alone)', () => {
  const rigs = LEBLANC_LAST_ROOM_RIGS;

  it('the four rigs hold the numbers they held on origin/r394-int, to the digit', () => {
    expect(rigs.intro).toEqual({ position: [0.3, 4.4, 14.6], lookAt: [0.9, 2.1, -3.4], fov: 30, sway: 1.4 });
    expect(rigs.idle).toEqual({ position: [0, 2.8, 9.4], lookAt: [0.55, 1.55, -1.35], fov: 32 });
    expect(rigs.action).toEqual({ position: [0.2, 2.55, 8.9], lookAt: [1.05, 1.5, -1.15], fov: 32, sway: 0.7 });
    expect(rigs.victory).toEqual({ position: [0.35, 2.15, 8.4], lookAt: [-0.55, 1.4, 0.85], fov: 32, sway: 1.2 });
    expect(Object.keys(rigs).sort()).toEqual(['action', 'idle', 'intro', 'victory']);
  });

  it('the pose the figures are measured through is the idle rig\'s, to the settled drift', () => {
    const idle = rigs.idle!;
    const [px, py, pz] = idle.position as [number, number, number];
    const [lx, ly, lz] = idle.lookAt as [number, number, number];
    expect(Math.abs(px - FIRST_MENU_CAMERA.position[0])).toBeLessThan(0.25);
    expect(Math.abs(py - FIRST_MENU_CAMERA.position[1])).toBeLessThan(0.25);
    expect(Math.abs(pz - FIRST_MENU_CAMERA.position[2])).toBeLessThan(0.25);
    expect(Math.abs(lx - FIRST_MENU_CAMERA.lookAt[0])).toBeLessThan(0.1);
    expect(Math.abs(ly - FIRST_MENU_CAMERA.lookAt[1])).toBeLessThan(0.1);
    expect(Math.abs(lz - FIRST_MENU_CAMERA.lookAt[2])).toBeLessThan(0.1);
    expect(idle.fov).toBe(FIRST_MENU_CAMERA.fov);
  });
});

describe('the tables the stage reads', () => {
  it('every fiend of every act has a standing spot and a real height, and the room publishes both', () => {
    for (const act of ACTS) {
      for (const id of fiendsOf(act.id)) {
        expect(LEBLANC_ENEMY_SPOTS[id], `${act.name} ${id}: a spot`).toBeDefined();
        expect(LEBLANC_FIGURE_HEIGHTS[id], `${act.name} ${id}: a height`).toBeGreaterThan(1.6);
      }
    }
    expect(Object.keys(LEBLANC_ENEMY_SPOTS).sort()).toEqual(Object.keys(LEBLANC_FIGURE_HEIGHTS).sort());
    expect(LEBLANC_LAST_ROOM_SLOTS.enemySpots).toBe(LEBLANC_ENEMY_SPOTS);
    expect(LEBLANC_LAST_ROOM_SLOTS.figureHeights).toBe(LEBLANC_FIGURE_HEIGHTS);
    expect(LEBLANC_FIGURE_HEIGHTS).toEqual(syndicateFigureHeights(LEBLANC_PARTY_HEIGHT));
  });

  it('the girls stand as before (1.68, three slots, never moved) and the boss default is Leblanc\'s own height', () => {
    expect(LEBLANC_PARTY_HEIGHT).toBe(1.68);
    expect(LEBLANC_LAST_ROOM_SLOTS.partyHeight).toBe(1.68);
    expect(LEBLANC_LAST_ROOM_SLOTS.party).toEqual([[-2.05, 0, 1.45], [-1.3, 0, 0.1], [-0.9, 0, -1.5]]);
    expect(LEBLANC_LAST_ROOM_SLOTS.enemyHeight).toBe(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc);
  });

  it('the slot table is Act III\'s trio in the engine\'s slot order (0 Leblanc, 1 Logos, 2 Ormi), flanking: Ormi left of Leblanc, Logos right', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.enemy).toEqual(LEBLANC_ENEMY_SLOTS.map((s) => [...s]));
    const [leblanc, logos, ormi] = LEBLANC_ENEMY_SLOTS as ReadonlyArray<readonly [number, number, number]>;
    expect(ormi![0]).toBeLessThan(leblanc![0]);
    expect(logos![0]).toBeGreaterThan(leblanc![0]);
    expect(leblanc!).toEqual(LEBLANC_ENEMY_SPOTS['leblanc']);
  });

  it('the fallback lane spans the spots, and the pool under the trio lies between them', () => {
    const xs = Object.values(LEBLANC_ENEMY_SPOTS).map((s) => s[0]);
    expect(LEBLANC_ENEMY_LANE_X[0]).toBeLessThanOrEqual(Math.min(...xs));
    expect(LEBLANC_ENEMY_LANE_X[1]).toBeGreaterThanOrEqual(Math.max(...xs) - 0.1);
    expect(LEBLANC_TRIO_POOL[0]).toBeGreaterThan(Math.min(...xs));
    expect(LEBLANC_TRIO_POOL[0]).toBeLessThan(Math.max(...xs));
  });
});

describe.each(ACTS)('$name at 1600x900: the Syndicate, through the first-menu camera', ({ id, tallCard }) => {
  const ids = fiendsOf(id);
  const seen = ids.map((fid) => {
    const s = LEBLANC_ENEMY_SPOTS[fid]!;
    const f = figure(s[0], s[2], LEBLANC_FIGURE_HEIGHTS[fid]!);
    const half = halfWidthOf(fid) * f.px;
    return { id: fid, spot: s, ...f, ratio: f.px / girlsMeanPx, left: f.cx - half, right: f.cx + half };
  });

  it('stands big: 0.68 to 1.2 of a girl on screen (they were 0.44 to 0.71), the nearest no larger than the girls\' front figure', () => {
    for (const f of seen) {
      expect(f.ratio, f.id).toBeGreaterThanOrEqual(0.68);
      expect(f.ratio, f.id).toBeLessThanOrEqual(1.2);
    }
    expect(Math.max(...seen.map((f) => f.px))).toBeLessThan(Math.max(...girls.map((g) => g.px)));
  });

  it('stands with the heads level, below the intent card\'s lowest edge where its tall card can show, so the card covers no one\'s head whoever acts', () => {
    const tops = seen.map((f) => f.top);
    if (tallCard) {
      expect(Math.min(...tops), 'a head above y 409 sits under the 327 px card').toBeGreaterThanOrEqual(INTENT_BOTTOM);
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(8);
    } else {
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(14);
    }
  });

  it('keeps its feet clear of the capped move-advisor card', () => {
    for (const f of seen) expect(f.feet, f.id).toBeLessThanOrEqual(ADVISOR_TOP - 5);
  });

  it('keeps clear of the command list and inside the rail, and 90 px or more from the girls', () => {
    for (const f of seen) {
      expect(f.right, `${f.id} against the rail`).toBeLessThanOrEqual(RAIL);
      expect(STACK_LEFT - f.right, `${f.id} against the command list`).toBeGreaterThanOrEqual(80);
      expect(f.left - paineRight, `${f.id} against Paine`).toBeGreaterThanOrEqual(90);
    }
  });

  it('stands on the enemy side: behind the party\'s middle girl, right of the party arc, no two on one spot', () => {
    for (const f of seen) {
      expect(f.spot[2], f.id).toBeLessThanOrEqual(-0.1);
      expect(f.spot[0], f.id).toBeGreaterThan(-0.9 + 1);
    }
    for (let i = 0; i < seen.length; i++) {
      for (let j = i + 1; j < seen.length; j++) {
        const d = Math.hypot(seen[i]!.spot[0] - seen[j]!.spot[0], seen[i]!.spot[2] - seen[j]!.spot[2]);
        expect(d, `${seen[i]!.id} and ${seen[j]!.id}`).toBeGreaterThanOrEqual(0.9);
      }
    }
  });
});
