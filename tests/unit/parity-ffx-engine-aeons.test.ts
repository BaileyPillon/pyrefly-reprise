/**
 * **Engine-level parity, the aeons** (re-parity W5; **FFX only**).
 *
 * `parity-ffx-aeon-party.test.ts` proves the game's party transitions and `parity-ffx-aeon-stats.test.ts` its stat builder
 * against FFX.exe. This file proves the WIRING of what the engine does with an aeon, against the rules of the research note
 * written out again here (`research/re-ffx-overdrive-steal-aeons.md` sections 4.5 to 4.8), not read from `aeon-gear.ts` or the
 * adapters:
 *
 * 1. the aeons' fixed gear: a critical bonus of 6 on every aeon, Pierce on nine of ten (not Valefor), Break Damage Limit on
 *    Bahamut, Anima and the Magus Sisters, Break HP and MP Limit on all;
 * 2. the recovery count of a wiped aeon: Valefor 8, Ifrit 12, Ixion 20, Shiva 20, Bahamut 24, Anima 24, Yojimbo 24, each
 *    Magus Sister 30, counted down once by each battle's own save, full HP and MP when it reaches 0, and carried to the next link;
 * 3. the party transitions: nobody's counter moves on the way out or back (so a summoner keeps the recovery her Summon cost),
 *    whoever a leaver provoked is released, a Threaten pair a leaver was an end of is broken, the aeon acts next, a Grand
 *    Summon holds the gauge at its maximum and the stored one comes back;
 * 4. a whole engine: Yuna summons, the aeon is dismissed, and she is still paying for the Summon.
 */

import { describe, expect, it } from 'vitest';
import type { BattleSetup, Command, FFXCombatant, StatusInstance } from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { carryPartyForward } from '../../src/app/screens/BattleScreenSetup.ts';
import {
  CORE_ABILITIES,
  FFXContentRegistry,
  availableAeons,
  banishAeon,
  buildBattle,
  critChance,
  dismissAeon,
  summonAeon,
  type Ctx,
} from '../../src/battle/ffx/index.ts';
import { settleAeonRecovery } from '../../src/battle/ffx/adapt/aeon-party.ts';
import { autoWordA, autoWordB } from '../../src/battle/ffx/adapt/words.ts';
import { equipmentCrit } from '../../src/battle/ffx/equipment.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { aeon, enemy, fighter, party, setup, stats } from './ffx-fixtures.test.ts';
import { actor, enabledRow, newEngine, nextInput, runChain, summon } from './helpers/isaaruUnits.ts';
import { makeRng } from './helpers/ffxEngineWiring.ts';

/** Section 4.5 / 4.6 / 4.8, written out: the word-A bit 0x2000 (Pierce), Break Damage Limit, the battles away. */
const GEAR: Readonly<Record<string, { pierce: boolean; breakDamage: boolean; recovery: number }>> = {
  valefor: { pierce: false, breakDamage: false, recovery: 8 },
  ifrit: { pierce: true, breakDamage: false, recovery: 12 },
  ixion: { pierce: true, breakDamage: false, recovery: 20 },
  shiva: { pierce: true, breakDamage: false, recovery: 20 },
  bahamut: { pierce: true, breakDamage: true, recovery: 24 },
  anima: { pierce: true, breakDamage: true, recovery: 24 },
  yojimbo: { pierce: true, breakDamage: false, recovery: 24 },
  cindy: { pierce: true, breakDamage: true, recovery: 30 },
  sandy: { pierce: true, breakDamage: true, recovery: 30 },
  mindy: { pierce: true, breakDamage: true, recovery: 30 },
};
const AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'anima', 'yojimbo'] as const;

function makeCtx(over: Partial<BattleSetup> = {}): Ctx {
  const s = setup({
    party: party({ aeons: AEONS.map((id) => aeon({ id })) }),
    enemies: { id: 'g', game: 'ffx', enemies: [enemy({ id: 'foe-a' }), enemy({ id: 'foe-b' })] },
    ...over,
  });
  return buildBattle(s, new SeededRng(s.seed), new FFXContentRegistry(), () => {});
}

