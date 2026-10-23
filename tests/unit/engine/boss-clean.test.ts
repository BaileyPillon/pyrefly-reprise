/**
 * Lane boss-matte (2026-10-23): the re-cut bosses' code half (`engine/look/pro/BossClean.ts`): the switch, the two art ids, the rim that is zero only while a boss part draws, the shadow fitted under the footprint.
 * Game case: Bahamut FFX-2 only, Seymour Flux FFX only; the plumbing is shared.
 */
import { Color, Mesh, Object3D, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, Vector3, type WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LookBoldShader } from '../../../src/engine/look/LookBoldShader.ts';
import { LookMainShader } from '../../../src/engine/look/LookMainShader.ts';
import { Vector4 } from 'three';
import { BossMask, MASK_LAYER, bossFigure, bossShare } from '../../../src/engine/look/pro/BossMask.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import {
  BOSS_CLEAN_ARTS,
  BOSS_FEET,
  BOSS_FEET_POSES,
  BossClean,
  attachBossClean,
  bossCleanCard,
  bossCleanFromSearch,
  bossCleanOn,
  footFit,
  footForPose,
  isCleanBossArt,
  setBossClean,
  tickBossClean,
  type FootActor,
} from '../../../src/engine/look/pro/BossClean.ts';

afterEach(() => {
  setBossClean(null);
  setDemoChapter(undefined);
});

/** A mesh whose material carries the painted shader's rim cells, as a rig part's does. */
function partMesh(rim = 0.8, bounce = 0.3, relight = { value: 0.5 }): Mesh {
  const m = new Mesh();
  (m as unknown as { material: unknown }).material = { uniforms: { rimStrength: { value: rim }, bounceStrength: { value: bounce }, relightRimAmt: relight } };
  return m;
}
const cells = (m: Mesh) => (m as unknown as { material: { uniforms: Record<string, { value: number }> } }).material.uniforms;
/** What three does around a draw: before, (the uniforms are read), after. Returns the cells as the draw saw them. */
function draw(m: Mesh): { rim: number; bounce: number; relight: number } {
  m.onBeforeRender(null as never, null as never, null as never, null as never, null as never, null as never);
  const u = cells(m);
  const seen = { rim: u['rimStrength']!.value, bounce: u['bounceStrength']!.value, relight: u['relightRimAmt']!.value };
  m.onAfterRender(null as never, null as never, null as never, null as never, null as never, null as never);
  return seen;
}

function bossActor(art: string): { actor: FootActor; part: Mesh; shadow: Mesh; ring: Mesh } {
  const actor = new Object3D() as unknown as FootActor & { contentQuad: FootActor['contentQuad'] };
  const part = partMesh();
  const shadow = new Mesh();
  shadow.name = 'contact-shadow';
  const ring = new Mesh();
  ring.name = 'turn-ring';
  actor.add(part, shadow, ring);
  actor.shadow = shadow;
  actor.contentQuad = (out) => {
    const q = out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()];
    q[0].set(10, 0, 0); // the painting's left edge, world x
    q[1].set(14, 0, 0); // its right edge
    q[2].set(14, 5, 0);
    q[3].set(10, 5, 0);
    return q;
  };
  actor.position.set(12, 0, 0);
  attachBossClean(actor, art, 'enemy');
  return { actor, part, shadow, ring };
}

