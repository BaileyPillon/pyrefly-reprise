/**
 * **The card never spends an item an ally has already committed** — critic
 * round 09, PR-0088.
 *
 * The defect, as the critic recorded it on candidate e119552 (Chapter 6, Act
 * III, seed 1, Wait): the card told Yuna "Eye Drops → Paine", Yuna's Eye Drops
 * started charging, Rikku's menu opened, and the card told her the same Eye
 * Drops on the same Paine. One darkness came off; the second item did nothing.
 * Two turns later Paine and then Yuna were both told "Phoenix Down → Rikku",
 * and the second resolved as `miss` `'wrong-state'` on a Rikku already up
 * [critic/rounds/round-09.json PR-0088; battle-log seq 868/871/906 and
 * 1282/1286/1303].
 *
 * The rule this file pins: **a command that is already charging is spent.**
 * The card prices the board the ally's queued command leaves behind: a cure
 * for a status that command already takes off, or a raise for somebody that
 * command already stands up, is not the pick; and the item stock the card
 * counts on is the stock left once every queued item has been used
 * (`src/engine/tactics/advisor-committed.ts`).
 *
 * ## Which game
 *
 * **FFX-2 only** [AGENTS.md rule 14]. Only FFX-2's ATB lets a second girl
 * choose while the first one's command is still on its purple charge bar
 * [research/ffx2-combat-core.md §1.1, §1.3]. FFX is CTB: one actor at a time,
 * and a chosen command resolves before the next turn opens
 * [research/ffx-combat-core.md §1.1], so there is never a committed command
 * on the board when a menu is open and the rule is a no-op there. The FFX
 * half below asserts exactly that, rather than assuming it.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEvent,
  BattleSetup,
  BattleState,
  Command,
  CombatantId,
  EnemyGroupDef,
} from '../../src/battle/common/types.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import type { HeldCommand } from '../../src/battle/ffx2/active.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { simulateFFX2Command } from '../../src/battle/ffx2/simulate.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { buildAdvisorView, clearAdvisorCache, type AdvisorOptions } from '../../src/engine/tactics/advisor.ts';
import { committedByAllies } from '../../src/engine/tactics/advisor-committed.ts';

const abilities = abilityRegistryFrom(Object.values(ffx2data.ABILITIES));
const items = itemRegistryFrom(Object.values(ffx2data.ITEMS));
const OPTIONS: AdvisorOptions = { ffx2: { abilities, items } };
const MAX_DECISIONS = 6_000;

function engineFor(): FFX2Engine {
  // The engine default is Wait (D-029), the mode the critic played.
  return new FFX2Engine({
    abilities,
    items,
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
}

function fallback(commands: readonly AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.command.kind === 'attack') ?? commands.find((c) => c.enabled);
  const t = r?.validTargets[0];
  return r ? ({ ...r.command, targets: t ? [t] : [] } as Command) : null;
}

/**
 * What the other girls' charging commands will do, read by **simulating them
 * on this board** — written independently of the module under test, so the
 * assertion is the engine's word and not the advisor's.
 */
function coverOf(state: Readonly<BattleState>, actorId: CombatantId, held: HeldCommand | null) {
  const cures = new Set<string>();
  const revives = new Set<CombatantId>();
  const uses = new Map<string, number>();
  const pending: HeldCommand[] = held ? [held] : [];
  for (const id of state.activeIds) {
    const c = state.combatants[id] as { atb?: { charging?: { commandRef: Command } | null } } | undefined;
    const queued = c?.atb?.charging?.commandRef;
    if (queued) pending.push({ actorId: id, command: queued });
  }
  for (const { actorId: id, command: queued } of pending) {
    if (id === actorId) continue;
    if (queued.kind === 'item') uses.set(String(queued.id), (uses.get(String(queued.id)) ?? 0) + 1);
    const out = simulateFFX2Command(state, id, queued, { roll: 'mid', abilities, items });
    for (const ch of out?.statusChanges ?? []) if (!ch.applied) cures.add(`${ch.targetId}:${ch.status}`);
    for (const r of out?.revives ?? []) revives.add(r);
  }
  return { cures, revives, uses };
}

