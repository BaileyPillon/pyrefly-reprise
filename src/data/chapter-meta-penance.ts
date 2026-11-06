/**
 * Pause-screen and prebattle-tab metadata for the hidden Penance chapter (FFX only; `./chapter-penance.ts`, 2026-11-06) [research/re-ffx-penance.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Penance, its hands and the Celestial weapons are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`PENANCE_TEXT`).
 * - `quote` is a line Auron speaks in the pre scene (`src/story/scripts/penance.ts`, a draft for Bailey to read), our own words in his register (writing bible section 1.4: laconic, dry).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: take it past the change (a quarter of its life), bring it below half, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 4 to 6).
 * - `heroArt` is the pause plate `pause/ch35-penance` (**not painted yet**); `heroArtFallback`, Chapter VIII's deck plate, shows in its place. `snapshots`: the deck's plate and Tidus's idle (stand-ins until the chapter's
 *   own paintings exist).
 * - `musicKeys` are the cues the chapter plays: the Fahrenheit's bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { PENANCE_TEXT } from './chapter-penance.ts';
import { PENANCE_CHAPTER_ID } from './ffx/penance-ids.ts';

export const PENANCE_META: ChapterMeta = {
  id: PENANCE_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...PENANCE_TEXT,
  location: 'The Fahrenheit — the deck',
  heroArt: 'pause/ch35-penance',
  heroArtFallback: 'backdrops/evrae-airship-deck.png',
  quote: { text: 'Cut a hand down and it grows back.', speaker: 'Auron' },
  handwritten: 'one hand always down',
  objectives: [
    { id: 'the-split', label: 'Make it split', rule: { kind: 'boss-hp-below', fraction: 0.75 } },
    { id: 'half', label: 'Bring it below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'penance-done', label: 'Lay it to rest', rule: { kind: 'victory' } },
  ],
  tip: 'Never let both hands stand on its turn: it ends the fight in a breath. Cure what its blows break before the next one lands.',
  snapshots: [
    { image: 'backdrops/evrae-airship-deck.png', caption: 'the deck' },
    { image: 'characters/tidus/idle.png', caption: 'one hand down' },
    { image: 'characters/auron/idle.png', caption: 'keep walking' },
  ],
  focalCharacterId: 'auron',
  musicKeys: ['scene-fahrenheit', 'boss-challenge', 'victory-ffx'],
};

export default PENANCE_META;
