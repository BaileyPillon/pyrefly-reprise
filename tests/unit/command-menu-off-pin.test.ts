// @vitest-environment jsdom
/**
 * The OFF pins of step D1 of the FFX-2 Special look (game case: FFX-2 only in what is pinned; the FFX cases read the shared target cursor and the FFX menu through the same pins).
 *
 * Step D1 edits the FFX-2 command menu (`CommandMenu.ts`: the "Leave <Special>" label, the plate taps, the order hint), the party rows, the shared `TargetCursor.ts` and the mounted
 * FFX-2 HUD (`FFX2BattleHud.ts`: a `PlateTaps` bound to the party list and two optional members handed to every menu). With the switch `specialDressUp` OFF, which is every shipped
 * chapter, all of it must be byte for byte what it is at the head D1 starts from. Pinned, as strings, in `tests/fixtures/specials/off-pins/` (taken once with `PYREFLY_WRITE_PINS=1`):
 *  - the real engine at Chapter IV, Yuna's first decision (switch off): the command window's top rows, the Change submenu, `helpLabel` of every Change row and the aimed-ally view of the
 *    first item row, through `openCommandMenu` with the decision's real commands;
 *  - a MOUNTED `FFX2BattleHud` (pattern `atb-live.test.ts`): the `className` of `.ffx2hud__party` and the `outerHTML` of `.ffx2hud` after the first sync, at a command menu open, at an ally
 *    pick (the aimed view) and after the pick. The HUD passes its `PlateTaps` to every menu, so a pin built without the HUD could not see a DOM write the taps made (code-fit CF-01);
 *  - one FFX chapter's mounted HUD: the party column, the command window and the aimed view of a menu row (the FFX menu shares `TargetCursor`).
 *
 * Removal check: change one character of a menu or row template, or write one class on the party list from a menu, and the matching case fails.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AtbSnapshot, AvailableCommand, BattleState, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setAtbBarsSmooth } from '../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { helpLabel, openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { expectPinned } from './helpers/offPins.ts';
import { bahamutGroup, chapterIV } from './helpers/specialFormState.ts';
import { nextInput, openSpecial, type Input } from './helpers/specialDrive.ts';

const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };

const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
};

/** The real engine at Chapter IV with the switch off, answering Defend until Yuna's first decision. */
function yunaFirstDecision(): Input {
  const engine = openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false });
  for (let i = 0; i < 400; i++) {
    const d = nextInput(engine);
    if (d === null) break;
    if (d.actorId === 'yuna') return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('Yuna never got a decision');
}

/** The first item row of the real decision that lists the girls as targets: the ally pick. */
function allyRow(d: Input): AvailableCommand {
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'item' && c.validTargets.length > 1);
  if (!row) throw new Error('no item row with allies on Yuna\'s first decision');
  return row;
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.spyOn(performance, 'now').mockReturnValue(1000); // the shimmer's phase comes from the page clock
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setAtbBarsSmooth(null);
  document.body.innerHTML = '';
});

describe('OFF pin 5: the FFX-2 command window of the real engine at Chapter IV', () => {
  it('the top rows, the Change submenu, the help label of every Change row and the aimed-ally view are the pinned strings', () => {
    const d = yunaFirstDecision();
    const container = document.createElement('div');
    const targetLayer = document.createElement('div');
    document.body.append(container, targetLayer);
    let close = (): void => {};
    const names: Record<string, string> = { yuna: 'Yuna', rikku: 'Rikku', paine: 'Paine', bahamut: 'Bahamut' };
    const slot: Record<string, number> = { yuna: 0, rikku: 1, paine: 2, bahamut: 3 };
    void openCommandMenu({
      container, targetLayer, commands: d.commands, previewRank: () => EMPTY, onPreview: () => {}, actorName: 'Yuna',
      project: (id) => ({ x: 120 + 160 * (slot[id] ?? 4), y: 260 }),
      nameOf: (id) => names[id] ?? id,
      kindOf: (id) => (id === 'bahamut' ? 'enemy' : 'ally'),
      onOpen: (c) => { close = c; },
    });
    const top = container.innerHTML;
    const changeRow = [...container.querySelectorAll<HTMLElement>('.ig-cmd')].find((r) => r.querySelector('.ffx2cmd__label')?.textContent === 'Change');
    expect(changeRow, 'a Change row on the top level').toBeTruthy();
    changeRow!.click();
    const change = container.innerHTML;
    expect(container.querySelectorAll('.ig-cmd').length).toBeGreaterThan(1);
    const changeRows = d.commands.filter((c) => c.command.kind === 'spherechange');
    const helps = changeRows.map((c) => ({ label: c.label, enabled: c.enabled, help: helpLabel(c) }));
    expect(helps.length).toBeGreaterThan(0);
    close();

    // the aimed-ally view: only the first item row with allies offered, so Enter goes straight to the targets
    const row = allyRow(d);
    const c2 = document.createElement('div');
    const l2 = document.createElement('div');
    document.body.append(c2, l2);
    let close2 = (): void => {};
    void openCommandMenu({
      container: c2, targetLayer: l2, commands: [row], previewRank: () => EMPTY, onPreview: () => {}, actorName: 'Yuna',
      project: (id) => ({ x: 120 + 160 * (slot[id] ?? 4), y: 260 }),
      nameOf: (id) => names[id] ?? id,
      kindOf: (id) => (id === 'bahamut' ? 'enemy' : 'ally'),
      onOpen: (c) => { close2 = c; },
    });
    key('Enter');
    const aimed = l2.innerHTML;
    key('ArrowRight');
    const stepped = l2.innerHTML;
    close2();
    expect(aimed.length).toBeGreaterThan(0);
    expectPinned('command-menu-ffx2-ch4', { top, change, helps, aimed, stepped, rowLabel: row.label });
  });
});

