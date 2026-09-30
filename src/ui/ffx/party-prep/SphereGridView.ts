/**
 * The Sphere Grid canvas: the pan/zoom node graph from
 * `research/visual-bible.md` §5.4, drawn at the real device resolution and
 * wired to {@link SphereGridModel} for movement and activation.
 *
 * RESOLUTION — the bug this file was rewritten for. Every Ink & Gold screen
 * is authored on the 640x360 grid and scaled onto the viewport by one
 * `transform: scale(k)` on `LetterboxStage`'s inner element. So for a canvas
 * inside that stage there are **three** sizes, not two:
 *
 *   clientWidth      — the box in 640x360 authoring px (what we draw in)
 *   rect.width       — the same box in CSS px after the stage transform
 *   rect.width * dpr — the same box in device px (what the backing store needs)
 *
 * The previous revision sized the backing store from `rect.width * dpr` but
 * set the drawing transform from `dpr` alone, so the drawing filled only
 * `1/k` of the canvas: a ~340x100 dark strip pinned to the top-left of the
 * ivory slab, which is exactly what `docs/screenshots/42b-sphere-grid.png`
 * caught. `viewScale` below is that missing `k`, and it is also what pointer
 * deltas have to be divided by for a drag to track the cursor.
 *
 * Nothing here reaches outside the canvas: the ivory captions, the S.Lv
 * header and the sphere pouch are `SphereGridPanel`'s DOM, so they get real
 * ink-on-paper contrast instead of the near-white overlay the old header
 * used.
 */

import {
  GRID_INK,
  LINKS,
  NODES,
  NODE_BY_ID,
  neighboursOf,
  nodeColor,
  nodeLabel,
  type GridNode,
} from './sphereGridData.ts';
import type { SphereGridModel } from './sphereGridModel.ts';
import { tooltipLines } from './sphereGridCaption.ts';
import { STRIP_H, drawHighlights, drawLockPlate, drawStrip } from './sphereGridDraw.ts';
import { drawGround, drawRoute, drawRouteLabels, drawToken, drawTooltip, type RouteDraw } from './sphereGridPaint.ts';

/** Zoom at which a node's label is worth drawing at all. */
const LABEL_ZOOM = 0.28;
/**
 * Opening zoom. Node spacing is ~43 grid units, so this puts neighbours ~25
 * authoring px (~62 device px at 1600x900) apart. It was 0.45 on the old
 * 835x225 strip; option B's grid is 1040x569 at 1600x900 and its target opens
 * at 0.58 (the readout in option-b-layout.jpg), so the labels read at a glance.
 */
export const DEFAULT_ZOOM = 0.58;
const MIN_ZOOM = 0.06;
const MAX_ZOOM = 1.8;

export interface SphereGridViewHandlers {
  /** Pointer moved onto (or off) a node. */
  onHover?(node: GridNode | null): void;
  /** Cursor landed on a node — keyboard or click. */
  onSelect?(node: GridNode): void;
  /** The player asked to act on the cursor node (move onto it, or activate it). */
  onAct?(nodeId: number): void;
}

interface LabelBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export class SphereGridView {
  readonly el: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  /** Null under a canvas-less test DOM (jsdom has no 2D backend); render() then no-ops. */
  private readonly ctx: CanvasRenderingContext2D | null;

  private model: SphereGridModel | null = null;
  private memberId = '';
  private handlers: SphereGridViewHandlers = {};

  /** Pan in authoring px, zoom in authoring px per grid unit. */
  private pan = { x: 0, y: 0 };
  private zoom = DEFAULT_ZOOM;
  /** Authoring px per... see the file header. Recomputed on every resize. */
  private viewScale = 1;
  private w = 1;
  private h = 1;

  private cursorId: number | null = null;
  private hoverId: number | null = null;
  private pointer: { x: number; y: number } | null = null;
  private dragging = false;
  private dragMoved = false;
  private lastPointer = { x: 0, y: 0 };

  private ro: ResizeObserver | null = null;
  private raf = 0;
  private clock = 0;

