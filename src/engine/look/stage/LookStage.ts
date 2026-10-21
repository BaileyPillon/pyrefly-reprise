/**
 * Demo looks, the DEPTH STAGE (release 61): the per-frame work. It runs inside the HD-2D bold look (`LookRig.ts`), so the look's own switches are its switches: `?look=off`, the VISUAL STYLE
 * setting's CLASSIC and any chapter without a recipe get none of it, and nothing is built until it is wanted. Both games for the plumbing; the room's recipe is `StageConfig.ROOM_STAGE`
 * (only Chapter I's Mt. Gagazet, FFX, has one).
 *
 * What it does each frame: advances the room's wind (`StageMaths.gustAt`) and writes it to the shared cell (`StageWind.ts`) that the weather reads, and moves the moon's glitter on the ice
 * (`StageGlintShader.ts`): one flat sheet under the figures whose sparkles depend on the real eye, floor point and moon, so the road slides with the camera drift as the painted plates do.
 * The painting's layers themselves are option B's depth plates (`fx/b/DepthPlates.ts`), which cut the SAME painting by its depth map; this class adds nothing painted.
 */
import { Color, Group, Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3, type Scene } from 'three';
import { eyeCandy } from '../../fx/EyeCandy.ts';
import { Haze } from '../../fx/b/Haze.ts';
import type { LookQuality } from '../LookConfig.ts';
import type { LookRoom } from '../LookRoom.ts';
import { srgbDecode } from '../../figureTrue.ts';
import { STAGE_QUALITY, stageRecipe, type StageRecipe } from './StageConfig.ts';
import { glintMaterial, type GlintUniforms } from './StageGlintShader.ts';
import { gustAt, gustShaft, gustThicken, windClock, type WindSpec } from './StageMaths.ts';
import { calmStageWind, setStageWind, stageWind } from './StageWind.ts';

/** Under the figures (they draw at 0), over the lit ground (-48 the icy sheen, -47 the drifts). */
const GLINT_ORDER = -46;
/** The mist bank behind the fighters draws over the ground and under them; the one at their feet draws over them (option B's `OVER_GROUND` and `NEAR`). */
const MIST_BEHIND = -45;
const MIST_FRONT = 40;
const hex = (c: readonly number[]): number => (Math.round(c[0]! * 255) << 16) | (Math.round(c[1]! * 255) << 8) | Math.round(c[2]! * 255);

export interface StageFrame {
  scene: Scene;
  room: LookRoom;
  quality: LookQuality;
  /** The look's own clock (seconds): stops under REDUCE MOTION and while frozen. */
  time: number;
  /** The look's live number overrides (`__pyrefly.look.param('stage.glint', 2)`). */
  tweak: (key: string, fallback: number) => number;
}

export class LookStage {
  private group: Group | null = null;
  private glint: { mesh: Mesh; mat: ShaderMaterial; u: GlintUniforms; geo: PlaneGeometry } | null = null;
  private scene: Scene | null = null;
  private key = '';
  private painting: Mesh | null = null;
  private mist: Haze[] = [];
  /** The weather's own clock: the look's clock, run faster while a gust blows (`StageMaths.windClock`), which the mist banks scroll on. */
  private wclock = 0;
  private lastTime = Number.NaN;
  /** The look's clock at the stage's own zero: a capture sets `stage.t0` so its gusts land on the same seconds in every take (`__pyrefly.look.param('stage.t0', 4)`). */
  private origin = 0;
  private lastT0 = Number.NaN;
  private readonly moonLocal = new Vector3();
  private readonly moonWorld = new Vector3();
  /** For the debug API and the captures. */
  readonly stats = { on: false, room: '', t: 0, gust: 0, speed: 1, glint: false, amount: 0, mist: 0, moon: [0, 0, 0] as number[] };

