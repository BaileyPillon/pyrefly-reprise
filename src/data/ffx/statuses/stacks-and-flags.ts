/**
 * FFX status definitions — the four Nul-elements, Auto-Life, Critical, the two
 * aeon stances, the four Break statuses, the six 0-5 stacking buffs, and the
 * battle-long Mix/tonic enhancement flags.
 *
 * See `core.ts` for the `FFXStatusDef` type and the rationale for defining it
 * locally (no contract change — `types.ts` is untouched).
 */

import type { FFXStatusId } from '../../../battle/common/types.ts';
import type { FFXStatusDef } from './core.ts';

function nul(id: FFXStatusId, name: string, element: string): FFXStatusDef {
  return {
    id,
    name,
    durationModel: 'charges',
    tickEffect: `Nullifies ONE attack of the ${element} element, consuming one charge. Beats Absorb outright — Nul is checked before affinity, so it prevents an Ifrit/Fire-Eater-type absorb too. SOS-versions (from equipment) are permanent while the carrier is in Critical rather than single-charge.`,
    curedBy: ['Dispel', 'Aerospark', 'Purifying Salt'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §3, §4.2 [verified: 2 sources]',
  };
}

function stackBuff(id: FFXStatusId, name: string, offense: string, defense: string): FFXStatusDef {
  return {
    id,
    name,
    durationModel: 'battle-254',
    tickEffect: `+1 stack per cast, capped at 5, no expiry. ${offense}${defense ? ' ' + defense : ''}`,
    curedBy: [],
    notCuredBy: ['Nothing removes a stacking buff early except KO — it is not on Dispel\'s removal list.'],
    clearedByKo: true,
    // The stacking buffs are the ONE documented exception to "Petrify wipes other statuses": they survive Petrification.
    clearedByPetrify: false,
    survivesBattle: false,
    citation: 'ffx-combat-core §2.9 [verified: 2 sources]',
  };
}

function breakStatus(id: FFXStatusId, name: string, effect: string): FFXStatusDef {
  return {
    id,
    name,
    durationModel: 'battle-254',
    defaultTurns: 254,
    tickEffect: `${effect} Permanent for the battle (stack byte 254), removable ONLY by Dispel. There is no armour Ward/Proof against any Break, and Ribbon does NOT block them.`,
    curedBy: ['Dispel'],
    notCuredBy: ['Ribbon does not protect against the four Breaks (only Aeon Ribbon does).'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §2.10 [verified: 2 sources]',
  };
}

function mixFlag(id: FFXStatusId, name: string, effect: string): FFXStatusDef {
  return {
    id,
    name,
    durationModel: 'battle-254',
    tickEffect: effect,
    curedBy: [],
    notCuredBy: ['Not dispellable by Dispel — these are Mix/tonic enhancement flags, a separate family from the standard buff/debuff list.'],
    clearedByKo: true,
    // Explicitly stated: "removed by KO (not by Petrification)".
    clearedByPetrify: false,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  };
}

export const STATUSES_STACKS_AND_FLAGS: Record<string, FFXStatusDef> = {
  nulblaze: nul('nulblaze', 'NulBlaze', 'Fire'),
  nulfrost: nul('nulfrost', 'NulFrost', 'Ice'),
  nulshock: nul('nulshock', 'NulShock', 'Thunder/Lightning'),
  nultide: nul('nultide', 'NulTide', 'Water'),

  'auto-life': {
    id: 'auto-life',
    name: 'Auto-Life',
    durationModel: 'until-consumed',
    tickEffect:
      'On the carrier reaching 0 HP, auto-revives at 25% max HP (a Percentage Total DmgCon 4 effect internally) before Game Over is checked. Scales with the CASTER\'s Magic +% and Magic Booster at the time of casting. Consumed on use. Cannot be cast on an already-KO\'d target. Prevents Game Over unless the wipe was petrification, Eject, or a scripted instant-wipe (Giga-Graviton).',
    curedBy: [],
    notCuredBy: ['Dispel does NOT remove Auto-Life.'],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  critical: {
    id: 'critical',
    name: 'Critical (SOS)',
    durationModel: 'dynamic',
    tickEffect:
      'Automatically active whenever current HP < 50% of max (25% in the original Japanese release). Drives every SOS auto-ability and Daredevil Overdrive-mode charging. Not something anything applies or removes directly — it is a live computed flag.',
    curedBy: [],
    clearedByKo: false,
    clearedByPetrify: false,
    survivesBattle: false,
    citation: 'ffx-combat-core §4.2 [verified: 2 sources]',
  },

  shield: {
    id: 'shield',
    name: 'Shield (aeon stance)',
    durationModel: 'until-next-turn',
    tickEffect:
      'All damage AND healing received are floor-divided by 4 (-75%), applied just before the damage cap so it also reduces percentage/fixed damage. Overdrive gauge gain is negated entirely (not merely reduced) while active.',
    curedBy: [],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §6.2 [verified: 2 sources]',
  },

  boost: {
    id: 'boost',
    name: 'Boost (aeon stance)',
    durationModel: 'until-next-turn',
    tickEffect: 'All damage and healing received are x1.5. The Overdrive gauge also fills x1.5 while active — the accelerated gauge gain is the documented purpose of the stance.',
    curedBy: [],
    clearedByKo: true,
    clearedByPetrify: true,
    survivesBattle: false,
    citation: 'ffx-combat-core §6.2 [verified: 2 sources]',
  },

  'power-break': breakStatus('power-break', 'Power Break', "The carrier's own physical damage dealt is halved (floor-divided by 2)."),
  'magic-break': breakStatus('magic-break', 'Magic Break', "The carrier's own magical damage dealt is halved."),
  'armor-break': breakStatus('armor-break', 'Armor Break', "The carrier's Defense is treated as 0, AND the Armored property's //3 physical reduction is cancelled entirely."),
  'mental-break': breakStatus('mental-break', 'Mental Break', "The carrier's Magic Defense is treated as 0."),

  cheer: stackBuff('cheer', 'Cheer', 'Attacker: +1 Strength per stack (added before cubing).', 'Defender: physical damage received x(15-stacks)/15 — up to -33.3% at 5 stacks.'),
  focus: stackBuff('focus', 'Focus', 'Attacker: +1 Magic per stack.', 'Defender: magical/special-magic damage AND magical healing received both x(15-stacks)/15 — Focus on an ally reduces the healing they receive.'),
  aim: stackBuff('aim', 'Aim', '+10 to the carrier\'s hit chance per stack.', ''),
  reflex: stackBuff('reflex', 'Reflex', '-10 to any attacker\'s hit chance against the carrier per stack (net +10% evade per stack).', ''),
  luck: stackBuff('luck', 'Luck', '+1 hit chance and +10 critical chance per stack.', ''),
  jinx: stackBuff('jinx', 'Jinx', "+1 to attackers' hit chance against the target per stack, and effectively -10 to the target's Luck for crit purposes per stack (so +10% crit chance against them). Cast on the ENEMY side, not the caster's own party.", ''),

  'max-hp-x2': mixFlag('max-hp-x2', 'Max HP x2', 'Doubles the carrier\'s effective max HP. No immediate healing — existing current HP is unchanged, only the ceiling rises.'),
  'max-mp-x2': mixFlag('max-mp-x2', 'Max MP x2', "Doubles the carrier's effective max MP."),
  'mp-cost-zero': mixFlag('mp-cost-zero', 'MP Cost = 0', 'Every MP-costing ability the carrier uses costs 0 MP for the rest of the battle.'),
  'damage-9999': mixFlag('damage-9999', 'Damage 9999 (Trio/Quartet)', 'Clamps any computed damage in [0,9999] up to exactly 9999, and any computed heal in [-9999,-1] down to exactly -9999 — guarantees max-roll outcomes within the normal cap.'),
  'guaranteed-critical': mixFlag('guaranteed-critical', 'Guaranteed Critical (Hero/Miracle Drink)', 'Every crit-eligible action the carrier performs always rolls a critical hit.'),
  'overdrive-x1_5': mixFlag('overdrive-x1_5', 'Overdrive Gauge x1.5 (Hot Spurs)', "Multiplies the carrier's Overdrive gauge gain by 1.5. Stacks multiplicatively with Eccentrick (overdrive-x2)."),
  'overdrive-x2': mixFlag('overdrive-x2', 'Overdrive Gauge x2 (Eccentrick)', 'Multiplies the carrier\'s Overdrive gauge gain by 2. Stacks multiplicatively with Hot Spurs (overdrive-x1_5).'),
};

export default STATUSES_STACKS_AND_FLAGS;
