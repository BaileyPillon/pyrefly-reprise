/**
 * **The open command menu keeps its owner, and a chain-locked girl keeps her
 * command.** FFX-2 only (Active ATB, D-009; §1.7 chain lock).
 *
 * Critic round 08 PR-0076 and PR-0080. Under Active the clock runs while a menu
 * is open, and when an enemy hit chained the owner the menu used to be torn
 * down and replaced **in place** by the next ready girl's list — 262 ms, no
 * keypress, cursor on row 0 of somebody else's commands. Four in five of the
 * menus chapter 5 lost at human decision speed were exactly that.
 *
 * The correction (`docs/plans/ffx2-active-menu-review.md` §3) never touches a
 * boss: a chained owner's menu stays hers, a command she confirms while chained
 * is **held** and fires as her when the lock lifts, and another ready girl
 * waits behind in the ATB rows.
 *
 * Real `FFX2Engine`, real chapter 4 and 5 data, seeded, no DOM, fake clock.
 */

import { describe, expect, it } from 'vitest';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { CHAIN_WINDOW_TICKS } from '../../src/battle/ffx2/constants.ts';
import type { AvailableCommand, BattleEvent, CombatantId, Command } from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import { FakeAudio, FakeCutscenes, FakeDamageNumbers, FakeMessageBar, FakeStage } from './helpers/FakeStage.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';

const CH4 = 'ffx2-bahamut';

interface Unitish {
  alive: boolean;
  hp: number;
  chainWindowTicks: number;
  atb?: { ticks: number; required: number; recovery: number };
}

