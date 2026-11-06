/**
 * Spherimorph's line (FFX only; `src/engine/tactics/spherimorph.ts`): the first menu's NEXT BEST MOVE card, the strategy guide's NEXT line and the auto-battler all play it. The fight is a puzzle (a blind cast feeds the
 * boss and loses; `spherimorph-bench.test.ts`), so the generic ladder, which cannot read the one clue the game gives, is not enough: this line reads the spell Spherimorph answers a plain blow with and casts its opposite.
 *
 * What is pinned: where the line is found (FFX only, the boss's id), the clue read from the log the way a player reads the screen (never from the script's state), each rule on a real board, that the line equals the
 * bench's advisor decision for decision (so the 200-seed table is its table), and what the card and the auto-battler win (the real chapter flow, `critic/bench/advisor-v3/drive.ts`).
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { SPHERIMORPH_BOSS_IDS, clueOf, spherimorph } from '../../../src/engine/tactics/spherimorph.ts';
import { runChapter, type DecisionContext } from '../../../critic/bench/advisor-v3/drive.ts';
import { play } from '../helpers/spherimorphBot.ts';
import { SM, actor, give, inputFor, log, newEngine, setState, sm, type Input } from '../helpers/spherimorphDrive.ts';

const FRONT = ['tidus', 'yuna', 'lulu'] as const;
const chapter = () => {
  const c = getChapter('spherimorph');
  if (!c) throw new Error('Spherimorph is not registered');
  return c;
};

/** A board with nothing wrong: everyone at full HP and no status, so a rule is read alone. */
function clean(engine: BattleEngine): void {
  for (const id of FRONT) {
    const c = actor(engine, id);
    for (const status of ['silence', 'confuse', 'darkness', 'sleep', 'haste', 'shell', 'protect', 'reflect']) delete (c.statuses as Record<string, unknown>)[status];
    c.hp = c.stats.maxHp;
  }
}

/** Put one of its answers in the log, the way the engine would (an `action-start` of Spherimorph's), so the line reads a clue. */
function answer(engine: BattleEngine, abilityId: string): void {
  (log(engine) as BattleEvent[]).push({ type: 'action-start', actorId: SM, command: { kind: 'ability', id: abilityId, targets: ['tidus'] }, abilityId, abilityName: abilityId, targets: ['tidus'], seq: 9_000 } as unknown as BattleEvent);
}

const command = (engine: BattleEngine, d: Input): Command | null => spherimorph(d.actorId, d.commands, engine);
const idOf = (c: Command | null): string | null => (c !== null && 'id' in c ? String((c as { id?: unknown }).id) : null);
const targetOf = (c: Command | null): string | undefined => (c === null ? undefined : (c.targets as string[])[0]);

describe('where the line is found: FFX only, on the guardian\'s own board', () => {
  it('is registered under the chapter and the boss\'s id, and tacticFor finds it on the chapter\'s board', () => {
    expect(SPHERIMORPH_BOSS_IDS).toEqual(['spherimorph']);
    expect(TACTICS.filter((t) => t.chapterId === 'spherimorph').map((t) => [t.bossId, t.tactic])).toEqual([['spherimorph', spherimorph]]);
    expect(tacticFor(newEngine(1))).toBe(spherimorph);
  });

  it('is not reached by an FFX-2 board that fields a combatant with the same id, or by an FFX board without it (the game gate of lookup.ts)', () => {
    const board = (game: string, ids: string[]) => ({ state: () => ({ game, combatants: Object.fromEntries(ids.map((id) => [id, { id, side: id === 'yuna' ? 'party' : 'enemy' }])) }) }) as unknown as BattleEngine;
    expect(tacticFor(board('ffx2', ['yuna', 'spherimorph']))).not.toBe(spherimorph);
    expect(tacticFor(board('ffx', ['yuna', 'seymour-flux']))).not.toBe(spherimorph);
  });
});

