/**
 * Turning a {@link Chapter} into a {@link BattleSetup}, and carrying the party
 * forward across a chained encounter.
 *
 * Chained encounters are orchestrator decision #6 in `docs/CONTRACT-CHANGES.md`:
 * the engine never advances groups itself. When a `victory` lands and the
 * formation has a `nextGroupId`, the **screen** re-inits the engine on the next
 * formation with the party's live HP, MP, statuses, Overdrive gauges and item
 * counts, and no results screen shows between links. Yunalesca's three forms
 * and the Vegnagun chain both run through here.
 */

import type {
  AnyCombatant,
  BattleSetup,
  BattleState,
  EnemyGroupDef,
  FFX2PartyBuild,
  FFXCombatant,
  FFXPartyBuild,
  InventoryEntry,
  MidBattleTrigger,
} from '../../battle/common/types.ts';
import type { Chapter } from '../../data/encounters.ts';

/** Every enemy-group module under `src/data/<game>/enemies/`, lazily. */
const groupModules = import.meta.glob('../../data/*/enemies/*.ts') as Record<
  string,
  () => Promise<Record<string, unknown>>
>;

function isGroup(v: unknown): v is EnemyGroupDef {
  const o = v as Partial<EnemyGroupDef> | null;
  return !!o && typeof o.id === 'string' && Array.isArray(o.enemies);
}

/**
 * Find a formation by id across every data module. Used to follow a
 * `nextGroupId` without a central registry existing yet.
 */
export async function findEnemyGroup(id: string): Promise<EnemyGroupDef | null> {
  for (const load of Object.values(groupModules)) {
    try {
      const mod = await load();
      for (const exported of Object.values(mod)) {
        if (isGroup(exported) && exported.id === id) return exported;
      }
    } catch {
      /* a half-written data module; skip it */
    }
  }
  return null;
}

/** The first setup for a chapter. */
export function setupForChapter(chapter: Chapter, seed: number): BattleSetup {
  const triggers: MidBattleTrigger[] = chapter.scriptsRef?.mid ?? [];
  return {
    game: chapter.game,
    party: chapter.buildRef,
    enemies: chapter.enemyGroupRef,
    triggers,
    seed,
    condition: 'normal',
    canEscape: chapter.enemyGroupRef.canEscape ?? false,
  };
}

/**
 * The setup for the *next* link of a chain.
 *
 * `condition: 'scripted'` marks it as a continuation: no opening flourish, no
 * results screen, and the party arrives in exactly the state it finished the
 * last link in.
 */
export function setupForNextLink(
  previous: BattleSetup,
  nextGroup: EnemyGroupDef,
  state: BattleState,
  seed: number,
): BattleSetup {
  return {
    game: previous.game,
    party: carryPartyForward(previous.party, state),
    enemies: nextGroup,
    triggers: previous.triggers,
    seed,
    condition: 'scripted',
    canEscape: nextGroup.canEscape ?? false,
  };
}

/**
 * Rewrite a party build so every member starts the next link with the HP, MP,
 * statuses and Overdrive gauge they ended the previous one on.
 *
 * The build is the template (it carries the stats, equipment and grid the
 * engine needs); live state supplies the mutable half.
 */
export function carryPartyForward(
  build: FFXPartyBuild | FFX2PartyBuild,
  state: BattleState,
): FFXPartyBuild | FFX2PartyBuild {
  if (build.game === 'ffx') return carryFfx(build, state);
  return carryFfx2(build, state);
}

function carryFfx(build: FFXPartyBuild, state: BattleState): FFXPartyBuild {
  const members = build.members.map((m) => {
    const live = state.combatants[m.id] as FFXCombatant | undefined;
    if (!live) return m;
    return {
      ...m,
      hp: clamp(live.hp, 0, m.stats.maxHp),
      mp: clamp(live.mp, 0, m.stats.maxMp),
      overdrive: { ...m.overdrive, gauge: clamp(live.overdrive?.gauge ?? m.overdrive.gauge, 0, 100) },
    };
  });

  const aeons = build.aeons.map((a) => {
    const live = state.combatants[a.id] as FFXCombatant | undefined;
    if (!live) return a;
    return {
      ...a,
      hp: clamp(live.hp, 0, a.stats.maxHp),
      mp: clamp(live.mp, 0, a.stats.maxMp),
      overdriveGauge: clamp(live.overdrive?.gauge ?? a.overdriveGauge, 0, 100),
    };
  });

  return {
    ...build,
    members,
    aeons,
    inventory: carryInventory(build.inventory, state),
  };
}

function carryFfx2(build: FFX2PartyBuild, state: BattleState): FFX2PartyBuild {
  const members = build.members.map((m) => {
    const live = state.combatants[m.id];
    if (!live) return m;
    return { ...m, hp: Math.max(0, live.hp), mp: Math.max(0, live.mp) };
  }) as FFX2PartyBuild['members'];
  return { ...build, members, inventory: carryInventory(build.inventory, state) };
}

/**
 * Item counts survive a chain. The engine records spends in
 * `state.flags['inventory:<itemId>']` when it tracks them; otherwise the
 * build's own counts pass through untouched.
 */
function carryInventory(inventory: InventoryEntry[], state: BattleState): InventoryEntry[] {
  return inventory.map((entry) => {
    const spent = state.flags[`inventory:${entry.itemId}`];
    if (typeof spent !== 'number') return entry;
    return { ...entry, count: clamp(spent, 0, 99) };
  });
}

/** Which combatants a chained link should keep on the field. */
export function carriesForward(c: AnyCombatant): boolean {
  return c.flags.carriesStateForward === true;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
