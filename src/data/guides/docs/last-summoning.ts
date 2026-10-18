/**
 * The hidden Last Summoning (Yu Yevon takes the player's aeons one at a time, in the order the player picks): the guide's page for this chain.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). The FFX encounter guide has no page for this gauntlet (`research/jegged-encounter-guides-ffx-a.md` Chapter 3: "the aeon gauntlet is not covered at all"), so the
 * page is laid out like the one Chapter III has (layout: `../doc-types.ts`) and stands on the research and the game's own files alone (`research/re-ffx-last-summoning.md`, `research/ffx-bfa-yu-yevon.md`),
 * in our own words; the Pagodas and Yu Yevon repeat what Chapter III's page says, which does follow that guide. There is **no HP line**: a possessed aeon takes its HP from the player's own aeon at the
 * battle's start (RE section 7), so no printed number would be true of every party. The player's own Yojimbo and Sisters are the RE lane's engine at its final tip (Pay, a Zanmato that kills every foe of the group, the Sisters'
 * eight orders and a Delta Attack on every foe in reach): the page says what they do and promises no number of theirs.
 *
 * It stands in front of Chapter III's page in the registry and is found only on this chapter's own board (`onlyWhenFlag`): the possessed aeons and Yu Yevon carry Chapter III's ids.
 */

import type { GuideDoc } from '../doc-types.ts';

/** The ten possessed bodies, in the order of the offering (the Sisters last), and Yu Yevon. */
const POSSESSED = [
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
] as const;

