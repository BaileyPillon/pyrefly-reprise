/**
 * Status display O1 (Bailey's pick O3 includes it, 2026-09-29): **the marks drawn on and over a
 * figure** while a status is on it, and the blue shield that flashes when Protect meets a physical
 * hit. A DOM layer over the painted field, in viewport px, re-placed every frame from the field's
 * own projection (the way `DoomCounters.ts` follows a head).
 *
 * Which marks a combatant wears is `statusLooks.ts`'s per-game table (AGENTS.md rule 14: a status
 * no source describes draws nothing). Every mark is our own CSS/SVG drawing of the sourced idea
 * (rule 8), sized from `docs/concepts/status-display-0929/options/src/gen.mjs`, the approved
 * mockup's own geometry: offsets are in the mockup's px for a 261 px tall Kimahri at 1600x900,
 * scaled by the figure's projected height (`--k`).
 *
 * Presentation only (rule 1): it reads the state and the projection, never writes either.
 */

import './status-marks.css';
import type { BattleState, CombatantId, StatusId } from '../../battle/common/types.ts';
import { figureLookOf, type FigureMark, type StatusGame } from './statusLooks.ts';

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

/** Where a figure is on screen, in viewport px. */
export interface MarkField {
  head(id: CombatantId): Point | null;
  chest(id: CombatantId): Point | null;
  rect(id: CombatantId): Rect | null;
  /** 0..1: how much of the figure is drawn (a dissolving or removed figure wears nothing). */
  alpha?(id: CombatantId): number;
}

/** The mockup's reference figure height (Kimahri at 1600x900, `gen.mjs` `k`). */
export const REFERENCE_HEIGHT = 261;
const K_MIN = 0.25;
/**
 * The field's head anchor is the top of the head; the mockup placed its marks on the head's
 * middle (gen.mjs `head()`: Kimahri 0.2 h, Rikku 0.135 h, Yuna 0.106 h down the figure). Measured
 * on the two approved frames the gap is 7 to 31 mockup px; this is their middle.
 */
export const HEAD_DROP = 20;
const K_MAX = 1.4;

/** The mark scale for a figure `h` px tall. Pure. */
export function markScale(h: number): number {
  if (!(h > 0)) return 1;
  return Math.max(K_MIN, Math.min(K_MAX, h / REFERENCE_HEIGHT));
}

/** Every mark a combatant wears in `game`, in draw order, deduplicated. Pure. */
export function marksFor(game: StatusGame, statuses: Partial<Record<string, unknown>>): FigureMark[] {
  const out: FigureMark[] = [];
  for (const [id, inst] of Object.entries(statuses)) {
    if (inst === undefined || inst === null) continue;
    for (const m of figureLookOf(game, id as StatusId)?.marks ?? []) if (!out.includes(m)) out.push(m);
  }
  return out;
}

/** Does this combatant show a figure look at all right now? KO, petrify, removed and hidden do not. */
export function wearsLooks(c: BattleState['combatants'][string] | undefined, result: unknown): boolean {
  if (!c || result) return false;
  if (!c.alive || c.removed || c.flags?.hidden) return false;
  return !c.statuses['petrify'];
}

const STAR = 'M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.3l-6.1 3.3 1.4-6.8-5.1-4.7 6.9-.8z';
/** A four-bump cumulus (Darkness): flat base, round crowns, so it reads as a cloud at any size. */
const CLOUD = 'M9 38a8 8 0 0 1-1-15.9A10 10 0 0 1 22.5 13a12 12 0 0 1 21.5 1.5A9.5 9.5 0 0 1 57 24a7.5 7.5 0 0 1-2 14z';
const SHIELD = 'M30 3l24 9v17c0 16-11 27-24 33C17 56 6 45 6 29V12z';

