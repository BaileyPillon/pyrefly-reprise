/**
 * **Chapter XIII's card follows the chapter's own line** (DIFF-B, PR-0227; Bailey, 2026-10-12:
 * "I'll go with all of your recommendations", the options page's DIFF-B for Chapter XIII).
 *
 * **Game case: FFX-2 only, Chapter XIII (Paragon, then Trema).** Chapters V and XV and every FFX
 * chapter keep the card they have: nothing here is reached on a board whose governing tactic is not
 * `ffx2Trema`.
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
import { ffx2Trema } from './ffx2-trema.ts';
import { stateOnlyEngine } from './guide.ts';
import { tacticFor } from './index.ts';

/** The switch. See the module note and `docs/handoff/r44-diffb.md` for the measurement behind it. */
export const ADVISOR_LINE_FIRST = true;

/** The tactics whose chapter's card puts the line on top: Chapter XIII's, and no other. */
const LINE_FIRST: ReadonlySet<Tactic> = new Set<Tactic>([ffx2Trema]);

/** What `buildAdvisorView` needs from its options here (structurally `AdvisorOptions`). */
export interface LineFirstOptions {
  lineFirst?: boolean;
  lift?: Command;
}

/**
 * Does the card on this board put the chapter's line first? Only a board the Chapter XIII tactic
 * governs (`tacticFor` is the lookup the line itself uses, game first, then the boss on the enemy
 * side). An explicit look-ahead pick (`AdvisorOptions.lift`, advisor v4's, FFX only in the game) is
 * left on top, as it always was.
 */
export function lineFirstOn(board: Readonly<BattleState>, options: LineFirstOptions): boolean {
  if (!(options.lineFirst ?? ADVISOR_LINE_FIRST)) return false;
  if (options.lift !== undefined) return false;
  if (board.game !== 'ffx2') return false;
  const governing = tacticFor(stateOnlyEngine(board));
  return governing !== null && LINE_FIRST.has(governing);
}
