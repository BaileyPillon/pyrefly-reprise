/**
 * Besaid Temple, Valefor (FFX-2 Chapter 3, the mission "Protect Besaid Temple!"; our hidden chapter): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The page follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order
 * a player meets it) in our own words. **Jegged's page for the Besaid Temple was not read tonight** (`research/jegged-encounter-guides-ffx2.md` covers the seven listed FFX-2 chapters only, and the
 * overnight run had no way to fetch a page without a permission prompt), so this page is built from the research's sources (`research/ffx2-fallen-aeons.md` §7.1: SinirothX's encyclopedia, the wiki,
 * the GameFAQs guides) and the game's own row (`research/re-ffx2-yojimbo-valefor.md`, row 164); it is to be reconciled with Jegged's page when that is read. Enemy, HP, Steal and Drop are the numbers
 * this game uses. Nothing here names where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_VALEFOR_BESAID_DOC: GuideDoc = {
  id: 'ffx2-valefor-besaid',
  game: 'ffx2',
  bossIds: ['x2-valefor'],
  blocks: [
    {
      t: 'p',
      text: 'The mission ends in the Chamber of the Fayth, where the temple’s own aeon waits, held by pyreflies that are not its own.',
    },
    { t: 'head', at: ['x2-valefor'], title: 'Valefor', tag: 'Boss Battle' },
    { t: 'p', text: 'Be sure to Steal her Healing Springs before the fight ends.' },
    {
      t: 'p',
      text: 'Valefor mostly swings. Her swing is the hit that hurts, with a Strength of 97, and one time in three she uses Sonic Wings instead, which only chips a little MP from the girl at the back.',
    },
    {
      t: 'p',
      text: 'She keeps a hidden count. Every move she makes and every blow she takes raises it, and it sets off Energy Ray, a magic blast on the whole party, twice on the way up, and Energy Blast, her strongest, at the top.',
    },
    {
      t: 'p',
      text: 'Energy Ray and Energy Blast are magic and land on all three girls at once, so Shell halves them. Energy Blast hits hardest of all: have everyone healed before it.',
    },
    {
      t: 'p',
      text: 'Valefor takes damage from every element alike, and Gravity does nothing to her. Breaks and Slow both land on her.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Valefor', hp: '8,430', steal: 'Healing Spring', drop: 'Moon Bracer' }],
    },
  ],
};