/** One mark's markup, positioned relative to the head point in the mockup's px (`* var(--k)`). */
function markHtml(mark: FigureMark): string {
  switch (mark) {
    case 'smoke': {
      // Zombie (FFX): "black smoke clouds around their heads" (research/status-display.md §2); gen.mjs `smoke()`.
      const puffs: Array<[number, number, number, number]> = [[-44, -6, 20, 14], [-30, -34, 18, 13], [-2, -50, 22, 14], [30, -38, 19, 13], [46, -8, 17, 12], [-50, 20, 14, 10], [44, 22, 13, 9]];
      return `<span class="stm stm--smoke">${puffs.map(([dx, dy, rx, ry], i) => `<i style="--dx:${dx};--dy:${dy};--rx:${rx};--ry:${ry};--d:${(i * 0.37).toFixed(2)}s"></i>`).join('')}</span>`;
    }
    case 'bubbles': {
      // Poison (both): "green bubbles above the afflicted target's head"; gen.mjs `bubbles()`.
      const bs: Array<[number, number, number]> = [[4, -52, 9], [20, -74, 7], [8, -94, 5.5], [28, -50, 4.5], [-6, -76, 4]];
      return `<span class="stm stm--bubbles">${bs.map(([dx, dy, r], i) => `<i style="--dx:${dx};--dy:${dy};--r:${r};--d:${(i * 0.45).toFixed(2)}s"></i>`).join('')}</span>`;
    }
    case 'zzz': {
      // Sleep (both): "Z's emerge from their head"; gen.mjs `zzz()`. The hunch needs a painting (not approved).
      const zs: Array<[number, number, number]> = [[16, -26, 34], [38, -56, 27], [56, -82, 20]];
      return `<span class="stm stm--zzz">${zs.map(([dx, dy, s], i) => `<i style="--dx:${dx};--dy:${dy};--s:${s};--d:${(i * 0.6).toFixed(2)}s">Z</i>`).join('')}</span>`;
    }
    case 'stars':
      // Confuse (both): "two spinning stars over their head".
      return `<span class="stm stm--stars"><i><svg viewBox="0 0 24 24"><path d="${STAR}"/></svg></i><i><svg viewBox="0 0 24 24"><path d="${STAR}"/></svg></i></span>`;
    case 'halo':
      // Auto-Life (both): "a halo above their head".
      return '<span class="stm stm--halo"><i></i></span>';
    case 'ellipsis':
      // Silence (FFX-2): "a speech bubble with an ellipsis above their head"; gen.mjs `speech()`.
      return '<span class="stm stm--ellipsis"><svg viewBox="0 0 54 36"><path d="M6 2h42a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-10 8 2-8H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"/><circle cx="16" cy="14" r="3"/><circle cx="27" cy="14" r="3"/><circle cx="38" cy="14" r="3"/></svg></span>';
    case 'cloud':
      // Darkness (FFX-2): "a black cloud on the affected character's head".
      return `<span class="stm stm--cloud"><svg viewBox="0 0 64 44"><path d="${CLOUD}"/></svg></span>`;
    case 'orb-red':
    case 'orb-white':
    case 'orb-yellow':
    case 'orb-blue':
      // NulBlaze / NulFrost / NulShock / NulTide (FFX): "a circling red / white / yellow / blue orb".
      return `<span class="stm stm--orb stm--${mark}"><i></i></span>`;
    default:
      return '';
  }
}

interface Fig {
  el: HTMLElement;
  key: string;
}

/** Marks and shield flashes for every figure on one field. */
export class StatusMarks {
  readonly el: HTMLElement;
  private readonly figs = new Map<CombatantId, Fig>();
  private readonly flashes: Array<{ id: CombatantId; el: HTMLElement; until: number }> = [];
  private shown = true;
  private clock = 0;
  private layerRect: DOMRect | null = null;
  private layerAt = 0;
  private layerSize = '';

  constructor(private readonly game: StatusGame) {
    this.el = document.createElement('div');
    this.el.className = `stm-layer stm-layer--${game}`;
    this.el.dataset['role'] = 'status-marks';
  }

