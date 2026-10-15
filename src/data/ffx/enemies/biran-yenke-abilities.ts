/**
 * The brothers' command rows (FFX only; the hidden Biran and Yenke chapter). **Source: the game's own move rows**, `research/re-ffx-biran-yenke.md` section 6 ("RE section 6"; `[bytes]`). Six rows are ours to
 * carry; the other four moves of the scripts are party rows that already exist (Thunder 0x3043, Blizzard 0x3041, Haste 0x3036) or Kimahri's own Rage rows:
 *
 * | Row | Id | Used by | What the note says |
 * |---|---|---|---|
 * | **Bulldoze** | `ronso-bulldoze` (0x60A5, monster-magic-2 row 165) | both, and **it swaps the user's side** | 1 enemy, physical, formula 1, power 16, can crit, **accuracy formula 0 (always hits)**, rank 3; Biran's forced action when Berserk |
 * | **Fire Breath** | `ronso-fire-breath` (0x60A2, row 162) | Yenke, turn 1 of 3 | 1 enemy, neither physical nor magical, formula 3, power 16, Fire, accuracy formula 0, rank 3 |
 * | **Aqua Breath** | `ronso-aqua-breath` (0x60A3, row 163) | Yenke, turn 2 of 3 | the same, Water |
 * | **Berserk** | `ronso-berserk` (0x400F, monster-magic-1 row 15) | Biran, after Yenke dies, on himself | magical flag, formula 0, power 0; Berserk chance 120 (no duration byte); Biran's Berserk byte is 0, so it lands; rank 3 |
 * | **Mighty Guard** | `biran-mighty-guard` (Kimahri's row 0x3072, command row 114) | Biran, at half HP | party-side group, neither, formula 3, power 0; Shell and Protect 254 / 254 (until removed), the four Nuls 254 with duration 1 (one charge each); rank 4 |
 * | **White Wind** | `yenke-white-wind` (Kimahri's row 0x3070, command row 112) | Yenke, at half HP | party-side group, neither, formula 7, power 40, heals; rank 3 |
 *
 * **Rule 5 (AGENTS.md): Bulldoze is physical but never misses** (accuracy formula 0): `canMiss: false`. The note lists it as the one place the repo's "only physical attacks roll" reading differs for a monster
 * (RE section 8). Fire Breath and Aqua Breath carry accuracy formula 0 too: `canMiss: false`.
 *
 * The two Rage rows are Kimahri's own (`../abilities/overdrive-kimahri-2.ts`, `[verified: 2 sources]` and the same numbers as the note's section 6) performed by a monster: the same numbers, the category `enemy`,
 * no Rage picker (`minigame` dropped), `extra.groupTarget` (the script names exactly who it covers: both brothers on the same side, otherwise only the caster, RE 5.3), under ids of their own so Kimahri's Overdrive
 * rows are never touched. The note's "Overdrive gauge forced to 100 to pay the 100 cost" is the game's way to afford the row; a monster here pays no gauge.
 *
 * **Not in the note, so not here:** the command records' flag words (the engine derives them from these rows: the note gives the type, formula, power, element, accuracy formula and rank, not the words), the
 * rows' animations and sounds, whether Thunder and Blizzard's "reflectable, pierces Armored" matters to a Kimahri who has neither.
 */

import type { AbilityDef, FFXCommandRecord } from '../../../battle/common/types.ts';
import { ABILITIES as KIMAHRI_RAGES_2 } from '../abilities/overdrive-kimahri-2.ts';
import { COMMAND_RECORDS_PLAYER } from '../command-records/player.ts';

export const BULLDOZE_ID = 'ronso-bulldoze' as const;
export const FIRE_BREATH_ID = 'ronso-fire-breath' as const;
export const AQUA_BREATH_ID = 'ronso-aqua-breath' as const;
export const BERSERK_SELF_ID = 'ronso-berserk' as const;
export const BIRAN_MIGHTY_GUARD_ID = 'biran-mighty-guard' as const;
export const YENKE_WHITE_WIND_ID = 'yenke-white-wind' as const;

/** The columns every row shares: a monster move, rank 3, no MP. */
function row(fields: Pick<AbilityDef, 'id' | 'name' | 'power' | 'formula' | 'damageType' | 'element' | 'targeting' | 'statusEffects' | 'flags' | 'rank' | 'extra'>): AbilityDef {
  return {
    game: 'ffx',
    category: 'enemy',
    mpCost: 0,
    hits: 1,
    removesStatuses: [],
    canMiss: false, // accuracy formula 0: always hits (RE section 6; AGENTS.md rule 5)
    messageTemplate: '{user} uses {ability}',
    ...fields,
  };
}

/** Bulldoze: physical, formula 1, power 16, can crit, never misses; the user changes sides (`battle/ffx/ai/biran-yenke.ts`). */
export const bulldoze: AbilityDef = row({
  id: BULLDOZE_ID, name: 'Bulldoze', rank: 3, power: 16, formula: 'strength', damageType: 'physical', element: ['none'], targeting: 'single-enemy', statusEffects: [], flags: ['crit-eligible'], extra: { swapsSide: true },
});

