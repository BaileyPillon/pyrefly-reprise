/**
 * The hidden Spherimorph chapter (the guardian of the spring in the Macalania Woods; hidden FFX chapter 41, the typed word `spherimorph`)
 * [research/re-ffx-spherimorph.md "RE section n" (the monster record, the formation and the Atel script read from the game's own files, and the arithmetic against the Macalania preset), research/ffx-combat-core.md
 * sections 1.4, 2.4, 2.10, 3, 7.1 to 7.5 (Haste, the modifier order, the Breaks, elements and affinities, the player's own spells and skills)]. Every cite below names one of them in the corpus's own form: the digest
 * first, then the game's file.
 *
 * Written against the tactic in `src/engine/tactics/spherimorph.ts`: every hint below explains a row that file asks for (the plain probe, the highest-tier spell of the opposite element, Focus, Haste, Protect, Armor Break,
 * the heals), so each line says why the command the player is told to press is the right one. The tactic is the bench's advisor line (`tests/unit/helpers/spherimorphBot.ts`), measured on the real engine.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Spherimorph's record, its script and its four-state weakness exist only in FFX; FFX-2 has no counterpart and no file of its own reads this one.
 *
 * **Jegged's Macalania Woods page is not in the repository's corpus**, so every line stands on the game's own files and on the combat-core notes; where a written walkthrough and the file differ the file wins (rule 6;
 * `research/re-ffx-spherimorph.md` section 7 lists the points: a hit with the weakness is not answered by a spell, it changes it). **No number here is invented**: the HP is the record's and Press is half of current HP;
 * the damage figures are left out (they are the note's arithmetic against the Macalania preset, an `[estimate]`). **Not modelled, so not promised:** the gear Spherimorph drops.
 */

import type { ChapterGuide } from './types.ts';

/** Spherimorph's combatant id (`src/data/ffx/spherimorph-ids.ts`), written out here: a guide data module imports no tactic. */
export const SPHERIMORPH_GUIDE_IDS = ['spherimorph'] as const;
const BOSS = SPHERIMORPH_GUIDE_IDS[0];

export const SPHERIMORPH_GUIDE: ChapterGuide = {
  id: 'spherimorph',
  title: 'Spherimorph',
  bossIds: [...SPHERIMORPH_GUIDE_IDS],

  rules: [
    {
      text: 'It takes hurt from one element only and takes in the other three, and Holy, as healing. Do not guess: a wrong spell feeds it and is answered on all three of you. Cast the element opposite the spell that answered a plain blow.',
      short: 'Cast the opposite of what answers',
      cite: 'ffx-combat-core §3; re-ffx-spherimorph §4.1, §4.3',
    },
    {
      text: 'Probe with a plain blow first. It is answered with a spell of the element opposite its weakness, aimed at whoever struck, and that spell is the clue. Armored, it divides a plain blow by three: the swing is for the clue, not the damage.',
      short: 'Probe with a plain blow, read the answer',
      cite: 'ffx-combat-core §2.4, §3; re-ffx-spherimorph §1.2, §4.3',
    },
    {
      text: 'Hitting it with its weakness is not answered by a spell: it changes to a new element drawn from all four, and one time in four the same one. Probe again after every hit that lands.',
      short: 'Probe again after every hit that lands',
      cite: 'ffx-combat-core §3; re-ffx-spherimorph §4.3',
    },
    {
      text: 'Below half its HP, half of its turns are Press: half of everyone\'s current HP, less with Protect. It cannot kill by itself, but heal the line before the next spell and Attack arrive.',
      short: 'Under half, Press halves your HP; heal',
      cite: 'ffx-combat-core §2.4, §7.5; re-ffx-spherimorph §4.2, §5',
    },
    {
      text: 'Armor Break takes the Armored division away, so Auron\'s blows land whole, and a plain blow still draws only the clue. Magic Break shrinks its spells; a Nul spell stops one of its elements.',
      short: 'Armor Break lets plain blows land whole',
      cite: 'ffx-combat-core §2.10, §7.3; re-ffx-spherimorph §1.2, §6',
    },
  ],

  hints: [
    { when: { kinds: ['attack'], targetId: BOSS }, text: '{actor} strikes {target} plain: whatever spell it answers with names the element it is NOT weak to, so the opposite of that spell is the one to cast', cite: 'ffx-combat-core §3; re-ffx-spherimorph §4.1, §4.3' },
    { when: { labels: ['Firaga', 'Fira', 'Fire', 'Blizzaga', 'Blizzara', 'Blizzard', 'Thundaga', 'Thundara', 'Thunder', 'Waterga', 'Watera', 'Water'], targetId: BOSS }, text: '{actor} casts the opposite of the spell that answered: the element {target} takes damage from, at the highest tier she has. The hit changes it, so probe again next', cite: 'ffx-combat-core §3, §7.4; re-ffx-spherimorph §4.3, §6' },
    { when: { labels: ['Focus'] }, text: 'Focus raises {actor}\'s magic while the clue is stale and there is nothing to cast', cite: 'ffx-combat-core §2.9, §7.4; re-ffx-spherimorph §6' },
    { when: { labels: ['Haste'] }, text: 'Haste on {target} so her cast comes round sooner after each probe', cite: 'ffx-combat-core §1.4, §7.1; re-ffx-spherimorph §6' },
    { when: { labels: ['Protect'] }, text: 'Protect halves Press, which takes half of the current HP of everyone it reaches, and halves its Attacks', cite: 'ffx-combat-core §7.5; re-ffx-spherimorph §4.2, §6' },
    { when: { labels: ['Armor Break'], targetId: BOSS }, text: 'Armor Break takes the Armored division off {target}, so Auron\'s plain blows land whole instead of a third; they are still answered with the clue, not with a change', cite: 'ffx-combat-core §2.10, §7.3; re-ffx-spherimorph §1.2, §6' },
    { when: { labels: ['Cure', 'Cura', 'Hi-Potion', 'X-Potion', 'Mega-Potion'] }, text: 'Top {target} up: the answers fall on whoever struck or on all three, and Press halves what is left', cite: 'ffx-combat-core §7.5; re-ffx-spherimorph §4.2, §6' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up first: every one of you matters to the line', cite: 'ffx-combat-core §7.5; re-ffx-spherimorph §6' },
    { when: { kinds: ['defend'] }, text: '{actor} waits: a second plain blow would only draw another answer, and a cast without a clue would feed it', cite: 'ffx-combat-core §3; re-ffx-spherimorph §4.3' },
  ],

  watch: [],

  phases: [
    {
      belowHpFraction: 0.5,
      label: 'UNDER HALF',
      note: 'Half of its turns are Press now: half of everyone\'s current HP. Protect halves that, and Cura brings the line back.',
      cite: 'ffx-combat-core §7.5; re-ffx-spherimorph §4.2',
    },
    {
      label: 'THE PUZZLE',
      note: 'One element hurts it and the other three heal it. A plain blow is answered with the opposite of its weakness; the right element changes it, the wrong one is answered on all three of you.',
      cite: 'ffx-combat-core §3; re-ffx-spherimorph §4.1, §4.3',
    },
  ],
};

export default SPHERIMORPH_GUIDE;
