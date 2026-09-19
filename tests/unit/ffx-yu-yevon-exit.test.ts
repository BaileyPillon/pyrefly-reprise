/**
 * Critic round 02 #17 — **Yu Yevon was an infinite battle with no exit.**
 *
 * He counters every damaging player action with a 9,999 Curaga, the two Yu
 * Pagodas put ~4,500 back between his turns, and from the possessed-aeon fights
 * onward the party carries a permanent fayth Auto-Life that the research calls
 * "Cannot lose" in as many words. Measured on the shipped board with Defend on
 * every decision: **40,000 steps, 25,364 turns, no `battle-over`**, the boss
 * parked at an equilibrium of 6,001 of 99,999.
 *
 * `research/ffx-bfa-yu-yevon.md` §3.5 lists five ways the real fight ends. Two
 * of them did not exist in this engine:
 *
 *  * **Doom.** "A Candle of Life kills him in exactly 3 turns"
 *    `[verified: 2 sources]`, and `doomTurns: 3` sat on his record with no
 *    reader, while the Candle's own `duration: 254` is a placeholder its
 *    comment names as one. The Candle landed and nothing happened.
 *  * **Reflect on him**, "his Curaga bounces onto the party instead" — but the
 *    `reflect` spell was authored `single-ally` on an `[estimate]`, so it could
 *    not be aimed at an enemy at all.
 *
 * And behind those, a stalemate guard, because a battle that can be neither won
 * nor lost has to end somewhere other than the pause menu.
 *
 * None of it makes him weaker: his HP, his Curaga, his Gravija and his
 * escalation are untouched.
 */

