/**
 * Tourist Trap (the optional FFX-2 mission; the hidden chapter): a poll that is not a turn is not counted as one. **FFX-2 only** (the engine change is in `battle/ffx2`; only this chapter's two scripts
 * set the markers it reads, so no other chapter and no golden moves).
 *
 * The defect (found 2026-10-14): `engine-core.ts#runAiTurn` drafted the `turn-start` and counted `battleState.turn += 1` BEFORE the script was asked, on every AI poll. Yojimbo's "dog" pick (the script sets a
 * flag, wakes the dog, and is polled again on the very next step: `AI_REPOLL`) and Daigoro's sleeping poll (`AI_NO_INTENT`) each emitted a `turn-start` with a new turn number, then a bare `action-end` with no
 * `action-start`: about 20 percent of a fight's turn-starts. The results screen prints `result.turns` (TURNS), so it was inflated, and the presenter played its beat and camera settle for each. In the game a dog
 * pick is not a turn. The fix (`flavour-turn.ts#pollIsNotATurn`): when the script returns no command and carries either marker, the engine takes the turn count and the drafted `turn-start` back and plays
 * no `action-end`. No random draw is made for any of the three, so the fight itself does not move (`tourist-trap-bench.test.ts` prints the same table before and after).
 *
 * Seed 1, the intended line, Wait clock (the numbers before and after):
 *   before: 82 turns (82 turn-starts, 16 of them bare: 12 dog picks and 4 sleeping polls)
 *   after:  66 turns (66 turn-starts, none bare), the same fight
 */
import { describe, expect, it, vi } from 'vitest';
// r56 (2026-10-19, FFX-2 only): ACTION_TIME_PER_COMMAND is ON in production. This file pins seeds, hashes or counts of the previous action-time timeline (the flat time, or none), so it plays
// with the switch OFF, exactly as it did on b24614c05; the production timeline is measured in docs/handoff/re-parity-r56-re.md. Re-pin it on the production timeline when it next changes.
vi.mock('../../../src/battle/ffx2/action-time.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/battle/ffx2/action-time.ts')>()),
  ACTION_TIME_PER_COMMAND: false,
}));