describe('the clue is read from the log, the way a player reads the screen', () => {
  const start = (actorId: string, abilityId?: string): BattleEvent => ({ type: 'action-start', actorId, abilityId, command: { kind: 'ability', id: abilityId ?? '', targets: [] }, targets: [] } as unknown as BattleEvent);

  it('none before it has answered; the element of its latest answer; none again once an Elemental Shift came after it', () => {
    expect(clueOf([])).toBeNull();
    expect(clueOf([start(SM, 'attack')])).toBeNull(); // its own Attack is not an answer
    expect(clueOf([start(SM, 'blizzard')])).toBe('ice'); // the player-side spell on the attacker
    expect(clueOf([start(SM, 'spherimorph-water')])).toBe('water'); // the monster-side spell on the line
    expect(clueOf([start(SM, 'fire'), start(SM, 'spherimorph-elemental-shift')])).toBeNull();
    expect(clueOf([start(SM, 'fire'), start(SM, 'spherimorph-elemental-shift'), start(SM, 'thunder')])).toBe('lightning');
    expect(clueOf([start('lulu', 'fire')])).toBeNull(); // a spell cast BY the party is not its answer
  });

  it('on a real fight: the answer to a plain blow is the opposite of the weakness, in each of the four states', () => {
    const expected: Record<number, string> = { 0: 'ice', 1: 'fire', 2: 'water', 3: 'lightning' };
    for (let state = 0; state < 4; state++) {
      const engine = newEngine(30 + state);
      setState(engine, state);
      const d = inputFor(engine, 'tidus');
      const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack')!;
      engine.submit({ ...swing.command, targets: [SM] } as Command);
      for (let i = 0; i < 6; i++) if (engine.nextDecision().kind === 'player-input') break;
      expect(clueOf(log(engine)), `state ${state}`).toBe(expected[state]);
    }
  });
});

describe('each rule, on the real engine\'s first menus', () => {
  it('Tidus: no clue, a plain blow (null: the generic swing); a clue known, Haste on Lulu once, then wait', () => {
    const engine = newEngine(1);
    clean(engine);
    const d = inputFor(engine, 'tidus');
    expect(command(engine, d)).toBeNull(); // probe: the swing
    answer(engine, 'blizzard');
    const haste = command(engine, d);
    expect([idOf(haste), targetOf(haste)]).toEqual(['haste', 'lulu']);
    give(actor(engine, 'lulu'), 'haste');
    expect(command(engine, d)?.kind).toBe('defend');
  });

  it('Lulu: no clue, Focus up to two stacks then wait; a clue, the opposite element at the highest tier (Fira for an Ice answer, Blizzara for Fire, Thundara for Water, Watera for Thunder)', () => {
    const engine = newEngine(2);
    clean(engine);
    const d = inputFor(engine, 'lulu');
    const focus = command(engine, d);
    expect([idOf(focus), focus?.kind]).toEqual(['focus', 'ability']);
    for (const [clue, cast] of [['blizzard', 'fira'], ['fire', 'blizzara'], ['water', 'thundara'], ['thunder', 'watera']] as const) {
      const fresh = newEngine(2);
      clean(fresh);
      const menu = inputFor(fresh, 'lulu');
      answer(fresh, clue);
      const pick = command(fresh, menu);
      expect([idOf(pick), targetOf(pick)], `clue ${clue}`).toEqual([cast, SM]);
    }
    // a shift after the clue makes it stale again
    const stale = newEngine(2);
    clean(stale);
    const menu = inputFor(stale, 'lulu');
    answer(stale, 'blizzard');
    answer(stale, 'spherimorph-elemental-shift');
    expect(idOf(command(stale, menu))).toBe('focus');
  });

  it('Lulu never casts without a clue, and never probes: with Focus at two stacks she waits', () => {
    const engine = newEngine(2);
    clean(engine);
    const d = inputFor(engine, 'lulu');
    (actor(engine, 'lulu').statuses as Record<string, unknown>)['focus'] = { id: 'focus', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 2, permanent: false };
    expect(command(engine, d)?.kind).toBe('defend');
  });

  it('Yuna: Cure for one hurt, Cura for two; Protect on the bare once it is under half; otherwise she waits', () => {
    const engine = newEngine(3);
    clean(engine);
    const d = inputFor(engine, 'yuna');
    expect(command(engine, d)?.kind).toBe('defend');
    actor(engine, 'tidus').hp = Math.floor(actor(engine, 'tidus').stats.maxHp * 0.4);
    const one = command(engine, d);
    expect([idOf(one), targetOf(one)]).toEqual(['cure', 'tidus']);
    actor(engine, 'lulu').hp = Math.floor(actor(engine, 'lulu').stats.maxHp * 0.3);
    const two = command(engine, d);
    expect([idOf(two), targetOf(two)]).toEqual(['cura', 'lulu']); // the worst hurt first
    clean(engine);
    sm(engine).hp = 5_000;
    const protect = command(engine, d);
    expect([idOf(protect), targetOf(protect)]).toEqual(['protect', 'tidus']);
    for (const id of FRONT) give(actor(engine, id), 'protect');
    expect(command(engine, d)?.kind).toBe('defend');
  });

  it('the skeleton comes first: Phoenix Down for the fallen', () => {
    const engine = newEngine(4);
    clean(engine);
    const d = inputFor(engine, 'tidus');
    const lulu = actor(engine, 'lulu');
    lulu.alive = false;
    lulu.hp = 0;
    const raise = command(engine, d);
    expect([raise?.kind, idOf(raise), targetOf(raise)]).toEqual(['item', 'phoenix-down', 'lulu']);
  });

  it('a hurt member is mended by a potion from someone else only when under a third, and by Yuna from 55 percent', () => {
    const engine = newEngine(5);
    clean(engine);
    const d = inputFor(engine, 'tidus');
    actor(engine, 'lulu').hp = Math.floor(actor(engine, 'lulu').stats.maxHp * 0.5);
    expect(command(engine, d)).toBeNull(); // Yuna will cure her; Tidus probes
    actor(engine, 'lulu').hp = Math.floor(actor(engine, 'lulu').stats.maxHp * 0.3);
    const potion = command(engine, d);
    expect([potion?.kind, targetOf(potion)]).toEqual(['item', 'lulu']);
  });

  it('there is no line when the guardian is down, or when the actor is not the party\'s', () => {
    const engine = newEngine(1);
    clean(engine);
    const d = inputFor(engine, 'tidus');
    expect(spherimorph(SM, d.commands, engine)).toBeNull();
    sm(engine).hp = 0;
    sm(engine).alive = false;
    expect(command(engine, d)).toBeNull();
  });
});

