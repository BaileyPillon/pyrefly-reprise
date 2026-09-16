/**
 * A throwaway screen that stages the Heart of the Farplane composition —
 * {@link buildFarplanePainted}, i.e. {@link buildFarplaneScene} with Tidus, Yuna
 * and Seymour Flux on its slots — so the location can be looked at, and
 * screenshotted, without a battle, a HUD or a presenter around it.
 *
 * It exists for `node tools/screenshot.mjs --screen=scene-farplane --rig=<name>`
 * and for `__pyrefly.goto('scene-farplane')`. Nothing in the game depends on it;
 * delete this file and the one `app.register` line in `src/debug/api.ts` and the
 * scene itself is unaffected.
 */

import type { Camera, Scene } from 'three';
import { Screen } from '../app/Screen.ts';
import { buildFarplanePainted } from './farplane.ts';
import type { PaintedScene } from './demo.ts';

export class FarplaneSceneScreen extends Screen {
  readonly name = 'scene-farplane';

  private painted: PaintedScene | null = null;

  override async enter(): Promise<void> {
    const painted = await buildFarplanePainted(this.app.renderer.camera);
    this.painted = painted;
    this.app.renderer.applyPalette(painted.palette);
    // Keep mote and spark sizes consistent whatever height we are rendering at.
    const h = this.app.renderer.domElement.height || 900;
    painted.setPixelScale(Math.max(0.5, h / 900));
    void this.app.fade('clear', 500);
  }

  override update(dt: number): void {
    this.painted?.update(dt);
  }

  override render(): { scene: Scene; camera: Camera } | null {
    if (!this.painted) return null;
    return { scene: this.painted.scene, camera: this.app.renderer.camera };
  }

  override trigger(name: string): boolean {
    if (name === 'push-in') {
      // The location's opening move: snap wide to the reveal, then settle into
      // the CTB framing.
      this.painted?.battleCamera.snapTo('reveal');
      void this.painted?.battleCamera.moveTo('idle', 2600, 'cubicInOut');
      return true;
    }
    return this.painted?.trigger(name) ?? false;
  }

  override exit(): void {
    this.painted?.dispose();
    this.painted = null;
  }

  override snapshot(): Record<string, unknown> {
    return {
      scene: 'farplane',
      backdropPlaceholder: this.painted?.backdrop.placeholder ?? null,
      rigs: this.painted ? Object.keys(this.painted.rigs) : [],
      assets: this.painted?.assetReport ?? null,
    };
  }
}
