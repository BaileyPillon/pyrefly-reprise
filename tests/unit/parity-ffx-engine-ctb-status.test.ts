/**
 * **Engine-level parity, FFX turn order (CTB)** (re-parity W2; **FFX only**). The status half of the batch is in
 * `parity-ffx-engine-status.test.ts`, the per-turn ticks in `parity-ffx-engine-ticks.test.ts`; all three follow the pattern of
 * `parity-ffx-engine-wiring.test.ts`: the engine's own path against an oracle that runs the kernels by an independent route.
 *
 * The kernel tests (`parity-ffx-ctb.test.ts` and friends) prove each function against the game's own machine code. This file
 * proves the WIRING of the turn queue, on a few hundred generated fields written in the game's terms (character slots,
 * Agility, counter bytes, Haste and Slow counters, dead / Petrified / off-field flags, the party off-stage while an aeon is
 * out):
 *
 * 1. the clock: the engine's one-jump advance arrives where the scheduler kernel, called once per tick, arrives, with the
 *    same elapsed ticks, the same counters, the same Regen tick counters and the same character taking the turn;
 * 2. the opening counters: the engine draws the kernel's 26 fixed draws (none for a preemptive or ambush start), each in the
 *    range the kernel reduces to, and every combatant ends up with the kernel's counter and stored base value;
 * 3. recovery: `HasteSlow(tickSpeed * max(rank, 1))` as a byte add, with the Haste and Slow counters as they stand;
 * 4. the Haste and Slow commands, Delay Attack and Buster and the revive counter, through the engine's own `resolveAbility`;
 * 5. the turn forecast agrees with the game's tie key.
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { nextActor, predictTurnOrder, recoveryTicks, resolveAbility, seedInitialCtb } from '../../src/battle/ffx/index.ts';
import { advance, chargeTurn, onRevived } from '../../src/battle/ffx/turnQueue.ts';
import { ctbAfterAction, delayForRank, tickSpeed } from '../../src/battle/ffx/kernel/ctb.ts';
import { isTicked, type SchedChr } from '../../src/battle/ffx/kernel/ctb-scheduler.ts';
import { initialCtb } from '../../src/battle/ffx/kernel/ctb-init.ts';
import {
  contextOfField,
  chance,
  firstReady,
  makeRng,
  oracleOpeningSlots,
  oracleView,
  pick,
  randomField,
  runSchedulerLoop,
} from './helpers/ffxEngineCtb.ts';
import { ScriptedRng, combatantOf, contextOf, randomSide } from './helpers/ffxEngineWiring.ts';

describe('the clock: the engine jumps to where the scheduler kernel arrives tick by tick', () => {
  it('400 generated fields: the same ticks, counters, Regen tick counters and character', () => {
    const rng = makeRng(20261009);
    let jumped = 0;
    let ties = 0;
    let stalled = 0;
    for (let i = 0; i < 400; i++) {
      const field = randomField(rng);
      const view = oracleView(field);
      const { ctx, byId } = contextOfField(field, makeRng(1));
      const want = runSchedulerLoop(view);
      const elapsed = advance(ctx);
      const actor = nextActor(ctx);
      const note = JSON.stringify(field.members.map((m) => [m.id, m.agi, m.ctb, m.dead, m.petrified, m.removed, m.ordersOnly, m.haste, m.slow]));
      if (want.actor === null) {
        // Nobody can ever act: the engine reports no turn and leaves the field alone.
        expect(actor, note).toBeUndefined();
        stalled++;
        continue;
      }
      expect(elapsed, note).toBe(want.ticks);
      const wantActor = field.members.find((m) => m.slot === want.actor);
      expect(actor?.id, note).toBe(wantActor?.id);
      for (const m of field.members) {
        const rt = ctx.rt.actors.get(m.id)!;
        const after = want.chrs[m.slot] as SchedChr;
        // A character the clock does not count (off the field, dead, Petrified) keeps its counter and tick counter as they were.
        expect([rt.ctb, rt.regenTicks], `${note} ${m.id}`).toEqual([after.ctb, after.tickCounter]);
        expect(byId.get(m.id)).toBeDefined();
      }
      if (want.ticks > 0) jumped++;
      const ready = oracleView(field);
      const ctbs = field.members.filter((m) => isTicked(ready[m.slot] as SchedChr)).map((m) => m.ctb);
      if (new Set(ctbs).size < ctbs.length) ties++;
    }
    expect(jumped).toBeGreaterThan(120);
    expect(ties).toBeGreaterThan(30);
    expect(stalled).toBeLessThan(40);
  });

  it('when somebody is already at 0 the clock does not move', () => {
    const rng = makeRng(5);
    let found = 0;
    for (let i = 0; i < 200 && found < 20; i++) {
      const field = randomField(rng);
      const first = field.members.find((m) => !m.dead && !m.petrified && !m.removed && !m.ordersOnly && !(m.side === 'party' && field.aeonOut !== null) && !(m.side === 'aeon' && field.aeonOut !== m.id));
      if (!first) continue;
      first.ctb = 0;
      const { ctx } = contextOfField(field, makeRng(1));
      const want = firstReady(oracleView(field));
      expect(advance(ctx)).toBe(0);
      const actor = nextActor(ctx);
      expect(actor?.id).toBe(field.members.find((m) => m.slot === want)?.id);
      found++;
    }
    expect(found).toBe(20);
  });

  it('equal counters go by the game\'s key: higher Agility first among party and aeons, party before monsters, monsters in formation order', () => {
    const rng = makeRng(77);
    for (let i = 0; i < 100; i++) {
      const field = randomField(rng);
      const live = field.members.filter((m) => !m.dead && !m.petrified && !m.removed && !m.ordersOnly && !(m.side === 'party' && field.aeonOut !== null) && !(m.side === 'aeon' && field.aeonOut !== m.id));
      for (const m of live) m.ctb = 0;
      if (live.length < 2) continue;
      const { ctx } = contextOfField(field, makeRng(1));
      const expected = [...live].sort((a, b) => {
        const key = (m: typeof a): number => (m.side === 'enemy' ? m.slot + 0x10000 : (255 - m.agi) * 256 + m.slot);
        return key(a) - key(b);
      })[0];
      expect(nextActor(ctx)?.id).toBe(expected?.id);
    }
  });
});

describe('the opening counters', () => {
  it('300 generated fields: the kernel\'s 26 fixed draws, in range, and its counters and stored bases', () => {
    const rng = makeRng(91);
    let normal = 0;
    for (let i = 0; i < 300; i++) {
      const field = randomField(rng);
      const condition = pick(rng, ['normal', 'normal', 'preemptive', 'ambush', 'scripted'] as const);
      // The opening happens before anyone is hurt: nobody is dead or petrified yet, and the counters start from nothing.
      for (const m of field.members) {
        m.dead = false;
        m.petrified = false;
      }
      const raws = Array.from({ length: 26 }, () => rng.int(0, 0x7fffffff));
      const scripted = new ScriptedRng(raws);
      const { ctx } = contextOfField(field, scripted);
      seedInitialCtb(ctx, condition);

      // The oracle: the kernel on the field written in the game's terms, with the same raw draws.
      let cursor = 0;
      const moduli: number[] = [];
      const want = initialCtb(condition === 'preemptive' ? 1 : condition === 'ambush' ? 2 : 0, oracleOpeningSlots(field), (_stream, modulus) => {
        moduli.push(modulus);
        return raws[cursor++] as number;
      });
      const note = `${condition} ${JSON.stringify(field.members.map((m) => [m.id, m.slot, m.agi, m.haste, m.slow, m.firstStrike, m.removed]))}`;
      const startsNormal = condition === 'normal' || condition === 'scripted';
      expect(scripted.calls.length, note).toBe(startsNormal ? 26 : 0);
      expect(scripted.calls.map((c) => c.max + 1), note).toEqual(moduli);
      expect(scripted.calls.every((c) => c.min === 0), note).toBe(true);
      for (const m of field.members) {
        const rt = ctx.rt.actors.get(m.id)!;
        expect([rt.ctb, rt.icv], `${note} ${m.id}`).toEqual([want.ctb[m.slot], want.base[m.slot]]);
      }
      if (startsNormal) normal++;
    }
    expect(normal).toBeGreaterThan(150);
  });
});

describe('recovery, the revive counter and the stored base', () => {
  it('charging an action adds HasteSlow(tickSpeed * max(rank, 1)) to the counter as a byte', () => {
    const rng = makeRng(12);
    for (let i = 0; i < 300; i++) {
      const field = randomField(rng);
      const { ctx, byId } = contextOfField(field, makeRng(1));
      const m = pick(rng, field.members);
      const rank = pick(rng, [-1, 0, 1, 2, 3, 3, 4, 5, 6, 8, 10, 40]);
      const before = ctx.rt.actors.get(m.id)!.ctb;
      chargeTurn(ctx, m.id, rank);
      const want = ctbAfterAction(before, delayForRank(m.agi, rank, m.haste, m.slow));
      expect(ctx.rt.actors.get(m.id)!.ctb, JSON.stringify([m, rank])).toBe(want);
      expect(recoveryTicks(byId.get(m.id)!, rank)).toBe(delayForRank(m.agi, rank, m.haste, m.slow));
    }
  });

  it('a revived character\'s counter is the base stored at the opening, not one recomputed from its present Agility', () => {
    const rng = makeRng(8);
    for (let i = 0; i < 60; i++) {
      const field = randomField(rng);
      const { ctx, byId } = contextOfField(field, makeRng(1));
      const m = pick(rng, field.members);
      seedInitialCtb(ctx, 'normal');
      const stored = ctx.rt.actors.get(m.id)!.icv;
      byId.get(m.id)!.stats.agi = chance(rng, 0.5) ? 255 : 1; // Agility changes after the opening
      onRevived(ctx, m.id);
      expect(ctx.rt.actors.get(m.id)!.ctb).toBe(stored);
      expect(stored).toBe((tickSpeed(m.agi) * 3) & 0xff);
    }
  });
});

describe('the Haste and Slow commands, Delay Attack and Buster, through the engine\'s own action', () => {
  const by = (id: string): AbilityDef => ALL_ABILITIES.find((a) => a.id === id) as AbilityDef;
  /** A party user and an enemy target with the given counter, on scripted draws. */
  function cast(def: AbilityDef, ctb: number, over: (t: ReturnType<typeof randomSide>) => void = () => {}): { before: number; after: number; counters: Record<string, unknown> } {
    const rng = makeRng(ctb * 31 + def.id.length);
    const userSpec = randomSide(rng, true);
    const targetSpec = randomSide(rng, false);
    Object.assign(targetSpec, { zombie: false, petrify: false, sleep: false, nul: [0, 0, 0, 0], eva: 0, immuneDelay: false, ctb, agi: 20, absorb: 0, nullMask: 0 });
    over(targetSpec);
    const user = combatantOf(userSpec, 'u', 'party');
    const target = combatantOf(targetSpec, 't', def.targeting === 'single-ally' ? 'party' : 'enemy');
    const { ctx } = contextOf(user, target, new ScriptedRng(Array.from({ length: 24 }, () => 123456789)), ctb);
    resolveAbility(ctx, user, def, [target.id]);
    return { before: ctb, after: ctx.rt.actors.get('t')!.ctb, counters: {} };
  }

  it('Haste halves a pending wait and Slow doubles it (formula 0xd: counter * power / 16, power 8 or 16), clamped to 255', () => {
    for (const ctb of [0, 1, 2, 9, 30, 45, 99, 200, 255]) {
      const haste = cast(by('haste'), ctb);
      // counter 45: 45 * 8 / 16 = 22 comes off, leaving 23
      expect(haste.after, `haste at ${ctb}`).toBe(ctb - Math.trunc((ctb * 8) / 16));
      const slow = cast(by('slow'), ctb, (t) => Object.assign(t, { shell: false }));
      expect(slow.after, `slow at ${ctb}`).toBe(Math.min(255, ctb + ctb));
    }
  });

  it('a Delay Attack adds tickSpeed * 3 / 2 and a Delay Buster tickSpeed * 3 to the target\'s counter; an immune target ignores both', () => {
    // Target Agility 20 -> tick speed 10: 10 * 3 / 2 = 15 and 30
    const weak = cast(by('delay-attack'), 7);
    expect(weak.after).toBeGreaterThanOrEqual(7); // a miss leaves it; the amount, when it hits, is 15
    const hits: number[] = [];
    for (let seed = 0; seed < 12; seed++) {
      const r = cast(by('delay-attack'), 7 + seed, (t) => Object.assign(t, { eva: 0 }));
      hits.push(r.after - r.before);
    }
    expect(new Set(hits.filter((d) => d > 0))).toEqual(new Set([15]));
    const buster: number[] = [];
    for (let seed = 0; seed < 12; seed++) {
      const r = cast(by('delay-buster'), 3 + seed);
      buster.push(r.after - r.before);
    }
    expect(new Set(buster.filter((d) => d > 0))).toEqual(new Set([30]));
    const immune = cast(by('delay-attack'), 20, (t) => Object.assign(t, { immuneDelay: true }));
    expect(immune.after).toBe(20);
  });
});

