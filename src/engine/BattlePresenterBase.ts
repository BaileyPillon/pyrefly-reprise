/**
 * The shared half of the presenter: its state, the control surface (speed, auto-play, abort), the HUD calls that never throw into the loop, the shown-numbers projection and the snapshot.
 *
 * `BattlePresenter` was one 800-line class. It is now a short chain of classes, one responsibility each, every layer calling only the layers below it:
 * `BattlePresenterBase` -> `BattlePresenterPlayback` -> `BattlePresenterCommands` -> `BattlePresenter` (import that one from `BattlePresenter.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where a later layer reads it.
 */

import type { BattleEngine, BattleEvent, BattleState, Command, CombatantId, MinigameKind, AvailableCommand, AtbSnapshot } from '../battle/common/types.ts';
import type { BattleMoments } from './BattleMoments.ts';
import { createEventCtx, type EventCtx } from './BattlePresenterEvents.ts';
import { MenuWaker } from './BattlePresenterActive.ts';
import { TurnCutInBeat } from './TurnCutIn.ts';
import { ActingState } from './ActingState.ts';
import { OpeningCallouts } from './OpeningCallouts.ts';
import type { AutoStrategy } from './BattlePresenterPorts.ts';
import type { PlaybackSpeed, PlaybackTrace, PresenterDeps } from './BattlePresenterPorts.ts';
import { defaultSleep, notifyHud, runMidBattleScript, SPEED_SCALE, syncHud } from './BattlePresenterUtil.ts';
import { paceFactor } from './pace.ts';
import { applyEventToVitals, captureVitals, projectState, type VitalsMap } from './BattlePresenterVitals.ts';
import { menuBlocks } from './KeySlots.ts';
import { setMenuHold } from './motion/MenuHold.ts'; // motion pass (lane "core"): the actor-side new looks ask whether an FFX-2 menu holds them back (D-357)

export class BattlePresenterBase {
  protected readonly deps: PresenterDeps;
  protected readonly ctx: EventCtx;
  protected readonly cutIns: TurnCutInBeat; // PR-0005: first turn of each party member
  protected readonly baseSleep: (ms: number) => Promise<void>;
  /** Real elapsed time for the FFX-2 Active pump. Tests inject a fake clock. */
  protected readonly now: () => number;
  /**
   * Set when the Active pump closed a menu whose owner could no longer answer
   * it (KO, Stop, Sleep, Petrify, chain lock, Berserk, battle over). The loop
   * abandons that decision and asks the engine again rather than aborting the
   * battle. **FFX-2 only** — nothing sets it on an FFX fight.
   */
  protected inputAbandoned = false;
  /** Parks and wakes an FFX-2 Wait menu in `runMenuClock` ({@link atbModeChanged}, the menu level). */
  protected readonly menuWake = new MenuWaker();
  /** Tells the HUD when an action is on screen (PR-0157's hook, `ActingState.ts`). */
  protected readonly actingState: ActingState;
  /** PR-0061(a): before the first menu, a callout of lines runs under the fight (`OpeningCallouts.ts`). */
  protected readonly callouts = new OpeningCallouts();

  protected speed: PlaybackSpeed = 'normal';
  protected timeScale: number;
  protected aborted = false;
  protected auto: AutoStrategy | null = null;

