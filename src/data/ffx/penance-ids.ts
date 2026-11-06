/**
 * The ids of the hidden **Penance** chapter (FFX only; `../chapter-penance.ts`; hidden chapter number 35; branch `ch-penance`, 2026-11-06), in a module with no imports so that the scene, the door, the data, the guide,
 * the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/penance-rules.ts` keeps its own copy of the combatant,
 * script and ability ids, and `tests/unit/chapters/penance-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-penance.md` (the game's own files: monster files `m344` Penance, `m345` the Right Arm and `m346` the Left Arm, formation `hiku15_70`). The paper preflight is
 * `docs/plans/ch-penance-review.md` (P1 to P12, kept with the handoff `docs/handoff/ch-penance.md`).
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `judgment`, `../../app/screens/frontend/judgmentDoor.ts`). */
export const PENANCE_CHAPTER_ID = 'penance' as const;

/** The chapter's scene key: the Fahrenheit's deck as Chapter VIII draws it, with Penance and its two arms staged (`../../scenes/penance.ts`). */
export const PENANCE_SCENE = 'penance' as const;

/** The formation (`hiku15_70` in the game) and the three combatants' ids (actors 20, 21 and 22: Penance, the Right Arm, the Left Arm). */
export const PENANCE_GROUP_ID = 'penance' as const;
export const PENANCE_ID = 'penance' as const;
export const PENANCE_RIGHT_ARM_ID = 'penance-right-arm' as const;
export const PENANCE_LEFT_ARM_ID = 'penance-left-arm' as const;

/**
 * The paintings' keys (`public/art/characters/<key>/`): Penance whole (phase 1), Penance with the lower half gone (phase 2), and one arm per side (the left is the right's mirror image, made when the
 * set is installed). **None is painted yet** (the stage draws its boss-silhouette stand-in); the keys are fixed here so the paintings drop in without a code change.
 */
export const PENANCE_SPRITES = {
  whole: 'penance',
  split: 'penance-split',
  rightArm: 'penance-arm-right',
  leftArm: 'penance-arm-left',
} as const;

/** AI script ids (registered by `battle/ffx/ai/penance.ts`). */
export const PENANCE_SCRIPT = 'penance' as const;
export const PENANCE_RIGHT_ARM_SCRIPT = 'penance-arm-right' as const;
export const PENANCE_LEFT_ARM_SCRIPT = 'penance-arm-left' as const;

/**
 * The move rows (`../enemies/penance-abilities.ts`). Nine are new (the game's rows 0x411F to 0x4122, 0x4124 to 0x4126, 0x4129, 0x412A); three are the Dark Aeons' rows, the same game rows the Right Arm and the Left Arm share with them
 * (Calamity 0x4104, the Right Arm's Attack 0x4127, the dispelling Attack 0x412B: `dark-calamity`, `dark-sandy-attack`, `dark-cindy-attack`); the Left Arm's Slowga is the party's own row 0x3039.
 */
export const PENANCE_ROWS = {
  immolation: 'penance-immolation', // 0x411F
  obliteration: 'penance-obliteration', // 0x4120
  judgmentDay: 'penance-judgment-day', // 0x4121
  separation: 'penance-separation', // 0x4122
  death: 'penance-death', // 0x4124
  regeneration: 'penance-regeneration', // 0x4125
  atrophy: 'penance-atrophy', // 0x4126
  teraGraviton: 'penance-tera-graviton', // 0x4129
  mightyGuard: 'penance-mighty-guard', // 0x412A
  /** The Right Arm's Attack (0x4127), Calamity (0x4104) and the Left Arm's dispelling Attack (0x412B): the Dark Aeons' rows, by their ids. */
  armAttack: 'dark-sandy-attack',
  calamity: 'dark-calamity',
  dispellingAttack: 'dark-cindy-attack',
  /** The Left Arm's Slowga (0x3039): the party's own row. */
  slowga: 'slowga',
} as const;
