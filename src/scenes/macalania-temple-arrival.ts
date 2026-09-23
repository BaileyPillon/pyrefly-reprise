import {
  CanvasTexture,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { Easing, lerp } from '../engine/Tween.ts';

// ---------------------------------------------------------------------------
// Anima's arrival — the chapter's money shot (FFX only)
// ---------------------------------------------------------------------------
//
// Research §9.4: "She arrives from below, still bound, and the two Guardians
// die when she does. Stage the summon as a single continuous camera move, and
// do not cut away from it."
//
// **What is built, and on whose word.** The options round
// (`docs/concepts/chapters/macalania/arrival/`, sheet.png) is NOT picked by
// Bailey. This is the driver's recommendation: option **A** (from below the
// ice: chains first, then the horns, then the eye; the camera drops to floor
// height and rises with her, no cut) with option **B's name tag** (Seymour
// steps back out of the light and his tag reads "Cannot be targeted", decision
// C-2). It is recorded as INFERRED on its own tile in docs/target/targets.json,
// never as approved. Changing the pick is a timeline edit in this file.
//
// The timeline is a pure function of elapsed milliseconds ({@link
// animaArrivalAt}) so it is deterministic, testable without a DOM, and can be
// driven by either the preview (`macalania-temple-painted.ts`) or a real
// battle (`macalania-temple-arrival-battle.ts`, which `PaintedStage.arrive`
// plays when the engine reveals her). The cue it answers is the story
// script's mid-battle `mac-anima-summon` (src/story/scripts/
// seymour-anima-macalania.ts): Yuna's "An aeon. He is summoning an aeon." is
// said *before* the player sees her, so the rise starts after that line.

/** Beat times in ms from the start of the arrival. One continuous move: no rig is ever snapped. */
export const ANIMA_ARRIVAL_MS = {
  /** A1: camera drops to floor height behind the party (a move, not a cut). */
  dropStart: 0,
  dropEnd: 950,
  /** A2: violet light cracks the ice from underneath before anything is visible. */
  crackStart: 250,
  crackPeak: 1300,
  /** A2: both Guardians die in the same second (§5.2, the summon kills them). */
  guardiansDie: 450,
  guardiansGoneMs: 1400,
  /** A3: chains come up through the floor first and go taut. */
  chainsStart: 700,
  chainsEnd: 1600,
  /** A3-A4: then she rises through them; the camera rises with her, same duration. */
  riseStart: 1300,
  riseEnd: 4300,
  /** B (folded into A's tail): Seymour steps back out of the light as she comes up; then his tag dies. */
  stepBackStart: 2300,
  stepBackEnd: 3600,
  tagOn: 4300,
  /** A5: control returns with the camera still settling back to `idle`. */
  settleStart: 4700,
  settleEnd: 6300,
  controlReturns: 5100,
  /** Everything has landed. */
  end: 6300,
} as const;

/** The camera moves, in order. Each starts where the last one is, so the shot never cuts. */
export const ANIMA_ARRIVAL_CAMERA: ReadonlyArray<{ atMs: number; rig: string; ms: number; easing: 'cubicInOut' | 'sineInOut' }> = [
  { atMs: ANIMA_ARRIVAL_MS.dropStart, rig: 'anima-low', ms: ANIMA_ARRIVAL_MS.dropEnd - ANIMA_ARRIVAL_MS.dropStart, easing: 'cubicInOut' },
  { atMs: ANIMA_ARRIVAL_MS.riseStart, rig: 'anima', ms: ANIMA_ARRIVAL_MS.riseEnd - ANIMA_ARRIVAL_MS.riseStart, easing: 'sineInOut' },
  { atMs: ANIMA_ARRIVAL_MS.settleStart, rig: 'idle', ms: ANIMA_ARRIVAL_MS.settleEnd - ANIMA_ARRIVAL_MS.settleStart, easing: 'cubicInOut' },
];

/** Everything the arrival sets at one instant. All fractions are 0..1. */
export interface AnimaArrivalState {
  /** How far she has risen: 0 = wholly under the ice, 1 = at her hover. */
  rise: number;
  /** Chain strands' grown length. */
  chains: number;
  /** The violet crack light under her slot (rises, holds, fades as she clears). */
  crack: number;
  /** Guardians' dissolve. */
  guardiansGone: number;
  /** Seymour's walk from his slot to `SEYMOUR_STEP_BACK`. */
  stepBack: number;
  /** Concept B's tag: Seymour's reticle reads "Cannot be targeted", Anima's name lights. */
  tagOn: boolean;
  /** The floor occluder must hide what is still under the ice. */
  occluding: boolean;
  /** Control has been handed back (the camera may still be settling). */
  control: boolean;
  done: boolean;
}

const span = (ms: number, a: number, b: number): number => (b <= a ? (ms >= b ? 1 : 0) : Math.min(1, Math.max(0, (ms - a) / (b - a))));

/** The arrival at `ms` milliseconds in. Pure. */
export function animaArrivalAt(ms: number): AnimaArrivalState {
  const T = ANIMA_ARRIVAL_MS;
  const crackIn = Easing.quadOut(span(ms, T.crackStart, T.crackPeak));
  const crackOut = 1 - Easing.quadIn(span(ms, T.riseEnd - 600, T.riseEnd + 900));
  return {
    rise: Easing.sineInOut(span(ms, T.riseStart, T.riseEnd)),
    chains: Easing.cubicOut(span(ms, T.chainsStart, T.chainsEnd)),
    crack: crackIn * crackOut,
    guardiansGone: Easing.quadInOut(span(ms, T.guardiansDie, T.guardiansDie + T.guardiansGoneMs)),
    stepBack: Easing.cubicInOut(span(ms, T.stepBackStart, T.stepBackEnd)),
    tagOn: ms >= T.tagOn,
    occluding: ms < T.riseEnd,
    control: ms >= T.controlReturns,
    done: ms >= T.end,
  };
}

/**
 * Her world y for a rise fraction: from wholly under the ice (her head a
 * little below the floor) to standing on her own baseline. Her hover is the
 * actor's own (`PaintedActor` `hover`), added on top, so this ends at 0.
 */
export function animaRiseY(rise: number, height: number, hover: number): number {
  return lerp(-(height + hover + 0.25), 0, rise);
}

/**
 * A depth-only floor. Everything drawn after it (a higher `renderOrder`) is
 * hidden where it is *under* the ice, because from any camera above the floor
 * the floor is in front of it. Painted actors draw at 10 and do not write
 * depth, so the others are untouched; Anima is given 12 for the rise. Hide it
 * the moment she has cleared the ice.
 */
export function makeFloorOccluder(size = 60): Mesh {
  // `transparent` is load-bearing: three draws the whole opaque list before the
  // transparent one whatever the renderOrder, and an opaque occluder would eat
  // the (transparent, faded) ground drawn after it at the same height.
  const mat = new MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: true, transparent: true, side: DoubleSide });
  const mesh = new Mesh(new PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.004;
  mesh.renderOrder = 11;
  mesh.name = 'macalania:floor-occluder';
  return mesh;
}

