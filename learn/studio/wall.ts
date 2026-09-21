/**
 * Site B's rule inventory at `explode` 1: the 137-tile wall of the approved
 * frame `docs/concepts/atlas/b-battle-studio/b3-inventory.png`. Pure — no DOM
 * — so the ordering, the grouping and every count are unit tested.
 *
 * The frame's own order is **largest first**, which for rules means by size
 * tier: the 17 mechanisms that carry a formula, then the 89 named rules, then
 * the 31 single values, each block closed by a caption that counts it
 * ("17 mechanisms, each with its formula"). Inside a block the tiles run in
 * component order — turn order, command, hit roll, damage, element, status,
 * Overdrive, the boss's script — so a block still reads as its eight systems,
 * and every tile carries its component's glyph and name.
 *
 * Nothing here is typed: a block's count is the tiles in it, so hiding a
 * component in the panel takes its tiles out and every caption follows
 * (`learn/shared/model.ts` makes the same promise about `System.count`).
 */

import { STUDIO_COMPONENTS } from './rules.ts';
import type { StudioComponentId, StudioRule, StudioRuleSize } from './rules.ts';
import { tilePieceId } from './specimen.ts';

/** One tile of the wall. */
export interface WallTile {
  readonly pieceId: string;
  readonly ruleId: string;
  readonly component: StudioComponentId;
  /** The component's 1-based number, the "06" of the frame's "06 · STATUS". */
  readonly badge: string;
  readonly size: StudioRuleSize;
  readonly name: string;
  /** The rule's own plain-words line. The frame prints it on the large tiles and saves it for the hover tip on the rest. */
  readonly line: string;
}

/** One size tier of the wall, with the caption that closes it. */
export interface WallBlock {
  readonly size: StudioRuleSize;
  readonly tiles: readonly WallTile[];
  /** e.g. "17 mechanisms, each with its formula" — the count is `tiles.length`, never typed. */
  readonly caption: string;
}

/** The frames' caption for each tier, with the count filled in from the tiles themselves. */
const CAPTION: Readonly<Record<StudioRuleSize, (n: number) => string>> = {
  L: (n) => `${n} mechanisms, each with its formula`,
  M: (n) => `${n} named rules: statuses, steps, modes, moves`,
  S: (n) => `${n} single values`,
};

/** Largest first, exactly as the frame's caption strip says. */
const TIER_ORDER: readonly StudioRuleSize[] = ['L', 'M', 'S'];

function componentIndex(component: StudioComponentId): number {
  const index = STUDIO_COMPONENTS.findIndex((c) => c.id === component);
  return index < 0 ? STUDIO_COMPONENTS.length : index;
}

/** The component's two-digit badge, "01" to "08". */
export function componentBadge(component: StudioComponentId): string {
  return String(componentIndex(component) + 1).padStart(2, '0');
}

/**
 * Lays out the wall for the rules whose tiles are currently visible.
 *
 * `isVisible` is asked per tile rather than per component so isolation (one
 * single piece) and a hidden system both fall out of the same call, and an
 * empty tier is dropped rather than left as a caption over nothing.
 */
export function buildWall(rules: readonly StudioRule[], isVisible: (pieceId: string) => boolean): readonly WallBlock[] {
  const blocks: WallBlock[] = [];

  for (const size of TIER_ORDER) {
    const tiles: WallTile[] = rules
      .filter((rule) => rule.size === size)
      .map((rule) => ({
        pieceId: tilePieceId(rule.id),
        ruleId: rule.id,
        component: rule.component,
        badge: componentBadge(rule.component),
        size: rule.size,
        name: rule.name,
        line: rule.line,
      }))
      .filter((tile) => isVisible(tile.pieceId))
      .sort((a, b) => componentIndex(a.component) - componentIndex(b.component));

    if (tiles.length === 0) continue;
    blocks.push({ size, tiles, caption: CAPTION[size](tiles.length) });
  }

  return blocks;
}
