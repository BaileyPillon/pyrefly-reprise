/**
 * **What the presenter sees** of the player's Yojimbo and the Magus Sisters (re-parity lane FFX-K; **FFX only**): the event sequences and the state the chapters'
 * screens animate and read. Part 3 of the engine-level tests (`parity-ffx-engine-k-aeons.test.ts` is part 1, `-more` part 2; the same rig, `helpers/ffxKRig.ts`).
 *
 * The sequences were read from a run of the engine and are pinned here, so that a screen written against them (the Pay beat, the Sisters' three summons, the
 * Delta Attack with its bars) is not broken by a change that leaves the rules alone. Where the data decides a number (how many hits the Delta Attack has) the test
 * asks only for "at least one".
 */

import { describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { dismissAeon, summonAeon } from '../../src/battle/ffx/aeons.ts';
import type { Ctx } from '../../src/battle/ffx/state.ts';
import { enemy, stats } from './ffx-fixtures.test.ts';
import { COMBINE, DISMISS, PAY, Rig, SUMMON, build, sisters, yojimbo } from './helpers/ffxKRig.ts';

const types = (events: readonly BattleEvent[]): string[] => events.map((e) => e.type);

/** A monster Zanmato cannot kill (Death resist 255). */
const solid = () => enemy({ id: 'dummy', stats: stats({ hp: 99999, maxHp: 99999, str: 1, agi: 1 }), immunities: { ko: 255 } });

/** Summon Yojimbo at compatibility 0 (no free attack can come) and open his menu; returns the rig and where the log stood. */
function yojimboMenu(seed: number, gil = 100_000): Rig {
  const rig = new Rig(build({ aeons: [yojimbo()], yojimbo: { compatibility: 0, hireAnswer: 1 }, gil }), [solid()], seed);
  rig.until('yuna');
  rig.submit(SUMMON('yojimbo'));
  rig.until('yojimbo');
  return rig;
}

describe('Yojimbo: the events of Pay', () => {
  it('a Pay is the Pay pair, then the command the roll chose with its own start, effects and end', () => {
    const rig = yojimboMenu(1);
    const before = rig.events.length;
    rig.submit(PAY(800));
    const ev = rig.events.slice(before);
    expect(types(ev).slice(0, 3)).toEqual(['action-start', 'action-end', 'action-start']);
    expect(ev[0]).toMatchObject({ type: 'action-start', actorId: 'yojimbo', abilityName: 'Pay' });
    expect(ev[1]).toMatchObject({ type: 'action-end', actorId: 'yojimbo' });
    expect(ev[2]).toMatchObject({ type: 'action-start', actorId: 'yojimbo' });
    expect(['daigoro', 'kozuka', 'wakizashi-single', 'wakizashi-multi', 'zanmato']).toContain((ev[2] as { abilityId?: string }).abilityId);
    expect(ev.at(-1)).toMatchObject({ type: 'action-end', actorId: 'yojimbo' });
  });

  it('a payment of nothing is the Pay pair, then his own Dismiss (reason "command")', () => {
    const rig = yojimboMenu(1);
    const before = rig.events.length;
    rig.submit(PAY(0));
    const ev = rig.events.slice(before);
    expect(types(ev)).toEqual(['action-start', 'action-end', 'action-start', 'dismiss', 'action-end']);
    expect(ev[0]).toMatchObject({ abilityName: 'Pay' });
    expect(ev[2]).toMatchObject({ abilityName: 'Dismiss' });
    expect(ev[3]).toMatchObject({ type: 'dismiss', combatantId: 'yojimbo', reason: 'command' });
  });

  it('a payment more than the party has is one system message and nothing else; the turn stays his', () => {
    const rig = yojimboMenu(1);
    const before = rig.events.length;
    rig.submit(PAY(999_999));
    const ev = rig.events.slice(before);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ type: 'message', kind: 'system' });
    expect(rig.nextInput().actorId).toBe('yojimbo');
  });

  it('a Dismiss is his Dismiss and one dismiss event (reason "command")', () => {
    const rig = yojimboMenu(1);
    const before = rig.events.length;
    rig.submit(DISMISS);
    const ev = rig.events.slice(before);
    expect(types(ev)).toEqual(['action-start', 'dismiss', 'action-end']);
    expect(ev[1]).toMatchObject({ type: 'dismiss', combatantId: 'yojimbo', reason: 'command' });
  });
});

