/**
 * **Valefor's moves as toon beats** (the hidden Wind Waker chapter; FFX-2 only): which of her four actions (chapter 24's ability ids, `data/ffx2/enemies/valefor-abilities.ts`) gets which stand-in effect, and the timing and
 * shapes of those effects. Pure: ids, numbers and arrays, no `three`, no DOM, so `tests/unit/ww3d/moves.test.ts` pins the table and the maths without a browser. The three objects that draw them are `./moveFx.ts`.
 *
 * - **Every Valefor action** makes her wings flap faster and wider (`./wing.ts`, `RATE_ACTIVE`); the plain Attack has nothing else (the presenter's lunge is the blow).
 * - **Energy Ray** (`x2-valefor-energy-ray`, on every girl): a beam, a flat-coloured cylinder from her mouth to each girl, charging on a small orb, held through the blow, bloomed by its colour above 1.
 * - **Energy Blast** (`x2-valefor-energy-blast`, her overdrive, on every girl): a big glowing orb in front of her chest that swells through the charge and bursts at the blow, with a shock ring.
 * - **Sonic Wings** (`x2-valefor-sonic-wings`, on the girl farthest from her): a wing gust, white curly wind trails from her wings to the girl.
 *
 * They are **stand-ins**: modest, flat-coloured, no texture (Bailey judges the look in motion; the plan is to replace them with painted effects if the chapter goes on). The ids are chapter 24's own, never retyped
 * here: the table reads them from the data module, and the test pins that every one of her abilities is either mapped or the plain attack.
 */

import { VALEFOR_ATTACK_ID, VALEFOR_ENERGY_BLAST_ID, VALEFOR_ENERGY_RAY_ID, VALEFOR_SONIC_WINGS_ID } from '../../data/ffx2/enemies/valefor-abilities.ts';
import type { V3 } from './layout.ts';

export type MoveKind = 'ray' | 'blast' | 'wings';

/** The effect an ability id gets, or null (the plain attack, any other action, an action with no ability). */
export function moveKindOf(abilityId: string | undefined): MoveKind | null {
  switch (abilityId) {
    case VALEFOR_ENERGY_RAY_ID:
      return 'ray';
    case VALEFOR_ENERGY_BLAST_ID:
      return 'blast';
    case VALEFOR_SONIC_WINGS_ID:
      return 'wings';
    default:
      return null;
  }
}

/** The abilities whose effects are the flap alone (every other Valefor action gets the flap too, whatever its id). */
export const FLAP_ONLY_IDS: readonly string[] = [VALEFOR_ATTACK_ID];

/** The seconds each effect lives after the blow (the hold, then the fade). */
export const MOVE_TIMING: Readonly<Record<MoveKind, { readonly hold: number; readonly fade: number }>> = {
  ray: { hold: 0.35, fade: 0.25 },
  blast: { hold: 0.05, fade: 0.45 },
  wings: { hold: 0.25, fade: 0.3 },
};

/** The least a charge may take before the blow, seconds (an action with a `lead` of 0 still shows its windup). */
export const MIN_LEAD = 0.45;

/** Where in its life an effect is: `charge` rises 0 to 1 over the lead, `fire` is 1 from the blow until the hold ends, `fade` falls 1 to 0 over the fade. `age` is seconds since the action opened; `lead` seconds until the blow. */
export interface MovePhase {
  charge: number;
  fire: number;
  fade: number;
  /** True once nothing is left to draw. */
  done: boolean;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function movePhase(kind: MoveKind, age: number, lead: number): MovePhase {
  const L = Math.max(MIN_LEAD, lead);
  const t = MOVE_TIMING[kind];
  const sinceBlow = age - L;
  const charge = clamp01(age / L);
  const fire = sinceBlow >= 0 && sinceBlow <= t.hold ? 1 : 0;
  const fade = sinceBlow <= t.hold ? 1 : clamp01(1 - (sinceBlow - t.hold) / t.fade);
  return { charge, fire, fade, done: sinceBlow > t.hold + t.fade };
}

/** The orb of the blast: radius over its life (metres at Valefor's world size), swelling through the charge and bursting to `burst` times at the blow. */
export const ORB = { radius: 1.3, burst: 2.1 } as const;

export function orbRadius(phase: MovePhase): number {
  const swell = ORB.radius * (0.15 + 0.85 * phase.charge);
  const burst = phase.charge >= 1 ? ORB.burst : 1;
  return swell * burst;
}

/**
 * The points of a curly wind trail from `from` to `to`: a helix about the straight line, `turns` turns, its radius swelling from the start then narrowing to a point at the target, `n` points; `phase` (radians) turns it.
 * The first point is `from` and the last is `to`, so a test can pin the ends.
 */
export function curlPoints(from: V3, to: V3, turns: number, radius: number, n: number, phase = 0): V3[] {
  const d: V3 = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const f: V3 = [d[0] / len, d[1] / len, d[2] / len];
  // two axes perpendicular to the line
  const helper: V3 = Math.abs(f[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const ux = f[1] * helper[2] - f[2] * helper[1];
  const uy = f[2] * helper[0] - f[0] * helper[2];
  const uz = f[0] * helper[1] - f[1] * helper[0];
  const ul = Math.hypot(ux, uy, uz) || 1;
  const u: V3 = [ux / ul, uy / ul, uz / ul];
  const v: V3 = [f[1] * u[2] - f[2] * u[1], f[2] * u[0] - f[0] * u[2], f[0] * u[1] - f[1] * u[0]];
  const out: V3[] = [];
  for (let i = 0; i < n; i++) {
    const s = n > 1 ? i / (n - 1) : 0;
    const r = radius * Math.sin(Math.PI * s) ** 0.8; // 0 at both ends, widest in the middle
    const a = phase + s * turns * Math.PI * 2;
    const cu = Math.cos(a) * r;
    const cv = Math.sin(a) * r;
    out.push([from[0] + d[0] * s + u[0] * cu + v[0] * cv, from[1] + d[1] * s + u[1] * cu + v[1] * cv, from[2] + d[2] * s + u[2] * cu + v[2] * cv]);
  }
  return out;
}
