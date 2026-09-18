import './move-advisor.css';
import type { AvailableCommand, BattleState, CombatantId, GameId } from '../../battle/common/types.ts';
import { buildAdvisorView, type AdvisorOptions, type AdvisorView, type MoveSuggestion } from '../../engine/tactics/advisor.ts';
import { readSetting, writeSetting } from '../../app/SaveData.ts';
import { ADVISOR_HINT_ITEM } from './ControlsHint.ts';
import { escapeHtml } from './html.ts';

/**
 * The optional in-battle **move advisor**: an Ink & Gold card that says what to
 * press right now, for the character whose command menu is open, and what it
 * will do.
 *
 * It sits *beside* `StrategyGuide`, not instead of it. The guide's left rail
 * still says what the encounter was designed around and cites the research; the
 * card answers the narrower question the player is actually holding a
 * controller for — the move's name, what it does, how much damage or healing it
 * is worth against the likely target, its MP cost, its hit chance, the statuses
 * it lands, and one line on why.
 *
 * ## It follows the selection
 *
 * The card is driven by {@link showDecision}, which both HUDs call from
 * `chooseCommand` — so it re-computes for whoever is deciding, every time the
 * turn passes to another character, and clears itself the moment the command is
 * taken. There is nothing per-frame about it: {@link buildAdvisorView} runs once
 * per decision (about 16 ms on Chapter 1's widest menu) and the result is held
 * until the decision changes.
 *
 * ## Optional means optional
 *
 * `N`, the pad's right trigger, or the card's own chip hides everything but a
 * chip two words wide, and the answer is remembered in
 * `Settings.advisorVisible` for every later battle. Default is **on**: the
 * numbers are the point, and a player who does not want to be told can say so
 * once.
 *
 * ## It never sits on the command menu
 *
 * The card is measured between two anchors the HUD owner names
 * ({@link MoveAdvisorAnchors}): the element on its left and the element on its
 * right. In FFX those are the command stack and the party status column; in
 * FFX-2 they are the same two the other way round. {@link layout} squeezes the
 * card into whatever is left between them every frame, so "never over the
 * command menu" is true at every submenu depth rather than true on the
 * screenshot that was taken. Both are gated on `offsetWidth > 0`, because
 * `.ffx2hud__command` is `hidden` whenever no menu is open and a hidden element
 * reports an offset of zero — the bug `StrategyGuide.layout` documents.
 */

/** Stage-relative geometry, in the 640x360 authoring grid's own pixels. */
export interface MoveAdvisorAnchors {
  /** Element immediately to the card's left; the card starts after it. */
  after?: () => HTMLElement | null;
  /** Element immediately to the card's right; the card stops before it. */
  before?: () => HTMLElement | null;
  /** Fallback left edge, used when `after` resolves to nothing. */
  left: number;
  /** Fallback right edge, used when `before` resolves to nothing. */
  right: number;
  /** Distance from the stage's bottom edge. */
  bottom: number;
}

export interface MoveAdvisorOptions {
  /** Only used for the root class, so FFX-2 picks up the pink accent. */
  game: GameId;
  anchors: MoveAdvisorAnchors;
  /** Registries the advisor's simulator needs; see `AdvisorOptions`. */
  advisor?: () => AdvisorOptions;
  /** Overridable for tests. */
  readVisible?: () => boolean;
  writeVisible?: (on: boolean) => void;
}

/**
 * The pad button the card claims: standard index 7, the right trigger.
 *
 * `src/app/Input.ts`'s `PAD_MAP` binds 0, 1, 3, 4, 5, 8, 9 and the d-pad, and
 * `StrategyGuide` has taken 2. The triggers are free in both, and a trigger is
 * the right shape for "hold nothing, tap to peek".
 */
const PAD_TOGGLE_BUTTON = 7;

