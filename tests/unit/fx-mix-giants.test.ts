import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Object3D, PerspectiveCamera, Vector3 } from 'three';
import { FFX2_FIEND_STATURE, FFX2_GIANT_SHARE, FFX2_GIRLS_MEAN } from '../../src/data/ffx2/fiend-stature.ts';
import { cameraAt, figBox, figOf, type Actor } from '../../src/engine/fx/mix/geometry.ts';
import { forgetMenuPanels } from '../../src/engine/fx/mix/hudPanels.ts';
import { Framing } from '../../src/engine/fx/mix/framing.ts';
import { GIANT_COVER_MAX, GIANT_FLOOR, GIANT_OVERLAP_MAX, GIANT_ROWS, giantFactor, giantPose, giantRow, giantRule, giantView, partyWorldHeight } from '../../src/engine/fx/mix/giants.ts';
import { limitsFor } from '../../src/engine/fx/mix/clearance.ts';

/**
 * r3942-stage wave 2, **FFX-2 only**: the giants of Chapters IV, XIII and XI (Bahamut, Paragon, Anima) through `Framing` itself, the way
 * `fx-mix-boss-scale-framing.test.ts` plays a plan: the figures, the idle rig and a document stand in for the scene and the HUD. The numbers measured in a browser
 * (the girls' size, the boss's ratio, the card) are in `docs/handoff/r3942-stage.md`; what these pin is the rule: which fights play a giant, at what size and under which
 * camera, the exception to the party-height floor and where it stops, and what falls back to the plan as it was (an unproved window shape, the phone, FFX, the switch off).
 */

let W = 1600;
let H = 900;
let phone = false;
const stubDom = (): void => {
  const rect = { left: 0, top: 0, width: W, height: H, right: W, bottom: H };
  const canvas = { getBoundingClientRect: () => rect };
  vi.stubGlobal('document', { documentElement: { dataset: phone ? { phoneBattle: '1' } : {} }, querySelector: () => canvas, querySelectorAll: () => [] });
  vi.stubGlobal('window', { innerWidth: W, innerHeight: H, matchMedia: () => ({ matches: phone }) });
};
beforeEach(() => {
  W = 1600;
  H = 900;
  phone = false;
  forgetMenuPanels();
  stubDom();
});
afterEach(() => vi.unstubAllGlobals());

/** A painted figure as the stage parents it: named, facing, at a spot, its quad `halfW` wide each side; the painted id is the name. */
const actor = (name: string, facing: number, x: number, z: number, h: number, halfW = h * 0.25, shift = 0): Actor => {
  const a = new Object3D() as unknown as Actor;
  a.name = name;
  (a as unknown as { facing: number }).facing = facing;
  (a as unknown as { worldHeight: number }).worldHeight = h;
  (a as unknown as { poseUrls: Record<string, string> }).poseUrls = { idle: `art/characters/${name}/idle.png` };
  a.visible = true;
  a.position.set(x, 0, z);
  a.contentQuad = (out) => {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    const hh = (a as unknown as { worldHeight: number }).worldHeight;
    q[0].set(-halfW + shift, 0, 0).applyMatrix4(a.matrixWorld);
    q[1].set(halfW + shift, 0, 0).applyMatrix4(a.matrixWorld);
    q[2].set(halfW + shift, hh, 0).applyMatrix4(a.matrixWorld);
    q[3].set(-halfW + shift, hh, 0).applyMatrix4(a.matrixWorld);
    return q;
  };
  return a;
};

interface Rig {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov: number;
}
class FakeBattleCamera {
  readonly camera: PerspectiveCamera;
  rigName = 'idle';
  readonly rigNames = ['idle', 'party', 'enemy', 'action'];
  pushAmount = 0;
  tweens = { size: 0 };
  private readonly rigs = new Map<string, Rig>();
  constructor(idle: Rig, close: Rig) {
    this.camera = new PerspectiveCamera(idle.fov, W / H);
    for (const n of this.rigNames) this.rigs.set(n, n === 'idle' ? idle : close);
  }
  getRig(n: string): Rig | undefined {
    return this.rigs.get(n);
  }
  addRig(n: string, r: Rig): void {
    this.rigs.set(n, r);
  }
  async moveTo(): Promise<void> {}
  snapTo(): void {}
}

const IDLE: Rig = { position: [0, 3.0, 9.6], lookAt: [0.15, 1.5, -1.3], fov: 32 };
const CLOSE: Rig = { position: [0.15, 2.7, 9.0], lookAt: [1.0, 1.5, -1.2], fov: 32 };

