/**
 * Pause-screen and prebattle-tab metadata for the hidden Dark Aeons chapter (FFX only; `./chapter-dark-aeons.ts`, 2026-11-06) [research/re-ffx-dark-aeons-six.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Dark Aeons are an International and HD addition to FFX.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`DARK_AEONS_TEXT`).
 * - `quote` is Yuna's one line in the pre scene (`src/story/scripts/dark-aeons.ts`, a draft for Bailey to read), our own words.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers, and none a number of the fights': send Dark Ifrit home (the second stop), reach the road to Gagazet (the sixth link), send the last of them home.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE six 3, 4 and 9): the gauge counts hit events, so fewer, heavier blows serve better, and an aeon sent in ahead of the Overdrive is the game's own answer.
 * - `heroArt` is the pause plate `pause/ch34-dark-aeons` (painted for this chapter, r76 art install: the six Dark Aeons gathered over the Gagazet plate by night; the driver's pick under Bailey's delegation, `docs/handoff/r76-art-install.md`); `heroArtFallback`, an existing approved plate of Mt. Gagazet, shows while a tree has not got it. `snapshots`:
 *   the mountain's plate and the chapter's own Dark Anima and Dark Bahamut idles (they replaced the player's Anima and Bahamut, which the Dark ones are recolours of).
 * - `musicKeys` are the cues the chapter plays: the mountain's bed, the stand-in boss cues and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { DARK_AEONS_TEXT } from './chapter-dark-aeons.ts';
import { DARK_AEONS_CHAPTER_ID, DARK_IFRIT_ID } from './ffx/dark-aeons-six-ids.ts';

export const DARK_AEONS_META: ChapterMeta = {
  id: DARK_AEONS_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...DARK_AEONS_TEXT,
  // The pause tab's own tagline (2 to 4 words) and blurb (two sentences), shorter than the card's.
  subtitle: 'The wrong colours',
  blurb: 'Yevon has dressed six aeons in the wrong colours and set one at every place the pilgrimage touched. Send each of them home.',
  location: 'Besaid to Mt. Gagazet, six stops',
  bossLine: 'Dark Valefor, Ifrit, Ixion, Shiva, Anima and Bahamut', // the first formation is only the first stop
  heroArt: 'pause/ch34-dark-aeons',
  heroArtFallback: 'backdrops/gagazet.png',
  quote: { text: 'Someone is calling them. Forcing them. I can feel it.', speaker: 'Yuna' },
  handwritten: 'few blows, heavy ones',
  objectives: [
    { id: 'ifrit-home', label: 'Send Dark Ifrit home', rule: { kind: 'parts-downed', targetIds: [DARK_IFRIT_ID] } },
    { id: 'road-to-gagazet', label: 'Reach the road to Gagazet', rule: { kind: 'link-reached', link: 6 } },
    { id: 'last-home', label: 'Send the last of them home', rule: { kind: 'victory' } },
  ],
  tip: 'Every blow fills their fury, and a full fury kills. Strike few and hard, keep Auto-Life on everyone, and send an aeon in ahead of the worst.',
  snapshots: [
    { image: 'backdrops/gagazet.png', caption: 'the road' },
    { image: 'characters/dark-anima/idle.png', caption: 'what waits at the foot of the mountain' },
    { image: 'characters/dark-bahamut/idle.png', caption: 'and the last of them' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-gagazet', 'boss-challenge', 'boss-yojimbo', 'victory-ffx'],
};

export default DARK_AEONS_META;
