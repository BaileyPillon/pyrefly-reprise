/**
 * The advisor's "Guide's pick" badge only stands beside the move the guide's
 * NEXT line names right now (critic round 13 PR-0169).
 *
 * The card is computed once per decision and held (`MoveAdvisor.showDecision`),
 * while the strategy guide re-reads the board on every `sync`. In FFX-2 the
 * board keeps moving while a menu is open, so the chapter tactic's pick changes
 * under an open card: live Chapter V showed "Light Curtain -> the party GUIDE'S
 * PICK" beside a guide that said "NEXT YUNA Pray -> the party". The badge claims
 * the guide's endorsement, so it is withdrawn whenever the guide, on the board
 * it is showing, names a different command. The move itself stays on the card:
 * only the claim goes.
 *
 * **Game case: both** [AGENTS.md rule 14]. Observed in FFX-2, where the clock
 * runs under an open menu; in FFX the board is still while a menu is open, so
 * the check is simply always true there.
 */

import type { AvailableCommand, BattleState, CombatantId } from '../../battle/common/types.ts';
import { sameCommand, type AdvisorView } from '../../engine/tactics/advisor.ts';
import { buildGuideView } from '../../engine/tactics/guide.ts';

export interface BadgeDecision {
  actorId: CombatantId;
  commands: AvailableCommand[];
}

/**
 * Does the guide, on `state`, name the same command as the card's tactic row?
 * `true` when the card carries no tactic row (there is no badge to judge).
 */
export function guideAgrees(
  state: Readonly<BattleState>,
  decision: BadgeDecision,
  view: AdvisorView | null,
): boolean {
  const tactic = view?.suggestions.find((s) => s.source === 'tactic');
  if (!tactic) return true;
  try {
    const next = buildGuideView(state, decision)?.next?.command ?? null;
    return next !== null && sameCommand(next, tactic.command);
  } catch {
    return false;
  }
}

/** The view to print: unchanged when the guide agrees, else with the badge's claim withdrawn. */
export function withGuideBadge(view: AdvisorView, agrees: boolean): AdvisorView {
  if (agrees) return view;
  return {
    ...view,
    suggestions: view.suggestions.map((s) => (s.source === 'tactic' ? { ...s, source: 'simulated' as const } : s)),
  };
}