  /** Reconcile with the state: who wears which marks. Cheap when nothing changed. */
  sync(state: BattleState): void {
    const live = new Set<CombatantId>();
    for (const [id, c] of Object.entries(state.combatants)) {
      if (!wearsLooks(c, state.result)) continue;
      const marks = marksFor(this.game, c.statuses);
      if (marks.length === 0) continue;
      live.add(id);
      const key = marks.join(',');
      let fig = this.figs.get(id);
      if (!fig) {
        const el = document.createElement('div');
        el.className = 'stm-fig';
        el.dataset['actor'] = id;
        el.hidden = true;
        this.el.appendChild(el);
        fig = { el, key: '' };
        this.figs.set(id, fig);
      }
      if (fig.key !== key) {
        fig.key = key;
        fig.el.dataset['marks'] = key;
        fig.el.innerHTML = marks.map(markHtml).join('');
      }
    }
    for (const [id, fig] of [...this.figs]) {
      if (live.has(id)) continue;
      fig.el.remove();
      this.figs.delete(id);
    }
  }

  /** The blue shield on a figure (Protect meeting a physical hit, both games). */
  shield(id: CombatantId): void {
    const el = document.createElement('div');
    el.className = 'stm-shield';
    el.dataset['actor'] = id;
    el.innerHTML = `<svg viewBox="0 0 60 64"><path d="${SHIELD}"/></svg>`;
    this.el.appendChild(el);
    this.flashes.push({ id, el, until: this.clock + 0.6 });
  }

  setShown(on: boolean): void {
    this.shown = on;
    this.el.hidden = !on;
  }

  /** Per frame: follow each figure. */
  update(dt: number, field: MarkField | null): void {
    this.clock += dt;
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i]!;
      if (this.clock < f.until) continue;
      f.el.remove();
      this.flashes.splice(i, 1);
    }
    if (!this.shown || !field || (this.figs.size === 0 && this.flashes.length === 0)) return;
    // The layer fills the battle root: its rect changes with the window only. Reading it every frame
    // forced a layout mid-frame; twice a second (and on a resize) is enough.
    const size = `${innerWidth}x${innerHeight}`;
    if (!this.layerRect || this.clock - this.layerAt > 0.5 || size !== this.layerSize) {
      this.layerRect = this.el.getBoundingClientRect();
      this.layerAt = this.clock;
      this.layerSize = size;
    }
    const layer = this.layerRect;
    for (const [id, fig] of this.figs) this.place(fig.el, id, 'head', field, layer);
    for (const f of this.flashes) this.place(f.el, f.id, 'chest', field, layer);
  }

  private place(el: HTMLElement, id: CombatantId, anchor: 'head' | 'chest', field: MarkField, layer: DOMRect): void {
    const p = anchor === 'head' ? field.head(id) : field.chest(id);
    const r = field.rect(id);
    const alpha = field.alpha?.(id) ?? 1;
    if (!p || alpha < 0.05) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    const k = markScale(r?.h ?? 0);
    const y = p.y + (anchor === 'head' ? HEAD_DROP * k : 0);
    const ks = k.toFixed(3);
    const op = alpha < 1 ? alpha.toFixed(2) : '';
    const tf = `translate(${(p.x - layer.left).toFixed(1)}px, ${(y - layer.top).toFixed(1)}px)`;
    if (el.dataset['k'] !== ks) {
      el.dataset['k'] = ks;
      el.style.setProperty('--k', ks);
    }
    if (el.style.opacity !== op) el.style.opacity = op;
    if (el.style.transform !== tf) el.style.transform = tf;
  }

  /** Ids wearing marks, and which (tests, the debug snapshot). */
  snapshot(): Record<CombatantId, string> {
    const out: Record<CombatantId, string> = {};
    for (const [id, fig] of this.figs) out[id] = fig.key;
    return out;
  }

  dispose(): void {
    for (const fig of this.figs.values()) fig.el.remove();
    this.figs.clear();
    for (const f of this.flashes) f.el.remove();
    this.flashes.length = 0;
    this.el.remove();
  }
}
