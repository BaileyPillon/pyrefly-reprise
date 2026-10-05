/**
 * Eye-candy option A, "Golden-Hour Cinema" (options round 2026-09-29; prototype behind
 * `?fx=a`, never for main until Bailey picks). The post chain grows up over the approved
 * paintings; the paintings' pixels are never changed (effects are layers, lights and shaders).
 *
 * | # | What | Where |
 * |---|---|---|
 * | A1 | selective bloom: lights, spells and motes bloom; pale paint does not | the bloom's bright-pass (`BloomMask.ts`) |
 * | A1b | the spells' halo | `OverlayGlow.ts` |
 * | A1c | lens streaks on light peaks: FFX anamorphic, FFX-2 four-point stars | `GlowPass.ts` |
 * | A2 | the chapter's look, a LUT built from its own palette | `LookLut.ts`, `GradeShader` |
 * | A3 | light shafts, beams and lit air from the painting's own light | `GlowPass.ts`, `sceneLooks.ts` |
 * | A4 | backdrop depth of field and the menu focus pull | `BackdropFocus.ts` |
 * | A5, A6 | film grain at 24 steps a second; the tinted vignette | `GradeShader` |
 * | A7 | the rim light from the painting's key | `KeyRim.ts` |
 * | A8 | the lens flare on big spells, and the light swelling as they land | `LensFlare.ts` |
 *
 * Tiers: `full`; `phone` (short side under 600: DPR 1.5, two shaft sources at 24 samples, half
 * the streak taps, no flare ghosts, a 2-pass halo); `low` (Low effects: today's bloom exactly,
 * no shafts, streaks, halo or flare; the nearly free look, grain, vignette, depth of field and
 * rim stay). Reduce motion: still beams, no breathing, no focus-pull easing, a still grain, no
 * lens flare and no swell. The HUD is DOM above the canvas, so none of it can blur, bloom or
 * tint the HUD. Every strength is scaled by the `?fxdial=` dials.
 */

import { Color, Data3DTexture, LinearFilter, Mesh, PlaneGeometry, Vector2, Vector3, type Camera, type Scene, type WebGLRenderer } from 'three';
import type { Renderer } from '../../Renderer.ts';
import { setMaskEveryFigure } from '../../BloomMask.ts';
import { eyeCandy, type FxTier } from '../EyeCandy.ts';
import { spellTaps } from '../spellTaps.ts';
import { BackdropFocus } from './BackdropFocus.ts';
import { GlowPass, type GlowSource } from './GlowPass.ts';
import { KeyRim, keyRimColor } from './KeyRim.ts';
import { figureTrueOf, rimQuiet } from '../../figureTrue.ts';
import { isBigSpell, LensFlare } from './LensFlare.ts';
import { buildLookLut, FFX2_RECIPE, FFX_RECIPE, LUT_SIZE } from './LookLut.ts';
import { OverlayGlow } from './OverlayGlow.ts';
import { hex3, sceneLookA, type SceneLookA } from './sceneLooks.ts';
import { bloomUnderCombat, fxShared } from '../fxShared.ts';

/** What the battle screen hands over when a chapter's diorama is up. */
export interface FxSceneInfo {
  key: string;
  game: string;
  scene: Scene;
  palette: { key: number; sky: number } | null;
}

/** The painting's sampled palette, published on the scene by `scenes/index.ts`; null for an older builder. */
export function sceneBackdropPalette(scene: Scene): { key: number; sky: number } | null {
  const p = (scene.userData as Record<string, unknown> | undefined)?.['backdropPalette'] as { key?: unknown; sky?: unknown } | undefined; // a stub scene has no userData
  return p && typeof p.key === 'number' && typeof p.sky === 'number' ? { key: p.key, sky: p.sky } : null;
}

let bound: FxSceneInfo | null = null;
/** Called by the battle screen once the scene is loaded (cheap; nothing happens unless `?fx=a`). */
export function bindEyeCandyScene(info: FxSceneInfo | null): void {
  bound = info;
}

const d = (name: Parameters<typeof eyeCandy.dial>[0]): number => eyeCandy.dial(name);

export class GoldenHour {
  private readonly r: Renderer;
  readonly glow = new GlowPass();
  private readonly focus = new BackdropFocus();
  private readonly rim = new KeyRim();
  private readonly halo = new OverlayGlow();
  private readonly flare = new LensFlare();
  private look: SceneLookA | null = null;
  private lookKey = '';
  private lut: Data3DTexture | null = null;
  private active = false;
  private activeScene: Scene | null = null;
  private painting: Mesh | null = null;
  private readonly rimColour = new Color();
  private clock = 0;
  private lastNow = 0;
  /** Seconds since the last big spell landed (the swell), or Infinity. */
  private dramaT = Infinity;
  private readonly tmp = new Vector3();
  private readonly buf = new Vector2();
  private readonly unhookOverlay: () => void;
  /** Debug and captures: what the last frame did. */
  readonly stats = { active: false, tier: 'full' as FxTier, sources: [] as Array<[number, number]>, menu: false, drama: 0 };

