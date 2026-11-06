/**
 * The hidden Dark Aeons chapter, the six other Dark Aeons from Besaid to Gagazet
 * [research/ffx-mirror-aeons.md (the written sources for the Dark Aeons' shared machine and where the game's files overrule them), research/re-ffx-dark-aeons-six.md "RE six n" (the game's own records, rows, scripts and
 * formations), research/jegged-encounter-guides-ffx-*.md]. Every cite below starts with the digest and then names the game's file, in the corpus's own form.
 *
 * Written against the tactic in `src/engine/tactics/dark-aeons.ts`: every hint below explains a row that file asks for (an aeon sent in, Yojimbo and his payment, Auto-Life, Dispel, an Overdrive), so each line says
 * why the command the player is told to press is the right one.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Dark Aeons exist only in FFX's International and HD releases; no FFX-2 file reads this one.
 *
 * It follows Jegged's Dark Aeons pages (fight them one by one; answer the Overdrive with an aeon; Auto-Life; Evasion and Luck against Dark Ixion; counter-attacks against Dark Bahamut) in our own
 * words, and **where the game's own file says more or says otherwise, the file wins** (rule 6): the gauge counts hit events and a many-blow action is one event (RE six 3), the two Dark Ixion fights are two scripts (RE six 4.3), and
 * Dark Anima's immunity to every spell is the record's flag byte (RE six 1.2). **No number of the enemies' is on the player's page** except the ones the files give.
 *
 * Not modelled, so not promised: the gear the Dark Aeons drop, the guides' unlock conditions, the Dark paintings, the Overdrive gauge on screen.
 */

import type { ChapterGuide } from './types.ts';

/** The seven foes (`src/data/ffx/dark-aeons-six-ids.ts`). */
export const DARK_AEONS_GUIDE_IDS = ['dark-valefor', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-bahamut', 'dark-anima'] as const;
const [VALEFOR, IFRIT, IXION, IXION_2, SHIVA, BAHAMUT, ANIMA] = DARK_AEONS_GUIDE_IDS;

export const DARK_AEONS_GUIDE: ChapterGuide = {
  id: 'dark-aeons',
  title: 'The Dark Aeons',
  bossIds: [...DARK_AEONS_GUIDE_IDS],

  rules: [
    {
      text: 'Every blow fills their fury, and a full fury is the Overdrive: a blow that knocks down a whole party. The gauge counts actions, not damage, so one action with many blows fills it no more than one plain swing.',
      short: 'Every action feeds the fury',
      cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §3, §4.7',
    },
    {
      text: 'Send an aeon in before the Overdrive lands. It takes the blow, so the party stands; once the blow has passed, send it home. Put Auto-Life on everyone besides: all but two of the Overdrives leave it standing.',
      short: 'An aeon takes the Overdrive',
      cite: 'ffx-mirror-aeons §2, §3; re-ffx-dark-aeons-six §5.2, §5.3',
    },
    {
      text: 'Dark Ifrit and the first Dark Ixion answer every blow with a blow of their own, and Dark Bahamut calls a curse on all of you every fifth. Fewer, heavier actions serve better than many light ones.',
      short: 'Fewer, heavier actions',
      cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.2, §4.3, §4.5',
    },
    {
      text: "Dark Anima and Dark Bahamut take hundreds of plain blows. Call Yojimbo in and pay him on every turn of his: a landed Zanmato ends the fight outright, whatever the fury says.",
      short: "Yojimbo's Zanmato ends the long fights",
      cite: 'ffx-mirror-aeons §3; re-ffx-dark-aeons-six §1.2, §5.3, §9',
    },
    {
      text: "Dark Anima is immune to every spell and drinks fire, ice, thunder and water: use steel, aeons and Yojimbo. Dark Ixion's blade never finds a member whose Evasion and Luck add to 290 or more.",
      short: 'No spells on Dark Anima',
      cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §1.2, §6.2',
    },
  ],

  hints: [
    { when: { kinds: ['summon'] }, text: '{target} stands in for the party: the Overdrive is next, and an aeon takes it where Auto-Life could not carry everyone', cite: 'ffx-mirror-aeons §2, §3; re-ffx-dark-aeons-six §5.3' },
    { when: { labels: ['Auto-Life'] }, text: 'Auto-Life on {target}: most of the Overdrives leave it standing, and it brings the member back with a little life', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §5.2' },
    { when: { labels: ['Dispel'] }, text: 'Dispel {target}: Impulse puts the four Breaks on a member, and a broken member takes far more from the next one', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §5.1, §5.3' },
    { when: { labels: ['Curaga', 'Cura', 'Cure'] }, text: 'Heal {target} before the next blow: the single moves of these aeons are heavy and the party is thin', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §5.3' },
    { when: { labels: ['Phoenix Down'] }, text: 'Raise {target} with a Phoenix Down: the bag is the clock of the chain, and every fallen member costs one', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §5.3' },
    { when: { labels: ['Quick Hit'], targetId: ANIMA }, text: 'Quick Hit finds Dark Anima: a spell would do nothing at all', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §1.2' },
    { when: { kinds: ['attack'], targetId: IFRIT }, text: 'Dark Ifrit answers every blow: this is a swing that lands hard, so there are fewer of them to answer', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.2' },
  ],

  watch: [],

  phases: [
    { bossId: VALEFOR, label: 'DARK VALEFOR', note: 'Quick on her wings and weak in defence: a few heavy blows end her, and each one feeds the great blast she keeps for a full fury.', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.1' },
    { bossId: IFRIT, label: 'DARK IFRIT', note: 'A meteor on one of you every turn, and his own blow on whoever strikes him. Hellfire on a full fury.', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.2' },
    { bossId: IXION, label: 'DARK IXION, THE FIRST FIGHT', note: 'He answers every blow with a blade that sleeps and breaks, and Aerospark strips your wards and Auto-Life. Evade the blade.', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.3, §6.2' },
    { bossId: IXION_2, label: 'DARK IXION, THE SECOND FIGHT', note: 'No counter this time, but the fury fills faster and ends in Thor\'s Hammer, which breaks all four of your stats.', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.3' },
    { bossId: SHIVA, label: 'DARK SHIVA', note: 'She acts again and again before you can. Her cold kiss can kill outright, and only Deathproof stops it: a Ribbon does not. Auto-Life covers Diamond Dust.', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.4' },
    { bossId: BAHAMUT, label: 'DARK BAHAMUT', note: 'Hard to hit and heavy. Every fifth allowed blow draws Impulse on all of you: dispel the Breaks. A counter-attack of yours pays nothing towards it.', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.5, §9' },
    { bossId: ANIMA, label: 'DARK ANIMA', note: 'No spell touches her. Pain is death itself, and Oblivion falls on all of you and your MP. Yojimbo is the way through.', cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons-six §4.6, §9' },
  ],
};

export default DARK_AEONS_GUIDE;
