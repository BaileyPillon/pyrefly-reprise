/**
 * THE WIRING OF THE FX LANE'S BIG MOMENTS ONTO THE OTHER LANES (integration of the lanes "core", "feel" and "fx"; both games; presentation only; pure: no `three`, no DOM).
 *
 * The fx lane's big moments call `spellfx/FxMotionAdapter.fxBeat`, which calls whatever is registered here and does NOTHING while the registry is empty (the unit tests, every build that
 * never calls {@link installFxWiring}). What is registered, and what deliberately is not:
 *
 * - `anticipate` (an Overdrive opens; FFX Chapter I only, since FFX-2 has no Overdrive): the actor GATHERS while the aura builds, with the lane "core" LEAP (`PaintedActor.leap`): a slow crouch
 *   over most of the build, then a small spring and a landing squash as the build ends. It plays only with the new curves on (`?curves=new`, `?pack=demo`), so the curves switch is also the
 *   Overdrive's wind-up switch, and REDUCE MOTION does not stop it (Bailey's pick: it turns off shake, punch, freeze and rumble only; the adapter passes `calm` and still calls the movement hooks).
 * - `smear`: NOT registered. The Overdrive's key painting is cut in at the action's start (`KeySlots.showOdOnOpen`, a hard cut at rest) before this beat, and the lane "core" smear needs a
 *   moving figure (`SmearPlan.MIN_SPEED`): at the beat there is no pose change left to cover. A smear needs a swap to ride; there is none (INTEGRATION.md, "not done").
 * - `hitStop`, `punch`, `rumble`: NOT registered. The lane "feel" already gives an Overdrive's finisher and a boss's headline blow a short stop, a camera punch and a pulse from its own rules; a
 *   second pair would stack two stops on one blow. The beat CLAIMS the blow instead (`feel/BlowClaim.ts`) and the feel rules treat it as the finisher of a big action, with every gate it
 *   already had: REDUCE MOTION, playback speed, an open FFX-2 command menu, the three per-piece switches. A boss's charge pulse is `FeelHooks.rumbleCharge`.
 */
import { setFxMotionHooks, type FxBeatActor } from '../spellfx/FxMotionAdapter.ts';
import { curvesOn } from './CurvesSwitch.ts';

/** The gather's shape: a crouch over 80 percent of the build (4 percent of the height), a small spring (5 percent stretch, 5 percent of the figure's height up) and a 2.5 percent landing squash. `[ours]`. */
export const GATHER = { anticipation: 0.8, crouch: 0.04, stretch: 0.05, land: 0.025, landMs: 220, apex: 0.5, rise: 0.05 } as const;

/** The actor gathers for `ms` of paced time (the aura's own clock). A no-op without the curves or an actor that can leap. */
export function gather(actor: FxBeatActor | undefined, ms: number): void {
  if (!curvesOn() || !actor?.leap || !(ms > 0)) return;
  let height = 1.82;
  try {
    if (actor.headPoint && actor.position) height = Math.max(0.5, actor.headPoint().y - actor.position.y);
  } catch {
    /* a stage double with no head: a party member's height */
  }
  const { rise, ...shape } = GATHER;
  void actor.leap(height * rise, ms, shape).catch(() => undefined);
}

/** Register the hooks above (once, at boot). */
export function installFxWiring(): void {
  setFxMotionHooks({
    anticipate: (_id, ms, actor) => gather(actor, ms),
  });
}
