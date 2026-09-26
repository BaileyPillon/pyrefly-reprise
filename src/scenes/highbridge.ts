import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory, SceneRigName } from './types.ts';
import type { SceneSlots } from './index.ts';
import { NatusRing } from './highbridge-ring.ts';

// ---------------------------------------------------------------------------
// The Highbridge of Bevelle, the north end before the Main Gate (FFX)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Seymour Natus and Mortibody,
// Chapter X (`research/ffx-seymour-natus-highbridge.md` §7: the fight is at the
// northern end, in the plaza before the Main Gate [single source: GameFAQs]).
// The Bevelle Underground scene is the FFX-2 Bahamut arena and is not this one.
//
// On whose word: Bailey's O-3 pick, C "night with the city lit" (D-095), the
// O-1 A figure with its turning ring (D-093) and the O-2 A Mortibody at Natus's
// screen-left (D-094; the options README: "placed on Natus's screen-left", ours),
// line-up Tidus, Yuna, Kimahri (B2 = a, D-078).
//
// THE PAINTING. `public/art/backdrops/bevelle-highbridge.png` (2688x1536, the
// picked plate installed unchanged; judge-locked set chapter:natus): the gate's
// towers and lamps across the frame, a wet reflecting plaza from about row
// 0.8, a crimson carpet at the bottom edge. Disclosed off-canon on the sidecar:
// no crimson canopies or green runner, and the bridge hardly shows (the plan
// Review flag; taste over fidelity was Bailey's call). As at Macalania, whose
// installed-art frames first showed this plate in battle
// (`docs/concepts/chapters/natus/production/battle-1600.jpg`), the painting is
// the plaza's back wall: 34 wide at z -12, its row 0.89 on the floor (y 0),
// so the painted water runs into the 3D floor under the fighters.

/** Plate pixels (`bevelle-highbridge.json`) and the row set on the floor. */
export const HIGHBRIDGE_PLATE = { w: 2688, h: 1536, floorRow: 0.89 } as const;

/** Painting plane: 34 wide at z -12 (H 19.43), row 0.89 on the floor (y 0), so centre y 7.58. */
export const HIGHBRIDGE_BACKDROP = (() => {
  const width = 34;
  const height = width / (HIGHBRIDGE_PLATE.w / HIGHBRIDGE_PLATE.h);
  return { width, height, distance: -12, centreY: height * (HIGHBRIDGE_PLATE.floorRow - 0.5) } as const;
})();

/** The idle camera, which the parallax stack is solved for. */
const CAMERA_REF: [number, number, number] = [0, 5.1, 17.6];

/**
 * FFX framing, Macalania's rigs (solved against the FFX HUD at 1600x900),
 * which framed this plate and these figures in the installed-art frames. The
 * phone draws the 16:9 render and slides it (`src/ui/common/phoneFraming.ts`,
 * phone HUD B), so the scene needs no phone rig of its own.
 */
export const HIGHBRIDGE_RIGS: Readonly<Record<SceneRigName, CameraRig> & Record<string, CameraRig>> = {
  /** The gate at night, wide, as the pre scene hands over. */
  intro: { position: [0.6, 3.6, 20.0], lookAt: [1.4, 2.6, -4.0], fov: 32, sway: 1.3 },
  idle: { position: CAMERA_REF, lookAt: [0.6, 1.8, 0], fov: 28 },
  action: { position: [0.5, 4.3, 14.2], lookAt: [1.5, 1.7, 0.6], fov: 28, sway: 0.7 },
  enemy: { position: [0.5, 3.4, 9.8], lookAt: [2.3, 1.9, -2.8], fov: 30, sway: 0.7 },
  party: { position: [-0.4, 3.1, 12.25], lookAt: [0.95, 1.4, 4.4], fov: 31, sway: 0.7 },
  victory: { position: [-0.7, 3.2, 16.0], lookAt: [0.7, 1.2, -2.0], fov: 30, sway: 1.1 },
};

/** Party: Tidus, Yuna, Kimahri (the build's `activeSlots`), then four reserve spots off frame-left. */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-1.11, 0, 4.95],
  [-0.2, 0, 4.45],
  [1.18, 0, 5.03],
  [-9.6, 0, 2.6],
  [-10.5, 0, 1.0],
  [-11.4, 0, -0.6],
  [-12.3, 0, -2.2],
];

/**
 * Enemy slots, index = each record's `slot` (`src/data/ffx/enemies/seymour-natus.ts`):
 * 0 Seymour Natus at the centre (Seymour's spot at Macalania), 1 Mortibody in
 * front of him on the party's side, at his screen-left (O-2 A, ours).
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [2.9, 0, -2.6],
  [1.35, 0, -1.8],
];

/** Index of each combatant's slot in {@link HIGHBRIDGE_SLOTS}.enemy. */
export const HIGHBRIDGE_ENEMY_SLOT = { natus: 0, mortibody: 1 } as const;

/**
 * World heights, every one a presentation estimate (no game data): the party at
 * the FFX chapters' 1.75; Natus at 1.3 times Chapter VII Seymour's 1.87 (the
 * O-1 staging Bailey picked, "Natus at 1.3x"); Mortibody at the stage's own
 * rule for a non-boss fiend, 0.7 of the boss (it hovers in the reference; the
 * stage has no hover for a fiend, so its blade tips stand on the floor).
 */
