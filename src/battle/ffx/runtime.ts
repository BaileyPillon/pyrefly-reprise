/**
 * The engine-private runtime state: one {@link ActorRuntime} per combatant and the battle-level {@link FFXRuntime}.
 *
 * Split out of `state.ts` in the re-parity W2 batch (that file crossed the 400-line house limit, AGENTS.md rule 7); `state.ts`
 * re-exports both names, so every existing importer is unchanged.
 *
 * Game case: FFX only.
 */

import type { AbilityId, CombatantId, FFXCombatant, MinigameKind } from '../common/types.ts';

/** Per-combatant engine bookkeeping. */
export interface ActorRuntime {
  /**
   * CTB counter, the game's byte (`Chr+0x65c`, 0..255): the clock counts it down and the character at 0 acts
   * [ffx-combat-core §1.1; `adapt/ctb.ts`].
   */
  ctb: number;
  /** The tick speed of the Agility this runtime was made with (`ICV_BASE[agility]`). Not read by the CTB code, which asks the live Agility. */
  base: number;
  /**
   * The base value stored at battle start (`Chr+0x65d`, `3 * tickSpeed` as a byte): a revived character's counter
   * is this, not a value recomputed from its present Agility [VA 0x0078d530; re-parity W2].
   */
  icv: number;
  /**
   * Clock ticks since this character's last Regen payout or since its Regen began (`Chr+0x6d2`, saturating at 255):
   * what its next Regen payout is made of [VA 0x007af4f0; `kernel/turn-ticks.ts`; re-parity W2].
   */
  regenTicks: number;
  /**
   * The maximum HP and MP this character had before Double HP / Double MP doubled them (`Chr+0x59c`, `0x5a0`): the kernel
   * restores them when the flag is removed [VA 0x0078d270; re-parity W2]. Absent until a flag is first turned on.
   */
  poolBaseHp?: number;
  poolBaseMp?: number;
  /** Active telegraph, mirrored into `TurnPreview.chargeStage` [visual-bible §3.13]. */
  charge: { name: string; turnsLeft: number; stage: 1 | 2 } | null;
  /** Live Threaten chance, a percent that may exceed 100 [ffx-combat-core §4.4]. */
  threatenChance: number;
  /** How many turns this actor has taken. */
  turnsTaken: number;
  /** Free-form AI scratch memory, keyed by the AI script. */
  ai: Record<string, number | string | boolean>;
  /** `EnemyDef.abilityIds` — the actions this enemy's AI script may select. */
  abilityIds: string[];
  /** Successful steals against this enemy, halving the base chance each time. */
  stealCount: number;
  /**
   * Cap on every **single hit** of HP damage this actor takes, applied inside
   * `hp.ts#dealDamage` before {@link hpFloor}.
   *
   * Macalania Seymour is the case this exists for: in the HD Remaster — this
   * project's declared baseline — he "cannot be killed before he summons", and
   * the build enforces it by capping every hit on him at **5,999** until Anima
   * has been summoned [ffx-seymour-anima-macalania §5.2, verified: 2 sources].
   * On PS2 the same situation with a 6,000+ second Doublecast **softlocks the
   * game**; that is a bug, not a feature, and reproducing it would be an own
   * goal.
   *
   * Engine-internal on purpose — `ActorRuntime` is not a contract file and
   * nothing outside `src/battle/ffx/**` sees it, so this is a capability, not
   * a schema change. The encounter's AI script sets it at setup and deletes it
   * when the summon fires.
   */
  damageCapPerHit?: number;
  /** Lowest HP any damage may take this actor to. Cleared with {@link damageCapPerHit}. */
  hpFloor?: number;
  /**
   * **Enemy Cover**: a single-target *physical* party action aimed at this id
   * lands on **this** actor instead [ffx-seymour-anima-macalania §2.3,
   * verified: 2 sources]. Magic is never covered.
   *
   * The mirror image of the party-side Guard/Sentinel interception
   * `targeting.ts#redirectTarget` has always had. Cleared implicitly when the
   * coverer dies, because the redirect only considers living enemies.
   */
  coversAllyId?: CombatantId;
  /**
   * Overdrive gauge points this **enemy** gains every time a player-side action
   * targets it, whether or not the action deals damage.
   *
   * `onDamageTaken` only fires on damage, and Anima's third clock advances on a
   * heal or a debuff too [ffx-seymour-anima-macalania §3.4]. The value itself
   * is an `[estimate]` — see `ANIMA_GAUGE_PER_TARGETING`.
   */
  gaugePerTargeting?: number;
  /**
   * **On the field and taking turns, but not a combatant**: never a victory
   * condition and never a defeat condition.
   *
   * **Cid on the *Fahrenheit* is the only user.** He is an invisible enemy with
   * his own CTB icon [ffx-evrae-airship §2], so he needs a turn and the
   * tie-break rank `turnQueue.ts` reserves for the id `'cid'` — but he is
   * unkillable and untargetable, so `engine.ts#checkEnd` would wait for him for
   * ever. Widening `Side` would have forced a decision at ~30 `side === 'enemy'`
   * sites; `flags.isPart` is false and would list him as a limb.
   */
  nonCombatant?: boolean;
  /**
   * **This character's weapon reaches a distant enemy**, whatever the action
   * says. Read only by `targeting.ts#reachesAtRange`, and only at FAR. Wakka's
   * blitzball is the only one: §4.3 is explicit that it is a **character**
   * property and that the ordinary `attack` row is `long_range = false`, so the
   * flag cannot live on the action.
   */
  rangedWeapon?: boolean;
  /**
   * Count every **player-side action that names this actor**, damage or not.
   * {@link gaugePerTargeting} answers "was I targeted" with a gauge; this with a
   * number a script compares against its own last reading. Evrae's Swooping
   * Scythe fires on *being targeted* at range [§4.5], which includes a miss and
   * a status-only command, so neither the damage nor the status set expresses
   * it. Bumped by `onTargeted`, once per action.
   */
  countsPartyTargetings?: boolean;
  partyTargetings?: number;
  /** On the field, but never in the CTB queue: acts only when ordered (`orders.ts`; Daigoro) [ffx-yojimbo §2.5]. */
  ordersOnly?: boolean;
}