  /** Every event played, newest last. The debug API prints this. */
  readonly trace: PlaybackTrace[] = [];
  /** The await the loop is parked on, so a stall names itself in `snapshot()`. */
  protected phase = 'idle';
  /** The command most recently submitted, so a minigame can re-submit it. */
  protected lastCommand: Command | null = null;
  /** Each actor's most recent command: a charged minigame is re-submitted long after it was chosen. */
  protected readonly commandBy = new Map<CombatantId, Command>();
  /**
   * A minigame request that came out of the clock (`tick()`), not out of a `submit()`: FFX-2's Lady
   * Luck reels are Long `CT`, so they ask when the purple bar empties. Parked here until the loop
   * can open the overlay (an open command menu is closed first; FFX-2 only).
   */
  protected deferredMinigame: { who: CombatantId; kind: MinigameKind; params: Record<string, unknown> } | null = null;
  /** A bare re-submit still suspended: this engine needs a human for minigames. */
  protected minigamesNeedOverlay = false;
  /**
   * The engine's own state object, kept so a mid-burst row render has something
   * to splice the shown numbers into. It is the live reference the engine
   * mutates, and the engine does not advance while `play` is running, so during
   * a burst it is exactly the end-of-burst truth.
   */
  protected liveState: BattleState | null = null;
  /**
   * What the status rows have actually been shown, re-seeded from the engine on
   * every full `syncHud` and rolled forward one event at a time inside a burst.
   * See `BattlePresenterVitals.ts` — this is critic round 03 #9.
   */
  protected vitals: VitalsMap | null = null;
  /** Set while a HUD command menu is open, so auto-play can cut in. */
  protected pendingMenu: {
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
    this.ctx.menuOpen = () => this.pendingMenu !== null; // r37 slots: FFX-2 key paintings stand aside for a menu
    setMenuHold(() => menuBlocks(this.ctx)); // the same question for the new smear and KO looks, which a figure decides in its own `setPose` (`motion/MenuHold.ts`; FFX-2 only in effect)
    this.ctx.hpMaxOf = (id) => this.vitals?.get(id)?.maxHp; // `?motion=demo`: a blow's power is its damage against the target's pool
    this.ctx.reveal = async (event) => { // SKILL TRAVEL: the late half of what `playBurst` does before an event (the HUD's look, then the HP rows)
      const was = this.phase;
      this.phase = `hud:${event.type}`;
      await this.notifyHud(event);
      this.presentVitals(event);
      this.phase = was;
    };
    this.actingState = new ActingState(() => this.deps.hud);
    this.cutIns = new TurnCutInBeat({
      moments: deps.moments ?? null,
      speed: () => this.speed,
      // PR-0104 (FFX-2 only): the next girl's cut-in waits for a charging action to play.
      sleep: (ms) => (deps.beatSleep ?? this.baseSleep)(ms), ...(deps.beatNow ? { now: deps.beatNow } : {}), // MF-08: the beat clock (cut-in wait: a frame poll, the cap in beat time)
      acting: () => this.actingState.acting !== null,
      menuFor: () => this.pendingMenu?.actorId ?? null,
    });
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
    this.actingState.cancel();
    this.atbModeChanged();
  }

  get isAborted(): boolean {
    return this.aborted;
  }

  protected sleep(ms: number): Promise<void> {
    if (this.aborted) return Promise.resolve();
    // The pacing switch (`pace.ts`, an option, 1 unless picked) stretches presentation waits only.
    return (this.deps.beatSleep ?? this.baseSleep)(Math.max(0, ms * SPEED_SCALE[this.speed] * this.timeScale * paceFactor('action'))); // MF-08: on the frame clock when the screen hands one
  }

  /** `HudPort.onEvent` may show a transient, but never blocks playback. */
  protected notifyHud(event: BattleEvent): Promise<void> {
    return notifyHud(this.deps.hud, event, this.baseSleep);
  }

  /** Run one mid-battle story script, then resume playback. */
  protected runScript(name: string): Promise<void> {
    return runMidBattleScript(this.deps, name, this.baseSleep);
  }

  /**
   * FFX-2's Config ATB mode may have changed (the pause closed; BattleScreen
   * has already pushed the X-2 BATTLE row into the engine). Wakes an open Wait
   * menu so a flip to Active runs the clock under **that** menu, not only the
   * next one. A no-op when no menu is parked; FFX never parks one.
   */
  atbModeChanged(): void {
    this.menuWake.resumed();
  }

  /** The HUD's mode chip (`HudPort.setAtbMode`). FFX-2 only; never throws. */
  protected showAtbMode(mode: 'wait' | 'active'): void {
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
  protected syncGauges(snapshot: AtbSnapshot): void {
    const hud = this.deps.hud;
    if (!hud?.syncGauges) return;
    try {
      hud.syncGauges(snapshot);
    } catch (err) {
      console.warn('[presenter] HUD syncGauges threw', err);
    }
  }

  /** The engine `run` is driving, for the HUD's queued-command chip (`HudPort.syncQueued`); null before `run`. */
  protected queuedEngine: BattleEngine | null = null;

  /** `HudPort.syncQueued`: which command each girl has charging, right after the submit. Never throws into the loop. */
  protected queuedHud(engine: BattleEngine): void {
    const hud = this.deps.hud;
    if (!hud?.syncQueued) return;
    try {
      hud.syncQueued(engine.state());
    } catch (err) {
      console.warn('[presenter] HUD syncQueued threw', err);
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
  protected seedVitals(engine: BattleEngine): void {
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
  protected presentVitals(event: BattleEvent): void {
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
