/**
 * Rig for `parity-ffx-engine-status.test.ts` (re-parity W2; **FFX only**): generated hits written in the GAME's terms (the
 * target's permanent word, thirteen counters and extra word, its resistance bytes, the stage stacks, the buff flags, the user's
 * weapon strikes and clock), the engine's combatants built from them, and the oracle that runs the kernels on the same
 * situation by an independent route.
 *
 * Nothing here imports `src/battle/ffx/adapt/`: the tables that map a status id to its bit, counter slot or stack are typed
 * again below on purpose, so a wrong bit, a wrong slot, a wrong reading of "permanent" or of a resistance byte in the adapter
 * shows as a difference from the kernel run on the spec. The damage half of a hit reuses `ffxEngineWiring.ts`.
 *
 * What the oracle does NOT model, and the generator therefore keeps out of the situations (the engine's own business around a
 * hit): Reflect's bounce (a reflectable command meets no Reflect), the wake-up of a sleeper by a physical hit (a physical command
 * meets no sleeper), Auto-Life and Eject on the target before the hit, and a target that dies or leaves before the last hit of
 * the action (the engine goes on hitting; the oracle stops, and the situation is skipped).
 */

import { SeededRng } from '../../../src/battle/common/rng.ts';
import type { AbilityDef, FFXCombatant, FFXCommandRecord, StatusId, StatusInstance } from '../../../src/battle/common/types.ts';
import { chrBaseCtb, subCtb } from '../../../src/battle/ffx/kernel/ctb.ts';
import { critCheck } from '../../../src/battle/ffx/kernel/crit.ts';
import { hitCheck } from '../../../src/battle/ffx/kernel/hit.ts';
import { calcHitDamage } from '../../../src/battle/ffx/kernel/hitdamage.ts';
import {
  applyStageBuffs,
  inflictStatuses,
  mergeExtraStatusWord,
  type InflictAllInput,
  type InflictAllResult,
  type StatusRecord,
} from '../../../src/battle/ffx/kernel/status-inflict.ts';
import { applyDoubleHpMp } from '../../../src/battle/ffx/kernel/status-pool.ts';
import { type Situation, type SideSpec, combatantOf, oracleInputs, randomSituation } from './ffxEngineWiring.ts';

// --------------------------------------------------------------------------------------------------- the tables, typed again

/** Permanent statuses by bit (0 Death .. 11 Threaten). */
export const PERM_IDS: readonly StatusId[] = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'threaten'];
/** Temporal statuses by counter slot (0 Sleep .. 12 Slow). The Nul slots (6 to 9) count charges. */
export const TEMPORAL_IDS: readonly StatusId[] = ['sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow'];
/** Extra statuses the engine has, with their bits. */
export const EXTRA_IDS: ReadonlyArray<readonly [StatusId, number]> = [
  ['scan', 0x1], ['shield', 0x40], ['boost', 0x80], ['eject', 0x100], ['auto-life', 0x200], ['curse', 0x400], ['defend', 0x800], ['guard', 0x1000], ['sentinel', 0x2000], ['doom', 0x4000],
];
const KNOWN_EXTRA = EXTRA_IDS.reduce((m, [, bit]) => m | bit, 0);
export const STACK_IDS: readonly StatusId[] = ['cheer', 'aim', 'focus', 'reflex', 'luck', 'jinx'];
export const BUFF_IDS: ReadonlyArray<readonly [StatusId, number]> = [
  ['max-hp-x2', 1], ['max-mp-x2', 2], ['mp-cost-zero', 4], ['damage-9999', 8], ['guaranteed-critical', 0x10], ['overdrive-x1_5', 0x20], ['overdrive-x2', 0x40],
];
/** Weapon status auto-abilities: [auto-ability, status number, chance byte, duration byte]. */
const STRIKES: ReadonlyArray<readonly [string, number, number, number]> = [
  ['stonestrike', 2, 100, 0], ['deathstrike', 0, 100, 0], ['zombiestrike', 1, 100, 0], ['poisonstrike', 3, 100, 0],
  ['sleepstrike', 12, 100, 3], ['silencestrike', 13, 100, 3], ['darkstrike', 14, 100, 3], ['slowstrike', 24, 100, 255],
  ['stonetouch', 2, 50, 0], ['deathtouch', 0, 50, 0], ['zombietouch', 1, 50, 0], ['poisontouch', 3, 50, 0],
  ['sleeptouch', 12, 50, 3], ['silencetouch', 13, 50, 3], ['darktouch', 14, 50, 3], ['slowtouch', 24, 50, 255],
];

