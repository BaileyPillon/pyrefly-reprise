// @vitest-environment jsdom
/**
 * r3942-stage wave 2, **FFX-2 only** (AGENTS.md rule 14): the giants of Chapters IV, XIII and XI on the upright phone (Bailey, 2026-10-08, "go with C and restart the giants build":
 * option 4 on the phone, 0.7 of the real height). The phone keeps today's rig and its own slice fit, so the size is the scene's own: `SceneStaging.figureHeights` carries the giant
 * only when the phone battle HUD takes the window (`scenes/giant-stage.ts`), and Chapter IV (Bahamut) has the phone camera of the options sheet. On a desktop the scenes publish
 * nothing for the giants (CHAPTER FRAMING's `fx/mix/giants.ts` sizes them with their camera). Through `loadScene` under jsdom with a no-op 2D context and an empty art manifest,
 * the set-up of `road-phone-camera.test.ts`.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { loadScene, type LoadedScene } from '../../../src/scenes/index.ts';
import { giantPhoneHeights, giantsOnPhone } from '../../../src/scenes/giant-stage.ts';
import { BEVELLE_GIRLS_HEIGHT, BEVELLE_PHONE_GIANT_IDLE, BEVELLE_UNDERGROUND_RIGS } from '../../../src/scenes/bevelle-underground.ts';
import { CLOISTER_ACTOR_HEIGHTS, CLOISTER_IDS } from '../../../src/scenes/cloister-100.ts';
import { ROAD_IDS, ROAD_PARTY_HEIGHT } from '../../../src/scenes/road-to-the-farplane.ts';
import { ffx2GiantHeight } from '../../../src/data/ffx2/fiend-stature.ts';
import { PHONE_BATTLE_QUERY } from '../../../src/ui/common/phoneBattle.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';

const vec = (p: unknown): Vector3 => (Array.isArray(p) ? new Vector3(p[0], p[1], p[2]) : (p as Vector3).clone());

describe('giantPhoneHeights: the giants of one chapter at 0.7 of their real height, on a phone only', () => {
  it('Bahamut 6.403 over girls of 1.82, Paragon 6.613 over 1.75, Anima 9.6 over 1.78', () => {
    expect(giantPhoneHeights(['bahamut'], 'ffx2-bahamut', 1.82, true)['bahamut']).toBeCloseTo(6.403, 3);
    expect(giantPhoneHeights(['paragon'], 'ffx2-trema', 1.75, true)['paragon']).toBeCloseTo(6.613, 3);
    expect(giantPhoneHeights(['x2-anima'], 'ffx2-fallen-aeons', 1.78, true)['x2-anima']).toBeCloseTo(9.6, 2);
  });

  it('is the table\'s phone height, to the millimetre, and nothing on a desktop or for an id that is no giant', () => {
    expect(giantPhoneHeights(['bahamut'], 'ffx2-bahamut', 1.82, true)['bahamut']).toBe(ffx2GiantHeight('bahamut', 'ffx2-bahamut', 1.82, true));
    expect(giantPhoneHeights(['bahamut', 'paragon', 'x2-anima'], 'ffx2-bahamut', 1.82, false)).toEqual({});
    expect(giantPhoneHeights(['trema', 'x2-shiva', 'vegnagun-body'], 'ffx2-trema', 1.75, true)).toEqual({});
  });

  it('the phone battle HUD\'s media query decides, and nothing without a window', () => {
    const win = (m: boolean) => ({ matchMedia: (q: string) => ({ matches: m && q === PHONE_BATTLE_QUERY }) as MediaQueryList });
    expect(giantsOnPhone(win(true))).toBe(true);
    expect(giantsOnPhone(win(false))).toBe(false);
    expect(giantsOnPhone(undefined)).toBe(false);
  });
});

describe('the three scenes publish the giants on a phone and not on a desktop', () => {
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
  const load = async (key: string): Promise<LoadedScene> => {
    const s = await loadScene(key, new PerspectiveCamera());
    loaded.push(s);
    return s;
  };

  it('Chapter IV on a phone: Bahamut 0.7 of his real height and the options sheet\'s own phone camera', async () => {
    withPhone(true);
    const s = await load('bevelle-underground');
    expect(s.slots.figureHeights?.['bahamut']).toBeCloseTo(ffx2GiantHeight('bahamut', 'ffx2-bahamut', BEVELLE_GIRLS_HEIGHT, true)!, 6);
    expect(s.slots.figureHeights?.['bahamut']).toBeCloseTo(6.403, 3);
    const idle = s.battleCamera.getRig('idle')!;
    expect(vec(idle.position).toArray()).toEqual(vec(BEVELLE_PHONE_GIANT_IDLE.position).toArray());
    expect(vec(idle.lookAt).toArray()).toEqual(vec(BEVELLE_PHONE_GIANT_IDLE.lookAt).toArray());
    expect(idle.fov).toBe(BEVELLE_PHONE_GIANT_IDLE.fov);
    // his camera stands well back of today's and higher: a boss at 0.7 of 87.8 does not fit today's
    expect(vec(idle.position).z).toBeGreaterThan(vec(BEVELLE_UNDERGROUND_RIGS['idle']!.position).z + 3);
    expect(vec(idle.position).y).toBeGreaterThan(vec(BEVELLE_UNDERGROUND_RIGS['idle']!.position).y + 1);
  });

  it('Chapter IV on a desktop: nothing for Bahamut (CHAPTER FRAMING sizes him with his camera) and today\'s rig', async () => {
    withPhone(false);
    const s = await load('bevelle-underground');
    expect(s.slots.figureHeights?.['bahamut']).toBeUndefined();
    expect(vec(s.battleCamera.getRig('idle')!.position).toArray()).toEqual(vec(BEVELLE_UNDERGROUND_RIGS['idle']!.position).toArray());
  });

  it('Chapter XIII on a phone: Paragon 6.613 and Trema\'s own 1.784 kept; on a desktop only Trema\'s', async () => {
    withPhone(true);
    const phone = await load('via-infinito');
    expect(phone.slots.figureHeights?.[CLOISTER_IDS.paragon]).toBeCloseTo(ffx2GiantHeight('paragon', 'ffx2-trema', CLOISTER_ACTOR_HEIGHTS.party, true)!, 6);
    expect(phone.slots.figureHeights?.[CLOISTER_IDS.paragon]).toBeCloseTo(6.613, 3);
    expect(phone.slots.figureHeights?.[CLOISTER_IDS.trema]).toBe(CLOISTER_ACTOR_HEIGHTS.trema);
    withPhone(false);
    const desk = await load('via-infinito');
    expect(desk.slots.figureHeights?.[CLOISTER_IDS.paragon]).toBeUndefined();
    expect(desk.slots.figureHeights?.[CLOISTER_IDS.trema]).toBe(CLOISTER_ACTOR_HEIGHTS.trema);
  });

  it('Chapter XI on a phone: Anima 9.6, with Shiva\'s and the Sisters\' own heights kept; on a desktop only theirs', async () => {
    withPhone(true);
    const phone = await load('road-to-the-farplane');
    expect(phone.slots.figureHeights?.[ROAD_IDS.anima]).toBeCloseTo(ffx2GiantHeight('x2-anima', 'ffx2-fallen-aeons', ROAD_PARTY_HEIGHT, true)!, 6);
    expect(phone.slots.figureHeights?.[ROAD_IDS.anima]).toBeCloseTo(9.6, 2);
    expect(phone.slots.figureHeights?.[ROAD_IDS.shiva]).toBeCloseTo(3.453, 3);
    expect(phone.slots.figureHeights?.[ROAD_IDS.sandy]).toBeCloseTo(2.297, 3);
    withPhone(false);
    const desk = await load('road-to-the-farplane');
    expect(desk.slots.figureHeights?.[ROAD_IDS.anima]).toBeUndefined();
    expect(desk.slots.figureHeights?.[ROAD_IDS.shiva]).toBeCloseTo(3.453, 3);
  });
});
