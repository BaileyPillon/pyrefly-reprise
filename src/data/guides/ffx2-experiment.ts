/**
 * The Experiment (FFX-2 Chapter 5, Djose Temple; our hidden chapter "The Experiment", the mission Masterpiece Theatre) [research/ffx2-experiment.md, research/re-ffx2-experiment.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-experiment.ts`, which plays the line the sources' clears use (two Dark Knights on Darkness, a White Mage with Protect first):
 * every `labels` entry below is a row that tactic asks for, so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. The Machine Faction's weapon, the Special levels, Lifeslicer and the Annihilator are FFX-2 facts; no FFX chapter reads this file.
 *
 * Sourced facts only. The line follows Jegged's Chapter 5 Djose Temple page (research section 9: no complex strategy, well-levelled girls, Dark Knights for the Strength and Defense, Phoenix Downs
 * and Mega-Potions in the bag, Lifeslicer the main danger, a Rocket Launcher can stack its random hits on one girl) and the wiki's clear (Protect up at the start). The full weapon's order,
 * Rocket Launcher, Attack, Rocket Launcher, Attack, Lifeslicer, Annihilator, Attack (research section 4.2, `[verified: 3 sources]`, and the game's own script, `re-ffx2-experiment` section 5.4);
 * Lifeslicer takes the target's maximum HP and neither Protect nor Shell stops it (section 4.1, `[verified: 5 sources]`, and the row); the Annihilator is magic on all three girls, ignores
 * Magic Defense, Shell halves it, and delays each girl (section 4.1); the Breaks and every harmful status do nothing to it (the record, `re-ffx2-experiment` section 2). **Not modelled, so not
 * promised:** the Auto-Life grid Jegged names (no Garment Grid in the data grants it), and learning the Annihilator by being hit (the Gun Mage note is a boxed hint in the guide document, as the Den's
 * Mortar note is, and no rule or hint here depends on it). The panel shows one phase note at a time (the first that matches): the prototype's, then the rebuilt machine's.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 ship brief.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's two bodies (`src/data/ffx2/enemies/experiment.ts` `EXPERIMENT_BODY_IDS`): Act I's prototype, then Act II's full weapon. */
export const EXPERIMENT_GUIDE_IDS = ['x2-experiment-prototype', 'x2-experiment'] as const;

const RULES: GuideRule[] = [
  {
    text: 'Open with Protect on all three girls. Its strikes and its Rocket Launcher are physical, and Protect is the cheapest thing that blunts them.',
    short: 'Protect first',
    cite: 'ffx2-experiment §4.1, §9',
  },
  {
    text: 'Its Defense climbs as it is rebuilt. Darkness ignores Defense, so two Dark Knights on Darkness do the damage while Yuna keeps everyone standing.',
    short: 'Darkness ignores its Defense',
    cite: 'ffx2-experiment §3.2, §9',
  },
  {
    text: 'Rebuilt, it works through one fixed order: volley, strike, volley, strike, Lifeslicer, Annihilator, strike. Heal after each volley, and put Shell up before the Annihilator, which is magic on everyone.',
    short: 'Heal after volleys; Shell before the Annihilator',
    cite: 'ffx2-experiment §4.1, §4.2',
  },
  {
    text: 'Lifeslicer takes one girl down whatever Protect and Shell are up. Keep a Phoenix Down in hand and stand her back up.',
    short: 'Lifeslicer: keep a Phoenix Down ready',
    cite: 'ffx2-experiment §4.1, §9',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness ignores its Defense, and costs HP, not MP', cite: 'ffx2-experiment §3.2, §9' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party: its strikes and its volleys are physical', cite: 'ffx2-experiment §4.1, §9' },
  { when: { labels: ['Shell'] }, text: 'Shell for the party: the Annihilator is magic and hits all three, and Shell halves it', cite: 'ffx2-experiment §4.1' },
  { when: { labels: ['Lunar Curtain'] }, text: 'Shell on {target} from the bag before the Annihilator', cite: 'ffx2-experiment §4.1' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up: Lifeslicer takes everything she has', cite: 'ffx2-experiment §4.1, §9' },
  { when: { labels: ['Mega-Potion'] }, text: 'Two girls are low: a Mega-Potion tops up everyone before the next volley', cite: 'ffx2-experiment §9' },
  { when: { labels: ['Curaga', 'Cura', 'Hi-Potion'] }, text: 'Top {target} up: a volley can put several hits on one girl', cite: 'ffx2-experiment §4.1, §9' },
  { when: { labels: ['Ether'] }, text: 'Yuna needs MP for Protect, Shell and Curaga', cite: 'ffx2-experiment §9' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx2-experiment §9' },
];

const PHASES: GuidePhase[] = [
  {
    bossId: 'x2-experiment-prototype',
    label: 'THE PROTOTYPE',
    note: 'Barely a machine: it only strikes, one girl at a time. Put Protect up and take the easy win.',
    cite: 'ffx2-experiment §3.3, §4.2',
  },
  {
    bossId: 'x2-experiment',
    label: 'REBUILT',
    note: 'After the second volley comes Lifeslicer, then the Annihilator, then one plain strike. The banner names each one as it starts.',
    cite: 'ffx2-experiment §4.2',
  },
];

export const FFX2_EXPERIMENT_GUIDE: ChapterGuide = {
  id: 'ffx2-masterpiece-theatre',
  title: 'THE EXPERIMENT',
  bossIds: [...EXPERIMENT_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_EXPERIMENT_GUIDE;
