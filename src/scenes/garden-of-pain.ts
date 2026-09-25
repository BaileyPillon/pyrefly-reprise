import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { PartAnchors } from '../engine/PartAnchors.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { viewportAspect } from './cavern-stolen-fayth-rigs.ts';
import { GARDEN_CAMERA_REF, GARDEN_WIDE_RIGS, gardenRigsFor } from './garden-of-pain-rigs.ts';
import { GardenDiscs, type DiscPlacement } from './garden-of-pain-discs.ts';

// ---------------------------------------------------------------------------
// The Garden of Pain, inside Sin (FFX)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Chapter XII, Seymour Omnis and the
// four Mortiphasms (`research/ffx-seymour-omnis.md`); no FFX-2 chapter stands
// here. The scene key is `garden-of-pain`, the plate's own id, so the cutscene
// screen (which draws `backdrops/<sceneKey>.png`) finds the same painting.
//
// On whose word: Bailey, 2026-09-25, "I'll go with all your recommendations":
// B21 a new Garden plate (not Chapter III's Dream's End diorama), O-3 C deep
// violet, O-1 A Omnis, O-2 B the painted discs with the facing quarter lit, B2 a
// the line-up Tidus, Yuna, Auron. Every painting is installed and locked
// (`docs/concepts/chapters/omnis/INSTALLED.md`) and used as installed.
//
// THE PAINTING. `public/art/backdrops/garden-of-pain.png` (2688x1536): a violet
// sky, a red-tinged sea with floating rock islands, and in the bottom third a
// pale terrace whose far edge rises in five broad steps to a dais (plate x
// 1341-1981, y 774-998: the one sourced Garden fact, research §7). It is the
// same size as Dream's End's plate and was judged in Dream's End's framing
// (`production/battle-1600.jpg`), so it is hung the same way: 80 wide at z -50,
// the idle camera at (0, 2.75, 9.8). Seymour stands before the steps.
//
// THE DISCS. Four painted discs, two each side of him, on the art round's O-2
// geometry (the composite `production/scripts/compose.py` drew): drawn by
// `garden-of-pain-discs.ts`, turned to the colour each shows him. The four
// Mortiphasm combatants stand figure-less on overhead anchors at the discs'
// centres, so a target cursor, a damage number or the Sensor finds each disc.

/** Plate pixels (`garden-of-pain.json`) and the steps' box (the sidecar's repair). */
export const GARDEN_PLATE = { w: 2688, h: 1536, steps: { x0: 1341, x1: 1981, y0: 774, y1: 998 } } as const;

/** The painting plane: Dream's End's hang (see the header). */
export const GARDEN_BACKDROP = { width: 80, distance: -50, centreY: 1.23 } as const;

/**
 * Party: Tidus, Yuna, Auron (B2 = a, the build's `activeSlots` order), Dream's End's shallow arc
 * in the lower left, then four reserve spots off frame left. Tidus and Auron sit 0.62 and 0.4
 * right of Dream's End's spots so the first slot clears the FFX command stack (five rows with the
 * guide open) at 1280x720, 1600x900 and 2000x1012.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-0.85, 0, 1.6],
  [0.22, 0, 1.55],
  [-0.4, 0, -1.0],
  [-11.8, 0, 2.6],
  [-12.7, 0, 1.0],
  [-13.6, 0, -0.6],
  [-14.5, 0, -2.2],
];

/** Seymour's spot, before the steps, right of centre (the judged frame's). */
export const GARDEN_BOSS_SPOT: [number, number, number] = [2.15, 0, -4.0];

/**
 * World heights, presentation estimates (no game data): Seymour's painted figure, hem to the top
 * of his claws, is the judged frame's (about 0.43 of a 1600x900 frame at idle); the party takes
 * Dream's End's 1.8.
 */
export const GARDEN_ACTOR_HEIGHTS = { party: 1.8, omnis: 3.5 } as const;

/** Combatant ids this scene stages specially (`src/data/ffx/enemies/seymour-omnis.ts`). */
export const GARDEN_IDS = {
  omnis: 'seymour-omnis',
  discs: ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'],
} as const;

/**
 * The discs, left to right as the party faces them (the order B12 reads them in): upper left,
 * lower left, lower right, upper right. Offsets from his feet in multiples of his height, read off
 * the O-2 composite (canvas 2050 x 1560, Omnis 0.86 of it, discs 0.34 of it), drawn in 7 % so the
 * outer discs clear the CTB list at 2000x1012; `dz` puts each just
 * behind him. Ours, not the game's: the game hangs them above, below and to each side of him
 * (INSTALLED.md's look-only pass); two each side is the picked O-2 layout.
 */
export const DISC_LAYOUT = {
  diameter: 0.42,
  dz: -0.25,
  at: [
    { dx: -0.53, dy: 0.71, towardHim: 0 },
    { dx: -0.44, dy: 0.27, towardHim: 0 },
    { dx: 0.45, dy: 0.28, towardHim: 180 },
    { dx: 0.53, dy: 0.72, towardHim: 180 },
  ],
} as const;

/** The anchored (figure-less) actor is 1.8 tall and stands on its point, so it hangs this far below a disc's centre. */
const ANCHOR_HALF = 0.9;

/** Where each disc's centre is in the world. */
export function discPlacements(spot = GARDEN_BOSS_SPOT, height = GARDEN_ACTOR_HEIGHTS.omnis): DiscPlacement[] {
  return DISC_LAYOUT.at.map((d, i) => ({
    id: GARDEN_IDS.discs[i]!,
    centre: [spot[0] + d.dx * height, spot[1] + d.dy * height, spot[2] + DISC_LAYOUT.dz] as [number, number, number],
    towardHim: d.towardHim,
  }));
}

