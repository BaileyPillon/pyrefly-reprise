/**
 * Pause-screen and prebattle-tab metadata for the hidden Biran and Yenke chapter (FFX only; `./chapter-biran-yenke.ts`, Bailey 2026-10-07 D-536; built 2026-10-14)
 * [research/re-ffx-biran-yenke.md, research/ffx-seymour-flux.md section 6.1, research/jegged-encounter-guides-ffx-*.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Kimahri's solo trial at the Mountain Gate is FFX's.
 *
 * - `title`, `subtitle`, `blurb` and `location` are the chapter record's own (`BIRAN_YENKE_TEXT`).
 * - `quote` is the one line Kimahri speaks in the pre scene (`src/story/scripts/biran-yenke.ts`), our own words in his register (writing bible section 1.7: third person, three to eight words).
 * - `objectives` are ours, each a rule `src/ui/common/chapterObjectives.ts` already answers, and none a number of the fight's: bring the stronger brother below half (the game arms his Rage there,
 *   RE section 5.2), bring both brothers down, and the win.
 * - `tip` and `handwritten` are our own words over the research's sourced rules (RE sections 5.6 and 7).
 * - `heroArt` is not made yet (`pause/ch25-biran-yenke`, so the pause screen shows the fallback): `heroArtFallback` is Kimahri's approved portrait. `snapshots` are existing assets only:
 *   Chapter I's mountain plate, and the two provisional paintings of the brothers.
 * - `musicKeys` are the cues the chapter plays: the mountain's bed under the scenes, `boss-challenge` for the fight (the game's one generic boss track, our original take) and the shared `victory-ffx`.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { BIRAN_YENKE_TEXT } from './chapter-biran-yenke.ts';
import { BIRAN_ID, BIRAN_YENKE_ID, YENKE_ID } from './ffx/biran-yenke-ids.ts';

export const BIRAN_YENKE_META: ChapterMeta = {
  id: BIRAN_YENKE_ID,
  gameLabel: 'FFX',
  numeral: 'EXP',
  ...BIRAN_YENKE_TEXT,
  location: 'Mt. Gagazet — the Mountain Gate',
  heroArt: 'pause/ch25-biran-yenke',
  heroArtFallback: 'portraits/kimahri.png',
  quote: { text: 'Kimahri passes.', speaker: 'Kimahri' },
  handwritten: 'lancet first, then the rages',
  objectives: [
    { id: 'half-way', label: 'Bring the stronger brother below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'both-down', label: 'Bring both brothers down', rule: { kind: 'parts-downed', targetIds: [BIRAN_ID, YENKE_ID] } },
    { id: 'win-trial', label: 'Win the trial', rule: { kind: 'victory' } },
  ],
  tip: 'Lancet each brother: Kimahri learns one Rage a cast, and a new Rage fills his gauge. A plain Attack on one brother makes the other stand guard; Jump and the Rages do not.',
  snapshots: [
    { image: 'backdrops/gagazet.png', caption: 'the mountain' },
    { image: `characters/${BIRAN_ID}/idle.png`, caption: 'Biran' },
    { image: `characters/${YENKE_ID}/idle.png`, caption: 'Yenke' },
  ],
  focalCharacterId: 'kimahri',
  musicKeys: ['scene-gagazet', 'boss-challenge', 'victory-ffx'],
};

export default BIRAN_YENKE_META;
