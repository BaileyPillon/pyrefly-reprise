/**
 * Pause-screen and prebattle-tab metadata for the hidden Flooded Ways chapter (FFX only; `./chapter-flooded-ways.ts`, 2026-11-06) [research/re-ffx-geosgaeno-evrae-altana.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`FLOODED_WAYS_TEXT`), the pause tab's tagline and blurb shorter.
 * - `quote` is Wakka's one line in the pre scene (`src/story/scripts/flooded-ways.ts`, a draft for Bailey to read), our own words.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers, and none a number of the fights': carry on to the second area (the second link), reach the Baaj Temple (the fourth link), end the
 *   chapter on a victory.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE 2.2, 4.1, 4.3): stone breaks in the water, the dead take damage from healing, and the swallowed one can strike back from inside.
 * - `heroArt` is the pause plate `pause/ch36-flooded-ways` (not made yet: the art list in the handoff); `heroArtFallback`, an existing approved plate of the Via Purifico, shows meanwhile.
 * - `musicKeys` are the cues the chapter plays: the bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FLOODED_WAYS_TEXT } from './chapter-flooded-ways.ts';
import { FLOODED_WAYS_CHAPTER_ID } from './ffx/flooded-ways-ids.ts';

export const FLOODED_WAYS_META: ChapterMeta = {
  id: FLOODED_WAYS_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...FLOODED_WAYS_TEXT,
  subtitle: 'The three who can swim',
  blurb: 'A dead Evrae guards the flooded gates of the Via Purifico, and something in a temple under the sea swallows one of you whole. Stone breaks in the water.',
  location: 'The Via Purifico and the Baaj Temple',
  bossLine: 'Evrae Altana, then Geosgaeno',
  heroArt: 'pause/ch36-flooded-ways',
  heroArtFallback: 'backdrops/via-purifico.png',
  quote: { text: "Don't let it look at you, brudda. Stone and water do not mix, ya.", speaker: 'Wakka' },
  handwritten: 'two Phoenix Downs end the dead one',
  objectives: [
    { id: 'second-area', label: 'Carry on to the second gate', rule: { kind: 'link-reached', link: 2 } },
    { id: 'baaj-temple', label: 'Reach the Baaj Temple', rule: { kind: 'link-reached', link: 4 } },
    { id: 'last-home', label: 'Send Geosgaeno home', rule: { kind: 'victory' } },
  ],
  tip: 'In the water a gaze that lands shatters its victim: only Rikku wears a ward. Healing hurts the dead one. Swallowed? Strike from inside, or the spit-out falls on all three.',
  snapshots: [
    { image: 'backdrops/via-purifico.png', caption: 'the flooded way' },
    { image: 'characters/evrae/idle.png', caption: 'what guards the gates' },
    { image: 'characters/rikku/idle.png', caption: 'and one who swims faster than the rest' },
  ],
  focalCharacterId: 'rikku',
  musicKeys: ['scene-gagazet', 'battle-ffx', 'victory-ffx'],
};

export default FLOODED_WAYS_META;
