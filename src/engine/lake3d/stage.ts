/**
 * **The frozen lake** (the hidden Wendigo chapter's 3D stage; FFX only): the whole world as one object. A disc of mirror ice (`./ice.ts`) in a ring of snowy shore and far mountains (`./shore.ts`), under the aurora and the
 * moon (`./sky.ts`), with falling snow (`./snow.ts`), four volumetric light shafts and a low mist (`./air.ts`), and ice crystals grown in clusters and along the shore (`./crystals.ts`); lit by the cold key, the sky-and-ice
 * hemisphere and the aurora's rim (`./look.ts`). It owns no actors: the stage (`PaintedStage`) puts those in the scene beside it.
 *
 * `update(t)` advances the aurora, the snow, the shafts, the mist and the ice's glitter to absolute time `t`; `epilogue(frame)` sets the ice break (`./epilogue.ts`). `dispose` frees everything it built.
 *
 * Staging, not game data: the sources do not describe the lake's sky or ice beyond the field event (`docs/handoff/ch-wendigo.md`). Needs three.js; no DOM. Game case: FFX only.
 */

import { DirectionalLight, Group, HemisphereLight, Mesh, PlaneGeometry, ShaderMaterial, Vector3, type Scene } from 'three';
import { buildAir, type Air } from './air.ts';
import { buildCrystals, type Crystals } from './crystals.ts';
import { SkyEnvironment } from './env.ts';
import type { EpilogueFrame } from './epilogue.ts';
import { MirrorIce } from './ice.ts';
import { LOOK } from './look.ts';
import { buildShore, type Shore } from './shore.ts';
import { buildSky, type Sky } from './sky.ts';
import { buildSnow, type Snow } from './snow.ts';

/** The white a screen fades to at the end of the break: one quad drawn in clip space over everything, its alpha the only uniform. */
export function buildWhiteout(): { readonly mesh: Mesh; set(white: number): void; dispose(): void } {
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    name: 'lake-whiteout',
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: { uWhite: { value: 0 } },
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: 'uniform float uWhite; void main() { gl_FragColor = vec4(vec3(1.0), uWhite); }',
  });
  const mesh = new Mesh(geometry, material);
  mesh.name = 'lake-whiteout';
  mesh.frustumCulled = false;
  mesh.renderOrder = 1000;
  mesh.visible = false;
  return {
    mesh,
    set(white: number): void {
      material.uniforms['uWhite']!.value = white;
      mesh.visible = white > 0.001;
    },
    dispose(): void {
      geometry.dispose();
      material.dispose();
      mesh.removeFromParent();
    },
  };
}

export interface LakeStage {
  readonly group: Group;
  readonly sky: Sky;
  readonly ice: MirrorIce;
  readonly shore: Shore;
  readonly air: Air;
  readonly crystals: Crystals;
  readonly snow: Snow;
  /** The sky's still as the materials' environment (made on the first frame; `./env.ts`). */
  readonly env: SkyEnvironment;
  readonly key: DirectionalLight;
  readonly rim: DirectionalLight;
  readonly hemi: HemisphereLight;
  /** Advance the world to absolute time `t` seconds. */
  update(t: number): void;
  /** Set the ice break's state (the lake's side of it). */
  epilogue(frame: EpilogueFrame): void;
  dispose(): void;
}

export interface StageOptions {
  readonly quality?: 'low' | 'high';
}

/** Build the lake. */
export function buildLakeStage(opts: StageOptions = {}): LakeStage {
  const quality = opts.quality ?? 'high';
  const group = new Group();
  group.name = 'lake-stage';
  const sky = buildSky();
  const env = new SkyEnvironment(sky.mesh);
  const follow = sky.mesh.onBeforeRender;
  sky.mesh.onBeforeRender = (renderer, scene, camera, geometry, material, batch): void => {
    follow.call(sky.mesh, renderer, scene, camera, geometry, material, batch);
    if (!env.ready) env.build(renderer, scene as Scene, camera);
  };
  const shore = buildShore(quality === 'low' ? 140 : 220, quality === 'low' ? 44 : 70);
  const ice = new MirrorIce(quality);
  const air = buildAir();
  const crystals = buildCrystals(LOOK.key.toward);
  const snow = buildSnow(quality === 'low' ? 2600 : undefined);
  const whiteout = buildWhiteout();
  group.add(sky.mesh, shore.mesh, ice.mesh, ice.water, ice.shards, crystals.mesh, air.group, snow.points, whiteout.mesh);

  const key = new DirectionalLight(LOOK.key.colour, LOOK.key.intensity);
  key.name = 'lake-key';
  key.position.copy(new Vector3(...LOOK.key.toward).multiplyScalar(60));
  const rim = new DirectionalLight(LOOK.rim.colour, LOOK.rim.intensity);
  rim.name = 'lake-rim';
  rim.position.copy(new Vector3(...LOOK.rim.toward).multiplyScalar(60));
  const hemi = new HemisphereLight(LOOK.hemi.sky, LOOK.hemi.ground, LOOK.hemi.intensity);
  hemi.name = 'lake-hemi';
  group.add(key, rim, hemi);

  return {
    group,
    sky,
    ice,
    shore,
    air,
    crystals,
    snow,
    env,
    key,
    rim,
    hemi,
    update(t: number): void {
      sky.update(t);
      snow.update(t);
      air.update(t);
      ice.update(t);
    },
    epilogue(frame: EpilogueFrame): void {
      ice.set(frame.ice);
      whiteout.set(frame.white);
    },
    dispose(): void {
      whiteout.dispose();
      env.dispose();
      sky.dispose();
      shore.dispose();
      ice.dispose();
      air.dispose();
      crystals.dispose();
      snow.dispose();
      key.dispose();
      rim.dispose();
      hemi.dispose();
      group.removeFromParent();
      group.clear();
    },
  };
}
