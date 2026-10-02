/**
 * Bailey's pick D-290 for the Sphere Grid tab: **A** the first-time explainer
 * card and **C** AUTO-LEARN with UNDO / KEEP
 * (`docs/concepts/fb-0929/sphere/option-a-explainer.jpg`,
 * `option-c-autolearn.jpg`; preflight `docs/plans/sphere-ac-review.md`).
 * FFX only: the Sphere Grid is FFX's levelling board.
 *
 * Placement. On a desktop both cards sit on the prep stage (the 640x360
 * board every Ink & Gold screen is authored on), so the target's 1600x900
 * coordinates map straight across. At phone width that board is shown
 * letterboxed at about 0.61 and its buttons end up 7 px tall, so there the
 * cards mount on the unscaled `.prep` layer instead, at readable sizes with
 * 44 px buttons, and a dock under the board carries AUTO-LEARN and `?` at
 * 44 px. The tab's own phone layout is untouched (option B, the phone page,
 * is D-295, later).
 *
 * Keys (F6 / PR-0292, FFX only; no existing binding changes): AUTO-LEARN is the
 * `select` button (M or V, the pad's Select/Back) and `?` is H (or the `?` key,
 * or the pad's X / Square, read straight off the pad: `Input.ts` has no abstract
 * button left for it). Both are labelled on the desktop buttons.
 *
 * "Seen" is the existing coaching list (`coachState.markSeen`, the save's
 * `seenCoach`), id {@link CARD_ID}: no new save field. Like every coaching
 * surface it is suppressed by `?coach=off` and by BATTLE HELP OFF.
 */

import type { InputSnapshot } from '../../../app/Input.ts';
import { PHONE_PREP_QUERY } from '../../../app/screens/party-prep/phonePrep.ts';
import { audio } from '../../../audio/index.ts';
import { markSeen, shouldShow } from '../../coach/coachState.ts';
import { autoLearn, restoreGrid, type AutoLearnResult } from './sphereGridAutoLearn.ts';
import { dockHtml, explainerHtml, resultHtml } from './sphereGridHelpCards.ts';
import type { SphereGridModel } from './sphereGridModel.ts';
import type { SphereGridView } from './SphereGridView.ts';
import './sphere-grid-help.css';
import './sphere-grid-help-phone.css';

/** The coaching id the explainer is recorded under once it has been shown. */
export const CARD_ID = 'sphere-grid-card';

export interface SphereGridHelpDeps {
  /** The panel's own container (inside the prep stage). */
  container: HTMLElement;
  model(): SphereGridModel | null;
  view(): SphereGridView | null;
  memberId(): string;
  memberName(): string;
  /** Redraw the header, the pouch and the caption. */
  refresh(): void;
  /** One line in the caption, as the grid's own actions report. */
  say(message: string, ok: boolean): void;
}

function isPhone(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(PHONE_PREP_QUERY).matches;
}

