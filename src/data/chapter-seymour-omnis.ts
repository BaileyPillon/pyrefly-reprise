/**
 * Chapter XII — Seymour Omnis, the Garden of Pain inside Sin (FFX).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons, Nul spells, Focus
 * and the FFX status set (`research/ffx-seymour-omnis.md` §0.3: *X-2* has no
 * Seymour fight). He is fought **inside Sin**, after the *Fahrenheit*'s dive,
 * before Dream's End (our Chapter III) — not at Zanarkand (§0.4).
 *
 * Kept out of `./encounters.ts` for the house 400-line rule, like Chapters 7
 * to 11; the `Chapter` import is type-only, so there is no runtime cycle.
 *
 * ## Registered, reachable, and UNLISTED
 *
 * Bailey took every recommendation on 2026-09-25 ("I'll go with all your
 * recommendations"), but the art, the arena, the portrait, the HUD read of
 * the discs and the music those picks approve are not painted, built or
 * composed yet (B20 = ship LOCKED if the art is late). **B8 also holds the
 * listing**: the colour order around a disc (O-7) and the reset cycle (O-11)
 * are built as labelled estimates and the chapter is listed only once Bailey
 * confirms both. So this record sits in `UNLISTED_CHAPTERS`, the Chapter IX
 * to XI precedent: `getChapter`, the battle flow and
 * `window.__pyrefly.gotoChapter` reach it by id, and **chapter select does not
 * show it**.
 *
 * Every field below that a player would see or hear is Bailey's pick or a
 * **placeholder**, and says which:
 *
 * - `title` and `location` — **B1** (picked): "Seymour Omnis", "Inside Sin —
 *   the Garden of Pain", number XII (registered before Trema).
 * - `sceneKey: 'gagazet'` — **placeholder**. The Garden of Pain plate (O-3 C,
 *   deep violet, B21 = a) is picked and not painted; Chapter 1's diorama is
 *   the one every FFX chapter falls back on (the Natus precedent). Not
 *   `dreams-end`: a different place (research §7, B21).
 * - `music.battle: 'boss-seymour'` — **placeholder**, B18's named stand-in
 *   (Chapter I's cue) until the new Noble Rot cue is sketched and picked by
 *   ear (rules 8 and 13).
 * - `scriptsRef` — **placeholder**: a silent pre scene that opens the battle
 *   and a silent post scene that shows results. The story beats are drafted
 *   for Bailey in `docs/plans/omnis-story-draft.md`; this track does not write
 *   `src/story`.
 * - `subtitle` and `blurb` — our own summaries of research §8.2's sourced
 *   beats; no line is quoted.
 */

import type { Chapter } from './encounters.ts';
import type { ChapterScripts } from '../story/dsl.ts';
import { battleStart, results } from '../story/dsl.ts';
import { gardenOfPainBuild } from './ffx/builds/garden-of-pain.ts';
import { seymourOmnisGroup } from './ffx/enemies/seymour-omnis.ts';

/**
 * **Placeholder** story layer: open the battle, show the results, say nothing.
 * `ChapterScripts` requires a pre scene ending in `battleStart` and a post
 * scene containing `results` (`src/story/dsl.ts`).
 */
export const OMNIS_PLACEHOLDER_SCRIPTS: ChapterScripts = {
  pre: [battleStart()],
  post: [results()],
  victoryQuips: {},
  mid: [],
  midScripts: {},
};

/** Chapter 12 (registered, unlisted). */
export const SEYMOUR_OMNIS: Chapter = {
  id: 'seymour-omnis',
  game: 'ffx',
  number: 12, // D-058: registration order, before Trema (B1)
  title: 'Seymour Omnis', // B1 (picked)
  // research §8.2 beat 5, summarised: the last Seymour fight, and Yuna finally sends him.
  subtitle: 'The last of him, and the sending he refused',
  location: 'Inside Sin — the Garden of Pain', // B1 (picked)
  // research §8.2 beats 3-5 and §4.1, summarised. Placeholder card copy; the
  // card itself is not shown until the chapter is listed.
  blurb:
    'Sin took him in, and he waits at the top of the steps to say it chose him. ' +
    'Four discs turn behind him and decide every spell he casts.',
  sceneKey: 'gagazet', // PLACEHOLDER — see the file header
  thumbnailKey: 'chapter-seymour-omnis',
  buildRef: gardenOfPainBuild,
  enemyGroupRef: seymourOmnisGroup,
  scriptsRef: OMNIS_PLACEHOLDER_SCRIPTS, // PLACEHOLDER — see the file header
  music: {
    // PLACEHOLDER — B18 = a's stand-in (b) until the new cue is picked (O-6).
    // FFX cues only (THEMES.md never crosses the scores).
    scene: 'scene-gagazet',
    battle: 'boss-seymour',
    victory: 'victory-ffx',
  },
  // research §1.5 and §2, in our own words (the enemy records carry the same line).
  sensorTexts: {
    'seymour-omnis': 'The four discs behind him feed his magic.',
  },
};
