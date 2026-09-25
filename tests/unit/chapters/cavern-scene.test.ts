/**
 * **The Cavern of the Stolen Fayth — Chapter IX's scene (FFX only).**
 *
 * Checked against the pure exports of `src/scenes/cavern-stolen-fayth.ts`,
 * `-arrival.ts` and `-cast.ts`. The factory paints canvases and needs a DOM
 * (every scene's standing shape); its real-input check is the browser pass
 * under `docs/screenshots/yojimbo-ship/`.
 *
 * The HUD claim is **measured**: the slots are pushed through a real three.js
 * camera on the `idle` rig at 1600x900 and every figure must miss the FFX HUD
 * boxes the real game laid out at that size (command stack, CTB list, Zanmato
 * gauge, party rows; read from the live DOM on 2026-09-24) and every other
 * figure.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  CAVERN_ACTOR_HEIGHTS as H,
  CAVERN_ENEMY_SLOT,
  CAVERN_PLATE,
  CAVERN_STOLEN_FAYTH_BACKDROP as BACKDROP,
  CAVERN_STOLEN_FAYTH_RIGS as RIGS,
  CAVERN_STOLEN_FAYTH_SLOTS as SLOTS,
  DAIGORO_SCALE,
  platePoint,
} from '../../../src/scenes/cavern-stolen-fayth.ts';
import { SAKURA_ARRIVAL_MS, SAKURA_FLOOR_GLOW, SAKURA_NIGHT, sakuraArrivalAt } from '../../../src/scenes/cavern-stolen-fayth-arrival.ts';
import { CAVERN_IDS, findFigure, scaleFigure, victoryStruck, type StagedFigure } from '../../../src/scenes/cavern-stolen-fayth-cast.ts';
import { getScene, getSceneFactory } from '../../../src/scenes/index.ts';
import { yojimboGroup } from '../../../src/data/ffx/enemies/yojimbo.ts';
import { yojimboCavernBuild } from '../../../src/data/ffx/builds/yojimbo-cavern.ts';
import { YOJIMBO_CAVERN } from '../../../src/data/chapter-yojimbo-cavern.ts';

const W = 1600;
const H_PX = 900;

/** The FFX HUD at 1600x900 in Chapter IX's first menu, CSS px [left, top, right, bottom] (live DOM, 2026-09-24). */
const HUD_1600: Record<string, [number, number, number, number]> = {
  cmdStack: [76, 511, 527, 836],
  cmdInfo: [70, 337, 481, 385],
  ctb: [1386, 124, 1551, 501],
  gauge: [718, 11, 1227, 158],
  partyRows: [1007, 646, 1542, 870],
};

/** Painted aspect (content width / height) from each idle's sidecar and alpha box. */
const ASPECT: Record<string, number> = { lulu: 0.4, kimahri: 0.631, yuna: 0.739, yojimbo: 0.658, daigoro: 0.989, ginnem: 0.651 };

function camFor(rig: string): PerspectiveCamera {
  const r = RIGS[rig]!;
  const cam = new PerspectiveCamera(r.fov ?? 30, W / H_PX, 0.1, 200);
  cam.position.set(...(r.position as [number, number, number]));
  cam.lookAt(new Vector3(...(r.lookAt as [number, number, number])));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

type Box = [number, number, number, number];
function boxOf(cam: PerspectiveCamera, spot: readonly number[], height: number, aspect: number): Box {
  const w = height * aspect;
  const pts = [
    [-w / 2, 0],
    [w / 2, 0],
    [-w / 2, height],
    [w / 2, height],
  ].map(([dx, dy]) => new Vector3(spot[0]! + dx!, spot[1]! + dy!, spot[2]!).project(cam));
  const xs = pts.map((p) => ((p.x + 1) / 2) * W);
  const ys = pts.map((p) => ((1 - p.y) / 2) * H_PX);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const overlap = (a: Box, b: Box): number =>
  Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));

