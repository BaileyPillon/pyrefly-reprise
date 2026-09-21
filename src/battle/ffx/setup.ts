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
  ElementalAffinities,
  EnemyDef,
  FFXCombatant,
  FFXMemberBuild,
  FFXPartyBuild,
  StatusId,
  StatusInstance,
} from '../common/types.ts';
import type { SeededRng } from '../common/rng.ts';
import { cloneData } from '../common/clone.ts';
import type { FFXContentRegistry } from './registry.ts';
import { type Ctx, type FFXRuntime, makeActorRuntime } from './state.ts';
import { applyEquipmentToCombatant, AUTO_STATUS_ABILITIES, hasAuto } from './equipment.ts';
import { refreshCriticalStatus } from './statuses.ts';
import { seedInitialCtb } from './turnQueue.ts';
import { applyMacalaniaSetup } from './ai/seymour-anima-macalania.ts';
import { applyEvraeSetup } from './ai/evrae-rules.ts';

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

/**
 * The elemental eaters an aeon's **hidden default armour** carries, by aeon id.
 *
 * Exactly the same kind of table as {@link AEON_INNATE_IMMUNITIES} above and
 * for exactly the same reason: `AeonBuild` has no `equipment` field, aeons are
 * in neither `activeIds` nor `reserveIds` so `applyEquipmentToCombatant` never
 * runs on them, and `aeonToCombatant` hard-coded `affinities: {}` — so an aeon
 * armour ability that is pure data in the source game had nowhere to live.
 *
 * **Shiva's armour carries Ice Eater** [ffx-seymour-anima-macalania §8.4,
 * verified: 2 sources]. Two published behaviours depend on it and both were
 * silently doing nothing: healing Shiva with her own Blizzara (§7 row 13), and
 * Macalania Seymour's Blizzaga step *healing* your aeon, because he uses the
 * -ga tier on a summoned aeon regardless of absorption (§5.2). One turn in
 * four, the boss tops up your Shiva. It is canon, it is funny, and it is a free
 * teaching moment about elemental affinity.
 *
 * This is a **live rule for every chapter that summons Shiva**, not a Macalania
 * special case — she has Ice Eater everywhere. No existing chapter aims an ice
 * action at a summoned aeon, so no shipped outcome moves; affinity is a damage
 * multiplier and draws no RNG, so seeded runs stay aligned either way.
 */
const AEON_INNATE_AFFINITIES: Readonly<Record<string, ElementalAffinities>> = {
  shiva: { ice: 'absorb' },
};

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
    affinities: { ...(AEON_INNATE_AFFINITIES[a.id] ?? {}) },
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
    // **An enemy may start off the field.** `flags.hidden` is documented as
    // "a form waiting off-stage", and `predicates.ts` already honours it for
    // targeting; reading it here as `removed` is what makes an arrival
    // mid-battle possible at all (`forms.ts#revealEnemy`). Macalania's Anima
    // is the only shipped enemy that sets it, so nothing else changes.
    removed: e.flags.hidden === true,
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
      // A Yu Pagoda "cannot be permanently killed" [ffx-bfa-yu-yevon §1.4].
      ...(e.reviveRule !== undefined ? { reviveRule: { ...e.reviveRule } } : {}),
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

/**
 * A possessed aeon fights with **the player's own aeon's stat block**
 * [ffx-bfa-yu-yevon §2.2, verified: 2 sources].
 *
 * The wiki bestiary literally lists a possessed aeon's HP as "Yuna Valefor HP"
 * and its Strength / Magic / Defense / Magic Defense / Agility / Accuracy /
 * Evasion as "Varies"; only Luck is fixed, and it is forced to **1**. So the
 * gauntlet is self-balancing: a player who fed Yuna's aeons faces hard copies
 * of them, a player who ignored them faces trivial ones. That is a live copy,
 * not a table, which is why `data/ffx/enemies/braskas-final-aeon.ts` ships
 * `stats: { hp: 1, ... }` placeholders with a doc comment saying the engine
 * must overwrite them here — and until it did, every one of the five possessed
 * aeons stood up with **1 HP** and died to the first hit, which made five of
 * the chapter's seven links a walkover.
 *
 * Affinities are mirrored too, so "hit its weakness" means something. Luck 1 is
 * the one deliberate divergence from the player's copy, per the bestiary.
 *
 * No-ops for every other enemy in the game: the id has to start with
 * `possessed-` *and* name an aeon the party actually owns.
 */
function mirrorPossessedAeon(c: FFXCombatant, party: FFXPartyBuild): void {
  if (!c.id.startsWith('possessed-')) return;
  const aeonId = c.id.slice('possessed-'.length);
  const build = party.aeons.find((a) => a.id === aeonId);
  if (!build) return;
  c.stats = { ...build.stats, luck: 1 };
  c.hp = build.stats.maxHp;
  c.mp = build.stats.maxMp;
  c.alive = c.hp > 0;
  c.affinities = { ...c.affinities };
  const form = c.enemy?.forms[0];
  if (form) form.hp = build.stats.maxHp;
}

/** Build the state and runtime for one battle. */
export function buildBattle(
  setup: BattleSetup,
  rng: SeededRng,
  content: FFXContentRegistry,
  emit: Ctx['emit'],
): Ctx {
  // **The battle owns its records.** `setup.party` and `setup.enemies` are the
  // module singletons `src/data/ffx/**` exports — the *same* `EnemyGroupDef`
  // and `FFXPartyBuild` objects every run of this chapter is handed. The
  // field-by-field copies below are thorough one level down and share
  // everything under it (`equipment.*.autoAbilities`, `rewards.steal`,
  // `forms[n].statOverrides`), so the one deep copy here is what actually
  // makes a battle independent of whatever ran before it in the same process.
  // See `src/battle/common/clone.ts` for the audit that found the leaks.
  const party = cloneData(setup.party) as FFXPartyBuild;
  const group = cloneData(setup.enemies);

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
    triggers: cloneData(setup.triggers),
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
    sensedIds: new Set(),
    pendingPartRevivals: [],
    progress: { bestEnemyHp: Number.POSITIVE_INFINITY, atTurn: 0 },
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

  // The fayth's permanent Auto-Life [ffx-bfa-yu-yevon §2.3]. It goes on every
  // member, active and benched, because a switch mid-chain must not lose it.
  if (group.grantsPermanentAutoLife === true) {
    for (const id of [...state.activeIds, ...state.reserveIds]) {
      const c = state.combatants[id];
      if (c) c.statuses['auto-life'] = permanentStatus('auto-life');
    }
  }

  for (const enemy of group.enemies) {
    const c = enemyToCombatant(enemy, false);
    mirrorPossessedAeon(c, party);
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

  // Per-encounter scripted setup. A no-op in every battle but its own: the
  // Macalania opening is "a scripted pre-turn sequence, not three ordinary
  // turns" [ffx-seymour-anima-macalania §5.2], so the Guardians' Protect and
  // Seymour's Shell are applied here rather than costing three enemy turns the
  // player would watch resolve before acting.
  applyMacalaniaSetup(ctx);
  // The airship opens NEAR, Cid becomes a non-combatant turn-taker and Wakka's
  // blitzball becomes a ranged weapon [ffx-evrae-airship §4.1, §2.1, §4.3].
  applyEvraeSetup(ctx);
  return ctx;
}
