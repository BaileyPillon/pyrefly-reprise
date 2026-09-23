import { describe, expect, it } from 'vitest';

import { settleForMenu } from '../../src/engine/BattlePresenterBeats.ts';
import type { EventCtx } from '../../src/engine/BattlePresenterEvents.ts';

/** PR-0094: a command menu never opens on a close-up; the shot returns to `idle` first. */
function fakeCtx(rig: string) {
  const calls: string[] = [];
  const camera = {
    rigName: rig,
    release: async (ms: number) => void calls.push(`release:${ms}`),
  };
  const moments = {
    pick: (...names: string[]) => (names.includes('idle') ? 'idle' : null),
    ms: (base: number) => base,
    moveToRig: async (r: string, ms: number) => {
      calls.push(`move:${r}:${ms}`);
      camera.rigName = r;
    },
  };
  const ctx = { stage: { camera }, moments } as unknown as EventCtx;
  return { ctx, calls, camera };
}

describe('settleForMenu (PR-0094)', () => {
  it('returns a held enemy close-up to idle and lets go of the push', async () => {
    const { ctx, calls, camera } = fakeCtx('enemy');
    await settleForMenu(ctx);
    expect(camera.rigName).toBe('idle');
    expect(calls).toContain('release:620');
    expect(calls).toContain('move:idle:620');
  });

  it('does nothing when the shot is already idle', async () => {
    const { ctx, calls } = fakeCtx('idle');
    await settleForMenu(ctx);
    expect(calls).toEqual([]);
  });
});
