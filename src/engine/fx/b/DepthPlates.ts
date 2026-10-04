import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  ShaderMaterial,
  UnsignedByteType,
  Vector3,
  type Group,
  type Object3D,
  type Texture,
  type WebGLRenderTarget,
  type WebGLRenderer,
} from 'three';
import { followTransform } from './focusMaths.ts';
import { cutPlates } from './plateMaths.ts';
import { PLATE_ANISOTROPY, composeHiPlates } from './PlateCompose.ts';

/**
 * Option B "Living Paintings" (B1): the approved backdrop cut into depth plates at runtime.
 *
 * The painting's own pixels, split by a derived depth map (`public/fx/<scene>/depth.png`, Depth
 * Anything V2 Small, `tools/fx/depth.py`), each plate pushed toward the camera and scaled back up
 * toward the backdrop's reference camera (Backdrop's own `cameraRef` trick), so at rest the stack
 * lands on the painting pixel for pixel and any camera motion parts it at true depth. Colour never
 * becomes a file: the plates are built in memory from the loaded painting, and the painting file
 * is never touched.
 *
 * While the plates show, the painting plane and its band layers are hidden (a layout with `keepBands` keeps the
 * scene's own band layers drawn over the plates); switching option B off puts them back exactly as they were.
 *
 * Game case: both (plumbing); the cut is each room's own.
 */

export interface PlateLayout {
  /** Ascending depth thresholds (0 far .. 1 near), one per plate above the first. */
  thresholds: number[];
  /** World z of each plate above the first (plate 0 stays on the painting plane). */
  z: number[];
  soft: number;
  /** Feather radius, pixels at `width` (scaled to the cut's own width when the cut runs at the painting's width). */
  blur: number;
  /**
   * Texture width of each plate on the tiers that cut at a fixed size (the phone's 1024). The full tier cuts at the painting's own
   * width instead (`PlateBuildOptions.native`): the 2048 this used to say was a cut of a 2688 painting, and the plates were the one
   * soft thing on screen (release 39).
   */
  width: number;
  /**
   * The top plate is the room's **painted floor, projected onto the ground (y = 0)** from the
   * reference camera instead of standing upright: the figures stand on it, so it has to move
   * like ground, or they would skate across it when the camera drifts. `far` is the world z the
   * floor reaches back to; painting rows beyond it stay on the upright plates.
   */
  floor?: { far: number };
  /**
   * Leave the scene's own `backdrop-layer-*` bands visible over the plates (they draw after the plates, render order -80 and up).
   * Without it the bands are hidden with the painting plane, which changes the resting frame wherever a scene's bands are translucent
   * (the Farplane's are 0.38 and 0.52): the plates alone are the bare painting, the live frame is the painting plus its bands.
   */
  keepBands?: boolean;
}

const FLOOR_VERT = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
  }
`;

// The painting pixel the reference camera sees through this ground point.
const FLOOR_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uRef;
  uniform vec4 uPlane;
  uniform vec3 uGroup;
  uniform vec3 uColor;
  varying vec3 vWorld;
  void main() {
    vec3 l = vWorld - uGroup;
    float t = (uPlane.w - uRef.z) / (l.z - uRef.z);
    if (t <= 0.0) discard;
    vec3 p = uRef + (l - uRef) * t;
    vec2 uv = vec2(p.x / uPlane.x + 0.5, (p.y - uPlane.z) / uPlane.y + 0.5);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
    vec4 c = texture2D(map, uv);
    gl_FragColor = vec4(c.rgb * uColor, c.a);
    #include <colorspace_fragment>
  }
`;

/** Per painting row (top to bottom), 0..1: is that row's ray onto the ground nearer than `far`? */
export function floorRows(g: PlateGeometry, h: number, far: number): Float32Array {
  const rows = new Float32Array(h);
  for (let y = 0; y < h; y++) {
    const py = g.centreY + (0.5 - (y + 0.5) / h) * g.height;
    if (py >= g.camRef.y - 1e-3) continue;
    const t = g.camRef.y / (g.camRef.y - py);
    const z = g.camRef.z + t * (g.distance - g.camRef.z);
    const k = Math.min(1, Math.max(0, (z - far) / 6));
    rows[y] = k * k * (3 - 2 * k);
  }
  return rows;
}

