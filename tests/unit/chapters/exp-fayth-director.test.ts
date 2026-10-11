// @vitest-environment jsdom
/**
 * **The range director's optional staging** (`AirshipRangeDirector.staging`, `src/scenes/evrae-airship-director.ts`; the hidden Fayth chapter, FFX only): a scene may put its own Evrae spots and NEAR / FAR
 * rigs in place of `RANGE_STAGING`'s. The hidden chapter stands Evrae at FFX's NEAR and FAR points and installs FFX's two default views as `idle`, `action` and `enemy`. What this file pins:
 *
 * 1. **With no staging (every other deck) nothing moved**: the painted NEAR rigs and Evrae's painted spot, including the window's Hor+ stand-back at 4:3 (D-360), exactly as before the hook existed.
 * 2. **With a staging** the camera is handed FFX's rigs, a range shift installs the other range's, Evrae is put on the staged spot at each range, and the window's stand-back and trim are **off**: FFX's own
 *    framing holds on a 4:3 window (the painted game's Hor+ answer is for the painted HUD).
 *
 * Game case: FFX only (the director is Chapter VIII's; the staging is read by no other deck).
 */
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { parseArtManifest, resetArtManifest, setArtManifest } from '../../../src/engine/ArtManifest.ts';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import type { PaintedActor } from '../../../src/engine/PaintedActor.ts';
import { FFX_EVRAE_SPOTS, FFX_FAR_VIEW, FFX_NEAR_VIEW } from '../../../src/engine/ffx3d/ffxStaging.ts';
import { ffxPointTuple, ffxRig } from '../../../src/engine/ffx3d/ffxWorld.ts';
import { AirshipRangeDirector } from '../../../src/scenes/evrae-airship-director.ts';
import { EVRAE_NEAR_SPOT, RANGE_STAGING } from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';

const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };

function fakeDeck(): AirshipDeck {
  return { group: new Group(), layers: [], haze: null as never, wind: 1, setHaze: () => {}, update: () => {}, dispose: () => {} };
}

/** The part of a painted actor the director writes: a position, a scale, a poses call and the alpha. */
function fakeActor(): PaintedActor & { position: Vector3; scale: Vector3 } {
  return {
    position: new Vector3(),
    scale: new Vector3(1, 1, 1),
    userData: {},
    lifeState: 'alive',
    poseSize: [6.9, 3.2],
    pose: 'idle',
    loadPoses: async () => {},
    setAlpha: () => {},
  } as unknown as PaintedActor & { position: Vector3; scale: Vector3 };
}

function director(): { d: AirshipRangeDirector; cam: BattleCamera } {
  const d = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
  const cam = new BattleCamera(new PerspectiveCamera(34, 16 / 9, 0.1, 400), { rigs: { idle: { position: [0, 0, 0], lookAt: [0, 0, -1] }, action: { position: [0, 0, 0], lookAt: [0, 0, -1] }, enemy: { position: [0, 0, 0], lookAt: [0, 0, -1] }, intro: { position: [0, 0, 0], lookAt: [0, 0, -1] }, victory: { position: [0, 0, 0], lookAt: [0, 0, -1] } }, initial: 'idle' });
  return { d, cam };
}

const rigOf = (cam: BattleCamera, name: string): { position: number[]; lookAt: number[]; fov: number } => {
  const r = cam.getRig(name)!;
  const arr = (v: unknown): number[] => (v as Vector3).toArray();
  return { position: arr(r.position), lookAt: arr(r.lookAt), fov: r.fov! };
};
const near = (got: readonly number[], want: readonly number[], digits = 9): void => want.forEach((w, i) => expect(got[i], `component ${i}`).toBeCloseTo(w, digits));

const ffxStaging = () => {
  const n = ffxRig(FFX_NEAR_VIEW);
  const f = ffxRig(FFX_FAR_VIEW);
  return {
    near: { evrae: ffxPointTuple(FFX_EVRAE_SPOTS.near), rigs: { idle: n, action: n, enemy: n } },
    far: { evrae: ffxPointTuple(FFX_EVRAE_SPOTS.far), rigs: { idle: f, action: f, enemy: f } },
  };
};

