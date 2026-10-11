/**
 * **The hidden Fayth chapter's skins** (FFX only; `docs/plans/fayth-3d.md`, "Two skins, one scene"): what the deck scene does on a **dev server**, and only there. `./exp-fayth-deck.ts` reaches this file through a
 * dynamic `import()` inside `import.meta.env.DEV`, so a production build neither contains it nor the model loader behind it.
 *
 * Three outcomes, chosen once when the scene is built:
 *
 * - **Phase 1's scene, untouched** (the website, production, every test, a dev server without Bailey's converted folder): `stageFaythSkin` returns the build it was given. `?skin=classic` forces this too.
 * - **`ffx`** (a dev server whose probe found the folder, `./ffx3d/localAssets.ts`): Bailey's own FFX models and stage (`../engine/ffx3d/models.ts`) take the place of the painted deck, plate, sky and billboards.
 * - **`painted`** (`?skin=painted`, dev only, with or without the folder): the **painted skin at FFX's staging**. The billboards stand where `ffx` stands its models and the painted deck is laid under them, so the
 *   two can be compared shot for shot. It is a comparison mode; production keeps phase 1's layout.
 *
 * Both skins share one staging (`../engine/ffx3d/ffxStaging.ts`, every point through `ffxWorld.ts`'s one transform):
 *
 * - **Where things stand.** The party's three slots and Evrae's NEAR and FAR spots are FFX's. They reach the stage as the scene's slots and Evrae's pin (`SceneStaging.enemySpots`), and the range director takes the
 *   same spots (`AirshipRangeDirector.staging`), so it moves Evrae between FFX's NEAR and FAR as it always has. `holdParty` keeps the relax step off the party.
 * - **Which way they face.** Bodies face each other along x: the party toward -x (Evrae), Evrae toward +x (`SceneStaging.sideFacing`, the switch FF7's reactor uses). A billboard is flat (the actors' interim yaw is off,
 *   `FfxSkin`), so seen from either side of the deck it is the same painting; the stage mirrors it to face the way the body faces, and seen from behind a mirrored plane reads as painted.
 * - **The camera.** `intro`, `idle`, `action`, `enemy`, `party` and `victory` are FFX's NEAR default view, the `-far` rigs its FAR default view, until FFX's camera replay drives them (`./exp-fayth-camera.ts`, phase 4b); `overview` is a wide
 *   view of the whole fight for pictures. The range director installs the same NEAR / FAR views under `idle`, `action` and `enemy`. Vertical field of view 26.4 degrees, kept as the window widens.
 *
 * Game case: FFX only.
 */

import { Color, Mesh, Scene, Vector3, type MeshBasicMaterial, type Object3D } from 'three';
import { ATTACK_IMPACT } from '../engine/BattlePresenterActors.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { tapShotDirector, type BeatListener } from '../engine/ffx3d/beatTap.ts';
import { FfxAnimator } from '../engine/ffx3d/ffxAnimator.ts';
import { loadFfxClips } from '../engine/ffx3d/ffxClips.ts';
import { FfxSky, bakeBowl, loadSkyAssets } from '../engine/ffx3d/ffxSky.ts';
import { FfxSkin } from '../engine/ffx3d/ffxSkin.ts';
import { FFX_SKY_GAIN, FFX_STAGE_PARTS, ffxFaythStaging, type FfxStaging } from '../engine/ffx3d/ffxStaging.ts';
import { probeFfxLocal, type FfxLocalManifest } from '../engine/ffx3d/localAssets.ts';
import { loadFfxModels, shapeStage, type FfxModels } from '../engine/ffx3d/models.ts';
import { paceRate } from '../engine/pace.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { WorldRig } from '../engine/ffx3d/ffxWorld.ts';
import { airshipRangeDirectorOf } from './evrae-airship-director.ts';
import type { SceneBuild } from './types.ts';

export type FaythSkinKind = 'ffx' | 'painted';

/** The query switch: `painted` (the painted skin at FFX's staging), `classic` (phase 1's scene as it was), or nothing. */
export function skinParam(search: string): 'painted' | 'classic' | null {
  const v = new URLSearchParams(search).get('skin');
  return v === 'painted' || v === 'classic' ? v : null;
}

