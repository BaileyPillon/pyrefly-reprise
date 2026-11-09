import { Group, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { BattleCamera } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import { GARIK_BODY_IDS, GARIK_RONSO_PLATE, X2_GARIK_BOUT_ID, X2_GARIK_ID, X2_YOUTH_A_ID, X2_YOUTH_B_ID, X2_YOUTH_BOUT_ID } from '../data/garik-ronso-ids.ts';
import { DJOSE_CAMERA_REF, DJOSE_CHAMBER_SLOTS, DJOSE_PARTY_HEIGHT, DJOSE_RIGS, type DjosePlateFrame, djoseCentreY } from './djose-chamber.ts';
import { RoadPhoneCamera, roadOnPhone } from './road-to-the-farplane-phone.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots } from './index.ts';

// ---------------------------------------------------------------------------
// The summit of Mt. Gagazet, under the FFX-2 camera: Garik Ronso and the Ronso Youths
// ---------------------------------------------------------------------------
//
// Game case: FFX-2 only [AGENTS.md rule 14]. The hidden chapter "Garik Ronso" (Chapter 3's mission "Battle Blockade"). No FFX chapter stands here: Chapter I's own scene (`./gagazet.ts`) is solved against the FFX camera and HUD and
// is not touched; the hidden Sanctuary Keeper (FFX) and Biran and Yenke (FFX) derive from it instead.
//
// THE PAINTING IS BORROWED AND PROVISIONAL (rule 9; the preflight's pick GA6, `docs/plans/ch-lionheart-review.md` section 5). The summit has no plate of its own, so this is Chapter I's approved `backdrops/gagazet` (the night valley
// with the moon: cold blue light, snow, jagged cliffs, haze), read in place and nothing copied, written or replaced, under a **snow-and-wind grade** of this scene's own (a cooler, paler palette and a drifting snow-haze layer).
// It is framed the way the Djose and Cavern plates are: a wide plane far behind the stage, cropped by the FFX-2 camera. The alternative, a derived `gagazet-summit` plate (one painting, its prompt and seed saved,
// replacing no approved one), is the art list's first item.
//
// The camera rigs, the party slots, the girls' world height and the phone dolly are Chapter V's and Chapter XVI's (`./djose-chamber.ts`): the FFX-2 HUD is solved against them. Where the Ronso stand and how tall they are is
// staging, ours, not game data (no stature is read for rows 181 and 182): `[estimate]`.

/** How the Gagazet plate sits behind the stage (staging, ours): the Den's solve for a floor line at 0.44 of the painting, under the FFX-2 camera, with a faded 3D floor for the party. */
export const GARIK_SUMMIT_FRAME: DjosePlateFrame = {
  width: 88,
  distance: -48,
  centreY: -0.5,
  horizon: [0.42, 0.48],
  groundBand: [0.8, 0.97],
  floor: true,
};

/** The Ronso's world heights (staging, `[estimate]`): a Ronso stands at Kimahri's size, 1.211 of Tidus's with the horn (`data/ffx/party-stature.ts`, `research/visual-bible.md` section 1.22.4), on the girls' 1.78. Garik is the tallest; a Youth is shorter. */
export const GARIK_FIGURE_HEIGHT = Math.round(DJOSE_PARTY_HEIGHT * 1.211 * 1000) / 1000;
export const YOUTH_FIGURE_HEIGHT = Math.round(DJOSE_PARTY_HEIGHT * 1.09 * 1000) / 1000;

/**
 * Where the Ronso stand (staging, ours; the scenes ship no start positions): Garik in the middle, a little back, a Youth either side and nearer, so the three read as a line with the lance across the path. In the bout
 * the one Youth stands near, Garik behind. Right of the party, clear of the command column.
 */
export const GARIK_SPOTS: Readonly<Record<string, [number, number, number]>> = {
  [X2_GARIK_ID]: [2.4, 0, -5.0],
  [X2_YOUTH_A_ID]: [1.0, 0, -3.1],
  [X2_YOUTH_B_ID]: [3.6, 0, -3.5],
  [X2_GARIK_BOUT_ID]: [2.4, 0, -5.0],
  [X2_YOUTH_BOUT_ID]: [1.0, 0, -3.1],
};
const ENEMY_SLOTS: Array<[number, number, number]> = [GARIK_SPOTS[X2_YOUTH_A_ID]!, GARIK_SPOTS[X2_YOUTH_B_ID]!, GARIK_SPOTS[X2_GARIK_ID]!];

const STAGING = {
  holdParty: true,
  enemySpots: GARIK_SPOTS,
  figureHeights: {
    [X2_GARIK_ID]: GARIK_FIGURE_HEIGHT,
    [X2_GARIK_BOUT_ID]: GARIK_FIGURE_HEIGHT,
    [X2_YOUTH_A_ID]: YOUTH_FIGURE_HEIGHT,
    [X2_YOUTH_B_ID]: YOUTH_FIGURE_HEIGHT,
    [X2_YOUTH_BOUT_ID]: YOUTH_FIGURE_HEIGHT,
  },
} as const;

/** The published slots, the same shape every other scene exports. */
export const GARIK_SUMMIT_SLOTS: SceneSlots = {
  party: DJOSE_CHAMBER_SLOTS.party.map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: DJOSE_PARTY_HEIGHT,
  enemyHeight: GARIK_FIGURE_HEIGHT,
  ...STAGING,
};

/** The snow-and-wind grade (the preflight's GA6): the Gagazet night valley's cold blue, paler and windier, with a little more grain and haze than the Cavern's. */
export const GARIK_SUMMIT_PALETTE: ScenePalette = {
  name: 'ffx2-gagazet-summit',
  lift: [0.01, 0.014, 0.024],
  gamma: [1.0, 1.0, 0.98],
  gain: [0.99, 1.01, 1.05],
  saturation: 0.9,
  vignette: 0.36,
  vignetteRadius: 0.68,
  shadowTint: [0.4, 0.52, 0.7],
  shadowTintAmount: 0.18,
  grain: 0.03,
  exposure: 1.05,
  bloomThreshold: 0.84,
  bloomStrength: 0.46,
  bloomRadius: 0.58,
  tiltFocus: 0.55,
  tiltBandWidth: 0.2,
  tiltMaxBlur: 2.8,
};

function plateOptions(url: string, low: boolean, cameraRef: [number, number, number], onPhone: boolean): BackdropOptions {
  const frame = GARIK_SUMMIT_FRAME;
  return {
    url,
    width: frame.width,
    distance: frame.distance,
    centreY: djoseCentreY(onPhone, frame),
    cameraRef,
    layers: [],
    sampleBands: { sky: [0.02, 0.2], horizon: frame.horizon, ground: frame.groundBand, key: [0.3, 0.55] },
    ground: frame.floor ? { size: 44, repeat: 5, tintMix: 0.45, luma: 0.5, fade: true, fadeCore: 0.4, center: [1.0, 0.5] as [number, number] } : false,
    fog: { near: 16, far: 44, colorMix: 0.2 },
    // The wind: two drifting snow-haze planes (additive, slow), the lower one in front of the Ronso's feet.
    fogPlanes: low
      ? []
      : [
          { z: -12, y: 1.4, width: 40, height: 6, opacity: 0.12, speed: 0.02, additive: true },
          { z: -4.5, y: 0.7, width: 28, height: 3.4, opacity: 0.08, speed: 0.035, additive: true },
        ],
    background: 0x0a1018,
  };
}

/** **The summit of Mt. Gagazet, for Garik Ronso**, as a {@link SceneFactory}. Owns no combatants. */
export const buildGagazetSummitScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:ffx2-gagazet-summit';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? DJOSE_CAMERA_REF;
  const url = artUrl(`art/backdrops/${GARIK_RONSO_PLATE}.png`);

  // On an upright phone the idle camera dollies back so the line of three stays in the slice (the Chamber's rule, `./djose-chamber.ts`); a desktop is untouched.
  const onPhone = roadOnPhone();
  const options = plateOptions(url, low, cameraRef, onPhone);
  let backdrop = await Backdrop.create(options);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // Moonlight from the upper left behind the party, a pale blue rim from behind the Ronso, a cool low ambient.
    keyFrom: [-4.8, 8.4, 3.2],
    keyIntensity: 1.2,
    rimFrom: [5.6, 3.0, -4.6],
    rimColor: 0xc4dcff,
    rimIntensity: 1.0,
    fillIntensity: 0.88,
    ambientIntensity: 0.6,
    luma: { key: 0.84, fill: 0.68, rim: 0.88, ambient: 0.54 },
    shadows: false,
  });
  group.add(lights.group);

  const pools = GARIK_SUMMIT_SLOTS.party.map((s) => {
    const pool = makeLightPool({ color: 0xd2e4ff, radius: 0.95, opacity: 0.12 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  const phoneCamera = onPhone ? new RoadPhoneCamera(DJOSE_RIGS.idle, { shiva: [...GARIK_BODY_IDS], sisters: [], anima: [] }) : null;

  const watchEnabled = opts.watchAssets ?? Boolean(import.meta.env.DEV);
  let watcher: AssetWatcher | null = null;
  if (watchEnabled && backdrop.placeholder) {
    watcher = watchAssets([url], () => {
      void (async (): Promise<void> => {
        const next = await Backdrop.create(options);
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
    rigs: DJOSE_RIGS,
    partySlots: GARIK_SUMMIT_SLOTS.party.map((s) => new Vector3(s[0], s[1], s[2])).concat(
      [[-11.5, 0, 2.6], [-12.4, 0, 1.0], [-13.3, 0, -0.6], [-14.2, 0, -2.2]].map((s) => new Vector3(s[0], s[1], s[2])),
    ),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: DJOSE_PARTY_HEIGHT,
    ...STAGING,
    enemyHeight: GARIK_FIGURE_HEIGHT,
    palette: GARIK_SUMMIT_PALETTE,
    ...(phoneCamera ? { bindCamera: (camera: BattleCamera | null): void => phoneCamera.bind(camera) } : {}),
    update(dt: number): void {
      phoneCamera?.update(group.parent);
      backdrop.update(dt);
      lights.update(dt);
    },
    dispose(): void {
      watcher?.stop();
      phoneCamera?.bind(null);
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
