/**
 * The NEXT BEST MOVE card of the hidden Spherimorph chapter (FFX only; the review of 2026-11-06, M1 and m4, and a leak the fix pass found): the card must not tell the player which element Spherimorph is weak to before
 * the game's own clue (the spell it answers a plain blow with) has. The card is the chapter's line (`src/engine/tactics/spherimorph.ts`) while the line names a row, but FFX's command window has no Defend row, so a
 * line that says "wait" cannot be printed and the card falls back to its own ranking, which SIMULATES each row on the live board and so reads the hidden state: with Lulu waiting (a stale clue, Focus at its old cap of
 * two) the ranking's top row was the very element it was weak to. The line now never waits with her (Focus, no cap); Tidus and Yuna do wait, and the ranking then shows a harmless row (Cheer, a Nul spell).
 *
 * What is pinned: (1) on boards of every kind (the first menu, a stale clue with Focus built up, a known clue, the Press half, a hurt member) the card of Tidus, Yuna and Lulu is the same in all four weakness states
 * (the weakness is set by hand on each board; the log, which is all a player sees, is the same); (2) in the real chapter flow, every decision of eight seeds: the card is the line, or the line waits and then the card is not
 * a cast or a throw at Spherimorph, and **at every one of those real mid-fight boards the card is the same whichever of the four weaknesses is set** (the weakness is flipped on the live engine and put back). Part (2) is the
 * one that catches the wait leak: the board it needs is a mid-fight one, and it was verified against the old cap of two Focus stacks, which it fails on (four leaks in eight seeds).
 */
import { describe, expect, it } from 'vitest';

import type { BattleEngine, BattleEvent, Command } from '../../../src/battle/common/types.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { liveAdvisorOptions, runChapter, type DecisionContext } from '../../../critic/bench/advisor-v3/drive.ts';
import { spherimorph as line } from '../../../src/engine/tactics/spherimorph.ts';
import { buildWith } from '../helpers/spherimorphBot.ts';
import { SM, actor, defend, flags, give, inputFor, log, newEngine, row, setState, sm } from '../helpers/spherimorphDrive.ts';

const FRONT = ['tidus', 'yuna', 'lulu'] as const;
const WEAK_STATES = [0, 1, 2, 3] as const;

const label = (c: Command | null): string => (c === null ? 'null' : `${c.kind}${'id' in c ? `:${String((c as { id?: unknown }).id)}` : ''}->${((c as { targets?: string[] }).targets ?? []).join('+')}`);

/** Put one of its answers in the log, the way the engine would, so the board has a known clue (the same whatever the weakness is). */
function answer(engine: BattleEngine, abilityId: string): void {
  (log(engine) as BattleEvent[]).push({ type: 'action-start', actorId: SM, command: { kind: 'ability', id: abilityId, targets: ['tidus'] }, abilityId, abilityName: abilityId, targets: ['tidus'], seq: 9_000 } as unknown as BattleEvent);
}

/** A board with nothing else wrong: full HP, no status that would end a moment about something else. */
function clean(engine: BattleEngine): void {
  for (const id of FRONT) {
    const c = actor(engine, id);
    for (const status of ['silence', 'confuse', 'darkness', 'sleep', 'haste', 'shell', 'protect', 'reflect', 'focus']) delete (c.statuses as Record<string, unknown>)[status];
    c.hp = c.stats.maxHp;
  }
}

const focus = (engine: BattleEngine, stacks: number): void => {
  (actor(engine, 'lulu').statuses as Record<string, unknown>)['focus'] = { id: 'focus', turnsRemaining: 254, ticksRemaining: null, charges: null, stacks, permanent: false };
};

/** The boards: a name and what to do to a fresh, cleaned engine at `who`'s first menu. */
const BOARDS: ReadonlyArray<{ name: string; prep: (e: BattleEngine) => void }> = [
  { name: 'the first menu (no clue yet)', prep: () => undefined },
  { name: 'a stale clue with Focus at two stacks (the old Defend of Lulu)', prep: (e) => focus(e, 2) },
  { name: 'a stale clue with Focus at six stacks', prep: (e) => focus(e, 6) },
  { name: 'Spherimorph already hurt (8,000), a stale clue, Focus at two stacks', prep: (e) => { sm(e).hp = 8_000; focus(e, 2); } },
  { name: 'Spherimorph already hurt (8,000), a stale clue, Focus at six stacks', prep: (e) => { sm(e).hp = 8_000; focus(e, 6); } },
  { name: 'Spherimorph nearly down (3,300), a stale clue, Focus at two stacks', prep: (e) => { sm(e).hp = 3_300; focus(e, 2); } },
  { name: 'Spherimorph nearly down (3,300), a stale clue, Focus at six stacks', prep: (e) => { sm(e).hp = 3_300; focus(e, 6); } },
  { name: 'a known clue (Blizzard answered)', prep: (e) => answer(e, 'blizzard') },
  { name: 'a known clue and Lulu already hasted (Tidus waits)', prep: (e) => { answer(e, 'water'); give(actor(e, 'lulu'), 'haste'); } },
  { name: 'a known clue after an Elemental Shift (stale again)', prep: (e) => { answer(e, 'fire'); answer(e, 'spherimorph-elemental-shift'); focus(e, 2); } },
  { name: 'the Press half (under half HP)', prep: (e) => { sm(e).hp = 5_000; } },
  { name: 'a member hurt', prep: (e) => { actor(e, 'tidus').hp = Math.floor(actor(e, 'tidus').stats.maxHp * 0.4); } },
];

