/**
 * **Doublecast as two picks: the words** (FFX only; Option A "Second round", decision queue item 103, delegated).
 *
 * Pure strings for the breadcrumb and the two-line help slab of each step of the flow, in the shapes of the approved frames
 * (`D:/Tools/pyrefly-scratch/2026-10-18/doublecast/A-*.png`): a gold numeral chip, then line 1 in the label face (`FIRA › YU PAGODA A`, its price at the
 * right), then line 2 in the serif with the MP numbers in the numeral face. Two lines is what the slab holds (33 grid px), so every sentence stays under
 * about 38 characters, and no numeral sits inside a serif sentence on its own (Cormorant's old-style figures read "1" as "I"; the digits live in the chips and
 * in the numeral face).
 *
 * Every number here is the engine's: the price on a row, `pendingMp`, `mpAfter` (see `doublecastModel.ts`). No rule is applied in this file.
 */

import type { AnyCombatant, AvailableCommand, CombatantId } from '../../battle/common/types.ts';
import { aimLabel, mpAfterSecond, noSecondSpell, pendingMp, type DoublecastWrap } from './doublecastModel.ts';

/** One piece of line 2: a sentence, or an MP number that is drawn in the numeral face. */
export type HelpPart = string | { num: string };

/** The slab's two lines for a step of a Doublecast. */
export interface DoublecastHelp {
  /** The gold numeral chip: which cast this step is about. */
  chip: '1' | '2';
  /** Line 1, label face: the spell, and where it went (round 2's list) or what it costs (a target step). */
  head: string;
  /** Line 1's right end, label face in sky: the first cast's price. Round 2's list only. */
  mp?: string;
  /** Line 2, serif. */
  line2: HelpPart[];
  /** The same words flat: the readers that take the slab's text, and the tests. */
  plain: string;
  /** The phone's line for this step: the footer in a list ("12 MP left after Fira. Choose the second cast."), the strip over the Back bar in a target step (with its numeral). */
  phone: { at: 'foot' | 'step'; n?: '1' | '2'; text: string };
}

/** The inputs a step's words are made from. */
export interface HelpEnv {
  combatants: Readonly<Record<CombatantId, AnyCombatant>>;
  tagOf?: (id: CombatantId) => string | undefined;
}

/** The list's header: "Doublecast · 2 of 2". The bar is upper-cased by its own style. */
export function doublecastCrumb(wrap: Pick<DoublecastWrap, 'wrapper' | 'round'>): string {
  return `${wrap.wrapper.label} \u00b7 ${wrap.round} of 2`;
}

/** The help line over round 1's list: what Doublecast is, then the highlighted spell's own effect. Plain: round 1's list is today's screen. */
export function doublecastLeadHelp(wrapper: AvailableCommand, rowHelp: string): string {
  const lead = `${wrapper.label}: two spells in one turn`;
  return rowHelp ? `${lead} \u00b7 ${rowHelp}` : lead;
}

const flat = (parts: readonly HelpPart[]): string => parts.map((p) => (typeof p === 'string' ? p : p.num)).join('');

const mpText = (n: number): string => `${n} MP`;

/** "Fira · 8 MP" (a free spell has no price to print). */
function spellAndPrice(cmd: AvailableCommand): string {
  return cmd.mpCost ? `${cmd.label} \u00b7 ${mpText(cmd.mpCost)}` : cmd.label;
}

/**
 * The slab for a step of an open Doublecast, or `null` for round 1's list (plain: `doublecastLeadHelp`).
 * `at` is the step: `'list'` (the highlighted row is `cmd`, unused here) or `'target'` (`cmd` is the spell being aimed).
 */
export function doublecastHelp(wrap: DoublecastWrap, at: 'list' | 'target', cmd: AvailableCommand | null, actor: AnyCombatant | undefined, env: HelpEnv): DoublecastHelp | null {
  if (wrap.round === 1) {
    if (at !== 'target' || !cmd) return null;
    const head = spellAndPrice(cmd);
    const line2: HelpPart[] = ['Pick a target for the first cast.'];
    return { chip: '1', head, line2, plain: `1 ${head}. ${flat(line2)}`, phone: { at: 'step', n: '1', text: `Cast 1 of 2 \u00b7 ${head}` } };
  }
  const first = wrap.first;
  const pending = pendingMp(wrap, actor);
  if (!first || !pending) return null;
  const where = aimLabel(first.targets, env.combatants, env.tagOf);
  if (at === 'target') {
    if (!cmd) return null;
    const after = mpAfterSecond(wrap, cmd);
    const head = spellAndPrice(cmd);
    const line2: HelpPart[] = after === null ? ['Pick its target.'] : ['Pick its target. ', { num: mpText(after) }, ' left after.'];
    return { chip: '2', head, line2, plain: `2 ${head}. ${flat(line2)}`, phone: { at: 'step', n: '2', text: `Cast 2 \u00b7 after 1 ${first.cmd.label} \u203a ${where}` } };
  }
  const head = where ? `${first.cmd.label} \u203a ${where}` : first.cmd.label;
  const mp = mpText(pending.spent);
  if (noSecondSpell(wrap)) {
    const line2: HelpPart[] = ['No second spell fits. Esc goes back.'];
    return { chip: '1', head, mp, line2, plain: `1 ${head}, ${mp}. ${flat(line2)}`, phone: { at: 'foot', text: 'No second spell fits. Tap the title to go back.' } };
  }
  const line2: HelpPart[] = [{ num: mpText(pending.left) }, ' left. Choose the second cast.'];
  return { chip: '1', head, mp, line2, plain: `1 ${head}, ${mp}. ${flat(line2)}`, phone: { at: 'foot', text: `${mpText(pending.left)} left after ${first.cmd.label}. Choose the second cast.` } };
}
