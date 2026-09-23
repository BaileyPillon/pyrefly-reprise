// @vitest-environment jsdom
/**
 * **The rule this feature can break in either direction.**
 *
 * FFX-2 (chapters 4-5): a gauge that stops to be taught.
 * `research/ffx-vs-ffx2-presentation.md` §4.2 / FC-4 describes the gauge as a
 * four-phase pipeline that is running the whole time; §4.3 / FC-5 makes its
 * purple charge segment canon's own cost preview. Freezing that to teach is
 * the one thing X-2 never does. So the FFX-2 case is asserted twice, and
 * neither assertion can pass by accident:
 *
 * 1. The inner HUD is asked for the menu **before a single `await`** — the
 *    line and the menu go up in the same turn of the event loop.
 * 2. A driver shaped like the presenter's own loop ticks a **real
 *    `FFX2Engine`** once per turn while the HUD's promise is outstanding, and
 *    counts the turns. A held line resolves only when its 5.2 s fade timer
 *    fires, which in that loop is never, so the count runs to the cap.
 *
 * An earlier version of this file read the engine's gauges before and after a
 * tick the *test itself* performed, and asserted they had grown. They always
 * had. That proved nothing about the layer, and an adversarial pass said so.
 *
 * FFX (chapters 1-3): a menu, an advisor card and a guide that stay hidden
 * from the player they are for. FOC-01
 * (`critic/reviews/5e92289…-focused.json`) found the opposite defect from the
 * one above: the FFX branch used to `await` the line before calling
 * `inner.chooseCommand` at all, so the approved tile
 * `docs/concepts/onboarding/c-aurons-briefing/c2-first-use-ffx.png` — Auron's
 * line **beside** a visible menu and a populated advisor card — rendered as
 * the line alone over an empty board, with the strategy guide's idle
 * "Waiting for your turn." printed on the player's own turn. The FFX case is
 * now asserted the same way the FFX-2 case above is: the menu **must** open
 * in the same turn of the event loop, and the confirm that dismisses the line
 * must not double as the menu's own first input (the FFX equivalent of
 * PR-0051).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import * as ffx2data from '../../src/data/ffx2/index.ts';
import {
  FFX2Engine,
  abilityRegistryFrom,
  dressphereRegistryFrom,
  garmentGridRegistryFrom,
  itemRegistryFrom,
} from '../../src/battle/ffx2/index.ts';
import { CHAPTERS } from '../../src/data/encounters.ts';
import type {
  AtbSnapshot,
  AvailableCommand,
  BattleEvent,
  BattleState,
  Command,
  CombatantId,
  MinigameKind,
  MinigameResult,
  TurnPreview,
} from '../../src/battle/common/types.ts';
import type { HudPort, TargetingPort } from '../../src/engine/HudPort.ts';
import type { IntentSource } from '../../src/ui/common/EnemyIntent.ts';
import { withCoach, markForEvent, markForMenu } from '../../src/ui/coach/CoachLayer.ts';
import { resetCoach, setCoachingEnabled } from '../../src/ui/coach/coachState.ts';

// --------------------------------------------------------------- doubles

/** A HUD that records what it was asked and answers instantly. */
class SpyHud implements HudPort {
  menuOpened = 0;
  events: BattleEvent[] = [];
  mountedIn: HTMLElement | null = null;
  readonly answer: Command = { kind: 'attack', actor: 'a' as CombatantId, targets: [] } as Command;

  mount(root: HTMLElement): void {
    this.mountedIn = root;
  }
  unmount(): void {
    this.mountedIn = null;
  }
  sync(_state: BattleState, _preview: TurnPreview[] | AtbSnapshot): void {}
  chooseCommand(): Promise<Command> {
    this.menuOpened += 1;
    return Promise.resolve(this.answer);
  }
  onEvent(event: BattleEvent): void {
    this.events.push(event);
  }
  openMinigame(_kind: MinigameKind, _params: Record<string, unknown>): Promise<MinigameResult> {
    return Promise.resolve({} as MinigameResult);
  }
  setVisible(): void {}
  setProjector(): void {}
}