import type { BattleEvent, FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { FFX2_TOURIST_TRAP } from '../../../src/data/chapter-ffx2-tourist-trap.ts';
import { cavernYojimboGroup, X2_DAIGORO_ID, X2_YOJIMBO_ID } from '../../../src/data/ffx2/enemies/tourist-trap.ts';
import { YOJIMBO_ACTIONS } from '../../../src/data/ffx2/enemies/tourist-trap-abilities.ts';
import { LIVELOCK_SPINS } from '../../../src/engine/BattlePresenterUtil.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { driveFight, recordPolls, type TouristTrapPoll } from '../helpers/touristTrapDrive.ts';

type Ev = BattleEvent & { actorId?: string; turn?: number };
const SEEDS = [1, 2, 3, 4, 5, 6];

interface Batch {
  /** What the engine handed back for one call of the presenter's loop. */
  events: readonly Ev[];
  /** The polls of the two scripts made during that call (at most one: an AI turn ends the call). */
  polls: TouristTrapPoll[];
}

/** The presenter's loop (`BattlePresenter.run`): `nextDecision`, then `tick` on a wait, a defending party; counts the decisions in a row that left the log as it was (`LIVELOCK_SPINS` gives up at 400). */
function presenterLoop(seed: number): { batches: Batch[]; maxIdleSpins: number; log: readonly Ev[]; polls: TouristTrapPoll[] } {
  return recordPolls((polls) => {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(seed);
    engine.init({ game: 'ffx2', party: FFX2_TOURIST_TRAP.buildRef as FFX2PartyBuild, enemies: cavernYojimboGroup, triggers: [], seed, condition: 'normal', canEscape: false });
    const batches: Batch[] = [];
    let idle = 0;
    let maxIdleSpins = 0;
    let lastLength = engine.state().log.length;
    for (let i = 0; i < 40_000; i++) {
      const before = polls.length;
      const d = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      let events: readonly BattleEvent[] = [];
      if (d.kind === 'resolved') events = d.events;
      else if (d.kind === 'waiting') events = engine.tick(Math.max(1, d.nextEventMs));
      else events = engine.submit({ kind: 'defend', targets: [] });
      batches.push({ events: events as readonly Ev[], polls: polls.slice(before) });
      const length = engine.state().log.length;
      idle = length === lastLength ? idle + 1 : 0;
      lastLength = length;
      maxIdleSpins = Math.max(maxIdleSpins, idle);
    }
    return { batches, maxIdleSpins, log: engine.state().log as readonly Ev[], polls };
  });
}

/**
 * Yojimbo's and Daigoro's events only (the girls' are not this change's: a defending girl has an `action-end` and no `action-start`, as she always did): every `action-end` closes an `action-start` of the same
 * actor, and every `turn-start` is followed by that actor's `action-start` before its next `turn-start` (a charged Zanmato fires later, but before the next poll).
 */
function expectNoBareEnds(log: readonly Ev[], label: string): void {
  const open = new Map<string, number>();
  const waiting = new Map<string, number>(); // turn-starts not yet followed by their action-start
  for (const e of log) {
    if (e.actorId !== X2_YOJIMBO_ID && e.actorId !== X2_DAIGORO_ID) continue;
    if (e.type === 'turn-start') {
      expect(waiting.get(e.actorId) ?? 0, `${label}: ${e.actorId} turn ${e.turn} starts while the last turn never acted (a bare turn-start)`).toBe(0);
      waiting.set(e.actorId, 1);
    } else if (e.type === 'action-start') {
      open.set(e.actorId, (open.get(e.actorId) ?? 0) + 1);
      waiting.set(e.actorId, 0);
    } else if (e.type === 'action-end') {
      expect(open.get(e.actorId) ?? 0, `${label}: a bare action-end of ${e.actorId}`).toBeGreaterThan(0);
      open.set(e.actorId, open.get(e.actorId)! - 1);
    }
  }
}

describe('a poll that is not a turn leaves no turn-start and no action-end', () => {
  it('a dog pick (Yojimbo) and a sleeping poll (Daigoro) emit nothing of the actor: no turn-start, no action-start, no action-end, in the call that polled it', () => {
    let dogPicks = 0;
    let sleeps = 0;
    for (const seed of SEEDS) {
      const { batches } = presenterLoop(seed);
      for (const batch of batches) {
        for (const poll of batch.polls) {
          if (poll.abilityId !== null) continue; // a poll that queued a move is a turn
          if (poll.actorId === X2_YOJIMBO_ID) dogPicks += 1;
          else sleeps += 1;
          const ofTheActor = batch.events.filter((e) => e.actorId === poll.actorId && (e.type === 'turn-start' || e.type === 'action-start' || e.type === 'action-end'));
          expect(ofTheActor, `seed ${seed}: ${poll.actorId} polled at step ${poll.at} and queued nothing`).toEqual([]);
        }
      }
    }
    expect(dogPicks, 'there were dog picks').toBeGreaterThan(0);
    expect(sleeps, 'and sleeping polls').toBeGreaterThan(0);
  });

  it('a real poll still is a turn: every move Yojimbo queues (Zanmato included) and every bite has its turn-start, and the log has no bare turn-start and no bare action-end', () => {
    for (const seed of SEEDS) {
      const { batches, log } = presenterLoop(seed);
      expectNoBareEnds(log, `seed ${seed}, defending`);
      const real = batches.flatMap((b) => b.polls).filter((p) => p.abilityId !== null);
      for (const actorId of [X2_YOJIMBO_ID, X2_DAIGORO_ID]) {
        const turnStarts = log.filter((e) => e.type === 'turn-start' && e.actorId === actorId).length;
        expect(turnStarts, `seed ${seed}: ${actorId}'s turn-starts are its polls that queued a move`).toBe(real.filter((p) => p.actorId === actorId).length);
      }
    }
    for (const seed of SEEDS) for (const line of ['intended', 'naive'] as const) expectNoBareEnds(driveFight(seed, { line }).log as readonly Ev[], `seed ${seed}, ${line}`);
  });
});

describe("the results' TURNS counts the turns of the fight, not its polls", () => {
  it('at the end of a whole fight state.turn is the number of turn-starts, numbered 1 to N with none skipped, and the polls are not in it', () => {
    for (const seed of SEEDS) {
      for (const line of ['intended', 'naive'] as const) {
        const run = driveFight(seed, { line });
        const log = run.log as readonly Ev[];
        const turnStarts = log.filter((e) => e.type === 'turn-start');
        const label = `seed ${seed}, ${line}`;
        expect(run.turns, `${label}: result.turns is the count of turn-starts`).toBe(turnStarts.length);
        expect(run.turnStarts, label).toBe(turnStarts.length);
        expect(turnStarts.map((e) => e.turn), `${label}: numbered 1 to N`).toEqual(turnStarts.map((_, i) => i + 1));
        // The turns are the girls' turns, Yojimbo's moves and Daigoro's bites: his dog picks and the dog's sleeping polls are in the poll log and not in the count.
        const girls = turnStarts.filter((e) => e.actorId !== X2_YOJIMBO_ID && e.actorId !== X2_DAIGORO_ID).length;
        const polls = run.pollLog.length;
        expect(run.turns, label).toBe(girls + polls - run.dogPicks - run.sleepingPolls);
        expect(run.dogPicks + run.sleepingPolls, `${label}: and there were polls that are not turns`).toBeGreaterThan(0);
        expect(run.turns, label).toBeLessThan(girls + polls);
      }
    }
  });

  // Re-pinned for the hit reaction (re-parity RC9 lane X2-A, slice 1; FFX-2 only; reason "game-code parity", note FFX2-G01 section 7): the chain windows of Yojimbo (31 steps, 58 after a critical)
  // and Daigoro (61) are their own flinches now, so the party's chains on them break sooner and the same seed is another replay: 69 turns, 12 dog picks and 5 sleeping polls, 86 polls in all, where it
  // was 66, 12, 4 and 82. Cause, by ablation: with `CHAIN_WINDOW_PER_BODY` off the old figures return.
  it('seed 1, the intended line: 69 turns, with the 12 dog picks and 5 sleeping polls out of it (the same fight counted 86 before the fix)', () => {
    const run = driveFight(1, { line: 'intended' });
    expect([run.turns, run.dogPicks, run.sleepingPolls]).toEqual([69, 12, 5]);
    expect(run.turns + run.dogPicks + run.sleepingPolls, 'the old count: every poll was a turn').toBe(86);
  });

  it('Zanmato is still the 14th poll of its cycle (28th, 42nd ...), counted in polls, which are no longer the turns', () => {
    let zanmatos = 0;
    for (const seed of [1, 2, 3, 4]) {
      for (const line of ['intended', 'naive'] as const) {
        const run = driveFight(seed, { line });
        run.zanmatoPolls.forEach((p, i) => expect(p, `seed ${seed} ${line}: Zanmato number ${i + 1}`).toBe(14 * (i + 1)));
        zanmatos += run.zanmatoPolls.length;
        const polls = run.pollLog.filter((p) => p.actorId === X2_YOJIMBO_ID);
        polls.forEach((p, i) => {
          if (p.abilityId === YOJIMBO_ACTIONS.zanmato) expect((i + 1) % 14, `seed ${seed} ${line}: the Zanmato poll is poll ${i + 1}`).toBe(0);
        });
      }
    }
    expect(zanmatos, 'Zanmato came').toBeGreaterThan(0);
  });

  it('is deterministic: the same seed twice gives the same log, the same polls and the same TURNS', () => {
    for (const seed of [1, 2, 3]) {
      const a = driveFight(seed, { line: 'intended' });
      const b = driveFight(seed, { line: 'intended' });
      expect(JSON.stringify(a.log), `seed ${seed}: the log`).toBe(JSON.stringify(b.log));
      expect(a.pollLog, `seed ${seed}: the polls`).toEqual(b.pollLog);
      expect([a.turns, a.turnStarts]).toEqual([b.turns, b.turnStarts]);
    }
  });
});

describe('the presenter does not depend on the taken-back turn-start to advance', () => {
  it(`no run of decisions that leave the log as it was gets near ${LIVELOCK_SPINS} (LIVELOCK_SPINS): a dog pick is followed by Yojimbo's very next poll, and Daigoro is polled once, not every step`, () => {
    let longestDogRun = 0;
    for (const seed of Array.from({ length: 40 }, (_, i) => i + 1)) {
      const { maxIdleSpins, polls } = presenterLoop(seed);
      expect(maxIdleSpins, `seed ${seed}: decisions in a row with the log unchanged`).toBeLessThan(10);
      // Daigoro sleeps until woken: after the first poll, one silent poll at most per bite (the poll that ends a bite's rest with the flag down).
      const dog = polls.filter((p) => p.actorId === X2_DAIGORO_ID);
      const bites = dog.filter((p) => p.abilityId !== null).length;
      expect(dog.length - bites, `seed ${seed}: Daigoro's silent polls`).toBeLessThanOrEqual(bites + 1);
      let run = 0;
      for (const p of polls.filter((q) => q.actorId === X2_YOJIMBO_ID)) {
        run = p.abilityId === null ? run + 1 : 0;
        longestDogRun = Math.max(longestDogRun, run);
      }
    }
    expect(longestDogRun, 'the longest run of dog picks in a row stays under the 13 raises before a Zanmato').toBeLessThanOrEqual(13);
  });
});
