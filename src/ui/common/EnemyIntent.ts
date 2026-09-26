import './enemy-intent.css';
import type { CombatantId, GameId } from '../../battle/common/types.ts';
import { readSetting, writeSetting } from '../../app/SaveData.ts';
import { INTENT_HINT_ITEM } from './ControlsHint.ts';
import { escapeHtml } from './html.ts';
import { EnemyIntentOverflow } from './enemy-intent-overflow.ts';
import { briefStatusChip } from './enemy-intent-brief-status.ts';
import { anyLethalRow, damageHtml } from './enemy-intent-damage.ts';

/**
 * The enemy-intent slab: **what the boss is about to do, hanging over its
 * head.**
 *
 * The strategy guide's left rail says what the player *should* do. This says
 * what is about to be done *to* them — the move's name, what it does, the
 * damage each character is about to eat, the statuses it carries, the charge it
 * is counting down, and the counter it will answer an attack with. It reads all
 * of that out of `src/battle/ffx/intent.ts` / `src/battle/ffx2/intent.ts`, which
 * dry-run the real AI script on a cloned board.
 *
 * ## Why it is over the boss and not in a corner
 *
 * Because the question it answers is *about that boss*. A fight with two
 * enemies (Seymour and the Mortiorchis; the Vegnagun head and two Redoubts) has
 * two different answers, and a corner panel would have to name whose turn it is
 * describing in words the player then has to map back onto the field. Anchored
 * over the head, the slab **is** the answer to "whose turn", and the name row is
 * a confirmation rather than the only cue.
 *
 * So it lives on the HUD's unscaled overlay — the same layer the damage
 * numerals use — and re-projects from the presenter's projector every frame,
 * exactly as a numeral does. It scales by the letterbox factor so its type sits
 * in the same size register as the rest of the chrome (§3.6's grid-quoted
 * sizes), and it never carries the house skew: it is a multi-line reading panel,
 * and `strategy-guide.css` records at length why a tall skewed box reads as a
 * lozenge rather than as a deliberate angle.
 *
 * ## It never sits on the CTB list
 *
 * A slab pinned to an actor can land anywhere, and the one thing it must not
 * cover is the turn forecast the player is reading it *against*. {@link layout}
 * measures whatever rectangles the owner names ({@link EnemyIntentOptions.avoid}
 * — `.ig-ctb` in FFX, `.ffx2hud__enemies` in FFX-2) and slides the panel
 * horizontally out of any it would intersect, preferring the side with more
 * room; if it cannot clear them sideways it drops below the head instead of
 * overlapping. A boss standing directly under the queue is the normal case, not
 * the edge case, which is why this is measured rather than a fixed offset.
 *
 * ## Optional means optional
 *
 * `E`, standard-gamepad button 3, or the slab's own chip hides everything but a
 * two-word chip that stays over the boss, and the answer is remembered in
 * `Settings.intentVisible` for every later battle. It defaults **on**: Total
 * Annihilation and Mega Death are both survivable and both unannounced, and
 * being told before one lands is the difference between a wipe that teaches and
 * a wipe that reads as unfair.
 *
 * `E` is a key `src/app/Input.ts` maps to `start`, which in a battle is also
 * the pause. {@link consumeIntentKeyPress} is how that is resolved without
 * touching the shared binding table — see its own comment.
 */

// ---------------------------------------------------------------------------
// The view the panel draws
// ---------------------------------------------------------------------------

/** One character's share of the incoming action. */
export interface IntentTargetView {
  targetId: CombatantId;
  targetName: string;
  /** Signed HP delta. Positive means this character loses that much HP. */
  amount: number;
  min: number;
  max: number;
  /** `amount / hp`. 1 means exactly lethal. */
  hpFraction: number;
  lethal: boolean;
  hitChancePercent: number | null;
}

export interface IntentEstimateView {
  name: string;
  hits: number;
  perTarget: readonly IntentTargetView[];
  totalHarmToParty: number;
  heals: boolean;
}

export interface IntentChargeView {
  name: string;
  turnsLeft: number;
  stage: 1 | 2;
  payloadName: string | null;
  cite: string;
}

export interface IntentBranchView {
  label: string;
  percent: number;
}

/** PR-0153: a rolled victim — every candidate, each estimated. */
export interface IntentRandomTargetView {
  rows: readonly IntentTargetView[];
  /** Each hit re-picks its victim; every row is one hit's worth. */
  perHit: boolean;
  hits: number;
}

