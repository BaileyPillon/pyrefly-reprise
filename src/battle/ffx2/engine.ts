/**
 * `FFX2Engine` — the FFX-2 ATB battle engine.
 *
 * Pure TypeScript: no DOM, no Three.js, no `Math.random()`. It answers one
 * question — *what happens next?* — and the presenter is the only thing that
 * knows about wall-clock time (`docs/CONTRACTS.md`, "The playback protocol").
 *
 * ```
 * engine.init(setup);
 * for (;;) {
 *   const d = engine.nextDecision();
 *   if (d.kind === 'battle-over') break;
 *   if (d.kind === 'resolved')     { await play(d.events); continue; }
 *   if (d.kind === 'waiting')      { await play(engine.tick(d.nextEventMs)); continue; }
 *   await play(engine.submit(await ui.chooseCommand(d.actorId, d.commands)));
 * }
 * ```
 *
 * Contract rules this file is responsible for:
 * - `nextDecision()` **never mutates** for `'player-input'` or `'battle-over'`;
 *   calling it twice is safe. It *does* advance for `'resolved'`.
 * - every event carries a monotonic `seq`, and `state().log[i].seq === i`.
 * - events are pure JSON data — no functions, no class instances.
 * - the engine never advances a chained encounter itself: `victory` carries
 *   `nextGroupId` and the BattleScreen re-inits (CONTRACT-CHANGES §6).
 *
 * Command execution lives in `execute.ts` and the win/lose rules in
 * `results.ts`; this file owns the clock, the decision loop and the event log.
 */

import type {
  AtbSnapshot,
  BattleEngine,
  BattleEvent,
  BattleResult,
  BattleSetup,
  BattleState,
  CombatantId,
  Command,
  Decision,
  FFX2BattleEngine,
} from '../common/types.ts';
import { SeededRng } from '../common/rng.ts';
import type {
  AbilityRegistry,
  AiContext,
  DressphereRegistry,
  EventDraft,
  Ffx2EngineOptions,
  Ffx2Unit,
  GarmentGridRegistry,
} from './internal.ts';
import { chainRegistries, defaultAbilities } from './abilities.ts';
import { defaultDresspheres } from './dresspheres.ts';
import { defaultGarmentGrids } from './garment-grids.ts';
import { advanceChainWindows, isActionLocked, ticksUntilChainBreak } from './chain.ts';
import {
  advanceGauge,
  beginRecovery,
  buildSnapshot,
  isReady,
  msToTicks,
  ticksToMs,
  ticksUntilNextEvent,
} from './gauges.ts';
import { advanceStatuses, canAct, ticksUntilStatusEvent } from './statuses.ts';
import { applyHpDelta, heal, type ResolveContext } from './resolve.ts';
import { buildCommands } from './targeting.ts';
import { buildState } from './setup.ts';
import { aiScriptFor } from './ai/index.ts';
import { evaluateTriggers, signalFromEvents } from './triggers.ts';
import { performCommand, type ExecEnv } from './execute.ts';
import { actorOrder, battleOutcome, buildResult, emptyState } from './results.ts';

/** Sub-steps per `tick()` call. A generous bound, never a normal exit path. */
const TICK_SUBSTEP_LIMIT = 512;

export class FFX2Engine implements FFX2BattleEngine, BattleEngine {
  private rng = new SeededRng(0);
  private options: Ffx2EngineOptions;
  private abilities: AbilityRegistry;
  private dresspheres: DressphereRegistry;
  private grids: GarmentGridRegistry;
  private battleState: BattleState;
  private units: Ffx2Unit[] = [];
  private gridNodes: Record<CombatantId, Array<string | null>> = {};
  private drafts: EventDraft[] = [];
  private elapsedMs = 0;
  private awaitingMinigame: Command | null = null;

  constructor(options: Ffx2EngineOptions = {}) {
    this.options = options;
    this.abilities = chainRegistries(options.abilities, defaultAbilities);
    this.dresspheres = options.dresspheres ?? defaultDresspheres;
    this.grids = options.garmentGrids ?? defaultGarmentGrids;
    this.battleState = emptyState();
  }

  // -- BattleEngine ---------------------------------------------------------

  init(setup: BattleSetup): void {
    this.rng = new SeededRng(setup.seed);
    const built = buildState(setup, this.options, this.rng);
    this.battleState = built.state;
    this.units = built.units;
    this.gridNodes = built.gridNodes;
    this.drafts = [];
    this.elapsedMs = this.options.carriedParty?.elapsedMs ?? 0;
    this.awaitingMinigame = null;
    this.emit({ type: 'atb', snapshot: this.gaugeSnapshot() });
    this.flush();
  }

