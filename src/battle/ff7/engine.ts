/**
 * `Ff7Engine`: the FF7 battle engine behind the shared `BattleEngine` facade,
 * plus the clock methods the presenter duck-types (`tick`, `gaugeSnapshot`,
 * `inputValid`, `atbMode`, `clockHeld`, `setMenuLevel`), so FF7's real-time ATB
 * rides the presenter's existing clock path with no presenter change.
 *
 * ```
 * engine.init(setup);
 * for (;;) {
 *   const d = engine.nextDecision();
 *   if (d.kind === 'battle-over') break;
 *   if (d.kind === 'resolved') { await play(d.events); continue; }        // a queued action
 *   if (d.kind === 'waiting')  { await play(engine.tick(d.nextEventMs)); continue; }
 *   await play(engine.submit(await ui.chooseCommand(d.actorId, d.commands)));
 * }
 * ```
 *
 * - Time enters only through `tick(ms)`; ms become ticks at {@link TICKS_PER_SECOND}
 *   (**our estimate**, `clock.ts`). An enemy whose gauge fills commits and acts
 *   inside `tick`, so `tick` returns its events [core §2.4].
 * - The Config mode is FF7's own ({@link Ff7AtbMode}, Recommended by default,
 *   core §2.5). Its setter is **`setFf7AtbMode`**, deliberately not `setAtbMode`:
 *   the app's `applyAtbConfig` duck-types `setAtbMode` / `setAtbSpeed` to push
 *   **FFX-2's** saved setting, which must never reach FF7.
 * - Animations: the presenter brackets an action's playback with
 *   `setAnimating(true)` / `setAnimating(false)` and may keep calling `tick` meanwhile.
 *   Recommended and Wait hold the clock then; Active lets every gauge run (a party
 *   member who fills joins the input queue, an enemy commits) but nothing executes
 *   until the animation ends; a Summon's animation holds Active too [core §2.5].
 *
 * Pure (AGENTS.md rule 1): no DOM, no `three`, no `src/data`; the app hands the
 * registry in. Game case: **FF7 only.**
 */

import { SeededRng } from '../common/rng.ts';
import type { AtbSnapshot, BattleEngine, BattleEvent, BattleSetup, BattleState, CombatantId, Command, Decision, Ff7AtbMode } from '../common/types.ts';
import { DEFAULT_BATTLE_SPEED, ticksToFill, vTimerIncrease } from './atb.ts';
import {
  advanceTimers,
  clockHeldByAnimation,
  clockHeldByMenu,
  DEFAULT_FF7_ATB_MODE,
  gracePauseTicks,
  modeHasGracePause,
  msToTicks,
  presenterMode,
  ticksToMs,
  ticksToNextFill,
  TICKS_PER_SECOND,
} from './clock.ts';
import { abilityForCommand, buildCommands, commandError } from './commands.ts';
import type { Ff7Registry } from './defs.ts';
import { allUnits, isParty, unit, type EventDraft, type Ff7Env, type Ff7QueuedAction, type Ff7Runtime } from './internal.ts';
import { executeNext, gaugeFilled, runSetups } from './resolve.ts';
import { buildFf7Battle, turnIncreases } from './setup.ts';

/** Options for {@link Ff7Engine}. */
export interface Ff7EngineOptions {
  /** Everything from `src/data/ff7` (the app builds it with `ff7Registry()`). */
  registry: Ff7Registry;
  /** Config battle mode; Recommended by default [core §2.5]. */
  atbMode?: Ff7AtbMode;
  /** Config Battle Speed 0 (fastest) to 255; 128 by default [core §2.1]. */
  battleSpeed?: number;
}

function emptyState(): BattleState {
  return {
    game: 'ff7', combatants: {}, activeIds: [], reserveIds: [], enemyIds: [], aeonId: null, turn: 0, ticks: 0,
    log: [], nextSeq: 0, triggers: [], firedTriggerIds: [], result: null, seed: 0, flags: {},
  };
}

function emptyRuntime(): Ff7Runtime {
  return { weapons: {}, inventory: {}, normalSpeed: 1, increase: {}, inputQueue: [], actions: [], forms: {}, lastTurnTick: 0 };
}

export class Ff7Engine implements BattleEngine {
  private readonly reg: Ff7Registry;
  private rng = new SeededRng(0);
  private st: BattleState = emptyState();
  private rt: Ff7Runtime = emptyRuntime();
  private pending: BattleEvent[] = [];
  private mode: Ff7AtbMode;
  private speed: number;
  /** Whose menu was last offered (engine-private, so `nextDecision` leaves `BattleState` alone). */
  private offered: CombatantId | null = null;
  /** Where the open menu's cursor is (`HudPort.onMenuLevel`); a fresh menu opens at its top list, which Wait runs [core §2.5]. */
  private level: 'top' | 'deep' = 'top';
  /** An action's animation is on screen (`setAnimating`); `'summon'` for a Summon's. */
  private anim: false | 'plain' | 'summon' = false;
  /** Grace-pause ticks still to wait [core §2.5; length our estimate]. */
  private grace = 0;
  /** Real ms handed to `tick` that did not make a whole tick yet. */
  private carryMs = 0;

