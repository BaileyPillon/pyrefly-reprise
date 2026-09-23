import { Mesh, Scene, Vector3, type PerspectiveCamera } from 'three';
import { BattleCamera } from '../engine/BattleCamera.ts';
import { makeLightPool } from '../engine/Lighting.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { HitEffects } from '../engine/VFX.ts';
import type { AssetReport, PaintedScene } from './demo.ts';
import {
  ANIMA_HOVER,
  MACALANIA_TEMPLE_ACTOR_HEIGHTS as H,
  SEYMOUR_STEP_BACK,
  buildMacalaniaTempleScene,
} from './macalania-temple.ts';
import {
  ANIMA_ARRIVAL_CAMERA,
  ANIMA_ARRIVAL_MS,
  ANIMA_RISE_RENDER_ORDER,
  animaArrivalAt,
  animaRiseY,
  makeArrivalChains,
  makeFloorOccluder,
  type AnimaArrivalState,
} from './macalania-temple-arrival.ts';
import { mountScene } from './types.ts';

/** The preview plus what the debug screen needs to draw concept B's tags. */
export interface MacalaniaPainted extends PaintedScene {
  seymour: PaintedActor;
  anima: PaintedActor;
  /** The arrival's state while it runs or after it has landed; null before it. */
  arrival(): AnimaArrivalState | null;
}

/**
 * {@link buildMacalaniaTempleScene} with Tidus, Yuna and Rikku on the party
 * slots, Seymour and his two Guado Guardians on theirs, Anima waiting under
 * the ice on slot 3, an FFX battle camera on the scene's rigs, and the beats
 * the debug screen fires, including `arrival` (Anima's rise, see
 * `macalania-temple-arrival.ts`). **Preview only**, like
 * `leblanc-last-room-painted.ts`: a real battle stages its own combatants on
 * the factory's published slots and never calls this.
 */
