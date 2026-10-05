/**
 * Chapter 15, the Den of Woe (Baralai, Gippal, Nooj): the guide's page for these fights.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Follows the FFX-2 encounter guide's boss pages for
 * the three shades this chapter fights (that guide also has Rikku and Paine, which this chapter does
 * not) in our own words and in their order (layout: `../doc-types.ts`);
 * `research/jegged-encounter-guides-ffx2.md` section 7 holds the pages and every difference. Enemy,
 * HP, Steal and Drop are the numbers this game uses, and so is Baralai's Drill Shot count (it fires
 * after his HP has changed 8 times here; the page says 10). The Garment Grid the page names as a
 * reward is not in this game. The panel opens on the page for the shade on the field.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_DEN_OF_WOE_DOC: GuideDoc = {
  id: 'ffx2-den-of-woe',
  game: 'ffx2',
  bossIds: ['shade-baralai', 'shade-gippal', 'shade-nooj'],
  blocks: [
    {
      t: 'hint',
      kind: 'hint',
      title: 'Gun Mage Blue Bullet',
      text: 'Bosses here can teach Gun Mages the Blue Bullet abilities Mortar and Drill Shot. This is the only place in the story to learn Mortar, and your last chance at Drill Shot if you have not learned it yet.',
    },
    { t: 'lead', text: 'Preparation:' },
    {
      t: 'p',
      text: 'Make sure the whole party is fully healed before starting. There is a lot of good loot to Steal or Mug from these bosses, so keep a Thief dressphere or the Treasure Hunt grid handy.',
    },
    {
      t: 'p',
      text: 'Also consider setting up one girl on the Salvation Promised grid, assuming you own it.',
    },
    { t: 'head', at: ['shade-baralai'], title: 'Baralai', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Baralai is tougher than Rikku or Paine, but they are back in your party to balance things. If you want every Blue Bullet, this is the fight where your Gun Mage should learn Drill Shot. His full move list:',
    },
    {
      t: 'ul',
      items: [
        'Ordinary physical attack: up to three hits of about 300 each',
        '“Glint”: can strike several targets standing close together (you cannot control that)',
        '“Looming Glacier”: Stop, and every target’s MP falls to zero',
        '“Drill Shot”: fires automatically once Baralai’s HP has changed 8 times, at whoever made the last change',
        'Silence on the whole party, and Regen on himself',
        '“Not-So-Mighty Guard”: Shell, Protect and Regen on himself',
        '“Absorb”: takes HP and MP from one target',
      ],
    },
    {
      t: 'p',
      text: 'He has many high-damage attacks that hit several girls, and he drains your MP all fight long.',
    },
    {
      t: 'p',
      text: 'To steer Drill Shot onto the right girl, have the right Gun Mage keep attacking him until he fires it, ideally without hitting hard enough to end the fight early.',
    },
    {
      t: 'p',
      text: 'As in earlier fights, remember to Steal or Mug his Nature’s Lore accessory.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Baralai', hp: '12,220', steal: 'Nature’s Lore', drop: 'Crystal Ball' }],
    },
    { t: 'head', at: ['shade-gippal'], title: 'Gippal', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'The key task here is getting your Gun Mages to learn Mortar from Gippal if you plan on teaching them Blue Bullets. It is their only chance, and he does not use Mortar until he is below 33% HP.',
    },
    { t: 'p', text: 'Besides Mortar, which hits a cone in front of him, he also uses:' },
    {
      t: 'ul',
      items: [
        'A normal attack, about 300 damage',
        '“Grinder”: about 500 damage',
        '“Bullseye”: removes 56.25% of every target’s remaining HP and can strike several girls',
        '“Flash Bomb”: light damage, may inflict Darkness',
        '“Hush Grenade”: light damage, may inflict Silence',
        '“Potion Plus”: heals him for 600 HP',
      ],
    },
    {
      t: 'p',
      text: 'Be ready to heal right after Bullseye, since it is easy for him to KO someone left low. You cannot dodge much of this either, because Grinder and Mortar ignore defense stats.',
    },
    {
      t: 'p',
      text: 'Many of his attacks sweep an arc in front of him. You cannot position your girls, but you can spread them by moving a couple into ranged roles such as Gun Mage or Gunner.',
    },
    {
      t: 'p',
      text: 'Heal up before the final blow, and be sure to steal his White Lore accessory.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Gippal', hp: '14,800', steal: 'White Lore', drop: 'Kaiser Knuckles' }],
    },
    { t: 'head', at: ['shade-nooj'], title: 'Nooj', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'This is the trickiest fight of all, though at least you need not bother teaching any Blue Bullets here. His attacks:',
    },
    {
      t: 'ul',
      items: [
        'Normal attack: a single shot for about 500',
        '“Rippling Chroma”: about 1,500 magic damage to one target, ignoring magic defense',
        '“Greedy Aura”: takes 18.75% of every girl’s maximum HP and maximum MP',
        '“Lightfall”: 5,000 damage to everyone, used once only, after his HP drops below 3,000',
      ],
    },
    {
      t: 'p',
      text: 'He hits hard, and Lightfall is tough to survive without some preparation. Here is how to get ready.',
    },
    {
      t: 'p',
      text: 'Best: put one girl in the Dark Knight dressphere for tougher defenses and keep Protect and Shell on her against all other damage. That does not reduce Lightfall, but it keeps her HP high enough to survive it.',
    },
    {
      t: 'p',
      text: 'Another way: let one girl work through the Salvation Promised Garment Grid for Auto-Life, which revives her after Lightfall. Mix can also help: a Dark Matter together with any potion gives brief party-wide immunity.',
    },
    { t: 'p', text: 'With luck you may bring him from 3,000 HP straight to zero.' },
    { t: 'p', text: 'Remember to Steal or Mug his Arcane Lore before the fight ends.' },
    {
      t: 'loot',
      rows: [{ enemy: 'Nooj', hp: '23,800', steal: 'Arcane Lore', drop: 'Magical Dances, Vol. I' }],
    },
    {
      t: 'p',
      text: 'Completing the Den of Woe gives you the Magical Dances, Vol. I key item, besides each boss’s drops (Crystal Ball and Kaiser Knuckles).',
    },
  ],
};
