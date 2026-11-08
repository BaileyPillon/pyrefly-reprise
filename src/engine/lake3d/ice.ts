/**
 * **The mirror ice** (the hidden Wendigo chapter's 3D stage; FFX only): the lake's floor as a scene object. A three.js `Reflector` (a mirror render of everything above it: the aurora, the moon, the crystals, the figures)
 * with the shader of `./iceShader.ts`; under it a plane of dark water that shows only when the epilogue's layers shatter, and the instanced shards that fall from them.
 *
 * **An extra render, from inside the floor's draw**: the `Reflector` renders the scene once more from the mirrored camera into a half-float target (`ICE.reflectionRes`, 4x multisampled) every frame, with the floor itself
 * hidden. The water plane is hidden for that render too (it is under the mirror). The floor is opaque and writes depth, so the figures' soft shadows and the mist draw over it.
 *
 * **The epilogue's numbers** are one object, {@link IceState}, that the stage sets each frame (`./epilogue.ts` computes them from its clock): the ring of light, the growth of the cracks, and the progress of the twelve
 * layers. All zero is the unbroken ice and then the shader's discard and the shards cost nothing.
 *
 * Needs three.js and its `Reflector`; no DOM. Game case: FFX only.
 */

import { BufferAttribute, CircleGeometry, DoubleSide, InstancedBufferAttribute, InstancedBufferGeometry, IcosahedronGeometry, Mesh, PlaneGeometry, ShaderMaterial, Vector2, type Camera, type Scene, type WebGLRenderer } from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ICE, ICE_FRAG, ICE_VERT, SHARD_FRAG, SHARD_VERT, WATER_FRAG, WATER_VERT } from './iceShader.ts';

/** The epilogue's state: the ring of light (strength, radius in metres), the fine cracks' growth 0..1, and each layer's progress 0..1 (outermost first). */
export interface IceState {
  pulse: number;
  pulseR: number;
  crack: number;
  layers: readonly number[];
}

export const CALM: IceState = { pulse: 0, pulseR: 0, crack: 0, layers: Array.from({ length: ICE.layers }, () => 0) };

/** The shards per layer, and a seeded random so a retry builds the same field. */
const SHARDS_PER_LAYER = 46;
function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507) >>> 0;
    s = (Math.imul(s ^ (s >>> 13), 3266489909) ^ (s >>> 16)) >>> 0;
    return s / 4294967296;
  };
}

/** The shard field: for each layer's band, jittered places in the band, a size, a spin and a delay (the floor's cells go in the same order of delay). */
export function shardField(layers: number, perLayer: number, radius: number): { start: Float32Array; rand: Float32Array; band: Float32Array } {
  const n = layers * perLayer;
  const start = new Float32Array(n * 3);
  const rand = new Float32Array(n * 4);
  const band = new Float32Array(n);
  const rnd = seeded(7);
  for (let b = 0; b < layers; b++) {
    const outer = radius * (1 - b / layers);
    const inner = radius * (1 - (b + 1) / layers);
    for (let k = 0; k < perLayer; k++) {
      const i = b * perLayer + k;
      const a = rnd() * Math.PI * 2;
      const rr = inner + (outer - inner) * rnd();
      start.set([Math.cos(a) * rr, 0, Math.sin(a) * rr], i * 3);
      rand.set([0.3 + rnd() * 0.55, rnd() * 100, rnd(), rnd() * 0.78], i * 4);
      band[i] = b;
    }
  }
  return { start, rand, band };
}

export class MirrorIce {
  /** The reflector mesh: add it to the scene's group. */
  readonly mesh: Reflector;
  readonly water: Mesh;
  readonly shards: Mesh;
  private readonly floorMaterial: ShaderMaterial;
  private readonly shardMaterial: ShaderMaterial;
  private readonly waterMaterial: ShaderMaterial;
  private readonly layerCells: number[] = Array.from({ length: ICE.layers }, () => 0);
  /** Frames the mirror was drawn (a test's read). */
  mirrorFrames = 0;

