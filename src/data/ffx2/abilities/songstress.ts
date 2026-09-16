/**
 * Songstress — Dance / Sing [ffx2-combat-core §2.9.1, §3.4, verified: 2 sources].
 *
 * No Attack command. Every Dance is `2xRT`, 0 MP, and its effect lasts only
 * **while she keeps dancing** — i.e. for as long as her ATB gauge is
 * refilling after casting it; choosing a new action ends it early. That is
 * not a fixed `StatusApplication.duration`, so each Dance's `extra.sustained`
 * flag tells the engine to clear the status the moment she next acts, rather
 * than reading `duration` as a tick count. Songs are ordinary `CT` buffs.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { CT_MEDIUM, RT_DOUBLE } from './helpers.ts';

function dance(id: string, name: string, statusEffects: AbilityDef['statusEffects']): AbilityDef {
  return {
    id,
    name,
    game: 'ffx2',
    category: 'dressphere',
    mpCost: 0,
    chargeTicks: 0,
    recoveryTicks: RT_DOUBLE,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: statusEffects.some((s) => s.status === 'haste' || s.status === 'shell' || s.status === 'protect' || s.status === 'max-hp-x2' || s.status === 'guaranteed-critical')
      ? 'all-allies'
      : 'all-enemies',
    hits: 1,
    statusEffects,
    removesStatuses: [],
    flags: [],
    messageTemplate: `{user} performs ${name}`,
    extra: { sustainedWhileDancing: true },
  };
}

export const songstressAbilities: AbilityDef[] = [
  dance('x2-songstress-darkness-dance', 'Darkness Dance', [{ status: 'darkness', chance: 254, duration: 0 }]),
  dance('x2-songstress-samba-of-silence', 'Samba of Silence', [{ status: 'silence', chance: 254, duration: 0 }]),
  dance('x2-songstress-sleepy-shuffle', 'Sleepy Shuffle', [{ status: 'sleep', chance: 254, duration: 0 }]),
  dance('x2-songstress-slow-dance', 'Slow Dance', [{ status: 'slow', chance: 254, duration: 0 }]),
  dance('x2-songstress-breakdance', 'Breakdance', [{ status: 'stop', chance: 254, duration: 0 }]),
  dance('x2-songstress-jitterbug', 'Jitterbug', [{ status: 'haste', chance: 254, duration: 0 }]),
  {
    ...dance('x2-songstress-carnival-cancan', 'Carnival Cancan', [{ status: 'max-hp-x2', chance: 254, duration: 0 }]),
    // Also restores 25% of original max HP once on cast, per ffx2-combat-core §3.4.
    extra: { sustainedWhileDancing: true, alsoHealsPercentOfOriginalMaxHp: 25 },
  },
  // Reuses the shared `guaranteed-critical` status id under X-2's own rule (every party physical crits while
  // dancing) rather than FFX's Hero/Miracle Drink semantics — ids are shared across games, rules are not [CONTRACTS.md].
  dance('x2-songstress-dirty-dancing', 'Dirty Dancing', [{ status: 'guaranteed-critical', chance: 254, duration: 0 }]),
  {
    id: 'x2-songstress-battle-cry',
    name: 'Battle Cry',
    game: 'ffx2',
    category: 'dressphere',
    mpCost: 4,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: 70,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'str-up', chance: 254, duration: 255, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} sings Battle Cry',
  },
  {
    id: 'x2-songstress-cantus-firmus',
    name: 'Cantus Firmus',
    game: 'ffx2',
    category: 'dressphere',
    mpCost: 4,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: 70,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'def-up', chance: 254, duration: 255, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} sings Cantus Firmus',
  },
  {
    id: 'x2-songstress-esoteric-melody',
    name: 'Esoteric Melody',
    game: 'ffx2',
    category: 'dressphere',
    mpCost: 4,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: 70,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'mag-up', chance: 254, duration: 255, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} sings Esoteric Melody',
  },
  {
    id: 'x2-songstress-disenchant',
    name: 'Disenchant',
    game: 'ffx2',
    category: 'dressphere',
    mpCost: 4,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: 70,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'mdef-up', chance: 254, duration: 255, stacks: 1 }],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} sings Disenchant',
  },
  {
    id: 'x2-songstress-perfect-pitch',
    name: 'Perfect Pitch',
    game: 'ffx2',
    category: 'dressphere',
    mpCost: 4,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: 70,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    // +10 ACCU levels = +100 flat accuracy points in the §2.6 hit check — a hard guarantee, not a rounding error.
    statusEffects: [{ status: 'accu-up', chance: 254, duration: 255, stacks: 10 }],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} sings Perfect Pitch',
  },
  {
    id: 'x2-songstress-matadors-song',
    name: "Matador's Song",
    game: 'ffx2',
    category: 'dressphere',
    mpCost: 4,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: 70,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-allies',
    hits: 1,
    statusEffects: [{ status: 'eva-up', chance: 254, duration: 255, stacks: 10 }],
    removesStatuses: [],
    flags: [],
    messageTemplate: "{user} sings Matador's Song",
  },
];

export default songstressAbilities;
