/**
 * The ids of the hidden **Oblitzerator** chapter (FFX only; `../chapter-oblitzerator.ts`; hidden chapter number 50, the word `blitz`; branch `ch-oblitzerator`, 2026-11-09), in a module with no imports so that the scene, the door,
 * the data, the guide, the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/oblitzerator-rules.ts` keeps its own copy of the
 * combatant, script, row and flag ids, and `tests/unit/chapters/oblitzerator-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-oblitzerator-crane.md` (the game's own files: monster files `m110` the Oblitzerator and `m133` the Luca crane, formation `cdsp02_00`, the Number 4 Dock at Luca). The paper preflight
 * is `docs/plans/ch-oblitzerator-review.md`.
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `blitz`, `../../app/screens/frontend/blitzDoor.ts`). */
export const OBLITZERATOR_CHAPTER_ID = 'oblitzerator' as const;

/** The chapter's scene key (`../../scenes/luca-dock.ts`): the Mushroom Rock Road's coast stage under this fight's staging, the stand-in for the Number 4 Dock until a dock plate is painted. */
export const OBLITZERATOR_SCENE = 'luca-dock' as const;

/** The formation (`cdsp02_00` in the game). */
export const OBLITZERATOR_GROUP_ID = 'oblitzerator' as const;

/** The two combatants, in the game's actor order (20 the Oblitzerator, 21 the crane). */
export const OBLITZERATOR_ID = 'oblitzerator' as const;
export const LUCA_CRANE_ID = 'luca-crane' as const;

/** The painting keys (`public/art/characters/<key>/`). Neither painting exists yet, so the presenter draws its procedural silhouette (the handoff's art list). */
export const OBLITZERATOR_SPRITE = 'oblitzerator' as const;
export const LUCA_CRANE_SPRITE = 'luca-crane' as const;

/** AI script ids (registered by `battle/ffx/ai/oblitzerator.ts` and `battle/ffx/ai/luca-crane.ts`). */
export const OBLITZERATOR_SCRIPT = 'oblitzerator' as const;
export const LUCA_CRANE_SCRIPT = 'luca-crane' as const;

/**
 * The move rows (`./enemies/oblitzerator-abilities.ts`). The names are the game's own (the guides' too: "Blitzball Rush", "Blind Ball", "Mute Ball", "Doze Ball"); the crane's row is just "Crane" in the game, and the
 * party's Trigger Command "Use crane". The commands the scripts read on the player's side (Thunder 0x3043, Thunder Fury 0x307a) are the player's own rows, used by their ids.
 */
export const OBLITZERATOR_ROWS = {
  rush: 'blitzball-rush', // 0x600C, its one action: ten balls spread at random over the living front line
  doze: 'doze-ball', // 0x600D, the Sleep counter (no player command reaches it: formula 2)
  blind: 'blind-ball', // 0x600E, the Darkness counter (a physical-formula command)
  mute: 'mute-ball', // 0x600F, the Silence counter (a magic-formula command)
  lift: 'crane-lift', // 0x6012 "Crane": 15/16 of the Oblitzerator's current HP, cast by the crane on the Oblitzerator
  useCrane: 'use-crane', // 0x3102, Tidus's Trigger Command
  thunder: 'thunder', // 0x3043, the player's Thunder: three casts at the crane power it
  thunderFury: 'thunder-fury', // 0x307a, Lulu's Thunder Fury: one hit powers it
} as const;

/** The `state.flags` keys the scripts' state lives in (the stage, the tactic and the tests read them; the battle layer keeps its own copy of the strings). */
export const OBLITZERATOR_FLAGS = {
  /** The Oblitzerator's phase (the game's `v3`): 0 above a third of its HP, 1 once it has dropped below a third (AGI + 15), 2 once below a twelfth (AGI + 10 more). */
  phase: 'oblitzerator.phase',
  /** The crane has lifted it (the game's `v2` = 255): it has no turns and no counters any more. */
  ended: 'oblitzerator.ended',
  /** The crane's state (the game's `v0`): 0 no power, 1 powered, 2 spent. */
  crane: 'oblitzerator.crane',
  /** How many Thunder casts the unpowered crane has answered (the game's `v2` of the crane): 0, 1, 2; the third powers it. */
  thunders: 'oblitzerator.thunders',
  /** Tidus has pointed out the crane (the first-turn scene, RE 2), once. */
  pointed: 'oblitzerator.pointed',
} as const;

/** The `script-trigger` names the scripts raise for the chapter's banners (mirrored in `../../story/scripts/oblitzerator.ts`; a test pins the pair). */
export const OBLITZERATOR_CALLOUTS = {
  /** Tidus's first turn: the crane is pointed out. */
  point: 'oblitzerator-point',
  /** The first and the second Thunder at the crane: it answers. */
  responds1: 'oblitzerator-responds-1',
  responds2: 'oblitzerator-responds-2',
  /** The third Thunder (or a Thunder Fury): the crane has power. */
  powered: 'oblitzerator-powered',
  /** "Use crane" before the crane has power: it does nothing, and Tidus and Lulu say so. */
  noPower: 'oblitzerator-no-power',
  /** "Use crane" on the powered crane: the Oblitzerator is lifted. */
  lifted: 'oblitzerator-lifted',
} as const;
