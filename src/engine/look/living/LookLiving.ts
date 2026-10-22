/**
 * THE LIVING CATHEDRAL, the per-frame half (release 62, decision 173a; FFX-2's Bevelle underground; `LivingConfig.ts` says what it is). It runs inside the bold pass (`LookBold.update`), so the look's own switches are
 * its switches (CLASSIC and `?look=off` never reach it), and it writes the numbers the pass's living chunks read (`LivingShader.ts`): the beam's axis and width on the frame (the painting's two skylight points
 * projected through the live camera, so the beam stays where the painting's does while the camera drifts), the lamps' light, and the live rings (each hit figure's feet on the frame, from the hits `PaintedActor.recoil`
 * noted, `StageImpacts.ts`).
 *
 * The recipe is per room and only the Bevelle underground has one; every other room gets a master of zero and the pass is what it was. Live tuning: `__pyrefly.look.param('living', 0)` takes all of it away
 * (the before / after captures), `living.beam`, `living.lamps` and `living.ripple` scale one part each.
 */
import { Vector3, type Camera, type Mesh, type PlaneGeometry } from 'three';
import { eyeCandy } from '../../fx/EyeCandy.ts';
import { srgbDecode } from '../../figureTrue.ts';
import { LIVING_QUALITY, MAX_MOTES, MAX_RIPPLES, livingRecipe, rippleLife } from './LivingConfig.ts';
import { impactsWanted, takeImpacts } from './StageImpacts.ts';
import type { LookQuality } from '../LookConfig.ts';

interface Ring {
  u: number;
  v: number;
  /** The look clock's second it began. */
  t0: number;
  k: number;
}

interface Cell<T> {
  value: T;
}
/** The uniforms this writes (the bold pass's). */
export interface LivingUniforms {
  uLiv: Cell<{ set(x: number, y: number, z: number, w: number): unknown }>;
  uBeamA: Cell<{ set(x: number, y: number, z: number, w: number): unknown }>;
  uBeamB: Cell<{ set(x: number, y: number, z: number, w: number): unknown }>;
  uBeamC: Cell<{ set(x: number, y: number, z: number, w: number): unknown }>;
  uRip: Cell<Array<{ set(x: number, y: number, z: number, w: number): unknown }>>;
  uRipP: Cell<{ set(x: number, y: number, z: number, w: number): unknown }>;
  uRipG: Cell<number>;
  uLamp: Cell<{ set(x: number, y: number, z: number, w: number): unknown }>;
  uLampC: Cell<{ set(x: number, y: number, z: number): unknown }>;
}

export interface LivingFrame {
  u: LivingUniforms;
  key: string;
  mesh: Mesh | null;
  camera: Camera;
  /** The look's clock (seconds): stops under REDUCE MOTION. */
  time: number;
  quality: LookQuality;
  aspect: number;
  /** Where each painted figure's feet are on the frame this frame (frame uv), by actor. */
  feet: ReadonlyMap<object, readonly [number, number]>;
  tweak: (key: string, fallback: number) => number;
}

const scratch = new Vector3();
const lin3 = (c: readonly number[]): [number, number, number] => [srgbDecode(c[0]!), srgbDecode(c[1]!), srgbDecode(c[2]!)];

export class LookLiving {
  private rings: Ring[] = [];
  /** For the debug API and the captures. */
  readonly stats = { on: false, room: '', motes: 0, ripples: 0, lamps: 0, hits: 0 };

