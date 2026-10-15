/**
 * The FFX-2 engine's core: its state, and the internals the decision loop calls (turn order, the
 * held command, AI and Berserk turns, post-action hooks, the battle-end check, the event log).
 * Split out of `engine.ts` as a pure move (critic PR-0083 / F3; house rule 7, every source file
 * under 400 lines). `FFX2Engine` extends it with the public `BattleEngine` surface. Seeded event logs
 * are byte-identical before and after (`tests/unit/iter2-b1-bench.test.ts`, `docs/handoff/iter2-b1.md`).
 *
 * Pure TypeScript: no DOM, no Three.js, no `Math.random()`. FFX-2 only.
 */

import type {
  AtbSnapshot,
  BattleEvent,
  BattleResult,
  BattleState,
  CombatantId,
  Command,
} from '../common/types.ts';
import type { BattleRng } from '../common/streams.ts';
import { makeFfx2Rng } from './adapt/streams.ts';
import { stepsToMs } from './clock.ts';
import type {
  AbilityRegistry,
  AiContext,
  DressphereRegistry,
  EventDraft,
  Ffx2EngineOptions,
  Ffx2Unit,
  GarmentGridRegistry,
} from './internal.ts';
import { pollIsNotATurn, settleFlavourTurn } from './flavour-turn.ts';
import { WAKE_ON_ALIVE_CHANGE, WAKE_ON_RESULT } from './ai/idle.ts';
import { chainRegistries, defaultAbilities } from './abilities.ts';
import { baseSpeedOf, type AtbSpeed } from './clock.ts';
import { defaultDresspheres } from './dresspheres.ts';
import { defaultGarmentGrids } from './garment-grids.ts';
import { buildSnapshot } from './gauges.ts';
import { bySlot, completeCommand, wakeIdle } from './atb-engine.ts';
import { logicStep } from './logic-step.ts';
import type { ResolveContext } from './resolve.ts';
import type { MenuContext } from './menu.ts';
import { aiContextFor, runAfterActionHooks, runAutopilot, runPartyCounters, type PendingCounter } from './engineHooks.ts';
import { inventoryCounts } from './setup.ts';
import { aiScriptFor } from './ai/index.ts';
import { evaluateTriggers, signalFromEvents } from './triggers.ts';
import { abilityFor, performCommand, type ExecEnv, type Suspension } from './execute.ts';
import { actorOrder, battleOutcome, buildResult, emptyState } from './results.ts';
import {
  allTargetsGone,
  awaitsPlayerInput,
  canTakeTurn,
  clockHeldByMenu,
  DEFAULT_ATB_MODE,
  DEFAULT_WAIT_SPLIT,
  heldStillPending,
  ownsInput,
  withDefaultTimedInput,
  type AtbMode,
  type HeldCommand,
  type MenuLevel,
} from './active.ts';

