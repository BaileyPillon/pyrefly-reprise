import {
  AdditiveBlending,
  ClampToEdgeWrapping,
  Color,
  Fog,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  NoColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  Vector3,
  type Object3D,
  type Texture,
} from 'three';
import {
  bandHex,
  loadPainted,
  normaliseLuma,
  paintedCanvasTexture,
  sampleBand,
  type PaintedTexture,
} from './PaintedArt.ts';
import { cloudCanvas, groundCanvas, paintGagazetBackdrop, radialCanvas } from './ProceduralArt.ts';

/** Colours read back out of the painting, so the 3D layer can match it. */
export interface BackdropPalette {
  /** Average of the top rows — the sky/ambient colour. */
  sky: number;
  /** Average of the horizon band — what `scene.fog` and the far haze use. */
  horizon: number;
  /** Average of the bottom rows — what the 3D ground is tinted with. */
  ground: number;
  /** Warm band around the sun; the key light colour. */
  key: number;
  /** A lifted version of `ground`, for bounce light into the figures. */
  bounce: number;
}

export interface ParallaxLayerSpec {
  /** Band of the painting this layer carries, as fractions of image height. */
  from: number;
  to: number;
  /** Feather on the top edge of the band (fraction of image height). */
  feather?: number;
  /** Feather on the bottom edge. Defaults to 0 (the band runs off-frame). */
  featherBottom?: number;
  /** World z for this layer. Closer to the camera than the main plane. */
  z: number;
  opacity?: number;
  /** Extra vertical nudge in world units after the projection. */
  yOffset?: number;
}

export interface BackdropOptions {
  /** Painting URL under `public/`. Missing files fall back to the placeholder. */
  url?: string;
  /** Procedural stand-in used when `url` is missing. */
  placeholder?: () => HTMLCanvasElement;
  /** World width of the main painting plane. */
  width?: number;
  /** World z of the main painting plane. */
  distance?: number;
  /** World y of the main plane's centre. */
  centreY?: number;
  /**
   * Camera position the parallax stack is aligned for. Every layer is the main
   * plane scaled toward this point, so at rest all layers register exactly and
   * any camera movement produces true parallax.
   */
  cameraRef?: [number, number, number];
  layers?: ParallaxLayerSpec[];
  /**
   * The lit ground plane in front of the painting.
   *
   * `fade` is the important one for a painting that already contains its own
   * ground: instead of an opaque plane running to the horizon (which buries the
   * painted valley under flat geometry), the plane is faded out radially, so it
   * only exists where it is needed — under the actors, catching their shadows —
   * and the painting supplies everything beyond.
   */
  ground?:
    | false
    | {
        size?: number;
        repeat?: number;
        tintMix?: number;
        brightness?: number;
        /**
         * Target luminance for the ground tint, 0..1. The hue still comes from
         * the painting; only the value is set here, because a band average of a
         * dark painting is far darker than the snow it is standing in for.
         */
        luma?: number;
        /** Fade the plane out radially. `true` uses the default falloff. */
        fade?: boolean;
        /** 0..1 fraction of the half-size that stays fully opaque. */
        fadeCore?: number;
        /** Where the opaque core sits, in world XZ. */
        center?: [number, number];
      };
  /** Drifting mist sheets between the actors and the painting. */
  fogPlanes?: false | Array<{ z: number; y: number; width: number; height: number; opacity?: number; speed?: number; additive?: boolean }>;
  /** Distance fog. `false` leaves `scene.fog` alone. */
  fog?: false | { near?: number; far?: number; colorMix?: number };
  /**
   * Flat colour painted behind everything, installed by {@link applyTo}.
   *
   * It is the safety net for camera rigs that swing far enough off the idle
   * axis to see past the edge of the painting plane: the sliver that shows is
   * then the scene's own haze colour instead of the renderer's near-black
   * clear colour, which is the difference between "atmospheric" and "the
   * backdrop ran out". Defaults to the fog colour; `false` leaves
   * `scene.background` alone.
   */
  background?: false | number | string;
  /**
   * Bands of the painting the palette is read from, as fractions of image
   * height. `horizon` matters most: it is the fog colour, so it must be the
   * band where the painting's ground meets its sky, not a dark ridge.
   */
  sampleBands?: {
    sky?: [number, number];
    horizon?: [number, number];
    ground?: [number, number];
    key?: [number, number];
  };
}

