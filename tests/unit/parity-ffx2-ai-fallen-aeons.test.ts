/**
 * Re-parity AI-FFX2-b, Chapter XI (**FFX-2 only**): Shiva and Anima follow the game's own scripts
 * (`research/re-ffx2-ai-fallen-trema.md` sections 2 and 4; rows F1 to F3, A1). The Sisters are `parity-ffx2-ai-magus-sisters.test.ts`. One decision table per fight, run
 * against the shipped script and the real resolver [hard rule 3]; the exact outcome tables come from enumerating every class of
 * `random() mod n`, the way the note got its tallies from the compiled scripts (`helpers/ffx2ScriptTally.ts`).
 *
 * Interpreter tallies reproduced here (note 2.1 and 4): Shiva uses the early table until the 21st poll and the late one from the 22nd, and with
 * no hits casts Diamond Dust on the 35th poll at gauge 102; Anima's Oblivion is the 21st poll.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): the late table tested before the +3; the chain
 * counter reset on the wrong poll; the +5 per party action instead of per result; the reaction guard dropped.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AbilityCommand, Command, Rng } from '../../src/battle/common/types.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { AC, SHIVA_CHAIN } from '../../src/battle/ffx2/ai/fallen-aeons.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { resolveAbility, type ResolveContext } from '../../src/battle/ffx2/resolve.ts';
import { applyStatus } from '../../src/battle/ffx2/statuses.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { x2Shiva } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { boardOf, exactTally, girls, REGISTRY, residueCount, scriptedRng, share, total } from './helpers/ffx2ScriptTally.ts';

const ab = (id: string): AbilityDef => data.ABILITIES[id] as AbilityDef;
const cmd = (c: Command | null): AbilityCommand => {
  expect(c, 'a command').not.toBeNull();
  return c as AbilityCommand;
};
const P = (count: number): number => count / 65536;

function enemyUnit(id: string, script: string, maxHp: number, slot = 0): Ffx2Unit {
  const u = aiUnit(id, 'enemy', maxHp, slot);
  u.enemy = { aiScriptId: script, formIndex: 0, forms: [], rewards: x2Shiva.rewards };
  u.aiMemory = {};
  return u;
}

// ---------------------------------------------------------------------------
describe('Shiva (m167): the order the script tests, F1 to F3', () => {
  const script = aiScriptFor('x2-shiva');
  const fresh = (memory: Record<string, number>) => {
    const shiva = enemyUnit('x2-shiva', 'x2-shiva', 14800);
    shiva.aiMemory = { ...memory };
    return shiva;
  };
  const decide = (memory: Record<string, number>, rng: Rng) => {
    const shiva = fresh(memory);
    const b = boardOf(shiva, [shiva, ...girls()], rng);
    return { c: cmd(script.decide(b.ctx)), shiva };
  };
  const outcome = (memory: Record<string, number>) => (rng: Rng) => {
    const { c, shiva } = decide(memory, rng);
    return `${c.id}|chain=${shiva.aiMemory?.[SHIVA_CHAIN] ?? 0}|ac=${shiva.aiMemory?.[AC] ?? 0}`;
  };

  it('row 3: a counter of 100 or more, tested before any addition, casts Diamond Dust on the party, resets, and draws nothing', () => {
    const rng = scriptedRng([]);
    rng.int = () => {
      throw new Error('Diamond Dust must not roll');
    };
    const { c, shiva } = decide({ [AC]: 100 }, rng);
    expect(c).toEqual({ kind: 'ability', id: 'x2-shiva-diamond-dust', targets: [] });
    expect(shiva.aiMemory?.[AC]).toBe(0);
    expect(decide({ [AC]: 99 }, scriptedRng([2, 0])).c.id).not.toBe('x2-shiva-diamond-dust'); // 99 + 3 = 102, but the test is before the add
  });

  it('F2: the table is chosen on the counter AFTER adding 3: pre-add 60 is the early table, 62 the late one', () => {
    // Early (new counter < 65): mod 4 = 0 Heavenly Strike, 1 Blizzaga, 2 or 3 Attack. Late (>= 65): 0 Heavenly Strike, 1 Chain Attack (chain counter 1), 2 or 3 Blizzaga.
    const early = exactTally(outcome({ [AC]: 60 }), 4);
    expect(share(early, 'x2-shiva-heavenly-strike|chain=0|ac=63')).toBeCloseTo(P(16384), 12);
    expect(share(early, 'x2-shiva-blizzaga|chain=0|ac=63')).toBeCloseTo(P(16384), 12);
    expect(share(early, 'x2-shiva-kick|chain=0|ac=63')).toBeCloseTo(P(32768), 12);
    expect(total(early)).toBeCloseTo(1, 12);
    const late = exactTally(outcome({ [AC]: 62 }), 4);
    expect(share(late, 'x2-shiva-heavenly-strike|chain=0|ac=65')).toBeCloseTo(P(16384), 12);
    expect(share(late, 'x2-shiva-triple-attack|chain=1|ac=65')).toBeCloseTo(P(16384), 12);
    expect(share(late, 'x2-shiva-blizzaga|chain=0|ac=65')).toBeCloseTo(P(32768), 12);
    expect(total(late)).toBeCloseTo(1, 12);
    // 61 + 3 = 64 stays early; the boundary is the pre-add counter 62.
    expect(share(exactTally(outcome({ [AC]: 61 }), 4), 'x2-shiva-kick|chain=0|ac=64')).toBeCloseTo(P(32768), 12);
  });

  it('F1: Triple Attack is three polls of Chain Attack, each with its own girl, no gain after the first, no Diamond Dust test between', () => {
    const shiva = fresh({ [AC]: 99, [SHIVA_CHAIN]: 1 }); // a chain was started: even at 99 + the next polls, the follow-ups come first
    const b = boardOf(shiva, [shiva, ...girls()], scriptedRng([0, 1, 2]));
    // Poll 2 of the chain (counter 1): Chain Attack, counter 2, the counter 99 untouched, a girl by the first pick (0 -> Yuna).
    expect(script.decide(b.ctx)).toEqual({ kind: 'ability', id: 'x2-shiva-triple-attack', targets: ['yuna'] });
    expect([shiva.aiMemory?.[SHIVA_CHAIN], shiva.aiMemory?.[AC]]).toEqual([2, 99]);
    // Poll 3 (counter 2): Chain Attack on the next pick (1 -> Rikku), counter back to 0.
    expect(script.decide(b.ctx)).toEqual({ kind: 'ability', id: 'x2-shiva-triple-attack', targets: ['rikku'] });
    expect([shiva.aiMemory?.[SHIVA_CHAIN], shiva.aiMemory?.[AC]]).toEqual([0, 99]);
    // The poll after the chain looks at the counter again: 99 + 3 = 102 is not 100 before the add, so it rolls (the late table).
    expect(cmd(script.decide(b.ctx)).id).not.toBe('x2-shiva-diamond-dust');
    expect(shiva.aiMemory?.[AC]).toBe(102);
    expect(cmd(script.decide(b.ctx)).id).toBe('x2-shiva-diamond-dust'); // the next poll is the Diamond Dust, a chain postponed it by two polls
  });

  it('the chain starts only from the late table, on mod 4 = 1, and the first Chain Attack is itself the first of the three', () => {
    const shiva = fresh({ [AC]: 62 });
    const b = boardOf(shiva, [shiva, ...girls()], scriptedRng([1, 2]));
    expect(script.decide(b.ctx)).toEqual({ kind: 'ability', id: 'x2-shiva-triple-attack', targets: ['paine'] }); // roll 1, then the pick 2
    expect(shiva.aiMemory?.[SHIVA_CHAIN]).toBe(1);
    expect(shiva.aiMemory?.[AC]).toBe(65); // the +3 of the starting poll only
  });

  it('interpreter tally: no hits -> the early table for 21 polls, the late one from the 22nd, Diamond Dust on the 35th at counter 102', () => {
    const shiva = fresh({});
    const b = boardOf(shiva, [shiva, ...girls()], scriptedRng(new Array(200).fill(2))); // every roll 2: Attack in the early table, Blizzaga in the late one
    const seen: string[] = [];
    const counters: number[] = [];
    for (let poll = 1; poll <= 35; poll++) {
      seen.push(cmd(script.decide(b.ctx)).id);
      counters.push(shiva.aiMemory?.[AC] as number);
    }
    expect(seen.slice(0, 21).every((id) => id === 'x2-shiva-kick')).toBe(true);
    expect(seen.slice(21, 34).every((id) => id === 'x2-shiva-blizzaga')).toBe(true);
    expect(seen[34]).toBe('x2-shiva-diamond-dust');
    expect(counters[33]).toBe(102);
    expect(counters[34]).toBe(0);
  });

  it('every move goes to a uniform living girl, drawn after the roll; with one girl alive nothing is drawn for her', () => {
    const shiva = fresh({});
    const b = boardOf(shiva, [shiva, ...girls()], scriptedRng([0, 2])); // roll 0 -> Heavenly Strike, pick 2 -> Paine
    expect(script.decide(b.ctx)).toEqual({ kind: 'ability', id: 'x2-shiva-heavenly-strike', targets: ['paine'] });
    const solo = girls();
    solo[0]!.alive = false;
    solo[1]!.alive = false;
    const lone = fresh({});
    const rng = scriptedRng([0]);
    const draws: number[] = [];
    const real = rng.int;
    rng.int = (min: number, max: number) => {
      draws.push(max);
      return real(min, max);
    };
    const b2 = boardOf(lone, [lone, ...solo], rng);
    expect(script.decide(b2.ctx)).toEqual({ kind: 'ability', id: 'x2-shiva-heavenly-strike', targets: ['paine'] });
    expect(draws).toEqual([0xffff]); // the roll only: one candidate draws nothing
  });

  it('F3: every result applied to her adds 5 while the guard holds; her own, and any while stopped, asleep, petrified, confused, berserk or ejected, add nothing', () => {
    const shiva = fresh({});
    const rikku = girls()[1]!;
    const b = boardOf(shiva, [shiva, rikku], scriptedRng([]));
    const hit = () => script.onResult!(b.ctx, rikku, ab('x2-dark-knight-drain'));
    hit();
    hit();
    hit();
    expect(shiva.aiMemory?.[AC]).toBe(15);
    script.onResult!(b.ctx, shiva, ab('x2-shiva-kick')); // she is the source
    expect(shiva.aiMemory?.[AC]).toBe(15);
    for (const status of ['stop', 'sleep', 'petrify', 'confuse', 'berserk', 'eject'] as const) {
      applyStatus(shiva, { status, chance: 255, duration: 0 });
      hit();
      expect(shiva.aiMemory?.[AC], status).toBe(15);
      delete shiva.statuses[status];
    }
    hit();
    expect(shiva.aiMemory?.[AC]).toBe(20);
  });

  it('F3 through the resolver: a three-strike command that lands is +15, a miss is +5, an enemy\'s own action is nothing', () => {
    const shiva = enemyUnit('x2-shiva', 'x2-shiva', 14800);
    shiva.stats.maxHp = 999999;
    shiva.hp = 999999;
    const rikku = girls()[1]!;
    const units: Ffx2Unit[] = [shiva, rikku];
    const base: ResolveContext = {
      units, abilities: REGISTRY, rng: scriptedRng([]), emit: () => undefined, breaksDamageLimit: () => false,
    };
    const seeded = boardOf(shiva, units, scriptedRng([]));
    const wired: ResolveContext = {
      ...base,
      onResult: (target, source, ability) => {
        if (target.side === 'enemy') aiScriptFor(target.enemy?.aiScriptId).onResult?.({ ...seeded.ctx, self: target }, source, ability);
      },
    };
    // Passado is fifteen blows that never miss: fifteen results.
    resolveAbility({ ...wired, rng: new SeededRng(7) }, rikku, ab('x2-mindy-passado'), ['x2-shiva']);
    expect(shiva.aiMemory?.[AC]).toBe(75);
    // Her own Kick lands on Rikku: Shiva is the source, Rikku has no script, nothing moves.
    shiva.aiMemory = { [AC]: 0 };
    resolveAbility({ ...wired, rng: new SeededRng(8) }, shiva, ab('x2-shiva-kick'), ['rikku']);
    expect(shiva.aiMemory?.[AC]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
describe('Anima (m169): A1', () => {
  const script = aiScriptFor('x2-anima');
  const fresh = (memory: Record<string, number>) => {
    const anima = enemyUnit('x2-anima', 'x2-anima', 36000);
    anima.aiMemory = { ...memory };
    return anima;
  };

  it('counter >= 100: counter 0, Oblivion on the party, no roll; else +5 and mod 5 = 0 is Pain (13,108 of 65,536), 1 to 4 the Anima Attack', () => {
    const anima = fresh({ [AC]: 100 });
    const b = boardOf(anima, [anima, ...girls()], scriptedRng([]));
    b.ctx.rng.int = () => {
      throw new Error('Oblivion must not roll');
    };
    expect(script.decide(b.ctx)).toEqual({ kind: 'ability', id: 'x2-anima-oblivion', targets: [] });
    expect(anima.aiMemory?.[AC]).toBe(0);

    const tally = exactTally((rng) => {
      const a = fresh({ [AC]: 0 });
      const board = boardOf(a, [a, ...girls()], rng);
      return `${cmd(script.decide(board.ctx)).id}|ac=${a.aiMemory?.[AC]}`;
    }, 5);
    expect(share(tally, 'x2-anima-pain|ac=5')).toBeCloseTo(P(residueCount(0, 5)), 12);
    expect(share(tally, 'x2-anima-stare|ac=5')).toBeCloseTo(1 - P(residueCount(0, 5)), 12);
    expect(residueCount(0, 5)).toBe(13108);
  });

  it('interpreter tally: with no hits Oblivion is the 21st poll (twenty polls of +5)', () => {
    const anima = fresh({});
    const b = boardOf(anima, [anima, ...girls()], scriptedRng(new Array(100).fill(1))); // roll 1: the Anima Attack every time
    const seen = Array.from({ length: 21 }, () => cmd(script.decide(b.ctx)).id);
    expect(seen.slice(0, 20).every((id) => id === 'x2-anima-stare')).toBe(true);
    expect(seen[20]).toBe('x2-anima-oblivion');
  });

  it('F3: every result adds 5 under the same guard; the third Pain calls the story\'s line', () => {
    const anima = fresh({});
    const rikku = girls()[1]!;
    const b = boardOf(anima, [anima, rikku], scriptedRng([0, 0, 0, 0, 0, 0]));
    script.onResult!(b.ctx, rikku, ab('x2-dark-knight-drain'));
    script.onResult!(b.ctx, anima, ab('x2-anima-pain'));
    expect(anima.aiMemory?.[AC]).toBe(5);
    for (let i = 0; i < 3; i++) script.decide(b.ctx); // roll 0 each time: Pain, Pain, Pain
    expect(b.events.filter((e) => e.type === 'script-trigger')).toHaveLength(1);
  });
});

