/**
 * Chapter 7, Seymour and Anima (Macalania Temple): the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Steal, the Nul spells, aeons, Anima's Pain.
 * Follows the FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-a.md`, Chapter 7: Talk first (Tidus, Yuna and Wakka each
 * have a line), Steal from each Guado Guardian and then drop them before Seymour, pre-cast the Nul
 * that matches his next spell (ice, lightning, water, fire, in that order), summon Shiva for Anima
 * and fire her Overdrive on a Boost turn, then Magic Break him in the last act.
 *
 * Where the party differs from that plan the step is the one that fits: the heal that restores
 * Shiva needs a caster who is on the bench, so no step names it; Auron's Threaten is the other way
 * to stun the Guardians, and he is on the bench too, so Steal is the step. The act and the element
 * are read off the encounter's own flags (`macalania.act`, `macalania.elementStep`). Steps marked
 * `support` are not the plan's own.
 */

import type { GuideLine, LineStep } from '../line-types.ts';
import { FFX_HEALS, heal, revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-a §Chapter 7';
const R = 'ffx-seymour-anima-macalania';

/** One Nul per element of his cycle (ice, lightning, water, fire): the step reads where the counter stands. */
const NULS = [
  { at: 0, label: 'NulFrost', status: 'nulfrost', element: 'Ice' },
  { at: 1, label: 'NulShock', status: 'nulshock', element: 'Lightning' },
  { at: 2, label: 'NulTide', status: 'nultide', element: 'Water' },
  { at: 3, label: 'NulBlaze', status: 'nulblaze', element: 'Fire' },
] as const;

const nulSteps: LineStep[] = NULS.map(({ at, label, status, element }) => ({
  labels: [label],
  when: { flagMod: { 'macalania.elementStep': { mod: 4, is: at } } },
  aim: { lacks: status },
  why: `${element} is his next element: put ${label} on {target}, because his spell is already decided`,
  from: `${F}, plan 3`,
}));

export const SEYMOUR_ANIMA_MACALANIA_LINE: GuideLine = [
  // ---- act two: Anima, with an aeon on the field
  {
    labels: ['Shiva'],
    when: { flags: { 'macalania.act': 2 }, aeonOut: false },
    why: 'Summon Shiva: Anima can only hurt an aeon, where it would kill a party member outright',
    from: `${F}, plan 4`,
  },
  {
    kinds: ['summon'],
    when: { flags: { 'macalania.act': 2 }, aeonOut: false },
    why: 'Summon an aeon: Anima can only hurt it, where it would kill a party member outright',
    from: `${F}, plan 4`,
  },
  {
    kinds: ['overdrive'],
    when: { aeonOut: true, bossHas: 'boost' },
    aim: 'boss',
    why: 'Anima is Boosted: fire the Overdrive now, while she takes half again as much',
    from: `${F}, plan 4`,
  },
  {
    labels: ['Shield'],
    when: { aeonOut: true, charging: ['#'], actorLacks: 'shield' },
    aim: 'first',
    why: 'Oblivion is charging: Shield cuts what the aeon takes to a quarter',
    from: `${R} §6.3`,
    support: true,
  },
  {
    kinds: ['attack'],
    when: { aeonOut: true },
    aim: 'boss',
    why: 'Keep the aeon hitting until its Overdrive is ready, and save it for a Boost turn',
    from: `${F}, plan 4`,
  },
  // ---- act one: the Guardians, then the element cycle
  {
    labels: ['Talk'],
    when: { actor: ['tidus', 'yuna', 'wakka'], flags: { 'macalania.act': 1 } },
    aim: 'first',
    why: 'Talk to Seymour: each line gives +10 Strength or +10 Magic Defense for the whole fight',
    from: `${F}, plan 1`,
  },
  {
    labels: ['Steal'],
    when: { flags: { 'macalania.hasPotions.guado-guardian-a': true } },
    aim: { foes: ['guado-guardian-a'] },
    why: 'Steal from the Guardian: it ends the potion it drinks every time it is hit',
    from: `${F}, plan 3`,
  },
  {
    labels: ['Steal'],
    when: { flags: { 'macalania.hasPotions.guado-guardian-b': true } },
    aim: { foes: ['guado-guardian-b'] },
    why: 'Steal from the Guardian: it ends the potion it drinks every time it is hit',
    from: `${F}, plan 3`,
  },
  ...nulSteps,
  {
    kinds: ['switch'],
    switchIn: 'auron',
    when: { bossLacks: 'magic-break', flags: { 'macalania.act': 3 } },
    why: 'Swap Auron in for the last act: his Magic Break halves the double spells, and the swap costs no turn',
    from: `${F}, plan 8`,
  },
  {
    labels: ['Banishing Blade', 'Magic Break'],
    when: { bossLacks: 'magic-break', flags: { 'macalania.act': 3 } },
    aim: 'boss',
    why: "Break Seymour's magic: the finale is two spells a turn, and this halves them",
    from: `${F}, plan 8`,
  },
  // a fallen member and a low one come before the swings at the Guardians, or those would shadow them for the whole act
  { ...revive(`${F}, fit`), support: true },
  { ...heal(`${F}, fit`, 0.5, FFX_HEALS), support: true },
  {
    kinds: ['attack'],
    when: { flags: { 'macalania.act': 1 } },
    aim: { foes: ['guado-guardian-a', 'guado-guardian-b'] },
    why: 'Drop the Guardians before Seymour: they step in front of every physical hit on him',
    from: `${F}, plan 3`,
  },
  swing(`${F}, plan 3`, 'Swing at {target}'),
];
