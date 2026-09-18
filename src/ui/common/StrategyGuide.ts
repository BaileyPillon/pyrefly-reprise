import './strategy-guide.css';
import type { AvailableCommand, BattleState, CombatantId, GameId } from '../../battle/common/types.ts';
import { buildGuideView, type GuideView } from '../../engine/tactics/guide.ts';
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

export class StrategyGuide {
  readonly el: HTMLElement;
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

    this.panelEl = document.createElement('div');
    this.panelEl.className = 'sgd__panel';
    this.panelEl.dataset['role'] = 'strategy-guide-panel';

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'sgd__body';
    this.panelEl.append(this.bodyEl);
    this.el.append(this.panelEl, this.toggleEl);

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
    // Drop the measured anchor with the panel it was measured against:
    // `layout()` stops running while the guide is off, and an inline `top`
    // outranks the stylesheet, so the chip would otherwise stay frozen at
    // whatever height the last open panel happened to start at.
    if (!this.visible) this.toggleEl.style.top = '';
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
    return buildGuideView(this.lastState, this.decision);
  }

  // -------------------------------------------------------------- rendering

  private render(): void {
    if (!this.mounted) return;
    const view = this.lastState ? buildGuideView(this.lastState, this.decision) : null;
    // No written guide for this encounter: no panel and no chip, rather than a
    // chip that opens an empty box.
    this.el.hidden = view === null;
    if (!view || !this.visible) return;

    const signature = signatureOf(view);
    if (signature === this.lastSignature) {
      this.layout();
      return;
    }
    this.lastSignature = signature;
    this.bodyEl.innerHTML = bodyHtml(view);
    this.layout();
  }

  /**
   * Cap the rail at whatever chrome it has to clear. See the class comment on
   * why this is measured rather than a constant.
   */
  private layout(): void {
    const { anchors } = this.opts;
    const below = anchors.below?.() ?? null;
    // The chip rides `CHIP_RISE` **above** the rail's top edge, so the rail has
    // to leave room for it under whatever it is clearing — otherwise the chip
    // itself lands on that anchor. In FFX the anchor is the action banner
    // (`.ig-banner`, grid y 17.8..48) and the chip is 7.5px tall, which is
    // exactly how `G GUIDE` ended up printed across the banner in Bailey's
    // Chapter 1 capture. The fallback `anchors.top` already has the rise
    // counted in (44, with the chip at 33), so only the measured branch adds it.
    const top =
      below && below.offsetHeight > 0
        ? below.offsetTop + below.offsetHeight + CLEARANCE_GAP + CHIP_RISE
        : anchors.top;

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
    this.panelEl.style.top = `${top.toFixed(2)}px`;
    this.panelEl.style.maxHeight = `${available.toFixed(2)}px`;
    this.toggleEl.style.top = `${Math.max(0, top - CHIP_RISE).toFixed(2)}px`;
    // Short rules while the menu is eating the rail; the paragraphs come back
    // when it closes. See COMPACT_HEIGHT.
    this.el.classList.toggle('sgd--compact', available < COMPACT_HEIGHT);
  }
}

// --------------------------------------------------------------- templates

/** Everything that can change what the panel says, in one string. */
function signatureOf(view: GuideView): string {
  return [
    view.chapterId,
    view.next?.label ?? '',
    view.next?.targetId ?? '',
    view.next?.reason ?? '',
    view.phase?.label ?? '',
    view.watch.map((w) => `${w.payload}:${w.timing}:${w.stage}`).join('|'),
  ].join('');
}

function sectionHead(label: string): string {
  return `<h4 class="sgd__head">${escapeHtml(label)}</h4>`;
}

function citeHtml(cite: string): string {
  return cite ? `<p class="sgd__cite">${escapeHtml(cite)}</p>` : '';
}

function nextHtml(view: GuideView): string {
  const next = view.next;
  if (!next) {
    return `${sectionHead('Next')}<p class="sgd__idle">Waiting for your turn.</p>`;
  }
  const target = next.targetName
    ? `<span class="sgd__arrow">→</span><span class="sgd__target">${escapeHtml(next.targetName)}</span>`
    : '';
  return [
    sectionHead('Next'),
    `<p class="sgd__actor">${escapeHtml(next.actorName)}</p>`,
    `<p class="sgd__cmd"><span class="sgd__label">${escapeHtml(next.label)}</span>${target}</p>`,
    next.reason ? `<p class="sgd__why">${escapeHtml(next.reason)}.</p>` : '',
    citeHtml(next.cite),
  ].join('');
}

function watchHtml(view: GuideView): string {
  if (view.watch.length === 0 && !view.phase) return '';
  const charges = view.watch
    .map(
      (w) =>
        `<div class="sgd__charge sgd__charge--s${w.stage}">` +
        `<p class="sgd__cmd"><span class="sgd__label">${escapeHtml(w.payload)}</span>` +
        `<span class="sgd__timing">${escapeHtml(w.timing)}</span></p>` +
        `<p class="sgd__why">${escapeHtml(w.advice)}.</p>` +
        citeHtml(w.cite) +
        '</div>',
    )
    .join('');
  const phase = view.phase
    ? `<div class="sgd__phase"><p class="sgd__phase-label">${escapeHtml(view.phase.label)}</p>` +
      `<p class="sgd__why">${escapeHtml(view.phase.note)}</p>${citeHtml(view.phase.cite)}</div>`
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
        '<li>' +
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
    `<p class="sgd__title">${escapeHtml(view.title)}</p>`,
    `<section class="sgd__sec sgd__sec--next">${nextHtml(view)}</section>`,
    watchHtml(view) ? `<section class="sgd__sec sgd__sec--watch">${watchHtml(view)}</section>` : '',
    rulesHtml(view) ? `<section class="sgd__sec sgd__sec--rules">${rulesHtml(view)}</section>` : '',
  ].join('');
}
