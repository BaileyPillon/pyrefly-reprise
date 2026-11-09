/**
 * Ifrit at Kilika Temple (FFX-2 Chapter 3, the mission "Pest Control"; our hidden chapter) [research/ffx2-fallen-aeons.md §7.1, research/re-ffx2-ifrit-kilika.md].
 *
 * Written against the tactic in `src/engine/tactics/ffx2-ifrit-kilika.ts`, which plays the chapter bench's advisor line (`tests/unit/helpers/ifritKilikaDrive.ts`): every `labels` entry below is a row that tactic asks
 * for, so each hint explains the command the player is told to press.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the fallen aeons' action counter; the FFX Ifrit (Yuna's aeon, Belgemine's, the Dark Ifrit) shares a name and nothing else.
 *
 * Sourced facts only: the Attack, Firaga (magic, Fire, the whole party), Meteor Strike (magic, the character furthest away) and Hellfire (magic, Fire, all) (§7.1, `[verified: 2 sources]`, and the game's own script and move rows,
 * `research/re-ffx2-ifrit-kilika.md`); the hidden count that every action of his raises by seven and every blow he takes by five, a Meteor Strike on crossing 30, 60 and 90 and Hellfire at 100 (§7.1, **and the game's own
 * script**, which also says that neither Meteor Strike nor Hellfire raises the count); Strength 82, Defense 98, Magic 22, Magic Defense 49 (row 165 of the game's table, the same in §7.1); he absorbs Fire and is weak to Ice,
 * Gravity does nothing, Breaks and Slow land (row 165, §7.1). The guide says "the girl who stands farthest from him, Yuna at the start" for Meteor Strike (the game's own start positions, `pos_klyt11_229`: Yuna 53.00, Rikku and
 * Paine 52.39). **Not modelled, so not promised:** where a girl stands once she has moved.
 *
 * The Wait split's habit line leads the RULES under Wait (`./ffx2-wait-habit.ts`), as for every FFX-2 guide.
 */

import type { ChapterGuide, GuideHint, GuidePhase, GuideRule } from './types.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

/** The chapter's one fighter (`src/data/ffx2/enemies/ifrit.ts`). */
export const IFRIT_KILIKA_GUIDE_IDS = ['x2-ifrit'] as const;

const RULES: GuideRule[] = [
  {
    text: 'Fire heals him. Any Fire spell or Fire attack the girls use mends him instead of hurting him, so keep it out of the plan. Ice is his weakness, and Darkness, which is no element at all, ignores his Defense of 98.',
    short: 'No Fire. Ice hurts, Darkness ignores Defense',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'Most turns he swings, with a Strength of 82, or casts Firaga on the whole party. Put Protect on all three girls and lower his Strength with Power Break.',
    short: 'Protect, and Power Break him',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'He keeps a hidden count. Every action of his raises it by seven and every blow he takes by five. Each time it passes thirty, sixty and ninety he sends a Meteor Strike at the girl who stands farthest from him, Yuna at the start. At a hundred he casts Hellfire on all three, and the count starts over. The Meteors and Hellfire do not raise it themselves.',
    short: 'Meteor at 30, 60 and 90, then Hellfire',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'Firaga, Meteor Strike and Hellfire are all magic, so Shell halves every one of them. Heal the girl he is aiming at after each Meteor, and top everyone up before the Hellfire.',
    short: 'Shell halves all three; heal before Hellfire',
    cite: 'ffx2-fallen-aeons §7.1',
  },
  {
    text: 'Every blow you land brings the next Meteor and Hellfire closer, so the faster you hurt him, the sooner the big ones come. Breaks and Slow both land on him, and Gravity does nothing.',
    short: 'Hitting him fills the count too',
    cite: 'ffx2-fallen-aeons §7.1',
  },
];

const HINTS: GuideHint[] = [
  { when: { labels: ['Darkness'] }, text: 'Darkness ignores his Defense of 98, is no element so he cannot absorb it, and costs HP, not MP', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Protect'] }, text: 'Protect for the party: his plain swing is most of what he does', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Shell'] }, text: 'Shell for the party: Firaga, Meteor Strike and Hellfire are all magic, and Shell halves them', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Power Break'] }, text: 'Power Break lowers his Strength: Breaks land on him', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Armor Break'] }, text: 'Armor Break lowers his Defense of 98, so every swing goes further', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Curaga', 'Cura', 'Hi-Potion'] }, text: 'Top {target} up before the next one lands', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Phoenix Down', 'Life'] }, text: 'Stand {target} back up', cite: 'ffx2-fallen-aeons §7.1' },
  { when: { labels: ['Pray'] }, text: 'Nothing urgent: Pray keeps everyone ticking up', cite: 'ffx2-fallen-aeons §7.1' },
];

const PHASES: GuidePhase[] = [
  {
    label: 'IFRIT',
    note: 'The banner names each move as it starts: a Meteor Strike on the girl furthest back at each of three marks, then Hellfire on all three, and the count begins again.',
    cite: 'ffx2-fallen-aeons §7.1',
  },
];

export const FFX2_IFRIT_KILIKA_GUIDE: ChapterGuide = {
  id: 'ffx2-ifrit-kilika',
  title: 'Ifrit',
  bossIds: [...IFRIT_KILIKA_GUIDE_IDS],
  rules: RULES,
  hints: HINTS,
  watch: [],
  phases: PHASES,
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
};

export default FFX2_IFRIT_KILIKA_GUIDE;
