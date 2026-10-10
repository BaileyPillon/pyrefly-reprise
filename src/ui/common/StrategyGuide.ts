import './strategy-guide.css';
import type { BattleState, GameId } from '../../battle/common/types.ts';
import { readSetting, writeSetting } from '../../app/SaveData.ts';
import { GUIDE_HINT_ITEM, GUIDE_SCROLL_HINT_ITEM } from './ControlsHint.ts';
import { escapeHtml } from './html.ts';
import { docForState, headingAt, startBlockIndex, type GuideDocView } from './guideDoc.ts';
import { docHtml } from './guideDocHtml.ts';
import { cleanWindow, measureLines, type LineBox } from './guideLines.ts';
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
 * ## It says it scrolls, and it never shows half a line (PR-0385, release 39.1)
 *
 * Round 22 found the foot of the sheet cut through the middle of a line in every chapter it looked at, with no scroll bar in a headless capture
 * (`--hide-scrollbars`) and no word anywhere that the sheet scrolls. Three things answer it. The `[ ] SCROLL` chip stands beside `G HIDE GUIDE` while the
 * sheet has more than it shows (a click pages down, and from the foot back to the top); a small accent mark at the sheet's foot (and at its head once it is
 * scrolled) says which way there is more; and the window never ends or starts inside a line: the lines are measured (`./guideLines.ts`) and the text is
 * clipped, hard-edged, to the whole lines of the window, the panel's own background showing in the sliver. The sheet keeps its box (nothing else on the HUD moves
 * as it scrolls) and none of the document is cut or changed.
 *
 * ## When there is no room above the girls (PR-0389, release 39.1; FFX-2 only)
 *
 * At TEXT SIZE 115 and 130 the rail paints its type larger and the boss strips above it grow, so in a few FFX-2 chapters the room between the strips and the
 * girls' heads is less than the least sheet worth drawing (Chapter VI's three strips at 130 percent leave 22 grid px; the sheet is never drawn shorter than the 56
 * it is at 100). Round 21 hid the whole rail there, chip and all, and G flipped a flag with nothing to show (round 22: the guide "disappears"). Now the sheet's least
 * height is counted as it is painted (`room x scale`, not the layout px before the scale: four more chapters keep their sheet at 130 percent, and Chapter IV at 115
 * and 130), and where it truly does not fit the rail **folds to its tab**: the `G GUIDE` chip stays where it was, dimmed as an offer, and G (or a click, or the pad's
 * button) opens the sheet over the boss strips' column, down to the fence above the girls and no further (`peek`; never over a girl or a painted boss; the strips'
 * gauges are under it while it is open, and it is not remembered: the next battle starts folded again). G again folds it. Nothing else about the sheet changes.
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

/** The air between the toggle chip and the scroll chip beside it, in grid px (the house skew leans each a little into it). */
const KEYS_GAP = 3;

