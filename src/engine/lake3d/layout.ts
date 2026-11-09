/**
 * **The lake's numbers** (the hidden Wendigo chapter's 3D stage; FFX only): the camera rigs, the flights the director flies, the bench spots, the arena's size and the epilogue's clock. Pure data and small helpers, no `three`,
 * no DOM, so `tests/unit/lake3d/layout.test.ts` pins them without a renderer. The slots of the fight are `../../scenes/wendigo-lake.ts`'s (the chapter's seam: Chapter VII's picked layout B, kept); this file is what the 3D stage adds.
 *
 * World: metres, +x to the right of the frame, -z away from the camera (the party near z 0 to 2, Wendigo 6 m behind them). The lake is a disc of ice centred on the middle of the fight; the aurora hangs in the north (-z), behind Wendigo.
 * Everything here is staging (rule 6: no game number) except the heights, which are the size table's.
 */

export type V3 = readonly [number, number, number];

/** A camera pose: where it stands, what it looks at, the vertical field of view in degrees. */
export interface RigData {
  readonly position: V3;
  readonly lookAt: V3;
  readonly fov: number;
  readonly sway?: number;
}

/** The four bench spots, parked off frame-left (Chapter VII's, kept: a switched-in member walks from here). */
export const BENCH_SLOTS: readonly V3[] = [
  [-11.6, 0, 2.6],
  [-12.5, 0, 1.0],
  [-13.4, 0, -0.6],
  [-14.3, 0, -2.2],
];

/**
 * The scene's rigs. The framing is Chapter VII's (the same slots, so the HUD's safe areas hold), a little lower so the mirror ice fills the foot of the frame; `party`, `enemy` and `victory` are the close shots the presenter's
 * own grammar asks for; `ice-break` is the epilogue's high wide shot (the story's `camera('ice-break')` step names it: the stage listens for it); `fly` is the director's own seat (it is rewritten every frame of a flight).
 */
export const RIGS: Readonly<Record<string, RigData>> = {
  intro: { position: [-3.6, 2.2, 13.2], lookAt: [0.9, 2.0, -3.2], fov: 30, sway: 1.4 },
  idle: { position: [0.0, 2.05, 10.6], lookAt: [0.75, 1.85, -1.8], fov: 32 },
  action: { position: [0.3, 1.9, 9.7], lookAt: [1.25, 1.8, -1.9], fov: 32, sway: 0.7 },
  party: { position: [0.6, 1.7, 7.7], lookAt: [-0.3, 1.3, 1.1], fov: 32, sway: 0.7 },
  enemy: { position: [1.4, 1.9, 6.2], lookAt: [2.4, 1.9, -4.2], fov: 32, sway: 0.7 },
  victory: { position: [-1.6, 2.6, 12.0], lookAt: [0.4, 1.1, -1.6], fov: 32, sway: 1.2 },
  'ice-break': { position: [-0.6, 13.5, 14.5], lookAt: [0.6, 0.0, -2.0], fov: 38, sway: 0.4 },
  /** The opening flight's first key: the story's pre scene parks the camera here, fades in, and the flight starts from the same place (`OPENING`). */
  opening: { position: [-26, 19, 30], lookAt: [3, 9, -30], fov: 46, sway: 0 },
  fly: { position: [0, 2, 10], lookAt: [0, 1.8, -2], fov: 32, sway: 0 },
};

/** The rig name of the epilogue's high wide shot (a rig for the debug views; the win flight ends above the lake much as it stands). */
export const ICE_BREAK_RIG = 'ice-break';
/** The director's own seat. */
export const FLY_RIG = 'fly';

/** One key of a flight: seconds from its start, the eye, the aim and (optionally) the field of view and a dutch roll in degrees. */
export interface FlightKey {
  readonly t: number;
  readonly pos: V3;
  readonly look: V3;
  readonly fov?: number;
  readonly roll?: number;
}

/** A flight: its keys (sorted by `t`, at least two), and a name for the debug handle. */
export interface Flight {
  readonly name: string;
  readonly keys: readonly FlightKey[];
}

/**
 * **The opening** (the fly-in): out of the aurora, down over the shore, skimming the ice at knee height past the party, rising to the idle frame with Wendigo standing in the aurora. 6.6 s; it ends on `RIGS.idle` to the
 * digit, so the presenter's own rig takes over with no jump.
 */
