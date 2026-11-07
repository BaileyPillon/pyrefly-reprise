/**
 * The hidden Spherimorph chapter (the guardian of the spring in the Macalania Woods): the guide's one page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered
 * steps. **Jegged's Macalania Woods page is not in the repository's corpus**, so every sentence here is our own and stands on the game's own files (`research/re-ffx-spherimorph.md`): the four states and the answers are the
 * note's section 4, the figures its sections 1 and 6 (against the Macalania preset, an `[estimate]`, so left out). Where a written walkthrough and the file differ the file wins: a hit with the weakness is not answered by
 * a spell, it changes it, and Armored divides a plain blow by three (the note's sections 7 and 1.2).
 *
 * **Not modelled, so not promised:** the gear Spherimorph drops (a Strike weapon, a Ward armour). The page prints the Steal and the Drops the chapter pays.
 */

import type { GuideDoc } from '../doc-types.ts';

export const SPHERIMORPH_DOC: GuideDoc = {
  id: 'spherimorph',
  game: 'ffx',
  bossIds: ['spherimorph'],
  blocks: [
    { t: 'head', at: ['spherimorph'], title: 'Spherimorph', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '12,000' },
    {
      t: 'p',
      text: 'The guardian of the spring. It is Armored, so a plain blow is divided by three, and it takes damage from one element only. It takes in the other three and Holy: what you cast of those heals it.',
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'It Attacks someone at random. Below half its HP, half of its turns are Press instead: half of everyone\'s current HP on all three of you, less with Protect. It never casts a spell on its own turn; every spell it casts is an answer.',
    },
    { t: 'h3', text: 'Its answers' },
    {
      t: 'p',
      text: 'A plain blow is answered with a spell, aimed at whoever struck. The spell is of the element opposite its weakness: Fire and Ice are a pair, Thunder and Water the other. That is the clue.',
    },
    {
      t: 'p',
      text: 'Magic of a wrong element heals it and is answered on all three of you. Magic of no element, and a Scan, are answered on all three too. Bio, Slow, Dispel and the like draw no answer. With an aeon on the field the answer is the weaker spell.',
    },
    {
      t: 'p',
      text: 'Hit it with its weakness and it is not answered by a spell. It changes instead: a new element drawn from all four, one time in four the same one. An elemental weapon of its weakness changes it too; one of another element heals it.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Strike it with a plain blow from an unelemented weapon, and read the spell that answers. Tidus does this best; his blow is divided by three, but it is only for the clue.',
        'Cast the opposite of that spell with Lulu, at the highest tier she has. That is its weakness, and the hit changes it.',
        'Probe again before every cast. Never cast without a clue, and never cast the same element twice on a hope: a wrong spell heals it and costs the whole line.',
        'Keep Yuna healing. Below half its HP, cast Protect on the line before Press, and Cura after it.',
        'For damage that does not need a clue, break its Armor with Auron: his blows then land whole, and a plain blow only draws the clue.',
        'Stand the fallen up with a Phoenix Down. It inflicts no status, so there is nothing to cure.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Ether (common)', 'Turbo Ether (rare)'] },
    { t: 'list', label: 'Drops', items: ['Lv. 2 Key Sphere'] },
  ],
};

export default SPHERIMORPH_DOC;
