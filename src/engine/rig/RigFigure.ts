/**
 * A rig's part meshes: textures, geometry that is re-skinned every frame, and the plane group that follows the idle plane.
 *
 * The group `plane` is what makes the rig draw where the painting would: each frame it copies the carrier's idle plane mesh (position, rotation, scale: the stance
 * registration, the mirror, a KO's topple, a prone lay), so a part mesh's coordinates are the painting's own, normalised (-0.5..0.5). Parts are children of the
 * carrier's `inner` group, so the stage's motion moves them with the plane's.
 *
 * Depth: the renderer sorts transparent meshes by the depth of their geometry's bounding-sphere centre, then by creation order. Every part's centre is pinned to the
 * plane's centre and its `position.z` steps by `LAYER_DZ` in draw order, so the parts sort among themselves by `order` and against other actors' planes as the plane did.
 *
 * **Format v2 (2026-10-18).** A part has one or more LOOKS: its own image and mesh, and one per variant (a variant with no mesh of its own shares the part's geometry). `setPartState` (a state from
 * `RigPartState.ts`) makes a part hidden (its mesh is not drawn and `skin()` does not touch it) or swaps the look the part's material and mesh show. A figure with no v2 field has one look a part,
 * shown, and does exactly what it did.
 */
import {
  BufferAttribute,
  BufferGeometry,
  DataTexture,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  RGBAFormat,
  SRGBColorSpace,
  Sphere,
  TextureLoader,
  Vector2,
  Vector3,
  type Camera,
  type PerspectiveCamera,
  type ShaderMaterial,
  type WebGLRenderer,
  type Texture,
} from 'three';
import { syncPaintedBloom } from '../BloomMask.ts';
import type { RigData, RigPartData, RigVariantData } from './RigData.ts';
import { HIDDEN, OWN, restState } from './RigPartState.ts';
import { advanceFades, applyOpacity, beginFade, endFade, pointGhost, type GhostEnv, type Look, type PartRt } from './RigGhost.ts'; // `?motion=demo`: a part's image swap cross-fades instead of flipping (format v2.1 `fadeMs`)
import { makePartMaterial, setPartTexel } from './RigMaterial.ts';
import { RigSkeleton } from './RigSkeleton.ts';
import { idleSlot, type CarrierInternals } from './RigCarrier.ts';
import { rigFileUrl, type RigScale, type RigTextures } from './RigTier.ts';

/** World-z step between draw-order layers: far below anything that reorders two actors, far above double precision's sort noise. */
export const LAYER_DZ = 0.002;

const configure = (t: Texture, mips: boolean): Texture => {
  t.colorSpace = SRGBColorSpace;
  t.magFilter = LinearFilter;
  t.minFilter = mips ? LinearMipmapLinearFilter : LinearFilter;
  t.generateMipmaps = mips;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
};

export class RigFigure {
  /** Follows the idle plane. Add it to the carrier's `inner`. */
  readonly plane = new Group();
  readonly skeleton: RigSkeleton;
  private readonly parts: PartRt[] = [];
  private white: DataTexture | null = null;
  private texelSeen = 0;
  /** The scales the textures are at now (`RigTier.ts`). */
  private scales: RigTextures = { map: 2, rim: 2 };
  /** The camera and the drawing buffer's height as of the last draw: what the magnification of the idle's texel is measured with (`view`). */
  private seen: { camera: PerspectiveCamera; height: number } | null = null;
  private readonly bufferSize = new Vector2();

  private constructor(readonly data: RigData, private readonly carrier: CarrierInternals) {
    this.skeleton = new RigSkeleton(data);
    this.plane.name = `rig-${data.name}`;
    this.ghostEnv = { carrier, plane: this.plane, white: () => this.whiteMask(), texel: () => this.texelSeen };
  }

