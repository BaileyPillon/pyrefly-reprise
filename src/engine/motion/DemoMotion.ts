/**
 * THE DEMO MOTION SWITCH (conference demo, Bailey 2026-10-19 ~21:50 EDT: "I need a way to quickly improve the graphical fidelity of the game as well as the motion,
 * animation, visual style. I demo my game in a week at a huge gaming conference."; driver decisions 150 and 153a; BOTH games, shared plumbing).
 *
 * **Release 60 (the conference demo build): the four upgrades are ON by default, in a page** (Bailey, 2026-10-20 ~11:00 EDT, "Yes, both (Recommended)"; the driver's brief for release 60). `?motion=off`
 * (or `?motion=classic`, today's lunge and clock) turns them off; `?motion=demo` and `?motion=smooth` leave them on. Where there is no page (`globalThis.location` is undefined: the unit tests, a
 * headless engine) the default is OFF, so every test that pins today's numbers keeps pinning them and the three goldens never see this file. Every hook below asks {@link demoMotionOn} first and
 * falls straight through to the old code when it answers false. It is a separate reading of the same `?motion=` parameter that `PoseSwap.ts` owns (`smooth`, the default, and `classic`):
 * `PoseSwap.motionMode()` ignores a value it does not know, so `?motion=demo` and `?motion=off` play the default `smooth` lunge and clock and THEN (or not) these four.
 *
 * 1. **Pose blends** (`DemoBlend.ts`; `PaintedActor.beginBlend`, `KoFall.ts`): the blend of two pose paintings is chosen from how well the two outlines overlap. A pair that overlaps
 *    (idle and ready) keeps a plain, short cross-fade; a pair that barely does (attack and follow, Wakka's hurt) crosses with the OUTGOING painting going out faster than the incoming one
 *    comes in, so the two never share more than 0.382 of the screen (the double image) and the fade-weighted head moves the same distance every frame. 110 to 160 ms; a KO or an
 *    Overdrive swap a little longer.
 * 2. **Rig variant cross-fade** (`rig/RigFade.ts`, `RigFigure.ts`; format v2.1 `RigKey.fadeMs`): a rig key that swaps a part to another image, or shows or hides a part, cross-fades over
 *    `fadeMs` (default 110 ms) instead of flipping at 0.5 of the move.
 * 3. **Breathing idle** (`DemoIdle.ts`; `PaintedActor`'s constructor, `fx/mix/living.ts`): a 3 to 4 s breath of 0.6 to 1.2 percent about the feet, a slight sway, and a phase of its own for
 *    every figure that is dealt out by the golden ratio, so a party never breathes in step (the page's random phase could put two figures together). A rig that has its own idle keeps it.
 * 4. **Hit feel** (`DemoHit.ts`, `DemoHitBeat.ts`; `fx/c/SpectacleRules.planHit`): a hit-stop that grows with the blow (weak 0 to 30 ms, strong 50 to 80, a crit, an overkill or a
 *    finisher 100 to 150; a multi-hit action stops on its first and last blow only), a camera shake that grows with it (the camera, never the HUD), and a 0.08 s white flash on the
 *    struck figure. The stop holds the PRESENTATION's clock (`HitStop`): the engine, the RNG, the ATB pump and the turn order never see it.
 *
 * Pure: no `three`, no DOM (hard rule 1). Every duration and size here is `[ours]`: the sources are silent on all four. Game case: both games, one set of numbers (the brief's ranges); the FFX-2 and FFX skins of the spectacle's colours and
 * tempo (`SpectacleRules.SPECTACLE_TUNING`) are untouched.
 */

let demo: boolean | null = null;

/**
 * The switch from an address's search string (pure). `undefined` = there is no page: off. In a page: on, except for `?motion=off` and `?motion=classic` (today's lunge and clock, kept
 * for comparison), so `?motion=demo` and `?motion=smooth` (the default spelled out) are on.
 */
export function demoMotionFromSearch(search: string | undefined): boolean {
  if (search === undefined) return false;
  let value = '';
  try {
    value = (new URLSearchParams(search).get('motion') ?? '').trim().toLowerCase();
  } catch {
    /* an unreadable address is no address: the default */
  }
  return value !== 'off' && value !== 'classic';
}

/** True when the demo motion is on for this page: the default in a page; `?motion=off` / `classic` turn it off. Read once, like the other URL switches' first look. */
export function demoMotionOn(): boolean {
  if (demo === null) demo = demoMotionFromSearch(globalThis.location === undefined ? undefined : (globalThis.location.search ?? ''));
  return demo;
}

/** Tests and `window.__pyrefly.demoMotion(...)`: force the switch (`null` reads the address again). */
export function setDemoMotion(value: boolean | null): void {
  demo = value;
}

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** A stable 0 to 1 from a name (FNV-1a), so two figures of one name draw the same numbers and two names almost never do. */
export function hashUnit(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}
