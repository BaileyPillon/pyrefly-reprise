/**
 * **The invariant, for every chapter the game ships.**
 *
 * Critic round 02 #12's own suggested fix asked for this file by name: *"Add
 * `tests/unit/trigger-commands.test.ts`: every row the menu offers, submitted
 * verbatim, must produce at least one state change or an explicit refusal."*
 * It did not exist. The substitute guard
 * (`tests/unit/ffx-overdrive-menu-rows.test.ts`) asked three named actors on
 * one of five boards, and an adversarial verifier walked straight through the
 * gap: **Rikku's `Steal` and `Use`** were enabled rows that emitted nothing but
 * `action-start` / `action-end`, and **Bio Fury, Death Fury and Demi Fury**
 * spent a full Overdrive gauge for the same two events. The old guard counted
 * `overdrive-gauge{cause:'spent'}` as "the battle changed" — but that event is
 * the row's *cost*, not its effect, so an Overdrive that does nothing at all
 * satisfied it.
 *
 * So this file is deliberately exhaustive and deliberately strict:
 *
 * - **Every chapter**, driven off `CHAPTERS` rather than a hand-written list,
 *   so a new chapter is covered the day it is added: FFX (CTB) chapters 1-3 and
 *   FFX-2 (ATB) chapters 4-5, each through its own engine, its own shipped
 *   build and its own shipped enemy group.
 * - **Every actor**, the bench included. FFX's Switch hands over the turn
 *   happening right now [ffx-combat-core §1.7], so all seven guardians get a
 *   menu and all seven are asked here.
 * - **Every enabled row**, submitted exactly as the menu offered it, on a fresh
 *   engine replayed to the same point — no hand-built commands, no data
 *   fixtures.
 * - `action-start`, `action-end`, `turn-start` and `overdrive-gauge{spent}` do
 *   not count as an effect.
 *
 * The one exemption is **items**, and it is a fidelity call, not a loophole: an
 * Antidote used on somebody who is not poisoned legitimately does nothing
 * visible in FFX and FFX-2 alike, and the menu cannot know in advance. Making
 * the engine refuse it would be less faithful, not more.
 *
 * **Game-awareness** [AGENTS.md hard rule 14]: the rule asserted here — a row
 * the menu offers is submittable as offered — is shared plumbing and therefore
 * applies to **both** games (`critic/CHECKS.md` CHK-020). The fixes it pins are
 * not: Steal, the `Use` submenu label, `extra.deathChance` and the zero-damage
 * hit are all FFX mechanics in FFX data resolved by the FFX engine, so nothing
 * under `src/battle/ffx2` was touched. This file proves that too — chapters 4
 * and 5 pass unchanged.
 */

