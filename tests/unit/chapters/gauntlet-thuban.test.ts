/**
 * **Th'uban against the note** (`research/re-ffx-monster-arena-creations.md` 3.6, "RE n"; FFX only; the hidden Gauntlet chapter's act 7): every branch and number of its script
 * (`src/battle/ffx/ai/gauntlet-thuban.ts`) pinned on a **fake context** (the four-step cycle that starts on its third step, the buff order, who each move is aimed at, the draws, which are the picker's alone), the two
 * answers it gives to a hit by the command's own record (Haste on itself for a CTB command, Condemn on the front line for an HP command, one answer a hit, none from inside a reaction or for the blow that kills it), and then
 * the real engine: Condemn on the preset, Convergence (a certain KO), Haste after a Slow, and three seeds on two lines with their digests.
 */
import { describe, expect, it } from 'vitest';

import type { AbilityDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { resolveCommand } from '../../../src/battle/ffx/adapt/command.ts';
import {
  THUBAN_AFFECTS_CTB, THUBAN_AFFECTS_HP, THUBAN_BUFFS, THUBAN_FIRST_STEP, THUBAN_STEP, thubanOnHit, thubanTurn,
} from '../../../src/battle/ffx/ai/gauntlet-thuban.ts';
import { GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { type Fake, aiOf, bossOf, fakeArena, rowOf, tally } from '../helpers/gauntletFake.ts';
import { actions, actor, careless, ctxOf, newEngine, nextInput, playOne } from '../helpers/gauntletDrive.ts';
import { advisorLine } from '../helpers/gauntletBench.ts';

const TH = GAUNTLET_IDS.thuban;
const give = (f: Fake, ...ids: string[]): void => {
  for (const id of ids) (bossOf(f, TH).statuses as Record<string, unknown>)[id] = { id };
};
const turn = (f: Fake): { row: string; targets: readonly string[] } => {
  const c = thubanTurn(aiOf(f, TH));
  return { row: rowOf(c), targets: c?.targets ?? [] };
};

describe('registered under the id the data names; the constants of the bytes', () => {
  it('the AI script and its hit hook; the cycle starts on step 3; the two bits of the command record it reads; the buffs in the order it looks for them', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.thuban)).toBeDefined();
    expect(GAUNTLET_SCRIPTS.thuban).toBe('gauntlet-thuban');
    expect([THUBAN_FIRST_STEP, THUBAN_AFFECTS_HP, THUBAN_AFFECTS_CTB]).toEqual([3, 1, 4]);
    expect(THUBAN_BUFFS.map(([status, row]) => [status, row])).toEqual([['protect', ROW.protect], ['shell', ROW.shell], ['regen', ROW.regen]]);
    expect(ROW.protect).toBe('protect');
  });
});

