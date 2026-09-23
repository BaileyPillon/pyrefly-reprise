/**
 * Auron's briefing — the approved end state C1,
 * `docs/concepts/onboarding/c-aurons-briefing/c1-briefing.png`.
 *
 * Bailey's words on 2026-09-20: *"Twenty skippable seconds in the game's own
 * voice (Auron's painting, four lines framing both clocks), then one whispered
 * line the first time something is real; FFX-2 lines come from Rikku with
 * nothing paused; replayable from pause."*
 *
 * ## What the frame is promising, and where each promise is kept here
 *
 * | promise | kept by |
 * |---|---|
 * | the game's own voice, four lines, both clocks | `BRIEFING_LINES` in `coachCopy.ts` |
 * | Auron's **approved** painting | `art/characters/auron/idle.png`, framed by CSS only — nothing is generated, recropped or regraded (AGENTS.md hard rule 9, Part C) |
 * | twenty seconds | {@link BRIEFING_MS}, drawn as a running rule |
 * | skippable **from the first frame** | {@link Briefing.skip} is live before the opening fade finishes, on keyboard, mouse, touch and gamepad |
 * | never show this again | its own control, which writes the player's switch off for good |
 * | replayable | the caller decides; pause and the title both do |
 *
 * ## Game-aware: both
 *
 * This is the one shared surface, and it is the only place the two clocks are
 * named side by side — which is exactly why it is shared. A friend who has
 * played neither game needs to know FFX and FFX-2 are different games before a
 * board that mixes chapters from both makes any sense
 * (`docs/plans/onboarding-review.md`, "Missing"). Nothing in it is FFX-only or
 * FFX-2-only; the per-game teaching is `CoachLayer.ts`'s job.
 *
 * ## Input: the briefing owns it, and the press that ends it dies with it
 *
 * The first build got this wrong, and an adversarial pass caught it on the
 * running game: the claim stopped the DOM **event**, but `app/Input.ts` still
 * latched the abstract **button**, so one frame later the screen behind acted
 * on the same press — Enter carried a first-timer past the chapter board into
 * party prep, Escape backed the board out to the title, and the pause replay
 * re-raised itself forever.
 *
 * So the claim is now `exclusive` (`app/Input.ts`, `claimKeyboard`): while the
 * briefing is up nothing behind it is told about any button, and the frame
 * after it hands input back every edge is dropped. Mouse and touch arrive as
 * `click` on the element, which stops there too. Gamepad arrives from the
 * briefing's **own** watcher, which ignores the global HUD mute — that mute is
 * what protects the fight from the pause menu, and the briefing is the overlay
 * it is being protected from, so a pad must still be able to take it down when
 * it is replayed from pause.
 */

import './coach.css';
import { artUrl } from '../../engine/PaintedArt.ts';
import { escapeHtml } from '../common/html.ts';
import { RawInputWatcher } from '../ffx/rawInput.ts';
import { BRIEFING_MS, BRIEFING_SPEAKER, briefingLines } from './coachCopy.ts';
import { ffx2AtbMode, markSeen, setBattleHelp } from './coachState.ts';

/** How the briefing ended. */
export type BriefingOutcome = 'finished' | 'skipped' | 'never-again';

export interface BriefingOptions {
  /** Where the briefing mounts. Usually `app.uiRoot`. */
  root: HTMLElement;
  /**
   * `app.input.claimKeyboard`, bound. Optional so a unit test can run without
   * an `App`; when absent the briefing listens on `window` itself.
   */
  claimKeyboard?: (onKey: (e: KeyboardEvent) => void) => () => void;
  /** Drop the fades. Defaults to `Settings.reduceMotion`, passed by the caller. */
  reduceMotion?: boolean;
  /** Injectable clock for the twenty seconds. */
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (handle: number) => void;
  setInterval?: (fn: () => void, ms: number) => number;
  clearInterval?: (handle: number) => void;
  /** Total run time; only a test changes it. */
  durationMs?: number;
}

/** How often the rule under the text is redrawn. */
const TICK_MS = 200;

/**
 * The one key that turns the teaching off for good, and the label beside it.
 *
 * **Exactly one**, and the one the approved C1 frame prints: "D NEVER SHOW
 * THIS AGAIN". The first build fired it on ShiftLeft, ShiftRight, Tab *and* Q
 * while advertising only Shift (PR-0049). Tab was the one that mattered: the
 * two chips are `role="button" tabindex="0"`, so a keyboard or switch player
 * reaching for the chip they wanted wrote a permanent preference on the first
 * press, with no confirmation and no trace. A persisted choice is made by the
 * key the screen names or by the chip, and by nothing else.
 */
const NEVER_KEY = 'KeyD';
const NEVER_KEY_LABEL = 'D';

/** Keys that activate whichever chip has focus, as a native button would. */
const ACTIVATE_KEYS = new Set(['Enter', 'NumpadEnter', 'Space']);

