/**
 * The two settings the ACCESSIBILITY tab adds (PR-0032; Bailey, 2026-10-12, "OPT-B with NO-KEYS:
 * the accessibility tab", answered with "I'll go with all of your recommendations"): REDUCE FLASHES
 * and COLOUR VISION. Key remapping is not built.
 *
 * Both are new `Settings` fields, and both are additive: a save written before release 44 has
 * neither, the `...raw.settings` spread in `SaveData.migrate` leaves the shipped default in place
 * (REDUCE FLASHES off, COLOUR VISION off), and no `SAVE_VERSION` bump is needed (the `textSize`,
 * `battleHelp` and `ffx2AtbSpeed` precedent, `docs/plans/accessibility-review.md` section 3.2).
 * What this module adds is the coercion, as `saveComfort.ts` does for TEXT SIZE: a stored value that
 * is not one of the allowed ones reads as the default instead of reaching the layout (CHK-024). It
 * coerces; it has no one-time rule and no veteran rule. Both settings merge per key between two open
 * tabs (`saveMerge.ts` compares scalars), so a string and a boolean are safe there.
 *
 * Off is today: with both settings at their defaults nothing on screen, in the engine or in a
 * stylesheet changes (`tests/unit/access-off-is-today.test.ts` pins it).
 *
 * Save-data class (AGENTS.md "Release": `src/app/SaveData.ts`, settings schema).
 * Game case: both (shared plumbing; which flash sources and which colour groups belong to which game
 * is written where each is built: `engine/flashRules.ts`, `ui/common/colourVision.ts`).
 */

import type { Settings } from './SaveData.ts';

/** COLOUR VISION's values, in the order the row steps through them. `off` is today's colours. */
export const COLOUR_VISION_MODES = ['off', 'red-green', 'blue-yellow'] as const;
export type ColourVision = (typeof COLOUR_VISION_MODES)[number];

/** True for exactly one of {@link COLOUR_VISION_MODES}. */
export function isColourVision(v: unknown): v is ColourVision {
  return typeof v === 'string' && (COLOUR_VISION_MODES as readonly string[]).includes(v);
}

/** The row's value as the mock prints it: `OFF`, `RED-GREEN` or `BLUE-YELLOW`. Anything else reads `OFF`. */
export function colourVisionLabel(v: unknown): string {
  return (isColourVision(v) ? v : 'off').toUpperCase();
}

/** The mode `dir` steps from `current`, wrapping (Left, Right, Confirm and a tap all cycle, so a phone is never stuck). */
export function stepColourVision(current: unknown, dir: 1 | -1): ColourVision {
  const i = isColourVision(current) ? COLOUR_VISION_MODES.indexOf(current) : 0;
  return COLOUR_VISION_MODES[(i + dir + COLOUR_VISION_MODES.length) % COLOUR_VISION_MODES.length] ?? 'off';
}

/** What a missing or damaged blob reads as. */
export const ACCESS_DEFAULTS: Readonly<{ reduceFlashes: boolean; colourVision: ColourVision }> = Object.freeze({
  reduceFlashes: false,
  colourVision: 'off',
});

/** Apply the rule to `settings` (already merged over the defaults), in place. */
export function migrateAccess(settings: Settings): void {
  if (typeof settings.reduceFlashes !== 'boolean') settings.reduceFlashes = ACCESS_DEFAULTS.reduceFlashes;
  if (!isColourVision(settings.colourVision)) settings.colourVision = ACCESS_DEFAULTS.colourVision;
}
