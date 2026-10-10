/**
 * Scene registry: `sceneKey` -> diorama builder + the field slots a battle
 * stages its actors on.
 *
 * `Chapter.sceneKey` (see `src/data/encounters.ts`) is the key. A key with no module of its own draws the
 * painted Mt. Gagazet composition from `demo.ts` as a **placeholder**; a location's own `src/scenes/<key>.ts`
 * replaces it with one line in {@link SCENES} and {@link SCENE_FACTORIES}, or at runtime ({@link registerScene}).
 *
 * The scene builder owns the diorama (backdrop, lights, particles, camera
 * rigs, its own demo figures). The **battle** owns the fighters: it reads
 * {@link SceneEntry.slots}, builds one {@link PaintedActor} per live combatant
 * and parents them into `PaintedScene.scene`, then calls
 * {@link SceneEntry.hideOwnActors} so the builder's stand-in figures step out
 * of frame without being disposed (the builder's own `update` still runs).
 */

import { Scene, Vector3, type PerspectiveCamera } from 'three';
import { BattleCamera } from '../engine/BattleCamera.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { buildDemoScene, type PaintedScene } from './demo.ts';
import { buildZanarkandDomeDiorama, buildZanarkandDomeScene, ZANARKAND_DOME_SLOTS } from './zanarkand-dome.ts';
import { buildGagazetScene } from './gagazet.ts';
import { buildBevelleUndergroundScene, BEVELLE_UNDERGROUND_SLOTS } from './bevelle-underground.ts';
import { buildDreamsEndScene, DREAMS_END_SLOTS } from './dreams-end.ts';
import { buildFarplanePainted, buildFarplaneScene, FARPLANE_SLOTS } from './farplane.ts';
import { buildLeblancLastRoomScene, LEBLANC_LAST_ROOM_SLOTS } from './leblanc-last-room.ts';
import { buildExpLeblancLastRoomScene, EXP_LEBLANC_LAST_ROOM_SLOTS } from './exp-leblanc-last-room.ts';
import { EXP_LEBLANC_SCENE } from '../data/art/artNamespace.ts';
import { buildMacalaniaTempleScene, MACALANIA_TEMPLE_SLOTS } from './macalania-temple.ts';
import { buildEvraeAirshipDeckScene, EVRAE_AIRSHIP_DECK_SLOTS } from './evrae-airship-deck.ts';
import { SIN_SCENE_ENTRIES, SIN_SCENE_FACTORIES } from './evrae-airship-sin.ts';
import { buildCavernStolenFaythScene, CAVERN_STOLEN_FAYTH_SLOTS } from './cavern-stolen-fayth.ts';
import { buildCloister100Scene, CLOISTER_100_SLOTS } from './cloister-100.ts';
import { buildRoadToTheFarplaneScene, ROAD_TO_THE_FARPLANE_SLOTS } from './road-to-the-farplane.ts';
import { buildGardenOfPainScene, GARDEN_OF_PAIN_SLOTS } from './garden-of-pain.ts';
import { buildDenOfWoeScene, DEN_OF_WOE_SLOTS } from './den-of-woe.ts';
import { buildDjoseChamberScene, DJOSE_CHAMBER_SLOTS } from './djose-chamber.ts';
import { DJOSE_CHAMBER_PLATE } from '../data/ixion-plates.ts';
import { buildHighbridgeScene, HIGHBRIDGE_SLOTS } from './highbridge.ts';
import { buildMushroomRockRoadScene, MUSHROOM_SLOTS } from './mushroom-rock-road.ts';
import { MUSHROOM_ROCK_SCENE } from '../data/ffx/sinspawn-gui-ids.ts';
import { buildViaPurificoScene, VIA_PURIFICO_SLOTS } from './via-purifico.ts';
import { buildSector1ReactorScene, SECTOR1_SLOTS } from './sector1-reactor.ts';
import { mountScene, stagingOf, type SceneBuild, type SceneFactory, type SceneStaging } from './types.ts';
import { attachArrivals } from '../engine/StageArrivals.ts';

/** A field position in world units. */
export type Spot = [number, number, number];

/** Where a scene puts fighters (party faces `+x`, enemies `-x`), plus its staging switches. */
export interface SceneSlots extends SceneStaging {
  /** Party slots 0..2, left to right as the CTB list numbers them. */
  party: Spot[];
  /** Enemy slots in formation order. Longer than any formation we ship. */
  enemy: Spot[];
  /** World height for a human party member. Bosses scale from `enemyHeight`. */
  partyHeight?: number;
  enemyHeight?: number;
}

