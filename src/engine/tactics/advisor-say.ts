/**
 * **One sentence, every claim re-derivable.**
 *
 * The card's reason line is assembled from at most two {@link BoardFact}s, each
 * carrying the number that produced it and what proved it. There is no
 * per-chapter template and no adjective that is not backed by a measurement:
 * if a test can read the same `SimOutcome` and the same forecast, it can
 * re-derive every figure the sentence prints.
 *
 * Shape: *what is true on the board* → *therefore this move* → *what it buys*.
 *
 * > "Slow on Yu Pagoda lands about 40 times in 100 — and it is how this fight
 * >  gets shorter."
 * > "Yuna lives through Nova: this is the turn to spend on her."
 *
 * ## The four rules, all testable
 *
 *  1. every clause cites a fact, and every fact carries its source tag;
 *  2. a fact whose only source is the **pre-action** forecast may not be worded
 *     as a consequence of the action — the forecast was taken before the move,
 *     and saying "this stops Nova" when the board only proves "Nova is coming"
 *     is the over-claim `advisor-eval.ts` tags every fact to prevent;
 *  3. the confidence word rides **inside the sentence**, never on a chip. The
 *     advisor card has no approved target tile — the end-state board's own
 *     waiting list says a mockup of it is still owed — so new paint on it needs
 *     Bailey's options round first [AGENTS.md rule 9;
 *     docs/plans/advisor-v2-review.md §11 condition 3];
 *  4. no fact clears its threshold → the sentence is `''`. **Silent rather than
 *     wrong** is `noteFor`'s existing rule and it is kept verbatim.
 *
 * ## Which game
 *
 * **Both** [AGENTS.md rule 14]. Two absences are asserted rather than assumed
 * (`tests/unit/advisor-sentence.test.ts`): an FFX-2 card never prints a CTB
 * tempo claim, and an FFX card never prints a gauge-time claim — each game's
 * term is supplied by its own host or not at all, and a term with no provider
 * produces no fact to cite.
 *
 * Pure and DOM-free.
 */

import type { BoardFact } from './advisor-eval.ts';

/** How sure the sentence is allowed to sound. See `./advisor-roll.ts`. */
export type Confidence = 'certain' | 'likely' | 'gamble';

/** Facts worth a clause, best first. Anything under this is not said at all. */
const THRESHOLD: Partial<Record<BoardFact['kind'], number>> = {
  'saves-from-lethal': 1,
  'still-lethal': 1,
  kills: 0,
  gamble: 15,
  'certain-status': 1,
  incoming: 200,
  phase: 1,
  tempo: 1,
};

/**
 * The order a clause earns its place in.
 *
 * Survival first, because it is the question the player is asking; then the
 * kill, because it ends the fight; then what the move is rolling for. `phase`
 * and `incoming` are context and only ever appear as the second clause.
 */
const RANK: Record<BoardFact['kind'], number> = {
  'saves-from-lethal': 0,
  kills: 1,
  'still-lethal': 2,
  gamble: 3,
  'certain-status': 4,
  phase: 5,
  incoming: 6,
  tempo: 7,
};

/**
 * The kinds that may **lead** a sentence.
 *
 * `incoming`, `phase` and `tempo` are context: true of the board, and no answer
 * at all to "why this row". Letting one lead is how a raise aimed at a downed
 * Yuna came back as *"Lance of Atrophy is worth about 755"* — a fact, correctly
 * measured, about somebody else's move [`tests/unit/advisor-ownership.test.ts`,
 * caught 2026-09-21]. When nothing stronger clears, this file says nothing and
 * the shipped per-move reason stands: **silent rather than wrong**.
 */
const LEAD_KINDS: ReadonlySet<BoardFact['kind']> = new Set([
  'saves-from-lethal',
  'still-lethal',
  'kills',
  'gamble',
  'certain-status',
]);

function clears(f: BoardFact): boolean {
  const t = THRESHOLD[f.kind];
  return t !== undefined && Math.abs(f.value) >= t;
}

/**
 * The card's reason line for one move, or `''`.
 *
 * @param facts everything `./advisor-eval.ts` proved about this candidate.
 * @param confidence from `./advisor-roll.ts#confidenceOf`. Printed as a word
 *   inside the sentence when it is `'gamble'`, because that is the one the
 *   player is entitled to know before spending a turn on it.
 * @param longPlan the chapter line's own label, when this move is **not** it.
 *   Naming it is what stops the card and the strategy panel teaching different
 *   fights [`./advisor-plan.ts#beatsPrior`].
 */
export function sentenceFor(
  facts: readonly BoardFact[],
  confidence: Confidence,
  longPlan?: string | null,
): string {
  const usable = facts.filter(clears).sort((a, b) => RANK[a.kind] - RANK[b.kind]);
  if (usable.length === 0) return '';

  const lead = usable[0]!;
  if (!LEAD_KINDS.has(lead.kind)) return '';
  const second = usable.find((f) => f !== lead && RANK[f.kind] > RANK[lead.kind]);

  let text = lead.text;
  if (second) text += `, and ${second.text}`;

  // Rule 3: the word, inside the sentence. Only when the board really does turn
  // on a draw, and only when the lead clause is the draw itself — a confidence
  // word attached to a certainty reads as hedging a fact.
  if (confidence === 'gamble' && lead.kind === 'gamble') {
    text += ' — a gamble, and the one the chapter is built on';
  }

  if (longPlan) text += `; the long plan is still ${longPlan}`;

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Every fact the sentence actually used, for the assertion that re-derives it.
 *
 * `tests/unit/advisor-sentence.test.ts` takes this list, re-runs the same
 * simulation and the same forecast, and checks each `value` against the engine's
 * own answer. A claim that cannot be re-derived fails the build.
 */
export function citedFacts(facts: readonly BoardFact[]): BoardFact[] {
  const usable = facts.filter(clears).sort((a, b) => RANK[a.kind] - RANK[b.kind]);
  if (usable.length === 0) return [];
  const lead = usable[0]!;
  if (!LEAD_KINDS.has(lead.kind)) return [];
  const second = usable.find((f) => f !== lead && RANK[f.kind] > RANK[lead.kind]);
  return second ? [lead, second] : [lead];
}

/**
 * **Rule 2, as a predicate.** A sentence may not word a pre-action forecast as
 * something the action caused.
 *
 * A `'forecast'` fact is legitimate — "Nova is worth about 2 400" is true of the
 * board — and becomes an over-claim only when it is phrased as a consequence.
 * `saves-from-lethal` and `still-lethal` are the two that join a forecast
 * reading to our own simulated HP change, so they are consequences of a
 * measured pair and are allowed; a bare `incoming` is context and must never
 * carry a causal clause.
 */
export function overClaims(text: string, facts: readonly BoardFact[]): boolean {
  const cited = citedFacts(facts);
  const causal = /\b(stops|prevents|cancels|denies|blocks)\b/i;
  if (!causal.test(text)) return false;
  return cited.every((f) => f.source === 'forecast' && f.kind === 'incoming');
}
