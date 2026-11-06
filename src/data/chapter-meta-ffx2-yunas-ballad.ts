/**
 * Pause-screen and prebattle-tab metadata - **Yuna's Ballad**, the hidden chapter (`./chapter-ffx2-yunas-ballad.ts`; FFX-2 only, Bailey 2026-11-06).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-yunas-ballad.md` §4 and §7, the game's own rows and scripts): nothing heals between the duels; the possessed Rikku's throws never vary in size; the
 *   possessed Paine has Defense 70 and Magic Defense 7.
 * - `quote` is Yuna's line from the pre scene (`../story/scripts/ffx2-yunas-ballad.ts`), our own.
 * - `objectives`: survive a Grenade, free Rikku (the second duel reached), free Paine (the win).
 * - `heroArt` is the chapter's own pause plate `pause/ffx2-yunas-ballad` (r76b art install; a composite of Yuna, as the White Mage, against the two possessed girls on the Den's plate). `heroArtFallback`, Paine's FFX-2
 *   portrait, shows only if the plate is missing. Before the install it was the Den of Woe's own plate (`pause/ch15-ffx2-den-of-woe`, Chapter XV's) as a stand-in.
 * - `snapshots`: the Den's plate, Yuna's White Mage idle and the possessed Paine's own painting (`x2-possessed-paine`).
 * - `musicKeys`: the field bed, the Den's cue, the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { YUNAS_BALLAD_ID, YUNAS_BALLAD_TEXT } from './chapter-ffx2-yunas-ballad.ts';

export const YUNAS_BALLAD_META: ChapterMeta = {
  id: YUNAS_BALLAD_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...YUNAS_BALLAD_TEXT,
  bossLine: 'Rikku, then Paine',
  heroArt: 'pause/ffx2-yunas-ballad',
  heroArtFallback: 'portraits/paine.png',
  quote: { text: 'I will not run, and I will not give up on you.', speaker: 'Yuna' },
  handwritten: 'two friends, one girl, no rest between',
  objectives: [
    { id: 'survive-the-grenade', label: 'Survive a Grenade', rule: { kind: 'survived-ability', ability: 'grenade' } },
    { id: 'free-rikku', label: 'Free Rikku', rule: { kind: 'link-reached', link: 2 } },
    { id: 'free-paine', label: 'Free Paine', rule: { kind: 'victory' } },
  ],
  tip: "Nothing heals between the duels. Rikku's throws never vary in size; Paine has thick armour and thin magic defence.",
  snapshots: [
    { image: 'backdrops/den-of-woe.png', caption: 'the sealed cave' },
    { image: 'characters/yuna-white-mage/idle.png', caption: 'alone at the front' },
    { image: 'characters/x2-possessed-paine/idle.png', caption: 'a slow blade' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-den-of-woe', 'victory-ffx2'],
};

export default YUNAS_BALLAD_META;