describe('the switch', () => {
  it('is off by default and on with ?boss=clean or ?pack=demo; ?boss=today wins over the pack', () => {
    expect(bossCleanFromSearch(undefined)).toBe('today');
    expect(bossCleanFromSearch('')).toBe('today');
    expect(bossCleanFromSearch('?boss=clean')).toBe('clean');
    expect(bossCleanFromSearch('?demo=1&pack=demo')).toBe('clean');
    expect(bossCleanFromSearch('?pack=demo&boss=today')).toBe('today');
    expect(bossCleanFromSearch('?pack=other')).toBe('today');
  });

  it('plays only in Chapter I and Chapter IV, and only for the two bosses', () => {
    setBossClean('clean');
    expect(bossCleanOn('ffx2-bahamut')).toBe(false); // no chapter named
    setDemoChapter('ffx2-bahamut');
    expect(bossCleanOn('ffx2-bahamut')).toBe(true);
    expect(bossCleanOn('seymour-flux-body')).toBe(true);
    expect(bossCleanOn('yuna')).toBe(false);
    expect(bossCleanOn()).toBe(true); // the boss card asks without an id
    setDemoChapter('yunalesca');
    expect(bossCleanOn('ffx2-bahamut')).toBe(false);
    setDemoChapter('seymour-flux');
    setBossClean('today');
    expect(bossCleanOn('seymour-flux-body')).toBe(false);
  });

  it('the boss card takes the clean cut-out for the two bosses whenever the switch is on', () => {
    setBossClean('clean');
    expect(bossCleanCard('ffx2-bahamut')).toBe(true);
    expect(bossCleanCard('seymour-flux-body')).toBe(true);
    expect(bossCleanCard('yunalesca-1')).toBe(false);
    expect(bossCleanCard(undefined)).toBe(false);
    setBossClean('today');
    expect(bossCleanCard('ffx2-bahamut')).toBe(false);
  });

  it('names exactly the two bosses, each with its game and a footprint row', () => {
    expect(Object.keys(BOSS_CLEAN_ARTS).sort()).toEqual(['ffx2-bahamut', 'seymour-flux-body']);
    expect(BOSS_CLEAN_ARTS['ffx2-bahamut']).toBe('ffx2');
    expect(BOSS_CLEAN_ARTS['seymour-flux-body']).toBe('ffx');
    for (const k of Object.keys(BOSS_CLEAN_ARTS)) {
      expect(BOSS_FEET[k]).toBeDefined();
      expect(BOSS_FEET[k]!.cx).toBeGreaterThan(0);
      expect(BOSS_FEET[k]!.cx).toBeLessThan(1);
    }
    expect(isCleanBossArt('ffx2-bahamut')).toBe(true);
    expect(isCleanBossArt('x2-ixion')).toBe(false);
    expect(isCleanBossArt(undefined)).toBe(false);
  });

  it('attaches a controller to an enemy of those art ids only', () => {
    expect(attachBossClean(new Object3D(), 'ffx2-bahamut', 'enemy')).toBeInstanceOf(BossClean);
    expect(attachBossClean(new Object3D(), 'seymour-flux-body', 'enemy')).toBeInstanceOf(BossClean);
    expect(attachBossClean(new Object3D(), 'ffx2-bahamut', 'party')).toBeNull();
    expect(attachBossClean(new Object3D(), 'kimahri', 'enemy')).toBeNull();
  });
});

describe('the rim is zero only while a boss part draws', () => {
  it('zeroes the rim, the bounce and the relight rim for the draw and puts every number back after it', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, part } = bossActor('ffx2-bahamut');
    tickBossClean(actor);
    const seen = draw(part);
    expect(seen).toEqual({ rim: 0, bounce: 0, relight: 0 });
    const u = cells(part);
    expect([u['rimStrength']!.value, u['bounceStrength']!.value, u['relightRimAmt']!.value]).toEqual([0.8, 0.3, 0.5]);
  });

  it('leaves the party alone: the shared relight cell is back to its value for the next mesh', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    const shared = { value: 0.5 };
    const boss = bossActor('seymour-flux-body');
    cells(boss.part)['relightRimAmt'] = shared;
    tickBossClean(boss.actor);
    const partyMesh = partMesh(0.7, 0.2, shared);
    draw(boss.part);
    expect(draw(partyMesh)).toEqual({ rim: 0.7, bounce: 0.2, relight: 0.5 }); // never patched: draws with its own numbers
    expect(shared.value).toBe(0.5);
  });

  it('draws as today with the switch off, or outside the two chapters, or after a chapter change', () => {
    setBossClean('today');
    setDemoChapter('ffx2-bahamut');
    const { actor, part } = bossActor('ffx2-bahamut');
    tickBossClean(actor);
    expect(draw(part)).toEqual({ rim: 0.8, bounce: 0.3, relight: 0.5 });
    setBossClean('clean');
    tickBossClean(actor); // the next frame's tick patches the parts (nothing was scanned while it was off)
    expect(draw(part)).toEqual({ rim: 0, bounce: 0, relight: 0 });
    setDemoChapter('yunalesca');
    expect(draw(part)).toEqual({ rim: 0.8, bounce: 0.3, relight: 0.5 });
  });

  it('patches a part once however often it scans', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, part } = bossActor('ffx2-bahamut');
    const c = actor.userData['bossClean'] as BossClean;
    for (let i = 0; i < 61; i++) c.tick(actor);
    const patched = part.onBeforeRender;
    for (let i = 0; i < 61; i++) c.tick(actor);
    expect(part.onBeforeRender).toBe(patched);
    expect(draw(part)).toEqual({ rim: 0, bounce: 0, relight: 0 });
  });
});

