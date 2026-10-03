/**
 * Chapter 12, Seymour Omnis in the Garden of Pain: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, the Nul spells, Armor Break, the party switch.
 * Follows the FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-b.md` §4: open with Hastega (again after every Dispel), Armor
 * Break and Mental Break, Nul the colour that shows most, turn a disc with Wakka's blow, and heal
 * everyone before the Ultima that follows the glow.
 *
 * Where the party differs from that plan the step is the one that fits: no member carries elemental
 * gear but Yuna's Phantom Ring, so "dress for the element" needs no step; Wakka is the one member
 * who reaches a disc with a blow, so Tidus hands his turn to him (a switch costs no turn). Shell is
 * left out of the Ultima answer on purpose: Ultima is type Other and Shell does nothing against it
 * (`research/ffx-seymour-omnis.md` §5). The discs are the encounter's own flags (`omnis.discs`,
 * `omnis.state`). Steps marked `support` are not the plan's own.
 */

import type { GuideLine, LineStep } from '../line-types.ts';
import { FFX_HEALS, heal, revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-b §4';
const DISCS = ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'] as const;

/** The four colours: the Nul that answers each, and its status. */
const COLOURS = [
  { colour: 'fire', label: 'NulBlaze', status: 'nulblaze', name: 'Fire' },
  { colour: 'ice', label: 'NulFrost', status: 'nulfrost', name: 'Ice' },
  { colour: 'lightning', label: 'NulShock', status: 'nulshock', name: 'Lightning' },
  { colour: 'water', label: 'NulTide', status: 'nultide', name: 'Water' },
] as const;

const nulSteps: LineStep[] = COLOURS.map(({ colour, label, status, name }) => ({
  labels: [label],
  when: { flagListAtLeast: { 'omnis.discs': { value: colour, atLeast: 3 } } },
  aim: { lacks: status },
  why: `${name} shows on three discs or more: ${label} on {target} turns his spells to nothing`,
  from: `${F}, plan 4`,
}));

const wakkaSteps: LineStep[] = COLOURS.map(({ colour, name }) => ({
  kinds: ['attack'],
  when: { actor: ['wakka'], flagListAtLeast: { 'omnis.discs': { value: colour, atLeast: 3 } } },
  aim: { listed: { key: 'omnis.discs', value: colour, ids: DISCS } },
  why: `${name} shows on three discs or more: hit one of them and the colours turn`,
  from: `${F}, plan 2`,
}));

export const SEYMOUR_OMNIS_LINE: GuideLine = [
  { ...revive(`${F}, fit`, ['Life', 'Phoenix Down', 'Mega Phoenix']), support: true },
  {
    labels: [...FFX_HEALS],
    when: { anyBelowHpAbs: 4200, flags: { 'omnis.state': 'red' } },
    aim: 'weakest',
    why: 'He is glowing: heal {target} above 4,000 now, because the Ultima after the Dispel is about 3,600 to each of you',
    from: `${F}, plan 3`,
  },
  {
    labels: [...FFX_HEALS],
    when: { anyBelowHpAbs: 4200, flags: { 'omnis.state': 'dispelled' } },
    aim: 'weakest',
    why: 'He has Dispelled: heal {target} above 4,000 now, because Ultima is next',
    from: `${F}, plan 3`,
  },
  { ...heal(`${F}, fit`, 0.45, FFX_HEALS), support: true },
  {
    labels: ['Hastega'],
    when: { partyLacks: 'haste' },
    aim: 'first',
    why: 'Cast Hastega again: his Dispel strips it from everyone',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Armor Break'],
    when: { bossLacks: 'armor-break' },
    aim: 'boss',
    why: 'Armor Break him first: at full Defense a sword barely scratches him',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Mental Break'],
    when: { bossLacks: 'mental-break' },
    aim: 'boss',
    why: 'Mental Break him: the spells that follow land harder',
    from: `${F}, plan 4`,
  },
  ...nulSteps,
  {
    kinds: ['switch'],
    switchIn: 'wakka',
    when: { actor: ['tidus'] },
    why: 'Swap Wakka in: he is the one member whose blow turns a disc, and the swap costs no turn',
    from: `${F}, plan 2`,
  },
  ...wakkaSteps,
  {
    labels: ['Potion', 'Hi-Potion', 'Eye Drops', 'Echo Screen'],
    when: { actor: ['yuna'] },
    aim: 'first',
    why: 'Nothing to cast: spend the turn on an item, because a swing from her only brings his glow and the Ultima sooner',
    from: `${F}, fit`,
    support: true,
  },
  swing(`${F}, plan 3`, 'Swing at Omnis: six attacks make him glow, and the Ultima that follows is the next thing to prepare for'),
];
