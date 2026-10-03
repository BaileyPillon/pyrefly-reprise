/**
 * Chapter 15, the Den of Woe (Baralai, Gippal, Nooj): the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the FFX-2 status set. Follows the FFX-2
 * encounter guide the project settled on (D-350) as read in `research/jegged-encounter-guides-ffx2.md` §7:
 * Dark Knights do the damage and a healer keeps them up (Baralai drains MP all fight, so Darkness, which
 * costs HP, is the right tool); heal after every Bullseye of Gippal's, and before the killing blow; Nooj's
 * Lightfall, 5,000 to everyone once, needs an answer for the girl it would kill.
 *
 * Where the party differs from that plan the step is the one that fits: the preset has no Alchemist, so
 * Invincible comes from a Hero Drink, one girl at a time, instead of a Dark Matter mix (and the guide
 * says that, not the prep); no Salvation Promised grid, so no Auto-Life; Drill Shot is not counted in the
 * guide because the sources split on how many changes it takes (eight is the build's). The steady-HP
 * route against Lightfall is dropped on purpose (Bailey 2026-09-26). Steps marked `support` are not the
 * plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX2_HEALS, FFX2_PARTY_HEALS, FFX2_REVIVES, heal, revive, swing, pray } from './kit.ts';

const F = 'jegged-encounter-guides-ffx2 §7';
const R = 'ffx2-gippal-den-of-woe';
const BARALAI = 'shade-baralai';
const GIPPAL = 'shade-gippal';
const NOOJ = 'shade-nooj';

/** The Den's line: the Hero Drink step exists only while the bag carries any (GP6). */
export function denOfWoeLine(o: { heroDrinks: number }): GuideLine {
  return [
    { ...revive(`${R} §5`, [...FFX2_REVIVES, 'Mega Phoenix']), support: true },
    {
      labels: ['Remedy'],
      when: { bossId: BARALAI, partyHas: 'stop' },
      aim: { has: 'stop' },
      why: "Cure {target}: Looming Glacier's Stop costs her every turn until it wears off",
      from: `${F}, Baralai`,
    },
    {
      labels: ['Remedy'],
      when: { bossId: BARALAI, partyHas: 'silence' },
      aim: { has: 'silence' },
      why: "Cure {target}'s Silence so she can cast again",
      from: `${F}, Baralai`,
    },
    ...(o.heroDrinks > 0
      ? [
          {
            labels: ['Hero Drink'],
            when: { bossId: NOOJ, bossBelowHp: 0.2, anyBelowHpAbs: 5001 },
            aim: 'weakest' as const,
            why: 'Invincible on {target} before Lightfall: 5,000 to everyone is coming, and a Hero Drink is the answer for one girl',
            from: `${F}, Nooj`,
          },
        ]
      : []),
    {
      labels: [...FFX2_PARTY_HEALS, ...FFX2_HEALS],
      when: { bossId: GIPPAL, anyBelowHp: 0.7 },
      aim: 'weakest',
      why: 'Heal {target}: Bullseye takes more than half of everyone and Grinder ignores defence, so heal after every one and before the killing blow',
      from: `${F}, Gippal`,
    },
    heal(`${F}, plan`, 0.5, [...FFX2_PARTY_HEALS, ...FFX2_HEALS], 'Heal {target}: nothing is healed between the three shades'),
    {
      labels: ['Protect', 'Light Curtain'],
      when: { partyLacks: 'protect' },
      aim: { lacks: 'protect' },
      why: 'Put Protect on {target} first: it softens the staff, the Grinder and the Mortar',
      from: `${R} §5`,
      support: true,
    },
    {
      labels: ['Shell', 'Lunar Curtain'],
      when: { bossId: NOOJ, partyLacks: 'shell' },
      aim: { lacks: 'shell' },
      why: 'Put Shell on {target}: it does not blunt Lightfall, but it keeps HP up through the rest of his turns',
      from: `${F}, Nooj`,
    },
    {
      labels: ['Darkness'],
      aim: 'first',
      why: "Darkness: it ignores Defense, even Nooj's 144, and costs HP rather than MP, which Baralai keeps draining",
      from: `${F}, plan`,
    },
    pray(`${R} §5`),
    swing(`${F}, plan`, 'Swing at {target}'),
  ];
}