describe('the shadow sits under the footprint', () => {
  it('footFit puts the centre at cx of the painting width and the half width at hw of it', () => {
    const f = footFit(10, 14, { cx: 0.38, hw: 0.25, squash: 0.5, boost: 1, tall: 1, drop: 0, front: 0 });
    expect(f.cx).toBeCloseTo(11.52, 6);
    expect(f.rx).toBeCloseTo(1, 6);
    const m = footFit(14, 10, { cx: 0.38, hw: 0.25, squash: 0.5, boost: 1, tall: 1, drop: 0, front: 0 }); // a mirrored figure: the painting's left edge is the right one
    expect(m.cx).toBeCloseTo(12.48, 6);
    expect(m.rx).toBeCloseTo(1, 6);
  });

  it('moves the shadow and the ring to the footprint and sizes them, only while the switch plays', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, shadow, ring } = bossActor('ffx2-bahamut');
    tickBossClean(actor);
    const foot = BOSS_FEET['ffx2-bahamut']!;
    const w = 4;
    expect(shadow.position.x).toBeCloseTo(10 + foot.cx * w - 12, 6); // local to the actor at x 12
    expect(shadow.scale.x).toBeCloseTo(foot.hw * w, 6);
    expect(shadow.scale.y).toBeCloseTo(foot.hw * w * foot.squash, 6);
    expect(ring.position.x).toBeCloseTo(shadow.position.x, 6);
    expect(ring.scale.x).toBeGreaterThan(shadow.scale.x);
    // off: nothing is written
    setBossClean('today');
    shadow.position.x = 99;
    shadow.scale.set(7, 7, 1);
    tickBossClean(actor);
    expect(shadow.position.x).toBe(99);
    expect(shadow.scale.x).toBe(7);
  });

  it('divides by the actor group scale (a planned stature)', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    const { actor, shadow } = bossActor('seymour-flux-body');
    actor.scale.setScalar(2);
    tickBossClean(actor);
    const foot = BOSS_FEET['seymour-flux-body']!;
    expect(shadow.scale.x).toBeCloseTo((foot.hw * 4) / 2, 6);
    expect(shadow.position.x).toBeCloseTo((10 + foot.cx * 4 - 12) / 2, 6);
  });
});

