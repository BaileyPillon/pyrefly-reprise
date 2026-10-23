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
 * The listener is told `open` with `lead`: the seconds until the blow lands at the live speed, `ctx.ms(440 * ATTACK_IMPACT)` (the lunge's apex), from the same constants the actor's lunge uses.
 *
 * **The wind-up** (Bailey, 2026-10-22: the real Bahamut's attack should start at its first part, the rear-up): the lunge's lead is 0.26 s, and a real Bahamut's entry (`ATTACK1_00` and `_01`, 2.6 s) is cut by the sequencer
 * to its last part to put the blow on the beat. For the figures named in `windupFor`, an `attack` opening asks the listener how much longer the blow would have to wait for the entry to play from its start (`windup`, seconds;
 * about 0.94 for Bahamut), tells it `open` at once with that much more lead, and holds the director's answer (so the presenter's lunge and push start) for that long: the rear-up plays, then the lunge and the blow land at its
 * end. Never at `'skip'`, never more than {@link WINDUP_MAX}, and only where the listener has a wind-up to give (a model with no clips has none). Pure types: no `three`, no DOM.
 */

import { ATTACK_IMPACT } from '../BattlePresenterActors.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotAnswer, ShotBeat, ShotCtx, ShotDirector } from '../ShotDirector.ts';

/** What a listener is told. */
export interface BeatListener {
  /** An action opened by `actorId`: `kind` is the painted pose the presenter picked (`attack`, `cast`, `item`, `defend`), `lead` the seconds until the blow lands. */
  open?(actorId: string, kind: string, lead: number): void;
  /** The seconds more than `lead` the blow of `actorId`'s `kind` action would have to wait for its attack to play from its first part (0: none; the clip sequencer's `windup`). */
  windup?(actorId: string, kind: string, lead: number): number;
  /** A blow by `actorId` landed. */
  impact?(actorId: string): void;
  /** The action of `actorId` is over. */
  close?(actorId: string): void;
}

/** The lunge's length at normal speed, ms (`PaintedActor.lunge`'s default and the presenter's attack lunge). */
export const LUNGE_MS = 440;

/** The longest an attack's wind-up holds the lunge, seconds (a model whose entry needs more is cut to what this allows, the sequencer's own way). */
export const WINDUP_MAX = 1.3;

const BEATS: readonly ShotBeat[] = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'];

const quietly = (f: () => void): void => {
  try {
    f();
  } catch {
    /* a listener that throws costs the report, never the beat */
  }
};

/** `inner` (or none) with its `actionOpen`, `impact` and `actionClose` beats also told to `listener`; the attacks of the ids in `windupFor` wait for their wind-up (the file's header). */
export function tapDirector(inner: ShotDirector | undefined, listener: BeatListener, windupFor: ReadonlySet<string> = new Set()): ShotDirector {
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
      const told = (extra = 0): void => {
        const c = ctx as ActionShot;
        quietly(() => listener.open?.(c.actor.id, c.action.kind, c.ms(LUNGE_MS * ATTACK_IMPACT) / 1000 + extra));
      };
      /** The wind-up this opening waits for, seconds: 0 unless an attack by an id that has one, outside `'skip'`. */
      const windup = (): number => {
        const c = ctx as ActionShot;
        if (beat !== 'actionOpen' || c.skipping || c.action.kind !== 'attack' || !windupFor.has(c.actor.id) || !listener.windup) return 0;
        let w = 0;
        quietly(() => (w = listener.windup!(c.actor.id, c.action.kind, c.ms(LUNGE_MS * ATTACK_IMPACT) / 1000)));
        return Number.isFinite(w) ? Math.min(WINDUP_MAX, Math.max(0, w)) : 0;
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
        const wait = windup();
        if (wait > 0) {
          told(wait); // the clip starts with the rear-up; the lunge and the blow come `wait` later
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
