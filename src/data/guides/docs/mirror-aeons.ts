/**
 * The hidden Mirror Aeons chapter (the Dark Magus Sisters, then Dark Yojimbo): the guide's one page for these fights.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guides' "Dark Magus Sisters" and "Dark Yojimbo" pages (Side Quests, Dark Aeons) in our own words and in their order (layout:
 * `../doc-types.ts`): the boss header, the stat lines, the advice (fight the sisters one by one when you can; answer the Overdrive with an aeon; Quick Hit for offence), the Steal and the Drops. Where the game's own
 * files say more or otherwise, the files win (rule 6, `research/re-ffx-yojimbo-sisters-feasibility.md`): the pools, the Steal and the Drops are the records', Zanmato is a damage hit that strips Auto-Life, the
 * full trio's gauges start full (this chapter's first fight is the pair, which has no joint attack), and the later Yojimbo tiers fill his blade faster.
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
    // No "In Game Description" line here (FOC501-03): the card used to quote one that named Cindy, a sentence of ours that the game never printed, and no file or guide in hand gives the Dark Aeons' own text. Rule 6.
    { t: 'field', label: 'Weaknesses', value: 'None: no element is favoured or resisted. Immune to Sensor.' },
    {
      t: 'p',
      text: 'In this chapter the first fight is the pair, Sandy and Mindy. Cindy does not take the field, and there is no joint attack.',
    },
    { t: 'h3', text: 'Cindy' },
    { t: 'field', label: 'HP', value: '3,000,000' },
    {
      t: 'p',
      text: "Cindy's plain blow strips the party's protections, and Camisade hurts HP and MP together. She is the biggest pool of the three, but she does not take the field in this chapter.",
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
      text: 'Mindy is fast, and almost impossible to hit with a blade: her Evasion is the highest of the three. Spells, Overdrives and aeons find her. Passado is a flurry that kills; Calamity inflicts Poison, Silence, Darkness, Curse and all four Breaks.',
    },
    { t: 'h3', text: 'Together, in a pair and alone' },
    {
      t: 'p',
      text: 'Sandy and Mindy have no joint attack. Each uses Mega Graviton once her own gauge is full, which harms the whole party and puts Sleep, Silence, Darkness and Slow on it.',
    },
    {
      t: 'p',
      text: 'Sandy and Mindy together start empty: five plain turns each, then Mega Graviton on the sixth.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Wear Ribbon, Auto-Haste, Auto-Phoenix and Auto-Protect; keep Stoneproof or Ribbon on someone for Sandy.',
        "Send an aeon in as a Mega Graviton nears; Yuna's own Sisters are three bodies in one summon, and your party's gauges stay where they were.",
        'Blades for Sandy; Ultima or Flare from the mage for Mindy. Quick Hit gets the most blows in.',
        'Heal early with the healer\'s spells, put Auto-Life on everyone, and remember that every fallen member costs a Phoenix Down: the bag is the clock.',
        'Keep an aeon in reserve for the next Mega Graviton, from either sister.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Friend Sphere (Sandy), Teleport Sphere (Mindy)', 'Elixir (rare)'] },
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
      text: "The second act starts with a full heal: everyone, bench and aeons included, returns at full HP and MP with statuses and KO cleared and fallen aeons standing. The game has two separate fights here; the heal is our own choice.",
    },
    {
      t: 'p',
      text: "The bag, the gil, Yojimbo's compatibility and the Overdrive gauges carry over; the Sisters' motivation resets and any standing order clears.",
    },
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
        'Wear Ribbon (it stops the dog, but not the Breaks), Auto-Haste (it answers Slow), Auto-Phoenix and Auto-Protect.',
        'Cheer on the swordsman first: at five stacks a third comes off every physical blow, enough to live through Wakizashi at full health. Put Auto-Life on everyone.',
        'Quick Hit for as many blows as you can, and keep swinging through the misses.',
        'When his gauge is nearly full, send Yuna\'s Yojimbo in before he acts, a round early rather than on the full gauge: he takes Zanmato for everyone.',
        "Your own Yojimbo can be paid to strike, and a lucky Zanmato can end the fight: about one Pay in four at a million gil, better with a full Overdrive gauge. It is a chance, not a plan.",
      ],
    },
    { t: 'list', label: 'Steal', items: ['Stamina Tonic x2 (common)', 'Elixir (rare)'] },
    { t: 'list', label: 'Drops', items: ['Dark Matter (common)', 'Master Sphere (rare)'] },
  ],
};

export default MIRROR_AEONS_DOC;
