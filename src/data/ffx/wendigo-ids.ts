/**
 * The ids of the hidden **Wendigo** chapter (FFX only; `../chapter-wendigo.ts`; hidden chapter number 49, the word `wendigo`; branch `ch-wendigo`, 2026-11-06), in a module with no imports so that the scene, the door, the
 * data, the guide, the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/wendigo-rules.ts` keeps its own copy of the
 * combatant, script, row and flag ids, and `tests/unit/chapters/wendigo-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-wendigo-lake-macalania.md` (the game's own files: monster files `m212` Wendigo and `m213` the Guado Guardian, formation `maca02_01`, field event `maca0200`). The paper preflight is
 * `docs/plans/ch-wendigo-review.md`. **Not the Temple's Guardians** (`m141`, `./enemies/seymour-anima-macalania.ts`, Chapter VII): a different record and script.
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `wendigo`, `../../app/screens/frontend/wendigoDoor.ts`). */
export const WENDIGO_CHAPTER_ID = 'wendigo' as const;

/** The chapter's scene key (`../../scenes/wendigo-lake.ts`): the Macalania Temple's stage under this fight's staging, the stand-in for the frozen lake until the 3D stage lands. */
export const WENDIGO_SCENE = 'wendigo-lake' as const;

/** The formation (`maca02_01` in the game). */
export const WENDIGO_GROUP_ID = 'wendigo' as const;

/** The three combatants, in the game's actor order (20 the first Guardian, 21 Wendigo, 22 the second Guardian). */
export const LAKE_GUARDIAN_A_ID = 'lake-guardian-a' as const;
export const WENDIGO_ID = 'wendigo' as const;
export const LAKE_GUARDIAN_B_ID = 'lake-guardian-b' as const;
export const LAKE_GUARDIAN_IDS = [LAKE_GUARDIAN_A_ID, LAKE_GUARDIAN_B_ID] as const;

/** The painting keys (`public/art/characters/<key>/`). The Guardian reuses the Temple's painting (the same man-sized retainer); Wendigo has none yet, so the presenter draws its procedural silhouette. */
export const WENDIGO_SPRITE = 'wendigo' as const;
export const LAKE_GUARDIAN_SPRITE = 'guado-guardian' as const;

/** AI script ids (registered by `battle/ffx/ai/wendigo.ts` and `battle/ffx/ai/lake-guardian.ts`). */
export const WENDIGO_SCRIPT = 'wendigo' as const;
export const LAKE_GUARDIAN_SCRIPT = 'lake-guardian' as const;

/**
 * The move rows (`./enemies/wendigo-abilities.ts`). Every Wendigo row is named just "Attack" in the game; the names here are the lane's labels (the guides' words: "Punch", "Double Punch", "Raise Dukes").
 * The Guardians' Blizzara, Thundara, Protect and Shell are the player's own rows (command.bin 0x3046, 0x3047, 0x303B, 0x303A), used by their ids; so is Wendigo's plain Attack, the enemy's `plainAttack` (0x4000).
 */
export const WENDIGO_ROWS = {
  punch: 'wendigo-punch', // 0x407F, accuracy 120, used above half HP, 2 turns in 3
  haymaker: 'wendigo-haymaker', // 0x4080, never misses, the strong one on the lowest-HP member
  counterPunch: 'wendigo-counter-punch', // 0x4062, the reply while the arms are up
  raiseArms: 'wendigo-raise-arms', // 0x403B "Counterattack"
  lowerArms: 'wendigo-lower-arms', // 0x4063 "Cancel Counter"
  berserk: 'lake-berserk', // 0x400F, the Guardians' Berserk
  autoPotion: 'lake-auto-potion', // 0x4010, +1,000 on itself or on Wendigo
  eyeDrops: 'lake-eye-drops', // 0x200C, an item row a monster uses
  blizzara: 'blizzara', // 0x3046
  thundara: 'thundara', // 0x3047
  protect: 'protect', // 0x303B
  shell: 'shell', // 0x303A
} as const;

/** The `state.flags` keys the script's state lives in (the stage, the tactic and the tests read them; the battle layer keeps its own copy of the strings). */
export const WENDIGO_FLAGS = {
  /** The arms-up stance (the game's `v5` and its status property 61): true from the turn Wendigo raises them to the turn it lowers them, or until Sleep ends it. */
  arms: 'wendigo.arms',
  /** The stance's turn counter (the game's `v6`): 0 on the raise, 1 and 2 on the next two Wendigo turns, 3 after Sleep. */
  armTurns: 'wendigo.armTurns',
  /** The turns-since-the-arms counter (the game's `v7`): 10 at the start, 1 after the arms come down, 2 to 4 over the three attack turns. */
  cycle: 'wendigo.cycle',
} as const;
