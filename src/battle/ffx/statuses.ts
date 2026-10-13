/**
 * What the FFX engine keeps for statuses once the game's kernels have decided them [ffx-combat-core §4].
 *
 * **Re-parity W2 (FFX only).** The roll, the exclusions, the durations, the cleansing and the stage buffs are the game's own
 * functions now (`kernel/status-inflict.ts`, `status-extra.ts`, `status-pool.ts`, proven against FFX.exe), reached through
 * `./adapt/status.ts` (engine state to the kernels' inputs) and `./adapt/status-apply.ts` (the kernels' answer to the engine's
 * combatants). What is left here is the engine's bookkeeping around them: removing a status with its event, what a KO clears,
 * the Double HP / Double MP maxima, the dynamic Critical status and Reflect's bounce rule.
 */

import type { AbilityDef, FFXCombatant, StatusId, StatusInstance } from '../common/types.ts';
import { applyDoubleHpMp } from './kernel/status-pool.ts';
import { autoWordB } from './adapt/words.ts';
import { type Ctx, has, rtOf, statusOf } from './state.ts';

/**
 * Statuses a KO does **not** clear (re-parity RC5 lane FFX-D; FFX only).
 *
 * The game's KO reset (VA 0x0079a190, `kernel/death-check.ts#koReset`) clears the whole permanent word but Death, every counter, the whole extra
 * word and the stage stacks, so **Zombie and Scan go with everything else** (4,000 emulated vectors). Two markers stay because they are not
 * status words in the game: `ko` (the death check sets the Death bit again after the reset) and `eject` (the engine's marker for the separate
 * "ejected" flag, `Chr+0xdcd`, which the reset does not touch; the Eject extra bit itself is wiped like the rest).
 *
 * Until RC5 this list also kept `zombie` and `scan`, on the strength of `ffx-yunalesca §15.2 #29` ("a KO'd but still zombified member still
 * contributes its full 30" to Hellbiter's weighting). That reading is overturned: the weighting reads the Zombie bit of the three slots with no
 * liveness test, and a KO takes the bit away at the moment of death, so it counts living zombies only (`research/ffx-yunalesca.md`, note of
 * 2026-10-12 under section 15.2). It answers Bailey's open decision PR-0217 / D-214 ("close D-214: a KO clears Zombie and Scan, per the exe",
 * 2026-10-11). `tests/unit/parity-ffx-engine-death.test.ts` pins every status the engine can hold against the kernel.
 */
export const SURVIVES_KO: readonly StatusId[] = ['ko', 'eject'];

/** Wipe a combatant's statuses, keeping the ones in `keep`. */
function wipeStatuses(ctx: Ctx, target: FFXCombatant, keep: readonly StatusId[], reason: 'ko' | 'overwritten'): void {
  const flagsBefore = poolFlagsOf(target);
  for (const key of Object.keys(target.statuses) as StatusId[]) {
    if (keep.includes(key)) continue;
    delete target.statuses[key];
    ctx.emit({ type: 'status-remove', targetId: target.id, status: key, reason });
  }
  // The two pool flags are a stat change while they are on, so dropping one has to put the ceiling back.
  const flagsAfter = poolFlagsOf(target);
  if (flagsAfter !== flagsBefore) applyPoolFlags(ctx, target, flagsBefore, flagsAfter);
}

/** Remove a status if present. */
export function removeStatus(
  ctx: Ctx,
  target: FFXCombatant,
  status: StatusId,
  reason: 'expired' | 'cured' | 'dispelled' | 'consumed' | 'ko' | 'overwritten',
): boolean {
  if (!has(target, status)) return false;
  // Auto-Regen and other stack-255 statuses are not dispellable.
  if (reason === 'dispelled' && (statusOf(target, status)?.permanent ?? false)) return false;
  const flagsBefore = poolFlagsOf(target);
  delete target.statuses[status];
  const flagsAfter = poolFlagsOf(target);
  if (flagsAfter !== flagsBefore) applyPoolFlags(ctx, target, flagsBefore, flagsAfter);
  ctx.emit({ type: 'status-remove', targetId: target.id, status, reason });
  return true;
}

/** Everything a KO clears [ffx-combat-core §4.2]. */
export function clearStatusesOnKo(ctx: Ctx, target: FFXCombatant): void {
  wipeStatuses(ctx, target, SURVIVES_KO, 'ko');
}

// ---------------------------------------------------------------------------
// Double HP and Double MP: the maxima, by the game's own function
// ---------------------------------------------------------------------------

/** The Double HP (1) and Double MP (2) bits of the buff byte `Chr+0x640` a combatant carries. */
export function poolFlagsOf(c: FFXCombatant): number {
  return (has(c, 'max-hp-x2') ? 1 : 0) | (has(c, 'max-mp-x2') ? 2 : 0);
}

/**
 * `pp_BtlApplyDoubleHpMp` (VA 0x0078d270) for a change of the buff byte from `oldFlags` to `newFlags`: the maximum becomes
 * `clamp(2 * base, 0, 9999)` (HP) or `clamp(2 * base, 0, 999)` (MP) while the flag is on and the stored base while it is off,
 * and the current HP or MP is clamped under the new maximum. The base is the maximum the combatant had before the flag first
 * went on, kept in `ActorRuntime.poolBaseHp` / `poolBaseMp` (a runtime a preview rebuilt from the public state does not carry
 * it: then the base of a doubled maximum is taken as half of it, rounded up, which is only ever read to put the maximum back).
 * The caps rise to 99,999 and 9,999 for a wearer of Break HP Limit and Break MP Limit (`adapt/words.ts#autoWordB`).
 */
