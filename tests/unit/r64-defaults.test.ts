// @vitest-environment jsdom
/**
 * r64 DEFAULTS (conference demo, Bailey 2026-10-24 ~13:40 EDT, item 200: "you can make all the decisions for me, ill go with all your recommendations"; the driver's calls under it, his to overturn).
 * Both games (shared plumbing); Chapter I (`seymour-flux`, FFX) and Chapter IV (`ffx2-bahamut`, FFX-2) are the only chapters any of it acts in.
 *
 *  1. 200b  the conference pack is ON by default (no `?pack=demo`); every lane answers it; `?pack=off` and each lane's own off word keep the old behaviour; no page is still today's;
 *  2. 200e  the party's edge light is OFF by default (`?partyrim=on` brings it back);
 *  3. 200i  the Echo end card after a fight: the "Press any button" hint in the card's own type (28 px at 2560 x 1440), the end by timer or by press, and the flow's return to the TITLE only after a timer;
 *  4. 200i  60 s idle on the fight picker returns to the title (the cancel's own path), and only with the booth screens on;
 *  5. 200h  the sentence "All code, art, music, and writing here are original" is gone from the game's FAN_NOTICE, the README and the press page; the property and not-affiliated lines stay.
 */
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { App } from '../../src/app/App.ts';
import { setDemoMode } from '../../src/app/demoMode.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { Screen } from '../../src/app/Screen.ts';
import { BUTTONS, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { FAN_NOTICE } from '../../src/app/credits/creditsData.ts';
import { boothModeFromSearch, setBoothMode } from '../../src/app/demo/boothSwitch.ts';
import { END_PRESS, endCardMarkup } from '../../src/app/demo/boothCards.ts';
import { DemoBoardScreen } from '../../src/app/demo/demoBoard.ts';
import { PICKER_IDLE_MS } from '../../src/app/demo/demoIdle.ts';
import { DemoThanksScreen, THANKS_GUARD_MS, THANKS_MS } from '../../src/app/demo/demoThanks.ts';
import { prebuildFromSearch } from '../../src/app/demo/prebuildSwitch.ts';
import { forgetBoardChapter } from '../../src/app/screens/frontend/boardFocus.ts';
import { GameFlow, registerFlowScreens, resetFlowScreens, type FlowScreen, type ResultsScreenOptions } from '../../src/app/screens/BattleScreenFlow.ts';
import type { BattleScreenOptions, BattleScreenResult } from '../../src/app/screens/BattleScreen.ts';
import { passConfiguredBy } from '../../src/audio/pass/passSwitch.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import type { ChapterId } from '../../src/data/encounters.ts';
import { parseFeelKeys } from '../../src/engine/feel/FeelSwitch.ts';
import { partyRimFromSearch } from '../../src/engine/look/pro/PartyRimSwitch.ts';
import { proModeFromSearch } from '../../src/engine/look/pro/ProSwitch.ts';
import { bossCleanFromSearch } from '../../src/engine/look/pro/BossClean.ts';
import { PACK_DEFAULT_ON, packDemo } from '../../src/engine/motion/DemoGate.ts';
import { curvesModeFromSearch } from '../../src/engine/motion/CurvesSwitch.ts';
import { momentsModeFromSearch } from '../../src/engine/motion/MomentsSwitch.ts';
import { smearStyleFromSearch } from '../../src/engine/motion/SmearSwitch.ts';
import { stagingModeFromSearch } from '../../src/engine/pro/staging/StagingSwitch.ts';
import { parseProCamKeys } from '../../src/engine/procam/ProCamSwitch.ts';
import { fxModeFromSearch } from '../../src/engine/spellfx/FxSwitch.ts';
import { hudF1ModeFromSearch } from '../../src/ui/hudf1/HudF1Switch.ts';

// ------------------------------------------------------------------------------------------------ 1. the pack is the default

/** Every lane's "is it on for this address" as a boolean, with the word that turns that lane (and only that lane) back to today's. */
const LANES: ReadonlyArray<{ name: string; on: (s: string | undefined) => boolean; ownOff: string }> = [
  { name: 'F1 HUD', on: (s) => hudF1ModeFromSearch(s) === 'f1', ownOff: '?hud=today' },
  { name: 'sound pass', on: (s) => passConfiguredBy(s), ownOff: '?audio=today' },
  { name: 'boss edges', on: (s) => bossCleanFromSearch(s) === 'clean', ownOff: '?boss=today' },
  { name: 'fight prebuild', on: (s) => prebuildFromSearch(s), ownOff: '?prebuild=off' },
  { name: 'booth screens', on: (s) => boothModeFromSearch(s) === 'new', ownOff: '?booth=today' },
  { name: 'pro look', on: (s) => proModeFromSearch(s) === 'pro', ownOff: '?look=today' },
  { name: 'pro look (master)', on: (s) => proModeFromSearch(s) === 'pro', ownOff: '?pro=off' },
  { name: 'pro camera', on: (s) => (parseProCamKeys(s).camera ?? parseProCamKeys(s).pack), ownOff: '?camera=off' },
  { name: 'pro camera (master)', on: (s) => (parseProCamKeys(s).camera ?? parseProCamKeys(s).pack), ownOff: '?pro=off' },
  { name: 'pro staging', on: (s) => stagingModeFromSearch(s) === 'pro', ownOff: '?staging=today' },
  { name: 'pro staging (master)', on: (s) => stagingModeFromSearch(s) === 'pro', ownOff: '?pro=off' },
  { name: 'curves', on: (s) => curvesModeFromSearch(s) !== 'today', ownOff: '?curves=today' },
  { name: 'moments', on: (s) => momentsModeFromSearch(s) === 'new', ownOff: '?moments=today' },
  { name: 'smear', on: (s) => smearStyleFromSearch(s) !== 'off', ownOff: '?smear=off' },
  { name: 'spell and boss fx', on: (s) => fxModeFromSearch(s) === 'new', ownOff: '?fx=today' },
  { name: 'big-hit camera punch', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).punch !== 'today' && parseFeelKeys(s).punch !== 'off', ownOff: '?punch=today' },
  { name: 'hit-stop', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).hitstop !== 'today' && parseFeelKeys(s).hitstop !== 'off', ownOff: '?hitstop=today' },
  { name: 'rumble', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).rumble !== false, ownOff: '?rumble=off' },
  { name: 'contact shadow', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).shadow !== false, ownOff: '?shadow=today' },
  { name: 'motion sounds', on: (s) => parseFeelKeys(s).pack && parseFeelKeys(s).motionsfx !== false, ownOff: '?motionsfx=off' },
];

