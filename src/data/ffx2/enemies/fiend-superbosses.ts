/**
 * Almighty Shinra and the Major Numerus: the two acts of the hidden chapter "The Fiend Arena Superbosses" (`monster.bin` rows 329 to 336, the top of the Fiend Arena). **FFX-2 only** [AGENTS.md rule 14]: ATB,
 * dresspheres and the FFX-2 monster rows; Shinra is the FFX-2 boy, and the Major Numerus is not an FFX monster, so nothing of `src/data/ffx` is read or changed.
 *
 * Bailey, 2026-11-06: "implement all unimplemented chapters please" and "yes on all these too" (to building every researched boss he never picked, hidden behind words); 2026-10-31: "you make the executive decisions for
 * the next few days. i'll go with all of your recommendations." It ships **hidden behind a typed word** (`legion`, chapter number 53; the chapter record and the door are a later stage of the lane). Every pick (LG1 to LG11 of
 * `docs/plans/ch-fiend-superbosses-review.md`) is the paper preflight's own recommendation, "driver's call, his to overturn".
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-fiend-arena-superbosses.md` section 0, `monster.bin` of the Steam HD Remaster), each tagged `[RE row n]` below; `attachMonsterRecords` lays the rows on each
 * enemy at the foot of this file (ACC 130 on Shinra and 255 on the heads, the resist bytes, the special word, the steal byte). `tests/unit/chapters/fiend-superbosses-data.test.ts` pins this file and the records against
 * `tests/fixtures/parity/ffx2/fiend_superbosses_rows.json`, which a script decoded from the kernel tables.
 *
 * **Two acts, one seam (LG1, LG8).** Act 1 is Almighty Shinra alone (row 329); act 2 is the Major Numerus: **seven actors** on one frame. The four heads (Unum 330, Duo 331, Tria 332, Quattour 333) are the only things with
 * real HP (555,555, 666,666, 666,666 and 777,777) and are the formation's enemies; the body (334), the pod (335) and the tail (336) are Lv 1 with 1 HP and no moves, and are `parts` of the formation, never drawn and never
 * targeted (`hidden`, `untargetable`, `hideHpBar`): the body and the tail switch their own cursor and existence off in their scripts, the pod switches nothing off and whether it can be aimed at is unknown [RE section 8, U2],
 * so it is hidden like the other two. **The game's death rule** (each head's death handler sets the body and the pod to 0 HP when the other three heads are at 0) **is the engine's standing rule for parts**: a part never gates
 * victory (`battle/ffx2/results.ts`), so the fight ends when the last head falls, with the body, pod and tail left at 1 HP [RE section 2]. The game's slot map is body 1, Unum 2, Duo 3, Tria 4, Quattour 5, pod 6, tail 7;
 * the heads here take the engine's slots 0 to 3 (the stage places a combatant by its slot) and the parts 4 to 6.
 *
 * **Elements.** Shinra nulls Gravity only; each head nulls Fire, Ice, Thunder, Water and Gravity and takes Holy and non-elemental damage at the normal rate [RE section 0]. Shinra's Regen and Spellspring, and the heads' Spellspring,
 * are permanent statuses (`autoStatuses`: the group masks 0x2000 and 0x8). The special words (0x3db, 0x7c3) set the percent-immune, no-ATB-damage and Interrupt-immune bits, so delay, Interrupt and the percent formulas do nothing
 * to either boss.
 *
 * **Stand-ins (rule 13 and the lane's brief).** The paintings are existing ones (`../../fiend-superbosses-ids.ts` names them and why), the music is `boss-trema` (LG9), and the stage is the Den of Woe's (LG5); nothing here is final.
 *
 * Source: `research/re-ffx2-fiend-arena-superbosses.md` §0 (the rows), §2 (the part structure) and §3 (the scripts).
 * Confidence: [verified: the game's own table, decoded by a script and pinned by `tests/unit/chapters/fiend-superbosses-data.test.ts`]; the sensor and scan texts, the sprite keys and the slot numbers are ours.
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  ACT_1_GROUP_ID,
  ACT_2_GROUP_ID,
  DUO_SCRIPT_ID,
  DUO_SPRITE,
  FS_ABILITY as A,
  NUMERUS_BODY_SPRITE,
  NUMERUS_HEADLINE,
  NUMERUS_PART_SCRIPT_ID,
  NUMERUS_POD_SPRITE,
  NUMERUS_TAIL_SPRITE,
  QUATTOUR_SCRIPT_ID,
  QUATTOUR_SPRITE,
  SHINRA_SCRIPT_ID,
  SHINRA_SPRITE,
  TRIA_SCRIPT_ID,
  TRIA_SPRITE,
  UNUM_SCRIPT_ID,
  UNUM_SPRITE,
  X2_ALMIGHTY_SHINRA_ID,
  X2_NUMERUS_BODY_ID,
  X2_NUMERUS_DUO_ID,
  X2_NUMERUS_POD_ID,
  X2_NUMERUS_QUATTOUR_ID,
  X2_NUMERUS_TAIL_ID,
  X2_NUMERUS_TRIA_ID,
  X2_NUMERUS_UNUM_ID,
} from '../../fiend-superbosses-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';

/**
 * The ailments all five are immune to [RE rows 329 to 333 resist bytes]: Death, Petrify, Sleep, Silence, Darkness, Poison, Confusion, Berserk and Curse (group 1), the Eject byte, Slow, Stop and Doom (group 2); the special
 * word's Interrupt bit (bit 9) and no-ATB-damage bit (bit 6) are set on all five. The stat stages (group 2 slots 7 to 13) read 255 too; the monster record replaces these bytes wherever the engine has a slot, and Reflect
 * is 255 on Shinra alone.
 */
