/**
 * Demo looks: the rig that puts one of three looks (`LookConfig.ts`) over the existing renderer. Dev flag only (`?look=hd2d|cinematic|anime`); with no flag the
 * renderer never builds it and today's frame is untouched. Both games (shared plumbing); each room's grade, light and fog come from its own painting.
 *
 * What it adds to the chain (`Renderer.ts`): the mask-aware blur (two passes after the stock tilt-shift), the compound look pass (just before the grade) and, every
 * frame after option A has written its own settings, the look's values for the grade (LUT, vignette, grain, saturation), the bloom and the stock tilt-shift. The eye-candy
 * sub-effects the look replaces (A's depth of field, shafts, streaks, look LUT, rim) are switched off for as long as it is on and put back when it goes. The HUD is DOM
 * above the canvas, so none of this can touch it.
 */
import { Vector2, Vector3, type Camera, type Scene } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { Renderer } from '../Renderer.ts';
import { applyFigureTrue, figureTrueOf } from '../figureTrue.ts';
import { setMaskEveryFigure } from '../BloomMask.ts';
import { eyeCandy } from '../fx/EyeCandy.ts';
import { boundEyeCandyScene } from '../fx/a/GoldenHour.ts';
import { LOOKS, QUALITY_COST, type LookName, type LookParams, type LookQuality } from './LookConfig.ts';
import { ROOM_LOOKS } from './LookGrades.ts';
import { LookBlurShader } from './LookBlurShader.ts';
import { LookMainShader } from './LookMainShader.ts';
import { lightColour } from './LookMaths.ts';
import { LookRoom, lin, mixc } from './LookRoom.ts';
import { relightCells, relightStats } from './relight/FigureRelight.ts';
import { RELIGHT, keyDirection, rimDirection } from './relight/RelightConfig.ts';
import { RelightLights } from './relight/RelightLights.ts';
import { lookState } from './LookState.ts';

export { lookWanted } from './LookState.ts';

const DEFINE_FOR: Record<LookName, string> = { hd2d: 'LOOK_HD2D', cinematic: 'LOOK_CINE', anime: 'LOOK_ANIME' };

export class LookRig {
  private readonly main = new Map<LookName, ShaderPass>();
  private blurH: ShaderPass | null = null;
  private blurV: ShaderPass | null = null;
  private active: LookName | null = null;
  private readonly room = new LookRoom();
  private readonly lights = new RelightLights();
  private version = -1;
  private quality: LookQuality = lookState.quality;
  private prevSub: string[] = [];
  private prevDials: Record<string, number | undefined> = {};
  private prevFigureTrue = -1;
  private prevTilt: { focus: number; band: number } | null = null;
  private clock = 0;
  private lastNow = 0;
  private readonly buf = new Vector2();
  /** For the debug API and the captures. */
  readonly stats = { look: null as LookName | null, quality: 'high' as LookQuality, room: '', light: [0, 0] as [number, number], lightFrom: 'default', blur: false, passes: [] as string[], relight: { any: false, bound: 0, loaded: 0, missing: 0, lights: [] as Array<{ u: number; v: number; s: number }> } };

  constructor(private readonly r: Renderer) {}

  // ----------------------------------------------------------------- building

  private mainPass(name: LookName): ShaderPass {
    let p = this.main.get(name);
    if (p) return p;
    p = new ShaderPass({ ...LookMainShader, defines: this.defines(name) } as never);
    p.enabled = false;
    const gi = this.r.composer.passes.indexOf(this.r.gradePass);
    this.r.composer.insertPass(p, gi < 0 ? this.r.composer.passes.length : gi);
    this.main.set(name, p);
    return p;
  }

  private defines(name: LookName): Record<string, string | number> {
    const c = QUALITY_COST[lookState.quality];
    const d: Record<string, string | number> = { [DEFINE_FOR[name]]: '', SHAFT_SAMPLES: Math.max(2, c.shaftSamples), MOTE_LAYERS: Math.max(1, c.moteLayers), FOG_OCTAVES: c.fogOctaves, EDGE_TAPS: c.edgeTaps };
    if (c.ca) d['USE_CA'] = '';
    return d;
  }

