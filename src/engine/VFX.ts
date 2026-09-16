import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Points,
  ShaderMaterial,
  Vector3,
  type Camera,
} from 'three';
import { paintedCanvasTexture } from './PaintedArt.ts';
import { radialCanvas } from './ProceduralArt.ts';
import { TweenGroup } from './Tween.ts';

// ---------------------------------------------------------------------------
// Slash arc
// ---------------------------------------------------------------------------

const slashVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const slashFragment = /* glsl */ `
  uniform float progress;   // 0..1, sweeps the blade head along the arc
  uniform float opacity;
  uniform float arc;        // angular span in radians
  uniform float radius;     // 0..1 in plane space
  uniform float thickness;
  uniform float trail;      // how far the glowing wake extends, in arc units
  uniform vec3 coreColor;
  uniform vec3 edgeColor;

  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);

    float halfArc = arc * 0.5;
    float t = (a + halfArc) / arc;
    if (t < 0.0 || t > 1.0) discard;

    // The head travels a little past 1 so the tail can clear the frame.
    float head = progress * (1.0 + trail) - trail * 0.25;
    float d = head - t;
    float band = step(0.0, d) * (1.0 - smoothstep(0.0, trail, d));
    if (band <= 0.001) discard;

    // The blade is thin at the tail and thickest just behind the head.
    float w = thickness * (0.28 + 0.72 * pow(band, 0.6));
    float ring = 1.0 - smoothstep(w, w * 2.1, abs(r - radius));
    if (ring <= 0.001) discard;

    // Soften both ends of the arc so it never terminates in a hard chord.
    float ends = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.92, 1.0, t));

    float hot = pow(band, 6.0);
    vec3 c = mix(edgeColor, coreColor, pow(band, 1.6)) + vec3(hot * 0.9);
    float a2 = ring * band * ends * opacity;
    gl_FragColor = vec4(c * (0.5 + band), a2);
  }
`;

export interface SlashArcOptions {
  /** World size of the quad the arc is drawn inside. */
  size?: number;
  coreColor?: number | string;
  edgeColor?: number | string;
  /** Angular span of the arc, radians. */
  arc?: number;
  radius?: number;
  thickness?: number;
  trail?: number;
  /** Roll of the whole arc, radians. */
  roll?: number;
}

/**
 * The additive slash: a quad carrying an annulus-sector shader whose bright
 * head sweeps along the arc and drags a glowing wake behind it.
 *
 * Always billboarded — it is a screen-space flourish, not geometry.
 */
export class SlashArc extends Mesh {
  private readonly uniforms: ShaderMaterial['uniforms'];
  private readonly tweens = new TweenGroup();
  private playing = false;

