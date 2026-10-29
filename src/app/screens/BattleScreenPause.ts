/**
 * The pause and the input: the presenter's clocks behind the pause gate, when the pause may open, the pause menu and the exit it asks for, how an encounter finishes, the stall watchdog, and the frame's input.
 *
 * `BattleScreen.ts` was one 1,085-line class. It is now a short chain of classes, every layer calling only the layers below it:
 * `BattleScreenBase` (state) -> `BattleScreenPause` (the pause, the input, the stall watch) -> `BattleScreenCard` (the battle-start card) -> `BattleScreenEncounter` (enter, the encounter loop)
 * -> `BattleScreen` (the frame, the debug beats, exit; import that one from `BattleScreen.ts`).
 * A pure move (ChatGPT's point 8b, 2026-10-28; both games): no method changed, only `private` became `protected` where another layer reads it.
 * Source-text tests read the screen's wiring across the whole chain (`tests/unit/helpers/battleScreenSource.ts`).
 */

import type { BattleEngine } from '../../battle/common/types.ts';
import { ff7Standing } from './ff7Standing.ts';
import { audio } from '../../audio/index.ts';
import { BattlePresenter, type BattleOutcome } from '../../engine/BattlePresenter.ts';
import { defaultSleep } from '../../engine/BattlePresenterUtil.ts';
import type { InputSnapshot } from '../Input.ts';
import { setPauseMusic } from '../../ui/common/pauseMusic.ts';
import { voice } from '../../audio/voice/index.ts';
import { applyAtbConfig } from './BattleScreenWiring.ts';
import type { ProStageLayer } from '../../ui/common/proStage/ProStageLayer.ts';
import { setRawInputSuspended } from '../../ui/ffx/rawInput.ts';
import { menuOwnsCancel } from '../../ui/common/menuCancel.ts';
import { coachCardUp } from '../../ui/coach/cardPress.ts'; // R61: a first-use card is up: Esc closes it, the next Esc pauses
import { consumeIntentKeyPress, setIntentSuspended } from '../../ui/common/EnemyIntent.ts';
import { PauseScreen } from './PauseScreen.ts';
import { previewTurnOrder } from './pause/turnOrder.ts';
import { flowOwnsRun } from './pause/restartCarry.ts';
import { StallWatch } from './BattleScreenStall.ts';
import { stopRumble } from '../gamepadRumble.ts'; // a pause or leaving the battle ends a pulse still running (`?rumble=on`; a no-op without a pad)
import { padEndsOpening } from './padOpeningSkip.ts'; // release 62 (PR-0481): a pad's A or Start ends the opening sweep as Enter does
import { withdrawLineFrom } from './withdrawal.ts';
import { sceneScale } from '../../engine/crisp/sceneScale.ts';
import { BattleScreenBase } from './BattleScreenBase.ts';

export abstract class BattleScreenPause extends BattleScreenBase {
  // ------------------------------------------------------------- the pause

  /** The presenter's wall clock behind the pause gate: the ATB pump's wait (the engine reads real time) and its own timeouts. The pause overlay stops `update`, so the presenter
   *  is frozen here, at the one choke point of those awaits, and carries on from exactly there. A field: it is handed over as a bare function. */
  protected readonly pauseGate = async (ms: number): Promise<void> => {
    await defaultSleep(ms);
    while (this.presenterPaused) await new Promise<void>((resolve) => this.pauseWaiters.push(resolve));
  };

  /** MF-08: the presenter's beats (every `ctx.sleep`) counted in the frame clock `update` ticks (`engine/BeatClock.ts`): a pause keeps what was left of a sleep,
   *  a hidden window stops the fight, a long frame delays beat and picture together. */
  protected readonly beatSleep = async (ms: number): Promise<void> => {
    await this.beats.sleep(ms);
    while (this.presenterPaused) await new Promise<void>((resolve) => this.pauseWaiters.push(resolve));
  };

  protected setPresenterPaused(paused: boolean): void {
    this.presenterPaused = paused;
    if (paused) {
      stopRumble();
      return;
    }
    const waiters = this.pauseWaiters;
    this.pauseWaiters = [];
    for (const resolve of waiters) resolve();
  }

  protected readonly onPauseKey = (e: KeyboardEvent): void => {
    if (e.code === 'KeyP' && !e.repeat) this.pauseKeyPressed = true;
  };