  /** The controls line along the canvas's bottom edge; the panel keeps it in step with its walk mode. */
  hint = 'WHEEL ZOOM  ·  DRAG PAN  ·  CLICK A NODE';
  /** Nodes AUTO-LEARN just activated: ringed, one tagged NEW (option C). The panel sets and clears it. */
  highlights: ReadonlySet<number> = new Set();
  /** Option B: the walk to the selected node, drawn under the cursor ring. The panel sets and clears it. */
  route: RouteDraw | null = null;
  /** False on the phone page, which prints its legend and controls in the page (option B). */
  private strip = true;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffxprep-sg__canvas';
    this.canvas = document.createElement('canvas');
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', 'Sphere Grid');
    this.el.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.wire();
  }

  setHandlers(handlers: SphereGridViewHandlers): void {
    this.handlers = handlers;
  }

  mount(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.el);
    }
    this.resize();
    this.startLoop();
  }

  unmount(): void {
    this.ro?.disconnect();
    this.ro = null;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /** Point the view at a character, recentring on wherever they stand. */
  show(model: SphereGridModel, memberId: string): void {
    const first = this.model === null;
    this.model = model;
    this.memberId = memberId;
    const grid = model.gridFor(memberId);
    this.cursorId = grid?.position ?? null;
    // Switching characters keeps whatever zoom the player set — except from a
    // view so far out that no label renders, where the new character would
    // arrive as an unreadable speck. Then the tab opens them at its own zoom.
    if (first || this.zoom < LABEL_ZOOM) this.zoom = DEFAULT_ZOOM;
    if (grid) this.centreOn(grid.position);
    this.render();
  }

  get cursorNode(): GridNode | null {
    return this.cursorId === null ? null : (NODE_BY_ID.get(this.cursorId) ?? null);
  }

  /**
   * True while the canvas itself holds keyboard focus. The panel treats that
   * as "the player is working the grid" and takes Enter/Esc, so a click on a
   * node followed by Enter activates the node instead of falling through to
   * the shell and starting the battle.
   */
  get focused(): boolean {
    return typeof document !== 'undefined' && document.activeElement === this.canvas;
  }

  /** Hand keyboard focus back to the page, so the shell's keys work again. */
  blur(): void {
    if (this.focused) this.canvas.blur();
  }

  /** The node under the pointer, or null. The ivory caption follows this first. */
  get hoverNode(): GridNode | null {
    return this.hoverId === null ? null : (NODE_BY_ID.get(this.hoverId) ?? null);
  }

  // ------------------------------------------------------------ viewport

  /**
   * Size the backing store to real device pixels and set the drawing
   * transform so one unit is one authoring px. See the file header for why
   * `viewScale` is not just `devicePixelRatio`.
   */
  private resize(): void {
    const rect = this.el.getBoundingClientRect();
    // `--sg-unit` (option B's phone page): the page there is not a scaled
    // 640x360 board, so one drawing unit is made that many CSS px to keep the
    // grid's type and nodes at the size they have on the desktop.
    const css = typeof getComputedStyle === 'function' ? getComputedStyle(this.el) : null;
    const unit = Math.max(1, Number.parseFloat(css?.getPropertyValue('--sg-unit') ?? '') || 1);
    this.strip = (css?.getPropertyValue('--sg-strip') ?? '').trim() !== '0';
    const cssW = (this.el.clientWidth || 334) / unit;
    const cssH = (this.el.clientHeight || 90) / unit;
    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    // Under a hidden tab or a canvas-less test DOM the rect collapses to 0;
    // fall back to 1:1 rather than dividing by zero.
    this.viewScale = rect.width > 0 ? (rect.width / cssW) * dpr : dpr;
    this.w = cssW;
    this.h = cssH;
    this.canvas.width = Math.max(1, Math.round(cssW * this.viewScale));
    this.canvas.height = Math.max(1, Math.round(cssH * this.viewScale));
    this.ctx?.setTransform(this.viewScale, 0, 0, this.viewScale, 0, 0);
    this.render();
  }

  /**
   * Frame a node — then slide up to 45% of a half-viewport toward the local
   * centre of mass. Tidus stands at node 121, the far tip of his own cluster,
   * so centring on him exactly opened with half the canvas empty space; the
   * bias fills the frame with grid while keeping him near the middle.
   */
  /** Height of the canvas's bottom strip, 0 where the page carries it instead. */
  private get stripH(): number {
    return this.strip ? STRIP_H : 0;
  }

  centreOn(nodeId: number): void {
    const node = NODE_BY_ID.get(nodeId);
    if (!node) return;
    const usableH = this.h - this.stripH;
    const rx = this.w / (2 * this.zoom);
    const ry = usableH / (2 * this.zoom);
    let sumX = 0;
    let sumY = 0;
    let n = 0;
    for (const other of NODES) {
      if (Math.abs(other.x - node.x) > rx * 1.6 || Math.abs(other.y - node.y) > ry * 1.6) continue;
      sumX += other.x;
      sumY += other.y;
      n++;
    }
    let cx = node.x;
    let cy = node.y;
    if (n > 3) {
      cx += Math.max(-rx * 0.45, Math.min(rx * 0.45, sumX / n - node.x));
      cy += Math.max(-ry * 0.45, Math.min(ry * 0.45, sumY / n - node.y));
    }
    this.pan = { x: this.w / 2 - cx * this.zoom, y: usableH / 2 - cy * this.zoom };
  }

  setZoom(z: number): void {
    this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
  }

  /** Zoom about a point in authoring px (the cursor, or the canvas centre). */
  zoomAbout(factor: number, px: number, py: number): void {
    const before = this.zoom;
    this.setZoom(before * factor);
    const k = this.zoom / before;
    this.pan.x = px - (px - this.pan.x) * k;
    this.pan.y = py - (py - this.pan.y) * k;
    this.render();
  }

  /**
   * The +/- controls and the shoulder buttons zoom about the cursor node when
   * it is on screen (so the character you are reading stays put), and about
   * the canvas centre otherwise.
   */
  zoomBy(factor: number): void {
    const node = this.cursorNode;
    if (node) {
      const px = this.pan.x + node.x * this.zoom;
      const py = this.pan.y + node.y * this.zoom;
      if (px >= 0 && px <= this.w && py >= 0 && py <= this.h - this.stripH) {
        this.zoomAbout(factor, px, py);
        return;
      }
    }
    this.zoomAbout(factor, this.w / 2, (this.h - this.stripH) / 2);
  }

  /** Keep the cursor node on screen after a keyboard move. */
  private keepCursorVisible(): void {
    const node = this.cursorNode;
    if (!node) return;
    const sx = this.pan.x + node.x * this.zoom;
    const sy = this.pan.y + node.y * this.zoom;
    const m = 22;
    if (sx < m) this.pan.x += m - sx;
    if (sx > this.w - m) this.pan.x -= sx - (this.w - m);
    if (sy < m) this.pan.y += m - sy;
    if (sy > this.h - m) this.pan.y -= sy - (this.h - m);
  }

  // ----------------------------------------------------------- navigation

  /**
   * Walk the cursor to the linked node that lies most nearly in `(dx, dy)`.
   * Links, not screen proximity: the grid is a graph, and hopping to a node
   * you cannot reach would make the keyboard lie about what Enter will do.
   */
  moveCursor(dx: number, dy: number): boolean {
    const from = this.cursorNode;
    if (!from) return false;
    // Option B: Enter walks and activates wherever the cursor is, and the card
    // says what that costs first, so the cursor steps on along links from
    // itself (fb-0929 had kept it beside the character, where Enter could act).
    const candidates = neighboursOf(from.id);
    let best: GridNode | null = null;
    let bestScore = -Infinity;
    for (const id of candidates) {
      const node = NODE_BY_ID.get(id);
      if (!node) continue;
      const vx = node.x - from.x;
      const vy = node.y - from.y;
      const len = Math.hypot(vx, vy) || 1;
      const dot = (vx / len) * dx + (vy / len) * dy;
      if (dot <= 0.25) continue; // not meaningfully in that direction
      const score = dot - len / 4000;
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    }
    if (!best) return false;
    this.cursorId = best.id;
    this.keepCursorVisible();
    this.handlers.onSelect?.(best);
    this.render();
    return true;
  }

  setCursor(nodeId: number): void {
    if (!NODE_BY_ID.has(nodeId)) return;
    this.cursorId = nodeId;
    this.keepCursorVisible();
    const node = NODE_BY_ID.get(nodeId)!;
    this.handlers.onSelect?.(node);
    this.render();
  }

  /**
   * Re-centre on the character and drop the cursor back onto them. CENTRE is
   * also the way out of being lost: from a zoom too far out to render a single
   * label it restores the opening zoom, and from a readable one it keeps
   * whatever the player chose.
   */
  recentre(): void {
    const grid = this.model?.gridFor(this.memberId);
    if (!grid) return;
    this.cursorId = grid.position;
    if (this.zoom < LABEL_ZOOM) this.zoom = DEFAULT_ZOOM;
    this.centreOn(grid.position);
    this.render();
  }

  // ------------------------------------------------------------- pointer

  /** Pointer position in authoring px, relative to the canvas box. */
  private toLocal(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const k = rect.width > 0 ? this.w / rect.width : 1;
    return { x: (e.clientX - rect.left) * k, y: (e.clientY - rect.top) * k };
  }

  /** The node under a point in authoring px, or null. */
  private nodeAt(px: number, py: number, slop = 3): GridNode | null {
    const gx = (px - this.pan.x) / this.zoom;
    const gy = (py - this.pan.y) / this.zoom;
    const grab = this.nodeRadius() / this.zoom + slop / this.zoom;
    let best: GridNode | null = null;
    let bestD = grab;
    for (const node of NODES) {
      const d = Math.hypot(node.x - gx, node.y - gy);
      if (d < bestD) {
        bestD = d;
        best = node;
      }
    }
    return best;
  }

  private wire(): void {
    const canvas = this.canvas;

    canvas.addEventListener('pointerdown', (e) => {
      canvas.focus({ preventScroll: true });
      this.dragging = true;
      this.dragMoved = false;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    });

    canvas.addEventListener('pointermove', (e) => {
      const local = this.toLocal(e);
      this.pointer = local;
      if (this.dragging) {
        const rect = canvas.getBoundingClientRect();
        const k = rect.width > 0 ? this.w / rect.width : 1;
        const dx = (e.clientX - this.lastPointer.x) * k;
        const dy = (e.clientY - this.lastPointer.y) * k;
        if (Math.abs(dx) + Math.abs(dy) > 0.4) this.dragMoved = true;
        this.pan.x += dx;
        this.pan.y += dy;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        this.render();
        return;
      }
      const hit = this.nodeAt(local.x, local.y);
      const id = hit?.id ?? null;
      if (id !== this.hoverId) {
        this.hoverId = id;
        this.handlers.onHover?.(hit);
        canvas.style.cursor = hit ? 'pointer' : 'grab';
        this.render();
      }
    });

    const release = (e: PointerEvent): void => {
      if (!this.dragging) return;
      this.dragging = false;
      canvas.style.cursor = 'grab';
      if (this.dragMoved) return;
      // A click that did not drag is a selection — and a second click on the
      // node already under the cursor is the action (move onto it, activate
      // it, or open it), which is also what Enter does.
      const local = this.toLocal(e);
      // A fingertip is wider than a cursor: a touch gets a wider catch.
      const hit = this.nodeAt(local.x, local.y, e.pointerType === 'touch' ? 8 : 3);
      if (!hit) return;
      if (hit.id === this.cursorId) this.handlers.onAct?.(hit.id);
      else this.setCursor(hit.id);
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', () => {
      this.dragging = false;
      canvas.style.cursor = 'grab';
    });
    canvas.addEventListener('pointerleave', () => {
      this.pointer = null;
      if (this.hoverId !== null) {
        this.hoverId = null;
        this.handlers.onHover?.(null);
      }
      this.render();
    });

    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const local = this.toLocal(e);
        this.zoomAbout(e.deltaY < 0 ? 1.12 : 1 / 1.12, local.x, local.y);
      },
      { passive: false },
    );

    canvas.addEventListener('dblclick', (e) => e.preventDefault());
  }

  // -------------------------------------------------------------- drawing

  private startLoop(): void {
    const tick = (t: number): void => {
      this.raf = requestAnimationFrame(tick);
      this.clock = t;
      // Only the reachable-node pulse animates; skip the work entirely while
      // another tab is showing (`hidden` on the panel container).
      if (this.el.offsetParent === null && this.el.clientWidth === 0) return;
      this.render();
    };
    if (typeof requestAnimationFrame !== 'undefined') this.raf = requestAnimationFrame(tick);
  }

  /** Node radius in authoring px, a 10 px circle at the default zoom [§5.4]. */
  private nodeRadius(): number {
    return Math.max(2.1, Math.min(9.5, 10.5 * this.zoom));
  }

  render(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { w, h } = this;
    const model = this.model;

    ctx.setTransform(this.viewScale, 0, 0, this.viewScale, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawGround(ctx, w, h, this.pan, this.zoom);
    if (!model) return;

    const grid = model.gridFor(this.memberId);
    const r = this.nodeRadius();
    const pad = 120;
    const gx0 = (-this.pan.x) / this.zoom - pad;
    const gx1 = (w - this.pan.x) / this.zoom + pad;
    const gy0 = (-this.pan.y) / this.zoom - pad;
    const gy1 = (h - this.pan.y) / this.zoom + pad;
    const visible = (n: GridNode): boolean => n.x >= gx0 && n.x <= gx1 && n.y >= gy0 && n.y <= gy1;
    const sx = (n: GridNode): number => this.pan.x + n.x * this.zoom;
    const sy = (n: GridNode): number => this.pan.y + n.y * this.zoom;

    const activated = grid?.activated ?? new Set<number>();
    const reachable = new Set(this.memberId ? model.reachable(this.memberId) : []);
    const pulse = 0.5 + 0.5 * Math.sin(this.clock / 159); // ~1 Hz [§5.4]

    // ---- links
    ctx.lineCap = 'round';
    for (const link of LINKS) {
      const a = NODE_BY_ID.get(link.a);
      const b = NODE_BY_ID.get(link.b);
      if (!a || !b || (!visible(a) && !visible(b))) continue;
      const travelled = activated.has(a.id) && activated.has(b.id);
      const onPath = grid !== null && (a.id === grid.position || b.id === grid.position);
      ctx.strokeStyle = travelled ? GRID_INK.travelledLink : onPath ? GRID_INK.reachableB : GRID_INK.untravelledLink;
      ctx.globalAlpha = travelled ? 0.95 : onPath ? 0.55 + 0.45 * pulse : 0.9;
      ctx.lineWidth = travelled || onPath ? Math.max(0.7, r * 0.3) : Math.max(0.5, r * 0.2);
      ctx.beginPath();
      ctx.moveTo(sx(a), sy(a));
      ctx.lineTo(sx(b), sy(b));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ---- nodes
    const labels: LabelBox[] = [];
    const drawLabels = this.zoom >= LABEL_ZOOM;
    const fontPx = Math.max(3.4, Math.min(5.4, r * 0.82));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const node of NODES) {
      if (!visible(node)) continue;
      const x = sx(node);
      const y = sy(node);
      const lit = activated.has(node.id);
      const open = node.kind === 'lock' && model.unlocked.has(node.id);
      const color = nodeColor(node);

      if (lit) {
        // A soft bloom so an activated cluster reads as a lit constellation
        // rather than a field of identical dots.
        const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
        glow.addColorStop(0, `${color}66`);
        glow.addColorStop(1, `${color}00`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (node.kind === 'lock' && !open) drawLockPlate(ctx, x, y, r, color);
      else {
        ctx.beginPath();
        // An opened lock is an empty node now [ffx-combat-core §10.1], and is drawn as one.
        const bare = node.kind === 'empty' || open;
        ctx.arc(x, y, bare ? r * 0.55 : r, 0, Math.PI * 2);
        ctx.fillStyle = lit ? color : GRID_INK.dormantFill;
        ctx.fill();
        // Dormant nodes keep a ring in their own colour: the grid has to be
        // readable before it is walked, not only after.
        ctx.lineWidth = Math.max(0.5, r * 0.18);
        ctx.strokeStyle = lit ? (grid?.tint ?? GRID_INK.paper) : bare ? GRID_INK.dormantRing : color;
        ctx.globalAlpha = lit ? 1 : bare ? 0.7 : 0.62;
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (lit && r > 3.2) {
          // 2 px inner dot on an activated node [§5.4].
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0.8, r * 0.26), 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      }

      if (reachable.has(node.id)) {
        ctx.beginPath();
        ctx.arc(x, y, r * 1.6, 0, Math.PI * 2);
        ctx.strokeStyle = pulse > 0.5 ? GRID_INK.reachableA : GRID_INK.reachableB;
        ctx.lineWidth = Math.max(0.6, r * 0.2);
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      if (drawLabels) {
        // The character's own token sits on their node and would cover its
        // label; the tooltip and the ivory caption both name it instead.
        if (grid && node.id === grid.position) continue;
        const label = nodeLabel(node, open);
        if (!label) continue;
        ctx.font = `700 ${fontPx.toFixed(2)}px "Chakra Petch", "Bahnschrift", sans-serif`;
        const tw = ctx.measureText(label).width;
        const ly = y + r + fontPx * 0.9;
        const box: LabelBox = { x0: x - tw / 2 - 1, y0: ly - fontPx * 0.6, x1: x + tw / 2 + 1, y1: ly + fontPx * 0.6 };
        if (box.x1 < -4 || box.x0 > w + 4 || box.y1 < -4 || box.y0 > h + 4) continue;
        // Drop a label rather than let two overlap into mush.
        if (labels.some((o) => box.x0 < o.x1 && box.x1 > o.x0 && box.y0 < o.y1 && box.y1 > o.y0)) continue;
        labels.push(box);
        ctx.lineWidth = Math.max(1.2, fontPx * 0.5);
        ctx.strokeStyle = 'rgba(8,16,30,0.95)';
        ctx.lineJoin = 'round';
        ctx.strokeText(label, x, ly);
        ctx.fillStyle = lit ? color : 'rgba(244,241,232,0.82)';
        ctx.fillText(label, x, ly);
      }
    }

    const at = (id: number): { x: number; y: number } | null => {
      const n = NODE_BY_ID.get(id);
      return n ? { x: sx(n), y: sy(n) } : null;
    };
    // ---- option B: the walk to the selected node, under the tokens
    if (this.route) drawRoute(ctx, this.route, grid ? at(grid.position) : null, at, r);

    // ---- everybody's position chips, selected character last and largest
    const redraw = (): void => this.render();
    for (const other of model.all()) {
      if (other.memberId === this.memberId) continue;
      const node = NODE_BY_ID.get(other.position);
      if (!node || !visible(node)) continue;
      drawToken(ctx, sx(node), sy(node), Math.max(4, Math.min(8, r * 1.1)), other.memberId, other.tint, false, redraw);
    }
    if (grid) {
      const node = NODE_BY_ID.get(grid.position);
      if (node && visible(node)) {
        drawToken(ctx, sx(node), sy(node), Math.max(6, Math.min(11, r * 1.5)), grid.memberId, GRID_INK.travelledLink, true, redraw);
      }
    }

    // ---- cursor ring
    const cursor = this.cursorNode;
    if (cursor && visible(cursor)) {
      const x = sx(cursor);
      const y = sy(cursor);
      ctx.beginPath();
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = GRID_INK.paper;
      ctx.lineWidth = Math.max(0.7, r * 0.2);
      ctx.setLineDash([r * 0.9, r * 0.6]);
      ctx.lineDashOffset = -this.clock / 90;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.route) drawRouteLabels(ctx, this.route, at, w, h, r);
    drawHighlights(ctx, this.highlights, at, w, h, r, this.clock, grid?.position ?? null);
    // The tooltip follows the pointer; with no pointer on a node it names the
    // node the character stands on (option B's picture), since the card beside
    // the grid already describes the selected one.
    const tipId = this.hoverId ?? grid?.position ?? null;
    const tipNode = tipId === null ? null : NODE_BY_ID.get(tipId);
    if (tipNode) {
      const anchor = this.hoverId !== null && this.pointer ? this.pointer : { x: sx(tipNode), y: sy(tipNode) };
      drawTooltip(ctx, w, h, tipNode, anchor, tooltipLines(model, this.memberId, tipNode), this.stripH);
    }
    if (this.strip) drawStrip(ctx, w, h, this.zoom, this.hint);
  }
}
