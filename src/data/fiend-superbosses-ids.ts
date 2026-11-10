/**
 * The ids of the hidden FFX-2 chapter **The Fiend Arena Superbosses** (two acts: Almighty Shinra, then the Major Numerus with its seven actors; branch `ch-fiend-superbosses`; program row 53, the door word is `legion`),
 * in one dependency-free place: the enemy data, the records, the AI scripts, the chapter record and the tests all read these, so none of them imports another's module just for a string. **FFX-2 only** [AGENTS.md rule 14].
 */

/** The chapter's id: its key in the experiments' store. */
export const FIEND_SUPERBOSSES_ID = 'ffx2-fiend-superbosses' as const;

/** The two formations (the act, then the fight), in play order. Act 1 chains to act 2 by `nextGroupId`. */
export const ACT_1_GROUP_ID = 'ffx2-fiend-superbosses-1-shinra';
export const ACT_2_GROUP_ID = 'ffx2-fiend-superbosses-2-numerus';
export const FIEND_SUPERBOSSES_GROUP_IDS = [ACT_1_GROUP_ID, ACT_2_GROUP_ID] as const;

/** Almighty Shinra (act 1), the four heads of the Major Numerus (act 2, the only ones with real HP) and its three hidden parts. The FFX-2 ids carry `x2-` because nothing of FFX shares them. */
export const X2_ALMIGHTY_SHINRA_ID = 'x2-almighty-shinra';
export const X2_NUMERUS_UNUM_ID = 'x2-numerus-unum';
export const X2_NUMERUS_DUO_ID = 'x2-numerus-duo';
export const X2_NUMERUS_TRIA_ID = 'x2-numerus-tria';
export const X2_NUMERUS_QUATTOUR_ID = 'x2-numerus-quattour';
export const X2_NUMERUS_BODY_ID = 'x2-numerus-body';
export const X2_NUMERUS_POD_ID = 'x2-numerus-pod';
export const X2_NUMERUS_TAIL_ID = 'x2-numerus-tail';

/** The four heads in the game's slot order (Unum 2, Duo 3, Tria 4, Quattour 5 of the formation; the body is slot 1, the pod 6, the tail 7: RE section 2). */
export const NUMERUS_HEAD_IDS = [X2_NUMERUS_UNUM_ID, X2_NUMERUS_DUO_ID, X2_NUMERUS_TRIA_ID, X2_NUMERUS_QUATTOUR_ID] as const;
/** The three hidden parts: 1 HP, no moves, no loot; the body and the tail switch themselves off in their scripts, the pod's targetability is unknown (RE section 8, U2). */
export const NUMERUS_PART_IDS = [X2_NUMERUS_BODY_ID, X2_NUMERUS_POD_ID, X2_NUMERUS_TAIL_ID] as const;

/** The monster rows (`monster.bin`, `research/re-ffx2-fiend-arena-superbosses.md` section 0): Shinra 329, the heads 330 to 333, the body 334, the pod 335, the tail 336. */
export const FIEND_SUPERBOSSES_ROWS = [329, 330, 331, 332, 333, 334, 335, 336] as const;

/**
 * The paintings: STAND-INS, existing paintings the fight renders with until the art lane delivers (the handoff's art list names the new subjects). Shinra has no painting (the Gullwings' Shinra is a boy; no file of
 * him exists), so `trema` (a full-size humanoid superboss of the same arena, the four poses idle, attack, cast, hurt) stands in; the four heads wear four different Via Infinito fiends so the player can tell them apart
 * (`x2-aranea`, `x2-black-elemental`, `x2-concherer`, `x2-chac`, each with idle, attack, cast, hurt); the three hidden parts are never drawn and name Vegnagun's body and tail only so the key resolves.
 */
export const SHINRA_SPRITE = 'trema';
export const UNUM_SPRITE = 'x2-aranea';
export const DUO_SPRITE = 'x2-black-elemental';
export const TRIA_SPRITE = 'x2-concherer';
export const QUATTOUR_SPRITE = 'x2-chac';
export const NUMERUS_BODY_SPRITE = 'vegnagun-body';
export const NUMERUS_POD_SPRITE = 'vegnagun-body';
export const NUMERUS_TAIL_SPRITE = 'vegnagun-tail';

/**
 * The AI script ids (`src/battle/ffx2/ai/*`; the data file names the same strings, a test pins them). The five scripts are written in stage 2 of the lane: until then an enemy with one of these ids falls back to the
 * registry's idle script. The three hidden parts have no script lines in the game (RE section 2), so they run the registry's `idle` script.
 */
export const SHINRA_SCRIPT_ID = 'x2-almighty-shinra';
export const UNUM_SCRIPT_ID = 'x2-numerus-unum';
export const DUO_SCRIPT_ID = 'x2-numerus-duo';
export const TRIA_SCRIPT_ID = 'x2-numerus-tria';
export const QUATTOUR_SCRIPT_ID = 'x2-numerus-quattour';
export const NUMERUS_PART_SCRIPT_ID = 'idle';

