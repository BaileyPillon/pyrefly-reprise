// @vitest-environment jsdom
/**
 * Release 17 focused review, the two majors (critic/reviews/5860a134-focused.md):
 *
 *  - FOC17-01 (FFX-2 only; FFX kept as it was): the results wedge stood an FFX-2
 *    girl in her FFX portrait (a Chapter VI win with Rikku's line showed
 *    `portraits/rikku.png`), and the leader fallback and the fallen leader did
 *    the same with Yuna. The wedge now takes the chapter's own game's art.
 *  - FOC17-02 (both games; the defect was in FFX-2's menu, FFX's already moved
 *    its cursor): a tapped row sent its command without moving the cursor, so the
 *    phone's target card and confirm named the highlighted row
 *    ("POTION -> ALL ALLIES") while the Mega-Potion went out.
 */
import { describe, expect, it } from 'vitest';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import type { AtbSnapshot, AvailableCommand, BattleResult } from '../../src/battle/common/types.ts';
import { CHAPTERS, getChapter, type ChapterId } from '../../src/data/encounters.ts';
import { leaderId } from '../../src/ui/common/resultsMath.ts';
import { confirmLabel } from '../../src/ui/common/phoneBattle.ts';
import { wedgeFallenArt, wedgePortraitId } from '../../src/ui/common/victoryLine.ts';
import { openCommandMenu } from '../../src/ui/ffx2/CommandMenu.ts';
import { readFfx2Phone } from '../../src/ui/ffx2/phoneHud.ts';

function result(outcome: BattleResult['outcome']): BattleResult {
  return {
    outcome, turns: 10, elapsedTicks: 500, elapsedMs: 60_000, ap: 10, exp: 10, gil: 100,
    drops: [], overkilled: [], sphereLevelsGained: {},
  };
}

function render(chapterId: ChapterId, outcome: BattleResult['outcome'], attempts: number): HTMLElement {
  const save = new SaveStore('foc17-wedge-test', null);
  for (let i = 0; i < attempts; i++) save.recordAttempt(chapterId);
  const screen = new ResultsScreen({ chapterId, result: result(outcome) });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  return root;
}

const wedgeSrc = (root: HTMLElement): string => root.querySelector('.rres__ink img')?.getAttribute('src') ?? '';

/** FFX's own paintings of the two girls who are also in FFX-2. */
const FFX_SELVES = /art\/portraits\/(yuna|rikku)\.png|art\/characters\/(yuna|rikku)\//;

describe('FOC17-01: the results wedge takes the chapter game\'s art', () => {
  const ffx2 = CHAPTERS.filter((c) => c.buildRef.game === 'ffx2');
  const ffx = CHAPTERS.filter((c) => c.buildRef.game === 'ffx');

  it('Chapter VI: every victory line stands its girl in her FFX-2 likeness', () => {
    const seen = new Set<string>();
    for (let attempts = 1; attempts <= 6; attempts++) {
      const root = render('ffx2-leblanc', 'victory', attempts);
      const speaker = root.querySelector<HTMLElement>('.rres__quip')?.dataset.speaker;
      expect(speaker).toBeTruthy();
      seen.add(speaker!);
      const want = speaker === 'paine' ? 'art/portraits/paine.png' : `art/portraits/${speaker}-x2.png`;
      expect(wedgeSrc(root), `attempt ${attempts}`).toContain(want);
      root.remove();
    }
    expect(seen.has('rikku')).toBe(true);
  });

  for (const chapter of ffx2) {
    it(`${chapter.id} (FFX-2): no win or loss shows FFX Yuna or FFX Rikku`, () => {
      for (let attempts = 1; attempts <= 4; attempts++) {
        for (const outcome of ['victory', 'defeat'] as const) {
          const root = render(chapter.id, outcome, attempts);
          expect(wedgeSrc(root), `${outcome} ${attempts}`).not.toMatch(FFX_SELVES);
          root.remove();
        }
      }
    });

    it(`${chapter.id} (FFX-2): a loss lays the leader down in her dressphere`, () => {
      const root = render(chapter.id, 'defeat', 1);
      const lead = leaderId(chapter)!;
      const build = chapter.buildRef;
      const dress = build.game === 'ffx2' ? build.members[0].currentDressphere : '';
      expect(wedgeSrc(root)).toContain(`art/characters/${lead}-${dress}/hurt.png`);
      root.remove();
    });
  }

  for (const chapter of ffx) {
    it(`${chapter.id} (FFX): the wedge keeps the FFX art`, () => {
      const win = render(chapter.id, 'victory', 1);
      const speaker = win.querySelector<HTMLElement>('.rres__quip')?.dataset.speaker ?? leaderId(chapter);
      expect(wedgeSrc(win)).toContain(`art/portraits/${speaker}.png`);
      win.remove();
      const loss = render(chapter.id, 'defeat', 1);
      expect(wedgeSrc(loss)).toContain(`art/characters/${leaderId(chapter)}/hurt.png`);
      loss.remove();
    });
  }

  it('the helpers: FFX ids pass through, FFX-2 ids climb to -x2 where one exists', () => {
    const one = getChapter('seymour-flux');
    const six = getChapter('ffx2-leblanc');
    expect(wedgePortraitId('yuna', one)).toBe('yuna');
    expect(wedgePortraitId('rikku', one)).toBe('rikku');
    expect(wedgePortraitId('yuna', six)).toBe('yuna-x2');
    expect(wedgePortraitId('rikku', six)).toBe('rikku-x2');
    expect(wedgePortraitId('paine', six)).toBe('paine');
    expect(wedgeFallenArt(one, 'tidus')).toEqual(['art/characters/tidus/hurt.png', 'art/characters/tidus/ko.png']);
    expect(wedgeFallenArt(six, 'yuna')).toEqual(['art/characters/yuna-gunner/hurt.png', 'art/characters/yuna-gunner/ko.png']);
  });
});

