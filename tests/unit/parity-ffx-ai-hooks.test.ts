/**
 * **Re-parity, boss AI: the pieces every Seymour fight stands on** (FFX only).
 *
 * `research/re-ffx-ai-seymour.md` section 1: the two shapes of chance a script has (`GetRandomValue() & 0xFFFF` and
 * the picker, which draws only with two or more candidates and indexes them by ascending actor number), the hook
 * moments (`onHit` once per action per target, after the last hit record, before the death check) and the queue the
 * reactions run from. The fight-specific tables are `parity-ffx-ai-{flux,macalania,natus,omnis}.test.ts`.
 *
 * The numbers are the interpreter's own: 32,095 of 65,536 raw values satisfy `mod 100 > 50`.
 */

import { describe, expect, it } from 'vitest';
import { macalaniaBuild } from '../../src/data/ffx/builds/macalania.ts';
import { drainScriptReactions } from '../../src/battle/ffx/ai/reaction-drain.ts';
import { canQueueCommand, hasReactions, queueEmit, queueReaction } from '../../src/battle/ffx/ai/hooks.ts';
import {
  COIN_TRUE_COUNT,
  SCRIPT_VALUES,
  actorNumber,
  drawPicker,
  inActorOrder,
  pickMatching,
  rawCoin,
  scriptCoin,
  scriptMod,
  scriptValue,
} from '../../src/battle/ffx/ai/script-random.ts';
import { at, realCtx, status, withRng } from './helpers/seymourParity.ts';

const fresh = (group = 'seymour-anima-macalania') => realCtx(group, 1, macalaniaBuild);

describe('GetRandomValue() and the picker (section 1.3)', () => {
  it('"mod 100 > 50" is true for residues 51 to 99: 32,095 of the 65,536 values, 48.97 %, not a coin', () => {
    let n = 0;
    for (let raw = 0; raw < SCRIPT_VALUES; raw++) if (rawCoin(raw)) n += 1;
    expect(n).toBe(32_095);
    expect(COIN_TRUE_COUNT).toBe(32_095);
    expect(n / SCRIPT_VALUES).toBeCloseTo(0.4897, 4);
  });

  it('"mod 3" over all 65,536 values: residue 0 has 21,846, residues 1 and 2 have 21,845; "mod 4" is exactly uniform', () => {
    const { ctx } = fresh();
    const tally3 = [0, 0, 0];
    const tally4 = [0, 0, 0, 0];
    for (let raw = 0; raw < SCRIPT_VALUES; raw++) {
      withRng(ctx, [raw]);
      const r3 = scriptMod(ctx, 3);
      tally3[r3] = (tally3[r3] ?? 0) + 1;
      withRng(ctx, [raw]);
      const r4 = scriptMod(ctx, 4);
      tally4[r4] = (tally4[r4] ?? 0) + 1;
    }
    expect(tally3).toEqual([21_846, 21_845, 21_845]);
    expect(tally4).toEqual([16_384, 16_384, 16_384, 16_384]);
  });

  it('every script draw is one engine draw over 0 to 0xFFFF, and a picker draw one over the 31-bit range', () => {
    const { ctx } = fresh();
    const rng = withRng(ctx, [7, 8, 9]);
    expect(scriptValue(ctx)).toBe(7);
    expect(scriptCoin(ctx)).toBe(false);
    expect(scriptMod(ctx, 3)).toBe(0);
    expect(rng.calls).toEqual([[0, 0xffff], [0, 0xffff], [0, 0xffff]]);
  });

  it('the picker draws nothing for 0 or 1 candidate, one value for two or more, and a discarded pick still draws', () => {
    const { ctx } = fresh();
    const party = ['tidus', 'yuna', 'rikku'].map((id) => at(ctx, id));
    const rng = withRng(ctx, [4, 5]);
    expect(pickMatching(ctx, [])).toBeUndefined();
    expect(pickMatching(ctx, [party[0]!])).toBe(party[0]);
    expect(rng.calls).toHaveLength(0);
    drawPicker(ctx, 1);
    drawPicker(ctx, 0);
    expect(rng.calls).toHaveLength(0);
    drawPicker(ctx, 3);
    expect(rng.calls).toEqual([[0, 0x7fffffff]]);
    pickMatching(ctx, party);
    expect(rng.calls).toHaveLength(2);
  });

  it('the picker indexes its candidates by ascending actor number, whatever order it is handed them in', () => {
    const { ctx } = fresh();
    const party = ['rikku', 'tidus', 'yuna'].map((id) => at(ctx, id)); // handed in the wrong order
    expect(inActorOrder(ctx, party).map((c) => c.id)).toEqual(['tidus', 'yuna', 'rikku']);
    for (const [raw, want] of [[0, 'tidus'], [1, 'yuna'], [2, 'rikku'], [3, 'tidus'], [0x7ffffffd, 'rikku'], [0x7ffffffe, 'tidus']] as const) {
      withRng(ctx, [raw]);
      expect(pickMatching(ctx, party)?.id, `raw ${raw}`).toBe(want);
    }
  });

  it('actors are numbered the way the scripts number them: the party 0 to 6, aeons from 8, monsters from 20 in formation order', () => {
    const { ctx } = fresh();
    expect(['tidus', 'yuna', 'auron', 'kimahri', 'wakka', 'lulu', 'rikku'].map((id) => actorNumber(ctx, at(ctx, id)))).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(actorNumber(ctx, at(ctx, 'valefor'))).toBe(8);
    expect(actorNumber(ctx, at(ctx, 'shiva'))).toBe(11);
    expect(['guado-guardian-a', 'seymour-macalania', 'guado-guardian-b', 'anima-macalania'].map((id) => actorNumber(ctx, at(ctx, id)))).toEqual([
      20, 21, 22, 23,
    ]);
  });
});

