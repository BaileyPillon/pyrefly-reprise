/**
 * Summoning, dismissal and Grand Summon [ffx-combat-core §6].
 *
 * An aeon **replaces the whole active party**: the party leaves the field and
 * every party CTB counter and status duration freezes until the aeon goes.
 * That is why `Side` has a third member — while `state.aeonId` is set, the aeon
 * is the only present friendly actor.
 */

import type { CombatantId, FFXCombatant } from '../common/types.ts';
import { type Ctx, friendlies, rtOf, tryActor } from './state.ts';
import { ejectActor } from './hp.ts';
import { setGauge } from './overdrive.ts';
import { normalise } from './turnQueue.ts';
import { baseCtb } from './math.ts';
import { lockedMirrorOf } from './aeon-duel.ts';

/**
 * Battles a KO'd aeon must sit out before it may be summoned again.
 * No source publishes a figure; 3 is the authored value [ffx-combat-core §6.1].
 */
export const AEON_REVIVE_BATTLES = 3;

/**
 * Aeons Yuna may summon right now. An aeon under an aeon duel's **mirror
 * lock** is not one (`./aeon-duel.ts`, Chapter XIV only; research
 * ffx-isaaru-bevelle §1.2 [verified: 2 sources]).
 */
export function availableAeons(ctx: Ctx): FFXCombatant[] {
  const out: FFXCombatant[] = [];
  for (const [key, aeon] of ctx.rt.aeonRoster) {
    if ((aeon.aeon?.reviveCountdown ?? 0) > 0) continue;
    if (aeon.hp <= 0) continue;
    if (lockedMirrorOf(ctx, key) !== undefined) continue;
    out.push(aeon);
  }
  return out;
}

/** Freeze the party's counters so they resume exactly where they left off. */
function freezeParty(ctx: Ctx): void {
  ctx.rt.frozenPartyCtb.clear();
  for (const c of friendlies(ctx)) ctx.rt.frozenPartyCtb.set(c.id, rtOf(ctx, c.id).ctb);
}

/** Restore the frozen counters when the aeon leaves. */
function thawParty(ctx: Ctx): void {
  for (const [id, ctb] of ctx.rt.frozenPartyCtb) rtOf(ctx, id).ctb = ctb;
  ctx.rt.frozenPartyCtb.clear();
}

/**
 * Put an aeon on the field.
 *
 * `grand` fills a **temporary** gauge kept separate from the stored one, so an
 * aeon already at 100 can fire two Overdrives back to back and dismissing
 * before spending it restores the banked value [ffx-combat-core §5.4, §6.5].
 */
export function summonAeon(ctx: Ctx, ownerId: CombatantId, aeonKey: string, grand = false): FFXCombatant | undefined {
  const aeon = ctx.rt.aeonRoster.get(aeonKey);
  if (!aeon) return undefined;
  if ((aeon.aeon?.reviveCountdown ?? 0) > 0) return undefined;

  freezeParty(ctx);

  aeon.removed = false;
  aeon.alive = aeon.hp > 0;
  aeon.slot = 1;
  ctx.state.aeonId = aeon.id;
  if (aeon.aeon) {
    aeon.aeon.ownerId = ownerId;
    aeon.aeon.temporaryOverdrive = grand ? 100 : null;
  }
  // The aeon enters on the summoner's turn, so it acts next.
  rtOf(ctx, aeon.id).ctb = 0;
  normalise(ctx);

  ctx.emit({ type: 'summon', aeonId: aeonKey, combatantId: aeon.id, ownerId });
  if (grand) {
    ctx.emit({ type: 'overdrive-gauge', who: aeon.id, from: aeon.overdrive?.gauge ?? 0, to: 100, cause: 'grand-summon' });
  }
  return aeon;
}

/**
 * Take the aeon off the field and give the party back.
 *
 * A re-summoned aeon in the same battle keeps its HP, MP and statuses; only a
 * KO (Banish included) zeroes the gauge [ffx-combat-core §6.5].
 */
export function dismissAeon(ctx: Ctx, reason: 'command' | 'ko' | 'banished'): void {
  const id = ctx.state.aeonId;
  if (!id) return;
  const aeon = tryActor(ctx, id);
  ctx.state.aeonId = null;
  if (aeon) {
    aeon.removed = true;
    if (aeon.aeon) {
      // A Grand Summon's temporary gauge is discarded, never banked.
      aeon.aeon.temporaryOverdrive = null;
    }
    if (reason !== 'command') {
      setGauge(ctx, aeon, 0, 'aeon-ko');
      if (aeon.aeon) aeon.aeon.reviveCountdown = AEON_REVIVE_BATTLES;
    }
  }
  thawParty(ctx);
  normalise(ctx);
  ctx.emit({ type: 'dismiss', combatantId: id, reason });
}

/**
 * Seymour's Banish [ffx-combat-core §6.1, ffx-seymour-flux §4.5].
 *
 * Aeons are Eject-immune through the hidden Aeon Ribbon auto-ability; Banish
 * is modelled as an effect that **bypasses** that rather than as an ordinary
 * Eject roll. It leaves the aeon KO'd, so its gauge is zeroed and it is
 * unavailable for {@link AEON_REVIVE_BATTLES} afterwards.
 */
export function banishAeon(ctx: Ctx, aeonId: CombatantId): void {
  const aeon = tryActor(ctx, aeonId);
  if (!aeon) return;
  ejectActor(ctx, aeon, 'banish');
  dismissAeon(ctx, 'banished');
}

/** Called when the aeon's HP reaches 0: the summon ends, but it is not a wipe. */
export function onAeonDefeated(ctx: Ctx): void {
  if (!ctx.state.aeonId) return;
  dismissAeon(ctx, 'ko');
}

/** A revived or freshly-summoned aeon re-enters with a rank-3 delay. */
export function aeonEntryDelay(aeon: FFXCombatant): number {
  return baseCtb(aeon.stats.agi) * 3;
}