  constructor(renderer: Renderer) {
    this.r = renderer;
    this.glow.enabled = false;
    const idx = renderer.composer.passes.indexOf(renderer.bloomPass);
    renderer.composer.insertPass(this.glow, idx + 1);
    this.unhookOverlay = renderer.addOverlay((gl) => this.drawOverlay(gl));
  }

  private get tier(): FxTier {
    return eyeCandy.tier;
  }

  /** Every frame, before the composer runs. */
  update(scene: Scene, camera: Camera): void {
    const now = performance.now() / 1000;
    const dt = this.lastNow ? Math.min(0.1, now - this.lastNow) : 0;
    this.lastNow = now;
    const info = bound;
    const game = info?.game === 'ffx' || info?.game === 'ffx2' ? info.game : null;
    const want = eyeCandy.enabled('a') && !!info && info.scene === scene && game !== null;
    if (!want) {
      if (this.active) this.deactivate();
      return;
    }
    if (!this.active || this.activeScene !== scene) this.activate(info!, game!);
    const fdt = eyeCandy.frozen ? 0 : dt;
    this.clock += fdt;
    this.dramaT += fdt;
    this.frame(scene, camera, fdt);
  }

  private activate(info: FxSceneInfo, game: 'ffx' | 'ffx2'): void {
    if (this.active) this.deactivate();
    this.active = true;
    this.activeScene = info.scene;
    this.look = sceneLookA(info.key, game);
    const lk = `${info.key}:${game}:${info.palette?.key ?? 0}:${info.palette?.sky ?? 0}`;
    if (lk !== this.lookKey || !this.lut) {
      this.lut?.dispose();
      const bytes = buildLookLut(info.palette ?? { key: 0xffe0b0, sky: 0x30405a }, game === 'ffx2' ? FFX2_RECIPE : FFX_RECIPE);
      const t = new Data3DTexture(bytes, LUT_SIZE, LUT_SIZE, LUT_SIZE);
      t.minFilter = t.magFilter = LinearFilter;
      t.needsUpdate = true;
      this.lut = t;
      this.lookKey = lk;
    }
    this.painting = null;
    info.scene.traverse((o) => {
      if (!this.painting && o.name === 'backdrop-painting' && (o as Mesh).isMesh) this.painting = o as Mesh;
    });
    this.focus.patch(info.scene);
    this.rim.forget();
    keyRimColor(info.palette?.key ?? 0xbfe0ff, this.rimColour);
    spellTaps.beforeDraw = (gl, batch) => {
      if (this.tier === 'low' || !eyeCandy.sub('a', 'halo') || d('halo') <= 0) return;
      this.halo.passes = this.tier === 'phone' ? 3 : 5;
      this.halo.gain = 1.5 * d('halo');
      this.halo.render(gl, batch);
    };
    spellTaps.land = (tap) => {
      if (this.tier === 'low' || eyeCandy.reduceMotion || !isBigSpell(tap)) return;
      if (!eyeCandy.reduceFlashes) this.dramaT = -Math.max(0, tap.ms) / 1000;
      if (!eyeCandy.sub('a', 'flare') || d('flare') <= 0) return;
      this.flare.land(tap, { reduceFlashes: eyeCandy.reduceFlashes, ghosts: this.tier === 'full', now: this.clock, scale: d('flare') });
    };
    this.r.setFxPixelCap(this.tier === 'phone' ? 1.5 : null);
  }

  private deactivate(): void {
    this.active = false;
    this.activeScene = null;
    this.glow.enabled = false;
    const bloom = this.r.bloomPass.materialHighPassFilter.uniforms;
    bloom['selective']!.value = 0;
    bloom['smoothWidth']!.value = 0.01;
    const g = this.r.gradePass.uniforms;
    g['lookAmount']!.value = 0;
    (g['vignetteTint']!.value as Vector3).set(0, 0, 0);
    g['grainFps']!.value = 0;
    g['grainSize']!.value = 1;
    g['grainHighlights']!.value = 1;
    this.focus.off();
    this.rim.restore();
    this.flare.clear();
    this.dramaT = Infinity;
    setMaskEveryFigure(false);
    spellTaps.beforeDraw = null;
    spellTaps.land = null;
    this.r.setFxPixelCap(null);
    // Put the palette's own post settings back (bloom, tilt, vignette, grain, figure mask).
    const p = this.r.palette;
    if (p) this.r.applyPalette(p);
  }

