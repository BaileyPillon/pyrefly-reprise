import { ffxPartyStature } from '../data/ffx/party-stature.ts';
import type { GameId, Side } from '../battle/common/types.ts';

/**
 * **The FFX party stands at its real relative heights** (r3941-heights; FFX only; table `data/ffx/party-stature.ts`, source
 * `research/ffx-character-heights.md`). The stage's half of it: pure maths, no `three`, no DOM but the address of the page.
 *
 * Before this, the stage gave every party member one shared height (`SceneSlots.partyHeight`, Tidus's) and every approved idle is
 * cropped the same way, so all seven heroes stood equally tall. Now a hero's world height is that shared height times the table's
 * ratio (Tidus is 1, so his size is exactly what it was). Nothing else changes, and everything that follows a figure's size already
 * follows its world height, so each of these moves with the figure and needs no code of its own:
 *
 * - **the feet**: `computePoseScale` puts the pose's anchor row on the actor's ground point at any scale, so a taller or shorter
 *   hero grows or shrinks about the feet and stands on the same ground line (`tests/unit/engine/party-stature.test.ts`);
 * - **every pose alike**: the factor is the actor's, not a pose's, so the per-pose registration (`PoseRegistration.ts`), the KO and
 *   hurt scales, the head lock (`HeadLock.ts`, CHK-026) and the lying body (`PaintedRest.ts`, `ProneLay.ts`) see one pixel scale;
 * - **the numbers and the marks**: `headPoint`, `centerPoint`, `height`, the selection pool and the hop, shake, lean and crouch of
 *   `PaintedActor` are all multiples of its world height; the contact shadow and the turn ring the stage authors at a fixed radius
 *   are scaled here, by the same factor (`FigureHeight.ringScale`), exactly as a scene-named height has always scaled them.
 *
 * The lookup is **FFX only**: FFX-2's Yuna and Rikku share the ids, not the game (AGENTS.md rule 14), and an aeon, a fiend or a
 * part is not on the party's side. A height a scene or an arrival director names for a combatant is that figure's own and is taken
 * as given, with no ratio on top.
 */

// ------------------------------------------------------------------ the kill switch

let off: boolean | null = null;

/**
 * `?stature=off` (captures and A/B comparisons only): every hero keeps the party's shared height, as before r3941. Read once, like
 * `?headlock=off` and `?posereg=off`; with it the same build draws the "before" and the "after" of a picture.
 */
export function statureOff(): boolean {
  if (off === null) off = new URLSearchParams(globalThis.location?.search ?? '').get('stature') === 'off';
  return off;
}

/** Tests: force the switch (`null` reads the address again). */
export function setStatureOff(value: boolean | null): void {
  off = value;
}

// ------------------------------------------------------------------ the factor

/**
 * The factor on a combatant's shared height: the table's ratio for one of the seven heroes **in an FFX battle, on the party's side**,
 * else 1. `game` is the battle's (`BattleState.game`; undefined before a state has been staged, which is 1).
 */
export function partyStature(game: GameId | undefined, side: Side, id: string): number {
  if (game !== 'ffx' || side !== 'party' || statureOff()) return 1;
  return ffxPartyStature(id);
}

// ------------------------------------------------------------------ the size

export interface FigureHeightIn {
  /** The height the stage gives this kind of figure when nothing names one (`worldHeightFor`: the party's shared height for a hero). */
  shared: number;
  /** The scene's own height for this combatant (`SceneStaging.figureHeights`), if it names one. */
  own?: number | undefined;
  /** A height handed to `PaintedStage.add` by an arrival director, if one was. */
  given?: number | undefined;
  /** {@link partyStature}. */
  stature: number;
}

export interface FigureHeight {
  /** The actor's world height: its feet to the top of its idle painting. */
  height: number;
  /**
   * What the contact shadow and the turn ring, which the stage authors at a fixed radius for a figure of the shared height, are
   * multiplied by: a scene-named height over the shared one (the Cavern's Daigoro), times the stature. 1 for everyone else.
   */
  ringScale: number;
}

/**
 * One figure's world height and its shadow and ring scale. Three sources, strongest first: a director's height (`given`), a scene's
 * (`own`), the stage's shared one (`shared`). The first two are the figure's own and carry no stature; only the shared height does.
 * With a stature of 1 and none of the first two this is the shared height exactly, and for every figure that is not a hero in an FFX
 * battle the numbers are the ones the stage computed before this module existed, bit for bit (a product with 1 is exact).
 */
export function figureHeight(i: FigureHeightIn): FigureHeight {
  const stature = i.given !== undefined || i.own !== undefined ? 1 : i.stature;
  const sceneScale = i.own !== undefined && !i.given ? i.own / i.shared : 1;
  return { height: (i.given ?? i.own ?? i.shared) * stature, ringScale: sceneScale * stature };
}
