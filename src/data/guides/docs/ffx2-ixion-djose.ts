/**
 * Chapter 16, Ixion (Djose Temple): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Follows the FFX-2 encounter guide for this boss in
 * our own words and in its order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx2.md`
 * section 8 holds the page and every difference. Enemy, HP, Steal and Drop are the numbers this game
 * uses. The page says Ixion uses Aerospark four times in a row before he recharges; here his cycle is
 * a counter (`src/battle/ffx2/ai/ixion.ts`), so that count is left out and the rest of the sentence
 * stands. What follows the fight on that page (the Garment Grid, the cutscene, the four whistles) is
 * not part of this game's battle.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_IXION_DJOSE_DOC: GuideDoc = {
  id: 'ffx2-ixion-djose',
  game: 'ffx2',
  bossIds: ['x2-ixion'],
  blocks: [
    {
      t: 'p',
      text: 'Your next boss fight is upstairs. Despite how it looks, only one of its attacks is lightning damage, which makes a Yellow Ring or NulShock Ring less useful than it sounds.',
    },
    { t: 'head', at: ['x2-ixion'], title: 'Ixion', tag: 'Boss Battle' },
    { t: 'p', text: 'Be sure to Steal or Mug Ixion’s Sprint Shoes before the fight ends.' },
    {
      t: 'p',
      text: 'Ixion follows a clear pattern. It casts Aerospark, which takes 62.5% of a girl’s current HP; it then recharges, healing some of its HP; then it casts Thor’s Hammer.',
    },
    {
      t: 'p',
      text: 'Thor’s Hammer hurts your party quite a bit (about 700), so have everyone healed before it lands.',
    },
    {
      t: 'p',
      text: 'Ixion absorbs lightning damage but is weak to water: Water, Watera, Waterga, Liquid Steel, or Water Gems made with Mix.',
    },
    {
      t: 'p',
      text: 'Ixion, unlike Yojimbo, can be hit by Warrior Break abilities, which are useful if the fight drags on.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Ixion', hp: '12,380', steal: 'Sprint Shoes', drop: 'Soul of Thamasa' }],
    },
  ],
};
