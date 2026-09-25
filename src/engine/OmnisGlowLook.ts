/**
 * **Chapter XII — Seymour Omnis glows red, as a live effect (O-8).**
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The glow belongs to the FFX
 * Seymour Omnis fight (`research/ffx-seymour-omnis.md` §4.4, "he glows red"
 * before Dispel and Ultima [verified: 3 sources]). The tap is installed on the
 * FFX HUD only (`BattleScreenWiring.createHud`), and it does nothing unless the
 * battle carries the Omnis state (`omnis.state`, set only by the Omnis
 * formation's setup).
 *
 * **On whose word.** Bailey adopted every Chapter XII recommendation (D-145,
 * 2026-09-25): O-1 A's glow frame (`docs/concepts/chapters/omnis/o1-omnis/
 * a-glow-frame.jpg`, a red tint and a halo) and the follow-up that in the game
 * it is a live effect, "a pulse plus particles" (the options README, O-1;
 * `INSTALLED.md`: "tint, halo, pulse, particles"; no glow painting exists).
 *
 * **What is the frame's and what is ours.** The tint and the halo are the
 * frame's own recipe (`scripts/omnis_build.py#red_glow`): each pixel mixed 38 %
 * toward `(150 + 0.4 L, 10 + 0.25 L, 20 + 0.25 L)`, L the mean of its RGB, and a
 * `(255, 40, 40)` halo at 85 % hugging the silhouette. The pulse (its period and
 * depth), the embers (count, colours, box) and the fades are **ours**.
 *
 * **When.** From the moment the attack counter fills (the engine's telegraph,
 * "Seymour Omnis glows red") through Dispel and Ultima; it fades after Ultima
 * (`omnis.state` leaves `red` / `dispelled`).
 *
 * **How.** Three layers; the locked painting is untouched:
 * - the tint: `glowAmount` / `glowOffset` / `glowSlope` in `PaintedShader.ts`,
 *   compiled in by the `PAINTED_GLOW` define on this figure's own plane
 *   materials only (the `PAINTED_CAST` pattern of `OversoulLook.ts`);
 * - the halo: one plane behind each of the figure's painted planes, sharing its
 *   texture and opacity cells, drawing the silhouette dilated and blurred (the
 *   texture's own mip chain) in red;
 * - the embers: one {@link ParticleField} (the `embers` preset, recoloured red)
 *   around the figure, following it and fading with it.
 *
 * Presentation only: nothing here reaches into `src/battle` beyond its types (rule 1).
 */

import {
  Color,
  DoubleSide,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
  type Object3D,
  type WebGLRenderer,
} from 'three';
import type { AtbSnapshot, BattleEvent, BattleState, TurnPreview } from '../battle/common/types.ts';
import type { HudPort } from './HudPort.ts';
import { ParticleField, ParticlePresets } from './Particles.ts';

/** The Omnis combatant and the state key its rules keep (`seymour-omnis-rules.ts`). */
export const OMNIS_GLOW_ID = 'seymour-omnis';
export const OMNIS_STATE_FLAG = 'omnis.state';

export const OMNIS_GLOW = {
  /** The frame's grade: 38 % toward `(150 + 0.4 L, 10 + 0.25 L, 20 + 0.25 L) / 255`. */
  tint: { amount: 0.38, offset: [150 / 255, 10 / 255, 20 / 255] as const, slope: [0.4, 0.25, 0.25] as const },
  /** The frame's halo, (255, 40, 40) at 85 %. Its reach and softness on this plane are ours. */
  halo: { color: 0xff2828, alpha: 0.85, pad: 0.07, reach: 0.045, lod: 4.0 },
  /** Ours: one breath every 1.6 s, never below 70 % of the frame's strength. */
  pulse: { periodMs: 1600, floor: 0.7 },
  /** Ours: red embers rising around him. */
  embers: {
    count: 44,
    size: 20,
    colors: [0xff3a2e, 0xff6a4a, 0xc81e1e, 0xffa08a],
    bounds: { x: 2.4, y: 2.6, z: 0.8 },
    lift: 2.4,
    forward: 0.35,
    drift: [0, 0.55, 0] as [number, number, number],
  },
  /** The height the embers' box was drawn for; a taller figure scales it. */
  refHeight: 4.1,
  /** Ours: how long the glow takes to come on and to go. */
  fadeInMs: 600,
  fadeOutMs: 900,
} as const;

/** What the glow needs from a figure. `PaintedActor` is one. */
export interface OmnisGlowFigure extends Object3D {
  readonly alpha: number;
  readonly height: number;
}

export interface OmnisGlowField {
  actor(id: string): OmnisGlowFigure | undefined;
}

type Cell<T> = { value: T };

/** A painted plane's material (the cells `PaintedActor` builds), with the mesh that draws it. */
function paintedPlanesOf(figure: Object3D): Array<{ mesh: Mesh; material: ShaderMaterial }> {
  const out: Array<{ mesh: Mesh; material: ShaderMaterial }> = [];
  figure.traverse((o) => {
    const mesh = o as Mesh;
    const m = mesh.material as ShaderMaterial | undefined;
    const u = m?.uniforms;
    if (mesh.isMesh && u && 'desaturate' in u && 'rimStrength' in u && 'dissolve' in u && 'map' in u) out.push({ mesh, material: m });
  });
  return out;
}