function figures(): Record<string, Box> {
  const cam = camFor('idle');
  const [lulu, kimahri, yuna] = SLOTS.party;
  const e = SLOTS.enemy;
  return {
    lulu: boxOf(cam, lulu!, H.party, ASPECT.lulu!),
    kimahri: boxOf(cam, kimahri!, H.party, ASPECT.kimahri!),
    yuna: boxOf(cam, yuna!, H.party, ASPECT.yuna!),
    yojimbo: boxOf(cam, e[CAVERN_ENEMY_SLOT.yojimbo]!, H.yojimbo, ASPECT.yojimbo!),
    daigoro: boxOf(cam, e[CAVERN_ENEMY_SLOT.daigoro]!, H.daigoro, ASPECT.daigoro!),
    ginnem: boxOf(cam, e[CAVERN_ENEMY_SLOT.ginnem]!, H.ginnem, ASPECT.ginnem!),
  };
}

describe('cavern-stolen-fayth — registration', () => {
  it('is a real scene factory, and Chapter IX stands in it', () => {
    expect(getSceneFactory('cavern-stolen-fayth')).toBeTypeOf('function');
    expect(getScene('cavern-stolen-fayth')?.placeholder).toBe(false);
    expect(YOJIMBO_CAVERN.sceneKey).toBe('cavern-stolen-fayth');
  });
});

describe('cavern-stolen-fayth — formation and marks', () => {
  it('has one slot per formation slot, indexed as the data numbers them, and one spot per enemy', () => {
    for (const e of yojimboGroup.enemies) {
      const idx = CAVERN_ENEMY_SLOT[e.id as keyof typeof CAVERN_ENEMY_SLOT];
      expect(idx, e.id).toBe(e.slot);
      expect(SLOTS.enemySpots?.[e.id]).toEqual(SLOTS.enemy[idx]);
    }
    expect(yojimboGroup.enemies).toHaveLength(3);
  });

  it("holds the build's active three (Lulu, Kimahri, Yuna, D-066) on its own slots", () => {
    expect(yojimboCavernBuild.activeSlots).toEqual(['lulu', 'kimahri', 'yuna']);
    expect(SLOTS.party).toHaveLength(3);
    expect(SLOTS.holdParty).toBe(true);
  });

  it('publishes its own heights, and sizes Daigoro to his estimate, not the stage default', () => {
    expect(SLOTS.partyHeight).toBe(1.75);
    expect(SLOTS.enemyHeight).toBe(H.yojimbo);
    // The stage sizes a non-boss fiend at 0.7 of the boss height (BattlePresenterArt.worldHeightFor).
    expect(H.yojimbo * 0.7 * DAIGORO_SCALE).toBeCloseTo(H.daigoro, 9);
  });

  it('keeps every figure off the FFX HUD at idle, 1600x900, measured with a real camera', () => {
    const figs = figures();
    for (const [id, box] of Object.entries(figs)) {
      for (const [panel, hud] of Object.entries(HUD_1600)) expect(overlap(box, hud), `${id} x ${panel}`).toBe(0);
      expect(box[0]).toBeGreaterThan(0);
      expect(box[2]).toBeLessThan(W);
    }
  });

  it('keeps every figure clear of every other one', () => {
    const figs = Object.entries(figures());
    for (let i = 0; i < figs.length; i++) {
      for (let j = i + 1; j < figs.length; j++) expect(overlap(figs[i]![1], figs[j]![1]), `${figs[i]![0]} x ${figs[j]![0]}`).toBe(0);
    }
  });

  it('stands Ginnem apart: behind Yojimbo and Daigoro, nearer the party side than Yojimbo', () => {
    const e = SLOTS.enemy;
    const g = e[CAVERN_ENEMY_SLOT.ginnem]!;
    expect(g[2]).toBeLessThan(e[CAVERN_ENEMY_SLOT.yojimbo]![2] - 3);
    expect(g[0]).toBeLessThan(e[CAVERN_ENEMY_SLOT.yojimbo]![0]);
  });
});

describe('cavern-stolen-fayth — the painting and the pad', () => {
  it("stands the plate's floor row on the 3D floor, with the pad just above it", () => {
    const rowY = (v: number): number => BACKDROP.centreY + (0.5 - v) * BACKDROP.height;
    expect(rowY(CAVERN_PLATE.floorRow)).toBeCloseTo(0, 9);
    const [x, y, z] = platePoint(CAVERN_PLATE.pad.cx, CAVERN_PLATE.pad.cy);
    expect(y - (CAVERN_PLATE.pad.ry / CAVERN_PLATE.h) * BACKDROP.height).toBeGreaterThan(0);
    expect(Math.abs(x)).toBeLessThan(BACKDROP.width / 2);
    expect(z).toBe(BACKDROP.distance);
  });

  it('shows the pad in the idle and victory frames', () => {
    for (const rig of ['idle', 'victory']) {
      const p = new Vector3(...platePoint(CAVERN_PLATE.pad.cx, CAVERN_PLATE.pad.cy)).project(camFor(rig));
      expect(Math.abs(p.x), rig).toBeLessThan(0.9);
      expect(Math.abs(p.y), rig).toBeLessThan(0.9);
    }
  });
});

