/**
 * SKILL TRAVEL's drawing (r38-motion, D-354; both games): a spell, a skill or a shot crossing the field, drawn in
 * the spell layer's own batch, after the post chain, from the same atlas tiles the spell effects use. So it shares
 * what they share: the two game skins, the quality tiers (LOW EFFECTS and REDUCE MOTION draw nothing, the phone
 * thins the trail), the REDUCE FLASHES cap on glows, and the playback speed's clock. No texture, no program and no
 * scene object of its own, and nothing is allocated per frame after the first launch.
 *
 * Three shapes (the stage picks by what the presenter asked for, `motion/SkillTravel.ts`):
 * - `orb`: a spell, on a lifted arc, a glow with a white-hot core and a trail of motes (FFX) or four-point
 *   sparkles (FFX-2);
 * - `tracer`: a shot, a thin fast streak on a flat line;
 * - `beam`: a long line that grows from the caster to the target and holds for the impact (Darkness, violet).
 * Each ends in an **impact frame**, about 0.18 s: a hard starburst (eight rays in FFX's gold skin, four in FFX-2's
 * pink one), a ring and a glow, local to the target. There is no full-screen wash.
 *
 * The look is **ours** (the sources say nothing about spell travel in either game); the palette follows each
 * game's effect skin (`effects-shared.ts` `accentOf`: FFX gold `#E3B94A`, FFX-2 pink `#F7B6D9`) and each element's
 * own colours from `effects-elements.ts`. FFX-2's frame is wider and its figures smaller, so its shot is drawn
 * larger (`SKIN_SCALE`), with a brighter core and a short trail, and is scaled to the view as the effects are.
 *
 * Pure: no `three`, no DOM; a test reads the draw list.
 */
import { accentOf } from './effects-shared.ts';
import type { FxDrawList } from './FxDrawList.ts';
import { clamp, lerp } from './fxMath.ts';
import type { FxGame } from './SpellFxRegistry.ts';

export type FlightKind = 'orb' | 'tracer' | 'beam';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A shot's colours: the white-hot core and the element's edge. */
interface Look {
  core: string;
  edge: string;
}

/** By the effect the spell layer resolved for the ability (`SpellFxRegistry`), `dark` for Darkness, `bloom` for the rest. */
const LOOKS: Readonly<Record<string, Look>> = {
  fire: { core: '#FFE7A0', edge: '#F2712E' },
  ice: { core: '#EAFBFF', edge: '#6EC8F0' },
  thunder: { core: '#FFFBE0', edge: '#F2D24A' },
  water: { core: '#DDF4FF', edge: '#3A8FD0' },
  holy: { core: '#FFFFFF', edge: '#FFF2C0' },
  cure: { core: '#E8FFF2', edge: '#7EE8B0' },
  hit: { core: '#FFFFFF', edge: '#FFE6B0' },
  dark: { core: '#F4E6FF', edge: '#A66BFF' },
  bloom: { core: '#F4F7FF', edge: '#B8C8FF' },
};

/** How big each game draws its shot, against the FFX frame. FFX-2's is wider and its figures smaller (our estimate, read off the frames). */
export const SKIN_SCALE: Readonly<Record<FxGame, number>> = { ffx: 1, ffx2: 1.45, ff7: 1 };

/** The impact frame, effect seconds. */
export const BURST_S = 0.18;

/**
 * A shot lands this long before its spell's first mark, ms, so the impact frame and the strike are one moment, and
 * is never shorter than this much for its kind (a mark of 0.1 s, the slash of Darkness or a gun's hit, stretches the
 * wait by the difference, under 0.1 s; a crossing under 0.14 s does not read as one).
 */
export const FLIGHT_LEAD_MS = 60;
export const FLIGHT_MIN_MS: Readonly<Record<FlightKind, number>> = { orb: 140, tracer: 120, beam: 180 };

/** What the debug snapshot reports (`snapshotState().screenState.spellFx.flights`). */
export interface FlightStats {
  launched: number;
  landed: number;
  live: number;
  /** `performance.now()` at the last launch and the last landing, ms; 0 before the first. */
  lastLaunchAt: number;
  lastLandAt: number;
}

interface Flight {
  readonly from: string;
  readonly to: string;
  readonly kind: FlightKind;
  readonly look: Look;
  readonly total: number;
  readonly done: () => void;
  age: number;
  /** Seconds since the landing; negative while it is still in the air. */
  burst: number;
  a: { x: number; y: number };
  b: { x: number; y: number };
  size: number;
  rot: number;
}