describe('the footprint follows the pose, and the ring keeps its own pulse', () => {
  it('has a row for every pose of both bosses, and the idle row stands in for a name it does not know', () => {
    for (const art of Object.keys(BOSS_CLEAN_ARTS)) {
      for (const pose of ['idle', 'attack', 'cast', 'hurt', 'telegraph', 'ko']) {
        const r = BOSS_FEET_POSES[art]![pose]!;
        expect(r.cx).toBeGreaterThan(0.2);
        expect(r.cx).toBeLessThan(0.7);
        expect(r.hw).toBeGreaterThan(0.1);
        expect(r.hw).toBeLessThan(0.35);
      }
      expect(footForPose(art, 'ko.2').cx).toBe(BOSS_FEET_POSES[art]!['ko']!.cx);
      expect(footForPose(art, 'no-such-pose')).toEqual(BOSS_FEET[art]);
      expect(footForPose(art, undefined)).toEqual(BOSS_FEET[art]);
    }
    expect(BOSS_FEET_POSES['seymour-flux-body']!['attack']!.cx).toBeCloseTo(0.577, 3); // review minor 1: the lunge puts his boot at 0.577 of the box, not 0.429
  });

  it('eases from one pose row to the next instead of snapping, and snaps on the first frame', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    let t = 1000;
    const now = vi.spyOn(performance, 'now').mockImplementation(() => t);
    try {
      const { actor, shadow } = bossActor('seymour-flux-body');
      const a = actor as unknown as { pose?: string };
      a.pose = 'idle';
      tickBossClean(actor);
      expect(shadow.position.x).toBeCloseTo(10 + BOSS_FEET_POSES['seymour-flux-body']!['idle']!.cx * 4 - 12, 6);
      a.pose = 'attack';
      t += 16; // one frame later: a little way along
      tickBossClean(actor);
      const idle = 10 + 0.429 * 4 - 12;
      const attack = 10 + 0.577 * 4 - 12;
      expect(shadow.position.x).toBeGreaterThan(idle);
      expect(shadow.position.x).toBeLessThan(attack - 0.2);
      t += 1000; // a long wait counts as 0.25 s: nearly there
      tickBossClean(actor);
      expect(shadow.position.x).toBeGreaterThan(attack - 0.1);
      expect(shadow.position.x).toBeLessThan(attack);
      const c = actor.userData['bossClean'] as BossClean;
      for (let i = 0; i < 20; i++) {
        t += 250;
        tickBossClean(actor);
      }
      expect(c.foot.cx).toBeCloseTo(0.577, 3);
    } finally {
      now.mockRestore();
    }
  });

  it('the turn ring keeps the actor own ease-in and pulse, and a ring the actor did not rewrite does not feed back', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, ring } = bossActor('ffx2-bahamut');
    (actor as unknown as { ringBaseRadius: number }).ringBaseRadius = 2;
    ring.scale.set(2 * 1.0, 2 * 0.46, 1); // the actor's frame: base radius, no pulse
    tickBossClean(actor);
    const flat = ring.scale.x;
    ring.scale.set(2 * 1.05, 2 * 1.05 * 0.46, 1); // the actor's next frame: a pulse of 5 percent
    tickBossClean(actor);
    expect(ring.scale.x).toBeCloseTo(flat * 1.05, 6);
    for (let i = 0; i < 5; i++) tickBossClean(actor); // the actor wrote nothing since: nothing grows
    expect(ring.scale.x).toBeCloseTo(flat * 1.05, 6);
  });

  it('Bahamut shadow is rounder and darker than the actor wrote it, once per write of the actor; Seymour keeps his', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, shadow, ring } = bossActor('ffx2-bahamut');
    const foot = BOSS_FEET['ffx2-bahamut']!;
    expect(foot.squash).toBeGreaterThan(0.8); // review major 4: 18 px deep on a 2560 frame was too thin to read
    expect(foot.boost).toBeGreaterThan(1.5);
    const mat = shadow.material as unknown as { opacity: number };
    mat.opacity = 0.4; // what the actor wrote this frame
    tickBossClean(actor);
    expect(mat.opacity).toBeCloseTo(0.4 * foot.boost, 6);
    tickBossClean(actor); // the actor wrote nothing since: nothing compounds
    tickBossClean(actor);
    expect(mat.opacity).toBeCloseTo(0.4 * foot.boost, 6);
    mat.opacity = 0.3; // the actor's next frame
    tickBossClean(actor);
    expect(mat.opacity).toBeCloseTo(0.3 * foot.boost, 6);
    mat.opacity = 0.9;
    tickBossClean(actor);
    expect(mat.opacity).toBeLessThanOrEqual(0.92); // never a black hole
    expect(shadow.scale.y).toBeCloseTo(shadow.scale.x * foot.squash, 6);
    expect(ring.scale.y / ring.scale.x).toBeCloseTo(0.46 * 0.92, 6); // the turn ring stays a flat ellipse
    setDemoChapter('seymour-flux');
    const sey = bossActor('seymour-flux-body');
    (sey.shadow.material as unknown as { opacity: number }).opacity = 0.4;
    tickBossClean(sey.actor);
    expect((sey.shadow.material as unknown as { opacity: number }).opacity).toBe(0.4);
  });

  it('the shadow stands forward of the figure while the switch plays and goes back where the actor keeps it when it stops', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const { actor, shadow } = bossActor('ffx2-bahamut');
    const foot = BOSS_FEET['ffx2-bahamut']!;
    tickBossClean(actor);
    expect(shadow.position.z).toBeCloseTo((foot.hw * 4 * foot.front) / 1, 6); // the box is 4 wide, the group scale 1
    setBossClean('today');
    tickBossClean(actor);
    expect(shadow.position.z).toBe(0);
  });

  it('a switch that is off scans and patches nothing', () => {
    setBossClean('today');
    setDemoChapter('ffx2-bahamut');
    const { actor, part } = bossActor('ffx2-bahamut');
    const before = part.onBeforeRender;
    tickBossClean(actor);
    expect(part.onBeforeRender).toBe(before);
    expect((part.userData as { __bossClean?: true }).__bossClean).toBeUndefined();
  });
});