export const HIGHBRIDGE_ACTOR_HEIGHTS = { party: 1.75, natus: 2.43, mortibody: 1.7 } as const;

/** Each enemy stays on its spot; the party is held on its slots. */
const HIGHBRIDGE_STAGING = {
  holdParty: true,
  enemySpots: {
    'seymour-natus': ENEMY_SLOTS[HIGHBRIDGE_ENEMY_SLOT.natus]!,
    mortibody: ENEMY_SLOTS[HIGHBRIDGE_ENEMY_SLOT.mortibody]!,
  },
  figureHeights: { 'seymour-natus': HIGHBRIDGE_ACTOR_HEIGHTS.natus, mortibody: HIGHBRIDGE_ACTOR_HEIGHTS.mortibody },
} as const;

/** The published slots, same shape every other scene exports. */
export const HIGHBRIDGE_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: HIGHBRIDGE_ACTOR_HEIGHTS.party,
  enemyHeight: HIGHBRIDGE_ACTOR_HEIGHTS.natus,
  ...HIGHBRIDGE_STAGING,
};

/**
 * Night over the water, lamps burning (O-3 C): a deep-blue shadow tint, a
 * slightly warm gain so the lamps and the gate stay gold, bloom on the lamps.
 */
export const HIGHBRIDGE_PALETTE: ScenePalette = {
  name: 'bevelle-highbridge',
  lift: [0.004, 0.008, 0.024],
  gamma: [1.0, 1.0, 0.98],
  gain: [1.04, 1.0, 0.98],
  saturation: 1.02,
  vignette: 0.44,
  vignetteRadius: 0.64,
  shadowTint: [0.24, 0.36, 0.7],
  shadowTintAmount: 0.16,
  grain: 0.022,
  exposure: 1.02,
  bloomThreshold: 0.78,
  bloomStrength: 0.62,
  bloomRadius: 0.6,
  tiltFocus: 0.42,
  tiltBandWidth: 0.16,
  tiltMaxBlur: 3.4,
};

/** **The Highbridge of Bevelle**, as a {@link SceneFactory}. Owns no actors. */
export const buildHighbridgeScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:bevelle-highbridge';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;
  const url = artUrl('art/backdrops/bevelle-highbridge.png');

  const backdropOptions = {
    url,
    width: HIGHBRIDGE_BACKDROP.width,
    distance: HIGHBRIDGE_BACKDROP.distance,
    centreY: HIGHBRIDGE_BACKDROP.centreY,
    cameraRef,
    /** One masked band: the lamps and the gate's base, nearest the fighters. */
    layers: low ? [] : [{ from: 0.46, to: 0.84, feather: 0.1, featherBottom: 0.05, z: -14, opacity: 0.5 }],
    /** `key` the lamps' band, `horizon` the lit arches, `ground` the wet plaza. */
    sampleBands: { sky: [0.0, 0.12], horizon: [0.62, 0.78], ground: [0.84, 0.97], key: [0.46, 0.6] },
    ground: { size: 40, repeat: 5, tintMix: 0.36, luma: 0.42, fade: true, fadeCore: 0.3, center: [0.5, -3.5] as [number, number] },
    fog: { near: 16, far: 44, colorMix: 0.16 },
    fogPlanes: [{ z: -12, y: 0.8, width: 44, height: 4, opacity: 0.08, speed: 0.01, additive: true }],
    background: 0x050b1a,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The lamps either side of the gate are the painting's warm sources; the key
    // comes from the right-hand pair, above and behind the enemy line.
    keyFrom: [4.5, 5.0, -7.5],
    keyIntensity: 0.95,
    // The blue night sky through the arches, behind the fighters: the rim.
    rimFrom: [-1.0, 3.4, -9.0],
    rimColor: 0x7fa6ff,
    rimIntensity: 0.9,
    fillIntensity: 0.8,
    ambientIntensity: 0.55,
    luma: { key: 0.78, fill: 0.55, rim: 0.88, ambient: 0.45 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.2, bias: -0.0013 },
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xffd4a0, radius: 1.0, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  // Pyreflies drifting over the plaza: Natus is made of them (research §8.2 beat 8). Ours.
  const motes = new ParticleField(
    ParticlePresets.pyreflies({ count: low ? 24 : 48, bounds: { x: 9, y: 4, z: 6 }, opacity: 0.5 }),
  );
  motes.position.set(0.8, 2.2, -2.4);
  group.add(motes);

  const ring = new NatusRing(HIGHBRIDGE_ACTOR_HEIGHTS.natus);
  group.add(ring.mesh);
  void ring.load();

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
    particles: [motes],
    rigs: HIGHBRIDGE_RIGS,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: HIGHBRIDGE_ACTOR_HEIGHTS.party,
    enemyHeight: HIGHBRIDGE_ACTOR_HEIGHTS.natus,
    ...HIGHBRIDGE_STAGING,
    palette: { ...HIGHBRIDGE_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      motes.update(dt);
      ring.update(dt, group.parent);
    },
    dispose(): void {
      watcher?.stop();
      ring.dispose();
      motes.dispose();
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
