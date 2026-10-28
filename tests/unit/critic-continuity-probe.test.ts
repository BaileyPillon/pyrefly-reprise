/**
 * The in-page probe of the continuity harness (`critic/runner/lib/continuity-probe.mjs`), run in node against a fake page that
 * has the shape of the running game: `window.__pyrefly.app` with a battle screen whose stage holds one painted actor with two
 * planes, a camera, a canvas and a battle log. The real engine cannot be built here (it needs WebGL), so what the probe
 * reads off it is pinned separately in `critic-continuity-contract.test.ts`; this proves what the probe does with it.
 *
 * Game case: both (shared critic plumbing).
 */
import { describe, expect, it } from 'vitest';
import { PROJ, fades, rig } from './critic-continuity-probe-rig.ts';

describe('what the probe records each frame', () => {
  it('records the corners of the painting\'s plane on the screen, in the order top-left, top-right, bottom-right, bottom-left', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 3; i++) await r.step();
    expect(r.probe.records).toHaveLength(3);
    const f = r.probe.records[0]!.f[0]!;
    expect(f.s[1]).toBe(0); // a plane that is neither active nor showing is not recorded
    const rec = f.s[0] as number[];
    expect(rec.slice(1, 3)).toEqual([1, 1]); // fully faded in, visible
    // the plane is 200 x 400 centred on world (400, 500): screen x 300..500, y 900-700 .. 900-300
    expect(rec.slice(3)).toEqual([300, 200, 500, 200, 500, 600, 300, 600]);
    expect(f.g).toEqual([0, 0]);
  });

  it('names the figures and the poses, with the painting each pose shows', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 2; i++) await r.step();
    const m = r.probe.meta();
    expect(m.figs).toEqual([{ id: 'hero', side: 'party', kind: 'party', artId: 'hero' }]);
    expect(m.poses[0]).toEqual({ fig: 0, pose: 'idle', url: '/art/characters/hero/idle.png', w: 800, h: 1000 });
    expect(m.view).toEqual([0, 0, 1600, 900]);
    expect(m.stats.battleFrames).toBeGreaterThan(0);
    expect(m.stats.fps).toBeGreaterThan(55);
    expect(m.stats.fps).toBeLessThan(65);
  });

  it('keeps quiet while the battle is paused or its field is not on screen yet', async () => {
    const r = rig();
    r.probe.start();
    r.screen.fieldShown = false;
    await r.step(); await r.step();
    expect(r.probe.records).toHaveLength(0);
    r.screen.fieldShown = true;
    r.app.screens.push({ name: 'pause' });
    await r.step(); await r.step();
    expect(r.probe.records).toHaveLength(0);
    r.app.screens.pop();
    await r.step();
    expect(r.probe.records).toHaveLength(1);
    expect(r.probe.meta().stats.battleSeconds).toBeLessThan(0.1); // paused and unshown time is not battle time
  });

  it('measures how far the camera alone moved the figure, so a camera cut is not the figure jumping', async () => {
    const r = rig();
    r.probe.start();
    await r.step(); await r.step();
    r.camera.matrixWorldInverse.elements[12] = -50; // the camera slides: everything moves 50 px left on the screen
    await r.step();
    const g = r.probe.records.at(-1)!.f[0]!.g;
    expect(g[0]).toBeCloseTo(-50, 0);
    expect(g[1]).toBeCloseTo(0, 0);
    await r.step(); // and it stops
    expect(r.probe.records.at(-1)!.f[0]!.g).toEqual([0, 0]);
  });

  it('records, from probe version 2, how far the camera alone moved each CORNER of a plane, and nothing while the camera is still (W4)', async () => {
    const r = rig();
    r.probe.start();
    await r.step(); await r.step();
    expect(r.probe.meta().version).toBe(3);
    expect((r.probe.records.at(-1)!.f[0]!.s[0] as number[]).length).toBe(11); // a still camera adds nothing to the record
    r.camera.matrixWorldInverse.elements[12] = -50;
    await r.step();
    const moved = r.probe.records.at(-1)!.f[0]!.s[0] as number[];
    expect(moved.length).toBe(19); // [k, fade, visible, 8 corners, 8 camera shifts]
    expect(moved.slice(11)).toEqual([-50, 0, -50, 0, -50, 0, -50, 0]); // orthographic: the same for every corner
    await r.step();
    expect((r.probe.records.at(-1)!.f[0]!.s[0] as number[]).length).toBe(11); // and it stops
  });

  it('projects the shift of each corner through its own depth: a plane in perspective is shifted more at its near edge than at its far one (W4)', async () => {
    const r = rig();
    (r.camera as unknown as { projectionMatrix: { elements: number[] } }).projectionMatrix = { elements: [...PROJ] };
    (r.camera as unknown as { projectionMatrix: { elements: number[] } }).projectionMatrix.elements[11] = 0.002; // w = 1 + 0.002 z
    r.actor.slots[0].mesh.matrixWorld.elements[2] = 200; // the plane is yawed: its left edge is 100 units nearer than the middle and its right edge 100 farther
    r.probe.start();
    await r.step(); await r.step();
    r.camera.matrixWorldInverse.elements[12] = -50;
    await r.step();
    const rec = r.probe.records.at(-1)!.f[0]!.s[0] as number[];
    const cs = rec.slice(11);
    expect(cs).toHaveLength(8);
    expect(cs[0]).toBeCloseTo(-50 / 0.8, 0); // corner 0 (left): w 0.8, so a 50 px slide of the camera is 62.5 px there
    expect(cs[2]).toBeCloseTo(-50 / 1.2, 0); // corner 1 (right): w 1.2, 41.7 px
    expect(Math.abs(cs[0]!)).toBeGreaterThan(Math.abs(cs[2]!) + 15);
  });

  it('timestamps the battle log\'s new events with the frame they arrived in', async () => {
    const r = rig();
    r.probe.start();
    await r.step();
    r.log.push({ type: 'turn-start', actorId: 'hero' });
    await r.step();
    r.log.push({ type: 'damage', targetId: 'boss', sourceId: 'hero', amount: 120, nested: { x: 1 } });
    await r.step();
    const ev = r.probe.meta().logEvents;
    expect(ev.map((e) => e.type)).toEqual(['turn-start', 'damage']);
    expect(ev[1]).toMatchObject({ targetId: 'boss', sourceId: 'hero', amount: 120 });
    expect(ev[1]).not.toHaveProperty('nested');
    expect(ev[1]!.n).toBeGreaterThan(ev[0]!.n);
  });

  it('survives a stage with no camera: it says so and does not throw', async () => {
    const r = rig();
    (r.app.screens[0].stage.opts as { camera: unknown }).camera = undefined;
    r.probe.start();
    await r.step();
    expect(r.probe.errors[0]).toMatch(/no camera/);
  });
});

