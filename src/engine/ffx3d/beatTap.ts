/**
 * **Listening to the shot director's beats** (the hidden Fayth chapter's `ffx` skin; FFX only). The presenter asks the scene's shot director at each beat of a fight (`../ShotDirector.ts`), and the beats carry what
 * the animator needs and the pose alone cannot say: whose action, which ability, when a blow lands. {@link tapShotDirector} wraps a director so that every beat is also reported to a listener, and changes
 * nothing about the director's own answers:
 *
 * - A beat the inner director has no handler for answers `false` (the presenter plays its own camera for it), exactly as with no director; with no inner director at all, so does every beat.
 * - **When the listener hears each beat.** An action's opening is reported when the director's answer has come (a promise is awaited: the presenter proceeds, and the lunge starts, only then); a blow and a
 *   close are reported when they are asked, because the close can be held for seconds by a camera program and the action is over when it is asked. A director that throws, or whose promise rejects,
 *   is the presenter's concern as ever (it counts as "not taken" there); the listener is told anyway.
 * - A listener that throws costs the report, never the beat.
 *
 * Pure types: no `three`, no DOM. Game case: FFX only.
 */

import type { ActionShot, ActorShot, ImpactShot, ShotAnswer, ShotBeat, ShotCtx, ShotDirector } from '../ShotDirector.ts';

/** What a listener is told: the beat, and the context the presenter gave it. */
export interface BeatListener {
  /** An action opened (`actionOpen`), after the director's answer: the lunge starts now. */
  open?(beat: 'actionOpen', ctx: ActionShot): void;
  /** A blow landed (`impact`). */
  impact?(beat: 'impact', ctx: ImpactShot): void;
  /** An action is over (`actionClose`). */
  close?(beat: 'actionClose', ctx: ActorShot): void;
}

const BEATS: readonly ShotBeat[] = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'];

const quietly = (f: () => void): void => {
  try {
    f();
  } catch {
    /* a listener that throws costs the report, never the beat */
  }
};

/** `inner` (or none) with `listener` told of its beats. */
export function tapShotDirector(inner: ShotDirector | undefined, listener: BeatListener): ShotDirector {
  const out: Record<string, unknown> = {};
  for (const beat of BEATS) {
    out[beat] = (ctx: ShotCtx): ShotAnswer => {
      const handler = (inner as Record<string, ((c: ShotCtx) => ShotAnswer) | undefined> | undefined)?.[beat];
      if (beat === 'impact') quietly(() => listener.impact?.('impact', ctx as ImpactShot));
      if (beat === 'actionClose') quietly(() => listener.close?.('actionClose', ctx as ActorShot));
      const told = (): void => quietly(() => listener.open?.('actionOpen', ctx as ActionShot));
      let answer: ShotAnswer = false; // no handler: the beat is the presenter's own, as with no director
      if (handler) {
        try {
          answer = handler.call(inner, ctx);
        } catch (e) {
          if (beat === 'actionOpen') told();
          throw e;
        }
      }
      if (beat === 'actionOpen') {
        if (answer instanceof Promise) void answer.then(told, told);
        else told();
      }
      return answer;
    };
  }
  return out as ShotDirector;
}
