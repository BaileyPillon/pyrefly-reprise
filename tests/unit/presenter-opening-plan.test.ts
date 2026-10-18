/**
 * The Chapter IV first-menu framing race, at the presenter (both games: shared opening plumbing; reproduced in FFX-2 Chapter IV; `engine/fx/mix/openingGate.ts`).
 *
 * The real `BattlePresenter` against the real `FakeEngine` and fake ports (the harness of `presenter-playback.test.ts`): the stage's `planSettled` is CHAPTER FRAMING's first plan. The opening
 * waits for it before the first decision is asked for, so no command menu can open under a plan that is still to land; the camera, resting when the plan lands late, moves onto the master first;
 * an automated run (`'skip'`) waits for nothing; and a stage with no framing (a fake, a preview) plays as it always did. The engine's own clock does not tick in the wait.
 */
import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { attackStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { FakeEngine } from './helpers/FakeEngine.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage, noSleep } from './helpers/FakeStage.ts';

type Framed = FakeStage & { planSettled?: () => Promise<void>; planArrivalOwed?: () => boolean };

function make() {
  const stage: Framed = new FakeStage(['tidus', 'yuna', 'auron'], ['seymour-flux']);
  const presenter = new BattlePresenter({ stage, damageNumbers: new FakeDamageNumbers(), messageBar: new FakeMessageBar(), audio: new FakeAudio(), cutscenes: new FakeCutscenes(), sleep: noSleep });
  presenter.setAutoPlay(attackStrategy);
  const engine = new FakeEngine({ enemyHp: 2400, partyDamage: 1200 });
  const asked = { n: 0 };
  const next = engine.nextDecision.bind(engine);
  engine.nextDecision = () => {
    asked.n++;
    if (asked.n === 1) stage.calls.push('DECISION'); // the first time the presenter asks the engine for one: where a menu could open
    return next();
  };
  return { presenter, stage, engine, asked };
}
const macrotasks = async (n = 5): Promise<void> => {
  for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0));
};

describe('the opening waits for the first plan before the first decision', () => {
  it('asks the engine for no decision (so opens no menu) until the plan has landed, then plays the whole battle', async () => {
    const { presenter, stage, engine, asked } = make();
    let land!: () => void;
    stage.planSettled = () => new Promise<void>((r) => (land = r));
    const run = presenter.run(engine);
    await macrotasks();
    expect(asked.n).toBe(0); // the plan is still to land: nothing is offered
    land();
    const outcome = await run;
    expect(asked.n).toBeGreaterThan(0);
    expect(outcome.kind).toBe('victory');
  });

  const idleMovesBeforeTheFirstDecision = (calls: readonly string[]): number => calls.slice(0, calls.indexOf('DECISION')).filter((c) => c === 'camera:idle').length;

  it('a plan that landed after the opening\'s last camera move: the camera moves onto the master before anything is offered', async () => {
    const bare = make();
    await bare.presenter.run(bare.engine);
    const late = make();
    late.stage.planSettled = () => Promise.resolve();
    late.stage.planArrivalOwed = () => true;
    await late.presenter.run(late.engine);
    expect(idleMovesBeforeTheFirstDecision(late.stage.calls)).toBe(idleMovesBeforeTheFirstDecision(bare.stage.calls) + 1); // the arrival, ahead of the first decision
  });

  it('with the camera already on the master (or no framing at all) nothing extra moves', async () => {
    const bare = make();
    await bare.presenter.run(bare.engine);
    const framed = make();
    framed.stage.planSettled = () => Promise.resolve();
    framed.stage.planArrivalOwed = () => false;
    await framed.presenter.run(framed.engine);
    expect(idleMovesBeforeTheFirstDecision(framed.stage.calls)).toBe(idleMovesBeforeTheFirstDecision(bare.stage.calls));
  });

  it('waits for nothing at skip speed (an automated run): a plan that never lands does not hold it', async () => {
    const { presenter, stage, engine, asked } = make();
    presenter.setSpeed('skip');
    stage.planSettled = () => new Promise<void>(() => undefined);
    const outcome = await presenter.run(engine);
    expect(asked.n).toBeGreaterThan(0);
    expect(outcome.kind).toBe('victory');
  });

  it('an abort while it waits ends the run instead of parking it', async () => {
    const { presenter, stage, engine } = make();
    let land!: () => void;
    stage.planSettled = () => new Promise<void>((r) => (land = r));
    const run = presenter.run(engine);
    await macrotasks();
    presenter.abort();
    land();
    const outcome = await run;
    expect(outcome.kind).toBe('aborted');
  });
});