// --------------------------------------------------------------------------------------------------------- the situation

/** The target's status words, in the game's terms. */
export interface Words {
  perm: number;
  /** The subset of `perm` (bits 1 to 11) given by equipment. */
  autoPerm: number;
  /** Thirteen counters: 0 off, 1 to 253 turns (Nul: charges), 254 until removed, 255 permanent (equipment-given). */
  counters: number[];
  extra: number;
  autoExtra: number;
  stacks: number[];
  buff: number;
}

export interface StatusExtras {
  words: Words;
  /** The target's 25 resistance bytes. Index 11 (Threaten) is derived from `threatenChance`. */
  resist: number[];
  extraImmune: number;
  lifeImmune: boolean;
  /** An enemy target's live Threaten percent; a party member's byte is 0. */
  threatenChance: number;
  threatenImmune: boolean;
  /** The target carries the "immune to Regen" flag instead of a resistance byte of 255. */
  regenFlag: boolean;
  targetMonster: boolean;
  /** An enemy target's Doom countdown (the monster record's byte); a party member's is 5. */
  doomTurns: number;
  /** The user's clock: counter, Haste and Slow counters (0 off, 1 to 253, 254, 255 permanent), and its weapon's status strikes. */
  userCtb: number;
  userHaste: number;
  userSlow: number;
  strikes: string[];
  /** How many hits the action makes (any of 1 to 3, whatever the ability's own count). */
  hits: number;
  /** Extra statuses whose immunity byte is 254: NOT immune (the threshold is 255). */
  extraNear: number;
  /** A party target wears Break HP Limit / Break MP Limit: the Double HP and Double MP ceilings rise from 9,999 and 999 to 99,999 and 9,999. */
  breakHp: boolean;
  breakMp: boolean;
}

export type StatusSituation = Situation & StatusExtras;

const POOL_KEYS = ['chances', 'durations', 'extra', 'stage', 'buff'] as const;

/** A record with any status payload. */
function hasPayload(r: FFXCommandRecord): boolean {
  return POOL_KEYS.some((k) => r[k] !== undefined);
}

/**
 * The abilities a status situation may use: recorded commands that carry a status payload (and a few that carry none, to spend a
 * Petrified target's shatter roll), aimed at one other combatant, nothing scripted. The ability's own `statusEffects` and
 * `removesStatuses` are left as they are: a recorded command takes the game's bytes and ignores them. The infliction step does not
 * read the targeting, so every command is used on ONE other combatant: a party-wide buff (Cheer, Protect, Hastega, Dispel) on one
 * ally, a command that targets its own user (Defend, the aeons' stances) on an ally too. Only the self-cast rule reads the two ids,
 * which the hand-worked tests cover.
 */
export function statusPool(all: readonly AbilityDef[]): AbilityDef[] {
  return all
    .filter(
      (a) =>
        a.record !== undefined &&
        (hasPayload(a.record) || a.id === 'attack' || a.record.damageClass === 0) &&
      !a.flags.includes('destroys-user') &&
      a.extra?.['script'] === undefined &&
      a.extra?.['statsFrom'] === undefined &&
      a.extra?.['opensSubmenu'] === undefined &&
      a.extra?.['stealRoll'] === undefined &&
      a.extra?.['resolvesToOneOf'] === undefined &&
      a.extra?.['ordersActor'] === undefined &&
      a.hits >= 1 &&
      a.hits <= 3,
    )
    .map((a) => ({ ...a, targeting: singleTarget(a.targeting) }));
}

/** The single-target form of a targeting value. */
function singleTarget(t: AbilityDef['targeting']): AbilityDef['targeting'] {
  switch (t) {
    case 'all-enemies':
    case 'random-enemy':
      return 'single-enemy';
    case 'all-allies':
    case 'random-ally':
    case 'self':
      return 'single-ally';
    case 'all':
      return 'single-any';
    default:
      return t;
  }
}

const pickOf = <T,>(rng: SeededRng, xs: readonly T[]): T => rng.pick(xs);
const chance = (rng: SeededRng, p: number): boolean => rng.next() < p;

