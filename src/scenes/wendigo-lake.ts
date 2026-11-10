import { Group, Vector3 } from 'three';
import { Backdrop } from '../engine/Backdrop.ts';
import type { BattleCamera, CameraRig } from '../engine/BattleCamera.ts';
import { LightRig } from '../engine/Lighting.ts';
import { eyeCandy } from '../engine/fx/EyeCandy.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneEntry, SceneSlots, Spot } from './index.ts';
import { buildDemoScene } from './demo.ts';
import { buildMacalaniaTempleScene, MACALANIA_TEMPLE_ACTOR_HEIGHTS, MACALANIA_TEMPLE_SLOTS } from './macalania-temple.ts';
import { LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID, WENDIGO_ID, WENDIGO_SCENE } from '../data/ffx/wendigo-ids.ts';
import { LAKE_AEONS, LAKE_NATIVE_HEIGHT } from '../data/ffx/lake-models.ts';

// ---------------------------------------------------------------------------
// Lake Macalania (FFX): the hidden Wendigo chapter's stage, a 3D frozen lake
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Wendigo and the two Guado Guardians (`research/re-ffx-wendigo-lake-macalania.md`; the paper preflight is `docs/plans/ch-wendigo-review.md`).
//
// **The stage is a real 3D lake** (`../engine/lake3d/`, loaded on use so no other chapter carries it): a disc of mirror ice under an aurora sky with falling snow, volumetric light shafts and ice crystals, the Meshy party,
// Wendigo and Guardians on the battle's actors with the party's real FFX motions retargeted onto them, a flying camera director for the opening, the big moves and the win, and the ice-break epilogue after the win (the field
// event, RE 2). The seam is the one the battle lane left: the scene key `wendigo-lake` and `WENDIGO_LAKE_SLOTS` (Chapter VII's picked party layout B, kept: the party stands clear of the FFX command stack, the three enemies
// on the formation's spots). `?lake=painted` plays the stand-in the battle lane shipped (Chapter VII's painted Macalania Temple with a procedural Wendigo), the comparison; a tree without the model files plays on neutral
// capsules.
//
// HEIGHTS (presentation, not game data: rule 6). The game draws Wendigo **1.55 times Tidus** and the Guardian **1.08 times** (`research/re-ffx-wendigo-lake-macalania.md` 1.1 and 1.3, from the size table's drawn heights), so on this
// stage's Tidus of 1.75 they stand 2.71 and 1.89 (the Temple's own Guardian is 1.85). The Meshy models are made to those heights.

/** The party's shared world height on this stage: Chapter VII's Tidus, 1.75. */
const PARTY_HEIGHT = MACALANIA_TEMPLE_ACTOR_HEIGHTS.tidus;

/** Wendigo as a multiple of Tidus (the size table's drawn heights: 28.07 against Tidus's 18.15, a measured fact, `research/re-ffx-wendigo-lake-macalania.md` 1.1; its design height E, 26.4, is not what is drawn). */
export const WENDIGO_OVER_TIDUS = 1.55;
/** The Guardian as a multiple of Tidus (19.58 against 18.15). */
export const GUARDIAN_OVER_TIDUS = 1.08;

/** Wendigo's and the Guardian's world heights on this stage. */
export const WENDIGO_HEIGHT = Math.round(PARTY_HEIGHT * WENDIGO_OVER_TIDUS * 100) / 100;
export const LAKE_GUARDIAN_HEIGHT = Math.round(PARTY_HEIGHT * GUARDIAN_OVER_TIDUS * 100) / 100;

/** Chapter VII's picked party layout B, kept: the three in front, the bench off frame-left (`macalania-temple.ts` `MACALANIA_TEMPLE_SLOTS`). */
const PARTY_SLOTS: Spot[] = MACALANIA_TEMPLE_SLOTS.party.map((s) => [...s] as Spot);

/** Where the three stand, in the formation's order (Guardian A, Wendigo, Guardian B): layout B's three enemy spots, Wendigo on Seymour's focal point. */
const ENEMY_SPOTS: Readonly<Record<string, Spot>> = {
  [LAKE_GUARDIAN_A_ID]: [1.0, 0, -3.6],
  [WENDIGO_ID]: [2.5, 0, -5.8],
  [LAKE_GUARDIAN_B_ID]: [3.6, 0, -1.8],
};

