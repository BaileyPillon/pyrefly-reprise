/**
 * **Chapter VI's staging: the Syndicate at its real size, standing where release 39.4 stood it, the camera as it was (FFX-2 only; branch r3941-spacing).**
 *
 * Bailey, 2026-10-08, on release 39.4.1's "bosses forward" lane: "The way the battles are framed now being right next to each other is kinda dumb in the Leblanc
 * chapter it looked way better before". Asked how the chapter should look he picked "Old spacing, real sizes": the gap and the camera exactly as 39.4 had them,
 * the Syndicate at their real size (`data/ffx2/syndicate-stature.ts`: Ormi 1.15, Logos 1.26, Leblanc 1.05, Dr. Goon 1.10, Fem-Goon 1.01 of a girl).
 *
 * This file **replaces r3941-stage's lane test** (which pinned the opposite: heads level, fiends at the party's depth, 0.68 to 1.2 of a girl) and pins the pick
 * against the scene's own tables, projected through the camera the battle holds at the first command menu at 1600x900 (the numbers are measured in the browser;
 * `docs/handoff/r3941-spacing.md` has the pictures and the three-way table). Four things are pinned:
 * - **the camera is as it was**: the four rigs, to the digit;
 * - **the spots are 39.4's**: every fiend of the three acts stands where 39.4 stood it, to the hundredth, and the formation solver of the engine, given 39.4's
 *   heights, its slot table and its lane, still derives them (Acts I and II exactly; Act III before the stage's screen-space relaxation moved two silhouettes
 *   0.2 apart, which is the one difference);
 * - **the gap is 39.4's**: every fiend stands 4.7 to 8.3 units behind the party's front girl, never nearer than 1.7 behind her back girl, and 150 px or more from
 *   the girls on screen; the nearest fiend is no nearer the command list than it was and the move-advisor card, at its full height, stays under every fiend's feet;
 * - **the sizes are the real ones**: 0.55 to 0.9 of a girl on screen where 39.4 had 0.44 to 0.71 (a fiend at a given spot is exactly its real height over its 39.4 height taller).
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
import { solveFormation } from '../../../src/engine/Formation.ts';
import { laneFrom } from '../../../src/engine/StageRelax.ts';

const W = 1600;
const H = 900;
/** The FFX-2 HUD's rail (ENGINE-API "HUD safe area") and the command list's left edge, at 1600x900 (measured). */
const RAIL = 0.72 * W;
const STACK_LEFT = 1246;
/** The move-advisor card's top edge at 1600x900 at its full height (measured; nothing caps it in this chapter any more). */
const ADVISOR_TOP = 651;

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

const ACTS: ReadonlyArray<{ name: string; id: string }> = [
  { name: 'Act I', id: LEBLANC_ACT_I },
  { name: 'Act II', id: LEBLANC_ACT_II },
  { name: 'Act III', id: LEBLANC_ACT_III },
];
const fiendsOf = (actId: string): string[] => ENEMY_GROUPS_BY_ID[actId]!.enemies.map((e) => e.id);

/**
 * Where release 39.4 (55db51dd) stood every fiend: the numbers measured in that build at each act's first command menu at 1600x900 (GPU Chromium, seed 1,
 * 2026-10-08), `[x, 0, z]`. These are the numbers the pick restores; nothing in this file may move them without Bailey's word.
 */
const RELEASE_39_4_SPOTS: Readonly<Record<string, readonly [number, number, number]>> = {
  'dr-goon': [1.34, 0, -5.0],
  'ormi-entrance': [2.0, 0, -6.8],
  'fem-goon': [2.66, 0, -3.2],
  'ormi-logos-room': [1.45, 0, -3.2],
  'logos-room': [2.55, 0, -6.8],
  ormi: [2.55, 0, -3.2],
  logos: [1.26, 0, -5.0],
  leblanc: [2.21, 0, -6.8],
};

