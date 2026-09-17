import type { CombatantId } from '../../battle/common/types.ts';
import type { Projector } from './DamageNumbers.ts';

export type ReticleKind = 'enemy' | 'ally' | 'self';

export interface TargetEntry {
  id: CombatantId;
  name: string;
  kind: ReticleKind;
}

/** Reticle box size in logical px — the target's own on-screen extent isn't
 * known here (the projector only gives a point), so a fixed size stands in
 * for "scaled to the sprite's bounding box" until the presenter can supply one. */
const RETICLE_SIZE = 64;

/**
 * Target reticles, restyled onto Ink & Gold's `.ig-reticle` (`slabs.css`,
 * spec "Components" > "Target bracket"): four 30px gold corners with a glow,
 * a name plate hanging off the left edge. Ink & Gold keeps a single accent
 * ("one accent per context, never two") so every reticle reads gold
 * regardless of `kind` — `kind` still selects the name-plate label only.
 *
 * Two display modes:
 * - {@link showSingle} — the player is choosing one target for a
 *   single-target command. Every candidate gets its own reticle (so a mouse
 *   player can click straight on whichever enemy they want, not just the
 *   keyboard-highlighted one) — the active one full brightness with its name
 *   plate, the rest dimmed. Keyboard left/right "jumps" the active one
 *   instantly; clicking any reticle both selects *and* confirms it, the same
 *   as arrowing to it and pressing confirm (`CommandMenu` routes both
 *   through the one `confirmTarget()` path).
 * - {@link showGroup} — the command already hits every listed target (all
 *   enemies / all allies / self); every one gets a reticle at reduced
 *   opacity, with no single "selection" to cycle or click.
 */
export class TargetCursor {
  readonly el: HTMLElement;
  private projector: Projector | null = null;
  private entries: TargetEntry[] = [];
  private mode: 'single' | 'group' = 'single';
  private activeIndex = 0;
  private readonly onClick: (e: MouseEvent) => void;

  constructor() {
    this.el = document.createElement('div');
    this.el.dataset['role'] = 'target-cursor';
    // Delegated: `reposition()` rebuilds the reticle elements from scratch on
    // every call (keyboard move, camera update...), so listeners attached to
    // individual reticles would be lost the next time it runs. One listener
    // on the container, kept for the cursor's whole lifetime, survives that.
    this.onClick = (e: MouseEvent): void => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-target-id]');
      const id = el?.dataset['targetId'];
      if (id) this.clickHandler?.(id);
    };
    this.el.addEventListener('click', this.onClick);
  }

  private clickHandler: ((id: CombatantId) => void) | null = null;

  /** `CommandMenu` wires this once, to its own `confirmTarget()` path — the exact route Enter uses. */
  setOnClick(handler: (id: CombatantId) => void): void {
    this.clickHandler = handler;
  }

  setProjector(project: Projector): void {
    this.projector = project;
    this.reposition();
  }

  showSingle(entries: TargetEntry[], activeIndex: number): void {
    this.entries = entries;
    this.mode = 'single';
    this.activeIndex = Math.max(0, Math.min(entries.length - 1, activeIndex));
    this.reposition();
  }

  showGroup(entries: TargetEntry[]): void {
    this.entries = entries;
    this.mode = 'group';
    this.activeIndex = -1;
    this.reposition();
  }

  setActiveIndex(i: number): void {
    if (this.mode !== 'single' || !this.entries.length) return;
    this.activeIndex = ((i % this.entries.length) + this.entries.length) % this.entries.length;
    this.reposition();
  }

  /** Selects the entry with this id, if it's a current candidate. Returns whether it was found. */
  setActiveById(id: CombatantId): boolean {
    if (this.mode !== 'single') return false;
    const i = this.entries.findIndex((e) => e.id === id);
    if (i < 0) return false;
    this.activeIndex = i;
    this.reposition();
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

  hide(): void {
    this.entries = [];
    this.el.innerHTML = '';
  }

  dispose(): void {
    this.el.removeEventListener('click', this.onClick);
  }

  /** Call whenever the presenter's camera may have moved, to re-read positions. */
  reposition(): void {
    // Single mode shows every candidate (each independently clickable), not
    // just the active one — a mouse player must be able to click straight on
    // any valid enemy, not only the keyboard-highlighted one.
    const clickable = this.mode === 'single';
    this.el.innerHTML = this.entries
      .map((entry, i) => {
        const pos = this.projector?.(entry.id);
        if (!pos) return '';
        const active = this.mode === 'group' || i === this.activeIndex;
        const dim = this.mode === 'group' ? this.entries.length > 1 : i !== this.activeIndex;
        const cls = ['ig-reticle', dim ? 'ffx-reticle--dim' : '', clickable ? 'ffx-reticle--clickable' : ''].filter(Boolean).join(' ');
        const nameplate =
          this.mode === 'single' && active
            ? `<div class="ig-reticle__name"><span class="ig-reticle__name-text">${escapeHtml(entry.name)}</span></div>`
            : '';
        const idAttr = clickable ? ` data-target-id="${escapeHtml(entry.id)}"` : '';
        return `<div class="${cls}"${idAttr} style="left:${pos.x - RETICLE_SIZE / 2}px;top:${pos.y - RETICLE_SIZE / 2}px;width:${RETICLE_SIZE}px;height:${RETICLE_SIZE}px">
          <span class="ig-reticle__corner ig-reticle__corner--tl"></span>
          <span class="ig-reticle__corner ig-reticle__corner--tr"></span>
          <span class="ig-reticle__corner ig-reticle__corner--bl"></span>
          <span class="ig-reticle__corner ig-reticle__corner--br"></span>
          ${nameplate}
        </div>`;
      })
      .join('');
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
