// @vitest-environment jsdom
/**
 * Chapter XIII (Trema): the Cloister 100 scene and its kill link.
 *
 * Tables through the pure exports; the factory through `loadScene('via-infinito', camera)`
 * under jsdom with a no-op 2D context and an empty art manifest (the Leblanc scene test's
 * set-up: the backdrop goes straight to its placeholder, no decode, no network). The kill link
 * is driven with duck-typed staged figures, as the stage parents them (named by combatant id).
 * What it looks like is the browser pass's (`docs/concepts/chapters/trema/ship/`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 */

import { Group, Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { getScene, getSceneFactory, isPlaceholderScene, loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import {
  CLOISTER_100_SLOTS,
  CLOISTER_ACTOR_HEIGHTS,
  CLOISTER_BOSS_SPOT,
  CLOISTER_IDS,
  CLOISTER_LINK_SIDE_SPOT,
} from '../../../src/scenes/cloister-100.ts';
import {
  CLOISTER_LINK_RIG,
  CLOISTER_PHONE_ASPECT,
  CLOISTER_PHONE_RIGS,
  CLOISTER_WIDE_RIGS,
  cloisterRigsFor,
} from '../../../src/scenes/cloister-100-rigs.ts';
import { CloisterLink, LINK_MS, LINK_TOTAL_MS, PYREFLY_GREEN, linkAt } from '../../../src/scenes/cloister-100-link.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { HELD_MARK } from '../../../src/engine/BattlePresenterDepartures.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { cutsceneFigure } from '../../../src/app/screens/cutsceneFigures.ts';

describe('Cloister 100 — tables', () => {
  it('is registered as a real scene under the plate id, and Chapter XIII points at it', () => {
    expect(getSceneFactory('via-infinito')).toBeDefined();
    expect(isPlaceholderScene('via-infinito')).toBe(false);
    expect(getScene('via-infinito')?.slots).toBe(CLOISTER_100_SLOTS);
    expect(getChapter('ffx2-trema')?.sceneKey).toBe('via-infinito');
  });

  it('three party slots in the lower left, the boss spot far back and right of them', () => {
    expect(CLOISTER_100_SLOTS.party).toHaveLength(3);
    for (const p of CLOISTER_100_SLOTS.party) {
      expect(p[0]).toBeLessThan(CLOISTER_BOSS_SPOT[0]);
      expect(p[2]).toBeGreaterThan(CLOISTER_BOSS_SPOT[2]);
    }
    expect(CLOISTER_100_SLOTS.enemySpots?.[CLOISTER_IDS.paragon]).toEqual(CLOISTER_BOSS_SPOT);
    expect(CLOISTER_100_SLOTS.enemySpots?.[CLOISTER_IDS.trema]).toEqual(CLOISTER_BOSS_SPOT);
    expect(CLOISTER_100_SLOTS.figureHeights?.[CLOISTER_IDS.trema]).toBe(CLOISTER_ACTOR_HEIGHTS.trema);
    // INSTALLED.md "Sizes": Trema at 0.72 of Paragon.
    expect(CLOISTER_ACTOR_HEIGHTS.trema / CLOISTER_ACTOR_HEIGHTS.paragon).toBeCloseTo(0.72, 2);
  });

  it('every rig set has the four the contract needs, plus the link rig', () => {
    for (const set of [CLOISTER_WIDE_RIGS, CLOISTER_PHONE_RIGS]) {
      for (const name of ['intro', 'idle', 'action', 'victory', CLOISTER_LINK_RIG]) expect(set[name], name).toBeDefined();
    }
  });

  it('a phone gets the phone rigs; 4:3 keeps the wide rigs with the fov opened to 16:9 width', () => {
    expect(cloisterRigsFor(CLOISTER_PHONE_ASPECT)['idle']).toEqual(CLOISTER_PHONE_RIGS['idle']);
    expect(cloisterRigsFor(16 / 9)['idle']).toEqual(CLOISTER_WIDE_RIGS['idle']);
    expect(cloisterRigsFor(4 / 3)['idle']!.fov!).toBeGreaterThan(CLOISTER_WIDE_RIGS['idle']!.fov!);
  });

  it("the phone's link shot holds all three girls, Paragon and the old man's entrance (m2: it cropped Yuna)", () => {
    const rig = cloisterRigsFor(CLOISTER_PHONE_ASPECT)[CLOISTER_LINK_RIG]!;
    const cam = new PerspectiveCamera(rig.fov, CLOISTER_PHONE_ASPECT, 0.1, 200);
    const at = (v: [number, number, number] | Vector3): Vector3 => (v instanceof Vector3 ? v.clone() : new Vector3(...v));
    cam.position.copy(at(rig.position));
    cam.lookAt(at(rig.lookAt));
    cam.updateMatrixWorld();
    const onScreen = (x: number, y: number, z: number): void => {
      const p = new Vector3(x, y, z).project(cam);
      expect(Math.abs(p.x), `x of ${x},${y},${z}`).toBeLessThan(0.92);
      expect(Math.abs(p.y), `y of ${x},${y},${z}`).toBeLessThan(0.95);
      // Above the lower third, where the seam's dialogue box sits.
      expect(p.y, `above the dialogue box: ${x},${y},${z}`).toBeGreaterThan(-0.33);
    };
    const party = CLOISTER_100_SLOTS.party;
    const h = CLOISTER_ACTOR_HEIGHTS;
    for (const [x, , z] of party) for (const y of [0, h.party]) onScreen(x - 0.45, y, z); // each girl's left side, feet to head
    for (const y of [0, h.paragon]) onScreen(CLOISTER_BOSS_SPOT[0], y, CLOISTER_BOSS_SPOT[2]);
    for (const y of [0, h.trema]) onScreen(CLOISTER_LINK_SIDE_SPOT[0] + 0.5, y, CLOISTER_LINK_SIDE_SPOT[2]);
  });

  it('the cutscene can stand Trema up (his post scene), from the installed idle', () => {
    expect(cutsceneFigure('trema')?.art).toBe('art/characters/trema/idle.png');
  });
});

describe('the kill link — timeline', () => {
  it('he appears, Paragon is struck, breaks, and he walks to the boss spot, in that order', () => {
    expect(linkAt(0)).toMatchObject({ prop: 0, strike: false, breakStart: false, walk: 0 });
    expect(linkAt(LINK_MS.appear).prop).toBe(1);
    expect(linkAt(LINK_MS.strike).strike).toBe(true);
    expect(linkAt(LINK_MS.breakAt).breakStart).toBe(true);
    expect(linkAt(LINK_MS.walkAt + 1).walk).toBeGreaterThan(0);
    expect(linkAt(LINK_TOTAL_MS)).toMatchObject({ walk: 1, done: true });
  });
});

/** A staged figure as the scene sees one: named by combatant id, with the actor calls it makes. */
function figure(name: string): Object3D & { calls: string[]; alpha: number; setAlpha(a: number): void } {
  const o = new Object3D() as Object3D & { calls: string[]; alpha: number; setAlpha(a: number): void } & Record<string, unknown>;
  o.name = name;
  o.calls = [];
  o.alpha = 1;
  o.setAlpha = (a: number) => {
    o.alpha = a;
    o.calls.push(`alpha=${a}`);
  };
  o['flash'] = () => o.calls.push('flash');
  o['shake'] = () => o.calls.push('shake');
  o['dissolveTo'] = async (v: number, _ms: number, c: number) => {
    o.calls.push(`dissolve=${v}:${c.toString(16)}`);
  };
  return o;
}

describe('the kill link — on staged figures', () => {
  const opts = {
    sideSpot: [4, 0, -4] as [number, number, number],
    bossSpot: CLOISTER_BOSS_SPOT,
    tremaHeight: 2.5,
    cameraAt: [1, 3, 10] as [number, number, number],
    paragonIds: ['paragon'],
    tremaIds: ['trema'],
  };

  function play(link: CloisterLink, root: Object3D, ms: number): void {
    for (let t = 0; t < ms; t += 50) link.update(0.05, root);
  }

  it('starts on the link rig once Paragon is beaten and held, strikes it and breaks it into pyreflies', () => {
    const root = new Object3D();
    const paragon = figure('paragon');
    root.add(paragon);
    const link = new CloisterLink(new Group(), opts);
    link.update(0.016, root);
    link.cameraAt(new Vector3(1, 3, 10.5)); // on the rig, but Paragon is still fighting
    expect(link.playing).toBe(false);
    paragon.userData[HELD_MARK] = true; // the presenter's held departure
    link.cameraAt(new Vector3(8, 8, 8)); // not the link rig
    expect(link.playing).toBe(false);
    link.cameraAt(new Vector3(1, 3, 10.5));
    expect(link.playing).toBe(true);
    play(link, root, LINK_TOTAL_MS + 100);
    expect(paragon.calls).toContain('flash');
    expect(paragon.calls).toContain('shake');
    expect(paragon.calls).toContain(`dissolve=1:${PYREFLY_GREEN.toString(16)}`);
    expect(paragon.alpha).toBe(0);
    expect(link.playing).toBe(false);
  });

  it('with no Paragon on the field (Trema alone), the link rig starts nothing', () => {
    const root = new Object3D();
    const link = new CloisterLink(new Group(), opts);
    link.update(0.016, root);
    link.cameraAt(new Vector3(1, 3, 10));
    expect(link.playing).toBe(false);
  });

  it('the moment the battle stages the real Trema, the beat stops', () => {
    const root = new Object3D();
    root.add(figure('paragon'));
    const link = new CloisterLink(new Group(), opts);
    link.update(0.016, root);
    link.start();
    root.add(figure('trema'));
    link.update(0.016, root);
    expect(link.playing).toBe(false);
  });
});

describe('Cloister 100 — the real factory through loadScene', () => {
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

  it('builds, publishes the staging switches and heights, and updates without throwing', async () => {
    const scene = await loadScene('via-infinito', new PerspectiveCamera());
    loaded.push(scene);
    expect(scene.placeholder).toBe(false);
    expect(scene.slots.enemySpots?.['paragon']).toEqual(CLOISTER_BOSS_SPOT);
    expect(scene.slots.holdParty).toBe(true);
    expect(scene.slots.enemyHeight).toBe(CLOISTER_ACTOR_HEIGHTS.paragon);
    expect(() => scene.update(0.016)).not.toThrow();
  });
});
