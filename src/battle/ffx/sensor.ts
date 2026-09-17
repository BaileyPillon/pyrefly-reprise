/**
 * Sensor / Scan — the information action, for FFX.
 *
 * The FFX engine carried both halves of this feature and read neither. The data
 * layer ships a `scan` status (`src/data/ffx/abilities/special-utility.ts`,
 * `statusEffects: [{ status: 'scan', … }]`) and a `sensor` auto-ability
 * (`ffx-combat-core §9`: "Reveals target's current/max HP, elemental
 * affinities and statuses. No combat effect."), and nothing anywhere emitted
 * the `'sensor'` {@link BattleEvent} that the HUD opens its info panel from —
 * exactly the inert defect that `src/battle/ffx2/sensor.ts` was written to fix
 * on the X-2 side. Scan landed a status marker and the panel never opened.
 *
 * What the research says the two are:
 * - **Sensor** is an equipment auto-ability: "Reveals target's current/max HP,
 *   elemental affinities and statuses. **No combat effect.**"
 *   [ffx-combat-core §9]. It is passive, so it reveals the enemies standing in
 *   front of the party — at the start of the battle, and again for whoever is
 *   swapped in mid-battle, since §1.7 lets any reserve member enter at any
 *   point and the wearer may be that member.
 * - **Scan** is a rank-3 action [ffx-combat-core §1.3, §7.4] and, being pure
 *   information, `canMiss: false` in the data. It opens the fuller read-out.
 *
 * Both are modelled the way X-2 models them so the shared event contract has
 * one meaning in both games: `full: true` is the Scan panel, `full: false` the
 * one-line Sensor bar, and the reveal latches {@link Combatant.revealed} so the
 * HUD keeps reading live numbers out of `state()` afterwards.
 *
 * **A reveal consumes no RNG.** It rolls nothing — no accuracy, no crit, no
 * variance — so adding it cannot shift a seeded replay by a single draw. That
 * is load-bearing: this file is imported by `abilities.ts` after the hits have
 * landed, and the chapter benches must come out identical.
 */

import type { AbilityDef, CombatantId, ElementId, FFXCombatant } from '../common/types.ts';
import { ELEMENT_IDS } from '../common/types.ts';
import type { Ctx } from './state.ts';
import { tryActor } from './state.ts';
import { hasAuto } from './equipment.ts';

/** Which panel a reveal opens: the full Scan read-out, or the one-line bar. */
export type SensorKind = 'scan' | 'sensor';

/**
 * Whether `def` is a Scan-type reveal, and which panel it opens.
 *
 * FFX's own marker is the **`scan` status** the ability applies: that is how
 * `special-utility.ts` encodes Scan, and how the Aeon Ribbon's resistance list
 * names it [ffx-combat-core §9]. An explicit `extra.reveals` marker wins over
 * it, so a data file can label a reveal that does not go through the status.
 */
export function sensorKind(def: AbilityDef): SensorKind | null {
  const marked = def.extra?.['reveals'];
  if (marked === 'scan' || marked === 'sensor') return marked;
  if (def.statusEffects.some((s) => s.status === 'scan')) return 'scan';
  return null;
}

/** Elements the target takes extra damage from, in HUD display order. */
export function weaknessesOf(target: FFXCombatant): ElementId[] {
  return ELEMENT_IDS.filter((e) => e !== 'none' && target.affinities[e] === 'weak');
}

/**
 * Whether this reveal is allowed to print numbers.
 *
 * `immune-to-sensor` is the contract's "Sensor returns `- - -`" flag and
 * `flags.hideHpBar` is "parts whose HP is a secret" [`battle/common/types.ts`].
 * Either one keeps the numerals hidden; the reveal still happens, so the panel
 * can show the sensor line.
 */
function numeralsHidden(target: FFXCombatant): boolean {
  return target.immunityFlags.includes('immune-to-sensor') || target.flags.hideHpBar === true;
}

/**
 * Reveal one target: emit the `'sensor'` event and latch
 * {@link Combatant.revealed} for the rest of the battle.
 *
 * `immune-to-scan` ("Scan fails") blocks a `full` reveal outright and reports it
 * as an `'immune'` miss, which is how every other blocked action in this engine
 * reads on the HUD. A one-line Sensor bar is not a Scan and is not blocked by
 * it. Returns true when the target came out revealed.
 */
export function revealTarget(
  ctx: Ctx,
  sourceId: CombatantId,
  target: FFXCombatant,
  kind: SensorKind,
): boolean {
  const full = kind === 'scan';
  if (full && target.immunityFlags.includes('immune-to-scan')) {
    ctx.emit({ type: 'miss', targetId: target.id, sourceId, reason: 'immune' });
    return false;
  }

  const text = full
    ? (target.scanText ?? target.sensorText ?? '')
    : (target.sensorText ?? target.scanText ?? '');

  if (numeralsHidden(target)) {
    ctx.emit({ type: 'sensor', targetId: target.id, full, text });
    return false;
  }

  target.revealed = true;
  ctx.emit({
    type: 'sensor',
    targetId: target.id,
    full,
    text,
    hp: target.hp,
    maxHp: target.stats.maxHp,
    mp: target.mp,
    maxMp: target.stats.maxMp,
    weaknesses: weaknessesOf(target),
  });
  return true;
}

/** True when anyone presently on the field is wearing Sensor. */
export function partyHasSensor(ctx: Ctx): boolean {
  return ctx.state.activeIds.some((id) => {
    const c = tryActor(ctx, id);
    return c !== undefined && hasAuto(c, 'sensor');
  });
}

/**
 * The passive half: Sensor reveals the enemies on the field.
 *
 * Called when the battle opens and again whenever the active three change, so a
 * Sensor-wearing reserve member who is swapped in mid-battle reveals what she
 * can now see [ffx-combat-core §1.7, §9].
 *
 * Idempotent, and the "already done" mark is `rt.sensedIds`, **not**
 * {@link Combatant.revealed}. An `immune-to-sensor` enemy is announced with no
 * numerals and deliberately stays unrevealed — its numbers are still a secret —
 * so latching `revealed` on it would hand the HUD numbers the fight is keeping
 * back. The runtime set records that the bar has been printed for that enemy
 * instead, which keeps the line off every subsequent turn.
 */
export function revealForSensorAuto(ctx: Ctx): void {
  if (!partyHasSensor(ctx)) return;
  for (const id of ctx.state.enemyIds) {
    const target = tryActor(ctx, id);
    if (!target || target.removed || ctx.rt.sensedIds.has(id)) continue;
    if (target.revealed === true || target.flags.hidden === true) continue;
    ctx.rt.sensedIds.add(id);
    revealTarget(ctx, ctx.state.activeIds[0] ?? id, target, 'sensor');
  }
}
