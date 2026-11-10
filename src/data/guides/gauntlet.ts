/**
 * The hidden Gauntlet chapter (the Monster Arena's nine creations in the Calm Lands; hidden FFX chapter 54, the typed word `gauntlet`)
 * [research/re-ffx-monster-arena-creations.md "RE section n" (the nine monster records, the Head and Arms, the formations and the nine Atel scripts read from the game's own files and run on its bytecode, and the
 * arithmetic against the endgame preset), research/ffx-combat-core.md sections 2.8, 2.10, 4.2, 7.1 and 7.5 (healing, the Armored division, the status table, Quick Hit, the player's own spells)]. Every cite below names one of
 * them in the corpus's own form: the digest first, then the game's file.
 *
 * **The strategy this card teaches follows Jegged's Monster Arena pages** (`jegged.com`, Final Fantasy X, Monster Arena, the Original creations: Earth Eater, Ultima Buster...), in our own words: Earth Eater "counters with
 * Megaton Punch standing" and reflects a Flare when it lies down; the Ultima Buster's Arms are the thing to fall first; the creations of an area are the arena's easiest. Where a written page and the file differ, the file wins
 * (rule 6; `docs/handoff/ch-gauntlet.md` lists the points). The rest is the scripts (`research/re-ffx-monster-arena-creations.md` section 3) and the bench of `docs/handoff/ch-gauntlet.md`, which plays this line on the real
 * engine: the nine-act chain is won 200 of 200 by it, and each rule below is a rule that line obeys.
 *
 * Written against the tactic in `src/engine/tactics/gauntlet.ts`: every hint below explains a row that file asks for (the Phoenix Down and the heals, Quick Hit, Defend while Don Tonberry walks in and while Earth Eater
 * stands, Lulu's Switch and her Doublecast, a blow at an Arm before the body, the aeon as the Cactuar King's shield, the Overdrive), so each line says why the command the player is told to press is the right one.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Monster Arena and its creations are FFX content; FFX-2 has the Fiend Arena, a different system with different creatures, and nothing here applies to it.
 *
 * **No number here is invented**: the figures are the note's (the Cactuar King's 10,000 Needles, Earth Eater's 100,000 line, the Ultima Buster's 80,000-HP Arms, the Greater Sphere's one element in four, Karma's hundred a
 * kill). **Not modelled, so not promised:** the arena's capture counts and its stacked first-win prizes (this build pays the file's drops only), and Neslug's death scene.
 */

import type { ChapterGuide } from './types.ts';

/** The nine bodies' combatant ids (`src/data/ffx/gauntlet-ids.ts`), written out here: a guide data module imports no tactic. The Head and the Arms of the Ultima Buster are parts, not bosses. */
export const GAUNTLET_GUIDE_IDS = ['cactuar-king', 'don-tonberry', 'jormungand', 'earth-eater', 'greater-sphere', 'catastrophe', 'thuban', 'neslug', 'ultima-buster'] as const;
const [CACTUAR_KING, DON_TONBERRY, , EARTH_EATER, GREATER_SPHERE, CATASTROPHE, THUBAN, NESLUG, ULTIMA_BUSTER] = GAUNTLET_GUIDE_IDS;