/**
 * Records every call to `HudPort`'s optional members, plus the duck-typed
 * `setIntentSource` (`EnemyIntent.ts`'s `IntentAwareHud`; not part of
 * `HudPort` itself — see `CoachLayer.ts`'s own comment on why). PR-0090: the
 * enemy-intent panel never appeared in either game because `CoachedHud` had
 * no `setIntentSource` forward at all, so `attachEnemyIntent`'s
 * `typeof h.setIntentSource === 'function'` probe on the wrapper silently
 * failed and the real HUD's panel was never wired to an engine.
 */
class OptionalSpyHud implements HudPort {
  calls: Array<{ name: string; args: unknown[] }> = [];
  mount(): void {}
  unmount(): void {}
  sync(): void {}
  chooseCommand(): Promise<Command> {
    return Promise.resolve({ kind: 'attack', actor: 'a' as CombatantId, targets: [] } as Command);
  }
  onEvent(): void {}
  openMinigame(): Promise<MinigameResult> {
    return Promise.resolve({} as MinigameResult);
  }
  setVisible(): void {}
  setProjector(): void {}
  syncVitals(state: BattleState): void {
    this.calls.push({ name: 'syncVitals', args: [state] });
  }
  syncGauges(snapshot: AtbSnapshot): void {
    this.calls.push({ name: 'syncGauges', args: [snapshot] });
  }
  closeCommandMenu(): void {
    this.calls.push({ name: 'closeCommandMenu', args: [] });
  }
  setAtbMode(mode: 'wait' | 'active'): void {
    this.calls.push({ name: 'setAtbMode', args: [mode] });
  }
  setTargetingPort(port: TargetingPort): void {
    this.calls.push({ name: 'setTargetingPort', args: [port] });
  }
  update(dt: number): void {
    this.calls.push({ name: 'update', args: [dt] });
  }
  setIntentSource(source: IntentSource | null): void {
    this.calls.push({ name: 'setIntentSource', args: [source] });
  }
}

function rows(kinds: Array<Command['kind']>): AvailableCommand[] {
  return kinds.map((kind) => ({
    command: { kind, actor: 'a' as CombatantId, targets: [] } as Command,
    label: kind,
    category: 'attack',
    mpCost: 0,
    enabled: true,
    validTargets: [],
  }));
}

const preview = (): TurnPreview[] => [];

function markEl(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[data-role="coach-mark"]');
}

function press(code: string): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
}

/** A real Chapter 4 engine, so the gauge in the assertions is the real gauge. */
function realFfx2Engine(): FFX2Engine {
  const chapter = CHAPTERS.find((c) => c.id === 'ffx2-bahamut');
  if (!chapter) throw new Error('chapter ffx2-bahamut is missing');
  const engine = new FFX2Engine({
    abilities: abilityRegistryFrom(Object.values(ffx2data.ABILITIES)),
    items: itemRegistryFrom(Object.values(ffx2data.ITEMS)),
    dresspheres: dressphereRegistryFrom(Object.values(ffx2data.STANDARD_DRESSPHERES)),
    garmentGrids: garmentGridRegistryFrom(Object.values(ffx2data.GARMENT_GRIDS)),
    minigames: false,
  });
  engine.setSeed(7);
  engine.init({
    game: 'ffx2',
    party: chapter.buildRef,
    enemies: ffx2data.ENEMY_GROUPS_BY_ID[chapter.enemyGroupRef.id],
    triggers: [],
    seed: 7,
    condition: 'normal',
    canEscape: false,
  } as never);
  return engine;
}

/** The engine's own clock and the sum of every gauge, read straight off it. */
function gauges(engine: FFX2Engine): { elapsedMs: number; total: number } {
  const snap = (engine as unknown as { gaugeSnapshot: () => AtbSnapshot }).gaugeSnapshot();
  expect(snap.bars.length, 'the engine reports real gauges').toBeGreaterThan(0);
  const total = snap.bars.reduce((sum, b) => sum + b.fill + (b.charge ?? 0), 0);
  return { elapsedMs: snap.elapsedMs, total };
}

