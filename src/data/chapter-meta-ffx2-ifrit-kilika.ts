/**
 * Pause-screen and prebattle-tab metadata - **Ifrit at Kilika Temple**, the hidden chapter (`./chapter-ffx2-ifrit-kilika.ts`; FFX-2 only, 2026-11-07).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/ffx2-fallen-aeons.md` §7.1, `[verified: 2 sources]`, and the game's own script and move rows, `research/re-ffx2-ifrit-kilika.md`): a hidden count
 *   rises by seven with every action of his and by five with every blow he takes; Meteor Strike goes to the girl standing farthest from him when it reaches 30, 60 and 90 (once each), then Hellfire on all three at 100;
 *   **Fire heals him and Ice does not** (he absorbs Fire and is weak to Ice); Shell halves Firaga, the Meteors and Hellfire (all three are magic).
 * - `quote` is Yuna's dismay at the aeon, from the chapter's pre scene (`../story/scripts/ffx2-ifrit-kilika.ts`), our own line.
 * - `objectives`: survive Hellfire (the lesson), bring him below half, the win.
 * - `heroArt` is the pause plate `pause/ffx2-ifrit-kilika` (release 79: the possessed Ifrit over the warm-graded Chamber plate, a composite); `heroArtFallback` is his own idle.
 * - `snapshots`: the Chamber's plate (Bailey's approved Djose pick, the provisional stand-in for Kilika), the possessed Ifrit's cast pose, Yuna's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the aeon cue, the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { IFRIT_KILIKA_ID, IFRIT_KILIKA_SCENE_KEY, IFRIT_KILIKA_TEXT } from './chapter-ffx2-ifrit-kilika.ts';

export const IFRIT_KILIKA_META: ChapterMeta = {
  id: IFRIT_KILIKA_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...IFRIT_KILIKA_TEXT,
  heroArt: 'pause/ffx2-ifrit-kilika',
  heroArtFallback: 'characters/x2-ifrit/idle.png',
  quote: { text: 'Ifrit... It is us. Please, listen.', speaker: 'Yuna' },
  handwritten: 'no fire. ice. heal before the hundred',
  objectives: [
    { id: 'survive-hellfire', label: 'Survive Hellfire', rule: { kind: 'survived-ability', ability: 'hellfire' } },
    { id: 'ifrit-below-half', label: 'Bring Ifrit below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'defeat-ifrit', label: 'Defeat Ifrit', rule: { kind: 'victory' } },
  ],
  // Short enough for the prep card's tip box (about five lines at 1600 x 900): the guide card in battle carries the rest (the count, and who the Meteors go to).
  tip:
    'Fire heals him, so bring Ice. A hidden count fills with every action and blow: Meteors at the girl farthest back at 30, 60 and 90, then Hellfire. Shell it.',
  snapshots: [
    { image: `backdrops/${IFRIT_KILIKA_SCENE_KEY}.png`, caption: 'the chamber at Kilika' },
    { image: 'characters/x2-ifrit/cast.png', caption: 'the pyreflies gather' },
    { image: 'portraits/yuna-x2.png', caption: 'please, listen' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default IFRIT_KILIKA_META;
