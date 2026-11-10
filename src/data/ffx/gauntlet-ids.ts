/**
 * The ids of the hidden **Gauntlet** chapter (FFX only; hidden chapter number 54; branch `ch-gauntlet`, 2026-11-09): nine Monster Arena creations in the Calm Lands, fought one after another. A module with no
 * imports, so that the data, the battle layer's rules, the scene, the door, the guide and the tactic can all name them without pulling each other's graphs in. The battle layer does not import `src/data`:
 * `battle/ffx/ai/gauntlet-*.ts` keeps its own copy of the combatant, script and row ids, and `tests/unit/chapters/gauntlet-data.test.ts` pins that the copies agree.
 *
 * Source of the fight: `research/re-ffx-monster-arena-creations.md` ("RE n": the game's own monster files m105, m272, m273, m277, m279 to m282, m311, m314 and m317, and the arena formations `zzzz02_55` to
 * `zzzz03_xx`). The paper preflight is `docs/plans/ch-gauntlet-review.md` (GA1 to GA13, kept with the handoff `docs/handoff/ch-gauntlet.md`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the Monster Arena and its creations are FFX content (CTB, the FFX monster files); FFX-2 has the Fiend Arena, a different system with different creatures.
 */

/** The chapter's id: its key in the experiments' store (the board has no card for it; its word is `gauntlet`, the door file of the integration stage). Number 54 (preflight GA1). */
export const GAUNTLET_CHAPTER_ID = 'gauntlet' as const;
export const GAUNTLET_CHAPTER_NUMBER = 54 as const;
/** The door word (preflight GA1; re-checked against the merged words with `door-check.mjs`). */
export const GAUNTLET_DOOR_WORD = 'gauntlet' as const;

/** The nine creations, in the arena's own unlock order, which is also HP order (RE n 0). Each is one act of the chain (preflight section 2). */
export const GAUNTLET_CREATURES = ['cactuar-king', 'don-tonberry', 'jormungand', 'earth-eater', 'greater-sphere', 'catastrophe', 'thuban', 'neslug', 'ultima-buster'] as const;
export type GauntletCreatureId = (typeof GAUNTLET_CREATURES)[number];

/** The Ultima Buster's Head (monster file m272) and its two Arms (m273 twice): parts of the body, the formation's actors 21 to 23 (RE n 3.1). */
export const ULTIMA_BUSTER_HEAD_ID = 'ultima-buster-head' as const;
export const ULTIMA_BUSTER_ARM_LEFT_ID = 'ultima-buster-arm-left' as const;
export const ULTIMA_BUSTER_ARM_RIGHT_ID = 'ultima-buster-arm-right' as const;
export const ULTIMA_BUSTER_PARTS = [ULTIMA_BUSTER_HEAD_ID, ULTIMA_BUSTER_ARM_LEFT_ID, ULTIMA_BUSTER_ARM_RIGHT_ID] as const;
export type GauntletPartId = (typeof ULTIMA_BUSTER_PARTS)[number];

/** Every combatant the chapter's data builds. */
export type GauntletCombatantId = GauntletCreatureId | GauntletPartId;

/** The three tiers of preflight GA3 (each a releasable cut): the area three, the first three Originals, the last three. Acts are numbered from 1. */
export const GAUNTLET_TIERS = [
  { tier: 1, acts: [1, 2, 3], creatures: ['cactuar-king', 'don-tonberry', 'jormungand'] },
  { tier: 2, acts: [4, 5, 6], creatures: ['earth-eater', 'greater-sphere', 'catastrophe'] },
  { tier: 3, acts: [7, 8, 9], creatures: ['thuban', 'neslug', 'ultima-buster'] },
] as const;

/** The monster file (`mNNN.bin`) of each combatant, in the game's numbering (RE n 1). */
export const GAUNTLET_FILE: Readonly<Record<GauntletCombatantId, number>> = {
  'cactuar-king': 314,
  'don-tonberry': 317,
  jormungand: 311,
  'earth-eater': 279,
  'greater-sphere': 281,
  catastrophe: 277,
  thuban: 282,
  neslug: 105,
  'ultima-buster': 280,
  'ultima-buster-head': 272,
  'ultima-buster-arm-left': 273,
  'ultima-buster-arm-right': 273,
};

/** The AI script id of each combatant (written by the rules stages; the arms have turns of none but a script for the parts' gate, RE n 3.1). */
export const GAUNTLET_SCRIPT: Readonly<Record<GauntletCombatantId, string>> = {
  'cactuar-king': 'gauntlet-cactuar-king',
  'don-tonberry': 'gauntlet-don-tonberry',
  jormungand: 'gauntlet-jormungand',
  'earth-eater': 'gauntlet-earth-eater',
  'greater-sphere': 'gauntlet-greater-sphere',
  catastrophe: 'gauntlet-catastrophe',
  thuban: 'gauntlet-thuban',
  neslug: 'gauntlet-neslug',
  'ultima-buster': 'gauntlet-ultima-buster',
  'ultima-buster-head': 'gauntlet-ultima-buster-head',
  'ultima-buster-arm-left': 'gauntlet-ultima-buster-arm',
  'ultima-buster-arm-right': 'gauntlet-ultima-buster-arm',
};