/** One registered diorama. */
export interface SceneEntry {
  key: string;
  /** Human-readable location, for the loading line and the debug snapshot. */
  title: string;
  build: (camera: PerspectiveCamera) => Promise<PaintedScene>;
  slots: SceneSlots;
  /** True while this key is still drawing another chapter's diorama. */
  placeholder: boolean;
}

/**
 * A built location, normalised.
 *
 * Two kinds of scene module exist and this is what both collapse to:
 *
 * - a {@link SceneFactory} from `types.ts` — the real contract, where the scene
 *   owns the world and **no** actors, and the battle parks its own on
 *   {@link slots};
 * - the older `demo.ts`-style builder, which brings its own stand-in figures.
 *   Those get pushed out of frame by {@link hideOwnActors}.
 */
export interface LoadedScene {
  key: string;
  title: string;
  placeholder: boolean;
  scene: Scene;
  battleCamera: BattleCamera;
  palette: ScenePalette;
  slots: SceneSlots;
  update(dt: number): void;
  setPixelScale(v: number): void;
  /** Put another plate on the painting plane (`SceneBuild.swapBackdrop`); absent on a scene that cannot. */
  swapBackdrop?(key: string): Promise<void>;
  /** Named beat, for the debug API. False when the scene knows no such name. */
  trigger(name: string): boolean;
  /**
   * Push any figures the *builder* brought out of the way, so the battle's own
   * actors are the only things on the field. A `SceneFactory` scene owns no
   * actors, so this is a no-op for one.
   */
  hideOwnActors(): void;
  showOwnActors(): void;
  dispose(): void;
}

/** The Gagazet composition's own spots, reused by every placeholder entry. */
const GAGAZET_SLOTS: SceneSlots = {
  party: [
    [-1.95, 0, 1.5],
    [-3.15, 0, 0.25],
    [-1.35, 0, -0.95],
  ],
  enemy: [
    [3.0, 0, -2.6],
    [4.6, 0, -0.4],
    [1.5, 0, -4.2],
    [5.4, 0, -3.4],
    [0.4, 0, -5.6],
  ],
  partyHeight: 1.82,
  enemyHeight: 4.1,
};

/** Registry: every key with its title, slots and whether it is still a placeholder. */
const SCENES = new Map<string, SceneEntry>();

function placeholderEntry(key: string, title: string): SceneEntry {
  return { key, title, build: buildDemoScene, slots: GAGAZET_SLOTS, placeholder: true };
}

SCENES.set('demo', { key: 'demo', title: 'Mt. Gagazet — the Prominence', build: buildDemoScene, slots: GAGAZET_SLOTS, placeholder: false });
// Ixion at Djose (Chapter XVI, FFX-2 only): the Chamber on its provisional plate (not Bailey's pick yet), keyed by the plate (`data/ixion-plates.ts`).
SCENES.set(DJOSE_CHAMBER_PLATE, { key: DJOSE_CHAMBER_PLATE, title: 'Djose Temple — the Chamber of the Fayth', build: buildDemoScene, slots: DJOSE_CHAMBER_SLOTS, placeholder: false });
// `gagazet` is the one chapter whose placeholder is already the right place.
SCENES.set('gagazet', {
  key: 'gagazet',
  title: 'Mt. Gagazet — the Prominence',
  build: buildDemoScene,
  slots: GAGAZET_SLOTS,
  placeholder: false,
});
SCENES.set('zanarkand-dome', {
  key: 'zanarkand-dome',
  title: 'Zanarkand Dome — the great hall',
  build: buildZanarkandDomeDiorama,
  slots: ZANARKAND_DOME_SLOTS,
  placeholder: false,
});
/**
 * Dream's End is a real location now — `buildDreamsEndScene` in
 * {@link SCENE_FACTORIES} below — so, exactly as with Bevelle, it must stop
 * reporting itself as a stand-in to {@link sceneReport}.
 *
 * Written as the placeholder entry with two fields overridden: `build` stays the
 * demo diorama, **unreachable** ({@link loadScene} reaches it only when
 * `SCENE_FACTORIES` has no entry), and spreading keeps {@link placeholderEntry}
 * referenced (`noUnusedLocals`). The slots are the scene's own.
 */
SCENES.set('dreams-end', {
  ...placeholderEntry('dreams-end', "Dream's End — inside Sin"),
  slots: DREAMS_END_SLOTS,
  placeholder: false,
});
/**
 * Bevelle Underground is real (`buildBevelleUndergroundScene` in {@link SCENE_FACTORIES}), so it
 * must not report itself as a stand-in to {@link sceneReport} (the debug API and the critic read it).
 * `build` is the demo diorama and **unreachable**: {@link loadScene} only falls through to this
 * table when `SCENE_FACTORIES` has no entry. The slots are the scene's own (Bevelle's formation).
 */
