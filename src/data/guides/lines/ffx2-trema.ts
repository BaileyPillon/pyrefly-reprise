/**
 * Chapter 13, Paragon then Trema on Cloister 100: the guide's own line (`../line-types.ts`).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres, the stash. Follows the FFX-2 encounter
 * guide the project settled on (D-350) as read in `research/jegged-encounter-guides-ffx2.md` §6: use
 * Paragon's quiet opening for a Stamina Tonic and buffs, because nothing is healed between Paragon and
 * Trema; hit Paragon with plain attacks only; against Trema one girl heals constantly, Protect and Shell
 * stay up, and the fight is endurance.
 *
 * Where the party differs from that plan the step is the one that fits: the Higher Power grid is not in
 * the engine (The End on Paine stands in for its Break Damage Limit), and the kit holds the curtains and
 * the Tonic rather than the best accessories. Like the guide it belongs to, the line follows the chapter's
 * shape (`../../trema-shape.ts`): only a shape with a Paragon link has Paragon steps, so a Trema-alone
 * chapter never names him. Steps marked `support` are not the plan's own.
 */

import type { GuideLine, LineStep } from '../line-types.ts';
import type { TremaShape } from '../../trema-shape.ts';
import { FFX2_HEALS, FFX2_REVIVES, leaveItchy, pray, revive, swing } from './kit.ts';

const F = 'jegged-encounter-guides-ffx2 §6';
const R = 'ffx2-trema';

/** The line for `shape`: the guide builds it with the rest of its content (`tremaGuideFor`). */
export function tremaLine(shape: TremaShape): GuideLine {
  const t = shape.tremaId;
  const steps: LineStep[] = [
    // Paragon's plain attack can leave a girl Itchy, and an Itchy girl's menu is only Change: go
    // back to the knight or the Alchemist when that is offered, else to whatever is.
    ...leaveItchy('ffx2-combat-core §2.8', ['dark-knight', 'alchemist']),
    { ...revive(`${R} §5`, FFX2_REVIVES), support: true },
    {
      labels: ['Stamina Tonic'],
      when: { partyLacks: 'max-hp-x2' },
      aim: 'first',
      why: "Use the Stamina Tonic: it doubles everyone's max HP for the battle, and a Megalixir then fills it",
      from: `${F}, plan`,
    },
    {
      labels: ['Three Stars'],
      when: { bossId: t, partyLacks: 'spellspring' },
      aim: 'first',
      why: "Use Three Stars: every MP cost is 0 for the battle, Darkness's HP cost too",
      from: `${R} §5`,
      support: true,
    },
    {
      labels: ['Lunar Curtain'],
      when: { partyLacks: 'shell' },
      aim: { lacks: 'shell' },
      why: 'Put Shell on {target}: the quiet turns are the time to get it up',
      from: `${F}, plan`,
    },
    {
      labels: ['Light Curtain'],
      when: { partyLacks: 'protect' },
      aim: { lacks: 'protect' },
      why: 'Put Protect on {target}: it softens his three-turn physical chain',
      from: `${F}, plan`,
    },
    {
      labels: ['Megalixir', 'Mega-Potion', 'Elixir', 'X-Potion', ...FFX2_HEALS],
      when: { bossId: t, bossBelowHp: 0.55, anyBelowHp: 0.9 },
      aim: 'weakest',
      why: 'Heal {target} before his HP crosses the next line: Meteor comes down at a half and a quarter',
      from: `${F}, plan; ${R} §4.2`,
    },
    {
      labels: ['Megalixir', 'Mega-Potion', 'Elixir', 'X-Potion', ...FFX2_HEALS],
      when: { anyBelowHp: 0.5 },
      aim: 'weakest',
      why: 'Heal {target}: one girl heals constantly, and this is a fight of endurance',
      from: `${F}, plan`,
    },
    {
      labels: ['Remedy'],
      aim: { has: 'stop' },
      why: "Cure {target}'s Stop: Beguiling Mire costs her every turn until it wears off",
      from: `${F}, plan`,
      support: true,
    },
    {
      labels: ['Target MP', 'Soul Spring'],
      when: { bossId: t, bossMpFrom: 10 },
      aim: 'boss',
      why: 'Drain his MP first: without it he may not be able to pay for Demi, Flare or Ultima',
      from: `${R} §5`,
      support: true,
    },
  ];
  if (shape.paragonLink && shape.paragonId) {
    steps.push({
      kinds: ['attack'],
      when: { bossId: shape.paragonId },
      aim: { foes: [shape.paragonId] },
      why: shape.paragonWaitsToBeHit
        ? 'A plain attack: it only answers with its own Attack, which often misses'
        : 'A plain attack: its guard can soften it, so it does not answer with a counter',
      from: `${F}, plan`,
    });
  }
  steps.push(
    {
      labels: ['Darkness'],
      when: { bossId: t },
      aim: 'first',
      why: 'Darkness is the damage line against Trema: it does not care about his Defense',
      from: `${R} §5`,
    },
    pray(`${R} §5`),
    swing(`${F}, plan`, 'Swing at {target}'),
  );
  return steps;
}
