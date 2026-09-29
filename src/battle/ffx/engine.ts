/**
 * `FFXBattleEngine` — the CTB engine facade.
 *
 * Playback protocol [docs/CONTRACTS.md]:
 * - `nextDecision()` **never mutates** for `'player-input'` or
 *   `'battle-over'`, so calling it twice in a row is safe. For `'resolved'` it
 *   advances and returns what it advanced past.
 * - Every `BattleEvent` carries a monotonic `seq`, and `state().log[i].seq === i`.
 * - Events are pure data: no functions, no class instances, JSON-serialisable.
 */

import type {
  BattleEvent, BattleResult, BattleSetup, BattleState, Command, Decision, FFXBattleEngine, FFXCombatant, TurnPreview,
} from '../common/types.ts';
import { SeededRng } from '../common/rng.ts';
import { FFXContentRegistry, getFFXRegistry } from './registry.ts';
import { type Ctx, type EventInput, canAct, has, isAlive, livingFriendlies, tryActor } from './state.ts';
import { buildBattle } from './setup.ts';
import { availableCommands } from './commands.ts';
import { revealForSensorAuto } from './sensor.ts';
import { chargeForAction, actsAutomatically, berserkCommand, confusedCommand, executeCommand } from './execute.ts';
import { nextActor, normalise, predictTurnOrder as predictOrder } from './turnQueue.ts';
import { onTurnStart } from './ticks.ts';
import { resolveDuePartRevivals } from './hp.ts';
import { chooseAiCommand } from './ai/index.ts';
import { type EnemyIntent, predictNextEnemyIntent } from './intent.ts';
import { afterAction, checkEnd, finish, type EndHooks } from './engine-end.ts';

export { apForLevel } from './results.ts';

/** {@link FFXEngine.transferable}'s shape: structured-cloneable, no content, no functions. */
export interface FFXEngineSnapshot {
  state: BattleState;
  rt: Ctx['rt'];
  rngState: number;
  setup: BattleSetup | null;
  awaitingInput: boolean;
}

/** Construction-time knobs. */
export interface FFXEngineOptions {
  /** Ability / item records. Defaults to the process-wide registry. */
  content?: FFXContentRegistry;
  /**
   * Roll minigame outcomes from the seeded RNG instead of emitting a
   * `minigame-request`. Auto-battle, e2e and unit tests set this so a chapter
   * can run to victory headlessly [docs/CONTRACTS.md].
   */
  autoResolveMinigames?: boolean;
}

export class FFXEngine implements FFXBattleEngine {
  private ctx: Ctx | null = null;
  private rng: SeededRng;
  private readonly options: FFXEngineOptions;
  private setup: BattleSetup | null = null;
  /** Events emitted since the current `submit` / `nextDecision` began. */
  private buffer: BattleEvent[] = [];
  /** True while a player actor's turn is open and its command has not arrived. */
  private awaitingInput = false;

  constructor(options: FFXEngineOptions = {}) {
    this.options = options;
    this.rng = new SeededRng(0);
  }

  // -- BattleEngine ---------------------------------------------------------

  init(setup: BattleSetup): void {
    this.rng = new SeededRng(setup.seed);
    this.setup = setup;
    this.buffer = [];
    this.awaitingInput = false;
    const content = (this.options.content ?? getFFXRegistry()).clone();
    const emit = (event: EventInput): void => this.push(event);
    this.ctx = buildBattle(setup, this.rng, content, emit);
  }

  setSeed(n: number): void {
    this.rng.seed(n);
    if (this.ctx) this.ctx.state.seed = n;
  }

  state(): Readonly<BattleState> {
    return this.requireCtx().state;
  }

  predictTurnOrder(n: number, previewCommand?: Command): TurnPreview[] {
    return predictOrder(this.requireCtx(), n, previewCommand);
  }

  /**
   * What the next enemy to act is about to do — for the HUD's intent slab.
   *
   * Read-only, like {@link predictTurnOrder} beside it: `intent.ts` dry-runs the
   * AI script on a **cloned** context, so counters, cycle steps and the charge
   * ladder are not advanced by being asked about. Deliberately not on the
   * `FFXBattleEngine` interface — that is one of the five contract files in
   * `docs/CONTRACTS.md` and one optional panel does not earn a shape change
   * there, so `src/ui/common/EnemyIntent.ts` probes for this method instead.
   */
  intent(): EnemyIntent | null {
    return this.ctx ? predictNextEnemyIntent(this.ctx) : null;
  }

  nextDecision(): Decision {
    const ctx = this.requireCtx();
    if (ctx.state.result) return { kind: 'battle-over', result: ctx.state.result };

    // Idempotent: a turn is already open and waiting for the player.
    if (this.awaitingInput && ctx.rt.currentActorId) {
      const actor = tryActor(ctx, ctx.rt.currentActorId);
      if (actor) {
        return { kind: 'player-input', actorId: actor.id, commands: availableCommands(ctx, actor) };
      }
    }

    this.buffer = [];
    this.advance();
    if (ctx.state.result) {
      return this.buffer.length > 0
        ? { kind: 'resolved', events: this.buffer.slice() }
        : { kind: 'battle-over', result: ctx.state.result };
    }
    return { kind: 'resolved', events: this.buffer.slice() };
  }

