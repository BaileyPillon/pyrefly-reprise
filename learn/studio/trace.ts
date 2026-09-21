/**
 * Pyrefly Studio (site B): one turn of the real FFX battle engine, taken
 * apart into the eight systems `rules.ts` documents
 * (`docs/plans/learning-sites.md` "B · studio/"). Ported from the mockup
 * round's `docs/concepts/atlas/b-battle-studio/engine-probe.mjs`, which
 * verified this exact scenario against `engine-probe.json` — this module
 * runs the same calls under strict TypeScript instead of re-deriving them.
 *
 * Every number below is read from `engine.state()` or from a `BattleEvent`
 * the engine itself emitted, or from the engine's own preview helpers
 * (`estimateCommand`, `previewHitChance`, `previewCritChance`,
 * `engine.intent()`) — never computed by this file's own arithmetic
 * (AGENTS.md hard rule 3). FFX only: chapter 1 (Mt. Gagazet, Seymour Flux),
 * the CTB engine in `src/battle/ffx/**`.
 */

import type {
  Affinity,
  BattleEvent,
  BattleState,
  Command,
  Decision,
  ElementId,
  FFXCombatant,
  FFXPartyBuild,
  StatusId,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine, type FFXEngine } from '../../src/battle/ffx/index.ts';
import { estimateCommand } from '../../src/battle/ffx/estimate.ts';
import { previewCritChance, previewHitChance } from '../../src/battle/ffx/simulate.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS, gagazetBuild } from '../../src/data/ffx/index.ts';
import { STUDIO_COMPONENTS, type StudioComponentId } from './rules.ts';

/** One row of a CTB forecast, named for display (`TurnPreview` plus the combatant's display name). */
export interface TurnOrderEntry {
  readonly actorId: string;
  readonly name: string;
  readonly tick: number;
  readonly isParty: boolean;
}

interface StepBase<C extends StudioComponentId> {
  readonly component: C;
  readonly cite: string;
}

export interface TurnOrderStep extends StepBase<'turn'> {
  readonly before: readonly TurnOrderEntry[];
  readonly after: readonly TurnOrderEntry[];
}

export interface CommandStep extends StepBase<'command'> {
  readonly label: string;
  readonly category: string;
  readonly rank: number;
  readonly mpCost: number;
}

export interface HitRollStep extends StepBase<'hit'> {
  readonly hitPercent: number | null;
  readonly critPercent: number;
  readonly canMiss: boolean;
  readonly crit: boolean;
}

export interface DamageStep extends StepBase<'damage'> {
  readonly amount: number;
  readonly min: number;
  readonly max: number;
  readonly targetHpBefore: number;
  readonly targetHpAfter: number;
}

export interface ElementStep extends StepBase<'element'> {
  readonly elements: readonly ElementId[];
  readonly affinity: Affinity;
}

export interface StatusApplicationReading {
  readonly status: StatusId;
  readonly percent: number;
  readonly blocked: boolean;
}

export interface StatusStep extends StepBase<'status'> {
  readonly applications: readonly StatusApplicationReading[];
}

export interface OverdriveStep extends StepBase<'overdrive'> {
  readonly before: number;
  readonly after: number;
  readonly mode: string;
}

export interface BossMoveStep extends StepBase<'boss'> {
  readonly enemyId: string;
  readonly enemyName: string;
  readonly moveName: string;
  readonly turnsAway: number;
  readonly confidence: string;
  readonly description: string;
}

/** The eight steps, always in this order (matches `STUDIO_COMPONENTS`). */
export type TurnStep =
  | TurnOrderStep
  | CommandStep
  | HitRollStep
  | DamageStep
  | ElementStep
  | StatusStep
  | OverdriveStep
  | BossMoveStep;

