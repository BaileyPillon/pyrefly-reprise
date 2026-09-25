/**
 * Chapter XIII — Trema, Cloister 100 of the Via Infinito (FFX-2).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, Garment Grids,
 * Spherechange, Mix (`research/ffx2-trema.md` §0). The registration itself is shared
 * plumbing, "both" (critic/CHECKS.md CHK-020).
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7 to 11; the
 * `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and UNLISTED
 *
 * Bailey, 2026-09-25: "I'll go with all your recommendations" (TR1–TR19 and O-1..O-4 on
 * `docs/plans/chapter-trema-review.md`, after its Review). The engine, data, AI, party and
 * the link/checkpoint behaviour are here; the Cloister scene, Trema's and Paragon's
 * paintings, the story, the guide, the tactic, the HUD numerals and the `boss-trema` cue are
 * not built yet (TR18 = ship LOCKED if the art is late). So this record sits in
 * `UNLISTED_CHAPTERS`, the Chapter IX to XI precedent: `getChapter`, the battle flow and
 * `window.__pyrefly.gotoChapter` reach it by id, and **chapter select does not show it**.
 *
 * Every field a player would see or hear is Bailey's pick or a **placeholder**:
 *
 * - `title: 'Trema'`, `location` — **TR17** (picked); `number: 13` by registration after
 *   Omnis (XII), D-058.
 * - `buildRef: viaInfinitoBuild` — **TR10 a / TR11 a / TR9 b** (picked), through
 *   `TREMA_KIT_OPTION = 'tr11-a'`. The other kit options (`./ffx2/builds/via-infinito-kit.ts`: the
 *   sourced clear's Valiant Lustre, Defense Bracers, Adamantite, Soul Spring, Three Stars, Stamina
 *   Tonic, Ribbon) are built, tested and **OFF**: each goes beyond TR11 a and needs Bailey's word.
 * - `enemyGroupRef` — **TR1 a**: Paragon, then Trema, carried over (`./ffx2/enemies/trema.ts`).
 *
 * **The four options of `docs/plans/trema-options-2026-09-25.md`, built and OFF**, one line each:
 * `TREMA_PARAGON_FORM = 'oversoul'` (1, TR7 b), `TREMA_CHAPTER_SHAPE = 'trema-alone'` (2, TR1 b),
 * `CLOISTER_ACTION_TIME_ON = true` (3, E4, in `./ffx2/enemies/trema.ts`) and
 * `TREMA_KIT_OPTION = 'nightmare-kit'` (4). Each needs Bailey's word; with all four off the chapter
 * is byte-identical to the build before they existed (`tests/unit/chapters/trema-options.test.ts`).
 * - `sceneKey: 'bevelle-underground'` — **placeholder**: the approved Bevelle Underground
 *   scene, the same underworld family (research §6.1). O-3 picked B (the repainted plate) for
 *   Cloister 100; the scene that draws it (plan track T5) is not built.
 * - `music` — **TR16 a** (picked): Paragon under `scene-bevelle-underground`, Trema under
 *   `boss-ffx2-aeon` (the plan's stand-in until a `boss-trema` sketch is picked by ear).
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle and a silent post
 *   scene that shows results. The beats (TR13, TR14 a, TR15 out) are drafted in
 *   `docs/plans/trema-story-draft.md`; this track does not write `src/story`.
 * - `subtitle`, `blurb` and `sensorTexts` — our own words over research §2 and §7; no line
 *   is quoted.
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { tremaBuildFor, type TremaKitOption } from './ffx2/builds/via-infinito-kit.ts';
import type { EnemyGroupDef } from '../battle/common/types.ts';
import { CLOISTER_ACTION_TIME_ON, cloisterParagonGroup } from './ffx2/enemies/trema.ts';
import { cloisterParagonOversoulGroup, cloisterTremaArenaGroup } from './ffx2/enemies/trema-options.ts';

/** **Placeholder** story layer: open the battle, show the results, say nothing. */
export const TREMA_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** The kit the chapter is built with: Bailey's TR11 a. Change only on Bailey's word (see the header). */
export const TREMA_KIT_OPTION: TremaKitOption = 'tr11-a';

