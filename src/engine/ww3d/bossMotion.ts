/**
 * **Valefor's whole-body life** (the hidden Wind Waker chapter; FFX-2 only): her file is one static mesh (no skeleton, no clips) and the wings' flap (`./wing.ts`) is the only thing it does by itself, so a still frame
 * showed a front-on cutout with flapping wings. TARGET-C shows her turned three-quarter toward the party, hovering. This is the procedural life on top of the flap, pure maths (no `three`, no DOM) so
 * `tests/unit/ww3d/bossMotion.test.ts` pins it without a browser:
 *
 * - **A three-quarter yaw** (`layout.ts` `BOSS_YAW_DEG`, `BOSS_OFF_DEG`): she is turned `BOSS_OFF_DEG` degrees off the direction to the lens, toward the party (to the left of the frame), so the near wing is big and
 *   the far one small as in the picture; a test derives the number from the target shot.
 * - **A slow sway** ({@link bossSway}): a hover bob, a slight pitch and roll, and a drift in yaw, each on its own period so the motion never repeats on a short loop. The sway grows a little while she acts.
 * - **A lunge** ({@link lungeCurve}, {@link BossMotion}): on an action she draws back a little during the windup and thrusts toward her target at the blow, then eases back. The thrust is a short forward move along
 *   her own facing and a nose-down pitch; the presenter's own lunge of the actor (the plain Attack) is separate and on top.
 *
 * Staging is ours, not game data (AGENTS.md rule 6). Game case: FFX-2 only.
 */

import { BOSS_BOB, rad } from './layout.ts';

/** The pitch and roll amplitudes (degrees), yaw drift (degrees) and the periods (seconds) of the slow sway, and how much more it swings at full activity. */
export const SWAY = {
  pitchDeg: 3.5,
  pitchPeriod: 4.7,
  rollDeg: 5,
  rollPeriod: 3.6,
  rollPhase: 0.8,
  yawDeg: 3,
  yawPeriod: 6.1,
  /** A second, quicker bob on top of the slow hover (`BOSS_BOB`): metres, period. */
  bobExtra: 0.05,
  bobExtraPeriod: 1.4,
  /** The sway's size at full activity, as a multiple of rest. */
  activeGain: 1.45,
} as const;

/** The lunge: how far (metres, at her world size) she thrusts along her facing, the nose-down pitch (degrees) of the thrust, how far she draws back (a share of the thrust) and the times (seconds). */
export const LUNGE = { reach: 0.55, pitchDeg: 9, drawBack: 0.35, thrust: 0.12, settle: 0.55 } as const;

export interface Sway {
  /** Radians about the body's x axis, positive = nose down. */
  pitch: number;
  /** Radians about the body's z axis, positive = the +x wing up. */
  roll: number;
  /** Radians about the vertical, added to the yaw. */
  yaw: number;
  /** Metres added to the hover height. */
  bob: number;
}

const TAU = Math.PI * 2;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (v: number): number => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

/**
 * The sway at `t` seconds with her action at `activity` (0 rest to 1 acting): the hover bob (`BOSS_BOB`: the slow main one, plus a quicker small one), a slight pitch and roll, a drift in yaw. Every number
 * stays inside {@link SWAY}'s amplitudes times the activity gain.
 */
export function bossSway(t: number, activity = 0): Sway {
  const k = 1 + (SWAY.activeGain - 1) * clamp01(activity);
  return {
    pitch: rad(SWAY.pitchDeg) * k * Math.sin((TAU * t) / SWAY.pitchPeriod),
    roll: rad(SWAY.rollDeg) * k * Math.sin((TAU * t) / SWAY.rollPeriod + SWAY.rollPhase),
    yaw: rad(SWAY.yawDeg) * k * Math.sin((TAU * t) / SWAY.yawPeriod),
    bob: BOSS_BOB.amplitude * Math.sin(TAU * BOSS_BOB.hz * t) + SWAY.bobExtra * Math.sin((TAU * t) / SWAY.bobExtraPeriod),
  };
}

/**
 * The lunge curve: 0 at rest, negative while she draws back (down to `-drawBack` at the blow), then +1 at the end of the thrust and back to 0 over the settle. `sinceOpen` is seconds since the action opened, `lead`
 * the seconds from the opening to the blow, `sinceBlow` seconds since the blow (null before it, or when no blow has been reported: the thrust then starts at `lead` itself).
 */
export function lungeCurve(sinceOpen: number, lead: number, sinceBlow: number | null): number {
  const L = Math.max(0.05, lead);
  const blow = sinceBlow ?? (sinceOpen >= L ? sinceOpen - L : null);
  if (blow === null) return -LUNGE.drawBack * smooth(sinceOpen / L);
  if (blow < LUNGE.thrust) return -LUNGE.drawBack + (1 + LUNGE.drawBack) * smooth(blow / LUNGE.thrust);
  return 1 - smooth((blow - LUNGE.thrust) / LUNGE.settle);
}

/** What the model applies to her sway group each frame. */
export interface BossPose extends Sway {
  /** Metres along her own facing (positive toward her target). */
  forward: number;
}

/** The state behind {@link lungeCurve}: when the action opened, when the blow landed. One per Valefor. */
export class BossMotion {
  private clock = 0;
  private openedAt: number | null = null;
  private lead = 0.5;
  private blowAt: number | null = null;
  private activity = 0;

  /** An action opened; the blow lands `lead` seconds on. */
  open(lead: number): void {
    this.openedAt = this.clock;
    this.lead = lead;
    this.blowAt = null;
  }

  /** The blow landed. */
  impact(): void {
    if (this.openedAt !== null) this.blowAt = this.clock;
  }

  /** How much she is acting, 0..1. */
  setActivity(a: number): void {
    this.activity = clamp01(a);
  }

  /** The lunge now, `lungeCurve`'s value (0 with no action open or settled). */
  get lunge(): number {
    if (this.openedAt === null) return 0;
    const since = this.clock - this.openedAt;
    const sinceBlow = this.blowAt === null ? null : this.clock - this.blowAt;
    const v = lungeCurve(since, this.lead, sinceBlow);
    if (sinceBlow !== null && sinceBlow > LUNGE.thrust + LUNGE.settle) {
      this.openedAt = null; // settled: no action to follow
      return 0;
    }
    if (this.blowAt === null && since > this.lead + LUNGE.thrust + LUNGE.settle) {
      this.openedAt = null; // a blow that never came reported
      return 0;
    }
    return v;
  }

  /** Advance by `dt` seconds and read the pose. `scale` is her size against her native size (the sway's metres follow it). */
  update(dt: number, scale = 1): BossPose {
    this.clock += dt;
    const s = bossSway(this.clock, this.activity);
    const l = this.lunge;
    return { pitch: s.pitch + rad(LUNGE.pitchDeg) * Math.max(0, l) - rad(LUNGE.pitchDeg * 0.4) * Math.min(0, l), roll: s.roll, yaw: s.yaw, bob: s.bob * scale, forward: LUNGE.reach * l * scale };
  }
}
