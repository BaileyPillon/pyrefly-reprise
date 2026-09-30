import {
  Color,
  DoubleSide,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type BufferGeometry,
  type Object3D,
  type Scene,
} from 'three';
import { paintedVertexShader } from '../../shaders/PaintedShader.ts';

/**
 * Option B "Living Paintings": what B adds to the painted figures, found by walking the scene
 * (no hook in `PaintedActor`, which is 2022 lines and stays as it is).
 *
 * - **B5 cast shadow**: every figure plane gets a second quad lying on the floor, carrying the
 *   figure's own alpha (read from a deeper mip the further it reaches, so it softens with length),
 *   laid away from the scene's key light and fading toward the head. It follows every pose change
 *   because it reads the plane's own `map` uniform cell, and it lifts off the ground when the
 *   figure hops, because it is laid on the floor, not on the figure.
 * - **B4 secondary sway** (sub-switch `sway`; **re-offers the goal of `cutout-animation`, which
 *   Bailey declined on 19 Sep**, by another method): the plane is subdivided and bent in the
 *   vertex shader, the feet pinned (nothing moves below 35 % of the height) and the head and hair
 *   lagging. Human-scale figures only; the big bosses (Mortiorchis, Bahamut, Ixion, Anima) keep
 *   their own motion.
 *
 * Game case: both (plumbing); the shadow's direction, length and tint are each room's.
 */

export interface ShadowSpec {
  /** Where the key light comes from (world), as in the scene's `LightRig.keyFrom`. */
  key: [number, number, number];
  /** Shadow length as a fraction of the figure's height. */
  length: number;
  opacity: number;
  color: number;
}

const SWAY_VERT = /* glsl */ `
  uniform vec4 fxSway;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float w = smoothstep(0.35, 1.0, uv.y);
    float t = fxSway.w * fxSway.y * 6.2831853 + fxSway.z;
    p.x += fxSway.x * w * w * (sin(t - uv.y * 1.3) + 0.35 * sin(t * 2.3 + 1.7 - uv.y * 2.4));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

// (Never textually equal to the painted vertex shader: `scan` finds figures by that string.)
const SHADOW_VERT = /* glsl */ `
  // fx-b cast shadow
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHADOW_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity;
  uniform float dissolve;
  uniform float uStrength;
  uniform float uFoot;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float along = clamp((vUv.y - uFoot) / max(0.05, 1.0 - uFoot), 0.0, 1.0);
    float a = texture2D(map, vUv, mix(1.5, 4.5, along)).a;
    a = smoothstep(0.08, 0.6, a);
    float fade = (1.0 - along * 0.55) * (1.0 - smoothstep(0.75, 1.0, along));
    float below = step(uFoot - 0.02, vUv.y);
    gl_FragColor = vec4(uColor, a * fade * below * opacity * (1.0 - dissolve) * uStrength);
    #include <colorspace_fragment>
  }
