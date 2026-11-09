/**
 * Pause-screen and prebattle-tab metadata for the hidden Wendigo chapter (FFX only; `./chapter-wendigo.ts`, 2026-11-06) [research/re-ffx-wendigo-lake-macalania.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Wendigo, the Guardians and the party's spells are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`WENDIGO_TEXT`).
 * - `quote` is a line Auron could say, our own words in his register (writing bible section 1.4: laconic, dry); the chapter's scenes carry no line (`../story/scripts/wendigo.ts`), so this one is the pause screen's alone.
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: bring it under half (where the arms begin), down both Guardians, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 4 and 6): no number in them.
 * - `heroArt` is Chapter VII's pause plate `pause/macalania` (the same snows), a stand-in; the chapter's own plate is owed. `snapshots`: the Temple's plate, the Guardian's painting and Rikku's idle (the steal).
 * - `musicKeys` are the cues the chapter plays: the Temple's bed, the stand-in boss cue and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { WENDIGO_TEXT } from './chapter-wendigo.ts';
import { LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID, WENDIGO_CHAPTER_ID } from './ffx/wendigo-ids.ts';

export const WENDIGO_META: ChapterMeta = {
  id: WENDIGO_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...WENDIGO_TEXT,
  location: 'Lake Macalania — the frozen lake',
  heroArt: 'pause/macalania',
  heroArtFallback: 'backdrops/macalania-temple.png',
  quote: { text: 'Do not trade blows with it. Weaken them first.', speaker: 'Auron' },
  handwritten: 'the fury, taken out',
  objectives: [
    { id: 'half', label: 'Bring Wendigo below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'guardians', label: 'Down both Guado Guardians', rule: { kind: 'parts-downed', targetIds: [LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID] } },
    { id: 'lake-crossed', label: 'Cross the lake', rule: { kind: 'victory' } },
  ],
  tip: 'Its blows can kill at a stroke. Break its Power, shield your own, and rob the Guardians before they can mend it. When its arms go up, send an aeon.',
  snapshots: [
    { image: 'backdrops/macalania-temple.png', caption: 'the ice, and what is on it' },
    { image: 'characters/guado-guardian/idle.png', caption: 'rob him first' },
    { image: 'characters/rikku/idle.png', caption: 'rob him first' },
  ],
  focalCharacterId: 'auron',
  musicKeys: ['scene-macalania-temple', 'boss-challenge', 'victory-ffx'],
};

export default WENDIGO_META;
