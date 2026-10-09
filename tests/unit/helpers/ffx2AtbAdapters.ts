/**
 * Adapters between the emulator vectors of the FFX-2 ATB / status-timer functions
 * (`tests/fixtures/parity/ffx2/atb_*.json`, `status_timers.json`; format `ffx2-kernel-check/1`) and the kernel
 * inputs in `src/battle/ffx2/kernel/atb*.ts` and `status-timers*.ts`.
 *
 * A vector's `in` holds the struct-level data the real function was given (byte and word fields of the
 * character, flags, scripted draws); these helpers turn it into the kernel's own input types, so the vectors check
 * the adapters as well as the kernels. Game case: FFX-2 only.
 */

import {
  activePartyCounts,
  stopState,
  type Ffx2AtbStepChr,
  type Ffx2AtbUnit,
  type Ffx2ClockFlags,
  type Ffx2PartyEntry,
} from '../../../src/battle/ffx2/kernel/atb.ts';
import { loadFfx2ParityFixture, type Ffx2ParityFixture, type Ffx2ParityVector } from './ffx2ParityFixture.ts';

/** A fixture in the kernel-check format, or `null` (absent, or from some other generator). */
export function kernelCheck(name: string): Ffx2ParityFixture | null {
  const fx = loadFfx2ParityFixture(name);
  return fx && (fx as unknown as { format?: string }).format === 'ffx2-kernel-check/1' ? fx : null;
}

/** The vectors of one function inside a (possibly shared) fixture file. */
export function vectorsOf(fx: Ffx2ParityFixture, cls: string): Ffx2ParityVector[] {
  return fx.vectors.filter((v) => v.class === cls);
}

/** `v.in` / `v.out` as a loosely typed record (the vector files are numbers and arrays of numbers). */
export interface Rec {
  [key: string]: unknown;
}
export const inOf = (v: Ffx2ParityVector): Rec => v.in as Rec;
export const outOf = (v: Ffx2ParityVector): Rec => v.out as Rec;
export const num = (r: Rec, k: string): number => r[k] as number;
export const arr = (r: Rec, k: string): number[] => r[k] as number[];
export const sub = (r: Rec, k: string): Rec => r[k] as Rec;
export const recs = (r: Rec, k: string): Rec[] => r[k] as Rec[];

/** The clock flags of a vector's `globals` object. */
export function clockFlags(g: Rec): Ffx2ClockFlags {
  return {
    pauseLevel: num(g, 'pauseLevel'),
    pauseB: num(g, 'pauseB'),
    pauseC: num(g, 'pauseC'),
    wait: num(g, 'wait'),
    running: num(g, 'running') === 1,
    ending: num(g, 'ending') !== 0,
    actionExecuting: num(g, 'actionExec') !== 0,
    magicExec: num(g, 'magicExec'),
    magicHold: num(g, 'magicHold'),
  };
}

/** Monster slots are 15 to 30. */
export const isMon = (id: number): boolean => id >= 15 && id <= 30;

/** A character record of the step / process vectors as the kernel's step input. */
export function stepChr(c: Rec, tick: number, thinkingTick: number): Ffx2AtbStepChr {
  return {
    atbEnabled: num(c, 'atbEnabled') !== 0,
    condemned: num(c, 'condemned') !== 0,
    inBattle: num(c, 'inBattle') !== 0,
    dead: num(c, 'dead') !== 0,
    held: num(c, 'held') !== 0,
    state: num(c, 'state'),
    recovery: num(c, 'recovery'),
    tick,
    thinking: num(c, 'thinking'),
    thinkingTick,
    pendingAnimation: num(c, 'pending669') !== 0,
    motion: num(c, 'motion') !== 0,
  };
}

/** The units of an `atb_process` vector. */
export function processUnits(chrs: Rec): Ffx2AtbUnit[] {
  return Object.entries(chrs).map(([k, raw]) => {
    const c = raw as Rec;
    return {
      id: Number(k),
      chr: stepChr(c, 0, 0),
      speed: {
        stopState: stopState({ status1: num(c, 'status1'), stopStage: num(c, 'stop'), condemned: num(c, 'condemned') !== 0 }),
        hasted: num(c, 'haste') !== 0,
        slowed: num(c, 'slow') !== 0,
        charging: num(c, 'charging') !== 0,
        hitReaction: num(c, 'hitReaction') !== 0,
        hitReactionExempt: (num(c, 'special') & 2) !== 0,
      },
      mode: num(c, 'mode'),
      confused: (num(c, 'status1') & 0x40) !== 0,
      berserk: (num(c, 'status1') & 0x80) !== 0,
    };
  });
}

/** The three active-party entries of a vector as the kernel's party counts. */
export function partyCounts(party: Rec[]): { count: number; standing: number } {
  const entries: Ffx2PartyEntry[] = party.map((p) => ({
    slot: num(p, 'slot'),
    inBattle: num(p, 'inBattle') !== 0,
    hidden: num(p, 'hidden') !== 0,
    dead: num(p, 'dead') !== 0,
    petrified: (num(p, 'status1') & 2) !== 0,
  }));
  return activePartyCounts(entries);
}

/** The 24 signed bytes of an unsigned-byte array. */
export const signedBytes = (a: readonly number[]): number[] => a.map((x) => (x << 24) >> 24);
/** The unsigned bytes of a signed-byte array. */
export const unsignedBytes = (a: readonly number[]): number[] => a.map((x) => x & 0xff);