  /**
   * Fetch every texture under `base` (a URL folder, no trailing slash) at the scales `textures` names (`RigTier.ts`: the maps at 2x or 1x, the rim masks at 1x when a twin exists) and build the
   * meshes. Rejects when a texture does not load.
   */
  static async load(data: RigData, base: string, carrier: CarrierInternals, loadTexture?: (url: string) => Promise<Texture>, textures: RigTextures = { map: 2, rim: 2 }): Promise<RigFigure> {
    const fig = new RigFigure(data, carrier);
    fig.scales = { ...textures };
    const fetchTex = loadTexture ?? fig.defaultFetch();
    const need = data.parts.map(async (p) => ({
      p,
      images: await Promise.all(
        [p, ...p.variants].map(async (src) => ({
          src,
          map: configure(await fetchTex(rigFileUrl(base, src.png, textures.map)), true),
          rim: src.rimMode === 'mask' && src.rim ? configure(await fetchTex(rigFileUrl(base, src.rim, textures.rim)), true) : null,
        })),
      ),
    }));
    const loaded = await Promise.all(need);
    fig.build(loaded);
    return fig;
  }

  private defaultFetch(): (url: string) => Promise<Texture> {
    const loader = new TextureLoader();
    return (url) => loader.loadAsync(url);
  }

  /** The scale the part maps are at now. */
  get mapScale(): RigScale {
    return this.scales.map;
  }

  /** The camera and drawing-buffer height of the last draw (null before the first one), for the magnification of the idle's texel. */
  get view(): { camera: PerspectiveCamera; height: number } | null {
    return this.seen;
  }

  /**
   * Swap every part's map to the other scale, in place: all the new textures load first, then each material takes its new map and the old one is disposed, so the figure never draws half of one
   * and half of the other and a failed load changes nothing. Rejects when a texture does not load.
   */
  async swapMaps(base: string, scale: RigScale, loadTexture?: (url: string) => Promise<Texture>): Promise<void> {
    if (scale === this.scales.map) return;
    const fetchTex = loadTexture ?? this.defaultFetch();
    const fresh = await Promise.all(this.parts.map(async (p) => Promise.all(p.looks.map(async (l) => configure(await fetchTex(rigFileUrl(base, l.src.png, scale)), true)))));
    if (this.parts.length !== fresh.length) {
      for (const t of fresh.flat()) t.dispose(); // the figure went while the textures were on their way
      return;
    }
    this.parts.forEach((p, i) => {
      p.looks.forEach((l, j) => {
        const old = l.map;
        l.map = fresh[i]![j]!;
        old.dispose();
      });
      p.material.uniforms['map']!.value = this.lookOf(p).map;
      if (p.ghost && p.fade?.from) p.ghost.material.uniforms['map']!.value = p.fade.from.map;
    });
    this.scales = { ...this.scales, map: scale };
  }

