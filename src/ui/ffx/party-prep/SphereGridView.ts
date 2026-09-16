import type { SphereGridState } from '../../../battle/common/types.ts';
import gridData from '../../../data/ffx/sphere-grid/standard-grid.json';

interface GridNode {
  id: number;
  x: number;
  y: number;
  kind: 'empty' | 'lock' | 'ability' | 'stat';
  stat: string | null;
  name: string;
  links: number[];
}
interface GridLink {
  a: number;
  b: number;
}
interface GridData {
  nodes: GridNode[];
  links: GridLink[];
}

const GRID = gridData as unknown as GridData;

/** research/visual-bible.md §5.4 "SPHERE GRID tab" node stat colours. */
const STAT_COLOR: Record<string, string> = {
  maxHp: '#7ee8b0',
  maxMp: '#8fd0f0',
  str: '#f28a6a',
  def: '#c8d4e4',
  mag: '#b48fe0',
  mdef: '#8fa4bc',
  agi: '#f2d24a',
  luck: '#fff0a8',
  accuracy: '#f2d24a',
  evasion: '#c8d4e4',
};
const ABILITY_COLOR = '#f2c21e';
const LOCK_COLOR = '#c7343c';
const LOCKED_RING = '#4e5a70';
const TRAVELLED_LINK = '#f2c21e';
const UNTRAVELLED_LINK = '#3a4456';

function nodeColor(node: GridNode): string {
  if (node.kind === 'ability') return ABILITY_COLOR;
  if (node.kind === 'lock') return LOCK_COLOR;
  if (node.kind === 'stat' && node.stat) return STAT_COLOR[node.stat] ?? '#9fc4e8';
  return '#4e5a70';
}

/**
 * Read-only pan/zoom Sphere Grid viewer [visual-bible §5.4]: a starfield
 * background, 860 nodes coloured by stat, activated-node highlighting for
 * whichever character is selected, and the character's current-position
 * token. Panning/zooming is the only interaction — activating nodes is out of
 * scope for a read-only viewer.
 */
export class SphereGridView {
  readonly el: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  /** Null under a canvas-less test DOM (jsdom has no 2D backend); render() then no-ops. */
  private readonly ctx: CanvasRenderingContext2D | null;
  private state: SphereGridState | null = null;
  private characterName = '';
  private pan = { x: 0, y: 0 };
  private zoom = 1;
  private fitted = false;
  private dragging = false;
  private lastPointer = { x: 0, y: 0 };
  private ro: ResizeObserver | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ffxhud-win ffxprep-grid';
    this.canvas = document.createElement('canvas');
    const header = document.createElement('div');
    header.className = 'ffxprep-grid__header';
    header.dataset['role'] = 'header';
    this.el.append(this.canvas, header);
    this.ctx = this.canvas.getContext('2d');
    this.wireInteraction();
  }

  mount(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(this.el);
    }
    this.resize();
  }

  unmount(): void {
    this.ro?.disconnect();
    this.ro = null;
  }

  show(state: SphereGridState, characterName: string): void {
    this.state = state;
    this.characterName = characterName;
    if (!this.fitted) this.fitToContent();
    this.render();
  }

  private resize(): void {
    const rect = this.el.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round((rect.width || 452) * dpr));
    this.canvas.height = Math.max(1, Math.round((rect.height || 248) * dpr));
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!this.fitted) this.fitToContent();
    this.render();
  }

  private fitToContent(): void {
    const xs = GRID.nodes.map((n) => n.x);
    const ys = GRID.nodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = this.el.clientWidth || 452;
    const h = this.el.clientHeight || 248;
    const scale = Math.min(w / (maxX - minX + 200), h / (maxY - minY + 200));
    this.zoom = scale > 0 && Number.isFinite(scale) ? scale : 0.1;
    this.pan = { x: w / 2 - ((minX + maxX) / 2) * this.zoom, y: h / 2 - ((minY + maxY) / 2) * this.zoom };
    this.fitted = true;
  }

  private wireInteraction(): void {
    this.canvas.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.canvas.setPointerCapture(e.pointerId);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.pan.x += e.clientX - this.lastPointer.x;
      this.pan.y += e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.render();
    });
    const stop = (): void => {
      this.dragging = false;
    };
    this.canvas.addEventListener('pointerup', stop);
    this.canvas.addEventListener('pointerleave', stop);
    this.canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        this.zoom = Math.max(0.02, Math.min(3, this.zoom * factor));
        this.render();
      },
      { passive: false },
    );
  }

  private render(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const w = this.el.clientWidth || 452;
    const h = this.el.clientHeight || 248;
    ctx.fillStyle = '#08101e';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    // deterministic starfield
    ctx.fillStyle = '#2e3a56';
    for (let i = 0; i < 80; i++) {
      const sx = (i * 97) % w;
      const sy = (i * 53) % h;
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.translate(this.pan.x, this.pan.y);
    ctx.scale(this.zoom, this.zoom);

    const activated = new Set(this.state?.activatedNodeIds.map(Number) ?? []);
    const byId = new Map(GRID.nodes.map((n) => [n.id, n]));

    ctx.lineWidth = 2 / this.zoom;
    for (const link of GRID.links) {
      const a = byId.get(link.a);
      const b = byId.get(link.b);
      if (!a || !b) continue;
      const travelled = activated.has(a.id) && activated.has(b.id);
      ctx.strokeStyle = travelled ? TRAVELLED_LINK : UNTRAVELLED_LINK;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    const r = 5 / this.zoom;
    for (const node of GRID.nodes) {
      const isActivated = activated.has(node.id);
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isActivated ? nodeColor(node) : '#141a28';
      ctx.fill();
      ctx.lineWidth = 1 / this.zoom;
      ctx.strokeStyle = isActivated ? '#ffffff' : LOCKED_RING;
      ctx.stroke();
    }

    const currentId = Number(this.state?.position);
    const current = byId.get(currentId);
    if (current) {
      ctx.beginPath();
      ctx.arc(current.x, current.y, r * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = '#f2c21e';
      ctx.lineWidth = 2 / this.zoom;
      ctx.stroke();
    }
    ctx.restore();

    const header = this.el.querySelector<HTMLElement>('[data-role="header"]');
    if (header) header.textContent = this.state ? `${this.characterName} — S.Lv ${this.state.sLv}` : '';
  }
}