describe('1. 200b: the conference pack is the default in Chapter I and Chapter IV', () => {
  it('the one reader: on with no word, with ?demo=1 alone and with ?pack=demo; off with ?pack=off (today, 0) and with no page', () => {
    expect(PACK_DEFAULT_ON).toBe(true);
    for (const s of ['', '?demo=1', '?pack=demo', '?demo=1&pack=demo', '?a=1&pack= DEMO ', '?pack=whatever']) expect(packDemo(s), s).toBe(true);
    for (const s of ['?pack=off', '?pack=OFF', '?pack=today', '?pack=0', '?demo=1&pack=off', undefined]) expect(packDemo(s), String(s)).toBe(false);
  });

  for (const lane of LANES) {
    it(`${lane.name}: on with no word and with ?demo=1; off with ?pack=off and with no page; its own off word turns it off alone`, () => {
      expect(lane.on(''), 'no word').toBe(true);
      expect(lane.on('?demo=1'), '?demo=1').toBe(true);
      expect(lane.on('?pack=demo'), '?pack=demo').toBe(true);
      expect(lane.on('?pack=off'), '?pack=off').toBe(false);
      expect(lane.on(undefined), 'no page').toBe(false);
      expect(lane.on(lane.ownOff), lane.ownOff).toBe(false);
      expect(lane.on(`?pack=demo&${lane.ownOff.slice(1)}`), `?pack=demo with ${lane.ownOff}`).toBe(false); // the lane's word beats the pack
    });
  }

  it('each lane\'s own off word leaves the others on (the lanes stay independent)', () => {
    expect(hudF1ModeFromSearch('?hud=today')).toBe('today');
    expect(passConfiguredBy('?hud=today')).toBe(true);
    expect(bossCleanFromSearch('?hud=today')).toBe('clean');
    expect(proModeFromSearch('?audio=today')).toBe('pro');
    expect(prebuildFromSearch('?demo=1&boss=today')).toBe(true);
  });

  it('?pro=off takes only the three pro lanes back; the motion pack and the HUD stay on', () => {
    const s = '?pro=off';
    expect([proModeFromSearch(s), stagingModeFromSearch(s), parseProCamKeys(s).camera]).toEqual(['today', 'today', false]);
    expect([curvesModeFromSearch(s), momentsModeFromSearch(s), hudF1ModeFromSearch(s)]).toEqual(['new', 'new', 'f1']);
  });
});

