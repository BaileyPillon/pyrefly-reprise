import './node-edge-markers.css';
import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { nodeColour } from '../../battle/ffx2/index.ts';
import { escapeHtml } from '../ffx/targetCursorParts.ts';
import { BAND_GRID_HEIGHT } from './commandHelpBand.ts';

/**
 * D-044, Node option C: Vegnagun's Nodes "hang far overhead"
 * (`research/ffx2-vegnagun-shuyin.md` §2), so the stage projects them above the
 * top edge and the target cursor's bracket, flower and plate for a Node are all
 * drawn off-frame. The approved mock (`docs/concepts/chapters/vegnagun/parts/
 * node-c.jpg`) marks each one at the top of the frame instead: an arrow in the
 * Node's current colour over an ink plate with its name, at the Node's own x.
 *
 * Built to `docs/plans/vegnagun-parts-wiring.md` §4:
 * - one marker per living Node whose projected point is above the top edge;
 * - the arrow is a child of the plate, centred on it, so the pair never parts;
 * - the arrow wears the Node's colour from the engine's own §3.2 machine
 *   (`nodeColour`: red, green, yellow), never a colour made up here;
 * - the row sits under the command-help band's reserved strip whenever BATTLE
 *   HELP is on, so it does not jump when a menu opens, and slides sideways off
 *   the Active/Wait chip, the TARGET and actor plates, the telegraph, the boss
 *   strip and the intent slab. The plan had the slab steer round the markers
 *   instead; measured, that left a Node's tall slab no free spot and put it on
 *   the command window, so here the markers give way ({@link ROW_SELECTORS});
 * - the Node being aimed at lights up, since its bracket is out of sight.
 *
 * FFX-2 only (AGENTS.md rule 14): the Nodes are Chapter 5's, and nothing on
 * the FFX side mounts this. Everything is on the 640x360 grid: the markers live
 * in `.ffx2hud__plates`, which is transformed exactly like the stage.
 */

/** The sprite key every Node is drawn under (`src/data/ffx2/enemies/vegnagun-leg.ts`). */
export const NODE_SPRITE_KEY = 'vegnagun-node';
/** Grid units between the band's reserved strip (or the stage top) and the arrow. */
export const ROW_GAP = 2;
/** Grid units kept between a marker and anything it steers round. */
export const MARK_GAP = 3;
/** The frame's usable span on the grid. */
const EDGE_LO = 4;
const EDGE_HI = 636;
/** Smallest real text size the plate may render at (the plates' own floor). */
const MIN_TEXT_PX = 11;
/** The plate's text size on the grid (the mock's 14 px at 1600x900). */
const TEXT_GRID = 5.6;

/** A horizontal span on the grid. */
export interface Span {
  lo: number;
  hi: number;
}

/** One marker to place: where it wants to be (its Node's x) and how wide it is. */
export interface MarkWant {
  id: CombatantId;
  x: number;
  w: number;
}

/** The frame's free spans once every blocked span (plus its gap) is taken out. */
function freeSpans(blocked: readonly Span[], lo: number, hi: number): Span[] {
  const cuts = blocked.map((b) => ({ lo: b.lo - MARK_GAP, hi: b.hi + MARK_GAP })).sort((a, b) => a.lo - b.lo);
  const out: Span[] = [];
  let at = lo;
  for (const c of cuts) {
    if (c.lo > at) out.push({ lo: at, hi: Math.min(c.lo, hi) });
    at = Math.max(at, c.hi);
  }
  if (at < hi) out.push({ lo: at, hi });
  return out.filter((f) => f.hi > f.lo);
}

/** Packs an ordered run of markers into one free span, as near their wants as the order allows; null when it cannot fit. */
function pack(run: readonly MarkWant[], span: Span): number[] | null {
  const need = run.reduce((sum, m) => sum + m.w, 0) + MARK_GAP * (run.length - 1);
  if (need > span.hi - span.lo + 1e-6) return null;
  const xs = run.map((m) => Math.min(span.hi - m.w / 2, Math.max(span.lo + m.w / 2, m.x)));
  for (let i = 1; i < xs.length; i++) xs[i] = Math.max(xs[i]!, xs[i - 1]! + (run[i - 1]!.w + run[i]!.w) / 2 + MARK_GAP);
  const last = xs.length - 1;
  xs[last] = Math.min(xs[last]!, span.hi - run[last]!.w / 2);
  for (let i = last - 1; i >= 0; i--) xs[i] = Math.min(xs[i]!, xs[i + 1]! - (run[i]!.w + run[i + 1]!.w) / 2 - MARK_GAP);
  return xs;
}

/**
 * Place the markers as near their Nodes' x as they can go, inside the frame,
 * off every blocked span and off each other, **in the Nodes' own left-to-right
 * order** (a greedy one-at-a-time pass stacked them backwards against a plate:
 * B, C, A). Every order-keeping split of the markers over the free spans is
 * tried (three markers, a handful of spans) and the one that moves them least
 * wins. Pure, for the tests.
 */