/** One real turn, taken apart. `steps` always has exactly eight entries, in `STUDIO_COMPONENTS` order. */
export interface TurnTrace {
  readonly game: 'ffx';
  readonly seed: number;
  /** Tidus's Agility override for this run, when the caller supplied one (the "Turn order" card's live slider). */
  readonly agility?: number;
  readonly actorId: string;
  readonly actorName: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly commandLabel: string;
  readonly steps: readonly TurnStep[];
}

export interface RunExampleTurnOptions {
  readonly seed: number;
  /** Overrides Tidus's Agility for this run; omit for the chapter's authored build. */
  readonly agility?: number;
}

const CHAPTER_ENEMY_GROUP_ID = 'seymour-flux';

function citeFor(component: StudioComponentId): string {
  const found = STUDIO_COMPONENTS.find((c) => c.id === component);
  if (!found) throw new Error(`trace: unknown component "${component}"`);
  return found.cite;
}

function content(): FFXContentRegistry {
  const registry = new FFXContentRegistry();
  registry.addAbilities(ALL_ABILITIES);
  registry.addItems(Object.values(ITEMS));
  return registry;
}

/** Chapter 1's party build, with Tidus's Agility overridden when the caller asks for it. Never mutates `gagazetBuild`. */
function buildParty(agility?: number): FFXPartyBuild {
  const party = structuredClone(gagazetBuild);
  if (agility !== undefined) {
    const tidus = party.members.find((m) => m.id === 'tidus');
    if (!tidus) throw new Error('trace: chapter 1 build has no "tidus" member');
    tidus.stats.agi = agility;
  }
  return party;
}

function requireCombatant(state: BattleState, id: string): FFXCombatant {
  const combatant = state.combatants[id];
  if (!combatant) throw new Error(`trace: no combatant "${id}" on the board`);
  return combatant as FFXCombatant;
}

/** Advances past every engine-resolved step until a player must choose, or throws. Mirrors `engine-probe.mjs`'s `openTurn` loop. */
function firstPlayerDecision(engine: FFXEngine): Extract<Decision, { kind: 'player-input' }> {
  let decision = engine.nextDecision();
  let guard = 0;
  while (decision.kind === 'resolved' && guard < 40) {
    guard += 1;
    decision = engine.nextDecision();
  }
  if (decision.kind !== 'player-input') {
    throw new Error(`trace: no player turn opened within ${guard} resolved steps`);
  }
  return decision;
}

/** `predictTurnOrder`, named for display. */
function turnOrderEntries(engine: FFXEngine, n: number, previewCommand?: Command): readonly TurnOrderEntry[] {
  const state = engine.state();
  return engine.predictTurnOrder(n, previewCommand).map((row) => ({
    actorId: row.actorId,
    name: state.combatants[row.actorId]?.name ?? row.actorId,
    tick: row.tickValue,
    isParty: row.isParty,
  }));
}

/**
 * Runs the chapter-1 Seymour Flux encounter to the first player turn and has
 * that actor Attack the boss, returning the real engine's own numbers for
 * every one of the eight systems `rules.ts` documents.
 *
 * `seed` picks the encounter's RNG stream (seed 1 is the mockup round's
 * verified "Tidus uses Attack on Seymour Flux" scenario, matching
 * `engine-probe.json`). `agility` overrides Tidus's stat block before the
 * battle starts — the same override `engine-probe.mjs`'s Agility sweep used
 * — and, at a low enough value, changes who acts first: the trace still
 * describes whoever's turn actually opens, because that is the honest read
 * of "what does the engine do with this Agility", not a fixed narrative.
 */
