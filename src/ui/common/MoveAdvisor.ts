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
 *
 * ## It fits in the band it is given
 *
 * The card's height is not the card's to choose. `move-advisor.css` caps it at
 * 104px and `ffx/hudSafeZones.ts` hands the FFX HUD a `maxHeight` for whichever
 * pocket or shelf it found — both other tracks' files — and the card scrolls,
 * with no scrollbar and a mask fade, so anything past the cap is simply *gone*
 * for a player holding a controller.
 *
 * That is how the answer to the report went missing: with a second suggestion
 * and a reason the card wanted 162px and had 104, so the revive's "stand Yuna
 * up" line faded out below the frame [critic, fix-3 round 1, F1]. So the card
 * now measures itself against the room it was given and **prints less** until
 * it fits ({@link fitCard}), instead of printing the same thing and hiding the
 * bottom of it. What it gives up, in order, is decoration: the one-line effect
 * descriptions, then the runner-up's numbers. What it never gives up is a
 * move's name, where that move lives on the menu, the *reason* the revive is
 * being offered, and any warning — those are the card.
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
  /** How much of each suggestion the last render printed. See {@link fitCard}. */
  private density: Density = 0;
  /** `signature@height` the current density was measured for. */
  private fittedFor = '';

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
    if (!this.visible) return;
    this.layout();
    // After `layout`, and every frame: the FFX HUD re-writes the card's
    // `max-height` from its safe zone *after* this tick (`placeAdvisor`), and
    // the band narrows and widens as submenus open, so the room the card has is
    // a moving number. `fitCard` returns immediately unless it changed.
    this.fitCard();
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
      this.density = 0;
      this.fittedFor = '';
      this.cardEl.innerHTML = cardHtml(this.cached, 0);
    }
    this.layout();
    this.fitCard();
  }

  /**
   * Print less until the card fits the room it was given.
   *
   * Measured, not guessed: `scrollHeight` is what the content wants and
   * `clientHeight` is what the box allows, and they differ only while the cap
   * (`max-height`, from the stylesheet or from the FFX HUD's zone) is biting.
   * Each step of {@link cardHtml}'s density drops one layer of decoration and
   * the card is measured again, so the same ladder works at any viewport, at
   * any submenu depth, and under whatever cap either HUD hands over next.
   *
   * Re-fitted when the advice changes or when the room does — the key carries
   * both. A layout the browser has not performed yet (jsdom, a hidden card, the
   * frame before mount) measures zero, and zero means "no reading", not "no
   * room": the card is left exactly as it is.
   */
  private fitCard(): void {
    if (!this.cached || !this.visible || this.cardEl.hidden) return;
    const room = this.cardEl.clientHeight;
    if (room <= 0) return;
    const key = `${this.lastSignature}@${Math.round(room)}`;
    if (key === this.fittedFor) return;

    // From the top every time: the room can grow as well as shrink (a submenu
    // closes, the zone moves from the shelf to the pocket), and a card that
    // only ever got terser would stay terse for the rest of the battle.
    let density: Density = 0;
    this.cardEl.innerHTML = cardHtml(this.cached, density);
    while (density < MAX_DENSITY && this.cardEl.scrollHeight > this.cardEl.clientHeight + 1) {
      density = (density + 1) as Density;
      this.cardEl.innerHTML = cardHtml(this.cached, density);
    }
    this.density = density;
    this.fittedFor = `${this.lastSignature}@${Math.round(this.cardEl.clientHeight)}`;
  }

  /** How much the card is currently printing, for tests and the debug snapshot. */
  get printedDensity(): number {
    return this.density;
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
      [s.label, s.menu, s.targetId ?? '', s.estimate?.min ?? '', s.estimate?.max ?? '', s.reason, s.warning].join('|'),
    ),
    view.note,
  ].join('||');
}