function newEngine(seed: number): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID[CH4];
  if (!group) throw new Error(`${CH4} missing`);
  const engine = new FFX2Engine(ffx2Options());
  engine.init({ game: 'ffx2', party: bevelleBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

function runToInput(engine: FFX2Engine): { actorId: CombatantId; commands: AvailableCommand[] } {
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return { actorId: d.actorId, commands: d.commands };
    if (d.kind === 'waiting') engine.tick(d.nextEventMs);
    else if (d.kind === 'battle-over') throw new Error('battle ended before a menu opened');
  }
  throw new Error('no menu inside 20 000 decisions');
}

const unit = (engine: FFX2Engine, id: CombatantId): Unitish => engine.state().combatants[id] as unknown as Unitish;

/** §1.7: a hit opens a 2 s window in which she cannot start an action. */
function chain(engine: FFX2Engine, id: CombatantId): void {
  unit(engine, id).chainWindowTicks = CHAIN_WINDOW_TICKS;
}

function makeOthersReady(engine: FFX2Engine, owner: CombatantId): void {
  for (const id of engine.state().activeIds) {
    if (id === owner) continue;
    const atb = unit(engine, id).atb;
    if (!atb) continue;
    atb.recovery = 0;
    atb.ticks = atb.required;
  }
}

/** An Attack on the first living enemy, from the menu she was actually offered. */
function attackFrom(engine: FFX2Engine, commands: AvailableCommand[]): Command {
  const row = commands.find((c) => c.enabled && c.command.kind === 'attack') ?? commands.find((c) => c.enabled);
  if (!row) return { kind: 'defend', targets: [] };
  const target = row.validTargets.find((id) => unit(engine, id).alive) ?? row.validTargets[0];
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

const partyTurns = (engine: FFX2Engine, events: readonly BattleEvent[]): CombatantId[] =>
  events
    .filter((e): e is Extract<BattleEvent, { type: 'turn-start' }> => e.type === 'turn-start')
    .map((e) => e.actorId)
    .filter((id) => engine.state().activeIds.includes(id));

describe('a chain-locked owner keeps her command (PR-0076)', () => {
  it('her menu stays valid while she is chained — the lock is not an invalidation', () => {
    const engine = newEngine(7);
    const { actorId } = runToInput(engine);
    chain(engine, actorId);
    expect(engine.inputValid(actorId)).toBe(true);
  });

  it('a command confirmed while chained is held, then executes as her when the lock lifts (Active pump path)', () => {
    const engine = newEngine(7);
    const { actorId, commands } = runToInput(engine);
    chain(engine, actorId);
    const command = attackFrom(engine, commands);
    const turnBefore = engine.state().turn;

    const held = engine.submit(command);
    expect(held).toEqual([]);
    expect(engine.state().turn).toBe(turnBefore);
    expect(engine.heldCommand()).toEqual({ actorId, command });

    // The clock runs under whatever menu comes next; the hold fires in it.
    const seen: BattleEvent[] = [];
    for (let i = 0; i < 80 && !partyTurns(engine, seen).includes(actorId); i++) {
      seen.push(...engine.tick(50, { throughInput: true }));
    }
    const turns = partyTurns(engine, seen);
    expect(turns).toEqual([actorId]);
    const start = seen.find((e) => e.type === 'action-start' && e.actorId === actorId);
    expect(start).toBeDefined();
    expect(engine.heldCommand()).toBeNull();
  });

  it('fires the same way through the Wait path (nextDecision / tick), once, as her', () => {
    const engine = newEngine(7);
    const { actorId, commands } = runToInput(engine);
    chain(engine, actorId);
    engine.submit(attackFrom(engine, commands));

    const from = engine.state().log.length;
    let fired = false;
    for (let i = 0; i < 200 && !fired; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') engine.tick(d.nextEventMs);
      if (d.kind === 'player-input') {
        // Somebody else's menu: she must never be offered one while she holds a command.
        expect(d.actorId).not.toBe(actorId);
        engine.submit({ kind: 'defend', targets: [] } as Command);
      }
      fired = partyTurns(engine, engine.state().log.slice(from)).includes(actorId);
    }
    expect(fired).toBe(true);
    const mine = partyTurns(engine, engine.state().log.slice(from)).filter((id) => id === actorId);
    expect(mine).toEqual([actorId]);
  });

  it('drops a held command whose owner is KO’d before the lock lifts — never fired, never as somebody else', () => {
    const engine = newEngine(7);
    const { actorId, commands } = runToInput(engine);
    makeOthersReady(engine, actorId);
    chain(engine, actorId);
    const command = attackFrom(engine, commands);
    engine.submit(command);
    const girl = unit(engine, actorId);
    girl.hp = 0;
    girl.alive = false;

    const from = engine.state().log.length;
    for (let i = 0; i < 80; i++) engine.tick(50, { throughInput: true });
    const actions = engine.state().log
      .slice(from)
      .filter((e) => e.type === 'action-start' && engine.state().activeIds.includes(e.actorId));
    expect(actions).toEqual([]);
    expect(engine.heldCommand()).toBeNull();
  });
});

describe('an open menu keeps its owner until she answers (PR-0080)', () => {
  it('the input owner never changes while she can still answer, even chained with every girl ready', () => {
    const engine = newEngine(7);
    const { actorId } = runToInput(engine);
    makeOthersReady(engine, actorId);

    let steps = 0;
    for (let i = 0; i < 60; i++) {
      chain(engine, actorId); // re-chained every step: the worst case, Vegnagun's multi-hits
      engine.tick(50, { throughInput: true });
      if (!unit(engine, actorId).alive) break;
      expect(engine.inputValid(actorId)).toBe(true);
      const d = engine.nextDecision();
      expect(d.kind).toBe('player-input');
      if (d.kind === 'player-input') expect(d.actorId).toBe(actorId);
      steps += 1;
    }
    expect(steps).toBeGreaterThan(10);
  });

  it('through the real presenter: a chained owner’s menu is never closed or re-opened for another girl', async () => {
    const engine = newEngine(7);
    const state = engine.state();
    const asked: CombatantId[] = [];
    const turnStarts: CombatantId[] = [];
    let closeCalls = 0;
    let answer: ((c: Command) => void) | null = null;
    let offered: AvailableCommand[] = [];

    const hud: HudPort = {
      mount() {},
      unmount() {},
      sync() {},
      syncGauges() {},
      setVisible() {},
      setProjector() {},
      openMinigame: () => new Promise<never>(() => undefined),
      closeCommandMenu() {
        closeCalls += 1;
      },
      chooseCommand(actorId: CombatantId, commands: AvailableCommand[]) {
        asked.push(actorId);
        if (asked.length === 1) {
          offered = commands;
          makeOthersReady(engine, actorId);
          chain(engine, actorId);
          return new Promise<Command>((res) => {
            answer = res;
          });
        }
        return new Promise<Command>(() => undefined);
      },
      onEvent(event: BattleEvent) {
        if (event.type === 'turn-start') turnStarts.push(event.actorId);
      },
    };

    let clock = 0;
    const presenter = new BattlePresenter({
      stage: new FakeStage([...state.activeIds], [...state.enemyIds]),
      hud,
      damageNumbers: new FakeDamageNumbers(),
      messageBar: new FakeMessageBar(),
      audio: new FakeAudio(),
      cutscenes: new FakeCutscenes(),
      sleep: (ms) => {
        clock += ms;
        return Promise.resolve();
      },
      now: () => clock,
    });
    void presenter.run(engine);

    const until = async (cond: () => boolean, max = 20_000): Promise<void> => {
      for (let i = 0; i < max && !cond(); i++) await Promise.resolve();
    };
    await until(() => asked.length > 0);
    const owner = asked[0]!;
    const ticksAtOpen = engine.state().ticks;
    // Half a second of real clock under the open menu, the owner chained throughout.
    await until(() => engine.state().ticks >= ticksAtOpen + 1500);
    expect(engine.state().ticks).toBeGreaterThanOrEqual(ticksAtOpen + 1500);
    expect(asked).toEqual([owner]);
    expect(closeCalls).toBe(0);

    const turnsBefore = turnStarts.length;
    answer!(attackFrom(engine, offered));
    await until(() => turnStarts.slice(turnsBefore).includes(owner), 40_000);
    // Her command landed on her, and on nobody else.
    const partyAfter = turnStarts.slice(turnsBefore).filter((id) => state.activeIds.includes(id));
    expect(partyAfter[0]).toBe(owner);
    expect(closeCalls).toBe(0);
    presenter.abort();
  });
});
