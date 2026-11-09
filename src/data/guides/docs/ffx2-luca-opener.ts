/**
 * The docks of Luca (FFX-2 Chapter 1; our hidden chapter "The Luca Opener"): the guide's document for these two fights.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The page follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it) in our
 * own words, and follows Jegged's "Luca" page for the order and the easy tone (three against two, Rikku steals, Yuna held to the Songstress); the numbers are the game's own rows and scripts
 * (`research/re-ffx2-luca-opener.md` sections 0 and 3), which agree with that page's. Enemy, HP, Steal and Drop are the numbers this game uses; nothing here names where the advice came from
 * (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_LUCA_OPENER_DOC: GuideDoc = {
  id: 'ffx2-luca-opener',
  game: 'ffx2',
  bossIds: ['x2-luca-logos', 'x2-luca-ormi', 'x2-luca-leblanc'],
  blocks: [
    {
      t: 'p',
      text: 'The concert is behind you and the third harbour is not empty. Two of the Leblanc Syndicate’s men are waiting on the quay, and after them the boss herself. Both fights are short, and the party is whole between them.',
    },
    { t: 'head', at: ['x2-luca-logos', 'x2-luca-ormi'], title: 'Logos and Ormi', tag: 'Boss Battle' },
    { t: 'p', text: 'Be sure to Steal from both of them before the fight ends: an Iron Bangle from Ormi and Silver Glasses from Logos.' },
    {
      t: 'p',
      text: 'It is three against two. Logos has 86 HP and a Defense of 2, so every blow tells; he shoots twice a turn at a random girl. Take him first.',
    },
    {
      t: 'p',
      text: 'Ormi has 97 HP and a Defense of 60, and magic of any kind goes straight through him. He swings twice and then throws his shield at the girl standing farthest from him, Rikku at the start.',
    },
    {
      t: 'p',
      text: 'When Ormi is down to a fifth of his HP, Logos throws him one Potion, once. Do not bother racing it; finish Logos and it never comes.',
    },
    {
      t: 'loot',
      rows: [
        { enemy: 'Logos', hp: '86', steal: 'Silver Glasses', drop: 'Potion' },
        { enemy: 'Ormi', hp: '97', steal: 'Iron Bangle', drop: 'Potion' },
      ],
    },
    { t: 'head', at: ['x2-luca-leblanc'], title: 'Leblanc', tag: 'Boss Battle' },
    { t: 'p', text: 'Be sure to Steal her Silver Bracer before the fight ends.' },
    {
      t: 'p',
      text: 'After the first fight Yuna has her Songstress sphere back, and for this fight it is the only dress she can wear. Darkness Dance is her one command.',
    },
    {
      t: 'p',
      text: 'Leblanc has 130 HP, a Defense of 2 and a great deal of Magic Defense, so strike her; spells slide off. She swings three times and then casts Thunder on whoever has the most HP, and the Thunder never misses.',
    },
    {
      t: 'p',
      text: 'She can be blinded, and a blinded Leblanc misses most of her swings. That makes the Dance worth a turn, and leaves Rikku time to steal.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Leblanc', hp: '130', steal: 'Silver Bracer', drop: 'Hi-Potion' }],
    },
  ],
};
