/**
 * The hidden Shinryu chapter (the Monster Arena's deep-water dragon): the guide's one page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered
 * steps. The strategy is the public guide's line (Jegged's Shinryu page: strongest weapons, defeat it quickly), in our own words, and it is the line `docs/handoff/ch-shinryu.md` section 5 plays on the real engine. Every figure is
 * the game's own (`research/re-ffx-shinryu.md`: the HP, the 99,999 cap, the 21 blows), and the page prints the Steal and the Drops the chapter pays.
 *
 * **Not modelled, so not promised:** Shinryu's gear drop (the ability rows of the drop were not read) and the Monster Arena's capture price.
 */

import type { GuideDoc } from '../doc-types.ts';

export const SHINRYU_DOC: GuideDoc = {
  id: 'shinryu',
  game: 'ffx',
  bossIds: ['shinryu'],
  blocks: [
    { t: 'head', at: ['shinryu'], title: 'Shinryu', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '2,000,000' },
    {
      t: 'p',
      text: 'Shinryu is the dragon the arena keeps at the bottom of the sea. It has no weakness and almost no ailment it can catch, so this is a fight of blows, and of one short race. Only Tidus, Wakka and Rikku can swim, so they are the party.',
    },
    { t: 'h3', text: 'Before it moves' },
    {
      t: 'p',
      text: 'Bring your strongest weapons. While its wielder is healthy, a blow from a Celestial weapon is the 99,999 cap whatever Shinryu wears, and it takes 21 of them to end Shinryu. Everything else in this fight is about getting them in before it acts.',
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'Each turn it does one of three things, a third of the time each. Shining is eight bursts of light, each at one of you. Its claw is a plain blow at one of you. The Eraser points at one of you.',
    },
    {
      t: 'p',
      text: 'The Eraser is a Petrify that always lands. Ribbon and Stoneproof do not stop it, and in this water the stone shatters: the swimmer is gone for the rest of the fight.',
    },
    {
      t: 'p',
      text: 'When only one of you is left, it stops using the Eraser. The last swimmer standing is only clawed and burst with light.',
    },
    { t: 'h3', text: 'Its answer' },
    {
      t: 'p',
      text: 'Whenever a blow hurts it, it answers with a claw at the one who struck. The claws are small beside your armour, but they add up over twenty-one blows, so keep everyone above half and stand up whoever falls.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Strike with your Celestial weapons every turn; Tidus uses Quick Hit, which is the same blow with a shorter recovery.',
        'Keep everyone above half with a potion, and stand up a swimmer who falls with a Phoenix Down.',
        'Do not try to guard against the Eraser. Win before it points, and keep fighting if it takes one of you.',
        'With one swimmer left, the Eraser is gone: finish the fight.',
      ],
    },
    { t: 'p', text: 'It pays no gil. Steal a Gambler\'s Spirit, or a Three Stars if you are lucky; it leaves Wings to Discovery, or Dark Matter, and twice as much if the last blow is an overkill.' },
    { t: 'list', label: 'Steal', items: ['Gambler\'s Spirit (common)', 'Three Stars (rare)'] },
    { t: 'list', label: 'Drops', items: ['Wings to Discovery (common)', 'Dark Matter (rare)'] },
  ],
};

export default SHINRYU_DOC;