SCENES.set('bevelle-underground', {
  key: 'bevelle-underground',
  title: "Bevelle Underground — Vegnagun's chamber",
  build: buildDemoScene,
  slots: BEVELLE_UNDERGROUND_SLOTS,
  placeholder: false,
});
SCENES.set('farplane', {
  key: 'farplane',
  title: 'Heart of the Farplane',
  build: buildFarplanePainted,
  slots: FARPLANE_SLOTS,
  placeholder: false,
});
/**
 * Chateau Leblanc, the Last Room (Chapter 6) — real (`buildLeblancLastRoomScene` in
 * {@link SCENE_FACTORIES}); `build` is the unreachable demo diorama, as for Bevelle above.
 */
SCENES.set('leblanc-last-room', { key: 'leblanc-last-room', title: 'Chateau Leblanc — the Last Room',
  build: buildDemoScene, slots: LEBLANC_LAST_ROOM_SLOTS, placeholder: false });
/** The experimental Leblanc chapter's room (FFX-2 only): the same room over its own plate and art namespace (`./exp-leblanc-last-room.ts`). */
SCENES.set(EXP_LEBLANC_SCENE, { key: EXP_LEBLANC_SCENE, title: 'Chateau Leblanc — the Last Room (new art)',
  build: buildDemoScene, slots: EXP_LEBLANC_LAST_ROOM_SLOTS, placeholder: false });
/**
 * Macalania Temple, the antechamber (Chapter 7, FFX only) — real
 * (`buildMacalaniaTempleScene` in {@link SCENE_FACTORIES}); `build` is the
 * unreachable demo diorama, as for Leblanc above
 * [docs/handoff/chapter-macalania-scene.md §6].
 */
SCENES.set('macalania-temple', { key: 'macalania-temple', title: 'Macalania Temple — the antechamber',
  build: buildDemoScene, slots: MACALANIA_TEMPLE_SLOTS, placeholder: false });
/**
 * The deck of the Fahrenheit (Chapter 8, FFX only) — real (`buildEvraeAirshipDeckScene`, which publishes the
 * NEAR/FAR range director on the scene's `userData`); `build` unreachable [docs/handoff/chapter-evrae-scene.md §6].
 * Sin's two chapters (XVII, XVIII; FFX only) stand on the same deck over their own plates (`./evrae-airship-sin.ts`).
 */
SCENES.set('evrae-airship-deck', { key: 'evrae-airship-deck', title: 'The deck of the Fahrenheit',
  build: buildDemoScene, slots: EVRAE_AIRSHIP_DECK_SLOTS, placeholder: false });
for (const entry of SIN_SCENE_ENTRIES) SCENES.set(entry.key, entry);
/** The Cavern of the Stolen Fayth (Chapter IX, FFX only): real, `build` unreachable as for Leblanc [cavern-stolen-fayth.ts]. */
SCENES.set('cavern-stolen-fayth', { key: 'cavern-stolen-fayth', title: 'Cavern of the Stolen Fayth — the last chamber',
  build: buildDemoScene, slots: CAVERN_STOLEN_FAYTH_SLOTS, placeholder: false });
/** The Via Infinito, Cloister 100 (Chapter XIII, FFX-2 only): real, `build` unreachable as for Leblanc [cloister-100.ts]. */
SCENES.set('via-infinito', { key: 'via-infinito', title: 'Via Infinito — Cloister 100',
  build: buildDemoScene, slots: CLOISTER_100_SLOTS, placeholder: false });
/** The Road to the Farplane (Chapter XI, FFX-2 only): real, `build` unreachable as for Leblanc [road-to-the-farplane.ts]. */
SCENES.set('road-to-the-farplane', { key: 'road-to-the-farplane', title: 'The Road to the Farplane',
  build: buildDemoScene, slots: ROAD_TO_THE_FARPLANE_SLOTS, placeholder: false });
/** The Garden of Pain inside Sin (Chapter XII, FFX only): real, `build` unreachable as for Leblanc [garden-of-pain.ts]. */
SCENES.set('garden-of-pain', { key: 'garden-of-pain', title: 'Inside Sin — the Garden of Pain',
  build: buildDemoScene, slots: GARDEN_OF_PAIN_SLOTS, placeholder: false });
