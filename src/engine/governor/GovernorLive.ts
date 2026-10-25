/**
 * The frame-budget governor's levers as the consumers read them (lane "perf-trim", 2026-10-23; both games, shared plumbing; no DOM, no `three`): plain cells, written once a frame by the host
 * (`DemoGovernor.ts`) and read by the extras they scale, the way `crispLive` and `fxShare` are. Every cell is a MULTIPLIER whose rest value is 1, so a consumer that multiplies by it draws exactly what
 * it drew before while the governor is off or at its first level (x * 1 is x, bit for bit), and a setting that already turned a thing down (REDUCE MOTION, LOW EFFECTS) is only ever turned down further.
 */
export interface GovLive {
  /** The governor's level now (0 = everything drawn). */
  level: number;
  /** The directed camera's soft background weight (1 = as the shot asks, 0 = off). */
  soft: number;
  /** The share of the particles to draw: the hit sparks, the ink drops, the spell effects' dust (1 = all). */
  particles: number;
  /** The multiplier on the scene's supersample (1 = as the sharpness rung says; 0.8 from the governor's first level on). */
  heavy: number;
}

export const govLive: GovLive = { level: 0, soft: 1, particles: 1, heavy: 1 };

/** Back to rest (the lanes went off, the battle ended, a test). */
export function resetGovLive(): void {
  govLive.level = 0;
  govLive.soft = 1;
  govLive.particles = 1;
  govLive.heavy = 1;
}
