import { Scene, type PerspectiveCamera } from 'three';
import { BattleCamera } from '../engine/BattleCamera.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { HitEffects } from '../engine/VFX.ts';
import type { AssetReport, PaintedScene } from './demo.ts';
import {
  LEBLANC_LAST_ROOM_ACTOR_HEIGHTS,
  buildLeblancLastRoomScene,
} from './leblanc-last-room.ts';
import { mountScene } from './types.ts';

/**
 * {@link buildLeblancLastRoomScene} with Yuna, Rikku and Paine on the party
 * slots and Leblanc, Ormi and Logos on the trio's, an FFX-2 battle camera
 * bound to its rigs, and the action beats the screenshot tool and the debug
 * screen fire — the `PaintedScene` shape `src/scenes/index.ts` registers.
 *
 * This is the **preview-only** half of the pair (`docs/ENGINE-API.md#scene-
 * builder-contract`'s "older builder brings its own figures" path): nothing
 * in a real battle calls `trigger()` on it or reads its `party`/`enemies`
 * arrays — `BattlePresenterStage` stages the actual combatants against
 * `buildLeblancLastRoomScene`'s published slots instead. It exists so the
 * location, the trio and the party's marks can be looked at — and
 * screenshotted — without a battle, a HUD or a presenter around them.
 */
