/**
 * THE BIG-HIT CAMERA PUNCH, AS NUMBERS (`?punch=new`; `FeelSwitch.ts` has the switch; both games). Bailey, 2026-10-22: "Test both, you pick": a playable A/B between today's
 * big-hit camera and "a subtle 2-3 percent zoom-and-settle punch on big hits and Overdrives".
 *
 * **What today does** (release 61, `docs/handoff/` MAP section 5): on a crit, an overkill or a capped blow `BattleMoments.impact` dollies the camera in 0.11 of the distance to its
 * subject over 460 ms (on the FIELD clock, so it stalls inside a hit-stop), and BATTLE SPECTACLE adds a 0.035 / 0.05 kick (x 9 world units, on the animation clock) and a trauma
 * shake. The kick is a 90 ms rise and a 380 ms smoothstep fall, with no settle.
 *
 * **What `new` does.** One punch, not two: the spectacle's kick (`fx/c/Trauma.kick`) carries it, because it runs on the real frame time (the punch is visible THROUGH the
 * hit-stop, which freezes the field but not the camera), it is zero under REDUCE MOTION, and it composes on top of whatever the shot is. Its size is a fraction of the DEPTH of the
 * struck figure in front of the camera ({@link punchDepth}), so a dolly of `f` of the depth magnifies that figure by 1 / (1 - f): 2.5 percent really is 2.5
 * percent on screen, whatever the chapter's eye distance. The shape is a quick rise (70 ms, eased out) and a fall that undershoots a little before it rests (300 ms, a back-out
 * of constant {@link SETTLE_BACK}): the "settle". The 0.11 moment punch is dropped while the spectacle is on (it would stack on top); with the spectacle off the moment punch stays
 * but at the same small size, so the A/B is the same size either way.
 *
 * Every number is `[ours]`: the sources do not describe the retail camera's hit response. Pure: no `three`, no DOM.
 */

/** The shape of one dolly kick: seconds to rise, seconds to fall, and the back-out constant of the fall (0 = today's smoothstep fall, no settle). */
export interface KickShape {
  inS: number;
  outS: number;
  settle: number;
}

/** Today's kick (`Trauma.ts` before this lane): 90 ms in, 380 ms out, smoothstep, no undershoot. */
export const TODAY_KICK: KickShape = { inS: 0.09, outS: 0.38, settle: 0 };

/** The back-out constant of `new`'s fall. Peak undershoot is (4 / 27) * s^3 / (s + 1)^2 of the punch: 12 percent at 1.9, so a 2.5 percent punch settles 0.3 percent past rest. */
export const SETTLE_BACK = 1.9;

/** The `new` punch: 70 ms in, 300 ms out. */
export const SETTLE_KICK: KickShape = { inS: 0.07, outS: 0.3, settle: SETTLE_BACK };

/** The fraction of the figure's depth a `new` punch dollies in, by the blow (2 to 3 percent, Bailey's pick). */
export const PUNCH_FRACTION = { heavy: 0.025, crit: 0.025, finisher: 0.03, boss: 0.03 } as const;

/** A `new` punch of a given total length: the same rise and fall in the 7 : 30 proportion (the debug trigger's `ms`). */
export function settleKickOf(totalMs: number): KickShape {
  const total = Math.max(40, totalMs) / 1000;
  return { inS: total * (SETTLE_KICK.inS / (SETTLE_KICK.inS + SETTLE_KICK.outS)), outS: total * (SETTLE_KICK.outS / (SETTLE_KICK.inS + SETTLE_KICK.outS)), settle: SETTLE_BACK };
}

/** Total seconds a kick of this shape lasts. */
export const kickSeconds = (s: KickShape): number => s.inS + s.outS;

function backOut(u: number, s: number): number {
  const x = u <= 0 ? 0 : u >= 1 ? 1 : u;
  const w = x - 1;
  return 1 + (s + 1) * w * w * w + s * w * w;
}

/**
 * The kick's envelope at `age` seconds: 0 to 1 on the way in, then back to 0. With `settle` 0 it is exactly the smoothstep fall `Trauma` always had; with a back-out it dips
 * a little below 0 before it rests (the settle) and is exactly 0 from {@link kickSeconds} on.
 */
