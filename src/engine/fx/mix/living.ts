import { PlaneGeometry, Vector2, Vector4, type BufferGeometry, type Mesh, type ShaderMaterial, type Texture } from 'three';
import { departureKindOf } from '../../BattlePresenterDepartures.ts';
import { KO_GIANTS, KO_MACHINES, fallRun, koFallOff, koMode, type KoMode, type KoRun } from '../../KoFall.ts';
import { breathRigFor, flatBreathRig } from './breathRig.ts';
import { setMixPatch } from './patch.ts';

export { patchLiving } from './livingShader.ts';

/**
 * The MAX mix (D-316), LIVING PAINTINGS' two new parts on one painted figure, ported from option A's
 * prototype (`fx/max/a/livingFigure.ts`, `livingShader.ts`) after its hit-blackout fix (the NaN in the
 * spell-fx shaders, `c/FxPools.ts`):
 *
 * - BREATHING: the chest breathes, not the whole figure. The shoulders and what rides on them rise and
 *   the chest swells sideways; the belt line stays put and nothing below the hips moves. The actor's own
 *   whole-figure breathing scale gives way to it while the part plays. FFX at today's speed, FFX-2 at
 *   0.8 times the period (VP-1001-49); a colossus breathes slowly (5 s) and deeper. REDUCE MOTION
 *   stills it (`gates.ts`).
 * - KO COLLAPSE: on a KO the knees give and the body sinks and tips forward on the standing painting
 *   (220 ms FFX, 170 ms FFX-2, inside today's KO beat), then the KO painting CROSSES IN over 75 ms on the
 *   capped curve (FA-1, PR-0378: it was a one-frame cut, EC-1001-09, and 78 of round 23's 96 snaps; how a KO
 *   plays and its clock are `KoFall.ts`). A figure whose standing painting is already flagged prone (a Sin fin,
 *   Vegnagun's tail) and REDUCE MOTION (no buckle, no tilt, nothing moves but the fade) cross at once.
 *   The Syndicate's yield, a held or a dismissed departure are left as they are (VP-1001-47).
 *
 * Attached by a scene walk, never by a hook in `PaintedActor` (over 400 lines, rule 7): the figure's
 * own vertex shader (the painted one, or LIVING PAINTINGS' sway) is patched by `onBeforeCompile`, its
 * plane swapped for a grid, and `setPose` wrapped on the instance (chained, and inert when the part is
 * off). It reads the actor's own state and never changes a timing the presenter waits on, the engine or
 * the RNG (rule 1). Game case: both, with the per-game tempo above.
 */

type Slot = { mesh: Mesh; material: ShaderMaterial; fade: number; pose: string; scale: { prone?: boolean } };
/** The run that is playing (a KO), and the two planes it crosses. */
interface Playing {
  run: KoRun;
  mode: KoMode;
  from: Slot;
  to: Slot;
}
export interface Guts {
  name: string;
  slots: [Slot, Slot];
  active: number;
  breatheAmp: number;
  breatheSpeed: number;
  crossfadeMs: number;
  facing: number;
  lieRoll: number;
  life: { state: string; posture: { breathe: number; tempo: number } } | null;
  setPose: (name: string, opts?: { immediate?: boolean; force?: boolean }) => void;
  syncOpacity: () => void;
}

interface SlotState {
  u: { mlRig: { value: Texture }; mlLand: { value: Vector4 }; mlA: { value: Vector4 }; mlSlot: { value: Vector2 }; mlOn: { value: number } };
  grid: PlaneGeometry;
  theirs: BufferGeometry;
}

export interface LifeCtx {
  dt: number;
  /** The same frame's unscaled seconds (default `dt`): the KO's cross runs on it, so a hit-stop never freezes a half-mixed pair of paintings (FB-1's lesson). */
  realDt?: number;
  game: 'ffx' | 'ffx2';
  breath: boolean;
  collapse: boolean;
  rm: boolean;
  grid: [number, number];
}

const COLOSSUS = KO_GIANTS;
/** Machines built of separately painted parts, and statues: a chest breath would part their seams. */
const STILL = KO_MACHINES;

export class LivingFigure {
  readonly a: Guts;
  private readonly states = new Map<Slot, SlotState>();
  private readonly saved: { breatheAmp: number };
  private readonly colossus: boolean;
  private readonly still: boolean;
  private phase = Math.random();
  private playing: Playing | null = null;
  private ctx: LifeCtx | null = null;
  readonly last = { breath: 0, buckle: 0, collapses: 0, cuts: 0, crosses: 0 };

  constructor(actor: object) {
    this.a = actor as Guts;
    this.saved = { breatheAmp: this.a.breatheAmp };
    this.colossus = COLOSSUS.test(this.a.name);
    this.still = STILL.test(this.a.name);
    const self = this;
    const prev = this.a.setPose;
    // Chained on the instance (another wrapper may sit under or over it: `restPoses.ts`); inert when off.
    this.a.setPose = function (name: string, opts?: { immediate?: boolean; force?: boolean }): void {
      self.onSetPose(name, opts, prev);
    };
  }

  private attach(s: Slot, grid: [number, number]): void {
    const m = s.material;
    const g = new PlaneGeometry(1, 1, grid[0], grid[1]);
    const u: SlotState['u'] = { mlRig: { value: flatBreathRig().map }, mlLand: { value: new Vector4(0.45, 0.68, 0.84, 0.5) }, mlA: { value: new Vector4() }, mlSlot: { value: new Vector2(1, 1) }, mlOn: { value: 0 } };
    const st: SlotState = { u, grid: g, theirs: s.mesh.geometry };
    Object.assign(m.uniforms, u);
    setMixPatch(m, 'live', true);
    s.mesh.geometry = g;
    this.states.set(s, st);
  }

