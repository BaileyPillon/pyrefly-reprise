import { Scene, type PerspectiveCamera } from 'three';
import { BattleCamera } from '../engine/BattleCamera.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { HitEffects } from '../engine/VFX.ts';
import type { AssetReport, PaintedScene } from './demo.ts';
import { EVRAE_AIRSHIP_ACTOR_HEIGHTS as H, buildEvraeAirshipDeckScene } from './evrae-airship-deck.ts';
import { airshipRangeDirectorOf, type AirshipRangeDirector } from './evrae-airship-director.ts';
import type { AirshipRange } from './evrae-airship-range.ts';
import { mountScene } from './types.ts';

/** The preview plus the handles the debug screen drives. */
export interface EvraePainted extends PaintedScene {
  evrae: PaintedActor;
  director: AirshipRangeDirector;
  /** Resolves once Evrae is on its NEAR spot with its paintings in. */
  ready: Promise<void>;
}

/**
 * {@link buildEvraeAirshipDeckScene} with Tidus, Wakka and Rikku (the build's
 * active three, `fahrenheit.ts`) on the party slots, Evrae beyond the rail, an
 * FFX battle camera on the scene's rigs and the range director bound to both.
 * **Preview only**, like `macalania-temple-painted.ts`: a real battle stages
 * its own combatants on the factory's slots and never calls this.
 *
 * Beats: `far` / `near` (the range shift, in real time), `far!` / `near!`
 * (snap), `attack`, `hurt`, `inhale` (the breath-charge painting), `rig:<name>`.
 */