export async function buildLeblancLastRoomPainted(camera: PerspectiveCamera): Promise<PaintedScene> {
  const scene = new Scene();
  scene.name = 'leblanc-last-room';

  const build = await buildLeblancLastRoomScene({});
  mountScene(build, scene);
  const { lights } = build;
  const rimHex = lights.rimColorHex;
  const bounceHex = lights.bounceColorHex;

  const commonParty = {
    facing: 1 as const,
    crossfadeMs: 120,
    rim: { color: rimHex, strength: 0.85, dir: lights.rimDir, width: 3.2 },
    bounce: { color: bounceHex, strength: 0.3 },
    groundShade: 0.34,
    shadow: { radius: 0.72, opacity: 0.72, squash: 0.5 },
    breathe: { amplitude: 0.017, speed: 0.4 },
    sway: { amplitude: 0.011, speed: 0.2 },
  };
  const PARTY_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'] as const;

  // Rikku carries a full pose set; she is the fallback shape for whichever of
  // her two teammates is still a placeholder (`docs/handoff/chapter-leblanc-
  // scene.md` — Paine has no painted art in this repo yet).
  const rikku = await PaintedActor.fromSubject('rikku', {
    ...commonParty,
    worldHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.rikku,
    states: PARTY_POSES,
  });
  const yuna = await PaintedActor.fromSubject('yuna', {
    ...commonParty,
    worldHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.yuna,
    states: PARTY_POSES,
  });
  const paine = await PaintedActor.fromSubject('paine', {
    ...commonParty,
    worldHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.paine,
    states: PARTY_POSES,
  });

  const standIns: string[] = [];
  if (paine.subject?.placeholder) {
    standIns.push('paine');
    if (!rikku.subject?.placeholder) paine.adoptPoses(rikku.subject!.poses, 'idle');
    paine.setTint('#8a7cc9');
  }

  const party = [yuna, rikku, paine];
  party.forEach((a, i) => {
    a.position.copy(build.partySlots[i]!);
    a.setFacing(1);
    build.group.add(a);
  });

  const commonEnemy = {
    facing: -1 as const,
    crossfadeMs: 130,
    rim: { color: rimHex, strength: 0.8, dir: lights.rimDir, width: 3.4 },
    bounce: { color: 0xff8fd6, strength: 0.24 },
    groundShade: 0.3,
    shadow: { radius: 0.7, opacity: 0.75, squash: 0.48 },
    breathe: { amplitude: 0.014, speed: 0.36 },
    sway: { amplitude: 0.008, speed: 0.18 },
  };
  const ENEMY_POSES = ['idle', 'attack', 'cast', 'hurt', 'ko'] as const;

  const leblanc = await PaintedActor.fromSubject('leblanc', {
    ...commonEnemy,
    worldHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc,
    states: ENEMY_POSES,
  });
  const logos = await PaintedActor.fromSubject('logos', {
    ...commonEnemy,
    worldHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.logos,
    states: ENEMY_POSES,
  });
  const ormi = await PaintedActor.fromSubject('ormi', {
    ...commonEnemy,
    worldHeight: LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.ormi,
    states: ENEMY_POSES,
  });

  // Slot order matches `leblanc-syndicate.ts`: 0 Leblanc, 1 Logos, 2 Ormi.
  const enemies = [leblanc, logos, ormi];
  enemies.forEach((a, i) => {
    a.position.copy(build.enemySlots[i]!);
    a.setFacing(-1);
    build.group.add(a);
  });

  // --------------------------------------------------------------------- VFX
  const hits = new HitEffects(
    { size: 4.6, coreColor: 0xfff0fa, edgeColor: 0xff6fc8, arc: 2.5, radius: 0.6, thickness: 0.09, trail: 0.6 },
    { count: 100, speed: 6.2, life: 0.48, size: 9, bias: [0.4, 0.42, 0.2], focus: 0.5 },
    { color: 0xffd6f0, size: 2.8 },
  );
  build.group.add(hits);

  // ------------------------------------------------------------------ camera
  const battleCamera = new BattleCamera(camera, {
    swayAmplitude: 0.05,
    swaySpeed: 0.24,
    rigs: build.rigs,
    initial: 'idle',
  });

  // ------------------------------------------------------------------- beats
  interface Timer {
    left: number;
    fn: () => void;
  }
  const timers: Timer[] = [];
  const after = (ms: number, fn: () => void): void => {
    timers.push({ left: ms / 1000, fn });
  };
  let busy = false;
  let targetIdx = 0;

  /** The attacker takes turns among the party; the target among the trio — enough variety for a screenshot pass without a real turn order. */
  const attackBeat = (): void => {
    if (busy) return;
    busy = true;
    const attacker = party[targetIdx % party.length]!;
    const target = enemies[targetIdx % enemies.length]!;
    targetIdx++;
    void battleCamera.moveTo('action', 220, 'cubicOut');
    attacker.setPose('attack');
    void attacker.lunge(2.5, 460);
    void attacker.squash(260, 0.5);
    lights.placePractical(attacker.position.x + 1, 1.4, attacker.position.z);

    const hitAt = target.position.clone();
    hitAt.y += LEBLANC_LAST_ROOM_ACTOR_HEIGHTS.leblanc * 0.55;
    after(160, () => {
      void hits.slash.play(hitAt, 360, -0.6);
      lights.flicker(0xff8fd6, 3.6, 400, 12);
    });
    after(230, () => {
      hits.sparks.emit(hitAt, 1);
      hits.flash.play(hitAt, 240, 0.68);
      target.flash(0xffe6f6, 190, 0.5);
      target.shake(0.11, 340);
      void target.recoil(380, 0.3);
      battleCamera.shake(0.11, 280);
    });
    after(720, () => {
      attacker.setPose('idle');
      void battleCamera.moveTo('idle', 700, 'cubicInOut');
    });
    after(1150, () => {
      busy = false;
    });
  };

  const castBeat = (): void => {
    if (busy) return;
    busy = true;
    const caster = party[0]!;
    caster.setPose('cast');
    lights.placePractical(caster.position.x, 1.6, caster.position.z + 0.4);
    lights.flicker(0x9de8ff, 3.0, 850, 11);
    caster.flash(0xd9f4ff, 650, 0.45);
    after(850, () => {
      caster.setPose('idle');
      busy = false;
    });
  };

  const hurtBeat = (): void => {
    party[0]?.setPose('hurt');
    for (const a of party) {
      a.flash(0xff9a8a, 200, 0.65);
      a.shake(0.065, 260);
    }
    battleCamera.shake(0.09, 220);
    after(500, () => party[0]?.setPose('idle'));
  };

  const koBeat = (): void => {
    const fallen = enemies[targetIdx % enemies.length]!;
    void fallen.dissolveTo(1, 1500, 0xff8fd6);
    after(1600, () => fallen.setDissolve(0));
  };

  const trigger = (name: string): boolean => {
    if (name.startsWith('rig:')) {
      const rig = name.slice(4);
      if (!battleCamera.getRig(rig)) return false;
      void battleCamera.moveTo(rig, 700, 'cubicInOut');
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
      case 'ko':
        koBeat();
        return true;
      default:
        return false;
    }
  };

  // ---------------------------------------------------------------- reports
  const assetReport: AssetReport = {
    backdrop: !build.backdrop.placeholder,
    tidusPoses: yuna.subject?.real ?? [],
    yuna: !standIns.includes('yuna'),
    boss: enemies.every((a) => !a.subject?.placeholder),
    standIns,
  };

  // -------------------------------------------------------------------- loop
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
    for (const a of [...party, ...enemies]) a.update(dt);
    hits.update(dt, camera);
    battleCamera.update(dt);
  };

  const setPixelScale = (v: number): void => {
    for (const p of build.particles) p.setPixelScale(v);
    hits.sparks.setPixelScale(v);
  };

  const dispose = (): void => {
    for (const a of [...party, ...enemies]) a.dispose();
    hits.dispose();
    build.dispose();
    scene.clear();
  };

  return {
    ...build,
    scene,
    battleCamera,
    party,
    enemies,
    assetReport,
    trigger,
    setPixelScale,
    update,
    dispose,
  };
}
