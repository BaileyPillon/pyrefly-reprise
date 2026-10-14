/**
 * FFX command availability: the MP cost of a command, the usability gate and the cost check at the start of a sub-action
 * (re-parity RC7 lane L-CMD; **FFX only**).
 *
 * Source and spec: `research/re-ffx-command-gate.md`. Each function is a port of one game function, with the vectors it was
 * proven on (the real machine code in an x86-32 emulator against an independent model, 0 mismatches;
 * `tests/unit/parity-ffx-command-gate.test.ts`, fixture `tests/fixtures/parity/ffx/command_gate.json`):
 *
 * | Function | VA | Vectors |
 * |---|---|---|
 * | {@link mpCost} (the MP cost of a record for a character) | 0x0078cf70 | 29,569 |
 * | {@link usableCost} (the usability gate: Overdrive, Curse, Silence, MP) | 0x0078c690 | 40,000 crafted, 7,832 on the real records |
 * | {@link costCheck} (the check when a sub-action starts) | 0x0078ab20 | 40,001 |
 *
 * Pure and deterministic: no random draw is made by any of these (the only draw of the command chain is the single Escape roll,
 * `kernel/rolls.ts`). The record is the game's command record seen through four of its bytes; the character is the six words and
 * bytes the functions read (`Chr+0x5bc` and `0x5bd` the gauge and its maximum, `0x609` the Silence counter, `0x616` the extra
 * status word, `0x5d4` the MP, `0x6bc` auto-ability word A, `0x6ce` the zero-cost flag, `0x640` the buff flags).
 *
 * Not ported, because nothing in the engine reaches it: the record chooser (0x0078ce50, which of a sub-action's two ids is the
 * command) and the Copycat-running branch of the cost check (the engine has no Copycat sequencing).
 */

/** Record word `+0x1c` bit 0x20000: the Silence gate. 67 of the game's 979 records carry it (all 41 White and Black Magic command records among them). */
export const SILENCE_GATED = 0x20000;
/** Auto-ability word A (`Chr+0x6bc`) bits the MP cost reads. */
export const AutoA = { MagicBooster: 0x40, HalfMp: 0x4000, OneMp: 0x8000 } as const;
/** Extra status word (`Chr+0x616`) bit 0x400: Curse, which forbids an Overdrive. */
export const EXTRA_CURSE = 0x400;
/** Buff flag byte (`Chr+0x640`) bit 4: Spellspring, no MP cost. */
export const BUFF_NO_MP_COST = 0x04;
/** Record category byte `+0x17` values the Magic Booster doubles: 1 Black Magic, 2 White Magic. */
const BOOSTED_TYPES: ReadonlySet<number> = new Set([1, 2]);

/** The four bytes of a command record the gate reads. */
export interface GateRecord {
  /** `+0x25`: the MP cost. */
  mp: number;
  /** `+0x17`: the category byte. */
  type: number;
  /** `+0x1c`: the flag word (bit 0x20000 gates on Silence). */
  flagsMisc: number;
  /** `+0x26`: the Overdrive cost, 0 for a command that is not an Overdrive (100 for a party member, 20 for an aeon). */
  odCost: number;
}

/** The character facts the gate reads. */
export interface GateChr {
  /** `Chr+0x5bc`. */
  gauge: number;
  /** `Chr+0x5bd`. */
  gaugeMax: number;
  /** `Chr+0x616`. */
  extra: number;
  /** `Chr+0x609`, the Silence counter (any non-zero value is Silenced). */
  silence: number;
  /** `Chr+0x5d4`, signed 32 bits. */
  mp: number;
  /** `Chr+0x6bc`. */
  autoA: number;
  /** `Chr+0x6ce`: the script-set zero-cost flag. */
  zeroCost: number;
  /** `Chr+0x640`. */
  buffs: number;
}

/** The switches around the gate: a monster (chr 0x14 to 0x1b) pays no MP; the two debug switches are off in play. */
export interface GateSwitches {
  monster: boolean;
  freeMp?: boolean;
  freeOd?: boolean;
}

