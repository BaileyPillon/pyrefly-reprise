/**
 * The Oblitzerator's balls against the swinger's end-of-turn tick (FFX only). The game applies the hits, raises the script's `onHit` (which queues the ball behind the swinger's action entry) and calls the
 * swinger's `pp_BtlActionDone` (recovery, then the end-of-turn status tick) in the same pass of `pp_BtlApplyResults` (VA 0x0078d980, 0x0078f060, 0x007b20e0, 0x007929b0, 0x007b2300), so the ball runs after the
 * tick and its status of duration code 1 lasts through the swinger's next turn (`research/re-ffx-oblitzerator-crane.md` section 10). The engine's older order, a reaction before the tick, is kept for every other
 * script: only a reaction queued `afterTick` waits (`ai/hooks.ts`, `ai/reaction-drain.ts`, `engine-end.ts`). Rule 3: every claim is proved by running the engine.
 */

import { describe, expect, it } from 'vitest';

import type { BattleEvent } from '../../../src/battle/common/types.ts';
import { hasAfterTickReactions, isAfterTick, peekReactions, queueReaction, takeReaction } from '../../../src/battle/ffx/ai/hooks.ts';
import { OBLITZERATOR, actor, ctxOf, defend, give, has, inputFor, log, newEngine, nextInput, spell, swing } from '../helpers/oblitzeratorDrive.ts';

type StatusEvent = { type: 'status-add' | 'status-tick' | 'status-remove'; targetId: string; status: string; remaining?: number };

/** The status events on `who` from the first `action-start` of `who` on, in order, as `type:status`. */
function statusEvents(events: readonly BattleEvent[], who: string, from = 0): string[] {
  return events
    .slice(from)
    .filter((e): e is BattleEvent & StatusEvent => (e.type === 'status-add' || e.type === 'status-tick' || e.type === 'status-remove') && (e as StatusEvent).targetId === who)
    .map((e) => `${e.type}:${e.status}`);
}

describe('the reaction queue: a reaction that waits for the tick', () => {
  const owner = 'tidus';
  const hold = defend();

  it('takeReaction with the flag leaves the late ones where they are and takes the others first in, first out; without it the queue is plain first in, first out', () => {
    const ctx = ctxOf(newEngine(1));
    while (takeReaction(ctx)) { /* start from an empty queue */ }
    queueReaction(ctx, owner, hold, { afterTick: true, byId: 'a' });
    queueReaction(ctx, owner, hold, { byId: 'b' });
    queueReaction(ctx, owner, hold, { afterTick: true, byId: 'c' });
    queueReaction(ctx, owner, hold, { byId: 'd' });
    expect(hasAfterTickReactions(ctx)).toBe(true);
    const early = [takeReaction(ctx, true), takeReaction(ctx, true), takeReaction(ctx, true)];
    expect(early.map((r) => (r?.kind === 'command' ? r.byId : r))).toEqual(['b', 'd', undefined]);
    expect(peekReactions(ctx).every(isAfterTick)).toBe(true);
    expect(hasAfterTickReactions(ctx)).toBe(true);
    const late = [takeReaction(ctx), takeReaction(ctx), takeReaction(ctx)];
    expect(late.map((r) => (r?.kind === 'command' ? r.byId : r))).toEqual(['a', 'c', undefined]);
    expect(hasAfterTickReactions(ctx)).toBe(false);
  });

  it('a reaction queued without the flag is not late, so every other script keeps the engine\'s older order', () => {
    const ctx = ctxOf(newEngine(1));
    while (takeReaction(ctx)) { /* empty */ }
    queueReaction(ctx, owner, hold);
    expect(hasAfterTickReactions(ctx)).toBe(false);
    expect(isAfterTick(peekReactions(ctx)[0]!)).toBe(false);
    while (takeReaction(ctx)) { /* empty */ }
  });
});

