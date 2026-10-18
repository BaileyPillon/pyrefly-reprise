// @vitest-environment jsdom
/**
 * **Chapter 28 (the Last Summoning), Yuna's Summon list: the Sisters' taken row** (FFX only: aeons, the Magus Sisters and Yu Yevon's offering are FFX's; AGENTS.md rule 14).
 *
 * After the Sisters were given up, the list keeps ONE greyed row labelled "Magus Sisters" (the game's own label, `command.bin` row 0xFF; the three keep Cindy, Sandy and Mindy in battle) with the red
 * TAKEN badge on its right (`ffx-cmd__badge--taken`), as every other taken aeon has. This pins the whole path on the real engine and the real HUD: the engine's command (disabled, with Yu Yevon's reason), the
 * row view-model, and the row the player's list draws (label, disabled class, badge text and class), reached by opening Summon and paging to the row. The label plus the badge must fit a phone's list; jsdom
 * measures nothing, so the length is pinned here and the pictures are `docs/screenshots/ch-last-summoning/1600x900-summon-list-magus-sisters-taken.jpg` and `390x844-summon-list-magus-sisters-taken.jpg` (headless Chromium on the GPU, real keys; at phone width the label keeps its line and TAKEN sits under it, nothing is cut: the row's scroll width equals its client width).
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { AvailableCommand, BattleEngine, BattleState, Decision } from '../../../src/battle/common/types.ts';
import { lastSummoningGroup } from '../../../src/data/ffx/enemies/last-summoning-chain.ts';
import { TAKEN_REASON, linkGroupId } from '../../../src/data/ffx/last-summoning-ids.ts';
import { badgeHtml, subRowVM } from '../../../src/ui/ffx/commandMenuRows.ts';
import type { TopGroupRow } from '../../../src/ui/ffx/CommandMenuLogic.ts';
import { FFXBattleHud } from '../../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeTurnPreview } from '../../../src/ui/ffx/testFixtures.ts';
import { firstLinkSetup, newEngine } from '../helpers/lastSummoningDrive.ts';

type Input = Extract<Decision, { kind: 'player-input' }>;

/** Advance (everyone else defends) to Yuna's input. */
function yunaInput(engine: BattleEngine): Input {
  for (let guard = 0; guard < 400; guard++) {
    const d = engine.nextDecision();
    if (d.kind === 'battle-over') throw new Error('the battle ended');
    if (d.kind !== 'player-input') continue;
    if (d.actorId === 'yuna') return d;
    engine.submit({ kind: 'defend', targets: [] });
  }
  throw new Error('no input for Yuna');
}

/** Link 2 of the order Ifrit, then the Sisters: Ifrit is gone before it and the Sisters are the aeon on the table, so both are taken. */
async function yunaAfterSistersTaken(): Promise<{ commands: AvailableCommand[]; state: BattleState }> {
  const { setup } = await firstLinkSetup(['ifrit', 'sisters'], 1);
  const second = lastSummoningGroup(linkGroupId(['ifrit', 'sisters']))!;
  const engine = newEngine({ ...setup, enemies: second });
  const commands = yunaInput(engine).commands;
  return { commands, state: engine.state() };
}

let cleanup: (() => void) | null = null;
afterEach(() => {
  cleanup?.();
  cleanup = null;
  document.body.innerHTML = '';
});

/** The list as the HUD draws it: Yuna's real commands, Summon opened. */
function openSummon({ commands, state }: { commands: AvailableCommand[]; state: BattleState }): HTMLElement {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  cleanup = () => hud.unmount();
  hud.setProjector(() => ({ x: 0, y: 0 }));
  hud.sync(state, makeFakeTurnPreview());
  void hud.chooseCommand('yuna', commands, () => makeFakeTurnPreview());
  const summon = [...root.querySelectorAll<HTMLElement>('.ig-cmd')].find((r) => r.querySelector('.ffx-cmd__label')?.textContent?.trim() === 'Summon');
  if (!summon) throw new Error('no Summon row on the command stack');
  summon.click();
  return root;
}

const rowsOf = (root: HTMLElement): HTMLElement[] => [...root.querySelectorAll<HTMLElement>('.ig-cmd-stack .ig-cmd')];
const labelOf = (row: HTMLElement): string => row.querySelector('.ffx-cmd__label')!.textContent!.trim();

/** Page forward until the wanted label is on the page (the list holds eight Summon rows and the window six). */
function pageTo(root: HTMLElement, label: string): HTMLElement {
  for (let i = 0; i < 4; i++) {
    const row = rowsOf(root).find((r) => labelOf(r) === label);
    if (row) return row;
    root.querySelector<HTMLButtonElement>('.ffx-cmd-pager button[data-page="1"]')?.click();
  }
  throw new Error(`no ${label} row`);
}

describe('Chapter 28, the Sisters taken: the Summon list draws one greyed "Magus Sisters" row with the TAKEN badge', () => {
  it('the engine offers the row disabled with Yu Yevon’s reason, once, under the game’s label', async () => {
    const summons = (await yunaAfterSistersTaken()).commands.filter((c) => c.command.kind === 'summon');
    const sisters = summons.filter((c) => c.label === 'Magus Sisters');
    expect(sisters).toHaveLength(1);
    expect(sisters[0]).toMatchObject({ enabled: false, disabledReason: TAKEN_REASON, category: 'summon' });
    expect(summons.map((c) => c.label).filter((l) => ['Cindy', 'Sandy', 'Mindy'].includes(l))).toEqual([]);
  });

  it('the row view-model carries the TAKEN badge on the Sisters and on Ifrit, and nothing on a held aeon', async () => {
    const summons = (await yunaAfterSistersTaken()).commands.filter((c) => c.command.kind === 'summon');
    const group = { kind: 'group', label: 'Summon', category: 'summon', role: 'normal', items: summons } as unknown as TopGroupRow;
    const vm = new Map(summons.map((c) => [c.label, subRowVM(c, group, {})]));
    for (const taken of ['Magus Sisters', 'Ifrit']) {
      expect(vm.get(taken), taken).toMatchObject({ label: taken, enabled: false, badge: { kind: 'taken', text: 'TAKEN' } });
      expect(badgeHtml(vm.get(taken)!.badge), taken).toContain('ffx-cmd__badge--taken');
    }
    for (const held of ['Valefor', 'Ixion', 'Shiva', 'Bahamut', 'Anima', 'Yojimbo']) expect(vm.get(held)!.badge, held).toBeUndefined();
  });

  it('the list on screen has the row: label "Magus Sisters", greyed, with a TAKEN tag after it', async () => {
    const root = openSummon(await yunaAfterSistersTaken());
    const row = pageTo(root, 'Magus Sisters');
    expect(row.classList.contains('ig-cmd--disabled')).toBe(true);
    const badge = row.querySelector('.ffx-cmd__badge--taken');
    expect(badge?.textContent).toBe('TAKEN');
    // The label comes before the badge in the row, and nothing else is printed on it.
    expect(row.textContent!.replace(/\s+/g, '')).toBe('MagusSistersTAKEN');
    expect(labelOf(row).length + 'TAKEN'.length).toBeLessThanOrEqual(18); // 13 + 5: what a phone's list has to hold on one line
    const shown = rowsOf(root).map(labelOf);
    for (const gone of ['Cindy', 'Sandy', 'Mindy']) expect(shown, gone).not.toContain(gone);
    expect(shown.filter((l) => l === 'Magus Sisters')).toHaveLength(1);
  });
});
