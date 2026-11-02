/**
 * Pause-screen and prebattle-tab metadata - **The Fallen Maesters**, the hidden chapter (`./chapter-ffx2-fallen-maesters.ts`; FFX-2 only, Bailey 2026-10-18 and 2026-11-02).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-fallen-maesters.md` §7 and §8, the game's own scripts and move rows): Aranea's fifth action is Gooey End (Poison, Stop, and a drop in strength
 *   and magic); the Black Elemental has almost no HP and a Reflect, and its Magic climbs every third action; Concherer's shell breaks on one hit of about twenty thousand; Chac petrifies and a blow on stone destroys a girl.
 * - `quote` is Paine's line from the first seam (`../story/scripts/ffx2-fallen-maesters.ts`), our own.
 * - `objectives`: get past Aranea (floor 40 reached), get past Concherer (floor 80 reached), the win.
 * - `heroArt` has no painting of its own yet: the card shows the Via Infinito's plate as `heroArtFallback` (the four fiends have no paintings yet; the art needs list is in the handoff).
 * - `snapshots`: the Via Infinito's plate, Paragon's idle (the hall's other boss; approved) and Paine's FFX-2 portrait (approved). No snapshot of the four fiends exists yet.
 * - `musicKeys`: the field bed, the aeon cue (a flagged stand-in), the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FALLEN_MAESTERS_ID, FALLEN_MAESTERS_TEXT } from './chapter-ffx2-fallen-maesters.ts';

export const FALLEN_MAESTERS_META: ChapterMeta = {
  id: FALLEN_MAESTERS_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...FALLEN_MAESTERS_TEXT,
  heroArt: 'pause/ffx2-fallen-maesters', // no painting yet: the fallback below shows
  heroArtFallback: 'backdrops/via-infinito.png',
  quote: { text: 'Then we stop it before the fifth bite.', speaker: 'Paine' },
  handwritten: 'the glyph heals. nothing else does',
  objectives: [
    { id: 'get-past-aranea', label: 'Get past Aranea', rule: { kind: 'link-reached', link: 2 } },
    { id: 'get-past-concherer', label: 'Get past Concherer', rule: { kind: 'link-reached', link: 4 } },
    { id: 'defeat-chac', label: 'Defeat Chac', rule: { kind: 'victory' } },
  ],
  // Short enough for the prep card's tip box (about five lines at 1600 x 900): the guide card in battle carries the rest.
  tip:
    'Each floor is a fresh fight, and the glyph between them mends you. Concherer’s shell breaks on one hit of about twenty thousand; ' +
    'Chac turns girls to stone, and a blow on stone destroys them.',
  snapshots: [
    { image: 'backdrops/via-infinito.png', caption: 'the Great Cloisters' },
    { image: 'characters/paragon/idle.png', caption: 'the hall below' },
    { image: 'portraits/paine.png', caption: 'count the bites' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default FALLEN_MAESTERS_META;