// ------------------------------------------------------------------------------------------------ 2. the party rim

describe('2. 200e: the party\'s edge light is OFF by default (both games)', () => {
  it('off with no word and with the pack; ?partyrim=on brings it back; ?pack=off is the old rim; no page is the old rim', () => {
    expect(partyRimFromSearch('')).toBe('off');
    expect(partyRimFromSearch('?demo=1')).toBe('off');
    expect(partyRimFromSearch('?pack=demo')).toBe('off');
    expect(partyRimFromSearch('?partyrim=on')).toBe('on');
    expect(partyRimFromSearch('?pack=demo&partyrim=on')).toBe('on');
    expect(partyRimFromSearch('?partyrim=off')).toBe('off');
    expect(partyRimFromSearch('?pack=off')).toBe('on');
    expect(partyRimFromSearch(undefined)).toBe('on');
  });
});

// ------------------------------------------------------------------------------------------------ 3. the end card

function snapshot(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const edges = new Set(pressed);
  return {
    pressed: (b) => edges.has(b),
    justPressed: (b) => edges.has(b),
    justReleased: () => false,
    consume: (b) => edges.delete(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: true,
    lastDevice: 'gamepad',
  };
}

function openCard(chapterId: string): { screen: DemoThanksScreen; root: HTMLElement } {
  const screen = new DemoThanksScreen({ chapterId });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { fade: () => Promise.resolve(), uiRoot: document.body } as unknown as App;
  screen.root = root;
  screen.enter();
  return { screen, root };
}

const tick = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
const cssOf = (p: string): string => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

describe('3. 200i: the end card after a fight', () => {
  beforeEach(() => {
    setDemoMode(true);
    setBoothMode('new');
    document.body.innerHTML = '';
  });
  afterEach(() => {
    setDemoMode(null);
    setBoothMode(null);
    document.body.innerHTML = '';
  });

  it('the card after a fight carries "Press any button" in the card\'s own type; the booth loop\'s own card (?card=end) does not', () => {
    expect(END_PRESS).toBe('Press any button');
    const { root } = openCard('seymour-flux');
    const hint = root.querySelector('.booth-end__press');
    expect(hint).not.toBeNull();
    expect(hint!.textContent).toContain('Press any button');
    expect(hint!.querySelector('.booth-scan')).not.toBeNull(); // the card's own label type
    expect(endCardMarkup({ afterFight: true })).toContain('Press any button');
    expect(endCardMarkup()).not.toContain('Press any button');
    expect(endCardMarkup()).not.toContain('booth-end__press');
  });

  it('the hint is at least 28 px at 2560 x 1440 (16 grid units; the grid unit is 1.78 px there) and the card holds about 8 s', () => {
    const css = cssOf('src/app/demo/boothCards.css');
    const scan = /\.booth-scan \{[^}]*font-size: calc\((\d+) \* var\(--bk\)\)/.exec(css);
    expect(scan, '.booth-scan has a grid-unit font size').not.toBeNull();
    const bk = Math.min(2560 / 1440, 1440 / 810); // --bk: max(0.5px, min(100vw / 1440, 100vh / 810)) at 2560 x 1440
    expect(Number(scan![1]) * bk).toBeGreaterThanOrEqual(28);
    const press = /\.booth-end__press \{[^}]*\}/.exec(css)![0];
    expect(press).not.toContain('font-size'); // it takes .booth-scan's, never a smaller one of its own
    expect(THANKS_MS).toBe(8000);
  });

  it('it ends by the timer after 8 s (endedBy timer), by a press after the guard (press), by a click (press) and by leaving (left); a press inside the guard does nothing', async () => {
    const a = openCard('seymour-flux');
    expect(a.screen.endedBy).toBeNull();
    for (let i = 0; i < 7 * 60; i++) a.screen.update(1 / 60);
    expect(a.screen.endedBy).toBeNull();
    for (let i = 0; i < 61; i++) a.screen.update(1 / 60);
    await tick();
    expect(a.screen.endedBy).toBe('timer');

    for (const b of BUTTONS) {
      const c = openCard('ffx2-bahamut');
      c.screen.update(THANKS_GUARD_MS / 1000 / 2);
      c.screen.handleInput(snapshot([b]));
      expect(c.screen.endedBy, `${b} inside the guard`).toBeNull();
      c.screen.update(THANKS_GUARD_MS / 1000);
      c.screen.handleInput(snapshot([b]));
      expect(c.screen.endedBy, `${b} after the guard`).toBe('press');
    }

    const d = openCard('seymour-flux');
    d.screen.update(1);
    d.screen.handleInput(snapshot([], ['thanks:end']));
    expect(d.screen.endedBy).toBe('press');

    const e = openCard('seymour-flux');
    e.screen.exit();
    expect(e.screen.endedBy).toBe('left');
  });

  it('whichever comes first stays: a press after the timer does not change how it ended', async () => {
    const { screen } = openCard('seymour-flux');
    for (let i = 0; i < 8 * 60 + 5; i++) screen.update(1 / 60);
    screen.handleInput(snapshot(['confirm']));
    expect(screen.endedBy).toBe('timer');
  });
});

