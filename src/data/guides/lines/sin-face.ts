/**
 * Chapter 18, Sin: the Face (Overdrive Sin): the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]: CTB, a turn clock ending in a
 * scripted loss, the airship's pull, Armor Break. Follows the FFX encounter guide the project settled on
 * (D-350) as read in `research/jegged-encounter-guides-ffx-b.md` §7: spend the first turns, while it is
 * out of reach, on Cheer and Hastega with Wakka or Lulu dealing damage at range, then Armor Break the
 * moment it is in reach, and carry cures for the Petrify, Confuse and Zombie it brings.
 *
 * Where the party differs from that plan the step is the one that fits: Rikku (Luck, and the Mix for a
 * Frag Grenade) starts on the bench, so the stacking step is Cheer alone, and no step names the Mix.
 * The clock is not Jegged's sixteen turns: the research holds the 12th or 13th
 * (`research/ffx-sin.md` §5.4, S-1) and the rules say that. The range is the encounter's own flag
 * (`airship.range`). Steps marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-b §7';
const R = 'ffx-sin';

export const SIN_FACE_LINE: GuideLine = [
  {
    labels: ['Soft', 'Remedy'],
    when: { partyHas: 'petrify' },
    aim: { has: 'petrify' },
    why: "Cure {target}'s Petrify now: it shatters on the next hit",
    from: `${F}, plan`,
  },
  {
    labels: ['Remedy'],
    when: { partyHas: 'confuse' },
    aim: { has: 'confuse' },
    why: "Cure {target}'s Confuse: a confused member swings at its own side",
    from: `${F}, plan`,
  },
  {
    labels: ['Holy Water', 'Remedy'],
    when: { partyHas: 'zombie', zombieBelowHp: 0.35 },
    aim: { has: 'zombie', lowest: true },
    why: "Cure {target}'s Zombie: healing would hurt it, and it is low",
    from: `${F}, plan`,
  },
  { ...revive(`${R} §7.3`, ['Phoenix Down', 'Mega Phoenix']), support: true },
  {
    labels: ['X-Potion', 'Hi-Potion'],
    when: { anyBelowHp: 0.35 },
    aim: 'weakest',
    why: 'Heal {target}: nothing else is worth a turn this low',
    from: `${R} §7.3`,
    support: true,
  },
  {
    labels: ['Hastega'],
    when: { partyLacks: 'haste', partyLacksAtLeast: 2 },
    aim: 'first',
    why: 'Cast Hastega first: more party turns inside the same clock, because it counts only Sin\'s turns',
    from: `${F}, plan`,
  },
  {
    labels: ['Haste'],
    when: { partyLacks: 'haste' },
    aim: { lacks: 'haste' },
    why: "Haste {target}: more party turns inside the same clock",
    from: `${F}, plan`,
  },
  {
    labels: ['Armor Break'],
    when: { bossLacks: 'armor-break' },
    aim: 'boss',
    why: 'Armor Break it the moment it is in reach: everything after this lands harder',
    from: `${F}, plan`,
  },
  {
    labels: ['Mental Break'],
    when: { bossLacks: 'mental-break' },
    aim: 'boss',
    why: "Mental Break it too: Lulu's Firaga hits about half again as hard against a Broken target",
    from: `${R} §4.2, §8 row 1`,
    support: true,
  },
  {
    kinds: ['switch'],
    switchIn: 'auron',
    when: { actor: ['tidus', 'yuna'], flagsNot: { 'airship.range': 'far' }, bossLacks: 'armor-break' },
    why: 'Swap Auron in: he carries the Armor Break, and the swap costs no turn',
    from: `${F}, plan`,
  },
  {
    labels: ['Cheer'],
    when: { actorStacksBelow: { status: 'cheer', count: 5 }, flags: { 'airship.range': 'far' } },
    aim: 'self',
    why: 'Cheer up while it is out of reach: each stack is Strength for the burst to come',
    from: `${F}, plan`,
  },
  {
    labels: ['Firaga', 'Fira'],
    when: { actor: ['lulu'] },
    aim: 'boss',
    why: 'Cast Firaga at {target}: magic reaches from out here',
    from: `${F}, plan`,
  },
  {
    kinds: ['switch'],
    switchIn: 'wakka',
    when: { actor: ['yuna', 'auron'], flags: { 'airship.range': 'far' } },
    why: 'Swap Wakka in: from out here only he and magic reach it, and the swap costs no turn',
    from: `${F}, plan`,
  },
  {
    kinds: ['switch'],
    switchIn: 'lulu',
    when: { actor: ['yuna', 'auron'], flags: { 'airship.range': 'far' } },
    why: 'Swap Lulu in: from out here only magic and Wakka reach it, and the swap costs no turn',
    from: `${F}, plan`,
  },
  {
    kinds: ['overdrive'],
    aim: 'boss',
    why: 'Fire the Overdrive: nothing is worth holding past the clock',
    from: `${R} §8 row 8`,
    support: true,
  },
  swing(`${F}, plan`, 'Swing at {target}: this is a burst against a clock'),
];
