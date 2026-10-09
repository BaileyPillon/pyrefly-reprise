/**
 * Status infliction, computed by the game's own kernels (re-parity W2; **FFX only**).
 *
 * The FFX engine used to keep a status as a named record with a timer and to roll each status of an ability itself. The game keeps
 * three words and thirteen counter bytes per character and runs one function over a hit record: for each of 25 statuses with a
 * chance byte one draw, `% 101`, the 255 / 254 rules, the exclusions, Petrify's wipe, the self-cast turn, no refresh; then the
 * extra statuses and the shatter roll; then the stage buffs and the buff flags. The kernels are those functions
 * (`kernel/status-inflict.ts`, `status-extra.ts`, `status-pool.ts`, proven against FFX.exe in `tests/unit/parity-ffx-status-*.test.ts`).
 * This module is the translation in one direction, engine state to the kernels' inputs, with no default for anything the engine
 * cannot say (an enemy that can be Doomed must carry the game's Doom countdown, a weapon strike its game durations, ...);
 * `adapt/status-apply.ts` is the translation back.
 *
 * Inputs and where each comes from: `docs/handoff/re-parity-w2.md`, section 1.
 */

import type { AbilityDef, FFXCombatant, StatusId } from '../../common/types.ts';
import type { StatusOutcome } from '../kernel/aftermath.ts';
import { ExtraBit, PermBit, REGULAR_STATUS_COUNT, TEMPORAL_STATUS_COUNT, type InflictCommand, type StatusRecord } from '../kernel/status-types.ts';
import { inflictStatuses, type InflictAllInput, type InflictAllResult } from '../kernel/status-inflict.ts';
import { mergeExtraStatusWord } from '../kernel/status-extra.ts';
import { weaponStatusStrikes } from '../equipment.ts';
import { stacks, statusOf } from '../predicates.ts';
import { type Ctx, rtOf } from '../state.ts';
import { counterOf } from './ctb.ts';
import type { ResolvedCommand } from './command.ts';
import { autoWordA, extraWord, permWord, specialWord } from './words.ts';

/** The 12 permanent statuses in the order of the exe's status numbers 0 to 11. */
export const PERM_STATUS_IDS: readonly StatusId[] = [
  'ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'threaten',
];

/** The 13 temporal statuses in the order of the counters `Chr+0x608` to `0x614` (status numbers 12 to 24). */
export const TEMPORAL_STATUS_IDS: readonly StatusId[] = [
  'sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nultide', 'nulblaze', 'nulshock', 'nulfrost', 'regen', 'haste', 'slow',
];

/** The extra-status bits that have an engine status (the Distill bits have none). */
export const EXTRA_STATUS_BIT: Readonly<Partial<Record<StatusId, number>>> = {
  scan: ExtraBit.Scan,
  shield: ExtraBit.Shield,
  boost: ExtraBit.Boost,
  eject: ExtraBit.Eject,
  'auto-life': ExtraBit.AutoLife,
  curse: ExtraBit.Curse,
  defend: ExtraBit.Defend,
  guard: ExtraBit.Guard,
  sentinel: ExtraBit.Sentinel,
  doom: ExtraBit.Doom,
};

/** The six stage-buff stacks, in the order of `Chr+0x65e` to `0x663` and of the six low bits of `Cmd+0x56`. */
export const STACK_STATUS_IDS: readonly StatusId[] = ['cheer', 'aim', 'focus', 'reflex', 'luck', 'jinx'];

/** The buff flags of `Chr+0x640` that have an engine status. */
export const BUFF_STATUS_BIT: Readonly<Partial<Record<StatusId, number>>> = {
  'max-hp-x2': 0x01,
  'max-mp-x2': 0x02,
  'mp-cost-zero': 0x04,
  'damage-9999': 0x08,
  'guaranteed-critical': 0x10,
  'overdrive-x1_5': 0x20,
  'overdrive-x2': 0x40,
};

