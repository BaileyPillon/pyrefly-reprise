import {
  AdditiveBlending,
  AmbientLight,
  CircleGeometry,
  Color,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  type Texture,
} from 'three';
import type { BackdropPalette } from './Backdrop.ts';
import { normaliseLuma, paintedCanvasTexture } from './PaintedArt.ts';
import { radialCanvas } from './ProceduralArt.ts';
import { TweenGroup } from './Tween.ts';

export interface LightRigOptions {
  /** Colours sampled from the backdrop painting. */
  palette: BackdropPalette;
  /** Direction the key light comes *from*. */
  keyFrom?: [number, number, number];
  keyIntensity?: number;
  /** Direction the rim light comes from (usually roughly opposite the key). */
  rimFrom?: [number, number, number];
  rimIntensity?: number;
  /** Colour of the rim; defaults to a cool sky tint from the palette. */
  rimColor?: number | string;
  fillIntensity?: number;
  ambientIntensity?: number;
  /**
   * Target luminances the sampled palette colours are re-exposed to, so the rig
   * takes its *hue* from the painting and its *value* from here. Without this a
   * night painting averages to near-black and lights nothing.
   */
  luma?: { key?: number; fill?: number; rim?: number; ambient?: number };
  /** Real shadow maps from the key light. */
  shadows?: false | { mapSize?: number; area?: number; bias?: number; radius?: number };
}

let poolTexture: Texture | null = null;
function lightPoolTexture(): Texture {
  if (!poolTexture) {
    poolTexture = paintedCanvasTexture(
      radialCanvas(256, [
        [0, 0.85],
        [0.28, 0.45],
        [0.6, 0.12],
        [1, 0],
      ]),
    );
  }
  return poolTexture;
}

export interface LightPoolOptions {
  color?: number | string;
  radius?: number;
  opacity?: number;
  /** How flat the ellipse is. */
  squash?: number;
}

/**
 * A subtle lit pool on the ground under a figure — the "spotlight on actor"
 * helper. Additive, so it lifts the snow without washing it out, and it is what
 * separates a figure from a busy painted background.
 */