describe('what the probe calls a swap', () => {
  it('is the frame where the other painting takes over, in the middle of a crossfade', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 4; i++) await r.step(); // idle holds
    r.actor.active = 1;
    for (const [a, b] of [[0.9, 0.1], [0.7, 0.3], [0.45, 0.55], [0.2, 0.8], [0, 1]] as const) { fades(r, a, b); await r.step(); }
    const sw = r.probe.meta().swaps;
    expect(sw).toHaveLength(1);
    const poses = r.probe.meta().poses;
    expect(poses[sw[0]!.from]!.pose).toBe('idle');
    expect(poses[sw[0]!.to]!.pose).toBe('attack');
    expect(sw[0]!.n).toBe(6); // 0..3 idle, 4 is 0.9/0.1, 5 is 0.7/0.3, 6 is 0.45/0.55
    // while it blends both planes are recorded
    const mid = r.probe.records.find((x) => x.n === 6)!.f[0]!;
    expect(mid.s[0]).not.toBe(0);
    expect(mid.s[1]).not.toBe(0);
  });

  it('is the frame of a cut, with the old plane still recorded at fade 0', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 4; i++) await r.step();
    r.actor.active = 1;
    fades(r, 0, 1);
    await r.step();
    const sw = r.probe.meta().swaps;
    expect(sw).toHaveLength(1);
    const f = r.probe.records.at(-1)!.f[0]!;
    expect((f.s[0] as number[])[1]).toBe(0);
    expect((f.s[1] as number[])[1]).toBe(1);
  });

  it('follows a plane re-pointed at another painting while it still shows (the KO flash)', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 4; i++) await r.step();
    fades(r, 0.3, 0.7); // the attack plane is mid-fade, idle fading in under it
    r.actor.active = 1;
    await r.step(); // the engine re-uses the attack slot for the KO painting, still at 0.7
    r.actor.slots[1].pose = 'ko';
    r.actor.poseUrls['ko'] = '/art/characters/hero/ko.png';
    await r.step();
    const poses = r.probe.meta().poses;
    const kinds = r.probe.meta().swaps.map((s) => `${poses[s.from]!.pose}>${poses[s.to]!.pose}`);
    expect(kinds).toContain('idle>attack'); // it dominated for a frame
    expect(kinds).toContain('attack>ko'); // and then the same plane showed the KO painting
  });

  it('keys a pose by its painting too: a spherechange re-points "idle" at another dressphere, and the old key keeps the old painting', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 4; i++) await r.step();
    r.actor.poseUrls['idle'] = '/art/characters/hero-b/idle.png'; // loadPoses with the new dressphere's paintings: same pose name, another file
    await r.step();
    const m = r.probe.meta();
    expect(m.poses.filter((p) => p.pose === 'idle').map((p) => p.url)).toEqual(['/art/characters/hero/idle.png', '/art/characters/hero-b/idle.png']);
    expect(m.swaps).toHaveLength(1);
    expect(m.poses[m.swaps[0]!.from]!.url).toBe('/art/characters/hero/idle.png');
    expect(m.poses[m.swaps[0]!.to]!.url).toBe('/art/characters/hero-b/idle.png');
    // the frames before the change are recorded against the old key, the ones after against the new
    const before = r.probe.records.find((x) => x.n === 3)!.f[0]!.s[0] as number[];
    const after = r.probe.records.at(-1)!.f[0]!.s[0] as number[];
    expect(before[0]).toBe(m.swaps[0]!.from);
    expect(after[0]).toBe(m.swaps[0]!.to);
  });

  it('reads the painting a plane draws off the plane itself when it says (slot.painted.url), not off the actor\'s map', async () => {
    const r = rig();
    r.actor.slots[0].painted = { url: '/art/characters/hero-c/idle.webp' };
    r.probe.start();
    for (let i = 0; i < 2; i++) await r.step();
    expect(r.probe.meta().poses[0]!.url).toBe('/art/characters/hero-c/idle.webp');
  });

  it('does not make a swap of a figure that is not showing', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 3; i++) await r.step();
    r.actor._alpha = 0.3;
    r.actor.active = 1;
    fades(r, 0, 1);
    await r.step();
    const m = r.probe.meta();
    expect(m.swaps).toHaveLength(1); // recorded (the node side leaves it out by its alpha)...
    expect(m.swaps[0]!.a).toBe(0.3);
    await r.step(); await r.step(); await r.step(); await r.step(); await r.step(); await r.step(); await r.step();
    expect(r.probe.meta().strips).toHaveLength(0); // ...but no strip is made of it
  });
});