  private blurPasses(): [ShaderPass, ShaderPass] {
    if (!this.blurH || !this.blurV) {
      const taps = Math.max(3, QUALITY_COST[lookState.quality].blurTaps);
      const mk = (dir: [number, number]): ShaderPass => {
        const p = new ShaderPass({ ...LookBlurShader, defines: { BLUR_TAPS: taps } } as never);
        (p.uniforms['direction']!.value as Vector2).set(dir[0], dir[1]);
        p.enabled = false;
        return p;
      };
      this.blurH = mk([1, 0]);
      this.blurV = mk([0, 1]);
      const at = this.r.composer.passes.indexOf(this.r.tiltV);
      this.r.composer.insertPass(this.blurH, at + 1);
      this.r.composer.insertPass(this.blurV, at + 2);
    }
    return [this.blurH, this.blurV];
  }

  /** The quality changed: rebuild the shaders' constants (the materials compile again the next time they draw). */
  private rebuildDefines(): void {
    for (const [name, p] of this.main) {
      p.material.defines = this.defines(name);
      p.material.needsUpdate = true;
    }
    for (const p of [this.blurH, this.blurV]) {
      if (!p) continue;
      p.material.defines = { BLUR_TAPS: Math.max(3, QUALITY_COST[lookState.quality].blurTaps) };
      p.material.needsUpdate = true;
    }
  }

  // ----------------------------------------------------------------- policy

  private applyPolicy(p: LookParams): void {
    this.prevSub = [];
    this.prevDials = {};
    for (const id of p.policy.subOff) {
      if (!eyeCandy.subOff.has(id)) this.prevSub.push(id);
      eyeCandy.setSub(id, false);
    }
    for (const [k, v] of Object.entries(p.policy.dials)) {
      this.prevDials[k] = (eyeCandy.dials as Record<string, number | undefined>)[k];
      eyeCandy.setDial(k as never, v);
    }
  }

  private restorePolicy(): void {
    for (const id of this.prevSub) eyeCandy.setSub(id, true);
    for (const [k, v] of Object.entries(this.prevDials)) eyeCandy.setDial(k as never, v ?? 1);
    this.prevSub = [];
    this.prevDials = {};
  }

  // ----------------------------------------------------------------- per frame

  /** Every frame, after the eye-candy options have written theirs and before the composer runs. */
  update(scene: Scene, camera: Camera): void {
    const wantName = lookState.name;
    const info = boundEyeCandyScene();
    const onBattle = wantName !== null && info !== null && info.scene === scene;
    if (!onBattle) {
      if (this.active) this.deactivate();
      this.lastNow = 0;
      return;
    }
    if (lookState.version !== this.version) {
      this.version = lookState.version;
      if (lookState.quality !== this.quality) {
        this.quality = lookState.quality;
        this.rebuildDefines();
      }
      if (this.active && this.active !== wantName) this.deactivate();
    }
    if (info.scene !== this.room.scene || this.active !== wantName) {
      this.room.enter(info, wantName);
      this.stats.room = info.key;
      this.stats.light = [Math.round(this.room.light.u * 1000) / 1000, Math.round(this.room.light.v * 1000) / 1000];
      this.stats.lightFrom = this.room.light.from;
    }
    if (this.active !== wantName) {
      this.active = wantName;
      this.applyPolicy(LOOKS[wantName]);
      this.prevFigureTrue = figureTrueOf(this.r);
      this.prevTilt = { focus: this.r.tiltH.uniforms['focus']!.value as number, band: this.r.tiltH.uniforms['bandWidth']!.value as number };
    }
    this.frame(wantName, camera);
  }

  /** A number from the look's table, or its live override (`__pyrefly.look.param('shaft.gain', 0.8)`). */
  private val(p: LookParams, path: string): number {
    const t = lookState.tweaks[path];
    if (t !== undefined) return t;
    const [a, b] = path.split('.') as [keyof LookParams, string | undefined];
    const o = p[a] as unknown;
    return (b ? (o as Record<string, number>)[b] : (o as number)) ?? 0;
  }