describe('cavern-stolen-fayth — the night-sakura arrival (O-4 A, D-072)', () => {
  it("uses the overlay recipe's own numbers", () => {
    expect(SAKURA_NIGHT).toEqual({ top: 0x0a0e22, bottom: 0x1e2a4e, amount: 0.72, petal: 0x8fc8f0 });
    expect(SAKURA_FLOOR_GLOW).toBeCloseTo(70 / 255, 9);
  });

  it('brings Daigoro in first, then Yojimbo, both whole before the boss push lands (~1.3 s)', () => {
    const T = SAKURA_ARRIVAL_MS;
    expect(T.daigoroIn[0]).toBeLessThan(T.yojimboIn[0]);
    expect(sakuraArrivalAt(T.yojimboIn[0]).daigoro).toBeGreaterThan(0.5);
    expect(sakuraArrivalAt(1300).yojimbo).toBe(1);
    expect(sakuraArrivalAt(0).yojimbo).toBe(0);
  });

  it('forms the night, holds it, and gives the fight back the cold chamber', () => {
    const mid = sakuraArrivalAt(2000);
    expect(mid.night).toBe(1);
    expect(mid.tree).toBe(1);
    expect(mid.petals).toBe(1);
    const end = sakuraArrivalAt(SAKURA_ARRIVAL_MS.end);
    expect(end).toMatchObject({ night: 0, tree: 0, petals: 0, daigoro: 1, yojimbo: 1, done: true });
    for (let ms = 0; ms <= SAKURA_ARRIVAL_MS.end; ms += 50) {
      const f = sakuraArrivalAt(ms);
      for (const v of [f.night, f.tree, f.petals, f.daigoro, f.yojimbo]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('cavern-stolen-fayth — reading the staged figures', () => {
  const fig = (name: string, extra: Partial<{ pose: string; lifeState: string }> = {}): StagedFigure => {
    const o = new Object3D() as StagedFigure & { alpha: number };
    o.name = name;
    o.alpha = 1;
    Object.assign(o, { setAlpha: (a: number) => (o.alpha = a), ...extra });
    return o;
  };

  it('finds a staged figure by its combatant id, and nothing on a field without one', () => {
    const root = new Object3D();
    const y = fig(CAVERN_IDS.yojimbo);
    root.add(new Object3D(), y);
    expect(findFigure(root, CAVERN_IDS.yojimbo)).toBe(y);
    expect(findFigure(root, CAVERN_IDS.daigoro)).toBeNull();
    // A bare three.js node with the right name is not a staged figure.
    const bare = new Object3D();
    bare.name = CAVERN_IDS.daigoro;
    root.add(bare);
    expect(findFigure(root, CAVERN_IDS.daigoro)).toBeNull();
    expect(findFigure(null, CAVERN_IDS.yojimbo)).toBeNull();
  });

  it("sees the victory only when a figure strikes the presenter's victory pose", () => {
    const root = new Object3D();
    root.add(fig('lulu', { pose: 'idle', lifeState: 'idle' }));
    expect(victoryStruck(root)).toBe(false);
    root.add(fig('yuna', { pose: 'victory', lifeState: 'victory' }));
    expect(victoryStruck(root)).toBe(true);
  });

  it('scales a figure about its feet', () => {
    const d = fig(CAVERN_IDS.daigoro);
    d.position.set(3, 0, 1);
    scaleFigure(d, DAIGORO_SCALE);
    expect(d.scale.x).toBeCloseTo(DAIGORO_SCALE, 9);
    expect(d.scale.y).toBeCloseTo(DAIGORO_SCALE, 9);
    expect(d.position.toArray()).toEqual([3, 0, 1]);
  });
});
