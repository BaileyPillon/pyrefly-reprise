/**
 * What the painted field does while the player is choosing a target.
 *
 * The approved end state is option B, *"hand, ring and a quiet dim"*
 * (`docs/concepts/targeting/b-ring-and-dim/`, picked by Bailey 2026-09-19).
 * Two of its marks live out here in the 3D scene rather than in the HUD:
 *
 * - **a soft accent pool** on the ground under every selected figure — gold for
 *   an enemy, green for an ally, and a pink halo *behind* the figure instead
 *   when the target levitates and has no feet (Vegnagun's head, a Yu Pagoda);
 * - **the quiet dim**: every non-target drops about a quarter in brightness and
 *   saturation, **on both sides of the field**, restored the instant selection
 *   ends or is cancelled.
 *
 * Both are additions Bailey accepted knowing they come from neither game. The
 * marks that ARE canon — the hand cursor, the bracket, the name plate with its
 * letter tag, the help bar — are HTML and live in the HUD, where the Ink & Gold
 * chrome is.
 *
 * GAME-AWARE (AGENTS.md rule 14): **both games.** The ring and the dim are
 * "neither game" additions applied to one field renderer that FFX chapters 1-3
 * and FFX-2 chapters 4-5 share, and `docs/concepts/targeting/options.json`
 * lists them under option B's `trueTo.neither` for both S2 (FFX) and S3
 * (FFX-2). Only the **accent colour** is game-specific, and only for the
 * floating case: FFX-2's accent is pink, which is that game's own chrome.
 *
 * This module holds no state the battle depends on and never touches battle
 * math, who may be targeted, or an outcome. It reads a set of ids and paints.
 */

import type { CombatantId, Side } from '../battle/common/types.ts';
import type { PaintedActor } from './PaintedActor.ts';

/** The Ink & Gold accents the approved frames use. */
export const ACCENT = {
  /** Gold, `#F2C21E` — an enemy target (visual-bible §3.5). */
  enemy: 0xf2c21e,
  /** Green, `#7EE8B0` — an ally target. */
  ally: 0x7ee8b0,
  /** Cool blue, `#8FD0F0` — the actor targeting itself. */
  self: 0x8fd0f0,
  /** Pink, `#F49AC8` — FFX-2's own accent, and the halo behind a floating part. */
  ffx2: 0xf49ac8,
} as const;

export type AccentKind = keyof typeof ACCENT;

/** How far a non-target is pushed toward grey. Option B: "about a quarter". */
export const DIM_AMOUNT = 0.26;

/** The live selection, as the HUD declares it and the debug API reads it back. */
export interface TargetSelection {
  /** Ids the command is currently aimed at. Empty = nothing is being chosen. */
  ids: readonly CombatantId[];
  /** `'single'` = the player is cycling one target; `'all'` = the command hits every id. */
  mode: 'single' | 'all';
  /** Which side the candidates are on, for the debug surface and the HUD. */
  side: Side | 'both' | null;
  /** Accent to paint the selected figures with. */
  accent: AccentKind;
}

/** The field this highlighter drives. Exactly what `PaintedStage` can answer. */
export interface HighlightField {
  actor(id: CombatantId): PaintedActor | undefined;
  staged(): CombatantId[];
}

/**
 * Applies and clears the selection marks on a painted field.
 *
 * Idempotent by design: `apply()` is called on every arrow press and every
 * re-render, and computes the whole field's state from scratch each time, so a
 * cursor that skips an id (a fiend dying mid-selection) can never leave a pool
 * burning under a corpse.
 */
export class TargetHighlight {
  private readonly field: HighlightField;
  private current: TargetSelection | null = null;
  /** Ids this highlighter has touched, so `clear()` restores exactly those. */
  private touched = new Set<CombatantId>();

  constructor(field: HighlightField) {
    this.field = field;
  }

  /** The selection on screen right now, or null when nothing is being chosen. */
  get selection(): TargetSelection | null {
    return this.current;
  }

  /** Ids currently ringed. */
  get selectedIds(): CombatantId[] {
    return [...(this.current?.ids ?? [])];
  }

  /**
   * Light the given ids and dim everyone else.
   *
   * An empty `ids` list is the same as {@link clear} — a command that resolved
   * with no target must not leave the whole field grey.
   */
  apply(selection: TargetSelection): void {
    if (!selection.ids.length) {
      this.clear();
      return;
    }
    this.current = { ...selection, ids: [...selection.ids] };
    const chosen = new Set(selection.ids);
    const colour = ACCENT[selection.accent];

    for (const id of this.field.staged()) {
      const actor = this.field.actor(id);
      if (!actor) continue;
      this.touched.add(id);
      if (chosen.has(id)) {
        actor.setSelectAccent(colour);
        actor.setDim(0);
      } else {
        actor.setSelectAccent(null);
        actor.setDim(DIM_AMOUNT);
      }
    }
  }

  /**
   * Put the field back exactly as it was: no pools, nobody dimmed.
   *
   * Called on confirm, on cancel and whenever the command menu closes. It
   * walks the ids it has touched *and* everything currently staged, because a
   * combatant added mid-selection (a summoned aeon) has to come back clean too.
   */
  clear(): void {
    this.current = null;
    const ids = new Set<CombatantId>([...this.touched, ...this.field.staged()]);
    for (const id of ids) {
      const actor = this.field.actor(id);
      if (!actor) continue;
      actor.setSelectAccent(null);
      actor.setDim(0);
    }
    this.touched.clear();
  }

  /** Whether `id` is lit right now. The debug surface and the tests read this. */
  isSelected(id: CombatantId): boolean {
    return !!this.current?.ids.includes(id);
  }

  /** How far `id` is dimmed right now, 0..1. */
  dimOf(id: CombatantId): number {
    return this.field.actor(id)?.dim ?? 0;
  }
}

/**
 * The accent a target of this kind wears.
 *
 * FFX-2 paints a floating target's halo in its own pink rather than the shared
 * gold; on the ground, and in FFX, the ally/enemy/self colours above stand.
 * `game` is read from the chapter (`'ffx'` for chapters 1-3, `'ffx2'` for 4-5),
 * never from memory — AGENTS.md rule 14.
 */
export function accentFor(
  kind: 'enemy' | 'ally' | 'self',
  game: 'ffx' | 'ffx2',
  floating = false,
): AccentKind {
  if (game === 'ffx2' && floating && kind === 'enemy') return 'ffx2';
  return kind;
}
