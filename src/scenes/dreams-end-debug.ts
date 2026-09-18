/**
 * A throwaway screen that stages {@link buildDreamsEndScene} with three painted
 * figures and the chapter's boss on it, so the scene can be looked at — and
 * screenshotted — without a battle, a HUD or a presenter.
 *
 * It exists for `node tools/screenshot.mjs --screen=scene-dreams-end --rig=<name>`
 * and for `__pyrefly.goto('scene-dreams-end')`. Nothing in the game depends on
 * it; delete this file and the one `app.register` line in `src/debug/api.ts` and
 * the scene itself is unaffected.
 */

import { Scene, type Camera } from 'three';
import { Screen } from '../app/Screen.ts';
import { BattleCamera } from '../engine/BattleCamera.ts';
import { PaintedActor } from '../engine/PaintedActor.ts';
import { paintBossSilhouette } from '../engine/ProceduralArt.ts';
import {
  buildDreamsEndScene,
  DREAMS_END_ACTOR_HEIGHTS,
  DREAMS_END_ENEMY_ACTOR_DEFAULTS,
} from './dreams-end.ts';
import { isPlaceholderScene } from './index.ts';
import { mountScene, type SceneBuild } from './types.ts';

export class DreamsEndSceneScreen extends Screen {
  readonly name = 'scene-dreams-end';

  private scene: Scene | null = null;
  private build: SceneBuild | null = null;
  private camera: BattleCamera | null = null;
  private actors: PaintedActor[] = [];
  private bossId = '';
  private clock = 0;