/** A pick that only repeats what an ally's charging command already does, or spends stock that is already spoken for. */
function doubleSpend(
  state: Readonly<BattleState>,
  actorId: CombatantId,
  command: Command,
  held: HeldCommand | null,
): string | null {
  const cover = coverOf(state, actorId, held);
  if (command.kind === 'item') {
    const stock = state.flags[`inventory:${command.id}`];
    const used = cover.uses.get(String(command.id)) ?? 0;
    if (typeof stock === 'number' && used > 0 && stock - used <= 0) return `last ${command.id} already committed`;
  }
  const out = simulateFFX2Command(state, actorId, command, { roll: 'mid', abilities, items });
  if (!out) return null;
  const cures = out.statusChanges.filter((c) => !c.applied && state.combatants[c.targetId]?.side !== 'enemy');
  if (cures.length === 0 && out.revives.length === 0) return null;
  if (out.damageToEnemies > 0 || out.statusChanges.some((c) => c.applied)) return null;
  const allCovered =
    cures.every((c) => cover.cures.has(`${c.targetId}:${c.status}`)) &&
    out.revives.every((r) => cover.revives.has(r));
  return allCovered ? `repeats a committed ${'id' in command ? String(command.id) : command.kind}` : null;
}

interface Run {
  outcome: string;
  decisions: number;
  doubles: string[];
  wrongState: number;
}

/**
 * The whole three-act mission, driven the way the critic played it: open a
 * menu, press the card's top row, repeat. Links chain exactly as the chapter
 * screen chains them (`setupForNextLink`).
 */
function cardFollower(seed: number): Run {
  const engine = engineFor();
  const first = ffx2data.ENEMY_GROUPS_BY_ID[LEBLANC_CHAIN_ORDER[0]!];
  if (!first) throw new Error('the Leblanc chain is missing');
  let setup: BattleSetup = {
    game: 'ffx2',
    party: chateauBuild,
    enemies: first,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);
  clearAdvisorCache();

  let group: EnemyGroupDef = first;
  let links = 0;
  let decisions = 0;
  let outcome = 'unresolved';
  const doubles: string[] = [];
  let wrongState = 0;
  for (;;) {
    let linkOutcome = 'unresolved';
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        linkOutcome = d.result.outcome;
        break;
      }
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      decisions += 1;
      const state = engine.state();
      const held = engine.heldCommand();
      const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, {
        ...OPTIONS,
        queued: () => (held ? [held] : []),
      });
      const pick = view?.suggestions[0]?.command ?? fallback(d.commands);
      if (!pick) break;
      const why = doubleSpend(state, d.actorId, pick, held);
      if (why) doubles.push(`link ${links} decision ${decisions} ${d.actorId}: ${why}`);
      engine.submit(pick);
    }
    const party = new Set(engine.state().activeIds);
    wrongState += engine
      .state()
      .log.filter(
        (e: BattleEvent) => e.type === 'miss' && e.reason === 'wrong-state' && party.has(e.sourceId ?? ''),
      ).length;
    links += 1;
    outcome = linkOutcome;
    if (linkOutcome !== 'victory') break;
    const nextId = group.nextGroupId;
    if (!nextId) break;
    const next = ffx2data.ENEMY_GROUPS_BY_ID[nextId];
    if (!next) throw new Error(`chain points at "${nextId}" with no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + links) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }
  return { outcome, decisions, doubles, wrongState };
}

const SEEDS = [1, 2, 3, 4, 5, 6] as const;

describe('PR-0088: Chapter 6, card-follower, Wait — FFX-2', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: the card never repeats a cure or raise an ally's charging command already covers`, () => {
      const run = cardFollower(seed);
      expect(run.doubles, run.doubles.slice(0, 5).join('\n')).toEqual([]);
      expect(run.wrongState).toBe(0);
    }, 120_000);
  }
});

/**
 * **The held command counts too** (PR-0076's chain-locked hold,
 * `FFX2Engine.heldCommand()`). It is not on `BattleState`, so the caller
 * passes it as `AdvisorOptions.queued`. Every board below is a real Chapter 6
 * board the card-follower reaches; on each one whose top row is a cure or a
 * raise, the same command is handed to another standing girl as held, and the
 * card is asked again.
 */