  /**
   * Whether the pause menu may open right now.
   *
   * It used to answer `false` for the whole time the HUD was waiting for a
   * command — which is, for a human, nearly all of a battle. That is the bug
   * the player reported on the live site as "Esc and P do nothing": they were
   * pressing them at the command menu, the only place a battle ever waits for
   * them. **A command menu no longer blocks the pause.**
   *
   * What made it a genuine conflict is now handled at the source. Both command
   * menus take the keyboard straight off `window` (`ui/ffx/rawInput.ts`,
   * `ui/ffx2/CommandMenu.ts`), so a pause stacked on one had two screens on the
   * same arrow keys and a Confirm that would resolve a real command from behind
   * the menu. {@link openPause} now claims the keyboard exclusively
   * (`Input.claimKeyboard`, capture phase) and mutes the pad watchers
   * (`setRawInputSuspended`) for as long as the overlay is up, so exactly one
   * screen reads the player at a time.
   *
   * A minigame still blocks it: those are timed inputs, and freezing one
   * mid-swing is a fairness question rather than an input-ownership one.
   *
   * The debug beat `pause:open` ignores even that: a capture tool has no
   * keyboard to lose and wants the menu on a predictable frame.
   */
  protected get canPause(): boolean {
    if (this.pauseScreen || this.app.overlayActive || !this.presenterBound) return false;
    const snap = this.presenter!.snapshot();
    // A minigame overlay owns the keyboard for the same reason a command menu
    // does (`ui/ffx/minigames/**` each attach a `RawInputWatcher`).
    return !String(snap['phase'] ?? '').includes('minigame');
  }

  /**
   * Whether **Esc** in particular may open the pause.
   *
   * Esc is the command menu's own back button — out of targeting, out of a
   * submenu, back to the top row — and that is the FFX behaviour the brief
   * asks to keep. A key cannot mean "out of targeting" and "open the pause" on
   * the same press.
   *
   * But it is only the back button when there is something to go back to.
   * Neither menu binds Esc at its **top row** (`ui/common/menuCancel.ts` has
   * the two call sites), and the top row is exactly where a player sits when
   * they decide to pause — which is why the original report said Esc did
   * nothing. So Esc opens the pause everywhere except in a submenu or while
   * targeting, where it still backs out and `P` / Start / the PAUSE chip are
   * the way in.
   */
  protected get canPauseOnCancel(): boolean {
    if (!this.canPause) return false;
    // R61 (booth, both games): a first-use card is up, so Back belongs to the card (it takes itself down on the same press and absorbs it, `cardPress.ts`).
    // This is the one-frame case the card's own absorb cannot reach: the pad's edge read here before the card's poll has run.
    if (coachCardUp()) return false;
    if (this.presenter?.snapshot()['awaitingMenu'] !== true) return true;
    return !menuOwnsCancel();
  }

  /** PR-0158: a live presenter on a screen still up; nothing pauses a battle loading or torn down. */
  protected get presenterBound(): boolean {
    return !this.exited && this.presenter !== null && !this.presenter.isAborted;
  }

