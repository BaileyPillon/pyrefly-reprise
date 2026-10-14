/**
 * Tourist Trap (the optional FFX-2 mission in the Cavern of the Stolen Fayth; our hidden chapter): the guide's page for this fight.
 *
 * **Game case: FFX-2 only** (AGENTS.md rule 14). Jegged's page for this mission is not in `research/jegged-encounter-guides-ffx2.md`, so this page follows the wiki's Cavern page,
 * FFExodus's Chapter 3 walkthrough and SinirothX's *Enemy Encyclopedia* (`research/ffx-yojimbo.md` section 8.2, `research/ffx2-fallen-aeons.md` section 7.2) in our own words, in the order
 * Jegged's pages use (layout: `../doc-types.ts`): the mission and the preparation, then the fight. Enemy, HP, Steal and Drop are the numbers this game uses: 22,000, Power Wrist
 * (common and rare) and Recovery Bracer (common and rare). The mission reward (the Tetra Master Garment Grid and the Star Bracer) is left out: the results screen does not show a grid.
 * The Star Pendant and the Glass Buckle the sources name for Poison are not in this game's accessory table, so the answer given is Esuna, a Remedy and the Dark Knight's Poisonproof.
 *
 * The panel opens at the top for the whole fight (one boss id).
 */

import type { GuideDoc } from '../doc-types.ts';

export const FFX2_TOURIST_TRAP_DOC: GuideDoc = {
  id: 'ffx2-tourist-trap',
  game: 'ffx2',
  bossIds: ['x2-yojimbo'],
  blocks: [
    {
      t: 'p',
      text: 'Fiends have been pouring out of the Cavern of the Stolen Fayth, and a handful of tourists are stuck inside. Get them out, then go down to the old chamber, where Yojimbo waits with his dog, wearing a despair that is not his own.',
    },
    { t: 'lead', text: 'Preparation:' },
    {
      t: 'p',
      text: 'Bring two girls who hit hard (Dark Knights are the easy answer) and one who heals. Yojimbo poisons, so bring Remedies or a girl who knows Esuna, or let your Dark Knights learn Poisonproof.',
    },
    {
      t: 'p',
      text: 'Carry Mega-Potions and Phoenix Downs. The turn after his big move is a heal, and a heal from the bag needs no MP.',
    },
    { t: 'head', at: ['x2-yojimbo'], title: 'Yojimbo', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'Yojimbo keeps a count that rises with every move he weighs, and what he picks changes as it climbs. Calling Daigoro is one of the picks:',
    },
    {
      t: 'ul',
      items: [
        'Early on he mostly calls Daigoro, with now and then a Kozuka',
        'Midway the blade comes in: Wakizashi, on one girl, joins the list',
        'Late in the count a second, lighter Wakizashi joins it, and it too falls on one girl',
        'When the count is full he uses “Zanmato”, and the count starts over',
      ],
    },
    {
      t: 'p',
      text: '“Zanmato” takes the whole party down to 1 HP and 1 MP. It cannot kill anyone and neither Protect nor Shell softens it, so the answer is the turn after: a Mega-Potion for everyone, then a Phoenix Down for anyone he has knocked down.',
    },
    {
      t: 'p',
      text: 'It comes about seven of his attacks in, as few as four or as many as ten, because the calls to Daigoro count too. He winds up for it, so the charge bar warns you; the banner names each move, and Yuna’s Protect makes the blades much easier to live with.',
    },
    {
      t: 'p',
      text: '“Kozuka” takes a quarter of one girl’s MP and poisons her. Cure it with Esuna or a Remedy; the Poison keeps ticking until you do.',
    },
    {
      t: 'p',
      text: 'Daigoro cannot be targeted. Do not spend a turn trying: the damage is Yojimbo’s to take. When Yojimbo calls him he bites one girl on his own turn, so his bites come in answer to the calls.',
    },
    {
      t: 'p',
      text: 'Darkness ignores his Defense, so two Dark Knights on Darkness are the usual answer. The Breaks and every harmful status do nothing to him.',
    },
    {
      t: 'loot',
      rows: [{ enemy: 'Yojimbo', hp: '22,000', steal: 'Power Wrist', drop: 'Recovery Bracer' }],
    },
  ],
};
