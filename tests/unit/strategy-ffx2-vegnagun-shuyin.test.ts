/**
 * The SHIPPED `intendedStrategy` against Chapter 5 — the Vegnagun chain and
 * Shuyin — headlessly, and the whole chain rather than one link.
 *
 * Mirrors `strategy-chapter2.test.ts`, and for the same reason: the engine
 * suites prove the parts (`ffx2-ai-vegnagun.test.ts`, `ffx2-ai-shuyin.test.ts`,
 * `data-ffx2-vegnagun-chain.test.ts`) and nothing asserted that the strategy the
 * *game* actually plays — `src/engine/BattlePresenterStrategies.ts`, which is
 * what `__pyrefly.autoBattle('intended')` and the e2e specs drive — can win.
 * Chapter 5 could stall in the real game with every engine test green, and it
 * did: the observed failure was defeat in seventeen turns in the **first** link.
 *
 * ## The chain is the unit under test, not the battle
 *
 * `EnemyGroupDef.nextGroupId` links five formations with no menu between them
 * [ffx2-vegnagun-shuyin.md §2], and the engine deliberately never advances them
 * itself: `docs/CONTRACT-CHANGES.md` decision 6 puts that on the screen. So this
 * file drives the same loop `BattleScreen.runEncounter` does, through the same
 * `setupForNextLink` / `carryPartyForward` the screen uses — the party carries
 * its HP, MP and **item counts** from link to link, which is the whole
 * difficulty of the chapter. A run that wins the Tail on the last Potion in the
 * bag has not won Chapter 5.
 *
 * ## What "the intended line" is here
 *
 * §7.1's canonical clear, `[verified: 2 sources]`: two Dark Knights spamming
 * **Darkness**, one White Mage healing. `src/engine/tactics/ffx2-vegnagun-shuyin.ts`
 * is that line and carries the citation for every rule in it.
 *
 * Measured: **580 wins in 600 contiguous chains (96.7%)** — 194/200 from seed
 * 1, 192/200 from 201, 194/200 from 1001. The surviving losses are almost all
 * at the Leg and are variance in the Nodes' colour machine (§3.2), not a wrong
 * line.
 *
 * ## Two of the chapter's canon mechanics were inert, and switching them on
 * ## made this test red before it made it green
 *
 * `docs/CONTRACT-CHANGES.md` (key `ffx2-vegnagun-shuyin`) carries the full
 * list. Two of them are the reason the numbers above are not the numbers the
 * previous round recorded:
 *
 *   * **Darkness's HP cost was never charged.** §6.4 prices it at "12.5% (1/8)
 *     of user's max HP `[verified: 2 sources]`" and §7.1 names that as the
 *     ability's entire downside. `extra.hpCostPercent` was written by the data
 *     layer and read by nobody, so the line that won 92.5% was spending
 *     65,000-83,000 HP a chain it never paid for. Charging it dropped the
 *     forty-chain window below to **23/40**.
 *   * **`AiScript.onDamaged` was declared and never called**, so §3.3's Core
 *     attack log — "the fight's whole identity" — never populated and the
 *     Bulwarks never retaliated once, §3.2's Node colour machine never
 *     advanced on a hit, and §3.4's Odi Et Amo counter never ticked.
 *
 * Both make the chapter harder. The line in
 * `src/engine/tactics/ffx2-vegnagun-shuyin.ts` was rebuilt against them, and
 * its header carries a measured number for every rule.
 */

import { describe, expect, it } from 'vitest';
import type {
  BattleSetup,
  Command,
  Decision,
  EnemyGroupDef,
  FFX2PartyBuild,
} from '../../src/battle/common/types.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import * as data from '../../src/data/ffx2/index.ts';
import { farplaneBuild } from '../../src/data/ffx2/builds/farplane.ts';
import { setupForNextLink } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { VEGNAGUN_CHAIN_ORDER } from '../../src/data/ffx2/ids.ts';

/** A generous bound, never a normal exit path — a spinning battle must fail, not hang. */
const MAX_DECISIONS = 20_000;

/** The four seeds the coordinating session measures this encounter on. */
const SEEDS = [1, 7, 42, 20260916];

/**
 * The registries the app injects at boot (`BattleScreenContent.ts`), built the
 * same way, so this test exercises the shipped data tables rather than the
 * engine's own research-cited fallbacks.
 */
function engineOptions() {
  return {
    abilities: abilityRegistryFrom(Object.values(data.ABILITIES)),
    items: itemRegistryFrom(Object.values(data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(data.GARMENT_GRIDS)),
    // `minigames: false` is the FFX-2 spelling of "nobody can play a timed
    // overlay"; the engine rolls the outcome from the seeded RNG instead.
    minigames: false,
  };
}

/** Plain Attack on the first legal target — only used if the strategy declines. */
function fallback(d: Extract<Decision, { kind: 'player-input' }>): Command {
  const row =
    d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled);
  const target = row?.validTargets[0];
  if (!row) return { kind: 'defend', targets: [] };
  return { ...row.command, targets: target ? [target] : [] } as Command;
}

