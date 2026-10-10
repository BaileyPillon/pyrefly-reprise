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
 * | `stealRoll` | string | the ability makes §7.8.1's item-steal roll (`steal.ts`) |
 * | `scriptAims` | boolean | a `random-enemy` row whose script names who each hit lands on (`targeting.ts#aimedTargetForHit`; the Seymour fights' spells) |
 *
 * Deliberately **not** here: instant death. Death, Death Fury, Pain, Zanmato and the two Wisps are not a script any more: each
 * one's game record carries a Death chance byte, and the status step (`adapt/status.ts`, the game's `pp_BtlInflictStatus`)
 * rolls it with every other status (re-parity W2; the `deathChance` and `ignoresAllResistance` keys of the data are unread).
 * Mega Death's "kills everything not Zombie" is that step's own Zombie rule [ffx-combat-core §4.2, §7.1].
 */

import type { AbilityDef, FFXCombatant } from '../common/types.ts';
import { type Ctx, tryActor } from './state.ts';
import { dealDamage, ejectActor } from './hp.ts';
import { addGauge } from './overdrive.ts';
import { banishAeon } from './aeons.ts';
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
    addGauge(ctx, target, gaugeGain, def.id); // the game's gauge add for a party member or an aeon, a plain sum for an enemy's script gauge
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
 * The mount's Mortibsorption, the reaction it queues when its own `onHit` finds it at 0 HP
 * (`research/re-ffx-ai-seymour.md` section 2.5; formula 0x10: the user's max HP, no variance).
 *
 * **The revive is not here.** The game restores the mount before its death check: the hook
 * (`ai/seymour-flux-hooks.ts#reviveMount`) sets its HP and max HP to the revive value (4,000, then
 * 3,000, 2,000, 1,000 and 1,000 after that) and lowers that value for the next time, so the drain
 * equals the value the mount came back at. This deals that max HP to the host and announces the
 * mount's return: a `heal` with `cause: 'mortibsorption'`, the cue the presenter's `'returns'`
 * departure fades the figure back in on.
 *
 * A **reaction**, not a scheduled turn: it consumes no CTB and does not advance the cycle. It
 * fires even when the drain is lethal to the host: resolve the drain, then check.
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
  ctx.emit({ type: 'heal', targetId: mount.id, sourceId: mount.id, amount: transfer, cause: 'mortibsorption' });
  return transfer;
}
