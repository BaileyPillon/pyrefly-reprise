import { AdditiveBlending, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three';
import { Backdrop, type BackdropOptions } from '../engine/Backdrop.ts';
import type { CameraRig } from '../engine/BattleCamera.ts';
import { LightRig, makeLightPool } from '../engine/Lighting.ts';
import { artUrl, watchAssets, type AssetWatcher } from '../engine/PaintedArt.ts';
import type { ScenePalette } from '../engine/Renderer.ts';
import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import { CAVERN_WIDE_RIGS, cavernRigsFor, viewportAspect } from './cavern-stolen-fayth-rigs.ts';
import type { SceneSlots } from './index.ts';
import { SakuraArrival, sakuraArrivalAt, softDiscTexture, SAKURA_ARRIVAL_MS } from './cavern-stolen-fayth-arrival.ts';
import { CAVERN_IDS, findFigure, victoryStruck, type StagedFigure } from './cavern-stolen-fayth-cast.ts';

// ---------------------------------------------------------------------------
// The Cavern of the Stolen Fayth, the last chamber (FFX)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Lady Ginnem's Yojimbo, Chapter IX
// (`research/ffx-yojimbo.md`); no FFX-2 chapter stands here.
//
// On whose word: Bailey's O-4 pick, chamber A "cold" (D-061), with the
// night-sakura arrival at the start of the fight (D-072; 2026-09-24, "All your
// recommendations"; `docs/concepts/chapters/yojimbo/README.md` question 4), and
// the line-up Lulu, Kimahri, Yuna (D-066) with Ginnem and Daigoro untargetable.
//
// THE PAINTING. `public/art/backdrops/cavern-stolen-fayth.png` (2688x1536,
// CANDIDATE, `docs/concepts/chapters/yojimbo/production/chamber.md`): rock walls,
// a shaft of daylight right of centre, and a painted floor in the bottom ~20 %
// with the dormant teleport pad at plate (1540, 1394), radii 225 x 44 px
// (research §6.1: "a teleport pad in the middle (dormant until after the
// battle)" [verified: 2 sources]). The battle camera looks down on the field,
// so, as at Macalania, the painting is the chamber's back wall: 34 wide at
// z -12, its row 0.95 on the 3D floor, so the painted floor and the pad sit
// just above the floor line and the 3D ground under the fighters runs into
// them. The idle frame shows the plate from about row 0.6 down (a knowing
// crop: the ceiling would sit under the HUD's top band anyway).
//
// After the victory the pad lights (presentation only): an additive ring at the
// pad's own plate pixels, the sidecar's "glow belongs to the scene" note.

/** Plate pixels (`cavern-stolen-fayth.json`): size, the pad's centre and radii, and the row set on the floor. */
export const CAVERN_PLATE = { w: 2688, h: 1536, pad: { cx: 1540, cy: 1394, rx: 225, ry: 44 }, floorRow: 0.95 } as const;

/** Painting plane: 34 wide at z -12 (H 19.43); row {@link CAVERN_PLATE}.floorRow at y 0. */
const BACKDROP = (() => {
  const width = 34;
  const height = width / (CAVERN_PLATE.w / CAVERN_PLATE.h);
  return { width, height, distance: -12, centreY: height * (CAVERN_PLATE.floorRow - 0.5) } as const;
})();

/** The idle camera, which the parallax stack is solved for. */
const CAMERA_REF: [number, number, number] = [0, 5.1, 17.6];

/**
 * Party: Lulu, Kimahri, Yuna, the build's `activeSlots` order
 * (`src/data/ffx/builds/yojimbo-cavern.ts`), then four reserve spots off
 * frame-left. Lulu and Yuna in front, Kimahri a step back between them, all
 * right of the command stack; held there (`holdParty`).
 */
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
 * Enemy slots, index = each record's `slot` (`src/data/ffx/enemies/yojimbo.ts`):
 * 0 Lady Ginnem (M1), 1 Yojimbo (M2), 2 Daigoro (M3). Yojimbo right of the
 * party and a step back, Daigoro beside him on the party's side (sheet-arrival
 * A's order), Ginnem apart, far back behind the party: she is untargetable and
 * takes no part.
 *
 * Solved on 2026-09-25 against the FFX HUD at 1600x900 (and 2000x1012), with
 * the Sensor plate's resting place (grid 436..542 x 166..253, open for seven
 * seconds on every reveal) as an obstacle: at (5, 0, 0) the open plate hid 83 %
 * of Yojimbo, and the `party` close-up put him behind the CTB list. He now
 * stands in the column between Yuna and that plate.
 */
