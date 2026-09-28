/**
 * Chapter XVI — Ixion at Djose (FFX-2), the Chapter 3 finale. **Listed** 2026-09-27.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the fallen aeons' action counter
 * (`research/ffx2-ixion-djose.md` §0). The listing itself (`./encounters.ts`, the story registry, the board's
 * counts) is shared plumbing, "both" (CHK-020).
 *
 * Bailey, 2026-09-27 ~13:40 EDT, "all your recommendations": **concept A** of
 * `docs/concepts/chapters/ixion-djose-2026-09-27/README.md` (D-265): the fight, with the game's own "Recharge"
 * line as the tell; then the fall, a short Abyss cutscene and a playable four-whistle beat. ~15:20 EDT: look B
 * (D-268) and the 3 s action time ON (D-269). ~18:30 EDT: "ixion needs to be in the next build as well": listed.
 *
 * - `number: 16` — the next place on the board after Chapter XV. Sin (FFX, D-270, two chapters, on its own
 *   branch) was registered as XVI there and waits ("sin can wait for now"): it takes the numbers after this one.
 * - `buildRef: djoseBuild` — research §5; levels 32 / 33 / 34 are **our estimate** (IX-14).
 * - `enemyGroupRef` — Ixion, research §3.1 and §4 (every row tagged in `./ffx2/enemies/ixion-djose*.ts`).
 * - `sceneKey` — the Chamber of the Fayth on its **stand-in plate** (`./ixion-plates.ts`: not approved; the
 *   painting round is owed; the swap is one line there).
 * - Ixion's painting — **look B, possessed violet** (D-268), `x2-ixion`.
 * - `music` — the fight plays the house FFX-2 aeon cue `boss-ffx2-aeon` ("Static Coronation"), the sourced mood
 *   of the game's "Aeons" (research §6.3, `[single source]`); the field bed is `scene-bevelle-underground`, the
 *   FFX-2 chapters' fallback bed (Chapter VI's precedent; the game's "The Machina Faction" has no cue of ours);
 *   the FFX-2 fanfare. The Abyss plays `scene-farplane` (the story script). Bailey's call by ear (rule 13).
 * - `scriptsRef` — the story (`../story/scripts/ffx2-ixion-djose.ts`): concept A in order; only the research's
 *   own quoted lines are verbatim, the rest is ours over the sourced beats.
 * - `subtitle`, `blurb` and `sensorTexts` — our own words over the research's sourced beats.
 */

import type { Chapter } from './encounters.ts';
import { djoseBuild } from './ffx2/builds/djose.ts';
import { djoseIxionGroup } from './ffx2/enemies/ixion-djose.ts';
import { ffx2IxionDjoseScripts } from '../story/scripts/ffx2-ixion-djose.ts';
import { DJOSE_CHAMBER_PLATE } from './ixion-plates.ts';

/** The scene key: the Chamber's plate (`./ixion-plates.ts`, a stand-in until the painting round lands). */
export const IXION_DJOSE_SCENE_KEY = DJOSE_CHAMBER_PLATE;

/** Chapter XVI. */
export const FFX2_IXION_DJOSE: Chapter = {
  id: 'ffx2-ixion-djose',
  game: 'ffx2',
  number: 16,
  title: 'Ixion',
  subtitle: 'The aeon at Djose, and the hole where the fayth stood',
  location: 'Djose Temple — Chamber of the Fayth',
  // Research §1.1, §2 and §4.2, summarised in our own words.
  blurb:
    'Fiends pour out of Djose Temple, and the aeon that once answered Yuna waits at the top of the stairs. ' +
    'When it recharges, the hammer is next.',
  sceneKey: IXION_DJOSE_SCENE_KEY, // the stand-in plate — see the file header
  thumbnailKey: 'chapter-ffx2-ixion-djose',
  buildRef: djoseBuild,
  enemyGroupRef: djoseIxionGroup,
  scriptsRef: ffx2IxionDjoseScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 fallback field bed (Chapter VI's precedent)
    battle: 'boss-ffx2-aeon', // the sourced mood of "Aeons" (research §6.3)
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    'x2-ixion': 'Water hurts him. Lightning feeds him. When he recharges, the hammer is next.',
  },
};
