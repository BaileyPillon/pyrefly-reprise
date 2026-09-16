/**
 * Mascot — Kupo! / Wildcat / Cutlery [ffx2-combat-core §2.9.1, §3.14, verified: 2 sources].
 *
 * The endgame dressphere (Episode Complete in all 15 areas of Spira). Neither
 * of this project's two build points realistically has it — Bahamut is
 * Chapter 2 and even the Chapter 5 finale party is unlikely to have 100%'d
 * every region — so it is transcribed in trimmed form: the three shared
 * passives plus each girl's signature high-power move. Full per-girl kits run
 * ~10 entries each; see `ffx2-combat-core.md` §3.14 for the complete tables.
 */

import type { AbilityDef } from '../../../battle/common/types.ts';
import { CT_MEDIUM, RT_NORMAL } from './helpers.ts';

export const mascotAbilities: AbilityDef[] = [
  {
    id: 'x2-mascot-ribbon',
    name: 'Ribbon',
    game: 'ffx2',
    category: 'skill',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} learns Ribbon',
    // Immune to Petrify/Sleep/Silence/Darkness/Poison/Confuse/Berserk/Curse/Pointless/Itchy/Slow/Stop [§2.8].
    extra: {
      passive: 'status-immune-list',
      statuses: [
        'petrify', 'sleep', 'silence', 'darkness', 'poison', 'confuse',
        'berserk', 'curse', 'pointless', 'itchy', 'slow', 'stop',
      ],
    },
  },
  {
    id: 'x2-mascot-auto-shell',
    name: 'Auto-Shell',
    game: 'ffx2',
    category: 'skill',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} learns Auto-Shell',
    extra: { passive: 'auto-status', status: 'shell' },
  },
  {
    id: 'x2-mascot-auto-protect',
    name: 'Auto-Protect',
    game: 'ffx2',
    category: 'skill',
    mpCost: 0,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'self',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} learns Auto-Protect',
    extra: { passive: 'auto-status', status: 'protect' },
  },
  {
    id: 'x2-mascot-moogle-beam',
    name: 'Moogle Beam',
    game: 'ffx2',
    category: 'skill',
    mpCost: 99,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: RT_NORMAL,
    power: 90, // §2.9.1 — strongest single-target `Str` ability of any standard dressphere
    formula: 'piercing-strength',
    damageType: 'magical',
    element: ['none'],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: [],
    ignoresDefense: true,
    messageTemplate: '{user} uses Moogle Beam',
  },
  {
    id: 'x2-mascot-pupu-platter',
    name: 'PuPu Platter',
    game: 'ffx2',
    category: 'skill',
    mpCost: 48,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: RT_NORMAL,
    power: 0,
    formula: 'none',
    damageType: 'other',
    element: ['none'],
    targeting: 'all-enemies',
    hits: 1,
    statusEffects: [{ status: 'eject', chance: 50, duration: 0 }], // Status 2 [§2.6a]
    removesStatuses: [],
    flags: [],
    messageTemplate: '{user} uses PuPu Platter',
  },
  {
    id: 'x2-mascot-cactling-gun',
    name: 'Cactling Gun',
    game: 'ffx2',
    category: 'skill',
    mpCost: 99,
    chargeTicks: CT_MEDIUM,
    recoveryTicks: RT_NORMAL,
    power: 90,
    formula: 'piercing-strength',
    damageType: 'physical',
    element: ['none'],
    targeting: 'single-any',
    hits: 1,
    statusEffects: [],
    removesStatuses: [],
    flags: ['crit-eligible', 'long-range'],
    ignoresDefense: true,
    messageTemplate: '{user} uses Cactling Gun',
  },
];

export default mascotAbilities;