/**
 * The painting key of each combatant (`public/art/characters/<key>/<pose>.png`). **None of them exists yet** (the art lane owes eight new creatures and the Th'uban recolour, the handoff's art list); the group stage
 * of the chapter maps each to a stand-in that does exist, in this one table, and the factories read it, so a painting that lands is a one-line change. Th'uban's body is the Sanctuary Keeper's painting (same model word,
 * RE n 0): its key is its own so that the recolour can carry it.
 */
export const GAUNTLET_SPRITE: Readonly<Record<GauntletCombatantId, string>> = {
  'cactuar-king': 'cactuar-king',
  'don-tonberry': 'don-tonberry',
  jormungand: 'jormungand',
  'earth-eater': 'earth-eater',
  'greater-sphere': 'greater-sphere',
  catastrophe: 'catastrophe',
  thuban: 'thuban',
  neslug: 'neslug',
  'ultima-buster': 'ultima-buster',
  'ultima-buster-head': 'ultima-buster-head',
  'ultima-buster-arm-left': 'ultima-buster-arm',
  'ultima-buster-arm-right': 'ultima-buster-arm',
};

/**
 * The move rows of the chapter (`../enemies/gauntlet-abilities.ts`), the game's monster-magic rows. The ids carry the chapter's prefix: the game's plain "Attack" rows are not the engine's own default Attack. A comment
 * gives the game's command id. The rows the scripts take from the player's own table (Demi, Flare, Ultima 0x3053, the four -aga spells, Haste, Protect, Shell, Reflect, Regen, Curaga) are used by their own ids
 * (`GAUNTLET_PLAYER_ROWS`), as the Spherimorph and Sanctuary Keeper chapters do.
 */
export const GAUNTLET_ROWS = {
  attack: 'gauntlet-attack', // 0x40F0: Earth Eater, Greater Sphere, Th'uban, Ultima Buster
  ultima: 'gauntlet-ultima', // 0x40F3
  contamination: 'gauntlet-contamination', // 0x40FE
  special1: 'gauntlet-special-1', // 0x6001: the Head's relay
  neslugAttack: 'gauntlet-neslug-attack', // 0x6000
  megaton: 'gauntlet-megaton', // 0x60BE
  slime: 'gauntlet-slime', // 0x60BF
  brokenShell: 'gauntlet-broken-shell', // 0x60C0
  hidesInShell: 'gauntlet-hides-in-shell', // 0x60C1
  emergesFromShell: 'gauntlet-emerges-from-shell', // 0x60C2
  toxicCloud: 'gauntlet-toxic-cloud', // 0x40F7
  toxicSpray: 'gauntlet-toxic-spray', // 0x40F8
  hundredThorns: 'gauntlet-hundred-thorns', // 0x40F9
  transform: 'gauntlet-transform', // 0x6007
  megatonPunch: 'gauntlet-megaton-punch', // 0x40F5
  getsUp: 'gauntlet-gets-up', // 0x6018
  hydraulicPress: 'gauntlet-hydraulic-press', // 0x40FD
  elementalShift: 'gauntlet-elemental-shift', // 0x6036
  rainbow: 'gauntlet-rainbow', // 0x40FA
  convergence: 'gauntlet-convergence', // 0x40FB
  condemn: 'gauntlet-condemn', // 0x40FC
  jormungandAttack: 'gauntlet-jormungand-attack', // 0x40BA
  coldStare: 'gauntlet-cold-stare', // 0x40BB
  vorpal: 'gauntlet-space-time-vorpal', // 0x40E2
  needles10000: 'gauntlet-10000-needles', // 0x40BC
  needles99999: 'gauntlet-99999-needles', // 0x40F2
  runAway: 'gauntlet-run-away', // 0x4033
  tonberryAttack: 'gauntlet-tonberry-attack', // 0x4062
  voodoo: 'gauntlet-voodoo', // 0x40EA
  karma: 'gauntlet-karma', // 0x40FF
  waddle: 'gauntlet-waddle', // 0x4081
} as const;

/** The player-table rows the scripts use by their own ids (the game's command ids 0x302D, 0x3036, 0x303A to 0x303C, 0x303E, 0x3049 to 0x304C, 0x304E, 0x3052 and 0x3053). */
export const GAUNTLET_PLAYER_ROWS = {
  curaga: 'curaga',
  haste: 'haste',
  shell: 'shell',
  protect: 'protect',
  reflect: 'reflect',
  regen: 'regen',
  firaga: 'firaga',
  blizzaga: 'blizzaga',
  thundaga: 'thundaga',
  waterga: 'waterga',
  demi: 'demi',
  flare: 'flare',
  ultima: 'ultima',
} as const;

/** The scene key of the arena (the integration stage's `scenes/gauntlet.ts`) and the formation ids of the nine acts (the group stage's). */
export const GAUNTLET_SCENE = 'gauntlet' as const;
export const gauntletGroupId = (creature: GauntletCreatureId): string => `gauntlet-${creature}`;
