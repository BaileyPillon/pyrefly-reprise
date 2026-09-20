/**
 * Onboarding: Auron's briefing and the first-use lines.
 *
 * Bailey's approved end state, picked 2026-09-20 from three mocked options
 * (`docs/concepts/onboarding/`): **C, Auron's briefing**. The three frames
 * under `c-aurons-briefing/` are registered as approved tiles in
 * `docs/target/targets.json` and are what this folder is built to.
 *
 * One import site per surface, so nothing here is a subsystem with no
 * importers (AGENTS.md hard rule 4):
 *
 * | surface | raised by |
 * |---|---|
 * | the briefing, on a first launch | `app/screens/BattleScreenFlow.ts` |
 * | the briefing, replayed | `app/screens/PauseScreen.ts`, `app/screens/TitleScreen.ts` |
 * | the first-use lines | `app/screens/BattleScreenWiring.ts` via {@link withCoach} |
 * | the switch and the seen-set | `app/SaveData.ts`, `debug/api.ts` |
 */

export { Briefing } from './Briefing.ts';
export type { BriefingOutcome, BriefingOptions } from './Briefing.ts';
export { CoachMark } from './CoachMark.ts';
export type { CoachMarkOutcome, CoachMarkOptions } from './CoachMark.ts';
export { withCoach, markForMenu, markForEvent } from './CoachLayer.ts';
export type { CoachLayerOptions } from './CoachLayer.ts';
export {
  ALL_COACH_IDS,
  ALL_MARKS,
  BRIEFING_LINES,
  BRIEFING_MS,
  BRIEFING_SPEAKER,
  FFX_MARKS,
  FFX2_MARKS,
  markById,
  marksFor,
  speakerFor,
} from './coachCopy.ts';
export type { CoachMarkId, BriefingLine } from './coachCopy.ts';
export {
  battleHelpOn,
  coachingAllowed,
  hasSeen,
  markAllSeen,
  markSeen,
  resetCoach,
  setBattleHelp,
  setCoachingEnabled,
  shouldShow,
} from './coachState.ts';
