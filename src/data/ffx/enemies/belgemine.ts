/**
 * Belgemine's eight aeons and the eight formations of the Remiem Temple (FFX only; the hidden Belgemine's Challenge chapter, number 45; FFX Remiem Temple, area 446, `lmyt01_00` to `lmyt01_07`). **Source: the game's own files**,
 * `research/re-ffx-belgemine-aeon-duels.md` sections 0 and 1 ("RE n", `[R]`/`[H]`): the kernel records of `m250`, `m254`, `m265`, `m266`, `m284` to `m291`, and the stat block each script writes at the start of its battle id
 * (`lmyt01_0n`). The scripts are `battle/ffx/ai/belgemine*.ts`; the new rows are `./belgemine-abilities.ts`. `tests/unit/chapters/belgemine-data.test.ts` pins this file to the note field by field.
 *
 * ## The numbers are the script's, not the record's
 *
 * The monster files are shared with Isaaru's three aeons (Chapter XIV: Grothia `m284`, Pterya `m254`, Spathi `m287`) and the Cavern's Yojimbo (`m288`): each script tests the battle id and writes its own stats for each fight
 * (RE 2 item 3). The Remiem stat blocks are therefore **not** the records' (Valefor 20,000 HP against the record's 12,000; Ixion 30,000 against 6,000): every number below is the block RE 0 prints for the Remiem battle id. Where the
 * script writes nothing the record stands (Luck 15; Anima's block is the record's: 54,000 HP, MAG 60; the Sisters' blocks are theirs).
 *
 * ## What every aeon carries (RE 0, the records)
 *
 * Immune (255) to Death, Zombie, Petrify, Poison, the four Breaks, Confuse, Berserk, Provoke, Sleep, Silence, Darkness, Slow, Scan, Eject and Auto-Life; Threaten's byte is 0 (`threatenChance: 0`, immune in this contract, as Chapter XIV's);
 * Doom, Shell, Protect, Reflect, the Nuls, Regen and Haste land. Flags: Sensor, Scan, CTB damage (Delay), Slice and Bribe immune, and "fractional damage" (Demi, Gravity) immune on Valefor, Ifrit, Ixion, Shiva, Anima, Yojimbo and the dog but **not**
 * on the Sisters (RE 0) and **not on Remiem Bahamut** (his script writes ImmuneToFractionalDmg = 0 in the Remiem branch, `m287` @0x0214; the Isaaru branch leaves it). Ixion's record also carries Reflect 255.
 * The dog's record (`m266`) is the exception to the 255 list: it resists only Sleep, Silence and Darkness (20) and nothing else. **No gil, no AP, no drops by record**: every reward is script (RE 8 C3, U4), and the chapter's results page pays none.
 *
 * ## Belgemine and the dog
 *
 * Belgemine (`m250`) is on the field, **untargetable, not on the turn list and no part of the victory** (RE 0: her script clears Targetable, VisibleOnCTB and MustBeKilledForBattleEnd): the same bystander as Isaaru in Chapter XIV
 * (`ordersOnly`, `nonCombatant`, set at the start by `battle/ffx/ai/belgemine-rules.ts#applyBelgemineSetup`). Each aeon's first turn is the Summon, aimed at her. Yojimbo's dog (`m266`, HP 1) is the same kind of body: untargetable,
 * no turn of its own, acting only on Yojimbo's order, with its own Strength 25.
 *
 * ## The chain (BD1, BD3, BD5)
 *
 * The eight acts run in the game's order with no menu between: every act is an **aeon duel** (`aeonsOnly`: the duel rule greys Yuna's foe-aimed rows, "Only an aeon can fight an aeon", and `commandDisables` greys the rest, so her menu is Summon and Grand Summon; **that list is read from the formation scripts** `lmyt01_00` to `_07` (see {@link BELGEMINE_COMMAND_DISABLES}), which also call `setDefendingEnabled(0)` (`defendOff`, so she has no Defend row) and `btlSetCounterFlag(0)` (`counterOff`)), the aeon the enemy
 * holds is **locked** (the mirror, `lockedAeons`; the Sisters lock all three of Yuna's), a defeat retries that act (`checkpointOnEntry`), and every act from the second on is a fresh fight (`restoresPartyOnEntry`,
 * `restoresAeonsOnEntry`: Yuna and every aeon whole; the bag and the Overdrive gauges carry, as a Save Sphere does not touch a gauge). No act is a game over in the game (it ends "player escaped", RE 3.1); here the chain's ordinary loss
 * and retry stand in for it, and the chapter's card says "a lost duel costs nothing".
 */

