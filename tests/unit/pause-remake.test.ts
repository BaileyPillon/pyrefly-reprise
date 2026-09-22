// @vitest-environment jsdom
/**
 * The pause screen remade on the Until Dawn character screen.
 *
 * Bailey approved this layout on 21 Sep 2026 — *"B, yes, yes, yes"* — against
 * the six frames in `docs/concepts/pause-until-dawn/`, and the approved target
 * is the tile *"Pause remade on the Until Dawn character screen"* in
 * `docs/target/targets.json`. Four things had to be true before a line of it
 * could be called done, and each is a `describe` below:
 *
 * 1. **The tab strip.** The members on the field first, then CHAPTER, GUIDE,
 *    OPTIONS, CONTROLS, MUSIC — and `Q`/`E`, the arrows, `Tab`, `L1`/`R1` and
 *    a click all walk it. Three of those keys are bound to something else for
 *    the whole product (`Q` is `triangle`, `E` is `start`, `Tab` is
 *    `triangle`), so the same press must not also toggle the chrome or close
 *    the menu.
 * 2. **All nineteen preserved functions.** `options.json` →
 *    `preservedFunctions` is the list of what the old screen could do and
 *    where each of those rows went. Nothing was dropped, and this walks the
 *    list.
 * 3. **The game-aware column** (AGENTS.md rule 14), with an absence test each
 *    way: an FFX member prints Overdrive, a mode, her statuses and a CTB turn
 *    position and **no** ATB, chain or dressphere; an FFX-2 girl prints ATB,
 *    Active/Wait, chain, dressphere, grid and gates and **no** Overdrive.
 * 4. **The mirrored chrome.** Yuna's face sits at 30% of her plate, so the
 *    text block moves to the empty side; Tidus's at 46%, so it does not.
 *
 * Real `KeyboardEvent`s through a real `Input`, a real `SaveStore` on a memory
 * storage, and real engines built the way `BattleScreenWiring.createEngine`
 * builds them. jsdom, because every assertion is about DOM or listeners.
 */

import { PerspectiveCamera } from 'three';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { Input, type Button, type InputSnapshot } from '../../src/app/Input.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { PauseScreen } from '../../src/app/screens/PauseScreen.ts';
import { previewTurnOrder } from '../../src/app/screens/pause/turnOrder.ts';
import { pauseKeyIntent } from '../../src/app/screens/pause/keys.ts';
import {
  chromeSideFor,
  chromeSideForCombatant,
  framePlate,
  framingFor,
  plateIdFor,
  FOCAL_X,
  PLATE_FRAMING,
} from '../../src/app/screens/pause/plates.ts';
import {
  inThisFightRows,
  statusDurationLabel,
  turnOrderRow,
  type MeterRow,
} from '../../src/app/screens/pause/meters.ts';
import { getChapter, type Chapter } from '../../src/data/encounters.ts';
import type { App } from '../../src/app/App.ts';
import type { BattleEngine, TurnPreview } from '../../src/battle/common/types.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { resetCoach, setOnboardingLive } from '../../src/ui/coach/coachState.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const OPTIONS_JSON = JSON.parse(
  readFileSync(join(HERE, '..', '..', 'docs', 'concepts', 'pause-until-dawn', 'options.json'), 'utf8'),
) as { preservedFunctions: { was: string; nowLives: string }[] };

/**
 * Every path an `<img>` in the CHAPTER tab's snapshot strip actually requests
 * resolves to a real file under `public/`. PR-0077: `snapsHtml` once passed
 * the raw `chapter-meta.ts` snapshot value (`'backdrops/gagazet.png'`) to
 * `artUrl` directly, which produced `/backdrops/gagazet.png` — missing the
 * `art/` segment every other `artUrl` call site adds — and the live build
 * logged three 404s per chapter, fifteen across the five shipped chapters.
 */
function assertSnapImagesResolve(root: ParentNode): void {
  const imgs = root.querySelectorAll('.pause__snap img');
  expect(imgs.length).toBeGreaterThan(0);
  for (const img of Array.from(imgs)) {
    const src = img.getAttribute('src')!;
    const onDisk = join(REPO_ROOT, 'public', src.replace(/^\/+/, ''));
    expect(existsSync(onDisk), `${src} does not resolve under public/`).toBe(true);
  }
}

// ------------------------------------------------------------------ harness

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

function snapshot(pressed: Button[] = [], actions: string[] = []): InputSnapshot {
  const set = new Set(pressed);
  return {
    pressed: (b) => set.has(b),
    justPressed: (b) => set.has(b),
    justReleased: () => false,
    consume: (b) => set.has(b),
    axis: { x: 0, y: 0 },
    actions,
    gamepadConnected: false,
    lastDevice: 'keyboard',
  };
}

function keydown(code: string, init: KeyboardEventInit = {}): void {
  window.dispatchEvent(new window.KeyboardEvent('keydown', { code, bubbles: true, cancelable: true, ...init }));
}

