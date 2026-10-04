/**
 * Chapter 11, the Fallen Aeons (Road to the Farplane): the guide's page for these three fights.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Follows the FFX-2 encounter guide's three boss pages
 * (Shiva, the Magus Sisters, Anima) in our own words and in their order (layout: `../doc-types.ts`);
 * `research/jegged-encounter-guides-ffx2.md` section 5 holds the pages and every difference. Enemy, HP,
 * Steal and Drop are the numbers this game uses (one drop each; the page's second, rarer entry is not
 * awarded here). The panel opens on the page for the fight on the field.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_FALLEN_AEONS_DOC: GuideDoc = {
  id: 'ffx2-fallen-aeons',
  game: 'ffx2',
  bossIds: ['x2-shiva', 'sandy', 'cindy', 'mindy', 'x2-anima'],
  blocks: [
    {
      t: 'p',
      text: 'Three aeons wait on the same three platforms whichever route you took down, and you only fight them once. Consider protecting the party against Stop, for example with a Ribbon.',
    },
    { t: 'head', at: ['x2-shiva'], title: 'Shiva', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Shiva is the easiest of the three aeons on the Road to the Farplane. Her attacks:',
    },
    {
      t: 'ul',
      items: [
        'Normal attack, about 400 HP',
        'Triple attack on three random targets, about 400 HP each',
        '“Heavenly Strike”: cuts one target’s current HP and MP to half, with a 30% chance of Stop',
        'Blizzaga',
        '“Diamond Dust”: about 1,000 HP to everyone',
      ],
    },
    {
      t: 'p',
      text: 'Diamond Dust gets more frequent the faster her HP falls, but unless everyone is Stopped at once you should survive what she dishes out.',
    },
    { t: 'p', text: 'She absorbs ice and is weak to fire.' },
    {
      t: 'loot',
      rows: [{ enemy: 'Shiva', hp: '14,800', steal: 'Snow Ring', drop: 'Crystal Gloves' }],
    },
    { t: 'head', at: ['sandy', 'cindy', 'mindy'], title: 'The Magus Sisters', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'The three sisters dodge many physical attacks, so they can be harder than Shiva, but their moves are simple:',
    },
    { t: 'lead', text: 'Sandy:' },
    {
      t: 'ul',
      items: ['Normal attack, 150 to 300', '“Razzia”: a magic attack, 150 to 300'],
    },
    { t: 'lead', text: 'Mindy:' },
    {
      t: 'ul',
      items: [
        '“Passado”: 15 hits, each 6.25% of current HP (it cannot kill)',
        'Firaga, Blizzaga, Thundaga, Waterga',
      ],
    },
    { t: 'lead', text: 'Cindy:' },
    {
      t: 'ul',
      items: [
        '“Camisade”: a normal attack',
        '“Demi”: 25% of every girl’s current HP',
        '“Absorb”: drains a target’s HP and MP',
        'Regen',
        '“Not-So-Mighty Guard”: Shell, Protect and Regen on all three sisters',
        '“White Highwind”: heals the sisters completely, but only while all three live and each is under a quarter HP',
        '“Delta Attack”: drops your whole party to 1 HP, usable only while all three sisters live',
      ],
    },
    {
      t: 'p',
      text: 'Delta Attack, their strongest, needs all three alive, so a quick kill stops it. Mindy is the weakest, but Cindy has the most irritating abilities, so take her down first.',
    },
    {
      t: 'p',
      text: 'White Highwind also needs all three alive, so the worst plan is spreading damage evenly. Concentrate on one sister at a time.',
    },
    {
      t: 'p',
      text: 'Sandy and Mindy have high evasion and are hard to hit physically. Specials such as a Lady Luck’s Four Dice or a Dark Knight’s Darkness get past it.',
    },
    {
      t: 'p',
      text: 'If you are really stuck, a Samurai’s Spare Change can throw 75,000 Gil at one sister for 9,999 damage and nearly kill her outright.',
    },
    {
      t: 'p',
      text: 'They carry good items to steal: Chaos Shock, White Cape and Potpourri are all worth taking before the fight ends.',
    },
    {
      t: 'loot',
      rows: [
        { enemy: 'Sandy', hp: '10,330', steal: 'Potpourri', drop: 'Pixie Dust' },
        { enemy: 'Mindy', hp: '9,788', steal: 'Chaos Shock', drop: 'Faerie Earrings' },
        { enemy: 'Cindy', hp: '12,240', steal: 'White Cape', drop: 'Faerie Earrings' },
      ],
    },
    { t: 'head', at: ['x2-anima'], title: 'Anima', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'This fight lacks the flood of attacks the Sisters throw at you, and you will not have trouble hitting such a huge aeon. But Anima is strong, and uses:',
    },
    {
      t: 'ul',
      items: [
        'A normal attack for about 300 damage that also Poisons',
        '“Pain”: about 300 damage to one target, plus Silence, Itchy and Poison, and it lowers stats',
        '“Oblivion”: about 600 damage across roughly 16 hits',
      ],
    },
    {
      t: 'p',
      text: 'Each Pain lowers the target’s stats further, so have a Remedy ready for anyone it hits more than once. Keep the party healed and you will be fine.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Anima', hp: '36,000', steal: 'Fury Shock', drop: 'Tetra Band' }],
    },
  ],
};
