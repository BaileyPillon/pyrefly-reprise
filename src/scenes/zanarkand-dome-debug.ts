import { Scene, type Camera } from 'three';
import { Screen } from '../app/Screen.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { paintBossSilhouette } from '../engine/ProceduralArt.ts';
import { BattleCamera } from '../engine/BattleCamera.ts';
import {
  buildZanarkandDomeScene,
  ZANARKAND_DOME_ENEMY_ACTOR_DEFAULTS,
  ZANARKAND_DOME_HEIGHTS,
} from './zanarkand-dome.ts';
import { mountScene, type SceneBuild } from './types.ts';

/**
 * **Temporary** scene-review screen for `src/scenes/zanarkand-dome.ts`.
 *
 * It exists for `node tools/screenshot.mjs --screen=scene-zanarkand-dome
 * --rig=<name>` and for `__pyrefly.goto('scene-zanarkand-dome')`. It is the
 * scene builder's own eyes: it parks Tidus, Yuna
 * and a Seymour Flux stand-in (for Yunalesca, whose painting does not exist
 * yet) on the slots the scene publishes and binds a `BattleCamera` to its rigs,
 * so `--rig=` and `__pyrefly.shot('<rig>')` work against every published rig.
 *
 * Nothing in the game depends on it; delete this file and the one
 * `app.register` line in `src/debug/api.ts` and the scene itself is unaffected.
 */
export class ZanarkandDomeSceneScreen extends Screen {
  readonly name = 'scene-zanarkand-dome';

  private scene: Scene | null = null;
  private build: SceneBuild | null = null;
  private battleCamera: BattleCamera | null = null;
  private actors: PaintedActor[] = [];

  override async enter(): Promise<void> {
    const scene = new Scene();
    scene.name = 'scene-zanarkand-dome';
    const build = await buildZanarkandDomeScene({});
    mountScene(build, scene);
    this.scene = scene;
    this.build = build;

    this.app.renderer.applyPalette(build.palette);

    const { lights } = build;
    const common = {
      facing: 1 as const,
      crossfadeMs: 120,
      // Cold violet rim from the twilight on the right, warm gold bounce off
      // the wet floor from the sphere on the left. The scene's light rig is
      // built so that these two colours come straight off it.
      //
      // The bounce runs strong (0.44) because it is the *only* way the sphere
      // reaches these figures: a painted cut-out is unlit by design, so the
      // scene's `fayth-sphere-bounce` PointLight lights the water around their
      // boots and nothing of the actors themselves. Without this the party is
      // the one thing in the frame the room's light source does not touch.
      rim: { color: lights.rimColorHex, strength: 0.95, dir: lights.rimDir, width: 3.4 },
      bounce: { color: lights.bounceColorHex, strength: 0.44 },
      groundShade: 0.3,
      shadow: { radius: 0.8, opacity: 0.6, squash: 0.48 },
      breathe: { amplitude: 0.018, speed: 0.42 },
      sway: { amplitude: 0.01, speed: 0.23 },
    };

    const poses = ['idle'] as const;
    const tidus = await PaintedActor.fromSubject('tidus', {
      ...common,
      worldHeight: ZANARKAND_DOME_HEIGHTS.party,
      states: poses,
    });
    const yuna = await PaintedActor.fromSubject('yuna', {
      ...common,
      worldHeight: ZANARKAND_DOME_HEIGHTS.party - 0.1,
      states: poses,
    });
    const third = await PaintedActor.fromSubject('auron', {
      ...common,
      worldHeight: ZANARKAND_DOME_HEIGHTS.party + 0.08,
      states: poses,
    });
    // No Auron painting yet: borrow Tidus's so the third slot is at least the
    // right *kind* of figure and the composition stays honest.
    if (third.subject?.placeholder && !tidus.subject?.placeholder) {
      third.adoptPoses(tidus.subject!.poses, 'idle');
      third.setTint('#d7b3c8');
    }

    const party = [tidus, yuna, third];
    party.forEach((a, i) => {
      a.position.copy(build.partySlots[i]!);
      a.setFacing(1);
      build.group.add(a);
    });

    // The cut-out protection is the *scene's* to publish, not this screen's:
    // it is the same matte / edgeFade / alphaCut every battle that stages a
    // boss here has to use, so it is spread from the scene rather than copied
    // (a copy is how this screen and the battle drifted apart last time).
    const boss = await PaintedActor.fromSubject('seymour-flux', {
      ...ZANARKAND_DOME_ENEMY_ACTOR_DEFAULTS,
      facing: -1,
      worldHeight: ZANARKAND_DOME_HEIGHTS.boss,
      crossfadeMs: 140,
      states: ['idle'],
      placeholder: () => paintBossSilhouette({ seed: 31 }),
      placeholderBaseline: 0.985,
      rim: { color: lights.rimColorHex, strength: 0.8, dir: lights.rimDir, width: 4 },
      bounce: { color: lights.bounceColorHex, strength: 0.3 },
      groundShade: 0.12,
      hover: { height: 0.3, bobAmplitude: 0.07, bobSpeed: 0.16 },
      shadow: { radius: 1.35, opacity: 0.45, squash: 0.5 },
      breathe: { amplitude: 0.012, speed: 0.22 },
      sway: { amplitude: 0.006, speed: 0.15 },
    });
    boss.position.copy(build.enemySlots[0]!);
    build.group.add(boss);

    this.actors = [...party, boss];

    this.battleCamera = new BattleCamera(this.app.renderer.camera, {
      swayAmplitude: 0.042,
      swaySpeed: 0.21,
      rigs: build.rigs,
      initial: 'idle',
    });

    const h = this.app.renderer.domElement.height || 900;
    for (const p of build.particles) p.setPixelScale(Math.max(0.5, h / 900));

    void this.app.fade('clear', 500);
  }

  override exit(): void {
    for (const a of this.actors) a.dispose();
    this.actors = [];
    this.build?.dispose();
    this.build = null;
    this.scene?.clear();
    this.scene = null;
    this.battleCamera = null;
  }

  override trigger(name: string): boolean {
    if (!name.startsWith('rig:')) return false;
    const rig = name.slice(4);
    if (!this.battleCamera?.rigNames.includes(rig)) return false;
    void this.battleCamera.moveTo(rig, 650);
    return true;
  }

  override update(dt: number): void {
    this.build?.update(dt);
    for (const a of this.actors) a.update(dt);
    this.battleCamera?.update(dt);
  }

  override render(): { scene: Scene; camera: Camera } | null {
    if (!this.scene) return null;
    return { scene: this.scene, camera: this.app.renderer.camera };
  }

  override snapshot(): Record<string, unknown> {
    return {
      rig: this.battleCamera?.rigName ?? null,
      rigs: this.battleCamera?.rigNames ?? [],
      backdrop: this.build ? !this.build.backdrop.placeholder : null,
      actors: this.actors.map((a) => ({ name: a.name, placeholder: a.isPlaceholder })),
    };
  }
}
