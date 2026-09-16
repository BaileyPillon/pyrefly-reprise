/**
 * The playback protocol from `docs/CONTRACTS.md`, made real.
 *
 * The engine is a pure state machine that answers *what happens next?*; this is
 * the only thing in the project that knows about **time**. It takes the ordered
 * `BattleEvent[]` an engine emits and plays them onto painted actors, VFX, the
 * camera, audio and the HUD, then asks the engine for the next decision.
 *
 * Imports nothing from `three` and touches no DOM: everything it drives is a
 * port from `BattlePresenterPorts.ts`, which is what lets the whole loop run in
 * Node under `tests/unit/presenter-*.test.ts` against fakes.
 *
 * Three places the loop deliberately stops:
 * - `minigame-request` — stop, open the overlay, re-submit the *same* command
 *   with `extra` set (CONTRACTS.md "Minigame protocol").
 * - `script-trigger` — pause, run the chapter's mid-battle script, resume the
 *   remaining events.
 * - `victory` / `defeat` — hand the `BattleResult` back to the screen, which
 *   owns chaining, the results screen and retry.
 */

import type {
  BattleEngine,
  BattleEvent,
  BattleResult,
  Command,
  CombatantId,
  MinigameKind,
  MinigameResult,
  AvailableCommand,
  AtbSnapshot,
  FFX2BattleEngine,
  TurnPreview,
} from '../battle/common/types.ts';
import type { StoryScript } from '../story/dsl.ts';
import { createEventCtx, playEvent, type EventCtx } from './BattlePresenterEvents.ts';
import type { PlaybackSpeed, PlaybackTrace, PresenterDeps } from './BattlePresenterPorts.ts';
import { firstEnabled, outcomeOf, previewOf } from './BattlePresenterUtil.ts';

/** How a battle ended, from the presenter's point of view. */
export type BattleOutcome =
  | { kind: 'victory'; result: BattleResult }
  | { kind: 'defeat'; result: BattleResult }
  | { kind: 'escape'; result: BattleResult }
  /** `abort()` was called — the screen is leaving. */
  | { kind: 'aborted' };

/** What one `play()` call stopped on. */
export interface PlayResult {
  /** Set when playback halted on a `minigame-request`. */
  minigame?: { who: CombatantId; kind: MinigameKind; params: Record<string, unknown> };
  /** Set when a `victory` / `defeat` event was played. */
  ended?: 'victory' | 'defeat';
  result?: BattleResult;
  /** Events after the stop point, which the engine will re-emit. */
  dropped: number;
}

/** Picks a command for a player-controlled actor without a human. */
export type AutoStrategy = (
  actorId: CombatantId,
  commands: AvailableCommand[],
  engine: BattleEngine,
) => Command | null;

const SPEED_SCALE: Record<PlaybackSpeed, number> = { normal: 1, fast: 0.32, skip: 0 };

/** How long the presenter will wait on `HudPort.onEvent` before moving on. */
const HUD_EVENT_BUDGET_MS = 600;

/** How long a mid-battle script may run before the presenter gives up on it. */
const SCRIPT_BUDGET_MS = 30_000;

/**
 * Decisions in a row with nothing added to the event log before the presenter
 * calls it a livelock.
 *
 * Generous, because a legitimate turn can produce no events (a status tick
 * that changes nothing, an AI passing). A genuinely stuck engine hits this in
 * milliseconds.
 */
const LIVELOCK_SPINS = 400;

/**
 * `setTimeout` even for zero, because a resolved promise is a **microtask**.
 *
 * A whole battle of `Promise.resolve()` waits never returns to the event loop,
 * so `requestAnimationFrame` never fires and the page freezes solid until the
 * last event — which is exactly what `speed: 'skip'` would otherwise do to the
 * e2e specs and the critic. A macrotask yield keeps the frame loop breathing
 * while still resolving a chapter in a couple of seconds.
 */
const defaultSleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, Math.max(0, ms)));

export class BattlePresenter {
  private readonly deps: PresenterDeps;
  private readonly ctx: EventCtx;
  private readonly baseSleep: (ms: number) => Promise<void>;

  private speed: PlaybackSpeed = 'normal';
  private timeScale: number;
  private aborted = false;
  private auto: AutoStrategy | null = null;