/** The heights 39.4 drew at (the stage's own rule: a boss at the scene's boss height 1.66, a goon at 0.7 of it), by combatant id. */
const RELEASE_39_4_HEIGHTS: Readonly<Record<string, number>> = {
  'ormi-entrance': 1.66, 'dr-goon': 1.162, 'fem-goon': 1.162, 'logos-room': 1.66, 'ormi-logos-room': 1.66, leblanc: 1.66, logos: 1.66, ormi: 1.66,
};

// The girls' standing height on screen: the unit the sizes are measured in.
const girls = LEBLANC_LAST_ROOM_SLOTS.party.map((s) => figure(s[0]!, s[2]!, LEBLANC_PARTY_HEIGHT));
const girlsMeanPx = girls.reduce((sum, g) => sum + g.px, 0) / girls.length;
const paineRight = Math.max(...girls.map((g) => g.cx + 0.17 * g.px)); // a girl's painted half-width is about 0.17 of her standing height

describe('the camera is as it was (the pick leaves the camera, the lens and the rigs alone)', () => {
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

  it('the spots are the places release 39.4 stood them, to the hundredth', () => {
    expect(LEBLANC_ENEMY_SPOTS).toEqual(RELEASE_39_4_SPOTS);
  });

  it('nobody stands level with the girls (39.4.1\'s lane was z -0.15 to -2.6): every fiend is 1.7 or more behind the party\'s back girl, in 39.4\'s three ranks', () => {
    for (const [id, s] of Object.entries(LEBLANC_ENEMY_SPOTS)) {
      expect(s[2], `${id} behind the party's back girl (z -1.5) by 1.7 or more`).toBeLessThanOrEqual(-1.5 - 1.7);
      expect(s[2], `${id} no further back than 39.4's far rank`).toBeGreaterThanOrEqual(-6.8);
    }
    expect(new Set(Object.values(LEBLANC_ENEMY_SPOTS).map((s) => s[2]))).toEqual(new Set([-3.2, -5.0, -6.8]));
  });

  it('the formation solver, given 39.4\'s heights, slot table and lane, derives the spots: Acts I and II exactly, Act III before the relaxation moved Logos and Leblanc 0.2 apart', () => {
    const lane = laneFrom(LEBLANC_ENEMY_SLOTS.map((s) => [...s] as [number, number, number]));
    lane.x = [...LEBLANC_ENEMY_LANE_X];
    for (const act of ACTS) {
      const members = fiendsOf(act.id).map((id) => ({ id, height: RELEASE_39_4_HEIGHTS[id]! }));
      for (const slot of solveFormation(members, lane)) {
        const pinned = LEBLANC_ENEMY_SPOTS[slot.id]!;
        expect(slot.spot[2], `${act.name} ${slot.id} z`).toBeCloseTo(pinned[2], 6);
        // Act III: the screen-space relaxation (`StageRelax.ts`) pushed Logos left and Leblanc right by 0.19 and 0.21; every other spot is the solver's
        expect(Math.abs(slot.spot[0] - pinned[0]), `${act.name} ${slot.id} x`).toBeLessThanOrEqual(act.id === LEBLANC_ACT_III && slot.id !== 'ormi' ? 0.22 : 0.005);
      }
    }
  });

  it('the fallback lane, the slot table and the pool under the trio are 39.4\'s too', () => {
    expect(LEBLANC_ENEMY_LANE_X).toEqual([1.0, 3.0]);
    expect(LEBLANC_ENEMY_SLOTS).toEqual([[1.1, 0, -5.0], [2.2, 0, -6.2], [-0.3, 0, -3.8]]);
    expect(LEBLANC_LAST_ROOM_SLOTS.enemy).toEqual(LEBLANC_ENEMY_SLOTS.map((s) => [...s]));
    expect(LEBLANC_LAST_ROOM_SLOTS.enemyLaneX).toEqual([1.0, 3.0]);
    expect(LEBLANC_TRIO_POOL).toEqual([1.1, -4.0]); // Leblanc's slot, a unit nearer the camera (39.4: `pool.position.set(s[0], 0.018, s[2] + 1.0)`)
  });

  it('the girls stand as before (1.68, three slots, never moved) and the boss default is Leblanc\'s own real height', () => {
    expect(LEBLANC_PARTY_HEIGHT).toBe(1.68);
    expect(LEBLANC_LAST_ROOM_SLOTS.partyHeight).toBe(1.68);
    expect(LEBLANC_LAST_ROOM_SLOTS.party).toEqual([[-2.05, 0, 1.45], [-1.3, 0, 0.1], [-0.9, 0, -1.5]]);
    expect(LEBLANC_LAST_ROOM_SLOTS.enemyHeight).toBe(LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc);
  });

  it('the room names no move-advisor cap, and no staging switch beyond the heights, the spots and the intent roof', () => {
    const slots = LEBLANC_LAST_ROOM_SLOTS as unknown as Record<string, unknown>;
    expect(slots['advisorCap']).toBeUndefined();
    expect(Object.keys(slots).sort()).toEqual(['enemy', 'enemyHeight', 'enemyLaneX', 'enemySpots', 'figureHeights', 'intentRoof', 'party', 'partyHeight']);
  });
});

