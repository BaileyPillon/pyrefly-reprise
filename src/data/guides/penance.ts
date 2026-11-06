/**
 * The hidden Penance chapter (the colossus over the Fahrenheit's deck and its two hands; hidden FFX chapter 35, the typed word `judgment`)
 * [research/re-ffx-penance.md "RE section n" (the monster records, the moves, the AI and the Break limits read from the game's own files), research/ffx-combat-core.md sections 2.10, 4.2, 7.1 and 8.2
 * (Break statuses, the status table, Quick Hit, the Three Stars item)]. Every cite below names one of them in the corpus's own form: the digest first, then the game's file.
 *
 * **The strategy this card teaches is the public guides' one**, in our own words: Jegged's Penance page (`jegged.com`, Final Fantasy X, Side Quests; the research note's section 1 and 8 name it and the three others it was checked
 * against) gives Three Stars first so Quick Hit, Dispel and Esuna cost nothing once the MP is gone, a hand killed the moment it stands, the hands never allowed a turn, one hand down at each of Penance's turns, and a Dispel for
 * Penance's Regen and for whoever Immolation breaks. `docs/handoff/ch-penance.md` section 5.1 plays that strategy on the real engine and measures it (55 of 100 battles won with no state edit, 65 of 100 on held-out seeds;
 * without Three Stars none): the card is written from that table, so each rule below is a rule the measured line obeys. The page and the tests (`tests/unit/helpers/penanceGuide.ts`) hold the line; the card says why.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Penance, its hands and the Three Stars item exist in the International and HD Remaster releases of FFX; FFX-2 has nothing like them and nothing here applies to it.
 *
 * **No move advisor line is registered for Penance** (`src/engine/tactics/index.ts` holds none), so the panel's NEXT line is the generic ladder's; the rules and the phases below are what the card adds, and the hints
 * explain a row when the ladder (or the player) picks it. **No number here is invented**: the figures are the note's (the counter's 20 is its own variable, the 12 ticks its section 5.3, the six blows its section 0 and 6)
 * and the hands' blows are named, not priced.
 */

import type { ChapterGuide } from './types.ts';

/** The combatant ids (`src/data/ffx/penance-ids.ts`), written out here: a guide data module imports no tactic. */
export const PENANCE_GUIDE_IDS = ['penance', 'penance-right-arm', 'penance-left-arm'] as const;
const BODY = PENANCE_GUIDE_IDS[0];
const RIGHT_ARM = PENANCE_GUIDE_IDS[1];
const LEFT_ARM = PENANCE_GUIDE_IDS[2];