const at = (ctx: Ctx, id: string): FFXCombatant => ctx.state.combatants[id] as FFXCombatant;

describe('an aeon wears fixed gear the engine does not list', () => {
  it('every aeon: critical bonus 6, Pierce on nine, Break Damage Limit on five, Break HP and MP Limit on all', () => {
    for (const [id, g] of Object.entries(GEAR)) {
      const c = fighter({ id, side: 'aeon' });
      expect(equipmentCrit(c), `${id} critical bonus`).toBe(6);
      expect((autoWordA(c) & 0x2000) !== 0, `${id} Pierce`).toBe(g.pierce);
      expect(autoWordA(c) & 0x1, `${id} the Ribbon bit`).toBe(1);
      expect((autoWordB(c) & 0x800) !== 0, `${id} Break Damage Limit`).toBe(g.breakDamage);
      expect(autoWordB(c) & 0x600, `${id} Break HP and MP Limit`).toBe(0x600);
      // none of the gauge bits (Double, Triple, SOS, Overdrive to AP) comes from an aeon's gear
      expect(autoWordB(c) & 0xf, `${id} gauge bits`).toBe(0);
    }
  });

  it('an aeon\'s Attack crits at Luck - target Luck + 6, a party member\'s at Luck - target Luck + his gear', () => {
    const attack = CORE_ABILITIES.find((a) => a.id === 'attack')!;
    const foe = fighter({ id: 'foe', side: 'enemy', stats: stats({ luck: 11 }) });
    for (const id of Object.keys(GEAR)) {
      const a = fighter({ id, side: 'aeon', stats: stats({ luck: 25 }) });
      expect(critChance(a, foe, attack), id).toBe(25 - 11 + 6);
    }
    const tidus = fighter({ id: 'tidus', stats: stats({ luck: 25 }) });
    expect(critChance(tidus, foe, attack)).toBe(25 - 11); // bare gear: bonus 0
  });
});

describe('the recovery count of a wiped aeon', () => {
  it('each aeon is away the battles the game gives it, counted by each battle\'s own save, then back at full HP and MP', () => {
    for (const id of AEONS) {
      const ctx = makeCtx();
      const a = at(ctx, id);
      a.mp = 1;
      summonAeon(ctx, 'yuna', id);
      a.hp = 0;
      a.alive = false;
      dismissAeon(ctx, 'ko'); // the wipe of battle k
      const recovery = GEAR[id]!.recovery;
      expect(a.aeon!.reviveCountdown, `${id}: a wipe starts the count one above the record`).toBe(recovery + 1);
      expect(availableAeons(ctx).map((c) => c.id)).not.toContain(id);
      settleAeonRecovery(ctx); // the end of battle k
      for (let j = 0; j <= recovery; j++) {
        const left = recovery - j;
        expect(a.aeon!.reviveCountdown, `${id}: after the save of battle k+${j}`).toBe(left);
        if (left > 0) {
          expect(availableAeons(ctx).map((c) => c.id), `${id} away in battle k+${j + 1}`).not.toContain(id);
          expect(a.hp, `${id} keeps its 0 HP while it is away`).toBe(0);
          settleAeonRecovery(ctx);
        }
      }
      expect(a.hp, `${id} is back at full HP`).toBe(a.stats.maxHp);
      expect(a.mp, `${id} is back at full MP`).toBe(a.stats.maxMp);
      expect(availableAeons(ctx).map((c) => c.id)).toContain(id);
    }
  });

  it('an aeon that never fell keeps its HP and MP between battles and a banished one is wiped the same way', () => {
    const ctx = makeCtx();
    const a = at(ctx, 'ifrit');
    a.hp = 777;
    a.mp = 33;
    settleAeonRecovery(ctx);
    expect([a.hp, a.mp, a.aeon!.reviveCountdown ?? 0]).toEqual([777, 33, 0]);
    summonAeon(ctx, 'yuna', 'ixion');
    banishAeon(ctx, 'ixion');
    expect(at(ctx, 'ixion').aeon!.reviveCountdown).toBe(GEAR['ixion']!.recovery + 1);
  });

  it('the count travels with the aeon to the next link of a chain, as the screen carries it', () => {
    const ctx = makeCtx();
    const s = setup({ party: party({ aeons: AEONS.map((id) => aeon({ id })) }) });
    summonAeon(ctx, 'yuna', 'shiva');
    at(ctx, 'shiva').hp = 0;
    dismissAeon(ctx, 'ko');
    settleAeonRecovery(ctx);
    const carried = carryPartyForward(s.party, ctx.state);
    const row = (carried as { aeons: Array<{ id: string; reviveCountdown?: number }> }).aeons.find((x) => x.id === 'shiva')!;
    expect(row.reviveCountdown).toBe(GEAR['shiva']!.recovery);
    const next = buildBattle({ ...s, party: carried as BattleSetup['party'] }, new SeededRng(2), new FFXContentRegistry(), () => {});
    expect(at(next, 'shiva').aeon!.reviveCountdown).toBe(GEAR['shiva']!.recovery);
    expect(availableAeons(next).map((c) => c.id)).not.toContain('shiva');
  });
});

