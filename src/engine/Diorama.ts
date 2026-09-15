import {
  BackSide,
  BufferGeometry,
  CanvasTexture,
  Color,
  IcosahedronGeometry,
  LinearFilter,
  Mesh,
  MeshLambertMaterial,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  SphereGeometry,
  CylinderGeometry,
  type Texture,
} from 'three';

// ---------------------------------------------------------------- textures

export interface ProcTextureOptions {
  /** Square canvas edge in pixels. Keep small; NearestFilter does the rest. */
  size?: number;
  /** UV repeat applied to the resulting texture. */
  repeat?: number | [number, number];
  /** Crisp pixel look (default) or smoothed. */
  filter?: 'nearest' | 'linear';
}

/** Wrap a 2D drawing routine into a tiling THREE texture. */
export function canvasTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  opts: ProcTextureOptions = {},
): CanvasTexture {
  const size = opts.size ?? 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, size);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  const nearest = opts.filter !== 'linear';
  tex.magFilter = nearest ? NearestFilter : LinearFilter;
  tex.minFilter = nearest ? NearestFilter : LinearFilter;
  tex.generateMipmaps = false;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  const r = opts.repeat ?? 1;
  if (Array.isArray(r)) tex.repeat.set(r[0], r[1]);
  else tex.repeat.set(r, r);
  tex.needsUpdate = true;
  return tex;
}

/** Deterministic-ish value hash so textures are stable within a session. */
function hash2(x: number, y: number, seed: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

export interface NoiseTextureOptions extends ProcTextureOptions {
  base: number | string;
  /** Second colour speckles are drawn in. */
  speck?: number | string;
  /** 0..1 density of specks. */
  density?: number;
  /** 0..1 strength of the speck colour. */
  contrast?: number;
  seed?: number;
  /** Size of one speck in canvas pixels. */
  grain?: number;
}

/** Flat colour plus per-pixel grain. The workhorse for ground planes. */
export function noiseTexture(opts: NoiseTextureOptions): CanvasTexture {
  const {
    base,
    speck = '#ffffff',
    density = 0.3,
    contrast = 0.12,
    seed = 1,
    grain = 1,
  } = opts;
  return canvasTexture((ctx, size) => {
    ctx.fillStyle = new Color(base as never).getStyle();
    ctx.fillRect(0, 0, size, size);
    const s = new Color(speck as never);
    const cells = Math.floor(size / grain);
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        const h = hash2(x, y, seed);
        if (h > 1 - density) {
          const a = contrast * (0.4 + 0.6 * hash2(y, x, seed + 9));
          ctx.fillStyle = `rgba(${Math.round(s.r * 255)},${Math.round(s.g * 255)},${Math.round(
            s.b * 255,
          )},${a.toFixed(3)})`;
          ctx.fillRect(x * grain, y * grain, grain, grain);
        }
      }
    }
  }, opts);
}

export interface StripeTextureOptions extends ProcTextureOptions {
  a: number | string;
  b: number | string;
  /** Stripe width in canvas pixels. */
  width?: number;
  direction?: 'horizontal' | 'vertical';
}

/** Two-tone stripes; good for banners, cloth, stylised water. */
export function stripeTexture(opts: StripeTextureOptions): CanvasTexture {
  const { a, b, width = 8, direction = 'horizontal' } = opts;
  return canvasTexture((ctx, size) => {
    ctx.fillStyle = new Color(a as never).getStyle();
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = new Color(b as never).getStyle();
    for (let i = 0; i < size; i += width * 2) {
      if (direction === 'horizontal') ctx.fillRect(0, i, size, width);
      else ctx.fillRect(i, 0, width, size);
    }
  }, opts);
}

export interface StoneTextureOptions extends ProcTextureOptions {
  base: number | string;
  mortar?: number | string;
  highlight?: number | string;
  /** Brick size in canvas pixels. */
  brick?: [number, number];
  seed?: number;
}

/** Offset brick/stone tiling with per-brick shading. */
export function stoneTexture(opts: StoneTextureOptions): CanvasTexture {
  const {
    base,
    mortar = '#000000',
    highlight = '#ffffff',
    brick = [16, 8],
    seed = 3,
  } = opts;
  const [bw, bh] = brick;
  return canvasTexture((ctx, size) => {
    ctx.fillStyle = new Color(mortar as never).getStyle();
    ctx.fillRect(0, 0, size, size);
    const baseC = new Color(base as never);
    const hiC = new Color(highlight as never);
    let row = 0;
    for (let y = 0; y < size; y += bh, row++) {
      const offset = row % 2 === 0 ? 0 : -bw / 2;
      for (let x = offset; x < size; x += bw) {
        const h = hash2(x, y, seed);
        const c = baseC.clone().lerp(hiC, h * 0.22);
        ctx.fillStyle = c.getStyle();
        ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
      }
    }
  }, opts);
}

