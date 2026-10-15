/**
 * Angra Mainyu at the Bikanel excavation camp (FFX-2 Chapter 5; our hidden chapter) [research/ffx2-angra-mainyu.md "§n"].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-angra-mainyu.ts`: every `labels` entry below is a row that tactic asks for (Darkness; Protect, Esuna, the heals, the revives and the drinks),
 * so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB and dresspheres; Angra Mainyu and his arms exist only in FFX-2.
 *
 * Sourced facts only, and **every one is a written source read through a summary** (the weakest sourcing of any chapter, research §0.2): his two arms and their immunities (Tawrich magic, Zarich physical
 * blows, §2.2, §2.3, `[search: 3 sources]`); Darkness reaching all three (§4.4); Perdition's Flame, ten hits on random girls of 3/16 of their maximum HP, only while both arms stand (§3.1, §4.1); Full-Life
 * on a fallen arm while he has the MP (§3.1); Bloody Breath's four statuses and Glimmer of Despair (§3.2, §3.3). The Flame being physical (Protect halves it) is `[single source]`, and the line's numbers
 * (its order and thresholds) are the bench's, never the game's. **Not promised:** the arms' own odds and the Flame's clock (§4.1, §4.2: estimates), so no line names a turn count.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule, GuideWatch } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's boss (`src/data/angra-mainyu-ids.ts`): the body; the arms are its parts and never decide the battle. */
export const ANGRA_MAINYU_GUIDE_IDS = ['x2-angra-mainyu'] as const;

const RULES: GuideRule[] = [
  {
    text: "Darkness reaches all three at once and passes both arms' guards: Tawrich shrugs off magic and Zarich shrugs off blows, but neither stops Darkness. Two Dark Knights on Darkness is the whole plan.",
    short: 'Darkness reaches all three',
    cite: 'ffx2-angra-mainyu §4.4, §2.2, §2.3',
  },
  {
    text: "Perdition's Flame comes only while both arms stand: ten hits on random girls, each a share of her maximum HP. Keep an arm down and it cannot come.",
    short: 'Keep an arm down: no Flame',
    cite: 'ffx2-angra-mainyu §3.1, §4.1',
  },
  {
    text: 'He raises a fallen arm with Full-Life while he has the MP, so the arms come back again and again. Every revive is a turn he does not attack; cut the arm down again.',
    short: 'Fallen arms come back: cut them again',
    cite: 'ffx2-angra-mainyu §3.1, §4.1',
  },
  {
    text: "Protect halves each of the Flame's hits, and more HP does not soften it: it takes a share of her maximum. Keep Protect on everyone while both arms stand.",
    short: 'Protect halves every Flame hit',
    cite: 'ffx2-angra-mainyu §3.1',
  },
  {
    text: "Tawrich's Bloody Breath brings Confusion, Silence, Darkness and Poison, and Zarich's Glimmer of Despair drains MP and lowers stats. Clear the statuses fast.",
    short: 'Clear Bloody Breath fast',
    cite: 'ffx2-angra-mainyu §3.2, §3.3',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: "Darkness hits the body and both arms, and passes the arms' guards", cite: 'ffx2-angra-mainyu §4.4' },
  { when: { labels: ['Protect'] }, text: "Protect for the party: it halves each of Perdition's Flame's hits", cite: 'ffx2-angra-mainyu §3.1' },
  { when: { labels: ['Esuna', 'Remedy'] }, text: 'Clear what Bloody Breath left on {target}: a confused or blinded Dark Knight is a lost turn', cite: 'ffx2-angra-mainyu §3.2' },
  { when: { labels: ['Mega Phoenix', 'Phoenix Down', 'Life'] }, text: 'Stand {target} back up before the Flame comes again', cite: 'ffx2-angra-mainyu §3.1' },
  { when: { labels: ['Megalixir', 'Mega-Potion'] }, text: 'Two girls are low: top up everyone at once', cite: 'ffx2-angra-mainyu §3.1, §3.3' },
  { when: { labels: ['X-Potion', 'Hi-Potion'] }, text: 'Darkness costs the Dark Knight her own HP: drink before it runs out', cite: 'ffx2-angra-mainyu §5' },
  { when: { labels: ['Turbo Ether', 'Elixir'] }, text: 'Yuna needs MP for Protect, Esuna and Curaga, and Glimmer of Despair drains it', cite: 'ffx2-angra-mainyu §3.3' },
  { when: { labels: ['Curaga', 'Cura'] }, text: 'Top {target} up: the Flame takes a share of her maximum HP, so she wants all of it', cite: 'ffx2-angra-mainyu §3.1' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx2-angra-mainyu §5' },
];

const WATCH: GuideWatch[] = [
  {
    name: "Perdition's Flame",
    payload: 'Ten hits on random girls, each a share of her maximum HP; the more hits one girl takes, the harder each lands',
    advice: 'Protect on everyone and HP high now; next time, keep an arm down so it cannot come',
    cite: 'ffx2-angra-mainyu §3.1, §4.1; ffx2-combat-core §1.7',
  },
];

const PHASES: GuidePhase[] = [
  {
    label: 'ANGRA MAINYU',
    note: 'The body is the boss: the battle ends when it falls, whatever the arms are doing.',
    cite: 'ffx2-angra-mainyu §4.3',
  },
];

export const FFX2_ANGRA_MAINYU_GUIDE: ChapterGuide = {
  id: 'ffx2-angra-mainyu',
  title: 'Angra Mainyu',
  bossIds: [...ANGRA_MAINYU_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: WATCH,
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_ANGRA_MAINYU_GUIDE;