/** Each disc's overhead anchor: the figure-less actor centred on its painted disc. */
export const GARDEN_PART_ANCHORS: PartAnchors = Object.fromEntries(
  DISC_LAYOUT.at.map((d, i) => [
    GARDEN_IDS.discs[i]!,
    { mode: 'overhead', offset: [d.dx * GARDEN_ACTOR_HEIGHTS.omnis, d.dy * GARDEN_ACTOR_HEIGHTS.omnis - ANCHOR_HALF, DISC_LAYOUT.dz] },
  ]),
);

const ENEMY_SLOTS: Array<[number, number, number]> = [GARDEN_BOSS_SPOT, ...discPlacements().map((p) => p.centre)];

const GARDEN_STAGING = {
  holdParty: true,
  enemySpots: { [GARDEN_IDS.omnis]: GARDEN_BOSS_SPOT },
  partAnchors: GARDEN_PART_ANCHORS,
} as const;

/** The published slots, same shape every other scene exports. */
export const GARDEN_OF_PAIN_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: GARDEN_ACTOR_HEIGHTS.party,
  enemyHeight: GARDEN_ACTOR_HEIGHTS.omnis,
  ...GARDEN_STAGING,
};

/** The 16:9 rigs (`garden-of-pain-rigs.ts` has the phone's and the aspect rule). */
export const GARDEN_OF_PAIN_RIGS: Readonly<Record<string, CameraRig>> = GARDEN_WIDE_RIGS;

/**
 * Deep violet twilight over a red-tinged sea (O-3 C): a violet shadow tint, a gain that keeps the
 * party's warm colours against the cold light, a soft vignette, bloom only on the brightest sky.
 */
export const GARDEN_OF_PAIN_PALETTE: ScenePalette = {
  name: 'garden-of-pain',
  lift: [0.012, 0.006, 0.022],
  gamma: [1.0, 1.0, 0.99],
  gain: [1.01, 1.0, 1.03],
  saturation: 1.0,
  vignette: 0.42,
  vignetteRadius: 0.66,
  shadowTint: [0.44, 0.34, 0.62],
  shadowTintAmount: 0.14,
  grain: 0.022,
  exposure: 1.02,
  bloomThreshold: 0.86,
  bloomStrength: 0.36,
  bloomRadius: 0.55,
  tiltFocus: 0.55,
  tiltBandWidth: 0.2,
  tiltMaxBlur: 2.6,
};

/** **The Garden of Pain**, as a {@link SceneFactory}. Owns no combatants; draws the four discs. */
export const buildGardenOfPainScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:garden-of-pain';
  const low = opts.quality === 'low';
  const rigs = gardenRigsFor(viewportAspect());
  const cameraRef = opts.cameraRef ?? GARDEN_CAMERA_REF;
  const url = artUrl('art/backdrops/garden-of-pain.png');

  const backdropOptions = {
    url,
    width: GARDEN_BACKDROP.width,
    distance: GARDEN_BACKDROP.distance,
    centreY: GARDEN_BACKDROP.centreY,
    cameraRef,
    // The floating islands part from the sky when the camera sways.
    layers: low ? [] : [{ from: 0.2, to: 0.6, feather: 0.09, featherBottom: 0.06, z: -30, opacity: 0.55 }],
    /** `key` is the pink glow low in the sky, `horizon` the sea line, `ground` the terrace. */
    sampleBands: { sky: [0.0, 0.12], horizon: [0.3, 0.42], ground: [0.72, 0.95], key: [0.16, 0.28] },
    ground: { size: 40, repeat: 5, tintMix: 0.3, luma: 0.3, fade: true, fadeCore: 0.1, center: [0, -1] as [number, number] },
    fog: { near: 16, far: 46, colorMix: 0.22 },
    fogPlanes: [
      { z: -20, y: 1.9, width: 56, height: 12, opacity: 0.14, speed: 0.01 },
      { z: -5, y: 0.7, width: 28, height: 5, opacity: 0.08, speed: 0.03, additive: true },
    ],
    background: 0x0c0818,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The glow low in the sky behind him is the key, from high and behind; a cold violet rim.
    keyFrom: [3.0, 9.0, -8.0],
    keyIntensity: low ? 1.1 : 1.2,
    rimFrom: [-4.0, 4.0, -9.0],
    rimColor: 0xc9a6ff,
    rimIntensity: 0.85,
    fillIntensity: 0.85,
    ambientIntensity: 0.5,
    luma: { key: 0.8, fill: 0.56, rim: 0.84, ambient: 0.46 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.0, bias: -0.0012 },
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xe0cff2, radius: 0.95, opacity: 0.1 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  // ------------------------------------------------------------- the discs
  const discs = new GardenDiscs(discPlacements(), DISC_LAYOUT.diameter * GARDEN_ACTOR_HEIGHTS.omnis);
  group.add(discs.group);
  // A disc painting that cannot load costs the discs' look only; the fight is untouched.
  void discs.load().catch((err: unknown) => console.warn('[garden-of-pain] the disc paintings did not load', err));

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
    partyHeight: GARDEN_ACTOR_HEIGHTS.party,
    enemyHeight: GARDEN_ACTOR_HEIGHTS.omnis,
    ...GARDEN_STAGING,
    palette: { ...GARDEN_OF_PAIN_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      discs.update(dt, group.parent);
    },
    dispose(): void {
      watcher?.stop();
      discs.dispose();
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
