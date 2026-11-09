/**
 * Pause-screen and prebattle-tab metadata - **The Youth League Tournament**, the hidden chapter (`./chapter-ffx2-youth-league.ts`; FFX-2 only, Bailey 2026-11-06).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/re-ffx2-youth-league-tournament.md` §5 and §7): Yaibal looks after Yuna, Lucil's fifth action is Harbinger, Elma guards her line and goes after
 *   whoever has no Reflect. The tip promises nothing the Chapter V kit cannot do (the review of the Fallen Maesters, major 1).
 * - `quote` is Paine's line from the opening scene (`../story/scripts/ffx2-youth-league.ts`), our own.
 * - `objectives`: get past Yaibal (act 2 reached), get past Elma (act 7 reached), and the win (Lucil's fall ends the tournament).
 * - `heroArt` is the pause plate `pause/ffx2-youth-league` (release 79: the league road with all eight fighters, a composite). The fallback is the stand-in stage's own plate.
 * - `snapshots`: the Den of Woe's plate (the stand-in stage) and the two girls' FFX-2 portraits (approved).
 * - `musicKeys`: the field bed, the stand-in duel cue, the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { YOUTH_LEAGUE_ID, YOUTH_LEAGUE_TEXT } from './chapter-ffx2-youth-league.ts';

export const YOUTH_LEAGUE_META: ChapterMeta = {
  id: YOUTH_LEAGUE_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...YOUTH_LEAGUE_TEXT,
  heroArt: 'pause/ffx2-youth-league',
  heroArtFallback: 'backdrops/den-of-woe.png',
  quote: { text: 'Guests who are in the bracket.', speaker: 'Paine' },
  handwritten: 'seven names on a board. nobody refills',
  objectives: [
    { id: 'get-past-yaibal', label: 'Get past Yaibal', rule: { kind: 'link-reached', link: 2 } },
    { id: 'get-past-elma', label: 'Get past Elma', rule: { kind: 'link-reached', link: 7 } },
    { id: 'defeat-lucil', label: 'Defeat Lucil and end the tournament', rule: { kind: 'victory' } },
  ],
  // One short form that fits the card's band: the three named fighters' odd habits, and the fact that no bout mends you.
  tip: 'Seven bouts, no mending between them. Yaibal raises Yuna and nobody else. Elma goes for whoever lacks Reflect. Lucil\'s fifth action is Harbinger: Doom.',
  snapshots: [
    { image: 'backdrops/den-of-woe.png', caption: 'a stand-in stage' },
    { image: 'portraits/yuna-x2.png', caption: 'count the potions' },
    { image: 'portraits/paine.png', caption: 'count the beats' },
  ],
  focalCharacterId: 'paine',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default YOUTH_LEAGUE_META;
