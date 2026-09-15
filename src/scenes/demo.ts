import {
  AmbientLight,
  DirectionalLight,
  Fog,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  Scene,
  SphereGeometry,
  type PerspectiveCamera,
} from 'three';
import { BattleCamera } from '../engine/BattleCamera.ts';
import { makeGradientSky, makeGroundPlane, makeRock, noiseTexture } from '../engine/Diorama.ts';
import { ParticleField, ParticlePresets } from '../engine/Particles.ts';
import { SpriteActor } from '../engine/SpriteActor.ts';
import { buildSpriteActorInput } from '../sprites/canvas.ts';
import { tidus } from '../sprites/characters/tidus.ts';
import { PARTY_PALETTES, makeBossIdle, makePartyIdle } from './placeholder-sprites.ts';

/** What a scene builder hands back to a screen. */
export interface DioramaScene {
  scene: Scene;
  battleCamera: BattleCamera;
  party: SpriteActor[];
  enemies: SpriteActor[];
  update(dt: number): void;
  dispose(): void;
}

/**
 * "Mt. Gagazet mood" test diorama.
 *
 * Deep blue night, snow underfoot, a cold key light from behind the ridge and a
 * warm rim light on the party side, snow falling and pyreflies drifting up.
 * Framed like an FFX battle: party bottom-left facing right, one large enemy
 * on the right, camera slightly elevated.
 */
