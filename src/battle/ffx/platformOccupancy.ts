/**
 * **Who holds which glyph platform, read off the battle state alone** (FFX only; the hidden Spectral Keeper chapter; `./platforms.ts` is the engine's side, this is the part the presenter shares).
 *
 * The engine keeps a platform as a flag, `plat.at.<member>` = the platform number, and that flag is **not** the answer to "who stands there": a Switch hands the platform to the member coming in and leaves the
 * outgoing member's flag where it was, and an Ejected member's flag is never cleared (`platforms.ts#handOverPlatform`, RE 3 item 6). The engine's own answer counts only the three active members who are still
 * on the field (a KO'd member keeps its platform, an Ejected one has left): {@link standingIds}. `platforms.ts` (`occupantAt`, `freeCircleIds`, so the Move row and the Keeper's sweep) and the stage's painted glyphs
 * (`engine/PartAnchors.ts#decalStateOf`) both ask this module, so the picture of a platform can never disagree with the rule that decides whether Move may land on it (r75-boss-art, review finding M1, decision 219u).
 *
 * Pure: the state in, a list out. No DOM, no `three`, no context object, so the presenter may import it (it imports `predicates.ts` for `onField` and nothing of the engine's runtime).
 */

import type { BattleState, CombatantId } from '../common/types.ts';
import { AT_PREFIX } from './ai/spectral-keeper-rules.ts';
import { onField } from './predicates.ts';

/** The part of a battle state the glyphs are read from. */
export type PlatformView = Pick<BattleState, 'activeIds' | 'combatants' | 'flags'>;

/** The battle-state flag that holds a member's platform. */
export const platformFlagOf = (id: CombatantId): string => AT_PREFIX + id;

/** The platform a member's flag names (1 to 6, 7 for the rock), or `undefined` when it has none. A flag is a record, not proof the member stands there: see {@link standingIds}. */
export function heldPlatform(flags: Readonly<Record<string, unknown>>, id: CombatantId): number | undefined {
  const value = flags[platformFlagOf(id)];
  return typeof value === 'number' ? value : undefined;
}

/** The members who stand on the glyphs: the active front line, in slot order, less anyone who has left the field (an Ejected member). A KO'd member still stands there. */
export function standingIds(view: PlatformView): CombatantId[] {
  return view.activeIds.filter((id) => {
    const c = view.combatants[id];
    return c !== undefined && onField(c);
  });
}

/** The platform numbers somebody on the field holds right now: the complement of the engine's free platforms (`freeCircleIds`). */
export function occupiedPlatforms(view: PlatformView): ReadonlySet<number> {
  const held = new Set<number>();
  for (const id of standingIds(view)) {
    const platform = heldPlatform(view.flags, id);
    if (platform !== undefined) held.add(platform);
  }
  return held;
}
