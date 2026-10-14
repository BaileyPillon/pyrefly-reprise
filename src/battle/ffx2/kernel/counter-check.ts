/**
 * FFX-2 counters: the engine-side check that decides whether a character counters the result that just landed on her, and the
 * can-act test it uses (re-parity X2-D; **FFX-2 only**).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69): the counter check 0x00641360 and the
 * can-act test 0x006491d0. Note FFX2-G04 section 3.6: 30,000 vectors, 8,676 of them queue a counter, 0 mismatches, every character
 * its own root (the root redirection inside the stop-state test is read only); the vector sample is
 * `tests/fixtures/parity/ffx2/counter_check.json`. Pure, deterministic, no DOM, no engine types.
 *
 * The check draws no random number and has no probability. The game's result applier calls it after every applied result on a
 * target, with the target, the source (the attacker), the command row and a "damage landed" flag. A counter is queued when ALL hold:
 * the row aims at one target, the row is physical-only and the target holds Counterattack or Evade & Counter, or magical-only
 * with something landed and the target holds Magic Counter; the target can act against the source; the action that hit her was an
 * ordinary one; and she has no system action waiting. What is queued is one system action: the target's own Attack command
 * (`Chr+0x656`) aimed at the source alone.
 */

/** The three ability words that matter here: bits of `Chr+0x650`. */
export const COUNTER_WORD0 = { COUNTERATTACK: 0x4, EVADE_AND_COUNTER: 0x8, MAGIC_COUNTER: 0x10 } as const;

/** Status word 1 bits the can-act test reads (`Chr+0x434`). */
const ASLEEP = 0x4;
const PETRIFIED = 0x2;
const CONFUSION = 0x40;
const EJECT = 0x400;
const BIT_17 = 0x20000;

/** The action-kind byte of an ordinary action (`Chr+0x15c1`); a counter or a script's system action is another kind. */
export const ACTION_KIND_NORMAL = 1;

/** What the check reads of the command row: the low byte of the target flags (`Cmd+0x10`) and the damage flags (`Cmd+0x1c`). */
export interface Ffx2CounterRow {
  readonly flagsTarget: number;
  readonly flagsDamage: number;
}

/** What the check reads of the character that may counter. */
export interface Ffx2CounterTarget {
  /** Her slot (0 to 30). */
  readonly id: number;
  /** `Chr+0x650`. */
  readonly word0: number;
  /** `Chr+0x656`: her Attack command, the command that is queued. */
  readonly attackCommand: number;
  /** `Chr+0x434`: her own status word (Confusion, Eject and bit 17 are read here). */
  readonly status1: number;
  /** The status word and Stop counter (`Chr+0x43e`) of her ROOT character, which the stop-state test reads: asleep, petrified or Stopped. */
  readonly rootStatus1: number;
  readonly rootStop: number;
  /** `Chr+0x15c1`: the kind of the action that hit her. */
  readonly hitKind: number;
  /** How many system-kind actions wait in her queue. */
  readonly pendingSystem: number;
}

/**
 * The can-act test (exe 0x006491d0) with both flags clear, as the counter check calls it: she is not the source, her own status word
 * has none of Confusion, Eject and bit 17, and her root character is not asleep, petrified or Stopped.
 */
export function canActAgainst(target: Ffx2CounterTarget, sourceId: number): boolean {
  if (sourceId === target.id) return false;
  if ((target.status1 & (CONFUSION | EJECT | BIT_17)) !== 0) return false;
  if ((target.rootStatus1 & (ASLEEP | PETRIFIED)) !== 0) return false;
  return target.rootStop === 0;
}

/** The system action a counter queues: the target's Attack command aimed at the source alone (`1 << source`). */
export interface Ffx2Counter {
  readonly actor: number;
  readonly command: number;
  readonly targetMask: number;
}

/**
 * The counter check (exe 0x00641360). `landed` is the applier's flag: an HP, MP or ATB amount above 0 in a class the result names.
 * Returns the queued action, or `null` when no counter is queued.
 */
export function counterCheck(target: Ffx2CounterTarget, sourceId: number, row: Ffx2CounterRow, landed: boolean): Ffx2Counter | null {
  if ((row.flagsTarget & 0xc) !== 0) return null; // several targets, or self only
  const damageKind = row.flagsDamage & 3;
  let armed = false;
  if (damageKind === 1) armed = (target.word0 & (COUNTER_WORD0.COUNTERATTACK | COUNTER_WORD0.EVADE_AND_COUNTER)) !== 0;
  else if (damageKind === 2) armed = landed && (target.word0 & COUNTER_WORD0.MAGIC_COUNTER) !== 0;
  if (!armed) return null;
  if (!canActAgainst(target, sourceId)) return null;
  if (target.hitKind !== ACTION_KIND_NORMAL) return null;
  if (target.pendingSystem !== 0) return null;
  return { actor: target.id, command: target.attackCommand, targetMask: (1 << sourceId) >>> 0 };
}
