/**
 * Pause-screen and prebattle-tab metadata - **The Farplane Cup**, the hidden chapter (`./chapter-ffx2-farplane-cup.ts`; FFX-2 only, Bailey 2026-11-06).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-farplane-cup.md` §6 and §7, the game's own scripts and move rows): the second duelist keeps himself hasted and Dispel strips it; Seymour
 *   absorbs Fire, Ice, Thunder, Water and Gravity, so the girls' elemental spells heal him, and Darkness is not elemental. The tip is one sentence short enough to need no short form on the desktop card (a line model of the band).
 * - `quote` is Paine's line from the opening scene (`../story/scripts/ffx2-farplane-cup.ts`), our own.
 * - `objectives`: get past Auron (duel 2 reached), get past the second duelist (duel 3 reached, his name still masked), the win.
 * - `heroArt` is the pause plate `pause/ffx2-farplane-cup` (no painting yet: the Den of Woe's plate is the `heroArtFallback`, which the stage uses too).
 * - `snapshots`: the Den of Woe's plate (the stand-in stage), Auron's idle (the first duelist) and Paine's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the superboss cue (a flagged stand-in), the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FARPLANE_CUP_ID, FARPLANE_CUP_TEXT } from './chapter-ffx2-farplane-cup.ts';

export const FARPLANE_CUP_META: ChapterMeta = {
  id: FARPLANE_CUP_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...FARPLANE_CUP_TEXT,
  heroArt: 'pause/ffx2-farplane-cup', // no painting yet: the fallback below shows
  heroArtFallback: 'backdrops/den-of-woe.png',
  quote: { text: 'The first one carries a sword.', speaker: 'Paine' },
  handwritten: 'three names on a door. no rounds',
  objectives: [
    { id: 'get-past-auron', label: 'Get past Auron', rule: { kind: 'link-reached', link: 2 } },
    { id: 'get-past-the-hidden-duelist', label: 'Get past the hidden duelist', rule: { kind: 'link-reached', link: 3 } },
    { id: 'defeat-seymour', label: 'Defeat Seymour', rule: { kind: 'victory' } },
  ],
  // One short sentence: it needs no short form for the desktop prep card (the Fallen Maesters' ten-line tip did, `./chapter-prep-tips.ts`).
  tip: 'Each duel is a fresh fight. Dispel strips the Haste the fast one lives on, and Seymour drinks fire, ice, thunder and water, so use Darkness.',
  snapshots: [
    { image: 'backdrops/den-of-woe.png', caption: 'a stand-in stage' },
    { image: 'characters/auron/idle.png', caption: 'the first duel' },
    { image: 'portraits/paine.png', caption: 'count the turns' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-trema', 'victory-ffx2'],
};

export default FARPLANE_CUP_META;
