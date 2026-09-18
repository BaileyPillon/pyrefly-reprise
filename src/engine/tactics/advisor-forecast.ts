/**
 * *What is the boss about to do?* — answered from the `BattleState` the advisor
 * already holds, with no help from the HUD.
 *
 * ## Why this file exists
 *
 * `AdvisorOptions.intent` was added so a HUD could hand the advisor the
 * enemy-intent forecast it already draws over the boss's head. Neither HUD ever
 * did: `src/ui/ffx/FFXBattleHud.ts` builds its `MoveAdvisor` with no `advisor`
 * option at all, and `src/ui/ffx2/FFX2BattleHud.ts` passes only its two
 * registries. The result was a safety rule that was green in unit tests and
 * **dead on the live build** — the intent slab announced "Lance of Atrophy ·
 * Zombie 50%" over Seymour's head while the card underneath offered a revive
 * and said nothing about it [critic, fix-3 round 1, F2/F3].
 *
 * Wiring it from the HUD is one line in each HUD, and both of those files
 * belong to other tracks this round. But the advisor does not actually need the
 * HUD: the prediction is a pure function of the board, and every input it needs
 * is either in `BattleState` or in the registries the advisor is already
 * handed. So the forecast is derived here, the card is right in both HUDs and
 * in the shipped configuration, and `AdvisorOptions.intent` stays — a HUD that
 * *does* pass its live source still wins, because that source reads the live
 * engine's CTB counters and AI memory, which a state-only rebuild cannot.
 *
 * ## What a state-only rebuild can and cannot see
 *
 * | | live engine | rebuilt here |
 * |---|---|---|
 * | the boss's rotation | `state.flags` | **same** — Seymour's whole six-step cycle is a flag [`ai/seymour-flux.ts`] |
 * | HP, statuses, forms | `state.combatants` | **same** |
 * | the item bag | `rt.inventory` | `state.flags['inventory:<id>']`, as `simulate.ts` does |
 * | CTB counters | `rt.actors[*].ctb` | **not carried** — see below |
 * | per-actor AI scratch (`rt.actors[*].ai`, `charge`) | yes | **not carried**; the charge ladder is read from the log instead (`advisor-revive.ts` `imminentCharge`) |
 *
 * ## Why the missing CTB counters do not matter for this question
 *
 * The forecast is used for exactly one decision: *is standing this ally up now
 * a wasted turn?* A revived character re-enters the queue with a **rank-3
 * delay** — `turnQueue.ts:156`, `rtOf(target).ctb = baseCtb(agi) * 3` — which is
 * longer than any counter an enemy already on the field is carrying. So every
 * living enemy acts at least once before the ally the player is about to raise
 * does, and "which of them acts *first*" changes nothing: what decides whether
 * the raise survives is the **worst** thing any of them is about to do. That is
 * what {@link forecastFromState} returns, and it is why the reading is honest
 * without a turn order.
 *
 * ## Cost
 *
 * One dry run per sample per enemy, each on a private deep copy
 * (`intent.ts#cloneCtx`), and `buildAdvisorView` only asks for it when somebody
 * is actually on the floor. {@link FORECAST_SAMPLES} is 3 rather than the
 * panel's 24: the panel is printing branch odds to a tenth, this is answering a
 * yes/no, and a branch that three independent samples all agree on is reported
 * as `'scripted'` while anything else is `'likely'` and only ever earns a
 * caution, never a refusal.
 */

import type { BattleState, CombatantId } from '../../battle/common/types.ts';
import { SeededRng } from '../../battle/common/rng.ts';
import { cloneStateForSim } from '../../battle/ffx/simulate.ts';
import { type Ctx, type FFXRuntime, makeActorRuntime } from '../../battle/ffx/state.ts';
import { getFFXRegistry, type FFXContentRegistry } from '../../battle/ffx/registry.ts';
import { type EnemyIntent as FFXEnemyIntent, predictEnemyIntent } from '../../battle/ffx/intent.ts';
import {
  type EnemyIntent as FFX2EnemyIntent,
  predictFFX2EnemyIntent,
} from '../../battle/ffx2/intent.ts';
import type { AbilityRegistry, ItemRegistry } from '../../battle/ffx2/internal.ts';
import type { FFXCombatant } from '../../battle/common/types.ts';
import type { AdvisorIntent } from './advisor-revive.ts';

/** Dry runs per enemy. See the header: this answers a yes/no, not a percentage. */
export const FORECAST_SAMPLES = 3;

/** Never dry-run more than this many enemies, whatever the formation holds. */
const MAX_ENEMIES = 3;

export interface ForecastOptions {
  ffxContent?: FFXContentRegistry;
  ffx2?: { abilities?: AbilityRegistry; items?: ItemRegistry };
}

/**
 * The most dangerous thing any enemy on the field is about to do, or `null`.
 *
 * Never throws: a script that did not expect this board costs the card its
 * forecast, not its card.
 */
export function forecastFromState(
  state: Readonly<BattleState>,
  options: ForecastOptions = {},
): AdvisorIntent | null {
  try {
    return state.game === 'ffx2' ? ffx2Forecast(state, options) : ffxForecast(state, options);
  } catch {
    return null;
  }
}

/** Living, on-field enemies, worst-case order irrelevant — every one of them acts first. */
function enemyIds(state: Readonly<BattleState>): CombatantId[] {
  return state.enemyIds
    .filter((id) => {
      const c = state.combatants[id];
      return c !== undefined && c.alive && c.removed !== true;
    })
    .slice(0, MAX_ENEMIES);
}