  submit(command: Command): BattleEvent[] {
    const ctx = this.requireCtx();
    this.buffer = [];
    const actorId = ctx.rt.currentActorId;
    const actor = actorId ? tryActor(ctx, actorId) : undefined;
    if (!actor || ctx.state.result) return [];

    this.awaitingInput = false;
    this.runTurn(actor, command);
    return this.buffer.slice();
  }

  /**
   * A private copy of this battle for the advisor's look-ahead (v4 prototype; the twin of
   * `FFX2Engine.fork`). One `structuredClone` of `ctx.state` (log copied shallowly) and `ctx.rt`, so
   * their aliasing survives; content shared read-only; its **own** `SeededRng(seed)`, so nothing it
   * does reaches this battle. `rngState` (tests) starts at this stream's position: the fidelity proof.
   */
  fork(seed: number, rngState?: number): FFXEngine {
    const ctx = this.requireCtx();
    const f = new FFXEngine(this.options);
    const { log, ...rest } = ctx.state;
    const b = structuredClone({ state: rest, rt: ctx.rt });
    f.rng = new SeededRng(seed);
    if (rngState !== undefined) f.rng.restoreState(rngState);
    f.setup = this.setup;
    f.awaitingInput = this.awaitingInput;
    f.buffer = [];
    f.ctx = {
      state: { ...(b.state as Omit<BattleState, 'log'>), log: log.slice() } as BattleState,
      rt: b.rt,
      rng: f.rng,
      content: ctx.content,
      emit: (event: EventInput): void => f.push(event),
    };
    return f;
  }

  /**
   * This battle as plain data, for advisor v4's Web Worker (FFX only): the state (log included:
   * two AI scripts read it by cursor), the runtime, the random stream's position, the setup.
   * **Live references**, for `postMessage` (which copies) and nothing else; never mutate them.
   * Content is not carried: the worker registers the same data tables (`registerBattleContent`).
   */
  transferable(): FFXEngineSnapshot {
    const ctx = this.requireCtx();
    return { state: ctx.state, rt: ctx.rt, rngState: this.rng.saveState(), setup: this.setup, awaitingInput: this.awaitingInput };
  }

  /**
   * An engine standing exactly where `snap`'s battle stood (it takes ownership of `snap`, which
   * must already be a copy), on the process-wide content. Advisor v4's worker only: a fresh
   * battle still starts with `init`.
   */
  static restore(snap: FFXEngineSnapshot, options: FFXEngineOptions = {}): FFXEngine {
    const f = new FFXEngine(options);
    f.rng = new SeededRng(snap.state.seed);
    f.rng.restoreState(snap.rngState);
    f.setup = snap.setup;
    f.awaitingInput = snap.awaitingInput;
    const content = (options.content ?? getFFXRegistry()).clone();
    f.ctx = { state: snap.state, rt: snap.rt, rng: f.rng, content, emit: (event: EventInput): void => f.push(event) };
    return f;
  }

  /** Hotfix 24 (FFX only): the player left an Overdrive picker; the turn goes back to the menu, and the next pick asks again. */
  backOutOfMinigame(): boolean {
    const rt = this.ctx?.rt;
    if (!rt?.pendingMinigame || !this.awaitingInput || rt.pendingMinigame.actorId !== rt.currentActorId) return false;
    rt.pendingMinigame = null;
    return true;
  }

  // -- internals ------------------------------------------------------------

  private requireCtx(): Ctx {
    if (!this.ctx) throw new Error('FFXEngine: init(setup) has not been called');
    return this.ctx;
  }

  private push(event: EventInput): void {
    const ctx = this.requireCtx();
    const full = { ...event, seq: ctx.state.nextSeq++ } as BattleEvent;
    ctx.state.log.push(full);
    this.buffer.push(full);
    if (full.type === 'wait') ctx.rt.elapsedMs += full.ms;
  }

