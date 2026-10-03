/**
 * Chapter 11, the fallen aeons: Shiva, the Magus Sisters, Anima on the Road to the Farplane: the guide's
 * own line (`../line-types.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the aeons' action counters. Follows the
 * FFX-2 encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx2.md` §5: Darkness from the Dark Knights in all three fights;
 * Shiva uses Diamond Dust more as her HP falls and the only real danger is everyone Stopped at once, so a
 * Remedy for a Stopped girl; Cindy first and never spread the damage evenly (White Highwind needs all
 * three low); Anima's Pain stacks, so a Remedy after it and steady healing.
 *
 * Where the party differs from that plan the step is the one that fits: the preset learns no Fire, so
 * Shiva's weakness is not a step (Darkness is the damage); no Ribbon is modelled, so Remedy answers Stop;
 * no Samurai shortcut or Lady Luck dice are equipped. The research has Anima weak to Holy, but this
 * preset learns none, so no step names it. Darkness hits all three sisters at once, so it comes first (it
 * is the damage the plan calls for in every fight) and the single-target swings at Cindy are the ones the
 * girls without Darkness make (a trial on 2026-10-03 with the swing first won 0 of 60 seeds, with Darkness
 * first 49 of 60). Steps marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX2_HEALS, FFX2_REVIVES, leaveItchy, revive, swing, pray } from './kit.ts';

const F = 'jegged-encounter-guides-ffx2 §5';
const R = 'ffx2-fallen-aeons';

export const FFX2_FALLEN_AEONS_LINE: GuideLine = [
  // Anima's Pain can leave a girl Itchy, and an Itchy girl's menu is only Change.
  ...leaveItchy('ffx2-combat-core §2.8'),
  { ...revive(`${R} §5`, [...FFX2_REVIVES, 'Mega Phoenix']), support: true },
  {
    labels: ['Remedy'],
    when: { partyHas: 'stop' },
    aim: { has: 'stop' },
    why: "Cure {target}'s Stop with a Remedy: a stopped girl loses every turn, and the danger is all three stopped at once",
    from: `${F}, Shiva`,
  },
  {
    labels: ['Remedy'],
    when: { bossId: 'x2-anima', partyHas: 'silence' },
    aim: { has: 'silence' },
    why: "Clear {target}'s Silence with a Remedy: Pain's statuses stack on her, and a Remedy takes them off",
    from: `${F}, Anima`,
  },
  {
    labels: ['Remedy'],
    when: { bossId: 'x2-anima', partyHas: 'darkness' },
    aim: { has: 'darkness' },
    why: "Clear {target}'s Darkness with a Remedy: Pain's statuses stack on her, and a Remedy takes them off",
    from: `${F}, Anima`,
  },
  {
    labels: ['Megalixir', 'Mega-Potion', 'Curaga', 'X-Potion', ...FFX2_HEALS],
    when: { anyBelowHp: 0.5 },
    aim: 'weakest',
    why: 'Heal {target}: Diamond Dust, Delta Attack and Oblivion all land on the whole party',
    from: `${F}, plan`,
  },
  {
    labels: ['Darkness'],
    aim: 'first',
    why: 'Darkness: it ignores evasion and Defense, so it lands on the sisters who dodge physical hits',
    from: `${F}, plan`,
  },
  {
    kinds: ['attack'],
    when: { bossId: 'cindy' },
    aim: { foes: ['cindy'] },
    why: 'Take Cindy first: her heals, her guard and Delta Attack are the worst of the three, and never spread the damage evenly',
    from: `${F}, Magus Sisters`,
  },
  {
    labels: ['Dispel'],
    when: { bossId: 'cindy' },
    aim: { foeHas: 'protect' },
    why: 'Strip the guard Cindy put on her sisters: Protect, Shell and Regen go in one cast',
    from: `${R} §4.2`,
    support: true,
  },
  {
    labels: ['Shell'],
    when: { partyLacks: 'shell' },
    aim: { lacks: 'shell' },
    why: 'Put Shell on {target} early, before the spells land',
    from: `${R} §5`,
    support: true,
  },
  pray(`${R} §5`),
  swing(`${F}, plan`, 'Swing at {target}'),
];
