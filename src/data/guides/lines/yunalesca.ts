/**
 * Chapter 2, Lady Yunalesca: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: CTB, Zombie as armour, Holy Water, Reflect. Follows
 * the FFX encounter guide the project settled on (D-350) as read in
 * `research/jegged-encounter-guides-ffx-a.md`, Chapter 2: Form I answers every blow with Blind (a
 * physical hit) or Silence (a spell), so put Reflect on the party, Yuna first, and cure what lands;
 * Forms II and III turn the party into Zombies on purpose, so always keep one, heal a worn Zombie the
 * Holy Water way, and Dispel her Regen off your people.
 *
 * Where the party differs from that plan the step is the one that fits: the preset has no Holy and
 * no Dark or Silence Ward, so no step names them. The aeon step is not the plan's own (`support`):
 * the chapter's research holds every aeon for Form III (`research/ffx-yunalesca.md` §10.6).
 */

import type { GuideLine } from '../line-types.ts';
import { FFX_HEALS, heal, revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx-a §Chapter 2';

export const YUNALESCA_LINE: GuideLine = [
  {
    labels: ['Reflect'],
    when: { formIndex: 0, partyLacks: 'reflect' },
    aim: { lacks: 'reflect', prefer: 'yuna' },
    why: 'Put Reflect on {target}: her Blind, Silence and Sleep counters bounce back at her',
    from: `${F}, phase 1`,
  },
  {
    labels: ['Eye Drops', 'Esuna', 'Remedy'],
    when: { formIndex: 0, partyHas: 'darkness' },
    aim: { has: 'darkness' },
    why: "Clear {target}'s Blind: a blind attacker misses almost every swing",
    from: `${F}, phase 1`,
  },
  {
    labels: ['Echo Screen', 'Esuna', 'Remedy'],
    when: { formIndex: 0, partyHas: 'silence' },
    aim: { has: 'silence' },
    why: "Clear {target}'s Silence so the spells can go out again",
    from: `${F}, phase 1`,
  },
  {
    labels: ['Dispel'],
    when: { formFrom: 1, partyHas: 'regen' },
    aim: { has: 'regen', and: 'zombie' },
    why: "Dispel the Regen off {target}: on a Zombie her Regen is damage, not healing",
    from: `${F}, phase 2`,
  },
  {
    labels: ['Holy Water', 'Remedy'],
    when: { formFrom: 1, partyHas: 'zombie', partyHasAtLeast: 2, zombieBelowHp: 0.5 },
    aim: { has: 'zombie', lowest: true },
    why: "Cure {target}'s Zombie, heal them next turn, and let her Hellbiter zombify them again; another Zombie stays up meanwhile",
    from: `${F}, phase 2`,
  },
  {
    labels: ['Reflect'],
    when: { formFrom: 1, partyLacks: 'reflect', partyLacksAtLeast: 3, actor: ['yuna'] },
    aim: { lacks: 'reflect', prefer: 'yuna' },
    why: 'Put Reflect back on {target}: her Slap stripped it, and it shields the party from her spells',
    from: `${F}, phase 1`,
  },
  {
    labels: ['Hastega'],
    when: { partyLacks: 'haste', partyLacksAtLeast: 2 },
    aim: 'first',
    why: 'Cast Hastega: the cures and the heals need the extra turns',
    from: `${F}, phase 2`,
  },
  // ---- support: not the plan's own steps
  {
    kinds: ['summon'],
    when: { formIndex: 2, aeonOut: false },
    why: 'Form III is where an aeon pays off: send one in and fire its Overdrive on arrival',
    from: `${F}, fit`,
    support: true,
  },
  {
    kinds: ['overdrive'],
    when: { aeonOut: true },
    aim: 'boss',
    why: 'Fire the Overdrive now: her Mind Blast Curses an aeon on its first step, and a Cursed aeon cannot use it',
    from: `${F}, fit`,
    support: true,
  },
  { ...revive(`${F}, fit`), support: true },
  { ...heal(`${F}, fit`, 0.45, FFX_HEALS), support: true },
  swing(`${F}, phase 1`, 'Swing at her: nothing about her defence needs working around'),
];
