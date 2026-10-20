/**
 * **Listening to the shot director's beats** (the hidden 3D Bahamut chapter, FFX-2 only; the house habit of `engine/ffx3d/beatTap.ts`, kept apart so this chapter imports nothing of FFX's): the presenter asks the scene's
 * shot director at each beat of a fight (`../ShotDirector.ts`), and the beats carry what a clip rig needs and the pose alone cannot say: whose action, which kind (`attack`, `cast`), and when a blow lands.
 * {@link tapDirector} wraps a director so that three of its beats are also reported to a listener, and changes nothing about the director's own answers:
 *
 * - **`actionOpen`** is reported when the director's answer has come (a promise is awaited: the presenter proceeds, and the lunge starts, only then), so a clip starts with the lunge and not with a camera move that is
 *   still on its way (Mega Flare's, `./director.ts`).
 * - **`impact`** and **`actionClose`** are reported when they are asked: `impact` is synchronous and the close can be held for seconds by a camera program.
 * - A listener that throws costs the report, never the beat; a director that throws is the presenter's concern as ever (and the listener is told anyway).
 * - A beat the inner director has no handler for answers `false` (the presenter plays its own camera), exactly as with no director.
 *
 * The listener is told `open` with `lead`: the seconds until the blow lands at the live speed, `ctx.ms(440 * ATTACK_IMPACT)` (the lunge's apex), from the same constants the actor's lunge uses. Pure types: no `three`, no DOM.
 */

import { ATTACK_IMPACT } from '../BattlePresenterActors.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotAnswer, ShotBeat, ShotCtx, ShotDirector } from '../ShotDirector.ts';

/** What a listener is told. */
export interface BeatListener {
  /** An action opened by `actorId`: `kind` is the painted pose the presenter picked (`attack`, `cast`, `item`, `defend`), `lead` the seconds until the blow lands. */
  open?(actorId: string, kind: string, lead: number): void;
  /** A blow by `actorId` landed. */
  impact?(actorId: string): void;
  /** The action of `actorId` is over. */
  close?(actorId: string): void;
}

/** The lunge's length at normal speed, ms (`PaintedActor.lunge`'s default and the presenter's attack lunge). */
export const LUNGE_MS = 440;

const BEATS: readonly ShotBeat[] = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'];

const quietly = (f: () => void): void => {
  try {
    f();
  } catch {
    /* a listener that throws costs the report, never the beat */
  }
};

/** `inner` (or none) with its `actionOpen`, `impact` and `actionClose` beats also told to `listener`. */
export function tapDirector(inner: ShotDirector | undefined, listener: BeatListener): ShotDirector {
  const out: Record<string, unknown> = {};
  for (const beat of BEATS) {
    out[beat] = (ctx: ShotCtx): ShotAnswer => {
      const handler = (inner as Record<string, ((c: ShotCtx) => ShotAnswer) | undefined> | undefined)?.[beat];
      if (beat === 'impact') {
        const c = ctx as ImpactShot;
        if (c.actor) quietly(() => listener.impact?.(c.actor!.id));
      }
      if (beat === 'actionClose') {
        const c = ctx as ActorShot;
        if (c.actor) quietly(() => listener.close?.(c.actor!.id));
      }
      const told = (): void => {
        const c = ctx as ActionShot;
        quietly(() => listener.open?.(c.actor.id, c.action.kind, c.ms(LUNGE_MS * ATTACK_IMPACT) / 1000));
      };
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
