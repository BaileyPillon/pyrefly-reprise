/**
 * `Tween.kill()` settles the promise `TweenGroup.toAsync` handed out.
 *
 * This is the root cause `docs/handoff/builda-flow.md` #01 traced Chapter 4's
 * "won and then never ends" to, and the one thing that track could not fix
 * because it does not own `src/engine/Tween.ts`:
 *
 * > `TweenGroup.toAsync` resolves its promise from `Tween.onComplete`.
 * > `Tween.kill()` sets `_killed` and **does not fire `onComplete`**.
 * > `PaintedActor.dispose()` calls `tweens.killAll()`, and
 * > `PaintedStage.removeCombatant` / `PaintedStage.add` both dispose actors.
 * > So any actor animation the presenter is awaiting when that actor's tweens
 * > are killed is abandoned mid-await, permanently.
 *
 * Every assertion below hangs for ever on the old code rather than failing
 * fast, so each one is written against a **deadline**: `settlesWithin` races
 * the promise against a timer and resolves to `'pending'` if the promise never
 * settles. That is the shape a hang has to be tested in — an `await` that
 * never returns cannot be caught by an ordinary assertion.
 *
 * Shared plumbing, therefore both games [AGENTS.md hard rule 14, critic
 * CHECKS.md CHK-020]: `Tween` has no `game` field and no FFX/FFX-2 branch, and
 * both chapters' presenters await the same `PaintedActor` methods through it.
 */

import { describe, expect, it, vi } from 'vitest';
import { Tween, TweenGroup } from '../../src/engine/Tween.ts';

/** `'settled'` if the promise settles before `ms` of real time, else `'pending'`. */
async function settlesWithin(p: Promise<unknown>, ms = 50): Promise<'settled' | 'pending'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pending = new Promise<'pending'>((resolve) => {
    timer = setTimeout(() => resolve('pending'), ms);
  });
  const result = await Promise.race([p.then(() => 'settled' as const), pending]);
  if (timer !== undefined) clearTimeout(timer);
  return result;
}

describe('Tween.kill settles the toAsync promise', () => {
  it('resolves a promise whose tween is killed mid-flight', async () => {
    const tweens = new TweenGroup();
    const p = tweens.toAsync(0, 1, { durationMs: 1_000 });
    tweens.update(0.1);
    expect(tweens.size, 'the tween is genuinely in flight, not already finished').toBe(1);

    const t = tweens as unknown as { tweens: Tween[] };
    t.tweens[0]!.kill();

    expect(await settlesWithin(p)).toBe('settled');
  });

  it('resolves every outstanding promise when killAll runs', async () => {
    const tweens = new TweenGroup();
    const promises = [
      tweens.toAsync(0, 1, { durationMs: 900 }),
      tweens.toAsync(0, 1, { durationMs: 900 }),
      tweens.toAsync(0, 1, { durationMs: 900 }),
    ];
    tweens.update(0.05);

    tweens.killAll();

    expect(await settlesWithin(Promise.all(promises))).toBe('settled');
    expect(tweens.size).toBe(0);
  });

  it('resolves rather than rejects, so a kill inside dispose() is not an unhandled rejection', async () => {
    const onUnhandled = vi.fn();
    process.on('unhandledRejection', onUnhandled);
    try {
      const tweens = new TweenGroup();
      // Deliberately not awaited at the moment of the kill: this is exactly how
      // `PaintedActor.dispose()` reaches a promise somebody else is holding.
      const p = tweens.toAsync(0, 1, { durationMs: 500 });
      tweens.update(0.05);
      tweens.killAll();
      await expect(p).resolves.toBeUndefined();
      await new Promise((r) => setTimeout(r, 10));
      expect(onUnhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('fires onKilled once, and never alongside onComplete', () => {
    const onComplete = vi.fn();
    const onKilled = vi.fn();
    const tween = new Tween(0, 1, { durationMs: 400, onComplete, onKilled });

    tween.update(0.1);
    tween.kill();
    tween.kill();
    tween.kill();

    expect(onKilled).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(tween.killed).toBe(true);
    expect(tween.done).toBe(true);
  });

  it('killing a tween that already completed changes nothing', () => {
    const onComplete = vi.fn();
    const onKilled = vi.fn();
    const tween = new Tween(0, 1, { durationMs: 100, onComplete, onKilled });

    tween.update(0.2);
    expect(onComplete).toHaveBeenCalledTimes(1);

    tween.kill();

    expect(onKilled, 'a finished tween is not "killed"').not.toHaveBeenCalled();
    expect(tween.killed).toBe(false);
  });

  it('a completing tween still resolves exactly once, through onComplete', async () => {
    const tweens = new TweenGroup();
    const onComplete = vi.fn();
    const p = tweens.toAsync(0, 1, { durationMs: 100, onComplete });

    tweens.update(0.2);

    expect(await settlesWithin(p)).toBe('settled');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(tweens.size, 'a finished tween is swept out of the group').toBe(0);
  });

  it('killAll lets an onKilled continuation start a replacement tween', () => {
    const tweens = new TweenGroup();
    let replacement = 0;
    tweens.toAsync(0, 1, {
      durationMs: 500,
      onKilled: () => {
        // The group is emptied before the kills run, so a continuation that
        // reaches back into it is not adding to a list being truncated.
        tweens.to(0, 1, { durationMs: 10, onUpdate: () => (replacement += 1) });
      },
    });
    tweens.update(0.05);

    tweens.killAll();

    expect(tweens.size, 'the replacement survives the killAll that spawned it').toBe(1);
    tweens.update(0.02);
    expect(replacement).toBeGreaterThan(0);
  });
});