  /** `quality: 'low'` halves the mirror's render. */
  constructor(quality: 'low' | 'high' = 'high', centre: readonly [number, number] = [0.8, -1.0]) {
    const shader = {
      name: 'lake-ice',
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        uTime: { value: 0 },
        uCentre: { value: new Vector2(centre[0], centre[1]) },
        uRadius: { value: ICE.radius },
        uMirrorLow: { value: ICE.mirrorLow },
        uMirrorHigh: { value: ICE.mirrorHigh },
        uPlate: { value: ICE.plate },
        uFine: { value: ICE.fine },
        uPulse: { value: 0 },
        uPulseR: { value: 0 },
        uBreak: { value: 0 },
        uLayer: { value: this.layerCells },
      },
      vertexShader: ICE_VERT,
      fragmentShader: ICE_FRAG,
    };
    const scale = quality === 'low' ? 0.5 : 1;
    this.mesh = new Reflector(new CircleGeometry(ICE.radius, 96), { textureWidth: Math.round(ICE.reflectionRes[0] * scale), textureHeight: Math.round(ICE.reflectionRes[1] * scale), multisample: quality === 'low' ? 0 : 4, clipBias: 0.003, shader });
    this.mesh.name = 'lake-ice';
    this.mesh.rotation.x = -Math.PI / 2;
    this.floorMaterial = this.mesh.material as ShaderMaterial;
    this.floorMaterial.side = DoubleSide;
    const mirror = this.mesh.onBeforeRender;
    this.mesh.onBeforeRender = (renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry, mat, group): void => {
      const was = this.water.visible;
      this.water.visible = false; // the water is under the mirror: its reflection would be of the underside
      mirror.call(this.mesh, renderer, scene, camera, geometry, mat, group);
      this.water.visible = was;
      this.mirrorFrames++;
    };

    this.waterMaterial = new ShaderMaterial({ name: 'lake-water', uniforms: { uTime: { value: 0 } }, vertexShader: WATER_VERT, fragmentShader: WATER_FRAG });
    this.water = new Mesh(new PlaneGeometry(ICE.radius * 2.4, ICE.radius * 2.4).rotateX(-Math.PI / 2), this.waterMaterial);
    this.water.name = 'lake-water';
    this.water.position.y = -0.55;
    this.water.visible = false; // shown only while a layer is going

    const field = shardField(ICE.layers, SHARDS_PER_LAYER, ICE.radius * 0.92);
    const base = new IcosahedronGeometry(0.5, 0);
    const geometry = new InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.setAttribute('position', base.getAttribute('position') as BufferAttribute);
    geometry.setAttribute('normal', base.getAttribute('normal') as BufferAttribute);
    geometry.setAttribute('aStart', new InstancedBufferAttribute(field.start, 3));
    geometry.setAttribute('aRand', new InstancedBufferAttribute(field.rand, 4));
    geometry.setAttribute('aBand', new InstancedBufferAttribute(field.band, 1));
    geometry.instanceCount = ICE.layers * SHARDS_PER_LAYER;
    this.shardMaterial = new ShaderMaterial({ name: 'lake-shards', uniforms: { uLayer: { value: this.layerCells } }, vertexShader: SHARD_VERT, fragmentShader: SHARD_FRAG, side: DoubleSide });
    this.shards = new Mesh(geometry, this.shardMaterial);
    this.shards.name = 'lake-shards';
    this.shards.frustumCulled = false;
    this.shards.visible = false;
  }

  /** Set the epilogue's state (every frame: cheap). The water and the shards are drawn only while some layer is going or gone. */
  set(state: IceState): void {
    const u = this.floorMaterial.uniforms;
    u['uPulse']!.value = state.pulse;
    u['uPulseR']!.value = state.pulseR;
    u['uBreak']!.value = state.crack;
    // the Reflector cloned the shader's uniforms (arrays too), so the floor's own array is written as well as the shards' ()
    const floorLayers = u['uLayer']!.value as number[];
    let any = false;
    for (let i = 0; i < ICE.layers; i++) {
      const v = state.layers[i] ?? 0;
      this.layerCells[i] = v;
      floorLayers[i] = v;
      if (v > 0) any = true;
    }
    this.water.visible = any;
    this.shards.visible = any;
  }

  /** Advance the ice's shimmer and the water's caustics to absolute time `t` seconds. */
  update(t: number): void {
    this.floorMaterial.uniforms['uTime']!.value = t;
    this.waterMaterial.uniforms['uTime']!.value = t;
  }

  dispose(): void {
    this.mesh.dispose();
    this.mesh.geometry.dispose();
    this.mesh.removeFromParent();
    this.water.geometry.dispose();
    this.waterMaterial.dispose();
    this.water.removeFromParent();
    this.shards.geometry.dispose();
    this.shardMaterial.dispose();
    this.shards.removeFromParent();
  }
}
