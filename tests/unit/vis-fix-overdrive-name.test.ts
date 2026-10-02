// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type { MinigameKind } from '../../src/battle/common/types.ts';
import { openMinigame, withAbilityName } from '../../src/ui/ffx/minigames/index.ts';

/**
 * VP-1001-16 (FFX only): the timing overlays titled every Overdrive with a
 * hard-coded fallback (Spiral Cut chosen, 'Slice & Dice' shown). The engine's
 * `minigame-request` carries `abilityId`; the dispatcher now names the overlay
 * from the ability data.
 */
describe('withAbilityName', () => {
  it('fills the name from the ability id', () => {
    expect(withAbilityName({ abilityId: 'spiral-cut' })['name']).toBe('Spiral Cut');
    expect(withAbilityName({ abilityId: 'shooting-star' })['name']).toBe('Shooting Star');
  });

  it('keeps an explicit name and leaves unknown ids alone', () => {
    expect(withAbilityName({ abilityId: 'spiral-cut', name: 'Custom' })['name']).toBe('Custom');
    expect(withAbilityName({ abilityId: 'no-such-move' })['name']).toBeUndefined();
    expect(withAbilityName({})['name']).toBeUndefined();
  });
});

describe('Overdrive overlays show the chosen move', () => {
  const cases: Array<[MinigameKind, string, string]> = [
    ['tidus-timing', 'spiral-cut', 'Spiral Cut'],
    ['tidus-timing', 'energy-rain', 'Energy Rain'],
    ['auron-sequence', 'shooting-star', 'Shooting Star'],
    ['wakka-reels', 'attack-reels', 'Attack Reels'],
  ];
  for (const [kind, abilityId, expected] of cases) {
    it(`${kind} titled '${expected}' for ${abilityId}`, () => {
      const root = document.createElement('div');
      document.body.appendChild(root);
      void openMinigame(root, kind, { abilityId, timerMs: 60_000 }).catch(() => {});
      const title = root.querySelector('[data-role="title"]')?.textContent;
      expect(title).toBe(expected);
      root.remove();
    });
  }
});