  private detachSlot(s: Slot, st: SlotState): void {
    const m = s.material;
    setMixPatch(m, 'live', false);
    for (const k of Object.keys(st.u)) delete (m.uniforms as Record<string, unknown>)[k];
    if (s.mesh.geometry === st.grid) s.mesh.geometry = st.theirs;
    st.grid.dispose();
  }

  private onSetPose(name: string, opts: { immediate?: boolean; force?: boolean } | undefined, orig: Guts['setPose']): void {
    const a = this.a;
    const ctx = this.ctx;
    if (name !== 'ko' && name !== 'dead') this.endRun();
    if (!ctx || !ctx.collapse || opts?.immediate || (name !== 'ko' && name !== 'dead') || a.life?.state === 'down') return orig.call(a, name, opts);
    const partySide = a.facing >= 0;
    const kind = partySide ? 'party' : departureKindOf(a.name);
    if (kind === 'yields' || kind === 'held' || kind === 'dismissed') return orig.call(a, name, opts);
    const from = a.slots[a.active]!;
    const keep = a.crossfadeMs;
    a.crossfadeMs = 0; // the actor's own blend stands aside: the KO is played here, plane by plane
    try {
      orig.call(a, name, opts);
    } finally {
      a.crossfadeMs = keep;
    }
    const to = a.slots[a.active]!;
    const mode = koMode({ rm: ctx.rm, samePlane: from === to, samePainting: from.pose === to.pose, fromProne: from.scale.prone === true, toProne: to.scale.prone === true, name: a.name, partySide, legacy: koFallOff() });
    const run = fallRun(mode === 'topple' ? 'buckle-cross' : mode, ctx.game); // FA-2 gives the topple its travel
    if (!run) {
      this.last.cuts++;
      return;
    }
    // The standing painting stays up while the run plays (the actor's cut put the KO painting at 1); the run hands the fades over.
    from.fade = 1;
    to.fade = 0;
    a.syncOpacity();
    this.playing = { run, mode, from, to };
    if (run.opts.buckle) this.last.collapses++;
    if (run.opts.crossMs > 0) this.last.crosses++;
  }

  /** Finish the run where it stands: the KO painting at full, the standing one gone, whatever phase it was in. */
  private endRun(): void {
    const p = this.playing;
    this.playing = null;
    if (p && p.to === this.a.slots[this.a.active]) {
      p.to.fade = 1;
      p.from.fade = 0;
      this.a.syncOpacity();
    }
  }

  update(ctx0: LifeCtx): void {
    const ctx = this.still ? { ...ctx0, breath: false } : ctx0;
    this.ctx = ctx;
    const a = this.a;
    const live = ctx.breath || this.playing !== null;
    if (live) {
      for (const s of a.slots) if (!this.states.has(s)) this.attach(s, ctx.grid);
    } else if (this.states.size) {
      // Both parts off (or the collapse done with BREATHING off): today's plane and program come back.
      for (const [s, st] of this.states) this.detachSlot(s, st);
      this.states.clear();
    }
    // The actor's whole-figure breathing gives way to the chest breath while BREATHING plays.
    a.breatheAmp = ctx.breath ? 0 : this.saved.breatheAmp;
    const period = (this.colossus ? 5 : 1 / Math.max(0.05, a.breatheSpeed || 0.55)) * (ctx.game === 'ffx2' ? 0.8 : 1);
    const posture = a.life?.posture;
    const upright = 1 - a.lieRoll;
    if (ctx.breath) this.phase += (ctx.dt / period) * (posture?.tempo ?? 1);
    const amp = (this.colossus ? 0.024 : 0.02) * (posture?.breathe ?? 1) * upright;
    const breath = ctx.breath ? (Math.sin(this.phase * 6.2831853) * 0.5 + 0.5) * amp : 0;
    let buckle = 0;
    let lean = 0;
    const play = this.playing;
    if (play) {
      play.run.step(ctx.dt * 1000, (ctx.realDt ?? ctx.dt) * 1000);
      const pose = play.run.pose;
      buckle = pose.buckle;
      lean = pose.lean;
      play.from.fade = pose.out;
      play.to.fade = pose.inn;
      a.syncOpacity();
      if (play.run.done) this.endRun();
    }
    for (const s of a.slots) {
      const st = this.states.get(s);
      if (!st) continue;
      // LIVING PAINTINGS' sway swaps the plane when it switches; the grid serves both, so it goes back on.
      if (s.mesh.geometry !== st.grid) {
        st.theirs = s.mesh.geometry;
        s.mesh.geometry = st.grid;
      }
      const tex = s.material.uniforms['map']?.value as Texture | null;
      const rig = tex ? breathRigFor(tex) : flatBreathRig();
      st.u.mlRig.value = rig.map;
      st.u.mlLand.value.set(...rig.land);
      const sx = s.mesh.scale.x;
      st.u.mlSlot.value.set(Math.abs(s.mesh.scale.y / (sx || 1)), sx < 0 ? -1 : 1);
      const fwd = (a.facing >= 0 ? 1 : -1) * (sx < 0 ? -1 : 1);
      st.u.mlA.value.set(breath, Math.min(1, buckle), fwd, lean);
      st.u.mlOn.value = live && s.scale.prone !== true ? 1 : 0; // a prone plane (a KO painting) is never bent
    }
    this.last.breath = +breath.toFixed(4);
    this.last.buckle = +buckle.toFixed(3);
  }

  /** Put the figure back as `PaintedActor` made it (the battle ended; the setPose wrapper stays, inert). */
  detach(): void {
    this.endRun();
    this.ctx = null;
    this.a.breatheAmp = this.saved.breatheAmp;
    for (const [s, st] of this.states) this.detachSlot(s, st);
    this.states.clear();
  }
}
