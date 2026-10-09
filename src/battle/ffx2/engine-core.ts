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
import { ATB_SPEED_MULTIPLIER, MENU_CANCEL_ONLY_DELAY_ABILITIES, STATUS_CLOCKS_HELD_AT, type AtbSpeed } from './constants.ts';
import { ActingAbilities } from './menu-cancel.ts';
import { defaultDresspheres } from './dresspheres.ts';
import { defaultGarmentGrids } from './garment-grids.ts';
import { beginRecovery, buildSnapshot } from './gauges.ts';
import type { ResolveContext } from './resolve.ts';
import type { MenuContext } from './targeting.ts';
import { aiContextFor, berserkTurnCommand, payStatusClocks, runAfterActionHooks } from './engineHooks.ts';
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
  closesOpenMenu,
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
  protected rng = new SeededRng(0);
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
  /** What each unit is resolving, for the menu-cancel correction (`menu-cancel.ts`, ON since 2026-09-26). */
  protected readonly acting = new ActingAbilities();
  /**
   * Ticks a `throughInput` step was handed but could not spend, because a ready
   * enemy ended the sub-step loop so its events could be played. The `'waiting'`
   * path asks for exactly `nextEventMs`, so nothing is left over there; under
   * Active an enemy acting 10 ms into a 50 ms step would otherwise throw 40 ms of
   * game time away. Carried to the next `throughInput` step; untouched by
   * Wait-mode ticks, so a run that never opens a menu is bit-identical.
   */
  protected carriedTicks = 0;
  /**
   * Game ticks per real tick, the Config ATB speed (§1.2, `constants.ts`).
   * Applied only where real ms cross in (`tick`) and out (`'waiting'`, elapsed
   * time), so the one global clock scales as one. Exactly `1` at Normal: the
   * identity, so Normal is bit-for-bit the old engine (golden test).
   */
  protected atbRate = 1;
  protected speed: AtbSpeed = 'normal';
  /** Config ATB mode (§1.5, `active.ts` {@link clockHeldByMenu}); Wait by default (D-029). */
  protected mode: AtbMode = DEFAULT_ATB_MODE;
  /** Wait's split (§1.5) and where the open menu's cursor is: `active.ts` {@link MenuLevel}. */
  protected split = DEFAULT_WAIT_SPLIT;
  protected level: MenuLevel = 'deep';

  constructor(options: Ffx2EngineOptions = {}) {
    this.options = options;
    this.speed = options.atbSpeed ?? 'normal';
    this.atbRate = ATB_SPEED_MULTIPLIER[this.speed];
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

  /** Regen and Poison payouts plus status expiries, for one sub-step. */
  protected advanceStatusClocks(step: number): void {
    payStatusClocks(this.units, step, (e) => this.emit(e), this.resolveCtx(), (u) => this.aiContext(u), this.heldClocks());
  }

  /** Status clocks the Config ATB speed holds (`constants.ts` STATUS_CLOCKS_HELD_AT; PR-0108, Sleep at Fast). */
  protected heldClocks(): ReadonlySet<string> | undefined {
    const held = STATUS_CLOCKS_HELD_AT[this.speed];
    return held.size > 0 ? held : undefined;
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
    for (const unit of actorOrder(this.units)) {
      if (!canTakeTurn(unit)) continue;
      // A held girl is not awaiting input — she has a command — so she is
      // never skipped: that is how it fires under somebody else's menu.
      if (skipReadyPlayers && unit !== held) {
        if (unit.id === this.inputOwner) continue;
        if (awaitsPlayerInput(unit, this.awaitingMinigame !== null)) continue;
      }
      return unit;
    }
    return undefined;
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
      timedAilmentDefaults: this.battleState.flags['timedAilmentDefaults'] === true, // `setup.ts`, from the group
      ...(this.options.immuneHitsSkipChain !== undefined ? { immuneHitsSkipChain: this.options.immuneHitsSkipChain } : {}), // IC-1 switch (no longer read)
      ...(this.options.namedTargetsOnly !== undefined ? { namedTargetsOnly: this.options.namedTargetsOnly } : {}), // Acta switch
      state: this.battleState, // a stolen item goes to `inventory:<id>`, stolen gil to `stolenGil` (`steal.ts`)
      ...(this.options.items ? { items: this.options.items } : {}),
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

  /** One Berserked party turn, resolved without the player (§2.8; `berserkTurnCommand`). */
  protected runBerserkTurn(actor: Ffx2Unit): void {
    const before = this.drafts.length;
    this.beginTurn(actor);
    const command = berserkTurnCommand(actor, this.menuContext(actor), this.rng, (e) => this.emit(e));
    performCommand(this.env(), actor, command, false, before);
  }

  protected runAiTurn(actor: Ffx2Unit): void {
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
    runAfterActionHooks(() => this.drafts.slice(startedAt), actor, {
      units: this.units, abilities: this.abilities, attackClass: typeof cls === 'string' ? cls : 'none',
      aiContext: (u) => this.aiContext(u), resolveCtx: () => this.resolveCtx(), emit: (e) => this.emit(e),
    });
    this.flushSignal(startedAt, actor);
  }

  protected flushSignal(startedAt: number, _actor: Ffx2Unit): void {
    const produced = this.drafts.slice(startedAt) as Array<{ type: string; [k: string]: unknown }>;
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
    this.acting.note(draft);
    const onlyDelay = this.options.menuCancelOnlyDelayAbilities ?? MENU_CANCEL_ONLY_DELAY_ABILITIES;
    const by = onlyDelay && draft.type === 'damage' ? { ability: this.abilities.get(this.acting.current(draft.sourceId) ?? '') } : undefined;
    if (this.inputOwner && closesOpenMenu(draft, this.inputOwner, this.units, by)) this.hitClosed = this.inputOwner;
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
