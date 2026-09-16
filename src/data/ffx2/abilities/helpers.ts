/**
 * Shared constants for FFX-2 ability data.
 *
 * Charge (`chargeTicks`) and recovery (`recoveryTicks`) values follow the
 * decoded tick model in `research/ffx2-combat-core.md` §1.2–1.4:
 * `ticks = floor(10000 * value / (agility + 1))`, consumed at 3000 ticks/s at
 * Normal ATB speed. No source publishes per-ability charge-time *values* (only
 * the CT/RT/2xRT tags and the tier ordering), so the four tiers below are the
 * doc's own `[estimate]` conversion from the previously-authored second-values
 * into the same value-unit system real stats use — see §1.3's "CTIM value
 * assignments for the fan game" table. Tag every use `[ffx2-combat-core §1.3,
 * estimate]`.
 */

/** No `CT` tag — fires immediately (Attack, Gunplay, Steal family, Pray, Vigor, Full Throttle main-part Throttle). */
export const CT_INSTANT = 0;
/** Short `CT` — Lv.1-2 magic, the four Breaks, elemental Swordplay, most Bushido/Instinct. */
export const CT_SHORT = 16;
/** Medium `CT` — Lv.3 magic, Cura/Curaga, Delay Attack, Demi, Drain, the elemental Whirls. */
export const CT_MEDIUM = 26;
/** Long `CT` — Excalibur, Full-Cure, Full-Life, Ultima, Flare, all four Reels, Mix, Great Whirl, Sword Dance. */
export const CT_LONG = 39;

/** Untagged baseline recovery, and the value the `RT` tag itself uses [ffx2-combat-core §1.4]. */
export const RT_NORMAL = 70;
/** `2xRT` — Trigger Happy, Sentinel, every Songstress Dance [ffx2-combat-core §1.4]. */
export const RT_DOUBLE = 140;

/** A `StatusApplication.duration` for a status the source tables flag `Infinite` [ffx2-combat-core §2.8]. */
export const DURATION_INFINITE = 255;
/** Raw 0-255 chance byte meaning "always applies, unless the target is immune" [types.ts `StatusApplication`]. */
export const CHANCE_ALWAYS = 254;
