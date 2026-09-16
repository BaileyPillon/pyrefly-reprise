/**
 * A throwaway screen that stages {@link buildGagazetScene} with three painted
 * figures on it, so the scene can be looked at — and screenshotted — without a
 * battle, a HUD or a presenter.
 *
 * It exists for `node tools/screenshot.mjs --screen=scene-gagazet --rig=<name>`
 * and for `__pyrefly.goto('scene-gagazet')`. Nothing in the game depends on it;
 * delete this file and the one `app.register` line in `src/debug/api.ts` and the
 * scene itself is unaffected.
 */

import { Scene, type Camera } from 'three';
import { Screen } from '../app/Screen.ts';
import { BattleCamera } from '../engine/BattleCamera.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { paintBossSilhouette } from '../engine/ProceduralArt.ts';
import { buildGagazetScene, GAGAZET_ACTOR_HEIGHTS } from './gagazet.ts';
import { mountScene, type SceneBuild } from './types.ts';

export class GagazetSceneScreen extends Screen {
  readonly name = 'scene-gagazet';

  private scene: Scene | null = null;
  private build: SceneBuild | null = null;
  private camera: BattleCamera | null = null;
  private actors: PaintedActor[] = [];
  private clock = 0;

  override async enter(): Promise<void> {
    const scene = new Scene();
    scene.name = 'scene-gagazet';
    this.scene = scene;

    const build = await buildGagazetScene({});
    this.build = build;
    mountScene(build, scene);
    this.app.renderer.applyPalette(build.palette);

    const { lights } = build;
    const common = {
      facing: 1 as const,
      crossfadeMs: 120,
      rim: { color: lights.rimColorHex, strength: 0.85, dir: lights.rimDir, width: 3.4 },
      bounce: { color: lights.bounceColorHex, strength: 0.3 },
      groundShade: 0.28,
      shadow: { radius: 0.8, opacity: 0.72, squash: 0.5 },
      breathe: { amplitude: 0.018, speed: 0.42 },
      sway: { amplitude: 0.01, speed: 0.23 },
    };

    const tidus = await PaintedActor.fromSubject('tidus', {
      ...common,
      worldHeight: GAGAZET_ACTOR_HEIGHTS.tidus,
      states: ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'],
    });
    const yuna = await PaintedActor.fromSubject('yuna', {
      ...common,
      worldHeight: GAGAZET_ACTOR_HEIGHTS.yuna,
      states: ['idle'],
    });
    // Third slot: no painting of its own yet, so it borrows Tidus' and is
    // tinted, which keeps the formation composed while the art lands.
    const third = await PaintedActor.fromSubject('auron', {
      ...common,
      worldHeight: GAGAZET_ACTOR_HEIGHTS.auron,
      states: ['idle'],
    });
    if (third.subject?.placeholder && !tidus.subject?.placeholder) {
      third.adoptPoses(tidus.subject!.poses, 'idle');
      third.setTint('#d89a8a');
    }

    const party = [tidus, yuna, third];
    party.forEach((a, i) => {
      a.position.copy(build.partySlots[i]!);
      a.setFacing(1);
      build.group.add(a);
    });

    const boss = await PaintedActor.fromSubject('seymour-flux', {
      facing: -1,
      worldHeight: GAGAZET_ACTOR_HEIGHTS.seymourFlux,
      crossfadeMs: 140,
      states: ['idle'],
      placeholder: () => paintBossSilhouette({ seed: 31 }),
      placeholderBaseline: 0.985,
      matte: { mode: 'force' },
      edgeFade: 0.16,
      alphaCut: 0.05,
      rim: { color: lights.rimColorHex, strength: 0.7, dir: [1, 0.3], width: 4 },
      bounce: { color: 0x8affd0, strength: 0.22 },
      groundShade: 0.1,
      hover: { height: 0.36, bobAmplitude: 0.075, bobSpeed: 0.17 },
      shadow: { radius: 1.3, opacity: 0.55, squash: 0.5 },
      breathe: { amplitude: 0.012, speed: 0.22 },
      sway: { amplitude: 0.006, speed: 0.15 },
    });
    boss.position.copy(build.enemySlots[0]!);
    build.group.add(boss);

    this.actors = [...party, boss];

    this.camera = new BattleCamera(this.app.renderer.camera, {
      swayAmplitude: 0.05,
      swaySpeed: 0.26,
      rigs: build.rigs,
      initial: 'idle',
    });
  }

  override update(dt: number): void {
    this.clock += dt;
    this.build?.update(dt);
    for (const a of this.actors) a.update(dt);
    this.camera?.update(dt);
    const boss = this.actors[this.actors.length - 1];
    boss?.setBrightness(0.85 + (0.82 + Math.sin(this.clock * 0.9) * 0.18) * 0.25);
  }

  override render(): { scene: Scene; camera: Camera } | null {
    if (!this.scene) return null;
    return { scene: this.scene, camera: this.app.renderer.camera };
  }

  override trigger(name: string): boolean {
    if (name.startsWith('rig:')) {
      const rig = name.slice(4);
      if (!this.build || !(rig in this.build.rigs)) return false;
      void this.camera?.moveTo(rig, 520, 'cubicInOut');
      return true;
    }
    if (name === 'push-in') {
      // The scene's opening move: snap wide, then dolly in to the CTB framing.
      this.camera?.snapTo('intro');
      void this.camera?.moveTo('idle', 2500, 'cubicInOut');
      return true;
    }
    return false;
  }

  override exit(): void {
    for (const a of this.actors) a.dispose();
    this.actors = [];
    this.build?.dispose();
    this.build = null;
    this.scene?.clear();
    this.scene = null;
    this.camera = null;
  }

  override snapshot(): Record<string, unknown> {
    return {
      scene: 'gagazet',
      backdropPlaceholder: this.build?.backdrop.placeholder ?? null,
      rigs: this.build ? Object.keys(this.build.rigs) : [],
    };
  }
}