/** The Highbridge of Bevelle (Chapter X, FFX only): real, `build` unreachable as for Leblanc [highbridge.ts]. */
SCENES.set('bevelle-highbridge', { key: 'bevelle-highbridge', title: 'Highbridge of Bevelle — before the Main Gate',
  build: buildDemoScene, slots: HIGHBRIDGE_SLOTS, placeholder: false });
/** Mushroom Rock Road (the hidden Sinspawn Gui chapter, FFX only, a provisional plate): real, `build` unreachable as for Leblanc [mushroom-rock-road.ts]. */
SCENES.set(MUSHROOM_ROCK_SCENE, { key: MUSHROOM_ROCK_SCENE, title: "Mushroom Rock Road — Operation Mi'ihen",
  build: buildDemoScene, slots: MUSHROOM_SLOTS, placeholder: false });
/** The Via Purifico, the last chamber (Chapter XIV, FFX only): real, `build` unreachable as for Leblanc [via-purifico.ts]. */
SCENES.set('via-purifico', { key: 'via-purifico', title: 'Via Purifico — the last chamber',
  build: buildDemoScene, slots: VIA_PURIFICO_SLOTS, placeholder: false });
/** The Den of Woe (Chapter XV, FFX-2 only): real, `build` unreachable as for Leblanc [den-of-woe.ts]. */
SCENES.set('den-of-woe', { key: 'den-of-woe', title: 'The Den of Woe',
  build: buildDemoScene, slots: DEN_OF_WOE_SLOTS, placeholder: false });
/** The No. 1 Reactor core (the hidden Guard Scorpion experiment, FF7 only): real, `build` unreachable [sector1-reactor.ts]. */
SCENES.set('sector1-reactor', { key: 'sector1-reactor', title: 'No. 1 Reactor — the core',
  build: buildDemoScene, slots: SECTOR1_SLOTS, placeholder: false });

/** Every registered key, in insertion order. */
export function sceneKeys(): string[] {
  return [...SCENES.keys()];
}

/** Look a scene up. Returns `undefined` for an unknown key. */
export function getScene(key: string): SceneEntry | undefined {
  return SCENES.get(key);
}

/** True when `key` is still drawing a stand-in diorama. */
export function isPlaceholderScene(key: string): boolean {
  return SCENES.get(key)?.placeholder ?? true;
}

/**
 * Register or replace a scene. The art session calls this from its own module
 * (or edits {@link SCENES} directly) to take a key off the placeholder list.
 */
export function registerScene(entry: SceneEntry): void {
  SCENES.set(entry.key, entry);
}

/**
 * Location {@link SceneFactory}s — the `src/scenes/types.ts` contract, which is
 * what a presenter that stages its *own* actors wants (the {@link SceneEntry}
 * table above is the older "builder brings figures" path).
 *
 * One line per location; each scene agent adds its own.
 */
export const SCENE_FACTORIES: Record<string, SceneFactory> = {
  gagazet: buildGagazetScene,
  farplane: buildFarplaneScene,
  'zanarkand-dome': buildZanarkandDomeScene,
  'dreams-end': buildDreamsEndScene,
  'bevelle-underground': buildBevelleUndergroundScene,
  'leblanc-last-room': buildLeblancLastRoomScene,
  [EXP_LEBLANC_SCENE]: buildExpLeblancLastRoomScene, // the experimental Leblanc chapter (FFX-2 only)
  'macalania-temple': buildMacalaniaTempleScene,
  'evrae-airship-deck': buildEvraeAirshipDeckScene,
  ...SIN_SCENE_FACTORIES, // Chapters XVII and XVIII (FFX only): the deck over Sin's plates
  'cavern-stolen-fayth': buildCavernStolenFaythScene,
  'via-infinito': buildCloister100Scene,
  'road-to-the-farplane': buildRoadToTheFarplaneScene,
  'garden-of-pain': buildGardenOfPainScene,
  'bevelle-highbridge': buildHighbridgeScene,
  [MUSHROOM_ROCK_SCENE]: buildMushroomRockRoadScene, // the hidden Sinspawn Gui chapter (FFX only)
  'via-purifico': buildViaPurificoScene,
  'den-of-woe': buildDenOfWoeScene,
  [DJOSE_CHAMBER_PLATE]: buildDjoseChamberScene, // Chapter XVI (FFX-2 only); the provisional plate's key
  'sector1-reactor': buildSector1ReactorScene, // FF7 only
};

/** Look up a location's `SceneBuild` factory. `undefined` for an unknown key. */
export function getSceneFactory(key: string): SceneFactory | undefined {
  return SCENE_FACTORIES[key];
}