/** A random set of target status words. Invariants the game keeps: Petrify stands alone, one of the four exclusive mind statuses, Haste or Slow. */
function randomWords(rng: SeededRng, dead: boolean): Words {
  const w: Words = { perm: 0, autoPerm: 0, counters: new Array<number>(13).fill(0), extra: 0, autoExtra: 0, stacks: new Array<number>(6).fill(0), buff: 0 };
  if (dead) {
    // The game's death resets every status; the engine keeps Zombie and Scan on a member who dies.
    w.perm = 1 | (chance(rng, 0.3) ? 2 : 0);
    if (chance(rng, 0.2)) w.extra = 1;
    return w;
  }
  if (chance(rng, 0.05)) {
    w.perm = 4;
    for (let i = 0; i < 6; i++) if (chance(rng, 0.2)) w.stacks[i] = rng.int(1, 5);
    return w;
  }
  for (const [bit, p] of [[2, 0.15], [8, 0.15], [0x10, 0.1], [0x20, 0.1], [0x40, 0.1], [0x80, 0.1]] as const) if (chance(rng, p)) w.perm |= bit;
  if (chance(rng, 0.2)) w.perm |= pickOf(rng, [0x100, 0x200, 0x400, 0x800]);
  for (let bit = 1; bit < 12; bit++) if ((w.perm & (1 << bit)) !== 0 && chance(rng, 0.08)) w.autoPerm |= 1 << bit;
  const counterValues = [1, 2, 3, 5, 10, 99, 253, 254, 255];
  for (let t = 0; t < 13; t++) {
    if (!chance(rng, t === 0 ? 0.08 : 0.12)) continue;
    w.counters[t] = t >= 6 && t <= 9 ? pickOf(rng, [1, 2, 3, 255]) : pickOf(rng, counterValues);
  }
  if (w.counters[11] !== 0 && w.counters[12] !== 0) w.counters[12] = 0; // Haste and Slow exclude each other
  for (const [, bit] of EXTRA_IDS) {
    if (bit === 0x100 || bit === 0x200) continue; // Eject and Auto-Life are the engine's own paths (the target leaves, or stands up again)
    if (chance(rng, 0.08)) w.extra |= bit;
  }
  for (const [, bit] of EXTRA_IDS) if ((w.extra & bit) !== 0 && chance(rng, 0.1)) w.autoExtra |= bit;
  for (let i = 0; i < 6; i++) if (chance(rng, 0.2)) w.stacks[i] = rng.int(1, 5);
  for (const [, bit] of BUFF_IDS) if (bit > 2 && chance(rng, 0.05)) w.buff |= bit; // Double HP and Double MP change the maxima: only a command may add them
  return w;
}

/**
 * The same command with another status payload: random chance and duration bytes, extra bits (Distill and Eject included), stage buffs,
 * buff flags, and the cleanse bit. The engine reads whatever record the ability carries, so the wiring has to hold for any record, not
 * only the shipped ones; both sides read this one. (No Auto-Life bit: a Death that lands beside it stands the target up again, which is
 * the engine's own path.)
 */
function fuzzRecord(rng: SeededRng, rec: FFXCommandRecord): FFXCommandRecord {
  const chances = new Map<number, number>();
  for (let k = rng.int(0, 4); k > 0; k--) chances.set(rng.int(0, 24), pickOf(rng, [1, 10, 30, 50, 100, 100, 150, 254, 255]));
  const durations = new Map<number, number>();
  for (let t = 0; t < 13; t++) if (chances.has(12 + t) || chance(rng, 0.1)) durations.set(t, pickOf(rng, [1, 1, 2, 3, 5, 99, 253, 254, 255]));
  let extra = 0;
  for (const bit of [0x1, 0x40, 0x80, 0x400, 0x800, 0x1000, 0x2000, 0x4000]) if (chance(rng, 0.12)) extra |= bit;
  if (chance(rng, 0.08)) extra |= 0x100;
  if (chance(rng, 0.06)) extra |= pickOf(rng, [0x2, 0x4, 0x8, 0x20]);
  const out: FFXCommandRecord = {
    id: rec.id, type: rec.type, flagsMisc: rec.flagsMisc, damageClass: rec.damageClass,
    flagsDamage: chance(rng, 0.5) ? rec.flagsDamage : chance(rng, 0.5) ? rec.flagsDamage | 0x20 : rec.flagsDamage & ~0x20,
  };
  if (rec.rank !== undefined) out.rank = rec.rank;
  if (chances.size > 0) out.chances = [...chances.entries()].sort((a, b) => a[0] - b[0]);
  if (durations.size > 0) out.durations = [...durations.entries()].sort((a, b) => a[0] - b[0]);
  if (extra !== 0) out.extra = extra;
  if (chance(rng, 0.15)) out.stage = [rng.int(1, 0x3f), pickOf(rng, [1, 1, 2, 5])];
  if (chance(rng, 0.15)) out.buff = pickOf(rng, [1, 2, 3, 4, 8, 0x10, 0x20, 0x40]);
  // Part of the record now (the engine reads this byte, never `AbilityDef.shatterChance`, for a recorded command).
  if (chance(rng, 0.3)) out.shatter = pickOf(rng, [10, 30, 50, 100]);
  return out;
}

