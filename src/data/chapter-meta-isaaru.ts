/**
 * Pause-screen and prebattle-tab metadata — Chapter XIV, Isaaru, in the last
 * chamber of the Via Purifico beneath Bevelle (FFX) [research/ffx-isaaru-bevelle.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Yuna alone with her aeons, the
 * mirror lock, CTB and Shield; in FFX-2 Isaaru is a tour guide and nobody
 * summons.
 *
 * - `title` "Isaaru", `location` "Via Purifico — beneath Bevelle": B1 (picked,
 *   D-147), as the record has them.
 * - `blurb` is the record's own; `subtitle` is the record's trimmed to the pause
 *   card's 2-4 word tagline at the listing; `handwritten` and `tip` are
 *   our words over the research's sourced facts: only aeons can fight his
 *   aeons and the mirror lock (§1.2, `[verified: 2 sources]`), a KO'd aeon
 *   stays down (§1.2, `[derived]`), Grothia opens with a full gauge (§4.1,
 *   `[single source: wiki]`), Shield before Mega Flare (§4.3, `[verified: 3
 *   sources]`).
 * - `quote` is line 12 of `docs/plans/isaaru-story-draft.md`, an `[ORIGINAL]`
 *   line in Isaaru's voice, which the pre scene plays
 *   (`src/story/scripts/ffx-isaaru.ts`).
 * - `heroArt` is the installed hero plate B (`pause/ch14-isaaru-via-purifico`,
 *   D-155; `docs/concepts/chapters/isaaru/INSTALLED.md` "Hero plate installed":
 *   "its `ChapterMeta` names" it). `heroArtFallback` is Yuna's approved
 *   portrait, the chapter's focal character (she fights alone).
 * - `objectives` are three sourced moments: Hellfire on the first turn with an
 *   aeon out (§4.1), Mega Flare at the end of Spathi's count (§4.3), and the
 *   win. The choice of rows is ours; each rule is one the evaluator in
 *   `src/ui/common/chapterObjectives.ts` already answers.
 * - `snapshots` are the installed, judge-locked art (B22): the O-3 A plate,
 *   Isaaru's O-1 A idle, and Spathi (the Bahamut painting with his O-4 C mark).
 * - `musicKeys` are the cues the chapter plays: `scene-gagazet` and
 *   `boss-yojimbo`, both stand-ins until B21's "Still Water" is sketched and
 *   picked by ear (rule 13), and the shared `victory-ffx` fanfare.
 *
 * **Listed** 2026-09-25 with the chapter itself: it sits in `./chapter-meta.ts`'s
 * `CHAPTER_META` after Chapter XIII's, as the chapter sits after Chapter XIII in `CHAPTERS`.
 */

import type { ChapterMeta } from './chapter-meta.ts';

/** Chapter XIV — Isaaru, the last chamber of the Via Purifico. */
export const ISAARU_META: ChapterMeta = {
  id: 'isaaru-via-purifico',
  gameLabel: 'FFX',
  numeral: 'XIV',
  title: 'Isaaru',
  subtitle: 'Summoner Against Summoner',
  location: 'Via Purifico — beneath Bevelle',
  blurb:
    'At the way out of the prison, Isaaru waits under orders to stop her. ' +
    'Yuna stands alone, and only her aeons can answer his.',
  heroArt: 'pause/ch14-isaaru-via-purifico',
  heroArtFallback: 'portraits/yuna.png',
  quote: { text: 'I know what the temple says. For me, that is enough.', speaker: 'Isaaru' },
  handwritten: 'three aeons, one fayth each',
  objectives: [
    {
      // §4.1 [single source: wiki]: Grothia opens with a full gauge, so his first turn with an aeon out is Hellfire.
      id: 'survive-hellfire',
      label: 'Survive Hellfire',
      rule: { kind: 'survived-ability', ability: 'grothia-hellfire' },
    },
    {
      // §4.3 [verified: 3 sources]: Spathi counts down from five, then Mega Flare.
      id: 'survive-mega-flare',
      label: 'Survive Mega Flare',
      rule: { kind: 'survived-ability', ability: 'spathi-mega-flare' },
    },
    { id: 'defeat-isaaru', label: 'Win the contest', rule: { kind: 'victory' } },
  ],
  tip:
    'Only an aeon can fight his, and never the same aeon he has out. One you lose stays down for the rest of the contest. ' +
    "Shield when Grothia's gauge is full and when Spathi's count reads 1.",
  snapshots: [
    { image: 'backdrops/via-purifico.png', caption: 'the last chamber, red light' },
    { image: 'characters/isaaru/idle.png', caption: 'Isaaru, on the temple’s word' },
    { image: 'characters/spathi/idle.png', caption: 'his Bahamut, counting' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-gagazet', 'boss-yojimbo', 'victory-ffx'],
};

export default ISAARU_META;
