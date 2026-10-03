/**
 * Chapter 16, Ixion at Djose: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, Ixion's Recharge. Follows the FFX-2
 * encounter guide the project settled on (D-350) as read in `research/jegged-encounter-guides-ffx2.md`
 * §8: his loop ends in Recharge and then Thor's Hammer on the whole party, so be healed before the
 * Hammer; he absorbs lightning and is weak to water; Darkness from the Dark Knights does the damage here.
 *
 * Where the party differs from that plan the step is the one that fits: no Warrior is in the chain, so
 * no Break; no Alchemist, so no water gems; no Thief swap for the Steal. The line never says how many
 * Aerospark come in a row, because the research counts two attacks to each (`research/ffx2-ixion-djose.md`
 * §4.2, IX-5). The tell is the log's last action of his: Recharge (`x2-ixion-recharge`), which is the
 * only warning the screen gives. Steps marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX2_HEALS, FFX2_PARTY_HEALS, FFX2_REVIVES, heal, revive, swing, pray } from './kit.ts';

const F = 'jegged-encounter-guides-ffx2 §8';
const R = 'ffx2-ixion-djose';
const RECHARGED = { foe: 'x2-ixion', ability: 'x2-ixion-recharge' } as const;

export const FFX2_IXION_DJOSE_LINE: GuideLine = [
  { ...revive(`${R} §4.5`, FFX2_REVIVES), support: true },
  {
    labels: [...FFX2_PARTY_HEALS, ...FFX2_HEALS],
    when: { foeLastAction: RECHARGED, anyBelowHp: 0.9 },
    aim: 'weakest',
    why: "Recharge: Thor's Hammer is next and it hits all three, so heal {target} up now",
    from: `${F}, plan`,
  },
  {
    labels: ['Shell', 'Lunar Curtain'],
    when: { foeLastAction: RECHARGED, partyLacks: 'shell' },
    aim: { lacks: 'shell' },
    why: "Recharge: put Shell on {target}, because Thor's Hammer is magic",
    from: `${R} §4.5`,
    support: true,
  },
  {
    labels: ['Darkness'],
    aim: 'first',
    why: 'Darkness: it ignores his Defense of 106 and costs HP rather than MP',
    from: `${F}, plan; ${R} §4.5`,
  },
  heal(`${F}, plan`, 0.5, [...FFX2_PARTY_HEALS, ...FFX2_HEALS], 'Heal {target}: Aerospark takes a share of whatever HP is left'),
  {
    labels: ['Shell', 'Lunar Curtain'],
    when: { partyLacks: 'shell' },
    aim: { lacks: 'shell' },
    why: 'Put Shell on {target} early: the Hammer that follows Recharge is magic',
    from: `${R} §4.5`,
    support: true,
  },
  {
    labels: ['Protect'],
    when: { partyLacks: 'protect' },
    aim: { lacks: 'protect' },
    why: 'Put Protect on {target}: it softens his physical attacks',
    from: `${R} §4.5`,
    support: true,
  },
  pray(`${R} §4.5`),
  swing(`${F}, plan`, 'Swing at {target}'),
];