/** The query switch for the motions: `?ffxanim=off` keeps the models in their idle pose (phase 3's), for comparing; anything else, or nothing, animates them when the folder has the clips. */
export function animParam(search: string): 'off' | null {
  return new URLSearchParams(search).get('ffxanim') === 'off' ? 'off' : null;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some of its fields replaced. The getters (the backdrop that hot-swaps) are copied as getters, so the scene still reads the live one. */
export function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/** The skin each derived build carries (the camera's frames read the models' extents through it, `./exp-fayth-camera.ts`); a build with no skin has none. */
const SKINS = new WeakMap<SceneBuild, FfxSkin>();
export const skinOf = (build: SceneBuild): FfxSkin | null => SKINS.get(build) ?? null;

/** The beats the animator listens to, by the derived build that carries it (the camera glue wraps its own director with the same listener, `./exp-fayth-camera.ts`). */
const TAPS = new WeakMap<SceneBuild, BeatListener>();
export const tapOf = (build: SceneBuild): BeatListener | null => TAPS.get(build) ?? null;

/** The actor the airship's range flights move (the range director's subject). */
const FLYER = 'evrae';

const rig = (v: WorldRig): CameraRig => ({ position: [...v.position], lookAt: [...v.lookAt], fov: v.fov, sway: v.sway });

/** The scene's rigs: FFX's NEAR default view under every near name, its FAR default under every `-far` name, and the overview. A fresh object: Chapter VIII's `RIGS` is shared and never touched. */
export function faythRigs(staging: FfxStaging): Record<string, CameraRig> {
  const { near, far } = staging.views;
  return {
    intro: rig(near),
    idle: rig(near),
    action: rig(near),
    enemy: rig(near),
    party: rig(near),
    victory: rig(near),
    'idle-far': rig(far),
    'action-far': rig(far),
    'enemy-far': rig(far),
    overview: rig(staging.overview),
  };
}

/**
 * The `ffx` skin's grade: neutral. The painted deck's palette (vignette, grain, a tilt-shift blur at the top and bottom of the frame, a cold shadow tint, bloom tuned for painted cloud) is the painted look;
 * the models and the stage are shown as their own textures draw them, with only a little bloom.
 */
const FFX_SKIN_PALETTE: ScenePalette = { name: 'fayth-ffx', exposure: 1, bloomThreshold: 1.0, bloomStrength: 0.12, bloomRadius: 0.4, vignette: 0, grain: 0, tiltMaxBlur: 0 };

/** What the deck factory built, found again by the names and types it built them with. */
interface PaintedParts {
  readonly sky: Object3D | null;
  readonly deck: Object3D | null;
  readonly pools: readonly Mesh[];
}

function paintedParts(build: SceneBuild): PaintedParts {
  const { group } = build;
  return {
    sky: group.getObjectByName('sky-roll') ?? null,
    deck: group.getObjectByName('airship-deck') ?? null,
    pools: group.children.filter((c): c is Mesh => c instanceof Mesh), // the three light pools under the party: the only meshes the deck factory hangs straight on the group
  };
}

/**
 * The painted skin at FFX's staging: the deck turned a quarter so its rail runs along the party's column on Evrae's side, and set on the floor the party stands on; the sky plate behind the party, as seen
 * from FFX's NEAR camera; the light pools under the party's feet. The cloud sheets and the haze (painted for the other camera, drawn behind the rail) and the wind-borne grit are hidden.
 */
function layPainted(parts: PaintedParts, staging: FfxStaging, particles: readonly Object3D[]): void {
  const slots = staging.partySlots.slice(0, 3);
  const centre = slots.reduce((sum, s) => sum.add(s), new Vector3()).multiplyScalar(1 / slots.length);
  const nearest = Math.min(...slots.map((s) => s.x));
  for (const p of particles) p.visible = false;
  parts.pools.forEach((pool, i) => {
    const s = slots[i];
    if (s) pool.position.set(s.x, s.y + 0.02, s.z);
  });
  const { deck, sky } = parts;
  if (deck) {
    deck.rotation.y = Math.PI / 2; // the rail (local -z) faces -x, toward Evrae
    deck.position.set(nearest + 0.5, centre.y, centre.z); // its edge stands 2.2 beyond the party's nearest slot
    deck.traverse((o) => {
      if (o instanceof Mesh && o.renderOrder < 0) o.visible = false; // the painted air (cloud sheets and haze) belongs to the other camera
    });
  }
  if (sky) {
    // 80 world units down the NEAR camera's view line, facing it: wide enough (the plate is 90 wide, scaled 1.8) to fill the frame at 16:9 with its roll.
    const cam = new Vector3(...staging.views.near.position);
    const aim = new Vector3(...staging.views.near.lookAt).sub(cam).normalize();
    const at = cam.clone().addScaledVector(aim, 80);
    sky.position.copy(at);
    sky.rotation.y = Math.atan2(cam.x - at.x, cam.z - at.z);
    sky.scale.setScalar(1.8);
  }
}

/** Hide everything painted that the `ffx` skin replaces: the plate and sky, the deck and rail, the light pools, the grit. */
function hidePainted(parts: PaintedParts, particles: readonly Object3D[]): void {
  if (parts.sky) parts.sky.visible = false;
  if (parts.deck) parts.deck.visible = false;
  for (const pool of parts.pools) pool.visible = false;
  for (const p of particles) p.visible = false;
}

/**
 * Apply the skin to the deck the factory built, or return it unchanged. `build` is Chapter VIII's deck with the stub director (`./exp-fayth-deck.ts`); the result is a derived build: new rigs, slots and pins in
 * FFX's staging, a skin that takes the actors, and an `update` and `dispose` that run the skin's. Chapter VIII's own tables (its `RIGS`, its slot arrays) are never written.
 */
export async function stageFaythSkin(build: SceneBuild): Promise<SceneBuild> {
  const param = skinParam(typeof location === 'undefined' ? '' : location.search);
  if (param === 'classic') return build;
  let kind: FaythSkinKind = 'painted';
  let models: FfxModels | null = null;
  let clouds: FfxSky | null = null;
  let clear: Color | null = null;
  let manifest: FfxLocalManifest | null = null;
  if (param !== 'painted') {
    manifest = await probeFfxLocal();
    if (!manifest) return build; // no folder: exactly phase 1
    models = await loadFfxModels(manifest);
    for (const problem of models.problems) console.warn(`[ffx-local] ${problem}`);
    if (!models.stage && Object.keys(models.actors).length === 0) return build; // nothing loaded: the painted chapter plays
    kind = 'ffx';
  }

  const staging = ffxFaythStaging();
  const { near, far } = staging.views;
  const director = airshipRangeDirectorOf(build.group);
  if (director) {
    director.staging = {
      near: { evrae: staging.spots.near, rigs: { idle: near, action: near, enemy: near } },
      far: { evrae: staging.spots.far, rigs: { idle: far, action: far, enemy: far } },
    };
  }

  const parts = paintedParts(build);
  if (kind === 'ffx') {
    hidePainted(parts, build.particles);
    if (models?.stage) {
      const shaped = shapeStage(models.stage.root, FFX_STAGE_PARTS);
      if (shaped.drawn === 0) console.warn('[ffx-local] the stage has none of the parts the battle draws (a renamed file?): no stage');
      const assets = manifest ? await loadSkyAssets(manifest) : null;
      // The bowl as the game shades it (`tone(texel * vertex colour)`) with the cloud sea under the ship; without the exported sky, the converter's colours brightened as the first pictures had them.
      if (!(assets && models.stage.sky && bakeBowl(models.stage.sky, assets.sidecar.texel) > 0)) {
        for (const mesh of shaped.sky) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) (m as MeshBasicMaterial).color.setScalar(FFX_SKY_GAIN);
      }
      if (assets) {
        const sea = new FfxSky(assets.textures, staging.partySlots[0]!.y);
        if (sea.count > 0) {
          build.group.add(sea.group);
          clouds = sea;
        } else sea.dispose();
      }
      if (models.stage.background && assets) clear = new Color(...models.stage.background); // with the exported sky only: the colour goes with the bowl and the clouds
      build.group.add(models.stage.root);
      models.stage.sky?.scale.setScalar(0.5); // the bowl's radius (661 world units) is past the camera's far plane; it only carries a colour gradient, so a smaller bowl on the camera is the same sky
    }
  } else {
    layPainted(parts, staging, build.particles);
  }

  // The motions: the clip table and the clips, when the folder has them (no clipmap, or none of the files loading, is phase 3's still models).
  let animator: FfxAnimator | null = null;
  if (models && manifest && animParam(typeof location === 'undefined' ? '' : location.search) !== 'off') animator = await animatorFor(manifest, models);
  const skin = new FfxSkin({ host: build.group, models, staging, ...(animator ? { animator } : {}) });
  const tap: BeatListener | null = animator && listenerOf(animator);
  if (animator) (globalThis as { __ffxanim?: FfxAnimator }).__ffxanim = animator; // the debug handle (this module is dev-server only)
  let lastRange: 'near' | 'far' | null = null;
  let camera: { getWorldPosition(target: Vector3): Vector3 } | null = null;
  const eye = new Vector3();
  const sky = models?.stage?.sky ?? null;
  const derived = derive(build, {
    ...(kind === 'ffx' ? { palette: FFX_SKIN_PALETTE } : {}),
    rigs: faythRigs(staging) as SceneBuild['rigs'],
    partySlots: staging.partySlots,
    enemySlots: staging.enemySlots,
    enemySpots: staging.enemySpots,
    sideFacing: { party: -1, enemy: 1 },
    bindCamera: (c) => {
      camera = c ? c.camera : null;
    },
    update(dt: number): void {
      build.update(dt);
      skin.update(dt);
      if (clear && build.group.parent instanceof Scene && build.group.parent.background !== clear) build.group.parent.background = clear; // the sky above the bowl is the colour the game clears to
      const range = animator ? airshipRangeDirectorOf(build.group) : null;
      if (animator && range) {
        if (lastRange !== null && range.current !== lastRange) animator.noteRange(FLYER, range.current);
        lastRange = range.current;
      }
      if (camera) {
        camera.getWorldPosition(eye);
        if (sky && sky.parent) sky.position.copy(sky.parent.worldToLocal(eye.clone())); // the sky bowl rides the camera
        clouds?.update(dt, eye); // and the cloud sea, horizontally
      }
    },
    dispose(): void {
      const g = globalThis as { __ffxanim?: FfxAnimator };
      if (animator && g.__ffxanim === animator) delete g.__ffxanim; // not a newer scene's handle
      animator?.dispose();
      clouds?.dispose();
      skin.dispose();
      models?.dispose();
      build.dispose();
    },
    ...(tap ? { shotDirector: tapShotDirector(build.shotDirector, tap) } : {}), // every beat is also told to the animator; the director's own answers are unchanged
  });
  SKINS.set(derived, skin);
  if (tap) TAPS.set(derived, tap);
  return derived;
}

