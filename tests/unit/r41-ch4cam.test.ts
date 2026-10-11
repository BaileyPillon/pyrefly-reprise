// @vitest-environment jsdom
/**
 * PR-0421 (round 24, deep review of 72973096; FFX-2 only: Chapter IV, Bahamut). "About 3.9 to 6 s after the battle slate the camera pulls wide and the painted backdrop does not
 * fill the frame: dark vertical bands at left and right (1600x900: x 0 to 190 and x 1350 to 1470) and a lit bottom edge, at 1600x900 and 2000x1012."
 *
 * The reading was "the plate's edges". It is not: the plate and its painted wings fill that frame at every window shape the giants' close views cover (1.2 to 2.45), every rig and every
 * blend of the opening (the first describe), and with the two foreground conduits hidden the frame is all painting. The bands are the conduits themselves, the two 3D pipes that bracket
 * the frame (`bevelle-underground.ts`, "cut by the frame's edges"): placed against the idle rig (9.6 back) they stand just outside its border, and the opening's `intro` rig (16.4 back, the
 * party walks on there, the name slab dissolves over it) stands 1.5 times as wide at their depth and takes them into the picture as two dark slabs (the second describe, the defect as
 * measured). They follow a pull-back out to the edge now (`frameBracket.ts` `bracketedX`; one-sided: a push, a narrow window and the idle rig leave them where they stood), the rule
 * PR-0344 set for a wide window, and the third describe plays it through the loaded scene.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Pose } from '../../src/engine/fx/mix/geometry.ts';
import { GIANT_ROWS, giantView } from '../../src/engine/fx/mix/giants.ts';
import { plateMiss, type Plate } from '../../src/engine/fx/mix/plate.ts';
import { parseArtManifest, resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { BRACKET_REF, BRACKET_WIDEN, bracketCamera, bracketScale, bracketedX } from '../../src/scenes/frameBracket.ts';
import { loadScene, type LoadedScene } from '../../src/scenes/index.ts';
import { BEVELLE_CONDUITS, BEVELLE_PLATE_WINGS, BEVELLE_UNDERGROUND_BACKDROP, BEVELLE_UNDERGROUND_RIGS } from '../../src/scenes/bevelle-underground.ts';
import { PHONE_BATTLE_QUERY } from '../../src/ui/common/phoneBattle.ts';

const IMAGE_ASPECT = 2688 / 1536;
/** The window shapes the giants' close views cover (`GIANT_ROWS`: 1.2 to 2.45) and the ones the review named: 1600x900, 2000x1012, 1280x1024 (5:4), 2560x1080, 21:9 and 24:10. */
const ASPECTS = [1.2, 1.25, 1280 / 1024, 1.28, 4 / 3, 1.5, 1.6, 16 / 9, 2, 2000 / 1012, 2.2, 2.37, 2.45];
const H = 900;

type Rig = { position: readonly number[]; lookAt: readonly number[]; fov?: number };
const rigs = BEVELLE_UNDERGROUND_RIGS as Record<string, Rig>;
const poseOf = (r: { pos: readonly number[]; look: readonly number[]; fov: number }): Pose => ({ pos: new Vector3(...(r.pos as [number, number, number])), look: new Vector3(...(r.look as [number, number, number])), fov: r.fov });
const rigPose = (r: Rig): Pose => poseOf({ pos: r.position, look: r.lookAt, fov: r.fov ?? 32 });
const mix = (a: Pose, b: Pose, k: number): Pose => ({ pos: a.pos.clone().lerp(b.pos, k), look: a.look.clone().lerp(b.look, k), fov: a.fov + (b.fov - a.fov) * k });

/** The painted plate with its wings as one rectangle: 78 wide, the painted strips 18 each side (`BEVELLE_PLATE_WINGS`), 44.57 tall, at its depth. */
const plate = (): Plate => ({
  o: new Vector3(0, BEVELLE_UNDERGROUND_BACKDROP.centreY, BEVELLE_UNDERGROUND_BACKDROP.distance),
  u: new Vector3(1, 0, 0),
  v: new Vector3(0, 1, 0),
  n: new Vector3(0, 0, 1),
  hw: BEVELLE_UNDERGROUND_BACKDROP.width / 2 + BEVELLE_PLATE_WINGS.width,
  hh: BEVELLE_UNDERGROUND_BACKDROP.width / IMAGE_ASPECT / 2,
});

