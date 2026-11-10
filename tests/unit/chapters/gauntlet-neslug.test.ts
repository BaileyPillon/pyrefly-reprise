/**
 * **Neslug against the note** (`research/re-ffx-monster-arena-creations.md` 3.2, "RE n"; FFX only; the hidden Gauntlet chapter's act 8): every branch and number of its script (`src/battle/ffx/ai/gauntlet-neslug.ts`) pinned on a
 * **fake context** (the three-way mix over all 65,536 draws, the picks and the draws they take, the Valefor branch and its stale target, the shell turn and its boundaries, the hit that moves it from state to state with the writes it
 * makes, the preTurn path, the Purifying Salt), then the real engine: the shell stops every physical blow and lets a spell through, Regen and Curaga bring it back, the broken shell is faster on the clock, three seeds on two lines
 * (a line without magic never wins: the engine ends the stalemate).
 */
import { describe, expect, it } from 'vitest';

import type { AbilityDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import { resolveAbility } from '../../../src/battle/ffx/abilities.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import {
  NESLUG_BROKEN_AGI, NESLUG_HIDE_PENDING, NESLUG_MIX_MODULO, NESLUG_MOTION, NESLUG_SALT_ROW, NESLUG_STATE, NESLUG_TARGET, neslugHalf, neslugMixTurn, neslugOnHit, neslugPreTurn, neslugQuarter,
  neslugThreeQuarters, neslugTurn,
} from '../../../src/battle/ffx/ai/gauntlet-neslug.ts';
import { GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, NESLUG_STATE_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import { peekReactions, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { actorNumber } from '../../../src/battle/ffx/ai/game-rolls.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { ITEMS } from '../../../src/data/ffx/index.ts';
import * as TACTIC from '../../../src/engine/tactics/gauntlet.ts';
import { type Fake, type FakeOptions, aiOf, bossOf, fakeArena, rowOf, tally } from '../helpers/gauntletFake.ts';
import { actions, actor, careless, ctxOf, flags, newEngine, playOne, turnActions } from '../helpers/gauntletDrive.ts';
import { advisorLine } from '../helpers/gauntletBench.ts';

const NES = GAUNTLET_IDS.neslug;
const MAX = 4_000_000;

/** A fake battle with Neslug (the fake's maximum HP is 1,000: a quarter is 250, a half 500, three quarters 750). */
const arena = (opts: Partial<FakeOptions> = {}): Fake => {
  const f = fakeArena({ boss: NES, ...opts });
  bossOf(f, NES).name = 'Neslug';
  bossOf(f, NES).stats.agi = 43;
  return f;
};
const mem = (f: Fake): Record<string, number | string | boolean> => rtOf(f.ctx, NES).ai;
const party = (f: Fake, id: string): FFXCombatant => f.ctx.state.combatants[id] as FFXCombatant;
const turn = (f: Fake): { row: string; targets: readonly string[] } => {
  const c = neslugTurn(aiOf(f, NES));
  return { row: rowOf(c), targets: c?.targets ?? [] };
};
const mixOf = (opts: Partial<FakeOptions> = {}, setup: (f: Fake) => void = () => undefined): Record<string, number> =>
  tally(NES, neslugMixTurn, opts, (f) => {
    setup(f);
  });
const hitWith = (f: Fake, hp: number, defId = 'attack'): void => {
  bossOf(f, NES).hp = hp;
  neslugOnHit(f.ctx, bossOf(f, NES), { def: { id: defId } as AbilityDef, user: party(f, 'm0') }, { hpBefore: 1000, lostHp: true, lastDamage: 10, affectsHp: true });
};
const queued = (f: Fake): string[] => peekReactions(f.ctx).flatMap((r) => (r.kind === 'command' ? [`${rowOf(r.command)}${r.forced ? '(forced)' : ''}`] : []));
const drain = (f: Fake): void => {
  while (takeReaction(f.ctx) !== undefined);
};

describe('registered under the id the data names; the constants of the bytes', () => {
  it('the AI script, the three fractions of the maximum in integers, the broken shell\'s Agility, the salt, the draw modulo', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.neslug)).toBeDefined();
    expect(GAUNTLET_SCRIPTS.neslug).toBe('gauntlet-neslug');
    expect([neslugQuarter(MAX), neslugHalf(MAX), neslugThreeQuarters(MAX)]).toEqual([1_000_000, 2_000_000, 3_000_000]);
    expect([neslugQuarter(1000), neslugHalf(1000), neslugThreeQuarters(1000)]).toEqual([250, 500, 750]);
    expect([neslugQuarter(7), neslugHalf(7), neslugThreeQuarters(7)]).toEqual([1, 3, 5]); // maxHP * 1 / 4, * 1 / 2, * 3 / 4 in integers
    expect([NESLUG_BROKEN_AGI, NESLUG_SALT_ROW, NESLUG_MIX_MODULO]).toEqual([120, 'purifying-salt', 3]);
  });

  it('the tactic\'s restated flag is the script\'s', () => {
    expect(TACTIC.NESLUG_STATE_FLAG).toBe(NESLUG_STATE_FLAG);
    expect(TACTIC.NESLUG_IN_SHELL).toBe(1);
  });
});

