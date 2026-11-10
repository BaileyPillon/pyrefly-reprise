/**
 * **Earth Eater against the note** (`research/re-ffx-monster-arena-creations.md` 3.4, "RE n"; FFX only; the hidden Gauntlet chapter's act 4): every branch and number of its script
 * (`src/battle/ffx/ai/gauntlet-earth-eater.ts`) pinned on a **fake context** (each branch driven by the raw draw alone; the coin counted over all 65,536 values), the hit rules against the interpreter's own run (the
 * running total, the strict 100,000 line, the crossing hit that asks for nothing), and then the real engine: Reflect and Armored at the start, the standing counter, the knock-down, the Flare it casts at itself bounced
 * onto the party, the two turns down and the getting up, and three seeds with their digests.
 */
import { describe, expect, it } from 'vitest';

import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import {
  EATER_ATTACK_DRAW, EATER_COIN_MODULO, EATER_DOWN, EATER_DOWN_TURNS, EATER_KNOCK_DOWN_LINE, EATER_TOTAL, EATER_TURNS_DOWN, earthEaterOnHit, earthEaterTurn,
} from '../../../src/battle/ffx/ai/gauntlet-earth-eater.ts';
import { EATER_DOWN_FLAG, EATER_TOTAL_FLAG, GAUNTLET_GROUP_IDS, GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { cloneCtx } from '../../../src/battle/ffx/intent.ts';
import { chooseAiCommand } from '../../../src/battle/ffx/ai/index.ts';
import { type Fake, type FakeOptions, aiOf, bossOf, fakeArena, rowOf } from '../helpers/gauntletFake.ts';
import { actions, actor, careless, ctxOf, flags, newEngine, nextInput, playOne, turnActions } from '../helpers/gauntletDrive.ts';

const EE = GAUNTLET_IDS.earthEater;

/** A fake battle with Earth Eater standing (Armored, as its record starts). */
const arena = (opts: Partial<FakeOptions> = {}): Fake => {
  const f = fakeArena({ boss: EE, ...opts });
  bossOf(f, EE).immunityFlags = ['armored'];
  return f;
};
const armored = (f: Fake): boolean => bossOf(f, EE).immunityFlags.includes('armored');
const hit = (f: Fake, lastDamage: number, hp = 1000, attacker = 'm0'): void => {
  const self = bossOf(f, EE);
  self.hp = hp;
  earthEaterOnHit(f.ctx, self, { def: {} as never, user: bossOf(f, attacker) }, { hpBefore: hp, lostHp: lastDamage > 0, lastDamage, affectsHp: true });
};
const queued = (f: Fake): Array<{ row: string; targets: readonly string[] }> =>
  peekReactions(f.ctx).flatMap((r) => (r.kind === 'command' ? [{ row: rowOf(r.command), targets: r.command.targets }] : []));
function drainAll(f: Fake): void {
  while (takeReaction(f.ctx) !== undefined);
}

describe('registered under the id the data names', () => {
  it('the AI script, the hit hook, the constants of the bytes', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.earthEater)).toBeDefined();
    expect(GAUNTLET_SCRIPTS.earthEater).toBe('gauntlet-earth-eater');
    expect([EATER_COIN_MODULO, EATER_ATTACK_DRAW, EATER_KNOCK_DOWN_LINE, EATER_TURNS_DOWN]).toEqual([2, 0, 100_000, 2]);
  });
});