/** Chapter IV's stage (`scenes/bevelle-underground.ts`): the three girls on the slots, Bahamut on the boss slot at the stage's own height. */
const bevelle = () => {
  const party = [actor('yuna-white-mage', 1, -2.05, 1.45, 1.82), actor('rikku-dark-knight', 1, -1.3, 0.1, 1.82), actor('paine-warrior', 1, -0.9, -1.5, 1.82)];
  const boss = actor('ffx2-bahamut', -1, 1.05, -5.8, 4.1);
  return { party, boss, actors: [...party, boss] };
};
/** The girls here are drawn a third narrower than the stand-in default (their paintings are slim), and each boss's box is the part of its painting that is solid, which a mask measures in the game (the plan reads the silhouette's own pixels): Paragon's wide and right of its centre, Anima's a tower's, also right of hers. */
const girl = (name: string, x: number, z: number, h: number): Actor => actor(name, 1, x, z, h, h * 0.16);
const cloister = () => {
  const party = [girl('yuna-dark-knight', -2.05, 1.45, 1.75), girl('rikku-alchemist', -1.3, 0.1, 1.75), girl('paine-dark-knight', -0.9, -1.5, 1.75)];
  const boss = actor('paragon', -1, 1.05, -5.8, 3.1, 3.1 * 0.3, 3.1 * 0.25);
  return { party, boss, actors: [...party, boss] };
};
const road = () => {
  const party = [girl('yuna-white-mage', -2.48, 1.45, 1.78), girl('rikku-dark-knight', -1.44, 0.1, 1.78), girl('paine-dark-knight', -0.33, -1.3, 1.78)];
  const boss = actor('x2-anima', -1, 1.0, -6.2, 3.4, 3.4 * 0.1, 3.4 * 0.3);
  return { party, boss, actors: [...party, boss] };
};
const framingFor = (game: 'ffx' | 'ffx2' = 'ffx2', cam = new FakeBattleCamera(IDLE, CLOSE)): { f: Framing; cam: FakeBattleCamera } => ({ f: new Framing(cam as never, new PerspectiveCamera(32, W / H), game), cam });
const run = (f: Framing, actors: Actor[], seconds: number, on = true): void => {
  for (let i = 0; i < seconds * 60; i++) f.update(1 / 60, actors, on);
};
const standing = (a: Actor): number => a.worldHeight * a.scale.y;
const ratioOn = (actors: readonly Actor[], boss: Actor, pose: { pos: Vector3; look: Vector3; fov: number }): number => {
  const cam = cameraAt(pose, W / H);
  const h = (a: Actor): number => {
    const b = figBox(figOf(a), cam, W, H);
    return b.b - b.t;
  };
  const party = actors.filter((a) => a.facing >= 0);
  return h(boss) / (party.reduce((s, a) => s + h(a), 0) / party.length);
};

