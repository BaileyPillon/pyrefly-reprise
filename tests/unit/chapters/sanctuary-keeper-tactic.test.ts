/**
 * The Sanctuary Keeper's line (FFX only; `src/engine/tactics/sanctuary-keeper.ts`), added by the release review's M1: the first menu's NEXT BEST MOVE card named a plain Attack, the one line that
 * loses this fight (0 of 200 on the bench), because the chapter had no line for the card to follow. The line is the bench's **advisor** (`tests/unit/helpers/sanctuaryBot.ts`) moved into the game.
 *
 * What is pinned: where the line is found (FFX only, the Keeper's id), each rule on a real board, that the line equals the bench's advisor decision for decision (so the 200-seed table is its table), and what
 * the card and the auto-battler win now (measured by `critic/bench/r59-advisor/sweep.ts`, 400 seeds: the card won 0 of 40 before the line existed).
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleState, Command } from '../../../src/battle/common/types.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { lineFirstOn } from '../../../src/engine/tactics/advisor-line.ts';
import { TACTICS, tacticFor } from '../../../src/engine/tactics/index.ts';
import { SANCTUARY_KEEPER_BOSS_IDS, sanctuaryKeeper } from '../../../src/engine/tactics/sanctuary-keeper.ts';
import { runChapter, type DecisionContext } from '../../../critic/bench/advisor-v3/drive.ts';
import { LINES, play } from '../helpers/sanctuaryBot.ts';
import { KEEPER, actor, give, inputFor, keeper, newEngine, type Input } from '../helpers/sanctuaryDrive.ts';

const FRONT = ['tidus', 'yuna', 'auron'] as const;
const chapter = () => {
  const c = getChapter('sanctuary-keeper');
  if (!c) throw new Error('the Sanctuary Keeper is not registered');
  return c;
};

/** A board with no leftovers of Photon Wings: nobody ailing, everyone at full HP, so a rule is read alone. */
function clean(engine: BattleEngine): void {
  for (const id of FRONT) {
    const c = actor(engine, id);
    for (const status of ['silence', 'confuse', 'darkness', 'sleep', 'curse', 'haste', 'shell', 'protect', 'reflect']) delete (c.statuses as Record<string, unknown>)[status];
    c.hp = c.stats.maxHp;
  }
}
/**
 * The first seed on which `who` is offered `row` at his first menu: Photon Wings rolls Silence on a third of the line at the very first cast, and a silenced caster's menu has no spells, so a rule that needs a spell reads a
 * seed where the actor can cast it. (A seed on which Photon Wings leaves the line unable to act has no such menu and is skipped.)
 */
function menuWith(who: string, row: string, kind = 'ability'): { engine: ReturnType<typeof newEngine>; d: Input } {
  for (let seed = 1; seed <= 60; seed++) {
    try {
      const engine = newEngine(seed);
      const d = inputFor(engine, who);
      if (d.commands.some((c) => c.enabled && c.command.kind === kind && 'id' in c.command && c.command.id === row)) return { engine, d };
    } catch {
      /* the fight ended before the actor's turn on this seed: try the next */
    }
  }
  throw new Error(`no seed offers ${who} the row ${row}`);
}
const command = (engine: BattleEngine, d: Input): Command | null => sanctuaryKeeper(d.actorId, d.commands, engine);
const idOf = (c: Command | null): string | null => (c !== null && 'id' in c ? String((c as { id?: unknown }).id) : null);
const targetOf = (c: Command | null): string | undefined => (c === null ? undefined : (c.targets as string[])[0]);

describe('where the line is found: FFX only, on the Keeper\'s own board', () => {
  it('is registered under the chapter and the Keeper\'s id, and tacticFor finds it on the chapter\'s board', () => {
    expect(SANCTUARY_KEEPER_BOSS_IDS).toEqual(['sanctuary-keeper']);
    expect(TACTICS.filter((t) => t.chapterId === 'sanctuary-keeper').map((t) => [t.bossId, t.tactic])).toEqual([['sanctuary-keeper', sanctuaryKeeper]]);
    expect(tacticFor(newEngine(1))).toBe(sanctuaryKeeper);
  });

  it('is not reached by an FFX-2 board that fields a combatant with the same id, or by an FFX board without the Keeper (the game gate of lookup.ts)', () => {
    const board = (game: string, ids: string[]) => ({ state: () => ({ game, combatants: Object.fromEntries(ids.map((id) => [id, { id, side: id === 'yuna' ? 'party' : 'enemy' }])) }) }) as unknown as BattleEngine;
    expect(tacticFor(board('ffx2', ['yuna', 'sanctuary-keeper']))).not.toBe(sanctuaryKeeper);
    expect(tacticFor(board('ffx', ['yuna', 'seymour-flux']))).not.toBe(sanctuaryKeeper);
  });
});

