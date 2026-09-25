import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';
import { CLOISTER_CAMERA_REF, CLOISTER_LINK_RIG, CLOISTER_WIDE_RIGS, cloisterRenderAspect, cloisterRigsFor } from './cloister-100-rigs.ts';
import { CloisterLink } from './cloister-100-link.ts';

// ---------------------------------------------------------------------------
// The Via Infinito, Cloister 100 (FFX-2)
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. Chapter XIII: Paragon, then
// Trema, on the last floor of the dungeon under Bevelle
// (`research/ffx2-trema.md` §1.1, §6.1). No FFX chapter stands here.
//
// The scene key is `via-infinito`, the plate's own id, so the cutscene screen
// (which draws `backdrops/<sceneKey>.png`) finds the same painting.
//
// On whose word: Bailey, 2026-09-25, "I'll go with all your recommendations":
// O-3 B, the approved Bevelle Underground plate repainted as the Cloister
// (`public/art/backdrops/via-infinito.png`, 2688x1536, installed unchanged;
// `docs/concepts/chapters/trema/INSTALLED.md`); TR10's line-up, Yuna, Rikku
// and Paine; O-2 yes, the link staged as a short scene (`cloister-100-link.ts`).
// The plate is used as installed: TR18, the art is LOCKED.
//
// THE PAINTING. The repaint keeps the Bevelle plate's room: a long hall, the
// vault and its banners in the top third, a lit floor in the bottom fifth.
// So it is framed as the art round's engine frames framed it (the approved
// Chapter IV geometry): 78 wide at z -50, the idle camera at (0, 3, 9.6).
// The top of the plate, where the sourced upside-down banners hang, is seen
// on the `intro` shot; the fight's framing crops it under the HUD's top band.

/** Plate pixels (`via-infinito.json`). */
export const CLOISTER_PLATE = { w: 2688, h: 1536 } as const;

/** The painting plane (the Chapter IV solve: see the header). */
export const CLOISTER_BACKDROP = { width: 78, distance: -50, centreY: -2.82 } as const;
/**
 * The plane on a phone: the same painting, raised so the phone rigs' low camera, looking up the
 * hall over the fighters' heads, sees the vault and banners instead of the dark above the plate
 * (`cloister-100-rigs.ts`, the phone rigs). Solved at 390x844 for the `idle` rig. Since the
 * phone battle HUD (a 16:9 canvas, FOC16-05) only a portrait window it does not take uses it.
 */
export const CLOISTER_PHONE_BACKDROP = { width: 78, distance: -50, centreY: 17.5 } as const;

/**
 * Party: Yuna, Rikku, Paine, the build's order (`src/data/ffx2/builds/
 * via-infinito.ts`), in the lower left; then four reserve spots off frame
 * left. The Chapter IV arc, which the art round's frames showed clear of the
 * FFX-2 HUD.
 */
const PARTY_SLOTS: Array<[number, number, number]> = [
  [-2.05, 0, 1.45],
  [-1.3, 0, 0.1],
  [-0.9, 0, -1.5],
  [-12.0, 0, 2.6],
  [-12.9, 0, 1.0],
  [-13.8, 0, -0.6],
  [-14.7, 0, -2.2],
];

/**
 * The boss spot: Paragon in link 1, then Trema in link 2 (both are `slot: 0`,
 * one fighter a link). Right of centre and far back (Chapter IV's spot): the
 * beast stands between the guide rail and the command list, over and clear of
 * the party, above the party plates. The enemy-move slab hangs over its head
 * by that panel's own design (`src/ui/common/EnemyIntent.ts`, "the slab's
 * whole habit is to hang over a head"); it is a toggle (E), not a fixed band.
 */
export const CLOISTER_BOSS_SPOT: [number, number, number] = [1.05, 0, -5.8];

/** Where the old man appears in the kill link: right of Paragon, clear of the command list. */
export const CLOISTER_LINK_SIDE_SPOT: [number, number, number] = [4.3, 0, -4.2];

const ENEMY_SLOTS: Array<[number, number, number]> = [CLOISTER_BOSS_SPOT, [3.5, 0, -5.4], [-1.1, 0, -6.6]];

/**
 * World heights, presentation estimates, both ours (`INSTALLED.md` "Sizes":
 * Trema at 0.72 of Paragon). Paragon is a little under Chapter IV's boss
 * height, so the whole beast fits the band the FFX-2 HUD leaves open. The
 * party takes the FFX-2 chapters' 1.75.
 */
export const CLOISTER_ACTOR_HEIGHTS = { party: 1.75, paragon: 3.1, trema: 2.23 } as const;

/** Combatant ids this scene stages specially (`src/data/ffx2/enemies/{paragon,trema}.ts`). */
export const CLOISTER_IDS = { paragon: 'paragon', trema: 'trema' } as const;

const CLOISTER_STAGING = {
  holdParty: true,
  enemySpots: { [CLOISTER_IDS.paragon]: CLOISTER_BOSS_SPOT, [CLOISTER_IDS.trema]: CLOISTER_BOSS_SPOT },
  figureHeights: { [CLOISTER_IDS.trema]: CLOISTER_ACTOR_HEIGHTS.trema },
} as const;

/** The published slots, same shape every other scene exports. */
export const CLOISTER_100_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: CLOISTER_ACTOR_HEIGHTS.party,
  enemyHeight: CLOISTER_ACTOR_HEIGHTS.paragon,
  ...CLOISTER_STAGING,
};

