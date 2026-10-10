/**
 * Adapter between the aeon golden-vector fixtures (`tests/fixtures/parity/ffx/aeon_*.json`) and the kernels in
 * `src/battle/ffx/kernel/aeon-stats.ts`, `aeon-party.ts` and `battle-save.ts`. The stat and joint-action vectors are described here; the
 * party-transition vectors and the end-of-battle vectors, and the compact forms their fixtures store, beside their functions below.
 *
 * A vector's `in`:
 *   - aeonStats: `args [slot]`; `yuna {save [hp, mp, str, def, mag, mdef, agi, luck, eva, acc], bonus [hpUnits, mpUnits, 8 stat bytes]}`
 *     (Yuna's save record and her Sphere Grid bonus record); `aeon {bonus [hp, mp, 8 stat bytes], cur [hp, mp], flag2c, gear [weapon id, armor id]}`
 *     (the aeon's own save record); `battles`; `rom` (the 18 bytes of the ply_rom record from +0x18); `assure` ([hp, mp, 7 stat bytes] of the aeon's
 *     tier row, absent at tier 0); `abilities` (per equipment ability slot, in reading order: [percent, mask, wordA, wordB, wordC] or null);
 *   - summonCtb: `args [id]`; `party [7 ids, 255 = empty]`; `slots {id: [agi, haste, slow, ctb, ...]}`; `src [targetMask, flag451, flag5c0, mpUsed, odUsed, rank, ctb]`.
 * `out` (aeonStats): maxHp, maxMp, stats [8], cur [hp, mp], flags [3 words], pct [4 bytes]; (summonCtb): src ctb and, for every id in the list, [ctb, mask, flag451, flag5c0, mpUsed, odUsed].
 *
 * Game case: FFX only.
 */

import { aeonRowOf, aeonStats, partyRawStats, summonCtb, type AbilityEffect, type SummonSlot } from '../../../src/battle/ffx/kernel/aeon-stats.ts';
import {
  aeonWipe,
  dismiss,
  restoreLists,
  startArrival,
  summon,
  swapMember,
  type PartyChr,
  type PartyWorld,
} from '../../../src/battle/ffx/kernel/aeon-party.ts';
import { settleBattle, type AeonBuild, type BattleChr, type SaveSlot } from '../../../src/battle/ffx/kernel/battle-save.ts';

type Obj = Record<string, unknown>;

/**
 * The coefficient bytes of the ten aeons: ply_rom records 8 to 0x11, bytes 0x18 to 0x29 (Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima,
 * Yojimbo, Cindy, Sandy, Mindy), read from the install's data file. Numbers only.
 */
export const REAL_AEON_ROWS: readonly number[][] = [
  [6, 20, 2, 4, 7, 6, 5, 5, 70, 10, 30, 10, 20, 5, 24, 5, 20, 20],
  [5, 70, 2, 3, 7, 8, 5, 17, 33, 9, 34, 9, 20, 4, 70, 3, 20, 20],
  [6, 55, 2, 5, 7, 10, 5, 10, 38, 9, 30, 13, 20, 3, 47, 3, 20, 25],
  [6, 40, 2, 7, 8, 12, 7, 4, 28, 10, 25, 10, 23, 10, 44, 10, 20, 20],
  [7, 100, 3, 5, 7, 16, 6, 20, 250, 9, 12, 10, 20, 5, 20, 5, 20, 20],
  [8, 120, 4, 4, 6, 33, 5, 10, 12, 7, 30, 10, 20, 4, 20, 5, 20, 20],
  [9, 18, 0, 0, 6, 24, 8, 25, 23, 6, 30, 10, 20, 4, 20, 18, 10, 30],
  [10, 240, 3, 18, 6, 23, 6, 30, 60, 10, 12, 10, 20, 5, 20, 5, 20, 20],
  [8, 200, 3, 5, 7, 55, 6, 18, 40, 11, 12, 10, 20, 5, 20, 4, 20, 27],
  [5, 150, 4, 20, 7, 16, 6, 14, 40, 13, 12, 10, 20, 7, 20, 6, 20, 24],
];

