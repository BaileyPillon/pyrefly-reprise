/**
 * The Leblanc Syndicate — Chateau Leblanc, FFX-2 Chapter 2
 * [research/ffx2-leblanc-syndicate.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Nothing in this file exists
 * in FFX.
 *
 * **Not registered.** `src/data/guides/index.ts` is integrator-only
 * [docs/plans/chapter-leblanc-review.md §8, track I] and its `GUIDES` array
 * carries a hard length assertion (`tests/unit/strategy-guide.test.ts`), the
 * same reason `src/engine/tactics/ffx2-leblanc.ts` is unregistered. The
 * integrator adds **two lines**, in the same commit as `src/data/encounters.ts`
 * and `src/engine/tactics/index.ts`:
 *
 * ```ts
 * import { FFX2_LEBLANC_GUIDE } from './ffx2-leblanc.ts';
 * // ...in GUIDES:
 * FFX2_LEBLANC_GUIDE,
 * ```
 *
 * Three acts, three different bestiary records per person
 * (`leblanc-syndicate-acts.ts`), so `bossIds` lists every id across all three
 * — the same pattern `ffx2-vegnagun-shuyin.ts` uses for its five-link chain.
 *
 * This chapter has **no telegraphed ability** — nothing in
 * `src/battle/ffx2/ai/leblanc-syndicate.ts` emits a `charge` event, so
 * `watch` is empty, the same as `yunalesca.ts` and `braskas-final-aeon.ts`.
 */

import type { ChapterGuide } from './types.ts';

export const FFX2_LEBLANC_GUIDE: ChapterGuide = {
  id: 'ffx2-leblanc',
  title: 'Leblanc',
  bossIds: [
    'leblanc',
    'logos',
    'ormi',
    'logos-room',
    'ormi-logos-room',
    'ormi-entrance',
    'dr-goon',
    'fem-goon',
  ],

  rules: [
    {
      text: 'Kill order: Logos, then Ormi, then Leblanc. Either henchman dying switches off No Love Lost, and Ormi only reaches Huggles once he is the last one standing — so Leblanc dies last, not first.',
      short: 'Kill order: Logos, then Ormi, then Leblanc',
      cite: 'ffx2-leblanc-syndicate §5.4',
    },
    {
      text: 'Dispel strips Not-So-Mighty Guard in one action — it is Protect, Shell and Regen on all three at once, and Dispel already removes all three statuses.',
      short: 'Dispel strips Not-So-Mighty Guard in one action',
      cite: 'ffx2-leblanc-syndicate §4.4',
    },
    {
      text: "Send magic at Ormi, not swords: his Defense 84 floors physicals but his Magic Defense is only 16, so a Black Mage's Fira does two and a half times what a Warrior's sword does.",
      short: 'Magic through Ormi, not swords',
      cite: 'ffx2-leblanc-syndicate §3.4, §6.2',
    },
    {
      text: 'Bank a heal before Ormi crosses a quarter of his max HP — Concussive Blast hits the whole party for 281-317 and no Defense stat reduces it.',
      short: 'Bank a heal before Ormi hits 25% HP',
      cite: 'ffx2-leblanc-syndicate §5.4, §6.1',
    },
    {
      text: 'Nothing in the bag cures Eject. Russian Roulette rolls exactly one of Death, Petrify, Eject or three lesser statuses, and Logos is the one throwing it — killing him first is the only defence.',
      short: 'Nothing cures Eject — kill Logos first',
      cite: 'ffx2-leblanc-syndicate §4.2, §4.3, §7.5',
    },
  ],

  hints: [
    {
      // On Ormi only: aimed at Leblanc (Magic Defense 62) this line would be
      // backwards, the same target-blind shape as PR-0144.
      when: { labels: ['Fira', 'Blizzara', 'Thundara', 'Watera', 'Fire', 'Blizzard', 'Thunder', 'Water'], targetId: 'ormi' },
      text: "Ormi's Magic Defense is only 16 against his Defense 84 — this is the route that actually hurts him",
      cite: 'ffx2-leblanc-syndicate §3.4, §6.2',
    },
    {
      when: { labels: ['Cheap Shot'] },
      text: "Ignores Defense outright, so it does not care that Ormi's is 84",
      cite: 'ffx2-leblanc-syndicate §6.2, §7.3',
    },
    {
      when: { labels: ['Dispel'] },
      text: 'Strips Protect, Shell and Regen from every Syndicate member at once — the only counter-play the record names for Not-So-Mighty Guard',
      cite: 'ffx2-leblanc-syndicate §4.4',
    },
    {
      when: { labels: ['Armor Break'] },
      text: 'Dead on Leblanc (she is immune to DEF Down) but works on Logos and Ormi — the same swing, one target it never touches',
      cite: 'ffx2-leblanc-syndicate §3.1',
    },
    {
      when: { labels: ['Power Break'] },
      text: 'Dead on Leblanc (STR Down immune) but Ormi and Logos both take it',
      cite: 'ffx2-leblanc-syndicate §3.1',
    },
    {
      when: { labels: ['Cure', 'Cura', 'Vigor', 'Hi-Potion', 'Potion'] },
      text: 'Top up before Ormi drops under a quarter HP — Concussive Blast is a flat hit to everyone and no armor reduces it',
      cite: 'ffx2-leblanc-syndicate §5.4, §6.1',
    },
    {
      when: { labels: ['Soft'] },
      text: "Cures the Petrify Russian Roulette can roll — Eject on the same roll has no cure at all, so keeping Logos' turns down matters more",
      cite: 'ffx2-leblanc-syndicate §4.2, §4.3',
    },
    {
      // Keyed on the target, not on Logos being in the fight [PR-0144]: with
      // `bossId` every Attack on Ormi read Logos' evasion as its reason.
      when: { kinds: ['attack'], targetId: 'logos' },
      text: "Logos' Evasion 40 is the highest in the fight — a plain swing misses him more than it hits",
      cite: 'ffx2-leblanc-syndicate §3.2',
    },
    {
      when: { kinds: ['attack'], targetId: 'leblanc' },
      text: 'Her Defense 10 against a Magic Defense of 62 makes the sword the right route on her — the opposite of Ormi',
      cite: 'ffx2-leblanc-syndicate §3.1, §3.4',
    },
  ],

  // No `charge` event fires anywhere in this fight's script — every ability
  // resolves the turn it is chosen, unlike Bahamut's Mega Flare countdown or
  // Vegnagun's Charge Core. Nothing to watch for.
  watch: [],

  phases: [
    {
      bossId: 'ormi-entrance',
      label: 'ACT I — Chateau Entrance',
      note: "Ormi's Defense 120 floors physicals and his Magic Defense 4 does the opposite — this act exists to teach that split before Act III asks for it under pressure.",
      cite: 'ffx2-leblanc-syndicate §2',
    },
    {
      bossId: 'logos-room',
      label: 'ACT II — Logos’ Room',
      note: 'Logos and Ormi together, the same opposite defensive shapes on the field at once, and Russian Roulette makes its first appearance — Death, Petrify or Eject on a random target.',
      cite: 'ffx2-leblanc-syndicate §2',
    },
    {
      bossId: 'leblanc',
      label: 'ACT III — the Last Room',
      note: "All three at once. No Love Lost fires on Leblanc's 3rd, 11th and 19th turn while both henchmen are alive — kill either one first and it never triggers again.",
      cite: 'ffx2-leblanc-syndicate §4.5, §5.3',
    },
  ],
};

export default FFX2_LEBLANC_GUIDE;
