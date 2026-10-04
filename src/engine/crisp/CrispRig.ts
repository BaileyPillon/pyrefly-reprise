import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import type { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import { Scene, type Camera, type Texture, type WebGLRenderer } from 'three';
import { CasPass } from './CasPass.ts';
import { CRISP_PRESETS, DEFAULT_CRISP, mergeCrisp, parseCrisp, type CrispConfig } from './CrispConfig.ts';
import { MipPrefilter } from './MipPrefilter.ts';
import { setSceneScale, ssLodCell } from './sceneScale.ts';
import { SsaaRenderPass } from './SsaaPass.ts';

/**
 * The crispness options round's rig (scratch branch `crisp-options`): owns the three new passes, the texture registry and the
 * per-frame switchboard, so `Renderer.ts` only builds it and calls `beforeRender`. Every lever's default leaves release 39's frame
 * unchanged (`CrispConfig.DEFAULT_CRISP`); `window.__pyrefly.crisp` (`debug/crispApi.ts`) flips them at run time for captures.
 */

/** The shared cell of the figures' sampling bias (`PaintedShader.mipBias`); every figure material points at it. */
export const crispBiasCell = { value: 0 };

/** The rig the running renderer owns, for the places that make textures (`PaintedArt`, `PlateCompose`, `DepthPlates`). */
let active: CrispRig | null = null;

/** Called wherever a painted texture is made: applies the anisotropy floor and queues the prefiltered mips when they are on. */
export function crispRegisterTexture(tex: Texture): void {
  active?.register(tex);
}

export class CrispRig {
  cfg: CrispConfig;
  readonly ssaa: SsaaRenderPass;
  readonly casPre = new CasPass();
  readonly casPost = new CasPass();
  readonly prefilter: MipPrefilter;
  private readonly textures = new Set<Texture>();
  /** Textures whose chain is the prefiltered one (a texture that is not on the GPU yet is not touched: it would cost its whole upload). */
  private readonly filtered = new WeakSet<Texture>();
  /** Textures the prefilter cannot serve (data, compressed or cube textures): not tried again. */
  private readonly skipped = new WeakSet<Texture>();
  private mipsDone: 'gpu' | 'lanczos';
  private anisoDone: number;
  private readonly ownAniso = new WeakMap<Texture, number>();

  constructor(
    private readonly gl: WebGLRenderer,
    private readonly composer: EffectComposer,
    private readonly parts: {
      renderPass: Pass;
      msaaPass: Pass;
      smaaPass: SMAAPass;
      gradePass: Pass;
      tiltH: { uniforms: Record<string, { value: unknown }> };
      aaMode: () => 'off' | 'smaa' | 'msaa';
      setAa: (mode: 'off' | 'smaa' | 'msaa') => void;
    },
    camera: Camera,
    search: string,
  ) {
    this.cfg = parseCrisp(search);
    this.mipsDone = this.cfg.mips;
    this.anisoDone = this.cfg.aniso;
    this.ssaa = new SsaaRenderPass(new Scene(), camera);
    this.ssaa.enabled = false;
    this.prefilter = new MipPrefilter(gl);
    this.casPre.enabled = false;
    this.casPost.enabled = false;
    const at = composer.passes.indexOf(parts.msaaPass);
    composer.insertPass(this.ssaa, at < 0 ? 1 : at + 1);
    const gi = composer.passes.indexOf(parts.gradePass);
    composer.insertPass(this.casPre, gi < 0 ? composer.passes.length : gi);
    const si = composer.passes.indexOf(parts.smaaPass);
    composer.insertPass(this.casPost, si < 0 ? composer.passes.length : si + 1);
    crispBiasCell.value = this.cfg.mipBias;
    if (this.cfg.aa) parts.setAa(this.cfg.aa);
    active = this;
  }

  /** Switch levers at run time (captures). Texture levers (`mips`) apply to textures made later and, best effort, to the ones made already. */
  set(patch: Partial<CrispConfig>): CrispConfig {
    this.cfg = mergeCrisp(this.cfg, patch);
    crispBiasCell.value = this.cfg.mipBias;
    if (this.cfg.aa) this.parts.setAa(this.cfg.aa);
    if (this.cfg.mips !== this.mipsDone) {
      this.mipsDone = this.cfg.mips;
      if (this.cfg.mips === 'gpu') {
        for (const t of this.textures) {
          if (this.filtered.has(t)) this.prefilter.restore(t); // the driver's own chain again
          this.filtered.delete(t);
        }
      }
    }
    if (this.cfg.aniso !== this.anisoDone) {
      this.anisoDone = this.cfg.aniso;
      for (const t of this.textures) this.prefilter.setAnisotropy(t, Math.max(this.ownAniso.get(t) ?? 1, this.cfg.aniso));
    }
    return this.cfg;
  }

  /** A named end state of the round (`CrispConfig.CRISP_PRESETS`) over the defaults; false for an unknown name. */
  preset(name: string): boolean {
    const p = CRISP_PRESETS[name.toLowerCase()];
    if (!p) return false;
    this.set({ ...DEFAULT_CRISP, ...p });
    return true;
  }

  register(tex: Texture): void {
    if (this.textures.has(tex)) return;
    this.textures.add(tex);
    this.ownAniso.set(tex, tex.isRenderTargetTexture ? 1 : tex.anisotropy); // a render target's texture is set up once, before the JS property is written: GL keeps 1
    tex.addEventListener('dispose', () => this.textures.delete(tex));
    if (this.cfg.aniso > 0) tex.anisotropy = Math.max(tex.anisotropy, this.cfg.aniso);
  }

  /** Textures that are on the GPU and still wait for their prefiltered chain. */
  get queued(): number {
    if (this.cfg.mips !== 'lanczos') return 0;
    let n = 0;
    for (const t of this.textures) if (!this.filtered.has(t) && !this.skipped.has(t) && this.uploaded(t)) n++;
    return n;
  }

  /** Every texture the rig has seen and not lost. */
  get known(): number {
    return this.textures.size;
  }

  private uploaded(t: Texture): boolean {
    return !!(this.gl.properties.get(t) as { __webglTexture?: WebGLTexture }).__webglTexture;
  }

  /** Work off the prefilter queue now (captures wait for it to be empty): every uploaded texture that has not been done. */
  flush(max = 1e9): number {
    if (this.cfg.mips !== 'lanczos') return 0;
    let n = 0;
    for (const t of this.textures) {
      if (n >= max) break;
      if (this.filtered.has(t) || this.skipped.has(t) || !this.uploaded(t)) continue;
      if (this.prefilter.apply(t, this.cfg.ssRing)) {
        this.filtered.add(t);
        n++;
      } else this.skipped.add(t);
    }
    return n;
  }

  /** Every frame before the composer runs: the passes' switches, their order, the follow-the-focus uniforms, the queue. */
  beforeRender(scene: Scene, camera: Camera): void {
    const c = this.cfg;
    const ss = this.ssaa;
    ss.scene = scene;
    ss.camera = camera;
    const aa = this.parts.aaMode();
    const useSs = c.ss > 1.001;
    ss.setFilter(c.ssFilter, c.ssRing);
    if (useSs) ss.setScale(c.ss, this.gl.capabilities.maxTextureSize);
    const eff = useSs ? ss.effective : 1;
    setSceneScale(eff);
    ssLodCell.value = Math.log2(eff);
    // the scene pass
    const wasOn = ss.enabled;
    ss.enabled = useSs && eff > 1.001;
    if (wasOn && !ss.enabled) ss.release(); // the supersampled targets are the biggest buffers in the frame: back to the GPU when the lever is off
    this.parts.renderPass.enabled = !ss.enabled && aa !== 'msaa';
    this.parts.msaaPass.enabled = !ss.enabled && aa === 'msaa';
    // the AA passes: the renderer's own SMAA after the grade, and the MAX mix's one before it
    this.parts.smaaPass.enabled = aa === 'smaa';
    for (const p of this.composer.passes) {
      if (p instanceof SMAAPass && p !== this.parts.smaaPass) p.enabled = c.aaPre;
    }
    // CAS goes right before the grade (after the MAX mix's SMAA, which inserts itself there) or after the last SMAA
    const passes = this.composer.passes;
    const gi = passes.indexOf(this.parts.gradePass);
    if (gi > 0 && passes[gi - 1] !== this.casPre) {
      passes.splice(passes.indexOf(this.casPre), 1);
      passes.splice(passes.indexOf(this.parts.gradePass), 0, this.casPre);
    }
    this.casPre.enabled = c.cas > 0 && c.casAt === 'pre';
    this.casPost.enabled = c.cas > 0 && c.casAt === 'post';
    const focus = this.parts.tiltH.uniforms['focus']!.value as number;
    const band = this.parts.tiltH.uniforms['bandWidth']!.value as number;
    for (const p of [this.casPre, this.casPost]) {
      p.amount = c.cas;
      p.shape = c.casSharp;
      p.floor = c.casFloor;
      p.followFocus(focus, band, true);
    }
    if (this.cfg.mips === 'lanczos') this.flush(4);
  }

  /** Checksums of levels 1..3 of every texture the rig knows, to compare before and after a switch. */
  sums(levels = [1, 2, 3]): string[] {
    const rows: string[] = [];
    for (const t of this.textures) rows.push(levels.map((l) => this.prefilter.checksum(t, l) ?? '-').join(' '));
    return rows;
  }

  /** Give back the buffers of every SMAA pass that is switched off (they come back by themselves when one is switched on again). */
  releaseIdleSmaa(): number {
    let n = 0;
    for (const p of this.composer.passes) {
      if (p instanceof SMAAPass && !p.enabled) {
        p.dispose();
        n++;
      }
    }
    return n;
  }

  /** What the GPU holds for every texture the rig knows (anisotropy, filters, size): the check that a setting reaches GL. */
  inspect(): Array<Record<string, unknown>> {
    const rows: Array<Record<string, unknown>> = [];
    for (const t of this.textures) {
      const g = this.prefilter.inspect(t);
      rows.push({ name: t.name || '', js: t.anisotropy, own: this.ownAniso.get(t) ?? null, gl: g });
    }
    return rows;
  }

  /** What is on, for the debug API and the page. */
  report(): Record<string, unknown> {
    return {
      cfg: { ...this.cfg },
      passes: this.composer.passes.map((p, i) => `${i}:${p.constructor.name}${p.enabled ? '' : '(off)'}`),
      ssEffective: this.ssaa.enabled ? this.ssaa.effective : 1,
      textures: this.known,
      queued: this.queued,
      prefilter: { ...this.prefilter.stats },
    };
  }

  dispose(): void {
    if (active === this) active = null;
    this.ssaa.dispose();
    this.casPre.dispose();
    this.casPost.dispose();
    this.prefilter.dispose();
  }
}
