/**
 * THE ATTRACT LOOP (release 61, the conference demo; Bailey, 2026-10-21, decision 169n: "after 60 s idle on the title, a self-running highlight reel of both fights (real gameplay, auto-played), any button
 * returns to the title"; both games, demo mode only; Seymour Flux is Chapter I, FFX, Bahamut is Chapter IV, FFX-2).
 *
 * What plays: the real game. Each segment is an ordinary `BattleScreen` fought on the demo seed (`demoMode.ts`: Seymour 7, Bahamut 56) by the chapter's own line (`intendedStrategy`, which asks `tacticFor`
 * first), at normal speed, under the same look, with the music lowered and a "Press any button" banner. Seymour, then Bahamut, then Seymour again, for as long as no one is there. The two segments are cut at
 * their time caps with a fade to black between them; a fight that ends sooner moves on sooner.
 *
 * What it never does (Bailey: "never write a save, never count as a run, never leave the game in a strange state"):
 *  - **No save.** The segment is a `BattleScreen` with `attract: true`, which skips the one write a battle makes while it runs (play time). The loop never goes through `GameFlow`, so there is no `recordAttempt`,
 *    no `recordClear`, no results panel, no seed rotation, no restart memory; the save is read for the music volume and nothing more. `tests/unit/demo-attract.test.ts` and the browser check watch the storage.
 *  - **No input reaches the fight.** The segment's `handleInput` forwards nothing (no pause, no menu), the page-level listeners wake the loop on the press in the capture phase, and the press that wakes it is
 *    swallowed by the wake: it does not also start the game from the title it returns to.
 *  - **It always comes back.** Any key, click, touch, wheel, real mouse movement or pad button ends it at once: a quick fade, the music volume restored, and the title again. An error in a segment (a missing
 *    painting, a failed load) ends the loop the same way, and a loop whose segments keep ending in under {@link TOO_SHORT_MS} stops after {@link MAX_SHORT_RUN} of them.
 */

