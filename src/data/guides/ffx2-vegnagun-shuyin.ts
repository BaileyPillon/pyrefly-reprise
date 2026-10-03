/**
 * Chapter 5 — the Vegnagun chain and Shuyin
 * [research/ffx2-vegnagun-shuyin.md §7].
 *
 * Five battles, a different boss id in each, and the advice genuinely changes
 * between them — §7.2 is a per-battle table, not a single line — so most of
 * what this guide says lives in `phases`, keyed by the boss on the field.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. The RULES, phase notes and the NEXT line
 * (`./lines/ffx2-vegnagun-shuyin.ts`) follow the FFX-2 encounter guide the project settled on (D-350,
 * `research/jegged-encounter-guides-ffx2.md` §3); `cite` names the research section behind each
 * mechanic and is never rendered. The Tail line says max HP is the sure defence and stops short of
 * claiming that no buff helps, which the research does not settle (J-1). The `hints` below are the
 * move advisor's borrowed sentences for the chapter tactic's pick: the panel does not read them.
 */

import type { ChapterGuide } from './types.ts';
import { FFX2_VEGNAGUN_SHUYIN_LINE } from './lines/ffx2-vegnagun-shuyin.ts';
import { WAIT_SPLIT_HABIT_RULE } from './ffx2-wait-habit.ts';

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
      text: 'Tail: max HP is the sure defence. Tail Beam takes 31.25% of the target\'s max HP and Noli Me Tangere hits everyone for about 1,250, so keep everyone above 1,323 and give the healer room.',
      short: 'Tail: max HP is the sure defence',
      cite: 'ffx2-vegnagun-shuyin §3.1, §7.2',
    },
    {
      text: 'Leg: ignore the Nodes and hit the Leg, which is the only one that matters. Put Protect and Shell on the party, and Dispel the Leg to strip what the green Nodes give it. It is a race between your damage and the damage coming in.',
      short: 'Leg: ignore the Nodes, Dispel what they add',
      cite: 'ffx2-vegnagun-shuyin §3.2, §7.2',
    },
    {
      text: "Body: kill both Bulwarks first and keep them down. Do not buff up front, because the Left Bulwark's Dispel strips it. Charge Core three times and Memento Mori follows, so put Shell up as the third one lands.",
      short: 'Bulwarks first; Shell as Memento Mori comes',
      cite: 'ffx2-vegnagun-shuyin §3.3, §4.1, §7.2',
    },
    {
      text: 'Head: it cannot be hit until both Redoubts have fallen once. Keep a Redoubt down so it spends its turns reviving, heal above about 1,500 before each of its big hits at 80, 60, 40 and 20 percent, and re-buff after Odi Et Amo strips the party. Shuyin is a damage race: keep one healer free for Terror of Zanarkand.',
      short: 'Head: keep a Redoubt down, heal before each Nemo',
      cite: 'ffx2-vegnagun-shuyin §3.4, §4.2, §7.2',
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
      note: 'Max HP is the sure defence: Tail Beam is a percentage of max HP and Noli Me Tangere is a flat hit on everyone. Keep everyone above 1,323 HP and hit it.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      bossId: 'vegnagun-leg',
      label: 'Leg and Nodes',
      note: 'All 18,220 HP of damage goes into the Leg; the Nodes hold 300,000 and are not the fight. Green Nodes heal and buff the Leg, so Dispel it, and note it is immune to Reflect.',
      cite: 'ffx2-vegnagun-shuyin §3.2, §7.2',
    },
    {
      bossId: 'vegnagun-body',
      label: 'Body and Bulwarks',
      note: 'Two Darknesses clear both Bulwarks and chunk the Core. Keep them down, and put Shell up as the third Charge Core lands. A Bulwark mirrors a damage class it has just taken, so do not hit one twice with the same kind.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      bossId: 'vegnagun-head',
      label: 'Head and Redoubts',
      note: 'Right Redoubt dies to magic, Left to physicals, then burn the Head. Odi Et Amo strips every buff; Nemo Ante Mortem Beatus fires at each 20% milestone, so keep everyone above about 1,500.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
    {
      bossId: 'shuyin',
      label: 'Shuyin',
      note: 'A damage race: Protect and Shell on all three, Haste the attackers, and keep one healer free for whoever Terror of Zanarkand picks.',
      cite: 'ffx2-vegnagun-shuyin §7.2',
    },
  ],

  // Decision sheet 2026-09-25 item 3 (C): the Wait split's habit, first, under Wait's split only.
  clockRules: { wait: WAIT_SPLIT_HABIT_RULE },
  line: FFX2_VEGNAGUN_SHUYIN_LINE,
};