  setSeed(n: number): void {
    this.rng.seed(n);
    this.battleState.seed = n;
  }

  state(): Readonly<BattleState> {
    return this.battleState;
  }

  gaugeSnapshot(): AtbSnapshot {
    return buildSnapshot(actorOrder(this.units), this.elapsedMs);
  }

  nextDecision(): Decision {
    if (this.battleState.result) return { kind: 'battle-over', result: this.battleState.result };

    const finished = this.checkBattleEnd();
    if (finished) return { kind: 'battle-over', result: finished };

    const actor = this.nextActor();
    if (actor && actor.controller === 'player') {
      return {
        kind: 'player-input',
        actorId: actor.id,
        commands: buildCommands(actor, {
          units: this.units,
          abilities: this.abilities,
          dresspheres: this.dresspheres,
          grid: this.grids.get(actor.dresspheres?.garmentGrid.id ?? ''),
          gridNodes: this.gridNodes[actor.id],
          canEscape: this.battleState.flags['canEscape'] === true,
        }),
      };
    }

    if (actor) {
      this.runAiTurn(actor);
      return { kind: 'resolved', events: this.flush() };
    }

    return { kind: 'waiting', nextEventMs: Math.max(1, Math.round(ticksToMs(this.nextEventTicks()))) };
  }

  submit(command: Command): BattleEvent[] {
    const actor = this.nextActor();
    if (!actor) return this.flush();
    const before = this.drafts.length;
    if (actor.controller === 'player' && !this.awaitingMinigame) this.beginTurn(actor);
    performCommand(this.env(), actor, command, false, before);
    return this.flush();
  }

  /**
   * Advance the real-time clock by `ms` and return everything that resolved.
   *
   * Sub-steps to the next scheduled event rather than applying `ms` in one go,
   * so a status expiry, a chain break and a gauge filling inside the same step
   * land in the right order. Returns as soon as something needs handling —
   * otherwise the clock would run past a player's input.
   */
  tick(ms: number): BattleEvent[] {
    if (this.battleState.result) return this.flush();
    let remaining = msToTicks(Math.max(0, ms));
    let guard = 0;

    while (remaining > 0.0001 && guard++ < TICK_SUBSTEP_LIMIT) {
      const step = Math.min(remaining, Math.max(1, this.nextEventTicks()));
      remaining -= step;
      this.elapsedMs += ticksToMs(step);
      this.battleState.ticks += step;

      advanceChainWindows(this.units, step, (e) => this.emit(e));
      this.advanceStatusClocks(step);

      let readyChanged = false;
      for (const unit of actorOrder(this.units)) {
        const outcome = advanceGauge(unit, step);
        if (outcome === 'charge-complete') {
          this.fireChargedCommand(unit);
          readyChanged = true;
        } else if (outcome === 'ready') {
          readyChanged = true;
        }
      }

      if (readyChanged) this.emit({ type: 'atb', snapshot: this.gaugeSnapshot() });
      if (this.checkBattleEnd()) break;

      const actor = this.nextActor();
      if (actor && actor.controller === 'player') break;
      if (actor) {
        this.runAiTurn(actor);
        break;
      }
    }

    return this.flush();
  }

  // -- internals ------------------------------------------------------------

  /** Regen and Poison payouts plus status expiries, for one sub-step. */
  private advanceStatusClocks(step: number): void {
    for (const unit of this.units) {
      if (!unit.alive) continue;
      const delta = advanceStatuses(unit, step, (e) => this.emit(e));
      if (delta > 0) {
        this.emit({
          type: 'damage',
          targetId: unit.id,
          amount: delta,
          element: 'none',
          crit: false,
          hitIndex: 0,
          hitCount: 1,
        });
        applyHpDelta(this.resolveCtx(), unit, delta);
      } else if (delta < 0) {
        heal(this.resolveCtx(), unit, -delta, 'regen');
      }
    }
  }

  /** The unit whose turn it is, or `undefined` when nobody may act. */
  private nextActor(): Ffx2Unit | undefined {
    for (const unit of actorOrder(this.units)) {
      if (!isReady(unit) || !canAct(unit)) continue;
      // A chained target cannot start its own action. §1.7
      if (isActionLocked(unit)) continue;
      if (unit.side === 'enemy' && (unit.thinkingTicks ?? 0) > 0) continue;
      return unit;
    }
    return undefined;
  }