export class Ffx2EngineCore {
  protected rng: BattleRng = makeFfx2Rng(0);
  protected options: Ffx2EngineOptions;
  protected abilities: AbilityRegistry;
  protected dresspheres: DressphereRegistry;
  protected grids: GarmentGridRegistry;
  protected battleState: BattleState;
  protected units: Ffx2Unit[] = [];
  protected gridNodes: Record<CombatantId, Array<string | null>> = {};
  protected drafts: EventDraft[] = [];
  protected elapsedMs = 0;
  protected awaitingMinigame: Command | null = null;
  /** Who raised it: the reels ask from `tick()`, when her gauge is already empty (`execute.ts` {@link suspendedActor}). */
  protected awaitingBy: Suspension | null = null;
  /**
   * Whose command menu is open right now. **Active ATB (`active.ts`).**
   *
   * Under Wait only one girl could be ready at the moment of input, so
   * `submit` could safely resolve its actor as `nextActor()`. Under Active she
   * is not alone: while Rikku's menu is open Yuna can fill her bar, and
   * `actorOrder` puts the lower slot first — Rikku's command would execute as
   * Yuna's, silently. This is the lock that stops it. It lives on the engine,
   * not in `BattleState`, so no save or event shape changes, and setting it is
   * idempotent so `nextDecision()` still never mutates for `'player-input'`.
   */
  protected inputOwner: CombatantId | null = null;
  /**
   * A command its owner confirmed while §1.7 chain-locked, waiting for the lock to lift (`active.ts`
   * {@link HeldCommand}; round 08 PR-0076). Never set at zero decision time, so every replay is untouched.
   */
  protected held: HeldCommand | null = null;
  /** The girl whose open menu an enemy hit closed (item 4 A1, `active.ts` {@link closesOpenMenu}); cleared by the next decision. */
  protected hitClosed: CombatantId | null = null;
  /** The counters the action in flight set off, played after it (`applied.ts`, `engineHooks.ts#runPartyCounters`; re-parity X2-D). */
  protected counterQueue: PendingCounter[] = [];
  /**
   * The fraction of a logic step real time has handed the engine but it has not run yet (`tick` converts milliseconds to
   * steps at 29.97 a second and keeps the remainder, so the clock never loses or invents time between calls).
   */
  protected stepCredit = 0;
  /**
   * Whole steps a `throughInput` call was handed but could not spend, because a ready enemy ended the loop so its events
   * could be played. The `'waiting'` path asks for exactly the steps it needs, so nothing is left over there; under Active an
   * enemy acting 10 ms into a 50 ms call would otherwise throw 40 ms of game time away. Carried to the next `throughInput` call.
   */
  protected carriedSteps = 0;
  /** The units in kernel-slot order, the order the game visits characters (cached; rebuilt when the unit list changes). */
  protected ordered: Ffx2Unit[] = [];
  /** The Config ATB speed; units a logic step takes off a gauge come from the game's table (`clock.ts`). */
  protected speed: AtbSpeed = 'normal';
  /** Config ATB mode (§1.5, `active.ts` {@link clockHeldByMenu}); Wait by default (D-029). */
  protected mode: AtbMode = DEFAULT_ATB_MODE;
  /** Wait's split (§1.5) and where the open menu's cursor is: `active.ts` {@link MenuLevel}. */
  protected split = DEFAULT_WAIT_SPLIT;
  protected level: MenuLevel = 'deep';

  constructor(options: Ffx2EngineOptions = {}) {
    this.options = options;
    this.speed = options.atbSpeed ?? 'normal';
    this.mode = options.atbMode ?? DEFAULT_ATB_MODE;
    this.split = options.waitSplit ?? DEFAULT_WAIT_SPLIT;
    this.abilities = chainRegistries(options.abilities, defaultAbilities);
    this.dresspheres = options.dresspheres ?? defaultDresspheres;
    this.grids = options.garmentGrids ?? defaultGarmentGrids;
    this.battleState = emptyState();
  }

  gaugeSnapshot(): AtbSnapshot {
    return buildSnapshot(actorOrder(this.units), this.elapsedMs);
  }

  /** The units in kernel-slot order. */
  protected slotOrder(): Ffx2Unit[] {
    if (this.ordered.length !== this.units.length) this.ordered = bySlot(this.units);
    return this.ordered;
  }

  /** Units a logic step takes off a gauge at the Config speed (70 / 95 / 120). */
  protected baseSpeed(): number {
    return baseSpeedOf(this.speed);
  }

  /**
   * One logic step (`logic-step.ts`): the chain windows, the ATB process, the casts coming due, the status clocks. A cast that comes
   * due fires here, as the unit that charged it; the engine decides every other command after the step.
   */
  protected runLogicStep(): void {
    this.battleState.ticks += 1;
    this.elapsedMs += stepsToMs(1);
    logicStep({
      step: this.battleState.ticks,
      units: this.units,
      ordered: this.slotOrder(),
      baseSpeed: this.baseSpeed(),
      emit: (e) => this.emit(e),
      resolveCtx: () => this.resolveCtx(),
      aiContext: (u) => this.aiContext(u),
      fire: (u) => this.fireChargedCommand(u),
      complete: (u) => completeCommand(u, u.gauge.costAtb, this.units, u.gauge.idleWait === true),
    });
  }

