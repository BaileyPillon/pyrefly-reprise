import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  SRGBColorSpace,
  type Texture,
} from 'three';
import { artUrl, configurePaintedTexture, tryLoadTexture } from '../engine/PaintedArt.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';

// ---------------------------------------------------------------------------
// The night-sakura arrival over the Cavern chamber (FFX only)
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. Lady Ginnem's Yojimbo in the Cavern
// of the Stolen Fayth; no FFX-2 chapter uses it.
//
// What is built, and on whose word: Bailey's O-4 pick (2026-09-24, "All your
// recommendations"): the cold chamber A, with the arrival overlay played at
// the start of the fight (`docs/concepts/chapters/yojimbo/chamber/sheet-arrival.jpg`,
// bottom left). The moment is the visual bible's `[single source]`: a night
// dimension forms over the cave, one sakura tree blooms with BLUE flowers,
// Daigoro comes first and Yojimbo steps out from the tree. The overlay's own
// recipe (`D:/Tools/pyrefly-scratch/yojimbo-options/arrival.py`) is followed
// number for number where it has one:
//
// - the night: 72 % toward the bible's gradient #0A0E22 (top) to #1E2A4E;
// - the tree behind Yojimbo, screen-blended (additive on its black ground);
// - a soft moon-blue (#8FC8F0) glow on the floor under the tree, alpha 70/255;
// - falling blue petals, #8FC8F0 ("in the game: a particle emitter").
//
// Timings are ours (the sheet is a still). The night returns to the cold
// chamber once both have arrived, because the chamber is where the fight is
// staged (O-4 A, top of the sheet).

/** The bible's night gradient and petal colour (`[estimate]` by its own note). */
export const SAKURA_NIGHT = { top: 0x0a0e22, bottom: 0x1e2a4e, amount: 0.72, petal: 0x8fc8f0 } as const;

/** The overlay's floor glow under the tree: #8FC8F0 at 70/255. */
export const SAKURA_FLOOR_GLOW = 70 / 255;

/** The recoloured tree, when the art session has installed it; else {@link paintSakuraTree}. */
export const SAKURA_TREE_URL = 'art/backdrops/cavern-stolen-fayth/sakura.png';

/** The arrival's beats, in ms from the opening shot (the scene's `intro` rig). */
export const SAKURA_ARRIVAL_MS = {
  nightIn: [0, 700],
  treeIn: [250, 1100],
  petalsIn: [400, 1000],
  daigoroIn: [400, 800],
  // In before the opening's boss push lands on him (`BattleMoments.revealBoss`, about 1.3 s in).
  yojimboIn: [650, 1300],
  nightOut: [3600, 5200],
  treeOut: [3700, 5200],
  petalsOut: [4000, 5800],
  end: 5800,
} as const;

/** One frame of the arrival: every value 0..1. */
export interface SakuraArrivalFrame {
  night: number;
  tree: number;
  petals: number;
  /** Daigoro's alpha: he comes first. */
  daigoro: number;
  /** Yojimbo's alpha and his step out from the tree (0 = at the tree, 1 = on his spot). */
  yojimbo: number;
  done: boolean;
}

const ramp = (t: number, [a, b]: readonly [number, number]): number =>
  t <= a ? 0 : t >= b ? 1 : smooth((t - a) / (b - a));
const smooth = (k: number): number => k * k * (3 - 2 * k);

/** The pure timeline, for the scene and its test. */
export function sakuraArrivalAt(ms: number): SakuraArrivalFrame {
  const T = SAKURA_ARRIVAL_MS;
  return {
    night: ramp(ms, T.nightIn) * (1 - ramp(ms, T.nightOut)),
    tree: ramp(ms, T.treeIn) * (1 - ramp(ms, T.treeOut)),
    petals: ramp(ms, T.petalsIn) * (1 - ramp(ms, T.petalsOut)),
    daigoro: ramp(ms, T.daigoroIn),
    yojimbo: ramp(ms, T.yojimboIn),
    done: ms >= T.end,
  };
}

