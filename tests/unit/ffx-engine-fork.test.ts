/**
 * **`FFXEngine.fork`**: the private copy the advisor v4 look-ahead plays on (FFX).
 *
 * The FFX twin of `ffx2-engine-fork.test.ts`, the checks of docs/plans/advisor-v3-method-check.md
 * §4, proved by running the engine (AGENTS.md rule 3):
 *
 *  - **Fidelity**: a fork handed the battle's own random state and played the same way ends on the
 *    real run's log, byte for byte.
 *  - **Determinism**: two forks with the same seed agree; forking and driving a fork leaves the
 *    battle's state and random stream where they were.
 *
 *  - **Transfer** (advisor v4's worker): `restore(structuredClone(transferable()))` is the same battle.
 *
 * Game case: FFX only (the FFX-2 fork has its own test).
 */

import { describe, expect, it } from 'vitest';
import type { BattleEngine, Command, Decision } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import type { SeededRng } from '../../src/battle/common/rng.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { intendedStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import { chapterById, fallbackCommand } from '../../critic/bench/advisor-v3/drive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;
const rngOf = (e: FFXEngine): number => (e as unknown as { rng: SeededRng }).rng.saveState();
const line = (e: BattleEngine, d: Input): Command => intendedStrategy(d.actorId, d.commands, e as never) ?? fallbackCommand(d);

async function engineAt(chapterId: string, seed: number): Promise<FFXEngine> {
  await registerBattleContent();
  const e = new FFXEngine({ autoResolveMinigames: true });
  const setup = setupForChapter(chapterById(chapterId), seed);
  e.setSeed(setup.seed);
  e.init(setup);
  return e;
}

/** Play the chapter's line until `stopAt` decisions or the link ends. Returns decisions made. */
function play(e: FFXEngine, stopAt = Infinity): number {
  let n = 0;
  for (let step = 0; step < 60_000; step++) {
    const d = e.nextDecision();
    if (d.kind === 'resolved') continue;
    if (d.kind !== 'player-input') break;
    if (n >= stopAt) break;
    n += 1;
    e.submit(line(e, d));
  }
  return n;
}

const logOf = (e: BattleEngine): string => JSON.stringify(e.state().log);

describe('FFXEngine.fork (advisor v4 prototype, FFX only)', () => {
  it('fidelity: a fork with the battle’s random state ends on the real run’s log', async () => {
    let checked = 0;
    for (const id of ['seymour-flux', 'yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'evrae-airship', 'yojimbo-cavern', 'seymour-natus', 'seymour-omnis', 'isaaru-via-purifico']) {
      for (const at of [0, 5, 15, 40]) {
        const real = await engineAt(id, 1);
        if (play(real, at) < at) continue;
        const f = real.fork(777, rngOf(real));
        play(real);
        play(f);
        expect(logOf(f)).toBe(logOf(real));
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(24);
  }, 300_000);

  it('determinism: forks with one seed agree, and forking leaves the battle alone', async () => {
    const real = await engineAt('seymour-flux', 2);
    play(real, 6);
    const before = rngOf(real);
    const log = logOf(real);
    const snap = JSON.stringify(real.state().combatants);
    const a = real.fork(99);
    const b = real.fork(99);
    play(a);
    play(b);
    expect(logOf(a)).toBe(logOf(b));
    expect(rngOf(real)).toBe(before);
    expect(logOf(real)).toBe(log);
    expect(JSON.stringify(real.state().combatants)).toBe(snap);
  }, 300_000);

  it('transferable + restore (advisor v4’s worker): a copy made by structuredClone ends on the real log', async () => {
    let checked = 0;
    for (const id of ['seymour-flux', 'braskas-final-aeon', 'seymour-omnis', 'isaaru-via-purifico']) {
      for (const at of [0, 7, 25]) {
        const real = await engineAt(id, 3);
        if (play(real, at) < at) continue;
        const before = logOf(real);
        const copy = FFXEngine.restore(structuredClone(real.transferable()), { autoResolveMinigames: true });
        expect(logOf(real), 'making the copy leaves the battle alone').toBe(before);
        play(real);
        play(copy);
        expect(logOf(copy)).toBe(logOf(real));
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThanOrEqual(10);
  }, 300_000);
});
