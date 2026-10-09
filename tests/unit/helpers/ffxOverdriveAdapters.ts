/**
 * Adapter between the Overdrive golden-vector fixtures (`tests/fixtures/parity/ffx/od_*.json`) and the kernels in
 * `src/battle/ffx/kernel/overdrive*.ts` and `ap-award.ts`.
 *
 * A vector's `in` holds the function name (`fn`), its arguments (`args`) and a sparse description of the world the
 * game function ran in:
 *   - `slots`: `{ "<chr id>": [row] }`, a row in the column order {@link SLOT_COLUMNS}, trailing zeros left out; a slot
 *     that is not listed is all zero;
 *   - `factor`: `{ "<chr id>": number }`, the float at `Chr+0x70c` (1.0 for a listed slot that has no entry);
 *   - `save`: `{ "<id>": { counters: { "<mode>": n }, learned, levelA, levelB, stat: [4 counters] } }`;
 *   - `rom`: `{ "<id>": [a, b, c, cap] }`, the ply_rom bytes of the AP curve;
 *   - `g`: `{ disabled, mode, learned, ap: { "<id>": total } }`, the globals.
 * `out` holds `ret` (what the function returned, when it returns something) and only what CHANGED: `slots` (gauge,
 * eventFlags, apFactor, refDamage), `save` (counters by mode, stat counters by index), `ap` totals, `learned`, and for the
 * after-action function the energy byte.
 *
 * Game case: FFX only.
 */

import { type ApCurveRow, apCurve, bumpStat } from '../../../src/battle/ffx/kernel/ap-award.ts';
import { newOdSlot, newOdWorld, odAdd, odAfterAction, odModeCounter, odRefDamage, OD_MODE_COUNT, type OdSlot, type OdWorld } from '../../../src/battle/ffx/kernel/overdrive.ts';
import { odHoldForGrandSummon, odPayCosts } from '../../../src/battle/ffx/kernel/overdrive-cost.ts';
import {
  odOnDeath,
  odOnEscape,
  odOnHpChange,
  odOnOutcome,
  odOnTurn,
  odOnVictory,
} from '../../../src/battle/ffx/kernel/overdrive-hooks.ts';

/** The column order of a slot row. */
export const SLOT_COLUMNS = [
  'mode', 'gauge', 'gaugeMax', 'maxHp', 'hp', 'refDamage', 'inBattle', 'getsTurns', 'dead', 'stoned', 'autoB', 'extra', 'buffs',
  'perm', 'sleep', 'silence', 'darkness', 'slow', 'eventFlags', 'apBlocked', 'afterOn', 'afterFlag', 'energyDelta0',
  'energyDelta1', 'odDelta0', 'odDelta1', 'energy', 'str', 'mag', 'mp', 'mpUsed', 'odUsed', 'savedGauge', 'savedFlag',
] as const;

type Obj = Record<string, unknown>;
const num = (v: unknown): number => Number(v);

