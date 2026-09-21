/**
 * The Leblanc Syndicate's `intendedStrategy`, headlessly — A1, A2, A3 of
 * `docs/plans/chapter-leblanc-review.md` §9.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Acceptance cases A4-A9 and
 * A11 are in `tests/unit/chapters/leblanc-engine.test.ts`.
 *
 * The engine is driven exactly the way `BattleScreenWiring.ts` drives it,
 * including the `'waiting'` branch — FFX-2 is an ATB engine, so a caller that
 * only answers `'player-input'` never advances the clock and the battle never
 * reaches a decision at all — and the chain is walked with the same
 * `setupForNextLink` the real chapter screen uses, so the party arrives at
 * Act III on whatever HP, MP and inventory Acts I and II left it.
 *
 * **The decision-time arms.** `D` is the modelled human decision time and is an
 * **input to a measurement, not game data**: at every `'player-input'` the
 * driver hands the engine `D` ms of `throughInput` clock before submitting.
 * The arms are `ffx2-active-measure.test.ts`'s own — 0 (today's auto-battler
 * and the arm every shipped chapter's evidence is measured at), 1.5 s (a player
 * who knows the menu) and 4 s (a first-timer reading it).
 *
 * Numbers cited below are from `research/ffx2-leblanc-syndicate.md`.
 */

import { describe, expect, it } from 'vitest';
import type {
  AnyCombatant,
  AvailableCommand,
  BattleSetup,
  Command,
  Decision,
  EnemyGroupDef,
} from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { chateauBuild } from '../../src/data/ffx2/builds/chateau.ts';
import { LEBLANC_ACT_III, LEBLANC_CHAIN_ORDER } from '../../src/data/ffx2/enemies/leblanc-syndicate.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { ffx2Leblanc } from '../../src/engine/tactics/ffx2-leblanc.ts';
import { aim, row } from '../../src/engine/tactics/common.ts';

const MAX_DECISIONS = 20_000;
const SEEDS = Array.from({ length: 40 }, (_, i) => i + 1);
/** AUTHORED measurement inputs, not game data. Same three arms as `ffx2-active-measure.test.ts`. */
const ARMS = [0, 1500, 4000] as const;

/** §9 A1 — this is an onboarding chapter, so the bar is high. */
const WIN_BAR = 0.9;

type Line = (actorId: string, commands: AvailableCommand[], engine: FFX2Engine) => Command | null;

function engineOptions() {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    minigames: false as const,
  };
}

function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const r = d.commands.find((c) => c.enabled && c.validTargets.length > 0);
  if (!r) return { kind: 'defend', targets: [] };
  return { ...r.command, targets: [r.validTargets[0]!] } as Command;
}

interface Tally {
  outcome: string | undefined;
  lastLink: string;
  turns: number;
  seconds: number;
  aliveAtEnd: number;
  invalidated: number;
  /** Named enemy actions, for the teaching moments the chapter is built on. */
  huggles: number;
  noLoveLost: number;
  roulette: number;
  ejects: number;
}

function emptyTally(): Tally {
  return {
    outcome: undefined, lastLink: '', turns: 0, seconds: 0, aliveAtEnd: 0,
    invalidated: 0, huggles: 0, noLoveLost: 0, roulette: 0, ejects: 0,
  };
}

function score(engine: FFX2Engine, from: number, tally: Tally): void {
  for (const e of engine.state().log.slice(from)) {
    if (e.type === 'action-start' && e.abilityId === 'x2-ormi-huggles') tally.huggles += 1;
    if (e.type === 'action-start' && e.abilityId === 'x2-nll-1') tally.noLoveLost += 1;
    if (e.type === 'action-start' && e.abilityId === 'x2-logos-russian-roulette') tally.roulette += 1;
    if (e.type === 'status-add' && e.status === 'eject') tally.ejects += 1;
  }
}

/** One link, with `decisionMs` of Active clock burned at every menu. */
function runLink(engine: FFX2Engine, decisionMs: number, line: Line, tally: Tally): string | undefined {
  const from = engine.state().log.length;
  let outcome: string | undefined;
  for (let i = 0; i < MAX_DECISIONS; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
    if (d.kind === 'waiting') { engine.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind !== 'player-input') continue;

    if (decisionMs > 0) {
      engine.tick(decisionMs, { throughInput: true });
      // The rows were built before that clock ran, so the girl holding the menu
      // can be KO'd under it — the case `submit`'s refuse-and-reopen guard
      // answers. Counted, never hidden.
      if (!engine.inputValid(d.actorId)) { tally.invalidated += 1; continue; }
    }
    const picked = line(d.actorId, d.commands, engine);
    if (engine.submit(picked ?? fallback(d)).length === 0) continue;
    tally.turns += 1;
  }
  score(engine, from, tally);
  return outcome;
}

