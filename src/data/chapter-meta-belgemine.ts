/**
 * Pause-screen and prebattle-tab metadata for the hidden Belgemine's Challenge chapter (FFX only; `./chapter-belgemine.ts`, 2026-11-09) [research/re-ffx-belgemine-aeon-duels.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Belgemine's duels are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`BELGEMINE_TEXT`), the subtitle and blurb shortened for the pause tab.
 * - `quote` is Belgemine's one line in the pre scene (`src/story/scripts/belgemine.ts`, a draft for Bailey to read), our own words in her register (a teasing old summoner), quoting nothing of the game's script.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers and none a number of the fights': win the first duel, reach the fifth, win the last.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE 3): each duel has a habit worth learning, and the card names the habit and not the numbers.
 * - `heroArt` is the Remiem stand-in (the Cavern of the Stolen Fayth's approved plate; the pause plate `pause/ch45-belgemine` is on the art list, owed); `snapshots`: the plate, Valefor's idle (the first duel) and Yuna's.
 * - `musicKeys` are the cues the chapter plays: the temple bed, the aeon contest's cue as a stand-in, the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { BELGEMINE_TEXT } from './chapter-belgemine.ts';
import { BELGEMINE_CHAPTER_ID, BELG_IDS } from './ffx/belgemine-ids.ts';

export const BELGEMINE_META: ChapterMeta = {
  id: BELGEMINE_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...BELGEMINE_TEXT,
  // The pause tab's own tagline (2 to 4 words) and blurb (two sentences), shorter than the card's.
  subtitle: 'Eight aeons, eight habits',
  blurb: 'Belgemine calls her aeons one at a time at the Remiem Temple. Answer each with one of yours, and learn what it will not forgive.',
  location: 'Remiem Temple',
  bossLine: 'Valefor, Ifrit, Ixion, Shiva, Bahamut, Yojimbo, Anima and the Magus Sisters', // the first formation is only the first duel
  heroArt: 'backdrops/cavern-stolen-fayth.png',
  heroArtFallback: 'backdrops/via-purifico.png',
  quote: { text: 'Come, child. Show me what you have learned.', speaker: 'Belgemine' },
  handwritten: 'every aeon has a habit',
  objectives: [
    { id: 'first-duel', label: 'Win the first duel', rule: { kind: 'parts-downed', targetIds: [BELG_IDS.valefor] } },
    { id: 'fifth-duel', label: 'Reach the fifth duel', rule: { kind: 'link-reached', link: 5 } },
    { id: 'last-duel', label: 'Win the last duel', rule: { kind: 'victory' } },
  ],
  tip: 'You cannot call the aeon she holds. Read each one: some punish a spell, some a blow, and one only wakes when it is struck. Shield before the great blows.',
  snapshots: [
    { image: 'backdrops/cavern-stolen-fayth.png', caption: 'the temple at Remiem' },
    { image: 'characters/valefor/idle.png', caption: 'she begins with the first' },
    { image: 'characters/yuna/idle.png', caption: 'and Yuna answers' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-macalania-temple', 'boss-isaaru', 'victory-ffx'],
};

export default BELGEMINE_META;