/** The Death bit of the permanent word, and the status number of Threaten (whose resistance byte is a success percentage). */
const THREATEN_NUMBER = 11;

/** The thirteen temporal counters of a combatant (Nul statuses count charges; a permanent status is 255). */
export function temporalCounters(c: FFXCombatant): number[] {
  return TEMPORAL_STATUS_IDS.map((id) => {
    const inst = statusOf(c, id);
    if (!inst) return 0;
    if (inst.permanent) return 255;
    if (id === 'nultide' || id === 'nulblaze' || id === 'nulshock' || id === 'nulfrost') return Math.min(254, Math.max(1, inst.charges ?? 1));
    return counterOf(c, id);
  });
}

/** The six stage-buff stacks. */
export function stackBytes(c: FFXCombatant): number[] {
  return STACK_STATUS_IDS.map((id) => stacks(c, id));
}

/** The buff flags byte `Chr+0x640`: Double HP 1, Double MP 2, no MP cost 4, always 9,999 8, always critical 0x10, Overdrive x1.5 0x20, x2 0x40. */
export function buffByte(c: FFXCombatant): number {
  let word = 0;
  for (const [id, bit] of Object.entries(BUFF_STATUS_BIT) as Array<[StatusId, number]>) if (statusOf(c, id)) word |= bit;
  return word;
}

/**
 * A combatant's status words as the hit record starts from them.
 *
 * One bridge, for a dead member: the exe's death handler runs the status reset (VA 0x0079a190), which clears the whole
 * permanent word but Death, so a KO'd character never carries Zombie in the game. The engine keeps Zombie on a KO'd member
 * (`SURVIVES_KO`, its reading of the Yunalesca script, which the AI lane owns), and a record that said "dead and Zombie"
 * would make the cleansing kernel treat Life as the Zombie-killing Life and leave a KO'd member down for good. The infliction
 * step is therefore shown the word the exe would have: Death alone.
 */
export function recordOf(c: FFXCombatant): StatusRecord {
  let perm = permWord(c);
  if ((perm & PermBit.Death) !== 0) perm &= ~PermBit.Zombie;
  return { perm, counters: temporalCounters(c), extra: extraWord(c) };
}

/** The statuses given by equipment or the fayth (stack 255): they cannot be cleansed, and a stance that is given is not dropped at the next turn. */
export function givenPermWord(c: FFXCombatant): number {
  let word = 0;
  for (let i = 0; i < PERM_STATUS_IDS.length; i++) if (statusOf(c, PERM_STATUS_IDS[i] as StatusId)?.permanent === true) word |= 1 << i;
  return word & ~PermBit.Death;
}
export function givenExtraWord(c: FFXCombatant): number {
  let word = 0;
  for (const [id, bit] of Object.entries(EXTRA_STATUS_BIT) as Array<[StatusId, number]>) if (statusOf(c, id)?.permanent === true) word |= bit;
  return word;
}

/**
 * The extra statuses a combatant cannot receive (`Chr+0x65a`): the ones its resistance byte makes immune.
 *
 * `def` is the command, for one rule of the data: an ability marked `extra.bypassesAeonRibbon` (Seymour's Banish) ignores the Eject
 * immunity of an aeon, which the engine's data gives every aeon as its hidden Aeon Ribbon [ffx-combat-core §6.1, ffx-seymour-flux §4.5];
 * the exe's own Banish is an ordinary Eject command that lands on an aeon, so the bit is simply not in that word for this command.
 */
export function extraImmuneWord(c: FFXCombatant, def?: AbilityDef): number {
  let word = 0;
  for (const [id, bit] of Object.entries(EXTRA_STATUS_BIT) as Array<[StatusId, number]>) if ((c.immunities[id] ?? 0) >= 255) word |= bit;
  if (def?.extra?.['bypassesAeonRibbon'] === true && c.side === 'aeon') word &= ~ExtraBit.Eject;
  return word;
}

