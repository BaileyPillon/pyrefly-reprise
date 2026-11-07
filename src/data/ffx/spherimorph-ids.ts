/**
 * The ids of the hidden **Spherimorph** chapter (FFX only; `../chapter-spherimorph.ts`; hidden chapter number 41; branch `ch-spherimorph`, 2026-11-06), in a module with no imports so that the scene, the door, the
 * data, the guide, the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/spherimorph-rules.ts` keeps its own copy of
 * the combatant, script and ability ids, and `tests/unit/chapters/spherimorph-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-spherimorph.md` (the game's own files: monster file `m121`, formation `mcfr03_00`). The paper preflight is `docs/plans/ch-spherimorph-review.md` (SP1 to SP10, kept with the
 * handoff `docs/handoff/ch-spherimorph.md`).
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `spherimorph`, `../../app/screens/frontend/spherimorphDoor.ts`). */
export const SPHERIMORPH_CHAPTER_ID = 'spherimorph' as const;

/** The chapter's scene key: the Macalania Temple's plate with Spherimorph staged (`../../scenes/spherimorph.ts`). */
export const SPHERIMORPH_SCENE = 'spherimorph' as const;

/** The formation (`mcfr03_00` in the game) and Spherimorph's combatant id (actor 20). */
export const SPHERIMORPH_GROUP_ID = 'spherimorph' as const;
export const SPHERIMORPH_ID = 'spherimorph' as const;

/** The painting's key (`public/art/characters/<key>/`). **Painted in the r77 art install** (the driver's pick, not Bailey's approval; a tree without it draws the stage's boss-silhouette stand-in). */
export const SPHERIMORPH_SPRITE = 'spherimorph' as const;

/** AI script id (registered by `battle/ffx/ai/spherimorph.ts`). */
export const SPHERIMORPH_SCRIPT = 'spherimorph' as const;

/**
 * The move rows (`./enemies/spherimorph-abilities.ts`): the seven the monster file's own list and its script use (monster magic 2, rows 0x6036, 0x6039 to 0x603C and 0x603F). The four player-side spells the script
 * adds at init (Blizzard 0x3041, Fire 0x3042, Thunder 0x3043, Water 0x3044) are the player's own rows, used by their ids, as the Seymour and Keeper scripts use theirs; so is the plain Attack 0x6000 (the enemy's
 * `plainAttack`). Each of the spells is reflectable.
 */
export const SPHERIMORPH_ROWS = {
  fire: 'spherimorph-fire', // 0x6039, the monster-side spell, aimed at the front line
  blizzard: 'spherimorph-blizzard', // 0x603A
  thunder: 'spherimorph-thunder', // 0x603B
  water: 'spherimorph-water', // 0x603C
  shift: 'spherimorph-elemental-shift', // 0x6036, the no-damage action it queues on itself after a shift
  press: 'spherimorph-press', // 0x603F, half of the target's current HP
  playerFire: 'fire', // 0x3042, the player-side spell, aimed at the attacker (or, with an aeon on the field, at the front line)
  playerBlizzard: 'blizzard', // 0x3041
  playerThunder: 'thunder', // 0x3043
  playerWater: 'water', // 0x3044
} as const;

/** The `state.flags` keys the script's state lives in (the stage and the tests read them; the battle layer keeps its own copy of the strings). */
export const SPHERIMORPH_FLAGS = {
  /** The four-state weakness machine (the game's `v6`): 0 weak Fire, 1 weak Ice, 2 weak Thunder, 3 weak Water. */
  state: 'sm.state',
  /** The Doublecast gate (the game's `v20`): set when the first spell of a pair was ignored. */
  doublecast: 'sm.doublecast',
  /** How many times the state has shifted this battle (presentation and the bench; the game has no such counter). */
  shifts: 'sm.shifts',
  /** The hint banners already shown (the game's `v13`): 0 none, 1 the first, 2 the second. */
  hints: 'sm.hints',
} as const;

/** The `script-trigger` names the script emits for its two banners (mirrored in `../../story/scripts/spherimorph.ts`; a test pins the pair). */
export const SPHERIMORPH_CALLOUTS = {
  first: 'spherimorph-hint-first',
  second: 'spherimorph-hint-second',
} as const;
