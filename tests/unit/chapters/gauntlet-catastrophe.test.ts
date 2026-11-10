/**
 * **Catastrophe against the note** (`research/re-ffx-monster-arena-creations.md` 3.3, "RE n"; FFX only; the hidden Gauntlet chapter's act 6): every branch and number of its script
 * (`src/battle/ffx/ai/gauntlet-catastrophe.ts`) pinned on a **fake context** (the rest-then-cloud alternation, the 4/5 line strictly, the writes of the change, the three-turn cycle of the second form and who each move
 * is aimed at), and then the real engine: Armored at the start, the change on the hit that takes it below the line, its Agility 60 on the clock, and three seeds with their digests.
 */
import { describe, expect, it } from 'vitest';

import type { FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import {
  CATASTROPHE_FORM, CATASTROPHE_FORM2_AGI, CATASTROPHE_FORM2_LUCK, CATASTROPHE_STEP, catastropheLine, catastropheOnHit, catastropheTurn,
} from '../../../src/battle/ffx/ai/gauntlet-catastrophe.ts';
import { CATASTROPHE_FORM2_SPRITE, CATASTROPHE_FORM_FLAG, GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { type Fake, type FakeOptions, aiOf, bossOf, fakeArena, rowOf } from '../helpers/gauntletFake.ts';
import { actions, actor, careless, ctxOf, flags, newEngine, nextInput, playOne, turnActions } from '../helpers/gauntletDrive.ts';

const CAT = GAUNTLET_IDS.catastrophe;
const MAX = 2_200_000;

/** A fake battle with Catastrophe in its first form (Armored; the fake's maximum HP is 1,000, so its line is 800). */
const arena = (opts: Partial<FakeOptions> = {}): Fake => {
  const f = fakeArena({ boss: CAT, ...opts });
  const self = bossOf(f, CAT);
  self.immunityFlags = ['armored'];
  Object.assign(self.stats, { luck: 15, agi: 34 });
  self.spriteKey = 'first-form';
  self.name = 'Catastrophe';
  return f;
};
const hit = (f: Fake, hp: number): void => {
  const self = bossOf(f, CAT);
  self.hp = hp;
  catastropheOnHit(f.ctx, self, { def: {} as never, user: bossOf(f, 'm0') }, { hpBefore: 1000, lostHp: true, lastDamage: 100, affectsHp: true });
};
const queuedRows = (f: Fake): string[] => peekReactions(f.ctx).flatMap((r) => (r.kind === 'command' ? [rowOf(r.command)] : []));
const turn = (f: Fake): { row: string; targets: readonly string[] } => {
  const c = catastropheTurn(aiOf(f, CAT));
  return { row: rowOf(c), targets: c?.targets ?? [] };
};

describe('registered under the id the data names; the line is 4/5 of the maximum HP', () => {
  it('the AI script, the constants of the bytes', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.catastrophe)).toBeDefined();
    expect(GAUNTLET_SCRIPTS.catastrophe).toBe('gauntlet-catastrophe');
    expect([CATASTROPHE_FORM2_LUCK, CATASTROPHE_FORM2_AGI]).toEqual([30, 60]);
  });

  it('v3 = maxHP x 4 / 5 in integers: 1,760,000 of 2,200,000 (the interpreter\'s phase line)', () => {
    expect(catastropheLine(MAX)).toBe(1_760_000);
    expect(catastropheLine(1000)).toBe(800);
    expect(catastropheLine(7)).toBe(5); // floor(28 / 5)
  });
});

describe('form 1: nothing, Toxic Cloud on the front line, nothing, Toxic Cloud (RE n 3.3), with no draw at all', () => {
  it('six turns alternate a lost turn and the cloud; the cloud is aimed at the whole living front line', () => {
    const f = arena();
    const rows = Array.from({ length: 6 }, () => turn(f));
    expect(rows.map((r) => r.row)).toEqual(['(none)', ROW.toxicCloud, '(none)', ROW.toxicCloud, '(none)', ROW.toxicCloud]);
    expect(rows[1]!.targets).toEqual(['m0', 'm1', 'm2']);
    expect(f.draws).toEqual([]);
    const two = arena({ living: 2 });
    turn(two);
    expect(turn(two).targets).toEqual(['m0', 'm1']);
  });

  it('it answers a hit with nothing while it stays at or above the line (800 of 1,000 is not below it)', () => {
    const f = arena();
    hit(f, 1000);
    hit(f, 800);
    expect(queuedRows(f)).toEqual([]);
    expect(rtOf(f.ctx, CAT).ai[CATASTROPHE_FORM]).toBeUndefined();
    expect(f.ctx.state.flags[CATASTROPHE_FORM_FLAG]).toBeUndefined();
  });
});

