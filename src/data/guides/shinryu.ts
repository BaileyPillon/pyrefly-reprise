/**
 * The hidden Shinryu chapter (the Monster Arena's deep-water dragon; hidden FFX chapter 48, the typed word `shinryu`)
 * [research/re-ffx-shinryu.md "RE section n" (the monster record, the moves, the script read from the game's own files and run on its bytecode), research/ffx-combat-core.md sections 2.8, 4.2 and 7.1
 * (healing, the status table, Quick Hit)]. Every cite below names one of them in the corpus's own form: the digest first, then the game's file.
 *
 * **The strategy this card teaches is the public guide's one**, in our own words: Jegged's Shinryu page (`jegged.com`, Final Fantasy X, Monster Arena) asks for properly levelled characters with their strongest weapons, says Shinryu
 * "will counterattack regular attacks" and uses an Eraser that "will ignore any Ribbon and Stoneproof auto-abilities", and concludes that the only way round it is to defeat Shinryu quickly. The rest is the script
 * (`research/re-ffx-shinryu.md` section 2: the three moves, the counter to every wound, and no Eraser once one swimmer is left) and the fight's arithmetic (21 blows of 99,999). The card is written from the bench of
 * `docs/handoff/ch-shinryu.md` section 5, which plays this line on the real engine: each rule below is a rule the line obeys.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Shinryu is a creature of the FFX Monster Arena; FFX-2 has nothing like it and nothing here applies to it.
 *
 * **No number here is invented**: the figures are the note's (99,999 and the 21 blows it takes).
 */

import type { ChapterGuide } from './types.ts';

/** The combatant id (`src/data/ffx/shinryu-ids.ts`), written out here: a guide data module imports no tactic. */
export const SHINRYU_GUIDE_IDS = ['shinryu'] as const;
const DRAGON = SHINRYU_GUIDE_IDS[0];

export const SHINRYU_GUIDE: ChapterGuide = {
  id: 'shinryu',
  title: 'Shinryu',
  bossIds: [...SHINRYU_GUIDE_IDS],

  rules: [
    {
      text: 'Strike with your strongest weapons and end it fast. Twenty-one blows of 99,999 take it down, and every turn it gets is one more chance at the Eraser.',
      short: 'Hit hard and fast',
      cite: 'ffx-combat-core §7.1; re-ffx-shinryu §0, §4',
    },
    {
      text: 'The Eraser turns one of you to stone, and in this water stone shatters: that swimmer is gone for good. Ribbon and Stoneproof do not stop it, so the answer is to win before it points.',
      short: 'Nothing stops the Eraser',
      cite: 'ffx-combat-core §4.2; re-ffx-shinryu §0, §3',
    },
    {
      text: 'It answers every blow that hurts it with a claw at the one who struck. Keep everyone above half with a potion and stand up anyone who falls with a Phoenix Down.',
      short: 'It claws back at every blow',
      cite: 'ffx-combat-core §2.8; re-ffx-shinryu §2',
    },
    {
      text: 'With one swimmer left it no longer uses the Eraser: the last one standing is only clawed and burst with light. Never give up a fight with one swimmer left.',
      short: 'The last swimmer is safe from it',
      cite: 'ffx-combat-core §4.2; re-ffx-shinryu §2',
    },
  ],

  hints: [
    { when: { labels: ['Quick Hit'], targetId: DRAGON }, text: '{actor} uses Quick Hit on {target}: the same blow as an Attack with a shorter recovery, so Tidus strikes more often', cite: 'ffx-combat-core §7.1; re-ffx-shinryu §4' },
    { when: { kinds: ['attack'], targetId: DRAGON }, text: '{actor} strikes {target} with a Celestial weapon: every blow is the 99,999 cap, and it takes 21 of them. {target} answers each with a claw', cite: 'ffx-combat-core §7.1; re-ffx-shinryu §2, §4' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up: a swimmer who is only knocked out can return, one the Eraser shattered cannot', cite: 'ffx-combat-core §4.2; re-ffx-shinryu §0, §2' },
    { when: { labels: ['X-Potion', 'Mega-Potion', 'Hi-Potion'] }, text: 'Heal {target}: every blow on Shinryu is answered with a claw, and its burst of light lands eight times', cite: 'ffx-combat-core §2.8; re-ffx-shinryu §2, §3' },
  ],

  watch: [],

  phases: [
    {
      label: 'THE ERASER',
      note: 'One turn in three, while two or more of you stand, it points the Eraser at one of you. In the water that Petrify is a shatter. The fewer turns it gets, the fewer of you it takes.',
      cite: 'ffx-combat-core §4.2; re-ffx-shinryu §0, §2',
    },
  ],
};

export default SHINRYU_GUIDE;
