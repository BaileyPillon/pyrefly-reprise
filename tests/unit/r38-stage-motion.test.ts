/**
 * r38-motion RUN-IN's field (`motion/StageMotion.ts`, `BattleCamera.truck`): the camera truck, the painted spans and screen rectangles
 * the stand-off reads, and the smear's afterimages. Real `three` objects, no GPU.
 */
import { describe, expect, it } from 'vitest';
import { Group, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, Texture, Vector3 } from 'three';
import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { GHOST, StageMotion } from '../../src/engine/motion/StageMotion.ts';

function setup(o: { lowEffects?: boolean; warmFor?: () => string | undefined } = {}) {
  const cam = new PerspectiveCamera(32, 16 / 9, 0.1, 100);
  const rigs = { idle: { position: [0, 2.3, 8.2] as [number, number, number], lookAt: [0, 1.4, 0] as [number, number, number] } };
  const battle = new BattleCamera(cam, { rigs, initial: 'idle', swayAmplitude: 0 });
  const scene = new Scene();
  // One figure: a group at the feet with a painted plane (a shader material with a map), 1.8 tall, 0.9 wide.
  const figure = new Group();
  figure.position.set(-1, 0, 1);
  const map = new Texture();
  const mat = new ShaderMaterial({ uniforms: { map: { value: map } } });
  const plane = new Mesh(new PlaneGeometry(1, 1), mat);
  plane.scale.set(0.9, 1.8, 1);
  plane.position.y = 0.9;
  figure.add(plane);
  scene.add(figure);
  const motion = new StageMotion({
    scene,
    camera: battle,
    quadOf: (id, out) => {
      if (id !== 'paine') return null;
      figure.updateWorldMatrix(true, true);
      const c = [new Vector3(-0.45, 0, 0), new Vector3(0.45, 0, 0), new Vector3(0.45, 1.8, 0), new Vector3(-0.45, 1.8, 0)];
      c.forEach((v, i) => out[i]!.copy(v).add(figure.position));
      return out;
    },
    figure: (id) => (id === 'paine' ? figure : undefined),
    view: () => ({ w: 1600, h: 900 }),
    lowEffects: () => o.lowEffects === true,
    ...(o.warmFor ? { warmFor: o.warmFor } : {}),
  });
  return { cam, battle, scene, figure, plane, motion };
}

describe('the camera truck', () => {
  it('slides the camera and its look-at together on top of the rig, and back', async () => {
    const { cam, battle, motion } = setup();
    battle.update(1);
    const rest = cam.position.clone();
    const restQuat = cam.quaternion.clone();
    const slid = motion.truck(1.5, 0.2, 0, 400);
    for (let i = 0; i < 40; i++) battle.update(0.016), motion.update(0.016);
    await slid;
    expect(cam.position.x - rest.x).toBeCloseTo(1.5, 5);
    expect(cam.position.y - rest.y).toBeCloseTo(0.2, 5);
    expect(cam.quaternion.angleTo(restQuat)).toBeLessThan(1e-6); // a slide, not a pan: the orientation is untouched
    const back = motion.truck(0, 0, 0, 300);
    for (let i = 0; i < 30; i++) battle.update(0.016), motion.update(0.016);
    await back;
    expect(cam.position.distanceTo(rest)).toBeLessThan(1e-6);
  });

  it('one truck at a time: a new call settles the one in flight, and 1 ms is a cut', async () => {
    const { battle, motion } = setup();
    const first = motion.truck(2, 0, 0, 800);
    motion.update(0.1);
    const second = motion.truck(0, 0, 0, 1);
    await first; // settled by the replacement, not left waiting
    await second;
    expect(battle.truck.length()).toBe(0);
  });
});

describe('painted spans and screen rectangles', () => {
  it('reports the world bounds of a painted box, and null for a figure that is not on the field', () => {
    const { motion } = setup();
    expect(motion.span('paine')).toEqual({ x0: -1.45, x1: -0.55, y0: 0, y1: 1.8, z: 1 });
    expect(motion.span('nobody')).toBeNull();
    expect(motion.rect('nobody')).toBeNull();
  });

  it('projects the box on the camera\'s rest pose, as if her feet stood elsewhere, and slid by a truck', () => {
    const { motion, battle } = setup();
    battle.update(0);
    const home = motion.rect('paine')!;
    const away = motion.rect('paine', { at: { x: 1, y: 0, z: 1 } })!;
    expect(away.x).toBeGreaterThan(home.x + 100); // two units to the right: a long way across the frame
    expect(away.h).toBeCloseTo(home.h, 3); // the same depth, the same size
    const deeper = motion.rect('paine', { at: { x: -1, y: 0, z: -4 } })!;
    expect(deeper.h).toBeLessThan(home.h * 0.7);
    const trucked = motion.rect('paine', { truck: { x: 1, y: 0, z: 0 } })!;
    expect(trucked.x).toBeLessThan(home.x); // the camera moved right, so she moves left in the frame
    expect(motion.view()).toEqual({ w: 1600, h: 900 });
  });
});

