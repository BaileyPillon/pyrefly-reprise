/**
 * Chapter XVI — Ixion at Djose, the Chamber of the Fayth [research/ffx2-ixion-djose.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-ixion-djose.ts`, which plays the chapter bench's
 * sensible line (`tests/unit/helpers/ixionDrive.ts`): every `labels` entry below is a row that tactic asks for,
 * so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the fallen aeons' action counter; the FFX
 * Ixion shares a name and two move names, nothing else (§0).
 *
 * Sourced facts only: the loop, two turns of Attack or Thundara on everyone then Aerospark (§4.2, `[verified: 2
 * sources]`); Aerospark takes 5/8 of current HP (§4.1, `[verified: 3 sources]`); the hidden count, +5 an action,
 * +10 for Aerospark, +5 each time he is hit (§4.2, `[verified: 2 sources]`); at 100 Recharge (+200 HP, +200 MP,
 * `[verified: 5 sources]`), and Thor's Hammer is his next action (`[verified: 3 sources]`), hitting everyone
 * (§4.1); Shell before the Hammer (§4.5, `[verified: 2 sources]`); absorbs Lightning, weak to Water, Breaks and Slow
 * land (§3.1, `[verified: 4 sources]`); two Dark Knights on Darkness with a White Mage (§4.5). The Hammer's element
 * is a conflict (IX-2), so the guide never names one.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 *
 * The RULES and the NEXT line (`./lines/ffx2-ixion-djose.ts`) follow the FFX-2 encounter guide the
 * project settled on (D-350, `research/jegged-encounter-guides-ffx2.md` §8); `cite` names the research
 * section behind each mechanic and is never rendered. The page does not say how many Aerospark come in
 * a row, because the research holds that as an open conflict (IX-5). The `HINTS` below are the move
 * advisor's borrowed sentences for the chapter tactic's pick: the panel does not read them.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { FFX2_IXION_DJOSE_LINE } from './lines/ffx2-ixion-djose.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's one fighter (`src/data/ffx2/enemies/ixion-djose.ts`). */
export const IXION_DJOSE_GUIDE_IDS = ['x2-ixion'] as const;

const RULES: GuideRule[] = [
  {
    text: 'His loop never changes: two turns of Attack or Thundara on everyone, then Aerospark, which takes five eighths of one girl\'s current HP.',
    short: 'Two attacks, then Aerospark',
    cite: 'ffx2-ixion-djose §4.1, §4.2',
  },
  {
    text: "Every action and every blow he takes fills a hidden count. When it is full he casts Recharge, and Thor's Hammer on everyone comes next.",
    short: "Recharge means Thor's Hammer is next",
    cite: 'ffx2-ixion-djose §4.2',
  },
  {
    text: "The moment you see Recharge, heal everyone high and put Shell up. Thor's Hammer is next, it hits all three, and it is magic.",
    short: 'After Recharge: heal everyone, Shell up',
    cite: 'ffx2-ixion-djose §4.5',
  },
  {
    text: 'Lightning heals him and Water hurts him. Two Dark Knights on Darkness do the damage while Yuna keeps them standing.',
    short: 'Lightning heals him; Water hurts',
    cite: 'ffx2-ixion-djose §3.1, §4.5',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness ignores his Defense of 106 and costs HP, not MP', cite: 'ffx2-ixion-djose §3.1, §4.5' },
  { when: { labels: ['Shell'] }, text: "Shell for the party: Thor's Hammer is magic, and it follows Recharge", cite: 'ffx2-ixion-djose §4.2, §4.5' },
  { when: { labels: ['Lunar Curtain'] }, text: 'Shell on {target} from the bag before Thor\'s Hammer', cite: 'ffx2-ixion-djose §4.5' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party against his physical Attack', cite: 'ffx2-ixion-djose §4.5' },
  { when: { labels: ['Mega-Potion'] }, text: 'Two girls are low: a Mega-Potion tops up everyone before the next Thundara', cite: 'ffx2-ixion-djose §4.5' },
  { when: { labels: ['Curaga', 'Cura', 'Hi-Potion'] }, text: 'Top {target} up: Aerospark takes a share of what is left', cite: 'ffx2-ixion-djose §4.1' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up', cite: 'ffx2-ixion-djose §4.5' },
  { when: { labels: ['Ether'] }, text: 'Yuna needs MP for Shell and Curaga', cite: 'ffx2-ixion-djose §4.5' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx2-ixion-djose §4.5' },
];

const PHASES: GuidePhase[] = [
  {
    label: 'IXION',
    note: "Watch the top of the screen: the word Recharge is the only warning before Thor's Hammer.",
    cite: 'ffx2-ixion-djose §4.2',
  },
];

export const FFX2_IXION_DJOSE_GUIDE: ChapterGuide = {
  id: 'ffx2-ixion-djose',
  title: 'Ixion',
  bossIds: [...IXION_DJOSE_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
  line: FFX2_IXION_DJOSE_LINE,
};

export default FFX2_IXION_DJOSE_GUIDE;
