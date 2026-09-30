/**
 * PR-0281 (critic round 18, critical): FFX-2 Chapter XV soft-locked at the link-2 opening when a
 * girl carried Stop across the seam. Status O3's Stop freeze ran the stopped figure's whole
 * `update` at dt 0, so her TweenGroup stood still too, and `BattleMoments.slidePartyIn` awaited
 * her `moveTo(home)` for ever (the presenter stayed in `moment:battle-start`).
 *
 * The fix: Stop freezes only the figure's idle/life clock (breath, sway, posture, the ring pulse);
 * the TweenGroup the presenter drives its one-shot moves with (slide-ins, moment phases, the seams
 * between links) keeps its time. The sourced FFX-2 Stop look (a still figure) is kept.
 *
 * Game case: FFX-2 only (the freeze look exists only in FFX-2's table, `statusLooks.ts`).
 * The figure is modelled on `PaintedActor.update`: one-shot moves on `tweens` at the pace rate,
 * the idle on its own clock.
 */

import { describe, expect, it } from 'vitest';
import { TweenGroup } from '../../src/engine/Tween.ts';
import { paceRate } from '../../src/engine/pace.ts';
import { StatusFigureTint } from '../../src/ui/common/statusFigureTint.ts';
import type { BattleState } from '../../src/battle/common/types.ts';

/** A figure shaped like `PaintedActor`: a public TweenGroup and an idle clock. */
function figure() {
  const tweens = new TweenGroup();
  const f = {
    tweens,
    clock: 0,
    setTint(): void {},
    traverse(): void {},
    update(dt: number): void {
      tweens.update(dt * paceRate('action'));
      f.clock += dt;
    },
  };
  return f;
}

function stateWith(yunaStatuses: Record<string, unknown>): BattleState {
  return {
    result: null,
    combatants: {
      yuna: { id: 'yuna', name: 'Yuna', alive: true, side: 'party', statuses: yunaStatuses },
      rikku: { id: 'rikku', name: 'Rikku', alive: true, side: 'party', statuses: { protect: {} } },
    },
  } as unknown as BattleState;
}

async function frames(n: number, step: (dt: number) => void): Promise<void> {
  for (let i = 0; i < n; i++) {
    step(1 / 60);
    await Promise.resolve();
    await Promise.resolve();
  }
}

describe('PR-0281: the FFX-2 Stop freeze never holds a presenter move', () => {
  it("a stopped girl's 520 ms slide home finishes on time while her idle clock stays frozen", async () => {
    const figs = { yuna: figure(), rikku: figure() };
    const tint = new StatusFigureTint('ffx2', () => ({ actor: (id: string) => figs[id as keyof typeof figs] }));
    tint.sync(stateWith({ stop: {}, protect: {} }));
    expect(tint.snapshot()['yuna']).toContain('true'); // the freeze look is on her

    const done: Record<string, number | null> = { yuna: null, rikku: null };
    let t = 0;
    for (const id of ['yuna', 'rikku'] as const) {
      void figs[id].tweens.toAsync(0, 1, { durationMs: 520, onUpdate: () => {} }).then(() => { done[id] = t; });
    }
    const clockBefore = figs.yuna.clock;
    // The seam's opening, outside any action: nobody is "acting".
    await frames(120, (dt) => {
      t += dt;
      tint.update(dt);
      figs.yuna.update(dt);
      figs.rikku.update(dt);
    });
    const limit = 0.52 / paceRate('action') + 0.1;
    expect(done.rikku).not.toBeNull();
    expect(done.yuna).not.toBeNull();
    expect(done.yuna!).toBeLessThanOrEqual(limit);
    // The sourced look: her idle clock never moved.
    expect(figs.yuna.clock).toBe(clockBefore);
    expect(figs.rikku.clock).toBeGreaterThan(1.9);
  });

  it('lifting Stop gives the figure its own update back, and the idle runs again', async () => {
    const fig = figure();
    const own = fig.update;
    const tint = new StatusFigureTint('ffx2', () => ({ actor: () => fig }));
    tint.sync(stateWith({ stop: {} }));
    expect(fig.update).not.toBe(own);
    await frames(30, (dt) => { tint.update(dt); fig.update(dt); });
    expect(fig.clock).toBe(0);
    tint.sync(stateWith({}));
    expect(fig.update).toBe(own);
    await frames(30, (dt) => { tint.update(dt); fig.update(dt); });
    expect(fig.clock).toBeGreaterThan(0.4);
  });

  it('FFX has no freeze: an FFX figure in the same state keeps its idle', async () => {
    const fig = figure();
    const tint = new StatusFigureTint('ffx', () => ({ actor: () => fig }));
    tint.sync(stateWith({ stop: {} }));
    await frames(30, (dt) => { tint.update(dt); fig.update(dt); });
    expect(fig.clock).toBeGreaterThan(0.4);
  });
});
