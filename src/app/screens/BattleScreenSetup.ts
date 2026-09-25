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
import { ENEMY_GROUPS_BY_ID as FFX_GROUPS } from '../../data/ffx/index.ts';
import { ENEMY_GROUPS_BY_ID as FFX2_GROUPS } from '../../data/ffx2/index.ts';
import { carryFfx2Full } from './BattleScreenCarry.ts';

/**
 * Find a formation by id. Used to follow a `nextGroupId` from one link of a
 * chained encounter to the next (Yunalesca's forms, the Vegnagun chain).
 *
 * Both data layers publish an id-keyed table now, so this is a lookup rather
 * than the module-scanning glob it started as.
 */
export async function findEnemyGroup(id: string): Promise<EnemyGroupDef | null> {
  return FFX_GROUPS[id] ?? FFX2_GROUPS[id] ?? null;
}

/**
 * How many party spots the FFX-2 scenes publish (`SceneBuild.partySlots`,
 * sliced to three in `bevelle-underground.ts` / `farplane.ts`).
 *
 * **FFX-2 party slot placement lives in two places and this is the seam.**
 * `src/battle/ffx2/setup.ts` numbers the girls `0, 1, 2` in `members` order and
 * `PaintedStage.add` looks that number up in the scene's own table — but it
 * *clamps* (`spots[Math.min(c.slot, spots.length - 1)]`), so a fourth member
 * would be parked silently on top of the third. Reordering `members` moves the
 * girls on screen; adding one stacks them. Neither is obvious from either end,
 * hence the check below.
 */
const FFX2_PARTY_SLOTS = 3;

/** The first setup for a chapter. */
export function setupForChapter(chapter: Chapter, seed: number): BattleSetup {
  const triggers: MidBattleTrigger[] = chapter.scriptsRef?.mid ?? [];
  if (chapter.buildRef.game === 'ffx2' && chapter.buildRef.members.length > FFX2_PARTY_SLOTS) {
    console.warn(
      `[battle] ${chapter.id}: ${chapter.buildRef.members.length} FFX-2 party members but only ` +
        `${FFX2_PARTY_SLOTS} scene slots — the extras will be staged on top of the last one.`,
    );
  }
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
    party: carryPartyForward(previous.party, state, nextGroup.carriesFullPartyState === true),
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
 *
 * `full` (FFX-2 only, `EnemyGroupDef.carriesFullPartyState`, Chapter XV's GP3 = a)
 * also carries each girl's statuses, worn dressphere and grid progress
 * (`./BattleScreenCarry.ts`). Without it the FFX-2 carry is HP, MP and items, as
 * every shipped chain has it; the FFX carry ignores the flag.
 */
export function carryPartyForward(
  build: FFXPartyBuild | FFX2PartyBuild,
  state: BattleState,
  full = false,
): FFXPartyBuild | FFX2PartyBuild {
  if (build.game === 'ffx') return carryFfx(build, state);
  const carried = carryFfx2(build, state);
  return full ? carryFfx2Full(carried, state) : carried;
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
