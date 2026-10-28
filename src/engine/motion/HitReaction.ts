/**
 * THE STRUCK FIGURE'S REACTION (motion-fluidity pass, lane L2 "moves", item MF-03; curves audit C-01; both games, shared plumbing: every damaging blow on a party figure, a painted foe or a boss
 * rig). Pure: no `three`, no DOM, no clock of its own (hard rule 1); `PaintedActor.update` feeds it the frame's milliseconds and adds what it answers to the figure's motion group.
 *
 * **What was wrong (measured, r64):** a hit was `shake(0.1 | 0.16, 340)`: a sine of RANDOM phase at 9.9 Hz sideways and 16 Hz up and down, at full size on its FIRST frame (3 to 17 px, median 12.5
 * at 1600 wide; a third of the first moves toward the attacker), fading linearly over 340 ms; a hit-stop froze the figure on that random first offset; a 29-damage hit and a 553-damage hit
 * rattled the same. 74 to 76 percent of all velocity jolts of Chapter I and Chapter IV were this rattle. The real game's clip pushes the body back 18 percent of its height and peaks at 0.4 s.
 *
 * **Three variants, one switch (`?hit=`, `MoveSwitch.ts`; the default is today):**
 * - `today` (V0): this file is not used; `PaintedActor.shake` plays as it always did.
 * - `ramp` (V1): still the rattle, same frequencies and decay, but its envelope starts at ZERO and takes {@link RAMP_MS} (three 60 Hz frames: a ramp of two reaches half size on its first frame, which is no smaller than a step to the eye) to reach full size, and its phase is seeded from the
 *   blow (the same blow rattles the same way in every take) instead of `Math.random()`.
 * - `knock` (V2): a push along the attacker-to-target line (away from the attacker), an eased rise to a peak at {@link PEAK_MS}, then a spring back through zero (a 240 ms period, damping 0.35) with ONE visible counter-swing and a
 *   small second one ({@link ZETA}, {@link SPRING_MS}); its size follows `hitPower` (a light blow budges a figure a little, a heavy one a lot; a crit more; a big body less); a small contact
 *   compression ({@link squashFor}) is up on the first frame, so a hit-stop holds a deliberate frame (the figure at rest, compressed, flashed) and the push begins when the stop lets go.
 *
 * Clocks: `ramp` runs on the FIELD clock (a hit-stop freezes it, like the shake it replaces); `knock` runs on the field clock scaled by the pacing option like every other one-shot move (it
 * lasts as long as the `hurt` flinch beside it). REDUCE MOTION plays neither (the jitter is off under it, D-285; `PaintedActor.hitReact` answers false and the caller plays today's recoil).
 *
 * Game case (AGENTS.md rule 14): BOTH games. The real clips agree in both (a push-back that peaks at 0.33 to 0.4 s and no movement over the floor); every number here is `[ours]`.
 */

const TAU = Math.PI * 2;
const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
const smoothstep = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

/** V1: the envelope takes this long to reach full size (three 60 Hz frames, in milliseconds, so it is the same wait on every display). */
export const RAMP_MS = 50;
/** Today's rattle, `PaintedActor.update`: radians a second sideways, the up-and-down ratio and its share of the amplitude. */
export const RATTLE_RAD_S = 62;
export const RATTLE_Y_RATIO = 1.63;
export const RATTLE_Y_SHARE = 0.42;

/** V2: the push reaches its peak here (ms of paced time; the real clip's is 330 to 400 ms, this is a hit that must read at once). */
export const PEAK_MS = 120;
/** V2: the spring back: damping ratio and damped period (ms). One visible counter-swing (about a third of the push) and a small second one. */
export const ZETA = 0.35;
export const SPRING_MS = 240;
/** V2: the move is over this long after the blow (ms of paced time); the last {@link FADE_MS} ease the tail to exactly zero. */
export const KNOCK_MS = 430;
export const FADE_MS = 90;
/** V2: the contact compression holds its first frame, then eases away over this long. */
export const SQUASH_MS = 160;
/** V2: how far the push rises (the share of the rise that is a smoothstep; the rest is an ease-out, which gives the blow a first frame that is already moving a little). */
const RISE_SMOOTH = 0.9;

/** The seed of a blow: a hash of what identifies it, 0 up to 1 (FNV-1a), so the same blow reads the same in every take. */
export function hitSeed(...parts: ReadonlyArray<string | number | undefined>): number {
  let h = 0x811c9dc5;
  const s = parts.map((p) => String(p ?? '')).join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x100000000;
}

/**
 * How far V2 pushes, world units (146 px at the party's depth, 1600 wide): 0.05 for the lightest blow up to 0.16 at full power (`DemoHit.hitPower`, 1 = 40 percent of the target's HP or 4,000
 * damage), a little more past it, a crit a quarter more, a heavy body (`heft` 0..1) up to 40 percent less (the same thinning `RecoilCurve.recoilDistance` applies).
 */
export function knockAmplitude(power: number, crit: boolean, heft = 0): number {
  const p = Math.min(1.25, Math.max(0, power));
  const base = 0.05 + 0.11 * Math.min(1, p) + 0.03 * Math.max(0, p - 1);
  return base * (crit ? 1.25 : 1) * (1 - 0.4 * clamp01(heft));
}

