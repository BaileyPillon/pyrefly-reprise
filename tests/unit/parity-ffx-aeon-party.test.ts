/**
 * Parity tests for the FFX aeon party kernels (`src/battle/ffx/kernel/aeon-party.ts`, `battle-save.ts`): who is in the battle while an
 * aeon is out, and what the game saves when a battle ends.
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the party transitions around a summon
 * (0x7adf90 summon, 0x7ade10 swap of the two lists, 0x7adae0 one member out and one in, 0x7aef20 dismissal, 0x7aeec0 restore of the lists,
 * 0x7adf10 return of the party, 0x78e0a0 aeon wipe, 0x79a080 `can it be summoned`) and the end-of-battle save 0x785fc0 with the aeon rebuild
 * inside it. Spec: `research/re-ffx-overdrive-steal-aeons.md` section 4. The stat formulas themselves are in
 * `parity-ffx-aeon-stats.test.ts`.
 *
 * Hand-worked blocks first (every expectation is derived in its comment from the game's code), then the golden vectors
 * (`tests/fixtures/parity/ffx/aeon_party.json`, `aeon_settle.json`): each is a run of the game's own machine code in an x86-32 emulator.
 */

import { describe, expect, it } from 'vitest';
import { aeonUnavailable, type PartyChr } from '../../src/battle/ffx/kernel/aeon-party.ts';
import { expandVectorInput, loadFfxParityFixture } from './helpers/ffxParityFixture.ts';
import {
  expandPartySteps,
  expandSettleInput,
  expandSettleOutput,
  PARTY_CHR_FIELDS,
  PARTY_DEFAULTS,
  REAL_AEON_ROWS,
  runPartyVector,
  runSettleVector,
  type SettleTables,
} from './helpers/ffxAeonAdapters.ts';

const REAL_ROWS = REAL_AEON_ROWS;

// ---------------------------------------------------------------------------------------------
// The party around a summon. The worlds are written with the character bytes by name; `runPartyVector` is the same path the
// golden vectors take.
// ---------------------------------------------------------------------------------------------

type Field = (typeof PARTY_CHR_FIELDS)[number];
type Snap = {
  active: number[];
  saved: number[];
  roster: number[];
  rosterSaved: number[];
  g: Record<string, number>;
  reward: number[];
  chr: Record<string, number[]>;
};

const rowOf = (over: Partial<Record<Field, number>>): number[] => PARTY_CHR_FIELDS.map((n) => over[n] ?? PARTY_DEFAULTS[n]);
const ID17 = Array.from({ length: 17 }, (_, i) => i);

function partyWorld(active: number[], chr: Record<number, Partial<Record<Field, number>>>, over: { grand?: number; reward?: number[] } = {}): Record<string, unknown> {
  const rows: Record<string, number[]> = {};
  for (const [id, f] of Object.entries(chr)) rows[id] = rowOf(f);
  return {
    active,
    saved: [255, 255, 255, 255, 255, 255, 255],
    roster: ID17,
    rosterSaved: ID17,
    g: { summon: 0, aeon: 0, summoner: 255, grand: over.grand ?? 0, actor: 255, deadMask: 0 },
    reward: over.reward ?? new Array<number>(18).fill(0),
    chr: rows,
  };
}

const at = (s: Snap, id: number, name: Field): number => (s.chr[String(id)] as number[])[PARTY_CHR_FIELDS.indexOf(name)] as number;
const steps = (world: Record<string, unknown>, ops: Array<{ fn: string; args?: number[] }>): Snap[] => (runPartyVector({ world, ops }) as { steps: Snap[] }).steps;

/** Tidus 0, Yuna 1 and Auron 2 in the party, Valefor (8) and the three Magus Sisters (15 to 17) present. */
const PARTY_CHR: Record<number, Partial<Record<Field, number>>> = {
  0: { present: 1, dc8: 1, hp: 1000, ctb: 12, baseCtb: 42, avail: 1 },
  1: { present: 1, dc8: 1, hp: 600, ctb: 30, baseCtb: 42, avail: 1 },
  2: { present: 1, dc8: 1, hp: 1500, ctb: 7, baseCtb: 39, avail: 1 },
  8: { present: 1, hp: 725, avail: 1, recoverMax: 8, gauge: 5, gaugeMax: 20 },
  15: { present: 1, hp: 4000, avail: 1, recoverMax: 30, baseCtb: 42, gaugeMax: 20 },
  16: { present: 1, hp: 3000, avail: 1, recoverMax: 30, baseCtb: 42, gaugeMax: 20 },
  17: { present: 1, hp: 2000, avail: 1, recoverMax: 30, baseCtb: 42, gaugeMax: 20 },
};