export function runExampleTurn(options: RunExampleTurnOptions): TurnTrace {
  const { seed, agility } = options;
  const enemies = ENEMY_GROUPS_BY_ID[CHAPTER_ENEMY_GROUP_ID];
  if (!enemies) throw new Error(`trace: enemy group "${CHAPTER_ENEMY_GROUP_ID}" is not registered`);

  const registry = content();
  const engine = createFFXEngine({ content: registry, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: buildParty(agility),
    enemies,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });

  const decision = firstPlayerDecision(engine);
  const actorId = decision.actorId;
  const stateBefore = engine.state();
  const actorBefore = requireCombatant(stateBefore, actorId);

  const attackRow = decision.commands.find((row) => row.command.kind === 'attack');
  if (!attackRow) throw new Error(`trace: "${actorId}" has no Attack command available`);
  const targetId = attackRow.validTargets[0];
  if (!targetId) throw new Error('trace: Attack has no legal target');

  const attackDef = registry.ability('attack');
  if (!attackDef) throw new Error('trace: "attack" is not registered');

  const command: Command = { kind: 'attack', targets: [targetId] };
  const beforeOrder = turnOrderEntries(engine, 10);
  const estimate = estimateCommand(stateBefore, actorId, command, attackDef, registry);
  const targetEstimate = estimate?.perTarget.find((t) => t.targetId === targetId) ?? null;
  const hitPercent = previewHitChance(stateBefore, actorId, targetId, attackDef);
  const critPercent = previewCritChance(stateBefore, actorId, targetId, attackDef);
  const overdriveBefore = actorBefore.overdrive?.gauge ?? 0;
  const targetHpBefore = requireCombatant(stateBefore, targetId).hp;
  const bossIntent = engine.intent();
  if (!bossIntent) throw new Error('trace: no enemy intent available before the turn');

  const events = engine.submit(command);
  const stateAfter = engine.state();
  const actorAfter = requireCombatant(stateAfter, actorId);
  const targetAfter = requireCombatant(stateAfter, targetId);
  const damageEvent = events.find(
    (e): e is Extract<BattleEvent, { type: 'damage' }> => e.type === 'damage' && e.targetId === targetId,
  );
  if (!damageEvent) throw new Error('trace: Attack produced no damage event on the target');
  const afterOrder = turnOrderEntries(engine, 8);

  const steps: readonly TurnStep[] = [
    { component: 'turn', cite: citeFor('turn'), before: beforeOrder, after: afterOrder },
    {
      component: 'command',
      cite: citeFor('command'),
      label: attackRow.label,
      category: attackRow.category,
      rank: attackRow.rank ?? 3,
      mpCost: attackRow.mpCost,
    },
    {
      component: 'hit',
      cite: citeFor('hit'),
      hitPercent,
      critPercent,
      canMiss: attackDef.canMiss !== false,
      crit: damageEvent.crit,
    },
    {
      component: 'damage',
      cite: citeFor('damage'),
      amount: damageEvent.amount,
      min: targetEstimate?.min ?? damageEvent.amount,
      max: targetEstimate?.max ?? damageEvent.amount,
      targetHpBefore,
      targetHpAfter: targetAfter.hp,
    },
    {
      component: 'element',
      cite: citeFor('element'),
      elements: [...attackDef.element],
      affinity: damageEvent.affinity ?? 'normal',
    },
    {
      component: 'status',
      cite: citeFor('status'),
      applications: attackDef.statusEffects.map((app) => {
        const odds = targetEstimate?.statuses.find((s) => s.status === app.status);
        return { status: app.status, percent: odds?.percent ?? 0, blocked: odds?.blocked ?? false };
      }),
    },
    {
      component: 'overdrive',
      cite: citeFor('overdrive'),
      before: overdriveBefore,
      after: actorAfter.overdrive?.gauge ?? overdriveBefore,
      mode: actorAfter.overdrive?.mode ?? 'stoic',
    },
    {
      component: 'boss',
      cite: bossIntent.cite,
      enemyId: bossIntent.enemyId,
      enemyName: bossIntent.enemyName,
      moveName: bossIntent.moveName,
      turnsAway: bossIntent.turnsAway,
      confidence: bossIntent.confidence,
      description: bossIntent.description,
    },
  ];

  return {
    game: 'ffx',
    seed,
    ...(agility !== undefined ? { agility } : {}),
    actorId,
    actorName: actorBefore.name,
    targetId,
    targetName: targetAfter.name,
    commandLabel: attackRow.label,
    steps,
  };
}
