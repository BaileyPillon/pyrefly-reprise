/**
 * The ids of the hidden Belgemine's Challenge chapter (FFX only; hidden chapter number 45, the word `sidequest`): the eight aeon duels at the Remiem Temple. **No imports**, so the scene, the door, the metadata and the
 * battle layer's copies (`battle/ffx/ai/belgemine-rules.ts`, pinned equal by `tests/unit/chapters/belgemine-data.test.ts`) can name them without pulling the chapter's whole graph in.
 *
 * Source: `research/re-ffx-belgemine-aeon-duels.md` ("RE n"): the formations `lmyt01_00` to `lmyt01_07` (Remiem Temple, area 446), the monster files `m250` (Belgemine), `m254` (Valefor), `m284` (Ifrit), `m285` (Ixion),
 * `m286` (Shiva), `m287` (Bahamut), `m288` (Yojimbo) with the dog `m266`, `m265` (Anima) and `m289` to `m291` (the Magus Sisters).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

/** The chapter, its scene key and the chapter number (one more than the program plan's row 44; no two chapters share a number). */
export const BELGEMINE_CHAPTER_ID = 'belgemine';
export const BELGEMINE_SCENE = 'belgemine';
export const BELGEMINE_NUMBER = 45;

/** The plate every act is fought on: the Cavern of the Stolen Fayth's approved painting as a stand-in for the Remiem court (the preflight's `remiem-temple` plate is on the art list, owed). */
export const BELG_PLATE = 'cavern-stolen-fayth';

/** The summoner's body (m250): on the field, never targeted, takes no turn, no part of the victory (RE 0). */
export const BELGEMINE_ID = 'belgemine';
export const BELGEMINE_BYSTANDER_SCRIPT = 'belgemine-bystander';

/**
 * The combatant ids of her aeons. The enemy aeons never use the roster ids (`valefor`, `ifrit`, ...): combatants are keyed by id (`battle/ffx/setup.ts`), and a clash would overwrite Yuna's own aeon. Only the sprite keys
 * point at the aeons' own paintings (BD7).
 */
export const BELG_IDS = {
  valefor: 'belg-valefor',
  ifrit: 'belg-ifrit',
  ixion: 'belg-ixion',
  shiva: 'belg-shiva',
  bahamut: 'belg-bahamut',
  yojimbo: 'belg-yojimbo',
  dog: 'belg-daigoro',
  anima: 'belg-anima',
  mindy: 'belg-mindy',
  sandy: 'belg-sandy',
  cindy: 'belg-cindy',
} as const;

/** The AI script id of each body (registered in `battle/ffx/ai/belgemine*.ts`). */
export const BELG_SCRIPTS = {
  valefor: 'belg-valefor',
  ifrit: 'belg-ifrit',
  ixion: 'belg-ixion',
  shiva: 'belg-shiva',
  bahamut: 'belg-bahamut',
  yojimbo: 'belg-yojimbo',
  dog: 'belg-daigoro',
  anima: 'belg-anima',
  mindy: 'belg-mindy',
  sandy: 'belg-sandy',
  cindy: 'belg-cindy',
} as const;

/** The eight acts, in the order the game fights them (RE 0): the key, the group id, the formation file, the game's battle id and the roster key of the aeon Yuna cannot summon (the mirror lock, RE 3.1). */
export const BELG_ACTS = [
  { key: 'valefor', groupId: 'belgemine-1-valefor', file: 'lmyt01_00', battleId: 29229056, locks: ['valefor'] },
  { key: 'ifrit', groupId: 'belgemine-2-ifrit', file: 'lmyt01_01', battleId: 29229057, locks: ['ifrit'] },
  { key: 'ixion', groupId: 'belgemine-3-ixion', file: 'lmyt01_02', battleId: 29229058, locks: ['ixion'] },
  { key: 'shiva', groupId: 'belgemine-4-shiva', file: 'lmyt01_03', battleId: 29229059, locks: ['shiva'] },
  { key: 'bahamut', groupId: 'belgemine-5-bahamut', file: 'lmyt01_04', battleId: 29229060, locks: ['bahamut'] },
  { key: 'yojimbo', groupId: 'belgemine-6-yojimbo', file: 'lmyt01_05', battleId: 29229061, locks: ['yojimbo'] },
  { key: 'anima', groupId: 'belgemine-7-anima', file: 'lmyt01_06', battleId: 29229062, locks: ['anima'] },
  { key: 'sisters', groupId: 'belgemine-8-sisters', file: 'lmyt01_07', battleId: 29229063, locks: ['cindy', 'sandy', 'mindy'] },
] as const;
export type BelgActKey = (typeof BELG_ACTS)[number]['key'];

export const BELG_FIRST_GROUP = BELG_ACTS[0].groupId;