/** Nearest `Scene` at or above `node`, so `applyTo` can find where fog lives. */
function findScene(node: Object3D | null): Scene | null {
  for (let n = node; n; n = n.parent) {
    if (n instanceof Scene) return n;
  }
  return null;
}

const DEFAULT_LAYERS: ParallaxLayerSpec[] = [
  { from: 0.52, to: 0.9, feather: 0.1, featherBottom: 0.04, z: -26, opacity: 0.96 },
  { from: 0.79, to: 1.0, feather: 0.07, z: -12.5, opacity: 1 },
];

/** Cap on the pixel width of a masked parallax layer; they are drawn small. */
const LAYER_MAX_WIDTH = 1536;

function maskBand(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  spec: ParallaxLayerSpec,
): HTMLCanvasElement {
  const scale = Math.min(1, LAYER_MAX_WIDTH / srcW);
  const w = Math.max(2, Math.round(srcW * scale));
  const h = Math.max(2, Math.round(srcH * scale));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(source, 0, 0, w, h);

  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const feather = spec.feather ?? 0.06;
  const featherBottom = spec.featherBottom ?? 0;
  const from = Math.max(0, Math.min(1, spec.from));
  const to = Math.max(from, Math.min(1, spec.to));
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(Math.max(0.0001, from - feather), 'rgba(0,0,0,0)');
  g.addColorStop(Math.min(0.9999, from), 'rgba(0,0,0,1)');
  if (featherBottom > 0 && to < 1) {
    g.addColorStop(Math.min(0.9999, to - featherBottom), 'rgba(0,0,0,1)');
    g.addColorStop(Math.min(1, to), 'rgba(0,0,0,0)');
  } else {
    g.addColorStop(Math.min(1, to), 'rgba(0,0,0,1)');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

/**
 * The painted backdrop: a matte painting turned into a parallax stack, a lit
 * ground plane that matches its hue, drifting mist and a matching distance fog.
 *
 * ```ts
 * const backdrop = await Backdrop.create({ url: artUrl('art/backdrops/gagazet.png') });
 * backdrop.applyTo(scene);
 * // per frame
 * backdrop.update(dt);
 * ```
 *
 * The important trick is **hue matching**: the ground's tint, the fog colour
 * and the light rig's colours are all sampled from the painting at runtime
 * (`sampleBand`), so the seam between the painted horizon and the real 3D
 * ground disappears without anyone hand-picking a hex.
 */
export class Backdrop {
  readonly group = new Group();
  readonly palette: BackdropPalette;
  readonly ground: Mesh | null;
  readonly fog: Fog | null;
  /** Flat colour installed as `scene.background` by {@link applyTo}. */
  readonly background: Color | null;
  /** True when the painting is the procedural stand-in. */
  readonly placeholder: boolean;
  readonly sourceUrl: string;

  private readonly layerMeshes: Mesh[] = [];
  private readonly mistMeshes: Array<{ mesh: Mesh; speed: number }> = [];
  private readonly ownedTextures: Texture[] = [];
  private clock = 0;

  private constructor(
    painting: PaintedTexture,
    palette: BackdropPalette,
    ground: Mesh | null,
    fog: Fog | null,
    background: Color | null,
  ) {
    this.palette = palette;
    this.ground = ground;
    this.fog = fog;
    this.background = background;
    this.placeholder = painting.placeholder;
    this.sourceUrl = painting.url;
    this.group.name = 'backdrop';
  }

  static async create(opts: BackdropOptions = {}): Promise<Backdrop> {
    const placeholderFactory =
      opts.placeholder ?? ((): HTMLCanvasElement => paintGagazetBackdrop({ width: 2048 }));
    const painting = opts.url
      ? await loadPainted(opts.url, placeholderFactory)
      : {
          texture: paintedCanvasTexture(placeholderFactory()),
          meta: { width: 0, height: 0, baselineY: 0 },
          placeholder: true,
          url: '(procedural)',
        };

    const source = painting.texture.image as CanvasImageSource & {
      width?: number;
      height?: number;
      naturalWidth?: number;
      naturalHeight?: number;
    };
    const srcW = source.naturalWidth || source.width || 2048;
    const srcH = source.naturalHeight || source.height || 1152;

    // ------------------------------------------------------------- palette
    const bands = opts.sampleBands ?? {};
    const skyB = bands.sky ?? [0.0, 0.16];
    const horizonB = bands.horizon ?? [0.38, 0.5];
    const groundB = bands.ground ?? [0.88, 1.0];
    const keyB = bands.key ?? [0.36, 0.46];

    const sky = bandHex(sampleBand(source as HTMLCanvasElement, skyB[0], skyB[1]));
    const horizon = bandHex(sampleBand(source as HTMLCanvasElement, horizonB[0], horizonB[1]));
    const groundRgb = sampleBand(source as HTMLCanvasElement, groundB[0], groundB[1]);
    const groundHex = bandHex(groundRgb);
    const key = bandHex(sampleBand(source as HTMLCanvasElement, keyB[0], keyB[1]));
    const bounce = bandHex([
      Math.min(1, groundRgb[0] * 1.25),
      Math.min(1, groundRgb[1] * 1.22),
      Math.min(1, groundRgb[2] * 1.15),
    ]);
    const palette: BackdropPalette = { sky, horizon, ground: groundHex, key, bounce };

    // ------------------------------------------------------- geometry setup
    const width = opts.width ?? 118;
    const height = (width * srcH) / srcW;
    const distance = opts.distance ?? -46;
    const centreY = opts.centreY ?? height * 0.5 - 12;
    const camRef = new Vector3(...(opts.cameraRef ?? [0, 3.3, 11]));

    // ------------------------------------------------------------- ground
    const extraTextures: Texture[] = [];
    let groundMesh: Mesh | null = null;
    if (opts.ground !== false) {
      const g = opts.ground ?? {};
      const size = g.size ?? 150;
      const tex = paintedCanvasTexture(groundCanvas(1024, 13));
      tex.wrapS = tex.wrapT = RepeatWrapping;
      tex.repeat.set(g.repeat ?? 11, g.repeat ?? 11);
      const tint = new Color(normaliseLuma(groundHex, g.luma ?? 0.42));
      // Nudge toward the painting's ledge but keep a touch more life in it.
      tint.lerp(new Color(0xffffff), g.tintMix ?? 0.12);
      tint.multiplyScalar(g.brightness ?? 1.0);

      let alphaMap: Texture | null = null;
      if (g.fade) {
        const core = g.fadeCore ?? 0.1;
        alphaMap = paintedCanvasTexture(
          radialCanvas(
            512,
            [
              [0, 1],
              [core, 1],
              [core + (1 - core) * 0.38, 0.78],
              [0.74, 0.16],
              [1, 0],
            ],
            true,
          ),
        );
        // An alpha map is data, not colour: decoding it as sRGB would bend the
        // falloff and leave a visible ring.
        alphaMap.colorSpace = NoColorSpace;
        alphaMap.wrapS = alphaMap.wrapT = ClampToEdgeWrapping;
      }

      const mat = new MeshLambertMaterial({
        map: tex,
        color: tint,
        ...(alphaMap ? { alphaMap, transparent: true, depthWrite: false } : {}),
      });
      groundMesh = new Mesh(new PlaneGeometry(size, size, 1, 1), mat);
      groundMesh.rotation.x = -Math.PI / 2;
      const c = g.center ?? [0, -size * 0.26];
      groundMesh.position.set(c[0], 0, c[1]);
      groundMesh.receiveShadow = true;
      groundMesh.renderOrder = -50;
      groundMesh.name = 'ground';
      if (alphaMap) extraTextures.push(alphaMap);
    }

    // ---------------------------------------------------------------- fog
    let fog: Fog | null = null;
    if (opts.fog !== false) {
      const f = opts.fog ?? {};
      const c = new Color(horizon).lerp(new Color(sky), f.colorMix ?? 0.18);
      fog = new Fog(c.getHex(), f.near ?? 16, f.far ?? 62);
    }

    const background =
      opts.background === false
        ? null
        : opts.background !== undefined
          ? new Color(opts.background as never)
          : (fog?.color.clone() ?? new Color(horizon));

    const backdrop = new Backdrop(painting, palette, groundMesh, fog, background);
    backdrop.ownedTextures.push(...extraTextures);

    // -------------------------------------------------------- main painting
    // The painting is already "final pixels" — tone-mapping it again crushes
    // the sky gradient the art agent deliberately authored.
    const mainMat = new MeshBasicMaterial({
      map: painting.texture,
      fog: false,
      depthWrite: false,
      toneMapped: false,
    });
    const main = new Mesh(new PlaneGeometry(width, height), mainMat);
    main.position.set(0, centreY, distance);
    main.renderOrder = -90;
    main.name = 'backdrop-painting';
    backdrop.group.add(main);
    backdrop.layerMeshes.push(main);

    // ------------------------------------------------------ parallax layers
    const layers = opts.layers ?? DEFAULT_LAYERS;
    layers.forEach((spec, i) => {
      const canvas = maskBand(source, srcW, srcH, spec);
      const tex = paintedCanvasTexture(canvas);
      backdrop.ownedTextures.push(tex);
      const mat = new MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        opacity: spec.opacity ?? 1,
      });
      const mesh = new Mesh(new PlaneGeometry(width, height), mat);
      // Scale the whole plane toward the reference camera: the layer keeps the
      // exact screen position it had at `distance`, but now lives closer, so it
      // parallaxes when the camera sways.
      const k = (camRef.z - spec.z) / (camRef.z - distance);
      mesh.scale.setScalar(k);
      mesh.position.set(
        camRef.x + (0 - camRef.x) * k,
        camRef.y + (centreY - camRef.y) * k + (spec.yOffset ?? 0),
        spec.z,
      );
      mesh.renderOrder = -80 + i;
      mesh.name = `backdrop-layer-${i}`;
      backdrop.group.add(mesh);
      backdrop.layerMeshes.push(mesh);
    });

    if (groundMesh) backdrop.group.add(groundMesh);

    // ------------------------------------------------------------- mist
    const mistSpecs =
      opts.fogPlanes === false
        ? []
        : (opts.fogPlanes ?? [
            { z: -34, y: 5.0, width: 96, height: 26, opacity: 0.4, speed: 0.008 },
            { z: -19, y: 2.4, width: 62, height: 15, opacity: 0.3, speed: 0.016 },
            { z: -7.5, y: 1.1, width: 40, height: 8, opacity: 0.2, speed: 0.03, additive: true },
          ]);
    mistSpecs.forEach((m, i) => {
      const tex = paintedCanvasTexture(cloudCanvas(512, 9 + i * 13));
      tex.wrapS = tex.wrapT = RepeatWrapping;
      tex.repeat.set(2.2, 1);
      backdrop.ownedTextures.push(tex);
      const col = new Color(horizon).lerp(new Color(0xffffff), 0.45);
      const mat = new MeshBasicMaterial({
        map: tex,
        color: col,
        transparent: true,
        opacity: m.opacity ?? 0.3,
        depthWrite: false,
        fog: false,
        ...(m.additive ? { blending: AdditiveBlending } : {}),
      });
      const mesh = new Mesh(new PlaneGeometry(m.width, m.height), mat);
      mesh.position.set(0, m.y, m.z);
      mesh.renderOrder = -60 + i;
      mesh.name = `mist-${i}`;
      backdrop.group.add(mesh);
      backdrop.mistMeshes.push({ mesh, speed: m.speed ?? 0.015 });
    });

    return backdrop;
  }

  /**
   * Parent the stack and install the matched distance fog.
   *
   * `parent` is usually the `Scene`, but a scene builder that keeps everything
   * it owns inside one `Group` can pass that instead: the fog is installed on
   * the nearest `Scene` ancestor once the group is attached (or on `scene`,
   * when it is given explicitly).
   */
  applyTo(parent: Object3D, scene?: Scene): void {
    parent.add(this.group);
    const target = scene ?? findScene(parent);
    if (!target) return;
    if (this.fog) target.fog = this.fog;
    if (this.background) target.background = this.background;
  }

  /** @param dt seconds */
  update(dt: number): void {
    this.clock += dt;
    for (const { mesh, speed } of this.mistMeshes) {
      const tex = (mesh.material as MeshBasicMaterial).map;
      if (tex) {
        tex.offset.x = (tex.offset.x + speed * dt) % 1;
        tex.offset.y = Math.sin(this.clock * 0.08) * 0.012;
      }
    }
  }

  dispose(): void {
    for (const mesh of this.layerMeshes) {
      mesh.geometry.dispose();
      (mesh.material as MeshBasicMaterial).dispose();
    }
    for (const { mesh } of this.mistMeshes) {
      mesh.geometry.dispose();
      (mesh.material as MeshBasicMaterial).dispose();
    }
    if (this.ground) {
      this.ground.geometry.dispose();
      const m = this.ground.material as MeshLambertMaterial;
      m.map?.dispose();
      m.dispose();
    }
    for (const t of this.ownedTextures) t.dispose();
    this.group.removeFromParent();
    this.group.clear();
  }
}