describe('the mix of states 0 and 2: one draw modulo 3 (RE n 3.2)', () => {
  it('over all 65,536 values: 21,846 Attack, 21,845 Megaton, 21,845 Slime (exact), in the out state and in the broken shell alike', () => {
    expect(mixOf()).toEqual({ [ROW.neslugAttack]: 21_846, [ROW.megaton]: 21_845, [ROW.slime]: 21_845 });
    const broken = tally(NES, neslugTurn, {}, (f) => void (mem(f)[NESLUG_STATE] = 2));
    expect(broken).toEqual({ [ROW.neslugAttack]: 21_846, [ROW.megaton]: 21_845, [ROW.slime]: 21_845 });
  });

  it('by residue: 0 Attack, 1 Megaton, 2 Slime on the whole living front line', () => {
    const at = (raw: number): { row: string; targets: readonly string[] } => {
      const f = arena({ raw, pick: 1 });
      return turn(f);
    };
    expect([at(0).row, at(1).row, at(2).row, at(3).row]).toEqual([ROW.neslugAttack, ROW.megaton, ROW.slime, ROW.neslugAttack]);
    expect(at(2).targets).toEqual(['m0', 'm1', 'm2']);
    expect(at(1).targets).toEqual(['m1']); // one random living member: the picker's second
  });

  it('the Attack goes to the front-line member with the most MP; a tie takes a second picker draw after the first, whose pick the game drops', () => {
    const f = arena({ raw: 0 });
    party(f, 'm0').mp = 100;
    party(f, 'm1').mp = 500;
    party(f, 'm2').mp = 300;
    expect(turn(f)).toEqual({ row: ROW.neslugAttack, targets: ['m1'] });
    expect(f.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]); // `findMatchingChr(front, alive)`: three candidates, one draw dropped; the MP pick finds one
    expect(mem(f)[NESLUG_TARGET]).toBe(actorNumber(f.ctx, 'm1')); // v0 is the picked actor's number (m1 is no numbered actor of the game: the engine's stand-in)
    const tie = arena({ raw: 0, pick: 1 });
    party(tie, 'm0').mp = 500;
    party(tie, 'm2').mp = 500;
    party(tie, 'm1').mp = 100;
    expect(turn(tie)).toEqual({ row: ROW.neslugAttack, targets: ['m2'] }); // m0 and m2 tie on 500: the second draw picks the second of them
    expect(tie.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2], [FfxStream.Picker, 1]]);
  });

  it('the dead are not targets: with one standing the Attack and the Megaton draw nothing but the mod', () => {
    for (const raw of [0, 1]) {
      const f = arena({ raw, living: 1 });
      expect(turn(f).targets).toEqual(['m0']);
      expect(f.draws).toEqual([[FfxStream.Script, 0xffff]]);
    }
  });

  it('Slime needs a member who is not slowed; its two findMatchingChr calls each draw over the same matched set; everybody slowed makes it Attack instead (the highest MP)', () => {
    const f = arena({ raw: 2, pick: 1 });
    turn(f);
    expect(f.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2], [FfxStream.Picker, 2]]);
    const one = arena({ raw: 2, pick: 1 });
    (party(one, 'm0').statuses as Record<string, unknown>)['slow'] = { id: 'slow' };
    (party(one, 'm1').statuses as Record<string, unknown>)['slow'] = { id: 'slow' };
    expect(turn(one)).toEqual({ row: ROW.slime, targets: ['m0', 'm1', 'm2'] }); // one unslowed member is enough; the Slime goes on everybody
    expect(one.draws).toEqual([[FfxStream.Script, 0xffff]]); // one candidate: no draw at all
    const all = arena({ raw: 2, pick: 0 });
    for (const id of ['m0', 'm1', 'm2']) (party(all, id).statuses as Record<string, unknown>)['slow'] = { id: 'slow' };
    party(all, 'm2').mp = 999;
    party(all, 'm0').mp = 10;
    party(all, 'm1').mp = 10;
    expect(turn(all)).toEqual({ row: ROW.neslugAttack, targets: ['m2'] });
    expect(all.draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]); // the Attack's first findMatchingChr over the three living; no unslowed set was drawn from
  });

  it('with Valefor in the front line the Megaton draw is an Attack at v0, the last target it picked (no new pick; the actor 8 test comes before the pick); a lost turn when that actor is not a living front-line target', () => {
    const f = arena({ raw: 1, aeon: true });
    expect(turn(f)).toEqual({ row: '(none)', targets: [] }); // v0 starts at 0 (Tidus), who is not in the field now
    expect(f.draws).toEqual([[FfxStream.Script, 0xffff]]); // one candidate (Valefor): no picker draw
    mem(f)[NESLUG_TARGET] = 8; // it last picked Valefor
    expect(turn(f)).toEqual({ row: ROW.neslugAttack, targets: ['valefor'] });
    mem(f)[NESLUG_TARGET] = 255; // its last pick found nobody
    expect(turn(f).row).toBe('(none)');
    const off = arena({ raw: 1 });
    expect(turn(off).row).toBe(ROW.megaton); // no Valefor: the Megaton
  });
});

