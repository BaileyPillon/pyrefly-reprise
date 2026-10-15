/**
 * **The painted skin at FFX's staging** (the hidden Fayth chapter; FFX only; `docs/plans/fayth-3d.md`, "Two skins, one scene"): what the deck scene does to Chapter VIII's painted deck so that the party and Evrae
 * stand where FFX stands them and the sky plate sits behind them as the near default camera sees it. Production-safe (no loader, no local file): the website's scene (`./exp-fayth-table.ts`) and the dev server's
 * skins (`./exp-fayth-skin.ts`) share it.
 *
 * - **Where things stand.** The party's three slots and Evrae's NEAR and FAR spots are FFX's (`../engine/ffx3d/ffxStaging.ts`, every point through `ffxWorld.ts`'s one transform). They reach the stage as the
 *   scene's slots and Evrae's pin (`SceneStaging.enemySpots`), and the range director takes the same spots (`AirshipRangeDirector.staging`), so it moves Evrae between FFX's NEAR and FAR as it always has.
 * - **Which way they face.** Bodies face each other along x: the party toward -x (Evrae), Evrae toward +x (`SceneStaging.sideFacing`). A billboard is flat (the actors' interim yaw is off, {@link flatBillboards}),
 *   so seen from either side of the deck it is the same painting.
 * - **The camera.** `intro`, `idle`, `action`, `enemy`, `party` and `victory` are FFX's NEAR default view, the `-far` rigs its FAR default view, until a camera replay or the table drives them; `overview` is a wide
 *   view of the whole fight for pictures. Vertical field of view 26.4 degrees, kept as the window widens.
 * - **The painting.** The deck is turned a quarter so its rail runs along the party's column on Evrae's side, and set on the floor the party stands on; the sky plate is stood behind the party as seen from FFX's NEAR
 *   camera (`../engine/ffxcam/plate.ts` has the numbers); the light pools go under the party's feet. The cloud sheets and the haze (painted for the other camera, drawn behind the rail) and the wind-borne grit are hidden.
 * - **Evrae's size.** The painted Evrae is drawn as tall as the game frames him ({@link EVRAE_CAM_HEIGHT} FFX units), {@link sizeEvrae}.
 *
 * Game case: FFX only.
 */

import { Mesh, Vector3, type Object3D } from 'three';
import { PaintedActor } from '../engine/PaintedActor.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { PLATE } from '../engine/ffxcam/plate.ts';
import type { FfxStaging } from '../engine/ffx3d/ffxStaging.ts';
import { FFX_UNIT, type WorldRig } from '../engine/ffx3d/ffxWorld.ts';
import type { SceneBuild } from './types.ts';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some of its fields replaced. The getters (the backdrop that hot-swaps) are copied as getters, so the scene still reads the live one. */
export function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

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

/** What the deck factory built, found again by the names and types it built them with. */
export interface PaintedParts {
  readonly sky: Object3D | null;
  readonly deck: Object3D | null;
  readonly pools: readonly Mesh[];
}

export function paintedParts(build: SceneBuild): PaintedParts {
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
export function layPainted(parts: PaintedParts, staging: FfxStaging, particles: readonly Object3D[]): void {
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
    // `PLATE.distance` world units down the NEAR camera's view line, facing it: wide enough (the plate is 90 wide, scaled by `PLATE.scale`) to fill the frame at 16:9 with its roll.
    const cam = new Vector3(...staging.views.near.position);
    const aim = new Vector3(...staging.views.near.lookAt).sub(cam).normalize();
    const at = cam.clone().addScaledVector(aim, PLATE.distance);
    sky.position.copy(at);
    sky.rotation.y = Math.atan2(cam.x - at.x, cam.z - at.z);
    sky.scale.setScalar(PLATE.scale);
  }
}

/** The ids the painted skin lays flat: every painted actor of the chapter. */
const PAINTED_IDS: readonly string[] = ['tidus', 'wakka', 'rikku', 'lulu', 'auron', 'kimahri', 'evrae'];

/**
 * The painted skin's billboards at FFX's staging are flat: the interim yaw (the turn toward the other side that a flat painting gets) is off, so a billboard seen from the side of the deck is the same painting.
 * Returns the per-frame step: it finds each painted actor in the scene `host` is mounted in (by name, as the stage names them) and turns its interim yaw off once per actor object (the stage replaces an actor
 * of the same id, so a new object is done again).
 */
export function flatBillboards(): (host: Object3D) => void {
  const done = new WeakSet<PaintedActor>();
  return (host) => {
    const scene = host.parent;
    if (!scene) return;
    for (const id of PAINTED_IDS) {
      const actor = scene.children.find((c): c is PaintedActor => c instanceof PaintedActor && c.name === id);
      if (actor && !done.has(actor)) {
        actor.setInterimYaw(0);
        done.add(actor);
      }
    }
  };
}

/**
 * **Evrae's camHeight, FFX units** (**Proven**: his `.chr` params block, header +0x58, the float at +0x08 of the block the loader copies into the model record and the camera's getter reads; see
 * `docs/handoff/fayth-3d.md`, "Camera tracking", cause b). It is how tall the game's camera frames him.
 */
export const EVRAE_CAM_HEIGHT = 49;

/**
 * The painted Evrae drawn as tall as the game frames him: his height (the painted plane's world height at NEAR) becomes {@link EVRAE_CAM_HEIGHT} FFX units in the world. Chapter VIII drew him 4.1 world units tall
 * (the stage's boss height, "not sourced"); the game's own is 49 times the world's size of an FFX unit, 4.72. His NEAR and FAR paintings are the range director's and stay (the FAR one is sized by its own width).
 * Returns the per-frame step: it finds Evrae among the scene's actors and sizes each object once.
 */
export function sizeEvrae(): (host: Object3D) => void {
  const done = new WeakSet<PaintedActor>();
  const height = EVRAE_CAM_HEIGHT * FFX_UNIT;
  return (host) => {
    const scene = host.parent;
    if (!scene) return;
    const actor = scene.children.find((c): c is PaintedActor => c instanceof PaintedActor && c.name === 'evrae');
    if (actor && !done.has(actor)) {
      actor.setWorldHeight(height);
      done.add(actor);
    }
  };
}
