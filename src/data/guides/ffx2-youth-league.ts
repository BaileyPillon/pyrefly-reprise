/**
 * The Youth League Tournament (Yaibal, four mobs, Elma and Lucil on Mushroom Rock Road, seven fights in a row; our hidden chapter) [research/re-ffx2-youth-league-tournament.md, research/ffx2-gippal-den-of-woe.md, research/ffx2-combat-core.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-youth-league.ts`, which plays the chapter bench's `darkness` line (`tests/unit/helpers/youthLeagueDrive.ts`): every `labels` entry below is a row that tactic asks for,
 * so each hint explains the command the player is told to press. **Registered because the tactic is** (`tests/unit/strategy-guide.test.ts`: every boss id a tactic registers has a card). The cites name the research notes
 * in the corpus's own form (`ffx2-youth-league-tournament §5.1` is `research/re-ffx2-youth-league-tournament.md` section 5.1).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres and the game's own scripts. Sourced facts only: Yaibal's care for Yuna (a Phoenix Down on her when she is down two turns in three, a Hi-Potion below a
 * quarter, a grenade on a quarter of the other turns), Lucil's fifth-action Harbinger with its Doom, Elma's guard on her whole line and her hunt for the girl with no Reflect, the Veteran's heavy blow on the lowest HP and the
 * Warrior's potion for a friend (`research/re-ffx2-youth-league-tournament.md` §5). **Doom is not cured by anything in the data**: the sources' blanket cures all leave it (`research/ffx2-combat-core.md` §2.8), and the engine
 * measured the KO at 10.5 seconds after it lands, whoever she is (`tests/unit/chapters/youth-league-engine.test.ts`), so the card says "finish her or raise the girl" and promises no cure. **The League's grenades and
 * Confuse cannot take hold at the Chapter V party's level** (the landing rule, `research/re-ffx2-hit-status.md` §4.1; measured in the same test): the card says what they do (about fifty a girl) and not "blind".
 * **Not promised:** how the real game limits the party to the bracket's seven bouts, and the League's look.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The twenty fighters of the seven acts (`src/data/youth-league-ids.ts`#ACT_ENEMY_IDS; a test pins the equality), Yaibal first. */
export const YOUTH_LEAGUE_GUIDE_IDS = [
  'x2-yl-yaibal', 'x2-yl-warrior-1a', 'x2-yl-warrior-1b',
  'x2-yl-mage-2a', 'x2-yl-mage-2b', 'x2-yl-veteran-2',
  'x2-yl-warrior-3', 'x2-yl-veteran-3a', 'x2-yl-veteran-3b',
  'x2-yl-slasher-4a', 'x2-yl-slasher-4b', 'x2-yl-master-4',
  'x2-yl-veteran-5a', 'x2-yl-veteran-5b', 'x2-yl-veteran-5c', 'x2-yl-veteran-5d',
  'x2-yl-elma', 'x2-yl-veteran-6a', 'x2-yl-veteran-6b',
  'x2-yl-lucil',
] as const;
const YAIBAL = YOUTH_LEAGUE_GUIDE_IDS[0];
const ELMA = 'x2-yl-elma';
const LUCIL = 'x2-yl-lucil';