export function runAeonVector(input: Obj): Obj {
  if (input['fn'] === 'summonCtb') {
    const party = input['party'] as number[];
    const src = input['src'] as number[];
    const slots = input['slots'] as Record<string, number[]>;
    const chrs = new Map<number, SummonSlot>();
    const mk = (agi: number, haste: number, slow: number, ctb: number): SummonSlot => ({
      ctb,
      agi,
      haste,
      slow,
      targetMask: 0x11111111,
      flag451: 0x22,
      flag5c0: 0x44,
      mpUsed: 0x55,
      odUsed: 0x66,
      rank: 0,
    });
    for (const [id, row] of Object.entries(slots)) chrs.set(Number(id), mk(row[0] as number, row[1] as number, row[2] as number, (row[3] as number) !== 0 ? (row[3] as number) : 0x33));
    const id = (input['args'] as number[])[0] as number;
    const s = chrs.get(id) ?? mk(0, 0, 0, 0);
    // the source character carries the action's fields; the game wrote them over whatever the slot row set
    Object.assign(s, { targetMask: (src[0] as number) >>> 0, flag451: src[1], flag5c0: src[2], mpUsed: src[3], odUsed: src[4], rank: src[5], ctb: (src[6] as number) !== 0 ? src[6] : 0x77 });
    chrs.set(id, s);
    summonCtb(party, id, chrs);
    const others: Record<string, number[]> = {};
    for (const pid of [...new Set(party.filter((x) => x !== 0xff))].sort((a, b) => a - b)) {
      const c = chrs.get(pid) as SummonSlot;
      others[String(pid)] = [c.ctb, c.targetMask >>> 0, c.flag451, c.flag5c0, c.mpUsed, c.odUsed];
    }
    return { src: s.ctb, others };
  }
  const slot = (input['args'] as number[])[0] as number;
  const y = input['yuna'] as Obj;
  const ys = y['save'] as number[];
  const yb = y['bonus'] as number[];
  const yuna = partyRawStats(
    { hp: ys[0] as number, mp: ys[1] as number, stats: ys.slice(2) },
    { hp: yb[0] as number | 0, mp: yb[1] as number | 0, stats: yb.slice(2) },
  );
  const aeon = input['aeon'] as Obj;
  const ab = aeon['bonus'] as number[];
  const cur = aeon['cur'] as number[];
  const assureRow = input['assure'] as number[] | undefined;
  const abilities: AbilityEffect[] = [];
  for (const a of (input['abilities'] ?? []) as Array<number[] | null>) {
    if (a !== null) abilities.push({ pct: a[0] as number, mask: a[1] as number, wordA: a[2] as number, wordB: a[3] as number, wordC: a[4] as number });
  }
  const r = aeonStats({
    slot,
    yuna,
    bonus: { hp: (ab[0] as number) | 0, mp: (ab[1] as number) | 0, stats: ab.slice(2) },
    current: { hp: cur[0] as number, mp: cur[1] as number },
    row: aeonRowOf(input['rom'] as number[]),
    battles: input['battles'] as number,
    assure: assureRow === undefined ? null : { hp: assureRow[0] as number, mp: assureRow[1] as number, stats: assureRow.slice(2) },
    abilities,
  });
  return { maxHp: r.maxHp >>> 0, maxMp: r.maxMp >>> 0, stats: r.stats, cur: [r.current.hp >>> 0, r.current.mp >>> 0], flags: r.flags, pct: r.damageMods };
}


// ---------------------------------------------------------------------------------------------------------------
// The party-transition vectors (`tests/fixtures/parity/ffx/aeon_party.json`)
//
// A vector's `in` is `{ world, ops }`. `world` holds the lists (`active`, `saved`, `roster`, `rosterSaved`), the globals
// `g` (`summon`, `aeon`, `summoner`, `grand`, `actor`, `deadMask`), `reward` (18 bytes) and `chr`: id -> the character's
// bytes in the order of {@link PARTY_CHR_FIELDS}. Fixture files leave out whatever equals {@link PARTY_DEFAULTS}.
// `ops` is a list of `{ fn, args }`: summon [summoner, aeon], arrive, drain (the queued arrival actions finish; the kernel
// has no queue, so nothing to do), dismiss [revive], restore, wipe, swap [out, in, mode]. `out.steps` is the whole world after
// each op, as in {@link snapshotParty}.
// ---------------------------------------------------------------------------------------------------------------

/** The order of a character's bytes in a party vector. */
export const PARTY_CHR_FIELDS = [
  'present', 'dc8', 'dc9', 'df8', 'dcb', 'f1a', 'summoner', 'arrival', 'blocked', 'dead', 'hp', 'ctb', 'perm', 'provoker', 'thrA', 'thrB',
  'gauge', 'gaugeMax', 'gaugeSaved', 'gaugeHeld', 'stoned', 'baseCtb', 'recover', 'recoverMax', 'avail',
] as const;

