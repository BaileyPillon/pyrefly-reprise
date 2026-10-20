/**
 * DEMO MOTION, PART 4: HIT FEEL, AS NUMBERS (`?motion=demo`; `DemoMotion.ts` has the switch and the whole picture; both games). Decision 133c (Bailey, 2026-10-18 ~23:18 EDT, "I'll go with all of
 * your recommendations"): contact as an event, with a hit-stop (weak 0 to 30 ms, strong 50 to 80 ms, finisher 100 to 150 ms), a small camera shake and a 0.08 s flash, multi-hit moves stopping only
 * on the first and last hit.
 *
 * What the build already does and this changes only under the switch: option C's BATTLE SPECTACLE (`fx/c/SpectacleRules.planHit`) holds the presentation 85 ms (FFX) or 55 ms (FFX-2, crits only) on a heavy
 * blow and 40 or 28 ms on a first light hit, adds a fixed trauma by kind, and `BattlePresenterBeats.damage` flashes the struck figure warm for 200 ms (white for 260 ms on a crit). It neither
 * looks at how hard the blow was nor leaves the middle hits of a flurry alone. Here:
 *
 * - **power** ({@link hitPower}): the blow's damage against the target's HP (40 percent of its maximum is 1.0) or against 4,000 (the heavy end of both games' normal hits), whichever is more, so a
 *   boss with a 60,000 HP pool is still hit hard by a 4,000 and a girl with 1,100 HP is hit hard by a 450;
 * - **the stop** ({@link demoStopMs}): a finisher (a crit, an overkill, a capped blow, or the last blow of an Overdrive or Special) 100 to 150 ms by power; a strong blow (power 0.3 and over) 50 to
 *   80; a weak one 0 to 30; a multi-hit action stops on its first and last blow only. REDUCE MOTION and any playback speed but normal stop nothing (the caller's rule, unchanged);
 * - **the shake** ({@link demoTrauma}): trauma (`fx/c/Trauma.ts`: offset = max * trauma squared) from 0.14 up by the square root of power, a crit and an Overdrive's last blow more, the middle of a
 *   flurry half; the CAMERA moves, the HUD (a DOM tree) never does;
 * - **the flash** ({@link DEMO_FLASH_MS}): 0.08 s, white, full strength, on the struck figure for every damaging blow (REDUCE FLASHES: the caller's existing rule, the first blow of an action only,
 *   and the actor softens it).
 *
 * The stop holds the field clock (`HitStop`, `SpectacleFx.stageDt`): the engine, the RNG, the ATB pump and the turn order never see it. Pure: no `three`, no DOM. Every number is `[ours]`.
 */
import { clamp01 } from './DemoMotion.ts';

/** The white flash on the struck figure, ms (0.08 s). */
export const DEMO_FLASH_MS = 80;
/** The most a hit can be: a blow past 150 percent of the scale reads as 1.5. */
export const POWER_MAX = 1.5;
/** Damage that is full power whatever the target's pool: the heavy end of both games' ordinary hits. */
export const POWER_REF_DAMAGE = 4000;
/** A blow of this share of the target's maximum HP is full power (40 percent). */
export const POWER_REF_SHARE = 0.4;

/** A strong blow starts here; a weak one is under it. */
export const STRONG_AT = 0.3;
/** Power over which a strong blow's stop climbs from 50 to 80 ms. */
export const STRONG_SPAN = 0.4;

export const STOP_WEAK_MAX = 30;
export const STOP_STRONG = { min: 50, max: 80 } as const;
export const STOP_FINISHER = { min: 100, max: 150 } as const;

/** 0 up to {@link POWER_MAX}: how hard a blow is. `maxHp` unknown (a test, a part): the absolute scale alone. */
export function hitPower(amount: number, maxHp?: number): number {
  if (!(amount > 0)) return 0;
  const absolute = amount / POWER_REF_DAMAGE;
  const relative = maxHp !== undefined && maxHp > 0 ? amount / maxHp / POWER_REF_SHARE : 0;
  return Math.min(POWER_MAX, Math.max(absolute, relative));
}

/** What the stop and the shake read of one blow. */
export interface BlowFacts {
  crit: boolean;
  /** Crit, overkill or capped (the presenter's `heavy`). */
  heavy: boolean;
  /** The action is an Overdrive or a Special. */
  big: boolean;
  hitIndex: number;
  hitCount: number;
  /** This is the last blow the action shows (FFX: `isLastShownBlow`; absent: the highest index). */
  last: boolean;
  /** {@link hitPower}. Absent reads as a middling blow (0.35). */
  power?: number | undefined;
}

const power = (f: BlowFacts): number => Math.min(POWER_MAX, Math.max(0, f.power ?? 0.35));
/** True for a hit that is neither the first nor the last of a multi-hit action. */
export const isMiddleHit = (f: Pick<BlowFacts, 'hitIndex' | 'hitCount' | 'last'>): boolean => f.hitCount > 1 && f.hitIndex > 0 && !f.last;
/** True when the blow is a finisher: a crit, an overkill or a capped blow, or the last blow of an Overdrive or Special. */
export const isFinisher = (f: Pick<BlowFacts, 'crit' | 'heavy' | 'big' | 'last'>): boolean => f.crit || f.heavy || (f.big && f.last);

/** How long the presentation holds on this blow, ms (0 for a middle hit of a flurry). */
export function demoStopMs(f: BlowFacts): number {
  if (isMiddleHit(f)) return 0;
  const p = power(f);
  if (isFinisher(f)) return STOP_FINISHER.min + Math.round((STOP_FINISHER.max - STOP_FINISHER.min) * clamp01(p));
  if (p >= STRONG_AT) return STOP_STRONG.min + Math.round((STOP_STRONG.max - STOP_STRONG.min) * clamp01((p - STRONG_AT) / STRONG_SPAN));
  return Math.round(STOP_WEAK_MAX * clamp01(p / STRONG_AT));
}

/** Which of the three the blow is, for the notes. */
export function blowClass(f: BlowFacts): 'weak' | 'strong' | 'finisher' {
  return isFinisher(f) ? 'finisher' : power(f) >= STRONG_AT ? 'strong' : 'weak';
}

/** The trauma (0 to 1) the blow adds to the camera: 0.14 plus the square root of power, more for a crit and an Overdrive's last blow, half for the middle of a flurry. */
export function demoTrauma(f: BlowFacts): number {
  const p = power(f);
  let t = 0.14 + 0.48 * Math.sqrt(clamp01(p));
  if (f.crit) t += 0.12;
  if (f.big && f.last) t += 0.2;
  if (isMiddleHit(f)) t *= 0.5;
  return Math.min(1, t);
}

/** The camera shake amplitude the presenter's fallback (`camera.shake(amplitude, ms)`) uses when BATTLE SPECTACLE is off: the same growth, in the old call's units (0.08 for an ordinary first hit, 0.16 for a heavy one; here 0.06 for the weakest blow to 0.2 for the hardest). */
export function demoShakeAmplitude(f: BlowFacts): number {
  return +(0.04 + 0.16 * demoTrauma(f)).toFixed(3);
}
