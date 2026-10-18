/**
 * The Dark Aeons' move rows (FFX only; the hidden Mirror Aeons chapter). **Source: the game's own move rows**, `research/re-ffx-yojimbo-sisters-feasibility.md` section 2 ("RE section 2"; `[bytes]`), and every command record
 * below is **the game's row word for word** from the two kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`, the Steam HD build's monster-magic-1 table): the type, the two flag
 * words, the damage class, the CTB rank (3 on all fourteen), the status chance and duration bytes, the extra-status word and the shatter byte. `tests/unit/chapters/mirror-aeons-data.test.ts` pins each one to the fixture.
 *
 * | Row | Id | Used by (RE sections 2 and 4) | The row |
 * |---|---|---|---|
 * | Razzia | `dark-razzia` 0x4100 | Dark Sandy | physical, formula 4, power 100, one target; cleanses Auto-Life |
 * | Camisade | `dark-camisade` 0x4101 | Dark Cindy | physical, formula 4, power 100; damage class HP and MP |
 * | Passado | `dark-passado` 0x4102 | Dark Mindy | formula 1, power 4, **15 hits**, can crit, Death at 254 on each |
 * | Calamity | `dark-calamity` 0x4104 | Dark Mindy | formula 3, power 0; Poison, the four Breaks, Silence, Darkness at 254, and Curse |
 * | Mega Graviton | `dark-mega-graviton` 0x4105 | all three Sisters, alone and full | magical, formula 8, power 7; Sleep, Silence, Darkness, Slow at 254, and Doom |
 * | Delta Attack | `dark-delta-attack` 0x4106 | the three Sisters together and full | formula 15 (the Magic cube), power 80, **6 hits**, can crit; cleanses Auto-Life |
 * | Kozuka | `dark-kozuka` 0x4107 | Dark Yojimbo | physical, formula 1, power 16; the four Breaks and Slow at 254 |
 * | Wakizashi (one) | `dark-wakizashi` 0x4108 | Dark Yojimbo | physical, formula 1, power 32, one target |
 * | Wakizashi (all) | `dark-wakizashi-all` 0x4109 | Dark Yojimbo | physical, formula 1, power 28, the whole front line |
 * | Zanmato | `dark-zanmato` 0x410A | Dark Yojimbo's Overdrive | formula 1, **power 250**, the whole front line; cleanses Auto-Life |
 * | Daigoro's bite | `dark-daigoro-bite` 0x410B | the dog stand-in | formula 1, power 8; Petrify and Poison at 254 |
 * | The dog's order | `dark-daigoro-order` 0x4086 | Dark Yojimbo (his dog roll) | no damage: an order to the second slot |
 * | Sandy's Attack | `dark-sandy-attack` 0x4127 | Dark Sandy | physical, formula 1, power 36, can crit; Petrify at 254 |
 * | Cindy's Attack | `dark-cindy-attack` 0x412B | Dark Cindy (the name table shows a placeholder, "Extra 44") | physical, formula 1, power 36, can crit; strips the buffs (Shell, Protect, Reflect, the Nuls, Regen, Haste at 254) |
 *
 * **Rule 5 (AGENTS.md): every row has accuracy formula 0, so it never misses** (`canMiss: false`): Razzia and the physical rows included. **The 99,999 cap:** every row sets the record's damage cap bit (bit 7 of the
 * damage word), so `always-break-damage-limit` is on each damaging row; a protected 9,999-HP character does not survive Delta Attack or Zanmato, which is the fight's point (the guides: send an aeon in as fodder).
 * Passado's crit bonus 15 is the row's. The rows' animations, sounds and the monsters' MP (they pay none: `research/re-ffx-ai-seymour.md` 1.2) are not modelled here.
 *
 * **What is not here:** the AI (when each row is used, the gauge arithmetic, the rolls) is the reverse-engineering session's work in progress (`../../../battle/ffx/ai/dark-aeons-seams.ts`).
 */

import type { AbilityDef, FFXCommandRecord, StatusApplication, StatusId, Targeting } from '../../../battle/common/types.ts';

export const DARK_RAZZIA_ID = 'dark-razzia' as const;
export const DARK_CAMISADE_ID = 'dark-camisade' as const;
export const DARK_PASSADO_ID = 'dark-passado' as const;
export const DARK_CALAMITY_ID = 'dark-calamity' as const;
export const DARK_MEGA_GRAVITON_ID = 'dark-mega-graviton' as const;
export const DARK_DELTA_ATTACK_ID = 'dark-delta-attack' as const;
export const DARK_KOZUKA_ID = 'dark-kozuka' as const;
export const DARK_WAKIZASHI_ID = 'dark-wakizashi' as const;
export const DARK_WAKIZASHI_ALL_ID = 'dark-wakizashi-all' as const;
export const DARK_ZANMATO_ID = 'dark-zanmato' as const;
export const DARK_DAIGORO_BITE_ID = 'dark-daigoro-bite' as const;
export const DARK_DAIGORO_ORDER_ID = 'dark-daigoro-order' as const;
export const DARK_SANDY_ATTACK_ID = 'dark-sandy-attack' as const;
export const DARK_CINDY_ATTACK_ID = 'dark-cindy-attack' as const;

