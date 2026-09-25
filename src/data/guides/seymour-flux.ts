/**
 * Chapter 1 — Seymour Flux and the Mortiorchis [research/ffx-seymour-flux.md].
 *
 * Written against the tactic in `src/engine/tactics/seymour-flux.ts`: every
 * `labels` entry below is a row that file actually asks for, so a hint fires
 * for the command the player is being told to press rather than for a name
 * that only exists in the research.
 */

import type { ChapterGuide } from './types.ts';

export const SEYMOUR_FLUX_GUIDE: ChapterGuide = {
  id: 'seymour-flux',
  title: 'Seymour Flux',
  bossIds: ['seymour-flux', 'mortiorchis'],

  rules: [
    {
      text: 'Kill Seymour, not the mount. Mortiorchis has no death state — its max HP floors at 1,000 and it revives for ever, so every kill is a diminishing tap of HP drained out of Seymour and never a way to remove the adds.',
      short: 'Kill Seymour, not the mount',
      cite: 'ffx-seymour-flux §2.2, §6 row 17',
    },
    {
      text: 'Poison him on turn one. 2% of 70,000 is 1,400 a turn, for ever; he never removes it and it does not trigger his HP-threshold reactions.',
      short: 'Poison him on turn one — 1,400 a turn, for ever',
      cite: 'ffx-seymour-flux §6 rows 5-6, §4.3',
    },
    {
      // Rule 3 (PR-0007) and rule 4 (PR-0008) are known to be wrong against §4.1 / §4.2, but
      // their new wordings wait on Bailey (decisions-2026-09-25 item 5: "the guide wordings,
      // shown to you first"). The choices are in docs/plans/pr-0008-guide-wordings.md. FFX only.
      text: 'Holy Water a Zombie before the mount acts. Lance of Atrophy sets Zombie, and the mount answers with Full-Life — on a living Zombie that is 100% of max HP as damage plus a guaranteed Death.',
      short: 'Holy Water a Zombie before the mount acts',
      cite: 'ffx-seymour-flux §6 row 4, §3.3',
    },
    {
      text: 'Stand the party up before the hit, not after it. Dispel into Cross Cleave arrives with nothing in between, so the only defence is Protect, five Cheer stacks and full HP already being true.',
      short: 'Buff before the Dispel, never after it',
      cite: 'ffx-seymour-flux §4.2, §5.2, §5.5',
    },
    {
      text: 'Provoke, the four Breaks and Delay Attack are all dead rows here — both actors are immune, and a delay counters with party-wide Slowga.',
      short: 'Provoke, Breaks and Delay are dead rows here',
      cite: 'ffx-seymour-flux §6 rows 19-21',
    },
  ],

  hints: [
    {
      when: { labels: ['Holy Water', 'Remedy'], targetHas: 'zombie' },
      text: '{target} is a Zombie and the Mortiorchis answers with Full-Life — cured first it whiffs outright, left alone it is 100% of max HP plus a Death',
      cite: 'ffx-seymour-flux §6 row 4, §3.3',
    },
    {
      when: { labels: ['Poison Fang'] },
      text: 'Poison on turn one is the largest single line in the damage budget: 1,400 a turn off 70,000, for ever, and he never cures it',
      cite: 'ffx-seymour-flux §6 rows 5-6',
    },
    {
      when: { labels: ['Hastega', 'Haste'] },
      text: 'Haste is ctb x 8/16 — roughly double the party’s share of the clock, and the CTB margin the Holy Water rhythm needs to beat the mount’s Full-Life',
      cite: 'ffx-seymour-flux §6 row 10',
    },
    {
      when: { labels: ['Cheer'] },
      text: 'Cheer to five: +1 Strength a stack and physical damage received x(15-stacks)/15, a third off every Cross Cleave, and it targets allies so it never provokes a counter',
      cite: 'ffx-seymour-flux §5.5, §6 row 12',
    },
    {
      when: { labels: ['Shell', 'Lunar Curtain'] },
      text: 'Total Annihilation is magical — Shell halves it, from ~3,300-4,145 to something the party survives',
      cite: 'ffx-seymour-flux §5.2, §6 row 13',
    },
    {
      when: { labels: ['Protect', 'Light Curtain'] },
      text: 'Cross Cleave is ~2,400 on all three against preset HP of 2,420 / 1,500 / 2,310 — unmitigated it is a wipe from full health, and Protect halves it',
      cite: 'ffx-seymour-flux §5.2, §7.3',
    },
    {
      when: { labels: ['Mighty Guard'] },
      text: 'Mighty Guard is Protect and Shell on the whole party in one turn — Kimahri learned it from Biran Ronso minutes ago, on this mountain',
      cite: 'ffx-seymour-flux §6 row 13, §6.1',
    },
    {
      when: { labels: ['Dispel'] },
      text: 'Strip his Reflect and the next Flare detonates on him for ~1,734, then he burns two more turns recasting',
      cite: 'ffx-seymour-flux §6 row 8',
    },
    {
      when: { labels: ['Healing Water', 'Mega-Potion', 'Al Bhed Potion'] },
      text: 'Top the whole party up while there is a turn to spare — the Dispel into Cross Cleave pairing cannot be answered, so being full when it lands is the only defence',
      cite: 'ffx-seymour-flux §4.2, §7.8',
    },
    {
      when: { labels: ['Phoenix Down', 'Life', 'Mega Phoenix'] },
      text: 'Stand {target} back up: a downed member is a member the next Cross Cleave cannot be healed through, and KO clears their Haste and Cheer stacks',
      cite: 'ffx-seymour-flux §4.2',
    },
    {
      when: { kinds: ['summon'] },
      text: 'A summon is a shield before it is a burst — the party leaves the field with frozen counters, his answer is a zero-damage Banish, and the charge ladder stalls while the poison keeps ticking',
      cite: 'ffx-seymour-flux §4.4.2, §6 row 15',
    },
    {
      when: { labels: ['Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion'] },
      text: 'Heal {target} back over the line: Cross Cleave picks its victim and the only thing that saves them is having been full',
      cite: 'ffx-seymour-flux §5.2',
    },
    {
      when: { kinds: ['attack'] },
      text: 'Swing at Seymour himself — piercing is the only way past Defense 40, and Auron’s katana and Kimahri’s spear already have it',
      cite: 'ffx-seymour-flux §6 row 20',
    },
  ],

  watch: [
    {
      name: 'Auto-Attack Mode',
      payload: 'Total Annihilation',
      advice: 'Get Shell up, or Defend — it is ~3,300-4,145 of magic across the party and Shell halves it',
      cite: 'ffx-seymour-flux §5.2, §6 row 13',
    },
    {
      name: 'Ready To Annihilate',
      payload: 'Total Annihilation, next turn',
      advice: 'Shell or Defend now, and top up anyone who would not survive ~4,300 — a summon stalls the ladder outright',
      cite: 'ffx-seymour-flux §4.4.2, §5.2',
    },
  ],

  phases: [
    {
      aboveHpFraction: 0.5,
      label: 'Phase 1',
      note: 'Lance of Atrophy into Full-Life, then Dispel into Cross Cleave with nothing in between — the physical phase.',
      cite: 'ffx-seymour-flux §4.2',
    },
    {
      belowHpFraction: 0.5,
      label: 'Phase 2',
      note: 'Cross Cleave is gone; it is Flare and the Total Annihilation charge ladder from here, so Shell replaces Protect.',
      cite: 'ffx-seymour-flux §4.4',
    },
  ],
};
