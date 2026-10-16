/**
 * The hidden Mirror Aeons chapter, the Dark Magus Sisters and Dark Yojimbo against Yuna's own Magus Sisters and Yojimbo
 * [research/ffx-mirror-aeons.md (the written sources and where the game's files overrule them), research/re-ffx-yojimbo-sisters-feasibility.md "RE section n" (the game's own rows, formations and scripts in words),
 * research/jegged-encounter-guides-ffx-*.md]. Every cite below starts with the digest and then names the game's file, in the corpus's own form.
 *
 * Written against the tactic in `src/engine/tactics/mirror-aeons.ts`: every hint below explains a row that file asks for (an aeon sent in, a potion, Quick Hit, Mindy first), so each line says why the command the
 * player is told to press is the right one.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The Dark Aeons exist only in FFX's International and HD releases; no FFX-2 file reads this one.
 *
 * It follows Jegged's Dark Aeons pages ("Dark Magus Sisters" and "Dark Yojimbo": fight them one by one when you can, prepare for status ailments, answer the Overdrive with an aeon, Quick Hit for offence) in our own
 * words, and **where the game's own file says more or says otherwise, the file wins** (rule 6): the sisters open the trio with the joint attack because every gauge starts full (RE section 4.2), Zanmato strips
 * Auto-Life and is a damage hit, not an instant death (RE section 2), and Dark Yojimbo's blade fills faster the later the tier (RE section 4.1). **No number of the enemies' is on the player's page** that the
 * files do not give; the pool sizes are the files' own (RE section 2) and so are printed in the guide's doc.
 *
 * Not modelled, so not promised: the gear the Dark Aeons drop, the guides' chase that splits the sisters (the chapter picks a formation instead), the dark paintings.
 */

import type { ChapterGuide } from './types.ts';

/** The Dark Aeons (`src/data/ffx/mirror-aeons-ids.ts`). */
export const MIRROR_AEONS_GUIDE_IDS = ['dark-cindy', 'dark-sandy', 'dark-mindy', 'dark-yojimbo'] as const;
const MINDY = MIRROR_AEONS_GUIDE_IDS[2];
const SANDY = MIRROR_AEONS_GUIDE_IDS[1];
const CINDY = MIRROR_AEONS_GUIDE_IDS[0];
const YOJIMBO = MIRROR_AEONS_GUIDE_IDS[3];

