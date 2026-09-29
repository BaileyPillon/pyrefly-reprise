/**
 * **Advisor v4's worker protocol** (docs/handoff/advisor-v4.md): the host on the main thread and
 * the real worker core (`src/app/advisorV4/core.ts`) behind an in-process worker that copies every
 * message with `structuredClone`, as `postMessage` does.
 *
 *  - **start and result**: a search pre-started at a battle's start answers for the exact board the
 *    live battle then opens its first menu on, and the card is v3's or v3's with v4's pick on top;
 *  - **the exact board only**: an answer is never shown on another board;
 *  - **cancel**: a menu that closes stops its search, and nothing from it reaches a card;
 *  - **superseded**: a newer board replaces the older search;
 *  - **timeout**: the worker stops at its cap, and the host kills a worker that stops answering;
 *  - **fallback**: no answer, or a failing look-ahead, leaves v3's card.
 *
 * Game case: FFX only (the worker is FFX's; FFX-2 stays on v3).
 */

import { describe, expect, it } from 'vitest';
import type { Decision } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { buildAdvisorView, sameCommand } from '../../src/engine/tactics/advisor.ts';
import { AdvisorV4Host, type WorkerLike } from '../../src/app/advisorV4/host.ts';
import { InProcWorker } from '../../critic/bench/advisor-v4/inproc-worker.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

async function engineAt(chapterId: string, seed: number): Promise<FFXEngine> {
  await registerBattleContent();
  const e = new FFXEngine();
  const setup = setupForChapter(CHAPTERS.find((c) => c.id === chapterId)!, seed);
  e.setSeed(setup.seed);
  e.init(setup);
  return e;
}

function toMenu(e: FFXEngine): Input {
  let d = e.nextDecision();
  for (let i = 0; d.kind === 'resolved' && i < 10_000; i++) d = e.nextDecision();
  if (d.kind !== 'player-input') throw new Error(`no menu: ${d.kind}`);
  return d;
}

function hostWith(w: WorkerLike, capMs = 120_000): AdvisorV4Host {
  return new AdvisorV4Host({ spawn: () => w, budget: 'mini', capMs });
}

describe('advisor v4 worker protocol (FFX)', () => {
  it('start and result: the pre-started answer is the card for the exact board the menu opens on', async () => {
    const e = await engineAt('seymour-flux', 3);
    const w = new InProcWorker();
    const host = hostWith(w);
    host.bind(e);
    host.boardFixed();
    await w.idle();
    const d = toMenu(e);
    const card = host.cardFor(e.state(), d);
    expect(host.stats.results).toBe(1);
    expect(host.stats.ready).toBe(1);
    expect(card).not.toBeNull();
    const v3 = buildAdvisorView(e.state(), d, {});
    const answer = w.sent.find((m) => m.type === 'result');
    expect(answer?.type).toBe('result');
    if (answer?.type === 'result' && answer.switched) {
      expect(sameCommand(card!.suggestions[0]!.command, v3!.suggestions[0]!.command)).toBe(false);
      expect(d.commands.some((r) => r.enabled && r.command.kind === card!.suggestions[0]!.command.kind)).toBe(true);
    } else {
      expect(card).toEqual(v3);
    }
    // The worker was handed a copy, never the live battle: the message is plain data.
    const job = w.received[0];
    expect(job?.type).toBe('search');
    if (job?.type === 'search') expect(job.snapshot.state).not.toBe(e.state());
  }, 120_000);

  it('the exact board only: an answer is not shown on another board', async () => {
    const e = await engineAt('seymour-flux', 3);
    const w = new InProcWorker();
    const host = hostWith(w);
    host.bind(e);
    host.boardFixed();
    await w.idle();
    const d = toMenu(e);
    // Another actor's menu on the same state is another board.
    const other = e.state().activeIds.find((id) => id !== d.actorId)!;
    expect(host.cardFor(e.state(), { actorId: other, commands: d.commands })).toBeNull();
    expect(host.cardFor(e.state(), d)).not.toBeNull();
  }, 120_000);

  it('cancel: a menu that closes stops its search, and nothing from it reaches a card', async () => {
    const e = await engineAt('braskas-final-aeon', 1);
    const w = new InProcWorker();
    const host = hostWith(w);
    host.bind(e);
    host.boardFixed();
    host.closed();
    await w.idle();
    expect(w.received.map((m) => m.type)).toEqual(['search', 'cancel']);
    expect(host.stats.results).toBe(0);
    const d = toMenu(e);
    expect(host.cardFor(e.state(), d)).toBeNull();
  }, 120_000);

  it('superseded: a newer board replaces the older search', async () => {
    const e = await engineAt('braskas-final-aeon', 1);
    const w = new InProcWorker();
    const host = hostWith(w);
    host.bind(e);
    host.boardFixed();
    host.boardFixed();
    await w.idle();
    expect(host.stats.jobs).toBe(2);
    expect(host.stats.results).toBeLessThanOrEqual(1);
    const reasons = w.sent.filter((m) => m.type === 'none').map((m) => (m.type === 'none' ? m.reason : ''));
    for (const r of reasons) expect(['cancelled', 'superseded']).toContain(r);
  }, 120_000);

  it('timeout: the worker stops at its cap and answers so', async () => {
    const e = await engineAt('seymour-flux', 3);
    let t = 0;
    const w = new InProcWorker({ now: () => (t += 1_000) });
    const host = hostWith(w, 1_500);
    host.bind(e);
    host.boardFixed();
    await w.idle();
    expect(w.sent.map((m) => (m.type === 'none' ? m.reason : m.type))).toEqual(['timeout']);
    expect(host.stats.none['timeout']).toBe(1);
    expect(host.cardFor(e.state(), toMenu(e))).toBeNull();
  }, 120_000);

  it('timeout: a worker that stops answering is killed, and the next job gets a fresh one', async () => {
    const e = await engineAt('seymour-flux', 3);
    const silent: WorkerLike[] = [];
    const timers: Array<() => void> = [];
    const spawn = (): WorkerLike => {
      const w: WorkerLike & { dead?: boolean } = { onmessage: null, postMessage: () => undefined, terminate: () => { w.dead = true; } };
      silent.push(w);
      return w;
    };
    const host = new AdvisorV4Host({ spawn, budget: 'mini', capMs: 100, setTimer: (fn) => timers.push(fn), clearTimer: () => undefined });
    host.bind(e);
    host.boardFixed();
    expect(timers).toHaveLength(1);
    timers[0]!();
    expect(host.stats.killed).toBe(1);
    expect((silent[0] as { dead?: boolean }).dead).toBe(true);
    host.boardFixed();
    expect(silent).toHaveLength(2);
    host.dispose();
    expect((silent[1] as { dead?: boolean }).dead).toBe(true);
  });

  it('fallback: no worker at all leaves every card to v3', async () => {
    const e = await engineAt('seymour-flux', 3);
    const host = new AdvisorV4Host({ spawn: () => null, budget: 'lean', capMs: 1_000 });
    host.bind(e);
    host.boardFixed();
    const d = toMenu(e);
    expect(host.cardFor(e.state(), d)).toBeNull();
    expect(host.stats.jobs).toBe(0);
  });
});
