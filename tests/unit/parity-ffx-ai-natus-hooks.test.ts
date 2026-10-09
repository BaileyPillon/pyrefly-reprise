/**
 * **Re-parity, Chapter X (2 of 2): what reaches Natus and Mortibody, the revive and the pair of slots** (FFX only).
 *
 * Rows of `research/re-ffx-ai-seymour.md` section 4 (tables 4.2 to 4.4); the rows that differ from the old AI are D-06, D-20
 * and D-23. The numbers are the interpreter's: the lines 24,000 and 12,000 (18,000 once reached), the revive values 4,000,
 * 3,000, 2,000, 1,000, 1,000, and the pair of party slots (slot 1 left out by 21,846 of 65,536 values, slots 2 and 3 by
 * 21,845). One finding is this lane's own: in Natus's compiled branch, with the third slot down, the false coin pairs slot 1
 * with the fallen slot 3; the queue rejects a command at a fallen member, so that half of the cast is lost
 * (`ai/slot-pair.ts`). The first half is `parity-ffx-ai-natus.test.ts`.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../src/battle/ffx/index.ts';
import { koActor } from '../../src/battle/ffx/hp.ts';
import { onTurnEnd } from '../../src/battle/ffx/ticks.ts';
import { pickPartyPair } from '../../src/battle/ffx/ai/slot-pair.ts';
import { highbridgeBuild } from '../../src/data/ffx/builds/highbridge.ts';
import { act, at, counters, enemyTurn, exactHit, idOf, realCtx, status, withRng } from './helpers/seymourParity.ts';

const NATUS = 'seymour-natus';
const BODY = 'mortibody';
const PHASE = 'natus.phase';
const LINE = 'natus.phase2Line';
const PROTECT_FIRED = 'natus.protectCountered';
const REVIVE = 'mortibody.reviveHp';

const fresh = (seed = 1) => realCtx('seymour-natus', seed, highbridgeBuild);
const hit = (amount: number) => exactHit(`hit-${amount}`, amount);
/** Hits that landed on a member, by target. */
const landed = (events: readonly BattleEvent[], id: string): number =>
  events.filter((e) => e.type === 'damage' && e.targetId === id && e.amount > 0).length;

