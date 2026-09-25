/**
 * Chapter XII — Seymour Omnis, in the Garden of Pain inside Sin [research/ffx-seymour-omnis.md].
 *
 * Written against the tactic in `src/engine/tactics/seymour-omnis.ts`: every `labels` entry below
 * is a row that file asks for (Armor Break, the four Nul spells, Hastega, Curaga, Life, Phoenix
 * Down), and the `kinds` hints cover its switch to Wakka and its blows, so each hint explains the
 * command the player is being told to press. The tactic is the bench's intended line, which wins
 * 127 of 200 seeds on the approved build (`docs/plans/omnis-bench.md`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, Nul spells, Armor Break, the party switch;
 * research §0.3: *X-2* has no Seymour fight.
 *
 * Every number is the research's: HP 80,000 and Defense 180 (§1.1), the six and three attacks
 * and the 20,000 line (§4.4, verified: 4-5 sources), Ultima about 3,600 at this party's Magic
 * Defense and "keep HP above 4,000" (§3.3, §5 row 6), the affinity ladder (§4.2, verified: 5
 * sources). **Nothing here names the ring order or the reset cycle**, the two estimates B8 holds
 * the listing on. The two-Water quirk ships faithful and is disclosed here (B9, single source).
 */

import type { ChapterGuide } from './types.ts';

export const SEYMOUR_OMNIS_GUIDE: ChapterGuide = {
  id: 'seymour-omnis',
  title: 'Seymour Omnis',
  // The four Mortiphasms are his parts (`isPart`); the chapter is found by Seymour alone.
  bossIds: ['seymour-omnis'],

  rules: [
    {
      text: 'Each disc casts its own colour at the party, one spell each. A colour on three or four discs comes out as -ga; on one or two, as -ra. The quarter facing him is the one that counts.',
      short: 'Each disc casts its colour; three of one is -ga',
      cite: 'ffx-seymour-omnis §4.1',
    },
    {
      text: 'Only Wakka can reach a disc with a blow, and it turns the disc a quarter one way; a spell turns it the other way. A disc takes no damage and never falls.',
      short: 'Wakka’s blow or a spell turns a disc',
      cite: 'ffx-seymour-omnis §2, §4.3',
    },
    {
      text: 'Armor Break him first: at full Defense a sword barely scratches him. Nul the colour he shows most, and cast Hastega again after every Dispel.',
      short: 'Armor Break, Nul his colour, re-cast Hastega',
      cite: 'ffx-seymour-omnis §3.3, §5 rows 1, 3 and 9',
    },
    {
      text: 'Six attacks on him and he glows red, three once he is below 20,000. Next turn he Dispels the party, the turn after he casts Ultima on everyone, then every disc changes colour. Heal everyone above 4,000 before Ultima; Shell does nothing against it.',
      short: 'Glow, Dispel, Ultima: heal above 4,000 first',
      cite: 'ffx-seymour-omnis §4.4, §5 row 6',
    },
    {
      text: 'The colours he shows are what he resists: one disc halves that element, two stop it, three or four heal him, and four of one colour leave him weak to its opposite. A quirk kept from the original: with exactly two Water discs he stops Fire instead of Water.',
      short: 'His colours resist; four of one open a weakness',
      cite: 'ffx-seymour-omnis §4.2',
    },
  ],

  hints: [
    {
      when: { labels: ['Armor Break'] },
      text: 'At Defense 180 a sword lands for a few hundred; broken, the same blow lands for thousands',
      cite: 'ffx-seymour-omnis §3.3, §5 row 1',
    },
    {
      when: { labels: ['NulBlaze', 'NulFrost', 'NulShock', 'NulTide'] },
      text: 'A Nul cancels one spell of its element on each member. With three discs of one colour, it cancels all three -ga',
      cite: 'ffx-seymour-omnis §3.3, §5 row 3',
    },
    {
      when: { labels: ['Hastega'] },
      text: 'Dispel strips Haste from everyone, so it goes back on after every Dispel',
      cite: 'ffx-seymour-omnis §5 row 9',
    },
    {
      when: { labels: ['Curaga'], flags: { 'omnis.state': 'dispelled' } },
      text: 'Ultima comes next, about 3,600 to everyone, and Shell does not soften it. Lift everyone above 4,000 now',
      cite: 'ffx-seymour-omnis §3.3, §5 row 6',
    },
    {
      when: { labels: ['Curaga'] },
      text: 'His spells land one to a member and the last on anyone, so keep every member well above one -ga',
      cite: 'ffx-seymour-omnis §3.3, §4.1',
    },
    {
      when: { labels: ['Life', 'Phoenix Down'] },
      text: 'Stand {target} back up before his next volley',
      cite: 'ffx-seymour-omnis §4.1',
    },
    {
      when: { kinds: ['switch'] },
      text: 'Wakka is the one member whose blow reaches a disc',
      cite: 'ffx-seymour-omnis §2, §5 row 2',
    },
    {
      when: { kinds: ['attack'], actorId: 'wakka' },
      text: 'A blow on a disc turns it a quarter. Turning one of three matching discs brings his -ga down to -ra',
      cite: 'ffx-seymour-omnis §4.1, §4.3, §5 row 2',
    },
    {
      when: { kinds: ['attack'] },
      text: 'Every attack on him counts toward the red glow; after his Dispel his Defense drops to 100, the turn to hit hardest',
      cite: 'ffx-seymour-omnis §4.4, §5 row 6',
    },
  ],

  // Nothing is telegraphed by a charge: the red glow is the only warning (§4.4, §7).
  watch: [],

  phases: [
    {
      bossId: 'seymour-omnis',
      aboveHpFraction: 0.25,
      label: 'Six to the glow',
      note: 'Six attacks on him light the red glow. Then Dispel, then Ultima, then every disc changes colour.',
      cite: 'ffx-seymour-omnis §4.4',
    },
    {
      bossId: 'seymour-omnis',
      belowHpFraction: 0.25,
      label: 'Three to the glow',
      note: 'Below 20,000 of his 80,000, three attacks are enough, so the glow comes sooner.',
      cite: 'ffx-seymour-omnis §4.4',
    },
  ],
};

export default SEYMOUR_OMNIS_GUIDE;
