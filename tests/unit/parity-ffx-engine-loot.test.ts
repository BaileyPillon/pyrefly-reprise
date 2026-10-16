/**
 * **Engine-level parity, kill rewards** (re-parity RC9, lane FFX-M; **FFX only**).
 *
 * `parity-ffx-steal-rewards.test.ts` proves the game's kill-rewards routine (`kernel/drops.ts`, FFX.exe 0x007990d0) against FFX.exe on captured vectors. This file proves the WIRING: that a monster's
 * death in the engine (`hp.ts#koActor`, `ejectActor`) pays through `adapt/loot.ts#payKill` exactly what the routine pays on the situation the engine is in. The oracle
 * (`helpers/ffxLootOracle.ts`) restates the routine from the private notes `FFX-H02` 3.5 and `FFX-G10` 3.4 and imports nothing from `kernel/` or `adapt/`; it reads only the facts of
 * the run (the monster's record, the 18 slots' states, the overkill and Distill facts) and the draws the generator really made, each with its stream, and it fails on a draw
 * on the wrong stream, one too many, or one too few.
 *
 * 1. **1,040 generated deaths** (500 fields, one to three monsters each, real records and random ones, parties with Double, Triple and No AP and Gillionaire, KO'd, ejected and benched
 *    members, an aeon out, overkills, Distill bits, a bribed monster): the gil, each slot's AP, the item stacks, the base AP, the gear roll and every draw equal the oracle's.
 * 2. **The draws**: a monster pays on streams 10 and 11 only (three on 10 and one on 11 for a record with one live slot); a bribed monster on the killer's mode-0 stream, then 10; never 12 or 13.
 * 3. **The paths**: a KO pays, an Eject (a shatter) pays once, a banish pays nothing, a dead body that is ejected afterwards pays nothing more, a party member's death pays nothing.
 * 4. **A hand-built enemy with no record** is turned into one the way `adapt/loot.ts` says and paid by the same roll.
 * 5. **A dry run does not pay the battle's ledger.**
 */

import { describe, expect, it } from 'vitest';
import type { AutoAbilityId, FFXCombatant, FfxLootRecord } from '../../src/battle/common/types.ts';
import { itemIdOf, memberTotals, payKill } from '../../src/battle/ffx/adapt/loot.ts';
import { ejectActor, koActor } from '../../src/battle/ffx/hp.ts';
import { cloneCtx } from '../../src/battle/ffx/intent.ts';
import { FFX_LOOT_RECORDS } from '../../src/data/ffx/loot/index.ts';
import {
  AEON_IDS, PARTY_IDS, addVictim, buildField, emptyLedger, lcg, oracleKill, slotOfId, takeDraws,
  type Field, type Kill, type LedgerFacts, type SlotSpec,
} from './helpers/ffxLootOracle.ts';

// ------------------------------------------------------------------------------------------------------------------- generated situations

const AUTOS: AutoAbilityId[] = ['double-ap', 'triple-ap', 'no-ap', 'gillionaire'];
const ITEM_NUMBERS = [0, 0x2000, 0x2001, 0x2002, 0x2046, 0x2047, 0x2048, 0x2049, 0x204c, 0x204f, 0x2051, 0x2053, 0x2054, 0x2060, 0x2061];

function randomRecord(r: ReturnType<typeof lcg>, file: number): FfxLootRecord {
  const byte = (): number => r.pick([0, 0, 1, 30, 128, 254, 255, 255, r.int(0, 255)]);
  const quad = <T,>(f: () => T): [T, T, T, T] => [f(), f(), f(), f()];
  const items = quad(() => r.pick(ITEM_NUMBERS));
  const qty = quad(() => r.pick([0, 1, 1, 2, 4, 50, 99]));
  return {
    file, source: `generated ${file}`,
    gil: r.pick([0, 50, 6000, 99999, 65535]), ap: r.pick([0, 37, 10000, 65535]), apOverkill: r.pick([0, 55, 15000, 65535]),
    chance: [byte(), byte()], gearChance: r.pick([0, 12, 128, 255]),
    items, qty, overkillItems: quad(() => r.pick(ITEM_NUMBERS)), overkillQty: quad(() => r.pick([0, 1, 2, 8, 99])),
    bribeItem: r.pick([0x2000, 0x2004, 0x2065]), bribeFactor: r.pick([1, 10, 255]),
  };
}

