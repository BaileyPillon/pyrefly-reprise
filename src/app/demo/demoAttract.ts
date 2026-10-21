/**
 * THE ATTRACT LOOP (release 61, the conference demo; Bailey, 2026-10-21, decision 169n: "after 60 s idle on the title, a self-running highlight reel of both fights (real gameplay, auto-played), any button
 * returns to the title"; both games, demo mode only; Seymour Flux is Chapter I, FFX, Bahamut is Chapter IV, FFX-2).
 *
 * What plays: the real game. Each segment is an ordinary `BattleScreen` fought on the demo seed (`demoMode.ts`: Seymour 7, Bahamut 56) by the chapter's own line (`intendedStrategy`, which asks `tacticFor`
 * first), under the same look, with the music lowered and a "Press any button" banner. Seymour, then Bahamut, then Seymour again, for as long as no one is there. Seymour plays at normal speed; Bahamut's long middle
 * is run at the presenter's skip and fast speeds so the segment reaches the Mega Flare in under a minute (`attractPlan`). The segments are cut at their time caps or at the end of their highlight with a fade to black
 * between them; a fight that ends sooner moves on sooner.
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
import { preloadBattle } from '../screens/battlePreload.ts';
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
   * Speed phases, in order, over a long fight: each plays at its `speed` from `afterMs` into the segment (the first) or from the end of the one before (the rest) until `until` is true of the engine's flags, then the next
   * begins; after the last, and before the first, the segment's own `speed`. Bahamut's Mega Flare ends a count that opens about a minute into the fight, and the presenter's clock at normal speed takes about two minutes
   * to get there (measured: log events 51 to 882 take 10 s at skip, 48 s at fast and well over a minute at normal; the count takes about 28 s at fast): the reel plays the opening, jumps (skip) to where the count opens, runs the count
   * fast and plays the cast at normal speed. Skip stops on the frame the flag appears (at most 35 events a frame; measured, no overshoot).
   */
  readonly phases?: ReadonlyArray<AttractPhase>;
  /** End the segment this long after `abilityId` starts (the cast itself, and a few seconds of what it does). */
  readonly endAfter?: { readonly abilityId: string; readonly afterMs: number };
}

export interface AttractPhase {
  readonly speed: PlaybackSpeed;
  /** Not before this many ms into the segment (only the first phase waits on it). */
  readonly afterMs: number;
  /** True of the engine's flags when the phase is over. */
  readonly until: (flags: Readonly<Record<string, number | string | boolean>>) => boolean;
}

/**
 * The reel: Seymour Flux (FFX), then Bahamut (FFX-2), round again. The seeds are the demo's own (`demoSeedAt(id, 0)`).
 * Seymour plays at normal speed for 40 seconds. Bahamut plays its first 12 seconds at normal speed, jumps at the presenter's skip speed to where the count opens (the engine's `bahamutCountdown` flag leaves 0: about 10
 * seconds), runs the count 5, 4, 3, 2, 1 fast (about 28 seconds) until the cast (the flag reads 1), plays the Mega Flare at normal speed and ends 7 seconds after it starts, inside an 80 second cap: about 60 seconds in all.
 */
export function attractPlan(): AttractSegment[] {
  return DEMO_FIGHTS.map((f) => {
    const seed = demoSeedAt(f.id, 0) ?? 1;
    if (f.id === 'ffx2-bahamut') {
      const count = (flags: Readonly<Record<string, number | string | boolean>>): number => Number(flags['bahamutCountdown'] ?? 0);
      return {
        chapterId: f.id,
        seed,
        maxMs: 80_000,
        speed: 'normal' as const,
        phases: [
          { speed: 'skip' as const, afterMs: 12_000, until: (flags) => count(flags) > 0 }, // the count has opened
          { speed: 'fast' as const, afterMs: 0, until: (flags) => count(flags) === 1 }, // the cast
        ],
        endAfter: { abilityId: 'mega-flare', afterMs: 7_000 },
      };
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
  private phaseIx = 0;
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

  /** The speed phases and the end of the highlight, read from the live engine (the reel only watches it). */
  private pace(): void {
    const engine = this.battleEngine;
    const presenter = this.battlePresenter;
    const { phases, endAfter } = this.segment;
    if (!engine || !presenter || (!phases && !endAfter)) return;
    const state = engine.state();
    let want: PlaybackSpeed = this.segment.speed;
    for (let phase = phases?.[this.phaseIx]; phase; phase = phases?.[this.phaseIx]) {
      if (phase.until(state.flags)) {
        this.phaseIx++;
        continue;
      }
      if (this.visibleMs >= phase.afterMs) want = phase.speed;
      break;
    }
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
  /** The title was left (faded out and replaced): then the title is shown again at the end. False when a press came while the art was still loading, and the title never went. */
  left: boolean;
}

let running = false;

/** Is a reel playing? */
export function attractRunning(): boolean {
  return running;
}

/**
 * Play the reel until something wakes it, then return to the title. Resolves after the title is up. Never rejects. `make` builds a segment's screen and `preload` warms a chapter's art (the tests hand in stand-ins).
 *
 * The first segment's art loads while the title is still up and nothing has faded, so a press in those seconds (about ten on the dev server) is answered at once: the title never went. Each later segment's art loads behind the one that is playing.
 */
export async function runAttract(
  app: App,
  plan: readonly AttractSegment[] = attractPlan(),
  wake = new AttractWake(),
  make: (chapter: Chapter, seg: AttractSegment, wake: AttractWake) => Screen & { finished: Promise<unknown>; highlightDone?: Promise<void> } = (c, s, w) => new AttractBattle(c, s, w),
  preload: (chapter: Chapter, seed: number) => Promise<unknown> = preloadBattle,
): Promise<AttractReport> {
  const report: AttractReport = { segments: 0, woken: false, error: null, left: false };
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
      if (i === 0) {
        await Promise.race([preload(chapter, seg.seed).catch(() => undefined), wake.woken]); // the title stays up while the first segment's art loads
        if (wake.isWoken) break;
      }
      report.left = true;
      await app.fade('opaque', i === 0 ? FADE_BETWEEN_MS : 0);
      if (wake.isWoken) break;
      const screen = make(chapter, seg, wake);
      await app.replace(screen);
      if (wake.isWoken) break;
      const startedAt = performance.now();
      void app.fade('clear', FADE_BETWEEN_MS);
      report.segments++;
      const next = getChapter(plan[(i + 1) % plan.length]!.chapterId);
      if (next) void preload(next, plan[(i + 1) % plan.length]!.seed).catch(() => undefined); // the next segment's art, behind this one
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
    if (report.left) {
      await app.fade('opaque', FADE_OUT_MS);
      await app.goto('title');
    }
    running = false;
  }
  return report;
}
