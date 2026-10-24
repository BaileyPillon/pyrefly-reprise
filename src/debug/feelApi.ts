/**
 * `window.__pyrefly.punch(...)`, `punchMode()`, `hitStopMode()`, `rumble()`, `shadowFollow()`, `feelPack()`, `feel()`, `rumbleLog()`: the motion program's feel switches (lane "feel";
 * both games; captures and checks only, never a player path). A page normally just takes the switches in its address (`engine/feel/FeelSwitch.ts`): `?punch=`, `?hitstop=`,
 * `?rumble=`, `?shadow=`, `?motionsfx=`, `?timing=` and the shared `?pack=demo`. Step 2 adds `motionSfx(on?)` (the subtle synced sounds), `motionSfxLog(reset?)` (every beat and what became of it) and
 * `motionBeat(kind, strength?, heft?, atMs?, ms?)` (report one beat, as a figure would: `lunge`, `dash`, `smear`, `land` or `cast`); while `simStep` runs the planner's clock is the stepper's.
 *
 * Each setter returns the mode now in force. A mode only takes effect in the two demo chapters (the answer outside them is always today's), so `feel()` also reports the
 * chapter the battle screen named and whether it counts. `punch(fraction, ms, which)` plays one camera punch on the real spectacle camera at once: `fraction` of the
 * struck figure's depth (default 0.025), over `ms` (default 370), `which` `'new'` (the settle, the default) or `'today'` (the 9-unit smoothstep kick); it returns the depth it
 * used and the fraction it plays, or null while BATTLE SPECTACLE is not attached; the optional `trauma` (0 to 1) and `stopMs` add a trauma shake and a hit-stop of real time on top (the 60 / 144 Hz comparison).
 */
import { fxDebugHooks } from '../engine/fx/fxDebugHooks.ts';
import {
  feelChapter,
  feelPack,
  inFeelChapter,
  punchMode,
  rumbleOn,
  setFeelPack,
  motionSfxOn,
  setMotionSfxOn,
  setPunchMode,
  setRumbleOn,
  setShadowFollows,
  setStopMode,
  shadowFollows,
  stopMode,
  setTimingByTime,
  timingByTime,
  type PunchMode,
  type StopMode,
} from '../engine/feel/FeelSwitch.ts';
import { audio } from '../audio/index.ts';
import { rumbleLog, type RumbleRecord } from '../app/gamepadRumble.ts';
import { motionSfxLog, setMotionSfxClock, type MotionSfxRecord } from '../app/motionSfxSink.ts';
import { motionBeat, type MotionBeatKind } from '../engine/feel/MotionBeats.ts';
import { audioNewConfigured, audioNewOn, passChapter, setAudioNew } from '../audio/pass/passSwitch.ts'; // the sound pass (decision 184): captures and checks read it here
import { passLogGet, setPassClock, type PassLogEntry } from '../audio/pass/passLog.ts';

/** The slice of `App` the stepper needs (`app/App.ts`). */
interface Steppable {
  stop(): void;
  start(): void;
  step(dt: number, now?: number): void;
}

/** One sound the game asked for while the tap was on: when (the page's clock, which a recorder fakes), what it asked, and what the mixer says it played. */
export interface SfxTapRecord {
  at: number;
  name: string;
  options: Record<string, unknown>;
  played: { played: string; via: string; volume: number; trimDb?: number; leadMs?: number } | null;
}

export function installFeelDebug(api: Record<string, unknown>, app?: Steppable): void {
  let paused = false;
  let simNow = 0;
  const clock = (): number => (paused ? simNow : performance.now());
  const tap: SfxTapRecord[] = [];
  let tapped = false;
  /**
   * `__pyrefly.sfxTap(on?)`: record every `audio.playSfx` ask with the page's clock (a recorder's fake clock, or the stepper's), the options it came with and the mixer's own record of what
   * played, so a clip can be scored offline from the game's own asks (`sfxTapLog(reset?)`). Captures and checks only; off by default; the wrapper calls the real method first.
   */
  api['sfxTap'] = (on = true): boolean => {
    if (on && !tapped) {
      tapped = true;
      const real = audio.playSfx.bind(audio);
      audio.playSfx = (name, options) => {
        const at = clock();
        real(name, options);
        let played: SfxTapRecord['played'] = null;
        try {
          const last = audio.debug().sfxLog.at(-1);
          if (last) played = { played: last.played, via: last.via, volume: last.volume, ...(last.trimDb !== undefined ? { trimDb: last.trimDb } : {}), ...(last.leadMs !== undefined ? { leadMs: last.leadMs } : {}) };
        } catch {
          /* no log */
        }
        tap.push({ at, name, options: { ...(options ?? {}) }, played });
        if (tap.length > 600) tap.shift();
      };
    }
    return tapped;
  };
  api['sfxTapLog'] = (reset = false): SfxTapRecord[] => {
    const copy = tap.slice();
    if (reset) tap.length = 0;
    return copy;
  };
  api['simNow'] = clock;
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
        setMotionSfxClock(() => simNow); // the motion sounds' rate limits and log follow the simulated time while the stepper runs
        setPassClock(() => simNow); // so does the sound pass's log (`audio/pass/passLog.ts`)
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
      setMotionSfxClock(null);
      setPassClock(null);
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
  api['motionSfx'] = (on?: boolean): boolean => {
    if (typeof on === 'boolean') setMotionSfxOn(on);
    return motionSfxOn();
  };
  api['timing'] = (on?: boolean): boolean => {
    if (typeof on === 'boolean') setTimingByTime(on);
    return timingByTime();
  };
  api['motionSfxLog'] = (reset = false): MotionSfxRecord[] => motionSfxLog(reset);
  api['motionBeat'] = (kind: MotionBeatKind, strength?: number, heft?: number, atMs?: number, ms?: number): void =>
    motionBeat({ kind, ...(strength !== undefined ? { strength } : {}), ...(heft !== undefined ? { heft } : {}), ...(atMs !== undefined ? { atMs } : {}), ...(ms !== undefined ? { ms } : {}) });
  api['feel'] = (): Record<string, unknown> => ({
    chapter: feelChapter(),
    inDemoChapter: inFeelChapter(),
    pack: feelPack(),
    punch: punchMode(),
    hitstop: stopMode(),
    rumble: rumbleOn(),
    shadow: shadowFollows(),
    motionsfx: motionSfxOn(),
    timing: timingByTime(),
  });
  api['rumbleLog'] = (reset = false): RumbleRecord[] => rumbleLog(reset);
  /** `audioNew(on?)`: the sound pass (`?audio=new`, `audio/pass/`) in force; `audioNew(true|false)` pins it, `audioNew(null)` goes back to the address. Only Chapter I and IV ever hear it. */
  api['audioNew'] = (on?: boolean | null): boolean => {
    if (on === true || on === false || on === null) setAudioNew(on);
    return audioNewOn();
  };
  api['audioPass'] = (): Record<string, unknown> => ({ ...audio.passState(), configured: audioNewConfigured(), on: audioNewOn(), chapter: passChapter() ?? null });
  api['audioPassLog'] = (reset = false): PassLogEntry[] => passLogGet(reset);
  api['punch'] = (fraction?: number, ms?: number, which?: 'new' | 'today', trauma?: number, stopMs?: number): { depth: number; fraction: number } | null => {
    const play = fxDebugHooks['c']?.api?.['punch'] as ((f?: number, m?: number, w?: 'new' | 'today', t?: number, s?: number) => { depth: number; fraction: number }) | undefined;
    return play ? play(fraction, ms, which, trauma, stopMs) : null;
  };
}