describe('the smear', () => {
  const ghosts = (scene: Scene): Mesh[] => scene.children.filter((c): c is Mesh => (c as Mesh).isMesh === true && (c as Mesh).matrixAutoUpdate === false);

  it('leaves a few translucent copies of her own painted plane, wearing her texture and her transform, that fade out', () => {
    const { scene, motion, figure, plane } = setup();
    figure.position.x = 0;
    motion.smear('paine', 300, 0.7);
    for (let i = 0; i < 20; i++) {
      figure.position.x += 0.1;
      motion.update(0.016);
    }
    const g = ghosts(scene);
    expect(g.length).toBeGreaterThan(1);
    expect(g.length).toBeLessThanOrEqual(GHOST.max);
    const mat = g[0]!.material as ShaderMaterial;
    expect(mat.uniforms['map']!.value).toBe((plane.material as ShaderMaterial).uniforms['map']!.value); // no new texture
    expect(Math.max(...g.map((m) => (m.material as ShaderMaterial).uniforms['opacity']!.value as number))).toBeGreaterThan(0.05);
    for (let i = 0; i < 40; i++) motion.update(0.016); // the run is over, they fade
    expect(g.every((m) => !m.visible)).toBe(true);
  });

  it('touches neither the figure\'s shader nor its geometry (LIVING PAINTINGS sway and cast shadow keep working)', () => {
    const { motion, plane } = setup();
    const shader = (plane.material as ShaderMaterial).vertexShader;
    const geometry = plane.geometry;
    motion.smear('paine', 300);
    for (let i = 0; i < 20; i++) motion.update(0.016);
    expect((plane.material as ShaderMaterial).vertexShader).toBe(shader);
    expect(plane.geometry).toBe(geometry);
  });

  it('draws nothing at LOW EFFECTS', () => {
    const { scene, motion } = setup({ lowEffects: true });
    motion.smear('paine', 300);
    for (let i = 0; i < 20; i++) motion.update(0.016);
    expect(ghosts(scene)).toEqual([]);
  });

  it('disposes its copies with the stage', () => {
    const { scene, motion } = setup();
    motion.smear('paine', 300);
    for (let i = 0; i < 20; i++) motion.update(0.016);
    motion.dispose();
    expect(ghosts(scene)).toEqual([]);
  });
});

describe('the program warm-up (no first-run hitch)', () => {
  const ghosts = (scene: Scene): Mesh[] => scene.children.filter((c): c is Mesh => (c as Mesh).isMesh === true && (c as Mesh).matrixAutoUpdate === false);

  it('draws one afterimage at no opacity for a few frames, then takes it out once, keeping its material', () => {
    const { scene, motion } = setup();
    expect(motion.warm('paine')).toBe(true);
    const g = ghosts(scene);
    expect(g).toHaveLength(1);
    const mat = g[0]!.material as ShaderMaterial;
    expect(mat.uniforms['opacity']!.value).toBe(0); // nothing to see
    let disposed = 0;
    mat.addEventListener('dispose', () => disposed++);
    for (let i = 0; i < 3; i++) motion.update(0.016); // drawn for a couple of frames: the program compiles on the first
    expect(ghosts(scene)).toEqual([]);
    expect(disposed).toBe(0); // a program lives while a material uses it
    expect(motion.warm('paine')).toBe(true); // once only
    expect(ghosts(scene)).toEqual([]);
    motion.dispose();
    expect(disposed).toBe(1);
  });

  it('waits for the figure\'s painting, and is not needed at LOW EFFECTS', () => {
    const none = setup();
    expect(none.motion.warm('nobody')).toBe(false); // no painting up yet: ask again next frame
    expect(ghosts(none.scene)).toEqual([]);
    const low = setup({ lowEffects: true });
    expect(low.motion.warm('paine')).toBe(true);
    expect(ghosts(low.scene)).toEqual([]);
  });

  it('asks the stage whom to warm with each frame until it is done, and never when it says no one', () => {
    let who: string | undefined;
    const asked: number[] = [];
    const { scene, motion } = setup({ warmFor: () => { asked.push(1); return who; } });
    motion.update(0.016);
    motion.update(0.016);
    expect(asked.length).toBe(2);
    expect(ghosts(scene)).toEqual([]);
    who = 'paine';
    motion.update(0.016);
    expect(ghosts(scene)).toHaveLength(1);
    for (let i = 0; i < 5; i++) motion.update(0.016);
    const n = asked.length;
    for (let i = 0; i < 5; i++) motion.update(0.016);
    expect(asked.length).toBe(n); // done: it stops asking
  });
});