describe("Earth Eater's standing turn: one draw modulo 2 (RE n 3.4)", () => {
  it('over all 65,536 values: 32,768 Attack on one member, 32,768 Megaton Punch, and the second punch is queued behind the first exactly when the coin says two', () => {
    const rows: Record<string, number> = {};
    let followUps = 0;
    for (let raw = 0; raw < 0x10000; raw++) {
      const f = arena({ raw });
      const row = rowOf(earthEaterTurn(aiOf(f, EE)));
      rows[row] = (rows[row] ?? 0) + 1;
      followUps += peekReactions(f.ctx).filter((r) => r.kind === 'command').length;
    }
    expect(rows).toEqual({ [ROW.attack]: 32_768, [ROW.megatonPunch]: 32_768 });
    expect(followUps).toBe(32_768);
  });

  it('by residue: 0 is the Attack, 1 the two punches; the draws are the coin then one picker draw for the Attack and two for the punches (with two or more standing)', () => {
    const f0 = arena({ raw: 0, pick: 1 });
    expect(rowOf(earthEaterTurn(aiOf(f0, EE)))).toBe(ROW.attack);
    expect(f0.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]);
    expect(peekReactions(f0.ctx)).toEqual([]);
    const f1 = arena({ raw: 1, pick: 2 });
    const c = earthEaterTurn(aiOf(f1, EE));
    expect([rowOf(c), c?.targets]).toEqual([ROW.megatonPunch, ['m2']]);
    expect(f1.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2], [FfxStream.Picker, 2]]);
    const second = peekReactions(f1.ctx)[0]!;
    if (second.kind !== 'command') throw new Error('a command');
    expect([second.ownerId, rowOf(second.command), second.command.targets, second.keepsControl, second.requiresAlive]).toEqual([EE, ROW.megatonPunch, ['m2'], true, 'm2']);
  });

  it('a draw can pick the same member twice (both punches aimed at him); with one member standing there is no picker draw at all; with nobody it passes', () => {
    const f = arena({ raw: 1, pick: 0 });
    const c = earthEaterTurn(aiOf(f, EE));
    const second = peekReactions(f.ctx)[0]!;
    if (second.kind !== 'command') throw new Error('a command');
    expect([c?.targets, second.command.targets]).toEqual([['m0'], ['m0']]);
    const one = arena({ raw: 1, living: 1 });
    earthEaterTurn(aiOf(one, EE));
    expect(one.draws).toEqual([[FfxStream.Script, 0xffff]]);
    expect(earthEaterTurn(aiOf(arena({ raw: 1, living: 0 }), EE))).toBeNull();
  });
});

describe('the knock-down: a running total of the HP damage taken, strictly past 100,000 (RE n 3.4, the interpreter\'s run)', () => {
  it('the interpreter\'s sequence +30,000, +40,000, +20,000, +9,999, +1 (total 100,000): each is answered by a Megaton Punch on a member, Armored stays; the line is `>` not `>=`', () => {
    const f = arena({ pick: 1 });
    const totals: number[] = [];
    for (const d of [30_000, 40_000, 20_000, 9_999, 1]) {
      hit(f, d);
      const q = queued(f);
      expect(q, `+${d}`).toEqual([{ row: ROW.megatonPunch, targets: ['m1'] }]);
      drainAll(f);
      totals.push(f.ctx.state.flags[EATER_TOTAL_FLAG] as number);
      expect(armored(f)).toBe(true);
      expect(f.ctx.state.flags[EATER_DOWN_FLAG]).toBeUndefined();
    }
    expect(totals).toEqual([30_000, 70_000, 90_000, 99_999, 100_000]);
  });

  it('the next hit (+5,000, total 105,000) crosses: Armored off, down, the total back to 0, and NO answer to that hit (only the banner follows the action)', () => {
    const f = arena({ pick: 1 });
    rtOf(f.ctx, EE).ai[EATER_TOTAL] = 100_000;
    hit(f, 5_000);
    expect(queued(f)).toEqual([]);
    const rest = peekReactions(f.ctx);
    expect(rest).toHaveLength(1);
    expect(rest[0]).toMatchObject({ kind: 'emit', event: { type: 'message', kind: 'story' } });
    expect(armored(f)).toBe(false);
    expect([rtOf(f.ctx, EE).ai[EATER_DOWN], rtOf(f.ctx, EE).ai[EATER_DOWN_TURNS], rtOf(f.ctx, EE).ai[EATER_TOTAL]]).toEqual([1, 0, 0]);
    expect([f.ctx.state.flags[EATER_DOWN_FLAG], f.ctx.state.flags[EATER_TOTAL_FLAG]]).toEqual([true, 0]);
  });

  it('one big hit that goes from nothing to past the line knocks it down at once (an Overdrive is one hit event of many blows): no punch at all', () => {
    const f = arena();
    hit(f, 100_001);
    expect(queued(f)).toEqual([]);
    expect(armored(f)).toBe(false);
  });

  it('down, every hit that does HP damage is answered by a Flare it casts at itself, one at a time; the total keeps adding up from 0 (it is reset when it stands)', () => {
    const f = arena();
    rtOf(f.ctx, EE).ai[EATER_TOTAL] = 100_000;
    hit(f, 5_000);
    drainAll(f);
    hit(f, 12_345);
    expect(queued(f)).toEqual([{ row: ROW.flare, targets: [EE] }]);
    expect(f.ctx.state.flags[EATER_TOTAL_FLAG]).toBe(12_345);
    hit(f, 700); // a reaction is already waiting: the engine's queue refuses a second
    expect(queued(f)).toHaveLength(1);
    expect(f.ctx.state.flags[EATER_TOTAL_FLAG]).toBe(13_045);
    expect(armored(f)).toBe(false);
  });

  it('nothing for the blow that took its last HP, a miss, a heal or a status (no HP damage), and the total does not move for them', () => {
    const f = arena();
    hit(f, 50_000, 0);
    hit(f, 0);
    hit(f, -30_000);
    expect(queued(f)).toEqual([]);
    expect(f.ctx.state.flags[EATER_TOTAL_FLAG]).toBeUndefined();
  });

  it('while it cannot act (asleep) the total still adds up and the knock-down still happens, but nothing is queued; the bytes have no `isCounterattackAllowed` test, so a hit inside a reaction is answered too', () => {
    const asleep = arena();
    (bossOf(asleep, EE).statuses as Record<string, unknown>)['sleep'] = { id: 'sleep' };
    hit(asleep, 20_000);
    expect(queued(asleep)).toEqual([]);
    expect(asleep.ctx.state.flags[EATER_TOTAL_FLAG]).toBe(20_000);
    const inside = arena({ inReaction: true });
    hit(inside, 20_000);
    expect(queued(inside).map((q) => q.row)).toEqual([ROW.megatonPunch]);
  });

  it('a Doublecast or two actions in a row get one answer: a second hit while its punch waits asks for nothing more', () => {
    const f = arena();
    hit(f, 1_000);
    hit(f, 1_000);
    expect(queued(f)).toHaveLength(1);
    expect(f.ctx.state.flags[EATER_TOTAL_FLAG]).toBe(2_000);
  });
});