import type { EnemyDef, EnemyGroupDef, FormationCommandOff, StatBlock, StatusId, StatusImmunities } from '../../../battle/common/types.ts';
import { BELGEMINE_BYSTANDER_SCRIPT, BELGEMINE_ID, BELG_ACTS, BELG_IDS, BELG_PLATE, BELG_ROWS, BELG_SCRIPTS, BELG_SPELLS, type BelgActKey } from '../belgemine-ids.ts';
import { BELGEMINE_ABILITIES } from './belgemine-abilities.ts';

export { BELGEMINE_ABILITIES };

/** One block: the columns of RE 0's table, `hp mp str def mag mdef agi eva acc` (Luck is 15 in every record). */
type Block = readonly [hp: number, mp: number, str: number, def: number, mag: number, mdef: number, agi: number, eva: number, acc: number];

/** RE 0 (`[R, H]`): the Remiem stat blocks. Anima's is the record's (no override); the Sisters' are their records'. */
export const REMIEM_BLOCKS = {
  valefor: [20_000, 500, 35, 85, 48, 0, 17, 0, 0],
  ifrit: [28_000, 800, 29, 40, 45, 40, 18, 10, 15],
  ixion: [30_000, 720, 40, 40, 50, 40, 12, 10, 15],
  shiva: [20_000, 950, 25, 0, 31, 0, 22, 50, 15],
  bahamut: [35_000, 1_500, 32, 0, 47, 0, 18, 0, 15],
  yojimbo: [32_000, 1_200, 30, 0, 45, 0, 25, 50, 15],
  anima: [54_000, 3_000, 38, 0, 60, 0, 15, 0, 0],
  mindy: [20_000, 7_000, 21, 0, 28, 0, 20, 0, 0],
  sandy: [35_000, 3_000, 35, 0, 18, 0, 24, 0, 0],
  cindy: [48_000, 8_000, 48, 0, 38, 0, 15, 0, 0],
} as const satisfies Record<string, Block>;

/** The dog's record (`m266`): HP 1, MP 1, Strength 25, Luck 15. */
export const DOG_BLOCK: Block = [1, 1, 25, 0, 0, 0, 0, 0, 0];

const statsOf = ([hp, mp, str, def, mag, mdef, agi, eva, acc]: Block): StatBlock => ({ hp, mp, str, def, mag, mdef, agi, luck: 15, eva, acc, maxHp: hp, maxMp: mp });

/** The status bytes of 255 every aeon's record carries (the extra-immunity word 0x32F adds Scan, Eject and Auto-Life; the Distill bits have no engine status). */
const AEON_255: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'silence', 'darkness', 'slow', 'scan', 'eject', 'auto-life',
];

function aeonImmunities(extra: readonly StatusId[] = []): StatusImmunities {
  const out: Record<string, number> = {};
  for (const s of [...AEON_255, ...extra]) out[s] = 255;
  return out as StatusImmunities;
}

/** The flag bytes (RE 0): Sensor, Scan, CTB damage, Slice and Bribe immune; "fractional damage" immune except on the Sisters. */
const AEON_FLAGS: EnemyDef['immunityFlags'] = ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe', 'immune-to-scan', 'immune-to-sensor'];
const SISTER_FLAGS: EnemyDef['immunityFlags'] = ['boss', 'immune-to-delay', 'immune-to-bribe', 'immune-to-scan', 'immune-to-sensor'];

/** No gil, no AP, no drops by record (RE 0); the overkill threshold is the aeon's own HP (the scripts write it so). */
const noRewards = (threshold: number): EnemyDef['rewards'] => ({ ap: 0, apOverkill: 0, gil: 0, overkillThreshold: threshold, drops: [] });

