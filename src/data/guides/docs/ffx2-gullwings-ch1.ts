/**
 * Gullwings, Chapter 1 (Boris, the Flame Dragon, the Guardian Beast and YSLS-Zero; our hidden chapter): the guide's page for these four fights.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The page follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it) in our
 * own words. **The corpus holds no written page for these four hotspots** (the Chapter 1 guides were read for the research note, `research/re-ffx2-gullwings-chapter1.md` §2, not copied), so every sentence stands on the game's own rows
 * and scripts (§0, §3 and §4) and on the engine's measurements (`tests/unit/chapters/gullwings-ch1-engine.test.ts`). Enemy, HP, Steal and Drop are the numbers this game uses. Nothing here names where the advice came from
 * (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_GULLWINGS_CH1_DOC: GuideDoc = {
  id: 'ffx2-gullwings-ch1',
  game: 'ffx2',
  bossIds: ['x2-boris', 'x2-flame-dragon', 'x2-guardian-beast', 'x2-ysls-zero'],
  blocks: [
    {
      t: 'p',
      text: 'Four hotspots, four fights, one after another. Between them the girls are patched up and the bag carries, so look after the Phoenix Downs. A defeat sends you back to the start of that fight, and a defeat in the first fight to the start of the chapter.',
    },
    { t: 'head', at: ['x2-boris'], title: 'Boris', tag: 'Boss Battle' },
    { t: 'p', text: 'The Floating Ruins on Mt. Gagazet. Be sure to Steal his Remedy before the fight ends.' },
    {
      t: 'p',
      text: 'Boris has 480 HP, almost no Defense, and he is weak to both Fire and Ice. He claws three times, and each claw is two hits. On his fourth turn he spits Sticky End over all three girls, about fifty each, and it may Stop one. He does it only once.',
    },
    {
      t: 'p',
      text: 'After that it is claws, and one turn in four a bite that ignores Defense. A Remedy frees a Stopped girl. Sleep, poison, confusion, Berserk and Curse do nothing to him.',
    },
    { t: 'loot', rows: [{ enemy: 'Boris', hp: '480', steal: 'Remedy', drop: 'Star Pendant' }] },
    { t: 'head', at: ['x2-flame-dragon'], title: 'Flame Dragon', tag: 'Boss Battle' },
    { t: 'p', text: 'The cave at Besaid. Be sure to Steal its Hi-Potion before the fight ends.' },
    {
      t: 'p',
      text: 'The Flame Dragon has 980 HP. It is weak to Ice and takes half from Fire, and Gravity does nothing. Its first turn is always Flame Breath on all three girls, and Shell halves it.',
    },
    {
      t: 'p',
      text: 'After the breath it only strikes, and always the girl with the most HP, so the girl in front is the one to keep healed. When it has under a hundred HP left it breathes once more.',
    },
    { t: 'loot', rows: [{ enemy: 'Flame Dragon', hp: '980', steal: 'Hi-Potion', drop: 'Red Ring' }] },
    { t: 'head', at: ['x2-guardian-beast'], title: 'Guardian Beast', tag: 'Boss Battle' },
    { t: 'p', text: 'The ruins at Zanarkand. Be sure to Steal its Defense Veil before the fight ends.' },
    {
      t: 'p',
      text: 'The Guardian Beast has 2,886 HP and is weak to Fire, Ice, Thunder, Water and Holy alike. It works to a beat of four: three blows, then a Curse on a girl who does not carry one. A cursed girl cannot change dress, and Holy Water or a Remedy lifts it.',
    },
    {
      t: 'p',
      text: 'When it is under a third of its HP, the fourth turn of the beat is Damocles Photon instead: half of every girl’s maximum HP, all three at once. Shell halves it, so have everyone healed before it comes. Berserk lands on it only now and then.',
    },
    { t: 'loot', rows: [{ enemy: 'Guardian Beast', hp: '2,886', steal: 'Defense Veil', drop: 'Amulet' }] },
    { t: 'head', at: ['x2-ysls-zero'], title: 'YSLS-Zero', tag: 'Boss Battle' },
    { t: 'p', text: 'Kilika’s approach. Be sure to Steal its Mythril Gloves before the fight ends.' },
    {
      t: 'p',
      text: 'YSLS-Zero has 1,935 HP, a Defense of 104 and a Magic Defense of 3, and it cannot move. Nearly half its turns are Haymaker, two hits that never miss. The rest are plain blows, except one turn in five.',
    },
    {
      t: 'p',
      text: 'That one is Blast Punch: half of one girl’s maximum HP, which delays her and which neither Protect nor Shell reduces.',
    },
    {
      t: 'p',
      text: 'It has no weakness, and Darkness lands on it. Death, Sleep, Silence, poison, confusion, Berserk, Stop and Doom do not.',
    },
    { t: 'loot', rows: [{ enemy: 'YSLS-Zero', hp: '1,935', steal: 'Mythril Gloves', drop: 'Wristband' }] },
  ],
};