describe('the shell turn (state 1): Curaga on itself until its HP is above three quarters, then it Emerges (RE n 3.2)', () => {
  it('at or below 3/4 (strictly: 750 of 1,000 is not above it) it casts Curaga on itself and nothing is written; above, it Emerges: NullPhysical and Regen off, state 0', () => {
    const f = arena();
    mem(f)[NESLUG_STATE] = 1;
    bossOf(f, NES).hp = 750;
    expect(turn(f)).toEqual({ row: ROW.curaga, targets: [NES] });
    bossOf(f, NES).hp = 751;
    bossOf(f, NES).immunityFlags = ['immune-to-physical-damage'];
    (bossOf(f, NES).statuses as Record<string, unknown>)['regen'] = { id: 'regen', permanent: true };
    expect(turn(f)).toEqual({ row: ROW.emergesFromShell, targets: [NES] });
    expect(bossOf(f, NES).immunityFlags).toEqual([]);
    expect(Object.keys(bossOf(f, NES).statuses)).not.toContain('regen');
    expect([mem(f)[NESLUG_STATE], f.ctx.state.flags[NESLUG_STATE_FLAG], mem(f)[NESLUG_MOTION]]).toEqual([0, 0, 0]);
    expect(f.draws).toEqual([]); // the shell turn takes no draw
  });
});