/** `1875` → `1,875`. The numerals face is tabular; the group separator is not. */
function num(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/**
 * How much of each suggestion the card prints.
 *
 * Ordered by what a player can most afford to lose, cheapest first. The four
 * things that are never dropped at any density are the move's name, the submenu
 * it lives in, the reason under a *runner-up* (which is where the revive lives,
 * and "why" is the whole of Bailey's second question), and any warning.
 *
 * | density | what goes |
 * |---|---|
 * | 0 | nothing — the full card |
 * | 1 | the runner-up's effect line |
 * | 2 | + the lead's effect line, and the runner-up's secondary chips |
 * | 3 | + the runner-up's numbers, down to the submenu chip |
 * | 4 | + the lead's reason and its secondary chips |
 */
export type Density = 0 | 1 | 2 | 3 | 4;
export const MAX_DENSITY: Density = 4;

function statsHtml(s: MoveSuggestion, lead = '', trim = false): string {
  const chips: string[] = lead ? [lead] : [];
  const e = s.estimate;
  if (e && e.kind !== 'none') {
    const cls = e.kind === 'heal' ? 'mad__stat--heal' : 'mad__stat--dmg';
    const range = e.min === e.max ? num(e.mid) : `${num(e.min)}–${num(e.max)}`;
    chips.push(`<span class="mad__stat ${cls}">${e.kind === 'heal' ? '+' : ''}${range}</span>`);
    if (e.hits > 1) chips.push(`<span class="mad__stat">${e.hits} hits</span>`);
    if (e.killsTarget) chips.push('<span class="mad__stat mad__stat--kill">kills</span>');
  }
  if (!trim) {
    chips.push(`<span class="mad__stat">${s.mpCost > 0 ? `${s.mpCost} MP` : 'no MP'}</span>`);
    chips.push(
      `<span class="mad__stat">${s.hitChance === null ? 'always hits' : `${s.hitChance}% to hit`}</span>`,
    );
    // Crit is deliberately outside the range — see `simulate.ts`'s roll policy.
    if (s.critChance > 0) chips.push(`<span class="mad__stat">${s.critChance}% crit</span>`);
  } else if (s.mpCost > 0) {
    // The one number a trimmed row keeps: a move the player cannot pay for is
    // not advice, and "no MP" is the only chip that says nothing when it is
    // missing.
    chips.push(`<span class="mad__stat">${s.mpCost} MP</span>`);
  }
  const applied = trim ? [] : [...new Set(s.statuses)];
  const cured = trim ? [] : [...new Set(s.cures)];
  if (applied.length > 0) {
    chips.push(`<span class="mad__stat mad__stat--status">+ ${escapeHtml(applied.join(', '))}</span>`);
  }
  if (cured.length > 0) {
    chips.push(`<span class="mad__stat mad__stat--status">cures ${escapeHtml(cured.join(', '))}</span>`);
  }
  return `<p class="mad__stats">${chips.join('')}</p>`;
}

/**
 * One suggestion.
 *
 * Two things the card used to print are deliberately gone, both on Bailey's
 * report of the live build:
 *
 *  * **"chapter line"** is developer vocabulary. The player has never been told
 *    what a chapter line is; what they want to know is whose advice this is, so
 *    the badge says **Guide's pick** and means the same thing.
 *  * **The research citation** ("ffx-seymour-flux §6 rows 5-6") is gone too.
 *    It is a note to the people building the game. The citations are still
 *    shown — in the strategy guide panel, which is the place a player opens to
 *    ask *why* rather than *what do I press*.
 *
 * And one thing is new: the **submenu** the row lives in. "Poison Fang" alone
 * reads as somebody else's ability; "Poison Fang · Items" is a set of
 * directions to the row, on the menu the player is already looking at.
 */
function moveHtml(s: MoveSuggestion, rank: number, total: number, density: Density = 0): string {
  const alt = rank > 1;
  const target = s.targetName
    ? `<span class="mad__arrow">→</span><span class="mad__target">${escapeHtml(s.targetName)}</span>`
    : '';
  const rankChip = total > 1 ? `<span class="mad__rank"><b>${rank}</b></span>` : '';
  const badge = s.source === 'tactic' ? '<span class="mad__badge">Guide’s pick</span>' : '';
  const menu = s.menu ? `<span class="mad__stat">in ${escapeHtml(s.menu)}</span>` : '';
  // See {@link Density}. A runner-up loses its decoration before the lead does,
  // and the lead's reason is the last thing to go.
  const showEffect = alt ? density < 1 : density < 2;
  const trimStats = alt ? density >= 2 : density >= 4;
  const barStats = alt && density >= 3;
  const showReason = alt || density < 4;
  return [
    `<article class="mad__move${alt ? ' mad__move--alt' : ''}">`,
    `<p class="mad__line">${rankChip}<span class="mad__label">${escapeHtml(s.label)}</span>${target}${badge}</p>`,
    barStats ? (menu ? `<p class="mad__stats">${menu}</p>` : '') : statsHtml(s, menu, trimStats),
    showEffect && s.effect ? `<p class="mad__effect">${escapeHtml(s.effect)}</p>` : '',
    showReason && s.reason ? `<p class="mad__why">${escapeHtml(s.reason)}.</p>` : '',
    s.warning ? `<p class="mad__warn">${escapeHtml(s.warning)}.</p>` : '',
    '</article>',
  ].join('');
}

export function cardHtml(view: AdvisorView, density: Density = 0): string {
  const moves = view.suggestions
    .map((s, i) => moveHtml(s, i + 1, view.suggestions.length, density))
    .join('');
  return [
    '<div class="mad__head">',
    '<span class="mad__title">Next best move</span>',
    `<span class="mad__actor">${escapeHtml(view.actorName)}</span>`,
    '</div>',
    moves || '<p class="mad__idle">Nothing legal to suggest.</p>',
    // The "wait for it" line, when an ally is down and raising them now would
    // only feed the boss a second kill. It is advice about a move the card is
    // *not* recommending, so it sits under the moves rather than inside one.
    view.note ? `<p class="mad__warn">${escapeHtml(view.note)}.</p>` : '',
  ].join('');
}