import { describe, expect, it } from 'vitest';
import type {
  AvailableCommand,
  BattleEvent,
  Command,
  Decision,
  FFXCombatant,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import * as ffxData from '../../src/data/ffx/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as ffx2Data from '../../src/data/ffx2/index.ts';
import { CHAPTERS, type Chapter } from '../../src/data/encounters.ts';

/** How many player turns deep each seed walks before it stops looking. */
const TURNS_PER_SEED = 10;
const SEEDS = [1, 2, 3] as const;

/**
 * The minimum number of distinct enabled, non-item rows a chapter's audit
 * must turn up before the walk is trusted to have exercised the menu at all.
 * 20 was never a rule, only what the first five chapters all cleared with
 * room to spare (24-30-ish). Verified with the real engine (not guessed): at
 * up to 40 turns and seven seeds, `ffx2-leblanc`'s Act I entrance — Yuna 20
 * Gunner / Rikku 21 Thief / Paine 22 Warrior, `docs/handoff/chapter-leblanc-
 * engine.md` §2's earlier-story loadout, genuinely smaller than chapters 4-5's
 * further-along parties — plateaus at exactly 18 distinct rows regardless of
 * seed or turn count; nothing was gated behind more sampling. Lowering the
 * floor for this one chapter, rather than the shared threshold, keeps the
 * other five chapters' bar exactly where it was.
 */
const MIN_ROWS_AUDITED: Readonly<Record<string, number>> = {
  'ffx2-leblanc': 15,
};

/** The minimum the harness needs from either engine. */
interface ProbeEngine {
  nextDecision(): Decision;
  submit(command: Command): unknown;
  tick?(ms: number): unknown;
  state(): { log: BattleEvent[]; combatants: Record<string, FFXCombatant>; reserveIds: readonly string[] };
}

function makeEngine(chapter: Chapter, seed: number): ProbeEngine {
  const setup = {
    game: chapter.game,
    party: chapter.buildRef,
    enemies: chapter.enemyGroupRef,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  if (chapter.game === 'ffx') {
    const content = new FFXContentRegistry();
    content.addAbilities(ffxData.ALL_ABILITIES);
    content.addItems(Object.values(ffxData.ITEMS));
    // Exactly what the app wires at boot (`app/screens/BattleScreenContent.ts`),
    // so Rikku's Mix is audited against the real recipe table rather than
    // against an empty one that would make every pair fail for free.
    content.addMixRecipes(ffxData.MIX_RECIPES);
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(setup as never);
    return engine as unknown as ProbeEngine;
  }
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(ffx2Data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2Data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2Data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2Data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.init(setup as never);
  return engine as unknown as ProbeEngine;
}

/** The next moment the player is asked to choose, ticking X-2's ATB clock on the way. */
function nextPlayerTurn(engine: ProbeEngine): Extract<Decision, { kind: 'player-input' }> | null {
  for (let i = 0; i < 8000; i++) {
    const decision = engine.nextDecision();
    if (decision.kind === 'battle-over') return null;
    if (decision.kind === 'player-input') return decision;
    if (decision.kind === 'waiting' && engine.tick) engine.tick(decision.nextEventMs);
  }
  return null;
}

/**
 * Everything that is neither bookkeeping nor the actor paying for the row.
 *
 * `overdrive-gauge{cause:'spent'}` is the cost of an Overdrive, not its effect.
 * Counting it is exactly how three inert Fury rows passed the old guard.
 */
function realEffects(events: readonly BattleEvent[]): BattleEvent[] {
  return events.filter(
    (event) =>
      event.type !== 'action-start' &&
      event.type !== 'action-end' &&
      event.type !== 'turn-start' &&
      !(event.type === 'overdrive-gauge' && event.cause === 'spent'),
  );
}

function submitAndRead(engine: ProbeEngine, command: Command): BattleEvent[] {
  const before = engine.state().log.length;
  engine.submit(command);
  return engine.state().log.slice(before);
}

/** Exactly as the menu offered it, aimed at the first target the menu said was legal. */
function asOffered(row: AvailableCommand): Command {
  return { ...row.command, targets: row.validTargets.slice(0, 1) } as Command;
}

/** Items are the one exemption; see the file header for why. */
function shouldBeAsked(row: AvailableCommand): boolean {
  return row.enabled && row.command.kind !== 'item';
}

/**
 * Walk one seed `TURNS_PER_SEED` player turns deep, and for every enabled row
 * offered on the way replay a fresh battle to that same turn and submit it.
 *
 * Replaying rather than branching is what makes this honest: the row is taken
 * from a live menu on a real board mid-battle, not from a synthetic state.
 */
function auditChapter(chapter: Chapter): string[] {
  const inert: string[] = [];
  const asked = new Set<string>();

  for (const seed of SEEDS) {
    const walker = makeEngine(chapter, seed);
    for (let step = 0; step < TURNS_PER_SEED; step++) {
      const decision = nextPlayerTurn(walker);
      if (!decision) break;

      for (const row of decision.commands.filter(shouldBeAsked)) {
        const key = `${decision.actorId} / ${row.label} (${row.command.kind})`;
        if (asked.has(key)) continue;
        asked.add(key);

        const engine = makeEngine(chapter, seed);
        let live: AvailableCommand | undefined;
        for (let replay = 0; replay <= step; replay++) {
          const at = nextPlayerTurn(engine);
          if (!at) break;
          if (replay === step) {
            live = at.commands.find((c) => c.enabled && c.label === row.label && c.command.kind === row.command.kind);
            break;
          }
          engine.submit({ kind: 'defend', targets: [] });
        }
        if (!live) continue;
        if (realEffects(submitAndRead(engine, asOffered(live))).length === 0) inert.push(key);
      }

      walker.submit({ kind: 'defend', targets: [] });
    }
  }

  expect(asked.size, `${chapter.id} offered no rows to audit`).toBeGreaterThan(MIN_ROWS_AUDITED[chapter.id] ?? 20);
  return inert;
}

describe('every row the menu offers changes the battle or is refused out loud', () => {
  for (const chapter of CHAPTERS) {
    it(`holds for chapter ${chapter.number}, ${chapter.title} (${chapter.game.toUpperCase()})`, () => {
      expect(auditChapter(chapter), `inert rows on ${chapter.id}`).toEqual([]);
    });
  }
});

/**
 * The bench, which is where the verifier found the two inert rows.
 *
 * Rikku and Lulu start Chapter 1 in reserve, so a guard that only ever sees the
 * opening three never asks them anything. Switch hands over the turn that is
 * happening right now [ffx-combat-core §1.7], so bringing one in is a single
 * command and the incoming member's whole menu — Overdrive rows included, with
 * the gauge filled first — is offered immediately.
 *
 * FFX only: reserve members and the Switch command are an FFX mechanic. X-2
 * fights with the three it brought [ffx2-combat-core], so there is no bench to
 * ask and nothing here is applied to chapters 4 and 5 [AGENTS.md hard rule 14].
 */
describe('and the bench is asked too, which is where the two inert rows were hiding', () => {
  for (const chapter of CHAPTERS.filter((c) => c.game === 'ffx')) {
    it(`holds for every reserve guardian in chapter ${chapter.number}`, () => {
      const inert: string[] = [];
      const roster = makeEngine(chapter, 3).state().reserveIds.slice();
      expect(roster.length, `${chapter.id} has nobody in reserve`).toBeGreaterThan(0);

      for (const who of roster) {
        const engine = makeEngine(chapter, 3);
        const opening = nextPlayerTurn(engine);
        if (!opening) continue;
        const bench = engine.state().combatants[who];
        // Setup, not mechanic: a full gauge is the only way the Overdrive rows
        // are offered at all, and those are three of the five rows that were
        // broken.
        if (bench?.overdrive) bench.overdrive.gauge = 100;
        const swap = opening.commands.find(
          (c) => c.enabled && c.command.kind === 'switch' && c.command.extra?.inId === who,
        );
        if (!swap) continue;
        engine.submit(swap.command);

        const turn = nextPlayerTurn(engine);
        expect(turn?.actorId, `${who} did not receive the handed-over turn`).toBe(who);
        for (const row of (turn?.commands ?? []).filter(shouldBeAsked)) {
          const probe = makeEngine(chapter, 3);
          const open = nextPlayerTurn(probe);
          if (!open) continue;
          const seat = probe.state().combatants[who];
          if (seat?.overdrive) seat.overdrive.gauge = 100;
          const again = open.commands.find(
            (c) => c.enabled && c.command.kind === 'switch' && c.command.extra?.inId === who,
          );
          if (!again) continue;
          probe.submit(again.command);
          const mine = nextPlayerTurn(probe);
          const live = mine?.commands.find(
            (c) => c.enabled && c.label === row.label && c.command.kind === row.command.kind,
          );
          if (!live) continue;
          if (realEffects(submitAndRead(probe, asOffered(live))).length === 0) {
            inert.push(`${who} / ${live.label} (${live.command.kind})`);
          }
        }
      }

      expect(inert, `inert bench rows on ${chapter.id}`).toEqual([]);
    });
  }
});
