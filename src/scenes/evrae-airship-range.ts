/**
 * **Evrae on the deck of the Fahrenheit (FFX): the NEAR / FAR range, as pure data.**
 *
 * Game case: FFX only [AGENTS.md rule 14]. The airship distance mechanic "has no
 * X-2 counterpart" (`research/ffx-evrae-airship.md` §0.4); nothing here is read
 * by an FFX-2 chapter and nothing here imports one.
 *
 * No `three`, no DOM: the scene factory (`evrae-airship-deck.ts`), the range
 * director (`evrae-airship-director.ts`), the preview, the HUD widget and the
 * unit tests all read these tables, so they can never disagree about where the
 * creature is or what the camera does.
 *
 * ## What the staging is built to (INFERRED, not approved)
 *
 * Bailey has not picked from the order-widget round
 * (`docs/concepts/chapters/evrae/widget/`). This is the driver's recommendation,
 * **A's widget with C's staging**: the range is read off the field itself, with
 * no gauge. NEAR is tight, warm and low, Evrae's head over the rail; FAR pulls
 * back, more deck underfoot, cold haze, faster wind, Evrae a diagonal streak in
 * open sky. The cloud drift changes speed the instant the ship answers
 * (research §12.3: "its speed is the ship's speed, and it must visibly change
 * when the ship manoeuvres"). Recorded as an INFERRED tile in
 * `docs/target/targets.json`.
 *
 * ## The engine's side
 *
 * The range is one encounter flag, `state.flags['airship.range']`, which only
 * this encounter sets (`src/battle/ffx/ai/evrae-rules.ts`). It flips in two
 * places: Cid flying a queued order (a `message` "The Fahrenheit pulls back" /
 * "closes in") and Swooping Scythe dragging the ship back to NEAR (a `counter`).
 * Neither is a dedicated event, so presentation reads the **flag** after each
 * event rather than parsing message text: {@link airshipRangeOf}.
 */

import type { BattleState } from '../battle/common/types.ts';
import {
  AIRSHIP_BREATH_CHARGED,
  AIRSHIP_MISSILES,
  AIRSHIP_ORDER,
  AIRSHIP_RANGE,
  MISSILE_COUNT,
} from '../battle/ffx/ai/evrae-rules.ts';

export type AirshipRange = 'near' | 'far';
type Spot = [number, number, number];

/** The only part of the state this module reads. */
export type AirshipFlags = Pick<BattleState, 'flags'>;

/**
 * The range, or `null` when this battle has no range mechanic at all. `null`
 * is the "does the encounter declare it" test the widget and the director use,
 * so no other chapter ever mounts either.
 */
export function airshipRangeOf(state: AirshipFlags | null | undefined): AirshipRange | null {
  const v = state?.flags?.[AIRSHIP_RANGE];
  if (v === undefined) return null;
  return v === 'far' ? 'far' : 'near';
}

/** The order waiting on Cid's next turn, or `null`. Last order wins (§4.2). */
export function airshipOrderOf(state: AirshipFlags | null | undefined): AirshipRange | null {
  const v = state?.flags?.[AIRSHIP_ORDER];
  return v === 'far' || v === 'near' ? v : null;
}

/** Inhale has charged Poison Breath and it has not fired or whiffed yet (§3.3 note 4). */
export function breathChargedOf(state: AirshipFlags | null | undefined): boolean {
  return state?.flags?.[AIRSHIP_BREATH_CHARGED] === true;
}

/** Volleys still in Cid's rack. §2.3: three uses. */
export function missilesLeftOf(state: AirshipFlags | null | undefined): number {
  const v = state?.flags?.[AIRSHIP_MISSILES];
  return typeof v === 'number' ? Math.max(0, Math.min(MISSILE_COUNT, v)) : MISSILE_COUNT;
}

// ---------------------------------------------------------------------------
// The FAR painting's scale, from the head length
// ---------------------------------------------------------------------------

