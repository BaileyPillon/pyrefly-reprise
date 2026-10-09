/**
 * **Chapter XII: a landed hit on a Mortiphasm turns a disc**, and the advisor
 * has to see that as the move it is (critic round 13 PR-0197).
 *
 * A disc takes no damage (`immune-to-damage`): the engine emits the hit's
 * `damage` event with `amount: 0`, and the disc turns from its own `onHit` hook
 * (`battle/ffx/ai/seymour-omnis.ts`), which this preview does not read. So the preview of "Attack -> Mortiphasm A"
 * read as a zero-damage no-op, the state guard filed the chapter's own line
 * behind every useful row, and a card-follower never turned a disc in four
 * live attempts, trailing the intended line on the bench (24 against 27 of 40).
 *
 * Turning discs is the fight's signature counter to his -ga spells
 * (research/ffx-seymour-omnis.md §5 row 2, verified: 4 sources): a landed hit
 * turns a disc 90° (a physical hit left, a spell right, §4.3, verified: 6
 * sources). This module reads the preview for that landed hit and says what it
 * changes: which disc turns, what it shows afterwards, and how many -ga spells
 * his next volley loses (§4.1: -ga on an element shown on three or more discs,
 * verified: 4 sources). It never invents a number: every figure is the
 * engine's own rule applied to the engine's own flags.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every answer is `null` unless
 * the board carries the `omnis.discs` flag, which only the Omnis formation sets.
 */

import type { BattleEvent, BattleState, Command } from '../../battle/common/types.ts';
import { simulateFFXCommand, type SimOutcome } from '../../battle/ffx/simulate.ts';
import {
  DISC_RING,
  type Element4,
  MORTIPHASM_IDS,
  omnisDiscs,
} from '../../battle/ffx/ai/seymour-omnis-rules.ts';

export interface DiscTurn {
  /** Which disc turns (0-3, left to right). */
  index: number;
  direction: 'left' | 'right';
  before: readonly Element4[];
  after: readonly Element4[];
  /** How many of his volley's spells stop being -ga (never negative). */
  gaLost: number;
}

/** His volley: four spells, -ga for each spell of an element that shows on 3+ discs (3 or 4 of them) [§4.1]. */
export function gaCount(discs: readonly Element4[]): number {
  const n: Record<string, number> = {};
  for (const d of discs) n[d] = (n[d] ?? 0) + 1;
  return discs.filter((d) => (n[d] ?? 0) >= 3).length;
}

/**
 * The disc this previewed action turns, or `null` (not the Omnis board, no
 * landed hit on a disc, or a command that is neither a blow nor a spell).
 */
export function discTurnOf(state: Readonly<BattleState>, command: Command, outcome: SimOutcome | null): DiscTurn | null {
  if (!outcome) return null;
  const before = omnisDiscs(state);
  if (before.length !== MORTIPHASM_IDS.length) return null;
  const hit = (outcome.events as readonly BattleEvent[]).find(
    (e) => e.type === 'damage' && MORTIPHASM_IDS.includes((e as { targetId: string }).targetId),
  ) as { targetId: string } | undefined;
  if (!hit) return null;
  const index = MORTIPHASM_IDS.indexOf(hit.targetId);
  // A physical hit turns it left, a spell right [§4.3]. The engine reads the
  // action's damage type; the preview's ability record carries the same one.
  const physical = command.kind === 'attack' || outcome.ability?.damageType === 'physical';
  const direction: 'left' | 'right' = physical ? 'left' : 'right';
  const now = before[index]!;
  const at = DISC_RING.indexOf(now);
  const step = direction === 'right' ? 1 : -1; // `turnDisc`'s own step: a spell +1 on the game's ring, a blow -1
  const after = [...before];
  after[index] = DISC_RING[(at + step + DISC_RING.length) % DISC_RING.length]!;
  return { index, direction, before, after, gaLost: Math.max(0, gaCount(before) - gaCount(after)) };
}

/**
 * What one -ga taken out of his next volley is worth, in the scorer's units.
 * An advisor weight, not game data: set against `advisor.ts`'s own scale (an
 * ordinary boss hit ~600-2,600; a revive ~2,500 up) so a disc turn that breaks
 * a -ga ranks with the heals that answer one.
 */
export const DISC_GA_VALUE = 2_500;

/** The score a disc turn adds to its row: {@link DISC_GA_VALUE} per -ga it takes away. */
export function discTurnValue(turn: DiscTurn | null): number {
  return turn ? turn.gaLost * DISC_GA_VALUE : 0;
}

/**
 * The disc turn the card's **top row** would make, or `null` (D-216 / D-248:
 * the coach's Chapter XII line fires the first time this is non-null).
 *
 * It re-previews that one row on the engine's own simulator, the way the
 * advisor scored it, and asks {@link discTurnOf} what it did. The Omnis board
 * is checked first, so on every other fight this is a cheap `null` and runs no
 * simulation.
 */
export function topRowDiscTurn(
  state: Readonly<BattleState>,
  view: { readonly actorId: string; readonly suggestions: readonly { readonly command: Command }[] } | null,
): DiscTurn | null {
  const top = view?.suggestions[0];
  if (!view || !top || omnisDiscs(state).length !== MORTIPHASM_IDS.length) return null;
  return discTurnOf(state, top.command, simulateFFXCommand(state, view.actorId, top.command, { roll: 'mid' }));
}
