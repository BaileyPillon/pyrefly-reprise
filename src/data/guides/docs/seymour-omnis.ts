/**
 * Chapter 12, Seymour Omnis (Garden of Pain): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide for this boss in our
 * own words and in its order (layout: `../doc-types.ts`); `research/jegged-encounter-guides-ffx-b.md`
 * section 4 holds the page and every difference. HP, Steal and Drops are the numbers this game uses.
 * One claim on that page is left out because our research says the game does otherwise: that Yuna's
 * Shell lessens Ultima (it is not a Magic-type hit here).
 */

import type { GuideDoc } from '../doc-types.ts';

export const SEYMOUR_OMNIS_DOC: GuideDoc = {
  id: 'seymour-omnis',
  game: 'ffx',
  bossIds: ['seymour-omnis'],
  blocks: [
    {
      t: 'p',
      text: 'This fight is all magic, so put every character in any armour that guards against magic. That covers:',
    },
    {
      t: 'ul',
      items: [
        'Fire Ward, Lightning Ward, Water Ward and Ice Ward',
        'Fireproof, Lightningproof, Waterproof and Iceproof',
        'SOS NulBlaze, SOS NulShock, SOS NulTide and SOS NulFrost',
        'Magic Def+',
      ],
    },
    {
      t: 'p',
      text: 'Strip off weapons with Firestrike, Lightningstrike, Waterstrike or Icestrike: hitting him with one could heal him.',
    },
    { t: 'head', at: ['seymour-omnis'], title: 'Seymour Omnis', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value:
        'The four Mortiphasms behind him energise his spells, and where they point shapes his actions. Physical hits turn them left, magic turns them right.',
    },
    { t: 'field', label: 'HP', value: '80,000' },
    {
      t: 'p',
      text: 'The discs hovering behind Omnis are the Mortiphasms. They turn as the fight goes on, and the colours nearest Seymour set the strength and element of his spells.',
    },
    {
      t: 'p',
      text: 'Fire shows as orange or red, Lightning as yellow or green, Water as blue and Ice as purple.',
    },
    {
      t: 'p',
      text: 'Seymour casts four spells a turn. If all four discs match, he casts the top-tier spell (Firaga, Thundaga, Waterga or Blizzaga) and absorbs that element when you cast it at him.',
    },
    {
      t: 'p',
      text: 'He is also weak to the opposite element then. With three matching discs he still absorbs that element but is no longer weak to the opposite one; with two matching discs he is immune to it, and with one he resists it.',
    },
    { t: 'p', text: 'Scan shows his elemental strengths and weaknesses.' },
    {
      t: 'p',
      text: 'After six attacks on him, Seymour glows red, starts casting Dispel, and uses Ultima on the party. The glow ends once Ultima has been cast.',
    },
    {
      t: 'p',
      text: 'This Ultima is much weaker than the Sphere Grid one but still does serious damage, roughly 4,000 HP per character. Heal before he casts it.',
    },
    {
      t: 'p',
      text: "Shield can help you survive it, and Lulu's Focus raises your resistance to it as well.",
    },
    {
      t: 'p',
      text: "Aeons work well here, which is rare against Seymour, because he does not banish them. Yuna's Nul spells also reduce the damage.",
    },
    {
      t: 'p',
      text: 'Open with Hastega, Armor Break and Mental Break, and recast whatever Seymour dispels.',
    },
    {
      t: 'p',
      text: 'Hitting the Mortiphasms turns them and makes his strongest spells less likely. Some sit in the back row, so use Wakka or Lulu to reach them.',
    },
    { t: 'list', label: 'Steal', items: ['Shining Gem (common)', 'Supreme Gem (rare)'] },
    { t: 'list', label: 'Drops', items: ['Lv. 3 Key Sphere (common)'] },
  ],
};
