/**
 * Pause-screen and prebattle-tab metadata — **Biran and Yenke**, the hidden chapter (`./chapter-biran-yenke.ts`; FFX only, Bailey 2026-10-15) [research/ffx-biran-yenke.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Kimahri's duel at the gate of Mt. Gagazet, his Lancet and his Ronso Rage are FFX's.
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (`BIRAN_YENKE_TEXT`).
 * - `numeral` is `EXP` like the other hidden chapters.
 * - `quote` is Kimahri's line in the pre scene (`../story/scripts/biran-yenke.ts`), our own words in his register (writing bible §1.7: three to eight words, third person).
 * - `objectives` are rules `src/ui/common/chapterObjectives.ts` already answers: weather Yenke's Aqua Breath, bring Biran below a quarter (his Mighty Guard window, research §4.2;
 *   the formation's `bossId` is Biran), and the win. None names a number of the party's (the preset is an estimate).
 * - `tip` and `handwritten` are our own words over the research's sourced rules: they guard each other while they stand together (§4.4), a Bulldoze moves one away (§4.4), and
 *   Lancet teaches a Rage, Mighty Guard and White Wind only after their own use below a quarter (§4.2, §4.5).
 * - `heroArt` has no painting of its own yet: the fallback is Kimahri's approved idle. `snapshots` are existing assets only: the Gagazet plate (Chapter I's approved), Kimahri's
 *   approved Jump, his approved portrait.
 * - `musicKeys`: the mountain's own bed, which also carries the fight (research §8), and the FFX fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { BIRAN_YENKE_TEXT } from './chapter-biran-yenke.ts';
import { BIRAN_YENKE_ID, BIRAN_YENKE_SCENE } from './ffx/biran-yenke-ids.ts';

export const BIRAN_YENKE_META: ChapterMeta = {
  id: BIRAN_YENKE_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...BIRAN_YENKE_TEXT,
  heroArt: 'pause/biran-yenke', // no painting yet: the fallback below shows
  heroArtFallback: 'characters/kimahri/idle.png',
  quote: { text: 'Kimahri answers alone.', speaker: 'Kimahri' },
  handwritten: 'lancet first. then the gate',
  objectives: [
    { id: 'weather-aqua-breath', label: "Weather Yenke's Aqua Breath", rule: { kind: 'survived-ability', ability: 'yenke-aqua-breath' } },
    { id: 'biran-below-a-quarter', label: 'Bring Biran below a quarter', rule: { kind: 'boss-hp-below', fraction: 0.25 } },
    { id: 'defeat-the-ronso', label: 'Defeat Biran and Yenke', rule: { kind: 'victory' } },
  ],
  // Short enough for the prep card's tip box; the guide card in battle carries the rest.
  tip:
    'Side by side they guard each other: your Attack lands on the wrong Ronso, at half. Lancet and Rages get through. ' +
    'Bring each below a quarter, and Lancet him after his Mighty Guard or White Wind.',
  snapshots: [
    { image: `backdrops/${BIRAN_YENKE_SCENE}.png`, caption: 'the mountain gate' },
    { image: 'characters/kimahri/jump.png', caption: 'Kimahri answers alone' },
    { image: 'portraits/kimahri.png', caption: 'take their lessons' },
  ],
  focalCharacterId: 'kimahri',
  musicKeys: ['scene-gagazet', 'victory-ffx'],
};

export default BIRAN_YENKE_META;
