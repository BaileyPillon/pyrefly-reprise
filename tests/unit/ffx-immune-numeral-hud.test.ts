// @vitest-environment jsdom
/**
 * R56-003 of the Release 56 focused review (fixed in release 57; **FFX only**): a status move a foe wholly resists said MISS on the HUD, not IMMUNE.
 *
 * The engine had emitted the miss with `reason: 'immune'` since release 55 (`ffx-immune-status-miss.test.ts` proves that half, down to the event). In the live
 * game the presenter's numeral port is not supplied (`BattleScreen`: the HUD owns the numerals), so the word on screen is the HUD's, and
 * `FFXBattleHud.onEvent` -> `DamageNumbers.spawn` -> the shared `spawnEvent` read only `hit: false`. This drives the real FFX HUD with the engine's event.
 *
 * Game case: FFX only. FFX-2's HUD draws its numerals through `DamageLayer` and is not changed here (see CHANGELOG, release 57).
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleEvent } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

const hosts: HTMLElement[] = [];
function mountHud(): { hud: FFXBattleHud; host: HTMLElement } {
  const host = document.createElement('div');
  document.body.appendChild(host);
  hosts.push(host);
  const hud = new FFXBattleHud();
  hud.mount(host);
  hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
  return { hud, host };
}
afterEach(() => {
  for (const h of hosts.splice(0)) h.remove();
});

const miss = (reason: 'evaded' | 'nullified' | 'immune' | 'wrong-state', seq = 1): BattleEvent =>
  ({ seq, type: 'miss', targetId: 'seymour-flux', sourceId: 'tidus', reason }) as BattleEvent;

/** Every numeral the HUD is drawing: its text and its kind class. */
function numerals(host: HTMLElement): Array<{ text: string; kind: string }> {
  return [...host.querySelectorAll<HTMLElement>('.dnum')].map((el) => ({
    text: el.textContent ?? '',
    kind: [...el.classList].find((c) => c.startsWith('dnum--')) ?? '',
  }));
}

describe('the FFX HUD prints IMMUNE for a miss whose reason is immune (R56-003)', () => {
  it('Slow on Seymour Flux (the engine emits miss/immune): one IMMUNE numeral, in the immune style, not MISS', () => {
    const { hud, host } = mountHud();
    hud.onEvent(miss('immune'));
    expect(numerals(host)).toEqual([{ text: 'IMMUNE', kind: 'dnum--immune' }]);
  });

  it('is the same numeral a hit on an immune affinity draws', () => {
    const a = mountHud();
    a.hud.onEvent(miss('immune'));
    const b = mountHud();
    b.hud.onEvent({ seq: 2, type: 'damage', targetId: 'seymour-flux', sourceId: 'tidus', amount: 0, affinity: 'immune' } as BattleEvent);
    expect(numerals(a.host)).toEqual(numerals(b.host));
  });

  it('every other miss reason is unchanged: a missed attack still says MISS', () => {
    for (const reason of ['evaded', 'nullified', 'wrong-state'] as const) {
      const { hud, host } = mountHud();
      hud.onEvent(miss(reason));
      expect(numerals(host), reason).toEqual([{ text: 'MISS', kind: 'dnum--miss' }]);
    }
  });

  it('the numeral is on the struck foe, so it rides that foe', () => {
    const { hud, host } = mountHud();
    hud.onEvent(miss('immune'));
    const el = host.querySelector<HTMLElement>('.dnum--immune');
    expect(el?.dataset['target']).toBe('seymour-flux');
  });
});