/**
 * The 25 resistance bytes `Chr+0x641..0x659`: the engine's immunity map, byte for byte, except Threaten, whose byte is a success
 * percentage (`draw % 100 < byte`): an enemy's is its live Threaten chance (0 when it is immune), a party member's or an aeon's is 0,
 * because it cannot be threatened (the exe zero-fills a party member's resistance bytes; the aeons' innate immunity is the same).
 * An enemy flagged immune to Regen has a Regen byte of 255.
 */
export function resistBytes(ctx: Ctx, c: FFXCombatant): number[] {
  return resistBytesWith(c, rtOf(ctx, c.id).threatenChance);
}

/** {@link resistBytes} for a caller with no battle runtime (a preview): `threatenChance` is the live percent of an enemy. */
export function resistBytesWith(c: FFXCombatant, threatenChance: number): number[] {
  const bytes = new Array<number>(REGULAR_STATUS_COUNT).fill(0);
  PERM_STATUS_IDS.forEach((id, i) => {
    bytes[i] = Math.min(255, c.immunities[id] ?? 0);
  });
  TEMPORAL_STATUS_IDS.forEach((id, t) => {
    bytes[12 + t] = Math.min(255, c.immunities[id] ?? 0);
  });
  if (c.immunityFlags.includes('immune-to-regen')) bytes[22] = 255;
  if (c.side === 'enemy' && !c.immunityFlags.includes('immune-to-threaten') && (c.immunities['threaten'] ?? 0) < 255) {
    bytes[THREATEN_NUMBER] = Math.min(255, Math.max(0, threatenChance));
  } else {
    bytes[THREATEN_NUMBER] = 0;
  }
  return bytes;
}

/** `Chr+0x5c9`: the Doom countdown a new Doom starts from: 5 for every party slot, the monster record's byte for a monster (undefined when the data carries none). */
function doomStartOf(c: FFXCombatant): number | undefined {
  return c.side === 'enemy' ? c.enemy?.doomTurns : 5;
}

/** {@link doomStartOf}, as an error for an enemy that carries no countdown: a Doom that lands on it has nothing to start from. */
export function doomStart(c: FFXCombatant): number {
  const turns = doomStartOf(c);
  if (turns === undefined) throw new Error(`FFX engine: enemy '${c.id}' can be Doomed but carries no doomTurns (the monster record's Doom countdown)`);
  return turns;
}

/** The pairs `[index, byte]` of a sparse record list, as a dense array of `length` bytes. */
export function dense(pairs: ReadonlyArray<readonly [number, number]> | undefined, length: number): number[] {
  const out = new Array<number>(length).fill(0);
  for (const [i, v] of pairs ?? []) out[i] = v;
  return out;
}

/** The weapon's chance and duration bytes (`Chr+0x5de..` and `0x5f7..`) for a party member; all zero for anyone without a weapon. */
export function weaponBytes(c: FFXCombatant): { chances: number[]; durations: number[] } {
  const chances = new Array<number>(REGULAR_STATUS_COUNT).fill(0);
  const durations = new Array<number>(TEMPORAL_STATUS_COUNT).fill(0);
  for (const strike of weaponStatusStrikes(c)) {
    const perm = PERM_STATUS_IDS.indexOf(strike.status);
    const temporal = TEMPORAL_STATUS_IDS.indexOf(strike.status);
    if (perm >= 0) chances[perm] = Math.max(chances[perm] as number, strike.chance);
    else if (temporal >= 0) {
      chances[12 + temporal] = Math.max(chances[12 + temporal] as number, strike.chance);
      durations[temporal] = Math.max(durations[temporal] as number, strike.duration);
    }
  }
  return { chances, durations };
}

/**
 * The status bytes of a command. A recorded ability carries the game's; one of ours with none (`close-in`, `mac-seymour-idle`,
 * `omnis-volley`, and the abilities of unit tests) gets them from its own statuses, the way the engine always read them.
 */
