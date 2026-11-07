/**
 * The Youth League Tournament (Yaibal, four mobs, Elma and Lucil on Mushroom Rock Road; our hidden chapter): the guide's document for these fights.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The document follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it)
 * in our own words. **No written walkthrough of the tournament is in the repository's corpus beyond two sentences** (the guides call the fights easy), so every sentence stands on the game's own rows and scripts
 * (`research/re-ffx2-youth-league-tournament.md` §3 to §7) and on the engine's measurements (`tests/unit/chapters/youth-league-engine.test.ts`). Enemy, HP, Steal and Drop are the numbers this game uses; nothing here names
 * where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_YOUTH_LEAGUE_DOC: GuideDoc = {
  id: 'ffx2-youth-league',
  game: 'ffx2',
  bossIds: [
    'x2-yl-yaibal', 'x2-yl-warrior-1a', 'x2-yl-warrior-1b',
    'x2-yl-mage-2a', 'x2-yl-mage-2b', 'x2-yl-veteran-2',
    'x2-yl-warrior-3', 'x2-yl-veteran-3a', 'x2-yl-veteran-3b',
    'x2-yl-slasher-4a', 'x2-yl-slasher-4b', 'x2-yl-master-4',
    'x2-yl-veteran-5a', 'x2-yl-veteran-5b', 'x2-yl-veteran-5c', 'x2-yl-veteran-5d',
    'x2-yl-elma', 'x2-yl-veteran-6a', 'x2-yl-veteran-6b',
    'x2-yl-lucil',
  ],
  blocks: [
    {
      t: 'p',
      text: 'The Youth League has chalked a bracket on the cliff road: seven bouts, one after another, with the road between them in the story and nothing between them here. HP, MP and the bag carry from one to the next.',
    },
    {
      t: 'p',
      text: 'Losing the first bout sends you back to the start. Losing any later one starts that bout again with the party as you entered it, so look after the potions.',
    },
    { t: 'head', at: ['x2-yl-yaibal', 'x2-yl-warrior-1a', 'x2-yl-warrior-1b'], title: 'Yaibal and two recruits', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Yaibal has 4,330 HP and the two League Warriors 422 each. Darkness hits all three at once and ignores Defense, so Rikku and Paine can cast it from the first turn while Yuna waits to heal.',
    },
    {
      t: 'p',
      text: 'Yaibal looks after Yuna. If she falls he raises her with a Phoenix Down two turns in three, and when she is under a quarter of her HP he patches her with a Hi-Potion. He does it for no other girl.',
    },
    {
      t: 'p',
      text: 'A quarter of his other turns is a grenade at all three of you, about five hundred each. The rest are swings.',
    },
    { t: 'head', at: ['x2-yl-mage-2a', 'x2-yl-mage-2b', 'x2-yl-veteran-2'], title: 'Two mages and a veteran', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'A League Mage has 1,020 HP and almost no Defense. It casts fire, ice, thunder or water, at one girl or at all three, and now and then a Confuse that will not take hold at your level.',
    },
    {
      t: 'p',
      text: 'The Veteran has 1,720 HP, and one of its turns in five is a heavy blow on whoever has the least HP.',
    },
    { t: 'head', at: ['x2-yl-warrior-3', 'x2-yl-veteran-3a', 'x2-yl-veteran-3b'], title: 'A recruit and two veterans', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'A plain brawl. The Warrior throws a Hi-Potion at any friend under a quarter of its health, unless you have stolen from it. Darkness ends the bout in a few turns.',
    },
    { t: 'head', at: ['x2-yl-slasher-4a', 'x2-yl-slasher-4b', 'x2-yl-master-4'], title: 'Two slashers and a master', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'A League Slasher has 1,650 HP, swings fast, and one turn in six throws a Flash Bomb: about fifty a girl, and it will not blind anyone at your level.',
    },
    {
      t: 'p',
      text: 'The League Master has 1,732 HP. It picks one element at the start of the bout and sticks to it, at one girl or at all three.',
    },
    { t: 'head', at: ['x2-yl-veteran-5a', 'x2-yl-veteran-5b', 'x2-yl-veteran-5c', 'x2-yl-veteran-5d'], title: 'Four veterans', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Four veterans of 1,720 HP, each with the heavy blow on one turn in five. Darkness reaches all four at once. Heal before you walk into Elma, and again before Lucil: nothing does it for you.',
    },
    { t: 'head', at: ['x2-yl-elma', 'x2-yl-veteran-6a', 'x2-yl-veteran-6b'], title: 'Elma and two veterans', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Elma has 4,882 HP and a Magic Defense of 80. Her first act is a guard over her whole line: Shell, Protect and Regen on her and on both veterans.',
    },
    {
      t: 'p',
      text: 'After that she goes for whichever girl has no Reflect: a fire, ice, thunder or water spell, a grenade at all three, Sleep, Confuse, or Osmose on the girl with the most MP.',
    },
    {
      t: 'p',
      text: 'If all three of you reflect, she can only swing or Dispel one of you. Her Confuse and Sleep can take hold now and then, more often on Yuna, the lowest level of the three.',
    },
    { t: 'head', at: ['x2-yl-lucil'], title: 'Lucil', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Lucil has 7,324 HP, acts quickly and counts to five. On the fifth action she lands Harbinger on a girl who has no Doom yet: a blow of about 180 on a Dark Knight, over 330 on Yuna, and Doom.',
    },
    {
      t: 'p',
      text: 'Nothing in the bag or in the menus cures Doom. It kills in ten and a half seconds, whoever the girl is. Finish Lucil quickly, or raise the girl with a Phoenix Down when it has done its work.',
    },
    {
      t: 'p',
      text: 'Between the beats she wraps herself in a Lunar and a Light Curtain, throws each of the four Gems once for six hits of about a hundred, and one Gold Hourglass that slows you. She drinks a Hi-Potion twice at most.',
    },
    { t: 'hint', kind: 'hint', title: 'Helpful Hint', text: 'Her fall ends the tournament. The results and the closing words follow at once.' },
    {
      t: 'loot',
      rows: [
        { enemy: 'Yaibal', hp: '4,330', steal: 'Chocobo Feather', drop: 'Muscle Belt' },
        { enemy: 'League Warrior', hp: '422', steal: 'Hi-Potion, Grenade', drop: 'Hi-Potion' },
        { enemy: 'League Mage', hp: '1,020', steal: 'Ether, Amulet', drop: 'Hi-Potion' },
        { enemy: 'League Veteran', hp: '1,720', steal: 'M-Bomb, L-Bomb', drop: 'Hi-Potion' },
        { enemy: 'League Slasher', hp: '1,650', steal: 'M-Bomb, L-Bomb', drop: 'Hi-Potion' },
        { enemy: 'League Master', hp: '1,732', steal: 'Phoenix Down', drop: 'Ether' },
        { enemy: 'Elma', hp: '4,882', steal: 'Healing Spring', drop: 'Chocobo Feather' },
        { enemy: 'Lucil', hp: '7,324', steal: 'Chocobo Feather', drop: 'Circlet' },
      ],
    },
  ],
};
