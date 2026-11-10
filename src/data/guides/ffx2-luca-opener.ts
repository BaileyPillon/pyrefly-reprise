/**
 * The Luca Opener (Logos and Ormi, then Leblanc, on the docks of Luca; FFX-2 Chapter 1; our hidden chapter) [research/re-ffx2-luca-opener.md; the guide citations below name it `ffx2-luca-opener`, the corpus's own form].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-luca-opener.ts`, which plays the chapter bench's advisor line (`tests/unit/helpers/lucaOpenerDrive.ts`): every `labels` entry below is a row that tactic asks for,
 * so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres and the Syndicate's three plain scripts; the Chateau Leblanc fights (Chapter VI) use other monster rows of the same people and share no number with this page.
 *
 * Sourced facts only: Ormi's cycle of two Attacks and a shield throw at the girl farthest from him, Logos' pistol and his one Potion for Ormi under a fifth of his life, Leblanc's three Attacks and a Thunder on the girl with
 * the most life (the game's own scripts, `research/re-ffx2-luca-opener.md` section 3); the stats and steals of rows 129, 130 and 131 (section 0); Jegged's "Luca" page for the order, the three-against-two, Rikku's steals and
 * Yuna held to the Songstress with one command (section 2). The guide says "the girl who stands farthest from him, Rikku at the start" for the shield (the scene's own start positions, `pos_lchb03_229`: Yuna 49.5, Rikku
 * 56.4, Paine 51.0). **Not modelled, so not promised:** where a girl stands once she has moved; how the game itself holds Yuna to one command (research U3).
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's three fighters (`src/data/ffx2/enemies/luca-opener.ts`). */
export const LUCA_OPENER_GUIDE_IDS = ['x2-luca-logos', 'x2-luca-ormi', 'x2-luca-leblanc'] as const;

const RULES: GuideRule[] = [
  {
    text: 'Take Logos first. He has 86 life and a Defense of 2, he shoots twice a turn at a random girl, and he is the one with a Potion for Ormi. Ormi has a Defense of 60 and almost no Magic Defense, so blades glance off him and 97 life takes a while.',
    short: 'Logos first, then Ormi',
    cite: 'ffx2-luca-opener §0, §3',
  },
  {
    text: 'Ormi swings twice and then throws his shield at the girl standing farthest from him, Rikku at the start. Logos throws his Potion once, when Ormi is under a fifth of his life, and never again.',
    short: 'Ormi: two blows, then the shield at the farthest girl',
    cite: 'ffx2-luca-opener §0, §3',
  },
  {
    text: 'Rikku can steal from all three: an Iron Bangle from Ormi, Silver Glasses from Logos and a Silver Bracer from Leblanc. Steal before you strike while they are still standing.',
    short: 'Rikku steals from all three',
    cite: 'ffx2-luca-opener §0',
  },
  {
    text: 'Leblanc swings three times and then casts Thunder on whoever has the most life. She has 130 life, little Defense and a great deal of Magic Defense, so strike her; spells slide off.',
    short: 'Leblanc: three swings, then Thunder at the healthiest girl',
    cite: 'ffx2-luca-opener §0, §3',
  },
  {
    text: 'Yuna is held to the Songstress for this fight and Darkness Dance is her one command. Leblanc can be blinded, so the Dance makes her swings miss; her Thunder never misses. Between the two fights the party is whole again, and what you spent stays spent.',
    short: 'Yuna sings Darkness Dance; her swings miss, her Thunder does not',
    cite: 'ffx2-luca-opener §2',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Steal'] }, text: 'Rikku steals first: all three of them carry something worth taking', cite: 'ffx2-luca-opener §0' },
  { when: { labels: ['Darkness Dance'] }, text: 'Darkness Dance blinds Leblanc: her plain swings miss from now on, though Thunder does not', cite: 'ffx2-luca-opener §0' },
  { when: { labels: ['Potion'] }, text: 'Top {target} up: the Syndicate hits lightly but it adds up', cite: 'ffx2-luca-opener §4' },
  { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} back up', cite: 'ffx2-luca-opener §4' },
];

const PHASES: GuidePhase[] = [
  {
    label: 'LOGOS AND ORMI',
    note: 'The banner names each move as it starts: two swings and a shield from Ormi, two shots from Logos, and one Potion if Ormi is nearly gone.',
    cite: 'ffx2-luca-opener §3',
  },
  {
    label: 'LEBLANC',
    note: 'Three swings and a Thunder, over and over. Yuna sings, Rikku steals, Paine strikes.',
    cite: 'ffx2-luca-opener §3',
  },
];

export const FFX2_LUCA_OPENER_GUIDE: ChapterGuide = {
  id: 'ffx2-luca-opener',
  title: 'The Luca Opener',
  bossIds: [...LUCA_OPENER_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_LUCA_OPENER_GUIDE;
