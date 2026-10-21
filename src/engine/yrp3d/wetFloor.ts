/**
 * **The wet tile floor** (the hidden 3D Bahamut chapter; FFX-2 only): the look lab's floor as a scene object. A three.js `Reflector` (a mirror render of the figures) with the lab's own shader (`./wetFloorShader.ts`): dark violet tiles,
 * the lantern streaks of the painted backdrop, the figures reflected and smeared, dissolving into the painting at the far end. It replaces Chapter IV's machina deck in this chapter (the stage hides the deck and its reflection sheet).
 * Brought over from the look lab's branch (`exp-yrp-3d`) unchanged but for where its brush grain texture comes from (`./grain.ts`, given by the stage).
 *
 * ## An extra render and the mirror, from inside the floor's draw (`./nested.ts`)
 *
 * - **The backdrop alone**, from the camera that is drawing the frame, into a small target (`FLOOR.backScale` of the frame on a side: the streaks are blurred anyway): only objects on the backdrop layer (`LAYER.backdrop`; the stage
 *   puts the Backdrop's whole group on it). The shader mirrors it about the floor's horizon in screen space.
 * - **The figures alone**, the `Reflector`'s own mirror render, narrowed to the figure layer (`LAYER.figure`, which every figure mesh and every light of the figures' rig is on: `./shade.ts`, `./rig.ts`, so the reflected figures are lit) and with no background (a background colour would be reflected everywhere).
 *
 * The floor is transparent (it fades out toward the painting), draws before everything else that is transparent (`renderOrder` -50, as the deck did) and writes no depth, so the light pools, the hole and the shafts draw over it.
 * Its output is linear: the chapter's scene grade (the stage's palette) encodes it, as it encodes the painting.
 *
 * Needs three.js and its `Reflector`; no DOM. Game case: FFX-2 only.
 */

import { HalfFloatType, LinearFilter, PlaneGeometry, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget, Color, type Camera, type Scene, type Texture, type WebGLRenderer } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { LAYER } from './look.ts';
import { frameSize, renderNested } from './nested.ts';
import { FLOOR, FLOOR_FRAG, FLOOR_VERT } from './wetFloorShader.ts';

/** The floor's draw order: before every other transparent thing in the scene (Chapter IV's deck drew at the same place). */
export const FLOOR_RENDER_ORDER = -50;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** The screen height (0 at the bottom, 1 at the top) of the floor's horizon, the line the lantern streaks mirror about: where the floor dissolves into the painting, seen from `camera`. */
export function horizonHeight(camera: Camera, scratch: Vector3 = new Vector3()): number {
  scratch.set(FLOOR.horizonX, 0, FLOOR.horizonZ).project(camera);
  return clamp01(scratch.y * 0.5 + 0.5);
}

export class WetFloor {
  /** The reflector mesh: add it to the scene's group. */
  readonly mesh: Reflector;
  private back: WebGLRenderTarget | null = null;
  private readonly size = new Vector2();
  private readonly scratch = new Vector3();
  /** Frames the backdrop-only render was drawn (a test's read). */
  backdropFrames = 0;

  /** `grain` is the brush grain texture the tiles take their tooth from (`./grain.ts`). */
  constructor(grain: Texture) {
    const lin = (hex: number): Color => new Color(hex); // sRGB hex in, linear stored
    const shader = {
      name: 'wet-floor',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        tBack: { value: null },
        uRes: { value: new Vector2(1920, 1080) },
        uYh: { value: 0.57 },
        uBaseNear: { value: lin(FLOOR.baseNear) },
        uBaseFar: { value: lin(FLOOR.baseFar) },
        uStretch: { value: FLOOR.streakStretch },
        uStreak: { value: FLOOR.streak },
        uBlurPx: { value: FLOOR.streakBlurPx },
        uFall: { value: FLOOR.falloff },
        uFigRefl: { value: FLOOR.figureReflection },
        uTilt: { value: FLOOR.tilt },
        uWetLo: { value: FLOOR.wetLo },
        uFadeFar: { value: FLOOR.fadeFar },
        uFadeNear: { value: FLOOR.fadeNear },
        uTile: { value: FLOOR.tileMetres },
        uSeamW: { value: FLOOR.seamMetres },
        uSeamDark: { value: FLOOR.seamDark },
        uSeamGlow: { value: FLOOR.seamGlow },
        uGrain: { value: grain },
      },
      vertexShader: FLOOR_VERT,
      fragmentShader: FLOOR_FRAG,
    };
    this.mesh = new Reflector(new PlaneGeometry(FLOOR.size, FLOOR.size), { textureWidth: FLOOR.reflectionRes[0], textureHeight: FLOOR.reflectionRes[1], multisample: 4, clipBias: 0.003, shader });
    this.mesh.name = 'yrp-wet-floor';
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.set(0, 0, FLOOR.centreZ);
    this.mesh.renderOrder = FLOOR_RENDER_ORDER;
    const material = this.mesh.material as ShaderMaterial;
    material.transparent = true;
    material.depthWrite = false;
    const mirror = this.mesh.onBeforeRender;
    this.mesh.onBeforeRender = (renderer, scene, camera, geometry, mat, group) => {
      this.prepare(renderer, scene, camera);
      this.mesh.getReflectionCamera(camera).layers.set(LAYER.figure); // the mirror shows the figures alone
      const background = scene.background;
      scene.background = null; // a background colour would be reflected everywhere
      mirror.call(this.mesh, renderer, scene, camera, geometry, mat, group);
      scene.background = background;
    };
  }

  /** The backdrop-only render and the uniforms that follow the frame (its size, the horizon's height). */
  private prepare(renderer: WebGLRenderer, scene: Scene, camera: Camera): void {
    const { width, height } = frameSize(renderer, this.size);
    const bw = Math.max(1, Math.round(width * FLOOR.backScale));
    const bh = Math.max(1, Math.round(height * FLOOR.backScale));
    if (!this.back) this.back = new WebGLRenderTarget(bw, bh, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: true, generateMipmaps: false });
    else if (this.back.width !== bw || this.back.height !== bh) this.back.setSize(bw, bh);
    renderNested(renderer, scene, camera, { target: this.back, layer: LAYER.backdrop, keepBackground: true, clear: { colour: 0x000000, alpha: 1 } });
    this.backdropFrames++;
    const u = (this.mesh.material as ShaderMaterial).uniforms;
    u['tBack']!.value = this.back.texture;
    (u['uRes']!.value as Vector2).set(width, height);
    u['uYh']!.value = horizonHeight(camera, this.scratch);
  }

  /** The backdrop-only target's size now (a test's read), or null before the first frame. */
  get backSize(): { width: number; height: number } | null {
    return this.back ? { width: this.back.width, height: this.back.height } : null;
  }

  dispose(): void {
    this.back?.dispose();
    this.back = null;
    this.mesh.dispose();
    this.mesh.geometry.dispose();
    this.mesh.removeFromParent();
  }
}
