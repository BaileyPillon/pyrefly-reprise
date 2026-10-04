/**
 * Chapter 4 — Bahamut, in the Bevelle Underground [research/ffx2-bahamut.md §3].
 *
 * The chapter that hands the player its own counter: the Dark Knight dressphere
 * is in this dungeon, on the lift puzzle, and Darkness ignores Bahamut's
 * Defense 160 entirely (§3.2). The hints below follow the corrected Break
 * ranking in §3.3 — **Magic Break first**, not Power Break — because the Breaks
 * turned out to be damage multipliers rather than stat edits (§1.5).
 */

import type { ChapterGuide } from './types.ts';

export const FFX2_BAHAMUT_GUIDE: ChapterGuide = {
  id: 'ffx2-bahamut',
  title: 'Bahamut',
  bossIds: ['bahamut'],

  rules: [
    {
      text: 'Darkness is the damage route. It ignores Defense 160, hits every enemy, costs HP rather than MP, and is free the moment the dressphere is picked up.',
      short: 'Darkness is the damage route',
      cite: 'ffx2-bahamut §3.2',
    },
    {
      text: 'Magic Break is the strongest opening in the fight. Five casts cap Mega Flare at x0.167 and Impulse at 6.25% of current HP — it defuses the whole win condition.',
      short: 'Five Magic Breaks defuse Mega Flare',
      cite: 'ffx2-bahamut §3.3',
    },
    {
      text: 'Shell before anything else if there is no Alchemist. Both Impulse and Mega Flare are magic, and Shell is the single action that turns a guaranteed wipe into a guaranteed survival.',
      short: 'Shell first when there is no Alchemist',
      cite: 'ffx2-bahamut §2.4, §3.3',
    },
    {
      text: 'Physical attacks are the wrong route: Defense 160 floors them per hit, so Trigger Happy gains nothing from being multi-hit.',
      short: 'Physicals are floored by Defense 160',
      cite: 'ffx2-bahamut §3.3',
    },
    {
      text: 'The countdown is five dead enemy actions. They are free party turns — bank healing and finish the Break ladder inside them.',
      short: 'The countdown is five free party turns',
      cite: 'ffx2-bahamut §2.2, §2.5',
    },
  ],

  hints: [
    {
      when: { labels: ['Darkness'] },
      text: 'Darkness ignores his Defense 160 and hits everything — it is why the Dark Knight dressphere is hidden in this dungeon, immediately before this test',
      cite: 'ffx2-bahamut §3.2',
    },
    {
      when: { labels: ['Magic Break'] },
      text: 'Five Magic Breaks cap every spell he owns at x0.167: Mega Flare 1,152 becomes 192 and Impulse drops to 6.25% of current HP',
      cite: 'ffx2-bahamut §3.3',
    },
    {
      when: { labels: ['Mental Break'] },
      text: 'Mental Break is a flat x1.833 on all your magic and does not care that his Magic Defense is only 10 — it is the follow-up Magic Break has already paid for',
      cite: 'ffx2-bahamut §1.5, §3.3',
    },
    {
      when: { labels: ['Armor Break'] },
      text: 'Armor Break is x1.833 on physicals — worth having, but it multiplies the weaker route here, and it anti-synergises with Table-turner',
      cite: 'ffx2-bahamut §3.3',
    },
    {
      when: { labels: ['Shell'] },
      text: 'Shell halves Impulse and Mega Flare, the two biggest threats in the script, and stacks multiplicatively with Magic Break down to x0.083',
      cite: 'ffx2-bahamut §3.3',
    },
    {
      when: { labels: ['Protect'] },
      text: 'Only his turns 2-4 are physical, so Protect is the lesser buff — take it once Shell is up',
      cite: 'ffx2-bahamut §2.3, §3.3',
    },
    {
      when: { labels: ['Cure', 'Cura', 'Vigor', 'Hi-Potion', 'Potion'] },
      text: 'Heal into the countdown, not out of it — Mega Flare lands on the turn the number reaches zero and it hits everyone',
      cite: 'ffx2-bahamut §2.2, §2.4',
    },
    {
      when: { kinds: ['attack'] },
      text: 'A plain swing is crushed by Defense 160; this is the row to take only when nothing better is charged',
      cite: 'ffx2-bahamut §3.3',
    },
  ],

  watch: [
    {
      name: '#',
      payload: 'Mega Flare',
      advice: 'Five dead enemy actions, then it lands on everyone — get Shell up, cap Magic Break, and be at full HP on zero',
      cite: 'ffx2-bahamut §2.2, §2.4, §3.3',
    },
  ],

  phases: [
    {
      label: 'The 12-action loop',
      note: 'Curse, three physicals, two Impulses, then five countdown turns and Mega Flare. The countdown turns are free; spend them on Breaks and healing.',
      cite: 'ffx2-bahamut §2.1, §2.2',
    },
  ],
};
