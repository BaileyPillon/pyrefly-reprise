/**
 * Chapter 1, Seymour Flux: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Holy Water, Mighty Guard, aeons that Seymour
 * banishes. Follows the FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-a.md`, Chapter 1: cure the Zombie at once, keep Hastega on
 * the party, poison him early, Dispel his Reflect and Protect, answer Total Annihilation with Shell
 * (Kimahri's Mighty Guard does it in one turn) or with an aeon summoned right after his turn, and
 * treat aeons as a last resort otherwise.
 *
 * Where our party differs from that plan the step is simply the one that fits: the early poison is
 * Poison Fang because the caster who would cast Bio is on the bench; Zombie Ward is already on the
 * armour; FFX's command window has no Defend row, so no step says it. Steps marked `support` are
 * not the plan's own: the revive and the heal that any plan assumes. Numbers are the chapter
 * research's (`research/ffx-seymour-flux.md`).
 */

import type { GuideLine } from '../line-types.ts';
import { FFX_HEALS, FFX_PARTY_HEALS, revive, heal, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-a §Chapter 1';
const WARN = ['Auto-Attack Mode', 'Ready To Annihilate'] as const;

export const SEYMOUR_FLUX_LINE: GuideLine = [
  {
    labels: ['Holy Water', 'Remedy'],
    when: { partyHas: 'zombie' },
    aim: { has: 'zombie' },
    why: "{target} is a Zombie: cure it now, because the mount's Full-Life kills a Zombie outright",
    from: `${F}, plan 1`,
  },
  {
    labels: ['Mighty Guard'],
    when: { charging: WARN, partyLacks: 'shell' },
    aim: 'first',
    why: 'Total Annihilation is charging: Mighty Guard puts Shell and Protect on all three in one turn',
    from: `${F}, plan 6`,
  },
  {
    labels: ['Shell', 'Lunar Curtain'],
    when: { charging: WARN, partyLacks: 'shell' },
    aim: { lacks: 'shell' },
    why: 'Total Annihilation is charging: put Shell on {target}, because Shell halves the blast',
    from: `${F}, plan 6`,
  },
  {
    kinds: ['summon'],
    when: { charging: ['Ready To Annihilate'], aeonOut: false },
    why: 'The blast is next: summon an aeon now and it takes Total Annihilation in place of the party',
    from: `${F}, plan 7`,
  },
  {
    labels: ['Dispel'],
    when: { bossHas: 'reflect' },
    aim: 'boss',
    why: 'Seymour has Reflect up: Dispel it, and his next Flare bounces back onto him',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Dispel'],
    when: { bossHas: 'protect' },
    aim: 'boss',
    why: 'Seymour has Protect up: Dispel it so every physical hit lands at full strength',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Hastega'],
    when: { partyLacks: 'haste', partyLacksAtLeast: 2 },
    aim: 'first',
    why: 'Cast Hastega: the extra turns are what the cures, the heals and the swings run on',
    from: `${F}, plan 3`,
  },
  {
    labels: ['Haste'],
    when: { partyLacks: 'haste' },
    aim: { lacks: 'haste', prefer: 'tidus' },
    why: 'Haste {target}: the extra turns are what the cures, the heals and the swings run on',
    from: `${F}, plan 3`,
  },
  {
    labels: ['Poison Fang', 'Bio'],
    when: { bossLacks: 'poison' },
    aim: 'boss',
    why: 'Poison him now: it takes 1,400 a turn off his 70,000 for the rest of the fight',
    from: `${F}, plan 3`,
  },
  {
    kinds: ['summon'],
    when: { downedAtLeast: 2, aeonOut: false },
    why: 'Two of you are down and the party is coming apart: an aeon is the last resort, and it buys the turns to stand everyone back up',
    from: `${F}, plan 2`,
  },
  // ---- support: not the plan's own steps; a fallen member is stood up before the one-off Talk bonuses
  { ...revive(`${F}, fit`), support: true },
  {
    labels: ['Talk'],
    when: { actor: ['kimahri'], bossAboveHp: 0.75 },
    aim: 'first',
    why: 'Talk to Seymour: Kimahri gains +10 Strength for the whole fight',
    from: `${F}, plan 8`,
  },
  {
    labels: ['Talk'],
    when: { actor: ['yuna'], bossAboveHp: 0.75 },
    aim: 'first',
    why: 'Talk to Seymour: Yuna gains +10 Magic Defense for the whole fight',
    from: `${F}, plan 8`,
  },
  { ...heal(`${F}, fit`, 0.7, [...FFX_HEALS, ...FFX_PARTY_HEALS]), support: true },
  swing(`${F}, plan 1`, 'Swing at Seymour himself: the mount only drains HP out of him, and it always comes back'),
];
