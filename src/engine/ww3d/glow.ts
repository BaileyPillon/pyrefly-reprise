/**
 * **The cast aura** (the hidden Wind Waker chapter; FFX-2 only): what a figure shows while it casts, charges or glows. Pure maths and colours (no `three`, no DOM): `tests/unit/ww3d/glow.test.ts` pins it.
 *
 * Phase 2 painted the glow as an emissive FILL (`GLOW_GAIN` 0.5 over the whole lit model) and the girls turned into cream ghosts (stills 29 to 31), Valefor washed pale gold for the whole charge (55 to 58, 66 to 68).
 * A Wind Waker glow is a **thin toon rim** in the spell's colour: a hard-edged band of the silhouette, pulsing, never a fill. The band itself is in the toon shader (`./toon.ts`, `uToonGlow`: a colour and a strength,
 * drawn where the surface turns away from the lens); this file decides its colour, its pulse and how strong it is.
 *
 * - **Colour by spell.** A girl's rim takes the display colour of what she casts ({@link spellRim}): fire an orange, ice a pale blue, lightning a yellow, water a sea blue, a cure a soft green-white, Protect a gold, Shell a
 *   violet; any other spell a warm gold. Valefor's charge is {@link BOSS_RIM}, warm gold. The colours are presentation, not game data.
 * - **Pulse.** The strength breathes between {@link PULSE_LOW} and 1 about twice a second ({@link rimPulse}).
 * - **A little fill, no more.** {@link GLOW_FILL} is the share of the old emissive fill that is kept (a faint lift so the rim does not look pasted on); it is small enough that no flat colour of the face or the costume changes
 *   visibly.
 *
 * Game case: FFX-2 only.
 */

/** A linear colour, each channel 0..1 (the rim shader mixes the lit colour toward it, times 1.15, by the band and the strength). */
export type Rgb = readonly [number, number, number];

/** The sRGB display value 0..1 as linear light (the rim is drawn in the render target's linear space; the colours below are chosen as display colours). */
export const toLinear = (v: number): number => Math.min(1, Math.max(0, v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
const lin = (r: number, g: number, b: number): Rgb => [toLinear(r), toLinear(g), toLinear(b)];

/** How much of the old emissive fill is kept, a share of the glow (0.5 in phase 2: the girls turned cream). */
export const GLOW_FILL = 0.08;
/** The rim's strength is this share of its colour at the pulse's low, 1 at the top. */
export const PULSE_LOW = 0.55;
/** Pulses per second. */
export const PULSE_HZ = 1.9;
/** The strength of the rim at full glow (a full rim replaces the lit colour in its band; it is thin, so the face and the costume keep their flat colours). */
export const RIM_GAIN = 1.0;

/** Valefor's charge: a warm gold. */
export const BOSS_RIM: Rgb = lin(1.0, 0.78, 0.25);
/** A girl's rim when the spell is unknown. */
export const DEFAULT_RIM: Rgb = lin(1.0, 0.82, 0.32);

interface Rule {
  readonly test: RegExp;
  readonly colour: Rgb;
}

/** Spell id keywords to colours, first match wins (ids are lower-cased; the ability ids are `x2-<name>`-like). */
const RULES: readonly Rule[] = [
  { test: /fire|flare|burn|blaze/, colour: lin(1.0, 0.45, 0.1) },
  { test: /blizz|ice|frost|freez/, colour: lin(0.55, 0.85, 1.0) },
  { test: /thunder|bolt|lightning|shock/, colour: lin(1.0, 0.9, 0.2) },
  { test: /water|aqua|tidal|drown/, colour: lin(0.25, 0.65, 1.0) },
  { test: /cure|cura|heal|regen|raise|life|esuna|panacea/, colour: lin(0.65, 1.0, 0.7) },
  { test: /protect|barrier|armor|armour/, colour: lin(1.0, 0.82, 0.25) },
  { test: /shell|reflect|magic-def/, colour: lin(0.78, 0.55, 1.0) },
  { test: /haste|speed|slow|stop/, colour: lin(0.45, 0.95, 1.0) },
  { test: /holy|ultima|bio|dark|death|drain/, colour: lin(0.95, 0.95, 1.0) },
];

/** The rim colour for the spell `abilityId` (any id; undefined and unknown ids get {@link DEFAULT_RIM}). */
export function spellRim(abilityId: string | undefined): Rgb {
  if (!abilityId) return DEFAULT_RIM;
  const id = abilityId.toLowerCase();
  for (const r of RULES) if (r.test.test(id)) return r.colour;
  return DEFAULT_RIM;
}

/** The pulse at `seconds` since the cast began, from {@link PULSE_LOW} to 1. */
export function rimPulse(seconds: number): number {
  return PULSE_LOW + (1 - PULSE_LOW) * (0.5 + 0.5 * Math.sin(seconds * PULSE_HZ * Math.PI * 2));
}

/** The rim's strength for a glow `level` (0 off to 1 held) at `seconds` into the cast: the level times the pulse times {@link RIM_GAIN}. */
export function rimStrength(level: number, seconds: number): number {
  return Math.max(0, Math.min(1, level)) * rimPulse(seconds) * RIM_GAIN;
}

/** The faint emissive fill for a glow `level`: {@link GLOW_FILL} of it. */
export function fillAmount(level: number): number {
  return Math.max(0, Math.min(1, level)) * GLOW_FILL;
}

/** How fast the aura's level rises when a cast begins (seconds to reach the full level). */
export const RISE_SECONDS = 0.25;

/** The aura's level `seconds` into a cast: it rises over {@link RISE_SECONDS} and then holds at 1 (the pulse is separate, {@link rimPulse}). */
export function glowLevel(seconds: number): number {
  return Math.max(0, Math.min(1, seconds / RISE_SECONDS));
}