const SHARED_IMMUNE: StatusImmunities = {
  ko: 255,
  petrify: 255,
  sleep: 255,
  silence: 255,
  darkness: 255,
  poison: 255,
  confuse: 255,
  berserk: 255,
  curse: 255,
  eject: 255,
  slow: 255,
  stop: 255,
  doom: 255,
  'delay-effect': 255,
  'action-cancel': 255,
};

/** The fights play the Fiend Arena's superboss cue as a flagged stand-in (LG9; Bailey's ears decide, rule 13). */
const CUE = [{ at: 'start' as const, track: 'boss-trema' as const, fadeMs: 800 }];

/** The heads' nulled elements [RE rows 330 to 333, null byte 0x1f]: Fire, Ice, Thunder, Water and Gravity. */
const HEAD_NULLS: EnemyDef['affinities'] = { fire: 'immune', ice: 'immune', lightning: 'immune', water: 'immune', gravity: 'immune' };

/** What the three hidden parts pay: nothing [RE rows 334 to 336: EXP, AP, Gil, drop and steal all 0]. */
const NO_REWARDS: EnemyDef['rewards'] = { ap: 0, apOverkill: 0, gil: 0, exp: 0, overkillThreshold: 0, drops: [] };

/** Almighty Shinra, act 1: `monster.bin` row 329 (id 0x1149), Lv 99, every stat 255. */
export const x2AlmightyShinra: EnemyDef = {
  id: X2_ALMIGHTY_SHINRA_ID,
  name: 'Almighty Shinra',
  spriteKey: SHINRA_SPRITE,
  slot: 0,
  stats: {
    hp: 275000, // [RE row 329]
    mp: 999,
    maxHp: 275000,
    maxMp: 999,
    str: 255, // STR / DEF / MAG / MDEF 255 / 255 / 255 / 255 [RE row 329]: only Defense-piercing attacks work
    def: 255,
    mag: 255,
    mdef: 255,
    agi: 255, // AGI 255, ACC 130, EVA 30, LCK 34 [RE row 329]
    eva: 30,
    luck: 34,
    acc: 130,
  },
  hp: 275000,
  mp: 999,
  level: 99,
  affinities: { gravity: 'immune' }, // null byte 0x10: Gravity alone [RE row 329]
  immunities: { ...SHARED_IMMUNE, reflect: 255 }, // special 0x3db (bits 0, 1, 3, 4, 6, 7, 8, 9); the Reflect byte reads 255: he cannot be given Reflect [RE row 329]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'], // special bit 0 (the percent formulas do nothing) and bit 6
  autoStatuses: ['spellspring', 'regen'], // group-1 mask 0x2000 (Use MP 0) and group-2 mask 0x8 (Regen) [RE row 329]
  forms: [{ name: 'Almighty Shinra', spriteKey: SHINRA_SPRITE, hp: 275000 }],
  aiScriptId: SHINRA_SCRIPT_ID,
  rewards: {
    ap: 1, // EXP / Gil / AP 3,000 / 3,000 / 1, Pilfer Gil 5,000 [RE row 329]
    apOverkill: 1,
    gil: 3000,
    stolenGil: 5000,
    exp: 3000,
    overkillThreshold: 0,
    drops: [{ itemId: 'x2-dark-matter', count: 2 }], // common Dark Matter x2 [RE row 329]; the rare Ragnarok x1 has no item in the catalog (the gap is in the records' header)
    steal: {
      baseChance: 50, // [model] the house default: the legacy field no source gives; the engine's steal reads `stealRate`
      stealRate: 64, // [RE row 329] steal chance byte 64; the monster record lays the same byte
      common: { itemId: 'x2-turbo-ether', count: 1 }, // Turbo Ether x1 / x2 [RE row 329]
      rare: { itemId: 'x2-turbo-ether', count: 2 },
    },
  },
  abilityIds: [A.attack, A.clione, A.ultimaShinra, A.finalImpact, A.fullBreak, A.fireworks, A.haste],
  flags: { isBoss: true },
  sensorText: 'Six beats and round again: ten blows, a strike, Ultima, a strike, a break, haste. When he is low, the Impact: an eighth of everyone’s life and magic, fourteen times.',
  scanText: 'The boy grown to full size, every stat at its ceiling. Only blows that ignore Defense get through, and he mends himself a little all the time.',
};

