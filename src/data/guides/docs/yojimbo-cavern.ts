/**
 * Chapter 9, Yojimbo in the Cavern of the Stolen Fayth: the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX guide's side-quest page for the
 * cavern in our own words and in its order (layout: `../doc-types.ts`); the page has no boss box for
 * this fight, only a paragraph and a hint box, so that is all the page here holds beyond what the
 * game itself prints (`research/jegged-encounter-guides-ffx-b.md` section 2 has the page and the
 * differences). The one number it gives is rounded (about 30,000); the game's own 33,000 is printed.
 * What follows the fight on that page (the contract, the price, the side rooms) is not in this game.
 */

import type { GuideDoc } from '../doc-types.ts';

export const YOJIMBO_CAVERN_DOC: GuideDoc = {
  id: 'yojimbo-cavern',
  game: 'ffx',
  bossIds: ['yojimbo'],
  blocks: [
    {
      t: 'p',
      text: 'The Cavern of the Stolen Fayth can be done on your initial trip through the Calm Lands, but it is best to return when your characters are far stronger. The game is easy to finish without Yojimbo.',
    },
    {
      t: 'hint',
      kind: 'hint',
      title: "Kimahri's Overdrive - Ronso Rage",
      text: 'Use Lancet on a Ghost in this area and Kimahri can learn the Doom Ronso Rage. The Overdrive section covers Lancet and Ronso Rage in more detail.',
    },
    { t: 'head', at: ['yojimbo'], title: 'Yojimbo' },
    {
      t: 'p',
      text: 'In the next area an unsent summoner, Lady Ginnem, waits. Lulu once guarded her. She starts the fight and calls up Yojimbo.',
    },
    {
      t: 'p',
      text: "Yojimbo is not too hard to beat, and Yuna's aeons are there if you struggle. He has 33,000 HP.",
    },
  ],
};
