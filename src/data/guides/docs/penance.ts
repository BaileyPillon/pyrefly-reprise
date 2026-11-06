/**
 * The hidden Penance chapter (the colossus over the Fahrenheit's deck and its two hands): the guide's one page for this fight.
 *
 * **Game case: FFX only** (AGENTS.md rule 14). Laid out as the FFX encounter guide lays a boss page out (`../doc-types.ts`): the boss header, the stat lines (HP, Steal, Drops), the advice in order, the strategy as numbered
 * steps. The strategy is the public guides' line (Jegged, GamerGuides, eip.gg and Game8 between them; no one page gives all of it, and `ch-penance.md` 5.1 gives each row with its pages), in our own words (Three Stars first, then Quick Hit; the hands never allowed a turn, with the last blow held until just before one acts; one hand down at every one of
 * Penance's turns; a Dispel for Penance's Regen and for whoever Immolation breaks), and it is the line `docs/handoff/ch-penance.md` section 5.1 plays on the real engine (55 of 100 battles won, 65 of 100 on held-out seeds,
 * none without Three Stars). Every figure is the game's own (`research/re-ffx-penance.md`: the HP, the 99,999 of Judgment Day and of a broken-armour blow, the 20 of the count, the 12 ticks, the six blows, the three quarters of
 * Tera Graviton and of the split), and the page prints the Steal and the Drops the chapter pays. The guides disagree on which hand falls first (Game8 takes the Right Arm); the page takes the Left Arm, the one the engine
 * measured as well (`ch-penance.md` 5.1 item 6), and says so as a plain instruction.
 *
 * **Not modelled, so not promised:** Penance's gear drop (a weapon with Break Damage Limit or an armour with Ribbon) and the Ultra NulAll opener (the game's Hypello Potion is not an item here, so the Mix is Hyper NulAll).
 */

import type { GuideDoc } from '../doc-types.ts';

export const PENANCE_DOC: GuideDoc = {
  id: 'penance',
  game: 'ffx',
  bossIds: ['penance', 'penance-right-arm', 'penance-left-arm'],
  blocks: [
    { t: 'head', at: ['penance', 'penance-right-arm', 'penance-left-arm'], title: 'Penance', tag: 'Boss Battle' },
    { t: 'field', label: 'HP', value: '12,000,000' },
    { t: 'field', label: 'Arm HP', value: '500,000' },
    {
      t: 'p',
      text: 'Penance hangs over the Fahrenheit\'s deck with a hand on either side. Every element heals all three of them, so this is a fight of physical blows, and a long one. You do not win it by out-damaging Penance: you win it by never letting the hands act.',
    },
    { t: 'h3', text: 'Before it moves' },
    {
      t: 'p',
      text: 'Open with Rikku\'s Nul-All Mix, which puts the four Nul spells and five Cheers on everyone in one turn.',
    },
    {
      t: 'p',
      text: 'Then use Three Stars on the first calm turn. Immolation and Judgment Day drain everyone\'s MP, and with Three Stars on, Quick Hit, Dispel and Esuna cost nothing for the rest of the fight.',
    },
    { t: 'h3', text: 'Its turns' },
    {
      t: 'p',
      text: 'While it is above three quarters of its life, every turn is Obliteration on all three of you. Heal before it moves.',
    },
    {
      t: 'p',
      text: 'The first hit that takes it under three quarters splits it. It loses its Protect, takes Haste for a turn, and from then on strikes one of you at a time with Immolation, which breaks armour and mind and empties MP.',
    },
    {
      t: 'p',
      text: 'Dispel the Haste at once, and Dispel whoever Immolation hits. A member with his armour broken falls to the next physical blow, whatever his HP.',
    },
    { t: 'h3', text: 'The hands' },
    {
      t: 'p',
      text: 'The Right Arm Petrifies with its Attack, spreads Poison, the Breaks and Silence with Calamity, and casts Mighty Guard: Shell, Protect and Regen on Penance and on the hands. Dispel the Regen off Penance.',
    },
    {
      t: 'p',
      text: 'The Left Arm strips your good statuses with its Attack, casts Slowga, and casts Tera Graviton, which takes three quarters of everyone\'s HP and adds Sleep, Silence, Darkness, Slow and Doom. It is the worse hand to leave standing.',
    },
    {
      t: 'p',
      text: 'A hand that dies comes back at full HP about twelve ticks later, a little more than one turn of Penance\'s. Six Quick Hits from a Celestial weapon kill one.',
    },
    { t: 'h3', text: 'Judgment Day' },
    {
      t: 'p',
      text: 'After the split, every turn Penance takes and every hit that reaches it adds to a hidden count. At 20 it casts Judgment Day: 99,999 to all three of you and all of your MP. It does so only while both hands stand.',
    },
    {
      t: 'p',
      text: 'So keep one hand down at every one of Penance\'s turns. While a hand is down the turn is an Immolation instead and the count keeps climbing, so Judgment Day comes the first turn both hands are up again.',
    },
    { t: 'lead', text: 'The strategy:' },
    {
      t: 'ol',
      items: [
        'Open with Rikku\'s Nul-All Mix, then use Three Stars on the first calm turn.',
        'Take a hand down with Quick Hit as soon as you can reach it: the Left Arm first, the Right Arm after.',
        'Give a standing hand every blow but the last, and hold the last until just before its turn, so it never acts.',
        'Keep one hand down at every one of Penance\'s turns. Strike Penance itself only while that still holds.',
        'Dispel the Regen off Penance and the Haste it takes at the split, and Dispel whoever Immolation breaks.',
        'Heal before Penance moves, cure the Petrify, and stand the fallen up with a Phoenix Down.',
      ],
    },
    { t: 'p', text: 'Each hand has an Elixir to steal and pays Dark Matter or a Master Sphere every time it dies, which is why players farm them.' },
    { t: 'list', label: 'Steal', items: ['Elixir (common)', 'Megalixir x2 (rare)'] },
    { t: 'list', label: 'Drops', items: ['Master Sphere x3'] },
  ],
};

export default PENANCE_DOC;