describe('each rule, on the real engine\'s first menus', () => {
  it('Tidus: Hastega on himself while two of the line are not hasted; a Poison Fang at the Keeper once the line is hasted (Lulu is not in front)', () => {
    const { engine, d } = menuWith('tidus', 'hastega');
    clean(engine);
    const cast = command(engine, d);
    expect([idOf(cast), targetOf(cast)]).toEqual(['hastega', 'tidus']);
    for (const id of FRONT) give(actor(engine, id), 'haste');
    const fang = command(engine, d);
    expect([fang?.kind, idOf(fang), targetOf(fang)]).toEqual(['item', 'poison-fang', KEEPER]);
    give(keeper(engine), 'poison');
    expect(command(engine, d)).toBeNull(); // nothing left for him: he swings
  });

  it('Yuna: Reflect only after the poison (a reflected Bio bounces back on its caster), then Dispel on a party Reflect once it is under half, then Shell, then Protect', () => {
    const { engine, d } = menuWith('yuna', 'dispel');
    clean(engine);
    // Poison is still to come (Tidus's Fang): Shell on the first bare member, not Reflect.
    const first = command(engine, d);
    expect([idOf(first), targetOf(first)]).toEqual(['shell', 'tidus']);
    give(keeper(engine), 'poison');
    const reflect = command(engine, d);
    expect([idOf(reflect), targetOf(reflect)]).toEqual(['reflect', KEEPER]);
    give(keeper(engine), 'reflect');
    const shell = command(engine, d);
    expect([idOf(shell), targetOf(shell)]).toEqual(['shell', 'tidus']);
    // Under half, with Reflect on the Keeper and a member holding Reflect, the member is Dispelled (the Reflect trick of the script, RE 4.2).
    keeper(engine).hp = Math.floor(keeper(engine).stats.maxHp / 2) - 1;
    give(actor(engine, 'auron'), 'reflect');
    const dispel = command(engine, d);
    expect([idOf(dispel), targetOf(dispel)]).toEqual(['dispel', 'auron']);
    delete (actor(engine, 'auron').statuses as Record<string, unknown>)['reflect'];
    for (const id of FRONT) give(actor(engine, id), 'shell');
    const protect = command(engine, d);
    expect([idOf(protect), targetOf(protect)]).toEqual(['protect', 'tidus']);
  });

  it('Auron: Armor Break while the Keeper is whole; nothing once it is broken', () => {
    const { engine, d } = menuWith('auron', 'armor-break');
    clean(engine);
    const brk = command(engine, d);
    expect([idOf(brk), targetOf(brk)]).toEqual(['armor-break', KEEPER]);
    give(keeper(engine), 'armor-break');
    expect(command(engine, d)).toBeNull();
  });

  it('the skeleton comes first: Phoenix Down for the fallen, Echo Screen for the Silence of Yuna, a Remedy or Eye Drops where the actor has no Esuna', () => {
    const { engine, d } = menuWith('tidus', 'hastega');
    clean(engine);
    const auron = actor(engine, 'auron');
    auron.alive = false;
    auron.hp = 0;
    const raise = command(engine, d);
    expect([raise?.kind, idOf(raise), targetOf(raise)]).toEqual(['item', 'phoenix-down', 'auron']);
    auron.alive = true;
    auron.hp = auron.stats.maxHp;
    give(actor(engine, 'yuna'), 'silence');
    const screen = command(engine, d);
    expect([screen?.kind, idOf(screen), targetOf(screen)]).toEqual(['item', 'echo-screen', 'yuna']);
    delete (actor(engine, 'yuna').statuses as Record<string, unknown>)['silence'];
    give(actor(engine, 'auron'), 'confuse');
    const remedy = command(engine, d); // Tidus's menu has no Esuna
    expect([remedy?.kind, idOf(remedy), targetOf(remedy)]).toEqual(['item', 'remedy', 'auron']);
    delete (actor(engine, 'auron').statuses as Record<string, unknown>)['confuse'];
    give(actor(engine, 'auron'), 'darkness');
    const drops = command(engine, d);
    expect([drops?.kind, idOf(drops), targetOf(drops)]).toEqual(['item', 'eye-drops', 'auron']);
  });

  it('the skeleton on Yuna\'s menu: Esuna for Confuse, Curaga for anyone under 70 percent (the worst hurt first)', () => {
    const { engine, d } = menuWith('yuna', 'esuna');
    clean(engine);
    give(actor(engine, 'auron'), 'confuse');
    const esuna = command(engine, d);
    expect([esuna?.kind, idOf(esuna), targetOf(esuna)]).toEqual(['ability', 'esuna', 'auron']);
    delete (actor(engine, 'auron').statuses as Record<string, unknown>)['confuse'];
    const tidus = actor(engine, 'tidus');
    tidus.hp = Math.floor(tidus.stats.maxHp * 0.6);
    const auron = actor(engine, 'auron');
    auron.hp = Math.floor(auron.stats.maxHp * 0.4);
    const mend = command(engine, d);
    expect([mend?.kind, idOf(mend), targetOf(mend)]).toEqual(['ability', 'curaga', 'auron']);
  });

  it('a silenced caster does not cast (he cures himself by item), and there is no line when the Keeper is down or the actor is not the party\'s', () => {
    const { engine, d } = menuWith('tidus', 'hastega');
    clean(engine);
    give(actor(engine, 'tidus'), 'silence');
    const silenced = command(engine, d);
    expect([silenced?.kind, idOf(silenced), targetOf(silenced)]).toEqual(['item', 'echo-screen', 'tidus']);
    delete (actor(engine, 'tidus').statuses as Record<string, unknown>)['silence'];
    keeper(engine).hp = 0;
    keeper(engine).alive = false;
    expect(command(engine, d)).toBeNull();
    expect(sanctuaryKeeper(KEEPER, d.commands, engine)).toBeNull();
  });
});