interface Seen {
  map: unknown;
  opacity: number;
  boss: number;
  layers: number;
  override: boolean;
}

/** A fake renderer that records what the mask pass does and runs each mesh's hook the way three does, with the override material. */
function fakeRenderer(seen: Seen[]) {
  const calls: string[] = [];
  const r = {
    autoClear: true,
    shadowMap: { enabled: true },
    getRenderTarget: () => null,
    setRenderTarget: (t: unknown) => calls.push(t ? 'rt:mask' : 'rt:null'),
    getClearAlpha: () => 1,
    getClearColor: (c: Color) => c.setHex(0x112233),
    setClearColor: (_c: unknown, a?: number) => calls.push(`clear:${a}`),
    clear: () => calls.push('clear'),
    render: (scene: Scene, camera: PerspectiveCamera) => {
      const flat = scene.overrideMaterial as ShaderMaterial | null;
      scene.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh || !m.layers.test(camera.layers)) return;
        m.onBeforeRender(r as unknown as WebGLRenderer, scene, camera, m.geometry, flat as never, null as never);
        seen.push({ map: flat?.uniforms['map']!.value, opacity: flat?.uniforms['opacity']!.value as number, boss: flat?.uniforms['uBoss']!.value as number, layers: camera.layers.mask, override: !!flat });
      });
      calls.push('render');
    },
  };
  return { r: r as unknown as WebGLRenderer & typeof r, calls };
}
const figureMesh = (map: Texture, opacity = 1): Mesh => new Mesh(new PlaneGeometry(1, 1), new ShaderMaterial({ uniforms: { map: { value: map }, opacity: { value: opacity } } }));