/**
 * The MP cost of a record for a character (0x0078cf70). The base is the record's MP, or 0 under the zero-cost flag. Half MP halves it
 * **rounding up**; One MP replaces a non-zero base by 1 and beats Half; Magic Booster on a Black or White Magic record doubles the base
 * and takes Half's round-up away; Spellspring makes the result 0 after everything else. Esuna (5) under Half costs 3, Scan (1) 1;
 * One MP with the Booster costs 2.
 */
export function mpCost(rec: Pick<GateRecord, 'mp' | 'type'>, chr: Pick<GateChr, 'autoA' | 'zeroCost' | 'buffs'>): number {
  let base = chr.zeroCost !== 0 ? 0 : rec.mp;
  let divisor = 1;
  let addend = 0;
  if ((chr.autoA & AutoA.HalfMp) !== 0) {
    divisor = 2;
    addend = 1;
  }
  if ((chr.autoA & AutoA.OneMp) !== 0 && base !== 0) {
    base = 1;
    divisor = 1;
    addend = 0;
  }
  let multiplier = 1;
  if ((chr.autoA & AutoA.MagicBooster) !== 0 && BOOSTED_TYPES.has(rec.type)) {
    multiplier = 2;
    addend = 0;
  }
  if ((chr.buffs & BUFF_NO_MP_COST) !== 0) return 0;
  return Math.floor((addend + multiplier * base) / divisor);
}

/**
 * The usability gate (0x0078c690): the cost of the command for the character, or -1 when it is not usable. Three independent tests:
 *
 * 1. a record with an Overdrive cost needs the gauge at least its maximum and no Curse (the free-Overdrive switch waives it; a
 *    character whose maximum is 0 passes with any gauge, and {@link costCheck} is what then refuses it);
 * 2. a record with the Silence flag needs a Silence counter of 0;
 * 3. the MP cost plus the pending MP of earlier picks must not exceed the current MP (a monster, or the free-MP switch, forces both
 *    to 0; a negative MP refuses even a free command).
 *
 * A null record is -1.
 */
export function usableCost(rec: GateRecord | null, chr: GateChr, sw: GateSwitches, pendingMp = 0): number {
  if (rec === null) return -1;
  const overdriveOk = rec.odCost === 0 || sw.freeOd === true || (chr.gaugeMax <= chr.gauge && (chr.extra & EXTRA_CURSE) === 0);
  const silenceOk = (rec.flagsMisc & SILENCE_GATED) === 0 || chr.silence === 0;
  if (!overdriveOk || !silenceOk) return -1;
  let cost = mpCost(rec, chr);
  let pending = pendingMp;
  if (sw.monster || sw.freeMp === true) {
    cost = 0;
    pending = 0;
  }
  return pending + cost <= (chr.mp | 0) ? cost : -1;
}

/** What {@link costCheck} decides when a sub-action is about to start. */
export interface CostCheck {
  /** True when the sub-action may start. */
  accepted: boolean;
  /** `Chr+0x6cc` after the check: the MP the action will pay (only set when accepted). */
  mp: number;
  /** `Chr+0x6cd` after the check: the Overdrive cost the action will pay (only set when accepted). */
  od: number;
  /** `Chr+0x5c0`: 1 when the record has an Overdrive cost (the free switch does not change it), else 0. */
  odMarker: 0 | 1;
}

/**
 * The cost check at the start of a sub-action (0x0078ab20, the ordinary path: no Copycat running). It asks the usability gate with no
 * pending MP and accepts only when the cost is 0 or more and at most the MP **and** the Overdrive cost is at most the gauge value
 * itself (so the gauge must really hold 100, or 20 for an aeon). A refusal pays nothing: the pending bytes are left alone.
 */
export function costCheck(rec: GateRecord | null, chr: GateChr, sw: GateSwitches): CostCheck {
  const cost = usableCost(rec, chr, { ...sw, freeMp: false }, 0);
  const od = sw.freeOd === true || rec === null ? 0 : rec.odCost;
  const odMarker = rec === null || rec.odCost === 0 ? 0 : 1;
  const accepted = cost >= 0 && cost <= (chr.mp | 0) && od <= chr.gauge;
  return { accepted, mp: accepted ? cost & 0xff : 0, od: accepted ? od : 0, odMarker };
}
