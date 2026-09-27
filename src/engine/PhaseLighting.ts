/**
 * D-224, option A (Bailey, 2026-09-26): the arena turns when the boss does.
 * On a canon phase beat (`phaseCanon.ts`) the scene's grade, its fog, a floor
 * glow under the party and a bounce and rim tint on the figures move to that
 * phase's look over about 1.5 s. PaintedActors are unlit by design, so this is
 * the reduced version the pick named: hue and exposure only, never albedo.
 *
 * - At most three light changes start in any second; a fourth waits its turn.
 * - `reduceFlashes()` (default false; the accessibility batch wires it) skips
 *   the tween and lands the look at once.
 * - A charge ladder's look is transient: `'restore'` returns to the phase
 *   underneath it once the payload has resolved.
 *
 * Game case: both (plumbing); each trigger is its own game's (`PHASE_TRIGGERS`).
 * Registered on the stage as its `lighting` port (`BattlePresenterStage.ts`).
 */

import { AdditiveBlending, CircleGeometry, Color, Mesh, ShaderMaterial, type Fog, type FogExp2, type Scene } from 'three';
import type { ScenePalette } from './Renderer.ts';
import { MIN_PHASE_GAP_S, PHASE_GRADES, PHASE_TWEEN_S, TRANSIENT_PHASES, type PhaseCue, type PhaseGrade, type PhaseId } from './phaseCanon.ts';

/** The renderer's palette hooks (`Renderer.applyPalette`). */
export interface GradeTarget {
  readonly palette: ScenePalette | null;
  applyPalette(p: ScenePalette): void;
}

/** What a phase does to a figure (`PaintedActor`). */
export interface PhaseFigure {
  setBounceLight(colour: number | string, strength: number): void;
  setRimLight(colour: number | string, strength: number): void;
}

export interface PhaseLightingOptions {
  scene: Scene;
  grade?: GradeTarget | null | undefined;
  figures(): Iterable<PhaseFigure>;
  /** Where the floor glow lies: the party's centre on the floor, or null. */
  partyCentre(): { x: number; z: number } | null;
  /** The rim every figure was staged with, restored at `base`. */
  baseRim: { color: number | string; strength: number };
  /** REDUCE FLASHES: skip the tween. Default false. */
  reduceFlashes?: () => boolean;
}

/** One frame's look, flattened so two can be mixed. */
interface Look {
  gain: [number, number, number];
  exposure: number;
  shadowTint: [number, number, number] | null;
  shadowTintAdd: number;
  vignetteAdd: number;
  fog: Color | null;
  floor: Color;
  floorStrength: number;
  rim: Color | null;
}

function lookOf(g: PhaseGrade): Look {
  return {
    gain: [...g.gain],
    exposure: g.exposure,
    shadowTint: g.shadowTint ? [...g.shadowTint] : null,
    shadowTintAdd: g.shadowTintAdd ?? 0,
    vignetteAdd: g.vignetteAdd ?? 0,
    fog: g.fog ? new Color(g.fog) : null,
    floor: new Color(g.floor?.color ?? '#000000'),
    floorStrength: g.floor?.strength ?? 0,
    rim: g.rim ? new Color(g.rim) : null,
  };
}

const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const smooth = (u: number): number => u * u * (3 - 2 * u);

