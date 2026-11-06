/**
 * The ids of the hidden **Sanctuary Keeper** chapter (FFX only; `../chapter-sanctuary-keeper.ts`; hidden chapter number 39; branch `ch-sanctuary-keeper`, 2026-11-06), in a module with no imports so that the scene, the
 * door, the data, the guide, the tactic and the battle layer's seams can all name them without pulling each other's graphs in. The battle layer does not import `src/data`:
 * `battle/ffx/ai/sanctuary-keeper-rules.ts` keeps its own copy of the combatant, script and ability ids, and `tests/unit/chapters/sanctuary-keeper-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-sanctuary-keeper.md` (the game's own files: monster file `m128`, formation `mtgz08_00`, field event `mtgz0800`). The paper preflight is `docs/plans/ch-beast-review.md`
 * (SK1 to SK10, kept with the handoff `docs/handoff/ch-sanctuary-keeper.md`). **Not the Spectral Keeper** (`m129`, the Zanarkand Dome, `./spectral-keeper-ids.ts`): a different monster, record and script.
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `beast`, `../../app/screens/frontend/beastDoor.ts`). */
export const SANCTUARY_KEEPER_CHAPTER_ID = 'sanctuary-keeper' as const;

/** The chapter's scene key: Chapter I's Mt. Gagazet plate with the Keeper staged (`../../scenes/sanctuary-keeper.ts`). */
export const SANCTUARY_KEEPER_SCENE = 'sanctuary-keeper' as const;

/** The formation (`mtgz08_00` in the game) and the Keeper's combatant id (actor 20). */
export const SANCTUARY_KEEPER_GROUP_ID = 'sanctuary-keeper' as const;
export const SANCTUARY_KEEPER_ID = 'sanctuary-keeper' as const;

/**
 * The painting's key (`public/art/characters/<key>/`). **Not painted yet** (the stage draws its boss-silhouette stand-in); the key is fixed here so the painting drops in without a code change.
 * Th'uban (`m282`, program row 54, the wiki's colour swap of this monster) is meant to reuse the same painting.
 */
export const SANCTUARY_KEEPER_SPRITE = 'sanctuary-keeper' as const;

/** AI script id (registered by `battle/ffx/ai/sanctuary-keeper.ts`). */
export const SANCTUARY_KEEPER_SCRIPT = 'sanctuary-keeper' as const;

/**
 * The move rows (`../enemies/sanctuary-keeper-abilities.ts`): the three the Keeper's own list holds (monster magic 2, rows 0x6042 to 0x6044). The rows the script adds at init are the player's own
 * (Curaga 0x302D, Esuna 0x3033, Protect 0x303B, Reflect 0x303C, Regen 0x303E, Haste 0x3036 as a counter) and the plain Attack 0x6000: they use the player rows by their ids, as the Evrae, Seymour and
 * possessed-aeon scripts do.
 */
export const SANCTUARY_ROWS = {
  photonWings: 'sanctuary-photon-wings', // 0x6042
  manaBreath: 'sanctuary-mana-breath', // 0x6043
  tailSweep: 'sanctuary-tail-sweep', // 0x6044
  curaga: 'curaga', // 0x302D
  esuna: 'esuna', // 0x3033
  protect: 'protect', // 0x303B
  reflect: 'reflect', // 0x303C
  regen: 'regen', // 0x303E
  haste: 'haste', // 0x3036
} as const;

/** The `state.flags` keys the script's state lives in (the stage and the tests read them; the battle layer keeps its own copy of the strings). */
export const SANCTUARY_FLAGS = {
  /** The cycle state, 0 to 5 (the game's `v1`): 0 Photon Wings, 1 and 2 Attack, 3 Mana Breath, 4 and 5 the support turns. */
  cycle: 'sk.cycle',
  /** The phase and the "area" index, 0 to 3 (the game's `v0`): it rises as HP falls under three quarters, one half and one quarter of the maximum; the four areas hold identical start positions, so the area is presentation only. */
  phase: 'sk.phase',
  /** The hit counter (the game's `v9`): counted actions that changed its HP since the last Tail Sweep. */
  count: 'sk.count',
} as const;
