/**
 * **The object that draws a Wind Waker hit** (`src/engine/ww3d/hitFx.ts`; the hidden Wind Waker chapter, FFX-2 only), driven without a renderer: bursts start and end, the star and the smoke show and hide on their
 * own clocks, every material is flat and under the bloom (nothing additive, no depth test), each piece faces the live camera in its own `onBeforeRender`, the star is capped by the lens, and everything is freed.
 */
import { Mesh, MeshBasicMaterial, PerspectiveCamera, Quaternion, Vector3, AdditiveBlending, type WebGLRenderer, type Scene } from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { HitFx } from '../../../src/engine/ww3d/hitFx.ts';
import { HIT_COLOURS, STAR_LAYERS, STAR_LIFE, STAR_POP, burstLife, hitPlan, luminanceOf, puffLayout, starCapRadius, starScale } from '../../../src/engine/ww3d/hitBurst.ts';
import { PARTY_HEIGHT } from '../../../src/engine/ww3d/layout.ts';

const open: HitFx[] = [];
const make = (): HitFx => {
  const fx = new HitFx();
  open.push(fx);
  return fx;
};
afterEach(() => {
  for (const fx of open.splice(0)) fx.dispose();
});

const meshes = (fx: HitFx): Mesh[] => fx.group.children as Mesh[];
const run = (fx: HitFx, seconds: number, dt = 1 / 60): void => {
  for (let t = 0; t < seconds - 1e-9; t += dt) fx.update(dt);
};
const camera = (pos: [number, number, number] = [1, 0.37, 3.2], fov = 49): PerspectiveCamera => {
  const c = new PerspectiveCamera(fov, 16 / 9, 0.1, 200);
  c.position.set(...pos);
  c.lookAt(1, 1.5, -3);
  c.updateMatrixWorld(true);
  return c;
};
/** Run a mesh's `onBeforeRender` the way the renderer does, with the live camera. */
const render = (m: Mesh, cam: PerspectiveCamera): void => {
  (m.onBeforeRender as (r: WebGLRenderer, s: Scene, c: PerspectiveCamera) => void)({} as WebGLRenderer, {} as Scene, cam);
};
const AT = new Vector3(-0.34, 0.9, 0.89);

describe('starting and ending a burst', () => {
  it('holds nothing at first, then three star meshes and three meshes for each puff while a burst lives, and nothing again when it is over', () => {
    const fx = make();
    expect(fx.active).toBe(0);
    expect(fx.meshCount).toBe(0);
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    expect(fx.active).toBe(1);
    expect(fx.meshCount).toBe(3 + 3 * 4); // a plain blow throws four puffs
    expect(fx.bursts[0]!.points).toBe(5);
    expect(fx.bursts[0]!.puffs).toBe(4);
    run(fx, 2);
    expect(fx.active).toBe(0);
    expect(fx.meshCount).toBe(0);
  });

  it('lives as long as its latest puff (under about a second), not as long as the star', () => {
    const fx = make();
    fx.burst(AT, { heavy: true, hitIndex: 0 }, PARTY_HEIGHT);
    const life = burstLife(puffLayout(5, 1));
    expect(life).toBeGreaterThan(STAR_LIFE);
    run(fx, STAR_LIFE + 0.05);
    expect(fx.active).toBe(1); // the star is over, the smoke is not
    run(fx, 1.2);
    expect(fx.active).toBe(0);
  });

  it('runs several bursts at once (the Energy Blast lands on three girls together), each on its own clock, and a heavy one has six points and five puffs', () => {
    const fx = make();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    run(fx, 0.1);
    fx.burst(new Vector3(0, 1, 0), { heavy: true, hitIndex: 0 }, PARTY_HEIGHT);
    fx.burst(new Vector3(1, 1, -1), { heavy: false, hitIndex: 1 }, PARTY_HEIGHT);
    expect(fx.active).toBe(3);
    const v = fx.bursts;
    expect(v[0]!.age).toBeGreaterThan(v[1]!.age);
    expect([v[1]!.points, v[1]!.puffs]).toEqual([6, 5]);
    expect([v[2]!.points, v[2]!.puffs]).toEqual([4, 3]);
    expect(fx.meshCount).toBe(3 + 12 + 3 + 15 + 3 + 9);
  });

  it('frees its meshes on dispose, and a disposed effect can be disposed again', () => {
    const fx = new HitFx();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    fx.dispose();
    expect(fx.active).toBe(0);
    expect(fx.meshCount).toBe(0);
    expect(() => fx.dispose()).not.toThrow();
  });
});