  /** One frame. `true` while the living room runs (a recipe for the room, not LOW EFFECTS, the master not tweaked to zero). */
  update(f: LivingFrame): boolean {
    const recipe = livingRecipe(f.key);
    const master = f.tweak('living', 1);
    if (!recipe || master <= 0 || eyeCandy.tier === 'low') {
      this.off(f.u);
      return false;
    }
    const q = LIVING_QUALITY[f.quality];
    const reduceMotion = eyeCandy.reduceMotion;
    const u = f.u;
    // ---- the beam of the skylight
    const beam = recipe.beam;
    const motes = beam && f.mesh ? Math.min(MAX_MOTES, Math.round(recipe.motes * q.motes * f.tweak('living.beam', 1))) : 0;
    if (beam && f.mesh && motes > 0) {
      const g = f.mesh.geometry as PlaneGeometry;
      const W = g.parameters?.width ?? 0;
      const H = g.parameters?.height ?? 0;
      f.mesh.updateWorldMatrix(true, false);
      const at = (pu: number, pv: number): [number, number] => {
        scratch.set((pu - 0.5) * W, (0.5 - pv) * H, 0).applyMatrix4(f.mesh!.matrixWorld).project(f.camera);
        return [(scratch.x * 0.5 + 0.5) * f.aspect, scratch.y * 0.5 + 0.5]; // aspect-corrected: x in frame heights
      };
      const T = at(beam.top[0], beam.top[1]);
      const B = at(beam.bottom[0], beam.bottom[1]);
      const Ts = at(beam.top[0] + beam.halfTop, beam.top[1]);
      const Bs = at(beam.bottom[0] + beam.halfBottom, beam.bottom[1]);
      const col = lin3(beam.color);
      u.uBeamA.value.set(T[0], T[1], B[0], B[1]);
      u.uBeamB.value.set(Math.hypot(Ts[0] - T[0], Ts[1] - T[1]), Math.hypot(Bs[0] - B[0], Bs[1] - B[1]), beam.gain * master, beam.size / 900);
      u.uBeamC.value.set(col[0], col[1], col[2], beam.glow * f.tweak('living.glow', 1));
    }
    // ---- the lamps (the ones that throw embers; their positions are the pass's own `uEmber`)
    const lamps = recipe.lamps;
    const lampShare = lamps ? q.lamps * f.tweak('living.lamps', 1) * master : 0;
    // REDUCE MOTION holds the flames steady; REDUCE FLASHES makes the flicker a third as deep
    const depth = lamps && !reduceMotion ? lamps.amp * lampShare * (eyeCandy.reduceFlashes ? 0.33 : 1) : 0;
    if (lamps) {
      const c = lin3(lamps.color);
      u.uLamp.value.set(lamps.spill * lampShare, lamps.reach, lamps.glass, 0);
      u.uLampC.value.set(c[0], c[1], c[2]);
    }
    // ---- the rings
    const rp = recipe.ripple;
    const allowed = rp && !reduceMotion ? Math.min(MAX_RIPPLES, q.ripples) * (f.tweak('living.ripple', 1) > 0 ? 1 : 0) : 0;
    const hits = takeImpacts();
    if (rp && allowed > 0) {
      for (const h of hits) {
        const foot = f.feet.get(h.actor);
        if (!foot) continue;
        this.rings.unshift({ u: foot[0], v: foot[1], t0: f.time, k: (h.heavy ? 1 : 0.72) * f.tweak('living.ripple', 1) });
        this.stats.hits++;
      }
      const life = rippleLife(rp);
      this.rings = this.rings.filter((r) => f.time - r.t0 < life).slice(0, allowed);
      u.uRipP.value.set(rp.amp, rp.speed, rp.decay, rp.floor);
      u.uRipG.value = rp.glint;
    } else this.rings = [];
    const R = u.uRip.value;
    for (let i = 0; i < MAX_RIPPLES; i++) {
      const r = this.rings[i];
      if (r) R[i]!.set(r.u, r.v, f.time - r.t0, r.k);
      else R[i]!.set(0, 0, -1, 0);
    }
    impactsWanted(allowed > 0); // the hit cell listens only while rings are wanted
    u.uLiv.value.set(1, motes, this.rings.length, depth);
    this.stats.on = true;
    this.stats.room = f.key;
    this.stats.motes = motes;
    this.stats.ripples = this.rings.length;
    this.stats.lamps = Math.round(depth * 1000) / 1000;
    return true;
  }

  /** Not wanted (the room has no recipe, LOW EFFECTS, the master tweaked off, or the look is off): the master to zero, no ring, the hit cell off. */
  off(u?: LivingUniforms): void {
    this.rings = [];
    impactsWanted(false);
    if (u) {
      u.uLiv.value.set(0, 0, 0, 0);
      for (const r of u.uRip.value) r.set(0, 0, -1, 0);
    }
    this.stats.on = false;
    this.stats.motes = 0;
    this.stats.ripples = 0;
    this.stats.lamps = 0;
  }
}