  constructor(options: Ff7EngineOptions) {
    this.reg = options.registry;
    this.mode = options.atbMode ?? DEFAULT_FF7_ATB_MODE;
    this.speed = options.battleSpeed ?? DEFAULT_BATTLE_SPEED;
  }

  // -- BattleEngine ---------------------------------------------------------

  init(setup: BattleSetup): void {
    this.rng = new SeededRng(setup.seed);
    const built = buildFf7Battle(setup, this.reg, this.rng, this.speed);
    this.st = built.state;
    this.rt = built.rt;
    this.pending = [];
    this.offered = null;
    this.level = 'top';
    this.anim = false;
    this.grace = 0;
    this.carryMs = 0;
    runSetups(this.env());
    this.flush();
  }

  setSeed(n: number): void {
    this.rng.seed(n);
    this.st.seed = n;
  }

  state(): Readonly<BattleState> {
    return this.st;
  }

  nextDecision(): Decision {
    if (this.st.result) return { kind: 'battle-over', result: this.st.result };
    if (this.rt.actions.length > 0) {
      executeNext(this.env());
      return { kind: 'resolved', events: this.flush() };
    }
    const head = this.inputHead();
    if (head) {
      if (this.offered !== head) {
        this.offered = head;
        this.level = 'top';
      }
      return { kind: 'player-input', actorId: head, commands: buildCommands(this.env(), unit(this.st, head)) };
    }
    this.offered = null;
    const next = this.grace + ticksToNextFill(allUnits(this.st), this.rt.increase);
    return { kind: 'waiting', nextEventMs: Number.isFinite(next) ? Math.max(1, ticksToMs(next)) : 1000 };
  }

  submit(command: Command): BattleEvent[] {
    if (this.st.result) return this.flush();
    const actorId = this.offered ?? this.inputHead();
    // The menu's owner fell while it was open: refuse, the turn is not spent, and
    // the next decision re-offers the menu to whoever can answer (never a stolen turn).
    if (!actorId || !this.inputValid(actorId)) {
      this.offered = null;
      return this.flush();
    }
    const env = this.env();
    const actor = unit(this.st, actorId);
    const err = commandError(env, actor, command);
    if (err) throw new Error(`FF7 engine: ${actorId} cannot submit ${command.kind}: ${err}`);
    this.rt.inputQueue = this.rt.inputQueue.filter((id) => id !== actorId);
    this.offered = null;
    const action: Ff7QueuedAction = {
      actorId,
      command: JSON.parse(JSON.stringify(command)) as Command,
      abilityId: abilityForCommand(env, command)?.id ?? null,
    };
    // A Limit Break takes turn priority [core §7.2]; nothing else jumps the queue [core §2.6, estimate].
    if (command.kind === 'limit') this.rt.actions.unshift(action);
    else {
      this.rt.actions.push(action);
      // "Time pauses briefly after another action is queued"; Limits never set it [core §2.5].
      if (modeHasGracePause(this.mode)) this.grace = gracePauseTicks(this.speed);
    }
    while (this.rt.actions.length > 0 && !this.st.result) {
      const head = this.rt.actions[0];
      executeNext(env);
      if (head === action) break;
    }
    return this.flush();
  }

  // -- the clock (duck-typed by the presenter) --------------------------------

  /**
   * Advance the clock by `ms` of real time; returns what resolved. Without
   * `throughInput` it stops at the first gauge that fills (a party member's menu
   * must open). With it (a menu is open and the mode runs the clock), a party
   * member who fills joins the input queue and time goes on; an enemy that fills
   * acts at once and the step ends so its events can be played.
   */
  tick(ms: number, opts?: { throughInput?: boolean }): BattleEvent[] {
    if (this.st.result || this.clockHeld()) return this.flush();
    const through = opts?.throughInput === true || this.anim !== false;
    const conv = msToTicks(ms + this.carryMs);
    this.carryMs = conv.restMs;
    let left = conv.ticks;
    const env = this.env();
    const units = allUnits(this.st);
    const v = vTimerIncrease(this.speed);
    // Under an animation (Active only reaches here) nothing executes: one action at a time.
    const execute = this.anim === false;
    const grace = modeHasGracePause(this.mode) ? gracePauseTicks(this.speed) : 0;

    while (left > 0 && !this.st.result) {
      if (execute && this.rt.actions.length > 0) {
        executeNext(env);
        break;
      }
      if (this.grace > 0) {
        const g = Math.min(this.grace, left);
        this.grace -= g;
        left -= g;
        this.st.ticks += g;
        continue;
      }
      if (!through && this.inputHead()) break;
      const k = Math.min(left, ticksToNextFill(units, this.rt.increase));
      if (!Number.isFinite(k)) {
        this.st.ticks += left;
        left = 0;
        break;
      }
      const filled = advanceTimers(units, this.rt.increase, v, k);
      this.st.ticks += k;
      left -= k;
      for (const c of filled) {
        gaugeFilled(env, c);
        // A party gauge filling, or an action queued, starts the grace pause [core §2.5].
        if (grace > 0) this.grace = grace;
      }
      if (execute && this.rt.actions.length > 0) {
        executeNext(env);
        break;
      }
      if (!through && filled.some(isParty)) break;
    }
    // Under a running menu, whole ticks an early stop left unspent are owed to the next step.
    if (through && left > 0) this.carryMs += (left * 1000) / TICKS_PER_SECOND;
    return this.flush();
  }

