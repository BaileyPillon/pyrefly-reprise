/**
 * Where the Sensor read-out goes when it would open across the fiend it is
 * describing.
 *
 * `.ffx-sensor` is pinned at grid 436,166 — squarely in the lane the enemies
 * stand in. Aim at a Yu Pagoda in Chapter 3 and the card opens over its base,
 * over the gold bracket and over the "Yu Pagoda C" plate: the panel that
 * answers *"what am I looking at?"* printed on top of the thing being looked
 * at. No formation can avoid it, because the card is transient and follows
 * whatever the player aims at, so the card is steered instead.
 *
 * Pure grid geometry, kept out of `FFXBattleHud` so the rule can be tested
 * without a browser. Everything is in the 640x360 stage's own pixels.
 *
 * GAME-AWARE (AGENTS.md rule 14): **FFX only.** The Sensor plate, the ability
 * and its `I` fold key are FFX's own [research/visual-bible.md §3.5]. FFX-2
 * shows an enemy's read-out on the boss gauge strip along the top, which never
 * enters the lane and has nothing to move.
 */

/** A box in grid space. */
export interface GridBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** How close to the stage's own edge the steered card may come, in grid px. */
export const SENSOR_STAGE_MARGIN = 8;

/** Clear air left between the card and the silhouette it stepped away from. */
const GAP = 6;

/**
 * The horizontal offset to add to the card's resting `left`, in grid px.
 *
 * `null` means "leave it alone": either the card does not cover the figure, or
 * neither side of the figure has room for it inside the stage. `0` is never
 * returned as a steer — a card that is already clear gets `null`, so the
 * stylesheet's own resting place is what a player who never opens a target
 * cursor sees.
 *
 * `flag` (r74-omnis; Chapter XII on the F1 HUD only, every other caller leaves it `null` and gets the answer it always got): the pro target flag's box. When the card, where the figure's steer leaves it,
 * lies on the flag, the card is steered against the figure and the flag together (the one box that holds both); if neither side of that box has room, the figure's answer stands.
 */
export function sensorSteerDx(
  card: GridBox,
  figure: GridBox,
  stageWidth: number,
  margin = SENSOR_STAGE_MARGIN,
  flag: GridBox | null = null,
): number | null {
  const base = steerClear(card, figure, stageWidth, margin);
  if (!flag) return base;
  const dx = base ?? 0;
  if (!overlaps({ left: card.left + dx, right: card.right + dx, top: card.top, bottom: card.bottom }, flag)) return base;
  const both = { left: Math.min(figure.left, flag.left), right: Math.max(figure.right, flag.right), top: Math.min(figure.top, flag.top), bottom: Math.max(figure.bottom, flag.bottom) };
  return steerClear(card, both, stageWidth, margin) ?? base;
}

const overlaps = (a: GridBox, b: GridBox): boolean => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** The steer against one obstacle: the nearer side with room, or `null` (the card is clear of it, or no side has room). */
function steerClear(card: GridBox, figure: GridBox, stageWidth: number, margin: number): number | null {
  const width = card.right - card.left;
  if (width <= 0) return null;
  if (!overlaps(card, figure)) return null;

  const toLeft = figure.left - GAP - width - card.left;
  const toRight = figure.right + GAP - card.left;
  const fitsLeft = card.left + toLeft >= margin;
  const fitsRight = card.left + toRight + width <= stageWidth - margin;

  if (fitsLeft && (!fitsRight || Math.abs(toLeft) <= Math.abs(toRight))) return toLeft;
  if (fitsRight) return toRight;
  return null;
}