/** The summoner: on the field, never targeted, no turn, no part of the victory. The record's HP is 10 (RE 0). */
export function belgemine(): EnemyDef {
  return {
    id: BELGEMINE_ID,
    name: 'Belgemine',
    spriteKey: 'belgemine', // owed: no painting yet; the stage draws the stand-in figure
    slot: 0,
    stats: statsOf([10, 1, 1, 0, 0, 0, 0, 0, 0]),
    hp: 10,
    mp: 1,
    affinities: {},
    immunities: { sleep: 20, silence: 20, darkness: 20 } satisfies StatusImmunities,
    immunityFlags: ['immune-to-sensor', 'immune-to-scan', 'immune-to-bribe'],
    forms: [{ name: 'Belgemine', spriteKey: 'belgemine', hp: 10 }],
    aiScriptId: BELGEMINE_BYSTANDER_SCRIPT,
    rewards: noRewards(10),
    abilityIds: [],
    flags: { untargetable: true, hideHpBar: true },
    poisonTickPercent: 25,
    doomTurns: 3,
    threatenChance: 0,
  };
}

interface AeonSpec {
  id: string;
  name: string;
  sprite: string;
  slot: number;
  block: Block;
  script: string;
  abilityIds: readonly string[];
  affinities?: EnemyDef['affinities'];
  extra255?: readonly StatusId[];
  /** True for a body whose "fractional damage" immunity is off: the Sisters' records, and Remiem Bahamut (his script writes ImmuneToFractionalDmg = 0 in the Remiem branch, `m287` @0x0214). */
  fractional?: boolean;
  sisters?: boolean;
}

function aeon(spec: AeonSpec): EnemyDef {
  const stats = statsOf(spec.block);
  return {
    id: spec.id,
    name: spec.name,
    spriteKey: spec.sprite, // the player's own painting of the aeon, unchanged (BD7)
    slot: spec.slot,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    affinities: spec.affinities ?? {},
    immunities: aeonImmunities(spec.extra255),
    immunityFlags: spec.sisters === true || spec.fractional === true ? SISTER_FLAGS : AEON_FLAGS,
    forms: [{ name: spec.name, spriteKey: spec.sprite, hp: stats.hp }],
    aiScriptId: spec.script,
    rewards: noRewards(stats.hp),
    abilityIds: [...spec.abilityIds],
    flags: { isBoss: true },
    doomTurns: 5,
    threatenChance: 0, // the byte is 0 in every record, a success percentage here (immune)
  };
}

const R = BELG_ROWS;
const S = BELG_SPELLS;

/** The ten aeon bodies, built fresh on each call (a battle owns its records). */
export const belgValefor = (): EnemyDef => aeon({ id: BELG_IDS.valefor, name: 'Valefor', sprite: 'valefor', slot: 1, block: REMIEM_BLOCKS.valefor, script: BELG_SCRIPTS.valefor, abilityIds: [R.summonValefor, R.attackB, R.sonicWings, R.energyRay, R.energyBlast] });
export const belgIfrit = (): EnemyDef =>
  aeon({ id: BELG_IDS.ifrit, name: 'Ifrit', sprite: 'ifrit', slot: 1, block: REMIEM_BLOCKS.ifrit, script: BELG_SCRIPTS.ifrit, abilityIds: [R.summonIfrit, R.attackA, R.meteorStrike, R.hellfire], affinities: { fire: 'absorb' } });
export const belgIxion = (): EnemyDef =>
  aeon({
    id: BELG_IDS.ixion, name: 'Ixion', sprite: 'ixion', slot: 1, block: REMIEM_BLOCKS.ixion, script: BELG_SCRIPTS.ixion, abilityIds: [R.summonIxion, R.attackA, R.aerospark, R.thorsHammer],
    affinities: { lightning: 'absorb' }, extra255: ['reflect'], // the record's Reflect byte is 255
  });
export const belgShiva = (): EnemyDef =>
  aeon({
    id: BELG_IDS.shiva, name: 'Shiva', sprite: 'shiva', slot: 1, block: REMIEM_BLOCKS.shiva, script: BELG_SCRIPTS.shiva,
    abilityIds: [R.summonShiva, R.attackB, R.heavenlyStrike, R.diamondDust, S.blizzara, S.blizzaga], affinities: { ice: 'absorb' },
  });
