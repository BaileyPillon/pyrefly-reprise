/**
 * **Short tips for the desktop prep card** (r75 fix pass, the driver's decision 219v item 5, under Bailey's delegation; review read MA-10 of release 74). The party prep's CHAPTER tab shows the chapter's TIP in a fixed band
 * (the briefing column, 120 grid px) that holds about five lines of it at 1600 x 900. A tip longer than that is cut mid-line until the player scrolls with PgDn. The pause screen's prose and the phone's stacked card have the
 * room and show `ChapterMeta.tip` whole; only the desktop card (from 600 px up) shows the short form here, when a chapter has one (`ui/common/chapterPanel.ts#tipHtml`, `{ prep: true }`).
 *
 * A short form uses only words of its chapter's own tip (rule 6: nothing is invented) and says the one thing the card must say that no other line on the screen does. Only the Fallen Maesters has one: **FFX-2 only**
 * (hidden Chapter 30). Every other chapter's card is what it was. `tests/unit/chapters/fallen-maesters-prep-tip.test.ts` pins the length against the band and the words against the tip.
 *
 * Pure data: no DOM, no `three`.
 */

import { FALLEN_MAESTERS_ID } from './fallen-maesters-ids.ts';

/** The desktop prep card's short tip, by chapter id. */
export const PREP_TIPS: Readonly<Record<string, string>> = {
  // The tip's other two sentences are on screen elsewhere (the glyph in the blurb and the handwritten line, Chac's stone in the in-battle guide) and stay in the full tip. 146 characters, five lines at 1600 x 900.
  [FALLEN_MAESTERS_ID]: 'Concherer’s shell breaks on one hit of about twenty thousand: Change Paine across The End’s red and green gates and back to the Dark Knight first.',
};

/** The short tip of chapter `id` for the desktop prep card, or undefined (the card shows the whole tip). */
export function prepTipFor(id: string): string | undefined {
  return Object.hasOwn(PREP_TIPS, id) ? PREP_TIPS[id] : undefined;
}