describe('the strips', () => {
  it('cuts 6 frames before and 6 after a swap, and encodes them a couple per frame', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 8; i++) await r.step();
    r.actor.active = 1;
    fades(r, 0, 1);
    await r.step();
    expect(r.probe.meta().strips).toHaveLength(0); // the after-frames are not in yet
    for (let i = 0; i < 5; i++) await r.step();
    const strips = r.probe.meta().strips;
    expect(strips).toHaveLength(1);
    const s = strips[0]!;
    expect(s.kind).toBe('swap');
    expect(s.length).toBe(12);
    expect(s.first).toBe(s.n - 6);
    expect(s.cell[1]).toBeLessThanOrEqual(120);
    expect(s.todo).toBeGreaterThan(0); // not all encoded the frame it was cut
    for (let i = 0; i < 8; i++) await r.step();
    const done = r.probe.meta().strips[0]!;
    expect(done.todo).toBe(0);
    expect(done.have).toBe(12);
    expect(r.probe.stripFrames([done.id])[0]!.frames.every((d) => d === 'data:image/jpeg;base64,QUJD')).toBe(true);
    expect(r.encoded).toBe(12);
  });

  it('cuts 14 frames before and 6 after (r40 instrument edit (c), the policy\'s numbers), and keeps all 20 even if the ring it was asked for is shorter', async () => {
    const r = rig({ beforeFrames: 14, afterFrames: 6, ringFrames: 16 }); // 16 frames of ring would overwrite the oldest 4 cells of a 20-cell strip
    r.probe.start();
    for (let i = 0; i < 20; i++) await r.step();
    r.actor.active = 1;
    fades(r, 0, 1);
    await r.step();
    for (let i = 0; i < 5; i++) await r.step();
    const s = r.probe.meta().strips[0]!;
    expect(s.kind).toBe('swap');
    expect(s.length).toBe(20);
    expect(s.first).toBe(s.n - 14);
    for (let i = 0; i < 24; i++) await r.step();
    const done = r.probe.meta().strips[0]!;
    expect(done.todo).toBe(0);
    expect(done.have).toBe(20); // every cell is there: none was overwritten by a newer frame
    expect(r.probe.stripFrames([done.id])[0]!.frames.every((d) => d === 'data:image/jpeg;base64,QUJD')).toBe(true);
  });

  it('marks a frame that was gone (the battle had only just begun) instead of inventing it', async () => {
    const r = rig();
    r.probe.start();
    await r.step(); await r.step();
    r.actor.active = 1;
    fades(r, 0, 1);
    await r.step();
    for (let i = 0; i < 12; i++) await r.step();
    const s = r.probe.meta().strips[0]!;
    expect(s.have).toBeLessThan(12);
    expect(r.probe.stripFrames([s.id])[0]!.frames.filter((d) => d === null).length).toBeGreaterThan(0);
  });

  it('makes a strip of a jerk the figure itself makes, and not of the camera\'s', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 12; i++) { r.place(0, 400 + i * 2, 500, 200, 400); await r.step(); } // a slow drift
    r.place(0, 700, 500, 200, 400); // 280 px in one frame
    await r.step();
    for (let i = 0; i < 8; i++) await r.step();
    const jerks = r.probe.meta().strips.filter((s) => s.kind === 'jerk');
    expect(jerks).toHaveLength(1);
    expect((jerks[0]!.meta as { px: number }).px).toBeGreaterThan(250);
    // the camera moving the same 280 px is not the figure's jerk
    const c = rig();
    c.probe.start();
    for (let i = 0; i < 12; i++) await c.step();
    c.camera.matrixWorldInverse.elements[12] = 100; // 100 px: under the cut line, so the figure's own step is what is left after subtracting it
    await c.step();
    for (let i = 0; i < 8; i++) await c.step();
    expect(c.probe.meta().strips.filter((s) => s.kind === 'jerk')).toHaveLength(0);
  });

  it('makes no strip of a figure that is wholly off the frame: a crop clamped to the edge of the frame showed Seymour for Kimahri (R63-T1)', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 12; i++) { r.place(0, 400 + i * 2, 1500, 200, 400); await r.step(); } // a slow drift, far below the 900 px frame
    r.place(0, 700, 1500, 200, 400); // 280 px in one frame, with nothing of the figure on the frame
    await r.step();
    for (let i = 0; i < 8; i++) await r.step();
    expect(r.probe.meta().strips.filter((s) => s.kind === 'jerk')).toHaveLength(0);
  });

  it('stops making strips at the cap', async () => {
    const r = rig({ maxStrips: 1 });
    r.probe.start();
    for (let i = 0; i < 8; i++) await r.step();
    r.actor.active = 1;
    fades(r, 0, 1);
    await r.step();
    for (let i = 0; i < 10; i++) await r.step();
    r.actor.active = 0;
    fades(r, 1, 0);
    await r.step();
    for (let i = 0; i < 10; i++) await r.step();
    expect(r.probe.meta().swaps).toHaveLength(2);
    expect(r.probe.meta().strips).toHaveLength(1);
  });
});

describe('starting and finishing', () => {
  it('is started once, flushes what is still being encoded, and resolves finish()', async () => {
    const r = rig();
    expect(r.probe.start()).toBe(true);
    expect(r.probe.start()).toBe(false);
    for (let i = 0; i < 8; i++) await r.step();
    r.actor.active = 1;
    fades(r, 0, 1);
    for (let i = 0; i < 7; i++) await r.step();
    let finished = false;
    const done = r.probe.finish().then(() => { finished = true; });
    for (let i = 0; i < 10 && !finished; i++) await r.step();
    await done;
    expect(finished).toBe(true);
    expect(r.probe.meta().strips[0]!.todo).toBe(0);
  });

  it('drains its records in chunks', async () => {
    const r = rig();
    r.probe.start();
    for (let i = 0; i < 10; i++) await r.step();
    const a = r.probe.drain(4);
    expect(a.records).toHaveLength(4);
    expect(a.left).toBe(6);
    expect(r.probe.drain(100).left).toBe(0);
  });
});