export function kickEnvelope(age: number, shape: KickShape): number {
  if (age <= 0) return 0;
  if (age < shape.inS) {
    const u = age / shape.inS;
    return shape.settle > 0 ? 1 - (1 - u) ** 3 : u; // today's rise is straight; `new` eases out
  }
  const b = (age - shape.inS) / shape.outS;
  if (b >= 1) return 0;
  if (shape.settle > 0) return 1 - backOut(b, shape.settle);
  return 1 - b * b * (3 - 2 * b);
}

/** What the camera punch reads of one blow (the same facts `SpectacleRules.planHit` has). */
export interface PunchFacts {
  crit: boolean;
  /** Crit, overkill or capped. */
  heavy: boolean;
  /** The action is an Overdrive or a Special. */
  big: boolean;
  /** The last blow the action shows. */
  last: boolean;
  /** A foe's headline move (`HitStopShort.isBossBigMove`). */
  bossBig: boolean;
  first: boolean;
}

/**
 * The `new` punch for one blow, as a fraction of the struck figure's depth: 0.03 on the last blow of an Overdrive or Special and on a boss's headline move, 0.025 on a critical or
 * a heavy blow, nothing on anything else. A Mega Flare that lands on three girls punches three times, as today's kick does (the largest of the overlapping ones wins).
 */
export function newPunchFraction(f: PunchFacts): number {
  if (f.big && f.last) return PUNCH_FRACTION.finisher;
  if (f.bossBig && f.first) return PUNCH_FRACTION.boss;
  if (f.crit) return PUNCH_FRACTION.crit;
  if (f.heavy) return PUNCH_FRACTION.heavy;
  return 0;
}

/**
 * The moment punch `BattleMoments.impact` makes on a heavy blow, in fractions of the subject distance. Today 0.11; `off` none; `new` none while the spectacle's kick is on (it
 * carries the punch), else the same small 0.025 so the A/B is the same size with the spectacle off.
 */
export function momentPunch(mode: 'today' | 'new' | 'off', spectacleOn: boolean): number {
  if (mode === 'off') return 0;
  if (mode === 'new') return spectacleOn ? 0 : PUNCH_FRACTION.heavy;
  return 0.11;
}

/** The least depth a punch is measured against, world units (a figure in the camera's lap must not turn a 2.5 percent punch into a lurch). */
export const PUNCH_DEPTH_MIN = 2;

/**
 * How far in front of the camera a point is, along its view axis, in world units: the distance a dolly of fraction 1 would cover, so a dolly of `f` of it magnifies a figure
 * standing there by 1 / (1 - f). Reads the camera's world matrix (`matrixWorld`, kept current by the spectacle's `applyCamera`); a point behind the camera gives the minimum.
 */
export function punchDepth(cam: { matrixWorld: { elements: ArrayLike<number> } }, p: { x: number; y: number; z: number }): number {
  const e = cam.matrixWorld.elements;
  const depth = (p.x - e[12]!) * -e[8]! + (p.y - e[13]!) * -e[9]! + (p.z - e[14]!) * -e[10]!;
  return depth > PUNCH_DEPTH_MIN ? depth : PUNCH_DEPTH_MIN;
}

/** World units of dolly per unit of kick fraction, today (`SpectacleFx.applyCamera` always multiplied by 9). */
export const KICK_WORLD_TODAY = 9;

/**
 * The arguments `Trauma.kick` takes for one planned blow: today's kick (9 world units per unit of fraction, the smoothstep fall), or the `new` punch (the struck figure's depth per
 * unit of fraction, the settle). `at` is the struck figure's centre; `cam` is the real camera.
 */
export function kickArgs(
  plan: { kick: number; kickMode: 'today' | 'settle' },
  cam: { matrixWorld: { elements: ArrayLike<number> } },
  at: { x: number; y: number; z: number },
): [number, KickShape, number] {
  return plan.kickMode === 'settle' ? [plan.kick, SETTLE_KICK, punchDepth(cam, at)] : [plan.kick, TODAY_KICK, KICK_WORLD_TODAY];
}