export const OPENING: Flight = {
  name: 'opening',
  keys: [
    { t: 0.0, pos: [-26, 19, 30], look: [3, 9, -30], fov: 46 },
    { t: 1.7, pos: [-17, 9.5, 22], look: [2, 4.5, -14], fov: 42 },
    { t: 3.3, pos: [-7.5, 0.85, 14.5], look: [0.5, 1.3, -3], fov: 36, roll: -3 },
    { t: 4.9, pos: [-2.2, 0.95, 12.6], look: [1.6, 2.2, -4.5], fov: 33, roll: 1.5 },
    { t: 6.6, pos: [0.0, 2.05, 10.6], look: [0.75, 1.85, -1.8], fov: 32, roll: 0 },
  ],
};

/**
 * **The win and the ice break, one flight** (6 s, the epilogue's whole length): from wherever the camera stands when the last foe has fallen, a slow orbit left and up round the party as they take their victory poses and the
 * ice begins to crack under them, then up and back to a high wide shot over the layers falling, ending above the lake as the screen goes white.
 */
export function winFlight(from: V3): Flight {
  return {
    name: 'win',
    keys: [
      { t: 0.0, pos: from, look: [0.4, 1.2, -1.2], fov: 32 },
      { t: 1.7, pos: [-6.8, 2.3, 9.2], look: [0.2, 1.3, 0.2], fov: 30, roll: 2 },
      { t: 3.3, pos: [-8.2, 4.6, 5.4], look: [0.6, 1.2, -0.8], fov: 33, roll: 0 },
      { t: 4.8, pos: [-2.4, 11.5, 13.5], look: [0.6, 0.0, -2.0], fov: 38, roll: -1 },
      { t: 6.0, pos: [-1.2, 17.5, 17.0], look: [0.6, -1.0, -2.0], fov: 42, roll: 0 },
    ],
  };
}

/** The shot a Double Punch gets: a quick low swing round to the target's side as the haymaker comes over. 1.5 s, the first 0.7 awaited. */
export function haymakerFlight(from: V3, aim: V3): Flight {
  const side: V3 = [aim[0] - 4.2, 1.1, aim[2] + 3.4];
  return {
    name: 'haymaker',
    keys: [
      { t: 0.0, pos: from, look: [aim[0], 1.7, aim[2]], fov: 32 },
      { t: 0.7, pos: [from[0] - 1.8, 1.2, from[2] - 1.2], look: [aim[0], 1.6, aim[2]], fov: 28, roll: -2.5 },
      { t: 1.5, pos: side, look: [aim[0], 1.5, aim[2]], fov: 30, roll: 0 },
    ],
  };
}

/** The shot the arms going up get: a slow push in and tilt up on the brute, 2.2 s. */
export function raiseFlight(from: V3, wendigo: V3): Flight {
  return {
    name: 'raise',
    keys: [
      { t: 0.0, pos: from, look: [wendigo[0], 1.9, wendigo[2]], fov: 32 },
      { t: 1.2, pos: [wendigo[0] - 2.6, 1.0, wendigo[2] + 6.4], look: [wendigo[0], 2.5, wendigo[2]], fov: 30, roll: 1 },
      { t: 2.2, pos: [wendigo[0] - 1.4, 0.9, wendigo[2] + 5.2], look: [wendigo[0], 3.0, wendigo[2]], fov: 28, roll: 0 },
    ],
  };
}

/** The height the Overdrive flight is drawn for, metres: the party's (Tidus's 1.75). A taller caster (an aeon) is orbited from further out and looked at higher up, in step with its height. */
export const OVERDRIVE_FLIGHT_HEIGHT = 1.75;

/** The shot an Overdrive gets: round the caster in a half circle and up, 2.4 s, the first 0.9 awaited. `height` is the caster's (an aeon of 3.4 m is orbited at about twice the distance, so its wings stay in frame). */
export function overdriveFlight(from: V3, caster: V3, height = OVERDRIVE_FLIGHT_HEIGHT): Flight {
  const s = Math.max(1, height / OVERDRIVE_FLIGHT_HEIGHT);
  return {
    name: 'overdrive',
    keys: [
      { t: 0.0, pos: from, look: [caster[0], 1.4 * s, caster[2]], fov: 32 },
      { t: 0.9, pos: [caster[0] + 2.6 * s, 1.2 * s, caster[2] + 3.6 * s], look: [caster[0], 1.5 * s, caster[2]], fov: 28, roll: -2 },
      { t: 2.4, pos: [caster[0] - 3.8 * s, 3.2 * s, caster[2] + 5.8 * s], look: [caster[0] + 1.5, 1.6 * s, caster[2] - 3], fov: 34, roll: 0 },
    ],
  };
}

