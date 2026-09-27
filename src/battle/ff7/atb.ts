/**
 * FF7's ATB rates: Battle Speed, the V-Timer and the Turn Timer [core §2.1 to
 * §2.4, single source: Fergusson BM §2 unless noted].
 *
 * Pure functions only (part 1 of the engine). The clock step, the modes and the
 * ready queue come with `engine.ts` (plan step 4). Time is counted in **ticks**,
 * the research's unit; how many ticks make a real second is `[unsourced]`
 * (core §2.2, §15.1 Q1), so the mapping lives in one presentation constant
 * outside this file. Game case: **FF7 only.**
 */

import type { Rng } from '../common/types.ts';
import { trunc } from './stats.ts';

/** The Config slider's default: 128 on a 0 (fastest) to 255 (slowest) byte [core §2.1]. */
export const DEFAULT_BATTLE_SPEED = 128;
/** The Turn Timer is full at 65,535; taking a turn resets it to 0 [core §2.3]. */
export const TURN_TIMER_FULL = 65535;
/** Battle start: every Turn Timer starts at `Rnd(0..32767)` [core §2.4]. */
export const START_ROLL_MAX = 32767;
/** Normal formation: the highest timer is raised to 57,344 (87.5%) [core §2.4]. */
export const NORMAL_START_TOP = 57344;
/** Back Attack: the highest goes to 61,440 [core §2.4]. */
export const BACK_ATTACK_START_TOP = 61440;
/** Pre-emptive / Side Attack: every party member at 65,534 [core §2.4]. */
export const PREEMPTIVE_PARTY_TIMER = 65534;

/** `SpeedValue = [32768 / (120 + [BattleSpeed * 15 / 8])]` [core §2.1, verified: 2 sources]. */
export function speedValue(battleSpeed: number): number {
  const bs = Math.max(0, Math.min(255, Math.trunc(battleSpeed)));
  return trunc(32768 / (120 + trunc((bs * 15) / 8)));
}

/** Time statuses on the V-Timer: Haste x2, Slow x0.5, Stop / Death x0 [core §2.2]. */
export type Ff7TimeStatus = 'normal' | 'haste' | 'slow' | 'stop';

/** V-Timer per tick: `2 * SpeedValue`, scaled by Haste / Slow / Stop [core §2.2]. */
export function vTimerIncrease(battleSpeed: number, time: Ff7TimeStatus = 'normal'): number {
  const v = 2 * speedValue(battleSpeed);
  switch (time) {
    case 'haste':
      return v * 2;
    case 'slow':
      return trunc(v / 2);
    case 'stop':
      return 0;
    case 'normal':
      return v;
  }
}

/**
 * `NormalSpeed = RU(sum of the party's base Dex / party size) + 50`, fixed at battle
 * start from **base** Dexterity only (no Sources, Materia or equipment) [core §2.3].
 */
export function normalSpeed(partyBaseDex: readonly number[]): number {
  if (partyBaseDex.length === 0) throw new Error('FF7 normalSpeed: empty party');
  const sum = partyBaseDex.reduce((s, d) => s + d, 0);
  return Math.ceil(sum / partyBaseDex.length) + 50;
}

/**
 * Turn Timer per tick [core §2.3]:
 * party `[(TotalDex + 50) * VTimerIncrease / NormalSpeed]`, enemy `[Dex * VTimerIncrease / NormalSpeed]`
 * (enemies get no +50). Paralysed, Petrify and Sleep halt it (pass `halted`).
 */
export function turnTimerIncrease(dex: number, isEnemy: boolean, vIncrease: number, normal: number, halted = false): number {
  if (halted) return 0;
  const d = isEnemy ? dex : dex + 50;
  return trunc((d * vIncrease) / normal);
}

/** Ticks from an empty gauge to a full one at a fixed increase [core §2.3, derived]. */
export function ticksToFill(increasePerTick: number, from = 0): number {
  if (increasePerTick <= 0) return Number.POSITIVE_INFINITY;
  return Math.ceil((TURN_TIMER_FULL - from) / increasePerTick);
}

/** One Turn Timer step, clamped at full. */
export function stepTurnTimer(timer: number, increasePerTick: number, ticks = 1): number {
  return Math.min(TURN_TIMER_FULL, timer + increasePerTick * ticks);
}

/** The formation types that change the battle-start timers [core §2.4]. */
export type Ff7Formation = 'normal' | 'preemptive' | 'side' | 'back' | 'ambush';

/**
 * Battle-start Turn Timers [core §2.4]. `units` in slot order, party first
 * (the draw order is our estimate: the research gives the rule, not the order).
 * One `Rnd(0..32767)` per unit, then the formation's adjustment. The Guard
 * Scorpion fight is a Normal start [core §2.4, estimate; staging §3.3 single source: formation 324 Normal].
 */
export function battleStartTimers(units: ReadonlyArray<{ isEnemy: boolean }>, formation: Ff7Formation, rng: Rng): number[] {
  const timers = units.map(() => rng.int(0, START_ROLL_MAX));
  const top = timers.reduce((m, t) => Math.max(m, t), 0);
  switch (formation) {
    case 'normal':
    case 'back':
    case 'ambush': {
      const lift = (formation === 'normal' ? NORMAL_START_TOP : BACK_ATTACK_START_TOP) - top;
      return timers.map((t, i) => (formation !== 'normal' && !units[i]?.isEnemy ? 0 : Math.min(TURN_TIMER_FULL, t + lift)));
    }
    case 'preemptive':
    case 'side':
      return timers.map((t, i) => (units[i]?.isEnemy ? trunc(t / 8) : PREEMPTIVE_PARTY_TIMER));
  }
}
