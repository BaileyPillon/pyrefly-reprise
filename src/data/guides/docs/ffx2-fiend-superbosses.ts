/**
 * The Fiend Arena Superbosses, Almighty Shinra and the Major Numerus (FFX-2; our hidden chapter): the guide's document for these two fights.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The document follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it) in our
 * own words. **Jegged's Fiend Arena pages were read for the research note** (kept outside the repo; `research/re-ffx2-fiend-arena-superbosses.md` section 6 compares them with the files: Shinra's loop agrees move for move, Unum's
 * pattern agrees, the guide's "unblockable" Final Impact is a physical row here, and the Farplane Cup's last team is listed there as Unum alone while the files hold all four heads); they were NOT read again for this page, and
 * every sentence below stands on the game's own rows and scripts (`research/re-ffx2-fiend-arena-superbosses.md` sections 0 to 4), which agree with them. Enemy, HP, Steal and Drop are the numbers THIS game uses: the heads' rare
 * drops of the arena's guide are not in our item tables (the Enterprise, the Iron Duke, the Invincible and the Ragnarok are unbuilt items), so a head's Drop cell says None and Shinra's names the Dark Matter that is built. Nothing
 * here names where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_FIEND_SUPERBOSSES_DOC: GuideDoc = {
  id: 'ffx2-fiend-superbosses',
  game: 'ffx2',
  bossIds: ['x2-almighty-shinra', 'x2-numerus-unum', 'x2-numerus-duo', 'x2-numerus-tria', 'x2-numerus-quattour'],
  blocks: [
    {
      t: 'p',
      text: 'Two fights wait at the top of the arena, and the arena mends the party between them. The first is Shinra, grown to the size of the hall. The second is the Major Numerus, four heads on one body.',
    },
    { t: 'head', at: ['x2-almighty-shinra'], title: 'Almighty Shinra', tag: 'Boss Battle' },
    {
      t: 'loot',
      rows: [{ enemy: 'Almighty Shinra', hp: '275,000', steal: 'Turbo Ether', drop: 'Dark Matter x2' }],
    },
    {
      t: 'p',
      text: 'Shinra has 255 in Strength, Defense, Magic, Magic Defense and Agility, regains life on his own and casts for free. With Defense and Magic Defense at 255, ordinary blows barely mark him. A Dark Knight’s Darkness ignores Defense and is the way through.',
    },
    {
      t: 'p',
      text: 'He repeats six beats: Clione, a strike, Ultima, a strike, a break, then Haste. Clione is ten blows at once on random girls, and each strike and break goes to one girl.',
    },
    {
      t: 'p',
      text: 'Under half his life the break becomes Fireworks, which hits all three of you. Under a quarter, Ultima becomes Final Impact: fourteen blows, the first an eighth of a girl’s life and magic and each one after it heavier.',
    },
    {
      t: 'p',
      text: 'When he is already hasted, the sixth beat is a Final Impact instead of a second Haste. His Full Break lowers four of a girl’s stats.',
    },
    {
      t: 'p',
      text: 'Protect halves his strikes and his break and takes a fifth to a half off Clione, Fireworks and Final Impact. Shell halves Ultima before the 9,999 cap.',
    },
    { t: 'head', at: ['x2-numerus-unum', 'x2-numerus-duo', 'x2-numerus-tria', 'x2-numerus-quattour'], title: 'Major Numerus', tag: 'Boss Battle' },
    {
      t: 'loot',
      rows: [
        { enemy: 'Unum', hp: '555,555', steal: 'Mega-Potion', drop: 'None' },
        { enemy: 'Duo', hp: '666,666', steal: 'X-Potion', drop: 'None' },
        { enemy: 'Tria', hp: '666,666', steal: 'Mega Phoenix', drop: 'None' },
        { enemy: 'Quattour', hp: '777,777', steal: 'Elixir', drop: 'None' },
      ],
    },
    {
      t: 'p',
      text: 'The four heads act at the same time, each on its own loop, and the fight ends the moment the last of them falls. They take no damage from Fire, Ice, Thunder, Water or Gravity, so those spells do nothing to them; Darkness has no element and lands in full.',
    },
    {
      t: 'p',
      text: 'Each head has a Command that takes four and a half seconds to charge. It does between about 13,000 and 99,999 damage to a Lv 99 girl and puts her down, and Protect and Shell change nothing about it.',
    },
    {
      t: 'p',
      text: 'The four loops reach a Command about once every ten seconds between them, and one is charging about a third of the time. Plan for the blows around the Commands, and for the girl the next Command takes.',
    },
    { t: 'h3', text: 'Unum' },
    {
      t: 'p',
      text: 'Seven beats: Radis Command, a Sparkler, then a Dispel on one girl. Next Shell on all four heads if any of them lacks it, White Highwind on all four if Unum is under an eighth of its life, a Sparkler, and Protect on all four if any lacks it.',
    },
    {
      t: 'p',
      text: 'Wherever the Shell, the White Highwind or the Protect is not needed, Unum swings a Sparkler instead.',
    },
    { t: 'h3', text: 'Duo' },
    {
      t: 'p',
      text: 'Nine beats, and for the first eight it flips a coin: Black Sky or Bio, Flare or Break, Ultima or Confuse, Sleep or Demi, Berserk or Black Sky, Blind or Flare, Ultima or Silence, Slowga or Demi. The ninth is Venam Command, which poisons all three.',
    },
    {
      t: 'p',
      text: 'Break turns a girl to stone, and a Remedy cures it. A girl left as stone is out of the fight.',
    },
    { t: 'h3', text: 'Tria' },
    {
      t: 'p',
      text: 'Six beats: Firaga or Holy, Blizzaga or Holy, Fulmen Command, Thundaga or Holy, Waterga or Holy, then Absorb on one girl. Fulmen Command is a Thunder blow of power 255, the heaviest of the four Commands.',
    },
    { t: 'h3', text: 'Quattour' },
    {
      t: 'p',
      text: 'Nine beats and no coin: Fireworks, Mortis Command, Absorb, Meteor, Fireworks, Absorb, Ultima, Fireworks, Absorb. Meteor is twelve blows spread over the party, and Ultima and Fireworks hit all three.',
    },
  ],
};