describe('FOC17-02: a tapped row is the row the target step names (FFX-2 menu)', () => {
  const EMPTY: AtbSnapshot = { elapsedMs: 0, bars: [] };
  const GIRLS = ['yuna', 'rikku', 'paine'];
  const item = (id: string, label: string, targeting: AvailableCommand['targeting']): AvailableCommand => ({
    command: { kind: 'item', id, targets: [] }, label, category: 'item', mpCost: 0, enabled: true, validTargets: GIRLS, targeting,
  });
  const commands: AvailableCommand[] = [
    { command: { kind: 'attack', targets: [] }, label: 'Attack', category: 'attack', mpCost: 0, enabled: true, validTargets: ['leblanc'] },
    item('x2-potion', 'Potion', 'single-ally'),
    item('x2-hi-potion', 'Hi-Potion', 'single-ally'),
    item('x2-mega-potion', 'Mega-Potion', 'all-allies'),
  ];

  function open(): { hud: HTMLElement; done: Promise<unknown> } {
    document.body.innerHTML = '';
    const hud = document.createElement('div');
    hud.className = 'ffx2hud';
    hud.innerHTML = '<div class="ffx2hud__command"></div><div class="ffx-targeting"></div>';
    document.body.appendChild(hud);
    const done = openCommandMenu({
      container: hud.querySelector<HTMLElement>('.ffx2hud__command')!,
      targetLayer: hud.querySelector<HTMLElement>('.ffx-targeting')!,
      commands, previewRank: () => EMPTY, project: () => null, onPreview: () => {}, actorName: 'Yuna',
      kindOf: (id) => (GIRLS.includes(id) ? 'ally' : 'enemy'),
      nameOf: (id) => id.charAt(0).toUpperCase() + id.slice(1),
    });
    return { hud, done };
  }
  const click = (el: Element | null | undefined): void => {
    el?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };
  const rowByLabel = (hud: HTMLElement, label: string): Element | undefined =>
    [...hud.querySelectorAll('[data-idx]')].find((r) => r.querySelector('.ffx2cmd__label')?.textContent === label);

  it('ALL ALLIES: tapping Mega-Potion (not under the cursor) names Mega-Potion and sends it', async () => {
    const { hud, done } = open();
    click(rowByLabel(hud, 'Item'));
    expect(hud.querySelector('.ig-cmd--selected .ffx2cmd__label')?.textContent).toBe('Potion');
    click(rowByLabel(hud, 'Mega-Potion'));
    const text = readFfx2Phone(hud);
    expect(text.targeting).toBe(true);
    expect(text.group).toBe(true);
    expect(text.command).toBe('Mega-Potion');
    expect(confirmLabel(text)).toBe('Mega-Potion → All allies');
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    expect(await done).toEqual({ kind: 'item', id: 'x2-mega-potion', targets: GIRLS });
  });

  it('single target: tapping Hi-Potion names Hi-Potion and sends it', async () => {
    const { hud, done } = open();
    click(rowByLabel(hud, 'Item'));
    click(rowByLabel(hud, 'Hi-Potion'));
    const text = readFfx2Phone(hud);
    expect(text.targeting).toBe(true);
    expect(text.command).toBe('Hi-Potion');
    expect(confirmLabel(text)).toMatch(/^Hi-Potion → /);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    const sent = (await done) as { id: string };
    expect(sent.id).toBe('x2-hi-potion');
  });
});