/** Yenke's first move: neither physical nor magical, formula 3 (Magic against Magic Defense), power 16, Fire. */
export const fireBreath: AbilityDef = row({
  id: FIRE_BREATH_ID, name: 'Fire Breath', rank: 3, power: 16, formula: 'magic', damageType: 'other', element: ['fire'], targeting: 'single-enemy', statusEffects: [], flags: [], extra: { vfxKey: 'vfx-fire-breath' },
});

/** Yenke's second move: the same, Water. */
export const aquaBreath: AbilityDef = row({
  id: AQUA_BREATH_ID, name: 'Aqua Breath', rank: 3, power: 16, formula: 'magic', damageType: 'other', element: ['water'], targeting: 'single-enemy', statusEffects: [], flags: [], extra: { vfxKey: 'vfx-aqua-breath' },
});

/** Biran's answer to Yenke's death: Berserk on himself (chance 120 against a byte of 0: it lands). A status with no counter of its own lasts 254, to the end of the battle. */
export const berserkSelf: AbilityDef = row({
  id: BERSERK_SELF_ID, name: 'Berserk', rank: 3, power: 0, formula: 'none', damageType: 'magical', element: ['none'], targeting: 'self', statusEffects: [{ status: 'berserk', chance: 120, duration: 254 }], flags: [], extra: {},
});

/** A Kimahri Rage row performed by a monster that names its own group: the row's numbers, the category `enemy`, no Rage picker. */
function asBrotherRage(rageId: 'mighty-guard' | 'white-wind', id: string): AbilityDef {
  const rage = KIMAHRI_RAGES_2[rageId];
  if (rage === undefined) throw new Error(`biran-yenke-abilities: Kimahri's Rage '${rageId}' is not in the data`);
  const { minigame: _picker, animationKey: _animation, ...fields } = rage;
  return { ...fields, id, category: 'enemy', statusEffects: rage.statusEffects.map((s) => ({ ...s })), extra: { ...(rage.extra ?? {}), groupTarget: true, ronsoRage: rageId } };
}

export const biranMightyGuard: AbilityDef = asBrotherRage('mighty-guard', BIRAN_MIGHTY_GUARD_ID);
export const yenkeWhiteWind: AbilityDef = asBrotherRage('white-wind', YENKE_WHITE_WIND_ID);

/** Kimahri's own record of a Rage the brothers perform (the same command id, 0x3072 or 0x3070: the note's "Kimahri's Rage rows"), by Kimahri's ability id. */
function rageRecord(rageId: 'mighty-guard' | 'white-wind'): FFXCommandRecord {
  const record = COMMAND_RECORDS_PLAYER[rageId];
  if (record === undefined) throw new Error(`biran-yenke-abilities: Kimahri's Rage '${rageId}' has no command record`);
  return record;
}

/**
 * The game's own command record of each row (`attachCommandRecords`, `../command-records/index.ts`; the words equal `tests/fixtures/parity/ffx/command_records.json`, which `tests/unit/data-ffx-command-records.test.ts`
 * checks, and the rank and chance bytes were read from the kernel tables with the reverse-engineering session's command reader on 2026-10-14, read-only). `type 0` is a monster-side or item row; the two Rages are
 * Kimahri's own (`type 4`, the Overdrive family), so they are the very record objects of `mighty-guard` and `white-wind`. Berserk: the chance byte 120 for status 9, and no duration byte (RE section 6).
 */
export const COMMAND_RECORDS_BIRAN_YENKE: Readonly<Record<string, FFXCommandRecord>> = {
  [BULLDOZE_ID]: { id: 0x60a5, type: 0, flagsMisc: 0x6, flagsDamage: 0x5, damageClass: 1, rank: 3 }, // Bulldoze: physical, can crit, accuracy formula 0
  [FIRE_BREATH_ID]: { id: 0x60a2, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3 }, // Fire Breath (the monster-side row, not Kimahri's 0x3069)
  [AQUA_BREATH_ID]: { id: 0x60a3, type: 0, flagsMisc: 0x6, flagsDamage: 0x0, damageClass: 1, rank: 3 }, // Aqua Breath (the monster-side row, not Kimahri's 0x306e)
  [BERSERK_SELF_ID]: { id: 0x400f, type: 0, flagsMisc: 0x20006, flagsDamage: 0x2, damageClass: 0, rank: 3, chances: [[9, 120]] }, // Berserk: Berserk chance 120, no duration byte
  [BIRAN_MIGHTY_GUARD_ID]: rageRecord('mighty-guard'), // Kimahri's Mighty Guard row 0x3072
  [YENKE_WHITE_WIND_ID]: rageRecord('white-wind'), // Kimahri's White Wind row 0x3070
};

export const BIRAN_YENKE_ABILITIES: Readonly<Record<string, AbilityDef>> = {
  [BULLDOZE_ID]: bulldoze,
  [FIRE_BREATH_ID]: fireBreath,
  [AQUA_BREATH_ID]: aquaBreath,
  [BERSERK_SELF_ID]: berserkSelf,
  [BIRAN_MIGHTY_GUARD_ID]: biranMightyGuard,
  [YENKE_WHITE_WIND_ID]: yenkeWhiteWind,
};
