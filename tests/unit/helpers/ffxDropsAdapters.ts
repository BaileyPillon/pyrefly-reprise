/**
 * Adapter between the kill-reward golden-vector fixtures (`tests/fixtures/parity/ffx/drops_*.json`) and the kernels in
 * `src/battle/ffx/kernel/drops.ts` and `gear-drop.ts`.
 *
 * A vector's `in`:
 *   - `fn`: rollDrops | rollGear | awardAp | rewardAdd | apSettle; `args` its plain arguments;
 *   - rollDrops / rollGear: `loot` {gil, ap, apOk, ch [2], gear, items [4], qty [4], oItems [4], oQty [4], bribe [item, factor],
 *     gf [slotBase, b2e, b2f, b30, abilityBase], rows {"type + 2 * owner": [8 u16]}}; `rec` {"id": [autoB, inBattle, dead, blocked]};
 *     `victim` {marker, value}; `killerAeon` {"id": 0|1}; `joined` [party ids that have joined]; `groups` {"a_ability record":
 *     group byte}; `R` {gil, ap {"id": n}, items [[id, qty]], gear: count already in the list}; `g` {ap100, gil100, hit, rare, mode, lang};
 *   - awardAp: `chr` [autoB, inBattle, dead, blocked], `total`; rewardAdd: `R.items`; apSettle: `rows` {"id": [acted, inBattle, dead,
 *     stoned, ap, backup, battles]}, `tail`.
 * `out`: `ret` (when the function returns something), and only what changed: `gil`, `ap` {"id": n}, `items` + `itemCount`,
 * `gearCount`, `gear` (the new entries as hex strings of their 22 bytes), `bribeItem`, `total`, `stat0`, `tail`.
 *
 * Game case: FFX only.
 */

import { awardAp } from '../../../src/battle/ffx/kernel/ap-award.ts';
import { rollGearDrop, gearEntryBytes, type GearEntry, type GearLoot } from '../../../src/battle/ffx/kernel/gear-drop.ts';
import { addReward, type DropLoot, type DropsInput, type RewardList, rollDrops, settleAp, type SettleSlot } from '../../../src/battle/ffx/kernel/drops.ts';
import { rngStreamIndex } from '../../../src/battle/ffx/kernel/rng.ts';
import type { ParityDraw } from './ffxParityFixture.ts';
import { streamedDraw } from './ffxStatusAdapters.ts';

type Obj = Record<string, unknown>;
const num = (v: unknown): number => Number(v);

/** The a_ability record the game reads for an ability id: `id & 0xfff`, or record 0 beyond the last one (133). */
export function abilityRecord(id: number): number {
  const k = id & 0xfff;
  return k <= 133 ? k : 0;
}

function lootOf(l: Obj): DropLoot {
  const rows = new Map<number, readonly number[]>();
  for (const [k, row] of Object.entries((l['rows'] ?? {}) as Record<string, number[]>)) rows.set(Number(k), row);
  const gf = l['gf'] as number[];
  return {
    gil: num(l['gil']),
    ap: num(l['ap']),
    apOverkill: num(l['apOk']),
    chance: [(l['ch'] as number[])[0] as number, (l['ch'] as number[])[1] as number],
    gearChance: num(l['gear']),
    items: [...(l['items'] as number[])],
    qty: [...(l['qty'] as number[])],
    overkillItems: [...(l['oItems'] as number[])],
    overkillQty: [...(l['oQty'] as number[])],
    bribeItem: (l['bribe'] as number[])[0] as number,
    bribeFactor: (l['bribe'] as number[])[1] as number,
    slotBase: gf[0] as number,
    copy2e: gf[1] as number,
    copy2f: gf[2] as number,
    copy30: gf[3] as number,
    abilityBase: gf[4] as number,
    rows,
  };
}

/** A reward list holding what the vector says; existing gear entries are placeholders (their bytes are never read). */
function rewardOf(r: Obj): RewardList {
  const gear: GearEntry[] = [];
  for (let k = 0; k < num(r['gear'] ?? 0); k++) gear.push({ name: 0, flag: 0, owner: 0, type: 0, mark: 0, copies: [0, 0, 0], slots: 0, abilities: [0, 0, 0, 0] });
  const ap = new Array<number>(0x12).fill(0);
  for (const [k, v] of Object.entries((r['ap'] ?? {}) as Record<string, number>)) ap[Number(k)] = v >>> 0;
  return { gil: num(r['gil'] ?? 0) >>> 0, ap, items: ((r['items'] ?? []) as number[][]).map((s) => ({ id: s[0] as number, qty: s[1] as number })), gear };
}

function diffReward(before: RewardList, after: RewardList, newGear: GearEntry[]): Obj {
  const out: Obj = {};
  if (before.gil !== after.gil) out['gil'] = after.gil >>> 0;
  const ap: Record<string, number> = {};
  after.ap.forEach((v, i) => {
    if (((before.ap[i] as number) >>> 0) !== v >>> 0) ap[String(i)] = v >>> 0;
  });
  if (Object.keys(ap).length > 0) out['ap'] = ap;
  const bi = JSON.stringify(before.items);
  const ai = JSON.stringify(after.items);
  if (bi !== ai) {
    out['items'] = after.items.map((s) => [s.id, s.qty]);
    out['itemCount'] = after.items.length;
  }
  if (before.gear.length !== after.gear.length) out['gearCount'] = after.gear.length;
  if (newGear.length > 0) out['gear'] = newGear.map((g) => gearEntryBytes(g).map((b) => b.toString(16).padStart(2, '0')).join(''));
  return out;
}

