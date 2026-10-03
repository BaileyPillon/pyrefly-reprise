/**
 * Chapter 10, Seymour Natus on the Highbridge: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Haste, Banish, Mortibody's Desperado. Follows
 * the FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-b.md` §3: Soft a petrified member at once (Mortibody's Claw
 * shatters stone), Dispel his Protect, Haste only two members (a third calls Desperado), Talk for the
 * Strength and Magic Defense bonuses, open the poison early, Reflect on Natus once he is under a third
 * so Mortibody's Cura goes to the party, and an aeon only as a Grand Summon Overdrive (he Banishes one
 * after its first turn).
 *
 * Where the party differs from that plan the step is the one that fits: Yuna cannot cast Reflect or
 * Bio here, so Rikku and Lulu come in from the bench for them (a switch costs no turn). Magic Break
 * is left out on purpose: Natus and Mortibody are immune to it
 * (`research/ffx-seymour-natus-highbridge.md` §6.3). Steps marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX_HEALS, heal, revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-b §3';

export const SEYMOUR_NATUS_LINE: GuideLine = [
  {
    labels: ['Soft', 'Esuna', 'Remedy'],
    when: { partyHas: 'petrify' },
    aim: { has: 'petrify' },
    why: "Soften {target} now: Mortibody's Claw shatters a stone member, and a shattered one is gone for the battle",
    from: `${F}, plan 3`,
  },
  {
    labels: ['Dispel'],
    when: { bossHas: 'protect' },
    aim: 'boss',
    why: 'Natus has Protect up: Dispel it so every swing lands at full strength',
    from: `${F}, plan 3`,
  },
  {
    kinds: ['switch'],
    switchIn: 'rikku',
    when: { bossBelowHp: 1 / 3, bossLacks: 'reflect' },
    why: "Swap Rikku in for the last stretch: her Reflect on Natus sends Mortibody's Cura to your party instead",
    from: `${F}, plan 4`,
  },
  {
    labels: ['Reflect'],
    when: { bossBelowHp: 1 / 3, bossLacks: 'reflect' },
    aim: 'boss',
    why: "Reflect Natus: Mortibody's Cura bounces onto your party instead of healing him",
    from: `${F}, plan 4`,
  },
  {
    labels: ['Talk'],
    when: { actor: ['tidus', 'yuna', 'auron'] },
    aim: 'first',
    why: 'Talk to him: it is free power, +10 Strength for Tidus and Auron and +10 Magic Defense for Yuna',
    from: `${F}, plan 5`,
  },
  {
    labels: ['Haste'],
    when: { partyLacks: 'haste', partyLacksAtLeast: 2 },
    aim: { lacks: 'haste', prefer: 'tidus' },
    why: 'Haste {target}, but never a third member: a third Haste calls Desperado from Mortibody',
    from: `${F}, plan 1`,
  },
  {
    kinds: ['switch'],
    switchIn: 'lulu',
    when: { bossLacks: 'poison', turnTo: 6 },
    why: 'Swap Lulu in to open the poison: the fight is long, and Bio ticks the whole way',
    from: `${F}, plan 5`,
  },
  {
    labels: ['Bio'],
    when: { bossLacks: 'poison' },
    aim: 'boss',
    why: 'Bio him: the fight is long, and the poison ticks the whole way',
    from: `${F}, plan 5`,
  },
  {
    labels: ['Grand Summon'],
    grandSummon: 'bahamut',
    when: { aeonOut: false },
    aim: 'first',
    why: 'Grand Summon Bahamut: he Banishes an aeon after its first turn, so let that turn be its Overdrive',
    from: `${F}, plan 5`,
  },
  {
    kinds: ['overdrive'],
    when: { aeonOut: true },
    aim: 'boss',
    why: 'Fire the aeon Overdrive now: this one turn is all he leaves it',
    from: `${F}, plan 5`,
  },
  { ...revive(`${F}, fit`, ['Life', 'Phoenix Down']), support: true },
  { ...heal(`${F}, fit`, 0.45, FFX_HEALS), support: true },
  swing(`${F}, plan 1`, 'Swing at Natus: with no Defense, every point lands'),
];
