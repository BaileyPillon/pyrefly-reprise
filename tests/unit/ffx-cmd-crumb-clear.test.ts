// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

/**
 * FFX only (the FFX command cascade; FFX-2's `ffx2cmd` fold never draws these
 * arrows). The verifier of the ffx-ui repair pass saw the submenu breadcrumb
 * ("ITEMS") drawn under the help slab (`.ffx-cmd-info`) in Chapter 3 at
 * 1600x900: the scroll arrows were in flow, so a scrolled six-row list grew
 * the stack upward and pushed the breadcrumb 25 screen px into the slab.
 *
 * The arrows are now out of flow. jsdom has no layout, so this file pins the
 * two halves of the fix (each arrow says which end it marks, and the CSS takes
 * both out of flow inside a positioned stack); the geometry itself was
 * measured in a GPU browser with real keys (Chapters 1, 2, 3, Yojimbo and
 * Evrae; 1280x720, 1600x900, 1920x1080, 2000x1012): 0 px of breadcrumb under
 * the slab in every scroll state, rows no longer move as the arrows come and go.
 */

const css = readFileSync(join(process.cwd(), 'src/ui/ffx/ffx-hud.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

function rule(selector: string): string {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = css.match(new RegExp(`(?:^|})\\s*${esc}\\s*\\{([^}]*)\\}`));
  expect(m, `no rule for ${selector}`).not.toBeNull();
  return m![1]!;
}

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
});

describe('the submenu breadcrumb stays clear of the help slab (FFX only)', () => {
  it('marks the up and down scroll arrows so the CSS can hang them off the stack', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    cleanup = () => hud.unmount();
    hud.setProjector(() => ({ x: 0, y: 0 }));
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    const spells: AvailableCommand[] = Array.from({ length: 20 }, (_, i) => ({
      command: { kind: 'ability', id: `spell-${i}`, targets: [] },
      label: `Spell ${i}`,
      category: 'blackmagic' as const,
      mpCost: 4,
      enabled: true,
      validTargets: ['seymour-flux'],
    }));
    void hud.chooseCommand(
      'tidus',
      [{ command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: [] }, ...spells],
      () => makeFakeTurnPreview(),
    );
    const group = [...root.querySelectorAll('.ig-cmd')].find((r) => r.textContent?.includes('Black Magic')) as HTMLElement;
    group.click();

    // At the top of the list only the down arrow shows.
    expect(root.querySelector('.ffx-cmd-more--up')).toBeNull();
    expect(root.querySelector('.ffx-cmd-more--down')?.textContent).toBe('▼');

    // Mid-list: both, and each still sits inside the stack (its containing block).
    for (let i = 0; i < 8; i++) window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    const stack = root.querySelector('.ig-cmd-stack')!;
    expect(stack.querySelector('.ffx-cmd-more--up')?.textContent).toBe('▲');
    expect(stack.querySelector('.ffx-cmd-more--down')?.textContent).toBe('▼');
    expect(stack.querySelectorAll('.ffx-cmd-more:not(.ffx-cmd-more--up):not(.ffx-cmd-more--down)')).toHaveLength(0);
  });

  it('takes both arrows out of flow, so they never grow the stack under the breadcrumb', () => {
    expect(rule('.ffx-cmd-area .ig-cmd-stack')).toMatch(/position:\s*relative/);
    expect(rule('.ffx-cmd-more')).toMatch(/position:\s*absolute/);
    // The up arrow above the top row (on the breadcrumb's line), the down
    // arrow below the last row (in the stage's bottom margin).
    expect(rule('.ffx-cmd-more--up')).toMatch(/bottom:\s*calc\(100%/);
    expect(rule('.ffx-cmd-more--down')).toMatch(/top:\s*calc\(100%/);
    // No later rule puts the stack back to `static` (that was the old value).
    expect(css).not.toMatch(/\.ffx-cmd-area \.ig-cmd-stack\s*\{\s*position:\s*static/);
  });
});
