import './strategy-guide.css';
import type { BattleState, GameId } from '../../battle/common/types.ts';
import { readSetting, writeSetting } from '../../app/SaveData.ts';
import { GUIDE_HINT_ITEM } from './ControlsHint.ts';
import { escapeHtml } from './html.ts';
import { docForState, headingAt, startBlockIndex, type GuideDocView } from './guideDoc.ts';
import { docHtml } from './guideDocHtml.ts';
import {
  PAD_SCROLL_AXIS, SCROLL_KEYS, drawnScale, gapAbove, padScrollStep, padScrollTravel, scrollSheetByKey, scrollSheetByWheel,
} from './guideScroll.ts';

/**
 * The optional in-battle strategy guide: an Ink & Gold side slab that holds the written guide for
 * the boss on the field, laid out as that guide is laid out.
 *
 * Bailey, 2026-10-03: "from now on the guide follows the ffx/ffx-2 encounter guides" and "Just match
 * the original document please in terms of formatting and everything else". So the panel is **a
 * document**, not a plan: the boss's header, its stat lines (the game's description line, HP, Steal,
 * Drops; FFX-2's Enemy / HP / Steal / Drop table), then the advice in the order the guide gives it, as
 * paragraphs, lists, lead-ins and sub-headings (`src/data/guides/docs/`, shapes in `../../data/guides/doc-types.ts`).
 * Nothing in it is computed from the fight. The move advisor is a separate panel with a separate
 * reasoning and never reads this one. Everything printed is plain strategy-guide prose, in our own
 * words: no source, citation or section number is ever rendered (`tests/unit/guide-doc-words.test.ts`).
 *
 * ## A reading sheet, not a paged rail
 *
 * Bailey, 2026-10-03: a scrolling reading view like the phone's instead of paging the side rail (Chapter I
 * was fourteen pages, Vegnagun more than sixty). The whole document is in the panel and the panel scrolls:
 * the mouse wheel (a notch moves the text by what the wheel says, not by the stage's scale) and the scroll bar,
 * `[` and `]`, `Home` and `End`, and the pad's right stick (`./guideScroll.ts`). Nothing is fitted or cut and no block is hidden to make the rest fit. A sheet that
 * is opened, or a new boss that takes the field, starts scrolled to that boss's header (`./guideDoc.ts`);
 * the player's own place is kept while the fight goes on.
 *
 * ## Optional means optional
 *
 * `G`, the pad's spare face button, or the chip hides everything but a chip the width of two words, and the
 * answer is remembered in `Settings.guideVisible` for every later battle. Default is on.
 *
 * ## It never sits on the command menu
 *
 * The sheet is a left column inside the HUD's own 640x360 letterbox stage, so it scales with the rest of the
 * chrome. Its height is not a constant: the owner hands it the element it must clear (`.ffx-cmd-area` in FFX,
 * whose stack grows upward as a submenu fills) and {@link layout} caps the column at that element's edge every
 * frame. A document shorter than the column is as tall as the document.
 *
 * ## The cure-hint card has a box of its own above the sheet
 *
 * `.sgd__slot` is the column's first row: the status hint card (`./statusHintCard.ts`) stands in it while a
 * party member has a status with a sourced rule. It is a card, not a block of the document: the sheet gives
 * it its height and takes it back (a flex column), and keeps its scroll position.
 *
 * ## Input, without touching `Input.ts`
 *
 * The battle screen forwards no `InputSnapshot` to the HUD, so the guide listens for itself: `KeyG`, the scroll
 * keys no binding claims either, and a poll of pad button 2 and the right stick, which `PAD_MAP` also leaves free.
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

/** Never squeeze the column below this, in grid px — under it the type is unreadable. */
const MIN_PANEL_HEIGHT = 56;

/** Gap between the panel and whatever it is clearing, in grid px. */
const CLEARANCE_GAP = 5;

/**
 * Gap above a fence the owner parks on the party's heads (FFX-2's `above`), in grid px. The sheet fills its column, so it reaches the
 * fence every time, and a box reaches above her head (XIII's Yuna by 20): 28 clears all 7 chapters at 4 sizes by 4 or more; 24 grazed it, 8 touched.
 */
const FENCE_GAP = 28;

/**
 * How far above the rail's own top edge the `G GUIDE` chip sits, in grid px.
 *
 * It is a constant rather than a measurement because `layout()` runs before the chip's first paint on
 * the opening frame, and a zero height there would drop the chip onto the banner for exactly the frame
 * a screenshot is most likely to catch. 11 is the gap the authored `top: 44` / chip `top: 44 - 11` pair
 * in `strategy-guide.css` already encodes.
 */
