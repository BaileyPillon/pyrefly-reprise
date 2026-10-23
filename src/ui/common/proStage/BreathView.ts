/**
 * THE HELD BREATH, THE DRAWING (lane "pro-staging"; the plan is `engine/pro/staging/BreathPlan.ts`, which says what each layer's strength is at an instant; this file only draws it). One 2D canvas under the HUD
 * (the wash, the flood, the windows cut for the figures that keep their colour, the motes flowing into the boss, the core, the flash) at half the frame's size (everything on it is light and soft), and two crisp DOM
 * pieces on the floor under the boss (the ring and the move's small name).
 *
 * Game case (rule 14): FFX is ivory, ice-blue and gold; FFX-2 is pearl, lilac and pink (`PALETTE`). Pure drawing: it reads rectangles it is handed and never touches the stage.
 */
import { windowOf, type BreathFrame, type ClearWindow, type Rect } from '../../../engine/pro/staging/BreathPlan.ts';

export interface BreathPalette {
  washTop: string;
  washBottom: string;
  /** The wash's alpha at full drain. */
  veil: number;
  flood: string;
  floodEdge: string;
  mote: string;
  core: string;
  coreEdge: string;
  rim: string;
}

export const PALETTE: Readonly<Record<'ffx' | 'ffx2', BreathPalette>> = Object.freeze({
  ffx: { washTop: '#f1f4ff', washBottom: '#cfd9f6', veil: 0.8, flood: '255,255,255', floodEdge: '214,226,255', mote: '255,236,176', core: '255,250,226', coreEdge: '255,214,120', rim: '236,244,255' },
  ffx2: { washTop: '#f8ecfa', washBottom: '#e2cdee', veil: 0.8, flood: '255,250,255', floodEdge: '246,214,244', mote: '255,196,226', core: '255,246,252', coreEdge: '255,150,205', rim: '255,238,250' },
});

/** What the view needs of the stage this frame: the boss, its companions that keep colour, the party. All CSS pixels in the layer's own frame. */
export interface BreathGeom {
  w: number;
  h: number;
  attacker: Rect | null;
  /** The attacker's chest (the core, the flood's centre) and its feet (the ring's centre). */
  chest: { x: number; y: number } | null;
  feet: { x: number; y: number } | null;
  /** Figures that keep their colour with the attacker (Seymour on Mortiorchis). */
  companions: readonly Rect[];
  party: readonly Rect[];
}

/** The motes: a fixed scatter around the boss, each with its own distance, delay and size, so the inflow is the same every time. */
const MOTES = (() => {
  let s = 20261023;
  const rnd = (): number => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  return Array.from({ length: 34 }, () => ({ a: rnd() * Math.PI * 2, r: 0.38 + rnd() * 0.95, d: rnd() * 0.45, s: 0.6 + rnd() * 1.5 }));
})();