describe('what a hit does to it (after the damage, before the death check; RE n 3.2)', () => {
  it('state 0, HP below 1/2 (strictly): a forced Hides in shell., NullPhysical on, Regen 255 permanent, state 1; at exactly half nothing', () => {
    const f = arena();
    hitWith(f, 500);
    expect(queued(f)).toEqual([]);
    expect(mem(f)[NESLUG_STATE]).toBeUndefined();
    hitWith(f, 499);
    expect(queued(f)).toEqual([`${ROW.hidesInShell}(forced)`]);
    expect(bossOf(f, NES).immunityFlags).toEqual(['immune-to-physical-damage']);
    expect(bossOf(f, NES).statuses['regen']).toMatchObject({ id: 'regen', turnsRemaining: 255, permanent: true });
    expect([mem(f)[NESLUG_STATE], f.ctx.state.flags[NESLUG_STATE_FLAG], mem(f)[NESLUG_MOTION]]).toEqual([1, 1, 1]);
  });

  it('state 0, HP below 1/4 in one blow: it skips the shell: a forced Broken shell. only, Agility 120, nothing on, state 2; at exactly a quarter it goes into the shell instead', () => {
    const f = arena();
    hitWith(f, 249);
    expect(queued(f)).toEqual([`${ROW.brokenShell}(forced)`]);
    expect(bossOf(f, NES).stats.agi).toBe(120);
    expect(bossOf(f, NES).immunityFlags).toEqual([]);
    expect(Object.keys(bossOf(f, NES).statuses)).not.toContain('regen');
    expect([mem(f)[NESLUG_STATE], f.ctx.state.flags[NESLUG_STATE_FLAG]]).toEqual([2, 2]);
    const q = arena();
    hitWith(q, 250);
    expect(queued(q)).toEqual([`${ROW.hidesInShell}(forced)`]);
  });

  it('state 1, HP below 1/4: a forced Emerges from shell. and, behind it, a forced Broken shell.; NullPhysical and Regen off; Agility 120; state 2; at exactly a quarter nothing', () => {
    const f = arena();
    hitWith(f, 400);
    drain(f);
    hitWith(f, 250);
    expect(queued(f)).toEqual([]);
    expect(mem(f)[NESLUG_STATE]).toBe(1);
    hitWith(f, 249);
    expect(queued(f)).toEqual([`${ROW.emergesFromShell}(forced)`, `${ROW.brokenShell}(forced)`]);
    expect(bossOf(f, NES).immunityFlags).toEqual([]);
    expect(Object.keys(bossOf(f, NES).statuses)).not.toContain('regen');
    expect([bossOf(f, NES).stats.agi, mem(f)[NESLUG_STATE], mem(f)[NESLUG_MOTION]]).toEqual([120, 2, 0]);
  });

  it('state 1, HP in the shell range: nothing (a hit above a quarter changes nothing in the shell, even one that heals it)', () => {
    const f = arena();
    hitWith(f, 400);
    drain(f);
    hitWith(f, 300);
    hitWith(f, 900);
    expect(queued(f)).toEqual([]);
    expect(mem(f)[NESLUG_STATE]).toBe(1);
  });

  it('the broken shell (state 2): a hit by command 0x203F, the Purifying Salt, sets Defense and Magic Defense to 1 for good; any other command does nothing; and in states 0 and 1 the salt does nothing', () => {
    const f = arena();
    hitWith(f, 100);
    drain(f);
    hitWith(f, 90, 'attack');
    expect([bossOf(f, NES).stats.def, bossOf(f, NES).stats.mdef]).toEqual([50, 50]);
    hitWith(f, 80, NESLUG_SALT_ROW);
    expect([bossOf(f, NES).stats.def, bossOf(f, NES).stats.mdef]).toEqual([1, 1]);
    const out = arena();
    hitWith(out, 900, NESLUG_SALT_ROW);
    expect([bossOf(out, NES).stats.def, bossOf(out, NES).stats.mdef]).toEqual([50, 50]);
    const shell = arena();
    hitWith(shell, 400);
    hitWith(shell, 390, NESLUG_SALT_ROW);
    expect([bossOf(shell, NES).stats.def, bossOf(shell, NES).stats.mdef]).toEqual([50, 50]);
  });

  it('the blow that kills it (HP 0) changes nothing', () => {
    const f = arena();
    hitWith(f, 0);
    expect(queued(f)).toEqual([]);
    expect(mem(f)[NESLUG_STATE]).toBeUndefined();
  });
});