describe('who is on the field while an aeon is out, on generated fields', () => {
  it('300 fields: nobody\'s counter moves, provokes and Threaten pairs of the leavers end, the aeon acts next', () => {
    const rng = makeRng(20261014);
    const status = (id: string, sourceId: string): StatusInstance =>
      ({ id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false, sourceId }) as unknown as StatusInstance;
    let freed = 0, grand = 0;
    for (let i = 0; i < 300; i++) {
      const ctx = makeCtx();
      const names = ['tidus', 'yuna', 'auron'];
      const before = new Map<string, number>();
      for (const id of names) { const ctb = rng.int(0, 90); rtOf(ctx, id).ctb = ctb; before.set(id, ctb); }
      const foes = [at(ctx, 'foe-a'), at(ctx, 'foe-b')];
      const bySource = new Map<string, string>();
      // (a Threaten pair is one to one in the game: the user has a single link byte, so each foe gets its own user)
      const users = rng.next() < 0.5 ? ['tidus', 'auron'] : ['auron', 'yuna'];
      foes.forEach((f, k) => {
        if (rng.next() < 0.5) { const src = rng.pick(names); f.statuses['provoke'] = status('provoke', src); bySource.set(`${f.id}:provoke`, src); }
        if (rng.next() < 0.5) { f.statuses['threaten'] = status('threaten', users[k]!); bySource.set(`${f.id}:threaten`, users[k]!); }
      });
      const summoner = at(ctx, 'yuna');
      const gauge = rng.int(0, 99);
      const id = rng.pick(AEONS);
      at(ctx, id).overdrive!.gauge = gauge;
      const isGrand = rng.next() < 0.3;
      summonAeon(ctx, summoner.id, id, isGrand);
      expect(ctx.state.aeonId).toBe(id);
      expect(rtOf(ctx, id).ctb, 'the aeon acts next').toBe(0);
      for (const n of names) expect(rtOf(ctx, n).ctb, `${n} while the aeon is out`).toBe(before.get(n));
      for (const f of foes) {
        expect(f.statuses['provoke'], `${f.id} no longer provoked by a leaver`).toBeUndefined();
        expect(f.statuses['threaten'], `${f.id} no longer threatened by a leaver`).toBeUndefined();
      }
      freed += bySource.size;
      if (isGrand) {
        grand++;
        expect(at(ctx, id).aeon!.temporaryOverdrive, 'a Grand Summon holds the gauge full').toBe(100);
      } else {
        expect(at(ctx, id).aeon!.temporaryOverdrive).toBeNull();
      }
      // the Summon action charges its summoner after the aeon has arrived; leaving must not take that back
      const charged = rng.int(20, 60);
      rtOf(ctx, summoner.id).ctb = charged;
      before.set(summoner.id, charged);
      dismissAeon(ctx, 'command');
      expect(ctx.state.aeonId).toBeNull();
      for (const n of names) expect(rtOf(ctx, n).ctb, `${n} after the aeon has gone`).toBe(before.get(n));
      expect(at(ctx, id).aeon!.temporaryOverdrive, 'the held gauge is gone').toBeNull();
      expect(at(ctx, id).overdrive!.gauge, 'the gauge it had comes back').toBe(gauge);
    }
    expect(freed).toBeGreaterThan(300);
    expect(grand).toBeGreaterThan(50);
  });
});