  /** The swell after a big spell: 0..1, a quick rise to the blow and a slow settle. */
  private drama(L: SceneLookA): number {
    const t = this.dramaT;
    if (!Number.isFinite(t) || t < -0.25) return 0;
    if (t < 0) return (t + 0.25) / 0.25;
    return Math.max(0, Math.exp((-3 * t) / L.drama.seconds) - 0.05);
  }

  private frame(scene: Scene, camera: Camera, dt: number): void {
    const L = this.look!;
    const tier = this.tier;
    const low = tier === 'low';
    const rm = eyeCandy.reduceMotion;
    const p = this.r.palette ?? {};
    // Option D: while C's combat layers are lit, A's bloom and swell yield to them (fxShared.ts).
    const yieldTo = bloomUnderCombat(eyeCandy.enabled('c') ? fxShared.cEnergy : 0);
    const swell = low || rm ? 0 : this.drama(L) * L.drama.boost * yieldTo.swell;
    this.stats.active = true;
    this.stats.tier = tier;
    this.stats.drama = Math.round(swell * 100) / 100;

    // A1: selective bloom (today's whole-frame bloom, exactly, at the low tier)
    const bloom = this.r.bloomPass.materialHighPassFilter.uniforms;
    setMaskEveryFigure(!low);
    if (low || !eyeCandy.sub('a', 'bloom')) {
      bloom['selective']!.value = 0;
      bloom['smoothWidth']!.value = 0.01;
      this.r.applyPost({ bloomThreshold: p.bloomThreshold ?? 0.9, bloomStrength: p.bloomStrength ?? 0.5, bloomRadius: p.bloomRadius ?? 0.55 });
    } else {
      bloom['selective']!.value = 1;
      bloom['smoothWidth']!.value = 0.3;
      bloom['whiteDamp']!.value = L.whiteDamp;
      this.r.renderer.getDrawingBufferSize(this.buf);
      (bloom['uTexel']!.value as Vector2).set(1 / Math.max(1, this.buf.x), 1 / Math.max(1, this.buf.y));
      const kc = hex3(`#${(bound?.palette?.key ?? 0xffffff).toString(16).padStart(6, '0')}`);
      const tint = L.game === 'ffx' ? [0.7 + 0.3 * kc[0] + 0.12, 0.7 + 0.3 * kc[1] + 0.02, 0.7 + 0.3 * kc[2] - 0.08] : [1.06, 0.9, 1.08];
      (bloom['bloomTint']!.value as Vector3).set(tint[0]!, tint[1]!, tint[2]!);
      this.r.applyPost({ bloomThreshold: L.bloom.threshold, bloomStrength: L.bloom.strength * d('bloom') * (1 + swell) * yieldTo.strength, bloomRadius: L.bloom.radius });
      bloom['figureMask']!.value = 1; // the paintings carry their own light: A never blooms a costume
    }

    // A2, A5, A6: the look, the grain and the vignette
    const g = this.r.gradePass.uniforms;
    g['uLook']!.value = this.lut;
    g['lookAmount']!.value = eyeCandy.sub('a', 'look') ? Math.min(1.5, L.look * d('look')) : 0;
    const vt = hex3(L.vignetteTint);
    (g['vignetteTint']!.value as Vector3).set(vt[0], vt[1], vt[2]);
    g['vignette']!.value = (p.vignette ?? 0.46) + (L.vignetteAdd + 0.1 * swell) * d('vignette');
    g['grain']!.value = (L.game === 'ffx' ? 0.034 : 0.03) * d('grain');
    g['grainFps']!.value = 24;
    g['grainSize']!.value = 1.25;
    g['grainHighlights']!.value = 0.4;
    if (rm || eyeCandy.frozen) g['time']!.value = 0.5; // a still grain
    if (L.grade) gradeFix(g, p, L.grade); // VP-1001-03: a room the defaults crush (the Den of Woe)

    // A4: backdrop depth of field; the tilt-shift softens less so the figures are not blurred twice
    const dof = d('dof');
    if (eyeCandy.sub('a', 'dof') && dof > 0) this.focus.update(dt, { rest: L.dof.rest * dof, menu: L.dof.menu * dof }, rm);
    else this.focus.off();
    this.stats.menu = this.focus.menu;
    this.r.applyPost({ tiltMaxBlur: (p.tiltMaxBlur ?? 6) * 0.7 });

    // A3 + A1c: shafts, beams, lit air and the lens streaks
    const shaftsOn = !low && eyeCandy.sub('a', 'shafts') && L.shafts.length > 0 && d('shafts') > 0;
    const streakOn = !low && eyeCandy.sub('a', 'streaks') && L.streak.gain > 0 && d('streaks') > 0;
    this.glow.enabled = shaftsOn || streakOn;
    this.stats.sources = [];
    if (this.glow.enabled) this.shafts(camera, L, tier, rm, shaftsOn, streakOn, swell);

    // A7: the rim from the key
    if (eyeCandy.sub('a', 'rim') && d('rim') > 0) {
      this.r.renderer.getDrawingBufferSize(this.buf); // VP-1001-17: the width is held to screen pixels
      this.rim.apply(scene, this.rimColour, L.rim * d('rim') * rimQuiet(figureTrueOf(this.r)), 1 + (L.rimWidth - 1) * Math.min(1.5, d('rim')), { camera, heightPx: this.buf.y });
    }
    else this.rim.restore();

    // A8
    this.flare.update(dt);
  }

