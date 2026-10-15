/**
 * Angra Mainyu at the Bikanel excavation camp (FFX-2 Chapter 5; our hidden chapter): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Layout: `../doc-types.ts`. The page follows the FFX-2 encounter guides' shape (a header, the Enemy / HP / Steal / Drop table, the advice in the order
 * a player meets it) in our own words. **No guide page for this fight was read** (this session's network policy refused the guide hosts, `research/ffx2-angra-mainyu.md` §0.2), so the page is built from
 * the research note, which read the written sources through a search tool's summaries; it is to be reconciled with a guide's page when one is read. Enemy, HP, Steal and Drop are the numbers this
 * game uses (§2.1, §2.2, §2.3). Nothing here names where the advice came from (`tests/unit/guide-doc-words.test.ts`), and nothing in a document is a move recommendation of ours.
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_ANGRA_MAINYU_DOC: GuideDoc = {
  id: 'ffx2-angra-mainyu',
  game: 'ffx2',
  bossIds: ['x2-angra-mainyu'],
  blocks: [
    {
      t: 'p',
      text: 'Once the ten Cactuar Gatekeepers have calmed the sandstorm, the fiend it was hiding turns on the Al Bhed excavation camp, and the Gullwings stand in its way.',
    },
    { t: 'head', at: ['x2-angra-mainyu'], title: 'Angra Mainyu', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Angra Mainyu fights with two arms that act on their own. Tawrich, the right arm, cannot be hurt by magic; Zarich, the left, cannot be hurt by physical blows. Only the body has to fall.',
    },
    {
      t: 'p',
      text: "Its deadliest move is Perdition's Flame: ten hits on random members of the party, each taking a share of her maximum HP, landing harder on a girl the more times she is hit. It can only use it while both arms are up.",
    },
    {
      t: 'p',
      text: 'When an arm falls, Angra Mainyu raises it again with Full-Life as long as it has the MP, so the arms will come back. Every turn it spends reviving is a turn it does not attack.',
    },
    {
      t: 'p',
      text: 'Otherwise it casts Demi, Flare and Curaga. Tawrich punches and breathes Bloody Breath, which brings Confusion, Silence, Darkness and Poison.',
    },
    {
      t: 'p',
      text: 'Zarich casts the elemental spells and Glimmer of Despair, which drains MP and lowers Strength, Magic, Defense and Magic Defense.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ul',
      items: [
        'Two Dark Knights casting Darkness is the core of the fight: it hits all three at once and passes both arms\' immunities.',
        "Keep Protect on everyone: it halves each hit of Perdition's Flame, and more HP does nothing against it.",
        'Have a White Mage clear Bloody Breath\'s statuses quickly, revive anyone who falls, and keep the Dark Knights topped up, since Darkness costs them HP.',
        'Bring Mega-Potions, X-Potions and Phoenix Downs; the fight is long.',
      ],
    },
    {
      t: 'loot',
      rows: [
        { enemy: 'Angra Mainyu', hp: '333,444', steal: 'Megalixir', drop: 'Ribbon' },
        { enemy: 'Tawrich', hp: '5,440', steal: 'None', drop: 'None' },
        { enemy: 'Zarich', hp: '5,440', steal: 'None', drop: 'None' },
      ],
    },
  ],
};

export default FFX2_ANGRA_MAINYU_DOC;