describe('the bosses own mask (review majors 1 and 3)', () => {
  it('bossShare is the boss share of everything drawn round the pixel, and 0 with nothing drawn', () => {
    expect(bossShare([{ r: 1, a: 1 }, { r: 1, a: 1 }, { r: 1, a: 1 }])).toBeCloseTo(1, 6);
    expect(bossShare([{ r: 0, a: 1 }, { r: 0, a: 1 }])).toBeCloseTo(0, 6); // a party member: her rim stays
    expect(bossShare([{ r: 1, a: 1 }, { r: 0, a: 1 }])).toBeCloseTo(0.5, 6); // the edge between two figures
    expect(bossShare([{ r: 0, a: 0 }, { r: 0, a: 0 }])).toBe(0); // a figure the mask does not know keeps today's rim
    expect(bossShare([{ r: 1, a: 1 }, { r: 0, a: 0 }, { r: 0, a: 0 }, { r: 0, a: 1 }])).toBeCloseTo(0.5, 6);
  });

  it('draws nothing while the switch is off or outside the two chapters, and hands the shaders a 0', () => {
    const scene = new Scene();
    const boss = new Object3D();
    attachBossClean(boss, 'ffx2-bahamut', 'enemy');
    const mesh = figureMesh(new Texture());
    boss.add(mesh);
    scene.add(boss);
    const { r, calls } = fakeRenderer([]);
    const mask = new BossMask();
    const u = { tBossMask: { value: null as unknown }, bossMaskOn: { value: 1 } };
    setBossClean('today');
    setDemoChapter('ffx2-bahamut');
    mask.frame(r, scene, new PerspectiveCamera(), [{ slot: mesh, actor: boss }], 1600, 900, u);
    expect(calls).toEqual([]);
    expect(u.bossMaskOn.value).toBe(0);
    expect(u.tBossMask.value).toBeNull();
    setBossClean('clean');
    setDemoChapter('yunalesca');
    mask.frame(r, scene, new PerspectiveCamera(), [{ slot: mesh, actor: boss }], 1600, 900, u);
    expect(calls).toEqual([]);
    expect(mask.on).toBe(false);
  });

  it('draws the figures flat on its own layer: R is 1 for a boss part and 0 for anyone else, every other setting put back', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const scene = new Scene();
    const bg = new Color(0x445566);
    scene.background = bg;
    const keep = new ShaderMaterial();
    scene.overrideMaterial = keep;
    const boss = new Object3D();
    attachBossClean(boss, 'ffx2-bahamut', 'enemy');
    const party = new Object3D();
    const mapA = new Texture();
    const mapB = new Texture();
    const part = figureMesh(mapA, 0.8);
    const girl = figureMesh(mapB);
    const backdrop = new Mesh(new PlaneGeometry(1, 1), new ShaderMaterial()); // not a tracked figure: never on the mask's layer
    boss.add(part);
    party.add(girl);
    scene.add(boss, party, backdrop);
    const cam = new PerspectiveCamera();
    const before = cam.layers.mask;
    const seen: Seen[] = [];
    const { r, calls } = fakeRenderer(seen);
    const mask = new BossMask();
    const u = { tBossMask: { value: null as unknown }, bossMaskOn: { value: 0 } };
    mask.frame(r, scene, cam, [{ slot: part, actor: boss }, { slot: girl, actor: party }], 1600, 900, u);
    expect(mask.on).toBe(true);
    expect(mask.stats).toMatchObject({ draws: 1, meshes: 2, bosses: 1, w: 800, h: 450 });
    expect(calls).toEqual(['rt:mask', 'clear:0', 'clear', 'render', 'clear:1', 'rt:null']);
    expect(seen).toEqual([
      { map: mapA, opacity: 0.8, boss: 1, layers: 1 << MASK_LAYER, override: true },
      { map: mapB, opacity: 1, boss: 0, layers: 1 << MASK_LAYER, override: true },
    ]);
    expect(part.layers.isEnabled(MASK_LAYER)).toBe(true);
    expect(part.layers.isEnabled(0)).toBe(true); // still drawn by the frame
    expect(backdrop.layers.isEnabled(MASK_LAYER)).toBe(false);
    expect(cam.layers.mask).toBe(before);
    expect(scene.overrideMaterial).toBe(keep);
    expect(scene.background).toBe(bg);
    expect(r.autoClear).toBe(true);
    expect(r.shadowMap.enabled).toBe(true);
    expect(u.bossMaskOn.value).toBe(1);
    expect(u.tBossMask.value).not.toBeNull();
    mask.dispose();
  });

  it('a pose piece the pass has not scanned yet is on the mask the frame it appears (the boss actor is read, not the pass list)', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    const boss = new Object3D();
    attachBossClean(boss, 'seymour-flux-body', 'enemy');
    const known = figureMesh(new Texture());
    const mapNew = new Texture();
    boss.add(known);
    const scene = new Scene();
    scene.add(boss);
    const seen: Seen[] = [];
    const { r } = fakeRenderer(seen);
    const mask = new BossMask();
    const tracked = [{ slot: known, actor: boss }];
    mask.frame(r, scene, new PerspectiveCamera(), tracked, 800, 600, {});
    expect(seen.map((x) => x.boss)).toEqual([1]);
    const fresh = figureMesh(mapNew); // a crossfade ghost or a new pose piece, built after the pass's last scan
    boss.add(fresh);
    seen.length = 0;
    mask.frame(r, scene, new PerspectiveCamera(), tracked, 800, 600, {});
    expect(seen.map((x) => [x.boss, x.map === mapNew])).toEqual([[1, false], [1, true]]);
    expect(fresh.layers.isEnabled(MASK_LAYER)).toBe(true);
    mask.dispose();
  });

  it('a frame draw runs the mesh own hook as before, and the mask pass runs none of it', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const boss = new Object3D();
    attachBossClean(boss, 'ffx2-bahamut', 'enemy');
    const mesh = figureMesh(new Texture());
    let own = 0;
    mesh.onBeforeRender = (): void => {
      own++;
    };
    boss.add(mesh);
    const scene = new Scene();
    scene.add(boss);
    const { r } = fakeRenderer([]);
    const mask = new BossMask();
    mask.frame(r, scene, new PerspectiveCamera(), [{ slot: mesh, actor: boss }], 800, 600, {});
    expect(own).toBe(0); // the mask pass: the frame's own hook is not run
    mesh.onBeforeRender(r, scene, new PerspectiveCamera(), mesh.geometry, mesh.material as never, null as never);
    expect(own).toBe(1); // the frame: it is
    mask.dispose();
  });

  it('the main look pass owns no array uniform: ?look=cinematic without the bold pass has nothing empty to flatten (review major 3)', () => {
    const arrays = (LookMainShader.fragmentShader.match(/uniform\s+\w+\s+\w+\s*\[/g) ?? []);
    expect(arrays).toEqual([]);
    expect(LookMainShader.uniforms.tBossMask.value).toBeNull();
    expect(LookMainShader.uniforms.bossMaskOn.value).toBe(0);
    for (const sh of [LookMainShader, LookBoldShader]) {
      expect(sh.fragmentShader).toContain('bossShare(');
      expect(sh.fragmentShader).not.toContain('uRimBoss');
    }
  });

  it('a draw that throws loses no frame: the settings are back, the shaders get a 0, and it warns once', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const boss = new Object3D();
    attachBossClean(boss, 'ffx2-bahamut', 'enemy');
    const mesh = figureMesh(new Texture());
    boss.add(mesh);
    const scene = new Scene();
    scene.add(boss);
    const cam = new PerspectiveCamera();
    const before = cam.layers.mask;
    const { r } = fakeRenderer([]);
    (r as unknown as { render: () => void }).render = () => {
      throw new Error('context lost');
    };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const mask = new BossMask();
      const u = { tBossMask: { value: null as unknown }, bossMaskOn: { value: 1 } };
      expect(() => mask.frame(r, scene, cam, [{ slot: mesh, actor: boss }], 800, 600, u)).not.toThrow();
      expect(u.bossMaskOn.value).toBe(0);
      expect(cam.layers.mask).toBe(before);
      expect(scene.overrideMaterial).toBeNull();
      mask.frame(r, scene, cam, [{ slot: mesh, actor: boss }], 800, 600, u);
      expect(warn).toHaveBeenCalledTimes(1);
      mask.dispose();
    } finally {
      warn.mockRestore();
    }
  });

  it('warm compiles the mask program once before the first frame, only with the switch on, and leaves the renderer as it was', () => {
    const { r, calls } = fakeRenderer([]);
    const mask = new BossMask();
    setBossClean('today');
    setDemoChapter('ffx2-bahamut');
    mask.warm(r);
    expect(calls).toEqual([]); // off: nothing
    setBossClean('clean');
    mask.warm(r);
    expect(calls.filter((c) => c === 'render')).toHaveLength(1);
    expect(r.autoClear).toBe(true);
    expect(r.shadowMap.enabled).toBe(true);
    mask.warm(r);
    expect(calls.filter((c) => c === 'render')).toHaveLength(1); // once
    mask.dispose();
  });

  it('puts a floor pool of the room colour under a lowered boss, after the effects, and nothing when the mask is off or the boss has no lowered ellipse', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    const scene = new Scene();
    const boss = new Object3D();
    attachBossClean(boss, 'ffx2-bahamut', 'enemy');
    const mesh = figureMesh(new Texture());
    boss.add(mesh);
    scene.add(boss);
    const { r } = fakeRenderer([]);
    const mask = new BossMask();
    const PA = Array.from({ length: 4 }, () => new Vector4(0, 0, 0, 0));
    const PC = Array.from({ length: 4 }, () => new Vector4(0, 0, 0, 0));
    mask.pool(PA, PC, 1, [0.35, 0.78, 1]);
    expect(PC.every((c) => c.w === 0)).toBe(true); // the mask is not on yet
    mask.frame(r, scene, new PerspectiveCamera(), [{ slot: mesh, actor: boss }], 800, 600, {});
    mask.pool(PA, PC, 1, [0.35, 0.78, 1]);
    expect(PC.every((c) => c.w === 0)).toBe(true); // on, but the pass has set no lowered ellipse
    mask.foot.set(0.47, 0.3, 0.2, 0.05);
    mask.pool(PA, PC, 1, [0.35, 0.78, 1]);
    expect(PC[1]!.w).toBeGreaterThan(0.1);
    expect(PA[1]!.x).toBeCloseTo(0.47, 6);
    expect(PA[1]!.z).toBeGreaterThan(0.2); // wider than the ellipse
    expect(PA[1]!.w).toBeGreaterThan(0.05);
    expect(PC[1]!.z).toBeGreaterThan(PC[1]!.x); // the cool key colour, linear
    mask.pool(PA, PC, 4, [0.35, 0.78, 1]);
    expect(PC[3]!.w).toBeGreaterThan(0.1); // all four slots taken by effects: the last is the boss's
    mask.dispose();
  });

  it('copyTo is safe on uniforms without the mask (the main look pass without the bold pass): no arrays, no throw', () => {
    const mask = new BossMask();
    expect(() => mask.copyTo({})).not.toThrow();
    const u = { tBossMask: { value: 'x' as unknown }, bossMaskOn: { value: 1 } };
    mask.copyTo(u);
    expect(u.bossMaskOn.value).toBe(0);
    expect(u.tBossMask.value).toBeNull();
  });
});

