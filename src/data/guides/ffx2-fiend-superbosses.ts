/**
 * The Fiend Arena Superbosses: Almighty Shinra, then the Major Numerus (FFX-2, the arena's two top fights; our hidden chapter) [research/re-ffx2-fiend-arena-superbosses.md, research/ffx2-vegnagun-shuyin.md, research/ffx2-combat-core.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-fiend-superbosses.ts`, which plays the Lv 99 line the chapter's bench measures: every `labels` entry below is a row that tactic asks for, so each hint explains the
 * command the player is told to press. **Registered because the tactic is** (`tests/unit/strategy-guide.test.ts`: every boss id a tactic registers has a card).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres and the game's own five scripts. Sourced facts only: the two acts and the death rule (`re-ffx2-fiend-arena-superbosses` section 0 and 2); Shinra's six-beat loop and
 * its quarter and half tests (section 3.1); the heads' loops and their Commands (sections 3.2 to 3.5); the moves' rows (section 4); Darkness being special damage that ignores Defense and hits every enemy
 * (`ffx2-vegnagun-shuyin` section 6.4). **Measured on the engine in stage 1 of the lane, so said:** a Command puts a Lv 99 girl down and Protect and Shell do not change it. **Not promised, so not said:** a defence against a
 * Command (the party as built carries no Invincible, no Thunder-proofing and no Mix row), the cups the arena runs these fights in (not in the files), and what the heads drop (the loot items are not in our tables).
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's five fighting bodies (`src/data/ffx2/enemies/fiend-superbosses.ts`): Almighty Shinra, then the four heads. The body, pod and tail are hidden parts that are never aimed at. */
export const FIEND_SUPERBOSSES_GUIDE_IDS = ['x2-almighty-shinra', 'x2-numerus-unum', 'x2-numerus-duo', 'x2-numerus-tria', 'x2-numerus-quattour'] as const;

const RULES: GuideRule[] = [
  {
    text: 'Two fights, and the arena mends the party between them: Almighty Shinra with 275,000 HP, then the Major Numerus, four heads on one body. The fight ends when the last head falls.',
    short: 'Shinra, then four heads: the last head ends it',
    cite: 're-ffx2-fiend-arena-superbosses §0',
  },
  {
    text: 'Shinra’s Defense and Magic Defense are 255 and he regains life on his own. Darkness ignores Defense and hits every enemy at once, so keep it going.',
    short: 'Darkness ignores his 255 Defense; he regains life',
    cite: 'ffx2-vegnagun-shuyin §6.4',
  },
  {
    text: 'Each of the four heads has a Command that takes four and a half seconds to charge and puts a Lv 99 girl down. Protect and Shell do not change a Command, and nothing in this party’s kit stops one.',
    short: 'A Command downs a girl; Protect, Shell do not help',
    cite: 're-ffx2-fiend-arena-superbosses §4',
  },
  {
    text: 'Between them the heads reach a Command about every four seconds, so one is nearly always charging. Protect still halves their blows and Shell their spells; a Light Curtain and a Lunar Curtain lay both on the party.',
    short: 'A Command is always charging; curtains for the rest',
    cite: 're-ffx2-fiend-arena-superbosses §3',
  },
  {
    text: 'Duo flips a coin for each of its spells, and one outcome is Break, which turns a girl to stone. A Remedy cures it; a girl who stays stone is out of the fight.',
    short: 'Duo’s Break turns a girl to stone: Remedy cures it',
    cite: 're-ffx2-fiend-arena-superbosses §3.3',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness hits every enemy at once and ignores Defense, so neither Shinra’s 255 nor the heads’ Shell and Protect turn it aside', cite: 'ffx2-vegnagun-shuyin §6.4' },
  { when: { labels: ['Light Curtain'] }, text: 'Light Curtain lays Protect on the party: it halves Shinra’s blows, Clione and Final Impact, and the heads’ Sparklers and Fireworks, but not a Command', cite: 're-ffx2-fiend-arena-superbosses §4' },
  { when: { labels: ['Lunar Curtain'] }, text: 'Lunar Curtain lays Shell on the party: it halves Ultima, Black Sky, Holy, Meteor and the -aga spells, but not a Command', cite: 're-ffx2-fiend-arena-superbosses §4' },
  { when: { labels: ['Megalixir'] }, text: 'A Megalixir mends the whole party: use it when the lowest girl is under half', cite: 're-ffx2-fiend-arena-superbosses §5' },
  { when: { labels: ['Remedy'] }, text: 'A Remedy cures {target} of the stone Duo’s Break laid on her', cite: 're-ffx2-fiend-arena-superbosses §3.3' },
  { when: { labels: ['Phoenix Down', 'Stash'] }, text: 'Stand {target} back up before the next blow lands', cite: 're-ffx2-fiend-arena-superbosses §5' },
];

const PHASES: GuidePhase[] = [
  {
    bossId: 'x2-almighty-shinra',
    label: 'SHINRA',
    note: 'Six beats and round again. Under half his life the break becomes Fireworks; under a quarter Ultima becomes Final Impact, fourteen blows of an eighth of everyone’s life and magic.',
    cite: 're-ffx2-fiend-arena-superbosses §3.1',
  },
  {
    bossId: 'x2-numerus-unum',
    label: 'THE HEADS',
    note: 'All four act at once, each on its own loop: Unum seven beats, Duo nine, Tria six and Quattour nine. Unum keeps Shell and Protect on all four and strips them from a girl with Dispel.',
    cite: 're-ffx2-fiend-arena-superbosses §3.2',
  },
];

export const FFX2_FIEND_SUPERBOSSES_GUIDE: ChapterGuide = {
  id: 'ffx2-fiend-superbosses',
  title: 'The Fiend Arena Superbosses',
  bossIds: [...FIEND_SUPERBOSSES_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_FIEND_SUPERBOSSES_GUIDE;