/**
 * The slab's whole input.
 *
 * Deliberately a structural subset of both engines' `EnemyIntent`, so
 * `battle/ffx/intent.ts` and `battle/ffx2/intent.ts` can keep their own
 * game-specific extras (FFX's affinity per target, X-2's chain multiplier)
 * without this module learning about either.
 */
export interface IntentView {
  enemyId: CombatantId;
  enemyName: string;
  turnsAway: number;
  actsNext: boolean;
  kind: 'action' | 'charge' | 'pass';
  moveName: string;
  abilityId: string | null;
  description: string;
  elements: readonly string[];
  statusText: readonly string[];
  estimate: IntentEstimateView | null;
  randomTarget?: IntentRandomTargetView | null;
  confidence: 'scripted' | 'likely';
  branches: readonly IntentBranchView[];
  charge: IntentChargeView | null;
  counters: readonly string[];
  formNote: string | null;
  notes: readonly string[];
  cite: string;
}

/** Where the panel gets its answer. Returning `null` hides it entirely. */
export type IntentSource = () => IntentView | null;

/** A rectangle in viewport pixels. */
export interface IntentRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface EnemyIntentOptions {
  /** Only used for the root class, so FFX-2 picks up the pink accent. */
  game: GameId;
  /** Overridable for tests. */
  readVisible?: () => boolean;
  writeVisible?: (on: boolean) => void;
}

export interface EnemyIntentMountOptions {
  /** The HUD root, for the letterbox-scale read. */
  host: HTMLElement;
  /** The letterbox factor the HUD applies to its 640x360 grid. */
  scale: () => number;
  /** The presenter's projector, in viewport pixels. */
  project: (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null;
  /** Rectangles the slab must not cover — the CTB list above all. */
  avoid: () => IntentRect[];
  /**
   * Where the **chip** parks while the panel is off, in viewport px: the point
   * its top-right corner is pinned to.
   *
   * With the panel up, the slab hangs over the boss's head because that is the
   * relationship it is claiming. With the panel off there is no slab and the
   * chip inherited the same anchor, which put `E ENEMY MOVE` in the middle of
   * the boss's painting — the complaint in `docs/handoff/fix3-ffx-hud.md`. A
   * HUD that has a rail to park it on says so here; omitting it (FFX-2, and
   * every test) keeps the old head-anchored behaviour.
   */
  chipDock?: () => { x: number; y: number } | null;
  /**
   * How much of the read-out to print.
   *
   * `'full'` is everything the prediction knows and is what FFX-2 and the mock
   * screens still mount. `'brief'` drops the rows a player is not reading in
   * the two seconds before a hit lands — the odds table, the status list, the
   * "Also" notes and every research citation — and keeps the move, what it
   * does, the countdown, the damage per character and what it counters with.
   *
   * It exists because of round 02 #14: at 1000x562 the full slab measured
   * x 532–766, y 6–269 and had **both** reticles, Seymour Flux and the
   * Mortiorchis entirely behind it. A panel that ships on by default may not
   * be the thing hiding the encounter, and the honest fix is for the default
   * to be short enough to dodge rather than for the default to be off — the
   * warning it carries (Total Annihilation, Mega Death) is the reason a
   * first-timer survives them.
   */
  density?: 'full' | 'brief';
}

/** Standard-gamepad button 3 (Triangle / Y); see `INTENT_HINT_ITEM`. */
const PAD_TOGGLE_BUTTON = 3;

/** Grid px between the slab's bottom edge and the enemy's head. */
const HEAD_GAP = 10;

/** Panel width in grid px, at the same register as the guide rail's 132. */
const PANEL_WIDTH = 150;

/** Clearance the slab and the chip keep from the frame's edges, in grid px. */
const EDGE_MARGIN = 4;

/**
 * The tallest the slab may be, as a fraction of the frame it is drawn on.
 *
 * Round 02 #14 measured it at 263 of 562 px — 47% of the window, over the boss
 * — because nothing capped it. A panel that cannot be dodged out of the way is
 * not a panel the layout can honour, so the body scrolls past this and the
 * stylesheet fades its last rows.
 *
 * 0.34 was the first value and the browser pass rejected it: at 1600x900 the
 * slab stood 316 px tall, the band above the raised command-info card is 299,
 * and a slab that cannot fit above an obstacle cannot dodge it either — it sat
 * on the card's top edge in every submenu state at both viewports. 0.30 leaves
 * 45 px of room at 1600x900 and 33 at 1280x720.
 */
const MAX_HEIGHT_FRACTION = 0.3;

// ---------------------------------------------------------------------------
// The E key, and the pause it collides with
// ---------------------------------------------------------------------------

let keyTaken = false;

/**
 * Did the player just press the intent panel's key?
 *
 * `src/app/Input.ts` maps `KeyE` to the abstract `start` button, and
 * `BattleScreen.handleInput` opens the **pause menu** on `start`. Both things
 * are true and neither is wrong: `E` is the obvious letter for "enemy", and
 * `start` is the obvious button for pause.
 *
 * Rebinding either in `Input.ts` would put a battle-only special case in a
 * contract file thirty agents compile against, and stealing the event in a
 * capture-phase listener cannot work — `Input.ts` binds `keydown` in the
 * capture phase at boot, so it is always first in the queue.
 *
 * So the panel records the press and the battle screen asks, once per frame,
 * whether to `consume('start')` for it. The read is destructive: one press is
 * answered once, and a frame that never asks does not leave a stale `true`
 * behind for the next battle. `P`, `Esc` and the PAUSE chip are untouched, so
 * the pause menu keeps three ways in and loses only this alias.
 */
export function consumeIntentKeyPress(): boolean {
  if (!keyTaken) return false;
  keyTaken = false;
  return true;
}

// ---------------------------------------------------------------------------
// The panel
// ---------------------------------------------------------------------------

export class EnemyIntentPanel {
  readonly el: HTMLElement;
  private readonly panelEl: HTMLElement;
  private readonly toggleEl: HTMLButtonElement;
  private readonly bodyEl: HTMLElement;
  /** PR-0010: the MORE affordance for a body clipped past its height cap. */
  private readonly overflow = new EnemyIntentOverflow();
  private readonly opts: EnemyIntentOptions;