export interface CommandStatus {
  cmd: InflictCommand;
  /** `Cmd+0x54`, the wanted extra bits (before the weapon's are merged in). */
  extra: number;
  /** `Cmd+0x56` and `Cmd+0x59`. */
  stageMask: number;
  stageAmount: number;
  /** `Cmd+0x5a`. */
  buff: number;
}

/** An ability of ours that stands a fallen member up: the flags the engine always read for a revival. */
function revives(def: AbilityDef): boolean {
  return def.flags.includes('heals') && def.flags.includes('can-target-dead') && def.statusEffects.length === 0 && def.removesStatuses.length === 0;
}

export function commandStatus(def: AbilityDef, command: ResolvedCommand): CommandStatus {
  const r = command.record;
  const recorded = def.record !== undefined || r.chances !== undefined || r.extra !== undefined || r.durations !== undefined;
  const chances = dense(r.chances, REGULAR_STATUS_COUNT);
  const durations = dense(r.durations, TEMPORAL_STATUS_COUNT);
  let extra = r.extra ?? 0;
  let stageMask = r.stage?.[0] ?? 0;
  let stageAmount = r.stage?.[1] ?? 0;
  let buff = r.buff ?? 0;
  if (!recorded) {
    // An ability of ours with no game record: its own statuses, one chance byte each.
    for (const s of def.statusEffects) {
      const perm = PERM_STATUS_IDS.indexOf(s.status);
      const temporal = TEMPORAL_STATUS_IDS.indexOf(s.status);
      if (perm >= 0) chances[perm] = s.chance;
      else if (temporal >= 0) {
        chances[12 + temporal] = s.chance;
        durations[temporal] = s.duration;
      } else if (EXTRA_STATUS_BIT[s.status] !== undefined) extra |= EXTRA_STATUS_BIT[s.status] as number;
      else if (STACK_STATUS_IDS.includes(s.status)) {
        stageMask |= 1 << STACK_STATUS_IDS.indexOf(s.status);
        stageAmount = Math.max(stageAmount, s.stacks ?? 1);
      } else if (BUFF_STATUS_BIT[s.status] !== undefined) buff |= BUFF_STATUS_BIT[s.status] as number;
    }
    for (const id of def.removesStatuses) {
      const perm = PERM_STATUS_IDS.indexOf(id);
      const temporal = TEMPORAL_STATUS_IDS.indexOf(id);
      if (perm >= 0) chances[perm] = 254;
      else if (temporal >= 0) {
        chances[12 + temporal] = 254;
        durations[temporal] = 254;
      } else if (EXTRA_STATUS_BIT[id] !== undefined) extra |= EXTRA_STATUS_BIT[id] as number;
    }
    // A revival of ours (heals, may aim at the dead) is the game's Life: the cleanse of Death, which on a Zombie kills it.
    if (revives(def) && chances[0] === 0) chances[0] = 254;
  }
  const cleanse = recorded
    ? (r.flagsDamage & 0x20) !== 0
    : def.removesStatuses.length > 0 || def.flags.includes('removes-statuses') || revives(def);
  return {
    cmd: {
      type: r.type,
      flagsMisc: command.flagsMisc,
      flagsDamage: cleanse ? r.flagsDamage | 0x20 : r.flagsDamage & ~0x20,
      shatter: def.shatterChance ?? 0,
      chances,
      durations,
    },
    extra,
    stageMask,
    stageAmount,
    buff,
  };
}

/** What the infliction step reads of the target as it stood when the action's hits began (the game's hit records chain on a snapshot). */
export interface LiveStatus {
  perm: number;
  counters: number[];
  extra: number;
}

export function liveOf(c: FFXCombatant): LiveStatus {
  const record = recordOf(c);
  return { perm: record.perm, counters: record.counters, extra: record.extra };
}