export function buildDemoScene(camera: PerspectiveCamera): DioramaScene {
  const scene = new Scene();
  // Atmospheric lift on the far ridge; also what sells the miniature depth.
  scene.fog = new Fog(0x18305e, 14, 44);

  // ---------------------------------------------------------------- backdrop
  const sky = makeGradientSky(0x050b20, 0x2f5a9c, { mid: 0x12275a, midpoint: 0.6, radius: 120 });
  scene.add(sky);

  // A moon low over the ridge: the brightest thing in frame, and the anchor the
  // bloom pass is tuned around.
  const moon = new Mesh(
    new SphereGeometry(1.5, 20, 14),
    new MeshBasicMaterial({ color: 0xf2f7ff, fog: false }),
  );
  moon.position.set(-13, 11.5, -34);
  moon.renderOrder = -50;
  scene.add(moon);

  const halo = new Mesh(
    new SphereGeometry(3.4, 18, 12),
    new MeshBasicMaterial({ color: 0x9fc2ff, transparent: true, opacity: 0.16, fog: false }),
  );
  halo.position.copy(moon.position);
  halo.renderOrder = -51;
  scene.add(halo);

  const snowTex = noiseTexture({
    base: '#8ba2c6',
    speck: '#ffffff',
    density: 0.42,
    contrast: 0.55,
    grain: 2,
    size: 64,
    seed: 11,
    repeat: 20,
  });
  const ground = makeGroundPlane(80, 80, snowTex, 0xe3edff);
  scene.add(ground);

  // A second, brighter patch right under the fighters so the focus band pops.
  const stageTex = noiseTexture({
    base: '#a6bcdd',
    speck: '#ffffff',
    density: 0.34,
    contrast: 0.55,
    grain: 2,
    size: 64,
    seed: 4,
    repeat: 6,
  });
  const stage = makeGroundPlane(22, 15, stageTex, 0xf4f8ff);
  stage.position.y = 0.006;
  scene.add(stage);

  // ------------------------------------------------------------------- rocks
  const rockLayout: Array<{ pos: [number, number, number]; size: number; seed: number; color: number }> = [
    { pos: [-10.5, -0.6, -12], size: 4.2, seed: 2, color: 0x263450 },
    { pos: [-4.8, -0.5, -15], size: 6.0, seed: 7, color: 0x1e2b45 },
    { pos: [4.5, -0.8, -17], size: 7.2, seed: 13, color: 0x1a2640 },
    { pos: [12.0, -0.6, -13], size: 5.0, seed: 21, color: 0x22304c },
    { pos: [-7.6, -0.2, -5.2], size: 1.25, seed: 31, color: 0x33405e },
    { pos: [7.4, -0.15, -4.6], size: 1.0, seed: 37, color: 0x3a4868 },
    { pos: [0.4, -0.16, -7.4], size: 1.7, seed: 41, color: 0x2d3a58 },
  ];
  const rocks: Object3D[] = [];
  for (const r of rockLayout) {
    const rock = makeRock({
      size: r.size,
      color: r.color,
      seed: r.seed,
      jitter: 0.3,
      detail: 1,
      scale: [1, 0.85 + (r.seed % 5) * 0.06, 1],
    });
    rock.position.set(r.pos[0], r.pos[1], r.pos[2]);
    rock.rotation.y = r.seed;
    scene.add(rock);
    rocks.push(rock);

    // Snow cap: a small pale rock sunk into the top of the big one.
    if (r.size > 1.2) {
      const cap = makeRock({
        size: r.size * 0.72,
        color: 0x8ea6cc,
        seed: r.seed + 100,
        jitter: 0.24,
        detail: 1,
        scale: [1.05, 0.34, 1.05],
      });
      cap.position.set(r.pos[0], r.pos[1] + r.size * 0.55, r.pos[2]);
      cap.rotation.y = r.seed * 0.7;
      scene.add(cap);
      rocks.push(cap);
    }
  }

  // ------------------------------------------------------------------ lights
  // Deliberately dim: the bloom threshold sits at 0.82, so only the pyreflies,
  // the boss core and the snow highlights are meant to cross it.
  scene.add(new AmbientLight(0x3a527f, 0.6));
  scene.add(new HemisphereLight(0x9cc0ff, 0x16233f, 0.8));

  const key = new DirectionalLight(0xc2dcff, 1.9); // cold moon key, behind-left
  key.position.set(-7, 9, -4);
  scene.add(key);

  const rim = new DirectionalLight(0xffa066, 1.0); // warm rim from the right
  rim.position.set(9, 3.2, 4.0);
  scene.add(rim);

  const fill = new DirectionalLight(0x5a7cc0, 0.32);
  fill.position.set(2, 3, 9);
  scene.add(fill);

  const pyreGlow = new PointLight(0x6fffbc, 0.9, 9, 2);
  pyreGlow.position.set(2.2, 1.4, 0.6);
  scene.add(pyreGlow);

  const bossGlow = new PointLight(0x8affd0, 0.8, 7, 2);
  bossGlow.position.set(2.6, 2.0, -1.0);
  scene.add(bossGlow);

  // --------------------------------------------------------------- particles
  const snow = new ParticleField(
    ParticlePresets.snow({
      count: 900,
      bounds: { x: 17, y: 8, z: 13 },
      size: 7,
      opacity: 0.85,
    }),
  );
  snow.position.set(0, 3.6, -3);
  scene.add(snow);

  const pyreflies = new ParticleField(
    ParticlePresets.pyreflies({
      count: 210,
      bounds: { x: 8, y: 2.8, z: 5 },
      size: 9.5,
      opacity: 1,
    }),
  );
  pyreflies.position.set(-0.4, 1.7, -0.4);
  scene.add(pyreflies);

  // ------------------------------------------------------------------ actors
  const partySpots: Array<[number, number, number]> = [
    [-3.15, 0, 1.7],
    [-4.35, 0, 0.35],
    [-2.65, 0, -0.95],
  ];
  // Slot 0 is the real sprite from `src/sprites/`; the other two are still the
  // procedural stand-ins until their sprite data lands.
  const tidusInput = buildSpriteActorInput(tidus);
  const hero = SpriteActor.fromCanvases(tidusInput.frames, {
    ...tidusInput.options,
    facing: 1,
    shadow: { radiusPx: 17, opacity: 0.45 },
    brightness: 1.06,
  });

  const placeholderKeys = ['white', 'red'] as const;
  const party: SpriteActor[] = [hero];
  for (const [i, keyName] of placeholderKeys.entries()) {
    party.push(
      SpriteActor.fromCanvases(
        { idle: makePartyIdle(PARTY_PALETTES[keyName]!) },
        {
          name: `party-${keyName}`,
          facing: 1,
          frameDurationMs: 480 + i * 60,
          shadow: { radiusPx: 17, opacity: 0.45 },
          brightness: 1.06,
        },
      ),
    );
  }

  party.forEach((actor, i) => {
    const spot = partySpots[i]!;
    actor.position.set(spot[0], spot[1], spot[2]);
    scene.add(actor);
  });

  const boss = SpriteActor.fromCanvases(
    { idle: makeBossIdle() },
    {
      name: 'boss',
      facing: -1,
      frameDurationMs: 700,
      shadow: { radiusPx: 54, opacity: 0.55 },
      brightness: 1.02,
    },
  );
  boss.position.set(3.5, 0, -2.6);
  scene.add(boss);

  // ------------------------------------------------------------------ camera
  const battleCamera = new BattleCamera(camera, {
    swayAmplitude: 0.045,
    swaySpeed: 0.3,
    rigs: {
      // Slightly elevated three-quarter view: party lower-left, boss upper-right.
      idle: { position: [-0.2, 3.15, 11.4], lookAt: [0.15, 1.3, -1.6], fov: 34 },
      party: { position: [-1.9, 2.2, 7.0], lookAt: [-3.4, 1.05, 0.5], fov: 32, sway: 0.7 },
      enemy: { position: [1.7, 3.2, 6.2], lookAt: [3.5, 2.3, -2.6], fov: 32, sway: 0.7 },
      victory: { position: [-1.6, 1.9, 7.4], lookAt: [-3.3, 1.15, 0.7], fov: 36, sway: 1.3 },
    },
    initial: 'idle',
  });

  // ------------------------------------------------------------------- loop
  let clock = 0;
  const update = (dt: number): void => {
    clock += dt;
    for (const a of party) a.update(dt);
    boss.update(dt);
    snow.update(dt);
    pyreflies.update(dt);
    battleCamera.update(dt);

    // breathing glow so the bloom pulses very gently
    pyreGlow.intensity = 0.85 + Math.sin(clock * 1.4) * 0.22;
    bossGlow.intensity = 0.78 + Math.sin(clock * 0.9 + 1.2) * 0.2;
  };

  const dispose = (): void => {
    for (const a of party) a.dispose();
    boss.dispose();
    snow.dispose();
    pyreflies.dispose();
    scene.clear();
  };

  return { scene, battleCamera, party, enemies: [boss], update, dispose };
}
