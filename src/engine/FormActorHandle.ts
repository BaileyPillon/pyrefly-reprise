/**
 * What `PaintedStage.actor(partId)` answers for a part of a Special form, and what it answers for the form's main body (FFX-2 only in what is seen: the three Special dresspheres exist only in
 * FFX-2; the file is plain plumbing, inert until the stage registers a form, and the stage wires it in step C2).
 *
 * A Special is ONE figure, the main girl's own `PaintedActor`; its two parts are figure-less stubs. The camera and motion modules (92 `stage.actor(` sites in 28 files) and the typed fx ports
 * (`fx/c/SpectacleFx.ts` reads `a.visible`; `SpectacleTypes.ts` and `SpellMoments.ts` type the actor `PaintedActor`) must keep compiling and keep working when they are handed a part, so the
 * answer is a `Proxy` over the FIGURE: `handle instanceof PaintedActor` is true, it is never added to the scene graph, and every member of `ActorHandle` is routed by `HANDLE_MEMBERS`
 * (`SpecialReactions.ts`): `forward` reaches the figure, `swallow` does nothing (a part never fades, dissolves, stones or lies down the figure), `source` answers a position from the stub
 * under the part mark (b) and from the figure under (a). Any other key (`visible`, `contentQuad`, `height`, `pose`, `userData`, ...) is the figure's own, functions bound to it.
 *
 * THE HIT GATE (D-9, "the figure hurts once per enemy action"): one enemy move that hits two or three of the plates gives one `damage` event per plate, and each makes the presenter call
 * `hitReact` (a shake and a recoil that retake the hurt pose every call). While `gate.blocked` is set by the presenter (step C2, once per event, before the event plays), `flash`, `shake`,
 * `recoil` and `hitReact` do nothing: `undefined`, `Promise.resolve()`, `false` (so the caller plays no fallback blow either). The gate is read at call time. The main's own actor is gated the
 * same way (`createHitGatedActor`), because a first blow on a part followed by a blow on the main in the same action would otherwise flinch twice.
 *
 * No `three` object is made here: the handle only forwards. No DOM.
 */

import type { ActorHandle } from './BattlePresenterPorts.ts';
import type { PaintedActor } from './PaintedActor.ts';
import { HANDLE_MEMBERS } from './SpecialReactions.ts';

/** The part mark: under (a) the positions come from the figure, under (b) from the part's stub. */
export type HandleMode = 'a' | 'b';

type Gate = { readonly blocked: boolean };

/** The four members the hit gate holds: a blow's shake, recoil and hit reaction, and the flash. */
const GATED: ReadonlySet<string> = new Set(['flash', 'shake', 'recoil', 'hitReact']);
/** The swallowed members whose callers await a promise. */
const SWALLOWED_PROMISES: ReadonlySet<string> = new Set(['fadeTo', 'dissolveTo', 'lieDown', 'ramp']);

const isMember = (key: string): key is keyof ActorHandle => Object.hasOwn(HANDLE_MEMBERS, key);

/** What a gated member answers while the gate holds it. */
function held(key: string): unknown {
  return key === 'recoil' ? Promise.resolve() : key === 'hitReact' ? false : undefined;
}

/** A member of `target`, functions bound to it (not the constructor: it is not a member). */
function read(target: object, key: string | symbol): unknown {
  const v = Reflect.get(target, key, target);
  return typeof v === 'function' && key !== 'constructor' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
}

function proxyOver(figure: PaintedActor, gate: Gate, part: { stub: PaintedActor | undefined; mode: HandleMode } | null): PaintedActor {
  return new Proxy(figure, {
    get(_target, key) {
      if (typeof key !== 'string') return Reflect.get(figure, key, figure);
      if (part && isMember(key)) {
        const rule = HANDLE_MEMBERS[key];
        if (rule === 'swallow') return SWALLOWED_PROMISES.has(key) ? () => Promise.resolve() : () => undefined;
        if (rule === 'source' && part.mode === 'b' && part.stub) return read(part.stub, key);
      }
      if (GATED.has(key)) {
        return (...args: unknown[]): unknown => {
          if (gate.blocked) return held(key);
          const fn = Reflect.get(figure, key, figure) as ((...a: unknown[]) => unknown) | undefined;
          return typeof fn === 'function' ? fn.apply(figure, args) : held(key);
        };
      }
      return read(figure, key);
    },
    set(_target, key, value) {
      return Reflect.set(figure, key, value);
    },
  });
}

/** A part's handle: the figure, with the swallowed members silent, the positions from the stub under (b), and the four gated members held while `gate.blocked`. A missing stub under (b) degrades to the figure. */
export function createFormActorHandle(figure: PaintedActor, stub: PaintedActor | undefined, mode: HandleMode, gate: Gate): PaintedActor {
  return proxyOver(figure, gate, { stub, mode });
}

/** The main's actor while a form is up: the figure itself, only `flash`, `shake`, `recoil` and `hitReact` gated; every other member is the figure's own, bound to it. */
export function createHitGatedActor(figure: PaintedActor, gate: Gate): PaintedActor {
  return proxyOver(figure, gate, null);
}
