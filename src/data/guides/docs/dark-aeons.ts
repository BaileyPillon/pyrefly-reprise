/**
 * The hidden Dark Aeons chapter (the six other Dark Aeons, Besaid to Gagazet): the guide's one page for these fights.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guides' Dark Aeons pages (Side Quests) in our own words and in their order (layout: `../doc-types.ts`): the boss header, the stat lines, the advice
 * (answer the Overdrive with an aeon, Auto-Life, few heavy blows), the Steal and the Drops. Where the game's own files say more or otherwise, the files win (rule 6, `research/re-ffx-dark-aeons-six.md`): the pools, the Steal
 * and the Drops are the records', the second Dark Ixion fight is another script, and Dark Anima is immune to every spell.
 *
 * **Not modelled, so not promised:** the gear the Dark Aeons drop, the unlock conditions, and the dark paintings.
 */

import type { GuideDoc } from '../doc-types.ts';

const DROPS = { t: 'list', label: 'Drops', items: ['Dark Matter (common)', 'Master Sphere (rare)'] } as const;

export const DARK_AEONS_DOC: GuideDoc = {
  id: 'dark-aeons',
  game: 'ffx',
  bossIds: ['dark-valefor', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-bahamut', 'dark-anima'],
  blocks: [
    { t: 'head', at: ['dark-valefor'], title: 'Dark Valefor', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '800,000' },
    { t: 'field', label: 'Weaknesses', value: 'None. She resists every element. Immune to Sensor.' },
    { t: 'p', text: 'Every blow you land fills her fury, and a full fury is Energy Blast on the whole party. She is quick, but a few heavy blows end her first.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Wear Auto-Haste, Auto-Phoenix, Auto-Protect and Ribbon; put Auto-Life on everyone.', 'Strike with the heaviest actions you have and keep the count low.', 'If the fury nears full, send an aeon in to take the blast.'] },
    { t: 'list', label: 'Steal', items: ['X-Potion x2 (common)', 'Elixir (rare)'] },
    DROPS,

    { t: 'head', at: ['dark-ifrit'], title: 'Dark Ifrit', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '1,400,000' },
    { t: 'field', label: 'Weaknesses', value: 'None. He absorbs Fire, resists Ice and is immune to Thunder and Water. Immune to Sensor.' },
    { t: 'p', text: 'He answers every action with a blow of his own, and a meteor falls on one of you each turn. Hellfire comes when his fury is full.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Protect, Shell and Auto-Life on everyone before the first swing.', 'Use fewer, heavier actions: each one draws one answer, however many blows it has.', 'Send an aeon in for Hellfire.'] },
    { t: 'list', label: 'Steal', items: ['Mega Phoenix x2 (common)', 'Elixir (rare)'] },
    DROPS,

    // Both of his fights are this one page: the second is another formation and another combatant id (`dark-ixion-2`), so the head is anchored on both (r35 review PR-0637: with only `dark-ixion` anchored, link 4 opened on block 0, Dark Valefor's page).
    { t: 'head', at: ['dark-ixion', 'dark-ixion-2'], title: 'Dark Ixion', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '1,200,000' },
    { t: 'field', label: 'Weaknesses', value: 'None. He absorbs Thunder, resists Water and is immune to Fire and Ice. Immune to Sensor.' },
    { t: 'p', text: 'In the first fight he answers every action with a blade that can put you to sleep and break you, and Aerospark strips your wards and Auto-Life. The blade never finds a member whose Evasion and Luck add to 290 or more.' },
    { t: 'p', text: 'You fight him twice. The second fight is another script: no answer to your blows, a fury that fills faster, and Thor\'s Hammer on the whole party.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Raise Evasion and Luck, wear Ribbon, and recast Auto-Life after Aerospark.', 'Send an aeon in for Thor\'s Hammer in the second fight.'] },
    { t: 'list', label: 'Steal', items: ['Stamina Tablet x2 (common)', 'Elixir (rare)'] },
    DROPS,

    { t: 'head', at: ['dark-shiva'], title: 'Dark Shiva', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '1,100,000' },
    { t: 'field', label: 'Weaknesses', value: 'None. She absorbs Ice, resists Fire and is immune to Thunder and Water. Immune to Sensor.' },
    { t: 'p', text: 'She acts again and again before you can. Her plain blow strips your wards and Auto-Life, and her Heavenly Strike can kill, Confuse or Berserk. Diamond Dust falls on the whole party.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Only Deathproof stops her killing touch; a Ribbon holds off the Confuse and Berserk of the same blow. Wear Auto-Haste and Auto-Protect.', 'Keep Auto-Life up and heal early.', 'Send an aeon in for Diamond Dust.'] },
    { t: 'list', label: 'Steal', items: ['Mana Tablet x2 (common)', 'Elixir (rare)'] },
    DROPS,

    { t: 'head', at: ['dark-anima'], title: 'Dark Anima', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '8,000,000' },
    { t: 'field', label: 'Weaknesses', value: 'None. She is immune to every spell and absorbs Fire, Ice, Thunder and Water. Immune to Sensor.' },
    { t: 'p', text: 'Pain is death itself, Mega Graviton shrinks everyone and starts a countdown to Doom, and Oblivion falls on the whole party and on its MP. She takes hundreds of plain blows.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Leave the spells at home: use steel, aeons and Yojimbo.', 'Call Yojimbo in and pay him on every turn of his: a landed Zanmato ends the fight.', 'Put Auto-Life on everyone, and keep an aeon for each Oblivion.'] },
    { t: 'list', label: 'Steal', items: ['Three Stars x2 (common)', 'Elixir (rare)'] },
    DROPS,

    { t: 'head', at: ['dark-bahamut'], title: 'Dark Bahamut', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '4,000,000' },
    { t: 'field', label: 'Weaknesses', value: 'None. Immune to Sensor. His Luck is the highest of the six, so many physical blows miss.' },
    { t: 'p', text: 'His plain blow is heavy. Every fifth allowed action of yours draws Impulse on the whole party: Slow, Petrify and the four Breaks. A counter-attack of yours pays nothing towards it. Mega Flare comes on a full fury.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Wear Ribbon, Auto-Haste, Auto-Protect and Auto-Phoenix.', 'Dispel the Breaks as soon as Impulse lands.', 'Call Yojimbo in and pay him on every turn of his.', 'Send an aeon in for Mega Flare.'] },
    { t: 'list', label: 'Steal', items: ['Twin Stars x2 (common)', 'Elixir (rare)'] },
    DROPS,
  ],
};

export default DARK_AEONS_DOC;