/** The same engines `BattleScreenWiring.createEngine` builds, minus the HUDs. */
function engineFor(chapter: Chapter): BattleEngine {
  const setup = setupForChapter(chapter, 1);
  const engine: BattleEngine =
    chapter.game === 'ffx'
      ? new FFXEngine({ autoResolveMinigames: true })
      : new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
  engine.setSeed(setup.seed);
  engine.init(setup);
  return engine;
}

interface Fired {
  restart: number;
  chapterSelect: number;
  quit: number;
  extra: number;
  resumed: number;
}

interface Harness {
  screen: PauseScreen;
  store: SaveStore;
  input: Input;
  root: HTMLElement;
  engine: BattleEngine;
  fired: Fired;
  dispose(): void;
}

let live: Harness | null = null;

function mount(chapterId: string, opts: { reduceMotion?: boolean; hosted?: boolean } = {}): Harness {
  const chapter = getChapter(chapterId)!;
  const engine = engineFor(chapter);
  const store = new SaveStore(`pause-remake-${chapterId}`, memoryStorage());
  if (opts.reduceMotion) store.setSettings({ reduceMotion: true });

  const input = new Input({ keyboardTarget: window });
  input.attach();
  const root = document.createElement('div');
  document.body.appendChild(root);

  const fired: Fired = { restart: 0, chapterSelect: 0, quit: 0, extra: 0, resumed: 0 };
  const hosted = opts.hosted !== false;
  const screen = new PauseScreen({
    chapter,
    state: () => engine.state(),
    turnOrder: () => previewTurnOrder(engine),
    chainLength: 1,
    onResume: () => void fired.resumed++,
    ...(hosted
      ? {
          onRestart: () => void fired.restart++,
          onChapterSelect: () => void fired.chapterSelect++,
          onQuitToTitle: () => void fired.quit++,
          extraRows: [{ id: 'skip-scene', label: 'Skip scene', run: () => void fired.extra++ }],
        }
      : {}),
  });
  // A real camera, because photo mode reads its position, its quaternion and
  // its world direction the moment F is pressed, and F is one of the keys
  // under test. Three needs no WebGL context to make one.
  const camera = new PerspectiveCamera(50, 16 / 9, 0.1, 100);
  camera.position.set(0, 1.6, 4);
  screen.app = { save: store, input, screens: [screen], renderer: { camera } } as unknown as App;
  screen.root = root;
  void screen.enter();

  const h: Harness = {
    screen,
    store,
    input,
    root,
    engine,
    fired,
    dispose: () => {
      screen.exit();
      input.detach();
      root.remove();
    },
  };
  live = h;
  return h;
}

/** Every tab on the strip, in strip order. */
const tabIds = (h: Harness): string[] => h.screen.snapshot()['tabs'] as string[];
/** The row ids of whichever tab is open. */
const rowIds = (h: Harness): string[] => h.screen.snapshot()['rows'] as string[];
/** The `data-row` of every row actually drawn, including the unselectable ones. */
const drawnRows = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('.pause__row')].map((r) => r.dataset['row'] ?? '');
/** The left-hand label of every row drawn, upper-cased. */
const drawnKeys = (h: Harness): string[] =>
  [...h.root.querySelectorAll<HTMLElement>('.pause__k')].map((k) => (k.textContent ?? '').toUpperCase());

beforeAll(async () => {
  await registerBattleContent();
});

afterEach(() => {
  live?.dispose();
  live = null;
  resetCoach();
  document.body.innerHTML = '';
});

// ===================================================================== tabs