const resize = (w: number, h: number): void => {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: w });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: h });
};

beforeAll(() => {
  setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
});
afterEach(() => {
  resize(1024, 768); // jsdom's own
  vi.unstubAllGlobals();
});
afterAll(() => resetArtManifest());

describe('with no staging: the painted deck, as before', () => {
  it('installs the painted NEAR rigs and puts Evrae on its painted spot; at 4:3 the NEAR rigs stand back (the window\'s Hor+ answer)', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
    resize(1920, 1080);
    const { d, cam } = director();
    expect(d.staging).toBeNull();
    d.bindCamera(cam);
    near(rigOf(cam, 'idle').position, RANGE_STAGING.near.rigs.idle.position);
    const actor = fakeActor();
    await d.bindEvrae(actor);
    near(actor.position.toArray(), [...EVRAE_NEAR_SPOT]);

    resize(1024, 768); // 4:3
    const narrow = director();
    narrow.d.bindCamera(narrow.cam);
    await narrow.d.bindEvrae(fakeActor());
    const stood = rigOf(narrow.cam, 'idle').position;
    const authored = RANGE_STAGING.near.rigs.idle;
    const aim = authored.lookAt;
    const back = Math.hypot(stood[0]! - aim[0], stood[1]! - aim[1], stood[2]! - aim[2]) / Math.hypot(authored.position[0] - aim[0], authored.position[1] - aim[1], authored.position[2] - aim[2]);
    expect(back).toBeGreaterThan(1.3); // stood back by about 1.4 at 4:3
  });
});

describe('with a staging: FFX\'s spots and views', () => {
  it('hands the camera FFX\'s NEAR default view as idle, action and enemy, and puts Evrae on FFX\'s NEAR spot', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
    resize(1920, 1080);
    const { d, cam } = director();
    d.staging = ffxStaging();
    d.bindCamera(cam);
    const want = ffxRig(FFX_NEAR_VIEW);
    for (const name of ['idle', 'action', 'enemy']) {
      const r = rigOf(cam, name);
      near(r.position, want.position);
      near(r.lookAt, want.lookAt);
      expect(r.fov, name).toBeCloseTo(26.3812, 4);
    }
    const actor = fakeActor();
    await d.bindEvrae(actor);
    near(actor.position.toArray(), ffxPointTuple(FFX_EVRAE_SPOTS.near));
  });

  it('installs the FAR views and stands Evrae on FFX\'s FAR spot when the range shifts, and back', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
    resize(1920, 1080);
    const { d, cam } = director();
    d.staging = ffxStaging();
    d.bindCamera(cam);
    const actor = fakeActor();
    await d.bindEvrae(actor);

    d.setRange('far', { immediate: true });
    await vi.waitFor(() => near(actor.position.toArray(), ffxPointTuple(FFX_EVRAE_SPOTS.far)));
    const far = ffxRig(FFX_FAR_VIEW);
    for (const name of ['idle', 'action', 'enemy']) near(rigOf(cam, name).position, far.position);

    d.setRange('near', { immediate: true });
    await vi.waitFor(() => near(actor.position.toArray(), ffxPointTuple(FFX_EVRAE_SPOTS.near)));
    near(rigOf(cam, 'idle').position, ffxRig(FFX_NEAR_VIEW).position);
  });

  it('keeps FFX\'s framing on a 4:3 window: no stand-back, no trim', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
    resize(1024, 768);
    const { d, cam } = director();
    d.staging = ffxStaging();
    d.bindCamera(cam);
    const actor = fakeActor();
    await d.bindEvrae(actor);
    near(rigOf(cam, 'idle').position, ffxRig(FFX_NEAR_VIEW).position);
    near(actor.position.toArray(), ffxPointTuple(FFX_EVRAE_SPOTS.near));
  });
});