/** One head of the Major Numerus: what the four share [RE rows 330 to 333]. */
function head(
  fields: Pick<EnemyDef, 'id' | 'name' | 'spriteKey' | 'slot' | 'aiScriptId' | 'abilityIds' | 'sensorText' | 'scanText'> & { hp: number; str: number; def: number; mag: number; mdef: number; agi: number; steal: NonNullable<EnemyDef['rewards']['steal']> },
): EnemyDef {
  const { hp, str, def, mag, mdef, agi, steal, ...rest } = fields;
  return {
    ...rest,
    stats: {
      hp, // [RE rows 330 to 333]
      mp: 999,
      maxHp: hp,
      maxMp: 999,
      str,
      def,
      mag,
      mdef,
      agi,
      eva: 0, // ACC 255, EVA 0, LCK 99 on all four [RE rows 330 to 333]
      luck: 99,
      acc: 255,
    },
    hp,
    mp: 999,
    level: 99,
    affinities: { ...HEAD_NULLS },
    immunities: { ...SHARED_IMMUNE }, // special 0x7c3 (bits 0, 1, 6, 7, 8, 9, 10); no Reflect byte on a head [RE rows 330 to 333]
    immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay'],
    autoStatuses: ['spellspring'], // group-1 mask 0x2000: Use MP 0 [RE rows 330 to 333]
    forms: [{ name: rest.name, spriteKey: rest.spriteKey, hp }],
    rewards: {
      ap: 1, // EXP / Gil / AP 6,000 / 5,000 / 1, Pilfer Gil 3,000 [RE rows 330 to 333]
      apOverkill: 1,
      gil: 5000,
      stolenGil: 3000,
      exp: 6000,
      overkillThreshold: 0,
      drops: [], // the common slot (Enterprise or Invincible x1) and the rare (Iron Duke x5) have no item in the catalog (the gap is in the records' header)
      steal,
    },
    flags: { isBoss: true },
  };
}

/** The steal table of a head: a common item x2 and a Megalixir [RE rows 330 to 333], steal byte 32. */
const headSteal = (itemId: string): NonNullable<EnemyDef['rewards']['steal']> => ({ baseChance: 50, stealRate: 32, common: { itemId, count: 2 }, rare: { itemId: 'x2-megalixir', count: 1 } });