function randomField(r: ReturnType<typeof lcg>): Field {
  const aeonOut = r.chance(0.2);
  const outAeon = r.pick(AEON_IDS);
  const members = PARTY_IDS.filter((id) => (id === 'tidus' ? true : id === 'seymour' ? r.chance(0.15) : r.chance(0.92)));
  const active = new Set(members.slice(0, 3));
  const slots: SlotSpec[] = [];
  for (const id of [...PARTY_IDS, ...AEON_IDS]) {
    const isAeon = (AEON_IDS as readonly string[]).includes(id);
    const exists = isAeon ? id === outAeon || r.chance(0.3) : members.includes(id as (typeof PARTY_IDS)[number]);
    const autos = AUTOS.filter(() => r.chance(0.12));
    const ejected = exists && r.chance(0.04);
    const inBattle = exists && !ejected && (isAeon ? aeonOut && id === outAeon : !aeonOut && active.has(id as never));
    slots.push({ id, exists, inBattle, dead: exists && r.chance(0.18), ejected, autos: isAeon ? [] : autos });
  }
  // the slot array is the game's: party 0 to 7, then the aeons 8 to 0x11
  slots.sort((a, b) => slotOfId(a.id) - slotOfId(b.id));
  return { slots, aeonOut: aeonOut && slots.some((s) => s.id === outAeon && s.exists && s.inBattle) };
}

function randomKill(r: ReturnType<typeof lcg>, field: Field, i: number): Kill {
  const files = Object.keys(FFX_LOOT_RECORDS).map(Number);
  const rec = r.chance(0.5) ? (FFX_LOOT_RECORDS[r.pick(files)] as FfxLootRecord) : randomRecord(r, 900 + i);
  const killers = field.slots.filter((s) => s.exists && !(AEON_IDS as readonly string[]).includes(s.id)).map((s) => s.id);
  return {
    rec,
    overkill: r.chance(0.35),
    distill: r.pick([0, 0, 0, 0x2, 0x4, 0x8, 0x20, 0x10, 0x30]),
    bribed: r.chance(0.12) ? r.pick([1, 4, 100, 2500, 99999, 1_000_000]) : undefined,
    killerId: killers.length > 0 ? r.pick(killers) : 'tidus',
  };
}

/** The ledger the engine holds, in the oracle's terms. */
function engineFacts(rig: ReturnType<typeof buildField>): LedgerFacts {
  const l = rig.ctx.rt.rewards!;
  return { gil: l.list.gil, ap: [...l.list.ap], items: l.list.items.map((s) => ({ ...s })) };
}

