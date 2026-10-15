/**
 * Angra Mainyu's, Tawrich's and Zarich's moves (FFX-2 Chapter 5, the Bikanel excavation camp; the hidden chapter "Angra Mainyu", number 26).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-angra-mainyu.md` ("§n"). **No row of these three monsters was read** (§0.2): every move below is either a **stand-in row**, a
 * row of the game's own table that other monsters of this game use and that this chapter borrows, laid by `../command-records/angra-mainyu.ts` (so the charge, the recovery and every flag the engine reads are
 * that row's), or an `[estimate]` built from the written sources' description (`[search: N sources]`, read through the web search tool's summaries). Each move says which.
 *
 * | Move | Source | Built from |
 * |---|---|---|
 * | Perdition's Flame | §3.1: ten hits on random girls, 3/16 of the target's maximum HP each `[search: 3 sources]`; physical `[single source]` | formula 7, power 3, ten random hits, physical (Protect halves each hit), never misses `[estimate]`; no row: derived, Trema's Meteor's shape (row 0x4128) with its charge and recovery |
 * | Demi | §3.1 `[search: 2 sources]` | the shared Demi row 0x3082 (a quarter of current HP, Gravity, every girl) |
 * | Flare | §3.1 `[search: 2 sources]` | the shared monster Flare 0x41fa (magic, power 30, one girl, reflectable) |
 * | Curaga | §3.1 `[search: 2 sources]` | the party's Curaga 0x30b5 (healing, power 38), on himself `[estimate]` |
 * | Full-Life | §3.1 `[search: 4 sources]`, costs MP `[search: 2 sources]` | the shared monster Full-Life 0x4069 (Vegnagun's Core and Redoubts), 60 MP `[estimate: the party's cost]` |
 * | Osmose | §3.1 `[search: 3 sources]` | the monster Osmose 0x406d (MP class, 3/16 of current MP, absorbed; Leblanc's) |
 * | Punch | §3.2 `[search: 2 sources]` | Strength formula, power 16, physical, rolls to hit `[estimate]` |
 * | Bloody Breath | §3.2: Confusion, Silence, Darkness, Poison `[search: 2 sources]` | every girl, no damage, each status at chance 50 `[estimate]` |
 * | -ara spells | §3.3 `[search: single source]` | the shared monster rows 0x41ed to 0x41f0 (power 12) |
 * | -aga spells | §3.3 `[search: single source]` | the shared monster rows 0x41f1 to 0x41f4 (power 19) |
 * | Glimmer of Despair | §3.3: the party's MP down, Strength, Magic, Defense and Magic Defense one stage down `[search: 2 sources]` | every girl, MP class, 3/16 of current MP `[estimate]`, the four stages down |
 *
 * **Hit rule** (hard rule 5): every move but Punch carries `canMiss: false` (magic and the fractional moves never roll; Punch is the one physical blow that does). The MP costs are the stand-in rows'
 * own users' (Flare 54 and Demi 10 as the Nodes and Trema list them, Curaga the party's 20) `[estimate]`; the scripts never cast what they cannot pay for (`battle/ffx2/ai/angra-mainyu.ts`).
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { ANGRA_ABILITY, TAWRICH_ABILITY, ZARICH_ABILITY } from '../../angra-mainyu-ids.ts';

export { ANGRA_ABILITY, TAWRICH_ABILITY, ZARICH_ABILITY };

const base = {
  game: 'ffx2' as const,
  category: 'enemy' as const,
  mpCost: 0,
  hits: 1,
  statusEffects: [],
  removesStatuses: [],
  flags: [],
};

/** Perdition's Flame (§3.1): the fraction, the hits, and the charge and recovery of Trema's Meteor, the one shape of this kind in the game's table this chapter can read `[estimate]`. */
export const PERDITIONS_FLAME = { power: 3, hits: 10, chargeTicks: 120, recoveryTicks: 100 } as const;
/** Full-Life's MP cost: the party's (`../abilities/white-mage.ts`), the monster's own cost not being read (§3.1, `[estimate]`). */
export const ANGRA_FULL_LIFE_MP = 60;
/** The other MP costs, from the stand-in rows' own users (`[estimate]`): Flare as the Nodes, Demi as Trema, Curaga as the party. */
export const ANGRA_MP_COST = { demi: 10, flare: 54, curaga: 20 } as const;

/** Zarich's four elements, in the order of his spell ids (Fire, Ice, Thunder, Water), and the spells' names. */
const ELEMENTS = ['fire', 'ice', 'lightning', 'water'] as const;
const ARA_NAME = ['Fira', 'Blizzara', 'Thundara', 'Watera'] as const;
const AGA_NAME = ['Firaga', 'Blizzaga', 'Thundaga', 'Waterga'] as const;