  /**
   * The unit whose turn it is, or `undefined` when nobody may act.
   *
   * `skipReadyPlayers` is Active ATB's sub-step policy (`active.ts`): the girl
   * whose menu is open, and anyone else standing ready for a command, are
   * queued for input rather than acting, so they must not block a ready enemy
   * that `actorOrder` sorts behind them — party goes before enemies by slot
   * (`results.ts`), so without this the pump would spin forever.
   *
   * The input owner comes first while she can still act, which is what makes
   * `submit` resolve to the girl whose menu was open rather than to whoever
   * `actorOrder` happens to put first by the time she presses Confirm.
   */
  protected nextActor(skipReadyPlayers = false): Ffx2Unit | undefined {
    const held = this.heldUnit();
    if (!skipReadyPlayers && this.inputOwner) {
      // `ownsInput`, not `canTakeTurn`: a chained owner keeps her menu
      // (PR-0080) — the next ready girl waits behind her in the ATB rows.
      const owner = this.units.find((u) => u.id === this.inputOwner);
      if (owner && ownsInput(owner)) return owner;
    }
    // The game serves its ready list lowest recovery counter first (`atb-engine.ts runAtbProcess`, `Ffx2Gauge.readyKey`): whoever became
    // ready first goes first, and of two that ran out in the same step the one that overshot further. `actorOrder` (party by slot, then
    // enemies by slot) only breaks a tie between units with no place in the list.
    let next: Ffx2Unit | undefined;
    for (const unit of actorOrder(this.units)) {
      if (!canTakeTurn(unit)) continue;
      // A held girl is not awaiting input — she has a command — so she is
      // never skipped: that is how it fires under somebody else's menu.
      if (skipReadyPlayers && unit !== held) {
        if (unit.id === this.inputOwner) continue;
        if (awaitsPlayerInput(unit, this.awaitingMinigame !== null)) continue;
      }
      if (next === undefined || unit.gauge.readyKey < next.gauge.readyKey) next = unit;
    }
    return next;
  }

  /** The held command's owner, dropping the command if she can no longer take it. */
  protected heldUnit(): Ffx2Unit | undefined {
    const held = this.held;
    if (!held) return undefined;
    const unit = this.units.find((u) => u.id === held.actorId);
    if (heldStillPending(unit)) return unit;
    this.held = null;
    return undefined;
  }

  /**
   * Fire a held command as its owner: the ordinary submit path, or nothing at
   * all when every target died while she waited — then she simply gets a fresh
   * menu and the turn is not spent (§4.4 (a) of the Active preflight).
   */
  protected fireHeld(actor: Ffx2Unit): void {
    const held = this.held;
    this.held = null;
    if (!held) return;
    const ability = abilityFor(this.env(), held.command);
    if (allTargetsGone(this.units, held.command, ability)) return;
    const command = withDefaultTimedInput(held.command, ability, this.rng, this.options.minigames !== false);
    const before = this.drafts.length;
    this.beginTurn(actor);
    performCommand(this.env(), actor, command, false, before);
  }

