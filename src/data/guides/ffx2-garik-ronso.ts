/**
 * Garik Ronso and the Ronso Youths at the top of Mt. Gagazet (FFX-2 Chapter 3, the mission "Battle Blockade"; our hidden chapter) [research/re-ffx2-garik-ronso.md, research/ffx2-vegnagun-shuyin.md, research/ffx2-combat-core.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-garik-ronso.ts`, which plays the chapter bench's advisor line (`tests/unit/helpers/garikRonsoDrive.ts`): every `labels` entry below is a row that tactic asks for, so
 * each hint explains the command the player is told to press. **Registered because the tactic is** (`tests/unit/strategy-guide.test.ts`: every boss id a tactic registers has a card).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres and the game's own two scripts. Sourced facts only: the two fights and what picks them (the saved Ronso-trust score, `re-ffx2-garik-ronso` §1); Garik's turn
 * (Bane Lance on the first of Yuna, Rikku and Paine who wears Black Mage and carries no Curse; Mighty Guard on his seventh turn; otherwise a draw of four, Blind or a plain Attack) and the bout's fixed beat (Protect, three
 * blows, Shell, three blows); the Youth's MP Blowout one turn in eight (§2); the moves' rows (§3); the ailment bytes and the special words (§0). "A cursed girl cannot change dresspheres" is the engine's own rule for Curse
 * (`abilities-core.ts`, the Change row's "Cursed"). Darkness being special damage that ignores Defense and hits every enemy is `ffx2-vegnagun-shuyin` §6.4. **Not promised, so not said:** the Gun Mage's Mighty Guard learning
 * beat (Confuse on Garik; the engine leaves a Confused monster to its script), and which answer to which Ronso raises the trust (the files do not say).
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's five bodies (`src/data/ffx2/enemies/garik-ronso.ts`): the hostile fight's Garik and two Youths, then the bout's Garik and Youth. */
export const GARIK_RONSO_GUIDE_IDS = ['x2-garik-ronso', 'x2-ronso-youth-a', 'x2-ronso-youth-b', 'x2-garik-ronso-bout', 'x2-ronso-youth-bout'] as const;

const RULES: GuideRule[] = [
  {
    text: 'There are two fights. With the Ronso’s trust low you meet Garik and two Ronso Youths, 15,000 HP in all. With it high you meet Garik and one Youth, 10,940 HP, and Garik only guards himself: Protect first, Shell on his fifth turn, blows between.',
    short: 'Low trust: three foes. High trust: a bout of two',
    cite: 're-ffx2-garik-ronso §0',
  },
  {
    text: 'Garik’s lance curses the first of Yuna, Rikku and Paine who is wearing Black Mage and is not cursed already. A cursed girl cannot change dresspheres, so keep out of Black Mage and the lance has nobody to find.',
    short: 'Stay out of Black Mage: the curse keeps the dress on',
    cite: 're-ffx2-garik-ronso §2.1',
  },
  {
    text: 'On his seventh turn, and every seventh after it, Garik casts Mighty Guard on his whole side: Shell, Protect, Regen and Haste, and higher Defense, Magic Defense and Evasion. A Dispel strips the first four; Darkness ignores the rest.',
    short: 'Mighty Guard every seventh turn, on all of them',
    cite: 're-ffx2-garik-ronso §2.1',
  },
  {
    text: 'Between guards he swings three turns in four and blinds a girl one in four, until all three are dark. Every blow of his and of the Youths is physical, so Protect halves it; there is no magic to Shell against.',
    short: 'Blows and Blind: Protect is the wall',
    cite: 're-ffx2-garik-ronso §3',
  },
  {
    text: 'One turn in eight a Youth drinks all of the MP of the girl who has the most, then goes back to swinging. A delay slows a Youth and does nothing to Garik.',
    short: 'MP Blowout; Delay works on a Youth, not on Garik',
    cite: 're-ffx2-garik-ronso §2.3',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness hits every Ronso at once and ignores Defense, so neither their Protect nor the raised Defense of a Mighty Guard turns it aside', cite: 'ffx2-vegnagun-shuyin §6.4' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party: the lance, the Youths’ swings and Garik’s blows are all physical', cite: 're-ffx2-garik-ronso §3' },
  { when: { labels: ['Curaga', 'Cura', 'Hi-Potion'] }, text: 'Top {target} up before the next blow lands', cite: 're-ffx2-garik-ronso §3' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up', cite: 're-ffx2-garik-ronso §3' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 're-ffx2-garik-ronso §3' },
];

const PHASES: GuidePhase[] = [
  {
    label: 'GARIK',
    note: 'Every turn he checks for a Black Mage to curse, then guards his side on the seventh, then blinds or swings. In the bout he only guards himself, Protect first and Shell on the fifth.',
    cite: 're-ffx2-garik-ronso §2',
  },
  {
    label: 'THE YOUTHS',
    note: 'They swing, and one turn in eight a Youth empties the MP of the girl who has the most. The bout has one of them and it only swings.',
    cite: 're-ffx2-garik-ronso §2.3',
  },
];

export const FFX2_GARIK_RONSO_GUIDE: ChapterGuide = {
  id: 'ffx2-garik-ronso',
  title: 'Garik Ronso',
  bossIds: [...GARIK_RONSO_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_GARIK_RONSO_GUIDE;
