/**
 * Chapter 5 — the Vegnagun chain and Shuyin
 * [research/ffx2-vegnagun-shuyin.md §7].
 *
 * Five battles, a different boss id in each, and the advice genuinely changes
 * between them — §7.2 is a per-battle table, not a single line — so most of
 * what this guide says lives in `phases`, keyed by the boss on the field.
 */

import type { ChapterGuide } from './types.ts';

export const FFX2_VEGNAGUN_SHUYIN_GUIDE: ChapterGuide = {
  id: 'ffx2-vegnagun-shuyin',
  title: 'Vegnagun',
  bossIds: ['vegnagun-tail', 'vegnagun-leg', 'vegnagun-body', 'vegnagun-head', 'shuyin'],

  rules: [
    {
      text: 'Two Dark Knights on Darkness, one healer. Darkness ignores Defense, reaches the long-range Nodes, and hits every enemy at once — one action clears both Bulwarks or both Redoubts.',
      short: 'Two Dark Knights on Darkness, one healer',
      cite: 'ffx2-vegnagun-shuyin §7.1',
    },
    {
      text: 'Ignore the Nodes and the Redoubts past the point they stop hurting: the Nodes hold 300,000 HP and the Redoubts revive. All the damage that matters goes into the limb.',
      short: 'Ignore the Nodes and Redoubts — hit the limb',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      text: 'Against the Tail, raw max HP is the only defence — Tail Beam is a percentage of max HP and Noli Me Tangere is a flat constant, so buffs do nothing.',
      short: 'Against the Tail, max HP is the only defence',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      text: 'Re-buff after Odi Et Amo. It strips every buff on the party, so Mighty Guard has to go back up before the next cycle.',
      short: 'Re-buff after Odi Et Amo strips the party',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      text: "Terror of Zanarkand ignores Defense and hunts one character. Protect still reduces it, armour does not, and one healer stays dedicated to whoever ate it.",
      short: 'Terror of Zanarkand: Protect helps, armour does not',
      cite: 'ffx2-vegnagun-shuyin §7.2, §3.5',
    },
  ],

  hints: [
    {
      when: { labels: ['Darkness'] },
      text: 'Darkness ignores Defense, reaches every enemy including the long-range Nodes, and costs HP rather than MP — which Curaga pays for',
      cite: 'ffx2-vegnagun-shuyin §7.1',
    },
    {
      when: { labels: ['Lunar Curtain', 'Shell'] },
      text: 'Shell on all three: Vegnagun’s entire moveset is magic-type, so this is the half that matters most',
      cite: 'ffx2-vegnagun-shuyin §7.2, §7.3',
    },
    {
      when: { labels: ['Light Curtain', 'Protect'] },
      text: 'Protect is the one mitigation Terror of Zanarkand still respects — it ignores Defense, but it is Protect-reducible',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      when: { labels: ['Megalixir', 'Mega Phoenix', 'Mega-Potion'] },
      text: 'A party-wide answer, because the hit that got here was party-wide — Nemo Ante Mortem Beatus fires at every 20% HP milestone the Head crosses',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      when: { labels: ['Remedy', 'Esuna'] },
      text: 'Clear it now: Vita Brevis is party-wide with a guaranteed Delay, and a delayed girl is a girl who is not healing',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      when: { labels: ['X-Potion', 'Elixir', 'Curaga', 'Hi-Potion', 'Cura', 'Potion'] },
      text: 'Keep everyone above the constant — Noli Me Tangere is a flat 1,323 and nothing in the party’s kit reduces it',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      when: { labels: ['Life', 'Full-Life', 'Phoenix Down'] },
      text: 'Stand {target} up before the next cycle — this chain does not stop between links and a downed girl carries into the next one',
      cite: 'ffx2-vegnagun-shuyin §2',
    },
    {
      when: { labels: ['Black Sky'] },
      text: 'Magic routes around the Right Redoubt’s Magic Defense 0 while the physicals go at the Left',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      when: { labels: ['Turbo Ether', 'Ether'] },
      text: 'MP is the chain’s real resource — five battles run on one pool and nothing refills it in between',
      cite: 'ffx2-vegnagun-shuyin §6.8',
    },
    {
      when: { labels: ['Pray'] },
      text: 'A free party heal when the MP has run out, which in a five-battle chain it eventually does',
      cite: 'ffx2-vegnagun-shuyin §6.4',
    },
    {
      when: { kinds: ['attack'] },
      text: 'Physical damage belongs on the Left Redoubt (Defense 0) — everything else takes magic or Darkness',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
  ],

  watch: [
    {
      name: 'Charge Core',
      payload: 'Memento Mori',
      advice: 'Three unimpeded Core turns and it fires — killing a Bulwark makes the Core waste its turn on Full-Life and stops the counter',
      cite: 'ffx2-vegnagun-shuyin §4.1, §7.2',
    },
    {
      name: 'Memento Mori',
      payload: 'Memento Mori, now',
      advice: 'It is landing this turn; heal through it and then break the charge by killing a Bulwark',
      cite: 'ffx2-vegnagun-shuyin §4.1, §7.2',
    },
    {
      name: 'Terror of Zanarkand',
      payload: 'Terror of Zanarkand',
      advice: 'Nine Defense-ignoring hits on one girl — Protect reduces them, armour does not, and the healer is hers for the next two turns',
      cite: 'ffx2-vegnagun-shuyin §7.2, §5.5',
    },
  ],

  phases: [
    {
      bossId: 'vegnagun-tail',
      label: 'Tail',
      note: 'Buffs are near-useless: Tail Beam is a percentage of max HP and Noli Me Tangere a flat constant. Keep everyone above 1,323 HP and hit it.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      bossId: 'vegnagun-leg',
      label: 'Leg and Nodes',
      note: 'All 18,220 HP of damage goes into the Leg; the Nodes hold 300,000 and are not the fight. Reflect on the Leg bounces the Green Node’s buffs onto you.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      bossId: 'vegnagun-body',
      label: 'Body and Bulwarks',
      note: 'Two Darknesses clear both Bulwarks and chunk the Core. Do not hit a Bulwark twice with the same damage class — they mirror it back.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      bossId: 'vegnagun-head',
      label: 'Head and Redoubts',
      note: 'Right Redoubt dies to magic, Left to physicals, then burn the Head. Odi Et Amo strips every buff; Nemo Ante Mortem Beatus fires at each 20% milestone.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      bossId: 'shuyin',
      label: 'Shuyin',
      note: 'Protect and Shell on all three, Haste the attackers, and keep one healer free for whoever Terror of Zanarkand picks.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
  ],
};