describe('the party around a summon (0x7adf90, 0x7ade10, 0x7aef20)', () => {
  const party = [0, 1, 2, 255, 255, 255, 255];

  it('the summon only parks the party; it is the arrival step that takes the party out of the turn list and puts the aeon in', () => {
    const [afterSummon, afterArrive] = steps(partyWorld(party, PARTY_CHR), [{ fn: 'summon', args: [1, 8] }, { fn: 'arrive' }]) as [Snap, Snap];
    // After the summon command: an aeon is out (Valefor, called by Yuna) ...
    expect(afterSummon.g).toMatchObject({ summon: 1, aeon: 8, summoner: 1 });
    // ... but the in-battle bytes are the party's again (the summon ends with the same swap the arrival action begins with),
    // so for the scheduler the party is still in the fight and Valefor is not yet.
    expect([0, 1, 2].map((id) => at(afterSummon, id, 'dc8'))).toEqual([1, 1, 1]);
    expect(at(afterSummon, 8, 'dc8')).toBe(0);
    expect(afterSummon.active).toEqual([0, 1, 2, 255, 255, 255, 255]);
    expect(afterSummon.saved).toEqual([255, 8, 255, 255, 255, 255, 255]); // Valefor sits where Yuna was
    // The summoner is marked away and the party is flagged as having left the field.
    expect(at(afterSummon, 1, 'dcb')).toBe(1);
    expect(at(afterSummon, 8, 'summoner')).toBe(1);
    expect([0, 1, 2].map((id) => at(afterSummon, id, 'df8'))).toEqual([1, 1, 1]);
    // The arrival action's start swaps the two states: now Valefor is the only one in the fight.
    expect([0, 1, 2].map((id) => at(afterArrive, id, 'dc8'))).toEqual([0, 0, 0]);
    expect(at(afterArrive, 8, 'dc8')).toBe(1);
    expect(afterArrive.active).toEqual([255, 8, 255, 255, 255, 255, 255]);
    expect(afterArrive.saved).toEqual([0, 1, 2, 255, 255, 255, 255]);
    // The aeon acts next: its counter is 0; the party's counters, HP and statuses are untouched (frozen, not reset).
    expect(at(afterArrive, 8, 'ctb')).toBe(0);
    expect([0, 1, 2].map((id) => at(afterArrive, id, 'ctb'))).toEqual([12, 30, 7]);
    expect([0, 1, 2].map((id) => at(afterArrive, id, 'hp'))).toEqual([1000, 600, 1500]);
    // The party order table now names Yuna where Valefor would stand.
    expect(afterArrive.roster[8]).toBe(1);
  });

  it('the Dismiss command (dismiss with revive) brings the party back as it left: counters kept, the summoner returns as a summoner', () => {
    const all = steps(partyWorld(party, PARTY_CHR), [{ fn: 'summon', args: [1, 8] }, { fn: 'arrive' }, { fn: 'drain' }, { fn: 'dismiss', args: [1] }]);
    const last = all[3] as Snap;
    expect(last.g).toMatchObject({ summon: 0, aeon: 0, summoner: 255 });
    expect(last.active).toEqual([0, 1, 2, 255, 255, 255, 255]);
    expect(last.roster).toEqual(ID17);
    expect([0, 1, 2].map((id) => at(last, id, 'dc8'))).toEqual([1, 1, 1]);
    expect(at(last, 8, 'dc8')).toBe(0);
    expect(at(last, 1, 'dcb')).toBe(0); // Yuna is no longer away
    expect([0, 1, 2].map((id) => at(last, id, 'ctb'))).toEqual([12, 30, 7]); // nobody pays a recovery for the trip
    expect([0, 2].map((id) => at(last, id, 'arrival'))).toEqual([1, 1]); // the ones who stayed behind get the arrival animation
    expect(last.reward.slice(0, 3)).toEqual([1, 1, 1]); // everybody who comes back is counted for the rewards, the summoner included
  });

  it('the Magus Sisters arrive together: all three take list positions 0 to 2, whichever one was asked for, and each remembers the summoner', () => {
    const after = steps(partyWorld(party, PARTY_CHR), [{ fn: 'summon', args: [1, 16] }, { fn: 'arrive' }])[1] as Snap;
    expect(after.active).toEqual([15, 16, 17, 255, 255, 255, 255]);
    expect([15, 16, 17].map((id) => at(after, id, 'dc8'))).toEqual([1, 1, 1]);
    expect([15, 16, 17].map((id) => at(after, id, 'summoner'))).toEqual([1, 1, 1]);
    expect(after.g).toMatchObject({ aeon: 16, summoner: 1 });
  });

  it('Grand Summon: the aeon arrives with its gauge full and the old value is kept until it leaves', () => {
    const w = partyWorld(party, PARTY_CHR, { grand: 1 });
    const all = steps(w, [{ fn: 'summon', args: [1, 8] }, { fn: 'arrive' }, { fn: 'drain' }, { fn: 'dismiss', args: [0] }]);
    expect(at(all[1] as Snap, 8, 'gauge')).toBe(20); // the aeon's maximum
    expect(at(all[1] as Snap, 8, 'gaugeSaved')).toBe(5);
    expect(at(all[3] as Snap, 8, 'gauge')).toBe(5); // put back on the way out
    expect(at(all[3] as Snap, 8, 'gaugeHeld')).toBe(0);
  });

  it('an aeon knocked out: the wipe zeroes its HP and starts the recovery counter at the row\'s value plus one; the party comes back', () => {
    const all = steps(partyWorld(party, PARTY_CHR), [
      { fn: 'summon', args: [1, 8] },
      { fn: 'arrive' },
      { fn: 'drain' },
      { fn: 'wipe' },
      { fn: 'dismiss', args: [0] },
    ]);
    const wiped = all[3] as Snap;
    expect(at(wiped, 8, 'hp')).toBe(0);
    expect(at(wiped, 8, 'recover')).toBe(9); // Valefor's ply_rom +0x2b is 8, the counter starts one higher
    const back = all[4] as Snap;
    expect([0, 1, 2].map((id) => at(back, id, 'dc8'))).toEqual([1, 1, 1]);
    expect(at(back, 8, 'hp')).toBe(0); // dismissed without the revive: it stays down
  });

  it('dismissing the Magus Sisters with the revive brings back one who fell to 1 HP and clears her removal flags', () => {
    const chr = { ...PARTY_CHR, 17: { ...PARTY_CHR[17], hp: 0, dead: 1, dc8: 0 } };
    const all = steps(partyWorld(party, chr), [{ fn: 'summon', args: [1, 15] }, { fn: 'arrive' }, { fn: 'drain' }, { fn: 'dismiss', args: [1] }]);
    const last = all[3] as Snap;
    expect(at(last, 17, 'hp')).toBe(1);
    expect(at(last, 17, 'dead')).toBe(0);
    expect(at(last, 15, 'hp')).toBe(4000); // the others are untouched
  });

  it('whoever the leaver provoked is released, and a leaver\'s Threaten link is broken at both ends', () => {
    const chr = {
      ...PARTY_CHR,
      0: { ...PARTY_CHR[0], perm: 0x800, thrB: 20 }, // Tidus is Threatened by monster 20 ...
      20: { present: 1, dc8: 1, hp: 5000, perm: 0x400 | 0x800, provoker: 0, thrA: 0 }, // ... which he provoked, and which holds the other end
    };
    const after = steps(partyWorld(party, chr), [{ fn: 'summon', args: [1, 8] }])[0] as Snap;
    expect(at(after, 20, 'perm') & 0x400).toBe(0); // the monster Tidus provoked is free
    expect(at(after, 20, 'perm') & 0x800).toBe(0); // the Threaten bit is gone at the far end
    expect(at(after, 0, 'thrB')).toBe(255); // and the link bytes are cleared
    expect(at(after, 20, 'thrA')).toBe(255);
  });

  it('Switch (0x3002) swaps one member for another: the new one acts next and is counted for the rewards', () => {
    const chr = { ...PARTY_CHR, 3: { present: 1, hp: 800, ctb: 50, avail: 1 } };
    const after = steps(partyWorld(party, chr), [{ fn: 'swap', args: [2, 3, 0] }])[0] as Snap;
    expect(after.active).toEqual([0, 1, 3, 255, 255, 255, 255]);
    expect(at(after, 2, 'dc8')).toBe(0);
    expect(at(after, 3, 'dc8')).toBe(1);
    expect(at(after, 3, 'ctb')).toBe(0);
    expect(after.reward[3]).toBe(1);
    expect(after.roster[3]).toBe(2); // the first order-table entry that named the newcomer (place 3) now names the leaver
    expect(after.roster[2]).toBe(2); // and the leaver's own entry is not touched
  });

  it('a Switch to a character who was removed for good (fled) still takes the list place and zeroes the counter, but puts nobody into the fight', () => {
    // Checked against the machine for exactly this input (the vectors cover it as well): ctb 0, in-battle byte 0, no reward flag, no arrival.
    const chr = { ...PARTY_CHR, 3: { present: 1, hp: 400, ctb: 50, blocked: 1 } };
    const after = steps(partyWorld(party, chr), [{ fn: 'swap', args: [2, 3, 0] }])[0] as Snap;
    expect(after.active).toEqual([0, 1, 3, 255, 255, 255, 255]);
    expect(at(after, 3, 'ctb')).toBe(0);
    expect(at(after, 3, 'dc8')).toBe(0);
    expect(after.reward[3]).toBe(0);
    expect(at(after, 3, 'arrival')).toBe(0);
    expect(at(after, 2, 'dc8')).toBe(0); // the leaver is out
  });

  it('an aeon can be summoned only when it is alive, available, not removed and its recovery counter is 0', () => {
    const base = { hp: 725, avail: 1, blocked: 0, recover: 0 };
    const chr = (over: Partial<typeof base>): PartyChr => ({ ...(Object.fromEntries(PARTY_CHR_FIELDS.map((n) => [n, PARTY_DEFAULTS[n]])) as unknown as PartyChr), ...base, ...over });
    expect(aeonUnavailable(chr({}))).toBe(0);
    expect(aeonUnavailable(chr({ hp: 0 }))).toBe(1);
    expect(aeonUnavailable(chr({ avail: 0 }))).toBe(1);
    expect(aeonUnavailable(chr({ blocked: 1 }))).toBe(1);
    expect(aeonUnavailable(chr({ recover: 1 }))).toBe(1);
  });
});