describe('the giants table', () => {
  it('names exactly the three giants of the picks, each in the stature table and the pick, with the girls of its chapter', () => {
    expect(GIANT_ROWS.map((r) => r.id).sort()).toEqual(Object.keys(FFX2_GIANT_SHARE).sort());
    for (const r of GIANT_ROWS) {
      expect(FFX2_FIEND_STATURE[r.id], r.id).toBeDefined();
      expect(FFX2_GIRLS_MEAN[r.chapter], r.chapter).toBeGreaterThan(0);
      expect(r.views.length, r.id).toBeGreaterThan(0);
      for (const v of r.views) expect(v.aspect[0]).toBeLessThan(v.aspect[1]);
    }
  });

  it('FFX-2 only: the same painted ids on an FFX stage are no giant, and FFX\'s own Bahamut and Anima are not on the list', () => {
    const s = bevelle();
    expect(giantRow('ffx2', s.actors)?.row.id).toBe('bahamut');
    expect(giantRow('ffx', s.actors)).toBeNull();
    const ffxBahamut = [actor('tidus', 1, 0, 0, 1.75), actor('bahamut', -1, 1, -5, 4)];
    expect(giantRow('ffx2', ffxBahamut)).toBeNull(); // painted `bahamut` is Yuna's aeon of FFX
    const ffxAnima = [actor('tidus', 1, 0, 0, 1.75), actor('anima', -1, 1, -5, 4)];
    expect(giantRow('ffx2', ffxAnima)).toBeNull();
  });

  it('finds Paragon and Anima by their painted ids, and no one else: Trema, the shades, Shiva', () => {
    expect(giantRow('ffx2', cloister().actors)?.row.id).toBe('paragon');
    expect(giantRow('ffx2', road().actors)?.row.id).toBe('x2-anima');
    for (const id of ['trema', 'shade-gippal', 'x2-shiva', 'x2-ixion', 'vegnagun-body']) expect(giantRow('ffx2', [actor('yuna', 1, 0, 0, 1.8), actor(id, -1, 1, -4, 2)]), id).toBeNull();
  });

  it('has a camera for a 16:9 window and for the shapes it was proved at, and none for a shape it was not (the fight plays as it did)', () => {
    for (const r of GIANT_ROWS) {
      for (const a of [4 / 3, 1.6, 16 / 9]) expect(giantView(r, a), `${r.id} ${a}`).not.toBeNull();
      expect(giantView(r, 1.0), r.id).toBeNull(); // a square window
      expect(giantView(r, 3.0), r.id).toBeNull(); // wider than any ultrawide
    }
    // Chapter IV's and Chapter XI's rooms hold to an ultrawide (the wings of the plate, for Bahamut); Chapter XIII's plate has none and stops at 1.79
    expect(giantView(GIANT_ROWS.find((r) => r.id === 'bahamut')!, 2.37)).not.toBeNull();
    expect(giantView(GIANT_ROWS.find((r) => r.id === 'x2-anima')!, 2.37)).not.toBeNull();
    expect(giantView(GIANT_ROWS.find((r) => r.id === 'paragon')!, 2.0)).toBeNull();
  });
});

describe('the size: the pick over the girls, as a group factor on the drawn boss', () => {
  it('Bahamut 9.147 over girls of 1.82 (5.03), Paragon 9.447 over 1.75 (5.40), Anima 9.6 over 1.78 (0.7 of 7.71): the factor is that over the drawn height', () => {
    const b = bevelle();
    const p = cloister();
    const r = road();
    expect(partyWorldHeight(b.actors)).toBeCloseTo(1.82, 6);
    expect(giantFactor(giantRow('ffx2', b.actors)!.row, b.boss, 1.82)! * 4.1).toBeCloseTo(9.147, 2);
    expect(giantFactor(giantRow('ffx2', p.actors)!.row, p.boss, 1.75)! * 3.1).toBeCloseTo(9.447, 2);
    expect(giantFactor(giantRow('ffx2', r.actors)!.row, r.boss, 1.78)! * 3.4).toBeCloseTo(9.6, 2);
  });
});

describe('the exception to the party-height floor, as a rule', () => {
  it('floor 0.45 of today\'s party height against 0.9 for every other fight; overlap and cover limits wider than today\'s, no wider than the picks need', () => {
    const s = bevelle();
    const figs = s.actors.map(figOf);
    const field = { W, H, view: { l: 0, r: W, t: 0, b: H }, panels: [] };
    const { rule, todayPx } = limitsFor(figs, { pos: new Vector3(...IDLE.position), look: new Vector3(...IDLE.lookAt), fov: 32 }, field);
    expect(rule.floorPx).toBeCloseTo(0.9 * todayPx, 3);
    const g = giantRule(rule, todayPx);
    expect(g.floorPx).toBeCloseTo(GIANT_FLOOR * todayPx, 6);
    expect(GIANT_FLOOR).toBe(0.45);
    expect(g.floorPx).toBeLessThan(rule.floorPx);
    expect(g.overlapMax).toBe(rule.overlapMax); // the overlap is {@link GIANT_OVERLAP_MAX} in the plan, the rule's own is untouched
    expect(GIANT_OVERLAP_MAX).toBeGreaterThan(0.35); // Paragon's pick reads 0.35
    expect(GIANT_COVER_MAX).toBeGreaterThan(0.33); // Anima's pick reads 0.33
    expect(GIANT_FLOOR).toBeLessThan(0.51); // the least of the picks (Paragon's) stands the girls at 51 percent
  });
});

