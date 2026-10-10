/**
 * Re-parity AI-FFX2-b, Chapter XIII link 1, the normal Paragon (**FFX-2 only**): the game's own script `m152` worker 1
 * (`research/re-ffx2-ai-fallen-trema.md` section 5; rows P1 to P6). One decision table, run against the shipped script and the
 * records [hard rule 3]; the exact outcome tables enumerate every class of `random() mod n` (`helpers/ffx2ScriptTally.ts`).
 *
 * What stays as Bailey decided and is listed for him (not built, with the reason in `docs/handoff/re-parity-ai-ffx2-b.md`):
 * P1's timing (TR12 = b, an immediate counter; both timings are built and tested here), P3 (no battle geometry), P5 (TR4 = b),
 * P6 (TR8 = a, and W3's stat rule).
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): Attack 2 and 3 in the old order; the alternation
 * advancing on the Big Bang poll; a result of a physical or magical command setting the flag; a miss not setting it; the flag
 * set by a result that is not on Paragon.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AbilityCommand, Command, Rng } from '../../src/battle/common/types.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { BIG_BANG_FLAG, PARAGON_OPTIONS, paragonScript } from '../../src/battle/ffx2/ai/paragon.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { paragon } from '../../src/data/ffx2/enemies/paragon.ts';
import { boardOf, exactTally, girls, scriptedRng, share, total } from './helpers/ffx2ScriptTally.ts';
import { board as realBoard } from './helpers/tremaUnits.ts';

const ab = (id: string): AbilityDef => data.ABILITIES[id] as AbilityDef;
const cmd = (c: Command | null): AbilityCommand => {
  expect(c, 'a command').not.toBeNull();
  return c as AbilityCommand;
};
const STEP = 'paragonStep';

function paragonUnit(memory: Record<string, number> = {}): Ffx2Unit {
  const u = aiUnit('paragon', 'enemy', 200000, 0);
  u.enemy = { aiScriptId: 'paragon', formIndex: 0, forms: [], rewards: paragon.rewards };
  u.aiMemory = { ...memory };
  u.mp = 9999;
  return u;
}

describe('the action entry (m152 worker 1): rows 1 to 3 of 5.1', () => {
  it('row 2: the alternation flag 0 -> flag 1 and mod 4: 0 poison, 1 poison and confuse, 2 itchy, 3 pierce (a quarter each, exactly)', () => {
    const tally = exactTally((rng) => {
      const p = paragonUnit();
      const c = cmd(paragonScript.decide(boardOf(p, [p, ...girls()], rng).ctx));
      return `${c.id}|step=${p.aiMemory?.[STEP]}`;
    }, 4);
    // P4: case 1 is "poison and confuse", case 2 "itchy" (the first build had the two swapped).
    expect(share(tally, 'paragon-attack-poison|step=1')).toBeCloseTo(0.25, 12);
    expect(share(tally, 'paragon-attack-confuse|step=1')).toBeCloseTo(0.25, 12);
    expect(share(tally, 'paragon-attack-itchy|step=1')).toBeCloseTo(0.25, 12);
    expect(share(tally, 'paragon-attack-pierce|step=1')).toBeCloseTo(0.25, 12);
    expect(total(tally)).toBeCloseTo(1, 12);
    const p = paragonUnit();
    expect(paragonScript.decide(boardOf(p, [p, ...girls()], scriptedRng([1, 0])).ctx)).toEqual({ kind: 'ability', id: 'paragon-attack-confuse', targets: ['yuna'] });
  });

  it('row 3: the flag 1 -> flag 0 and mod 2: 0 the drain Attack on a girl, 1 Genesis on the party (half each)', () => {
    const tally = exactTally((rng) => {
      const p = paragonUnit({ [STEP]: 1 });
      const c = cmd(paragonScript.decide(boardOf(p, [p, ...girls()], rng).ctx));
      return `${c.id}|step=${p.aiMemory?.[STEP]}`;
    }, 2);
    expect(share(tally, 'paragon-attack-drain|step=0')).toBeCloseTo(0.5, 12);
    expect(share(tally, 'paragon-genesis|step=0')).toBeCloseTo(0.5, 12);
    const p = paragonUnit({ [STEP]: 1 });
    expect(paragonScript.decide(boardOf(p, [p, ...girls()], scriptedRng([1])).ctx)).toEqual({ kind: 'ability', id: 'paragon-genesis', targets: [] });
  });

  it('P3 (not built): the single-target Attacks pick a uniform living girl, drawn after the roll; with one girl alive nothing is drawn', () => {
    const p = paragonUnit();
    expect(paragonScript.decide(boardOf(p, [p, ...girls()], scriptedRng([0, 2])).ctx)).toEqual({ kind: 'ability', id: 'paragon-attack-poison', targets: ['paine'] });
    const lone = girls();
    lone[0]!.alive = false;
    lone[2]!.alive = false;
    const q = paragonUnit();
    const draws: number[] = [];
    const rng = scriptedRng([0]);
    const real = rng.int;
    rng.int = (a: number, b: number) => (draws.push(b), real(a, b));
    expect(paragonScript.decide(boardOf(q, [q, ...lone], rng).ctx)).toEqual({ kind: 'ability', id: 'paragon-attack-poison', targets: ['rikku'] });
    expect(draws).toEqual([0xffff]);
  });

  it('TR4 = b (kept): a drained Paragon casts no Genesis and no Big Bang; the turn passes with a line', () => {
    const p = paragonUnit({ [STEP]: 1 });
    p.mp = 0;
    const b = boardOf(p, [p, ...girls()], scriptedRng([1]));
    expect(paragonScript.decide(b.ctx)).toBeNull();
    expect(b.events.some((e) => e.type === 'message' && /no MP left for Genesis/.test(String((e as { text?: string }).text)))).toBe(true);
  });
});

describe('the reaction entry: what sets the Big Bang flag (P2)', () => {
  const girl = girls()[0]!;
  const sets = (id: string): boolean => {
    const p = paragonUnit();
    const b = boardOf(p, [p, ...girls()], scriptedRng([]));
    PARAGON_OPTIONS.bigBangTiming = 'next-poll';
    try {
      paragonScript.onResult!(b.ctx, girl, ab(id));
    } finally {
      PARAGON_OPTIONS.bigBangTiming = 'immediate';
    }
    return p.aiMemory?.[BIG_BANG_FLAG] === 1;
  };

  it('a command with NEITHER damage bit sets it: Darkness, Charon, Scan, Steal, Pilfer Gil, Mix, items', () => {
    for (const id of ['x2-dark-knight-darkness', 'x2-dark-knight-charon', 'x2-gun-mage-scan', 'x2-thief-steal', 'x2-thief-pilfer-gil', 'x2-alchemist-mix', 'x2-item-megalixir', 'x2-item-soul-spring']) {
      expect(sets(id), id).toBe(true);
    }
  });

  it('a physical-only or magical-only command does nothing: attacks, Breaks, every spell, Drain, Demi, Death', () => {
    for (const id of ['x2-dark-knight-attack', 'x2-warrior-power-break', 'x2-black-mage-fire', 'x2-dark-knight-drain', 'x2-dark-knight-demi', 'x2-dark-knight-death', 'x2-white-mage-cure']) {
      expect(sets(id), id).toBe(false);
    }
  });

  it('many results are one flag and one Big Bang (a miss is a result too; the plumbing test shows it reaches the script)', () => {
    const p = paragonUnit({ [STEP]: 1 });
    PARAGON_OPTIONS.bigBangTiming = 'next-poll';
    try {
      const b = boardOf(p, [p, ...girls()], scriptedRng([1]));
      for (let i = 0; i < 5; i++) paragonScript.onResult!(b.ctx, girl, ab('x2-dark-knight-darkness'));
      // The next poll casts Big Bang INSTEAD of the move that was due (Genesis here), once, and the alternation does not advance.
      expect(paragonScript.decide(b.ctx)).toEqual({ kind: 'ability', id: 'paragon-big-bang', targets: [] });
      expect(p.aiMemory?.[STEP]).toBe(1);
      expect(p.aiMemory?.[BIG_BANG_FLAG]).toBe(0);
      expect(cmd(paragonScript.decide(b.ctx)).id).toBe('paragon-genesis'); // the move that was due, now
    } finally {
      PARAGON_OPTIONS.bigBangTiming = 'immediate';
    }
  });

  it('in the shipped timing (TR12 = b) the flag is not used: nothing is waiting for the next poll', () => {
    expect(PARAGON_OPTIONS.bigBangTiming).toBe('immediate');
    const p = paragonUnit();
    const b = boardOf(p, [p, ...girls()], scriptedRng([]));
    paragonScript.onResult!(b.ctx, girl, ab('x2-dark-knight-darkness'));
    expect(p.aiMemory?.[BIG_BANG_FLAG]).toBeUndefined();
  });
});

describe('TR12 = b, the immediate counter (kept as Bailey decided), with the script\'s trigger set', () => {
  const act = (id: string, aimedAtSelf = true, mp = 9999) => {
    const p = paragonUnit();
    p.mp = mp;
    const b = boardOf(p, [p, ...girls()], scriptedRng([]));
    return paragonScript.onPartyAction!(b.ctx, girls()[0]!, { abilityId: id, aimedAtSelf });
  };

  it('Big Bang on the whole party right after any party action that put a result on him with a command of neither bit', () => {
    for (const id of ['x2-dark-knight-darkness', 'x2-dark-knight-charon', 'x2-gun-mage-scan', 'x2-thief-steal', 'x2-item-soul-spring']) {
      expect(act(id), id).toEqual({ kind: 'ability', id: 'paragon-big-bang', targets: [] });
    }
  });

  it('nothing for a physical or magical command, or for an action that was not aimed at him, or when he is drained (TR4 = b)', () => {
    expect(act('x2-dark-knight-attack')).toBeNull();
    expect(act('x2-black-mage-fire')).toBeNull();
    expect(act('x2-dark-knight-darkness', false)).toBeNull();
    expect(act('x2-dark-knight-darkness', true, 0)).toBeNull();
  });

  it('through the engine: Darkness on Paragon is answered by Big Bang as a counter, and a plain Attack is not', () => {
    for (const [ability, expectBang] of [['x2-dark-knight-darkness', true], ['x2-dark-knight-attack', false]] as const) {
      const b = realBoard('paragon');
      b.unit('paragon').aiMemory = {};
      const script = aiScriptFor('paragon');
      const answer = script.onPartyAction!(b.ctx('paragon'), b.unit('yuna'), { abilityId: ability, aimedAtSelf: true });
      expect(answer?.kind === 'ability' && answer.id === 'paragon-big-bang', ability).toBe(expectBang);
    }
  });
});

describe('rows left as they are, and why', () => {
  it('P6: the stat bytes stay as authored (TR8 = a, and W3 keeps every stat byte): MDEF 88 against the row\'s 89, ACC from the row', () => {
    expect(paragon.stats).toMatchObject({ mdef: 88, def: 88, mag: 244, agi: 188, luck: 13 });
  });

  it('the pick helper is the one the other scripts use: draws are 16-bit rolls and 31-bit picks, nothing else', () => {
    const p = paragonUnit();
    const seen: number[] = [];
    const rng: Rng = scriptedRng([2, 1]);
    const real = rng.int;
    rng.int = (a: number, b: number) => (seen.push(b), real(a, b));
    paragonScript.decide(boardOf(p, [p, ...girls()], rng).ctx);
    expect(seen).toEqual([0xffff, 0x7fffffff]);
  });
});