// ----------------------------------------------------------------------- FFX

/**
 * A context a prediction can be run against, rebuilt from the public state.
 *
 * The same trick `simulate.ts#runtimeFor` plays, for the same reason and with
 * the same caveats: the runtime is not carried in `BattleState`, and none of
 * what is missing changes *which command* a script picks — the FFX AI scripts
 * read HP, statuses, `state.flags` and the aeon slot, all of which are here.
 */
function ctxFromState(state: Readonly<BattleState>, content: FFXContentRegistry): Ctx {
  const clone = cloneStateForSim(state);
  const rt: FFXRuntime = {
    actors: new Map(),
    currentActorId: null,
    elapsedTicks: 0,
    lastEnemyActorId:
      typeof state.flags['seymour.lastEnemyActor'] === 'string'
        ? (state.flags['seymour.lastEnemyActor'] as CombatantId)
        : null,
    pendingMinigame: null,
    elapsedMs: 0,
    finished: false,
    aeonStoredGauge: new Map(),
    frozenPartyCtb: new Map(),
    aeonRoster: new Map(),
    inventory: new Map(),
    gil: typeof state.flags['gil'] === 'number' ? state.flags['gil'] : 999_999,
    chained: false,
    overkilled: [],
    canEscape: false,
    sensedIds: new Set(),
    pendingPartRevivals: [],
  };
  for (const [id, raw] of Object.entries(clone.combatants)) {
    const c = raw as FFXCombatant;
    const actorRt = makeActorRuntime(c);
    actorRt.abilityIds = [...c.learnedAbilityIds];
    rt.actors.set(id, actorRt);
    if (c.side === 'aeon') rt.aeonRoster.set(id, c);
  }
  return {
    state: clone,
    rt,
    // Any position in the stream: `predictEnemyIntent` samples across it from
    // whatever it is handed, and the live position is not in the state.
    rng: new SeededRng(state.seed ^ (state.ticks + 1)),
    content,
    emit: () => {},
  };
}

function ffxForecast(state: Readonly<BattleState>, options: ForecastOptions): AdvisorIntent | null {
  const ctx = ctxFromState(state, options.ffxContent ?? getFFXRegistry());
  const found: AdvisorIntent[] = [];
  for (const id of enemyIds(state)) {
    const intent = predictEnemyIntent(ctx, id, { samples: FORECAST_SAMPLES });
    if (intent) found.push(fromFFX(intent));
  }
  return worst(found);
}

function fromFFX(intent: FFXEnemyIntent): AdvisorIntent {
  return {
    enemyName: intent.enemyName,
    moveName: intent.moveName,
    abilityId: intent.abilityId,
    // See the header: a raised ally re-enters at three times their base
    // counter, so every enemy on the field acts before they do.
    actsNext: true,
    turnsAway: 0,
    confidence: intent.confidence,
    estimate: intent.estimate
      ? {
          perTarget: intent.estimate.perTarget.map((t) => ({
            targetId: t.targetId,
            lethal: t.lethal,
            amount: t.amount,
          })),
        }
      : null,
    charge: intent.charge ? { name: intent.charge.name, turnsLeft: intent.charge.turnsLeft } : null,
  };
}

// --------------------------------------------------------------------- FFX-2

/**
 * X-2 needs no rebuild at all.
 *
 * Every X-2 script writes through unit memory or `state.flags`, both of which
 * are in the public state — `Ffx2IntentEnv` asks for the state, an RNG and the
 * two registries the advisor is already handed by `FFX2BattleHud`.
 */
function ffx2Forecast(state: Readonly<BattleState>, options: ForecastOptions): AdvisorIntent | null {
  const env = {
    state,
    rng: new SeededRng(state.seed ^ (state.ticks + 1)),
    ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
    ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
  };
  const found: AdvisorIntent[] = [];
  for (const id of enemyIds(state)) {
    const intent = predictFFX2EnemyIntent(env, id, { samples: FORECAST_SAMPLES });
    if (intent) found.push(fromFFX2(intent));
  }
  return worst(found);
}

function fromFFX2(intent: FFX2EnemyIntent): AdvisorIntent {
  return {
    enemyName: intent.enemyName,
    moveName: intent.moveName,
    abilityId: intent.abilityId,
    actsNext: true,
    turnsAway: 0,
    confidence: intent.confidence,
    estimate: intent.estimate
      ? {
          perTarget: intent.estimate.perTarget.map((t) => ({
            targetId: t.targetId,
            lethal: t.lethal,
            amount: t.amount,
          })),
        }
      : null,
    charge: intent.charge ? { name: intent.charge.name, turnsLeft: intent.charge.turnsLeft } : null,
  };
}

// ------------------------------------------------------------------ the worst

/**
 * The forecast that decides whether a raise survives: anything explicitly
 * lethal first, then whatever hits the party hardest.
 */
function worst(found: AdvisorIntent[]): AdvisorIntent | null {
  if (found.length === 0) return null;
  let best = found[0]!;
  let bestRank = rank(best);
  for (const intent of found.slice(1)) {
    const r = rank(intent);
    if (r > bestRank) {
      best = intent;
      bestRank = r;
    }
  }
  return best;
}

function rank(intent: AdvisorIntent): number {
  const targets = intent.estimate?.perTarget ?? [];
  const lethal = targets.some((t) => t.lethal) ? 1_000_000 : 0;
  const harm = targets.reduce((sum, t) => sum + Math.max(0, t.amount), 0);
  return lethal + harm;
}