/** Gap between the card and whatever it is clearing, in grid px. */
const CLEARANCE_GAP = 6;
/** Never squeeze the card narrower than this — under it the chips wrap to one word a line. */
const MIN_CARD_WIDTH = 132;
/** Widest the card is allowed to grow when the band is empty. */
const MAX_CARD_WIDTH = 226;

export class MoveAdvisor {
  readonly el: HTMLElement;
  private readonly cardEl: HTMLElement;
  private readonly toggleEl: HTMLButtonElement;
  private readonly opts: MoveAdvisorOptions;

  private mounted = false;
  private visible: boolean;
  private lastState: Readonly<BattleState> | null = null;
  private decision: { actorId: CombatantId; commands: AvailableCommand[] } | null = null;
  private padWasDown = false;
  /** The computed advice, held until the decision changes. */
  private cached: AdvisorView | null = null;
  /** Signature of the last render, so a per-frame tick does not rewrite the DOM. */
  private lastSignature = '';

  constructor(opts: MoveAdvisorOptions) {
    this.opts = opts;
    this.visible = (opts.readVisible ?? (() => readSetting('advisorVisible')))();

    this.el = document.createElement('div');
    this.el.className = `mad${opts.game === 'ffx2' ? ' mad--ffx2' : ''}`;
    this.el.dataset['role'] = 'move-advisor';

    this.toggleEl = document.createElement('button');
    this.toggleEl.type = 'button';
    this.toggleEl.className = 'mad__toggle';
    this.toggleEl.dataset['role'] = 'move-advisor-toggle';

    this.cardEl = document.createElement('div');
    this.cardEl.className = 'mad__card';
    this.cardEl.dataset['role'] = 'move-advisor-card';

    this.el.append(this.cardEl, this.toggleEl);
    this.toggleEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    this.applyVisible();
  }

  // ----------------------------------------------------------------- mount

  /** Mount into the HUD's scaled stage, so the card shares the chrome's letterbox. */
  mount(stage: HTMLElement): void {
    if (this.mounted) return;
    stage.appendChild(this.el);
    this.mounted = true;
    window.addEventListener('keydown', this.onKeyDown);
    this.render();
  }

  unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('keydown', this.onKeyDown);
    this.el.remove();
    this.mounted = false;
  }

  // ---------------------------------------------------------------- toggle

  get isVisible(): boolean {
    return this.visible;
  }

  toggle(): void {
    this.setVisible(!this.visible);
  }

  setVisible(on: boolean): void {
    if (this.visible === on) return;
    this.visible = on;
    (this.opts.writeVisible ?? ((v: boolean) => writeSetting('advisorVisible', v)))(on);
    this.applyVisible();
    if (on) this.render();
  }

  private applyVisible(): void {
    this.cardEl.hidden = !this.visible;
    this.el.classList.toggle('mad--off', !this.visible);
    // Drop the measured anchor with the card it was measured against, exactly
    // as `StrategyGuide.applyVisible` does: an inline `left` outranks the
    // stylesheet, so the chip would otherwise freeze at the last card's edge.
    if (!this.visible) this.toggleEl.style.left = '';
    const keys = padConnected() ? ADVISOR_HINT_ITEM.gamepad : ADVISOR_HINT_ITEM.keyboard;
    this.toggleEl.innerHTML =
      `<b>${escapeHtml(keys)}</b><span>${escapeHtml(this.visible ? 'hide moves' : 'best move')}</span>`;
    this.toggleEl.setAttribute('aria-pressed', String(this.visible));
    this.toggleEl.title = this.visible ? 'Hide the move advisor' : 'Show the next best move';
  }

  /**
   * `KeyN`, edge-only.
   *
   * Not routed through `src/app/Input.ts` for the same reason the guide's `G`
   * is not: nothing in the battle screen forwards an `InputSnapshot` to the
   * HUD, and adding a binding to the shared map for one optional panel would
   * put a global key in a contract file thirty agents import.
   */
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyN' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this.toggle();
  };

  /** Per-frame tick from the HUD: polls the pad and keeps the card in its band. */
  update(_dt: number): void {
    this.pollPad();
    if (this.visible) this.layout();
  }

  private pollPad(): void {
    let down = false;
    try {
      for (const pad of navigator.getGamepads?.() ?? []) {
        if (pad?.connected && pad.buttons[PAD_TOGGLE_BUTTON]?.pressed) down = true;
      }
    } catch {
      down = false;
    }
    if (down && !this.padWasDown) this.toggle();
    this.padWasDown = down;
  }

  // ------------------------------------------------------------------ data

  /** New engine state. The card only speaks at a decision, so this just records it. */
  sync(state: Readonly<BattleState>): void {
    this.lastState = state;
  }

  /**
   * A player decision opened, for `actorId`.
   *
   * Re-computed here and only here: this is the one moment the answer can
   * change, and it is what makes the card follow the selection when the turn
   * passes to another character.
   */
  showDecision(actorId: CombatantId, commands: AvailableCommand[], state?: Readonly<BattleState>): void {
    if (state) this.lastState = state;
    this.decision = { actorId, commands };
    this.cached = this.compute();
    this.render();
  }

  /** The decision was taken (or abandoned). */
  clearDecision(): void {
    if (!this.decision && !this.cached) return;
    this.decision = null;
    this.cached = null;
    this.render();
  }

  /** The advice the card would draw right now, for tests and the debug snapshot. */
  view(): AdvisorView | null {
    return this.cached;
  }

  private compute(): AdvisorView | null {
    if (!this.lastState || !this.decision) return null;
    try {
      return buildAdvisorView(this.lastState, this.decision, this.opts.advisor?.() ?? {});
    } catch (err) {
      // A scripted rule that did not expect this board. The card goes idle; the
      // battle is untouched, because nothing the advisor runs is the battle.
      console.warn('[move-advisor] the advice could not be computed', err);
      return null;
    }
  }

  // -------------------------------------------------------------- rendering

  private render(): void {
    if (!this.mounted) return;
    // No decision open and nothing to say: no card and no chip, rather than a
    // chip that opens an empty box.
    this.el.hidden = this.cached === null;
    if (!this.cached || !this.visible) return;

    const signature = signatureOf(this.cached);
    if (signature !== this.lastSignature) {
      this.lastSignature = signature;
      this.cardEl.innerHTML = cardHtml(this.cached);
    }
    this.layout();
  }

  /**
   * Squeeze the card into the band between its two anchors.
   *
   * `offsetLeft` / `offsetWidth` are already stage-space: every anchor and the
   * card share the HUD stage as their offset parent. `offsetWidth > 0` is the
   * gate rather than "the element exists", because a hidden anchor reports
   * zero for both and would otherwise pin the card to the stage's left edge —
   * the same trap `StrategyGuide.layout` documents for `.ffx2hud__command`.
   */
  private layout(): void {
    const { anchors } = this.opts;
    const afterEl = anchors.after?.() ?? null;
    const after = afterEl && afterEl.offsetWidth > 0 ? afterEl : null;
    const left = after ? after.offsetLeft + after.offsetWidth + CLEARANCE_GAP : anchors.left;

    const beforeEl = anchors.before?.() ?? null;
    const before = beforeEl && beforeEl.offsetWidth > 0 ? beforeEl : null;
    const right = before ? before.offsetLeft - CLEARANCE_GAP : anchors.right;

    const width = Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, right - left));
    this.cardEl.style.left = `${left.toFixed(2)}px`;
    this.cardEl.style.width = `${width.toFixed(2)}px`;
    this.cardEl.style.bottom = `${anchors.bottom.toFixed(2)}px`;
    this.toggleEl.style.left = `${left.toFixed(2)}px`;
    this.toggleEl.style.bottom = `${(anchors.bottom + this.cardEl.offsetHeight + 2).toFixed(2)}px`;
  }
}

