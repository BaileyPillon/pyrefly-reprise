/**
 * Chapter 1, Seymour Flux (Mt. Gagazet): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14): the page follows the FFX encounter guide for this
 * boss, in our own words and in the order that guide gives it (layout: `../doc-types.ts`). HP, Steal
 * and Drops are the numbers this game uses; `research/jegged-encounter-guides-ffx-a.md` Chapter 1
 * holds the page and every difference.
 */

import type { GuideDoc } from '../doc-types.ts';

export const SEYMOUR_FLUX_DOC: GuideDoc = {
  id: 'seymour-flux',
  game: 'ffx',
  bossIds: ['seymour-flux', 'mortiorchis'],
  blocks: [
    {
      t: 'p',
      text: 'Get ready before the next area, because a boss is waiting there. Buy Holy Water from Wantz: 30 of it, spent at the customize screen, puts Zombie Ward on a piece of armour, and this fight calls for that ward. Equip the armour.',
    },
    {
      t: 'p',
      text: 'Bring about 30 Phoenix Downs to be safe. Anyone who struggled with the earlier bosses should fill every Overdrive gauge first, since this one is often called the hardest in the game.',
    },
    { t: 'p', text: 'Yuna needs Dispel already learned, because it pays off here.' },
    { t: 'head', at: ['seymour-flux', 'mortiorchis'], title: 'Seymour Flux', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        "Seymour's attacks tell you what the Mortiorchis will do. Lance of Atrophy inflicts Zombie, Full-Life follows, and Total Annihilation caps it off.",
    },
    { t: 'field', label: 'HP', value: '70,000' },
    {
      t: 'p',
      text: "Seymour again, and this time Kimahri and Yuna can use Trigger Commands: Kimahri's gives +10 Strength and Yuna's gives +10 Magic Defense.",
    },
    { t: 'p', text: 'He brings out the Mortiorchis, much like the helper that fought beside him at Bevelle.' },
    {
      t: 'p',
      text: 'Lance of Atrophy can leave one of your party Zombified. Zombie Ward armour (see above) makes that less likely.',
    },
    {
      t: 'p',
      text: 'Whoever turns Zombie needs a Holy Water, a Remedy or Esuna right away. Full-Life would normally refill a character to full HP, but Zombie flips healing around, so Seymour uses it to KO a Zombie on the spot.',
    },
    {
      t: 'p',
      text: 'He banishes aeons as he did before, so summon them only as a last resort. Lulu should Bio him early, since the poison piles up a great deal of damage, and Hastega should stay up on the party.',
    },
    {
      t: 'p',
      text: 'If Seymour puts Reflect or Protect on himself, Yuna should Dispel it so your hits stay worthwhile. Dispel his Reflect quickly enough and he may Flare himself.',
    },
    {
      t: 'p',
      text: 'Total Annihilation is the dangerous one, and the game announces it. It wipes out a party that is not ready.',
    },
    {
      t: 'p',
      text: 'Once Seymour is at about half his HP, the Mortiorchis switches to Auto-Attack Mode and then declares that it is Ready to Annihilate. The blast lands on its following turn, and it charges faster after the first one, so keep an eye on those messages all fight.',
    },
    {
      t: 'p',
      text: 'On the warning, Yuna can cast Shell just before the blast lands, or Kimahri can use the Mighty Guard he learned from Biran, or Rikku can Mix up Mighty G, Super Mighty G, or the top-tier Hyper Mighty G.',
    },
    {
      t: 'p',
      text: 'Defend will not help against this one: it only halves physical hits, and Total Annihilation is magic. Shell is what halves it.',
    },
    {
      t: 'p',
      text: "You can also call an aeon once Ready to Annihilate shows: standing on the field when the blast fires, it takes the whole hit for the party. Do it after Seymour's turn so he cannot Banish it before the attack.",
    },
    { t: 'p', text: 'Otherwise, keep up the regular attacks and magic until he drops.' },
    { t: 'list', label: 'Steal', items: ['Elixir'] },
    { t: 'list', label: 'Drops', items: ['Lv. 4 Key Sphere'] },
  ],
};