/** A soft round glow on the floor, drawn in the shader so it needs no texture. */
function floorGlow(): Mesh {
  const mat = new ShaderMaterial({
    uniforms: { uColor: { value: new Color(0) }, uStrength: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uStrength; varying vec2 vUv;
      void main() {
        float r = length(vUv - 0.5) * 2.0;
        float a = pow(clamp(1.0 - r, 0.0, 1.0), 1.8) * uStrength;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const mesh = new Mesh(new CircleGeometry(5.5, 48), mat);
  mesh.name = 'phase-floor-glow';
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 2;
  mesh.visible = false;
  return mesh;
}

export class PhaseLighting {
  private floorPhase: PhaseId = 'base';
  private target: PhaseId = 'base';
  private from: Look = lookOf(PHASE_GRADES.base);
  private to: Look = lookOf(PHASE_GRADES.base);
  private now: Look = lookOf(PHASE_GRADES.base);
  private t = PHASE_TWEEN_S;
  private clock = 0;
  private lastStart = -Infinity;
  private pending: PhaseId | null = null;
  private basePalette: ScenePalette | null = null;
  private baseFog: Color | null = null;
  private readonly glow = floorGlow();
  private readonly baseRim: Color;
  /** Every change that started, for the debug snapshot and the tests (clock seconds, phase). */
  readonly starts: Array<[number, PhaseId]> = [];

  constructor(private readonly opts: PhaseLightingOptions) {
    opts.scene.add(this.glow);
    this.baseRim = new Color(opts.baseRim.color);
  }

  get current(): PhaseId {
    return this.target;
  }

  /** The port the presenter calls: a canon phase by id. Unknown ids are ignored. */
  phase(id: string): void {
    if (!Object.hasOwn(PHASE_GRADES, id)) return;
    const p = id as PhaseId;
    if (!TRANSIENT_PHASES.has(p)) {
      this.floorPhase = p;
      // A persistent change under a running ladder waits for the ladder's end.
      if (TRANSIENT_PHASES.has(this.target) && p !== 'base') return;
    }
    this.request(p);
  }

  /** A cue from `phaseCue`: a phase, a return to the one under a ladder, or nothing. */
  cue(c: PhaseCue): void {
    if (c === null) return;
    if (c === 'restore') this.request(this.floorPhase);
    else this.phase(c);
  }

  private request(p: PhaseId): void {
    if (p === this.target && this.pending === null) return;
    if (this.clock - this.lastStart < MIN_PHASE_GAP_S) {
      this.pending = p;
      return;
    }
    this.start(p);
  }

  private start(p: PhaseId): void {
    this.pending = null;
    if (p === this.target) return;
    this.target = p;
    this.from = { ...this.now, gain: [...this.now.gain], shadowTint: this.now.shadowTint ? [...this.now.shadowTint] : null };
    this.to = lookOf(PHASE_GRADES[p]);
    this.t = this.opts.reduceFlashes?.() ? PHASE_TWEEN_S : 0;
    this.lastStart = this.clock;
    this.starts.push([this.clock, p]);
    if (this.t >= PHASE_TWEEN_S) this.apply(1);
  }

  /** @param dt seconds */
  update(dt: number): void {
    this.clock += dt;
    if (this.pending !== null && this.clock - this.lastStart >= MIN_PHASE_GAP_S) this.start(this.pending);
    if (this.t >= PHASE_TWEEN_S) return;
    this.t = Math.min(PHASE_TWEEN_S, this.t + dt);
    this.apply(smooth(this.t / PHASE_TWEEN_S));
  }

  private mix(k: number): Look {
    const a = this.from;
    const b = this.to;
    const st = a.shadowTint || b.shadowTint ? ([0, 1, 2].map((i) => lerp((a.shadowTint ?? b.shadowTint)![i]!, (b.shadowTint ?? a.shadowTint)![i]!, k)) as [number, number, number]) : null;
    const fogA = a.fog ?? b.fog;
    const fogB = b.fog ?? a.fog;
    return {
      gain: [lerp(a.gain[0], b.gain[0], k), lerp(a.gain[1], b.gain[1], k), lerp(a.gain[2], b.gain[2], k)],
      exposure: lerp(a.exposure, b.exposure, k),
      shadowTint: st,
      shadowTintAdd: lerp(a.shadowTintAdd, b.shadowTintAdd, k),
      vignetteAdd: lerp(a.vignetteAdd, b.vignetteAdd, k),
      fog: fogA && fogB ? fogA.clone().lerp(fogB, k) : null,
      // The glow fades out in its old colour and in in its new one.
      floor: (b.floorStrength > 0 ? b.floor : a.floor).clone(),
      floorStrength: lerp(a.floorStrength, b.floorStrength, k),
      rim: a.rim || b.rim ? (a.rim ?? this.baseRim).clone().lerp(b.rim ?? this.baseRim, k) : null,
    };
  }

  /** Put the look `k` of the way from `from` to `to` on the screen. */
  private apply(k: number): void {
    const L = this.mix(k);
    // How far this look is from neutral, for the fog's and the tint's weight.
    const w = Math.max(0, Math.min(1, (1 - L.exposure) * 4 + L.floorStrength));
    this.now = L;
    const g = this.opts.grade;
    if (g) {
      this.basePalette ??= g.palette ? { ...g.palette } : {};
      const b = this.basePalette;
      const gain = b.gain ?? [1, 1, 1];
      const tint = b.shadowTint ?? [0.4, 0.5, 0.85];
      g.applyPalette({
        ...b,
        gain: [gain[0] * L.gain[0], gain[1] * L.gain[1], gain[2] * L.gain[2]],
        exposure: (b.exposure ?? 1) * L.exposure,
        shadowTint: L.shadowTint ? [lerp(tint[0], L.shadowTint[0], w), lerp(tint[1], L.shadowTint[1], w), lerp(tint[2], L.shadowTint[2], w)] : tint,
        shadowTintAmount: (b.shadowTintAmount ?? 0.12) + L.shadowTintAdd,
        vignette: (b.vignette ?? 0.46) + L.vignetteAdd,
      });
    }
    const fog = this.opts.scene.fog as Fog | FogExp2 | null;
    if (fog) {
      this.baseFog ??= fog.color.clone();
      fog.color.copy(this.baseFog);
      if (L.fog) fog.color.lerp(L.fog, 0.35 * w);
    }
    const u = (this.glow.material as ShaderMaterial).uniforms;
    u['uColor']!.value = L.floor;
    u['uStrength']!.value = L.floorStrength;
    this.glow.visible = L.floorStrength > 0.004;
    const at = this.opts.partyCentre();
    if (at) this.glow.position.set(at.x, 0.03, at.z);
    // The rim is touched only when a phase on either side of the tween tints
    // it, so a scene that drives its own rim (the Evrae range director) keeps it.
    const rimOn = !!(this.from.rim || this.to.rim);
    for (const f of this.opts.figures()) {
      f.setBounceLight(L.floor.getHex(), L.floorStrength * 0.5);
      if (rimOn) f.setRimLight((L.rim ?? this.baseRim).getHex(), this.opts.baseRim.strength);
    }
  }

  /** For the debug snapshot and the capture script. */
  snapshot(): { phase: PhaseId; floorPhase: PhaseId; tween: number; exposure: number; floor: number; starts: number } {
    return {
      phase: this.target,
      floorPhase: this.floorPhase,
      tween: Math.round((this.t / PHASE_TWEEN_S) * 100) / 100,
      exposure: Math.round(this.now.exposure * 1000) / 1000,
      floor: Math.round(this.now.floorStrength * 1000) / 1000,
      starts: this.starts.length,
    };
  }

  dispose(): void {
    this.glow.removeFromParent();
    this.glow.geometry.dispose();
    (this.glow.material as ShaderMaterial).dispose();
    // The next battle applies its own palette; nothing of this one lingers on the renderer.
    if (this.basePalette && this.opts.grade) this.opts.grade.applyPalette(this.basePalette);
  }
}
