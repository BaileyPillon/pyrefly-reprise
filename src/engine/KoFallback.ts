/**
 * **A KO'd party member with no KO painting lies down** (VP-1001-04).
 *
 * An FFX-2 dressphere with no `ko` painting resolves its `ko` pose to the idle
 * (`BattlePresenterArt` DRESSPHERE_POSE_FALLBACKS, D-179), and
 * `PaintedActor.fall()` tips the figure and then relaxes the tilt back to 0, so
 * a girl at 0 HP stood upright (and smiling) in her idle painting: the field
 * misstated the battle state (Chapter XIII Trema defeat, Ch VI).
 *
 * The answer is presentation only: the idle is rolled onto the floor with the
 * existing `lieDown` (`LieFlat.ts`, Seymour's body, D-046), tipped back part of
 * the way so the figure stays readable from the battle camera (the FF7 KO uses
 * the same partial tip), and the revive's `rise` stands it back up. FFX's party
 * all have KO paintings, so in practice this is FFX-2's (the plumbing is both
 * games'). No approved painting is touched; no new look: the painting is the
 * shipped idle, laid down.
 */

/** The tip back toward the floor, radians: readable from the low battle camera (FF7's KO uses 0.55). */
export const KO_FALLBACK_TILT = 0.55;

/** How long the roll onto the floor takes, ms (the KO beat's own length is TIMING.ko). */
export const KO_FALLBACK_LIE_MS = 420;

interface LieCapable {
  lieDown?(ms?: number, tilt?: number): Promise<void>;
}

/**
 * True when the actor's `ko` pose is some other painting (the idle or hurt a
 * missing KO fell back to), or when its pose map has no `ko` at all (setPose
 * then falls back to a standing painting). False when it has a real KO
 * painting, or when the pose map cannot be read (`PaintedActor.poseUrls`
 * absent: a sprite, a test double): nothing changes then.
 */
export function lacksKoPainting(actor: object): boolean {
  const urls = (actor as { poseUrls?: Readonly<Record<string, string>> }).poseUrls;
  if (!urls) return false;
  const url = urls['ko'];
  return url === undefined || !/\/ko\.png(?:[?#].*)?$/.test(url);
}

/**
 * After `setPose('ko')`: lay a figure with no KO painting on the floor. `ms` 0
 * lies down at once (staging someone already down). No-op otherwise.
 */
export function downWithoutKoPainting(actor: (object & LieCapable) | undefined | null, ms = KO_FALLBACK_LIE_MS): void {
  if (!actor || !actor.lieDown || !lacksKoPainting(actor)) return;
  void actor.lieDown(ms, KO_FALLBACK_TILT);
}
