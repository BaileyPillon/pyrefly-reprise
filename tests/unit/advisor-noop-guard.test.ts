/**
 * **The advisor never spends a turn on nothing** — critic round 06, PR-0006.
 *
 * The defect, as the critic measured it on the live build: over one guided
 * keyboard route of Chapter 4 the card printed the identical row on all 301
 * samples — "Shell → the party · GUIDE'S PICK · IN WHITE MAGIC · 10 MP" —
 * while the engine log shows Yuna casting Shell on all thirteen of her turns
 * and exactly one Shell ever landing (seq 19-21, engine turn 2). The guided
 * route dealt 4,489 of Bahamut's 8,400 HP in nine minutes five seconds and
 * never resolved; the route that ignored the advisor resolved in 2:22
 * [critic/rounds/round-06.json PR-0006, RUBRIC §2, CHK-005].
 *
 * The rule this file pins, in one line: **a recommendation whose simulated
 * resolution changes nothing measurable on this board is not the pick.** A
 * buff already on everyone, a cure with nothing to cure, a Break this boss is
 * immune to — the chapter's own line included, because the chapter line keeps
 * priority only when it does something.
 *
 * ## Which game
 *
 * **Both** [AGENTS.md rule 14; `critic/CHECKS.md` CHK-020]. This is shared
 * advisor plumbing — one card, two engines — and "do not tell the player to
 * spend a turn on nothing" is a property of advice, not of FFX's CTB or
 * FFX-2's ATB. The critic measured the FFX-2 half in Chapter 4 (Shell) and the
 * FFX half in Chapter 1 (Hastega), so both are asserted here over whole
 * seeded fights, and the guard's *exemptions* are asserted in FFX, where the
 * unpriceable kinds actually occur (summon, switch, Talk, Grand Summon).
 *
 * ## Why the runs are guided
 *
 * The critic's route is a player pressing GUIDE'S PICK every turn, so these
 * replays submit the advisor's own top suggestion rather than the auto
 * battler's. A replay driven by `intendedStrategy` would never visit the
 * boards a card-follower reaches, which is exactly how this shipped.
 */

import { describe, expect, it } from 'vitest';
import type {
  AnyCombatant,
  AvailableCommand,
  BattleState,
  Command,
  Decision,
} from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { simulateFFXCommand } from '../../src/battle/ffx/simulate.ts';
import type { SimOutcome } from '../../src/battle/ffx/simulate.ts';
import { simulateFFX2Command } from '../../src/battle/ffx2/simulate.ts';
import { buildAdvisorView, changesNothing, type AdvisorOptions } from '../../src/engine/tactics/advisor.ts';
import { inertAcrossBand, statusChances } from '../../src/engine/tactics/advisor-roll.ts';
import { recommendedCommand } from '../../src/engine/tactics/guide.ts';

/** Generous: Chapter 1's longest guided seed takes ~60 decisions and ~2,000 ticks. */
const MAX_STEPS = 20_000;
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

interface Harness {
  engine: {
    nextDecision: () => Decision;
    submit: (c: Command) => void;
    state: () => Readonly<BattleState>;
    tick?: (ms: number) => void;
  };
  options: AdvisorOptions;
}