const NAME_STUB = (): number => 0x1234;

export interface DropsRun {
  out: Obj;
  draws: number;
  streams: number[];
}

export function runDropsVector(input: Obj, rngDraws: readonly ParityDraw[] | undefined): DropsRun {
  const script = streamedDraw(rngDraws);
  const args = (input['args'] ?? []) as number[];
  const g = (input['g'] ?? {}) as Obj;
  const groups = (input['groups'] ?? {}) as Record<string, number>;
  const groupOf = (ab: number): number => groups[String(abilityRecord(ab))] ?? -1;
  const joinedIds = new Set((input['joined'] ?? []) as number[]);
  const joined = Array.from({ length: 7 }, (_, i) => joinedIds.has(i));
  let out: Obj;
  switch (input['fn']) {
    case 'rollDrops': {
      const loot = lootOf(input['loot'] as Obj);
      const reward = rewardOf((input['R'] ?? {}) as Obj);
      const before: RewardList = { gil: reward.gil, ap: [...reward.ap], items: reward.items.map((s) => ({ ...s })), gear: [...reward.gear] };
      const rec = (input['rec'] ?? {}) as Record<string, number[]>;
      const recipients = Array.from({ length: 0x12 }, (_, i) => {
        const row = rec[String(i)] ?? [0, 0, 0, 0];
        return { autoB: row[0] as number, inBattle: row[1] !== 0, dead: row[2] !== 0, apBlocked: row[3] !== 0 };
      });
      const victim = (input['victim'] ?? {}) as Obj;
      const killer = args[0] as number;
      const aeon = ((input['killerAeon'] ?? {}) as Record<string, number>)[String(killer)] === 1;
      const inp: DropsInput = {
        killerStream: rngStreamIndex(killer, 0, aeon),
        killerId: killer,
        loot,
        overkill: args[1] !== 0,
        statusWord: args[2] as number,
        bribed: num(victim['marker']) === 2,
        bribeValue: num(victim['value'] ?? 0),
        recipients,
        joined,
        groupOf,
        nameOf: NAME_STUB,
        opts: {
          language: num(g['lang'] ?? 1),
          debugAlwaysHit: num(g['hit'] ?? 0) !== 0,
          debugAlwaysRare: num(g['rare'] ?? 0) !== 0,
          debugAp100: num(g['ap100'] ?? 0) !== 0,
          debugGil100: num(g['gil100'] ?? 0) !== 0,
        },
      };
      rollDrops(inp, reward, script.draw);
      const created = reward.gear.slice(before.gear.length);
      out = { ...diffReward(before, reward, created), bribeItem: loot.bribeItem };
      break;
    }
    case 'rollGear': {
      const loot = lootOf(input['loot'] as Obj) as GearLoot;
      const reward = rewardOf((input['R'] ?? {}) as Obj);
      const n0 = reward.gear.length;
      const entry = rollGearDrop(args[0] as number, loot, reward.gear, joined, groupOf, NAME_STUB, script.draw);
      out = { ret: entry === null ? -1 : 0, ...(entry === null ? {} : { gearCount: reward.gear.length, gear: [gearEntryBytes(entry).map((b) => b.toString(16).padStart(2, '0')).join('')] }) };
      if (entry === null) delete out['gearCount'];
      void n0;
      break;
    }
    case 'awardAp': {
      const c = input['chr'] as number[];
      const totals = new Array<number>(0x12).fill(0);
      const id = args[0] as number;
      totals[id] = num(input['total']) >>> 0;
      const ret = awardAp({ autoB: c[0] as number, inBattle: c[1] !== 0, dead: c[2] !== 0, apBlocked: c[3] !== 0 }, totals, id, args[1] as number, args[2] as number);
      out = { ret, total: (totals[id] as number) >>> 0 };
      break;
    }
    case 'rewardAdd': {
      const reward = rewardOf((input['R'] ?? {}) as Obj);
      const before: RewardList = { gil: reward.gil, ap: [...reward.ap], items: reward.items.map((s) => ({ ...s })), gear: [...reward.gear] };
      addReward(reward, args[0] as number, args[1] as number);
      out = diffReward(before, reward, []);
      break;
    }
    case 'apSettle': {
      const rows = (input['rows'] ?? {}) as Record<string, number[]>;
      const slots: SettleSlot[] = Array.from({ length: 0x12 }, (_, i) => {
        const r = rows[String(i)];
        return r === undefined
          ? { acted: false, inBattle: false, dead: false, stoned: false, ap: 0, backup: 0, battles: 0 }
          : { acted: r[0] !== 0, inBattle: r[1] !== 0, dead: r[2] !== 0, stoned: r[3] !== 0, ap: (r[4] as number) >>> 0, backup: (r[5] as number) >>> 0, battles: (r[6] as number) >>> 0 };
      });
      settleAp(slots);
      out = {
        ap: Object.fromEntries(slots.map((s, i) => [String(i), s.ap >>> 0])),
        stat0: Object.fromEntries(slots.map((s, i) => [String(i), s.battles >>> 0])),
        tail: 0,
      };
      break;
    }
    default:
      throw new Error(`unknown rewards function ${String(input['fn'])}`);
  }
  return { out, draws: script.calls(), streams: script.streams };
}