/** The whole three-act mission, Act I -> Act II -> Act III. */
function runChain(seed: number, decisionMs: number, line: Line): Tally {
  const tally = emptyTally();
  const engine = new FFX2Engine(engineOptions());
  let group: EnemyGroupDef | undefined = data.ENEMY_GROUPS_BY_ID[LEBLANC_CHAIN_ORDER[0]];
  if (!group) throw new Error('the Leblanc chain is missing from the data layer');
  let setup: BattleSetup = {
    game: 'ffx2', party: chateauBuild, enemies: group, triggers: [],
    seed, condition: 'normal', canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);

  let links = 0;
  for (;;) {
    const outcome = runLink(engine, decisionMs, line, tally);
    links += 1;
    tally.outcome = outcome;
    tally.lastLink = group.id;
    if (outcome !== 'victory') break;
    const nextId: string | undefined = group.nextGroupId;
    if (!nextId) break;
    const next: EnemyGroupDef | undefined = data.ENEMY_GROUPS_BY_ID[nextId];
    if (!next) throw new Error(`chain points at "${nextId}" with no formation`);
    setup = setupForNextLink(setup, next, engine.state(), seed + links) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }

  const state = engine.state();
  tally.seconds = state.ticks / 3000;
  tally.aliveAtEnd = state.activeIds.filter((id) => state.combatants[id]?.alive).length;
  return tally;
}

/** Act III on its own, from full — the room rather than the carry-over. */
function runLastRoom(seed: number, decisionMs: number, line: Line): Tally {
  const tally = emptyTally();
  const engine = new FFX2Engine(engineOptions());
  const group = data.ENEMY_GROUPS_BY_ID[LEBLANC_ACT_III];
  if (!group) throw new Error('the last room is missing');
  engine.setSeed(seed);
  engine.init({
    game: 'ffx2', party: chateauBuild, enemies: group, triggers: [],
    seed, condition: 'normal', canEscape: false,
  });
  tally.outcome = runLink(engine, decisionMs, line, tally);
  tally.lastLink = group.id;
  tally.seconds = engine.state().ticks / 3000;
  const state = engine.state();
  tally.aliveAtEnd = state.activeIds.filter((id) => state.combatants[id]?.alive).length;
  return tally;
}

const shippedLine: Line = (id, commands, engine) => ffx2Leblanc(id, commands, engine);

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  return s.length === 0 ? 0 : s[Math.floor(s.length / 2)]!;
}

// ---------------------------------------------------------------------------

describe('A1 — the shipped line, forty seeds, three decision-time arms', () => {
  it('clears the whole three-act mission on at least 90 % of seeds with D = 0', () => {
    const rows: string[] = [];
    let zeroArmWins = 0;

    for (const decisionMs of ARMS) {
      const runs = SEEDS.map((seed) => runChain(seed, decisionMs, shippedLine));
      const wins = runs.filter((r) => r.outcome === 'victory').length;
      if (decisionMs === 0) zeroArmWins = wins;
      const failedIn: Record<string, number> = {};
      for (const r of runs) if (r.outcome !== 'victory') failedIn[r.lastLink] = (failedIn[r.lastLink] ?? 0) + 1;
      rows.push(
        [
          `D = ${decisionMs} ms`,
          `${wins}/${SEEDS.length}`,
          median(runs.map((r) => r.turns)).toFixed(0),
          median(runs.map((r) => r.seconds)).toFixed(1),
          runs.reduce((a, r) => a + r.noLoveLost, 0),
          runs.reduce((a, r) => a + r.roulette, 0),
          runs.reduce((a, r) => a + r.ejects, 0),
          runs.reduce((a, r) => a + r.invalidated, 0),
          JSON.stringify(failedIn),
        ].join(' | '),
      );
    }

    console.log(
      '\nLeblanc Syndicate | wins | median player turns | median s | No Love Lost | Russian Roulette | ejects | menus invalidated | failed in',
    );
    for (const r of rows) console.log(r);

    expect(zeroArmWins / SEEDS.length).toBeGreaterThanOrEqual(WIN_BAR);
  }, 600_000);

  it('Act III on its own, from full, is a fast clean win — so the chain measures the carry-over', () => {
    const runs = SEEDS.slice(0, 20).map((seed) => runLastRoom(seed, 0, shippedLine));
    expect(runs.filter((r) => r.outcome === 'victory').length).toBe(runs.length);
    expect(median(runs.map((r) => r.turns))).toBeLessThan(25);
  }, 300_000);
});

// ---------------------------------------------------------------------------