`;

interface Tracked {
  slot: Mesh;
  actor: Object3D;
  shadow: Mesh;
  shadowMat: ShaderMaterial;
  swayable: boolean;
  phase: number;
  flat: BufferGeometry;
  bent: BufferGeometry | null;
}

const NO_SWAY = /mortiorchis|bahamut|ixion|anima|vegnagun|sin|yu-yevon/i;
const scratch = { c: new Vector3(), x: new Vector3(), y: new Vector3(), f: new Vector3(), m: new Matrix4() };

function actorOf(o: Object3D): Object3D {
  for (let n: Object3D | null = o; n; n = n.parent) if ('worldHeight' in n) return n;
  return o.parent ?? o;
}

function shown(o: Object3D): boolean {
  for (let n: Object3D | null = o; n; n = n.parent) if (!n.visible) return false;
  return true;
}

export class Figures {
  private readonly tracked = new Map<Mesh, Tracked>();
  private readonly root: Object3D;
  private readonly scene: Scene;
  private readonly spec: ShadowSpec;
  private readonly dir = new Vector3();
  private scanClock = 0;
  private swayOn = false;

  constructor(scene: Scene, root: Object3D, spec: ShadowSpec) {
    this.scene = scene;
    this.root = root;
    this.spec = spec;
    this.dir.set(-spec.key[0], 0, -spec.key[2]).normalize();
  }

  get count(): number {
    return this.tracked.size;
  }

  private scan(): void {
    const live = new Set<Mesh>();
    this.scene.traverse((o) => {
      const m = o as Mesh;
      const mat = m.material as ShaderMaterial | undefined;
      if (!m.isMesh || !mat || !(mat as { isShaderMaterial?: boolean }).isShaderMaterial || m.userData['fxb']) return;
      if (mat.vertexShader !== paintedVertexShader && mat.vertexShader !== SWAY_VERT) return;
      const actor = actorOf(m);
      if (!('worldHeight' in actor)) return;
      live.add(m);
      if (this.tracked.has(m)) return;
      const u = mat.uniforms;
      const shadowMat = new ShaderMaterial({
        uniforms: {
          map: u['map']!,
          opacity: u['opacity'] ?? { value: 1 },
          dissolve: u['dissolve'] ?? { value: 0 },
          uStrength: { value: 0 },
          uFoot: { value: 0.1 },
          uColor: { value: new Color(this.spec.color) },
        },
        vertexShader: SHADOW_VERT,
        fragmentShader: SHADOW_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        fog: false,
        side: DoubleSide,
      });
      const shadow = new Mesh(new PlaneGeometry(1, 1), shadowMat);
      shadow.matrixAutoUpdate = false;
      shadow.frustumCulled = false;
      shadow.renderOrder = 3;
      shadow.name = 'fx-b-cast-shadow';
      shadow.userData['fxb'] = true;
      this.root.add(shadow);
      const name = actor.name || m.name;
      this.tracked.set(m, {
        slot: m,
        actor,
        shadow,
        shadowMat,
        swayable: !NO_SWAY.test(name),
        phase: (name.length * 1.37 + name.charCodeAt(0)) % 6.28,
        flat: m.geometry,
        bent: null,
      });
      if (this.swayOn) this.bend(this.tracked.get(m)!, true);
    });
    for (const [m, t] of this.tracked) {
      if (live.has(m)) continue;
      t.shadow.geometry.dispose();
      t.shadowMat.dispose();
      t.shadow.removeFromParent();
      t.bent?.dispose();
      this.tracked.delete(m);
    }
  }

  private bend(t: Tracked, on: boolean): void {
    const mat = t.slot.material as ShaderMaterial;
    if (on && t.swayable) {
      t.bent ??= new PlaneGeometry(1, 1, 6, 12);
      mat.uniforms['fxSway'] ??= { value: [0, 0.35, t.phase, 0] };
      if (mat.vertexShader !== SWAY_VERT) {
        mat.vertexShader = SWAY_VERT;
        mat.needsUpdate = true;
      }
      t.slot.geometry = t.bent;
    } else {
      if (mat.vertexShader !== paintedVertexShader) {
        mat.vertexShader = paintedVertexShader;
        mat.needsUpdate = true;
      }
      t.slot.geometry = t.flat;
    }
  }

  /** Sway on or off for every tracked figure (off restores the flat plane and the stock shader). */
  setSway(on: boolean): void {
    if (on === this.swayOn) return;
    this.swayOn = on;
    for (const t of this.tracked.values()) this.bend(t, on);
  }

  /**
   * @param dt seconds (0 while frozen); `shadow` the dial times on/off, `sway` the sway
   * amplitude (fraction of the plane's width at the head).
   */
  update(dt: number, time: number, shadow: number, sway: number): void {
    this.scanClock -= dt;
    if (this.scanClock <= 0 || this.tracked.size === 0) {
      this.scanClock = 0.5;
      this.scan();
    }
    const { c, x, y, f, m } = scratch;
    for (const t of this.tracked.values()) {
      const mat = t.slot.material as ShaderMaterial;
      const sw = mat.uniforms['fxSway']?.value as number[] | undefined;
      if (sw) {
        sw[0] = this.swayOn ? sway : 0;
        sw[3] = time;
      }
      const visible = shadow > 0 && shown(t.slot);
      t.shadow.visible = visible;
      if (!visible) continue;
      t.slot.updateWorldMatrix(true, false);
      const e = t.slot.matrixWorld.elements;
      c.set(e[12]!, e[13]!, e[14]!);
      x.set(e[0]!, e[1]!, e[2]!);
      y.set(e[4]!, e[5]!, e[6]!);
      const height = y.length();
      if (height < 1e-3 || Math.abs(y.y) < 1e-3) {
        t.shadow.visible = false;
        continue;
      }
      // The plane's uv row that sits on the actor's own floor line (its feet).
      t.actor.getWorldPosition(f);
      const foot = Math.min(0.9, Math.max(0, 0.5 + (f.y - c.y) / y.y));
      t.shadowMat.uniforms['uFoot']!.value = foot;
      t.shadowMat.uniforms['uStrength']!.value = this.spec.opacity * shadow;
      // Width across the shadow's own direction (so a side light never collapses it to a line),
      // keeping the figure's mirror sense.
      const width = Math.hypot(x.x, x.z) || x.length();
      const side = x.x * -this.dir.z + x.z * this.dir.x >= 0 ? 1 : -1;
      const len = height * this.spec.length;
      const footX = c.x + y.x * (foot - 0.5);
      const footZ = c.z + y.z * (foot - 0.5);
      // Local (u - 0.5, v - 0.5) -> foot + W (u - 0.5) + L (v - foot).
      m.set(
        -this.dir.z * width * side, this.dir.x * len, 0, footX + this.dir.x * len * (0.5 - foot),
        0, 0, 1, 0.014,
        this.dir.x * width * side, this.dir.z * len, 0, footZ + this.dir.z * len * (0.5 - foot),
        0, 0, 0, 1,
      );
      t.shadow.matrix.copy(m);
      t.shadow.matrixWorldNeedsUpdate = true;
    }
  }

  dispose(): void {
    this.setSway(false);
    for (const t of this.tracked.values()) {
      t.shadow.geometry.dispose();
      t.shadowMat.dispose();
      t.shadow.removeFromParent();
      t.bent?.dispose();
    }
    this.tracked.clear();
  }
}