  /** The gauges for the HUD: party first, then enemies; FF7 has no charge bar. */
  gaugeSnapshot(): AtbSnapshot {
    return {
      elapsedMs: ticksToMs(this.st.ticks),
      bars: allUnits(this.st)
        .filter((c) => !c.removed)
        .map((c) => ({
          actorId: c.id,
          fill: c.alive ? c.ff7.atb.turnTimer / 65535 : 0,
          required: ticksToFill(this.rt.increase[c.id] ?? 0),
          ready: isParty(c) ? this.rt.inputQueue.includes(c.id) : c.ff7.atb.ready,
          charge: null,
          state: 'normal' as const,
        })),
    };
  }

  /** Is `actorId`'s open menu still answerable: battle on, alive, gauge full and waiting for a command? */
  inputValid(actorId: CombatantId): boolean {
    if (this.st.result) return false;
    const c = this.st.combatants[actorId];
    return !!c && c.alive && !c.removed && this.rt.inputQueue.includes(actorId);
  }

  /** The presenter's two-way view: `'wait'` under Wait, else `'active'` (the clock may run under a menu). */
  atbMode(): 'wait' | 'active' {
    return presenterMode(this.mode);
  }

  /** Whether the clock is held now: an animation (not Active, bar a Summon), or Wait's menu below the top list [core §2.5]. */
  clockHeld(): boolean {
    if (clockHeldByAnimation(this.mode, this.anim !== false, this.anim === 'summon')) return true;
    const open = this.offered !== null && this.rt.inputQueue.includes(this.offered);
    return clockHeldByMenu(this.mode, open, this.level);
  }

  /**
   * The presenter says an action's animation started (`on`) or ended. While it plays,
   * `tick` runs every gauge under Active and holds under Recommended and Wait, and never
   * executes a queued action [core §2.5, §2.6 estimate]. `summon` holds Active too.
   */
  setAnimating(on: boolean, opts?: { summon?: boolean }): void {
    this.anim = on ? (opts?.summon === true ? 'summon' : 'plain') : false;
  }

  /** Whether an animation is on screen (`setAnimating`). */
  animating(): boolean {
    return this.anim !== false;
  }

  setMenuLevel(level: 'top' | 'deep'): void {
    this.level = level;
  }

  // -- FF7 Config -------------------------------------------------------------

  /** FF7's Config battle mode (never FFX-2's `setAtbMode`; see the file header). Survives `init`. */
  setFf7AtbMode(mode: Ff7AtbMode): void {
    this.mode = mode;
  }

  ff7AtbMode(): Ff7AtbMode {
    return this.mode;
  }

  /** Config Battle Speed 0..255; the rates change from the next tick, NormalSpeed stays [core §2.1, §2.3]. */
  setBattleSpeed(battleSpeed: number): void {
    this.speed = Math.max(0, Math.min(255, Math.trunc(battleSpeed)));
    if (this.st.activeIds.length > 0) this.rt.increase = turnIncreases(allUnits(this.st), this.rt.normalSpeed, this.speed);
  }

  battleSpeed(): number {
    return this.speed;
  }

  // -- read-only views for the HUD and tests ------------------------------------

  /** Items carried now, by id. */
  inventory(): Readonly<Record<string, number>> {
    return { ...this.rt.inventory };
  }

  /** Party members waiting for a command, first filled first. */
  inputQueue(): readonly CombatantId[] {
    return [...this.rt.inputQueue];
  }

  /** Grace-pause ticks left. */
  graceTicks(): number {
    return this.grace;
  }

  // -- internals --------------------------------------------------------------

  private inputHead(): CombatantId | null {
    for (const id of this.rt.inputQueue) {
      const c = this.st.combatants[id];
      if (c && c.alive && !c.removed) return id;
    }
    return null;
  }

  private env(): Ff7Env {
    return { state: this.st, reg: this.reg, rng: this.rng, rt: this.rt, emit: (e) => this.emit(e) };
  }

  private emit(draft: EventDraft): void {
    const event = { ...draft, seq: this.st.nextSeq++ } as BattleEvent;
    this.st.log.push(event);
    this.pending.push(event);
  }

  private flush(): BattleEvent[] {
    const out = this.pending;
    this.pending = [];
    return out;
  }
}