const ease = (kind: FlightKind, t: number): number => (kind === 'orb' ? t * t * (3 - 2 * t) * 0.35 + t * 0.65 : t);

export class FlightLayer {
  private flights: Flight[] = [];
  private launched = 0;
  private landed = 0;
  private lastLaunchAt = 0;
  private lastLandAt = 0;

  constructor(
    private readonly game: FxGame,
    private readonly rectOf: (id: string) => Rect | null,
    private readonly now: () => number = () => (typeof performance === 'undefined' ? 0 : performance.now()),
  ) {}

  get active(): boolean {
    return this.flights.length > 0;
  }

  stats(): FlightStats {
    return { launched: this.launched, landed: this.landed, live: this.flights.length, lastLaunchAt: this.lastLaunchAt, lastLandAt: this.lastLandAt };
  }

  /** Send one shot; the promise settles when it has landed (the impact frame has begun), or when the layer is cleared. */
  launch(from: string, to: string, look: string, kind: FlightKind, ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const f: Flight = {
        from,
        to,
        kind,
        look: LOOKS[look] ?? LOOKS['bloom']!,
        total: Math.max(0.001, ms / 1000),
        done: resolve,
        age: 0,
        burst: -1,
        a: { x: 0, y: 0 },
        b: { x: 0, y: 0 },
        size: 0,
        rot: this.launched * 1.3,
      };
      this.place(f);
      this.flights.push(f);
      this.launched++;
      this.lastLaunchAt = this.now();
    });
  }

  /** The two ends, from the live rectangles (so a camera cut mid-flight carries the shot with it), and the shot's size. */
  private place(f: Flight): void {
    const ra = this.rectOf(f.from);
    const rb = this.rectOf(f.to);
    if (!ra || !rb) return; // a figure that left keeps the last known ends
    const toward = Math.sign(rb.x + rb.w / 2 - (ra.x + ra.w / 2)) || 1;
    f.a.x = ra.x + ra.w * (0.5 + 0.2 * toward);
    f.a.y = ra.y + ra.h * 0.42;
    f.b.x = rb.x + rb.w / 2;
    f.b.y = rb.y + rb.h * 0.45;
    f.size = clamp(((ra.h + rb.h) / 2) * 0.16, 30, 120) * SKIN_SCALE[this.game];
  }

  /** Advance every shot by `step` effect seconds (the playback speed already applied). */
  advance(step: number): void {
    for (const f of this.flights) {
      this.place(f);
      f.age += step;
      if (f.burst < 0 && f.age >= f.total) {
        f.burst = 0;
        this.landed++;
        this.lastLandAt = this.now();
        f.done();
      } else if (f.burst >= 0) f.burst += step;
    }
    if (this.flights.some((f) => f.burst > BURST_S)) this.flights = this.flights.filter((f) => f.burst <= BURST_S);
  }

  /** Let go of everything now (the layer is cleared or disposed): every pending landing settles so nothing waits for ever. */
  clear(): void {
    for (const f of this.flights) if (f.burst < 0) f.done();
    this.flights = [];
  }

  /** Where the head is at path parameter `u` (0 caster, 1 target), with the orb's arc. */
  private at(f: Flight, u: number): { x: number; y: number } {
    const lift = f.kind === 'orb' ? clamp(Math.hypot(f.b.x - f.a.x, f.b.y - f.a.y) * 0.2, 18, 170) : 0;
    return { x: lerp(f.a.x, f.b.x, u), y: lerp(f.a.y, f.b.y, u) - Math.sin(Math.PI * u) * lift };
  }

  /** Add every live shot to this frame's list. `out.dens` thins the trail on a phone. */
  draw(out: FxDrawList): void {
    const accent = accentOf(out);
    const ffx2 = out.game === 'ffx2';
    for (const f of this.flights) {
      out.begin();
      out.add = true;
      const H = f.size;
      if (f.burst < 0) this.drawFlight(out, f, H, accent, ffx2);
      else this.drawImpact(out, f, H, accent, ffx2);
      out.add = false;
    }
  }

  private drawFlight(out: FxDrawList, f: Flight, H: number, accent: string, ffx2: boolean): void {
    const t = clamp(f.age / f.total);
    const e = ease(f.kind, t);
    const p = this.at(f, e);
    const { core, edge } = f.look;
    const fadeIn = clamp(t / 0.08);
    // The streak: what makes a crossing read as a path and not as a dot. A beam grows from the caster; the others trail.
    if (f.kind === 'beam') {
      const a = this.at(f, 0);
      out.bar(a.x, a.y, p.x, p.y, H * 0.5, edge, 0.38 * fadeIn);
      out.bar(a.x, a.y, p.x, p.y, H * 0.2, core, 0.95 * fadeIn);
      out.sprite('glow', edge, a.x, a.y, H * 2.2, 0.55 * (1 - t));
    } else {
      const tail = this.at(f, Math.max(0, e - (f.kind === 'tracer' ? 0.3 : 0.2)));
      out.bar(tail.x, tail.y, p.x, p.y, H * (f.kind === 'tracer' ? 0.22 : 0.42), edge, 0.4 * fadeIn);
      out.bar(tail.x, tail.y, p.x, p.y, H * (f.kind === 'tracer' ? 0.1 : 0.17), core, 0.9 * fadeIn);
    }
    if (f.kind !== 'tracer') {
      // The short trail: motes (FFX) or four-point sparkles (FFX-2), shrinking and fading behind the head.
      const n = out.n(ffx2 ? 6 : 8);
      for (let i = 0; i < n; i++) {
        const lag = (i + 1) / (n + 1);
        const q = f.kind === 'beam' ? this.at(f, e * (1 - lag)) : this.at(f, Math.max(0, e - lag * 0.26));
        out.sprite(out.bit, i % 2 ? core : edge, q.x, q.y, H * (ffx2 ? 0.7 : 0.5) * (1 - lag * 0.7), (1 - lag) ** 1.3 * 0.9 * fadeIn, f.rot + i);
      }
    }
    // The head: a big soft glow, a white-hot core, and the game's skin (a gold ring; a four-point sparkle).
    out.sprite('glow', edge, p.x, p.y, H * 2.8, 0.6 * fadeIn);
    out.sprite('mote', core, p.x, p.y, H * (f.kind === 'tracer' ? 0.7 : 1.15), fadeIn);
    if (ffx2) out.sprite('spark4', core, p.x, p.y, H * (f.kind === 'tracer' ? 1.3 : 2.1), 0.95 * fadeIn, f.rot + t * 5);
    else out.ring(p.x, p.y, H * 0.62, Math.max(1.5, H * 0.07), accent, 0.55 * fadeIn, 1);
  }

  private drawImpact(out: FxDrawList, f: Flight, H: number, accent: string, ffx2: boolean): void {
    const b = clamp(f.burst / BURST_S);
    const { core, edge } = f.look;
    const q = (1 - b) ** 0.7;
    const cap = (a: number): number => out.actorCap(a); // REDUCE FLASHES: the glow over a figure is capped
    const { x, y } = f.b;
    if (f.kind === 'beam') {
      const a = this.at(f, 0);
      out.bar(a.x, a.y, x, y, H * 0.5 * (1 - b), edge, 0.38 * (1 - b));
      out.bar(a.x, a.y, x, y, H * 0.2 * (1 - b), core, 0.9 * (1 - b));
    }
    out.sprite('glow', edge, x, y, H * (2.2 + 3 * Math.sqrt(b)), cap(0.85 * (1 - b)));
    // The starburst: a hard star that opens and fades, eight rays in FFX (two stars a quarter turn apart), four in FFX-2.
    const star = H * (ffx2 ? 3.6 : 2.6) * (0.4 + 0.9 * Math.sqrt(b));
    out.sprite('spark4', core, x, y, star, cap(q), b * 0.8);
    if (!ffx2) out.sprite('spark4', core, x, y, star * 0.78, cap(q), Math.PI / 4 + b * 0.8);
    out.ring(x, y, H * (0.7 + 3.3 * b), Math.max(2, H * 0.12 * (1 - b)), accent, cap(0.8 * (1 - b)), 1);
    // A few bits thrown off (the game's own particle: a mote, or a four-point sparkle).
    const bits = out.n(ffx2 ? 5 : 6);
    for (let i = 0; i < bits; i++) {
      const ang = f.rot + (i / bits) * Math.PI * 2;
      const d = H * (0.6 + 2.1 * b);
      out.sprite(out.bit, i % 2 ? accent : core, x + Math.cos(ang) * d, y + Math.sin(ang) * d, H * (ffx2 ? 0.55 : 0.3) * (1 - b * 0.6), 1 - b, ang);
    }
  }
}