/**
 * Evrae's head, snout tip to eye centre, **measured on the installed CANDIDATE
 * paintings at native pixels** (2026-09-22, 3x/4x nearest-neighbour crops with
 * 10 px ticks, recorded in `docs/handoff/chapter-evrae-scene.md` §3):
 *
 * - `idle-near.png` (1171x784): snout (221.7, 210) to eye (281.7, 175), 69.5 px.
 * - `idle-far.png` (1024x477): snout (18.8, 97.5) to eye (72.5, 85.5), 55.1 px.
 *
 * One creature, so one head: at the same distance the FAR painting has to be
 * drawn at `69.5 / 55.1` of NEAR's pixel scale for its head to be the same
 * world size. Distance then does the shrinking, because FAR stands much further
 * out ({@link RANGE_STAGING}); the painting is never simply drawn small.
 * `idle-far.json`'s note asked for exactly this ("the scene owner wires the
 * switch and sets the far scale"). A re-render of either painting changes these
 * two numbers, and the unit test pins them so that cannot happen silently.
 */
export const EVRAE_HEAD_PX = { near: 69.5, far: 55.1 } as const;

/** FAR's pixel scale over NEAR's, for one head length. */
export const EVRAE_FAR_HEAD_RATIO = EVRAE_HEAD_PX.near / EVRAE_HEAD_PX.far;

/**
 * The actor-group scale the director sets while the FAR painting is the
 * actor's reference pose.
 *
 * `PaintedActor` sizes a subject from its idle painting: `worldHeight` over
 * idle's baseline row. While FAR is showing, FAR *is* idle, so its baseline
 * would be stretched to the full boss height. This undoes that and applies the
 * head ratio: `(far.baselineY / near.baselineY) * EVRAE_FAR_HEAD_RATIO`.
 */
export function farActorScale(nearBaselineY: number, farBaselineY: number): number {
  if (!(nearBaselineY > 0) || !(farBaselineY > 0)) return 1;
  return (farBaselineY / nearBaselineY) * EVRAE_FAR_HEAD_RATIO;
}

/** The installed FAR painting's width in pixels (`idle-far.json`). */
export const EVRAE_FAR_WIDTH_PX = 1024;

/**
 * FAR's drawn width in world units for a NEAR world height `h`: the FAR
 * painting at NEAR's pixel scale (`h / near baseline`) times the head ratio.
 * 4.1 gives 6.9 units. The director measures what the actor actually drew
 * (`PaintedActor.poseSize`) and scales to this, so the actor's own long-side
 * clamp (2.2x its height) cannot bend the result.
 */
export function farWorldWidth(h: number): number {
  return EVRAE_FAR_WIDTH_PX * (h / EVRAE_BASELINE_PX.near) * EVRAE_FAR_HEAD_RATIO;
}

/** The installed sidecars' baselines (`public/art/characters/evrae/idle-{near,far}.json`). */
export const EVRAE_BASELINE_PX = { near: 768, far: 461 } as const;

// ---------------------------------------------------------------------------
// Where things stand, per range
// ---------------------------------------------------------------------------

/**
 * Evrae's world height at NEAR. **Not sourced**: the research gives no size
 * (§12.2 is words only: "longer than the frame", "a head-and-claws threat
 * filling the upper third, jaw level with the deck"). It is the stage's boss
 * height (`BattlePresenterStage`'s 4.1), so the preview and a real battle draw
 * the same creature.
 */
export const EVRAE_WORLD_HEIGHT = 4.1;

/** A camera rig as plain numbers (`CameraRig` without `Vector3`). */
export interface RigNumbers {
  position: Spot;
  lookAt: Spot;
  fov: number;
  sway?: number;
}

export interface RangeStaging {
  /** Where Evrae hovers. y below 0 is below the deck: the deck edge hides the coils. */
  evrae: Spot;
  /** The rigs installed under the scene's generic names while this range holds. */
  rigs: { idle: RigNumbers; action: RigNumbers; enemy: RigNumbers };
  /** Cold haze sheet over the sky, 0..1. */
  haze: number;
  /** Cloud and wind speed multiplier: the ship's speed. */
  wind: number;
  /**
   * Key light colour and strength: B's sun (warm white) and the deck in Evrae's
   * shadow NEAR, cool and open FAR. Re-keyed 2026-09-23 from a dusk orange
   * (0xffcf9e at 0.85) to B's daylight (`evrae-airship-daylight.ts`).
   */
  key: { color: number; intensity: number };
  /** Ambient strength: the deck is "shadowed by its bulk" at NEAR (§12.3). */
  ambient: number;
}