/** Angra Mainyu (§3.1). */
const angraMoves: AbilityDef[] = [
  {
    ...base,
    id: ANGRA_ABILITY.perditionsFlame,
    name: "Perdition's Flame",
    power: PERDITIONS_FLAME.power, // 3/16 of the target's maximum HP a hit [search: 3 sources]
    formula: 'percent-total',
    damageType: 'physical', // "a fractional, non-elemental physical attack" [single source]: Protect halves each hit
    element: ['none'],
    targeting: 'random-enemy', // one random girl per hit (research/ffx2-combat-core.md §3538, verified: 3 sources)
    hits: PERDITIONS_FLAME.hits, // ten [search: 3 sources]
    canMiss: false, // [estimate]: no source says it misses
    chargeTicks: PERDITIONS_FLAME.chargeTicks,
    recoveryTicks: PERDITIONS_FLAME.recoveryTicks,
    messageTemplate: "Angra Mainyu unleashes Perdition's Flame",
  },
  {
    ...base,
    id: ANGRA_ABILITY.demi,
    name: 'Demi',
    mpCost: ANGRA_MP_COST.demi,
    power: 4, // a quarter of current HP, Gravity, every girl: the shared row 0x3082
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'],
    targeting: 'all-enemies',
    canMiss: false,
    messageTemplate: 'Angra Mainyu casts Demi',
  },
  {
    ...base,
    id: ANGRA_ABILITY.flare,
    name: 'Flare',
    mpCost: ANGRA_MP_COST.flare,
    power: 30, // the shared monster Flare 0x41fa
    formula: 'magic',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-enemy',
    canMiss: false,
    canReflect: true, // the row is reflectable: Reflect sends it back [single source]
    messageTemplate: 'Angra Mainyu casts Flare on {target}',
  },
  {
    ...base,
    id: ANGRA_ABILITY.curaga,
    name: 'Curaga',
    mpCost: ANGRA_MP_COST.curaga,
    power: 38, // the party's Curaga 0x30b5
    formula: 'healing',
    damageType: 'other',
    element: ['none'],
    targeting: 'self', // [estimate]: on himself
    flags: ['heals'],
    canMiss: false,
    messageTemplate: 'Angra Mainyu casts Curaga',
  },
  {
    ...base,
    id: ANGRA_ABILITY.fullLife,
    name: 'Full-Life',
    mpCost: ANGRA_FULL_LIFE_MP,
    power: 16, // the shared monster Full-Life 0x4069: full HP
    formula: 'percent-total',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-ally', // one of his fallen arms
    flags: ['heals', 'can-target-dead', 'misses-if-target-alive'],
    canMiss: false,
    messageTemplate: 'Angra Mainyu revives {target}',
  },
  {
    ...base,
    id: ANGRA_ABILITY.osmose,
    name: 'Osmose',
    power: 3, // 3/16 of the target's current MP, absorbed: the monster Osmose 0x406d
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'single-enemy',
    flags: ['drains-mp'],
    canMiss: false,
    extra: { mpOnly: true },
    messageTemplate: 'Angra Mainyu casts Osmose on {target}',
  },
];

/** Tawrich, the right arm (§3.2). */
const tawrichMoves: AbilityDef[] = [
  {
    ...base,
    id: TAWRICH_ABILITY.punch,
    name: 'Punch',
    category: 'attack',
    power: 16, // the house's monster blow [estimate]; Strength formula, physical
    formula: 'strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-enemy',
    messageTemplate: 'Tawrich punches {target}',
  },
  {
    ...base,
    id: TAWRICH_ABILITY.bloodyBreath,
    name: 'Bloody Breath',
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies', // [estimate]: every girl
    // Confusion, Silence, Darkness and Poison [search: 2 sources]; the chance of each is not in any summary: 50 [estimate]
    statusEffects: [
      { status: 'confuse', chance: 50, duration: 0 },
      { status: 'silence', chance: 50, duration: 0 },
      { status: 'darkness', chance: 50, duration: 0 },
      { status: 'poison', chance: 50, duration: 0 },
    ],
    canMiss: false,
    messageTemplate: 'Tawrich breathes Bloody Breath',
  },
];

/** One of Zarich's spells (§3.3): one girl, on the shared monster row of its element and tier. */
function zarichSpell(id: string, element: (typeof ELEMENTS)[number], name: string, power: number): AbilityDef {
  return {
    ...base,
    id,
    name,
    power,
    formula: 'magic',
    damageType: 'magical',
    element: [element],
    targeting: 'single-enemy',
    canMiss: false,
    messageTemplate: `Zarich casts ${name} on {target}`,
  };
}

/** Zarich, the left arm (§3.3). */
const zarichMoves: AbilityDef[] = [
  ...ZARICH_ABILITY.ara.map((id, i) => zarichSpell(id, ELEMENTS[i]!, ARA_NAME[i]!, 12)),
  ...ZARICH_ABILITY.aga.map((id, i) => zarichSpell(id, ELEMENTS[i]!, AGA_NAME[i]!, 19)),
  {
    ...base,
    id: ZARICH_ABILITY.glimmer,
    name: 'Glimmer of Despair',
    power: 3, // 3/16 of each girl's current MP [estimate]
    formula: 'percent-current',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    // Strength, Magic, Defense and Magic Defense one stage down each [search: 2 sources]; lands unless the girl is immune (254, the house reading of an unpublished chance) [estimate]
    statusEffects: [
      { status: 'str-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'mag-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'def-down', chance: 254, duration: 0, stacks: 1 },
      { status: 'mdef-down', chance: 254, duration: 0, stacks: 1 },
    ],
    canMiss: false,
    extra: { mpOnly: true },
    messageTemplate: 'Zarich casts Glimmer of Despair',
  },
];

/** Every move of the three, research §3. */
export const angraMainyuAbilities: AbilityDef[] = [...angraMoves, ...tawrichMoves, ...zarichMoves];