const ENEMY_SLOTS: Array<[number, number, number]> = [
  [1.0, 0, -6.5],
  [2.75, 0, -2.0],
  [1.5, 0, -2.1],
];

/** Index of each combatant's slot in {@link CAVERN_STOLEN_FAYTH_SLOTS}.enemy. */
export const CAVERN_ENEMY_SLOT = { ginnem: 0, yojimbo: 1, daigoro: 2 } as const;

/**
 * World heights, every one a presentation estimate (`docs/concepts/chapters/
 * yojimbo/INSTALLED.md`, the visual bible's `[estimate]`, no game data): Yojimbo
 * 2.55, Daigoro 0.73, Ginnem at human scale. The party takes the FFX chapters'
 * 1.75. The stage sizes Ginnem at 0.7 of the boss height (1.785), its rule for
 * a non-boss fiend; Daigoro gets his own through `figureHeights` (the stage's
 * per-combatant height, which shrinks his shadow and turn ring with him).
 */
export const CAVERN_ACTOR_HEIGHTS = { party: 1.75, yojimbo: 2.55, daigoro: 0.73, ginnem: 1.785 } as const;

/** Each enemy stays on its spot; the party is held on its slots; Daigoro stands at his own height. */
const CAVERN_STAGING = {
  holdParty: true,
  enemySpots: {
    [CAVERN_IDS.ginnem]: ENEMY_SLOTS[CAVERN_ENEMY_SLOT.ginnem]!,
    [CAVERN_IDS.yojimbo]: ENEMY_SLOTS[CAVERN_ENEMY_SLOT.yojimbo]!,
    [CAVERN_IDS.daigoro]: ENEMY_SLOTS[CAVERN_ENEMY_SLOT.daigoro]!,
  },
  figureHeights: { [CAVERN_IDS.daigoro]: CAVERN_ACTOR_HEIGHTS.daigoro },
} as const;

/** The published slots, same shape every other scene exports. */
export const CAVERN_STOLEN_FAYTH_SLOTS: SceneSlots = {
  party: PARTY_SLOTS.slice(0, 3).map((s) => [...s] as [number, number, number]),
  enemy: ENEMY_SLOTS.map((s) => [...s] as [number, number, number]),
  partyHeight: CAVERN_ACTOR_HEIGHTS.party,
  enemyHeight: CAVERN_ACTOR_HEIGHTS.yojimbo,
  ...CAVERN_STAGING,
};

/** The 16:9 rigs (`cavern-stolen-fayth-rigs.ts` has the phone's and the aspect rule). */
export const CAVERN_STOLEN_FAYTH_RIGS: Readonly<Record<string, CameraRig>> = CAVERN_WIDE_RIGS;
export const CAVERN_STOLEN_FAYTH_BACKDROP = BACKDROP;

/** A plate pixel on the painting plane, in world units (the plane is not rolled or scaled). */
export function platePoint(px: number, py: number): [number, number, number] {
  const { width, height, distance, centreY } = BACKDROP;
  return [(px / CAVERN_PLATE.w - 0.5) * width, centreY + (0.5 - py / CAVERN_PLATE.h) * height, distance];
}

/**
 * Cold stone under a shaft of daylight (O-4 A): a steel-blue shadow tint, a
 * neutral gain so Yojimbo's gold and purple carry the colour, a soft vignette,
 * and bloom only above the shaft's brightest stone.
 */
export const CAVERN_STOLEN_FAYTH_PALETTE: ScenePalette = {
  name: 'cavern-stolen-fayth',
  lift: [0.006, 0.01, 0.018],
  gamma: [1.0, 1.0, 0.99],
  gain: [1.0, 1.01, 1.03],
  saturation: 0.98,
  vignette: 0.4,
  vignetteRadius: 0.66,
  shadowTint: [0.36, 0.48, 0.62],
  shadowTintAmount: 0.14,
  grain: 0.024,
  exposure: 1.0,
  bloomThreshold: 0.86,
  bloomStrength: 0.4,
  bloomRadius: 0.55,
  tiltFocus: 0.55,
  tiltBandWidth: 0.2,
  tiltMaxBlur: 2.8,
};

/** With no opening shot to start on (the skip speed), the arrival starts this long after he is staged. */
export const ARRIVAL_FALLBACK_MS = 9000;

/** The pad's light after the victory: fade in, then breathe. Ours; the sources only say it wakes. */
export const PAD_GLOW = { color: 0xa8e6ff, fadeMs: 700, peak: 1.0, pulse: 0.15, pulseHz: 0.35 } as const;

