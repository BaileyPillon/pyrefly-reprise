/**
 * Chapter X — Seymour Natus and Mortibody, on the Highbridge of Bevelle
 * [research/ffx-seymour-natus-highbridge.md].
 *
 * Written against the tactic in `src/engine/tactics/seymour-natus.ts`: every
 * hint below explains a row that file asks for (an aeon and its Overdrive,
 * Soft, Life, Phoenix Down, Cura, Hi-Potion, Talk, the switch to Auron,
 * Shell, Defend, Attack), so each line says why the command the player is
 * being told to press is the right one.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, aeons, Banish, Trigger
 * Commands and the FFX status set; research §0.3: FFX-2 has no Natus, no
 * Mortibody and no Highbridge boss.
 *
 * Every number is the research's: HP 36,000, Defense 0 and Magic Defense 0
 * (§1.1), the thresholds below 24,000 and below 12,000 (§4.1 and the plan's
 * Review correction), Break then the Claw's 90 % shatter (§3, §5,
 * [decompiled]), Banish after one aeon turn (§4.3, [verified: 4 sources]),
 * Desperado on Haste on all three (§4.3, [verified: 3 sources]), the drain
 * 4,000 / 3,000 / 2,000 / 1,000 (§4.4, [verified: 4 sources]), Talk +10
 * (§6.2, [verified: 4 sources]). The buff-count Desperado ladder is **not**
 * built (B6 = a, single source) and the guide says so rather than teach it.
 * Jegged's Magic Break and GameFAQs' Delay advice fail here (§6.3), so the
 * guide never gives them.
 */

import type { ChapterGuide } from './types.ts';

export const SEYMOUR_NATUS_GUIDE: ChapterGuide = {
  id: 'seymour-natus',
  title: 'Seymour Natus',
  // Natus first (the battle ends when he falls, §4.5); Mortibody is his part.
  bossIds: ['seymour-natus', 'mortibody'],

  rules: [
    {
      text: 'Natus has no Defense and no Magic Defense: every point lands in full. The wall is his 36,000 HP, and the fight changes each time a hit carries him lower.',
      short: 'No Defense: the wall is his 36,000 HP',
      cite: 'ffx-seymour-natus-highbridge §1.1, §4.1',
    },
    {
      text: 'Below 24,000 he starts to Break, turning a guardian to stone, and Mortibody’s Claw shatters a stone guardian nine times in ten. A shattered guardian is gone for the rest of the battle. Soften the stone at once.',
      short: 'Stone? Soft it before the Claw lands',
      cite: 'ffx-seymour-natus-highbridge §3, §4.1, §5',
    },
    {
      text: 'Haste on all three active guardians calls Desperado from Mortibody: about 500 to everyone, and it strips Shell, Protect, Reflect, Haste and Regen. Never Haste all three.',
      short: 'Never Haste all three: it calls Desperado',
      cite: 'ffx-seymour-natus-highbridge §3.2, §4.3, §6.3 row 7',
    },
    {
      text: 'He Banishes an aeon after its first turn. Send one with a full gauge and let its Overdrive be that turn. Bahamut arrives full.',
      short: 'An aeon gets one turn: make it an Overdrive',
      cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 row 3; B3',
    },
    {
      text: 'Mortibody always comes back. Each time it falls it drains Natus for its own maximum HP, 4,000 first, then 3,000, 2,000 and 1,000.',
      short: 'Felling Mortibody drains Natus',
      cite: 'ffx-seymour-natus-highbridge §4.4',
    },
  ],

  hints: [
    {
      when: { kinds: ['overdrive'] },
      text: 'He Banishes an aeon after its one turn, so spend the full gauge now, into Defense 0',
      cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 rows 3 and 8',
    },
    {
      when: { kinds: ['summon'] },
      text: 'The aeon gets one turn before he Banishes it; the relay sends them one at a time, Bahamut first',
      cite: 'ffx-seymour-natus-highbridge §4.3, §6.3 row 3; B3',
    },
    {
      when: { labels: ['Soft'] },
      text: 'The Claw shatters a stone guardian nine times in ten, and a shattered guardian is gone for the battle',
      cite: 'ffx-seymour-natus-highbridge §3, §5',
    },
    {
      when: { labels: ['Life', 'Phoenix Down'] },
      text: 'Stand {target} back up before his next spell',
      cite: 'ffx-seymour-natus-highbridge §4.1',
    },
    {
      when: { labels: ['Cura', 'Hi-Potion'] },
      text: 'Multi-ra hits two guardians for about a thousand each, and Flare one for twice that: keep {target} out of reach',
      cite: 'ffx-seymour-natus-highbridge §3.3',
    },
    {
      when: { kinds: ['trigger'] },
      text: 'Talking to him is free power in this fight: +10 Strength for Tidus and Auron, +10 Magic Defense for Yuna',
      cite: 'ffx-seymour-natus-highbridge §6.2, §3.3',
    },
    {
      when: { kinds: ['switch'] },
      text: 'Auron brings a second heavy sword and his own Talk; against Defense 0 two swords win the race',
      cite: 'ffx-seymour-natus-highbridge §3.3, §6.2, §6.3 row 4',
    },
    {
      when: { labels: ['Shell'] },
      text: 'Shell halves every spell he and Mortibody cast',
      cite: 'ffx-seymour-natus-highbridge §3.3, §6.3 row 4',
    },
    {
      when: { kinds: ['defend'] },
      text: 'Nothing to mend this turn; Yuna waits for the next heal',
      cite: 'ffx-seymour-natus-highbridge §6.3 row 4',
    },
    {
      when: { kinds: ['attack'], targetId: 'seymour-natus' },
      text: 'Defense 0: every point of the swing lands. Each line his HP crosses changes what he does next',
      cite: 'ffx-seymour-natus-highbridge §1.1, §3.3, §4.1',
    },
  ],

  // Natus and Mortibody wind nothing up: the combo and the phases need no charge event.
  watch: [],

  phases: [
    {
      aboveHpFraction: 2 / 3,
      label: 'Above 24,000',
      note: 'Mortibody casts one element on everyone, then Natus casts the same element, stronger, on two of you.',
      cite: 'ffx-seymour-natus-highbridge §4.1',
    },
    {
      aboveHpFraction: 1 / 3,
      label: 'Below 24,000',
      note: 'Break turns a guardian to stone; the Claw shatters stone. His pattern moves only when an action hits him, never on a Poison tick.',
      cite: 'ffx-seymour-natus-highbridge §4.1, §4.2',
    },
    {
      label: 'Below 12,000',
      note: 'Natus casts Flare; Mortibody Curas him for about 1,200.',
      cite: 'ffx-seymour-natus-highbridge §3.3, §4.1',
    },
  ],
};

export default SEYMOUR_NATUS_GUIDE;