describe('the change: the hit that leaves it strictly below the line (RE n 3.3)', () => {
  it('799 of 1,000: Armored off, Luck 30, Agility 60, the second painting, the form flag, the counter back to 0, Transform on itself as a free action, and the form-change banner after the action\'s own events', () => {
    const f = arena();
    rtOf(f.ctx, CAT).ai[CATASTROPHE_STEP] = 1; // mid-way through form 1's alternation
    hit(f, 799);
    const self = bossOf(f, CAT);
    expect(self.immunityFlags).not.toContain('armored');
    expect([self.stats.luck, self.stats.agi, self.spriteKey]).toEqual([30, 60, CATASTROPHE_FORM2_SPRITE]);
    expect([rtOf(f.ctx, CAT).ai[CATASTROPHE_FORM], rtOf(f.ctx, CAT).ai[CATASTROPHE_STEP], f.ctx.state.flags[CATASTROPHE_FORM_FLAG]]).toEqual([1, 0, 1]);
    const q = peekReactions(f.ctx);
    expect(q).toHaveLength(2);
    expect(q[0]).toMatchObject({ kind: 'command', ownerId: CAT, keepsControl: true });
    const first = q[0]!;
    if (first.kind !== 'command') throw new Error('a command');
    expect([rowOf(first.command), first.command.targets]).toEqual([ROW.transform, [CAT]]);
    expect(q[1]).toMatchObject({ kind: 'emit', event: { type: 'form-change', enemyId: CAT, formIndex: 1, name: 'Catastrophe', spriteKey: CATASTROPHE_FORM2_SPRITE } });
  });

  it('it happens once: a later hit asks for nothing and writes nothing', () => {
    const f = arena();
    hit(f, 700);
    while (takeReaction(f.ctx) !== undefined);
    bossOf(f, CAT).stats.agi = 77; // a later write of the script's would show
    hit(f, 100);
    expect(peekReactions(f.ctx)).toEqual([]);
    expect(bossOf(f, CAT).stats.agi).toBe(77);
  });

  it('one hit from full HP to below the line does it whatever its size; the blow that kills it (HP 0) is left alone, and so is a Catastrophe that cannot act (the writes still happen)', () => {
    const big = arena();
    hit(big, 10);
    expect(bossOf(big, CAT).stats.agi).toBe(60);
    const dead = arena();
    hit(dead, 0);
    expect(bossOf(dead, CAT).stats.agi).toBe(34);
    expect(peekReactions(dead.ctx)).toEqual([]);
    const asleep = arena();
    (bossOf(asleep, CAT).statuses as Record<string, unknown>)['sleep'] = { id: 'sleep' };
    hit(asleep, 500);
    expect(bossOf(asleep, CAT).stats.agi, 'the property writes happen whether or not the command can be queued').toBe(60);
    expect(queuedRows(asleep)).toEqual([]);
    expect(peekReactions(asleep.ctx)).toHaveLength(1); // the banner
  });
});

