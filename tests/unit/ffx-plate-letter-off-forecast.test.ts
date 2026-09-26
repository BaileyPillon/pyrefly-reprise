// @vitest-environment jsdom
/**
 * PR-0208 follow-through (critic round 13), **FFX only**: the target cursor's
 * name plate keeps a duplicate enemy's letter when that enemy is not on the
 * CTB forecast.
 *
 * The advisor card now names "Yu Pagoda B" (the roster rule,
 * `src/battle/ffx/letterTags.ts`). The plate read its letter only off the CTB
 * rows the list last rendered, so a Slowed Pagoda that had fallen past the
 * forecast's depth lost its letter on the plate — measured with real keys on
 * seed 1 at 1600x900: three turns where the card said "Yu Pagoda B" and the
 * only Pagoda plate read "Yu Pagoda". The plate now falls back to the same
 * roster rule, so card, tile and plate always agree.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleState } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
});

describe('the name plate letters a duplicate enemy off the CTB forecast (FFX only)', () => {
  it('reads B for the twin whose tile is not in the forecast', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 400, y: 300 }));

    // Two enemies that read the same on screen; only the first is on the forecast.
    const state = makeFakeBattleState() as BattleState;
    state.combatants['mortiorchis']!.name = state.combatants['seymour-flux']!.name;
    const preview = makeFakeTurnPreview().filter((r) => r.actorId !== 'mortiorchis');
    hud.sync(state, preview);

    const attack: AvailableCommand = {
      command: { kind: 'attack', targets: [] },
      label: 'Attack',
      category: 'attack',
      mpCost: 0,
      enabled: true,
      validTargets: ['seymour-flux', 'mortiorchis'],
    };
    void hud.chooseCommand('tidus', [attack], () => preview);
    (root.querySelector('.ig-cmd') as HTMLElement).click();

    const plates: string[] = [];
    for (let i = 0; i < 2; i++) {
      const plate = document.querySelector('.ffx-target__plate');
      expect(plate, `plate ${i}`).not.toBeNull();
      const name = plate!.querySelector('.ffx-target__name')?.textContent ?? '';
      const tag = plate!.querySelector('.ffx-target__tag')?.textContent ?? '';
      plates.push(`${name} ${tag}`.trim());
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    }
    const name = state.combatants['seymour-flux']!.name;
    expect(plates.sort()).toEqual([`${name} A`, `${name} B`]);
  });
});
