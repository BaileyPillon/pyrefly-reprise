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
 * - `heroArt` is the chapter's own pause plate `pause/ffx2-bevelle-guardians` (r76b art install; it shows the approved Spectral Keeper, the Precepts Guard's body, at the left); the Bevelle Underground's plate is the fallback.
 *   Before the install it was the Bahamut chapter's plate (`pause/ch4-ffx2-bahamut`, the same dungeon).
 * - `snapshots`: the Bevelle Underground's plate, the living Baralai's own painting (`x2-baralai`) and Paine's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the two flagged stand-in boss cues and the fanfare, as the record's and the formations'.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { BEVELLE_GUARDIANS_ID, BEVELLE_GUARDIANS_TEXT } from './chapter-ffx2-bevelle-guardians.ts';

export const BEVELLE_GUARDIANS_META: ChapterMeta = {
  id: BEVELLE_GUARDIANS_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...BEVELLE_GUARDIANS_TEXT,
  heroArt: 'pause/ffx2-bevelle-guardians',
  heroArtFallback: 'backdrops/bevelle-underground.png',
  quote: { text: 'He counts every blow. The tenth one brings a drill.', speaker: 'Paine' },
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
    { image: 'characters/x2-baralai/idle.png', caption: 'the man at the stairs' },
    { image: 'portraits/paine.png', caption: 'keep Protect up' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-bahamut', 'boss-den-of-woe', 'victory-ffx2'],
};

export default BEVELLE_GUARDIANS_META;
