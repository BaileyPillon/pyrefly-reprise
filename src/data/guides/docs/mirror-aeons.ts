/**
 * The hidden Mirror Aeons chapter (the Dark Magus Sisters, then Dark Yojimbo): the guide's one page for these fights.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guides' "Dark Magus Sisters" and "Dark Yojimbo" pages (Side Quests, Dark Aeons) in our own words and in their order (layout:
 * `../doc-types.ts`): the boss header, the stat lines, the advice (fight the sisters one by one when you can; answer the Overdrive with an aeon; Quick Hit for offence), the Steal and the Drops. Where the game's own
 * files say more or otherwise, the files win (rule 6, `research/re-ffx-yojimbo-sisters-feasibility.md`): the pools, the Steal and the Drops are the records', Zanmato is a damage hit that strips Auto-Life, the
 * trio's gauges start full, and the later Yojimbo tiers fill his blade faster.
 *
 * **Not modelled, so not promised:** the gear the Dark Aeons drop, the chase that splits the sisters in the guides (the chapter picks a formation), and the dark paintings.
 */

import type { GuideDoc } from '../doc-types.ts';

export const MIRROR_AEONS_DOC: GuideDoc = {
  id: 'mirror-aeons',
  game: 'ffx',
  bossIds: ['dark-cindy', 'dark-sandy', 'dark-mindy', 'dark-yojimbo'],
  blocks: [
    { t: 'head', at: ['dark-cindy', 'dark-sandy', 'dark-mindy'], title: 'Dark Magus Sisters', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value: "Cindy, Sandy and Mindy, called up by Yevon in the wrong colours: Yuna's own aeons, turned against her.",
    },
    { t: 'field', label: 'Weaknesses', value: 'None: no element is favoured or resisted. Immune to Sensor.' },
    {
      t: 'p',
      text: 'The three start with every Overdrive full, so the first thing that happens is their joint attack on the whole party: six blows that Auto-Life does not turn. Send one of Yuna\'s aeons in before it lands.',
    },
    { t: 'h3', text: 'Cindy' },
    { t: 'field', label: 'HP', value: '3,000,000' },
    {
      t: 'p',
      text: "Cindy's plain blow strips the party's protections, and Camisade hurts HP and MP together. She is the biggest pool of the three.",
    },
    { t: 'h3', text: 'Sandy' },
    { t: 'field', label: 'HP', value: '2,500,000' },
    {
      t: 'p',
      text: "Sandy's plain blow can Petrify, and Razzia takes away a party's second chance. She hits the hardest of the three.",
    },
    { t: 'h3', text: 'Mindy' },
    { t: 'field', label: 'HP', value: '2,000,000' },
    {
      t: 'p',
      text: 'Mindy is fast and hard to hit. Passado is a flurry that kills; Calamity inflicts Poison, Silence, Darkness, Curse and all four Breaks. Take her first.',
    },
    { t: 'h3', text: 'Together and alone' },
    {
      t: 'p',
      text: 'With all three standing and full, the joint attack is their Overdrive. A sister left alone and full uses Mega Graviton instead, which harms the whole party and puts Sleep, Silence, Darkness and Slow on it.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Wear Ribbon, Auto-Haste, Auto-Phoenix and Auto-Protect; keep Stoneproof or Ribbon on someone for Sandy.',
        "On the first turn, send an aeon in. It takes the joint attack, and your party's gauges stay where they were.",
        'Take Mindy first, then Sandy, then Cindy. Quick Hit gets the most blows in.',
        'Keep an aeon in reserve for the next time all three are full, or for a lone sister\'s Mega Graviton.',
        'Heal under half strength, and revive the fallen at once.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Return Sphere (Cindy), Friend Sphere (Sandy), Teleport Sphere (Mindy)', 'Elixir (rare)'] },
    { t: 'list', label: 'Drops', items: ['Dark Matter (common)', 'Master Sphere (rare)'] },

    { t: 'head', at: ['dark-yojimbo'], title: 'Dark Yojimbo', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value: "Yojimbo in the wrong colours, called up by a Yevon soldier in the cavern where Yuna found him.",
    },
    { t: 'field', label: 'HP', value: '1,600,000' },
    { t: 'field', label: 'Weaknesses', value: 'None. Immune to Sensor. His Luck is high, so many physical blows miss.' },
    {
      t: 'p',
      text: 'He strikes at random with Wakizashi (the whole party), Kozuka (one member, with the four Breaks and Slow) and his dog, who bites one member and can Petrify and Poison. Each turn his Overdrive gauge fills a little, and a little more for every blow he takes.',
    },
    {
      t: 'p',
      text: 'When the gauge is full he uses Zanmato on the whole party: a huge hit that strips Auto-Life. An aeon on the field takes it for everyone.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Wear Ribbon (it stops the dog), Auto-Haste (it answers Slow), Auto-Phoenix and Auto-Protect.',
        'Quick Hit for as many blows as you can, and keep swinging through the misses.',
        'When his gauge is full, send an aeon in before he acts.',
        "Your own Yojimbo can be paid to strike; the Dark one resists Zanmato, so do not count on it.",
      ],
    },
    { t: 'list', label: 'Steal', items: ['Stamina Tonic x2 (common)', 'Elixir (rare)'] },
    { t: 'list', label: 'Drops', items: ['Dark Matter (common)', 'Master Sphere (rare)'] },
  ],
};

export default MIRROR_AEONS_DOC;