export async function buildMacalaniaTemplePainted(camera: PerspectiveCamera): Promise<MacalaniaPainted> {
  const scene = new Scene();
  scene.name = 'macalania-temple';
  const build = await buildMacalaniaTempleScene({});
  mountScene(build, scene);
  const { lights } = build;

  const commonParty = {
    facing: 1 as const,
    crossfadeMs: 120,
    rim: { color: lights.rimColorHex, strength: 0.9, dir: lights.rimDir, width: 3.2 },
    bounce: { color: lights.bounceColorHex, strength: 0.3 },
    groundShade: 0.34,
    shadow: { radius: 0.72, opacity: 0.7, squash: 0.5 },
    breathe: { amplitude: 0.017, speed: 0.4 },
    sway: { amplitude: 0.011, speed: 0.2 },
  };
  const PARTY_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;
  const party = await Promise.all([
    PaintedActor.fromSubject('tidus', { ...commonParty, worldHeight: H.tidus, states: PARTY_POSES }),
    PaintedActor.fromSubject('yuna', { ...commonParty, worldHeight: H.yuna, states: PARTY_POSES }),
    PaintedActor.fromSubject('rikku', { ...commonParty, worldHeight: H.rikku, states: PARTY_POSES }),
  ]);
  party.forEach((a, i) => {
    a.position.copy(build.partySlots[i]!);
    a.setFacing(1);
    build.group.add(a);
  });

  const commonEnemy = {
    facing: -1 as const,
    crossfadeMs: 130,
    rim: { color: lights.rimColorHex, strength: 0.85, dir: lights.rimDir, width: 3.4 },
    bounce: { color: 0xffc27a, strength: 0.22 },
    groundShade: 0.3,
    shadow: { radius: 0.7, opacity: 0.72, squash: 0.48 },
    breathe: { amplitude: 0.014, speed: 0.36 },
    sway: { amplitude: 0.008, speed: 0.18 },
  };
  const ENEMY_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko'] as const;
  // Art ids are the installed folders (the manifest's subjects), by state name.
  const [guardA, seymour, guardB] = await Promise.all([
    PaintedActor.fromSubject('guado-guardian', { ...commonEnemy, worldHeight: H.guadoGuardian, states: ENEMY_POSES }),
    PaintedActor.fromSubject('seymour-macalania', { ...commonEnemy, worldHeight: H.seymour, states: ENEMY_POSES }),
    PaintedActor.fromSubject('guado-guardian', { ...commonEnemy, worldHeight: H.guadoGuardian, states: ENEMY_POSES }),
  ]);
  // Anima: the approved aeon painting plus the CANDIDATE hurt/ko; no `cast`
  // (the engine shows her attack for it). She floats in her chains.
  const anima = await PaintedActor.fromSubject('anima', {
    ...commonEnemy,
    worldHeight: H.anima,
    states: ['idle', 'attack', 'hurt', 'ko', 'overdrive'],
    hover: { height: ANIMA_HOVER, bobAmplitude: 0.05, bobSpeed: 0.14 },
    breathe: { amplitude: 0.01, speed: 0.22 },
    bounce: { color: 0xb07cff, strength: 0.3 },
  });
  const enemies = [guardA, seymour, guardB, anima];
  enemies.forEach((a, i) => {
    a.position.copy(build.enemySlots[i]!);
    a.setFacing(-1);
    build.group.add(a);
  });
  const seymourHome = build.enemySlots[1]!.clone();
  const stepBackTo = new Vector3(...SEYMOUR_STEP_BACK);
  const animaSlot = build.enemySlots[3]!;

  // Arrival props: the depth-only floor, the chains, the violet crack light.
  const occluder = makeFloorOccluder();
  occluder.visible = false;
  build.group.add(occluder);
  const chains = makeArrivalChains([animaSlot.x, 0, animaSlot.z], H.anima);
  build.group.add(chains.group);
  const crack = makeLightPool({ color: 0xa066ff, radius: 3.0, opacity: 0 });
  crack.position.set(animaSlot.x, 0.02, animaSlot.z + 0.3);
  build.group.add(crack);

  /** Anima's planes to 12 while the occluder is up, back to the actors' 10 after (planes are the only 10s). */
  const setAnimaOrder = (order: number): void => {
    anima.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && (m.renderOrder === 10 || m.renderOrder === ANIMA_RISE_RENDER_ORDER)) m.renderOrder = order;
    });
  };
  const hideAnima = (): void => {
    anima.visible = false;
    anima.position.y = animaRiseY(0, H.anima, ANIMA_HOVER);
    chains.setGrow(0);
    (crack.material as { opacity: number }).opacity = 0;
  };
  hideAnima();

  const hits = new HitEffects(
    { size: 4.4, coreColor: 0xf2fbff, edgeColor: 0x7fd0ff, arc: 2.5, radius: 0.6, thickness: 0.09, trail: 0.6 },
    { count: 100, speed: 6.0, life: 0.48, size: 9, bias: [0.4, 0.42, 0.2], focus: 0.5 },
    { color: 0xe6f6ff, size: 2.8 },
  );
  build.group.add(hits);

  const battleCamera = new BattleCamera(camera, { swayAmplitude: 0.05, swaySpeed: 0.24, rigs: build.rigs, initial: 'idle' });

  // ------------------------------------------------------------------- beats
  const timers: Array<{ left: number; fn: () => void }> = [];
  const after = (ms: number, fn: () => void): void => {
    timers.push({ left: ms / 1000, fn });
  };
  let busy = false;
  let turn = 0;
  let arrivalMs = -1;
  let lastArrival: AnimaArrivalState | null = null;
  const cameraFired = new Set<number>();
  const liveEnemies = (): PaintedActor[] => (lastArrival ? [anima] : [guardA, seymour, guardB]);

  const attackBeat = (): void => {
    if (busy) return;
    busy = true;
    const attacker = party[turn % party.length]!;
    const targets = liveEnemies();
    const target = targets[turn % targets.length]!;
    turn++;
    void battleCamera.moveTo('action', 220, 'cubicOut');
    attacker.setPose('attack');
    void attacker.lunge(2.5, 460);
    const hitAt = target.position.clone();
    hitAt.y += Math.min(target.height, 2.4) * 0.55;
    after(160, () => void hits.slash.play(hitAt, 360, -0.6));
    after(230, () => {
      hits.sparks.emit(hitAt, 1);
      hits.flash.play(hitAt, 240, 0.68);
      target.flash(0xe8f6ff, 190, 0.5);
      target.shake(0.11, 340);
      battleCamera.shake(0.1, 260);
    });
    after(720, () => {
      attacker.setPose('idle');
      void battleCamera.moveTo('idle', 700, 'cubicInOut');
    });
    after(1150, () => (busy = false));
  };

  const castBeat = (): void => {
    if (busy) return;
    busy = true;
    const caster = lastArrival ? anima : seymour;
    caster.setPose(lastArrival ? 'attack' : 'cast');
    lights.flicker(lastArrival ? 0xb07cff : 0x9fd8ff, 3.0, 850, 11);
    caster.flash(0xd9f4ff, 650, 0.45);
    after(850, () => {
      caster.setPose('idle');
      busy = false;
    });
  };

  const hurtBeat = (): void => {
    party[0]?.setPose('hurt');
    for (const a of party) a.flash(0xff9a8a, 200, 0.65);
    battleCamera.shake(0.09, 220);
    after(500, () => party[0]?.setPose('idle'));
  };

  const startArrival = (): boolean => {
    if (arrivalMs >= 0 && !lastArrival?.done) return false;
    arrivalMs = 0;
    guardiansFired = false;
    cameraFired.clear();
    for (const g of [guardA, guardB]) g.setDissolve(0);
    seymour.position.copy(seymourHome);
    seymour.setDim(0);
    anima.visible = true;
    if (anima.shadow) anima.shadow.visible = false;
    setAnimaOrder(ANIMA_RISE_RENDER_ORDER);
    occluder.visible = true;
    return true;
  };

  const resetBeat = (): void => {
    arrivalMs = -1;
    lastArrival = null;
    occluder.visible = false;
    setAnimaOrder(10);
    hideAnima();
    for (const g of [guardA, guardB]) {
      g.visible = true;
      g.setDissolve(0);
    }
    seymour.position.copy(seymourHome);
    seymour.setDim(0);
    void battleCamera.moveTo('idle', 600, 'cubicInOut');
  };

  /** Apply the arrival's pure state to the stage. */
  let guardiansFired = false;
  const applyArrival = (ms: number, live = true): void => {
    const s = animaArrivalAt(ms);
    lastArrival = s;
    ANIMA_ARRIVAL_CAMERA.forEach((c, i) => {
      if (ms >= c.atMs && !cameraFired.has(i)) {
        cameraFired.add(i);
        void battleCamera.moveTo(c.rig, c.ms, c.easing);
      }
    });
    anima.position.y = animaRiseY(s.rise, H.anima, ANIMA_HOVER);
    chains.setGrow(s.chains);
    (crack.material as { opacity: number }).opacity = 0.9 * s.crack;
    for (const g of [guardA, guardB]) {
      // Live: one violet dissolve fired as the beat is crossed (they die
      // together, on screen). A jump (`arrival-at:`) sets the fraction.
      if (live && s.guardiansGone > 0 && !guardiansFired) {
        void g.dissolveTo(1, ANIMA_ARRIVAL_MS.guardiansGoneMs, 0xa066ff);
        g.flash(0xd6b8ff, 260, 0.8);
      } else if (!live) g.setDissolve(s.guardiansGone);
      g.visible = s.guardiansGone < 0.999;
    }
    if (live && s.guardiansGone > 0) guardiansFired = true;
    seymour.position.lerpVectors(seymourHome, stepBackTo, s.stepBack);
    seymour.setDim(0.4 * s.stepBack);
    if (!s.occluding && occluder.visible) {
      occluder.visible = false;
      setAnimaOrder(10);
      if (anima.shadow) anima.shadow.visible = true;
    }
  };

  const trigger = (name: string): boolean => {
    if (name.startsWith('rig:')) {
      const rig = name.slice(4);
      if (!battleCamera.getRig(rig)) return false;
      void battleCamera.moveTo(rig, 700, 'cubicInOut');
      return true;
    }
    if (name.startsWith('arrival-at:')) {
      // Jump the arrival to a fixed instant (screenshots of a single beat).
      const ms = Number(name.slice('arrival-at:'.length));
      if (!Number.isFinite(ms)) return false;
      startArrival();
      arrivalMs = ms;
      cameraFired.clear();
      const cam = [...ANIMA_ARRIVAL_CAMERA].reverse().find((c) => ms >= c.atMs);
      if (cam) battleCamera.snapTo(cam.rig);
      ANIMA_ARRIVAL_CAMERA.forEach((c, i) => ms >= c.atMs && cameraFired.add(i));
      applyArrival(ms, false);
      return true;
    }
    switch (name) {
      case 'attack':
        attackBeat();
        return true;
      case 'cast':
        castBeat();
        return true;
      case 'hurt':
        hurtBeat();
        return true;
      case 'arrival':
      case 'summon':
        return startArrival();
      case 'reset':
        resetBeat();
        return true;
      default:
        return false;
    }
  };

  const assetReport: AssetReport = {
    backdrop: !build.backdrop.placeholder,
    tidusPoses: party[0]!.subject?.real ?? [],
    yuna: !party[1]!.subject?.placeholder,
    boss: enemies.every((a) => !a.subject?.placeholder),
    standIns: [...party, ...enemies].filter((a) => a.subject?.placeholder).map((a) => a.name),
  };

  const update = (dt: number): void => {
    for (let i = timers.length - 1; i >= 0; i--) {
      const t = timers[i]!;
      t.left -= dt;
      if (t.left <= 0) {
        timers.splice(i, 1);
        t.fn();
      }
    }
    if (arrivalMs >= 0 && !lastArrival?.done) {
      arrivalMs += dt * 1000;
      applyArrival(arrivalMs);
    }
    build.update(dt);
    for (const a of [...party, ...enemies]) a.update(dt);
    hits.update(dt, camera);
    battleCamera.update(dt);
  };

  return {
    ...build,
    scene,
    battleCamera,
    party,
    enemies,
    seymour,
    anima,
    arrival: () => lastArrival,
    assetReport,
    trigger,
    setPixelScale(v: number): void {
      for (const p of build.particles) p.setPixelScale(v);
      hits.sparks.setPixelScale(v);
    },
    update,
    dispose(): void {
      for (const a of [...party, ...enemies]) a.dispose();
      chains.dispose();
      occluder.geometry.dispose();
      (occluder.material as { dispose(): void }).dispose();
      crack.geometry.dispose();
      (crack.material as { dispose(): void }).dispose();
      hits.dispose();
      build.dispose();
      scene.clear();
    },
  };
}
