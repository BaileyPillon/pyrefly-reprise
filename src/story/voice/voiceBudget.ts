/**
 * What a mid-battle beat may cost once its lines are spoken.
 *
 * A beat is capped at 8 s (a chain seam 26 s) so a fight is never held for long (`story/registry.ts`). A spoken line can outlast
 * its typed text, so a voiced beat is re-costed with the recorded lengths (`scriptDurationMs` with a `spokenMs`):
 *  - `fits`: the voiced beat is inside its budget; nothing changes;
 *  - `extended`: it passes the budget by no more than the allowance below. The runtime gives the beat its voiced length plus the usual
 *    grace (`midBattleDeadlineMs` with the voice) instead of cutting a sentence off, and the beat is listed in the ship report;
 *  - `over`: more than the allowance. The ship step refuses it; its lines stay text only (`voice-ship.mjs --mute`) or the script is
 *    shortened. A beat is never allowed to run past a hard cap with a voice still talking.
 * One module so the ship tool, the unit tests and the handoff all read the same numbers. Erasable-only TypeScript (the tools import it).
 *
 * Game case: both (shared plumbing); only FFX chapters have voiced beats today.
 */

import type { NarrateStep, SayStep } from '../dsl.ts';

/** How long one line needs to be held for its recorded voice (recording plus tail), or 0 when it is not spoken. */
export type SpokenMsFor = (step: SayStep | NarrateStep) => number;

/** How far a non-seam beat's voiced length may pass its 8 s budget and still be extended rather than refused. */
export const VOICED_EXTEND_MS = 3_000;
/** The same for a chain seam (26 s budget; the presenter abandons a script at 30 s, so a seam keeps less room). */
export const VOICED_EXTEND_SEAM_MS = 1_500;

export type BeatVerdict = 'fits' | 'extended' | 'over';

export function beatVerdict(voicedMs: number, budgetMs: number, seam: boolean): BeatVerdict {
  if (voicedMs <= budgetMs) return 'fits';
  return voicedMs <= budgetMs + (seam ? VOICED_EXTEND_SEAM_MS : VOICED_EXTEND_MS) ? 'extended' : 'over';
}