import type { Chapter } from '../../data/encounters.ts';
import { getChapter } from '../../data/encounters.ts';
import { audio } from '../../audio/index.ts';
import { intendedStrategy } from '../../engine/BattlePresenterStrategies.ts';
import type { PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import type { App } from '../App.ts';
import { BUTTONS, type InputSnapshot } from '../Input.ts';
import type { Screen } from '../Screen.ts';
import { BattleScreen } from '../screens/BattleScreen.ts';
import { padActive, POINTER_ACTIVE_PX } from './demoIdle.ts';
import { DEMO_FIGHTS } from './demoFlow.ts';
import { demoSeedAt } from '../demoMode.ts';
import './demo.css';

export interface AttractSegment {
  readonly chapterId: string;
  readonly seed: number;
  /** The longest the segment plays, from the first visible frame. */
  readonly maxMs: number;
  readonly speed: PlaybackSpeed;
  /**
   * Run the middle of a long fight with the presenter's own fast speed: from `afterMs` of the segment on, play fast until the engine flag `untilFlag` reaches `atValue`, then at `speed` again. Bahamut's Mega Flare
   * ends a 25 second count on the engine's own clock, which fast does not shorten (measured: the fight's first minute takes 48 s at fast instead of about 95 at normal; the count takes its 25 s either way); the reel
   * shows the opening, runs through the middle and plays the count and the cast in real time.
   */
  readonly fastForward?: { readonly afterMs: number; readonly untilFlag: string; readonly atValue: number };
  /** End the segment this long after `abilityId` starts (the cast itself, and a few seconds of what it does). */
  readonly endAfter?: { readonly abilityId: string; readonly afterMs: number };
}

/**
 * The reel: Seymour Flux (FFX), then Bahamut (FFX-2), round again. The seeds are the demo's own (`demoSeedAt(id, 0)`).
 * Seymour plays at normal speed for 40 seconds. Bahamut plays its first 12 seconds at normal speed, runs fast until the count opens (the engine's `bahamutCountdown` flag reads 5), plays the count 5, 4, 3, 2, 1 and the
 * Mega Flare at normal speed and ends 7 seconds after the cast starts, inside a 110 second cap: about 95 seconds in all, 55 seconds of them the fight's first minute run fast. The two lengths are these constants.
 */
export function attractPlan(): AttractSegment[] {
  return DEMO_FIGHTS.map((f) => {
    const seed = demoSeedAt(f.id, 0) ?? 1;
    if (f.id === 'ffx2-bahamut') {
      return { chapterId: f.id, seed, maxMs: 110_000, speed: 'normal' as const, fastForward: { afterMs: 12_000, untilFlag: 'bahamutCountdown', atValue: 5 }, endAfter: { abilityId: 'mega-flare', afterMs: 7_000 } };
    }
    return { chapterId: f.id, seed, maxMs: 40_000, speed: 'normal' as const };
  });
}

/** The music's share of its usual volume while the reel plays. */
export const ATTRACT_MUSIC = 0.4;
/** A segment that ends sooner than this did not really play. */
export const TOO_SHORT_MS = 8_000;
/** This many of them in a row and the loop gives up. */
export const MAX_SHORT_RUN = 2;
/** The fade to black between segments, and the quick one on the way out. */
export const FADE_BETWEEN_MS = 450;
export const FADE_OUT_MS = 180;

/** Did this frame carry a press of any kind? */
export function anyPress(input: Pick<InputSnapshot, 'justPressed' | 'actions'>): boolean {
  return input.actions.length > 0 || BUTTONS.some((b) => input.justPressed(b));
}

/** What wakes the loop, and the promise that says it happened. */
export class AttractWake {
  private done = false;
  private resolve!: () => void;
  readonly woken: Promise<void> = new Promise((r) => (this.resolve = r));
  private stops: Array<() => void> = [];

  get isWoken(): boolean {
    return this.done;
  }

  wake(): void {
    if (this.done) return;
    this.done = true;
    this.resolve();
  }

  /** Listen to the page and the pads until {@link release}. */
  arm(target: Window = window, pads: () => ArrayLike<Gamepad | null> | null = () => navigator.getGamepads?.() ?? null): void {
    const press = ['keydown', 'pointerdown', 'mousedown', 'touchstart', 'wheel'] as const;
    const onPress = (e: Event): void => {
      this.wake();
      if (e.type === 'keydown' || e.type === 'pointerdown' || e.type === 'mousedown') e.stopImmediatePropagation(); // the press that wakes the reel is not also the title's Start
    };
    let from: { x: number; y: number } | null = null;
    const onMove = (e: Event): void => {
      const p = e as PointerEvent;
      from ??= { x: p.clientX, y: p.clientY };
      if (Math.hypot(p.clientX - from.x, p.clientY - from.y) >= POINTER_ACTIVE_PX) this.wake();
    };
    for (const type of press) target.addEventListener(type, onPress, true);
    target.addEventListener('pointermove', onMove, true);
    const poll = window.setInterval(() => {
      if (padActive(pads() as ArrayLike<Gamepad | null>)) this.wake();
    }, 100);
    this.stops.push(() => {
      for (const type of press) target.removeEventListener(type, onPress, true);
      target.removeEventListener('pointermove', onMove, true);
      window.clearInterval(poll);
    });
  }

  release(): void {
    for (const stop of this.stops.splice(0)) stop();
  }
}

/** One segment: a battle played by the chapter's line, wired to wake the loop on any press and to write nothing. */
export class AttractBattle extends BattleScreen {
  private banner: HTMLElement | null = null;
  private visibleMs = 0;
  private fastDone = false;
  private logSeen = 0;
  private castAtMs: number | null = null;
  private resolveHighlight: () => void = () => undefined;
  /** Resolves when the segment's highlight has played (`AttractSegment.endAfter`); never, for a segment with none. */
  readonly highlightDone: Promise<void> = new Promise((r) => (this.resolveHighlight = r));

  constructor(chapter: Chapter, private readonly segment: AttractSegment, private readonly wake: AttractWake) {
    super({ chapter, seed: segment.seed, auto: intendedStrategy, speed: segment.speed, attract: true });
  }

  override async enter(): Promise<void> {
    await super.enter();
    this.root.classList.add('demo-attract-mode');
    const fight = DEMO_FIGHTS.find((f) => f.id === this.segment.chapterId);
    const layer = document.createElement('div');
    layer.className = 'demo-attract';
    layer.dataset['role'] = 'demo-attract';
    layer.innerHTML = `${fight ? `<div class="demo-attract__title">${fight.game === 'ffx' ? 'Final Fantasy X' : 'Final Fantasy X-2'} · ${fight.boss}</div>` : ''}<div class="demo-attract__banner">Press any button</div>`;
    this.root.appendChild(layer);
    this.banner = layer;
  }

  /** Nothing reaches the fight from the player: a press wakes the loop, and that is all it does. */
  override handleInput(input: InputSnapshot): void {
    if (anyPress(input)) this.wake.wake();
  }

  override update(dt: number): void {
    super.update(dt);
    this.visibleMs += dt * 1000;
    this.pace();
  }

  /** The fast-forward and the end of the highlight, read from the live engine (the reel only watches it). */
  private pace(): void {
    const engine = this.battleEngine;
    const presenter = this.battlePresenter;
    const { fastForward: ff, endAfter } = this.segment;
    if (!engine || !presenter || (!ff && !endAfter)) return;
    const state = engine.state();
    if (ff && !this.fastDone && state.flags[ff.untilFlag] === ff.atValue) this.fastDone = true;
    const want: PlaybackSpeed = ff && !this.fastDone && this.visibleMs >= ff.afterMs ? 'fast' : this.segment.speed;
    if (presenter.playbackSpeed !== want) presenter.setSpeed(want);
    if (endAfter) {
      for (; this.logSeen < state.log.length; this.logSeen++) {
        const e = state.log[this.logSeen] as { type?: string; abilityId?: string };
        if (this.castAtMs === null && e.type === 'action-start' && e.abilityId === endAfter.abilityId) this.castAtMs = this.visibleMs;
      }
      if (this.castAtMs !== null && this.visibleMs - this.castAtMs >= endAfter.afterMs) this.resolveHighlight();
    }
  }

  override exit(): void {
    this.banner?.remove();
    this.banner = null;
    super.exit();
  }

  override snapshot(): Record<string, unknown> {
    return { ...super.snapshot(), attract: true, segment: this.segment.chapterId };
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms));

export interface AttractReport {
  segments: number;
  woken: boolean;
  error: string | null;
}

let running = false;

/** Is a reel playing? */
export function attractRunning(): boolean {
  return running;
}

/**
 * Play the reel until something wakes it, then return to the title. Resolves after the title is up. Never rejects. `make` builds a segment's screen (the tests hand in a stand-in).
 */
export async function runAttract(
  app: App,
  plan: readonly AttractSegment[] = attractPlan(),
  wake = new AttractWake(),
  make: (chapter: Chapter, seg: AttractSegment, wake: AttractWake) => Screen & { finished: Promise<unknown>; highlightDone?: Promise<void> } = (c, s, w) => new AttractBattle(c, s, w),
): Promise<AttractReport> {
  const report: AttractReport = { segments: 0, woken: false, error: null };
  if (running || plan.length === 0) return report;
  running = true;
  wake.arm();
  const settings = app.save.settings;
  audio.setMusicVolume(settings.musicVolume * ATTRACT_MUSIC);
  let shortRun = 0;
  try {
    for (let i = 0; !wake.isWoken; i++) {
      const seg = plan[i % plan.length]!;
      const chapter = getChapter(seg.chapterId);
      if (!chapter) throw new Error(`attract: no chapter ${seg.chapterId}`);
      await app.fade('opaque', i === 0 ? FADE_BETWEEN_MS : 0);
      if (wake.isWoken) break;
      const screen = make(chapter, seg, wake);
      await app.replace(screen);
      if (wake.isWoken) break;
      const startedAt = performance.now();
      void app.fade('clear', FADE_BETWEEN_MS);
      report.segments++;
      await Promise.race([screen.finished, sleep(seg.maxMs), wake.woken, screen.highlightDone ?? new Promise<never>(() => undefined)]);
      if (wake.isWoken) break;
      shortRun = performance.now() - startedAt < TOO_SHORT_MS ? shortRun + 1 : 0;
      if (shortRun >= MAX_SHORT_RUN) throw new Error('attract: segments keep ending at once');
      await app.fade('opaque', FADE_BETWEEN_MS);
    }
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err);
  } finally {
    report.woken = wake.isWoken;
    wake.release();
    audio.applySettings(app.save.settings); // the music back to what the settings say, whatever ended the reel
    await app.fade('opaque', FADE_OUT_MS);
    await app.goto('title');
    running = false;
  }
  return report;
}