/**
 * C's staging, per range. §12.3: "At NEAR: Evrae's head over the rail, the deck
 * shadowed by its bulk, clouds occluded. At FAR: Evrae small against clean sky,
 * the whole deck lit, cloud layers visible past it."
 */
export const RANGE_STAGING: Readonly<Record<AirshipRange, RangeStaging>> = {
  near: {
    evrae: [2.3, -0.9, -4.7],
    rigs: {
      idle: { position: [-0.5, 1.45, 9.4], lookAt: [0.9, 1.75, -3.0], fov: 34 },
      action: { position: [-0.2, 1.4, 8.4], lookAt: [1.4, 1.8, -3.2], fov: 34, sway: 0.7 },
      enemy: { position: [0.6, 1.3, 6.2], lookAt: [2.2, 1.9, -5.0], fov: 34, sway: 0.7 },
    },
    haze: 0.0,
    wind: 1.0,
    key: { color: 0xfff0e2, intensity: 1.7 },
    ambient: 1.1,
  },
  far: {
    evrae: [6.4, 3.3, -30],
    rigs: {
      idle: { position: [0.1, 2.45, 13.2], lookAt: [0.5, 2.0, -6.0], fov: 36 },
      action: { position: [0.2, 2.3, 12.0], lookAt: [1.0, 2.1, -6.0], fov: 36, sway: 0.7 },
      enemy: { position: [0.4, 2.2, 9.5], lookAt: [3.8, 2.9, -18.0], fov: 34, sway: 0.7 },
    },
    haze: 0.32,
    wind: 2.1,
    key: { color: 0xf2f6ff, intensity: 2.0 },
    ambient: 1.15,
  },
};

/** The deck's far edge (the rail line) and the rail's height, world units. */
export const DECK = { edgeZ: -2.7, railHeight: 1.1, nearZ: 16, halfWidth: 26 } as const;

// ---------------------------------------------------------------------------
// The shift: one continuous move, no cut
// ---------------------------------------------------------------------------

/**
 * A range change, in milliseconds from the moment the state flips. The wind
 * answers first (the ship has already moved); the creature fades out where it
 * was, is re-posed and re-placed, and fades in at the other range while the
 * camera is still travelling.
 */
export const RANGE_SHIFT_MS = {
  windMs: 450,
  fadeOutMs: 380,
  cameraMs: 1500,
  fadeInMs: 620,
  total: 1500,
} as const;

export interface RangeShiftState {
  /** 0..1 blend of the two ranges' haze and light. */
  blend: number;
  /** 0..1 blend of the wind speed (faster than the rest). */
  wind: number;
  /** Evrae's alpha. */
  evraeAlpha: number;
  /** True once the painting and position have been swapped to the new range. */
  swapped: boolean;
  done: boolean;
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number): number => t * t * (3 - 2 * t);

/** The shift at `ms`. Pure, so a test and a screenshot can ask for any instant. */
export function rangeShiftAt(ms: number): RangeShiftState {
  const m = RANGE_SHIFT_MS;
  const t = Math.max(0, ms);
  const swapped = t >= m.fadeOutMs;
  const evraeAlpha = swapped
    ? smooth(clamp01((t - m.fadeOutMs) / m.fadeInMs))
    : 1 - smooth(clamp01(t / m.fadeOutMs));
  return {
    blend: smooth(clamp01(t / m.cameraMs)),
    wind: smooth(clamp01(t / m.windMs)),
    evraeAlpha,
    swapped,
    done: t >= Math.max(m.total, m.fadeOutMs + m.fadeInMs),
  };
}
