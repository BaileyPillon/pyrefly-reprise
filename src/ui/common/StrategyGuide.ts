import './strategy-guide.css';
import type { AvailableCommand, BattleState, CombatantId, GameId } from '../../battle/common/types.ts';
import { buildGuideView, type GuideView } from '../../engine/tactics/guide.ts';
import { ffx2CoachClock } from '../coach/coachState.ts';
import { readSetting, writeSetting } from '../../app/SaveData.ts';
import { GUIDE_HINT_ITEM } from './ControlsHint.ts';
import { escapeHtml } from './html.ts';

/**
 * The optional in-battle strategy guide: an Ink & Gold side slab that says what
 * the encounter was designed to be beaten with, and gets out of the way.
 *
 * Three parts, in the order a player needs them:
 *
 *  * **NEXT** — the command the chapter's shipped tactic would pick for the
 *    character who is deciding right now, its target, and one cited sentence on
 *    why. The recommendation is not written here: `src/engine/tactics/guide.ts`
 *    runs the real `intendedStrategy` read-only, so the panel and the
 *    auto-battler can never disagree.
 *  * **WATCH** — whatever the boss is winding up, while a `charge` is live
 *    ("Total Annihilation, in 2 turns"), plus the phase or form note.
 *  * **RULES** — the three-to-five standing truths of the encounter, each one
 *    carrying the `research/*.md` section it comes from.
 *
 * ## Optional means optional
 *
 * `G`, the pad's spare face button, or the chip itself hides everything but a
 * chip the width of two words, and the answer is remembered in
 * `Settings.guideVisible` for every later battle. Default is on: a player who
 * has never met Yunalesca should be told that curing every Zombie is the losing
 * move *before* it wipes them, and a player who does not want to be told can
 * say so once.
 *
 * ## It never sits on the command menu
 *
 * The panel is a left rail inside the HUD's own 640x360 letterbox stage, so it
 * scales with the rest of the chrome. Its height is not a constant: the owner
 * hands it the element it must clear (`.ffx-cmd-area` in FFX, whose stack grows
 * upward from the bottom-left as a submenu fills), and {@link layout} caps the
 * panel at that element's top edge every frame. When the menu closes the rail
 * grows back. That is why this is a measured layout rather than a fixed box —
 * a fixed box either wastes two thirds of the rail or lands on the Items
 * submenu, and which one it does depends on the chapter.
 *
 * ## Input, without touching `Input.ts`
 *
 * `src/app/Input.ts` maps a small set of abstract buttons and the battle screen
 * forwards none of them to the HUD, so the guide listens for itself: a `keydown`
 * on `KeyG` (the one key no existing binding claims) and a poll of standard
 * gamepad button 2, which `PAD_MAP` also leaves free. Both are edge-detected
 * and both stop at {@link unmount}.
 */

/** Stage-relative geometry, in the 640x360 authoring grid's own pixels. */
export interface StrategyGuideAnchors {
  /** Element whose bottom edge the panel starts below. Fixed `top` when absent. */
  below?: () => HTMLElement | null;
  /** Element whose top edge the panel must stop above. Fixed `bottom` when absent. */
  above?: () => HTMLElement | null;
  /** Fallback top, used when `below` resolves to nothing. */
  top: number;
  /** Fallback distance from the stage's bottom, used when `above` resolves to nothing. */
  bottom: number;
}

export interface StrategyGuideOptions {
  /** Only used for the root class, so FFX-2 picks up the pink accent. */
  game: GameId;
  anchors: StrategyGuideAnchors;
  /** Overridable for tests. */
  readVisible?: () => boolean;
  writeVisible?: (on: boolean) => void;
}

/** The pad button the guide claims: standard index 2, unmapped by `Input.ts`. */
const PAD_TOGGLE_BUTTON = 2;

/** Never squeeze the panel below this, in grid px — under it the type is unreadable. */
const MIN_PANEL_HEIGHT = 56;

/** Gap between the panel and whatever it is clearing, in grid px. */
const CLEARANCE_GAP = 5;

/**
 * How far above the rail's own top edge the `G GUIDE` chip sits, in grid px.
 *
 * It is a constant rather than a measurement because `layout()` runs before the
 * chip's first paint on the opening frame, and a zero height there would drop
 * the chip onto the banner for exactly the frame a screenshot is most likely to
 * catch. 11 is the gap the authored `top: 44` / chip `top: 44 - 11` pair in
 * `strategy-guide.css` already encodes.
 */
