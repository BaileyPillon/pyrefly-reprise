/**
 * The hidden Jenova LIFE chapter (the boss at the altar of the Forgotten Capital, the end of Disc 1; hidden FF7 chapter 44, the typed word `bluelight`)
 * [research/ff7-jenova-life.md "jl" (the record, the three moves, her script and the Reflect rules), research/ff7-battle-core.md "core" (the damage chain, the statuses' halving and the Limit gauge)].
 * Every cite below names one of them in the corpus's own form.
 *
 * **The strategy this card teaches is the public guides' one**, in our own words: strike her instead of casting at her (the first spell that hits her lands and she then Reflects every spell back at its caster), use the Limit breaks, which
 * are not spells, keep MBarrier and Cure2 up against Aqualung, and never aim Water at her (it heals her). `docs/handoff/ch-jenova-life.md` plays that line on the real engine over 200 seeds and measures it. The
 * card is written from that table, so each rule below is a rule the measured line obeys.
 *
 * **Game case: FF7 only** [AGENTS.md rule 14]. Jenova LIFE, Reflect and the Limit gauge are the original game's; nothing here applies to FFX or FFX-2.
 *
 * **No move advisor line is registered for Jenova LIFE**, as for the Guard Scorpion (the advisor is off for FF7: `src/engine/tactics/advisor.ts`), and the FF7 battle screen has no guide panel yet; the card and the page are data, registered
 * so that the day FF7 gets a panel they are found by the same lookup as every other chapter's. **No number here is invented**: the figures are the note's (her 300 MP, the 30 MP she keeps for Reflect, the three dial steps, the
 * thousand or so Aqualung takes from each of you).
 */

import type { ChapterGuide } from './types.ts';

/** The combatant id (`src/data/ff7/enemies/jenova-life.ts`), written out here: a guide data module imports no tactic. */
export const FF7_JENOVA_LIFE_GUIDE_IDS = ['jenova-life'] as const;
const JENOVA = FF7_JENOVA_LIFE_GUIDE_IDS[0];

export const FF7_JENOVA_LIFE_GUIDE: ChapterGuide = {
  id: 'ff7-jenova-life',
  title: 'Jenova LIFE',
  bossIds: [...FF7_JENOVA_LIFE_GUIDE_IDS],

  rules: [
    {
      text: 'Strike her; do not cast at her. The first spell that hits her lands, and she answers by casting Reflect on herself. From then on every spell you cast at her turns back on whoever cast it, and a big one can kill the caster outright.',
      short: 'Blows and Limits, not spells',
      cite: 'ff7-jenova-life §5, §6, §10',
    },
    {
      text: 'Attack and the Limit breaks are not spells, so the Reflect lets them through. Blade Beam, Climhazzard, Satellite Beam and Tifa\'s chain are the biggest hits you have.',
      short: 'Limit breaks go through Reflect',
      cite: 'ff7-jenova-life §6, §9; ff7-battle-core §7.3',
    },
    {
      text: 'Earth is her weakness, and the first magic hit lands before her Reflect rises, so Quake2 is a free opener. It is one extra hit, not a plan: after it, put the spells away.',
      short: 'Quake2 is one free hit',
      cite: 'ff7-jenova-life §3, §5, §10',
    },
    {
      text: 'Water heals her, and her own moves are all Water. Never aim a Water spell at her, and think twice before turning her Aqualung back with a Reflect of your own: it lands on her and mends her.',
      short: 'Water heals her',
      cite: 'ff7-jenova-life §3, §6',
    },
    {
      text: 'Aqualung hits all three of you for about a thousand each. MBarrier halves it and Cure2 keeps three bars up; she throws it more often the more she is hurt. Her 300 MP is all she has, and a long fight dries her up.',
      short: 'MBarrier and Cure2 for Aqualung',
      cite: 'ff7-jenova-life §4, §5, §9; ff7-battle-core §4.5',
    },
  ],

  hints: [
    { when: { labels: ['Quake2', 'Quake'], bossId: JENOVA }, text: '{actor} casts Earth at her: her weakness, and the first magic hit lands before the Reflect rises. After this, no more spells at her', cite: 'ff7-jenova-life §3, §5' },
    { when: { labels: ['Bolt', 'Bolt2', 'Bolt3', 'Fire', 'Fire2', 'Fire3', 'Ice', 'Ice2', 'Ice3'], targetId: JENOVA }, text: '{actor} casts at her: with her Reflect up it turns back on {actor}. Attack or use a Limit break instead', cite: 'ff7-jenova-life §5, §6' },
    { when: { labels: ['MBarrier'] }, text: '{actor} puts MBarrier on {target}: it halves what Blue Light, Blue Flame and Aqualung do to them', cite: 'ff7-jenova-life §4; ff7-battle-core §4.5' },
    { when: { labels: ['Cure2', 'Hi-Potion', 'Cure', 'Potion'] }, text: 'Heal {target} before her next Aqualung: it takes about a thousand from each of you and she throws it more often as she is hurt', cite: 'ff7-jenova-life §4, §5' },
    { when: { labels: ['Phoenix Down'] }, text: 'Stand {target} up: with three of you, each turn spent short-handed is a blow not struck', cite: 'ff7-jenova-life §9' },
    { when: { kinds: ['limit'] }, text: '{actor} uses a Limit break: not a spell, so her Reflect cannot turn it, and the biggest hit in the party', cite: 'ff7-jenova-life §6, §9' },
  ],

  watch: [],

  phases: [
    {
      belowHpFraction: 0.75,
      label: 'UNDER THREE QUARTERS',
      note: 'The dial that raises both her double Blue Light and her Aqualung steps up: one chance in four now, where it was one in five.',
      cite: 'ff7-jenova-life §5',
    },
    {
      belowHpFraction: 0.5,
      label: 'UNDER A HALF',
      note: 'One chance in three, for the double Blue Light and for Blue Flame becoming Aqualung. Keep MBarrier up.',
      cite: 'ff7-jenova-life §5',
    },
    {
      belowHpFraction: 0.25,
      label: 'UNDER A QUARTER',
      note: 'One chance in two. Aqualung can come every other cycle; heal before it, and finish her.',
      cite: 'ff7-jenova-life §5',
    },
  ],
};

export default FF7_JENOVA_LIFE_GUIDE;
