/**
 * Chapter 5, the Vegnagun chain and Shuyin: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, Darkness. Follows the FFX-2
 * encounter guide the project settled on (D-350) as read in `research/jegged-encounter-guides-ffx2.md`
 * §3, link by link: Dark Knights on Darkness throughout; against the Tail, max HP is the defence; against
 * the Leg, Protect and Shell the party, ignore the Nodes and Dispel what the green Nodes put on it;
 * against the Core, no buffs up front (the Left Bulwark's Dispel removes them), Shell as Memento Mori
 * comes, and both Bulwarks down first; against the Head, heal above about 1,500 before each of its big
 * hits; Shuyin is a damage race.
 *
 * Where the party differs from that plan the step is the one that fits: the bag holds no Dispel Tonic,
 * so the White Mage's own Dispel is the step; no girl is a Warrior here, so Armor Break on the Core is
 * left out; Ribbons and the elemental guards are not modelled. The five links share one HP, MP and bag.
 * Steps marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX2_HEALS, FFX2_PARTY_HEALS, FFX2_REVIVES, heal, revive, swing, pray } from './kit.ts';

const F = 'jegged-encounter-guides-ffx2 §3';
const R = 'ffx2-vegnagun-shuyin';

export const FFX2_VEGNAGUN_SHUYIN_LINE: GuideLine = [
  { ...revive(`${R} §2`, FFX2_REVIVES), support: true },
  {
    labels: [...FFX2_PARTY_HEALS, ...FFX2_HEALS],
    when: { bossId: 'vegnagun-head', anyBelowHpAbs: 1500 },
    aim: 'weakest',
    why: 'Heal {target}: keep everyone above about 1,500 before the Head lands its next big hit',
    from: `${F}, Head`,
  },
  {
    labels: [...FFX2_PARTY_HEALS, ...FFX2_HEALS],
    when: { bossId: 'vegnagun-tail', anyBelowHpAbs: 1323 },
    aim: 'weakest',
    why: 'Heal {target}: max HP is the defence against the Tail, so keep everyone high',
    from: `${F}, Tail`,
  },
  {
    labels: ['Protect', 'Light Curtain'],
    when: { bossId: 'vegnagun-leg', partyLacks: 'protect' },
    aim: { lacks: 'protect' },
    why: 'Put Protect on {target}: the Leg fight is whether your damage beats the damage coming in',
    from: `${F}, Leg`,
  },
  {
    labels: ['Shell', 'Lunar Curtain'],
    when: { bossId: 'vegnagun-leg', partyLacks: 'shell' },
    aim: { lacks: 'shell' },
    why: 'Put Shell on {target}: the Leg fight is whether your damage beats the damage coming in',
    from: `${F}, Leg`,
  },
  {
    labels: ['Dispel'],
    when: { bossId: 'vegnagun-leg', bossHas: 'protect' },
    aim: 'boss',
    why: 'Dispel the Leg: it strips what the green Nodes put on it',
    from: `${F}, Leg`,
  },
  {
    labels: ['Dispel'],
    when: { bossId: 'vegnagun-leg', bossHas: 'shell' },
    aim: 'boss',
    why: 'Dispel the Leg: it strips what the green Nodes put on it',
    from: `${F}, Leg`,
  },
  {
    labels: ['Shell', 'Lunar Curtain'],
    when: { bossId: 'vegnagun-body', charging: ['Charge Core', 'Memento Mori'], partyLacks: 'shell' },
    aim: { lacks: 'shell' },
    why: 'Memento Mori is coming: put Shell on {target} now, because the Left Bulwark is down and cannot Dispel it',
    from: `${F}, Core`,
  },
  {
    labels: ['Darkness'],
    aim: 'first',
    why: 'Darkness: it ignores Defense and hits every enemy at once, Bulwarks and Redoubts included',
    from: `${F}, plan`,
  },
  { ...heal(`${F}, fit`, 0.5, [...FFX2_PARTY_HEALS, ...FFX2_HEALS]), support: true },
  pray(`${R} §2`),
  swing(`${F}, Shuyin`, 'Swing at {target}: it is a damage race'),
];
