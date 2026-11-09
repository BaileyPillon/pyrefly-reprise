/**
 * The sky as the models' environment (`src/engine/lake3d/env.ts`; FFX only), with the cube generator stood in for (no GPU in a test): it is made once, on the first draw, from a copy of the dome's shader with the dome's own
 * uniform cells, laid on the scene at its intensity, and the scene's previous environment is put back on dispose.
 */
import { Mesh, Scene, ShaderMaterial, SphereGeometry, type Camera, type Texture, type WebGLRenderer } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

const made: Array<{ disposed: boolean; texture: Texture }> = [];
let fail = false;

vi.mock('three', async (original) => {
  const three = await original<typeof import('three')>();
  class FakePMREM {
    fromScene(scene: import('three').Scene): { texture: Texture; dispose(): void } {
      if (fail) throw new Error('no float targets');
      expect(scene.children).toHaveLength(1); // the dome's copy, alone
      const target = { disposed: false, texture: { name: 'cube' } as unknown as Texture, dispose(): void { target.disposed = true; } };
      made.push(target);
      return target;
    }
    dispose(): void {}
  }
  return { ...three, PMREMGenerator: FakePMREM };
});

const { ENV, SkyEnvironment } = await import('../../../src/engine/lake3d/env.ts');

const renderer = {} as WebGLRenderer;
const camera = {} as Camera;

function dome(): Mesh {
  return new Mesh(new SphereGeometry(5, 4, 4), new ShaderMaterial({ uniforms: { uTime: { value: 3 } } }));
}

afterEach(() => {
  made.length = 0;
  fail = false;
});

describe('SkyEnvironment', () => {
  it('is made once, on the first draw, and laid on the scene at its intensity', () => {
    const scene = new Scene();
    const env = new SkyEnvironment(dome());
    expect(env.ready).toBe(false);
    env.build(renderer, scene, camera);
    expect(env.ready).toBe(true);
    expect(scene.environment).toBe(made[0]!.texture);
    expect(scene.environmentIntensity).toBe(ENV.intensity);
    env.build(renderer, scene, camera);
    expect(made).toHaveLength(1);
  });

  it('puts the scene\'s own environment back, and frees the cube, on dispose', () => {
    const scene = new Scene();
    const before = { name: 'before' } as unknown as Texture;
    scene.environment = before;
    scene.environmentIntensity = 0.8;
    const env = new SkyEnvironment(dome());
    env.build(renderer, scene, camera);
    env.dispose();
    expect(scene.environment).toBe(before);
    expect(scene.environmentIntensity).toBe(0.8);
    expect(made[0]!.disposed).toBe(true);
    expect(env.ready).toBe(false);
  });

  it('leaves another environment alone if something else replaced it meanwhile', () => {
    const scene = new Scene();
    const env = new SkyEnvironment(dome());
    env.build(renderer, scene, camera);
    const other = { name: 'other' } as unknown as Texture;
    scene.environment = other;
    env.dispose();
    expect(scene.environment).toBe(other);
  });

  it('plays without it when the card cannot make the cube', () => {
    fail = true;
    const scene = new Scene();
    const env = new SkyEnvironment(dome());
    expect(() => env.build(renderer, scene, camera)).not.toThrow();
    expect(env.ready).toBe(false);
    expect(scene.environment).toBeNull();
    env.build(renderer, scene, camera); // and does not try again every frame
    expect(made).toHaveLength(0);
  });

  it('does not touch the dome\'s own material', () => {
    const d = dome();
    const material = d.material as ShaderMaterial;
    const env = new SkyEnvironment(d);
    env.build(renderer, new Scene(), camera);
    expect(d.material).toBe(material);
    expect(material.uniforms['uTime']!.value).toBe(3);
  });
});
