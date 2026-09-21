/**
 * **The probability band**: what a previewed action is worth when the thing it
 * is trying to do is a coin flip.
 *
 * ## The defect this exists to close
 *
 * A preview answers every *branch* roll at its median [`ffx/simulate.ts`
 * header, `RollPolicyRng.int`], so a status whose net chance is 40 reports as
 * **not landed** in all three roll policies — `min`, `mid` and `max` sweep the
 * magnitude ladder and deliberately leave the branch alone. The advisor then
 * priced that report twice over: `scoreOutcome` charged `WASTED_TURN_PENALTY`
 * for "tried to apply something, applied nothing", and `changesNothing` classed
 * the same row *inert* and sorted it behind every row that does something.
 *
 * Measured on this tree, 2026-09-21, forty seeds a chapter:
 *
 * | Chapter | the chapter's own line | a player following the card |
 * |---|---|---|
 * | 3 Braska's Final Aeon | **39 / 40 wins** | **0 / 40** — 30 defeats, 10 stalemates |
 *
 * Chapter 3 is won by getting Slow onto both Yu Pagodas. Slow lands about two
 * times in five, so the preview said *nothing happened*, and the card answered
 * "what do I press" with Cheer — every time, for four hundred and forty-eight
 * turns, until the engine's own watchdog called the fight unwinnable
 * [docs/plans/advisor-v2-review.md §2.2].
 *
 * ## Why this is not the three roll weights the plan asked for
 *
 * The paper preflight assumed a `roll: 'max'` read would land a 40 % status and
 * that the fix was an expectation over three simulations. **Measured, it does
 * not**: `isBranchRange` pins hit, crit, status and escape draws to the median
 * at every policy, on purpose, so that a printed damage range can never
 * silently include a critical. Three simulations would therefore have produced
 * three identical status reports and cost 2.7 ms per decision to do it.
 *
 * So the band is a band over the **probability**, not over the roll: the odds
 * come from the engine's own formulas, which are pure functions of the chance
 * byte and the target's resistance, and cost nothing to evaluate. Same idea,
 * correct substrate, cheaper.
 *
 * ## Which game
 *
 * **Both**, with each game's own formula and no shared table [AGENTS.md rule
 * 14]:
 *
 *  * **FFX** reuses `src/battle/ffx/estimate.ts`'s `statusOdds` — already
 *    shipped, already the enemy-intent panel's source, and already the mirror
 *    of `statuses.ts#rollStatus` [ffx-combat-core §4.1]. Two panels reading two
 *    derivations of one number is the worst outcome available, so there is one.
 *  * **FFX-2** mirrors `src/battle/ffx2/resolve.ts#applyRiders` — resistance
 *    255 blocks, a chance byte of 254 or more always lands, and everything else
 *    is `statusChanceLinear(userLevel, chance, targetLevel, resist)`
 *    [ffx2-combat-core §2.6a]. The engine's own exported helper is called, not
 *    a copy of the arithmetic.
 *
 * Pure and DOM-free. Nothing in `src/battle/**` changes.
 */

import type {
  AbilityDef,
  AnyCombatant,
  BattleState,
  Command,
  CombatantId,
  FFXCombatant,
  StatusId,
} from '../../battle/common/types.ts';
import type { SimOutcome } from '../../battle/ffx/simulate.ts';
import { statusOdds } from '../../battle/ffx/estimate.ts';
import { statusChanceLinear } from '../../battle/ffx2/statuses.ts';
import { changesNothing } from './advisor-guard.ts';

/** One status this action is trying to put on one combatant, with its real odds. */
export interface StatusChance {
  targetId: CombatantId;
  status: StatusId;
  /** 0–100, from the engine's own formula. */
  percent: number;
  /** The median-branch preview reported it as landed. */
  landedAtMedian: boolean;
  /** The target's resistance refuses it outright: no roll is taken. */
  blocked: boolean;
}

/**
 * The odds one FFX-2 application lands, mirroring `resolve.ts#applyRiders`.
 *
 * FFX-2 only. Kept here rather than in `estimate.ts` because X-2 has no
 * `estimate.ts` and adding one would be a change to `src/battle/**`, which this
 * track does not own.
 */
