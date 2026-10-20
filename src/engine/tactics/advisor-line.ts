/**
 * **A chapter's card follows the chapter's own line** (DIFF-B, PR-0227, Chapter XIII; extended in
 * release 59 to the FFX chapters whose card lost, decision 145). Bailey, 2026-10-12: "I'll go with
 * all of your recommendations", the options page's DIFF-B for Chapter XIII; 2026-10-19, the same
 * words for the release 59 list, and his 2026-09-18 criticism of "advisor errors".
 *
 * **Game case, chapter by chapter** ({@link LINE_FIRST_CHAPTERS}): FFX-2 Chapter XIII (Paragon,
 * then Trema), FFX Chapter XIV (Isaaru's three aeons) and FFX Mirror Aeons (the Dark Magus Sisters
 * and Dark Yojimbo). Every other chapter of either game keeps the card it has: nothing here is
 * reached on a board whose governing tactic is not one of those.
 *
 * ## Release 59 (decision 145; FFX only; measured on the engine, 40 seeds a chapter)
 *
 * In FFX Chapter XIV the card was the simulated ranking and a player who pressed its top row every
 * turn won 13 of 40 seeds, where the chapter's own tactic (the strategy guide's NEXT line, what the
 * auto-battler plays) won 35 of 40: the card spent Yuna's full Grand Summon gauge on a lesser aeon
 * and the party fell to Spathi's Mega Flare in the third link. In Mirror Aeons it was 3 of 40 against
 * the line's 24. A sweep of every listed chapter, FFX and FFX-2, and of the hidden ones, found no
 * other chapter where the card wins clearly less than the line (the largest gap elsewhere is 3 seeds
 * of 40, a paired sign test p of 0.37 or more): `critic/bench/r59-advisor/`, the table is in
 * `docs/handoff/r59-advisor-line.md`. The same rule as DIFF-B then applies to those two: the line's
 * row is the card's top row (below), and where the tactic names nothing this actor can press the
 * ranking stands as it was. Bailey's ruling of 2026-09-21 ("the ranking may outrank the guide") is
 * not overturned anywhere the ranking was not losing: the other FFX chapters keep a card that may
 * differ from the guide's NEXT line, and advisor v4's look-ahead pick (`AdvisorOptions.lift`) still
 * goes on top of any card, this one included, when its search proves it better.
 *
 * ## What the option was, and what is built
 *
 * The options page measured two players of Chapter XIII at the house human pace (Wait, 0.5 s on the
 * top list with the clock running, 1.0 s held in a submenu), 200 seeds each: one presses the card's
 * top row (45.5 %), one presses the chapter's own tactic, `intendedStrategy` on the live board
 * (63.5 %). The two agree on 97.5 % of the decisions, and the 2.5 % that differ are where the card
 * loses its 18 points. This module makes the first player the second: **on a Chapter XIII board the
 * card's top row is the chapter's line**, the row `intendedStrategy` chooses on the live board, the
 * one the auto-battler and the strategy guide's NEXT line already name.
 *
 * Nothing in the game changes: no rule, boss, party or kit number, and no row is added to a menu.
 * Only the order of the card's rows does.
 *
 * ## What the line is allowed to beat
 *
 * Measured on 30 seeds (the harness of `critic/bench/r44-diffb/`), the card left the line on 66 of 2,978 decisions. Switching one family of
 * rules off at a time, the first whose removal alone gave the line back was: the planner's re-orderings, 45 times (the **lethal-save
 * override** above all: a heal that saves a girl from the enemy's telegraphed hit goes over the line, where the line attacks or presses
 * Darkness; also the proved save, the revive priority and the race lift); advisor v3's, 20 times (the **projected board**, the line read after
 * another girl's command has landed where the measured player reads the live board, 8 of the 66; and the **already on its way** drop of a
 * heal while one is in flight); the proved save alone, once. The line now outranks all of them on this chapter:
 *
 *  1. the lethal-save override, the proved save, the revive priority and the race lift (`./advisor.ts`);
 *  2. the projected board: the line is read off the live board, as `intendedStrategy` is by the auto-battler;
 *  3. the already-on-its-way drop and the inert demotion (a line row stays on top even while a copy of it is in flight).
 *
 * The second row is untouched: when a girl is down and the top row is not the raise, the raise is
 * still shown beneath it, with its caution, so the player sees what the line is stepping past.
 *
 * What the line is **not** allowed to beat is the card's one unbreakable promise: a row the actor
 * cannot press on the menu in front of them is never printed ({@link ownedRow}, `pressable`). When
 * the line names such a row the ranking stands as it was.
 *
 * `ADVISOR_LINE_FIRST` is the switch (the whole of the change, off in one edit);
 * `AdvisorOptions.lineFirst` overrides it for one call, so the measurement drives the card with the
 * rule on and off through one binary (`critic/bench/r44-diffb/`), as `v3` does.
 */

import type { BattleState, Command } from '../../battle/common/types.ts';
import type { Tactic } from './common.ts';
import { stateOnlyEngine } from './guide.ts';
import { TACTICS, tacticFor } from './index.ts';

/** The switch. See the module note and `docs/handoff/r44-diffb.md` for the measurement behind it. */
export const ADVISOR_LINE_FIRST = true;

/**
 * The chapters whose card puts the line on top, and the measurement that put each one here (engine, house pace for FFX-2,
 * the card against the chapter's tactic over the same seeds; `docs/handoff/r44-diffb.md`, `docs/handoff/r59-advisor-line.md`):
 *
 *  - `ffx2-trema` (FFX-2 XIII, DIFF-B, release 44): 91 of 200 against 127 of 200.
 *  - `isaaru-via-purifico` (FFX XIV, release 59): 13 of 40 against 35 of 40.
 *  - `mirror-aeons` (FFX Mirror Aeons, release 59): 3 of 40 against 24 of 40.
 *
 * A chapter is added only when the card wins clearly less than the line over a seed-paired sweep, never because it has a tactic.
 */
export const LINE_FIRST_CHAPTERS: readonly string[] = ['ffx2-trema', 'isaaru-via-purifico', 'mirror-aeons'];

/** The tactics of those chapters, from the registry (`./index.ts`): what `tacticFor` returns on their boards. */
const LINE_FIRST: ReadonlySet<Tactic> = new Set<Tactic>(TACTICS.filter((t) => LINE_FIRST_CHAPTERS.includes(t.chapterId)).map((t) => t.tactic));

/** What `buildAdvisorView` needs from its options here (structurally `AdvisorOptions`). */
export interface LineFirstOptions {
  lineFirst?: boolean;
  lift?: Command;
}

/**
 * Does the card on this board put the chapter's line first? Only a board a {@link LINE_FIRST_CHAPTERS}
 * tactic governs (`tacticFor` is the lookup the line itself uses, game first, then the boss on the
 * enemy side, so an FFX board never reaches an FFX-2 chapter's line or the reverse). An explicit
 * look-ahead pick (`AdvisorOptions.lift`, advisor v4's, FFX only in the game) is left on top, as it
 * always was.
 */
export function lineFirstOn(board: Readonly<BattleState>, options: LineFirstOptions): boolean {
  if (!(options.lineFirst ?? ADVISOR_LINE_FIRST)) return false;
  if (options.lift !== undefined) return false;
  if (board.game === 'ff7') return false;
  const governing = tacticFor(stateOnlyEngine(board));
  return governing !== null && LINE_FIRST.has(governing);
}
