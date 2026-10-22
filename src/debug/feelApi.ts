/**
 * `window.__pyrefly.punch(...)`, `punchMode()`, `hitStopMode()`, `rumble()`, `shadowFollow()`, `feelPack()`, `feel()`, `rumbleLog()`: the motion program's feel switches (lane "feel";
 * both games; captures and checks only, never a player path). A page normally just takes the switches in its address (`engine/feel/FeelSwitch.ts`): `?punch=`, `?hitstop=`,
 * `?rumble=`, `?shadow=` and the shared `?pack=demo`.
 *
 * Each setter returns the mode now in force. A mode only takes effect in the two demo chapters (the answer outside them is always today's), so `feel()` also reports the
 * chapter the battle screen named and whether it counts. `punch(fraction, ms, which)` plays one camera punch on the real spectacle camera at once: `fraction` of the
 * struck figure's depth (default 0.025), over `ms` (default 370), `which` `'new'` (the settle, the default) or `'today'` (the 9-unit smoothstep kick); it returns the depth it
 * used and the fraction it plays, or null while BATTLE SPECTACLE is not attached.
 */
import { fxDebugHooks } from '../engine/fx/fxDebugHooks.ts';
import {
  feelChapter,
  feelPack,
  inFeelChapter,
  punchMode,
  rumbleOn,
  setFeelPack,
  setPunchMode,
  setRumbleOn,
  setShadowFollows,
  setStopMode,
  shadowFollows,
  stopMode,
  type PunchMode,
  type StopMode,
} from '../engine/feel/FeelSwitch.ts';
import { rumbleLog, type RumbleRecord } from '../app/gamepadRumble.ts';

/** The slice of `App` the stepper needs (`app/App.ts`). */
interface Steppable {
  stop(): void;
  start(): void;
  step(dt: number, now?: number): void;
}

export function installFeelDebug(api: Record<string, unknown>, app?: Steppable): void {
  let paused = false;
  let simNow = 0;
  if (app) {
    /**
     * `__pyrefly.simStep(frames, hz)`: stop the page's own animation loop (once) and run `frames` whole frames of the REAL app, each `1 / hz` seconds long, in this call: the
     * way to compare 60 Hz and 144 Hz (Playwright's page clock only fakes a 16 ms animation frame, so it cannot). Returns the seconds run. `simResume()` hands the page its loop back.
     */
    api['simStep'] = (frames = 1, hz = 60): number => {
      if (!paused) {
        app.stop();
        paused = true;
        simNow = performance.now();
      }
      const dt = 1 / Math.max(1, hz);
      for (let i = 0; i < frames; i++) {
        simNow += dt * 1000;
        app.step(dt, simNow);
      }
      return frames * dt;
    };
    api['simResume'] = (): boolean => {
      if (paused) app.start();
      const was = paused;
      paused = false;
      return was;
    };
  }
  api['punchMode'] = (mode?: PunchMode): PunchMode => {
    if (mode === 'today' || mode === 'new' || mode === 'off') setPunchMode(mode);
    return punchMode();
  };
  api['hitStopMode'] = (mode?: StopMode): StopMode => {
    if (mode === 'today' || mode === 'short' || mode === 'off') setStopMode(mode);
    return stopMode();
  };
  api['rumble'] = (on?: boolean): boolean => {
    if (typeof on === 'boolean') setRumbleOn(on);
    return rumbleOn();
  };
  api['shadowFollow'] = (on?: boolean): boolean => {
    if (typeof on === 'boolean') setShadowFollows(on);
    return shadowFollows();
  };
  api['feelPack'] = (on?: boolean): boolean => {
    if (typeof on === 'boolean') setFeelPack(on);
    return feelPack();
  };
  api['feel'] = (): Record<string, unknown> => ({
    chapter: feelChapter(),
    inDemoChapter: inFeelChapter(),
    pack: feelPack(),
    punch: punchMode(),
    hitstop: stopMode(),
    rumble: rumbleOn(),
    shadow: shadowFollows(),
  });
  api['rumbleLog'] = (reset = false): RumbleRecord[] => rumbleLog(reset);
  api['punch'] = (fraction?: number, ms?: number, which?: 'new' | 'today'): { depth: number; fraction: number } | null => {
    const play = fxDebugHooks['c']?.api?.['punch'] as ((f?: number, m?: number, w?: 'new' | 'today') => { depth: number; fraction: number }) | undefined;
    return play ? play(fraction, ms, which) : null;
  };
}
