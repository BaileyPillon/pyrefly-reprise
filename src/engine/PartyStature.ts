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
 *
 * **The camera and the bosses stay as they were** (Bailey, 2026-10-07): CHAPTER FRAMING and BOSS SCALE read the live figures, so a
 * taller party would have moved the planned camera and re-sized the colossi. The stage records the factor on the actor
 * ({@link STATURE_KEY}) and `fx/mix/planFig.ts` hands the planners each hero at the shared height, exactly as they saw him before;
 * everything that shows the figure (the drawing, the HUD's anchors, the held shots) reads the real one.
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
  /** The factor the shared height was multiplied by: the stature of a figure that stands at the party's shared height, else 1. */
  stature: number;
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
  return { height: (i.given ?? i.own ?? i.shared) * stature, ringScale: sceneScale * stature, stature };
}

/**
 * The scene's own world height for the figure `id` drawing the painting `artId`, if it names one: the figure's per-combatant height (`SceneStaging.figureHeights`), else the height of the
 * **form** this painting is (`SceneStaging.formHeights`, keyed by the art id: Chapter II's Lady Yunalesca, first form), else undefined. Undefined is the stage's own rule, exactly as before.
 */
export function sceneOwnHeight(
  slots: { readonly figureHeights?: Readonly<Record<string, number>> | undefined; readonly formHeights?: Readonly<Record<string, number>> | undefined },
  id: string,
  artId: string,
): number | undefined {
  return slots.figureHeights?.[id] ?? slots.formHeights?.[artId];
}

/**
 * The factor a figure drawn at a **form height** (`SceneStaging.formHeights`) is recorded by ({@link STATURE_KEY}): its height over the stage's shared one, so the framing reads it at the shared
 * boss height, exactly as it always did (Bailey, 2026-10-09: "today's spot and camera are unchanged"; Chapter II's Lady Yunalesca, first form). 1 for a figure whose height does not come from
 * `formHeights`: a per-combatant height (`figureHeights`) or a director's (`given`) is the figure's own and is not planned back, and nor is the stage's rule.
 */
export function formPlanScale(
  slots: { readonly figureHeights?: Readonly<Record<string, number>> | undefined; readonly formHeights?: Readonly<Record<string, number>> | undefined },
  id: string,
  artId: string,
  shared: number,
  given?: number,
): number {
  if (given !== undefined || slots.figureHeights?.[id] !== undefined) return 1;
  const own = slots.formHeights?.[artId];
  return own === undefined ? 1 : own / shared;
}

// ------------------------------------------------------------------ what the framing reads

/**
 * Where the stage records the factor it drew a figure by (`Object3D.userData`), so CHAPTER FRAMING and BOSS SCALE can plan the party
 * at its shared height, as they always have, whatever the heroes' own heights (`fx/mix/planFig.ts`: the camera and every boss stay
 * exactly where they were: Bailey, 2026-10-07, "Keep camera and bosses as before"). Set only on a figure whose stature is not 1, so a
 * figure with no key (FFX-2, FF7, an aeon, a fiend, `?stature=off`) is read as 1: nothing else in the game sees it.
 */
export const STATURE_KEY = 'pyreflyStature';
