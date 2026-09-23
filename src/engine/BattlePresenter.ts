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
  BattleState,
  Command,
  CombatantId,
  MinigameKind,
  AvailableCommand,
  AtbSnapshot,
  FFX2BattleEngine,
  TurnPreview,
} from '../battle/common/types.ts';
import type { BattleMoments } from './BattleMoments.ts';
import { createEventCtx, playEvent, type EventCtx } from './BattlePresenterEvents.ts';
import { clockEngine, runMenuClock } from './BattlePresenterActive.ts';
import { flushArrivals } from './BattlePresenterArrivals.ts';
import type { AutoStrategy, BattleOutcome, PlayResult } from './BattlePresenterPorts.ts';
import type { PlaybackSpeed, PlaybackTrace, PresenterDeps } from './BattlePresenterPorts.ts';
import {
  defaultSleep,
  firstEnabled,
  INPUT_STREAK_LIMIT,
  LIVELOCK_SPINS,
  askMinigame,
  notifyHud,
  outcomeOf,
  previewOf,
  runMidBattleScript,
  SPEED_SCALE,
  syncHud,
} from './BattlePresenterUtil.ts';
import { applyEventToVitals, captureVitals, projectState, type VitalsMap } from './BattlePresenterVitals.ts';

// Re-exported: the loop's public types live with the ports (`BattlePresenterPorts.ts`).
export type { AutoStrategy, BattleOutcome, PlayResult } from './BattlePresenterPorts.ts';

export class BattlePresenter {
  private readonly deps: PresenterDeps;
  private readonly ctx: EventCtx;
  private readonly baseSleep: (ms: number) => Promise<void>;
  /** Real elapsed time for the FFX-2 Active pump. Tests inject a fake clock. */
  private readonly now: () => number;
  /**
   * Set when the Active pump closed a menu whose owner could no longer answer
   * it (KO, Stop, Sleep, Petrify, chain lock, Berserk, battle over). The loop
   * abandons that decision and asks the engine again rather than aborting the
   * battle. **FFX-2 only** — nothing sets it on an FFX fight.
   */
  private inputAbandoned = false;
  /** Wakes an FFX-2 Wait menu parked in `runMenuClock` ({@link atbModeChanged}). */
  private wakeMenuClock: (() => void) | null = null;

  private speed: PlaybackSpeed = 'normal';
  private timeScale: number;
  private aborted = false;
  private auto: AutoStrategy | null = null;

