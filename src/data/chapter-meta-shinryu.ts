/**
 * Pause-screen and prebattle-tab metadata for the hidden Shinryu chapter (FFX only; `./chapter-shinryu.ts`, 2026-11-07) [research/re-ffx-shinryu.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`SHINRYU_TEXT`).
 * - `quote` is Wakka's callout line at the first Eraser (`src/story/scripts/shinryu.ts`, a draft for Bailey to read), our own words.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: take a quarter off it, bring it below half, and the win. The preflight's segmented boss bar (SH7, option A) is an owed option, not built.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE 0 and 2): the Eraser's Petrify is a shatter in this water, and every wound it feels is answered.
 * - `heroArt` is the pause plate `pause/ch48-shinryu` (release 79: Shinryu over the flooded Via Purifico plate, a composite); `heroArtFallback`, an existing approved plate of the Via Purifico, shows if it is missing.
 * - `snapshots` are the plate, Shinryu's idle and Tidus's idle.
 * - `musicKeys` are the cues the chapter plays: the bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { SHINRYU_TEXT } from './chapter-shinryu.ts';
import { SHINRYU_CHAPTER_ID } from './ffx/shinryu-ids.ts';

export const SHINRYU_META: ChapterMeta = {
  id: SHINRYU_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...SHINRYU_TEXT,
  location: 'The Monster Arena — deep water',
  heroArt: 'pause/ch48-shinryu',
  heroArtFallback: 'backdrops/via-purifico.png',
  quote: { text: 'It points! Whoever it picks, the water breaks!', speaker: 'Wakka' },
  handwritten: 'end it before it points twice', // the Eraser is used only while more than one swimmer lives, so it points at most twice (RE 2; `shinryu-engine.test.ts`): never "the third"
  objectives: [
    { id: 'quarter', label: 'Take a quarter off it', rule: { kind: 'boss-hp-below', fraction: 0.75 } },
    { id: 'half', label: 'Bring it below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'shinryu-done', label: 'Lay the dragon to rest', rule: { kind: 'victory' } },
  ],
  tip: 'Strike fast. Its Eraser turns a swimmer to stone, and in this water stone shatters. It claws back at every wound, so keep the party healed.',
  snapshots: [
    { image: 'backdrops/via-purifico-flooded-3.png', caption: 'the water above the arena' },
    { image: 'characters/shinryu/idle.png', caption: 'what waits below' },
    { image: 'characters/tidus/idle.png', caption: 'one of three who can swim' },
  ],
  focalCharacterId: 'tidus',
  musicKeys: ['scene-gagazet', 'boss-challenge', 'victory-ffx'],
};

export default SHINRYU_META;
