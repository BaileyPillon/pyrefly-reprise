/**
 * The ids of the hidden **Spectral Keeper** chapter (FFX only; `../chapter-spectral-keeper.ts`; hidden chapter number 29; branch `ch-keeper`, 2026-11-02), in a module with no imports so that the scene, the door, the data, the guide,
 * the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/spectral-keeper-rules.ts` keeps its own copy of the combatant,
 * script and ability ids, and `tests/unit/chapters/spectral-keeper-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-spectral-keeper.md` (the game's own files: monster files `m129` the Keeper and `m146` the Circle, formation `dome02_00`, launching event `dome0200`). The paper preflight is
 * `docs/plans/ch-keeper-review.md` (SK1 to SK14, kept with the handoff `docs/handoff/ch-keeper.md`).
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `keeper`, `../../app/screens/frontend/keeperDoor.ts`). */
export const SPECTRAL_KEEPER_CHAPTER_ID = 'spectral-keeper' as const;

/** The chapter's scene key: the Zanarkand Dome's plate with the glyph ring's staging (`../../scenes/spectral-keeper.ts`). */
export const SPECTRAL_KEEPER_SCENE = 'spectral-keeper' as const;

/** The formation (`dome02_00` in the game) and the Keeper's combatant id. */
export const SPECTRAL_KEEPER_GROUP_ID = 'spectral-keeper' as const;
export const SPECTRAL_KEEPER_ID = 'spectral-keeper' as const;

/** The seven Circles (the game's actors 21 to 27): `spectral-circle-1` to `-6` are the ring's platforms 1 to 6, `spectral-circle-7` the aeon rock. */
export const SPECTRAL_CIRCLE_IDS = [
  'spectral-circle-1',
  'spectral-circle-2',
  'spectral-circle-3',
  'spectral-circle-4',
  'spectral-circle-5',
  'spectral-circle-6',
  'spectral-circle-7',
] as const;

/** The battle-state flag that says a Circle is armed (a lit mine); the stage lights that glyph's ring by it. The battle layer keeps its own copy of the prefix (`ARMED_PREFIX`). */
export const SPECTRAL_ARMED_FLAG_PREFIX = 'plat.armed.' as const;

/** The battle-state flags that say who stands where (`plat.at.<member>` holds a platform number, 1 to 6, 7 for the rock); the stage shows a glyph's occupied picture by them. The battle layer keeps its own copy (`AT_PREFIX`). */
export const SPECTRAL_AT_FLAG_PREFIX = 'plat.at.' as const;

/** The glyph painting in its three states and the aeon rock (ground decals, square, `public/art/decals/`; r75-boss-art, the driver's picks under Bailey's delegation, item 219m). One painting serves all six platforms; the rock has one picture. */
export const SPECTRAL_GLYPH_DECALS = {
  unlit: 'art/decals/spectral-glyph-unlit.png',
  occupied: 'art/decals/spectral-glyph-occupied.png',
  mined: 'art/decals/spectral-glyph-mined.png',
} as const;
export const SPECTRAL_ROCK_DECAL = 'art/decals/spectral-aeon-rock.png' as const;

/** AI script ids (registered by `battle/ffx/ai/spectral-keeper.ts`). */
export const SPECTRAL_KEEPER_SCRIPT = 'spectral-keeper' as const;
export const SPECTRAL_CIRCLE_SCRIPT = 'spectral-circle' as const;

/** The move rows (`../enemies/spectral-keeper-abilities.ts`; the game's rows 0x6045, 0x6047, 0x604D, 0x6048, 0x6049, 0x604E, and the party command 0x3103). */
export const SPECTRAL_ROWS = {
  tail: 'keeper-berserk-tail',
  sweep: 'keeper-attack-all',
  mine: 'keeper-glyph-mine',
  blast: 'keeper-mine-blast',
  fizzle: 'keeper-mine-fizzle',
  aeonAttack: 'keeper-aeon-attack',
  move: 'move',
} as const;