describe('the Sisters: summon, Dismiss and the wipe', () => {
  const own = { sisters: { motivation: { cindy: 40, sandy: 40, mindy: 40 } } };

  it('the three come in list positions 0, 1 and 2, Cindy first, and the summon is one event per sister in that order', () => {
    const rig = new Rig(build({ aeons: sisters(100), ...own }));
    rig.until('yuna');
    const out = rig.submit(SUMMON('cindy'));
    expect(out.flatMap((e) => (e.type === 'summon' ? [e.aeonId] : []))).toEqual(['cindy', 'sandy', 'mindy']);
    expect(out.flatMap((e) => (e.type === 'summon' ? [e.ownerId] : []))).toEqual(['yuna', 'yuna', 'yuna']);
    expect(['cindy', 'sandy', 'mindy'].map((id) => rig.fighter(id).slot)).toEqual([0, 1, 2]);
    expect(rig.state.aeonId).toBe('cindy');
  });

  it('a Grand Summon naming any one of them brings all three, each holding a full temporary gauge that Dismiss then discards', () => {
    const rig = new Rig(build({ aeons: sisters(0), ...own }));
    rig.until('yuna');
    const ctx = (rig.engine as unknown as { ctx: Ctx }).ctx;
    expect(summonAeon(ctx, 'yuna', 'mindy', true)?.id).toBe('cindy'); // the list leads with Cindy whichever of them was named
    expect(rig.state.aeonIds).toEqual(['cindy', 'sandy', 'mindy']);
    for (const id of ['cindy', 'sandy', 'mindy']) expect(rig.fighter(id).aeon!.temporaryOverdrive, id).toBe(100);
    const held = rig.state.log.flatMap((e) => (e.type === 'overdrive-gauge' && e.cause === 'grand-summon' ? [e.who] : []));
    expect(held).toEqual(['cindy', 'sandy', 'mindy']);
    dismissAeon(ctx, 'command');
    for (const id of ['cindy', 'sandy', 'mindy']) expect(rig.fighter(id).aeon!.temporaryOverdrive ?? null, id).toBeNull();
  });

  it('Dismiss is one dismiss event per sister, Cindy first, after a revive for each fallen one', () => {
    const rig = new Rig(build({ aeons: sisters(0), ...own }), undefined, 5);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    rig.knockOut('mindy');
    rig.until('cindy');
    const before = rig.events.length;
    rig.submit(DISMISS);
    const ev = rig.events.slice(before);
    expect(types(ev)[0]).toBe('action-start');
    expect(types(ev).at(-1)).toBe('action-end');
    expect(ev.flatMap((e) => (e.type === 'dismiss' ? [[e.combatantId, e.reason]] : []))).toEqual([['cindy', 'command'], ['sandy', 'command'], ['mindy', 'command']]);
    const revive = ev.findIndex((e) => e.type === 'revive');
    expect(revive).toBeGreaterThan(0);
    expect(ev[revive]).toMatchObject({ type: 'revive', cause: 'dismiss', targetId: 'mindy' });
    expect(revive).toBeLessThan(ev.findIndex((e) => e.type === 'dismiss')); // she is stood up before the three leave
  });

  it('the wipe is one dismiss event per sister with reason "ko"', () => {
    const rig = new Rig(build({ aeons: sisters(0), ...own }), undefined, 6);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    for (const id of ['cindy', 'sandy', 'mindy']) rig.knockOut(id);
    const seen: BattleEvent[] = [];
    for (let i = 0; i < 6 && rig.state.aeonId !== null; i++) {
      const d = rig.engine.nextDecision();
      if (d.kind === 'resolved') seen.push(...d.events);
      else if (d.kind === 'player-input') rig.engine.submit({ kind: 'defend', targets: [] });
    }
    expect(seen.flatMap((e) => (e.type === 'dismiss' ? [[e.combatantId, e.reason]] : []))).toEqual([['cindy', 'ko'], ['sandy', 'ko'], ['mindy', 'ko']]);
  });
});

describe('the Sisters: Combine powers as events', () => {
  const sure = { sisters: { motivation: { cindy: 60, sandy: 60, mindy: 60 } } };

  it('the order, then Cindy\'s Delta Attack with her bar spent, its hits, and the other two bars paid', () => {
    const rig = new Rig(build({ aeons: sisters(100), ...sure }), undefined, 3);
    rig.until('yuna');
    rig.submit(SUMMON('cindy'));
    rig.until('cindy');
    const before = rig.events.length;
    rig.submit(COMBINE);
    const ev = rig.events.slice(before);
    expect(ev[0]).toMatchObject({ type: 'action-start', actorId: 'cindy', abilityName: 'Combine for the Delta Attack' });
    expect(ev[1]).toMatchObject({ type: 'action-start', actorId: 'cindy', abilityId: 'delta-attack' });
    expect(ev[2]).toMatchObject({ type: 'overdrive-gauge', who: 'cindy', from: 100, to: 0, cause: 'spent' });
    expect(types(ev).filter((t) => t === 'damage').length).toBeGreaterThan(0);
    expect(ev.slice(-3)).toMatchObject([
      { type: 'overdrive-gauge', who: 'sandy', from: 100, to: 0, cause: 'delta-attack' },
      { type: 'overdrive-gauge', who: 'mindy', from: 100, to: 0, cause: 'delta-attack' },
      { type: 'action-end', actorId: 'cindy' },
    ]);
  });

  it('a Combine whose roll fails is the order\'s own start and end and nothing else', () => {
    let failed = 0;
    for (let seed = 1; seed <= 60 && failed < 2; seed++) {
      const rig = new Rig(build({ aeons: sisters(100), sisters: { motivation: { cindy: 0, sandy: 0, mindy: 0 } } }), undefined, seed);
      rig.until('yuna');
      rig.submit(SUMMON('cindy'));
      rig.until('cindy');
      const from = rig.taps.length;
      const before = rig.events.length;
      rig.submit(COMBINE);
      const won = (rig.draws(from, 18)[0]!.value & 0xff) < 200;
      if (won) continue;
      failed++;
      const ev = rig.events.slice(before);
      expect(types(ev), `seed ${seed}`).toEqual(['action-start', 'action-end']);
      expect(ev[0]).toMatchObject({ abilityName: 'Combine for the Delta Attack' });
    }
    expect(failed).toBeGreaterThan(0);
  });
});
