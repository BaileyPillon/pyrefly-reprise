// @vitest-environment jsdom
/**
 * A battle screen torn down before its fight has started stays down.
 *
 * Measured on the live build (hotfix 12.1 live check, `critic/reviews/
 * bcbdb483-live.md`): `TypeError: Cannot read properties of null (reading
 * 'syncHud')` and the encounter gone to chapter select. The trigger there was
 * the check's own harness — a `Z` on the title started the real flow, which put
 * Auron's briefing up over the debug-started battle, and the `Esc` meant for the
 * battle skipped the briefing, so the flow went on to chapter select and
 * replaced the battle. What broke is general, though: `BattleScreen.exit()`
 * dismisses the battle-start card (so the `showBattleStart().then(...)` chain
 * settles), and the chain then ran `runEncounter` on the torn-down screen,
 * whose presenter `exit()` had just nulled.
 *
 * The same screen torn down while `enter()` is still loading was worse and
 * silent: `enter()` carried on after `exit()`, built a presenter and a HUD on a
 * detached root, re-added its window key listener and ran an invisible fight.
 *
 * Everything with a renderer is stubbed; the screen's own sequencing is real.
 * Game case: both (shared battle plumbing).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Deferred<T> = { promise: Promise<T>; resolve: (v: T) => void };
function deferred<T>(): Deferred<T> {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const h = vi.hoisted(() => ({
  runEncounterChain: vi.fn(),
  presenters: 0,
  bannerShows: 0,
  scenesDisposed: 0,
  sceneGate: null as null | Promise<void>,
  /** Gates on the loads after the scene: the engine, the staging, the airship hook. */
  gates: {} as Partial<Record<'engine' | 'stage' | 'airship', Promise<void>>>,
}));

const fakeState = {
  enemyIds: ['boss'],
  activeIds: ['tidus'],
  combatants: {
    boss: { id: 'boss', name: 'Boss', spriteKey: 'boss', removed: false, flags: {} },
    tidus: { id: 'tidus', name: 'Tidus', spriteKey: 'tidus', removed: false, flags: {} },
  },
  log: [],
};

vi.mock('../../src/audio/index.ts', () => ({
  audio: { playSfx: vi.fn(), stopMusic: vi.fn(), playMusic: vi.fn(() => Promise.resolve()) },
}));
vi.mock('../../src/scenes/index.ts', () => ({
  loadScene: async () => {
    if (h.sceneGate) await h.sceneGate;
    return {
      palette: {},
      scene: {},
      slots: {},
      battleCamera: { rigNames: [] },
      hideOwnActors: () => undefined,
      setPixelScale: () => undefined,
      update: () => undefined,
      dispose: () => void h.scenesDisposed++,
    };
  },
}));
vi.mock('../../src/engine/BattlePresenterStage.ts', () => ({
  PaintedStage: class {
    highlight = { apply: () => undefined, clear: () => undefined };
    stage = async () => void (await h.gates.stage);
    dispose = () => undefined;
    update = () => undefined;
    snapshot = () => [];
  },
}));
vi.mock('../../src/engine/BattlePresenter.ts', () => ({
  BattlePresenter: class {
    constructor() {
      h.presenters++;
    }
    isAborted = false;
    abort = () => void (this.isAborted = true);
    setSpeed = () => undefined;
    setAutoPlay = () => undefined;
    snapshot = () => ({ phase: 'idle' });
  },
}));
vi.mock('../../src/engine/BattlePresenterFallbacks.ts', () => ({
  createDamageNumbers: () => null,
  createMessageBar: () => null,
  uiPortsRegistered: () => ({ damageNumbers: true, messageBar: true }),
}));
vi.mock('../../src/app/screens/BattleScreenWiring.ts', () => ({
  createEngine: async () => {
    await h.gates.engine;
    return { state: () => fakeState };
  },
  createHud: () => null,
  applyAtbConfig: () => undefined,
}));
vi.mock('../../src/app/screens/BattleScreenAirship.ts', () => ({
  attachAirshipBattle: async () => {
    await h.gates.airship;
    return null;
  },
}));
vi.mock('../../src/app/screens/BattleScreenCutscenes.ts', () => ({
  createMidBattleCutscenes: () => ({ dispose: () => undefined, update: () => undefined, handleInput: () => undefined }),
}));
vi.mock('../../src/ui/common/transitions/index.ts', () => ({
  createMomentOverlay: () => ({ dispose: () => undefined }),
}));
vi.mock('../../src/app/screens/PauseScreen.ts', () => ({ PauseScreen: class {} }));
vi.mock('../../src/app/screens/BattleEncounterChain.ts', () => ({
  runEncounterChain: h.runEncounterChain,
  chainLengthOf: () => Promise.resolve(1),
}));
/** The card: `show()` stays up until `dismiss()`, the way the real one waits on its hold. */
vi.mock('../../src/ui/common/BattleStartBanner.ts', () => ({
  BattleStartBanner: class {
    visible = false;
    private gate = deferred<void>();
    show(): Promise<void> {
      h.bannerShows++;
      this.visible = true;
      return this.gate.promise;
    }
    dismiss(): void {
      this.visible = false;
      this.gate.resolve();
    }
  },
}));

