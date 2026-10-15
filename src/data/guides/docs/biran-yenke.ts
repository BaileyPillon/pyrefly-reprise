/**
 * The hidden Biran and Yenke chapter (Mt. Gagazet, the mountain gate): the guide's page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays out a boss page (layout: `../doc-types.ts`), in our own words. The page itself could not be read in this
 * session (its hosts were refused by the network policy, `research/ffx-biran-yenke.md` section 0.2), so the order follows the research note's sections, and every rule and number is the
 * note's or the game's own rows:
 *
 * - **HP is the game's for the shipped preset**: the battle writes both Ronso's HP, Strength, Magic and Agility from Kimahri's (research section 2.2), so the two HP lines are what this
 *   chapter's Kimahri meets (3,208 and 2,406), and the page says that the numbers move with him.
 * - The **In Game Description** lines are our own Scan lines (`data/ffx/enemies/biran-yenke.ts`; the chapter's data test pins that they agree).
 * - **Steal and Drops** are the records' (section 2.4). **Not modelled, so not promised:** the rare Friend Sphere and the piece of equipment each Ronso drops are not listed.
 * - The guarding is our model of "they guard each other" (Cover with Sentinel, so "at half": section 4.4); the turn loops, the quarter threshold and the Lancet order carry the note's tags.
 */

import type { GuideDoc } from '../doc-types.ts';

export const BIRAN_YENKE_DOC: GuideDoc = {
  id: 'biran-yenke',
  game: 'ffx',
  bossIds: ['biran-ronso', 'yenke-ronso'],
  blocks: [
    { t: 'head', at: ['biran-ronso', 'yenke-ronso'], title: 'Biran Ronso & Yenke Ronso', tag: 'Boss Battle' },
    {
      t: 'p',
      text: 'At the gate of Mt. Gagazet two Ronso challenge Kimahri, and he answers alone: nobody can switch in, and there are no aeons to call. Both of them have to fall.',
    },
    {
      t: 'p',
      text: "Their HP, Strength and Magic are drawn from Kimahri's own when the battle starts, so the fight grows with him. The HP below is for Kimahri as he arrives at the gate.",
    },
    { t: 'h3', text: 'Biran Ronso' },
    {
      t: 'field',
      label: 'In Game Description',
      value: 'Biran Ronso. Takes the blows aimed at Yenke while they stand together. Brought low, he raises Mighty Guard; Lancet him after it to learn it.',
    },
    { t: 'field', label: 'HP', value: '3,208' },
    {
      t: 'p',
      text: 'Biran casts Thunder, Bulldozes, casts Blizzard and Bulldozes again, and keeps that order. Below a quarter of his HP he casts Mighty Guard once: on both of them while they stand together, on himself alone if not.',
    },
    { t: 'h3', text: 'Yenke Ronso' },
    {
      t: 'field',
      label: 'In Game Description',
      value: 'Yenke Ronso. Breathes fire and water over all before him. Brought low, he calls White Wind; Lancet him after it to learn it.',
    },
    { t: 'field', label: 'HP', value: '2,406' },
    {
      t: 'p',
      text: 'Yenke breathes fire, then water, then Bulldozes, and keeps that order. Below a quarter of his HP he calls White Wind once, which heals both of them while they stand together.',
    },
    { t: 'h3', text: 'Guarding' },
    {
      t: 'p',
      text: 'Side by side, each takes the blows aimed at the other, at half the damage, so a plain Attack lands on the wrong Ronso and does little. Lancet, items and Ronso Rages are never caught.',
    },
    {
      t: 'p',
      text: 'A Bulldoze moves the Ronso who used it to the other row. While they stand apart nobody covers anybody, and the next Bulldoze, by either of them, brings them together again.',
    },
    { t: 'h3', text: 'Lancet' },
    {
      t: 'p',
      text: 'Every Lancet that lands teaches Kimahri one Ronso Rage he does not know yet, in the order below, and each new Rage fills his Overdrive gauge at once.',
    },
    { t: 'list', label: 'Biran teaches', items: ['Self-Destruct', 'Thrust Kick', 'Doom', 'Mighty Guard, once he has cast it'] },
    { t: 'list', label: 'Yenke teaches', items: ['Fire Breath', 'Stone Breath', 'Aqua Breath', 'White Wind, once he has cast it'] },
    {
      t: 'p',
      text: 'If Yenke falls first, Biran goes berserk and only Bulldozes, and he never casts Mighty Guard. If Biran falls first, Yenke casts Haste on himself.',
    },
    {
      t: 'p',
      text: 'Stone Breath and Doom do nothing useful here: neither Ronso can be petrified, and Doom counts down from twenty.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Lancet Yenke, then Biran, every turn the gauge is not full.',
        'Spend each full gauge: Aqua Breath or Fire Breath while both stand, Thrust Kick or Jump on one alone.',
        'Bring each Ronso below a quarter without finishing him, and Lancet him after his Mighty Guard or White Wind.',
        'Keep Yenke standing until Biran has cast Mighty Guard.',
        'Attack only after a Bulldoze has split them up.',
        'Keep Kimahri above half with Hi-Potions, or White Wind once he has it. Never use Self-Destruct: it takes him out of the battle.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Lv. 3 Key Sphere (common)', 'Lv. 3 Key Sphere x2 (rare)'] },
    { t: 'list', label: 'Drops', items: ['Return Sphere'] },
  ],
};

export default BIRAN_YENKE_DOC;
