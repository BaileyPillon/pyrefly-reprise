/**
 * Angra Mainyu (FFX-2 Chapter 5, the mission "Showdown in the Sands"; our hidden chapter) [research/re-ffx2-angra-mainyu.md, research/ffx2-angra-mainyu.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-angra-mainyu.ts`, which plays the chapter bench's advisor line (`tests/unit/helpers/angraMainyuDrive.ts`): every `labels` entry below is a row that
 * tactic asks for, so each hint explains the command the player is told to press. The guide follows Jegged's Chapter 5 page (the project's standing rule), in our own words.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres and the game's own scripts for the body and its arms.
 *
 * Sourced facts only: Perdition's Flame (ten hits on random girls, each 3/16 of her maximum HP; physical, so Protect halves it, Shell does not), Demi (a quarter of current HP), Flare, Bio (Poison), Osmose (only when the body's
 * MP is under 200), Curaga and Full-Life on the arms, Dispel only when every girl has Reflect (the game's rows and scripts, the RE note §9 and §10, and Jegged); Zarich's Glimmer of Despair (MP and four stats down) and
 * Ga spells, Tawrich's Punch and Bloody Breath (Silence, Darkness, Poison, Confusion) (the rows and the FF Wiki); Zarich immune to physical damage and Tawrich to magical damage (Jegged and the FF Wiki; the game's own
 * automatic statuses, `[inferred]` by the RE note), so Darkness, which is neither, reaches all three. **Not promised:** that the fight ends when the body falls whatever the arms do (the RE note's §12 item 3), the odds the
 * arms' scripts give beyond "a cycle", and where the arms stand.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's three bodies (`src/data/ffx2/enemies/angra-mainyu.ts`), the body first. */
export const ANGRA_MAINYU_GUIDE_IDS = ['x2-angra-mainyu', 'x2-zarich', 'x2-tawrich'] as const;

const RULES: GuideRule[] = [
  {
    text: 'Perdition’s Flame is the move to fear: ten hits, each on a girl it picks at random, each for nearly a fifth of her full health. It is a blow, so Protect halves it. Heal the moment it lands.',
    short: 'Protect, and heal after the Flame',
    cite: 'ffx2-angra-mainyu §8',
  },
  {
    text: 'Zarich, the left arm, shrugs off blows, and Tawrich, the right, shrugs off spells. Darkness is neither, so a Dark Knight’s Darkness reaches all three. Two Dark Knights and one healer is the line.',
    short: 'Darkness reaches all three',
    cite: 'ffx2-angra-mainyu §5',
  },
  {
    text: 'The body spends its turns bringing a fallen arm back and healing them, so downing an arm costs it a turn. The arms hold 5,440 each; the body holds 333,444. Keep your damage going to the body.',
    short: 'The body is the one to beat',
    cite: 'ffx2-angra-mainyu §4',
  },
  {
    text: 'Tawrich’s Bloody Breath poisons, blinds, silences and confuses everyone. A Silenced healer cannot heal, so keep a Remedy handy (a Ribbon guards against all of it). Darkness works through Silence and blindness.',
    short: 'Cure the healer first',
    cite: 'ffx2-angra-mainyu §5',
  },
  {
    text: 'Zarich’s Glimmer of Despair saps everyone’s MP and lowers four stats. Keep Turbo Ethers for the healer. Drain the body’s own MP below 200 and it can only drink yours.',
    short: 'Keep an Ether for the healer',
    cite: 'ffx2-angra-mainyu §4',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness is neither a blow nor a spell, so it reaches Angra Mainyu and both arms, and it costs HP, not MP', cite: 'ffx2-angra-mainyu §5' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party: it halves Perdition’s Flame and Tawrich’s Punch', cite: 'ffx2-angra-mainyu §8' },
  { when: { labels: ['Shell'] }, text: 'Shell for the party: it halves Flare, Demi and Zarich’s spells (not the Flame)', cite: 'ffx2-angra-mainyu §8' },
  { when: { labels: ['Mega-Potion'] }, text: 'Two girls are low: a Mega-Potion tops up everyone before the next Flame', cite: 'ffx2-angra-mainyu §5' },
  { when: { labels: ['Curaga', 'Cura', 'Hi-Potion'] }, text: 'Top {target} up before the next Flame', cite: 'ffx2-angra-mainyu §5' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up: the Flame can drop a girl', cite: 'ffx2-angra-mainyu §3' },
  { when: { labels: ['Turbo Ether'] }, text: 'The healer needs MP for Curaga: Glimmer of Despair saps it', cite: 'ffx2-angra-mainyu §3' },
  { when: { labels: ['Remedy', 'Esuna'] }, text: 'Cure {target}: Bio and Bloody Breath poison, and Breath silences and confuses', cite: 'ffx2-angra-mainyu §3' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx2-angra-mainyu §5' },
];

const PHASES: GuidePhase[] = [
  {
    label: 'ANGRA MAINYU',
    note: 'The banner names each move as it starts. The Flame opens the fight and comes again a few turns later, then every fifteenth turn of the body’s.',
    cite: 'ffx2-angra-mainyu §8',
  },
];

export const FFX2_ANGRA_MAINYU_GUIDE: ChapterGuide = {
  id: 'ffx2-angra-mainyu',
  title: 'Angra Mainyu',
  bossIds: [...ANGRA_MAINYU_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_ANGRA_MAINYU_GUIDE;
