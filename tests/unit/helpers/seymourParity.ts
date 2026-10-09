/**
 * Shared fixtures for the Seymour AI parity tests (`parity-ffx-ai-flux`, `-macalania`, `-natus`, `-omnis`):
 * a battle context built from the shipped data exactly as `FFXEngine.init` builds one, plus the small
 * drivers that make a script hook run the way the engine runs it. **FFX only.** Test-only.
 */

import type { AbilityDef, BattleEvent, Command, FFXCombatant, FFXPartyBuild, StatusInstance } from '../../../src/battle/common/types.ts';
import { SeededRng } from '../../../src/battle/common/rng.ts';
import { FFXContentRegistry, buildBattle, chooseAiCommand, resolveAbility } from '../../../src/battle/ffx/index.ts';
import type { Ctx } from '../../../src/battle/ffx/state.ts';
import { executeCommand } from '../../../src/battle/ffx/execute.ts';
import { drainScriptReactions } from '../../../src/battle/ffx/ai/reaction-drain.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { gagazetBuild } from '../../../src/data/ffx/builds/gagazet.ts';

export function liveContent(extra: readonly AbilityDef[] = []): FFXContentRegistry {
  const reg = new FFXContentRegistry();
  reg.addAbilities([...ALL_ABILITIES, ...extra]);
  reg.addItems(Object.values(ITEMS));
  return reg;
}

/** A live engine context for a shipped enemy group, built the way `FFXEngine.init` builds one. */
export function realCtx(
  groupId: string,
  seed = 1,
  party: FFXPartyBuild = gagazetBuild,
  extra: readonly AbilityDef[] = [],
  condition: 'normal' | 'scripted' = 'scripted',
): { ctx: Ctx; events: BattleEvent[] } {
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} missing from the data layer`);
  const events: BattleEvent[] = [];
  let seq = 0;
  let ref: Ctx | undefined;
  const ctx = buildBattle(
    { game: 'ffx', party, enemies: group, triggers: [], seed, condition, canEscape: false },
    new SeededRng(seed),
    liveContent(extra),
    (e) => {
      const full = { ...e, seq: seq++ } as BattleEvent;
      events.push(full);
      ref?.state.log.push(full);
    },
  );
  ref = ctx;
  ctx.state.log.push(...events); // whatever setup emitted
  return { ctx, events };
}

export function at(ctx: Ctx, id: string): FFXCombatant {
  const c = ctx.state.combatants[id];
  if (!c) throw new Error(`no combatant ${id}`);
  return c as FFXCombatant;
}

export function idOf(command: Command | null): string {
  if (command === null) return 'pass';
  if (command.kind === 'ability') return command.id;
  return command.kind;
}

export function status(id: StatusInstance['id']): StatusInstance {
  return { id, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** A probe that lands for an exact amount: type Other, `canMiss: false`, no variance, no mitigation. */
export function exactHit(id: string, amount: number, extra: Partial<AbilityDef> = {}): AbilityDef {
  return {
    id, name: id, game: 'ffx', category: 'skill', mpCost: 0, rank: 3, power: amount / 50,
    formula: 'fixed-no-variance', damageType: 'other', element: ['none'], targeting: 'single-enemy',
    hits: 1, statusEffects: [], removesStatuses: [], flags: ['always-break-damage-limit', 'ignores-armored'], canMiss: false,
    ...extra,
  };
}

/** Run one ability as `userId` against `targets` the way a turn does, then drain the reactions it queued. */
export function act(ctx: Ctx, userId: string, def: AbilityDef, targets: string[]): BattleEvent[] {
  const from = ctx.state.log.length;
  const user = at(ctx, userId);
  ctx.emit({ type: 'action-start', actorId: userId, command: { kind: 'ability', id: def.id, targets }, abilityId: def.id, abilityName: def.name, targets });
  resolveAbility(ctx, user, def, targets);
  ctx.emit({ type: 'action-end', actorId: userId });
  drainScriptReactions({ ctx, push: ctx.emit });
  return ctx.state.log.slice(from);
}

/** Choose an AI command and execute it as that enemy, then drain, like the engine's enemy turn. */
export function enemyTurn(ctx: Ctx, id: string): { command: Command | null; events: BattleEvent[] } {
  const from = ctx.state.log.length;
  const enemy = at(ctx, id);
  const command = chooseAiCommand(ctx, enemy);
  if (command) executeCommand(ctx, enemy, command, true);
  drainScriptReactions({ ctx, push: ctx.emit });
  return { command, events: ctx.state.log.slice(from) };
}

export function counters(events: readonly BattleEvent[], who?: string): string[] {
  return events
    .filter((e) => e.type === 'counter' && (who === undefined || e.actorId === who))
    .map((e) => (e as { abilityId: string }).abilityId);
}

/**
 * An RNG that returns the values it is given, in order (then the range's minimum), and records the range of every
 * call: the way a parity test feeds a script exactly the raw values it is asked about and counts the draws it spends.
 * `int(0, 0xffff)` is a `GetRandomValue()`, `int(0, 0x7fffffff)` a picker draw (`ai/script-random.ts`).
 */
export class ScriptedRng extends SeededRng {
  readonly calls: Array<[number, number]> = [];
  private readonly queue: number[];
  constructor(values: readonly number[]) {
    super(0);
    this.queue = [...values];
  }
  override int(min: number, max: number): number {
    this.calls.push([min, max]);
    const next = this.queue.shift();
    return next === undefined ? min : next;
  }
  override pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)] as T;
  }
  /** How many draws of each kind the script spent. */
  get spent(): { script: number; picker: number; other: number } {
    let script = 0;
    let picker = 0;
    let other = 0;
    for (const [lo, hi] of this.calls) {
      if (lo === 0 && hi === 0xffff) script += 1;
      else if (lo === 0 && hi === 0x7fffffff) picker += 1;
      else other += 1;
    }
    return { script, picker, other };
  }
}

/** Replace the context's RNG with a scripted one. */
export function withRng(ctx: Ctx, values: readonly number[]): ScriptedRng {
  const rng = new ScriptedRng(values);
  ctx.rng = rng;
  return rng;
}
