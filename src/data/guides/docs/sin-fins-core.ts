/**
 * Chapter 17, Sin: the Fins and the Core: the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide's boss pages for
 * Sin's Left Fin, Right Fin, Sinspawn Genais and Core, in our own words and in their order (layout:
 * `../doc-types.ts`); `research/jegged-encounter-guides-ffx-b.md` section 6 holds the pages and every
 * difference. HP, Steal and Drops are the numbers this game uses (one drop each; the page's second,
 * doubled entry is not awarded here). The Core is a sub-heading of Genais's page, as it is there, so
 * the panel opens on Genais while he stands and on the Core after.
 */

import type { GuideDoc } from '../doc-types.ts';

export const SIN_FINS_CORE_DOC: GuideDoc = {
  id: 'sin-fins-core',
  game: 'ffx',
  bossIds: ['left-fin', 'right-fin', 'sinspawn-genais', 'sin-core'],
  blocks: [
    {
      t: 'p',
      text: 'The next fights are against Sin itself. Its armour is very high, so make sure Auron (or someone else) has learned Armor Break. Levelling is easy: go back to the Zanarkand Ruins and fight fiends.',
    },
    {
      t: 'p',
      text: 'The Left Fin and the Right Fin are the same fight, and you do it twice in a row.',
    },
    { t: 'head', at: ['left-fin'], title: 'Left Fin', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '65,000' },
    {
      t: 'p',
      text: 'This fight plays much like Evrae outside the airship. Order Cid, through the Trigger Commands, to pull the ship farther from Sin and the Fin attacks less often.',
    },
    { t: 'p', text: 'The ship starts far away, so you must use Move In before you can attack.' },
    {
      t: 'p',
      text: "Before you close in, spend the spare time powering up with Tidus's Cheer, Rikku's Luck and similar abilities, which stack for up to five uses each.",
    },
    {
      t: 'p',
      text: "Cast Hastega early, but remember that Sin's Negation wipes every positive status from your party, so you will have to recast them.",
    },
    {
      t: 'p',
      text: "Sin's armour is fairly high, so Auron's Armor Break can speed things up. Negation also removes the Armor Break from Sin, so apply it again if that happens.",
    },
    {
      t: 'p',
      text: "When “Core Gathers Energy” appears, act at once with the Trigger Commands and get the ship out of range. Gravija follows shortly and takes about 3/4 of everyone's HP.",
    },
    { t: 'list', label: 'Steal', items: ['Mega-Potion (common)', 'Supreme Gem (rare)'] },
    { t: 'list', label: 'Drops', items: ['HP Sphere'] },
    { t: 'head', at: ['right-fin'], title: 'Right Fin', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        "Once the core is energised it casts Gravija, cutting everyone's HP by 3/4, so have Cid back off. It uses Negation, and sometimes a physical attack on everyone.",
    },
    { t: 'p', text: 'It plays by the same rules as the last fight.' },
    { t: 'list', label: 'Steal', items: ['X-Potion (common)', 'Shining Gem (rare)'] },
    { t: 'list', label: 'Drops', items: ['Lv. 3 Key Sphere'] },
    { t: 'head', at: ['sinspawn-genais'], title: 'Sinspawn Genais', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'Once its HP is halved it withdraws into its shell the turn after, heals itself with Cura if struck there, and comes out a turn later. Inside the shell Gravija cannot touch it.',
    },
    { t: 'field', label: 'HP', value: '20,000' },
    {
      t: 'p',
      text: "Begin by killing Sinspawn Genais, which sits in front of Sin's core and absorbs any magic aimed straight at Sin. Unlike the Geneaux at Kilika Temple, this one starts out of its shell.",
    },
    {
      t: 'p',
      text: 'Genais is weak to Fire. Below 50% HP it withdraws into its shell and starts healing itself with Cura. It has about 20,000 HP, so just keep hitting it until it falls.',
    },
    { t: 'p', text: 'Slow, or Silence Buster, limits how often it can cast Cura.' },
    { t: 'list', label: 'Steal', items: ['Star Curtain (common)', 'Shining Gem (rare)'] },
    { t: 'list', label: 'Drops', items: ['Return Sphere'] },
    { t: 'h3', at: ['sin-core', '-sinspawn-genais'], text: 'Sin (Core)' },
    {
      t: 'p',
      text: 'This is just like the Left and Right Fin fights, except that you cannot dodge Gravija by moving the ship, and Sin answers regular attacks with low-level spells.',
    },
    {
      t: 'p',
      text: "It may Poison your party. Cure that with Rikku's Al Bhed Potion, Yuna's Esuna, or an Antidote or Remedy from anyone.",
    },
    { t: 'list', label: 'Steal', items: ['Stamina Spring (x3) (common)', 'Stamina Spring (x4) (rare)'] },
    { t: 'list', label: 'Drops', items: ['MP Sphere'] },
  ],
};