/**
 * The ids of the move rows, with the game's row ids in the comments. **Fourteen rows are the earlier chapters' own**, because the kernel row is the same: Chapter XIV's aeons (`isaaru-abilities.ts`: Summon, Attack, Sonic Wings, Energy Ray, Hellfire, Mega Flare
 * share their records with Belgemine's, RE 2 item 3) and the Cavern's Yojimbo (`yojimbo-abilities.ts`: the same file `m288`, the same rows). The rest are new `belg-` rows in `data/ffx/enemies/belgemine-abilities.ts`.
 */
export const BELG_ROWS = {
  summonValefor: 'pterya-summon', // 0x408B (Chapter XIV's)
  summonIfrit: 'grothia-summon', // 0x408C (Chapter XIV's)
  summonShiva: 'belg-summon-shiva', // 0x408D
  summonIxion: 'belg-summon-ixion', // 0x408E
  summonBahamut: 'spathi-summon', // 0x408F (Chapter XIV's)
  summonYojimbo: 'yojimbo-summon', // 0x4090 (the Cavern's)
  summonAnima: 'belg-summon-anima', // 0x4091
  summonSisters: 'belg-summon-sisters', // 0x4092
  attackA: 'grothia-attack', // 0x4000, accuracy 90: Ifrit, Ixion (Chapter XIV's)
  attackB: 'grothia-attack-yuna', // 0x407F, accuracy 120: Valefor, Shiva, the counter of Bahamut, Sandy (Chapter XIV's)
  animaAttack: 'belg-anima-attack', // 0x40AE
  sonicWings: 'pterya-sonic-wings', // 0x405D (Chapter XIV's)
  energyRay: 'pterya-energy-ray', // 0x403D (Chapter XIV's)
  energyBlast: 'belg-energy-blast', // 0x40A6
  meteorStrike: 'belg-meteor-strike', // 0x4089
  hellfire: 'grothia-hellfire', // 0x405E (0x40E6 with Anima on the field: identical; Chapter XIV's)
  aerospark: 'belg-aerospark', // 0x4064
  thorsHammer: 'belg-thors-hammer', // 0x4065 (0x40E7 with Anima on the field: identical)
  heavenlyStrike: 'belg-heavenly-strike', // 0x40AC
  diamondDust: 'belg-diamond-dust', // 0x4096
  impulse: 'belg-impulse', // 0x40AD
  megaFlare: 'spathi-mega-flare', // 0x405F (Chapter XIV's)
  kozuka: 'yojimbo-kozuka', // 0x4082 (the Cavern's)
  wakizashi: 'yojimbo-wakizashi', // 0x4083 (the Cavern's)
  zanmato: 'yojimbo-zanmato', // 0x4085 (the Cavern's)
  daigoroOrder: 'belg-daigoro-order', // 0x4086 (the order to the dog; the Cavern's names its own dog)
  daigoroBite: 'daigoro-attack', // 0x40B1 (the Cavern's)
  pain: 'belg-pain', // 0x40AF
  oblivion: 'belg-oblivion', // 0x40B0
  razzia: 'belg-razzia', // 0x40DA
  camisade: 'belg-camisade', // 0x40DB
  passado: 'belg-passado', // 0x40DC
  deltaAttack: 'belg-delta-attack', // 0x40DD
  mightyGuard: 'belg-mighty-guard', // 0x40DE
  whiteWind: 'belg-white-wind', // 0x405A
} as const;

/** The player's own spell rows the scripts cast by id (the engine's player-side abilities whose command record carries the game's id). */
export const BELG_SPELLS = {
  blizzara: 'blizzara', // 0x3046
  blizzaga: 'blizzaga', // 0x304A
  fira: 'fira', // 0x3045
  firaga: 'firaga', // 0x3049
  thundara: 'thundara', // 0x3047
  thundaga: 'thundaga', // 0x304B
  watera: 'watera', // 0x3048
  waterga: 'waterga', // 0x304C
  flare: 'flare', // 0x3052
  ultima: 'ultima', // 0x3053
  holy: 'holy', // 0x303F
  drain: 'drain', // 0x3050
  osmose: 'osmose-spell', // 0x3051
  demi: 'demi', // 0x304E
  dispel: 'dispel', // 0x303D
  shell: 'shell', // 0x303A
  protect: 'protect', // 0x303B
  cura: 'cura', // 0x302C
  regen: 'regen', // 0x303E
  haste: 'haste', // 0x3036
} as const;

/** `state.flags` keys the scripts publish. */
export const BELG_FLAGS = {
  /** The Mighty Guard counter of Cindy (RE 3.12): starts at 4, a Mighty Guard when it reaches 7. */
  guardCount: 'belgemine.guardCount',
  /** The game's battle id of the act (the scripts branch on it in the game; here the group decides, and the flag is for the tests and the HUD). */
  battleId: 'belgemine.battleId',
} as const;

/** The tag on an enemy gauge these scripts own (`enemyGaugeRules`). */
export const BELG_GAUGE_RULES = 'belgemine-aeon';
