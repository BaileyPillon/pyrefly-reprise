/**
 * Bikanel Desert, Angra Mainyu (FFX-2 Chapter 5, the mission "Showdown in the Sands"; our hidden chapter): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The page follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order a player meets it) in
 * our own words, and Jegged's Chapter 5 page (the project's standing rule: the strategy guide follows Jegged's encounter guides, `research/ffx2-angra-mainyu.md` §0.2). Enemy, HP, Steal and Drop are the numbers this
 * game uses (the game's own rows, `research/re-ffx2-angra-mainyu.md`). Nothing here names where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_ANGRA_MAINYU_DOC: GuideDoc = {
  id: 'ffx2-angra-mainyu',
  game: 'ffx2',
  bossIds: ['x2-angra-mainyu', 'x2-zarich', 'x2-tawrich'],
  blocks: [
    {
      t: 'p',
      text: 'The battle begins as soon as the Bikanel Desert is picked on the map: the fiend the Cactuars sealed away has turned on the Al Bhed dig camp.',
    },
    { t: 'head', at: ['x2-angra-mainyu'], title: 'Angra Mainyu', tag: 'Boss Battle' },
    { t: 'p', text: 'Be sure to Steal its Megalixir before the fight ends.' },
    {
      t: 'p',
      text: 'This is one of the harder boss fights so far if you walk in without a plan. There are three targets: Angra Mainyu itself, and its two arms, Zarich on the left and Tawrich on the right.',
    },
    {
      t: 'p',
      text: 'Its turns follow a pattern. It opens with Perdition’s Flame, ten hits on random girls, and uses it again a few turns later and then every fifteenth turn.',
    },
    {
      t: 'p',
      text: 'In between it rolls: most often Demi, then Flare, Curaga on one of its arms, or Bio. If an arm has fallen it brings it back with Full-Life before anything else.',
    },
    {
      t: 'p',
      text: 'Once its MP is under 200 it drinks the party’s with Osmose instead. If it is out of MP and yours is empty too, it just repeats Osmose and does almost nothing.',
    },
    {
      t: 'p',
      text: 'Zarich, the left arm, shrugs off blows. It casts Firaga, Waterga, Thundaga and Blizzaga in turn, and Glimmer of Despair lowers the party’s stats and MP.',
    },
    {
      t: 'p',
      text: 'Tawrich, the right arm, shrugs off spells. It throws punches, and every eighth turn it breathes Bloody Breath: poison, blindness, silence and confusion on everyone.',
    },
    {
      t: 'p',
      text: 'Two Dark Knights and one healer make this fight much easier. Darkness is neither a blow nor a spell, so it hits all three at once, and it ignores Defense. Silence and blindness do not stop it.',
    },
    {
      t: 'p',
      text: 'Keep the healer alive and out of Silence, with Mega-Potions in hand for the turn after a Flame. Protect halves Perdition’s Flame; Shell halves the spells.',
    },
    {
      t: 'p',
      text: 'The other way is to drain its MP first (a Gunner’s Target MP, a Samurai’s Magicide, a Thief’s Pilfer MP or a Gun Mage’s Absorb) and keep your own low, so that it is stuck on Osmose.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Angra Mainyu', hp: '333,444', steal: 'Megalixir', drop: 'Ribbon' }],
    },
  ],
};