const CHIP_RISE = 11;

/**
 * Rails shorter than this render RULES as one-liners (`.sgd--compact`).
 *
 * Measured, not guessed: with an FFX command menu open the rail is 156 grid px
 * and the panel's content is 370, of which the five rule paragraphs are 224.
 * The moment the player is actually reading this thing is the moment the menu
 * is open, so at that size the choice is not "paragraphs or headlines" but
 * "headlines or nothing" — everything below the fold needs a mouse wheel, which
 * a player on a pad does not have. In the short form the same five rules are
 * about 55px and the whole panel lands near the rail's height.
 *
 * The threshold is a constant rather than a measurement of the rendered
 * content on purpose: compacting shrinks `scrollHeight`, so a feedback loop on
 * overflow would oscillate between the two forms every frame.
 */
const COMPACT_HEIGHT = 200;

/**
 * The density ladder, when even the compact form does not fit the rail.
 *
 * Round 02 #29: "the strategy guide hard-clips mid-sentence with no scrollbar,
 * fade or affordance — '…beat the mount's Full-', 'Lance of Atrophy into
 * Full-Life, then Dispel into' … at submenu heights it renders bare headings
 * ('PHASE 1', 'RULES') with no body."
 *
 * The rail already scrolled and already faded its last few px, and neither
 * helped, for two reasons the fix has to answer separately:
 *
 * * **Nothing said there was more.** A fade at the foot of an ink panel on a
 *   dark painting is not an affordance; {@link StrategyGuide.moreEl} is.
 * * **A player on a pad cannot scroll.** So the panel gives text up in a fixed
 *   order until what is left fits, exactly as `MoveAdvisor.fitCard` does, and
 *   the order is decoration first: rule citations, then the rules' paragraphs,
 *   then the WATCH sentences, then rules past the third. **What is never given
 *   up is a half-sentence** — every rung hides whole elements, so nothing is
 *   ever cut through the middle of a word again.
 *
 * NEXT — the command the player is being told to press, its target and its one
 * reason — survives every rung. It is the line the decision is about.
 *
 * **The ladder stops at four on purpose.** A fifth rung dropping the RULES
 * section outright was written and measured: at 1600x900 with an FFX command
 * menu open the rail is ~156 grid px and the ladder reached it in every state
 * of the browser pass, so the encounter's standing truths — "kill Seymour, not
 * the mount" — were gone from the panel for the whole of every decision, which
 * is when they matter. Past the fourth rung the rail **paginates** — whole
 * blocks at a time, {@link StrategyGuide.pageDown} — and
 * {@link StrategyGuide.moreEl} says so. Round 02 #29 allows exactly that:
 * "scroll or paginate with a visible affordance; never *silently* cut a
 * sentence."
 */
const FIT_RUNGS = 4;

/** Height of the MORE affordance row, in grid px. Mirrors `.sgd__more`'s own. */
const MORE_HEIGHT = 11;

/** The class that takes a block out of the body's flow entirely. */
const OUT_CLASS = 'sgd__u--out';

/**
 * One block of text in the body, measured in the stage's own **layout** units.
 *
 * Both numbers come from `offsetTop`/`offsetHeight` arithmetic, which a CSS
 * `transform` on an ancestor never touches — that is the whole point. Round 04
 * PR-0009 was twice fixed by converting *screen* measurements into grid units
 * and twice stayed broken; the fit decision below reads nothing a transform can
 * move.
 */
export interface GuideFitUnit {
  /** The block's own box bottom, relative to `.sgd__body`'s top edge. */
  readonly bottom: number;
  /**
   * The bottom of this block's lowest **glyph**, same origin — always at or
   * above {@link bottom}, because a line box carries half-leading and a block
   * can carry padding under its last line. Ending the body here rather than at
   * `bottom` is what makes the slab's edge land on the type instead of a few
   * px of empty leading below it.
   */
  readonly glyphBottom: number;
  /** A section head (`RULES`), which must never be the last thing shown. */
  readonly heading?: boolean;
}

