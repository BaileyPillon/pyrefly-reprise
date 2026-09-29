/**
 * The comfort settings of OPTIONS accessibility A2 (D-285, PR-0032; Bailey,
 * 2026-09-29: "all your recommendations, full speed ahead"): TEXT SIZE,
 * REDUCE MOTION and LOW EFFECTS.
 *
 * `reduceMotion` and `lowEffects` are older than the rows that now show them.
 * `textSize` is new: a release-29 save has no such field, and the `...raw.settings`
 * spread in `SaveData.migrate` leaves the shipped default (100 %) in place, so the
 * upgrade needs no `SAVE_VERSION` bump (the `battleHelp` / `ffx2AtbSpeed` precedent,
 * `docs/plans/accessibility-review.md` §3.2). What this module adds is the
 * coercion: a stored value that is not one of the three sizes, or a flag that is
 * not a boolean, reads as the default instead of reaching the layout (CHK-024).
 * It coerces, it never decides: there is no one-time rule and no veteran rule.
 *
 * Its own module only because `SaveData.ts` is over the house line cap.
 *
 * Game case: both (shared plumbing: pause OPTIONS, SaveData, both games' HUDs).
 */

import type { Settings } from './SaveData.ts';

/** TEXT SIZE's three steps, smallest first: 100, 115 and 130 %. */
export const TEXT_SIZES = [1, 1.15, 1.3] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

/** True for exactly one of {@link TEXT_SIZES}. */
export function isTextSize(v: unknown): v is TextSize {
  return typeof v === 'number' && (TEXT_SIZES as readonly number[]).includes(v);
}

/** The step `dir` away from `current`, clamped at both ends (as TEXT SPEED is). */
export function stepTextSize(current: unknown, dir: 1 | -1): TextSize {
  const i = isTextSize(current) ? TEXT_SIZES.indexOf(current) : 0;
  return TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, Math.max(0, i + dir))] ?? 1;
}

/** The next size up, wrapping from 130 back to 100 % (Confirm and a tap on the row). */
export function wrapTextSize(current: unknown): TextSize {
  const i = isTextSize(current) ? TEXT_SIZES.indexOf(current) : -1;
  return TEXT_SIZES[(i + 1) % TEXT_SIZES.length] ?? 1;
}

/** "100%", "115%" or "130%": the row's value, as the mock prints it. */
export function textSizeLabel(v: unknown): string {
  return `${Math.round((isTextSize(v) ? v : 1) * 100)}%`;
}

/** Apply the rule to `settings` (already merged over `defaults`), in place. */
export function migrateComfort(settings: Settings, defaults: Readonly<Settings>): void {
  if (!isTextSize(settings.textSize)) settings.textSize = 1;
  if (typeof settings.reduceMotion !== 'boolean') settings.reduceMotion = defaults.reduceMotion;
  if (typeof settings.lowEffects !== 'boolean') settings.lowEffects = false;
}