/** Keys that are nothing but a modifier: they neither skip nor opt out. */
const MODIFIER_KEYS = new Set([
  'ShiftLeft',
  'ShiftRight',
  'ControlLeft',
  'ControlRight',
  'AltLeft',
  'AltRight',
  'MetaLeft',
  'MetaRight',
  'CapsLock',
]);

export class Briefing {
  readonly el: HTMLElement;
  private readonly watcher: RawInputWatcher;
  private readonly duration: number;
  private readonly setTimer: (fn: () => void, ms: number) => number;
  private readonly clearTimer: (handle: number) => void;
  private readonly setTick: (fn: () => void, ms: number) => number;
  private readonly clearTick: (handle: number) => void;
  private releaseKeyboard: (() => void) | null = null;
  private onWindowKey: ((e: KeyboardEvent) => void) | null = null;
  private endTimer = 0;
  private tickTimer = 0;
  private elapsed = 0;
  private settle: ((outcome: BriefingOutcome) => void) | null = null;
  private done = false;

  constructor(private readonly opts: BriefingOptions) {
    this.duration = opts.durationMs ?? BRIEFING_MS;
    this.setTimer = opts.setTimer ?? ((fn, ms) => globalThis.setTimeout(fn, ms) as unknown as number);
    this.clearTimer = opts.clearTimer ?? ((h) => globalThis.clearTimeout(h));
    this.setTick = opts.setInterval ?? ((fn, ms) => globalThis.setInterval(fn, ms) as unknown as number);
    this.clearTick = opts.clearInterval ?? ((h) => globalThis.clearInterval(h));

    const el = document.createElement('div');
    el.className = 'coach-brief ig';
    el.dataset['role'] = 'coach-briefing';
    if (opts.reduceMotion) el.dataset['still'] = '1';
    el.innerHTML = this.markup();
    el.addEventListener('click', this.onClick);
    this.el = el;

    // `ignoreSuspend`: see the input note at the top of the file. The pause
    // menu mutes every other watcher, and the briefing is replayable from the
    // pause menu, so this one has to keep reading the pad.
    this.watcher = new RawInputWatcher(
      (button) => {
        if (button === 'confirm' || button === 'cancel') this.skip();
        else if (button === 'triangle') this.neverAgain();
      },
      { ignoreSuspend: true },
    );
  }

  private markup(): string {
    const bg = artUrl('art/backdrops/dreams-end.png');
    const figure = artUrl('art/characters/auron/idle.png');
    const seconds = Math.round(this.duration / 1000);
    return `
      <img class="coach-brief__bg" alt="" src="${bg}" onerror="this.style.display='none'">
      <div class="coach-brief__grade"></div>
      <img class="coach-brief__figure" alt="" src="${figure}" onerror="this.style.display='none'">
      <div class="coach-brief__text">
        <div class="coach-brief__who">${escapeHtml(BRIEFING_SPEAKER)}</div>
        <div data-role="coach-brief-lines"></div>
      </div>
      <div class="coach-brief__timer"><i data-role="coach-brief-fill"></i></div>
      <div class="coach-brief__foot">
        <span data-action="briefing:skip" role="button" tabindex="0"><b>Enter / Esc</b> Skip &mdash; ${seconds} seconds, once</span>
        <span data-action="briefing:never" role="button" tabindex="0"><b>${NEVER_KEY_LABEL}</b> Never show this again</span>
      </div>
    `;
  }

  // ----------------------------------------------------------------- input

  private readonly onClick = (e: Event): void => {
    // The briefing's own clicks stop here. `app/Input.ts` delegates `click` on
    // `[data-action]` from the UI root, and a queued `briefing:skip` would be
    // handed to whatever screen is behind on its next frame.
    e.stopPropagation();
    const target = e.target as HTMLElement | null;
    const action = target?.closest<HTMLElement>('[data-action]')?.dataset['action'];
    if (action === 'briefing:never') this.neverAgain();
    else this.skip();
  };