// ---------------------------------------------------------------------------------------------
// The end-of-battle save
// ---------------------------------------------------------------------------------------------

describe('the end-of-battle save (0x785fc0)', () => {
  const baseChr = (over: Partial<Record<string, number>> = {}): Record<string, number> => ({
    hp: 100, mp: 10, recover: 0, weapon: 0xff, armor: 0xff, odMode: 0, odGauge: 0, odMax: 100, saveMaxHp: 1000, saveMaxMp: 100, saveHp: 0, saveMp: 0, ...over,
  });
  function settle(over: { chr?: Record<number, Partial<Record<string, number>>>; battles?: number; active?: number[]; saved?: number[]; summon?: number } = {}): ReturnType<typeof runSettleVector> {
    const chr: Record<string, Record<string, number>> = {};
    for (let id = 0; id < 0x12; id++) chr[String(id)] = baseChr(over.chr?.[id]);
    const aeons: Record<string, unknown> = {};
    for (let id = 8; id <= 0x11; id++) aeons[String(id)] = { rom: REAL_ROWS[id - 8], assure: null, bonus: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], abilities: [] };
    return runSettleVector({
      battles: over.battles ?? 0,
      yunaSave: [475, 84, 5, 5, 20, 20, 10, 17, 30, 3],
      yunaBonus: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      aeons,
      chr,
      active: over.active ?? [0, 1, 2, 255, 255, 255, 255],
      saved: over.saved ?? [255, 255, 255, 255, 255, 255, 255],
      roster: ID17,
      rosterSaved: ID17,
      summon: over.summon ?? 0,
    });
  }
  type Saved = { save: Record<string, { hp: number; mp: number; recover: number }>; aeon: Record<string, { maxHp: number; maxMp: number }>; persist: { list: number[] }; lists: { active: number[]; summon: number } };

  it('a party member at 0 HP with no recovery counter is saved with 1 HP; one with a counter keeps its 0', () => {
    const r = settle({ chr: { 0: { hp: 0 }, 1: { hp: -40 }, 3: { hp: 0, recover: 3 } } }) as unknown as Saved;
    expect(r.save['0']?.hp).toBe(1);
    expect(r.save['1']?.hp).toBe(1); // below zero counts as down too
    expect(r.save['3']?.hp).toBe(0);
    expect(r.save['3']?.recover).toBe(2); // the counter goes down by one for this battle
  });

  it('a fallen aeon\'s counter counts down once a battle; the battle that brings it to 0 restores it in full, to the REBUILT maximum', () => {
    // Valefor (8) was wiped last battle: counter 2. This battle ends: 1, still at 0 HP. Next battle's end: 0, full HP and MP.
    const first = settle({ chr: { 8: { hp: 0, recover: 2, saveMaxHp: 1000, saveMaxMp: 100 } } }) as unknown as Saved;
    expect(first.save['8']).toMatchObject({ hp: 0, recover: 1 });
    const second = settle({ chr: { 8: { hp: 0, recover: 1, saveMaxHp: 1000, saveMaxMp: 100 } } }) as unknown as Saved;
    expect(second.save['8']?.recover).toBe(0);
    // The restore writes the OLD maximum (1000, 100); the rebuild that follows lowers it to what Yuna's stats give (725, 24).
    expect(second.aeon['8']).toMatchObject({ maxHp: 725, maxMp: 24 });
    expect(second.save['8']).toMatchObject({ hp: 725, mp: 24 });
  });

  it('the party list parked by a summon comes back first, and the first three entries are what the next battle starts with', () => {
    const r = settle({ summon: 1, active: [255, 8, 255, 255, 255, 255, 255], saved: [0, 1, 2, 4, 255, 255, 255] }) as unknown as Saved;
    expect(r.lists).toEqual({ active: [0, 1, 2, 4, 255, 255, 255], summon: 0 });
    expect(r.persist.list).toEqual([0, 1, 2]);
  });
});

