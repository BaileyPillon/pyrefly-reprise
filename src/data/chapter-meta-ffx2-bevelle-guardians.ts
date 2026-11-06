/**
 * Pause-screen and prebattle-tab metadata - **The Guardians of the Bevelle Underground**, the hidden chapter (`./chapter-ffx2-bevelle-guardians.ts`; FFX-2 only, Bailey 2026-11-06).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-bevelle-underground.md` §6): Georapella only casts (a ring of four Ga spells on the party); the Precepts Guard tries Demi, Slow,
 *   Death, Osmose and Drain; Baralai's tenth landed blow calls Drill Shot on the girl who made it, three quarters of her maximum HP. The tip is one short form that fits the prep card's band (no entry in `./chapter-prep-tips.ts`).
 * - `quote` is Paine's line from the second seam (`../story/scripts/ffx2-bevelle-guardians.ts`), our own.
 * - `objectives`: get past Georapella (act 2 reached), get past the Precepts Guard (act 3 reached), the win.
 * - `heroArt` is the Bahamut chapter's pause plate (a flagged stand-in, the same dungeon: the chapter's own `pause/ffx2-bevelle-guardians` is on the handoff's art list); the Bevelle Underground's plate is the fallback.
 * - `snapshots`: the Bevelle Underground's plate, the Den of Woe Baralai painting (the stand-in for the living Baralai) and Paine's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the two flagged stand-in boss cues and the fanfare, as the record's and the formations'.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { BEVELLE_GUARDIANS_ID, BEVELLE_GUARDIANS_TEXT } from './chapter-ffx2-bevelle-guardians.ts';

export const BEVELLE_GUARDIANS_META: ChapterMeta = {
  id: BEVELLE_GUARDIANS_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...BEVELLE_GUARDIANS_TEXT,
  heroArt: 'pause/ch4-ffx2-bahamut', // a flagged stand-in: Chapter IV's pause plate, the same dungeon
  heroArtFallback: 'backdrops/bevelle-underground.png',
  quote: { text: 'He counts every blow. Mind how many you land.', speaker: 'Paine' },
  handwritten: 'the tenth blow calls the drill',
  objectives: [
    { id: 'get-past-georapella', label: 'Get past Georapella', rule: { kind: 'link-reached', link: 2 } },
    { id: 'get-past-the-precepts-guard', label: 'Get past the Precepts Guard', rule: { kind: 'link-reached', link: 3 } },
    { id: 'defeat-baralai', label: 'Defeat Baralai', rule: { kind: 'victory' } },
  ],
  tip:
    'Shell against Georapella. Phoenix Downs for Death. Baralai’s tenth blow calls Drill Shot on whoever lands it: Protect her. Change Yuna to a Gunner.',
  snapshots: [
    { image: 'backdrops/bevelle-underground.png', caption: 'the way down' },
    { image: 'characters/baralai-shade/idle.png', caption: 'the man at the stairs' },
    { image: 'portraits/paine.png', caption: 'count the blows' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-bahamut', 'boss-den-of-woe', 'victory-ffx2'],
};

export default BEVELLE_GUARDIANS_META;