// ------------------------------------------------------------------------------------------------ 3b. the flow after the card

describe('3b. 200i: the flow goes to the TITLE only when the card ran out its time', () => {
  const played: string[] = [];
  let ending: 'timer' | 'press' | 'left' = 'timer';

  class FakeResults extends Screen implements FlowScreen<void> {
    readonly name = 'results';
    readonly done = Promise.resolve();
    constructor(readonly opts: ResultsScreenOptions) {
      super();
    }
    override enter(): void {
      played.push('results');
    }
  }
  class FakeBattle extends Screen implements FlowScreen<BattleScreenResult> {
    readonly name = 'battle';
    readonly done: Promise<BattleScreenResult>;
    constructor(opts: BattleScreenOptions) {
      super();
      const result = { outcome: 'victory', turns: 12, elapsedTicks: 900, elapsedMs: 0, ap: 10, exp: 0, gil: 0, drops: [], overkilled: [], sphereLevelsGained: {} } as unknown as BattleResult;
      this.done = Promise.resolve({ chapterId: opts.chapter.id, outcome: 'victory', result, elapsedMs: 120_000, links: 1, preview: false });
    }
    override enter(): void {
      played.push('battle');
    }
  }
  class FakeThanks extends Screen implements FlowScreen<void> {
    readonly name = 'demo-thanks';
    readonly done = Promise.resolve();
    readonly endedBy = ending;
    override enter(): void {
      played.push(`thanks:${this.endedBy}`);
    }
  }
  class FakeApp {
    readonly uiRoot = document.createElement('div');
    readonly save = new SaveStore();
    readonly flow: GameFlow;
    readonly went: string[] = [];
    current: Screen | null = null;
    constructor() {
      document.body.appendChild(this.uiRoot);
      this.flow = new GameFlow(this as unknown as App);
    }
    get overlayActive(): boolean {
      return false;
    }
    async replace(screen: Screen): Promise<void> {
      const previous = this.current;
      this.current = null;
      if (previous) {
        await previous.exit();
        previous.root?.remove();
      }
      screen.app = this as unknown as App;
      screen.root = document.createElement('div');
      this.uiRoot.appendChild(screen.root);
      this.current = screen;
      await screen.enter();
    }
    async goto(name: string): Promise<boolean> {
      this.went.push(name);
      return true;
    }
    fade(): Promise<void> {
      return Promise.resolve();
    }
    nextFrame(): Promise<void> {
      return Promise.resolve();
    }
  }

  /** The picker: answers the queued picks, then backs out (Esc). */
  function picker(picks: ChapterId[]): () => FlowScreen<ChapterId | null> {
    const queue = [...picks];
    return () => {
      const next = queue.shift() ?? null;
      return new (class extends Screen implements FlowScreen<ChapterId | null> {
        readonly name = 'chapter-select';
        readonly done = Promise.resolve(next);
        override enter(): void {
          played.push('picker');
        }
      })();
    };
  }

  let app: FakeApp;
  const start = async (): Promise<void> => {
    resetFlowScreens();
    registerFlowScreens({
      results: (o: ResultsScreenOptions) => new FakeResults(o),
      battle: (o: BattleScreenOptions) => new FakeBattle(o),
      demoThanks: () => new FakeThanks(),
      chapterSelect: picker(['seymour-flux']),
    } as never);
    app = new FakeApp();
    await app.flow.start();
  };

  beforeEach(() => {
    played.length = 0;
    forgetBoardChapter();
    setDemoMode(true);
    setBoothMode('new');
    document.body.innerHTML = '';
  });
  afterEach(() => {
    setDemoMode(null);
    setBoothMode(null);
    resetFlowScreens();
    document.body.innerHTML = '';
  });

  it('a card that ran out its 8 s sends the visit to the title: no second picker', async () => {
    ending = 'timer';
    await start();
    expect(played).toEqual(['picker', 'battle', 'results', 'thanks:timer']);
    expect(app.went).toEqual(['title']);
  });

  it('a press on the card goes to the picker at once, as it always did', async () => {
    ending = 'press';
    await start();
    expect(played).toEqual(['picker', 'battle', 'results', 'thanks:press', 'picker']); // the second picker answers null (Esc) and the flow leaves for the title the way the picker always did
    expect(app.went).toEqual(['title']);
    expect(played.filter((p) => p === 'picker')).toHaveLength(2);
  });

  it('a card taken away (the hold-reset, a navigation) does not count as the time running out', async () => {
    ending = 'left';
    await start();
    expect(played.filter((p) => p === 'picker')).toHaveLength(2);
  });

  it('with the booth screens off (?booth=today / ?pack=off) the timer goes to the picker, as release 62 did', async () => {
    setBoothMode('today');
    ending = 'timer';
    await start();
    expect(played.filter((p) => p === 'picker')).toHaveLength(2);
  });
});