export const LAST_SUMMONING_DOC: GuideDoc = {
  id: 'last-summoning',
  game: 'ffx',
  bossIds: [...POSSESSED, 'yu-yevon'],
  onlyWhenFlag: { prefix: 'aeonDuel.reason:', value: 'Taken by Yu Yevon' },
  blocks: [
    {
      t: 'p',
      text: 'Yu Yevon takes your aeons one at a time, in the order you choose, and every aeon he takes is turned against you. Nothing heals between the battles, so plan the whole chain before you give up the first aeon.',
    },
    {
      t: 'hint',
      kind: 'hint',
      title: 'Using Powerful Items',
      text: 'The game ends here, so nothing is worth saving: X-Potions, Mega-Potions, Turbo Ethers, Elixirs, Megalixirs and Mega Phoenix are all fair game.',
    },
    { t: 'head', at: [...POSSESSED], title: 'The Last Summoning', tag: 'Final Boss Battle' },
    { t: 'h3', text: 'The offering' },
    {
      t: 'p',
      text: 'Before each battle Yu Yevon reaches for one of your aeons and you choose which. That aeon is gone for the rest of the chain, and it is the one you fight next.',
    },
    {
      t: 'p',
      text: 'The Magus Sisters go together and are fought together, all three at once. Anima and Yojimbo have no fixed place in the order either.',
    },
    { t: 'h3', text: 'Your aeons while it lasts' },
    {
      t: 'ul',
      items: [
        'Summon works in every battle. The aeons Yu Yevon has taken are greyed out, and so is the one you are about to face.',
        'While an aeon stands, nobody in the party can be targeted, and the party waits for it.',
        'An aeon that falls needs more battles to recover than the chain has left.',
        'Yojimbo is paid for each stroke: his menu offers Pay in round amounts and all your gil. A bigger payment buys a better stroke, and a Zanmato, which ends the battle at once, is rare and needs his gauge full (a Grand Summon fills it).',
        'The Magus Sisters come as one summon, a single row of the Summon list. Their orders are yours to give; Combine is the Delta Attack on every foe in reach, six hits each, and needs all three of their gauges full, which they begin with.',
        'HP, MP and items carry over from one battle to the next. The fayth’s Auto-Life stands a fallen friend up again in every battle.',
      ],
    },
    { t: 'h3', text: 'The twins' },
    {
      t: 'p',
      text: 'A possessed aeon is a copy of the one you gave up: the same Strength, Defense, Magic, Magic Defense, Agility, Evasion, Accuracy and maximum HP, and it starts at full HP. A stronger aeon makes a harder twin.',
    },
    {
      t: 'p',
      text: 'Breaks, Bio and the other statuses do not take on a twin. Its Overdrive gauge is a hundred points wide, and every blow that reaches it fills the gauge a little.',
    },
    { t: 'h3', text: 'Yu Pagodas' },
    {
      t: 'p',
      text: 'Two Yu Pagodas hover beside every twin. Their Power Wave heals it for 1,500 and charges its Overdrive gauge. Destroying them is possible, but they come back a few turns later with extra HP.',
    },
    {
      t: 'p',
      text: 'Each starts at 5,000 HP and returns with that plus your overkill, so a big hit only makes them harder to keep down. Finishing the twin faster is the better answer.',
    },
    {
      t: 'h3',
      at: ['possessed-valefor', 'possessed-ifrit', 'possessed-ixion', 'possessed-shiva', 'possessed-bahamut'],
      text: 'Valefor, Ifrit, Ixion, Shiva and Bahamut',
    },
    {
      t: 'p',
      text: 'Each uses its special move on about half its turns and a plain Attack on the rest. At a full gauge it spends it on its Overdrive against everyone at the front: Energy Ray, Hellfire, Thor’s Hammer, Diamond Dust or Mega Flare.',
    },
    {
      t: 'p',
      text: 'Ifrit absorbs Fire, Ixion absorbs Lightning and Shiva absorbs Ice, so keep those elements away from them. Bahamut’s Impulse reaches everyone at the front.',
    },
    { t: 'h3', at: ['possessed-anima'], text: 'Anima' },
    {
      t: 'p',
      text: 'Anima never makes a plain Attack. She uses Pain on one of you every turn, and her Overdrive, Oblivion, once her gauge is full.',
    },
    { t: 'h3', at: ['possessed-yojimbo'], text: 'Yojimbo' },
    {
      t: 'p',
      text: 'The possessed Yojimbo has no plain Attack and no Daigoro. Each turn he strikes one of you with Kozuka or Wakizashi, and once his gauge is full he uses Zanmato.',
    },
    {
      t: 'p',
      text: 'Zanmato is a flat 9,999 on everyone at the front, not an outright kill. Every blow that reaches him fills the gauge, and so does a Power Wave, so the faster he falls the fewer Zanmatos you see.',
    },
    { t: 'h3', at: ['possessed-cindy', 'possessed-sandy', 'possessed-mindy'], text: 'The Magus Sisters' },
    {
      t: 'p',
      text: 'The three Sisters fight together, with the Pagodas beside them. Cindy mends and drains; Sandy casts Reflect on Cindy and Haste on her sisters, then Razzia; Mindy casts Flare and flurries with Passado.',
    },
    {
      t: 'p',
      text: 'Cindy calls the Delta Attack, six hits on everyone at the front, once all three Sisters are alive with full gauges. Every blow charges the gauge of the Sister it lands on, and a Pagoda’s Power Wave charges the lowest.',
    },
    {
      t: 'p',
      text: 'Fell Cindy first: she is the one who mends and drains, and with her gone only the Pagodas heal a Sister. Fell any Sister and the Delta Attack can never be called. Reflect on Cindy bounces your spells; physical blows are not turned back.',
    },
    {
      t: 'p',
      at: ['yu-yevon'],
      text: 'The fight with Yu Yevon cannot be lost, but ordinary blows cannot hurt him either: every damaging action is answered by a 9,999 Curaga on himself. Throw a Candle of Life for Doom, keep the Pagodas down, and let his own Gravija wear him down.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Keep the party healed in every battle. Potions and Ethers are all you have until the end.',
        'Beat each twin quickly: the Pagodas heal it and fill its gauge, and its Overdrive reaches everyone at the front.',
        'Against Yojimbo, finish him before his gauge fills. Against the Sisters, fell Cindy first.',
        'Call your own aeons when the party is in trouble: while one stands, nobody in the party can be hit.',
        'Against Yu Yevon, use a Candle of Life and keep the Pagodas down.',
      ],
    },
  ],
};

export default LAST_SUMMONING_DOC;