describe('the tab strip', () => {
  it('puts the three on the field first, then the five fixed tabs', () => {
    const h = mount('seymour-flux');
    const state = h.engine.state();
    expect(tabIds(h)).toEqual([
      ...state.activeIds.map((id) => `member:${id}`),
      'chapter',
      'guide',
      'options',
      'controls',
      'music',
    ]);
    // "The active party member first": the menu opens on the leading member.
    expect(h.screen.snapshot()['tab']).toBe(`member:${state.activeIds[0]}`);
  });

  it('gives every member tab an HP hairline and no fixed tab one', () => {
    const h = mount('seymour-flux');
    expect(h.root.querySelectorAll('.pause__tabhp')).toHaveLength(h.engine.state().activeIds.length);
  });

  it('E walks forward and Q walks back, wrapping both ways', () => {
    const h = mount('seymour-flux');
    const ids = tabIds(h);
    keydown('KeyE');
    expect(h.screen.snapshot()['tab']).toBe(ids[1]);
    keydown('KeyQ');
    expect(h.screen.snapshot()['tab']).toBe(ids[0]);
    keydown('KeyQ');
    expect(h.screen.snapshot()['tab'], 'Q from the first tab wraps to the last').toBe(ids[ids.length - 1]);
    keydown('KeyE');
    expect(h.screen.snapshot()['tab']).toBe(ids[0]);
  });

  it('E does not also close the menu, though E is bound to `start`', () => {
    // The whole reason `pause/keys.ts` exists: KEY_MAP maps KeyE to `start`,
    // and `start` closes the pause. One press of E must do exactly one thing.
    const h = mount('seymour-flux');
    keydown('KeyE');
    h.screen.handleInput(snapshot(['start']));
    expect(h.fired.resumed).toBe(0);
    expect(h.screen.snapshot()['tab']).toBe(tabIds(h)[1]);
  });

  it('Q does not also hide the chrome, though Q is bound to `triangle`', () => {
    const h = mount('seymour-flux');
    keydown('KeyQ');
    h.screen.handleInput(snapshot(['triangle']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
  });

  it('F opens photo mode and does not walk the strip, though F is bound to `l1`', () => {
    const h = mount('seymour-flux');
    const before = h.screen.snapshot()['tab'];
    keydown('KeyF');
    h.screen.handleInput(snapshot(['l1']));
    expect(h.screen.snapshot()['photo'], 'F still means photo mode').not.toBeNull();
    expect(h.screen.snapshot()['tab']).toBe(before);
    h.screen.trigger('pause:photo-off');
    expect(h.screen.snapshot()['photo']).toBeNull();
  });

  it('Tab walks forward and Shift+Tab back', () => {
    const h = mount('seymour-flux');
    const ids = tabIds(h);
    keydown('Tab');
    expect(h.screen.snapshot()['tab']).toBe(ids[1]);
    keydown('Tab', { shiftKey: true });
    expect(h.screen.snapshot()['tab']).toBe(ids[0]);
  });

  it('holding Shift does not hide the chrome, and Shift+Tab still walks back', () => {
    // The test above calls the claimed-key handler with `{shiftKey:true}` and
    // never runs a frame of `Input` in between — which is what a synthetic
    // `press('Shift+Tab')` does, both keys inside one frame. Real hardware
    // sends Shift down, some frames pass, then Tab. `KEY_MAP` binds *both* to
    // `triangle` and `triangle` hides the chrome, so holding Shift blanked the
    // screen and the Tab behind it hit `if (this.panelsHidden) return;` and
    // died. This walks the real `Input` frame by frame.
    const h = mount('seymour-flux');
    const ids = tabIds(h);
    const frame = (at: number): void => {
      h.screen.handleInput(h.input.update(at));
      h.input.endFrame();
    };

    keydown('ShiftLeft', { shiftKey: true });
    frame(0);
    expect(h.screen.snapshot()['panelsHidden'], 'Shift alone is a modifier here').toBe(false);
    frame(450);
    expect(h.screen.snapshot()['panelsHidden'], 'and still is, held').toBe(false);

    keydown('Tab', { shiftKey: true });
    frame(460);
    expect(h.screen.snapshot()['panelsHidden'], 'the chrome is still up to walk').toBe(false);
    expect(h.screen.snapshot()['tab'], 'Shift+Tab wraps backwards to the last tab').toBe(
      ids[ids.length - 1],
    );
  });

  it('H and the pad still hide the chrome', () => {
    // Shift losing the toggle must not cost the two the CONTROLS tab lists.
    const h = mount('seymour-flux');
    keydown('KeyH');
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    keydown('KeyH');
    expect(h.screen.snapshot()['panelsHidden']).toBe(false);
    // A pad's triangle arrives as an abstract button with no keyboard event.
    h.screen.handleInput(snapshot(['triangle']));
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
  });

  it('the shoulder buttons walk it for a pad', () => {
    const h = mount('seymour-flux');
    const ids = tabIds(h);
    h.screen.handleInput(snapshot(['r1']));
    expect(h.screen.snapshot()['tab']).toBe(ids[1]);
    h.screen.handleInput(snapshot(['l1']));
    expect(h.screen.snapshot()['tab']).toBe(ids[0]);
  });

  it('the arrows walk it while the strip has focus', () => {
    const h = mount('seymour-flux');
    const ids = tabIds(h);
    h.screen.handleInput(snapshot(['right']));
    expect(h.screen.snapshot()['tab']).toBe(ids[1]);
    h.screen.handleInput(snapshot(['left']));
    expect(h.screen.snapshot()['tab']).toBe(ids[0]);
  });

  it('a click or a tap jumps straight to a tab', () => {
    const h = mount('seymour-flux');
    h.screen.handleInput(snapshot([], ['pause:tab:music']));
    expect(h.screen.snapshot()['tab']).toBe('music');
  });

  it('the strip is one horizontally scrollable row, which is what a phone swipes', () => {
    const h = mount('seymour-flux');
    expect(h.root.querySelector('.pause__swipe')).not.toBeNull();
  });

  /**
   * FOC-02 (`critic/reviews/5e92289…-focused.json`): at 390x844 the strip's
   * `scrollWidth` (674) outran its `clientWidth` (350) and `scrollLeft` never
   * moved, so four of the eight tabs were selected off-screen. jsdom has no
   * layout, so `scrollWidth`/`clientWidth` cannot be measured here — this
   * stubs `Element.prototype.scrollIntoView` (jsdom does not implement it) and
   * asserts it is called, with the newly *selected* tab, on every selection
   * change. The real 390x844 measurement is the browser pass in the handoff.
   */
  it('FOC-02: scrolls the newly selected tab into view on every selection change', () => {
    const calls: Array<{ tab: string | undefined; opts: ScrollIntoViewOptions | boolean | undefined }> = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (
      this: HTMLElement,
      opts?: ScrollIntoViewOptions | boolean,
    ): void {
      calls.push({ tab: this.dataset['tab'], opts });
    };
    try {
      const h = mount('seymour-flux');
      const ids = tabIds(h);
      // The opening render scrolls to the first tab too (harmless — it is
      // already at the left edge), so count only what a real selection does.
      calls.length = 0;

      keydown('KeyE');
      expect(calls, 'one scroll per selection change').toHaveLength(1);
      expect(calls[0]?.tab, 'the tab that was just selected, not the one it replaced').toBe(ids[1]);
      expect(calls[0]?.opts).toMatchObject({ inline: 'center', block: 'nearest', behavior: 'smooth' });

      keydown('KeyQ');
      expect(calls).toHaveLength(2);
      expect(calls[1]?.tab).toBe(ids[0]);

      h.screen.handleInput(snapshot([], ['pause:tab:music']));
      expect(calls).toHaveLength(3);
      expect(calls[2]?.tab).toBe('music');
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('FOC-02: the scroll is not animated when the player has reduced motion on', () => {
    const calls: Array<ScrollIntoViewOptions | boolean | undefined> = [];
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (this: HTMLElement, opts?: ScrollIntoViewOptions | boolean): void {
      calls.push(opts);
    };
    try {
      mount('seymour-flux', { reduceMotion: true });
      calls.length = 0;
      keydown('KeyE');
      expect(calls[0]).toMatchObject({ behavior: 'auto' });
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('the raw key table is the whole collision list', () => {
    expect(pauseKeyIntent('KeyQ')).toEqual({ intent: 'tab-prev', suppress: 'triangle' });
    expect(pauseKeyIntent('KeyE')).toEqual({ intent: 'tab-next', suppress: 'start' });
    expect(pauseKeyIntent('Tab')).toEqual({ intent: 'tab-next', suppress: 'triangle' });
    expect(pauseKeyIntent('Tab', true)).toEqual({ intent: 'tab-prev', suppress: 'triangle' });
    expect(pauseKeyIntent('KeyF')).toEqual({ intent: 'photo', suppress: 'l1' });
    // H has no abstract button at all, which is why it needs the claim.
    expect(pauseKeyIntent('KeyH')).toEqual({ intent: 'hide', suppress: null });
    expect(pauseKeyIntent('KeyZ')).toEqual({ intent: null, suppress: null });
  });
});

// ============================================================ the nineteen

describe('every function of the old pause screen is still reachable', () => {
  it('the checklist this suite walks is the one on record', () => {
    // The brief called it nineteen; the file on record lists twenty, because
    // the last entry bundles the keyboard claim, the screen-hiding and the two
    // SFX. Every one of the twenty has a case below.
    expect(OPTIONS_JSON.preservedFunctions).toHaveLength(20);
  });

  it('1. RESUME — Esc resumes, and the prompt says so', () => {
    const h = mount('seymour-flux');
    expect(h.root.querySelector('.pause__back')!.textContent).toMatch(/Esc\s*Resume/i);
    h.screen.handleInput(snapshot(['cancel']));
    expect(h.fired.resumed).toBe(1);
  });

  it('2. RESTART ENCOUNTER — OPTIONS tab, and it fires', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    expect(rowIds(h)).toContain('restart');
    h.screen.handleInput(snapshot([], ['pause:row:restart']));
    expect(h.fired.restart).toBe(1);
  });

  it('2b. RESTART ENCOUNTER is omitted, not greyed, when there is nothing to restart', () => {
    const h = mount('seymour-flux', { hosted: false });
    h.screen.trigger('pause:tab:options');
    expect(rowIds(h)).not.toContain('restart');
    expect(rowIds(h)).not.toContain('chapter-select');
    expect(rowIds(h)).not.toContain('quit');
  });

  it('3. STRATEGY GUIDE ON/OFF — OPTIONS tab, and it writes the save', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    const before = h.store.settings.guideVisible;
    h.screen.handleInput(snapshot([], ['pause:row:guideVisible']));
    expect(h.store.settings.guideVisible).toBe(!before);
  });

  it('4. HIDE / SHOW PANELS — the H hint, and the line that survives it', () => {
    const h = mount('seymour-flux');
    expect(h.root.querySelector('.pause__hide')!.textContent).toContain('hide panels');
    keydown('KeyH');
    expect(h.screen.snapshot()['panelsHidden']).toBe(true);
    expect(h.root.querySelector('.pause__baseline')!.textContent).toContain('show panels');
  });

  it('5 and 6. REPLAY BRIEFING and BATTLE HELP — OPTIONS tab, the flag forced off, then on', () => {
    // Case (a): the flag forced off. A menu must not advertise a feature that
    // shows nothing, so the rows are absent outright, not merely greyed.
    setOnboardingLive(false);
    const off = mount('seymour-flux');
    off.screen.trigger('pause:tab:options');
    expect(rowIds(off), 'a menu must not advertise a feature that shows nothing').not.toContain('briefing');
    expect(rowIds(off)).not.toContain('battleHelp');
    off.dispose();
    live = null;

    // Case (b): the flag forced on — this build's own default since 65b57bd
    // switched ONBOARDING_LIVE on, but forced explicitly here so this case
    // does not depend on that default. Both rows are drawn and reachable.
    // `afterEach` below (`resetCoach()`) restores the ambient flag once this
    // test ends, so case (a)'s override cannot leak into a later test.
    setOnboardingLive(true);
    const on = mount('seymour-flux');
    on.screen.trigger('pause:tab:options');
    expect(rowIds(on)).toContain('briefing');
    expect(rowIds(on)).toContain('battleHelp');
  });

  it('7. the OPTIONS rows — all six, and Left/Right still adjust', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    for (const id of ['masterVolume', 'musicVolume', 'sfxVolume', 'textSpeed', 'ffx2Atb', 'guideVisible']) {
      expect(rowIds(h), id).toContain(id);
    }
    // Walk the cursor onto MASTER VOLUME and push it left.
    h.screen.handleInput(snapshot(['down'])); // into the body
    const before = h.store.settings.masterVolume;
    h.screen.handleInput(snapshot(['left']));
    expect(h.store.settings.masterVolume).toBeLessThan(before);
    h.screen.handleInput(snapshot(['right']));
    expect(h.store.settings.masterVolume).toBeCloseTo(before, 5);
    // Esc backs out to the strip rather than closing the menu.
    h.screen.handleInput(snapshot(['cancel']));
    expect(h.screen.snapshot()['focus']).toBe('tabs');
    expect(h.fired.resumed).toBe(0);
  });

  it('8, 9 and 10. the dossier, its quote and its three polaroids — the CHAPTER tab', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:chapter');
    const rows = drawnRows(h);
    expect(rows.filter((r) => r.startsWith('obj-'))).toHaveLength(3);
    expect(rows).toContain('play-time');
    expect(rows).toContain('progress');
    expect(rows).toContain('scene');
    expect(h.root.querySelector('.pause__quote-text')!.textContent!.length).toBeGreaterThan(10);
    expect(h.root.querySelector('.pause__hand')!.textContent!.length).toBeGreaterThan(2);
    expect(h.root.querySelectorAll('.pause__snap')).toHaveLength(3);
    assertSnapImagesResolve(h.root);
  });

  it('PR-0077. every CHAPTER tab snapshot resolves under public/art in all five shipped chapters', () => {
    for (const chapterId of [
      'seymour-flux',
      'yunalesca',
      'braskas-final-aeon',
      'ffx2-bahamut',
      'ffx2-vegnagun-shuyin',
    ]) {
      const h = mount(chapterId);
      h.screen.trigger('pause:tab:chapter');
      expect(h.root.querySelectorAll('.pause__snap'), chapterId).toHaveLength(3);
      assertSnapImagesResolve(h.root);
    }
  });

  it('11. the PARTY tab — dissolved into per-member tabs, with gear on CHAPTER', () => {
    const h = mount('seymour-flux');
    const state = h.engine.state();
    // Each member's own tab carries the numbers the PARTY tab used to.
    h.screen.trigger(`pause:tab:member:${state.activeIds[0]}`);
    for (const id of ['hp', 'mp', 'str', 'mag', 'def', 'mdef', 'agi']) {
      expect(drawnRows(h), id).toContain(id);
    }
    // WEAPON, ARMOUR and S.LV have no room in the two columns, so they went to
    // the CHAPTER tab. That placement is INFERRED, not Bailey's word —
    // docs/target/targets.json, reaction.inferred.
    h.screen.trigger('pause:tab:chapter');
    const keys = drawnKeys(h);
    expect(keys).toContain('WEAPON');
    expect(keys).toContain('ARMOUR');
    expect(drawnRows(h).some((r) => r.endsWith('-name'))).toBe(true);
    const gear = [...h.root.querySelectorAll<HTMLElement>('.pause__row--head .pause__v')].map(
      (v) => v.textContent ?? '',
    );
    expect(gear.some((g) => /S\.Lv \d+/.test(g)), 'FFX prints a Sphere Level').toBe(true);
  });

  it('12. MUSIC PLAYER — its own tab, on Bailey’s word', () => {
    const h = mount('seymour-flux');
    expect(tabIds(h)).toContain('music');
    h.screen.trigger('pause:tab:music');
    expect(h.root.querySelector('[data-role="body"]')!.children.length).toBeGreaterThan(0);
  });

  it('13, 14 and 15. CHAPTER SELECT, QUIT TO TITLE and the host’s extra rows', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:options');
    expect(rowIds(h)).toContain('skip-scene');
    h.screen.handleInput(snapshot([], ['pause:row:skip-scene']));
    expect(h.fired.extra).toBe(1);
    h.screen.handleInput(snapshot([], ['pause:row:chapter-select']));
    expect(h.fired.chapterSelect).toBe(1);
    h.screen.handleInput(snapshot([], ['pause:row:quit']));
    expect(h.fired.quit).toBe(1);
  });

  it('16. the live party cards — the HP hairline under each member tab', () => {
    const h = mount('seymour-flux');
    const bars = [...h.root.querySelectorAll<HTMLElement>('.pause__tabhp i')];
    expect(bars).toHaveLength(3);
    for (const b of bars) expect(b.style.width).toMatch(/%$/);
  });

  it('17. the ControlsHint strip — the CONTROLS tab, and the two prompts', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:controls');
    const rows = drawnRows(h);
    for (const id of ['tab-prev', 'tab-next', 'confirm', 'back', 'resume', 'hide', 'photo']) {
      expect(rows, id).toContain(id);
    }
    expect(h.root.querySelector('.pause__back')).not.toBeNull();
    expect(h.root.querySelector('.pause__hide')).not.toBeNull();
  });

  it('18. PHOTO MODE — still F, and F alone', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:controls');
    const values = [...h.root.querySelectorAll<HTMLElement>('.pause__v')].map((v) => v.textContent ?? '');
    expect(values).toContain('F');
    expect(pauseKeyIntent('KeyF').intent).toBe('photo');
  });

  it('19. the full-bleed 2x plate, its focal point, the vignette and the grain', () => {
    const h = mount('seymour-flux');
    const plate = h.root.querySelector<HTMLImageElement>('.pause__plate');
    expect(plate, 'one painted plate fills the window').not.toBeNull();
    expect(plate!.dataset['plate']).toBe('tidus');
    expect(h.root.querySelector('.pause__vig')).not.toBeNull();
    expect(h.root.querySelector('.pause__grain')).not.toBeNull();
    expect(h.root.querySelector('.pause__tint')).not.toBeNull();
    expect(h.root.querySelector('.pause__falloff')).not.toBeNull();
  });

  it('20. the exclusive keyboard claim is taken for the life of the screen', () => {
    const h = mount('seymour-flux');
    expect(h.input.keyboardClaimed).toBe(true);
    h.screen.exit();
    expect(h.input.keyboardClaimed).toBe(false);
    h.input.detach();
    h.root.remove();
    live = null;
  });
});

// ========================================================== the game split

describe('IN THIS FIGHT is game-aware, with an absence test each way', () => {
  const FFX_ONLY = ['overdrive', 'od-mode', 'turn-order'];
  const FFX2_ONLY = ['atb', 'atb-mode', 'chain', 'dressphere', 'grid', 'gates'];

  it('an FFX chapter prints the CTB half and none of the ATB half', () => {
    const h = mount('seymour-flux');
    const rows = drawnRows(h);
    for (const id of FFX_ONLY) expect(rows, `FFX must print ${id}`).toContain(id);
    for (const id of FFX2_ONLY) expect(rows, `FFX must not print ${id}`).not.toContain(id);
    // Both games keep the seven stat rows.
    for (const id of ['hp', 'mp', 'str', 'mag', 'def', 'mdef', 'agi']) expect(rows).toContain(id);
  });

  it('an FFX-2 chapter prints the ATB half and none of the CTB half', () => {
    const h = mount('ffx2-bahamut');
    const rows = drawnRows(h);
    for (const id of FFX2_ONLY) expect(rows, `FFX-2 must print ${id}`).toContain(id);
    for (const id of FFX_ONLY) expect(rows, `FFX-2 must not print ${id}`).not.toContain(id);
    for (const id of ['hp', 'mp', 'str', 'mag', 'def', 'mdef', 'agi']) expect(rows).toContain(id);
  });

  it('the CHAPTER tab prints FFX gear and FFX-2 dresspheres, never the other game’s', () => {
    const ffx = mount('seymour-flux');
    ffx.screen.trigger('pause:tab:chapter');
    expect(drawnKeys(ffx)).toContain('WEAPON');
    expect(drawnKeys(ffx), 'FFX has no dresspheres').not.toContain('DRESSPHERE');
    ffx.dispose();
    live = null;

    const x2 = mount('ffx2-bahamut');
    x2.screen.trigger('pause:tab:chapter');
    expect(drawnKeys(x2)).toContain('DRESSPHERE');
    // FFX-2 gear is dresspheres and accessories; an empty WEAPON -- would be a
    // lie about its rules [ffx2-combat-core §3].
    expect(drawnKeys(x2)).not.toContain('WEAPON');
    expect(drawnKeys(x2)).not.toContain('ARMOUR');
  });

  it('the turn-order row is omitted, never guessed, when no forecast is handed over', () => {
    // An FFX-2 engine has no `predictTurnOrder`, so the helper answers nothing
    // rather than reaching for the gauge snapshot.
    const x2 = mount('ffx2-bahamut');
    expect(previewTurnOrder(x2.engine)).toEqual([]);
    expect(previewTurnOrder(null)).toEqual([]);
    expect(drawnRows(x2)).not.toContain('turn-order');
  });

  it('prints "Nth of N" on one scale, and gives every member on the field a row', () => {
    // The forecast a live chapter-1 fight really answers a few turns in
    // (measured off `engine.predictTurnOrder(10)`): ten tiles held by four
    // actors, most of them coming round again, and Yuna — slow enough that her
    // next turn is past the tenth tile — not in it at all. Read with the
    // numerator on tiles and the denominator on actors, Tidus printed
    // "5th of 4" and Yuna printed nothing.
    const h = mount('seymour-flux');
    const state = h.engine.state();
    const [tidus, yuna, kimahri] = state.activeIds.map((id) => state.combatants[id]!);
    const order = [
      kimahri!.id,
      kimahri!.id,
      'seymour-flux',
      'mortiorchis',
      tidus!.id,
      tidus!.id,
      kimahri!.id,
      'seymour-flux',
      'mortiorchis',
      tidus!.id,
    ].map((actorId, index) => ({
      actorId,
      index,
      tickValue: index * 100,
      isParty: false,
      statusIcons: [],
      overdriveReady: false,
    })) as unknown as TurnPreview[];

    const turnRow = (c: typeof tidus): MeterRow | undefined =>
      inThisFightRows(c!, 'ffx', { turnOrder: order }).find((r) => r.id === 'turn-order');

    for (const c of [tidus, yuna, kimahri]) {
      const row = turnRow(c);
      expect(row, `${c!.id} is alive on the field and must be told where she stands`).toBeDefined();
      const nth = /^(\d+)[a-z]{2} of (\d+)$/.exec(row!.v);
      if (nth) expect(Number(nth[1]), row!.v).toBeLessThanOrEqual(Number(nth[2]));
    }
    expect(turnRow(kimahri)!.v, 'the queue is four actors deep').toBe('1st of 4');
    expect(turnRow(tidus)!.v, 'and nothing in it can be 5th').toBe('4th of 4');
    expect(turnRow(yuna)!.v, 'past the forecast: words, never an invented number').toBe(
      'After 4 others',
    );
  });

  it('never tells a downed member she is Nth in a queue she is not in', () => {
    const h = mount('seymour-flux');
    const state = h.engine.state();
    const down = { ...state.combatants[state.activeIds[1]!]!, hp: 0 };
    const order = [{ actorId: 'tidus', index: 0, tickValue: 0, isParty: true, statusIcons: [], overdriveReady: false }] as unknown as TurnPreview[];
    expect(turnOrderRow(down, order)?.v).toBe('Out of the queue');
  });

  it('a status row prints the duration model it really has, never an invented count', () => {
    // Most FFX statuses are `battle-254` and a turn counter beside them would
    // be a lie (src/data/ffx/statuses/core.ts).
    const rest = { turnsRemaining: 254, charges: null, stacks: 0, permanent: false };
    expect(statusDurationLabel('zombie', rest)).toBe('Rest of battle');
    expect(statusDurationLabel('haste', rest)).toBe('Rest of battle');
    expect(statusDurationLabel('silence', { ...rest, turnsRemaining: 3 })).toBe('3 turns');
    expect(statusDurationLabel('doom', { ...rest, turnsRemaining: 1 })).toBe('1 turn left');
    expect(statusDurationLabel('haste', { ...rest, permanent: true })).toBe('Permanent');
    expect(statusDurationLabel('nulblaze', { ...rest, turnsRemaining: null, charges: 1 })).toBe('1 charge');
    expect(statusDurationLabel('guard', { ...rest, turnsRemaining: null })).toBe('Until next turn');
  });

  it('the FFX-2 girls get their own paintings, not their FFX selves', () => {
    expect(plateIdFor('yuna', 'ffx2')).toBe('yuna-ffx2');
    expect(plateIdFor('rikku', 'ffx2')).toBe('rikku-ffx2');
    // Paine has no FFX self, so her id needs no suffix.
    expect(plateIdFor('paine', 'ffx2')).toBe('paine');
    // And an FFX chapter never takes that branch.
    expect(plateIdFor('yuna', 'ffx')).toBe('yuna');
  });
});

// ======================================================= mirror and motion

describe('the chrome stands on whichever side of the painting is empty', () => {
  it('mirrors exactly the two plates options.json names, and no others', () => {
    // art.perPlate calls out two paintings as "subject left of centre — needs
    // the mirrored chrome". Those two, and only those two.
    const mirrored = Object.entries(PLATE_FRAMING)
      .filter(([, f]) => f.side === 'right')
      .map(([id]) => id)
      .sort();
    expect(mirrored).toEqual(['paine', 'yuna']);
    // FFX-2 Yuna's focal is further left than Tidus's and she still keeps the
    // chrome on the left: her plate takes a 1.9x crop with room to push her
    // face right, which is what approved frame (c) shows.
    expect(FOCAL_X['yuna-ffx2']).toBeLessThan(FOCAL_X['tidus']!);
    expect(chromeSideForCombatant('yuna', 'ffx2')).toBe('left');
    expect(chromeSideForCombatant('yuna', 'ffx')).toBe('right');
    expect(chromeSideForCombatant('paine', 'ffx2')).toBe('right');
    expect(chromeSideForCombatant('tidus', 'ffx')).toBe('left');
  });

  it('falls back to the focal point for a painting nobody has judged yet', () => {
    expect(chromeSideFor(0.2)).toBe('right');
    expect(chromeSideFor(0.6)).toBe('left');
    expect(chromeSideFor(null), 'an unknown plate keeps the reference’s own side').toBe('left');
    expect(chromeSideForCombatant('nobody', 'ffx')).toBe('left');
  });

  it('frames every plate the way the approved pictures were framed', () => {
    // build.mjs printed, for the three plates it framed at 1600x900:
    //   tidus      zoom 1.26  face@58%  head 79% of frame  master x0.75
    //   yuna       zoom 1.27  face@38%  (mirrored)
    //   yuna-ffx2  zoom 1.90  face@66%  master x1.13
    for (const [id, expected] of [
      ['tidus', 0.58],
      ['yuna', 0.38],
      ['yuna-ffx2', 0.58],
    ] as const) {
      const f = framingFor(id);
      const box = framePlate(f, 1600, 900);
      const faceAt = (box.left + box.width * f.x) / 1600;
      expect(faceAt, `${id} face x`).toBeCloseTo(expected, 1);
      // The head lands near the reference's three quarters of the frame.
      const head = (f.head * box.height) / 900;
      expect(head, `${id} head`).toBeGreaterThan(0.6);
      // And no edge of the frame is ever empty page.
      expect(box.left, `${id} left`).toBeLessThanOrEqual(0.01);
      expect(box.left + box.width, `${id} right`).toBeGreaterThanOrEqual(1599.99);
      expect(box.top, `${id} top`).toBeLessThanOrEqual(0.01);
      expect(box.top + box.height, `${id} bottom`).toBeGreaterThanOrEqual(899.99);
      // build.mjs refuses a framing that magnifies a master past 1.25x.
      expect(box.magnify, `${id} magnification`).toBeLessThanOrEqual(1.25);
    }
  });

  it('leaves no empty page at any window the brief names, for any plate', () => {
    for (const size of [
      [1280, 720],
      [1600, 900],
      [2000, 1012],
      [2560, 1080],
      [390, 844],
    ] as const) {
      for (const id of Object.keys(PLATE_FRAMING)) {
        const box = framePlate(framingFor(id), size[0], size[1]);
        expect(box.left, `${id} @${size[0]}x${size[1]}`).toBeLessThanOrEqual(0.01);
        expect(box.left + box.width).toBeGreaterThanOrEqual(size[0] - 0.01);
        expect(box.top).toBeLessThanOrEqual(0.01);
        expect(box.top + box.height).toBeGreaterThanOrEqual(size[1] - 0.01);
        expect(box.magnify).toBeLessThanOrEqual(1.25 + 1e-9);
      }
    }
  });

  it('every shipped focal x matches the plate’s sidecar on disk', () => {
    for (const [id, f] of Object.entries(PLATE_FRAMING)) {
      const sidecar = JSON.parse(
        readFileSync(join(HERE, '..', '..', 'public', 'art', 'pause', `${id}.json`), 'utf8'),
      ) as { focal?: { x: number; y: number } };
      expect(sidecar.focal?.x, `${id} focal x`).toBeCloseTo(f.x, 5);
      expect(sidecar.focal?.y, `${id} focal y`).toBeCloseTo(f.y, 5);
    }
  });

  it('the live screen mirrors on Yuna’s tab and not on Tidus’s', () => {
    const h = mount('seymour-flux');
    h.screen.trigger('pause:tab:member:tidus');
    expect(h.screen.snapshot()['mirrored']).toBe(false);
    h.screen.trigger('pause:tab:member:yuna');
    expect(h.screen.snapshot()['mirrored']).toBe(true);
    expect(h.root.querySelector('.pause--mirror')).not.toBeNull();
  });
});

describe('the painting moves, until the player says not to', () => {
  it('drifts by default', () => {
    const h = mount('seymour-flux');
    expect(h.root.querySelector('.pause__art')!.classList.contains('pause__art--still')).toBe(false);
  });

  it('is still under Settings.reduceMotion', () => {
    const h = mount('seymour-flux', { reduceMotion: true });
    expect(h.root.querySelector('.pause__art')!.classList.contains('pause__art--still')).toBe(true);
    expect((h.screen.snapshot()['portrait'] as Record<string, unknown>)['reduceMotion']).toBe(true);
  });

  it('offers the living-portrait prototype a seam it can be dropped into', () => {
    // docs/plans/pause-living-portraits.md — another agent's track. The layout
    // must not have to change when the rig arrives.
    const h = mount('seymour-flux');
    const portrait = h.screen.snapshot()['portrait'] as Record<string, unknown>;
    expect(portrait['gaze']).toEqual({ x: 0, y: 0 });
    expect(portrait['expression']).toBe('neutral');
    expect(portrait['driver']).toBe(false);
    expect(typeof portrait['plate']).toBe('string');
  });
});