/** The lowest a flight's eye may go, metres: the spline between a high key and a low one undershoots, and a camera at the ice's surface sees the mirror edge-on. */
export const MIN_EYE = 0.5;

/** Linear mix. */
const mix = (a: number, b: number, k: number): number => a + (b - a) * k;

/** Catmull-Rom through four numbers at `k` in [0, 1] between the middle two. */
function spline(p0: number, p1: number, p2: number, p3: number, k: number): number {
  const k2 = k * k;
  const k3 = k2 * k;
  return 0.5 * (2 * p1 + (-p0 + p2) * k + (2 * p0 - 5 * p1 + 4 * p2 - p3) * k2 + (-p0 + 3 * p1 - 3 * p2 + p3) * k3);
}

/** The pose of a flight at `t` seconds (clamped to its ends): a Catmull-Rom spline through the keys' eyes and aims, eased within each leg (a smoothstep, so a key is passed gently), the field of view and roll mixed. */
export function sampleFlight(flight: Flight, t: number): { pos: V3; look: V3; fov: number; roll: number } {
  const keys = flight.keys;
  const last = keys.length - 1;
  const clamped = Math.min(Math.max(t, keys[0]!.t), keys[last]!.t);
  let i = 0;
  while (i < last - 1 && clamped > keys[i + 1]!.t) i++;
  const a = keys[i]!;
  const b = keys[i + 1]!;
  const span = Math.max(1e-6, b.t - a.t);
  const raw = Math.min(1, Math.max(0, (clamped - a.t) / span));
  const k = raw * raw * (3 - 2 * raw);
  const p0 = keys[Math.max(0, i - 1)]!;
  const p3 = keys[Math.min(last, i + 2)]!;
  const trio = (get: (key: FlightKey) => V3): V3 => [spline(get(p0)[0], get(a)[0], get(b)[0], get(p3)[0], k), spline(get(p0)[1], get(a)[1], get(b)[1], get(p3)[1], k), spline(get(p0)[2], get(a)[2], get(b)[2], get(p3)[2], k)];
  const fovOf = (key: FlightKey): number => key.fov ?? 32;
  const eye = trio((key) => key.pos);
  return { pos: [eye[0], Math.max(MIN_EYE, eye[1]), eye[2]], look: trio((key) => key.look), fov: mix(fovOf(a), fovOf(b), k), roll: mix(a.roll ?? 0, b.roll ?? 0, k) };
}

/** The length of a flight in seconds. */
export const flightLength = (flight: Flight): number => flight.keys[flight.keys.length - 1]!.t - flight.keys[0]!.t;

/** The arena: the ice disc's radius, the shore ring, how far the mountains stand, the snow's volume and the aurora's place. */
export const ARENA = {
  iceRadius: 46,
  shoreInner: 40,
  shoreOuter: 78,
  mountainRing: 150,
  /** Where the aurora hangs: the middle of its band (north, behind the enemies) and its width on the sky, degrees. */
  auroraAzimuthDeg: 0,
  auroraSpanDeg: 150,
  snow: { count: 5200, box: [60, 22, 60] as V3, centre: [0, 0, -4] as V3 },
} as const;

/** The epilogue's clock (seconds from the moment the stage hears `camera('ice-break')`): the magic effect swells, the twelve ice layers fall away in turn, the camera shakes twice, then the party's own ice goes. */
export const EPILOGUE = {
  layers: 12,
  pulseEnd: 1.3,
  layerStart: 1.1,
  layerGap: 0.27,
  layerFall: 1.1,
  shakes: [1.5, 3.7] as readonly number[],
  lastFall: 4.6,
  /** The screen goes white from here to the end (the field event's fade to white). */
  whiteFrom: 4.9,
  length: 6.0,
} as const;

/** The seconds at which each of the twelve ice layers begins to fall (the outermost first). */
export function layerStarts(): number[] {
  return Array.from({ length: EPILOGUE.layers }, (_, i) => EPILOGUE.layerStart + i * EPILOGUE.layerGap);
}