export interface GuideFit {
  /** How many leading blocks stay; every later one is hidden outright. */
  readonly shown: number;
  /** The body's exact height: the last shown block's glyph bottom. */
  readonly height: number;
  /** At least one block had to go, so the MORE row is earned. */
  readonly clipped: boolean;
}

/**
 * Keep the leading run of blocks that fits `limit` **entirely**, and end the
 * box on the last one's glyphs.
 *
 * Round 03 #36 and round 04 PR-0009: "…the CTB margin the Holy / Water rhythm
 * need[s to beat] the mount's Full-". Every previous answer clamped a
 * continuous height and hoped the boundary landed between two lines. This one
 * cannot slice, because the only heights it can return are block boundaries:
 * whatever `limit` is, the box ends where a block ended.
 *
 * Pure and exported so the rule is unit-testable without a layout engine —
 * the class's only job is to read the two numbers per block off the DOM.
 */
export function fitWholeUnits(units: readonly GuideFitUnit[], limit: number): GuideFit {
  if (units.length === 0) return { shown: 0, height: Math.max(0, limit), clipped: false };
  let shown = 0;
  for (const unit of units) {
    if (unit.bottom > limit + 0.5) break;
    shown++;
  }
  // Not even the first block fits: show it anyway and let the rail run a
  // couple of px long. NEXT — the command the player is being told to press —
  // survives every other rung of this panel's ladder; it survives this one too,
  // and an empty slab with a MORE chip under it would be the worse defect.
  if (shown === 0) return { shown: 1, height: units[0]!.glyphBottom, clipped: units.length > 1 };
  // Never end on an orphan `RULES` head whose bullets were all cut away.
  while (shown > 1 && shown < units.length && units[shown - 1]!.heading) shown--;
  const last = units[shown - 1]!;
  return { shown, height: Math.min(last.glyphBottom, last.bottom), clipped: shown < units.length };
}

export class StrategyGuide {
  readonly el: HTMLElement;
  /** The measured column: the slab, then the MORE row. See `.sgd__stack`. */
  private readonly stackEl: HTMLElement;
  private readonly panelEl: HTMLElement;
  private readonly toggleEl: HTMLButtonElement;
  private readonly bodyEl: HTMLElement;
  private readonly opts: StrategyGuideOptions;

  private mounted = false;
  private visible: boolean;
  private lastState: Readonly<BattleState> | null = null;
  private decision: { actorId: CombatantId; commands: AvailableCommand[] } | null = null;
  private padWasDown = false;
  /** Signature of the last render, so a per-frame `sync` does not re-write the DOM. */
  private lastSignature = '';
  /** The paging affordance; see {@link FIT_RUNGS}. */
  private readonly moreEl: HTMLButtonElement;
  /** `(content, rail height, page)` the current fit was solved for. */
  private fitKey = '';
  /** How much has been given up to make the content fit. 0 = nothing. */
  private fitRung = 0;
  /** Index of the first block of the page on screen. 0 = the top of the guide. */
  private pageStart = 0;
  /** Index the next MORE click jumps to; 0 wraps back to the top. */
  private nextPage = 0;