  private frame(name: LookName, camera: Camera): void {
    const p = LOOKS[name];
    const v = (path: string): number => this.val(p, path);
    const r = this.r;
    const cost = QUALITY_COST[lookState.quality];
    const now = performance.now() / 1000;
    const dt = this.lastNow ? Math.min(0.1, now - this.lastNow) : 0;
    this.lastNow = now;
    if (!eyeCandy.frozen && !eyeCandy.reduceMotion) this.clock += dt;
    r.renderer.getDrawingBufferSize(this.buf);
    const W = this.buf.x;
    const H = this.buf.y;
    const scale = H / 900;
    const pal = r.palette ?? {};
    const room = ROOM_LOOKS[name][this.room.key];
    setMaskEveryFigure(true); // every whole figure writes the mask, whatever the room's own setting

    // --- the grade: the look LUT, the vignette, the grain, the saturation (written after option A, which writes its own each frame)
    const g = r.gradePass.uniforms;
    g['uLook']!.value = this.room.lutFor(name);
    g['lookAmount']!.value = v('grade.lookAmount');
    (g['vignetteTint']!.value as Vector3).set(...p.grade.vignetteTint);
    g['vignette']!.value = (pal.vignette ?? 0.46) + v('grade.vignetteAdd');
    g['vignetteRadius']!.value = v('grade.vignetteRadius');
    g['grain']!.value = v('grade.grain');
    g['grainFps']!.value = p.grade.grainFps;
    g['grainSize']!.value = p.grade.grainSize;
    g['grainHighlights']!.value = 0.5;
    g['saturation']!.value = (pal.saturation ?? 1.08) * (v('grade.saturation') / 1.0);
    if (Math.abs(figureTrueOf(r) - v('grade.figureTrue')) > 1e-3) applyFigureTrue(r, v('grade.figureTrue'));

    // --- the mask-aware blur (its band also steers the sharpening ladder's fade, which reads the stock tilt-shift's band)
    const far = v('blur.far') * scale;
    const near = v('blur.near') * scale;
    const useBlur = cost.blurTaps > 0 && (far > 0.4 || near > 0.4);
    const focus = room?.focus ?? v('blur.focus');
    this.stats.blur = useBlur;
    if (useBlur) {
      const [bh, bv] = this.blurPasses();
      for (const b of [bh, bv]) {
        b.enabled = true;
        const u = b.uniforms;
        (u['resolution']!.value as Vector2).set(1 / Math.max(1, W), 1 / Math.max(1, H));
        u['focus']!.value = focus;
        u['band']!.value = v('blur.band');
        u['falloff']!.value = p.blur.falloff;
        u['farPx']!.value = far;
        u['nearPx']!.value = near;
        u['bokeh']!.value = v('blur.bokeh');
      }
    } else if (this.blurH && this.blurV) this.blurH.enabled = this.blurV.enabled = false;

    // --- the bloom, and the stock tilt-shift: off while the mask-aware blur does its job, the palette's own when quality is too low for it
    const bloom = r.bloomPass.materialHighPassFilter.uniforms;
    bloom['selective']!.value = p.bloom.selective ? 1 : 0;
    bloom['smoothWidth']!.value = p.bloom.selective ? 0.3 : 0.15;
    bloom['whiteDamp']!.value = 0.3;
    (bloom['bloomTint']!.value as Vector3).set(...p.bloom.tint);
    (bloom['uTexel']!.value as Vector2).set(1 / Math.max(1, W), 1 / Math.max(1, H));
    bloom['figureMask']!.value = 1;
    const stock = !useBlur && (p.blur.far > 0 || p.blur.near > 0);
    r.applyPost({
      bloomThreshold: v('bloom.threshold'),
      bloomStrength: v('bloom.strength'),
      bloomRadius: v('bloom.radius'),
      tiltMaxBlur: stock ? (pal.tiltMaxBlur ?? 6) : p.tiltMaxBlur,
      ...(useBlur ? { tiltFocus: focus, tiltBandWidth: v('blur.band') } : {}),
    });

    // --- the compound pass
    for (const [n, mp] of this.main) mp.enabled = n === name;
    const mp = this.mainPass(name);
    mp.enabled = true;
    const u = mp.uniforms;
    (u['resolution']!.value as Vector2).set(1 / Math.max(1, W), 1 / Math.max(1, H));
    u['time']!.value = eyeCandy.frozen ? 0.5 : this.clock;
    u['pxScale']!.value = scale;
    u['aspect']!.value = W / Math.max(1, H);
    u['debugMask']!.value = lookState.debug === 'mask' ? 1 : 0;
    this.room.projectLight(camera, u['uLight']!.value as Vector2);
    const lc = lin(lightColour(this.room.light.color));
    (u['lightColor']!.value as Vector3).set(...lc);
    (u['shaft']!.value as Vector3).set(v('shaft.gain'), v('shaft.reach'), v('shaft.threshold'));
    u['shaftDecay']!.value = p.shaft.decay;
    u['shaftRays']!.value = v('shaft.rays');
    (u['motes']!.value as Vector3).set(v('motes.gain'), (v('motes.size') * scale) / H, v('motes.speed'));
    (u['moteColor']!.value as Vector3).set(...lin(mixc(lightColour(this.room.light.color), [1, 0.84, 0.58], 0.5)));
    (u['fog']!.value as Vector3).set(v('fog.density'), v('fog.speed'), v('fog.height'));
    u['fogOnFigures']!.value = v('fog.onFigures');
    (u['fogColor']!.value as Vector3).set(...this.room.fogRgb);
    (u['rim']!.value as Vector3).set(v('rim.gain'), v('rim.width') * scale, v('rim.lit'));
    (u['rimColor']!.value as Vector3).set(...lin(lightColour(this.room.light.color, 0.12)));
    u['caShift']!.value = cost.ca ? (2 * v('ca') * scale) / Math.max(1, W) : 0;
    (u['outline']!.value as Vector2).set(v('outline.width') * scale, v('outline.strength'));
    (u['ink']!.value as Vector3).set(...p.outline.ink);
    u['sharpen']!.value = v('sharpen');
    (u['figGain']!.value as Vector3).set(...p.figure.gain);
    (u['figLift']!.value as Vector3).set(...p.figure.lift);
    u['figContrast']!.value = v('figure.contrast');
    this.relight(name, u['uLight']!.value as Vector2, W / Math.max(1, H), camera);
    this.stats.look = name;
    this.stats.quality = lookState.quality;
    this.stats.relight = { any: relightCells.relightAny.value > 0, bound: relightStats.bound, loaded: relightStats.loaded, missing: relightStats.missing, lights: this.lights.stats.lights };
    this.stats.passes = r.composer.passes.map((q, i) => `${i}:${q.constructor.name}${q.enabled ? '' : '(off)'}`);
  }