  /** Every event played, newest last. The debug API prints this. */
  readonly trace: PlaybackTrace[] = [];
  /**
   * Where the loop currently is.
   *
   * Every `await` in the playback loop sets this first, so a battle that stops
   * advancing says *which* await it is parked on instead of looking identical
   * to a slow one. `__pyrefly.snapshotState()` prints it.
   */
  private phase = 'idle';
  /** The command most recently submitted, so a minigame can re-submit it. */
  private lastCommand: Command | null = null;
  /** Set while a HUD command menu is open, so auto-play can cut in. */
  private pendingMenu: {
    actorId: CombatantId;
    commands: AvailableCommand[];
    engine: BattleEngine;
    resolve: (command: Command) => void;
  } | null = null;

  constructor(deps: PresenterDeps) {
    this.deps = deps;
    this.baseSleep = deps.sleep ?? defaultSleep;
    this.timeScale = deps.timeScale ?? 1;
    this.ctx = createEventCtx(deps, (ms) => this.sleep(ms));
  }

  // ------------------------------------------------------------------ control

  setSpeed(speed: PlaybackSpeed): void {
    this.speed = speed;
    this.syncAutoAdvance();
  }

  get playbackSpeed(): PlaybackSpeed {
    return this.speed;
  }

  /** Fast-forward the rest of the current burst. Reset with `setSpeed`. */
  fastForward(): void {
    this.speed = this.speed === 'normal' ? 'fast' : 'skip';
  }

  /**
   * Answer player-input decisions from a strategy instead of the HUD.
   *
   * Takes effect immediately, including on a command menu that is *already*
   * open: the pending `HudPort.chooseCommand` is raced against the strategy's
   * pick, so `__pyrefly.autoBattle()` mid-fight does not deadlock waiting for
   * a keypress that is never coming.
   */
  setAutoPlay(strategy: AutoStrategy | null): void {
    this.auto = strategy;
    this.syncAutoAdvance();
    const pending = this.pendingMenu;
    if (!strategy || !pending) return;
    const picked = strategy(pending.actorId, pending.commands, pending.engine);
    if (picked) pending.resolve(picked);
  }

  get isAuto(): boolean {
    return this.auto !== null;
  }

  /**
   * Dialogue waits for a keypress; nobody is pressing one when the presenter
   * is driving itself, so tell the cutscene runner to advance on its own.
   */
  private syncAutoAdvance(): void {
    this.deps.cutscenes?.setAutoAdvance?.(this.auto !== null || this.speed === 'skip');
  }

  /**
   * Stop playback at the next await point, permanently.
   *
   * Deliberately one-way: `BattleScreen.exit()` calls this, and a presenter
   * that has been torn down must never animate again just because something
   * called `run()` once more. A retry builds a fresh presenter.
   */
  abort(): void {
    this.aborted = true;
  }

  get isAborted(): boolean {
    return this.aborted;
  }

  private sleep(ms: number): Promise<void> {
    if (this.aborted) return Promise.resolve();
    return this.baseSleep(Math.max(0, ms * SPEED_SCALE[this.speed] * this.timeScale));
  }

  // -------------------------------------------------------------------- play

  /**
   * Play an ordered burst of events. Stops early on `minigame-request`,
   * `victory` or `defeat`; pauses (but does not stop) on `script-trigger`.
   */
  async play(events: BattleEvent[]): Promise<PlayResult> {
    for (let i = 0; i < events.length; i++) {
      if (this.aborted) return { dropped: events.length - i };
      const event = events[i]!;

      // The HUD gets first look at every event so it can raise a transient.
      this.phase = `hud:${event.type}`;
      await this.notifyHud(event);

      const started = Date.now();
      if (event.type === 'minigame-request') {
        this.trace.push({ seq: event.seq, type: event.type, ms: 0 });
        return {
          minigame: { who: event.who, kind: event.kind, params: event.params },
          dropped: events.length - i - 1,
        };
      }

      if (event.type === 'script-trigger') {
        this.phase = `script:${event.name}`;
        await this.runScript(event.name);
        this.trace.push({ seq: event.seq, type: event.type, ms: Date.now() - started });
        continue;
      }

      this.phase = `play:${event.type}`;
      await playEvent(this.ctx, event);
      this.trace.push({ seq: event.seq, type: event.type, ms: Date.now() - started });

      if (event.type === 'victory' || event.type === 'defeat') {
        return { ended: event.type, result: event.result, dropped: events.length - i - 1 };
      }
    }
    this.phase = 'idle';
    return { dropped: 0 };
  }

