/**
 * Pause-screen and prebattle-tab metadata for the hidden Omega Ruins chapter (FFX only; `./chapter-omega-ruins.ts`, 2026-11-06) [research/re-ffx-omega-ultima-nemesis.md, research/writing-bible.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Ultima Weapon, Omega Weapon, Nemesis and the party's Auto-Life are FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`OMEGA_RUINS_TEXT`).
 * - `quote` is a line Yuna speaks in the second seam (`src/story/scripts/omega-ruins.ts`, a draft for Bailey to read), our own words in her register (writing bible section 1.3).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers: reach Omega Weapon (the first link falls), reach Nemesis, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 4 and 6): no number in them.
 * - `heroArt` is the pause plate `pause/ch43-omega-ruins` (painted in the r77 art install: the driver's pick, not Bailey's approval); `heroArtFallback`, the Cavern's plate, shows if it is missing. `snapshots`: the cavern's plate, Ultima Weapon's idle and Nemesis's.
 * - `musicKeys` are the cues the chapter plays: the Dome's bed, the two stand-in boss cues and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { OMEGA_RUINS_TEXT } from './chapter-omega-ruins.ts';
import { OMEGA_RUINS_CHAPTER_ID } from './ffx/omega-ruins-ids.ts';

export const OMEGA_RUINS_META: ChapterMeta = {
  id: OMEGA_RUINS_CHAPTER_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...OMEGA_RUINS_TEXT,
  location: 'The Omega Ruins',
  bossLine: 'Ultima Weapon, Omega Weapon and Nemesis', // the board card's BOSS row: the first formation is only Act I
  heroArt: 'pause/ch43-omega-ruins',
  heroArtFallback: 'backdrops/cavern-stolen-fayth.png',
  quote: { text: 'Its worst blows kill outright, so stand twice.', speaker: 'Yuna' },
  handwritten: 'stand twice; swing, never flourish',
  objectives: [
    { id: 'second-guardian', label: 'Reach Omega Weapon', rule: { kind: 'link-reached', link: 2 } },
    { id: 'last-creation', label: 'Reach Nemesis', rule: { kind: 'link-reached', link: 3 } },
    { id: 'ruins-quiet', label: 'Bring down the last creation', rule: { kind: 'victory' } },
  ],
  tip: 'Auto-Life on all three, always: Nemesis can wipe you in one turn. Swing and cast; Overdrives are punished.',
  snapshots: [
    { image: 'backdrops/cavern-stolen-fayth.png', caption: 'the ruins' },
    { image: 'characters/ultima-weapon/idle.png', caption: 'stand twice' },
    { image: 'characters/nemesis/idle.png', caption: 'the last creation' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-zanarkand-dome', 'boss-challenge', 'boss-yu-yevon', 'victory-ffx'],
};

export default OMEGA_RUINS_META;