export function makeLightPool(opts: LightPoolOptions = {}): Mesh {
  const mat = new MeshBasicMaterial({
    map: lightPoolTexture(),
    color: opts.color ?? 0xbcd6ff,
    transparent: true,
    opacity: opts.opacity ?? 0.16,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: false,
  });
  const r = opts.radius ?? 1.1;
  const mesh = new Mesh(new CircleGeometry(1, 40), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(r, r * (opts.squash ?? 0.62), 1);
  mesh.position.y = 0.008;
  mesh.renderOrder = 3;
  mesh.name = 'light-pool';
  return mesh;
}

/**
 * Key / fill / rim, coloured from the backdrop painting, plus a practical point
 * light that attacks and spells can flicker.
 *
 * Nothing here lights the painted characters (their material is unlit by
 * design) — the rig lights the *ground* and any real geometry, and hands the
 * characters matching rim/bounce colours through
 * {@link PaintedActor.setRimLight}.
 */
export class LightRig {
  readonly group = new Group();
  readonly key: DirectionalLight;
  readonly fill: HemisphereLight;
  readonly rim: DirectionalLight;
  readonly ambient: AmbientLight;
  /** Flickerable practical, parked near the action. */
  readonly practical: PointLight;
  readonly tweens = new TweenGroup();

  readonly palette: BackdropPalette;
  /** Screen-space direction the rim comes from, for `PaintedActor.setRimLight`. */
  readonly rimDir: [number, number];

  private clock = 0;
  private flickerAmount = 0;
  private flickerBase = 0;

  constructor(opts: LightRigOptions) {
    this.palette = opts.palette;
    const p = opts.palette;

    const keyFrom = opts.keyFrom ?? [-7.5, 5.4, -3.2];
    const rimFrom = opts.rimFrom ?? [6.5, 4.2, 5.5];

    const luma = opts.luma ?? {};
    // Key: the painting's light hue, re-exposed and pushed a little warmer so
    // the ground reads as lit rather than merely tinted.
    const keyColor = new Color(normaliseLuma(p.key, luma.key ?? 0.8)).lerp(
      new Color(0xffe6bf),
      0.3,
    );
    this.key = new DirectionalLight(keyColor.getHex(), opts.keyIntensity ?? 1.75);
    this.key.position.set(keyFrom[0], keyFrom[1], keyFrom[2]);
    this.key.name = 'key';

    if (opts.shadows !== false) {
      const s = opts.shadows ?? {};
      const area = s.area ?? 13;
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(s.mapSize ?? 1024, s.mapSize ?? 1024);
      this.key.shadow.camera.left = -area;
      this.key.shadow.camera.right = area;
      this.key.shadow.camera.top = area;
      this.key.shadow.camera.bottom = -area;
      this.key.shadow.camera.near = 0.5;
      this.key.shadow.camera.far = 46;
      this.key.shadow.bias = s.bias ?? -0.0012;
      this.key.shadow.radius = s.radius ?? 3.4;
      this.key.shadow.camera.updateProjectionMatrix();
    }

    this.fill = new HemisphereLight(
      new Color(normaliseLuma(p.sky, luma.fill ?? 0.62)).lerp(new Color(0xffffff), 0.18).getHex(),
      normaliseLuma(p.ground, (luma.fill ?? 0.62) * 0.45),
      opts.fillIntensity ?? 0.95,
    );
    this.fill.name = 'fill';

    const rimColor = new Color(
      opts.rimColor ??
        new Color(normaliseLuma(p.sky, luma.rim ?? 0.85)).lerp(new Color(0xd8ecff), 0.5),
    );
    this.rim = new DirectionalLight(rimColor.getHex(), opts.rimIntensity ?? 0.85);
    this.rim.position.set(rimFrom[0], rimFrom[1], rimFrom[2]);
    this.rim.name = 'rim';

    this.ambient = new AmbientLight(
      normaliseLuma(p.horizon, luma.ambient ?? 0.5),
      opts.ambientIntensity ?? 0.45,
    );

    this.practical = new PointLight(0x8affd0, 0, 11, 2);
    this.practical.position.set(3.2, 1.9, -2.2);
    this.practical.name = 'practical';

    this.group.add(this.key, this.key.target, this.fill, this.rim, this.ambient, this.practical);
    this.group.name = 'light-rig';

    this.rimDir = [rimFrom[0] >= 0 ? 1 : -1, 0.34];
  }

  /** Colour a painted actor's rim + bounce to match the rig. */
  get rimColorHex(): number {
    return this.rim.color.getHex();
  }

  get bounceColorHex(): number {
    return this.palette.bounce;
  }

  /**
   * Kick the practical light: a bright flash that decays, with a little noise
   * on the way down. Used for attack impacts and spell charges.
   */
  flicker(colour: number | string, intensity = 3.2, ms = 420, distance = 12): void {
    this.practical.color.set(colour as never);
    this.practical.distance = distance;
    this.flickerBase = intensity;
    this.tweens.to(1, 0, {
      durationMs: ms,
      easing: 'expoOut',
      onUpdate: (v) => {
        this.flickerAmount = v;
      },
      onComplete: () => {
        this.flickerAmount = 0;
        this.practical.intensity = 0;
      },
    });
  }

  /** Move the practical light (e.g. onto the actor that is acting). */
  placePractical(x: number, y: number, z: number): void {
    this.practical.position.set(x, y, z);
  }

  /** @param dt seconds */
  update(dt: number): void {
    this.tweens.update(dt);
    this.clock += dt;
    if (this.flickerAmount > 0) {
      const noise = 0.82 + 0.18 * Math.sin(this.clock * 47) * Math.sin(this.clock * 23.3);
      this.practical.intensity = this.flickerBase * this.flickerAmount * noise;
    }
  }

  dispose(): void {
    this.tweens.killAll();
    this.key.dispose();
    this.fill.dispose();
    this.rim.dispose();
    this.ambient.dispose();
    this.practical.dispose();
    this.group.removeFromParent();
    this.group.clear();
  }
}
