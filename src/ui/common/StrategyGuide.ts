import './strategy-guide.css';
import type { BattleState, GameId } from '../../battle/common/types.ts';
import { readSetting, writeSetting } from '../../app/SaveData.ts';
import { GUIDE_HINT_ITEM } from './ControlsHint.ts';
import { escapeHtml } from './html.ts';
import { docForState, headingAt, startBlockIndex, type GuideDocView } from './guideDoc.ts';
import { docHtml } from './guideDocHtml.ts';
import { fitWholeUnits, linePitch, resetLines, showLines, type GuideFitUnit } from './guideFit.ts';

// The page-fitting arithmetic lives in `./guideFit.ts`; these names stay importable from here.
export { fitWholeUnits, type GuideFit, type GuideFitUnit } from './guideFit.ts';

/**
 * The optional in-battle strategy guide: an Ink & Gold side slab that holds the written guide for
 * the boss on the field, laid out as that guide is laid out.
 *
 * Bailey, 2026-10-03: "from now on the guide follows the ffx/ffx-2 encounter guides" and "Just match
 * the original document please in terms of formatting and everything else". So the panel is **a
 * document**, not a plan: the boss's header, its stat lines (the game's description line, HP, Steal,
 * Drops; FFX-2's Enemy / HP / Steal / Drop table), then the advice in the order the guide gives it, as
 * paragraphs, lists, lead-ins and sub-headings (`src/data/guides/docs/`, shapes in `../../data/guides/doc-types.ts`).
 * Nothing in it is computed from the fight: it opens on the part of the document for the boss that is
 * standing (`./guideDoc.ts`), and `MORE` turns the page. The move advisor is a separate panel with a
 * separate reasoning and never reads this one.
 *
 * Everything printed is plain strategy-guide prose, in our own words. No source, citation or
 * section number is ever rendered (Bailey, 2026-10-03); `tests/unit/guide-doc-words.test.ts` fails on
 * any rendered string that names where advice came from.
 *
 * ## Optional means optional
 *
 * `G`, the pad's spare face button, or the chip itself hides everything but a chip the width of two
 * words, and the answer is remembered in `Settings.guideVisible` for every later battle. Default is
 * on.
 *
 * ## It never sits on the command menu
 *
 * The panel is a left rail inside the HUD's own 640x360 letterbox stage, so it scales with the rest
 * of the chrome. Its height is not a constant: the owner hands it the element it must clear
 * (`.ffx-cmd-area` in FFX, whose stack grows upward from the bottom-left as a submenu fills), and
 * {@link layout} caps the panel at that element's top edge every frame. When the menu closes the
 * rail grows back. That is why this is a measured layout rather than a fixed box.
 *
 * ## A long document pages by whole blocks
 *
 * A page here is as many whole blocks as the rail holds ({@link StrategyGuide.refit}); `MORE` turns to
 * the next page and wraps to the top at the foot, because a pad has no wheel. The phone shows the
 * whole document as a scrolling sheet instead (`phone-battle.css`).
 *
 * ## Input, without touching `Input.ts`
 *
 * `src/app/Input.ts` maps a small set of abstract buttons and the battle screen forwards none of them
 * to the HUD, so the guide listens for itself: a `keydown` on `KeyG` (the one key no existing binding
 * claims) and a poll of standard gamepad button 2, which `PAD_MAP` also leaves free. Both are
 * edge-detected and both stop at {@link unmount}.
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
 * It is a constant rather than a measurement because `layout()` runs before the chip's first paint on
 * the opening frame, and a zero height there would drop the chip onto the banner for exactly the frame
 * a screenshot is most likely to catch. 11 is the gap the authored `top: 44` / chip `top: 44 - 11` pair
 * in `strategy-guide.css` already encodes.
 */
const CHIP_RISE = 11;

/** Height of the MORE affordance row, in grid px. Mirrors `.sgd__more`'s own. */
const MORE_HEIGHT = 11;

