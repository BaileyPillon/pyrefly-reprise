/**
 * One-off scripted rules that live on {@link AbilityDef.extra}.
 *
 * `docs/CONTRACTS.md` reserves `extra` for exactly this: behaviour too bespoke
 * to deserve a schema field and too specific to belong on the closed
 * {@link ActionFlag} set. The recognised keys are documented here and must be
 * mirrored in the data file that sets them.
 *
 * | key | type | meaning |
 * |---|---|---|
 * | `script` | string | named rule, dispatched below |
 * | `overdriveGaugeGain` | number | flat percent added to the **target's** gauge |
 * | `shatterOnKill` | boolean | a target killed by this hit shatters instead of KO-ing |
 * | `minigameParams` | object | merged into the `minigame-request` payload |
 * | `reelStrip` | string[] | symbol strip for a Slots default roll |
 * | `deathChance` | number | raw instant-death chance byte, rolled on the `ko` path |
 * | `ignoresAllResistance` | boolean | that roll ignores the target's resistance byte |
 * | `stealRoll` | string | the ability makes §7.8.1's item-steal roll (`steal.ts`) |
 * | `distinctTargetsPerHit` | boolean | a `random-enemy` hit after the first avoids the previous pick when it can (`targeting.ts#nextHitTargets`; Natus's Multi-ra) |
 *
 * Deliberately **not** here: Mega Death. "Kills everything not Zombie" falls
 * straight out of the generic status model, because a living Zombie's
 * resistance to ordinary Death is 255 [ffx-combat-core §4.2, §7.1]. Writing it
 * as a script would be a second, divergent implementation of the same rule.
 */

import type { AbilityDef, FFXCombatant } from '../common/types.ts';
import { type Ctx, isAlive, tryActor } from './state.ts';
import { dealDamage, ejectActor, koActor } from './hp.ts';
import { addGauge } from './overdrive.ts';
import { banishAeon } from './aeons.ts';
import { rollStatus } from './statuses.ts';
import { resolveSteal, stealsItem } from './steal.ts';

/** Minimum max HP the Mortiorchis floors at [ffx-seymour-flux §2.2]. */
export const MORTIORCHIS_MIN_MAX_HP = 1000;

/** How much max HP the Mortiorchis loses per Mortibsorption cycle. */
export const MORTIORCHIS_DECAY = 1000;

/**
 * Run whatever `extra` rules this action carries, after one hit has resolved.
 *
 * `dealt` is the signed amount the damage chain produced for this hit.
 */
export function runScriptedExtra(
  ctx: Ctx,
  user: FFXCombatant,
  def: AbilityDef,
  target: FFXCombatant,
  dealt: number,
): void {
  const extra = def.extra;
  if (!extra) return;

  const gaugeGain = extra['overdriveGaugeGain'];
  if (typeof gaugeGain === 'number' && gaugeGain > 0) {
    addGauge(ctx, target, gaugeGain, def.id);
  }

  // **Instant death.** Six shipped records — Death, Death Fury, the aeon's
  // Pain, Zanmato, and the two Wisps — carry `extra.deathChance` because Death
  // in this contract is the same `'ko'` outcome a depleted HP bar produces and
  // its chance is a flat byte, not a `StatusApplication`
  // (`data/ffx/abilities/blackmagic-advanced.ts` header says so in as many
  // words: "the engine rolls that on its own Death-specific path"). Nothing
  // rolled it. Death Fury therefore spent a full Overdrive gauge and emitted
  // nothing at all, and **Zanmato killed nobody**.
  //
  // `rollStatus` is the one roll, so a boss's `ko: 255` still refuses it — this
  // strengthens the player's kit, never weakens a boss.
  const deathChance = extra['deathChance'];
  if (typeof deathChance === 'number' && deathChance > 0 && isAlive(target)) {
    const ignoresResistance = extra['ignoresAllResistance'] === true;
    if (ignoresResistance || rollStatus(ctx, target, 'ko', deathChance)) {
      koActor(ctx, target, user.id);
    }
  }

  // **Steal.** §7.8.1's roll, its per-monster counter and its message; see
  // `steal.ts` for why it is keyed off the data's own `extra`.
  if (stealsItem(def)) resolveSteal(ctx, user, target);

  const shatterOnKill = extra['shatterOnKill'] === true;
  const script = typeof extra['script'] === 'string' ? (extra['script'] as string) : undefined;

  // Jecht Beam: Petrify at 100 normally, but a target the beam's own damage
  // kills shatters on the spot [ffx-bfa-yu-yevon §1.6, §7.4].
  if ((shatterOnKill || script === 'jecht-beam') && dealt > 0 && target.hp === 0) {
    ejectActor(ctx, target, 'shatter');
    return;
  }

  // Seymour's Banish bypasses Aeon Ribbon rather than rolling Eject, which is
  // why it removes an aeon that is otherwise Eject-immune, and leaves it KO'd
  // [ffx-combat-core §6.1, ffx-seymour-flux §4.5, §7.7.1].
  if (script === 'banish' && target.side === 'aeon') {
    banishAeon(ctx, target.id);
    return;
  }

  if (script === 'mortibsorption') {
    const hostId = typeof extra['hostId'] === 'string' ? (extra['hostId'] as string) : undefined;
    const host = hostId ? tryActor(ctx, hostId) : undefined;
    if (host) mortibsorption(ctx, user, host);
  }
}

/**
 * The Mortiorchis's death-trigger HP transfer [ffx-seymour-flux §2.2].
 *
 * It deals damage equal to its own current **max** HP to Seymour Flux, heals
 * itself for the same amount, and then its max HP drops by 1 000 for the next
 * cycle — down to a floor of 1 000, which it never goes below. A naive
 * `maxHp -= 1000` produces a dead mount, a 0-damage Mortibsorption and an
 * encounter with no Total Annihilation.
 *
 * This is a **reaction**, not a scheduled turn: it consumes no CTB, does not
 * advance the charge ladder and does not trip the alternation guard. It fires
 * even when the drain is lethal to the host — resolve the drain, then check.
 */
export function mortibsorption(ctx: Ctx, mount: FFXCombatant, host: FFXCombatant): number {
  const transfer = mount.stats.maxHp;
  ctx.emit({ type: 'message', text: `${mount.name} uses Mortibsorption`, kind: 'ability' });
  dealDamage(ctx, host, transfer, {
    sourceId: mount.id,
    element: 'none',
    crit: false,
    hitIndex: 0,
    hitCount: 1,
  });
  mount.stats.maxHp = Math.max(MORTIORCHIS_MIN_MAX_HP, transfer - MORTIORCHIS_DECAY);
  mount.hp = mount.stats.maxHp;
  mount.alive = true;
  mount.removed = false;
  delete mount.statuses['ko'];
  ctx.emit({ type: 'heal', targetId: mount.id, sourceId: mount.id, amount: transfer, cause: 'mortibsorption' });
  return transfer;
}
