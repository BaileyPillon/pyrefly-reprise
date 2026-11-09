/**
 * **Listening to the shot director's beats** (the hidden Wendigo chapter's 3D stage; FFX only; the house habit of `../yrp3d/beats.ts`, which this follows, with the ability id and the target added: the Wendigo's clips are
 * chosen by the move, not only by the painted pose). The presenter asks the scene's shot director at each beat of a fight (`../ShotDirector.ts`); {@link tapDirector} wraps a director so that three of its beats are also
 * reported to a listener, and changes nothing about the director's own answers:
 *
 * - **`actionOpen`** is reported when the director's answer has come (a promise is awaited: the presenter proceeds, and the lunge starts, only then), so a clip starts with the lunge and not with a camera flight that is still on
 *   its way. The listener is told the `lead`: the seconds until the blow lands at the live speed, from the same constants the actor's lunge uses.
 * - **`impact`** and **`actionClose`** are reported when they are asked.
 * - **The wind-up.** For the ids in `windupFor` (the Wendigo and the Guardians: their blows are 2.5 to 3.5 s of wind-up, swing and recovery), a blow opening asks the listener how much longer the blow would have to wait for the
 *   clip to play from its first frame (`windup`, seconds), tells it `open` at once with that much more lead, and holds the director's answer (so the presenter's lunge starts) for that long: the wind-up plays, then the lunge
 *   and the blow land at its end. Never at `'skip'`, never more than {@link WINDUP_MAX}.
 * - A listener that throws costs the report, never the beat; a beat the inner director has no handler for answers `false` (the presenter plays its own camera), exactly as with no director.
 *
 * Pure types: no `three`, no DOM.
 */

import { ATTACK_IMPACT } from '../BattlePresenterActors.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotAnswer, ShotBeat, ShotCtx, ShotDirector } from '../ShotDirector.ts';

/** What a listener is told. */
export interface BeatListener {
  /** An action opened by `actorId`: `kind` is the painted pose the presenter picked, `abilityId` the move, `lead` the seconds until the blow lands. */
  open?(actorId: string, kind: string, lead: number, abilityId: string | undefined): void;
  /** The seconds more than `lead` the blow of this action would have to wait for its clip to play from its first frame (0: none). */
  windup?(actorId: string, kind: string, lead: number, abilityId: string | undefined): number;
  /** A blow by `actorId` landed on `targetId`. */
  impact?(actorId: string, targetId: string | undefined, heavy: boolean): void;
  /** The action of `actorId` is over. */
  close?(actorId: string): void;
}

/** The lunge's length at normal speed, ms. */
export const LUNGE_MS = 440;
/** The longest a blow's wind-up holds the lunge, seconds. */
export const WINDUP_MAX = 1.1;

const BEATS: readonly ShotBeat[] = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'];

const quietly = (f: () => void): void => {
  try {
    f();
  } catch {
    /* a listener that throws costs the report, never the beat */
  }
};

/** `inner` (or none) with its `actionOpen`, `impact` and `actionClose` beats also told to `listener`; the blows of the ids in `windupFor` wait for their wind-up (the file's header). */
export function tapDirector(inner: ShotDirector | undefined, listener: BeatListener, windupFor: ReadonlySet<string> = new Set()): ShotDirector {
  const out: Record<string, unknown> = {};
  for (const beat of BEATS) {
    out[beat] = (ctx: ShotCtx): ShotAnswer => {
      const handler = (inner as Record<string, ((c: ShotCtx) => ShotAnswer) | undefined> | undefined)?.[beat];
      if (beat === 'impact') {
        const c = ctx as ImpactShot;
        if (c.actor) quietly(() => listener.impact?.(c.actor!.id, c.target?.id, c.heavy));
      }
      if (beat === 'actionClose') {
        const c = ctx as ActorShot;
        if (c.actor) quietly(() => listener.close?.(c.actor!.id));
      }
      const told = (extra = 0): void => {
        const c = ctx as ActionShot;
        quietly(() => listener.open?.(c.actor.id, c.action.kind, c.ms(LUNGE_MS * ATTACK_IMPACT) / 1000 + extra, c.action.abilityId));
      };
      const windup = (): number => {
        const c = ctx as ActionShot;
        if (beat !== 'actionOpen' || c.skipping || c.action.kind !== 'attack' || !windupFor.has(c.actor.id) || !listener.windup) return 0;
        let w = 0;
        quietly(() => (w = listener.windup!(c.actor.id, c.action.kind, c.ms(LUNGE_MS * ATTACK_IMPACT) / 1000, c.action.abilityId)));
        return Number.isFinite(w) ? Math.min(WINDUP_MAX, Math.max(0, w)) : 0;
      };
      let answer: ShotAnswer = false;
      if (handler) {
        try {
          answer = handler.call(inner, ctx);
        } catch (e) {
          if (beat === 'actionOpen') told();
          throw e;
        }
      }
      if (beat === 'actionOpen') {
        const wait = windup();
        if (wait > 0) {
          told(wait);
          return Promise.resolve(answer).then(
            (a) => new Promise<boolean>((resolve) => setTimeout(() => resolve(a), wait * 1000)),
            () => new Promise<boolean>((resolve) => setTimeout(() => resolve(false), wait * 1000)),
          );
        }
        if (answer instanceof Promise) void answer.then(() => told(), () => told());
        else told();
      }
      return answer;
    };
  }
  return out as ShotDirector;
}