/** Battle-level engine bookkeeping. */
export interface FFXRuntime {
  actors: Map<CombatantId, ActorRuntime>;
  /** Whose turn is currently open. `null` between turns. */
  currentActorId: CombatantId | null;
  /** CTB ticks that elapsed at the start of the current turn, for the Regen payout. */
  elapsedTicks: number;
  /** The enemy that acted most recently, for Seymour's alternation guard. */
  lastEnemyActorId: CombatantId | null;
  /**
   * A command suspended waiting for a minigame outcome [CONTRACTS.md].
   *
   * `abilityId` is carried so a *bare* re-submit of the very same Overdrive can
   * be told apart from the player backing out and picking a different one. The
   * first is "nobody is going to play this overlay" and the engine rolls the
   * outcome itself; the second is a fresh request.
   */
  pendingMinigame: { actorId: CombatantId; kind: MinigameKind; abilityId: AbilityId } | null;
  /** Accumulated presentation time, summed from emitted `wait` events. */
  elapsedMs: number;
  /** Set once `victory` / `defeat` / `escape` has been emitted. */
  finished: boolean;
  /** Aeon gauges that were banked before a Grand Summon, keyed by combatant id. */
  aeonStoredGauge: Map<CombatantId, number>;
  /** Party CTB counters frozen while an aeon holds the field [ffx-combat-core §6.1]. */
  frozenPartyCtb: Map<CombatantId, number>;
  /** Aeon builds Yuna owns, so Summon can materialise them. */
  aeonRoster: Map<string, FFXCombatant>;
  /** Item counts, by item id. */
  inventory: Map<string, number>;
  /** Party gil, for Spare Change and the result screen. */
  gil: number;
  /** True when this battle is a link in a chain and should not show results. */
  chained: boolean;
  /** Ids of enemies that have been overkilled. */
  overkilled: CombatantId[];
  /** Whether Escape / Flee are legal at all. */
  canEscape: boolean;
  /**
   * Enemies the passive **Sensor** auto-ability has already announced.
   *
   * Kept out of {@link BattleState} because an `immune-to-sensor` enemy is
   * announced without ever becoming `revealed`, so the state flag cannot double
   * as the "already printed" mark [ffx-combat-core §9, `sensor.ts`].
   */
  sensedIds: Set<CombatantId>;
  /**
   * Destroyed parts waiting on their {@link EnemyDef.reviveRule} timer.
   *
   * `atTicks` is a value of `state.ticks`, the field-wide CTB clock the engine
   * advances by `normalise()`'s elapsed count every turn — not a turn count,
   * because a dead Pagoda takes no turns of its own
   * [ffx-bfa-yu-yevon §1.4].
   */
  pendingPartRevivals: Array<{ id: CombatantId; atTicks: number; maxHp: number }>;
  /**
   * Stalemate watch: the lowest total enemy HP this battle has ever reached,
   * and the turn it was reached on.
   *
   * Yu Yevon is why. He counters every damaging player action with a 9,999
   * Curaga, the two Yu Pagodas put another ~4,500 back between his turns, and
   * the party carries a permanent fayth Auto-Life that makes losing impossible
   * — so a party that runs out of the one Candle of Life is in a battle with
   * **no exit in either direction**. Measured on the shipped board with Defend
   * on every decision: 40,000 steps, 25,364 turns, no `battle-over`, the boss
   * parked at an equilibrium of 6,001 of 99,999 [ffx-bfa-yu-yevon §3.4, §3.5].
   *
   * "Progress" is deliberately a **new minimum**, not "any HP moved": Gravija
   * takes 75% of everybody's current HP every cycle, so HP is moving
   * constantly in exactly the fight that is stuck.
   */
  progress: { bestEnemyHp: number; atTurn: number };
  /**
   * The `A`/`B`/`C` suffixes duplicates carry, assigned once per battle from
   * the formation roster so an enemy is never renamed mid-fight when its twin
   * dies (round 04 PR-0023). Built lazily by `turnQueue.ts`; `rosterSize` is
   * the `state.enemyIds` length it was built from, so an enemy that joins
   * mid-battle rebuilds it and a death never does.
   */
  letterTags?: { rosterSize: number; tags: ReadonlyMap<CombatantId, string> };
}