const ease = (x: number): number => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export class BreathView {
  private readonly cv: HTMLCanvasElement;
  private readonly cx: CanvasRenderingContext2D | null;
  private readonly mark: HTMLElement;
  private readonly ringO: HTMLElement;
  private readonly ringI: HTMLElement;
  private readonly name: HTMLElement;
  private cw = 0;
  private ch = 0;
  private dirty = false;

  constructor(private readonly host: HTMLElement) {
    const doc = host.ownerDocument;
    this.cv = doc.createElement('canvas');
    this.cv.className = 'pst__cv';
    this.cx = this.cv.getContext('2d');
    this.mark = doc.createElement('div');
    this.mark.className = 'pst__mark';
    this.ringO = doc.createElement('div');
    this.ringO.className = 'pst__ring pst__ring--o';
    this.ringI = doc.createElement('div');
    this.ringI.className = 'pst__ring pst__ring--i';
    this.name = doc.createElement('div');
    this.name.className = 'pst__name';
    this.mark.append(this.ringO, this.ringI, this.name);
    host.append(this.cv, this.mark);
  }

  /** The text under the boss. */
  setName(text: string): void {
    this.name.textContent = text;
  }

  private fit(w: number, h: number): void {
    const cw = Math.max(320, Math.round(w / 2));
    const ch = Math.max(180, Math.round(h / 2));
    if (cw !== this.cw || ch !== this.ch) {
      this.cw = cw;
      this.ch = ch;
      this.cv.width = cw;
      this.cv.height = ch;
    }
  }

  /** Draw one frame. `game` skins it. */
  draw(f: BreathFrame, g: BreathGeom, game: 'ffx' | 'ffx2', drift: boolean): void {
    const ctx = this.cx;
    this.placeMark(f, g);
    if (!ctx) return;
    this.fit(g.w, g.h);
    const sx = this.cw / Math.max(1, g.w);
    const sy = this.ch / Math.max(1, g.h);
    const pal = PALETTE[game];
    const W = this.cw;
    const H = this.ch;
    const any = f.drain > 0.002 || f.core > 0.002 || f.flash > 0.002 || f.flood > 0.002 || (f.inflow > 0 && f.inflow < 1 && f.drain > 0.002);
    if (!any && !this.dirty) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    this.dirty = any;
    if (!any) return;

    // the wash
    if (f.drain > 0.002) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, pal.washTop);
      grad.addColorStop(1, pal.washBottom);
      ctx.globalAlpha = Math.min(1, f.drain * pal.veil);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    // Mega Flare's flood: a bright bloom out of the chest, cut with the party's windows below like the wash
    const chest = g.chest ? { x: g.chest.x * sx, y: g.chest.y * sy } : null;
    if (f.flood > 0.002 && chest) {
      const R = Math.hypot(W, H) * (0.18 + 0.95 * ease(f.flood * 1.2));
      const fg = ctx.createRadialGradient(chest.x, chest.y, 0, chest.x, chest.y, R);
      fg.addColorStop(0, `rgba(${pal.flood},${Math.min(0.8, f.flood * 0.82)})`);
      fg.addColorStop(0.55, `rgba(${pal.floodEdge},${Math.min(0.62, f.flood * 0.62)})`); // the boss stays a ghost in it, never gone
      fg.addColorStop(1, `rgba(${pal.floodEdge},${f.flood * 0.4})`);
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }
    // the windows: the figures that keep their colour (the attacker's closes as the flood takes it)
    const windows: ClearWindow[] = [];
    for (const r of g.party) windows.push(windowOf(r));
    const keep = 1 - Math.min(1, f.flood * 1.4);
    if (keep > 0.02) {
      if (g.attacker) windows.push(windowOf(g.attacker, keep));
      for (const r of g.companions) windows.push(windowOf(r, keep));
    }
    ctx.globalCompositeOperation = 'destination-out';
    for (const w of windows) this.pool(ctx, w, sx, sy, 0.5, 1);
    ctx.globalCompositeOperation = 'lighter';
    // a rim of light at the edge of the party's pools while the flood or the wash is up: the figures are lit by it
    const rim = Math.max(f.flood * 0.3, f.drain * 0.14);
    if (rim > 0.01) {
      for (const r of g.party) {
        const w = windowOf(r, 1.04);
        const cxp = w.cx * sx;
        const cyp = w.cy * sy;
        ctx.save();
        ctx.translate(cxp, cyp);
        ctx.scale(1, (w.ry * sy) / (w.rx * sx));
        const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, w.rx * sx);
        rg.addColorStop(0.46, `rgba(${pal.rim},0)`);
        rg.addColorStop(0.7, `rgba(${pal.rim},${rim})`);
        rg.addColorStop(1, `rgba(${pal.rim},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(0, 0, w.rx * sx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    // the inflow: motes streaming into the chest
    if (chest && g.attacker && f.inflow > 0 && f.inflow < 1.001 && f.drain > 0.01) {
      const reach = g.attacker.w * sx;
      for (const m of MOTES) {
        const q = Math.min(1, Math.max(0, (f.inflow - m.d) / (1 - m.d)));
        if (q <= 0) continue;
        const pull = drift ? 1 - ease(q) : 0.0;
        const x = chest.x + Math.cos(m.a) * m.r * reach * (0.12 + 0.88 * pull);
        const y = chest.y + Math.sin(m.a) * m.r * reach * 0.62 * (0.12 + 0.88 * pull);
        const alpha = Math.sin(Math.PI * Math.min(1, q * 1.05)) * 0.95 * f.drain;
        if (alpha <= 0.01) continue;
        const rad = (2.2 + m.s * 3.2) * (W / 1280 + 0.35);
        const mg = ctx.createRadialGradient(x, y, 0, x, y, rad * 2.6);
        mg.addColorStop(0, `rgba(${pal.mote},${alpha})`);
        mg.addColorStop(0.35, `rgba(${pal.mote},${alpha * 0.45})`);
        mg.addColorStop(1, `rgba(${pal.mote},0)`);
        ctx.fillStyle = mg;
        ctx.fillRect(x - rad * 2.6, y - rad * 2.6, rad * 5.2, rad * 5.2);
      }
    }
    // the core, white-hot at the blow
    if (chest && g.attacker && f.core > 0.004) {
      const R = (0.05 + 0.1 * f.core) * Math.max(g.attacker.w, g.attacker.h) * sx;
      const cg = ctx.createRadialGradient(chest.x, chest.y, 0, chest.x, chest.y, R * 2.2);
      cg.addColorStop(0, `rgba(${pal.core},${Math.min(1, f.core * 1.1)})`);
      cg.addColorStop(0.25, `rgba(${pal.core},${f.core * 0.8})`);
      cg.addColorStop(0.6, `rgba(${pal.coreEdge},${f.core * 0.35})`);
      cg.addColorStop(1, `rgba(${pal.coreEdge},0)`);
      ctx.fillStyle = cg;
      ctx.fillRect(chest.x - R * 2.2, chest.y - R * 2.2, R * 4.4, R * 4.4);
    }
    // the flash at the blow: a white pop from the chest, never over the party's clear windows for long
    if (chest && f.flash > 0.004) {
      const R = Math.hypot(W, H) * (0.3 + 0.3 * (1 - f.flash));
      const fg = ctx.createRadialGradient(chest.x, chest.y, 0, chest.x, chest.y, R);
      fg.addColorStop(0, `rgba(255,255,255,${Math.min(1, f.flash)})`);
      fg.addColorStop(0.5, `rgba(${pal.core},${f.flash * 0.5})`);
      fg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /** One window's pool: an ellipse, clear in the middle (`soft` of its radius), falling to nothing at the edge. */
  private pool(ctx: CanvasRenderingContext2D, w: ClearWindow, sx: number, sy: number, soft: number, strength: number): void {
    const rx = w.rx * sx;
    ctx.save();
    ctx.translate(w.cx * sx, w.cy * sy);
    ctx.scale(1, (w.ry * sy) / rx);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, `rgba(0,0,0,${strength})`);
    gr.addColorStop(soft, `rgba(0,0,0,${strength})`);
    gr.addColorStop(soft + (1 - soft) * 0.5, `rgba(0,0,0,${strength * 0.42})`); // a long soft shoulder: the pool of colour falls away, it is not cut out
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** The ring and the name, at the boss's feet. */
  private placeMark(f: BreathFrame, g: BreathGeom): void {
    const m = this.mark;
    if (!g.feet || !g.attacker) {
      m.style.opacity = '0';
      return;
    }
    const rx = Math.max(60, g.attacker.w * 0.3);
    const ry = rx * 0.27;
    m.style.opacity = String(Math.max(f.name, f.ring) > 0.002 ? 1 : 0);
    m.style.transform = `translate(${g.feet.x.toFixed(1)}px, ${(g.feet.y - ry * 0.3).toFixed(1)}px)`;
    for (const r of [this.ringO, this.ringI]) {
      r.style.width = `${(rx * 2).toFixed(0)}px`;
      r.style.height = `${(ry * 2).toFixed(0)}px`;
    }
    this.name.style.top = `${(-ry * 1.2).toFixed(0)}px`;
    this.host.style.setProperty('--pst-ring', f.ring.toFixed(3));
    this.host.style.setProperty('--pst-ringscale', f.ringScale.toFixed(3));
    this.host.style.setProperty('--pst-name', f.name.toFixed(3));
  }

  /** Clear everything now. */
  reset(): void {
    this.cx?.clearRect(0, 0, this.cw, this.ch);
    this.dirty = false;
    this.mark.style.opacity = '0';
  }

  dispose(): void {
    this.cv.remove();
    this.mark.remove();
  }
}
