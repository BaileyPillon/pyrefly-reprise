// @vitest-environment jsdom
/**
 * **The Pilgrimage's screens follow CHAPTER MUSIC** (PR-0466, round 26 of release 55; hidden prototype, FFX only): the road, the boon pick and the
 * run-over page used to play `chapter-select` (B) whatever OPTIONS > PRESENTATION > CHAPTER MUSIC said; the board asks for
 * `chapterSelectCue(readSetting('chapterSelectMusic'))` (`BattleScreenFlow.chapterSelect`) and now so do they.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { audio } from '../../src/audio/index.ts';
import type { App } from '../../src/app/App.ts';
import { SaveStore, writeSetting } from '../../src/app/SaveData.ts';
import { PilgrimBoonScreen, PilgrimOverScreen, PilgrimRouteScreen } from '../../src/app/pilgrim/PilgrimScreens.ts';
import { finishFight, newRun } from '../../src/app/pilgrim/runState.ts';
import { readPilgrim, setPilgrimStorageForTests } from '../../src/app/pilgrim/runStore.ts';
import type { Screen } from '../../src/app/Screen.ts';

const music: string[] = [];
const asked = (): string | undefined => music[0];

/** A save kept in memory: a `SaveStore` registers itself as the active one (`readSetting` reads it). */
const memory = (): { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void } => {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

beforeEach(() => {
  music.length = 0;
  vi.spyOn(audio, 'playMusic').mockImplementation((cue: string) => { music.push(cue); return Promise.resolve(); });
  vi.spyOn(audio, 'playSfx').mockImplementation(() => undefined as never);
  new SaveStore('r56-pilgrim-music', memory());
  setPilgrimStorageForTests({ getItem: () => null, setItem: () => undefined, removeItem: () => undefined } as never);
});
afterEach(() => {
  vi.restoreAllMocks();
  setPilgrimStorageForTests(null);
  document.body.innerHTML = '';
});

async function mount(screen: Screen): Promise<void> {
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.root = root;
  screen.app = { fade: () => Promise.resolve() } as unknown as App;
  await screen.enter();
}

/** A run that has won its first fight (the boon page) and one that has lost it (the run-over page). */
const won = () => finishFight(newRun(11, 1000), 'victory', 2000);
const lost = () => finishFight(newRun(11, 1000), 'defeat', 2000);

describe('the Pilgrimage plays the chapter-select track the player chose', () => {
  it.each([
    ['a', 'chapter-select-a'],
    ['b', 'chapter-select'],
    ['c', 'chapter-select-c'],
  ] as const)('CHAPTER MUSIC %s: the road, the boon pick and the run-over page all ask for %s', async (letter, cue) => {
    writeSetting('chapterSelectMusic', letter);
    const screens: Screen[] = [new PilgrimRouteScreen(readPilgrim()), new PilgrimBoonScreen(won())];
    screens.push(new PilgrimOverScreen(lost(), { newBest: false, previousBest: null, record: readPilgrim() }));
    for (const s of screens) {
      music.length = 0;
      await mount(s);
      expect(music, `${s.name} with CHAPTER MUSIC ${letter}`).toHaveLength(1);
      expect(asked(), s.name).toBe(cue);
      s.exit();
    }
  });

  it('an unknown stored value plays B, as the board does', async () => {
    writeSetting('chapterSelectMusic', 'zzz' as never);
    await mount(new PilgrimRouteScreen(readPilgrim()));
    expect(asked()).toBe('chapter-select');
  });
});