describe("the turn: Attack, Rainbow, a buff, Convergence, again (RE n 3.6: a four-step cycle that starts on its third step)", () => {
  it('eight turns: Attack on one member, Rainbow on the whole front line, the buff on itself (Protect, nothing on it yet), Convergence on one member, and the same again', () => {
    const f = fakeArena({ boss: TH, pick: 1 });
    const rows = Array.from({ length: 8 }, () => turn(f));
    expect(rows.map((r) => r.row)).toEqual([ROW.attack, ROW.rainbow, ROW.protect, ROW.convergence, ROW.attack, ROW.rainbow, ROW.protect, ROW.convergence]);
    expect(rows[1]!.targets).toEqual(['m0', 'm1', 'm2']);
    expect(rows[2]!.targets).toEqual([TH]);
    expect(rows[3]!.targets).toEqual(['m1']); // the picker's second
    expect(rows[0]!.targets).toEqual(['m1']); // a tie on HP is one picker draw as well
  });

  it('the buff step: Protect if it lacks Protect, else Shell if it lacks Shell, else Regen if it lacks Regen, else nothing (a lost turn); the cycle goes on either way', () => {
    const at = (have: string[]): string => {
      const f = fakeArena({ boss: TH });
      give(f, ...have);
      rtOf(f.ctx, TH).ai[THUBAN_STEP] = 1;
      return turn(f).row;
    };
    expect(at([])).toBe(ROW.protect);
    expect(at(['protect'])).toBe(ROW.shell);
    expect(at(['protect', 'shell'])).toBe(ROW.regen);
    expect(at(['shell'])).toBe(ROW.protect);
    expect(at(['protect', 'shell', 'regen'])).toBe('(none)');
    const f = fakeArena({ boss: TH });
    give(f, 'protect', 'shell', 'regen');
    rtOf(f.ctx, TH).ai[THUBAN_STEP] = 1;
    expect([turn(f).row, turn(f).row, turn(f).row]).toEqual(['(none)', ROW.convergence, ROW.attack]);
  });

  it('no GetRandomValue decides a move: every turn of the cycle is the same for all 65,536 values of the script stream', () => {
    for (const step of [1, 2, 3, 4]) {
      const out = tally(TH, thubanTurn, {}, (f) => void (rtOf(f.ctx, TH).ai[THUBAN_STEP] = step));
      expect(Object.keys(out), `step ${step}`).toHaveLength(1);
    }
    expect(tally(TH, thubanTurn, {}, (f) => void (rtOf(f.ctx, TH).ai[THUBAN_STEP] = 3))).toEqual({ [ROW.attack]: 65_536 });
    const f = fakeArena({ boss: TH });
    for (let i = 0; i < 8; i++) turn(f);
    expect(f.draws.filter(([stream]) => stream === FfxStream.Script)).toEqual([]);
  });

  it('the Attack goes to the living member with the most HP (a tie is one picker draw), the Convergence to a random living one; with one standing nothing is drawn; with nobody the turn passes', () => {
    const f = fakeArena({ boss: TH });
    (f.ctx.state.combatants['m0'] as FFXCombatant).hp = 300;
    (f.ctx.state.combatants['m1'] as FFXCombatant).hp = 900;
    (f.ctx.state.combatants['m2'] as FFXCombatant).hp = 500;
    f.draws.length = 0;
    expect(turn(f)).toEqual({ row: ROW.attack, targets: ['m1'] });
    expect(f.draws).toEqual([]);
    const tie = fakeArena({ boss: TH, pick: 2 });
    expect(turn(tie)).toEqual({ row: ROW.attack, targets: ['m2'] });
    expect(tie.draws).toEqual([[FfxStream.Picker, 2]]);
    const one = fakeArena({ boss: TH, living: 1 });
    expect(turn(one).targets).toEqual(['m0']);
    turn(one);
    turn(one);
    expect(one.draws).toEqual([]);
    const none = fakeArena({ boss: TH, living: 0 });
    expect(turn(none).row).toBe('(none)');
  });

  it('the dead are not targets: with two standing the Rainbow names two members', () => {
    const f = fakeArena({ boss: TH, living: 2 });
    turn(f);
    expect(turn(f).targets).toEqual(['m0', 'm1']);
  });
});

describe('what it answers a hit with (RE n 3.6): read off the command\'s own record, in the order Haste then Condemn, one answer a hit', () => {
  const engine = newEngine(1, 'thuban');
  const ctx = ctxOf(engine);
  const th = (): FFXCombatant => actor(engine, TH);
  const tidus = (): FFXCombatant => actor(engine, 'tidus');
  const report = { hpBefore: 100, lostHp: true, lastDamage: 10, affectsHp: true };
  const drain = (): void => {
    while (takeReaction(ctx) !== undefined);
  };
  /** The command with its record's damage class overridden (the party has no command with both bits; `resolveCommand` reads the record). */
  const withClass = (id: string, damageClass: number): AbilityDef => {
    const def = ctx.content.ability(id) as AbilityDef;
    return { ...def, record: { ...resolveCommand(def, tidus()).record, damageClass } };
  };
  const hit = (def: AbilityDef, over: Partial<typeof report> = {}): string[] => {
    drain();
    thubanOnHit(ctx, th(), { def, user: tidus() }, { ...report, ...over });
    const out = peekReactions(ctx).flatMap((r) => (r.kind === 'command' ? [`${rowOf(r.command)}->${r.command.targets.join('+')}`] : []));
    drain();
    return out;
  };

  it('an HP command (Attack, a spell): Condemn on the whole front line; a CTB command (Slow, Haste cast on it): Haste on itself', () => {
    const front = ['tidus', 'yuna', 'auron'].join('+');
    expect(hit(ctx.content.ability('attack') as AbilityDef)).toEqual([`${ROW.condemn}->${front}`]);
    expect(hit(ctx.content.ability('firaga') as AbilityDef)).toEqual([`${ROW.condemn}->${front}`]);
    expect(hit(ctx.content.ability('slow') as AbilityDef)).toEqual([`${ROW.haste}->${TH}`]);
    expect(hit(ctx.content.ability('haste') as AbilityDef)).toEqual([`${ROW.haste}->${TH}`]);
  });

  it('a command that changes neither HP nor CTB (a buff, Scan) is answered by nothing; a miss counts: the script tests no damage', () => {
    expect(hit(withClass('attack', 0))).toEqual([]);
    expect(hit(ctx.content.ability('attack') as AbilityDef, { lastDamage: 0, lostHp: false })).toEqual([`${ROW.condemn}->tidus+yuna+auron`]);
  });

  it('a command that does both is answered by Haste alone: the game\'s queue drops a second command of the same owner (no party command has both bits; the record is overridden)', () => {
    expect(hit(withClass('attack', THUBAN_AFFECTS_HP | THUBAN_AFFECTS_CTB))).toEqual([`${ROW.haste}->${TH}`]);
    expect(hit(withClass('attack', THUBAN_AFFECTS_CTB))).toEqual([`${ROW.haste}->${TH}`]);
  });

  it('none of the party\'s commands has both bits, and the CTB-only ones are Haste, Hastega, Slow and Slowga', () => {
    const ctb: string[] = [];
    for (const id of ['attack', 'slow', 'slowga', 'haste', 'hastega', 'delay-attack', 'delay-buster', 'quick-hit', 'firaga', 'curaga', 'protect']) {
      const cls = resolveCommand(ctx.content.ability(id) as AbilityDef, tidus()).record.damageClass;
      expect((cls & 5) === 5, id).toBe(false);
      if ((cls & 4) !== 0) ctb.push(id);
    }
    expect(ctb).toEqual(['slow', 'slowga', 'haste', 'hastega']);
  });

  it('the blow that kills it (HP 0) is answered by nothing; nothing from inside a reaction (a counter never triggers a counter: the Haste it casts on itself would answer itself for ever); nothing from a Threatened Th\'uban', () => {
    th().hp = 0;
    expect(hit(ctx.content.ability('attack') as AbilityDef)).toEqual([]);
    th().hp = th().stats.maxHp;
    ctx.rt.inReaction = true;
    expect(hit(ctx.content.ability('slow') as AbilityDef)).toEqual([]);
    ctx.rt.inReaction = false;
    (th().statuses as Record<string, unknown>)['threaten'] = { id: 'threaten' };
    expect(hit(ctx.content.ability('attack') as AbilityDef)).toEqual([]);
    delete (th().statuses as Record<string, unknown>)['threaten'];
    expect(hit(ctx.content.ability('attack') as AbilityDef)).toHaveLength(1);
  });
});

