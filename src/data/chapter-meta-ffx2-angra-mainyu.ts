/**
 * Pause-screen and prebattle-tab metadata — **Angra Mainyu**, the hidden chapter (`./chapter-ffx2-angra-mainyu.ts`; FFX-2 only, Bailey 2026-10-15) [research/ffx2-angra-mainyu.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (`ANGRA_MAINYU_TEXT`).
 * - `numeral` is `EXP` like the other hidden chapters.
 * - `quote` is Yuna's go-call in the pre scene (`../story/scripts/ffx2-angra-mainyu.ts`), our own line.
 * - `objectives` are rules `src/ui/common/chapterObjectives.ts` already answers: survive Perdition's Flame (the fight's danger, research §3.1), down both arms at once (the lesson: the Flame needs both,
 *   §4.1), and the win.
 * - `tip` and `handwritten` are our own words over the research's sources: Darkness reaches all three and passes both arms' immunities (§4.4), keep the arms down so the Flame never comes (§4.1),
 *   Protect halves each of its hits (§3.1).
 * - `heroArt` has no painting of its own: the fallback is the provisional body painting (`x2-anima`, Chapter XI's approved). `snapshots` are existing assets only: the grounds plate (the stand-in,
 *   research §6), the body's cast pose, Paine's FFX-2 portrait.
 * - `musicKeys`: the field bed, the aeon cue, the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { ANGRA_MAINYU_TEXT } from './chapter-ffx2-angra-mainyu.ts';
import { ANGRA_ABILITY, ANGRA_MAINYU_ID, ANGRA_MAINYU_SCENE, ANGRA_STAND_IN_ART, TAWRICH_ID, ZARICH_ID } from './angra-mainyu-ids.ts';

export const ANGRA_MAINYU_META: ChapterMeta = {
  id: ANGRA_MAINYU_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...ANGRA_MAINYU_TEXT,
  heroArt: 'pause/ffx2-angra-mainyu', // no painting yet: the fallback below shows
  heroArtFallback: `characters/${ANGRA_STAND_IN_ART}/idle.png`,
  quote: { text: 'The diggers are still in the camp. We hold it here.', speaker: 'Yuna' },
  handwritten: 'arms down. darkness. protect.',
  objectives: [
    { id: 'survive-perditions-flame', label: "Survive Perdition's Flame", rule: { kind: 'survived-ability', ability: ANGRA_ABILITY.perditionsFlame } },
    { id: 'both-arms-down', label: 'Bring down both arms at once', rule: { kind: 'parts-downed', targetIds: [TAWRICH_ID, ZARICH_ID] } },
    { id: 'defeat-angra-mainyu', label: 'Defeat Angra Mainyu', rule: { kind: 'victory' } },
  ],
  // Short enough for the prep card's tip box; the guide card in battle carries the rest.
  tip:
    "Darkness reaches all three and passes both arms' guards. Keep both arms down and Perdition's Flame never comes. " +
    'Protect halves each of its hits.',
  snapshots: [
    { image: `backdrops/${ANGRA_MAINYU_SCENE}.png`, caption: 'the excavation camp' },
    { image: `characters/${ANGRA_STAND_IN_ART}/cast.png`, caption: 'what the dig woke' },
    { image: 'portraits/paine.png', caption: 'then we hold it' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default ANGRA_MAINYU_META;
