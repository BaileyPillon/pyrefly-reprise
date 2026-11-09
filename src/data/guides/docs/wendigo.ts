/**
 * The hidden Wendigo chapter (Wendigo and its two Guado Guardians on frozen Lake Macalania): the guide's one page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered
 * steps. **Jegged's Lake Macalania page was read** (it is not in this repository's corpus) **and every sentence here is our own**, standing on the game's own files (`research/re-ffx-wendigo-lake-macalania.md`): the turn
 * mix and the arms are the note's section 4.2 and 4.3, the Guardians' script its section 4.4, the figures its sections 1 and 6 (against the Macalania preset, an `[estimate]`). Where a written walkthrough and the file
 * differ the file wins: the Guardians cast no Haste and Wendigo has no weakness (the note's section 7).
 *
 * **Not modelled, so not promised:** the gear Wendigo drops (Counterattack and Piercing weapons, SOS Haste and HP +10 percent armour, per the guides). The page prints the Steal and the Drops the chapter pays.
 */

import type { GuideDoc } from '../doc-types.ts';

export const WENDIGO_DOC: GuideDoc = {
  id: 'wendigo',
  game: 'ffx',
  bossIds: ['wendigo'],
  blocks: [
    { t: 'head', at: ['wendigo'], title: 'Wendigo', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '18,000' },
    {
      t: 'p',
      text: 'A brute of the frozen lake, with two Guado Guardians at its sides. It has no Defense and no weakness; it has a punch that kills a full-HP member, and the Guardians exist to keep it furious.',
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'Above half HP, two turns in three it punches a random member for about 1,700 to 2,000, and on the third it throws the Double Punch at whoever has the least HP: about 2,500 to 3,000, and it never misses.',
    },
    {
      t: 'p',
      text: 'Below half it settles into a cycle of seven turns: arms up for three, arms down, then three attacks. With its arms up, every physical blow it takes is answered by a Counter Punch of about 2,000 to 2,500 that never misses.',
    },
    { t: 'h3', text: 'The Guardians' },
    {
      t: 'p',
      text: 'They cast Berserk on Wendigo (it then throws only its plain punch and never raises its arms), cure its blindness with Eye Drops, throw Blizzara and Thundara for about 250 to 330, and drink a potion for 1,000 when hit.',
    },
    {
      t: 'p',
      text: 'While its arms are up they Berserk your party. When one falls it casts Protect on Wendigo, the other Shell, unless it was turned to stone. A Steal ends a Guardian\'s potions; a Petrify Grenade reaches both.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Rikku opens with a Petrify Grenade. Both Guardians turn to stone, and there is no Berserk, no Eye Drops and no last shield. If a Guardian is still up, Steal from it and strike it first.',
        'Tidus makes way for Auron, and Auron puts Power Break on Wendigo: every blow it throws is halved.',
        'Rikku makes way for Wakka, and Wakka puts Dark Attack on it: its ordinary punches miss about nine times in ten.',
        'Yuna puts Protect on each of you. With Power Break and Protect together a punch is about 400 to 500.',
        'Below half, wait out the three turns its arms are up, or send an aeon. Do not swing while they are.',
        'Stand the fallen up with a Phoenix Down, cure Berserk with Esuna, and keep everyone above one blow.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Hi-Potion (common)', 'X-Potion (rare)'] },
    { t: 'list', label: 'Drops', items: ['Power Sphere'] },
  ],
};

export default WENDIGO_DOC;