describe('1,040 generated deaths (500 fields) pay what the routine pays on the situation they are in', () => {
  it('the gil, every slot\'s AP, the item stacks, the base AP, the gear roll and every draw equal the oracle\'s', () => {
    const r = lcg(20261015);
    const seen = { kills: 0, rare: 0, distill: 0, bribed: 0, overkill: 0, gillionaire: 0, tripled: 0, gear: 0, capped: 0, twoSlots: 0, aeon: 0, ejectedSlot: 0 };
    for (let n = 0; n < 500; n++) {
      const field = randomField(r);
      const rig = buildField(field, 1000 + n);
      let before = emptyLedger();
      let baseAp = 0;
      let gearRolls = 0;
      let gearDrops = 0;
      const kills = r.int(1, 3);
      for (let i = 0; i < kills; i++) {
        const kill = randomKill(r, field, n * 3 + i);
        const victim = addVictim(rig, `boss${i}`, kill);
        const killer = rig.ctx.state.combatants[kill.killerId] ?? undefined;
        takeDraws(rig);
        payKill(rig.ctx, victim, killer as never);
        const draws = takeDraws(rig);
        const want = oracleKill(field, kill, before, draws);
        const got = engineFacts(rig);
        const where = `field ${n} kill ${i} (m${kill.rec.file})`;
        expect(got.gil, `${where} gil`).toBe(want.gil);
        expect(got.ap, `${where} ap`).toEqual(want.ap);
        expect(got.items, `${where} items`).toEqual(want.items);
        baseAp += want.baseAp;
        gearRolls += 1;
        if (want.gearWouldDrop) gearDrops += 1;
        const ledger = rig.ctx.rt.rewards!;
        expect(ledger.baseAp, `${where} baseAp`).toBe(baseAp);
        expect(ledger.kills, `${where} kills`).toBe(i + 1);
        expect(ledger.gearRolls, `${where} gearRolls`).toBe(gearRolls);
        expect(ledger.gearDrops, `${where} gearDrops`).toBe(gearDrops);
        expect(ledger.list.gear, `${where}: no gear piece is made`).toEqual([]);
        expect(draws.some((d) => d.stream === 12 || d.stream === 13), `${where}: nothing draws the gear streams`).toBe(false);
        before = got;
        seen.kills += 1;
        if (kill.bribed !== undefined) seen.bribed += 1;
        else if (draws.some((d) => d.stream === 11)) seen.rare += 1;
        if (kill.overkill) seen.overkill += 1;
        if (kill.distill !== 0) seen.distill += 1;
        if (want.gearWouldDrop) seen.gear += 1;
        if (field.slots.some((s) => s.autos.includes('gillionaire') && s.inBattle && !s.dead && s.exists && !s.ejected)) seen.gillionaire += 1;
        if (field.slots.some((s) => s.autos.includes('triple-ap') && s.inBattle && !s.dead && s.exists && !s.ejected)) seen.tripled += 1;
        if (got.gil >= 999_999_999 || got.items.some((s) => s.qty === 99)) seen.capped += 1;
        if (kill.rec.chance[0] > 0 && kill.rec.chance[1] > 0) seen.twoSlots += 1;
        if (field.aeonOut) seen.aeon += 1;
        if (field.slots.some((s) => s.ejected)) seen.ejectedSlot += 1;
      }
    }
    // every branch was visited (the generator is seeded, so this is a property of the file, not luck)
    for (const [k, v] of Object.entries(seen)) expect(v, `the generator never reached ${k}`).toBeGreaterThan(5);
  });

  it('each slot\'s total is read back by member (the id-to-slot map of the engine is the game\'s), and a member the game has no slot for still earns', () => {
    const r = lcg(77);
    const field = randomField(r);
    const rig = buildField(field, 5);
    const kill: Kill = { rec: FFX_LOOT_RECORDS[142] as FfxLootRecord, overkill: false, distill: 0, bribed: undefined, killerId: 'tidus' };
    payKill(rig.ctx, addVictim(rig, 'boss', kill));
    const totals = memberTotals(rig.ctx);
    for (const s of field.slots) if (s.exists) expect(totals.get(s.id), s.id).toBe(rig.ctx.rt.rewards!.list.ap[slotOfId(s.id)]);
    // a rig's member 'p1', which has no game slot, takes a free one and earns the plain AP
    const odd = buildField({ slots: [{ id: 'tidus', exists: true, inBattle: true, dead: false, ejected: false, autos: [] }], aeonOut: false }, 6);
    const p1 = odd.ctx.state.combatants['tidus']!;
    odd.ctx.state.combatants['p1'] = { ...p1, id: 'p1', name: 'p1' };
    odd.ctx.state.activeIds.push('p1');
    payKill(odd.ctx, addVictim(odd, 'boss', kill));
    expect(memberTotals(odd.ctx).get('p1')).toBe(10000);
    expect(memberTotals(odd.ctx).get('tidus')).toBe(10000);
  });
});

