/**
 * The hidden Omega Ruins chapter (Ultima Weapon, Omega Weapon and Nemesis; hidden FFX chapter 43, the typed word `weapon`)
 * [research/re-ffx-omega-ultima-nemesis.md "RE section n" (the monster records, the formations and the three Atel scripts read from the game's own files, and the arithmetic against the endgame preset), research/ffx-combat-core.md
 * sections 1.4, 2.10, 4.2, 7.1 to 7.5 (Haste, the Armored division, the status table, the player's own spells and skills)]. Every cite below names one of them in the corpus's own form.
 *
 * Written against the tactic in `src/engine/tactics/omega-ruins.ts`: every hint below explains a row that file asks for (Auto-Life, the MP items that pay for it, Quick Hit, the cures, the Phoenix Down), so each line says why the
 * command the player is told to press is the right one. The tactic is the bench's advisor line (`tests/unit/helpers/omegaRuinsBench.ts`), measured on the real engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The three monsters, their scripts and the Monster Arena's last creation exist only in FFX; FFX-2 has none of them.
 *
 * **The community guides for these fights (the Omega Ruins and the Monster Arena pages) fit a mid-endgame party and not the endgame preset this chapter fights with**; where a written walkthrough and the file differ the file wins
 * (rule 6; `research/re-ffx-omega-ultima-nemesis.md` section 7 lists the points: Nemesis's answer to a special-class command is in the file and in no guide, and both Weapons' rounds change while an aeon is out). **No number here is
 * invented**: the HP is the record's, the damage figures are the note's arithmetic against the preset (an `[estimate]` over a sourced build point), the counters' bounds are the scripts'. **Not modelled, so not promised:** the gear the
 * three drop, and Lancet teaching Kimahri Nova.
 */

import type { ChapterGuide } from './types.ts';

/** The three bodies' combatant ids (`src/data/ffx/omega-ruins-ids.ts`), written out here: a guide data module imports no tactic. */
export const OMEGA_RUINS_GUIDE_IDS = ['ultima-weapon', 'omega-weapon', 'nemesis'] as const;
const NEMESIS = OMEGA_RUINS_GUIDE_IDS[2];

export const OMEGA_RUINS_GUIDE: ChapterGuide = {
  id: 'omega-ruins',
  title: 'The Omega Ruins',
  bossIds: [...OMEGA_RUINS_GUIDE_IDS],

  rules: [
    {
      text: 'Nemesis kills with its worst blows, and its Ultra Spark and Armageddon strike all three of you at once. Keep Auto-Life on everyone: a Phoenix Down cannot stand a party that is all down together.',
      short: 'Auto-Life on all three, always',
      cite: 'ffx-combat-core §7.5; re-ffx-omega-ultima-nemesis §4.3, §6',
    },
    {
      text: 'Never spend an Overdrive, a Mix or an item on Nemesis. Anything that is neither a plain blow nor a spell is answered with an Ultima on all three of you. Swing, Quick Hit and cast.',
      short: 'No Overdrive, Mix or item thrown at Nemesis',
      cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §4.3',
    },
    {
      text: 'Its armour divides plain blows by three unless the weapon pierces, and every element feeds it. A Piercing weapon, or a spell that is not elemental, gets full value.',
      short: 'Piercing for the armour; no element',
      cite: 'ffx-combat-core §2.10; re-ffx-omega-ultima-nemesis §1.2, §6',
    },
    {
      text: "Auto-Life costs Yuna more MP than she carries. Drink a Turbo Ether, an Elixir or an Ether when she cannot pay for the cast, and count the Phoenix Downs: they are the clock.",
      short: 'Drink an Ether when Yuna cannot cast',
      cite: 'ffx-combat-core §7.5; re-ffx-omega-ultima-nemesis §6',
    },
    {
      text: 'Both Weapons keep a round that changes while an aeon is out, and Omega Weapon gathers toward a Nova with every blow it throws. They are checks of preparation; Nemesis is the fight.',
      short: 'The Weapons keep a round; Nemesis is the fight',
      cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §4.1, §4.2, §6',
    },
  ],

  hints: [
    { when: { labels: ['Auto-Life'], bossId: NEMESIS }, text: '{actor} puts Auto-Life on {target}: Nemesis can take all three of you in one turn, and a second life is what keeps the three of you from falling together', cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §4.3, §6' },
    { when: { labels: ['Turbo Ether', 'Elixir', 'Ether'] }, text: '{actor} drinks to pay for the next Auto-Life; the MP is the clock, with the Phoenix Downs', cite: 'ffx-combat-core §7.5; re-ffx-omega-ultima-nemesis §6' },
    { when: { labels: ['Quick Hit'], targetId: NEMESIS }, text: 'Quick Hit is a plain physical blow in two thirds of the time, and Nemesis does not answer it. An Overdrive in its place would be answered with an Ultima on all three of you', cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §4.3' },
    { when: { kinds: ['attack'], targetId: NEMESIS }, text: 'A plain blow is the safe one: Nemesis does not answer it. Piercing keeps the armour from dividing it', cite: 'ffx-combat-core §2.10; re-ffx-omega-ultima-nemesis §4.3' },
    { when: { kinds: ['attack'] }, text: 'A plain blow. Both Weapons answer nothing you do, and the party kills Ultima Weapon in one and Omega Weapon in about eleven', cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §6' },
    { when: { labels: ['Soft'] }, text: 'A Soft cures {target} of Petrify: Break from either Weapon turns one of you to stone, and Ribbon or Stoneproof keeps it off', cite: 'ffx-combat-core §4.2; re-ffx-omega-ultima-nemesis §4.1' },
    { when: { labels: ['Esuna', 'Remedy'] }, text: 'Cure {target}: Confuse and Sleep from the Weapons take a member out of the round', cite: 'ffx-combat-core §4.2; re-ffx-omega-ultima-nemesis §4.1' },
    { when: { labels: ['Echo Screen'] }, text: 'Echo Screen cures Silence on {target}, who cannot cast a spell until it is gone', cite: 'ffx-combat-core §4.2; re-ffx-omega-ultima-nemesis §4.1' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up first: every one of you matters to the line', cite: 'ffx-combat-core §7.5; re-ffx-omega-ultima-nemesis §6' },
  ],

  watch: [],

  phases: [
    {
      label: 'NEMESIS',
      note: 'It acts about every nine ticks: Attack, Ethereal Cannon and Ultra Spark in a round, and a count nobody sees ends in Armageddon on all three of you, 99,999 each, between its eighth and its eleventh turn. Armageddon removes every protection.',
      cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §4.3',
    },
    {
      label: 'OMEGA WEAPON',
      note: 'Each of its blows adds to a hidden count, five for an Attack and two for a special; at thirty it burns the whole line with Nova, between its seventh and its sixteenth turn. An aeon in front of you swaps its curses for more Core Energy and rain.',
      cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §4.2',
    },
    {
      label: 'ULTIMA WEAPON',
      note: 'A fixed round of six: Attack, a curse, Core Energy, a second curse, Attack, a rain on all of you. Break turns one of you to stone; with an aeon out it forgets the curses.',
      cite: 'ffx-combat-core §1.5; re-ffx-omega-ultima-nemesis §4.1',
    },
  ],
};

export default OMEGA_RUINS_GUIDE;