describe('Natus\'s onHit (m126 @0x60c to 0x66e, table 4.4): recomputed from his HP at every hit (D-20, D-23)', () => {
  it('24,000 is not below the line; 23,950 is: phase 1, and his one Protect is queued on himself, not forced', () => {
    const { ctx } = fresh();
    const natus = at(ctx, NATUS);
    natus.hp = 24_050;
    const at24 = act(ctx, 'tidus', hit(50), [NATUS]);
    expect(natus.hp).toBe(24_000);
    expect(counters(at24, NATUS)).toEqual([]);
    expect(ctx.state.flags[PHASE]).toBe(1);
    const below = act(ctx, 'tidus', hit(50), [NATUS]);
    expect(natus.hp).toBe(23_950);
    expect(counters(below, NATUS)).toEqual(['protect']);
    expect(natus.statuses['protect']).toBeDefined();
    expect(ctx.state.flags[PHASE]).toBe(2);
    expect(ctx.state.flags[PROTECT_FIRED]).toBe(true);
  });

  it('the phase can go back: healed to 24,000 or more he is in phase 0 again, and keeps the Protect he cast', () => {
    const { ctx } = fresh();
    const natus = at(ctx, NATUS);
    natus.hp = 20_000;
    act(ctx, 'tidus', hit(50), [NATUS]);
    expect(ctx.state.flags[PHASE]).toBe(2);
    natus.hp = 30_000;
    act(ctx, 'tidus', hit(50), [NATUS]);
    expect(ctx.state.flags[PHASE]).toBe(1);
    expect(idOf(chooseAiCommand(ctx, natus))).toBe('natus-multi-blizzara'); // phase 0 again: the pair, not Break
  });

  it('below 12,000 is the last phase, and once reached its line moves to 18,000: he stays in it until he is back at 18,000', () => {
    const { ctx } = fresh();
    const natus = at(ctx, NATUS);
    natus.hp = 12_050;
    act(ctx, 'tidus', hit(50), [NATUS]);
    expect(natus.hp).toBe(12_000);
    expect(ctx.state.flags[PHASE]).toBe(2); // 12,000 is not below 12,000
    expect(ctx.state.flags[LINE] ?? 12_000).toBe(12_000);
    act(ctx, 'tidus', hit(50), [NATUS]);
    expect(natus.hp).toBe(11_950);
    expect(ctx.state.flags[PHASE]).toBe(3);
    expect(ctx.state.flags[LINE]).toBe(18_000);
    natus.hp = 17_000; // healed, but not to the new line
    act(ctx, 'tidus', hit(100), [NATUS]);
    expect(ctx.state.flags[PHASE]).toBe(3);
    natus.hp = 18_050;
    act(ctx, 'tidus', hit(50), [NATUS]);
    expect(natus.hp).toBe(18_000);
    expect(ctx.state.flags[PHASE]).toBe(2); // 18,000 is not below 18,000: phase 1 until 24,000
    act(ctx, 'tidus', hit(50), [NATUS]);
    expect(ctx.state.flags[PHASE]).toBe(3);
  });

  it('the Protect is cast only when he holds none at that moment, and the one-time flag is set only then (D-23)', () => {
    const { ctx } = fresh();
    const natus = at(ctx, NATUS);
    natus.hp = 24_100;
    natus.statuses['protect'] = status('protect');
    const covered = act(ctx, 'tidus', hit(200), [NATUS]);
    expect(counters(covered, NATUS)).toEqual([]);
    expect(ctx.state.flags[PROTECT_FIRED]).not.toBe(true);
    delete natus.statuses['protect']; // the party's Dispel
    const later = act(ctx, 'tidus', hit(200), [NATUS]);
    expect(counters(later, NATUS)).toEqual(['protect']);
    expect(ctx.state.flags[PROTECT_FIRED]).toBe(true);
  });

  it('one Protect for the battle: a Dispel afterwards is never answered', () => {
    const { ctx } = fresh();
    const natus = at(ctx, NATUS);
    natus.hp = 23_000;
    act(ctx, 'tidus', hit(50), [NATUS]);
    delete natus.statuses['protect'];
    expect(counters(act(ctx, 'tidus', hit(500), [NATUS]), NATUS)).toEqual([]);
    expect(natus.statuses['protect']).toBeUndefined();
  });

  it('it does not matter who hit him: a spell of his own that Reflect sent back, or the Mortibsorption drain, runs the hook', () => {
    const { ctx } = fresh();
    at(ctx, NATUS).hp = 24_100;
    const own = exactHit('own-reflected', 300, { targeting: 'single-ally' });
    expect(counters(act(ctx, NATUS, own, [NATUS]), NATUS)).toEqual(['protect']);
  });

  it('once per action however many hits it lands (the hook runs after the last record)', () => {
    const { ctx } = fresh();
    at(ctx, NATUS).hp = 24_100;
    const events = act(ctx, 'tidus', exactHit('three-hits', 100, { hits: 3 }), [NATUS]);
    expect(at(ctx, NATUS).hp).toBe(23_800);
    expect(counters(events, NATUS)).toEqual(['protect']);
  });

  it('Poison never reaches the hook (no postPoison): a tick below the line changes nothing until the next hit', () => {
    const { ctx } = fresh();
    const natus = at(ctx, NATUS);
    natus.hp = 24_100;
    natus.statuses['poison'] = status('poison');
    onTurnEnd(ctx, natus);
    expect(natus.hp).toBeLessThan(24_000);
    expect(ctx.state.flags[PHASE] ?? 1).toBe(1);
    expect(natus.statuses['protect']).toBeUndefined();
    expect(counters(act(ctx, 'tidus', hit(10), [NATUS]), NATUS)).toEqual(['protect']);
  });
});