interface LinkRun {
  group: string;
  outcome: string | undefined;
  decisions: number;
  bossHp: number;
}

interface ChainRun {
  outcome: string | undefined;
  links: LinkRun[];
  decisions: number;
  strategyDeclined: number;
}

/**
 * Drive the whole chain with the shipped strategy.
 *
 * The loop is `BattleScreen.runEncounter`'s: run a link to a decision, and on a
 * victory that carries a `nextGroupId`, re-init on the next formation with the
 * party's carried state and a seed derived from the link index — exactly as the
 * screen does, so a pass here means the real game passes.
 */
function runChain(seed: number, party: FFX2PartyBuild = farplaneBuild): ChainRun {
  const engine = new FFX2Engine(engineOptions());
  const first = data.ENEMY_GROUPS_BY_ID[VEGNAGUN_CHAIN_ORDER[0]!];
  if (!first) throw new Error('the Vegnagun chain is missing from the data layer');

  let setup: BattleSetup = {
    game: 'ffx2',
    party,
    enemies: first,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  };
  engine.setSeed(seed);
  engine.init(setup);

  const run: ChainRun = { outcome: undefined, links: [], decisions: 0, strategyDeclined: 0 };
  let group: EnemyGroupDef = first;

  for (;;) {
    const link: LinkRun = { group: group.id, outcome: undefined, decisions: 0, bossHp: 0 };
    for (let i = 0; i < MAX_DECISIONS; i++) {
      link.decisions++;
      run.decisions++;
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        link.outcome = d.result.outcome;
        run.outcome = d.result.outcome;
        break;
      }
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      const picked = intendedStrategy(d.actorId, d.commands, engine);
      if (!picked) run.strategyDeclined++;
      engine.submit(picked ?? fallback(d));
    }

    const state = engine.state();
    link.bossHp = state.combatants[group.id]?.hp ?? 0;
    run.links.push(link);
    if (link.outcome !== 'victory') break;

    const nextId = group.nextGroupId;
    if (!nextId) break;
    const next = data.ENEMY_GROUPS_BY_ID[nextId];
    if (!next) throw new Error(`chain points at "${nextId}" but no formation exports that id`);

    setup = setupForNextLink(setup, next, state, seed + run.links.length) as BattleSetup;
    group = next;
    engine.setSeed(setup.seed);
    engine.init(setup);
  }

  return run;
}

/**
 * The acceptance test for Chapter 5: the shipped strategy walks all five links.
 *
 * "Victory" alone is not enough — winning the Tail and stopping is a victory
 * with `nextGroupId` still set. The chain is only complete when five links have
 * been fought and the last of them is Shuyin.
 */
describe('the shipped intended strategy beats Chapter 5 and completes the chain', () => {
  for (const seed of SEEDS) {
    it(`wins the Vegnagun chain and Shuyin (seed ${seed})`, () => {
      const run = runChain(seed);
      // Printed so a failure shows *where* and *how* it lost, not just that it did.
      console.log(
        `seed ${seed}: ${run.outcome} in ${run.decisions} decisions; ` +
          run.links.map((l) => `${l.group}=${l.outcome ?? 'unresolved'}(${l.bossHp} left)`).join(' -> '),
      );

      expect(run.decisions, 'the chain must reach a decision, not spin').toBeLessThan(MAX_DECISIONS * 5);
      expect(run.outcome).toBe('victory');
      expect(
        run.links.map((l) => l.group),
        'all five links, in the order §2 fights them',
      ).toEqual([...VEGNAGUN_CHAIN_ORDER]);
      expect(
        run.links.every((l) => l.outcome === 'victory'),
        'every link must be won, not merely reached',
      ).toBe(true);
      expect(run.links[run.links.length - 1]!.bossHp, 'Shuyin must actually fall').toBe(0);
    });
  }

  /**
   * Four seeds prove a line exists; they do not prove it is the line rather
   * than four lucky rolls. This is the regression net: forty contiguous chains,
   * two hundred battles, in about a second.
   *
   * Measured **40/40** on this window and 96.7% over 600 contiguous seeds. The
   * bar is 36 so ordinary tail variance does not flake it, and so that a
   * regression toward what this used to be — 0/40, defeat inside the first
   * link, and 23/40 once Darkness started paying for itself — goes red.
   */
  it('wins the great majority of forty contiguous chains', () => {
    const runs = Array.from({ length: 40 }, (_, i) => runChain(i + 1));
    const wins = runs.filter((r) => r.outcome === 'victory' && r.links.length === 5).length;
    const lost = runs
      .map((r, i) => ({ seed: i + 1, r }))
      .filter((x) => !(x.r.outcome === 'victory' && x.r.links.length === 5))
      .map((x) => `${x.seed}: lost at ${x.r.links[x.r.links.length - 1]!.group}`);
    console.log(`seeds 1-40: ${wins} chains won; losses: ${lost.join(', ') || 'none'}`);

    expect(wins, 'Chapter 5 must be reliably winnable, not a coin flip').toBeGreaterThanOrEqual(36);
  });
});