  /** Ticks until the soonest scheduled state change anywhere on the field. */
  private nextEventTicks(): number {
    let soonest = ticksUntilChainBreak(this.units);
    for (const unit of this.units) {
      if (!unit.alive && unit.side === 'party') continue;
      if (isReady(unit)) continue;
      soonest = Math.min(soonest, ticksUntilNextEvent(unit), ticksUntilStatusEvent(unit));
    }
    if (!Number.isFinite(soonest) || soonest <= 0) return 1;
    return soonest;
  }

  private resolveCtx(): ResolveContext {
    return {
      units: this.units,
      abilities: this.abilities,
      rng: this.rng,
      emit: (e) => this.emit(e),
      // Break Damage Limit from an accessory or a Garment Grid gate, cached on
      // the girl when her gate bonuses were last recomputed.
      breaksDamageLimit: (unit) => unit.aiMemory?.['bdl'] === true,
    };
  }

  /** Everything `execute.ts` needs, rebuilt per call so it never goes stale. */
  private env(): ExecEnv {
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
      setAwaiting: (command) => {
        this.awaitingMinigame = command;
      },
    };
  }

  private aiContext(self: Ffx2Unit): AiContext {
    return {
      self,
      units: this.units,
      rng: this.rng,
      flags: this.battleState.flags,
      ticks: this.battleState.ticks,
      ability: (id) => this.abilities.get(id),
      party: () => this.units.filter((u) => u.side === 'party' && u.alive && !u.removed),
      allies: () =>
        this.units.filter((u) => u.side === 'enemy' && u.alive && !u.removed && u.id !== self.id),
      emit: (e) => this.emit(e),
    };
  }

  private beginTurn(actor: Ffx2Unit): void {
    this.battleState.turn += 1;
    this.emit({
      type: 'turn-start',
      actorId: actor.id,
      turn: this.battleState.turn,
      elapsedTicks: Math.round(this.battleState.ticks),
    });
  }

  private runAiTurn(actor: Ffx2Unit): void {
    const before = this.drafts.length;
    this.beginTurn(actor);
    const command = aiScriptFor(actor.enemy?.aiScriptId).decide(this.aiContext(actor));
    if (command) {
      performCommand(this.env(), actor, command, false, before);
      return;
    }
    // A flavour turn still consumes the ATB slot. [ffx2-vegnagun-shuyin §5]
    beginRecovery(actor, 0);
    this.emit({ type: 'action-end', actorId: actor.id });
    this.afterAction(actor, before);
  }

  /** Fire the command that was waiting on the purple charge bar. */
  private fireChargedCommand(unit: Ffx2Unit): void {
    const charging = unit.atb.charging;
    if (!charging) return;
    const command = charging.commandRef;
    unit.atb.charging = null;
    unit.pendingCommand = null;
    performCommand(this.env(), unit, command, true);
  }

  /** Post-action bookkeeping: AI hooks, then story triggers and battle end. */
  private afterAction(actor: Ffx2Unit, startedAt: number): void {
    for (const unit of this.units) {
      if (unit.side !== 'enemy') continue;
      aiScriptFor(unit.enemy?.aiScriptId).onTurnResolved?.(this.aiContext(unit), actor);
    }
    this.flushSignal(startedAt, actor);
  }

  private flushSignal(startedAt: number, _actor: Ffx2Unit): void {
    const produced = this.drafts.slice(startedAt) as Array<{ type: string; [k: string]: unknown }>;
    evaluateTriggers(this.battleState, this.units, signalFromEvents(produced), (e) => this.emit(e));
    this.checkBattleEnd();
  }

  private checkBattleEnd(): BattleResult | null {
    if (this.battleState.result) return this.battleState.result;
    const outcome = battleOutcome(this.units, this.battleState);
    if (!outcome) return null;

    const result = buildResult(this.units, this.battleState, outcome, this.elapsedMs);
    this.battleState.result = result;
    this.emit(outcome === 'victory' ? { type: 'victory', result } : { type: 'defeat', result });
    return result;
  }

  private emit(draft: EventDraft): void {
    this.drafts.push(draft);
  }

  /** Stamp `seq`, append to the log, and hand the batch to the caller. */
  private flush(): BattleEvent[] {
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

/** Convenience factory mirroring `makeRng`. */
export function makeFFX2Engine(options: Ffx2EngineOptions = {}): FFX2Engine {
  return new FFX2Engine(options);
}
