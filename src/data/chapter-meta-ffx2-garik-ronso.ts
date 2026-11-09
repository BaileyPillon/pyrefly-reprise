/**
 * Pause-screen and prebattle-tab metadata - **Garik Ronso**, the hidden chapter (`./chapter-ffx2-garik-ronso.ts`; FFX-2 only, 2026-11-07).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-garik-ronso.md` §2 and §3, the game's own scripts and rows): Bane Lance curses whoever wears Black Mage and keeps her in it (Curse blocks the
 *   Change command); Mighty Guard lights his whole side every seventh turn in the hostile fight; a Youth can be delayed, Garik cannot. The tip is the hostile fight's, the harder and the default; the TRUST tab says which fight is up.
 * - `quote` is Yuna's plea from the pre scene (`../story/scripts/ffx2-garik-ronso.ts`), our own.
 * - `objectives` hold for either fight: bring Garik below half (he has the most HP on the field), chain three hits, win.
 * - `heroArt` is the pause plate `pause/ffx2-garik-ronso` (release 79: the summit under Garik and the two Youths, a composite); `heroArtFallback` is Garik's own idle.
 * - `snapshots`: the Gagazet plate (the summit's stand-in), Garik's idle and the first Youth's.
 * - `musicKeys`: the field bed, the duel cue, the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { GARIK_RONSO_ID, GARIK_RONSO_TEXT } from './chapter-ffx2-garik-ronso.ts';

export const GARIK_RONSO_META: ChapterMeta = {
  id: GARIK_RONSO_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...GARIK_RONSO_TEXT,
  bossLine: 'Garik Ronso',
  heroArt: 'pause/ffx2-garik-ronso',
  heroArtFallback: 'characters/x2-garik-ronso/idle.png',
  quote: { text: 'No one here is your enemy.', speaker: 'Yuna' },
  handwritten: 'a lance, a curse, a mountain that remembers',
  objectives: [
    { id: 'garik-below-half', label: 'Bring Garik below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'three-hit-chain', label: 'Chain three hits', rule: { kind: 'chain-landed', count: 3 } },
    { id: 'defeat-garik', label: 'Defeat Garik', rule: { kind: 'victory' } },
  ],
  // Short enough for the prep card's tip box (about five lines at 1600 x 900): the guide card in battle carries the rest (the guard's cadence, the Youths).
  tip:
    'Do not wear Black Mage: his lance curses it and the dress stays on. Every seventh turn he guards his whole side, and a Dispel takes the guard off.',
  snapshots: [
    { image: 'backdrops/gagazet.png', caption: 'the summit, and the wind' },
    { image: 'characters/x2-garik-ronso/idle.png', caption: 'a lance across the path' },
    { image: 'characters/x2-ronso-youth-a/idle.png', caption: 'the Youths of his clan' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default GARIK_RONSO_META;