import { describe, expect, it } from 'vitest';
import type { AvailableCommand, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../src/data/ffx/index.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';

const BOSS = 'yu-yevon';
const MAX_DECISIONS = 40_000;

function newEngine(seed: number) {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const group = ENEMY_GROUPS_BY_ID[BOSS];
  if (!group) throw new Error('yu-yevon group missing from the data layer');
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({ game: 'ffx', party: dreamsEndBuild, enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
  return engine;
}

interface RouteRun {
  outcome: string | undefined;
  turns: number;
  used: number;
  bossHp: number;
  decisions: number;
}

/**
 * Play one §3.5 route: bench-swap `bring` in if it is named, use `labels` on
 * him until `status` is on him, and finish him once Gravija has taken him
 * under the swing threshold.
 */
function runRoute(seed: number, opts: { bring?: string; labels?: string[]; status?: string; finishBelow?: number }): RouteRun {
  const engine = newEngine(seed);
  const run: RouteRun = { outcome: undefined, turns: 0, used: 0, bossHp: 0, decisions: 0 };
  const labels = opts.labels ?? [];

  for (let i = 0; i < MAX_DECISIONS; i++) {
    run.decisions++;
    const d: Decision = engine.nextDecision();
    if (d.kind === 'battle-over') {
      run.outcome = d.result.outcome;
      run.turns = d.result.turns;
      break;
    }
    if (d.kind !== 'player-input') continue;
    const state = engine.state();
    const boss = state.combatants[BOSS];
    const onHim = opts.status ? Boolean((boss?.statuses as Record<string, unknown>)[opts.status]) : false;

    if (!onHim && labels.length > 0) {
      const row: AvailableCommand | undefined = d.commands.find(
        (c) => c.enabled && labels.includes(c.label) && c.validTargets.includes(BOSS),
      );
      if (row) {
        run.used++;
        engine.submit({ ...row.command, targets: [BOSS] } as Command);
        continue;
      }
      if (opts.bring && !state.activeIds.includes(opts.bring)) {
        const swap = d.commands.find(
          (c) => c.enabled && c.command.kind === 'switch' && c.label.toLowerCase() === opts.bring,
        );
        if (swap) {
          engine.submit(swap.command as Command);
          continue;
        }
      }
    }

    const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(BOSS));
    if (swing && (boss?.hp ?? 0) <= (opts.finishBelow ?? 0)) {
      engine.submit({ ...swing.command, targets: [BOSS] } as Command);
      continue;
    }
    engine.submit({ kind: 'defend', targets: [] });
  }
  run.bossHp = engine.state().combatants[BOSS]?.hp ?? -1;
  return run;
}

describe('#17 Yu Yevon ends [ffx-bfa-yu-yevon §3.5]', () => {
  it('Doom kills him in three of his own turns, off one Candle of Life', () => {
    const run = runRoute(1, { labels: ['Candle of Life'], status: 'doom' });
    console.log('doom route:', JSON.stringify(run));
    expect(run.used, 'the chapter ships exactly one Candle').toBe(1);
    expect(run.outcome).toBe('victory');
    expect(run.bossHp).toBe(0);
    // Three of *his* turns, not three party turns — he acts roughly every 36
    // ticks (§3.4.2), so the party gets several turns in between.
    expect(run.turns, 'a 254-turn placeholder countdown killed nobody').toBeLessThan(40);
  });

  it("the Doom countdown is the enemy's own, not the item's placeholder", () => {
    const engine = newEngine(1);
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const candle = d.commands.find((c) => c.enabled && c.label === 'Candle of Life' && c.validTargets.includes(BOSS));
      if (!candle) {
        engine.submit({ kind: 'defend', targets: [] });
        continue;
      }
      engine.submit({ ...candle.command, targets: [BOSS] } as Command);
      const doom = (engine.state().combatants[BOSS]?.statuses as Record<string, { turnsRemaining: number | null }>)['doom'];
      // `EnemyFields.doomTurns` is 3 on his record; the Candle's own
      // `statusEffects` duration is a documented placeholder of 254.
      expect(doom?.turnsRemaining).toBe(3);
      return;
    }
    throw new Error('the Candle of Life was never offered against him');
  });

  it('Poison is 10% of 99,999 a tick and he never counters it', () => {
    // §3.1: `poisonTickPercent: 10`, and §3.4.1 excludes poison ticks from the
    // Curaga counter, so Lulu's Bio off the bench is a clean kill.
    const run = runRoute(1, { bring: 'lulu', labels: ['Bio'], status: 'poison' });
    console.log('poison route:', JSON.stringify(run));
    expect(run.outcome).toBe('victory');
    expect(run.bossHp).toBe(0);
  });

  it('Reflect can be aimed at him, and it is what stops the counter-heal', () => {
    // §3.5: "Cast Reflect on him; his Curaga bounces onto the party instead."
    // The spell was `single-ally`, so `validTargets` never contained him.
    const engine = newEngine(1);
    for (let i = 0; i < MAX_DECISIONS; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const spell = d.commands.find((c) => c.enabled && c.label === 'Reflect');
      if (!spell) {
        engine.submit({ kind: 'defend', targets: [] });
        continue;
      }
      expect(spell.validTargets, 'Reflect must be castable on the enemy').toContain(BOSS);
      engine.submit({ ...spell.command, targets: [BOSS] } as Command);
      expect((engine.state().combatants[BOSS]?.statuses as Record<string, unknown>)['reflect']).toBeDefined();
      return;
    }
    throw new Error('Reflect was never offered');
  });

  it('a party that does nothing at all still reaches an outcome', () => {
    // The critic's repro, verbatim: Defend on every decision. Before the
    // stalemate guard this ran 40,000 steps and 25,364 turns without ever
    // producing a `battle-over`.
    const run = runRoute(1, {});
    console.log('defend-only:', JSON.stringify(run));
    expect(run.outcome, 'the battle must end somewhere other than the pause menu').toBeDefined();
    expect(run.decisions).toBeLessThan(MAX_DECISIONS);
    // And it is not a *defeat*: §2.3's permanent Auto-Life means the party was
    // never in danger, so calling it one would be a lie about what happened.
    expect(run.outcome).toBe('escape');
    // He is left exactly as canon leaves him — at the Pagoda equilibrium, not
    // conveniently weakened.
    expect(run.bossHp).toBeGreaterThan(1_000);
  });
});
