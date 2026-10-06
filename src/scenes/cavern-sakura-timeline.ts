/**
 * The Chapter IX night-sakura arrival's clock (FFX only): the pure timeline the overlay plays and the wait that starts it
 * (PR-0341, FOC371-01; B8 in release 39.1). No Three.js and no DOM; split out of `cavern-stolen-fayth-arrival.ts` (which
 * re-exports all of it for its callers) to keep that file under the house rule's 400 lines, as `cavern-sakura-mask.ts` was.
 */

/**
 * The arrival's beats, in ms from the opening shot (the scene's `intro` rig).
 *
 * Release 39.1, B8 (Bailey, 2026-10-05, "all of your recommendations"; FFX only: Chapter IX is FFX's): the arrival is over by 3.6 s. It used to
 * begin to fade at 3.6 s and end at 5.8 s, so the blue tree and the night were still on the chamber when the first command menu opened for a
 * player who skips the scene (whose compressed copy of this timeline runs at twice the speed, `HURRIED_ARRIVAL_SPEED`). The coming in is
 * untouched (Yojimbo whole at 1.3 s, as the boss push lands on him); the going out now runs 2.2 to 3.6 s. The timings are ours, the sheet is a
 * still; Bailey's O-4 pick is the moment itself (night, one blue tree, Daigoro first, Yojimbo steps out), which is all still there.
 */
export const SAKURA_ARRIVAL_MS = {
  nightIn: [0, 700],
  treeIn: [250, 1100],
  petalsIn: [400, 1000],
  daigoroIn: [400, 800],
  // In before the opening's boss push lands on him (`BattleMoments.revealBoss`, about 1.3 s in).
  yojimboIn: [650, 1300],
  nightOut: [2200, 3600],
  treeOut: [2300, 3600],
  petalsOut: [2500, 3600],
  end: 3600,
} as const;

/** One frame of the arrival: every value 0..1. */
export interface SakuraArrivalFrame {
  night: number;
  tree: number;
  petals: number;
  /** Daigoro's alpha: he comes first. */
  daigoro: number;
  /** Yojimbo's alpha and his step out from the tree (0 = at the tree, 1 = on his spot). */
  yojimbo: number;
  done: boolean;
}

const ramp = (t: number, [a, b]: readonly [number, number]): number =>
  t <= a ? 0 : t >= b ? 1 : smooth((t - a) / (b - a));
const smooth = (k: number): number => k * k * (3 - 2 * k);

/** The pure timeline, for the scene and its test. */
export function sakuraArrivalAt(ms: number): SakuraArrivalFrame {
  const T = SAKURA_ARRIVAL_MS;
  return {
    night: ramp(ms, T.nightIn) * (1 - ramp(ms, T.nightOut)),
    tree: ramp(ms, T.treeIn) * (1 - ramp(ms, T.treeOut)),
    petals: ramp(ms, T.petalsIn) * (1 - ramp(ms, T.petalsOut)),
    daigoro: ramp(ms, T.daigoroIn),
    yojimbo: ramp(ms, T.yojimboIn),
    done: ms >= T.end,
  };
}

/** What {@link ArrivalWait.step} says about this frame. */
export type ArrivalWaitStep = 'hold' | 'go' | 'rest';

/**
 * A hurried opening runs the arrival's own clock this many times faster (FOC371-01): the timeline plays in half the
 * time (1.8 s since release 39.1; it was 2.9 s), Daigoro is on the field 0.4 s in and Yojimbo stands on his spot 0.65 s in, so both are
 * drawn long before the first command menu, and the night and the tree are gone again by the time the first enemy acts.
 */
export const HURRIED_ARRIVAL_SPEED = 2;

/**
 * Whether, and for how long, one fight's arrival waits for its opening (PR-0341, FOC371-01; the scene's own clock,
 * pure).
 *
 * The figures are staged before the battle-start card is gone, so the arrival must not start then: it starts on the
 * first rendered frame of the opening shot ({@link ArrivalWait.openingSeen}), or `fallbackMs` after the fight is
 * staged when no opening ever shows (the skip speed). A **hurried** opening (the player skipped the scene,
 * PR-0061) shows no shot at all: it collapses to the first command menu inside a tick. Release 37.1 never played the
 * arrival there, which took Bailey's approved night-sakura moment away from every player who skips the scene
 * (FOC371-01; the chamber tile says it plays at the start of the fight). A hurried fight now waits for the battle
 * screen's own "the card is gone" mark (`openingMark.ts`, passed in as {@link ArrivalWait.openingSeen}: the same
 * moment a full opening puts the camera on its shot) and plays the arrival {@link HURRIED_ARRIVAL_SPEED} times
 * faster; `hurriedFallbackMs` bounds the wait for a hurried fight whose mark never comes, so Yojimbo and Daigoro are
 * never held off the field at the first menu (PR-0341). A full opening's timing is untouched.
 */
export class ArrivalWait {
  /** ms since the fight was staged while it waits; negative when nothing is (or is no longer) being waited for. */
  private waitMs = -1;
  private opened = false;
  private hurried = false;

  constructor(
    private readonly fallbackMs: number,
    private readonly hurriedFallbackMs: number = fallbackMs,
  ) {}

  /** A fight's figures are on the field (first staging, or a retry). `hurried`: its opening is collapsed. */
  stage(hurried: boolean): void {
    this.waitMs = 0;
    this.opened = false;
    this.hurried = hurried;
  }

  /** The opening has begun: a rendered frame had the camera on the opening shot, or (hurried) the card is gone. */
  openingSeen(): void {
    this.opened = true;
  }

  /** How many times faster the arrival's own clock runs for this fight: 1 for a full opening. */
  get speed(): number {
    return this.hurried ? HURRIED_ARRIVAL_SPEED : 1;
  }

  /** `hold`: they stay off the field; `go`: the arrival starts now; `rest`: nothing is waited for. */
  step(dtMs: number): ArrivalWaitStep {
    if (this.waitMs < 0) return 'rest';
    this.waitMs += dtMs;
    if (!this.opened && this.waitMs < (this.hurried ? this.hurriedFallbackMs : this.fallbackMs)) return 'hold';
    this.waitMs = -1;
    return 'go';
  }
}