export function placeMarks(wants: readonly MarkWant[], blocked: readonly Span[], lo = EDGE_LO, hi = EDGE_HI): Map<CombatantId, number> {
  const order = [...wants].sort((a, b) => a.x - b.x || (a.id < b.id ? -1 : 1));
  const spans = freeSpans(blocked, lo, hi);
  let best: { cost: number; xs: number[] } | null = null;
  const assign = (i: number, from: number, pick: number[]): void => {
    if (i === order.length) {
      const xs: number[] = [];
      for (let s = 0; s < spans.length; s++) {
        const run = order.filter((_, k) => pick[k] === s);
        if (!run.length) continue;
        const got = pack(run, spans[s]!);
        if (!got) return;
        xs.push(...got);
      }
      const cost = xs.reduce((sum, x, k) => sum + Math.abs(x - order[k]!.x), 0);
      if (!best || cost < best.cost) best = { cost, xs };
      return;
    }
    for (let s = from; s < spans.length; s++) assign(i + 1, s, [...pick, s]);
  };
  assign(0, 0, []);
  const out = new Map<CombatantId, number>();
  const found = best as { cost: number; xs: number[] } | null;
  order.forEach((m, k) => out.set(m.id, found ? found.xs[k]! : Math.min(hi - m.w / 2, Math.max(lo + m.w / 2, m.x))));
  return out;
}

/** What the HUD hands over each frame. */
export interface NodeMarkSources {
  state: BattleState | null;
  project: (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null;
  /** The HUD root; the stage's offset inside it and its letterbox scale. */
  host: HTMLElement;
  stageX: number;
  stageY: number;
  scale: number;
  /** True while the command-help band holds the top strip of the stage (BATTLE HELP on, not in a portrait bar). Asked only when a Node is up. */
  bandOnStage: () => boolean;
}

/** Chrome that shares the markers' row, and so pushes a marker sideways. */
const ROW_SELECTORS = [
  '.ffx2-atbmode',
  '.ffx2-tplate',
  '.ffx2-aplate',
  '.ffx2hud__telegraph',
  '.ffx2hud__enemies',
  // The intent slab and its chip. The markers step round the slab, not the other way: made an
  // obstacle of the slab's, the markers pushed it down onto the ATTACK row at 2000x1012 (a Node's
  // slab with its odds table has no free spot left), and the command window must stay clear.
  '.eint__panel',
  '.eint__toggle',
];

/** The Node colour for a combatant, via the engine's §3.2 machine. */
function colourOf(state: BattleState, id: CombatantId): string {
  return nodeColour(state.combatants[id] as unknown as Parameters<typeof nodeColour>[0]);
}

export class NodeEdgeMarkers {
  readonly el: HTMLElement;
  private sources: (() => NodeMarkSources) | null = null;
  private targeted = new Set<CombatantId>();
  private html = '';

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffx2-nodemarks';
  }

  mount(layer: HTMLElement, sources: () => NodeMarkSources): void {
    this.sources = sources;
    layer.appendChild(this.el);
  }

  /** The ids the target cursor is on (one, or a whole side); a Node among them lights up. */
  select(ids: readonly CombatantId[] | null | undefined): void {
    this.targeted = new Set(ids ?? []);
    this.update();
  }

  /** Per frame: which Nodes are off the top edge, and where their markers go. */
  update(): void {
    const src = this.sources?.();
    const state = src?.state;
    const nodes = state ? Object.values(state.combatants).filter((c) => c.spriteKey === NODE_SPRITE_KEY && c.alive) : [];
    if (!src || !state || !nodes.length) return this.paint('');
    const host = src.host.getBoundingClientRect();
    const scale = src.scale > 0 ? src.scale : 1;
    const ox = host.left + src.stageX;
    const oy = host.top + src.stageY;
    const top = (src.bandOnStage() ? BAND_GRID_HEIGHT : 0) + ROW_GAP;
    const text = Math.max(TEXT_GRID, MIN_TEXT_PX / scale);
    const markH = text * 3.3;
    const wants: MarkWant[] = [];
    for (const c of nodes) {
      const p = src.project(c.id, 'chest');
      if (!p || p.y >= host.top) continue;
      wants.push({ id: c.id, x: (p.x - ox) / scale, w: text * (c.name.length * 0.72 + 2.4) });
    }
    if (!wants.length) return this.paint('');
    const blocked: Span[] = [];
    for (const sel of ROW_SELECTORS) {
      for (const node of src.host.querySelectorAll(sel)) {
        const r = node.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) continue;
        const y0 = (r.top - oy) / scale;
        const y1 = (r.bottom - oy) / scale;
        if (y1 > top && y0 < top + markH) blocked.push({ lo: (r.left - ox) / scale, hi: (r.right - ox) / scale });
      }
    }
    const at = placeMarks(wants, blocked);
    const parts = wants.map((w) => {
      const c = state.combatants[w.id]!;
      const on = this.targeted.has(w.id) ? ' ffx2-nodemark--on' : '';
      const x = (at.get(w.id) ?? w.x).toFixed(2);
      return (
        `<div class="ffx2-nodemark ffx2-nodemark--${colourOf(state, w.id)}${on}" data-actor-mark="${escapeHtml(w.id)}" ` +
        `style="left:${x}px;top:${top.toFixed(2)}px;--nm-text:${text.toFixed(2)}px">` +
        `<i class="ffx2-nodemark__arrow" aria-hidden="true"></i><span class="ffx2-nodemark__name">${escapeHtml(c.name)}</span></div>`
      );
    });
    this.paint(parts.join(''));
  }

  unmount(): void {
    this.paint('');
    this.el.remove();
    this.sources = null;
  }

  /** Writes only on a change, so a still frame costs no DOM work. */
  private paint(html: string): void {
    if (html === this.html) return;
    this.html = html;
    this.el.innerHTML = html;
  }
}
