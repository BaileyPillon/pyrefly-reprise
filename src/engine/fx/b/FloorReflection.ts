import { Color, PlaneGeometry, Vector2 } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

/**
 * Option B "Living Paintings" (B5): a floor that reflects. A mirrored camera renders the room at
 * half resolution (three's `Reflector`), and the floor shows it through a slow ripple, a small
 * blur and a radial fade, so the glowing ice panes and the fighters stand on their own light.
 *
 * Per room (`ambient/*.ts`): Macalania's ice (canon: an ice palace on a frozen lake) 0.34;
 * Bevelle's riveted steel a faint sheen (ours); snow and dry stone none. Phone tier and Low
 * effects: off. Reduce motion: the ripple stands still.
 *
 * Game case: FFX (Macalania, the lake) and FFX-2 (Bevelle, faint), each its own strength.
 */

export interface ReflectSpec {
  opacity: number;
  /** The floor patch: centre (x, z) and size, world units. */
  center: [number, number];
  size: [number, number];
  /** Fade radius from the centre, world units. */
  radius: number;
  tint: number;
  ripple: number;
}

const SHADER = {
  name: 'PyreflyFloorReflection',
  uniforms: {
    color: { value: new Color(0xffffff) },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTime: { value: 0 },
    uOpacity: { value: 0.3 },
    uRipple: { value: 0.004 },
    uCenter: { value: new Vector2() },
    uRadius: { value: 10 },
  },
  vertexShader: /* glsl */ `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4(position, 1.0);
      vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uOpacity;
    uniform float uRipple;
    uniform vec2 uCenter;
    uniform float uRadius;
    varying vec4 vUv;
    varying vec3 vWorld;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float vnoise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    void main() {
      vec2 uv = vUv.xy / vUv.w;
      vec2 w = vWorld.xz;
      vec2 rip = vec2(vnoise(w * vec2(1.4, 5.0) + vec2(uTime * 0.25, 0.0)), vnoise(w * vec2(1.2, 4.0) + vec2(7.0, -uTime * 0.2))) - 0.5;
      uv += rip * uRipple;
      vec2 px = vec2(0.0015, 0.0022);
      vec3 c = texture2D(tDiffuse, uv).rgb * 0.36
             + texture2D(tDiffuse, uv + vec2(px.x, 0.0)).rgb * 0.16 + texture2D(tDiffuse, uv - vec2(px.x, 0.0)).rgb * 0.16
             + texture2D(tDiffuse, uv + vec2(0.0, px.y)).rgb * 0.16 + texture2D(tDiffuse, uv - vec2(0.0, px.y)).rgb * 0.16;
      float d = length(w - uCenter) / uRadius;
      float fade = 1.0 - smoothstep(0.35, 1.0, d);
      gl_FragColor = vec4(c * color, clamp(uOpacity * fade, 0.0, 1.0));
      #include <colorspace_fragment>
    }
  `,
};

export class FloorReflection {
  readonly mesh: Reflector;
  private readonly spec: ReflectSpec;

  constructor(spec: ReflectSpec, width: number, height: number) {
    this.spec = spec;
    this.mesh = new Reflector(new PlaneGeometry(spec.size[0], spec.size[1]), {
      textureWidth: Math.max(256, Math.round(width / 2)),
      textureHeight: Math.max(256, Math.round(height / 2)),
      clipBias: 0.003,
      shader: SHADER,
      multisample: 0,
    });
    const mat = this.mesh.material as unknown as {
      transparent: boolean;
      depthWrite: boolean;
      uniforms: Record<string, { value: unknown }>;
    };
    mat.transparent = true;
    mat.depthWrite = false;
    mat.uniforms['color']!.value = new Color(spec.tint);
    (mat.uniforms['uCenter']!.value as Vector2).set(spec.center[0], spec.center[1]);
    mat.uniforms['uRadius']!.value = spec.radius;
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(spec.center[0], 0.006, spec.center[1]);
    this.mesh.renderOrder = -49;
    this.mesh.name = 'fx-b-floor-reflection';
  }

  update(time: number, gain: number, rippling: boolean): void {
    const u = (this.mesh.material as unknown as { uniforms: Record<string, { value: number }> }).uniforms;
    u['uTime']!.value = time;
    u['uOpacity']!.value = this.spec.opacity * gain;
    u['uRipple']!.value = rippling ? this.spec.ripple : this.spec.ripple * 0.5;
    this.mesh.visible = gain > 0;
  }

  dispose(): void {
    this.mesh.dispose();
    this.mesh.geometry.dispose();
    this.mesh.removeFromParent();
  }
}
