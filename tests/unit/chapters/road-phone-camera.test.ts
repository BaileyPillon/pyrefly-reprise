// @vitest-environment jsdom
/**
 * PR-0201 option A (Bailey, 2026-09-26, "I'll go with all of your recommendations"): on an upright
 * phone the Road's idle camera pulls straight back per link, Shiva and Anima to z 13.2, the Sisters
 * to z 15.5, so every fighter of the link fits the phone's 390 px slice of the 16:9 render; the
 * desktop keeps its rig. `docs/concepts/phone-2026-09-26/README.md`.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: Chapter XI's scene.
 */

import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { BattleCamera, type CameraRig } from '../../../src/engine/BattleCamera.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import { ROAD_FIGURE_HEIGHTS, ROAD_IDS, ROAD_LINK_IDS, ROAD_RIGS, ROAD_SPOTS, ROAD_TO_THE_FARPLANE_SLOTS } from '../../../src/scenes/road-to-the-farplane.ts';
import {
  ROAD_PHONE_IDLE_Z,
  RoadPhoneCamera,
  roadLinkOf,
  roadOnPhone,
  roadPhoneIdle,
  type RoadLink,
} from '../../../src/scenes/road-to-the-farplane-phone.ts';
import { FRAME_MARGIN } from '../../../src/ui/common/phoneFraming.ts';
import { PHONE_BATTLE_QUERY } from '../../../src/ui/common/phoneBattle.ts';

const vec = (v: CameraRig['position']): Vector3 => (v instanceof Vector3 ? v.clone() : new Vector3(v[0], v[1], v[2]));

/** A staged figure as the stage parents it: named by combatant id, with `setAlpha`. */
function figure(name: string): Object3D {
  const o = new Object3D() as Object3D & { setAlpha(a: number): void };
  o.name = name;
  o.setAlpha = () => {};
  return o;
}

const LINK_ENEMIES: Record<RoadLink, string[]> = {
  shiva: [ROAD_IDS.shiva],
  sisters: [ROAD_IDS.sandy, ROAD_IDS.cindy, ROAD_IDS.mindy],
  anima: [ROAD_IDS.anima],
};

/**
 * The widest the link's figures stand in NDC x at `rig` (16:9), each figure a box of half-width
 * 0.45 of its height (party 1.78, bosses 3.4, the Sisters their own), the one used below.
 */
function spanNdc(rig: CameraRig, link: RoadLink): { lo: number; hi: number; top: number } {
  const cam = new PerspectiveCamera(rig.fov, 16 / 9, 0.1, 200);
  cam.position.copy(vec(rig.position));
  cam.lookAt(vec(rig.lookAt));
  cam.updateMatrixWorld();
  const boxes: Array<[number, number, number, number]> = ROAD_TO_THE_FARPLANE_SLOTS.party.map((s) => [s[0], s[1], s[2], 1.78]);
  for (const id of LINK_ENEMIES[link]) {
    const s = ROAD_SPOTS[id]!;
    boxes.push([s[0], s[1], s[2], ROAD_FIGURE_HEIGHTS[id] ?? 3.4]);
  }
  let lo = Infinity;
  let hi = -Infinity;
  let top = -Infinity;
  for (const [x, y, z, h] of boxes) {
    for (const dx of [-0.45 * h * 0.5, 0.45 * h * 0.5]) {
      for (const dy of [0, h]) {
        const p = new Vector3(x + dx, y + dy, z).project(cam);
        lo = Math.min(lo, p.x);
        hi = Math.max(hi, p.x);
        top = Math.max(top, p.y);
      }
    }
  }
  return { lo, hi, top };
}

/** The phone's slice of the 16:9 canvas, in NDC width: 390 px of a 520 px tall field, less the margins. */
const SLICE_NDC = (2 * (390 - 2 * FRAME_MARGIN)) / ((520 * 16) / 9);