/** **The last chamber of the Cavern of the Stolen Fayth**, as a {@link SceneFactory}. Owns no actors. */
export const buildCavernStolenFaythScene: SceneFactory = async (opts: SceneBuildOptions = {}): Promise<SceneBuild> => {
  const group = new Group();
  group.name = 'scene:cavern-stolen-fayth';
  const low = opts.quality === 'low';
  const cameraRef = opts.cameraRef ?? CAMERA_REF;
  // The framing for the window this battle opens in (16:9, 4:3, a phone).
  const rigs = cavernRigsFor(viewportAspect());
  const url = artUrl('art/backdrops/cavern-stolen-fayth.png');

  const backdropOptions = {
    url,
    width: BACKDROP.width,
    distance: BACKDROP.distance,
    centreY: BACKDROP.centreY,
    cameraRef,
    // No masked bands: the floor band carries the pad, and a band nearer the
    // camera would hide the glow painted behind it.
    layers: [],
    /** `key` is the shaft of daylight, `horizon` the misty back wall, `ground` the painted floor. */
    sampleBands: { sky: [0.02, 0.2], horizon: [0.62, 0.78], ground: [0.84, 0.97], key: [0.3, 0.55] },
    ground: { size: 44, repeat: 5, tintMix: 0.45, luma: 0.46, fade: true, fadeCore: 0.4, center: [1.0, 0.5] as [number, number] },
    fog: { near: 18, far: 46, colorMix: 0.16 },
    fogPlanes: [{ z: -9, y: 0.6, width: 34, height: 3.2, opacity: 0.09, speed: 0.008, additive: true }],
    background: 0x0b1118,
  } satisfies BackdropOptions;

  let backdrop = await Backdrop.create(backdropOptions);
  backdrop.applyTo(group);

  const lights = new LightRig({
    palette: backdrop.palette,
    // The shaft of daylight right of centre is the key, from high and behind.
    keyFrom: [2.4, 9.5, -7.0],
    keyIntensity: 0.95,
    rimFrom: [1.0, 4.0, -10.0],
    rimColor: 0xbcd8ee,
    rimIntensity: 0.85,
    fillIntensity: 0.8,
    ambientIntensity: 0.55,
    luma: { key: 0.78, fill: 0.55, rim: 0.85, ambient: 0.45 },
    shadows: low ? false : { mapSize: 1024, area: 14, radius: 3.0, bias: -0.0012 },
  });
  group.add(lights.group);

  const pools = PARTY_SLOTS.slice(0, 3).map((s) => {
    const pool = makeLightPool({ color: 0xcfe2f2, radius: 0.95, opacity: 0.1 });
    pool.position.set(s[0], 0.02, s[2]);
    group.add(pool);
    return pool;
  });

  // ------------------------------------------------------------ the arrival
  const yojimboSpot = ENEMY_SLOTS[CAVERN_ENEMY_SLOT.yojimbo]!;
  const sakura = new SakuraArrival(
    {
      veil: { centre: [0, BACKDROP.height * 0.5, BACKDROP.distance + 0.05], width: BACKDROP.width + 8, height: BACKDROP.height + 2 },
      floor: { centre: [0.5, 0, -2], width: 40, depth: 36 },
      // Behind Yojimbo and a little right, rising over him (sheet-arrival A).
      tree: { foot: [yojimboSpot[0] + 1.3, 0, yojimboSpot[2] - 2.5], height: 6.2 },
      petals: { centre: [yojimboSpot[0] - 1.2, 3.0, yojimboSpot[2] + 1.0], bounds: { x: 6.5, y: 3.4, z: 3.5 } },
    },
    { low },
  );
  group.add(sakura.group);
  void sakura.loadPainting();
  const particles = [sakura.petals];

  // ------------------------------------------------------------- the pad
  const [px, py, pz] = platePoint(CAVERN_PLATE.pad.cx, CAVERN_PLATE.pad.cy);
  const padTex = softDiscTexture();
  const padMat = new MeshBasicMaterial({
    map: padTex,
    color: PAD_GLOW.color,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
    toneMapped: false,
  });
  const pad = new Mesh(new PlaneGeometry(1, 1), padMat);
  // The disc's soft edge reaches past the painted rim, so it is drawn at 1.35x the pad's radii.
  const perPx = BACKDROP.width / CAVERN_PLATE.w;
  pad.scale.set(CAVERN_PLATE.pad.rx * 2 * perPx * 1.35, CAVERN_PLATE.pad.ry * 2 * perPx * 1.35, 1);
  pad.position.set(px, py, pz + 0.06);
  pad.renderOrder = -44;
  pad.visible = false;
  pad.name = 'teleport-pad-glow';
  group.add(pad);

  // ------------------------------------------------ the staged figures
  // The arrival waits for the opening shot: the battle-start card is up while
  // the stage is built, so "Yojimbo is staged" is too early. The opening cuts
  // to this scene's `intro` rig (`BattleMoments.battleStart`); the first frame
  // rendered from there starts it. With no opening (the skip speed) it starts
  // {@link ARRIVAL_FALLBACK_MS} after he is staged.
  const intro = new Vector3(...(rigs.intro.position as [number, number, number]));
  let introSeen = false;
  pools[0]!.frustumCulled = false; // the probe below must run on every frame
  pools[0]!.onBeforeRender = (_r, _s, camera): void => {
    if (!introSeen && camera.position.distanceTo(intro) < 1.2) introSeen = true;
  };
  let waitMs = -1;
  let arrivalMs = -1;
  let yojimbo: StagedFigure | null = null;
  const stepTo = new Vector3(...yojimboSpot);
  const stepFrom = stepTo.clone().add(new Vector3(0.9, 0, -0.9));
  let padMs = -1;

  const runArrival = (dt: number, root: StagedFigure['parent']): void => {
    const seen = findFigure(root, CAVERN_IDS.yojimbo);
    if (seen && seen !== yojimbo) {
      // A new fight on this field (first staging, or a retry): wait for its opening.
      yojimbo = seen;
      waitMs = 0;
      arrivalMs = -1;
      padMs = -1;
      introSeen = false;
    }
    const daigoro = findFigure(root, CAVERN_IDS.daigoro);
    if (!yojimbo) return;
    if (waitMs >= 0) {
      waitMs += dt * 1000;
      if (!introSeen && waitMs < ARRIVAL_FALLBACK_MS) {
        // Not yet summoned: neither of them is on the field.
        daigoro?.setAlpha?.(0);
        yojimbo.setAlpha?.(0);
        return;
      }
      waitMs = -1;
      arrivalMs = 0;
    }
    if (arrivalMs < 0) return;
    arrivalMs += dt * 1000;
    const f = sakuraArrivalAt(arrivalMs);
    sakura.apply(f);
    if (arrivalMs <= SAKURA_ARRIVAL_MS.yojimboIn[1] + 50) {
      daigoro?.setAlpha?.(f.daigoro);
      yojimbo.setAlpha?.(f.yojimbo);
      // He steps out from the tree onto his spot (`enemySpots`), and ends exactly on it.
      yojimbo.position.lerpVectors(stepFrom, stepTo, f.yojimbo);
    }
    if (f.done) arrivalMs = -1;
  };

  const runPad = (dt: number, root: StagedFigure['parent']): void => {
    if (padMs < 0 && victoryStruck(root)) padMs = 0;
    if (padMs < 0) {
      pad.visible = false;
      return;
    }
    padMs += dt * 1000;
    const k = Math.min(1, padMs / PAD_GLOW.fadeMs);
    const breathe = 1 - PAD_GLOW.pulse * (0.5 + 0.5 * Math.cos((padMs / 1000) * Math.PI * 2 * PAD_GLOW.pulseHz));
    pad.visible = true;
    padMat.opacity = PAD_GLOW.peak * k * k * (3 - 2 * k) * breathe;
  };

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
    particles,
    rigs,
    partySlots: PARTY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    enemySlots: ENEMY_SLOTS.map((s) => new Vector3(s[0], s[1], s[2])),
    partyHeight: CAVERN_ACTOR_HEIGHTS.party,
    enemyHeight: CAVERN_ACTOR_HEIGHTS.yojimbo,
    ...CAVERN_STAGING,
    palette: { ...CAVERN_STOLEN_FAYTH_PALETTE },
    update(dt: number): void {
      backdrop.update(dt);
      lights.update(dt);
      sakura.update(dt);
      runArrival(dt, group.parent);
      runPad(dt, group.parent);
    },
    dispose(): void {
      watcher?.stop();
      sakura.dispose();
      for (const p of pools) {
        p.geometry.dispose();
        (p.material as { dispose(): void }).dispose();
      }
      pad.geometry.dispose();
      padMat.dispose();
      padTex.dispose();
      lights.dispose();
      backdrop.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
};
