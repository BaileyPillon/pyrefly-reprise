/**
 * **The presenter tells an actor the statuses it was given** (`ActorHandle.noteStatus`, `PaintedActor.noteStatus` and `hasStatus`; the hidden Wendigo chapter's finishing lane, 2026-11-09): a sleeping Wendigo's arms come
 * down on the stage because the lake skin reads `sleep` from the actor, and the actor knows it from the presenter's own `status-add` and `status-remove` events.
 *
 * Game case: the one reader is FFX only (the lake skin); the call is shared presenter plumbing, **both** [AGENTS.md rule 14; critic/CHECKS.md CHK-020], optional on the port, so a figure that does not implement it is
 * untouched and a double with no method never fails a beat.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../../src/engine/BattlePresenter.ts';
import type { BattleEvent, CombatantId, StatusInstance } from '../../../src/battle/common/types.ts';
import { FakeStage, noSleep } from '../helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

const instance = (id: string): StatusInstance => ({ id, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true }) as StatusInstance;
const add = (targetId: CombatantId, id: string): Unsequenced<BattleEvent> => ({ type: 'status-add', targetId, status: id, instance: instance(id) }) as unknown as Unsequenced<BattleEvent>;
const remove = (targetId: CombatantId, id: string): Unsequenced<BattleEvent> => ({ type: 'status-remove', targetId, status: id, reason: 'woke' }) as unknown as Unsequenced<BattleEvent>;

function setup() {
  const stage = new FakeStage(['yuna', 'rikku'], ['wendigo']);
  const presenter = new BattlePresenter({ stage, sleep: noSleep });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> => presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  const calls: Array<[string, string, boolean]> = [];
  for (const id of ['yuna', 'rikku', 'wendigo']) {
    const actor = stage.actor(id) as unknown as { noteStatus?: (s: string, on: boolean) => void };
    actor.noteStatus = (s, on) => calls.push([id, s, on]);
  }
  return { stage, play, calls };
}

describe('the presenter tells the actor a status landed and ended', () => {
  it('tells the target of a status-add, before the status beat plays, and the target of a status-remove', async () => {
    const { play, calls } = setup();
    await play([add('wendigo', 'sleep')]);
    expect(calls).toEqual([['wendigo', 'sleep', true]]);
    await play([remove('wendigo', 'sleep')]);
    expect(calls).toEqual([['wendigo', 'sleep', true], ['wendigo', 'sleep', false]]);
  });

  it('tells only the target, and every status (the lake skin reads Sleep, others may read theirs)', async () => {
    const { play, calls } = setup();
    await play([add('yuna', 'haste'), add('wendigo', 'berserk')]);
    expect(calls).toEqual([['yuna', 'haste', true], ['wendigo', 'berserk', true]]);
  });

  it('never fails a beat for a figure with no such method (the port\'s method is optional)', async () => {
    const stage = new FakeStage(['yuna'], ['wendigo']);
    const presenter = new BattlePresenter({ stage, sleep: noSleep });
    await expect(presenter.play([{ ...add('wendigo', 'sleep'), seq: 0 } as BattleEvent, { ...remove('wendigo', 'sleep'), seq: 1 } as BattleEvent])).resolves.toBeDefined();
  });
});