export const belgBahamut = (): EnemyDef => aeon({ id: BELG_IDS.bahamut, name: 'Bahamut', sprite: 'bahamut', slot: 1, block: REMIEM_BLOCKS.bahamut, script: BELG_SCRIPTS.bahamut, abilityIds: [R.summonBahamut, R.attackB, R.impulse, R.megaFlare], fractional: true });
export const belgYojimbo = (): EnemyDef =>
  aeon({ id: BELG_IDS.yojimbo, name: 'Yojimbo', sprite: 'yojimbo-cavern', slot: 1, block: REMIEM_BLOCKS.yojimbo, script: BELG_SCRIPTS.yojimbo, abilityIds: [R.summonYojimbo, R.kozuka, R.wakizashi, R.zanmato, R.daigoroOrder] });
export const belgAnima = (): EnemyDef =>
  aeon({ id: BELG_IDS.anima, name: 'Anima', sprite: 'anima', slot: 1, block: REMIEM_BLOCKS.anima, script: BELG_SCRIPTS.anima, abilityIds: [R.summonAnima, R.animaAttack, R.pain, R.oblivion, S.demi, S.dispel] });

/** Yojimbo's dog (`m266`): untargetable, no turn, bites only on the order, with its own Strength 25. */
export function belgDog(): EnemyDef {
  return {
    ...aeon({ id: BELG_IDS.dog, name: 'Daigoro', sprite: 'daigoro', slot: 2, block: DOG_BLOCK, script: BELG_SCRIPTS.dog, abilityIds: [R.daigoroBite] }),
    // The record (`m266`) resists almost nothing: Sleep, Silence and Darkness 20, every other status byte 0 (it is untargetable, so no status reaches it either way).
    immunities: { sleep: 20, silence: 20, darkness: 20 } satisfies StatusImmunities,
    flags: { untargetable: true, hideHpBar: true },
    rewards: noRewards(1),
  };
}

const MIGHTY = R.mightyGuard;
export const belgMindy = (): EnemyDef =>
  aeon({
    id: BELG_IDS.mindy, name: 'Mindy', sprite: 'mindy', slot: 1, block: REMIEM_BLOCKS.mindy, script: BELG_SCRIPTS.mindy, sisters: true,
    abilityIds: [R.passado, S.flare, S.thundara, S.fira, S.blizzara, S.watera, S.ultima, S.thundaga, S.firaga, S.blizzaga, S.waterga],
  });
export const belgSandy = (): EnemyDef => aeon({ id: BELG_IDS.sandy, name: 'Sandy', sprite: 'sandy', slot: 2, block: REMIEM_BLOCKS.sandy, script: BELG_SCRIPTS.sandy, sisters: true, abilityIds: [R.attackB, R.razzia] });
export const belgCindy = (): EnemyDef =>
  aeon({
    id: BELG_IDS.cindy, name: 'Cindy', sprite: 'cindy', slot: 3, block: REMIEM_BLOCKS.cindy, script: BELG_SCRIPTS.cindy, sisters: true,
    abilityIds: [R.summonSisters, R.deltaAttack, MIGHTY, R.whiteWind, R.camisade, S.holy, S.drain, S.osmose, S.demi, S.dispel, S.shell, S.protect, S.cura, S.regen],
  });

/**
 * **Read from the formation scripts** `lmyt01_00` to `_07` (`_00` and `_07` were dumped and read line by line; the repo's formation-flag fixture lists all eight under the same flag calls). Each script's first function calls
 * `setCommandDisabled(all characters and aeons, Switch, 1)` and `setCommandDisabled(1, <command>, 1)` for Yuna's Attack, Item, Weapon, Armor, Black Magic, White Magic, Skill and Special, so her menu is Summon and Grand Summon
 * (Dismiss, the list never touches; the tactic never plays it). The same function calls `setDefendingEnabled(0)` (the groups' `defendOff`) and `btlSetCounterFlag(0)` (`counterOff`). Escape and Flee are not in the list: the chain's
 * `canEscape: false` closes them. The scripts also call `setCommandDisabled(1, 8, 0)` (Valefor's act) and `(1, 15 to 17, 0)` (the Sisters' act), the aeon-availability byte set to "available"; the build expresses the aeon the enemy holds
 * as the mirror lock (`lockedAeons`), so those writes are not copied.
 */
export const BELGEMINE_COMMAND_DISABLES: readonly FormationCommandOff[] = [
  { who: 'everyone', command: 0x3002 }, // Switch
  { who: 'yuna', command: 0x3000 }, // Attack
  { who: 'yuna', command: 0x3001 }, // Item
  { who: 'yuna', command: 0x3004 }, // Weapon
  { who: 'yuna', command: 0x3005 }, // Armor
  { who: 'yuna', command: 0x3113 }, // Skill
  { who: 'yuna', command: 0x3114 }, // Special
  { who: 'yuna', command: 0x3115 }, // Black Magic
  { who: 'yuna', command: 0x3116 }, // White Magic
];

