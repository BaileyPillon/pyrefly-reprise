/**
 * Pause-screen and prebattle-tab metadata - **Gullwings, Chapter 1**, the hidden chapter (`./chapter-ffx2-gullwings-ch1.ts`; FFX-2 only, 2026-11-09).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-gullwings-chapter1.md` §3 and §4): Boris is weak to Fire and Ice, spits Sticky End once (all three girls, may Stop) and then claws; the Flame
 *   Dragon is weak to Ice, breathes on all three first and then hits the healthiest girl; the Guardian Beast curses (no changing dress) and, below a third of its life, looses Damocles Photon (half of everyone's maximum HP);
 *   YSLS-Zero's Blast Punch is half of one girl's maximum HP. **The tip follows the bench, not the guides' words** (`tests/unit/chapters/gullwings-ch1-bench.test.ts`): a White Mage and two Black Mages win the Beast (97 of 100) where the three starting
 *   dresspheres win 79, and the three starting dresspheres win YSLS-Zero (99 of 100) with fewer knock-outs than two Black Mages. The tip is one short form that fits the prep card's band (no entry in `./chapter-prep-tips.ts`).
 * - `quote` is Paine's line from the second seam (`../story/scripts/ffx2-gullwings-ch1.ts`), our own.
 * - `objectives` (exactly three): get past the Flame Dragon (act 3 reached), get past the Guardian Beast (act 4 reached), the win.
 * - `heroArt` has no painting of its own yet (`pause/ffx2-gullwings-ch1`); the Zanarkand Dome's plate is the fallback.
 * - `snapshots`: the Dome's plate (the flagged stand-in for all four acts), Yuna's FFX-2 portrait and Paine's (approved).
 * - `musicKeys`: the field bed, the flagged stand-in boss cue and the fanfare, as the record's and the formations'.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { GULLWINGS_CH1_ID, GULLWINGS_CH1_TEXT } from './chapter-ffx2-gullwings-ch1.ts';

export const GULLWINGS_CH1_META: ChapterMeta = {
  id: GULLWINGS_CH1_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...GULLWINGS_CH1_TEXT,
  heroArt: 'pause/ffx2-gullwings-ch1', // no painting yet: the fallback below shows
  heroArtFallback: 'backdrops/zanarkand-dome.png',
  quote: { text: 'Something is always standing guard.', speaker: 'Paine' },
  handwritten: 'ice for the dragon. heal for the beast',
  objectives: [
    { id: 'get-past-the-flame-dragon', label: 'Get past the Flame Dragon', rule: { kind: 'link-reached', link: 3 } },
    { id: 'get-past-the-guardian-beast', label: 'Get past the Guardian Beast', rule: { kind: 'link-reached', link: 4 } },
    { id: 'defeat-ysls-zero', label: 'Defeat YSLS-Zero', rule: { kind: 'victory' } },
  ],
  tip:
    'Ice for the Dragon. Remedy frees Stop, Holy Water lifts Curse. Beast: a White Mage heals, Black Mages cast. YSLS-Zero: strike and heal.',
  snapshots: [
    { image: 'backdrops/zanarkand-dome.png', caption: 'the old ruins' },
    { image: 'portraits/yuna-x2.png', caption: 'four hotspots' },
    { image: 'portraits/paine.png', caption: 'all four of us' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default GULLWINGS_CH1_META;