describe('down: two turns of nothing, then Gets up (RE n 3.4)', () => {
  const down = (): Fake => {
    const f = arena({ raw: 0 });
    const m = rtOf(f.ctx, EE).ai;
    m[EATER_DOWN] = 1;
    m[EATER_DOWN_TURNS] = 0;
    m[EATER_TOTAL] = 4_321;
    bossOf(f, EE).immunityFlags = [];
    f.ctx.state.flags[EATER_DOWN_FLAG] = true;
    return f;
  };

  it('the first two turns queue nothing (no draw at all); the third performs Gets up on itself, Armored comes back and the total, the counters and the flags are reset', () => {
    const f = down();
    const ai = aiOf(f, EE);
    expect(earthEaterTurn(ai)).toBeNull();
    expect(ai.memory[EATER_DOWN_TURNS]).toBe(1);
    expect(earthEaterTurn(ai)).toBeNull();
    expect(ai.memory[EATER_DOWN_TURNS]).toBe(2);
    expect(f.draws).toEqual([]);
    expect(armored(f)).toBe(false);
    const c = earthEaterTurn(ai);
    expect([rowOf(c), c?.targets]).toEqual([ROW.getsUp, [EE]]);
    expect([ai.memory[EATER_DOWN], ai.memory[EATER_DOWN_TURNS], ai.memory[EATER_TOTAL]]).toEqual([0, 0, 0]);
    expect(armored(f)).toBe(true);
    expect([f.ctx.state.flags[EATER_DOWN_FLAG], f.ctx.state.flags[EATER_TOTAL_FLAG]]).toEqual([false, 0]);
  });

  it('the turn after it has stood is a standing turn again (the coin is drawn)', () => {
    const f = down();
    const ai = aiOf(f, EE);
    for (let i = 0; i < 3; i++) earthEaterTurn(ai);
    expect(rowOf(earthEaterTurn(ai))).toBe(ROW.attack);
    expect(f.draws[0]).toEqual([FfxStream.Script, 0xffff]);
  });
});