/** A random status situation for one ability of the pool. */
export function randomStatusSituation(rng: SeededRng, pool: readonly AbilityDef[]): StatusSituation {
  const base = randomSituation(rng, pool);
  // A revival effect keeps its real record most of the time: it is the one command whose Death byte the engine's revival path reads.
  if (base.def.record && chance(rng, base.def.flags.includes('can-target-dead') ? 0.2 : 0.45)) {
    base.def = { ...base.def, record: fuzzRecord(rng, base.def.record) };
    // The ability's own number is a decoy: it differs from the record's byte and the engine must not read it.
    if (chance(rng, 0.5)) base.def.shatterChance = pickOf(rng, [10, 50, 100]);
  }
  const def = base.def;
  const canTargetDead = def.flags.includes('can-target-dead');
  const dead = canTargetDead && chance(rng, 0.5);
  const targetSide = def.targeting === 'single-ally' ? base.userSide : base.userSide === 'party' ? 'enemy' : 'party';
  const targetMonster = targetSide === 'enemy';
  const words = randomWords(rng, dead);
  // A revival effect on a living Zombie kills it unless the target is immune to Life: make that case common.
  if (canTargetDead && !dead && chance(rng, 0.5)) {
    words.perm = 2;
    words.autoPerm = 0;
  }
  // Things the engine does around a hit that the kernels do not: a reflectable spell bounces off Reflect, a physical hit wakes a sleeper.
  if (def.flags.includes('reflectable')) words.counters[5] = 0;
  if (def.damageType === 'physical') words.counters[0] = 0;
  const resist = new Array<number>(25).fill(0);
  for (let i = 0; i < 25; i++) if (chance(rng, 0.12)) resist[i] = pickOf(rng, [50, 100, 254, 255, 255]);
  const extraImmune = EXTRA_IDS.reduce((m, [, bit]) => (chance(rng, 0.08) ? m | bit : m), 0);
  const sit: StatusSituation = {
    ...base,
    words,
    resist,
    extraImmune,
    // The engine refuses to stand up a KO'd member flagged immune to Life (`hp.ts#reviveActor`); the kernel only reads the bit for Life on a Zombie.
    lifeImmune: !dead && chance(rng, canTargetDead ? 0.4 : 0.15),
    threatenChance: pickOf(rng, [0, 25, 50, 70, 100, 150, 255]),
    threatenImmune: chance(rng, 0.1),
    regenFlag: chance(rng, 0.1),
    targetMonster,
    doomTurns: rng.int(1, 9),
    userCtb: chance(rng, 0.6) ? 0 : rng.int(0, 60),
    userHaste: chance(rng, 0.12) ? pickOf(rng, [1, 5, 254, 255]) : 0,
    userSlow: 0,
    strikes: [],
    // One hit for a reflectable spell (a Reflect landed by one hit bounces the next) and for a physical one (a Sleep landed by one hit is
    // woken by the next): both are the engine's own business around a hit.
    hits: def.flags.includes('reflectable') || def.damageType === 'physical' ? 1 : rng.int(1, 3),
    extraNear: EXTRA_IDS.reduce((m, [, bit]) => ((extraImmune & bit) === 0 && chance(rng, 0.1) ? m | bit : m), 0),
    // Monsters have no equipment, so no auto-ability block (the exe zeroes it); a party target may wear the two.
    breakHp: !targetMonster && chance(rng, 0.3),
    breakMp: !targetMonster && chance(rng, 0.3),
  };
  if (sit.userHaste === 0 && chance(rng, 0.12)) sit.userSlow = pickOf(rng, [1, 5, 254, 255]);
  if (base.userSide === 'party' && chance(rng, 0.5)) {
    const n = rng.int(1, 3);
    // Distinct abilities: the engine's equipment model is a set (`hasAuto`), and no build of ours repeats one on an item.
    for (let i = 0; i < n; i++) {
      const id = (pickOf(rng, STRIKES) as readonly [string, number, number, number])[0];
      if (!sit.strikes.includes(id)) sit.strikes.push(id);
    }
  }
  if (dead) sit.target = { ...sit.target, hp: 0 };
  return sit;
}

