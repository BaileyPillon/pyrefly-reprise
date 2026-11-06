/**
 * The hidden Omega Ruins chapter (Ultima Weapon, Omega Weapon and Nemesis): the guide's pages for these three fights, one page each in play order.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered steps.
 * **The community pages for the Omega Ruins and the Monster Arena are not in the repository's corpus**, so every sentence here is our own and stands on the game's own files (`research/re-ffx-omega-ultima-nemesis.md`): the rounds, the
 * counters and the reply are the note's section 4, the figures its sections 1 and 6 (against the endgame preset, an `[estimate]`). Where a written walkthrough and the file differ the file wins: both Weapons' rounds change while an
 * aeon is out, and Nemesis answers a special-class command with an Ultima (the note's section 7).
 *
 * **Not modelled, so not promised:** the gear the three drop (Double and Triple Overdrive, Break MP Limit, Break HP Limit, Break Damage Limit), and Lancet teaching Kimahri Nova. The pages print the Steal and the Drops the chapter pays.
 */

import type { GuideDoc } from '../doc-types.ts';

export const OMEGA_RUINS_DOC: GuideDoc = {
  id: 'omega-ruins',
  game: 'ffx',
  bossIds: ['ultima-weapon', 'omega-weapon', 'nemesis'],
  blocks: [
    { t: 'head', at: ['ultima-weapon'], title: 'Ultima Weapon', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '99,999' },
    {
      t: 'p',
      text: 'The first guardian of the Ruins. It knows no element and takes only Silence and Darkness of the ailments, and it keeps a fixed round of six turns. Against a party at the caps it is a check of preparation: it dies to one blow.',
    },
    { t: 'h3', text: 'Its round' },
    {
      t: 'p',
      text: 'Attack, then a curse (Break, Silence or Confuse), then Core Energy, then Holy, Sleep or Confuse, then Attack, then a rain on all three of you. Break turns the one it names to stone. Its Attack often misses a fast party.',
    },
    {
      t: 'p',
      text: 'Put an aeon in front of you and it forgets the curses: its round becomes Attack, Core Energy, rain, Core Energy, Attack, rain. The test is made at every turn, so the round can change in the middle.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Wear Ribbon or have a Soft in the bag, and swing: nothing it does can change that one blow ends it.',
        'Cure whatever it puts on you before the next Ruins fight; the party is restored between the acts, but not mid-fight.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Door to Tomorrow x10 (common)', 'Door to Tomorrow x20 (rare)'] },
    { t: 'list', label: 'Drops', items: ['Lv. 3 Key Sphere x3'] },

    { t: 'head', at: ['omega-weapon'], title: 'Omega Weapon', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '999,999' },
    {
      t: 'p',
      text: 'The second guardian. Fire, ice, lightning, water and holy all heal it, and no ailment lands on it. Its Defense is 90, so at the caps it falls in about eleven blows.',
    },
    { t: 'h3', text: 'Its turns, and the Nova' },
    {
      t: 'p',
      text: 'A third of its turns it Attacks; otherwise it steps through a round of four: Core Energy, Break or Confuse, a rain on all of you, then Ultima or Demi. An aeon out swaps the curses and the last step for more Core Energy and rain.',
    },
    {
      t: 'p',
      text: 'A hidden count builds with everything it does, five for an Attack and two for a special. At thirty, at the start of a turn, it casts Nova on all three of you instead.',
    },
    {
      t: 'p',
      text: 'That is on average every eleven or twelve turns, never fewer than seven and never more than sixteen.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Do not feed it: no fire, ice, lightning, water or holy. A plain blow or a non-elemental spell.',
        'An aeon with Shield takes the Nova for you; so does a party that has been hit little by what came before.',
        'Cure Petrify and Confuse as they land.',
      ],
    },
    { t: 'list', label: 'Steal', items: ["Gambler's Spirit x30 (common)", "Gambler's Spirit x30 (rare)"] },
    { t: 'list', label: 'Drops', items: ['Lv. 4 Key Sphere x3'] },

    { t: 'head', at: ['nemesis'], title: 'Nemesis', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '10,000,000' },
    {
      t: 'p',
      text: 'The last of the old creations, and the only fight of the three against a party at the caps. It acts about every nine ticks, as often as a hasted member of yours does every four.',
    },
    {
      t: 'p',
      text: 'Its Ethereal Cannon, Ultra Spark and Armageddon kill a member at full health. Its Attack leaves a Protected one at a few thousand, and the next blow finishes him.',
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'Attack, Ethereal Cannon on one of you and Ultra Spark on all of you, in a round, with Poison, Power Break, Slow and Curse on whoever lives through the Spark.',
    },
    {
      t: 'p',
      text: 'A hidden count ends in Armageddon on all three: 99,999 each, whatever you wear, on average every ten turns, never fewer than eight or more than eleven.',
    },
    { t: 'h3', text: 'Its answer' },
    {
      t: 'p',
      text: 'It answers every special-class command that reaches it with an Ultima on all three of you: every Overdrive and aeon Overdrive, every Mix, Steal, Lancet and Jinx, and every item. A plain blow, Quick Hit and a spell it lets pass.',
    },
    {
      t: 'p',
      text: 'Its armour divides a plain blow by three unless the weapon pierces, and every element feeds it. It cannot be slowed, slept, silenced, confused or provoked, and Armor Break does not take the armour off.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Wear Auto-Haste, Auto-Phoenix, Auto-Protect and Ribbon, put Piercing on the weapons, and take Break Damage Limit: it takes about a hundred full blows.',
        'Keep Auto-Life on all three, Yuna first. It costs more MP than she carries, so drink a Turbo Ether or an Elixir when she is short.',
        "Never let all three fall at once without a second life among them: a Phoenix Down cannot stand a party that is all down together.",
        'Swing, Quick Hit with Tidus, and cast. Never an Overdrive, a Mix or an item thrown at it.',
        'Count the Phoenix Downs and the MP: they are the clock. Expect thirty or so of its turns.',
      ],
    },
    { t: 'list', label: 'Steal', items: ['Lv. 4 Key Sphere (common)', 'Warp Sphere (rare)'] },
    { t: 'list', label: 'Drops', items: ['Warp Sphere', 'Dark Matter (rare)'] },
  ],
};

export default OMEGA_RUINS_DOC;