/** The bodies of each act, after Belgemine herself. */
const BODIES: Readonly<Record<BelgActKey, () => EnemyDef[]>> = {
  valefor: () => [belgValefor()],
  ifrit: () => [belgIfrit()],
  ixion: () => [belgIxion()],
  shiva: () => [belgShiva()],
  bahamut: () => [belgBahamut()],
  yojimbo: () => [belgYojimbo(), belgDog()],
  anima: () => [belgAnima()],
  sisters: () => [belgMindy(), belgSandy(), belgCindy()],
};

/** The headline each act's battle-start card names (the aeon, or the three). */
const HEADLINE: Readonly<Record<BelgActKey, string>> = {
  valefor: 'Valefor', ifrit: 'Ifrit', ixion: 'Ixion', shiva: 'Shiva', bahamut: 'Bahamut', yojimbo: 'Yojimbo', anima: 'Anima', sisters: 'The Magus Sisters',
};

/** The id each act's `bossId` names (the headline body). */
const BOSS: Readonly<Record<BelgActKey, string>> = {
  valefor: BELG_IDS.valefor, ifrit: BELG_IDS.ifrit, ixion: BELG_IDS.ixion, shiva: BELG_IDS.shiva, bahamut: BELG_IDS.bahamut, yojimbo: BELG_IDS.yojimbo, anima: BELG_IDS.anima, sisters: BELG_IDS.cindy,
};

/** The enemy body each of Yuna's aeons is locked against (the mirror lock, RE 3.1): her own copy of the aeon the enemy holds. */
const MIRROR: Readonly<Record<string, string>> = {
  valefor: BELG_IDS.valefor, ifrit: BELG_IDS.ifrit, ixion: BELG_IDS.ixion, shiva: BELG_IDS.shiva, bahamut: BELG_IDS.bahamut, yojimbo: BELG_IDS.yojimbo, anima: BELG_IDS.anima, cindy: BELG_IDS.cindy, sandy: BELG_IDS.sandy, mindy: BELG_IDS.mindy,
};

/** One act as a formation. */
export function belgemineGroup(index: number): EnemyGroupDef {
  const act = BELG_ACTS[index];
  if (act === undefined) throw new Error(`belgemine: no act ${index}`);
  const next = BELG_ACTS[index + 1];
  const first = index === 0;
  return {
    id: act.groupId,
    game: 'ffx',
    canEscape: false,
    enemies: [belgemine(), ...BODIES[act.key]()],
    bossId: BOSS[act.key],
    headline: HEADLINE[act.key],
    plate: BELG_PLATE, // the Cavern plate as the Remiem court's stand-in (`src/scenes/belgemine.ts`)
    ...(next !== undefined ? { nextGroupId: next.groupId } : {}),
    aeonsOnly: true,
    defendOff: true, // `lmyt01_0n`: setDefendingEnabled(0), so Yuna has no Defend row (`battle/ffx/formation-flags.ts`, RC10)
    counterOff: true, // `lmyt01_0n`: btlSetCounterFlag(0), so no counter answers a hit (`battle/ffx/formation-flags.ts`)
    commandDisables: BELGEMINE_COMMAND_DISABLES,
    lockedAeons: act.locks.map((aeonId) => ({ aeonId, mirrorOf: MIRROR[aeonId]! })),
    ...(first ? {} : { checkpointOnEntry: true, restoresPartyOnEntry: true, restoresAeonsOnEntry: true, noSaveSphereCard: true }),
    musicCues: [{ at: 'start', track: 'boss-isaaru', fadeMs: 1200 }], // the aeon contest's cue: a flagged stand-in (BD8; rule 13)
  };
}

/** The eight groups in chain order. */
export const BELGEMINE_GROUPS: readonly EnemyGroupDef[] = BELG_ACTS.map((_, i) => belgemineGroup(i));

/** The first group, the chapter's `enemyGroupRef`. */
export const belgemineFirstGroup: EnemyGroupDef = BELGEMINE_GROUPS[0]!;
