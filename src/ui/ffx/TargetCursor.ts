import type { CombatantId } from '../../battle/common/types.ts';

export type ReticleKind = 'enemy' | 'ally' | 'self';

export interface TargetEntry {
  id: CombatantId;
  name: string;
  kind: ReticleKind;
  /**
   * The letter that tells one Yu Pagoda from the other — the same `A`/`B`/`C`
   * the CTB tile shows (`TurnPreview.letterTag`). The approved frames call it
   * out by name: it is *"the only thing that tells Yu Pagoda B from C"*.
   */
  tag?: string;
  /** One line of context under the name: "already Hasted", "HP full". */
  note?: string;
}

/** The target's painted silhouette on screen, in CSS pixels. */
export interface TargetRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Answers where a combatant's silhouette is. `PaintedStage.projectRect`. */
export type RectProjector = (id: CombatantId) => TargetRect | null;

/** What the cursor publishes every time the selection changes. */
export interface CursorSelection {
  ids: CombatantId[];
  /** `'single'` = the player is cycling; `'all'` = the command hits every id. */
  mode: 'single' | 'all';
  kind: ReticleKind;
  /** The one id being cycled, or null in `'all'` mode. */
  activeId: CombatantId | null;
}

/**
 * Which chrome the cursor wears.
 *
 * GAME-AWARE (AGENTS.md rule 14): **the cursor is game-specific and the two
 * chromes must never be mixed.** FFX uses a pointing hand docked against the
 * target's silhouette; FFX-2 does not — it uses a four-point pink sparkle as
 * its menu cursor and a rotating six-petal flower as its field reticle, and it
 * has no Act List at all. Source: `research/visual-bible.md` §4.2 and §4.7 and
 * `research/ffx-vs-ffx2-presentation.md` §9 row 2, which is explicit that the
 * two chromes must not be mixed. The bracket, the name plate with its letter
 * tag, the accent pool and the quiet dim are **both games**.
 */
export type CursorChrome = 'ffx' | 'ffx2';

/**
 * Fallback box for a target whose silhouette could not be projected — a
 * combatant the stage has not staged, or a HUD mock with no 3D field behind
 * it. Wide enough to read as a bracket rather than a dot.
 */
const FALLBACK_SIZE = 96;

/** How far the hand cursor is docked clear of the silhouette, at 1920 wide. */
const HAND_GAP_AT_1920 = 21;

/**
 * The target cursor, rebuilt to Bailey's approved end state — option B,
 * *"hand, ring and a quiet dim"* (`docs/concepts/targeting/b-ring-and-dim/`,
 * picked 2026-09-19).
 *
 * What it replaces: a pair of hairline corner brackets at a **fixed 64 px**
 * around the projected head point, and a name tag a few pixels tall. In
 * Bailey's own Chapter 3 frame that was the only cue that Yuna and Auron were
 * the targets of Hastega, and nothing at all said the cast hit all three.
 *
 * What is on screen now, per the approved frames:
 *
 * - a **four-corner bracket scaled to the figure's own bounds** — the tight
 *   alpha box, via `PaintedStage.projectRect` — gold `#F2C21E` for an enemy,
 *   green `#7EE8B0` for an ally, blue `#8FD0F0` for the actor itself, every
 *   stroke over a 1 px ink underlay so it survives a red sky and lava;
 * - an **ink name plate under the target** carrying the name *with its letter
 *   tag*, because that tag is the only mark that tells Yu Pagoda B from C;
 * - the **hand cursor** docked hard against the silhouette — FFX only (see
 *   {@link CursorChrome}) — and withdrawn entirely on a multi-target cast,
 *   where a hand hovering between three allies points at nothing;
 * - on a multi-target command, **every target bracketed and flashing
 *   together** under one centred label, "ALL ALLIES" / "ALL ENEMIES".
 *
 * The accent pool and the quiet dim are the same selection read in the 3D
 * scene; they live in `src/engine/TargetHighlight.ts` and are driven from the
 * {@link CursorSelection} this class publishes.
 *
 * Two display modes, as before:
 * - {@link showSingle} — every candidate gets a bracket (so a mouse player can
 *   click straight on whichever enemy they want), the active one at full
 *   strength with its plate and hand, the rest dimmed.
 * - {@link showGroup} — the command already hits every listed target; they all
 *   flash together and nothing is cycled.
 */
