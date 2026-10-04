/**
 * Chapter 3, Braska's Final Aeon (Dream's End): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide for the final boss in
 * our own words and in its order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx-a.md`
 * Chapter 3 holds the page and every difference. That guide has one boss page for the whole chapter
 * (no HP, Steal or Drops list for it) and one closing paragraph on Yu Yevon, so the possessed aeons
 * show the same page, and Yu Yevon opens on its closing paragraph.
 */

import type { GuideDoc } from '../doc-types.ts';

export const BRASKAS_FINAL_AEON_DOC: GuideDoc = {
  id: 'braskas-final-aeon',
  game: 'ffx',
  bossIds: [
    'braskas-final-aeon',
    'possessed-valefor',
    'possessed-ifrit',
    'possessed-ixion',
    'possessed-shiva',
    'possessed-bahamut',
    'possessed-anima',
    'possessed-yojimbo',
    'possessed-cindy',
    'possessed-sandy',
    'possessed-mindy',
    'yu-yevon',
  ],
  blocks: [
    {
      t: 'p',
      text: 'Top the party up with potions and ethers if it needs it, and put on any gear that has Stone Ward or Stoneproof. Finish your preparations, then talk to Jecht when you are ready.',
    },
    {
      t: 'hint',
      kind: 'hint',
      title: 'Using Powerful Items',
      text: 'The game ends here, so nothing is worth saving: X-Potions, Mega-Potions, Turbo Ethers, Elixirs, Megalixirs and Mega Phoenix are all fair game.',
    },
    {
      t: 'head',
      at: [
        'braskas-final-aeon',
        'possessed-valefor',
        'possessed-ifrit',
        'possessed-ixion',
        'possessed-shiva',
        'possessed-bahamut',
        'possessed-anima',
        'possessed-yojimbo',
        'possessed-cindy',
        'possessed-sandy',
        'possessed-mindy',
      ],
      title: "Braska's Final Aeon",
      tag: 'Final Boss Battle',
    },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'It feeds on the Yu Pagodas and uses Overdrives whenever its gauge is full. Keep that gauge down: Tidus can Talk to lower it.',
    },
    {
      t: 'p',
      text: "The last fight is two battles, one against each form of Braska's Final Aeon. In the second form it draws a sword from its chest and sprouts wings.",
    },
    { t: 'h3', text: 'Yu Pagodas' },
    {
      t: 'p',
      text: 'Two Yu Pagodas hover on either side of the aeon. Their Power Wave heals it and fills its Overdrive gauge, which is the black bar beside the boss. Destroying them is possible, but they come back a few turns later with extra HP.',
    },
    {
      t: 'p',
      text: 'Each starts at 5,000 HP and returns with that plus your overkill. Knock one down with a 3,000 hit and then another 3,000 and it comes back with 6,000.',
    },
    {
      t: 'p',
      text: 'Big hits are therefore a problem. Take both Pagodas down together: if only one falls, the other starts casting nasty spells, Curse included. Better still, leave them alone until the second phase.',
    },
    { t: 'p', text: 'Use every helpful status you have; Hastega, Protect and Regen are all a big help.' },
    {
      t: 'p',
      text: 'A petrified character needs a Soft or a Remedy at once. The aeon will Shatter a petrified character and remove them from the fight for good, and finishing the boss with two characters is extremely hard.',
    },
    {
      t: 'p',
      text: "Tidus's Talk, one of the Trigger Commands, drains the aeon's Overdrive gauge. Hold it for the second form, when the sword appears, because its Overdrives hit far harder from then on.",
    },
    { t: 'p', text: 'Talk can empty the gauge completely, and you get two uses of it over the whole fight.' },
    {
      t: 'p',
      text: 'Bio can poison it, though it may take a few casts to stick. The Break attacks (Armor Break, Power Break, Mental Break, or Full Break for all of them) also help bring its HP down faster.',
    },
    {
      t: 'p',
      at: ['yu-yevon'],
      text: 'A final fight against Yu Yevon follows, and it cannot be lost. If it drags, have Yuna cast Reflect on him. Enjoy the final cinematic!',
    },
  ],
};