const CHIP_RISE = 11;

/** The room kept above the boss's header when the sheet opens on it, in layout px. */
const SHEET_LEAD = 6;

/**
 * The room the rail may fill, in its own **layout** px, once TEXT SIZE has grown it (judgment call K of critic round 21, PR-0270;
 * FFX-2 only). `text-size-wide.css` scales the rail from its top-left corner by `scale` and steps it down by `shift`, the
 * stage px its boss strips grew, so what is painted is `scale` times the layout height and starts `shift` lower. The layout room
 * is therefore the stage room less the shift, over the scale: a rail fitted to the stage room would paint 1.3 times as tall and
 * run over the girl it was fenced above (Yuna's head, 36 percent of her at 130 percent). Scale 1 and shift 0 give the stage
 * room back unchanged.
 */
export function railRoom(stageRoom: number, scale: number, shift: number): number {
  const s = Number.isFinite(scale) && scale > 1 ? scale : 1;
  const down = Number.isFinite(shift) && shift > 0 ? shift : 0;
  return (stageRoom - down) / s;
}

export class StrategyGuide {
  readonly el: HTMLElement;
  /** The measured column: the card's slot, then the sheet. See `.sgd__stack`. */
  private readonly stackEl: HTMLElement;
  /** The column's first row, where the status hint card stands. See `./statusHintCard.ts`. */
  private readonly slotEl: HTMLElement;
  private readonly panelEl: HTMLElement;
  private readonly toggleEl: HTMLButtonElement;
  private readonly bodyEl: HTMLElement;
  private readonly opts: StrategyGuideOptions;

  private mounted = false;
  private visible: boolean;
  private lastState: Readonly<BattleState> | null = null;
  private padWasDown = false;
  /** The right stick's travel this frame (-1 up .. 1 down), read by {@link pollPad}, spent by {@link update}. */
  private padScroll = 0;
  /** Signature of the last render, so a per-frame `sync` does not re-write the DOM. */
  private lastSignature = '';
  /** The block the document opens on, and whether the sheet still has to be scrolled to it. */
  private startBlock = 0;
  private scrollPending = false;
  /** What the panel is showing now (`view()`). */
  private shown: GuideDocView | null = null;

  constructor(opts: StrategyGuideOptions) {
    this.opts = opts;
    this.visible = (opts.readVisible ?? (() => readSetting('guideVisible')))();

    this.el = make('div', `sgd${opts.game === 'ffx2' ? ' sgd--ffx2' : ''}`, 'strategy-guide');
    this.toggleEl = make('button', 'sgd__toggle', 'strategy-guide-toggle') as HTMLButtonElement;
    this.toggleEl.type = 'button';
    this.stackEl = make('div', 'sgd__stack', 'strategy-guide-stack');
    this.slotEl = make('div', 'sgd__slot', 'strategy-guide-slot');
    this.panelEl = make('div', 'sgd__panel', 'strategy-guide-panel');
    this.bodyEl = make('div', 'sgd__body');

    this.panelEl.append(this.bodyEl);
    this.stackEl.append(this.slotEl, this.panelEl);
    this.el.append(this.stackEl, this.toggleEl);

    this.toggleEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    this.panelEl.addEventListener('wheel', (e) => { if (!onPhone()) scrollSheetByWheel(this.panelEl, e); }, { passive: false });
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
    if (on) {
      // A hidden sheet loses its place: an opened one starts on the boss that is standing.
      this.scrollPending = true;
      this.render();
    }
  }

  private applyVisible(): void {
    this.panelEl.hidden = !this.visible;
    this.el.classList.toggle('sgd--off', !this.visible);
    // The chip keeps its measured anchor (round 05 PR-0050): in FFX-2 the boss gauge strip above the rail is taller
    // than the authored fallback, so it is re-read here and every frame in `update()`, never the static `top: 44px`.
    if (!this.visible) {
      this.layoutToggle();
      this.stackEl.style.top = '';
      this.stackEl.style.maxHeight = '';
    }
    const keys = this.padConnected() ? GUIDE_HINT_ITEM.gamepad : GUIDE_HINT_ITEM.keyboard;
    this.toggleEl.innerHTML =
      `<b>${escapeHtml(keys)}</b><span>${escapeHtml(this.visible ? 'hide guide' : 'guide')}</span>`;
    this.toggleEl.setAttribute('aria-pressed', String(this.visible));
    this.toggleEl.title = this.visible ? 'Hide the strategy guide' : 'Show the strategy guide';
  }

