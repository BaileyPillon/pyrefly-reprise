/**
 * The hidden Belgemine's Challenge chapter (the eight aeon duels of the Remiem Temple): the guide's page for each duel, in play order.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat line (HP), the advice in order. The written guides' pages for these duels are
 * not copied: every sentence here is our own and stands on the game's own files (`research/re-ffx-belgemine-aeon-duels.md`: the scripts of section 3, the numbers of section 0). Where a written guide and the file differ
 * the file wins (the Mi'ihen and Moonflow duels are not in this chapter; the first-win rewards are not modelled). **No reward is printed** (the chapter pays none) and no source is named.
 */

import type { GuideDoc } from '../doc-types.ts';

const CINDY = 'belg-cindy';

export const BELGEMINE_DOC: GuideDoc = {
  id: 'belgemine',
  game: 'ffx',
  bossIds: ['belg-valefor', 'belg-ifrit', 'belg-ixion', 'belg-shiva', 'belg-bahamut', 'belg-yojimbo', 'belg-anima', 'belg-mindy', 'belg-sandy', CINDY],
  blocks: [
    { t: 'head', at: ['belg-valefor'], title: 'Valefor', tag: 'Aeon Duel' },
    { t: 'field', label: 'HP', value: '20,000' },
    { t: 'p', text: 'Belgemine opens with Valefor. Yuna fights alone, and only her aeons can answer; the aeon an enemy holds is the one you cannot call, so Valefor is the one you leave in the list.' },
    { t: 'p', text: 'Valefor attacks and, one turn in three, uses Sonic Wings. A magical hit raises her gauge and, once it is up, wakes Energy Ray for her next turn; a physical hit does not. A full gauge is Energy Blast on the field.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Open with a Grand Summon: the aeon arrives with its Overdrive ready.', 'Prefer blows to spells, and spend every Overdrive as it fills.', 'Shield on the turn before Energy Blast.'] },

    { t: 'head', at: ['belg-ifrit'], title: 'Ifrit', tag: 'Aeon Duel' },
    { t: 'field', label: 'HP', value: '28,000' },
    { t: 'p', text: 'Ifrit absorbs Fire. He attacks, and answers a physical hit with Meteor Strike on his next turn. His gauge climbs with his turns and the hits he takes; a full gauge is Hellfire on the field.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Call Shiva or Ixion first; magic does not bring the Meteor Strike.', 'Spend Overdrives as they fill; Shield the turn before Hellfire.'] },

    { t: 'head', at: ['belg-ixion'], title: 'Ixion', tag: 'Aeon Duel' },
    { t: 'field', label: 'HP', value: '30,000' },
    { t: 'p', text: 'Ixion absorbs Thunder. Half his turns he does nothing but guard: he braces, which puts his Defense and Magic Defense at their limit, or he evades, which does the same for his Evasion. Aerospark strips your boosts; his Thor\'s Hammer falls on a full gauge.' },
    { t: 'p', text: 'A blow into the guard is wasted, and the type he is guarding against charges his gauge: a magical hit while he braces, a physical one while he evades. Strike while he is open.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Wait behind Shield while he guards; strike on the turn he is open.', 'Shield before Thor\'s Hammer.'] },

    { t: 'head', at: ['belg-shiva'], title: 'Shiva', tag: 'Aeon Duel' },
    { t: 'field', label: 'HP', value: '20,000' },
    { t: 'p', text: 'Shiva absorbs Ice and is hard to hit. She attacks, casts Blizzara and uses Heavenly Strike, which delays. Under half her HP she heals herself with Blizzaga. A full gauge is Diamond Dust on the field.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['End her quickly: the longer she lives the more she heals.', 'Shield before Diamond Dust.'] },

    { t: 'head', at: ['belg-bahamut'], title: 'Bahamut', tag: 'Aeon Duel' },
    { t: 'field', label: 'HP', value: '35,000' },
    { t: 'p', text: 'Bahamut does nothing for five turns, then casts Mega Flare, then does nothing again. Every hit he takes is answered with an Attack, and every fifth with Impulse on the field.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Call Anima or Ixion; they hit hardest in the quiet turns.', 'Shield on the sixth turn, when Mega Flare falls.'] },

    { t: 'head', at: ['belg-yojimbo'], title: 'Yojimbo', tag: 'Aeon Duel' },
    { t: 'field', label: 'HP', value: '32,000' },
    { t: 'p', text: 'Yojimbo has his dog Daigoro bite first, then adds Kozuka and Wakizashi as his gauge climbs, and when it is full Zanmato falls on the field. Every hit you land, and every turn he takes, feeds the gauge.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Few heavy blows keep his gauge low.', 'Shield before Zanmato.'] },

    { t: 'head', at: ['belg-anima'], title: 'Anima', tag: 'Aeon Duel' },
    { t: 'field', label: 'HP', value: '54,000' },
    { t: 'p', text: 'Anima uses Dispel, Demi, Pain and Attack by chance. Pain kills an aeon outright. Her gauge fills only when she is struck; a full gauge is Oblivion on the field.' },
    { t: 'p', text: 'When her aeon falls her next turn can fall on Yuna herself, and Pain would end the duel. Keep an aeon ready, and end her quickly.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Fewer, heavier blows; every Overdrive as it fills.', 'Shield before Oblivion.'] },

    { t: 'head', at: ['belg-mindy', 'belg-sandy', CINDY], title: 'The Magus Sisters', tag: 'Aeon Duel' },
    { t: 'field', label: 'Cindy HP', value: '48,000' },
    { t: 'field', label: 'Sandy HP', value: '35,000' },
    { t: 'field', label: 'Mindy HP', value: '20,000' },
    { t: 'p', text: 'Three bodies in one duel. Cindy guards all three every seventh turn and heals them; Sandy attacks and uses Razzia; Mindy casts, and grows a tier under a quarter of her HP. When all three gauges are full, Cindy leads the Delta Attack.' },
    { t: 'lead', text: 'The strategy:' },
    { t: 'ol', items: ['Open with a Grand Summon of Anima: her Oblivion strikes all three.', 'Strike Cindy first: with any one of the three down, the Delta Attack is over for good.', 'Spend every Overdrive as it fills, and Shield before the Delta Attack.'] },
  ],
};

export default BELGEMINE_DOC;
