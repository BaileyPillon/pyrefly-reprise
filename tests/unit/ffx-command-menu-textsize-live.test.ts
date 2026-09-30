// @vitest-environment jsdom
/**
 * PR-0266 (round 17, FFX only): TEXT SIZE changed while a command list is open.
 *
 * The FFX desktop list caps its rows at 115 % (five) and 130 % (four) only when it is
 * drawn (`commandRowsCap` in `renderStack`). OPTIONS is reached through the pause, over
 * the open menu, so the size changed with the list already drawn at 100 % (six rows);
 * grown to 130 % those six rows ran up over the help slab and the acting character.
 * The open menu now redraws when `data-text-size` changes, and stops watching when it
 * closes. Game case: FFX only (the FFX-2 menu is its own class).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { makeFakeCombatants, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';

afterEach(() => {
  applyComfort({ textSize: 1, reduceMotion: false, lowEffects: false });
  document.documentElement.removeAttribute('data-phone-battle');
  document.body.innerHTML = '';
});

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const rows = (m: CommandMenu): number => m.stackEl.querySelectorAll('.ig-cmd').length;

function openMenu(): CommandMenu {
  const menu = new CommandMenu();
  document.body.append(menu.stackEl, menu.breadcrumbEl);
  void menu.open({ actorId: 'tidus', commands: makeFakeCommands(), previewRank: () => [], combatants: makeFakeCombatants(), setHelp: () => {} });
  return menu;
}

describe('PR-0266: an open FFX command list follows TEXT SIZE', () => {
  it('re-caps to four rows at 130 %, then five at 115 %, then all rows at 100 %', async () => {
    const menu = openMenu();
    const all = rows(menu);
    expect(all).toBeGreaterThan(5);
    applyComfort({ textSize: 1.3 });
    await tick();
    expect(rows(menu)).toBe(4);
    expect(menu.stackEl.querySelector('.ffx-cmd-more')).not.toBeNull();
    applyComfort({ textSize: 1.15 });
    await tick();
    expect(rows(menu)).toBe(5);
    applyComfort({ textSize: 1 });
    await tick();
    expect(rows(menu)).toBe(all);
  });

  it('keeps the selected row inside the shorter window', async () => {
    const menu = openMenu();
    applyComfort({ textSize: 1.3 });
    await tick();
    expect(menu.stackEl.querySelector('.ig-cmd--selected')).not.toBeNull();
  });

  it('the upright phone keeps every row', async () => {
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    const menu = openMenu();
    const all = rows(menu);
    applyComfort({ textSize: 1.3 });
    await tick();
    expect(rows(menu)).toBe(all);
  });

  it('a closed menu stops watching', async () => {
    const menu = openMenu();
    menu.close();
    menu.stackEl.innerHTML = '<div class="probe"></div>';
    applyComfort({ textSize: 1.3 });
    await tick();
    expect(menu.stackEl.querySelector('.probe')).not.toBeNull();
  });
});
