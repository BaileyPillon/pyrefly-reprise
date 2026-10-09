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
import {
  type HitReport,
  canQueueCommand,
  hasReactions,
  listensToHit,
  queueEmit,
  queueReaction,
  registerScriptHooks,
} from '../../src/battle/ffx/ai/hooks.ts';
import { resolveAbility } from '../../src/battle/ffx/index.ts';
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
import { act, at, exactHit, realCtx, status, withRng } from './helpers/seymourParity.ts';

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

/**
 * **The hit event** (section 1.1), the contract both AI lanes share (this lane's `ai/hooks.ts`, AI lane B's `hit-hooks.ts`):
 * once per action per target, after the last of the action's hit records on that target and before the death check,
 * for a hit, a heal and a status-only move alike; `lastDamage` is the HP results after the cap and before the clamp (overkill
 * counts, a heal is negative); `affectsHp` is the command's HP class bit. A follow-up row is part of its main row's action.
 */
describe('the hit event: once per action per target, after the last record, before the death check', () => {
  interface Call {
    id: string;
    user: string;
    def: string;
    hp: number;
    other: number;
    report: HitReport;
  }
  const calls: Call[] = [];
  const PROBE = 'zz-hit-probe';
  const HOLD = 'zz-hit-probe-hold';
  const HOLD_NO_SAVE = 'zz-hit-probe-hold-nosave';
  registerScriptHooks(PROBE, {
    onHit: (ctx, self, used, report) => {
      const other = self.id === 'guado-guardian-a' ? 'guado-guardian-b' : 'guado-guardian-a';
      calls.push({ id: self.id, user: used.user.id, def: used.def.id, hp: self.hp, other: ctx.state.combatants[other]?.hp ?? -1, report });
    },
  });
  registerScriptHooks(HOLD, {
    holdsDeath: true,
    onHit: (_ctx, self, used, report) => {
      calls.push({ id: self.id, user: used.user.id, def: used.def.id, hp: self.hp, other: -1, report });
      if (self.hp === 0) self.hp = 777; // a script that puts HP back stops the death (Mortiorchis, Mortibody, Macalania's Seymour)
    },
  });
  registerScriptHooks(HOLD_NO_SAVE, {
    holdsDeath: true,
    onHit: (_ctx, self, used, report) => {
      calls.push({ id: self.id, user: used.user.id, def: used.def.id, hp: self.hp, other: -1, report });
    },
  });

  function probed(scriptId = PROBE) {
    calls.length = 0;
    const { ctx, events } = fresh();
    for (const id of ['guado-guardian-a', 'guado-guardian-b']) {
      const c = at(ctx, id);
      c.enemy = { ...c.enemy!, aiScriptId: scriptId, forms: [] };
      c.statuses = {};
      c.stats.maxHp = 5_000;
      c.hp = 5_000;
    }
    return { ctx, events };
  }

  it('three hits on one target are one event, with every record already applied and the three results summed', () => {
    const { ctx } = probed();
    act(ctx, 'tidus', exactHit('probe-3', 100, { hits: 3 }), ['guado-guardian-a']);
    expect(calls).toHaveLength(1);
    const call = calls[0]!;
    expect(call.id).toBe('guado-guardian-a');
    expect(call.user).toBe('tidus');
    expect(call.def).toBe('probe-3');
    expect(call.hp).toBe(4_700); // all three records are in before the hook runs
    expect(call.report).toEqual({ hpBefore: 5_000, lostHp: true, lastDamage: 300, affectsHp: true });
  });

  it('overkill counts: the result is the blow, not the HP that was left; a hook that puts HP back stops the death', () => {
    const { ctx } = probed(HOLD);
    at(ctx, 'guado-guardian-a').hp = 50;
    act(ctx, 'tidus', exactHit('probe-big', 400), ['guado-guardian-a']);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.report).toEqual({ hpBefore: 50, lostHp: true, lastDamage: 400, affectsHp: true });
    expect(calls[0]!.hp).toBe(0); // the KO is pending while the hook runs...
    expect(at(ctx, 'guado-guardian-a').hp).toBe(777); // ...and a hook that puts HP back stops it
    expect(at(ctx, 'guado-guardian-a').alive).toBe(true);
  });

  it('a hold that nothing saves ends in the death once the hook has run', () => {
    const { ctx } = probed(HOLD_NO_SAVE);
    const g = at(ctx, 'guado-guardian-a');
    g.hp = 50;
    act(ctx, 'tidus', exactHit('probe-big', 400), ['guado-guardian-a']);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.hp).toBe(0);
    expect(g.alive).toBe(false);
    expect(g.statuses['ko']).toBeDefined();
  });

  it('a script that does not hold the death sees the body already down', () => {
    const { ctx } = probed();
    const g = at(ctx, 'guado-guardian-a');
    g.hp = 50;
    act(ctx, 'tidus', exactHit('probe-big', 400), ['guado-guardian-a']);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.report.lastDamage).toBe(400);
    expect(g.alive).toBe(false);
  });

  it('a heal is one event with a negative result and no loss of HP', () => {
    const { ctx } = probed();
    at(ctx, 'guado-guardian-a').hp = 1_000;
    const cure = exactHit('probe-heal', 300, { flags: ['heals', 'always-break-damage-limit'], targeting: 'single-ally' });
    act(ctx, 'guado-guardian-b', cure, ['guado-guardian-a']);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.report.lostHp).toBe(false);
    expect(calls[0]!.report.lastDamage).toBe(-300);
    expect(calls[0]!.report.affectsHp).toBe(true);
    expect(at(ctx, 'guado-guardian-a').hp).toBe(1_300);
  });

  it('a status-only move still raises the event, with no HP result and no HP class', () => {
    const { ctx } = probed();
    const slow = exactHit('probe-status', 0, {
      formula: 'none',
      power: 0,
      statusEffects: [{ status: 'slow', chance: 255, duration: 3 }],
    });
    act(ctx, 'tidus', slow, ['guado-guardian-a']);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.report).toEqual({ hpBefore: 5_000, lostHp: false, lastDamage: 0, affectsHp: false });
  });

  it('an all-target action: each target hears of it right after its own last record, before the next target is touched', () => {
    const { ctx } = probed();
    act(ctx, 'tidus', exactHit('probe-all', 100, { hits: 2, targeting: 'all-enemies' }), ['guado-guardian-a']);
    expect(calls.map((c) => c.id)).toEqual(['guado-guardian-a', 'guado-guardian-b']);
    expect(calls[0]!.other).toBe(5_000); // the second target has not been touched when the first one's hook runs
    expect(calls[1]!.other).toBe(4_800); // the first target's two records are in when the second one's runs
    expect(calls.map((c) => c.report.lastDamage)).toEqual([200, 200]);
  });

  it('a follow-up row is part of the action its main row announced: no second event', () => {
    const { ctx } = probed();
    resolveAbility(ctx, at(ctx, 'tidus'), exactHit('probe-main', 100), ['guado-guardian-a']);
    resolveAbility(ctx, at(ctx, 'tidus'), exactHit('probe-last-hit', 50), ['guado-guardian-a'], { followUp: true });
    expect(calls).toHaveLength(1);
    expect(at(ctx, 'guado-guardian-a').hp).toBe(4_850); // the follow-up still landed
  });

  it('only the owner of the script is told, and only when an action reaches it', () => {
    const { ctx } = probed();
    expect(listensToHit(at(ctx, 'guado-guardian-a'))).toBe(true);
    expect(listensToHit(at(ctx, 'tidus'))).toBe(false);
    act(ctx, 'tidus', exactHit('probe-elsewhere', 100), ['guado-guardian-b']);
    expect(calls.map((c) => c.id)).toEqual(['guado-guardian-b']);
  });
});