{
  const fx = loadFfxParityFixture('aeon_party');
  describe.skipIf(fx === null)('golden vectors: aeon_party (tests/fixtures/parity/ffx/aeon_party.json)', () => {
    it('every op of every vector leaves the lists, the globals, the reward flags and the 26 characters\' bytes as the machine left them', () => {
      let n = 0;
      let ops = 0;
      for (const v of fx?.vectors ?? []) {
        const input = expandVectorInput(fx?.defaults ?? {}, v.in);
        expect(runPartyVector(input), `vector ${v.id} (${v.class})`).toEqual(expandPartySteps(input, v.out));
        n++;
        ops += (input['ops'] as unknown[]).length;
      }
      expect(n).toBeGreaterThan(200);
      expect(ops).toBeGreaterThan(400);
    });

    it('the vectors cover every kind of transition: summon, arrival, dismissal with and without the revive, wipe, restore and the three swap modes', () => {
      const seen = new Set<string>();
      for (const v of fx?.vectors ?? []) {
        for (const op of (v.in['ops'] as Array<{ fn: string; args?: number[] }>)) {
          seen.add(op.fn === 'dismiss' ? `dismiss${op.args?.[0] ?? 0}` : op.fn === 'swap' ? `swap${op.args?.[2] ?? 0}` : op.fn);
        }
      }
      expect([...seen].sort()).toEqual(['arrive', 'dismiss0', 'dismiss1', 'drain', 'restore', 'summon', 'swap-1', 'swap0', 'swap1', 'wipe']);
    });
  });
}

