/**
 * One first-use line on the battle HUD — approved frames C2 (FFX) and C3
 * (FFX-2), `docs/concepts/onboarding/c-aurons-briefing/`.
 *
 * ## The one thing this file exists to get right
 *
 * The two games teach differently, and the difference is not cosmetic
 * (AGENTS.md hard rule 14, from `research/ffx-vs-ffx2-presentation.md`):
 *
 * | | FFX (chapters 1-3) | FFX-2 (chapters 4-5) |
 * |---|---|---|
 * | voice | Auron | Rikku |
 * | timing | **holds** until one confirm press | **fades on its own**, never holds |
 * | why | the engine is already waiting for the player's command; nothing is running to freeze (§9 row 3) | the gauge is a four-phase pipeline that is filling the whole time, and stopping it to teach is the one thing X-2 never does (§4.2 / FC-4, §4.3 / FC-5) |
 *
 * {@link CoachMark.show} returns a promise, and that promise is the difference:
 * for an FFX line it settles on the confirm press, for an FFX-2 line it settles
 * **immediately** and the element lives out its fade on a timer nobody awaits.
 * A caller that awaits it therefore cannot accidentally hold an X-2 fight, and
 * `tests/unit/ui-coach-layer.test.ts` asserts exactly that against a fake clock
 * and a live engine tick.
 *
 * Input comes from `ui/ffx/rawInput.ts` (keyboard and gamepad, muted while the
 * pause overlay is up) plus a click handler on the element itself, which is how
 * mouse and touch reach it — a tap fires `click`.
 */

import './coach.css';
import type { GameId } from '../../battle/common/types.ts';
import { escapeHtml } from '../common/html.ts';
import { RawInputWatcher } from '../ffx/rawInput.ts';
import type { CoachMark as CoachMarkDef } from './coachCopy.ts';

/** How a line ended. */
export type CoachMarkOutcome = 'confirmed' | 'faded' | 'cancelled';

export interface CoachMarkOptions {
  /** Layer the line is appended to; usually the HUD's own root. */
  root: HTMLElement;
  mark: CoachMarkDef;
  /** Which game's chrome the line wears. Must equal `mark.game`. */
  game: GameId;
  /** True to drop the fades. Read from `Settings.reduceMotion` by the caller. */
  reduceMotion?: boolean;
  /** Injectable clock, so a test can run the fade without waiting 5 seconds. */
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (handle: number) => void;
}

/** Attribute set on `<html>` while any line is up. See `coach.css`. */
const MARK_FLAG = 'coachMark';

export class CoachMark {
  readonly el: HTMLElement;
  private readonly watcher: RawInputWatcher;
  private readonly setTimer: (fn: () => void, ms: number) => number;
  private readonly clearTimer: (handle: number) => void;
  private timer = 0;
  private settle: ((outcome: CoachMarkOutcome) => void) | null = null;
  private done = false;

  constructor(private readonly opts: CoachMarkOptions) {
    this.setTimer = opts.setTimer ?? ((fn, ms) => globalThis.setTimeout(fn, ms) as unknown as number);
    this.clearTimer = opts.clearTimer ?? ((h) => globalThis.clearTimeout(h));

    const el = document.createElement('div');
    el.className = 'coach-mark';
    el.dataset['game'] = opts.game;
    el.dataset['mark'] = opts.mark.id;
    el.dataset['role'] = 'coach-mark';
    if (opts.reduceMotion) el.dataset['still'] = '1';
    el.setAttribute('role', 'status');
    el.innerHTML = this.markup();
    el.addEventListener('click', this.onClick);
    this.el = el;

    this.watcher = new RawInputWatcher((button) => {
      if (button === 'confirm') this.finish('confirmed');
      else if (button === 'cancel') this.finish('cancelled');
    });
  }

  private markup(): string {
    const { mark } = this.opts;
    const running =
      mark.game === 'ffx2'
        ? '<div class="coach-mark__running">Nothing paused &middot; gauges running</div>'
        : '';
    const foot = mark.holds
      ? '<span><b>Enter</b> continue</span><span>First time only</span>'
      : '<span>Fades on its own</span><span>First time only</span>';
    return (
      running +
      `<div class="coach-mark__who">${escapeHtml(mark.speaker)}</div>` +
      `<div class="coach-mark__body">${escapeHtml(mark.body)}</div>` +
      `<div class="coach-mark__foot">${foot}</div>`
    );
  }

  private readonly onClick = (): void => {
    this.finish('confirmed');
  };

  /**
   * Put the line up.
   *
   * **FFX** (`mark.holds`): resolves when the player confirms, cancels, or
   * {@link dismiss} is called from outside. **FFX-2**: resolves on the next
   * microtask with `'faded'` — the element is still on screen and takes itself
   * down `mark.fadeMs` later, so an awaiting caller is never held.
   */
  show(): Promise<CoachMarkOutcome> {
    this.opts.root.appendChild(this.el);
    try {
      document.documentElement.dataset[MARK_FLAG] = '1';
    } catch {
      /* no document element in an exotic host; the line still renders */
    }
    // A frame's grace so the opacity transition has a "from" to run out of.
    this.setTimer(() => this.el.classList.add('coach-mark--in'), 16);
    this.watcher.attach();

    if (!this.opts.mark.holds) {
      this.timer = this.setTimer(() => this.finish('faded'), Math.max(1, this.opts.mark.fadeMs));
      return Promise.resolve('faded');
    }
    return new Promise<CoachMarkOutcome>((resolve) => {
      this.settle = resolve;
    });
  }

  /** Take the line down now. Safe to call twice. */
  dismiss(): void {
    this.finish('cancelled');
  }

  /** True once the line has come down. */
  get finished(): boolean {
    return this.done;
  }

  private finish(outcome: CoachMarkOutcome): void {
    if (this.done) return;
    this.done = true;
    if (this.timer) this.clearTimer(this.timer);
    this.timer = 0;
    this.watcher.detach();
    this.el.removeEventListener('click', this.onClick);
    this.el.classList.remove('coach-mark--in');
    this.el.remove();
    try {
      delete document.documentElement.dataset[MARK_FLAG];
    } catch {
      /* see show() */
    }
    const settle = this.settle;
    this.settle = null;
    settle?.(outcome);
  }
}