type Fields = Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'targeting' | 'hits'> & Partial<Pick<AbilityDef, 'flags' | 'bonusCrit' | 'statusEffects' | 'extra' | 'shatterChance'>>;

/** The columns every row shares: a monster move of rank 3, no MP, no element, accuracy formula 0 (never misses). */
function row(fields: Fields): AbilityDef {
  return {
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    rank: 3,
    element: ['none'],
    statusEffects: [],
    removesStatuses: [],
    flags: ['always-break-damage-limit'], // the record's cap bit 7
    canMiss: false, // accuracy formula 0 (RE section 2; AGENTS.md rule 5)
    messageTemplate: '{user} uses {ability}',
    ...fields,
  };
}

const apply = (status: StatusId, duration = 254): StatusApplication => ({ status, chance: 254, duration });
const BREAKS: StatusId[] = ['power-break', 'magic-break', 'armor-break', 'mental-break'];
const CRIT: AbilityDef['flags'] = ['always-break-damage-limit', 'crit-eligible'];
/** The shatter byte of the rows that carry one (100: a Petrified target shatters on the hit), the record's own; the ability carries the same number so the engine's two readings agree. */
const SHATTER = 100;

const single: Targeting = 'single-enemy'; // "enemy" is the user's opposite side: the party, for a monster
const group: Targeting = 'all-enemies';