/**
 * The width the cut runs at when the plates are composed on the GPU: the derived depth maps are 1344x768 (`tools/fx/depth.py`), so
 * a cut at their own size loses nothing, costs a quarter of a cut at the painting's 2688 and half of the 2048 it used to run at,
 * and the colour comes from the painting's own pixels at their full size (`PlateCompose.ts`).
 */
export const GPU_CUT_WIDTH = 1344;

export interface PlateBuildOptions {
  /** The renderer the plates are composed on. Omitted (unit tests): the plates are CPU textures at the painting's approved width. */
  renderer?: WebGLRenderer | null;
  /** The full tier: the plates are as wide as the painting that loaded (2688 px, or the master's 5376); false keeps the layout's own small cut (the phone's). */
  native?: boolean;
}

export interface PlateGeometry {
  width: number;
  height: number;
  centreY: number;
  distance: number;
  /** The reference camera in the backdrop group's own space. */
  camRef: Vector3;
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return img;
}

function pixels(src: CanvasImageSource, w: number, h: number): Uint8ClampedArray {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high'; // a master is drawn down 2 to 4 times: the default bilinear read would alias
  ctx.drawImage(src, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

/** The painting plane's placement, read back off the backdrop group (`Backdrop.create`). */
export function plateGeometry(group: Group): PlateGeometry | null {
  const main = group.getObjectByName('backdrop-painting') as Mesh | undefined;
  const ref = main?.userData['fxRef'] as [number, number, number] | undefined;
  if (!main || !ref) return null;
  const p = (main.geometry as PlaneGeometry).parameters;
  return {
    width: p.width,
    height: p.height,
    // The plane's own height, not where a scene has moved it since (the Farplane lifts it during the colossus links; `follow`).
    centreY: (main.userData['fxCentreY'] as number | undefined) ?? main.position.y,
    distance: main.position.z,
    camRef: new Vector3(ref[0] - group.position.x, ref[1] - group.position.y, ref[2] - group.position.z),
  };
}

/** A painting pixel (u right, v down, 0..1) on the plane at world `z`, in the group's space. */
export function paintPoint(g: PlateGeometry, u: number, v: number, z = g.distance): Vector3 {
  const k = (g.camRef.z - z) / (g.camRef.z - g.distance);
  const p = new Vector3((u - 0.5) * g.width, g.centreY + (0.5 - v) * g.height, g.distance);
  return p.sub(g.camRef).multiplyScalar(k).add(g.camRef);
}

export class DepthPlates {
  readonly meshes: Mesh[] = [];
  readonly textures: Texture[] = [];
  /** Render targets behind `textures` when the plates were composed at the master's resolution. */
  private targets: WebGLRenderTarget[] = [];
  /** How many times the approved painting's width each plate is (1, or 2 for a master). */
  scale = 1;
  /** The cut's working width, pixels. */
  workWidth = 0;
  /** The plates' own width in pixels (the painting's, 2688 or 5376; the layout's on the phone tier). */
  pixelWidth = 0;
  /** Milliseconds the cut (CPU) and the composition (GPU) took, for the debug snapshot and the measurements. */
  cutMs = 0;
  composeMs = 0;
  readonly coverage: number[] = [];
  readonly geometry: PlateGeometry;
  readonly zs: number[];
  /** The top plate lies on the ground (see {@link PlateLayout.floor}). */
  readonly floored: boolean;
  private readonly group: Group;
  private depth: Float32Array | null = null;
  private dw = 0;
  private dh = 0;
  private thresholds: number[] = [];
  private readonly hidden: Array<{ o: Object3D; was: boolean }> = [];
  private shown = false;
  private keepBands = false;
  private paint: Mesh | null = null;
  /** Each upright plate's own scale (its `k`) and height at rest, for {@link follow}. */
  private readonly base: Array<{ k: number; y: number } | null> = [];

  private constructor(group: Group, geometry: PlateGeometry, zs: number[], floored: boolean) {
    this.group = group;
    this.geometry = geometry;
    this.zs = zs;
    this.floored = floored;
  }

  /** Which plate a painting pixel (u right, v down) belongs to, by its depth. */
  plateAt(u: number, v: number): number {
    if (!this.depth) return 0;
    const x = Math.min(this.dw - 1, Math.max(0, Math.floor(u * this.dw)));
    const y = Math.min(this.dh - 1, Math.max(0, Math.floor(v * this.dh)));
    const d = this.depth[y * this.dw + x]!;
    let k = 0;
    while (k < this.thresholds.length && d >= this.thresholds[k]!) k++;
    return k;
  }

  static async build(group: Group, depthUrl: string, layout: PlateLayout, opts: PlateBuildOptions = {}): Promise<DepthPlates | null> {
    const g = plateGeometry(group);
    const main = group.getObjectByName('backdrop-painting') as Mesh | undefined;
    const map = (main?.material as MeshBasicMaterial | undefined)?.map;
    const image = map?.image as (CanvasImageSource & { naturalWidth?: number; width?: number }) | undefined;
    if (!g || !image) return null;
    const depthImg = await loadImage(depthUrl);
    // The painting as loaded: the approved 2688 px, or its master (`artScale` 2: 5376 px). The full tier makes plates as wide as
    // the painting that loaded, cutting at the depth map's own 1344 and laying the painting's pixels over that cut on the GPU; the
    // phone tier keeps its own small cut. With no renderer (unit tests) the cut itself runs at the approved width on the CPU.
    const loadedW = Number(image.naturalWidth || image.width || layout.width);
    const loadedScale = Math.max(1, Math.round(Number(map?.userData['artScale'] ?? 1)));
    const baseW = Math.round(loadedW / loadedScale);
    const gpu = !!(opts.native && opts.renderer);
    const w = opts.native ? (gpu ? Math.min(baseW, GPU_CUT_WIDTH) : baseW) : layout.width;
    const h = Math.round((w * g.height) / g.width);
    const blur = opts.native ? Math.max(1, Math.round((layout.blur * w) / layout.width)) : layout.blur;
    const t0 = performance.now();
    const paint = pixels(image, w, h);
    const dBytes = pixels(depthImg, w, h);
    const depth = new Float32Array(w * h);
    for (let i = 0; i < depth.length; i++) depth[i] = dBytes[i * 4]! / 255;
    const rows = layout.floor ? floorRows(g, h, layout.floor.far) : undefined;
    const plates = cutPlates(paint, depth, w, h, { thresholds: layout.thresholds, soft: layout.soft, blur }, 0.999, rows);
    const zs = [g.distance, ...layout.z];
    const dp = new DepthPlates(group, g, zs, !!layout.floor);
    dp.keepBands = !!layout.keepBands;
    dp.depth = depth;
    dp.dw = w;
    dp.dh = h;
    dp.thresholds = layout.thresholds;
    dp.paint = main ?? null;
    dp.workWidth = w;
    dp.scale = gpu ? loadedScale : 1;
    dp.cutMs = Math.round(performance.now() - t0);
    // Rows bottom-up for the GL upload (a data texture is never flipped by the driver).
    const flippedPlates = plates.map((plate) => {
      const flipped = new Uint8Array(w * h * 4);
      for (let y = 0; y < h; y++) flipped.set(plate.rgba.subarray(y * w * 4, (y + 1) * w * 4), (h - 1 - y) * w * 4);
      return flipped;
    });
    let textures: Texture[];
    if (gpu) {
      const t1 = performance.now();
      const composed = composeHiPlates(opts.renderer!, image as unknown as TexImageSource, { w, h, plates: flippedPlates }, loadedW / w);
      dp.targets = composed.targets;
      textures = composed.textures;
      dp.composeMs = Math.round(performance.now() - t1);
      dp.pixelWidth = loadedW;
    } else {
      textures = flippedPlates.map((flipped) => {
        const tex = new DataTexture(flipped, w, h, RGBAFormat, UnsignedByteType);
        tex.colorSpace = SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = LinearMipmapLinearFilter;
        tex.magFilter = LinearFilter;
        tex.needsUpdate = true;
        return tex;
      });
      dp.pixelWidth = w;
    }
    plates.forEach((plate, i) => {
      const tex = textures[i]!;
      tex.anisotropy = gpu ? PLATE_ANISOTROPY : 8; // a composed plate's render target was given the 16 when it was made (`PlateCompose.ts`); the CPU cut (the phone tier, the tests) keeps the 8 it always had
      const onFloor = !!layout.floor && i === plates.length - 1;
      const mesh = onFloor ? DepthPlates.floorMesh(g, tex, layout.floor!.far, group) : DepthPlates.uprightMesh(g, tex, zs[i]!, i > 0);
      dp.base.push(onFloor ? null : { k: mesh.scale.x, y: mesh.position.y });
      mesh.renderOrder = -90 + i * 3;
      mesh.name = `fx-b-plate-${i}`;
      mesh.visible = false;
      group.add(mesh);
      dp.meshes.push(mesh);
      dp.textures.push(tex);
      dp.coverage.push(Math.round(plate.coverage * 1000) / 1000);
    });
    return dp;
  }

  private static uprightMesh(g: PlateGeometry, tex: Texture, z: number, transparent: boolean): Mesh {
    const mat = new MeshBasicMaterial({ map: tex, transparent, depthWrite: false, fog: false, toneMapped: false });
    const mesh = new Mesh(new PlaneGeometry(g.width, g.height), mat);
    const k = (g.camRef.z - z) / (g.camRef.z - g.distance);
    mesh.scale.setScalar(k);
    mesh.position.set(g.camRef.x * (1 - k), g.camRef.y + (g.centreY - g.camRef.y) * k, z);
    return mesh;
  }

  private static floorMesh(g: PlateGeometry, tex: Texture, far: number, group: Group): Mesh {
    const near = g.camRef.z;
    const mat = new ShaderMaterial({
      uniforms: {
        map: { value: tex },
        uRef: { value: g.camRef.clone() },
        uPlane: { value: [g.width, g.height, g.centreY, g.distance] },
        uGroup: { value: group.position.clone() },
        uColor: { value: new Vector3(1, 1, 1) },
      },
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
      transparent: true,
      depthWrite: false,
      fog: false,
    });
    const mesh = new Mesh(new PlaneGeometry(g.width, near - far + 2), mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(g.camRef.x, 0, (near + far) / 2);
    return mesh;
  }

  /**
   * Carry the plates through whatever a scene does to the (hidden) painting plane: its scale about its own centre and a lift.
   * A plate standing at `k` of the painting's distance from the reference camera takes the same scale times `k` and `k` times
   * the lift, so the stack still lands on the painting seen from that camera (the Farplane grows and lifts the painting 1.8 times
   * and 6 units during the colossus links). At rest (scale 1, no lift) nothing moves.
   */
  follow(): void {
    const main = this.paint;
    if (!main || !this.shown) return;
    const lift = main.position.y - this.geometry.centreY;
    this.meshes.forEach((m, i) => {
      const b = this.base[i];
      if (!b) return;
      const t = followTransform(b.k, b.y, main.scale.x, main.scale.y, lift);
      m.scale.set(t.sx, t.sy, b.k);
      m.position.y = t.y;
    });
  }

  /** Plates on (the painting plane and band layers hidden) or off (restored). */
  show(on: boolean): void {
    if (on === this.shown) return;
    this.shown = on;
    if (on) {
      this.hidden.length = 0;
      for (const o of this.group.children) {
        if (o.name === 'backdrop-painting' || (!this.keepBands && o.name.startsWith('backdrop-layer-'))) {
          this.hidden.push({ o, was: o.visible });
          o.visible = false;
        }
      }
    } else {
      for (const { o, was } of this.hidden) o.visible = was;
      this.hidden.length = 0;
    }
    for (const m of this.meshes) m.visible = on;
  }

  get visible(): boolean {
    return this.shown;
  }

  /** Multiply plate `i`'s colour (a distant lightning flash lifts the far plate; 1 = as painted). */
  lift(i: number, r: number, g: number, b: number): void {
    const m = this.meshes[i]?.material as (MeshBasicMaterial & ShaderMaterial) | undefined;
    if (!m) return;
    if (m.color) m.color.setRGB(r, g, b);
    else (m.uniforms['uColor']!.value as Vector3).set(r, g, b);
  }

  dispose(): void {
    this.show(false);
    for (const m of this.meshes) {
      m.geometry.dispose();
      (m.material as MeshBasicMaterial | ShaderMaterial).dispose();
      m.removeFromParent();
    }
    for (const t of this.textures) t.dispose();
    for (const rt of this.targets) rt.dispose();
    this.targets = [];
    this.meshes.length = 0;
  }
}