/** What a character's byte is when a fixture leaves it out (the values of a character nobody has touched). */
export const PARTY_DEFAULTS: Record<(typeof PARTY_CHR_FIELDS)[number], number> = {
  present: 0, dc8: 0, dc9: 0, df8: 0, dcb: 0, f1a: 0, summoner: 0xff, arrival: 0, blocked: 0, dead: 0, hp: 0, ctb: 0, perm: 0,
  provoker: 0xff, thrA: 0xff, thrB: 0xff, gauge: 0, gaugeMax: 0, gaugeSaved: 0, gaugeHeld: 0, stoned: 0, baseCtb: 0, recover: 0, recoverMax: 0, avail: 0,
};

/** The character ids a party vector carries. */
export const PARTY_CHR_IDS = [...Array.from({ length: 0x12 }, (_, i) => i), ...Array.from({ length: 8 }, (_, i) => 0x14 + i)];

function chrFromRow(row: number[] | undefined): PartyChr {
  const c: Record<string, number> = {};
  PARTY_CHR_FIELDS.forEach((name, i) => {
    c[name] = row === undefined ? PARTY_DEFAULTS[name] : ((row[i] ?? PARTY_DEFAULTS[name]) as number);
  });
  return c as unknown as PartyChr;
}

function worldFromJson(input: Obj): PartyWorld {
  const j = input['world'] as Obj;
  const g = j['g'] as Record<string, number>;
  const rows = (j['chr'] ?? {}) as Record<string, number[]>;
  const chr: Record<number, PartyChr> = {};
  for (const id of PARTY_CHR_IDS) chr[id] = chrFromRow(rows[String(id)]);
  return {
    active: [...(j['active'] as number[])],
    saved: [...(j['saved'] as number[])],
    roster: [...(j['roster'] as number[])],
    rosterSaved: [...(j['rosterSaved'] as number[])],
    summonActive: g['summon'] as number,
    aeonId: g['aeon'] as number,
    summonerId: g['summoner'] as number,
    grandSummon: g['grand'] as number,
    actor: g['actor'] as number,
    deadMask: (g['deadMask'] as number) >>> 0,
    reward: [...(j['reward'] as number[])],
    chr,
  };
}

/** The world as a vector's `out` stores it (a character is the array of its bytes; hp as the signed 32-bit value). */
export function snapshotParty(w: PartyWorld): Obj {
  const chr: Record<string, number[]> = {};
  for (const id of PARTY_CHR_IDS) {
    const c = w.chr[id] as unknown as Record<string, number>;
    chr[String(id)] = PARTY_CHR_FIELDS.map((name) => (name === 'hp' ? (c[name] as number) | 0 : (c[name] as number)));
  }
  return {
    active: [...w.active],
    saved: [...w.saved],
    roster: [...w.roster],
    rosterSaved: [...w.rosterSaved],
    g: { summon: w.summonActive, aeon: w.aeonId, summoner: w.summonerId, grand: w.grandSummon, actor: w.actor, deadMask: w.deadMask >>> 0 },
    reward: [...w.reward],
    chr,
  };
}

export function runPartyVector(input: Obj): Obj {
  const w = worldFromJson(input);
  const steps: Obj[] = [];
  for (const op of input['ops'] as Array<{ fn: string; args?: number[] }>) {
    const a = op.args ?? [];
    switch (op.fn) {
      case 'summon': summon(w, a[0] as number, a[1] as number); break;
      case 'arrive': startArrival(w); break;
      case 'drain': break;
      case 'dismiss': dismiss(w, a[0] as number); break;
      case 'restore': restoreLists(w); break;
      case 'wipe': aeonWipe(w); break;
      case 'swap': swapMember(w, a[0] as number, a[1] as number, a[2] as number); break;
      default: throw new Error(`unknown op ${op.fn}`);
    }
    steps.push(snapshotParty(w));
  }
  return { steps };
}


// ---------------------------------------------------------------------------------------------------------------
// The end-of-battle save vectors (`tests/fixtures/parity/ffx/aeon_settle.json`)
//
// `in`: `battles`; `yunaSave` [hp, mp, str, def, mag, mdef, agi, luck, eva, acc] and `yunaBonus` [hpUnits, mpUnits, 8 stat bytes];
// `aeons` by slot 8..0x11: `rom` (18 bytes), `assure` ([hp, mp, 7 bytes] or null), `bonus` [hp, mp, 8 stat bytes], `abilities`
// (eight slots, [percent, mask, wordA, wordB, wordC] or null); `chr` by slot 0..0x11: the battle character's `hp`, `mp`,
// `recover`, `weapon`, `armor`, `odMode`, `odGauge`, `odMax` and the save record's `saveMaxHp`, `saveMaxMp`; `active`, `saved`,
// `roster`, `rosterSaved`, `summon`. Fields named `save...` other than the two maxima are what the record held before and are
// overwritten. `out`: `save` by slot (hp, mp, recover, weapon, armor, od [mode, gauge, max]), `aeon` by slot 8..0x11 (maxHp,
// maxMp, stats, flags, pct), `persist` (list: the first three of the active list; roster) and `lists`.
// ---------------------------------------------------------------------------------------------------------------