/** The class that takes a block out of the body's flow entirely. */
const OUT_CLASS = 'sgd__u--out';

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
  private padWasDown = false;
  /** Signature of the last render, so a per-frame `sync` does not re-write the DOM. */
  private lastSignature = '';
  /** The paging affordance; see {@link StrategyGuide.refit}. */
  private readonly moreEl: HTMLButtonElement;
  /** `(content, rail height, page)` the current fit was solved for. */
  private fitKey = '';
  /** Index of the first block of the page on screen. 0 = the top of the document. */
  private pageStart = 0;
  /** Index the next MORE click jumps to; 0 wraps back to the top. */
  private nextPage = 0;
  /** Lines of the page's first unit that earlier pages already showed (a paragraph that carried over). */
  private pageLine = 0;
  /** Lines of the `nextPage` unit that this page already showed. */
  private nextLine = 0;
  /** The block the document opens on, and whether the phone's sheet still has to scroll to it. */
  private startBlock = 0;
  private phoneScrollPending = false;
  /** What the panel is showing now (`view()`). */
  private shown: GuideDocView | null = null;

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

    // A pad cannot wheel a panel, so the affordance is also the control: one click pages down, and a
    // click at the foot returns to the top. Hidden unless there is genuinely something below the
    // fold. It is the column's second row, so it owns its height instead of covering the body's.
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
    // The chip keeps its measured anchor. Round 05 PR-0050: this used to clear the inline `top` and let
    // the chip fall back to `.sgd__toggle`'s static `top: 44px`, on the theory that a stale measurement
    // was worse than the authored default. In FFX the default happens to be right — the thing above
    // the rail is the action banner, which ends at grid y 48. In FFX-2 the thing above the rail is the
    // boss gauge strip, which is taller, so the fallback printed `G GUIDE` across Bahamut's nameplate,
    // HP bar and SCAN label. The anchor does not depend on the panel: it is the bottom edge of whatever
    // chrome the owner named, which is laid out whether the guide is up or not, so it is re-read here
    // and every frame in `update()`.
    if (!this.visible) {
      this.layoutToggle();
      this.stackEl.style.top = '';
      this.stackEl.style.maxHeight = '';
      // The affordance belongs to the panel, not to the chip: with the guide off there is nothing
      // below any fold.
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
   * Deliberately not routed through `src/app/Input.ts`: nothing in the battle screen forwards an
   * `InputSnapshot` to the HUD, and adding a button to the shared map for one optional panel would put
   * a global binding in a contract file that thirty agents import.
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
    // With the guide off there is no rail to solve, but the chip still has to follow the chrome it sits
    // under: in FFX-2 the boss gauge strip grows and shrinks a block per living enemy, so a top
    // measured once at the start of the battle is wrong by the time the first add dies (round 05
    // PR-0050).
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

  /** New engine state: the boss on the field may have changed, and with it where the document opens. */
  sync(state: Readonly<BattleState>): void {
    this.lastState = state;
    this.render();
  }

  /** What the panel is showing right now, for tests and the debug snapshot. */
  view(): GuideDocView | null {
    return this.shown;
  }

  // -------------------------------------------------------------- rendering

  private render(): void {
    if (!this.mounted) return;
    const doc = this.lastState ? docForState(this.lastState) : null;
    // No written guide for this encounter: no panel and no chip, never a chip that opens an empty box.
    this.el.hidden = doc === null;
    if (!doc || !this.lastState) {
      this.shown = null;
      return;
    }
    const start = startBlockIndex(doc, this.lastState);
    this.shown = { chapterId: doc.id, title: headingAt(doc, start), start };
    if (!this.visible) return;

    const signature = `${doc.id}:${start}`;
    if (signature === this.lastSignature) {
      this.layout();
      return;
    }
    this.lastSignature = signature;
    this.bodyEl.innerHTML = docHtml(doc);
    // New document, or a new fight in it: open on that fight's part and re-solve the fit against it.
    this.startBlock = start;
    this.phoneScrollPending = true;
    const first = this.bodyEl.querySelector<HTMLElement>(`[data-block="${start}"]`);
    this.pageStart = Math.max(0, first ? this.allUnits().indexOf(first) : 0);
    this.pageLine = 0;
    this.fitKey = '';
    this.layout();
  }

  /**
   * The rail's top edge, in stage-grid px: below whatever chrome the owner named, with room for the
   * chip that rides above it.
   *
   * The chip rides `CHIP_RISE` **above** the rail's top edge, so the rail has to leave room for it
   * under whatever it is clearing — otherwise the chip itself lands on that anchor. In FFX the anchor
   * is the action banner (`.ig-banner`, grid y 17.8..48) and the chip is 7.5px tall, which is exactly
   * how `G GUIDE` ended up printed across the banner in Bailey's Chapter 1 capture. The fallback
   * `anchors.top` already has the rise counted in (44, with the chip at 33), so only the measured
   * branch adds it.
   *
   * `offsetHeight > 0` is the gate, not merely "the element exists": chrome that is not laid out
   * reports `offsetTop: 0` and would pull the rail to the top of the stage.
   */
  private railTop(): number {
    const { anchors } = this.opts;
    const below = anchors.below?.() ?? null;
    return below && below.offsetHeight > 0
      ? below.offsetTop + below.offsetHeight + CLEARANCE_GAP + CHIP_RISE
      : anchors.top;
  }

  /**
   * Put the chip `CHIP_RISE` above the rail's top edge — the only geometry that still applies when the
   * panel under it is hidden (round 05 PR-0050).
   */
  private layoutToggle(): void {
    this.toggleEl.style.top = `${Math.max(0, this.railTop() - CHIP_RISE).toFixed(2)}px`;
  }

  /**
   * Cap the rail at whatever chrome it has to clear. See the class comment on why this is measured
   * rather than a constant.
   */
  private layout(): void {
    // The upright phone shows the guide as a scrolling sheet (`phone-battle.css`), not a rail between two
    // chrome elements, so the desktop's anchors mean nothing there. Nothing is fitted or paged on the phone.
    if (onPhone()) {
      this.layoutPhone();
      return;
    }
    const { anchors } = this.opts;
    const top = this.railTop();

    // `offsetTop` is already stage-space: every anchor and the panel share the HUD stage as their offset
    // parent.
    //
    // `offsetHeight > 0` is the gate, not merely "the element exists". A hidden anchor
    // (`.ffx2hud__command` is `hidden` whenever no menu is open, and `.ffxhud [hidden] { display: none }`
    // applies to FFX's own chrome) reports `offsetTop: 0`, which would put the floor five pixels *above*
    // the stage's top edge and collapse the rail to MIN_PANEL_HEIGHT for the whole battle. An anchor that
    // is not laid out has no edge to clear, so fall back.
    const aboveEl = anchors.above?.() ?? null;
    const above = aboveEl && aboveEl.offsetHeight > 0 ? aboveEl : null;
    const floor = above ? above.offsetTop - CLEARANCE_GAP : 360 - anchors.bottom;

    const available = Math.max(MIN_PANEL_HEIGHT, floor - top);
    this.stackEl.style.top = `${top.toFixed(2)}px`;
    this.stackEl.style.maxHeight = `${available.toFixed(2)}px`;
    this.layoutToggle();
    this.refit(available);
  }

  /**
   * Solve the column: the whole-block cut, a paragraph's first lines in what is left, then MORE.
   *
   * Round 04 PR-0009, second pass. Two earlier fixes clamped a *continuous* height computed from `Range`
   * rects and both left a line sliced live, the second one because the rects and the budget were in
   * different units. This reads no screen pixels at all for the decision:
   *
   *  1. every block before the page's first is taken out of the flow;
   *  2. what is left is measured block by block off `offsetTop`/`offsetHeight` and cut by
   *     {@link fitWholeUnits}: whole blocks only, so the box can only ever end where a block ended;
   *  3. the MORE row's own `MORE_HEIGHT` comes out of the budget **before** the cut, not off the top of
   *     the finished box, because it is a row of the column now rather than a chip laid over one;
   *  4. a long document would waste a fifth of every page if only whole blocks could end it, so when the
   *     next block is a paragraph or a list item (a *split* unit: one font size, one line pitch, no
   *     padding) the page also takes as many of its first lines as the rest of the page holds, and the
   *     next page opens on the line after. The cut is a whole number of line pitches, so it falls
   *     between two lines, never through one; it never leaves a single line behind or ahead, and
   *     never splits anything but plain text ({@link linePitch} is 0 wherever the pitch cannot be read).
   *
   * Solved once per `(content, rail height, page)` and then held, for the reason `MoveAdvisor.fitCard`
   * records: a fit keyed on anything that moves per frame drops and restores a whole sentence several
   * times a second while the player is reading it.
   *
   * In jsdom every box measures 0. There is no layout to fit to, so this restores the full content and
   * leaves — which is what the unit tests in `ui-strategy-guide.test.ts` are asserting about.
   */
  private refit(available: number): void {
    // The key carries what else the panel holds (the status hint card, which rides at its top while a party member
    // has a status with a sourced rule): it counts as chrome below, and it can arrive or go after the fit was
    // solved, in a game whose rail does not move with the menu (FFX-2: the fence above the party never changes).
    // Without it a body fitted to the whole rail grows a card on top of itself and the panel outgrows its rail.
    const key = `${this.lastSignature}|${Math.round(available)}|${this.pageStart}|${this.pageLine}|${this.extraChrome()}`;
    if (key === this.fitKey) return;

    // Clean slate. The fit only ever *removes* content, so it has to be solved against the whole of it
    // rather than against last frame's leftovers.
    this.bodyEl.style.height = '';
    const all = this.allUnits();
    for (const unit of all) {
      unit.classList.remove(OUT_CLASS);
      resetLines(unit);
    }

    const chrome = this.panelEl.offsetHeight - this.bodyEl.offsetHeight;
    if (!(this.bodyEl.scrollHeight > 0) || !(chrome >= 0)) {
      // No layout engine (jsdom) or nothing painted yet: show everything rather than clamp the body to
      // a measured zero.
      this.moreEl.hidden = true;
      this.nextPage = 0;
      this.nextLine = 0;
      return;
    }
    this.fitKey = key;

    const rail = Math.max(0, available - chrome);
    const visible = all.filter((el) => el.offsetHeight > 0);
    const start = Math.min(Math.max(0, this.pageStart), Math.max(0, visible.length - 1));
    for (let i = 0; i < start; i++) visible[i]!.classList.add(OUT_CLASS);
    const page = visible.slice(start);

    // A paragraph that carried over from the last page opens this one on the line it stopped at.
    const lead = page[0];
    let carried = 0;
    if (lead && this.pageLine > 0) {
      const pitch = linePitch(lead);
      const lines = pitch ? Math.round(lead.offsetHeight / pitch) : 0;
      if (pitch && this.pageLine < lines) {
        showLines(lead, this.pageLine, lines - this.pageLine, pitch);
        carried = this.pageLine;
      } else {
        this.pageLine = 0;
      }
    }

    // MORE owns a row, so its height is spent before the cut, never after it.
    const overflowing = this.bodyEl.scrollHeight > rail + 0.5;
    const reserve = overflowing || start > 0 || this.pageLine > 0 ? MORE_HEIGHT : 0;
    const budget = Math.max(0, rail - reserve);

    const bodyTop = this.bodyEl.offsetTop;
    const scale = this.stageScale();
    const bodyTopPx = this.bodyEl.getBoundingClientRect().top;
    const units = page.map((el) => this.measureUnit(el, bodyTop, scale, bodyTopPx));

    // First the cut as if no unit were a head, so a head that would end the page can keep its first lines of text
    // with it; only when no paragraph can be split after it does the head rule drop it ({@link fitWholeUnits}).
    const raw = fitWholeUnits(units.map((u) => ({ bottom: u.bottom, glyphBottom: u.glyphBottom })), budget);
    // The unit that did not fit whole: the page's first when even that overflows, else the one after the cut.
    const whole = raw.shown === 1 && units[0] !== undefined && units[0].bottom > budget + 0.5 ? 0 : raw.shown;
    const cutEl = page[whole];
    let height: number;
    let shownWhole: number;
    let nextUnit: number;
    let nextLine = 0;
    let clipped: boolean;
    const pitch = cutEl && cutEl.classList.contains('sgd__split') && (raw.clipped || whole === 0) ? linePitch(cutEl) : 0;
    const total = pitch ? Math.round(cutEl!.offsetHeight / pitch) : 0;
    const top = pitch ? cutEl!.offsetTop - bodyTop : 0;
    let n = pitch ? Math.floor((budget - top + 0.5) / pitch) : 0;
    if (total - n === 1 && n > 2) n -= 1; // never leave a single line for the next page
    if (pitch && n >= (whole === 0 ? 1 : 2) && n < total) {
      const from = whole === 0 ? carried : 0;
      showLines(cutEl!, from, n, pitch);
      height = top + n * pitch;
      shownWhole = whole;
      nextUnit = start + whole;
      nextLine = from + n;
      clipped = true;
    } else {
      const fit = fitWholeUnits(units, budget);
      height = fit.height;
      shownWhole = fit.shown;
      nextUnit = start + fit.shown;
      clipped = fit.clipped;
    }
    const after = shownWhole + (nextLine > 0 ? 1 : 0);
    for (let i = after; i < page.length; i++) page[i]!.classList.add(OUT_CLASS);
    this.bodyEl.style.height = `${Math.max(0, height).toFixed(2)}px`;
    this.moreEl.hidden = !(clipped || start > 0 || this.pageLine > 0);
    this.nextPage = clipped ? nextUnit : 0;
    this.nextLine = clipped ? nextLine : 0;
  }

  /**
   * The height of everything in the panel except the body (the status hint card). Read from the cards
   * themselves, not as `panel - body`, so fitting the body can never change it and re-key the fit.
   */
  private extraChrome(): number {
    let height = 0;
    for (const child of Array.from(this.panelEl.children)) {
      if (child !== this.bodyEl) height += (child as HTMLElement).offsetHeight;
    }
    return Math.round(height);
  }

  /** Every block of text in the body, in reading order. */
  private allUnits(): HTMLElement[] {
    return Array.from(this.bodyEl.querySelectorAll<HTMLElement>('.sgd__u'));
  }

  /**
   * One block's box bottom and glyph bottom, relative to the body's own top.
   *
   * The box bottom is pure layout arithmetic. The glyph bottom needs the rendered type, so it is read
   * as **a proportion of this element's own rect** — numerator and denominator are both screen pixels
   * of the *same* box, so whatever uniform scale the letterbox stage is applying cancels out exactly,
   * at any ancestor depth and without the panel having to know which ancestor applies it. That is the
   * lesson of the first two attempts: a measurement that has to be converted between coordinate
   * systems is a measurement that can be converted wrongly.
   *
   * Falls back to the box bottom whenever the type cannot be measured — a few px of empty leading below
   * the last line is not a defect, a sliced line is.
   */
  private measureUnit(el: HTMLElement, bodyTop: number, scale: number, bodyTopPx: number): GuideFitUnit {
    const bottom = el.offsetTop - bodyTop + el.offsetHeight;
    const heading = el.classList.contains('sgd__kn');
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
      // Guard rails, in the block's own terms: the type cannot be lower than its box (plus a px for
      // `offsetTop`/`offsetHeight`'s integer rounding) and it cannot be half a box higher. Anything
      // outside that is not a measurement of this block's last line, so the box bottom stands — a little
      // empty leading is not a defect, a sliced line is.
      if (!(exact > boxBottom - el.offsetHeight * 0.5) || exact > boxBottom + 1) return boxBottom;
      return exact;
    } catch {
      return boxBottom;
    }
  }

  /**
   * The letterbox stage's scale, measured **exactly**.
   *
   * `FFXBattleHud.layout()` / `LetterboxStage.createStage()` scale an ancestor of this rail to fit the
   * viewport, so every rect this file reads is in screen px while every length it writes is in
   * stage-grid px. The previous attempt recovered the factor as `bodyRect.height / bodyEl.offsetHeight`
   * — and `offsetHeight` is **rounded to a whole pixel**, so at 1280x720 that returns 1.9836 where the
   * real factor is 2. Half a grid px of error there is a whole screen px at 2x and nearly four at 4K.
   *
   * A computed style is never rounded and never scaled: the slab's authored `padding` is exactly 5px +
   * 6px whatever the stage is doing. The difference between the slab's rect height and its body's rect
   * height is exactly that padding *after* the transform, and neither rect is rounded — so their ratio
   * is the scale, to full precision, without the panel needing a reference to whichever ancestor
   * applies it.
   *
   * Returns 0 when it cannot be measured (jsdom, nothing painted yet, a slab authored with no padding);
   * callers then keep the unrounded box bottoms and lose only a px of leading.
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

  /**
   * The phone's sheet: every block shown at full length, the sheet itself scrolls, opened on the part
   * of the document for the boss on the field. Undoes whatever a desktop fit left behind, so a window
   * that is resized from a desktop to a phone, or back, starts again from the whole content.
   */
  private layoutPhone(): void {
    this.bodyEl.style.height = '';
    for (const unit of this.allUnits()) {
      unit.classList.remove(OUT_CLASS);
      resetLines(unit);
    }
    this.moreEl.hidden = true;
    this.pageStart = 0;
    this.pageLine = 0;
    this.nextPage = 0;
    this.nextLine = 0;
    this.fitKey = '';
    this.layoutToggle();
    // Scroll once per new content, and only once the sheet is actually laid out (it is `display: none`
    // until the player opens it, and a hidden sheet reports every offset as 0).
    if (this.phoneScrollPending && this.panelEl.offsetHeight > 0) {
      this.phoneScrollPending = false;
      const target = this.bodyEl.querySelector<HTMLElement>(`[data-block="${this.startBlock}"]`);
      if (target) this.panelEl.scrollTop = Math.max(0, target.offsetTop - this.panelEl.offsetTop - 6);
    }
  }

  /**
   * One page down, wrapping back to the top at the foot.
   *
   * Pages by *block*, not by `scrollTop`, for the same reason the cut does: a scrolled panel puts an
   * arbitrary offset at its bottom edge and slices whatever line is there. The next page starts at the
   * first block this one could not show.
   */
  private pageDown(): void {
    this.pageStart = this.nextPage;
    this.pageLine = this.nextLine;
    this.fitKey = '';
    this.layout();
  }
}

/** Is the upright phone layout on (`html[data-phone-battle]`, set only by `./phoneBattle.ts`)? */
function onPhone(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset['phoneBattle'] !== undefined;
}
