/**
 * How one painted key (or a dissolve of two) is composited, for `renderer.ts`.
 *
 *   frontal   hairBack, body, headCore, mouth patch, irises, lids, eye patch,
 *             brow patch, hairFront, strands, earring - each on its own motion
 *   yaw key   key.back (the whole head), body, key.front (the face and the
 *             hair over the body), its mouth patch, its own lid frame
 *             (`KeyLids`), its brow patch
 *   tassel    v4: the plate's earring drawn apart from every key, un-warped,
 *             at the ear's offset for the pose (`TasselDraw`): under the face
 *             (after the back halves) when the ear is turned away, over
 *             everything when it faces the camera, cross-faded between
 *
 * Every head layer goes through the head mesh (the key's landmarks onto the
 * pose's), every pinned layer through the body mesh (the chest and the
 * head's sway, never the yaw); with both null the layers are the plain placed
 * quads, which is how the rest pose stays the plate to the pixel.
 */
import type { RigKey } from './rig.ts';
import type { FrameBufferTarget } from './gl-utils.ts';
import type { LayerGL } from './gl-layer.ts';
import type { LoadedArt, Motion, Tex } from './layers.ts';
import type { EyeState, MouthPatch, BrowPatch } from './face.ts';
import type { Px } from './motion.ts';

export type KeyPart = 'all' | 'back' | 'front';

export interface FaceFrame {
  eyeState: EyeState;
  eyeAperture: number;
  mouth: MouthPatch;
  mouthWeight: number;
  brow: BrowPatch;
  browWeight: number;
}

export interface Motions {
  iris: Px;
  fringe: Px;
  strand1: Px;
  strand2: Px;
  earring: Px;
}

export interface Meshes {
  head: Float32Array | null;
  body: Float32Array | null;
}

/** v4: the plate's tassel for this pose (offset in plate px; `under`/`over` opacities). */
export interface TasselDraw {
  t: Tex;
  offset: Px;
  under: number;
  over: number;
}

/** Below this weight a key is not drawn at all (no faint crop ghost). */
export const KEY_EPS = 0.002;

/** Nearest lid frame to an aperture (frames sorted open to closed); null = the eye as painted. */
export function nearestLid<T extends { aperture: number }>(frames: readonly T[], aperture: number): T | null {
  let best: T | null = null;
  let bestD = 1 - Math.max(0, Math.min(1, aperture));
  for (const f of frames) {
    const d = Math.abs(f.aperture - aperture);
    if (d < bestD) {
      bestD = d;
      best = f;
    }
  }
  return best;
}

export class Composer {
  constructor(
    private readonly L: LayerGL,
    private readonly art: LoadedArt,
    private readonly bind: (t: FrameBufferTarget | null, clear: 'bg' | 'clear' | 'keep') => void,
  ) {}

  private drawFrontal(face: FaceFrame, m: Motions, gain: number, part: KeyPart): void {
    const art = this.art;
    const L = this.L;
    const offsetFor = (motion: Motion): Px => (motion === 'chest' || motion === 'head' ? [0, 0] : m[motion]);
    let behindBody = true;
    for (const { layer, t } of art.frontal) {
      if (art.tassel && layer.name === 'earring') continue; // v4: drawn by drawTassel, un-warped
      const pinned = layer.motion === 'chest';
      if (pinned) behindBody = false;
      if (part !== 'all' && (pinned || (part === 'back') !== behindBody)) continue;
      L.draw(t.tex, t.box, offsetFor(layer.motion), 1, pinned ? 1 : gain, pinned);
      if (layer.name === 'headCore' && face.mouth !== 'neutral' && face.mouthWeight > KEY_EPS) {
        const p = art.mouth.get(face.mouth);
        if (p) L.draw(p.tex, p.box, [0, 0], face.mouthWeight, gain);
      }
      if (layer.name === 'eyeApertureL') {
        // nearest lid frame: crisp lids, no cross-faded double lash line
        const best = nearestLid(art.eyes.map((e) => ({ aperture: e.state.aperture, t: e.t })), face.eyeAperture);
        if (best) L.draw(best.t.tex, best.t.box, [0, 0], 1, gain);
        if (face.brow !== 'neutral') {
          const p = art.brows.get(face.brow);
          if (p) L.draw(p.tex, p.box, [0, 0], face.browWeight, gain);
        }
      }
    }
  }

  /** The pinned body: the plate's own, or (`turned`) the one with the frontal tassel's footprint filled. */
  drawBody(turned: boolean): void {
    const art = this.art;
    const body = turned && art.bodyTurned ? art.bodyTurned : art.frontal.find((f) => f.layer.motion === 'chest')?.t;
    if (body) this.L.draw(body.tex, body.box, [0, 0], 1, 1, true);
  }

