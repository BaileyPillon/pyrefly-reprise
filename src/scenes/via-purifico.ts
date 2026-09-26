import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import type { SceneSlots } from './index.ts';
import { holdWidth } from './cavern-stolen-fayth-rigs.ts';
import { PHONE_BATTLE_QUERY } from '../ui/common/phoneBattle.ts';

// ---------------------------------------------------------------------------
// The Via Purifico, the last chamber of the maze beneath Bevelle (FFX)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Chapter XIV, Isaaru's contest of
// aeons (`research/ffx-isaaru-bevelle.md` §7: the maze's last chamber at the
// end of a red-lit hallway [verified: 4 sources]). `bevelle-underground` is the
// FFX-2 arena and is not this room.
//
// The scene key is `via-purifico`, the plate's own id, so the cutscene screen
// (which draws `backdrops/<sceneKey>.png`) finds the same painting.
//
// On whose word: Bailey, 2026-09-25, "I'll go with all your recommendations"
// (D-147): O-3 A, red-lit stone with the hallway behind
// (`public/art/backdrops/via-purifico.png`, 2688x1536, judge-locked, used as
// installed: B22); the forced line-up, Yuna alone (§1.2 [verified: 3 sources]);
// Isaaru on the field with no turn (B8). `docs/concepts/chapters/isaaru/
// INSTALLED.md` "Owed" asked for this factory, and for Isaaru clear of
// Pterya's wing: see VIA_ISAARU_SPOT.
//
// THE PAINTING is a low, level, front-on view like Macalania's: the hall and
// its red lamps above, a lit floor in the bottom fifth. The O-3 and O-5 frames
// Bailey picked from were composed on Macalania's staging with this plate
// served in its place (INSTALLED.md "In the engine"), so this scene keeps that
// geometry: 40 wide at z -20, the floor seam at y 0.25, the idle camera at
// (0, 2.2, 10.6). The ceiling is a knowing crop under the HUD's top band.

/** The camera the parallax stack and the plate are solved for: the `idle` rig's position. */
export const VIA_CAMERA_REF: [number, number, number] = [0, 2.2, 10.6];

/** The painting plane: Macalania's solve, which the picked frames used (see the header). */
export const VIA_BACKDROP = { width: 40, distance: -20, centreY: 9.16 } as const;

/**
 * Party: Yuna on slot 0, front, just right of the command stack (at x -1.75,
 * the first cut, the open menu hid her whole on her own turn). Slot 1 is where
 * a summoned aeon stands (`BattlePresenterBeats.summon`), behind her and to the
 * left: its head and wings clear the menu, and it no longer covers half of
 * Pterya (solved on real 1600x900 frames of each link, 2026-09-25). Then the
 * reserve spots off frame left (none are used: Yuna has no bench).
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-0.55, 0, 1.6],
  [-1.6, 0, -0.6],
  [-2.9, 0, 0.2],
  [-11.6, 0, 2.6],
  [-12.5, 0, 1.0],
  [-13.4, 0, -0.6],
  [-14.3, 0, -2.2],
];

/** Isaaru's aeon, the one fighter a link (Grothia, Pterya, Spathi are all `slot: 1`): right of centre, deep in the room. */
export const VIA_AEON_SPOT: [number, number, number] = [1.9, 0, -4.0];

/**
 * Isaaru (`slot: 0`, B8: no turn, never targetable): right of his aeon and
 * well **nearer the camera** than it, so Pterya's wing (the widest of the three
 * paintings, which covered him at the options round's x +2.2) ends short of
 * him, and his raised arm stays below the CTB list. Our placement, solved in
 * the engine at 1600x900 (INSTALLED.md "Owed").
 */
export const VIA_ISAARU_SPOT: [number, number, number] = [3.7, 0, -0.2];

const ENEMY_SLOTS: Array<[number, number, number]> = [VIA_ISAARU_SPOT, VIA_AEON_SPOT, [3.4, 0, -4.4]];

/** Combatant ids this scene stages by name (`src/data/ffx/enemies/isaaru.ts`). */
export const VIA_IDS = { isaaru: 'isaaru', grothia: 'grothia', pterya: 'pterya', spathi: 'spathi' } as const;

