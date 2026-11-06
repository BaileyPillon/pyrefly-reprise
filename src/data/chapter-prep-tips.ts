/**
 * **Short tips for the desktop prep card** (r75, the driver's decisions 219v item 5 and 220a, under Bailey's delegation; release 74 browser reads MA-10 and release 75 job TIP-1). The party prep's CHAPTER tab shows the chapter's TIP in a fixed
 * band (the briefing column, 120 grid px) that holds about five lines of it at 1600 x 900. A tip longer than that is cut mid-line until the player scrolls with PgDn. The pause screen's prose and the phone's stacked card have the
 * room and show `ChapterMeta.tip` whole; only the desktop card (from 600 px up) shows the short form here, when a chapter has one (`ui/common/chapterPanel.ts#tipHtml`, `{ prep: true }`).
 *
 * A short form uses only words of its chapter's own tip, in the tip's own order (rule 6: nothing is invented): it drops clauses and sentences, never rewrites them. It keeps what the card must say that no other line on the
 * screen does (the objectives above it already name "Soften the stone", "Cure the Poison that Kozuka leaves" and the like, so those clauses are the ones that go). **Ten chapters have one**, each chosen by a browser read, not by the
 * line model: the Fallen Maesters (FFX-2, hidden Chapter 30; release 74 MA-10, ten lines) and the nine chapters whose full tip TIP-1 read as cut mid-line at 1600 x 900 (`docs/handoff/r75-boss-art.md`): the **FFX** Seymour Natus, Seymour Omnis, Isaaru
 * and Mirror Aeons, and the **FFX-2** Fallen Aeons, Trema, the Den of Woe, the Experiment (hidden) and Tourist Trap (hidden). Every other chapter's card is what it was (a tip that the read showed fitting, Biran and Yenke among them, is untouched).
 * `tests/unit/chapters/fallen-maesters-prep-tip.test.ts` pins the Maesters' form and `tests/unit/chapters/prep-tip-short-forms.test.ts` pins the other nine: the length against the band, the words against the tip.
 *
 * Pure data: no DOM, no `three`.
 */

import { FALLEN_MAESTERS_ID } from './fallen-maesters-ids.ts';

/** The desktop prep card's short tip, by chapter id. */
export const PREP_TIPS: Readonly<Record<string, string>> = {
  // The tip's other two sentences are on screen elsewhere (the glyph in the blurb and the handwritten line, Chac's stone in the in-battle guide) and stay in the full tip. 146 characters, five lines at 1600 x 900.
  [FALLEN_MAESTERS_ID]: 'Concherer’s shell breaks on one hit of about twenty thousand: Change Paine across The End’s red and green gates and back to the Dark Knight first.',

  // The nine of TIP-1 (release 75). Each line is the chapter's own sentences with clauses taken out, in order; the character count and the lines the model gives at 1600 x 900 are in the comment.
  // FFX only. 162 characters, five lines. "Soften a stone guardian at once" is the first objective ("Soften the stone"). Tied to the `reflect` line of the Natus tip (`guides/natus-line.ts`): another line changes the full tip, and the words test says so.
  'seymour-natus': 'He has no Defense, so every swing lands in full. Haste only Tidus and Auron, send Bahamut alone, and have Rikku Reflect Natus so Mortibody’s Cura bounces off him.',
  // FFX-2 only. 154 characters, five lines. "that Pain leaves; its stat losses stay for the fight" stays in the full tip.
  'ffx2-fallen-aeons': 'Delta Attack needs all three Sisters standing: bring any one down and it is gone for good. Against Anima, a Remedy clears the Silence, Darkness and Itchy.',
  // FFX only. 137 characters, five lines. "Each disc casts its own colour at him" is the opening clause of the full tip, and goes.
  'seymour-omnis':'Three or four of one colour make his spells -ga. Hit a disc to turn it, Nul the colour he shows most, and heal above 4,000 before Ultima.',
  // FFX-2 only. 158 characters, five lines. The list of what does not stick (": no status, no stat change, no Gravity") stays in the full tip; the Meteor warning is the objective's how ("Survive Meteor").
  'ffx2-trema': 'Nothing sticks to Trema. When his HP falls below a half, and again below a quarter, Meteor comes down on the party, so be healed before you cross those lines.',
  // FFX only. 132 characters, five lines. "One you lose stays down for the rest of the contest" stays in the full tip.
  'isaaru-via-purifico': "Only an aeon can fight his, and never the same aeon he has out. Shield when Grothia's gauge is full and when Spathi's count reads 1.",
  // FFX-2 only. 148 characters, five lines. Baralai's count and Nooj's Lightfall are the two things that can end the run; "nothing heals between the three shades", Lightfall's 5,000 and when it falls stay in the full tip.
  'ffx2-den-of-woe': 'Baralai counts every blow and at eight hits back for three quarters of max HP. Nooj calls down Lightfall: time a Hero Drink so a girl is Invincible.',
  // FFX only. 140 characters, five lines. "Two sisters, no joint attack, and every fallen member costs a Phoenix Down" (what "heal early" is for) stays in the full tip.
  'mirror-aeons': "Heal early, and use spells on Mindy, whom no blade can find. In the cavern, Cheer first and call Yuna's Yojimbo in before his blade is full.",
  // FFX-2 only (hidden, the Experiment). 121 characters, four lines: this card's first objective wraps to two lines, so its band holds four, not five. "and settle your healing" stays in the full tip.
  'ffx2-masterpiece-theatre': 'Act I is a warm-up: raise Protect. Act II hits hard and shrugs off swings, so use Darkness and keep a Phoenix Down ready.',
  // FFX-2 only (hidden, Tourist Trap). 145 characters, five lines. "and cure the Poison his Kozuka leaves" is the first objective ("Cure the Poison that Kozuka leaves") and stays in the full tip.
  'ffx2-tourist-trap': 'Yojimbo keeps a count, and when it is full he takes the whole party down to one HP, about seven attacks in. Keep a heal ready for the turn after.',
};

/** The short tip of chapter `id` for the desktop prep card, or undefined (the card shows the whole tip). */
export function prepTipFor(id: string): string | undefined {
  return Object.hasOwn(PREP_TIPS, id) ? PREP_TIPS[id] : undefined;
}
