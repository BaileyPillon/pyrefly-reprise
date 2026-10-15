/**
 * The hidden Biran and Yenke chapter, Kimahri's solo trial at the Mountain Gate of Mt. Gagazet
 * [research/re-ffx-biran-yenke.md "RE section n", research/ffx-seymour-flux.md section 6.1, research/ffx-combat-core.md sections 2.7 and 5.8].
 *
 * Written against the tactic in `src/engine/tactics/biran-yenke.ts`: every hint below explains a row that file asks for (a potion, a Rage, Lancet, the plain Attack when the brothers are apart), so each
 * line says why the command the player is told to press is the right one.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The brothers, their half-HP Rages and Kimahri's Lancet learning exist only in FFX; no FFX-2 file reads this one.
 *
 * It follows Jegged's Mt. Gagazet walkthrough ("Biran and Yenke", Mountain Gate: learn every ability with Lancet, then wear the pair down with Lancet and Ronso Rage; the order they fall in matters) in our
 * own words, and **where the game's own file says more or says otherwise, the file wins** (rule 6, the note): the brothers' moves are the note's cycles (RE section 5.3), the guard is the note's defence swap
 * (RE section 5.6: only Kimahri's plain Attack triggers it, and only while the brothers stand on the same side), and the Rage lessons are the note's (RE section 7). **No number of the brothers' is here**:
 * their stats are derived from Kimahri's at the battle's start (RE section 3), so nothing printed could be true of every Kimahri. **The advice that follows is true under both** where the walkthrough and the note
 * differ about a Berserk Biran (the note: his half-HP action is cancelled, so Mighty Guard is never offered; the walkthrough: he teaches nothing): learn what Biran carries before Yenke falls. The disagreement
 * itself is in `docs/handoff/ch-biran-yenke.md`, not on the player's page.
 *
 * Not modelled, so not promised: the gear the brothers drop, the Steal (Kimahri has no Steal here: the preset is Chapter I's), the brothers' dialogue.
 */

import type { ChapterGuide } from './types.ts';

/** The two brothers (`src/data/ffx/biran-yenke-ids.ts`). */
export const BIRAN_YENKE_GUIDE_IDS = ['biran-ronso', 'yenke-ronso'] as const;
const BIRAN = BIRAN_YENKE_GUIDE_IDS[0];
const YENKE = BIRAN_YENKE_GUIDE_IDS[1];

const SAME_SIDE = 'ronso.sameSide';

export const BIRAN_YENKE_GUIDE: ChapterGuide = {
  id: 'biran-yenke',
  title: 'Biran and Yenke',
  bossIds: [...BIRAN_YENKE_GUIDE_IDS],

  rules: [
    {
      text: 'Lancet each brother. Kimahri learns one Ronso Rage a cast, and every new Rage fills his Overdrive gauge. The Rages are the way through: a plain Attack is mostly wasted here.',
      short: 'Lancet them, then spend the Rages',
      cite: 're-ffx-biran-yenke §5.6, §7; ffx-combat-core §5.8; ffx-seymour-flux §6.1',
    },
    {
      text: 'Mighty Guard and White Wind are offered only after that brother has called his own, at half his strength. Bring him below half while his brother still stands, give him a turn, then Lancet him.',
      short: 'Half strength opens his own Rage',
      cite: 're-ffx-biran-yenke §5.3, §7; ffx-seymour-flux §6.1',
    },
    {
      text: 'While the brothers stand on the same side, a plain Attack on one only makes the other stand guard. Jump, Thrust Kick and the other Rages are not turned aside, and nor is Lancet.',
      short: 'Together, a plain Attack is wasted',
      cite: 're-ffx-biran-yenke §5.6',
    },
    {
      text: 'Learn what Biran carries before Yenke falls. When Yenke falls, Biran goes Berserk and never offers Mighty Guard; when Biran falls, Yenke fights on Hasted and stronger.',
      short: "Learn Biran's Rages before Yenke falls",
      cite: 're-ffx-biran-yenke §5.4, §7; ffx-seymour-flux §6.1',
    },
    {
      text: 'Every Bulldoze sends the brother who uses it to the other side. Their Rage covers both of them only while they stand on the same side.',
      short: 'Bulldoze swaps sides',
      cite: 're-ffx-biran-yenke §5.3',
    },
  ],

  hints: [
    { when: { labels: ['Lancet'], targetId: BIRAN }, text: 'Lancet {target}: he may teach Thrust Kick, Self-Destruct or Doom, and Mighty Guard once he has called it', cite: 're-ffx-biran-yenke §7; ffx-seymour-flux §6.1' },
    { when: { labels: ['Lancet'], targetId: YENKE }, text: 'Lancet {target}: he may teach Fire Breath, Aqua Breath or Stone Breath, and White Wind once he has called it', cite: 're-ffx-biran-yenke §7; ffx-seymour-flux §6.1' },
    { when: { labels: ['Fire Breath', 'Aqua Breath'] }, text: '{actor} breathes on both brothers: it ignores Magic Defense, and nobody stands guard against a Rage', cite: 're-ffx-biran-yenke §5.6, §7; ffx-combat-core §5.8' },
    { when: { labels: ['Thrust Kick', 'Jump'] }, text: 'A Rage is not a plain Attack: the other brother does not stand guard against it', cite: 're-ffx-biran-yenke §5.6, §7' },
    { when: { labels: ['Self-Destruct'] }, text: 'Self-Destruct ejects {actor}, and he is fighting alone', cite: 'ffx-combat-core §5.8; re-ffx-biran-yenke §4' },
    { when: { kinds: ['attack'], targetId: BIRAN, flags: { [SAME_SIDE]: 1 } }, text: 'The brothers stand together: the other one guards, and this lands for next to nothing', cite: 're-ffx-biran-yenke §5.6' },
    { when: { kinds: ['attack'], targetId: YENKE, flags: { [SAME_SIDE]: 1 } }, text: 'The brothers stand together: the other one guards, and this lands for next to nothing', cite: 're-ffx-biran-yenke §5.6' },
    { when: { kinds: ['attack'], targetId: BIRAN, flags: { [SAME_SIDE]: 0 } }, text: 'The brothers are apart: nobody guards, so the blow lands in full', cite: 're-ffx-biran-yenke §5.3, §5.6' },
    { when: { kinds: ['attack'], targetId: YENKE, flags: { [SAME_SIDE]: 0 } }, text: 'The brothers are apart: nobody guards, so the blow lands in full', cite: 're-ffx-biran-yenke §5.3, §5.6' },
    { when: { labels: ['Potion', 'Hi-Potion', 'X-Potion', 'Mega-Potion'] }, text: 'Top {target} up: he is the only one standing, and a Bulldoze or a breath takes a large share of him', cite: 're-ffx-biran-yenke §4, §6' },
  ],

  watch: [],

  phases: [
    {
      bossId: BIRAN,
      label: 'THE BROTHERS',
      note: 'Biran: Thunder, Bulldoze, Blizzard, Bulldoze. Yenke: Fire Breath, Aqua Breath, Bulldoze. Each calls his own Rage at half strength, and the one left standing grows stronger when the other falls.',
      cite: 're-ffx-biran-yenke §5.3, §5.4',
    },
  ],
};

export default BIRAN_YENKE_GUIDE;
