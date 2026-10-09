/**
 * Adapter between the steal / Pilfer Gil / Bribe golden-vector fixtures (`tests/fixtures/parity/ffx/steal_*.json`) and the
 * kernels in `src/battle/ffx/kernel/steal-rewards.ts`.
 *
 * A vector's `in`:
 *   - `fn`: stealItem | stealGil | bribe; `args`: the function's plain arguments;
 *   - stealItem: `user [autoB]`, `target [stealCount, lastAttacker]`, `loot [chance, commonId, rareId, commonQty, rareQty]` or null;
 *   - stealGil: `target [chance]` (the signed 16-bit gil-steal chance), `factor` (loot byte +0x113), `hasLoot`;
 *   - bribe: `cmd` (the command's misc word), `target {maxHp, paid, special, monster, marker, value}`, `rec {sleep, extra}`,
 *     `counters [success, immune, fail]`;
 *   - `g`: mode (0x112c9e5), hit (0x112a90a), rare (0x112a911), lang (language id), rikku (counter 0x1130840), offered (gil offered).
 * `out` holds `ret` and what the function changed; `rngDraws` the draws it made, in order, with their streams.
 *
 * Game case: FFX only.
 */

import { bribe, stealGil, stealItem, type StealOptions } from '../../../src/battle/ffx/kernel/steal-rewards.ts';
import { streamedDraw } from './ffxStatusAdapters.ts';
import type { ParityDraw } from './ffxParityFixture.ts';

type Obj = Record<string, unknown>;
const num = (v: unknown): number => Number(v);

function optionsOf(g: Obj): StealOptions {
  return { demoMode: num(g['mode'] ?? 0), debugAlwaysHit: num(g['hit'] ?? 0) !== 0, debugAlwaysRare: num(g['rare'] ?? 0) !== 0, language: num(g['lang'] ?? 1) };
}

export interface StealRun {
  out: Obj;
  draws: number;
  streams: number[];
}

/** Runs the kernel for one steal-family vector, with the vector's scripted draws. */
export function runStealVector(input: Obj, rngDraws: readonly ParityDraw[] | undefined): StealRun {
  const script = streamedDraw(rngDraws);
  const g = (input['g'] ?? {}) as Obj;
  const opts = optionsOf(g);
  const args = (input['args'] ?? []) as number[];
  let out: Obj;
  switch (input['fn']) {
    case 'stealItem': {
      const lootRow = input['loot'] as number[] | null;
      const loot =
        lootRow === null
          ? null
          : { chance: lootRow[0] as number, commonId: lootRow[1] as number, rareId: lootRow[2] as number, commonQty: lootRow[3] as number, rareQty: lootRow[4] as number };
      const tgt = input['target'] as number[];
      const target = { stealCount: tgt[0] as number, lastAttacker: tgt[1] as number };
      const rikku = { count: num(g['rikku'] ?? 0) };
      const r = stealItem(loot, (input['user'] as number[])[0] as number, args[0] as number, target, rikku, opts, script.draw);
      out = {
        blk: [r.attempted ? 1 : 0, r.qtyWord, r.itemId],
        loot: loot === null ? [0, 0, 0, 0, 0] : [loot.chance, loot.commonId, loot.rareId, loot.commonQty, loot.rareQty],
        target: [target.stealCount],
        rikku: rikku.count >>> 0,
        inv: r.inventoryAdd === null ? [] : [r.inventoryAdd],
        ach: r.achievement === null ? [] : [r.achievement],
        ret: 0,
      };
      if (loot === null) {
        // the game leaves the loot memory (which the vector keeps at zero) untouched when there is no record
        out['loot'] = [0, 0, 0, 0, 0];
      }
      break;
    }
    case 'stealGil': {
      const tgt = input['target'] as number[];
      const r = stealGil(num(input['hasLoot']) !== 0, num(input['factor']), tgt[0] as number, args[0] as number, opts, script.draw);
      out = { blk: [r === null ? 0 : 1, r === null ? 0 : r.amount], chance: r === null ? (tgt[0] as number) : r.chance, ret: 0 };
      break;
    }
    case 'bribe': {
      const t = input['target'] as Obj;
      const target = {
        maxHp: num(t['maxHp']),
        paid: num(t['paid']),
        special: num(t['special']),
        monsterId: num(t['monster']),
        marker: num(t['marker']),
        value: num(t['value']),
      };
      const rec = { sleep: num((input['rec'] as Obj)['sleep']), extra: num((input['rec'] as Obj)['extra']) };
      const c = input['counters'] as number[];
      const counters = { success: c[0] as number, immune: c[1] as number, fail: c[2] as number };
      const ret = bribe(args[0] as number, target, num(input['cmd']), counters, rec, num(g['offered'] ?? 0), opts, script.draw);
      out = {
        target: { paid: target.paid >>> 0, marker: target.marker, value: target.value | 0 },
        rec: { extra: rec.extra },
        counters: [counters.success, counters.immune, counters.fail],
        ret,
      };
      break;
    }
    default:
      throw new Error(`unknown steal function ${String(input['fn'])}`);
  }
  return { out, draws: script.calls(), streams: script.streams };
}
