/**
 * Chapter 8, Evrae on the deck of the Fahrenheit: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Cid's ship orders, Al Bhed Potions. Follows the
 * FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-a.md`, Chapter 8: pull the ship back first and whenever the
 * party needs to recover, Cheer up to five at range, Wakka swings at any distance, Rikku's Al Bhed
 * Potions heal and cure Petrify and Poison, and Slow it before it Hastes itself near a third of its HP.
 *
 * Where the party differs from that plan the step is the one that fits: the kit holds no Mix
 * ingredients for the Mighty G Mixes, so no step names them, and the armour holds one Stone Ward, so
 * nothing tells the player to craft more. The flags are the encounter's own (`airship.range`,
 * `airship.order`, `airship.breathCharged`). Steps marked `support` are not the plan's own: the quiet
 * turn while a breath is charged and the ship is far (`research/ffx-evrae-airship.md` §4.5), Reflect
 * near a third of its HP (§6.5), and the revive.
 */

import type { GuideLine } from '../line-types.ts';
import { revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-a §Chapter 8';
const R = 'ffx-evrae-airship';

export const EVRAE_LINE: GuideLine = [
  { ...revive(`${F}, fit`, ['Phoenix Down', 'Life']), support: true },
  {
    labels: ['Al Bhed Potion'],
    when: { partyHas: 'petrify' },
    aim: 'first',
    why: 'Use an Al Bhed Potion: it stands the whole party up by 1,000 and cures Petrify, Poison and Silence in the same cast',
    from: `${F}, plan 5`,
  },
  {
    labels: ['Al Bhed Potion', 'X-Potion', 'Mega-Potion', 'Hi-Potion', 'Potion'],
    when: { anyBelowHp: 0.55 },
    aim: 'weakest',
    why: 'Heal with an Al Bhed Potion: it is the only heal this party has, and it cures status in the same cast',
    from: `${F}, plan 5`,
  },
  {
    labels: ['Potion', 'Eye Drops', 'Echo Screen'],
    when: { flags: { 'airship.range': 'far', 'airship.breathCharged': true } },
    aim: 'first',
    why: 'Evrae is inhaling and the ship is far: do not name it. Spend the turn on an ally, and the breath finds nobody to swoop at',
    from: `${R} §4.5`,
    support: true,
  },
  {
    labels: ['Pull back', 'Pull Back'],
    when: { flags: { 'airship.range': 'near', 'airship.breathCharged': true }, flagsNot: { 'airship.order': 'far' } },
    why: 'Evrae is inhaling: pull the ship back before the breath lands',
    from: `${F}, plan 3`,
  },
  {
    labels: ['Pull back', 'Pull Back'],
    when: { flags: { 'airship.range': 'near' }, flagsNot: { 'airship.order': 'far' }, bossAboveHp: 0.3334 },
    why: "Pull the ship back: Evrae's melee is weak at range, and Cid fires the missiles from out there",
    from: `${F}, plan 3`,
  },
  {
    labels: ['Cheer'],
    when: { actorStacksBelow: { status: 'cheer', count: 5 }, allStacksBelow: { status: 'cheer', count: 5 } },
    aim: 'self',
    why: 'Cheer up: there is plenty of time at range, and each stack adds Strength and takes a share off the damage you receive',
    from: `${F}, plan 3`,
  },
  {
    labels: ['Slow'],
    when: { bossLacks: 'slow', bossAboveHp: 0.3334 },
    aim: 'boss',
    why: 'Slow it now: near a third of its HP it Hastes itself and undoes this',
    from: `${F}, plan 5`,
  },
  {
    labels: ['Reflect'],
    when: { bossLacks: 'reflect', bossBelowHp: 0.55 },
    aim: 'boss',
    why: 'Reflect it before the Haste: the same cast then lands on your own party as a free Haste',
    from: `${R} §6.5`,
    support: true,
  },
  swing(`${F}, plan 3`, "Keep swinging: Wakka's shots reach at any distance"),
];