function ffx2StatusPercent(
  user: AnyCombatant,
  target: AnyCombatant,
  app: { status: StatusId; chance: number },
): { percent: number; blocked: boolean } {
  const resist = (target.immunities as Record<string, number | undefined>)[app.status] ?? 0;
  if (resist >= 255) return { percent: 0, blocked: true };
  if (app.chance >= 254) return { percent: 100, blocked: false };
  const percent = statusChanceLinear(
    (user as { level?: number }).level ?? 1,
    app.chance,
    (target as { level?: number }).level ?? 1,
    resist,
  );
  return { percent, blocked: percent <= 0 };
}

/**
 * Who this action aims a status at.
 *
 * Read from the board and the resolved record, never from a per-ability table:
 * the command's own aim, widened to the whole side when the record's targeting
 * is a group one, plus anybody the preview actually touched. A status that
 * *did* land is included by its own `status-add`, so a partial landing on a
 * party-wide move is still priced per target.
 */
function aimedAt(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  def: AbilityDef,
  outcome: SimOutcome,
): CombatantId[] {
  const ids = new Set<CombatantId>();
  for (const id of command.targets as readonly CombatantId[]) ids.add(id);
  for (const change of outcome.statusChanges) if (change.applied) ids.add(change.targetId);

  const allies = [...state.activeIds, ...(state.aeonId ? [state.aeonId] : [])];
  switch (def.targeting) {
    case 'all-enemies':
    case 'random-enemy':
      for (const id of state.enemyIds) ids.add(id);
      break;
    case 'all-allies':
    case 'random-ally':
      for (const id of allies) ids.add(id);
      break;
    case 'all':
      for (const id of [...allies, ...state.enemyIds]) ids.add(id);
      break;
    default:
      break;
  }

  // **The simulation decides who the action actually reached.** An aim is a
  // request, not a result: Reflect bounces a single-target spell to the other
  // side [`ffx/abilities.ts` reflect branch, `statuses.ts#bouncesOffReflect`], a
  // Nul charge eats an element, Cover takes the hit for somebody else. So if
  // the resolution named *anybody*, only the named ones count as engaged, and a
  // status that did not land on them is the roll this band exists to price.
  //
  // Measured, and this is Chapter 2 in one paragraph: Yunalesca carries Reflect,
  // so Yuna's NulBlaze aimed at Tidus resolves as a `status-add` on
  // **Yunalesca**. Without this filter the band priced a certain-to-land buff
  // on Tidus that the spell never reached — +300 a row — and the card spent
  // Yuna's turns bouncing Nul spells off the boss. Forty seeds: 33 wins fell to
  // 18, and this restored them.
  //
  // `miss` is excluded from "named" on purpose: a nullified or whiffed hit is
  // the engine saying the action did **not** take effect there. So is the
  // actor's own `mp-damage`, which is what the action *costs* and names the
  // caster — the same exclusion `changesNothing` already makes, and without it
  // every MP-costing spell reads as having reached nobody but its caster.
  // Measured: with the caster left in, Chapter 3's `Slow -> Yu Pagoda` came back
  // with an empty band and the chapter fell from 39/40 to 37/40.
  const named = new Set<CombatantId>();
  for (const e of outcome.events as ReadonlyArray<{ type: string; targetId?: CombatantId }>) {
    if (e.type === 'miss' || e.targetId === undefined) continue;
    if (e.type === 'mp-damage' && e.targetId === actorId) continue;
    named.add(e.targetId);
  }

  return [...ids].filter((id) => {
    const c = state.combatants[id];
    if (!c) return false;
    if (!c.alive && !def.flags.includes('misses-if-target-alive')) return false;
    return named.size === 0 || named.has(id);
  });
}

/**
 * Every status this previewed action is trying to apply, with the odds the
 * engine would actually roll it at.
 *
 * `[]` when the action applies no statuses at all — the overwhelming majority
 * of rows, and the reason this costs nothing on a wide menu.
 */