export class TargetCursor {
  readonly el: HTMLElement;
  private projector: RectProjector | null = null;
  private entries: TargetEntry[] = [];
  private mode: 'single' | 'group' = 'single';
  private activeIndex = 0;
  private chrome: CursorChrome = 'ffx';
  /**
   * Indices of {@link entries} in **on-screen left-to-right order**, which is
   * the order the arrow keys walk. The engine hands candidates in its own
   * order (slot, then id); cycling in that order sends the cursor jumping
   * across the field, which is exactly what "not clear which enemy is being
   * selected" feels like in the hand.
   */
  private order: number[] = [];
  private readonly onClick: (e: MouseEvent) => void;
  private clickHandler: ((id: CombatantId) => void) | null = null;
  private selectionHandler: ((sel: CursorSelection | null) => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.dataset['role'] = 'target-cursor';
    this.el.className = 'ffx-targeting';
    // Delegated: `reposition()` rebuilds the elements from scratch on every
    // call (keyboard move, camera update...), so listeners attached to
    // individual brackets would be lost the next time it runs. One listener on
    // the container, kept for the cursor's whole lifetime, survives that.
    this.onClick = (e: MouseEvent): void => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-target-id]');
      const id = el?.dataset['targetId'];
      if (id) this.clickHandler?.(id);
    };
    this.el.addEventListener('click', this.onClick);
  }

  /** `CommandMenu` wires this once, to its own `confirmTarget()` path — the exact route Enter uses. */
  setOnClick(handler: (id: CombatantId) => void): void {
    this.clickHandler = handler;
  }

  /**
   * Called on every change of selection, including the `null` that means the
   * player has confirmed or backed out. The HUD forwards it to the field's
   * accent pool and quiet dim, to the party rows and to the turn list, so the
   * four surfaces can never disagree about what is being aimed at.
   */
  setOnSelection(handler: (sel: CursorSelection | null) => void): void {
    this.selectionHandler = handler;
  }

  /** FFX's hand, or FFX-2's sparkle and flower. See {@link CursorChrome}. */
  setChrome(chrome: CursorChrome): void {
    this.chrome = chrome;
    this.el.classList.toggle('ffx-targeting--ffx2', chrome === 'ffx2');
  }

  setProjector(project: RectProjector): void {
    this.projector = project;
    this.reposition();
  }

  /**
   * Open the cursor on a set of candidates.
   *
   * `startAt` counts from the **left of the screen**, not into `entries` — the
   * engine hands candidates in its own order (slot, then id), and opening on
   * "the first one the engine listed" is how the cursor used to land on the
   * aeon in the middle of the field while the player's eye was at the left
   * edge. Pass 0 for the leftmost, which is what every caller wants.
   */
  showSingle(entries: TargetEntry[], startAt = 0): void {
    this.entries = entries;
    this.mode = 'single';
    this.activeIndex = 0;
    this.refreshOrder();
    const at = Math.max(0, Math.min(this.order.length - 1, startAt));
    this.activeIndex = this.order[at] ?? 0;
    this.reposition();
    this.publish();
  }

  showGroup(entries: TargetEntry[]): void {
    this.entries = entries;
    this.mode = 'group';
    this.activeIndex = -1;
    this.refreshOrder();
    this.reposition();
    this.publish();
  }

  /**
   * Step the cursor `delta` places through the **on-screen** order.
   *
   * Takes a step rather than an index because the index the caller holds is
   * into `entries`, and the order the player sees is the projected one; doing
   * the arithmetic here is what keeps "left" meaning left.
   */
  step(delta: number): void {
    if (this.mode !== 'single' || !this.entries.length) return;
    this.refreshOrder();
    const pos = this.order.indexOf(this.activeIndex);
    const at = pos < 0 ? 0 : pos;
    const next = ((at + delta) % this.order.length + this.order.length) % this.order.length;
    this.activeIndex = this.order[next]!;
    this.reposition();
    this.publish();
  }

  /** Selects the entry with this id, if it's a current candidate. Returns whether it was found. */
  setActiveById(id: CombatantId): boolean {
    if (this.mode !== 'single') return false;
    const i = this.entries.findIndex((e) => e.id === id);
    if (i < 0) return false;
    this.activeIndex = i;
    this.reposition();
    this.publish();
    return true;
  }

  get activeTargetId(): CombatantId | null {
    if (this.mode !== 'single') return null;
    return this.entries[this.activeIndex]?.id ?? null;
  }

  get index(): number {
    return this.activeIndex;
  }

  get activeEntry(): TargetEntry | null {
    if (this.mode !== 'single') return null;
    return this.entries[this.activeIndex] ?? null;
  }

  /** Every id this cursor is currently aimed at — one, or all of a group. */
  get targetIds(): CombatantId[] {
    if (this.mode === 'group') return this.entries.map((e) => e.id);
    const id = this.activeTargetId;
    return id ? [id] : [];
  }

  /** The live selection, or null when nothing is being chosen. */
  get selection(): CursorSelection | null {
    if (!this.entries.length) return null;
    return {
      ids: this.targetIds,
      mode: this.mode === 'group' ? 'all' : 'single',
      kind: this.entries[this.mode === 'group' ? 0 : this.activeIndex]?.kind ?? 'enemy',
      activeId: this.activeTargetId,
    };
  }

  hide(): void {
    const had = this.entries.length > 0;
    this.entries = [];
    this.order = [];
    this.el.innerHTML = '';
    if (had) this.selectionHandler?.(null);
  }

  dispose(): void {
    this.el.removeEventListener('click', this.onClick);
  }

  private publish(): void {
    this.selectionHandler?.(this.selection);
  }

  /** Re-sort the cycling order by where the candidates actually are on screen. */
  private refreshOrder(): void {
    const withX = this.entries.map((e, i) => ({
      i,
      x: this.rectFor(e.id, i)?.x ?? Number.POSITIVE_INFINITY,
    }));
    // A candidate that cannot be projected keeps its engine order at the end
    // rather than being dropped — it is still a legal target.
    withX.sort((a, b) => a.x - b.x || a.i - b.i);
    this.order = withX.map((w) => w.i);
  }

  /** Call whenever the presenter's camera may have moved, to re-read positions. */
  reposition(): void {
    if (!this.entries.length) {
      this.el.innerHTML = '';
      return;
    }
    const group = this.mode === 'group';
    // Single mode shows every candidate (each independently clickable), not
    // just the active one — a mouse player must be able to click straight on
    // any valid enemy, not only the keyboard-highlighted one.
    const clickable = !group;
    const scale = typeof window === 'undefined' ? 1 : window.innerWidth / 1920;
    const handGap = Math.max(10, HAND_GAP_AT_1920 * scale);

    const parts: string[] = [];
    this.entries.forEach((entry, i) => {
      const rect = this.rectFor(entry.id, i);
      if (!rect) return;
      const active = group || i === this.activeIndex;
      const dim = group ? this.entries.length > 1 : i !== this.activeIndex;
      const cls = [
        'ffx-target',
        `ffx-target--${entry.kind}`,
        dim ? 'ffx-target--dim' : '',
        group ? 'ffx-target--group' : '',
        clickable ? 'ffx-target--clickable' : '',
      ]
        .filter(Boolean)
        .join(' ');
      // The corner length follows the figure: a 60 px destructible part and a
      // 420 px aeon cannot wear the same 30 px bracket and both read as one
      // mark. Bounded so a tiny target still shows a bracket and a huge one
      // does not turn into a full box.
      const corner = clamp(Math.min(rect.w, rect.h) * 0.26, 12, 54);
      const idAttr = clickable ? ` data-target-id="${escapeHtml(entry.id)}"` : '';
      parts.push(
        `<div class="${cls}"${idAttr} style="left:${px(rect.x)};top:${px(rect.y)};width:${px(rect.w)};height:${px(rect.h)};--ffx-corner:${px(corner)}">` +
          '<span class="ffx-target__c ffx-target__c--tl"></span>' +
          '<span class="ffx-target__c ffx-target__c--tr"></span>' +
          '<span class="ffx-target__c ffx-target__c--bl"></span>' +
          '<span class="ffx-target__c ffx-target__c--br"></span>' +
          '</div>',
      );

      if (!active || group) return;

      // The hand, docked against the silhouette rather than floating between
      // two fiends. FFX only: FFX-2 has no finger cursor, and the two chromes
      // must never be mixed [visual-bible 4.2, ffx-vs-ffx2-presentation 9].
      if (this.chrome === 'ffx') {
        parts.push(
          `<div class="ffx-target__hand" style="left:${px(rect.x - handGap)};top:${px(rect.y + rect.h * 0.55)}">${HAND_SVG}</div>`,
        );
      } else {
        // FFX-2's field reticle: a rotating six-petal flower wrapping the
        // target, and the sparkle that marks the menu lives in the command
        // list, not out here.
        const r = Math.max(rect.w, rect.h) * 0.62;
        parts.push(
          `<div class="ffx-target__flower" style="left:${px(rect.x + rect.w / 2)};top:${px(rect.y + rect.h / 2)};width:${px(r * 2)};height:${px(r * 2)}">${FLOWER_SVG}</div>`,
        );
      }

      parts.push(this.plateHtml(entry, rect));
    });

    if (group) parts.push(this.groupLabelHtml());
    this.el.innerHTML = parts.join('');
  }

  /** The ink name plate under the target: name, letter tag, optional note. */
  private plateHtml(entry: TargetEntry, rect: TargetRect): string {
    const tag = entry.tag
      ? `<span class="ffx-target__tag">${escapeHtml(entry.tag)}</span>`
      : '';
    const note = entry.note
      ? `<span class="ffx-target__note">${escapeHtml(entry.note)}</span>`
      : '';
    return (
      `<div class="ffx-target__plate ffx-target__plate--${entry.kind}" style="left:${px(rect.x + rect.w / 2)};top:${px(rect.y + rect.h)}">` +
      `<span class="ffx-target__name">${escapeHtml(entry.name)}</span>${tag}${note}` +
      '</div>'
    );
  }

  /**
   * One centred label for a multi-target command — "ALL ALLIES", "ALL
   * ENEMIES". The approved frame withdraws the field cursor entirely here and
   * lets the flashing bracket set and this label carry it.
   */
  private groupLabelHtml(): string {
    const kind = this.entries[0]?.kind ?? 'enemy';
    const label = kind === 'enemy' ? 'ALL ENEMIES' : 'ALL ALLIES';
    const boxes = this.entries
      .map((e, i) => this.rectFor(e.id, i))
      .filter((r): r is TargetRect => !!r);
    if (!boxes.length) return '';
    const left = Math.min(...boxes.map((b) => b.x));
    const right = Math.max(...boxes.map((b) => b.x + b.w));
    const top = Math.min(...boxes.map((b) => b.y));
    return (
      `<div class="ffx-target__all ffx-target__all--${kind}" style="left:${px((left + right) / 2)};top:${px(top)}">` +
      `<span>${label}</span></div>`
    );
  }

  /**
   * The silhouette, or a stand-in for it.
   *
   * Three cases, in order:
   *
   * 1. a real projected rectangle — what a live battle always gives;
   * 2. a **point** with no size, which is the old point projector still in
   *    place: a box around it, so the chrome is at least on the right fighter;
   * 3. **nothing at all** — a HUD mock screen or a unit fixture with no 3D
   *    field behind it. Those still need a clickable, countable bracket per
   *    candidate or the screen is useless for checking the chrome, so they get
   *    a stacked column down the left edge. It is deliberately ugly: a stack
   *    like that on a real field means the projector has stopped answering.
   */
  private rectFor(id: CombatantId, index: number): TargetRect | null {
    const r = this.projector?.(id);
    if (r && r.w > 1 && r.h > 1) return r;
    if (r) {
      return {
        x: r.x - FALLBACK_SIZE / 2,
        y: r.y - FALLBACK_SIZE / 2,
        w: FALLBACK_SIZE,
        h: FALLBACK_SIZE,
      };
    }
    return { x: 16, y: 16 + index * (FALLBACK_SIZE + 8), w: FALLBACK_SIZE, h: FALLBACK_SIZE };
  }
}

