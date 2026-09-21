/**
 * Site C's stage geometry: where the one finished battle frame sits on the
 * shared stage, and how its eight sheets are spread apart.
 *
 * Every number here is copied from the approved frames
 * (`docs/concepts/atlas/c-scene-exploded/build.mjs` and `c.css`), which are
 * authored in a 1440 x 810 "game frame" space ({@link GF}) laid over the
 * 1600 x 900 site canvas. The shared stage draws in canvas units
 * (`learn/shared/region.ts`), so this module's job is the one conversion
 * between the two — and keeping the whole composition inside
 * {@link FREE_STAGE}, which the approved frames could ignore (they show no
 * detail card) and a real page cannot.
 *
 * No DOM here: `paint-frame.ts` turns these numbers into elements.
 */

import { FREE_STAGE, ORIGIN } from '../shared/region.ts';

/** The game frame's own authoring space (`c.css`: `.gf { width: 1440px; height: 810px }`). */
export const GF = { width: 1440, height: 810 } as const;

/** Which of the nine components a sheet belongs to, and how the frame labels it. */
export interface PlaneDef {
  /** This module's own key, unique per sheet (two sheets share one layer: the backdrop's depth bands). */
  readonly key: string;
  /** The `LAYER_SYSTEMS` id, and so the id of the `layer-*` piece this sheet selects. */
  readonly layerId: string;
  /** The sheet's z position as a multiple of the gap (`build.mjs`'s `planes()` z table). */
  readonly zk: number;
  /** The frame's own 01-06 numbering. Absent on the two unlabelled depth bands. */
  readonly num?: string;
  /** The leader label's text, as the approved frame writes it. */
  readonly label?: string;
  /** Which corner the leader hangs off: `R` rises from the top-left corner, `L` drops from the bottom-left. */
  readonly side?: 'L' | 'R';
  /** The backdrop sheet itself, which is opaque and so never drawn as glass. */
  readonly solid?: boolean;
  /** A masked band cut from the backdrop for parallax. */
  readonly band?: 'far' | 'near';
}

/**
 * The eight sheets, back to front. The two depth bands sit half a step apart
 * from the painting because they belong to the same component as it
 * (`build.mjs`: "the two depth bands sit half a step apart").
 */
export const PLANES: readonly PlaneDef[] = [
  { key: 'backdrop', layerId: 'backdrop-painting', zk: -3.3, num: '01', label: 'Backdrop painting + 2 depth bands', side: 'L', solid: true },
  { key: 'band-far', layerId: 'backdrop-painting', zk: -2.65, band: 'far' },
  { key: 'band-near', layerId: 'backdrop-painting', zk: -2.15, band: 'near' },
  { key: 'light', layerId: 'light-atmosphere', zk: -1.1, num: '02', label: 'Light and atmosphere', side: 'L' },
  { key: 'boss', layerId: 'boss-billboard', zk: -0.1, num: '03', label: 'Boss billboard', side: 'R' },
  { key: 'party', layerId: 'party-billboards', zk: 0.9, num: '04', label: 'Party billboards', side: 'R' },
  { key: 'effects', layerId: 'effects', zk: 1.9, num: '05', label: 'Effects', side: 'R' },
  { key: 'hud', layerId: 'hud-ink-gold', zk: 2.9, num: '06', label: 'HUD, Ink & Gold', side: 'R' },
];

/** The three components that were never paint on a sheet, in the frame's own order. */
export const RAIL_LAYER_IDS: readonly string[] = ['battle-engine', 'presenter', 'music-sound'];

/** One painted cutout on a sheet, in game-frame units (`build.mjs`'s `planes()` inline styles). */
export interface Billboard {
  /** Path under `public/art/`, without the extension. */
  readonly art: string;
  readonly left: number;
  readonly top: number;
  readonly height: number;
  /** The soft contact shadow under it. */
  readonly shadow: { readonly left: number; readonly top: number; readonly width: number };
  /** Auron stands further back, and the frame dims him for it. */
  readonly back?: boolean;
}

/** The boss sheet: Yunalesca's hurt pose, the pose the frame's own damage numeral belongs to. */
export const BOSS: Billboard = {
  art: 'characters/yunalesca-1/hurt',
  left: 742,
  top: 66,
  height: 610,
  shadow: { left: 770, top: 712, width: 330 },
};

/** The party sheet: the three members the seed-1 engine run puts on the field, back to front. */
export const PARTY: readonly Billboard[] = [
  { art: 'characters/auron/idle', left: 330, top: 318, height: 452, shadow: { left: 330, top: 748, width: 250 }, back: true },
  { art: 'characters/yuna/idle', left: 92, top: 372, height: 410, shadow: { left: 96, top: 760, width: 270 } },
  { art: 'characters/tidus/attack', left: 520, top: 300, height: 440, shadow: { left: 520, top: 752, width: 260 } },
];

/** The warm pool of light on the floor under the party (`c.css` `.pool`). */
export const POOL = { left: 60, top: 736, width: 660 } as const;

