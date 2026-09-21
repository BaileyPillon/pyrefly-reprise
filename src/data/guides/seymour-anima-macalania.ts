/**
 * Seymour and Anima, Macalania Temple
 * [research/ffx-seymour-anima-macalania.md].
 *
 * Written against the tactic in
 * `src/engine/tactics/seymour-anima-macalania.ts`: every `labels` entry below
 * is a row that file actually asks for, so a hint fires for the command the
 * player is being told to press rather than for a name that only exists in the
 * research.
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 *
 * Two sentences here are deliberately hedged, because the claims behind them
 * are **owner-approved assumptions, not canon**, and the guide is the one
 * surface in the game that makes explicit claims about mechanics to the player:
 *
 * - Anima's gauge rate is an `[estimate]` (C-4), so the WATCH line says "filling"
 *   and never a number.
 * - The element order persisting into act three is `[single source]` (C-14), so
 *   the act-three phase note says the order "holds" rather than asserting it as
 *   published fact.
 */

import type { ChapterGuide } from './types.ts';

export const SEYMOUR_ANIMA_MACALANIA_GUIDE: ChapterGuide = {
  id: 'seymour-anima-macalania',
  title: 'Seymour and Anima',
  bossIds: ['seymour-macalania', 'anima-macalania', 'guado-guardian-a', 'guado-guardian-b'],

  rules: [
    {
      text: 'Steal from each Guardian once. Until you do, every hit on one triggers a 1,000 HP Auto-Potion counter, and they hand Seymour another 1,000 whenever he drops below 4,800 — two turns of Steal removes more healing than most parties can out-damage.',
      short: 'Steal from each Guardian — it kills their potions',
      cite: 'ffx-seymour-anima-macalania §2.3, §7 row 1',
    },
    {
      text: 'He cycles ice, lightning, water, fire, in that order, and it never varies. His own Scan text says so, which is the point: the matching Nul spell reduces a whole turn to nothing, and it costs 2 MP.',
      short: 'Ice, lightning, water, fire — pre-cast the Nul',
      cite: 'ffx-seymour-anima-macalania §5.2, §7 row 5',
    },
    {
      text: 'Pain carries a 100% Death rider, so on a party member it is not 500 damage, it is a kill — and on an aeon it is only the 500. That asymmetry is the whole of the middle act: summon, and keep something on the field Anima cannot delete.',
      short: 'Pain kills people and only hurts aeons — summon',
      cite: 'ffx-seymour-anima-macalania §4.3, §7 row 11',
    },
    {
      text: 'His HP bar is not a progress bar. Emptying it summons his aeon; beating his aeon gives him the whole bar back, stronger. Budget for roughly 27,000 damage, not 6,000.',
      short: 'His bar comes back once — budget for 27,000',
      cite: 'ffx-seymour-anima-macalania §5.2, §5.4',
    },
    {
      text: 'Act one is the only stretch with turns to spare. Haste, Cheer and a stolen potion bought there are still on the board in act three, where two hits a turn land for roughly 1,700 each.',
      short: 'Spend act one buying tempo, not damage',
      cite: 'ffx-seymour-anima-macalania §6.4, §7 row 10',
    },
  ],

  hints: [
    {
      when: { labels: ['Steal'] },
      text: 'Take the pouch off {target}: one successful Steal ends its 1,000 HP Auto-Potion counter and its Hi-Potions for Seymour — and nothing else, so it will still Remedy him',
      cite: 'ffx-seymour-anima-macalania §2.3, §2.4',
    },
    {
      when: { labels: ['NulFrost', 'NulShock', 'NulTide', 'NulBlaze'] },
      text: 'His next spell is already decided — the Nul that matches it takes the whole hit to zero, for 2 MP out of a bar of 180',
      cite: 'ffx-seymour-anima-macalania §5.2, §7 row 5',
    },
    {
      when: { labels: ['Petrify Grenade', 'Stone Breath'] },
      text: 'The Guardians have no Petrify resistance at all, and a petrified monster shatters — it forfeits the overkill AP and it ends them in one throw',
      cite: 'ffx-seymour-anima-macalania §2.2, §7 row 2',
    },
    {
      when: { labels: ['Poison Fang'] },
      text: 'Poison is 600 a turn on him, a tenth of his bar — but only once the Guardians are dead, because Steal never disabled their Remedy',
      cite: 'ffx-seymour-anima-macalania §1.1, §7 row 8',
    },
    {
      when: { labels: ['Banishing Blade', 'Magic Break'] },
      text: 'Break his Magic and act three halves: Banishing Blade lands at a chance that ignores resistance outright and applies all four at once',
      cite: 'ffx-seymour-anima-macalania §1.3, §7 row 7',
    },
    {
      when: { labels: ['Haste'] },
      text: 'Tempo bought now is still there in act three, when he takes two turns of damage out of the party for every one of theirs',
      cite: 'ffx-seymour-anima-macalania §6.4, §7 row 10',
    },
    {
      when: { labels: ['Shield'] },
      text: 'Oblivion is sixteen hits across everything on the field — unshielded it is a wipe, and shielded an aeon walks out of it',
      cite: 'ffx-seymour-anima-macalania §6.3, §7 row 12',
    },
    {
      when: { labels: ['Diamond Dust', 'Thors Hammer', 'Hellfire', 'Energy Ray'] },
      text: 'Land it while she is Boosted: she takes half again as much, and the multiplier applies before the damage cap',
      cite: 'ffx-seymour-anima-macalania §3.4, §7 row 14',
    },
    {
      when: { labels: ['Shell'] },
      text: 'Shell halves every one of his spells for its whole duration, which is worth more than nullifying one of them once',
      cite: 'ffx-seymour-anima-macalania §6.1, §6.4',
    },
    {
      when: { labels: ['Aerospark'] },
      text: 'He opened the fight Shelled and this Yuna has no Dispel — Aerospark is the free aeon sub-command that strips it and doubles every spell aimed at him',
      cite: 'ffx-seymour-anima-macalania §8.5, §7 row 4',
    },
    {
      when: { labels: ['Talk'] },
      text: 'One line each from Tidus, Yuna and Wakka, once per battle: +10 Strength and +10 Magic Defense twice, for the whole fight',
      cite: 'ffx-seymour-anima-macalania §5.5',
    },
    {
      when: { kinds: ['summon'] },
      text: 'An aeon is the only body on this field that a 100% Death rider cannot delete, and while it holds the field the party is off-stage with frozen counters',
      cite: 'ffx-seymour-anima-macalania §4.3, §7 row 11',
    },
    {
      when: { labels: ['Phoenix Down', 'Life'] },
      text: 'Stand {target} back up — Pain does not damage a party member, it kills them, so this will keep happening until something else is on the field',
      cite: 'ffx-seymour-anima-macalania §4.3',
    },
    {
      when: { labels: ['X-Potion', 'Cura', 'Cure', 'Hi-Potion', 'Potion'] },
      text: 'Top {target} up past the next hit: one of his spells is most of a bar in act one and all of one in act three',
      cite: 'ffx-seymour-anima-macalania §6.1, §6.4',
    },
    {
      when: { kinds: ['attack'] },
      text: 'While a Guardian stands, a swing aimed at Seymour lands on the Guardian instead — magic is the only thing that reaches him',
      cite: 'ffx-seymour-anima-macalania §2.3',
    },
  ],

  watch: [
    {
      name: 'Boost',
      payload: 'half again as much damage taken, until her next turn',
      advice: 'This is the window — spend the biggest thing the party has before she acts again',
      cite: 'ffx-seymour-anima-macalania §3.4, §7 row 14',
    },
    {
      name: '#',
      payload: 'Oblivion — sixteen hits across the field',
      advice: 'Get Shield up. Her gauge is filling whether she acts or is targeted, and it is a race, not something to eat twice',
      cite: 'ffx-seymour-anima-macalania §3.4, §6.3',
    },
  ],

  phases: [
    {
      bossId: 'anima-macalania',
      label: 'Act 2 - Anima',
      note: 'Seymour is on the field and doing nothing. She alternates Boost and Pain while a third clock fills toward Oblivion; an aeon is immune to the kill and only takes the damage.',
      cite: 'ffx-seymour-anima-macalania §5.3',
    },
    {
      aboveHpFraction: 0.5,
      label: 'Act 1 - the retinue',
      note: 'Two Guardians cover him against anything physical and heal him on a counter. Steal first, end them second, and let the elemental order do the rest.',
      cite: 'ffx-seymour-anima-macalania §5.2',
    },
    {
      belowHpFraction: 0.5,
      label: 'Act 3 - alone',
      note: 'Full health again, stronger magic, and the same spell twice in one turn. The published order holds, so the matching Nul still answers it.',
      cite: 'ffx-seymour-anima-macalania §5.4, §12 C-14',
    },
  ],
};

export default SEYMOUR_ANIMA_MACALANIA_GUIDE;
