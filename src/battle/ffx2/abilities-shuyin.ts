/**
 * Fallback ability table, part 3: Vegnagun's Head, its Redoubts, and Shuyin.
 *
 * Research-cited scaffolding like the other two parts; the FFX-2 data agent
 * supersedes it. Sources: [ffx2-vegnagun-shuyin §3.4, §3.5, §4.2].
 *
 * Two things here are load-bearing beyond their damage numbers:
 * - **Acta Est Fabula** carries the cannon fail clock in `extra.failTimer`,
 *   because it is the Phase B transition and `docs/CONTRACTS.md` puts genuinely
 *   one-off scripted rules in `AbilityDef.extra` rather than on a new field.
 * - **Terror of Zanarkand** is nine Defense-ignoring hits of constant 10, which
 *   comes out at 190-215 each — enough to KO almost any party member at this
 *   level, which is why the AI telegraphs it.
 */

import type { AbilityDef } from '../common/types.ts';
import { BUFF_WIPE, def } from './abilities-core.ts';
import {
  CHARGE_VALUE_LONG,
  CHARGE_VALUE_MEDIUM,
  CHARGE_VALUE_SHORT,
  ENEMY_ATTACK_CONSTANT,
  HEAD_FIRE_AT_TURN,
  HEAD_LINE_INTERVAL,
} from './constants.ts';

/** The Head, both Redoubts and Shuyin. */
export const SHUYIN_ABILITIES: AbilityDef[] = [
  // --- Vegnagun (Head) [§3.4, §4.2] ---------------------------------------
  def({
    id: 'pallida-mors',
    name: 'Pallida Mors',
    power: 26,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'single-enemy',
    chargeTicks: CHARGE_VALUE_SHORT,
  }),
  def({
    id: 'odi-et-amo',
    name: 'Odi Et Amo',
    power: 6,
    hits: 16,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'random-enemy',
    chargeTicks: CHARGE_VALUE_MEDIUM,
    removesStatuses: [
      ...BUFF_WIPE,
      'str-up',
      'mag-up',
      'def-up',
      'mdef-up',
      'spellspring',
      'max-hp-x2',
      'max-mp-x2',
    ],
    flags: ['removes-statuses'],
  }),
  def({
    id: 'mors-certa',
    name: 'Mors Certa',
    power: 12,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'all-enemies',
    statusEffects: [
      { status: 'silence', chance: 80, duration: 0 },
      { status: 'darkness', chance: 80, duration: 0 },
      { status: 'poison', chance: 80, duration: 0 },
    ],
  }),
  def({
    id: 'nemo-ante-mortem-beatus',
    name: 'Nemo Ante Mortem Beatus',
    power: 30,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'all-enemies',
    chargeTicks: CHARGE_VALUE_LONG,
    flags: ['always-break-damage-limit'],
  }),
  def({
    id: 'acta-est-fabula',
    name: 'Acta Est Fabula',
    power: 16,
    formula: 'percent-total',
    damageType: 'other',
    targeting: 'all-allies',
    flags: ['heals', 'can-target-dead'],
    /**
     * The Phase B transition, and where the cannon fail clock starts.
     * `docs/CONTRACTS.md`: genuinely one-off scripted rules live in `extra`.
     * [ffx2-vegnagun-shuyin §4.2.2] — 240 combined enemy turns, Shuyin's lines
     * 3..6 at every 48th, line 7 ends the run in the bad ending. `[estimate]`
     */
    extra: {
      failTimer: { fireAtTurn: HEAD_FIRE_AT_TURN, lineInterval: HEAD_LINE_INTERVAL },
      startsPhaseB: true,
      // Target "both Redoubts" [§3.4], not the Head: `all-allies` also takes the caster. Read by
      // `resolve.ts` while `constants.ts` NAMED_TARGETS_ONLY is on (2026-09-26, Bailey's call).
      namedTargetsOnly: true,
    },
  }),

  // --- Redoubts [§3.4] -----------------------------------------------------
  def({
    id: 'lacrimosa-r',
    name: 'Lacrimosa',
    power: 16,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'single-enemy',
  }),
  def({
    id: 'lacrimosa-l',
    name: 'Lacrimosa',
    power: 2,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'single-enemy',
    extra: { mpOnly: true },
  }),
  def({
    id: 'blind',
    name: 'Blind',
    power: 0,
    mpCost: 8,
    formula: 'none',
    damageType: 'other',
    targeting: 'single-enemy',
    statusEffects: [{ status: 'darkness', chance: 100, duration: 0 }],
  }),
  def({
    id: 'demi',
    name: 'Demi',
    power: 4,
    mpCost: 10,
    formula: 'percent-current',
    damageType: 'magical',
    element: ['gravity'],
    targeting: 'all-enemies',
    chargeTicks: CHARGE_VALUE_MEDIUM,
  }),

  // --- Shuyin [§3.5] -------------------------------------------------------
  def({
    id: 'shuyin-attack',
    name: 'Attack',
    power: ENEMY_ATTACK_CONSTANT,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'single-enemy',
    flags: ['crit-eligible'],
  }),
  def({
    id: 'spin-cut',
    name: 'Spin Cut',
    power: 24,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'single-enemy',
    chargeTicks: CHARGE_VALUE_SHORT,
  }),
  def({
    id: 'run-and-slash',
    name: 'Run & Slash',
    power: 8,
    hits: 6,
    formula: 'strength',
    damageType: 'physical',
    targeting: 'random-enemy',
    chargeTicks: CHARGE_VALUE_SHORT,
  }),
  def({
    id: 'force-rain',
    name: 'Force Rain',
    power: 20,
    formula: 'magic',
    damageType: 'magical',
    targeting: 'all-enemies',
    chargeTicks: CHARGE_VALUE_MEDIUM,
  }),
  def({
    id: 'terror-of-zanarkand',
    name: 'Terror of Zanarkand',
    // 9 hits of constant 10 that ignore Defense. 1,710-1,935 total: it will KO
    // almost any Lv 45-50 party member outright. Telegraphed as a countdown.
    power: 10,
    hits: 9,
    formula: 'piercing-strength',
    damageType: 'physical',
    targeting: 'single-enemy',
    chargeTicks: CHARGE_VALUE_LONG,
    flags: ['piercing'],
  }),
];