describe('Mortibody\'s onHit (m127 @0x4f2, D-06): it cannot die, and the drain equals the value it came back at', () => {
  const KILL = exactHit('kill-body', 9_000);

  it('a lethal hit sets HP and max HP to the revive value before the death check: 4,000, 3,000, 2,000, 1,000, 1,000', () => {
    const { ctx } = fresh();
    const body = at(ctx, BODY);
    const natus = at(ctx, NATUS);
    const seen: Array<[number, number, number]> = [];
    for (let i = 0; i < 6; i++) {
      const before = natus.hp;
      act(ctx, 'tidus', KILL, [BODY]);
      seen.push([body.hp, body.stats.maxHp, before - natus.hp]);
      expect(body.alive).toBe(true);
      expect(body.statuses['ko']).toBeUndefined();
    }
    expect(seen).toEqual([
      [4_000, 4_000, 4_000],
      [3_000, 3_000, 3_000],
      [2_000, 2_000, 2_000],
      [1_000, 1_000, 1_000],
      [1_000, 1_000, 1_000],
      [1_000, 1_000, 1_000],
    ]);
    expect(ctx.state.flags[REVIVE]).toBe(1_000);
  });

  it('the presenter\'s fall cue is kept: a ko, a part-destroyed, and the return with the Mortibsorption heal', () => {
    const { ctx } = fresh();
    const events = act(ctx, 'tidus', KILL, [BODY]);
    const types = events.map((e) => e.type);
    expect(types.indexOf('ko')).toBeGreaterThan(-1);
    expect(types.indexOf('part-destroyed')).toBeGreaterThan(types.indexOf('ko'));
    expect(events.some((e) => e.type === 'heal' && e.cause === 'mortibsorption')).toBe(true);
  });

  it('with Natus already at 0 HP there is no drain and the value is not lowered', () => {
    const { ctx } = fresh();
    at(ctx, NATUS).hp = 0;
    const events = act(ctx, 'tidus', KILL, [BODY]);
    expect(at(ctx, BODY).hp).toBe(4_000);
    expect(events.some((e) => e.type === 'heal' && e.cause === 'mortibsorption')).toBe(false);
    expect(ctx.state.flags[REVIVE] ?? 4_000).toBe(4_000);
  });

  it('the drain runs Natus\'s own hook: a drain across the 24,000 line queues his Protect', () => {
    const { ctx } = fresh();
    at(ctx, NATUS).hp = 27_000; // the 4,000 drain lands on 23,000
    const events = act(ctx, 'tidus', KILL, [BODY]);
    expect(at(ctx, NATUS).hp).toBe(23_000);
    expect(counters(events, NATUS)).toEqual(['protect']);
    expect(ctx.state.flags[PHASE]).toBe(2);
  });

  it('a multi-hit action that kills it revives it once, after the last hit', () => {
    const { ctx } = fresh();
    const events = act(ctx, 'tidus', exactHit('three-hits', 9_000, { hits: 3 }), [BODY]);
    expect(events.filter((e) => e.type === 'ko')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'heal' && e.cause === 'mortibsorption')).toHaveLength(1);
    expect(at(ctx, BODY).hp).toBe(4_000);
  });
});

