// @vitest-environment jsdom
/**
 * **Advisor v4 reaches the real card through the coach wrapper.** `BattleScreen` hands
 * `attachAdvisorV4` its `this.hud`, which is always `withCoach`'s `CoachedHud`, never the concrete
 * `FFXBattleHud`. Before this test the wrapper had no `moveAdvisor`, so the duck-typed probe found
 * nothing and v4 stayed off in every real battle whatever the switch said (found by the browser
 * timing run on a production build, 2026-09-28): the wrapper hole of PR-0090, PR-0122 and PR-0157
 * a fifth time.
 *
 * Game case: FFX only (v4 attaches to FFX battles only; the getter itself is shared plumbing).
 */

import { afterEach, describe, expect, it } from 'vitest';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { withCoach } from '../../src/ui/coach/CoachLayer.ts';
import { attachAdvisorV4 } from '../../src/app/advisorV4/wiring.ts';
import type { HudPort } from '../../src/engine/HudPort.ts';
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

afterEach(() => {
  delete G.__pyreflyAdvisorV4Force;
  delete G.__pyreflyAdvisorV4;
});

describe('advisor v4 through the coach wrapper (FFX)', () => {
  it('the wrapper forwards the inner HUD\'s card', () => {
    const card = { setLookAhead: (_: MoveAdvisorLookAhead | null) => undefined };
    const hud = withCoach('ffx', { moveAdvisor: card } as unknown as HudPort) as unknown as { moveAdvisor?: unknown };
    expect(hud.moveAdvisor).toBe(card);
  });

  it('attachAdvisorV4 finds the card on the wrapped HUD and hands it the look-ahead', async () => {
    let source: MoveAdvisorLookAhead | null = null;
    const card = { setLookAhead: (s: MoveAdvisorLookAhead | null) => { source = s; } };
    const hud = withCoach('ffx', { moveAdvisor: card, unmount: () => undefined } as unknown as HudPort);
    G.__pyreflyAdvisorV4Force = true;
    const host = attachAdvisorV4(hud, await engine(), 'ffx', { spawn: () => new InProcWorker() });
    expect(host).not.toBeNull();
    expect(source).toBe(host);
    host?.dispose();
  });

  it('the game\'s own FFX HUD (createHud) exposes the card through every wrapper', () => {
    const hud = createHud('ffx') as unknown as { moveAdvisor?: { setLookAhead?: unknown } };
    expect(typeof hud.moveAdvisor?.setLookAhead).toBe('function');
  });

  it('with the switch on (2026-09-29), no override attaches v4 through the wrapper', async () => {
    const card = { setLookAhead: (_: MoveAdvisorLookAhead | null) => undefined };
    const hud = withCoach('ffx', { moveAdvisor: card } as unknown as HudPort);
    const host = attachAdvisorV4(hud, await engine(), 'ffx', { spawn: () => new InProcWorker() });
    expect(host).not.toBeNull();
    host?.dispose();
  });

  it('a bench override of false leaves v3\'s card (this test pinned "off" while the switch was off; it now pins the override)', async () => {
    const card = { setLookAhead: (_: MoveAdvisorLookAhead | null) => undefined };
    const hud = withCoach('ffx', { moveAdvisor: card } as unknown as HudPort);
    G.__pyreflyAdvisorV4Force = false;
    expect(attachAdvisorV4(hud, await engine(), 'ffx', { spawn: () => new InProcWorker() })).toBeNull();
  });
});