describe.each(ACTS)('$name at 1600x900: the Syndicate, through the first-menu camera', ({ id }) => {
  const ids = fiendsOf(id);
  const seen = ids.map((fid) => {
    const s = LEBLANC_ENEMY_SPOTS[fid]!;
    const f = figure(s[0], s[2], LEBLANC_FIGURE_HEIGHTS[fid]!);
    const old = figure(s[0], s[2], RELEASE_39_4_HEIGHTS[fid]!);
    const half = halfWidthOf(fid) * f.px;
    return { id: fid, spot: s, ...f, ratio: f.px / girlsMeanPx, oldRatio: old.px / girlsMeanPx, left: f.cx - half, right: f.cx + half };
  });

  it('stands at its real size: 0.55 to 0.9 of a girl on screen, each taller than the 39.4 figure at the same spot by its real height over the old one', () => {
    for (const f of seen) {
      expect(f.ratio, f.id).toBeGreaterThanOrEqual(0.55);
      expect(f.ratio, f.id).toBeLessThanOrEqual(0.9);
      expect(f.ratio / f.oldRatio, `${f.id} against 39.4`).toBeCloseTo(LEBLANC_FIGURE_HEIGHTS[f.id]! / RELEASE_39_4_HEIGHTS[f.id]!, 1);
      expect(f.ratio, `${f.id} no smaller than at 39.4`).toBeGreaterThan(f.oldRatio);
    }
  });

  it('keeps the gap: 150 px or more from the girls on screen, behind the party\'s back girl, no two on one spot', () => {
    for (const f of seen) {
      expect(f.left - paineRight, `${f.id} against Paine`).toBeGreaterThanOrEqual(150);
      expect(f.spot[2], f.id).toBeLessThanOrEqual(-3.2);
    }
    for (let i = 0; i < seen.length; i++) {
      for (let j = i + 1; j < seen.length; j++) {
        const d = Math.hypot(seen[i]!.spot[0] - seen[j]!.spot[0], seen[i]!.spot[2] - seen[j]!.spot[2]);
        expect(d, `${seen[i]!.id} and ${seen[j]!.id}`).toBeGreaterThanOrEqual(1.4);
      }
    }
  });

  it('keeps its feet clear of the move-advisor card at its full height, the rail and the command list', () => {
    for (const f of seen) {
      expect(f.feet, `${f.id} feet against the advisor card`).toBeLessThanOrEqual(ADVISOR_TOP - 30);
      expect(f.right, `${f.id} against the rail`).toBeLessThanOrEqual(RAIL);
      expect(STACK_LEFT - f.right, `${f.id} against the command list`).toBeGreaterThanOrEqual(120);
    }
  });
});