/**
 * The wrong tactics must stay punished, independently of whether the intended
 * strategy currently wins. §7.2 names this one for the Leg and it is the trap
 * the *generic* strategy falls into by construction:
 *
 *   * "**Ignore the Nodes' 300,000 HP; all damage goes to the Leg (18,220)**."
 *
 * `BattlePresenterStrategies.bestEnemyTarget` prefers a `flags.isPart` target
 * over the boss it props up, which is right in three of the five chapters and
 * catastrophically wrong here: the Nodes are parts with 300,000 HP each and the
 * Leg is the win condition. §3.2 adds the second half of the punishment — the
 * Nodes' colour machine advances "on (own turn resolves) **OR** (hit by any
 * attack)", and its GREEN face casts Cura, Regen, Shell and Protect **on the
 * Leg** — so a party that dutifully attacks the Nodes is also winding up the
 * thing that heals its target.
 */
function nodeFirst(
  engine: FFX2Engine,
  d: Extract<Decision, { kind: 'player-input' }>,
): Command | null {
  const state = engine.state();
  const node = state.enemyIds
    .map((id) => state.combatants[id])
    .find((c) => c !== undefined && c.alive && c.flags.isPart);
  if (!node) return null;
  const row = d.commands.find(
    (c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(node.id),
  );
  return row ? ({ ...row.command, targets: [node.id] } as Command) : null;
}

describe('attacking the Nodes instead of the Leg stays a losing tactic', () => {
  it('cannot kill 900,000 HP of Node, and the Leg survives', () => {
    const engine = new FFX2Engine(engineOptions());
    const leg = data.ENEMY_GROUPS_BY_ID['vegnagun-leg'];
    expect(leg, 'vegnagun-leg must exist in the data layer').toBeDefined();
    engine.setSeed(7);
    engine.init({
      game: 'ffx2',
      party: farplaneBuild,
      enemies: leg!,
      triggers: [],
      seed: 7,
      condition: 'normal',
      canEscape: false,
    });

    let outcome: string | undefined;
    let nodeSwings = 0;
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') {
        outcome = d.result.outcome;
        break;
      }
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      const wrong = nodeFirst(engine, d);
      if (wrong) {
        nodeSwings++;
        engine.submit(wrong);
        continue;
      }
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
    }

    const state = engine.state();
    const legHp = state.combatants['vegnagun-leg']?.hp ?? 0;
    console.log(
      `node-first: ${outcome}, ${nodeSwings} swings into the Nodes, Leg left on ${legHp}, ` +
        `nodes ${['node-a', 'node-b', 'node-c'].map((id) => state.combatants[id]?.hp).join('/')}`,
    );

    expect(outcome, 'the battle must reach a decision').toBeDefined();
    expect(nodeSwings, 'the wrapper must actually have attacked the Nodes, or it proves nothing').toBeGreaterThan(5);
    expect(outcome).not.toBe('victory');
    expect(legHp, 'the win condition was never seriously touched').toBeGreaterThan(0);
    for (const id of ['node-a', 'node-b', 'node-c']) {
      expect(state.combatants[id]?.alive, `${id} is not meant to be killable`).toBe(true);
    }
  });
});


/**
 * The three mechanics this round switched on, pinned so they cannot go quiet
 * again. Each of them was written by the data layer and read by nobody, which
 * is a failure mode no type-check and no grep catches — only running the engine
 * does, so each of these drives a real battle and reads the event log.
 */
