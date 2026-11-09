/**
 * The hidden Wendigo chapter (Wendigo and its two Guado Guardians on frozen Lake Macalania; hidden FFX chapter 49, the typed word `wendigo`)
 * [research/re-ffx-wendigo-lake-macalania.md "RE section n" (the monster records, the formation and the Atel scripts read from the game's own files, and the arithmetic against the Macalania preset), research/ffx-combat-core.md
 * sections 1.4, 4.2, 4.4 and 7.1 to 7.5 (Haste, the status table, Threaten, the player's own spells and skills)]. Every cite below names one of them in the corpus's own form: the digest first, then the game's file.
 *
 * Written against the tactic in `src/engine/tactics/wendigo.ts`: every hint below explains a row that file asks for (the Petrify Grenade, the Steal, the switch to Auron and to Wakka, Power Break, Dark Attack, Protect, the cures,
 * the wait while the arms are up), so each line says why the command the player is told to press is the right one. The tactic is the bench's advisor line (`tests/unit/helpers/wendigoBot.ts`), measured on the real engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Wendigo's record, its stance and the Guardians' script exist only in FFX; FFX-2 has no counterpart and no file of its own reads this one.
 *
 * **Four written walkthroughs were read** (GameFAQs, Jegged, Gamer Guides, Samurai Gamers) and where they and the game's files differ the files win (rule 6; `research/re-ffx-wendigo-lake-macalania.md` section 7 lists the
 * points: the Guardians cast no Haste, Wendigo has no weakness, and the Hi-Potion "counter" is the Guardian's own). **No number here is invented**: the HP is the record's, the damage figures are the note's arithmetic against the
 * Macalania preset (an `[estimate]` over a sourced build point), the cycle is the script's. **Not modelled, so not promised:** the gear Wendigo drops.
 */

import type { ChapterGuide } from './types.ts';

/** Wendigo's combatant id (`src/data/ffx/wendigo-ids.ts`), written out here: a guide data module imports no tactic. */
export const WENDIGO_GUIDE_IDS = ['wendigo'] as const;
const WENDIGO = WENDIGO_GUIDE_IDS[0];

export const WENDIGO_GUIDE: ChapterGuide = {
  id: 'wendigo',
  title: 'Wendigo',
  bossIds: [...WENDIGO_GUIDE_IDS],

  rules: [
    {
      text: 'Its blows kill at a stroke, so weaken them before anything else. Power Break halves everything it throws and Protect halves a blow again: with both on, a punch is about 400 to 500 and a member lives through it.',
      short: 'Power Break and Protect first',
      cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §1.1, §6',
    },
    {
      text: 'The Guardians keep it furious, cure its blindness, drink a potion when hit and cast a last shield on it as they fall. A Petrify Grenade reaches both of them, so they do none of it; failing that, Steal from each.',
      short: 'Petrify the Guardians, or Steal from them',
      cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.4, §7',
    },
    {
      text: 'Darkness makes its ordinary punches miss, but its Double Punch and its Counter Punch never miss. Blind it, but do not lean on it.',
      short: 'Darkness blunts the punches, not all of them',
      cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §5, §6',
    },
    {
      text: 'Under half, it raises its arms for three of its turns, and every physical blow it takes in that time is answered by a Counter Punch that never misses. Do not swing then, or send an aeon: an aeon on the field silences the counter.',
      short: 'No swings while its arms are up',
      cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.2, §4.3',
    },
  ],

  hints: [
    { when: { labels: ['Petrify Grenade'] }, text: '{actor} throws a Petrify Grenade: it reaches both Guardians, and a stone Guardian casts no Berserk, no Eye Drops and no last shield', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.4, §7' },
    { when: { labels: ['Steal'] }, text: '{actor} robs {target}: a Guardian that has been stolen from drinks no potion and, the guides say, uses no Eye Drops', cite: 'ffx-combat-core §7.3; re-ffx-wendigo-lake-macalania §4.4, §7' },
    { when: { kinds: ['switch'], actorId: 'tidus' }, text: 'Tidus makes way for Auron, whose Power Break halves every blow Wendigo throws; a character who comes in acts at once', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §6' },
    { when: { kinds: ['switch'], actorId: 'rikku' }, text: 'Rikku makes way for Wakka, whose Dark Attack blinds Wendigo; a character who comes in acts at once', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §6' },
    { when: { labels: ['Power Break'], targetId: WENDIGO }, text: 'Power Break on {target}: every blow it throws is halved, the Double Punch and the Counter Punch included', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §1.1, §6' },
    { when: { labels: ['Dark Attack'], targetId: WENDIGO }, text: 'Dark Attack on {target}: its ordinary punches miss about nine times in ten, though the Double Punch and the Counter Punch do not', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §1.1, §6' },
    { when: { labels: ['Protect'] }, text: 'Protect on {target} halves the physical blow that would otherwise kill him', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §6' },
    { when: { labels: ['Esuna'] }, text: '{actor} cures {target}: while its arms are up the Guardians Berserk your party into the counter', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.4' },
    { when: { labels: ['Remedy', 'Eye Drops'] }, text: 'Cure {target} of what the Guardians or the lake left on him', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.4' },
    { when: { labels: ['Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion'] }, text: 'Top {target} up: one more blow and he falls', cite: 'ffx-combat-core §7.5; re-ffx-wendigo-lake-macalania §6' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up first: every one of you matters to the line', cite: 'ffx-combat-core §7.5; re-ffx-wendigo-lake-macalania §6' },
    { when: { kinds: ['defend'] }, text: 'Wait: its arms are up, and a physical blow would be answered by a Counter Punch that never misses', cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.3' },
    { when: { kinds: ['attack'], targetId: WENDIGO }, text: 'A plain blow, with its arms down: nothing answers it', cite: 'ffx-combat-core §2.10; re-ffx-wendigo-lake-macalania §4.3' },
    { when: { kinds: ['attack'] }, text: 'Strike the Guardian that is still up: the Steal has ended its potion', cite: 'ffx-combat-core §2.10; re-ffx-wendigo-lake-macalania §4.4' },
  ],

  watch: [],

  phases: [
    {
      belowHpFraction: 0.5,
      label: 'UNDER HALF',
      note: 'The arms. For three of its turns in every seven it answers every physical blow with a Counter Punch that never misses; it attacks on three of the seven. Wait the three turns out, or send an aeon.',
      cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.2, §4.3',
    },
    {
      label: 'ABOVE HALF',
      note: 'Two turns in three a punch on a random member, the third a Double Punch on whoever has the least HP. The Guardians Berserk it and cure its blindness.',
      cite: 'ffx-combat-core §4.2; re-ffx-wendigo-lake-macalania §4.2, §4.4',
    },
  ],
};

export default WENDIGO_GUIDE;