// --------------------------------------------------------------------------------------------------------- the engine side

/** A spec with none of the status booleans the damage oracle reads: the words own the target's statuses. */
const noStatus = (s: SideSpec): SideSpec => ({
  ...s,
  zombie: false, powerBreak: false, magicBreak: false, armorBreak: false, mentalBreak: false, berserk: false, darkness: false,
  sleep: false, petrify: false, shield: false, boost: false, defend: false, sentinel: false, protect: false, shell: false,
  nul: [0, 0, 0, 0], dmg9999: false, alwaysCrit: false, cheer: 0, focus: 0, aim: 0, reflex: 0, luckStack: 0, jinx: 0,
});

function instance(id: StatusId, over: Partial<StatusInstance> = {}): StatusInstance {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, ...over };
}

/** The engine's combatant for a target: stats from the spec, statuses and resistances from the words. */
export function targetCombatant(sit: StatusSituation, id: string, side: 'party' | 'enemy'): FFXCombatant {
  const c = combatantOf(noStatus(sit.target), id, side);
  c.statuses = {};
  const w = sit.words;
  PERM_IDS.forEach((status, bit) => {
    if ((w.perm & (1 << bit)) === 0) return;
    if (bit === 0) c.statuses['ko'] = instance('ko', { turnsRemaining: null });
    else c.statuses[status] = instance(status, (w.autoPerm & (1 << bit)) !== 0 ? { permanent: true, turnsRemaining: 255 } : {});
  });
  if ((w.perm & 1) !== 0) {
    c.alive = false;
    c.hp = 0;
  }
  TEMPORAL_IDS.forEach((status, t) => {
    const v = w.counters[t] as number;
    if (v === 0) return;
    const nul = t >= 6 && t <= 9;
    if (v === 255) c.statuses[status] = instance(status, nul ? { permanent: true, charges: null, turnsRemaining: null } : { permanent: true, turnsRemaining: 255 });
    else c.statuses[status] = instance(status, nul ? { charges: v, turnsRemaining: null } : { turnsRemaining: v });
  });
  for (const [status, bit] of EXTRA_IDS) {
    if ((w.extra & bit) === 0) continue;
    c.statuses[status] = instance(status, (w.autoExtra & bit) !== 0 ? { permanent: true, turnsRemaining: 255 } : {});
  }
  STACK_IDS.forEach((status, i) => {
    if ((w.stacks[i] as number) > 0) c.statuses[status] = instance(status, { stacks: w.stacks[i] as number });
  });
  for (const [status, bit] of BUFF_IDS) if ((w.buff & bit) !== 0) c.statuses[status] = instance(status);

  c.immunities = {};
  PERM_IDS.forEach((status, bit) => {
    if (bit !== 11 && (sit.resist[bit] as number) > 0) c.immunities[status] = sit.resist[bit] as number;
  });
  TEMPORAL_IDS.forEach((status, t) => {
    if (status === 'regen' && sit.regenFlag) return;
    if ((sit.resist[12 + t] as number) > 0) c.immunities[status] = sit.resist[12 + t] as number;
  });
  if (sit.regenFlag) c.immunityFlags.push('immune-to-regen');
  if (sit.threatenImmune) c.immunities['threaten'] = 255;
  for (const [status, bit] of EXTRA_IDS) {
    if ((sit.extraImmune & bit) !== 0) c.immunities[status] = 255;
    else if ((sit.extraNear & bit) !== 0) c.immunities[status] = 254;
  }
  if (sit.lifeImmune) c.immunityFlags.push('immune-to-life');
  if (c.equipment && (sit.breakHp || sit.breakMp)) {
    c.equipment.armor.autoAbilities = [
      ...c.equipment.armor.autoAbilities,
      ...(sit.breakHp ? ['break-hp-limit' as const] : []),
      ...(sit.breakMp ? ['break-mp-limit' as const] : []),
    ];
  }
  if (sit.targetMonster) {
    c.enemy = {
      rewards: { ap: 0, apOverkill: 0, gil: 0, overkillThreshold: 0x7fffffff, drops: [] },
      forms: [],
      doomTurns: sit.doomTurns,
      poisonTickPercent: 10,
    } as unknown as FFXCombatant['enemy'];
  }
  return c;
}