function px(v: number): string {
  return `${Math.round(v * 10) / 10}px`;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * FFX's pointing hand, redrawn in Ink & Gold: a paper glove with an ink
 * outline and a gold cuff, per the approved frames. An inline SVG rather than
 * an asset so it inherits `currentColor` and needs no load.
 */
const HAND_SVG = `<svg viewBox="0 0 44 30" aria-hidden="true">
  <path class="ffx-hand__cuff" d="M1 7h9v16H1z"/>
  <path class="ffx-hand__palm" d="M10 9h13V4.5c0-1.6 1.2-2.8 2.7-2.8S28.4 2.9 28.4 4.5V13h3.3c5.6 0 10.3 1.7 10.3 2.9 0 1-2.2 1.9-4.6 2.6l-6.2 1.8c-1.7.5-2.6 1.4-3.3 2.6l-1.6 2.8c-.6 1-1.7 1.6-2.9 1.6H10z"/>
</svg>`;

/**
 * FFX-2's field reticle: a rotating six-petal flower, **not** a bracket and
 * **not** FFX's finger [visual-bible §4.7]. The rotation is CSS.
 */
const FLOWER_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle class="ffx-flower__ring" cx="50" cy="50" r="38"/>
  ${[0, 60, 120, 180, 240, 300]
    .map(
      (a) =>
        `<ellipse class="ffx-flower__petal" cx="50" cy="12" rx="5.5" ry="9" transform="rotate(${a} 50 50)"/>`,
    )
    .join('')}
</svg>`;

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
