/**
 * Fallback ability table, part 2: the Vegnagun chain and Shuyin.
 *
 * Same standing as `abilities-core.ts` — research-cited scaffolding the FFX-2
 * data agent supersedes. Sources: [ffx2-vegnagun-shuyin §3.1-3.5, §4.1-4.2].
 *
 * The stat blocks these constants are tuned against are **SinirothX's and are
 * correct as written**; the Final Fantasy Wiki transposes Mag/Def on the Leg,
 * Body/Core, Bulwarks and Head. Do not "fix" them against the wiki. The
 * regression to protect is Memento Mori at ~1,000-1,130 party-wide.
 */

import type { AbilityDef, AbilityId } from '../common/types.ts';
import { BUFF_WIPE, def } from './abilities-core.ts';
import { CHARGE_VALUE_LONG, CHARGE_VALUE_MEDIUM } from './constants.ts';

/** The four-part Vegnagun chain, its parts, and Shuyin. */
export const VEGNAGUN_ABILITIES: AbilityDef[] = [
  // --- Vegnagun (Tail) [§3.1] ---------------------------------------------
  def({
    id: 'tail-beam',
    name: 'Tail Beam',
    // 5/16 of MAX HP, ignoring Def and MDef entirely — hence `other`.
    power: 5,
    formula: 'percent-total',
    damageType: 'other',
    targeting: 'single-enemy',
    flags: ['always-break-damage-limit'],
  }),
  def({
    id: 'noli-me-tangere',
    name: 'Noli Me Tangere',
    // Constant 1250 => power 25 under `fixed`'s x50; step 7 gives 1,171-1,323.
    power: 25,
    formula: 'fixed',
    damageType: 'physical',
    targeting: 'all-enemies',
    flags: ['always-break-damage-limit'],
  }),

  // --- Vegnagun (Leg) [§3.2] ----------------------------------------------
  def({
    id: 'vita-brevis',
    name: 'Vita Brevis',
    power: 40,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'all-enemies',
    chargeTicks: CHARGE_VALUE_MEDIUM,
    flags: ['always-break-damage-limit', 'strong-delay'],
  }),
  def({
    id: 'leg-absorb',
    name: 'Absorb',
    power: 3,
    formula: 'percent-current',
    damageType: 'other',
    targeting: 'single-enemy',
    flags: ['drains', 'drains-mp'],
  }),
  def({
    id: 'leg-slow',
    name: 'Slow',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-enemy',
    statusEffects: [{ status: 'slow', chance: 130, duration: 100 }],
  }),
  def({
    id: 'leg-berserk',
    name: 'Berserk',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-enemy',
    statusEffects: [{ status: 'berserk', chance: 75, duration: 133 }],
  }),
  def({
    id: 'leg-break',
    name: 'Break',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-enemy',
    statusEffects: [{ status: 'petrify', chance: 80, duration: 0 }],
  }),

  // --- Nodes [§3.2] --------------------------------------------------------
  def({
    id: 'missile',
    name: 'Missile',
    power: 9,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'single-enemy',
    hits: 2,
  }),
  def({
    id: 'dies-irae',
    name: 'Dies Irae',
    power: 4,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'random-enemy',
    hits: 9,
  }),
  ...(['fire', 'ice', 'lightning', 'water'] as const).map((element, i) =>
    def({
      id: (['firaga', 'blizzaga', 'thundaga', 'waterga'] as const)[i] as AbilityId,
      name: (['Firaga', 'Blizzaga', 'Thundaga', 'Waterga'] as const)[i] as string,
      power: 19,
      mpCost: 24,
      formula: 'magic',
      damageType: 'magical',
      element: [element],
      targeting: 'all-enemies',
      chargeTicks: CHARGE_VALUE_MEDIUM,
    }),
  ),
  def({
    id: 'flare',
    name: 'Flare',
    power: 30,
    mpCost: 54,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'single-enemy',
    chargeTicks: CHARGE_VALUE_LONG,
  }),
  def({
    id: 'cura',
    name: 'Cura',
    power: 31,
    mpCost: 10,
    formula: 'healing',
    damageType: 'magical',
    targeting: 'single-ally',
    chargeTicks: CHARGE_VALUE_MEDIUM,
    flags: ['heals'],
  }),
  ...(['regen', 'shell', 'protect'] as const).map((status, i) =>
    def({
      id: `node-${status}` as AbilityId,
      name: (['Regen', 'Shell', 'Protect'] as const)[i] as string,
      power: 0,
      mpCost: ([40, 10, 12] as const)[i] as number,
      formula: 'none',
      damageType: 'other',
      targeting: 'single-ally',
      statusEffects: [{ status, chance: 254, duration: status === 'regen' ? 50 : 100 }],
    }),
  ),

  // --- Vegnagun (Body / Core) [§3.3, §4.1] --------------------------------
  def({
    id: 'charge-core',
    name: 'Charge Core',
    power: 0,
    formula: 'none',
    damageType: 'other',
    targeting: 'self',
  }),
  def({
    id: 'memento-mori',
    name: 'Memento Mori',
    // C = 28 with SinirothX's Mag 42. The regression test: ~1,000-1,130
    // party-wide. ~1,440-1,630 means the wiki's transposed Mag 98 is wired in.
    power: 28,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'all-enemies',
    chargeTicks: CHARGE_VALUE_LONG,
    flags: ['always-break-damage-limit'],
  }),
  def({
    id: 'full-life',
    name: 'Full-Life',
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    targeting: 'single-ally',
    flags: ['heals', 'can-target-dead', 'misses-if-target-alive'],
  }),

  // --- Bulwarks [§3.3] -----------------------------------------------------
  def({
    id: 'hostile-activity-detected',
    name: 'Hostile activity detected',
    power: 3,
    formula: 'percent-total',
    damageType: 'other',
    targeting: 'single-enemy',
    removesStatuses: [...BUFF_WIPE],
    flags: ['removes-statuses', 'drains-mp'],
  }),
  def({
    id: 'physical-attack-detected',
    name: 'Physical attack detected',
    power: 5,
    formula: 'percent-total',
    damageType: 'other',
    targeting: 'all-enemies',
    removesStatuses: ['str-up', 'def-up'],
    flags: ['removes-statuses'],
    // §3.3: all characters within 5 m of the Bulwark, falling back to one.
    extra: { radiusMetres: 5, fallbackTargets: 1 },
  }),
  def({
    id: 'magical-attack-detected',
    name: 'Magical attack detected',
    power: 3,
    formula: 'percent-total',
    damageType: 'other',
    targeting: 'all-enemies',
    removesStatuses: ['mag-up', 'mdef-up'],
    flags: ['removes-statuses', 'drains-mp'],
    extra: { radiusMetres: 5, fallbackTargets: 1, mpOnly: true },
  }),
  def({
    id: 'bulwark-bio',
    name: 'Bio',
    power: 0,
    mpCost: 16,
    formula: 'none',
    damageType: 'other',
    targeting: 'all-enemies',
    statusEffects: [{ status: 'poison', chance: 100, duration: 0 }],
  }),
  def({
    id: 'bulwark-doom',
    name: 'Doom',
    power: 0,
    mpCost: 18,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-enemy',
    statusEffects: [{ status: 'doom', chance: 100, duration: 9 }],
  }),
  def({
    id: 'dispel',
    name: 'Dispel',
    power: 0,
    mpCost: 12,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-enemy',
    removesStatuses: ['auto-life', ...BUFF_WIPE, 'spellspring'],
    flags: ['removes-statuses'],
  }),
];