const RULES: GuideRule[] = [
  {
    text: 'Seven fights in a row and nothing mends you between them: HP, MP and the bag carry on. Lose from the second fight on and you start that fight again, as you entered it.',
    short: 'Nothing mends you between the bouts',
    cite: 'ffx2-youth-league-tournament §8',
  },
  {
    text: 'Darkness hits every enemy at once and ignores Defense. Rikku and Paine cast it, Yuna heals and raises: the same line that clears the Den of Woe.',
    short: 'Darkness on the whole line, Yuna heals',
    cite: 'ffx2-gippal-den-of-woe §5',
  },
  {
    text: 'Yaibal looks after Yuna and nobody else: a Phoenix Down when she is down, a Hi-Potion when she is low. A quarter of his other turns is a grenade at all three.',
    short: 'Yaibal mends Yuna, no one else',
    cite: 'ffx2-youth-league-tournament §5.1',
  },
  {
    text: 'Elma guards her whole line first, then picks the girl with no Reflect. If all three of you reflect she can only Dispel or swing.',
    short: 'Elma guards her line, hunts the girl without Reflect',
    cite: 'ffx2-youth-league-tournament §5.3',
  },
  {
    text: 'Every fifth action of Lucil is Harbinger: a blow and Doom on a girl who has none. Nothing cures Doom; it kills in 10.5 seconds. Finish her first, or raise the girl.',
    short: 'Lucil: every fifth blow is Doom; raise or finish her',
    cite: 'ffx2-youth-league-tournament §5.2',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness hits every enemy at once and ignores Defense, so one cast works on the whole line', cite: 'ffx2-gippal-den-of-woe §5' },
  { when: { labels: ['Phoenix Down', 'Mega Phoenix', 'Life'], bossId: LUCIL }, text: 'Raise her: Lucil’s Doom kills in 10.5 seconds and nothing cures it, so the raise is the answer', cite: 'ffx2-youth-league-tournament §5.2' },
  { when: { labels: ['Phoenix Down', 'Mega Phoenix', 'Life'] }, text: 'Raise her: nothing mends the party between the bouts, and a fallen girl stays fallen into the next one', cite: 'ffx2-youth-league-tournament §8' },
  { when: { labels: ['Mega-Potion', 'Curaga', 'X-Potion', 'Cura'] }, text: 'Heal now: nothing mends the party between the bouts, so what you leave a fight with is what the next one meets', cite: 'ffx2-youth-league-tournament §8' },
  { when: { labels: ['Pray'] }, text: 'Nobody needs mending: Pray keeps the White Mage busy until the next blow', cite: 'ffx2-combat-core §3.5' },
  { when: { kinds: ['attack'], targetId: LUCIL }, text: 'Attack {target}: finishing her ends the Doom she has put on a girl, and the tournament', cite: 'ffx2-youth-league-tournament §5.2' },
  { when: { kinds: ['attack'], targetId: ELMA }, text: 'Attack {target}: her guard puts Shell and Protect on her line, so a plain blow lands softly', cite: 'ffx2-youth-league-tournament §5.3' },
  { when: { kinds: ['attack'] }, text: 'Attack {target}: a Dark Knight low on HP stops paying for Darkness and swings at the weakest of them', cite: 'ffx2-gippal-den-of-woe §5' },
];

const PHASES: GuidePhase[] = [
  {
    bossId: YAIBAL,
    label: 'YAIBAL',
    note: 'A sword and two recruits. If Yuna falls he raises her; if she is low he patches her; the rest of his turns are a swing or the grenade, about five hundred a girl.',
    cite: 'ffx2-youth-league-tournament §5.1',
  },
  {
    bossId: ELMA,
    label: 'ELMA',
    note: 'Her first act is a guard over her whole line. Then she goes for whoever has no Reflect: a fire, ice, thunder or water spell, a grenade, Sleep or Osmose on the girl with the most MP.',
    cite: 'ffx2-youth-league-tournament §5.3',
  },
  {
    bossId: LUCIL,
    label: 'LUCIL',
    note: 'She counts to five. Between the beats she wraps herself in Curtains, throws each Gem once (six hits of about a hundred) and one Gold Hourglass, and drinks two Hi-Potions at most.',
    cite: 'ffx2-youth-league-tournament §5.2',
  },
];

export const FFX2_YOUTH_LEAGUE_GUIDE: ChapterGuide = {
  id: 'ffx2-youth-league',
  title: 'The Youth League Tournament',
  bossIds: [...YOUTH_LEAGUE_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  linkTitles: { [YAIBAL]: 'YAIBAL', [ELMA]: 'ELMA', [LUCIL]: 'LUCIL' },
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_YOUTH_LEAGUE_GUIDE;
