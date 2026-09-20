// @vitest-environment jsdom
/**
 * **The one rule this feature can break: an FFX-2 gauge that stops to be
 * taught.**
 *
 * FFX (chapters 1-3) is turn-based, so a line may hold the decision and hurry
 * nothing — the engine is already parked waiting for a command. FFX-2 (4-5) is
 * not, and `research/ffx-vs-ffx2-presentation.md` §4.2 / FC-4 describes the
 * gauge as a four-phase pipeline that is running the whole time; §4.3 / FC-5
 * makes its purple charge segment canon's own cost preview. Freezing that to
 * teach is the one thing X-2 never does.
 *
 * So the FFX-2 case here is not asserted against a flag. A **real
 * `FFX2Engine`** for Chapter 4 is ticked across the coached HUD's
 * `chooseCommand` and `onEvent` calls, and the test reads the engine's own ATB
 * snapshot on both sides. If the coach layer ever awaits an X-2 line, the
 * `chooseCommand` promise stops resolving before the tick and this file goes
 * red.
 *
 * The FFX case is asserted the other way round: the menu must **not** open
 * until a real `KeyboardEvent` arrives.
 */

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
import type { HudPort } from '../../src/engine/HudPort.ts';
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

  it('FFX holds the command menu until a real confirm press, then opens it once', async () => {
    const spy = new SpyHud();
    const hud = withCoach('ffx', spy, { reduceMotion: true });
    hud.mount(root);

    const pending = hud.chooseCommand('tidus' as CombatantId, rows(['attack']), preview);
    await Promise.resolve();

    const line = markEl(root);
    expect(line, 'the first FFX menu carries a line').not.toBeNull();
    expect(line?.dataset['mark']).toBe('ffx-turn-order');
    expect(line?.textContent).toContain('Auron');
    expect(spy.menuOpened, 'the menu must not open under the line').toBe(0);

    press('Enter');
    await pending;
    expect(spy.menuOpened).toBe(1);
    expect(markEl(root), 'the line comes down on confirm').toBeNull();
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

  it('FFX-2 never holds the fight: the real gauge advances across the line', async () => {
    const engine = realFfx2Engine();
    const spy = new SpyHud();
    const hud = withCoach('ffx2', spy, { reduceMotion: true });
    hud.mount(root);

    const before = gauges(engine);
    const pending = hud.chooseCommand('yuna' as CombatantId, rows(['attack']), preview);

    // No key is pressed and no timer is advanced. If the layer ever awaited an
    // X-2 line this would time out instead of resolving.
    await pending;
    expect(spy.menuOpened, 'the X-2 menu opens immediately').toBe(1);

    const line = markEl(root);
    expect(line, 'the X-2 line is still on screen while play continues').not.toBeNull();
    expect(line?.dataset['mark']).toBe('ffx2-gauge');
    expect(line?.textContent).toContain('Rikku');
    expect(line?.textContent).toContain('Nothing paused');

    // The engine's own clock, read on both sides of the teaching.
    engine.tick(1500);
    const after = gauges(engine);
    expect(after.elapsedMs, 'the battle clock ran under the line').toBeGreaterThan(before.elapsedMs);
    expect(after.total, 'the gauges kept filling under the line').toBeGreaterThan(before.total);
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