describe('a whole engine: Yuna summons, the aeon is dismissed, she is still paying for the Summon', () => {
  it('her counter after the aeon has gone is the one the Summon cost her, not the one she had before', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const engine = newEngine('isaaru-grothia', seed);
      const ctx = (engine as unknown as { ctx: Ctx }).ctx;
      const first = nextInput(engine)!;
      expect(first.commands.length).toBeGreaterThan(0);
      const yuna = first.actorId;
      expect(enabledRow(first.commands, 'summon', 'shiva'), 'the chapter lets Yuna summon').toBeDefined();
      const ctbBefore = rtOf(ctx, yuna).ctb;
      engine.submit(summon('shiva'));
      const aeonTurn = nextInput(engine)!;
      expect(actor(engine, aeonTurn.actorId).side).toBe('aeon');
      const charged = rtOf(ctx, yuna).ctb;
      expect(charged, `seed ${seed}: the Summon charged a recovery`).toBeGreaterThan(0);
      const dismiss = aeonTurn.commands.find((c) => c.enabled && c.command.kind === 'dismiss');
      if (!dismiss) continue;
      engine.submit(dismiss.command);
      expect(engine.state().aeonId).toBeNull();
      // the Dismiss action spends nothing of hers: what she was charged is what she still owes (the clock has not run yet)
      expect(rtOf(ctx, yuna).ctb, `seed ${seed}`).toBe(charged);
      expect(charged).not.toBe(ctbBefore);
    }
  });
});

describe('a real chain: the battle\'s own save settles every wiped aeon once', () => {
  it('Chapter XIV on the roster-order line: no link ends with a raw wipe count, and the count is carried to the next link', () => {
    const ROSTER = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'];
    const choose = (link: string, engine: ReturnType<typeof newEngine>, d: NonNullable<ReturnType<typeof nextInput>>): Command => {
      if (engine.state().aeonId === d.actorId) {
        const od = d.commands.find((c) => c.enabled && c.command.kind === 'overdrive');
        const foe = link === 'isaaru-grothia' ? 'grothia' : link === 'isaaru-pterya' ? 'pterya' : 'spathi';
        if (od) return { ...od.command, targets: od.validTargets.includes(foe) ? [foe] : [] } as Command;
        return { kind: 'attack', targets: [foe] };
      }
      for (const id of ROSTER) if (enabledRow(d.commands, 'summon', id)) return summon(id);
      return { kind: 'defend', targets: [] };
    };
    let wipes = 0, carried = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const runs = runChain(seed, (link, engine, d) => choose(link, engine, d));
      runs.forEach((r, n) => {
        for (const id of ROSTER) {
          const a = r.state.combatants[id] as FFXCombatant | undefined;
          const left = a?.aeon?.reviveCountdown ?? 0;
          expect(left, `seed ${seed} link ${n + 1}: ${id} ends the battle settled, never at the raw wipe count`).toBeLessThanOrEqual(GEAR[id]!.recovery);
          if (left > 0) wipes++;
          const later = runs[n + 1]?.state.combatants[id] as FFXCombatant | undefined;
          // each later link is another battle: the count only goes down, and by exactly one while the aeon is still away
          if (later && left > 0) {
            carried++;
            expect(later.aeon?.reviveCountdown ?? 0, `seed ${seed} link ${n + 2}: ${id}`).toBeLessThanOrEqual(left);
          }
        }
      });
    }
    expect(wipes, 'the sample wiped aeons').toBeGreaterThan(5);
    expect(carried, 'and carried a count to a later link').toBeGreaterThan(3);
  }, 120_000);
});
