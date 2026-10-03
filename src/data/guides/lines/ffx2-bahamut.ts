/**
 * Chapter 4, Bahamut in the Bevelle Underground: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the Dark Knight's Darkness. Follows
 * the FFX-2 encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx2.md` §2: Bahamut runs a fixed loop (a Curse or a plain hit, two
 * more physical hits, Impulse twice, a Countdown, then Mega Flare); the first Impulse is the warning, so
 * be fully healed before Mega Flare lands; Impulse takes 37.5% of a girl's HP and cannot kill; the Dark
 * Knight is the damage dressphere; otherwise keep the party healed.
 *
 * Where the party differs from that plan the step is the one that fits: the girls all start in their
 * dresspheres (no Thief swap for the Steal), and the bag holds no Mega-Potion. The warning the line
 * reads is the numeric countdown Bahamut publishes (`research/ffx2-bahamut.md` §2.2). Steps marked
 * `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX2_HEALS, FFX2_PARTY_HEALS, FFX2_REVIVES, heal, revive, swing, pray } from './kit.ts';

const F = 'jegged-encounter-guides-ffx2 §2';
const R = 'ffx2-bahamut';

export const FFX2_BAHAMUT_LINE: GuideLine = [
  { ...revive(`${R} §2.4`, FFX2_REVIVES), support: true },
  {
    labels: [...FFX2_PARTY_HEALS, ...FFX2_HEALS],
    when: { charging: ['#'], anyBelowHp: 0.95 },
    aim: 'weakest',
    why: 'Mega Flare is coming and it lands on all three: heal {target} to full now',
    from: `${F}, strategy`,
  },
  {
    labels: ['Shell', 'Lunar Curtain'],
    when: { partyLacks: 'shell' },
    aim: { lacks: 'shell' },
    why: 'Put Shell on {target}: it halves Impulse and Mega Flare, the two magic hits in the loop',
    from: `${R} §2.4, §3.3`,
    support: true,
  },
  {
    labels: ['Darkness'],
    aim: 'first',
    why: 'Darkness: it ignores his Defense, hits everything and costs HP rather than MP',
    from: `${F}, plan`,
  },
  heal(`${F}, strategy`, 0.5, FFX2_HEALS, 'Heal {target}: keep the party healed between the big hits'),
  pray(`${R} §2`),
  swing(`${F}, plan`, 'Swing at {target}'),
];
