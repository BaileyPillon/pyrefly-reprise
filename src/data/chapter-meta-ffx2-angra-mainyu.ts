/**
 * Pause-screen and prebattle-tab metadata - **Angra Mainyu**, the hidden chapter (`./chapter-ffx2-angra-mainyu.ts`; FFX-2 only, Bailey 2026-10-07 and 2026-10-14).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-angra-mainyu.md` §9 and §10, the game's own scripts and move rows, and `research/ffx2-angra-mainyu.md` §5, Jegged's page):
 *   Perdition's Flame is ten hits on random girls for 3/16 of each girl's maximum HP, so keep everyone high (Protect halves it); the arms are each immune to one kind of damage, and **Darkness** (Dark Knight) is
 *   neither, so it reaches all three bodies; the body spends its turns reviving and healing an arm; and it drinks the party's MP (Osmose) once its own runs low.
 * - `quote` is Rikku's stake in the camp, from the chapter's pre scene (`../story/scripts/ffx2-angra-mainyu.ts`), our own line.
 * - `objectives`: survive a Perdition's Flame (the lesson), bring both arms down, the win.
 * - `heroArt` has no painting of its own yet: the card shows the body's idle as `heroArtFallback` (PROVISIONAL: a new subject made locally).
 * - `snapshots`: the desert plate (provisional, new), the body's painting, Rikku's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the aeon cue, the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { ANGRA_MAINYU_ID, ANGRA_MAINYU_TEXT } from './chapter-ffx2-angra-mainyu.ts';
import { ANGRA_MAINYU_PLATE, X2_TAWRICH_ID, X2_ZARICH_ID } from './angra-mainyu-ids.ts';
import { ANGRA_PERDITIONS_FLAME_ID } from './ffx2/enemies/angra-mainyu-abilities.ts';

export const ANGRA_MAINYU_META: ChapterMeta = {
  id: ANGRA_MAINYU_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...ANGRA_MAINYU_TEXT,
  heroArt: 'pause/ffx2-angra-mainyu', // no painting yet: the fallback below shows
  heroArtFallback: 'characters/angra-mainyu/idle.png',
  quote: { text: 'That is our dig! Somebody tell it to take the long way!', speaker: 'Rikku' },
  handwritten: 'keep hp high. darkness hits all three',
  objectives: [
    { id: 'survive-perditions-flame', label: "Survive Perdition's Flame", rule: { kind: 'survived-ability', ability: ANGRA_PERDITIONS_FLAME_ID } },
    { id: 'both-arms-down', label: 'Bring both arms down', rule: { kind: 'parts-downed', targetIds: [X2_ZARICH_ID, X2_TAWRICH_ID] } },
    { id: 'defeat-angra-mainyu', label: 'Defeat Angra Mainyu', rule: { kind: 'victory' } },
  ],
  // Short enough for the prep card's tip box (about five lines at 1600 x 900): the guide card in battle carries the rest (the Flame's ten hits, the arms' immunities, Osmose).
  tip:
    'Zarich shrugs off blows and Tawrich shrugs off spells, but Darkness is neither, so it reaches all three. ' +
    'Perdition’s Flame lands ten times: keep everyone high.',
  snapshots: [
    { image: `backdrops/${ANGRA_MAINYU_PLATE}.png`, caption: 'the dig camp' },
    { image: 'characters/angra-mainyu/idle.png', caption: 'what the Cactuars buried' },
    { image: 'portraits/rikku-x2.png', caption: 'my camp!' },
  ],
  focalCharacterId: 'rikku',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default ANGRA_MAINYU_META;