  private shafts(camera: Camera, L: SceneLookA, tier: FxTier, rm: boolean, shaftsOn: boolean, streakOn: boolean, swell: number): void {
    const gp = this.glow;
    const phone = tier === 'phone';
    const pre = gp.preUniforms;
    pre['uThreshold']!.value = L.shaftThreshold;
    pre['uWhiteDamp']!.value = L.whiteDamp;
    pre['uStarThreshold']!.value = L.streak.threshold;
    gp.gatherUniforms['uDecay']!.value = L.decay;
    gp.samples = phone ? 24 : 48;
    gp.shaft = shaftsOn ? d('shafts') * (1 + swell * 0.8) : 0;
    gp.rays = L.rays;
    gp.time = rm ? 0 : this.clock * L.raySpeed;
    // the streaks: FFX anamorphic (one long horizontal line), FFX-2 four-point stars
    gp.star = streakOn ? L.streak.gain * d('streaks') * (1 + swell * 0.6) : 0;
    gp.streakMode = L.streak.mode;
    gp.streakTaps = phone ? Math.ceil(L.streak.taps / 2) : L.streak.taps;
    gp.streakLen = phone ? L.streak.len * 1.6 : L.streak.len;
    gp.streakFall = L.streak.fall;
    const st = hex3(L.streak.tint);
    (gp.compositeUniforms['uStarTint']!.value as Vector3).set(st[0], st[1], st[2]);
    const breath = rm ? 1 : 1 + 0.08 * Math.sin((this.clock * Math.PI * 2) / 7);
    const specs = shaftsOn ? (phone ? L.shafts.slice(0, 2) : L.shafts) : [];
    const mesh = this.painting;
    const geo = mesh?.geometry as PlaneGeometry | undefined;
    const W = geo?.parameters?.width ?? 0;
    const H = geo?.parameters?.height ?? 0;
    const haze = d('haze');
    specs.forEach((s, i) => {
      const src: GlowSource = (gp.sources[i] ??= { pos: new Vector2(), color: new Vector3(), reach: 0.5, gain: 0, disc: 0, haze: 0 });
      if (mesh && W > 0) {
        mesh.updateWorldMatrix(true, false);
        this.tmp.set((s.u - 0.5) * W, (0.5 - s.v) * H, 0).applyMatrix4(mesh.matrixWorld).project(camera);
        src.pos.set(this.tmp.x * 0.5 + 0.5, this.tmp.y * 0.5 + 0.5);
      } else src.pos.set(s.u, 1 - s.v);
      const c = hex3(s.color);
      src.color.set(c[0], c[1], c[2]);
      src.reach = s.reach;
      src.gain = s.gain * breath;
      src.disc = s.disc ?? 0;
      src.haze = (s.haze ?? 0) * haze;
      this.stats.sources.push([Math.round(src.pos.x * 1000) / 1000, Math.round(src.pos.y * 1000) / 1000]);
    });
    gp.sources.length = specs.length;
  }

  private drawOverlay(gl: WebGLRenderer): void {
    if (this.active && this.flare.active) this.flare.render(gl);
  }

  dispose(): void {
    this.deactivate();
    this.unhookOverlay();
    this.r.composer.removePass(this.glow);
    this.glow.dispose();
    this.halo.dispose();
    this.flare.dispose();
    this.lut?.dispose();
  }
}

/** A room's grade correction on top of its palette (VP-1001-03); `applyPalette` restores the palette's own values. */
function gradeFix(g: Record<string, { value: unknown }>, p: { gain?: readonly number[]; lift?: readonly number[] }, fix: NonNullable<SceneLookA['grade']>): void {
  const gain = p.gain ?? [1, 1, 1];
  const lift = p.lift ?? [0, 0, 0];
  (g['gain']!.value as Vector3).set(gain[0]! * fix.gain[0], gain[1]! * fix.gain[1], gain[2]! * fix.gain[2]);
  (g['lift']!.value as Vector3).set(lift[0]! + fix.lift[0], lift[1]! + fix.lift[1], lift[2]! + fix.lift[2]);
  g['shadowTintAmount']!.value = fix.shadowTintAmount;
}
