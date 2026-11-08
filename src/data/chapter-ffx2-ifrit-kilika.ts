/**
 * **Ifrit at Kilika Temple** (FFX-2 Chapter 3, the story mission "Pest Control"; the aeon possessed by Shuyin's pyreflies in the Chamber of the Fayth), a hidden chapter, number 46 (branch `ch-ifrit-kilika`).
 *
 * Authority (relayed by the release driver, verbatim): "implement all unimplemented chapters please" (2026-11-06) and "yes on all these too" (every researched boss he never picked); 2026-11-07 "ok keep going we have full
 * usage here". The driver's reading, recorded as his delegation: the chapter ships **hidden behind the typed word `ifrit`** (`../app/screens/frontend/ifritDoor.ts`), as Valefor at Besaid, the Experiment and the others do, so he
 * plays it; hidden chapter number **46**; listing it on the board waits for his word; the art is **provisional** and reuses an approved painting; the music is one of our own original cues (the retail "Aeons" is never used).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the FFX-2 monster row #179 (`monster.bin` row 165) and the fallen aeons' action counter (`research/ffx2-fallen-aeons.md` §0, §7.1;
 * `research/re-ffx2-ifrit-kilika.md`). The shared plumbing it touches (the board's door table, the chapter registry) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * **The shape.** One formation (`./ffx2/enemies/ifrit.ts`): Ifrit, bestiary #179, Lv 23, 8,820 HP; Attack and Firaga on his ordinary turns, Meteor Strike at the farthest girl when his count reaches 30, 60 and 90, Hellfire on all
 * three at 100, and a "battle too long" block that ends the fight past 200 of his turns. No second act, no prep tab, no dial. The chapter's attempts, clears and time go to the experiments' own store (`experimental: true`), never
 * `pyrefly-reprise:save:v1`.
 *
 * - `buildRef`: the Chapter 2 preset carried forward with the Samurai dressphere owned (`./ffx2/builds/kilika.ts`, levels `[estimate]`: no source gives one at Kilika).
 * - `enemyGroupRef`: Ifrit, row 165 (every row tagged in `./ffx2/enemies/ifrit*.ts`).
 * - `sceneKey`: the Chamber of the Fayth at Djose, **Bailey's approved plate** (D-273, `./ixion-plates.ts`), used here as the **provisional stand-in** for Kilika's own chamber, exactly as the Valefor chapter does: no Kilika
 *   chamber plate exists. The pit in its floor belongs to Chapter 5; disclosed in the handoff.
 * - `scriptsRef`: the story (`../story/scripts/ffx2-ifrit-kilika.ts`): our own words over the sourced beats.
 * - `music`: existing cues only, by sourced mood: the FFX-2 field bed, `boss-ffx2-fallen-aeons` (our own take, the cue Chapter XI, Ixion and Valefor play; the sourced mood of the game's "Aeons", never the retail track) and the
 *   FFX-2 fanfare. Bailey's call by ear (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays as it was); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { kilikaBuild } from './ffx2/builds/kilika.ts';
import { IFRIT_ID, kilikaIfritGroup } from './ffx2/enemies/ifrit.ts';
import { DJOSE_CHAMBER_PLATE } from './ixion-plates.ts';
import { ffx2IfritKilikaScripts } from '../story/scripts/ffx2-ifrit-kilika.ts';

/** The chapter's id: its key in the experiments' store. The boss first, then the place, as `ffx2-valefor-besaid` and `ffx2-ixion-djose` do. */
export const IFRIT_KILIKA_ID = 'ffx2-ifrit-kilika' as const;

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-ifrit-kilika.ts`, both read them). Our own words over the sourced beats. */
export const IFRIT_KILIKA_TEXT = {
  title: 'Ifrit',
  subtitle: 'The second aeon, and a fire that is not his',
  location: 'Kilika Temple — Chamber of the Fayth',
  blurb:
    'Pyreflies have swarmed the fayth at Kilika Temple, and the aeon of fire that answers them does not know Yuna. ' +
    'The Gullwings came to clear pests, and found a very old friend burning.',
} as const;

/** The scene key: the Chamber's plate (`./ixion-plates.ts`; Bailey's approved Djose plate, the provisional stand-in for Kilika's own). */
export const IFRIT_KILIKA_SCENE_KEY = DJOSE_CHAMBER_PLATE;

/** Ifrit at Kilika's chapter record. */
export const FFX2_IFRIT_KILIKA: Chapter = {
  id: IFRIT_KILIKA_ID,
  game: 'ffx2',
  number: 46, // the plan's number for this row (hidden chapters 34 on; 40 is Yuna's Ballad); the card would say EXP, not XLVI (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...IFRIT_KILIKA_TEXT,
  sceneKey: IFRIT_KILIKA_SCENE_KEY,
  thumbnailKey: 'chapter-ffx2-ifrit-kilika',
  buildRef: kilikaBuild,
  enemyGroupRef: kilikaIfritGroup,
  scriptsRef: ffx2IfritKilikaScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the game's own Kilika theme has no cue of ours)
    battle: 'boss-ffx2-fallen-aeons', // our own aeon cue, the sourced mood of "Aeons" (research §6.3); the one Chapter XI, Ixion and Valefor play
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [IFRIT_ID]: 'Every blow warms him. At thirty, sixty and ninety, a meteor for whoever stands back. At a hundred, Hellfire.',
  },
};
