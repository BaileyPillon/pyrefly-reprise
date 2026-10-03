/**
 * Chapter 17, Sin: the Fins and the Core: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14; research/ffx-sin.md §0.3]: CTB, Cid's ship orders, Armor
 * Break, the Fin's Negation. Follows the FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-b.md` §6: the ship starts far, so order it in to Break and then
 * out again, pull it away at once when the core gathers energy, Hastega early with Cheer between, Genais
 * with plain attacks (Slow to limit its cures), and the Core as the same fight with no ship to move.
 *
 * Where the party differs from that plan the step is the one that fits: Rikku (Luck) starts on the
 * bench, so the stacking step is Cheer alone; the Silence Grenade answer to Genais is not in the bag, so
 * no step names it. The ship and the Fin's charge are the encounter's own flags (`airship.range`,
 * `airship.order`, `sin.fin.charged`). Steps marked `support` are not the plan's own.
 */

import type { GuideLine } from '../line-types.ts';
import { FFX_HEALS, revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-b §6';
const R = 'ffx-sin';

export const SIN_FINS_CORE_LINE: GuideLine = [
  { ...revive(`${R} §7.3`), support: true },
  {
    labels: ['Soft', 'Esuna', 'Remedy'],
    when: { partyHas: 'petrify' },
    aim: { has: 'petrify' },
    why: "Cure {target}'s Petrify now: the next hit shatters a petrified member for good",
    from: `${R} §7.3`,
    support: true,
  },
  {
    labels: [...FFX_HEALS, 'Pray'],
    when: { anyBelowHp: 0.4 },
    aim: 'weakest',
    why: 'Heal {target}: Gravija leaves a quarter of everyone, and the next swing finishes the job',
    from: `${R} §3.1`,
    support: true,
  },
  {
    labels: ['Pull back', 'Pull Back'],
    when: { flags: { 'airship.range': 'near', 'sin.fin.charged': true }, flagsNot: { 'airship.order': 'far' } },
    why: 'The core is gathering energy: pull the ship away now, and the Gravija finds nothing close',
    from: `${F}, plan 3`,
  },
  {
    labels: ['Close in', 'Close In'],
    when: {
      flags: { 'airship.range': 'far' },
      flagsNot: { 'airship.order': 'near', 'sin.fin.charged': true },
      bossLacks: 'armor-break',
    },
    why: 'Bring the ship in: nothing but Wakka and magic reaches from out here, and the Armor Break has to be cast up close',
    from: `${F}, plan 1`,
  },
  {
    labels: ['Armor Break'],
    // Genais is immune to every Break, so the step waits until it is gone (the Core's own step is below).
    when: { bossLacks: 'armor-break', foeGone: ['sinspawn-genais'] },
    aim: 'boss',
    why: 'Armor Break it: Sin is heavily armoured, and every swing after this lands harder',
    from: `${F}, plan 2`,
  },
  {
    labels: ['Pull back', 'Pull Back'],
    when: { flags: { 'airship.range': 'near' }, flagsNot: { 'airship.order': 'far' }, bossHas: 'armor-break' },
    why: 'The Break is on: pull the ship back out, because the Fin attacks less often while Cid keeps it away',
    from: `${F}, plan 1`,
  },
  {
    kinds: ['switch'],
    switchIn: 'wakka',
    when: { actor: ['auron', 'yuna'], flags: { 'airship.range': 'far' }, bossHas: 'armor-break' },
    why: 'Swap Wakka in: from out here only he and magic reach the Fin, and the swap costs no turn',
    from: `${F}, plan 1`,
  },
  {
    kinds: ['switch'],
    switchIn: 'lulu',
    when: { actor: ['auron', 'yuna'], flags: { 'airship.range': 'far' }, bossHas: 'armor-break' },
    why: 'Swap Lulu in: from out here only magic and Wakka reach the Fin, and the swap costs no turn',
    from: `${F}, plan 1`,
  },
  {
    labels: ['Hastega'],
    when: { partyLacks: 'haste', partyLacksAtLeast: 2 },
    aim: 'first',
    why: 'Cast Hastega early: the Fin strips good statuses, so cast it again whenever it goes',
    from: `${F}, plan 2`,
  },
  {
    labels: ['Cheer'],
    when: { actorStacksBelow: { status: 'cheer', count: 5 }, allStacksBelow: { status: 'cheer', count: 5 } },
    aim: 'self',
    why: 'Cheer up: the time between the Fin turns is for stacking, up to five',
    from: `${F}, plan 1`,
  },
  // Tidus has stacked what he can: from out here only Wakka and magic reach the Fin, so he steps off too.
  {
    kinds: ['switch'],
    switchIn: 'wakka',
    when: { actor: ['tidus'], flags: { 'airship.range': 'far' }, bossHas: 'armor-break' },
    why: 'Swap Wakka in: Tidus has nothing left to stack, and from out here only Wakka and magic reach the Fin',
    from: `${F}, plan 1`,
    support: true,
  },
  {
    kinds: ['switch'],
    switchIn: 'lulu',
    when: { actor: ['tidus'], flags: { 'airship.range': 'far' }, bossHas: 'armor-break' },
    why: 'Swap Lulu in: Tidus has nothing left to stack, and from out here only magic and Wakka reach the Fin',
    from: `${F}, plan 1`,
    support: true,
  },
  {
    labels: ['Slow'],
    when: { bossId: 'sinspawn-genais', bossLacks: 'slow' },
    aim: 'boss',
    why: 'Slow Genais: it cures itself when it is low, and Slow limits how often',
    from: `${F}, plan 4`,
  },
  {
    kinds: ['attack'],
    when: { bossId: 'sinspawn-genais' },
    aim: { foes: ['sinspawn-genais'] },
    why: 'Plain attacks on Genais: it sits in front of the Core and absorbs magic aimed at Sin',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Armor Break'],
    when: { bossId: 'sin-core', bossLacks: 'armor-break' },
    aim: 'boss',
    why: 'Armor Break the Core: this is the same fight with no ship to move, so Gravija cannot be dodged',
    from: `${F}, plan 5`,
  },
  swing(`${F}, plan 1`, 'Swing at {target}'),
];
