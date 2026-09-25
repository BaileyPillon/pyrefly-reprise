/**
 * **The Wait split's habit, one RULES bullet for the FFX-2 guides** (decision sheet 2026-09-25
 * item 3, option C with D; critic round 12 PR-0076). Bailey, 2026-09-25 ~11:00 EDT: *"I'll go with
 * all your recommendations"*. **FFX-2 only** [AGENTS.md rule 14]: FFX is CTB and has no clock
 * under a menu.
 *
 * `research/ffx2-combat-core.md` §1.5, Wait `[single source]`: *"Time runs while the top-level
 * Main Command Window is open, but freezes the moment any submenu is entered."* Measured on
 * 5be4babe under the split (critic round 12 §3; sheet item 3): Chapter V won 39 of 40 when a list
 * was opened within a quarter second, 31 within half a second, and 7 at a second.
 *
 * The text is the sheet's draft, verbatim ("in D-121's words"). **Open for Bailey:** D-136
 * (2026-09-25, his *"Calling the command menu a list a little weird don't you think?"*) moved the
 * coach lines off "list" for the command menu, and "the top list" is that menu; a D-136-style
 * wording is offered in the handoff (`docs/handoff/ffx2-menu-0925.md`). Shown first, and only under
 * Wait's split (`ChapterGuide.clockRules.wait`): under Active the clock runs in a list too, and
 * under the old whole-menu hold (`?wait=hold`) the top list holds.
 */

import type { GuideRule } from './types.ts';

export const WAIT_SPLIT_HABIT_RULE: GuideRule = {
  text: 'Open a list at once. On the top list, the clock still runs.',
  short: 'Open a list at once',
  cite: 'ffx2-combat-core §1.5',
};
