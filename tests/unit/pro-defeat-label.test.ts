// @vitest-environment jsdom
/**
 * The defeat card's second slab says what it does (backlog 58, release 67; both games; Chapter I FFX and Chapter IV FFX-2, where the pro staging's defeat card is on).
 *
 * On the PUBLIC address the card said OTHER FIGHT but the flow only starts another fight for a demo fight in demo mode (`noteDemoDefeatChoice` -> `takeDemoNextFight`), so the slab returned to the chapter select.
 * Now: the demo path (`ProDefeatOptions.otherFight`, which the flow sets from `demoDefeatPanel(chapter.id)`) keeps OTHER FIGHT and its `other-fight` choice; the public path reads CHAPTER SELECT and gives
 * `chapter-select`, the old defeat panel's word for it. TRY AGAIN is the first slab on both. The results screen's own slabs (RETRY / CHAPTER SELECT, TRY AGAIN / OTHER FIGHT) are `r62-demo-defeat.test.ts`'s.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { demoDefeatPanel, noteDemoDefeatChoice, takeDemoNextFight } from '../../src/app/demo/demoDefeat.ts';
import { PRO_DEFEAT_DEMO_ACTIONS, PRO_DEFEAT_PUBLIC_ACTIONS, ProDefeatScreen } from '../../src/app/screens/ProDefeatScreen.ts';

afterEach(() => {
  setDemoMode(null);
  document.body.innerHTML = '';
});

type Opts = ConstructorParameters<typeof ProDefeatScreen>[0];

function boot(over: Partial<Opts>): { screen: ProDefeatScreen; choices: string[]; press: (name: string) => void; labels: () => string[]; actionsOf: () => Array<string | null> } {
  const choices: string[] = [];
  const screen = new ProDefeatScreen({ game: 'ffx', turns: 9, elapsedMs: 42000, attempt: 1, onChoice: (c) => choices.push(c), ...over });
  screen.root = document.createElement('div');
  document.body.appendChild(screen.root);
  screen.enter();
  const press = (name: string): void => screen.handleInput({ actions: [], consume: (n: string) => n === name, justPressed: () => false } as never);
  const buttons = (): HTMLElement[] => [...screen.root.querySelectorAll<HTMLElement>('.pdf__btn')];
  return {
    screen,
    choices,
    press,
    labels: () => buttons().map((b) => b.querySelector(':scope > span')?.textContent ?? ''),
    actionsOf: () => buttons().map((b) => b.getAttribute('data-action')),
  };
}

describe('the demo path keeps OTHER FIGHT', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: TRY AGAIN and OTHER FIGHT, and the second slab gives other-fight`, () => {
      const t = boot({ game, otherFight: true });
      expect(t.labels()).toEqual(['Try again', 'Other fight']);
      expect(t.actionsOf()).toEqual(['results:retry', 'results:other-fight']);
      t.press('right');
      t.press('confirm');
      expect(t.choices).toEqual(['other-fight']);
    });
  }

  it('a click on the slab\'s own action word picks it', () => {
    const t = boot({ otherFight: true });
    t.screen.handleInput({ actions: ['results:other-fight'], consume: () => false, justPressed: () => false } as never);
    expect(t.choices).toEqual(['other-fight']);
  });
});

describe('the public address says CHAPTER SELECT', () => {
  for (const game of ['ffx', 'ffx2'] as const) {
    it(`${game}: TRY AGAIN and CHAPTER SELECT, and the second slab gives chapter-select`, () => {
      const t = boot({ game, otherFight: false });
      expect(t.labels()).toEqual(['Try again', 'Chapter select']);
      expect(t.screen.root.textContent?.toLowerCase()).not.toContain('other fight');
      expect(t.actionsOf()).toEqual(['results:retry', 'results:chapter-select']);
      t.press('right');
      t.press('confirm');
      expect(t.choices).toEqual(['chapter-select']);
    });
  }

  it('is also what a card built with no word says (a card never claims a fight it will not start)', () => {
    expect(boot({}).labels()).toEqual(['Try again', 'Chapter select']);
  });

  it('TRY AGAIN is still the focused slab and one confirm is retry', () => {
    const t = boot({ otherFight: false });
    expect(t.screen.root.querySelector('.pdf__btn')?.classList.contains('is-focus')).toBe(true);
    t.press('confirm');
    expect(t.choices).toEqual(['retry']);
  });

  it('a click on the slab, a stale other-fight word, and Back all leave for the chapter select, once', () => {
    const click = boot({ otherFight: false });
    click.screen.handleInput({ actions: ['results:chapter-select'], consume: () => false, justPressed: () => false } as never);
    expect(click.choices).toEqual(['chapter-select']);
    const stale = boot({ otherFight: false });
    expect(stale.screen.trigger('results:other-fight')).toBe(true);
    expect(stale.choices).toEqual(['chapter-select']);
    const back = boot({ otherFight: false });
    back.press('cancel');
    back.press('confirm');
    expect(back.choices).toEqual(['chapter-select']);
  });

  it('the two lists are what the card shows', () => {
    expect(PRO_DEFEAT_DEMO_ACTIONS.map((a) => a.choice)).toEqual(['retry', 'other-fight']);
    expect(PRO_DEFEAT_PUBLIC_ACTIONS.map((a) => a.choice)).toEqual(['retry', 'chapter-select']);
  });
});

describe('which path a lost fight is on', () => {
  it('the flow\'s word is demoDefeatPanel: demo mode in a demo fight is the demo path; the public address and any other chapter are not', () => {
    setDemoMode(false);
    expect(demoDefeatPanel('seymour-flux')).toBe(false);
    expect(demoDefeatPanel('ffx2-bahamut')).toBe(false);
    setDemoMode(true);
    expect(demoDefeatPanel('seymour-flux')).toBe(true);
    expect(demoDefeatPanel('ffx2-bahamut')).toBe(true);
    expect(demoDefeatPanel('yunalesca')).toBe(false);
  });

  it('the public answer cannot start a fight: chapter-select is remembered as nothing, and so is a stale other-fight outside demo mode', () => {
    setDemoMode(false);
    noteDemoDefeatChoice('seymour-flux', 'chapter-select');
    expect(takeDemoNextFight()).toBeNull();
    noteDemoDefeatChoice('seymour-flux', 'other-fight');
    expect(takeDemoNextFight()).toBeNull();
    setDemoMode(true);
    noteDemoDefeatChoice('seymour-flux', 'other-fight');
    expect(takeDemoNextFight()).toBe('ffx2-bahamut');
  });

  it('the flow hands the card its path (wired, not just built): showProDefeat passes demoDefeatPanel(chapter.id) as otherFight', () => {
    const flow = readFileSync(join(process.cwd(), 'src/app/screens/BattleScreenFlow.ts'), 'utf8');
    expect(flow).toMatch(/new ProDefeatScreen\(\{[^}]*otherFight: demoDefeatPanel\(chapter\.id\)/);
  });
});
