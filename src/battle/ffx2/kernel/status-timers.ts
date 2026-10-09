/**
 * FFX-2 status timers, part 2: the per-step status process (`MsStatusProcess`). Group 1 timers, group 2 counters with
 * their accumulators, Poison and Regen ticks, and the Doom expiry that queues a death.
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), image base
 * 0x400000. Spec: `research/re-ffx2-atb-status.md` section 6. Pure, deterministic, no DOM, no engine types
 * (AGENTS.md rule 1). Not wired into the engine: the engine gives each status a duration in seconds
 * (`ffx2/statuses.ts`). Everything is counted in the game's units per logic step (see `./atb-clock.ts` for the
 * speeds and for the 30-or-60-steps-a-second caveat).
 *
 * Exe addresses (live build):
 * - 0x00636e80  MsStatusProcess: all 31 characters, once per logic step, after the ATB process and the actions
 * - 0x00636660  pp_status_expire: a status with flag 8 (Doom) ran out
 * - 0x006218c0  MsCheckStatCount: the group 2 flag word of a status (`STATUS2_INFO` in `./statusTypes.ts`)
 * - 0x00633f60  MsATBActiveCheck: the two clock gates, masks 1 and 7 (`activeCheck` in `./atb-clock.ts`)
 * - the rom constants and `MsSetStatus` (what starts a timer) are in `./status-timers-set.ts`
 *
 * What counts down, and at which speed (the four speeds of `./atb-clock.ts`, `raw >= awake >= active`):
 *
 * | What | Counter | Step | Speed |
 * |---|---|---|---|
 * | group 1 timers (Sleep, Confusion, Berserk) | `Chr+0x454 + 4i`, a signed 32-bit count of units | `raw` each step | `raw`: even a Stopped, asleep or petrified character's runs out |
 * | group 2, flag 4 (Shell, Protect, Reflect, Regen, Haste, Slow, immunities) | counter `Chr+0x4b4 + i` loses 1 per 1,500 units | accumulator `+0x4cc + 2i` | `active` (nothing while stopped or asleep) |
 * | Stop (flag 0x80) | the same, 1,500 units per count | | `raw` (it must run down while the character is stopped) |
 * | Doom (flag 8 and 0x40) | loses 1 per 10,000 units, expires at 1 | | `awake` (keeps counting while asleep, not while stopped or petrified) |
 * | Poison, Regen | accumulators `+0x684`, `+0x688` against the period 16,000 | | `awake` |
 *
 * A petrified, dead or absent character, or one with no HP, is skipped entirely.
 */

import { activeCheck, type Ffx2ClockFlags } from './atb-clock.ts';
import { clampInt, s8 } from './intops.ts';
import { STATUS2_INFO, STATUS_COUNT } from './statusTypes.ts';
import { FFX2_STATUS_ROM } from './status-timers-set.ts';

export * from './status-timers-set.ts';

/** The command a Doom expiry queues on the character itself: death. */
export const FFX2_DOOM_DEATH_COMMAND = 0x3026;

/** The three speeds of this step (`Chr+0x9e8`, `+0x9ec`, `+0x9f0`), see {@link atbSpeeds} in `./atb-clock.ts`. */
export interface Ffx2TimerSpeeds {
  /** `Chr+0x9f0`: after Haste and Slow only. */
  raw: number;
  /** `Chr+0x9ec`: zero while petrified or Stopped. */
  awake: number;
  /** `Chr+0x9e8`: zero in any stop state. */
  active: number;
}

/** The fields of a character that {@link statusTimersStep} reads and writes (arrays hold 24 entries). */
export interface Ffx2TimerChr {
  /** `Chr+0x1784` non-zero. */
  inBattle: boolean;
  /** `Chr+0x1792` non-zero: the process skips the character. */
  hidden: boolean;
  /** `Chr+0x3b4`: current HP (the process needs it above 0). */
  hp: number;
  /** `Chr+0x1787` non-zero. */
  dead: boolean;
  /** `Chr+0x434`: the effective status word (bit 1 petrified, bit 5 Poison). */
  status1: number;
  /** `Chr+0x450`: the applied mask, whose set bits have a running timer. */
  applied: number;
  /** `Chr+0x454 + 4i`: group 1 timers (signed 32-bit). */
  timers: readonly number[];
  /** `Chr+0x4b4 + i`: group 2 counters (signed bytes). */
  counters: readonly number[];
  /** `Chr+0x4cc + 2i`: group 2 accumulators (signed 16-bit). */
  accumulators: readonly number[];
  /** `Chr+0x43b`: the Regen stage byte (non-zero means Regen is in effect). */
  regenByte: number;
  /** `Chr+0x684`, `+0x688`: the Poison and Regen accumulators. */
  poisonAcc: number;
  regenAcc: number;
  /** `Chr+0x68c`, `+0x690`: the periods (16,000). */
  poisonPeriod: number;
  regenPeriod: number;
  /** `Chr+0x694`, `+0x698`: the damage factors (8 = 1/32 of max HP). */
  poisonDamage: number;
  regenDamage: number;
  /** `Chr+0x384`: max HP (after HP x2 and the like). */
  maxHp: number;
  /** The speeds `MsChrSetDecTime` wrote earlier in the same step. */
  speeds: Ffx2TimerSpeeds;
  /** `MsStatCheckStop` of the character's root NOW (it is asked again, so a status inflicted during the step counts). */
  stopState: number;
  /** `Chr+0xe67`: already condemned. */
  condemned: boolean;
}

