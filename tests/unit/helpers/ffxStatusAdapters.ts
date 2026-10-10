/**
 * Adapters between the golden-vector fixtures of the CTB and status kernels (`tests/fixtures/parity/ffx/ctb_*.json`,
 * `status_*.json`) and the kernels' input shapes.
 *
 * The fixtures are sparse: a missing key takes the file's `defaults` value, and a list of bytes is stored as an object
 * `{"index": value}` with every missing index 0 (see each file's `notes`). `expandVectorInput` (./ffxParityFixture.ts)
 * does the first; {@link dense} the second.
 *
 * Game case: FFX only.
 */

import type { ParityDraw } from './ffxParityFixture.ts';
import type { InflictAllInput, InflictFlags, StatusRecord } from '../../../src/battle/ffx/kernel/status-inflict.ts';

/** `{"3": 100}` with a length of 5 becomes `[0, 0, 0, 100, 0]`. */
export function dense(map: unknown, length: number): number[] {
  const out = new Array<number>(length).fill(0);
  if (typeof map === 'object' && map !== null) {
    for (const [k, v] of Object.entries(map as Record<string, number>)) out[Number(k)] = v;
  }
  return out;
}

/** A `draw` that returns the vector's scripted values in order, checks it is never asked for more, and logs the streams. */
export function streamedDraw(draws: readonly ParityDraw[] | undefined): {
  draw: (stream?: number) => number;
  calls: () => number;
  streams: number[];
} {
  const streams: number[] = [];
  let used = 0;
  return {
    draw: (stream?: number) => {
      const next = draws?.[used];
      if (next === undefined) throw new Error(`the kernel drew ${used + 1} times; the vector scripted ${draws?.length ?? 0}`);
      used += 1;
      streams.push(stream ?? next.stream);
      return next.value;
    },
    calls: () => used,
    streams,
  };
}

type Obj = Record<string, unknown>;
const num = (v: unknown): number => Number(v);

/** The kernel's `StatusRecord` from a vector's (expanded) record or an `out.record`. */
export function recordOf(r: unknown): StatusRecord {
  const o = r as Obj;
  return { perm: num(o['perm']), counters: dense(o['counters'], 13), extra: num(o['extra']) };
}

/** The kernel input for `inflictStatus` / `inflictStatuses` from an expanded `status_inflict` vector input. */
export function inflictInputOf(full: Obj): InflictAllInput {
  const cmd = full['cmd'] as Obj;
  const user = full['user'] as Obj;
  const target = full['target'] as Obj;
  const flags = (full['flags'] ?? {}) as InflictFlags;
  return {
    cmd: {
      type: num(cmd['type']),
      flagsMisc: num(cmd['flagsMisc']),
      flagsDamage: num(cmd['flagsDamage']),
      shatter: num(cmd['shatter']),
      chances: dense(cmd['chances'], 25),
      durations: dense(cmd['durations'], 13),
    },
    user: {
      id: num(user['id']),
      agi: num(user['agi']),
      ctb: num(user['ctb']),
      rank: num(user['rank']),
      haste: num(user['haste']),
      slow: num(user['slow']),
      currentCommand: num(user['currentCommand']),
      autoA: num(user['autoA']),
      weaponChances: dense(user['weaponChances'], 25),
      weaponDurations: dense(user['weaponDurations'], 13),
    },
    target: {
      id: num(target['id']),
      chrId: num(target['chrId']),
      resist: dense(target['resist'], 25),
      perm: num(target['perm']),
      counters: dense(target['counters'], 13),
      extra: num(target['extra']),
      autoPerm: num(target['autoPerm']),
      autoExtra: num(target['autoExtra']),
      extraImmune: num(target['extraImmune']),
      special: num(target['special']),
      ctb: num(target['ctb']),
      doomInitial: num(target['doomInitial']),
    },
    record: recordOf(full['record']),
    mask: num(full['mask']),
    ctbDamage: num(full['ctbDamage']),
    extraMask: num(full['extraMask'] ?? 0),
    flags,
  };
}