  /** Put the pause menu up over the frozen battle. */
  protected async openPause(): Promise<void> {
    if (this.pauseScreen || this.app.overlayActive || !this.presenterBound) return;
    const chapter = this.opts.chapter;
    const screen = new PauseScreen({
      chapter,
      state: () => this.engine?.state() ?? null,
      // The pause screen's TURN ORDER row, FFX only: `predictTurnOrder` is on
      // the engine's runtime and not on `BattleState`, so the row can only
      // exist if it is handed over here. An FFX-2 engine has no such method
      // and the row is simply not printed (AGENTS.md rule 14; CTB has a queue
      // to be Nth in, ATB has a clock).
      turnOrder: () => previewTurnOrder(this.engine),
      links: () => Math.max(1, this.links),
      chainLength: this.chainLength,
      onPause: (paused) => {
        // FFX-2's X-2 BATTLE (Active/Wait) and ATB SPEED rows, before the
        // clock is released (no-op for FFX).
        if (!paused) applyAtbConfig(this.engine);
        this.setPresenterPaused(paused);
        // ...and wake a menu that was open under the pause, so a flip to
        // ACTIVE runs the clock under that same menu (FFX-2; no-op for FFX).
        if (!paused) this.presenter?.atbModeChanged();
        // The other half of "exactly one screen reads the player": the HUD's
        // pad watchers and the mouse on its DOM. The keyboard is claimed below.
        setRawInputSuspended(paused, this.root);
        // PR-0122: the intent slab mounts in the HUD's unscaled overlay with
        // its own `z-index` (`enemy-intent.css`), which stacks above the
        // pause screen's root regardless of DOM order — so it painted over
        // the pause's close-up, OPTIONS and THIS ENCOUNTER, and survived H.
        // Hidden here, from the same place everything else about the HUD is
        // suspended for the pause, and restored on resume in whatever state
        // the player's own `E` setting left it.
        setIntentSuspended(this.hud, paused);
        // "The game holding its breath" [docs/audio/THEMES.md cue map row 3].
        // The `pause` cue was composed, rendered and shipped, and nothing had
        // ever asked for it (critic round 02 #02). It is wired from here rather
        // than from `PauseScreen.ts` because the fight is what has to be
        // returned to: this screen is the one that knows which boss theme was
        // playing when the menu went up.
        setPauseMusic(audio, paused);
        voice.setPaused(paused); // a mid-battle line freezes with the fight and carries on when the menu closes
      },
      onResume: () => void this.closePause(),
      onRestart: () => this.requestExit('restart'),
      onChapterSelect: () => this.requestExit('chapter-select'),
      onQuitToTitle: () => this.requestExit('title'),
    });
    this.pauseScreen = screen;
    // Write the running total out before the menu reads it, so PLAY TIME is
    // the number on disk and not one flush behind.
    this.app.save.flushPlayTime();
    await this.app.pushOverlay(screen);
  }

  protected async closePause(): Promise<void> {
    if (!this.pauseScreen) return;
    this.pauseScreen = null;
    await this.app.popOverlay();
  }

  /**
   * Leave the encounter for somewhere else.
   *
   * The flow in `BattleScreenFlow.runChapter` is parked on `battle.finished`,
   * and whoever called it navigates *after* it resolves (`main.ts` sends an
   * ended chapter back to chapter select), so this screen cannot simply call
   * `goto()`: the flow's navigation would land a tick later over its own. It
   * aborts, which makes the flow unwind, and waits for the unwind to finish
   * before taking over. CHAPTER SELECT needs nothing more: that is the flow's
   * own follow-up. RESTART and QUIT TO TITLE inside a run are the run's job
   * (PR-0283, r34fix-quit, both games): the result says so; a fight no run owns acts here.
   */
  private requestExit(intent: 'restart' | 'chapter-select' | 'title'): void {
    if (this.exitIntent) return;
    this.exitIntent = intent;
    const app = this.app;
    const chapterId = this.opts.chapter.id;
    const [runRestarts, runQuits] = [intent === 'restart' && flowOwnsRun(app.flow), intent === 'title' && flowOwnsRun(app.flow)];

    void (async () => {
      await this.closePause();
      this.presenter?.abort();
      this.beats.releaseAll();
      this.setPresenterPaused(false);
      this.finish({ kind: 'aborted' }, runRestarts, runQuits);
      if (runRestarts || runQuits) return;
      // Bounded, so a flow that never settles costs one dropped menu action rather than a screen that never returns.
      for (let i = 0; i < 240 && app.current === this; i++) await app.nextFrame();
      if (intent === 'restart') void app.runChapter(chapterId, { skipPrep: true, skipCutscenes: true, restart: true });
      else if (intent === 'title') void app.goto('title');
    })();
  }

  protected finish(outcome: BattleOutcome, restartRequested = false, quitToTitle = false): void {
    const resolve = this.finishedResolve;
    if (!resolve) return;
    this.finishedResolve = null;
    const withdrawLine = outcome.kind === 'escape' ? withdrawLineFrom(this.engine?.state().log) : null;
    resolve({
      chapterId: this.opts.chapter.id,
      outcome: outcome.kind,
      result: 'result' in outcome ? outcome.result : null,
      elapsedMs: Math.round(performance.now() - this.startedAt),
      links: Math.max(1, this.links),
      preview: this.preview,
      ...(this.checkpoint ? { checkpoint: this.checkpoint } : {}),
      ...(withdrawLine ? { withdrawLine } : {}),
      ...ff7Standing(this.engine?.state()),
      ...(restartRequested ? { restartRequested: true as const } : {}), ...(quitToTitle ? { quitToTitle: true as const } : {}),
    });
  }

  // ------------------------------------------------------------------ frame

