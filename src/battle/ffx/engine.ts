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
import type { BattleRng, RngSnapshot } from '../common/streams.ts';
import { makeFfxRng } from './adapt/streams.ts';
import { FFXContentRegistry, getFFXRegistry } from './registry.ts';
import { type Ctx, type EventInput, canAct, isAlive, livingFriendlies, tryActor } from './state.ts';
import { buildBattle } from './setup.ts';
import { availableCommands } from './commands.ts';
import { commandRefused } from './formation-commands.ts';
import { revealForSensorAuto } from './sensor.ts';
import { chargeForAction, executeCommand } from './execute.ts';
import { forcedTurn } from './forced-turn.ts';
import { advance, nextActor, predictTurnOrder as predictOrder } from './turnQueue.ts';
import { onTurnStart } from './ticks.ts';
import { yojimboTurnStart } from './adapt/yojimbo.ts';
import { sistersTurnStart } from './adapt/sisters.ts';
import { resolveDuePartRevivals } from './hp.ts';
import { chooseAiCommand } from './ai/index.ts';
import { type EnemyIntent, predictNextEnemyIntent } from './intent.ts';
import { type DoublecastPick, doublecastPicks } from './doublecast.ts';
import { afterAction, checkEnd, finish, runItemReactions, type EndHooks } from './engine-end.ts';

export { apForLevel } from './results.ts';

/** {@link FFXEngine.transferable}'s shape: structured-cloneable, no content, no functions. */
export interface FFXEngineSnapshot {
  state: BattleState;
  rt: Ctx['rt'];
  /** Where every stream stands (`BattleRng.saveState`): FFX's 68 streams and the engine-side one. */
  rngState: RngSnapshot;
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
  private rng: BattleRng;
  private readonly options: FFXEngineOptions;
  private setup: BattleSetup | null = null;
  /** Events emitted since the current `submit` / `nextDecision` began. */
  private buffer: BattleEvent[] = [];
  /** True while a player actor's turn is open and its command has not arrived. */
  private awaitingInput = false;

  constructor(options: FFXEngineOptions = {}) {
    this.options = options;
    this.rng = makeFfxRng(0);
  }

  // -- BattleEngine ---------------------------------------------------------

  init(setup: BattleSetup): void {
    this.rng = makeFfxRng(setup.seed);
    this.setup = setup;
    this.buffer = [];
    this.awaitingInput = false;
    const content = (this.options.content ?? getFFXRegistry()).clone();
    // Events the build itself raises (a carried member below half HP gains the Critical status) wait for the context to exist [re-parity W5].
    let ready = false; const early: EventInput[] = [];
    const emit = (event: EventInput): void => (ready ? this.push(event) : void early.push(event));
    this.ctx = buildBattle(setup, this.rng, content, emit);
    ready = true; for (const event of early) this.push(event);
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

  /**
   * The Doublecast picker's rows for `actorId` (FFX only; the HUD's round-2 list, `ui/ffx/doublecastModel.ts`): every learned Black Magic spell with its price, and with `firstId` which are still
   * offered as the second pick. Read-only: it pays nothing and draws nothing. Not on the `FFXBattleEngine` interface for the reason `intent()` is not: one picker does not earn a contract change; the HUD is handed
   * a bound copy when it is built (`BattleScreenWiring.createHud`).
   */
  doublecastPicks(actorId: string, firstId?: string): DoublecastPick[] {
    const ctx = this.requireCtx();
    const actor = tryActor(ctx, actorId);
    return actor ? doublecastPicks(ctx, actor, firstId) : [];
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
    // A command the formation script switched off for this actor (`formation-commands.ts`, Isaaru's aeon contest) is refused with the turn kept open; the menu draws its row greyed.
    if (commandRefused(ctx, actor, command)) return [];

    this.awaitingInput = false;
    this.runTurn(actor, command);
    return this.buffer.slice();
  }

  /**
   * A private copy of this battle for the advisor's look-ahead (v4 prototype; the twin of
   * `FFX2Engine.fork`). One `structuredClone` of `ctx.state` (log copied shallowly) and `ctx.rt`, so
   * their aliasing survives; content shared read-only; its **own** generator seeded `seed`, so nothing it
   * does reaches this battle. `rngState` (tests) starts at this stream's position: the fidelity proof.
   */
  fork(seed: number, rngState?: RngSnapshot): FFXEngine {
    const ctx = this.requireCtx();
    const f = new FFXEngine(this.options);
    const { log, ...rest } = ctx.state;
    const b = structuredClone({ state: rest, rt: ctx.rt });
    f.rng = this.rng.fork(seed, rngState);
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
    f.rng = makeFfxRng(snap.state.seed);
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

    const elapsed = advance(ctx);
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
    onTurnStart(ctx, actor);
    // A death by the start-of-turn tick (a Zombie's Regen) queued its Auto-Phoenix in the death check; the game runs it before anyone acts.
    runItemReactions(this.hooks());

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
    // which calls `onTurnEnd` -> the end-of-turn tick. A sleeper therefore loses
    // its turns instead of leaving the battle [ffx-combat-core §1.1, §4.1]. (A Threatened
    // target does not lose a turn in the game: the pair is released at the start
    // of whichever end's turn comes first, `ticks.ts#onTurnStart`.)
    if (!canAct(actor)) {
      this.runTurn(actor, null);
      return;
    }

    // A Provoked, Berserk or Confused actor's turn is the game's forced attack (Provoke first, then Berserk, then Confuse): its script does not run and
    // no menu opens. A Provoked monster that keeps control of its script, and every other actor, goes on to its script or its menu
    // (re-parity RC4 lane FFX-G; `forced-turn.ts`).
    const forced = forcedTurn(ctx, actor);
    if (forced.kind === 'dropped') {
      this.runTurn(actor, null);
      return;
    }
    if (forced.kind === 'attack') {
      this.runTurn(actor, { kind: 'attack', targets: forced.targets });
      return;
    }

    // The player's Yojimbo and the Magus Sisters have turn-start rules of their own (re-parity lane FFX-K; inert unless a build owns them): his roll can make
    // the turn his own (a free attack), and a sister's menu builder draws before her menu opens.
    const own = yojimboTurnStart(ctx, actor);
    if (own !== null) {
      this.runTurn(actor, own.command);
      return;
    }
    sistersTurnStart(ctx, actor);

    if (actor.controller === 'ai') {
      this.runTurn(actor, chooseAiCommand(ctx, actor));
      return;
    }

    this.awaitingInput = true;
  }

  /** Execute one command and everything that hangs off it. */
  private runTurn(actor: FFXCombatant, command: Command | null): void {
    const ctx = this.requireCtx();
    const startIndex = ctx.state.log.length;

    if (command === null) {
      // A passed turn costs a rank-3 recovery, and that is the game's own number now (re-parity W2): the rank of the
      // action in progress (`Chr+0xde8`) is whatever the scheduler left there, and the scheduler resets it to 3 every
      // time a counter reaches 0 (VA 0x00790fb0), so an empty action charges the recovery of rank 3
      // (`research/re-ffx-ctb-status.md` section 14.4). It was an `[estimate]` before (round 04 PR-0025).
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