  constructor(opts: SlashArcOptions = {}) {
    const size = opts.size ?? 3.4;
    const mat = new ShaderMaterial({
      uniforms: {
        progress: { value: 0 },
        opacity: { value: 0 },
        arc: { value: opts.arc ?? 2.5 },
        radius: { value: opts.radius ?? 0.66 },
        thickness: { value: opts.thickness ?? 0.085 },
        trail: { value: opts.trail ?? 0.55 },
        coreColor: { value: new Color(opts.coreColor ?? 0xffffff) },
        edgeColor: { value: new Color(opts.edgeColor ?? 0x8fd8ff) },
      },
      vertexShader: slashVertex,
      fragmentShader: slashFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
    super(new PlaneGeometry(size, size), mat);
    this.uniforms = mat.uniforms;
    this.frustumCulled = false;
    this.renderOrder = 40;
    this.visible = false;
    this.rotation.z = opts.roll ?? -0.5;
    this.name = 'slash-arc';
  }

  /** Play one sweep at a world position. Resolves when it has faded out. */
  play(at: Vector3 | { x: number; y: number; z: number }, ms = 280, roll?: number): Promise<void> {
    this.position.set(at.x, at.y, at.z);
    if (roll !== undefined) this.rotation.z = roll;
    this.visible = true;
    this.playing = true;
    this.uniforms['opacity']!.value = 1;
    this.tweens.killAll();
    this.tweens.to(1, 0, {
      durationMs: ms * 0.55,
      delayMs: ms * 0.45,
      easing: 'quadOut',
      onUpdate: (v) => {
        this.uniforms['opacity']!.value = v;
      },
    });
    return this.tweens.toAsync(0, 1, {
      durationMs: ms,
      easing: 'cubicOut',
      onUpdate: (v) => {
        this.uniforms['progress']!.value = v;
      },
      onComplete: () => {
        this.visible = false;
        this.playing = false;
      },
    });
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  /** @param dt seconds */
  update(dt: number, camera?: Camera): void {
    this.tweens.update(dt);
    if (camera && this.visible) {
      const roll = this.rotation.z;
      this.quaternion.copy(camera.quaternion);
      this.rotateZ(roll);
    }
  }

  override dispose(): void {
    this.tweens.killAll();
    this.geometry.dispose();
    (this.material as ShaderMaterial).dispose();
    this.removeFromParent();
  }
}

// ---------------------------------------------------------------------------
// Hit sparks
// ---------------------------------------------------------------------------

const sparkVertex = /* glsl */ `
  uniform float uTime;
  uniform float uLife;
  uniform float uGravity;
  uniform float uPixelScale;
  uniform float uSize;
  uniform vec3 uOrigin;

  attribute vec3 aVel;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;

  varying float vFade;
  varying vec3 vColor;

  void main() {
    float life = uLife * (0.55 + 0.75 * aSeed);
    float k = clamp(uTime / life, 0.0, 1.0);
    // Air drag, so sparks decelerate instead of flying in straight lines.
    float drag = (1.0 - exp(-3.2 * uTime)) / 3.2;
    vec3 p = uOrigin + aVel * drag + vec3(0.0, -0.5 * uGravity * uTime * uTime, 0.0);

    vFade = pow(1.0 - k, 1.7);
    vColor = aColor;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPixelScale * (0.35 + 0.65 * vFade) * (10.0 / max(-mv.z, 0.001));
  }
`;

const sparkFragment = /* glsl */ `
  varying float vFade;
  varying vec3 vColor;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    if (r > 1.0) discard;
    float core = pow(1.0 - r, 2.2);
    float a = core * vFade;
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.55) * (0.6 + vFade), a);
  }
`;

export interface SparkBurstOptions {
  count?: number;
  colors?: number[];
  /** Base outward speed, world units/second. */
  speed?: number;
  /** Seconds a spark lives. */
  life?: number;
  gravity?: number;
  size?: number;
  /** Bias the cone: [x, y, z] direction the burst favours. */
  bias?: [number, number, number];
  /** 0 = perfectly spherical, 1 = tightly along `bias`. */
  focus?: number;
}

/**
 * A one-shot burst of impact sparks. Allocated once and re-emitted, so a battle
 * never allocates buffers mid-combo.
 */
export class SparkBurst extends Points {
  private readonly uniforms: ShaderMaterial['uniforms'];
  private readonly vel: Float32Array;
  private readonly colorAttr: Float32Array;
  private readonly palette: Color[];
  private readonly baseSpeed: number;
  private readonly bias: Vector3;
  private readonly focus: number;
  private time = 0;
  private live = false;

  constructor(opts: SparkBurstOptions = {}) {
    const count = opts.count ?? 90;
    const positions = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      sizes[i] = 0.5 + Math.random() * 1.3;
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    geo.setAttribute('aVel', new BufferAttribute(vel, 3));
    geo.setAttribute('aColor', new BufferAttribute(colors, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1));
    geo.setAttribute('aSize', new BufferAttribute(sizes, 1));

    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLife: { value: opts.life ?? 0.55 },
        uGravity: { value: opts.gravity ?? 7.5 },
        uPixelScale: { value: 1 },
        uSize: { value: opts.size ?? 9 },
        uOrigin: { value: new Vector3() },
      },
      vertexShader: sparkVertex,
      fragmentShader: sparkFragment,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    super(geo, mat);
    this.uniforms = mat.uniforms;
    this.vel = vel;
    this.colorAttr = colors;
    this.palette = (opts.colors ?? [0xfff2c0, 0xffd27a, 0xbfe8ff, 0xffffff]).map((c) => new Color(c));
    this.baseSpeed = opts.speed ?? 5.5;
    this.bias = new Vector3(...(opts.bias ?? [0, 0.35, 0])).normalize();
    this.focus = opts.focus ?? 0.45;
    this.frustumCulled = false;
    this.renderOrder = 42;
    this.visible = false;
    this.name = 'spark-burst';
  }

  /** Fire the burst from a world position. */
  emit(origin: Vector3 | { x: number; y: number; z: number }, speedScale = 1): void {
    (this.uniforms['uOrigin']!.value as Vector3).set(origin.x, origin.y, origin.z);
    const count = this.vel.length / 3;
    for (let i = 0; i < count; i++) {
      // Random point on a sphere, pulled toward the bias direction.
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      let vx = s * Math.cos(th);
      let vy = u;
      let vz = s * Math.sin(th);
      vx += this.bias.x * this.focus * 2;
      vy += this.bias.y * this.focus * 2;
      vz += this.bias.z * this.focus * 2;
      const len = Math.hypot(vx, vy, vz) || 1;
      const sp = this.baseSpeed * speedScale * (0.35 + Math.random() * 1.2);
      this.vel[i * 3] = (vx / len) * sp;
      this.vel[i * 3 + 1] = (vy / len) * sp;
      this.vel[i * 3 + 2] = (vz / len) * sp * 0.6;

      const c = this.palette[(Math.random() * this.palette.length) | 0]!;
      this.colorAttr[i * 3] = c.r;
      this.colorAttr[i * 3 + 1] = c.g;
      this.colorAttr[i * 3 + 2] = c.b;
    }
    (this.geometry.getAttribute('aVel') as BufferAttribute).needsUpdate = true;
    (this.geometry.getAttribute('aColor') as BufferAttribute).needsUpdate = true;
    this.time = 0;
    this.live = true;
    this.visible = true;
    this.uniforms['uTime']!.value = 0;
  }

  setPixelScale(v: number): void {
    this.uniforms['uPixelScale']!.value = v;
  }

  /** @param dt seconds */
  update(dt: number): void {
    if (!this.live) return;
    this.time += dt;
    this.uniforms['uTime']!.value = this.time;
    if (this.time > (this.uniforms['uLife']!.value as number) * 1.4) {
      this.live = false;
      this.visible = false;
    }
  }

  override dispose(): void {
    this.geometry.dispose();
    (this.material as ShaderMaterial).dispose();
    this.removeFromParent();
  }
}

// ---------------------------------------------------------------------------
// Impact flash
// ---------------------------------------------------------------------------

export interface ImpactFlashOptions {
  color?: number | string;
  size?: number;
}

/** A soft additive bloom at the point of impact. Cheap, and it sells the hit. */
export class ImpactFlash extends Mesh {
  private readonly tweens = new TweenGroup();
  private readonly baseSize: number;

  constructor(opts: ImpactFlashOptions = {}) {
    const mat = new MeshBasicMaterial({
      map: paintedCanvasTexture(
        radialCanvas(256, [
          [0, 1],
          [0.18, 0.75],
          [0.5, 0.18],
          [1, 0],
        ]),
      ),
      color: opts.color ?? 0xfff0c8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      fog: false,
    });
    super(new PlaneGeometry(1, 1), mat);
    this.baseSize = opts.size ?? 2.6;
    this.frustumCulled = false;
    this.renderOrder = 41;
    this.visible = false;
    this.name = 'impact-flash';
  }

  play(at: Vector3 | { x: number; y: number; z: number }, ms = 260, scale = 1): void {
    this.position.set(at.x, at.y, at.z);
    this.visible = true;
    const mat = this.material as MeshBasicMaterial;
    this.tweens.killAll();
    this.tweens.to(0, 1, {
      durationMs: ms,
      easing: 'quadOut',
      onUpdate: (t) => {
        const s = this.baseSize * scale * (0.35 + t * 1.15);
        this.scale.set(s, s, 1);
        mat.opacity = (1 - t) * 0.95;
      },
      onComplete: () => {
        this.visible = false;
        mat.opacity = 0;
      },
    });
  }

  update(dt: number, camera?: Camera): void {
    this.tweens.update(dt);
    if (camera && this.visible) this.quaternion.copy(camera.quaternion);
  }

  override dispose(): void {
    this.tweens.killAll();
    this.geometry.dispose();
    const m = this.material as MeshBasicMaterial;
    m.map?.dispose();
    m.dispose();
    this.removeFromParent();
  }
}

/** Bundle of the three effects above, ready to drop into a scene. */
export class HitEffects extends Group {
  readonly slash: SlashArc;
  readonly sparks: SparkBurst;
  readonly flash: ImpactFlash;

  constructor(slash: SlashArcOptions = {}, sparks: SparkBurstOptions = {}, flash: ImpactFlashOptions = {}) {
    super();
    this.slash = new SlashArc(slash);
    this.sparks = new SparkBurst(sparks);
    this.flash = new ImpactFlash(flash);
    this.add(this.slash, this.sparks, this.flash);
    this.name = 'hit-effects';
  }

  update(dt: number, camera?: Camera): void {
    this.slash.update(dt, camera);
    this.sparks.update(dt);
    this.flash.update(dt, camera);
  }

  override dispose(): void {
    this.slash.dispose();
    this.sparks.dispose();
    this.flash.dispose();
    this.removeFromParent();
  }
}
