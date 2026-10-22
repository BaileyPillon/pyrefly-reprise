/**
 * **A scene that draws its own hits** (the hidden Wind Waker chapter, `scenes/exp-windwaker-stage.ts`; shared plumbing, additive, FFX-2 only in use).
 *
 * Every blow of a fight is dressed by the stage's shared effects: the impact bloom, sparks and slash arc (`BattlePresenterStage` `impactAt`), the drawn spell effect that wins the blow (`spellfx/`, whose `hit` draws a
 * 300 px white bloom and a wash), SKILL TRAVEL's shot with its impact frame (a pink ring, a starburst and a glow), and **BATTLE SPECTACLE's hit** (option C, on by default: `fx/c/SpectacleFx.hit`, the impact frame, the ring and
 * rays, the shock spheres of a spell, the heat haze, the trauma shake and the hit-stop: polish 2 found it was the white ring and glow over Yuna in stills 55 and 60, not SKILL TRAVEL's). They are painted over a figure in screen
 * space or added to it, and a figure drawn as a toon model with its colours held under the bloom threshold meets them as a blob of white for a frame or two (polish 1, stills 55 and 60: the Energy Blast landing). A scene that
 * sets `ownImpacts` (`SceneStaging.ownImpacts`) says it draws its hits itself, from the shot director's `impact` beat (`ww3d/hitFx.ts`): {@link withOwnImpacts} turns the stage's own impact effects off for it and
 * {@link withOwnImpactsFx} takes the Spectacle's `hit` away (the beat then keeps its own shake and hit-stop, as with the option off), and both leave everything else alone (the numerals, the camera cut, the shake, the recoil,
 * the sounds, the screen flashes, a stone figure's shards, the Overdrive splash and the victory arc are the presenter's or Spectacle's other parts, not effects of a blow).
 *
 * Every other scene keeps the port it had: with `owned` false the same object comes back.
 */

import type { VfxPort } from './BattlePresenterPorts.ts';
import type { FxStagePort } from './fx/c/presenterHooks.ts';

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

/**
 * `fx` (option C's port on the stage) without its `hit`: `fxHit` answers null for a port with none, and the blow keeps the presenter's own shake and hit-stop. The splash, the dissolve, the victory arc and the opening stay
 * (they are not impacts). `enabled` still follows the option, so a port that is off stays off.
 */
export function withOwnImpactsFx(fx: FxStagePort): FxStagePort {
  const out: { -readonly [K in keyof FxStagePort]: FxStagePort[K] } = { enabled: () => fx.enabled() };
  if (fx.actionOpen) out.actionOpen = (o) => fx.actionOpen!(o);
  if (fx.dissolve) out.dissolve = (id) => fx.dissolve!(id);
  if (fx.victory) out.victory = (kind) => fx.victory!(kind);
  if (fx.opening) out.opening = () => fx.opening!();
  return out;
}