/**
 * **Option 1 (TR7 b), OFF: which Paragon link 1 is.** `'normal'` is Bailey's TR7 pick. `'oversoul'`
 * fights Oversoul Paragon (research §12.2; `./ffx2/enemies/paragon-oversoul.ts`, whose gaps are
 * named `[estimate]`s in `OVERSOUL_ESTIMATES`). Change only on Bailey's word.
 */
export const TREMA_PARAGON_FORM: TremaParagonForm = 'normal';
export type TremaParagonForm = 'normal' | 'oversoul';

/**
 * **Option 2 (TR1 b), OFF: the chapter's shape.** `'paragon-then-trema'` is Bailey's TR1 a.
 * `'trema-alone'` is one fight, the Fiend Arena Trema at full HP and MP (research §3.3;
 * `./ffx2/enemies/trema-options.ts`), and ignores {@link TREMA_PARAGON_FORM}. Change only on Bailey's word.
 */
export const TREMA_CHAPTER_SHAPE: TremaChapterShape = 'paragon-then-trema';
export type TremaChapterShape = 'paragon-then-trema' | 'trema-alone';

/** Option 3 (E4) is `CLOISTER_ACTION_TIME_ON` in `./ffx2/enemies/trema.ts`, re-exported here to sit with the others. */
export { CLOISTER_ACTION_TIME_ON };

/** The chapter's first formation for a shape and a Paragon form. The shipped pair is `cloisterParagonGroup`. */
export function tremaFirstGroup(shape: TremaChapterShape, form: TremaParagonForm): EnemyGroupDef {
  if (shape === 'trema-alone') return cloisterTremaArenaGroup;
  return form === 'oversoul' ? cloisterParagonOversoulGroup : cloisterParagonGroup;
}

/** The first link's music: "The Bevelle Underground" under Paragon (TR16 a); Trema's stand-in when he is alone. */
function tremaBattleCue(shape: TremaChapterShape): 'scene-bevelle-underground' | 'boss-ffx2-aeon' {
  return shape === 'trema-alone' ? 'boss-ffx2-aeon' : 'scene-bevelle-underground';
}

/** Chapter 13 (registered, unlisted). */
export const FFX2_TREMA: Chapter = {
  id: 'ffx2-trema',
  game: 'ffx2',
  number: 13, // TR17: after Chapter XII (Seymour Omnis), by registration (D-058)
  title: 'Trema', // TR17 (picked)
  subtitle: 'A hundred floors down, a man who wanted the past gone',
  location: 'Via Infinito — Cloister 100', // TR17 (picked)
  // Research §2 and §7, summarised in our own words. Placeholder card copy; the card itself is
  // not shown until the chapter is listed.
  blurb:
    'At the bottom of the dungeon under Bevelle, something that was once a lord of Yevon guards the last floor. ' +
    'Beat it, and the man who founded New Yevon steps out to finish it himself.',
  sceneKey: 'bevelle-underground', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-ffx2-trema',
  buildRef: tremaBuildFor(TREMA_KIT_OPTION),
  enemyGroupRef: tremaFirstGroup(TREMA_CHAPTER_SHAPE, TREMA_PARAGON_FORM),
  scriptsRef: TREMA_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    scene: 'scene-bevelle-underground',
    // TR16 a: "The Bevelle Underground" scores Paragon (research §6.3); option 2 has no Paragon.
    battle: tremaBattleCue(TREMA_CHAPTER_SHAPE),
    phase2: 'boss-ffx2-aeon', // TR16 a: the stand-in for `boss-trema`
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    paragon: 'Anything its guard cannot soften, it answers with everything it has.',
    trema: 'Nothing sticks to him. Watch his HP: at a half and at a quarter, the sky falls.',
  },
};
