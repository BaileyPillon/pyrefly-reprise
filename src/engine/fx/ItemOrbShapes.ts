/**
 * The three shapes of the item orb's light (`ItemOrbFx.ts`): a soft round glow (white centre falling off to nothing), a thin ring and a four-point star, 64 px each, drawn once in a 2D canvas (no file is loaded).
 * Null where there is no 2D canvas (a unit test). Also the tiny deterministic generator the burst's directions come from: the same every time.
 */
import { CanvasTexture, LinearFilter, SRGBColorSpace, type Texture } from 'three';

export type Shape = 'glow' | 'ring' | 'star';

/** A soft round glow (white centre falling off to nothing), a thin ring and a four-point star, 64 px each. Null where there is no 2D canvas (a unit test). */
export function paintShape(kind: Shape): Texture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  if (kind === 'glow') {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,255,1)');
    r.addColorStop(0.3, 'rgba(255,255,255,0.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  } else if (kind === 'ring') {
    const r = g.createRadialGradient(32, 32, 20, 32, 32, 31);
    r.addColorStop(0, 'rgba(255,255,255,0)');
    r.addColorStop(0.55, 'rgba(255,255,255,0.9)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  } else {
    g.translate(32, 32);
    const arm = (len: number, w: number): void => {
      const gr = g.createLinearGradient(-len, 0, len, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(-len, -w / 2, len * 2, w);
    };
    arm(31, 5);
    g.rotate(Math.PI / 2);
    arm(31, 5);
    const core = g.createRadialGradient(0, 0, 0, 0, 0, 12);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = core;
    g.fillRect(-16, -16, 32, 32);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.minFilter = LinearFilter;
  return t;
}

/** A tiny deterministic generator (the burst's directions): the same every time. */
export function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