/** The engine's combatant for the user: stats and equipment from the spec, its clock statuses and weapon strikes. */
export function userCombatant(sit: StatusSituation, id: string): FFXCombatant {
  const c = combatantOf(sit.user, id, sit.userSide);
  if (sit.userHaste > 0) c.statuses['haste'] = instance('haste', sit.userHaste === 255 ? { permanent: true, turnsRemaining: 255 } : { turnsRemaining: sit.userHaste });
  if (sit.userSlow > 0) c.statuses['slow'] = instance('slow', sit.userSlow === 255 ? { permanent: true, turnsRemaining: 255 } : { turnsRemaining: sit.userSlow });
  if (c.equipment && sit.strikes.length > 0) c.equipment.weapon.autoAbilities = [...c.equipment.weapon.autoAbilities, ...sit.strikes] as never;
  return c;
}

/** What the engine left on the target, read back into words by an independent reading of the status instances. */
export function wordsOf(c: FFXCombatant): Words {
  const w: Words = { perm: 0, autoPerm: 0, counters: new Array<number>(13).fill(0), extra: 0, autoExtra: 0, stacks: new Array<number>(6).fill(0), buff: 0 };
  PERM_IDS.forEach((status, bit) => {
    const inst = c.statuses[status];
    if (!inst || bit === 0) return;
    w.perm |= 1 << bit;
    if (inst.permanent) w.autoPerm |= 1 << bit;
  });
  TEMPORAL_IDS.forEach((status, t) => {
    const inst = c.statuses[status];
    if (!inst) return;
    const nul = t >= 6 && t <= 9;
    if (inst.permanent) w.counters[t] = 255;
    else w.counters[t] = nul ? (inst.charges ?? 1) : (inst.turnsRemaining ?? 254);
  });
  for (const [status, bit] of EXTRA_IDS) {
    const inst = c.statuses[status];
    if (!inst) continue;
    w.extra |= bit;
    if (inst.permanent) w.autoExtra |= bit;
  }
  STACK_IDS.forEach((status, i) => {
    w.stacks[i] = c.statuses[status]?.stacks ?? 0;
  });
  for (const [status, bit] of BUFF_IDS) if (c.statuses[status]) w.buff |= bit;
  return w;
}

// ----------------------------------------------------------------------------------------------------------- the oracle

/** What a hit sequence came to: the draws, the words, and the target's pools. */
export interface Outcome {
  kinds: string;
  /** The target's words afterwards; null when it died or left the field (the engine clears or ignores them then). */
  words: Words | null;
  dead: boolean;
  ejected: boolean;
  hp: number;
  mp: number;
  ctb: number;
  maxHp: number;
  maxMp: number;
  /** The Doom countdown on the target, when it has one. */
  doom: number | null;
  /** The target died or left before the last hit: the engine keeps hitting it, the oracle stops, so the situation is not compared. */
  early: boolean;
}

const dense = (pairs: ReadonlyArray<readonly [number, number]> | undefined, n: number): number[] => {
  const out = new Array<number>(n).fill(0);
  for (const [i, v] of pairs ?? []) out[i] = v;
  return out;
};