  /** Open the next turn, and resolve it outright when nobody needs to choose. */
  private advance(): void {
    const ctx = this.requireCtx();
    if (this.checkEnd()) return;

    // Sensor is passive: it reveals what the party can see. Doing it here
    // rather than in `buildBattle` is deliberate — `init()` runs before the
    // first `nextDecision()` clears the buffer, so anything emitted during
    // setup would reach `state().log` and never reach the presenter
    // [ffx-combat-core §9].
    revealForSensorAuto(ctx);

    const elapsed = normalise(ctx);
    ctx.state.ticks += elapsed;
    // A Yu Pagoda that was destroyed comes back on a CTB-tick timer, not a
    // turn count, because a dead part takes no turns of its own
    // [ffx-bfa-yu-yevon §1.4]. Resolved here, after the clock moves and before
    // the next actor is chosen, so the restored part re-enters this very queue.
    resolveDuePartRevivals(ctx);
    const actor = nextActor(ctx);
    if (!actor) {
      // Nobody can act at all — treat as a loss rather than spinning.
      this.finish('defeat');
      return;
    }

    ctx.rt.currentActorId = actor.id;
    ctx.state.turn += 1;
    this.push({ type: 'turn-start', actorId: actor.id, turn: ctx.state.turn, elapsedTicks: elapsed });
    onTurnStart(ctx, actor, elapsed);

    // Doom may have killed the actor as its turn opened.
    if (!isAlive(actor)) {
      ctx.rt.currentActorId = null;
      this.afterAction(actor, []);
      return;
    }

    // The turn arrived, but a turn-denying status says the actor does nothing
    // with it. This is the *only* place Sleep's duration is paid: §4.1 ticks it
    // "at the end of the victim's own action", and `runTurn(actor, null)` is
    // the pass path — it charges the rank-3 recovery and runs `afterAction`,
    // which calls `onTurnEnd` -> `tickDurationStatuses`. Sleeping and
    // Threatened actors therefore lose turns instead of leaving the battle
    // [ffx-combat-core §1.1, §4.1, §4.2].
    if (!canAct(actor)) {
      this.runTurn(actor, null);
      return;
    }

    if (actsAutomatically(actor)) {
      const command = has(actor, 'confuse')
        ? confusedCommand(ctx, actor)
        : has(actor, 'berserk')
          ? berserkCommand(ctx, actor)
          : chooseAiCommand(ctx, actor);
      this.runTurn(actor, command);
      return;
    }

    if (has(actor, 'berserk')) {
      this.runTurn(actor, berserkCommand(ctx, actor));
      return;
    }

    this.awaitingInput = true;
  }

  /** Execute one command and everything that hangs off it. */
  private runTurn(actor: FFXCombatant, command: Command | null): void {
    const ctx = this.requireCtx();
    const startIndex = ctx.state.log.length;

    if (command === null) {
      // A deliberate pass still costs a rank-3 turn.
      //
      // **`3` is an `[estimate]`, not a sourced constant** (round 04 PR-0025).
      // Reason for the value: 3 is the engine's own default action rank — the
      // fallback `rankOf()` applies to any ability whose rank byte is 0
      // [ffx-combat-core §1.3] and the rank the CTB forecast assumes for every
      // actor [§1.6] — so a turn spent on nothing recovers exactly like the
      // ordinary Attack that would otherwise have filled it. No section of
      // `ffx-combat-core.md` states what a *skipped* turn costs; §1.1, §4.1 and
      // §4.2 give the queue-membership and the Sleep/Threaten clocks, not this
      // number. It is load-bearing — it sets how many ticks a 3-turn Sleep or a
      // Threaten locks a target out for, and therefore how strong they are as
      // tempo tools — so it is **an open question for Bailey**, logged in
      // `docs/handoff/builda1-engine-status.md`. Left at its shipped value here
      // deliberately: AGENTS.md hard rule 6 forbids inventing a replacement.
      //
      // FFX only: this is the CTB recovery ladder. FFX-2's ATB engine has its
      // own wait model and is untouched.
      chargeForAction(ctx, actor.id, 3);
      this.afterAction(actor, ctx.state.log.slice(startIndex));
      return;
    }

    const result = executeCommand(ctx, actor, command, this.options.autoResolveMinigames === true);

    if (result.awaitingMinigame) {
      // Stop here; the UI re-submits the same command with `extra` attached.
      this.awaitingInput = true;
      return;
    }

    if (result.rejected) {
      // The command was refused (a menu marker). The turn is not consumed, so
      // the same actor is asked again rather than losing a turn to a UI bug.
      this.awaitingInput = true;
      return;
    }

    if (result.handOffTo) {
      // Switch: the incoming member takes this very turn.
      ctx.rt.currentActorId = result.handOffTo;
      this.awaitingInput = true;
      return;
    }

    chargeForAction(ctx, actor.id, result.rank);
    this.afterAction(actor, ctx.state.log.slice(startIndex), command, result.damageDealt);
  }

  /** The facade's handles for the end-of-turn helpers (`./engine-end.ts`). */
  private hooks(): EndHooks {
    return { ctx: this.requireCtx(), push: (e) => this.push(e), buffer: this.buffer, nextGroupId: this.setup?.enemies.nextGroupId };
  }

  private afterAction(actor: FFXCombatant, actionEvents: readonly BattleEvent[], command?: Command, damageDealt = 0): void {
    afterAction(this.hooks(), actor, actionEvents, command, damageDealt);
  }

  private checkEnd(): boolean {
    return checkEnd(this.hooks());
  }

  private finish(outcome: BattleResult['outcome']): void {
    finish(this.hooks(), outcome);
  }
}

/** Convenience factory matching the other engines' shape. */
export function createFFXEngine(options?: FFXEngineOptions): FFXEngine {
  return new FFXEngine(options);
}

/** Living friendlies, exported for the debug API. */
export function survivors(ctx: Ctx): FFXCombatant[] {
  return livingFriendlies(ctx);
}
