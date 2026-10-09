/**
 * The FFX CTB battle engine.
 *
 * ```ts
 * import { createFFXEngine, registerFFXAbilities, registerFFXItems } from 'src/battle/ffx';
 *
 * registerFFXAbilities(ffxAbilities);   // from src/data/ffx
 * registerFFXItems(ffxItems);
 *
 * const engine = createFFXEngine();
 * engine.init(setup);
 * ```
 *
 * The engine imports nothing from `src/engine/**`, `src/ui/**`, `three` or
 * `src/data/**`: it is pure TypeScript over `src/battle/common/types.ts` and
 * `src/battle/common/rng.ts` [docs/ARCHITECTURE.md, layering rule].
 */

export { FFXEngine, createFFXEngine, apForLevel } from './engine.ts';
export type { FFXEngineOptions, FFXEngineSnapshot } from './engine.ts';

export {
  FFXContentRegistry,
  registerFFXAbilities,
  registerFFXItems,
  registerFFXMixRecipes,
  mixKey,
  getFFXRegistry,
  resetFFXRegistry,
  CORE_ABILITIES,
  ATTACK_ABILITY_ID,
  DEFEND_ABILITY_ID,
  AEON_SHIELD_ABILITY_ID,
  AEON_BOOST_ABILITY_ID,
} from './registry.ts';

// Mechanics, exported so tests and the debug API can pin them directly.
export { idiv, baseCtb, icvVariance, ICV_BASE, ICV_VARIANCE } from './math.ts';
export { computeDamage, estimatedDamage, hitChance, critChance, resolveAffinity } from './formulas.ts';
export type { DamageInput, DamageResult, TimingBonus } from './formulas.ts';
export type { FuryTier } from './fury.ts';
export { effectiveStats, effectivePool } from './effectiveStats.ts';
export type { EffectiveStats, EffectiveStatRow, EffectiveStatKey, StatBonusKind, StatsBearer } from './effectiveStats.ts';
export { bearerHasAuto, bonusPercentFor } from './equipment.ts';
export type { BonusFamily, EquipmentBearer } from './equipment.ts';
export {
  recoveryTicks,
  predictTurnOrder,
  applyDelay,
  normalise,
  nextActor,
  seedInitialCtb,
  tieBreakRank,
  statusIconsFor,
} from './turnQueue.ts';
export { removeStatus, refreshCriticalStatus, bouncesOffReflect, SURVIVES_KO } from './statuses.ts';
export { dealDamage, healOutsideChain, koActor, reviveActor, ejectActor, restorePart } from './hp.ts';
export { resolveAbility, mpCostFor, blockedBySilence } from './abilities.ts';
export type { ResolveOptions } from './abilities.ts';
export { advanceForm, hasNextForm } from './forms.ts';
export { summonAeon, dismissAeon, banishAeon, availableAeons, AEON_REVIVE_BATTLES } from './aeons.ts';
export {
  addGauge,
  setGauge,
  spendOverdrive,
  overdriveReady,
  rollDefaultMinigame,
  minigameParams,
  timerMsFor,
  timingBonusFrom,
  degreesPerCast,
  furyCastsFor,
  furyTierOf,
  isMenuMarker,
  DEGREES_PER_ROTATION,
  FURY_ANCHOR_BUDGET,
  FURY_MAX_CASTS,
  AEON_FILL_MULT,
  TACTICIAN_STATUSES,
  VICTIM_STATUSES,
} from './overdrive.ts';
export { mortibsorption, MORTIORCHIS_MIN_MAX_HP, MORTIORCHIS_DECAY } from './scripted.ts';
export { validTargets, resolveTargets, redirectTarget, reflectBounceTarget } from './targeting.ts';
export { availableCommands } from './commands.ts';
// --- sensor / scan ---------------------------------------------------------
export { partyHasSensor, revealForSensorAuto, revealTarget, sensorKind, weaknessesOf } from './sensor.ts';
export type { SensorKind } from './sensor.ts';
export { onTurnStart, onTurnEnd, collectReactions } from './ticks.ts';
export { evaluateTriggers, collectSignals } from './triggers.ts';
export type { TriggerSignals } from './triggers.ts';
export { buildBattle } from './setup.ts';
export type { Ctx, FFXRuntime, ActorRuntime, EventInput } from './state.ts';

// AI.
export {
  chooseAiCommand,
  activeScriptId,
  registerAiScript,
  getAiScript,
  registeredAiScriptIds,
  aiContextFor,
} from './ai/index.ts';
export type { AiContext, AiScript } from './ai/types.ts';
export { collectBossCounters, runMortibsorptionIfDown } from './ai/reactions.ts';