describe('the draws: streams 10 and 11 for a monster, the killer\'s own stream for a bribed one', () => {
  const ALL_ON: Field = { slots: PARTY_IDS.map((id, k) => ({ id, exists: id !== 'seymour', inBattle: k < 3, dead: false, ejected: false, autos: [] })), aeonOut: false };
  const rec = (over: Partial<FfxLootRecord>): FfxLootRecord => ({ ...(FFX_LOOT_RECORDS[142] as FfxLootRecord), ...over });

  it('a record with one live slot draws 10, 11, 10, 10; with two live slots 10, 11, 10, 11, 10; with none 10, 10, 10', () => {
    const cases: Array<[Partial<FfxLootRecord>, number[]]> = [
      [{ chance: [255, 0] }, [10, 11, 10, 10]],
      [{ chance: [255, 255] }, [10, 11, 10, 11, 10]],
      [{ chance: [0, 0] }, [10, 10, 10]],
      [{ chance: [0, 255] }, [10, 10, 11, 10]],
    ];
    for (const [over, streams] of cases) {
      const rig = buildField(ALL_ON, 3);
      payKill(rig.ctx, addVictim(rig, 'boss', { rec: rec(over), overkill: false, distill: 0, bribed: undefined, killerId: 'tidus' }));
      expect(takeDraws(rig).map((d) => d.stream), JSON.stringify(over)).toEqual(streams);
    }
  });

  it('a bribed monster draws twice on its killer\'s mode-0 stream (party slot + 20, an aeon 27) and then the gear roll on 10, and pays no gil', () => {
    for (const killer of ['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku']) {
      const rig = buildField({ ...ALL_ON, slots: ALL_ON.slots.map((s) => ({ ...s, exists: s.id !== 'seymour' })) }, 9);
      const victim = addVictim(rig, 'boss', { rec: rec({ bribeItem: 0x2000, bribeFactor: 10 }), overkill: false, distill: 0, bribed: 2500, killerId: killer });
      payKill(rig.ctx, victim, rig.ctx.state.combatants[killer] as never);
      expect(takeDraws(rig).map((d) => d.stream), killer).toEqual([slotOfId(killer) + 20, slotOfId(killer) + 20, 10]);
      expect(rig.ctx.rt.rewards!.list.gil).toBe(0);
      expect(rig.ctx.rt.rewards!.list.items.length).toBe(1);
      expect(itemIdOf(rig.ctx.rt.rewards!, rig.ctx.rt.rewards!.list.items[0]!.id)).toBe('potion');
    }
  });

  it('nothing draws the gear streams 12 and 13, and the gear list stays empty even when the roll hits', () => {
    const rig = buildField(ALL_ON, 11);
    for (let i = 0; i < 40; i++) payKill(rig.ctx, addVictim(rig, `boss${i}`, { rec: rec({ gearChance: 255 }), overkill: false, distill: 0, bribed: undefined, killerId: 'tidus' }));
    const l = rig.ctx.rt.rewards!;
    expect(l.gearDrops).toBe(40);
    expect(l.list.gear).toEqual([]);
    expect(takeDraws(rig).filter((d) => d.stream === 12 || d.stream === 13)).toEqual([]);
  });
});

describe('the paths: a KO, an Eject, a banish, a corpse, a party member', () => {
  const FIELD: Field = { slots: PARTY_IDS.map((id, k) => ({ id, exists: id !== 'seymour', inBattle: k < 3, dead: false, ejected: false, autos: [] })), aeonOut: false };
  const kill = (file: number): Kill => ({ rec: FFX_LOOT_RECORDS[file] as FfxLootRecord, overkill: false, distill: 0, bribed: undefined, killerId: 'tidus' });

  /** A living monster in the field, waiting to die. */
  function alive(file: number) {
    const rig = buildField(FIELD, 21);
    const victim = addVictim(rig, 'boss', kill(file));
    victim.alive = true;
    victim.hp = 1;
    takeDraws(rig);
    return { rig, victim };
  }

  it('a KO pays once, at the death, with the KO event already out', () => {
    const { rig, victim } = alive(141);
    koActor(rig.ctx, victim, 'tidus');
    expect(rig.ctx.rt.rewards!.kills).toBe(1);
    expect(rig.ctx.rt.rewards!.list.gil).toBe(300);
    expect(rig.ctx.rt.rewards!.baseAp).toBe(290);
    expect(takeDraws(rig).map((d) => d.stream)).toEqual([10, 11, 10, 10]);
    expect(rig.ctx.state.log.some((e) => e.type === 'ko')).toBe(true);
  });

  it('an Eject (a shatter) pays once, as the death check\'s kind 2 does, and a body ejected after it died pays nothing more', () => {
    const { rig, victim } = alive(141);
    ejectActor(rig.ctx, victim, 'shatter', true);
    expect(rig.ctx.rt.rewards!.kills).toBe(1);
    expect(rig.ctx.rt.rewards!.list.gil).toBe(300);
    ejectActor(rig.ctx, victim, 'eject', true);
    expect(rig.ctx.rt.rewards!.kills).toBe(1);
    const dead = alive(141);
    koActor(dead.rig.ctx, dead.victim, 'tidus');
    ejectActor(dead.rig.ctx, dead.victim, 'shatter', true);
    expect(dead.rig.ctx.rt.rewards!.kills).toBe(1);
  });

  it('a banish pays nothing (it takes a party aeon off the field), and a party member\'s death pays nothing', () => {
    const { rig, victim } = alive(141);
    ejectActor(rig.ctx, victim, 'banish', true);
    expect(rig.ctx.rt.rewards).toBeUndefined();
    const member = rig.ctx.state.combatants['yuna'] as FFXCombatant;
    koActor(rig.ctx, member, 'boss');
    expect(rig.ctx.rt.rewards).toBeUndefined();
    expect(takeDraws(rig)).toEqual([]);
  });

  it('a part that comes back and falls again pays at each death (Sinspawn Gui\'s arm: 37 AP and 300 gil a time, never an item)', () => {
    const rig = buildField(FIELD, 31);
    const arm: Kill = { rec: { ...(FFX_LOOT_RECORDS[161] as FfxLootRecord), chance: [0, 0], gearChance: 0 }, overkill: false, distill: 0, bribed: undefined, killerId: 'tidus' };
    const victim = addVictim(rig, 'arm', arm);
    for (let life = 1; life <= 3; life++) {
      victim.alive = true;
      victim.hp = 1;
      koActor(rig.ctx, victim, 'tidus');
      expect(rig.ctx.rt.rewards!.baseAp, `after death ${life}`).toBe(37 * life);
      expect(rig.ctx.rt.rewards!.list.gil, `after death ${life}`).toBe(300 * life);
    }
    expect(rig.ctx.rt.rewards!.list.items).toEqual([]);
  });
});

