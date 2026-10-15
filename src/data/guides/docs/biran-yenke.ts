/**
 * The hidden Biran and Yenke chapter (Kimahri's solo trial at the Mountain Gate): the guide's one page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Follows the FFX encounter guide's "Biran and Yenke" page (Mt. Gagazet, the Mountain Gate) in our own words and in its order (layout: `../doc-types.ts`):
 * the boss header, the stat lines, the advice (learn every ability with Lancet, then wear the pair down with Lancet and the Rages; the order they fall in matters), the Steal and the Drops. Where the game's own
 * file says more or otherwise, the file wins (rule 6, `research/re-ffx-biran-yenke.md`): the moves are the note's cycles, the guard is the note's defence swap (only Kimahri's plain Attack, only while the
 * brothers stand together), the lessons are the note's, and **the HP is not a number**: it is set at the battle's start from Kimahri's own strength and magic (RE section 3).
 *
 * The page says nothing about a Berserk Biran beyond what is true under both the walkthrough and the note (learn Biran's Rages before Yenke falls); the disagreement is in the handoff.
 * **Not modelled, so not promised:** the gear the brothers drop, and the Steal (Kimahri has none in this build).
 */

import type { GuideDoc } from '../doc-types.ts';

export const BIRAN_YENKE_DOC: GuideDoc = {
  id: 'biran-yenke',
  game: 'ffx',
  bossIds: ['biran-ronso', 'yenke-ronso'],
  blocks: [
    { t: 'head', at: ['biran-ronso', 'yenke-ronso'], title: 'Biran and Yenke', tag: 'Boss Battle' },
    {
      t: 'field',
      label: 'In Game Description',
      value: 'Two Ronso warriors of Kimahri\'s own tribe, who stand guard for each other.',
    },
    { t: 'field', label: 'HP', value: "Set by Kimahri's own strength and magic" },
    {
      t: 'p',
      text: 'Kimahri fights alone. The brothers hit hard and cover for each other, but each teaches him as he is read: Lancet learns a Ronso Rage from them, and every new Rage fills his Overdrive gauge.',
    },
    { t: 'h3', text: 'Biran' },
    {
      t: 'p',
      text: 'Biran calls Thunder and Blizzard, and charges with Bulldoze, which carries him to the other side. Below half his strength he casts Mighty Guard on himself and, if they stand together, on Yenke too.',
    },
    {
      t: 'p',
      text: 'He teaches Thrust Kick, Self-Destruct and Doom, and Mighty Guard only after he has cast it himself.',
    },
    { t: 'h3', text: 'Yenke' },
    {
      t: 'p',
      text: 'Yenke breathes Fire and then Water, and Bulldozes as well. Below half his strength he casts White Wind, healing himself and, if they stand together, Biran too.',
    },
    {
      t: 'p',
      text: 'He teaches Fire Breath, Aqua Breath and Stone Breath, and White Wind only after he has cast it himself.',
    },
    { t: 'h3', text: 'Guard' },
    {
      t: 'p',
      text: 'While the brothers stand on the same side, a plain Attack on one makes the other stand guard, and it does next to nothing. Jump, Thrust Kick and the other Rages are not turned aside, and nor is Lancet.',
    },
    {
      t: 'p',
      text: 'When one of them Bulldozes they are apart, and a plain Attack lands in full until they meet again.',
    },
    { t: 'h3', text: 'When one falls' },
    {
      t: 'p',
      text: 'If Biran falls first, Yenke fights on Hasted and stronger. If Yenke falls first, Biran goes Berserk and Bulldozes every turn, and he will not teach you Mighty Guard. Learn what Biran carries first.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Lancet Biran, then Yenke, and spend each Rage as the gauge fills. Fire Breath and Aqua Breath reach both of them.',
        'Bring Biran below half while Yenke still stands, give him a turn, and Lancet him again for Mighty Guard.',
        'Lancet Yenke once he has cast White Wind, to learn it.',
        'Use the plain Attack only while the brothers are apart; together, Lancet fills the gap.',
        'Keep Kimahri up with potions: he is the only one standing.',
        'Bring Yenke down once Biran has taught you everything, then finish Biran.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Lv. 3 Key Sphere (common)', 'Lv. 3 Key Sphere x2 (rare)'] },
    { t: 'list', label: 'Drops', items: ['Return Sphere (common)', 'Friend Sphere (rare)'] },
  ],
};

export default BIRAN_YENKE_DOC;
