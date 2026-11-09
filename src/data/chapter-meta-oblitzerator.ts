/**
 * Pause-screen and prebattle-tab metadata for the hidden Oblitzerator chapter (FFX only; `./chapter-oblitzerator.ts`, 2026-11-09) [research/re-ffx-oblitzerator-crane.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Oblitzerator, the Luca crane and the party's spells are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`OBLITZERATOR_TEXT`).
 * - `quote` is a line Lulu could say, our own words in her register (writing bible section 1.6: dry); the pre scene (`../story/scripts/oblitzerator.ts`, a draft for Bailey to read) carries the chapter's lines.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: live through a Blitzball Rush, bring the machine under a third of its HP (where it speeds up), and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 4 and 6): no number in them.
 * - `heroArt` is the pause plate `pause/ch50-oblitzerator` (not painted: a stand-in); `heroArtFallback`, the coast road's plate this stage is drawn on, shows. `snapshots`: that plate, Lulu's idle (the Thunder) and Tidus's (the crane).
 * - `musicKeys` are the cues the chapter plays: the coast bed, the stand-in battle cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { OBLITZERATOR_TEXT } from './chapter-oblitzerator.ts';
import { OBLITZERATOR_CHAPTER_ID } from './ffx/oblitzerator-ids.ts';

export const OBLITZERATOR_META: ChapterMeta = {
  id: OBLITZERATOR_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...OBLITZERATOR_TEXT,
  location: 'Luca — the Number 4 Dock',
  heroArt: 'pause/ch50-oblitzerator',
  heroArtFallback: 'backdrops/mushroom-rock-road.png',
  quote: { text: 'It answers every blow. The crane answers only Thunder.', speaker: 'Lulu' },
  handwritten: 'give the crane its power',
  objectives: [
    { id: 'rush', label: 'Live through a Blitzball Rush', rule: { kind: 'survived-ability', ability: 'blitzball-rush' } },
    { id: 'third', label: 'Bring the machine under a third', rule: { kind: 'boss-hp-below', fraction: 0.33 } },
    { id: 'dock-clear', label: 'Clear the dock', rule: { kind: 'victory' } },
  ],
  tip: 'Cast Thunder at the crane, three times. When it wakes, Tidus can use it. Every spell and every blow at the machine draws a ball back, one time in three.',
  snapshots: [
    { image: 'backdrops/mushroom-rock-road.png', caption: 'the dock, such as it is' },
    { image: 'characters/lulu/idle.png', caption: 'Thunder, at the crane' },
    { image: 'characters/tidus/idle.png', caption: 'then use it' },
  ],
  focalCharacterId: 'lulu',
  musicKeys: ['scene-gagazet', 'battle-ffx', 'victory-ffx'],
};

export default OBLITZERATOR_META;
