/**
 * Demo looks: the rig that puts one of three looks (`LookConfig.ts`) over the existing renderer. Dev flag only (`?look=hd2d|cinematic|anime`); with no flag the
 * renderer never builds it and today's frame is untouched. Both games (shared plumbing); each room's grade, light and fog come from its own painting.
 *
 * What it adds to the chain (`Renderer.ts`): the mask-aware blur (two passes after the stock tilt-shift), the compound look pass (just before the grade) and, every
 * frame after option A has written its own settings, the look's values for the grade (LUT, vignette, grain, saturation), the bloom and the stock tilt-shift. The eye-candy
 * sub-effects the look replaces (A's depth of field, shafts, streaks, look LUT, rim) are switched off for as long as it is on and put back when it goes. The HUD is DOM
 * above the canvas, so none of this can touch it.
 */
import { Vector2, Vector3, Vector4, type Camera, type Scene } from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { Renderer } from '../Renderer.ts';
import { applyFigureTrue, figureTrueOf } from '../figureTrue.ts';
import { setMaskEveryFigure } from '../BloomMask.ts';
import { eyeCandy } from '../fx/EyeCandy.ts';
import { boundEyeCandyScene } from '../fx/a/GoldenHour.ts';
import { QUALITY_COST, type LookName, type LookParams, type LookQuality } from './LookConfig.ts';
import { lookParams, roomBold } from './LookBoldConfig.ts';
import { LookBold } from './LookBold.ts';
import { LookDrift } from './LookDrift.ts';
import { ROOM_LOOKS } from './LookGrades.ts';
import { LookBlurShader } from './LookBlurShader.ts';
import { LookMainShader } from './LookMainShader.ts';
import { lightColour } from './LookMaths.ts';
import { LookRoom, lin, mixc } from './LookRoom.ts';
import { relightCells, relightStats } from './relight/FigureRelight.ts';
import { RelightLights } from './relight/RelightLights.ts';
import { lookState } from './LookState.ts';
import { LookStage } from './stage/LookStage.ts';
import { applyRelight } from './LookRelight.ts';
import { proRoom, type ProRoom } from './pro/ProGrade.ts';
import { applyProCone, applyProGrade } from './pro/ProRigTerms.ts';
import { proSeam } from './pro/ProSeam.ts';
import { proPieceOn } from './pro/ProSwitch.ts';
import { stageWind } from './stage/StageWind.ts';

export { lookWanted } from './LookState.ts';

const DEFINE_FOR: Record<LookName, string> = { hd2d: 'LOOK_HD2D', cinematic: 'LOOK_CINE', anime: 'LOOK_ANIME' };

export class LookRig {
  private readonly main = new Map<LookName, ShaderPass>();
  private blurH: ShaderPass | null = null;
  private blurV: ShaderPass | null = null;
  private active: LookName | null = null;
  private readonly room = new LookRoom();
  private readonly lights = new RelightLights();
  /** Bold strength (`?lookstrength=bold`): the extra pass; built the first time it is wanted. */
  private bold: LookBold | null = null;
  private readonly drift = new LookDrift();
  /** Release 61: the depth stage (the room's wind and the moon's glitter on the ice), inside the bold look; Chapter I's Gagazet only (`stage/StageConfig.ts`). */
  private readonly stage = new LookStage();
  private version = -1;
  private quality: LookQuality = lookState.quality;
  private prevSub: string[] = [];
  private prevDials: Record<string, number | undefined> = {};
  private prevFigureTrue = -1;
  private prevTilt: { focus: number; band: number } | null = null;
  private clock = 0;
  private lastNow = 0;
  /** Lane pro-look: the key of the pro room this rig last entered with ('' = none), so a live flip of the switch re-reads the room's light. */
  private proKey = '';
  private readonly coneUv = new Vector2();
  private readonly buf = new Vector2();
  /** For the debug API and the captures. */
  readonly stats = { look: null as LookName | null, quality: 'high' as LookQuality, room: '', light: [0, 0] as [number, number], lightFrom: 'default', blur: false, passes: [] as string[], relight: { any: false, bound: 0, loaded: 0, missing: 0, lights: [] as Array<{ u: number; v: number; s: number }> }, strength: 'subtle' as string, bold: null as LookBold['stats'] | null, drift: null as LookDrift['stats'] | null, stage: null as LookStage['stats'] | null, living: null as LookBold['living']['stats'] | null, flare: null as LookBold['flare']['stats'] | null };

