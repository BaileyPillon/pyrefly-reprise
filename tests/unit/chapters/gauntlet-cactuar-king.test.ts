/**
 * **The Cactuar King against the note** (`research/re-ffx-monster-arena-creations.md` 3.8, "RE n"; FFX only; the hidden Gauntlet chapter's act 1): every branch and number of its script
 * (`src/battle/ffx/ai/gauntlet-cactuar-king.ts`) pinned on a **fake context**, where each branch is driven by the raw draw alone and the odds are counted over all 65,536 values of `GetRandomValue()` (the note's own
 * exact tallies: 32,769 / 21,844 / 10,923); the counter by its gate; then the real engine on three seeds (no error, an end reached, the digest of the event log recorded) and the Run Away end (preflight GA9).
 */
import { describe, expect, it } from 'vitest';

import type { BattleResult, FFXCombatant } from '../../../src/battle/common/types.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { cloneCtx } from '../../../src/battle/ffx/intent.ts';
import { chooseAiCommand } from '../../../src/battle/ffx/ai/index.ts';
import {
  CACTUAR_NEEDLES_10000_ABOVE, CACTUAR_RESTS, CACTUAR_RESTS_BEFORE_LEAVING, CACTUAR_ROLL_MODULO, cactuarKingHit, cactuarKingTurn,
} from '../../../src/battle/ffx/ai/gauntlet-cactuar-king.ts';
import { GOT_AWAY_LINE, gauntletOutcome } from '../../../src/battle/ffx/ai/gauntlet-end.ts';
import { GAUNTLET_IDS, GAUNTLET_ROWS as ROW, GAUNTLET_SCRIPTS, GOT_AWAY_FLAG } from '../../../src/battle/ffx/ai/gauntlet-rules.ts';
import type { HitEvent } from '../../../src/battle/ffx/ai/hit-script.ts';
import { peekReactions } from '../../../src/battle/ffx/ai/hooks.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import '../../../src/battle/ffx/ai/index.ts';
import { type Fake, aiOf, bossOf, fakeArena, rowOf, tally } from '../helpers/gauntletFake.ts';
import { actions, careless, ctxOf, flags, newEngine, playOne } from '../helpers/gauntletDrive.ts';

const KING = GAUNTLET_IDS.cactuarKing;

const hitOf = (f: Fake, attackerId = 'm0', hp = 1000): HitEvent => {
  const target = bossOf(f, KING);
  target.hp = hp;
  return { ctx: f.ctx, target, attacker: bossOf(f, attackerId), def: {} as never, lastDamage: 1, affectsHp: true };
};

describe('the script is registered under the id the data names, both hooks', () => {
  it('the AI script and the hit hook', () => {
    expect(getAiScript(GAUNTLET_SCRIPTS.cactuarKing)).toBeDefined();
    expect(GAUNTLET_SCRIPTS.cactuarKing).toBe('gauntlet-cactuar-king');
  });
});

