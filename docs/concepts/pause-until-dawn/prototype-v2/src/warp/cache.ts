/**
 * One `PairWarp` per adjacent pair of yaw keys (and one per key paired with
 * itself, for a pose that sits on a key but has moved: idle sway, chest),
 * built on first use from the rig's landmarks (`keys[].landmarks`, order
 * `artMeta.commonLandmarkOrder`) and its fixed points (`artMeta.v3.warp`: a
 * frame far outside the canvas and pins at the shoulders), plus the vertex
 * buffers the renderer hands to `LayerGL.setMeshes`. A rig without landmarks
 * (the stand-in) gets null and the renderer falls back to plain quads.
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

/** Where the geometry is this frame: the bracket, the blend, and the two rigid carriers. */
export interface WarpPose {
  a: RigKey;
  /** null: the pose sits on `a` alone. */
  b: RigKey | null;
  /** Shape blend from a to b, 0..1. */
  g: number;
  /** Plate px added to every landmark: the chest plus the head's own idle sway. */
  head: Pt;
  /** Plate px added to the frame and the shoulder pins. */
  chest: Pt;
}

interface Entry {
  warp: PairWarp;
  bufs: Map<string, Float32Array>;
}

export class WarpCache {
  private readonly fixed: Pt[] | null;
  private readonly pairs = new Map<string, Entry | null>();

  constructor(rig: Rig) {
    const meta = readWarpMeta(rig);
    this.fixed = meta ? [...meta.frame, ...meta.pins] : null;
  }

  private entry(a: RigKey, b: RigKey): Entry | null {
    const key = `${a.id}|${b.id}`;
    let entry = this.pairs.get(key);
    if (entry === undefined) {
      entry = null;
      const la = a.landmarks;
      const lb = b.landmarks;
      if (this.fixed && la && lb && la.length === lb.length && la.length >= 3) {
        try {
          entry = { warp: new PairWarp(la, lb, this.fixed), bufs: new Map() };
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[living-portrait] no mesh warp for ${key}:`, err);
        }
      }
      this.pairs.set(key, entry);
    }
    return entry;
  }

  /** The two meshes for keys a, b at blend weight t (0 = a, 1 = b); null when the rig cannot warp this pair. */
  frame(a: RigKey, b: RigKey, t: number): PairFrame | null {
    const pa = this.keyMesh(a, { a, b, g: t, head: [0, 0], chest: [0, 0] });
    const pb = this.keyMesh(b, { a, b, g: t, head: [0, 0], chest: [0, 0] });
    return pa && pb ? { a: pa, b: pb } : null;
  }

  /**
   * `key`'s painting warped onto the pose's geometry: its own landmarks ->
   * the bracket's interpolated landmarks + `head`, the fixed points + `chest`.
   * Null when `key` is not one of the pose's bracket keys (its landmarks
   * would need a topology this cache never tested for folds) or the rig has
   * no landmarks.
   */
  keyMesh(key: RigKey, pose: WarpPose): Float32Array | null {
    const b = pose.b ?? pose.a;
    if (key.id !== pose.a.id && key.id !== b.id) return null;
    const e = this.entry(pose.a, b);
    if (!e) return null;
    const which = key.id === pose.a.id ? 'a' : 'b';
    const tag = `k:${which}`;
    const buf = e.warp.vertexData(e.warp.source(which), e.warp.posed(pose.b ? pose.g : 0, pose.head, pose.chest), e.bufs.get(tag));
    e.bufs.set(tag, buf);
    return buf;
  }

  /**
   * The pinned body's mesh: the rest (frontal) landmarks carried only by
   * `head` - never by the yaw geometry, so the collar and shoulders stay put
   * while the head turns - and the fixed points by `chest`. The neck under
   * the jaw therefore follows the head's sway instead of sliding under it.
   */
  bodyMesh(frontal: RigKey, pose: WarpPose): Float32Array | null {
    const e = this.entry(frontal, frontal);
    if (!e) return null;
    const buf = e.warp.vertexData(e.warp.source('a'), e.warp.posed(0, pose.head, pose.chest), e.bufs.get('body'));
    e.bufs.set('body', buf);
    return buf;
  }
}
