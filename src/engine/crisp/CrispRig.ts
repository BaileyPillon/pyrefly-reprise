import { Scene, type Camera, type WebGLRenderer } from 'three';
import type { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import type { AaMode, DeviceClass } from '../ArtBudget.ts';
import { deviceClass, hardwareClass } from '../ArtDevice.ts';
import { eyeCandy } from '../fx/EyeCandy.ts';
import { CasPass } from './CasPass.ts';
import { CRISP_PRESETS, RUNGS, mergeCrisp, parseCrisp, rungFor, startRung, type CrispConfig, type CrispTier } from './CrispConfig.ts';
import { crispLive } from './crispLive.ts';
import { FRAME_BUDGET_MS, FrameGovernor, HOLD_RESIZE_MS, HOLD_SCENE_MS } from './FrameGovernor.ts';
import { setSceneScale, ssLodCell } from './sceneScale.ts';
import { SsaaRenderPass } from './SsaaPass.ts';

/**
 * The sharpness ladder's rig (release 39; both games, shared plumbing): owns the supersampled scene pass and the sharpening pass,
 * decides each frame which rung the frame is drawn on (`CrispConfig.rungFor`: the device class and effects tier, then where the
 * frame-time governor stands, or a pinned end state from the address) and switches the passes to match. `Renderer.ts` builds it and calls
 * {@link beforeRender}; nothing else drives it.
 *
 * What a rung changes: the scene pass (the plain render pass, or the supersampled one that resolves down with Lanczos-3 before the bloom),
 * the sharpening pass right before the grade, the MAX mix's SMOOTH EDGES pass (off while supersampled: `crispLive.aaPre`), and the
 * renderer's own post-grade anti-aliasing (off on every rung; `?aa=` and the `a` end state switch it on for a capture).
 */

/** The renderer's passes and switches the rig needs. */
interface Parts {
  renderPass: Pass;
  msaaPass: Pass;
  gradePass: Pass;
  tiltH: { uniforms: Record<string, { value: unknown }> };
  /** The renderer's own anti-aliasing mode now, and how to set it. */
  aaMode: () => AaMode;
  setAa: (mode: AaMode) => void;
  /** The renderer's own SMAA pass after the grade, when it has been built (the rig leaves it to `setAa`). */
  ownSmaa: () => Pass | null;
}

/** How often the device class is read again (frames): it changes with the window (the phone layout), never within a frame. */
const CLASS_EVERY = 30;

export class CrispRig {
  readonly ssaa: SsaaRenderPass;
  readonly cas = new CasPass();
  readonly governor: FrameGovernor;
  /** A pinned end state (the address, `__pyrefly.crisp.preset`); null while the governor decides. */
  private pinned: { name: string | null; cfg: CrispConfig } | null;
  private simulated = 0;
  private lastScene: Scene | null = null;
  /** The renderer's own AA as the address or the budget left it: what a rung that does not name one gets. */
  private readonly baseAa: AaMode;
  private appliedAa: AaMode | undefined;
  private cls: DeviceClass;
  private frames = 0;
  private current: { name: string; cfg: Readonly<CrispConfig> };

  constructor(
    private readonly gl: WebGLRenderer,
    private readonly composer: EffectComposer,
    private readonly parts: Parts,
    camera: Camera,
    search: string,
  ) {
    const override = parseCrisp(search);
    this.pinned = override ? { name: override.name, cfg: override.cfg } : null;
    this.baseAa = parts.aaMode();
    this.cls = deviceClass();
    this.governor = new FrameGovernor(startRung(hardwareClass()), { budgetMs: budgetFromAddress(search) }); // from the GPU, not the layout: a narrow window may be widened
    this.ssaa = new SsaaRenderPass(new Scene(), camera);
    this.ssaa.enabled = false;
    this.cas.enabled = false;
    const at = composer.passes.indexOf(parts.msaaPass);
    composer.insertPass(this.ssaa, at < 0 ? 1 : at + 1);
    const gi = composer.passes.indexOf(parts.gradePass);
    composer.insertPass(this.cas, gi < 0 ? composer.passes.length : gi);
    this.current = this.resolve(eyeCandy.tier);
    crispLive.rung = this.current.name;
    crispLive.aaPre = this.current.cfg.aaPre; // the first frame already builds the MAX mix's pass (or not) for the right rung
  }

  /** The end state this frame is drawn on, and the name of the rung or preset it came from. */
  private resolve(tier: CrispTier): { name: string; cfg: Readonly<CrispConfig> } {
    if (this.pinned) return { name: this.pinned.name ?? 'custom', cfg: this.pinned.cfg };
    const rung = rungFor(this.cls, tier, this.governor.rung);
    return { name: rung, cfg: RUNGS[rung] };
  }

  /** Every frame, before the composer runs: the governor, then the passes' switches for the rung the frame is drawn on. */
  beforeRender(scene: Scene, camera: Camera): void {
    const now = performance.now();
    if (this.frames++ % CLASS_EVERY === 0) this.cls = deviceClass();
    const tier = eyeCandy.tier;
    if (scene !== this.lastScene) {
      this.lastScene = scene;
      this.governor.hold(now, HOLD_SCENE_MS); // a new scene decodes art and compiles shaders: not a reading of the device
    }
    // Only a frame drawn on a rung the governor owns counts toward it (the phone layout and LOW EFFECTS are decided by the device).
    if (!this.pinned && rungFor(this.cls, tier, this.governor.rung) === this.governor.rung) this.governor.frame(now, this.simulated);
    this.current = this.apply(this.resolve(tier), scene, camera);
    crispLive.rung = this.current.name;
    crispLive.aaPre = this.current.cfg.aaPre;
  }

  /** Switch the passes to the end state; returns the one really drawn (see below: a frame too big to supersample is drawn on A2). */
  private apply(want: { name: string; cfg: Readonly<CrispConfig> }, scene: Scene, camera: Camera): { name: string; cfg: Readonly<CrispConfig> } {
    const ss = this.ssaa;
    ss.scene = scene;
    ss.camera = camera;
    let { name, cfg: c } = want;
    let supersampled = c.ss > 1.001;
    if (supersampled) {
      ss.setRing(c.ssRing);
      ss.setScale(c.ss, this.gl.capabilities.maxTextureSize);
      if (ss.effective <= 1.001) {
        // The buffer is too big for a supersample worth drawing (an 8K window; a GPU with a small texture limit): draw today's frame, with its one AA pass,
        // rather than a frame that has neither the supersample nor an anti-aliasing pass (`aaPre` is off on the supersampled rungs).
        name = `${name}>a2`;
        c = RUNGS.a2;
        supersampled = false;
      }
    }
    const eff = supersampled ? ss.effective : 1;
    setSceneScale(eff);
    ssLodCell.value = Math.log2(eff);
    const wasOn = ss.enabled;
    ss.enabled = supersampled && eff > 1.001;
    if (wasOn && !ss.enabled) ss.release(); // the supersampled targets are the biggest buffers in the frame: back to the GPU when a rung leaves them
    const wantAa = c.aa ?? this.baseAa;
    if (wantAa !== this.appliedAa) {
      this.appliedAa = wantAa;
      this.parts.setAa(wantAa);
    }
    // The MAX mix's SMOOTH EDGES pass is switched here, in the same frame (the mix builds it or frees its buffers in its own update, one frame later, by `crispLive.aaPre`).
    const own = this.parts.ownSmaa();
    for (const p of this.composer.passes) if ((p instanceof SMAAPass || p instanceof FXAAPass) && p !== own) p.enabled = c.aaPre;
    const aa = this.parts.aaMode();
    this.parts.renderPass.enabled = !ss.enabled && aa !== 'msaa';
    this.parts.msaaPass.enabled = !ss.enabled && aa === 'msaa';
    this.cas.enabled = c.cas > 0;
    if (this.cas.enabled) {
      this.cas.amount = c.cas;
      this.cas.shape = c.casSharp;
      this.cas.floor = c.casFloor;
      // the sharpening fades out with the tilt-shift band, so the soft top and bottom of the frame stay soft
      this.cas.followFocus(this.parts.tiltH.uniforms['focus']!.value as number, this.parts.tiltH.uniforms['bandWidth']!.value as number, true);
    }
    return { name, cfg: c };
  }

  /** The drawing buffer changed size: the class may have changed with the window, and the cost changed with the size, so the governor starts a fresh window. */
  noteResize(): void {
    this.cls = deviceClass();
    this.governor.hold(performance.now(), HOLD_RESIZE_MS);
  }

  // ------------------------------------------------------------------ developer overrides (captures, QA)

  /** Pin a named end state (`CrispConfig.CRISP_PRESETS`); the governor stands down. False for an unknown name. */
  preset(name: string): boolean {
    const key = name.toLowerCase();
    const p = CRISP_PRESETS[key];
    if (!p) return false;
    this.pinned = { name: key, cfg: { ...p } };
    return true;
  }

  /** Change single levers of the frame now (pins the result). */
  set(patch: Partial<CrispConfig>): CrispConfig {
    const next = mergeCrisp({ ...this.current.cfg }, patch);
    this.pinned = { name: null, cfg: next };
    return { ...next };
  }

  /** Hand the frame back to the device class and the governor (it starts a fresh window). */
  unpin(): void {
    this.pinned = null;
    this.governor.hold(performance.now(), HOLD_RESIZE_MS);
  }

  /** Add this many milliseconds to every frame interval the governor reads (a capture's simulated slow frame); 0 or null stops it. */
  simulate(ms: number | null): void {
    this.simulated = ms !== null && Number.isFinite(ms) && ms > 0 ? ms : 0;
  }

  /** What is on, for the debug API and the captures. */
  report(): Record<string, unknown> {
    return {
      rung: this.current.name,
      pinned: this.pinned !== null,
      cfg: { ...this.current.cfg },
      class: this.cls,
      tier: eyeCandy.tier,
      ssEffective: this.ssaa.enabled ? this.ssaa.effective : 1,
      simulatedMs: this.simulated,
      governor: this.governor.stats(),
      passes: this.composer.passes.map((p, i) => `${i}:${this.describe(p)}${p.enabled ? '' : '(off)'}`),
    };
  }

  private describe(p: Pass): string {
    if (p === this.ssaa) return 'ssaa';
    if (p === this.cas) return 'cas';
    if (p === this.parts.renderPass) return 'scene';
    if (p === this.parts.msaaPass) return 'scene-msaa';
    if (p === this.parts.gradePass) return 'grade';
    const q = p as unknown as { _edgesRT?: unknown; material?: { name?: string }; strength?: unknown; threshold?: unknown };
    if (q._edgesRT) return 'smaa';
    if (q.material?.name === 'FXAAShader') return 'fxaa';
    if (q.strength !== undefined && q.threshold !== undefined) return 'bloom';
    return q.material?.name || p.constructor.name;
  }

  dispose(): void {
    crispLive.rung = 'a2';
    crispLive.aaPre = true;
    setSceneScale(1);
    ssLodCell.value = 0;
    this.ssaa.dispose();
    this.cas.dispose();
  }
}

/** `?crispbudget=<ms>`: a capture's own frame-time budget (the governor's default is {@link FRAME_BUDGET_MS}). */
function budgetFromAddress(search: string): number {
  try {
    const n = Number(new URLSearchParams(search).get('crispbudget'));
    return Number.isFinite(n) && n > 0 ? n : FRAME_BUDGET_MS;
  } catch {
    return FRAME_BUDGET_MS;
  }
}
