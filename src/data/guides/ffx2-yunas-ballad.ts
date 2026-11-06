/**
 * Yuna's Ballad (the possessed Rikku, then the possessed Paine, fought by Yuna alone; our hidden chapter) [research/re-ffx2-yunas-ballad.md, research/ffx2-gippal-den-of-woe.md, research/ffx2-combat-core.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-yunas-ballad.ts`, which plays the chapter bench's Warrior line (`tests/unit/helpers/yunasBalladDrive.ts`): every `labels` entry below is a row that tactic asks for,
 * so each hint explains the command the player is told to press. **Registered because the tactic is** (`tests/unit/strategy-guide.test.ts`: every boss id a tactic registers has a card).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres and the game's own two scripts. Sourced facts only: Rikku's draw (Spider Attack four turns in ten, Grenade two, one each of Bomb Core, Arctic Wind, Lightning Marble
 * and Dragon Scale; the throws a flat 281 to 317 that neither Shell nor Protect changes, the Grenade and Spider Attack blows that Protect halves) and Paine's one stroke at the girl with the most HP, Defense 70 and Magic Defense 7,
 * and the ailments that land (Sleep, Slow, Darkness, Berserk) and the ones that do not (the row bytes, `research/re-ffx2-yunas-ballad.md` §4 and §6). **Confuse is left out of the player's list on purpose:** the byte reads 0, so it lands,
 * but the engine leaves a Confused monster to its script (pick YB9, a KNOWN GAP in `yunas-ballad-engine.test.ts`), so it changes nothing here and is not offered as an answer. "A White Mage has no attack" is
 * `research/ffx2-combat-core.md` §3.5 (the commands Pray, Vigor, White Magic, Item), which the engine's own menu agrees with (`yunas-ballad-engine.test.ts`). The cadence lines (Rikku about every six seconds, Paine every seven
 * or eight) are the engine's measured pace with Yuna defending, pinned in `yunas-ballad-engine.test.ts`; the note's recovery steps leave out the animation. **The citations name the wiki-level Den of Woe note
 * (`research/ffx2-gippal-den-of-woe.md`), which holds the same duels in the corpus's own citation form; where its figures differ from the rows (its draw of nine against the script's ten) the rows are the numbers printed.**
 * **Not promised:** how the real game limits the party to Yuna, and the possessed girls' look.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's two fighters (`src/data/ffx2/enemies/yunas-ballad.ts`), Rikku first. */
export const YUNAS_BALLAD_GUIDE_IDS = ['x2-possessed-rikku', 'x2-possessed-paine'] as const;
const PAINE = YUNAS_BALLAD_GUIDE_IDS[1];

const RULES: GuideRule[] = [
  {
    text: 'You are alone, and nothing heals between the two duels: whatever HP and MP you leave Rikku with is what Paine meets. Drink a potion when you are under half.',
    short: 'Heal under half; nothing mends between the duels',
    cite: 'ffx2-gippal-den-of-woe §2',
  },
  {
    text: 'Yuna starts as a White Mage, who has no attack at all. Change to a Warrior on the first turn (a Gunner works too), then Attack.',
    short: 'Change out of White Mage first',
    cite: 'ffx2-combat-core §3.5',
  },
  {
    text: 'Rikku throws what she carries. Bomb Core, Arctic Wind, Lightning Marble and Dragon Scale always land for the same size, whatever Shell and Protect do. Her Spider Attack and her Grenade are blows, so Protect halves those.',
    short: 'Her throws are one size; Protect halves only her blows',
    cite: 'ffx2-gippal-den-of-woe §4.4',
  },
  {
    text: 'Paine has one move: a sword stroke at whoever has the most HP, with a long breath between. Her Defense is 70, but her Magic Defense is only 7.',
    short: 'One slow stroke; her armour is thick, her magic defence thin',
    cite: 'ffx2-gippal-den-of-woe §4.4',
  },
  {
    text: 'Both can be put to Sleep, slowed, blinded or enraged. Neither can be Stopped, Silenced or poisoned.',
    short: 'Sleep, Slow, Darkness and Berserk all land',
    cite: 'ffx2-gippal-den-of-woe §3.2',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Warrior', 'Gunner'] }, text: 'Change to a fighting dressphere: the White Mage has no attack of her own, and the Change takes the turn', cite: 'ffx2-combat-core §3.5' },
  { when: { labels: ['X-Potion', 'Hi-Potion', 'Potion'], targetId: 'yuna' }, text: 'Drink one now: nothing heals between the duels, and under half is the line to hold', cite: 'ffx2-gippal-den-of-woe §2' },
  { when: { labels: ['Cura', 'Pray'] }, text: 'A White Mage can heal but cannot attack: Change to a Warrior to deal damage', cite: 'ffx2-combat-core §3.5' },
  { when: { kinds: ['attack'], targetId: PAINE }, text: 'Attack {target}: her Defense is 70, but a Warrior’s blade is still the most damage Yuna has', cite: 'ffx2-gippal-den-of-woe §4.4' },
  { when: { kinds: ['attack'] }, text: 'Attack {target}: her throws are the same size every time, so the fight is won by keeping up with them', cite: 'ffx2-gippal-den-of-woe §4.4' },
];

const PHASES: GuidePhase[] = [
  {
    label: 'RIKKU',
    note: 'Every turn she picks a girl, then rolls: Spider Attack four in ten, the Grenade two in ten, and one in ten each for a throw of fire, ice, lightning and water. She acts about every six seconds.',
    cite: 'ffx2-gippal-den-of-woe §4.4',
  },
  {
    label: 'PAINE',
    note: 'She strikes the girl with the most HP every seven or eight seconds, and nothing else. There is time to heal and time to hit.',
    cite: 'ffx2-gippal-den-of-woe §4.4',
  },
];

export const FFX2_YUNAS_BALLAD_GUIDE: ChapterGuide = {
  id: 'ffx2-yunas-ballad',
  title: 'Yuna’s Ballad',
  bossIds: [...YUNAS_BALLAD_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_YUNAS_BALLAD_GUIDE;
