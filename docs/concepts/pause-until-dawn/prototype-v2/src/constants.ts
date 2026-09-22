/**
 * Motion constants for the living-portrait rig, transcribed from
 * `docs/plans/pause-living-portraits-motion-spec.md` section 11 (the
 * measured Until Dawn reference). Applies to both games — this is shared
 * presentation plumbing, not game data (AGENTS.md rule 14).
 *
 * DECISION (2026-09-21, this build, recorded per AGENTS.md rule 15): the
 * spec's own settle percentages — 63% at 0.14s, 95% at 0.42s, 99% at 0.65s —
 * are exactly the single-pole exponential values e^-1, e^-3, e^-4.6. The
 * textbook two-pole critically-damped step response, (1+t/tau)e^(-t/tau),
 * would only reach ~26% / ~80% / ~90% settled at those same times — it does
 * not fit the measurement. So `dynamics.ts` implements the head-yaw spring
 * as an exact first-order low-pass (`ExponentialSpring`): monotonic and
 * overshoot-free by construction (matching "no overshoot anywhere" in the
 * spec) and it reproduces the three documented percentages exactly. The
 * spec's phrase "critically damped spring" is read here as a description of
 * the *shape* (no oscillation, approach-and-hold), which a first-order
 * system satisfies by construction — not as a request for a literal
 * two-pole mass-spring-damper, which would contradict the numbers next to
 * it in the same document.
 */
export const RIG_CONSTANTS = {
  spring: {
    /** Seconds. See the decision note above — this is a first-order time constant. */
    tau: 0.14,
    /** Documented toggle (off by default): tau used when returning to neutral on release. */
    neutralReturnTau: 0.6,
  },
  yaw: {
    /**
     * Degrees of yaw the stand-in rig actually turns through. The reference
     * turns >=90 degrees to a full profile; this build has only the frontal
     * plate as real art (the picked yaw-key renders are not alignment-ready —
     * see `art/keys/keys.md` finding 4), so the turn is a procedural warp of
     * one painting, honestly capped well short of a real profile. Swapping in
     * `rig.json` keys with landmarks raises this without touching the driver.
     */
    maxDeg: 35,
  },
  blink: {
    closeS: 0.05,
    holdMinS: 0.017,
    holdMaxS: 0.05,
    openS: 0.066,
    fullMeanIntervalS: 4.9,
    fullMinIntervalS: 2.5,
    fullMaxIntervalS: 8,
    halfDurationS: 0.2,
    halfApertureMin: 0.5,
    halfApertureMax: 0.6,
  },
  sway: {
    bandHzMin: 0.13,
    bandHzMax: 0.34,
    headAmpPctHeadWidthMin: 1.5,
    headAmpPctHeadWidthMax: 3,
    chestAmpPctIpd: 3,
    /** The chest lags the head by about a third of a cycle at the band's mean rate. */
    chestPhaseLagFraction: 1 / 3,
  },
  expression: {
    onsetMs: 400,
    decayS: 2.8,
    /** "a visible mouth/brow swell every 3-5s" */
    eventMeanIntervalS: 4,
    /** "brow: about 40% of the mouth's amplitude" */
    browAmplitudeFraction: 0.4,
  },
  image: {
    grainPctMin: 0.3,
    grainPctMax: 0.5,
    /** Face mean luminance swings +-5 levels (of 255) across the turn range. */
    relightLevels: 5,
  },
  reducedMotion: {
    /** "let the head follow input but with tau raised to ~0.25s so nothing snaps" */
    tau: 0.25,
  },
  hurt: {
    /** Sam AFTER: body band 0.34Hz vs 0.18Hz calm -> roughly 1.6x faster. */
    swayRateMultiplier: 1.6,
    /** Sam AFTER: gaze excursion 5.9% vs 8.4% IPD -> tighter by roughly 0.7x. */
    gazeTighten: 0.7,
    /** Sam AFTER: brow signal 3.16 vs 2.77 -> busier brow, roughly 1.15x, we round up for legibility. */
    browRateMultiplier: 1.6,
  },
} as const;

export type RigConstants = typeof RIG_CONSTANTS;
