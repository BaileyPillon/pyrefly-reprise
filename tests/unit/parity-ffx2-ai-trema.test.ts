/**
 * Re-parity AI-FFX2-b, Chapter XIII link 2, Trema (**FFX-2 only**): the game's own scripts `m295` (story) and `m328` (the Fiend
 * Arena), which decide identically (`research/re-ffx2-ai-fallen-trema.md` section 7; rows T1 to T5). One decision table, run
 * against the shipped scripts and records [hard rule 3]; the exact outcome tables enumerate every class of `random() mod n`
 * (`helpers/ffx2ScriptTally.ts`).
 *
 * Kept as Bailey decided and listed for him (D-146/TR4 = b, "his AI still needs the MP"): row T4, the MP gate on Demi, Flare and Ultima.
 * Checked before touching Trema: D-146 (TR1 to TR19), D-151, D-410 (the chapter's difficulty is the intended one; the rules here are the
 * game's, no number of a boss or a girl moves) and D-506 (the retry rule, which this lane does not touch).
 *
 * Mutation-checked by hand (scratch, one line at a time, each caught here): the half line tested before the quarter; "below" as "at or
 * below"; the quarter row not swallowing the half Meteor; a trigger allowed between chain links; the chain's targets rolled link by link;
 * the story Demi back at 3/24; the MP gate removed.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, AbilityCommand, Command } from '../../src/battle/common/types.ts';
import { aiScriptFor } from '../../src/battle/ffx2/ai/index.ts';
import { tremaArenaScript, tremaScript } from '../../src/battle/ffx2/ai/trema.ts';
import { aiUnit } from '../../src/battle/ffx2/fixtures.ts';
import type { Ffx2Unit } from '../../src/battle/ffx2/internal.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { trema } from '../../src/data/ffx2/enemies/trema.ts';
import { tremaArena } from '../../src/data/ffx2/enemies/trema-options.ts';
import { boardOf, exactTally, girls, residueCount, scriptedRng, share, total } from './helpers/ffx2ScriptTally.ts';

const ab = (id: string): AbilityDef => data.ABILITIES[id] as AbilityDef;
const cmd = (c: Command | null): AbilityCommand => {
  expect(c, 'a command').not.toBeNull();
  return c as AbilityCommand;
};
const P = (count: number): number => count / 65536;
/** The count of 16-bit values with `v % 2 === r` / `v % 3 === r`, from the classes of a modulus-6 enumeration. */
const mod2 = (r: number): number => [0, 1, 2, 3, 4, 5].filter((c) => c % 2 === r).reduce((n, c) => n + residueCount(c, 6), 0);
const mod3 = (r: number): number => [0, 1, 2, 3, 4, 5].filter((c) => c % 3 === r).reduce((n, c) => n + residueCount(c, 6), 0);

const MAX = 999999;

function tremaUnit(hp = MAX, memory: Record<string, number | string> = {}, scriptId = 'trema'): Ffx2Unit {
  const u = aiUnit('trema', 'enemy', MAX, 0);
  u.enemy = { aiScriptId: scriptId, formIndex: 0, forms: [], rewards: trema.rewards };
  u.stats.maxMp = 999;
  u.mp = 999;
  u.hp = hp;
  u.aiMemory = { ...memory };
  return u;
}