/** Chapter IV's camera at a window shape: the rigs, the giant's idle view for that shape, and every step of the opening's move from the `intro` rig to the idle view. */
function poses(aspect: number): Array<[string, Pose]> {
  const bahamut = GIANT_ROWS.find((r) => r.id === 'bahamut')!;
  const view = giantView(bahamut, aspect);
  const idle = view ? poseOf({ pos: view.pos, look: view.look, fov: view.fov }) : rigPose(rigs['idle']!);
  const out: Array<[string, Pose]> = Object.entries(rigs).filter(([n]) => n !== 'bahamut').map(([n, r]) => [`rig ${n}`, rigPose(r)]); // the low `bahamut` rig is the bible's tilt-up money shot, no rig of this move
  if (view) out.push(['the giants idle view', idle]);
  for (let i = 0; i <= 20; i++) out.push([`opening ${(i * 5).toString()}% toward the intro`, mix(idle, rigPose(rigs['intro']!), i / 20)]);
  return out;
}

describe('PR-0421: the plate and its wings fill the frame of every pose of the Chapter IV move, at every window shape the giants cover', () => {
  for (const aspect of ASPECTS) {
    it(`${aspect.toFixed(3)} (${Math.round(H * aspect)}x${H}): no ray of the frame runs past the painting`, () => {
      for (const [name, pose] of poses(aspect)) {
        const m = plateMiss(plate(), pose, Math.round(H * aspect), H);
        expect(m.share, `${name} @${aspect.toFixed(3)}`).toBe(0);
        expect(m.corners, `${name} @${aspect.toFixed(3)} corners`).toBe(0);
      }
    });
  }

  it('the giants cover 1.2 to 2.45 with two views (the plate gate of each is `decideGiant`\'s, and is held here too)', () => {
    const bahamut = GIANT_ROWS.find((r) => r.id === 'bahamut')!;
    expect(bahamut.views.map((v) => v.aspect)).toEqual([[1.2, 1.28], [1.28, 2.45]]);
    for (const aspect of ASPECTS) expect(giantView(bahamut, aspect), `${aspect}`).not.toBeNull();
  });
});

/**
 * How far in from the frame's border a conduit's inner edge stands, as a share of the frame's width (negative: outside the frame): the pipe's axis at its base radius, read at the height of the
 * foot and of a figure's head (the pitch tilts the pipe's edge a little; the larger is taken).
 */
function inboard(pose: Pose, aspect: number, placed: readonly [number, number, number, number], x: number): number {
  const cam = new PerspectiveCamera(pose.fov, aspect, 0.1, 500);
  cam.position.copy(pose.pos);
  cam.lookAt(pose.look);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const [base, z, r] = placed;
  const inner = x + (base < 0 ? r : -r);
  const share = (y: number): number => {
    const ndc = new Vector3(inner, y, z).project(cam).x;
    return base < 0 ? (ndc + 1) / 2 : (1 - ndc) / 2;
  };
  return Math.max(share(0), share(1.8));
}

/** The pose as the camera the scene reads (`bracketCamera`) and the pipe's place under it. */
function placedAt(pose: Pose, aspect: number, c: readonly [number, number, number, number]): number {
  const cam = new PerspectiveCamera(pose.fov, aspect, 0.1, 500);
  cam.position.copy(pose.pos);
  cam.lookAt(pose.look);
  cam.updateMatrixWorld(true);
  return bracketedX(c[0], c[1], c[2], c[0] * bracketScale(aspect), bracketCamera(cam));
}

