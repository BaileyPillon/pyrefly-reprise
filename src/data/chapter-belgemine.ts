/**
 * **Belgemine's Challenge**: a NEW, HIDDEN FFX chapter (branch `ch-belgemine`, built 2026-11-09; hidden chapter number 45): the eight aeon duels the old summoner Belgemine fights at the Remiem Temple (Valefor, Ifrit, Ixion,
 * Shiva, Bahamut, Yojimbo with his dog, Anima, and the Magus Sisters), as one chain of eight duels.
 *
 * Bailey, relayed by the release driver, verbatim: "implement all unimplemented chapters please" (2026-11-06 about 00:30 EST), "yes on all these too" (about 00:55 EST), "ok keep going we have full usage here" (2026-11-07), and,
 * 2026-10-31, "you make the executive decisions for the next few days. i'll go with all of your recommendations." The driver's decisions under those words (BD1 to BD10) are in `docs/plans/ch-belgemine-review.md` and the handoff
 * `docs/handoff/ch-belgemine.md` ("driver's call, his to overturn"): the eight Remiem duels only (the three field duels wait on a per-act party seam, BD1), hidden behind the typed word `sidequest`, hidden chapter **number 45**,
 * not listed.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: Belgemine's duels are fought with FFX's CTB engine, Yuna's FFX aeons and the FFX monster files; nothing here applies to FFX-2, where aeons are enemies of another kind.
 *
 * **The chapter in one paragraph.** Yuna stands alone in the Remiem Temple's court and Belgemine calls her aeons one by one. Yuna summons, orders and shields; she cannot call the aeon Belgemine holds (the mirror lock), and her own
 * menu is Summon and Grand Summon, nothing else (the formation scripts switch the rest off). A duel ends when one side's aeon falls. In the game a lost duel ends "player escaped", never a game over; here the chain's ordinary retry
 * stands in for it and costs nothing. Every number the enemy aeons carry is the script's own for that battle (`research/re-ffx-belgemine-aeon-duels.md`): Ixion braces and evades, Bahamut waits five turns, Anima grows angry only when
 * struck, the Sisters guard one another. The party is the lever (BD2): the bench measured it (`docs/handoff/ch-belgemine.md`), never a duel row.
 *
 * **It is an experiment-class hidden chapter, not a listed one**, exactly as the Dark Aeons and the Sanctuary Keeper are: `experimental: true` sends its attempts, clears and play time to the experiments' own store
 * (`../app/experiments/experimentRecords.ts`), never to the save, so there is no save change and it is out of the board's counts. It is not in `CHAPTERS` or `CHAPTER_IDS`; `EXPERIMENT_CHAPTERS` lists it
 * (`./chapters-experiments.ts`) and `getChapter` finds it.
 */

import type { Chapter } from './encounters.ts';
import { belgemineBuild } from './ffx/builds/belgemine.ts';
import { belgemineFirstGroup } from './ffx/enemies/belgemine.ts';
import { belgemineScripts } from '../story/scripts/belgemine.ts';
import { BELGEMINE_CHAPTER_ID, BELGEMINE_NUMBER, BELGEMINE_SCENE } from './ffx/belgemine-ids.ts';

export { BELGEMINE_CHAPTER_ID, BELGEMINE_SCENE }; // the ids live in `./ffx/belgemine-ids.ts` (no imports), so the scene and the door can name them without this record's graph

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-belgemine.ts`, both read them). Our own words over the research's sourced beats; no number in them. */
export const BELGEMINE_TEXT = {
  title: "Belgemine's Challenge",
  subtitle: 'Eight aeons, one old summoner',
  blurb:
    'In the temple at Remiem the summoner Belgemine calls her aeons one by one, and Yuna must answer each with her own. ' +
    'Learn how every one of them fights. A lost duel costs nothing.',
} as const;

/** Number 45: the program plan's row (34 to 44 and 46 on are the sibling chapter lanes'), so no two chapters share a number (`tests/unit/chapter-numbers.test.ts`). It is no board number: the card says EXP, the eyebrow EXPERIMENTAL. */
export const BELGEMINE: Chapter = {
  id: BELGEMINE_CHAPTER_ID,
  game: 'ffx',
  number: BELGEMINE_NUMBER,
  experimental: true,
  ...BELGEMINE_TEXT,
  location: 'Remiem Temple',
  sceneKey: BELGEMINE_SCENE,
  thumbnailKey: 'chapter-belgemine', // a key only (the card and thumbnail are held until Bailey's word to list the chapter): nothing loads it while the chapter is hidden
  buildRef: belgemineBuild,
  enemyGroupRef: belgemineFirstGroup,
  scriptsRef: belgemineScripts,
  music: {
    // The temple's own bed under the scenes (`scene-macalania-temple`, the game's temple interior cue by reference) and the aeon contest's cue under the duels (`boss-isaaru`, Chapter XIV's: a flagged stand-in, BD8; rule 13: Bailey's ear).
    scene: 'scene-macalania-temple',
    battle: 'boss-isaaru',
    victory: 'victory-ffx',
  },
  // Sensor- and Scan-immune, all of them (RE 0): the game has no line to paraphrase.
  sensorTexts: {},
};