describe('the action entry (m295 / m328): rows 4 to 7 of 7.1, exactly', () => {
  const run = (script: typeof tremaScript, id: string) => (rng: ReturnType<typeof scriptedRng>) => {
    const u = tremaUnit(MAX, {}, id);
    const c = cmd(script.decide(boardOf(u, [u, ...girls()], rng).ctx));
    return c.id;
  };

  it('T1: the chain 12/24, Waning Moon, Beguiling Mire and Choking Mist 2/24 each, Flare 2/24, Demi 4/24; the story script too', () => {
    // r1 mod 2 = 0 -> the chain; else r2 mod 2 = 0 -> a girl, then r3 mod 3: 0 Moon, 1 Mire, 2 Mist; else r4 mod 3 = 0 -> Flare, else Demi.
    const quarter = P(mod2(1)) * P(mod2(0));
    for (const [script, id, mire] of [[tremaScript, 'trema', 'trema-beguiling-mire'], [tremaArenaScript, 'trema-arena', 'trema-arena-beguiling-mire']] as const) {
      const tally = exactTally(run(script, id), 12);
      expect(share(tally, 'trema-dying-star')).toBeCloseTo(P(mod2(0)), 12);
      expect(share(tally, 'trema-waning-moon')).toBeCloseTo(quarter * P(mod3(0)), 12);
      expect(share(tally, mire)).toBeCloseTo(quarter * P(mod3(1)), 12);
      expect(share(tally, 'trema-choking-mist')).toBeCloseTo(quarter * P(mod3(2)), 12);
      expect(share(tally, 'trema-flare')).toBeCloseTo(quarter * P(mod3(0)), 12);
      expect(share(tally, 'trema-demi')).toBeCloseTo(quarter * (1 - P(mod3(0))), 12);
      expect(total(tally)).toBeCloseTo(1, 12);
      // Demi is 1/6 (the first build's story table said 1/8) and Flare 1/12 (it said 1/8).
      expect(share(tally, 'trema-demi')).toBeGreaterThan(0.16);
      expect(share(tally, 'trema-demi')).toBeLessThan(0.17);
      expect(share(tally, 'trema-flare')).toBeCloseTo(1 / 12, 3);
    }
  }, 120_000); // about a second alone; 12 classes over four rolls, twice, so a loaded machine (the full suite, several lanes) needs room

  it('T5: Beguiling Mire is one row (0x40d4) in both versions: power 5, three hits, Stop chance 120', () => {
    expect(ab('trema-beguiling-mire')).toMatchObject({ power: 5, hits: 3 });
    expect(ab('trema-arena-beguiling-mire')).toMatchObject({ power: 5, hits: 3 });
    expect(ab('trema-beguiling-mire').ffx2Record).toMatchObject({ id: 0x40d4, power: 5, hits: 3 });
    expect(trema.abilityIds).toContain('trema-beguiling-mire');
    expect(tremaArena.abilityIds).toContain('trema-arena-beguiling-mire');
  });

  it('the Moon, Mire and Mist pick their girl BEFORE the three-way roll; Flare rolls first and then picks', () => {
    const u = tremaUnit();
    // r1 = 1 (not the chain), r2 = 0 (the spell row), pick 2 (Paine), r3 = 1 -> Beguiling Mire.
    expect(tremaScript.decide(boardOf(u, [u, ...girls()], scriptedRng([1, 0, 2, 1])).ctx)).toEqual({ kind: 'ability', id: 'trema-beguiling-mire', targets: ['paine'] });
    // r1 = 1, r2 = 1, r4 = 0 -> Flare, then pick 1 (Rikku).
    const v = tremaUnit();
    expect(tremaScript.decide(boardOf(v, [v, ...girls()], scriptedRng([1, 1, 0, 1])).ctx)).toEqual({ kind: 'ability', id: 'trema-flare', targets: ['rikku'] });
    // r1 = 1, r2 = 1, r4 = 1 -> Demi on the party.
    const w = tremaUnit();
    expect(tremaScript.decide(boardOf(w, [w, ...girls()], scriptedRng([1, 1, 1])).ctx)).toEqual({ kind: 'ability', id: 'trema-demi', targets: [] });
  });
});

describe('T3: the chain is queued in one poll, so no HP row can fall inside it', () => {
  it('the three links go to three girls rolled in that poll, in order: Dying Star, Falling Leaf, Thundering Wave', () => {
    const u = tremaUnit();
    const b = boardOf(u, [u, ...girls()], scriptedRng([0, 2, 0, 1])); // r1 = 0 (the chain), then the picks Paine, Yuna, Rikku
    expect(tremaScript.decide(b.ctx)).toEqual({ kind: 'ability', id: 'trema-dying-star', targets: ['paine'] });
    expect(tremaScript.decide(b.ctx)).toEqual({ kind: 'ability', id: 'trema-falling-leaf', targets: ['yuna'] });
    expect(tremaScript.decide(b.ctx)).toEqual({ kind: 'ability', id: 'trema-thundering-wave', targets: ['rikku'] });
  });

  it('a line passed in the middle of the chain waits for the poll after it: the Ultima and both Meteors come after the Thundering Wave', () => {
    const u = tremaUnit();
    const b = boardOf(u, [u, ...girls()], scriptedRng([0, 0, 1, 2]));
    expect(cmd(tremaScript.decide(b.ctx)).id).toBe('trema-dying-star');
    u.hp = 100000; // below the half, the quarter and the sixth in one blow
    expect(cmd(tremaScript.decide(b.ctx)).id).toBe('trema-falling-leaf');
    expect(cmd(tremaScript.decide(b.ctx)).id).toBe('trema-thundering-wave');
    expect(cmd(tremaScript.decide(b.ctx)).id).toBe('trema-ultima'); // the first row read at the next poll
  });

  it('the draws of the poll: one roll and three picks for the chain, nothing for the later links', () => {
    const u = tremaUnit();
    const draws: number[] = [];
    const rng = scriptedRng([0, 0, 1, 2]);
    const real = rng.int;
    rng.int = (a: number, b2: number) => (draws.push(b2), real(a, b2));
    const b = boardOf(u, [u, ...girls()], rng);
    tremaScript.decide(b.ctx);
    tremaScript.decide(b.ctx);
    tremaScript.decide(b.ctx);
    expect(draws).toEqual([0xffff, 0x7fffffff, 0x7fffffff, 0x7fffffff]);
  });
});