  override async enter(): Promise<void> {
    const scene = new Scene();
    scene.name = 'scene-dreams-end';
    this.scene = scene;

    const build = await buildDreamsEndScene({});
    this.build = build;
    mountScene(build, scene);
    this.app.renderer.applyPalette(build.palette);

    const { lights } = build;
    const common = {
      facing: 1 as const,
      crossfadeMs: 120,
      rim: { color: lights.rimColorHex, strength: 0.95, dir: lights.rimDir, width: 3.6 },
      // The bounce is the cold half of the rig, not the ground's own colour:
      // it is what keeps the party's shadow side from going red like the room.
      bounce: { color: 0x5f7bb8, strength: 0.26 },
      groundShade: 0.3,
      shadow: { radius: 0.82, opacity: 0.66, squash: 0.5 },
      breathe: { amplitude: 0.018, speed: 0.42 },
      sway: { amplitude: 0.01, speed: 0.23 },
    };

    const tidus = await PaintedActor.fromSubject('tidus', {
      ...common,
      worldHeight: DREAMS_END_ACTOR_HEIGHTS.tidus,
      states: ['idle', 'attack', 'cast', 'hurt', 'ko', 'victory'],
    });
    const yuna = await PaintedActor.fromSubject('yuna', {
      ...common,
      worldHeight: DREAMS_END_ACTOR_HEIGHTS.yuna,
      states: ['idle'],
    });
    // Third slot: no painting of its own yet, so it borrows Tidus' and is
    // tinted, which keeps the formation composed while the art lands.
    const third = await PaintedActor.fromSubject('auron', {
      ...common,
      worldHeight: DREAMS_END_ACTOR_HEIGHTS.auron,
      states: ['idle'],
    });
    if (third.subject?.placeholder && !tidus.subject?.placeholder) {
      third.adoptPoses(tidus.subject!.poses, 'idle');
      third.setTint('#c07a62');
    }

    const party = [tidus, yuna, third];
    party.forEach((a, i) => {
      a.position.copy(build.partySlots[i]!);
      a.setFacing(1);
      build.group.add(a);
    });

    // The chapter's boss if its art exists, Seymour Flux as the stand-in while
    // Braska's Final Aeon is still being generated. Both are staged with the
    // scene's own cut-out defaults.
    const bossOptions = {
      facing: -1 as const,
      crossfadeMs: 140,
      states: ['idle'],
      placeholder: () => paintBossSilhouette({ seed: 47 }),
      placeholderBaseline: 0.985,
      ...DREAMS_END_ENEMY_ACTOR_DEFAULTS,
      /**
       * The rim carries this boss, and it has to, because the brightness cap
       * below deliberately refuses to.
       *
       * Braska's Final Aeon is painted in browns and near-black and he stands
       * against a near-black red sky — almost no value separation of his own.
       * The tempting fix is overall gain, and that is exactly what clipped his
       * steel greatsword flat. So he is separated at the **edge** instead:
       * a stronger hot rim off the same right-hand key draws his whole
       * silhouette against the sky, and a warmer bounce lifts the undersides
       * of the legs and the great claw out of the floor, without touching a
       * single highlight that bloom could catch.
       *
       * This is the general move for a dark creature on a dark plate: raise the
       * rim, not the exposure.
       */
      rim: { color: 0xffb070, strength: 1.05, dir: [1, 0.3] as [number, number], width: 4.2 },
      bounce: { color: 0xff8a46, strength: 0.3 },
      groundShade: 0.26,
      /**
       * **Not hovering.** Braska's Final Aeon is a four-tonne thing that stands
       * on the arena floor; the generic boss staging lifted him 0.12 off it and
       * bobbed him, and at this rig that reads as a cut-out pasted over the
       * painting rather than as a body in the room. He keeps a slow vertical
       * breath (`breathe`, below) and nothing else.
       *
       * The contact shadow does the rest of the work. At opacity 0.5 under a
       * silhouette this wide there was nothing on the floor to anchor him to —
       * the eye had no point where the creature met the ground, which is the
       * single fastest way to lose the scale the `worldHeight` is buying. A
       * wider, darker, flatter pool reads as weight, and `groundShade` doubled
       * is what keeps his own feet from staying brighter than the floor they
       * are standing on.
       */
      shadow: { radius: 1.95, opacity: 0.72, squash: 0.42 },
      breathe: { amplitude: 0.012, speed: 0.22 },
      sway: { amplitude: 0.006, speed: 0.15 },
    };

    let boss = await PaintedActor.fromSubject('braskas-final-aeon-1', {
      ...bossOptions,
      worldHeight: DREAMS_END_ACTOR_HEIGHTS.braskasFinalAeon,
    });
    this.bossId = 'braskas-final-aeon-1';
    if (boss.subject?.placeholder) {
      boss.dispose();
      boss = await PaintedActor.fromSubject('seymour-flux', {
        ...bossOptions,
        worldHeight: DREAMS_END_ACTOR_HEIGHTS.seymourFlux,
      });
      this.bossId = 'seymour-flux';
    }
    boss.position.copy(build.enemySlots[0]!);
    build.group.add(boss);

    this.actors = [...party, boss];

    this.camera = new BattleCamera(this.app.renderer.camera, {
      swayAmplitude: 0.05,
      swaySpeed: 0.24,
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
    // Kept strictly under 1: `setBrightness` is a straight multiplier on the
    // sampled texel, and this boss carries a near-white steel greatsword. Any
    // multiplier above 1 clips that blade flat and it reads as a glowing white
    // blob instead of as metal. Breathe him 0.86..0.96 instead.
    boss?.setBrightness(0.91 + Math.sin(this.clock * 0.85) * 0.05);
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
     * Pose beats, so `--action=attack` can catch the scene mid-swing. The
     * front slot is the only actor with more than an idle painting, so it is
     * the one that acts; the key flicker is fired with it, which is what makes
     * an action shot look lit by the blow rather than posed during it.
     */
    if (['attack', 'cast', 'hurt', 'ko', 'victory', 'idle'].includes(name)) {
      const hero = this.actors[0];
      if (!hero) return false;
      hero.setPose(name);
      if (name === 'attack' || name === 'cast') {
        this.build?.lights.flicker(name === 'cast' ? 0xff6a3c : 0xffd7a0, 4.2, 440, 13);
        const slot = this.build?.enemySlots[0];
        if (slot) this.build?.lights.placePractical(slot.x, 1.6, slot.z + 1.2);
      }
      return true;
    }
    if (name === 'push-in') {
      // The scene's opening move: snap to the wide up-tilted shot, then tilt
      // down and dolly in to the CTB framing.
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

  /**
   * Both placeholder flags are published, because they mean different things
   * and the critic reads them for different reasons.
   *
   * `backdropPlaceholder` is about the **art**: true means
   * `public/art/backdrops/dreams-end.png` did not load and the painting on
   * screen is `Backdrop`'s procedural stand-in. `scenePlaceholder` is about the
   * **registry** — `isPlaceholderScene` is the same value `__pyrefly.scenes()`
   * reports, i.e. whether this chapter is still drawing the Gagazet diorama
   * instead of its own module. Dream's End should answer false to both; a run
   * where they disagree says which of the two regressed.
   */
  override snapshot(): Record<string, unknown> {
    return {
      scene: 'dreams-end',
      boss: this.bossId,
      backdropPlaceholder: this.build?.backdrop.placeholder ?? null,
      scenePlaceholder: isPlaceholderScene('dreams-end'),
      rigs: this.build ? Object.keys(this.build.rigs) : [],
    };
  }
}