  constructor(opts: StrategyGuideOptions) {
    this.opts = opts;
    this.visible = (opts.readVisible ?? (() => readSetting('guideVisible')))();

    this.el = document.createElement('div');
    this.el.className = `sgd${opts.game === 'ffx2' ? ' sgd--ffx2' : ''}`;
    this.el.dataset['role'] = 'strategy-guide';

    this.toggleEl = document.createElement('button');
    this.toggleEl.type = 'button';
    this.toggleEl.className = 'sgd__toggle';
    this.toggleEl.dataset['role'] = 'strategy-guide-toggle';

    this.stackEl = document.createElement('div');
    this.stackEl.className = 'sgd__stack';
    this.stackEl.dataset['role'] = 'strategy-guide-stack';

    this.panelEl = document.createElement('div');
    this.panelEl.className = 'sgd__panel';
    this.panelEl.dataset['role'] = 'strategy-guide-panel';

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'sgd__body';

    // A pad cannot wheel a panel, so the affordance is also the control: one
    // click pages down, and a click at the foot returns to the top. Hidden
    // unless there is genuinely something below the fold. It is the column's
    // second row, so it owns its height instead of covering the body's.
    this.moreEl = document.createElement('button');
    this.moreEl.type = 'button';
    this.moreEl.className = 'sgd__more';
    this.moreEl.dataset['role'] = 'strategy-guide-more';
    this.moreEl.hidden = true;
    this.moreEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.pageDown();
    });

    this.panelEl.append(this.bodyEl);
    this.stackEl.append(this.panelEl, this.moreEl);
    this.el.append(this.stackEl, this.toggleEl);

    this.toggleEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    this.applyVisible();
  }

  // ----------------------------------------------------------------- mount

  /** Mount into the HUD's scaled stage, so the slab shares the chrome's letterbox. */
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
    (this.opts.writeVisible ?? ((v: boolean) => writeSetting('guideVisible', v)))(on);
    this.applyVisible();
    if (on) this.render();
  }

  private applyVisible(): void {
    this.panelEl.hidden = !this.visible;
    this.el.classList.toggle('sgd--off', !this.visible);
    // The chip keeps its measured anchor. Round 05 PR-0050: this used to clear
    // the inline `top` and let the chip fall back to `.sgd__toggle`'s static
    // `top: 44px`, on the theory that a stale measurement was worse than the
    // authored default. In FFX the default happens to be right — the thing
    // above the rail is the action banner, which ends at grid y 48. In FFX-2
    // the thing above the rail is the boss gauge strip, which is taller, so the
    // fallback printed `G GUIDE` across Bahamut's nameplate, HP bar and SCAN
    // label. The anchor does not depend on the panel: it is the bottom edge of
    // whatever chrome the owner named, which is laid out whether the guide is
    // up or not, so it is re-read here and every frame in `update()`.
    if (!this.visible) {
      this.layoutToggle();
      this.stackEl.style.top = '';
      this.stackEl.style.maxHeight = '';
      // The affordance belongs to the panel, not to the chip: with the guide
      // off there is nothing below any fold.
      this.moreEl.hidden = true;
      // The fit is solved against a rail height that no longer applies.
      this.fitKey = '';
    }
    const keys = this.padConnected() ? GUIDE_HINT_ITEM.gamepad : GUIDE_HINT_ITEM.keyboard;
    this.toggleEl.innerHTML =
      `<b>${escapeHtml(keys)}</b><span>${escapeHtml(this.visible ? 'hide guide' : 'guide')}</span>`;
    this.toggleEl.setAttribute('aria-pressed', String(this.visible));
    this.toggleEl.title = this.visible ? 'Hide the strategy guide' : 'Show the strategy guide';
  }

  /**
   * `KeyG`, edge-only.
   *
   * Deliberately not routed through `src/app/Input.ts`: nothing in the battle
   * screen forwards an `InputSnapshot` to the HUD, and adding a button to the
   * shared map for one optional panel would put a global binding in a contract
   * file that thirty agents import.
   */
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyG' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    this.toggle();
  };

  private padConnected(): boolean {
    try {
      const pads = navigator.getGamepads?.() ?? [];
      return Array.from(pads).some((p) => p !== null && p.connected);
    } catch {
      return false;
    }
  }

  /** Per-frame tick from the HUD: polls the pad and keeps the height honest. */
  update(_dt: number): void {
    this.pollPad();
    if (this.visible) this.layout();
    // With the guide off there is no rail to solve, but the chip still has to
    // follow the chrome it sits under: in FFX-2 the boss gauge strip grows and
    // shrinks a block per living enemy, so a top measured once at the start of
    // the battle is wrong by the time the first add dies (round 05 PR-0050).
    else this.layoutToggle();
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

  /** New engine state. Refreshes WATCH and the phase note. */
  sync(state: Readonly<BattleState>): void {
    this.lastState = state;
    this.render();
  }

  /** A player decision opened: NEXT now has something to say. */
  showDecision(actorId: CombatantId, commands: AvailableCommand[], state?: Readonly<BattleState>): void {
    if (state) this.lastState = state;
    this.decision = { actorId, commands };
    this.render();
  }

  /** The decision was taken (or abandoned). */
  clearDecision(): void {
    if (!this.decision) return;
    this.decision = null;
    this.render();
  }

  /** The view the panel would draw right now, for tests and the debug snapshot. */
  view(): GuideView | null {
    if (!this.lastState) return null;
    return buildGuideView(this.lastState, this.decision, ffx2CoachClock());
  }

  // -------------------------------------------------------------- rendering

  private render(): void {
    if (!this.mounted) return;
    const view = this.lastState ? buildGuideView(this.lastState, this.decision, ffx2CoachClock()) : null;
    // No written guide for this encounter: no panel and no chip, never a chip that opens an empty box.
    this.el.hidden = view === null;
    if (!view || !this.visible) return;

    const signature = signatureOf(view);
    if (signature === this.lastSignature) {
      this.layout();
      return;
    }
    this.lastSignature = signature;
    this.bodyEl.innerHTML = bodyHtml(view);
    // New text: back to page one, and re-solve the fit against it.
    this.pageStart = 0;
    this.fitKey = '';
    this.layout();
  }

  /**
   * The rail's top edge, in stage-grid px: below whatever chrome the owner
   * named, with room for the chip that rides above it.
   *
   * The chip rides `CHIP_RISE` **above** the rail's top edge, so the rail has
   * to leave room for it under whatever it is clearing — otherwise the chip
   * itself lands on that anchor. In FFX the anchor is the action banner
   * (`.ig-banner`, grid y 17.8..48) and the chip is 7.5px tall, which is
   * exactly how `G GUIDE` ended up printed across the banner in Bailey's
   * Chapter 1 capture. The fallback `anchors.top` already has the rise counted
   * in (44, with the chip at 33), so only the measured branch adds it.
   *
   * `offsetHeight > 0` is the gate, not merely "the element exists": chrome
   * that is not laid out reports `offsetTop: 0` and would pull the rail to the
   * top of the stage.
   */
  private railTop(): number {
    const { anchors } = this.opts;
    const below = anchors.below?.() ?? null;
    return below && below.offsetHeight > 0
      ? below.offsetTop + below.offsetHeight + CLEARANCE_GAP + CHIP_RISE
      : anchors.top;
  }

  /**
   * Put the chip `CHIP_RISE` above the rail's top edge — the only geometry that
   * still applies when the panel under it is hidden (round 05 PR-0050).
   */
  private layoutToggle(): void {
    this.toggleEl.style.top = `${Math.max(0, this.railTop() - CHIP_RISE).toFixed(2)}px`;
  }

  /**
   * Cap the rail at whatever chrome it has to clear. See the class comment on
   * why this is measured rather than a constant.
   */
  private layout(): void {
    const { anchors } = this.opts;
    const top = this.railTop();

    // `offsetTop` is already stage-space: every anchor and the panel share the
    // HUD stage as their offset parent.
    //
    // `offsetHeight > 0` is the gate, not merely "the element exists". A hidden
    // anchor (`.ffx2hud__command` is `hidden` whenever no menu is open, and
    // `.ffxhud [hidden] { display: none }` applies to FFX's own chrome) reports
    // `offsetTop: 0`, which would put the floor five pixels *above* the stage's
    // top edge and collapse the rail to MIN_PANEL_HEIGHT for the whole battle.
    // An anchor that is not laid out has no edge to clear, so fall back.
    const aboveEl = anchors.above?.() ?? null;
    const above = aboveEl && aboveEl.offsetHeight > 0 ? aboveEl : null;
    const floor = above ? above.offsetTop - CLEARANCE_GAP : 360 - anchors.bottom;

    const available = Math.max(MIN_PANEL_HEIGHT, floor - top);
    this.stackEl.style.top = `${top.toFixed(2)}px`;
    this.stackEl.style.maxHeight = `${available.toFixed(2)}px`;
    this.layoutToggle();
    // Short rules while the menu is eating the rail; the paragraphs come back
    // when it closes. See COMPACT_HEIGHT.
    this.el.classList.toggle('sgd--compact', available < COMPACT_HEIGHT);
    this.refit(available);
  }

  /**
   * Solve the column: density rung, then the whole-block cut, then MORE.
   *
   * Round 04 PR-0009, second pass. Two earlier fixes clamped a *continuous*
   * height computed from `Range` rects and both left a line sliced live, the
   * second one because the rects and the budget were in different units. This
   * reads no screen pixels at all for the decision:
   *
   *  1. every block that can be given up is given up, in {@link FIT_RUNGS}'s
   *     order, while `.sgd__body`'s own `scrollHeight` — a layout number, in
   *     stage-grid px, which no ancestor transform can move — exceeds the rail;
   *  2. what is left is measured block by block off `offsetTop`/`offsetHeight`
   *     and cut by {@link fitWholeUnits}: whole blocks only, so the box can
   *     only ever end where a block ended;
   *  3. the MORE row's own `MORE_HEIGHT` comes out of the budget **before** the
   *     cut, not off the top of the finished box, because it is a row of the
   *     column now rather than a chip laid over one.
   *
   * Solved once per `(content, rail height, page)` and then held, for the
   * reason `MoveAdvisor.fitCard` records: a fit keyed on anything that moves
   * per frame drops and restores a whole sentence several times a second while
   * the player is reading it.
   *
   * In jsdom every box measures 0. There is no layout to fit to, so this
   * restores the full content and leaves — which is what the unit tests in
   * `ui-strategy-guide.test.ts` are asserting about.
   */
  private refit(available: number): void {
    const key = `${this.lastSignature}|${Math.round(available)}|${this.pageStart}`;
    if (key === this.fitKey) return;

    // Clean slate. The fit only ever *removes* content, so it has to be solved
    // against the whole of it rather than against last frame's leftovers.
    this.bodyEl.style.height = '';
    this.fitRung = 0;
    this.applyRung();
    const all = this.allUnits();
    for (const unit of all) unit.classList.remove(OUT_CLASS);

    const chrome = this.panelEl.offsetHeight - this.bodyEl.offsetHeight;
    if (!(this.bodyEl.scrollHeight > 0) || !(chrome >= 0)) {
      // No layout engine (jsdom) or nothing painted yet: show everything
      // rather than clamp the body to a measured zero.
      this.moreEl.hidden = true;
      this.nextPage = 0;
      return;
    }
    this.fitKey = key;

    const rail = Math.max(0, available - chrome);
    while (this.fitRung < FIT_RUNGS && this.bodyEl.scrollHeight > rail + 0.5) {
      this.fitRung++;
      this.applyRung();
    }

    const visible = this.allUnits().filter((el) => el.offsetHeight > 0);
    const start = Math.min(Math.max(0, this.pageStart), Math.max(0, visible.length - 1));
    for (let i = 0; i < start; i++) visible[i]!.classList.add(OUT_CLASS);
    const page = visible.slice(start);

    // MORE owns a row, so its height is spent before the cut, never after it.
    const overflowing = this.bodyEl.scrollHeight > rail + 0.5;
    const reserve = overflowing || start > 0 ? MORE_HEIGHT : 0;
    const budget = Math.max(0, rail - reserve);

    const bodyTop = this.bodyEl.offsetTop;
    const scale = this.stageScale();
    const bodyTopPx = this.bodyEl.getBoundingClientRect().top;
    const fit = fitWholeUnits(
      page.map((el) => this.measureUnit(el, bodyTop, scale, bodyTopPx)),
      budget,
    );
    for (let i = fit.shown; i < page.length; i++) page[i]!.classList.add(OUT_CLASS);
    this.bodyEl.style.height = `${Math.max(0, fit.height).toFixed(2)}px`;
    this.moreEl.hidden = !(fit.clipped || start > 0);
    this.nextPage = fit.clipped ? start + fit.shown : 0;
  }

  /** Every block of text in the body, in reading order. */
  private allUnits(): HTMLElement[] {
    return Array.from(this.bodyEl.querySelectorAll<HTMLElement>('.sgd__u'));
  }

  /**
   * One block's box bottom and glyph bottom, relative to the body's own top.
   *
   * The box bottom is pure layout arithmetic. The glyph bottom needs the
   * rendered type, so it is read as **a proportion of this element's own
   * rect** — numerator and denominator are both screen pixels of the *same*
   * box, so whatever uniform scale the letterbox stage is applying cancels
   * out exactly, at any ancestor depth and without the panel having to know
   * which ancestor applies it. That is the lesson of the first two attempts:
   * a measurement that has to be converted between coordinate systems is a
   * measurement that can be converted wrongly.
   *
   * Falls back to the box bottom whenever the type cannot be measured — a few
   * px of empty leading below the last line is not a defect, a sliced line is.
   */
  private measureUnit(el: HTMLElement, bodyTop: number, scale: number, bodyTopPx: number): GuideFitUnit {
    const bottom = el.offsetTop - bodyTop + el.offsetHeight;
    const heading = el.classList.contains('sgd__head');
    return { bottom, glyphBottom: this.glyphBottom(el, bottom, scale, bodyTopPx), heading };
  }

  private glyphBottom(el: HTMLElement, boxBottom: number, scale: number, bodyTopPx: number): number {
    if (!(scale > 0)) return boxBottom;
    try {
      let lowest = Number.NEGATIVE_INFINITY;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent || !node.textContent.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const glyphs of Array.from(range.getClientRects())) {
          if (glyphs.height > 0.5 && glyphs.width > 0.5 && glyphs.bottom > lowest) lowest = glyphs.bottom;
        }
      }
      if (!Number.isFinite(lowest)) return boxBottom;
      const exact = (lowest - bodyTopPx) / scale;
      // Guard rails, in the block's own terms: the type cannot be lower than
      // its box (plus a px for `offsetTop`/`offsetHeight`'s integer rounding)
      // and it cannot be half a box higher. Anything outside that is not a
      // measurement of this block's last line, so the box bottom stands — a
      // little empty leading is not a defect, a sliced line is.
      if (!(exact > boxBottom - el.offsetHeight * 0.5) || exact > boxBottom + 1) return boxBottom;
      return exact;
    } catch {
      return boxBottom;
    }
  }

  /**
   * The letterbox stage's scale, measured **exactly**.
   *
   * `FFXBattleHud.layout()` / `LetterboxStage.createStage()` scale an ancestor
   * of this rail to fit the viewport, so every rect this file reads is in
   * screen px while every length it writes is in stage-grid px. The previous
   * attempt recovered the factor as `bodyRect.height / bodyEl.offsetHeight` —
   * and `offsetHeight` is **rounded to a whole pixel**, so at 1280x720 that
   * returns 1.9836 where the real factor is 2. Half a grid px of error there
   * is a whole screen px at 2x and nearly four at 4K.
   *
   * A computed style is never rounded and never scaled: the slab's authored
   * `padding` is exactly 5px + 6px whatever the stage is doing. The difference
   * between the slab's rect height and its body's rect height is exactly that
   * padding *after* the transform, and neither rect is rounded — so their
   * ratio is the scale, to full precision, without the panel needing a
   * reference to whichever ancestor applies it.
   *
   * Returns 0 when it cannot be measured (jsdom, nothing painted yet, a slab
   * authored with no padding); callers then keep the unrounded box bottoms and
   * lose only a px of leading.
   */
  private stageScale(): number {
    try {
      const cs = getComputedStyle(this.panelEl);
      const chrome =
        (Number.parseFloat(cs.paddingTop) || 0) +
        (Number.parseFloat(cs.paddingBottom) || 0) +
        (Number.parseFloat(cs.borderTopWidth) || 0) +
        (Number.parseFloat(cs.borderBottomWidth) || 0);
      if (!(chrome > 0)) return 0;
      const painted = this.panelEl.getBoundingClientRect().height - this.bodyEl.getBoundingClientRect().height;
      const scale = painted / chrome;
      return Number.isFinite(scale) && scale > 0.05 ? scale : 0;
    } catch {
      return 0;
    }
  }

  private applyRung(): void {
    for (let r = 1; r <= FIT_RUNGS; r++) this.el.classList.toggle(`sgd--fit${r}`, this.fitRung >= r);
  }

  /**
   * One page down, wrapping back to the top at the foot.
   *
   * Pages by *block*, not by `scrollTop`, for the same reason the cut does: a
   * scrolled panel puts an arbitrary offset at its bottom edge and slices
   * whatever line is there. The next page starts at the first block this one
   * could not show.
   */
  private pageDown(): void {
    this.pageStart = this.nextPage;
    this.fitKey = '';
    this.layout();
  }
}

