import type { ArrivalDirectors } from '../engine/StageArrivals.ts';
import type { Group, Scene, Vector3 } from 'three';
import type { Backdrop } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import type { LightRig } from '../engine/Lighting.ts';
import type { ParticleField } from '../engine/Particles.ts';
import type { ScenePalette } from '../engine/Renderer.ts';

/**
 * The contract between a **scene** and whatever is driving it.
 *
 * A scene owns *the world*: the painted backdrop, the light rig, the weather,
 * the ground, the camera rigs and the colour grade. It owns **no actors**, no
 * battle state and no UI — the battle presenter parks its own `PaintedActor`s
 * on the slots the scene publishes, and drives its own `BattleCamera` from the
 * rigs the scene publishes.
 *
 * That split is the whole point: five scene agents can build five locations in
 * parallel against this one interface, and the battle/presenter agents can
 * build against it before a single painting exists.
 *
 * See `docs/ENGINE-API.md#scene-builder-contract`.
 */
export interface SceneBuild {
  /**
   * Everything the scene owns, under one node. The caller adds this to its
   * `Scene`; the scene never touches the `Scene` itself except through
   * {@link Backdrop.applyTo}, which installs the matched distance fog.
   */
  readonly group: Group;

  /** The painting stack, its sampled palette and the 3D ground plane. */
  readonly backdrop: Backdrop;

  /** Key / fill / rim / ambient plus the flickerable practical. */
  readonly lights: LightRig;

  /**
   * Weather and atmosphere fields, already parented to {@link group} and
   * already driven by {@link update}. Exposed so the caller can call
   * `setPixelScale` on them when the render height changes.
   */
  readonly particles: ParticleField[];

  /**
   * Camera rigs this scene guarantees. A presenter may add more, but these
   * four always exist, so generic battle flow never has to know the location:
   *
   * - `intro` — the establishing shot the battle opens on.
   * - `idle`  — the default CTB framing; party and enemies both in frame.
   * - `action` — pushed in for an attack or ability beat.
   * - `victory` — on the party, after the last enemy falls.
   */
  readonly rigs: Record<SceneRigName, CameraRig>;

  /**
   * Seven standing positions for the player's party, in order.
   *
   * `[0..2]` are the **active** three, in FFX's shallow left-facing arc, and
   * `[3..6]` are **reserve** slots parked off-camera — a switched-in character
   * walks from its reserve slot to the active slot it is taking, which is why
   * they are real world positions rather than `null`.
   */
  readonly partySlots: Vector3[];

  /**
   * Enemy standing positions, right of frame, ordered front-to-back. A boss
   * that needs more room than slot 0 offers can be placed anywhere; these are
   * the *defaults* a generic encounter builder uses.
   */
  readonly enemySlots: Vector3[];

  /** The scene's grade + post settings, handed to `Renderer.applyPalette`. */
  readonly palette: ScenePalette;

  /**
   * This scene's own world heights (PR-0093), publishing what its own actor-height
   * table already documents, e.g. {@link LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc}
   * instead of the Gagazet-composition default every `SceneFactory` scene got
   * before this field existed (`src/scenes/index.ts`'s `fromSceneBuild`, which
   * hard-coded `partyHeight: 1.82, enemyHeight: 4.1` for every registered scene).
   * Optional and additive: a scene that omits it keeps that same 1.82 / 4.1
   * fallback, so the five scenes that do not set it render pixel-identically to
   * before. A scene with human-scale enemies (no boss the size of Bahamut or
   * Vegnagun's tail) should set `enemyHeight` to its own cast's scale so a
   * `worldHeightFor(isBoss)` actor is not staged as a giant.
   */
  readonly partyHeight?: number;
  readonly enemyHeight?: number;

  /** @param dt seconds. The caller must call this every frame. */
  update(dt: number): void;

  /** Release every texture, geometry and material the scene owns. */
  dispose(): void;

  /**
   * Optional: how this location stages a combatant revealed mid-battle, by
   * combatant id (`src/engine/StageArrivals.ts`). Without one, a revealed
   * enemy fades in on its slot.
   */
  readonly arrivals?: ArrivalDirectors;
}

/** The rigs every scene must publish. */
export type SceneRigName = 'intro' | 'idle' | 'action' | 'victory';

export interface SceneBuildOptions {
  /**
   * Camera the parallax stack is aligned for. A scene defaults this to its own
   * `idle` rig position, so passing it is only needed when a caller means to
   * frame the location from somewhere unusual.
   */
  cameraRef?: [number, number, number];
  /**
   * Trim the expensive bits (particle counts, shadow map size, parallax layer
   * count) for a weak GPU. Default `'high'`.
   */
  quality?: 'low' | 'high';
  /**
   * Poll for art that has not been generated yet and hot-swap it in. Defaults
   * to on in dev, off in a build.
   */
  watchAssets?: boolean;
}

/**
 * What every scene module default-exports, or exports as `build<Place>Scene`.
 *
 * ```ts
 * // src/scenes/zanarkand-dome.ts
 * export const buildZanarkandDomeScene: SceneFactory = async (opts = {}) => { ... };
 * ```
 *
 * It is `async` because the paintings are fetched; it must never reject —
 * missing art degrades to a procedural stand-in (see `PaintedArt.load`).
 */
export type SceneFactory = (opts?: SceneBuildOptions) => Promise<SceneBuild>;

/**
 * Attach a built scene to a `Scene`: parents the group **and** installs the
 * backdrop's matched distance fog.
 *
 * Always use this rather than a bare `scene.add(build.group)` — the fog colour
 * is sampled from the painting's horizon band, and without it the 3D ground
 * runs to a hard edge the painting does not have.
 */
export function mountScene(build: SceneBuild, scene: Scene): void {
  scene.add(build.group);
  if (build.backdrop.fog) scene.fog = build.backdrop.fog;
  if (build.backdrop.background) scene.background = build.backdrop.background;
}

/** Undo {@link mountScene} without disposing the scene. */
export function unmountScene(build: SceneBuild, scene: Scene): void {
  scene.remove(build.group);
  if (scene.fog === build.backdrop.fog) scene.fog = null;
  if (scene.background === build.backdrop.background) scene.background = null;
}
