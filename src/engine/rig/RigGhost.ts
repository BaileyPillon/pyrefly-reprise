/**
 * THE GHOST MESH OF A RIG'S CROSS-FADE (format v2.1; `?motion=demo`; decision 153a; both games). `RigFade.ts` has the timing and the shape (pure); this file has the part of it that touches
 * meshes: the runtime record of a part (`PartRt`), the second mesh that keeps the look going out while the new one comes up, and the per-frame opacity of the two. Split out of
 * `RigFigure.ts` to keep that file under 400 lines.
 *
 * A part's ghost is made the first time a fade needs it. It is a second mesh and material that SHARE the actor's uniform cells by reference (as the part's own material does, `RigMaterial.ts`), so a
 * flash, a tint, a dim or a dissolve on the actor reaches the look going out exactly as it reaches the look coming in. It sits {@link GHOST_DZ} behind the part in z, so the new look draws over it.
 */
import { Mesh, type BufferGeometry, type DataTexture, type Group, type ShaderMaterial, type Texture } from 'three';
import type { RigPartData, RigVariantData } from './RigData.ts';
import { fadePair } from './RigFade.ts';
import { makePartMaterial, setPartTexel } from './RigMaterial.ts';
import { idleSlot, type CarrierInternals } from './RigCarrier.ts';
import { HIDDEN } from './RigPartState.ts';

/** One image of a part with its mesh: the part's own (index 0) or a variant's. */
export interface Look {
  src: RigPartData | RigVariantData;
  geo: BufferGeometry;
  pos: Float32Array;
  map: Texture;
  rim: Texture | null;
}

export interface PartRt {
  data: RigPartData;
  mesh: Mesh;
  material: ShaderMaterial;
  /** `looks[0]` is the part's own, `looks[i + 1]` is `data.variants[i]`. */
  looks: Look[];
  /** The part's state: `HIDDEN`, `OWN`, or the index of the variant shown. */
  state: number;
  /** A cross-fade in flight: the look going out (null: the part was hidden), how far along (0 to 1) and how long (ms). The look coming in is the part's own `state` (none when it is going hidden). */
  fade: { from: Look | null; t: number; ms: number } | null;
  /** The second mesh the outgoing look is drawn on during a fade; made the first time one is needed. */
  ghost: { mesh: Mesh; material: ShaderMaterial } | null;
  /** The share of the actor's opacity the part's own mesh and the ghost show now (1 and 0 with no fade). */
  kIn: number;
  kOut: number;
}

/** The ghost sits this far behind its part in z, so the new look draws over the old one (`LAYER_DZ` is 0.002). */
export const GHOST_DZ = 0.0004;

/** What a fade needs of the figure that owns the parts. */
export interface GhostEnv {
  carrier: CarrierInternals;
  plane: Group;
  white(): DataTexture;
  texel(): number;
}

/** The ghost: a second mesh and material with the part's own uniform cells shared by reference. */
function makeGhost(env: GhostEnv, p: PartRt): { mesh: Mesh; material: ShaderMaterial } {
  const own = p.looks[0]!;
  const slot = idleSlot(env.carrier);
  const material = makePartMaterial({
    shared: env.carrier.u,
    contactBand: slot.material.uniforms['contactBand']!,
    map: own.map,
    rimMask: env.white(),
    rimMode: 'off',
    boxW: p.data.box[2],
    boxH: p.data.box[3],
    rimTexelK: env.texel(),
  });
  const mesh = new Mesh(own.geo, material);
  mesh.name = `${p.data.name}~ghost`;
  mesh.frustumCulled = false;
  mesh.renderOrder = p.mesh.renderOrder;
  mesh.visible = false;
  env.plane.add(mesh);
  return { mesh, material };
}

/** Point a ghost at the look going out. */
export function pointGhost(env: GhostEnv, g: { mesh: Mesh; material: ShaderMaterial }, from: Look): void {
  const u = g.material.uniforms;
  g.mesh.geometry = from.geo;
  u['map']!.value = from.map;
  u['rimMask']!.value = from.rim ?? env.white();
  u['rimOn']!.value = from.src.rimMode === 'mask' ? 1 : 0;
  u['rimGain']!.value = from.src.rimMode === 'off' ? 0 : 1;
  setPartTexel(g.material, env.texel(), from.src.box[2], from.src.box[3]);
}

export function endFade(p: PartRt): void {
  p.fade = null;
  p.kIn = 1;
  p.kOut = 0;
  if (p.ghost) p.ghost.mesh.visible = false;
}

/** Start a cross-fade on `p` out of `was` (the look it showed; null when it was hidden). A fade already running hands over the look that is stronger now. */
export function beginFade(env: GhostEnv, p: PartRt, was: Look | null, ms: number): void {
  const from = p.fade && p.kOut > p.kIn ? p.fade.from : was;
  if (!from) {
    endFade(p);
    p.fade = { from: null, t: 0, ms };
    p.kIn = 0;
    p.kOut = 0;
    return;
  }
  const g = (p.ghost ??= makeGhost(env, p));
  pointGhost(env, g, from);
  p.fade = { from, t: 0, ms };
  p.kIn = 0;
  p.kOut = 1;
}

/** Move every running cross-fade on by `ms` of REAL time (a hit-stop never freezes a half-mixed pair of images). */
export function advanceFades(parts: readonly PartRt[], ms: number): void {
  for (const p of parts) {
    const f = p.fade;
    if (!f) continue;
    f.t += ms > 0 && Number.isFinite(ms) ? ms / f.ms : 0;
    if (f.t >= 1) {
      endFade(p);
      continue;
    }
    const k = fadePair(f.t);
    p.kIn = k.inn;
    p.kOut = f.from ? k.out : 0;
  }
}

/** The actor's opacity onto every part and its ghost: the part's own mesh shows `alpha * kIn`, the ghost `alpha * kOut` (nothing at all outside a fade). */
export function applyOpacity(parts: readonly PartRt[], alpha: number, on: boolean): void {
  for (const p of parts) {
    p.material.uniforms['opacity']!.value = alpha * p.kIn;
    p.mesh.visible = on && p.state !== HIDDEN && p.kIn > 0.001;
    const g = p.ghost;
    if (g) {
      const ghosting = p.fade !== null && p.fade.from !== null && p.kOut > 0.001;
      g.material.uniforms['opacity']!.value = alpha * p.kOut;
      g.mesh.visible = on && ghosting;
      if (ghosting) g.mesh.position.z = p.mesh.position.z - GHOST_DZ;
    }
  }
}
