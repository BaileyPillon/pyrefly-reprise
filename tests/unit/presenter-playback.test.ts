/**
 * The playback protocol from `docs/CONTRACTS.md`, checked end to end.
 *
 * Everything here runs the real `BattlePresenter` against the real
 * `FakeEngine` (which obeys the contract) and fake ports. No `three`, no DOM,
 * no timers — `noSleep` makes a whole battle resolve in microseconds.
 */

import { describe, expect, it } from 'vitest';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { intendedStrategy, attackStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { PresenterDeps } from '../../src/engine/BattlePresenterPorts.ts';
import type { Command } from '../../src/battle/common/types.ts';
import { FakeEngine } from './helpers/FakeEngine.ts';
import {
  FakeAudio,
  FakeCutscenes,
  FakeDamageNumbers,
  FakeHud,
  FakeMessageBar,
  FakeStage,
  noSleep,
} from './helpers/FakeStage.ts';

function makePresenter(over: Partial<PresenterDeps> = {}) {
  const stage = new FakeStage(['tidus', 'yuna', 'auron'], ['seymour-flux']);
  const damageNumbers = new FakeDamageNumbers();
  const messageBar = new FakeMessageBar();
  const audio = new FakeAudio();
  const cutscenes = new FakeCutscenes();
  const presenter = new BattlePresenter({
    stage,
    damageNumbers,
    messageBar,
    audio,
    cutscenes,
    sleep: noSleep,
    ...over,
  });
  return { presenter, stage, damageNumbers, messageBar, audio, cutscenes };
}

describe('BattlePresenter — the playback loop', () => {
  it('plays a whole battle to victory and returns the result', async () => {
    const { presenter } = makePresenter();
    presenter.setAutoPlay(attackStrategy);
    const engine = new FakeEngine({ enemyHp: 2400, partyDamage: 1200 });

    const outcome = await presenter.run(engine);

    expect(outcome.kind).toBe('victory');
    if (outcome.kind === 'victory') {
      expect(outcome.result.outcome).toBe('victory');
      expect(outcome.result.gil).toBe(6000);
    }
  });

  it('returns a defeat when the party goes down', async () => {
    const { presenter } = makePresenter();
    presenter.setAutoPlay(attackStrategy);
    // 3 party actions, then the enemy turn, which one-shots Tidus.
    const engine = new FakeEngine({ enemyHp: 999999, loses: true });

    const outcome = await presenter.run(engine);

    expect(outcome.kind).toBe('defeat');
  });

  it('plays events in seq order and never drops one', async () => {
    const { presenter } = makePresenter();
    presenter.setAutoPlay(attackStrategy);
    const engine = new FakeEngine({ enemyHp: 2400 });

    await presenter.run(engine);

    // Rule 2: `state().log[i].seq === i`, and the presenter played them in
    // exactly that order.
    const log = engine.state().log;
    log.forEach((e, i) => expect(e.seq).toBe(i));
    const playedSeqs = presenter.trace.map((t) => t.seq);
    expect(playedSeqs).toEqual([...playedSeqs].sort((a, b) => a - b));
    expect(playedSeqs[0]).toBe(0);
  });

  it('shows every event to the HUD before animating it', async () => {
    const hud = new FakeHud();
    const { presenter } = makePresenter({ hud });
    presenter.setAutoPlay(attackStrategy);
    const engine = new FakeEngine({ enemyHp: 1200 });

    await presenter.run(engine);

    const seen = hud.events.map((e) => e.seq);
    const played = presenter.trace.map((t) => t.seq);
    // Every played event reached the HUD first.
    for (const seq of played) expect(seen).toContain(seq);
    expect(hud.syncs.length).toBeGreaterThan(0);
  });

  it('suspends on minigame-request and re-submits the same command with extra', async () => {
    const hud = new FakeHud();
    hud.queue = [{ kind: 'overdrive', id: 'blitz-ace', targets: ['seymour-flux'] } as Command];
    hud.minigameResults = [
      { kind: 'tidus-timing', timing: { success: true, timeRemainingMs: 1820, timerMs: 2200 } },
    ];
    const { presenter } = makePresenter({ hud });
    // One Overdrive at 3x damage finishes a 3000 HP enemy.
    const engine = new FakeEngine({ enemyHp: 3000, partyDamage: 1200, minigameOnOverdrive: true });

    const outcome = await presenter.run(engine);

    expect(hud.minigamesOpened).toEqual(['tidus-timing']);
    expect(outcome.kind).toBe('victory');
    // The re-submitted command carried the outcome, so the Overdrive hit for 3x.
    const damage = engine.state().log.find((e) => e.type === 'damage');
    expect(damage && damage.type === 'damage' && damage.amount).toBe(3600);
  });

  it('rolls the engine default when nothing can run the minigame', async () => {
    const { presenter } = makePresenter();
    presenter.setAutoPlay((_a, commands) => {
      const row = commands.find((c) => c.command.kind === 'overdrive')!;
      return { ...row.command, targets: ['seymour-flux'] } as Command;
    });
    const engine = new FakeEngine({ enemyHp: 2400, partyDamage: 1200, minigameOnOverdrive: true });

    const outcome = await presenter.run(engine);

    // 2x (no `extra`) rather than 3x — the engine's own default outcome.
    const damage = engine.state().log.find((e) => e.type === 'damage');
    expect(damage && damage.type === 'damage' && damage.amount).toBe(2400);
    expect(outcome.kind).toBe('victory');
  });

  it('pauses for a script-trigger, runs the mid-battle script, and resumes', async () => {
    const script = [{ type: 'say' as const, who: 'auron' as const, text: 'It is not over.' }];
    const cutscenes = new FakeCutscenes();
    const hud = new FakeHud();
    const { presenter } = makePresenter({
      hud,
      cutscenes,
      midScripts: { 'flux-halfway': script },
    });
    presenter.setAutoPlay(attackStrategy);
    const engine = new FakeEngine({ enemyHp: 2400, triggerAfterFirstAction: 'flux-halfway' });

    const outcome = await presenter.run(engine);

    expect(cutscenes.played).toEqual([script]);
    // The HUD stays up for the beat — a mid-battle line is spoken over the
    // fight, not instead of it. See `midbattle-hud.test.ts`.
    expect(hud.visible).toBe(true);
    // Playback resumed: the battle still reached its end.
    expect(outcome.kind).toBe('victory');
  });

  it('keeps fighting when a trigger names a script nobody has written yet', async () => {
    const cutscenes = new FakeCutscenes();
    const { presenter } = makePresenter({ cutscenes, midScripts: {} });
    presenter.setAutoPlay(attackStrategy);
    const engine = new FakeEngine({ enemyHp: 1200, triggerAfterFirstAction: 'not-written-yet' });

    const outcome = await presenter.run(engine);

    expect(cutscenes.played).toEqual([]);
    expect(outcome.kind).toBe('victory');
  });

  it('abort() stops the loop mid-battle, the way exit() does', async () => {
    const { presenter } = makePresenter();
    // The screen is torn down after the first command is chosen.
    presenter.setAutoPlay((actorId, commands, engine) => {
      presenter.abort();
      return attackStrategy(actorId, commands, engine);
    });
    const engine = new FakeEngine({ enemyHp: 999999, partyDamage: 1 });

    const outcome = await presenter.run(engine);

    expect(outcome.kind).toBe('aborted');
    expect(presenter.isAborted).toBe(true);
    // The battle was nowhere near over — we stopped it, it did not end.
    expect(engine.state().result).toBeNull();
  });

  it('falls back to the first enabled row when there is no HUD and no strategy', async () => {
    const { presenter } = makePresenter();
    const engine = new FakeEngine({ enemyHp: 1200, partyDamage: 1200 });

    const outcome = await presenter.run(engine);

    expect(outcome.kind).toBe('victory');
  });

  it('snapshot() reports what the debug API prints', async () => {
    const { presenter } = makePresenter();
    presenter.setAutoPlay(attackStrategy);
    presenter.setSpeed('fast');
    await presenter.run(new FakeEngine({ enemyHp: 1200 }));

    const snap = presenter.snapshot();
    expect(snap['speed']).toBe('fast');
    expect(snap['auto']).toBe(true);
    expect(snap['played']).toBeGreaterThan(0);
    expect(Array.isArray(snap['lastEvents'])).toBe(true);
  });
});

describe('auto-battle strategies', () => {
  it('the intended strategy heals a critical ally before attacking', async () => {
    const engine = new FakeEngine({ enemyHp: 999999, enemyDamage: 900 });
    // Drive Tidus under the heal threshold.
    const tidus = engine.state().combatants['tidus']!;
    tidus.hp = 100;

    const decision = engine.nextDecision();
    expect(decision.kind).toBe('player-input');
    if (decision.kind !== 'player-input') return;

    const picked = intendedStrategy(decision.actorId, decision.commands, engine);
    expect(picked?.kind).toBe('ability');
    expect(picked && 'id' in picked && picked.id).toBe('cure');
    expect(picked?.targets).toContain('tidus');
  });

  it('the intended strategy spends a ready Overdrive', () => {
    const engine = new FakeEngine({ enemyHp: 999999 });
    const decision = engine.nextDecision();
    if (decision.kind !== 'player-input') throw new Error('expected player input');

    const picked = intendedStrategy(decision.actorId, decision.commands, engine);
    expect(picked?.kind).toBe('overdrive');
    expect(picked?.targets).toEqual(['seymour-flux']);
  });

  it('beats the enemy faster than mashing attack', async () => {
    const run = async (strategy: typeof attackStrategy): Promise<number> => {
      const { presenter } = makePresenter();
      presenter.setAutoPlay(strategy);
      const engine = new FakeEngine({ enemyHp: 6000, partyDamage: 1000 });
      await presenter.run(engine);
      return engine.state().turn;
    };

    // The Overdrive is worth 2 extra attacks' damage, so it lands sooner.
    expect(await run(intendedStrategy)).toBeLessThan(await run(attackStrategy));
  });
});
