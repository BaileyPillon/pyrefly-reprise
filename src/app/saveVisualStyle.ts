/**
 * The VISUAL STYLE choice of release 61 (Bailey, 2026-10-21 ~00:15 EDT, the conference demo build): the OPTIONS row "VISUAL STYLE: HD-2D / CLASSIC".
 *
 * His pick, verbatim: "Yes, an Options toggle (Recommended)" for OPTIONS getting VISUAL STYLE: HD-2D / Classic, the default HD-2D in the
 * chapters that have it (review PR-0493).
 *
 * - `'hd2d'` (the default) is release 60's behaviour: the bold HD-2D look (`engine/look/LookConfig.ts`, `CHAPTER_LOOKS`) is on in the two chapters
 *   authored for it, Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2), and every other chapter draws as it always did.
 * - `'classic'` is no look anywhere: every chapter draws the frame it drew before release 60, the same as the address switch `?look=off`.
 *
 * The address wins. A `?look=...` key in the address (any value, `off` included) is the address's word for the whole page and this setting is
 * not read (`LookState.applyChapterLook` does nothing unless the look is still automatic). The setting is read when a chapter's battle is set
 * up (`BattleScreen`), so a change made in the pause OPTIONS takes effect the next time a chapter starts.
 *
 * Stored in `Settings.visualStyle` (`SaveData.ts`), a field added WITHOUT a version bump: an older save has none, `SaveData.migrate` merges the
 * shipped default under the stored settings, and {@link migrateVisualStyle} makes anything that is not one of the two values (a hand-edited blob, a
 * value from a later build) read as the default (CHK-024). Nothing already stored is rewritten.
 *
 * Its own module because `SaveData.ts` is over the house line cap (the `saveFrontend.ts` and `saveComfort.ts` precedent).
 *
 * Game case: BOTH games, shared plumbing. The look is authored for exactly one chapter of each game (Chapter I FFX, Chapter IV FFX-2); the row
 * switches it for both and is dropped from the FF7 pause, whose chapter draws no look (`pause/panels.ts`, as EYE CANDY is).
 */

import type { Settings } from './SaveData.ts';

/** The two styles, in the order the row steps through them. The first is the default. */
export const VISUAL_STYLES = ['hd2d', 'classic'] as const;
export type VisualStyle = (typeof VISUAL_STYLES)[number];

/** What a save without the field, and every invalid value, reads as: release 60's look, on by default in the two chapters that have one. */
export const DEFAULT_VISUAL_STYLE: VisualStyle = 'hd2d';

/** What the OPTIONS row reads. */
export const VISUAL_STYLE_LABELS: Readonly<Record<VisualStyle, string>> = {
  hd2d: 'HD-2D',
  classic: 'CLASSIC',
};

/** True for exactly one of {@link VISUAL_STYLES}. */
export function isVisualStyle(v: unknown): v is VisualStyle {
  return typeof v === 'string' && (VISUAL_STYLES as readonly string[]).includes(v);
}

/** `v` when it names a style, the default otherwise. */
export function visualStyleOf(v: unknown): VisualStyle {
  return isVisualStyle(v) ? v : DEFAULT_VISUAL_STYLE;
}

/** The other style (the row is a two-way toggle: Left, Right and Confirm all flip it). */
export function flipVisualStyle(v: unknown): VisualStyle {
  return visualStyleOf(v) === 'hd2d' ? 'classic' : 'hd2d';
}

/** Apply the rule to `settings` (already merged over the defaults), in place: a value that is not one of the two reads as the default. */
export function migrateVisualStyle(settings: Settings): void {
  if (!isVisualStyle(settings.visualStyle)) settings.visualStyle = DEFAULT_VISUAL_STYLE;
}