  /** `HudPort.onEvent` may show a transient, but never blocks playback. */
  private async notifyHud(event: BattleEvent): Promise<void> {
    const hud = this.deps.hud;
    if (!hud) return;
    try {
      const p = hud.onEvent(event);
      if (p && typeof (p as Promise<void>).then === 'function') {
        await Promise.race([p, this.baseSleep(HUD_EVENT_BUDGET_MS)]);
      }
    } catch (err) {
      console.warn('[presenter] HUD onEvent threw; continuing', err);
    }
  }

  /** Run one mid-battle story script, then resume playback. */
  private async runScript(name: string): Promise<void> {
    const script: StoryScript | undefined = this.deps.midScripts?.[name];
    const runner = this.deps.cutscenes;
    if (!script || !runner) {
      // The story agent has not landed this script yet: log and keep fighting.
      if (!script) console.info(`[presenter] no mid-battle script for trigger "${name}"`);
      return;
    }
    this.deps.hud?.setVisible(false);
    try {
      // A script must never be able to wedge a battle. If one does not finish
      // in time — a dialogue line waiting on input that is never coming, a
      // port that never resolves — the beat is abandoned and the fight
      // resumes, loudly.
      const timedOut = Symbol('cutscene-timeout');
      const raced = await Promise.race([
        runner.play(script, { midBattle: true }).then(() => null),
        this.baseSleep(SCRIPT_BUDGET_MS).then(() => timedOut),
      ]);
      if (raced === timedOut) {
        console.error(
          `[presenter] mid-battle script "${name}" did not finish within ` +
            `${SCRIPT_BUDGET_MS}ms; abandoning the beat and resuming the battle`,
        );
      }
    } catch (err) {
      console.warn(`[presenter] mid-battle script "${name}" failed`, err);
    } finally {
      this.deps.hud?.setVisible(true);
    }
  }

  // --------------------------------------------------------------- main loop

  /**
   * The CONTRACTS.md loop, start to finish. Returns how the battle ended; the
   * screen owns what happens next (chain, results, retry).
   */
  async run(engine: BattleEngine): Promise<BattleOutcome> {
    /** Consecutive decisions that left `state().log` exactly as it was. */
    let idleSpins = 0;
    let lastLogLength = engine.state().log.length;

    for (;;) {
      if (this.aborted) return { kind: 'aborted' };

      // A decision that produces no events resolves its promise as a
      // microtask, and a run of them never returns to the event loop at all —
      // no timers, no rAF, a page that looks hung rather than slow. Yielding a
      // real macrotask keeps the frame loop (and any watchdog) alive.
      if (idleSpins > 0) await this.baseSleep(0);

      if (idleSpins > LIVELOCK_SPINS) {
        console.error(
          `[presenter] the engine produced ${LIVELOCK_SPINS} decisions in a row ` +
            `without emitting a single event (log stuck at ${lastLogLength}); ` +
            'abandoning the battle rather than spinning forever',
        );
        return { kind: 'aborted' };
      }

      this.phase = 'decision';
      const decision = engine.nextDecision();

      switch (decision.kind) {
        case 'battle-over':
          this.syncHud(engine);
          return outcomeOf(decision.result);

        case 'resolved': {
          const res = await this.play(decision.events);
          this.syncHud(engine);
          if (res.minigame) {
            // An AI actor should never raise one, but if it does, resolve it
            // with the engine's own default by re-submitting bare.
            await this.resolveMinigame(engine, res.minigame, true);
            continue;
          }
          if (res.ended) return outcomeOf(res.result ?? engine.state().result);
          break;
        }

        case 'waiting': {
          const events = (engine as FFX2BattleEngine).tick(decision.nextEventMs);
          const res = await this.play(events);
          this.syncHud(engine);
          if (res.ended) return outcomeOf(res.result ?? engine.state().result);
          break;
        }

        case 'player-input': {
          this.phase = `command:${decision.actorId}`;
          const command = await this.chooseCommand(engine, decision.actorId, decision.commands);
          if (!command) return { kind: 'aborted' };
          const out = await this.submit(engine, command);
          if (out) return out;
          break;
        }
      }

      const logLength = engine.state().log.length;
      idleSpins = logLength === lastLogLength ? idleSpins + 1 : 0;
      lastLogLength = logLength;
    }
  }