/** Yuna's five aeons (`src/data/ffx/builds/via-purifico.ts`), staged at the enemy aeons' height. */
const YUNA_AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'] as const;

/**
 * World heights, presentation estimates, none game data (rule 6). Yuna is the
 * FFX chapters' 1.68 (`macalania-temple.ts`). Isaaru is a man: Seymour's
 * sourced 187 cm less a little, our estimate. The six aeons on both sides
 * stand at one height, so a mirror pair (his Ifrit and hers) reads as the same
 * creature: the sources give no visual difference between them (research
 * §10.2). Yuna's aeons are one step nearer the camera, so they read a little
 * larger, as the party side does in every FFX frame.
 */
export const VIA_ACTOR_HEIGHTS = { yuna: 1.68, isaaru: 1.8, aeon: 3.2 } as const;

const VIA_STAGING = {
  holdParty: true,
  enemySpots: {
    [VIA_IDS.isaaru]: VIA_ISAARU_SPOT,
    [VIA_IDS.grothia]: VIA_AEON_SPOT,
    [VIA_IDS.pterya]: VIA_AEON_SPOT,
    [VIA_IDS.spathi]: VIA_AEON_SPOT,
  },
  figureHeights: {
    [VIA_IDS.isaaru]: VIA_ACTOR_HEIGHTS.isaaru,
    ...Object.fromEntries(YUNA_AEONS.map((id) => [id, VIA_ACTOR_HEIGHTS.aeon])),
  },
} as const;

/** The published slots, same shape every other scene exports. */
export const VIA_PURIFICO_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: VIA_ACTOR_HEIGHTS.yuna,
  enemyHeight: VIA_ACTOR_HEIGHTS.aeon,
  ...VIA_STAGING,
};

type RigSet = Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>>;

/**
 * FFX framing, fov 30-34, nearly level (the plate is a level view): Macalania's
 * rigs, which the picked frames used, with `enemy` pushed onto the aeon spot
 * and `victory` holding Yuna, her aeon's place and Isaaru.
 */
export const VIA_PURIFICO_RIGS: RigSet = {
  intro: { position: [0.3, 2.9, 14.2], lookAt: [0.7, 2.6, -4.0], fov: 30, sway: 1.4 },
  idle: { position: VIA_CAMERA_REF, lookAt: [0.55, 1.95, -1.6], fov: 32 },
  action: { position: [0.3, 2.1, 9.7], lookAt: [1.0, 1.85, -1.6], fov: 32, sway: 0.7 },
  party: { position: [-1.0, 2.0, 7.6], lookAt: [-1.6, 1.4, 0.2], fov: 32, sway: 0.7 },
  enemy: { position: [1.4, 2.2, 5.9], lookAt: [1.9, 1.9, -4.0], fov: 32, sway: 0.7 },
  victory: { position: [-0.6, 3.0, 12.0], lookAt: [0.6, 1.0, -1.2], fov: 32, sway: 1.2 },
};

/**
 * The aspect of the render this scene is built for, read once at build: 16:9 under the
 * upright-phone battle HUD (its canvas is the 16:9 render at the field's height, `phoneFraming.ts`),
 * else the window's; 16:9 with no window. Reading the window's shape instead opened the fov on a
 * phone and left the fighters tiny (the FOC16-05 finding on Chapter XIII, seen here at 390x844).
 */
export function viaRenderAspect(
  win: (Pick<Window, 'innerWidth' | 'innerHeight'> & { matchMedia?: Window['matchMedia'] }) | undefined = typeof window === 'undefined' ? undefined : window,
): number {
  if (!win || win.matchMedia?.(PHONE_BATTLE_QUERY).matches === true) return 16 / 9;
  return win.innerWidth > 0 && win.innerHeight > 0 ? win.innerWidth / win.innerHeight : 16 / 9;
}

/** The rig set for a render of this aspect: narrower than 16:9 keeps 16:9's width (`holdWidth`). */
export function viaRigsFor(aspect: number): Record<SceneRigName, CameraRig> & Record<string, CameraRig> {
  const out: Record<string, CameraRig> = {};
  for (const [name, rig] of Object.entries(VIA_PURIFICO_RIGS)) out[name] = holdWidth(rig, aspect, 16 / 9);
  return out as Record<SceneRigName, CameraRig> & Record<string, CameraRig>;
}