describe('The pair of party slots Natus aims at, and the slip in his compiled branch (m126 @0x29c to 0x510, row 2)', () => {
  it('three standing: the left-out slot is the draw mod 3 (21,846 / 21,845 / 21,845 of 65,536) and the coin orders the rest', () => {
    const { ctx } = fresh();
    const slots = ctx.state.activeIds;
    const leftOut = [0, 0, 0];
    for (let raw = 0; raw < 65_536; raw++) {
      withRng(ctx, [0, raw, 75]);
      const pair = pickPartyPair(ctx, 'natus');
      const missing = slots.findIndex((id) => id !== pair?.[0] && id !== pair?.[1]);
      leftOut[missing] = (leftOut[missing] ?? 0) + 1;
    }
    expect(leftOut).toEqual([21_846, 21_845, 21_845]);
    let ascending = 0;
    for (let raw = 0; raw < 65_536; raw++) {
      withRng(ctx, [0, 0, raw]);
      const pair = pickPartyPair(ctx, 'natus');
      if (pair && slots.indexOf(pair[0]) < slots.indexOf(pair[1])) ascending += 1;
    }
    expect(ascending).toBe(32_095);
  });

  it('with the first or second slot down, the pair is the two living slots, ordered by the coin', () => {
    for (const [down, ascending, descending] of [[0, [1, 2], [2, 1]], [1, [0, 2], [2, 0]]] as const) {
      const { ctx } = fresh();
      const slots = ctx.state.activeIds;
      koActor(ctx, at(ctx, slots[down] as string));
      withRng(ctx, [0, 75]);
      expect(pickPartyPair(ctx, 'natus'), `slot ${down + 1} down, coin true`).toEqual(ascending.map((i) => slots[i]));
      withRng(ctx, [0, 10]);
      expect(pickPartyPair(ctx, 'natus'), `slot ${down + 1} down, coin false`).toEqual(descending.map((i) => slots[i]));
    }
  });

  it('with the THIRD slot down the false coin pairs slot 1 with the fallen slot 3: 33,441 of 65,536 values, 51.03 %', () => {
    const { ctx } = fresh();
    const [t, y, k] = ctx.state.activeIds as [string, string, string];
    koActor(ctx, at(ctx, k));
    let slipped = 0;
    let right = 0;
    for (let raw = 0; raw < 65_536; raw++) {
      withRng(ctx, [0, raw]);
      const pair = pickPartyPair(ctx, 'natus');
      if (pair?.[0] === t && pair[1] === k) slipped += 1;
      else if (pair?.[0] === t && pair[1] === y) right += 1;
    }
    expect(slipped).toBe(33_441);
    expect(right).toBe(32_095);
    // Seymour in Macalania has no such slip: with the third slot down his false coin pairs 2 with 1
    withRng(ctx, [0, 10]);
    expect(pickPartyPair(ctx, 'macalania')).toEqual([y, t]);
  });

  it('the slipped half is refused (the queue rejects a fallen target): only one member is hit, and the cast spends no more draws', () => {
    const { ctx } = fresh();
    const [t, , k] = ctx.state.activeIds as [string, string, string];
    koActor(ctx, at(ctx, k));
    const rng = withRng(ctx, [0, 10]); // mask draw, coin false: the pair is slot 1 and the fallen slot 3
    const { command, events } = enemyTurn(ctx, NATUS);
    expect(command?.targets).toEqual([t, k]);
    expect(landed(events, t) + events.filter((e) => e.type === 'miss' && e.targetId === t).length).toBe(1);
    expect(events.filter((e) => (e.type === 'damage' || e.type === 'miss') && e.targetId === k)).toHaveLength(0);
    expect(rng.spent.script).toBeGreaterThanOrEqual(1);
  });

  it('with the coin true the same cast reaches both living members, one half each', () => {
    const { ctx } = fresh();
    const [t, y, k] = ctx.state.activeIds as [string, string, string];
    koActor(ctx, at(ctx, k));
    withRng(ctx, [0, 75]);
    const { command, events } = enemyTurn(ctx, NATUS);
    expect(command?.targets).toEqual([t, y]);
    const touched = (id: string) => events.filter((e) => (e.type === 'damage' || e.type === 'miss') && e.targetId === id).length;
    expect(touched(t)).toBe(1);
    expect(touched(y)).toBe(1);
  });

  it('one member standing is hit by both halves, with no draw at all', () => {
    const { ctx } = fresh();
    const [t, y, k] = ctx.state.activeIds as [string, string, string];
    koActor(ctx, at(ctx, y));
    koActor(ctx, at(ctx, k));
    const rng = withRng(ctx, [9, 9, 9]);
    const { command } = enemyTurn(ctx, NATUS);
    expect(rng.spent.script + rng.spent.picker).toBe(0);
    expect(command?.targets).toEqual([t, t]);
  });
});