/** The 16:9 rigs (`cloister-100-rigs.ts` has the phone's and the aspect rule). */
export const CLOISTER_100_RIGS: Readonly<Record<string, CameraRig>> = CLOISTER_WIDE_RIGS;

/**
 * Cold teal stone under white lamp slits, the repaint's light: a slate shadow
 * tint, a neutral gain so the girls' colours and Paragon's gold carry, a soft
 * vignette, bloom only on the lamp slits.
 */
export const CLOISTER_100_PALETTE: ScenePalette = {
  name: 'via-infinito',
  lift: [0.008, 0.012, 0.02],
  gamma: [1.0, 1.0, 0.99],
  gain: [1.0, 1.01, 1.03],
  saturation: 1.0,
  vignette: 0.42,
  vignetteRadius: 0.66,
  shadowTint: [0.3, 0.46, 0.56],
  shadowTintAmount: 0.14,
  grain: 0.022,
  exposure: 1.02,
  bloomThreshold: 0.84,
  bloomStrength: 0.42,
  bloomRadius: 0.55,
  tiltFocus: 0.55,
  tiltBandWidth: 0.2,
  tiltMaxBlur: 2.6,
};

/** **Cloister 100 of the Via Infinito**, as a {@link SceneFactory}. Owns no combatants. */
export const buildCloister100Scene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:via-infinito';
  const low = opts.quality === 'low';
  // FOC16-05: the render's aspect, not the window's (the phone battle HUD draws a 16:9 canvas).
  const aspect = cloisterRenderAspect();
  const phone = aspect < 1;
  const rigs = cloisterRigsFor(aspect);
  const plane = phone ? CLOISTER_PHONE_BACKDROP : CLOISTER_BACKDROP;
  const idleAt = rigs.idle.position;
  const cameraRef = opts.cameraRef ?? (phone && Array.isArray(idleAt) ? (idleAt as [number, number, number]) : CLOISTER_CAMERA_REF);
  const url = artUrl('art/backdrops/via-infinito.png');

  const backdropOptions = {
    url,
    width: plane.width,
    distance: plane.distance,
    centreY: plane.centreY,
    cameraRef,
    // The hall's middle band parts from the painting when the camera sways, as Chapter IV's does.
    layers: low || phone ? [] : [{ from: 0.34, to: 0.64, feather: 0.09, featherBottom: 0.08, z: -32, opacity: 0.55 }],
    /** `key` is the lamp slits up the vault, `horizon` the dark hall wall, `ground` the lit floor. */
    sampleBands: { sky: [0.0, 0.1], horizon: [0.66, 0.82], ground: [0.9, 1.0], key: [0.05, 0.25] },
    ground: { size: 60, repeat: 6, tintMix: 0.5, luma: 0.34, fade: true, fadeCore: 0.45, center: [0.5, 0.5] as [number, number] },
    fog: { near: 18, far: 52, colorMix: 0.14 },
    fogPlanes: [
      { z: -19, y: 2.8, width: 54, height: 15, opacity: 0.16, speed: 0.01 },
      { z: -6, y: 0.8, width: 30, height: 5, opacity: 0.08, speed: 0.03, additive: true },
    ],
    background: 0x05090d,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The lamp slits up the vault are the key, high and behind; a cold rim.
    keyFrom: [-6.5, 9.5, -3.0],
    keyIntensity: low ? 1.7 : 1.85,
    rimFrom: [7.5, 3.6, 3.8],
    rimColor: 0x9fd8ff,
    rimIntensity: 0.8,
    fillIntensity: 0.9,
    ambientIntensity: 0.5,
    luma: { key: 0.84, fill: 0.58, rim: 0.84, ambient: 0.48 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.2, bias: -0.0013 },
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xcfe6f2, radius: 0.95, opacity: 0.1 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  // ------------------------------------------------------ the kill link
  const linkPos = (rigs[CLOISTER_LINK_RIG] ?? CLOISTER_WIDE_RIGS[CLOISTER_LINK_RIG]!).position;
  const linkRig = new Vector3().copy(Array.isArray(linkPos) ? new Vector3(...linkPos) : linkPos);
  const link = new CloisterLink(group, {
    sideSpot: CLOISTER_LINK_SIDE_SPOT,
    bossSpot: CLOISTER_BOSS_SPOT,
    tremaHeight: CLOISTER_ACTOR_HEIGHTS.trema,
    cameraAt: [linkRig.x, linkRig.y, linkRig.z],
    paragonIds: [CLOISTER_IDS.paragon],
    tremaIds: [CLOISTER_IDS.trema],
  });
  // A prop that cannot be drawn only loses the old man's entrance; the fight is untouched.
  void link.load().catch((err: unknown) => console.warn('[via-infinito] the kill link prop did not load', err));
  // The camera probe: the first frame rendered from the link rig starts the beat.
  pools[0]!.frustumCulled = false;
  pools[0]!.onBeforeRender = (_r, _s, camera): void => link.cameraAt(camera.position);

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
    partyHeight: CLOISTER_ACTOR_HEIGHTS.party,
    enemyHeight: CLOISTER_ACTOR_HEIGHTS.paragon,
    ...CLOISTER_STAGING,
    palette: { ...CLOISTER_100_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      link.update(dt, group.parent);
    },
    dispose(): void {
      watcher?.stop();
      link.dispose();
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