/** A mounted FFX-2 HUD over the real engine's state at Chapter IV, with its recorded surfaces. */
function mountedHud(): { hud: FFX2BattleHud; root: HTMLElement; state: BattleState; snap: AtbSnapshot; d: Input } {
  const chapter = getChapter('ffx2-bahamut')!;
  const engine = new FFX2Engine(ffx2Options());
  engine.setSeed(1);
  engine.init({ game: 'ffx2', party: chapter.buildRef as FFX2PartyBuild, enemies: chapter.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
  const state = engine.state() as BattleState;
  const snap = engine.gaugeSnapshot();
  const root = document.createElement('div');
  document.body.appendChild(root);
  setAtbBarsSmooth(false);
  const hud = new FFX2BattleHud();
  hud.mount(root);
  hud.sync(state, snap);
  return { hud, root, state, snap, d: yunaFirstDecision() };
}

describe('OFF pin 6: the mounted FFX-2 HUD through a command menu open and an ally pick', () => {
  it('.ffx2hud__party\'s className and the .ffx2hud outerHTML are the pinned strings at sync, at the menu open, at the aimed view and after the pick', async () => {
    const { hud, root, snap, d } = mountedHud();
    const hudEl = (): HTMLElement => root.querySelector<HTMLElement>('.ffx2hud')!;
    const party = (): HTMLElement => root.querySelector<HTMLElement>('.ffx2hud__party')!;
    const take = (): { partyClass: string; hud: string } => ({ partyClass: party().className, hud: hudEl().outerHTML });
    const out: Record<string, { partyClass: string; hud: string }> = { synced: take() };
    hud.setProjector((id) => ({ x: id === 'bahamut' ? 560 : 120, y: 200 }));
    const row = allyRow(d);
    const pick = hud.chooseCommand('yuna', [row], () => snap);
    out['menuOpen'] = take();
    key('Enter'); // into the aimed view: the girls are candidates
    out['aimed'] = take();
    key('ArrowRight');
    out['stepped'] = take();
    key('Enter');
    const cmd = await pick;
    expect(cmd.kind).toBe('item');
    out['picked'] = take();
    expect(out['menuOpen']!.partyClass).toBe(out['synced']!.partyClass); // the menu writes no class on the list (code-fit CF-01)
    expectPinned('hud-menu-ffx2-ch4', out);
    hud.unmount();
  });
});

describe('OFF pin 7: one FFX chapter\'s mounted HUD: the party column, the command window and the aimed view', () => {
  it('are the pinned strings (the FFX menu shares TargetCursor)', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.mount(root);
    hud.setProjector((id) => ({ x: 80 + 40 * id.length, y: 240 }));
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    const party = root.querySelector('.ig-stat-list')?.innerHTML ?? root.innerHTML;
    const hp: AvailableCommand = { command: { kind: 'item', id: 'hi-potion', targets: [] }, label: 'Hi-Potion', category: 'item', mpCost: 0, enabled: true, validTargets: state.activeIds.slice(0, 3) };
    void hud.chooseCommand(state.activeIds[0]!, [hp], () => makeFakeTurnPreview());
    const menu = root.querySelector('.ig-cmd-stack')?.innerHTML ?? '';
    for (let i = 0; i < 3 && !document.querySelector('.ffx-target__plate'); i++) (root.querySelector('.ig-cmd') as HTMLElement | null)?.click();
    const aimed = document.querySelector('[data-role="target-cursor"]')?.innerHTML ?? '';
    expect(party.length).toBeGreaterThan(0);
    expect(aimed.length, 'the FFX menu reached its aimed view').toBeGreaterThan(0);
    expectPinned('hud-menu-ffx-fake', { party, menu, aimed, ids: state.activeIds });
    hud.unmount();
  });
});
