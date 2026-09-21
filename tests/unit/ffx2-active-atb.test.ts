/**
 * **Active ATB** — FFX-2's clock runs while a command menu is open.
 *
 * Bailey, 2026-09-21 (`docs/target/decisions.json` D-009): *"For ffx-2 I choose
 * active."* Active only, no Wait toggle. The mechanic is
 * `research/ffx2-combat-core.md` §1.5 and the build is
 * `docs/plans/ffx2-active-atb-review.md` §9's acceptance cases.
 *
 * **Real `FFX2Engine`**, real Chapter 4 and Chapter 5 data, a **fake clock**
 * and the real pump from `src/engine/BattlePresenterActive.ts`. No timers, no
 * DOM, no wall clock — every case is reproducible from its seed.
 *
 * `tests/unit/ffx-no-active-clock.test.ts` is the other half (rule 14): the
 * same pump must be inert for FFX.
 */

import { describe, expect, it } from 'vitest';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { msToTicks } from '../../src/battle/ffx2/gauges.ts';
import type {
  AvailableCommand,
  BattleEvent,
  CombatantId,
  Command,
  StatusId,
  StatusInstance,
} from '../../src/battle/common/types.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { bevelleBuild } from '../../src/data/ffx2/builds/bevelle.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
import {
  FakeAudio,
  FakeCutscenes,
  FakeDamageNumbers,
  FakeMessageBar,
  FakeStage,
} from './helpers/FakeStage.ts';
import {
  MAX_STEP_MS,
  PUMP_MS,
  runActivePump,
  type ActiveClockEngine,
} from '../../src/engine/BattlePresenterActive.ts';

const CH4 = 'ffx2-bahamut';

function engineOptions() {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false as const,
  };
}

