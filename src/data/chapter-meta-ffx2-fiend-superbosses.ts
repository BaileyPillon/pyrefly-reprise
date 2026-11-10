/**
 * Pause-screen and prebattle-tab metadata - **The Fiend Arena Superbosses**, the hidden chapter (`./chapter-ffx2-fiend-superbosses.ts`; FFX-2 only, 2026-11-09).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-fiend-arena-superbosses.md` sections 3 to 5, the game's own scripts and move rows): Shinra's Defense is 255 and Darkness ignores it; each of
 *   the four heads has a Command that kills a girl outright, and Protect and Shell change nothing about it (measured on the engine, stage 1 of the lane). **The tip promises nothing the Lv 99 kit cannot do**: it names no
 *   Miracle Drink (the bag holds no Dark Matter and Rikku's menu has no Mix row, stage 1 section 3 e) and no Thunder-proof gear (no accessory sets an element). It is short enough to need no short form on the desktop card
 *   (a line model of the band, `tests/unit/chapters/prep-tip-band.test.ts`).
 * - `quote` is Paine's line from the opening scene (`../story/scripts/ffx2-fiend-superbosses.ts`), our own.
 * - `objectives`: get past Almighty Shinra (act 2 reached), silence the first head (Unum, down), the win.
 * - `heroArt` is the pause plate of Chapter XIII's Trema (`pause/ch13-trema`), a STAND-IN: the Fiend Arena's other superboss, an existing installed plate; nothing is painted for this chapter yet, and the art lane's list names
 *   `pause/ffx2-fiend-superbosses`. The Den of Woe's plate is the `heroArtFallback` and the stage's own plate.
 * - `snapshots`: the Den of Woe's plate (the stand-in stage), Trema's idle (the stand-in for Shinra) and the Via Infinito's first fiend (the stand-in for a head). All three exist; none is final.
 * - `musicKeys`: the field bed, the superboss cue (a flagged stand-in), the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FIEND_SUPERBOSSES_ID, FIEND_SUPERBOSSES_TEXT } from './chapter-ffx2-fiend-superbosses.ts';
import { X2_NUMERUS_UNUM_ID } from './fiend-superbosses-ids.ts';

export const FIEND_SUPERBOSSES_META: ChapterMeta = {
  id: FIEND_SUPERBOSSES_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...FIEND_SUPERBOSSES_TEXT,
  heroArt: 'pause/ch13-trema', // a stand-in: an installed plate of the arena's other superboss; the art lane's key is pause/ffx2-fiend-superbosses
  heroArtFallback: 'backdrops/den-of-woe.png',
  quote: { text: 'He still counts everything.', speaker: 'Paine' },
  handwritten: 'six beats, then four songs',
  objectives: [
    { id: 'get-past-shinra', label: 'Get past Almighty Shinra', rule: { kind: 'link-reached', link: 2 } },
    { id: 'silence-the-first-head', label: 'Silence Unum, the first head', rule: { kind: 'parts-downed', targetIds: [X2_NUMERUS_UNUM_ID] } },
    { id: 'defeat-the-major-numerus', label: 'Defeat the Major Numerus', rule: { kind: 'victory' } },
  ],
  // One short sentence pair: it needs no short form for the desktop prep card (the Fallen Maesters' ten-line tip did, `./chapter-prep-tips.ts`).
  tip: 'Darkness ignores Shinra’s Defense. Each of the four heads has a Command that kills a girl, and Protect and Shell do not stop one.',
  snapshots: [
    { image: 'backdrops/den-of-woe.png', caption: 'a stand-in stage' },
    { image: 'characters/trema/idle.png', caption: 'a stand-in for Shinra' },
    { image: 'characters/x2-aranea/idle.png', caption: 'a stand-in head' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-trema', 'victory-ffx2'],
};

export default FIEND_SUPERBOSSES_META;
