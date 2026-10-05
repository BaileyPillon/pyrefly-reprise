import type { DriftOffset } from '../b/CameraDrift.ts';

/**
 * A calmer camera while a command menu is open (release 39; FFX only, Chapter III, Braska's Final Aeon; Bailey, 2026-10-04: "I'll go with all of
 * your recommendations", option 1 of the Chapter III options page). Presentation only: the engine's state never changes (rule 1).
 *
 * LIVING PAINTINGS' camera drifts a little side to side (about 0.4 of a unit over 23 s, `fx/b/CameraDrift.ts`). In Chapter III the drift is what
 * brings Yuna's raised staff over the blade of Braska's Final Aeon in the half of the swing where the camera is on the left: the party and the boss
 * are placed to clear each other (`stageTable.ts`), and a placement that clears at every moment of the swing would push the boss far enough right
 * to hide the party's own turn rail behind it. While a menu is open, the one time the player is looking at the picture and choosing, the drift is
 * shrunk to a share of its size and the camera settles a little to its right, the half of the swing where the staff is farthest from the blade;
 * between menus it eases back to the full drift.
 *
 * The row of the staging table says whether a fight is calmed and how much (`Row.calm`), `Framing` arms it each frame with the menu state it already
 * reads, and `DriftRig` applies it to the drift it already makes. FFX-2, every other chapter and the upright phone never arm it. Pure maths in
 * {@link calmStep} and {@link calmedDrift}; {@link menuCalm} is the shared seam.
 */

/** How a row calms its menus. */
export interface MenuCalm {
  /** The share of the drift's amplitude that stays while a menu is open (0.15 = it shrinks to 15 percent). */
  drift: number;
  /** A steady lean to the camera's right, world units at the drift's full weight (the camera settles this far right). */
  lean: number;
}

/** Seconds the calm takes to come in when a menu opens and to go out when it closes. */
export const CALM_EASE_SECONDS = 1;

/** One frame of the eased weight: toward 1 while a menu is `open`, toward 0 otherwise, at most `dt / ease` per step. */
export function calmStep(weight: number, open: boolean, dt: number, ease = CALM_EASE_SECONDS): number {
  const step = ease > 0 ? Math.min(1, Math.max(0, dt) / ease) : 1;
  const want = open ? 1 : 0;
  return weight + Math.max(-step, Math.min(step, want - weight));
}

/**
 * The drift offset (camera-local: x right, y up, z forward) with the calm applied at `weight` (0 = none, 1 = fully calm): its amplitude goes from
 * 1 toward `calm.drift`, and the lean arrives as `weight` does, scaled by the drift's own weight `driftWeight` so it comes in and goes out with the drift
 * (and shrinks with its tier and dial). Returns a new offset.
 */
export function calmedDrift(d: DriftOffset, calm: MenuCalm, weight: number, driftWeight: number): DriftOffset {
  const k = 1 + (calm.drift - 1) * weight;
  return { x: d.x * k + calm.lean * weight * driftWeight, y: d.y * k, z: d.z * k };
}

class MenuCalmState {
  /** This fight's calm (armed by `Framing`), or null: the drift is as it always was. */
  private spec: MenuCalm | null = null;
  private open = false;
  /** The calm the camera is easing with: it outlives `spec` for the second the weight takes to go back to 0. */
  private shown: MenuCalm | null = null;
  weight = 0;

  /** Every frame from `Framing`: this fight's calm (null when it has none, or on the phone) and whether a command menu is open. */
  arm(spec: MenuCalm | null, open: boolean): void {
    this.spec = spec;
    this.open = open;
    if (spec) this.shown = spec;
  }

  /** Every frame from `DriftRig`: ease the weight; returns it. */
  step(dt: number): number {
    this.weight = calmStep(this.weight, this.spec !== null && this.open, dt);
    if (this.weight <= 0 && !this.spec) this.shown = null;
    return this.weight;
  }

  /** The calm in force this frame, or null when there is none to apply. */
  get active(): MenuCalm | null {
    return this.weight > 0 ? this.shown : null;
  }

  /** What `Framing` armed this frame (the tests and the checks read it). */
  get armed(): { spec: MenuCalm | null; open: boolean } {
    return { spec: this.spec, open: this.open };
  }

  /** The battle is over (or a new one is bound): nothing carries into the next fight. */
  reset(): void {
    this.spec = null;
    this.shown = null;
    this.open = false;
    this.weight = 0;
  }
}

export const menuCalm = new MenuCalmState();
