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
import { ATB_SPEED_MULTIPLIER, type AtbSpeed } from './constants.ts';
import { defaultDresspheres } from './dresspheres.ts';
import { defaultGarmentGrids } from './garment-grids.ts';
import { advanceChainWindows, isActionLocked } from './chain.ts';
import {
  advanceGauge,
  beginRecovery,
  buildSnapshot,
  msToTicks,
  ticksToMs,
} from './gauges.ts';
import type { ResolveContext } from './resolve.ts';
import { buildCommands, type MenuContext } from './targeting.ts';
import { aiContextFor, berserkTurnCommand, payStatusClocks, runAfterActionHooks } from './engineHooks.ts';
import { buildState, inventoryCounts } from './setup.ts';
import { aiScriptFor } from './ai/index.ts';
import { type EnemyIntent, predictNextFFX2EnemyIntent } from './intent.ts';
import { evaluateTriggers, signalFromEvents } from './triggers.ts';
import { abilityFor, performCommand, type ExecEnv } from './execute.ts';
import { actorOrder, battleOutcome, buildResult, emptyState } from './results.ts';
import {
  allTargetsGone,
  awaitsPlayerInput,
  canTakeTurn,
  clockHeldByMenu,
  DEFAULT_ATB_MODE,
  DEFAULT_WAIT_SPLIT,
  heldStillPending,
  inputStillValid,
  nextEventTicks,
  ownsInput,
  soonestEventTicks,
  substepTicks,
  withDefaultTimedInput,
  type AtbMode,
  type HeldCommand,
  type MenuLevel,
  type TickOptions,
} from './active.ts';

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
  private inputOwner: CombatantId | null = null;
  /**
   * A command its owner confirmed while §1.7 chain-locked, waiting for the lock
   * to lift (`active.ts` {@link HeldCommand}; critic round 08 PR-0076). Never
   * set by a zero-decision-time run, so every replay is untouched.
   */
  private held: HeldCommand | null = null;
  /**
   * Ticks a `throughInput` step was handed but could not spend, because a ready
   * enemy ended the sub-step loop so its events could be played.
   *
   * In the `'waiting'` path this never mattered: the presenter asks for exactly
   * `nextEventMs`, so there is nothing left over. Under Active the pump hands
   * over whatever really elapsed, and an enemy acting 10 ms into a 50 ms step
   * would otherwise throw the other 40 ms away — game time lost, once per enemy
   * action, for as long as a menu is open. Carried and drained on the next
   * `throughInput` step instead. Untouched by Wait-mode ticks, so a run that
   * never opens a menu is bit-identical to before Active existed.
   */
  private carriedTicks = 0;
  /**
   * Game ticks per real tick, the Config ATB speed (§1.2, `constants.ts`).
   * Applied only where real ms cross in (`tick`) and out (`'waiting'`, elapsed
   * time), so the one global clock scales as one. Exactly `1` at Normal: the
   * identity, so Normal is bit-for-bit the old engine (golden test).
   */
  private atbRate = 1;
  private speed: AtbSpeed = 'normal';
  /** Config ATB mode (§1.5, `active.ts` {@link clockHeldByMenu}); Wait by default (D-029). */
  private mode: AtbMode = DEFAULT_ATB_MODE;
  /** Wait's split (§1.5) and where the open menu's cursor is: `active.ts` {@link MenuLevel}. */
  private split = DEFAULT_WAIT_SPLIT;
  private level: MenuLevel = 'deep';

  constructor(options: Ffx2EngineOptions = {}) {
    this.options = options;
    this.setAtbSpeed(options.atbSpeed ?? 'normal');
    this.setAtbMode(options.atbMode ?? DEFAULT_ATB_MODE);
    this.split = options.waitSplit ?? DEFAULT_WAIT_SPLIT;
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
    this.inputOwner = null;
    this.held = null;
    this.carriedTicks = 0;
    this.emit({ type: 'atb', snapshot: this.gaugeSnapshot() });
    this.flush();
  }

  /**
   * Change the Config ATB speed, mid-battle included (the pause menu's ATB
   * SPEED row; the clock is frozen while it is open). Takes effect from the
   * next `tick`. Survives `init`, so a chained chapter keeps it across links.
   */
  setAtbSpeed(speed: AtbSpeed): void {
    this.speed = speed;
    this.atbRate = ATB_SPEED_MULTIPLIER[speed];
  }

  atbSpeed(): AtbSpeed { return this.speed; }

  /** Change the Config ATB mode, mid-battle included (the pause X-2 BATTLE row). Survives `init`. */
  setAtbMode(mode: AtbMode): void { this.mode = mode; }

  atbMode(): AtbMode { return this.mode; }

  /** Wait's split on/off (option `waitSplit`, survives `init`), the HUD's menu level
   * (`HudPort.onMenuLevel`), and whether the clock is held now (`active.ts` {@link clockHeldByMenu}). */
  setWaitSplit(on: boolean): void { this.split = on; }
  waitSplit(): boolean { return this.split; }
  setMenuLevel(level: MenuLevel): void { this.level = level; }
  menuLevel(): MenuLevel { return this.level; }
  clockHeld(): boolean { return clockHeldByMenu(this.mode, this.inputOwner, this.level, this.split); }

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

  /**
   * What the next enemy to act is about to do — for the HUD's intent slab.
   *
   * Read-only: `intent.ts` dry-runs the AI script on a **cloned** board, so a
   * rotation's step counter, the Mega Flare countdown and the Vegnagun head's
   * fail clock are not advanced by being asked about. The ability registry is
   * not in the state, so it is handed over here along with the gauge snapshot,
   * which is what keeps this panel and the ATB bars naming the same next actor.
   *
   * Deliberately not on the `FFX2BattleEngine` interface — see the FFX twin.
   */
  intent(): EnemyIntent | null {
    return predictNextFFX2EnemyIntent({
      state: this.battleState,
      rng: this.rng,
      abilities: this.abilities,
      ...(this.options.items ? { items: this.options.items } : {}),
      snapshot: this.gaugeSnapshot(),
    });
  }

  nextDecision(): Decision {
    if (this.battleState.result) {
      this.inputOwner = null;
      return { kind: 'battle-over', result: this.battleState.result };
    }

    const finished = this.checkBattleEnd();
    if (finished) {
      this.inputOwner = null;
      return { kind: 'battle-over', result: finished };
    }

    const actor = this.nextActor();
    if (!actor || actor.controller !== 'player') this.inputOwner = null;
    if (actor && actor.controller === 'player') {
      // Berserk takes the turn away from the player: §2.8 "can only use the
      // basic Attack command; **player loses control**". It used to be offered
      // anyway, and on a dressphere with no Attack (§3.4-3.6) the menu opened
      // with zero rows and locked the battle [round 05 PR-0045]. A suspended
      // minigame still belongs to the player and keeps its path. FFX-2 only.
      if (actor.statuses.berserk && !this.awaitingMinigame) {
        this.inputOwner = null;
        this.runBerserkTurn(actor);
        return { kind: 'resolved', events: this.flush() };
      }
      // Her chain lock lifted with a command already chosen: it fires, as her.
      if (this.held?.actorId === actor.id) {
        this.fireHeld(actor);
        return { kind: 'resolved', events: this.flush() };
      }
      // Idempotent: the same girl, decision after decision, until she submits (a new owner is held until the HUD reports her top list).
      if (this.inputOwner !== actor.id) this.level = 'deep';
      this.inputOwner = actor.id;
      return {
        kind: 'player-input',
        actorId: actor.id,
        commands: buildCommands(actor, this.menuContext(actor)),
      };
    }

    if (actor) {
      this.runAiTurn(actor);
      return { kind: 'resolved', events: this.flush() };
    }

    // Real ms until the next event: game ticks over the Config rate (§1.2).
    const ms = ticksToMs(nextEventTicks(this.units)) / this.atbRate;
    return { kind: 'waiting', nextEventMs: Math.max(1, Math.round(ms)) };
  }

  submit(command: Command): BattleEvent[] {
    // **Active ATB, the silent critical (`active.ts`).** A command belongs to
    // the girl whose menu was open and to nobody else. The clock runs while she
    // reads that menu, so by the time Confirm arrives she may have been KO'd,
    // Stopped, Slept, Petrified, chained or Berserked — and `nextActor()` below
    // only *prefers* the owner: a dead one falls through to whoever else is
    // ready. Measured before this guard (wave-1a verifier, ch. 4 seed 7): Paine
    // confirms `x2-warrior-power-break` in the same pump step Bahamut KOs her,
    // and the log reads `rikku:Power Break` — Rikku is not a Warrior, has no such
    // ability, and her turn is spent on it, silently.
    //
    // Refuse instead. The turn is not spent, no events are emitted, and the
    // next `nextDecision()` re-offers the menu to somebody who can answer it.
    // Unreachable under Wait (nothing resolved while a menu was open), so this
    // is **FFX-2 only** — FFX is CTB and has no clock
    // (`research/ffx-vs-ffx2-presentation.md` §4.3).
    if (this.inputOwner && !this.inputValid(this.inputOwner)) {
      this.inputOwner = null;
      return this.flush();
    }
    const actor = this.nextActor();
    if (!actor) {
      this.inputOwner = null;
      return this.flush();
    }
    // Active ATB, `active.ts`: everything this command aimed at died while the
    // menu was open. Refuse and reopen — the turn is not spent (preflight
    // §4.4 (a)). Under Wait this branch was unreachable.
    if (actor.controller === 'player' && allTargetsGone(this.units, command, abilityFor(this.env(), command))) {
      return this.flush();
    }
    this.inputOwner = null;
    // PR-0076: chained (§1.7) as she answered — hold it; it fires as her when
    // the window closes. Unreachable at zero decision time.
    if (actor.controller === 'player' && !this.awaitingMinigame && isActionLocked(actor)) {
      this.held = { actorId: actor.id, command };
      return this.flush();
    }
    const before = this.drafts.length;
    if (actor.controller === 'player' && !this.awaitingMinigame) this.beginTurn(actor);
    performCommand(this.env(), actor, command, false, before);
    return this.flush();
  }

  /** The command a chain-locked girl confirmed and is waiting to fire, if any. */
  heldCommand(): HeldCommand | null {
    return this.held ? { ...this.held } : null;
  }

  /**
   * Is the command menu open for `actorId` still answerable? **FFX-2 only.** The presenter
   * polls this once per pump step while a menu is up; see `active.ts` {@link inputStillValid}.
   */
  inputValid(actorId: CombatantId): boolean {
    return inputStillValid(this.units, actorId, Boolean(this.battleState.result), this.awaitingMinigame !== null);
  }

  /**
   * Advance the real-time clock by `ms` and return everything that resolved.
   *
   * Sub-steps to the next scheduled event rather than applying `ms` in one go,
   * so a status expiry, a chain break and a gauge filling inside the same step
   * land in the right order. Returns as soon as something needs handling —
   * otherwise the clock would run past a player's input.
   *
   * **Active ATB (FFX-2 only, `active.ts`).** With `opts.throughInput` a girl
   * standing ready for a command no longer stops the clock: she is queued for
   * input, and gauges, statuses, chain windows and enemy turns carry on around
   * her. A ready *enemy* still ends the step so its events can be played, which
   * is also what gives us §1.5's "Automatic Wait" for free — the presenter's
   * pump is not running while an animation plays, so nothing ticks then.
   */
  tick(ms: number, opts?: TickOptions): BattleEvent[] {
    if (this.battleState.result) return this.flush();
    // Wait (D-029, `active.ts`): an open menu holds the clock; with the split, below its top list only.
    if (this.clockHeld()) return this.flush();
    const throughInput = opts?.throughInput === true;
    // Real ms become game ticks at the Config ATB speed (§1.2 `tickRate`).
    let remaining = msToTicks(Math.max(0, ms)) * this.atbRate;
    if (throughInput) {
      remaining += this.carriedTicks;
      this.carriedTicks = 0;
    }
    let guard = 0;

    while (remaining > 0.0001 && guard++ < TICK_SUBSTEP_LIMIT) {
      const step = throughInput
        ? substepTicks(remaining, soonestEventTicks(this.units))
        : Math.min(remaining, Math.max(1, nextEventTicks(this.units)));
      remaining -= step;
      this.elapsedMs += ticksToMs(step) / this.atbRate;
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

      const actor = this.nextActor(throughInput);
      if (actor && actor.controller === 'player') {
        // A held command whose lock just lifted fires here, under whatever
        // menu is open (PR-0076). Otherwise, under `throughInput`, the only
        // player `nextActor` hands back is a Berserked one (§2.8): resolve her.
        if (this.held?.actorId === actor.id) this.fireHeld(actor);
        else if (throughInput) this.runBerserkTurn(actor);
        break;
      }
      if (actor) {
        this.runAiTurn(actor);
        break;
      }
    }

    // Whatever an early break left unspent is owed to the next Active step.
    if (throughInput) this.carriedTicks = remaining > 0.0001 ? remaining : 0;

    return this.flush();
  }

  // -- internals ------------------------------------------------------------

  /** Regen and Poison payouts plus status expiries, for one sub-step. */
  private advanceStatusClocks(step: number): void {
    payStatusClocks(this.units, step, (e) => this.emit(e), this.resolveCtx(), (u) => this.aiContext(u));
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
  private nextActor(skipReadyPlayers = false): Ffx2Unit | undefined {
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
  private heldUnit(): Ffx2Unit | undefined {
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
  private fireHeld(actor: Ffx2Unit): void {
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
    return aiContextFor(self, this.units, this.rng, this.battleState, this.abilities, (e) => this.emit(e));
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

  /** Everything `buildCommands` needs for one girl's menu. */
  private menuContext(actor: Ffx2Unit): MenuContext {
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
  private runBerserkTurn(actor: Ffx2Unit): void {
    const before = this.drafts.length;
    this.beginTurn(actor);
    const command = berserkTurnCommand(actor, this.menuContext(actor), this.rng, (e) => this.emit(e));
    performCommand(this.env(), actor, command, false, before);
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

  /** Post-action bookkeeping: AI hooks (`runAfterActionHooks`), then story triggers and battle end. */
  private afterAction(actor: Ffx2Unit, startedAt: number): void {
    const cls = this.battleState.flags['lastAttackClass'];
    runAfterActionHooks(() => this.drafts.slice(startedAt), actor, {
      units: this.units, abilities: this.abilities, attackClass: typeof cls === 'string' ? cls : 'none',
      aiContext: (u) => this.aiContext(u), resolveCtx: () => this.resolveCtx(), emit: (e) => this.emit(e),
    });
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
