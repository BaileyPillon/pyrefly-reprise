/**
 * A throwaway screen that stages {@link buildBevelleUndergroundScene} with three
 * painted figures and the possessed Bahamut on it, so the scene can be looked at
 * — and screenshotted — without a battle, a HUD or a presenter.
 *
 * It exists for `node tools/screenshot.mjs --screen=scene-bevelle-underground
 * --rig=<name>` and for `__pyrefly.goto('scene-bevelle-underground')`. Nothing in
 * the game depends on it; delete this file and the one `app.register` line in
 * `src/debug/api.ts` and the scene itself is unaffected.
 */

import { Scene, type Camera } from 'three';
import { Screen } from '../app/Screen.ts';
import { BattleCamera } from '../engine/BattleCamera.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { paintBossSilhouette } from '../engine/ProceduralArt.ts';
import {
  buildBevelleUndergroundScene,
  BEVELLE_UNDERGROUND_ACTOR_HEIGHTS,
  BEVELLE_UNDERGROUND_ENEMY_ACTOR_DEFAULTS,
} from './bevelle-underground.ts';
import { mountScene, type SceneBuild } from './types.ts';

export class BevelleUndergroundSceneScreen extends Screen {
  readonly name = 'scene-bevelle-underground';

  private scene: Scene | null = null;
  private build: SceneBuild | null = null;
  private camera: BattleCamera | null = null;
  private actors: PaintedActor[] = [];
  private boss: PaintedActor | null = null;
  private clock = 0;

  override async enter(): Promise<void> {
    const scene = new Scene();
    scene.name = 'scene-bevelle-underground';
    this.scene = scene;

    const build = await buildBevelleUndergroundScene({});
    this.build = build;
    mountScene(build, scene);
    this.app.renderer.applyPalette(build.palette);

    const { lights } = build;
    const common = {
      facing: 1 as const,
      crossfadeMs: 120,
      rim: { color: lights.rimColorHex, strength: 0.9, dir: lights.rimDir, width: 3.4 },
      bounce: { color: lights.bounceColorHex, strength: 0.28 },
      groundShade: 0.3,
      shadow: { radius: 0.8, opacity: 0.7, squash: 0.5 },
      breathe: { amplitude: 0.018, speed: 0.42 },
      sway: { amplitude: 0.01, speed: 0.23 },
    };

    const tidus = await PaintedActor.fromSubject('tidus', {
      ...common,
      worldHeight: BEVELLE_UNDERGROUND_ACTOR_HEIGHTS.tidus,
      states: ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'],
    });
    const yuna = await PaintedActor.fromSubject('yuna', {
      ...common,
      worldHeight: BEVELLE_UNDERGROUND_ACTOR_HEIGHTS.yuna,
      states: ['idle'],
    });
    // Third slot: if no painting of its own has landed yet it borrows Tidus'
    // and is tinted, which keeps the formation composed while the art catches
    // up.
    const third = await PaintedActor.fromSubject('auron', {
      ...common,
      worldHeight: BEVELLE_UNDERGROUND_ACTOR_HEIGHTS.auron,
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

    /**
     * The chapter's boss. `ffx2-bahamut` is the painting this location fights;
     * `seymour-flux` is the stand-in when it has not been generated, and the
     * procedural silhouette is the stand-in for *that*.
     */
    let boss = await PaintedActor.fromSubject('ffx2-bahamut', {
      ...BEVELLE_UNDERGROUND_ENEMY_ACTOR_DEFAULTS,
      facing: -1,
      worldHeight: BEVELLE_UNDERGROUND_ACTOR_HEIGHTS.bahamut,
      crossfadeMs: 140,
      states: ['idle'],
      placeholder: () => paintBossSilhouette({ seed: 57 }),
      placeholderBaseline: 0.985,
      /**
       * Lit from **below and behind**, by the torn floor hole the scene vents
       * cyan light out of. That is the bible's money shot 2 — "up-light turning
       * the underside of the wings cyan and the topside near-black" — and on a
       * painted cut-out it is the only part of that description a rim band can
       * actually deliver: a negative y in `dir` puts the band along the
       * underside of every silhouette edge instead of along the top.
       */
      rim: { color: 0x9ae8fb, strength: 0.85, dir: [0.25, -0.9] as [number, number], width: 4 },
      bounce: { color: 0x6ed2ee, strength: 0.44 },
      groundShade: 0.1,
      hover: { height: 0.5, bobAmplitude: 0.09, bobSpeed: 0.16 },
      shadow: { radius: 1.6, opacity: 0.5, squash: 0.5 },
      breathe: { amplitude: 0.012, speed: 0.22 },
      sway: { amplitude: 0.006, speed: 0.15 },
    });
    if (boss.subject?.placeholder) {
      const fallback = await PaintedActor.fromSubject('seymour-flux', {
        ...BEVELLE_UNDERGROUND_ENEMY_ACTOR_DEFAULTS,
        facing: -1,
        worldHeight: 2.7,
        states: ['idle'],
        placeholder: () => paintBossSilhouette({ seed: 57 }),
        placeholderBaseline: 0.985,
        rim: { color: 0x9ae8fb, strength: 0.85, dir: [0.25, -0.9] as [number, number], width: 4 },
        bounce: { color: 0x6ed2ee, strength: 0.44 },
        groundShade: 0.1,
        hover: { height: 0.36, bobAmplitude: 0.075, bobSpeed: 0.17 },
        shadow: { radius: 1.3, opacity: 0.55, squash: 0.5 },
      });
      if (!fallback.subject?.placeholder) {
        boss.dispose();
        boss = fallback;
      } else {
        fallback.dispose();
      }
    }
    boss.position.copy(build.enemySlots[0]!);
    build.group.add(boss);
    this.boss = boss;

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
    // The possession pulse: the boss's own brightness breathes with the violet
    // pool under it, so the two read as one aura.
    this.boss?.setBrightness(0.86 + (0.82 + Math.sin(this.clock * 0.85) * 0.18) * 0.22);
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
    /**
     * The front character's own poses, so a screenshot can land on an action
     * beat (`tools/screenshot.mjs --action=attack`) rather than on three
     * figures standing still. Only Tidus has more than an idle painted, which
     * is why the beat always goes to slot 0.
     */
    if (['attack', 'cast', 'hurt', 'ko', 'victory', 'idle'].includes(name)) {
      const lead = this.actors[0];
      if (!lead) return false;
      lead.setPose(name);
      if (name !== 'idle' && name !== 'ko') {
        // Kick the rig's practical the way a real impact would, so the beat
        // lights the deck as well as changing the pose.
        this.build?.lights.flicker(0xffb070, 3.4, 460, 14);
        this.build?.lights.placePractical(0.2, 1.6, 0.4);
      }
      return true;
    }
    if (name === 'push-in') {
      // The scene's opening move: snap to the empty cradle, then dolly in to
      // the CTB framing.
      this.camera?.snapTo('intro');
      void this.camera?.moveTo('idle', 2500, 'cubicInOut');
      return true;
    }
    return false;
  }

  override exit(): void {
    for (const a of this.actors) a.dispose();
    this.actors = [];
    this.boss = null;
    this.build?.dispose();
    this.build = null;
    this.scene?.clear();
    this.scene = null;
    this.camera = null;
  }

  override snapshot(): Record<string, unknown> {
    return {
      scene: 'bevelle-underground',
      backdropPlaceholder: this.build?.backdrop.placeholder ?? null,
      rigs: this.build ? Object.keys(this.build.rigs) : [],
    };
  }
}
