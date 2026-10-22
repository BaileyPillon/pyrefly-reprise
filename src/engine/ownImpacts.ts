/**
 * **A scene that draws its own hits** (the hidden Wind Waker chapter, `scenes/exp-windwaker-stage.ts`; shared plumbing, additive, FFX-2 only in use).
 *
 * Every blow of a fight is dressed by the stage's shared effects: the impact bloom, sparks and slash arc (`BattlePresenterStage` `impactAt`), the drawn spell effect that wins the blow (`spellfx/`, whose `hit` draws a
 * 300 px white bloom and a wash), and SKILL TRAVEL's shot with its impact frame (a pink ring, a starburst and a glow). They are painted over a figure in screen space or added to it, and a figure drawn as a toon model with
 * its colours held under the bloom threshold meets them as a blob of white for a frame or two (polish 1, stills 55 and 60: the Energy Blast landing). A scene that sets `ownImpacts` (`SceneStaging.ownImpacts`) says it
 * draws its hits itself, from the shot director's `impact` beat (`ww3d/hitFx.ts`): this wrapper turns the stage's own impact effects off for it and leaves everything else alone (the numerals, the camera cut, the shake, the
 * recoil, the sounds, the screen flashes and a stone figure's shards are the presenter's, not effects of a blow).
 *
 * Every other scene keeps the port it had: with `owned` false the same object comes back.
 */

import type { VfxPort } from './BattlePresenterPorts.ts';

/** Does this scene draw its own hits? (`SceneStaging.ownImpacts`.) */
export function impactsOwned(slots: { readonly ownImpacts?: boolean }): boolean {
  return slots.ownImpacts === true;
}

/** The effects `play` still draws on a combatant for a scene that owns its hits: a petrified figure breaking into stone chips is a death, not a blow. */
const KEPT_KEYS: ReadonlySet<string> = new Set(['stone-shatter']);

/**
 * `port`, with the stage's impact effects turned off when `owned`: `play` on a combatant (a screen flash and the stone shards still play), `impact`, the spell layer's `land` (0 ms: nothing to wait for, so the
 * blow's numeral lands at once, with the scene's own burst), and SKILL TRAVEL (`canTravel` says no, so no shot flies and no numeral is held for one; `travel` itself draws nothing). With `owned` false: `port` itself.
 */
export function withOwnImpacts(port: VfxPort, owned: boolean): VfxPort {
  if (!owned) return port;
  const none = Promise.resolve();
  return {
    ...port,
    play: (key, at) => (at === 'screen' || KEPT_KEYS.has(key) ? port.play(key, at) : none),
    impact: () => none,
    land: () => 0,
    canTravel: () => false,
    travel: () => ({ ms: 0, landed: none }),
  };
}