function newEngine(groupId: string, seed: number, party = bevelleBuild): FFX2Engine {
  const group = data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} missing from the data layer`);
  const engine = new FFX2Engine(engineOptions());
  engine.init({
    game: 'ffx2',
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

/** Drive the engine the way `BattleScreenWiring` does until a menu would open. */
function runToInput(engine: FFX2Engine): CombatantId {
  for (let i = 0; i < 20_000; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d.actorId;
    if (d.kind === 'waiting') {
      engine.tick(d.nextEventMs);
      continue;
    }
    if (d.kind === 'resolved') continue;
    throw new Error('battle ended before any command was asked for');
  }
  throw new Error('no player-input decision inside 20 000 decisions');
}

/** A real status instance, the shape `setup.ts` builds. */
function statusInstance(id: StatusId): StatusInstance {
  return { id, turnsRemaining: null, ticksRemaining: 10_000, charges: null, stacks: 1, permanent: false };
}

interface PumpOpts {
  /** Wall-clock the fake clock jumps per wait, instead of `PUMP_MS`. */
  jumpMs?: number;
  /** Wall-clock an animation eats inside `play`. */
  playMs?: number;
  /** Stop after this much simulated waiting. */
  forMs: number;
  /** Park the pump's wait forever from this step on (the pause overlay). */
  pauseAfter?: number;
}

/**
 * The real pump over the real engine, on a fake clock.
 *
 * The engine is wrapped, never replaced: `tick` forwards to the real one and
 * only records what it was handed, which is how the clamp and the
 * animation-freeze cases can assert what actually reached the engine.
 */
async function pump(engine: FFX2Engine, actorId: CombatantId, opts: PumpOpts) {
  let clock = 0;
  let waited = 0;
  let steps = 0;
  const fed: number[] = [];
  const played: BattleEvent[] = [];
  const gaugeSyncs: number[] = [];

  const wrapped: ActiveClockEngine = {
    tick: (ms, o) => {
      fed.push(ms);
      return engine.tick(ms, o);
    },
    inputValid: (id) => engine.inputValid(id),
    gaugeSnapshot: () => engine.gaugeSnapshot(),
  };

  const stop = await runActivePump({
    engine: wrapped,
    actorId,
    settled: () => waited > opts.forMs,
    aborted: () => false,
    sleep: (ms) => {
      steps += 1;
      if (opts.pauseAfter !== undefined && steps > opts.pauseAfter) {
        // The pause gate parks and never resolves while the overlay is up.
        return new Promise<void>(() => undefined);
      }
      waited += ms;
      clock += opts.jumpMs ?? ms;
      return Promise.resolve();
    },
    now: () => clock,
    play: async (events) => {
      played.push(...events);
      clock += opts.playMs ?? 0;
      return { dropped: 0 };
    },
    syncGauges: (snapshot) => {
      gaugeSyncs.push(snapshot.bars.length);
    },
  });

  return { stop, fed, played, gaugeSyncs, steps };
}

/** A pump that is paused forever never returns; race it against a tick budget. */
function withBudget<T>(p: Promise<T>): Promise<T | 'never-returned'> {
  return Promise.race([p, Promise.resolve('never-returned' as const)]);
}

describe('Active ATB — the clock runs under an open command menu (FFX-2 only)', () => {
  it('advances Chapter 4 by the real time that passed while the menu was open', async () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);
    const before = engine.state().ticks;

    const { fed } = await pump(engine, actorId, { forMs: 2000 });

    const after = engine.state().ticks;
    // Round 05's measurement of this exact read was 8189 -> 8189 over 2013 ms.
    expect(after).toBeGreaterThan(before);
    // Every millisecond the pump was handed reached the engine: what it could
    // not spend in one step (a ready enemy ends the step so its events can be
    // played) is carried into the next one.
    const handed = fed.reduce((a, b) => a + b, 0);
    expect(handed).toBeCloseTo(2000, 6);
    expect(after - before).toBeGreaterThan(msToTicks(2000) * 0.98);
    expect(after - before).toBeLessThanOrEqual(msToTicks(2000) + 1);
  });

  it('moves at least one gauge, and keeps the menu open while it does', async () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);
    const fillBefore = engine.gaugeSnapshot().bars.map((b) => b.fill);

    const { stop, gaugeSyncs } = await pump(engine, actorId, { forMs: 2000 });

    const fillAfter = engine.gaugeSnapshot().bars.map((b) => b.fill);
    expect(fillAfter.some((f, i) => f !== fillBefore[i])).toBe(true);
    expect(gaugeSyncs.length).toBeGreaterThan(0);
    // Not invalidated: the menu is still the player's to answer.
    expect(stop).toBe('settled');
    expect(engine.inputValid(actorId)).toBe(true);
  });

  it('without `throughInput` no enemy ever acts while a girl stands ready — the mutation check', () => {
    const engine = newEngine(CH4, 7);
    runToInput(engine);
    const state = engine.state();
    const from = state.log.length;

    // Thirty seconds of Wait-mode ticking. The sub-step loop stops at the ready
    // player every time, so Bahamut never gets a turn — which is exactly the
    // build round 05 measured, and exactly what Active changes.
    for (let i = 0; i < 600; i++) engine.tick(PUMP_MS);

    const enemyActions = state.log
      .slice(from)
      .filter((e) => e.type === 'action-start' && state.enemyIds.includes(e.actorId));
    expect(enemyActions.length).toBe(0);
  });

  it('advances Chapter 5 the same way, parts and all', async () => {
    const engine = newEngine('vegnagun-leg', 7, farplaneBuild);
    const actorId = runToInput(engine);
    const before = engine.state().ticks;

    await pump(engine, actorId, { forMs: 2000 });

    // One step's worth may still be owed as carry when the pump stops.
    expect(engine.state().ticks - before).toBeGreaterThan(msToTicks(2000 - MAX_STEP_MS));
  });

  it('lets an enemy take its turn while the menu is open, and leaves the menu open', async () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);

    const { played, stop } = await pump(engine, actorId, { forMs: 30_000 });

    const state = engine.state();
    const enemyActions = played.filter(
      (e) => e.type === 'action-start' && state.enemyIds.includes(e.actorId),
    );
    expect(enemyActions.length).toBeGreaterThan(0);
    // §3.3: the single-sourced "a hit closes the menu" rule is NOT built.
    // If the owner survived, her menu is still hers.
    if (stop === 'settled') expect(engine.inputValid(actorId)).toBe(true);
  });

  it('clamps a hidden tab: a ten-second jump reaches the engine as one MAX_STEP_MS', async () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);

    const { fed } = await pump(engine, actorId, { forMs: PUMP_MS, jumpMs: 10_000 });

    expect(fed.length).toBeGreaterThan(0);
    for (const ms of fed) expect(ms).toBeLessThanOrEqual(MAX_STEP_MS);
  });

  it('does not charge the clock for an animation (the §4.5 trap)', async () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);

    // Every step plays for 3 s of fake clock. If `last` were not reset after
    // `play`, the step after any animation would hand the engine 3050 ms.
    const { fed } = await pump(engine, actorId, { forMs: 30_000, playMs: 3000 });

    for (const ms of fed) expect(ms).toBeLessThanOrEqual(MAX_STEP_MS);
    expect(fed.filter((ms) => ms > PUMP_MS + 1).length).toBe(0);
  });

  it('freezes the ATB while the pause gate is parked', async () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);

    const running = pump(engine, actorId, { forMs: 30_000, pauseAfter: 3 });
    // Let the three steps before the pause resolve.
    for (let i = 0; i < 50; i++) await Promise.resolve();
    const atPause = engine.state().ticks;
    for (let i = 0; i < 500; i++) await Promise.resolve();

    expect(engine.state().ticks).toBe(atPause);
    expect(await withBudget(running)).toBe('never-returned');
  });
});

describe('Active ATB — the input owner (preflight §4.2)', () => {
  /** Fill every ready girl's bar so more than one is queued at once. */
  function makeAllReady(engine: FFX2Engine): void {
    const state = engine.state();
    for (const id of state.activeIds) {
      const c = state.combatants[id];
      if (!c || !('atb' in c)) continue;
      const atb = (c as { atb: { ticks: number; required: number; recovery: number } }).atb;
      atb.recovery = 0;
      atb.ticks = atb.required;
    }
  }

  it('executes the command as the girl whose menu was open, not as whoever sorts first', () => {
    const engine = newEngine(CH4, 7);
    const first = runToInput(engine);

    // Everyone is ready now. `actorOrder` sorts party by slot, so without the
    // input-owner lock the lowest slot would steal the command.
    makeAllReady(engine);
    const state = engine.state();
    const lowestSlot = state.activeIds[0];
    expect(lowestSlot).toBeDefined();
    // Without this the case is a tautology on any seed whose first menu owner
    // *is* slot 0 (measured: yuna at seeds 1 and 3, paine at seed 7) — it would
    // pass with the input-owner lock deleted. Seed 7 is pinned for that reason.
    expect(first).not.toBe(lowestSlot);

    const events = engine.submit({ kind: 'defend', targets: [] } as Command);
    const turnStart = events.find((e) => e.type === 'turn-start');

    expect(turnStart && turnStart.type === 'turn-start' && turnStart.actorId).toBe(first);
  });

  it('refuses a command whose owner was KO’d under her menu — never runs it as another girl', () => {
    const engine = newEngine(CH4, 7);
    const owner = runToInput(engine);
    const decision = engine.nextDecision();
    if (decision.kind !== 'player-input') throw new Error('expected a menu');
    const ability = decision.commands.find((c) => c.command.kind === 'ability' && c.enabled);
    expect(ability).toBeDefined();

    // Somebody else is standing ready, which is the whole danger: `nextActor`
    // used to fall through to her and execute Paine's Warrior ability as Rikku.
    makeAllReady(engine);
    const others = engine.state().activeIds.filter((id) => id !== owner);
    expect(others.length).toBeGreaterThan(0);

    const girl = engine.state().combatants[owner] as { hp: number; alive: boolean };
    girl.hp = 0;
    girl.alive = false;

    const turnBefore = engine.state().turn;
    const enemyId = engine.state().enemyIds[0];
    const events = engine.submit({ ...ability!.command, targets: [enemyId!] } as Command);

    expect(events.length).toBe(0);
    expect(engine.state().turn).toBe(turnBefore);
    // And the battle moves on rather than hanging: the next menu belongs to
    // somebody who can actually answer it.
    const next = engine.nextDecision();
    expect(next.kind).toBe('player-input');
    if (next.kind === 'player-input') expect(next.actorId).not.toBe(owner);
  });

  it('refuses it just the same when nobody else is ready (no silent drop, no stolen turn)', () => {
    const engine = newEngine(CH4, 7);
    const owner = runToInput(engine);
    const girl = engine.state().combatants[owner] as { hp: number; alive: boolean };
    girl.hp = 0;
    girl.alive = false;

    const turnBefore = engine.state().turn;
    const events = engine.submit({ kind: 'defend', targets: [] } as Command);

    expect(events.length).toBe(0);
    expect(engine.state().turn).toBe(turnBefore);
    expect(engine.inputValid(owner)).toBe(false);
  });

  it('offers a queue of ready girls one at a time, in actorOrder', () => {
    const engine = newEngine(CH4, 7);
    runToInput(engine);
    makeAllReady(engine);

    const offered: CombatantId[] = [];
    for (let i = 0; i < 3; i++) {
      const d = engine.nextDecision();
      if (d.kind !== 'player-input') break;
      offered.push(d.actorId);
      engine.submit({ kind: 'defend', targets: [] } as Command);
    }

    expect(offered.length).toBe(3);
    expect(new Set(offered).size).toBe(3);
    // The first was already the owner; the rest follow the party's slot order.
    const order = engine.state().activeIds;
    const rest = offered.slice(1);
    expect(rest).toEqual(order.filter((id) => rest.includes(id)));
  });

  it('asking twice with no tick in between returns the same decision (contract rule 1)', () => {
    const engine = newEngine(CH4, 7);
    runToInput(engine);
    const a = engine.nextDecision();
    const logLen = engine.state().log.length;
    const b = engine.nextDecision();

    expect(a.kind).toBe('player-input');
    expect(b).toEqual(a);
    expect(engine.state().log.length).toBe(logLen);
  });
});

describe('Active ATB — an open menu that can no longer be answered', () => {
  it('goes invalid when the owner is KO’d mid-input', async () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);
    expect(engine.inputValid(actorId)).toBe(true);

    const owner = engine.state().combatants[actorId] as { hp: number; alive: boolean };
    owner.hp = 0;
    owner.alive = false;

    expect(engine.inputValid(actorId)).toBe(false);
    const { stop } = await pump(engine, actorId, { forMs: 2000 });
    expect(stop).toBe('invalidated');
  });

  it('goes invalid when the owner is Stopped, and when the battle ends under her', () => {
    const stopped = newEngine(CH4, 7);
    const a = runToInput(stopped);
    (stopped.state().combatants[a] as { statuses: Record<string, StatusInstance> }).statuses['stop'] =
      statusInstance('stop');
    expect(stopped.inputValid(a)).toBe(false);

    const ended = newEngine(CH4, 7);
    const b = runToInput(ended);
    for (const id of ended.state().enemyIds) {
      const enemy = ended.state().combatants[id] as { hp: number; alive: boolean };
      enemy.hp = 0;
      enemy.alive = false;
    }
    ended.nextDecision();
    expect(ended.inputValid(b)).toBe(false);
  });

  it('goes invalid when the owner is Berserked mid-input, and the engine then takes her turn', () => {
    const engine = newEngine(CH4, 7);
    const actorId = runToInput(engine);
    (engine.state().combatants[actorId] as { statuses: Record<string, StatusInstance> }).statuses[
      'berserk'
    ] = statusInstance('berserk');

    expect(engine.inputValid(actorId)).toBe(false);
    const d = engine.nextDecision();
    expect(d.kind).toBe('resolved');
  });
});

describe('Active ATB — a target that died while it was being aimed at (§4.4)', () => {
  it('refuses the command and does not spend the turn', () => {
    // An ally, not the last enemy: killing Bahamut would end the battle and
    // there would be no menu left to reopen.
    const engine = newEngine('vegnagun-leg', 3, farplaneBuild);
    let actorId = runToInput(engine);
    for (let i = 0; i < 40 && actorId !== 'yuna'; i++) {
      engine.submit({ kind: 'defend', targets: [] } as Command);
      actorId = runToInput(engine);
    }
    expect(actorId).toBe('yuna');

    const allyId = engine.state().activeIds.find((id) => id !== actorId);
    expect(allyId).toBeDefined();
    const ally = engine.state().combatants[allyId!] as { hp: number; alive: boolean };
    ally.hp = 0;
    ally.alive = false;

    const turnBefore = engine.state().turn;
    const events = engine.submit({
      kind: 'ability',
      id: 'x2-white-mage-cure',
      targets: [allyId!],
    } as Command);

    expect(events.length).toBe(0);
    expect(engine.state().turn).toBe(turnBefore);
    // And the same girl is offered a fresh menu.
    const d = engine.nextDecision();
    expect(d.kind).toBe('player-input');
    if (d.kind === 'player-input') expect(d.actorId).toBe(actorId);
  });

  it('still lets a revival reach a KO’d ally', () => {
    const engine = newEngine('vegnagun-leg', 3, farplaneBuild);
    let actorId = runToInput(engine);
    // Yuna is the White Mage who has Life; wait for her turn.
    for (let i = 0; i < 40 && actorId !== 'yuna'; i++) {
      engine.submit({ kind: 'defend', targets: [] } as Command);
      actorId = runToInput(engine);
    }
    expect(actorId).toBe('yuna');
    const allyId = engine.state().activeIds.find((id) => id !== actorId);
    expect(allyId).toBeDefined();
    const ally = engine.state().combatants[allyId!] as { hp: number; alive: boolean };
    ally.hp = 0;
    ally.alive = false;

    const turnBefore = engine.state().turn;
    const events = engine.submit({
      kind: 'ability',
      id: 'x2-white-mage-life',
      targets: [allyId!],
    } as Command);

    // `can-target-dead`: the refuse-and-reopen guard must not eat a revival.
    expect(engine.state().turn).toBe(turnBefore + 1);
    expect(events.some((e) => e.type === 'turn-start')).toBe(true);
  });
});

describe('Berserk on a dressphere with no Attack names the turn (critic PR-0052)', () => {
  it('emits an action line and a message instead of passing in silence', () => {
    // Chapter 5's Yuna starts in White Mage, which is one of the three
    // dresspheres with no Attack command at all (§3.4-3.6).
    const engine = newEngine('vegnagun-leg', 3, farplaneBuild);
    let actorId = runToInput(engine);
    for (let i = 0; i < 40 && actorId !== 'yuna'; i++) {
      engine.submit({ kind: 'defend', targets: [] } as Command);
      actorId = runToInput(engine);
    }
    expect(actorId).toBe('yuna');
    const girl = engine.state().combatants['yuna'] as {
      statuses: Record<string, StatusInstance>;
      name: string;
      dresspheres?: { current: string };
    };
    expect(girl.dresspheres?.current).toBe('white-mage');
    girl.statuses['berserk'] = statusInstance('berserk');

    const d = engine.nextDecision();
    expect(d.kind).toBe('resolved');
    if (d.kind !== 'resolved') return;

    const start = d.events.find((e) => e.type === 'action-start');
    const message = d.events.find((e) => e.type === 'message');
    expect(start && start.type === 'action-start' && start.actorId).toBe('yuna');
    expect(start && start.type === 'action-start' && start.abilityName).toBe('Berserk');
    expect(message && message.type === 'message' && message.text).toContain(girl.name);
    expect(message && message.type === 'message' && message.text).toContain('Berserk');
    // The turn still passes — the sources conflict and hard rule 6 forbids
    // inventing the damage row (see `berserkCommand`).
    expect(d.events.some((e) => e.type === 'action-end' && e.actorId === 'yuna')).toBe(true);
  });
});

/**
 * The same thing through the **real `BattlePresenter`** and the real HudPort
 * shape, which is where the pump actually lives: everything above drives
 * `runActivePump` directly, and this is the proof that the presenter's
 * `'player-input'` branch starts it, feeds the HUD and abandons a menu whose
 * owner can no longer answer.
 */
describe('Active ATB through the real presenter', () => {
  class SilentMenuHud implements HudPort {
    chooseCommandCalls = 0;
    closeCalls = 0;
    gaugeSyncs = 0;
    lastActor: CombatantId | null = null;

    mount(): void {}
    unmount(): void {}
    sync(): void {}
    syncGauges(): void {
      this.gaugeSyncs += 1;
    }
    chooseCommand(actorId: CombatantId): Promise<Command> {
      this.chooseCommandCalls += 1;
      this.lastActor = actorId;
      return new Promise<Command>(() => undefined);
    }
    closeCommandMenu(): void {
      this.closeCalls += 1;
    }
    onEvent(): void {}
    openMinigame(): Promise<never> {
      return new Promise<never>(() => undefined);
    }
    setVisible(): void {}
    setProjector(): void {}
  }

  async function settle(turns = 200): Promise<void> {
    for (let i = 0; i < turns; i++) await Promise.resolve();
  }

  /** Drain microtasks until `cond`, so a fight is never run further than needed. */
  async function settleUntil(cond: () => boolean, max = 4000): Promise<void> {
    for (let i = 0; i < max; i++) {
      if (cond()) return;
      await Promise.resolve();
    }
  }

  function drive(engine: FFX2Engine) {
    const state = engine.state();
    const hud = new SilentMenuHud();
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
    return { hud, presenter, run: presenter.run(engine) };
  }

  it('keeps the Chapter 4 clock running and the gauges moving under an open menu', async () => {
    const engine = newEngine(CH4, 7);
    const { hud, presenter } = drive(engine);
    await settleUntil(() => hud.chooseCommandCalls > 0);

    expect(hud.chooseCommandCalls).toBe(1);
    const at = engine.state().ticks;
    await settle(120);

    expect(engine.state().ticks).toBeGreaterThan(at);
    expect(hud.gaugeSyncs).toBeGreaterThan(0);
    presenter.abort();
  });

  it('closes the menu and moves on when its owner is KO\u2019d mid-input', async () => {
    const engine = newEngine(CH4, 7);
    const { hud, presenter } = drive(engine);
    await settleUntil(() => hud.chooseCommandCalls > 0);

    const owner = hud.lastActor;
    expect(owner).toBeTruthy();
    const asked = hud.chooseCommandCalls;
    const girl = engine.state().combatants[owner!] as { hp: number; alive: boolean };
    girl.hp = 0;
    girl.alive = false;

    await settleUntil(() => hud.closeCalls > 0 && hud.chooseCommandCalls > asked);

    expect(hud.closeCalls).toBeGreaterThan(0);
    // The loop did not abort: it asked the engine again and someone else's
    // menu opened rather than the battle hanging on a dead one.
    expect(hud.chooseCommandCalls).toBeGreaterThan(asked);
    expect(presenter.isAborted).toBe(false);
    presenter.abort();
  });

  /**
   * The regression guard for the gate itself.
   *
   * The repair added an `inputValid` check immediately before every FFX-2
   * submit. Auto-battle returns from `chooseCommand` before the pump is even
   * built, so the 40-seed strategy arms do **not** exercise that gate — if it
   * were wrong, every ordinary command would be refused in silence and no
   * existing suite would notice. This is a human answering an ordinary menu
   * after the clock has been running under it for a while.
   */
  it('still submits an ordinary command, after the clock has run under the menu', async () => {
    const engine = newEngine(CH4, 7);
    const state = engine.state();
    const turnStarts: CombatantId[] = [];
    let owner: CombatantId | null = null;

    class PatientHud implements HudPort {
      chooseCommandCalls = 0;
      closeCalls = 0;
      answered: Command | null = null;
      mount(): void {}
      unmount(): void {}
      sync(): void {}
      syncGauges(): void {}
      openMinigame(): Promise<never> {
        return new Promise<never>(() => undefined);
      }
      setVisible(): void {}
      setProjector(): void {}
      closeCommandMenu(): void {
        this.closeCalls += 1;
      }
      chooseCommand(actorId: CombatantId, commands: AvailableCommand[]): Promise<Command> {
        this.chooseCommandCalls += 1;
        if (this.chooseCommandCalls > 1) return new Promise<Command>(() => undefined);
        owner = actorId;
        // Let the clock actually run under the menu, then answer — the
        // ordinary case. Bounded: read long enough and Bahamut chain-locks or
        // KO's her, which is a different case (the one below).
        const opened = engine.state().ticks;
        return new Promise<Command>((res) => {
          void (async () => {
            for (let i = 0; i < 400 && engine.state().ticks < opened + 100; i++) {
              await Promise.resolve();
            }
            const row = commands.find((c) => c.enabled && c.command.kind === 'attack')
              ?? commands.find((c) => c.enabled);
            const target = row?.validTargets[0];
            this.answered = row
              ? ({ ...row.command, ...(target ? { targets: [target] } : {}) } as Command)
              : ({ kind: 'defend', targets: [] } as Command);
            res(this.answered);
          })();
        });
      }
      onEvent(event: BattleEvent): void {
        if (event.type === 'turn-start') turnStarts.push(event.actorId);
      }
    }

    const hud = new PatientHud();
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

    await settleUntil(() => hud.chooseCommandCalls > 0);
    const ticksAtMenu = engine.state().ticks;
    await settleUntil(() => owner !== null && turnStarts.includes(owner), 20_000);

    // The clock really did run under the menu, and her command still landed on
    // her — the gate refuses a dead owner, never a live one.
    expect(engine.state().ticks).toBeGreaterThan(ticksAtMenu);
    expect(turnStarts).toContain(owner);
    expect(hud.closeCalls).toBe(0);
    presenter.abort();
  });

  /**
   * The wave-1a verifier's silent critical, through the real presenter.
   *
   * Confirm is pressed **in the same pump step** that KOs the menu's owner —
   * the player answers while the enemy's hit is still animating. Before the
   * fix the pump returned `'settled'` without re-asking `inputValid`, the
   * command won the race, and `FFX2Engine.submit` fell through to whoever else
   * sorted first: Paine's Warrior ability executed as Rikku, who does not have
   * it, spending Rikku's turn. Measured then: `rikku:Power Break`.
   */
  it('never executes a command as a different girl when its owner dies in the same step', async () => {
    const engine = newEngine(CH4, 7);
    const state = engine.state();
    const turnStarts: CombatantId[] = [];
    const actionStarts: string[] = [];
    let menuOwner: CombatantId | null = null;
    let resolveMenu: ((c: Command) => void) | null = null;
    let ownerCommands: AvailableCommand[] = [];
    let fired = false;
    let submitted: Command | null = null;

    /** Answers the first menu at the worst possible instant, then goes silent. */
    class RacyHud implements HudPort {
      chooseCommandCalls = 0;
      closeCalls = 0;
      mount(): void {}
      unmount(): void {}
      sync(): void {}
      syncGauges(): void {}
      chooseCommand(actorId: CombatantId, commands: AvailableCommand[]): Promise<Command> {
        this.chooseCommandCalls += 1;
        const first = this.chooseCommandCalls === 1;
        if (first) {
          menuOwner = actorId;
          ownerCommands = commands;
        }
        return new Promise<Command>((res) => {
          if (first) resolveMenu = res;
        });
      }
      closeCommandMenu(): void {
        this.closeCalls += 1;
      }
      onEvent(event: BattleEvent): void {
        if (event.type === 'turn-start') turnStarts.push(event.actorId);
        if (event.type === 'action-start') actionStarts.push(`${event.actorId}:${event.abilityName ?? ''}`);
        if (fired || !menuOwner) return;
        if (event.type !== 'action-start' || !state.enemyIds.includes(event.actorId)) return;
        // Is anybody else standing ready to steal the command?
        const ready = state.activeIds.filter((id) => id !== menuOwner).filter((id) => {
          const c = state.combatants[id] as {
            alive: boolean;
            atb?: { ticks: number; required: number; recovery: number };
          };
          return c.alive && !!c.atb && c.atb.recovery <= 0 && c.atb.ticks >= c.atb.required;
        });
        if (ready.length === 0) return;
        fired = true;
        const girl = state.combatants[menuOwner] as { hp: number; alive: boolean };
        girl.hp = 0;
        girl.alive = false;
        const ability = ownerCommands.find((c) => c.command.kind === 'ability' && c.enabled);
        submitted = ability
          ? ({ ...ability.command, targets: [state.enemyIds[0]!] } as Command)
          : ({ kind: 'defend', targets: [] } as Command);
        resolveMenu?.(submitted);
      }
      openMinigame(): Promise<never> {
        return new Promise<never>(() => undefined);
      }
      setVisible(): void {}
      setProjector(): void {}
    }

    const hud = new RacyHud();
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

    await settleUntil(() => hud.chooseCommandCalls > 0);
    expect(menuOwner).toBeTruthy();
    await settleUntil(() => fired, 40_000);
    expect(fired).toBe(true);
    const armedAtTurn = turnStarts.length;
    const armedAtAction = actionStarts.length;
    await settleUntil(() => hud.closeCalls > 0 && hud.chooseCommandCalls > 1, 8000);

    // Nobody in the party took a turn: the dead girl could not, and no other
    // girl's turn may be spent on a command she never chose. Enemies carry on.
    const partyTurns = turnStarts.slice(armedAtTurn).filter((id) => state.activeIds.includes(id));
    expect(partyTurns).toEqual([]);
    expect(submitted).not.toBeNull();
    // Nor did the ability itself appear on anybody: measured before the fix,
    // this held `rikku:Power Break`.
    const stolen = actionStarts
      .slice(armedAtAction)
      .filter((line) => state.activeIds.some((id) => line.startsWith(`${id}:`)));
    expect(stolen).toEqual([]);
    // The menu was torn down and the fight moved on rather than hanging.
    expect(hud.closeCalls).toBeGreaterThan(0);
    expect(hud.chooseCommandCalls).toBeGreaterThan(1);
    expect(presenter.isAborted).toBe(false);
    presenter.abort();
  });
});
