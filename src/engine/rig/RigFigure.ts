/**
 * A rig's part meshes: textures, geometry that is re-skinned every frame, and the plane group that follows the idle plane.
 *
 * The group `plane` is what makes the rig draw where the painting would: each frame it copies the carrier's idle plane mesh (position, rotation, scale: the stance
 * registration, the mirror, a KO's topple, a prone lay), so a part mesh's coordinates are the painting's own, normalised (-0.5..0.5). Parts are children of the
 * carrier's `inner` group, so the stage's motion moves them with the plane's.
 *
 * Depth: the renderer sorts transparent meshes by the depth of their geometry's bounding-sphere centre, then by creation order. Every part's centre is pinned to the
 * plane's centre and its `position.z` steps by `LAYER_DZ` in draw order, so the parts sort among themselves by `order` and against other actors' planes as the plane did.
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
  type ShaderMaterial,
  type Texture,
} from 'three';
import { syncPaintedBloom } from '../BloomMask.ts';
import type { RigData, RigPartData } from './RigData.ts';
import { makePartMaterial, setPartTexel } from './RigMaterial.ts';
import { RigSkeleton } from './RigSkeleton.ts';
import { idleSlot, type CarrierInternals } from './RigCarrier.ts';

/** World-z step between draw-order layers: far below anything that reorders two actors, far above double precision's sort noise. */
export const LAYER_DZ = 0.002;

interface PartRt {
  data: RigPartData;
  mesh: Mesh;
  geo: BufferGeometry;
  pos: Float32Array;
  material: ShaderMaterial;
  map: Texture;
  rim: Texture | null;
}

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

  private constructor(readonly data: RigData, private readonly carrier: CarrierInternals) {
    this.skeleton = new RigSkeleton(data);
    this.plane.name = `rig-${data.name}`;
  }

  /** Fetch every texture under `base` (a URL folder, no trailing slash) and build the meshes. Rejects when a texture does not load. */
  static async load(data: RigData, base: string, carrier: CarrierInternals, loadTexture?: (url: string) => Promise<Texture>): Promise<RigFigure> {
    const fig = new RigFigure(data, carrier);
    const loader = new TextureLoader();
    const fetchTex = loadTexture ?? ((url: string): Promise<Texture> => loader.loadAsync(url));
    const need = data.parts.map(async (p) => ({
      p,
      map: configure(await fetchTex(`${base}/${p.png}`), true),
      rim: p.rimMode === 'mask' && p.rim ? configure(await fetchTex(`${base}/${p.rim}`), true) : null,
    }));
    const loaded = await Promise.all(need);
    fig.build(loaded);
    return fig;
  }

  /** The 1 x 1 white mask a part without one binds (its `rimOn` is 0, so the sample is never used). */
  private whiteMask(): DataTexture {
    if (!this.white) {
      this.white = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat);
      this.white.needsUpdate = true;
    }
    return this.white;
  }

  private build(loaded: Array<{ p: RigPartData; map: Texture; rim: Texture | null }>): void {
    const slot = idleSlot(this.carrier);
    const rimK = this.rimTexelK();
    this.texelSeen = rimK;
    const renderOrder = slot.mesh.renderOrder;
    const centre = new Sphere(new Vector3(0, 0, 0), 1);
    loaded.forEach(({ p, map, rim }, layer) => {
      const n = p.verts.length / 2;
      const geo = new BufferGeometry();
      const pos = new Float32Array(n * 3);
      const attr = new BufferAttribute(pos, 3);
      attr.setUsage(35048); // DynamicDrawUsage
      geo.setAttribute('position', attr);
      geo.setAttribute('uv', new BufferAttribute(p.uvs, 2));
      geo.setIndex(new BufferAttribute(p.triangles, 1));
      geo.boundingSphere = centre.clone();
      const material = makePartMaterial({
        shared: this.carrier.u,
        contactBand: slot.material.uniforms['contactBand']!,
        map,
        rimMask: rim ?? this.whiteMask(),
        rimMode: p.rimMode,
        boxW: p.box[2],
        boxH: p.box[3],
        rimTexelK: rimK,
      });
      const mesh = new Mesh(geo, material);
      mesh.name = p.name;
      mesh.frustumCulled = false;
      mesh.renderOrder = renderOrder;
      mesh.position.z = layer * LAYER_DZ;
      if (layer === 0) mesh.onBeforeRender = (_r, scene, camera: Camera): void => void (scene && this.carrier.noteViewCamera(camera));
      this.plane.add(mesh);
      this.parts.push({ data: p, mesh, geo, pos, material, map, rim });
    });
    this.carrier.inner.add(this.plane);
    this.sync();
    this.skin();
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
      for (const p of this.parts) setPartTexel(p.material, k, p.data.box[2], p.data.box[3]);
    }
  }

  /** Move every part's vertices through the skeleton's current pose. */
  skin(): void {
    for (const p of this.parts) {
      this.skeleton.skin(p.data, p.pos);
      (p.geo.getAttribute('position') as BufferAttribute).needsUpdate = true;
    }
  }

  /** The actor's alpha onto every part (the shader multiplies it into the painting's own). */
  setOpacity(alpha: number, visible: boolean): void {
    const on = visible && alpha > 0.001;
    for (const p of this.parts) {
      p.material.uniforms['opacity']!.value = alpha;
      p.mesh.visible = on;
    }
    this.plane.visible = on;
  }

  /** The parts' blending follows the actor's (`BloomMask.syncPaintedBloom`): the bloom mask while whole, plain blending while dissolving or when the scene does not mask the figure. */
  syncBloom(dissolving: boolean, masked: boolean): void {
    for (const p of this.parts) syncPaintedBloom(p.material, dissolving, masked);
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
      p.geo.dispose();
      p.material.dispose();
      p.map.dispose();
      p.rim?.dispose();
    }
    this.white?.dispose();
    this.parts.length = 0;
    this.plane.removeFromParent();
  }
}