/** What one character's pass did, in the order the game reports it. */
export interface Ffx2TimerEvents {
  /** Group 1 statuses whose timer ran out (the applied-mask bit was cleared), in index order. */
  expiredGroup1: number[];
  /** Group 2 statuses whose counter reached its floor, with their flag words, in index order. */
  expiredGroup2: Array<{ index: number; flags: number }>;
  /** A Doom expiry condemned the character: the HUD menu is closed (`FUN_00634010(id, 3)`) and command 0x3026 is queued on itself with its own bit as the target mask. */
  doom: boolean;
  /** A Poison or Regen tick: HP amount through `MsDamageBufferExe` (flags word 0x100ff): positive damage, negative healing. */
  tick: { kind: 'poison' | 'regen'; amount: number } | null;
  /** Any timer or counter moved on: `MsSetStatus(id, 0xff, 1, 1)` and a display refresh follow. */
  recompute: boolean;
  /** Something expired: `MsStatusEffectCheck(id)` follows. */
  effectCheck: boolean;
  /** The notice routine `FUN_006330c0(id, n)`: 0xc when anything expired while Sleep was still set, 2 when something expired, else none. */
  notice: number | null;
}

/** Result of {@link statusTimersStep}. */
export interface Ffx2TimerResult {
  chr: Ffx2TimerChr;
  events: Ffx2TimerEvents;
}

const s16 = (x: number): number => (x << 16) >> 16;

/** The speed a group 2 status accumulates at, from its flag word: flag 0x40 `awake`, else flag 0x80 `raw`, else `active`. */
export function status2Speed(flags: number, speeds: Ffx2TimerSpeeds): number {
  if ((flags & 0x40) !== 0) return speeds.awake;
  if ((flags & 0x80) !== 0) return speeds.raw;
  return speeds.active;
}

/**
 * `MsStatusProcess` for one character (exe 0x00636e80, the loop body). `gate1` and `gate7` are
 * `activeCheck(flags, 1)` (group 1 timers) and `activeCheck(flags, 7)` (group 2 counters, Poison and Regen).
 *
 * Group 1: for each set bit of the applied mask with a timer above 0, `timer -= raw` (32-bit); if the result is
 * below 0 the timer becomes 0 and the bit is cleared. A timer that lands exactly on 0 stays at 0 with its bit
 * still set and is never looked at again (the test is "above 0"), which in practice only Sleep at the Fast speed
 * can reach (150,000 is a multiple of 120 and 60).
 *
 * Group 2: a counter from 1 to 125 whose status has flag 4 or 8 and is above its floor (0, or 1 for Doom) adds the
 * speed of its flag word to a 16-bit accumulator; once the accumulator reaches the step (1,500, or 10,000 for Doom)
 * and the speed is not 0, the step is subtracted and the counter loses 1, clamped to the floor..125; reaching the
 * floor expires the status, and for Doom condemns the character.
 *
 * Poison then Regen (Poison first; if Poison ticks, Regen is not looked at this step): the accumulator gains the
 * `awake` speed and, when it is above the period, the period is subtracted and one tick of
 * `(factor * maxHP) >> 8` (unsigned shift, 1/32 of max HP at the factor 8) is delivered, as damage for Poison and
 * as the negative of it for Regen.
 */