  /** The watchdog for "won, and then never ends" (`BattleScreenStall.ts`): a decided battle whose playback stalled is resolved from the engine's own result. */
  private readonly stall = new StallWatch();

  protected checkForStall(dt: number): void {
    const outcome = this.stall.check(dt, {
      preview: this.preview,
      presenter: this.presenter,
      engine: this.engine,
      running: this.finishedResolve !== null,
      chapterId: this.opts.chapter.id,
    });
    if (!outcome) return;
    this.presenter?.abort();
    this.beats.releaseAll(); // nothing stays parked on a beat of an aborted presenter
    this.setPresenterPaused(false);
    this.finish(outcome);
  }

  override handleInput(input: InputSnapshot): void {
    // The battle-start card is the first thing on screen and the first thing
    // any press takes down — it must never hold a player longer than they want
    // it to. It consumes that press so the same tap does not also open the
    // pause or answer a command menu behind it.
    if (this.battleStartBanner?.visible) {
      const pressed =
        input.consume('confirm') || input.consume('cancel') || input.consume('start') || this.pauseKeyPressed;
      this.pauseKeyPressed = false;
      if (pressed) this.battleStartBanner.dismiss();
      return;
    }

    // Release 62 (PR-0481, the conference booth; both games): the opening sweep ends on the player's first Confirm, and its watch is the keyboard's (`ui/common/transitions/confirmPress.ts`).
    // The pad is polled here, so a pad's A or Start ends the beat the same way, and the press is taken (Start must not also open the pause: the card above treats it the same). Keys are unchanged.
    padEndsOpening(input, this.momentOverlay);

    // The offering screen (the hidden Last Summoning) takes the arrows and the confirm; the pause keys below still work, and Esc does not (a choice has no back).
    const offering = this.offering?.visible === true;
    if (offering) this.offering!.handleInput(input);

    // A mid-battle beat owns the input while it is on screen.
    this.cutscenes?.handleInput(input);

    // The four ways into the pause menu: `P`, the pad's Start/Options button
    // (`start`, which `app/Input.ts` also maps to E and C), a click on the
    // PAUSE chip, and Esc/Circle.
    //
    // The first three work at any point in a battle, the command menu included
    // — that is the reported bug's fix. Esc is the one that has to wait: it is
    // also the command menu's back button, and a key cannot mean "out of
    // targeting" and "open the pause" on the same press. See `canPauseOnCancel`.
    //
    // `consume` takes the edge so nothing below sees the same press.
    // `E` is one of the three keys `Input.ts` maps to `start`, and it is also
    // the enemy-intent slab's hide/show key. The slab's own `keydown` listener
    // records the press; taking the `start` edge for it here is what stops one
    // tap of E both hiding the slab and opening the pause. `P`, `C`, Esc, the
    // pad's Start button and the PAUSE chip are all untouched.
    if (consumeIntentKeyPress()) input.consume('start');
    const chipClicked = input.actions.includes('pause:open');
    const wantsPause = this.pauseKeyPressed || chipClicked || input.justPressed('start');
    this.pauseKeyPressed = false;
    if (wantsPause && this.canPause) {
      input.consume('start');
      audio.playSfx('menu-open');
      void this.openPause();
      return;
    }
    if (input.justPressed('cancel') && this.canPauseOnCancel && !offering) {
      input.consume('cancel');
      audio.playSfx('menu-open');
      void this.openPause();
      return;
    }

    // Fast-forward is held, not toggled: the FFX convention.
    if (input.justPressed('r1')) this.presenter?.fastForward();
    if (input.justReleased('r1')) this.presenter?.setSpeed('normal');
  }

  /** The live engine, for the debug API's `forceCommand` / `snapshotState`. */
  get battleEngine(): BattleEngine | null {
    return this.engine;
  }

  get battlePresenter(): BattlePresenter | null {
    return this.presenter;
  }

  /** The pro staging's layer (Chapters I and IV with the switch on), for the debug API and the captures. */
  get stagingLayer(): ProStageLayer | null {
    return this.proStage;
  }

  protected offSceneScale: (() => void) | null = null;

  protected syncPixelScale(): void {
    const h = (this.app.renderer.domElement.height || 900) * sceneScale(); // a supersampled scene pass draws point sprites on a finer grid (`crisp/sceneScale.ts`)
    this.scene?.setPixelScale(Math.max(0.5, h / 900));
  }
}
