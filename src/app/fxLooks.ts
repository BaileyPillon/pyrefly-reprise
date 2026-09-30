/**
 * Eye-candy D's three looks as settings (Bailey, 2026-09-29 ~23:45 EDT: "Ok yes I picked D so all 3
 * together however in the settings I want to be able to turn each one off. Default will be on.
 * Please."). One OPTIONS row per look, default ON:
 *
 * - `fxLight`, CINEMA LIGHT: option A, Golden-Hour Cinema (FFX's gold hour and FFX-2's pink hour are
 *   the same switch);
 * - `fxLiving`, LIVING PAINTINGS: option B;
 * - `fxSpectacle`, BATTLE SPECTACLE: option C, the spectacle combat effects.
 *
 * The fields are younger than every save in the wild. The `...raw.settings` spread in
 * `SaveData.migrate` leaves the shipped default (`true`) in place when a field is missing, so the
 * upgrade needs no `SAVE_VERSION` bump (the `textSize` / `battleHelp` precedent); what this module
 * adds is the coercion: a stored value that is not a boolean reads as `true` (CHK-024). It
 * coerces, it never decides.
 *
 * Pure: no DOM, no `three`. Game case: both (FFX and FFX-2 share the three switches; FF7 never
 * shows the rows and never draws eye candy).
 */

import type { FxOption } from '../engine/fx/EyeCandy.ts';

export interface FxLookSettings {
  /** CINEMA LIGHT: eye-candy D's option A (the golden or pink hour). */
  fxLight: boolean;
  /** LIVING PAINTINGS: eye-candy D's option B. */
  fxLiving: boolean;
  /** BATTLE SPECTACLE: eye-candy D's option C. */
  fxSpectacle: boolean;
}

export type FxLookField = keyof FxLookSettings;

/** Each settings field and the option it switches, in row order. */
export const FX_LOOK_ROWS: readonly { field: FxLookField; opt: FxOption; label: string }[] = [
  { field: 'fxLight', opt: 'a', label: 'CINEMA LIGHT' },
  { field: 'fxLiving', opt: 'b', label: 'LIVING PAINTINGS' },
  { field: 'fxSpectacle', opt: 'c', label: 'BATTLE SPECTACLE' },
];

/** Every look on: a new profile, and any save that never stored the fields. */
export function defaultFxLooks(): FxLookSettings {
  return { fxLight: true, fxLiving: true, fxSpectacle: true };
}

/** True for one of the three row ids. */
export function isFxLookField(id: string): id is FxLookField {
  return FX_LOOK_ROWS.some((r) => r.field === id);
}

/** Apply the rule to `settings` (already merged over the defaults), in place: a non-boolean reads as ON. */
export function migrateFxLooks(settings: Partial<Record<FxLookField, unknown>>): void {
  for (const { field } of FX_LOOK_ROWS) if (typeof settings[field] !== 'boolean') settings[field] = true;
}

/** The three switches as options (`a`, `b`, `c`); anything but an explicit `false` reads as ON. */
export function fxLooksOf(settings: Readonly<Partial<Record<FxLookField, unknown>>>): Record<FxOption, boolean> {
  return { a: settings.fxLight !== false, b: settings.fxLiving !== false, c: settings.fxSpectacle !== false };
}