describe('the line is the bench\'s advisor, decision for decision (so the 200-seed table of record is its table)', () => {
  it('seeds 1 to 3: the fight played by the line (an Attack where it has no opinion) ends the way the bench\'s advisor ends it', () => {
    for (const seed of [1, 2, 3]) {
      const bench = play(seed, LINES['advisor']!);
      const engine = newEngine(seed);
      let outcome = 'stalled';
      for (let i = 0; i < 12_000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') {
          outcome = d.result.outcome === 'victory' ? 'victory' : 'defeat';
          break;
        }
        if (d.kind !== 'player-input') continue;
        const swing = d.commands.find((c) => c.enabled && c.command.kind === 'attack' && c.validTargets.includes(KEEPER));
        engine.submit(sanctuaryKeeper(d.actorId, d.commands, engine) ?? (swing ? ({ ...swing.command, targets: [KEEPER] } as Command) : { kind: 'defend', targets: [] }));
      }
      expect(outcome, `seed ${seed}`).toBe(bench.outcome);
      expect(engine.state().ticks, `seed ${seed}`).toBe(bench.ticks);
      expect(keeper(engine).hp, `seed ${seed}`).toBe(bench.hp);
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

describe('M1: the first menu\'s card follows the line (it named a plain Attack, which wins 0 of 200)', () => {
  it('the first card of seeds 1 to 3 is the line\'s opening move, not a plain Attack, and it names a row the actor can press', async () => {
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
      expect(f!.card!.kind, `seed ${seed}: the card names a plain ${f!.card!.kind} from ${f!.actor}`).not.toBe('attack');
      expect(JSON.stringify(f!.card), `seed ${seed}`).toBe(JSON.stringify(f!.line));
    }
  }, 120_000);

  it('the card is not the "line first" board of the shipped chapters: the registered line is what feeds it, and the ranking may still outrank it (the sweep: the card wins more than the line)', async () => {
    let flag: boolean | null = null;
    await runChapter(chapter(), 1, (ctx) => {
      flag ??= lineFirstOn(ctx.state as BattleState, ctx.advisorOptions);
      return cardOf(ctx);
    });
    expect(flag).toBe(false);
  }, 120_000);

  it('a player who presses the card wins about three fights in four now, and the auto-battler about two in three (the sweep, seeds 1 to 400); on seeds 1 to 8 the bounds are wide', async () => {
    clearAdvisorCache();
    const seeds = [1, 2, 3, 4, 5, 6, 7, 8];
    const card = await wins(seeds, cardOf);
    const line = await wins(seeds, (ctx) => intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never));
    expect(card, 'before the line existed the card won 0 of 40').toBeGreaterThanOrEqual(3);
    expect(line).toBeGreaterThanOrEqual(3);
  }, 300_000);
});
