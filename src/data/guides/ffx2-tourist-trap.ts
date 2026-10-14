/**
 * Tourist Trap (the optional FFX-2 mission in the Cavern of the Stolen Fayth; our hidden chapter) [research/ffx-yojimbo.md section 8.2, research/ffx2-fallen-aeons.md section 7.2].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-tourist-trap.ts`, which plays the line the sources' clears use (Protect and a heal for Yuna, two Dark Knights on Darkness): every
 * `labels` entry below is a row that tactic asks for, so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Yojimbo's action counter, Zanmato (the party to 1 HP and 1 MP), Kozuka and the untargetable Daigoro are FFX-2 facts; no FFX chapter reads
 * this file, and none of FFX Chapter IX's guide (a different fight with an Overdrive gauge and a different Zanmato) is reused.
 *
 * Sourced facts only: the wiki's Cavern page, FFExodus's Chapter 3 walkthrough and SinirothX's *Enemy Encyclopedia* (the counter, +8 a turn, Zanmato at 100 or more, `[verified: 2 sources]`;
 * Kozuka's quarter of one girl's MP and its Poison; Daigoro cannot be targeted; the strategy: Poison protection, two hard hitters, a heal for the turn after Zanmato). **Jegged's page for this
 * mission is not in `research/jegged-encounter-guides-ffx2.md`**, so this card follows the wiki's and FFExodus's strategy in our own words, and says so; it is rewritten to Jegged's if his page is read later.
 * The fourteenth turn is the research's own derivation from the counter (`[derived]`, not a quoted sentence of any guide).
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 ship brief.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's boss (`src/data/ffx2/enemies/tourist-trap.ts` `X2_YOJIMBO_ID`); Daigoro is never a target, so the guide has one boss id. */
export const TOURIST_TRAP_GUIDE_IDS = ['x2-yojimbo'] as const;

const RULES: GuideRule[] = [
  {
    text: 'Yojimbo counts his own turns, and his count fills on the fourteenth: Zanmato drops the whole party to 1 HP and 1 MP. The count runs the same way every time, so plan that turn instead of hoping to end the fight first.',
    short: 'Zanmato comes on his 14th turn',
    cite: 'ffx-yojimbo §8.2',
  },
  {
    text: 'After Zanmato nobody has MP to cast with. The next move is a Mega-Potion for the whole party, then a Phoenix Down for anyone he has knocked down.',
    short: 'After Zanmato: Mega-Potion first',
    cite: 'ffx-yojimbo §8.2',
  },
  {
    text: 'Kozuka takes a quarter of one girl’s MP and poisons her. Cure it with Esuna or a Remedy; a Dark Knight who has learned Poisonproof shrugs it off.',
    short: 'Kozuka poisons: cure it',
    cite: 'ffx-yojimbo §8.2',
  },
  {
    text: 'Daigoro cannot be targeted, so spend no turn on him. His bite arrives as one of Yojimbo’s own moves.',
    short: 'Daigoro cannot be targeted',
    cite: 'ffx-yojimbo §8.2',
  },
  {
    text: 'Two Dark Knights on Darkness do the damage while Yuna keeps Protect up against his blades. The sources’ clears put two hard hitters on him and a healer behind them.',
    short: 'Two Dark Knights on Darkness, Yuna heals',
    cite: 'ffx-yojimbo §8.2',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness ignores his Defense of 50, and costs HP, not MP', cite: 'ffx-yojimbo §8.2' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party: his blades are physical and Protect halves them', cite: 'ffx-yojimbo §8.2' },
  { when: { labels: ['Esuna', 'Remedy'] }, text: 'Cure {target}: Kozuka’s Poison ticks until it is cured', cite: 'ffx-yojimbo §8.2' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up before the next blow', cite: 'ffx-yojimbo §8.2' },
  { when: { labels: ['Mega-Potion'] }, text: 'Two girls are low: a Mega-Potion tops up everyone, and it needs no MP', cite: 'ffx-yojimbo §8.2' },
  { when: { labels: ['Curaga', 'Cura', 'Hi-Potion'] }, text: 'Top {target} up before the next blow', cite: 'ffx-yojimbo §8.2' },
  { when: { labels: ['Ether'] }, text: 'Yuna needs MP for Protect and her cures; Kozuka drains it', cite: 'ffx-yojimbo §8.2' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx-yojimbo §8.2' },
];

const PHASES: GuidePhase[] = [
  {
    bossId: 'x2-yojimbo',
    label: 'THE COUNT',
    note: 'He cuts, bites and poisons in rising rhythm; when the count is full, Zanmato comes. The banner names the move as it starts.',
    cite: 'ffx-yojimbo §8.2',
  },
];

export const FFX2_TOURIST_TRAP_GUIDE: ChapterGuide = {
  id: 'ffx2-tourist-trap',
  title: 'TOURIST TRAP',
  bossIds: [...TOURIST_TRAP_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_TOURIST_TRAP_GUIDE;
