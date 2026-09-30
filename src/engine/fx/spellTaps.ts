/**
 * Two optional taps on the approved option-B spell effects (`spellfx/SpellFxLayer.ts`) for the
 * eye-candy prototype options. Both are null unless an option installs them, so the spell
 * layer draws exactly as it always has.
 *
 * - `beforeDraw`: called with the frame's batch just before the crisp quads are drawn over the
 *   finished frame (option A1b draws the spell's halo there, under them).
 * - `land`: a drawn effect was started on a target (option A8's lens flare on big spells).
 */

import type { WebGLRenderer } from 'three';
import type { FxBatch } from '../spellfx/FxBatch.ts';
import type { FxGame, SpellFxId } from '../spellfx/SpellFxRegistry.ts';

export interface SpellLandTap {
  fx: SpellFxId;
  game: FxGame;
  abilityId: string | undefined;
  /** Milliseconds until the blow lands in the drawn effect. */
  ms: number;
  /** The target's painted rectangle, CSS px relative to the canvas. */
  rect: { x: number; y: number; w: number; h: number } | null;
  view: { w: number; h: number };
}

export const spellTaps: {
  beforeDraw: ((renderer: WebGLRenderer, batch: FxBatch, view: { w: number; h: number }) => void) | null;
  land: ((tap: SpellLandTap) => void) | null;
} = { beforeDraw: null, land: null };