export function runSettleVector(input: Obj): Obj {
  const chrIn = input['chr'] as Record<string, Obj>;
  const chrs: BattleChr[] = [];
  const saves: SaveSlot[] = [];
  for (let id = 0; id < 0x12; id++) {
    const c = chrIn[String(id)] as Record<string, number>;
    chrs.push({ hp: c['hp'] as number, mp: c['mp'] as number, recover: c['recover'] as number, weaponId: c['weapon'] as number, armorId: c['armor'] as number, odMode: c['odMode'] as number, odGauge: c['odGauge'] as number, odMax: c['odMax'] as number });
    saves.push({ hp: 0, mp: 0, maxHp: c['saveMaxHp'] as number, maxMp: c['saveMaxMp'] as number, recover: 0, weaponId: 0, armorId: 0, odMode: 0, odGauge: 0, odMax: 0 });
  }
  const builds: Record<number, AeonBuild> = {};
  const aeonsIn = input['aeons'] as Record<string, Obj>;
  for (const [idS, a] of Object.entries(aeonsIn)) {
    const bonus = a['bonus'] as number[];
    const assure = a['assure'] as number[] | null;
    const abilities: AbilityEffect[] = [];
    for (const ab of a['abilities'] as Array<number[] | null>) {
      if (ab !== null) abilities.push({ pct: ab[0] as number, mask: ab[1] as number, wordA: ab[2] as number, wordB: ab[3] as number, wordC: ab[4] as number });
    }
    builds[Number(idS)] = {
      bonus: { hp: (bonus[0] as number) | 0, mp: (bonus[1] as number) | 0, stats: bonus.slice(2) },
      row: aeonRowOf(a['rom'] as number[]),
      assure: assure === null ? null : { hp: assure[0] as number, mp: assure[1] as number, stats: assure.slice(2) },
      abilities,
    };
  }
  const ys = input['yunaSave'] as number[];
  const yb = input['yunaBonus'] as number[];
  const yuna = partyRawStats({ hp: ys[0] as number, mp: ys[1] as number, stats: ys.slice(2) }, { hp: yb[0] as number | 0, mp: yb[1] as number | 0, stats: yb.slice(2) });
  const w: PartyWorld = {
    active: [...(input['active'] as number[])],
    saved: [...(input['saved'] as number[])],
    roster: [...(input['roster'] as number[])],
    rosterSaved: [...(input['rosterSaved'] as number[])],
    summonActive: input['summon'] as number,
    aeonId: 0, summonerId: 0xff, grandSummon: 0, actor: 0xff, deadMask: 0, reward: [], chr: {},
  };
  const r = settleBattle(w, chrs, saves, yuna, input['battles'] as number, builds);
  const save: Record<string, Obj> = {};
  const aeon: Record<string, Obj> = {};
  for (let id = 0; id < 0x12; id++) {
    const s = saves[id] as SaveSlot;
    save[String(id)] = { hp: s.hp | 0, mp: s.mp | 0, recover: s.recover, weapon: s.weaponId, armor: s.armorId, od: [s.odMode, s.odGauge, s.odMax] };
    if (id >= 8) {
      const a = r.aeons[id] as ReturnType<typeof aeonStats>;
      aeon[String(id)] = { maxHp: a.maxHp >>> 0, maxMp: a.maxMp >>> 0, stats: a.stats, flags: a.flags, pct: a.damageMods };
    }
  }
  return { save, aeon, persist: { list: r.list, roster: r.roster }, lists: { active: [...w.active], summon: w.summonActive } };
}

// ---------------------------------------------------------------------------------------------------------------
// The compact forms the repo fixtures store (the private full vectors keep the shapes above)
// ---------------------------------------------------------------------------------------------------------------