describe('the preTurn path (v5): below half, not below a quarter, the shell animation not playing: its turn is spent on Hides in shell. and writes nothing else', () => {
  it('HP 499 with state 0 and no motion: the next turn is the row alone (no NullPhysical, no Regen, state still 0); HP exactly half, below a quarter, or the motion already 1: no', () => {
    const at = (hp: number, motion = 0): boolean => {
      const f = arena();
      bossOf(f, NES).hp = hp;
      mem(f)[NESLUG_MOTION] = motion;
      neslugPreTurn(f.ctx, bossOf(f, NES));
      return mem(f)[NESLUG_HIDE_PENDING] === 1;
    };
    expect([at(499), at(250), at(500), at(249), at(499, 1)]).toEqual([true, true, false, false, false]);
    const f = arena({ raw: 0 });
    bossOf(f, NES).hp = 499;
    neslugPreTurn(f.ctx, bossOf(f, NES));
    expect(turn(f)).toEqual({ row: ROW.hidesInShell, targets: [NES] });
    expect(f.draws).toEqual([]);
    expect([mem(f)[NESLUG_HIDE_PENDING], mem(f)[NESLUG_MOTION], mem(f)[NESLUG_STATE]]).toEqual([0, 1, undefined]);
    expect(bossOf(f, NES).immunityFlags).toEqual([]);
    expect(turn(f).row).toBe(ROW.neslugAttack); // the next turn is the ordinary mix again
  });
});