describe('PR-0421: the conduits (the bands the review saw) are not taken into the picture by the opening pull-back', () => {
  it('the defect as the round measured it: at 1600x900 the intro rig takes the pipes in as slabs, 12 percent of the frame in on the left and 16 on the right', () => {
    const intro = rigPose(rigs['intro']!);
    const [left, right] = BEVELLE_CONDUITS;
    expect(inboard(intro, 16 / 9, left!, left![0])).toBeGreaterThan(0.1); // x 190 of 1600
    expect(inboard(intro, 16 / 9, right!, right![0] * bracketScale(16 / 9))).toBeGreaterThan(0.14); // x 1350 of 1600
    // 2000x1012: the same two slabs, the window's own scale (PR-0344) already in
    expect(inboard(intro, 2000 / 1012, left!, left![0] * bracketScale(2000 / 1012))).toBeGreaterThan(0.08);
    expect(inboard(intro, 2000 / 1012, right!, right![0] * bracketScale(2000 / 1012))).toBeGreaterThan(0.1);
  });

  it('with the clamp the intro rig stands them at the border, at every window shape the giants cover (1600x900 and 2000x1012 included)', () => {
    for (const aspect of ASPECTS) {
      for (const c of BEVELLE_CONDUITS) {
        const at = inboard(rigPose(rigs['intro']!), aspect, c, placedAt(rigPose(rigs['intro']!), aspect, c));
        expect(at, `intro @${aspect.toFixed(3)} pipe ${c[0]}`).toBeLessThanOrEqual(0.003); // at the border: under 5 px of 1600
      }
    }
  });

  it('through the opening whole move (the intro rig to the giants view) no pipe stands further in than it did, or than a close rig has it (12 percent), and at the wide end none stands in at all', () => {
    for (const aspect of ASPECTS) {
      for (const [name, pose] of poses(aspect).filter(([n]) => n.startsWith('opening'))) {
        for (const c of BEVELLE_CONDUITS) {
          const at = inboard(pose, aspect, c, placedAt(pose, aspect, c));
          const today = inboard(pose, aspect, c, c[0] * bracketScale(aspect));
          expect(at, `${name} @${aspect.toFixed(3)} pipe ${c[0]}`).toBeLessThanOrEqual(BRACKET_WIDEN.inboard + 0.003);
          expect(at, `${name} @${aspect.toFixed(3)} pipe ${c[0]} against today`).toBeLessThanOrEqual(today + 1e-9);
        }
      }
      // 85 percent of the way to the intro rig and on: the frame is 30 percent wider than the idle rig's at the pipes, and they are at the border
      for (const [name, pose] of poses(aspect).filter(([n]) => /opening (8[5-9]|9\d|100)%/.test(n))) {
        for (const c of BEVELLE_CONDUITS) expect(inboard(pose, aspect, c, placedAt(pose, aspect, c)), `${name} @${aspect.toFixed(3)} pipe ${c[0]}`).toBeLessThanOrEqual(0.004);
      }
    }
  });

  it('every other shot is as it was: the idle rig, the close rigs, the giants views at their own shapes and every narrower window leave the pipes exactly where they were placed', () => {
    for (const aspect of ASPECTS) {
      const bahamut = GIANT_ROWS.find((r) => r.id === 'bahamut')!;
      const v = giantView(bahamut, aspect);
      const stay: Array<[string, Pose]> = ['idle', 'enemy', 'party', 'action', 'victory', 'bahamut'].map((n) => [n, rigPose(rigs[n]!)]);
      if (v) stay.push(['the giants view', poseOf({ pos: v.pos, look: v.look, fov: v.fov })]);
      for (const [name, pose] of stay) {
        for (const c of BEVELLE_CONDUITS) expect(placedAt(pose, aspect, c), `${name} @${aspect.toFixed(3)} pipe ${c[0]}`).toBe(c[0] * bracketScale(aspect));
      }
    }
  });

  it('the settled view keeps them with the camera idle drift on it (half a unit either way across, 0.4 back): the sway never takes a pipe for a pull-back', () => {
    for (const aspect of ASPECTS) {
      const bahamut = GIANT_ROWS.find((r) => r.id === 'bahamut')!;
      const v = giantView(bahamut, aspect)!;
      for (const [dx, dz] of [[-0.5, 0], [0.5, 0], [0, 0.4], [0.5, 0.4], [-0.5, 0.4]] as const) {
        const pose = poseOf({ pos: [v.pos[0] + dx, v.pos[1], v.pos[2] + dz], look: v.look, fov: v.fov });
        for (const c of BEVELLE_CONDUITS) {
          if (v.aspect[0] === 1.2 && dz > 0) continue; // the 5:4 view stands 10.2 back and its pipes are outside the frame anyway
          expect(placedAt(pose, aspect, c), `@${aspect.toFixed(3)} drift ${dx},${dz} pipe ${c[0]}`).toBe(c[0] * bracketScale(aspect));
        }
      }
    }
  });

  it('it moves out only, on the pipe own side, at any pose of the move and any window', () => {
    for (const aspect of ASPECTS) {
      for (const [name, pose] of poses(aspect)) {
        for (const c of BEVELLE_CONDUITS) {
          const today = c[0] * bracketScale(aspect);
          const at = placedAt(pose, aspect, c);
          expect(Math.abs(at), `${name} @${aspect.toFixed(3)} pipe ${c[0]}`).toBeGreaterThanOrEqual(Math.abs(today));
          expect(Math.sign(at)).toBe(Math.sign(c[0]));
        }
      }
    }
  });

  it('the pipe glides: along the opening move the step between two frames of a 1.2 s dolly at 60 fps is under a seventh of a unit, out at the intro and home at the giants view', () => {
    for (const aspect of [16 / 9, 2000 / 1012]) {
      const bahamut = GIANT_ROWS.find((r) => r.id === 'bahamut')!;
      const v = giantView(bahamut, aspect)!;
      const idle = poseOf({ pos: v.pos, look: v.look, fov: v.fov });
      const intro = rigPose(rigs['intro']!);
      for (const c of BEVELLE_CONDUITS) {
        const home = c[0] * bracketScale(aspect);
        let prev = placedAt(intro, aspect, c);
        expect(Math.abs(prev), `pipe ${c[0]} @${aspect.toFixed(2)} at the intro`).toBeGreaterThan(Math.abs(home) + 2); // out past its place by more than two units
        let worst = 0;
        for (let i = 1; i <= 72; i++) {
          const now = placedAt(mix(intro, idle, i / 72), aspect, c);
          worst = Math.max(worst, Math.abs(now - prev));
          expect(Math.abs(now), 'out and back along one path').toBeLessThanOrEqual(Math.abs(prev) + 1e-9);
          prev = now;
        }
        expect(worst, `pipe ${c[0]} @${aspect.toFixed(2)}`).toBeLessThan(0.15);
        expect(prev).toBe(home); // home at the view the move ends on
      }
    }
  });

  it('leaves a pipe alone with no camera, a prop at x 0, a camera that turns its back, and the reference rig is the scene idle rig', () => {
    expect(bracketedX(-7.9, -5, 0.58, -7.9, null)).toBe(-7.9);
    const back = new PerspectiveCamera(32, 16 / 9, 0.1, 500);
    back.position.set(0, 3, 9.6);
    back.lookAt(0, 3, 30); // looking the other way
    back.updateMatrixWorld(true);
    expect(bracketedX(-7.9, -5, 0.58, -7.9, bracketCamera(back))).toBe(-7.9);
    expect(bracketedX(0, -5, 0.58, 0, bracketCamera(back))).toBe(0);
    expect([...BRACKET_REF.pos]).toEqual([...rigs['idle']!.position]);
    expect([...BRACKET_REF.look]).toEqual([...rigs['idle']!.lookAt]);
    expect(BRACKET_REF.fov).toBe(rigs['idle']!.fov);
    expect(BRACKET_WIDEN.from).toBeLessThan(BRACKET_WIDEN.full);
  });
});

