/**
 * The hidden Sanctuary Keeper chapter (the beast on the Mt. Gagazet summit): the guide's one page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered
 * steps. **Jegged's Mt. Gagazet page is not in the repository's corpus**, so every sentence here is our own and stands on the game's own files (`research/re-ffx-sanctuary-keeper.md`): the cycle, the support-turn
 * priority and the Reflect answer are the note's section 4.2, the counter's three to seven blows its section 4.3, the figures its sections 1 and 6 (against Chapter I's preset, an `[estimate]`). Where a written
 * walkthrough and the file differ the file wins: Photon Wings also inflicts Curse, and the Reflect answer begins under half its HP (the note's section 7).
 *
 * **Not modelled, so not promised:** the gear the Keeper drops (a Half MP Cost weapon, an MP +10 percent armour). The page prints the Steal and the Drops the chapter pays.
 */

import type { GuideDoc } from '../doc-types.ts';

export const SANCTUARY_KEEPER_DOC: GuideDoc = {
  id: 'sanctuary-keeper',
  game: 'ffx',
  bossIds: ['sanctuary-keeper'],
  blocks: [
    { t: 'head', at: ['sanctuary-keeper'], title: 'Sanctuary Keeper', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '40,000' },
    {
      t: 'p',
      text: 'The beast that keeps the last road up the mountain. Its Defense and Magic Defense are both 100, and left alone it heals itself for nearly 10,000 twice every six turns. Plain blows cannot win this fight: take the healing away from it.',
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'It always opens with Photon Wings on all three of you: about 1,000 each, Curse every time (no Overdrives while it lasts), and a chance of Confuse, Sleep, Silence and Darkness on each. Protect and Shell do not lessen it.',
    },
    {
      t: 'p',
      text: 'Then it Attacks the one with the most HP, Attacks someone at random, and breathes on one of you: Mana Breath takes roughly 2,500 to 3,600, half with Shell. Its last two turns of the six are healing.',
    },
    {
      t: 'p',
      text: 'Those two turns are Curaga on itself unless something stops it: Regen when it is under a quarter, Esuna when it is poisoned, Protect once its armour is broken, and the Reflect answer below half.',
    },
    { t: 'h3', text: 'The count' },
    {
      t: 'p',
      text: 'It counts the blows it takes, and a spell that changes its HP counts too. After three to seven it lashes all three of you with its tail: about 1,000 each, your Haste taken off and every next turn pushed back.',
    },
    {
      t: 'p',
      text: 'Bio, Reflect, Protect, Slow and Scan do not count, and neither does its own Curaga. Nothing shows how close it is, so expect a sweep about once a cycle and cast Hastega again after it.',
    },
    { t: 'h3', text: 'Reflect' },
    {
      t: 'p',
      text: 'A spell cast at someone holding Reflect bounces back at its caster. With Reflect on the Keeper, its own Curaga and Esuna land on you, and its Protect never reaches it. But your own Bio bounces too, so poison it first.',
    },
    {
      t: 'p',
      text: 'Below half it knows the trick: it aims its healing at anyone of yours who holds Reflect, so that the spell bounces onto itself. Dispel the Reflect off your own line when it does.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Cast Hastega on the line first, and again after every tail sweep.',
        'Poison it: Bio from Lulu if she is in front, otherwise a Poison Fang thrown by Tidus. It takes 2,000 on each of its turns.',
        'Then Reflect it. Its Curaga and Esuna now land on your side and the poison keeps ticking.',
        'Shell everyone before the breath, then Protect.',
        "Break its armour with Auron: his blows land for more than twice as much, and it can only answer with a Protect that a Reflect sends back to you.",
        'Cure Confuse, Sleep, Silence and Darkness with Esuna, Echo Screen or a Remedy, and stand the fallen up with a Phoenix Down.',
        'Below half, Dispel any Reflect your own line holds.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Turbo Ether (common)', 'Turbo Ether x2 (rare)'] },
    { t: 'list', label: 'Drops', items: ['Return Sphere'] },
  ],
};

export default SANCTUARY_KEEPER_DOC;
