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
  canAct,
  commandAbility,
  has,
  isAlive,
  livingFriendlies,
  rtOf,
  tryActor,
} from './state.ts';
import { buildBattle } from './setup.ts';
import { availableCommands } from './commands.ts';
import { revealForSensorAuto } from './sensor.ts';
import { chargeForAction, actsAutomatically, berserkCommand, confusedCommand, executeCommand } from './execute.ts';
import { nextActor, normalise, predictTurnOrder as predictOrder } from './turnQueue.ts';
import { collectReactions, onTurnEnd, onTurnStart } from './ticks.ts';
import { resolveDuePartRevivals } from './hp.ts';
import { collectSignals, evaluateTriggers } from './triggers.ts';
import { chooseAiCommand } from './ai/index.ts';
import { type EnemyIntent, predictNextEnemyIntent } from './intent.ts';
import { collectBossCounters, runMortibsorptionIfDown } from './ai/reactions.ts';
import { runMacalaniaPhaseHooks } from './ai/seymour-anima-macalania.ts';
import { runEvraePhaseHooks } from './ai/evrae-counters.ts';
import { counterInputs } from './counter-inputs.ts';
import { aeonDuelLost, dismissAeon } from './aeons.ts';
import { buildBattleResult } from './results.ts';

/**
 * Turns without a new low on the enemy side's total HP before the battle is
 * called a stalemate and ended.
 *
 * Deliberately far beyond any real fight: the longest intended line in the
 * project wins Chapter 3's first link in ~195 turns, and every canonical route
 * out of Yu Yevon reaches a new minimum inside a handful of his own turns. It
 * exists for the case the research itself describes as unlosable
 * [ffx-bfa-yu-yevon §2.3 "Cannot lose"], where without it the only way out is
 * the pause menu.
 */
const STALEMATE_TURNS = 400;
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

  /** Reactions, counters, ticks, triggers and the end check. */
  private afterAction(
    actor: FFXCombatant,
    actionEvents: readonly BattleEvent[],
    command?: Command,
    damageDealt = 0,
  ): void {
    const ctx = this.requireCtx();
    void damageDealt;

    // Who this action damaged, landed a status on, or pushed into a new form.
    const { damaged, counterable, statusCounterable } = counterInputs(actor.id, actionEvents);

    // The Mortiorchis never dies; it drains Seymour and comes back smaller.
    runMortibsorptionIfDown(ctx);

    // Macalania's act transitions fire from a **hit**, not from a turn: he
    // summons the moment his HP reaches 3,000, and Anima is dismissed the
    // moment hers reaches 0 [ffx-seymour-anima-macalania §5.2, §5.3]. A no-op
    // in every other battle.
    runMacalaniaPhaseHooks(ctx);

    // Evrae's 1/3-HP self-Haste: a hook, so Guided Missiles trip it too [§5.4]. No-op elsewhere.
    runEvraePhaseHooks(ctx);

    // Boss counters fire from the hit hook and cost no turn.
    if (command) {
      const def = commandAbility(ctx, command);
      if (def) {
        for (const counter of collectBossCounters(ctx, actor, def, counterable, statusCounterable)) {
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
        for (const reaction of collectReactions(ctx, actor, def, damaged)) {
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
    // A non-combatant (Cid, `ActorRuntime.nonCombatant`) never blocks victory [ffx-evrae-airship §2.1].
    const nonCombatants = bosses.filter((c) => ctx.rt.actors.get(c.id)?.nonCombatant === true);
    const fighters = nonCombatants.length > 0 && nonCombatants.length < bosses.length
      ? bosses.filter((c) => !nonCombatants.includes(c))
      : bosses;
    const primary = fighters.filter((c) => !c.flags.isPart);
    const relevant = primary.length > 0 ? primary : fighters;
    if (relevant.every((c) => !isAlive(c))) {
      this.finish('victory');
      return true;
    }

    // A lost aeon duel, before the stalemate watch could call it an escape (Chapter XIV only, I-G3 / B11).
    if (aeonDuelLost(ctx)) { this.finish('defeat'); return true; }

    // **Stalemate.** A battle that can be neither won nor lost has to end, or the only way out is the
    // pause menu [critic round 02 #17].
    //
    // Progress is a **new minimum** on the enemy side's total HP. Yu Yevon answers every damaging
    // action with a 9,999 Curaga, the two Pagodas add ~4,500 between his turns, and the party's
    // permanent fayth Auto-Life makes defeat impossible, so a party out of Candles sits there for ever —
    // measured at 25,364 turns with the boss parked on 6,001 of 99,999. His own Gravija meanwhile takes
    // 75% of everybody's current HP every cycle, which is why "some HP moved" is not the test: HP moves
    // constantly in precisely the fight that is stuck.
    //
    // This takes nothing away from him. Every canonical route out — Doom, the Zombie inversion, Reflect
    // on him, Poison at 10% of 99,999, and the Gravija attrition that ends at 1 HP — reaches a new
    // minimum long inside the window [ffx-bfa-yu-yevon §3.5]. The longest intended line in the project,
    // Chapter 3's first link, wins in ~195 turns.
    const enemyHp = relevant.reduce((sum, c) => sum + Math.max(0, c.hp), 0);
    if (enemyHp < ctx.rt.progress.bestEnemyHp) {
      ctx.rt.progress = { bestEnemyHp: enemyHp, atTurn: ctx.state.turn };
    } else if (ctx.state.turn - ctx.rt.progress.atTurn >= STALEMATE_TURNS) {
      ctx.emit({ type: 'message', text: 'The battle cannot be won from here.', kind: 'system' });
      // `'escape'`, because the party withdraws: `BattleResult['outcome']` has
      // three members and this is the one that means "over, not beaten".
      this.finish('escape');
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