describe('a hand-built enemy with no record is turned into one and paid by the same roll', () => {
  const FIELD: Field = { slots: PARTY_IDS.map((id, k) => ({ id, exists: id !== 'seymour', inBattle: k < 3, dead: false, ejected: false, autos: [] })), aeonOut: false };

  it('a guaranteed entry is chance byte 255, a percent its share of 255, the overkill list the same items at double the quantity, an id the game has no number for is carried', () => {
    const rig = buildField(FIELD, 41);
    const victim = addVictim(rig, 'boss', { rec: FFX_LOOT_RECORDS[142] as FfxLootRecord, overkill: true, distill: 0, bribed: undefined, killerId: 'tidus' }, {
      rewards: { ap: 100, apOverkill: 150, gil: 70, overkillThreshold: 10, drops: [{ itemId: 'ability-sphere', count: 2 }, { itemId: 'rig-only-item', count: 3, chance: 100 }] },
    } as never);
    expect(victim.enemy!.rewards.loot, 'the monster has no record: only its rewards fields').toBeUndefined();
    payKill(rig.ctx, victim);
    const ledger = rig.ctx.rt.rewards!;
    expect(ledger.list.gil).toBe(70);
    expect(ledger.baseAp).toBe(150); // an overkill reads the overkill column
    const names = ledger.list.items.map((s) => [itemIdOf(ledger, s.id), s.qty]);
    expect(names).toEqual([['ability-sphere', 4], ['rig-only-item', 6]]);
    expect(ledger.foreign).toEqual(['rig-only-item']);
  });
});

describe('a dry run does not pay the battle\'s ledger', () => {
  it('cloneCtx copies the ledger, so a clone that kills a monster leaves the battle\'s reward struct as it was', () => {
    const FIELD: Field = { slots: PARTY_IDS.map((id, k) => ({ id, exists: id !== 'seymour', inBattle: k < 3, dead: false, ejected: false, autos: [] })), aeonOut: false };
    const rig = buildField(FIELD, 51);
    const kill: Kill = { rec: FFX_LOOT_RECORDS[124] as FfxLootRecord, overkill: false, distill: 0, bribed: undefined, killerId: 'tidus' };
    payKill(rig.ctx, addVictim(rig, 'first', kill));
    const snapshot = JSON.stringify(rig.ctx.rt.rewards);
    const { ctx: clone } = cloneCtx(rig.ctx);
    const second = addVictim({ ...rig, ctx: clone }, 'second', kill);
    payKill(clone, second);
    expect(clone.rt.rewards!.kills).toBe(2);
    expect(JSON.stringify(rig.ctx.rt.rewards)).toBe(snapshot);
  });
});