describe('form 2: Toxic Spray on the member with the most HP, Demi on the front line, Hundred Thorns on the front line, again (RE n 3.3)', () => {
  const transformed = (opts: Partial<FakeOptions> = {}): Fake => {
    const f = arena(opts);
    hit(f, 700);
    while (takeReaction(f.ctx) !== undefined);
    return f;
  };

  it('six turns: Spray, Demi, Thorns, Spray, Demi, Thorns; the first turn after the change is the Spray (the counter was reset)', () => {
    const f = transformed();
    const rows = Array.from({ length: 6 }, () => turn(f));
    expect(rows.map((r) => r.row)).toEqual([ROW.toxicSpray, ROW.demi, ROW.hundredThorns, ROW.toxicSpray, ROW.demi, ROW.hundredThorns]);
    expect(rows[1]!.targets).toEqual(['m0', 'm1', 'm2']);
    expect(rows[2]!.targets).toEqual(['m0', 'm1', 'm2']);
  });

  it('Toxic Spray goes to the living member with the most HP (a tie is one picker draw); the other two moves draw nothing', () => {
    const f = transformed();
    (f.ctx.state.combatants['m0'] as FFXCombatant).hp = 300;
    (f.ctx.state.combatants['m1'] as FFXCombatant).hp = 900;
    (f.ctx.state.combatants['m2'] as FFXCombatant).hp = 500;
    f.draws.length = 0;
    expect(turn(f)).toEqual({ row: ROW.toxicSpray, targets: ['m1'] });
    expect(f.draws).toEqual([]);
    turn(f);
    turn(f);
    expect(f.draws).toEqual([]);
    const tie = transformed({ pick: 1 });
    expect(turn(tie)).toEqual({ row: ROW.toxicSpray, targets: ['m1'] });
    expect(tie.draws).toEqual([[FfxStream.Picker, 2]]);
  });

  it('the dead are not targets: with two standing the Demi and the Thorns name two members', () => {
    const f = transformed({ living: 2 });
    turn(f);
    expect(turn(f).targets).toEqual(['m0', 'm1']);
    expect(turn(f).targets).toEqual(['m0', 'm1']);
  });
});