  /** Build what the room's recipe needs now (the battle screen's shader warm-up compiles it before the first frame). A no-op for a room with no recipe. Safe to call again. */
  prepare(scene: Scene, key: string): void {
    const recipe = stageRecipe(key);
    if (!recipe) return;
    if (this.scene === scene && this.key === key && this.group) return;
    this.off();
    this.scene = scene;
    this.key = key;
    this.group = new Group();
    this.group.name = 'look-stage';
    scene.add(this.group);
    scene.traverse((o) => {
      if (!this.painting && o.name === 'backdrop-painting' && (o as Mesh).isMesh) this.painting = o as Mesh;
    });
    recipe.mist.forEach((m, i) => {
      const h = new Haze({ y: m.y, z: m.z, w: m.w, h: m.h, color: hex(m.color), opacity: m.opacity, flow: [m.flow[0], m.flow[1]], scale: [m.scale[0], m.scale[1]], gust: 0.4, cover: m.cover, renderOrder: m.behind ? MIST_BEHIND : MIST_FRONT, fadeBottom: 0.12, fadeTop: m.behind ? 0.45 : 0.7 }, 40 + i);
      h.mesh.name = 'look-stage-mist';
      this.group!.add(h.mesh);
      this.mist.push(h);
    });
    const g = recipe.glint;
    if (g && this.painting) {
      const geo = this.painting.geometry as PlaneGeometry;
      const W = geo.parameters.width;
      const H = geo.parameters.height;
      this.moonLocal.set((g.moon[0] - 0.5) * W, (0.5 - g.moon[1]) * H, 0);
      const u: GlintUniforms = {
        uMoon: { value: new Vector3() },
        uColor: { value: new Color(srgbDecode(g.color[0]), srgbDecode(g.color[1]), srgbDecode(g.color[2])) },
        uSheenColor: { value: new Color(srgbDecode(g.sheenColor[0]), srgbDecode(g.sheenColor[1]), srgbDecode(g.sheenColor[2])) },
        uTime: { value: 0 },
        uGain: { value: g.gain },
        uCell: { value: g.cell },
        uRough: { value: g.rough },
        uWidth: { value: g.width },
        uSpeed: { value: g.speed },
        uSheen: { value: g.sheen },
        uAmount: { value: 0 },
        uCenter: { value: new Vector2(g.center[0], g.center[1]) },
        uRadius: { value: g.radius },
      };
      const mat = new ShaderMaterial(glintMaterial(u));
      const plane = new PlaneGeometry(g.radius * 2, g.radius * 2, 1, 1);
      const mesh = new Mesh(plane, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(g.center[0], 0.02, g.center[1]);
      mesh.renderOrder = GLINT_ORDER;
      mesh.frustumCulled = false;
      mesh.name = 'look-stage-glint';
      // visible with an amount of 0 (it draws nothing) so the battle's shader warm-up compiles it; `update` sets both every frame, and the rig takes the stage away when the look is off
      this.group.add(mesh);
      this.glint = { mesh, mat, u, geo: plane };
    }
  }

  /** One frame. Returns false (and does nothing) when the room has no recipe. */
  update(f: StageFrame): boolean {
    const recipe = stageRecipe(f.room.key);
    if (!recipe || recipe.game !== (f.room.game === 'ffx2' ? 'ffx2' : 'ffx')) {
      this.off();
      return false;
    }
    if (this.scene !== f.scene || this.key !== f.room.key || !this.group) this.prepare(f.scene, f.room.key);
    const t0 = f.tweak('stage.t0', Number.NaN);
    if (t0 !== this.lastT0 && !(Number.isNaN(t0) && Number.isNaN(this.lastT0))) {
      this.lastT0 = t0;
      this.origin = Number.isFinite(t0) ? f.time - t0 : 0;
    }
    const t = f.time - this.origin;
    this.stats.on = true;
    this.stats.room = f.room.key;
    this.stats.t = Math.round(t * 100) / 100;
    const q = STAGE_QUALITY[f.quality];
    const lowFx = eyeCandy.tier === 'low';
    const dt = Number.isFinite(this.lastTime) ? Math.min(0.1, Math.max(0, f.time - this.lastTime)) : 0;
    this.lastTime = f.time;
    this.wind(recipe, f, t, dt, q.wind, q.density);
    this.mistFrame(f, q.density, lowFx);
    this.glintFrame(recipe, f, t, lowFx ? 0 : q.glint);
    return true;
  }

  private wind(recipe: StageRecipe, f: StageFrame, t: number, dt: number, k: number, density: number): void {
    const s = f.tweak('stage.wind', 1) * k;
    const w: WindSpec = { ...recipe.wind, speedUp: recipe.wind.speedUp * s, thicken: recipe.wind.thicken * s, shaft: (recipe.wind.shaft ?? 0) * s };
    // REDUCE MOTION holds the weather still (the look's clock stops), so the gust stands still with it: no surge of speed
    const g = eyeCandy.reduceMotion ? 0 : gustAt(t, w);
    const speed = eyeCandy.reduceMotion ? 1 : 1 + w.speedUp * g;
    this.wclock = windClock(this.wclock, dt, g, w); // the clock the mist banks scroll on: real time, run faster while a gust blows
    setStageWind(g, speed, eyeCandy.reduceMotion ? 1 : gustThicken(g, w), eyeCandy.reduceMotion ? 1 : gustShaft(g, w), f.tweak('stage.density', density));
    this.stats.gust = Math.round(g * 1000) / 1000;
    this.stats.speed = Math.round(speed * 1000) / 1000;
  }

  /** The mist banks scroll on the gust-run clock and thicken with the gust; the quality tier keeps the nearer banks and drops the far ones first. */
  private mistFrame(f: StageFrame, density: number, lowFx: boolean): void {
    const keep = Math.max(1, Math.ceil(this.mist.length * f.tweak('stage.density', density)));
    const gain = lowFx || eyeCandy.dial('weather') <= 0 ? 0 : f.tweak('stage.mist', 1) * stageWind.thicken; // LOW EFFECTS (option B has no haze there either) and a weather dial of 0 take the banks away
    this.mist.forEach((h, i) => {
      h.mesh.visible = gain > 0.001 && i >= this.mist.length - keep;
      h.update(this.wclock, gain);
    });
    this.stats.mist = this.mist.filter((h) => h.mesh.visible).length;
  }

  private glintFrame(recipe: StageRecipe, f: StageFrame, t: number, share: number): void {
    const gl = this.glint;
    const g = recipe.glint;
    if (!gl || !g) {
      this.stats.glint = false;
      return;
    }
    const amount = share * f.tweak('stage.glint', 1);
    gl.mesh.visible = amount > 0.001;
    this.stats.glint = gl.mesh.visible;
    this.stats.amount = Math.round(amount * 100) / 100;
    if (!gl.mesh.visible) return;
    if (this.painting) {
      this.painting.updateWorldMatrix(true, false);
      this.moonWorld.copy(this.moonLocal).applyMatrix4(this.painting.matrixWorld);
    }
    gl.u.uMoon.value.copy(this.moonWorld);
    gl.u.uTime.value = t;
    gl.u.uAmount.value = amount;
    gl.u.uGain.value = g.gain * f.tweak('stage.gain', 1);
    gl.u.uRough.value = g.rough * f.tweak('stage.rough', 1); // live tuning (`__pyrefly.look.param('stage.rough', 0.8)` ...): each is a multiplier on the recipe's number
    gl.u.uWidth.value = g.width * f.tweak('stage.width', 1);
    gl.u.uCell.value = g.cell * f.tweak('stage.cell', 1);
    gl.u.uSheen.value = g.sheen * f.tweak('stage.sheen', 1);
    gl.u.uSpeed.value = g.speed * f.tweak('stage.speed', 1);
    this.stats.moon = [Math.round(this.moonWorld.x * 10) / 10, Math.round(this.moonWorld.y * 10) / 10, Math.round(this.moonWorld.z * 10) / 10];
  }

  /** The stage is not wanted (the look is off, another room, a style that is not bold): take everything away and leave the wind calm. */
  off(): void {
    calmStageWind();
    this.stats.on = false;
    this.stats.gust = 0;
    this.stats.speed = 1;
    this.stats.glint = false;
    if (this.glint) {
      this.glint.geo.dispose();
      this.glint.mat.dispose();
      this.glint = null;
    }
    for (const h of this.mist) h.dispose();
    this.mist = [];
    this.wclock = 0;
    this.lastTime = Number.NaN;
    if (this.group) {
      this.group.removeFromParent();
      this.group.clear();
      this.group = null;
    }
    this.scene = null;
    this.key = '';
    this.painting = null;
    this.origin = 0;
    this.lastT0 = Number.NaN;
  }

  dispose(): void {
    this.off();
  }
}
