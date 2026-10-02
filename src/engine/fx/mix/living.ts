import { PlaneGeometry, Vector2, Vector4, type BufferGeometry, type Mesh, type ShaderMaterial, type Texture } from 'three';
import { departureKindOf } from '../../BattlePresenterDepartures.ts';
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
 *   (220 ms FFX, 170 ms FFX-2, inside today's KO beat), then a cut to the KO painting (EC-1001-09).
 *   Under REDUCE MOTION the KO is a plain cut to the KO painting. The Syndicate's yield, a held or a
 *   dismissed departure are left as they are (VP-1001-47).
 *
 * Attached by a scene walk, never by a hook in `PaintedActor` (over 400 lines, rule 7): the figure's
 * own vertex shader (the painted one, or LIVING PAINTINGS' sway) is patched by `onBeforeCompile`, its
 * plane swapped for a grid, and `setPose` wrapped on the instance (chained, and inert when the part is
 * off). It reads the actor's own state and never changes a timing the presenter waits on, the engine or
 * the RNG (rule 1). Game case: both, with the per-game tempo above.
 */

type Slot = { mesh: Mesh; material: ShaderMaterial; fade: number; pose: string; scale: { prone?: boolean } };
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
  game: 'ffx' | 'ffx2';
  breath: boolean;
  collapse: boolean;
  rm: boolean;
  grid: [number, number];
}

const COLOSSUS = /^(braskas-final-aeon|seymour-natus|yojimbo|anima|x2-anima|seymour-omnis|ixion|x2-ixion|bahamut|ffx2-bahamut|evrae)/;
/** Machines built of separately painted parts, and statues: a chest breath would part their seams. */
const STILL = /^(vegnagun|sin-|overdrive-sin|yu-pagoda)/;

export class LivingFigure {
  readonly a: Guts;
  private readonly states = new Map<Slot, SlotState>();
  private readonly saved: { breatheAmp: number };
  private readonly colossus: boolean;
  private readonly still: boolean;
  private phase = Math.random();
  private collapse = -1;
  private hold: { from: Slot; to: Slot } | null = null;
  private ctx: LifeCtx | null = null;
  readonly last = { breath: 0, buckle: 0, collapses: 0, cuts: 0 };

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
    if (name !== 'ko' && name !== 'dead') this.endCollapse();
    if (!ctx || !ctx.collapse || opts?.immediate || (name !== 'ko' && name !== 'dead') || a.life?.state === 'down') return orig.call(a, name, opts);
    const kind = a.facing < 0 ? departureKindOf(a.name) : 'party';
    if (kind === 'yields' || kind === 'held' || kind === 'dismissed') return orig.call(a, name, opts);
    const from = a.slots[a.active]!;
    const keep = a.crossfadeMs;
    a.crossfadeMs = 0; // a cut, never a crossfade, to the KO painting
    try {
      orig.call(a, name, opts);
    } finally {
      a.crossfadeMs = keep;
    }
    const to = a.slots[a.active]!;
    if (ctx.rm || from === to || from.scale.prone) {
      this.last.cuts++;
      return;
    }
    // Buckle and sink on the standing painting, then cut to the KO painting (EC-1001-09).
    from.fade = 1;
    to.fade = 0;
    a.syncOpacity();
    this.hold = { from, to };
    this.collapse = 0;
    this.last.collapses++;
  }

  private endCollapse(): void {
    const h = this.hold;
    this.collapse = -1;
    this.hold = null;
    if (h && h.to === this.a.slots[this.a.active]) {
      h.to.fade = 1;
      h.from.fade = 0;
      this.a.syncOpacity();
    }
  }

  update(ctx0: LifeCtx): void {
    const ctx = this.still ? { ...ctx0, breath: false } : ctx0;
    this.ctx = ctx;
    const a = this.a;
    const live = ctx.breath || this.collapse >= 0;
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
    if (this.collapse >= 0 && this.hold) {
      this.collapse += ctx.dt * 1000;
      const len = ctx.game === 'ffx2' ? 170 : 220;
      const t = Math.min(1, this.collapse / len);
      buckle = t * t;
      lean = 0.05 * t;
      if (this.collapse >= len) this.endCollapse();
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
    this.endCollapse();
    this.ctx = null;
    this.a.breatheAmp = this.saved.breatheAmp;
    for (const [s, st] of this.states) this.detachSlot(s, st);
    this.states.clear();
  }
}
