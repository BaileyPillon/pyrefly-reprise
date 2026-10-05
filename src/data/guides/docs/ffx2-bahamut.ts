/**
 * Chapter 4, Bahamut (Bevelle Underground): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Follows the FFX-2 encounter guide for this boss in
 * our own words and in its order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx2.md`
 * section 2 holds the page and every difference. Enemy, HP, Steal and Drop are the numbers this game
 * uses. The preparation paragraphs sit above the previous boss there and lead into this one.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_BAHAMUT_DOC: GuideDoc = {
  id: 'ffx2-bahamut',
  game: 'ffx2',
  bossIds: ['bahamut'],
  blocks: [
    {
      t: 'p',
      text: 'Dark Knight is among the strongest dresspheres in the game, with a slow but heavy attack and strong defense. Put one of your girls in it now.',
    },
    {
      t: 'p',
      text: 'Save, and start one girl as a Thief so she can steal from the bosses ahead. A Ribbon on one party member is also worth having, to block nasty status effects.',
    },
    { t: 'head', at: ['bahamut'], title: 'Bahamut', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Time to take on an aeon! Remember to Steal a Mute Shock off him before the battle ends.',
    },
    { t: 'p', text: 'Bahamut cycles through one fixed attack pattern:' },
    {
      t: 'ul',
      items: [
        '“Curse” or an ordinary physical hit (Curse locks a girl into her current dressphere)',
        'Ordinary physical hit',
        'Ordinary physical hit',
        '“Impulse” (takes 37.5% of HP)',
        '“Impulse” again',
        '“Countdown”',
        '“Mega Flare”',
      ],
    },
    {
      t: 'p',
      text: 'Then the cycle starts over. The first Impulse tells you Countdown is near, and Mega Flare hurts badly, so have everyone fully healed before it comes.',
    },
    { t: 'p', text: 'Impulse cannot kill: it takes a percentage of HP, like Demi.' },
    {
      t: 'p',
      text: 'With a pattern this simple there is little more to say. If you are struggling, grind some EXP by the Save Sphere to level up your Dark Knights.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Bahamut', hp: '8,400', steal: 'Mute Shock', drop: 'Gris-Gris Bag' }],
    },
  ],
};
