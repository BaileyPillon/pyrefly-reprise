/**
 * The ids of the hidden Jenova LIFE chapter (FF7 only; hidden chapter 44, the typed word `bluelight`), in a module with no
 * imports of its own so the door (`app/screens/frontend/bluelightDoor.ts`) and the scene can name them without pulling in the
 * chapter record's graph (as `data/ffx/sanctuary-keeper-ids.ts` does).
 *
 * Game case (AGENTS.md rule 14): **FF7 only.** The ids name the fight of `research/ff7-jenova-life.md` §1 and §2 [verified: 3 sources for the boss and the place]; they carry no number.
 */

/** The chapter's id (`Chapter.id`, the key of the experiments' store). */
export const JENOVA_LIFE_CHAPTER_ID = 'ff7-jenova-life' as const;

/** The boss's combatant id (`./enemies/jenova-life.ts`). */
export const JENOVA_LIFE_ID = 'jenova-life' as const;

/** The scene key: the altar of the Forgotten Capital (`scenes/forgotten-capital.ts`). */
export const FORGOTTEN_CAPITAL_SCENE = 'forgotten-capital' as const;
