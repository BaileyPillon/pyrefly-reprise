/**
 * The page's side of the gamepad rumble (`?rumble=on`; `engine/feel/Rumble.ts` has the patterns and the switch, `engine/feel/FeelHooks.ts` the presenter's gates; both games).
 *
 * {@link playRumble} turns a pattern into `gamepad.vibrationActuator.playEffect('dual-rumble', ...)` calls. It plays only when ALL of these hold, and says why not in
 * {@link rumbleLog} when one does not (the recorder and the tests read it):
 *
 * - the last thing the player pressed was a pad (`inputDevice.padActive`): **never on keyboard play**, whatever is plugged in;
 * - REDUCE MOTION is off (`prefersReducedMotion`): the pause row or the OS preference, read at the moment of the pulse;
 * - a connected pad has a `vibrationActuator` that can play `dual-rumble`: Firefox and Safari have none, an old Chromium has `playEffect` without the type, a pad may be gone;
 * - the last pattern is not still playing (two big moments a few frames apart are one rumble, not a smear of two).
 *
 * **One segment is on the pad at a time.** A second `playEffect` while an effect is playing OR pending (even one waiting on its `startDelay`) preempts the first (the Gamepad API's
 * "preempted" result), so a pattern of two segments cannot be sent as two back-to-back calls with delays: the first would be cut and only the last heard (review fix F3: the win's
 * 160 ms pulse). The first segment is sent now; each later one is sent when its own moment comes, by a timer ({@link RumbleDeps.later}), which a pause, a screen change or the next
 * pattern cancels ({@link stopRumble}).
 *
 * Every call into the pad is guarded: a browser that throws, a promise that rejects, a pad that vanished mid-pattern is silence, never an error.
 * Nothing is stored, and nothing leaves the page.
 */
import { padActive } from './inputDevice.ts';
import { RUMBLE_MAX_MS, rumbleLength, setRumbleSink, type RumblePattern, type RumbleSeg } from '../engine/feel/Rumble.ts';
import { prefersReducedMotion } from '../ui/common/transitions/reduceMotion.ts';

/** The slice of a `GamepadHapticActuator` this needs. */
interface Actuator {
  playEffect?: (type: string, params: { startDelay: number; duration: number; weakMagnitude: number; strongMagnitude: number }) => Promise<unknown>;
  reset?: () => Promise<unknown>;
}
interface PadLike {
  connected?: boolean;
  vibrationActuator?: Actuator | null;
}

/** What the sink reads; the tests replace them. */
export interface RumbleDeps {
  pads(): ArrayLike<PadLike | null> | null | undefined;
  padActive(): boolean;
  reduceMotion(): boolean;
  now(): number;
  /** Run `fn` after `ms` and return a canceller (default: `setTimeout`); the later segments of a pattern. The tests replace it. */
  later?(fn: () => void, ms: number): () => void;
}

const live: RumbleDeps = {
  pads: () => (typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function' ? (navigator.getGamepads() as ArrayLike<PadLike | null>) : null),
  padActive,
  reduceMotion: prefersReducedMotion,
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  later: (fn, ms) => {
    const h = setTimeout(fn, ms);
    return () => clearTimeout(h);
  },
};

export interface RumbleRecord {
  at: number;
  ms: number;
  segments: number;
  /** `played`, or the gate that said no. */
  result: 'played' | 'keyboard' | 'reduce-motion' | 'no-pad' | 'busy' | 'error';
}

const log: RumbleRecord[] = [];
let busyUntil = 0;
/** A pattern has gone to the pad since the last stop: only then does {@link stopRumble} touch the pad (a pause with the rumble off leaves it alone). */
let played = false;
/** Cancellers of the later segments of the pattern in flight. */
let pending: Array<() => void> = [];

function cancelPending(): void {
  const cancel = pending;
  pending = [];
  for (const c of cancel) {
    try {
      c();
    } catch {
      /* a timer that is already gone */
    }
  }
}

/** The last pulses and what became of them (captures and tests). */
export function rumbleLog(reset = false): RumbleRecord[] {
  const copy = log.slice();
  if (reset) log.length = 0;
  return copy;
}

function note(at: number, p: RumblePattern, result: RumbleRecord['result']): void {
  log.push({ at: Math.round(at), ms: rumbleLength(p), segments: p.length, result });
  if (log.length > 60) log.shift();
}

function actuatorOf(pads: ArrayLike<PadLike | null> | null | undefined): Actuator | null {
  if (!pads) return null;
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (pad && pad.connected !== false && typeof pad.vibrationActuator?.playEffect === 'function') return pad.vibrationActuator;
  }
  return null;
}

/** Play a pattern on the player's pad, if every gate holds. Returns what happened. */
export function playRumble(pattern: RumblePattern, deps: RumbleDeps = live): RumbleRecord['result'] {
  const at = deps.now();
  let result: RumbleRecord['result'];
  try {
    const actuator = actuatorOf(deps.pads());
    if (!deps.padActive()) result = 'keyboard';
    else if (deps.reduceMotion()) result = 'reduce-motion';
    else if (!actuator) result = 'no-pad';
    else if (at < busyUntil) result = 'busy';
    else {
      cancelPending(); // the new pattern preempts what is on the pad, and the rest of the old one must not come after it
      const later = deps.later ?? live.later!;
      const send = (seg: RumbleSeg, startDelay: number): void => {
        const p = actuator.playEffect!('dual-rumble', {
          startDelay,
          duration: Math.max(1, Math.round(Math.min(seg.ms, RUMBLE_MAX_MS - seg.atMs))),
          weakMagnitude: Math.min(1, Math.max(0, seg.weak)),
          strongMagnitude: Math.min(1, Math.max(0, seg.strong)),
        });
        if (p && typeof p.catch === 'function') p.catch(() => undefined); // a pad that went away mid-pattern is silence
      };
      pattern
        .filter((seg) => seg.atMs < RUMBLE_MAX_MS)
        .forEach((seg, i) => {
          if (i === 0) send(seg, Math.max(0, Math.round(seg.atMs)));
          else
            pending.push(
              later(() => {
                try {
                  send(seg, 0);
                } catch {
                  /* the pad went away between segments: silence */
                }
              }, Math.max(0, Math.round(seg.atMs))),
            );
        });
      busyUntil = at + Math.min(RUMBLE_MAX_MS, rumbleLength(pattern)) * 0.6;
      played = true;
      result = 'played';
    }
  } catch {
    result = 'error';
  }
  note(at, pattern, result);
  return result;
}

/** Stop whatever is playing (a pause, a screen change). Guarded like the rest. */
export function stopRumble(deps: RumbleDeps = live): void {
  busyUntil = 0;
  cancelPending();
  if (!played) return;
  played = false;
  try {
    const actuator = actuatorOf(deps.pads());
    const done = actuator?.reset?.();
    if (done && typeof done.catch === 'function') done.catch(() => undefined);
  } catch {
    /* no pad, no rumble to stop */
  }
}

/** Register the sink once, at start-up; harmless when no switch ever turns the rumble on. */
export function installGamepadRumble(): void {
  setRumbleSink((pattern) => void playRumble(pattern));
}

/** Tests: forget the log and the busy window. */
export function resetRumbleForTests(): void {
  log.length = 0;
  busyUntil = 0;
  played = false;
  cancelPending();
}