/** This fight's staging: the party held on its slots, the three pinned to their spots at their heights. */
export const WENDIGO_LAKE_STAGING = {
  holdParty: true,
  enemySpots: ENEMY_SPOTS as Record<string, Spot>,
  figureHeights: { [WENDIGO_ID]: WENDIGO_HEIGHT, [LAKE_GUARDIAN_A_ID]: LAKE_GUARDIAN_HEIGHT, [LAKE_GUARDIAN_B_ID]: LAKE_GUARDIAN_HEIGHT } as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`): enemy index = the formation's `slot` field (0 Guardian A, 1 Wendigo, 2 Guardian B). */
export const WENDIGO_LAKE_SLOTS: SceneSlots = {
  party: PARTY_SLOTS,
  enemy: [ENEMY_SPOTS[LAKE_GUARDIAN_A_ID], ENEMY_SPOTS[WENDIGO_ID], ENEMY_SPOTS[LAKE_GUARDIAN_B_ID]].map((s) => [...(s as Spot)] as Spot),
  partyHeight: PARTY_HEIGHT,
  enemyHeight: WENDIGO_HEIGHT,
  ...WENDIGO_LAKE_STAGING,
};

/** The scene-table row (the anime chapter's pattern, `./exp-anime-stage.ts` `EXP_ANIME_SCENE_ENTRY`): real (the factory wins); `build` is the unreachable demo diorama, as for every scene with a factory of its own. */
export const WENDIGO_SCENE_ENTRY: SceneEntry = {
  key: WENDIGO_SCENE,
  title: 'Lake Macalania — Wendigo',
  build: buildDemoScene,
  slots: WENDIGO_LAKE_SLOTS,
  placeholder: false,
};

/** What the 3D stage adds to the staging: the painted rigs are off (a rig's parts are not planes the skin could hide). */
export const WENDIGO_LAKE_3D_STAGING = { ...WENDIGO_LAKE_STAGING, noRigs: true } as const;

/** The query switch: `?lake=painted` plays the painted stand-in (the comparison); anything else, or nothing, is the 3D lake. */
export function paintedForced(search: string): boolean {
  return new URLSearchParams(search).get('lake') === 'painted';
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/** The stand-in the battle lane shipped: Chapter VII's Macalania Temple scene with this fight's staging (`?lake=painted`). */
export const buildTempleStandIn: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildMacalaniaTempleScene(opts);
  const out = derive(base, {});
  return Object.assign(out, { holdParty: WENDIGO_LAKE_STAGING.holdParty, enemySpots: WENDIGO_LAKE_STAGING.enemySpots, figureHeights: WENDIGO_LAKE_STAGING.figureHeights });
};

/** A tiny flat canvas: the backdrop's stand-in painting, which is never drawn (the lake is 3D) but gives the engine's scene contract the palette, fog and background it expects. */
function flatPainting(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 9;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = '#16384f';
    g.fillRect(0, 0, 16, 9);
  }
  return c;
}

/**
 * **The lake for Wendigo**: a bare backdrop (hidden: fog and background only), the engine's light rig (hidden: the stage has its own), the 3D lake, the Meshy models on the actors, the flying camera and the epilogue. It owns
 * no actors (`docs/ENGINE-API.md#scene-builder-contract`). The models load before the scene is handed back (the front line and the three enemies; the bench follows in the background); a file that is not there is replaced by a
 * neutral capsule, so the chapter always plays.
 */
export const buildWendigoLakeScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const search = typeof location === 'undefined' ? '' : location.search;
  if (paintedForced(search)) return buildTempleStandIn(opts);

  // where the scene's own time goes (a dev server's debug handle reads it as `__lake3d.timings`, milliseconds since the factory was called)
  const t0 = typeof performance === 'undefined' ? 0 : performance.now();
  const timings: Record<string, number> = {};
  const mark = (name: string): void => {
    if (typeof performance !== 'undefined') timings[name] = Math.round(performance.now() - t0);
  };
  const [{ buildLakeStage }, { loadLakeModels }, { loadProps }, { LakeSkin }, { tapDirector }, { CameraDirector }, { Epilogue, sinkFor }, { RIGS, EPILOGUE, BENCH_SLOTS }, { LAKE_PALETTE, LOOK }] = await Promise.all([
    import('../engine/lake3d/stage.ts'),
    import('../engine/lake3d/load.ts'),
    import('../engine/lake3d/props.ts'),
    import('../engine/lake3d/skin.ts'),
    import('../engine/lake3d/beats.ts'),
    import('../engine/lake3d/director.ts'),
    import('../engine/lake3d/epilogue.ts'),
    import('../engine/lake3d/layout.ts'),
    import('../engine/lake3d/look.ts'),
  ]);

  mark('imports');
  const group = new Group();
  group.name = 'scene:wendigo-lake';
  // The engine's scene contract wants a backdrop (its fog and background are installed by `mountScene`) and a light rig: both are kept and neither is seen.
  const backdrop = await Backdrop.create({ placeholder: flatPainting, ground: false, layers: [], fogPlanes: false, fog: { near: LOOK.fog.near, far: LOOK.fog.far, colorMix: 0 }, background: LOOK.background });
  backdrop.fog?.color.set(LOOK.fog.colour);
  backdrop.group.visible = false;
  group.add(backdrop.group);
  const lights = new LightRig({ palette: backdrop.palette, shadows: false });
  for (const l of [lights.key, lights.fill, lights.rim, lights.ambient, lights.practical]) l.visible = false;
  group.add(lights.group);

  mark('backdrop');
  const stage = buildLakeStage({ ...(opts.quality ? { quality: opts.quality } : {}) });
  group.add(stage.group);
  const [models, props] = await Promise.all([loadLakeModels({ base: import.meta.env.BASE_URL, heights: LAKE_NATIVE_HEIGHT, warn: (m) => console.warn(m) }), loadProps({ base: import.meta.env.BASE_URL, warn: (m) => console.warn(m) })]);
  mark('models-and-props');
  group.add(props.group);

  const skin = new LakeSkin({ host: group, models });
  let cam: BattleCamera | null = null;
  const where = (id: string): [number, number, number] | null => {
    const actor = group.parent?.children.find((c) => c instanceof PaintedActor && c.name === id);
    if (!actor) return null;
    const p = actor.getWorldPosition(new Vector3());
    return [p.x, p.y, p.z];
  };
  // The win and the ice break (RE 2) are played here, in the battle: the story's post scene is a separate screen over a painted plate and owns no 3D scene. The director holds the beat after the last foe's fall until
  // the break is over (`breakDone` is resolved by `update` when the epilogue's clock runs out), and the victory poses follow under the white.
  const FOES = [WENDIGO_ID, LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID];
  const isDown = (id: string): boolean => {
    const actor = group.parent?.children.find((c): c is PaintedActor => c instanceof PaintedActor && c.name === id);
    if (!actor) return true; // never staged
    const stone = (actor as unknown as { u?: { desaturate?: { value: number } } }).u?.desaturate?.value ?? 0;
    return actor.lifeState === 'down' || !actor.visible || actor.alpha < 0.05 || stone > 0.5; // fallen, faded away or turned to stone: the engine counts all three defeated
  };
  let breakDone: (() => void) | null = null;
  const director = new CameraDirector(where, {
    finished: () => FOES.every(isDown),
    start: () => {
      skin.celebrating = true; // the party takes its victory poses on the cracking ice
      epilogue.start();
      return new Promise<void>((resolve) => {
        breakDone = resolve;
      });
    },
  });
  const epilogue = new Epilogue((n) => {
    if (!eyeCandy.reduceMotion) cam?.shake(n === 0 ? 0.16 : 0.3, n === 0 ? 700 : 950); // the two shakes (RE 2); REDUCE MOTION keeps the picture still
  });
  const windupFor = new Set<string>(['wendigo', LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID, ...LAKE_AEONS]); // the aeons' blows are whole performances too (their attack is 1.3 to 3.5 s)
  const directed = tapDirector(director.shotDirector, skin.listener, windupFor);
  let layersNow: readonly number[] = [];
  const none = { down: 0, tilt: 0 };
  skin.sinkOf = (id) => {
    if (layersNow.length === 0) return none;
    const at = where(id);
    return at ? sinkFor(layersNow, at[0], at[2]) : none; // whoever stands on a layer falls with it
  };
  if (import.meta.env.DEV) (globalThis as { __lake3d?: unknown }).__lake3d = { skin, models, stage, director, epilogue, props, timings };

  const toRig = (r: (typeof RIGS)[string]): CameraRig => ({ position: [...r.position], lookAt: [...r.lookAt], fov: r.fov, ...(r.sway === undefined ? {} : { sway: r.sway }) });
  const rigs = Object.fromEntries(Object.entries(RIGS).map(([k, v]) => [k, toRig(v)])) as SceneBuild['rigs'];
  const partySlots = [...PARTY_SLOTS, ...BENCH_SLOTS.map((s) => [...s] as Spot)].map((s) => new Vector3(s[0], s[1], s[2]));
  const enemySlots = WENDIGO_LAKE_SLOTS.enemy.map((s) => new Vector3(s[0], s[1], s[2]));

  let clock = 0;
  const build: SceneBuild = {
    group,
    backdrop,
    lights,
    particles: [],
    rigs,
    partySlots,
    enemySlots,
    partyHeight: PARTY_HEIGHT,
    enemyHeight: WENDIGO_HEIGHT,
    ...WENDIGO_LAKE_3D_STAGING,
    shotDirector: directed,
    palette: LAKE_PALETTE,
    ownGrade: true, // the palette above is the whole grade: the painted chapters' eye-candy post would blow the aurora out
    bindCamera(c: BattleCamera | null): void {
      cam = c;
      director.bind(c);
      c?.snapTo('opening'); // the battle camera is made on `idle`; the scene opens on the fly-in's first key, so no frame of the fight shows from the wrong place before the flight starts
    },
    update(dt: number): void {
      clock += dt;
      lights.update(dt);
      stage.update(clock);
      director.update(dt);
      const frame = epilogue.update(dt);
      if (breakDone && epilogue.time >= EPILOGUE.length) {
        breakDone(); // the break is over: the presenter goes on to the victory beat, under the white
        breakDone = null;
      }
      layersNow = frame.ice.layers;
      stage.epilogue(frame);
      skin.update(dt);
    },
    dispose(): void {
      const g = globalThis as { __lake3d?: { skin?: unknown } };
      if (g.__lake3d?.skin === skin) delete g.__lake3d; // not a newer scene's handle
      director.dispose();
      skin.dispose(); // frees the models
      props.dispose();
      stage.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
  return build;
};