describe('what shows when', () => {
  it('shows the star from the first frame and its smoke only once each puff has begun, and hides the star when it has shrunk away', () => {
    const fx = make();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    const [outline, body, core, ...smoke] = meshes(fx);
    expect([outline, body, core].every((m) => m!.visible)).toBe(true);
    expect(smoke.every((m) => !m.visible)).toBe(true); // nothing has been updated yet: no puff has begun
    run(fx, 0.03);
    expect(smoke.filter((m) => m.visible).length).toBeGreaterThan(0); // the first puff has begun (its delay is a few hundredths)
    expect(smoke.filter((m) => m.visible).length).toBeLessThan(smoke.length); // and the last has not
    run(fx, 0.12);
    expect(smoke.filter((m) => m.visible).length).toBeGreaterThanOrEqual(9); // by now every puff has begun (3 meshes each)
    run(fx, STAR_LIFE);
    expect([outline, body, core].every((m) => !m!.visible)).toBe(true);
  });

  it('fades a puff by plain opacity (its three meshes together), from opaque at the start to almost gone at the end of its life', () => {
    const fx = make();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    run(fx, 0.2);
    const first = meshes(fx).slice(3, 6).map((m) => (m.material as MeshBasicMaterial).opacity);
    expect(first[0]).toBeGreaterThan(0.9);
    expect(new Set(first).size).toBe(1);
    run(fx, 0.3);
    const later = meshes(fx).slice(3, 6).map((m) => (m.material as MeshBasicMaterial).opacity);
    expect(later[0]).toBeLessThan(0.7);
    expect(later[0]).toBeGreaterThanOrEqual(0);
  });
});

describe('flat, and under the bloom', () => {
  it('draws every piece in a plain basic material: not additive, no depth test or write, not tone-mapped, no fog, a flat colour under 1.0 in luminance', () => {
    const fx = make();
    fx.burst(AT, { heavy: true, hitIndex: 0 }, PARTY_HEIGHT);
    for (const m of meshes(fx)) {
      const mat = m.material as MeshBasicMaterial;
      expect(mat).toBeInstanceOf(MeshBasicMaterial);
      expect(mat.blending).not.toBe(AdditiveBlending);
      expect(mat.depthTest).toBe(false);
      expect(mat.depthWrite).toBe(false);
      expect(mat.toneMapped).toBe(false);
      expect(mat.fog).toBe(false);
      expect(mat.transparent).toBe(true);
      expect(mat.map).toBeNull();
      const c = mat.color;
      expect(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b).toBeLessThan(1);
      expect(m.frustumCulled).toBe(false);
    }
  });

  it('uses the star\'s three colours on its three layers (outline, body, core) and white and pale blue on the smoke', () => {
    const fx = make();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    const hex = (m: Mesh): string => `#${(m.material as MeshBasicMaterial).color.getHexString()}`;
    const [o, b, c, line, white, curl] = meshes(fx);
    expect(hex(o!)).toBe(HIT_COLOURS.outline);
    expect(hex(b!)).toBe(HIT_COLOURS.body);
    expect(hex(c!)).toBe(HIT_COLOURS.core);
    expect(hex(line!)).toBe(HIT_COLOURS.puffLine);
    expect(hex(white!)).toBe(HIT_COLOURS.puff);
    expect(hex(curl!)).toBe(HIT_COLOURS.puffLine);
    for (const h of Object.values(HIT_COLOURS)) expect(luminanceOf(h)).toBeLessThan(1);
  });

  it('draws the smoke under the star and the star\'s layers in order (the outline first, the white core on top)', () => {
    const fx = make();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    const [o, b, c, line, white, curl] = meshes(fx);
    const order = [line, white, curl, o, b, c].map((m) => m!.renderOrder);
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]!);
  });
});

