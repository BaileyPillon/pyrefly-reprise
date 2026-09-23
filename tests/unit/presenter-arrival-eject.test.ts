/**
 * Two presenter rules the Macalania chapter found missing (critic pass on
 * 62b4927, `docs/handoff/chapter-macalania.md`), both shared plumbing, so the
 * game case is **both** [AGENTS.md rule 14; critic/CHECKS.md CHK-020]:
 *
 * 1. **A mid-battle arrival is staged.** `forms.ts#revealEnemy` emits
 *    `part-restored` for an enemy that was never on the field (Anima,
 *    `flags.hidden` at battle start). The handler used to fade an actor that
 *    did not exist, so in a real battle she was invisible for all of act two.
 *    The stage's `arrive` stages her and plays the scene's arrival, and the
 *    presenter holds that until the mid-battle beat right behind the reveal
 *    has been spoken (Yuna names the aeon before the player sees it).
 * 2. **An ejected combatant leaves the field.** `hp.ts#ejectActor` (Eject,
 *    Banish, and the petrified-monster shatter) emits `status-add eject` and
 *    never a `ko`, so a shattered Guado Guardian stood there at full alpha for
 *    the rest of the fight.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { BattleEvent, CombatantId, StatusInstance } from '../../src/battle/common/types.ts';
import type { ActorHandle, ArrivalClock } from '../../src/engine/BattlePresenterPorts.ts';
import { FakeActor, FakeCutscenes, FakeStage, noSleep } from './helpers/FakeStage.ts';

type Unsequenced<T> = T extends unknown ? Omit<T, 'seq'> : never;

/** A stage that can stage a combatant it was not given at battle start. */
class ArrivingStage extends FakeStage {
  readonly clocks: ArrivalClock[] = [];
  async arrive(id: CombatantId, clock: ArrivalClock): Promise<ActorHandle | undefined> {
    this.calls.push(`arrive:${id}`);
    this.clocks.push(clock);
    const actor = new FakeActor(id, this.calls);
    this.actors.set(id, actor);
    this.sides.set(id, 'enemy');
    return actor;
  }
}

class LoggingCutscenes extends FakeCutscenes {
  constructor(private readonly log: string[]) {
    super();
  }
  override async play(script: Parameters<FakeCutscenes['play']>[0], opts?: { name?: string }): Promise<void> {
    this.log.push(`script:${opts?.name ?? '?'}`);
    await super.play(script);
  }
}

function setup(stage: FakeStage) {
  const cutscenes = new LoggingCutscenes(stage.calls);
  const presenter = new BattlePresenter({
    stage,
    cutscenes,
    midScripts: { 'mac-anima-summon': [] },
    sleep: noSleep,
  });
  const play = (events: Array<Unsequenced<BattleEvent>>): Promise<unknown> =>
    presenter.play(events.map((e, i) => ({ ...e, seq: i }) as BattleEvent));
  return { presenter, play };
}

const reveal: Unsequenced<BattleEvent> = {
  type: 'part-restored',
  partId: 'anima-macalania',
  hp: 18000,
  ownerId: 'seymour-macalania',
};

const eject = (targetId: CombatantId): Unsequenced<BattleEvent> => ({
  type: 'status-add',
  targetId,
  status: 'eject',
  instance: { id: 'eject', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as StatusInstance,
});

describe('part-restored for an enemy that was never staged', () => {
  it('stages it through the stage arrival, after the mid-battle beat that follows the reveal', async () => {
    const stage = new ArrivingStage(['tidus'], ['seymour-macalania']);
    const { play } = setup(stage);

    await play([
      { type: 'message', text: 'Seymour summons Anima', kind: 'telegraph' },
      reveal,
      { type: 'script-trigger', name: 'mac-anima-summon' },
      { type: 'turn-start', actorId: 'anima-macalania', turn: 12, elapsedTicks: 0 },
    ]);

    expect(stage.staged()).toContain('anima-macalania');
    const script = stage.calls.indexOf('script:mac-anima-summon');
    const arrive = stage.calls.indexOf('arrive:anima-macalania');
    expect(script).toBeGreaterThanOrEqual(0);
    expect(arrive).toBeGreaterThan(script);
  });

  it('still plays the arrival when the burst ends on the reveal', async () => {
    const stage = new ArrivingStage(['tidus'], ['seymour-macalania']);
    const { play } = setup(stage);

    await play([reveal]);

    expect(stage.calls).toContain('arrive:anima-macalania');
    expect(stage.staged()).toContain('anima-macalania');
  });

  it('hands the stage a clock that collapses at skip speed', async () => {
    const stage = new ArrivingStage(['tidus'], ['seymour-macalania']);
    const { presenter, play } = setup(stage);
    presenter.setSpeed('skip');

    await play([reveal]);

    expect(stage.clocks[0]?.instant).toBe(true);
  });

  it('keeps fading in a part that is already on the field (the Yu Pagodas)', async () => {
    const stage = new ArrivingStage(['tidus'], ['yu-pagoda-left']);
    const { play } = setup(stage);

    await play([{ type: 'part-restored', partId: 'yu-pagoda-left', hp: 5000 }]);

    expect(stage.calls).toContain('fade=1:yu-pagoda-left');
    expect(stage.calls).not.toContain('arrive:yu-pagoda-left');
  });
});

describe('status-add eject', () => {
  // Enemies only. A party member's Eject leaves a hole in the active three
  // that the engine does not refill, and what FFX draws there is not sourced
  // here, so the party side keeps its old behaviour.
  it('takes a shattered enemy off the field', async () => {
    const stage = new FakeStage(['tidus'], ['guado-guardian-a', 'seymour-macalania']);
    const { play } = setup(stage);

    await play([
      {
        type: 'status-add',
        targetId: 'guado-guardian-a',
        status: 'petrify',
        instance: { id: 'petrify', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: true } as StatusInstance,
      },
      eject('guado-guardian-a'),
      { type: 'message', text: 'Guado Guardian A shatters', kind: 'status' },
    ]);

    expect(stage.calls).toContain('dissolve=1:guado-guardian-a');
    expect(stage.calls).toContain('remove:guado-guardian-a');
    expect(stage.staged()).not.toContain('guado-guardian-a');
    expect(stage.staged()).toContain('seymour-macalania');
  });
});
