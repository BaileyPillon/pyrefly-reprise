/**
 * SCRATCH, branch `ch3-options-scratch` only, never main (Bailey 2026-10-04, answer (e): "show him another way" for Chapter III).
 * The three levers of the Chapter III options round, each switched by the URL so one build plays every candidate. FFX Chapter III only
 * (Braska's Final Aeon, desktop); nothing here runs without its query parameter.
 *
 *   ?c3drift=<scale>,<bias>   a calmer camera drift while a command menu is open: the drift's amplitude x scale, plus a steady lean of
 *                             `bias` world units to the camera's right (+) or left (-), both eased in over about a second
 *   ?c3lens=<k>               a wider lens for the menu shots: the resting (idle) rig stood back k times (1.12 = 12 % farther), the
 *                             action rigs untouched
 *   ?c3pose=<pose>            Yuna waits with another of her existing paintings than the raised-staff `ready` (idle = staff low at her side)
 */
export interface C3Opt {
  drift: [number, number] | null;
  lens: number;
  pose: string | null;
}

export function parseC3(search: string): C3Opt {
  const out: C3Opt = { drift: null, lens: 1, pose: null };
  try {
    const q = new URLSearchParams(search);
    const d = (q.get('c3drift') ?? '').split(',').map(Number);
    if (d.length >= 1 && d.every(Number.isFinite) && q.get('c3drift')) out.drift = [d[0]!, d[1] ?? 0];
    const l = Number(q.get('c3lens'));
    if (Number.isFinite(l) && l > 0) out.lens = l;
    out.pose = q.get('c3pose');
  } catch {
    /* no query */
  }
  return out;
}

export const c3: C3Opt = parseC3(typeof location === 'undefined' ? '' : location.search);

/** Set by `Framing` each frame: this fight is Chapter III on a desktop. */
export const c3State = { active: false, calm: 0 };

/** The drift's calm weight 0..1, eased toward 1 while this fight's menu is open (`menu`), back to 0 after. */
export function c3Calm(dt: number, menu: boolean): number {
  const want = c3.drift && c3State.active && menu ? 1 : 0;
  const step = Math.min(1, dt / 1.0);
  c3State.calm += Math.max(-step, Math.min(step, want - c3State.calm));
  return c3State.calm;
}