export function statusChances(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  outcome: SimOutcome | null,
): StatusChance[] {
  if (!outcome || outcome.rejected) return [];
  const def = outcome.ability;
  if (!def || def.statusEffects.length === 0) return [];
  const user = state.combatants[actorId];
  if (!user) return [];

  const out: StatusChance[] = [];
  const landed = new Set(
    outcome.statusChanges.filter((c) => c.applied).map((c) => `${c.targetId}/${c.status}`),
  );
  for (const targetId of aimedAt(state, actorId, command, def, outcome)) {
    const target = state.combatants[targetId];
    if (!target) continue;
    for (const app of def.statusEffects) {
      // **A status already on the target cannot land, whatever the odds byte
      // says.** Both engines' `applyStatus` refuse a non-stacking status that
      // is present (FFX `statuses.ts#applyStatus`; FFX-2 returns `null` and the
      // caller emits X-2's own MISS), so no roll is ever taken.
      //
      // Measured, and it is the whole of Chapter 2's half of this repair: Shell,
      // Protect, Regen and the four Nul- spells carry a chance byte of 254,
      // which reads as 100 %. Pricing them at their odds while Yunalesca's party
      // already carried them turned a re-cast worth −3 000 into one worth +300,
      // and the card spent Yuna's turns re-buffing a buffed party: 40 seeds went
      // from 33 wins to 18 in one edit, 2026-09-21. This line is why the final
      // number is 39.
      const existing = (target.statuses as Record<string, { stacks?: number } | undefined>)[app.status];
      const stacking = app.stacks !== undefined && app.stacks > 0;
      if (existing && !stacking) {
        out.push({ targetId, status: app.status, percent: 0, landedAtMedian: false, blocked: true });
        continue;
      }
      const read =
        state.game === 'ffx2'
          ? ffx2StatusPercent(user, target, app)
          : (() => {
              const o = statusOdds(target as FFXCombatant, app);
              return { percent: o.percent, blocked: o.blocked };
            })();
      out.push({
        targetId,
        status: app.status,
        percent: read.percent,
        landedAtMedian: landed.has(`${targetId}/${app.status}`),
        blocked: read.blocked,
      });
    }
  }
  return out;
}

/** The best chance anything on this action has of landing. 0 = nothing can. */
export function bestChance(chances: readonly StatusChance[]): number {
  let best = 0;
  for (const c of chances) if (c.percent > best) best = c.percent;
  return best;
}

/**
 * **The band-aware inert test.** A move is a no-op only when it changes nothing
 * at the median branch **and** there was no branch it could have won.
 *
 * This is the half of the Chapter 3 repair that decides the fight: `Slow` on an
 * unslowed Yu Pagoda changes nothing in the preview, and is emphatically not a
 * wasted turn. The single-outcome {@link changesNothing} keeps its own meaning
 * and its nine existing tests; this wraps it.
 *
 * **Both games** [AGENTS.md rule 14]: "do not call a coin flip nothing" is a
 * property of advice, and the odds behind it come from each engine's own
 * formula.
 */
export function inertAcrossBand(
  actorId: CombatantId,
  command: Command,
  outcome: SimOutcome | null,
  chances: readonly StatusChance[],
): boolean {
  if (!changesNothing(actorId, command, outcome)) return false;
  return bestChance(chances) <= 0;
}

/**
 * The expected value of the statuses this action is trying to apply, in the
 * same units `scoreOutcome` works in.
 *
 * Only the applications the median branch **missed** are priced here: one it
 * landed is already in `scoreOutcome`'s own tally, and paying for it twice
 * would make a 60 %-chance Break outscore a guaranteed kill.
 *
 * @param value what one landed status is worth on that target — the advisor's
 *   own `INFLICT_VALUE` / `CURE_VALUE` tables, passed in so this file owns no
 *   balance numbers of its own.
 */
export function expectedStatusValue(
  chances: readonly StatusChance[],
  value: (status: StatusId, targetId: CombatantId) => number,
): number {
  let total = 0;
  for (const c of chances) {
    if (c.landedAtMedian || c.percent <= 0) continue;
    total += (c.percent / 100) * value(c.status, c.targetId);
  }
  return total;
}

/**
 * How sure the card is allowed to sound about this action.
 *
 * `'certain'` — nothing here is a roll, or everything it rolls for is at 100.
 * `'likely'` — the median branch says it lands (so the net chance is over 50).
 * `'gamble'` — the fight turns on a draw, and the sentence has to say so.
 *
 * The word rides **inside the sentence** rather than on a chip of its own: the
 * advisor card has no approved target tile, and new paint on it needs Bailey's
 * options round first [AGENTS.md rule 9; docs/plans/advisor-v2-review.md §11].
 */
export function confidenceOf(chances: readonly StatusChance[]): 'certain' | 'likely' | 'gamble' {
  const rolled = chances.filter((c) => c.percent > 0 && c.percent < 100);
  if (rolled.length === 0) return 'certain';
  if (rolled.every((c) => c.landedAtMedian)) return 'likely';
  return 'gamble';
}