// --------------------------------------------------------------- templates

/** Everything that can change what the panel says, in one string. */
function signatureOf(view: GuideView): string {
  return [
    `${view.chapterId}:${view.rules.length}`, // a clock flip in the pause adds or drops the clock's rule
    view.next?.label ?? '',
    view.next?.targetId ?? '',
    view.next?.reason ?? '',
    view.phase?.label ?? '',
    view.watch.map((w) => `${w.payload}:${w.timing}:${w.stage}`).join('|'),
  ].join('');
}

/**
 * The marker class every block of text in the body carries.
 *
 * `StrategyGuide.refit` hides whole `.sgd__u` blocks rather than clamping a
 * height through the middle of one, so "a line is never sliced" is a property
 * of the markup: a block whose last glyph would fall outside the rail is not
 * drawn at all. Anything that prints type into the body needs this class.
 */
const U = 'sgd__u';

function sectionHead(label: string): string {
  return `<h4 class="sgd__head ${U}">${escapeHtml(label)}</h4>`;
}

function citeHtml(cite: string): string {
  return cite ? `<p class="sgd__cite ${U}">${escapeHtml(cite)}</p>` : '';
}

function nextHtml(view: GuideView): string {
  const next = view.next;
  if (!next) {
    return `${sectionHead('Next')}<p class="sgd__idle ${U}">Waiting for your turn.</p>`;
  }
  const target = next.targetName
    ? `<span class="sgd__arrow">→</span><span class="sgd__target">${escapeHtml(next.targetName)}</span>`
    : '';
  return [
    sectionHead('Next'),
    `<p class="sgd__actor ${U}">${escapeHtml(next.actorName)}</p>`,
    `<p class="sgd__cmd ${U}"><span class="sgd__label">${escapeHtml(next.label)}</span>${target}</p>`,
    next.reason ? `<p class="sgd__why ${U}">${escapeHtml(next.reason)}.</p>` : '',
    citeHtml(next.cite),
  ].join('');
}

