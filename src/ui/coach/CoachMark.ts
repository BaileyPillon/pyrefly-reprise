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
import { CHAPTER_PANEL_SELECTORS, INTENT_AVOID_SELECTORS, rectsOf } from '../ffx/hudAvoidSelectors.ts';
import { bandClearOf, clearOfPanels, slideClearOf } from './coachAvoid.ts';
import { coachRunningBadge, type CoachMark as CoachMarkDef } from './coachCopy.ts';
import { ffx2CoachClock } from './coachState.ts';

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

/**
 * Which game's line is up, alongside {@link MARK_FLAG}.
 *
 * `coach.css` reads this rather than `data-game` on the mark element itself,
 * because a descendant selector cannot reach back up to a sibling: the mark
 * lives in its own `.coach-layer`, and the element it has to gate (`.mad__card`)
 * is inside the HUD's own tree beside it, not under it. FOC-01 stopped FFX from
 * hiding the advisor card while its line is up (the approved c2-first-use-ffx
 * tile shows both), but FFX-2's line still sits low enough to meet the card's
 * own bottom-centre band, so that half of REQUIRED 4 stays FFX-2 only.
 */
const MARK_GAME_FLAG = 'coachMarkGame';

/**
 * The keys `ui/ffx/rawInput.ts` reads as **confirm**.
 *
 * Kept here rather than imported because this list is used for the opposite
 * purpose: not to act on a press, but to make sure nobody else does.
 */
const CONFIRM_KEYS = new Set(['Enter', 'NumpadEnter', 'Space', 'KeyZ']);

