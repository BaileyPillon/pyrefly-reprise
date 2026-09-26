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
  /**
   * Which anchor the card may never cross when the band between the two is
   * narrower than its minimum width. `'before'` keeps the right edge clear of
   * `before` and lets the card slide back over `after` instead: FFX-2's
   * `before` is the party HP rows and its `after` only the girls' shoulders
   * (critic round 09 PR-0091). Unset keeps the left edge and lets the card run
   * past `before`, as it always has; the FFX HUD replaces this box with its own
   * safe zone (`ffx/hudSafeZones.ts`) whenever it can solve one.
   */
  wall?: 'before';
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
/** The same three, for a HUD that solves the band the card is placed in (`ffx2/advisorLane.ts`). */
export {
  CLEARANCE_GAP as ADVISOR_CLEARANCE_GAP,
  MIN_CARD_WIDTH as ADVISOR_MIN_CARD_WIDTH,
  MAX_CARD_WIDTH as ADVISOR_MAX_CARD_WIDTH,
};

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
  /** `signature@cap@width` the current density was measured for. */
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

  /**
   * The card is on screen unless the **player** put it away.
   *
   * There was briefly a third state here: `setDeclined`, which the FFX HUD
   * called when `hudSafeZones.ts` could not find a box the whole card fits in,
   * and which hid the card and rewrote the chip to say the screen was full. It
   * is gone. On Chapter 1 the Sensor card stays up for the whole fight, so no
   * zone fit on five of seven decisions and the player was left with a two-word
   * chip floating over the strategy guide where the advice used to be — a card
   * withheld is worse than a card in an imperfect place, and the live build has
   * never withheld it [lead, pre-deploy gate 2026-09-18].
   *
   * So the HUD now falls back to this component's own placement instead
   * (`FFXBattleHud.placeAdvisor`), the chip only ever says `hide moves` or
   * `best move`, and `hidden` below has exactly one input: {@link visible}.
   */
  private applyVisible(): void {
    this.cardEl.hidden = !this.visible;
    this.el.classList.toggle('mad--off', !this.visible);
    // Drop the measured anchor with the card it was measured against, exactly
    // as `StrategyGuide.applyVisible` does: an inline `left` outranks the
    // stylesheet, so the chip would otherwise freeze at the last card's edge.
    if (!this.visible) this.toggleEl.style.left = '';
    const keys = padConnected() ? ADVISOR_HINT_ITEM.gamepad : ADVISOR_HINT_ITEM.keyboard;
    const word = this.visible ? 'hide moves' : 'best move';
    this.toggleEl.innerHTML = `<b>${escapeHtml(keys)}</b><span>${escapeHtml(word)}</span>`;
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
    // **Before** `layout`, deliberately. Three things write this card's box
    // every frame: `layout` below, the FFX HUD's `placeAdvisor` after this tick
    // (which is the one that lands, because it runs last), and the stylesheet.
    // Fitting after `layout` measured a width the player never sees — the
    // anchors' 180px rather than the safe zone's 112px — so the card was fitted
    // wide and painted narrow, and the two lines that answer the report wrapped
    // straight back off the bottom. Measuring first measures the box that was
    // actually on screen for the last frame.
    this.fitCard();
    this.layout();
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
   * Measured, not guessed: `scrollHeight` is what the content wants and the
   * **cap** is what it is allowed — `max-height`, from the stylesheet or from
   * the FFX HUD's safe zone, read off the computed style rather than off
   * `clientHeight`. That distinction is the whole of this method's history:
   * `clientHeight` is the *content's* height whenever the cap is not biting, so
   * keying the work off it meant the key changed every time the fit changed,
   * and a card measured on one frame's width could be left standing at a
   * density that overflowed the next one's. On a live board the FFX zone's
   * width breathes with the party sprites' idle animation, so that is every
   * other frame: `pocketLeft` is derived from `spritesRight`
   * [`ffx/hudSafeZones.ts`].
   *
   * So the reading is (advice, cap, width) — width quantised to 4px, because
   * a card that re-flowed on every pixel of sprite breathing would flicker
   * between two densities for the whole battle — and when any of the three
   * changes, the ladder is walked from the top. From the top, not from where it
   * was: the room grows as well as shrinks (a submenu closes, the zone moves
   * from the shelf to the pocket) and a card that only ever got terser would
   * stay terse for the rest of the fight.
   *
   * A layout the browser has not performed yet (jsdom, a hidden card, the frame
   * before mount) measures zero, and zero means "no reading", not "nothing
   * fits": the card is left exactly as it is.
   */
  private fitCard(): void {
    if (!this.cached || !this.visible || this.cardEl.hidden) return;
    const width = this.cardEl.clientWidth;
    if (width <= 0) return;
    const cap = this.capHeight();
    if (cap <= 0) return;

    const key = `${this.lastSignature}@${Math.round(cap)}@${Math.round(width / 4)}`;
    if (key === this.fittedFor) return;
    this.fittedFor = key;

    // **Tighter only, until the next decision.** The box the card is painted in
    // is not one box: `placeAdvisor` is a no-op on any frame its safe zone
    // cannot be solved and the card then keeps `layout`'s much wider anchor box,
    // so on a live Chapter 1 board the width alternates between roughly 200 and
    // 180 and 112 from one frame to the next. A fit that answered each of those
    // in turn was correct on every single frame and *flickered* — chips and a
    // whole sentence appearing and disappearing while the player read it.
    //
    // Going one way only settles that: within one open decision the card can
    // give things up but never takes them back, so it converges on the
    // narrowest box it has actually been painted in and then stays put.
    // `render` resets it to nothing-given-up for every new decision, which is
    // where room that has genuinely come back is picked up.
    let density = this.density;
    while (density < MAX_DENSITY && this.cardEl.scrollHeight > cap + 1) {
      density = (density + 1) as Density;
      this.cardEl.innerHTML = cardHtml(this.cached, density);
    }
    this.density = density;
  }

  /**
   * The cap the card is actually held to, in its own pixels.
   *
   * `max-height` covers both owners — `move-advisor.css`'s 104px and the inline
   * one `FFXBattleHud.placeAdvisor` writes from its safe zone. An uncapped card
   * (a stylesheet that stops setting one, a test) reports `none`, and then the
   * card's own height is the only honest answer: nothing is being cut off, so
   * nothing has to be dropped.
   */
  private capHeight(): number {
    let cap = Number.NaN;
    try {
      const raw = getComputedStyle(this.cardEl).maxHeight;
      cap = raw.endsWith('px') ? parseFloat(raw) : Number.NaN;
    } catch {
      cap = Number.NaN;
    }
    if (Number.isFinite(cap) && cap > 0) return cap;
    const own = this.cardEl.clientHeight;
    return own > 0 ? Math.max(own, this.cardEl.scrollHeight) : 0;
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
    let left = after ? after.offsetLeft + after.offsetWidth + CLEARANCE_GAP : anchors.left;

    const beforeEl = anchors.before?.() ?? null;
    const before = beforeEl && beforeEl.offsetWidth > 0 ? beforeEl : null;
    const right = before ? before.offsetLeft - CLEARANCE_GAP : anchors.right;

    const width = Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, right - left));
    if (anchors.wall === 'before' && left + width > right) left = Math.max(0, right - width);
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
 * Ordered by what a player can most afford to lose, cheapest first. At every
 * rung, including the last, three things are never dropped: the move's name,
 * the submenu it lives in (CHK-004, "say where" — critic round 13, PR-0126
 * narrowed, below), and the reason under a *runner-up* until the rung that
 * takes the runner-up down to its bar line (which is where the revive lives,
 * and "why" is the whole of Bailey's second question).
 *
 * Critic round 09, PR-0126: the lead used to lose its "in <submenu>" chip and
 * cost a rung early, at density 5 — the same rung that sheds only its badge
 * now — because `bare` folded the two together. Chapter 5's real route hit
 * that rung on 27 of 283 decisions. The menu path and cost survived every rung
 * but the last from that fix on.
 *
 * Critic round 13, PR-0126 narrowed: the last, phone-compact rung was still
 * the one place the chip vanished — "TIP Wakka" for a Switch, "TIP Darkness →
 * all enemies" with no menu named, on **every** phone tip, and on desktop
 * whenever `hudSafeZones.ts` fitted the card into a narrow "compact" box,
 * because a narrow box walks this same ladder to this same last rung. The
 * lead's own cost line was already the first thing that rung dropped in
 * favour of the bar line the runner-up uses from density 3; the last rung now
 * takes that bar line too, rather than the empty string it fell back to —
 * the menu path is worth a whole line on its own when nothing else fits.
 *
 * | density | what goes |
 * |---|---|
 * | 0 | nothing — the full card |
 * | 1 | the runner-up's effect line |
 * | 2 | + the lead's effect line, and the runner-up's secondary chips |
 * | 3 | + the runner-up's numbers, down to the submenu chip |
 * | 4 | + the lead's reason and its secondary chips |
 * | 5 | + the lead's badge |
 * | 6 (phone compact) | + the lead's warning and the title: named moves, their submenu, the actor, the board's note |
 *
 * Seven rungs rather than the four the first pass shipped, because the room
 * the card is given is much smaller than the stylesheet's 104px suggests. The
 * FFX safe zone's pocket on Chapter 1 is about 112px *wide* at 1280x720 —
 * narrow enough that one sentence takes three lines — and on the turns where
 * the pocket does not fit at all the zone hands the card a **35px shelf**
 * above the party's heads, which is four lines of anything.
 *
 * Rung 6 is what makes "the card never hides its own bottom edge" true even
 * there: two moves named, where each lives, the note that answers the board,
 * and no prose. It is a last resort and it reads like one; the 35px shelf is
 * the real defect and it belongs to the HUD's `hudSafeZones.ts` — see
 * `docs/handoff/fix3-advisor.md`.
 */
export type Density = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const MAX_DENSITY: Density = 6;

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
  // See {@link Density}. A runner-up loses its decoration before the lead does,
  // the lead's reason goes before the runner-up's, and the last, phone-compact
  // rung takes cost, reason and warning down to a name, a target and — same as
  // every other rung — the path to the row (critic round 09 PR-0126: `bare`
  // used to fire for the lead a rung early, at density 5, which is now only
  // the badge's rung; critic round 13, PR-0126 narrowed: the last rung was
  // still taking the menu chip down with everything else, on the phone tip and
  // on any desktop card `hudSafeZones.ts` fits into a narrow "compact" box —
  // the same density ladder, walked to the same last rung. CHK-004 "say
  // where": the menu chip now survives it too, same as the runner-up's own bar
  // line already did).
  const bare = density >= MAX_DENSITY;
  const badge = s.source === 'tactic' && density < 5 ? '<span class="mad__badge">Guide’s pick</span>' : '';
  const menu = s.menu ? `<span class="mad__stat">in ${escapeHtml(s.menu)}</span>` : '';
  const showEffect = !bare && (alt ? density < 1 : density < 2);
  const trimStats = alt ? density >= 2 : density >= 4;
  const barStats = (alt && density >= 3) || bare;
  const showReason = !bare && (alt || density < 4);
  return [
    `<article class="mad__move${alt ? ' mad__move--alt' : ''}">`,
    `<p class="mad__line">${rankChip}<span class="mad__label">${escapeHtml(s.label)}</span>${target}${badge}</p>`,
    barStats ? (menu ? `<p class="mad__stats">${menu}</p>` : '') : statsHtml(s, menu, trimStats),
    showEffect && s.effect ? `<p class="mad__effect">${escapeHtml(s.effect)}</p>` : '',
    showReason && s.reason ? `<p class="mad__why">${escapeHtml(s.reason)}.</p>` : '',
    !bare && s.warning ? `<p class="mad__warn">${escapeHtml(s.warning)}.</p>` : '',
    '</article>',
  ].join('');
}

export function cardHtml(view: AdvisorView, density: Density = 0): string {
  const moves = view.suggestions
    .map((s, i) => moveHtml(s, i + 1, view.suggestions.length, density))
    .join('');
  return [
    '<div class="mad__head">',
    density >= MAX_DENSITY ? '' : '<span class="mad__title">Next best move</span>', // phone: the title wrapped over the move
    `<span class="mad__actor">${escapeHtml(view.actorName)}</span>`,
    '</div>',
    // The "wait for it" line, when an ally is down and raising them now would
    // only feed the boss a second kill.
    //
    // Directly under the head, above the moves, and that placement is load
    // bearing: whatever cap the card is under cuts its **bottom**, and on a
    // live Chapter 1 board the FFX safe zone hands it a 35px shelf often enough
    // to matter (see `docs/handoff/fix3-advisor.md`). A footnote is the first
    // thing lost there, and this sentence is the whole answer to "what about
    // reviving Yuna?" — so it goes where nothing can take it. It also reads in
    // the right order: the board first, then what to press on it.
    view.note ? `<p class="mad__warn mad__warn--lead">${escapeHtml(view.note)}.</p>` : '',
    moves || '<p class="mad__idle">Nothing legal to suggest.</p>',
  ].join('');
}
