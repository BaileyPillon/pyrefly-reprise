/**
 * **The Ultima Buster, its Head and its Arms against the note** (`research/re-ffx-monster-arena-creations.md` 3.1, "RE n", and the arena formation `zzzz02_80`; FFX only; the hidden Gauntlet chapter's act 9): every branch and
 * number of the three scripts (`src/battle/ffx/ai/gauntlet-ultima-buster.ts`) pinned on a **fake context** (the coin turn and the forced turn over all 65,536 draws, the Attack behind the Ultima, the regrowth counter, the Head's
 * three-turn cycle and its cancel, the body's answer to the relay), then the real engine: **the gate on physical, magic and special commands** with the Arms alive, one alive and both down (DEF, Armored and Defend written at targeting
 * time and seen by the same action), the Arms' regrowth on the body's third or fourth turn, the Arms without turns, the fight won with the Head and Arms alive, three seeds on two lines.
 */
import { describe, expect, it } from 'vitest';

import type { AbilityDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { GAUNTLET_IDS as ID, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, UB_HEAD_STATE_FLAG, UB_RELAY_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import {
  UB_ARM_HP, UB_BARE_DEF, UB_GATE_DEF, UB_HEAD_STATE, UB_HIT_DEF, UB_REGROW, UB_TURNS, anArmLives, bothArmsDown, gateCatches, ultimaBusterArms, ultimaBusterHeadOnHit, ultimaBusterHeadTurn, ultimaBusterOnHit,
  ultimaBusterOnTargeted, ultimaBusterTurn,
} from '../../../src/battle/ffx/ai/gauntlet-ultima-buster.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { ITEMS } from '../../../src/data/ffx/index.ts';
import * as TACTIC from '../../../src/engine/tactics/gauntlet.ts';
import { type Fake, type FakeOptions, aiOf, bossOf, fakeArena, rowOf, tally } from '../helpers/gauntletFake.ts';
import { actions, actor, careless, ctxOf, flags, newEngine, playOne } from '../helpers/gauntletDrive.ts';
import { advisorLine } from '../helpers/gauntletBench.ts';

const UB = ID.ultimaBuster;
const HEAD = ID.ultimaBusterHead;
const ARMS = [ID.ultimaBusterArmLeft, ID.ultimaBusterArmRight];
const STANDING = { [HEAD]: true, [ARMS[0]!]: true, [ARMS[1]!]: true };

/** A fake battle with the body, the Head and the Arms standing (or the Arms down). */
const arena = (opts: Partial<FakeOptions> = {}): Fake => fakeArena({ boss: UB, extras: STANDING, ...opts });
const mem = (f: Fake, id: string = UB): Record<string, number | string | boolean> => rtOf(f.ctx, id).ai;
const turn = (f: Fake): { row: string; targets: readonly string[] } => {
  const c = ultimaBusterTurn(aiOf(f, UB));
  return { row: rowOf(c), targets: c?.targets ?? [] };
};
const queuedRows = (f: Fake): string[] => peekReactions(f.ctx).flatMap((r) => (r.kind === 'command' ? [`${rowOf(r.command)}->${r.command.targets.join('+')}`] : []));
const drain = (f: Fake): void => {
  while (takeReaction(f.ctx) !== undefined);
};

describe('registered under the ids the data names; the constants of the bytes', () => {
  it('the three AI scripts (the Arms\' returns nothing), the Defense the gate writes and the hit puts back, the Arms\' HP', () => {
    for (const id of [GAUNTLET_SCRIPTS.ultimaBuster, GAUNTLET_SCRIPTS.ultimaBusterHead, GAUNTLET_SCRIPTS.ultimaBusterArm]) expect(getAiScript(id), id).toBeDefined();
    expect(getAiScript(GAUNTLET_SCRIPTS.ultimaBusterArm)!(aiOf(arena(), UB))).toBeNull();
    expect([UB_GATE_DEF, UB_HIT_DEF, UB_BARE_DEF, UB_ARM_HP]).toEqual([255, 50, 0, 80_000]);
    expect(TACTIC.ULTIMA_BUSTER_ARM_IDS).toEqual(ARMS);
  });
});

describe("the body's turn: a coin turn or an Ultima with an Attack behind it (RE n 3.1)", () => {
  it('with the draws all 0 the turns go Ultima, Ultima, Ultima + Attack, Ultima, Ultima + Attack...; with all 1: Attack, Attack, Ultima + Attack, Attack, Ultima + Attack (the counter v10 resets to 0 and goes up by one)', () => {
    const seq = (raw: number): string[] => {
      const f = arena({ raw, pick: 1 });
      const out: string[] = [];
      for (let i = 0; i < 6; i++) {
        const t = turn(f);
        const behind = queuedRows(f);
        drain(f);
        out.push([t.row, ...behind].join('+'));
      }
      return out;
    };
    expect(seq(0)).toEqual([ROW.ultima, ROW.ultima, `${ROW.ultima}+${ROW.attack}->m1`, ROW.ultima, `${ROW.ultima}+${ROW.attack}->m1`, ROW.ultima]);
    expect(seq(1)).toEqual([ROW.attack, ROW.attack, `${ROW.ultima}+${ROW.attack}->m1`, ROW.attack, `${ROW.ultima}+${ROW.attack}->m1`, ROW.attack]);
  });

  it('a coin turn over all 65,536 values: 32,768 Ultima and 32,768 Attack (exact); the forced turn is the Ultima whatever the draw', () => {
    expect(tally(UB, ultimaBusterTurn, { extras: STANDING }, (f) => void (mem(f)[UB_TURNS] = 0))).toEqual({ [ROW.ultima]: 32_768, [ROW.attack]: 32_768 });
    expect(tally(UB, ultimaBusterTurn, { extras: STANDING }, (f) => void (mem(f)[UB_TURNS] = 2))).toEqual({ [ROW.ultima]: 65_536 });
  });

  it('the Ultima is on the whole living front line; the Attack goes to one random living member; the draws: the coin on the script stream, then the picker for an Attack (none for the Ultima alone); the forced turn takes the picker alone', () => {
    const f = arena({ raw: 0, pick: 2 });
    expect(turn(f)).toEqual({ row: ROW.ultima, targets: ['m0', 'm1', 'm2'] });
    expect(f.draws).toEqual([[FfxStream.Script, 0xffff]]);
    const a = arena({ raw: 1, pick: 2 });
    expect(turn(a)).toEqual({ row: ROW.attack, targets: ['m2'] });
    expect(a.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]);
    const forced = arena({ raw: 1, pick: 0 });
    mem(forced)[UB_TURNS] = 2;
    expect(turn(forced).row).toBe(ROW.ultima);
    expect(forced.draws).toEqual([[FfxStream.Picker, 2]]);
    expect(queuedRows(forced)).toEqual([`${ROW.attack}->m0`]);
    expect(peekReactions(forced.ctx)[0]).toMatchObject({ kind: 'command', ownerId: UB, keepsControl: true });
  });

  it('the dead are not targets; with one standing no picker draw; the counter goes up by one after every turn and starts again after the forced turn', () => {
    const f = arena({ raw: 1, living: 1 });
    expect(turn(f).targets).toEqual(['m0']);
    expect(f.draws).toEqual([[FfxStream.Script, 0xffff]]);
    expect(mem(f)[UB_TURNS]).toBe(1);
    turn(f);
    expect(mem(f)[UB_TURNS]).toBe(2);
    turn(f);
    expect(mem(f)[UB_TURNS]).toBe(1); // the forced turn: 0, then up by one
  });
});

describe('the Arms\' regrowth: the test v11 > (draw mod 2) + 1 on every body turn with both Arms down (RE n 3.1; zzzz02_80 scene B 1)', () => {
  /** The counter after a body turn at `count`, over all 65,536 draws, with no Arm in the field (both down). */
  const after = (count: number): Record<number, number> => {
    const out: Record<number, number> = {};
    for (let raw = 0; raw < 0x10000; raw++) {
      const f = fakeArena({ boss: UB, raw });
      const ai = aiOf(f, UB);
      ai.memory[UB_REGROW] = count;
      ultimaBusterTurn(ai);
      const v = ai.memory[UB_REGROW] as number;
      out[v] = (out[v] ?? 0) + 1;
    }
    return out;
  };

  it('the first two turns never regrow them (the counter goes 0 to 1 to 2), the third does when the draw is even (32,768 of 65,536; the counter goes back to 0) and the fourth always (the counter was 3)', () => {
    expect(after(0)).toEqual({ 1: 65_536 });
    expect(after(1)).toEqual({ 2: 65_536 });
    expect(after(2)).toEqual({ 0: 32_768, 3: 32_768 });
    expect(after(3)).toEqual({ 0: 65_536 });
  });

  it('with an Arm standing the test is not run: no draw is taken for it and the counter stays', () => {
    const f = arena({ raw: 0 });
    turn(f);
    expect(mem(f)[UB_REGROW]).toBeUndefined();
    expect(f.draws).toEqual([[FfxStream.Script, 0xffff]]); // the coin alone
    const one = fakeArena({ boss: UB, extras: { [HEAD]: true, [ARMS[0]!]: false, [ARMS[1]!]: true } });
    expect([bothArmsDown(one.ctx), anArmLives(one.ctx), ultimaBusterArms(one.ctx).length]).toEqual([false, true, 2]);
  });
});

describe("the Head's cycle and the body's answer (RE n 3.1)", () => {
  const headTurn = (f: Fake): { row: string; targets: readonly string[] } => {
    const c = ultimaBusterHeadTurn(aiOf(f, HEAD));
    return { row: rowOf(c), targets: c?.targets ?? [] };
  };

  it('six Head turns: Special 1 on the body with the selector 1, nothing (the warning), Special 1 with the selector 2, again; the Head\'s state goes 1, 2, 3 and is published; the warning is a telegraph', () => {
    const f = arena();
    const out: Array<[string, unknown, unknown]> = [];
    for (let i = 0; i < 6; i++) {
      const t = headTurn(f);
      out.push([t.row === ROW.special1 ? `${t.row}->${t.targets.join('+')}` : t.row, f.ctx.state.flags[UB_RELAY_FLAG], f.ctx.state.flags[UB_HEAD_STATE_FLAG]]);
    }
    expect(out).toEqual([
      [`${ROW.special1}->${UB}`, 1, 2], ['(none)', 1, 3], [`${ROW.special1}->${UB}`, 2, 1],
      [`${ROW.special1}->${UB}`, 1, 2], ['(none)', 1, 3], [`${ROW.special1}->${UB}`, 2, 1],
    ]);
    expect(f.events.filter((e) => e.type === 'charge')).toHaveLength(2);
    expect(rtOf(f.ctx, HEAD).charge).toBeNull(); // the Contamination turn spends it
    expect(f.draws).toEqual([]); // no draw at all
  });

  it('a damaging hit on the Head after the warning (state 3) sets it back to state 1: the Contamination never comes; a hit in state 1 or 2, a heal, a miss, or a dead body changes nothing', () => {
    const hit = (state: number, lastDamage: number, bodyHp = 1000): number => {
      const f = arena();
      mem(f, HEAD)[UB_HEAD_STATE] = state;
      bossOf(f, UB).hp = bodyHp;
      ultimaBusterHeadOnHit(f.ctx, bossOf(f, HEAD), { def: {} as AbilityDef, user: bossOf(f, 'm0') }, { hpBefore: 100, lostHp: lastDamage > 0, lastDamage, affectsHp: true });
      return mem(f, HEAD)[UB_HEAD_STATE] as number;
    };
    expect([hit(3, 10), hit(3, 0), hit(3, -5), hit(2, 10), hit(1, 10), hit(3, 10, 0)]).toEqual([1, 3, 3, 2, 1, 3]);
    const f = arena();
    mem(f, HEAD)[UB_HEAD_STATE] = 3;
    f.ctx.state.flags[UB_HEAD_STATE_FLAG] = 3;
    ultimaBusterHeadOnHit(f.ctx, bossOf(f, HEAD), { def: {} as AbilityDef, user: bossOf(f, 'm0') }, { hpBefore: 100, lostHp: true, lastDamage: 10, affectsHp: true });
    expect(f.ctx.state.flags[UB_HEAD_STATE_FLAG]).toBe(1);
    expect(headTurn(f).row).toBe(ROW.special1);
    expect(f.ctx.state.flags[UB_RELAY_FLAG]).toBe(1); // the next Head turn is the Attack relay again
  });

  it('the body answers Special 1 in onTargeted: the selector 1 is an Attack at a random living member, 2 a Contamination, 0 nothing; a picker draw is taken whatever the selector says; the selector goes back to 0', () => {
    const answer = (selector: number, opts: Partial<FakeOptions> = {}): { queued: string[]; draws: unknown; relay: unknown } => {
      const f = arena({ pick: 2, ...opts });
      f.ctx.state.flags[UB_RELAY_FLAG] = selector;
      ultimaBusterOnTargeted(f.ctx, bossOf(f, UB), { def: { id: ROW.special1 } as AbilityDef, user: bossOf(f, HEAD) });
      return { queued: queuedRows(f), draws: f.draws, relay: f.ctx.state.flags[UB_RELAY_FLAG] };
    };
    expect(answer(1)).toEqual({ queued: [`${ROW.attack}->m2`], draws: [[FfxStream.Picker, 2]], relay: 0 });
    expect(answer(2)).toEqual({ queued: [`${ROW.contamination}->m2`], draws: [[FfxStream.Picker, 2]], relay: 0 });
    expect(answer(0)).toEqual({ queued: [], draws: [[FfxStream.Picker, 2]], relay: 0 });
    expect(answer(1, { living: 1 })).toEqual({ queued: [`${ROW.attack}->m0`], draws: [], relay: 0 });
    const f = arena();
    f.ctx.state.flags[UB_RELAY_FLAG] = 1;
    (bossOf(f, UB).statuses as Record<string, unknown>)['sleep'] = { id: 'sleep' };
    ultimaBusterOnTargeted(f.ctx, bossOf(f, UB), { def: { id: ROW.special1 } as AbilityDef, user: bossOf(f, HEAD) });
    expect(queuedRows(f)).toEqual([]); // a sleeper queues nothing
  });
});

describe('the gate: physical blows on the body while an Arm lives (the three cases: physical, magic, special), on the real engine', () => {
  const setup = (seed: number, armsDown: 0 | 1 | 2 = 0): { e: ReturnType<typeof newEngine>; ctx: ReturnType<typeof ctxOf>; body: FFXCombatant } => {
    const e = newEngine(seed, 'ultima-buster');
    const ctx = ctxOf(e);
    for (let i = 0; i < armsDown; i++) {
      const arm = actor(e, ARMS[i]!);
      arm.hp = 1;
      resolveAbility(ctx, actor(e, 'tidus'), ctx.content.ability('attack') as AbilityDef, [ARMS[i]!]);
      expect(arm.alive, ARMS[i]).toBe(false);
    }
    while (takeReaction(ctx) !== undefined);
    return { e, ctx, body: actor(e, UB) };
  };
  const writes = (seed: number, armsDown: 0 | 1 | 2, id: string, who = 'tidus'): { def: number; armored: boolean; defend: boolean; after: { def: number; armored: boolean; defend: boolean } } => {
    const { e, ctx, body } = setup(seed, armsDown);
    const used = { def: ctx.content.ability(id) as AbilityDef, user: actor(e, who) };
    ultimaBusterOnTargeted(ctx, body, used);
    const now = { def: body.stats.def, armored: body.immunityFlags.includes('armored'), defend: body.statuses['defend'] !== undefined };
    ultimaBusterOnHit(ctx, body);
    return { ...now, after: { def: body.stats.def, armored: body.immunityFlags.includes('armored'), defend: body.statuses['defend'] !== undefined } };
  };
  const blow = (seed: number, armsDown: 0 | 1 | 2, who: string, id: string): number[] => {
    const { e, ctx } = setup(seed, armsDown);
    const m = e.state().log.length;
    resolveAbility(ctx, actor(e, who), ctx.content.ability(id) as AbilityDef, [UB]);
    return e.state().log.slice(m).flatMap((x) => (x.type === 'damage' && x.targetId === UB ? [x.amount] : []));
  };

  it('which commands the gate catches: those that affect HP with the physical damage type (1; 3 would too): Attack, Quick Hit, the Delay and Break moves; never a spell, an Overdrive, Lancet or an item', () => {
    const e = newEngine(1, 'ultima-buster');
    const ctx = ctxOf(e);
    const caught = (id: string): boolean => gateCatches({ def: ctx.content.ability(id) as AbilityDef, user: actor(e, 'tidus') });
    for (const id of ['attack', 'quick-hit', 'delay-attack', 'delay-buster']) expect(caught(id), id).toBe(true);
    for (const id of ['firaga', 'flare', 'ultima', 'curaga', 'slice-and-dice', 'dragon-fang', 'lancet', 'protect', 'slow', 'scan']) expect(caught(id), id).toBe(false);
  });

  it('PHYSICAL: with both Arms alive, or one alive, the body is written Defense 255, Armored and Defend for that command; with both down, Defense 0 and none of them', () => {
    expect(writes(1, 0, 'attack')).toMatchObject({ def: 255, armored: true, defend: true });
    expect(writes(1, 1, 'attack')).toMatchObject({ def: 255, armored: true, defend: true });
    expect(writes(1, 2, 'attack')).toMatchObject({ def: 0, armored: false, defend: false });
  });

  it('MAGIC: a spell writes Defense 0 and nothing else, Arms or no Arms', () => {
    for (const down of [0, 1, 2] as const) expect(writes(1, down, 'firaga'), `${down} arms down`).toMatchObject({ def: 0, armored: false, defend: false });
  });

  it('SPECIAL: an Overdrive or a Lancet writes Defense 0 and nothing else, Arms or no Arms', () => {
    for (const down of [0, 2] as const) {
      expect(writes(1, down, 'slice-and-dice'), `Overdrive, ${down} arms down`).toMatchObject({ def: 0, armored: false, defend: false });
      expect(writes(1, down, 'lancet', 'kimahri'), `Lancet, ${down} arms down`).toMatchObject({ def: 0, armored: false, defend: false });
    }
  });

  it('after the hit, whatever the command: Defense 50, Armored and Defend off', () => {
    for (const id of ['attack', 'firaga', 'slice-and-dice']) expect(writes(2, 0, id).after, id).toEqual({ def: 50, armored: false, defend: false });
  });

  it('the damage the same action does follows what was written: Tidus\'s Attack is about 3,000 with an Arm alive and 99,999 (the cap) with both down; a spell (Firaga) and an Overdrive do the same either way', () => {
    const gated = blow(3, 0, 'tidus', 'attack')[0] as number;
    const open = blow(3, 2, 'tidus', 'attack')[0] as number;
    expect(open).toBe(99_999);
    expect(gated).toBeGreaterThan(2_000);
    expect(gated).toBeLessThan(4_000); // DEF 255 (18,167 to 20,438 alone), a third for Armored, half for Defend
    const oneDown = blow(3, 1, 'tidus', 'attack')[0] as number;
    expect(oneDown).toBeGreaterThan(2_000); // one Arm is enough
    expect(oneDown).toBeLessThan(4_000);
    // A spell and an Overdrive are not caught: the same numbers whether the Arms stand or not (the same seed, the Arms' deaths drawn nothing the spell reads).
    for (const [who, id] of [['tidus', 'firaga'], ['auron', 'dragon-fang'], ['auron', 'banishing-blade']] as const) {
      const withArms = blow(3, 0, who, id);
      const without = blow(3, 2, who, id);
      expect(withArms.length, id).toBe(without.length);
      for (let i = 0; i < withArms.length; i++) expect(Math.abs((withArms[i] as number) - (without[i] as number)), id).toBeLessThan(0.15 * (withArms[i] as number) + 1);
    }
    expect(blow(3, 0, 'tidus', 'firaga')[0]).toBeGreaterThan(50_000);
    expect(blow(3, 0, 'auron', 'attack')[0] as number).toBeGreaterThan(gated); // Auron's Piercing ignores the Armor
  });
});

describe('the real engine: act 9', () => {
  const body = (e: ReturnType<typeof newEngine>): FFXCombatant => actor(e, UB);

  it('it starts as the record says: the body 5,000,000 HP, Defense 60, Agility 72; the Head and two Arms 80,000 each, Armored, parts of the body; the relay and the Head\'s state published', () => {
    const e = newEngine(1, 'ultima-buster');
    expect([body(e).hp, body(e).stats.def, body(e).stats.agi]).toEqual([5_000_000, 60, 72]);
    for (const id of [HEAD, ...ARMS]) {
      const p = actor(e, id);
      expect([p.hp, p.immunityFlags.includes('armored'), p.flags.isPart, p.flags.partOf], id).toEqual([80_000, true, true, UB]);
    }
    expect([flags(e)[UB_RELAY_FLAG], flags(e)[UB_HEAD_STATE_FLAG]]).toEqual([0, 1]);
    expect(rtOf(ctxOf(e), ARMS[0]!).ordersOnly).toBe(true);
    expect(rtOf(ctxOf(e), ARMS[1]!).ordersOnly).toBe(true);
    expect(rtOf(ctxOf(e), HEAD).ordersOnly).not.toBe(true);
  });

  /** Play defend-only inputs until `done`, the party kept whole (its Breaks lifted each input: an Ultima on a Mental Break is 40,000 a member). */
  const idle = (e: ReturnType<typeof newEngine>, done: () => boolean, max = 3000): void => {
    for (let i = 0; i < max && !done(); i++) {
      for (const id of e.state().activeIds) {
        const m = actor(e, id);
        m.hp = m.stats.maxHp;
        delete m.statuses['mental-break'];
        delete m.statuses['armor-break'];
      }
      const d = e.nextDecision();
      if (d.kind === 'battle-over') return;
      if (d.kind === 'player-input') e.submit({ kind: 'defend', targets: [] });
    }
  };
  const turnsOf = (e: ReturnType<typeof newEngine>, id: string): number => e.state().log.filter((x) => x.type === 'turn-start' && x.actorId === id).length;

  it('the Arms take no turn and the Head does: over a stretch of the clock the log has turn starts for the body and the Head and none for either Arm', () => {
    const e = newEngine(2, 'ultima-buster');
    idle(e, () => turnsOf(e, UB) >= 6);
    expect(turnsOf(e, UB)).toBeGreaterThanOrEqual(6);
    expect(turnsOf(e, HEAD)).toBeGreaterThanOrEqual(3);
    expect(turnsOf(e, ARMS[0]!) + turnsOf(e, ARMS[1]!)).toBe(0);
  });

  it('the Head\'s turns on the real engine: Special 1 on the body, then the body\'s own Attack at a member as a free action of its own (cause script); the warning turn; Special 1 again, then the Contamination', () => {
    const e = newEngine(3, 'ultima-buster');
    idle(e, () => turnsOf(e, HEAD) >= 6);
    const log = e.state().log;
    // The move the body answers each of the Head's actions with: the first `counter` of the body's after the Head's action-start and before the next action-start.
    const relayed: string[] = [];
    log.forEach((x, i) => {
      if (x.type !== 'action-start' || x.actorId !== HEAD) return;
      for (let j = i + 1; j < log.length; j++) {
        const y = log[j]!;
        if (y.type === 'action-start' && y.actorId !== UB) break;
        if (y.type === 'counter' && y.actorId === UB && y.cause === 'script') {
          relayed.push(y.abilityId);
          break;
        }
      }
    });
    expect(relayed.slice(0, 4)).toEqual([ROW.attack, ROW.contamination, ROW.attack, ROW.contamination]);
    expect(actions(log, HEAD).length).toBeGreaterThanOrEqual(4); // the warning turns queue nothing: six Head turns are four actions
    expect(actions(log, HEAD).every((a) => a === ROW.special1)).toBe(true);
  });

  it('a damaging blow on the Head during its warning cancels the Contamination: the next relayed move is an Attack again', () => {
    const e = newEngine(4, 'ultima-buster');
    const ctx = ctxOf(e);
    idle(e, () => flags(e)[UB_HEAD_STATE_FLAG] === 3);
    expect(flags(e)[UB_HEAD_STATE_FLAG]).toBe(3);
    resolveAbility(ctx, actor(e, 'tidus'), ctx.content.ability('attack') as AbilityDef, [HEAD]);
    expect(flags(e)[UB_HEAD_STATE_FLAG]).toBe(1);
    const before = e.state().log.length;
    idle(e, () => e.state().log.slice(before).some((x) => x.type === 'counter' && x.actorId === UB && x.cause === 'script' && (x.abilityId === ROW.attack || x.abilityId === ROW.contamination)));
    const first = e.state().log.slice(before).find((x) => x.type === 'counter' && x.actorId === UB && x.cause === 'script' && (x.abilityId === ROW.attack || x.abilityId === ROW.contamination));
    expect(first?.type === 'counter' ? first.abilityId : '').toBe(ROW.attack);
  });

  it('the Arms regrow on the body\'s third or fourth turn after both are down (both come back at 80,000 HP, a message, `part-restored` for each), and the Head does not', () => {
    const regrowAt: number[] = [];
    for (let seed = 1; seed <= 14; seed++) {
      const e = newEngine(seed, 'ultima-buster');
      const ctx = ctxOf(e);
      for (const id of [...ARMS, HEAD]) {
        actor(e, id).hp = 1;
        resolveAbility(ctx, actor(e, 'tidus'), ctx.content.ability('attack') as AbilityDef, [id]);
      }
      while (takeReaction(ctx) !== undefined);
      expect([actor(e, ARMS[0]!).alive, actor(e, ARMS[1]!).alive, actor(e, HEAD).alive]).toEqual([false, false, false]);
      const start = turnsOf(e, UB);
      const mark = e.state().log.length;
      idle(e, () => e.state().log.slice(mark).filter((x) => x.type === 'part-restored').length >= 2, 4000);
      const restored = e.state().log.slice(mark).filter((x) => x.type === 'part-restored');
      expect(restored.map((x) => (x.type === 'part-restored' ? x.partId : '')).sort(), `seed ${seed}`).toEqual([...ARMS].sort());
      regrowAt.push(turnsOf(e, UB) - start);
      for (const id of ARMS) expect([actor(e, id).alive, actor(e, id).hp, actor(e, id).removed], `${id} seed ${seed}`).toEqual([true, 80_000, false]);
      expect(actor(e, HEAD).alive, 'the Head stays down').toBe(false);
    }
    expect(new Set(regrowAt)).toEqual(new Set([3, 4]));
  });

  it('the fight ends with the body: set to 1 HP with the Head and both Arms alive, one spell wins it', () => {
    const e = newEngine(5, 'ultima-buster');
    const ctx = ctxOf(e);
    body(e).hp = 1;
    resolveAbility(ctx, actor(e, 'tidus'), ctx.content.ability('firaga') as AbilityDef, [UB]);
    for (let i = 0; i < 50; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') {
        expect(d.result.outcome).toBe('victory');
        expect([actor(e, HEAD).alive, actor(e, ARMS[0]!).alive, actor(e, ARMS[1]!).alive]).toEqual([true, true, true]);
        return;
      }
      if (d.kind === 'player-input') e.submit({ kind: 'defend', targets: [] });
    }
    throw new Error('the battle did not end');
  });

  it('the Purifying Salt and every other item go through the gate like a special: Defense 0 (no Arm matters)', () => {
    const e = newEngine(6, 'ultima-buster');
    const ctx = ctxOf(e);
    ultimaBusterOnTargeted(ctx, body(e), { def: ITEMS['purifying-salt']!.effect as AbilityDef, user: actor(e, 'tidus') });
    expect([body(e).stats.def, body(e).immunityFlags.includes('armored')]).toEqual([0, false]);
  });

  it('seeds 1, 2 and 3: the careless line (Attack at the body) loses -- the gated blows are 3,000 each and it takes Ultimas; the advisor\'s line wins; replaying a seed gives the same digest', () => {
    const digests: string[] = [];
    for (const seed of [1, 2, 3]) {
      const c = playOne(seed, 'ultima-buster', careless);
      const c2 = playOne(seed, 'ultima-buster', careless);
      expect(c.outcome, `careless seed ${seed}`).toBe('defeat');
      expect(c.digest).toBe(c2.digest);
      const a = playOne(seed, 'ultima-buster', advisorLine);
      const a2 = playOne(seed, 'ultima-buster', advisorLine);
      expect(a.outcome, `advisor seed ${seed}`).toBe('victory');
      expect(a.digest).toBe(a2.digest);
      digests.push(c.digest, a.digest);
    }
    expect(new Set(digests).size).toBe(6);
  });
});