describe('the reaction queue (sections 1.1 and 1.2)', () => {
  it('runs a queued command as its owner\'s reaction, first in first out, with a counter event and no CTB cost', () => {
    const { ctx, events } = fresh();
    const seymour = at(ctx, 'seymour-macalania');
    const ctbBefore = ctx.rt.actors.get(seymour.id)?.ctb;
    queueReaction(ctx, seymour.id, { kind: 'ability', id: 'shell', targets: [seymour.id] });
    queueReaction(ctx, 'guado-guardian-a', { kind: 'ability', id: 'protect', targets: ['guado-guardian-a'] });
    expect(hasReactions(ctx)).toBe(true);
    drainScriptReactions({ ctx, push: ctx.emit });
    expect(hasReactions(ctx)).toBe(false);
    const order = events.filter((e) => e.type === 'counter').map((e) => (e as { abilityId: string }).abilityId);
    expect(order).toEqual(['shell', 'protect']);
    expect(seymour.statuses['shell']).toBeDefined();
    expect(ctx.rt.actors.get(seymour.id)?.ctb).toBe(ctbBefore);
  });

  it('a normal reaction needs its owner to be able to act; a forced one does not (performCommand against forcePerformCommand)', () => {
    const { ctx, events } = fresh();
    const seymour = at(ctx, 'seymour-macalania');
    seymour.statuses['sleep'] = status('sleep');
    expect(canQueueCommand(seymour, false)).toBe(false);
    queueReaction(ctx, seymour.id, { kind: 'ability', id: 'shell', targets: [seymour.id] });
    drainScriptReactions({ ctx, push: ctx.emit });
    expect(seymour.statuses['shell']).toBeUndefined();
    queueReaction(ctx, seymour.id, { kind: 'ability', id: 'shell', targets: [seymour.id] }, { forced: true });
    drainScriptReactions({ ctx, push: ctx.emit });
    expect(seymour.statuses['shell']).toBeDefined();
    expect(events.filter((e) => e.type === 'counter')).toHaveLength(1);
  });

  it('who cannot queue a command: petrified, ejected, asleep, Confused, Berserk, Threatened, and Provoked unless the script keeps control', () => {
    const { ctx } = fresh();
    const g = at(ctx, 'guado-guardian-a');
    expect(canQueueCommand(g, false)).toBe(true);
    for (const s of ['petrify', 'eject', 'sleep', 'confuse', 'berserk', 'threaten'] as const) {
      g.statuses[s] = status(s);
      expect(canQueueCommand(g, false), s).toBe(false);
      expect(canQueueCommand(g, true), s).toBe(false);
      delete g.statuses[s];
    }
    g.statuses['provoke'] = status('provoke');
    expect(canQueueCommand(g, false)).toBe(false);
    expect(canQueueCommand(g, true)).toBe(true);
  });

  it('an event queued by a hook is emitted when the queue drains, after the action\'s own events', () => {
    const { ctx, events } = fresh();
    queueEmit(ctx, { type: 'script-trigger', name: 'later', payload: {} });
    expect(events.some((e) => e.type === 'script-trigger')).toBe(false);
    drainScriptReactions({ ctx, push: ctx.emit });
    expect(events.filter((e) => e.type === 'script-trigger').map((e) => (e as { name: string }).name)).toEqual(['later']);
  });
});