/** Unum, the first head: `monster.bin` row 330 (id 0x114a), 555,555 HP; slot 2 of the game's formation. */
export const x2NumerusUnum: EnemyDef = head({
  id: X2_NUMERUS_UNUM_ID,
  name: 'Unum',
  spriteKey: UNUM_SPRITE,
  slot: 0,
  hp: 555555,
  str: 234, // STR / DEF / MAG / MDEF 234 / 23 / 237 / 81, AGI 173 [RE row 330]
  def: 23,
  mag: 237,
  mdef: 81,
  agi: 173,
  aiScriptId: UNUM_SCRIPT_ID,
  abilityIds: [A.radisCommand, A.sparkler, A.dispel, A.shell, A.whiteHighwind, A.protect],
  steal: headSteal('x2-mega-potion'), // Mega-Potion x2 / Megalixir x1
  sensorText: 'The first head. Sparklers, a Dispel, and Shell and Protect for the whole body. Its Command takes four and a half seconds to charge.',
  scanText: 'The first of four heads on one frame. It keeps the whole body covered in Shell and Protect, and mends it when it is low.',
});

/** Duo, the second head: `monster.bin` row 331 (id 0x114b), 666,666 HP; slot 3 of the game's formation. */
export const x2NumerusDuo: EnemyDef = head({
  id: X2_NUMERUS_DUO_ID,
  name: 'Duo',
  spriteKey: DUO_SPRITE,
  slot: 1,
  hp: 666666,
  str: 226, // STR / DEF / MAG / MDEF 226 / 92 / 238 / 22, AGI 170 [RE row 331]
  def: 92,
  mag: 238,
  mdef: 22,
  agi: 170,
  aiScriptId: DUO_SCRIPT_ID,
  abilityIds: [A.blackSky, A.bio, A.flare, A.break, A.ultima, A.confuse, A.sleep, A.demi, A.berserk, A.blind, A.silence, A.slowga, A.venamCommand],
  steal: headSteal('x2-x-potion'), // X-Potion x2 / Megalixir x1
  sensorText: 'The second head. It flips a coin for every spell, and ends its nine beats with Venam Command, which poisons all three of you.',
  scanText: 'The second head. Its spells are all status and black magic, and each beat is a coin toss between two of them.',
});

/** Tria, the third head: `monster.bin` row 332 (id 0x114c), 666,666 HP; slot 4 of the game's formation. */
export const x2NumerusTria: EnemyDef = head({
  id: X2_NUMERUS_TRIA_ID,
  name: 'Tria',
  spriteKey: TRIA_SPRITE,
  slot: 2,
  hp: 666666,
  str: 241, // STR / DEF / MAG / MDEF 241 / 89 / 222 / 28, AGI 172 [RE row 332]
  def: 89,
  mag: 222,
  mdef: 28,
  agi: 172,
  aiScriptId: TRIA_SCRIPT_ID,
  abilityIds: [A.firaga, A.blizzaga, A.thundaga, A.waterga, A.holy, A.fulmenCommand, A.absorb],
  steal: headSteal('x2-mega-phoenix'), // Mega Phoenix x2 / Megalixir x1
  sensorText: 'The third head. The four -aga spells, or Holy, and the Fulmen Command: the strongest blow in the game, on all three of you.',
  scanText: 'The third head. Elemental magic and Holy, and a Thunder Command that nothing at this level shrugs off.',
});

/** Quattour, the fourth head: `monster.bin` row 333 (id 0x114d), 777,777 HP; slot 5 of the game's formation. */
export const x2NumerusQuattour: EnemyDef = head({
  id: X2_NUMERUS_QUATTOUR_ID,
  name: 'Quattour',
  spriteKey: QUATTOUR_SPRITE,
  slot: 3,
  hp: 777777,
  str: 237, // STR / DEF / MAG / MDEF 237 / 27 / 231 / 88, AGI 168 [RE row 333]
  def: 27,
  mag: 231,
  mdef: 88,
  agi: 168,
  aiScriptId: QUATTOUR_SCRIPT_ID,
  abilityIds: [A.fireworks, A.mortisCommand, A.absorb, A.meteor, A.ultima],
  steal: headSteal('x2-elixir'), // Elixir x2 / Megalixir x1
  sensorText: 'The fourth head. Fireworks, Absorb, Meteor and Ultima, in nine beats, and the Mortis Command between them.',
  scanText: 'The fourth head, the largest. It runs nine beats without a coin toss: Fireworks, a Command, Absorb, Meteor, Ultima.',
});

