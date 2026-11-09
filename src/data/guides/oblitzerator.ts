/**
 * The hidden Oblitzerator chapter (the blitzball machine and the dock crane at Luca; hidden FFX chapter 50, the typed word `blitz`)
 * [research/re-ffx-oblitzerator-crane.md "RE section n" (the monster records, the formation and the Atel scripts read from the game's own files, and the arithmetic against the Luca build), research/ffx-combat-core.md
 * sections 1.4, 4.2 and 7.1 to 7.5 (Haste, the status table, the player's own spells and skills)]. Every cite below names one of them in the corpus's own form: the digest first, then the game's file.
 *
 * Written against the tactic in `src/engine/tactics/oblitzerator.ts`: every hint below explains a row that file asks for (Thunder at the crane, Haste on Lulu, Use crane, the cures, the wait while the crane is dark), so each
 * line says why the command the player is told to press is the right one. (The Eye Drops and Echo Screens the bag carries are no part of the line: the Darkness and Silence a ball leaves do not outlast the turn they land in on this engine.) The tactic is the bench's advisor line (`tests/unit/helpers/oblitzeratorBot.ts`), measured on the real engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Oblitzerator's record, its counters and the crane's script exist only in FFX; FFX-2 has no counterpart and no file of its own reads this one.
 *
 * **Four written walkthroughs were read** (Jegged, Gamer Guides, Samurai Gamers, and Game8 and Ludo.guide as search summaries; GameFAQs and the wiki would not answer) and where they and the game's files differ the files win (rule 6;
 * `research/re-ffx-oblitzerator-crane.md` section 7 lists the points: no Overdrive draws a Doze Ball, and Threaten fails on the machine). **No number here is invented**: the HP is the record's, the damage figures are the note's
 * arithmetic against the Luca build (an `[estimate]` over a sourced build point), the counters and the speed-up are the script's. **Not modelled, so not promised:** the gear the machine drops.
 */

import type { ChapterGuide } from './types.ts';

/** The Oblitzerator's combatant id (`src/data/ffx/oblitzerator-ids.ts`), written out here: a guide data module imports no tactic. */
export const OBLITZERATOR_GUIDE_IDS = ['oblitzerator'] as const;
const OBLITZERATOR = OBLITZERATOR_GUIDE_IDS[0];
const CRANE = 'luca-crane';

export const OBLITZERATOR_GUIDE: ChapterGuide = {
  id: 'oblitzerator',
  title: 'The Oblitzerator',
  bossIds: [...OBLITZERATOR_GUIDE_IDS],

  rules: [
    {
      text: 'The crane is the fight. Lulu casts Thunder at it three times and it wakes; Tidus\'s Use crane then takes fifteen sixteenths of what the machine has left and stops it acting.',
      short: 'Thunder three times at the crane, then Use crane',
      cite: 'ffx-combat-core §7.5; re-ffx-oblitzerator-crane §4.5',
    },
    {
      text: 'A blow at the machine draws a ball back one time in three: a Blind Ball on whoever swung, a Mute Ball on whoever cast. A cast at the crane draws nothing, so nobody swings until the crane has done its work.',
      short: 'No swings at the machine until it is lifted',
      cite: 'ffx-combat-core §4.2; re-ffx-oblitzerator-crane §4.2',
    },
    {
      text: 'Its Rush throws ten balls, each at a member picked at random, 32 to 39 apiece. Protect and Shell do not halve them; a Cheer does. Keep everyone above 400 and stand up the fallen first.',
      short: 'Ten balls at random: keep everyone above 400',
      cite: 'ffx-combat-core §4.2; re-ffx-oblitzerator-crane §4.1',
    },
    {
      text: 'The more it is hurt the faster it throws: about twice as fast under a third of its HP and three times under a twelfth. Fighting it the slow way only makes it worse.',
      short: 'It speeds up as it is hurt',
      cite: 'ffx-combat-core §1.4; re-ffx-oblitzerator-crane §4.2',
    },
    {
      text: 'Lulu\'s Thunder is all the crane needs. Keep her standing, and keep her out of the machine\'s way: a Mute Ball would leave her silent only for the rest of that turn, but a ball is still a ball.',
      short: 'Keep Lulu standing: her Thunder is the key',
      cite: 'ffx-combat-core §4.2; re-ffx-oblitzerator-crane §4.2',
    },
  ],

  hints: [
    { when: { labels: ['Thunder'], targetId: CRANE }, text: '{actor} casts Thunder at {target}: the crane swallows it and answers; the third cast wakes it, and it draws no ball back', cite: 'ffx-combat-core §7.5; re-ffx-oblitzerator-crane §4.5' },
    { when: { labels: ['Thunder'], targetId: OBLITZERATOR }, text: 'Thunder is the machine\'s weakness, but a spell at it draws a Mute Ball one time in three: the crane is the cleaner way', cite: 'ffx-combat-core §7.5; re-ffx-oblitzerator-crane §4.2' },
    { when: { labels: ['Haste'] }, text: '{actor} hastes {target}: Lulu\'s three casts come sooner, and the machine throws once for about six of your turns', cite: 'ffx-combat-core §7.1; re-ffx-oblitzerator-crane §4.2' },
    { when: { labels: ['Use crane'] }, text: '{actor} puts the crane to work: the machine falls to a sixteenth of its HP and stops acting and answering', cite: 'ffx-combat-core §7.5; re-ffx-oblitzerator-crane §4.5' },
    { when: { labels: ['Potion'] }, text: 'Top {target} up: another Rush could be the last', cite: 'ffx-combat-core §7.5; re-ffx-oblitzerator-crane §4.1' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up first: every one of you matters to the line', cite: 'ffx-combat-core §7.5; re-ffx-oblitzerator-crane §4.1' },
    { when: { kinds: ['defend'] }, text: 'Wait: a blow at the machine would draw a ball back, and the crane is the line', cite: 'ffx-combat-core §4.2; re-ffx-oblitzerator-crane §4.2' },
    { when: { kinds: ['attack'], targetId: OBLITZERATOR }, text: 'A plain blow at the lifted machine: it answers nothing now, and a sixteenth of its HP is two blows', cite: 'ffx-combat-core §2.10; re-ffx-oblitzerator-crane §4.5' },
  ],

  watch: [],

  phases: [
    {
      belowHpFraction: 0.33,
      label: 'UNDER A THIRD',
      note: 'It is about twice as fast now, and a twelfth of its HP makes it three times. Wake the crane if you have not.',
      cite: 'ffx-combat-core §1.4; re-ffx-oblitzerator-crane §4.2',
    },
    {
      label: 'FULL HEALTH',
      note: 'One Rush for about six of your turns. Thunder at the crane, three times; nobody swings at the machine.',
      cite: 'ffx-combat-core §1.4; re-ffx-oblitzerator-crane §4.1, §4.5',
    },
  ],
};

export default OBLITZERATOR_GUIDE;