  protected resolveCtx(): ResolveContext {
    return {
      units: this.units,
      abilities: this.abilities,
      rng: this.rng,
      emit: (e) => this.emit(e),
      breaksDamageLimit: (unit) => unit.aiMemory?.['bdl'] === true, // cached at her last gate recompute
      ...(this.options.immuneHitsSkipChain !== undefined ? { immuneHitsSkipChain: this.options.immuneHitsSkipChain } : {}), // IC-1 switch (no longer read)
      ...(this.options.namedTargetsOnly !== undefined ? { namedTargetsOnly: this.options.namedTargetsOnly } : {}), // Acta switch
      onMenuClosed: (unit) => {
        if (this.inputOwner === unit.id) this.hitClosed = unit.id; // a Delay hit closed her open menu (`apply_atb_damage`)
      },
      counters: {
        pending: (target) => this.counterQueue.filter((c) => c.target === target).length,
        queue: (target, source, cause) => this.counterQueue.push({ target, source, cause }),
      },
      state: this.battleState, // a stolen item goes to `inventory:<id>`, stolen gil to `stolenGil` (`steal.ts`)
      ...(this.options.items ? { items: this.options.items } : {}),
      // The reaction entry of a script that defines one (AI-FFX2-b): once per result applied to an enemy. Absent scripts are untouched.
      onResult: (target, source, ability) => {
        if (target.side !== 'enemy') return;
        aiScriptFor(target.enemy?.aiScriptId).onResult?.(this.aiContext(target), source, ability);
        wakeIdle(target, this.units, WAKE_ON_RESULT); // a script waiting for a result is polled on the next step (RC3, ai/idle.ts)
      },
    };
  }

  /** Everything `execute.ts` needs, rebuilt per call so it never goes stale. */
  protected env(): ExecEnv {
    return {
      units: this.units,
      state: this.battleState,
      rng: this.rng,
      options: this.options,
      abilities: this.abilities,
      items: this.options.items,
      grids: this.grids,
      dresspheres: this.dresspheres,
      gridNodes: this.gridNodes,
      emit: (e) => this.emit(e),
      snapshot: () => this.gaugeSnapshot(),
      resolveCtx: () => this.resolveCtx(),
      draftCount: () => this.drafts.length,
      afterAction: (actor, startedAt) => this.afterAction(actor, startedAt),
      flushSignal: (startedAt, actor) => this.flushSignal(startedAt, actor),
      getAwaiting: () => this.awaitingMinigame,
      setAwaiting: (command, by) => {
        this.awaitingMinigame = command;
        this.awaitingBy = command ? (by ?? null) : null;
      },
    };
  }

  protected aiContext(self: Ffx2Unit): AiContext {
    return aiContextFor(self, this.units, this.rng, this.battleState, this.abilities, (e) => this.emit(e));
  }

  protected beginTurn(actor: Ffx2Unit): void {
    this.battleState.turn += 1;
    this.emit({
      type: 'turn-start',
      actorId: actor.id,
      turn: this.battleState.turn,
      elapsedTicks: Math.round(this.battleState.ticks),
    });
  }

  /** Everything `buildCommands` needs for one girl's menu. */
  protected menuContext(actor: Ffx2Unit): MenuContext {
    return {
      units: this.units,
      abilities: this.abilities,
      dresspheres: this.dresspheres,
      grid: this.grids.get(actor.dresspheres?.garmentGrid.id ?? ''),
      gridNodes: this.gridNodes[actor.id],
      canEscape: this.battleState.flags['canEscape'] === true,
      ...(this.options.items ? { items: this.options.items } : {}),
      inventory: inventoryCounts(this.battleState),
    };
  }

  /** One autopilot turn of a girl the player does not control: Berserk's Attack or Confusion's own pick (§2.8; `runAutopilot`). */
  protected runAutopilotTurn(actor: Ffx2Unit): void {
    const before = this.drafts.length;
    const confusion = { units: this.units, abilities: this.abilities, dresspheres: this.dresspheres, items: this.options.items, inventory: inventoryCounts(this.battleState), rng: this.rng };
    runAutopilot(actor, { menu: this.menuContext(actor), confusion, rng: this.rng, emit: (e) => this.emit(e), begin: () => this.beginTurn(actor), perform: (c) => performCommand(this.env(), actor, c, false, before) });
  }