describe('Bahamut through Framing (Chapter IV, FFX-2, a 16:9 desktop)', () => {
  it('stands at his real height, under his own camera, the girls spread and he stepped right as the colossus plan has always left them', () => {
    const s = bevelle();
    const { f, cam } = framingFor();
    run(f, s.actors, 2);
    expect(f.report.plans).toBe(1);
    expect(f.report.giant).toMatchObject({ id: 'bahamut' });
    expect(standing(s.boss)).toBeCloseTo(9.147, 2);
    const row = GIANT_ROWS.find((r) => r.id === 'bahamut')!;
    const pose = giantPose(row.views[0]!);
    expect(f.masterPose!.pos.distanceTo(pose.pos)).toBeLessThan(1e-6);
    expect(f.masterPose!.look.distanceTo(pose.look)).toBeLessThan(1e-6);
    expect(f.lens).toEqual([0, 0]);
    expect(s.boss.position.x).toBeCloseTo(1.05 + row.apart, 6);
    expect(s.party[0]!.position.x).toBeLessThan(-2.05); // the leftmost girl steps back by 0.3 of his step
    expect(s.party[2]!.position.x - s.party[0]!.position.x).toBeGreaterThan(-0.9 + 2.05); // and the row is spread, 1.15
    // the idle rig is the table's; the close rigs are as the scene authored them
    const idle = cam.getRig('idle')!;
    expect(new Vector3(...idle.position).distanceTo(pose.pos)).toBeLessThan(1e-6);
    expect(cam.getRig('action')).toEqual(CLOSE);
    expect(cam.getRig('party')).toEqual(CLOSE);
    expect(cam.getRig('enemy')).toEqual(CLOSE);
  });

  it('reads 3.8 times the girls on screen (real 5.03 at one distance), the girls at about half of what they were: under the exception, over its floor', () => {
    const s = bevelle();
    const { f } = framingFor();
    run(f, s.actors, 2);
    const r = ratioOn(s.actors, s.boss, f.masterPose!);
    expect(r).toBeGreaterThan(3.3);
    expect(r).toBeLessThan(4.3);
    const px = f.report.fit!.partyPx;
    expect(px).toBeLessThan(0.9 * f.report.todayPx); // the rule every other fight keeps would hold this master
    expect(px).toBeGreaterThanOrEqual(GIANT_FLOOR * f.report.todayPx); // the exception does not
    expect(f.report.floorPx).toBe(Math.round(GIANT_FLOOR * f.report.todayPx));
    expect(f.report.fit!.ok).toBe(true);
  });

  it('keeps the plan the table made at the first menu: a live check that finds a girl under a panel does not swap a giant\'s camera', () => {
    const s = bevelle();
    const { f } = framingFor();
    run(f, s.actors, 2);
    const before = [f.masterPose!.pos.x, f.masterPose!.pos.y, f.masterPose!.pos.z];
    (f as unknown as { liveCheck(a: Actor[]): void }).liveCheck(s.actors);
    run(f, s.actors, 2);
    expect(f.report.replans).toBe(0);
    expect([f.masterPose!.pos.x, f.masterPose!.pos.y, f.masterPose!.pos.z]).toEqual(before);
  });

  it('plays as before in a window shape with no camera proved: BOSS SCALE (a boss sized by the colossus plan, not the giant\'s 2.23) and no giant in the report', () => {
    W = 900;
    H = 900; // a square window
    stubDom();
    const s = bevelle();
    const { f } = framingFor();
    run(f, s.actors, 2);
    expect(f.report.plans).toBe(1);
    expect(f.report.giant ?? null).toBeNull();
    expect(s.boss.scale.y).toBeLessThan(1.7); // BOSS SCALE's own growth for Bahamut (2.0 on screen), never the giant's 2.23
    expect(standing(s.boss)).toBeLessThan(7.5);
  });

  it('plays no giant with CHAPTER FRAMING off, on the upright phone (the scene sizes him there), or on an FFX stage with the same painted id', () => {
    const off = bevelle();
    const a = framingFor();
    run(a.f, off.actors, 2, false);
    expect(off.boss.scale.y).toBe(1);
    phone = true;
    stubDom();
    const onPhone = bevelle();
    const b = framingFor();
    run(b.f, onPhone.actors, 2);
    expect(onPhone.boss.scale.y).toBe(1);
    expect(b.f.report.giant ?? null).toBeNull();
    phone = false;
    stubDom();
    const ffx = bevelle();
    const c = framingFor('ffx');
    run(c.f, ffx.actors, 2);
    expect(c.f.report.giant ?? null).toBeNull();
  });

  it('re-plans when the window is resized to a shape with no camera proved, and again when it comes back (a drag asks once, when it stops)', () => {
    const s = bevelle();
    const { f } = framingFor();
    run(f, s.actors, 2);
    expect(f.report.giant).toMatchObject({ id: 'bahamut' });
    const plans = f.report.plans;
    W = 900;
    H = 900; // a square window: no view proved
    stubDom();
    run(f, s.actors, 2);
    expect(f.report.plans).toBeGreaterThan(plans);
    expect(f.report.giant ?? null).toBeNull();
    expect(standing(s.boss)).toBeLessThan(7.5); // BOSS SCALE's own size, not the giant's
    W = 1600;
    H = 900;
    stubDom();
    run(f, s.actors, 2);
    expect(f.report.giant).toMatchObject({ id: 'bahamut' });
    expect(standing(s.boss)).toBeCloseTo(9.147, 2);
  });

  it('keeps its plan while the window stays the size it was planned at (a window that stays the same asks for nothing)', () => {
    const s = bevelle();
    const { f } = framingFor();
    run(f, s.actors, 2);
    const plans = f.report.plans;
    run(f, s.actors, 5);
    expect(f.report.plans).toBe(plans);
  });

  it('releases the size and the camera when the switch goes off mid-fight', () => {
    const s = bevelle();
    const { f, cam } = framingFor();
    run(f, s.actors, 2);
    expect(standing(s.boss)).toBeGreaterThan(9);
    run(f, s.actors, 0.5, false);
    expect(s.boss.scale.y).toBe(1);
    expect(new Vector3(...cam.getRig('idle')!.position).distanceTo(new Vector3(...IDLE.position))).toBeLessThan(1e-6);
    f.dispose();
  });
});