/** How much more room a folded rail wants before it unfolds again, in layout px (the girls' idle sway moves the fence a hair a frame). */
const SQUEEZE_HYSTERESIS = 2;

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
  /** The `[ ] SCROLL` chip beside the toggle, up while the sheet has more than it shows. */
  private readonly keysEl: HTMLButtonElement;
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
  private viewing: GuideDocView | null = null;
  /** No room for the sheet above the girls (FFX-2 at TEXT SIZE 115 / 130, see the class doc): the rail is folded to its tab. */
  private squeezed = false;
  /** While squeezed, the sheet is open over the boss strips' column (G); not remembered. */
  private peek = false;
  /** The rail is folded because the status cure card displaced the sheet, not for want of room: held while that card is up (`measureSqueeze`). */
  private hintFold = false;
  /** This fight starts folded (`startFolded`): applied on the first frame, once the layout has said whether this is the upright phone, and dropped by any answer of the player's. */
  private foldPending = false;
  /** The sheet's lines, measured (`./guideLines.ts`), and what they were measured for. */
  private lines: LineBox[] = [];
  private linesSig = '';
  /** What the window's clip and the scroll marks were last written for, so a still frame writes nothing. */
  private windowSig = '';
  /** Whether a pad was connected when the chips were last worded (they say `R-Stick`, not `[ ]`, with one). */
  private padSeen = false;
  /** The last desktop solve: the numbers {@link layout} decided the column from (for the debug snapshot and the checks). */
  private lastSolve: { top: number; floor: number; room: number; available: number; scale: number; shift: number; fenced: boolean } | null = null;

  constructor(opts: StrategyGuideOptions) {
    this.opts = opts;
    this.visible = (opts.readVisible ?? (() => readSetting('guideVisible')))();

    this.el = make('div', `sgd${opts.game === 'ffx2' ? ' sgd--ffx2' : ''}`, 'strategy-guide');
    this.toggleEl = make('button', 'sgd__toggle', 'strategy-guide-toggle') as HTMLButtonElement;
    this.toggleEl.type = 'button';
    this.keysEl = make('button', 'sgd__keys', 'strategy-guide-keys') as HTMLButtonElement;
    this.keysEl.type = 'button';
    this.stackEl = make('div', 'sgd__stack', 'strategy-guide-stack');
    this.slotEl = make('div', 'sgd__slot', 'strategy-guide-slot');
    this.panelEl = make('div', 'sgd__panel', 'strategy-guide-panel');
    this.bodyEl = make('div', 'sgd__body');

    this.panelEl.append(this.bodyEl);
    this.stackEl.append(this.slotEl, this.panelEl);
    this.el.append(this.stackEl, this.toggleEl, this.keysEl);

    this.toggleEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });
    // A click on the chip is a page down (and from the foot, back to the top). It must not leave the chip holding the keyboard: a later Enter on the
    // command menu would click it again (the same guard the PAUSE chip has, PR-0142).
    this.keysEl.addEventListener('mousedown', (e) => e.preventDefault());
    this.keysEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.pageDown();
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
    // Folded to its tab (no room above the girls): G opens and folds the sheet over the strips, and the setting the player chose is left alone.
    if (this.squeezed) {
      this.peek = !this.peek;
      this.applyVisible();
      if (this.peek) {
        this.scrollPending = true;
        this.render();
      }
      return;
    }
    this.setVisible(!this.visible);
  }

  /** Is the sheet up: the player's setting, or while the rail is folded to its tab, whether it has been opened over the strips. */
  private get shown(): boolean {
    return this.squeezed ? this.peek : this.visible;
  }

  /**
   * This fight starts with the sheet folded to its chip (`SceneStaging.guideFolded`; FFX Chapters I and III, Bailey's "A2" of 2026-10-09). A **starting state, not a setting**: nothing is written to
   * `Settings.guideVisible`, so the player's saved preference is never overwritten by the chapter; `G` opens the sheet as ever, and the player's own answer is then written as it always was. Applied on the
   * first frame (`update`), when the layout has said whether this is the upright phone, which keeps its own guide sheet and is left alone. A player who has the guide off sees no difference.
   */
  startFolded(): void {
    this.foldPending = true;
  }

  setVisible(on: boolean): void {
    this.foldPending = false; // the player has answered: the start no longer applies
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
    const shown = this.shown;
    this.panelEl.hidden = !shown;
    this.el.classList.toggle('sgd--off', !shown);
    this.el.classList.toggle('sgd--squeezed', this.squeezed);
    this.el.classList.toggle('sgd--peek', this.squeezed && this.peek);
    // The chip keeps its measured anchor (round 05 PR-0050): in FFX-2 the boss gauge strip above the rail is taller
    // than the authored fallback, so it is re-read here and every frame in `update()`, never the static `top: 44px`.
    if (!shown) {
      this.layoutToggle();
      this.stackEl.style.top = '';
      this.stackEl.style.maxHeight = '';
    }
    const pad = this.padConnected();
    this.padSeen = pad;
    const keys = pad ? GUIDE_HINT_ITEM.gamepad : GUIDE_HINT_ITEM.keyboard;
    this.toggleEl.innerHTML =
      `<b>${escapeHtml(keys)}</b><span>${escapeHtml(shown ? 'hide guide' : 'guide')}</span>`;
    this.toggleEl.setAttribute('aria-pressed', String(shown));
    this.toggleEl.title = shown
      ? 'Hide the strategy guide'
      : this.squeezed
        ? 'The strategy guide has no room above the girls at this text size: open it over the enemy strips'
        : 'Show the strategy guide';
    const scrollKeys = pad ? GUIDE_SCROLL_HINT_ITEM.gamepad : GUIDE_SCROLL_HINT_ITEM.keyboard;
    this.keysEl.innerHTML = `<b>${escapeHtml(scrollKeys)}</b><span>${escapeHtml(GUIDE_SCROLL_HINT_ITEM.label)}</span>`;
    this.keysEl.title = 'Scroll the strategy guide: [ and ] page up and down, Home and End, the mouse wheel or the right stick';
    this.syncWindow();
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
    return this.mounted && this.shown && !this.el.hidden && !onPhone();
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
    if (this.foldPending) {
      this.foldPending = false;
      if (!onPhone() && this.visible) {
        this.visible = false; // not written: the fight's starting state, not the player's answer
        this.applyVisible();
      }
    }
    this.pollPad();
    if (this.padScroll !== 0 && this.canScroll()) this.panelEl.scrollTop += padScrollStep(this.padScroll, dt);
    // Whether the rail fits above the girls is asked whether or not it is up: a player who turned the guide off and then asks for it at 130 percent
    // must find its tab, not nothing.
    const squeezed = this.measureSqueeze();
    if (squeezed !== this.squeezed) {
      this.squeezed = squeezed;
      this.peek = false;
      this.applyVisible();
      if (this.shown) {
        this.scrollPending = true;
        this.render();
      }
    }
    if (this.shown) this.layout();
    // With the guide off there is no rail to solve, but the chip still has to follow the chrome it sits
    // under: in FFX-2 the boss gauge strip grows and shrinks a block per living enemy (round 05 PR-0050), and at
    // TEXT SIZE the chip steps down by what the strips grew (a folded rail's tab, PR-0389, has only this).
    else {
      this.el.style.setProperty('--sgd-shift', `${this.grownBy().shift.toFixed(2)}px`);
      this.layoutToggle();
    }
    this.syncWindow();
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
    const pad = this.padConnected();
    if (pad !== this.padSeen) this.applyVisible(); // a pad plugged in or out: the chips say its names
  }

  // ------------------------------------------------------------------ data

  /** New engine state: the boss on the field may have changed, and with it where the document opens. */
  sync(state: Readonly<BattleState>): void {
    this.lastState = state;
    this.render();
  }

  /** What the panel is showing right now, for tests and the debug snapshot. */
  view(): GuideDocView | null {
    return this.viewing;
  }

  /** The numbers the last desktop layout decided from, in layout px (null before the first, and on the phone). */
  get solved(): Readonly<NonNullable<StrategyGuide['lastSolve']>> | null {
    return this.lastSolve;
  }

  // -------------------------------------------------------------- rendering

  private render(): void {
    if (!this.mounted) return;
    const doc = this.lastState ? docForState(this.lastState) : null;
    // No written guide for this encounter: no panel and no chip, never a chip that opens an empty box.
    this.el.hidden = doc === null;
    if (!doc || !this.lastState) {
      this.viewing = null;
      return;
    }
    const start = startBlockIndex(doc, this.lastState);
    this.viewing = { chapterId: doc.id, title: headingAt(doc, start), start };
    if (!this.shown) return;

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
    // Folded to its tab and opened over the strips (`peek`): the sheet starts where the strips do, the chip rides above it as it does above any rail.
    if (this.squeezed && this.peek) return (below && below.offsetHeight > 0 ? below.offsetTop : anchors.top - CHIP_RISE) + CHIP_RISE;
    return this.restRailTop();
  }

  /** Where the rail stands below the boss strips (the chrome the owner named), with room for its chip: the place it has when it is not opened over them. */
  private restRailTop(): number {
    const { anchors } = this.opts;
    const below = anchors.below?.() ?? null;
    return below && below.offsetHeight > 0
      ? below.offsetTop + below.offsetHeight + CLEARANCE_GAP + CHIP_RISE
      : anchors.top;
  }

  /**
   * Does the rail fit above the girls (FFX-2 at TEXT SIZE 115 / 130 only, the one place the room shrinks: see the class doc)? It is the layout's own sum, asked
   * of the strips' rest place whatever the guide is showing: the room between the strips and the fence over the girls' heads, less what the strips grew (`shift`),
   * over the scale, against the least sheet worth drawing counted as it is painted. A hair of hysteresis keeps a room that breathes with the girls' idle sway from
   * folding and unfolding the rail.
   */
  private measureSqueeze(): boolean {
    if (onPhone()) return false;
    const grown = this.grownBy();
    if (!(grown.scale > 1)) return false;
    const aboveEl = this.opts.anchors.above?.() ?? null;
    if (!aboveEl || !(aboveEl.offsetHeight > 0)) return false;
    const room = railRoom(aboveEl.offsetTop - FENCE_GAP - this.restRailTop(), grown.scale, grown.shift);
    if (room < MIN_PANEL_HEIGHT / grown.scale + (this.squeezed ? SQUEEZE_HYSTERESIS : 0)) {
      this.hintFold = false;
      return true;
    }
    // The sheet fits alone, but the status cure card (`./statusHintCard.ts`) has taken the column and the sheet has stepped aside for it (`sgd--hint-alone`: at TEXT
    // SIZE the card and the least sheet do not fit one column; Chapter IV at 115 / 130 percent with Paine cursed). The rail folds to its tab the same way, so G has
    // something to open (over the strips there is room for both), and it stays folded while that card is up: a folded rail hands the card to its own slot on the
    // stage, which clears `sgd--hint-alone`, and without the latch the rail would unfold into the same column a frame later and fold again.
    const cardUp = !!this.el.parentElement?.querySelector('.sthint:not([hidden])');
    if (this.el.classList.contains('sgd--hint-alone')) this.hintFold = true;
    else if (!cardUp) this.hintFold = false;
    return this.hintFold;
  }

  /** Put the chip `CHIP_RISE` above the rail's top edge — the only geometry that still applies with the panel hidden. */
  private layoutToggle(): void {
    this.toggleEl.style.top = `${Math.max(0, this.railTop() - CHIP_RISE).toFixed(2)}px`;
    // The scroll chip stands on the same line, just past the toggle (the toggle's own width changes with its words, and TEXT SIZE scales it from
    // its bottom left corner, so the painted width is the layout width times the scale it is drawn at).
    this.keysEl.style.top = this.toggleEl.style.top;
    this.keysEl.style.left = `${(this.toggleEl.offsetLeft + this.toggleEl.offsetWidth * drawnScale(this.toggleEl) + KEYS_GAP).toFixed(2)}px`;
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
    // Opened over the strips (`peek`) the sheet does not step down by what they grew: it stands where they do.
    const shift = this.squeezed && this.peek ? 0 : grown.shift;
    this.el.style.setProperty('--sgd-shift', `${shift.toFixed(2)}px`);
    const room = grown.scale > 1 ? railRoom(floor - top, grown.scale, shift) : (floor - top) / drawnScale(this.stackEl);
    // The least sheet is counted as it is painted: `room x scale` against the 56 it is at 100 percent. Where even that does not fit above the girl it is
    // fenced above (Chapter VI's three boss strips at 115 and 130 percent), the rail folds to its tab (`measureSqueeze`, the class doc), and the sheet opened
    // over the strips has the whole column down to the same fence.
    const available = Math.max(MIN_PANEL_HEIGHT / Math.max(1, grown.scale), room);
    this.lastSolve = { top, floor, room, available, scale: grown.scale, shift: grown.shift, fenced: above !== null };
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
   * Every frame: keep the sheet's window to whole lines and say that it scrolls (PR-0385).
   *
   * The lines are measured when the layout they stand in changes (the document, the sheet's width and height, its text's total height, the faces loading), and
   * only then; each frame after that is a few reads and, when the sheet has been scrolled, a walk over the measured lines. The clip is two lengths on the
   * body (`--sgd-clip-top`, `--sgd-clip-bottom`: how much of the text the window leaves out at each end) and the scroll marks are a word on the column
   * (`data-scroll`: `up`, `down`) that `strategy-guide.css` draws; the chip is up while the sheet has more than it shows. Nothing is written for a frame that
   * looks like the last, and nothing at all on the phone (its sheet is the player's to swipe) or while the sheet is not shown.
   */
  private syncWindow(): void {
    const panel = this.panelEl;
    const on = !onPhone() && this.shown && !this.el.hidden && panel.offsetHeight > 0 && this.bodyEl.offsetHeight > 0;
    const max = on ? panel.scrollHeight - panel.clientHeight : 0;
    const scrolls = on && max > 1;
    if (!scrolls) {
      this.writeWindow('off', null, null, '');
      return;
    }
    // The measured lines are good for as long as nothing they stand in has changed; with the faces still loading nothing is final, so nothing is measured.
    if (typeof document !== 'undefined' && document.fonts?.status === 'loading') return;
    const sig = `${this.lastSignature}|${panel.clientWidth}x${panel.clientHeight}|${this.bodyEl.offsetHeight}`;
    if (sig !== this.linesSig) {
      this.lines = measureLines(panel, this.bodyEl);
      this.linesSig = sig;
    }
    const win = this.lines.length ? cleanWindow(this.lines, panel.scrollTop, panel.clientHeight) : null;
    const bodyTop = this.bodyEl.offsetTop;
    const clipTop = win ? Math.max(0, win.top - bodyTop) : 0;
    const clipBottom = win ? Math.max(0, bodyTop + this.bodyEl.offsetHeight - win.bottom) : 0;
    const marks = `${panel.scrollTop > 1 ? 'up ' : ''}${panel.scrollTop < max - 1 ? 'down' : ''}`.trim();
    this.writeWindow('on', clipTop, clipBottom, marks);
  }

  /** Write the clip, the scroll marks and the chip's state, when they differ from what is there. */
  private writeWindow(state: 'on' | 'off', clipTop: number | null, clipBottom: number | null, marks: string): void {
    const sig = `${state}|${clipTop === null ? '' : clipTop.toFixed(2)}|${clipBottom === null ? '' : clipBottom.toFixed(2)}|${marks}|${this.panelEl.offsetTop}`;
    if (sig === this.windowSig) return;
    this.windowSig = sig;
    const body = this.bodyEl.style;
    if (clipTop === null) body.removeProperty('--sgd-clip-top');
    else body.setProperty('--sgd-clip-top', `${clipTop.toFixed(2)}px`);
    if (clipBottom === null) body.removeProperty('--sgd-clip-bottom');
    else body.setProperty('--sgd-clip-bottom', `${clipBottom.toFixed(2)}px`);
    if (marks) {
      this.stackEl.dataset['scroll'] = marks;
      this.stackEl.style.setProperty('--sgd-panel-top', `${this.panelEl.offsetTop}px`);
    } else {
      delete this.stackEl.dataset['scroll'];
      this.stackEl.style.removeProperty('--sgd-panel-top');
    }
    this.keysEl.classList.toggle('sgd__keys--on', state === 'on');
  }

  /** A click on the scroll chip: a page down, and from the foot back to the top. */
  private pageDown(): void {
    const p = this.panelEl;
    if (p.scrollTop >= p.scrollHeight - p.clientHeight - 1) p.scrollTop = 0;
    else scrollSheetByKey(p, 'BracketRight');
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
