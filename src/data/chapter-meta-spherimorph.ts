/**
 * Pause-screen and prebattle-tab metadata for the hidden Spherimorph chapter (FFX only; `./chapter-spherimorph.ts`, 2026-11-06) [research/re-ffx-spherimorph.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Spherimorph, the spring and the party's spells are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`SPHERIMORPH_TEXT`).
 * - `quote` is a line Lulu speaks in the pre scene (`src/story/scripts/spherimorph.ts`, a draft for Bailey to read), our own words in her register (writing bible section 1.6: dry).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: bring it below three quarters, below half (where Press begins), and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 4 and 6): no number in them.
 * - `heroArt` is the pause plate `pause/ch41-spherimorph` (painted in the r77 art install: the driver's pick, not Bailey's approval); `heroArtFallback`, the Macalania Temple's plate, shows if it is missing. `snapshots`: the
 *   stage's plate, Spherimorph's own idle and Lulu's.
 * - `musicKeys` are the cues the chapter plays: the Macalania bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { SPHERIMORPH_TEXT } from './chapter-spherimorph.ts';
import { SPHERIMORPH_CHAPTER_ID } from './ffx/spherimorph-ids.ts';

export const SPHERIMORPH_META: ChapterMeta = {
  id: SPHERIMORPH_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...SPHERIMORPH_TEXT,
  location: 'Macalania Woods — the spring',
  heroArt: 'pause/ch41-spherimorph',
  heroArtFallback: 'backdrops/macalania-temple.png',
  quote: { text: 'It takes hurt from one element only. Find which.', speaker: 'Lulu' },
  handwritten: 'read the answer, cast its opposite',
  objectives: [
    { id: 'three-quarters', label: 'Bring it below three quarters', rule: { kind: 'boss-hp-below', fraction: 0.75 } },
    { id: 'half', label: 'Bring it below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'spring-quiet', label: 'Quiet the spring', rule: { kind: 'victory' } },
  ],
  tip: 'Hit it plain and read the spell it answers with. Cast the opposite. The wrong element only heals it.',
  snapshots: [
    { image: 'backdrops/macalania-temple.png', caption: 'the road to the temple' },
    { image: 'characters/spherimorph/idle.png', caption: 'read the answer' },
    { image: 'characters/lulu/idle.png', caption: 'cast the opposite' },
  ],
  focalCharacterId: 'lulu',
  musicKeys: ['scene-macalania-temple', 'boss-challenge', 'victory-ffx'],
};

export default SPHERIMORPH_META;
