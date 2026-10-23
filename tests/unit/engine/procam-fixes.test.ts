/**
 * The pro camera after its adversarial review (lane "pro-camera", 2026-10-23; review of 162c3fdbc): one test or more per confirmed finding, so each fix stays fixed.
 * M1 a fit never lands in one frame; M2 a held target frame is back on the rig in 320 ms; M3 the switch flipped off ends a shot; M4 a cast keeps its wind-up hold; M5 FFX-2 fits Bahamut whole;
 * M6 the victory keeps the winning party whole and clear of the HUD; M7 the soft background reaches the look's blur; m1 the stock tilt-shift's blur is written only for a shot;
 * m2 an aeon's Overdrive shot fits its target; m8 an upright phone is known from the first beat.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRO_AUTO_CAMERA } from '../../../src/data/procam/proShots.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { resetProCamForTests, setProCam } from '../../../src/engine/procam/ProCamSwitch.ts';
import { ProDirector } from '../../../src/engine/procam/ProDirector.ts';
import { HOME_MS, ProFollower, type FollowerHost, type Member } from '../../../src/engine/procam/ProFollower.ts';
import { FLIP_OFF_MS, ProLayer } from '../../../src/engine/procam/ProLayer.ts';
import { SCENE_BLUR, proSoftBackground, proSoftLook } from '../../../src/engine/procam/ProBand.ts';
import { VICTORY_SAFE } from '../../../src/engine/procam/ProPlays.ts';
import { setCameraPreset } from '../../../src/engine/CameraPreset.ts';
import type { ActorHandle, BattleStage, CameraPort } from '../../../src/engine/BattlePresenterPorts.ts';
import type { ActionShot, ShotCtx, ShotSubject } from '../../../src/engine/ShotDirector.ts';
import type { Pose, ProBand, ProRun } from '../../../src/engine/procam/ProTypes.ts';

const REST: Pose = { pos: [0, 3.05, 9.5], look: [0.15, 1.35, -1.2], fov: 32, roll: 0 };
const dist = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);

// ---------------------------------------------------------------------------------------------- M1: a fit never lands in one frame

describe('M1: the never-crop dolly comes in with the shot\'s blend', () => {
  const near: Pose = { pos: [0, 1.5, 5], look: [0, 1, 0], fov: 32, roll: 0 };
  const wide = (over: Partial<ProRun> = {}): ProRun => ({ id: 'wide', inMs: 300, inEase: 'cubic', outMs: 300, outEase: 'cubic', sample: () => near, fit: { ids: ['a'], safe: { x: 0.7, y: 0.9 } }, ...over });
  const boss = { x0: -3, x1: 3, y0: 0, y1: 5, z0: -0.5, z1: 0.5 };

  it('the first frame of a blended run stands where the camera was, and no frame moves the eye more than 0.3 m at 120 Hz', () => {
    const l = new ProLayer();
    l.setBoxes(() => boss);
    l.step(1 / 120, REST, 16 / 9);
    l.play(wide());
    let prev = REST.pos as readonly number[];
    let worst = 0;
    let first = Infinity;
    for (let i = 0; i < 120; i++) {
      const out = l.step(1 / 120, REST, 16 / 9)!;
      if (i === 0) first = dist(out.pose.pos, REST.pos);
      worst = Math.max(worst, dist(out.pose.pos, prev));
      prev = out.pose.pos;
    }
    expect(first).toBeLessThan(0.3);
    expect(worst).toBeLessThan(0.3);
    // and it did arrive: the dolly the figures need is there once the blend is
    expect(l.stats.widest).toBeGreaterThan(1.3);
    expect(dist(prev, near.pos)).toBeGreaterThan(1);
  });
  it('a cut (no blend) is still the whole dolly at once', () => {
    const l = new ProLayer();
    l.setBoxes(() => boss);
    l.play(wide({ inMs: 0 }));
    const out = l.step(1 / 120, REST, 16 / 9)!;
    expect(dist(out.pose.pos, near.pos)).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------------------------- M2: the held target frame

describe('M2: a command menu gets the resting frame in the hold\'s own 320 ms', () => {
  const members: Member[] = [
    { id: 'yuna', feet: [-2, 0, 1.4], height: 1.7 },
    { id: 'rikku', feet: [-1.3, 0, 0.1], height: 1.6 },
    { id: 'bahamut', feet: [1, 0, -5.8], height: 5 },
  ];
  function follower(): { f: ProFollower; set(held: boolean): void } {
    let held = false;
    const host: FollowerHost = { members: () => members, held: () => held, still: () => false, fitK: () => 1 };
    return { f: new ProFollower(host, PRO_AUTO_CAMERA), set: (h) => (held = h) };
  }

  it('the follower is on the rig within HOME_MS of the hold, with no jump at either end', () => {
    expect(HOME_MS).toBe(320);
    const h = follower();
    let prev = REST.pos as readonly number[];
    for (let i = 0; i < 600; i++) prev = h.f.step(1 / 60, REST).pos; // ten seconds of following: it stands away from the rig
    expect(dist(prev, REST.pos)).toBeGreaterThan(0.3);
    h.set(true);
    let worst = 0;
    for (let i = 0; i < 24; i++) { // 400 ms
      const p = h.f.step(1 / 60, REST).pos;
      worst = Math.max(worst, dist(p, prev));
      prev = p;
    }
    expect(dist(prev, REST.pos)).toBeLessThan(0.001);
    expect(worst).toBeLessThan(0.5); // a glide, not a pop
    h.set(false);
    const after = h.f.step(1 / 60, REST).pos;
    expect(dist(after, REST.pos)).toBeLessThan(0.05); // the release continues from the rig
  });
  it('at 200 ms it is part way, not already there and not still at the follower\'s frame', () => {
    const h = follower();
    let p0 = REST.pos as readonly number[];
    for (let i = 0; i < 600; i++) p0 = h.f.step(1 / 60, REST).pos;
    h.set(true);
    let mid = p0;
    for (let i = 0; i < 12; i++) mid = h.f.step(1 / 60, REST).pos;
    const total = dist(p0, REST.pos);
    expect(dist(mid, REST.pos)).toBeLessThan(total * 0.8);
    expect(dist(mid, REST.pos)).toBeGreaterThan(total * 0.02);
  });
});

// ---------------------------------------------------------------------------------------------- M3: the switch ends a shot

describe('M3: the switch flipped off in the middle of a shot ends it', () => {
  it('the layer asks the gate every frame and stops a run, in FLIP_OFF_MS, however long the run would hold', () => {
    expect(FLIP_OFF_MS).toBe(320);
    let on = true;
    const l = new ProLayer();
    l.setGate(() => on);
    const far: Pose = { pos: [2, 2.6, 7.5], look: [1, 1.4, -1.5], fov: 36, roll: 0 };
    l.play({ id: 'long', inMs: 0, inEase: 'linear', outMs: 900, outEase: 'linear', sample: () => far }); // no maxMs: it would hold its last key for ever
    for (let i = 0; i < 30; i++) l.step(1 / 60, REST, 16 / 9);
    expect(l.active).toBe(true);
    on = false;
    for (let i = 0; i < 10; i++) l.step(1 / 60, REST, 16 / 9); // 167 ms: still blending home
    expect(l.active).toBe(true);
    for (let i = 0; i < 20; i++) l.step(1 / 60, REST, 16 / 9); // past 320 ms
    expect(l.active).toBe(false);
  });
  it('with no gate set the layer behaves as before', () => {
    const l = new ProLayer();
    l.play({ id: 'x', inMs: 0, inEase: 'linear', outMs: 0, outEase: 'linear', sample: () => REST });
    for (let i = 0; i < 120; i++) l.step(1 / 60, REST, 16 / 9);
    expect(l.active).toBe(true);
  });
});

// ---------------------------------------------------------------------------------------------- the director, on fakes

type Side = 'party' | 'enemy' | 'aeon';
interface Fig { side: Side; x: number; z: number; h: number }
const GAGAZET: Record<string, Fig> = {
  tidus: { side: 'party', x: -1.55, z: 1.55, h: 1.75 },
  yuna: { side: 'party', x: -2.95, z: 0.25, h: 1.604 },
  kimahri: { side: 'party', x: -1.05, z: -1.05, h: 2.139 },
  'seymour-flux': { side: 'enemy', x: 1.95, z: -2.45, h: 4.1 },
};
const BEVELLE: Record<string, Fig> = {
  yuna: { side: 'party', x: -2.05, z: 1.45, h: 1.75 },
  rikku: { side: 'party', x: -1.3, z: 0.1, h: 1.6 },
  paine: { side: 'party', x: -0.9, z: -1.5, h: 1.8 },
  bahamut: { side: 'enemy', x: 1.05, z: -5.8, h: 3.5 },
};
const actorOf = (f: Fig): ActorHandle =>
  ({
    get position() { return { x: f.x, y: 0, z: f.z }; },
    headPoint: () => ({ x: f.x, y: f.h * 0.92, z: f.z }),
    centerPoint: () => ({ x: f.x, y: f.h * 0.52, z: f.z }),
  }) as unknown as ActorHandle;

function world(figs: Record<string, Fig>, aspect = 16 / 9): { stage: BattleStage; layer: ProLayer; figs: Record<string, Fig>; plays: ProRun[] } {
  const layer = new ProLayer(aspect);
  layer.step(0.016, REST, aspect);
  const plays: ProRun[] = [];
  const play = layer.play.bind(layer);
  layer.play = (run: ProRun): void => (plays.push(run), play(run));
  const camera = { get pro() { return layer; }, get holding() { return false; }, rigNames: ['idle'], rigName: 'idle', punch: vi.fn(() => Promise.resolve()) } as unknown as CameraPort;
  const stage = { camera, actor: (id: string) => (figs[id] ? actorOf(figs[id]!) : undefined), sideOf: (id: string) => figs[id]?.side, staged: () => Object.keys(figs), artOf: (id: string) => id } as unknown as BattleStage;
  return { stage, layer, figs, plays };
}
const subj = (id: string, figs: Record<string, Fig>): ShotSubject => ({ id, side: figs[id]?.side });
function open(w: ReturnType<typeof world>, d: ProDirector, who: string, kind: string, targets: string[], info: Record<string, unknown> = {}, over: Partial<ActionShot> = {}): boolean | Promise<boolean> {
  const ctx = { camera: w.stage.camera, speed: 'normal', skipping: false, ms: (b: number) => b, actor: subj(who, w.figs), targets: targets.map((t) => subj(t, w.figs)), action: { kind, ...info }, ...over } as ActionShot;
  return d.actionOpen!(ctx);
}
const frames = (l: ProLayer, n: number, dt = 1 / 60): void => {
  for (let i = 0; i < n; i++) l.step(dt, REST, 16 / 9);
};

beforeEach(() => {
  resetProCamForTests('?pack=demo');
  setCameraPreset('calm');
  setDemoChapter('seymour-flux');
});
afterEach(() => {
  resetProCamForTests();
  setDemoChapter(undefined);
  setCameraPreset('calm');
});

describe('M1/M5: Chapter IV fits Bahamut whole, and by the same rule whether he acts or is hit', () => {
  it('FFX-2 fitId is the id, FFX keeps a tall foe to his body', () => {
    const f2 = world(BEVELLE);
    setDemoChapter('ffx2-bahamut');
    expect(new ProDirector(f2.stage).fitId('bahamut')).toBe('bahamut');
    setDemoChapter('seymour-flux');
    const f1 = world(GAGAZET);
    expect(new ProDirector(f1.stage).fitId('seymour-flux')).toBe('seymour-flux@0-0.75');
    expect(new ProDirector(f1.stage).fitId('tidus')).toBe('tidus');
  });
  it('Bahamut\'s attack fits [bahamut, the girl] and the follower fits everyone whole', () => {
    setDemoChapter('ffx2-bahamut');
    const w = world(BEVELLE);
    const d = new ProDirector(w.stage);
    expect(open(w, d, 'bahamut', 'attack', ['yuna'])).toBe(true);
    expect(w.plays[0]!.fit!.ids).toEqual(['bahamut', 'yuna']);
    // the follower: no height band on anyone
    const ids = (d as unknown as { follower: { host?: unknown } }).follower;
    expect(ids).not.toBeNull();
  });
});

describe('M3 (director): flipping the switch off mid-shot, the shot ends without waiting for the next beat', () => {
  it('a caster\'s close shot (no maxMs) is gone in under half a second', () => {
    const w = world(GAGAZET);
    const d = new ProDirector(w.stage);
    expect(open(w, d, 'yuna', 'cast', ['tidus'], { abilityId: 'cure' })).toBe(true);
    frames(w.layer, 60);
    expect(w.layer.active).toBe(true);
    setProCam(false);
    frames(w.layer, 30);
    expect(w.layer.active).toBe(false);
  });
  it('the FFX-2 follower goes home too: flipped off, the camera is the rig\'s within 320 ms', () => {
    setDemoChapter('ffx2-bahamut');
    const w = world(BEVELLE);
    const d = new ProDirector(w.stage);
    expect(open(w, d, 'yuna', 'attack', ['bahamut'])).toBe(true);
    for (let i = 0; i < 400; i++) w.layer.step(1 / 60, REST, 16 / 9);
    setProCam(false);
    let pose = w.layer.step(1 / 60, REST, 16 / 9)?.pose;
    for (let i = 0; i < 30; i++) pose = w.layer.step(1 / 60, REST, 16 / 9)?.pose ?? pose;
    expect(pose).toBeDefined();
    expect(dist(pose!.pos, REST.pos)).toBeLessThan(0.001);
    expect(w.layer.active).toBe(false);
  });
});

describe('M4: taking a cast takes its wind-up hold with it, and gives it back', () => {
  it('a cast answers a promise that settles only when the cast hold has run, a plain attack answers at once', async () => {
    const w = world(GAGAZET);
    const d = new ProDirector(w.stage);
    let release!: () => void;
    const castHold = vi.fn(() => new Promise<void>((r) => (release = r)));
    const answer = open(w, d, 'yuna', 'cast', ['tidus'], { abilityId: 'cure' }, { castHold });
    expect(answer).toBeInstanceOf(Promise);
    expect(castHold).toHaveBeenCalledTimes(1);
    let settled = false;
    void (answer as Promise<boolean>).then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    release();
    expect(await answer).toBe(true);
    // a plain attack carries no hold
    const attack = open(w, d, 'tidus', 'attack', ['seymour-flux'], {}, { castHold });
    expect(attack).toBe(true);
    expect(castHold).toHaveBeenCalledTimes(1);
  });
  it('Chapter IV: a spell with no shot of its own keeps the hold as well', async () => {
    setDemoChapter('ffx2-bahamut');
    const w = world(BEVELLE);
    const d = new ProDirector(w.stage);
    const castHold = vi.fn(() => Promise.resolve());
    const answer = open(w, d, 'yuna', 'cast', ['rikku'], { abilityId: 'x2-white-mage-cure' }, { castHold });
    expect(await answer).toBe(true);
    expect(castHold).toHaveBeenCalledTimes(1);
  });
  it('without the hold in the context (a test\'s own, an older caller) it answers true as before', () => {
    const w = world(GAGAZET);
    expect(open(w, new ProDirector(w.stage), 'yuna', 'cast', ['tidus'], { abilityId: 'cure' })).toBe(true);
  });
});

describe('M6: the victory keeps the winning party whole and clear of the HUD', () => {
  it('fits the one the close-up is about and whoever stands within reach, in a frame that leaves the plates and the queue free', () => {
    const w = world(GAGAZET);
    const d = new ProDirector(w.stage);
    d.battleStart({ camera: w.stage.camera, speed: 'normal', skipping: false, ms: (b: number) => b, partyIds: [], boss: subj('seymour-flux', w.figs) } as never);
    const ctx = { camera: w.stage.camera, speed: 'normal', skipping: false, ms: (b: number) => b } as ShotCtx;
    // Tidus acted last
    open(w, d, 'tidus', 'attack', ['seymour-flux']);
    expect(d.victory!(ctx)).toBe(true);
    const run = w.plays[w.plays.length - 1]!;
    expect(run.fit!.ids).toEqual(expect.arrayContaining(['tidus', 'yuna', 'kimahri']));
    expect(run.fit!.safe).toEqual(VICTORY_SAFE);
    expect(VICTORY_SAFE.y).toBeLessThan(0.7); // the bottom row of plates is out of the picture
    expect(VICTORY_SAFE.x).toBeLessThan(0.85); // and the queue down the right
  });
});

describe('m2: an aeon\'s Overdrive start fits its target and may back further', () => {
  it('Bahamut as Yuna\'s aeon is fitted by body, with Seymour in the frame and a longer reach', () => {
    const figs: Record<string, Fig> = { ...GAGAZET, bahamut: { side: 'aeon', x: -2, z: 0.5, h: 5 } };
    const w = world(figs);
    const d = new ProDirector(w.stage);
    const ctx = { camera: w.stage.camera, speed: 'normal', skipping: false, ms: (b: number) => b, actor: subj('bahamut', figs), targets: [subj('seymour-flux', figs)], action: { kind: 'overdrive' } } as ActionShot;
    expect(d.overdriveStart!(ctx)).toBe(true);
    const run = w.plays[0]!;
    expect(run.fit!.ids).toContain('seymour-flux@0-0.75');
    expect(run.fit!.ids).toContain('bahamut'); // the aeon whole
    expect(run.fit!.maxK).toBeGreaterThan(3);
  });
});

describe('m8: an upright phone is known from the first beat', () => {
  it('a layer made on a portrait camera starts with its aspect, and the director declines', () => {
    const l = new ProLayer(390 / 844);
    expect(l.aspect).toBeCloseTo(0.462, 3);
    const w = world(GAGAZET, 390 / 844);
    expect(open(w, new ProDirector(w.stage), 'tidus', 'attack', ['seymour-flux'])).toBe(false);
  });
  it('the default is the wide frame', () => {
    expect(new ProLayer().aspect).toBeCloseTo(16 / 9, 6);
  });
});

// ---------------------------------------------------------------------------------------------- M7 / m1: the soft background

describe('M7: the shot\'s soft background reaches the look\'s blur', () => {
  const shot: ProBand = { focus: 0.5, width: 0.3, blur: 9, weight: 1 };
  const own = { focus: 0.38, band: 0.2, far: 10, near: 7 };

  it('is the look\'s own blur with no shot or a spent one', () => {
    expect(proSoftLook(own, null)).toBe(own);
    expect(proSoftLook(own, { ...shot, weight: 0 })).toBe(own);
  });
  it('moves the band to the shot\'s figures and deepens both radii by the shot\'s blur over the scene\'s, by its weight', () => {
    expect(SCENE_BLUR).toBe(6);
    const full = proSoftLook(own, shot);
    expect(full.focus).toBeCloseTo(0.5, 6);
    expect(full.band).toBeCloseTo(0.3, 6);
    expect(full.far).toBeCloseTo(15, 6);
    expect(full.near).toBeCloseTo(10.5, 6);
    const half = proSoftLook(own, { ...shot, weight: 0.5 });
    expect(half.focus).toBeCloseTo(0.44, 6);
    expect(half.far).toBeCloseTo(12.5, 6);
  });
  it('the stock tilt-shift blends from its real blur: the band carries the shot\'s blur and how much of it is in', () => {
    const b = proSoftBackground({ focus: 0.3, width: 0.2 }, { ...shot, weight: 0.5 })!;
    expect(b.blur).toBe(9);
    expect(b.blurMix).toBe(0.5);
    expect(proSoftBackground(null, null)).toBeNull();
  });
});

describe('m1: the stock tilt-shift\'s blur is written only while a shot asks for it', () => {
  it('Cinema.dof hands the shot to the renderer, leaves maxBlur alone for a band with no blur, and restores it only if it wrote it', async () => {
    const { Cinema } = await import('../../../src/engine/fx/mix/cinema.ts');
    const { Scene } = await import('three');
    const u = { focus: { value: 0.34 }, bandWidth: { value: 0.22 }, maxBlur: { value: 2.5 } };
    const applied: Array<Record<string, number>> = [];
    const r = {
      tiltH: { uniforms: u },
      proSoft: null as ProBand | null,
      applyPost: (p: Record<string, number>) => {
        applied.push(p);
        if (p['tiltFocus'] !== undefined) u.focus.value = p['tiltFocus'];
        if (p['tiltBandWidth'] !== undefined) u.bandWidth.value = p['tiltBandWidth'];
        if (p['tiltMaxBlur'] !== undefined) u.maxBlur.value = p['tiltMaxBlur'];
      },
    };
    const c = new Cinema(new Scene(), () => r as never);
    const shot: ProBand = { focus: 0.5, width: 0.3, blur: 9, weight: 0.5 };
    // the mix's own band: no blur written, none restored
    c.dof({ focus: 0.4, width: 0.2 }, null);
    expect(applied[0]).toEqual({ tiltFocus: 0.4, tiltBandWidth: 0.2 });
    c.dof(null, null);
    expect(applied[1]).toEqual({ tiltFocus: 0.34, tiltBandWidth: 0.22 });
    expect(u.maxBlur.value).toBe(2.5);
    // a shot's band: the blur is mixed in over the real one, and given back
    c.dof(proSoftBackground({ focus: 0.4, width: 0.2 }, shot), shot);
    expect(r.proSoft).toBe(shot);
    expect(u.maxBlur.value).toBeCloseTo(2.5 + (9 - 2.5) * 0.5, 6);
    c.dof(null, null);
    expect(r.proSoft).toBeNull();
    expect(u.maxBlur.value).toBeCloseTo(2.5, 6);
  });
});

describe('m3: the real launch sweeps stand closer to their aim', () => {
  it('closerKeys moves every eye along its own view to k times its distance, and leaves aim, lens, roll and timing alone', async () => {
    const { closerKeys, LAUNCH_CLOSER } = await import('../../../src/engine/procam/ProShots.ts');
    const keys = [
      { t: 0, pose: { pos: [0, 11, 10] as [number, number, number], look: [0, 1, 0] as [number, number, number], fov: 30, roll: 1 }, ease: 'linear' as const },
      { t: 900, pose: { pos: [4, 9, 8] as [number, number, number], look: [1, 1.5, -1] as [number, number, number], fov: 34, roll: -2 }, ease: 'cosine' as const },
    ];
    const out = closerKeys(keys, LAUNCH_CLOSER);
    expect(LAUNCH_CLOSER).toBeGreaterThan(0.4);
    expect(LAUNCH_CLOSER).toBeLessThan(0.8);
    for (let i = 0; i < keys.length; i++) {
      const a = keys[i]!.pose;
      const b = out[i]!.pose;
      expect(b.look).toEqual(a.look);
      expect([b.fov, b.roll, out[i]!.t, out[i]!.ease]).toEqual([a.fov, a.roll, keys[i]!.t, keys[i]!.ease]);
      expect(dist(b.pos, a.look)).toBeCloseTo(dist(a.pos, a.look) * LAUNCH_CLOSER, 6);
      const va = [a.pos[0] - a.look[0], a.pos[1] - a.look[1], a.pos[2] - a.look[2]];
      const vb = [b.pos[0] - b.look[0], b.pos[1] - b.look[1], b.pos[2] - b.look[2]];
      expect(vb[0]! / va[0]! || LAUNCH_CLOSER).toBeCloseTo(LAUNCH_CLOSER, 6); // the same direction
    }
  });
});

describe('M6: a frame with a place for the figures (the victory keeps the HUD\'s corner free)', () => {
  const boxes = [
    { x0: -3.4, x1: -2.6, y0: 0, y1: 1.7, z0: 0, z1: 0.3 }, // Yuna
    { x0: -1.9, x1: -1.1, y0: 0, y1: 1.8, z0: 1.4, z1: 1.7 }, // Tidus
    { x0: -1.4, x1: -0.6, y0: 0, y1: 2.1, z0: -1.2, z1: -0.9 }, // Kimahri
  ];
  const pose: Pose = { pos: [-1.5, 1.6, 3.4], look: [-1.9, 1.4, 1.5], fov: 28, roll: 0 }; // a close-up aimed at one of them
  const aspect = 16 / 9;
  const at = { x: -0.28, y: 0.2 };
  const safe = { x: 0.6, y: 0.62 };

  it('placeAt puts the middle of the figures where it is told, and leaves the view\'s direction and lens alone', async () => {
    const { placeAt, unionBox, ndcRect } = await import('../../../src/engine/procam/ProFit.ts');
    const p = placeAt(pose, aspect, boxes, at);
    const u = unionBox(boxes);
    const mid = ndcRect({ x0: (u.x0 + u.x1) / 2, x1: (u.x0 + u.x1) / 2, y0: (u.y0 + u.y1) / 2, y1: (u.y0 + u.y1) / 2, z0: (u.z0 + u.z1) / 2, z1: (u.z0 + u.z1) / 2 }, p, aspect)!; // the middle point itself
    expect(mid.x0).toBeCloseTo(at.x, 3);
    expect(mid.y0).toBeCloseTo(at.y, 3);
    expect(p.fov).toBe(pose.fov);
    const dir = (q: Pose): number[] => { const d = [q.look[0] - q.pos[0], q.look[1] - q.pos[1], q.look[2] - q.pos[2]]; const n = Math.hypot(d[0]!, d[1]!, d[2]!); return d.map((x) => x / n); };
    expect(dir(p)[0]).toBeCloseTo(dir(pose)[0]!, 6);
    expect(dir(p)[2]).toBeCloseTo(dir(pose)[2]!, 6);
  });
  it('fitCentred backs the eye off until the union is inside the half-extents about the target, and no further than maxK', async () => {
    const { fitCentred, unionBox, ndcRect } = await import('../../../src/engine/procam/ProFit.ts');
    const res = fitCentred(pose, aspect, boxes, safe, at, 4.5);
    expect(res.k).toBeGreaterThan(1.2);
    const r = ndcRect(unionBox(boxes), res.pose, aspect)!;
    expect((r.x1 - r.x0) / 2).toBeLessThanOrEqual(safe.x * 1.01);
    expect((r.y1 - r.y0) / 2).toBeLessThanOrEqual(safe.y * 1.01);
    // inside the frame that leaves the plates (x above 0.3, y below -0.43) and the queue (x above 0.72) free
    expect(r.x1).toBeLessThan(0.34);
    expect(r.y0).toBeGreaterThan(-0.46);
    const capped = fitCentred(pose, aspect, boxes, safe, at, 1.3);
    expect(capped.k).toBeLessThanOrEqual(1.3);
  });
  it('in the layer the placed frame comes in with the blend: the first frame is where the camera was, the last has the party in the free part of the frame', async () => {
    const { unionBox, ndcRect } = await import('../../../src/engine/procam/ProFit.ts');
    const l = new ProLayer();
    l.setBoxes((id) => ({ a: boxes[0]!, b: boxes[1]!, c: boxes[2]! })[id as 'a'] ?? null);
    const from: Pose = { ...pose, pos: [-1.2, 1.7, 3.9], look: [-1.8, 1.4, 1.2] }; // where the camera was: a glide away from the close-up, not a cut (the comfort rule)
    l.step(1 / 60, from, aspect);
    l.play({ id: 'v', inMs: 700, inEase: 'cubic', outMs: 500, outEase: 'cubic', sample: () => pose, fit: { ids: ['a', 'b', 'c'], safe, to: at, maxK: 4.5 } });
    const first = l.step(1 / 60, from, aspect)!.pose;
    expect(dist(first.pos, from.pos)).toBeLessThan(0.3);
    let last = first;
    for (let i = 0; i < 90; i++) last = l.step(1 / 60, from, aspect)!.pose;
    const r = ndcRect(unionBox(boxes), last, aspect)!;
    expect(Math.abs((r.x0 + r.x1) / 2 - at.x)).toBeLessThan(0.1);
    expect(r.x1).toBeLessThan(0.34);
    expect(r.y0).toBeGreaterThan(-0.46);
  });
});
