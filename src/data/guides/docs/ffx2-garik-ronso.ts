/**
 * Mt. Gagazet, Garik Ronso and the Ronso Youths (FFX-2 Chapter 3, the mission "Battle Blockade"; our hidden chapter): the guide's document for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The document follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it) in our
 * own words. **Jegged's Chapter 3 page for the summit was read** (saved outside the repo, `research/re-ffx2-garik-ronso.md` §1 summarises it): it says the fight changes with the Ronso's trust, that the easy Garik casts Mighty Guard
 * only after being Confused, that Bane Lance inflicts Curse and another attack Darkness, that the Youths' MP Blowout empties one character's MP, and that an Icy Gleam and a Mythril Bangle are worth stealing; every sentence below
 * stands on the game's own rows and scripts (`research/re-ffx2-garik-ronso.md` §0, §2 and §3), which agree with it. Where the guide's loot table prints a rare Mythril Bangle x2 and the game's row says x1, the row is the number used
 * (the Steal cell names the item only). Enemy, HP, Steal and Drop are the numbers this game uses. Nothing here names where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move
 * recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_GARIK_RONSO_DOC: GuideDoc = {
  id: 'ffx2-garik-ronso',
  game: 'ffx2',
  bossIds: ['x2-garik-ronso', 'x2-ronso-youth-a', 'x2-ronso-youth-b', 'x2-garik-ronso-bout', 'x2-ronso-youth-bout'],
  blocks: [
    {
      t: 'p',
      text: 'At the top of the mountain Garik has shut the teleporters and waits with his lance across the path. What he brings depends on how the Ronso were treated on the way up.',
    },
    { t: 'head', at: ['x2-garik-ronso', 'x2-ronso-youth-a', 'x2-ronso-youth-b'], title: 'Garik Ronso and the Ronso Youths', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'With the Ronso’s trust low, Garik brings two Ronso Youths and the fight is a real one: 15,000 HP between the three, and a much longer list of tricks.',
    },
    {
      t: 'p',
      text: 'Garik curses first. If one of the girls is wearing Black Mage and is not cursed yet, his lance goes to her, Yuna before Rikku before Paine. A cursed girl cannot change dresspheres, so stay out of Black Mage.',
    },
    {
      t: 'p',
      text: 'On his seventh turn, and every seventh after it, he casts Mighty Guard on all three of them: Shell, Protect, Regen and Haste, and higher Defense, Magic Defense and Evasion. A Dispel strips the first four.',
    },
    {
      t: 'p',
      text: 'Darkness ignores Defense and is not turned aside by their Shell or Protect, and it hits all three at once.',
    },
    {
      t: 'p',
      text: 'Otherwise he swings three turns in four and blinds a girl one turn in four, until all of them are dark. Every blow of his is physical, so Protect halves it. He cannot be slowed or stopped, and a delay does nothing to him.',
    },
    {
      t: 'p',
      text: 'Each Youth swings, and one turn in eight it drinks every point of MP the girl with the most has. A delay does slow a Youth. Be sure to Steal an Icy Gleam from Garik and a Mythril Bangle from a Youth before the end.',
    },
    { t: 'head', at: ['x2-garik-ronso-bout', 'x2-ronso-youth-bout'], title: 'The Bout', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'With the Ronso’s trust high, Garik brings one Youth, 10,940 HP between them, and he holds back. He never casts Mighty Guard, curses nobody and blinds nobody.',
    },
    {
      t: 'p',
      text: 'He repeats one beat of eight turns: Protect on himself, three blows, Shell on himself, three blows. The Youth only swings. Keep the girls healed and it is over quickly.',
    },
    {
      t: 'loot',
      rows: [
        { enemy: 'Garik Ronso', hp: '6,880', steal: 'Icy Gleam', drop: 'Shining Bracer' },
        { enemy: 'Ronso Youth', hp: '4,060', steal: 'Mythril Bangle', drop: 'Remedy' },
      ],
    },
  ],
};
