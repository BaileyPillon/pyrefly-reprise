/**
 * **Gullwings, Chapter 1** (Boris at the Floating Ruins' summit, the Flame Dragon in Besaid's cave, the Guardian Beast in the Zanarkand Ruins, YSLS-Zero at Kilika's approach; FFX-2's Chapter 1 hotspot missions), a hidden
 * chapter, number 51 (branch `ch-gullwings-ch1`).
 *
 * Authority (relayed by the release driver, verbatim): 2026-11-09 "Keep going please with everything you were doing"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too" (every researched
 * boss he never picked); 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations". The decisions, each the paper preflight's own recommendation
 * (`docs/plans/ch-dragon-review.md`; `docs/handoff/ch-gullwings-ch1.md` lists every pick with its alternative, "driver's call, his to overturn"): hidden behind the typed word **`dragon`**
 * (`../app/screens/frontend/dragonDoor.ts`), chapter number **51**, listing it on the board waits for his word; four links in the hotspot order of the guides, each a fresh fight (DR1); a new Chapter 1 party, levels an
 * estimate, measured (DR2, DR3); the Zanarkand Dome's plate for all four acts, flagged (DR4); the "battle too long" blocks ported (DR5); the Oversoul forms not built (DR6); flagged stand-in cues (DR8); Sticky End a one-shot,
 * as the file has it (DR10).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 132, 122, 162 and 47 (`research/re-ffx2-gullwings-chapter1.md`). The shared plumbing it touches (the board's door table, the
 * chapter registry, the kill-reward item table) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` — the Chapter 1 party, Yuna a Gunner, Rikku a Thief, Paine a Warrior, levels an `[estimate]` (`./ffx2/builds/gullwings-ch1.ts`).
 * - `enemyGroupRef` — act 1's Boris; the chain follows `nextGroupId`: the Flame Dragon, the Guardian Beast, then YSLS-Zero (`./ffx2/enemies/gullwings-ch1.ts`). Links 2 to 4 enter at full HP and MP, with no card.
 * - `sceneKey` — the Zanarkand Dome's plate (`../scenes/zanarkand-dome.ts`), a flagged stand-in for all four acts.
 * - `scriptsRef` — the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-gullwings-ch1.ts`).
 * - `music` — existing cues only: the FFX-2 field bed, the formations' own (`boss-ffx2-fallen-aeons`, a flagged stand-in) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { gullwingsCh1Build } from './ffx2/builds/gullwings-ch1.ts';
import { borisGroup } from './ffx2/enemies/gullwings-ch1.ts';
import { GULLWINGS_CH1_ID, GULLWINGS_CH1_SCENE, X2_BORIS_ID, X2_FLAME_DRAGON_ID, X2_GUARDIAN_BEAST_ID, X2_YSLS_ZERO_ID } from './gullwings-ch1-ids.ts';
import { ffx2GullwingsCh1Scripts } from '../story/scripts/ffx2-gullwings-ch1.ts';

export { GULLWINGS_CH1_ID } from './gullwings-ch1-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-gullwings-ch1.ts`, both read them). Our own words over the sourced beats. */
export const GULLWINGS_CH1_TEXT = {
  title: 'Gullwings, Chapter 1',
  subtitle: 'Four hotspots, four guardians', // one line on the prep card at 1600x900 (the longer one ran to three)
  location: 'The Floating Ruins, Besaid, Zanarkand and Kilika',
  // Short enough to read whole on the prep card at 1600x900 (the first draft was clipped mid-sentence; the card scrolls, but nobody should have to).
  blurb: 'The Gullwings have only just learned that a sphere can be worth the trouble. A spider, a dragon, a beast and a machine each guard one, and each has a trick.',
} as const;

/** The Gullwings, Chapter 1 chapter record. */
export const FFX2_GULLWINGS_CH1: Chapter = {
  id: GULLWINGS_CH1_ID,
  game: 'ffx2',
  number: 51, // assigned by the program plan (wave 5, row 51); the card would say EXP, not LI (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...GULLWINGS_CH1_TEXT,
  sceneKey: GULLWINGS_CH1_SCENE,
  thumbnailKey: 'chapter-ffx2-gullwings-ch1', // no painting yet (the art list is on the handoff); the board shows no card for a hidden chapter
  buildRef: gullwingsCh1Build,
  enemyGroupRef: borisGroup,
  scriptsRef: ffx2GullwingsCh1Scripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed (a flagged stand-in)
    battle: 'boss-ffx2-fallen-aeons', // DR8, a flagged stand-in: the cue Ifrit, Valefor and Angra Mainyu play (each formation's own cue)
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_BORIS_ID]: 'Three claws, then a web that hits all three of you and may stop one, once. After that it is claws and the odd bite. Fire or Ice.',
    [X2_FLAME_DRAGON_ID]: 'The first thing it does is breathe fire on all three of you. After that it hits whoever is healthiest. Ice hurts it; Fire barely does.',
    [X2_GUARDIAN_BEAST_ID]: 'Three swipes, then a curse that keeps a girl from changing dress. When it is weak, half of everyone’s life at once. Any element hurts it.',
    [X2_YSLS_ZERO_ID]: 'Half your life in one punch, and a double blow that almost finishes you. Keep a healer going every turn: neither Protect nor Shell blunts that punch.',
  },
};