/**
 * Red lamp light on cold grey stone: a blue-grey shadow tint so the aeons'
 * colours and Isaaru's sea green carry, a warm gain for the lamps, a deep
 * vignette, bloom only on the lamps themselves.
 */
export const VIA_PURIFICO_PALETTE: ScenePalette = {
  name: 'via-purifico',
  lift: [0.012, 0.006, 0.01],
  gamma: [1.0, 1.0, 0.99],
  gain: [1.04, 1.0, 1.0],
  saturation: 1.0,
  vignette: 0.46,
  vignetteRadius: 0.64,
  shadowTint: [0.34, 0.4, 0.52],
  shadowTintAmount: 0.14,
  grain: 0.022,
  exposure: 1.04,
  bloomThreshold: 0.82,
  bloomStrength: 0.5,
  bloomRadius: 0.58,
  tiltFocus: 0.44,
  tiltBandWidth: 0.18,
  tiltMaxBlur: 3.2,
};

/** **The Via Purifico, the last chamber**, as a {@link SceneFactory}. Owns no combatants. */
export const buildViaPurificoScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:via-purifico';
  const low = opts.quality === 'low';
  const rigs = viaRigsFor(viaRenderAspect());
  const cameraRef = opts.cameraRef ?? VIA_CAMERA_REF;
  const url = artUrl('art/backdrops/via-purifico.png');

  const backdropOptions = {
    url,
    width: VIA_BACKDROP.width,
    distance: VIA_BACKDROP.distance,
    centreY: VIA_BACKDROP.centreY,
    cameraRef,
    // The pillar band parts from the hall behind it when the camera sways.
    layers: low ? [] : [{ from: 0.5, to: 0.84, feather: 0.1, featherBottom: 0.06, z: -14, opacity: 0.5 }],
    /** `key` is the red lamps, `horizon` the dark hallway mouth, `ground` the lit floor strip. */
    sampleBands: { sky: [0.0, 0.12], horizon: [0.62, 0.78], ground: [0.86, 0.99], key: [0.2, 0.42] },
    ground: { size: 40, repeat: 5, tintMix: 0.4, luma: 0.4, fade: true, fadeCore: 0.3, center: [0.5, -3.5] as [number, number] },
    fog: { near: 16, far: 42, colorMix: 0.16 },
    fogPlanes: [
      { z: -14, y: 1.4, width: 44, height: 7, opacity: 0.1, speed: 0.01 },
      { z: -7, y: 0.5, width: 30, height: 3, opacity: 0.06, speed: 0.016, additive: true },
    ],
    background: 0x0b0608,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The lamps hang high on both walls; the key comes from the right-hand row.
    keyFrom: [4.8, 6.2, -6.0],
    keyIntensity: low ? 1.0 : 1.1,
    // A red rim from the lamps behind the fighters.
    rimFrom: [-3.0, 3.4, -9.0],
    rimColor: 0xff6a5a,
    rimIntensity: 0.85,
    fillIntensity: 0.85,
    ambientIntensity: 0.55,
    luma: { key: 0.8, fill: 0.56, rim: 0.86, ambient: 0.48 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.2, bias: -0.0013 },
  });
  group.add(lights.group);

  const pools = [PARTY_SLOTS[0]!, VIA_AEON_SPOT, VIA_ISAARU_SPOT].map((s, i) => {
    const pool = makeLightPool({ color: i === 0 ? 0xf2d9c8 : 0xe0a090, radius: i === 1 ? 1.6 : 0.9, opacity: 0.1 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(backdropOptions);
        const wasIn = backdrop.group.parent;
        backdrop.dispose();
        backdrop = next;
        if (wasIn) backdrop.applyTo(wasIn);
      })();
    });
  }

  return {
    group,
    get backdrop(): Backdrop {
      return backdrop;
    },
    lights,
    particles: [],
    rigs,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: VIA_ACTOR_HEIGHTS.yuna,
    enemyHeight: VIA_ACTOR_HEIGHTS.aeon,
    ...VIA_STAGING,
    palette: { ...VIA_PURIFICO_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
    },
    dispose(): void {
      watcher?.stop();
      for (const p of pools) {
        p.geometry.dispose();
        (p.material as { dispose(): void }).dispose();
      }
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};