/** Registry snapshot for the debug API. */
export function sceneReport(): Array<{ key: string; title: string; placeholder: boolean }> {
  return [...SCENES.values()].map((s) => ({
    key: s.key,
    title: s.title,
    placeholder: s.placeholder,
  }));
}

/**
 * Build a scene by key. Falls back to `demo` (with a console warning) rather
 * than throwing, so an unfinished chapter still boots into something.
 */
export async function loadScene(key: string, camera: PerspectiveCamera): Promise<LoadedScene> {
  // A real `SceneFactory` always wins: it owns the world and no actors, which
  // is exactly what the presenter wants.
  const factory = SCENE_FACTORIES[key];
  if (factory) return fromSceneBuild(key, await factory(), camera);

  const entry = SCENES.get(key) ?? SCENES.get('demo')!;
  if (!SCENES.has(key)) {
    console.warn(`[scenes] unknown scene "${key}"; falling back to the demo diorama`);
  }
  return fromPaintedScene(entry, await entry.build(camera));
}

/**
 * Publish a scene's own `partyHeight`/`enemyHeight` when its {@link SceneBuild}
 * provides them, falling back to the Gagazet-composition defaults otherwise
 * (PR-0093). `tests/unit/chapters/leblanc-scene.test.ts` checks it end to end through
 * {@link loadScene} under jsdom (the real factory and `fromSceneBuild`), and this half alone.
 */
export function resolveSceneHeights(
  build: Pick<SceneBuild, 'partyHeight' | 'enemyHeight'>,
): { partyHeight: number; enemyHeight: number } {
  return {
    partyHeight: build.partyHeight ?? 1.82,
    enemyHeight: build.enemyHeight ?? 4.1,
  };
}

/** Normalise a `SceneFactory` build. */
function fromSceneBuild(key: string, build: SceneBuild, camera: PerspectiveCamera): LoadedScene {
  const scene = new Scene();
  scene.name = key;
  mountScene(build, scene);
  scene.userData['backdropPalette'] = build.backdrop.palette; // eye-candy options round (option A's look LUT and rim)
  // The stage reads a scene's mid-battle entrances off this object.
  if (build.arrivals) attachArrivals(scene, build.arrivals);

  const battleCamera = new BattleCamera(camera, { rigs: build.rigs, initial: 'idle' });
  build.bindCamera?.(battleCamera); // a scene that re-frames itself mid-battle (the Road's phone camera)
  const toSpot = (v: Vector3): Spot => [v.x, v.y, v.z];

  return {
    key,
    title: SCENES.get(key)?.title ?? key,
    placeholder: false,
    scene,
    battleCamera,
    palette: build.palette,
    slots: {
      // `partySlots` publishes seven: the active three, then the reserve
      // parking spots a switched-in character walks from.
      party: build.partySlots.slice(0, 3).map(toSpot),
      enemy: build.enemySlots.map(toSpot),
      ...resolveSceneHeights(build),
      ...stagingOf(build),
    },
    update(dt): void {
      build.update(dt);
      battleCamera.update(dt);
    },
    setPixelScale(v): void {
      for (const p of build.particles) p.setPixelScale(v);
      for (const p of build.pixelScaled ?? []) p.setPixelScale(v);
    },
    ...(build.swapBackdrop ? { swapBackdrop: (k: string): Promise<void> => build.swapBackdrop!(k) } : {}),
    trigger: () => false,
    hideOwnActors: () => {},
    showOwnActors: () => {},
    dispose(): void {
      build.dispose();
      scene.clear();
    },
  };
}

/** Normalise an older builder that brings its own figures. */
function fromPaintedScene(entry: SceneEntry, painted: PaintedScene): LoadedScene {
  const own = [...painted.party, ...painted.enemies];
  const alphas = own.map((a) => a.alpha);

  return {
    key: entry.key,
    title: entry.title,
    placeholder: entry.placeholder,
    scene: painted.scene,
    battleCamera: painted.battleCamera,
    palette: painted.palette,
    slots: entry.slots,
    update: (dt) => painted.update(dt),
    setPixelScale: (v) => painted.setPixelScale(v),
    trigger: (name) => painted.trigger(name),
    hideOwnActors(): void {
      for (const a of own) {
        a.setAlpha(0);
        a.visible = false;
        if (a.shadow) a.shadow.visible = false;
      }
    },
    showOwnActors(): void {
      own.forEach((a, i) => {
        a.visible = true;
        a.setAlpha(alphas[i] ?? 1);
        if (a.shadow) a.shadow.visible = true;
      });
    },
    dispose: () => painted.dispose(),
  };
}