describe('the real engine', () => {
  const cat = (engine: ReturnType<typeof newEngine>): FFXCombatant => actor(engine, CAT);

  it('it starts in its first form: Armored, Agility 34, Luck 15, the stand-in painting; its turns alternate nothing and the cloud', () => {
    const engine = newEngine(2, 'catastrophe');
    expect(cat(engine).immunityFlags).toContain('armored');
    expect([cat(engine).stats.agi, cat(engine).stats.luck]).toEqual([34, 15]);
    expect(flags(engine)[CATASTROPHE_FORM_FLAG]).toBeUndefined();
    let done = false;
    for (let i = 0; i < 600 && !done; i++) {
      for (const id of engine.state().activeIds) {
        const m = actor(engine, id);
        m.hp = m.stats.maxHp;
      }
      const d = engine.nextDecision();
      if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      done = engine.state().log.filter((e) => e.type === 'turn-start' && e.actorId === CAT).length >= 6;
    }
    expect(turnActions(engine.state().log, CAT)).toEqual([ROW.toxicCloud, ROW.toxicCloud, ROW.toxicCloud]);
  });

  it('a blow that takes it from just above 1,760,000 to below: Armored off, Luck 30, Agility 60, a `form-change` banner, and Transform performed by Catastrophe as a script action', () => {
    const engine = newEngine(4, 'catastrophe');
    const ctx = ctxOf(engine);
    cat(engine).hp = catastropheLine(cat(engine).stats.maxHp) + 5;
    const mine = engine.state().log.length;
    const d = nextInput(engine);
    const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack')!;
    engine.submit({ ...swing.command, targets: [CAT] } as never);
    nextInput(engine);
    const events = engine.state().log.slice(mine);
    expect(cat(engine).immunityFlags).not.toContain('armored');
    expect([cat(engine).stats.agi, cat(engine).stats.luck, cat(engine).spriteKey]).toEqual([60, 30, CATASTROPHE_FORM2_SPRITE]);
    expect(events.some((e) => e.type === 'counter' && e.actorId === CAT && e.abilityId === ROW.transform && e.cause === 'script')).toBe(true);
    expect(events.filter((e) => e.type === 'form-change' && e.enemyId === CAT)).toHaveLength(1);
    expect(flags(engine)[CATASTROPHE_FORM_FLAG]).toBe(1);
    expect(rtOf(ctx, CAT).ai[CATASTROPHE_FORM]).toBe(1);
    expect(cat(engine).alive, 'one form: the change is no death, no refill').toBe(true);
    expect(cat(engine).hp).toBeLessThan(catastropheLine(cat(engine).stats.maxHp));
    expect(cat(engine).hp).toBeGreaterThan(0);
  });

  it('Armored: before the change a plain blow is divided, after it it is not (Auron\'s Piercing ignores it either way)', () => {
    const blow = (who: string, changed: boolean): number => {
      const engine = newEngine(6, 'catastrophe');
      const ctx = ctxOf(engine);
      if (changed) {
        cat(engine).hp = catastropheLine(cat(engine).stats.maxHp) - 1_000;
        resolveAbility(ctx, actor(engine, 'tidus'), ctx.content.ability('attack')!, [CAT]); // the change
        while (takeReaction(ctx) !== undefined);
        expect(cat(engine).immunityFlags).not.toContain('armored');
      }
      const mine = engine.state().log.length;
      resolveAbility(ctx, actor(engine, who), ctx.content.ability('attack')!, [CAT]);
      return engine.state().log.slice(mine).filter((e) => e.type === 'damage' && e.targetId === CAT).reduce((s, e) => s + (e.type === 'damage' ? e.amount : 0), 0);
    };
    const before = blow('tidus', false);
    expect(before).toBeGreaterThan(5_000);
    expect(blow('tidus', true)).toBeGreaterThanOrEqual(Math.min(99_999, 2.9 * before)); // a third gone, capped at 99,999
    expect(blow('auron', true)).toBe(blow('auron', false));
  });

  it('Agility 60 is on the clock: over the same stretch of the battle the changed Catastrophe takes more turns (the note: 24 CTB a turn before, 18 after)', () => {
    const turnsOver = (changed: boolean): number => {
      const engine = newEngine(8, 'catastrophe');
      const ctx = ctxOf(engine);
      if (changed) {
        cat(engine).hp = catastropheLine(cat(engine).stats.maxHp) - 1_000;
        resolveAbility(ctx, actor(engine, 'tidus'), ctx.content.ability('attack')!, [CAT]);
        while (takeReaction(ctx) !== undefined);
      }
      let n = 0;
      for (let i = 0; i < 4000 && engine.state().ticks < 3000; i++) {
        for (const id of engine.state().activeIds) {
          const m = actor(engine, id);
          m.hp = m.stats.maxHp;
        }
        cat(engine).hp = Math.min(cat(engine).hp, cat(engine).stats.maxHp);
        const d = engine.nextDecision();
        if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
        if (d.kind === 'battle-over') break;
      }
      n = engine.state().log.filter((e) => e.type === 'turn-start' && e.actorId === CAT).length;
      return n;
    };
    expect(turnsOver(true)).toBeGreaterThan(turnsOver(false));
  });

  it('after the change its own turns run Spray, Demi, Thorns in order, and only those', () => {
    const engine = newEngine(9, 'catastrophe');
    const ctx = ctxOf(engine);
    cat(engine).hp = catastropheLine(cat(engine).stats.maxHp) - 1_000;
    resolveAbility(ctx, actor(engine, 'tidus'), ctx.content.ability('attack')!, [CAT]);
    while (takeReaction(ctx) !== undefined);
    for (let i = 0; i < 800 && turnActions(engine.state().log, CAT).length < 6; i++) {
      for (const id of engine.state().activeIds) {
        const m = actor(engine, id);
        m.hp = m.stats.maxHp;
      }
      cat(engine).hp = catastropheLine(cat(engine).stats.maxHp) - 1_000;
      const d = engine.nextDecision();
      if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
    }
    const own = turnActions(engine.state().log, CAT).slice(0, 6);
    expect(own).toEqual([ROW.toxicSpray, ROW.demi, ROW.hundredThorns, ROW.toxicSpray, ROW.demi, ROW.hundredThorns]);
    expect(actions(engine.state().log, CAT)).not.toContain(ROW.toxicCloud);
  });

  it('seeds 1, 2 and 3 with the careless line end in a victory or a defeat; replaying a seed gives the same digest', () => {
    const digests: string[] = [];
    for (const seed of [1, 2, 3]) {
      const a = playOne(seed, 'catastrophe', careless);
      const b = playOne(seed, 'catastrophe', careless);
      expect(['victory', 'defeat'], `seed ${seed}`).toContain(a.outcome);
      expect(a.digest, `seed ${seed} replays`).toBe(b.digest);
      digests.push(a.digest);
    }
    expect(new Set(digests).size).toBeGreaterThan(1);
  });
});