/** A vertical two-stop gradient on a small canvas. */
function gradientTexture(top: number, bottom: number): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, `#${top.toString(16).padStart(6, '0')}`);
  g.addColorStop(1, `#${bottom.toString(16).padStart(6, '0')}`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** A soft radial disc, white in the middle, for the floor glow. */
export function softDiscTexture(size = 128): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * The procedural stand-in for the tree, on black (drawn additively): a dark
 * twisted trunk and a canopy of blue blossom clusters. Used only while the
 * recoloured painting ({@link SAKURA_TREE_URL}) is not installed.
 */
export function paintSakuraTree(w = 512, h = 512, seed = 7100): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  let s = seed;
  const rnd = (): number => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  // Trunk and branches: faint under an additive blend, as in the overlay.
  ctx.lineCap = 'round';
  const branch = (x: number, y: number, ang: number, len: number, width: number, depth: number): void => {
    if (depth <= 0 || width < 1) return;
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    ctx.strokeStyle = `rgba(70,64,96,${0.55 + depth * 0.05})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + (rnd() - 0.5) * len * 0.5, (y + y2) / 2, x2, y2);
    ctx.stroke();
    const n = depth > 3 ? 2 : 3;
    for (let i = 0; i < n; i++) {
      branch(x2, y2, ang + (rnd() - 0.5) * 1.3, len * (0.62 + rnd() * 0.15), width * 0.62, depth - 1);
    }
  };
  branch(w * 0.46, h * 0.98, -Math.PI / 2 - 0.12, h * 0.26, w * 0.07, 6);
  // Blossom clusters: a wide dome, brightest on top, in the bible's blue.
  for (let i = 0; i < 1400; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    const x = w * 0.5 + Math.cos(a) * r * w * 0.46;
    const y = h * 0.34 + Math.sin(a) * r * h * 0.24;
    const light = Math.min(1, 0.7 + 0.5 * (1 - (y - h * 0.1) / (h * 0.5)) * rnd());
    const rad = 3 + rnd() * 9;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const col = `${Math.round(0x8f * light)},${Math.round(0xc8 * light)},${Math.round(0xf0 * light)}`;
    g.addColorStop(0, `rgba(${col},0.85)`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return c;
}

/** Is the recoloured tree installed? A dev server answers a missing file with `index.html`. */
async function treeInstalled(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('image/');
  } catch {
    return false;
  }
}

/** Where the overlay's pieces stand, in world units (the scene's own numbers). */
export interface SakuraLayout {
  /** The plane the night veil covers: centre and size, just in front of the painting. */
  veil: { centre: [number, number, number]; width: number; height: number };
  /** The floor the night lies on: centre (y 0) and size in x and z. */
  floor: { centre: [number, number, number]; width: number; depth: number };
  /** The tree's foot (bottom centre) and height. */
  tree: { foot: [number, number, number]; height: number };
  /** Petal field: centre and half-extents. */
  petals: { centre: [number, number, number]; bounds: { x: number; y: number; z: number } };
}

/** The overlay's meshes and petals, driven by {@link sakuraArrivalAt}. */
export class SakuraArrival {
  readonly group = new Group();
  readonly petals: ParticleField;
  private readonly veil: Mesh;
  private readonly floorVeil: Mesh;
  private readonly tree: Mesh;
  private readonly glow: Mesh;
  private readonly textures: Texture[] = [];
  /** True once the painted tree replaced the procedural one. */
  painted = false;

  constructor(layout: SakuraLayout, opts: { low?: boolean } = {}) {
    this.group.name = 'sakura-arrival';
    this.group.visible = false;

    const nightTex = gradientTexture(SAKURA_NIGHT.top, SAKURA_NIGHT.bottom);
    this.textures.push(nightTex);
    const veilMat = new MeshBasicMaterial({ map: nightTex, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false });
    this.veil = new Mesh(new PlaneGeometry(layout.veil.width, layout.veil.height), veilMat);
    this.veil.position.set(...layout.veil.centre);
    // After the painting (-90), its bands (-80) and mist (-60) and the ground (-50); before every figure (10).
    this.veil.renderOrder = -46;
    this.group.add(this.veil);

    // The night on the floor under the fighters: the gradient's lower stop.
    const floorMat = new MeshBasicMaterial({ color: SAKURA_NIGHT.bottom, transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.floorVeil = new Mesh(new PlaneGeometry(layout.floor.width, layout.floor.depth), floorMat);
    this.floorVeil.rotation.x = -Math.PI / 2;
    this.floorVeil.position.set(layout.floor.centre[0], 0.004, layout.floor.centre[2]);
    this.floorVeil.renderOrder = 2;
    this.group.add(this.floorVeil);

    const treeTex = configurePaintedTexture(new CanvasTexture(paintSakuraTree()));
    this.textures.push(treeTex);
    const treeMat = new MeshBasicMaterial({
      map: treeTex,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
      toneMapped: false,
    });
    const th = layout.tree.height;
    this.tree = new Mesh(new PlaneGeometry(th, th), treeMat);
    this.tree.geometry.translate(0, th / 2, 0);
    this.tree.position.set(...layout.tree.foot);
    this.tree.renderOrder = -45;
    this.group.add(this.tree);

    const discTex = softDiscTexture();
    this.textures.push(discTex);
    const glowMat = new MeshBasicMaterial({
      map: discTex,
      color: SAKURA_NIGHT.petal,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: NormalBlending,
      fog: false,
    });
    this.glow = new Mesh(new PlaneGeometry(1, 1), glowMat);
    this.glow.rotation.x = -Math.PI / 2;
    this.glow.scale.set(th * 0.75, th * 0.22, 1);
    this.glow.position.set(layout.tree.foot[0] - th * 0.08, 0.012, layout.tree.foot[2] + 1.2);
    this.glow.renderOrder = 3;
    this.group.add(this.glow);

    this.petals = new ParticleField(
      ParticlePresets.petals({
        count: opts.low ? 80 : 170,
        bounds: layout.petals.bounds,
        colors: [SAKURA_NIGHT.petal, 0xa9d6f4, 0x7fb8e8],
        size: 4.2,
        drift: [-0.45, -0.42, 0],
        opacity: 0,
      }),
    );
    this.petals.position.set(...layout.petals.centre);
    this.group.add(this.petals);
  }

  /** Swap in the recoloured painting when it is installed. Never rejects. */
  async loadPainting(): Promise<void> {
    const url = artUrl(SAKURA_TREE_URL);
    if (!(await treeInstalled(url))) return;
    const tex = await tryLoadTexture(url);
    if (!tex) return;
    const mat = this.tree.material as MeshBasicMaterial;
    mat.map?.dispose();
    mat.map = tex;
    mat.needsUpdate = true;
    this.textures.push(tex);
    this.painted = true;
  }

  /** Show one frame of the timeline. */
  apply(f: SakuraArrivalFrame): void {
    const on = f.night > 0.001 || f.tree > 0.001 || f.petals > 0.001;
    this.group.visible = on;
    (this.veil.material as MeshBasicMaterial).opacity = SAKURA_NIGHT.amount * f.night;
    (this.floorVeil.material as MeshBasicMaterial).opacity = SAKURA_NIGHT.amount * f.night;
    (this.tree.material as MeshBasicMaterial).opacity = f.tree;
    // The bloom: the tree opens upward as it comes in.
    this.tree.scale.set(0.92 + 0.08 * f.tree, 0.86 + 0.14 * f.tree, 1);
    (this.glow.material as MeshBasicMaterial).opacity = SAKURA_FLOOR_GLOW * f.tree;
    this.petals.setOpacity(0.85 * f.petals);
  }

  update(dt: number): void {
    if (this.group.visible) this.petals.update(dt);
  }

  dispose(): void {
    for (const m of [this.veil, this.floorVeil, this.tree, this.glow]) {
      m.geometry.dispose();
      (m.material as MeshBasicMaterial).dispose();
    }
    for (const t of this.textures) t.dispose();
    this.petals.dispose();
    this.group.removeFromParent();
  }
}
