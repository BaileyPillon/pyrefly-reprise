/**
 * Building a live {@link BattleState} from a {@link BattleSetup}.
 *
 * `init()` must accept a **full carried-over party state** — HP, MP, statuses,
 * Overdrive gauges, aeon state and item counts — plus `chained: true`, because
 * the BattleScreen re-inits the engine for each link of a chained encounter and
 * no results screen shows between them
 * [docs/CONTRACT-CHANGES.md, orchestrator decision 6].
 */

import type {
  AeonBuild,
  BattleSetup,
  BattleState,
  CombatantId,
  EnemyDef,
  FFXCombatant,
  FFXMemberBuild,
  FFXPartyBuild,
  StatusId,
  StatusInstance,
} from '../common/types.ts';
import type { SeededRng } from '../common/rng.ts';
import type { FFXContentRegistry } from './registry.ts';
import { type Ctx, type FFXRuntime, makeActorRuntime } from './state.ts';
import { applyEquipmentToCombatant, AUTO_STATUS_ABILITIES, hasAuto } from './equipment.ts';
import { refreshCriticalStatus } from './statuses.ts';
import { seedInitialCtb } from './turnQueue.ts';

/** A permanent, undispellable instance of `status`. */
function permanentStatus(status: StatusId): StatusInstance {
  return { id: status, turnsRemaining: 255, ticksRemaining: null, charges: null, stacks: 0, permanent: true };
}

function cloneStatuses(src: Partial<Record<StatusId, StatusInstance>> | undefined): Partial<Record<StatusId, StatusInstance>> {
  const out: Partial<Record<StatusId, StatusInstance>> = {};
  if (!src) return out;
  for (const [key, value] of Object.entries(src)) {
    if (value) out[key as StatusId] = { ...value };
  }
  return out;
}

function memberToCombatant(m: FFXMemberBuild, slot: number, active: boolean): FFXCombatant {
  const c: FFXCombatant = {
    id: m.id,
    name: m.name,
    side: 'party',
    spriteKey: m.spriteKey,
    portraitKey: m.portraitKey,
    stats: { ...m.stats },
    hp: m.hp,
    mp: m.mp,
    statuses: cloneStatuses(m.statuses),
    affinities: {},
    immunities: {},
    immunityFlags: [],
    controller: 'player',
    alive: m.hp > 0,
    removed: !active,
    slot,
    flags: {},
    learnedAbilityIds: [...m.learnedAbilityIds],
    equipment: { weapon: { ...m.equipment.weapon }, armor: { ...m.equipment.armor } },
    overdrive: {
      gauge: m.overdrive.gauge,
      mode: m.overdrive.mode,
      unlockedModes: [...m.overdrive.unlockedModes],
      unlockedOverdriveIds: [...m.overdrive.unlockedOverdriveIds],
    },
    sphereGrid: { ...m.sphereGrid, activatedNodeIds: [...m.sphereGrid.activatedNodeIds], spheres: { ...m.sphereGrid.spheres } },
  };
  if (!c.alive) c.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
  return c;
}

/**
 * Aeon status immunity is a hidden "Aeon Ribbon" auto-ability, not a special
 * case in the engine: Ribbon's whole list **plus** instant Death, all four
 * Breaks, Eject, Scan, Defend, Guard and Sentinel. **Curse and Delay are the
 * exceptions aeons are vulnerable to** [ffx-combat-core §6.1,
 * ffx-seymour-flux §7.7.1]. Seymour's Banish is modelled as an effect that
 * *bypasses* this, which is why it works where an ordinary Eject cannot.
 */
const AEON_INNATE_IMMUNITIES: readonly StatusId[] = [
  'ko',
  'zombie',
  'petrify',
  'poison',
  'confuse',
  'berserk',
  'provoke',
  'threaten',
  'sleep',
  'silence',
  'darkness',
  'slow',
  'doom',
  'eject',
  'scan',
  'defend',
  'guard',
  'sentinel',
  'power-break',
  'magic-break',
  'armor-break',
  'mental-break',
];

function aeonToCombatant(a: AeonBuild, ownerId: CombatantId): FFXCombatant {
  const immunities: Partial<Record<StatusId, number>> = {};
  for (const status of AEON_INNATE_IMMUNITIES) immunities[status] = 255;
  return {
    id: a.id,
    name: a.name,
    side: 'aeon',
    spriteKey: a.spriteKey,
    stats: { ...a.stats },
    hp: a.hp,
    mp: a.mp,
    statuses: cloneStatuses(a.statuses),
    affinities: {},
    immunities,
    immunityFlags: [],
    controller: 'player',
    alive: a.hp > 0,
    // Off-stage until summoned.
    removed: true,
    slot: 1,
    flags: {},
    learnedAbilityIds: [...a.abilityIds],
    overdrive: { gauge: a.overdriveGauge, mode: 'stoic', unlockedOverdriveIds: [...a.overdriveIds] },
    aeon: {
      ownerId,
      dismissable: true,
      temporaryOverdrive: null,
      ...(a.reviveCountdown !== undefined ? { reviveCountdown: a.reviveCountdown } : {}),
    },
  };
}