describe('Paragon (Chapter XIII link 1) and Anima (Chapter XI link 3) through Framing', () => {
  it('Paragon stands at 9.447 (his real height) under his own camera; the girls stay on their slots', () => {
    const s = cloister();
    const { f } = framingFor();
    run(f, s.actors, 2);
    expect(f.report.giant).toMatchObject({ id: 'paragon' });
    expect(standing(s.boss)).toBeCloseTo(9.447, 2);
    expect(s.boss.position.x).toBeCloseTo(1.05, 9); // no step apart: the scene's own spot
    expect(s.party.map((a) => a.position.x)).toEqual([-2.05, -1.3, -0.9]);
    expect(ratioOn(s.actors, s.boss, f.masterPose!)).toBeGreaterThan(3.5);
  });

  it('Anima stands at 0.7 of her real height, 9.6, a plan of her own when she arrives on a stage that was Shiva\'s, long after the opening seconds', () => {
    const shiva = actor('x2-shiva', -1, 1.25, -2.2, 3.4);
    const { party, boss: anima } = road();
    const { f } = framingFor();
    const first = [...party, shiva];
    run(f, first, 14); // the opening is long over
    expect(f.report.plans).toBeGreaterThanOrEqual(1);
    expect(f.report.giant ?? null).toBeNull();
    const second = [...party, anima];
    run(f, second, 2);
    expect(f.report.giant).toMatchObject({ id: 'x2-anima' });
    expect(standing(anima)).toBeCloseTo(9.6, 1);
  });

  it('and takes her camera away when she is gone: the next fiend is planned under today\'s rig, at his drawn size', () => {
    const { party, boss: anima } = road();
    const { f, cam } = framingFor();
    run(f, [...party, anima], 2);
    expect(f.report.giant).toMatchObject({ id: 'x2-anima' });
    const sandy = actor('sandy', -1, 0.75, -2.6, 2.3);
    run(f, [...party, sandy], 2);
    expect(f.report.giant ?? null).toBeNull();
    expect(sandy.scale.y).toBe(1);
    expect(new Vector3(...cam.getRig('idle')!.position).distanceTo(new Vector3(...IDLE.position))).toBeLessThan(0.5);
  });
});

describe('the staging of the figures is a plan like BOSS SCALE\'s: it is put back when the plan is not played', () => {
  it('a giant whose table pose fails a rule leaves the figures exactly as they were found', () => {
    const s = bevelle();
    // the girls stand where the table's pose cannot hold them (one far outside the view): the giant plan fails and the usual plan runs
    s.party[0]!.position.x = -40;
    const { f } = framingFor();
    run(f, s.actors, 2);
    expect(f.report.giant ?? null).toBeNull();
    expect(s.party[1]!.position.x).toBeCloseTo(-1.3, 9); // nobody carries the giant plan's spread
    expect(s.party[2]!.position.x).toBeCloseTo(-0.9, 9);
  });
});