// ------------------------------------------------------------------ tests

describe('the coach layer', () => {
  let root: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    root = document.createElement('div');
    document.body.appendChild(root);
    resetCoach();
    setCoachingEnabled(true);
  });

  it('FOC-01: FFX shows the line beside a menu opened in the same turn, and Enter only dismisses the line', async () => {
    const spy = new SpyHud();
    const hud = withCoach('ffx', spy, { reduceMotion: true });
    hud.mount(root);

    const pending = hud.chooseCommand('tidus' as CombatantId, rows(['attack']), preview);

    // Same shape as the FFX-2 assertion below: the real HUD is asked for the
    // menu before anything is awaited, so the approved c2-first-use-ffx
    // frame's menu, advisor card and guide are not gated behind the line any
    // more (critic/reviews/5e92289…-focused.json FOC-01). A single `await
    // shown` in front of it — what this branch used to do — makes this zero.
    expect(spy.menuOpened, 'the FFX menu is asked for before anything is awaited').toBe(1);

    const line = markEl(root);
    expect(line, 'the first FFX menu carries a line beside the open menu').not.toBeNull();
    expect(line?.dataset['mark']).toBe('ffx-turn-order');
    expect(line?.textContent).toContain('Auron');

    await pending;
    expect(markEl(root), 'the line still holds: it comes down on its own confirm, not on the answer').not.toBeNull();

    press('Enter');
    expect(markEl(root), 'the line comes down on confirm').toBeNull();
  });

  /**
   * The FFX equivalent of PR-0051 (`docs/handoff/onboarding-c.md`): once the
   * menu opens in the same turn as the line, a held line has the exact same
   * "one Enter does two things" risk FFX-2's non-holding line had.
   */
  it('FOC-01: FFX — the confirm that dismisses the line reaches nothing else, and no other key is touched', () => {
    const heard: string[] = [];
    const menu = (e: KeyboardEvent): void => void heard.push(e.code);
    window.addEventListener('keydown', menu);
    try {
      const spy = new SpyHud();
      const hud = withCoach('ffx', spy, { reduceMotion: true });
      hud.mount(root);
      void hud.chooseCommand('tidus' as CombatantId, rows(['attack']), preview);
      expect(markEl(root), 'the line is up over an open menu').not.toBeNull();

      // Everything that is not the dismissing press still reaches the menu:
      // the line blocks no input and holds no fight.
      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', bubbles: true }));
      expect(heard, 'the cursor still moves under the line').toEqual(['ArrowDown']);
      expect(markEl(root), 'and a cursor key does not dismiss it').not.toBeNull();

      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
      expect(markEl(root), 'the confirm takes the line down').toBeNull();
      expect(heard, 'and the menu behind it never hears that press').toEqual(['ArrowDown']);

      // The very next confirm is the player's again, or the menu is dead.
      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
      expect(heard, 'the press after the line is live input').toEqual(['ArrowDown', 'Enter']);
    } finally {
      window.removeEventListener('keydown', menu);
    }
  });

  it('FFX never shows the same line twice, and never shows Rikku', async () => {
    const spy = new SpyHud();
    const hud = withCoach('ffx', spy, { reduceMotion: true });
    hud.mount(root);

    const first = hud.chooseCommand('tidus' as CombatantId, rows(['attack']), preview);
    await Promise.resolve();
    press('Enter');
    await first;

    // Second menu, same mechanic: nothing at all.
    const second = hud.chooseCommand('tidus' as CombatantId, rows(['attack']), preview);
    await second;
    expect(markEl(root)).toBeNull();
    expect(spy.menuOpened).toBe(2);

    // An FFX-2 event reaching an FFX HUD teaches nothing: the other game's
    // deck is unreachable from here (hard rule 14's absence assertion).
    hud.onEvent({ type: 'spherechange', who: 'yuna', from: 'a', to: 'b', gatesCrossed: [] } as unknown as BattleEvent);
    expect(markEl(root)).toBeNull();
  });

  it('FFX-2 never holds the fight: the menu opens in the same turn as the line', async () => {
    const spy = new SpyHud();
    const hud = withCoach('ffx2', spy, { reduceMotion: true });
    hud.mount(root);

    const pending = hud.chooseCommand('yuna' as CombatantId, rows(['attack']), preview);

    // **Not one await.** The sharpest form of "the line holds nothing": the
    // real HUD was asked for the menu in the very turn of the event loop the
    // line went up. A single `await shown` in front of it — the FFX branch —
    // makes this zero.
    expect(spy.menuOpened, 'the X-2 menu is asked for before anything is awaited').toBe(1);

    await pending;
    const line = markEl(root);
    expect(line, 'and the line outlives its own promise, on screen while play continues').not.toBeNull();
    expect(line?.dataset['mark']).toBe('ffx2-gauge');
    expect(line?.textContent).toContain('Rikku');
    // Round 09 PR-0046 (reopened): the badge is mode-aware
    // (`coachRunningBadge` in `coachCopy.ts`), because "nothing paused, gauges
    // running" is true only under Active. This test's fake save has no
    // `ffx2Atb` setting, so `ffx2AtbMode()` reads the shipped default, Wait
    // (D-029) — the same default a fresh profile gets — where the engine
    // holds every gauge while this very menu is open
    // (`tests/unit/ffx2-wait-mode.test.ts`). The badge must say that, not the
    // Active claim.
    expect(line?.textContent).not.toContain('Nothing paused');
    expect(line?.textContent).not.toContain('gauges running');
    expect(line?.textContent?.toLowerCase()).toMatch(/hold|paus|wait/);
  });

  // The Active-mode half of this pin ("Nothing paused · gauges running" comes
  // back once the save says ACTIVE) lives in `ui-coach-copy.test.ts`
  // (`coachRunningBadge('active')`) rather than here: this describe block's
  // other tests all assume `activeSave()` is null (no test here constructs a
  // `SaveStore`, unlike `ui-coach-briefing-mode.test.ts`), and `SaveStore`'s
  // constructor sets the module-level active save for the rest of this file
  // with no reset hook — a `SaveStore` built in one `it` here would leak into
  // every test after it in this same file.

  /**
   * PR-0051. The FFX-2 line does not hold the menu, so the menu is already open
   * underneath it and reads `keydown` off `window` exactly as this stand-in
   * does. One Enter used to clear the line **and** open a submenu the player
   * never asked for. The rule the build adopted in e30ea5e is that an overlay's
   * dismissing press dies with the overlay — and only that press.
   *
   * The events are dispatched on `document.body`, not on `window`, so the
   * capture phase decides the order here the same way it does in a browser.
   */
  it('FFX-2: the confirm that dismisses the line reaches nothing else, and no other key is touched', async () => {
    const heard: string[] = [];
    const menu = (e: KeyboardEvent): void => void heard.push(e.code);
    window.addEventListener('keydown', menu);
    try {
      const spy = new SpyHud();
      const hud = withCoach('ffx2', spy, { reduceMotion: true });
      hud.mount(root);
      await hud.chooseCommand('yuna' as CombatantId, rows(['attack']), preview);
      expect(markEl(root), 'the line is up over an open menu').not.toBeNull();

      // Everything that is not the dismissing press still reaches the menu:
      // the line blocks no input and holds no fight.
      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', bubbles: true }));
      expect(heard, 'the cursor still moves under the line').toEqual(['ArrowDown']);
      expect(markEl(root), 'and a cursor key does not dismiss it').not.toBeNull();

      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
      expect(markEl(root), 'the confirm takes the line down').toBeNull();
      expect(heard, 'and the menu behind it never hears that press').toEqual(['ArrowDown']);

      // The very next confirm is the player's again, or the menu is dead.
      document.body.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
      expect(heard, 'the press after the line is live input').toEqual(['ArrowDown', 'Enter']);
    } finally {
      window.removeEventListener('keydown', menu);
    }
  });

  it('FFX-2 answers the presenter while a real engine is being ticked around it', async () => {
    // A driver shaped like the presenter's own loop: it ticks a **real**
    // Chapter 4 engine once per turn of the event loop for as long as the HUD
    // has not answered. If the coach layer ever awaited an X-2 line, the answer
    // would only come when the 5.2 s fade timer fired — which, in a loop that
    // never advances the clock, is never — and `turns` would run to the cap.
    const engine = realFfx2Engine();
    const spy = new SpyHud();
    const hud = withCoach('ffx2', spy, { reduceMotion: true });
    hud.mount(root);

    const before = gauges(engine);
    let answered = false;
    let turns = 0;
    const pending = hud.chooseCommand('yuna' as CombatantId, rows(['attack']), preview).then(() => {
      answered = true;
    });
    while (!answered && turns < 50) {
      engine.tick(100);
      turns += 1;
      await Promise.resolve();
    }
    // Asserted before the promise is awaited, so a layer that holds fails here
    // in milliseconds instead of hanging until the suite's timeout.
    expect(answered, 'the HUD answered rather than waiting the line out').toBe(true);
    expect(turns, 'within a turn or two, not after the fade').toBeLessThan(5);
    await pending;
    expect(markEl(root), 'with the line still up the whole time').not.toBeNull();

    // And the ticks the driver got in while the promise was outstanding are
    // real ticks: this is the engine's own gauge, not a flag.
    const after = gauges(engine);
    expect(after.elapsedMs).toBeGreaterThan(before.elapsedMs);
    expect(after.total).toBeGreaterThan(before.total);
  });

  it('FFX-2 onEvent returns nothing, so the presenter is never made to wait', () => {
    const spy = new SpyHud();
    const hud = withCoach('ffx2', spy, { reduceMotion: true });
    hud.mount(root);

    const returned = hud.onEvent({
      type: 'chain',
      targetId: 'bahamut' as CombatantId,
      count: 3,
      multiplier: 1.55,
    } as BattleEvent);
    expect(returned, 'onEvent must not hand the presenter a promise').toBeUndefined();
    expect(markEl(root)?.dataset['mark']).toBe('ffx2-chain');
    expect(spy.events, 'the real HUD still saw the event').toHaveLength(1);
  });

  it('one teaching surface at a time', () => {
    const hud = withCoach('ffx2', new SpyHud(), { reduceMotion: true });
    hud.mount(root);
    hud.onEvent({ type: 'chain', targetId: 'b' as CombatantId, count: 3, multiplier: 1.55 } as BattleEvent);
    hud.onEvent({ type: 'spherechange', who: 'y', from: 'a', to: 'b', gatesCrossed: [] } as unknown as BattleEvent);
    expect(root.querySelectorAll('[data-role="coach-mark"]')).toHaveLength(1);
    expect(document.documentElement.dataset['coachMark']).toBe('1');
  });

  it('with coaching off nothing appears in either game', async () => {
    setCoachingEnabled(false);
    for (const game of ['ffx', 'ffx2'] as const) {
      const host = document.createElement('div');
      document.body.appendChild(host);
      const spy = new SpyHud();
      const hud = withCoach(game, spy, { reduceMotion: true });
      hud.mount(host);
      await hud.chooseCommand('a' as CombatantId, rows(['attack', 'overdrive']), preview);
      hud.onEvent({ type: 'chain', targetId: 'b' as CombatantId, count: 4, multiplier: 1.6 } as BattleEvent);
      expect(markEl(host), `${game} shows nothing with coaching off`).toBeNull();
      expect(spy.menuOpened).toBe(1);
    }
  });

  it('the triggers are keyed by mechanic, not by chapter', () => {
    const unseen = (): boolean => false;
    expect(markForMenu('ffx', rows(['attack']), unseen)?.id).toBe('ffx-turn-order');
    // Turn order already taught: the Overdrive row is what is new.
    const seenTurnOrder = (id: string): boolean => id === 'ffx-turn-order';
    expect(markForMenu('ffx', rows(['attack', 'overdrive']), seenTurnOrder)?.id).toBe('ffx-overdrive');
    expect(markForMenu('ffx', rows(['attack', 'summon']), seenTurnOrder)?.id).toBe('ffx-aeon');
    // No Overdrive row offered, nothing left to say.
    const seenBoth = (id: string): boolean => id !== 'ffx-aeon';
    expect(markForMenu('ffx', rows(['attack']), seenBoth)).toBeNull();

    // A chain of one is not a chain.
    const one = { type: 'chain', targetId: 'b', count: 1, multiplier: 1.4 } as BattleEvent;
    expect(markForEvent('ffx2', one, unseen)).toBeNull();
    // And FFX never teaches from an event at all.
    const sphere = { type: 'spherechange', who: 'y', from: 'a', to: 'b', gatesCrossed: [] } as unknown as BattleEvent;
    expect(markForEvent('ffx', sphere, unseen)).toBeNull();
    expect(markForEvent('ffx2', sphere, unseen)?.id).toBe('ffx2-dressphere');
  });

  /**
   * PR-0090's failure mode was silent: an optional forward simply missing
   * from `CoachedHud`, caught by nothing until a deep review's real browser
   * capture. This drives every optional `HudPort` member (enumerated here,
   * by name, against the interface in `src/engine/HudPort.ts` — keep this
   * list in sync with that file so a future optional method added there and
   * left unforwarded fails here instead of shipping quietly) plus the
   * duck-typed `setIntentSource`, and asserts each one reaches the real HUD
   * with the exact argument passed in.
   */
  it('forwards every optional HudPort member, and the duck-typed setIntentSource, to the inner HUD', () => {
    const spy = new OptionalSpyHud();
    const hud = withCoach('ffx', spy, { reduceMotion: true }) as HudPort & {
      setIntentSource(source: IntentSource | null): void;
    };
    hud.mount(root);

    const state = {} as BattleState;
    hud.syncVitals?.(state);

    const snapshot = {} as AtbSnapshot;
    hud.syncGauges?.(snapshot);

    hud.closeCommandMenu?.();

    hud.setAtbMode?.('active');

    const port = {} as TargetingPort;
    hud.setTargetingPort?.(port);

    hud.update?.(0.5);

    const source: IntentSource = () => null;
    hud.setIntentSource(source);

    expect(spy.calls).toEqual([
      { name: 'syncVitals', args: [state] },
      { name: 'syncGauges', args: [snapshot] },
      { name: 'closeCommandMenu', args: [] },
      { name: 'setAtbMode', args: ['active'] },
      { name: 'setTargetingPort', args: [port] },
      { name: 'update', args: [0.5] },
      { name: 'setIntentSource', args: [source] },
    ]);
  });

  it('a line never outlives the HUD it was mounted on', async () => {
    const hud = withCoach('ffx', new SpyHud(), { reduceMotion: true });
    hud.mount(root);
    void hud.chooseCommand('a' as CombatantId, rows(['attack']), preview);
    await Promise.resolve();
    expect(markEl(root)).not.toBeNull();
    hud.unmount();
    expect(markEl(root)).toBeNull();
    expect(root.querySelector('[data-role="coach-layer"]')).toBeNull();
  });
});

/**
 * `coach.css`, read as text: jsdom under vitest does not apply imported
 * stylesheets, so `.mad__card`'s opacity cannot be observed through
 * `getComputedStyle` here — that half of FOC-01 is verified live in the
 * browser instead (see the handoff). This pins the one thing a later edit
 * could quietly regress: the rule staying scoped to FFX-2, rather than back
 * to every game the way it shipped before FOC-01.
 */
describe('FOC-01: the advisor card only stands down for FFX-2', () => {
  const HERE = dirname(fileURLToPath(import.meta.url));
  const SHEET = readFileSync(join(HERE, '..', '..', 'src', 'ui', 'coach', 'coach.css'), 'utf8');

  it('hides .mad__card while data-coach-mark-game is ffx2, not for every mark', () => {
    expect(SHEET).toMatch(/\[data-coach-mark-game=['"]ffx2['"]\]\s*\.mad__card\s*\{/);
    expect(SHEET).not.toMatch(/\[data-coach-mark=['"]1['"]\]\s*\.mad__card/);
  });
});