/**
 * Rebuilds the world after every op of a compact party vector (`aeon_party.json`). `out.steps[k]` holds only what changed
 * since the step before (the input world for k = 0): the arrays that changed (`active`, `saved`, `roster`, `rosterSaved`,
 * `reward`), `g` {changed globals} and `chr` {id: {field name: new value}}. The result is what `runPartyVector` returns.
 */
export function expandPartySteps(input: Obj, out: Obj): Obj {
  let prev = snapshotParty(worldFromJson(input));
  const steps: Obj[] = [];
  for (const d of out['steps'] as Obj[]) {
    const next = JSON.parse(JSON.stringify(prev)) as Obj;
    for (const key of ['active', 'saved', 'roster', 'rosterSaved', 'reward']) {
      if (d[key] !== undefined) next[key] = [...(d[key] as number[])];
    }
    Object.assign(next['g'] as Obj, (d['g'] ?? {}) as Obj);
    const rows = next['chr'] as Record<string, number[]>;
    for (const [id, fields] of Object.entries((d['chr'] ?? {}) as Record<string, Record<string, number>>)) {
      const row = rows[id] as number[];
      for (const [name, v] of Object.entries(fields)) {
        const at = (PARTY_CHR_FIELDS as readonly string[]).indexOf(name);
        if (at < 0) throw new Error(`unknown character field ${name}`);
        row[at] = v;
      }
    }
    steps.push(next);
    prev = next;
  }
  return { steps };
}

/** The tables an end-of-battle fixture keeps once in its `defaults`: the real coefficient rows, `sum_assure` rows and equipment abilities. */
export interface SettleTables {
  /** Aeon slot -> the 18 coefficient bytes. */
  rom: Record<string, number[]>;
  /** `slot:tier` -> [hp, mp, 7 stat bytes]. */
  assure: Record<string, number[]>;
  /** Gear id -> the four ability slots [percent, mask, wordA, wordB, wordC] or null. */
  gear: Record<string, Array<number[] | null>>;
}

/** The order of a compact end-of-battle row in `in.chr`. */
const SETTLE_CHR_KEYS = ['hp', 'mp', 'recover', 'weapon', 'armor', 'odMode', 'odGauge', 'odMax', 'saveMaxHp', 'saveMaxMp'] as const;

/** Turns a compact end-of-battle input (`aeon_settle.json`) into the shape `runSettleVector` takes. */
export function expandSettleInput(c: Obj, tables: SettleTables): Obj {
  const chr: Record<string, Obj> = {};
  (c['chr'] as number[][]).forEach((row, id) => {
    const o: Obj = {};
    SETTLE_CHR_KEYS.forEach((k, i) => {
      o[k] = row[i];
    });
    chr[String(id)] = o;
  });
  const tier = Math.min(Math.floor(((c['battles'] as number) >>> 0) / 30), 20);
  const slotsOf = (gid: number): Array<number[] | null> => {
    const g = tables.gear[String(gid)];
    if (g === undefined) throw new Error(`gear ${gid} is not in the fixture's tables`);
    return g;
  };
  const aeons: Record<string, Obj> = {};
  for (const [idS, a] of Object.entries(c['aeons'] as Record<string, Obj>)) {
    const worn = chr[idS] as Record<string, number>;
    const rom = a['rom'] === 'real' ? tables.rom[idS] : a['rom'];
    const assure = a['assure'] === 'real' ? tables.assure[`${idS}:${tier}`] : a['assure'];
    if (rom === undefined || assure === undefined) throw new Error(`aeon ${idS}: a table row the vector names is missing`);
    aeons[idS] = {
      rom,
      assure,
      bonus: a['bonus'],
      abilities: a['abilities'] ?? [...slotsOf(worn['weapon'] as number), ...slotsOf(worn['armor'] as number)],
    };
  }
  return { ...c, chr, aeons };
}

/** Turns a compact end-of-battle answer into the shape `runSettleVector` returns. */
export function expandSettleOutput(c: Obj): Obj {
  const save: Record<string, Obj> = {};
  (c['save'] as number[][]).forEach((r, id) => {
    save[String(id)] = { hp: r[0], mp: r[1], recover: r[2], weapon: r[3], armor: r[4], od: [r[5], r[6], r[7]] };
  });
  const aeon: Record<string, Obj> = {};
  (c['aeon'] as number[][]).forEach((r, k) => {
    aeon[String(8 + k)] = { maxHp: r[0], maxMp: r[1], stats: r.slice(2, 10), flags: r.slice(10, 13), pct: r.slice(13, 17) };
  });
  return { save, aeon, persist: { list: c['list'], roster: c['roster'] }, lists: { active: c['active'], summon: c['summon'] } };
}
