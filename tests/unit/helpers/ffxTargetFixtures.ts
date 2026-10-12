/**
 * Shared bits of the FFX target-chain parity tests (re-parity RC4 lane FFX-G; **FFX only**): turning a vector's sparse character
 * slots into a {@link TargetWorld}, the scripted picker that replays a vector's draws and checks their streams, and the fixture loader.
 *
 * The vectors are `tests/fixtures/parity/ffx/target_*.json`, each a run of the game's own machine code in an x86-32 emulator with the
 * battle generator scripted (every draw's stream and value recorded). A vector's `in.chrs` maps a slot number to the fields of that slot
 * the chain reads; every other field of every other slot is 0.
 */

import { expect } from 'vitest';
import type { PickFn, TargetCommand, TargetSlot, TargetWorld } from '../../../src/battle/ffx/kernel/target-world.ts';
import { SLOT_COUNT } from '../../../src/battle/ffx/kernel/target-world.ts';
import { type ParityDraw, type ParityFixture, expandVectorInput, loadFfxParityFixture } from './ffxParityFixture.ts';

/** A fixture, or a loud error: these vectors are part of the repo, so a missing file is a failure and not a skip. */
export function targetFixture(name: string): ParityFixture {
  const f = loadFfxParityFixture(name);
  if (!f) throw new Error(`tests/fixtures/parity/ffx/${name}.json is missing`);
  return f;
}

/** The 31-slot world of a vector's sparse `chrs`. */
export function worldOfVector(chrs: Record<string, Record<string, number>>): TargetWorld {
  const world: Array<TargetSlot | undefined> = new Array<TargetSlot | undefined>(SLOT_COUNT).fill(undefined);
  for (const [slot, fields] of Object.entries(chrs)) world[Number(slot)] = { ...fields };
  return world;
}

/** The command words of a vector (`b1a`, `b1b`, and whatever else it carries). */
export function commandOfVector(cmd: Record<string, number>): TargetCommand {
  return { b1a: cmd['b1a'] ?? 0, b1b: cmd['b1b'] ?? 0, misc: cmd['misc'] ?? 0, b20: cmd['b20'] ?? 0, hits: cmd['hits'] ?? 0 };
}

/**
 * A picker that replays the vector's draws in order: each call must be on the stream the game used at that point, and takes
 * `slots[value % slots.length]` (the picker's own rule). `used()` is how many draws were taken.
 */
export function scriptedPick(draws: readonly ParityDraw[] | undefined): { pick: PickFn; used: () => number } {
  let n = 0;
  return {
    pick: (stream, slots) => {
      const d = draws?.[n];
      if (d === undefined) throw new Error(`the kernel drew ${n + 1} times; the vector scripted ${draws?.length ?? 0}`);
      expect(d.stream, `draw ${n} stream`).toBe(stream);
      n += 1;
      return slots[d.value % slots.length] as number;
    },
    used: () => n,
  };
}

/** A vector's full input (the file's defaults under its sparse `in`). */
export function inputOf(fx: ParityFixture, sparse: Record<string, unknown>): Record<string, unknown> {
  return expandVectorInput(fx.defaults, sparse);
}

/** A map `{ "slot": value }` from a vector as the dense array the kernels return. */
export function denseOf(sparse: Record<string, number> | undefined, length: number): number[] {
  const out = new Array<number>(length).fill(0);
  for (const [k, v] of Object.entries(sparse ?? {})) out[Number(k)] = v;
  return out;
}