  /** Every event played, newest last. The debug API prints this. */
  readonly trace: PlaybackTrace[] = [];
  /** The await the loop is parked on, so a stall names itself in `snapshot()`. */
  private phase = 'idle';
  /** The command most recently submitted, so a minigame can re-submit it. */
  private lastCommand: Command | null = null;
  /** A bare re-submit still suspended: this engine needs a human for minigames. */
  private minigamesNeedOverlay = false;
  /**
   * The engine's own state object, kept so a mid-burst row render has something
   * to splice the shown numbers into. It is the live reference the engine
   * mutates, and the engine does not advance while `play` is running, so during
   * a burst it is exactly the end-of-burst truth.
   */
  private liveState: BattleState | null = null;
  /**
   * What the status rows have actually been shown, re-seeded from the engine on
   * every full `syncHud` and rolled forward one event at a time inside a burst.
   * See `BattlePresenterVitals.ts` — this is critic round 03 #9.
   */
  private vitals: VitalsMap | null = null;
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
    this.now = deps.now ?? (() => Date.now());
    this.timeScale = deps.timeScale ?? 1;
    this.ctx = createEventCtx(
      deps,
      (ms) => this.sleep(ms),
      () => this.speed,
    );
  }

  /** The shot picker, so the screen can tear its overlays down on exit. */
  get moments(): BattleMoments {
    return this.ctx.moments;
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
    // `'skip'` collapses every wait to zero for e2e and the critic, so a beat
    // resolves silently there. Auto-battle on its own keeps playing the beat on
    // its own timer, with the HUD up behind it — an automated capture is still
    // something a person looks at.
    this.deps.cutscenes?.setAutoAdvance?.(this.auto !== null || this.speed === 'skip', {
      instant: this.speed === 'skip',
    });
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
    this.atbModeChanged();
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

      // The rows move with the blow, not with the burst.
      //
      // This one line is critic round 03 #9: before it, the only `syncHud` in
      // the loop ran *after* `play()` returned, so every number on the HUD was
      // the number from before the command for as long as the command took to
      // animate — a KO'd Yuna drawn alive at 711/1500 for 2145 ms, and an
      // ordinary hit's numeral 4.5 s ahead of its own bar.
      this.presentVitals(event);

      this.phase = `play:${event.type}`;
      await playEvent(this.ctx, event);
      this.trace.push({ seq: event.seq, type: event.type, ms: Date.now() - started });

      if (event.type === 'victory' || event.type === 'defeat') {
        return { ended: event.type, result: event.result, dropped: events.length - i - 1 };
      }
    }
    // A reveal that ended the burst still arrives before the next menu opens.
    this.phase = 'arrival';
    await flushArrivals(this.ctx);
    this.phase = 'idle';
    return { dropped: 0 };
  }

  /** `HudPort.onEvent` may show a transient, but never blocks playback. */
  private notifyHud(event: BattleEvent): Promise<void> {
    return notifyHud(this.deps.hud, event, this.baseSleep);
  }

  /** Run one mid-battle story script, then resume playback. */
  private runScript(name: string): Promise<void> {
    return runMidBattleScript(this.deps, name, this.baseSleep);
  }

  // --------------------------------------------------------------- main loop

  /**
   * The CONTRACTS.md loop, start to finish. Returns how the battle ended; the
   * screen owns what happens next (chain, results, retry).
   */
  async run(engine: BattleEngine): Promise<BattleOutcome> {
    // Ground the mid-burst row projection before a single event is played. The
    // first burst of a fight (and of every later link of a chain, which re-runs
    // on a fresh engine) happens before any `syncHud` in the loop below.
    this.seedVitals(engine);

    // The opening shot, once per encounter: the party slides in, then the
    // headline enemy gets its slow push and name plate. A chained formation
    // (Yunalesca's forms, the Vegnagun chain) re-enters `run` on the same
    // presenter and gets the reveal for its *new* boss only.
    await this.openOn(engine);

    /** Consecutive decisions that left `state().log` exactly as it was. */
    let idleSpins = 0;
    /** Consecutive player-input decisions with nothing in between. */
    let inputStreak = 0;
    let streakActor = '';
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
          inputStreak = 0;
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
          inputStreak = 0;
          const events = (engine as FFX2BattleEngine).tick(decision.nextEventMs);
          const res = await this.play(events);
          this.syncHud(engine);
          if (res.ended) return outcomeOf(res.result ?? engine.state().result);
          break;
        }

        case 'player-input': {
          inputStreak = decision.actorId === streakActor ? inputStreak + 1 : 1;
          streakActor = decision.actorId;
          if (inputStreak > INPUT_STREAK_LIMIT) {
            console.error(
              `[presenter] ${decision.actorId} has been offered the turn ` +
                `${INPUT_STREAK_LIMIT} times in a row without it passing; the last ` +
                `command (${JSON.stringify(this.lastCommand)}) is not being ` +
                'resolved by the engine. Abandoning the battle rather than looping.',
            );
            return { kind: 'aborted' };
          }
          this.phase = `command:${decision.actorId}`;
          const command = await this.chooseCommand(engine, decision.actorId, decision.commands);
          // FFX-2 Active: the clock ran while the menu was open and its owner
          // stopped being able to answer it. Nothing was submitted; ask the
          // engine what happens next instead of hanging on a dead menu.
          if (this.inputAbandoned) {
            this.inputAbandoned = false;
            inputStreak = 0;
            streakActor = '';
            this.syncHud(engine);
            break;
          }
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

  /**
   * Play the opening moment for whatever is on the field right now.
   *
   * The "boss" is the first enemy that is not a destructible part — that is
   * Yunalesca rather than a coil, Braska's Final Aeon rather than the Yu
   * Pagodas — and an encounter with no enemies at all (the demo reel) simply
   * gets the party slide.
   */
  private async openOn(engine: BattleEngine): Promise<void> {
    if (this.aborted) return;
    const state = engine.state();
    const boss = state.enemyIds
      .map((id) => state.combatants[id])
      .find((c) => c && !c.removed && !c.flags.hidden && !c.flags.isPart);
    this.phase = 'moment:battle-start';
    await this.ctx.moments.battleStart({
      partyIds: state.activeIds,
      bossId: boss?.id ?? null,
      bossName: boss?.name ?? null,
    });
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
    if (res.minigame && this.auto) this.minigamesNeedOverlay = true;

    if (res.ended) return outcomeOf(res.result ?? engine.state().result);
    return null;
  }

  /**
   * Open the overlay named by the request, then re-submit the **same** command
   * with the outcome in `extra`. With nobody at the controls the command goes
   * back bare — but note neither engine rolls a default for a bare re-submit
   * (CONTRACTS.md says they should), which is why automated battles build their
   * engine with minigames auto-resolved (`BattleScreenWiring.createEngine`).
   */
  private async resolveMinigame(
    engine: BattleEngine,
    request: { who: CombatantId; kind: MinigameKind; params: Record<string, unknown> },
    engineDefault: boolean,
  ): Promise<PlayResult> {
    const base = this.lastCommand;
    if (!base) return { dropped: 0 };
    const human = !engineDefault && !this.auto;
    const extra = human ? await askMinigame(this.deps.hud, request) : undefined;
    return this.play(engine.submit(extra && base.kind === 'overdrive' ? { ...base, extra } : { ...base }));
  }

  /** Ask the HUD (or the auto strategy) for a command. */
  private async chooseCommand(
    engine: BattleEngine,
    actorId: CombatantId,
    commands: AvailableCommand[],
  ): Promise<Command | null> {
    if (this.auto) {
      // Taken over mid-fight on an engine built for a human: a timed Overdrive
      // would suspend forever, so the strategy simply does not see those rows.
      const offered = this.minigamesNeedOverlay
        ? commands.filter((c) => !c.opensMinigame && c.command.kind !== 'overdrive')
        : commands;
      // An automated run must never fall through to the menu: there is nobody
      // to answer it and the battle would hang forever. A strategy that has no
      // opinion gets the first legal row instead.
      return this.auto(actorId, offered, engine) ?? firstEnabled(offered);
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

    // FFX-2's ATB clock under this menu, Wait or Active (`runMenuClock`).
    // FFX gets `null` here and behaves exactly as it always has (rule 14).
    const clock = clockEngine(engine);
    let settled = false;
    const decided = Promise.race([hud.chooseCommand(actorId, commands, previewRank), interrupt]).then(
      (command) => {
        settled = true;
        return command;
      },
      (err: unknown) => {
        settled = true;
        throw err;
      },
    );
    // The pump may win the race below, leaving `decided` pending forever; a
    // late rejection from an abandoned menu must not surface as an unhandled
    // one, and this handler is separate from the race's own.
    void decided.catch(() => undefined);

    // Tear the DOM menu down and release the cancel claim, or Esc belongs to a
    // menu that is no longer on screen and the pause key stops working — a
    // defect this project has already paid for once.
    const abandon = (): null => {
      try {
        hud.closeCommandMenu?.();
      } catch (err) {
        console.warn('[presenter] HUD closeCommandMenu threw', err);
      }
      this.inputAbandoned = true;
      return null;
    };

    /**
     * The last gate before a command is submitted, **FFX-2, and only once
     * the clock has run under this menu** (Active, or a pause flip to it).
     *
     * A command can win the race above and still be worthless: the pump plays
     * an enemy's burst with `await`, and the player may confirm *during* that
     * animation, in the same step the burst KO's (or Stops, or chains) the
     * menu's owner. `runActivePump` deliberately lets a command that arrived
     * mid-`play` win, so it returns `'settled'` without re-asking — which left
     * the presenter submitting a dead girl's command. `FFX2Engine.submit`
     * refuses it at the root; this is the half that also closes the menu and
     * lets the loop ask the engine what happens next, instead of a submit that
     * silently produces nothing.
     */
    const finish = (command: Command, ran = true): Command | null =>
      ran && clock && !clock.inputValid(actorId) ? abandon() : command;

    try {
      if (!clock) return await decided;
      const outcome = await runMenuClock({
        engine: clock,
        actorId,
        decided,
        settled: () => settled,
        aborted: () => this.aborted,
        sleep: (ms) => this.baseSleep(ms),
        now: this.now,
        play: (events) => this.play(events),
        syncGauges: (snapshot) => this.syncGauges(snapshot),
        modeChanged: () => new Promise<void>((wake) => (this.wakeMenuClock = wake)),
        showMode: (mode) => this.showAtbMode(mode),
      });
      if ('command' in outcome) return finish(outcome.command, outcome.ran);
      if (outcome.stop === 'invalidated') return abandon();
      // `'settled'` also covers a torn-down presenter, whose menu promise may
      // never resolve at all; awaiting it there would park this task forever.
      if (this.aborted) return null;
      return finish(await decided);
    } catch (err) {
      if (this.aborted) return null;
      console.warn('[presenter] command menu failed; falling back', err);
      return firstEnabled(commands);
    } finally {
      this.pendingMenu = null;
      this.wakeMenuClock = null;
    }
  }

  /**
   * FFX-2's Config ATB mode may have changed (the pause closed; BattleScreen
   * has already pushed the X-2 BATTLE row into the engine). Wakes an open Wait
   * menu so a flip to Active runs the clock under **that** menu, not only the
   * next one. A no-op when no menu is parked; FFX never parks one.
   */
  atbModeChanged(): void {
    const wake = this.wakeMenuClock;
    this.wakeMenuClock = null;
    wake?.();
  }

  /** The HUD's mode chip (`HudPort.setAtbMode`). FFX-2 only; never throws. */
  private showAtbMode(mode: 'wait' | 'active'): void {
    try {
      this.deps.hud?.setAtbMode?.(mode);
    } catch (err) {
      console.warn('[presenter] HUD setAtbMode threw', err);
    }
  }

  /**
   * Cheap gauge-only HUD refresh, once per Active pump step.
   *
   * Deliberately **not** `syncHud`: that also rebuilds the guide, the advisor
   * and the enemy-intent slab, and the intent prediction deep-clones the whole
   * board two dozen times. That is affordable once per playback step and would
   * be a frame-rate defect at 20 Hz. Never throws into the loop.
   */
  private syncGauges(snapshot: AtbSnapshot): void {
    const hud = this.deps.hud;
    if (!hud?.syncGauges) return;
    try {
      hud.syncGauges(snapshot);
    } catch (err) {
      console.warn('[presenter] HUD syncGauges threw', err);
    }
  }

  /** Re-render the HUD from live engine state. */
  syncHud(engine: BattleEngine): void {
    this.seedVitals(engine);
    syncHud(this.deps.hud, engine);
  }

  /**
   * Re-seed the shown numbers from the engine.
   *
   * Every full sync passes through here, so the projection can never drift: it
   * is re-grounded in the engine's own truth at the end of each burst, and a
   * burst is one command. An event kind the projection does not know about
   * costs at most the remainder of the burst it appeared in.
   */
  private seedVitals(engine: BattleEngine): void {
    try {
      const state = engine.state();
      this.liveState = state;
      this.vitals = captureVitals(state);
    } catch {
      // A battle that has not been `init`ed yet has no state to read. The next
      // sync will have one; until then the mid-burst rows simply do not move.
      this.liveState = null;
      this.vitals = null;
    }
  }

  /**
   * Show one event's effect on the status rows, at the moment its animation
   * starts — the same frame the damage numeral for that hit goes up.
   *
   * Never throws into the loop: a HUD that fails a row render must not be able
   * to abandon a battle (the same rule `syncHud` follows).
   */
  private presentVitals(event: BattleEvent): void {
    const hud = this.deps.hud;
    const vitals = this.vitals;
    const state = this.liveState;
    if (!hud || !hud.syncVitals || !vitals || !state) return;
    if (!applyEventToVitals(vitals, event)) return;
    try {
      hud.syncVitals(projectState(state, vitals));
    } catch (err) {
      console.warn('[presenter] HUD syncVitals threw', err);
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
