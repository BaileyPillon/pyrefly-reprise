/**
 * Chapter 14, Isaaru's contest of aeons in the Via Purifico: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Yuna's aeons, Grand Summon, Shield. Follows the
 * FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-b.md` §5: against Grothia, Grand Summon Bahamut and fire Mega
 * Flare; against Pterya, Bahamut again if his Overdrive is still there, otherwise Ixion; against Spathi,
 * Bahamut cannot come, so Shiva, with a Shield cast right before Mega Flare.
 *
 * Where the party differs from that plan the step is the one that fits: the aeons here do not know
 * Blizzara or Thundara, so no step heals one with them; the count Spathi runs is five
 * (`research/ffx-isaaru-bevelle.md` §4.3), read from the encounter's own flag (`isaaru.count`). Steps
 * marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';

const F = 'jegged-encounter-guides-ffx-b §5';
const R = 'ffx-isaaru-bevelle';

export const ISAARU_LINE: GuideLine = [
  // ---- Yuna, on the field alone: which aeon goes in
  {
    labels: ['Grand Summon'],
    grandSummon: 'bahamut',
    when: { bossId: 'grothia', aeonOut: false },
    aim: 'first',
    why: 'Grand Summon Bahamut: he arrives with his gauge full, so his Mega Flare comes before anything of Grothia can answer it',
    from: `${F}, plan 1`,
  },
  {
    labels: ['Bahamut'],
    when: { bossId: 'grothia', aeonOut: false },
    why: 'Summon Bahamut against Grothia: his Mega Flare is the strongest hit you have',
    from: `${F}, plan 1`,
  },
  {
    labels: ['Grand Summon'],
    grandSummon: 'bahamut',
    when: { bossId: 'pterya', aeonOut: false },
    aim: 'first',
    why: 'Grand Summon Bahamut again: Pterya is the weak one, and his Mega Flare ends her quickly',
    from: `${F}, plan 2`,
  },
  {
    labels: ['Bahamut', 'Ixion'],
    when: { bossId: 'pterya', aeonOut: false },
    why: 'Bring in {target}: Bahamut if he still has an Overdrive, otherwise Ixion',
    from: `${F}, plan 2`,
  },
  {
    labels: ['Shiva'],
    when: { bossId: 'spathi', aeonOut: false },
    why: 'Summon Shiva: Bahamut cannot come against his own copy, and she is fast and the second strongest',
    from: `${F}, plan 3`,
  },
  {
    kinds: ['summon'],
    when: { aeonOut: false },
    why: 'Summon the strongest aeon still standing: only aeons can fight his',
    from: `${R} §1.2`,
    support: true,
  },
  // ---- the aeon's own turns
  {
    labels: ['Shield'],
    when: { aeonOut: true, bossId: 'spathi', flagBelow: { 'isaaru.count': 2 } },
    aim: 'self',
    why: "The count is nearly out: put Shield up now, so Mega Flare lands on a quarter of its strength",
    from: `${F}, plan 3`,
  },
  {
    labels: ['Shield'],
    when: { aeonOut: true, bossId: 'grothia', bossGaugeFrom: 85 },
    aim: 'self',
    why: 'His gauge is nearly full: put Shield up now, so Hellfire lands on a quarter of its strength',
    from: `${R} §5.3`,
    support: true,
  },
  {
    kinds: ['overdrive'],
    when: { aeonOut: true },
    aim: 'boss',
    why: 'Fire the Overdrive: it is worth several turns of attacks against HP this high',
    from: `${F}, plan 1`,
  },
  {
    kinds: ['attack'],
    when: { aeonOut: true },
    aim: 'boss',
    why: 'Plain attacks keep the MP: nothing is about to land, so hit his aeon',
    from: `${F}, plan 3`,
  },
];
