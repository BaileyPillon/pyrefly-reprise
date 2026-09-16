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
 * - {@link showSingle} — the player is cycling one-at-a-time among
 *   candidates for a single-target command; only the highlighted candidate
 *   gets a reticle plus name plate, and left/right "jumps" instantly.
 * - {@link showGroup} — the command already hits every listed target (all
 *   enemies / all allies / self); every one gets a reticle at reduced
 *   opacity, with no single "selection" to cycle.
 */
export class TargetCursor {
  readonly el: HTMLElement;
  private projector: Projector | null = null;
  private entries: TargetEntry[] = [];
  private mode: 'single' | 'group' = 'single';
  private activeIndex = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.dataset['role'] = 'target-cursor';
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

  /** Call whenever the presenter's camera may have moved, to re-read positions. */
  reposition(): void {
    const shown = this.mode === 'single' ? this.entries.slice(this.activeIndex, this.activeIndex + 1) : this.entries;
    const dim = this.mode === 'group' && shown.length > 1;
    this.el.innerHTML = shown
      .map((entry) => {
        const pos = this.projector?.(entry.id);
        if (!pos) return '';
        const cls = ['ig-reticle', dim ? 'ffx-reticle--dim' : ''].filter(Boolean).join(' ');
        const nameplate =
          this.mode === 'single'
            ? `<div class="ig-reticle__name"><span class="ig-reticle__name-text">${escapeHtml(entry.name)}</span></div>`
            : '';
        return `<div class="${cls}" style="left:${pos.x - RETICLE_SIZE / 2}px;top:${pos.y - RETICLE_SIZE / 2}px;width:${RETICLE_SIZE}px;height:${RETICLE_SIZE}px">
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