  protected runAiTurn(actor: Ffx2Unit): void {
    const before = this.drafts.length;
    this.beginTurn(actor);
    const command = aiScriptFor(actor.enemy?.aiScriptId).decide(this.aiContext(actor));
    if (command) {
      performCommand(this.env(), actor, command, false, before);
      return;
    }
    // A poll that is not a turn (Tourist Trap: a dog pick, a sleeping dog; `pollIsNotATurn`) takes its count and its `turn-start` back (the draft sits at `before`; no draw was made for it) and plays no `action-end`.
    const notATurn = pollIsNotATurn(actor);
    if (notATurn) {
      this.battleState.turn -= 1;
      this.drafts.splice(before, 1);
    }
    // A flavour turn still consumes the ATB slot (`flavour-turn.ts`: the standard gauge, a voice line's speak command, or an idle wait).
    settleFlavourTurn(actor, this.units);
    if (!notATurn) this.emit({ type: 'action-end', actorId: actor.id });
    this.afterAction(actor, before);
  }

  /** Fire the command that was waiting on the purple charge bar. */
  protected fireChargedCommand(unit: Ffx2Unit): void {
    const charging = unit.atb.charging;
    if (!charging) return;
    const command = charging.commandRef;
    unit.atb.charging = null;
    unit.pendingCommand = null;
    performCommand(this.env(), unit, command, true);
  }

  /** Post-action bookkeeping: AI hooks (`runAfterActionHooks`), then story triggers and battle end. */
  protected afterAction(actor: Ffx2Unit, startedAt: number): void {
    const cls = this.battleState.flags['lastAttackClass'];
    const env = {
      units: this.units, abilities: this.abilities, attackClass: typeof cls === 'string' ? cls : 'none',
      aiContext: (u: Ffx2Unit) => this.aiContext(u), resolveCtx: () => this.resolveCtx(), emit: (e: EventDraft) => this.emit(e),
    };
    runAfterActionHooks(() => this.drafts.slice(startedAt), actor, env);
    // The counters this action set off (a Berserker's Counterattack, Magic Counter, Evade & Counter), played before the battle-end check.
    runPartyCounters(this.counterQueue, { ...env, mark: () => this.drafts.length, since: (from: number) => this.drafts.slice(from) });
    this.flushSignal(startedAt, actor);
  }

  protected flushSignal(startedAt: number, _actor: Ffx2Unit): void {
    const produced = this.drafts.slice(startedAt) as Array<{ type: string; [k: string]: unknown }>;
    // A unit fell or was raised: whoever waited for that (a Redoubt for its twin, the Head for the second Redoubt) is polled on the next step.
    if (produced.some((e) => e.type === 'ko' || e.type === 'revive')) for (const u of this.units) wakeIdle(u, this.units, WAKE_ON_ALIVE_CHANGE);
    evaluateTriggers(this.battleState, this.units, signalFromEvents(produced), (e) => this.emit(e));
    this.checkBattleEnd();
  }

  protected checkBattleEnd(): BattleResult | null {
    if (this.battleState.result) return this.battleState.result;
    const outcome = battleOutcome(this.units, this.battleState);
    if (!outcome) return null;

    const result = buildResult(this.units, this.battleState, outcome, this.elapsedMs);
    this.battleState.result = result;
    this.emit(outcome === 'victory' ? { type: 'victory', result } : { type: 'defeat', result });
    return result;
  }

  protected emit(draft: EventDraft): void {
    this.drafts.push(draft);
  }

  /** Stamp `seq`, append to the log, and hand the batch to the caller. */
  protected flush(): BattleEvent[] {
    const out: BattleEvent[] = [];
    for (const draft of this.drafts) {
      const event = { ...draft, seq: this.battleState.nextSeq++ } as BattleEvent;
      this.battleState.log.push(event);
      out.push(event);
    }
    this.drafts = [];
    return out;
  }
}
