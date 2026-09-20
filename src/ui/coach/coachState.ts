/**
 * Who has been taught what, and whether anybody is being taught at all.
 *
 * Every onboarding surface asks this module two questions — *is help on?* and
 * *has this one been shown?* — and tells it one thing: *it has now*. Nothing
 * else in `src/ui/coach/` touches the save file.
 *
 * ## Three places the answer can come from
 *
 * 1. **The save file**, through `activeSave()`. The normal case.
 * 2. **This session only**, when there is no save file to write to. A private
 *    window, blocked site data, a test double: `SaveStore` falls back to an
 *    in-memory blob that is thrown away on navigation, which would replay the
 *    briefing on every page load. The module-level {@link sessionSeen} set
 *    means it plays **once per session** instead
 *    (`docs/plans/onboarding-review.md` REQUIRED 7, last sentence).
 * 3. **Suppressed outright**, by `?coach=off` in the URL or by
 *    `__pyrefly.setCoaching(false)`. Playwright specs, `tools/screenshot.mjs`,
 *    the art-watch gallery and every Part C composite boot on a fresh browser
 *    profile, which is exactly the first-launch condition — without a way to
 *    turn the feature off it would front every capture and poison its own
 *    evidence (REQUIRED 8, `critic/CHECKS.md` CHK-016).
 *
 * Game-aware: **both**. This is the shared plumbing behind an FFX line and an
 * FFX-2 line alike (CHK-020); nothing here knows which game is playing.
 */

import { activeSave } from '../../app/SaveData.ts';
import { ALL_COACH_IDS, type CoachMarkId } from './coachCopy.ts';

/**
 * Ids shown in this browsing session when there is no save file behind us.
 *
 * Deliberately module-level and deliberately not exported: it is the memory a
 * private window has instead of a save, and clearing it is {@link resetCoach}'s
 * job, not a caller's.
 */
const sessionSeen = new Set<string>();

/** Set by {@link setCoachingEnabled}; `null` means "nobody has overridden it". */
let override: boolean | null = null;

/** Read once per call so a test can change the URL between cases. */
function urlSaysOff(): boolean {
  try {
    const search = globalThis.location?.search ?? '';
    if (!search) return false;
    const v = new URLSearchParams(search).get('coach');
    return v === 'off' || v === '0' || v === 'false';
  } catch {
    return false;
  }
}

/**
 * Turn every onboarding surface off (or back on) for this page.
 *
 * The harness hook. `false` suppresses the briefing and every first-use line
 * without touching the save file, so a capture run leaves no trace in the
 * player's own progress.
 */
export function setCoachingEnabled(on: boolean | null): void {
  override = on;
}

/** Is any coaching allowed on this page at all? */
export function coachingAllowed(): boolean {
  if (override !== null) return override;
  if (urlSaysOff()) return false;
  const save = activeSave();
  // No store yet (a HUD mounted in a unit test, a mock screen) falls back to
  // the shipped default, which is on — the same rule `readSetting` uses.
  return save ? save.settings.battleHelp : true;
}

/**
 * The player-facing switch, on its own.
 *
 * Separate from {@link coachingAllowed} because the pause row has to print what
 * *the player* chose, not what a capture harness forced. A spec booted with
 * `?coach=off` still shows BATTLE HELP as ON if that is what the save says.
 */
export function battleHelpOn(): boolean {
  const save = activeSave();
  return save ? save.settings.battleHelp : true;
}

/** Write the player's own switch. Persists immediately. */
export function setBattleHelp(on: boolean): void {
  activeSave()?.setSettings({ battleHelp: on });
}

/** Has this surface already been shown to this player? */
export function hasSeen(id: CoachMarkId | string): boolean {
  const save = activeSave();
  if (save) return save.hasSeenCoach(id);
  return sessionSeen.has(id);
}

/**
 * Record one surface as shown.
 *
 * Always writes to the session set as well as the save, so a store whose
 * `localStorage.setItem` throws (quota, a locked-down profile) still does not
 * repeat itself inside one session.
 */
export function markSeen(id: CoachMarkId | string): void {
  sessionSeen.add(id);
  activeSave()?.markCoachSeen(id);
}

/**
 * Should this surface be shown right now?
 *
 * One call, so no caller can get the order of the three checks wrong.
 */
export function shouldShow(id: CoachMarkId | string): boolean {
  return coachingAllowed() && !hasSeen(id);
}

/** Mark every surface seen — what `__pyrefly.markCoachSeen()` does with no id. */
export function markAllSeen(): void {
  for (const id of ALL_COACH_IDS) markSeen(id);
}

/**
 * Forget everything, for a test and for the debug API.
 *
 * Does **not** clear the save's own list unless a store is present; the session
 * set is always cleared so a jsdom test file starts from a known state.
 */
export function resetCoach(): void {
  sessionSeen.clear();
  override = null;
}
