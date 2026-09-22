/**
 * One `PairWarp` per adjacent pair of yaw keys, built on first use from the
 * rig's landmarks (`keys[].landmarks`, order `artMeta.commonLandmarkOrder`)
 * and its fixed points (`artMeta.v3.warp`: a frame far outside the canvas
 * and pins at the shoulders), plus the two per-frame vertex buffers the
 * renderer hands to `LayerGL.beginLayers`. A rig without landmarks (the
 * stand-in) gets null and the renderer falls back to the plain mix.
 */
import type { Rig, RigKey } from '../rig.ts';
import { PairWarp, type Pt } from './mesh.ts';

interface WarpMeta {
  frame: Pt[];
  pins: Pt[];
}

function readWarpMeta(rig: Rig): WarpMeta | null {
  const w = (rig.artMeta as { v3?: { warp?: WarpMeta } } | undefined)?.v3?.warp;
  return w && Array.isArray(w.frame) && Array.isArray(w.pins) ? w : null;
}

export interface PairFrame {
  /** Key A's mesh: its own landmarks -> the interpolated ones. */
  a: Float32Array;
  /** Key B's mesh: its own landmarks -> the same interpolated ones. */
  b: Float32Array;
}

export class WarpCache {
  private readonly fixed: Pt[] | null;
  private readonly pairs = new Map<string, { warp: PairWarp; bufA?: Float32Array; bufB?: Float32Array } | null>();

  constructor(rig: Rig) {
    const meta = readWarpMeta(rig);
    this.fixed = meta ? [...meta.frame, ...meta.pins] : null;
  }

  /** The two meshes for keys a, b at blend weight t (0 = a, 1 = b); null when the rig cannot warp this pair. */
  frame(a: RigKey, b: RigKey, t: number): PairFrame | null {
    const key = `${a.id}|${b.id}`;
    let entry = this.pairs.get(key);
    if (entry === undefined) {
      entry = null;
      const la = a.landmarks;
      const lb = b.landmarks;
      if (this.fixed && la && lb && la.length === lb.length && la.length >= 3) {
        try {
          entry = { warp: new PairWarp(la, lb, this.fixed) };
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[living-portrait] no mesh warp for ${key}:`, err);
        }
      }
      this.pairs.set(key, entry);
    }
    if (!entry) return null;
    const dst = entry.warp.target(t);
    entry.bufA = entry.warp.vertexData(entry.warp.source('a'), dst, entry.bufA);
    entry.bufB = entry.warp.vertexData(entry.warp.source('b'), dst, entry.bufB);
    return { a: entry.bufA, b: entry.bufB };
  }
}
