/**
 * MEGA FLARE LANDS HARDER (release 62; Bailey, 2026-10-22 ~00:00 EDT, decision 173b: "Mega Flare: screen-filling light + longer shake (Recommended)"; **FFX-2 only**: the special draws only in FFX-2,
 * `spellfx/SpellFxSpecials.ts#SPECIAL_FX`, and this keys on its landing tap, so no FFX fight is touched).
 *
 * What the drawn effect already did: a ball of light on Bahamut's chest, a beam to the party, a radial blast and a white wash over the picture. What it did not do is act on the ROOM: the cathedral stayed as dark
 * as before the blast and the girls were lit by an orange point light (the colour of Fire) the beam does not have. This adds, inside the HD-2D bold look (so CLASSIC and `?look=off` take it away):
 *
 *  - **the flood**: the beam's light fills the room. From the moment the blast lands the whole frame is lit by it (the painted room's own lit surfaces gain most, a floor of light under the rest), brightest toward
 *    the blast and never less than 60 percent of that across the room, held a beat and then let go slowly: the room fades back (`floodAt`);
 *  - **the white-out**: at the landing the frame goes nearly white for about a third of a second, a brief and hard punctuation, then falls away into the flood (`whiteAt`);
 *  - the girls are lit by the same light (the relight point lights: cool white, reach more than twice as wide, `relight/RelightConfig.ts#POINT_KINDS.megaflare`);
 *  - the camera shakes harder and longer (`engine/MegaFlareImpact.ts`, the presenter's landing beat).
 *
 * REDUCE FLASHES (`engine/flashRules.ts`, PR-0032): **no white-out at all**, and the flood is capped at 35 percent and rises over most of a second (a slow ramp is not a flash), so nothing brightens quickly;
 * its fall-back is as slow as ever. REDUCE MOTION: the camera does not shake (`ComfortCamera`); the light is a light, not motion, and stays.
 *
 * Pure (no DOM, no `three`): the numbers and the envelopes the shader's uniforms are fed from (`LookFlare.ts`).
 */
import type { Rgb } from '../LookConfig.ts';

export interface FlareSpec {
  flood: {
    /** Seconds from the landing to the flood's peak, held, and then falling back to nothing. */
    rise: number;
    hold: number;
    decay: number;
    /** 1 lights the room's lit surfaces about 2.7 times over at the blast (`LookBoldShader`'s flood block); the share of that kept far from it is {@link FLOOD_FAR}. */
    peak: number;
    /** How far the light reaches from the blast, in frame heights. */
    reach: number;
    /** The light's colour, linear: the beam's cold white-blue. */
    color: Rgb;
  };
  white: {
    /** The share of the frame that is white at the peak (0 = no white-out), and the seconds to reach it and to fall away. */
    peak: number;
    rise: number;
    decay: number;
  };
}

/** How much of the flood reaches the far corners of the room (the rest is the falloff from the blast). */
export const FLOOD_FAR = 0.6;

export const FLARE: FlareSpec = {
  flood: { rise: 0.09, hold: 0.32, decay: 1.7, peak: 1, reach: 1.4, color: [0.72, 0.82, 1.0] },
  white: { peak: 0.9, rise: 0.035, decay: 0.34 },
};

/** REDUCE FLASHES: no white-out, the flood at 35 percent (`flashRules.FLASH_PEAK_CAP`) and a ramp of most of a second. */
export const FLARE_REDUCED: FlareSpec = {
  flood: { ...FLARE.flood, rise: 0.75, peak: 0.35, decay: 2.0 },
  white: { peak: 0, rise: 0.035, decay: 0.34 },
};

export const flareSpec = (reduceFlashes: boolean): FlareSpec => (reduceFlashes ? FLARE_REDUCED : FLARE);

const smooth = (x: number): number => {
  const t = x <= 0 ? 0 : x >= 1 ? 1 : x;
  return t * t * (3 - 2 * t);
};

/** The flood's strength (0..peak) `t` seconds after the landing: a smooth rise, a hold, a long smooth fall. */
export function floodAt(t: number, s: FlareSpec['flood']): number {
  if (t <= 0) return 0;
  if (t < s.rise) return s.peak * smooth(t / s.rise);
  if (t < s.rise + s.hold) return s.peak;
  const d = (t - s.rise - s.hold) / s.decay;
  return d >= 1 ? 0 : s.peak * (1 - smooth(d));
}

/** The white-out's share (0..peak) `t` seconds after the landing: a near-instant rise and a short fall. */
export function whiteAt(t: number, s: FlareSpec['white']): number {
  if (t <= 0 || s.peak <= 0) return 0;
  if (t < s.rise) return s.peak * smooth(t / s.rise);
  const d = (t - s.rise) / s.decay;
  return d >= 1 ? 0 : s.peak * (1 - smooth(d));
}

/** How long a flare is worth keeping after its landing, seconds (both envelopes are over). */
export const flareLength = (s: FlareSpec): number => Math.max(s.flood.rise + s.flood.hold + s.flood.decay, s.white.rise + s.white.decay) + 0.05;

/** A frame's flood factor at a point `r2` (squared distance from the blast over the reach squared): {@link FLOOD_FAR} far away, 1 at the blast. Mirrors the shader. */
export function floodFall(r2: number): number {
  return FLOOD_FAR + (1 - FLOOD_FAR) * Math.exp(-r2 * 1.2);
}