describe('T2: Ultima, then the quarter Meteor (which also swallows a skipped half), then the half Meteor; strict, integer divisions', () => {
  const next = (u: Ffx2Unit, seed = [1, 1, 1]) => cmd(tremaScript.decide(boardOf(u, [u, ...girls()], scriptedRng(seed)).ctx)).id;

  it('the lines are max/2 = 499,999, max/4 = 249,999 and max/6 = 166,666: HP equal to a line is not below it', () => {
    for (const [hp, line] of [[499999, 'half'], [249999, 'quarter'], [166666, 'sixth']] as const) {
      const u = tremaUnit(hp, line === 'half' ? {} : line === 'quarter' ? { tremaMeteor: 1, tremaMeteorsCast: 1 } : { tremaMeteor: 2, tremaMeteorsCast: 2 });
      expect(next(u), `${hp} is not below ${line}`).not.toMatch(/meteor|ultima/);
    }
    expect(next(tremaUnit(499998))).toBe('trema-meteor');
    expect(next(tremaUnit(249998, { tremaMeteor: 1, tremaMeteorsCast: 1 }))).toBe('trema-meteor');
    expect(next(tremaUnit(166665, { tremaMeteor: 2, tremaMeteorsCast: 2 }))).toBe('trema-ultima');
  });

  it('in play order: Meteor at the half, Meteor at the quarter, Ultima at the sixth, each exactly once', () => {
    const u = tremaUnit(499998);
    const seen: string[] = [];
    const step = (hp: number) => {
      u.hp = hp;
      seen.push(next(u));
      seen.push(next(u));
    };
    step(499998);
    step(249998);
    step(166665);
    expect(seen.filter((id) => /meteor|ultima/.test(id))).toEqual(['trema-meteor', 'trema-meteor', 'trema-ultima']);
    expect(seen[1]).not.toMatch(/meteor|ultima/); // the same HP does not fire the line again
  });

  it('falling past BOTH Meteor lines before the first is cast: ONE Meteor, and the half Meteor is skipped for good', () => {
    const u = tremaUnit(249000);
    const b = boardOf(u, [u, ...girls()], scriptedRng([1, 1, 1, 1, 1, 1, 1, 1]));
    expect(cmd(tremaScript.decide(b.ctx)).id).toBe('trema-meteor');
    expect(u.aiMemory).toMatchObject({ tremaMeteor: 2, tremaMeteorsCast: 1 });
    for (let i = 0; i < 6; i++) expect(cmd(tremaScript.decide(b.ctx)).id).not.toBe('trema-meteor');
    u.hp = 400000; // (a heal cannot bring the half line back either)
    expect(cmd(tremaScript.decide(b.ctx)).id).not.toBe('trema-meteor');
  });

  it('past the sixth line with nothing cast: Ultima first, then the (one) Meteor, then the normal rows', () => {
    const u = tremaUnit(100000);
    const b = boardOf(u, [u, ...girls()], scriptedRng([1, 1, 1, 1, 1, 1]));
    expect([1, 2, 3].map(() => cmd(tremaScript.decide(b.ctx)).id).slice(0, 2)).toEqual(['trema-ultima', 'trema-meteor']);
  });

  it('the callouts name a Meteor by how many have been cast: the one Meteor of a skipped half line is the first', () => {
    const u = tremaUnit(249000);
    const b = boardOf(u, [u, ...girls()], scriptedRng([1, 1, 1]));
    tremaScript.decide(b.ctx);
    expect(b.events.map((e) => (e as { name?: string }).name)).toEqual(['trema-meteor-1']);
    const v = tremaUnit(499998);
    const c = boardOf(v, [v, ...girls()], scriptedRng([1, 1, 1, 1, 1, 1]));
    tremaScript.decide(c.ctx);
    v.hp = 249998;
    tremaScript.decide(c.ctx);
    v.hp = 100000;
    tremaScript.decide(c.ctx);
    expect(c.events.map((e) => (e as { name?: string }).name)).toEqual(['trema-meteor-1', 'trema-meteor-2', 'trema-ultima']);
  });
});

describe('T4 (kept, TR4 = b): the script never reads MP, but Bailey kept the gate on Demi, Flare and Ultima; Meteor and the chain need none', () => {
  it('a drained Trema passes the turn instead of casting a spell he cannot afford, with a line', () => {
    const u = tremaUnit();
    u.mp = 53;
    const b = boardOf(u, [u, ...girls()], scriptedRng([1, 1, 0, 0])); // r1 1, r2 1, r4 0 -> Flare (54 MP)
    expect(tremaScript.decide(b.ctx)).toBeNull();
    expect(b.events.some((e) => e.type === 'message' && /lacks the MP for Flare/.test(String((e as { text?: string }).text)))).toBe(true);
    u.mp = 0;
    expect(cmd(tremaScript.decide(boardOf(u, [u, ...girls()], scriptedRng([0, 0, 1, 2])).ctx)).id).toBe('trema-dying-star');
    const v = tremaUnit(499998);
    v.mp = 0;
    expect(cmd(tremaScript.decide(boardOf(v, [v, ...girls()], scriptedRng([0])).ctx)).id).toBe('trema-meteor');
  });
});

describe('registration', () => {
  it('both scripts are registered by the ids the records carry', () => {
    expect(aiScriptFor(trema.aiScriptId).id).toBe('trema');
    expect(aiScriptFor(tremaArena.aiScriptId).id).toBe('trema-arena');
  });
});