/** The beats an animator wants to hear: an action opening (its row, the ability, the lunge's lead), a blow landing, the action closing. */
export function listenerOf(animator: FfxAnimator): BeatListener {
  return {
    open: (_beat, ctx) => animator.noteOpen(ctx.actor.id, { abilityId: ctx.action.abilityId, kind: ctx.action.kind, lead: ctx.ms(440 * ATTACK_IMPACT) / 1000 }), // the lunge's apex: where the blow lands
    impact: (_beat, ctx) => {
      if (ctx.actor) animator.noteImpact(ctx.actor.id);
    },
    close: (_beat, ctx) => {
      if (ctx.actor) animator.noteClose(ctx.actor.id);
    },
  };
}

/** The animator for the loaded models, or null when the folder has no clip table or none of the animation files loaded (each problem is warned once). */
async function animatorFor(manifest: FfxLocalManifest, models: FfxModels): Promise<FfxAnimator | null> {
  const found = await loadFfxClips(manifest, Object.keys(models.actors));
  if (!found) return null;
  for (const problem of found.problems) console.warn(`[ffx-local] ${problem}`);
  const animator = new FfxAnimator({ map: found.map, clips: found.clips, rate: () => paceRate('action') });
  return Object.keys(models.actors).some((id) => animator.canAnimate(id)) ? animator : null;
}