/** Anima's render order while the occluder is up (above the occluder's 11). */
export const ANIMA_RISE_RENDER_ORDER = 12;

/** One chain strand's texture: dark iron links on transparent, tiled vertically. Browser only. */
function chainTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(28,24,34,0.95)';
  g.lineWidth = 5;
  g.beginPath();
  g.ellipse(16, 16, 8, 13, 0, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = 'rgba(122,110,138,0.75)';
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(16, 16, 8, 13, 0, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(34,30,42,0.95)';
  g.fillRect(13, 30, 6, 32);
  g.fillStyle = 'rgba(122,110,138,0.6)';
  g.fillRect(14, 31, 2, 30);
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The chains: four strands from the ice around her slot, up out of the top of the frame. */
export interface ArrivalChains {
  group: Group;
  /** 0 = flat in the ice, 1 = taut to their anchors. */
  setGrow(v: number): void;
  dispose(): void;
}

/**
 * Four strands, rising from the floor a little outside her silhouette and
 * leaning outward to anchors far above, as concept A draws them (the dashed
 * lines). They grow from the floor up, and stay once she is in them: she
 * stays bound for the whole of act two (§9.4, "still bound").
 */
export function makeArrivalChains(at: [number, number, number], height: number): ArrivalChains {
  const group = new Group();
  group.name = 'macalania:anima-chains';
  group.position.set(at[0], 0, at[2]);
  const tex = chainTexture();
  const mat = new MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: DoubleSide });
  const top = height * 3.2;
  const feet: Array<[number, number, number]> = [
    [-1.1, 0.35, 0.4],
    [-0.55, 0.12, -0.5],
    [0.6, -0.12, -0.45],
    [1.15, -0.35, 0.35],
  ];
  const strands = feet.map(([x, lean, z]) => {
    const geo = new PlaneGeometry(0.16, top);
    geo.translate(0, top / 2, 0);
    const m = new Mesh(geo, mat);
    m.position.set(x, 0, z);
    m.rotation.z = lean * 0.18;
    m.renderOrder = 9;
    const repeat = Math.round(top / 0.32);
    group.add(m);
    return { m, repeat };
  });
  tex.repeat.set(1, strands[0]!.repeat);
  const setGrow = (v: number): void => {
    const s = Math.max(0.0001, v);
    for (const { m } of strands) {
      m.scale.y = s;
      m.visible = v > 0.001;
    }
    tex.repeat.set(1, Math.max(1, strands[0]!.repeat * s));
  };
  setGrow(0);
  return {
    group,
    setGrow,
    dispose(): void {
      for (const { m } of strands) m.geometry.dispose();
      mat.dispose();
      tex.dispose();
      group.removeFromParent();
    },
  };
}
