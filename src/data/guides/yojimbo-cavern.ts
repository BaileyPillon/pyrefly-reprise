/**
 * Chapter IX — Yojimbo, in the Cavern of the Stolen Fayth
 * [research/ffx-yojimbo.md, candidate A].
 *
 * Written against the tactic in `src/engine/tactics/yojimbo-cavern.ts`: every
 * `labels` entry below is a row that file asks for (Doom, Fira, Cura,
 * Curaga, Life, Phoenix Down, an aeon, Defend), so each hint explains the
 * command the player is being told to press.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. CTB, aeons, an enemy Overdrive
 * gauge and Ronso Rage Doom; research §0.3: "None of these facts transfers
 * across games". The FFX-2 Yojimbo (§8.2) is a different fight.
 *
 * Every number is the research's: HP 33,000, Defense 80 and Magic Defense 0
 * (§2.1), Doom count 5 (§2.1, [verified: 4 sources]), +3 % per targeting and
 * +2 % per attack (§4.1, [single source]), the 25 / 50 / 100 bands (§4.1,
 * [verified: 3 sources]), Zanmato 9,999 to the whole party (§3.1, [verified:
 * 4 sources]). The odds inside each band are our estimate (B2, D-050) and
 * the guide never states them.
 */

import type { ChapterGuide } from './types.ts';

export const YOJIMBO_CAVERN_GUIDE: ChapterGuide = {
  id: 'yojimbo-cavern',
  title: 'Yojimbo',
  // Ginnem and Daigoro are untargetable bystanders (B3, D-051); the chapter is found by Yojimbo alone.
  bossIds: ['yojimbo'],

  rules: [
    {
      text: 'Kimahri arrives with Doom and a full gauge. Doom lands on Yojimbo, and he falls five of his own turns later, whatever his HP. This is the only fight where it works on him.',
      short: 'Open with Kimahri’s Doom: five turns, then gone',
      cite: 'ffx-yojimbo §2.1, §2.3, §5.3 row 1',
    },
    {
      text: 'Every action that targets him adds 3 to his gauge, and every attack he makes adds 2. At 100 he uses Zanmato: 9,999 to each member of the party, fatal to all three.',
      short: 'Each action aimed at him fills his gauge',
      cite: 'ffx-yojimbo §4.1, §3.1, §3.3',
    },
    {
      text: 'Defense 80 and Magic Defense 0: a sword lands at about half, a spell at full strength. Lulu is the best attacker in her own fight.',
      short: 'Spells, not swords: Lulu hits hardest',
      cite: 'ffx-yojimbo §2.1, §3.3, §5.3 row 4',
    },
    {
      text: 'Once his gauge is high, put an aeon in front of him. Zanmato then hits the aeon, not the party.',
      short: 'Gauge high: summon an aeon to take Zanmato',
      cite: 'ffx-yojimbo §3.3, §5.3 row 3',
    },
    {
      text: 'Lady Ginnem and Daigoro cannot be targeted. The dog bites only when Yojimbo orders it.',
      short: 'Ginnem and Daigoro cannot be targeted',
      cite: 'ffx-yojimbo §2.5; B3 (our estimate)',
    },
  ],

  hints: [
    {
      when: { labels: ['Doom'] },
      text: 'Doom lands on him and counts down five of his turns, then kills him outright',
      cite: 'ffx-yojimbo §2.1, §2.3, §5.3 row 1',
    },
    {
      when: { labels: ['Fira', 'Blizzara', 'Thundara', 'Watera'] },
      text: 'Magic Defense 0 takes a -ra spell at full strength, and one cast fills his gauge by one targeting, not one per hit',
      cite: 'ffx-yojimbo §2.1, §3.3, §4.1',
    },
    {
      when: { kinds: ['summon'] },
      text: 'His gauge is high: an aeon on the field takes Zanmato in place of the party',
      cite: 'ffx-yojimbo §3.3, §5.3 row 3',
    },
    {
      when: { labels: ['Curaga', 'Cura', 'Cure'] },
      text: 'Keep the party up while Doom counts down. A heal names no enemy, so it adds nothing to his gauge',
      cite: 'ffx-yojimbo §4.1, §5.3 row 2',
    },
    {
      when: { labels: ['Life', 'Phoenix Down'] },
      text: 'Stand {target} back up. A revive aimed at the party adds nothing to his gauge',
      cite: 'ffx-yojimbo §4.1',
    },
    {
      when: { kinds: ['defend'] },
      text: 'Nothing to add this turn. Every action aimed at him fills his gauge, so a quiet turn keeps Zanmato further off',
      cite: 'ffx-yojimbo §4.1',
    },
    {
      when: { kinds: ['attack'] },
      text: 'A physical hit lands at about half against Defense 80, and it still fills his gauge',
      cite: 'ffx-yojimbo §2.1, §3.3, §4.1',
    },
  ],

  // Yojimbo winds nothing up: the gauge is drawn by its own widget, and Zanmato comes with no charge event.
  watch: [],

  phases: [
    {
      label: 'The Zanmato gauge',
      note: 'Below 25 he only sends the dog. From 25 he adds Kozuka, from 50 Wakizashi, and at 100 Zanmato.',
      cite: 'ffx-yojimbo §4.1',
    },
  ],
};

export default YOJIMBO_CAVERN_GUIDE;