/** Builds the world a vector describes. `str`/`mag` columns are returned separately (only the reference damage uses them). */
export function worldOf(input: Obj): { world: OdWorld; strMag: Map<number, [number, number]> } {
  const w = newOdWorld();
  const strMag = new Map<number, [number, number]>();
  const factor = (input['factor'] ?? {}) as Record<string, number>;
  for (const [k, row] of Object.entries((input['slots'] ?? {}) as Record<string, number[]>)) {
    const col = (name: (typeof SLOT_COLUMNS)[number]): number => row[SLOT_COLUMNS.indexOf(name)] ?? 0;
    const s: OdSlot = newOdSlot({
      mode: col('mode'),
      gauge: col('gauge'),
      gaugeMax: col('gaugeMax'),
      maxHp: col('maxHp'),
      hp: col('hp'),
      refDamage: col('refDamage'),
      inBattle: col('inBattle') !== 0,
      getsTurns: col('getsTurns') !== 0,
      dead: col('dead') !== 0,
      stoned: col('stoned') !== 0,
      autoB: col('autoB'),
      extra: col('extra'),
      buffs: col('buffs'),
      perm: col('perm'),
      sleep: col('sleep'),
      silence: col('silence'),
      darkness: col('darkness'),
      slow: col('slow'),
      eventFlags: col('eventFlags') >>> 0,
      apBlocked: col('apBlocked') !== 0,
      afterOn: col('afterOn') !== 0,
      afterFlag: col('afterFlag'),
      energyDelta: [col('energyDelta0'), col('energyDelta1')],
      odDelta: [col('odDelta0'), col('odDelta1')],
      energy: col('energy'),
      mp: col('mp'),
      mpUsed: col('mpUsed'),
      odUsed: col('odUsed'),
      savedGauge: col('savedGauge'),
      savedFlag: col('savedFlag') !== 0,
      apFactor: Math.fround(factor[k] ?? 1),
    });
    w.slots[Number(k)] = s;
    strMag.set(Number(k), [col('str'), col('mag')]);
  }
  for (const [k, sv] of Object.entries((input['save'] ?? {}) as Record<string, Obj>)) {
    const rec = w.save[Number(k)];
    if (rec === undefined) continue;
    for (const [mode, v] of Object.entries((sv['counters'] ?? {}) as Record<string, number>)) rec.counters[Number(mode)] = v;
    if (sv['learned'] !== undefined) rec.learned = num(sv['learned']) >>> 0;
    if (sv['levelA'] !== undefined) rec.levelA = num(sv['levelA']);
    if (sv['levelB'] !== undefined) rec.levelB = num(sv['levelB']);
    ((sv['stat'] ?? []) as number[]).forEach((v, q) => (rec.statCounters[q] = v >>> 0));
  }
  for (const [k, row] of Object.entries((input['rom'] ?? {}) as Record<string, number[]>)) {
    w.rom[Number(k)] = { a: row[0] ?? 0, b: row[1] ?? 0, c: row[2] ?? 0, cap: (row[3] ?? 0) | 0 } satisfies ApCurveRow;
  }
  const g = (input['g'] ?? {}) as Obj;
  w.disabled = num(g['disabled'] ?? 0) !== 0;
  w.demoMode = num(g['mode'] ?? 0);
  w.learnedFlag = num(g['learned'] ?? 0) !== 0;
  w.grandSummon = num(g['grandSummon'] ?? 0) !== 0;
  w.tidus = { uses: num(g['tidusUses'] ?? 0) | 0, learnedWord: num(g['tidusWord'] ?? 0), learnId: num(g['learnId'] ?? 0) };
  for (const [k, v] of Object.entries((g['ap'] ?? {}) as Record<string, number>)) w.apTotals[Number(k)] = v >>> 0;
  return { world: w, strMag };
}

const WATCH_SLOT = ['gauge', 'eventFlags', 'apFactor', 'refDamage', 'mp', 'mpUsed', 'odUsed', 'savedGauge', 'savedFlag'] as const;

function snapshot(w: OdWorld): Obj {
  return {
    slots: w.slots.map((s) => ({
      gauge: s.gauge,
      eventFlags: s.eventFlags >>> 0,
      apFactor: s.apFactor,
      refDamage: s.refDamage | 0,
      mp: s.mp | 0,
      mpUsed: s.mpUsed,
      odUsed: s.odUsed,
      savedGauge: s.savedGauge,
      savedFlag: s.savedFlag ? 1 : 0,
    })),
    tidus: { tidusUses: w.tidus.uses >>> 0, tidusWord: w.tidus.learnedWord, learnId: w.tidus.learnId },
    save: w.save.map((s) => ({ counters: [...s.counters], stat: [...s.statCounters] })),
    ap: [...w.apTotals],
    learned: w.learnedFlag,
  };
}

