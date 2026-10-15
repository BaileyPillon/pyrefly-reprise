/**
 * Pause-screen and prebattle-tab metadata - **Valefor at Besaid**, the hidden chapter (`./chapter-ffx2-valefor-besaid.ts`; FFX-2 only, Bailey 2026-10-13).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/ffx2-fallen-aeons.md` §7.1, `[verified: 2 sources]`, and the game's own script and move rows, the RE review of 2026-10-14, m164): a hidden
 *   count rises with every blow she takes and every attack-class turn of hers; two Energy Rays reach the whole party on the way to the Energy Blast; **Shell halves the Rays only, nothing softens the Blast** (its row is
 *   not magical), so the answer to the Blast is HP; Sonic Wings drains MP from the girl farthest from her (Yuna at the start).
 * - `quote` is Yuna's dismay at the aeon, from the chapter's pre scene (`../story/scripts/ffx2-valefor-besaid.ts`), our own line.
 * - `objectives`: survive Energy Blast (the lesson), bring her under half, the win.
 * - `heroArt` has no painting of its own yet: the card shows Valefor's idle as `heroArtFallback` (PROVISIONAL: the FFX aeon's approved painting, reused).
 * - `snapshots`: the Chamber's plate (Bailey's approved Djose pick, the provisional stand-in for Besaid), Valefor's cast pose, Yuna's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the aeon cue, the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { VALEFOR_BESAID_ID, VALEFOR_BESAID_SCENE_KEY, VALEFOR_BESAID_TEXT } from './chapter-ffx2-valefor-besaid.ts';

export const VALEFOR_BESAID_META: ChapterMeta = {
  id: VALEFOR_BESAID_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...VALEFOR_BESAID_TEXT,
  heroArt: 'pause/ffx2-valefor-besaid', // no painting yet: the fallback below shows
  heroArtFallback: 'characters/valefor/idle.png',
  quote: { text: 'Valefor? It is me. Please, stop.', speaker: 'Yuna' },
  handwritten: 'shell the rays. heal before the blast',
  objectives: [
    { id: 'survive-energy-blast', label: 'Survive Energy Blast', rule: { kind: 'survived-ability', ability: 'energy-blast' } },
    { id: 'valefor-below-half', label: 'Bring Valefor below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'defeat-valefor', label: 'Defeat Valefor', rule: { kind: 'victory' } },
  ],
  // Short enough for the prep card's tip box (about five lines at 1600 x 900): the guide card in battle carries the rest (Sonic Wings and the girl farthest from her).
  tip:
    'Every blow she takes, and every swing of hers, fills a hidden count: two Energy Rays, then the Energy Blast. ' +
    'Shell halves a Ray, not the Blast: heal before it.',
  snapshots: [
    { image: `backdrops/${VALEFOR_BESAID_SCENE_KEY}.png`, caption: 'the chamber at Besaid' },
    { image: 'characters/valefor/cast.png', caption: 'the pyreflies gather' },
    { image: 'portraits/yuna-x2.png', caption: 'please, stop' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default VALEFOR_BESAID_META;
