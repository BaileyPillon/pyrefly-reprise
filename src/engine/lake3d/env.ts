/**
 * **The sky as the models' environment** (the hidden Wendigo chapter's 3D stage; FFX only): the Meshy bodies, weapons, props and the shore are physically based materials, and a physically based material without an environment
 * has nothing to reflect: metal reads black and cloth, fur and ice read flat. This builds one **once**, on the first frame that reaches the sky dome: the dome's own shader (the aurora, the moon, the stars, the teal horizon)
 * drawn into a cube map by three's `PMREMGenerator` (the renderer is only known at draw time, so the dome's `onBeforeRender` is where it can be made), and lays it on the scene as `scene.environment` at a modest
 * intensity. It is a still of the sky at that moment (the aurora does not move in it), which is all a reflection needs. The scene's previous environment and intensity are put back on dispose.
 *
 * Needs three.js and a WebGL renderer at draw time; nothing is made in a test. Game case: FFX only.
 */

import { Mesh, PMREMGenerator, Scene, ShaderMaterial, SphereGeometry, type Camera, type Texture, type WebGLRenderTarget, type WebGLRenderer } from 'three';

/** How much of the environment the materials take. */
export const ENV = { intensity: 0.55, size: 48, sigma: 0.04 } as const;

export class SkyEnvironment {
  private target: WebGLRenderTarget | null = null;
  private scene: Scene | null = null;
  private was: { texture: Texture | null; intensity: number } | null = null;
  private made = false;

  /** `dome` is the sky mesh (its material is cloned for the cube; the original is not touched). */
  constructor(private readonly dome: Mesh) {}

  /** Whether the environment has been made. */
  get ready(): boolean {
    return this.target !== null;
  }

  /** Make the environment from the dome as the renderer draws it, and put it on `scene`. A second call does nothing. */
  build(renderer: WebGLRenderer, scene: Scene, _camera: Camera): void {
    if (this.made) return;
    this.made = true;
    try {
      const source = this.dome.material as ShaderMaterial;
      const material = source.clone();
      material.uniforms = source.uniforms; // the same cells: the cube sees the aurora as it is now
      const sphere = new Mesh(new SphereGeometry(ENV.size, 32, 16), material);
      sphere.frustumCulled = false;
      const envScene = new Scene();
      envScene.add(sphere);
      const generator = new PMREMGenerator(renderer);
      this.target = generator.fromScene(envScene, ENV.sigma, 0.1, ENV.size * 2);
      generator.dispose();
      sphere.geometry.dispose();
      material.dispose();
      this.scene = scene;
      this.was = { texture: scene.environment, intensity: scene.environmentIntensity };
      scene.environment = this.target.texture;
      scene.environmentIntensity = ENV.intensity;
    } catch {
      this.target = null; // a card that cannot do it plays without
    }
  }

  dispose(): void {
    if (this.scene && this.target && this.scene.environment === this.target.texture) {
      this.scene.environment = this.was?.texture ?? null;
      this.scene.environmentIntensity = this.was?.intensity ?? 1;
    }
    this.target?.dispose();
    this.target = null;
    this.scene = null;
  }
}