describe('facing the live camera', () => {
  it('turns the star to the camera, at the burst\'s point, at its popped size times each layer\'s share', () => {
    const fx = make();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    run(fx, STAR_POP);
    const popped = starScale(fx.bursts[0]!.age); // the frame step does not land on the pop's end exactly: read where the star is
    expect(popped).toBeGreaterThan(1);
    const cam = camera();
    const [outline, body, core] = meshes(fx);
    for (const m of [outline!, body!, core!]) render(m, cam);
    expect(outline!.position.distanceTo(AT)).toBeLessThan(1e-9);
    const wanted = Math.min(hitPlan(PARTY_HEIGHT, { heavy: false, hitIndex: 0 }).radius, starCapRadius(cam.position.distanceTo(AT), cam.fov));
    expect(outline!.scale.x).toBeCloseTo(wanted * popped * STAR_LAYERS.outline, 6);
    expect(body!.scale.x).toBeCloseTo(wanted * popped * STAR_LAYERS.body, 6);
    expect(core!.scale.x).toBeCloseTo(wanted * popped * STAR_LAYERS.core, 6);
    // facing the camera: the star's own forward (+z) is the camera's backward, up to the spin about it
    const normal = new Vector3(0, 0, 1).applyQuaternion(outline!.quaternion);
    const toCam = cam.position.clone().sub(AT).normalize();
    const camBack = new Vector3(0, 0, 1).applyQuaternion(cam.getWorldQuaternion(new Quaternion()));
    expect(normal.dot(camBack)).toBeGreaterThan(0.999);
    expect(normal.dot(toCam)).toBeGreaterThan(0.8); // and roughly toward where the camera is
  });

  it('caps the star to a share of the frame by the live lens: the same burst is smaller close up than far away', () => {
    const fx = make();
    fx.burst(AT, { heavy: true, hitIndex: 0 }, PARTY_HEIGHT);
    run(fx, STAR_POP);
    const [outline] = meshes(fx);
    render(outline!, camera([-0.3, 0.9, 1.6])); // nearly on top of her
    const near = outline!.scale.x;
    expect(fx.bursts[0]!.drawn).toBeLessThan(fx.bursts[0]!.radius);
    render(outline!, camera([1, 0.37, 9]));
    const far = outline!.scale.x;
    expect(near).toBeLessThan(far);
    expect(fx.bursts[0]!.drawn).toBeCloseTo(fx.bursts[0]!.radius, 6); // far enough that the plan's size stands
    expect(far).toBeCloseTo(fx.bursts[0]!.radius * starScale(fx.bursts[0]!.age), 6);
  });

  it('puts each puff above the burst by the camera\'s own up, rising as it ages, and shrinks the star to nothing by the end of its life', () => {
    const fx = make();
    fx.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    const cam = camera();
    run(fx, 0.1);
    const fill = meshes(fx)[4]!;
    render(fill, cam);
    const early = fill.position.clone().sub(AT).dot(new Vector3(0, 1, 0));
    run(fx, 0.3);
    render(fill, cam);
    const later = fill.position.clone().sub(AT).dot(new Vector3(0, 1, 0));
    expect(later).toBeGreaterThan(early);
    expect(later - early).toBeGreaterThan(0.05); // it has drifted up by a real distance, not a jitter
    expect(fill.scale.x).toBeGreaterThan(0.05); // a puff is a real size: a fraction of the star's radius
    run(fx, STAR_LIFE);
    const [outline] = meshes(fx);
    render(outline!, cam);
    expect(outline!.scale.x).toBeLessThan(1e-3);
  });

  it('is deterministic: the same hit twice is laid out the same way, and the next hit another way', () => {
    const a = make();
    const b = make();
    a.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    b.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    run(a, 0.2);
    run(b, 0.2);
    const cam = camera();
    const pos = (fx: HitFx): number[] => {
      const m = meshes(fx)[4]!;
      render(m, cam);
      return m.position.toArray();
    };
    expect(pos(a)).toEqual(pos(b));
    a.burst(AT, { heavy: false, hitIndex: 0 }, PARTY_HEIGHT);
    run(a, 0.2);
    const second = meshes(a).slice(-9)[1]!;
    render(second, cam);
    expect(second.position.toArray()).not.toEqual(pos(b));
  });
});
