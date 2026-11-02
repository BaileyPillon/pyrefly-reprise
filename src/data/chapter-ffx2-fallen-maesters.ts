/**
 * **The Fallen Maesters** (the Via Infinito's fixed floor fights 20, 40, 60 and 80: Aranea, the Black Elemental, Concherer and Chac; FFX-2's optional dungeon under Bevelle), a hidden chapter (branch `ch-maesters`).
 *
 * Bailey chose the chapter on 2026-10-18 (D-1039: "Spectral Keeper + Fallen Maesters (Recommended)", the alternatives "Spectral Keeper + Penance" and "six Dark Aeons + Fallen Maesters" rejected) and on 2026-11-02
 * wrote, relayed by the release driver: "i'll go with all of your recommendations please implement all the unimplemented chapters that i decided on". The driver's decisions, each the paper preflight's own
 * recommendation (`docs/handoff/ch-maesters.md` lists every pick with its alternative, "driver pick, his to overturn"): hidden behind the typed word **`infinito`** (`../app/screens/frontend/maestersDoor.ts`), chapter
 * number **30**, listing it on the board waits for his word (FM11); four links, each a fresh fight (FM1 b); normal versions only (FM2 a); the Lv 99 party of Chapter XIII, measured (FM3 a); the Via Infinito's own
 * stage (FM4 a); no Escape (FM8); a flagged stand-in cue (FM10).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 221, 69, 232 and 239 (`research/re-ffx2-fallen-maesters.md`). The shared plumbing it touches (the board's door table, the
 * chapter registry, the stat-setter adapter) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` — Chapter XIII's Lv 99 party, as it is (`./ffx2/builds/fallen-maesters.ts`).
 * - `enemyGroupRef` — floor 20's Aranea; the chain follows `nextGroupId`: the Black Elemental, Concherer, Chac (`./ffx2/enemies/fallen-maesters.ts`). Links 2 to 4 enter at full HP and MP (the floor's glyph), with no card.
 * - `sceneKey` — the Via Infinito's own (`../scenes/cloister-100.ts`): the game shares one battle map across every `stbv09` row, the four floors included.
 * - `scriptsRef` — the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-fallen-maesters.ts`).
 * - `music` — existing cues only: the FFX-2 field bed, `boss-ffx2-fallen-aeons` (our own take on "Aeons": a flagged stand-in, as Angra Mainyu's and the Tourist Trap's; Trema keeps `boss-trema`) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { fallenMaestersBuild } from './ffx2/builds/fallen-maesters.ts';
import { floor20AraneaGroup } from './ffx2/enemies/fallen-maesters.ts';
import { FALLEN_MAESTERS_ID, FALLEN_MAESTERS_SCENE, X2_ARANEA_ID, X2_BLACK_ELEMENTAL_ID, X2_CHAC_ID, X2_CONCHERER_ID } from './fallen-maesters-ids.ts';
import { ffx2FallenMaestersScripts } from '../story/scripts/ffx2-fallen-maesters.ts';

export { FALLEN_MAESTERS_ID } from './fallen-maesters-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-fallen-maesters.ts`, both read them). Our own words over the sourced beats. */
export const FALLEN_MAESTERS_TEXT = {
  title: 'The Fallen Maesters',
  subtitle: 'Four floors down the Via Infinito, four fiends that were once people',
  location: 'Via Infinito — floors 20, 40, 60 and 80',
  blurb:
    'Under Bevelle the dungeon goes down a hundred floors, and every twentieth is a Great Cloister with something waiting in it. ' +
    'A spider, a mirror, a shell and a stone: the glyph on each floor mends the girls, and nothing else will.',
} as const;

/** The chapter record. */
export const FFX2_FALLEN_MAESTERS: Chapter = {
  id: FALLEN_MAESTERS_ID,
  game: 'ffx2',
  number: 30, // after the other hidden chapters (19 to 26, 28; 27 is Mirror Aeons); 29 is the Spectral Keeper's; the card would say EXP, not XXX (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...FALLEN_MAESTERS_TEXT,
  sceneKey: FALLEN_MAESTERS_SCENE,
  thumbnailKey: 'chapter-ffx2-fallen-maesters',
  buildRef: fallenMaestersBuild,
  enemyGroupRef: floor20AraneaGroup,
  scriptsRef: ffx2FallenMaestersScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed, and the game's own for the Cloister (`research/ffx2-trema.md` §6.3)
    battle: 'boss-ffx2-fallen-aeons', // a flagged stand-in (FM10): our own take on "Aeons"; the cue Angra Mainyu, the Tourist Trap and Valefor at Besaid play; Trema keeps `boss-trema`
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_ARANEA_ID]: 'Four bites, then a cloud that poisons, stops and saps. Be ready for every fifth.',
    [X2_BLACK_ELEMENTAL_ID]: 'Almost no HP, almost no way in, and a gauge that never stops filling. End it before its Magic climbs.',
    [X2_CONCHERER_ID]: 'One crushing blow in four while the shell holds. A single hit of about twenty thousand cracks it.',
    [X2_CHAC_ID]: 'Stone, then shatter. She turns a girl to rock, and a blow on the rock destroys her. Slow her down.',
  },
};