export const PENANCE_GUIDE: ChapterGuide = {
  id: 'penance',
  title: 'Penance',
  bossIds: [...PENANCE_GUIDE_IDS],

  rules: [
    {
      text: 'Use Three Stars on your first calm turn. Immolation and Judgment Day drain everyone\'s MP, and without it Quick Hit, Dispel and Esuna shut as soon as the MP is gone. With it they cost nothing for the rest of the fight.',
      short: 'Three Stars first, then Quick Hit',
      cite: 'ffx-combat-core §8.2, §7.1; re-ffx-penance §4.1, §4.2',
    },
    {
      text: 'Keep one hand down at every one of Penance\'s turns. Judgment Day, 99,999 to all three of you and all your MP, only goes off while both hands stand; with one down the turn is an Immolation instead, and the count keeps climbing until both are up.',
      short: 'One hand down at each Penance turn',
      cite: 'ffx-combat-core §4.2; re-ffx-penance §0, §5.2, §8',
    },
    {
      text: 'Kill a hand with Quick Hit the moment it stands, and never let one act: give it every blow but the last, and hold the last until just before its turn. A hand you kill comes back whole after about a dozen ticks, so time the next kill to that.',
      short: 'Hold the last blow until just before it acts',
      cite: 'ffx-combat-core §7.1; re-ffx-penance §0, §5.3, §6',
    },
    {
      text: 'Dispel the Regen off Penance: the Right Arm\'s Mighty Guard puts Regen, Shell and Protect on it and on the hands, and the Regen keeps mending it every tick. Dispel the Haste it takes when it splits as well.',
      short: 'Dispel Penance\'s Regen',
      cite: 'ffx-combat-core §4.2, §4.3; re-ffx-penance §0, §4.1, §8',
    },
    {
      text: 'Dispel whoever Immolation hits. It breaks the target\'s armour and mind, and a member with his armour broken goes down to the next physical blow, whatever his HP. Cure the Petrify and Sleep the hands leave before the next turn comes round.',
      short: 'Dispel whoever Immolation breaks',
      cite: 'ffx-combat-core §2.10, §4.2; re-ffx-penance §4.2, §8',
    },
  ],

  hints: [
    { when: { labels: ['Three Stars'] }, text: 'Three Stars: every skill of yours costs nothing for the fight, so Quick Hit, Dispel and Esuna still work after Immolation and Judgment Day have emptied your MP', cite: 'ffx-combat-core §8.2; re-ffx-penance §4.1' },
    { when: { labels: ['Quick Hit'], targetId: RIGHT_ARM }, text: '{actor} strikes the Right Arm: it Petrifies with its Attack and spreads Poison, the Breaks and Silence with Calamity. Hold the last blow until just before it acts', cite: 'ffx-combat-core §7.1; re-ffx-penance §4.1, §5.3' },
    { when: { labels: ['Quick Hit'], targetId: LEFT_ARM }, text: '{actor} strikes the Left Arm, the worse one to leave standing: Tera Graviton takes three quarters of everyone\'s HP. Hold the last blow until just before it acts', cite: 'ffx-combat-core §7.1; re-ffx-penance §0, §4.1, §5.3' },
    { when: { labels: ['Quick Hit'], targetId: BODY }, text: 'Quick Hit on Penance: spend the turns on the body only while a hand is down and the other can still be killed in time. Elemental magic only heals it', cite: 'ffx-combat-core §7.1; re-ffx-penance §0, §5.2' },
    { when: { labels: ['Dispel'], targetId: BODY }, text: '{actor} dispels {target}: the Regen Mighty Guard gave it, and the Haste it takes at the split', cite: 'ffx-combat-core §4.2, §4.3; re-ffx-penance §0, §4.1' },
    { when: { labels: ['Dispel'], targetHas: 'armor-break' }, text: '{actor} dispels {target}: the armour is broken, and the next physical blow on {target} is the 99,999 cap whatever his HP. Take the break off first', cite: 'ffx-combat-core §2.10, §4.2; re-ffx-penance §4.2' },
    { when: { labels: ['Dispel'] }, text: '{actor} dispels {target}: Penance and the hands put Regen, Haste and Protect on themselves, and Immolation leaves Armor Break on its target', cite: 'ffx-combat-core §2.10, §4.2; re-ffx-penance §0, §4.1' },
    { when: { labels: ['Esuna', 'Remedy'] }, text: 'Cure {target}: the Right Arm\'s Attack Petrifies and the Left Arm\'s Tera Graviton adds Sleep, Silence, Darkness and Slow, and a Petrified member is shattered by the next blow', cite: 'ffx-combat-core §4.2; re-ffx-penance §4.1, §4.2' },
    { when: { labels: ['Curaga', 'X-Potion', 'Elixir'] }, text: 'Heal {target} before Penance moves: Obliteration lands on all three of you every turn until it splits', cite: 'ffx-combat-core §2.8; re-ffx-penance §0, §4.2' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up first: with three of you on the field, each turn spent short-handed is a hand left standing', cite: 'ffx-combat-core §4.2; re-ffx-penance §0' },
  ],

  watch: [],

  phases: [
    {
      belowHpFraction: 0.75,
      label: 'UNDER THREE QUARTERS',
      note: 'It splits: it loses Protect, takes Haste for a turn, and from then on strikes one of you at a time with Immolation instead of all three with Obliteration. The count starts, and Judgment Day waits at 20 for both hands to be up.',
      cite: 'ffx-combat-core §4.2; re-ffx-penance §0, §5.2',
    },
    {
      label: 'THE HANDS',
      note: 'Each hand returns whole after about 12 ticks, a little over one Penance turn. When you cannot hold both down, keep the Left Arm down: its Tera Graviton is the worse single blow.',
      cite: 'ffx-combat-core §1.1; re-ffx-penance §0, §5.3, §8',
    },
  ],
};

export default PENANCE_GUIDE;