describe('the canon mechanics the chapter is balanced around actually fire', () => {
  /**
   * §6.4: Darkness costs "**12.5% (1/8) of user's max HP**"
   * `[verified: 2 sources]`, and §7.1 calls that its entire downside. The cost
   * is emitted as a `damage` event on the caster at the head of her own action,
   * so it is visible in the log exactly once per cast.
   */
  it("charges Darkness's 12.5%-max-HP cost to the caster", () => {
    const engine = new FFX2Engine(engineOptions());
    engine.setSeed(7);
    engine.init({
      game: 'ffx2',
      party: farplaneBuild,
      enemies: data.ENEMY_GROUPS_BY_ID['vegnagun-tail']!,
      triggers: [],
      seed: 7,
      condition: 'normal',
      canEscape: false,
    });
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
    }

    const state = engine.state();
    const log = state.log as unknown as Array<Record<string, unknown>>;
    for (const who of ['rikku', 'paine']) {
      const cost = Math.floor(state.combatants[who]!.stats.maxHp / 8);
      const cast = log.filter(
        (e) => e['type'] === 'action-start' && e['actorId'] === who && e['abilityName'] === 'Darkness',
      ).length;
      const paid = log.filter(
        (e) => e['type'] === 'damage' && e['targetId'] === who && Number(e['amount']) === cost,
      ).length;
      console.log(`${who}: ${cast} Darkness casts, ${paid} payments of ${cost} HP`);
      expect(cast, `${who} must actually have cast Darkness, or this proves nothing`).toBeGreaterThan(0);
      // One cast may still be on the purple bar when the battle ends, so the
      // payments can trail the casts by one, never more, and never lead them.
      expect(paid).toBeLessThanOrEqual(cast);
      expect(paid).toBeGreaterThanOrEqual(cast - 1);
    }
  });

  /**
   * §3.3 on the Bulwarks: "**the retaliation mechanic (this is the fight's
   * whole identity)**". The Core logs whoever hit it and the mitigation class;
   * the Bulwarks answer in kind on their next turn. Darkness is the NONE class
   * (§6.4 "Special damage"), so the answer is the single-target buff-strip,
   * "Hostile activity detected" — 3/16 of the attacker's max HP and MP.
   */
  it('answers a hit on the Core with a Bulwark retaliation', () => {
    const engine = new FFX2Engine(engineOptions());
    engine.setSeed(7);
    engine.init({
      game: 'ffx2',
      party: farplaneBuild,
      enemies: data.ENEMY_GROUPS_BY_ID['vegnagun-body']!,
      triggers: [],
      seed: 7,
      condition: 'normal',
      canEscape: false,
    });
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
    }
    const names = (engine.state().log as unknown as Array<Record<string, unknown>>)
      .filter((e) => e['type'] === 'action-start')
      .map((e) => String(e['abilityName']));
    const retaliations = names.filter((n) => n.endsWith('detected'));
    console.log(`Bulwark retaliations in one Body fight: ${retaliations.length}`);
    expect(retaliations.length, '§3.3 calls this the fight\u2019s whole identity').toBeGreaterThan(0);
  });

  /**
   * ffx2-combat-core §5.5: "Turbo Ether — recovers **500 MP**". §6.8 puts six
   * of them in the Chapter 5 bag, which is the healer's only MP refill in five
   * battles with no menu between them.
   */
  it('gives the MP back when a Turbo Ether is used', () => {
    const engine = new FFX2Engine(engineOptions());
    engine.setSeed(3);
    engine.init({
      game: 'ffx2',
      party: farplaneBuild,
      enemies: data.ENEMY_GROUPS_BY_ID['vegnagun-tail']!,
      triggers: [],
      seed: 3,
      condition: 'normal',
      canEscape: false,
    });

    let spent = false;
    let drank = false;
    let after = 0;
    // The Item row has a charge bar, so the battle has to keep running for a
    // few more decisions after the pick before the Turbo Ether resolves.
    for (let i = 0; i < MAX_DECISIONS && (!drank || after++ < 40); i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      const yuna = engine.state().combatants['yuna']!;
      const dry = yuna.mp < yuna.stats.maxMp;
      const ether = d.commands.find(
        (c) => c.enabled && c.label === 'Turbo Ether' && c.validTargets.includes('yuna'),
      );
      if (dry && ether && !drank) {
        engine.submit({ ...ether.command, targets: ['yuna'] } as Command);
        drank = true;
        continue;
      }
      // Burn a little of Yuna's MP first, so there is something to give back.
      const shell = d.commands.find((c) => c.enabled && c.label === 'Shell');
      if (!spent && d.actorId === 'yuna' && shell) {
        spent = true;
        engine.submit({ ...shell.command, targets: ['yuna'] } as Command);
        continue;
      }
      engine.submit(intendedStrategy(d.actorId, d.commands, engine) ?? fallback(d));
    }

    const refills = (engine.state().log as unknown as Array<Record<string, unknown>>).filter(
      (e) => e['type'] === 'mp-heal' && e['targetId'] === 'yuna' && Number(e['amount']) > 0,
    );
    const yuna = engine.state().combatants['yuna']!;
    console.log(`Turbo Ether used: ${drank}; mp-heal events: ${refills.length}; Yuna ${yuna.mp}/${yuna.stats.maxMp}`);
    expect(drank, 'the Item menu must offer the Turbo Ether the build ships').toBe(true);
    expect(refills.length, '\u00a75.5: a Turbo Ether recovers 500 MP').toBeGreaterThan(0);
    expect(yuna.mp).toBe(yuna.stats.maxMp);
  });
});
