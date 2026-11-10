// @vitest-environment jsdom
/**
 * The OFF pins of step D2 of the FFX-2 Special look (game case: both games in what is pinned, unchanged: the pause tab strip and the pro KO marks are shared plumbing; the Special form
 * is FFX-2 only and none of it exists while the switch `specialDressUp` is OFF, which is every shipped chapter).
 *
 * Step D2 adds `plateMemberFor` to the pause screen (a part rides its main's tab) and a part-skipping guard to `ProFieldMarks`. With the switch off both must leave today's surfaces byte for
 * byte as they are at the head D2 starts from. Pinned, as strings, in `tests/fixtures/specials/off-pins/` (taken once with `PYREFLY_WRITE_PINS=1`, see `helpers/offPins.ts`):
 *  - `buildTabs(state)` of the real engine at its first menu for Chapter IV and Chapter V, and of the FFX fake state: ids, labels, member ids, HP hairline, dot, KO flag;
 *  - a real `PauseView` over Chapter IV's state, rendered on each member tab: the arguments of `PortraitStage.show`, the plate on screen, the mirror class, the tab strip's markup and the member
 *    body's text (the pause asks for exactly the plates it asks for today);
 *  - `ProFieldMarks` with the pro piece forced on: the elements a downed girl makes after `sync` and after two seconds of ticks, FFX-2 and FFX.
 * The identity of `plateMemberFor` for every `activeIds` entry of these states is asserted in this file by the commit that adds it.
 *
 * Removal check: change one character of a tab label, or let a girl's tab ask for another plate, or let a downed girl's KO mark change, and the matching case fails.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleState, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseView, type PauseViewDeps } from '../../src/app/screens/pause/PauseView.ts';
import { PortraitStage } from '../../src/app/screens/pause/PortraitStage.ts';
import { buildTabs } from '../../src/app/screens/pause/tabs.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setArtManifest } from '../../src/engine/ArtManifest.ts';
import { setProMode, setProPiece } from '../../src/engine/look/pro/ProSwitch.ts';
import { setDemoChapter } from '../../src/engine/motion/DemoGate.ts';
import { ProFieldMarks } from '../../src/ui/common/ProFieldMarks.ts';
import { makeFakeBattleState } from '../../src/ui/ffx/testFixtures.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { expectPinned } from './helpers/offPins.ts';
import { nextInput } from './helpers/specialDrive.ts';

/** The real FFX-2 engine on a chapter's own party and group, switch off, stepped to the first menu. */
function atMenu(chapterId: string): BattleState {
  const chapter = getChapter(chapterId)!;
  const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
  engine.setSeed(1);
  engine.init({ game: 'ffx2', party: chapter.buildRef as FFX2PartyBuild, enemies: chapter.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
  if (nextInput(engine) === null) throw new Error(`${chapterId}: no menu within the budget`);
  return engine.state() as BattleState;
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.stubGlobal('requestAnimationFrame', () => 0);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.spyOn(performance, 'now').mockReturnValue(1000);
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1600 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setProMode(null);
  setProPiece(null);
  setDemoChapter(undefined);
  setArtManifest(null);
  document.body.innerHTML = '';
});

describe('OFF pin D2-1: the pause tab strip', () => {
  it('Chapter IV and Chapter V at their first menu and the FFX state draw the pinned tabs', () => {
    const out = {
      'ffx2-bahamut': buildTabs(atMenu('ffx2-bahamut')),
      'ffx2-vegnagun-shuyin': buildTabs(atMenu('ffx2-vegnagun-shuyin')),
      'ffx-fake': buildTabs(makeFakeBattleState()),
      'no-battle': buildTabs(null),
    };
    expect(out['ffx2-bahamut'].filter((t) => t.memberId).map((t) => t.label)).toEqual(['Yuna', 'Rikku', 'Paine']);
    expect(out['ffx2-vegnagun-shuyin'].filter((t) => t.memberId).length).toBe(3);
    expect(out['ffx-fake'].filter((t) => t.memberId).length).toBe(3);
    expectPinned('pause-tabs', out);
  });
});

describe('OFF pin D2-2: a real PauseView over Chapter IV asks for the plates it asks for today', () => {
  it('each member tab: the show arguments, the plate, the mirror class, the tab strip and the body text', () => {
    const state = atMenu('ffx2-bahamut');
    const out: Record<string, unknown> = {};
    for (const manifest of ['none', 'plates'] as const) {
      setArtManifest(manifest === 'none' ? null : { version: 1, generatedAt: 'test', subjects: {}, portraits: ['yuna-ffx2', 'rikku-ffx2', 'paine'], backdrops: [], pause: ['yuna-ffx2', 'rikku-ffx2', 'paine'], pause2x: [], title: [], title2x: [] });
      for (const id of ['yuna', 'rikku', 'paine']) {
        const shown: unknown[][] = [];
        const show = PortraitStage.prototype.show;
        const spy = vi.spyOn(PortraitStage.prototype, 'show').mockImplementation(function (this: PortraitStage, ...args: Parameters<PortraitStage['show']>) {
          shown.push([...args]);
          return show.apply(this, args);
        });
        const root = document.createElement('div');
        document.body.appendChild(root);
        const chapter = getChapter('ffx2-bahamut')!;
        const deps: PauseViewDeps = {
          chapter, meta: undefined, save: new SaveStore('d2-pause-pin', null), state: () => state, context: () => ({}) as never, turnOrder: () => null,
          canRestart: false, canChapterSelect: false, canQuit: false, extraRows: [],
        };
        const view = new PauseView(root, deps);
        view.render({ tabId: `member:${id}`, focus: 'tabs', rowId: null });
        out[`${manifest}/${id}`] = {
          shown,
          plate: view.portrait.plateId,
          imgs: [...root.querySelectorAll<HTMLImageElement>('img')].map((i) => ({ plate: i.dataset['plate'], src: i.getAttribute('src'), art: i.dataset['art'] })),
          mirrored: view.mirrored,
          tabs: root.querySelector('[data-role="tabs"]')!.innerHTML,
          body: root.querySelector('[data-role="body"]')!.textContent,
        };
        view.dispose();
        spy.mockRestore();
        root.remove();
      }
    }
    expect((out['plates/yuna'] as { plate: string }).plate).toBe('yuna-ffx2');
    expect((out['plates/paine'] as { plate: string }).plate).toBe('paine');
    expectPinned('pause-view-ffx2-ch4', out);
  });
});

describe('OFF pin D2-3: the pro KO marks of a downed girl', () => {
  const tick = (m: ProFieldMarks, ms: number): void => {
    for (let t = 0; t < ms; t += 10) m.update(0.01);
  };

  it('FFX-2 Chapter IV (Rikku down) and the FFX state (Tidus down) make the pinned elements', () => {
    const out: Record<string, unknown> = {};
    setProMode('pro');

    setDemoChapter('ffx2-bahamut');
    const ffx2 = atMenu('ffx2-bahamut');
    const rikku = ffx2.combatants['rikku']!;
    rikku.hp = 0;
    rikku.alive = false;
    const a = new ProFieldMarks('ffx2');
    document.body.append(a.el);
    a.setProjector((id) => ({ x: 300 + 200 * ffx2.activeIds.indexOf(id), y: 700 }));
    a.sync(ffx2);
    out['ffx2/after-sync'] = { count: a.count, html: a.el.innerHTML };
    tick(a, 2000);
    out['ffx2/after-2s'] = { count: a.count, html: a.el.innerHTML };
    expect(a.count).toBe(1);

    setDemoChapter('seymour-flux');
    const ffx = makeFakeBattleState();
    ffx.combatants['tidus']!.hp = 0;
    ffx.combatants['tidus']!.alive = false;
    const b = new ProFieldMarks('ffx');
    document.body.append(b.el);
    b.setProjector((id) => ({ x: 300 + 200 * ffx.activeIds.indexOf(id), y: 700 }));
    b.sync(ffx);
    out['ffx/after-sync'] = { count: b.count, html: b.el.innerHTML };
    tick(b, 2000);
    out['ffx/after-2s'] = { count: b.count, html: b.el.innerHTML };
    expect(b.count).toBe(1);

    expectPinned('pro-field-marks-ko', out);
  });
});
