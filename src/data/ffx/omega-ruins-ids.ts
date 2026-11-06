/**
 * The ids of the hidden **Omega Ruins** chapter (FFX only; `../chapter-omega-ruins.ts`; hidden chapter number 43; branch `ch-omega-ruins`, 2026-11-06), in a module with no imports so that the scene, the door, the data, the
 * guide, the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`: `battle/ffx/ai/weapons-rules.ts` keeps its own copy of the combatant,
 * script, ability and flag ids, and `tests/unit/chapters/omega-ruins-data.test.ts` pins that the copies agree.
 *
 * Source of the fights: `research/re-ffx-omega-ultima-nemesis.md` (the game's own files: monster files `m99`, `m100` and `m276`, formations `omeg00_10`, `omeg01_10` and `zzzz02_76`). The paper preflight is
 * `docs/plans/ch-weapon-review.md` (WP1 to WP11, kept with the handoff `docs/handoff/ch-omega-ruins.md`). Three fights in a row, one chain: Ultima Weapon, Omega Weapon, Nemesis.
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `weapon`, `../../app/screens/frontend/weaponDoor.ts`). */
export const OMEGA_RUINS_CHAPTER_ID = 'omega-ruins' as const;

/** The chapter's scene key: one painted stage with the plate relit per act (`../../scenes/omega-ruins.ts`). */
export const OMEGA_RUINS_SCENE = 'omega-ruins' as const;

/**
 * The stage's plates (preflight WP5, option (a) as the first build): the approved Cavern of the Stolen Fayth plate for all three acts (a dark cave, shafts of cold light and a glowing ring platform on the floor),
 * the nearest existing plate to the ring of light the Ruins stage in the game (`research/re-ffx-omega-ultima-nemesis.md` 2). **A stand-in**: the Omega Ruins have no plate of their own; the relit variants (b) and a new plate (c)
 * wait for Bailey's pick (rule 9).
 */
export const OMEGA_RUINS_PLATE = 'cavern-stolen-fayth' as const;

/** The three formations as the chapter chains them (`omeg00_10`, `omeg01_10`, `zzzz02_76`). */
export const ULTIMA_GROUP_ID = 'omega-ruins-ultima' as const;
export const OMEGA_GROUP_ID = 'omega-ruins-omega' as const;
export const NEMESIS_GROUP_ID = 'omega-ruins-nemesis' as const;

/** Combatant ids (the three bodies; also the art subjects' names for the sprite lookup, `characters/<spriteKey>/`). */
export const ULTIMA_WEAPON_ID = 'ultima-weapon' as const;
export const OMEGA_WEAPON_ID = 'omega-weapon' as const;
export const NEMESIS_ID = 'nemesis' as const;

/**
 * The paintings' keys (`public/art/characters/<key>/`). **None is painted yet** (the stage draws its boss-silhouette stand-in; the art list is in `docs/handoff/ch-omega-ruins.md`); the keys are fixed here so a
 * painting drops in without a code change. Nemesis's is a flagged stand-in too: preflight WP6 recommends a recolour of Ultima Weapon's painting, so its key may point at that file's colour variant.
 */
export const ULTIMA_WEAPON_SPRITE = 'ultima-weapon' as const;
export const OMEGA_WEAPON_SPRITE = 'omega-weapon' as const;
export const NEMESIS_SPRITE = 'nemesis' as const;

/** AI script ids (registered by `battle/ffx/ai/ultima-weapon.ts`, `omega-weapon.ts` and `nemesis.ts`). */
export const ULTIMA_WEAPON_SCRIPT = 'ultima-weapon' as const;
export const OMEGA_WEAPON_SCRIPT = 'omega-weapon' as const;
export const NEMESIS_SCRIPT = 'nemesis' as const;

/**
 * The move rows (`../enemies/weapons-abilities.ts`): the fourteen the three monsters' own lists hold (monster magic 1 and 2). The rows the scripts add are the player's own (Holy 0x303F, Ultima 0x3053 and Demi 0x304E,
 * cast by a monster as the Keeper casts Curaga) and are used by their ids.
 */
export const WEAPON_ROWS = {
  /** Ultima Weapon's Attack, 0x407F: strength 16, accuracy formula 2 on a byte of 120 (it misses a party with Evasion 255). */
  ultimaAttack: 'ruins-ultima-attack',
  coreEnergy: 'ruins-core-energy', // 0x4022
  shimmeringRain: 'ruins-shimmering-rain', // 0x4023
  break: 'ruins-break', // 0x604F, Petrify 254
  silence: 'ruins-silence', // 0x606E
  confuse: 'ruins-confuse', // 0x6072
  sleep: 'ruins-sleep', // 0x6071
  /** Omega Weapon's Attack, 0x410F: strength 16, accuracy formula 0 (always hits), the 99,999 cap. */
  omegaAttack: 'ruins-omega-attack',
  /** Omega's own Nova, 0x4067: a monster row (magic 60), not Kimahri's Ronso Rage Nova (0x3073). */
  nova: 'ruins-nova',
  nemesisAttack: 'ruins-nemesis-attack', // 0x40F0
  etherealCannon: 'ruins-ethereal-cannon', // 0x40D8
  ultraSpark: 'ruins-ultra-spark', // 0x40D9
  armageddon: 'ruins-armageddon', // 0x40F4
  nemesisUltima: 'ruins-nemesis-ultima', // 0x40F3
  holy: 'holy', // 0x303F, the player's own row
  ultima: 'ultima', // 0x3053
  demi: 'demi', // 0x304E
} as const;

/** The `state.flags` keys the scripts' state lives in (the stage and the tests read them; the battle layer keeps its own copy of the strings). */
export const WEAPON_FLAGS = {
  /** Ultima Weapon's turn counter, 1 to 6 (the game's `v2`). */
  ultimaTurn: 'uw.turn',
  /** Omega Weapon's Nova counter (`v2`: +5 on an Attack, +2 on a special; Nova at 30) and its cycle position (`v3`, 1 to 4). */
  omegaCounter: 'ow.counter',
  omegaStep: 'ow.step',
  /** Nemesis's Armageddon counter (`v2`: +3 on an Attack, +2 on anything else; Armageddon at 20) and its cycle step (`v3`, 0 to 2). */
  nemesisCounter: 'nm.counter',
  nemesisStep: 'nm.step',
} as const;