function ffxHarness(groupId: string, seed: number, party: unknown): Harness {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the data layer`);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.setSeed(seed);
  engine.init({
    game: 'ffx',
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return { engine: engine as unknown as Harness['engine'], options: { ffxContent: content } };
}

function ffx2Harness(groupId: string, seed: number, party: unknown): Harness {
  const abilities = abilityRegistryFrom(Object.values(ffx2data.ABILITIES));
  const items = itemRegistryFrom(Object.values(ffx2data.ITEMS));
  const engine = new FFX2Engine({
    abilities,
    items,
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  const group = ffx2data.ENEMY_GROUPS_BY_ID[groupId];
  if (!group) throw new Error(`${groupId} group missing from the FFX-2 data layer`);
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2',
    party,
    enemies: group,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  } as never);
  return { engine: engine as unknown as Harness['engine'], options: { ffx2: { abilities, items } } };
}

function harnessFor(chapterId: string, seed: number): Harness {
  const chapter = CHAPTERS.find((c) => c.id === chapterId);
  if (!chapter) throw new Error(`no chapter "${chapterId}"`);
  return chapter.game === 'ffx2'
    ? ffx2Harness(chapter.enemyGroupRef.id, seed, chapter.buildRef)
    : ffxHarness(chapter.enemyGroupRef.id, seed, chapter.buildRef);
}

/** The same preview the advisor ran, re-run here so the assertion reads the engine. */
function preview(
  state: Readonly<BattleState>,
  actorId: string,
  command: Command,
  options: AdvisorOptions,
): SimOutcome | null {
  if (state.game === 'ffx2') {
    return simulateFFX2Command(state, actorId, command, {
      roll: 'mid',
      ...(options.ffx2?.abilities ? { abilities: options.ffx2.abilities } : {}),
      ...(options.ffx2?.items ? { items: options.ffx2.items } : {}),
    }) as SimOutcome | null;
  }
  return simulateFFXCommand(state, actorId, command, {
    roll: 'mid',
    ...(options.ffxContent ? { content: options.ffxContent } : {}),
  });
}

/**
 * **The band-aware reading of "this does nothing".**
 *
 * `changesNothing` reads one median-branch preview, and a preview answers every
 * *branch* roll at its median — so a status whose net chance is 40 comes back
 * as "nothing happened". That is true of the preview and false of the board.
 * Chapter 3 is won by landing Slow on both Yu Pagodas at about two chances in
 * five, and calling it a no-op cost a card-follower the fight on all forty
 * seeds while the chapter's own line won thirty-nine [`advisor-roll.ts`,
 * `critic/bench/advisor-v2/`]. So the assertions below ask the same question of
 * the whole probability band: **nothing measurable at the median, and no branch
 * it could have won.**
 *
 * `changesNothing` itself is unchanged and its own tests above still pin it.
 */
function inert(
  state: Readonly<BattleState>,
  actorId: string,
  command: Command,
  options: AdvisorOptions,
): boolean {
  const out = preview(state, actorId, command, options);
  return inertAcrossBand(actorId, command, out, statusChances(state, actorId, command, out));
}

function fallback(commands: AvailableCommand[]): Command | null {
  const r = commands.find((c) => c.enabled && c.validTargets.length > 0);
  return r ? ({ ...r.command, targets: [r.validTargets[0]!] } as Command) : null;
}

interface GuidedRun {
  /** `'victory' | 'defeat' | …`, or `'unresolved'` when the fight ran out of steps. */
  outcome: string;
  decisions: number;
  /** Every decision at which the card's top row resolved to nothing. */
  noOps: string[];
  distinctPicks: number;
  /** The most-repeated pick, and how often — the shape PR-0006 measured. */
  top: [string, number];
}

/**
 * Replay one chapter the way a card-follower plays it: ask the advisor, press
 * what it says, repeat. Every top row is re-simulated and checked.
 */
function guided(chapterId: string, seed: number): GuidedRun {
  const { engine, options } = harnessFor(chapterId, seed);
  const picks: Record<string, number> = {};
  const noOps: string[] = [];
  let decisions = 0;
  let outcome = 'unresolved';

  for (let i = 0; i < MAX_STEPS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') {
      outcome = String((d as { result?: { outcome?: string } }).result?.outcome ?? 'over');
      break;
    }
    if (d.kind === 'waiting') {
      engine.tick?.(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;

    decisions += 1;
    const state = engine.state();
    const view = buildAdvisorView(state, { actorId: d.actorId, commands: d.commands }, options);
    let chosen: Command | null = null;
    if (view?.suggestions[0]) {
      const s = view.suggestions[0];
      const key = `${s.label} -> ${s.targetName ?? s.targetId ?? '-'}`;
      picks[key] = (picks[key] ?? 0) + 1;
      const out = preview(state, d.actorId, s.command, options);
      if (inertAcrossBand(d.actorId, s.command, out, statusChances(state, d.actorId, s.command, out))) {
        noOps.push(`${chapterId} seed ${seed} decision ${decisions}: ${view.actorName} — ${key}`);
      }
      chosen = s.command;
    }
    if (!chosen) chosen = intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d.commands);
    if (!chosen) break;
    engine.submit(chosen);
  }

  const ranked = Object.entries(picks).sort((a, b) => b[1] - a[1]);
  return {
    outcome,
    decisions,
    noOps,
    distinctPicks: ranked.length,
    top: ranked[0] ?? ['(none)', 0],
  };
}

/** Walk a chapter with the auto-battler until `stop` says this is the board. */
function walkUntil(
  chapterId: string,
  seed: number,
  stop: (state: Readonly<BattleState>, d: Extract<Decision, { kind: 'player-input' }>) => boolean,
): { harness: Harness; decision: Extract<Decision, { kind: 'player-input' }>; state: Readonly<BattleState> } | null {
  const harness = harnessFor(chapterId, seed);
  const { engine } = harness;
  for (let i = 0; i < MAX_STEPS; i += 1) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') return null;
    if (d.kind === 'waiting') {
      engine.tick?.(Math.max(1, d.nextEventMs));
      continue;
    }
    if (d.kind !== 'player-input') continue;
    const state = engine.state();
    if (stop(state, d)) return { harness, decision: d, state };
    const chosen = intendedStrategy(d.actorId, d.commands, engine as never) ?? fallback(d.commands);
    if (!chosen) return null;
    engine.submit(chosen);
  }
  return null;
}

function livingActives(state: Readonly<BattleState>): AnyCombatant[] {
  return state.activeIds
    .map((id) => state.combatants[id])
    .filter((c): c is AnyCombatant => c !== undefined && c.alive);
}

function hasStatus(c: AnyCombatant, status: string): boolean {
  return (c.statuses as Record<string, unknown>)[status] !== undefined;
}

/** The actor's own enabled row for `label`, aimed at its first legal target. */
function rowCommand(commands: readonly AvailableCommand[], label: string): Command | null {
  const row = commands.find((c) => c.enabled && c.label === label && c.validTargets.length > 0);
  return row ? ({ ...row.command, targets: [row.validTargets[0]!] } as Command) : null;
}

describe('the state guard reads the simulation, not the ability record (FFX-2, Chapter 4)', () => {
  it('Shell counts while it lands and stops counting once the party has it', () => {
    // The board before any Shell: the cast is an effect, so the guard declines.
    const before = walkUntil(
      'ffx2-bahamut',
      3,
      (state, d) =>
        rowCommand(d.commands, 'Shell') !== null &&
        livingActives(state).every((c) => !hasStatus(c, 'shell')),
    );
    expect(before, 'a Chapter 4 decision with Shell offered and nobody shelled').not.toBeNull();
    const shellFirst = rowCommand(before!.decision.commands, 'Shell')!;
    const landed = preview(before!.state, before!.decision.actorId, shellFirst, before!.harness.options);
    expect(landed?.statusChanges.some((c) => c.status === 'shell' && c.applied)).toBe(true);
    expect(changesNothing(before!.decision.actorId, shellFirst, landed)).toBe(false);

    // The board the critic measured: Shell already on every living active.
    const after = walkUntil(
      'ffx2-bahamut',
      3,
      (state, d) =>
        rowCommand(d.commands, 'Shell') !== null &&
        livingActives(state).length > 0 &&
        livingActives(state).every((c) => hasStatus(c, 'shell')),
    );
    expect(after, 'a Chapter 4 decision with Shell offered and everyone already shelled').not.toBeNull();
    const shellAgain = rowCommand(after!.decision.commands, 'Shell')!;
    const repeat = preview(after!.state, after!.decision.actorId, shellAgain, after!.harness.options);
    expect(repeat).not.toBeNull();
    expect(repeat!.statusChanges).toEqual([]);
    expect(repeat!.damageToEnemies).toBe(0);
    expect(repeat!.healingToAllies).toBe(0);
    expect(changesNothing(after!.decision.actorId, shellAgain, repeat)).toBe(true);

    // …and the card does not offer it. This is the row PR-0006 counted 301 times.
    const view = buildAdvisorView(
      after!.state,
      { actorId: after!.decision.actorId, commands: after!.decision.commands },
      after!.harness.options,
    );
    expect(view).not.toBeNull();
    for (const s of view!.suggestions) {
      expect(s.label, 'a buff already on the whole party is never the pick').not.toBe('Shell');
    }
  }, 30_000);
});

describe('the guard never judges what a preview cannot price', () => {
  it('a switch is exempt: it resolves to nothing by construction', () => {
    const at = walkUntil('seymour-flux', 4, (_state, d) =>
      d.commands.some((c) => c.enabled && c.command.kind === 'switch'),
    );
    expect(at).not.toBeNull();
    const row = at!.decision.commands.find((c) => c.enabled && c.command.kind === 'switch')!;
    const command = { ...row.command, targets: [] } as Command;
    // Both the priced path (no outcome at all) and a simulated one are exempt.
    expect(changesNothing(at!.decision.actorId, command, null)).toBe(false);
    const out = preview(at!.state, at!.decision.actorId, command, at!.harness.options);
    expect(changesNothing(at!.decision.actorId, command, out)).toBe(false);
  }, 30_000);

  it('a summon is exempt: it changes who is standing on the field', () => {
    const at = walkUntil('seymour-flux', 4, (_state, d) =>
      d.commands.some((c) => c.enabled && c.command.kind === 'summon'),
    );
    expect(at).not.toBeNull();
    const row = at!.decision.commands.find((c) => c.enabled && c.command.kind === 'summon')!;
    const command = { ...row.command, targets: [] } as Command;
    const out = preview(at!.state, at!.decision.actorId, command, at!.harness.options);
    // It really does resolve flat — no HP, no status — and is kept anyway.
    expect(out?.damageToEnemies ?? 0).toBe(0);
    expect(out?.statusChanges ?? []).toEqual([]);
    expect(changesNothing(at!.decision.actorId, command, out)).toBe(false);
  }, 30_000);
});

describe('a whiff is not a no-op', () => {
  /**
   * A preview answers every *branch* roll at its median, so a swing that misses
   * in the preview is one whose hit chance is at or under 50 — a coin flip. The
   * first cut of this guard counted those as nothing, demoted Auron's line at
   * Yunalesca to a Remedy twenty times over twelve guided seeds, and took the
   * chapter from 11 wins in 12 to 9. Measured, then fixed, and pinned here.
   */
  it('an attack that misses at the median roll keeps its place', () => {
    const at = walkUntil('yunalesca', 1, (state, d) => {
      const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0);
      if (!attack) return false;
      const command = { ...attack.command, targets: [attack.validTargets[0]!] } as Command;
      const out = simulateFFXCommand(state, d.actorId, command, { roll: 'mid' });
      return (out?.misses ?? 0) > 0 && (out?.damageToEnemies ?? 0) === 0;
    });
    expect(at, 'a Chapter 2 swing that whiffs at the median roll').not.toBeNull();
    const attack = at!.decision.commands.find(
      (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.length > 0,
    )!;
    const command = { ...attack.command, targets: [attack.validTargets[0]!] } as Command;
    const out = preview(at!.state, at!.decision.actorId, command, at!.harness.options);
    expect(out!.misses).toBeGreaterThan(0);
    expect(changesNothing(at!.decision.actorId, command, out)).toBe(false);
  }, 30_000);
});

describe('the chapter line yields when it does nothing, and only then', () => {
  /**
   * The behavioural half: the guard is not a predicate nobody consults
   * [AGENTS.md rule 4]. Over guided routes it is asked at every decision, and
   * where the chapter's own line resolves to nothing the card is required to be
   * offering something else that does not.
   *
   * One chapter per game, and both are ones where it actually fires: Braska's
   * Final Aeon re-casts Slow at a target that already carries it, and the
   * Farplane line opens with Pray on a party at full HP.
   */
  for (const [chapterId, seeds] of [
    // Braska's Final Aeon used to be in this list, because its line re-cast
    // Slow at a Yu Pagoda that already carried it. Under the band that is still
    // a no-op — an application the engine refuses outright cannot roll — but the
    // card no longer walks the chapter into it at all, so the case stopped
    // firing and a test that never fires is not a test. The Chapter 3 board it
    // was standing in for is asserted directly in the block below.
    ['ffx2-vegnagun-shuyin', [1, 2, 3, 4, 5, 6]],
  ] as const) {
    it(`${chapterId}: a no-op line is replaced by a row that does something`, () => {
      let fired = 0;
      const wrong: string[] = [];
      for (const seed of seeds) {
        const { engine, options } = harnessFor(chapterId, seed);
        for (let i = 0; i < MAX_STEPS; i += 1) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') break;
          if (d.kind === 'waiting') {
            engine.tick?.(Math.max(1, d.nextEventMs));
            continue;
          }
          if (d.kind !== 'player-input') continue;
          const state = engine.state();
          const decision = { actorId: d.actorId, commands: d.commands };
          const view = buildAdvisorView(state, decision, options);
          let line: Command | null = null;
          try {
            line = recommendedCommand(state, decision);
          } catch {
            line = null;
          }
          if (line && inert(state, d.actorId, line, options)) {
            fired += 1;
            const top = view?.suggestions[0];
            if (!top) {
              wrong.push(`${chapterId} seed ${seed}: no card at all`);
            } else if (inert(state, d.actorId, top.command, options)) {
              wrong.push(`${chapterId} seed ${seed}: card still offers a no-op (${top.label})`);
            }
          }
          const chosen =
            view?.suggestions[0]?.command ??
            intendedStrategy(d.actorId, d.commands, engine as never) ??
            fallback(d.commands);
          if (!chosen) break;
          engine.submit(chosen);
        }
      }
      expect(fired, 'the guard is consulted on boards where it has work to do').toBeGreaterThan(0);
      expect(wrong).toEqual([]);
    }, 60_000);
  }
});

describe('a coin flip is not a no-op (FFX, Chapter 3)', () => {
  /**
   * **The board that decides this track.** Chapter 3 is won by getting Slow onto
   * both Yu Pagodas; Slow lands about two times in five, so the median-branch
   * preview reports nothing at all. The shipped card read that report twice —
   * `WASTED_TURN_PENALTY` in the score, *inert* in the ordering — and answered
   * "what do I press" with Cheer.
   *
   * Measured on forty seeds, 2026-09-21 (`critic/bench/advisor-v2/`): the
   * chapter's own line won **39 of 40** in a median 215 turns; a player pressing
   * the card's top row every turn won **0 of 40**, thirty defeats and ten
   * stalemates, median 448. The three assertions below are that fight in one
   * decision.
   *
   * ## Which game
   *
   * **FFX only** for this board — the Yu Pagodas are Chapter 3's — but the rule
   * it pins is **both**, and the FFX-2 half is the Chapter 5 case above
   * [AGENTS.md rule 14].
   */
  it('Slow on an unslowed Yu Pagoda is the pick, not Cheer', () => {
    // The board is found by asking the **chapter's own line** for it, not by
    // hunting for a row: the claim under test is that the card keeps the line on
    // the turn the line calls for Slow.
    const at = walkUntil('braskas-final-aeon', 1, (state, d) => {
      let line: Command | null = null;
      try {
        line = recommendedCommand(state, { actorId: d.actorId, commands: d.commands });
      } catch {
        return false;
      }
      if (!line || !('id' in line) || String((line as { id?: unknown }).id) !== 'slow') return false;
      const target = (line.targets as readonly string[])[0];
      return (
        target !== undefined &&
        target.startsWith('yu-pagoda') &&
        !hasStatus(state.combatants[target]!, 'slow')
      );
    });
    expect(at, 'a Chapter 3 turn whose line is Slow at an unslowed pagoda').not.toBeNull();
    const command = recommendedCommand(at!.state, {
      actorId: at!.decision.actorId,
      commands: at!.decision.commands,
    })!;
    const pagoda = (command.targets as readonly string[])[0]!;
    const out = preview(at!.state, at!.decision.actorId, command, at!.harness.options);

    // The preview really does report nothing: this is not a straw man.
    expect(out!.statusChanges).toEqual([]);
    expect(out!.damageToEnemies).toBe(0);
    expect(changesNothing(at!.decision.actorId, command, out)).toBe(true);

    // …and the roll it is waiting on is real, so it is not inert.
    const chances = statusChances(at!.state, at!.decision.actorId, command, out);
    const slow = chances.find((c) => c.status === 'slow' && c.targetId === pagoda);
    expect(slow, 'the engine offers a Slow roll against this pagoda').toBeDefined();
    expect(slow!.percent).toBeGreaterThan(0);
    expect(inertAcrossBand(at!.decision.actorId, command, out, chances)).toBe(false);

    // …and the card says so.
    const view = buildAdvisorView(
      at!.state,
      { actorId: at!.decision.actorId, commands: at!.decision.commands },
      at!.harness.options,
    );
    expect(view).not.toBeNull();
    expect(view!.suggestions[0]!.label).toBe('Slow');
    expect(view!.suggestions[0]!.targetId).toBe(pagoda);
  }, 60_000);
});

describe('no pick is a no-op, over whole seeded fights', () => {
  // Chapter 1 is FFX (CTB) and Chapter 4 is FFX-2 (ATB): the two the critic
  // measured, and the two halves of the "both games" case.
  for (const chapterId of ['seymour-flux', 'ffx2-bahamut'] as const) {
    it(`${chapterId}: the card's top row always does something, 12 seeds`, () => {
      const offences: string[] = [];
      let decisions = 0;
      for (const seed of SEEDS) {
        const run = guided(chapterId, seed);
        decisions += run.decisions;
        offences.push(...run.noOps);
      }
      expect(decisions).toBeGreaterThan(100);
      expect(offences, `${offences.length} of ${decisions} picks resolved to nothing`).toEqual([]);
    }, 60_000);
  }

  it('Chapter 4 resolves when the player follows the card, on every seed', () => {
    const unresolved: string[] = [];
    for (const seed of SEEDS) {
      const run = guided('ffx2-bahamut', seed);
      if (run.outcome === 'unresolved') unresolved.push(`seed ${seed}: ${run.decisions} decisions`);
      // The measured shape of the defect was 301 samples and *one* distinct row.
      // A guided route that is making decisions is making different ones.
      expect(run.distinctPicks, `seed ${seed} played ${run.top[0]} x${run.top[1]}`).toBeGreaterThan(3);
    }
    expect(unresolved, 'the guided route reaches an outcome').toEqual([]);
  }, 60_000);
});
