import { DataTexture, LinearFilter, RGBAFormat, UnsignedByteType, type Texture } from 'three';

/**
 * The MAX mix (D-316), BREATHING's rig for one painting (LIVING PAINTINGS; both games), ported from option
 * A's prototype (`fx/max/a/livingRig.ts`), the runtime path and the chest band alone: no hair, cloth or
 * part springs (not in the mix), and no derived files on disk. A rig is a small weight map over the
 * painting's uv (R = the chest band that breathes) plus landmarks (hip, chest and head heights and the
 * body's core column, uv, y up), read once per texture from the painting's alpha through a 2D canvas.
 * The approved PNG is never changed. Game case: both (plumbing).
 */

export interface BreathRig {
  map: Texture;
  /** hip, chest, head, core (uv; y up). */
  land: [number, number, number, number];
  source: 'runtime' | 'flat';
}

const GW = 32;
const GH = 48;

let flatRig: BreathRig | null = null;
/** A rig that moves nothing (a texture that cannot be read). */
export function flatBreathRig(): BreathRig {
  if (!flatRig) {
    const t = new DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1, RGBAFormat, UnsignedByteType);
    t.needsUpdate = true;
    flatRig = { map: t, land: [0.45, 0.68, 0.84, 0.5], source: 'flat' };
  }
  return flatRig;
}

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/**
 * The chest band and the landmarks from an alpha field (`alpha[y * GW + x]`, rows bottom-up, 0..1).
 * Pure, so the unit tests run it on a synthetic figure.
 */
export function chestRig(alpha: Float32Array, gw = GW, gh = GH): { weights: Float32Array; land: [number, number, number, number] } | null {
  const rowSum = new Float32Array(gh);
  const rowMean = new Float32Array(gh);
  const rowHalf = new Float32Array(gh);
  let foot = -1;
  let top = -1;
  for (let y = 0; y < gh; y++) {
    let s = 0;
    let m = 0;
    let lo = gw;
    let hi = -1;
    for (let x = 0; x < gw; x++) {
      const a = alpha[y * gw + x]!;
      s += a;
      m += a * (x + 0.5);
      if (a > 0.3) {
        lo = Math.min(lo, x);
        hi = Math.max(hi, x);
      }
    }
    rowSum[y] = s;
    rowMean[y] = s > 0 ? m / s / gw : 0.5;
    rowHalf[y] = hi >= lo ? Math.max(1, hi - lo + 1) / 2 / gw : 0.05;
    if (s > 0.6) {
      if (foot < 0) foot = y;
      top = y;
    }
  }
  if (foot < 0 || top <= foot) return null;
  const fy = (foot + 0.5) / gh;
  const ty = (top + 0.5) / gh;
  const H = ty - fy;
  const hip = fy + 0.46 * H;
  const chest = fy + 0.68 * H;
  const head = fy + 0.84 * H;
  let cs = 0;
  let cm = 0;
  for (let y = 0; y < gh; y++) {
    const v = (y + 0.5) / gh;
    if (v < hip || v > head) continue;
    cs += rowSum[y]!;
    cm += rowSum[y]! * rowMean[y]!;
  }
  const core = cs > 0 ? cm / cs : 0.5;
  const weights = new Float32Array(gw * gh);
  for (let y = 0; y < gh; y++) {
    const v = (y + 0.5) / gh;
    const half = Math.max(0.04, rowHalf[y]!);
    for (let x = 0; x < gw; x++) {
      const u = (x + 0.5) / gw;
      const side = Math.abs(u - core) / half;
      weights[y * gw + x] = Math.exp(-(((v - chest) / (0.1 * H)) ** 2)) * (1 - smooth(0.55, 1.05, side)) * smooth(0.1, 0.5, alpha[y * gw + x]!);
    }
  }
  return { weights, land: [hip, chest, head, core] };
}

function readAlpha(img: CanvasImageSource): Float32Array | null {
  try {
    const c = document.createElement('canvas');
    c.width = GW;
    c.height = GH;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (!g) return null;
    g.drawImage(img, 0, 0, GW, GH);
    const px = g.getImageData(0, 0, GW, GH).data;
    const a = new Float32Array(GW * GH);
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) a[y * GW + x] = px[((GH - 1 - y) * GW + x) * 4 + 3]! / 255; // y up
    return a;
  } catch {
    return null;
  }
}

const cache = new Map<string, BreathRig>();

/** The rig for a painted texture (cached by the texture's uuid); the flat rig when it cannot be read. */
export function breathRigFor(tex: Texture): BreathRig {
  const hit = cache.get(tex.uuid);
  if (hit) return hit;
  const img = tex.image as (CanvasImageSource & { width?: number }) | null | undefined;
  if (!img || !img.width) return flatBreathRig(); // not decoded yet: ask again next frame
  const alpha = readAlpha(img);
  const r = alpha ? chestRig(alpha) : null;
  let rig = flatBreathRig();
  if (r) {
    const data = new Uint8Array(GW * GH * 4);
    for (let k = 0; k < GW * GH; k++) {
      data[k * 4] = Math.round(Math.min(1, r.weights[k]!) * 255);
      data[k * 4 + 3] = 255;
    }
    const map = new DataTexture(data, GW, GH, RGBAFormat, UnsignedByteType);
    map.minFilter = LinearFilter;
    map.magFilter = LinearFilter;
    map.needsUpdate = true;
    rig = { map, land: r.land, source: 'runtime' };
  }
  cache.set(tex.uuid, rig);
  return rig;
}

/** Forget the cache (a battle ended; the rig textures go with it). */
export function releaseBreathRigs(): void {
  for (const r of cache.values()) if (r.source === 'runtime') r.map.dispose();
  cache.clear();
}
