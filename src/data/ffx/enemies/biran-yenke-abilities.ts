/**
 * Biran's and Yenke's own command rows (FFX only; the hidden Biran and Yenke chapter, `research/ffx-biran-yenke.md` §3).
 *
 * Every number is the game's own record: decoded from the game's command and monster-magic tables (Grayfox96/FFX-RNG-tracker at the pinned commit 0acf1ac3, read as data with
 * our own decoder, `[decompiled]`) and **identical in every column to the in-repo fixture of the Steam HD build's tables** (`tests/fixtures/parity/ffx/command_records.json`,
 * `[game table]`; pinned by `tests/unit/data-ffx-command-records.test.ts`). Which command each script uses, and on whom, is the game's `monster_actions.json` (research §3.1).
 *
 * - **Bulldoze** (0x60a5): the only physical move; Strength formula, power 16, can crit, always hits. Biran's record names it as his default attack (the Berserk turn's).
 * - **Fire Breath** (0x60a2) and **Aqua Breath** (0x60a3): Yenke's breaths at the whole party; Magic formula, power 16, Fire and Water, damage type neither physical nor magical, always hit.
 * - **Berserk** (0x400f): Biran on himself when Yenke has fallen; Berserk at chance 120, so certain.
 * - **Mighty Guard** (0x3072) and **White Wind** (0x3070): **Kimahri's own Ronso Rage rows**, which the two scripts use (not the monster rows 0x60a4 and 0x60a1 that sit, unused,
 *   on their menu lists): that is what makes them learnable by Lancet after use. Each has two rows here, the game's two target entries: both Ronso while they stand together, the
 *   caster alone while they are apart (research §4.2).
 *
 * Biran's Thunder and Blizzard (0x3043, 0x3041) and Yenke's Haste (0x3036) are the party's own rows (`../abilities/blackmagic-*.ts`, `whitemagic-*.ts`), used as they are.
 * The names are the game's command names; the banner wording is ours. AGENTS.md rule 5: every row's accuracy formula is 0, so every row carries `canMiss: false`.
 */

import type { AbilityDef, FFXCommandRecord } from '../../../battle/common/types.ts';
import {
  BIRAN_BERSERK_ID,
  BIRAN_MIGHTY_GUARD_ID,
  BIRAN_MIGHTY_GUARD_SELF_ID,
  RONSO_BULLDOZE_ID,
  YENKE_AQUA_BREATH_ID,
  YENKE_FIRE_BREATH_ID,
  YENKE_WHITE_WIND_ID,
  YENKE_WHITE_WIND_SELF_ID,
} from '../biran-yenke-ids.ts';

export {
  BIRAN_BERSERK_ID,
  BIRAN_MIGHTY_GUARD_ID,
  BIRAN_MIGHTY_GUARD_SELF_ID,
  RONSO_BULLDOZE_ID,
  YENKE_AQUA_BREATH_ID,
  YENKE_FIRE_BREATH_ID,
  YENKE_WHITE_WIND_ID,
  YENKE_WHITE_WIND_SELF_ID,
};

/** Bulldoze, 0x60a5: Strength formula, power 16, physical, can crit, always hits; one random character (Kimahri). */
export const ronsoBulldoze: AbilityDef = {
  id: RONSO_BULLDOZE_ID,
  name: 'Bulldoze',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3, // rank byte 3
  power: 16,
  formula: 'strength',
  damageType: 'physical', // damage flags 0x5: physical, can crit
  element: ['none'],
  targeting: 'single-enemy',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false, // accuracy formula 0: always hits
  messageTemplate: '{user} uses {ability}',
  extra: { vfxKey: 'vfx-physical-heavy' },
};

