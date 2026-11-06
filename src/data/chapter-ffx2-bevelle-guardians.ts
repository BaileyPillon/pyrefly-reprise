/**
 * **The Guardians of the Bevelle Underground** (Georapella and the Precepts Guard on floor 3, the first Baralai on floor 7; FFX-2's Chapter 2 descent towards Vegnagun), a hidden chapter (branch `ch-bevelle-guardians`).
 *
 * Bailey wrote, relayed by the release driver, on 2026-11-06 (~00:30 EST) "implement all unimplemented chapters please" and (~00:55 EST) "yes on all these too", after 2026-10-31's "you make the executive decisions for the next
 * few days. i'll go with all of your recommendations". The decisions, each the paper preflight's own recommendation (`docs/plans/ch-drillshot-review.md`; `docs/handoff/ch-bevelle-guardians.md` lists every pick with its
 * alternative, "driver's call, his to overturn"): hidden behind the typed word **`drillshot`** (`../app/screens/frontend/drillshotDoor.ts`), chapter number **37**, listing it on the board waits for his word; three links,
 * each a fresh fight (BG1); the Chapter 2 party of the Bahamut fight, measured (BG2); the Bahamut chapter's stage for all three acts (BG3); no hit-count HUD, one callout (BG4); flagged stand-in cues (BG5); the Den of Woe shade
 * (row 176) is not rebuilt (BG6); the Oversoul versions are not built (BG7).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2 monster rows 262, 263 and 175 (`research/re-ffx2-bevelle-underground.md`). The shared plumbing it touches (the board's door table, the
 * chapter registry, the kill-reward item table) is "both" (CHK-020) and changes nothing for any other chapter.
 *
 * - `buildRef` — the Bahamut fight's Chapter 2 party, as it is (`./ffx2/builds/bevelle-guardians.ts`).
 * - `enemyGroupRef` — act 1's Georapella; the chain follows `nextGroupId`: the Precepts Guard, then Baralai (`./ffx2/enemies/bevelle-guardians.ts`). Links 2 and 3 enter at full HP and MP, with no card.
 * - `sceneKey` — the Bevelle Underground's own plate (`../scenes/bevelle-underground.ts`).
 * - `scriptsRef` — the story, a DRAFT for Bailey's read (`../story/scripts/ffx2-bevelle-guardians.ts`).
 * - `music` — existing cues only: the FFX-2 field bed, the formations' own (`boss-bahamut` for the two guardians, `boss-den-of-woe` for Baralai: flagged stand-ins) and the FFX-2 fanfare. Bailey's ears (rule 13).
 *
 * Not in `CHAPTERS` or `CHAPTER_IDS` (every chapter-generic suite and count stays the nineteen); `EXPERIMENT_CHAPTERS` in `./encounters.ts` lists it (built by `./chapters-experiments.ts`) and `getChapter` finds it.
 * A clear goes to the experiments' own store (`experimental: true`), never the save: no save change, no migration.
 */

import type { Chapter } from './encounters.ts';
import { bevelleGuardiansBuild } from './ffx2/builds/bevelle-guardians.ts';
import { georapellaGroup } from './ffx2/enemies/bevelle-guardians.ts';
import { BEVELLE_GUARDIANS_ID, BEVELLE_GUARDIANS_SCENE, X2_BARALAI_ID, X2_GEORAPELLA_ID, X2_PRECEPTS_GUARD_ID } from './bevelle-guardians-ids.ts';
import { ffx2BevelleGuardiansScripts } from '../story/scripts/ffx2-bevelle-guardians.ts';

export { BEVELLE_GUARDIANS_ID } from './bevelle-guardians-ids.ts';

/** The card's words (the chapter record and the pause metadata, `./chapter-meta-ffx2-bevelle-guardians.ts`, both read them). Our own words over the sourced beats. */
export const BEVELLE_GUARDIANS_TEXT = {
  title: 'The Bevelle Guardians',
  subtitle: 'Two keepers of the corridor, and a Praetor who counts the blows',
  location: 'Bevelle Underground — floors 3 and 7',
  blurb:
    'Under Bevelle the way down to Vegnagun is guarded. A tall shape that only casts, a keeper that tries every curse it has, ' +
    'and at the bottom of the stairs a man in the robes of Bevelle, who is counting.',
} as const;

/** The chapter record. */
export const FFX2_BEVELLE_GUARDIANS: Chapter = {
  id: BEVELLE_GUARDIANS_ID,
  game: 'ffx2',
  number: 37, // assigned by the program plan (row 37); the card would say EXP, not XXXVII (`ui/common/roman.ts` `chapterNumeral`)
  experimental: true,
  ...BEVELLE_GUARDIANS_TEXT,
  sceneKey: BEVELLE_GUARDIANS_SCENE,
  thumbnailKey: 'chapter-ffx2-bahamut', // a flagged stand-in: Chapter IV's card, the same dungeon (the chapter's own card is on the handoff's art list)
  buildRef: bevelleGuardiansBuild,
  enemyGroupRef: georapellaGroup,
  scriptsRef: ffx2BevelleGuardiansScripts,
  music: {
    scene: 'scene-bevelle-underground', // the FFX-2 chapters' field bed, and the Bahamut chapter's
    battle: 'boss-bahamut', // BG5, a flagged stand-in for acts 1 and 2; act 3 plays `boss-den-of-woe` (each formation's own cue)
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    [X2_GEORAPELLA_ID]: 'Four Ga spells in a ring, one a turn, on all three of you. Slow it, shell yourselves and heal.',
    [X2_PRECEPTS_GUARD_ID]: 'Demi a third of the time, then Slow, Death, Osmose or Drain. Keep Phoenix Downs ready, heal the Demi, and do not bother slowing it.',
    [X2_BARALAI_ID]: 'Every tenth blow on him calls Drill Shot on whoever struck it, three quarters of her life. A White Mage cannot strike him: Change Yuna to a Gunner.',
  },
};