{
  const fx = loadFfxParityFixture('aeon_settle');
  describe.skipIf(fx === null)('golden vectors: aeon_settle (tests/fixtures/parity/ffx/aeon_settle.json)', () => {
    it('every vector leaves the save records, the ten rebuilt aeons, the remembered party list and order and the restored lists as the machine did', () => {
      let n = 0;
      for (const v of fx?.vectors ?? []) {
        const input = expandVectorInput(fx?.defaults ?? {}, v.in);
        const tables = (fx?.defaults as { tables: SettleTables }).tables;
        expect(runSettleVector(expandSettleInput(input, tables)), `vector ${v.id} (${v.class})`).toEqual(expandSettleOutput(v.out));
        n++;
      }
      expect(n).toBeGreaterThan(60);
    });
  });
}

{
  const fx = loadFfxParityFixture('aeon_unavailable');
  describe.skipIf(fx === null)('golden vectors: aeon_unavailable (tests/fixtures/parity/ffx/aeon_unavailable.json)', () => {
    it('the summon menu\'s test answers as the machine does for alive, dead, unavailable, removed and recovering characters', () => {
      let n = 0;
      let can = 0;
      for (const v of fx?.vectors ?? []) {
        const i = v.in as { hp: number; avail: number; blocked: number; recover: number };
        const chr = Object.fromEntries(PARTY_CHR_FIELDS.map((f) => [f, PARTY_DEFAULTS[f]])) as unknown as PartyChr;
        Object.assign(chr, { hp: i.hp, avail: i.avail, blocked: i.blocked, recover: i.recover });
        const got = aeonUnavailable(chr);
        expect(got, `vector ${v.id} ${JSON.stringify(i)}`).toBe((v.out as { ret: number }).ret);
        n++;
        if (got === 0) can++;
      }
      expect(n).toBeGreaterThan(300);
      expect(can).toBeGreaterThan(50); // both answers are well represented
    });
  });
}
