// @vitest-environment jsdom
/**
 * PR-0115: P toggles the pause wherever it opens it, and opens it over a
 * pre-battle scene too.
 *
 * Game case: both (shared pause and cutscene plumbing; CHK-015). The real-key
 * half is `tests/e2e/pause-p-toggle.spec.ts`.
 */

import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { createPauseKeyLatch, pauseKeyIntent } from '../../src/app/screens/pause/keys.ts';
import { getChapter } from '../../src/data/encounters.ts';
import type { App } from '../../src/app/App.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { resetCoach } from '../../src/ui/coach/coachState.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, String(v)), removeItem: (k) => void map.delete(k) };
}

function keydown(code: string, init: KeyboardEventInit = {}): void {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init }));
}

let dispose: (() => void) | null = null;

beforeAll(async () => {
  await registerBattleContent();
});

afterEach(() => {
  dispose?.();
  dispose = null;
  resetCoach();
  document.body.innerHTML = '';
});

describe('PR-0115: P toggles the pause', () => {
  it('P means "resume" on the pause screen', () => {
    expect(pauseKeyIntent('KeyP')).toEqual({ intent: 'resume', suppress: null });
  });

  it('a real P keydown on the open pause closes it', () => {
    const chapter = getChapter('seymour-flux')!;
    const store = new SaveStore('pause-p-toggle', memoryStorage());
    const input = new Input({ keyboardTarget: window });
    input.attach();
    const root = document.createElement('div');
    document.body.appendChild(root);
    let resumed = 0;
    const screen = new PauseScreen({ chapter, onResume: () => void resumed++ });
    screen.app = { save: store, input, screens: [screen] } as unknown as App;
    screen.root = root;
    void screen.enter();
    dispose = () => {
      screen.exit();
      input.detach();
      root.remove();
    };
    keydown('KeyP');
    expect(resumed).toBe(1);
    keydown('KeyP', { repeat: true });
    expect(resumed, 'a held key does not count twice').toBe(1);
  });

  it('the scene latch takes one P press, once, and ignores key repeat and other keys', () => {
    const latch = createPauseKeyLatch(window);
    expect(latch.take()).toBe(false);
    keydown('KeyP');
    keydown('KeyP', { repeat: true });
    keydown('KeyO');
    expect(latch.take()).toBe(true);
    expect(latch.take()).toBe(false);
    latch.dispose();
    keydown('KeyP');
    expect(latch.take(), 'no listener after dispose').toBe(false);
  });
});
