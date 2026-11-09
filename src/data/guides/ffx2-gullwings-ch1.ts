/**
 * Gullwings, Chapter 1 (Boris at the Floating Ruins, the Flame Dragon in Besaid's cave, the Guardian Beast in the Zanarkand Ruins, YSLS-Zero at Kilika's approach; our hidden chapter)
 * [research/re-ffx2-gullwings-chapter1.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-gullwings-ch1.ts`, which plays the chapter bench's advisor line (`tests/unit/helpers/gullwingsCh1Drive.ts`): every `labels` entry below is a row that tactic asks for,
 * so each hint explains the command the player is told to press. **Registered because the tactic is** (`tests/unit/strategy-guide.test.ts`: every boss id a tactic registers has a card).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres and the game's own four scripts. Sourced facts only (the rows and scripts, `research/re-ffx2-gullwings-chapter1.md` §0, §3 and §4): Boris's three claws, his one
 * Sticky End (all three girls, Stop at 40 percent) and the claws and bites after it; the Flame Dragon's opening breath (Fire, all three) and its blows at the girl with the most HP, weak to Ice and half Fire; the Guardian Beast's beat
 * (three blows, then a Curse that stops a girl changing dress, then under a third of its HP Damocles Photon, half of each girl's maximum HP, which Shell halves); YSLS-Zero's Haymaker (two hits) and Blast Punch (half of one girl's
 * maximum HP, which neither Protect nor Shell reduces). **What the card advises is what the bench measured** (`tests/unit/chapters/gullwings-ch1-bench.test.ts`): a Black Mage and a White Mage against the Beast, the three starting
 * dresspheres against YSLS-Zero. **Not promised:** the party's level (no source gives one: the chapter's party is an estimate).
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's four fighters (`src/data/ffx2/enemies/gullwings-ch1.ts`), in play order. */
export const GULLWINGS_CH1_GUIDE_IDS = ['x2-boris', 'x2-flame-dragon', 'x2-guardian-beast', 'x2-ysls-zero'] as const;
const [BORIS, DRAGON, BEAST, YSLS] = GULLWINGS_CH1_GUIDE_IDS;

const RULES: GuideRule[] = [
  {
    text: 'Boris claws three times, then spits one web over all three of you, once: it may Stop a girl, and a Remedy frees her. After that it is claws, and a bite one turn in four. Fire and Ice both hurt him.',
    short: 'Boris: one web, then claws. Remedy frees Stop',
    cite: 'ffx2-gullwings-chapter1 §3.1',
  },
  {
    text: 'The Flame Dragon breathes Fire on all three of you first, then hits whoever has the most HP. Ice is its weakness and Fire hardly hurts it.',
    short: 'Dragon: a breath, then the healthiest girl. Ice',
    cite: 'ffx2-gullwings-chapter1 §3.2',
  },
  {
    text: 'The Guardian Beast hits three times, then curses a girl, and a cursed girl cannot change dress, so change first (Holy Water lifts a Curse). Under a third of its HP it looses Damocles Photon instead: half of each girl’s maximum HP, which Shell halves.',
    short: 'Beast: change first, heal; Photon under a third',
    cite: 'ffx2-gullwings-chapter1 §3.3',
  },
  {
    text: 'YSLS-Zero swings Haymaker, two hits, nearly half the time, and Blast Punch, half of one girl’s maximum HP, one turn in five. Neither Protect nor Shell reduces Blast Punch, so keep everyone healed and keep striking.',
    short: 'YSLS-Zero: Blast Punch is half a girl. Keep healing',
    cite: 'ffx2-gullwings-chapter1 §3.4',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Blizzard'], bossId: DRAGON }, text: 'Blizzard: the Flame Dragon is weak to Ice and takes half from Fire', cite: 'ffx2-gullwings-chapter1 §0' },
  { when: { labels: ['Fire'] }, text: 'Fire: Boris and the Guardian Beast are both weak to it', cite: 'ffx2-gullwings-chapter1 §0' },
  { when: { labels: ['Black Mage'] }, text: 'Change to a Black Mage and cast at {target}: the Change takes the turn, so make it on the first', cite: 'ffx2-gullwings-chapter1 §3.3' },
  { when: { labels: ['White Mage'] }, text: 'Change to a White Mage to heal: the Guardian Beast’s Curse stops a girl changing, so do it before the first', cite: 'ffx2-gullwings-chapter1 §3.3' },
  { when: { labels: ['Pray'] }, text: 'Pray heals all three: Damocles Photon takes half of everyone’s HP at once', cite: 'ffx2-gullwings-chapter1 §3.3' },
  { when: { labels: ['Remedy'] }, text: 'A Remedy frees {target} from Stop; Boris’s web can stop a girl', cite: 'ffx2-gullwings-chapter1 §4' },
  { when: { labels: ['Hi-Potion', 'Potion'] }, text: 'Heal {target} now: under 45 percent is the line, and Blast Punch takes half a girl’s maximum HP', cite: 'ffx2-gullwings-chapter1 §4' },
  { when: { labels: ['Phoenix Down'] }, text: 'Raise {target}', cite: 'ffx2-gullwings-chapter1 §4' },
];

const PHASES: GuidePhase[] = [
  { bossId: BORIS, label: 'BORIS', note: 'Three claws, then one web over all three of you, then claws and the odd bite for ever.', cite: 'ffx2-gullwings-chapter1 §3.1' },
  { bossId: DRAGON, label: 'FLAME DRAGON', note: 'A breath over all three, then its blows go to whoever has the most HP.', cite: 'ffx2-gullwings-chapter1 §3.2' },
  { bossId: BEAST, belowHpFraction: 1 / 3, label: 'GUARDIAN BEAST - UNDER A THIRD', note: 'The Curse of its beat is now Damocles Photon: half of each girl’s maximum HP, Shell halves it.', cite: 'ffx2-gullwings-chapter1 §3.3' },
  { bossId: BEAST, label: 'GUARDIAN BEAST', note: 'Three blows, then a Curse on a girl who has none, and the beat starts again.', cite: 'ffx2-gullwings-chapter1 §3.3' },
  { bossId: YSLS, label: 'YSLS-ZERO', note: 'Haymaker, Blast Punch or a plain blow, on a draw each turn; it cannot move.', cite: 'ffx2-gullwings-chapter1 §3.4' },
];

export const FFX2_GULLWINGS_CH1_GUIDE: ChapterGuide = {
  id: 'ffx2-gullwings-ch1',
  title: 'GULLWINGS, CHAPTER 1',
  bossIds: [...GULLWINGS_CH1_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  linkTitles: { [BORIS]: 'BORIS', [DRAGON]: 'FLAME DRAGON', [BEAST]: 'GUARDIAN BEAST', [YSLS]: 'YSLS-ZERO' },
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_GULLWINGS_CH1_GUIDE;