describe('the real engine: act 7', () => {
  it('it starts as the record says (3,000,000 HP, Reflect 255 so nothing reflects off it, Agility 53, no Armor) and with no buff on it', () => {
    const engine = newEngine(1, 'thuban');
    const t = actor(engine, TH);
    expect([t.hp, t.stats.agi, t.stats.def, t.stats.mdef]).toEqual([3_000_000, 53, 80, 80]);
    expect(t.immunityFlags).not.toContain('armored');
    expect(Object.keys(t.statuses)).toEqual([]);
    expect(t.immunities['reflect']).toBe(255);
  });

  it('a blow on it is answered by Condemn on all three (335 to 378 each on the preset), a free action of its own; the party\'s Auto-Protect and Auto-Haste stay on (a cleanse takes no permanent status)', () => {
    const engine = newEngine(2, 'thuban');
    nextInput(engine);
    const d = nextInput(engine);
    const mark = engine.state().log.length;
    engine.submit({ kind: 'attack', targets: [TH] });
    nextInput(engine);
    const events = engine.state().log.slice(mark);
    expect(d.actorId).toBe('tidus');
    expect(events.some((e) => e.type === 'counter' && e.actorId === TH && e.abilityId === ROW.condemn && e.cause === 'script')).toBe(true);
    const condemn = events.filter((e) => e.type === 'damage' && ['tidus', 'yuna', 'auron'].includes(e.targetId as string) && e.sourceId === TH);
    expect(condemn.length).toBeGreaterThanOrEqual(3);
    for (const e of condemn) if (e.type === 'damage') expect(e.amount).toBeGreaterThanOrEqual(300);
    for (const id of ['tidus', 'yuna', 'auron']) expect(Object.keys(actor(engine, id).statuses)).toEqual(expect.arrayContaining(['protect', 'haste']));
  });

  it('Condemn strips the temporary buffs a member has (a Shell, a Regen), not the permanent ones', () => {
    const engine = newEngine(3, 'thuban');
    const ctx = ctxOf(engine);
    const tidus = actor(engine, 'tidus');
    const temp = (id: string): never => ({ id, turnsRemaining: 10, ticksRemaining: null, charges: null, stacks: 0, permanent: false }) as never;
    (tidus.statuses as Record<string, unknown>)['shell'] = temp('shell');
    (tidus.statuses as Record<string, unknown>)['regen'] = temp('regen');
    resolveAbility(ctx, actor(engine, TH), ctx.content.ability(ROW.condemn) as AbilityDef, ['tidus', 'yuna', 'auron']);
    expect(Object.keys(tidus.statuses)).not.toContain('shell');
    expect(Object.keys(tidus.statuses)).not.toContain('regen');
    expect(Object.keys(tidus.statuses)).toEqual(expect.arrayContaining(['protect', 'haste']));
  });

  it('Convergence is a certain KO on a 9,999-HP member whatever his Shell (formula 4 ignores Magic Defense: 99,999, or 55,000 to 63,000 through a Shell), and Rainbow lands nothing on the Ribbon\'s wearers', () => {
    const engine = newEngine(4, 'thuban');
    const ctx = ctxOf(engine);
    for (let i = 0; i < 20; i++) {
      for (const shell of [false, true]) {
        const e2 = newEngine(10 + i, 'thuban');
        const c2 = ctxOf(e2);
        const yuna = actor(e2, 'yuna');
        if (shell) (yuna.statuses as Record<string, unknown>)['shell'] = { id: 'shell', turnsRemaining: 10, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
        const at = e2.state().log.length;
        resolveAbility(c2, actor(e2, TH), c2.content.ability(ROW.convergence) as AbilityDef, ['yuna']);
        const events = e2.state().log.slice(at);
        const dealt = events.filter((e) => e.type === 'damage' && e.targetId === 'yuna').map((e) => (e.type === 'damage' ? e.amount : 0));
        expect(dealt, `seed ${10 + i}`).toHaveLength(1);
        if (shell) {
          expect(dealt[0], `seed ${10 + i} through a Shell`).toBeGreaterThanOrEqual(55_000);
          expect(dealt[0], `seed ${10 + i} through a Shell`).toBeLessThanOrEqual(63_000);
        } else {
          expect(dealt, `seed ${10 + i}`).toEqual([99_999]);
        }
        expect(events.some((e) => e.type === 'ko' && e.targetId === 'yuna'), `seed ${10 + i}: the hit is lethal (Auto-Phoenix pays for it)`).toBe(true);
      }
    }
    const mark = engine.state().log.length;
    resolveAbility(ctx, actor(engine, TH), ctx.content.ability(ROW.rainbow) as AbilityDef, ['tidus', 'yuna', 'auron']);
    const adds = engine.state().log.slice(mark).filter((e) => e.type === 'status-add' && ['confuse', 'sleep', 'silence', 'darkness'].includes(e.status as string));
    expect(adds).toEqual([]);
  });

  it('a Slow on it is answered by one Haste on itself and then nothing more (the engine drops the counter of a counter)', () => {
    const engine = newEngine(5, 'thuban');
    nextInput(engine);
    const mark = engine.state().log.length;
    engine.submit({ kind: 'ability', id: 'slow', targets: [TH] });
    nextInput(engine);
    const own = actions(engine.state().log.slice(mark), TH);
    expect(own.filter((a) => a === ROW.haste)).toHaveLength(1);
    expect(own).not.toContain(ROW.condemn);
  });

  it('its own turns follow the cycle on the clock: Attack, Rainbow, buff, Convergence (a careless party that never kills it in time)', () => {
    const engine = newEngine(6, 'thuban');
    const t = actor(engine, TH);
    for (let i = 0; i < 1500 && actions(engine.state().log, TH).length < 4; i++) {
      for (const id of engine.state().activeIds) {
        const m = actor(engine, id);
        m.hp = m.stats.maxHp;
      }
      t.hp = t.stats.maxHp;
      const d = engine.nextDecision();
      if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      if (d.kind === 'battle-over') break;
    }
    const own = actions(engine.state().log, TH).filter((a) => a !== ROW.condemn && a !== ROW.haste);
    expect(own.slice(0, 4)).toEqual([ROW.attack, ROW.rainbow, ROW.protect, ROW.convergence]);
  });

  it('seeds 1, 2 and 3 on the careless line and on the advisor\'s end in a victory (the party is faster than it and empties it in 31 hits); replaying a seed gives the same digest', () => {
    const digests: string[] = [];
    for (const seed of [1, 2, 3]) {
      for (const [name, line] of [['careless', careless], ['advisor', advisorLine]] as const) {
        const a = playOne(seed, 'thuban', line);
        const b = playOne(seed, 'thuban', line);
        expect(['victory', 'defeat'], `${name} seed ${seed}`).toContain(a.outcome);
        expect(a.digest, `${name} seed ${seed} replays`).toBe(b.digest);
        digests.push(`${name}:${seed}:${a.digest}`);
      }
    }
    expect(new Set(digests.map((d) => d.split(':')[2])).size).toBeGreaterThan(1);
  });
});
