/**
 * The one real turn the frame shows, run on the game's own battle engine.
 *
 * The approved frames caption the picture "Tidus attacks for 954. That number
 * comes from the game's own battle engine, run with seed 1"
 * (`docs/concepts/atlas/c-scene-exploded/c1-assembled.html`). This module is
 * what makes that sentence true on the page: it opens Chapter II, Lady
 * Yunalesca (Zanarkand Dome), with seed 1, takes the first player turn,
 * attacks the boss, and reports what the engine emitted. Nothing here
 * computes a battle number itself (AGENTS.md hard rule 3) — every value is
 * read from `engine.state()`, from `engine.predictTurnOrder`, or off a
 * `BattleEvent` the engine produced.
 *
 * FFX only (AGENTS.md hard rule 14): this is the CTB engine in
 * `src/battle/ffx/**`, and a turn list is an FFX idea — FFX-2 has per-character
 * gauges and no turn list (`research/ffx2-combat-core.md`), which is why the
 * other four chapters are offered switched off rather than faked.
 *
 * The pattern is site B's `learn/studio/trace.ts`, kept to deliberately: one
 * engine-driving module per site, so the shared explorer never learns about
 * battles.
 */

import type { BattleEvent, BattleState, Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { statusWord } from '../../src/battle/ffx/intent.ts';
import type { FFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { zanarkandBuild } from '../../src/data/ffx/builds/zanarkand.ts';
import { yunalescaGroup } from '../../src/data/ffx/enemies/yunalesca.ts';

/** One row of the HUD's party status list, as the engine has it at the moment of the turn. */
export interface PartyRow {
  readonly id: string;
  readonly name: string;
  readonly hp: number;
  readonly maxHp: number;
  readonly mp: number;
  /** Overdrive gauge, 0-100. */
  readonly overdrive: number;
  /** True for the member whose turn it is. */
  readonly acting: boolean;
}

/** One tile of the HUD's turn list (FFX's CTB forecast). */
export interface OrderRow {
  readonly actorId: string;
  readonly name: string;
  readonly isParty: boolean;
}

/** One chip on the "battle engine" rail: an event the engine really emitted, named as it names itself. */
export interface EventChip {
  readonly lead: string;
  readonly rest: string;
}

/** Everything the frame draws from the engine. */
export interface FrameRun {
  readonly seed: number;
  readonly actorId: string;
  readonly actorName: string;
  readonly commandLabel: string;
  readonly targetId: string;
  readonly targetName: string;
  /** HP the attack took off the boss. Straight off the engine's own `damage` event. */
  readonly damage: number;
  readonly crit: boolean;
  readonly party: readonly PartyRow[];
  readonly order: readonly OrderRow[];
  readonly chips: readonly EventChip[];
}

const SEED = 1;
/** How many turns of the CTB forecast the HUD's turn list shows (`c1`'s own six tiles). */
const ORDER_LENGTH = 6;

function content(): FFXContentRegistry {
  const registry = new FFXContentRegistry();
  registry.addAbilities(ALL_ABILITIES);
  registry.addItems(Object.values(ITEMS));
  return registry;
}

function combatant(state: BattleState, id: string): FFXCombatant {
  const found = state.combatants[id];
  if (!found) throw new Error(`engine-run.ts: no combatant "${id}" on the board`);
  return found as FFXCombatant;
}

/** Advances past every engine-resolved step until a player must choose. Mirrors `learn/studio/trace.ts`. */
function firstPlayerDecision(engine: FFXEngine): Extract<Decision, { kind: 'player-input' }> {
  let decision = engine.nextDecision();
  let guard = 0;
  while (decision.kind === 'resolved' && guard < 40) {
    guard += 1;
    decision = engine.nextDecision();
  }
  if (decision.kind !== 'player-input') {
    throw new Error(`engine-run.ts: no player turn opened within ${guard} resolved steps`);
  }
  return decision;
}

function partyRows(state: BattleState, actingId: string): PartyRow[] {
  return zanarkandBuild.activeSlots.map((id): PartyRow => {
    const member = combatant(state, id);
    return {
      id,
      name: member.name,
      hp: member.hp,
      maxHp: member.stats.maxHp,
      mp: member.mp,
      overdrive: Math.round(member.overdrive?.gauge ?? 0),
      acting: id === actingId,
    };
  });
}

function orderRows(engine: FFXEngine): OrderRow[] {
  const state = engine.state();
  return engine.predictTurnOrder(ORDER_LENGTH).map((row) => ({
    actorId: row.actorId,
    name: state.combatants[row.actorId]?.name ?? row.actorId,
    isParty: row.isParty,
  }));
}

/**
 * The events this turn produced, as the rail's chips. Only the four kinds the
 * approved frame's own rail shows are named, and each one is taken from the
 * event itself — an event that did not happen simply has no chip.
 */
function chipsFor(
  events: readonly BattleEvent[],
  state: BattleState,
  actorId: string,
  registry: FFXContentRegistry,
): EventChip[] {
  const nameOf = (id: string): string => state.combatants[id]?.name ?? id;
  const chips: EventChip[] = [];
  for (const event of events) {
    // Only the turn's own command opens a chip: the counter's `action-start` would
    // otherwise repeat the `counter` chip that already names the same ability.
    if (event.type === 'action-start' && event.actorId === actorId && event.abilityName !== undefined) {
      chips.push({ lead: nameOf(event.actorId), rest: event.abilityName });
    } else if (event.type === 'damage' && event.amount > 0) {
      chips.push({ lead: 'damage', rest: String(event.amount) });
    } else if (event.type === 'counter') {
      // The ability's own display name, as the registry has it — a rail is one line wide,
      // and `blind-counter` is the internal id, not what the game calls the move.
      chips.push({ lead: 'counter', rest: registry.ability(event.abilityId)?.name ?? event.abilityId });
    } else if (event.type === 'status-add') {
      chips.push({ lead: 'status-add', rest: `${statusWord(event.status)} · ${nameOf(event.targetId)}` });
    }
  }
  return chips;
}

/**
 * Opens Chapter II with seed 1 and has whoever acts first Attack the boss.
 * Throws rather than returning a plausible-looking blank: a frame built on a
 * number nobody produced would be exactly the invented data hard rule 6
 * forbids.
 */
export function runFrameTurn(): FrameRun {
  const registry = content();
  const engine = createFFXEngine({ content: registry, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: zanarkandBuild,
    enemies: yunalescaGroup,
    triggers: [],
    seed: SEED,
    condition: 'normal',
    canEscape: false,
  });

  const decision = firstPlayerDecision(engine);
  const actorId = decision.actorId;
  const stateBefore = engine.state();

  const attackRow = decision.commands.find((row) => row.command.kind === 'attack');
  if (!attackRow) throw new Error(`engine-run.ts: "${actorId}" has no Attack command available`);
  const targetId = attackRow.validTargets[0];
  if (!targetId) throw new Error('engine-run.ts: Attack has no legal target');

  const party = partyRows(stateBefore, actorId);
  const order = orderRows(engine);

  const command: Command = { kind: 'attack', targets: [targetId] };
  const events = engine.submit(command);
  const stateAfter = engine.state();
  const damageEvent = events.find(
    (event): event is Extract<BattleEvent, { type: 'damage' }> => event.type === 'damage' && event.targetId === targetId,
  );
  if (!damageEvent) throw new Error('engine-run.ts: Attack produced no damage event on the boss');

  return {
    seed: SEED,
    actorId,
    actorName: combatant(stateBefore, actorId).name,
    commandLabel: attackRow.label,
    targetId,
    targetName: combatant(stateBefore, targetId).name,
    damage: damageEvent.amount,
    crit: damageEvent.crit,
    party,
    order,
    chips: chipsFor(events, stateAfter, actorId, registry),
  };
}
