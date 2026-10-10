/**
 * Re-parity AI-FFX2-b, Chapter XI (**FFX-2 only**): the Magus Sisters follow the game's own scripts
 * (`research/re-ffx2-ai-fallen-trema.md` section 3; rows M1 to M7). Shiva and Anima are `parity-ffx2-ai-fallen-aeons.test.ts`. One decision table per fight, run
 * against the shipped script and the real resolver [hard rule 3]; the exact outcome tables come from enumerating every class of
 * `random() mod n`, the way the note got its tallies from the compiled scripts (`helpers/ffx2ScriptTally.ts`).
 *
 * Interpreter tallies reproduced here (note 3): a sister's gauge reaches 100 on her 20th poll; Sandy's Razzia is 1/3 (21,846 of 65,536
 * values), Mindy's Passado 1/3, Cindy's Camisade 2/5.
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): Cindy casting Delta Attack without the flags; the flags not
 * lowered by a fall; the reset flag not zeroing the gauge; White Highwind needing three living sisters; the turn counter starting at 0.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AbilityCommand, Command, Rng } from '../../src/battle/common/types.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { AC } from '../../src/battle/ffx2/ai/fallen-aeons.ts';
import { DELTA_DISARMED_FLAG, FLAG, RESET, TURN } from '../../src/battle/ffx2/ai/magus-sisters.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { resolveAbility, type ResolveContext } from '../../src/battle/ffx2/resolve.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { x2Anima, x2Shiva } from '../../src/data/ffx2/enemies/fallen-aeons-road.ts';
import { cindy as cindyDef } from '../../src/data/ffx2/enemies/magus-sisters.ts';
import { asSelf, boardOf, exactTally, girls, REGISTRY, scriptedRng, share, total } from './helpers/ffx2ScriptTally.ts';

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
describe('The Magus Sisters (m171, m172, m173): M1 to M7', () => {
  const script = aiScriptFor('magus-sisters');
  function trio(memory: { sandy?: Record<string, number | boolean>; cindy?: Record<string, number | boolean>; mindy?: Record<string, number | boolean> } = {}) {
    const sandy = enemyUnit('sandy', 'magus-sisters', 10330, 0);
    const cindy = enemyUnit('cindy', 'magus-sisters', 12240, 1);
    const mindy = enemyUnit('mindy', 'magus-sisters', 9788, 2);
    sandy.aiMemory = { ...memory.sandy };
    cindy.aiMemory = { ...memory.cindy };
    mindy.aiMemory = { ...memory.mindy };
    return { sandy, cindy, mindy, all: [sandy, cindy, mindy] };
  }
  const board = (t: ReturnType<typeof trio>, rng: Rng) => boardOf(t.cindy, [...t.all, ...girls()], rng);
  const poll = (t: ReturnType<typeof trio>, who: Ffx2Unit, rng: Rng) => script.decide(asSelf(board(t, rng), who));

  it('M1: only Cindy casts Delta Attack, on her first poll with her counter at 100 and both flags up; Mindy and Sandy never do', () => {
    const t = trio({ sandy: { [AC]: 100, [FLAG]: 1 }, cindy: { [AC]: 100, [TURN]: 3 }, mindy: { [AC]: 100, [FLAG]: 1 } });
    expect(cmd(poll(t, t.sandy, scriptedRng([0, 0]))).id).not.toBe('x2-magus-delta-attack');
    expect(cmd(poll(t, t.mindy, scriptedRng([0, 0, 0]))).id).not.toBe('x2-magus-delta-attack');
    const rng = scriptedRng([]);
    rng.int = () => {
      throw new Error('Delta Attack must not roll');
    };
    expect(poll(t, t.cindy, rng)).toEqual({ kind: 'ability', id: 'x2-magus-delta-attack', targets: [] });
  });

  it('M1: with a flag missing, or her own counter short, she carries on (+5 a poll, no ceiling)', () => {
    const t = trio({ sandy: { [FLAG]: 1 }, cindy: { [AC]: 100, [TURN]: 3 }, mindy: {} });
    const ids = [1, 2, 3].map(() => cmd(poll(t, t.cindy, scriptedRng([3, 0]))).id);
    expect(ids.every((id) => id !== 'x2-magus-delta-attack')).toBe(true);
    expect(t.cindy.aiMemory?.[AC]).toBe(115); // 100 + 3 x 5, past 100 with nothing to reset it
    const t2 = trio({ sandy: { [FLAG]: 1 }, cindy: { [AC]: 95, [TURN]: 3 }, mindy: { [FLAG]: 1 } });
    expect(cmd(poll(t2, t2.cindy, scriptedRng([3, 0]))).id).not.toBe('x2-magus-delta-attack');
  });

  it('M2: the cast zeroes Cindy at once, drops both flags and raises both reset flags; Mindy and Sandy show 5 (not 0) at their next poll', () => {
    const t = trio({ sandy: { [AC]: 130, [FLAG]: 1 }, cindy: { [AC]: 100, [TURN]: 3 }, mindy: { [AC]: 100, [FLAG]: 1 } });
    poll(t, t.cindy, scriptedRng([]));
    expect(t.cindy.aiMemory?.[AC]).toBe(0);
    for (const s of [t.sandy, t.mindy]) {
      expect(s.aiMemory?.[FLAG]).toBe(0);
      expect(s.aiMemory?.[RESET]).toBe(1);
    }
    poll(t, t.sandy, scriptedRng([1, 0]));
    expect(t.sandy.aiMemory).toMatchObject({ [AC]: 5, [RESET]: 0, [FLAG]: 0 });
    // A reaction before the poll does the same reset: Mindy is hit by a girl's Drain first.
    script.onResult!(asSelf(board(t, scriptedRng([])), t.mindy), girls()[0]!, ab('x2-dark-knight-drain'));
    expect(t.mindy.aiMemory).toMatchObject({ [AC]: 5, [RESET]: 0 });
  });

  it('a sister raises her flag the moment her counter reaches 100, on a poll or on a reaction; twenty polls of her own do it', () => {
    const t = trio();
    for (let i = 1; i <= 20; i++) {
      poll(t, t.sandy, scriptedRng([1, 0]));
      expect(t.sandy.aiMemory?.[FLAG] ?? 0, `poll ${i}`).toBe(i === 20 ? 1 : 0);
    }
    expect(t.sandy.aiMemory?.[AC]).toBe(100);
    const t2 = trio({ mindy: { [AC]: 95 } });
    script.onResult!(asSelf(board(t2, scriptedRng([])), t2.mindy), girls()[0]!, ab('x2-dark-knight-drain'));
    expect(t2.mindy.aiMemory).toMatchObject({ [AC]: 100, [FLAG]: 1 });
  });

  it('a fall lowers the flag for good: Cindy never casts Delta Attack again, whatever her counter', () => {
    const t = trio({ sandy: { [FLAG]: 1 }, cindy: { [AC]: 300, [TURN]: 3 }, mindy: { [FLAG]: 1 } });
    t.mindy.alive = false;
    t.mindy.hp = 0;
    for (let i = 0; i < 6; i++) expect(cmd(poll(t, t.cindy, scriptedRng([3, 0]))).id).not.toBe('x2-magus-delta-attack');
    const b = board(t, scriptedRng([]));
    script.onTurnResolved!(asSelf(b, t.cindy), t.cindy);
    expect(b.flags[DELTA_DISARMED_FLAG]).toBe(true);
    expect(b.events.filter((e) => e.type === 'script-trigger')).toHaveLength(1);
  });

  it('Cindy: the turn counter starts at 7, so the Guard is her first poll, then every eighth; a Delta Attack poll does not advance it', () => {
    const t = trio();
    const ids = Array.from({ length: 17 }, () => cmd(poll(t, t.cindy, scriptedRng([3, 0]))).id);
    expect(ids.map((id, i) => (id === 'x2-cindy-not-so-mighty-guard' ? i + 1 : 0)).filter(Boolean)).toEqual([1, 9, 17]);
    const t2 = trio({ sandy: { [FLAG]: 1 }, cindy: { [AC]: 100, [TURN]: 4 }, mindy: { [FLAG]: 1 } });
    poll(t2, t2.cindy, scriptedRng([]));
    expect(t2.cindy.aiMemory?.[TURN]).toBe(4);
  });

  it('Cindy\'s row: mod 5 = 0 Absorb, 1 Demi, 2 Regen, 3 or 4 Camisade, exactly (13,108 / 13,107 / 13,107 / 26,214 of 65,536)', () => {
    const tally = exactTally((rng) => {
      const t = trio({ cindy: { [TURN]: 0 } });
      const c = cmd(poll(t, t.cindy, rng));
      return c.id === 'x2-cindy-regen' ? `${c.id}:${c.targets[0]}` : c.id;
    }, 5);
    expect(share(tally, 'x2-cindy-absorb')).toBeCloseTo(P(13108), 12);
    expect(share(tally, 'x2-cindy-demi')).toBeCloseTo(P(13107), 12);
    expect(share(tally, 'x2-cindy-camisade')).toBeCloseTo(P(26214), 12);
    // Regen goes to a uniform LIVING SISTER, herself included (three candidates: a third each).
    for (const who of ['sandy', 'cindy', 'mindy']) expect(share(tally, `x2-cindy-regen:${who}`)).toBeCloseTo(P(13107) / 3, 12);
    expect(total(tally)).toBeCloseTo(1, 12);
  });

  it('M5: White Highwind is certain (no roll) when Cindy, Sandy and Mindy are each below max/4, a fallen sister counting as below, no "alive" test', () => {
    const rng = scriptedRng([]);
    rng.int = () => {
      throw new Error('White Highwind must not roll');
    };
    const quarter = (u: Ffx2Unit) => Math.floor(u.stats.maxHp / 4);
    const t = trio({ cindy: { [TURN]: 1 } });
    for (const u of t.all) u.hp = quarter(u) - 1;
    expect(poll(t, t.cindy, rng)).toEqual({ kind: 'ability', id: 'x2-cindy-white-highwind', targets: [] });
    // Strict: exactly max/4 (3,060 / 2,582 / 2,447) is not below.
    const t2 = trio({ cindy: { [TURN]: 1 } });
    for (const u of t2.all) u.hp = quarter(u);
    expect(cmd(poll(t2, t2.cindy, scriptedRng([3, 0]))).id).not.toBe('x2-cindy-white-highwind');
    expect(t2.all.map(quarter)).toEqual([2582, 3060, 2447]);
    // The other two fallen (HP 0), Cindy alone under a quarter: she heals herself on every poll while she is.
    const t3 = trio({ cindy: { [TURN]: 1 } });
    t3.sandy.alive = false;
    t3.sandy.hp = 0;
    t3.mindy.alive = false;
    t3.mindy.hp = 0;
    t3.cindy.hp = quarter(t3.cindy) - 1;
    const rng3 = scriptedRng([]);
    rng3.int = () => {
      throw new Error('White Highwind must not roll');
    };
    expect(cmd(poll(t3, t3.cindy, rng3)).id).toBe('x2-cindy-white-highwind');
    expect(cmd(poll(t3, t3.cindy, rng3)).id).toBe('x2-cindy-white-highwind');
    // One sister above her quarter: no Highwind.
    const t4 = trio({ cindy: { [TURN]: 1 } });
    for (const u of t4.all) u.hp = quarter(u) - 1;
    t4.sandy.hp = t4.sandy.stats.maxHp;
    expect(cmd(poll(t4, t4.cindy, scriptedRng([3, 0]))).id).not.toBe('x2-cindy-white-highwind');
  });

  it('Sandy: Razzia 1/3, Attack 2/3, exactly (21,846 and 43,690 of 65,536); a girl is drawn after the roll', () => {
    const tally = exactTally((rng) => {
      const t = trio();
      return cmd(poll(t, t.sandy, rng)).id;
    }, 3);
    expect(share(tally, 'x2-sandy-razzia')).toBeCloseTo(P(21846), 12);
    expect(share(tally, 'x2-sandy-attack')).toBeCloseTo(P(43690), 12);
    const t = trio();
    expect(poll(t, t.sandy, scriptedRng([0, 2]))).toEqual({ kind: 'ability', id: 'x2-sandy-razzia', targets: ['paine'] });
  });

  it('Mindy: a girl first, then mod 6: Firaga, Blizzaga, Thundaga, Waterga one sixth each, Passado 1/3 (10,923 each, 21,844)', () => {
    const tally = exactTally((rng) => {
      const t = trio();
      return cmd(poll(t, t.mindy, rng)).id;
    }, 6);
    for (const spell of ['firaga', 'blizzaga', 'thundaga', 'waterga']) expect(share(tally, `x2-mindy-${spell}`)).toBeCloseTo(P(10923), 12);
    expect(share(tally, 'x2-mindy-passado')).toBeCloseTo(P(21844), 12);
    // The pick comes first: draws [pick 1, roll 0] -> Rikku, Firaga.
    const t = trio();
    const c = cmd(poll(t, t.mindy, scriptedRng([1, 0])));
    expect(c).toEqual({ kind: 'ability', id: 'x2-mindy-firaga', targets: ['rikku'] });
  });

  it('M6: every result adds 5 and nothing is guarded: Cindy\'s Guard puts +5 on each of the three, herself included, Regen +5 on its target', () => {
    const t = trio();
    const units: Ffx2Unit[] = [...t.all, ...girls()];
    const seeded = boardOf(t.cindy, units, scriptedRng([]));
    const wired = (seed: number): ResolveContext => ({
      units, abilities: REGISTRY, rng: new SeededRng(seed), emit: () => undefined, breaksDamageLimit: () => false,
      onResult: (target, source, ability) => {
        if (target.side === 'enemy') aiScriptFor(target.enemy?.aiScriptId).onResult?.({ ...seeded.ctx, self: target }, source, ability);
      },
    });
    resolveAbility(wired(1), t.cindy, ab('x2-cindy-not-so-mighty-guard'), []);
    expect(t.all.map((u) => u.aiMemory?.[AC])).toEqual([5, 5, 5]);
    resolveAbility(wired(2), t.cindy, ab('x2-cindy-regen'), ['mindy']);
    expect(t.all.map((u) => u.aiMemory?.[AC])).toEqual([5, 5, 10]);
    // Her own Absorb: the strike on the girl is no result of hers, the drain's transfer is one (the dump's "+5 more when she uses Absorb").
    resolveAbility(wired(3), t.cindy, ab('x2-cindy-absorb'), ['yuna']);
    expect(t.cindy.aiMemory?.[AC]).toBe(10);
  });

  it('M7: Regen carries the game\'s counter 50 (row 0x30b6, 790 steps, four ticks) on Cindy\'s Regen and in the Guard; Protect and Shell stay until dispelled', () => {
    const regen = (a: AbilityDef) => a.statusEffects.find((s) => s.status === 'regen');
    expect(regen(ab('x2-cindy-regen'))?.duration).toBe(50);
    expect(regen(ab('x2-cindy-not-so-mighty-guard'))?.duration).toBe(50);
    for (const s of ['protect', 'shell']) {
      expect(ab('x2-cindy-not-so-mighty-guard').statusEffects.find((e) => e.status === s)?.duration).toBe(0);
    }
    expect(ab('x2-cindy-regen').ffx2Record?.statusTime).toEqual({ 3: 50 });
    expect(cindyDef.stats.maxHp).toBe(12240);
    expect(x2Anima.stats.maxHp).toBe(36000);
  });
});