  /**
   * Keyboard, from whichever route reached us — the exclusive claim in a real
   * `App`, or our own capture listener in a harness that has no `Input`.
   *
   * The order is the whole point (PR-0049):
   *
   * 1. a **modifier alone** does nothing at all — it is half a chord, not a
   *    decision, and the old build read Shift as "never again";
   * 2. **Tab** moves focus between the two chips and leaves the briefing up,
   *    which is how a keyboard or switch player reaches the control they want;
   * 3. **Enter / Space** activates the focused chip, as a real button would;
   * 4. **{@link NEVER_KEY}**, the key the approved frame prints, opts out;
   * 5. anything else skips — the briefing is skippable from the first frame.
   */
  private readonly onKey = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (MODIFIER_KEYS.has(e.code)) return;
    if (e.code === 'Tab') {
      // `app/Input.ts` already calls preventDefault() on Tab, so native focus
      // movement is not available to us even when we would want it.
      e.preventDefault();
      this.moveFocus(e.shiftKey ? -1 : 1);
      return;
    }
    if (ACTIVATE_KEYS.has(e.code) && this.focusedAction() === 'briefing:never') {
      e.preventDefault();
      this.neverAgain();
      return;
    }
    if (e.code === NEVER_KEY) {
      e.preventDefault();
      this.neverAgain();
      return;
    }
    this.skip();
  };

  /** The two footer chips, in reading order. */
  private chips(): HTMLElement[] {
    return Array.from(this.el.querySelectorAll<HTMLElement>('[data-action]'));
  }

  /** Which chip, if any, the player has focused. */
  private focusedAction(): string | undefined {
    const active = document.activeElement as HTMLElement | null;
    if (!active || !this.el.contains(active)) return undefined;
    return active.closest<HTMLElement>('[data-action]')?.dataset['action'];
  }

  private moveFocus(step: 1 | -1): void {
    const chips = this.chips();
    if (chips.length === 0) return;
    const at = chips.findIndex((c) => c === document.activeElement);
    const next = at < 0 ? (step > 0 ? 0 : chips.length - 1) : (at + step + chips.length) % chips.length;
    chips[next]?.focus();
  }

  // ------------------------------------------------------------------ life

  /**
   * The four lines, for the X-2 clock the save holds **now** (D-029 follow-up 3):
   * Bailey's approved fourth line under ACTIVE, the Wait line under WAIT.
   */
  private renderLines(): void {
    const box = this.el.querySelector<HTMLElement>('[data-role="coach-brief-lines"]');
    if (!box) return;
    box.innerHTML = briefingLines(ffx2AtbMode())
      .map(
        (l) =>
          `<div class="coach-brief__line">${escapeHtml(l.lead)}` +
          (l.strong ? `<b>${escapeHtml(l.strong)}</b>` : '') +
          `${escapeHtml(l.tail)}</div>`,
      )
      .join('');
  }

  /** Put the briefing up. Resolves when it ends, however it ends. */
  show(): Promise<BriefingOutcome> {
    this.renderLines();
    this.opts.root.appendChild(this.el);
    this.setTimer(() => this.el.classList.add('coach-brief--in'), 16);

    if (this.opts.claimKeyboard) this.releaseKeyboard = this.opts.claimKeyboard(this.onKey);
    else {
      // No `App` to claim through, so stand in for it: capture, and stop the
      // event dead. Without that the pad watcher below — which maps Shift and
      // Q to Triangle — would reach `neverAgain()` behind {@link onKey}'s back
      // and PR-0049 would still be true off the claim path. A real `App` stops
      // the event in `Input.onKeyDown` for the same reason.
      this.onWindowKey = (e: KeyboardEvent): void => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.stopImmediatePropagation();
        this.onKey(e);
      };
      window.addEventListener('keydown', this.onWindowKey, true);
    }
    this.watcher.attach();

    this.tickTimer = this.setTick(() => this.tick(), TICK_MS);
    this.endTimer = this.setTimer(() => this.finish('finished'), this.duration);
    this.draw();
    return new Promise<BriefingOutcome>((resolve) => {
      this.settle = resolve;
    });
  }

  private tick(): void {
    this.elapsed = Math.min(this.duration, this.elapsed + TICK_MS);
    this.draw();
  }

  private draw(): void {
    const fill = this.el.querySelector<HTMLElement>('[data-role="coach-brief-fill"]');
    if (fill) fill.style.width = `${((this.elapsed / this.duration) * 100).toFixed(1)}%`;
  }

  /** Take it down, but leave it able to play again from pause or the title. */
  skip(): void {
    this.finish('skipped');
  }

  /**
   * Take it down **and turn the teaching off for good**.
   *
   * Writes the player's own switch, not just the seen-set, so the first-use
   * lines go with it: somebody who says "never show this again" on the first
   * screen is not asking to be whispered at three chapters later. The switch
   * stays reachable in pause, so it is a decision, not a trap.
   */
  neverAgain(): void {
    setBattleHelp(false);
    this.finish('never-again');
  }

  private finish(outcome: BriefingOutcome): void {
    if (this.done) return;
    this.done = true;
    // Seen is seen, however it ended: a skip still counts, or a player who
    // pressed Escape once would meet the briefing again on the next launch.
    markSeen('briefing');
    if (this.endTimer) this.clearTimer(this.endTimer);
    if (this.tickTimer) this.clearTick(this.tickTimer);
    this.endTimer = 0;
    this.tickTimer = 0;
    this.watcher.detach();
    this.releaseKeyboard?.();
    this.releaseKeyboard = null;
    if (this.onWindowKey) window.removeEventListener('keydown', this.onWindowKey, true);
    this.onWindowKey = null;
    this.el.removeEventListener('click', this.onClick);
    this.el.classList.remove('coach-brief--in');
    this.el.remove();
    const settle = this.settle;
    this.settle = null;
    settle?.(outcome);
  }

  /** True once the briefing has come down. */
  get finished(): boolean {
    return this.done;
  }
}
