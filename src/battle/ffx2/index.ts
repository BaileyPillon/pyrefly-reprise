/**
 * `src/battle/ffx2` — the FFX-2 ATB battle engine.
 *
 * Pure TypeScript. Imports nothing from `src/engine/**`, `src/ui/**`, `three`
 * or `src/data/**`, calls `Math.random()` nowhere, and is deterministic under
 * `SeededRng`: the same seed plus the same command sequence produces the same
 * event stream byte for byte (`docs/ARCHITECTURE.md`, "Layering rule").
 *
 * ```ts
 * import { FFX2Engine } from './battle/ffx2/index.ts';
 *
 * const engine = new FFX2Engine({ abilities, dresspheres, garmentGrids });
 * engine.init({ game: 'ffx2', party, enemies: bahamutGroup, triggers: [], seed: 1 });
 * ```
 *
 * The registries are optional: everything falls back to the research-cited
 * baseline in this folder, so the engine runs against the half-transcribed data
 * files as they stand today. See `docs/CONTRACT-CHANGES.md` for the note.
 */

export { FFX2Engine, makeFFX2Engine } from './engine.ts';
export { DEFAULT_ATB_MODE, type AtbMode } from './active.ts';

export type {
  AbilityRegistry,
  AiContext,
  AiScript,
  CarriedPartyState,
  DressphereDef,
  DressphereRegistry,
  Emit,
  EventDraft,
  Ffx2EngineOptions,
  Ffx2Unit,
  GarmentGridDef,
  GarmentGridRegistry,
  GateBonus,
  ItemRegistry,
} from './internal.ts';

// --- gauges ----------------------------------------------------------------
export {
  applyDelayEffect,
  applyActionCancel,
  atbTicks,
  applyWaitDown,
  barLengthFraction,
  barState,
  baseRequired,
  buildSnapshot,
  chargeTicksFor,
  extraRecoveryTicks,
  isReady,
  msToTicks,
  ticksToMs,
  ticksUntilNextEvent,
  tickMultiplier,
} from './gauges.ts';

// --- chain -----------------------------------------------------------------
export {
  advanceChainWindows,
  breakChain,
  cannotEvade,
  chainMultiplier,
  isActionLocked,
  isChained,
  registerHit,
  ticksUntilChainBreak,
} from './chain.ts';

// --- formulas --------------------------------------------------------------
export {
  computeDamage,
  critPercent,
  defenseTerm,
  hitPercent,
  magicBase,
  physicalBase,
  randomiserRoll,
  resolveAffinity,
  specialMagicBase,
} from './formulas.ts';
export type { DamageContext, DamageResult } from './formulas.ts';

// --- statuses --------------------------------------------------------------
export {
  advanceStatuses,
  applyStatus,
  canAct,
  clearAfterBattle,
  DISPEL_REMOVES,
  durationToTicks,
  ESUNA_CURES,
  INFINITE_STATUSES,
  PERSISTS_AFTER_BATTLE,
  removeStatus,
  statLevel,
  statusChanceLinear,
  statusChanceQuartic,
  statusChanceSextic,
  ticksUntilStatusEvent,
} from './statuses.ts';

// --- sensor / scan ---------------------------------------------------------
export { resolveSensor, revealTarget, sensorKind, weaknessesOf } from './sensor.ts';
export type { SensorKind } from './sensor.ts';

// --- dresspheres, grids, spherechange --------------------------------------
export { dressphereStats, hasAnchors, sdspPartStats } from './dressphere-stats.ts';
export { attackHits, defaultDresspheres, hasAttackCommand, isLongRange } from './dresspheres.ts';
export {
  activeGateBonuses,
  adjacentNodes,
  breaksDamageLimit,
  canSpecialDressUp,
  defaultGarmentGrids,
  garmentGrid,
  gatesBetween,
  gateStatTotal,
  waitDownPercent,
  withStatBonus,
} from './garment-grids.ts';
export { performSpherechange, refreshDerivedStats, specialDressUpPartIds } from './spherechange.ts';

// --- data adapters ---------------------------------------------------------
export {
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from './adapters.ts';
export type { DataDressphere, DataGarmentGrid, DataGridEffect } from './adapters.ts';

// --- abilities, minigames, AI ----------------------------------------------
export { chainRegistries, defaultAbilities, FALLBACK_ABILITY_IDS } from './abilities.ts';
export { attachedResult, hitsFromOutcome, rollDefault, rollReels, rollTriggerHappy } from './minigames.ts';
export { aiScriptFor, aiScriptIds, registerAiScript } from './ai/index.ts';
export { bahamutStep } from './ai/bahamut.ts';
export { bumpNodeCounter, nodeColour, syncNodeImmunity } from './ai/vegnagun.ts';
export { classifyAttack } from './ai/vegnagun-body.ts';

// --- constants (tests and the debug API read these) ------------------------
export * from './constants.ts';