/** The same hit sequence by the kernels alone, with the engine's bookkeeping between hits written out. */
export function oracleRun(sit: StatusSituation, hits: number): Outcome {
  const def = sit.def;
  const rec = def.record as FFXCommandRecord;
  const raws = sit.raws;
  let cursor = 0;
  let kinds = '';
  const next = (kind: string) => (): number => {
    kinds += kind;
    return raws[cursor++ % raws.length] as number;
  };
  const drawStatus = (modulus: number): number => next(modulus === 100 ? 'T' : 'P')();

  const w = sit.words;
  const dead0 = (w.perm & 1) !== 0;
  // The engine keeps Zombie on a member who died; the exe's death handler would have cleared it, so the infliction step is shown a
  // dead member with Death alone, while the damage pipeline sees the engine's word.
  const zombieKept = dead0 && (w.perm & 2) !== 0;
  const stepPerm = (p: number): number => ((p & 1) !== 0 ? p & ~2 : p);
  const live = { perm: stepPerm(w.perm), counters: [...w.counters], extra: w.extra };
  let record: StatusRecord = { perm: stepPerm(w.perm), counters: [...w.counters], extra: w.extra };
  let stacks = [...w.stacks];
  let buff = w.buff;
  let hp = sit.target.hp, mp = sit.target.mp, ctb = sit.target.ctb;
  let maxHp = sit.target.maxHp, maxMp = sit.target.maxMp;
  const baseHp = sit.target.maxHp, baseMp = sit.target.maxMp; // the maxima before any Double HP or Double MP
  const limitBits = (sit.breakHp ? 0x200 : 0) | (sit.breakMp ? 0x400 : 0); // `Chr+0x6be`: Break HP Limit, Break MP Limit
  let dead = dead0;
  let ejected = false;
  let early = false;
  // The engine's own instance of a Doom that was already there counts 254; a Doom that lands is made with the step's countdown.
  let doomCounter = (w.autoExtra & 0x4000) !== 0 ? 255 : 254;

  const rank = !def.rank || def.rank <= 0 ? 3 : def.rank;
  const usesWeapon = (rec.flagsMisc & 0x40000) !== 0;
  const weaponChances = new Array<number>(25).fill(0);
  const weaponDurations = new Array<number>(13).fill(0);
  if (usesWeapon && sit.userSide === 'party') {
    for (const id of sit.strikes) {
      const row = STRIKES.find((s) => s[0] === id) as readonly [string, number, number, number];
      weaponChances[row[1]] = Math.min(255, (weaponChances[row[1]] as number) + row[2]);
      if (row[1] >= 12) weaponDurations[row[1] - 12] = Math.max(weaponDurations[row[1] - 12] as number, row[3]);
    }
  }
  const resist = [...sit.resist];
  resist[11] = sit.targetMonster && !sit.threatenImmune ? Math.min(255, sit.threatenChance) : 0;
  if (sit.regenFlag) resist[22] = 255;
  const baseChances = dense(rec.chances, 25);
  const baseDurations = dense(rec.durations, 13);

  for (let h = 0; h < hits; h++) {
    const counters = record.counters;
    const inp = oracleInputs(sit, { hp, mp, ctb, sleep: (counters[0] as number) > 0 });
    // The pipeline reads the target as it stands now: the record after the earlier hits (the engine applies each hit's statuses at once).
    const pipePerm = record.perm | (zombieKept ? 2 : 0);
    const pipeExtra = record.extra & KNOWN_EXTRA;
    inp.hit.target.status = pipePerm;
    inp.hit.target.reflex = stacks[3] as number;
    inp.hit.target.jinx = stacks[5] as number;
    inp.hit.rec = { sleep: (counters[0] as number) > 0 ? 1 : 0, status: pipePerm };
    inp.crit.target.jinx = stacks[5] as number;
    inp.input.target.cheer = stacks[0] as number;
    inp.input.target.focus = stacks[2] as number;
    inp.input.target.extra = pipeExtra;
    inp.input.record = {
      perm: pipePerm,
      extra: pipeExtra,
      shell: (counters[3] as number) > 0 ? 1 : 0,
      protect: (counters[4] as number) > 0 ? 1 : 0,
      nul: { blaze: counters[7] as number, frost: counters[9] as number, shock: counters[8] as number, tide: counters[6] as number },
    };

    let step: InflictAllResult | undefined;
    const out = calcHitDamage(inp.input, {
      draw: next('V'),
      hit: () => hitCheck(inp.hit, next('P')),
      crit: () => critCheck(inp.crit, 0, next('P')).crit,
      status: () => {
        const input: InflictAllInput = {
          cmd: {
            type: rec.type,
            flagsMisc: rec.flagsMisc,
            flagsDamage: rec.flagsDamage,
            shatter: rec.shatter ?? 0,
            chances: baseChances,
            durations: baseDurations,
          },
          user: {
            id: 0,
            agi: sit.user.agi,
            ctb: sit.userCtb,
            rank,
            haste: sit.userHaste,
            slow: sit.userSlow,
            currentCommand: def.id === 'attack' ? 0x3000 : rec.id,
            autoA: sit.user.magicBooster ? 0x40 : 0,
            weaponChances,
            weaponDurations,
          },
          target: {
            id: 1,
            chrId: sit.targetMonster ? 0x14 : 0,
            resist,
            perm: live.perm,
            counters: live.counters,
            extra: live.extra,
            autoPerm: w.autoPerm,
            autoExtra: w.autoExtra,
            extraImmune: sit.extraImmune,
            special: sit.lifeImmune ? 4 : 0,
            ctb,
            doomInitial: sit.targetMonster ? sit.doomTurns : 5,
          },
          record,
          mask: 0,
          ctbDamage: 0,
          extraMask: mergeExtraStatusWord(rec.extra ?? 0, 0, usesWeapon),
        };
        step = inflictStatuses(input, drawStatus);
        return step.outcome;
      },
    });
    if (out.outcome === 'nullified') {
      // The Nul counters the check ticked are written back onto the target.
      record = { ...record, counters: [...record.counters] };
      record.counters[7] = out.nul.blaze;
      record.counters[9] = out.nul.frost;
      record.counters[8] = out.nul.shock;
      record.counters[6] = out.nul.tide;
      continue;
    }
    if (out.outcome !== 'hit' || !step) continue;

    const before = record;
    record = step.record;
    if (step.doomCounter !== null) doomCounter = step.doomCounter;
    const wasDead = (before.perm & 1) !== 0;
    const nowDead = (record.perm & 1) !== 0;
    const revived = wasDead && !nowDead;
    const newlyDead = !wasDead && nowDead;
    const [a0, a1, a2] = out.amounts;
    const skipPools = revived || (newlyDead && def.flags.includes('heals') && def.flags.includes('can-target-dead'));
    if (revived) {
      hp = Math.max(1, Math.min(maxHp, Math.abs(a0) || Math.floor(maxHp / 2)));
      dead = false;
      ctb = chrBaseCtb(sit.target.agi); // a revived member's counter is the base stored at battle start (VA 0x0078d530)
    } else if (!skipPools) {
      const classes = rec.damageClass;
      if ((out.resultMask & 4) !== 0 && a2 !== 0) ctb = subCtb(ctb, a2);
      if ((classes & 2) !== 0 && a1 !== 0) mp = Math.max(0, Math.min(maxMp, mp - a1));
      if ((classes & 1) !== 0 && a0 !== 0) hp = Math.max(0, Math.min(maxHp, hp - a0));
    }
    // The target dies (its HP ran out, or a Death landed) or leaves (an Eject): the engine's KO path wipes its statuses and puts its
    // maxima back before the buff flags of this hit are looked at.
    const nowEjected = (record.extra & 0x100) !== 0 && (before.extra & 0x100) === 0;
    if (nowEjected) {
      ejected = true;
      hp = 0;
    } else if (newlyDead) {
      dead = true;
      hp = 0;
    } else if (hp <= 0 && !dead) {
      dead = true;
    }
    if (dead || ejected) {
      // The KO path puts the maxima back (the status reset drops the two flags).
      if ((buff & 3) !== 0) {
        const pool = applyDoubleHpMp({ buffFlags: buff, baseMaxHp: baseHp, baseMaxMp: baseMp, maxHp, maxMp, hp, mp, autoB: limitBits }, 0);
        maxHp = pool.maxHp; maxMp = pool.maxMp; hp = pool.hp; mp = pool.mp;
      }
    } else {
      // Stage buffs and the buff flags go straight onto the target.
      if ((rec.stage?.[0] ?? 0) !== 0) stacks = applyStageBuffs(stacks, rec.stage![0], rec.stage![1]);
      if ((rec.buff ?? 0) !== 0 && (record.perm & 4) === 0) {
        const flags = buff | (rec.buff as number);
        if (((flags & ~buff) & 3) !== 0) {
          const pool = applyDoubleHpMp({ buffFlags: buff, baseMaxHp: baseHp, baseMaxMp: baseMp, maxHp, maxMp, hp, mp, autoB: limitBits }, flags);
          maxHp = pool.maxHp; maxMp = pool.maxMp; hp = pool.hp; mp = pool.mp;
        }
        buff = flags;
      }
    }
    if ((dead || ejected) && h < hits - 1) {
      early = true;
      break;
    }
  }
  const alive = !dead && !ejected;
  const finalExtra = record.extra & KNOWN_EXTRA;
  const words: Words | null = alive
    ? {
        perm: (record.perm & ~1) | (zombieKept ? 2 : 0),
        autoPerm: w.autoPerm & ((record.perm & ~1) | (zombieKept ? 2 : 0)),
        counters: [...record.counters],
        extra: finalExtra,
        autoExtra: w.autoExtra & finalExtra,
        stacks,
        buff,
      }
    : null;
  // The maxima of a character that left the field are never read again, and what the exe's Eject does to them is not established
  // (a KO runs the status reset and puts them back; this note does not claim Eject does): they are not compared.
  return { kinds, words, dead: dead && !ejected, ejected, hp, mp, ctb, maxHp: ejected ? 0 : maxHp, maxMp: ejected ? 0 : maxMp, doom: words !== null && (finalExtra & 0x4000) !== 0 ? doomCounter : null, early };
}
