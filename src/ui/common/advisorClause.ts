/**
 * The move advisor's reasons, shortened without a cut (PR-0330, release 39.1; both games: it is the shared card).
 *
 * A reason is the advisor's one sentence on why a row is offered ("It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400 in all",
 * "Take the pouch off Guado Guardian A: one successful Steal ends its ... — and nothing else, so it will still Remedy him"). In a narrow box the card
 * used to run it to two lines and let the browser end the second with an ellipsis, so the card printed a sentence that stopped mid-thought
 * ("Take the pouch off Guado Guardian A: one..."), which round 22 read as clipped text. A reason with a semicolon or a second sentence in it is shortened
 * here at that boundary instead: the first clause is a whole statement in its own right, so what the card prints is always complete. A reason with no
 * boundary is printed whole or not at all (whether it fits is the density ladder's question, `MoveAdvisor.ts`: it is dropped at the next rung).
 *
 * Pure and DOM-free so the rule is tested without a layout engine.
 */

/**
 * Where a reason may be cut: a semicolon or the end of a sentence inside it ("It puts Cheer on the party; next, Mortiphasm Spells hits for about 4,400"). A
 * colon never is, and neither is a dash: what follows either is usually the point ("... — stand Yuna up", "...: one successful Steal ends its counter").
 */
const CLAUSE_BREAK = /;\s+|\.\s+(?=[A-Z‘’'"])/;

/** The clauses of a reason, in order, without their separators or a closing full stop. */
export function reasonClauses(reason: string): string[] {
  return reason
    .split(CLAUSE_BREAK)
    .map((c) => c.trim().replace(/[.;]+$/, '').trim())
    .filter((c) => c.length > 0);
}

/** The first whole clause of a reason (the reason itself when it has one clause). */
export function firstClause(reason: string): string {
  return reasonClauses(reason)[0] ?? reason.trim();
}