  /**
   * `KeyG`, edge-only, and the sheet's own scroll keys.
   *
   * Deliberately not routed through `src/app/Input.ts`: a global binding for one optional panel would
   * go in a contract file that thirty agents import.
   */
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'KeyG') {
      if (e.repeat) return;
      e.preventDefault();
      this.toggle();
    } else if (SCROLL_KEYS.includes(e.code) && this.canScroll()) {
      e.preventDefault();
      scrollSheetByKey(this.panelEl, e.code);
    }
  };

  /** Is there a sheet on the desktop to scroll? (The phone's sheet is the player's to swipe.) */
  private canScroll(): boolean {
    return this.mounted && this.visible && !this.el.hidden && !onPhone();
  }

  private padConnected(): boolean {
    try {
      const pads = navigator.getGamepads?.() ?? [];
      return Array.from(pads).some((p) => p !== null && p.connected);
    } catch {
      return false;
    }
  }

  /** Per-frame tick from the HUD (`dt` in seconds): polls the pad, scrolls with its stick, keeps the height honest. */
  update(dt: number): void {
    this.pollPad();
    if (this.padScroll !== 0 && this.canScroll()) this.panelEl.scrollTop += padScrollStep(this.padScroll, dt);
    if (this.visible) this.layout();
    // With the guide off there is no rail to solve, but the chip still has to follow the chrome it sits
    // under: in FFX-2 the boss gauge strip grows and shrinks a block per living enemy (round 05 PR-0050).
    else this.layoutToggle();
  }

  private pollPad(): void {
    let down = false;
    let scroll = 0;
    try {
      for (const pad of navigator.getGamepads?.() ?? []) {
        if (!pad?.connected) continue;
        if (pad.buttons[PAD_TOGGLE_BUTTON]?.pressed) down = true;
        const travel = padScrollTravel(pad.axes[PAD_SCROLL_AXIS]);
        if (Math.abs(travel) > Math.abs(scroll)) scroll = travel;
      }
    } catch {
      down = false;
      scroll = 0;
    }
    if (down && !this.padWasDown) this.toggle();
    this.padWasDown = down;
    this.padScroll = scroll;
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
    // New document, or a new fight in it: open on that fight's part.
    this.startBlock = start;
    this.scrollPending = true;
    this.layout();
  }

  /**
   * The rail's top edge, in stage-grid px: below whatever chrome the owner named, with room for the chip that
   * rides `CHIP_RISE` above it (Bailey's Chapter 1 capture printed `G GUIDE` across the action banner). The
   * fallback `anchors.top` already has the rise counted in, so only the measured branch adds it. `offsetHeight > 0`
   * is the gate, not merely "the element exists": chrome that is not laid out reports `offsetTop: 0`.
   */
  private railTop(): number {
    const { anchors } = this.opts;
    const below = anchors.below?.() ?? null;
    return below && below.offsetHeight > 0
      ? below.offsetTop + below.offsetHeight + CLEARANCE_GAP + CHIP_RISE
      : anchors.top;
  }

  /** Put the chip `CHIP_RISE` above the rail's top edge — the only geometry that still applies with the panel hidden. */
  private layoutToggle(): void {
    this.toggleEl.style.top = `${Math.max(0, this.railTop() - CHIP_RISE).toFixed(2)}px`;
  }

  /**
   * Cap the column at whatever chrome it has to clear. The sheet itself is not solved: it is a flex item that
   * shrinks to the room the column has, behind the card's slot, and scrolls.
   */
  private layout(): void {
    // The upright phone shows the guide as a sheet of its own (`phone-battle.css`), not a column between
    // two chrome elements, so the desktop's anchors mean nothing there.
    if (onPhone()) {
      this.layoutToggle();
      this.scrollToStart();
      return;
    }
    const { anchors } = this.opts;
    const top = this.railTop();

    // `offsetTop` is already stage-space: every anchor and the panel share the HUD stage as their offset parent.
    // `offsetHeight > 0` is the gate: a hidden anchor (`.ffx2hud__command` when no menu is open) reports
    // `offsetTop: 0`, which would put the floor above the stage's top edge, so it has no edge to clear.
    const aboveEl = anchors.above?.() ?? null;
    const above = aboveEl && aboveEl.offsetHeight > 0 ? aboveEl : null;
    const floor = above ? above.offsetTop - FENCE_GAP : 360 - anchors.bottom;

    // FFX-2 at TEXT SIZE 115 / 130 %: the rail paints `scale` times its layout size and `shift` lower (`grownBy`), so its layout room is the stage room less the shift, over the scale.
    // Everywhere else (FFX at any TEXT SIZE: `text-size.css` grows its column from its top left; FFX-2 at 100 %) the room is divided by the scale the column is drawn at.
    const grown = this.grownBy();
    this.el.style.setProperty('--sgd-shift', `${grown.shift.toFixed(2)}px`);
    const room = grown.scale > 1 ? railRoom(floor - top, grown.scale, grown.shift) : (floor - top) / drawnScale(this.stackEl);
    // Even the shortest rail would be painted past the girl it is fenced above (Chapter VI's three boss strips take 121 grid px at 130 %
    // and leave 30 above Yuna's head): it gives way entirely, panel and chip, rather than cover her (`text-size-wide.css`).
    this.el.classList.toggle('sgd--squeezed', grown.scale > 1 && above !== null && room < MIN_PANEL_HEIGHT);
    const available = Math.max(MIN_PANEL_HEIGHT, room);
    this.stackEl.style.top = `${top.toFixed(2)}px`;
    this.stackEl.style.maxHeight = `${available.toFixed(2)}px`;
    this.layoutToggle();
    this.scrollToStart();
  }

  /**
   * How TEXT SIZE has grown the rail: the scale it paints at and the stage px it steps down (FFX-2 only: FFX keeps its own rule, the sheet's
   * drawn-scale division in `layout`). Read from the computed style, so it is exactly what `text-size-wide.css` applies, and 1 / 0 whenever nothing
   * does (100 %, the phone, jsdom). The shift is what the boss strips above it grew, `strip height x (scale - 1)`, so it follows however many
   * enemies there are (Chapter VI has three), not a fixed step (judgment call K of critic round 21, PR-0270).
   */
  private grownBy(): { scale: number; shift: number } {
    if (this.opts.game !== 'ffx2') return { scale: 1, shift: 0 };
    let scale = 1;
    try {
      const raw = Number.parseFloat(getComputedStyle(this.stackEl).scale);
      if (Number.isFinite(raw) && raw > 1) scale = raw;
    } catch {
      scale = 1;
    }
    if (scale <= 1) return { scale: 1, shift: 0 };
    const below = this.opts.anchors.below?.() ?? null;
    return { scale, shift: below && below.offsetHeight > 0 ? below.offsetHeight * (scale - 1) : 0 };
  }

  /**
   * Scroll the sheet to the boss's header, once per opening and once per new fight, and only when the sheet is
   * laid out (it is `display: none` until it is opened, and a hidden box reports every offset as 0).
   *
   * The desktop sheet is the offset parent of its content (`position: relative`, `strategy-guide.css`), so a
   * block's `offsetTop` is its place in the scrolled content, whatever the player has scrolled to and whatever
   * scale the stage is at. It opens with exactly the empty gap above the block showing and none of the block
   * before it, so no half line is left at the top edge. The phone's sheet is not positioned and keeps its own
   * lead, measured from its column.
   */
  private scrollToStart(): void {
    if (!this.scrollPending || !(this.panelEl.offsetHeight > 0)) return;
    // The offsets are only final once the faces are in: a line that re-wraps under a late font would move the header.
    if (typeof document !== 'undefined' && document.fonts?.status === 'loading') return;
    this.scrollPending = false;
    const target = this.bodyEl.querySelector<HTMLElement>(`[data-block="${this.startBlock}"]`);
    if (!target) {
      this.panelEl.scrollTop = 0;
    } else if (onPhone()) {
      this.panelEl.scrollTop = Math.max(0, target.offsetTop - this.panelEl.offsetTop - SHEET_LEAD);
    } else {
      this.panelEl.scrollTop = Math.max(0, target.offsetTop - Math.min(SHEET_LEAD, gapAbove(target, this.bodyEl)));
    }
  }
}

/** Is the upright phone layout on (`html[data-phone-battle]`, set only by `./phoneBattle.ts`)? */
function onPhone(): boolean {
  return typeof document !== 'undefined' && document.documentElement.dataset['phoneBattle'] !== undefined;
}

function make(tag: string, className: string, role?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  if (role) el.dataset['role'] = role;
  return el;
}