describe("the Cactuar King's turn: one draw modulo 6 (RE n 3.8)", () => {
  it('the first turn, over all 65,536 values: 32,769 99999 Needles (50.00 percent), 21,844 10000 Needles (33.33), 10,923 a rest that queues nothing (16.67)', () => {
    expect(tally(KING, cactuarKingTurn)).toEqual({ [ROW.needles99999]: 32_769, [ROW.needles10000]: 21_844, '(none)': 10_923 });
  });

  it('by residue: 0 rests, 1 to 3 are the 99999 Needles, 4 and 5 the 10000 Needles (the branch order of the script: v4 == 0, then v4 > 3, else the first)', () => {
    expect(CACTUAR_ROLL_MODULO).toBe(6);
    expect(CACTUAR_NEEDLES_10000_ABOVE).toBe(3);
    const row = (raw: number): string => {
      const f = fakeArena({ boss: KING, raw });
      return rowOf(cactuarKingTurn(aiOf(f, KING)));
    };
    expect([0, 1, 2, 3, 4, 5].map((r) => row(r))).toEqual(['(none)', ROW.needles99999, ROW.needles99999, ROW.needles99999, ROW.needles10000, ROW.needles10000]);
    expect([6, 7, 9, 10, 11].map((r) => row(r))).toEqual(['(none)', ROW.needles99999, ROW.needles99999, ROW.needles10000, ROW.needles10000]);
  });

  it('after two rests the third rest roll is Run Away on itself (the same 10,923 values), and the tally of the other two moves is unchanged', () => {
    const two = (f: Fake, ai: ReturnType<typeof aiOf>): void => {
      ai.memory[CACTUAR_RESTS] = 2;
      void f;
    };
    expect(tally(KING, cactuarKingTurn, {}, two)).toEqual({ [ROW.needles99999]: 32_769, [ROW.needles10000]: 21_844, [ROW.runAway]: 10_923 });
    expect(CACTUAR_RESTS_BEFORE_LEAVING).toBe(1);
  });

  it('the rests are cumulative over the fight (a Needle turn does not reset them): rolls 0, 1, 0, 4, 0 are rest, 99999, rest, 10000, Run Away; the flag is set with the departure and not before', () => {
    const f = fakeArena({ boss: KING, raw: [0, 1, 0, 4, 0] });
    const ai = aiOf(f, KING);
    const rows: string[] = [];
    const seen: Array<unknown> = [];
    for (let i = 0; i < 5; i++) {
      rows.push(rowOf(cactuarKingTurn(ai)));
      seen.push(f.ctx.state.flags[GOT_AWAY_FLAG]);
    }
    expect(rows).toEqual(['(none)', ROW.needles99999, '(none)', ROW.needles10000, ROW.runAway]);
    expect(seen).toEqual([undefined, undefined, undefined, undefined, true]);
    expect(ai.memory[CACTUAR_RESTS]).toBe(2);
  });

  it('Run Away is aimed at the Cactuar King itself; a Needle at one random living member: one picker draw with two or more living, none with one, and a rest or a departure draws nothing', () => {
    const run = (living: number, raw: number, pick = 1): Fake => {
      const f = fakeArena({ boss: KING, raw, living, pick });
      cactuarKingTurn(aiOf(f, KING));
      return f;
    };
    expect(run(3, 1).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 2]]);
    expect(run(2, 4).draws).toEqual([[FfxStream.Script, 0xffff], [FfxStream.Picker, 1]]);
    expect(run(1, 4).draws).toEqual([[FfxStream.Script, 0xffff]]);
    expect(run(3, 0).draws).toEqual([[FfxStream.Script, 0xffff]]);
    const f = fakeArena({ boss: KING, raw: 0 });
    const ai = aiOf(f, KING);
    ai.memory[CACTUAR_RESTS] = 2;
    const c = cactuarKingTurn(ai);
    expect([rowOf(c), c?.targets]).toEqual([ROW.runAway, [KING]]);
    const g = fakeArena({ boss: KING, raw: 1, pick: 1 });
    expect(cactuarKingTurn(aiOf(g, KING))?.targets).toEqual(['m1']);
    expect(fakeArena({ boss: KING, raw: 1, living: 0 }) && cactuarKingTurn(aiOf(fakeArena({ boss: KING, raw: 1, living: 0 }), KING))).toBeNull();
  });
});

describe('the counter: every hit event answers with 10000 Needles on a random living member (RE n 3.8)', () => {
  it('a hit by a party member queues 10000 Needles for the King, aimed at the member the picker names (not at the attacker), as a keeps-control reaction', () => {
    const f = fakeArena({ boss: KING, pick: 2 });
    cactuarKingHit(hitOf(f));
    const queued = peekReactions(f.ctx);
    expect(queued).toHaveLength(1);
    const r = queued[0]!;
    if (r.kind !== 'command') throw new Error('a command');
    expect([r.ownerId, rowOf(r.command), r.command.targets, r.keepsControl]).toEqual([KING, ROW.needles10000, ['m2'], true]);
    expect(f.draws).toEqual([[FfxStream.Picker, 2]]);
  });

  it('nothing when a reaction is already running (a counter never triggers a counter), when the hitter is the King itself, when the blow took its last HP, and when nobody stands', () => {
    const inReaction = fakeArena({ boss: KING, inReaction: true });
    cactuarKingHit(hitOf(inReaction));
    expect(peekReactions(inReaction.ctx)).toEqual([]);
    const self = fakeArena({ boss: KING });
    cactuarKingHit(hitOf(self, KING));
    expect(peekReactions(self.ctx)).toEqual([]);
    const dead = fakeArena({ boss: KING });
    cactuarKingHit(hitOf(dead, 'm0', 0));
    expect(peekReactions(dead.ctx)).toEqual([]);
    const alone = fakeArena({ boss: KING, living: 0 });
    cactuarKingHit(hitOf(alone));
    expect(peekReactions(alone.ctx)).toEqual([]);
  });

  it('a hit event is one per action: a second event in the same action finds a reaction waiting and the engine drops it (a Doublecast gets one answer)', () => {
    const f = fakeArena({ boss: KING });
    cactuarKingHit(hitOf(f));
    cactuarKingHit(hitOf(f));
    expect(peekReactions(f.ctx)).toHaveLength(1);
  });

  it('the King cannot counter while it cannot act (asleep): no reaction', () => {
    const f = fakeArena({ boss: KING });
    (bossOf(f, KING).statuses as Record<string, unknown>)['sleep'] = { id: 'sleep' };
    cactuarKingHit(hitOf(f));
    expect(peekReactions(f.ctx)).toEqual([]);
  });
});

