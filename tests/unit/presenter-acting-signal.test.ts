/**
 * B2 part 1: the acting-state HudPort signal (PR-0157's hook; both games).
 *
 * The HUD hears `action-start` when an action begins to play and
 * `action-end` when it finishes; an action that never finishes on screen (the
 * burst stops on a minigame, the battle ends inside it, the screen aborts, a
 * new turn starts under it) is answered with `cancel`, so a HUD that stepped
 * back for the action is never left faded. A HUD without `setActing` hears
 * nothing and plays exactly as before (the no-op default).
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { ActingState } from '../../src/engine/ActingState.ts';
import type { ActingSignal } from '../../src/engine/HudPort.ts';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FakeHud, FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

class SignalHud extends FakeHud {
  readonly signals: ActingSignal[] = [];
  setActing(signal: ActingSignal): void {
    this.signals.push(signal);
  }
}

const start = (actorId: string): Unsequenced<BattleEvent> =>
  ({
    type: 'action-start',
    actorId,
    command: { kind: 'attack', targets: ['seymour-flux'] },
    targets: ['seymour-flux'],
  }) as never;

const end = (actorId: string): Unsequenced<BattleEvent> => ({ type: 'action-end', actorId }) as never;

function setup(hud: FakeHud = new SignalHud()) {
  const stage = new FakeStage(['tidus', 'yuna'], ['seymour-flux']);
  const presenter = new BattlePresenter({ stage, hud, sleep: noSleep });
  const play = (events: Array<Unsequenced<BattleEvent>>) =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { presenter, hud, play };
}

const phases = (hud: FakeHud): string[] => (hud as SignalHud).signals.map((s) => `${s.phase}:${s.actorId}`);

describe('acting-state signal', () => {
  it('is set on action-start and cleared on action-end', async () => {
    const { hud, play } = setup();
    await play([start('tidus'), end('tidus')]);
    expect(phases(hud)).toEqual(['action-start:tidus', 'action-end:tidus']);
    const first = (hud as SignalHud).signals[0]!;
    expect(first.phase === 'action-start' && first.targets).toEqual(['seymour-flux']);
  });

  it('cancels an action the battle ends inside', async () => {
    const { hud, play } = setup();
    await play([
      start('tidus'),
      { type: 'victory', result: { outcome: 'victory' } as never },
      end('tidus'),
    ]);
    expect(phases(hud)).toEqual(['action-start:tidus', 'cancel:tidus']);
  });

  it('cancels an action a minigame request stops the burst inside', async () => {
    const { hud, play } = setup();
    await play([start('tidus'), { type: 'minigame-request', who: 'tidus', kind: 'overdrive-timing', params: {} } as never]);
    expect(phases(hud)).toEqual(['action-start:tidus', 'cancel:tidus']);
  });

  it('cancels a burst that ends with the action still open', async () => {
    const { hud, play } = setup();
    await play([start('yuna')]);
    expect(phases(hud)).toEqual(['action-start:yuna', 'cancel:yuna']);
  });

  it('cancels the open action when a new turn or action starts under it', async () => {
    const { hud, play } = setup();
    await play([start('tidus'), { type: 'turn-start', actorId: 'yuna' } as never, start('yuna'), start('tidus'), end('tidus')]);
    expect(phases(hud)).toEqual([
      'action-start:tidus',
      'cancel:tidus',
      'action-start:yuna',
      'cancel:yuna',
      'action-start:tidus',
      'action-end:tidus',
    ]);
  });

  it('cancels on abort, once', async () => {
    const { presenter, hud } = setup();
    const state = new ActingState(() => hud);
    state.observe({ type: 'action-start', actorId: 'tidus', targets: [], command: { kind: 'attack' } } as never);
    state.cancel();
    state.cancel();
    expect(phases(hud)).toEqual(['action-start:tidus', 'cancel:tidus']);
    expect(state.acting).toBeNull();
    presenter.abort(); // nothing open on the presenter's own state: nothing sent
    expect(phases(hud)).toEqual(['action-start:tidus', 'cancel:tidus']);
  });

  it('is a no-op for a HUD without setActing (the default)', async () => {
    const plain = new FakeHud();
    const { play } = setup(plain);
    await expect(play([start('tidus'), end('tidus')])).resolves.toMatchObject({ dropped: 0 });
    expect(plain.events.map((e) => e.type)).toEqual(['action-start', 'action-end']);
  });
});
