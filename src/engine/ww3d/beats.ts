/**
 * **Listening to the shot director's beats** (the hidden Wind Waker chapter, FFX-2 only; the house habit of `engine/ffx3d/beatTap.ts`, kept apart so this chapter imports nothing of FFX's): the presenter asks the scene's
 * shot director at each beat of a fight (`../ShotDirector.ts`), and the beats carry what a clip rig and the move effects need and the pose alone cannot say: whose action, which kind (`attack`, `cast`, `overdrive`), which
 * ability, against whom, and when a blow lands. {@link tapDirector} wraps a director (or none) so that four of its beats are also reported to a listener, and changes nothing about the director's own answers:
 *
 * - **`actionOpen`** and **`overdriveStart`** are reported when the director's answer has come (a promise is awaited: the presenter proceeds, and the lunge starts, only then), so a clip starts with the lunge and not with
 *   a camera move that is still on its way.
 * - **`impact`** and **`actionClose`** are reported when they are asked: `impact` is synchronous and the close can be held for seconds by a camera program.
 * - A listener that throws costs the report, never the beat; a director that throws is the presenter's concern as ever (and the listener is told anyway).
 * - A beat the inner director has no handler for answers `false` (the presenter plays its own camera), exactly as with no director.
 *
 * The listener is told `open` with `lead`: the seconds until the blow lands at the live speed, `ctx.ms(440 * ATTACK_IMPACT)` (the lunge's apex, from the same constants the actor's lunge uses) for an action, and
 * {@link OVERDRIVE_LEAD_MS} for an overdrive (a stand-in: the presenter's overdrive has no single blow). Pure types: no `three`, no DOM.
 */

import { ATTACK_IMPACT } from '../BattlePresenterActors.ts';
import type { ActionShot, ActorShot, ImpactShot, ShotAnswer, ShotBeat, ShotCtx, ShotDirector } from '../ShotDirector.ts';

/** What the beat says about the action beyond who and which kind. */
export interface OpenInfo {
  /** The ability the command resolved to (chapter 24's own ids, e.g. `x2-valefor-energy-ray`), or undefined for a plain attack. */
  readonly abilityId?: string | undefined;
  /** The combatants the action is aimed at. */
  readonly targetIds: readonly string[];
}

/** What a listener is told. */
export interface BeatListener {
  /** An action opened by `actorId`: `kind` is the painted pose the presenter picked (`attack`, `cast`, `item`, `defend`) or `overdrive`, `lead` the seconds until the blow lands. */
  open?(actorId: string, kind: string, lead: number, info: OpenInfo): void;
  /** A blow by `actorId` landed. */
  impact?(actorId: string): void;
  /** The action of `actorId` is over. */
  close?(actorId: string): void;
}

/** The lunge's length at normal speed, ms (`PaintedActor.lunge`'s default and the presenter's attack lunge). */
export const LUNGE_MS = 440;

/** The charge an overdrive gets before its payoff, ms at normal speed: a stand-in for the presenter's overdrive, which has no single blow (Valefor's Energy Blast). */
export const OVERDRIVE_LEAD_MS = 1500;

const BEATS: readonly ShotBeat[] = ['battleStart', 'turnStart', 'actionOpen', 'impact', 'actionClose', 'overdriveStart', 'overdriveEnd', 'telegraph', 'formChange', 'victory'];

const quietly = (f: () => void): void => {
  try {
    f();
  } catch {
    /* a listener that throws costs the report, never the beat */
  }
};

/** `inner` (or none) with its `actionOpen`, `overdriveStart`, `impact` and `actionClose` beats also told to `listener`. */
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
      const opens = beat === 'actionOpen' || beat === 'overdriveStart';
      const told = (): void => {
        const c = ctx as ActionShot;
        const lead = beat === 'overdriveStart' ? c.ms(OVERDRIVE_LEAD_MS) / 1000 : c.ms(LUNGE_MS * ATTACK_IMPACT) / 1000;
        quietly(() => listener.open?.(c.actor.id, c.action.kind, lead, { abilityId: c.action.abilityId, targetIds: c.targets.map((t) => t.id) }));
      };
      let answer: ShotAnswer = false; // no handler: the beat is the presenter's own, as with no director
      if (handler) {
        try {
          answer = handler.call(inner, ctx);
        } catch (e) {
          if (opens) told();
          throw e;
        }
      }
      if (opens) {
        if (answer instanceof Promise) void answer.then(told, told);
        else told();
      }
      return answer;
    };
  }
  return out as ShotDirector;
}