function watchHtml(view: GuideView): string {
  if (view.watch.length === 0 && !view.phase) return '';
  const charges = view.watch
    .map(
      (w) =>
        `<div class="sgd__charge sgd__charge--s${w.stage}">` +
        `<p class="sgd__cmd ${U}"><span class="sgd__label">${escapeHtml(w.payload)}</span>` +
        `<span class="sgd__timing">${escapeHtml(w.timing)}</span></p>` +
        `<p class="sgd__why ${U}">${escapeHtml(w.advice)}.</p>` +
        citeHtml(w.cite) +
        '</div>',
    )
    .join('');
  const phase = view.phase
    ? `<div class="sgd__phase"><p class="sgd__phase-label ${U}">${escapeHtml(view.phase.label)}</p>` +
      `<p class="sgd__why ${U}">${escapeHtml(view.phase.note)}</p>${citeHtml(view.phase.cite)}</div>`
    : '';
  return `${sectionHead('Watch')}${charges}${phase}`;
}

/**
 * Both forms of every rule, with the stylesheet choosing between them.
 *
 * Writing both into the DOM rather than re-rendering on the compact/roomy
 * switch is deliberate: {@link StrategyGuide.layout} runs every frame off a
 * measured anchor, so a render keyed on the measurement would rewrite this
 * list whenever a menu opened, and a `signatureOf` that ignored the
 * measurement would leave the wrong form on screen. CSS switching costs one
 * class toggle and cannot fall out of step with the measurement that caused it.
 */
function rulesHtml(view: GuideView): string {
  if (view.rules.length === 0) return '';
  const items = view.rules
    .map(
      (r) =>
        `<li class="${U}">` +
        `<span class="sgd__rule-full">${escapeHtml(r.text)}</span>` +
        `<span class="sgd__rule-short">${escapeHtml(r.short)}</span>` +
        `<span class="sgd__cite">${escapeHtml(r.cite)}</span>` +
        '</li>',
    )
    .join('');
  return `${sectionHead('Rules')}<ul class="sgd__rules">${items}</ul>`;
}

function bodyHtml(view: GuideView): string {
  return [
    `<p class="sgd__title ${U}">${escapeHtml(view.title)}</p>`,
    `<section class="sgd__sec sgd__sec--next">${nextHtml(view)}</section>`,
    watchHtml(view) ? `<section class="sgd__sec sgd__sec--watch">${watchHtml(view)}</section>` : '',
    rulesHtml(view) ? `<section class="sgd__sec sgd__sec--rules">${rulesHtml(view)}</section>` : '',
  ].join('');
}
