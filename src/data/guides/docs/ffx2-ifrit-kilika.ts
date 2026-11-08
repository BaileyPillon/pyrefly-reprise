/**
 * Kilika Temple, Ifrit (FFX-2 Chapter 3, the mission "Pest Control"; our hidden chapter): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The page follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it) in our
 * own words. **Jegged's page for Kilika Temple was not read** (`research/jegged-encounter-guides-ffx2.md` covers the seven listed FFX-2 chapters only), so this page is built from the research's sources
 * (`research/ffx2-fallen-aeons.md` §7.1: SinirothX's encyclopedia, the wiki, the GameFAQs guides) and the game's own row (`research/re-ffx2-ifrit-kilika.md`, row 165); it is to be reconciled with Jegged's page when that is
 * read. Enemy, HP, Steal and Drop are the numbers this game uses. Nothing here names where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_IFRIT_KILIKA_DOC: GuideDoc = {
  id: 'ffx2-ifrit-kilika',
  game: 'ffx2',
  bossIds: ['x2-ifrit'],
  blocks: [
    {
      t: 'p',
      text: 'The mission ends in the Chamber of the Fayth, where the temple’s own aeon waits, held by pyreflies that are not its own.',
    },
    { t: 'head', at: ['x2-ifrit'], title: 'Ifrit', tag: 'Boss Battle' },
    { t: 'p', text: 'Be sure to Steal his Fiery Gleam before the fight ends.' },
    {
      t: 'p',
      text: 'Ifrit absorbs Fire and is weak to Ice. A Fire spell or a Fire attack heals him, so keep it out of the plan, and Gravity does nothing to him.',
    },
    {
      t: 'p',
      text: 'On most turns he swings, with a Strength of 82, or casts Firaga on the whole party. Defense is the wall here, 98 of it, so Darkness, which ignores Defense and is no element, does the damage, and Armor Break helps the blades.',
    },
    {
      t: 'p',
      text: 'He keeps a hidden count. Every action of his raises it by seven and every blow he takes by five.',
    },
    {
      t: 'p',
      text: 'Each time it passes thirty, sixty and ninety, he sends a Meteor Strike at the girl who stands farthest from him. At a hundred he casts Hellfire on all three, and the count starts over.',
    },
    {
      t: 'p',
      text: 'Firaga, Meteor Strike and Hellfire are all magic, so Shell halves every one of them. Heal the girl he is aiming at after each Meteor, and have everyone topped up before the Hellfire.',
    },
    {
      t: 'p',
      text: 'The Meteors and Hellfire do not raise the count themselves, but every blow you land does, so the faster you hurt him, the sooner the big ones come. Breaks and Slow both land on him.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Ifrit', hp: '8,820', steal: 'Fiery Gleam', drop: 'Angel Earrings' }],
    },
  ],
};