  /** The 1 x 1 white mask a part without one binds (its `rimOn` is 0, so the sample is never used). */
  private whiteMask(): DataTexture {
    if (!this.white) {
      this.white = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat);
      this.white.needsUpdate = true;
    }
    return this.white;
  }

  private build(loaded: Array<{ p: RigPartData; images: Array<{ src: RigPartData | RigVariantData; map: Texture; rim: Texture | null }> }>): void {
    const slot = idleSlot(this.carrier);
    const rimK = this.rimTexelK();
    this.texelSeen = rimK;
    const renderOrder = slot.mesh.renderOrder;
    const centre = new Sphere(new Vector3(0, 0, 0), 1);
    const rest = restState(this.data);
    loaded.forEach(({ p, images }, layer) => {
      const geos = new Map<Float32Array, { geo: BufferGeometry; pos: Float32Array }>(); // a variant with the part's own mesh shares its geometry
      const looks: Look[] = images.map(({ src, map, rim }) => {
        let g = geos.get(src.verts);
        if (!g) {
          const n = src.verts.length / 2;
          const geo = new BufferGeometry();
          const pos = new Float32Array(n * 3);
          const attr = new BufferAttribute(pos, 3);
          attr.setUsage(35048); // DynamicDrawUsage
          geo.setAttribute('position', attr);
          geo.setAttribute('uv', new BufferAttribute(src.uvs, 2));
          geo.setIndex(new BufferAttribute(src.triangles, 1));
          geo.boundingSphere = centre.clone();
          g = { geo, pos };
          geos.set(src.verts, g);
        }
        return { src, geo: g.geo, pos: g.pos, map, rim };
      });
      const own = looks[0]!;
      const material = makePartMaterial({
        shared: this.carrier.u,
        contactBand: slot.material.uniforms['contactBand']!,
        map: own.map,
        rimMask: own.rim ?? this.whiteMask(),
        rimMode: p.rimMode,
        boxW: p.box[2],
        boxH: p.box[3],
        rimTexelK: rimK,
      });
      const mesh = new Mesh(own.geo, material);
      mesh.name = p.name;
      mesh.frustumCulled = false;
      mesh.renderOrder = renderOrder;
      mesh.position.z = p.order * LAYER_DZ;
      if (layer === 0) {
        mesh.onBeforeRender = (renderer: WebGLRenderer, scene, camera: Camera): void => {
          if (!scene) return;
          this.carrier.noteViewCamera(camera);
          if ((camera as PerspectiveCamera).isPerspectiveCamera) this.seen = { camera: camera as PerspectiveCamera, height: renderer.getDrawingBufferSize(this.bufferSize).y };
        };
      }
      mesh.visible = rest[layer] !== HIDDEN;
      this.plane.add(mesh);
      this.parts.push({ data: p, mesh, material, looks, state: rest[layer]!, fade: null, ghost: null, kIn: 1, kOut: 0 });
    });
    this.carrier.inner.add(this.plane);
    this.sync();
    this.skin();
  }

  /** The look a part shows now (a hidden part: its own). */
  private lookOf(p: PartRt): Look {
    return p.looks[p.state >= 0 ? p.state + 1 : 0]!;
  }

  /**
   * Show, hide and swap parts to the state `s` (`RigPartState.ts`, one number a part in `data.parts` order). Cheap when nothing changed; a change is a few assignments, once. The caller skins after it
   * (`RigActor.compose` does), because a part that was hidden has not been skinned since it went.
   *
   * `fadeMs` over 0 (`?motion=demo`, `RigFade.ts`): the change CROSS-FADES instead of flipping. The look that goes out stays on the part's ghost mesh while the new one comes up on its own, and
   * {@link advanceFades} runs it; 0 (the default) is the flip, exactly as v2.0.
   */
  setPartState(s: Int16Array, fadeMs = 0): void {
    this.parts.forEach((p, i) => {
      const v = s[i] ?? OWN;
      if (v === p.state) return;
      const was = p.state === HIDDEN ? null : this.lookOf(p);
      p.state = v;
      if (fadeMs > 0) beginFade(this.ghostEnv, p, was, fadeMs);
      else endFade(p);
      if (v === HIDDEN) {
        p.mesh.visible = false;
        return;
      }
      const l = this.lookOf(p);
      const u = p.material.uniforms;
      p.mesh.geometry = l.geo;
      u['map']!.value = l.map;
      u['rimMask']!.value = l.rim ?? this.whiteMask();
      u['rimOn']!.value = l.src.rimMode === 'mask' ? 1 : 0;
      u['rimGain']!.value = l.src.rimMode === 'off' ? 0 : 1;
      setPartTexel(p.material, this.texelSeen, l.src.box[2], l.src.box[3]);
      p.mesh.visible = this.plane.visible;
    });
  }

  /** Move every running cross-fade on by `ms` of REAL time (a hit-stop never freezes a half-mixed pair of images). Call it before {@link setOpacity}. */
  advanceFades(ms: number): void {
    advanceFades(this.parts, ms);
  }

  /** What the ghost meshes need of this figure. */
  private readonly ghostEnv: GhostEnv;

  /** True while any part is cross-fading (for the tests and `rigInfo`). */
  get fading(): boolean {
    return this.parts.some((p) => p.fade !== null);
  }

  /** The state the parts are in now (a copy), for the tests and `rigInfo`. */
  partState(): Int16Array {
    return Int16Array.from(this.parts, (p) => p.state);
  }

  /** Painting px per texel of the texture the game binds for the idle plane: the rim's width is measured in those. */
  private rimTexelK(): number {
    const u = idleSlot(this.carrier).material.uniforms['texel']!.value as Vector2;
    const gameTexW = 1 / Math.max(1e-6, u.x);
    return this.data.image.w / gameTexW;
  }

  /** Follow the idle plane (call every frame, after the actor's own update has placed it) and keep the rim width in step with the tier the game binds. */
  sync(): void {
    const m = idleSlot(this.carrier).mesh;
    this.plane.position.copy(m.position);
    this.plane.quaternion.copy(m.quaternion);
    this.plane.scale.copy(m.scale);
    const k = this.rimTexelK();
    if (Math.abs(k - this.texelSeen) > 1e-6) {
      this.texelSeen = k;
      for (const p of this.parts) {
        const box = this.lookOf(p).src.box;
        setPartTexel(p.material, k, box[2], box[3]);
        if (p.ghost && p.fade?.from) pointGhost(this.ghostEnv, p.ghost, p.fade.from);
      }
    }
  }

  /** Put the parts at their draw orders, with a key's overrides (`RigKey.layers`) on top; null restores each part's own `order`. */
  setLayers(layers: Readonly<Record<string, number>> | null): void {
    for (const p of this.parts) p.mesh.position.z = (layers?.[p.data.name] ?? p.data.order) * LAYER_DZ;
  }

  /** Move the vertices of every part that is drawn through the skeleton's current pose (a hidden part costs nothing). */
  skin(): void {
    for (const p of this.parts) {
      const out = p.fade?.from;
      if (out && (p.state === HIDDEN || out.geo !== this.lookOf(p).geo)) {
        this.skeleton.skin(out.src, out.pos); // the look going out is posed too (its own mesh, when it has one)
        (out.geo.getAttribute('position') as BufferAttribute).needsUpdate = true;
      }
      if (p.state === HIDDEN) continue;
      const l = this.lookOf(p);
      this.skeleton.skin(l.src, l.pos);
      (l.geo.getAttribute('position') as BufferAttribute).needsUpdate = true;
    }
  }

  /** The actor's alpha onto every part (the shader multiplies it into the painting's own). */
  setOpacity(alpha: number, visible: boolean): void {
    const on = visible && alpha > 0.001;
    applyOpacity(this.parts, alpha, on);
    this.plane.visible = on;
  }

  /** The parts' blending follows the actor's (`BloomMask.syncPaintedBloom`): the bloom mask while whole, plain blending while dissolving or when the scene does not mask the figure. */
  syncBloom(dissolving: boolean, masked: boolean): void {
    for (const p of this.parts) {
      syncPaintedBloom(p.material, dissolving, masked);
      if (p.ghost) syncPaintedBloom(p.ghost.material, dissolving, masked);
    }
  }

  /** The parts' materials in draw order (the tests read the shared cells through them). */
  get materials(): ShaderMaterial[] {
    return this.parts.map((p) => p.material);
  }

  get partCount(): number {
    return this.parts.length;
  }

  get vertexCount(): number {
    return this.parts.reduce((n, p) => n + p.data.verts.length / 2, 0);
  }

  dispose(): void {
    for (const p of this.parts) {
      for (const geo of new Set(p.looks.map((l) => l.geo))) geo.dispose();
      p.material.dispose();
      p.ghost?.material.dispose();
      for (const l of p.looks) {
        l.map.dispose();
        l.rim?.dispose();
      }
    }
    this.white?.dispose();
    this.parts.length = 0;
    this.plane.removeFromParent();
  }
}
