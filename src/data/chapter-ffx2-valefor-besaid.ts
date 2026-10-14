/**
 * **Valefor at Besaid** (FFX-2 Chapter 3, the story mission "Protect Besaid Temple!"; the aeon possessed by Shuyin's pyreflies in the Chamber of the Fayth), a hidden chapter
 * (branch `ch-besaid-valefor`).
 *
 * Bailey, 2026-10-13 (chat, relayed by the driver), verbatim: "I'll go with your 2 recommendations there, add them in. Yojimbo and Daigoro "Tourist Trap" and Valefor at Besaid Temple." and
 * "full speed ahead while I sleep". The driver's reading, recorded as his delegation: the chapter ships **hidden behind the typed word `besaid`** (`../app/screens/frontend/besaidDoor.ts`),
 * as the Leblanc preview, the Experiment, Sinspawn Gui and Fayth do, so he plays it in the morning; hidden chapter number **24**; listing it on the board waits for his word; the art is
 * **provisional** and reuses approved paintings where they fit; the music is one of our own original cues (the retail "Aeons" is never used).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the FFX-2 monster row #178 and the fallen aeons' action counter (`research/ffx2-fallen-aeons.md` §0, §7.1). The shared
 * plumbing it touches (the board's door table, the chapter registry) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * **The shape.** One formation (`./ffx2/enemies/valefor.ts`): Valefor, bestiary #178, Lv 22, 8,430 HP; Normal Attack, Sonic Wings (MP, the back of the formation), Energy Ray at counter 30 and
 * 60 (the whole party in our fixed formation), Energy Blast at 100. No second act, no prep tab, no dial. The chapter's attempts, clears and time go to the experiments' own store
 * (`experimental: true`), never `pyrefly-reprise:save:v1`.
 *
 * - `buildRef` — the Chapter 2 preset carried forward (`./ffx2/builds/besaid.ts`, levels `[estimate]`: no source gives one at Besaid).
 * - `enemyGroupRef` — Valefor, research §7.1 (every row tagged in `./ffx2/enemies/valefor*.ts`).
 * - `sceneKey` — the Chamber of the Fayth at Djose, **Bailey's approved plate** (D-273, `./ixion-plates.ts`), used here as the **provisional stand-in** for Besaid's own chamber: no approved Besaid
 *   chamber exists (a local render pilot for one is queued, candidates only). The pit in its floor belongs to Chapter 5; disclosed in the handoff.
 * - `scriptsRef` — the story (`../story/scripts/ffx2-valefor-besaid.ts`): our own words over the sourced beats.
 * - `music` — existing cues only, by sourced mood: the FFX-2 field bed, `boss-ffx2-fallen-aeons` (our own take, the cue Chapter XI and Ixion play; the sourced mood of the game's "Aeons", never the
 *   retail track) and the FFX-2 fanfare. Bailey's call by ear (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the eighteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and
 * `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { besaidBuild } from './ffx2/builds/besaid.ts';
import { VALEFOR_ID, besaidValeforGroup } from './ffx2/enemies/valefor.ts';
import { DJOSE_CHAMBER_PLATE } from './ixion-plates.ts';
import { ffx2ValeforBesaidScripts } from '../story/scripts/ffx2-valefor-besaid.ts';

/** The chapter's id: its key in the experiments' store. The boss first, then the place, as `ffx2-ixion-djose` does. */
export const VALEFOR_BESAID_ID = 'ffx2-valefor-besaid' as const;

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-valefor-besaid.ts`, both read them). Our own words over the sourced beats. */
export const VALEFOR_BESAID_TEXT = {
  title: 'Valefor',
  subtitle: 'The first aeon, and a temple that must not fall',
  location: 'Besaid Temple — Chamber of the Fayth',
  blurb:
    'Pyreflies have crept into the fayth at Besaid Temple, and the aeon that answers them does not know Yuna. ' +
    'The Gullwings have a temple to protect and one very old friend to get past.',
} as const;

/** The scene key: the Chamber's plate (`./ixion-plates.ts`; Bailey's approved Djose plate, the provisional stand-in for Besaid's own). */
export const VALEFOR_BESAID_SCENE_KEY = DJOSE_CHAMBER_PLATE;

/** Valefor at Besaid's chapter record. */
export const FFX2_VALEFOR_BESAID: Chapter = {
  id: VALEFOR_BESAID_ID,
  game: 'ffx2',
  number: 24, // after the other hidden experiments (19 the Leblanc preview, 20 the Experiment, 21 Sinspawn Gui, 22 Fayth, 23 the Tourist Trap lane's); the card would say EXP, not XXIV (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...VALEFOR_BESAID_TEXT,
  sceneKey: VALEFOR_BESAID_SCENE_KEY,
  thumbnailKey: 'chapter-ffx2-valefor-besaid',
  buildRef: besaidBuild,
  enemyGroupRef: besaidValeforGroup,
  scriptsRef: ffx2ValeforBesaidScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (the game's Besaid theme has no cue of ours)
    battle: 'boss-ffx2-fallen-aeons', // our own aeon cue, the sourced mood of "Aeons" (research §6.3); the one Chapter XI and Ixion play
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [VALEFOR_ID]: 'The pyreflies answer every blow. Two rays, then a blast.',
  },
};