describe('a ball runs after the swinger\'s end-of-turn tick (the game\'s order)', () => {
  /** A seed and an engine where Kimahri's first swing draws a Blind Ball, with Kimahri holding a 3-turn Haste so the tick has something to do. */
  function blindBallRun(): { engine: ReturnType<typeof newEngine>; from: number } {
    for (let seed = 1; seed <= 150; seed++) {
      const engine = newEngine(seed);
      const d = inputFor(engine, 'kimahri');
      give(actor(engine, 'kimahri'), 'haste', 3);
      const from = log(engine).length;
      engine.submit(swing(d)!);
      nextInput(engine, true);
      if (log(engine).slice(from).some((e) => e.type === 'counter' && e.actorId === OBLITZERATOR)) return { engine, from };
    }
    throw new Error('no Blind Ball in 150 seeds');
  }

  it('the swinger\'s own tick (Haste 3 to 2) comes before the ball\'s counter event, and the Darkness is added once, after it, with no tick and no removal', () => {
    const { engine, from } = blindBallRun();
    const events = log(engine).slice(from);
    const tick = events.findIndex((e) => e.type === 'status-tick' && (e as StatusEvent).targetId === 'kimahri' && (e as StatusEvent).status === 'haste');
    const counter = events.findIndex((e) => e.type === 'counter' && e.actorId === OBLITZERATOR);
    const added = events.findIndex((e) => e.type === 'status-add' && (e as StatusEvent).targetId === 'kimahri' && (e as StatusEvent).status === 'darkness');
    expect(tick).toBeGreaterThanOrEqual(0);
    expect(counter).toBeGreaterThan(tick);
    expect(added).toBeGreaterThan(counter);
    expect((events[tick] as StatusEvent).remaining).toBe(2);
    expect(statusEvents(events, 'kimahri').filter((s) => s.endsWith(':darkness'))).toEqual(['status-add:darkness']);
    expect(has(actor(engine, 'kimahri'), 'darkness')).toBe(true);
  });

  it('the Darkness is still on at the swinger\'s next menu, lasts through that turn and ticks off at the end of it (duration code 1: one turn of its own)', () => {
    const { engine } = blindBallRun();
    const next = inputFor(engine, 'kimahri');
    expect(has(actor(engine, 'kimahri'), 'darkness')).toBe(true);
    const from = log(engine).length;
    engine.submit(defend());
    nextInput(engine, true);
    expect(statusEvents(log(engine), 'kimahri', from).filter((s) => s.endsWith(':darkness'))).toEqual(['status-tick:darkness', 'status-remove:darkness']);
    expect(has(actor(engine, 'kimahri'), 'darkness')).toBe(false);
    expect(next.actorId).toBe('kimahri');
  });

  it('a Mute Ball leaves Lulu Silenced at her next menu (Thunder is off and says why), and her next turn takes it off', () => {
    for (let seed = 1; seed <= 150; seed++) {
      const engine = newEngine(seed);
      const d = inputFor(engine, 'lulu');
      const from = log(engine).length;
      engine.submit(spell(d, 'thunder', OBLITZERATOR)!);
      nextInput(engine, true);
      if (!log(engine).slice(from).some((e) => e.type === 'counter' && e.actorId === OBLITZERATOR)) continue;
      const again = inputFor(engine, 'lulu');
      expect(has(actor(engine, 'lulu'), 'silence')).toBe(true);
      const thunder = again.commands.find((c) => c.command.kind === 'ability' && c.command.id === 'thunder')!;
      expect(thunder.enabled).toBe(false);
      expect(thunder.disabledReason).toBe('Silenced');
      const mark = log(engine).length;
      engine.submit(defend());
      nextInput(engine, true);
      expect(statusEvents(log(engine), 'lulu', mark).filter((s) => s.endsWith(':silence'))).toEqual(['status-tick:silence', 'status-remove:silence']);
      return;
    }
    throw new Error('no Mute Ball in 150 seeds');
  });

  it('a ball asks for nothing of its own, and one that is drawn leaves no reaction queued for the next action', () => {
    const { engine } = blindBallRun();
    const ctx = ctxOf(engine);
    expect(hasAfterTickReactions(ctx)).toBe(false);
    expect(peekReactions(ctx)).toHaveLength(0);
    expect(ctx.rt.inReaction).not.toBe(true);
  });
});