  constructor(private readonly r: Renderer) {}

  // ----------------------------------------------------------------- building

  private mainPass(name: LookName): ShaderPass {
    let p = this.main.get(name);
    if (p) return p;
    p = new ShaderPass({ ...LookMainShader, defines: this.defines(name) } as never);
    p.enabled = false;
    const gi = this.r.composer.passes.indexOf(this.r.gradePass);
    const bi = this.bold?.pass ? this.r.composer.passes.indexOf(this.bold.pass) : -1; // the bold pass runs after the compound pass
    this.r.composer.insertPass(p, bi >= 0 ? bi : gi < 0 ? this.r.composer.passes.length : gi);
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
        const p = new ShaderPass({ ...LookBlurShader, defines: { BLUR_TAPS: taps, MAX_BOX: 8 } } as never);
        p.uniforms['uBox']!.value = Array.from({ length: 8 }, () => new Vector4());
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
      p.material.defines = { BLUR_TAPS: Math.max(3, QUALITY_COST[lookState.quality].blurTaps), MAX_BOX: 8 };
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

  /**
   * Release 60 (the look is on by default in two chapters): build the passes the look is about to need BEFORE its first frame, so the battle screen's shader warm-up compiles them behind the
   * battle-start card instead of inside the first battle frame (measured: a 1.1 s frame at the start of Chapter I). Builds what `frame()` would build for the wanted look at the current quality and
   * strength, and nothing else; a no-op when no look is wanted. Safe to call again.
   */
  prepare(): void {
    const name = lookState.name;
    if (name === null) return;
    this.mainPass(name);
    const p = lookParams(name, lookState.strength);
    if (QUALITY_COST[lookState.quality].blurTaps > 0 && (p.blur.far > 0 || p.blur.near > 0)) this.blurPasses();
    if (lookState.strength === 'bold' && name !== 'anime') (this.bold ??= new LookBold(this.r)).prepare(lookState.quality);
    const info = boundEyeCandyScene();
    if (info && this.stage.wanted(name, lookState.strength, info.key, lookState.tweaks)) this.stage.prepare(info.scene, info.key); // the glitter's program compiles with the diorama's, behind the battle-start card
  }

  // ----------------------------------------------------------------- per frame

  /** Every frame, after the eye-candy options have written theirs and before the composer runs. */
  update(scene: Scene, camera: Camera): void {
    const wantName = lookState.name;
    const info = boundEyeCandyScene();
    const onBattle = wantName !== null && info !== null && info.scene === scene;
    if (!onBattle) {
      if (this.active) this.deactivate();
      this.stage.off(); // a stage prepared for a look that was switched off before its first frame (CLASSIC)
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
    const proNow = this.proRoomNow(info.key);
    if (info.scene !== this.room.scene || this.active !== wantName || this.proKey !== (proNow ? info.key : '')) {
      this.proKey = proNow ? info.key : '';
      this.room.enter(info, wantName);
      if (proNow) this.room.light.color = proNow.lightColor; // lane pro-look: the room's one light, in its own colour
      this.stats.room = info.key;
      this.stats.light = [Math.round(this.room.light.u * 1000) / 1000, Math.round(this.room.light.v * 1000) / 1000];
      this.stats.lightFrom = this.room.light.from;
    }
    if (this.active !== wantName) {
      this.active = wantName;
      this.applyPolicy(lookParams(wantName, lookState.strength));
      this.prevFigureTrue = figureTrueOf(this.r);
      this.prevTilt = { focus: this.r.tiltH.uniforms['focus']!.value as number, band: this.r.tiltH.uniforms['bandWidth']!.value as number };
    }
    this.frame(wantName, camera);
  }

  /** Lane pro-look: the pro table of the room being drawn, when the chapter's look is the pro arena. */
  private proRoomNow(key: string): ProRoom | undefined {
    return lookState.pro ? proRoom(key) : undefined;
  }

  /** A tweak: the console's live override, else the pro arena's own number, else undefined. */
  private tw(path: string): number | undefined {
    return lookState.tweaks[path] ?? this.proRoomNow(this.room.key)?.tweaks[path];
  }

  /** A number from the look's table, or its live override (`__pyrefly.look.param('shaft.gain', 0.8)`). */
  private val(p: LookParams, path: string): number {
    const t = this.tw(path);
    if (t !== undefined) return t;
    const [a, b] = path.split('.') as [keyof LookParams, string | undefined];
    const o = p[a] as unknown;
    return (b ? (o as Record<string, number>)[b] : (o as number)) ?? 0;
  }

  private frame(name: LookName, camera: Camera): void {
    const p = lookParams(name, lookState.strength);
    const bold = lookState.strength === 'bold' && name !== 'anime';
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
    const proR = this.proRoomNow(this.room.key);
    g['uLook']!.value = this.room.lutFor(name, lookState.strength, lookState.recipe, proR !== undefined);
    g['lookAmount']!.value = v('grade.lookAmount');
    (g['vignetteTint']!.value as Vector3).set(...p.grade.vignetteTint);
    g['vignette']!.value = (pal.vignette ?? 0.46) + v('grade.vignetteAdd');
    g['vignetteRadius']!.value = v('grade.vignetteRadius');
    g['grain']!.value = v('grade.grain');
    g['grainFps']!.value = p.grade.grainFps;
    g['grainSize']!.value = p.grade.grainSize;
    g['grainHighlights']!.value = 0.5;
    if (proR) applyProGrade(g, proR, lookState.tweaks); // lane pro-look: the arena's haze veil, vignette and grain (`pro/ProRigTerms.ts`)
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
        // bold: every actor's box stays sharp, whatever the band and whatever a flash did to its alpha (last frame's boxes: they move a hair per frame)
        const bx = bold && this.bold ? this.bold : null;
        u['boxN']!.value = bx ? bx.boxCount : 0;
        if (bx) u['uBox']!.value = bx.boxes;
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
    const moon = this.stage.wanted(name, lookState.strength, this.room.key, lookState.tweaks) ? this.stage.moonLight(this.room.key) : null; // release 61: the shafts start at the painted moon, faint
    u['shaftCont']!.value = moon ? 1 : 0;
    if (moon) this.room.projectLight(camera, u['shaftL']!.value as Vector2, moon);
    else (u['shaftL']!.value as Vector2).copy(u['uLight']!.value as Vector2);
    const lc = lin(lightColour(this.room.light.color));
    (u['lightColor']!.value as Vector3).set(...lc);
    (u['shaft']!.value as Vector3).set(v('shaft.gain') * stageWind.shaft * (moon ? (this.tw('stage.shaft') ?? 0.075) : 1), v('shaft.reach'), v('shaft.threshold')); // the depth stage's gusts brighten the moon's shafts (1 with the stage off)
    u['shaftDecay']!.value = p.shaft.decay;
    u['shaftRays']!.value = v('shaft.rays');
    u['shaftFreq']!.value = p.shaft.freq ?? 6;
    (u['motes']!.value as Vector3).set(v('motes.gain'), (v('motes.size') * scale) / H, v('motes.speed'));
    (u['moteExtra']!.value as Vector2).set(v('motes.glow'), p.motes.density ?? 0.4);
    (u['moteColor']!.value as Vector3).set(...lin(mixc(lightColour(this.room.light.color), [1, 0.84, 0.58], 0.5)));
    (u['fog']!.value as Vector3).set(v('fog.density'), v('fog.speed'), v('fog.height'));
    u['fogOnFigures']!.value = v('fog.onFigures');
    (u['fogColor']!.value as Vector3).set(...this.room.fogRgb);
    (u['rim']!.value as Vector3).set(v('rim.gain'), v('rim.width') * scale, v('rim.lit'));
    (u['rimColor']!.value as Vector3).set(...lin(lightColour(this.room.light.color, 0.12)));
    if (this.bold) this.bold.rimOff.update(u, this.bold.boxes, this.bold.boxCount); // lane boss-matte: no rim on the re-cut bosses (last frame's boxes)
    u['caShift']!.value = cost.ca ? (2 * v('ca') * scale) / Math.max(1, W) : 0;
    (u['outline']!.value as Vector2).set(v('outline.width') * scale, v('outline.strength'));
    (u['ink']!.value as Vector3).set(...p.outline.ink);
    u['sharpen']!.value = v('sharpen');
    (u['figGain']!.value as Vector3).set(...p.figure.gain);
    (u['figLift']!.value as Vector3).set(...p.figure.lift);
    u['figContrast']!.value = v('figure.contrast');
    applyRelight({ room: this.room, lights: this.lights, clock: this.clock, tw: (p) => this.tw(p) }, name, u['uLight']!.value as Vector2, W / Math.max(1, H), camera);
    const lightUv = u['uLight']!.value as Vector2;
    if (bold) {
      this.bold ??= new LookBold(r);
      this.bold.update({ scene: this.room.scene!, camera, name, room: this.room, lights: this.lights, quality: lookState.quality, dt, now, time: eyeCandy.frozen ? 0.5 : this.clock, scale, W, H, aspect: W / Math.max(1, H), lightUv: [lightUv.x, lightUv.y], tweak: (k, d) => this.tw(k) ?? d, seam: proR && proPieceOn('seam') ? (proSeam(this.room.key) ?? null) : null });
    } else this.bold?.off();
    applyProCone(g, proR, { lightUv: moon ? (u['shaftL']!.value as Vector2) : lightUv, aspect: W / Math.max(1, H), time: eyeCandy.frozen ? 0.5 : this.clock, k: lookState.tweaks['cone'] ?? 1, camera, scratch: this.coneUv, project: (c, o, at) => this.room.projectLight(c, o, at) }); // the cone follows the painted moon where the depth stage has one (Chapter I), else the room's found light
    if (lookState.drift) this.drift.update(this.room.scene!, camera, this.room.painting, roomBold(this.room.key).driftPx ?? 3, dt, W, scale, lookState.commandOpen);
    else this.drift.release();
    if (this.stage.wanted(name, lookState.strength, this.room.key, lookState.tweaks)) this.stage.update({ scene: this.room.scene!, room: this.room, quality: lookState.quality, time: eyeCandy.frozen ? 0.5 : this.clock, tweak: (k, d) => this.tw(k) ?? d });
    else this.stage.off();
    this.stats.strength = bold ? 'bold' : 'subtle';
    this.stats.bold = bold ? (this.bold?.stats ?? null) : null;
    this.stats.drift = lookState.drift ? this.drift.stats : null; this.stats.stage = this.stage.stats.on ? this.stage.stats : null; this.stats.living = bold && this.bold?.living.stats.on ? this.bold.living.stats : null; this.stats.flare = bold ? (this.bold?.flare.stats ?? null) : null;
    this.stats.look = name;
    this.stats.quality = lookState.quality;
    this.stats.relight = { any: relightCells.relightAny.value > 0, bound: relightStats.bound, loaded: relightStats.loaded, missing: relightStats.missing, lights: this.lights.stats.lights };
    this.stats.passes = r.composer.passes.map((q, i) => `${i}:${q.constructor.name}${q.enabled ? '' : '(off)'}`);
  }

  private deactivate(): void {
    if (this.active === null) return;
    this.active = null;
    this.room.leave();
    relightCells.relightAny.value = 0;
    this.lights.remove();
    this.bold?.off();
    this.drift.release();
    this.stage.off();
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
    (g['uConeCol']!.value as Vector4).w = 0; // the pro arena's cone goes with the look
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
    this.bold?.dispose();
    this.stage.dispose();
    this.room.dispose();
    this.main.clear();
  }
}