// ------------------------------------------------------------------------------------------------ 4. the picker's idle return

describe('4. 200i: 60 s idle on the fight picker returns to the title', () => {
  let now = 5000;
  const settled = async (screen: DemoBoardScreen): Promise<unknown> => {
    let value: unknown = 'pending';
    void screen.done.then((v) => (value = v));
    await tick();
    return value;
  };
  function openPicker(): DemoBoardScreen {
    const screen = new DemoBoardScreen();
    const root = document.createElement('div');
    document.body.appendChild(root);
    screen.app = { save: new SaveStore(), fade: () => Promise.resolve(), uiRoot: document.body } as unknown as App;
    screen.root = root;
    screen.enter();
    return screen;
  }

  beforeEach(() => {
    now = 5000;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    document.body.innerHTML = '';
    forgetBoardChapter();
    setDemoMode(true);
    setBoothMode('new');
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setDemoMode(null);
    setBoothMode(null);
    document.body.innerHTML = '';
    delete (navigator as unknown as { getGamepads?: unknown }).getGamepads;
  });

  it('the minute is 60 s; nobody there for 59.9 s changes nothing, and the next frame after 60 s resolves the pick with null (the flow reads null as Esc: the title)', async () => {
    expect(PICKER_IDLE_MS).toBe(60_000);
    const screen = openPicker();
    now += PICKER_IDLE_MS - 1;
    screen.update(1 / 60);
    expect(await settled(screen)).toBe('pending');
    now += 1;
    screen.update(1 / 60);
    expect(await settled(screen)).toBeNull();
    screen.exit();
  });

  it('a key, a click, a touch, a wheel turn or real mouse travel starts the minute over', async () => {
    const screen = openPicker();
    for (const make of [() => new KeyboardEvent('keydown', { code: 'ArrowRight' }), () => new MouseEvent('mousedown'), () => new Event('touchstart'), () => new Event('wheel')]) {
      window.dispatchEvent(make()); // a visitor: the minute starts over
      now += PICKER_IDLE_MS - 1000;
      screen.update(1 / 60); // 59 s of nobody since: still waiting
      expect(await settled(screen)).toBe('pending');
    }
    now += 1000;
    screen.update(1 / 60);
    expect(await settled(screen)).toBeNull(); // 60 s after the last touch
    screen.exit();
  });

  it('a pad button or a stick pushed past its rest starts the minute over (a pad raises no DOM event: it is read each frame)', async () => {
    const screen = openPicker();
    (navigator as unknown as { getGamepads: () => unknown[] }).getGamepads = () => [{ connected: true, buttons: [{ pressed: true }], axes: [0, 0] }];
    now += PICKER_IDLE_MS - 1000;
    screen.update(1 / 60); // the pad is down: touched now
    (navigator as unknown as { getGamepads: () => unknown[] }).getGamepads = () => [{ connected: true, buttons: [{ pressed: false }], axes: [0, 0] }];
    now += PICKER_IDLE_MS - 1000;
    screen.update(1 / 60);
    expect(await settled(screen)).toBe('pending');
    now += 1000;
    screen.update(1 / 60);
    expect(await settled(screen)).toBeNull();
    screen.exit();
  });

  it('with the booth screens off (?booth=today / ?pack=off) the picker waits for ever, as before', async () => {
    setBoothMode('today');
    const screen = openPicker();
    now += 10 * PICKER_IDLE_MS;
    screen.update(1 / 60);
    expect(await settled(screen)).toBe('pending');
    screen.exit();
  });

  it('a pick made in time wins (the idle clock is gone with the screen)', async () => {
    const screen = openPicker();
    screen.exit();
    now += 2 * PICKER_IDLE_MS;
    screen.update(1 / 60); // a frame after the screen left changes nothing and throws nothing
    expect(await settled(screen)).toBeNull(); // exit resolves a leaving board with null, as it always did
  });
});