export function statusTimersStep(c: Ffx2TimerChr, gate1: boolean, gate7: boolean): Ffx2TimerResult {
  const events: Ffx2TimerEvents = { expiredGroup1: [], expiredGroup2: [], doom: false, tick: null, recompute: false, effectCheck: false, notice: null };
  if (!c.inBattle || c.hidden || c.hp <= 0 || c.dead || (c.status1 & 2) !== 0) return { chr: c, events };

  let { active, awake } = c.speeds;
  const raw = c.speeds.raw;
  if (c.stopState !== 0) {
    if ((c.stopState & ~4) !== 0) awake = 0;
    active = 0;
  }
  const speeds: Ffx2TimerSpeeds = { raw, awake, active };

  const timers = Array.from(c.timers);
  const counters = Array.from(c.counters);
  const accumulators = Array.from(c.accumulators);
  let applied = c.applied >>> 0;
  let { poisonAcc, regenAcc } = c;
  let condemned = c.condemned;
  let changed = 0;
  let expired = 0;
  let sleepEnded = 0;

  if (gate1) {
    let mask = applied;
    for (let i = 0; i < STATUS_COUNT; i++) {
      const t = timers[i] ?? 0;
      if (((mask >>> i) & 1) !== 0 && t > 0) {
        let next = (t - raw) | 0;
        if (next < 0) {
          changed += 1;
          expired += 1;
          next = 0;
          if ((mask & 4) !== 0) sleepEnded += 1;
          mask = (mask & ~(1 << i)) >>> 0;
          events.expiredGroup1.push(i);
        }
        timers[i] = next;
      }
    }
    applied = mask;
  }

  if (gate7) {
    for (let i = 0; i < STATUS_COUNT; i++) {
      const count = s8(counters[i] ?? 0);
      if (((count - 1) >>> 0) >= 0x7d) continue;
      const flags = STATUS2_INFO[i] ?? 0;
      let step = 0;
      if ((flags & 4) !== 0) step = FFX2_STATUS_ROM.countValue[0] ?? 0;
      const doomLike = (flags & 8) !== 0;
      if (doomLike) step = FFX2_STATUS_ROM.countValue[1] ?? 0;
      const floor = doomLike ? 1 : 0;
      if (!(floor < count && step !== 0)) continue;
      const sp = status2Speed(flags, speeds);
      const acc = s16((accumulators[i] ?? 0) + s16(sp));
      accumulators[i] = acc;
      if (step <= acc && sp !== 0) {
        changed += 1;
        accumulators[i] = s16(acc - step);
        const next = clampInt(count - 1, floor, 0x7d);
        counters[i] = s8(next);
        if (next <= floor) {
          expired += 1;
          events.expiredGroup2.push({ index: i, flags });
          if ((flags & 8) !== 0 && !condemned) {
            condemned = true;
            events.doom = true;
          }
        }
      }
    }
    for (let k = 0; k < 2; k++) {
      const on = k === 0 ? (c.status1 >>> 5) & 1 : s8(c.regenByte);
      if (on === 0) continue;
      if (k === 0) poisonAcc = (poisonAcc + awake) | 0;
      else regenAcc = (regenAcc + awake) | 0;
      const acc = k === 0 ? poisonAcc : regenAcc;
      const period = k === 0 ? c.poisonPeriod : c.regenPeriod;
      if (period < acc) {
        if (k === 0) poisonAcc = (acc - period) | 0;
        else regenAcc = (acc - period) | 0;
        const part = Math.imul(k === 0 ? c.poisonDamage : c.regenDamage, c.maxHp) >>> 8;
        events.tick = { kind: k === 0 ? 'poison' : 'regen', amount: k === 0 ? part | 0 : -part | 0 };
        break;
      }
    }
  }

  events.recompute = changed !== 0;
  events.effectCheck = expired !== 0;
  if (sleepEnded !== 0) events.notice = 0xc;
  else if (expired !== 0) events.notice = 2;
  return { chr: { ...c, applied, timers, counters, accumulators, poisonAcc, regenAcc, condemned }, events };
}

/**
 * `MsStatusProcess` for the characters you list, in ascending id order. The two clock gates are evaluated once
 * from `flags` (the game asks them per character, but nothing they read changes during the loop).
 */
export function statusProcess(
  units: ReadonlyArray<{ id: number; chr: Ffx2TimerChr }>,
  flags: Ffx2ClockFlags,
): Array<{ id: number; chr: Ffx2TimerChr; events: Ffx2TimerEvents }> {
  const gate1 = activeCheck(flags, 1);
  const gate7 = activeCheck(flags, 7);
  return [...units]
    .sort((a, b) => a.id - b.id)
    .map((u) => ({ id: u.id, ...statusTimersStep(u.chr, gate1, gate7) }));
}