/** The name the HUD shows for the formation of act 2 (the first enemy would misname it as one head). */
export const NUMERUS_HEADLINE = 'Major Numerus';

/**
 * The ability ids the five scripts queue, by move. **Two kinds, both the game's own rows** (`research/re-ffx2-fiend-arena-superbosses.md` sections 3 and 4; `tests/fixtures/parity/ffx2/fiend_superbosses_rows.json`):
 *
 * - `x2-fs-*`: the ability definitions and command records THIS chapter adds (`src/data/ffx2/enemies/fiend-superbosses-abilities.ts`, `src/data/ffx2/command-records/fiend-superbosses.ts`): the rows no other chapter holds
 *   (Clione, Fireworks, Haste, Sparkler, the four Commands) and the rows another chapter holds with the wrong target (Dispel, Shell and Protect aimed at the monster side, Confuse and Silence on one girl).
 * - every other id: **an ability another chapter already ships, reused as it is** because it is the same kernel row with the same target (the Farplane Cup's, the Paragon's, the Fiend Arena Trema's and the Youth League's
 *   data). `tests/unit/chapters/fiend-superbosses-data.test.ts` pins each of them to the fixture's row, so a change on the other side fails here.
 */
export const FS_ABILITY = {
  // ---- Almighty Shinra (row 329, `m329`) ------------------------------------------------------------------------------------
  /** 0x41da, accuracy formula 2: the Cup's Tidus attack (single, `{user} attacks {target}`). */
  attack: 'x2-tidus-attack',
  clione: 'x2-fs-clione',
  /** 0x41fb, power 42: the Cup's Seymour Ultima. */
  ultimaShinra: 'x2-seymour-ultima',
  /** 0x41c4, 14 hits of an eighth of max HP and MP: the Paragon's. */
  finalImpact: 'paragon-os-final-impact',
  /** 0x4206: the Cup's Auron Full Break. */
  fullBreak: 'x2-auron-full-break',
  fireworks: 'x2-fs-fireworks',
  haste: 'x2-fs-haste',
  // ---- Unum (row 330, `m330`) -----------------------------------------------------------------------------------------------
  radisCommand: 'x2-fs-radis-command',
  sparkler: 'x2-fs-sparkler',
  dispel: 'x2-fs-dispel',
  shell: 'x2-fs-shell',
  /** 0x4088, all allies: the Magus Sisters' Cindy's. */
  whiteHighwind: 'x2-cindy-white-highwind',
  protect: 'x2-fs-protect',
  // ---- Duo (row 331, `m331`) ------------------------------------------------------------------------------------------------
  /** 0x3088, ten hits spread: the Cup's Seymour Black Sky. */
  blackSky: 'x2-seymour-black-sky',
  /** 0x3085, Poison 100 on all: Angra Mainyu's. */
  bio: 'x2-angra-bio',
  /** 0x3170, power 55: the Fiend Arena Trema's. */
  flare: 'trema-flare',
  /** 0x3084, Petrify 80 on one: the Cup's Seymour Break. */
  break: 'x2-seymour-break',
  /** 0x3171, power 70: the Fiend Arena Trema's (Duo's and Quattour's Ultima). */
  ultima: 'trema-ultima',
  confuse: 'x2-fs-confuse',
  /** 0x406e, Sleep 75 on one: Elma's. */
  sleep: 'x2-elma-sleep',
  /** 0x3082, 25 percent of current HP on all: the Cup's Seymour Demi. */
  demi: 'x2-seymour-demi',
  /** 0x406a, Berserk 75 on one: the Black Elemental's. */
  berserk: 'x2-black-elemental-berserk',
  /** 0x406f, Dark 75 on one: Garik Ronso's. */
  blind: 'x2-garik-blind',
  silence: 'x2-fs-silence',
  /** 0x421e, Slow 130 on all: the Cup's Seymour Slowga. */
  slowga: 'x2-seymour-slowga',
  venamCommand: 'x2-fs-venam-command',
  // ---- Tria (row 332, `m332`) -----------------------------------------------------------------------------------------------
  firaga: 'paragon-os-firaga',
  blizzaga: 'paragon-os-blizzaga',
  thundaga: 'paragon-os-thundaga',
  waterga: 'paragon-os-waterga',
  /** 0x3172, eight hits of power 12, Holy, one girl: the Paragon's. */
  holy: 'paragon-os-holy',
  fulmenCommand: 'x2-fs-fulmen-command',
  /** 0x4040, 3/16 of current HP and MP: the Cup's Seymour Absorb (also Quattour's). */
  absorb: 'x2-seymour-absorb',
  // ---- Quattour (row 333, `m333`) -------------------------------------------------------------------------------------------
  mortisCommand: 'x2-fs-mortis-command',
  /** 0x4221, twelve hits spread: the Cup's Seymour Meteor. */
  meteor: 'x2-seymour-meteor',
} as const;

/** The ids of the definitions this chapter adds (the rest of {@link FS_ABILITY} is another chapter's, reused). */
export const FS_NEW_ABILITY_IDS = Object.values(FS_ABILITY).filter((id) => id.startsWith('x2-fs-'));
