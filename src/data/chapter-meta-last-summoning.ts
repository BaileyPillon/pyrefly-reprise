/**
 * Pause-screen and prebattle-tab metadata for the hidden Last Summoning chapter (FFX only; `./chapter-last-summoning.ts`, Bailey 2026-10-15; built the same day)
 * [research/re-ffx-last-summoning.md, research/writing-bible.md section 3 E4].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The possession chain, the aeons and Yu Yevon are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`LAST_SUMMONING_TEXT`).
 * - `quote` is a line Yuna speaks in the pre scene (`src/story/scripts/last-summoning.ts`), our own words in her register (writing bible section 1.3: complete, unhurried, formal-plain).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: give up four aeons (the fourth link reached), meet Yu Yevon with nothing left to call (the ninth), and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 2, 5 and 6).
 * - `heroArt` is not made yet (`pause/ch28-last-summoning`, so the pause screen shows the fallback): `heroArtFallback` is Yu Yevon's approved portrait. `snapshots` are existing assets only.
 * - `musicKeys` are the cues the chapter plays: Dream's End's bed under the scenes, Yu Yevon's theme for every link, the FFX fanfare and the ending theme of the coda.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { LAST_SUMMONING_TEXT } from './chapter-last-summoning.ts';
import { LAST_SUMMONING_ID } from './ffx/last-summoning-ids.ts';

export const LAST_SUMMONING_META: ChapterMeta = {
  id: LAST_SUMMONING_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...LAST_SUMMONING_TEXT,
  location: "Inside Sin — Dream's End",
  heroArt: 'pause/ch28-last-summoning',
  heroArtFallback: 'portraits/yu-yevon.png',
  quote: { text: 'I am saying goodbye.', speaker: 'Yuna' },
  handwritten: 'the order is yours',
  objectives: [
    { id: 'half-given', label: 'Give up four aeons', rule: { kind: 'link-reached', link: 4 } },
    { id: 'nothing-left', label: 'Meet Yu Yevon with nothing left to call', rule: { kind: 'link-reached', link: 9 } },
    { id: 'end-chant', label: 'End the chanting', rule: { kind: 'victory' } },
  ],
  tip: 'Every aeon you still hold can be summoned: the one in front of you is already gone. Yojimbo is paid, not ordered, and the Sisters fire the Delta Attack when all three gauges are full.',
  snapshots: [
    { image: 'backdrops/dreams-end.png', caption: "dream's end" },
    { image: 'characters/yu-yevon/idle.png', caption: 'what takes them' },
    { image: 'characters/yojimbo/idle.png', caption: 'paid in advance' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-dreams-end', 'boss-yu-yevon', 'victory-ffx', 'ending-ffx'],
};

export default LAST_SUMMONING_META;