/** What the card says on `board` for `who` with the weakness `weak`, as a string a leak would change. */
function cardOn(board: (typeof BOARDS)[number], who: string, weak: number): string {
  clearAdvisorCache();
  const engine = newEngine(11);
  setState(engine, weak);
  clean(engine);
  const d = inputFor(engine, who, 40, true);
  setState(engine, weak);
  clean(engine);
  board.prep(engine);
  const view = buildAdvisorView(engine.state(), { actorId: who, commands: d.commands }, liveAdvisorOptions('ffx', engine));
  return JSON.stringify((view?.suggestions ?? []).map((s) => [label(s.command), s.source, s.label ?? null, s.reason]));
}

describe('the card does not read the hidden weakness (the same card in all four states, on every kind of board)', () => {
  for (const board of BOARDS) {
    it(`${board.name}: Tidus, Yuna and Lulu`, () => {
      for (const who of FRONT) {
        const seen = WEAK_STATES.map((weak) => cardOn(board, who, weak));
        expect(new Set(seen).size, `${who}: ${seen.map((s, i) => `weak ${i}: ${s.slice(0, 200)}`).join(' | ')}`).toBe(1);
      }
    });
  }
});

describe('every decision of the real chapter flow: the card is the line, or the line waits and the card is not a cast or a throw at the boss; and it never changes with the weakness', () => {
  const chapter = (): NonNullable<ReturnType<typeof getChapter>> => {
    const c = getChapter('spherimorph');
    if (!c) throw new Error('Spherimorph is not registered');
    return c;
  };
  const cardOf = (ctx: DecisionContext): Command | null => buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, ctx.advisorOptions)?.suggestions[0]?.command ?? null;
  const atBoss = (c: Command | null): boolean => c !== null && (c.kind === 'ability' || c.kind === 'item' || c.kind === 'overdrive') && ((c as { targets?: string[] }).targets ?? []).includes(SM);

  it('eight seeds: no decision shows a cast or a throw at Spherimorph that the line did not name, and none changes when the weakness is flipped', async () => {
    clearAdvisorCache();
    let compared = 0;
    let waits = 0;
    const bad: string[] = [];
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      await runChapter(chapter(), seed, (ctx) => {
        const card = cardOf(ctx);
        const line = intendedStrategy(ctx.decision.actorId, ctx.decision.commands, ctx.engine as never);
        compared++;
        // flip the hidden weakness on the live engine (and put it back): a card that reads the state would change
        const original = Number(ctx.state.flags['sm.state']);
        const seen = new Set<string>([JSON.stringify(card)]);
        for (const weak of WEAK_STATES) {
          if (weak === original) continue;
          clearAdvisorCache();
          setState(ctx.engine, weak);
          seen.add(JSON.stringify(cardOf(ctx)));
        }
        setState(ctx.engine, original);
        clearAdvisorCache();
        if (seen.size > 1) bad.push(`seed ${seed} ${ctx.decision.actorId}: the card changes with the weakness: ${[...seen].join(' / ')}`);
        if (JSON.stringify(card) !== JSON.stringify(line)) {
          if (line === null || line.kind !== 'defend') bad.push(`seed ${seed} ${ctx.decision.actorId}: card ${label(card)} line ${label(line)}`);
          else {
            waits++;
            if (atBoss(card)) bad.push(`seed ${seed} ${ctx.decision.actorId}: the line waits and the card is ${label(card)} (a leak)`);
          }
        }
        return card;
      });
    }
    expect(compared).toBeGreaterThan(100);
    expect(waits, 'the line does wait (Tidus with a known clue, Yuna with nothing to mend), so the fall-back is exercised').toBeGreaterThan(5);
    expect(bad).toEqual([]);
  }, 600_000);
});

describe('the party prep lets the player pick any three of the seven: no card of the other front lines reads the weakness either', () => {
  it('every decision of two seeds on four other front lines (the line, or a swing where it has no opinion): the card is the same in all four weakness states', () => {
    const fronts: Array<[string, string, string]> = [['tidus', 'auron', 'lulu'], ['auron', 'wakka', 'kimahri'], ['rikku', 'wakka', 'kimahri'], ['kimahri', 'lulu', 'wakka']];
    let decisions = 0;
    const bad: string[] = [];
    for (const front of fronts) {
      for (const seed of [1, 2]) {
        const engine = newEngine(seed, buildWith(front));
        const options = liveAdvisorOptions('ffx', engine);
        for (let i = 0; i < 400; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') break;
          if (d.kind !== 'player-input') continue;
          decisions++;
          const original = Number(flags(engine)['sm.state']);
          const seen = new Set<string>();
          for (const weak of WEAK_STATES) {
            clearAdvisorCache();
            setState(engine, weak);
            seen.add(label(buildAdvisorView(engine.state(), { actorId: d.actorId, commands: d.commands }, options)?.suggestions[0]?.command ?? null));
          }
          setState(engine, original);
          if (seen.size > 1) bad.push(`${front.join(',')} seed ${seed} ${d.actorId}: ${[...seen].join(' / ')}`);
          engine.submit(line(d.actorId, d.commands, engine) ?? row(d, 'attack', undefined, SM) ?? defend());
        }
      }
    }
    expect(decisions).toBeGreaterThan(150);
    expect(bad).toEqual([]);
  }, 300_000);
});
