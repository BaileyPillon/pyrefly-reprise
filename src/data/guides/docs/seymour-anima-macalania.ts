/**
 * Chapter 7, Seymour and Anima (Macalania Temple): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide's two boss pages for
 * this temple fight (Seymour, then Anima) in our own words and in their order (layout:
 * `../doc-types.ts`); `research/jegged-encounter-guides-ffx-a.md` Chapter 7 holds the pages and every
 * difference. HP, Steal and Drops are the numbers this game uses. The guide has no page for the third
 * act (Seymour alone again) beyond the closing tip on Anima's page, which is where it opens.
 *
 * The panel opens on Anima's page while she stands (she is on the field from the summon), and on
 * Seymour's page otherwise.
 */

import type { GuideDoc } from '../doc-types.ts';

export const SEYMOUR_ANIMA_MACALANIA_DOC: GuideDoc = {
  id: 'seymour-anima-macalania',
  game: 'ffx',
  bossIds: ['seymour-macalania', 'anima-macalania', 'guado-guardian-a', 'guado-guardian-b'],
  blocks: [
    {
      t: 'p',
      text: "Save your game and shop at O'aka's before the temple fight, because a boss is next.",
    },
    {
      t: 'head',
      at: ['seymour-macalania', 'guado-guardian-a', 'guado-guardian-b'],
      title: 'Seymour',
      tag: 'Boss Battle',
    },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'His spells run ice, lightning, water, fire in a fixed order, so Yuna should Nul each in turn: NulFrost, NulShock, NulTide, NulBlaze. Cornered, he summons.',
    },
    { t: 'field', label: 'HP', value: '6,000' },
    {
      t: 'p',
      text: 'You face Maester Seymour and two Guado Guardians. The Guardians put Protect on themselves, and Seymour puts Shell on himself.',
    },
    {
      t: 'p',
      text: "Tidus, Yuna and Wakka all have Trigger Commands here: Tidus's Talk raises Seymour's Strength, while Yuna's and Wakka's raise their own Magic Defense.",
    },
    {
      t: 'p',
      text: 'A physical attack on Seymour makes a Guardian step in front of him. The Guardians are hard to kill because of Auto-Potion: they heal themselves with a potion every time they are hit. There are two ways around it:',
    },
    {
      t: 'ol',
      items: [
        'Rikku Steals from each Guardian, which leaves them without Hi-Potions.',
        "Auron's Threaten stuns them, so they cannot act.",
      ],
    },
    {
      t: 'p',
      text: "Kill both Guardians before turning to Seymour, and have Yuna cast the matching Nul spell (NulBlaze, NulShock, NulTide or NulFrost) ahead of each of his spells.",
    },
    { t: 'p', text: 'The rest of this battle is covered below.' },
    { t: 'head', at: ['anima-macalania'], title: 'Anima', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '18,000' },
    {
      t: 'p',
      text: 'Tidus opens by suggesting that Yuna summon her new aeon, listed only as question marks. It is Shiva.',
    },
    {
      t: 'p',
      text: 'Blizzara heals Shiva fully at any time: ice is her own element and she absorbs it, so the spell restores her HP rather than hurting her.',
    },
    {
      t: 'p',
      text: 'Keep healing her until Diamond Dust, her Overdrive, is ready, fire it at Anima, and repeat until Anima falls.',
    },
    { t: 'p', text: 'Diamond Dust does extra damage if you fire it while Anima is boosting.' },
    {
      t: 'p',
      text: "Shiva will probably be KO'd along the way, so back her up with regular attacks on Anima and keep party HP as high as you can. Anima's Overdrive is close to a guaranteed wipe, and her Pain move is an instant KO on one party member.",
    },
    {
      t: 'p',
      text: 'After Anima falls, Auron can use Magic Break on Seymour, and Lulu can poison him with Bio if she has it.',
    },
    { t: 'list', label: 'Steal', items: ['Silence Grenade (common)', 'Farplane Shadow (rare)'] },
    { t: 'list', label: 'Drops', items: ['Ability Sphere'] },
  ],
};
