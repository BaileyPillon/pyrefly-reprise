/**
 * Chapter XIII (Trema): **which shape the chapter data has**, read from the chapter record
 * itself, so the story, the scene's kill link, the pause card and the guide all follow
 * whichever option Bailey picks without a second switch to keep in step.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Trema, Paragon and Cloister 100 exist only in
 * FFX-2 (`research/ffx2-trema.md` §0).
 *
 * ## The flag, and how it is read
 *
 * The chapter's options (`docs/plans/trema-options-2026-09-25.md`) are built on another branch
 * as OFF switches, in files this module never touches (`chapter-ffx2-trema.ts`,
 * `ffx2/enemies/**`, the kit). What they change that the ship layer cares about is the **first
 * formation** of `Chapter.enemyGroupRef`:
 *
 * - **TR1 a / option 1** (Paragon, normal or Oversoul, then Trema): the first formation fields
 *   a Paragon and chains (`nextGroupId`) to Trema's link. {@link TremaShape.paragonLink} is true.
 * - **TR1 b / option 2** (Trema alone): the first formation is Trema himself and nothing
 *   chains. `paragonLink` is false, and every Paragon beat (the link scene, the Big Bang
 *   callout, the kill link on the field, the "Reach Trema" objective) is left out.
 *
 * {@link TremaShape.paragonBigBang} is whether that Paragon carries the Big Bang counter (the
 * normal form, TR7; research §4.1). Oversoul Paragon has none (research §12.2), so the guide's
 * "never Darkness on Paragon" line and the Big Bang callout stay behind this flag.
 *
 * A formation is recognised by its enemies' ids and AI script ids, never by a formation id:
 * the options may add formations under names this branch cannot know.
 */

import type { EnemyDef, EnemyGroupDef } from '../battle/common/types.ts';

/** What the ship layer needs to know about the chapter's shape. */
export interface TremaShape {
  /** Link 1 is a Paragon that chains to Trema (TR1 a); false for Trema alone (TR1 b). */
  readonly paragonLink: boolean;
  /** That Paragon answers an unreducible hit with Big Bang (the normal form; research §4.1). */
  readonly paragonBigBang: boolean;
  /** Paragon's combatant id (an enemy's combatant id is its `EnemyDef.id`), when there is a link. */
  readonly paragonId?: string;
  /** Trema's combatant id: the story block's `trema`, or whichever Trema block the shape fields. */
  readonly tremaId: string;
}

/** Paragon's counter, as the data names it (`src/data/ffx2/enemies/paragon-abilities.ts`). */
export const PARAGON_BIG_BANG = 'paragon-big-bang';

/** Is this enemy a Paragon (any form)? By id or AI script, `paragon` or `paragon-<form>`. */
export function isParagon(e: Pick<EnemyDef, 'id'> & { aiScriptId?: string }): boolean {
  return [e.id, e.aiScriptId ?? ''].some((s) => s === 'paragon' || s.startsWith('paragon-'));
}

/** Is this enemy a Trema (the story block or the Fiend Arena block)? */
export function isTrema(e: Pick<EnemyDef, 'id'> & { aiScriptId?: string }): boolean {
  return [e.id, e.aiScriptId ?? ''].some((s) => s === 'trema' || s.startsWith('trema-'));
}

/** The story block's id (`src/data/ffx2/enemies/trema.ts`), when no formation names another. */
export const TREMA_ID = 'trema';

type Formation = Pick<EnemyGroupDef, 'enemies' | 'nextGroupId'>;

/**
 * The shape of a chapter whose first formation is `first`. `find` looks a chained formation up
 * by id (to read which Trema the link fields); without it, or when it finds nothing, the story
 * block's {@link TREMA_ID} is assumed.
 */
export function tremaShapeOf(first: Formation, find?: (id: string) => Formation | undefined): TremaShape {
  const paragon = first.enemies.find(isParagon);
  const paragonLink = Boolean(paragon && first.nextGroupId && !first.enemies.some(isTrema));
  const tremaGroup = paragonLink && first.nextGroupId ? find?.(first.nextGroupId) : first;
  const tremaId = tremaGroup?.enemies.find(isTrema)?.id ?? TREMA_ID;
  if (!paragonLink || !paragon) return { paragonLink: false, paragonBigBang: false, tremaId };
  return {
    paragonLink: true,
    paragonBigBang: Boolean(paragon.abilityIds?.includes(PARAGON_BIG_BANG)),
    paragonId: paragon.id,
    tremaId,
  };
}

/** The shipped picks, TR1 a with the normal Paragon (TR7): what the chapter data carries today. */
export const TREMA_SHAPE_PARAGON_LINK: TremaShape = {
  paragonLink: true,
  paragonBigBang: true,
  paragonId: 'paragon',
  tremaId: TREMA_ID,
};
/** Option 2, Trema alone (TR1 b): no Paragon, no link. */
export const TREMA_SHAPE_ALONE: TremaShape = { paragonLink: false, paragonBigBang: false, tremaId: TREMA_ID };

/**
 * Every boss id a chapter of this shape fields: Trema, and Paragon only when there is a Paragon
 * link. The guide registers exactly these, so the Trema-alone shape claims no Paragon (m5).
 */
export function tremaBossIdsFor(shape: TremaShape): readonly string[] {
  return shape.paragonLink && shape.paragonId ? [shape.tremaId, shape.paragonId] : [shape.tremaId];
}