describe('PR-0421: the loaded Chapter IV scene moves its pipes with the camera it is bound to', () => {
  const loaded: LoadedScene[] = [];
  const pipes = (s: LoadedScene): number[] => {
    const xs: number[] = [];
    s.scene.traverse((o) => {
      if (o.name === 'pillar') xs.push(o.position.x);
    });
    return xs.sort((a, b) => a - b);
  };
  const lamps = (s: LoadedScene): number[] => {
    const xs: number[] = [];
    s.scene.traverse((o) => {
      if (o.name === 'conduit-lamp') xs.push(o.position.x);
    });
    return xs.sort((a, b) => a - b);
  };

  beforeAll(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      const pixels = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.floor(w) * Math.floor(h)) * 4), width: w, height: h });
      const stub: object = new Proxy(function () {}, { get: (_t, p) => (p === 'then' ? undefined : stub), apply: () => stub, set: () => true });
      return new Proxy({} as Record<string | symbol, unknown>, {
        get(target, prop) {
          if (prop in target) return target[prop];
          if (prop === 'getImageData') return (_x: number, _y: number, w: number, h: number) => pixels(w, h);
          if (prop === 'createImageData') return (w: number, h: number) => pixels(w, h);
          if (prop === 'measureText') return () => ({ width: 10 });
          return () => stub;
        },
        set(target, prop, value) {
          target[prop] = value;
          return true;
        },
      }) as never;
    });
    setArtManifest(parseArtManifest({ version: 1, subjects: {}, backdrops: [] }));
    vi.stubGlobal('fetch', async () => new Response(null, { status: 404 }));
  });
  afterEach(() => {
    for (const s of loaded.splice(0)) s.dispose();
  });
  afterAll(() => {
    resetArtManifest();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const load = async (phone: boolean, w = 1600, h = 900): Promise<{ s: LoadedScene; cam: PerspectiveCamera }> => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: phone && q === PHONE_BATTLE_QUERY, media: q, addEventListener() {}, removeEventListener() {} }));
    (window as unknown as { innerWidth: number }).innerWidth = w;
    (window as unknown as { innerHeight: number }).innerHeight = h;
    const cam = new PerspectiveCamera(32, w / h, 0.1, 500);
    const s = await loadScene('bevelle-underground', cam);
    loaded.push(s);
    return { s, cam };
  };
  /** Two frames on a rig (the scene reads the camera as the last frame left it). */
  const settle = (s: LoadedScene, rig: string): void => {
    s.battleCamera.snapTo(rig);
    s.update(1 / 60);
    s.update(1 / 60);
  };

  it('Chapter IV on a desktop at 1600x900: at the idle rig the pipes stand where they were placed; at the intro rig they stand out at the edge; back at the idle rig they are home', async () => {
    const { s } = await load(false);
    settle(s, 'idle');
    const home = pipes(s);
    expect(home[0]).toBeCloseTo(-7.9, 6);
    expect(home[1]).toBeCloseTo(8.9, 6);
    const homeLamps = lamps(s);
    settle(s, 'intro');
    const out = pipes(s);
    expect(out[0]!).toBeLessThan(home[0]! - 2); // the 16.4 back rig stands 1.4 times as wide at their depth: out by 2.5 and 4 units
    expect(out[1]!).toBeGreaterThan(home[1]! + 2);
    // the lamps are clamped to the pipe and go with it
    const outLamps = lamps(s);
    expect(outLamps[0]!).toBeLessThan(homeLamps[0]! - 2);
    expect(outLamps[outLamps.length - 1]!).toBeGreaterThan(homeLamps[homeLamps.length - 1]! + 2);
    settle(s, 'idle');
    expect(pipes(s)).toEqual(home);
    expect(lamps(s)).toEqual(homeLamps);
  });

  it('a push-in (the party and enemy rigs) leaves them where they stood', async () => {
    const { s } = await load(false);
    settle(s, 'idle');
    const home = pipes(s);
    for (const rig of ['party', 'enemy', 'action', 'victory', 'bahamut']) {
      settle(s, rig);
      expect(pipes(s), rig).toEqual(home);
    }
  });

  it('the phone keeps them as they were at every rig (its slice never showed them and its layout is not touched)', async () => {
    const { s } = await load(true, 390, 844);
    settle(s, 'idle');
    const home = pipes(s);
    expect(home).toEqual([-7.9, 8.9]);
    settle(s, 'intro');
    expect(pipes(s)).toEqual(home);
  });
});
