/**
 * Chapter 9, Yojimbo in the Cavern of the Stolen Fayth: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, aeons, an enemy Overdrive gauge that Zanmato
 * ends. The FFX encounter guide the project settled on (D-350;
 * `research/jegged-encounter-guides-ffx-b.md` §2) has almost nothing for this fight: it is not
 * hard, bring Yuna's aeons if it goes badly, and a Doom learned from a Ghost in the cavern. So the
 * plan's own step is the aeon fallback; everything else is this chapter's own research
 * (`research/ffx-yojimbo.md` §3.3, §4.1, §5.3): Lulu's spells into Magic Defense 0, a heal that names
 * nobody, a quiet turn for everyone who has nothing better (every action aimed at him fills his
 * gauge), and an aeon in front of Zanmato once the gauge is high.
 *
 * Kimahri arrives without Doom (`CAVERN_DOOM_PREP`, Bailey 2026-09-26), so the Doom step exists
 * only for a build that carries it. FFX's command window has no Defend row, so the quiet turn is a
 * spare item on an ally.
 */

import type { GuideLine, LineStep } from '../line-types.ts';
import { CAVERN_DOOM_PREP } from '../../ffx/builds/yojimbo-cavern.ts';
import { revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-b §2';
const R = 'ffx-yojimbo';

const DOOM: LineStep[] =
  CAVERN_DOOM_PREP === 'not-learned'
    ? []
    : [
        {
          labels: ['Doom'],
          when: { actor: ['kimahri'], bossLacks: 'doom' },
          aim: 'boss',
          why: 'Doom him: it kills him five of his own turns later, whatever his HP',
          from: `${R} §2.1, §5.3 row 1`,
        },
      ];

export const YOJIMBO_CAVERN_LINE: GuideLine = [
  { ...revive(`${R} §4.1`), support: true },
  {
    labels: ['Cura', 'Curaga'],
    when: { actor: ['yuna'], anyBelowHp: 0.45 },
    aim: 'weakest',
    why: 'Heal {target}: a heal names no enemy, so it adds nothing to his gauge',
    from: `${R} §4.1, §5.3 row 2`,
    support: true,
  },
  ...DOOM,
  {
    kinds: ['summon'],
    when: { bossGaugeFrom: 80, aeonOut: false },
    why: 'His gauge is high: put an aeon in front of him, and Zanmato hits the aeon instead of the party',
    from: `${F}, plan; ${R} §3.3, §5.3 row 3`,
  },
  {
    kinds: ['summon'],
    when: { downed: true, aeonOut: false },
    why: "It is going badly: fall back on Yuna's aeons",
    from: `${F}, plan`,
  },
  {
    labels: ['Fira', 'Blizzara', 'Thundara', 'Watera'],
    when: { actor: ['lulu'] },
    aim: 'boss',
    why: 'Cast a -ra spell at {target}: his Magic Defense is 0, so it lands at full strength, and one cast fills the gauge by one targeting only',
    from: `${R} §2.1, §3.3, §4.1`,
    support: true,
  },
  {
    labels: ['Potion', 'Hi-Potion', 'Eye Drops', 'Echo Screen'],
    when: { actor: ['kimahri'] },
    aim: 'first',
    why: 'Nothing to add this turn: every action aimed at him fills his gauge, so a quiet turn keeps Zanmato further off',
    from: `${R} §4.1`,
    support: true,
  },
  swing(`${R} §4.1`, 'Swing at {target}'),
];