/** Fire Breath, 0x60a2: Magic formula, power 16, Fire, the whole party; damage type other (neither Shell nor Protect applies). */
export const yenkeFireBreath: AbilityDef = {
  id: YENKE_FIRE_BREATH_ID,
  name: 'Fire Breath',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'magic',
  damageType: 'other', // damage flags 0
  element: ['fire'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses {ability}',
  extra: { vfxKey: 'vfx-fire-breath' },
};

/** Aqua Breath, 0x60a3: Magic formula, power 16, Water, the whole party; damage type other. */
export const yenkeAquaBreath: AbilityDef = {
  id: YENKE_AQUA_BREATH_ID,
  name: 'Aqua Breath',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 16,
  formula: 'magic',
  damageType: 'other',
  element: ['water'],
  targeting: 'all-enemies',
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses {ability}',
  extra: { vfxKey: 'vfx-aqua-breath' },
};

/** Berserk, 0x400f: on Biran himself; Berserk at chance 120 (above 100: certain). Biran's Berserk byte is 0, so it lands (research §2.3). */
export const biranBerserk: AbilityDef = {
  id: BIRAN_BERSERK_ID,
  name: 'Berserk',
  game: 'ffx',
  category: 'enemy',
  mpCost: 0,
  rank: 3,
  power: 0,
  formula: 'none',
  damageType: 'magical', // damage flags 0x2
  element: ['none'],
  targeting: 'self',
  hits: 1,
  statusEffects: [{ status: 'berserk', chance: 120, duration: 254 }],
  removesStatuses: [],
  flags: [],
  canMiss: false,
  messageTemplate: '{user} uses {ability}',
  extra: { vfxKey: 'vfx-berserk' },
};

/** The status bytes of Kimahri's Mighty Guard row, 0x3072: Protect and Shell 254, one charge of each Nul. */
const MIGHTY_GUARD_STATUSES: AbilityDef['statusEffects'] = [
  { status: 'protect', chance: 254, duration: 254 },
  { status: 'shell', chance: 254, duration: 254 },
  { status: 'nulblaze', chance: 254, duration: 1 },
  { status: 'nulfrost', chance: 254, duration: 1 },
  { status: 'nulshock', chance: 254, duration: 1 },
  { status: 'nultide', chance: 254, duration: 1 },
];

function mightyGuard(id: string, targeting: AbilityDef['targeting']): AbilityDef {
  return {
    id,
    name: 'Mighty Guard',
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 4, // 0x3072 rank byte 4
    power: 0,
    formula: 'magic',
    damageType: 'other',
    element: [],
    targeting,
    hits: 1,
    statusEffects: MIGHTY_GUARD_STATUSES.map((s) => ({ ...s })),
    removesStatuses: [],
    flags: [],
    canMiss: false,
    canReflect: false,
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-mighty-guard' },
  };
}

function whiteWind(id: string, targeting: AbilityDef['targeting']): AbilityDef {
  return {
    id,
    name: 'White Wind',
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3, // 0x3070 rank byte 3
    power: 40, // the Healing formula, power 40
    formula: 'healing',
    damageType: 'other',
    element: [],
    targeting,
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['heals'],
    canMiss: false,
    canReflect: false,
    messageTemplate: '{user} uses {ability}',
    extra: { vfxKey: 'vfx-white-wind' },
  };
}

/** Mighty Guard on both Ronso (they stand together) and on Biran alone (they are apart): the game's two target entries for the one row. */
export const biranMightyGuard: AbilityDef = mightyGuard(BIRAN_MIGHTY_GUARD_ID, 'all-allies');
export const biranMightyGuardSelf: AbilityDef = mightyGuard(BIRAN_MIGHTY_GUARD_SELF_ID, 'self');
/** White Wind on both Ronso, and on Yenke alone. */
export const yenkeWhiteWind: AbilityDef = whiteWind(YENKE_WHITE_WIND_ID, 'all-allies');
export const yenkeWhiteWindSelf: AbilityDef = whiteWind(YENKE_WHITE_WIND_SELF_ID, 'self');

/** Kimahri's Mighty Guard record, 0x3072 (the same object `command-records/player.ts` carries for his own row). */
const MIGHTY_GUARD_RECORD: FFXCommandRecord = {
  id: 0x3072,
  type: 4,
  flagsMisc: 0x4011006,
  flagsDamage: 0x0,
  damageClass: 0,
  rank: 4,
  chances: [[15, 254], [16, 254], [18, 254], [19, 254], [20, 254], [21, 254]],
  durations: [[3, 254], [4, 254], [6, 1], [7, 1], [8, 1], [9, 1]],
};
/** Kimahri's White Wind record, 0x3070. */
const WHITE_WIND_RECORD: FFXCommandRecord = { id: 0x3070, type: 4, flagsMisc: 0x4011006, flagsDamage: 0x10, damageClass: 1, rank: 3 };

/** The game's records for the rows above (`../command-records/enemies.ts` merges them). The chance and duration bytes are the decoded rows' (research §3.2). */
export const COMMAND_RECORDS_RONSO: Readonly<Record<string, FFXCommandRecord>> = {
  [RONSO_BULLDOZE_ID]: { id: 0x60a5, type: 0, flagsMisc: 0x6, flagsDamage: 0x5, damageClass: 1, rank: 3 }, // Bulldoze
  [YENKE_FIRE_BREATH_ID]: { id: 0x60a2, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3 }, // Fire Breath
  [YENKE_AQUA_BREATH_ID]: { id: 0x60a3, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3 }, // Aqua Breath
  [BIRAN_BERSERK_ID]: { id: 0x400f, type: 0, flagsMisc: 0x20006, flagsDamage: 0x2, damageClass: 0, rank: 3, chances: [[9, 120]] }, // Berserk
  [BIRAN_MIGHTY_GUARD_ID]: { ...MIGHTY_GUARD_RECORD, chances: [...(MIGHTY_GUARD_RECORD.chances ?? [])], durations: [...(MIGHTY_GUARD_RECORD.durations ?? [])] },
  [BIRAN_MIGHTY_GUARD_SELF_ID]: { ...MIGHTY_GUARD_RECORD, chances: [...(MIGHTY_GUARD_RECORD.chances ?? [])], durations: [...(MIGHTY_GUARD_RECORD.durations ?? [])] },
  [YENKE_WHITE_WIND_ID]: { ...WHITE_WIND_RECORD },
  [YENKE_WHITE_WIND_SELF_ID]: { ...WHITE_WIND_RECORD },
};

/**
 * Biran's default attack (the record's forced action, bytes 112-113: 0x60a5 Bulldoze). The game's Berserk and Provoke turns queue an actor's default attack
 * (`research/re-ffx-targeting.md` section 3), so a berserked Biran Bulldozes every turn. Yenke's forced action is 0: he cannot be berserked or provoked anyway (both 255).
 */
export const BIRAN_DEFAULT_ATTACK_RECORD: FFXCommandRecord = { id: 0x60a5, type: 0, flagsMisc: 0x6, flagsDamage: 0x5, damageClass: 1, rank: 3 };

export const BIRAN_YENKE_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [RONSO_BULLDOZE_ID]: ronsoBulldoze,
  [YENKE_FIRE_BREATH_ID]: yenkeFireBreath,
  [YENKE_AQUA_BREATH_ID]: yenkeAquaBreath,
  [BIRAN_BERSERK_ID]: biranBerserk,
  [BIRAN_MIGHTY_GUARD_ID]: biranMightyGuard,
  [BIRAN_MIGHTY_GUARD_SELF_ID]: biranMightyGuardSelf,
  [YENKE_WHITE_WIND_ID]: yenkeWhiteWind,
  [YENKE_WHITE_WIND_SELF_ID]: yenkeWhiteWindSelf,
};
