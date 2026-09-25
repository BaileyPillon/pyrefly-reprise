/**
 * Pause-screen and prebattle-tab metadata — Chapter XII, Seymour Omnis, in the Garden of Pain
 * inside Sin (FFX) [research/ffx-seymour-omnis.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, aeons, Nul spells; *X-2* has no Seymour
 * fight (research §0.3). Nothing here is true of an FFX-2 chapter.
 *
 * - `title` "Seymour Omnis", `location` "Inside Sin — the Garden of Pain", numeral XII: B1
 *   (picked), as the registered record has them (`./chapter-seymour-omnis.ts`).
 * - `subtitle`, `blurb`, `handwritten` and `tip` are our own words over the research's sourced
 *   facts (§8.2 beats 3-5; §4.1 the four spells, one disc each, verified: 4 sources; §4.2 the
 *   affinity ladder, verified: 5 sources; §4.4 the glow, Dispel and Ultima, verified: 4-5
 *   sources). None of them names the ring order or the reset cycle, the two estimates B8 holds
 *   the listing on, so every line stays true whatever Bailey confirms.
 * - `quote` is line 9 of `docs/plans/omnis-story-draft.md`, an `[ORIGINAL]` line in Seymour's
 *   voice (writing-bible §1.9), and the line the pre scene (`src/story/scripts/seymour-omnis.ts`)
 *   actually plays.
 * - `heroArt` is the installed hero plate A (`pause/ch12-seymour-omnis`, Bailey's pick of
 *   2026-09-25, locked; `docs/concepts/chapters/omnis/INSTALLED.md`). `heroArtFallback` is his
 *   approved Omnis speaker portrait (portrait A, locked), shown only if the plate is missing.
 * - `objectives` follow research §5 row 6 (survive Ultima), §4.4 (below 20,000 his counter
 *   drops to 3) and the win. The choice of rows is **ours**; each rule is one the evaluator in
 *   `src/ui/common/chapterObjectives.ts` already answers.
 * - `snapshots` are the installed, LOCKED art: the O-3 C plate, the O-1 A cast and the O-2 B disc.
 * - `musicKeys` are the cues the chapter plays (`./chapter-omnis-ship.ts`): the stand-in scene
 *   cue, B18's stand-in battle cue and the FFX fanfare.
 *
 * **Unlisted**: it sits in `./chapter-meta.ts`'s `UNLISTED_CHAPTER_META`, as the chapter sits in
 * `UNLISTED_CHAPTERS` (B8).
 */

import type { ChapterMeta } from './chapter-meta.ts';

/** Chapter XII — Seymour Omnis, at the top of the steps in the Garden of Pain. */
export const SEYMOUR_OMNIS_META: ChapterMeta = {
  id: 'seymour-omnis',
  gameLabel: 'FFX',
  numeral: 'XII',
  title: 'Seymour Omnis',
  subtitle: 'The Last of Him',
  location: 'Inside Sin — the Garden of Pain',
  blurb:
    'Sin took him in, and he waits at the top of the steps to say it chose him. ' +
    'Four discs turn behind him and decide every spell he casts; this time, Yuna means to send him.',
  heroArt: 'pause/ch12-seymour-omnis',
  heroArtFallback: 'portraits/seymour-omnis.png',
  quote: {
    text: "Your death is your father's life. Come and pay it.",
    speaker: 'Seymour',
  },
  handwritten: 'the discs choose his spells',
  objectives: [
    {
      // §5 row 6 [verified: 4 sources]: after the glow comes Dispel, then Ultima on the whole party.
      id: 'survive-ultima',
      label: 'Survive Ultima',
      rule: { kind: 'survived-ability', ability: 'omnis-ultima' },
    },
    {
      // §4.4 [verified: 4 sources]: below 20,000 of his 80,000 HP, three attacks light the glow, not six.
      id: 'below-20000',
      label: 'Wear him below 20,000',
      rule: { kind: 'boss-hp-below', fraction: 0.25 },
    },
    {
      id: 'defeat-seymour-omnis',
      label: 'Defeat Seymour Omnis',
      rule: { kind: 'victory' },
    },
  ],
  tip:
    'Each disc casts its own colour at him, and three or four of one colour make his spells -ga. ' +
    'Hit a disc to turn it, Nul the colour he shows most, and heal above 4,000 before Ultima.',
  snapshots: [
    { image: 'backdrops/garden-of-pain.png', caption: 'the steps, inside Sin' },
    { image: 'characters/seymour-omnis/cast.png', caption: 'the last of him' },
    { image: 'characters/mortiphasm/idle.png', caption: 'four colours, one disc' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-dreams-end', 'boss-seymour', 'victory-ffx'],
};

export default SEYMOUR_OMNIS_META;
