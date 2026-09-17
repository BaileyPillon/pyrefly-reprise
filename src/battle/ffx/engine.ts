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
  BattleEvent,
  BattleResult,
  BattleSetup,
  BattleState,
  Command,
  CombatantId,
  Decision,
  FFXBattleEngine,
  FFXCombatant,
  TurnPreview,
} from '../common/types.ts';
import { SeededRng } from '../common/rng.ts';
import { FFXContentRegistry, getFFXRegistry } from './registry.ts';
import {
  type Ctx,
  type EventInput,
  commandAbility,
  has,
  isAlive,
  livingFriendlies,
  rtOf,
  tryActor,
} from './state.ts';
import { buildBattle } from './setup.ts';
import { availableCommands } from './commands.ts';
import { chargeForAction, actsAutomatically, berserkCommand, confusedCommand, executeCommand } from './execute.ts';
import { nextActor, normalise, predictTurnOrder as predictOrder } from './turnQueue.ts';
import { collectReactions, onTurnEnd, onTurnStart } from './ticks.ts';
import { collectSignals, evaluateTriggers } from './triggers.ts';
import { chooseAiCommand } from './ai/index.ts';
import { collectBossCounters, runMortibsorptionIfDown } from './ai/reactions.ts';
import { dismissAeon } from './aeons.ts';
import { buildBattleResult } from './results.ts';
export { apForLevel } from './results.ts';

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

    const elapsed = normalise(ctx);
    ctx.state.ticks += elapsed;
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

  /** Reactions, counters, ticks, triggers and the end check. */
  private afterAction(
    actor: FFXCombatant,
    actionEvents: readonly BattleEvent[],
    command?: Command,
    damageDealt = 0,
  ): void {
    const ctx = this.requireCtx();
    void damageDealt;

    // Enemies this action actually resolved against.
    const damaged = new Set<CombatantId>();
    // Enemies this action pushed into a new form. The killing blow of a form is
    // never countered: in the decompile, `onHit` runs the transformation block
    // *instead of* the counter switch [ffx-yunalesca §2.4, offset 0600]. By the
    // time counters are collected `advanceForm` has already revived the boss in
    // its next form, so without this the blow would draw that form's counter.
    const transformed = new Set<CombatantId>();
    for (const e of actionEvents) {
      if (e.type === 'damage' && e.sourceId === actor.id && e.amount > 0) damaged.add(e.targetId);
      if (e.type === 'mp-damage' && e.sourceId === actor.id) damaged.add(e.targetId);
      if (e.type === 'form-change') transformed.add(e.enemyId);
    }
    const counterable = [...damaged].filter((id) => !transformed.has(id));

    // The Mortiorchis never dies; it drains Seymour and comes back smaller.
    runMortibsorptionIfDown(ctx);

    // Boss counters fire from the hit hook and cost no turn.
    if (command) {
      const def = commandAbility(ctx, command);
      if (def) {
        for (const counter of collectBossCounters(ctx, actor, def, counterable)) {
          const counterActor = tryActor(ctx, counter.actorId);
          if (!counterActor || !isAlive(counterActor)) continue;
          this.push({
            type: 'counter',
            actorId: counter.actorId,
            targetId: actor.id,
            abilityId: counter.command.kind === 'ability' ? counter.command.id : 'attack',
            cause: counter.cause,
          });
          executeCommand(ctx, counterActor, counter.command, true);
        }
      }

      // Equipment reactions: Counterattack, Auto-Potion, Auto-Med, Auto-Phoenix.
      if (def) {
        for (const reaction of collectReactions(ctx, actor, def, [...damaged])) {
          const reactor = tryActor(ctx, reaction.actorId);
          if (!reactor) continue;
          this.push({
            type: 'counter',
            actorId: reaction.actorId,
            targetId: reaction.targetId,
            abilityId: reaction.abilityId,
            cause: reaction.cause,
          });
          const isItem = ctx.content.item(reaction.abilityId) !== undefined;
          executeCommand(
            ctx,
            reactor,
            isItem
              ? { kind: 'item', id: reaction.abilityId, targets: [reaction.targetId] }
              : { kind: 'attack', targets: [reaction.targetId] },
            true,
          );
        }
      }
    }

    onTurnEnd(ctx, actor);
    rtOf(ctx, actor.id).turnsTaken += 1;
    if (actor.side === 'enemy') ctx.rt.lastEnemyActorId = actor.id;
    ctx.rt.currentActorId = null;

    // An aeon that ran out of HP hands the field back; it is not a wipe.
    const aeonId = ctx.state.aeonId;
    if (aeonId) {
      const aeon = tryActor(ctx, aeonId);
      if (aeon && !isAlive(aeon)) dismissAeon(ctx, 'ko');
    }

    evaluateTriggers(ctx, collectSignals(this.buffer));
    this.checkEnd();
  }

  /** Victory / defeat / escape. Returns true when the battle is over. */
  private checkEnd(): boolean {
    const ctx = this.requireCtx();
    if (ctx.state.result) return true;

    const bosses = ctx.state.enemyIds
      .map((id) => tryActor(ctx, id))
      .filter((c): c is FFXCombatant => c !== undefined);
    const primary = bosses.filter((c) => !c.flags.isPart);
    const relevant = primary.length > 0 ? primary : bosses;
    if (relevant.every((c) => !isAlive(c))) {
      this.finish('victory');
      return true;
    }

    // An aeon holding the field keeps the party alive by definition.
    if (ctx.state.aeonId === null) {
      const standing = ctx.state.activeIds
        .map((id) => tryActor(ctx, id))
        .filter((c): c is FFXCombatant => c !== undefined && isAlive(c) && !has(c, 'petrify'));
      if (standing.length === 0) {
        const escaped = ctx.state.activeIds.every((id) => {
          const c = tryActor(ctx, id);
          return c !== undefined && has(c, 'eject');
        });
        this.finish(escaped ? 'escape' : 'defeat');
        return true;
      }
    }
    return false;
  }

  private finish(outcome: BattleResult['outcome']): void {
    const ctx = this.requireCtx();
    if (ctx.state.result) return;
    const result = buildBattleResult(ctx, outcome, this.setup?.enemies.nextGroupId);
    ctx.state.result = result;
    ctx.rt.finished = true;
    this.push(outcome === 'victory' ? { type: 'victory', result } : { type: 'defeat', result });
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
