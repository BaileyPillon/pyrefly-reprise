/**
 * Loader for the golden vectors the emulator harness writes for FFX-2.exe functions
 * (`tests/fixtures/parity/ffx2/<name>.json`, schema `ffx-parity-vectors/1`).
 *
 * The harness runs one game function on generated inputs and records what it returned, so a vector is
 * the game's own answer. A parity test loads the file when it exists and skips otherwise, so the suite
 * stays green until the vectors for a kernel have been produced and copied in.
 *
 * Layout (see `D:\Tools\ffx-parity\harness\README.md`, "Vector file layout"): a header, a `defaults`
 * object holding every `in` field a vector leaves out, and `vectors[]`, each with `in` (only the fields
 * that differ from the defaults), `rngDraws` (what the scripted RNG returned, in order, as
 * `{ stream, value }`) and `out`. The harness writes arrays whole, so objects merge and arrays replace.
 *
 * Game case: FFX-2 only (the FFX vectors live under `tests/fixtures/parity/ffx/`).
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export interface Ffx2ParityDraw {
  /** The stream index the game asked for. */
  stream: number;
  /** The raw 31-bit value the scripted RNG returned. */
  value: number;
}

export interface Ffx2ParityVector {
  id: number;
  /** The generator rule that produced this vector, for tracing a failure. */
  class: string;
  in: Record<string, unknown>;
  rngDraws?: Ffx2ParityDraw[];
  out: Record<string, unknown>;
}

export interface Ffx2ParityFixture {
  schema: string;
  game: string;
  name: string;
  defaults: Record<string, unknown>;
  vectors: Ffx2ParityVector[];
}

/** The fixture `tests/fixtures/parity/ffx2/<name>.json`, or `null` when it has not been produced yet. */
export function loadFfx2ParityFixture(name: string): Ffx2ParityFixture | null {
  const path = fileURLToPath(new URL(`../../fixtures/parity/ffx2/${name}.json`, import.meta.url));
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as Ffx2ParityFixture;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A vector's full input: its sparse `in` laid over the file's `defaults` (objects merge, arrays and scalars replace). */
export function expandVector(defaults: Record<string, unknown>, sparse: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...defaults };
  for (const [key, value] of Object.entries(sparse)) {
    const base = out[key];
    out[key] = isPlainObject(base) && isPlainObject(value) ? expandVector(base, value) : value;
  }
  return out;
}

/**
 * A `draw(stream)` that hands back the vector's scripted values in order, insists that the kernel asks
 * for the stream the game asked for, and counts the calls so a test can assert how many draws were made.
 */
export function scriptedDraw(draws: readonly Ffx2ParityDraw[] | undefined): {
  draw: (stream: number) => number;
  calls: () => number;
} {
  let used = 0;
  return {
    draw: (stream: number): number => {
      const next = draws?.[used];
      if (next === undefined) throw new Error(`the kernel drew ${used + 1} times; the vector scripted ${draws?.length ?? 0}`);
      if (next.stream !== stream) throw new Error(`draw ${used + 1}: the kernel asked for stream ${stream}, the game used ${next.stream}`);
      used += 1;
      return next.value;
    },
    calls: () => used,
  };
}
