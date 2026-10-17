/**
 * Action resolution — turning one `Command` into an ordered list of events.
 *
 * Since re-parity W3 (FFX-2 only) the hits, critical hits, damage, elements, chain, all-target halving, statuses,
 * Steal, Pilfer Gil and Bribe all run through the kernels proven against FFX-2.exe, in the game's order and with its
 * draws (`resolve-strike.ts` says how; `docs/handoff/re-parity-w3.md` has the table of every input). This file keeps
 * what is not a hit: the MP and HP costs, the reveals, Charon's cost, a sequence of stages and the counter event.
 */

import type { AbilityDef, CombatantId } from '../common/types.ts';
import type { Ffx2Unit } from './internal.ts';
import { pickVariant, resolveCommand } from './adapt/command.ts';
import { resolveSensor, sensorKind } from './sensor.ts';
import { effectiveMpCost, hpCostFor } from './menu.ts';
import { isTargetable, resolveTargets } from './targeting.ts';
import { NAMED_TARGETS_ONLY } from './constants.ts';

import { applyHpDelta, type ResolveContext } from './resolve-hp.ts';
import { runStrikes } from './resolve-strike.ts';

export { applyHpDelta, heal, revive, type ResolveContext } from './resolve-hp.ts';

/**
 * Resolve one ability from `user` against `requested`, emitting every event it
 * produces. Returns the total HP delta dealt, so an AI script can log it.
 */