// ------------------------------------------------------------------------------------------------ 5. the notice

describe('5. 200h: the "all original" sentence is gone; the property and not-affiliated lines stay', () => {
  const GONE = /All code, art, music,? and writing/i;
  it('FAN_NOTICE keeps the property line and the not-affiliated line, and has no word about originality', () => {
    expect(FAN_NOTICE).toContain('their characters, worlds, and names are the property of Square Enix');
    expect(FAN_NOTICE).toContain('non-commercial fan work, unaffiliated with Square Enix');
    expect(FAN_NOTICE).not.toMatch(GONE);
    expect(FAN_NOTICE).not.toMatch(/original/i);
  });

  it('the README and the press page carry the same notice, and neither has the sentence', () => {
    const readme = readFileSync('README.md', 'utf8');
    const press = readFileSync('public/press/index.html', 'utf8');
    expect(readme).toContain(FAN_NOTICE);
    expect(press).toContain(FAN_NOTICE);
    expect(readme).not.toMatch(GONE);
    expect(press).not.toMatch(GONE);
  });

  it('the press page still says "unofficial fan tribute"', () => {
    const press = readFileSync('public/press/index.html', 'utf8');
    expect(press).toContain('An unofficial fan tribute');
    expect(press).toMatch(/unaffiliated with Square Enix/);
  });
});
