// @vitest-environment jsdom
/**
 * F5 (the vis-fix check, Chapter I seed 3), FFX only: the engine's state carries
 * the `result` ahead of the presenter, so the last action's message ("Mortiorchis
 * uses Mortibsorption", after Seymour Flux's KO) was shown by a `message` event
 * AFTER the state sweep had already run, and it, and the held advice, stayed
 * through the victory frames. The presented `victory` / `defeat` event now sweeps.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

const hosts: HTMLElement[] = [];
afterEach(() => {
  for (const h of hosts.splice(0)) h.remove();
});

function mounted(): { hud: FFXBattleHud; banner: HTMLElement } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  const hud = new FFXBattleHud();
  hud.mount(host);
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  return { hud, banner: host.querySelector<HTMLElement>('.ig-banner')! };
}

describe('the presented battle end takes the last action off the field', () => {
  for (const type of ['victory', 'defeat'] as const) {
    it(`a ${type} event hides the message banner and drops the held advice`, () => {
      const { hud, banner } = mounted();
      const drop = vi.spyOn(hud.moveAdvisor, 'clearDecision');
      hud.onEvent({ seq: 1, type: 'message', text: 'Mortiorchis uses Mortibsorption', kind: 'ability' } as never);
      expect(banner.hidden).toBe(false);
      hud.onEvent({ seq: 2, type, } as never);
      expect(banner.hidden).toBe(true);
      expect(drop).toHaveBeenCalled();
    });
  }

  it('an ordinary action-end leaves the banner alone', () => {
    const { hud, banner } = mounted();
    hud.onEvent({ seq: 1, type: 'message', text: 'Mortiorchis uses Mortibsorption', kind: 'ability' } as never);
    hud.onEvent({ seq: 2, type: 'action-end' } as never);
    expect(banner.hidden).toBe(false);
  });
});
