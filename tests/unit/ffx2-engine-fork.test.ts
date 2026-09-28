/**
 * **`FFX2Engine.fork`**: the private copy advisor v3 projects on (FFX-2 only).
 *
 * Three properties, each proved by running the engine (AGENTS.md rule 3), the checks of
 * docs/plans/advisor-v3-method-check.md §4:
 *
 *  - **Fidelity**: a fork handed the battle's own random state and played the same way ends on the
 *    real run's log, byte for byte. So the fork is the battle, not an approximation of it.
 *  - **Purity**: the advisor, projections included, never touches the battle. The same seeds end on
 *    the same log with the v3 card computed at every decision and without it (rule 1).
 *  - **Determinism**: two forks with the same seed agree; forking and driving a fork leaves the
 *    battle's random stream where it was.
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, Command, Decision } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import type { SeededRng } from '../../src/battle/common/rng.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../src/engine/tactics/advisor.ts';
import { boardFor } from '../../src/engine/tactics/advisor-v3.ts';
import { chapterById, fallbackCommand, HUMAN_PACE, runChapter } from '../../critic/bench/advisor-v3/drive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
const rngOf = (e: FFX2Engine): number => (e as unknown as { rng: SeededRng }).rng.saveState();
const line = (e: BattleEngine, d: Input): Command => intendedStrategy(d.actorId, d.commands, e as never) ?? fallbackCommand(d);

async function engineAt(chapterId: string, seed: number): Promise<FFX2Engine> {
  await registerBattleContent();
  const e = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false, atbMode: 'wait', waitSplit: true });
  const setup = setupForChapter(chapterById(chapterId), seed);
  e.setSeed(setup.seed);
  e.init(setup);
  return e;
}

/** Play the chapter's line at the house human pace until `stopAt` decisions or the link ends. */
function play(e: FFX2Engine, stopAt = Infinity): number {
  let n = 0;
  for (let step = 0; step < 60_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'waiting') { e.tick(Math.max(1, d.nextEventMs)); continue; }
    if (d.kind === 'resolved') continue;
    if (d.kind === 'battle-over') break;
    if (n >= stopAt) break;
    n += 1;
    const pick = line(e, d);
    e.setMenuLevel('top');
    e.tick(HUMAN_PACE.topMs, { throughInput: true });
    e.setMenuLevel('deep');
    if (!e.inputValid(d.actorId)) continue;
    e.tick(HUMAN_PACE.heldMs, { throughInput: true });
    if (!e.inputValid(d.actorId)) continue;
    e.submit(pick);
  }
  return n;
}

const logOf = (e: BattleEngine): string => JSON.stringify(e.state().log);

describe('FFX2Engine.fork (advisor v3, FFX-2 only)', () => {
  it('fidelity: a fork with the battle’s random state ends on the real run’s log', async () => {
    let checked = 0;
    for (const id of ['ffx2-bahamut', 'ffx2-vegnagun-shuyin', 'ffx2-fallen-aeons']) {
      for (const at of [4, 12]) {
        const real = await engineAt(id, 1);
        if (play(real, at) < at) continue;
        const f = real.fork(777, rngOf(real));
        play(real);
        play(f);
        expect(logOf(f)).toBe(logOf(real));
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(4);
  }, 300_000);

  it('determinism: forks with one seed agree, and forking leaves the battle’s stream alone', async () => {
    const real = await engineAt('ffx2-vegnagun-shuyin', 2);
    play(real, 8);
    const before = rngOf(real);
    const log = logOf(real);
    const a = real.fork(99);
    const b = real.fork(99);
    play(a);
    play(b);
    expect(logOf(a)).toBe(logOf(b));
    expect(rngOf(real)).toBe(before);
    expect(logOf(real)).toBe(log);
  }, 300_000);

  it('purity: the v3 card at every decision leaves the battle on the same log', async () => {
    for (const [id, seed] of [['ffx2-vegnagun-shuyin', 1], ['ffx2-leblanc', 3]] as const) {
      let projected = 0;
      const on = await runChapter(chapterById(id), seed, (ctx) => {
        clearAdvisorCache();
        const opts = { ...ctx.advisorOptions, v3: true };
        buildAdvisorView(ctx.state, { actorId: ctx.decision.actorId, commands: ctx.decision.commands }, opts);
        if (boardFor(ctx.state, ctx.decision.actorId, opts).projection) projected += 1;
        return line(ctx.engine, ctx.decision);
      });
      const off = await runChapter(chapterById(id), seed, (ctx) => line(ctx.engine, ctx.decision));
      expect(projected, 'projections actually ran').toBeGreaterThan(0);
      expect([on.outcome, on.decisions, on.finalLogLength, on.finalLogDigest]).toEqual([off.outcome, off.decisions, off.finalLogLength, off.finalLogDigest]);
    }
  }, 600_000);
});