export const razzia: AbilityDef = row({ id: DARK_RAZZIA_ID, name: 'Razzia', power: 100, formula: 'piercing-magic', damageType: 'physical', targeting: single, hits: 1, shatterChance: SHATTER });
export const camisade: AbilityDef = row({ id: DARK_CAMISADE_ID, name: 'Camisade', power: 100, formula: 'piercing-magic', damageType: 'physical', targeting: single, hits: 1, shatterChance: SHATTER });
export const passado: AbilityDef = row({
  id: DARK_PASSADO_ID, name: 'Passado', power: 4, formula: 'strength', damageType: 'other', targeting: single, hits: 15, flags: CRIT, bonusCrit: 15, statusEffects: [apply('ko')], shatterChance: SHATTER,
});
export const calamity: AbilityDef = row({
  id: DARK_CALAMITY_ID, name: 'Calamity', power: 0, formula: 'magic', damageType: 'other', targeting: single, hits: 1,
  statusEffects: [apply('poison'), ...BREAKS.map((s) => apply(s)), apply('silence'), apply('darkness')],
});
export const megaGraviton: AbilityDef = row({
  id: DARK_MEGA_GRAVITON_ID, name: 'Mega Graviton', power: 7, formula: 'percent-total', damageType: 'magical', targeting: group, hits: 1,
  statusEffects: [apply('sleep', 99), apply('silence', 99), apply('darkness', 99), apply('slow')],
});
export const deltaAttack: AbilityDef = row({ id: DARK_DELTA_ATTACK_ID, name: 'Delta Attack', power: 80, formula: 'special-magic', damageType: 'other', targeting: group, hits: 6, flags: CRIT });
export const kozuka: AbilityDef = row({
  id: DARK_KOZUKA_ID, name: 'Kozuka', power: 16, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, statusEffects: [...BREAKS.map((s) => apply(s)), apply('slow')],
});
export const wakizashi: AbilityDef = row({ id: DARK_WAKIZASHI_ID, name: 'Wakizashi', power: 32, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, shatterChance: SHATTER });
export const wakizashiAll: AbilityDef = row({ id: DARK_WAKIZASHI_ALL_ID, name: 'Wakizashi', power: 28, formula: 'strength', damageType: 'physical', targeting: group, hits: 1, shatterChance: SHATTER });
export const zanmato: AbilityDef = row({ id: DARK_ZANMATO_ID, name: 'Zanmato', power: 250, formula: 'strength', damageType: 'other', targeting: group, hits: 1, shatterChance: SHATTER });
export const daigoroBite: AbilityDef = row({
  id: DARK_DAIGORO_BITE_ID, name: 'Daigoro', power: 8, formula: 'strength', damageType: 'other', targeting: single, hits: 1, statusEffects: [apply('petrify'), apply('poison')],
});
/** 0x4086: no damage, one hit record, an order to the dog (RE section 4.1: the script aims it at the second slot). */
export const daigoroOrder: AbilityDef = row({
  id: DARK_DAIGORO_ORDER_ID, name: 'Daigoro', power: 0, formula: 'none', damageType: 'other', targeting: 'self', hits: 1, flags: [],
  extra: { ordersActor: 'dark-daigoro', orderedAbility: DARK_DAIGORO_BITE_ID, orderedAim: 'game-picker' }, // the bite's victim is the note's stream-4 pick over the living front line (RE note 4.4; `battle/ffx/orders.ts`)
});
export const sandyAttack: AbilityDef = row({
  id: DARK_SANDY_ATTACK_ID, name: 'Attack', power: 36, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CRIT, statusEffects: [apply('petrify')], shatterChance: SHATTER,
});
export const cindyAttack: AbilityDef = row({
  id: DARK_CINDY_ATTACK_ID, name: 'Attack', power: 36, formula: 'strength', damageType: 'physical', targeting: single, hits: 1, flags: CRIT, shatterChance: SHATTER,
});

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`), word for word from the kernel fixtures; the tests compare each with the fixture rows. `chances` are
 * `[status number, byte]` (0 Death, 1 Zombie, 2 Petrify, 3 Poison, 4 to 7 the Breaks, 12 Sleep, 13 Silence, 14 Darkness, 15 Shell ... 24 Slow) and `durations` `[slot, byte]` (0 Sleep, 1 Silence, 2 Darkness, 12 Slow);
 * `extra` is the extra-status word (0x200 Auto-Life, 0x400 Curse, 0x4000 Doom). Rank 3 on all of them; `shatter` is the fixture's byte.
 */
export const COMMAND_RECORDS_DARK_AEONS: Readonly<Record<string, FFXCommandRecord>> = {
  [DARK_RAZZIA_ID]: { id: 0x4100, type: 0, flagsMisc: 0x6, flagsDamage: 0xa1, damageClass: 1, rank: 3, shatter: 100, extra: 0x200 },
  [DARK_CAMISADE_ID]: { id: 0x4101, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 3, rank: 3, shatter: 100 },
  [DARK_PASSADO_ID]: { id: 0x4102, type: 0, flagsMisc: 0x6, flagsDamage: 0x84, damageClass: 1, rank: 3, shatter: 100, chances: [[0, 254]] },
  [DARK_CALAMITY_ID]: {
    id: 0x4104, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 0, rank: 3,
    chances: [[3, 254], [4, 254], [5, 254], [6, 254], [7, 254], [13, 254], [14, 254]], durations: [[1, 254], [2, 254]], extra: 0x400,
  },
  [DARK_MEGA_GRAVITON_ID]: {
    id: 0x4105, type: 0, flagsMisc: 0x6, flagsDamage: 0x82, damageClass: 1, rank: 3,
    chances: [[12, 254], [13, 254], [14, 254], [24, 254]], durations: [[0, 99], [1, 99], [2, 99], [12, 254]], extra: 0x4000,
  },
  [DARK_DELTA_ATTACK_ID]: { id: 0x4106, type: 0, flagsMisc: 0x40000006, flagsDamage: 0xac, damageClass: 1, rank: 3, extra: 0x200 },
  [DARK_KOZUKA_ID]: { id: 0x4107, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 3, chances: [[4, 254], [5, 254], [6, 254], [7, 254], [24, 254]], durations: [[12, 254]] },
  [DARK_WAKIZASHI_ID]: { id: 0x4108, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 3, shatter: 100 },
  [DARK_WAKIZASHI_ALL_ID]: { id: 0x4109, type: 0, flagsMisc: 0x6, flagsDamage: 0x81, damageClass: 1, rank: 3, shatter: 100 },
  [DARK_ZANMATO_ID]: { id: 0x410a, type: 0, flagsMisc: 0x40000006, flagsDamage: 0xa0, damageClass: 1, rank: 3, shatter: 100, extra: 0x200 },
  [DARK_DAIGORO_BITE_ID]: { id: 0x410b, type: 0, flagsMisc: 0x6, flagsDamage: 0x80, damageClass: 1, rank: 3, chances: [[2, 254], [3, 254]] },
  [DARK_DAIGORO_ORDER_ID]: { id: 0x4086, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 0, rank: 3 },
  [DARK_SANDY_ATTACK_ID]: { id: 0x4127, type: 0, flagsMisc: 0x2, flagsDamage: 0x8d, damageClass: 1, rank: 3, shatter: 100, chances: [[2, 254]] },
  [DARK_CINDY_ATTACK_ID]: {
    id: 0x412b, type: 0, flagsMisc: 0x2, flagsDamage: 0xad, damageClass: 1, rank: 3, shatter: 100, extra: 0x200,
    chances: [[15, 254], [16, 254], [17, 254], [18, 254], [19, 254], [20, 254], [21, 254], [22, 254], [23, 254]],
    durations: [[3, 254], [4, 254], [5, 254], [6, 254], [7, 254], [8, 254], [9, 254], [10, 254], [11, 254]],
  },
};

export const DARK_AEONS_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [DARK_RAZZIA_ID]: razzia,
  [DARK_CAMISADE_ID]: camisade,
  [DARK_PASSADO_ID]: passado,
  [DARK_CALAMITY_ID]: calamity,
  [DARK_MEGA_GRAVITON_ID]: megaGraviton,
  [DARK_DELTA_ATTACK_ID]: deltaAttack,
  [DARK_KOZUKA_ID]: kozuka,
  [DARK_WAKIZASHI_ID]: wakizashi,
  [DARK_WAKIZASHI_ALL_ID]: wakizashiAll,
  [DARK_ZANMATO_ID]: zanmato,
  [DARK_DAIGORO_BITE_ID]: daigoroBite,
  [DARK_DAIGORO_ORDER_ID]: daigoroOrder,
  [DARK_SANDY_ATTACK_ID]: sandyAttack,
  [DARK_CINDY_ATTACK_ID]: cindyAttack,
};
