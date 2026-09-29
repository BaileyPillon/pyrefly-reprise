// @vitest-environment jsdom
/**
 * **Advisor v4 is switched on for FFX, at the `mini` budget on every device** (docs/handoff/advisor-v4.md,
 * "SWITCHED ON", 2026-09-29). Pinned here: the FFX switch is on, the FFX-2 switch is off, FFX-2 and
 * FF7 get no v4, no override attaches v4 to an FFX battle, and the budget is `mini` on a desktop
 * and on a phone (the upright layout and a coarse pointer), with `lean` still selectable by a bench.
 *
 * Game case: FFX only (AGENTS.md rule 14). FFX-2 stays on v3; the wiring is shared plumbing.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { attachAdvisorV4, GAME_BUDGET } from '../../src/app/advisorV4/wiring.ts';
import { ADVISOR_V4_FFX, ADVISOR_V4_FFX2, advisorV4On } from '../../src/engine/tactics/advisor-v4/switch.ts';
import type { MoveAdvisorLookAhead } from '../../src/ui/common/MoveAdvisor.ts';
import { InProcWorker } from '../../critic/bench/advisor-v4/inproc-worker.ts';

const G = globalThis as { __pyreflyAdvisorV4Force?: boolean; __pyreflyAdvisorV4?: unknown };

async function engine(): Promise<FFXEngine> {
  await registerBattleContent();
  const e = new FFXEngine();
  const setup = setupForChapter(CHAPTERS.find((c) => c.id === 'seymour-flux')!, 1);
  e.setSeed(setup.seed);
  e.init(setup);
  return e;
}

const hud = () => ({ moveAdvisor: { setLookAhead: (_: MoveAdvisorLookAhead | null) => undefined }, unmount: () => undefined });

/** jsdom has no matchMedia; a stub answers the phone query and the coarse-pointer query as told. */
function stubMedia(phone: boolean, coarse: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    matches: q.includes('pointer') ? coarse : phone,
    media: q, addEventListener: () => undefined, removeEventListener: () => undefined,
  });
}

afterEach(() => {
  delete G.__pyreflyAdvisorV4Force;
  delete G.__pyreflyAdvisorV4;
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
});

describe('advisor v4 switch (FFX on, FFX-2 off)', () => {
  it('the constants: FFX on, FFX-2 off', () => {
    expect(ADVISOR_V4_FFX).toBe(true);
    expect(ADVISOR_V4_FFX2).toBe(false);
    expect(GAME_BUDGET).toBe('mini');
  });

  it('with no override: FFX is on, FFX-2 and FF7 are not', () => {
    expect(advisorV4On('ffx')).toBe(true);
    expect(advisorV4On('ffx2')).toBe(false);
    expect(advisorV4On('ff7' as never)).toBe(false);
  });

  it('a bench override can still turn FFX off, and cannot turn FFX-2 on', () => {
    G.__pyreflyAdvisorV4Force = false;
    expect(advisorV4On('ffx')).toBe(false);
    G.__pyreflyAdvisorV4Force = true;
    expect(advisorV4On('ffx2')).toBe(false);
  });
});

describe('advisor v4 attaches by default, at mini everywhere', () => {
  it.each([
    ['a desktop', false, false],
    ['a phone (upright layout)', true, false],
    ['a coarse pointer', false, true],
  ])('%s: the budget is mini', async (_n, phone, coarse) => {
    stubMedia(phone, coarse);
    const host = attachAdvisorV4(hud(), await engine(), 'ffx', { spawn: () => new InProcWorker() });
    expect(host).not.toBeNull();
    expect(host?.stats.budget).toBe('mini');
    host?.dispose();
  });

  it('a bench can still ask for lean', async () => {
    const host = attachAdvisorV4(hud(), await engine(), 'ffx', { spawn: () => new InProcWorker(), budget: 'lean' });
    expect(host?.stats.budget).toBe('lean');
    host?.dispose();
  });

  it('FFX-2 stays on v3: no v4 host, even with the FFX-2 engine game id', async () => {
    expect(attachAdvisorV4(hud(), await engine(), 'ffx2', { spawn: () => new InProcWorker() })).toBeNull();
  });
});
