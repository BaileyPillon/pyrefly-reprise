/**
 * The hidden Jenova LIFE chapter (the boss at the altar of the Forgotten Capital): the guide's one page for this fight.
 *
 * **Game case: FF7 only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, MP, what she drops), the advice in order, the strategy as numbered steps.
 * The strategy is the public guides' line in our own words (blows and Limit breaks, not spells; Quake2 as a free opener; MBarrier and Cure2 against Aqualung; never Water at her), and it is the line
 * `docs/handoff/ch-jenova-life.md` plays on the real engine and measures. Every figure is the note's (`research/ff7-jenova-life.md`: the HP, the MP, the three moves' costs, the dial's steps, the drop).
 */

import type { GuideDoc } from '../doc-types.ts';

export const FF7_JENOVA_LIFE_DOC: GuideDoc = {
  id: 'ff7-jenova-life',
  game: 'ff7',
  bossIds: ['jenova-life'],
  blocks: [
    { t: 'head', at: ['jenova-life'], title: 'Jenova LIFE', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '10,000' },
    { t: 'field', label: 'MP', value: '300' },
    {
      t: 'p',
      text: 'She rises from the black water of the altar with three moves, all of them Water magic. You cannot run from her, and you do not beat her with spells.',
    },
    { t: 'h3', text: 'Her moves' },
    {
      t: 'p',
      text: 'Blue Light, for 8 MP, strikes one of you; one time in five she throws a second at another of you in the same turn. Blue Flame, for 12 MP, strikes one of you harder.',
    },
    {
      t: 'p',
      text: 'Every few turns she throws Aqualung, for 34 MP, at all three of you at once: about a thousand each. The lower her health, the sooner and the more often it comes.',
    },
    { t: 'h3', text: 'Her Reflect' },
    {
      t: 'p',
      text: 'The first spell that hits her lands. A moment later she casts Reflect on herself, for 30 MP, and it stays. After that every spell you cast at her turns back on whoever cast it, with the damage worked out against them.',
    },
    {
      t: 'p',
      text: 'A blow is not a spell, and nor is a Limit break. Attack, and spend your Limit gauges on Blade Beam, Climhazzard, Satellite Beam and Tifa\'s chain.',
    },
    {
      t: 'p',
      text: 'Earth is her weakness and Water heals her. Quake2 before the Reflect is a free extra hit; after it, put the spells away.',
    },
    { t: 'h3', text: 'Her MP' },
    {
      t: 'p',
      text: 'She spends her 300 MP on what she does and keeps 30 back for the Reflect. A long fight runs her dry, and at 7 MP or less she cannot do anything she scripts.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Open with Quake2 on her weakness if you like. It is one free hit.',
        'Then Attack, and use each Limit break the moment its gauge is full.',
        'Put MBarrier on all three of you early: it halves Blue Light, Blue Flame and Aqualung.',
        'Heal with Cure2 or a Hi-Potion when a bar drops under half, and stand the fallen up with a Phoenix Down.',
        'Never cast at her once her Reflect is up, and never aim Water at her.',
      ],
    },
    { t: 'list', label: 'Drops', items: ['Wizard Bracelet'] },
  ],
};

export default FF7_JENOVA_LIFE_DOC;