export const MIRROR_AEONS_GUIDE: ChapterGuide = {
  id: 'mirror-aeons',
  title: 'Mirror Aeons',
  bossIds: [...MIRROR_AEONS_GUIDE_IDS],

  rules: [
    {
      text: "Send an aeon in before the big move. The three sisters open with their joint attack, Dark Yojimbo ends his build-up with Zanmato, and Auto-Life does not turn either: an aeon takes the blow, so the party stands. Against the three, send Yuna's own Sisters (three bodies in one summon: the first two blows kill a lone aeon); against Dark Yojimbo, send her Yojimbo, the mirror.",
      short: 'An aeon takes the big move',
      cite: 'ffx-mirror-aeons §2, §3; re-ffx-yojimbo-sisters-feasibility §2, §4.1, §4.2; jegged-encounter-guides-ffx-b',
    },
    {
      text: 'Blades for Cindy and Sandy, spells for Mindy. Dark Mindy is so hard to hit that a blade almost never finds her; a spell, an Overdrive or an aeon never misses. Each sister down is one fewer to fill the joint attack.',
      short: 'Blades for Cindy, spells for Mindy',
      cite: 'ffx-mirror-aeons §2, §6; re-ffx-yojimbo-sisters-feasibility §2, §4.2',
    },
    {
      text: 'Ribbon, Auto-Haste, Auto-Phoenix and Auto-Protect do the long work: the sisters and Yojimbo land Petrify, Poison, the Breaks, Slow and Sleep. Quick Hit gets the most blows in.',
      short: 'Armour first, then Quick Hit',
      cite: 'ffx-mirror-aeons §2, §3, §4; re-ffx-yojimbo-sisters-feasibility §2',
    },
    {
      text: "Dark Yojimbo's blade fills each turn and a little more whenever he is struck. When it is nearly full he uses Zanmato: send the aeon in a round early, not on the full gauge, or end him first. Before that, Cheer on Tidus: a third off every physical blow is what lets a full-health member live through his Wakizashi.",
      short: 'His blade fills, then Zanmato',
      cite: 'ffx-mirror-aeons §3; re-ffx-dark-aeons §4.2',
    },
    {
      text: "Every fallen member costs a Phoenix Down and the bag holds only so many: heal early with Yuna's Curaga instead of waiting for the next blow, and keep Auto-Life on everyone. The bag is the clock of the road.",
      short: 'Heal early: the bag is the clock',
      cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons §6.3',
    },
    {
      text: 'Your own Yojimbo is paid to act, and a bigger payment is a better stroke; the Dark ones resist Zanmato, so do not count on it. Your Sisters have one order that works, Combine powers, and it needs all three of their gauges full.',
      short: 'Zanmato is a long shot',
      cite: 'ffx-mirror-aeons §5; re-ffx-yojimbo-sisters-feasibility §2, §5.5',
    },
  ],

  hints: [
    { when: { kinds: ['summon'] }, text: 'Send {target} in: the next big move lands on it, not on the party, and it keeps the party off the floor', cite: 'ffx-mirror-aeons §2, §3; re-ffx-yojimbo-sisters-feasibility §2, §5.1' },
    { when: { kinds: ['attack'], targetId: MINDY }, text: 'A blade almost never finds Mindy (her Evasion is the highest of the three): use a spell, an Overdrive or an aeon on her, and keep the blades for Cindy and Sandy', cite: 'ffx-mirror-aeons §2, §6; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { labels: ['Ultima', 'Flare', 'Thundaga', 'Firaga', 'Blizzaga', 'Waterga'] }, text: 'A spell never misses: {actor} aims it at Mindy first, the sister a blade cannot touch, and her Magic Defense is lower than her Defense', cite: 'ffx-mirror-aeons §2, §6; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { kinds: ['attack'], targetId: SANDY }, text: 'Sandy hits hard, and her plain blow can Petrify: keep Ribbon or Stoneproof on someone', cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { kinds: ['attack'], targetId: CINDY }, text: 'Cindy never dodges, so a blade always lands on her: the surest target, and the biggest pool. Keep the potions ready for her Camisade', cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { labels: ['Quick Hit'] }, text: 'Quick Hit: the fastest blow {actor} has, so the most turns before the next big move', cite: 'ffx-mirror-aeons §2, §3; jegged-encounter-guides-ffx-b' },
    { when: { kinds: ['attack'], targetId: YOJIMBO }, text: 'Dark Yojimbo dodges many physical blows (his Luck is high): keep swinging, and do not mistake a miss for a mistake', cite: 'ffx-mirror-aeons §3; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { labels: ['Potion', 'Hi-Potion', 'X-Potion'] }, text: 'Top {target} up: the multi-hit moves leave a member low, and a second blow would finish them', cite: 'ffx-mirror-aeons §2, §3; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { labels: ['Curaga', 'Cura', 'Cure'] }, text: 'Heal {target} early: a member who is already hurt is the one the next blow finishes, and every fall costs a Phoenix Down', cite: 'ffx-mirror-aeons §2, §3; re-ffx-dark-aeons §6.3' },
    { when: { labels: ['Auto-Life'] }, text: 'Auto-Life on {target}: a second life against every blow but Zanmato, the joint attack and Razzia, which take it away', cite: 'ffx-mirror-aeons §2, §3; re-ffx-dark-aeons §6.2' },
    { when: { labels: ['Cheer'] }, text: 'Cheer: at five stacks a third off every physical blow, which a full-health member needs to live through Dark Yojimbo\'s Wakizashi', cite: 'ffx-mirror-aeons §3; re-ffx-dark-aeons §6.3' },
    { when: { labels: ['Pay'] }, text: 'Pay Yojimbo: the payment buys the stroke, a bigger one a better one; the Dark ones resist Zanmato', cite: 'ffx-mirror-aeons §5; re-ffx-yojimbo-sisters-feasibility §5.5' },
    { when: { labels: ['Combine for the Delta Attack'] }, text: 'Combine: all three of Yuna\'s Sisters are full, so their Delta Attack is on offer; their menu has nothing else that works', cite: 'ffx-mirror-aeons §5; re-ffx-yojimbo-sisters-feasibility §5.5' },
    { when: { labels: ['Dismiss'] }, text: 'The blow has passed and the aeon is low: bring the party back, and call it again for the next one', cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §5.4' },
  ],

  watch: [],

  phases: [
    {
      bossId: CINDY,
      label: 'THE SISTERS',
      note: 'Cindy, Sandy and Mindy start with every Overdrive full, so the joint attack comes first. Alone, a sister uses Mega Graviton when her own gauge is full.',
      cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §4.2',
    },
    {
      bossId: SANDY,
      label: 'THE PAIR',
      note: 'Sandy and Mindy start empty and have no joint attack: five plain turns, then Mega Graviton on the sixth, each for herself. A blow that reaches one adds a little to her gauge.',
      cite: 'ffx-mirror-aeons §2; re-ffx-dark-aeons §5.4',
    },
    {
      bossId: YOJIMBO,
      label: 'DARK YOJIMBO',
      note: 'Wakizashi on all, Kozuka on one and his dog, at random, until his blade is full: then Zanmato on everyone.',
      cite: 'ffx-mirror-aeons §3; re-ffx-yojimbo-sisters-feasibility §4.1',
    },
  ],
};

export default MIRROR_AEONS_GUIDE;