  private mountOpts: EnemyIntentMountOptions | null = null;
  private mounted = false;
  private visible: boolean;
  private source: IntentSource | null = null;
  private current: IntentView | null = null;
  private padWasDown = false;
  /** Last good projection, keyed by enemy. See {@link layout}. */
  private lastPoint: { id: CombatantId; x: number; y: number } | null = null;
  /** Signature of the last render, so a per-frame tick does not re-write the DOM. */
  private lastSignature = '';

  constructor(opts: EnemyIntentOptions) {
    this.opts = opts;
    this.visible = (opts.readVisible ?? (() => readSetting('intentVisible')))();

    this.el = document.createElement('div');
    this.el.className = `eint${opts.game === 'ffx2' ? ' eint--ffx2' : ''}`;
    this.el.dataset['role'] = 'enemy-intent';
    this.el.hidden = true;

    this.panelEl = document.createElement('div');
    this.panelEl.className = 'eint__panel';
    this.panelEl.dataset['role'] = 'enemy-intent-panel';

    this.bodyEl = document.createElement('div');
    this.bodyEl.className = 'eint__body';
    // PR-0010: the MORE row lives below the (possibly clipped) body, in
    // normal flow, so it can report on it without ever painting over it.
    this.panelEl.append(this.bodyEl, this.overflow.el);

    this.toggleEl = document.createElement('button');
    this.toggleEl.type = 'button';
    this.toggleEl.className = 'eint__toggle';
    this.toggleEl.dataset['role'] = 'enemy-intent-toggle';
    this.toggleEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggle();
    });

