import { describe, expect, it } from 'vitest';

import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';
import { playOpening } from '../../src/engine/OpeningSkip.ts';

/** PR-0061: a Confirm press during the opening sweep ends it, the way the cutscene skip ends a scene. */
function harness(speed: 'normal' | 'skip' = 'normal') {
  const calls: string[] = [];
  let press: () => void = () => {};
  let clearHook: () => void = () => {};
  const moments = { hurry: false, pick: () => 'idle' };
  const ctx = {
    speed: () => speed,
    moments,
    stage: { camera: { snapTo: (r: string) => calls.push(`snap:${r}`), release: async (ms: number) => void calls.push(`release:${ms}`) } },
    deps: {
      moments: {
        confirmPress: () => ({ pressed: new Promise<void>((r) => (press = r)), dispose: () => calls.push('dispose') }),
        clear: () => {
          calls.push('clear');
          clearHook();
        },
      },
    },
  } as unknown as EventCtx;
  return { ctx, calls, moments, pressNow: () => press(), onClear: (f: () => void) => (clearHook = f) };
}

describe('playOpening (PR-0061)', () => {
  it('runs the opening untouched when nobody presses', async () => {
    const h = harness();
    await playOpening(h.ctx, async () => {});
    expect(h.calls).toEqual(['dispose']);
    expect(h.moments.hurry).toBe(false);
  });

  it('on Confirm: cuts to idle, lets go of the push, drops the plate, collapses the rest', async () => {
    const h = harness();
    let hurriedInside = false;
    const done = playOpening(h.ctx, () => new Promise<void>((resolve) => h.onClear(() => {
      hurriedInside = h.moments.hurry;
      resolve();
    })));
    h.pressNow();
    await done;
    expect(h.calls).toEqual(['snap:idle', 'release:0', 'clear', 'dispose']);
    expect(hurriedInside).toBe(true);
    expect(h.moments.hurry).toBe(false);
  });

  it('never watches keys at skip speed', async () => {
    const h = harness('skip');
    await playOpening(h.ctx, async () => {});
    expect(h.calls).toEqual([]);
  });
});