export function applyPoolFlags(ctx: Ctx, target: FFXCombatant, oldFlags: number, newFlags: number): void {
  const rt = rtOf(ctx, target.id);
  if ((oldFlags & 1) === 0 || rt.poolBaseHp === undefined) rt.poolBaseHp = (oldFlags & 1) === 0 ? target.stats.maxHp : Math.ceil(target.stats.maxHp / 2);
  if ((oldFlags & 2) === 0 || rt.poolBaseMp === undefined) rt.poolBaseMp = (oldFlags & 2) === 0 ? target.stats.maxMp : Math.ceil(target.stats.maxMp / 2);
  const next = applyDoubleHpMp(
    {
      buffFlags: oldFlags,
      baseMaxHp: rt.poolBaseHp,
      baseMaxMp: rt.poolBaseMp,
      maxHp: target.stats.maxHp,
      maxMp: target.stats.maxMp,
      hp: target.hp,
      mp: target.mp,
      autoB: autoWordB(target),
    },
    newFlags,
  );
  target.stats.maxHp = next.maxHp;
  target.stats.maxMp = next.maxMp;
  target.hp = next.hp;
  target.mp = next.mp;
  refreshCriticalStatus(ctx, target);
}

/**
 * Every party-side combatant that arrives with Double HP or Double MP already on (a chain's later links carry the party's statuses,
 * `BattleScreenSetup.ts#carriedFfxState`) gets its maxima rebuilt the way the game's party-stats builder does at battle start:
 * `pp_BtlApplyDoubleHpMp` called with no new byte (VA 0x0078d270 from VA 0x0079c5f0, `research/re-ffx-ctb-status.md` section 7). The
 * combatant's `stats` arrive as the BASE maxima, which become the runtime's stored base, and the status doubles them under the cap
 * (9,999 and 999, or 99,999 and 9,999 with Break HP and MP Limit); the HP and MP it carries are clamped under the new maxima.
 */
export function rebuildCarriedPools(ctx: Ctx): void {
  for (const c of Object.values(ctx.state.combatants)) {
    if (c === undefined || c.side === 'enemy') continue;
    const flags = poolFlagsOf(c as FFXCombatant);
    if (flags === 0) continue;
    const target = c as FFXCombatant;
    const rt = rtOf(ctx, target.id);
    rt.poolBaseHp = target.stats.maxHp;
    rt.poolBaseMp = target.stats.maxMp;
    const next = applyDoubleHpMp(
      {
        buffFlags: flags,
        baseMaxHp: target.stats.maxHp,
        baseMaxMp: target.stats.maxMp,
        maxHp: target.stats.maxHp,
        maxMp: target.stats.maxMp,
        hp: target.hp,
        mp: target.mp,
        autoB: autoWordB(target),
      },
      -1,
    );
    target.stats.maxHp = next.maxHp;
    target.stats.maxMp = next.maxMp;
    target.hp = next.hp;
    target.mp = next.mp;
    refreshCriticalStatus(ctx, target);
  }
}

/**
 * Keep the dynamic `critical` (SOS) status in sync: automatic while HP is below
 * 50% of max [ffx-combat-core §4.2].
 */
export function refreshCriticalStatus(ctx: Ctx, target: FFXCombatant): void {
  const shouldHave = target.alive && target.hp > 0 && target.hp * 2 < target.stats.maxHp;
  const hasIt = has(target, 'critical');
  if (shouldHave && !hasIt) {
    const instance: StatusInstance = {
      id: 'critical',
      turnsRemaining: null,
      ticksRemaining: null,
      charges: null,
      stacks: 0,
      permanent: false,
    };
    target.statuses['critical'] = instance;
    ctx.emit({ type: 'status-add', targetId: target.id, status: 'critical', instance: { ...instance } });
  } else if (!shouldHave && hasIt) {
    removeStatus(ctx, target, 'critical', 'expired');
  }
}

/**
 * Is this command reflectable? **The game's record bit decides** (`Cmd+0x1c` bit 7, `research/re-ffx-targeting.md` section 1), per target, for a
 * single-target and a multi-target command alike: Hastega, Slowga, the four Nul spells and the monster elementals bounce as well, and Dispel, Auto-Life,
 * Demi, Ultima, every Fury, item and Overdrive do not. An ability with no game record keeps its own `reflectable` flag (never an item or an Overdrive).
 */
export function reflectableDef(def: AbilityDef): boolean {
  if (def.record) return (def.record.flagsMisc & 0x80) !== 0;
  return def.flags.includes('reflectable') && def.category !== 'item' && def.category !== 'overdrive';
}

/** Does this action bounce off the target's Reflect? (Where it lands is the target builder's: `target-build.ts`.) */
export function bouncesOffReflect(def: AbilityDef, target: FFXCombatant): boolean {
  return has(target, 'reflect') && reflectableDef(def);
}