describe('A2 — the credible mistake: leave Ormi for last', () => {
  /**
   * §5.4 fact 2, played out. The reflexive habit is "kill the dangerous one
   * first"; this line kills Leblanc and Logos and leaves the slow bruiser
   * standing alone — which is the **only** state in which Ormi's script can
   * reach Huggles (~1,185, more than any Lv-22 standard dressphere's pool).
   *
   * **This loss must stay reachable.** It is the chapter's best teaching
   * moment, and an auto-battler that quietly "fixed" it would erase the lesson.
   */
  const mistake: Line = (_actorId, commands, engine) => {
    const state = engine.state();
    const living = state.enemyIds
      .map((id) => state.combatants[id])
      .filter((c): c is AnyCombatant => c !== undefined && c.alive);
    const rank = (c: AnyCombatant) => (c.id === 'leblanc' ? 0 : c.id.startsWith('logos') ? 1 : 2);
    const target = [...living].sort((a, b) => rank(a) - rank(b))[0];
    if (!target) return null;
    const hurt = state.activeIds
      .map((id) => state.combatants[id])
      .filter((c): c is AnyCombatant => c !== undefined && c.alive)
      .sort((a, b) => a.hp / a.stats.maxHp - b.hp / b.stats.maxHp)[0];
    if (hurt && hurt.hp / hurt.stats.maxHp < 0.35) {
      const heal = row(commands, ['Hi-Potion', 'Potion'], hurt.id);
      if (heal) return aim(heal, hurt.id);
    }
    for (const label of ['Attack', 'Trigger Happy', 'Cheap Shot']) {
      const r = row(commands, [label], target.id);
      if (r) return aim(r, target.id);
    }
    return null;
  };

  it('arms Huggles, and Huggles is lethal', () => {
    const runs = SEEDS.slice(0, 20).map((seed) => runLastRoom(seed, 0, mistake));
    const withHuggles = runs.filter((r) => r.huggles > 0);
    expect(withHuggles.length, 'Ormi must reach the last-enemy branch').toBeGreaterThan(0);
    // The teaching moment is that it *costs* — every run that saw a Huggles
    // ended with the party smaller than it started.
    for (const r of withHuggles) expect(r.aliveAtEnd).toBeLessThan(3);
  }, 300_000);

  it('the shipped order all but disarms it — Logos first, Ormi second', () => {
    const shipped = SEEDS.slice(0, 20).map((seed) => runLastRoom(seed, 0, shippedLine));
    const wrong = SEEDS.slice(0, 20).map((seed) => runLastRoom(seed, 0, mistake));
    const shippedHuggles = shipped.reduce((a, r) => a + r.huggles, 0);
    const wrongHuggles = wrong.reduce((a, r) => a + r.huggles, 0);
    expect(shippedHuggles).toBeLessThan(wrongHuggles / 4);
    // And No Love Lost never fires at all, because Logos is dead long before
    // Leblanc's third turn — §5.4 fact 1, measured.
    expect(shipped.reduce((a, r) => a + r.noLoveLost, 0)).toBe(0);
    expect(shipped.filter((r) => r.outcome === 'victory').length).toBe(shipped.length);
  }, 300_000);
});

// ---------------------------------------------------------------------------

describe('A3 — the lose verifier', () => {
  /** No healing, no buffs, no items, no order: swing at whoever sorts first. */
  const careless: Line = (_actorId, commands, engine) => {
    const state = engine.state();
    const target = state.enemyIds
      .map((id) => state.combatants[id])
      .find((c): c is AnyCombatant => c !== undefined && c.alive);
    if (!target) return null;
    const r = row(commands, ['Attack'], target.id);
    return r ? aim(r, target.id) : ({ kind: 'defend', targets: [] } as Command);
  };

  it('loses the three-act mission on every seed', () => {
    for (const seed of SEEDS.slice(0, 12)) {
      const tally = runChain(seed, 0, careless);
      expect(tally.outcome, `seed ${seed}`).toBe('defeat');
    }
  }, 300_000);

  it('so the encounter is a test: the shipped line and the careless one differ', () => {
    expect(runChain(7, 0, shippedLine).outcome).toBe('victory');
    expect(runChain(7, 0, careless).outcome).toBe('defeat');
  }, 120_000);

  /**
   * **Recorded, not hidden.** The *last room alone*, entered at full HP with a
   * full bag, is beatable by mashing Attack on several seeds. That is not a
   * hole in the data — §4.5's own design read is that the fight's difficulty is
   * "entirely under the player's control", which is what an onboarding chapter
   * wants — but it does mean the mission's difficulty lives in the **chain**
   * (three fights on one pool of HP, MP and items) and in the Active clock,
   * not in Act III's stat blocks. Whoever tunes the chapter's pacing should
   * start from this number rather than from the room.
   */
  it('but Act III alone, from full, is not a test — that is the chain’s job, not the stat block’s', () => {
    const wins = SEEDS.slice(0, 12).filter((seed) => runLastRoom(seed, 0, careless).outcome === 'victory').length;
    expect(wins).toBeGreaterThan(0);
    console.log(`
careless mashing, Act III alone from full: ${wins}/12 wins`);
  }, 120_000);
});

// ---------------------------------------------------------------------------

describe('the generic strategy is not a substitute for the line', () => {
  it('`intendedStrategy` alone does not clear the mission', () => {
    const generic: Line = (id, commands, engine) => intendedStrategy(id, commands, engine);
    const runs = SEEDS.slice(0, 20).map((seed) => runChain(seed, 0, generic));
    const wins = runs.filter((r) => r.outcome === 'victory').length;
    // Measured at 3/40 for the full forty seeds when this chapter was built;
    // the bar here is only that it is not a clean sweep, so the tactic is
    // demonstrably load-bearing rather than decorative.
    expect(wins).toBeLessThan(runs.length);
  }, 300_000);
});