function enemyToCombatant(e: EnemyDef, isPart: boolean): FFXCombatant {
  const form = e.forms[0];
  const c: FFXCombatant = {
    id: e.id,
    name: form?.name ?? e.name,
    side: 'enemy',
    spriteKey: form?.spriteKey ?? e.spriteKey,
    stats: { ...e.stats, ...(form?.statOverrides ?? {}) },
    hp: e.hp,
    mp: e.mp,
    statuses: {},
    affinities: { ...e.affinities },
    immunities: { ...e.immunities },
    immunityFlags: [...e.immunityFlags],
    controller: 'ai',
    alive: e.hp > 0,
    removed: false,
    slot: e.slot,
    flags: { ...e.flags, ...(isPart ? { isPart: true } : {}) },
    learnedAbilityIds: [...e.abilityIds],
    enemy: {
      aiScriptId: e.aiScriptId,
      formIndex: 0,
      forms: e.forms.map((f) => ({ ...f })),
      rewards: { ...e.rewards, drops: e.rewards.drops.map((d) => ({ ...d })) },
      ...(e.threatenChance !== undefined ? { threatenChance: e.threatenChance } : {}),
      ...(e.poisonTickPercent !== undefined ? { poisonTickPercent: e.poisonTickPercent } : {}),
      ...(e.doomTurns !== undefined ? { doomTurns: e.doomTurns } : {}),
      ...(e.zanmatoLevel !== undefined ? { zanmatoLevel: e.zanmatoLevel } : {}),
    },
  };
  if (form?.hp !== undefined) {
    c.stats.maxHp = form.hp;
    c.hp = Math.min(c.hp, form.hp);
  }
  if (e.sensorText !== undefined) c.sensorText = e.sensorText;
  if (e.scanText !== undefined) c.scanText = e.scanText;
  if (e.misleadingSensor !== undefined) c.misleadingSensor = e.misleadingSensor;
  return c;
}

/** Build the state and runtime for one battle. */
export function buildBattle(
  setup: BattleSetup,
  rng: SeededRng,
  content: FFXContentRegistry,
  emit: Ctx['emit'],
): Ctx {
  const party = setup.party as FFXPartyBuild;
  const group = setup.enemies;

  const state: BattleState = {
    game: 'ffx',
    combatants: {},
    activeIds: [],
    reserveIds: [],
    enemyIds: [],
    aeonId: null,
    turn: 0,
    ticks: 0,
    log: [],
    nextSeq: 0,
    triggers: setup.triggers.map((t) => ({ ...t })),
    firedTriggerIds: [],
    result: null,
    seed: setup.seed,
    flags: {},
  };

  const rt: FFXRuntime = {
    actors: new Map(),
    currentActorId: null,
    elapsedTicks: 0,
    lastEnemyActorId: null,
    pendingMinigame: null,
    elapsedMs: 0,
    finished: false,
    aeonStoredGauge: new Map(),
    frozenPartyCtb: new Map(),
    aeonRoster: new Map(),
    inventory: new Map(),
    gil: party.gil ?? 0,
    chained: setup.chained === true,
    overkilled: [],
    canEscape: (setup.canEscape ?? group.canEscape ?? false) === true,
  };

  const ctx: Ctx = { state, rt, rng, content, emit };

  const activeSet = new Set<string>(party.activeSlots);
  let slot = 0;
  for (const member of party.members) {
    const isActive = activeSet.has(member.id);
    const c = memberToCombatant(member, isActive ? party.activeSlots.indexOf(member.id) : slot, isActive);
    state.combatants[c.id] = c;
    rt.actors.set(c.id, makeActorRuntime(c));
    if (isActive) state.activeIds.push(c.id);
    else state.reserveIds.push(c.id);
    slot++;
  }
  // Preserve the authored left-to-right order of the three active slots.
  state.activeIds = party.activeSlots.filter((id) => state.combatants[id] !== undefined);

  const ownerId = state.activeIds.find((id) => id === 'yuna') ?? state.activeIds[0] ?? 'yuna';
  for (const build of party.aeons) {
    const aeon = aeonToCombatant(build, ownerId);
    state.combatants[aeon.id] = aeon;
    rt.actors.set(aeon.id, makeActorRuntime(aeon));
    rt.aeonRoster.set(build.id, aeon);
  }

  for (const enemy of group.enemies) {
    const c = enemyToCombatant(enemy, false);
    if (group.aiScriptId && c.enemy) c.enemy.aiScriptId = group.aiScriptId;
    state.combatants[c.id] = c;
    const actorRt = makeActorRuntime(c);
    actorRt.threatenChance = enemy.threatenChance ?? 100;
    actorRt.abilityIds = [...enemy.abilityIds];
    rt.actors.set(c.id, actorRt);
    state.enemyIds.push(c.id);
  }
  for (const part of group.parts ?? []) {
    const c = enemyToCombatant(part, true);
    state.combatants[c.id] = c;
    const actorRt = makeActorRuntime(c);
    actorRt.threatenChance = part.threatenChance ?? 100;
    actorRt.abilityIds = [...part.abilityIds];
    rt.actors.set(c.id, actorRt);
    state.enemyIds.push(c.id);
  }

  for (const entry of party.inventory) {
    rt.inventory.set(entry.itemId, (rt.inventory.get(entry.itemId) ?? 0) + entry.count);
  }

  // Equipment folds into resistances and affinities, then grants its permanent
  // statuses at stack 255 [ffx-combat-core §9].
  for (const id of [...state.activeIds, ...state.reserveIds]) {
    const c = state.combatants[id] as FFXCombatant | undefined;
    if (!c) continue;
    applyEquipmentToCombatant(c);
    for (const [ability, status] of AUTO_STATUS_ABILITIES) {
      if (hasAuto(c, ability) && c.statuses[status] === undefined) {
        c.statuses[status] = permanentStatus(status);
      }
    }
    refreshCriticalStatus(ctx, c);
  }

  seedInitialCtb(ctx, setup.condition ?? 'normal');
  return ctx;
}