/** One hidden part of the Major Numerus (body 334, pod 335, tail 336): Lv 1, 1 HP, 1 in every stat, no moves, no loot [RE rows 334 to 336]. */
function part(id: string, name: string, spriteKey: string, slot: number): EnemyDef {
  return {
    id,
    name,
    spriteKey,
    slot,
    stats: { hp: 1, mp: 1, maxHp: 1, maxMp: 1, str: 1, def: 1, mag: 1, mdef: 1, agi: 1, eva: 1, luck: 1, acc: 1 }, // [RE rows 334 to 336]
    hp: 1,
    mp: 1,
    level: 1,
    affinities: {},
    immunities: { eject: 255 }, // Eject, Itchy and Auto-Life at 255 [RE rows 334 to 336]; the monster record lays all three
    immunityFlags: [],
    forms: [{ name, spriteKey, hp: 1 }],
    aiScriptId: NUMERUS_PART_SCRIPT_ID, // no script lines in the game (the body and the tail only switch themselves off); the registry's idle script
    rewards: NO_REWARDS,
    abilityIds: [],
    // Never drawn, never targeted: the body and the tail switch their own cursor and existence off [RE section 2]; the pod's targetability is unknown (U2), hidden like them.
    flags: { isPart: true, hidden: true, untargetable: true, hideHpBar: true },
    sensorText: `The ${name.toLowerCase()} of the Major Numerus. It cannot be seen or aimed at.`,
    scanText: `The ${name.toLowerCase()} of the Major Numerus, one point of life and no moves. It falls when the last head does.`,
  };
}

/** The body, the pod and the tail: rows 334, 335 and 336 (ids 0x114e to 0x1150); slots 1, 6 and 7 of the game's formation. */
export const x2NumerusBody: EnemyDef = part(X2_NUMERUS_BODY_ID, 'Body', NUMERUS_BODY_SPRITE, 4);
export const x2NumerusPod: EnemyDef = part(X2_NUMERUS_POD_ID, 'Pod', NUMERUS_POD_SPRITE, 5);
export const x2NumerusTail: EnemyDef = part(X2_NUMERUS_TAIL_ID, 'Tail', NUMERUS_TAIL_SPRITE, 6);

/** The group fields both acts share: no escape, the stand-in cue. */
const COMMON = { game: 'ffx2' as const, canEscape: false, musicCues: CUE };

/** Act 1: Almighty Shinra. Chains to act 2 (the arena mends the girls at the seam). */
export const act1ShinraGroup: EnemyGroupDef = { ...COMMON, id: ACT_1_GROUP_ID, enemies: [x2AlmightyShinra], nextGroupId: ACT_2_GROUP_ID };
/**
 * Act 2: the Major Numerus. The four heads are the enemies, the body, pod and tail its parts (the fight ends when the last head falls, see the header). The link opens at full HP and MP with a fallen girl standing and no Save
 * Sphere card (`restoresPartyOnEntry`, `noSaveSphereCard`: LG1's seam, as the Farplane Cup's); items spent stay spent. The last link of the chapter.
 */
export const act2NumerusGroup: EnemyGroupDef = {
  ...COMMON,
  id: ACT_2_GROUP_ID,
  enemies: [x2NumerusUnum, x2NumerusDuo, x2NumerusTria, x2NumerusQuattour],
  parts: [x2NumerusBody, x2NumerusPod, x2NumerusTail],
  headline: NUMERUS_HEADLINE,
  restoresPartyOnEntry: true,
  noSaveSphereCard: true,
};

export const fiendSuperbossesGroups: readonly EnemyGroupDef[] = [act1ShinraGroup, act2NumerusGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-fiend-superbosses.ts`.
for (const group of fiendSuperbossesGroups) attachMonsterRecords(group);