export class SphereGridHelp {
  private card: HTMLElement | null = null;
  private result: HTMLElement | null = null;
  private dock: HTMLElement | null = null;
  private last: AutoLearnResult | null = null;
  /** Which of the open card's two buttons Enter presses. */
  private choice = 0;
  private readonly hideWatch: MutationObserver | null = null;
  /** `?` was pressed (H, `?`) since the last frame; read once by {@link takeHelpKey}. */
  private helpKey = false;
  private padHelpDown = false;
  private padLabels = false;
  private readonly onHelpKey = (e: KeyboardEvent): void => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || this.deps.container.closest('[hidden]')) return; // another tab's H is not ours
    if (e.code === 'KeyH' || e.key === '?') this.helpKey = true;
  };

  constructor(private readonly deps: SphereGridHelpDeps) {
    const outer = this.outer();
    if (outer) {
      this.dock = document.createElement('div');
      this.dock.className = 'sgx-dock';
      this.dock.innerHTML = dockHtml();
      this.dock.addEventListener('click', this.onClick);
      outer.appendChild(this.dock);
    }
    window.addEventListener('keydown', this.onHelpKey);
    // Leaving the tab settles an open result as KEPT, so its UNDO can never
    // roll back something another tab changed meanwhile.
    if (typeof MutationObserver === 'function') {
      this.hideWatch = new MutationObserver(() => {
        if (this.deps.container.closest('[hidden]')) this.keep(false);
      });
      this.hideWatch.observe(deps.container, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  /** The unscaled prep layer (`.prep`), and the 640x360 board inside it (`.prep__stage`). */
  private outer(): HTMLElement | null {
    return this.deps.container.closest<HTMLElement>('.prep');
  }
  private host(): HTMLElement | null {
    if (isPhone()) return this.outer() ?? this.deps.container;
    return this.deps.container.closest<HTMLElement>('.prep__stage') ?? this.deps.container;
  }

  private layer(kind: 'card' | 'result', html: string): HTMLElement | null {
    const host = this.host();
    if (!host) return null;
    const el = document.createElement('div');
    el.className = `sgx-layer sgx-layer--${kind}${isPhone() ? ' sgx-layer--phone' : ''}`;
    el.innerHTML = html;
    el.addEventListener('click', this.onClick);
    host.appendChild(el);
    return el;
  }

  /** True while the explainer is open: it takes every key and the pointer. */
  get modal(): boolean {
    return this.card !== null;
  }

  /** The node ids the last AUTO-LEARN activated, while its result is open (for tests and probes). */
  get pending(): AutoLearnResult | null {
    return this.last;
  }

  // ------------------------------------------------------------- A: card

  /** Open the explainer if this player has never seen it (the tab's first mount). */
  maybeShowFirstTime(): void {
    if (shouldShow(CARD_ID)) this.openCard();
  }

  openCard(): void {
    if (this.card) return;
    this.keep(false);
    this.card = this.layer('card', explainerHtml(this.deps.memberName()));
    this.choice = 0;
    this.paintChoice();
  }

  private closeCard(show: boolean): void {
    if (!this.card) return;
    this.card.remove();
    this.card = null;
    markSeen(CARD_ID);
    audio.playSfx('confirm');
    if (show) {
      const view = this.deps.view();
      view?.recentre();
    }
    this.deps.refresh();
  }

  // ----------------------------------------------------------- C: result

  runAutoLearn(): void {
    const model = this.deps.model();
    const view = this.deps.view();
    const id = this.deps.memberId();
    if (!model || !view || !id) return;
    // A second press keeps the first batch and carries on from there.
    this.keep(false);
    const r = autoLearn(model, id);
    if (!r) {
      this.deps.say(`Nothing on ${this.deps.memberName()}'s path that the S.Lv and the pouch can pay for.`, false);
      return;
    }
    this.last = r;
    view.highlights = new Set(r.activated);
    view.recentre();
    this.result = this.layer('result', resultHtml(r));
    this.choice = 1;
    this.paintChoice();
    audio.playSfx('confirm');
    this.deps.refresh();
  }

  /** Settle an open result as it stands. `sound` is false when something else caused it. */
  keep(sound = true): void {
    if (!this.result && !this.last) return;
    this.result?.remove();
    this.result = null;
    this.last = null;
    const view = this.deps.view();
    if (view) {
      view.highlights = new Set();
      view.render();
    }
    if (sound) audio.playSfx('confirm');
  }

  undo(): void {
    const model = this.deps.model();
    const r = this.last;
    if (!model || !r) return;
    restoreGrid(model, r.snapshot);
    this.keep(false);
    audio.playSfx('cancel');
    this.deps.view()?.recentre();
    this.deps.refresh();
  }

  // ------------------------------------------------------------- input

  private readonly onClick = (e: Event): void => {
    const btn = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-sgx]');
    const what = btn?.dataset['sgx'];
    if (!what) return;
    btn?.blur();
    e.stopPropagation();
    this.press(what);
  };

  /** One button's meaning, whether it was clicked, tapped or chosen with Enter. */
  press(what: string): void {
    if (what === 'got') this.closeCard(false);
    else if (what === 'show') this.closeCard(true);
    else if (what === 'undo') this.undo();
    else if (what === 'keep') this.keep();
    else if (what === 'auto') this.runAutoLearn();
    else if (what === 'help') this.openCard();
  }

  private buttons(): HTMLElement[] {
    const el = this.card ?? this.result;
    return el ? [...el.querySelectorAll<HTMLElement>('button[data-sgx]')] : [];
  }

  private paintChoice(): void {
    this.buttons().forEach((b, i) => b.classList.toggle('sgx-btn--chosen', i === this.choice));
  }

  /**
   * Keys while a card is up. The explainer is modal: Left/Right choose, Enter
   * presses, Esc is GOT IT, and nothing reaches the shell (no battle starts
   * and no tab changes under it). The result card takes Left/Right, Enter
   * (default KEEP) and Esc (KEEP) until it is settled. Returns true when the
   * shell must not see this frame at all.
   */
  /** The two desktop buttons name their key, or their pad button while a pad is connected. */
  private labelKeys(pad: boolean): void {
    if (this.padLabels === pad) return;
    this.padLabels = pad;
    for (const el of this.deps.container.querySelectorAll<HTMLElement>('.ffxprep-sg__key')) {
      el.dataset['key'] ??= el.textContent ?? '';
      el.textContent = pad ? (el.dataset['pad'] ?? '') : el.dataset['key'];
    }
  }

  /** True once per press of the `?` key or the pad's X / Square (button 2). */
  private takeHelpKey(): boolean {
    const pad = typeof navigator !== 'undefined' ? [...(navigator.getGamepads?.() ?? [])].find((g) => g?.connected) : undefined;
    this.labelKeys(pad !== undefined);
    const down = pad?.buttons[2]?.pressed === true;
    const edge = down && !this.padHelpDown;
    this.padHelpDown = down;
    const key = this.helpKey;
    this.helpKey = false;
    return key || edge;
  }

  handleInput(input: InputSnapshot): boolean {
    if (!this.card) {
      // F6: the two buttons that had no route but the pointer (the open explainer is modal and takes no new press).
      if (input.consume('select')) {
        this.runAutoLearn();
        return true;
      }
      if (this.takeHelpKey()) {
        this.openCard();
        return true;
      }
    }
    if (!this.card && !this.result) return false;
    const n = this.buttons().length;
    const left = input.consume('left');
    const right = input.consume('right');
    if (left) this.choice = (this.choice + n - 1) % Math.max(1, n);
    if (right) this.choice = (this.choice + 1) % Math.max(1, n);
    if (left || right) {
      // The chosen-button ring appears once the keys are in use; a mouse player sees the target's plain buttons.
      (this.card ?? this.result)?.classList.add('sgx-layer--keys');
      this.paintChoice();
    }
    if (input.consume('confirm') || input.consume('start')) {
      const what = this.buttons()[this.choice]?.dataset['sgx'];
      if (what) this.press(what);
      return true;
    }
    if (input.consume('cancel')) {
      if (this.card) this.closeCard(false);
      else this.keep();
      return true;
    }
    if (this.card) {
      for (const b of ['up', 'down', 'l1', 'r1', 'triangle'] as const) input.consume(b);
      return true;
    }
    return false;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onHelpKey);
    this.hideWatch?.disconnect();
    this.card?.remove();
    this.result?.remove();
    this.dock?.remove();
    this.card = this.result = this.dock = null;
    this.last = null;
  }
}