export interface StatusStepInput {
  ctx: Ctx;
  /** Who acts. Absent for a status the engine puts on somebody with no action behind it (a script, a test): a user who is nobody. */
  user?: FFXCombatant;
  target: FFXCombatant;
  def: AbilityDef;
  command: ResolvedCommand;
  /** The rank of the action in progress (Threaten's delay). */
  rank: number;
  /** The target's status as the action began. */
  live: LiveStatus;
  /** The record this hit starts from: the target's words after the earlier hits of the same action. */
  record: StatusRecord;
}

export interface StatusStepOutput {
  result: InflictAllResult;
  outcome: StatusOutcome;
  /** `Cmd+0x56`, `Cmd+0x59`, `Cmd+0x5a`. */
  status: CommandStatus;
}

/**
 * One hit's status step: `pp_BtlInflictStatus` then `pp_BtlInflictExtraStatus` over the hit record, drawing from `draw`
 * (one engine draw per kernel draw, already reduced to the modulus the kernel applies).
 */
export function runStatusStep(input: StatusStepInput, draw: (modulus: number) => number): StatusStepOutput {
  const { ctx, user, target, def, command, live, record, rank } = input;
  const status = commandStatus(def, command);
  const usesWeapon = (command.flagsMisc & 0x40000) !== 0;
  const none = { chances: new Array<number>(REGULAR_STATUS_COUNT).fill(0), durations: new Array<number>(TEMPORAL_STATUS_COUNT).fill(0) };
  const weapon = usesWeapon && user?.side === 'party' ? weaponBytes(user) : none;
  const sameActor = user !== undefined && user.id === target.id;
  // The exe reads the Doom countdown only when a Doom lands, so only a landed Doom needs one: a Doom-proof boss with no
  // `doomTurns` in its data (Braska's Final Aeon, the Yu Pagodas) is a valid target of a Doom command that cannot land.
  const doomInitial = (status.extra & ExtraBit.Doom) !== 0 ? doomStartOf(target) : undefined;
  // The exe compares the two ids only (a self-cast); the engine's ids are names, so the kernel gets 0 for the user and 0 or 1 for the target.
  const kernelUser: InflictAllInput['user'] = user
    ? {
        id: 0,
        agi: user.stats.agi,
        ctb: rtOf(ctx, user.id).ctb & 0xff,
        rank,
        haste: counterOf(user, 'haste'),
        slow: counterOf(user, 'slow'),
        currentCommand: command.currentCommand,
        autoA: autoWordA(user),
        weaponChances: weapon.chances,
        weaponDurations: weapon.durations,
      }
    : { id: 0, agi: 0, ctb: 0, rank, haste: 0, slow: 0, currentCommand: command.currentCommand, autoA: 0, weaponChances: none.chances, weaponDurations: none.durations };
  const kernelInput: InflictAllInput = {
    cmd: status.cmd,
    user: kernelUser,
    target: {
      id: sameActor ? 0 : 1,
      // The exe asks only whether the target's id byte is a monster slot (0x14 to 0x1b); the engine knows it by side.
      chrId: target.side === 'enemy' ? 0x14 : 0,
      resist: resistBytes(ctx, target),
      perm: live.perm,
      counters: live.counters,
      extra: live.extra,
      autoPerm: givenPermWord(target),
      autoExtra: givenExtraWord(target),
      extraImmune: extraImmuneWord(target, def),
      special: specialWord(target),
      ctb: rtOf(ctx, target.id).ctb & 0xff,
      // Read only when a Doom lands (checked after the step): an enemy that can be Doomed must carry its monster record's countdown.
      doomInitial: doomInitial ?? 0,
    },
    record,
    mask: 0,
    ctbDamage: 0,
    extraMask: mergeExtraStatusWord(status.extra, 0, usesWeapon),
  };
  const result = inflictStatuses(kernelInput, draw);
  if (result.doomCounter !== null && doomInitial === undefined) doomStart(target); // a Doom landed with no countdown to start from: throws
  return { result, outcome: result.outcome, status };
}