const HALO_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * The silhouette, spread by `reach` and softened (a 25-tap ring average over the
 * texture's own mip chain), in `haloColor`. Alpha fades out over the texture's
 * outer 5 %, so the idle's canvas-cut strips (INSTALLED.md, "Flags") cast no
 * straight-edged halo.
 */
const HALO_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float opacity;
  uniform vec3 haloColor;
  uniform float haloAmount;
  uniform float pad;
  uniform float reach;
  uniform float lod;
  varying vec2 vUv;
  float at(vec2 uv) {
    vec2 e = min(uv, 1.0 - uv);
    float edge = smoothstep(0.0, 0.05, e.x) * smoothstep(0.0, 0.05, e.y);
    if (edge <= 0.0) return 0.0;
    return texture2D(map, uv, lod).a * edge;
  }
  void main() {
    vec2 uv = (vUv - 0.5) * (1.0 + 2.0 * pad) + 0.5;
    float a = at(uv);
    for (int i = 0; i < 12; i++) {
      float t = float(i) * 0.5235988;
      vec2 d = vec2(cos(t), sin(t));
      a += at(uv + d * reach * 0.5) + at(uv + d * reach);
    }
    a /= 25.0;
    float k = clamp(a * 1.7, 0.0, 1.0) * haloAmount * opacity;
    if (k < 0.004) discard;
    gl_FragColor = vec4(haloColor, k);
  }
`;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** The red glow on one figure. Off until {@link setOn}. */
export class OmnisGlowLook {
  /** 0 = the painting as painted, 1 = the frame's glow at the top of a breath. */
  private k = 0;
  private on = false;
  private clock = 0;
  private readonly glowAmount: Cell<number> = { value: 0 };
  private readonly haloAmount: Cell<number> = { value: 0 };
  private readonly halos: Mesh[] = [];
  private embers: ParticleField | null = null;
  private disposed = false;

  constructor(readonly figure: OmnisGlowFigure) {
    const offset = new Vector3(...OMNIS_GLOW.tint.offset);
    const slope = new Vector3(...OMNIS_GLOW.tint.slope);
    for (const { mesh, material } of paintedPlanesOf(figure)) {
      material.uniforms['glowAmount'] = this.glowAmount;
      material.uniforms['glowOffset'] = { value: offset };
      material.uniforms['glowSlope'] = { value: slope };
      material.defines = { ...(material.defines ?? {}), PAINTED_GLOW: '' };
      material.needsUpdate = true; // a new program key, so the cells above are in its uniform list
      const h = OMNIS_GLOW.halo;
      const halo = new Mesh(
        new PlaneGeometry(1 + 2 * h.pad, 1 + 2 * h.pad),
        new ShaderMaterial({
          uniforms: {
            map: material.uniforms['map']!, // shared cells: a pose swap or a fade reaches the halo too
            opacity: material.uniforms['opacity']!,
            haloColor: { value: new Color(h.color) },
            haloAmount: this.haloAmount,
            pad: { value: h.pad },
            reach: { value: h.reach },
            lod: { value: h.lod },
          },
          vertexShader: HALO_VERTEX,
          fragmentShader: HALO_FRAGMENT,
          transparent: true,
          depthWrite: false,
          depthTest: true,
          side: DoubleSide,
        }),
      );
      halo.name = 'omnis-glow-halo';
      halo.position.z = -0.002;
      halo.renderOrder = mesh.renderOrder - 0.5;
      halo.frustumCulled = false;
      mesh.add(halo);
      this.halos.push(halo);
    }
  }

  /** 0..1 now, pulse included (tests, the debug snapshot). */
  get amount(): number {
    return this.glowAmount.value / OMNIS_GLOW.tint.amount;
  }

  get isOn(): boolean {
    return this.on;
  }

  get field(): ParticleField | null {
    return this.embers;
  }

  /** Glow (or stop); `instant` skips the fade (a figure staged mid-glow). */
  setOn(on: boolean, instant = false): void {
    if (this.disposed) return;
    this.on = on;
    if (instant) this.k = on ? 1 : 0;
    if (on) this.ensureEmbers();
    this.apply();
  }

  /** @param dt seconds. */
  update(dt: number): void {
    if (this.disposed) return;
    this.clock += dt * 1000;
    const step = (dt * 1000) / (this.on ? OMNIS_GLOW.fadeInMs : OMNIS_GLOW.fadeOutMs);
    this.k = this.on ? Math.min(1, this.k + step) : Math.max(0, this.k - step);
    if (this.k > 0) this.ensureEmbers();
    this.embers?.update(dt);
    this.apply();
  }

  dispose(): void {
    if (this.disposed) return;
    this.k = 0;
    this.apply();
    this.disposed = true;
    for (const h of this.halos) {
      h.removeFromParent();
      h.geometry.dispose();
      (h.material as ShaderMaterial).dispose();
    }
    this.halos.length = 0;
    this.embers?.dispose();
    this.embers = null;
  }

  private ensureEmbers(): void {
    if (this.embers || !this.figure.parent) return;
    const e = OMNIS_GLOW.embers;
    const s = this.scale();
    const field = new ParticleField(
      ParticlePresets.embers({
        count: e.count,
        size: e.size,
        colors: [...e.colors],
        bounds: { x: e.bounds.x * s, y: e.bounds.y * s, z: e.bounds.z * s },
        drift: e.drift,
        opacity: 0,
      }),
    );
    field.name = 'omnis-glow-embers';
    field.onBeforeRender = (renderer: WebGLRenderer): void => {
      field.setPixelScale(Math.max(0.5, (renderer.domElement.height || 900) / 900));
    };
    this.figure.parent.add(field);
    this.embers = field;
  }

  private scale(): number {
    const h = this.figure.height;
    return h > 0 ? h / OMNIS_GLOW.refHeight : 1;
  }

  private apply(): void {
    const p = OMNIS_GLOW.pulse;
    const breath = p.floor + (1 - p.floor) * (0.5 + 0.5 * Math.sin((this.clock / p.periodMs) * Math.PI * 2));
    const k = easeInOut(this.k) * breath;
    this.glowAmount.value = OMNIS_GLOW.tint.amount * k;
    this.haloAmount.value = OMNIS_GLOW.halo.alpha * k;
    for (const h of this.halos) h.visible = k > 0.001;
    const embers = this.embers;
    if (!embers) return;
    const s = this.scale();
    const pos = this.figure.position;
    embers.position.set(pos.x, pos.y + OMNIS_GLOW.embers.lift * s, pos.z + OMNIS_GLOW.embers.forward * s);
    const present = this.figure.visible ? Math.max(0, Math.min(1, this.figure.alpha)) : 0;
    embers.setOpacity(0.9 * easeInOut(this.k) * present);
    embers.visible = this.k * present > 0.001;
  }
}

/** Whether the state says he glows (§4.4: from the filled counter through Ultima). */
export function omnisGlowsIn(state: Pick<BattleState, 'flags'> | null): boolean {
  const v = state?.flags[OMNIS_STATE_FLAG];
  return v === 'red' || v === 'dispelled';
}

/** The engine's telegraph at the moment the counter fills (`seymour-omnis-rules.ts#runOmnisTurnEnd`). */
export function isOmnisGlowLine(event: BattleEvent): boolean {
  return event.type === 'message' && event.kind === 'telegraph' && /glows red/i.test(event.text);
}

/** Keeps the glow on Seymour Omnis's staged figure in step with the fight. */
export class OmnisGlow {
  private look: OmnisGlowLook | null = null;
  private wanted = false;
  private present = false;

  constructor(private readonly field: () => OmnisGlowField | null) {}

  get current(): OmnisGlowLook | null {
    return this.look;
  }

  sync(state: BattleState): void {
    this.present = typeof state.flags[OMNIS_STATE_FLAG] === 'string' && !state.result;
    this.wanted = this.present && omnisGlowsIn(state);
    this.reconcile();
  }

  onEvent(event: BattleEvent): void {
    if (!this.present || !isOmnisGlowLine(event)) return;
    this.wanted = true; // on the beat the counter filled, before the step's sync
    this.reconcile();
  }

  update(dt: number): void {
    this.reconcile();
    this.look?.update(dt);
  }

  dispose(): void {
    this.look?.dispose();
    this.look = null;
    this.present = false;
  }

  private reconcile(): void {
    const figure = this.present ? this.field()?.actor(OMNIS_GLOW_ID) : undefined;
    if (this.look && this.look.figure !== figure) {
      this.look.dispose();
      this.look = null;
    }
    if (!figure) return;
    if (!this.look) {
      this.look = new OmnisGlowLook(figure);
      if (this.wanted) this.look.setOn(true, true); // a figure staged mid-glow
    }
    if (this.look.isOn !== this.wanted) this.look.setOn(this.wanted);
  }
}

/** Tap a HUD's sync, event stream and frame clock for the glow (the `withOversoulLook` shape). */
export function withOmnisGlow<T extends HudPort>(hud: T, field: () => OmnisGlowField | null): T {
  const glow = new OmnisGlow(field);
  const sync = hud.sync.bind(hud);
  const onEvent = hud.onEvent.bind(hud);
  const update = hud.update?.bind(hud);
  const unmount = hud.unmount.bind(hud);
  hud.sync = (state: BattleState, preview: TurnPreview[] | AtbSnapshot): void => {
    sync(state, preview);
    glow.sync(state);
  };
  hud.onEvent = (event: BattleEvent): Promise<void> | void => {
    const out = onEvent(event);
    glow.onEvent(event);
    return out;
  };
  hud.update = (dt: number): void => {
    update?.(dt);
    glow.update(dt);
  };
  hud.unmount = (): void => {
    glow.dispose();
    unmount();
  };
  (hud as T & { omnisGlow?: OmnisGlow }).omnisGlow = glow;
  return hud;
}