  /** v4: the plate's tassel, un-warped, at the pose's ear offset (`which` of its two opacities). */
  drawTassel(td: TasselDraw | null, which: 'under' | 'over', gain: number): void {
    const w = td ? td[which] : 0;
    if (!td || w <= KEY_EPS) return;
    this.L.beginLayers(null, null);
    this.L.draw(td.t.tex, td.t.box, td.offset, w, gain);
  }

  /** One key's composite (`all`), or its head behind the body (`back`) or in front of it (`front`). */
  drawKey(key: RigKey, face: FaceFrame, m: Motions, gain: number, meshes: Meshes, part: KeyPart = 'all', td: TasselDraw | null = null): void {
    const L = this.L;
    L.beginLayers(meshes.head, meshes.body);
    if (key.id === 'frontal') {
      this.drawFrontal(face, m, gain, part);
      if (part === 'all') this.drawTassel(td, 'over', gain);
      return;
    }
    const k = this.art.keys.get(key.id);
    if (!k) return;
    if (part !== 'front') L.draw(k.back.tex, k.back.box, [0, 0], 1, gain);
    if (part === 'all') {
      this.drawTassel(td, 'under', gain);
      L.beginLayers(meshes.head, meshes.body);
      this.drawBody(true);
    }
    if (part === 'back') return;
    L.draw(k.front.tex, k.front.box, [0, 0], 1, gain);
    const kp = this.art.keyPatches.get(key.id);
    const mouth = face.mouth !== 'neutral' ? kp?.mouth.get(face.mouth) : undefined;
    if (mouth && face.mouthWeight > KEY_EPS) L.draw(mouth.tex, mouth.box, [0, 0], face.mouthWeight, gain);
    const lids = this.art.keyLids.get(key.id);
    if (lids) {
      const best = nearestLid(lids, face.eyeAperture);
      if (best) L.draw(best.t.tex, best.t.box, [0, 0], 1, gain);
    }
    const brow = face.brow !== 'neutral' ? kp?.brows.get(face.brow) : undefined;
    if (brow && face.browWeight > KEY_EPS) L.draw(brow.tex, brow.box, [0, 0], face.browWeight, gain);
    if (part === 'all') this.drawTassel(td, 'over', gain);
  }

  /**
   * The body between the two head halves of a dissolve: the plate's body and
   * the turned body, an exact premultiplied lerp at the turned keys' share of
   * the paint (both are the same pixels outside the tassel's footprint).
   */
  private drawBlendBody(turnedWeight: number, bodyMesh: Float32Array | null, targets: FrameBufferTarget[]): void {
    const [scene, ta, tb] = targets as [FrameBufferTarget, FrameBufferTarget, FrameBufferTarget];
    if (turnedWeight <= KEY_EPS || turnedWeight >= 1 - KEY_EPS || !this.art.bodyTurned) {
      this.bind(scene, 'keep');
      this.L.beginLayers(null, bodyMesh);
      this.drawBody(turnedWeight >= 0.5);
      return;
    }
    this.bind(ta, 'clear');
    this.L.beginLayers(null, bodyMesh);
    this.drawBody(false);
    this.bind(tb, 'clear');
    this.L.beginLayers(null, bodyMesh);
    this.drawBody(true);
    this.bind(scene, 'keep');
    this.L.mixUnion(ta.tex, tb.tex, turnedWeight, false);
  }

  /**
   * A dissolve between two keys already warped onto the same pose: back
   * halves, the body once, front halves; each pair mixed by coverage.
   */
  drawDissolve(from: RigKey, to: RigKey, w: number, mFrom: Meshes, mTo: Meshes, face: FaceFrame, m: Motions, gain: number, targets: FrameBufferTarget[], td: TasselDraw | null = null): void {
    const [scene, ta, tb] = targets as [FrameBufferTarget, FrameBufferTarget, FrameBufferTarget];
    const turned = (from.id !== 'frontal' ? 1 - w : 0) + (to.id !== 'frontal' ? w : 0);
    this.bind(scene, 'bg');
    for (const part of ['back', 'front'] as const) {
      this.bind(ta, 'clear');
      this.drawKey(from, face, m, gain, mFrom, part);
      this.bind(tb, 'clear');
      this.drawKey(to, face, m, gain, mTo, part);
      this.bind(scene, 'keep');
      this.L.mixUnion(ta.tex, tb.tex, w);
      if (part === 'back') {
        this.drawTassel(td, 'under', gain);
        this.drawBlendBody(turned, mTo.body, targets);
      }
    }
    this.drawTassel(td, 'over', gain);
  }
}

export type { Tex };
