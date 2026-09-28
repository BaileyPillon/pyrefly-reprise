/**
 * FFX-2's named enemy moves whose **name is the warning**: the battle-message banner prints the fiend's name and
 * the move's name as it starts (`./battleMessage.ts`). **FFX-2 only** [AGENTS.md rule 14]; FFX's enemy names ride
 * its own top HELP bar (`src/ui/ffx/actionBanner.ts`, PR-0180).
 *
 * Kept to the moves a source says are read off the screen, one row each:
 *
 * - `x2-ixion-recharge`, Chapter XVI: "Recharge is the tell. Thor's Hammer is Ixion's next action after Recharge"
 *   (`research/ffx2-ixion-djose.md` §4.2, `[verified: 3 sources]`); the game "shows no counter; the 'Recharge' name
 *   is the only warning" (concept A, D-265; Split_Infinity: "heal as soon as you see Recharge"). The check of
 *   2026-09-27 found no banner for it (the one major).
 *
 * Whether FFX-2 names *every* enemy move there is not in our sources, so nothing else is added here.
 */
export const FFX2_TOLD_ENEMY_MOVES: ReadonlySet<string> = new Set(['x2-ixion-recharge']);

/** True when this ability's name is shown on the FFX-2 battle banner as it starts. */
export function isToldEnemyMove(abilityId: string | undefined): boolean {
  return abilityId !== undefined && FFX2_TOLD_ENEMY_MOVES.has(abilityId);
}