// ------------------------------------------------------------------ meshes

/** Flat ground plane lying in XZ, centred on the origin. */
export function makeGroundPlane(
  w: number,
  h: number,
  texture: Texture | null = null,
  color: number | string = 0xffffff,
): Mesh {
  const geo = new PlaneGeometry(w, h, 1, 1);
  const mat = new MeshLambertMaterial({
    color,
    ...(texture ? { map: texture } : {}),
  });
  const mesh = new Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.name = 'ground';
  return mesh;
}

/**
 * A large inward-facing sphere painted with a vertical two-colour gradient.
 * Unlit, so it reads as sky no matter what the light rig does.
 */
export function makeGradientSky(
  top: number | string,
  bottom: number | string,
  opts: { radius?: number; midpoint?: number; mid?: number | string } = {},
): Mesh {
  const radius = opts.radius ?? 90;
  const midpoint = opts.midpoint ?? 0.55;

  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, new Color(top as never).getStyle());
  if (opts.mid !== undefined) g.addColorStop(midpoint, new Color(opts.mid as never).getStyle());
  g.addColorStop(1, new Color(bottom as never).getStyle());
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = LinearFilter;
  tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;

  const mesh = new Mesh(
    new SphereGeometry(radius, 24, 16),
    new MeshBasicMaterial({ map: tex, side: BackSide, depthWrite: false, fog: false }),
  );
  mesh.name = 'sky';
  mesh.renderOrder = -100;
  return mesh;
}

export interface RockOptions {
  /** Approximate radius in world units. */
  size?: number;
  color?: number | string;
  /** Non-uniform squash, applied after generation. */
  scale?: [number, number, number];
  /** How far vertices are pushed around (0 = smooth icosahedron). */
  jitter?: number;
  /** Detail level, 0 or 1 keeps it properly low-poly. */
  detail?: number;
  seed?: number;
  flatShading?: boolean;
}

/** A crude low-poly boulder, flat shaded. */
export function makeRock(opts: RockOptions = {}): Mesh {
  const {
    size = 1,
    color = 0x6d7b93,
    scale = [1, 0.8, 1],
    jitter = 0.22,
    detail = 1,
    seed = 5,
    flatShading = true,
  } = opts;

  const geo: BufferGeometry = new IcosahedronGeometry(size, detail);
  const pos = geo.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const n = 1 + (hash2(x * 10, y * 10 + z * 3, seed) - 0.5) * 2 * jitter;
    pos.setXYZ(i, x * n, y * n, z * n);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const mesh = new Mesh(geo, new MeshLambertMaterial({ color, flatShading }));
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'rock';
  return mesh;
}

export interface PillarOptions {
  height?: number;
  radius?: number;
  /** Taper: top radius as a fraction of `radius`. */
  taper?: number;
  sides?: number;
  color?: number | string;
  texture?: Texture | null;
  /** Adds a simple slab cap on top. */
  cap?: boolean;
}

/** A simple faceted column, optionally capped. Origin sits at its base. */
export function makePillar(opts: PillarOptions = {}): Mesh {
  const {
    height = 4,
    radius = 0.45,
    taper = 0.85,
    sides = 8,
    color = 0x8895ad,
    texture = null,
    cap = true,
  } = opts;

  const mat = new MeshLambertMaterial({
    color,
    flatShading: true,
    ...(texture ? { map: texture } : {}),
  });
  const mesh = new Mesh(new CylinderGeometry(radius * taper, radius, height, sides, 1), mat);
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'pillar';

  if (cap) {
    const capMesh = new Mesh(
      new CylinderGeometry(radius * 1.25, radius * 1.25, height * 0.06, sides, 1),
      mat,
    );
    capMesh.position.y = height / 2 + height * 0.03;
    mesh.add(capMesh);
  }
  return mesh;
}

/** Flat slab useful for platforms, ledges and battle stages. */
export function makeSlab(
  w: number,
  d: number,
  thickness = 0.25,
  color: number | string = 0x55627a,
  texture: Texture | null = null,
): Mesh {
  const mat = new MeshLambertMaterial({
    color,
    flatShading: true,
    ...(texture ? { map: texture } : {}),
  });
  const mesh = new Mesh(new CylinderGeometry(w / 2, w / 2, thickness, 6, 1), mat);
  mesh.scale.z = d / w;
  mesh.name = 'slab';
  mesh.receiveShadow = true;
  return mesh;
}