describe('the real engine: act 8', () => {
  const neslug = (e: ReturnType<typeof newEngine>): FFXCombatant => actor(e, NES);
  /** The party hits (the engine's own resolver): the damage numbers dealt to Neslug. */
  const blow = (e: ReturnType<typeof newEngine>, who: string, id: string): number[] => {
    const ctx = ctxOf(e);
    const m = e.state().log.length;
    resolveAbility(ctx, actor(e, who), ctx.content.ability(id) as AbilityDef, [NES]);
    return e.state().log.slice(m).flatMap((x) => (x.type === 'damage' && x.targetId === NES ? [x.amount] : []));
  };
  const flush = (e: ReturnType<typeof newEngine>): void => {
    const ctx = ctxOf(e);
    while (takeReaction(ctx) !== undefined);
  };

  it('it starts out: 4,000,000 HP, Agility 43, no Regen, no shell; a plain blow of Tidus hurts it', () => {
    const e = newEngine(1, 'neslug');
    expect([neslug(e).hp, neslug(e).stats.agi, flags(e)[NESLUG_STATE_FLAG]]).toEqual([4_000_000, 43, 0]);
    expect(neslug(e).immunityFlags).not.toContain('immune-to-physical-damage');
    expect(blow(e, 'tidus', 'attack')[0]).toBeGreaterThan(50_000);
  });

  it('a spell that takes it under half puts it in its shell: a forced Hides in shell., NullPhysical, a permanent Regen; then a physical blow does 0 and a spell does not', () => {
    const e = newEngine(2, 'neslug');
    neslug(e).hp = 2_000_001;
    const m = e.state().log.length;
    blow(e, 'tidus', 'firaga');
    flush(e);
    expect(neslug(e).hp).toBeLessThan(2_000_000);
    expect(flags(e)[NESLUG_STATE_FLAG]).toBe(1);
    expect(neslug(e).immunityFlags).toContain('immune-to-physical-damage');
    expect(neslug(e).statuses['regen']).toMatchObject({ permanent: true, turnsRemaining: 255 });
    expect(e.state().log.slice(m).some((x) => x.type === 'status-add' && x.targetId === NES && x.status === 'regen')).toBe(true);
    expect(blow(e, 'tidus', 'attack')).toEqual([0]);
    expect(blow(e, 'auron', 'attack')).toEqual([0]);
    expect(blow(e, 'tidus', 'firaga')[0]).toBeGreaterThan(50_000);
    expect(blow(e, 'tidus', 'dragon-fang')[0] ?? 0).toBeGreaterThan(0); // an Overdrive is a special: it goes through the shell as well
  });

  it('in the shell its own turns are Curaga (and nothing else) and its HP climbs; once it is above 3/4 of the maximum it Emerges and a physical blow hurts again', () => {
    const e = newEngine(3, 'neslug');
    neslug(e).hp = 2_900_000;
    blow(e, 'tidus', 'attack'); // standing: under half is not true, so no shell; put it in by hand through the script
    flush(e);
    neslug(e).hp = 1_900_000;
    blow(e, 'tidus', 'firaga');
    flush(e);
    expect(flags(e)[NESLUG_STATE_FLAG]).toBe(1);
    let steps = 0;
    for (let i = 0; i < 3000 && steps < 400 && flags(e)[NESLUG_STATE_FLAG] === 1; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      for (const id of e.state().activeIds) actor(e, id).hp = actor(e, id).stats.maxHp;
      e.submit({ kind: 'defend', targets: [] });
      steps++;
    }
    const own = actions(e.state().log, NES);
    expect(own.length).toBeGreaterThan(0);
    expect(new Set(own.filter((a) => a !== ROW.hidesInShell && a !== ROW.emergesFromShell))).toEqual(new Set(['curaga']));
    expect(neslug(e).hp).toBeGreaterThan(2_000_000);
    expect(flags(e)[NESLUG_STATE_FLAG]).toBe(0); // it came out
    expect(own).toContain(ROW.emergesFromShell);
    expect(neslug(e).immunityFlags).not.toContain('immune-to-physical-damage');
    expect(Object.keys(neslug(e).statuses)).not.toContain('regen');
    expect(blow(e, 'tidus', 'attack')[0]).toBeGreaterThan(0);
  });

  it('under a quarter from the shell: the Emerges and the Broken shell. rows run in that order, Agility 120, nothing on; a plain blow hurts it and its Agility is on the real clock', () => {
    const e = newEngine(4, 'neslug');
    neslug(e).hp = 1_900_000;
    blow(e, 'tidus', 'firaga');
    flush(e);
    neslug(e).hp = 1_000_100;
    const m = e.state().log.length;
    blow(e, 'tidus', 'firaga');
    const rows = peekReactions(ctxOf(e)).flatMap((r) => (r.kind === 'command' ? [rowOf(r.command)] : []));
    flush(e);
    expect(rows).toEqual([ROW.emergesFromShell, ROW.brokenShell]);
    expect([neslug(e).stats.agi, flags(e)[NESLUG_STATE_FLAG]]).toEqual([120, 2]);
    expect(neslug(e).immunityFlags).not.toContain('immune-to-physical-damage');
    expect(Object.keys(neslug(e).statuses)).not.toContain('regen');
    expect(e.state().log.slice(m).length).toBeGreaterThan(0);
    /** The clock's ticks until Neslug has taken 12 turns, the party kept whole (its Breaks lifted each input: a Slime on a Mental Break is 40,000 a member). */
    const ticksFor12Turns = (broken: boolean): number => {
      const eng = newEngine(8, 'neslug');
      if (broken) {
        neslug(eng).hp = 900_000;
        blow(eng, 'tidus', 'attack');
        while (takeReaction(ctxOf(eng)) !== undefined);
      }
      for (let i = 0; i < 4000 && eng.state().log.filter((x) => x.type === 'turn-start' && x.actorId === NES).length < 12; i++) {
        for (const id of eng.state().activeIds) {
          const m = actor(eng, id);
          m.hp = m.stats.maxHp;
          delete m.statuses['mental-break'];
          delete m.statuses['armor-break'];
        }
        neslug(eng).hp = Math.max(neslug(eng).hp, broken ? 500_000 : 3_900_000);
        const d = eng.nextDecision();
        if (d.kind === 'player-input') eng.submit({ kind: 'defend', targets: [] });
        if (d.kind === 'battle-over') break;
      }
      return eng.state().ticks;
    };
    expect(ticksFor12Turns(true)).toBeLessThan(ticksFor12Turns(false));
  });

  it('a blow from above half to below a quarter at once skips the shell (the Broken shell. row alone)', () => {
    const e = newEngine(5, 'neslug');
    neslug(e).hp = 1_000_100;
    blow(e, 'tidus', 'attack');
    const rows = peekReactions(ctxOf(e)).flatMap((r) => (r.kind === 'command' ? [rowOf(r.command)] : []));
    flush(e);
    expect(rows).toEqual([ROW.brokenShell]);
    expect([neslug(e).stats.agi, flags(e)[NESLUG_STATE_FLAG]]).toEqual([120, 2]);
  });

  it('the Purifying Salt on the broken shell takes its Defense and Magic Defense to 1, and a plain blow then does more; on the shell or standing it does not', () => {
    const salt = ITEMS['purifying-salt']!.effect as AbilityDef;
    const e = newEngine(6, 'neslug');
    const ctx = ctxOf(e);
    neslug(e).hp = 3_000_000;
    resolveAbility(ctx, actor(e, 'tidus'), salt, [NES]);
    flush(e);
    expect([neslug(e).stats.def, neslug(e).stats.mdef]).toEqual([80, 80]);
    neslug(e).hp = 900_000;
    blow(e, 'tidus', 'attack');
    flush(e);
    expect(flags(e)[NESLUG_STATE_FLAG]).toBe(2);
    const before = blow(e, 'auron', 'attack')[0] as number;
    resolveAbility(ctx, actor(e, 'tidus'), salt, [NES]);
    flush(e);
    expect([neslug(e).stats.def, neslug(e).stats.mdef]).toEqual([1, 1]);
    expect(blow(e, 'auron', 'attack')[0] as number).toBeGreaterThanOrEqual(before);
    flush(e);
  });

  it('Slime lands Armor Break and Mental Break on all three (255): the second Slime then does 30,000 and more to each (Magic Defense 0) where the first did about 1,200; Megaton hurts; its Attack never lands on the preset (finding F2)', () => {
    const e = newEngine(7, 'neslug');
    const ctx = ctxOf(e);
    const slime = (): { adds: string[]; dealt: Record<string, number> } => {
      const m = e.state().log.length;
      resolveAbility(ctx, neslug(e), ctx.content.ability(ROW.slime) as AbilityDef, ['tidus', 'yuna', 'auron']);
      const events = e.state().log.slice(m);
      const dealt: Record<string, number> = {};
      for (const x of events) if (x.type === 'damage') dealt[x.targetId] = x.amount;
      return { adds: events.flatMap((x) => (x.type === 'status-add' ? [`${x.targetId}:${x.status}`] : [])), dealt };
    };
    const first = slime();
    for (const id of ['tidus', 'yuna', 'auron']) {
      expect(first.adds, id).toContain(`${id}:armor-break`);
      expect(first.adds, id).toContain(`${id}:mental-break`);
      expect(first.dealt[id], id).toBeGreaterThan(1000);
      expect(first.dealt[id], id).toBeLessThan(1500);
    }
    const second = slime();
    for (const id of ['tidus', 'yuna', 'auron']) expect(second.dealt[id], `${id} after the Mental Break (a finding of stage 4: a party that only Defends loses to two Slimes)`).toBeGreaterThan(30_000);
    const fresh = newEngine(7, 'neslug');
    const mm = fresh.state().log.length;
    resolveAbility(ctxOf(fresh), neslug(fresh), ctxOf(fresh).content.ability(ROW.megaton) as AbilityDef, ['yuna']);
    const dealt = fresh.state().log.slice(mm).flatMap((x) => (x.type === 'damage' && x.targetId === 'yuna' ? [x.amount] : []));
    expect(dealt[0]).toBeGreaterThan(1500); // the note: Megaton 1,851 to 2,090 on a Protect-halved member
    expect(dealt[0]).toBeLessThan(2200);
  });

  it('seeds 1, 2 and 3: the careless line (Attack only) never wins -- the shell stops every blow and the engine ends the stalemate; the advisor\'s line wins; replaying a seed gives the same digest', () => {
    const digests: string[] = [];
    for (const seed of [1, 2, 3]) {
      const c = playOne(seed, 'neslug', careless);
      const c2 = playOne(seed, 'neslug', careless);
      expect(c.outcome, `careless seed ${seed}`).not.toBe('victory');
      expect(c.digest).toBe(c2.digest);
      const a = playOne(seed, 'neslug', advisorLine);
      const a2 = playOne(seed, 'neslug', advisorLine);
      expect(a.outcome, `advisor seed ${seed}`).toBe('victory');
      expect(a.digest).toBe(a2.digest);
      digests.push(c.digest, a.digest);
      expect(turnActions(a.events, NES).every((x) => [ROW.neslugAttack, ROW.megaton, ROW.slime, 'curaga', ROW.hidesInShell, ROW.emergesFromShell, ROW.brokenShell].includes(x)), `seed ${seed}: only its own rows`).toBe(true);
    }
    expect(new Set(digests).size).toBeGreaterThan(1);
  });
});
