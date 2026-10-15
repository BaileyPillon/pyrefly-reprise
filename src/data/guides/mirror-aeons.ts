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
      text: 'Send an aeon in before the big move. The sisters open with their joint attack, Dark Yojimbo ends his build-up with Zanmato, and Auto-Life does not turn either: an aeon takes the blow, so the party stands.',
      short: 'An aeon takes the big move',
      cite: 'ffx-mirror-aeons §2, §3; re-ffx-yojimbo-sisters-feasibility §2, §4.1, §4.2; jegged-encounter-guides-ffx-b',
    },
    {
      text: 'Mindy first, then Sandy, then Cindy. Mindy is the smallest of the three and the fastest to fall, and each sister down is one fewer to fill the joint attack.',
      short: 'Mindy first',
      cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §2, §4.2',
    },
    {
      text: 'Ribbon, Auto-Haste, Auto-Phoenix and Auto-Protect do the long work: the sisters and Yojimbo land Petrify, Poison, the Breaks, Slow and Sleep. Quick Hit gets the most blows in.',
      short: 'Armour first, then Quick Hit',
      cite: 'ffx-mirror-aeons §2, §3, §4; re-ffx-yojimbo-sisters-feasibility §2',
    },
    {
      text: "Dark Yojimbo's blade fills each turn and a little more whenever he is struck. When it is full he uses Zanmato: keep an aeon ready, or end him first.",
      short: 'His blade fills, then Zanmato',
      cite: 'ffx-mirror-aeons §3; re-ffx-yojimbo-sisters-feasibility §4.1',
    },
    {
      text: 'Your own Yojimbo is paid to act, and a bigger payment is a better stroke; the Dark ones resist Zanmato, so do not count on it. Your Sisters choose for themselves.',
      short: 'Zanmato is a long shot',
      cite: 'ffx-mirror-aeons §5; re-ffx-yojimbo-sisters-feasibility §2, §5.5',
    },
  ],

  hints: [
    { when: { kinds: ['summon'] }, text: 'Send {target} in: the next big move lands on it, not on the party, and it keeps the party off the floor', cite: 'ffx-mirror-aeons §2, §3; re-ffx-yojimbo-sisters-feasibility §2, §5.1' },
    { when: { kinds: ['attack'], targetId: MINDY }, text: 'Mindy first: the smallest pool of the three. Her Passado hits many times and kills, so her turns are worth cutting short', cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { kinds: ['attack'], targetId: SANDY }, text: 'Sandy hits hard, and her plain blow can Petrify: keep Ribbon or Stoneproof on someone', cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { kinds: ['attack'], targetId: CINDY }, text: 'Cindy is the biggest pool: leave her for last, and keep the potions ready for her Camisade', cite: 'ffx-mirror-aeons §2; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { labels: ['Quick Hit'] }, text: 'Quick Hit: the fastest blow {actor} has, so the most turns before the next big move', cite: 'ffx-mirror-aeons §2, §3; jegged-encounter-guides-ffx-b' },
    { when: { kinds: ['attack'], targetId: YOJIMBO }, text: 'Dark Yojimbo dodges many physical blows (his Luck is high): keep swinging, and do not mistake a miss for a mistake', cite: 'ffx-mirror-aeons §3; re-ffx-yojimbo-sisters-feasibility §2' },
    { when: { labels: ['Potion', 'Hi-Potion', 'X-Potion'] }, text: 'Top {target} up: the multi-hit moves leave a member low, and a second blow would finish them', cite: 'ffx-mirror-aeons §2, §3; re-ffx-yojimbo-sisters-feasibility §2' },
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
      bossId: YOJIMBO,
      label: 'DARK YOJIMBO',
      note: 'Wakizashi on all, Kozuka on one and his dog, at random, until his blade is full: then Zanmato on everyone.',
      cite: 'ffx-mirror-aeons §3; re-ffx-yojimbo-sisters-feasibility §4.1',
    },
  ],
};

export default MIRROR_AEONS_GUIDE;