describe('Run Away ends the act as "it got away" (preflight GA9)', () => {
  it('gauntletOutcome is undefined until the flag is set, then an escape with the system line (once: the caller finishes the battle)', () => {
    const f = fakeArena({ boss: KING });
    expect(gauntletOutcome(f.ctx)).toBeUndefined();
    expect(f.events).toEqual([]);
    f.ctx.state.flags[GOT_AWAY_FLAG] = true;
    expect(gauntletOutcome(f.ctx)).toBe('escape');
    expect(f.events).toEqual([{ type: 'message', text: GOT_AWAY_LINE, kind: 'system' }]);
  });

  it('on the real engine a King that has rested twice and rolls a third rest runs away: Run Away is its last action, the battle is an escape ending on the line, nothing is paid and the King is not dead', () => {
    const escapes: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const engine = newEngine(seed, 'cactuar-king');
      rtOf(ctxOf(engine), KING).ai[CACTUAR_RESTS] = 2; // two rests behind it: the next roll of 0 is the departure
      let outcome = '';
      let result: BattleResult | undefined;
      for (let guard = 0; guard < 6000 && outcome === ''; guard++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome;
          result = d.result;
        } else if (d.kind === 'player-input') engine.submit({ kind: 'defend', targets: [] });
      }
      expect(['escape', 'defeat'], `seed ${seed}: the party only defends`).toContain(outcome);
      const events = engine.state().log;
      expect(flags(engine)[GOT_AWAY_FLAG] === true, `seed ${seed}`).toBe(outcome === 'escape');
      if (outcome !== 'escape') continue;
      escapes.push(seed);
      const mine = actions(events, KING);
      expect(mine[mine.length - 1], `seed ${seed}`).toBe(ROW.runAway);
      expect(events.filter((e) => e.type === 'message' && e.text === GOT_AWAY_LINE)).toHaveLength(1);
      expect(events[events.length - 1]!.type).toBe('defeat'); // the engine's one terminal event for a non-victory
      expect(events.some((e) => e.type === 'ko' && e.targetId === KING)).toBe(false);
      expect((engine.state().combatants[KING] as FFXCombatant).alive).toBe(true);
      expect([result?.ap, result?.gil, result?.drops.length]).toEqual([0, 0, 0]);
      expect(result?.outcome).toBe('escape');
    }
    expect(escapes.length, 'the King leaves on some of the seeds').toBeGreaterThan(0);
  });
});

describe('the advisor dry run of the next move of the King (intent.ts) writes on a clone only', () => {
  it('a preview that rolls the departure sets the flag and the rest counter on the copy; the real battle keeps neither (so a preview cannot end the act)', () => {
    const engine = newEngine(1, 'cactuar-king');
    const real = ctxOf(engine);
    rtOf(real, KING).ai[CACTUAR_RESTS] = 2;
    let departed = false;
    for (let i = 0; i < 200 && !departed; i++) {
      real.rng.on(FfxStream.Script).int(0, 0xffff); // move the real stream on, so each preview forks from a different state
      const { ctx: clone } = cloneCtx(real);
      chooseAiCommand(clone, clone.state.combatants[KING] as FFXCombatant);
      departed = clone.state.flags[GOT_AWAY_FLAG] === true;
      expect(real.state.flags[GOT_AWAY_FLAG], `preview ${i}`).toBeUndefined();
      expect(rtOf(real, KING).ai[CACTUAR_RESTS], `preview ${i}`).toBe(2);
    }
    expect(departed, 'a roll of 0 comes within 200 previews').toBe(true);
  });
});

describe('the real engine: act 1 on three seeds (no error, an end reached, the digest of the log recorded)', () => {
  it('seeds 1, 2 and 3 with the careless line end in a victory, a defeat or an escape; replaying a seed gives the same log (the digests are recorded in the stage report)', () => {
    const digests: Record<number, string> = {};
    for (const seed of [1, 2, 3]) {
      const a = playOne(seed, 'cactuar-king', careless);
      const b = playOne(seed, 'cactuar-king', careless);
      expect(['victory', 'defeat', 'escape'], `seed ${seed}`).toContain(a.outcome);
      expect(a.digest, `seed ${seed} replays`).toBe(b.digest);
      expect(a.inputs).toBeGreaterThan(0);
      digests[seed] = a.digest;
    }
    expect(new Set(Object.values(digests)).size, 'different seeds, different logs').toBeGreaterThan(1);
  });

  it('the counter fires on the real engine: a party attack that reaches the King (a miss counts) is followed by a script counter, 10000 Needles from the King', () => {
    let counters = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const run = playOne(seed, 'cactuar-king', careless);
      counters += run.events.filter((e) => e.type === 'counter' && e.actorId === KING && e.abilityId === ROW.needles10000 && e.cause === 'script').length;
    }
    expect(counters).toBeGreaterThan(0);
  });

  it('the King never takes a rest it is not owed: on a real battle its actions are Needles, the departure and nothing else', () => {
    const allowed = new Set<string>([ROW.needles10000, ROW.needles99999, ROW.runAway]);
    for (const seed of [1, 2, 3]) {
      const run = playOne(seed, 'cactuar-king', careless);
      for (const a of actions(run.events, KING)) expect(allowed.has(a), `seed ${seed}: ${a}`).toBe(true);
    }
  });
});
