/**
 * FFX death check and the KO status reset (VA 0x0078c740 and 0x0079a190), in the parts a battle engine reads.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D, proven in `FFX-G02` sections 3.1, 3.2, 3.7 and 3.12 (the real
 * functions run in an x86-32 emulator: the reset 4,000 vectors and the check 9,000, 0 mismatches; `tests/fixtures/parity/ffx/ko_reset.json` replays a
 * sample of each, inputs and outputs). Pure and deterministic; nothing here draws a random number (the loot roll, the one draw in the check, is the
 * drops lane's).
 *
 * **The KO reset** clears the whole permanent status word but the one bit the caller passes (the check passes 0 and sets Death again afterwards), the
 * thirteen counters, the whole extra word (Scan, Eject, Auto-Life, Defend, Guard, Sentinel, Shield, Boost, Curse, Doom, the Distills), the six stage
 * stacks and the buff byte, and then runs the Double HP / Double MP rebuild with the flags at 0 (maximum HP and MP back to the stored base, current HP
 * and MP clamped under them). So a KO takes away Zombie and Scan with everything else: the engine's old `SURVIVES_KO` list kept both and was wrong on
 * both (Bailey's open decision PR-0217 / D-214).
 *
 * **The death check** runs once per life, and only after a target's last hit of an action (the engine's `abilities.ts#finishTouched`). Its kind is 2 when the
 * Eject extra bit is set, else 1 when HP is below 1, else it does nothing; it does nothing either when the victim does not exist or is already dead.
 * For a monster victim (slots 0x14 to 0x1b) with the no-rewards flag clear the Overkill flag is set when the action's overkill counter is below 1: the
 * counter starts at the monster's overkill threshold when the action is calculated and every HP hit of the action subtracts its HP value (a heal counts
 * negative), so it is the damage of the whole action, not of one hit. Then the extra word is saved, the reset runs and Death is set again. Kind 1 asks the
 * saved word for Auto-Life (bit 9): found, the revive (command 0x311f) is queued and Auto-Phoenix is skipped; not found, Auto-Phoenix is tried.
 */

import { applyDoubleHpMp } from './status-pool.ts';

/** The fields of one character the reset and the check read or write (the game's `Chr` offsets in the comments). */
export interface KoChr {
  /** `+0x606`: the permanent status word (bit 0 Death, bit 1 Zombie, ...). */
  perm: number;
  /** `+0x608` to `+0x614`: the thirteen temporal counters. */
  counters: readonly number[];
  /** `+0x616`: the extra status word (bit 0 Scan, bit 8 Eject, bit 9 Auto-Life, ...). */
  extra: number;
  /** `+0x65e` to `+0x663`: the six stage stacks. */
  stacks: readonly number[];
  /** `+0x640`: the buff byte (Double HP 1, Double MP 2, ...). */
  buff: number;
  /** `+0x5d0`, `+0x5d4`, `+0x594`, `+0x598`, `+0x59c`, `+0x5a0`: HP, MP, their maxima in force and their stored bases. */
  hp: number;
  mp: number;
  maxHp: number;
  maxMp: number;
  baseHp: number;
  baseMp: number;
  /** `+0x6be`: bit 9 Break HP Limit, bit 10 Break MP Limit (they raise the Double HP / MP caps). */
  autoB: number;
}

/** The extra-status bit the Auto-Life check reads, and the bit that marks Eject. */
export const EXTRA_AUTO_LIFE = 0x200;
export const EXTRA_EJECT = 0x100;
/** The Death bit of the permanent word. */
export const PERM_DEATH = 1;

/** The KO status reset (`0x0079a190`): everything cleared, the pools rebuilt at flags 0, and the permanent word's bit 0 taken from `keepBits`. */
export function koReset(c: KoChr, keepBits: number): KoChr {
  const pool = applyDoubleHpMp(
    { buffFlags: c.buff, baseMaxHp: c.baseHp, baseMaxMp: c.baseMp, maxHp: c.maxHp, maxMp: c.maxMp, hp: c.hp, mp: c.mp, autoB: c.autoB },
    0,
  );
  return {
    perm: keepBits & PERM_DEATH,
    counters: c.counters.map(() => 0),
    extra: 0,
    stacks: c.stacks.map(() => 0),
    buff: pool.buffFlags,
    hp: pool.hp,
    mp: pool.mp,
    maxHp: pool.maxHp,
    maxMp: pool.maxMp,
    baseHp: c.baseHp,
    baseMp: c.baseMp,
    autoB: c.autoB,
  };
}

/** Slots 0x14 to 0x1b hold monsters (`((id & 0xff) - 0x14) < 8`, unsigned). */
export function isMonsterSlot(slot: number): boolean {
  return ((slot & 0xff) - 0x14) >>> 0 < 8;
}

/** The counter the action starts a target with (`Chr+0xf60`): the monster's overkill threshold. */
export function overkillStart(threshold: number): number {
  return threshold | 0;
}

/** One HP hit of the action takes its HP value off the counter (32-bit; a heal's value is negative, so it counts back). */
export function overkillStep(counter: number, hpValue: number): number {
  return (counter - hpValue) | 0;
}

/** The check flags Overkill when the counter has gone below 1. */
export function overkillReached(counter: number): boolean {
  return (counter | 0) < 1;
}

/** What the check was asked about: one victim, as the game holds it. */
export interface DeathCheckIn {
  chr: KoChr;
  /** The victim's slot. */
  victim: number;
  /** `Chr+0x10`: the slot exists. */
  exists: number;
  /** `Chr+0xdcc`: already dead this life. */
  dead: number;
  /** `Chr+0x617` bit 0: the Eject extra bit. */
  eject: number;
  /** The check's third argument: nonzero for a self-destruct (no kill count, no Overkill, no loot). */
  noRewards: number;
  /** `Chr+0xf60`. */
  overkillCounter: number;
  /** The debug switch at 0x0112a914. */
  debugNoOverkill: number;
}

export interface DeathCheckOut {
  /** The check did something (the game returns early otherwise). */
  ran: boolean;
  /** 1 a death by HP, 2 an Eject, 0 nothing. */
  kind: 0 | 1 | 2;
  /** The Overkill flag `Chr+0xf5f` was set. */
  overkill: boolean;
  /** The Auto-Life revive (command 0x311f) was queued as an action of the dead character. */
  autoLifeQueued: boolean;
  /** Auto-Phoenix is tried (kind 1 with no Auto-Life on the saved word). */
  phoenixTried: boolean;
  /** The victim after the check: the reset applied and Death set. Unchanged when the check did nothing. */
  chr: KoChr;
}

/** `0x0078c740`, in the parts above. */
export function deathCheck(i: DeathCheckIn): DeathCheckOut {
  const kind: 0 | 1 | 2 = (i.eject & 1) !== 0 ? 2 : (i.chr.hp | 0) < 1 ? 1 : 0;
  if (i.exists === 0 || kind === 0 || i.dead !== 0) {
    return { ran: false, kind: 0, overkill: false, autoLifeQueued: false, phoenixTried: false, chr: i.chr };
  }
  const overkill = isMonsterSlot(i.victim) && i.noRewards === 0 && overkillReached(i.overkillCounter) && i.debugNoOverkill === 0;
  const saved = i.chr.extra;
  const reset = koReset(i.chr, 0);
  const autoLifeQueued = kind === 1 && (saved & EXTRA_AUTO_LIFE) !== 0;
  return {
    ran: true,
    kind,
    overkill,
    autoLifeQueued,
    phoenixTried: kind === 1 && !autoLifeQueued,
    chr: { ...reset, perm: reset.perm | PERM_DEATH },
  };
}
