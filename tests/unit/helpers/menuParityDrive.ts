/**
 * Helpers for the FFX menu-draw parity tests (re-parity RC11; FFX only): an engine at a chapter's (or one link's) first decision, and the command rows the menu would be handed for any
 * party member, without playing a turn. `availableCommands` is a pure function of the context and the actor, which is all the menu reads.
 */

import type { AvailableCommand, EnemyGroupDef, FFXCombatant } from '../../../src/battle/common/types.ts';
import { FFXEngine } from '../../../src/battle/ffx/index.ts';
import { availableCommands } from '../../../src/battle/ffx/commands.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../../src/app/screens/BattleScreenSetup.ts';
import { getChapter } from '../../../src/data/encounters.ts';

export const ctxOf = (engine: FFXEngine): Ctx => (engine as unknown as { ctx: Ctx }).ctx;

/** An engine on the chapter's first link, or on `groupId` (a later link) with the chapter's own party. */
export async function engineFor(chapterId: string, groupId?: string, seed = 1): Promise<FFXEngine> {
  await registerBattleContent();
  const chapter = getChapter(chapterId);
  if (!chapter) throw new Error(`no chapter ${chapterId}`);
  const setup = setupForChapter(chapter, seed);
  if (groupId !== undefined) {
    const group: EnemyGroupDef | null = await findEnemyGroup(groupId);
    if (!group) throw new Error(`no group ${groupId}`);
    setup.enemies = group;
    setup.canEscape = group.canEscape ?? false;
  }
  const engine = new FFXEngine({ autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init(setup);
  return engine;
}

export const actor = (engine: FFXEngine, id: string): FFXCombatant => {
  const c = engine.state().combatants[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c as FFXCombatant;
};

/** The rows the menu is handed for this actor right now. */
export const menuOf = (engine: FFXEngine, id: string): AvailableCommand[] => availableCommands(ctxOf(engine), actor(engine, id));

/** A stable key for a row's command (its kind, id and any switch target), to compare two menus. */
export const keyOf = (r: AvailableCommand): string => {
  const c = r.command as { kind: string; id?: string; extra?: { inId?: string; mode?: string } };
  return `${c.kind}:${c.id ?? ''}:${c.extra?.inId ?? c.extra?.mode ?? ''}:${r.label}`;
};

/** The set of rows a player can actually pick: the legality of a menu. */
export const pickable = (rows: readonly AvailableCommand[]): string[] => rows.filter((r) => r.enabled).map(keyOf);

/** Active party member ids in battle order. */
export const partyOf = (engine: FFXEngine): string[] => [...ctxOf(engine).state.activeIds];