export function resolveAbility(
  ctx: ResolveContext,
  user: Ffx2Unit,
  ability: AbilityDef,
  requested: readonly CombatantId[],
  options: { isCounter?: boolean; counterCause?: string; hitsOverride?: number; shots?: number; gilSpent?: number; inSequence?: boolean; exactTargets?: boolean } = {},
): number {
  const all = resolveTargets(ctx.units, user, ability, requested, ctx.rng);
  // `extra.namedTargetsOnly` (`abilities-shuyin.ts`, Acta Est Fabula): an all-target row whose
  // source names its targets hits only the ids its caller named. Switch: `constants.ts`.
  // `exactTargets` (AI-FFX2-b): a scripted command that names its targets hits exactly them, whatever group the row can reach.
  const namedOnly = options.exactTargets === true || (ability.extra?.['namedTargetsOnly'] === true && (ctx.namedTargetsOnly ?? NAMED_TARGETS_ONLY));
  // A Confused girl's pick (RC9 X2-H) is aimed by the game's own target mask, which can be a group the row's own side would not take (a team-split row aimed at the
  // other half), so an exact command hits exactly the units it names that can be hit; for every earlier user (one target, the attacker) that is the same pool.
  const allowDead = ability.flags.includes('can-target-dead');
  const named = options.exactTargets === true ? ctx.units.filter((u) => requested.includes(u.id) && isTargetable(u, allowDead)) : null;
  const pool = named ?? (namedOnly ? all.filter((u) => requested.includes(u.id)) : all);
  if (pool.length === 0) return 0;

  const mpCost = effectiveMpCost(user, ability); // Spellspring, Half MP Cost, One MP Cost and Magic Booster (re-parity RC7 lane X2-B)
  if (mpCost > 0) user.mp = Math.max(0, user.mp - mpCost);

  // The Dark Knight pays in HP. Darkness is **12.5% of the user's own max HP**
  // per cast [ffx2-vegnagun-shuyin §6.4 `[verified: 2 sources]`], and that cost
  // is the ability's entire downside (§7.1). `targeting.ts` greys the row out
  // when she cannot pay, so the subtraction can never KO her — it is a cost,
  // not damage: it is not an attack, so it registers no chain and cannot crit.
  const hpCost = hpCostFor(user, ability);
  if (hpCost > 0) {
    user.hp = Math.max(1, user.hp - hpCost);
    ctx.emit({
      type: 'damage',
      targetId: user.id,
      amount: hpCost,
      element: 'none',
      crit: false,
      hitIndex: 0,
      hitCount: 1,
    });
  }

  // Scan / Libra / Ma'at's Feather leave here: a reveal is pure information,
  // so it never rolls to hit, never registers a chain, and never touches the
  // seeded RNG. See `sensor.ts` for what counts as one. §3.7
  const reveals = sensorKind(ability);
  if (reveals) {
    resolveSensor(ctx.emit, user, pool, reveals);
    for (const t of pool) ctx.onResult?.(t, user, ability); // a Scan or Libra is a result on each target (AI-FFX2-b); it changes no HP, so no SOS check or counter
    return 0;
  }

  // A minigame outcome replaces the ability's own hit count (`docs/CONTRACTS.md`, "Minigame protocol"): Two Dice's dice are the game's hit override,
  // Trigger Happy's presses are its shots (`StrikeOptions`; zero shots play no hit); the game's row says the rest (`adapt/command.ts`).
  const hitsOverride = options.hitsOverride ?? Math.max(0, options.shots ?? 0);
  const variant = pickVariant(ability, ctx.rng); // Russian Roulette: the script's pick of one of its five rows
  const command = resolveCommand(ability, user, hitsOverride, variant);
  let total = runStrikes(ctx, user, ability, command, pool, {
    ...(options.hitsOverride !== undefined && options.hitsOverride > 0 ? { hitsOverride: options.hitsOverride } : {}),
    ...(options.shots !== undefined ? { shots: options.shots } : {}),
    ...(options.gilSpent !== undefined ? { gilSpent: options.gilSpent } : {}),
    ...(options.isCounter ? { system: true } : {}),
  });

  // **`destroys-user`** [ffx2-combat-core §2.3, §3.12 row "Charon"].
  //
  // "Charon (Dark Knight): `user max HP * 2`; **the user is removed from the
  // battle**." The flag had exactly one reader in the project — `abilities.ts`
  // in the *FFX* engine, for Kimahri's Self-Destruct — and none at all under
  // `src/battle/ffx2`, so X-2's only self-sacrifice ability had no cost.
  //
  // What that did to Chapter 4: `x2-dark-knight-charon` is `formula:
  // 'user-max-hp'` and `ignoresDefense`, so it is a free, repeatable,
  // defence-ignoring nuke. Measured, taking it whenever it was offered and
  // otherwise attacking: **15 wins in 15 seeds, 13.2 turns against the intended
  // line's 77**, with Rikku's HP unchanged after every cast
  // (1739 -> 1739 -> 1739) and `alive: true`. A blind sweep of all 28 rows the
  // chapter offers found it the only winner.
  //
  // The user is **KO'd**, not ejected: X-2 has no eject, a KO'd girl is still
  // on the party and still revivable, and that is what "removed from the
  // battle" means here. The removal runs through `applyHpDelta`, so Auto-Life,
  // the chain break and the `ko` event all behave exactly as they do for any
  // other death — the cost is a real death, with the real ways out of it.
  if (ability.flags.includes('destroys-user') && user.alive) {
    const cost = user.hp;
    if (cost > 0) {
      ctx.emit({
        type: 'damage',
        targetId: user.id,
        amount: cost,
        element: 'none',
        crit: false,
        hitIndex: 0,
        hitCount: 1,
      });
      applyHpDelta(ctx, user, cost, user.id);
    }
  }

  // **`extra.sequence`** — one action, several stages, one turn.
  //
  // A documented one-off key (`docs/CONTRACTS.md`): the named abilities resolve in order from the same user,
  // immediately, as part of this action. Its only caller is the Leblanc
  // Syndicate's **No Love Lost**, which §4.5 of
  // `research/ffx2-leblanc-syndicate.md` describes as one loud, timed,
  // three-beat set piece — 8 constant hits, then a party-wide constant, then a
  // fraction of one character's remaining HP. Three formulas cannot be one
  // `AbilityDef`, and spreading them over three enemy turns would destroy the
  // set piece.
  //
  // `inSequence` is the recursion guard: a `sequence` on a sequenced ability is
  // ignored. The chain counter is target-keyed (`chain.ts`), so each stage's
  // chaining is already correct without further work. FFX-2 only — no FFX
  // ability sets the key and no FFX code path reads it.
  //
  // **`extra.sequenceTargets`** (re-parity AI lane C): when set, the command names one target per stage, in order —
  // the first for this ability, the next for the first stage of `sequence`, and so on — as the game's scripted
  // batches do (Baralai's Triple Attack is three Chain Attack commands at three fixed girls). Absent, every stage
  // picks its own targets from its own targeting, as No Love Lost's does.
  const sequence = options.inSequence ? undefined : ability.extra?.['sequence'];
  if (Array.isArray(sequence) && user.alive) {
    const named = ability.extra?.['sequenceTargets'] === true;
    for (const [index, nextId] of sequence.entries()) {
      if (typeof nextId !== 'string') continue;
      const stage = ctx.abilities.get(nextId);
      if (!stage) continue;
      const aimed = named && requested[index + 1] !== undefined ? [requested[index + 1] as CombatantId] : [];
      total += resolveAbility(ctx, user, stage, aimed, { ...options, inSequence: true });
    }
  }

  if (options.isCounter) {
    const first = pool[0];
    if (first) {
      ctx.emit({
        type: 'counter',
        actorId: user.id,
        targetId: first.id,
        abilityId: ability.id,
        cause: options.counterCause ?? 'script',
      });
    }
  }
  return total;
}