describe('Road phone camera: the rigs (option A)', () => {
  it('dollies only z: Shiva and Anima to 13.2, the Sisters to 15.5; look point and fov stay', () => {
    const idle = ROAD_RIGS['idle']!;
    for (const link of ['shiva', 'sisters', 'anima'] as const) {
      const rig = roadPhoneIdle(idle, link);
      const p = vec(rig.position);
      expect([p.x, p.y]).toEqual([vec(idle.position).x, vec(idle.position).y]);
      expect(p.z).toBe(ROAD_PHONE_IDLE_Z[link]);
      expect(rig.lookAt).toEqual(idle.lookAt);
      expect(rig.fov).toBe(idle.fov);
    }
    expect(ROAD_PHONE_IDLE_Z).toEqual({ shiva: 13.2, sisters: 15.5, anima: 13.2 });
  });

  it('today\'s idle cannot hold a link in one phone slice; each link\'s phone idle can', () => {
    for (const link of ['shiva', 'sisters', 'anima'] as const) {
      const today = spanNdc(ROAD_RIGS['idle']!, link);
      const phone = spanNdc(roadPhoneIdle(ROAD_RIGS['idle']!, link), link);
      expect(today.hi - today.lo, `${link} today`).toBeGreaterThan(SLICE_NDC);
      expect(phone.hi - phone.lo, `${link} phone`).toBeLessThan(SLICE_NDC);
      expect(phone.top, `${link} heads in frame`).toBeLessThan(1);
    }
  });

  it('the phone battle HUD\'s media query decides, and nothing without a window', () => {
    const win = (m: boolean) => ({ matchMedia: (q: string) => ({ matches: m && q === PHONE_BATTLE_QUERY }) as MediaQueryList });
    expect(roadOnPhone(win(true))).toBe(true);
    expect(roadOnPhone(win(false))).toBe(false);
    expect(roadOnPhone(undefined)).toBe(false);
  });
});

describe('Road phone camera: following the staged link', () => {
  it('reads the latest link staged, so a fading Shiva never holds the Sisters\' framing', () => {
    const root = new Object3D();
    expect(roadLinkOf(root, ROAD_LINK_IDS)).toBeNull();
    root.add(figure(ROAD_IDS.shiva));
    expect(roadLinkOf(root, ROAD_LINK_IDS)).toBe('shiva');
    root.add(figure(ROAD_IDS.mindy));
    expect(roadLinkOf(root, ROAD_LINK_IDS)).toBe('sisters');
    root.add(figure(ROAD_IDS.anima));
    expect(roadLinkOf(root, ROAD_LINK_IDS)).toBe('anima');
  });

  it('replaces the camera\'s idle rig when the link changes, and keeps it after a Sister falls', () => {
    const cam = new BattleCamera(new PerspectiveCamera(), { rigs: ROAD_RIGS, initial: 'idle' });
    const phone = new RoadPhoneCamera(ROAD_RIGS['idle']!, ROAD_LINK_IDS);
    phone.bind(cam);
    const root = new Object3D();
    phone.update(root);
    expect(vec(cam.getRig('idle')!.position).z).toBe(9.8);
    const shiva = figure(ROAD_IDS.shiva);
    root.add(shiva);
    phone.update(root);
    expect(vec(cam.getRig('idle')!.position).z).toBe(13.2);
    root.remove(shiva);
    const sisters = LINK_ENEMIES.sisters.map(figure);
    for (const s of sisters) root.add(s);
    phone.update(root);
    expect(vec(cam.getRig('idle')!.position).z).toBe(15.5);
    root.remove(sisters[0]!);
    phone.update(root);
    expect(phone.current).toBe('sisters');
    expect(vec(cam.getRig('action')!.position)).toEqual(vec(ROAD_RIGS['action']!.position));
  });
});

describe('Road phone camera: through loadScene', () => {
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

  afterEach(() => {
    for (const s of loaded.splice(0)) s.dispose();
  });

  afterAll(() => {
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const withPhone = (on: boolean): void => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: on && q === PHONE_BATTLE_QUERY, media: q, addEventListener() {}, removeEventListener() {} }));
  };

  it('on a phone, the loaded battle camera\'s idle follows the staged link', async () => {
    withPhone(true);
    const scene = await loadScene('road-to-the-farplane', new PerspectiveCamera());
    loaded.push(scene);
    scene.scene.add(figure(ROAD_IDS.sandy));
    scene.update(0.016);
    expect(vec(scene.battleCamera.getRig('idle')!.position).z).toBe(15.5);
  });

  it('on a desktop, the idle rig stays today\'s whatever is staged', async () => {
    withPhone(false);
    const scene = await loadScene('road-to-the-farplane', new PerspectiveCamera());
    loaded.push(scene);
    scene.scene.add(figure(ROAD_IDS.sandy));
    scene.update(0.016);
    expect(scene.battleCamera.getRig('idle')!.position).toEqual(vec(ROAD_RIGS['idle']!.position));
  });
});