    this.el.append(this.panelEl, this.toggleEl);
    this.applyVisible();
  }

  // ----------------------------------------------------------------- mount

  mount(overlay: HTMLElement, mountOpts: EnemyIntentMountOptions): void {
    if (this.mounted) return;
    this.mountOpts = mountOpts;
    overlay.appendChild(this.el);
    this.mounted = true;
    window.addEventListener('keydown', this.onKeyDown);
    this.overflow.attach();
    this.render();
  }

  unmount(): void {
    if (!this.mounted) return;
    window.removeEventListener('keydown', this.onKeyDown);
    this.overflow.detach();
    this.el.remove();
    this.mounted = false;
    this.mountOpts = null;
  }

  /** Where the answer comes from. `null` while a battle has no engine yet. */
  setSource(source: IntentSource | null): void {
    this.source = source;
    this.lastSignature = '';
    this.refresh();
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
    (this.opts.writeVisible ?? ((v: boolean) => writeSetting('intentVisible', v)))(on);
    this.applyVisible();
    if (on) {
      this.lastSignature = '';
      this.render();
    }
  }

  private applyVisible(): void {
    this.panelEl.hidden = !this.visible;
    this.el.classList.toggle('eint--off', !this.visible);
    const keys = this.padConnected() ? INTENT_HINT_ITEM.gamepad : INTENT_HINT_ITEM.keyboard;
    this.toggleEl.innerHTML =
      `<b>${escapeHtml(keys)}</b><span>${escapeHtml(this.visible ? 'hide' : 'enemy move')}</span>`;
    this.toggleEl.setAttribute('aria-pressed', String(this.visible));
    this.toggleEl.title = this.visible ? 'Hide the enemy move read-out' : 'Show the enemy move read-out';
  }

  // -------------------------------------------------------------- suspend

  private suspended = false;

  /**
   * Hide the whole layer — panel *and* chip — while something else owns the
   * screen (the pause menu), and put it back exactly as it was, the player's
   * `E` setting untouched, when that something closes.
   *
   * PR-0122: `.eint` sits in the HUD's unscaled overlay with its own
   * `z-index` (`enemy-intent.css`, `.eint { z-index: 2; }` — deliberately,
   * so it paints over the field art and under a numeral). The pause screen's
   * root is a later sibling `.screen` div with no `z-index` of its own
   * (`App.makeScreenRoot`), so it stacks at the auto/0 level of the *same*
   * containing block — and an explicit `z-index: 2` there beats DOM order
   * regardless of which one mounted last. That is what let the intent slab
   * paint over the pause's character close-up, its OPTIONS values and its
   * THIS ENCOUNTER actions, and survive H.
   *
   * A CSS class rather than reusing `this.el.hidden`: `hidden` already
   * answers "does this enemy have a predicted move at all" (see `render`),
   * and this answers the unrelated question "is something else covering the
   * whole HUD right now". Keeping them on separate properties means resuming
   * needs no re-render to land back in the right state — removing the class
   * is the whole restore, and it never touches `visible` (the `E` toggle).
   */
  setSuspended(suspended: boolean): void {
    if (this.suspended === suspended) return;
    this.suspended = suspended;
    this.el.classList.toggle('eint--suspended', suspended);
  }

  /** For tests: is the layer currently forced off by {@link setSuspended}? */
  get isSuspended(): boolean {
    return this.suspended;
  }

  /**
   * `KeyE`, edge-only, with the same chord and repeat guards the guide uses so
   * that typing elsewhere on the page cannot flip it.
   */
  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code !== 'KeyE' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    keyTaken = true;
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

  // ------------------------------------------------------------------ data

  /**
   * Re-read the source. Called when the engine state moved, not per frame —
   * a prediction deep-clones the board two dozen times.
   */
  refresh(): void {
    if (!this.mounted) return;
    this.current = this.source ? this.source() : null;
    this.render();
  }

  /** The view the panel would draw right now, for tests and the debug snapshot. */
  view(): IntentView | null {
    return this.current;
  }

  /** Per-frame tick from the HUD: polls the pad and re-projects. */
  update(_dt: number): void {
    this.pollPad();
    this.overflow.pollPad();
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

  // -------------------------------------------------------------- rendering

  private render(): void {
    if (!this.mounted) return;
    const view = this.current;
    this.el.hidden = view === null;
    if (!view) return;
    if (this.visible) {
      const density = this.mountOpts?.density ?? 'full';
      const signature = `${density}~${signatureOf(view)}`;
      if (signature !== this.lastSignature) {
        this.lastSignature = signature;
        this.bodyEl.innerHTML = bodyHtml(view, density);
      }
    }
    this.layout();
  }

  /**
   * Pin the slab over the enemy's head, then slide it clear of the chrome.
   *
   * Three steps, in this order, because each one depends on the last:
   *
   * 1. **Project.** `project(enemyId, 'head')` gives viewport pixels; the
   *    overlay's own box turns them into layer-local ones (they are only the
   *    same while the overlay happens to sit at 0,0).
   * 2. **Clamp to the layer.** A boss standing at the edge of frame — every
   *    Vegnagun part, and Yu Yevon's pagodas — would otherwise hang the slab
   *    half off-screen.
   * 3. **Dodge.** Any avoided rectangle it still intersects pushes it to
   *    whichever side has more room; if neither side has enough, it goes
   *    *below* the rectangle rather than over it.
   */
  private layout(): void {
    const view = this.current;
    const opts = this.mountOpts;
    if (!view || !opts || this.el.hidden) return;

    const layer = this.el.getBoundingClientRect();
    // jsdom and a not-yet-laid-out overlay both report 0x0. Positioning into
    // that would stack everything on the origin, so leave the last placement.
    if (layer.width <= 0 || layer.height <= 0) return;

    const scale = opts.scale() || 1;
    this.panelEl.style.setProperty('--eint-scale', scale.toFixed(4));
    this.toggleEl.style.setProperty('--eint-scale', scale.toFixed(4));
    // In the body's own unscaled px, because the panel's transform multiplies
    // it with everything else — and on the *body*, so the tail notch that hangs
    // below the panel is not clipped away. See MAX_HEIGHT_FRACTION.
    const cap = (layer.height * MAX_HEIGHT_FRACTION) / scale;
    const overflowing = this.bodyEl.scrollHeight > cap + 0.5;
    // PR-0010: held key/pad lifts the cap so the body reaches its natural
    // height; `cap` itself stays the collapsed value so `overflow.sync` keeps
    // reporting "how much is hidden if you let go".
    this.bodyEl.style.maxHeight = this.overflow.expanded ? 'none' : `${cap.toFixed(1)}px`;
    this.bodyEl.classList.toggle('eint__body--clipped', overflowing && !this.overflow.expanded);
    this.overflow.sync(this.bodyEl, cap, overflowing, this.padConnected());

    // Panel off, and the owner named a rail to park the chip on: nothing here
    // is anchored to the boss any more, so the projection and the dodge below
    // have nothing to do. See `chipDock`.
    if (!this.visible) {
      const dock = opts.chipDock?.() ?? null;
      if (dock) {
        const chip = this.toggleEl.getBoundingClientRect();
        const chipW = chip.width || 40 * scale;
        const chipH = chip.height || 8 * scale;
        const edge = EDGE_MARGIN * scale;
        const x = Math.max(edge, Math.min(layer.width - chipW - edge, dock.x - layer.left - chipW));
        const y = Math.max(edge, Math.min(layer.height - chipH - edge, dock.y - layer.top));
        this.panelEl.classList.add('eint__panel--detached');
        this.toggleEl.style.left = `${x.toFixed(1)}px`;
        this.toggleEl.style.top = `${y.toFixed(1)}px`;
        return;
      }
    }

    const box = this.visible ? this.panelEl : this.toggleEl;

    // A projection can come back `null` for a frame — the stage re-stages an
    // actor on a form change, a mid-battle beat moves the camera, an enemy is
    // briefly off-stage. Falling straight to the centre of the screen for that
    // one frame is what put the slab across the Mortiorchis's scan card in the
    // first Chapter 1 countdown capture: the centre fallback is 613px on a
    // 1600px stage, which is exactly where the card is. Holding the last good
    // point instead keeps the slab on the boss it belongs to, and the centre is
    // left as the fallback for an enemy that has never projected at all.
    const raw = opts.project(view.enemyId, 'head');
    if (raw) this.lastPoint = { id: view.enemyId, x: raw.x, y: raw.y };
    const point = raw ?? (this.lastPoint?.id === view.enemyId ? this.lastPoint : null);
    const cx = point ? point.x - layer.left : layer.width / 2;
    const cy = point ? point.y - layer.top : layer.height * 0.3;

    const rect = box.getBoundingClientRect();
    const w = rect.width || PANEL_WIDTH * scale;
    const h = rect.height || 40 * scale;

    let left = cx - w / 2;
    let top = cy - HEAD_GAP * scale - h;

    // `EDGE_MARGIN` is grid px and so has to be scaled: the flat 4 viewport px
    // this used to clamp to is 1.6 grid px at 1600x900 and 1.1 at 2560x1440, so
    // a slab pushed against the top of the frame sat flush on the edge and read
    // as clipped (`docs/handoff/fix3-ffx-hud.md`, the 1280x720 Chapter 2 shot).
    const edge = EDGE_MARGIN * scale;
    // The chip rides the panel's top-right corner, *above* its top edge, so the
    // panel's own ceiling has to leave room for it. Without this a slab pushed
    // against the top of the frame clamps to `edge`, the chip clamps to the
    // same line, and `E ENEMY MOVE` is printed across the boss's name — 913
    // square px of it, measured in every state of this round's browser pass.
    const chipReserve = (this.toggleEl.getBoundingClientRect().height || 8 * scale) + scale;
    const ceiling = this.visible ? edge + chipReserve : edge;
    const clampX = (v: number, width = w): number =>
      Math.max(edge, Math.min(Math.max(edge, layer.width - width - edge), v));
    const clampY = (v: number, height = h): number =>
      Math.max(ceiling, Math.min(Math.max(ceiling, layer.height - height - edge), v));
    left = clampX(left);
    top = clampY(top);

    // Two passes, not one: clearing a rectangle on the right can slide the slab
    // back onto one on the left, and a single pass leaves it there. Two settles
    // every arrangement these HUDs actually produce and costs nothing.
    const obstacles = opts.avoid();
    for (let pass = 0; pass < 2; pass++) {
      for (const avoid of obstacles) {
        const a = { left: avoid.left - layer.left, top: avoid.top - layer.top, right: avoid.right - layer.left, bottom: avoid.bottom - layer.top };
        const overlaps = left < a.right && left + w > a.left && top < a.bottom && top + h > a.top;
        if (!overlaps) continue;
        const roomLeft = a.left - 4;
        const roomRight = layer.width - a.right - 4;
        if (roomLeft >= w && roomLeft >= roomRight) left = clampX(a.left - w - 4);
        else if (roomRight >= w) left = clampX(a.right + 4);
        // **Above before below.** The old order only ever went down, which is
        // right for the CTB queue and wrong for everything added in round 03:
        // pushed under a *fighter* the slab lands on the next one, and pushed
        // under the boss it lands on the party. The slab's whole habit is to
        // hang over a head, so it goes up when there is sky and down only when
        // there is not [round-02 #14].
        else if (a.top - 4 >= h) top = clampY(a.top - h - 4);
        else top = clampY(a.bottom + 4);
      }
    }

    this.el.classList.toggle(
      'eint--imminent',
      view.charge?.stage === 2 || anyLethalRow(view),
    );
    box.style.left = `${left.toFixed(1)}px`;
    box.style.top = `${top.toFixed(1)}px`;

    // The tail points at the head the slab belongs to. It slides along the
    // panel's bottom edge when the panel had to dodge sideways, and it is
    // dropped entirely when the panel is no longer sitting directly above the
    // head — a notch on the wrong edge claims a relationship that is not there,
    // which is worse than no notch. `--eint-tail` is in the panel's own
    // *unscaled* units because the transform scales it with everything else.
    const wantedBottom = cy - HEAD_GAP * scale;
    const attached = this.visible && Math.abs(top + h - wantedBottom) < 2 && cx > left && cx < left + w;
    this.panelEl.classList.toggle('eint__panel--detached', !attached);
    if (attached) {
      const tail = (cx - left) / scale;
      this.panelEl.style.setProperty('--eint-tail', `${tail.toFixed(1)}px`);
    }

    // The chip rides the panel's top-right corner while the panel is up, and
    // is the whole thing when it is not. It is the panel's *sibling* — it has
    // to keep drawing while `.eint__panel` is `hidden` — so this is placed here
    // rather than with a float in the stylesheet.
    if (this.visible) {
      const chip = this.toggleEl.getBoundingClientRect();
      const chipW = chip.width || 40 * scale;
      const chipH = chip.height || 8 * scale;
      // The chip's own clamp floors at `edge`, not at the panel's `ceiling` —
      // the ceiling exists to keep this row of pixels free for the chip, and
      // clamping the chip to it would put the two back on top of each other.
      const chipTop = Math.max(edge, Math.min(Math.max(edge, layer.height - chipH - edge), top - chipH - 1 * scale));
      this.toggleEl.style.left = `${clampX(left + w - chipW, chipW).toFixed(1)}px`;
      this.toggleEl.style.top = `${chipTop.toFixed(1)}px`;
    }
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

/** A HUD that owns one of these panels. Duck-typed, so `HudPort` is untouched. */
interface IntentAwareHud {
  setIntentSource?(source: IntentSource | null): void;
}

/** An engine that can answer the question. Duck-typed, for the same reason. */
interface IntentAwareEngine {
  intent?(): IntentView | null;
}

/**
 * Hand a battle's engine to its HUD's intent panel.
 *
 * Duck-typed on both sides on purpose. `HudPort` and `BattleEngine` are in
 * `docs/CONTRACTS.md`'s five-file contract set, thirty agents compile against
 * them, and one optional panel is not worth a shape change there — so both
 * sides are probed rather than declared, and a HUD or engine that does not have
 * the method simply gets no panel.
 */
export function attachEnemyIntent(hud: unknown, engine: unknown): void {
  const h = hud as IntentAwareHud | null;
  if (!h || typeof h.setIntentSource !== 'function') return;
  const e = engine as IntentAwareEngine | null;
  if (!e || typeof e.intent !== 'function') {
    h.setIntentSource(null);
    return;
  }
  h.setIntentSource(() => {
    try {
      return e.intent?.() ?? null;
    } catch {
      // A prediction is never worth a frame. The panel goes quiet instead.
      return null;
    }
  });
}

/** A HUD whose intent slab can be told to stop drawing. Duck-typed, like {@link IntentAwareHud}. */
interface SuspendableIntentHud {
  setIntentSuspended?(suspended: boolean): void;
}

/**
 * Hide the intent slab (panel and chip alike) while an overlay — the pause
 * screen — sits on top of the battle, and restore it exactly as it was when
 * the overlay closes.
 *
 * Duck-typed for the same reason {@link attachEnemyIntent} is: `HudPort` is
 * not worth a shape change for one optional panel, so a HUD without the
 * method (a mock, a future third HUD) is simply told nothing and stays as it
 * was. See `BattleScreen.openPause` (PR-0122) and
 * `EnemyIntentPanel.setSuspended`.
 */
export function setIntentSuspended(hud: unknown, suspended: boolean): void {
  const h = hud as SuspendableIntentHud | null;
  h?.setIntentSuspended?.(suspended);
}

// --------------------------------------------------------------- templates

/** Everything that can change what the slab says, in one string. */
function signatureOf(view: IntentView): string {
  return [
    view.enemyId,
    view.moveName,
    view.confidence,
    view.turnsAway,
    view.description,
    view.charge ? `${view.charge.name}:${view.charge.turnsLeft}` : '',
    view.branches.map((b) => `${b.label}:${b.percent}`).join('|'),
    view.estimate?.perTarget.map((t) => `${t.targetId}:${t.amount}`).join('|') ?? '',
    view.randomTarget?.rows.map((t) => `${t.targetId}:${t.amount}:${t.lethal}`).join('|') ?? '',
    view.statusText.join('|'),
    view.formNote ?? '',
    view.notes.join('|'),
  ].join('~');
}

/**
 * A research citation, anywhere inside a sentence meant for the player.
 *
 * The engines' intent builders write their prose with the section they derived
 * it from attached — `"Counters an attack with Lance of Atrophy
 * [ffx-seymour-flux §4.6]"` — which is exactly right for a `research/` audit
 * trail and exactly wrong on a slab hanging over a boss's head. Round 02 #26
 * caught three of them in Chapter 1 alone and the Part B 8.0 cap with them.
 *
 * Matched on the bracket rather than on any one chapter's id so a new
 * encounter cannot leak a new prefix: a bracketed run containing `§`, or one
 * that is a bare `<game>-<slug>` research key.
 */
const CITE_IN_TEXT = /\s*\[[^\][]*(?:§|ffx-|ffx2-)[^\][]*\]/g;

/** Player copy with its citations taken out. See {@link CITE_IN_TEXT}. */
export function stripCitations(text: string): string {
  return text.replace(CITE_IN_TEXT, '').replace(/\s{2,}/g, ' ').trim();
}

function plain(text: string): string {
  return escapeHtml(stripCitations(text));
}

/**
 * "ACTS NEXT", or this enemy's place in the forecast.
 *
 * A queue position rather than "in N turns", which is the phrasing a charge row
 * beside it is already using for something else: a countdown's "in 2 turns"
 * counts *that boss's own* turns, while this counts every actor's. Printing
 * both as "in N turns" on one slab makes them look like the same clock — which
 * was visible on the first Chapter 1 capture, where a Mortiorchis four rows
 * down was labelled "in 3 turns" directly above "Total Annihilation, this turn".
 */
function timingText(view: IntentView): string {
  if (view.actsNext || view.turnsAway <= 0) return 'acts next';
  const place = view.turnsAway + 1;
  const suffix = place % 10 === 1 && place % 100 !== 11 ? 'st' : place % 10 === 2 && place % 100 !== 12 ? 'nd' : place % 10 === 3 && place % 100 !== 13 ? 'rd' : 'th';
  return `${place}${suffix} in queue`;
}

/**
 * PR-0123: this used to print `branches[0]` — the most-*sampled* branch —
 * beside the move name whether or not it was the move actually rolled. On a
 * countdown-vs-attack split that reads as the panel contradicting its own
 * Odds table two lines down ("No action LIKELY 88%" over an Odds row that
 * gives Attack 88%). The badge has to answer for `view.moveName`, so it
 * looks that branch up by label instead of assuming position 0 — and only
 * calls it "Most likely" when it *is* position 0, since a branch that is not
 * the top one is not that, whatever its own share of the samples. Below 50%
 * even the top branch is a coin flip or worse, so it reads as "Possible"
 * rather than a confident "likely".
 */
function confidenceHtml(view: IntentView): string {
  if (view.confidence === 'scripted') {
    return '<span class="eint__conf eint__conf--scripted">Scripted</span>';
  }
  const match = view.branches.find((b) => b.label === view.moveName) ?? view.branches[0];
  if (!match) return '';
  const isTop = view.branches[0] === match;
  const word = match.percent < 50 ? 'Possible' : isTop ? 'Most likely' : 'Likely';
  return `<span class="eint__conf eint__conf--likely">${word} ${match.percent}%</span>`;
}

function branchesHtml(view: IntentView): string {
  if (view.confidence !== 'likely' || view.branches.length < 2) return '';
  const items = view.branches
    .map((b) => `<li><span>${escapeHtml(b.label)}</span><b>${b.percent}%</b></li>`)
    .join('');
  return `<h4 class="eint__head">Odds</h4><ul class="eint__odds">${items}</ul>`;
}

function listHtml(label: string, items: readonly string[], className = 'eint__lines'): string {
  if (items.length === 0) return '';
  const rows = items.map((t) => `<li>${plain(t)}</li>`).join('');
  return `<h4 class="eint__head">${escapeHtml(label)}</h4><ul class="${className}">${rows}</ul>`;
}

function chargeHtml(view: IntentView): string {
  const charge = view.charge;
  if (!charge) return '';
  const what = charge.payloadName ?? charge.name;
  const when =
    charge.turnsLeft <= 0
      ? 'this turn'
      : `in ${charge.turnsLeft} turn${charge.turnsLeft === 1 ? '' : 's'}`;
  return (
    `<div class="eint__charge eint__charge--s${charge.stage}">` +
    `<span class="eint__charge-name">${plain(what)}</span>` +
    `<span class="eint__charge-when">${escapeHtml(when)}</span>` +
    '</div>'
  );
}

/**
 * The slab's copy.
 *
 * **No citation reaches the player from here, at either density.** CHK-007 puts
 * them in the strategy guide — the panel a player opens to ask *why* — and this
 * one is read in the two seconds before a hit lands. That covers the three
 * inline ones round 02 #26 found in Chapter 1, the charge row's, and the footer.
 */
function bodyHtml(view: IntentView, density: 'full' | 'brief' = 'full'): string {
  const elements = view.elements.filter((e) => e !== 'none');
  const full = density === 'full';
  return [
    `<p class="eint__enemy"><span>${escapeHtml(view.enemyName)}</span><i>${escapeHtml(timingText(view))}</i></p>`,
    // PR-0011 (FFX only): brief density hides the Statuses block below, so a
    // guaranteed/high-chance status rides beside the move name instead — see
    // `enemy-intent-brief-status.ts`. A no-op at 'full' density (FFX-2),
    // which already shows that block.
    `<p class="eint__move"><span class="eint__label">${plain(view.moveName)}</span>${confidenceHtml(view)}${full ? '' : briefStatusChip(view.statusText)}</p>`,
    `<p class="eint__desc">${plain(view.description)}</p>`,
    elements.length > 0
      ? `<p class="eint__els">${elements.map((e) => `<span>${escapeHtml(e)}</span>`).join('')}</p>`
      : '',
    chargeHtml(view),
    damageHtml(view),
    full && view.statusText.length > 0
      ? `<h4 class="eint__head">Statuses</h4><ul class="eint__lines">${view.statusText.map((s) => `<li>${plain(s)}</li>`).join('')}</ul>`
      : '',
    full ? branchesHtml(view) : '',
    view.formNote ? `<p class="eint__form">${plain(view.formNote)}</p>` : '',
    listHtml('If you attack', view.counters),
    full ? listHtml('Also', view.notes) : '',
  ].join('');
}
