/**
 * Yuna's Ballad (the possessed Rikku, then the possessed Paine, fought by Yuna alone; our hidden chapter): the guide's document for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The document follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it)
 * in our own words. **No written walkthrough of these two duels is in the repository's corpus**, so every sentence stands on the game's own rows and scripts (`research/re-ffx2-yunas-ballad.md` §4, §6 and §7) and on the
 * wiki-level Den of Woe note (`research/ffx2-gippal-den-of-woe.md` §2 to §5). Enemy, HP and Drop are the numbers this game uses; neither fighter has a Steal in this game (the rows' Lore items have no item here). Nothing here names
 * where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_YUNAS_BALLAD_DOC: GuideDoc = {
  id: 'ffx2-yunas-ballad',
  game: 'ffx2',
  bossIds: ['x2-possessed-rikku', 'x2-possessed-paine'],
  blocks: [
    {
      t: 'p',
      text: 'In the cave under Mushroom Rock Road the pyreflies have taken Rikku and Paine. Each thinks Yuna is a guard with a gun, and Yuna faces them alone, one after the other, with no rest between.',
    },
    { t: 'head', at: ['x2-possessed-rikku'], title: 'Rikku', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Nothing heals between the two fights, so what you spend on Rikku is gone when Paine arrives. Drink a potion whenever you drop under half.',
    },
    {
      t: 'p',
      text: 'Yuna begins as a White Mage, who has no attack. Change to a Warrior on the first turn, or to a Gunner, and then Attack. Rikku has 7,800 HP and a Magic Defense of 82, so a blade does the work.',
    },
    {
      t: 'p',
      text: 'Each turn Rikku picks a girl and then rolls. Four times in ten it is Spider Attack, two quick hits. Twice in ten it is a Grenade. Once in ten each, she throws Bomb Core, Arctic Wind, Lightning Marble or Dragon Scale.',
    },
    {
      t: 'p',
      text: 'The four throws always land for the same size, between 281 and 317, and neither Shell nor Protect changes them. Spider Attack and the Grenade are blows, so Protect halves those.',
    },
    {
      t: 'p',
      text: 'She acts about every four seconds. She can be put to Sleep, slowed, blinded, confused or enraged, but not Stopped, Silenced or poisoned.',
    },
    { t: 'head', at: ['x2-possessed-paine'], title: 'Paine', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Paine has 9,200 HP and one move: a sword stroke at whoever has the most HP, about every seven seconds. There is time to heal between strokes and time to hit.',
    },
    {
      t: 'p',
      text: 'Her Defense is 70, so a blade scrapes, but her Magic Defense is only 7, so anything magical goes straight through. She takes the same ailments as Rikku: Sleep, Slow, Darkness, Confuse and Berserk all land.',
    },
    {
      t: 'p',
      text: 'You arrive with the HP and MP you left Rikku with. If you lose to Paine you try her again from there, not from the start.',
    },
    {
      t: 'loot',
      rows: [
        { enemy: 'Rikku', hp: '7,800', steal: 'None', drop: 'None' },
        { enemy: 'Paine', hp: '9,200', steal: 'None', drop: 'Champion Belt' },
      ],
    },
  ],
};
