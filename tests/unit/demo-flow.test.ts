// @vitest-environment jsdom
/**
 * THE BOOTH FLOW (release 61, the conference demo; Bailey, 2026-10-21, decision 169b/c/e; demo mode only; Chapter I is FFX, Chapter IV is FFX-2; `src/app/demo/demoFlow.ts`, `demoBoard.ts`).
 *
 * Claims:
 *  1. Outside demo mode nothing changes: the board is the whole board, a chapter runs with the options it was given.
 *  2. In demo mode the board is exactly two cards, Seymour Flux (FFX) then Bahamut (FFX-2), with no doors, and a visitor's fight skips party prep and the story scenes.
 *  3. After a fight the cursor opens on the other card; with nothing remembered, on the first.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { CHAPTERS } from '../../src/data/encounters.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { DEMO_FIGHTS, demoRunDefaults, isDemoFight, otherDemoFight } from '../../src/app/demo/demoFlow.ts';
import { DEMO_HINTS, DemoBoardScreen, NoDoors, demoStartIndex, demoTiles } from '../../src/app/demo/demoBoard.ts';
import { ChapterSelectScreen } from '../../src/app/screens/ChapterSelectScreen.ts';
import { forgetBoardChapter, rememberBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { makeChapterSelect } from '../../src/app/screens/BattleScreenFlow.ts';
import '../../src/ui/common/registerFlowScreens.ts';
import { DEMO_RESULTS_LOSS_HINTS, DEMO_RESULTS_WIN_HINTS, mountDemoResultsHint } from '../../src/app/demo/demoHints.ts';

const noSave = { isCleared: () => false };

afterEach(() => {
  setDemoMode(null);
  forgetBoardChapter();
  sessionStorage.clear();
});

describe('the two demo fights', () => {
  it('are Chapter I (FFX) and Chapter IV (FFX-2), real chapters, in that order', () => {
    expect(DEMO_FIGHTS.map((f) => f.id)).toEqual(['seymour-flux', 'ffx2-bahamut']);
    const [a, b] = DEMO_FIGHTS.map((f) => CHAPTERS.find((c) => c.id === f.id)!);
    expect(a?.game).toBe('ffx');
    expect(b?.game).toBe('ffx2');
    expect(a?.number).toBe(1);
    expect(b?.number).toBe(4);
    expect(DEMO_FIGHTS.map((f) => f.place)).toEqual(['Mt. Gagazet', 'Bevelle Underground']);
    expect(a?.location).toContain('Mt. Gagazet');
    expect(b?.location).toContain('Bevelle Underground');
  });

  it('isDemoFight and otherDemoFight', () => {
    expect(isDemoFight('seymour-flux')).toBe(true);
    expect(isDemoFight('yunalesca')).toBe(false);
    expect(otherDemoFight('seymour-flux')).toBe('ffx2-bahamut');
    expect(otherDemoFight('ffx2-bahamut')).toBe('seymour-flux');
    expect(otherDemoFight('yunalesca')).toBeNull();
    expect(otherDemoFight(null)).toBeNull();
  });
});

describe('running a demo fight', () => {
  it('skips party prep and the story scenes in demo mode, unless the caller says otherwise', () => {
    setDemoMode(true);
    expect(demoRunDefaults('seymour-flux', {})).toEqual({ skipPrep: true, skipCutscenes: true });
    expect(demoRunDefaults('ffx2-bahamut', { seed: 5 })).toEqual({ seed: 5, skipPrep: true, skipCutscenes: true });
    expect(demoRunDefaults('seymour-flux', { skipPrep: false })).toEqual({ skipPrep: false, skipCutscenes: true });
    expect(demoRunDefaults('seymour-flux', { skipCutscenes: false })).toEqual({ skipPrep: true, skipCutscenes: false });
  });

  it('leaves any other chapter alone, and the hidden Pilgrimage', () => {
    setDemoMode(true);
    const o = {};
    expect(demoRunDefaults('yunalesca', o)).toBe(o);
    const withPilgrim = { pilgrim: {} as never };
    expect(demoRunDefaults('seymour-flux', withPilgrim)).toBe(withPilgrim);
  });

  it('changes nothing outside demo mode', () => {
    setDemoMode(false);
    const o = {};
    expect(demoRunDefaults('seymour-flux', o)).toBe(o);
    expect(demoRunDefaults('ffx2-bahamut', o)).toBe(o);
  });
});

describe('the board', () => {
  it('is two cards, one per game, both playable, no coming rows', () => {
    const tiles = demoTiles(noSave);
    expect(tiles.map((t) => t.id)).toEqual(['seymour-flux', 'ffx2-bahamut']);
    expect(tiles.map((t) => t.game)).toEqual(['ffx', 'ffx2']);
    expect(tiles.every((t) => t.playable && t.kind === 'chapter')).toBe(true);
    expect(tiles.map((t) => t.numeral)).toEqual(['I', 'IV']);
  });

  it('opens on the first card, or on the other one after a fight', () => {
    expect(demoStartIndex()).toBe(0);
    rememberBoardChapter('seymour-flux');
    expect(demoStartIndex()).toBe(1);
    rememberBoardChapter('ffx2-bahamut');
    expect(demoStartIndex()).toBe(0);
    rememberBoardChapter('yunalesca'); // not a demo fight: the first card
    expect(demoStartIndex()).toBe(0);
  });

  it('has three hints, each worded for the keyboard, the pad and the mouse', () => {
    expect(DEMO_HINTS.map((h) => h.label)).toEqual(['choose', 'fight', 'title']);
    for (const h of DEMO_HINTS) expect(h.keyboard && h.gamepad).toBeTruthy();
  });

  it('opens no door: no word, no pad sequence, no tap', () => {
    const d = new NoDoors();
    expect(d.feedKey()).toEqual({ now: null, next: null, claimed: false });
    expect(d.feedButton()).toBeNull();
    expect(d.feedTap()).toBeNull();
    expect(d.isRun()).toBe(false);
    expect(d.isOpen()).toBe(false);
  });
});

describe('which board the flow shows', () => {
  it('the demo board in demo mode', () => {
    setDemoMode(true);
    expect(makeChapterSelect()).toBeInstanceOf(DemoBoardScreen);
  });

  it('the whole board otherwise, exactly the screen it always was', () => {
    setDemoMode(false);
    const screen = makeChapterSelect();
    expect(screen).toBeInstanceOf(ChapterSelectScreen);
    expect(screen).not.toBeInstanceOf(DemoBoardScreen);
  });
});

describe('the results hint strip', () => {
  it('is mounted in demo mode only, and worded for the pad and for the keyboard', () => {
    document.body.innerHTML = '<div id="r"></div>';
    const root = document.getElementById('r')!;
    setDemoMode(false);
    expect(mountDemoResultsHint(root, true)).toBeNull();
    expect(root.querySelector('.chint')).toBeNull();
    setDemoMode(true);
    const hint = mountDemoResultsHint(root, true)!;
    expect(root.querySelector('.chint--demo')).not.toBeNull(); // scaled to the window by demo.css
    expect(root.querySelector('.chint')!.textContent).toContain('Enter');
    expect(root.querySelector('.chint')!.textContent).toContain('continue');
    hint.handleInput({ lastDevice: 'gamepad' } as never);
    expect(root.querySelector('.chint')!.textContent).toContain('Cross');
    hint.unmount();
    expect(root.querySelector('.chint')).toBeNull();
  });

  it('a loss says choose and pick', () => {
    expect(DEMO_RESULTS_WIN_HINTS.map((h) => h.label)).toEqual(['continue']);
    expect(DEMO_RESULTS_LOSS_HINTS.map((h) => h.label)).toEqual(['choose', 'pick']);
    for (const h of [...DEMO_RESULTS_WIN_HINTS, ...DEMO_RESULTS_LOSS_HINTS]) expect(h.gamepad).toBeTruthy();
  });
});