import { BattleScreen } from '../../src/app/screens/BattleScreen.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';

function fakeApp(): unknown {
  return {
    renderer: {
      camera: { position: { clone: () => ({ distanceTo: () => 0 }) } },
      applyPalette: () => undefined,
      domElement: { height: 900 },
    },
    fade: () => Promise.resolve(),
    save: { settings: { textSpeed: 1 }, flushPlayTime: () => undefined, addPlayTime: () => undefined, playTime: () => 0 },
    overlayActive: false,
  };
}

function makeScreen(chapterIndex = 0): BattleScreen {
  const chapter = CHAPTERS[chapterIndex]!;
  const screen = new BattleScreen({ chapter, seed: 1 });
  (screen as unknown as { app: unknown }).app = fakeApp();
  screen.root = document.createElement('div');
  document.body.appendChild(screen.root);
  return screen;
}

const flush = async (): Promise<void> => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};

let keydownAdds = 0;
let keydownRemoves = 0;

beforeEach(() => {
  h.runEncounterChain.mockReset();
  h.runEncounterChain.mockImplementation(() => new Promise(() => undefined));
  h.presenters = 0;
  h.bannerShows = 0;
  h.scenesDisposed = 0;
  h.sceneGate = null;
  h.gates = {};
  keydownAdds = 0;
  keydownRemoves = 0;
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  vi.spyOn(window, 'addEventListener').mockImplementation((type: string, ...rest: unknown[]) => {
    if (type === 'keydown') keydownAdds++;
    return (add as (...a: unknown[]) => void)(type, ...rest);
  });
  vi.spyOn(window, 'removeEventListener').mockImplementation((type: string, ...rest: unknown[]) => {
    if (type === 'keydown') keydownRemoves++;
    return (remove as (...a: unknown[]) => void)(type, ...rest);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('BattleScreen torn down before the fight starts', () => {
  it('control: left alone, the fight starts once the battle-start card goes', async () => {
    const screen = makeScreen();
    await screen.enter();
    await flush();
    expect(h.bannerShows).toBe(1);
    expect(h.runEncounterChain).not.toHaveBeenCalled();
    // A press takes the card down (the screen's own input path), and the fight starts behind it.
    screen.handleInput({ consume: () => true, justPressed: () => false, justReleased: () => false, actions: [] } as never);
    await flush();
    expect(h.runEncounterChain).toHaveBeenCalledTimes(1);
    expect(h.runEncounterChain.mock.calls[0]![0].presenter).not.toBeNull();
    screen.exit();
  });

  it('exit() while the battle-start card is up never starts the fight on the dead screen', async () => {
    const screen = makeScreen();
    await screen.enter();
    await flush();
    expect(h.bannerShows).toBe(1);

    screen.exit(); // what App.replace does when the flow navigates away
    await flush();

    // Before the fix: runEncounter ran with `presenter` null, and the real
    // chain threw "Cannot read properties of null (reading 'syncHud')".
    expect(h.runEncounterChain).not.toHaveBeenCalled();
    expect((await screen.finished).outcome).toBe('aborted');
  });

  it('exit() while enter() is still loading leaves nothing running and no key listener behind', async () => {
    const gate = deferred<void>();
    h.sceneGate = gate.promise;
    const screen = makeScreen();
    const entering = screen.enter();
    await flush();

    screen.exit();
    gate.resolve();
    await entering;
    await flush();

    expect(h.presenters).toBe(0);
    expect(h.bannerShows).toBe(0);
    expect(h.runEncounterChain).not.toHaveBeenCalled();
    expect(h.scenesDisposed).toBe(1);
    expect(keydownAdds - keydownRemoves).toBeLessThanOrEqual(0);
    expect(screen.root.childElementCount).toBe(0);
    expect((await screen.finished).outcome).toBe('aborted');
  });

  it.each(['engine', 'stage', 'airship'] as const)(
    'exit() while enter() awaits the %s load disposes what was built and starts nothing',
    async (load) => {
      const gate = deferred<void>();
      h.gates[load] = gate.promise;
      const screen = makeScreen();
      const entering = screen.enter();
      await flush();

      screen.exit();
      gate.resolve();
      await entering;
      await flush();

      expect(h.presenters).toBe(0);
      expect(h.bannerShows).toBe(0);
      expect(h.runEncounterChain).not.toHaveBeenCalled();
      expect(h.scenesDisposed).toBe(1); // exit() and enter() never both dispose the scene
      expect(keydownAdds - keydownRemoves).toBeLessThanOrEqual(0);
      expect(screen.root.childElementCount).toBe(0);
      expect((await screen.finished).outcome).toBe('aborted');
    },
  );
});
