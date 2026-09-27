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
  BattleEngine,
  BattleEvent,
  BattleSetup,
  BattleState,
  CombatantId,
  Command,
  Decision,
  FFX2BattleEngine,
} from '../common/types.ts';
import { SeededRng } from '../common/rng.ts';
import type { Ffx2EngineOptions } from './internal.ts';
import { ATB_SPEED_MULTIPLIER, type AtbSpeed } from './constants.ts';
import { advanceChainWindows, isActionLocked } from './chain.ts';
import { advanceGauge, msToTicks, ticksToMs } from './gauges.ts';
import { buildCommands } from './targeting.ts';
import { buildState } from './setup.ts';
import { type EnemyIntent, predictNextFFX2EnemyIntent } from './intent.ts';
import { abilityFor, performCommand } from './execute.ts';
import { actorOrder } from './results.ts';
import {
  allTargetsGone,
  clockHeldByMenu,
  inputStillValid,
  nextEventTicks,
  soonestEventTicks,
  substepTicks,
  type AtbMode,
  type HeldCommand,
  type MenuLevel,
  type TickOptions,
} from './active.ts';
import { Ffx2EngineCore } from './engine-core.ts';

/** Sub-steps per `tick()` call. A generous bound, never a normal exit path. */
const TICK_SUBSTEP_LIMIT = 512;

export class FFX2Engine extends Ffx2EngineCore implements FFX2BattleEngine, BattleEngine {
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
    this.acting.clear();
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
    if (this.hitClosed) [this.hitClosed, this.level] = [null, 'deep']; // item 4 A1: a fresh menu starts held
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
    return inputStillValid(this.units, actorId, !!this.battleState.result, this.awaitingMinigame !== null, this.hitClosed === actorId);
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
}

/** Convenience factory mirroring `makeRng`. */
export function makeFFX2Engine(options: Ffx2EngineOptions = {}): FFX2Engine {
  return new FFX2Engine(options);
}
