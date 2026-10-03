/**
 * Chapter 1 — Seymour Flux and the Mortiorchis [research/ffx-seymour-flux.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. The RULES, WATCH and phase notes and the NEXT line
 * (`./lines/seymour-flux.ts`) follow the FFX encounter guide the project settled on (D-350,
 * `research/jegged-encounter-guides-ffx-a.md` Chapter 1); `cite` names the research section that
 * backs each mechanic and is never rendered. The `hints` below are the move advisor's borrowed
 * sentences for the chapter tactic's pick (`src/engine/tactics/seymour-flux.ts`): the panel does
 * not read them, and they are left exactly as the advisor needs them.
 */

import type { ChapterGuide } from './types.ts';
import { SEYMOUR_FLUX_LINE } from './lines/seymour-flux.ts';

export const SEYMOUR_FLUX_GUIDE: ChapterGuide = {
  id: 'seymour-flux',
  title: 'Seymour Flux',
  bossIds: ['seymour-flux', 'mortiorchis'],

  rules: [
    {
      text: "Cure a Zombie at once. Lance of Atrophy can turn someone into a Zombie, and the mount's Full-Life kills a Zombie outright. Holy Water or a Remedy clears it first, and the Full-Life does nothing.",
      short: 'Holy Water the Zombie before the mount acts',
      cite: 'ffx-seymour-flux §6 row 4, §3.3',
    },
    {
      text: 'Poison him in the first turns and keep Hastega on the party. Poison takes 1,400 a turn off his 70,000 for the whole fight, and Haste gives you the extra turns to cure, heal and swing.',
      short: 'Poison him early and keep Hastega up',
      cite: 'ffx-seymour-flux §6 rows 5-6 and 10, §4.3',
    },
    {
      text: 'When Seymour puts Reflect or Protect on himself, Dispel it. Strip the Reflect quickly and his next Flare bounces back onto him for about 1,734.',
      short: 'Dispel his Reflect and Protect',
      cite: 'ffx-seymour-flux §6 rows 8-9, §5.3',
    },
    {
      text: "Total Annihilation is the killer, and it is announced. Below half HP the Mortiorchis enters Auto-Attack Mode, then says it is Ready To Annihilate, and the blast lands on its next turn. Put Shell on the party first (Kimahri's Mighty Guard does it in one turn). Or summon an aeon right after Seymour acts: it takes the whole blast, and he cannot banish it before then. Keep aeons for that, because he banishes them.",
      short: 'Shell or Mighty Guard before Total Annihilation',
      cite: 'ffx-seymour-flux §4.4.2, §5.2, §6 rows 13 and 15',
    },
    {
      text: 'Kill Seymour, not the mount. The Mortiorchis has no death state: its max HP floors at 1,000 and it revives for ever, so every kill only drains a little HP out of Seymour.',
      short: 'Kill Seymour, not the mount',
      cite: 'ffx-seymour-flux §2.2, §6 row 17',
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
      text: 'Haste roughly doubles your turns against theirs — the margin the Holy Water rhythm needs to beat the mount’s Full-Life',
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
      payload: 'Total Annihilation is charging',
      advice: "Get Shell on the party now: Kimahri's Mighty Guard does it in one turn, and Shell halves roughly 3,300 to 4,145 of magic",
      cite: 'ffx-seymour-flux §5.2, §6 row 13',
    },
    {
      name: 'Ready To Annihilate',
      payload: 'Total Annihilation, next turn',
      advice: 'Shell the party if it is not up, or summon an aeon right after Seymour acts and let it take the blast',
      cite: 'ffx-seymour-flux §4.4.2, §5.2',
    },
  ],

  phases: [
    {
      aboveHpFraction: 0.5,
      label: 'Phase 1',
      note: 'Lance of Atrophy into Full-Life, then a party-wide Dispel and Cross Cleave behind it. Cure the Zombie, keep Hastega up and top the party off.',
      cite: 'ffx-seymour-flux §4.2',
    },
    {
      belowHpFraction: 0.5,
      label: 'Phase 2',
      note: 'Cross Cleave is gone. He casts Flare, and the Mortiorchis starts the Total Annihilation warning, so Shell replaces Protect from here.',
      cite: 'ffx-seymour-flux §4.4',
    },
  ],

  line: SEYMOUR_FLUX_LINE,
};