export async function buildEvraeAirshipPainted(camera: PerspectiveCamera): Promise<EvraePainted> {
  const scene = new Scene();
  scene.name = 'evrae-airship-deck';
  const build = await buildEvraeAirshipDeckScene({});
  mountScene(build, scene);
  const { lights } = build;
  const director = airshipRangeDirectorOf(build.group);
  if (!director) throw new Error('evrae-airship-deck published no range director');

  const commonParty = {
    facing: 1 as const,
    crossfadeMs: 120,
    rim: { color: lights.rimColorHex, strength: 0.9, dir: lights.rimDir, width: 3.2 },
    bounce: { color: lights.bounceColorHex, strength: 0.28 },
    groundShade: 0.32,
    shadow: { radius: 0.72, opacity: 0.66, squash: 0.5 },
    breathe: { amplitude: 0.017, speed: 0.4 },
    sway: { amplitude: 0.011, speed: 0.2 },
  };
  const PARTY_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;
  const party = await Promise.all([
    PaintedActor.fromSubject('tidus', { ...commonParty, worldHeight: H.tidus, states: PARTY_POSES }),
    PaintedActor.fromSubject('wakka', { ...commonParty, worldHeight: H.wakka, states: PARTY_POSES }),
    PaintedActor.fromSubject('rikku', { ...commonParty, worldHeight: H.rikku, states: PARTY_POSES }),
  ]);
  party.forEach((a, i) => {
    a.position.copy(build.partySlots[i]!);
    a.setFacing(1);
    build.group.add(a);
  });

  // Evrae hovers: no ground shadow (it is past the rail, over nothing).
  const evrae = await PaintedActor.fromSubject('evrae', {
    facing: -1,
    worldHeight: H.evrae,
    crossfadeMs: 140,
    states: ['idle', 'attack', 'cast', 'hurt', 'ko', 'breath-charge'],
    rim: { color: lights.rimColorHex, strength: 0.75, dir: lights.rimDir, width: 3.4 },
    bounce: { color: 0xffc58a, strength: 0.2 },
    groundShade: 0,
    shadow: false,
    breathe: { amplitude: 0.012, speed: 0.3 },
    sway: { amplitude: 0.02, speed: 0.16 },
  });
  evrae.position.copy(build.enemySlots[0]!);
  evrae.setFacing(-1);
  build.group.add(evrae);

  const hits = new HitEffects(
    { size: 4.4, coreColor: 0xfff6e8, edgeColor: 0xffc27a, arc: 2.5, radius: 0.6, thickness: 0.09, trail: 0.6 },
    { count: 90, speed: 6.0, life: 0.45, size: 9, bias: [0.4, 0.42, 0.2], focus: 0.5 },
    { color: 0xfff1dc, size: 2.8 },
  );
  build.group.add(hits);

  const battleCamera = new BattleCamera(camera, { swayAmplitude: 0.05, swaySpeed: 0.24, rigs: build.rigs, initial: 'idle' });
  director.bindCamera(battleCamera);
  const ready = director.bindEvrae(evrae, 'evrae');

  // ------------------------------------------------------------------- beats
  const timers: Array<{ left: number; fn: () => void }> = [];
  const after = (ms: number, fn: () => void): void => {
    timers.push({ left: ms / 1000, fn });
  };
  let busy = false;
  let turn = 0;

  const attackBeat = (): void => {
    if (busy) return;
    busy = true;
    // At FAR only Wakka's ball reaches (§4.3); at NEAR anyone does.
    const attacker = director.current === 'far' ? party[1]! : party[turn % party.length]!;
    turn++;
    void battleCamera.moveTo('action', 220, 'cubicOut');
    attacker.setPose('attack');
    void attacker.lunge(director.current === 'far' ? 0.4 : 1.6, 460);
    const hitAt = evrae.headPoint();
    after(160, () => void hits.slash.play(hitAt, 360, -0.6));
    after(230, () => {
      hits.sparks.emit(hitAt, 1);
      hits.flash.play(hitAt, 240, 0.68);
      evrae.flash(0xfff0dc, 190, 0.5);
      evrae.shake(0.11, 340);
      battleCamera.shake(0.08, 240);
    });
    after(720, () => {
      attacker.setPose('idle');
      void battleCamera.moveTo('idle', 700, 'cubicInOut');
    });
    after(1150, () => (busy = false));
  };

  const hurtBeat = (): void => {
    party[0]?.setPose('hurt');
    for (const a of party) a.flash(0xb6ff9a, 200, 0.6);
    battleCamera.shake(0.09, 220);
    after(500, () => party[0]?.setPose('idle'));
  };

  const shift = (to: AirshipRange, immediate: boolean): boolean => {
    director.setRange(to, { immediate });
    return true;
  };

  const trigger = (name: string): boolean => {
    if (name.startsWith('rig:')) {
      const r = name.slice(4);
      if (!battleCamera.getRig(r)) return false;
      void battleCamera.moveTo(r, 700, 'cubicInOut');
      return true;
    }
    switch (name) {
      case 'far':
        return shift('far', false);
      case 'near':
        return shift('near', false);
      case 'far!':
        return shift('far', true);
      case 'near!':
        return shift('near', true);
      case 'attack':
        attackBeat();
        return true;
      case 'hurt':
        hurtBeat();
        return true;
      case 'inhale':
        if (director.current !== 'near') return false;
        evrae.setPose('breath-charge');
        lights.flicker(0xffb070, 2.4, 900, 14);
        after(1400, () => evrae.setPose('idle'));
        return true;
      default:
        return false;
    }
  };

  const assetReport: AssetReport = {
    backdrop: !build.backdrop.placeholder,
    tidusPoses: party[0]!.subject?.real ?? [],
    yuna: false,
    boss: !evrae.subject?.placeholder,
    standIns: [...party, evrae].filter((a) => a.subject?.placeholder).map((a) => a.name),
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
    build.update(dt);
    for (const a of [...party, evrae]) a.update(dt);
    hits.update(dt, camera);
    battleCamera.update(dt);
  };

  return {
    ...build,
    scene,
    battleCamera,
    party,
    enemies: [evrae],
    evrae,
    director,
    ready,
    assetReport,
    trigger,
    setPixelScale(v: number): void {
      for (const p of build.particles) p.setPixelScale(v);
      hits.sparks.setPixelScale(v);
    },
    update,
    dispose(): void {
      for (const a of [...party, evrae]) a.dispose();
      hits.dispose();
      build.dispose();
      scene.clear();
    },
  };
}