describe('PR-0088: a held command is committed as well — FFX-2', () => {
  it('Chapter 6, seeds 1-8: the card never repeats a held cure or raise, and says the raise is coming', () => {
    let exercised = 0;
    let told = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const engine = engineFor();
      const first = ffx2data.ENEMY_GROUPS_BY_ID[LEBLANC_CHAIN_ORDER[0]!]!;
      let setup: BattleSetup = {
        game: 'ffx2', party: chateauBuild, enemies: first, triggers: [], seed, condition: 'normal', canEscape: false,
      };
      engine.setSeed(seed);
      engine.init(setup);
      clearAdvisorCache();
      let group: EnemyGroupDef = first;
      for (let links = 0; ; links++) {
        let outcome = 'unresolved';
        for (let i = 0; i < MAX_DECISIONS; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
          if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
          if (d.kind !== 'player-input') continue;
          const state = engine.state();
          const decision = { actorId: d.actorId, commands: d.commands };
          const view = buildAdvisorView(state, decision, OPTIONS);
          const top = view?.suggestions[0]?.command ?? fallback(d.commands);
          if (!top) break;
          const out = simulateFFX2Command(state, d.actorId, top, { roll: 'mid', abilities, items });
          const cures = (out?.statusChanges ?? []).some((c) => !c.applied && state.combatants[c.targetId]?.side !== 'enemy');
          const other = state.activeIds.find((id) => id !== d.actorId && state.combatants[id]?.alive);
          if (other && out && (cures || out.revives.length > 0) && !doubleSpend(state, d.actorId, top, null)) {
            const held: HeldCommand = { actorId: other, command: top };
            const again = buildAdvisorView(state, decision, { ...OPTIONS, queued: () => [held] });
            for (const s of again?.suggestions ?? []) {
              expect(doubleSpend(state, d.actorId, s.command, held), `seed ${seed} ${d.actorId} ${JSON.stringify(s.command)}`).toBeNull();
            }
            exercised += 1;
            const raised = out.revives[0];
            const downed = state.activeIds.filter((id) => state.combatants[id]?.alive === false);
            if (raised && downed.length === 1 && !(again?.suggestions ?? []).some((s) => s.command.kind === 'item' && String(s.command.id).includes('phoenix'))) {
              expect(again?.note).toContain('already on its way to');
              told += 1;
            }
          }
          engine.submit(top);
        }
        if (outcome !== 'victory' || !group.nextGroupId) break;
        const next = ffx2data.ENEMY_GROUPS_BY_ID[group.nextGroupId]!;
        setup = setupForNextLink(setup, next, engine.state(), seed + links + 1) as BattleSetup;
        group = next;
        engine.setSeed(setup.seed);
        engine.init(setup);
      }
    }
    expect(exercised, 'the walk must reach boards with a cure or raise on top').toBeGreaterThan(5);
    expect(told, 'and at least one with a single body on the floor').toBeGreaterThan(0);
  }, 180_000);
});

describe('committedByAllies reads the charging bar, and only in FFX-2', () => {
  it('FFX: CTB has one actor at a time, so no board ever carries a committed command (no-op)', () => {
    const content = new FFXContentRegistry();
    content.addAbilities(ALL_ABILITIES);
    content.addItems(Object.values(ITEMS));
    for (const chapter of CHAPTERS.filter((c) => c.game === 'ffx')) {
      const group = ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id];
      if (!group) throw new Error(`${chapter.id} group missing`);
      const engine = createFFXEngine({ content, autoResolveMinigames: true });
      engine.setSeed(1);
      engine.init({
        game: 'ffx',
        party: chapter.buildRef,
        enemies: group,
        triggers: [],
        seed: 1,
        condition: 'normal',
        canEscape: false,
      } as never);
      let seen = 0;
      for (let i = 0; i < 400; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const state = engine.state();
        expect(committedByAllies(state, d.actorId, OPTIONS)).toEqual({ uses: new Map(), cures: new Set(), revives: new Map() });
        seen += 1;
        const row = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
        if (!row) break;
        const t = row.validTargets[0];
        engine.submit({ ...row.command, targets: t ? [t] : [] } as Command);
      }
      expect(seen, chapter.id).toBeGreaterThan(0);
    }
  }, 60_000);
});