  /** Submit one command and play everything it produced, minigames included. */
  private async submit(engine: BattleEngine, command: Command): Promise<BattleOutcome | null> {
    this.lastCommand = command;
    let res = await this.play(engine.submit(command));
    this.syncHud(engine);

    // A minigame suspends the loop; the same command comes back with `extra`.
    let guard = 0;
    while (res.minigame && guard++ < 4) {
      res = await this.resolveMinigame(engine, res.minigame, false);
      this.syncHud(engine);
    }

    if (res.ended) return outcomeOf(res.result ?? engine.state().result);
    return null;
  }

  /**
   * Open the overlay named by the request, then **re-submit the same command**
   * with the outcome in `extra`. When there is no HUD (auto-battle, e2e,
   * tests) the command is re-submitted bare and the engine rolls its own
   * outcome from the seeded RNG.
   */
  private async resolveMinigame(
    engine: BattleEngine,
    request: { who: CombatantId; kind: MinigameKind; params: Record<string, unknown> },
    engineDefault: boolean,
  ): Promise<PlayResult> {
    const base = this.lastCommand;
    if (!base) return { dropped: 0 };

    let extra: MinigameResult | undefined;
    if (!engineDefault && this.deps.hud && !this.auto) {
      try {
        extra = await this.deps.hud.openMinigame(request.kind, request.params);
      } catch (err) {
        console.warn('[presenter] minigame overlay failed; using the engine default', err);
      }
    }

    const repeat: Command =
      extra && base.kind === 'overdrive' ? { ...base, extra } : { ...base };
    return this.play(engine.submit(repeat));
  }

  /** Ask the HUD (or the auto strategy) for a command. */
  private async chooseCommand(
    engine: BattleEngine,
    actorId: CombatantId,
    commands: AvailableCommand[],
  ): Promise<Command | null> {
    if (this.auto) {
      // An automated run must never fall through to the menu: there is nobody
      // to answer it and the battle would hang forever. A strategy that has no
      // opinion gets the first legal row instead.
      return this.auto(actorId, commands, engine) ?? firstEnabled(commands);
    }
    const hud = this.deps.hud;
    if (!hud) return firstEnabled(commands);

    this.ctx.stage.actor(actorId)?.setPose('ready');
    const previewRank = (cmd: AvailableCommand | null): TurnPreview[] | AtbSnapshot =>
      previewOf(engine, cmd?.command);

    // Racing the menu against an interrupt is what lets `setAutoPlay` (and so
    // `__pyrefly.autoBattle()`) take over a fight that is already waiting on a
    // human. The HUD's own promise is simply abandoned; the `syncHud` that
    // follows the submitted command re-renders it.
    const interrupt = new Promise<Command>((resolve) => {
      this.pendingMenu = { actorId, commands, engine, resolve };
    });

    try {
      return await Promise.race([hud.chooseCommand(actorId, commands, previewRank), interrupt]);
    } catch (err) {
      if (this.aborted) return null;
      console.warn('[presenter] command menu failed; falling back', err);
      return firstEnabled(commands);
    } finally {
      this.pendingMenu = null;
    }
  }

  /** Re-render the HUD from live engine state. */
  syncHud(engine: BattleEngine): void {
    const hud = this.deps.hud;
    if (!hud) return;
    try {
      hud.sync(engine.state(), previewOf(engine));
    } catch (err) {
      console.warn('[presenter] HUD sync threw', err);
    }
  }

  /** Everything `window.__pyrefly.snapshotState()` wants from playback. */
  snapshot(): Record<string, unknown> {
    return {
      speed: this.speed,
      timeScale: this.timeScale,
      auto: this.auto !== null,
      aborted: this.aborted,
      phase: this.phase,
      awaitingMenu: this.pendingMenu !== null,
      played: this.trace.length,
      lastEvents: this.trace.slice(-12),
      lastCommand: this.lastCommand,
    };
  }
}