describe('the bold pass draws one contact ellipse for a rigged boss', () => {
  const endFrame = (): void => new BossMask().frame(fakeRenderer([]).r, new Scene(), new PerspectiveCamera(), [], 8, 8, {});

  it('gives the first part the footprint under the whole figure, the other parts nothing, and the party nothing special', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    endFrame();
    const { actor } = bossActor('seymour-flux-body');
    const foot = BOSS_FEET['seymour-flux-body']!;
    const first = bossFigure(actor);
    expect(first).not.toBeNull();
    expect(first).not.toBe('skip');
    if (first && first !== 'skip') {
      expect(first.cx).toBeCloseTo(10 + foot.cx * 4, 6);
      expect(first.rx).toBeCloseTo(foot.hw * 4, 6);
    }
    expect(bossFigure(actor)).toBe('skip'); // the second part of the same boss, the same frame
    endFrame(); // the frame ends: the next one starts again
    expect(bossFigure(actor)).not.toBe('skip');
    endFrame();
    expect(bossFigure(new Object3D())).toBeNull(); // a party member: today's code
  });

  it('hands the bold pass the boss ellipse shape: Bahamut taller and lower, Seymour as it was', () => {
    setBossClean('clean');
    setDemoChapter('ffx2-bahamut');
    endFrame();
    const bah = bossActor('ffx2-bahamut');
    const f = bossFigure(bah.actor);
    expect(f).not.toBeNull();
    if (f && f !== 'skip') {
      expect(f.tall).toBeGreaterThan(1.2);
      expect(f.drop).toBeGreaterThan(0.4);
    }
    endFrame();
    setDemoChapter('seymour-flux');
    const sey = bossFigure(bossActor('seymour-flux-body').actor);
    if (sey && sey !== 'skip') expect([sey.tall, sey.drop]).toEqual([1, 0]);
    endFrame();
  });

  it('stands under the pose own footprint row', () => {
    setBossClean('clean');
    setDemoChapter('seymour-flux');
    endFrame();
    const { actor } = bossActor('seymour-flux-body');
    (actor as unknown as { pose: string }).pose = 'attack';
    let t = 5000;
    const now = vi.spyOn(performance, 'now').mockImplementation(() => t);
    try {
      tickBossClean(actor);
      for (let i = 0; i < 12; i++) {
        t += 250;
        tickBossClean(actor);
      }
    } finally {
      now.mockRestore();
    }
    const f = bossFigure(actor);
    expect(f).not.toBeNull();
    if (f && f !== 'skip') expect(f.cx).toBeCloseTo(10 + 0.577 * 4, 2);
    endFrame();
  });

  it('is the old code while the switch is off or outside the two chapters', () => {
    const { actor } = bossActor('ffx2-bahamut');
    setBossClean('today');
    setDemoChapter('ffx2-bahamut');
    expect(bossFigure(actor)).toBeNull();
    setBossClean('clean');
    setDemoChapter('yunalesca');
    expect(bossFigure(actor)).toBeNull();
  });
});