describe('the turn forecast', () => {
  it('predictTurnOrder plays the game\'s rule forward: the lowest counter first, ties by the key, each one\'s rank-3 recovery added', () => {
    const rng = makeRng(31);
    let ties = 0;
    for (let i = 0; i < 300; i++) {
      const field = randomField(rng);
      // Equal counters are where the key lives: make many of them.
      const live = field.members.filter((m) => !m.dead && !m.petrified && !m.removed && !m.ordersOnly && !(m.side === 'party' && field.aeonOut !== null) && !(m.side === 'aeon' && field.aeonOut !== m.id));
      if (live.length >= 2 && chance(rng, 0.7)) for (const m of live) if (chance(rng, 0.6)) m.ctb = (live[0] as typeof m).ctb;
      const { ctx } = contextOfField(field, makeRng(1));
      const rows = predictTurnOrder(ctx, 8);
      // The oracle: the same field written in the game's terms.
      const counters = new Map(live.map((m) => [m.id, m.ctb]));
      const keyOf = (m: (typeof live)[number]): number => (m.side === 'enemy' ? m.slot + 0x10000 : (255 - m.agi) * 256 + m.slot);
      const want: Array<[string, number]> = [];
      for (let r = 0; r < 8 && live.length > 0; r++) {
        const best = [...live].sort((a, b) => (counters.get(a.id)! - counters.get(b.id)!) || keyOf(a) - keyOf(b))[0]!;
        const tick = counters.get(best.id)!;
        want.push([best.id, tick]);
        counters.set(best.id, tick + delayForRank(best.agi, 3, best.haste, best.slow));
      }
      expect(rows.map((r) => [r.actorId, r.tickValue]), JSON.stringify(field.members.map((m) => [m.id, m.slot, m.agi, m.ctb]))).toEqual(want);
      if (new Set(live.map((m) => m.ctb)).size < live.length) ties++;
    }
    expect(ties).toBeGreaterThan(100);
  });
});