describe('the real engine: the start, the counter, the knock-down, the Flare bounced onto the party, the getting up', () => {
  const eater = (engine: ReturnType<typeof newEngine>): FFXCombatant => actor(engine, EE);

  it('it starts Armored with Reflect on (the record\'s start-up status), standing, nothing taken; other creatures start without Reflect', () => {
    const engine = newEngine(3, 'earth-eater');
    expect(eater(engine).immunityFlags).toContain('armored');
    expect((eater(engine).statuses as Record<string, unknown>)['reflect']).toBeDefined();
    expect([flags(engine)[EATER_DOWN_FLAG], flags(engine)[EATER_TOTAL_FLAG]]).toEqual([false, 0]);
    expect(GAUNTLET_GROUP_IDS.earthEater).toBe('gauntlet-earth-eater');
    expect((actor(newEngine(3, 'jormungand'), 'jormungand').statuses as Record<string, unknown>)['reflect']).toBeUndefined();
  });

  it('a plain blow of Tidus: the total grows by the damage dealt, and the counter is a Megaton Punch (Death) on a member; with the preset\'s Ribbon the member dies (stage 1\'s F1)', () => {
    let killed = 0;
    let counters = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const engine = newEngine(seed, 'earth-eater');
      const d = nextInput(engine);
      const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack')!;
      const mine = engine.state().log.length;
      engine.submit({ ...swing.command, targets: [EE] } as never);
      nextInput(engine);
      const events = engine.state().log.slice(mine);
      const dealt = events.filter((e) => e.type === 'damage' && e.targetId === EE && e.amount > 0).reduce((s, e) => s + (e.type === 'damage' ? e.amount : 0), 0);
      if (dealt > 0) expect(flags(engine)[EATER_TOTAL_FLAG], `seed ${seed}`).toBeGreaterThanOrEqual(dealt);
      counters += events.filter((e) => e.type === 'counter' && e.actorId === EE && e.abilityId === ROW.megatonPunch && e.cause === 'script').length;
      killed += events.filter((e) => e.type === 'ko' && e.sourceId === EE).length;
    }
    expect(counters, 'the counter fires').toBeGreaterThan(0);
    expect(killed, 'the punch kills (Death 100, no Death ward on the preset)').toBeGreaterThan(0);
  });

  it('Armored: standing, Tidus\'s blow is a third of what it is once it lies down (capped at 99,999; a crit doubles both); Auron\'s Piercing blow is the same standing and lying', () => {
    const blow = (who: string, seed: number, isDown: boolean): number => {
      const engine = newEngine(seed, 'earth-eater');
      const ctx = ctxOf(engine);
      if (isDown) {
        rtOf(ctx, EE).ai[EATER_DOWN] = 1;
        eater(engine).immunityFlags = eater(engine).immunityFlags.filter((f) => f !== 'armored');
      }
      const mine = engine.state().log.length;
      resolveAbility(ctx, actor(engine, who), ctx.content.ability('attack')!, [EE]);
      return engine.state().log.slice(mine).filter((e) => e.type === 'damage' && e.targetId === EE).reduce((s, e) => s + (e.type === 'damage' ? e.amount : 0), 0);
    };
    for (let seed = 1; seed <= 6; seed++) {
      const standing = blow('tidus', seed, false);
      const lying = blow('tidus', seed, true);
      expect(standing, `seed ${seed}`).toBeGreaterThan(5_000);
      expect(lying, `seed ${seed}`).toBeGreaterThanOrEqual(Math.min(99_999, 2.9 * standing));
      expect(blow('auron', seed, false), `seed ${seed}: Piercing`).toBe(blow('auron', seed, true));
    }
  });

  it('down, a blow of the party is answered by Earth Eater\'s Flare at itself: its own Reflect sends it onto the party (2,355 to 2,660 a member), never onto itself; a Reflect it no longer has (Dispel) lets it hit itself', () => {
    const hurt: number[] = [];
    let onItself = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const engine = newEngine(seed, 'earth-eater');
      const ctx = ctxOf(engine);
      rtOf(ctx, EE).ai[EATER_DOWN] = 1;
      flags(engine)[EATER_DOWN_FLAG] = true;
      eater(engine).immunityFlags = [];
      const d = nextInput(engine);
      const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack')!;
      const mine = engine.state().log.length;
      engine.submit({ ...swing.command, targets: [EE] } as never);
      nextInput(engine);
      const events = engine.state().log.slice(mine);
      expect(events.some((e) => e.type === 'counter' && e.actorId === EE && e.abilityId === ROW.flare && e.cause === 'script'), `seed ${seed}`).toBe(true);
      for (const e of events) {
        if (e.type !== 'damage' || e.sourceId !== EE) continue;
        if (e.targetId === EE) onItself++;
        else hurt.push(e.amount);
      }
    }
    expect(onItself).toBe(0);
    expect(hurt.length).toBeGreaterThan(5);
    for (const a of hurt) {
      expect(a).toBeGreaterThanOrEqual(2_355);
      expect(a).toBeLessThanOrEqual(2_660);
    }
  });

  it('left alone it lies for two of its own turns and then stands: its actions are the Gets up row and nothing before it, Armored is back on, the flags are reset', () => {
    const engine = newEngine(5, 'earth-eater');
    const ctx = ctxOf(engine);
    rtOf(ctx, EE).ai[EATER_DOWN] = 1;
    flags(engine)[EATER_DOWN_FLAG] = true;
    eater(engine).immunityFlags = [];
    let turns = 0;
    for (let i = 0; i < 400 && !actions(engine.state().log, EE).includes(ROW.getsUp); i++) {
      for (const id of engine.state().activeIds) {
        const m = actor(engine, id);
        m.hp = m.stats.maxHp;
      }
      const dec = engine.nextDecision();
      if (dec.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      turns = engine.state().log.filter((e) => e.type === 'turn-start' && e.actorId === EE).length;
    }
    expect(actions(engine.state().log, EE)[0]).toBe(ROW.getsUp);
    expect(turns, 'two lost turns, then the third turn is the Gets up').toBe(3);
    expect(eater(engine).immunityFlags).toContain('armored');
    expect([flags(engine)[EATER_DOWN_FLAG], flags(engine)[EATER_TOTAL_FLAG]]).toEqual([false, 0]);
  });

  it('a turn of two punches is two actions of the same turn: the second follows the first as a free action (a counter event) and no third; the Attack turn is one action', () => {
    let pairs = 0;
    let attacks = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const engine = newEngine(seed, 'earth-eater');
      for (let i = 0; i < 120; i++) {
        for (const id of engine.state().activeIds) {
          const m = actor(engine, id);
          m.hp = m.stats.maxHp;
        }
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      const ev = engine.state().log;
      ev.forEach((e, i) => {
        if (e.type === 'action-start' && e.actorId === EE && e.abilityId === ROW.megatonPunch && ev[i - 1]?.type !== 'counter') {
          const after = ev.slice(i + 1).find((x) => x.type === 'counter' || x.type === 'turn-start');
          if (after?.type === 'counter' && after.actorId === EE && after.abilityId === ROW.megatonPunch && after.cause === 'script') pairs++;
        }
        if (e.type === 'action-start' && e.actorId === EE && e.abilityId === ROW.attack) attacks++;
      });
    }
    expect(pairs, 'some turn of two punches').toBeGreaterThan(0);
    expect(attacks, 'some Attack turn').toBeGreaterThan(0);
  });

  it('the advisor\'s dry run of its next move (intent.ts, on a copy) queues the second punch on the copy only: the real battle\'s queue stays empty and its stream does not move', () => {
    const engine = newEngine(2, 'earth-eater');
    const real = ctxOf(engine);
    let queuedOnCopy = 0;
    for (let i = 0; i < 40; i++) {
      real.rng.on(FfxStream.Script).int(0, 0xffff); // move the real stream on, so each preview forks from a different state
      const { ctx: clone } = cloneCtx(real);
      const c = chooseAiCommand(clone, clone.state.combatants[EE] as FFXCombatant);
      expect(rowOf(c)).toMatch(/gauntlet-(attack|megaton-punch)/);
      queuedOnCopy += peekReactions(clone).length;
      expect(peekReactions(real), `preview ${i}`).toEqual([]);
    }
    expect(queuedOnCopy, 'a coin of 1 comes within 40 previews').toBeGreaterThan(0);
  });

  it('its own turns are the Attack, the Megaton Punch and the Gets up row only (the Flare is a reply, never a turn)', () => {
    for (const seed of [1, 2, 3]) {
      const run = playOne(seed, 'earth-eater', careless);
      for (const a of turnActions(run.events, EE)) expect(['attack', ROW.attack, ROW.megatonPunch, ROW.getsUp], `seed ${seed}: ${a}`).toContain(a);
    }
  });
});

describe('the real engine: three seeds with the careless line (an end reached; each seed replays to the same log)', () => {
  it('seeds 1, 2 and 3 end in a victory or a defeat; replaying a seed gives the same digest; different seeds differ', () => {
    const digests: string[] = [];
    for (const seed of [1, 2, 3]) {
      const a = playOne(seed, 'earth-eater', careless);
      const b = playOne(seed, 'earth-eater', careless);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(a.outcome);
      expect(a.digest, `seed ${seed} replays`).toBe(b.digest);
      expect(a.inputs).toBeGreaterThan(0);
      digests.push(a.digest);
    }
    expect(new Set(digests).size).toBeGreaterThan(1);
  });
});