function padConnected(): boolean {
  try {
    const pads = navigator.getGamepads?.() ?? [];
    return Array.from(pads).some((p) => p !== null && p.connected);
  } catch {
    return false;
  }
}

// --------------------------------------------------------------- templates

/** Everything that can change what the card says, in one string. */
function signatureOf(view: AdvisorView): string {
  return [
    view.actorId,
    ...view.suggestions.map((s) =>
      [s.label, s.targetId ?? '', s.estimate?.min ?? '', s.estimate?.max ?? '', s.reason, s.warning].join('|'),
    ),
  ].join('||');
}

/** `1875` → `1,875`. The numerals face is tabular; the group separator is not. */
function num(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function statsHtml(s: MoveSuggestion): string {
  const chips: string[] = [];
  const e = s.estimate;
  if (e && e.kind !== 'none') {
    const cls = e.kind === 'heal' ? 'mad__stat--heal' : 'mad__stat--dmg';
    const range = e.min === e.max ? num(e.mid) : `${num(e.min)}–${num(e.max)}`;
    chips.push(`<span class="mad__stat ${cls}">${e.kind === 'heal' ? '+' : ''}${range}</span>`);
    if (e.hits > 1) chips.push(`<span class="mad__stat">${e.hits} hits</span>`);
    if (e.killsTarget) chips.push('<span class="mad__stat mad__stat--kill">kills</span>');
  }
  chips.push(`<span class="mad__stat">${s.mpCost > 0 ? `${s.mpCost} MP` : 'no MP'}</span>`);
  chips.push(
    `<span class="mad__stat">${s.hitChance === null ? 'always hits' : `${s.hitChance}% to hit`}</span>`,
  );
  // Crit is deliberately outside the range — see `simulate.ts`'s roll policy.
  if (s.critChance > 0) chips.push(`<span class="mad__stat">${s.critChance}% crit</span>`);
  const applied = [...new Set(s.statuses)];
  const cured = [...new Set(s.cures)];
  if (applied.length > 0) {
    chips.push(`<span class="mad__stat mad__stat--status">+ ${escapeHtml(applied.join(', '))}</span>`);
  }
  if (cured.length > 0) {
    chips.push(`<span class="mad__stat mad__stat--status">cures ${escapeHtml(cured.join(', '))}</span>`);
  }
  return `<p class="mad__stats">${chips.join('')}</p>`;
}

function moveHtml(s: MoveSuggestion, rank: number, total: number): string {
  const target = s.targetName
    ? `<span class="mad__arrow">→</span><span class="mad__target">${escapeHtml(s.targetName)}</span>`
    : '';
  const rankChip = total > 1 ? `<span class="mad__rank"><b>${rank}</b></span>` : '';
  const badge = s.source === 'tactic' ? '<span class="mad__badge">chapter line</span>' : '';
  return [
    `<article class="mad__move${rank > 1 ? ' mad__move--alt' : ''}">`,
    `<p class="mad__line">${rankChip}<span class="mad__label">${escapeHtml(s.label)}</span>${target}${badge}</p>`,
    statsHtml(s),
    s.effect ? `<p class="mad__effect">${escapeHtml(s.effect)}</p>` : '',
    s.reason ? `<p class="mad__why">${escapeHtml(s.reason)}.</p>` : '',
    s.warning ? `<p class="mad__warn">${escapeHtml(s.warning)}.</p>` : '',
    s.cite ? `<p class="mad__cite">${escapeHtml(s.cite)}</p>` : '',
    '</article>',
  ].join('');
}

function cardHtml(view: AdvisorView): string {
  const moves = view.suggestions
    .map((s, i) => moveHtml(s, i + 1, view.suggestions.length))
    .join('');
  return [
    '<div class="mad__head">',
    '<span class="mad__title">Next best move</span>',
    `<span class="mad__actor">${escapeHtml(view.actorName)}</span>`,
    '</div>',
    moves || '<p class="mad__idle">Nothing legal to suggest.</p>',
  ].join('');
}