  /** Light on the paintings: the figures lit with their normal maps (hd2d and cinematic; anime stays flat): a key from the room's light, a rim from behind, coloured lights for spells and the orb. */
  private relight(name: LookName, lightUv: Vector2, aspect: number, camera: Camera): void {
    const rl = RELIGHT[name];
    const c = relightCells;
    if (!rl) {
      c.relightAny.value = 0;
      this.lights.remove();
      return;
    }
    const tw = lookState.tweaks;
    const p = { ...rl, key: tw['relight.key'] ?? rl.key, rim: tw['relight.rim'] ?? rl.rim, point: tw['relight.point'] ?? rl.point };
    this.lights.install();
    const from: [number, number] = [0.5, 0.34];
    c.relightKeyDir.value.set(...keyDirection([lightUv.x, lightUv.y], from, aspect, p.keyZ));
    c.relightRimDir.value.set(...rimDirection([lightUv.x, lightUv.y], from, aspect, p.rimZ));
    c.relightKeyCol.value.set(...lin(lightColour(this.room.light.color)));
    c.relightRimCol.value.set(...lin(lightColour(this.room.light.color, 0.12)));
    c.relightKey.value.set(p.key, p.keyTint, p.gainMin, p.gainMax);
    c.relightRimAmt.value = p.rim;
    c.relightAspect.value = aspect;
    c.relightAny.value = tw['relight.off'] ? 0 : 1;
    this.lights.update(this.clock, camera, p);
  }

  private deactivate(): void {
    if (this.active === null) return;
    this.active = null;
    this.room.leave();
    relightCells.relightAny.value = 0;
    this.lights.remove();
    for (const mp of this.main.values()) mp.enabled = false;
    if (this.blurH && this.blurV) this.blurH.enabled = this.blurV.enabled = false;
    this.restorePolicy();
    if (this.prevFigureTrue >= 0) applyFigureTrue(this.r, this.prevFigureTrue);
    this.prevFigureTrue = -1;
    if (this.prevTilt) this.r.applyPost({ tiltFocus: this.prevTilt.focus, tiltBandWidth: this.prevTilt.band });
    this.prevTilt = null;
    const bloom = this.r.bloomPass.materialHighPassFilter.uniforms;
    bloom['selective']!.value = 0;
    bloom['smoothWidth']!.value = 0.01;
    (bloom['bloomTint']!.value as Vector3).set(1, 1, 1);
    const g = this.r.gradePass.uniforms;
    g['lookAmount']!.value = 0;
    (g['vignetteTint']!.value as Vector3).set(0, 0, 0);
    g['grainFps']!.value = 0;
    g['grainSize']!.value = 1;
    g['grainHighlights']!.value = 1;
    if (this.r.palette) this.r.applyPalette(this.r.palette);
    this.stats.look = null;
  }

  dispose(): void {
    this.deactivate();
    for (const mp of this.main.values()) {
      this.r.composer.removePass(mp);
      mp.dispose();
    }
    for (const b of [this.blurH, this.blurV]) {
      if (!b) continue;
      this.r.composer.removePass(b);
      b.dispose();
    }
    this.room.dispose();
    this.main.clear();
  }
}
