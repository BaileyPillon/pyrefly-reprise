/**
 * Summoning, dismissal and Grand Summon [ffx-combat-core §6].
 *
 * An aeon **replaces the whole active party**: the party leaves the field and
 * every party CTB counter and status duration is parked until the aeon goes.
 * That is why `Side` has a third member — while `state.aeonId` is set, the aeon
 * is the only present friendly actor.
 *
 * **The transitions are the game's** (re-parity W5; FFX only): `adapt/aeon-party.ts` runs `kernel/aeon-party.ts` on the field as it
 * stands and this module carries out what it decided. Nobody's counter changes on the way out or back (so the summoner keeps the
 * recovery the Summon cost her; the old thaw gave her counter back as it was before the Summon), whoever a leaver provoked
 * is released and a Threaten pair it was an end of is broken, the aeon acts next, a Grand Summon holds the aeon's gauge full, and a
 * wiped aeon starts the recovery count its `ply_rom` record gives (`aeon-gear.ts`; settled battle by battle at the end of each
 * battle, `adapt/aeon-party.ts#settleAeonRecovery`).
 */

import type { CombatantId, FFXCombatant } from '../common/types.ts';
import { type Ctx, rtOf, statusOf, tryActor } from './state.ts';
import { ejectActor } from './hp.ts';
import { releaseThreatenLink } from './adapt/threaten.ts';
import { aeonSummonable, dismissOutcome, summonOutcome } from './adapt/aeon-party.ts';
import { slotIfAny } from './adapt/od-world.ts';
import { aeonGearOf } from './aeon-gear.ts';
import { removeStatus } from './statuses.ts';
import { setGauge } from './overdrive.ts';
import { duelLost, lockedMirrorOf } from './aeon-duel.ts';

/**
 * Aeons Yuna may summon right now: HP above 0 and no recovery count left (`FUN_0079a080`). An aeon under an aeon duel's **mirror
 * lock** is not one (`./aeon-duel.ts`, Chapter XIV only; research ffx-isaaru-bevelle §1.2 [verified: 2 sources]).
 */
export function availableAeons(ctx: Ctx): FFXCombatant[] {
  const out: FFXCombatant[] = [];
  for (const [key, aeon] of ctx.rt.aeonRoster) {
    if (!aeonSummonable(aeon)) continue;
    if (lockedMirrorOf(ctx, key) !== undefined) continue;
    out.push(aeon);
  }
  return out;
}

/** An aeon duel's sourced loss (`./aeon-duel.ts#duelLost`, B11 = a): no aeon out, none left to summon. */
export function aeonDuelLost(ctx: Ctx): boolean {
  return duelLost(ctx, availableAeons(ctx).length);
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

  // The kernel decides on the field as it stands, the party still in it.
  const owner = tryActor(ctx, ownerId);
  const known = owner !== undefined && slotIfAny(ctx, owner) !== undefined && slotIfAny(ctx, aeon) !== undefined;
  const outcome = known ? summonOutcome(ctx, aeon, owner, grand) : { aeonCtb: 0, held: grand, freed: [], recover: 0 };
  for (const f of outcome.freed) {
    if (f.provoke) removeStatus(ctx, f.c, 'provoke', 'cured');
    if (f.threaten && statusOf(f.c, 'threaten')) removeStatus(ctx, f.c, 'threaten', 'expired');
  }

  aeon.removed = false;
  aeon.alive = aeon.hp > 0;
  aeon.slot = 1;
  ctx.state.aeonId = aeon.id;
  if (aeon.aeon) {
    aeon.aeon.ownerId = ownerId;
    aeon.aeon.temporaryOverdrive = outcome.held ? 100 : null;
  }
  // The aeon enters on the summoner's turn, so it acts next.
  rtOf(ctx, aeon.id).ctb = outcome.aeonCtb;

  ctx.emit({ type: 'summon', aeonId: aeonKey, combatantId: aeon.id, ownerId });
  if (outcome.held) {
    ctx.emit({ type: 'overdrive-gauge', who: aeon.id, from: aeon.overdrive?.gauge ?? 0, to: 100, cause: 'grand-summon' });
  }
  return aeon;
}

/**
 * Take the aeon off the field and give the party back.
 *
 * A re-summoned aeon in the same battle keeps its HP, MP and statuses; only a
 * KO (Banish included) zeroes the gauge [ffx-combat-core §6.5]. The party's counters are exactly as the game leaves them (the
 * aeon's stay never moved one; the summoner is still paying the recovery of the Summon).
 */
export function dismissAeon(ctx: Ctx, reason: 'command' | 'ko' | 'banished'): void {
  const id = ctx.state.aeonId;
  if (!id) return;
  const aeon = tryActor(ctx, id);
  const wiped = reason !== 'command';
  const outcome = aeon && slotIfAny(ctx, aeon) !== undefined ? dismissOutcome(ctx, aeon, wiped) : undefined;
  ctx.state.aeonId = null;
  if (aeon) {
    // The aeon leaves the field: the function that takes a character off it dissolves its Threaten pair (VA 0x0078e410) [re-parity W2].
    releaseThreatenLink(ctx, aeon);
    aeon.removed = true;
    if (aeon.aeon) {
      // A Grand Summon's temporary gauge is discarded, never banked (the held gauge is put back, VA 0x007b06b0).
      aeon.aeon.temporaryOverdrive = null;
    }
    if (wiped) {
      setGauge(ctx, aeon, 0, 'aeon-ko');
      // The wipe starts the recovery count, one more than the record gives: the battle's own save counts it down once.
      if (aeon.aeon) aeon.aeon.reviveCountdown = outcome?.recover ?? aeonGearOf(aeon).recovery + 1;
    }
  }
  ctx.emit({ type: 'dismiss', combatantId: id, reason });
}

/**
 * Seymour's Banish [ffx-combat-core §6.1, ffx-seymour-flux §4.5].
 *
 * Aeons are Eject-immune through the hidden Aeon Ribbon auto-ability; Banish
 * is modelled as an effect that **bypasses** that rather than as an ordinary
 * Eject roll. It leaves the aeon KO'd, so its gauge is zeroed and it is
 * unavailable until its recovery count has run out (`aeon-gear.ts`).
 */
export function banishAeon(ctx: Ctx, aeonId: CombatantId): void {
  const aeon = tryActor(ctx, aeonId);
  if (!aeon) return;
  ejectActor(ctx, aeon, 'banish');
  dismissAeon(ctx, 'banished');
}

/** Called when the aeon's HP reaches 0: the summon ends, but it is not a wipe of the party. */
export function onAeonDefeated(ctx: Ctx): void {
  if (!ctx.state.aeonId) return;
  dismissAeon(ctx, 'ko');
}