/** The backdrop painting this chapter's scene loads (`src/data/encounters.ts`, `YUNALESCA.sceneKey`). */
export const BACKDROP_ART = 'backdrops/zanarkand-dome';

/** Where the frame draws the damage numeral: at the target's chest (`c.css` comment, `src/ui/ffx/DamageNumbers.ts`). */
export const DAMAGE_AT = { left: 1004, top: 262 } as const;

/** The impact flash, and the slash arc's own path, in game-frame units. */
export const IMPACT = { left: 735, top: 160, size: 340 } as const;
export const SLASH_PATH = 'M700 560 A330 330 0 0 1 1085 120';
export const SPARK_ORIGIN = { x: 905, y: 330 } as const;

// ---------------------------------------------------------------------------
// Where the frame sits on the stage
// ---------------------------------------------------------------------------

/**
 * The assembled frame is as wide as the chrome-free stage allows and no wider
 * (lesson from sites A and B: nothing may sit under the chrome). The approved
 * `c1` frame draws it 1096 px wide because that frame shows no detail card;
 * this page always has one, so the same composition is fitted to
 * {@link FREE_STAGE} instead of overlapping it.
 */
const ASSEMBLED_WIDTH = FREE_STAGE.w;
export const ASSEMBLED_SCALE = ASSEMBLED_WIDTH / GF.width;

/**
 * Pulled apart, the eight sheets fan out over roughly 1500 game-frame units
 * of depth, so the whole composition has to shrink to stay inside the stage.
 * `c2` shrinks it to 48.9% of its assembled size (`scale(.372)` against
 * `scale(.7611)`); this keeps the stack's projected half-width just inside
 * the chrome-free box instead, which at this stage width works out slightly
 * larger.
 */
export const EXPLODED_SCALE = 0.365;

/** The depth between neighbouring sheets, fully pulled apart (`build.mjs`'s `GAP`). */
export const MAX_GAP = 244;

/** The turn the frame takes as it comes apart (`c2`: `rotateX(4deg) rotateY(43deg)`). */
export const EXPLODED_TURN = { x: 4, y: 43 } as const;

/**
 * `c2`'s perspective, as a multiple of the frame's on-screen width
 * (2600 px over a 536 px-wide frame), so the foreshortening stays the same
 * whatever size the frame is drawn at.
 */
const PERSPECTIVE_RATIO = 2600 / (GF.width * 0.372);

/** The centre of the composition in canvas pixels: the chrome-free box's own centre line. */
const CENTRE_X = FREE_STAGE.x + ORIGIN.x + FREE_STAGE.w / 2;
const ASSEMBLED_CENTRE_Y = 378;
const EXPLODED_CENTRE_Y = 400;

/** Everything `paint-frame.ts` needs to place the frame for one `explode` value. */
export interface FramePlacement {
  /** The perspective host's top-left corner, in stage units (relative to the world origin). */
  readonly left: number;
  readonly top: number;
  /** The perspective host's size, in stage units. */
  readonly width: number;
  readonly height: number;
  readonly scale: number;
  readonly perspective: number;
  readonly rotateX: number;
  readonly rotateY: number;
  /** The depth between neighbouring sheets, in game-frame units. */
  readonly gap: number;
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t;
}

/**
 * Where the frame sits at burst progress `t` (0 assembled, 1 fully pulled
 * apart — `learn/shared/layout.ts`'s `burstProgress`), turned a further
 * `viewAngle` degrees by the view rail.
 */
export function framePlacement(t: number, viewAngle = 0): FramePlacement {
  const scale = lerp(ASSEMBLED_SCALE, EXPLODED_SCALE, t);
  const width = GF.width * scale;
  const height = GF.height * scale;
  const centreY = lerp(ASSEMBLED_CENTRE_Y, EXPLODED_CENTRE_Y, t);
  return {
    left: CENTRE_X - ORIGIN.x - width / 2,
    top: centreY - ORIGIN.y - height / 2,
    width,
    height,
    scale,
    perspective: Math.round(width * PERSPECTIVE_RATIO),
    rotateX: lerp(0, EXPLODED_TURN.x, t),
    rotateY: lerp(0, EXPLODED_TURN.y, t) + viewAngle,
    gap: lerp(0, MAX_GAP, t),
  };
}

/** A sheet's depth, in game-frame units, for a given gap. */
export function planeZ(plane: PlaneDef, gap: number): number {
  return Math.round(plane.zk * gap);
}

/** 0 -> 1 across `[from, to]`, clamped. The one ramp every fade in site C uses. */
export function ramp(value: number, from: number, to: number): number {
  if (to === from) return value >= to ? 1 : 0;
  const t = (value - from) / (to - from);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/** How solid the 3D scene is: full until the inventory starts taking over, gone by `explode` 0.92. */
export function worldFade(explode: number): number {
  return 1 - ramp(explode, 0.72, 0.92);
}

/** How solid the `explode` 1 inventory is. */
export function inventoryFade(explode: number): number {
  return ramp(explode, 0.78, 1);
}
