/**
 * Chapter XVII — Ixion at Djose (FFX-2), the Chapter 3 finale. **Registered, unlisted, behind a switch.**
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the fallen aeons' action counter
 * (`research/ffx2-ixion-djose.md` §0). The registration itself is shared plumbing, "both" (CHK-020).
 *
 * Bailey, 2026-09-27 ~13:40 EDT, "all your recommendations": **concept A** of
 * `docs/concepts/chapters/ixion-djose-2026-09-27/README.md`: the fight, with the game's own "Recharge" line
 * as the tell; then the fall, a short Abyss cutscene and a playable four-whistle beat. Ixion's FFX-2 look is
 * still Bailey's pick (research Q6), so nothing perceivable here is final.
 *
 * **The switch.** The record sits in `UNLISTED_CHAPTERS` (`./chapters-unlisted.ts`): `getChapter`, the
 * battle flow and `window.__pyrefly.gotoChapter('ffx2-ixion-djose')` reach it by id, and chapter select, the
 * jukebox and every chapter-generic suite do not see it. Listing it (moving it into `CHAPTERS`) is the
 * switch, and it needs Bailey's yes and the parts below that are still placeholders.
 *
 * Every field a player would see or hear is research, our estimate or a **placeholder**:
 *
 * - `number: 17` — after Chapter XVI (Sin, registered unlisted the same day on its own branch). Placeholder.
 * - `buildRef: djoseBuild` — research §5; levels 32 / 33 / 34 are **our estimate** (IX-14).
 * - `enemyGroupRef` — Ixion, research §3.1 and §4 (every row tagged in `./ffx2/enemies/ixion-djose*.ts`).
 * - `sceneKey: 'djose-temple'` — **placeholder**: the registry's stand-in diorama (the demo composition,
 *   `src/scenes/index.ts`), titled as a placeholder. No Djose plate exists; the Chamber is a painting round.
 * - Ixion's painting — **placeholder**: the FFX Ixion (D-089), until Bailey picks the FFX-2 look (Q6).
 * - `music` — **placeholder**: our original FFX-2 aeon cue for the fight (the game plays "Aeons",
 *   `[single source]`); the Farplane bed as the field stand-in; the FFX-2 fanfare. Bailey's call by ear.
 * - `scriptsRef` — **a stub** (`../story/scripts/ffx2-ixion-djose.ts`): concept A's order in placeholder
 *   stage directions; no quoted game text; the whistle beat as a placeholder input.
 * - `subtitle`, `blurb` and `sensorTexts` — our own words over the research's sourced beats.
 */

import type { Chapter } from './encounters.ts';
import { djoseBuild } from './ffx2/builds/djose.ts';
import { djoseIxionGroup } from './ffx2/enemies/ixion-djose.ts';
import { ffx2IxionDjoseScripts } from '../story/scripts/ffx2-ixion-djose.ts';

/** The placeholder scene key (registered in `src/scenes/index.ts` as a labelled stand-in). */
export const IXION_DJOSE_SCENE_KEY = 'djose-temple';

/** Chapter 17 (unlisted). */
export const FFX2_IXION_DJOSE: Chapter = {
  id: 'ffx2-ixion-djose',
  game: 'ffx2',
  number: 17, // PLACEHOLDER: after Sin (XVI); the board order is Bailey's when it is listed
  title: 'Ixion',
  subtitle: 'The aeon at Djose, and the hole where the fayth stood',
  location: 'Djose Temple — Chamber of the Fayth',
  // Research §1.1, §2 and §7, summarised in our own words. Placeholder card copy; no card is shown while unlisted.
  blurb:
    'Fiends pour out of Djose Temple, and the aeon that once answered Yuna waits at the top of the stairs. ' +
    'When it recharges, the hammer is next.',
  sceneKey: IXION_DJOSE_SCENE_KEY, // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-ffx2-ixion-djose',
  buildRef: djoseBuild,
  enemyGroupRef: djoseIxionGroup,
  scriptsRef: ffx2IxionDjoseScripts, // STUB — see the file header
  music: {
    scene: 'scene-farplane', // PLACEHOLDER
    battle: 'boss-ffx2-aeon', // PLACEHOLDER for "Aeons"
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    'x2-ixion': 'Water hurts him. Lightning feeds him. When he recharges, the hammer is next.',
  },
};
