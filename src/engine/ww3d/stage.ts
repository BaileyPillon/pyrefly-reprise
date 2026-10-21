/**
 * **The temple chamber** (the hidden Wind Waker chapter; FFX-2 only), after TARGET-C: a round blue-stone chamber with carved spiral panels, pilasters, a carved arched door with a golden wheel, thin waterfalls, torches,
 * hanging vines, a stone roof with an opening onto a Wind Waker sky (spiral clouds) and a light shaft, a warm sand floor. Ported from the look lab's `js/stage.mjs`. **It is a stand-in**: flat colours, procedural textures
 * (the characters are the test); our sources do not describe Besaid's chamber (`research/ffx2-fallen-aeons.md` section 7.1 names the fight, not the room), so this is the generator's invention in TARGET-C, kept.
 *
 * Camera-facing parts are placed by azimuth: 0 = the far wall straight ahead (-z), positive toward +x (the right of the frame). **A hidden occluder**: a roof ring behind the camera that only casts the sun's shadow
 * (colour writes off), so the floor has TARGET-C's big blue-violet shadows with the party inside a lit patch. Only the floor receives the sun's shadow; the wall stays lit (TARGET-C's wall is lit blue).
 *
 * **Swappable pieces.** `temple/wall.glb` is tiled round the chamber in place of the round wall with its cornice and its relief panels, and `pillar`, `door` and `brazier` replace their procedural parts
 * (`./stageParts.ts` has the kit's placement, `./swaps.ts` the conventions). `built.used` names the swapped pieces that were placed.
 *
 * **The light** is the lab's: one warm sun (a directional light with a 4096 px shadow map over a 29 m frustum that covers the whole arena, 2048 on a weak GPU) and a soft hemisphere fill. The toon material adds them
 * (`./toon.ts`). The scene hides the engine's own light rig so nothing else lights the models.
 *
 * Needs three.js (and a DOM for the default textures; a test hands blank ones). Game case: FFX-2 only.
 */

import {
  AdditiveBlending,
  BackSide,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MathUtils,
  PlaneGeometry,
  RingGeometry,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  Vector4,
  type BufferGeometry,
  type IUniform,
  type Object3D,
  type Texture,
} from 'three';
import { SUN_DIRECTION } from './camera.ts';
import type { TempleName } from './layout.ts';
import { addBays, addDoor, addTorches, addVines, addWaterfalls, polarPos, tileWall, type Flame, type StageCtx } from './stageParts.ts';
import { canvasTextures, type StageTextures } from './stageTextureSet.ts';
import { withUniforms, makeToonMaterial, type ToonOptions, type ToonUniforms } from './toon.ts';

export const STAGE = {
  R: 12,
  H: 10.5,
  doorAz: 23,
  /** The roof opening (ceiling plane y = H). */
  hole: { x: 3.4, z: -8.2, r: 5.0 },
  /** Linear multiplier of the sand in shadow: blue-violet (TARGET-C floor shadow about #6b7b9b). */
  floorShadow: [0.14, 0.22, 1.0] as const,
  /** x, z, radius of the sun-lit opening of the hidden roof (behind the camera): the lit floor patch is this circle moved 5.6 left and 7.4 forward. */
  occluder: { y: 9.5, hole: [6.2, 6.9, 6.0] as const },
  /** The sun's shadow frustum: its centre (the whole arena floor, R = 12.5) and half-size, and the map size by quality. */
  shadow: { centre: [0.5, 0.0, -1.0] as const, half: 14.5, size: { high: 4096, low: 2048 } },
  /** The haze and the sky behind everything. */
  fog: { colour: 0xa9c7f0, near: 14, far: 60 },
  background: '#8ec5ff',
} as const;

/** What the stage hands back. */
export interface BuiltStage {
  readonly group: Group;
  readonly sun: DirectionalLight;
  readonly fill: HemisphereLight;
  readonly flames: readonly Flame[];
  readonly clouds: ReadonlyArray<{ sprite: Sprite; deg: number; el: number; speed: number }>;
  readonly occluder: Mesh;
  /** The swapped temple pieces that were placed. */
  readonly used: ReadonlySet<TempleName>;
  /** Advance the flames, the clouds, the waterfalls and the shaft to absolute time `t` seconds. */
  update(t: number): void;
  dispose(): void;
}

export interface StageOptions {
  /** The swapped temple pieces found, if any. */
  swaps?: Readonly<Partial<Record<TempleName, Object3D>>>;
  /** The textures (default: drawn on a canvas). */
  textures?: StageTextures;
  /** `low` shrinks the shadow map. */
  quality?: 'low' | 'high';
}