export const GAUNTLET_GUIDE: ChapterGuide = {
  id: 'gauntlet',
  title: 'The Gauntlet',
  bossIds: [...GAUNTLET_GUIDE_IDS],

  rules: [
    {
      text: 'Three of them answer every blow: the Cactuar King with 10,000 Needles, Earth Eater with a punch that kills, and Don Tonberry with Karma while it walks in. Give each its answer, and keep Phoenix Downs ready.',
      short: 'Some answer every blow; give each its way',
      cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.4, §3.8, §3.9',
    },
    {
      text: 'Neslug hides in a shell below half its health, and in the shell every physical blow does nothing while it heals itself. Switch Lulu in: magic does not care about the shell.',
      short: "Lulu's magic opens Neslug's shell",
      cite: 'ffx-combat-core §7.5; re-ffx-monster-arena-creations §3.2',
    },
    {
      text: "The Ultima Buster's Arms guard its body against physical blows only. Strike an Arm first, or cast: a spell goes through. The Arms grow back a few turns after both fall.",
      short: 'An Arm before the body; magic ignores them',
      cite: 'ffx-combat-core §2.10; re-ffx-monster-arena-creations §3.1',
    },
    {
      text: 'The Greater Sphere answers a special with a Hydraulic Press that kills whoever is wounded, and a plain blow with an Ultima. Spend no Overdrive on it; plain blows are what the line asks.',
      short: 'No Overdrive on the Greater Sphere',
      cite: 'ffx-combat-core §7.5; re-ffx-monster-arena-creations §3.5',
    },
    {
      text: "Th'uban's Convergence kills one of you and Shell does not save them, and it answers every wound with a Condemn that strips your buffs. Hit it hard and early, and keep Phoenix Downs for the one it takes.",
      short: "Hit Th'uban early; Convergence kills",
      cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.6, §4',
    },
  ],

  hints: [
    { when: { kinds: ['switch'], labels: ['Lulu'], bossId: NESLUG }, text: "{actor} gives the turn to Lulu: Neslug's shell turns every blow of steel aside, and only magic and specials get through", cite: 'ffx-combat-core §7.5; re-ffx-monster-arena-creations §3.2' },
    { when: { kinds: ['switch'], labels: ['Lulu'], bossId: ULTIMA_BUSTER }, text: "{actor} gives the turn to Lulu: the Ultima Buster's Arms guard its body against physical blows, and a spell goes through them", cite: 'ffx-combat-core §7.5; re-ffx-monster-arena-creations §3.1' },
    { when: { labels: ['Doublecast'], bossId: NESLUG }, text: "{actor} casts two spells in one action: the shell cannot turn magic aside, and two spells a turn is the quickest way to bring Neslug below a quarter", cite: 'ffx-combat-core §7.5; re-ffx-monster-arena-creations §3.2' },
    { when: { labels: ['Doublecast'], bossId: ULTIMA_BUSTER }, text: "{actor} casts two spells in one action: the Arms' guard is for physical blows only, so the body takes both whole", cite: 'ffx-combat-core §7.5; re-ffx-monster-arena-creations §3.1' },
    { when: { kinds: ['defend'], bossId: DON_TONBERRY }, text: "{actor} guards while Don Tonberry walks in: a blow before its fourth step draws Karma, your kills times a hundred, and it counters nothing once it has arrived", cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.9' },
    { when: { kinds: ['defend'], bossId: EARTH_EATER }, text: '{actor} waits: only Auron strikes while Earth Eater stands, since every blow it takes standing draws a punch that kills', cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.4' },
    { when: { kinds: ['summon'], bossId: CACTUAR_KING }, text: "{actor} sends an aeon in: the Cactuar King's Needles fall on whoever stands in the front line, and the front line is the aeon alone", cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.8' },
    { when: { kinds: ['attack'], targetId: 'ultima-buster' }, text: "{actor} strikes the body: both Arms are down, so a physical blow takes its full weight until they grow back", cite: 'ffx-combat-core §2.10; re-ffx-monster-arena-creations §3.1' },
    { when: { kinds: ['attack'], bossId: ULTIMA_BUSTER }, text: "{actor} strikes an Arm first: while one stands, a blow at the body barely scratches it, and an Arm falls in a couple of blows", cite: 'ffx-combat-core §2.10; re-ffx-monster-arena-creations §3.1' },
    { when: { labels: ['Quick Hit'], bossId: EARTH_EATER }, text: 'Quick Hit is the same blow as an Attack in less time, so Tidus strikes while it lies down', cite: 'ffx-combat-core §7.1; re-ffx-monster-arena-creations §3.4' },
    { when: { labels: ['Quick Hit'] }, text: '{actor} uses Quick Hit on {target}: the same blow as an Attack with a shorter recovery, so Tidus strikes more often', cite: 'ffx-combat-core §7.1; re-ffx-monster-arena-creations §4' },
    { when: { kinds: ['attack'], targetId: EARTH_EATER }, text: "{actor} strikes {target}: Auron's Piercing blow ignores its armour, and the blow that takes it past 100,000 is the one it does not answer", cite: 'ffx-combat-core §2.10; re-ffx-monster-arena-creations §3.4' },
    { when: { kinds: ['attack'], targetId: CATASTROPHE }, text: "{actor} strikes {target}: its armour divides a plain blow by three until it changes, and Auron's Piercing weapon does not mind", cite: 'ffx-combat-core §2.10; re-ffx-monster-arena-creations §3.3' },
    { when: { kinds: ['overdrive'] }, text: '{actor} spends the Overdrive: one hit event for many blows, so the creature answers once', cite: 'ffx-combat-core §7.1; re-ffx-monster-arena-creations §3.8' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up: every one of you matters to the line, and Karma, Megaton Punch and Convergence each take one', cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.4, §3.6, §3.9' },
    { when: { labels: ['Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion'] }, text: 'Heal {target}: the creatures answer in turns and in counters, and a wounded member is what a Hydraulic Press or a Flare finishes', cite: 'ffx-combat-core §2.8; re-ffx-monster-arena-creations §3.4, §3.5' },
    { when: { kinds: ['attack'] }, text: 'A plain blow: Jormungand, Don Tonberry once it has arrived, Catastrophe and Th\'uban fall to it before they do much, and the party is made whole between the acts', cite: 'ffx-combat-core §7.1; re-ffx-monster-arena-creations §4' },
  ],

  watch: [
    {
      name: 'Shaking',
      payload: "the Head's turn after next: the Ultima Buster casts Contamination on one of you (Zombie, Poison, Confuse and Slow)",
      advice: 'A damaging blow on the Head while it shakes sets its round back to the start: the Contamination never comes.',
      cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.1',
    },
  ],

  phases: [
    {
      bossId: CACTUAR_KING,
      label: 'IT LEAVES',
      note: 'After two turns of rest, the third one makes the Cactuar King run away, and the act starts again. Most of its turns are a Needle that kills, so end it in a few blows.',
      cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.8',
    },
    {
      bossId: NESLUG,
      belowHpFraction: 0.5,
      label: 'IN ITS SHELL',
      note: 'Below half it hides: physical blows do nothing, it regenerates and casts Curaga on itself. Magic brings it below a quarter, where the shell breaks.',
      cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.2',
    },
    {
      bossId: CATASTROPHE,
      belowHpFraction: 0.8,
      label: 'IT CHANGES',
      note: 'Below four fifths it changes: its armour comes off and it grows faster. It then cycles Toxic Spray, Demi and Hundred Thorns, and takes plain blows whole.',
      cite: 'ffx-combat-core §2.10; re-ffx-monster-arena-creations §3.3',
    },
    {
      bossId: GREATER_SPHERE,
      label: 'ONE ELEMENT IN FOUR',
      note: 'It starts weak to one element and absorbs the other three. What it cannot use it answers with an Ultima on all of you or a Hydraulic Press.',
      cite: 'ffx-combat-core §7.5; re-ffx-monster-arena-creations §3.5',
    },
    {
      bossId: THUBAN,
      label: 'ITS ROUND',
      note: 'Four turns: an Attack, Rainbow on all of you, a buff on itself, then Convergence on one of you. Every wound it takes is answered with a Condemn.',
      cite: 'ffx-combat-core §4.2; re-ffx-monster-arena-creations §3.6',
    },
  ],
};

export default GAUNTLET_GUIDE;
