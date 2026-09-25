// @vitest-environment jsdom
/**
 * Chapter XII (Seymour Omnis): the Garden of Pain scene, its painted discs and the HUD tap that
 * tells them which colour each disc shows him.
 *
 * Tables through the pure exports; the factory through `loadScene('garden-of-pain', camera)`
 * under jsdom with a no-op 2D context and an empty art manifest (the Cloister 100 test's set-up:
 * the backdrop goes straight to its placeholder, no decode, no network). The discs are driven
 * with staged figures named by combatant id, as the stage parents them. What it looks like is the
 * browser pass's (`docs/concepts/chapters/omnis/ship/`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { BattleEvent, BattleState } from '../../../src/battle/common/types.ts';
import { DISC_RING, MORTIPHASM_IDS, OMNIS_ID } from '../../../src/battle/ffx/ai/seymour-omnis-rules.ts';
import { getScene, getSceneFactory, isPlaceholderScene, loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import {
  DISC_LAYOUT,
  GARDEN_ACTOR_HEIGHTS,
  GARDEN_BOSS_SPOT,
  GARDEN_IDS,
  GARDEN_OF_PAIN_SLOTS,
  GARDEN_PART_ANCHORS,
  discPlacements,
} from '../../../src/scenes/garden-of-pain.ts';
import { GARDEN_PHONE_ASPECT, GARDEN_PHONE_RIGS, GARDEN_WIDE_RIGS, gardenRigsFor } from '../../../src/scenes/garden-of-pain-rigs.ts';
import { DISC_RING_ON_SCREEN, GardenDiscs, discAngleFor, nearestAngle } from '../../../src/scenes/garden-of-pain-discs.ts';
import { OMNIS_DISC_IDS, OMNIS_FACING_KEY, OmnisDiscFacings, discFacingsOf, withOmnisDiscs } from '../../../src/engine/OmnisDiscTap.ts';
import type { HudPort } from '../../../src/engine/HudPort.ts';
import { anchorPoint } from '../../../src/engine/PartAnchors.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { cutsceneFigure } from '../../../src/app/screens/cutsceneFigures.ts';

describe('the Garden of Pain — tables', () => {
  it('is registered as a real scene under the plate id, and Chapter XII points at it', () => {
    expect(getSceneFactory('garden-of-pain')).toBeDefined();
    expect(isPlaceholderScene('garden-of-pain')).toBe(false);
    expect(getScene('garden-of-pain')?.slots).toBe(GARDEN_OF_PAIN_SLOTS);
    expect(getChapter('seymour-omnis')?.sceneKey).toBe('garden-of-pain');
  });

  it('mirrors the engine ids and the ring order (B8: our estimate, one constant each side)', () => {
    expect(GARDEN_IDS.omnis).toBe(OMNIS_ID);
    expect([...GARDEN_IDS.discs]).toEqual([...MORTIPHASM_IDS]);
    expect([...OMNIS_DISC_IDS]).toEqual([...MORTIPHASM_IDS]);
    expect([...DISC_RING_ON_SCREEN]).toEqual([...DISC_RING]);
  });

  it('three party slots in the lower left; Seymour pinned right of them and further back; one slot per disc', () => {
    expect(GARDEN_OF_PAIN_SLOTS.party).toHaveLength(3);
    for (const p of GARDEN_OF_PAIN_SLOTS.party) {
      expect(p[0]).toBeLessThan(GARDEN_BOSS_SPOT[0]);
      expect(p[2]).toBeGreaterThan(GARDEN_BOSS_SPOT[2]);
    }
    expect(GARDEN_OF_PAIN_SLOTS.enemy).toHaveLength(5); // slot 0 Omnis, slots 1-4 the discs (the data's `slot`s)
    expect(GARDEN_OF_PAIN_SLOTS.enemySpots?.[OMNIS_ID]).toEqual(GARDEN_BOSS_SPOT);
    expect(GARDEN_OF_PAIN_SLOTS.enemyHeight).toBe(GARDEN_ACTOR_HEIGHTS.omnis);
    expect(GARDEN_OF_PAIN_SLOTS.holdParty).toBe(true);
  });

  it('the discs sit two each side of him, left to right in id order (B12 reads them so), just behind him', () => {
    const at = discPlacements();
    const xs = at.map((p) => p.centre[0]);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    expect(at.filter((p) => p.centre[0] < GARDEN_BOSS_SPOT[0]).map((p) => p.towardHim)).toEqual([0, 0]);
    expect(at.filter((p) => p.centre[0] > GARDEN_BOSS_SPOT[0]).map((p) => p.towardHim)).toEqual([180, 180]);
    for (const p of at) {
      expect(p.centre[2]).toBeLessThan(GARDEN_BOSS_SPOT[2]);
      expect(p.centre[1]).toBeGreaterThan(0);
    }
  });

  it("each disc's combatant stands figure-less on an overhead anchor centred on its painted disc", () => {
    const parent = { x: GARDEN_BOSS_SPOT[0], y: GARDEN_BOSS_SPOT[1], z: GARDEN_BOSS_SPOT[2], height: GARDEN_ACTOR_HEIGHTS.omnis };
    discPlacements().forEach((p) => {
      const anchor = GARDEN_PART_ANCHORS[p.id]!;
      expect(anchor.mode).toBe('overhead');
      const [x, y, z] = anchorPoint(anchor, parent);
      // The anchored actor is 1.8 tall and stands on its point: its middle is the disc's centre.
      expect(x).toBeCloseTo(p.centre[0], 6);
      expect(y + 0.9).toBeCloseTo(p.centre[1], 6);
      expect(z).toBeCloseTo(p.centre[2], 6);
    });
    expect(GARDEN_OF_PAIN_SLOTS.partAnchors).toBe(GARDEN_PART_ANCHORS);
    expect(DISC_LAYOUT.diameter * GARDEN_ACTOR_HEIGHTS.omnis).toBeLessThan(1.8); // inside its anchored box
  });

  it('every rig set has the rigs the contract needs; a phone gets the phone rigs, 4:3 the wide ones opened', () => {
    for (const set of [GARDEN_WIDE_RIGS, GARDEN_PHONE_RIGS]) {
      for (const name of ['intro', 'idle', 'action', 'party', 'enemy', 'victory']) expect(set[name], name).toBeDefined();
    }
    expect(gardenRigsFor(GARDEN_PHONE_ASPECT)['idle']).toEqual(GARDEN_PHONE_RIGS['idle']);
    expect(gardenRigsFor(16 / 9)['idle']).toEqual(GARDEN_WIDE_RIGS['idle']);
    expect(gardenRigsFor(4 / 3)['idle']!.fov!).toBeGreaterThan(GARDEN_WIDE_RIGS['idle']!.fov!);
  });

  it("the phone's idle shot fits the party, Seymour and all four discs into the window's slice of the 16:9 field", () => {
    // The phone HUD B draws a 16:9 render of the field's height (390 x 520) and slides it (phoneFraming.ts).
    const rig = gardenRigsFor(GARDEN_PHONE_ASPECT)['idle']!;
    const cam = new PerspectiveCamera(rig.fov, 16 / 9, 0.1, 200);
    cam.position.copy(new Vector3(...(rig.position as [number, number, number])));
    cam.lookAt(new Vector3(...(rig.lookAt as [number, number, number])));
    cam.updateMatrixWorld();
    const s = GARDEN_BOSS_SPOT;
    const r = (DISC_LAYOUT.diameter * GARDEN_ACTOR_HEIGHTS.omnis) / 2;
    const pts: Array<[number, number, number]> = [[s[0], 0, s[2]], [s[0], GARDEN_ACTOR_HEIGHTS.omnis, s[2]]];
    for (const p of discPlacements()) pts.push([p.centre[0] + (p.towardHim === 0 ? -r : r), p.centre[1] + r, p.centre[2]], [p.centre[0], p.centre[1] - r, p.centre[2]]);
    for (const [x, , z] of GARDEN_OF_PAIN_SLOTS.party) pts.push([x - 0.45, 0, z], [x + 0.45, GARDEN_ACTOR_HEIGHTS.party, z]);
    const q = pts.map((p) => new Vector3(...p).project(cam));
    const xs = q.map((v) => v.x);
    const view = (390 / (520 * (16 / 9))) * 2; // the window's share of the canvas, in NDC width
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(view);
    for (const v of q) expect(Math.abs(v.y)).toBeLessThan(0.9);
  });

  it("the wide idle shot keeps every party member right of the FFX command stack (its right edge is about 0.345 of the width with five rows)", () => {
    // Measured on the 1600x900 frame (SWITCH, the lowest row, ends near x 552); the stack scales with the width.
    const rig = gardenRigsFor(16 / 9)['idle']!;
    const cam = new PerspectiveCamera(rig.fov, 16 / 9, 0.1, 200);
    cam.position.copy(new Vector3(...(rig.position as [number, number, number])));
    cam.lookAt(new Vector3(...(rig.lookAt as [number, number, number])));
    cam.updateMatrixWorld();
    for (const [x, , z] of GARDEN_OF_PAIN_SLOTS.party) {
      const left = new Vector3(x - 0.2, 0.4, z).project(cam); // a figure's back edge, about 0.2 left of its feet
      expect((left.x + 1) / 2).toBeGreaterThan(0.35);
    }
  });

  it('the cutscene can stand Seymour Omnis up (pre and post), from the installed idle', () => {
    expect(cutsceneFigure('seymour-omnis')?.art).toBe('art/characters/seymour-omnis/idle.png');
    expect(cutsceneFigure('seymour-omnis')?.unsent).toBe(true);
  });
});

describe('the discs — which quarter faces him', () => {
  it('opens with Fire facing him on both sides (§4.1: all four open on Fire)', () => {
    expect(discAngleFor('fire', 0)).toBe(0);
    expect(discAngleFor('fire', 180)).toBe(180);
  });

  it('a spell turns a disc clockwise and brings Thunder round; a blow turns it back and brings Water (the engine rule)', () => {
    // Fire -> Thunder is a spell (right): the short way from Fire's angle is +90, clockwise.
    expect(nearestAngle(discAngleFor('fire', 0), discAngleFor('lightning', 0)) - discAngleFor('fire', 0)).toBe(90);
    expect(nearestAngle(discAngleFor('fire', 180), discAngleFor('lightning', 180)) - discAngleFor('fire', 180)).toBe(90);
    // Fire -> Water is a blow (left): counter-clockwise.
    expect(nearestAngle(discAngleFor('fire', 0), discAngleFor('water', 0)) - discAngleFor('fire', 0)).toBe(-90);
  });

  it('turns the painted disc to the colour its actor carries, a quarter over DISC_TURN_MS, and snaps on a new fight', () => {
    const root = new Object3D();
    const discs = new GardenDiscs(discPlacements(), 1.5);
    const actors = MORTIPHASM_IDS.map((id) => {
      const o = new Object3D();
      o.name = id;
      root.add(o);
      return o;
    });
    discs.update(0.016, root);
    expect(discs.angles()).toEqual([0, 0, 180, 180]);
    actors[0]!.userData[OMNIS_FACING_KEY] = 'lightning'; // a spell turned disc 1
    discs.update(0.1, root);
    const mid = discs.angles()[0]!;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(90);
    for (let i = 0; i < 20; i++) discs.update(0.05, root);
    expect(discs.angles()[0]).toBe(90);
    // A retry stages new actors: the disc stands where the new fight says, with no spin.
    const fresh = new Object3D();
    fresh.name = MORTIPHASM_IDS[0]!;
    fresh.userData[OMNIS_FACING_KEY] = 'fire';
    root.remove(actors[0]!);
    root.add(fresh);
    discs.update(0.016, root);
    expect(discs.angles()[0]).toBe(0);
    discs.dispose();
  });
});

describe('the HUD tap (FFX only; inert outside Chapter XII)', () => {
  const flags = (discs: string): Pick<BattleState, 'flags'> => ({ flags: { 'omnis.discs': discs } });

  function field(): { actors: Map<string, Object3D>; actor(id: string): Object3D | undefined } {
    const actors = new Map(MORTIPHASM_IDS.map((id) => [id, new Object3D()] as const));
    return { actors, actor: (id) => actors.get(id) };
  }

  it('reads the disc state, left to right, and nothing without it', () => {
    expect(discFacingsOf(flags('fire,ice,water,lightning'))).toEqual({
      'mortiphasm-1': 'fire',
      'mortiphasm-2': 'ice',
      'mortiphasm-3': 'water',
      'mortiphasm-4': 'lightning',
    });
    expect(discFacingsOf({ flags: {} })).toEqual({});
  });

  it('a fresh disc takes the state at sync; after that only the played event moves it', () => {
    const f = field();
    const tap = new OmnisDiscFacings(() => f);
    tap.sync(flags('fire,fire,fire,fire'));
    expect(f.actors.get('mortiphasm-2')!.userData[OMNIS_FACING_KEY]).toBe('fire');
    tap.sync(flags('water,fire,fire,fire')); // the engine is ahead of the playback: nothing moves yet
    expect(f.actors.get('mortiphasm-1')!.userData[OMNIS_FACING_KEY]).toBe('fire');
    const turned = { type: 'affinity-change', targetId: OMNIS_ID, affinities: {}, cause: 'part-turn', partId: 'mortiphasm-1', direction: 'left', facings: { 'mortiphasm-1': 'water' } } as unknown as BattleEvent;
    tap.onEvent(turned);
    expect(f.actors.get('mortiphasm-1')!.userData[OMNIS_FACING_KEY]).toBe('water');
  });

  it('does nothing in any other battle', () => {
    const f = field();
    const tap = new OmnisDiscFacings(() => f);
    tap.sync({ flags: {} });
    tap.onEvent({ type: 'damage', targetId: 'tidus', amount: 1 } as unknown as BattleEvent);
    for (const a of f.actors.values()) expect(a.userData[OMNIS_FACING_KEY]).toBeUndefined();
  });

  it('wraps a HUD in place: its own sync and onEvent still run, and the same object comes back', () => {
    const calls: string[] = [];
    const hud = { sync: () => calls.push('sync'), onEvent: () => void calls.push('event'), mount() {}, unmount() {} } as unknown as HudPort;
    const f = field();
    const out = withOmnisDiscs(hud, () => f);
    expect(out).toBe(hud);
    out.sync(flags('ice,ice,ice,ice') as BattleState, []);
    void out.onEvent({ type: 'message', text: 'x' } as unknown as BattleEvent);
    expect(calls).toEqual(['sync', 'event']);
    expect(f.actors.get('mortiphasm-4')!.userData[OMNIS_FACING_KEY]).toBe('ice');
  });
});

describe('the Garden of Pain — the real factory through loadScene', () => {
  const loaded: LoadedScene[] = [];

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
      const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
      return new Proxy({} as Record<string | symbol, unknown>, {
        get(target, prop) {
          if (prop in target) return target[prop];
          if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
          if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
          if (prop === 'measureText') return () => ({ width: 10 });
          return () => stub;
        },
        set(target, prop, value) {
          target[prop] = value;
          return true;
        },
      }) as never;
    });
    setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
  });

  afterAll(() => {
    for (const s of loaded) s.dispose();
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds, publishes the staging switches, the anchors and the heights, and updates without throwing', async () => {
    const scene = await loadScene('garden-of-pain', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.placeholder).toBe(false);
    expect(scene.slots.enemySpots?.[OMNIS_ID]).toEqual(GARDEN_BOSS_SPOT);
    expect(scene.slots.partAnchors?.['mortiphasm-3']?.mode).toBe('overhead');
    expect(scene.slots.holdParty).toBe(true);
    expect(scene.slots.enemyHeight).toBe(GARDEN_ACTOR_HEIGHTS.omnis);
    expect(() => scene.update(0.016)).not.toThrow();
  });
});