/** Build the chamber over the shared toon `uniforms`. */
export function buildStage(uniforms: ToonUniforms, opts: StageOptions = {}): BuiltStage {
  const { R, H } = STAGE;
  const source = opts.textures ?? canvasTextures;
  const made: Texture[] = []; // every texture the stage draws, freed with it (a canvas texture owns its bitmap)
  const tex = Object.fromEntries(
    Object.entries(source).map(([k, make]) => [
      k,
      (...args: unknown[]): Texture => {
        const t = (make as (...a: unknown[]) => Texture)(...args);
        made.push(t);
        return t;
      },
    ]),
  ) as unknown as StageTextures;
  const group = new Group();
  group.name = 'ww-stage';
  // The rim belongs to the characters and the boss. On the stage it would light every grazing-angle surface (the whole floor seen from chest height has N.V near 0), push it above 1 and bloom the frame white.
  const stageU = withUniforms(uniforms, { uToonRim: { value: new Vector4(0, 0, 0, 0) } });
  const floorU = withUniforms(stageU, { uToonShadowTint: { value: new Color().setRGB(...STAGE.floorShadow) } });
  const toon = (o: ToonOptions, u: Record<string, IUniform> = stageU): ReturnType<typeof makeToonMaterial> => makeToonMaterial(u, o);
  const owned: Array<{ dispose(): void }> = [];
  // only the FLOOR receives the sun's shadows: the hidden roof would otherwise leave the whole wall in shadow
  const add: StageCtx['add'] = (geo: BufferGeometry, mat, { cast = false, receive = false, at } = {}) => {
    const m = new Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    if (at) m.position.copy(at);
    group.add(m);
    owned.push(geo, mat);
    return m;
  };
  const swaps = opts.swaps ?? {};
  const ctx: StageCtx = { group, R, H, tex, uniforms: stageU, swaps, used: new Set<TempleName>(), templates: new Map(), toon, add };

  add(new CircleGeometry(R + 0.5, 64).rotateX(-Math.PI / 2), toon({ map: tex.sand(7, [2.8, 2.8]) }, floorU), { receive: true });
  const swappedFace = tileWall(ctx, STAGE.doorAz); // the radius of the tiled wall's inner face, or null with no wall file
  const wallSwapped = swappedFace !== null;
  const face = swappedFace ?? R;
  if (!wallSwapped) {
    add(new CylinderGeometry(R, R, H, 72, 1, true), toon({ map: tex.blockWall(11, [14, 2.6]), side: BackSide }), { at: new Vector3(0, H / 2, 0) });
    // a lighter cornice band running round the wall at the height of the spouts
    add(new CylinderGeometry(R - 0.32, R - 0.32, 0.7, 72, 1, true), toon({ color: 0x7f9ad0, side: BackSide }), { at: new Vector3(0, H - 2.0, 0) });
  }
  addBays(ctx, face, wallSwapped);
  addDoor(ctx, STAGE.doorAz, face);
  const scrolls = addWaterfalls(ctx, [[-38, H - 2.2], [-7, H - 2.2], [46, H - 2.2]]);
  const flames = addTorches(ctx, [19, 41, -62], [[-33, 3.4], [-52, 6.6]]);
  addVines(ctx, [[-47, H - 1.7, 5.2], [-42, H - 1.7, 3.6], [-36, H - 1.7, 4.4], [-28, H - 1.7, 3.0], [-4, H - 1.7, 4.0], [14, H - 1.7, 3.4], [19, H - 1.7, 5.0], [33, H - 1.7, 3.0], [43, H - 1.7, 4.2]]);

  // the stone roof: a flat ring at the wall top, seen from underneath, with a round opening onto the sky
  const hole = STAGE.hole;
  add(new RingGeometry(hole.r, 40, 64).rotateX(Math.PI / 2), toon({ map: tex.blockWall(3, [12, 12], [52, 72, 120], 4), side: DoubleSide }), { at: new Vector3(hole.x, H, hole.z) });
  add(new TorusGeometry(hole.r + 0.15, 0.3, 8, 64).rotateX(Math.PI / 2), toon({ color: 0x6f8bc4 }), { at: new Vector3(hole.x, H - 0.05, hole.z) });

  // the hidden occluder: only its shadow exists (colour writes off), so the sun reaches the floor through an opening that lies over the party
  const occluder = new Mesh(new RingGeometry(STAGE.occluder.hole[2], 60, 64).rotateX(Math.PI / 2), new MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: DoubleSide }));
  occluder.position.set(STAGE.occluder.hole[0], STAGE.occluder.y, STAGE.occluder.hole[1]);
  occluder.castShadow = true;
  occluder.receiveShadow = false;
  occluder.name = 'sun-occluder';
  group.add(occluder);
  owned.push(occluder.geometry, occluder.material as MeshBasicMaterial);

  // sky dome and spiral clouds (unlit, no fog)
  const sky = new Mesh(new SphereGeometry(90, 32, 16), new MeshBasicMaterial({ map: tex.sky(), side: BackSide, fog: false, depthWrite: false, toneMapped: false }));
  sky.renderOrder = -10;
  group.add(sky);
  owned.push(sky.geometry, sky.material as MeshBasicMaterial);
  const clouds: Array<{ sprite: Sprite; deg: number; el: number; speed: number }> = [];
  const cloudSpec: ReadonlyArray<readonly [number, number, number]> = [[8, 52, 30], [24, 46, 34], [-6, 58, 36], [40, 56, 30], [14, 66, 40], [30, 38, 26], [2, 42, 28], [-20, 50, 30], [60, 48, 34], [90, 40, 32], [150, 44, 34], [-90, 44, 34]];
  cloudSpec.forEach(([deg, el, w], i) => {
    const map = tex.cloud(100 + i);
    const mat = new SpriteMaterial({ map, transparent: true, depthWrite: false, fog: false, toneMapped: false });
    mat.color.setRGB(0.96, 0.97, 1.0);
    const s = new Sprite(mat);
    s.scale.set(w, w * 0.5, 1);
    if (i % 2) {
      map.repeat.x = -1;
      map.offset.x = 1;
    }
    group.add(s);
    owned.push(mat);
    clouds.push({ sprite: s, deg, el, speed: 0.12 + (i % 3) * 0.05 });
  });

  // light shaft: crossed cards, additive, from the roof opening down toward the party side
  const shaft = new Group();
  const top = new Vector3(hole.x - 1.5, H - 1.6, hole.z + 1.5);
  const bottom = new Vector3(-1.2, 0, -2.4);
  const axis = top.clone().sub(bottom);
  const len = axis.length();
  const shaftMat = new MeshBasicMaterial({ map: tex.shaft(), transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, fog: false, toneMapped: false, opacity: 0.34 });
  owned.push(shaftMat);
  for (let k = 0; k < 3; k++) {
    const card = new Mesh(new PlaneGeometry(5.0, len), shaftMat);
    card.rotation.y = (k * Math.PI) / 3;
    shaft.add(card);
    owned.push(card.geometry);
  }
  shaft.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), axis.clone().normalize());
  shaft.position.copy(bottom).addScaledVector(axis, 0.5);
  group.add(shaft);

  // the light: one warm sun with crisp shadows over a frustum that covers the arena, plus a soft sky fill
  const sc = new Vector3(...STAGE.shadow.centre);
  const sun = new DirectionalLight(0xfff0d0, 0.8);
  sun.name = 'ww-sun';
  sun.position.copy(sc).addScaledVector(new Vector3(...SUN_DIRECTION).normalize(), 32);
  sun.target.position.copy(sc);
  sun.castShadow = true;
  const size = STAGE.shadow.size[opts.quality === 'low' ? 'low' : 'high'];
  sun.shadow.mapSize.set(size, size);
  const h = STAGE.shadow.half;
  Object.assign(sun.shadow.camera, { left: -h, right: h, top: h, bottom: -h, near: 1, far: 80 });
  sun.shadow.camera.updateProjectionMatrix(); // the light only reads the matrix, it never rebuilds it from left/right/top/bottom
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 1;
  const fill = new HemisphereLight(0xcfe6ff, 0xf0dcaa, 0.42);
  fill.name = 'ww-fill';
  group.add(sun, sun.target, fill);

  function update(t: number): void {
    for (const f of flames) {
      const k = 1 + 0.12 * Math.sin(t * 13 + f.phase) + 0.07 * Math.sin(t * 7.3 + f.phase * 2);
      f.sprite.scale.set(0.85 * (2 - k), 1.3 * k, 1);
      f.sprite.position.set(f.base.x + 0.025 * Math.sin(t * 5 + f.phase), f.base.y + (k - 1) * 0.25, f.base.z);
    }
    for (const c of clouds) {
      const p = polarPos(c.deg + t * c.speed, 80 * Math.cos(MathUtils.degToRad(c.el)), 80 * Math.sin(MathUtils.degToRad(c.el)));
      c.sprite.position.copy(p);
    }
    scrolls.forEach((tx, i) => {
      tx.offset.y = t * 0.42 + i * 0.37;
    });
    shaftMat.opacity = 0.32 + 0.04 * Math.sin(t * 0.9);
  }
  update(0);

  return {
    group,
    sun,
    fill,
    flames,
    clouds,
    occluder,
    used: ctx.used,
    update,
    dispose(): void {
      sun.shadow.map?.dispose();
      for (const o of owned) o.dispose();
      for (const t of ctx.templates.values()) {
        t.traverse((o) => {
          const m = (o as Mesh).material as { dispose(): void } | Array<{ dispose(): void }> | undefined; // the kit pieces' toon materials; their geometry and maps belong to the file and are freed with its cache
          if (m) for (const x of Array.isArray(m) ? m : [m]) x.dispose();
        });
      }
      for (const t of made) t.dispose();
      group.removeFromParent();
    },
  } satisfies BuiltStage;
}