describe('Auron in front (the alternative line): Armor Break once, then he swings', () => {
  it('casts Armor Break at the boss while it is whole, and nothing once it is broken', async () => {
    const { buildWith } = await import('../helpers/spherimorphBot.ts');
    const engine = newEngine(2, buildWith(['tidus', 'auron', 'lulu']));
    const d = inputFor(engine, 'auron');
    const brk = command(engine, d);
    expect([idOf(brk), targetOf(brk)]).toEqual(['armor-break', SM]);
    give(sm(engine), 'armor-break');
    expect(command(engine, d)).toBeNull();
  });
});

describe('the line is the bench\'s advisor, decision for decision (so the 200-seed table of record is its table)', () => {
  it('seeds 1 to 3: the fight played by the line (an Attack where it has no opinion) ends the way the bench\'s advisor ends it', () => {
    for (const seed of [1, 2, 3]) {
      const bench = play(seed, 'advisor');
      const engine = newEngine(seed);
      let outcome = 'stalled';
      for (let i = 0; i < 12_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome === 'victory' ? 'victory' : 'defeat';
          break;
        }
        if (d.kind !== 'player-input') continue;
        const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(SM));
        const pick = spherimorph(d.actorId, d.commands, engine) ?? (['tidus', 'auron', 'wakka', 'kimahri', 'rikku'].includes(d.actorId) && swing ? ({ ...swing.command, targets: [SM] } as Command) : { kind: 'defend', targets: [] });
        engine.submit(pick as Command);
      }
      expect(outcome, `seed ${seed}`).toBe(bench.outcome);
      expect(engine.state().ticks, `seed ${seed}`).toBe(bench.ticks);
      expect(sm(engine).hp, `seed ${seed}`).toBe(bench.hp);
    }
  }, 120_000);
});

/** Run the chapter's real flow with `pick` as the player. */
async function wins(seeds: number[], pick: (ctx: DecisionContext) => Command | null): Promise<number> {
  let n = 0;
  for (const seed of seeds) if ((await runChapter(chapter(), seed, pick)).outcome === 'victory') n += 1;
  return n;
}
const cardOf = (ctx: DecisionContext): Command | null => buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, ctx.advisorOptions)?.suggestions[0]?.command ?? null;

describe('the first menu\'s card follows the line', () => {
  it('the first card of seeds 1 to 3 is the line\'s own pick for that actor, and names a row the actor can press', async () => {
    clearAdvisorCache();
    for (const seed of [1, 2, 3]) {
      let first: { card: Command | null; line: Command | null; actor: string } | null = null;
      await runChapter(chapter(), seed, (ctx) => {
        first ??= { card: cardOf(ctx), line: intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never), actor: ctx.decision.actorId };
        return first.card;
      });
      const f = first as { card: Command | null; line: Command | null; actor: string } | null;
      expect(f, `seed ${seed}`).not.toBeNull();
      expect(f!.card, `seed ${seed}: the card is silent`).not.toBeNull();
      expect(JSON.stringify(f!.card), `seed ${seed}`).toBe(JSON.stringify(f!.line));
    }
  }, 120_000);

  it('a player who presses the card, and the auto-battler, win at least 7 of the first 8 seeds', async () => {
    clearAdvisorCache();
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    const card = await wins(seeds, cardOf);
    const line = await wins(seeds, (ctx) => intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never));
    expect(card).toBeGreaterThanOrEqual(7);
    expect(line).toBeGreaterThanOrEqual(7);
  }, 300_000);
});
