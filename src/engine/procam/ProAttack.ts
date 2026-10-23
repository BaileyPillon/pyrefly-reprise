/**
 * THE MOVE ON A PLAIN ATTACK (PRO CAMERA, `?camera=pro`; Bailey 2026-10-22, "Camera on every action"). Pure: no `three`, no DOM.
 *
 * The real FFX camera does nothing for an attack, a hit or a turn start (recorded on a whole Tidus attack: the default view holds). Bailey's pick adds Expedition 33-style moves on plain attacks,
 * lighter in FFX-2 (whose real camera is an auto camera that follows the group and never cuts per action). So this is OURS, not the game's:
 *
 * - a short eased push toward the exchange (the point between the attacker and the target), so the picture leans into the blow;
 * - a follow on the lunge: the aim and the eye slide a share of the way with the attacker as he runs in, so the run reads as a camera move and not as a figure crossing a locked frame;
 * - a settle on contact: a small extra push that rises in ~90 ms and falls back over ~360 ms (the camera "takes" the hit; the engine's hit-stop, rumble and punch are unchanged);
 * - a slow creep while the exchange holds, then an eased glide home when the action closes (the layer's `outMs`).
 *
 * The run is a function of time and of the live attacker, so it needs no knowledge of the strike's length (real clips run 1.5 to 2.9 s, the house curves about 1 s). It never crops the attacker or
 * the target: the run asks for the never-crop dolly over both (`ProFit.ts`). Reduce Motion plays no run at all (the director's rule).
 */
import { add3, clamp, clamp01, ease, lerp3, mul3, sub3 } from './ProMath.ts';
import type { Pose, ProRun, V3 } from './ProTypes.ts';

export interface AttackParams {
  /** Fraction of the way the eye moves toward the exchange point. */
  readonly push: number;
  /** Fraction of the way the aim moves toward the exchange point. */
  readonly aim: number;
  /** Share of the attacker's travel (sideways, and 0.4 of the depth) the aim and the eye follow. */
  readonly followLook: number;
  readonly followEye: number;
  readonly inMs: number;
  readonly outMs: number;
  /** A slow extra push while the exchange holds: its size and the time it takes. */
  readonly creep: number;
  readonly creepMs: number;
  /** The contact settle: its size, how fast it rises and how long it falls. */
  readonly pulse: number;
  readonly pulseUpMs: number;
  readonly pulseDownMs: number;
  readonly safe: { readonly x: number; readonly y: number };
}

/** Chapter I (FFX): a visible lean. OURS (no source: the real game's attack camera is a hold). */
export const ATTACK_FFX: AttackParams = { push: 0.16, aim: 0.5, followLook: 0.4, followEye: 0.22, inMs: 380, outMs: 720, creep: 0.02, creepMs: 2200, pulse: 0.035, pulseUpMs: 90, pulseDownMs: 380, safe: { x: 0.88, y: 0.92 } };
/** Chapter IV (FFX-2): lighter, slower, no creep. OURS; the group follower and the run-in's truck already move the frame. */
export const ATTACK_FFX2: AttackParams = { push: 0.055, aim: 0.3, followLook: 0.12, followEye: 0.08, inMs: 560, outMs: 850, creep: 0, creepMs: 1, pulse: 0.014, pulseUpMs: 110, pulseDownMs: 480, safe: { x: 0.86, y: 0.92 } };

/** What the move reads of a figure each frame (an `ActorHandle`'s position, narrowed). */
export interface Mover {
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  centerPoint(): { readonly x: number; readonly y: number; readonly z: number };
}

const v3 = (p: { x: number; y: number; z: number }): V3 => [p.x, p.y, p.z];

export interface AttackRun extends ProRun {
  /** The contact settle begins now (the director calls it on the blow's `impact`). */
  onEvent(name: 'impact'): void;
}

export function attackRun(id: string, attacker: Mover, target: Mover | undefined, fitIds: readonly string[], p: AttackParams): AttackRun {
  const home = v3(attacker.position);
  const a = v3(attacker.centerPoint());
  const t = target ? v3(target.centerPoint()) : add3(a, [1.5, 0, -1.5]);
  const xchg = lerp3(a, t, 0.55);
  const E: V3 = [xchg[0], clamp(xchg[1], 0.9, 1.6), xchg[2]];
  let lastT = 0;
  let impactAt = -1;
  return {
    id,
    inMs: p.inMs,
    inEase: 'cubic',
    outMs: p.outMs,
    outEase: 'cubic',
    fit: { ids: fitIds, safe: p.safe },
    sway: 0.4,
    onEvent(name) {
      if (name === 'impact') impactAt = lastT;
    },
    sample(tMs: number, base: Pose): Pose {
      lastT = tMs;
      const creep = p.creep * ease('cosine', clamp01((tMs - p.inMs) / Math.max(1, p.creepMs)));
      let pulse = 0;
      if (impactAt >= 0) {
        const dt = tMs - impactAt;
        pulse = p.pulse * (dt < p.pulseUpMs ? ease('outCubic', dt / p.pulseUpMs) : 1 - ease('inOutSine', (dt - p.pulseUpMs) / p.pulseDownMs));
      }
      const k = p.push + creep + pulse;
      const moved = sub3(v3(attacker.position), home);
      const follow: V3 = [moved[0], 0, moved[2] * 0.4];
      const pos = add3(add3(base.pos, mul3(sub3(E, base.pos), k)), mul3(follow, p.followEye));
      const look = add3(lerp3(base.look, E, p.aim), mul3(follow, p.followLook));
      return { pos, look, fov: base.fov, roll: base.roll };
    },
  };
}
