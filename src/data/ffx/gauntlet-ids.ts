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
 * The painting key the art lane owes each combatant (`public/art/characters/<key>/<pose>.png`). **None of them exists yet** (the art lane owes eight new creatures and the Th'uban recolour, the handoff's art list). Th'uban's
 * body is the Sanctuary Keeper's painting (same model word, RE n 0): its key is its own so that the recolour can carry it. The two Arms share one painting. The keys the data draws today are {@link GAUNTLET_SPRITE}.
 */
export const GAUNTLET_SPRITE_WANTED: Readonly<Record<GauntletCombatantId, string>> = {
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
 * **The stand-in paintings the fights draw until the art lane's land** (`spriteKey`, `EnemyForm.spriteKey`): an existing painting in the art mirror per combatant, so every act renders and plays. **Nothing here is final** (hard
 * rule 9: Bailey alone approves a painting; the driver's pick, his to overturn); a painting that lands is a one-line change in this table. Why each one:
 *
 * | Combatant | Stand-in | Why |
 * |---|---|---|
 * | Cactuar King | `pterya` | a small winged figure with the full pose set (idle, attack, cast, hurt); nothing in the mirror is a cactus |
 * | Don Tonberry | `grothia` | a small hooded figure with attack, cast, hurt (nothing in the mirror is a Tonberry) |
 * | Jormungand | `geosgaeno` | the Via Purifico's serpent: the only long-bodied monster with idle, attack, cast, hurt and ko |
 * | Earth Eater | `sinspawn-gui` | a heavy ground-bound beast |
 * | Greater Sphere | `spherimorph` | the same creature class (Spherimorph's mechanic at a larger scale, RE n 3.5) |
 * | Catastrophe | `spectral-keeper` | a large caster with idle, cast, hurt and ko |
 * | Th'uban | `sanctuary-keeper` | the same model (RE n 0); the recolour is the art lane's |
 * | Neslug | `mortibody` | a bulky body with attack, cast, hurt |
 * | Ultima Buster | `ultima-weapon` | a giant machine with idle, attack, cast, hurt and ko |
 * | its Head | `ginnem` | a small separate figure (idle only) |
 * | its Arms | `gate-lock` | a small separate figure (idle and ko) |
 */
export const GAUNTLET_SPRITE: Readonly<Record<GauntletCombatantId, string>> = {
  'cactuar-king': 'pterya',
  'don-tonberry': 'grothia',
  jormungand: 'geosgaeno',
  'earth-eater': 'sinspawn-gui',
  'greater-sphere': 'spherimorph',
  catastrophe: 'spectral-keeper',
  thuban: 'sanctuary-keeper',
  neslug: 'mortibody',
  'ultima-buster': 'ultima-weapon',
  'ultima-buster-head': 'ginnem',
  'ultima-buster-arm-left': 'gate-lock',
  'ultima-buster-arm-right': 'gate-lock',
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

/** The scene key of the arena (the integration stage's `scenes/gauntlet.ts`) and the formation id of each act. */
export const GAUNTLET_SCENE = 'gauntlet' as const;
export const gauntletGroupId = (creature: GauntletCreatureId): string => `gauntlet-${creature}`;

/**
 * The plate every act is fought on. **A stand-in** (preflight GA11, owed a mockup: hard rule 9): no Calm Lands arena plate exists, so the preflight's own option (c) names `zanarkand-dome`, a round arena (wrong place, right
 * shape). The new `monster-arena` plate is the art lane's; the integration stage's scene maps the plate (`scenes/gauntlet.ts`).
 */
export const GAUNTLET_PLATE = 'zanarkand-dome' as const;

/** One act of the chain. */
export interface GauntletAct {
  /** 1 to 9. */
  readonly act: number;
  readonly tier: 1 | 2 | 3;
  readonly creature: GauntletCreatureId;
  readonly groupId: string;
  /** The battle-start card's name for the foe. */
  readonly headline: string;
  /** The game's HP of the body (RE n 1). */
  readonly hp: number;
}

const HEADLINE: Readonly<Record<GauntletCreatureId, string>> = {
  'cactuar-king': 'Cactuar King', 'don-tonberry': 'Don Tonberry', jormungand: 'Jormungand', 'earth-eater': 'Earth Eater', 'greater-sphere': 'Greater Sphere', catastrophe: 'Catastrophe', thuban: "Th'uban", neslug: 'Neslug', 'ultima-buster': 'Ultima Buster',
};
const HP: Readonly<Record<GauntletCreatureId, number>> = {
  'cactuar-king': 100_000, 'don-tonberry': 480_000, jormungand: 520_000, 'earth-eater': 1_300_000, 'greater-sphere': 1_500_000, catastrophe: 2_200_000, thuban: 3_000_000, neslug: 4_000_000, 'ultima-buster': 5_000_000,
};

/** The nine acts in order (preflight GA2: nine acts, in the arena's own unlock order, which is also HP order). */
export const GAUNTLET_ACTS: readonly GauntletAct[] = GAUNTLET_TIERS.flatMap((t) =>
  t.creatures.map((creature, i) => ({ act: t.acts[i]!, tier: t.tier, creature, groupId: gauntletGroupId(creature), headline: HEADLINE[creature], hp: HP[creature] })),
);

/**
 * **How many tiers have their rules built** (preflight GA3: three tiers, each a releasable cut). The chain runs acts 1 to `3 x GAUNTLET_TIERS_BUILT` and ends there (the last built act has no next link and pays every act's
 * spoils); the formations of an act whose tier is not built are not registered, so nothing can reach a creature whose script is not written. **1** after stage 2 (Cactuar King, Don Tonberry, Jormungand); stage 3 makes it
 * 2 (Earth Eater, Greater Sphere, Catastrophe) and stage 4 makes it 3.
 */
export const GAUNTLET_TIERS_BUILT: 1 | 2 | 3 = 1;
