/**
 * A departure whose animations never resolve holds the victory behind the last
 * KO no longer than one guard: its full length plus `ACTOR_ANIM_GRACE_MS`
 * (critic round 02 #01; fix10c verifier found per-step guards let a hung
 * Evrae fall hold victory about 5.5 s against 2.6 s for a hung dissolve).
 * Both games: Evrae's fall is FFX, the yields are FFX-2; the guard is shared.
 */

import { describe, expect, it, vi } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { departureMs } from '../../src/engine/BattlePresenterDepartures.ts';
import { ACTOR_ANIM_GRACE_MS } from '../../src/engine/BattlePresenterEvents.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeStage } from './helpers/FakeStage.ts';

/** A virtual clock: `sleep` waits in simulated time, `run` drives it. */
function virtualClock() {
  let now = 0;
  const due: Array<{ at: number; go: () => void }> = [];
  const sleep = (ms: number): Promise<void> =>
    new Promise((go) => due.push({ at: now + Math.max(0, ms), go }));
  const flush = () => new Promise<void>((r) => setImmediate(r));
  async function run(done: () => boolean): Promise<void> {
    for (let i = 0; i < 10_000 && !done(); i++) {
      await flush();
      if (done() || due.length === 0) continue;
      due.sort((a, b) => a.at - b.at);
      const next = due.shift()!;
      now = next.at;
      next.go();
    }
  }
  return { sleep, run, now: () => now };
}

const never = (): Promise<void> => new Promise(() => {});

async function victoryHeldMs(enemy: string): Promise<number> {
  const clock = virtualClock();
  const stage = new FakeStage(['yuna', 'rikku'], [enemy]);
  const presenter = new BattlePresenter({ stage, sleep: clock.sleep });
  const a = stage.actors.get(enemy)!;
  a.moveTo = never;
  a.fadeTo = never;
  a.dissolveTo = never;
  a.lieDown = never;
  const events = [
    { type: 'ko', targetId: enemy },
    { type: 'victory' },
  ].map((e, i) => ({ ...e, seq: i }) as unknown as BattleEvent);
  let finished = false;
  void presenter.play(events).then(() => (finished = true));
  let at = -1;
  await clock.run(() => {
    if (at < 0 && stage.calls.includes('pose=victory:yuna')) at = clock.now();
    return at >= 0 || finished;
  });
  expect(at).toBeGreaterThanOrEqual(0);
  return at;
}

describe('a hung departure', () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  it('Evrae (falls-away) holds victory at most its fall plus one grace', async () => {
    const held = await victoryHeldMs('evrae');
    expect(held).toBeLessThanOrEqual(departureMs('falls-away') + ACTOR_ANIM_GRACE_MS);
  });

  it('Ormi (yields) holds victory at most the step back plus one grace', async () => {
    const held = await victoryHeldMs('ormi-logos-room');
    expect(held).toBeLessThanOrEqual(departureMs('yields') + ACTOR_ANIM_GRACE_MS);
  });

  // Chapter VII, FFX only (D-046): Seymour's body has no actor promise to hang,
  // so victory waits only his one KO beat.
  it('Seymour (body) holds victory at most his fall plus one grace', async () => {
    const held = await victoryHeldMs('seymour-macalania');
    expect(held).toBeLessThanOrEqual(departureMs('body') + ACTOR_ANIM_GRACE_MS);
  });
});