/** The command stack and its help strip: the line slides right of them, as `slideClearOf` does. */
const SIDE_PANELS: readonly string[] = ['.ig-cmd-stack', '.ffx-cmd-info'];
/** Every other panel the intent slab keeps off (`hudAvoidSelectors.ts`): the gauge solve's cost. */
const SOFT_PANELS: readonly string[] = INTENT_AVOID_SELECTORS.filter(
  (s) => s !== '.mad__card' && !SIDE_PANELS.includes(s) && !(CHAPTER_PANEL_SELECTORS as readonly string[]).includes(s),
);

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
    // **The approved mockup's words, restored now that they are true.**
    //
    // The C3 badge was written as "Nothing paused · gauges running" and then
    // demoted to "Keep playing · nothing to press", because an adversarial
    // pass measured the opposite on the running game: the presenter awaited
    // `HudPort.chooseCommand` and the FFX-2 engine was ticked only in its
    // `waiting` branch, so the gauges stood still during command input
    // (round 05 PR-0046: `ticks` 8189 -> 8189 over 2013 ms, and `?coach=off`
    // behaved identically). Approved copy is not edited to fit a build, and a
    // build is not rushed to unlock copy, so the claim was narrowed to
    // something this layer could keep on its own.
    //
    // Bailey settled the underlying question on 2026-09-21 — *"For ffx-2 I
    // choose active"* (`docs/target/decisions.json` D-009) — and the clock now
    // genuinely runs under an open menu (`src/engine/BattlePresenterActive.ts`).
    // Measured on the shipped build at 1600x900, same read, same chapter:
    // **8189 -> 11344 over 2445 ms**, with the FFX control still 0 -> 0. The
    // engine claim is true, so the approved words come back for that mode.
    //
    // Round 09 PR-0046 (reopened): D-029 made Wait the default again, and the
    // engine holds the clock while a command menu is open under Wait — the
    // opposite of what the words above say. The badge is now mode-aware
    // (`coachRunningBadge` in `coachCopy.ts`), read at show time so a flip in
    // the same pause session is honoured, the same way the briefing's fourth
    // line already reads `ffx2AtbMode()` (`Briefing.ts`). Since the Wait split
    // became the default (D-029 follow-up 2) the clock runs on the top-level
    // list and holds once a list is open, and the Wait badge says so in
    // Bailey's words (D-121, reworded by D-136 on 2026-09-25 to stop calling
    // the command menu a list): "Gauges running · a command holds them" (the
    // pre-split badge under `?wait=hold`, where the top-level list holds too).
    // FFX-2 only: FFX is CTB and its line holds the menu by design.
    const running =
      mark.game === 'ffx2'
        ? `<div class="coach-mark__running">${coachRunningBadge(ffx2CoachClock())}</div>`
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
   * **An overlay's dismissing press dies with the overlay** (the rule this
   * build adopted in e30ea5e), now for both games' lines.
   *
   * The menu is open in the same turn of the event loop as the line for FFX
   * and FFX-2 alike (FOC-01), and both the line's own watcher and the command
   * menu's read `keydown` off `window`. FFX-2 hit this first: one Enter used to
   * clear the line *and* open the White Magic submenu the player never asked
   * for (PR-0051). Leaving FFX's `mark.holds` line off this list had the same
   * bug waiting for the day its menu stopped being gated behind the promise —
   * which is exactly what FOC-01's fix does.
   *
   * So every line takes the confirm key, and only the confirm key, in the
   * capture phase: the press that takes it down reaches nothing else. Every
   * other key — arrows, cancel, the pause keys — is untouched, so the line
   * still blocks no input and a holding FFX line still waits for its own next
   * confirm rather than resolving twice.
   */
  private readonly onConfirmCapture = (e: KeyboardEvent): void => {
    if (this.done) return;
    // A line whose HUD was torn down around it (a screen change, a test that
    // dropped the root) is not on screen, so it has no press to claim.
    if (!this.el.isConnected) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat || !CONFIRM_KEYS.has(e.code)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
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
      document.documentElement.dataset[MARK_GAME_FLAG] = this.opts.game;
    } catch {
      /* no document element in an exotic host; the line still renders */
    }
    // FOC-05: an immediate check, so a screenshot taken before the next
    // `update()` tick (see `recheckPosition`) still shows the line clear.
    if (this.opts.game === 'ffx') this.avoidAdvisorCard();
    // A frame's grace so the opacity transition has a "from" to run out of.
    this.setTimer(() => this.el.classList.add('coach-mark--in'), 16);
    // **Both games now, not only the ones that never hold (FOC-01).** Since
    // `CoachLayer.chooseCommand` opens the real menu in the same turn of the
    // event loop as this line for FFX too, the FFX menu's own `RawInputWatcher`
    // is listening on `window` for the very same press. Without this, the
    // Enter that dismisses Auron's line would also fall through to whatever
    // row the menu opens on — whatever `chooseTop(this.topIndex)` does for a
    // menu the player has not looked at yet. Registered before `this.watcher`,
    // so that on a host where the event is dispatched straight at `window` (a
    // jsdom test) registration order gives the same answer the capture phase
    // gives in a browser (see `onConfirmCapture`'s own comment).
    window.addEventListener('keydown', this.onConfirmCapture, true);
    this.watcher.attach();

    if (!this.opts.mark.holds) {
      this.timer = this.setTimer(() => this.finish('faded'), Math.max(1, this.opts.mark.fadeMs));
      return Promise.resolve('faded');
    }
    return new Promise<CoachMarkOutcome>((resolve) => {
      this.settle = resolve;
    });
  }

  /**
   * FOC-05, called every frame while an FFX line is up (`CoachLayer.update`):
   * `MoveAdvisor.layout()` re-solves `.mad__card`'s box against the party and
   * the boss on its own schedule, not once when the menu opens, so the card
   * measured the instant this line was created (a still-default CSS
   * position, or last turn's box) is not the card this line has to clear by
   * the time a player actually looks at the screen. Re-checking on every tick
   * — cheap, two `getBoundingClientRect()` calls and some arithmetic — keeps
   * the line correct against whatever the card is doing right now, rather
   * than pinning it to what the card was doing when `show()` ran.
   */
  recheckPosition(): void {
    if (this.opts.game === 'ffx' && !this.done) this.avoidAdvisorCard();
  }

  /**
   * Give this line its own band clear of `.mad__card`, without touching the
   * card. `this.opts.root` is `CoachLayer`'s `.coach-layer`, appended as a
   * sibling of the HUD's own stage under the same host element
   * `CoachedHud.mount` was given — the same element `MoveAdvisor`'s card
   * mounts into (`FFXBattleHud.mount`, both `position: absolute; inset: 0`
   * over it) — so `getBoundingClientRect()` on both puts them in one
   * coordinate space with no conversion. No-op when the card is not on
   * screen (an FFX-2 host, or a declined advisor zone with nothing to clear).
   */
  private avoidAdvisorCard(): void {
    const host = this.opts.root.parentElement;
    const card = host?.querySelector<HTMLElement>('.mad__card');
    if (!host) return;
    if (card) this.clearCard(host, card);
    this.avoidZanmatoGauge(host);
  }

  private clearCard(host: HTMLElement, card: HTMLElement): void {
    const hostRect = host.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const moved = bandClearOf(this.el.getBoundingClientRect(), cardRect, hostRect);
    if (moved) this.el.style.top = `${moved.top - hostRect.top}px`;
    // Below the card the line can graze the command stack's right tips: slide it clear.
    const stack = host.querySelector<HTMLElement>('.ig-cmd-stack');
    if (!stack || stack.hidden || stack.offsetWidth === 0) return;
    const slid = slideClearOf(this.el.getBoundingClientRect(), stack.getBoundingClientRect(), cardRect, hostRect);
    if (slid) this.el.style.left = `${slid.left - hostRect.left}px`;
  }

  /**
   * FFX only, Chapter IX only: keep off Yojimbo's Zanmato gauge panel (and its
   * banner while up) as well as the card, least on every other HUD panel
   * (`clearOfPanels`). With no gauge on screen `rectsOf` finds nothing and this
   * returns before touching the line, so every other battle places as before.
   */
  private avoidZanmatoGauge(host: HTMLElement): void {
    const gauge = rectsOf(host, CHAPTER_PANEL_SELECTORS); // and Chapter XII's disc strip and intent line
    if (!gauge.length) return;
    const now = this.el.getBoundingClientRect();
    const stage = host.getBoundingClientRect();
    const hard = [...gauge, ...rectsOf(host, ['.mad__card'])];
    // Asked every frame: the help strip and the advisor's chip move after the
    // line goes up, and the solve only ever moves to a strictly clearer place.
    const moved = clearOfPanels(now, hard, rectsOf(host, SOFT_PANELS), rectsOf(host, SIDE_PANELS), stage);
    if (!moved) return;
    // Deltas, not absolutes: the phone rule centres the line with a translate.
    const style = getComputedStyle(this.el);
    this.el.style.top = `${parseFloat(style.top) + moved.top - now.top}px`;
    this.el.style.left = `${parseFloat(style.left) + moved.left - now.left}px`;
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
    window.removeEventListener('keydown', this.onConfirmCapture, true);
    this.el.removeEventListener('click', this.onClick);
    this.el.classList.remove('coach-mark--in');
    this.el.remove();
    try {
      delete document.documentElement.dataset[MARK_FLAG];
      delete document.documentElement.dataset[MARK_GAME_FLAG];
    } catch {
      /* see show() */
    }
    const settle = this.settle;
    this.settle = null;
    settle?.(outcome);
  }
}
