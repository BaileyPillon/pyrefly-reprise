import { PlaneGeometry, Vector2, Vector4, type BufferGeometry, type Mesh, type Object3D, type ShaderMaterial, type Texture } from 'three';
import { departureKindOf } from '../../BattlePresenterDepartures.ts';
import { KO_GIANTS, KO_MACHINES, canTopple, fallRun, koFallOff, koMode, reviveRun, type KoMode, type KoRun } from '../../KoFall.ts';
import { KoPuff } from '../../KoPuff.ts';
import { TOPPLE_RAD, contentCentreX, headCentreX, headMiddleU, tipSide, type SlotTip } from '../../KoTip.ts';
import { breathRigFor, flatBreathRig } from './breathRig.ts';
import { setMixPatch } from './patch.ts';
import { demoMotionOn } from '../../motion/DemoMotion.ts'; // `?motion=demo`: the chest breath keeps the figure's own slow squash beside it, on the same period and phase

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
 *   plays and its clock are `KoFall.ts`). A human-scale party figure whose KO painting is a lying body also
 *   dust puff (FA-2, the page's option B, `KoTip.ts`, `KoPuff.ts`). A figure whose standing painting is already
 *   flagged prone (a Sin fin, Vegnagun's tail) crosses at once, with no buckle. REDUCE MOTION stays a plain cut and
 *   a revive under it stays the actor's own blend: the page recommends "stays a cut unless you say otherwise" and
 *   Bailey took the page defaults. The revive mirrors the fall (FA-3): the lying painting crosses to the standing one already
 *   toppled, which stands up from the floor pivot in 395 ms, inside the presenter's revive wait. The Syndicate's
 *   yield, a held or a dismissed departure are left as they are (VP-1001-47).
 *
 * Attached by a scene walk, never by a hook in `PaintedActor` (over 400 lines, rule 7): the figure's
 * own vertex shader (the painted one, or LIVING PAINTINGS' sway) is patched by `onBeforeCompile`, its
 * plane swapped for a grid, and `setPose` wrapped on the instance (chained, and inert when the part is
 * off). It reads the actor's own state and never changes a timing the presenter waits on, the engine or
 * the RNG (rule 1). Game case: both, with the per-game tempo above.
 */

type Slot = {
  mesh: Mesh;
  material: ShaderMaterial;
  fade: number;
  pose: string;
  scale: { prone?: boolean; offsetY: number; width: number; height: number; contentBox: { x0: number; x1: number; y0: number; y1: number } };
  meta: { head?: readonly [number, number, number, number] };
};
/** The run that is playing (a KO), and the planes it crosses: `stand` is the one that tips (when anything does) over `lying`; `side` is the way it falls (0: nothing tips). */
interface Playing {
  run: KoRun;
  mode: KoMode;
  from: Slot;
  to: Slot;
  stand: Slot;
  lying: Slot;
  side: 0 | 1 | -1;
  /** Motion pass, step 3: the cross is a cut inside the smear's window, and the window is open (`PaintedActor.koCutBegin`). */
  cutting?: boolean;
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
  /** How much of the fall's own tilt and drop shows (`PaintedActor.fallGain`): 0 while a topple replaces it, and for a cross with no buckle. */
  fallGain: number;
  height: number;
  setPose: (name: string, opts?: { immediate?: boolean; force?: boolean }) => void;
  syncOpacity: () => void;
  tipSlot: (slot: Slot, tip: SlotTip | null) => void;
  /** Motion pass, step 3 (`PaintedActor`): the knock-out's cut. `koCutWindow` answers the window in ms, or undefined for the plain cross. */
  koCutWindow?: () => number | undefined;
  koCutBegin?: (info: { from: string; to: string; cutMs: number; dirX: number }) => void;
  koCutStep?: (u: number) => void;
  koCutEnd?: () => void;
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
  private puff: KoPuff | null = null;
  private ctx: LifeCtx | null = null;
  readonly last = { breath: 0, buckle: 0, collapses: 0, cuts: 0, crosses: 0, topples: 0, rises: 0 };

  constructor(actor: object) {
    this.a = actor as Guts;
    this.saved = { breatheAmp: this.a.breatheAmp };
    this.colossus = COLOSSUS.test(this.a.name);
    this.still = STILL.test(this.a.name);
    const dealt = demoMotionOn() ? (actor as { userData?: Record<string, unknown> }).userData?.['idlePhase'] : undefined;
    if (typeof dealt === 'number') this.phase = dealt; // `?motion=demo`: the phase `PaintedActor` was dealt (`motion/DemoIdle.ts`), so the squash and the chest swell rise together
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
    const down = a.life?.state === 'down';
    if (name !== 'ko' && name !== 'dead') {
      this.endRun();
      a.fallGain = 1; // the figure is up: its own fall tilt is its again
    }
    if (!ctx || !ctx.collapse || opts?.immediate) return orig.call(a, name, opts);
    if (name !== 'ko' && name !== 'dead') return down ? this.revive(name, opts, orig, ctx) : orig.call(a, name, opts);
    if (down) return orig.call(a, name, opts);
    const partySide = a.facing >= 0;
    const kind = partySide ? 'party' : departureKindOf(a.name);
    if (kind === 'yields' || kind === 'held' || kind === 'dismissed') return orig.call(a, name, opts);
    this.endRun(); // a run still playing (a revive a moment ago) is finished before this KO reads the planes
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
    const run = fallRun(mode, ctx.game, a.koCutWindow?.()); // the smear's window when the moments and the smear are on: the cross is a cut inside it
    if (!run) {
      this.last.cuts++;
      return;
    }
    // A body falls to the side its KO painting's head lies on (the way it faces when the painting has no registered head).
    const side = run.opts.travel ? tipSide(headMiddleU(to.meta.head), to.mesh.scale.x < 0 ? -1 : 1, partySide ? 1 : -1) : 0;
    this.begin({ run, mode, from, to, stand: from, lying: to, side });
    if (run.opts.travel) this.last.topples++;
  }

  /**
   * FA-3: a body that was down is asked for a standing pose. The actor's own blend stands aside (it cuts to the standing painting at once, as it does for a KO) and the
   * run crosses the planes from the lying body: with travel (a human-scale party figure) to the standing painting already toppled where the body
   * lay, which then stands up; without, only the short cross. Under REDUCE MOTION there is no run: the actor's own blend, as before FA-3.
   */
  private revive(name: string, opts: { immediate?: boolean; force?: boolean } | undefined, orig: Guts['setPose'], ctx: LifeCtx): void {
    const a = this.a;
    const partySide = a.facing >= 0;
    const kind = partySide ? 'party' : departureKindOf(a.name);
    // REDUCE MOTION revives as it did before FA-3 (the page asked nothing about it): the actor's own blend, no run of ours.
    if (kind === 'yields' || kind === 'held' || kind === 'dismissed' || ctx.rm || koFallOff()) return orig.call(a, name, opts);
    const from = a.slots[a.active]!;
    const keep = a.crossfadeMs;
    a.crossfadeMs = 0;
    try {
      orig.call(a, name, opts);
    } finally {
      a.crossfadeMs = keep;
    }
    const to = a.slots[a.active]!;
    // The actor ignored the request (a body on the ground ignores a hit's pose), or both planes draw one painting: nothing to cross.
    if (from === to || a.life?.state === 'down' || from.pose === to.pose) return;
    const travel = from.scale.prone === true && to.scale.prone !== true && canTopple(a.name, partySide);
    const side = travel ? tipSide(headMiddleU(from.meta.head), from.mesh.scale.x < 0 ? -1 : 1, partySide ? 1 : -1) : 0;
    this.begin({ run: reviveRun(travel), mode: travel ? 'topple' : 'cross', from, to, stand: to, lying: from, side });
    if (travel) this.last.rises++;
  }

  /** Start a run: the standing painting stays up (the actor's cut put the KO painting at 1) and the run hands the fades over; the fall's own tilt goes where the topple replaces it, and for a cross with no buckle. */
  private begin(p: Playing): void {
    const pose = p.run.pose;
    p.from.fade = pose.out;
    p.to.fade = pose.inn;
    this.a.syncOpacity();
    this.playing = p;
    if (p.run.opts.travel || !p.run.opts.buckle) this.a.fallGain = 0;
    if (p.run.opts.buckle) this.last.collapses++;
    if (p.run.opts.crossMs > 0) this.last.crosses++;
  }

  /** Finish the run where it stands: the KO painting at full, the standing one upright and gone, whatever phase it was in. */
  private endRun(): void {
    const p = this.playing;
    this.playing = null;
    if (!p) return;
    if (p.cutting) this.a.koCutEnd?.();
    if (p.side !== 0) this.a.tipSlot(p.stand, null);
    if (p.run.opts.kind === 'revive') this.a.fallGain = 1; // the figure is up again
    if (p.to === this.a.slots[this.a.active]) {
      p.to.fade = 1;
      p.from.fade = 0;
      this.a.syncOpacity();
    }
  }

  /** The knock-out's cut (motion pass, step 3): the smear window opens as the cross begins, follows it, and closes with it. The streak runs the way the body falls. */
  private driveCut(play: Playing, phase: string): void {
    const a = this.a;
    if (phase === 'cross') {
      if (!play.cutting) {
        play.cutting = true;
        a.koCutBegin?.({ from: play.from.pose, to: play.to.pose, cutMs: play.run.opts.crossMs, dirX: play.side !== 0 ? play.side : a.facing >= 0 ? 1 : -1 });
      }
      a.koCutStep?.(play.run.crossU);
    } else if (play.cutting) {
      play.cutting = false;
      a.koCutEnd?.();
    }
  }

  /** Where the lying body's middle is (x, the actor's frame): where the dust goes up. */
  private lyingCentre(p: Playing): number {
    const k = p.lying;
    return contentCentreX(k.scale, k.mesh.scale.x < 0 ? -1 : 1, k.mesh.position, k.mesh.rotation.z);
  }

  /** What the toppled body slides to: the lying painting's head when both paintings have a registered head (the point the eye follows), else its middle. */
  private meeting(p: Playing): { target: number; by: 'head' | 'middle' } {
    const k = p.lying;
    const head = p.stand.meta.head ? headCentreX(k.meta.head, k.scale, k.mesh.scale.x < 0 ? -1 : 1, k.mesh.position, k.mesh.rotation.z) : undefined;
    return head !== undefined ? { target: head, by: 'head' } : { target: this.lyingCentre(p), by: 'middle' };
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
    const demo = demoMotionOn(); // `?motion=demo` (part 3): the whole-figure squash stays beside the chest swell, and FFX-2 breathes on the same 3 to 4 s as FFX
    a.breatheAmp = ctx.breath && !demo ? 0 : this.saved.breatheAmp;
    const period = (this.colossus ? 5 : 1 / Math.max(0.05, a.breatheSpeed || 0.55)) * (ctx.game === 'ffx2' && !demo ? 0.8 : 1);
    const posture = a.life?.posture;
    const upright = 1 - a.lieRoll;
    if (ctx.breath) this.phase += (ctx.dt / period) * (posture?.tempo ?? 1);
    const amp = (this.colossus ? 0.024 : 0.02) * (posture?.breathe ?? 1) * upright;
    const breath = ctx.breath ? (Math.sin(this.phase * 6.2831853) * 0.5 + 0.5) * amp : 0;
    let buckle = 0;
    let lean = 0;
    const realMs = (ctx.realDt ?? ctx.dt) * 1000;
    this.puff?.update(realMs);
    const play = this.playing;
    if (play) {
      play.run.step(ctx.dt * 1000, realMs);
      const pose = play.run.pose;
      buckle = pose.buckle;
      lean = pose.lean;
      play.from.fade = pose.out;
      play.to.fade = pose.inn;
      a.syncOpacity();
      if (play.run.opts.cut) this.driveCut(play, pose.phase);
      if (play.side !== 0) a.tipSlot(play.stand, { side: play.side, full: TOPPLE_RAD, e: pose.tip, slide: pose.slide, ...this.meeting(play) });
      const size = play.run.takePuff();
      if (size !== null) {
        this.puff ??= new KoPuff(a as unknown as Object3D, a.height);
        this.puff.start(size, this.lyingCentre(play), play.lying.scale.width * 0.8);
      }
      if (play.run.done) this.endRun();
    }
    const dir = play && play.side !== 0 ? play.side : a.facing >= 0 ? 1 : -1; // the buckle leans the way a toppling body falls, else forward
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
      const fwd = dir * (sx < 0 ? -1 : 1);
      st.u.mlA.value.set(breath, Math.min(1, buckle), fwd, lean);
      st.u.mlOn.value = live && s.scale.prone !== true ? 1 : 0; // a prone plane (a KO painting) is never bent
    }
    this.last.breath = +breath.toFixed(4);
    this.last.buckle = +buckle.toFixed(3);
  }

  /** Put the figure back as `PaintedActor` made it (the battle ended; the setPose wrapper stays, inert). */
  detach(): void {
    this.endRun();
    this.a.fallGain = 1;
    this.puff?.dispose();
    this.puff = null;
    this.ctx = null;
    this.a.breatheAmp = this.saved.breatheAmp;
    for (const [s, st] of this.states) this.detachSlot(s, st);
    this.states.clear();
  }
}