/** The same diff the emulator driver writes: only what changed. */
function diffOf(before: Obj, after: Obj): Obj {
  const out: Obj = {};
  const sl: Record<string, Obj> = {};
  const bs = before['slots'] as Obj[];
  const as = after['slots'] as Obj[];
  bs.forEach((b, i) => {
    const d: Obj = {};
    for (const f of WATCH_SLOT) if (b[f] !== (as[i] as Obj)[f]) d[f] = (as[i] as Obj)[f];
    if (Object.keys(d).length > 0) sl[String(i)] = d;
  });
  if (Object.keys(sl).length > 0) out['slots'] = sl;
  const sv: Record<string, Obj> = {};
  (before['save'] as Array<{ counters: number[]; stat: number[] }>).forEach((b, i) => {
    const a = (after['save'] as Array<{ counters: number[]; stat: number[] }>)[i] as { counters: number[]; stat: number[] };
    const d: Obj = {};
    const cc: Record<string, number> = {};
    for (let q = 0; q < OD_MODE_COUNT; q++) if (b.counters[q] !== a.counters[q]) cc[String(q)] = a.counters[q] as number;
    if (Object.keys(cc).length > 0) d['counters'] = cc;
    const st: Record<string, number> = {};
    for (let q = 0; q < 4; q++) if (b.stat[q] !== a.stat[q]) st[String(q)] = a.stat[q] as number;
    if (Object.keys(st).length > 0) d['stat'] = st;
    if (Object.keys(d).length > 0) sv[String(i)] = d;
  });
  if (Object.keys(sv).length > 0) out['save'] = sv;
  const ap: Record<string, number> = {};
  (before['ap'] as number[]).forEach((b, i) => {
    const a = (after['ap'] as number[])[i] as number;
    if (a !== b) ap[String(i)] = a;
  });
  if (Object.keys(ap).length > 0) out['ap'] = ap;
  if (before['learned'] !== after['learned']) out['learned'] = after['learned'] === true ? 1 : 0;
  const gd: Obj = {};
  const bt = before['tidus'] as Obj;
  const at = after['tidus'] as Obj;
  for (const k of Object.keys(bt)) if (bt[k] !== at[k]) gd[k] = at[k];
  if (Object.keys(gd).length > 0) out['g'] = gd;
  return out;
}

/** Runs the kernel for a vector's `fn` on its world and returns the same shape of output the vector stores. */
export function runOdVector(input: Obj): Obj {
  const { world: w, strMag } = worldOf(input);
  const args = (input['args'] ?? []) as number[];
  const before = snapshot(w);
  const extra: Obj = {};
  let ret: number | undefined;
  switch (input['fn']) {
    case 'odAdd':
      ret = odAdd(w, args[0] as number, args[1] as number);
      break;
    case 'odAddSeq':
      for (const amount of args[1] as unknown as number[]) ret = odAdd(w, args[0] as number, amount);
      break;
    case 'odPayCosts':
      odPayCosts(w, args[0] as number);
      break;
    case 'odHold':
      odHoldForGrandSummon(w, w.slots[args[0] as number] as OdSlot);
      break;
    case 'odModeCounter':
      ret = odModeCounter(w, args[0] as number, args[1] as number, args[2] as number);
      break;
    case 'odOnHpChange':
      ret = odOnHpChange(w, args[0] as number, args[1] as number, args[2] as number, args[3] as number, args[4] as number);
      break;
    case 'odOnDeath':
      ret = odOnDeath(w, args[0] as number, args[1] as number);
      break;
    case 'odOnOutcome':
      ret = odOnOutcome(w, args[0] as number, args[1] as number, args[2] as number, args[3] as number);
      break;
    case 'odOnTurn':
      ret = odOnTurn(w, args[0] as number);
      break;
    case 'odOnVictory':
      ret = odOnVictory(w);
      break;
    case 'odOnEscape':
      ret = odOnEscape(w, args[0] as number);
      break;
    case 'odAfterAction': {
      const id = args[0] as number;
      odAfterAction(w.slots[id] as OdSlot);
      extra['energy'] = (w.slots[id] as OdSlot).energy;
      break;
    }
    case 'odRefDamage': {
      const id = args[0] as number;
      const [str, mag] = strMag.get(id) ?? [0, 0];
      ret = odRefDamage(str, mag);
      (w.slots[id] as OdSlot).refDamage = ret;
      break;
    }
    case 'apCurve': {
      const id = args[0] as number;
      const sv = w.save[id];
      ret = apCurve(w.rom[id] as ApCurveRow, sv?.levelA ?? 0, sv?.levelB ?? 0);
      break;
    }
    case 'statCount': {
      const id = args[0] as number;
      const sv = w.save[id];
      if (sv !== undefined) bumpStat(sv.statCounters, id, args[1] as number, w.demoMode);
      break;
    }
    default:
      throw new Error(`unknown Overdrive function ${String(input['fn'])}`);
  }
  const out = diffOf(before, snapshot(w));
  return ret === undefined ? { ...out, ...extra } : { ret, ...out, ...extra };
}