/** V2: the share of the figure's height the contact squeezes (3 percent for the lightest blow to 7 percent), up on the first frame. */
export function squashFor(power: number, crit: boolean): number {
  return 0.03 + 0.04 * clamp01(power) + (crit ? 0.01 : 0);
}

/** V2's displacement away from the attacker at `ms` after the blow, as a share of the push (1 at the peak), on a spring that rests at 0. */
export function knockShare(ms: number): number {
  if (!(ms > 0)) return 0;
  if (ms >= KNOCK_MS) return 0;
  let v: number;
  if (ms < PEAK_MS) {
    const x = ms / PEAK_MS;
    v = RISE_SMOOTH * smoothstep(x) + (1 - RISE_SMOOTH) * (1 - (1 - x) ** 3);
  } else {
    const t = (ms - PEAK_MS) / 1000;
    const wd = TAU / (SPRING_MS / 1000);
    const sigma = (ZETA / Math.sqrt(1 - ZETA * ZETA)) * wd;
    v = Math.exp(-sigma * t) * (Math.cos(wd * t) + (sigma / wd) * Math.sin(wd * t)); // the free response of a spring let go at its peak: no jump in speed there
  }
  return v * (1 - smoothstep((ms - (KNOCK_MS - FADE_MS)) / FADE_MS));
}

/** V2's contact compression (0..1 of {@link squashFor}) at `ms` after the blow: full on the first frame, easing away. */
export function squashShare(ms: number): number {
  return 1 - smoothstep(ms / SQUASH_MS);
}

/** V1's rattle at `ms` into a shake of `totalMs`: today's sine and linear decay, with the envelope rising from zero over {@link RAMP_MS}. `phase0` is the seed's phase (radians). */
export function rattleAt(ms: number, totalMs: number, amp: number, phase0: number, ramp: boolean, out: { x: number; y: number }): { x: number; y: number } {
  const k = Math.max(0, (totalMs - ms) / Math.max(1, totalMs)) * (ramp ? smoothstep(ms / RAMP_MS) : 1);
  const p = phase0 + (ms / 1000) * RATTLE_RAD_S;
  out.x = Math.sin(p) * amp * k;
  out.y = Math.sin(p * RATTLE_Y_RATIO) * amp * k * RATTLE_Y_SHARE;
  return out;
}

/** What one blow asks of the figure. */
export interface HitSpec {
  style: 'ramp' | 'knock';
  /** `ramp`: the rattle's amplitude (today's 0.1, or 0.16 on a crit). `knock`: the push, world units ({@link knockAmplitude}). */
  amp: number;
  /** `ramp`: the rattle's length (today's 340). Unused by `knock`. */
  ms?: number;
  /** +1 or -1: the way the figure is pushed along the stage (away from the attacker). Unused by `ramp`. */
  dirX: 1 | -1;
  /** The blow's seed, 0..1 ({@link hitSeed}). */
  seed: number;
  /** `knock`: the contact compression, share of height ({@link squashFor}). */
  squash?: number;
}

/** What a frame of the figure's hit reactions adds: an offset in world units (x along the stage, y up) and the compression (scale Y; scale X is its inverse). */
export interface HitOffset {
  x: number;
  y: number;
  sy: number;
}

interface Live {
  spec: HitSpec;
  /** Milliseconds since the blow: field time for a rattle, paced time for a knock. */
  age: number;
}

/** The most reactions that add up at once (a flurry): the oldest finishes where it stands. */
const MAX_LIVE = 4;

export class HitReaction {
  private live: Live[] = [];
  private readonly scratch = { x: 0, y: 0 };

  get active(): boolean {
    return this.live.length > 0;
  }

  /** A blow lands. A reaction still running adds to the new one (a spring is linear: two blows in a string push twice, never snap). */
  start(spec: HitSpec): void {
    if (this.live.length >= MAX_LIVE) this.live.shift();
    this.live.push({ spec, age: 0 });
  }

  /** Stop every reaction (the figure is disposed or a scene resets it). */
  clear(): void {
    this.live.length = 0;
  }

  /**
   * One frame: `fieldMs` of the field clock (zero in a hit-stop) and `pacedMs` of the same clock scaled by the pacing option. Writes the sum into `out` and returns it.
   * A frame allocates nothing (a blow allocates its one record, in {@link start}).
   */
  step(fieldMs: number, pacedMs: number, out: HitOffset): HitOffset {
    out.x = 0;
    out.y = 0;
    out.sy = 1;
    if (this.live.length === 0) return out;
    let squeeze = 0;
    for (const r of this.live) {
      const s = r.spec;
      r.age += s.style === 'ramp' ? fieldMs : pacedMs;
      if (s.style === 'ramp') {
        const total = s.ms ?? 340;
        if (r.age >= total) continue;
        rattleAt(r.age, total, s.amp, s.seed * TAU, true, this.scratch);
        out.x += this.scratch.x;
        out.y += this.scratch.y;
      } else {
        out.x += s.dirX * s.amp * knockShare(r.age);
        squeeze += (s.squash ?? 0) * squashShare(r.age);
      }
    }
    let n = 0; // the finished reactions leave in place: a frame allocates nothing
    for (const r of this.live) if (r.age < (r.spec.style === 'ramp' ? (r.spec.ms ?? 340) : KNOCK_MS)) this.live[n++] = r;
    this.live.length = n;
    out.sy = 1 - Math.min(0.12, squeeze);
    return out;
  }
}
