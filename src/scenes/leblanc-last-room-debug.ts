/**
 * A throwaway screen that stages the Chateau Leblanc Last Room composition —
 * {@link buildLeblancLastRoomPainted}, i.e. {@link buildLeblancLastRoomScene}
 * with Yuna, Rikku and Paine on the party slots and Leblanc, Logos and Ormi on
 * the trio's — so the location can be looked at, and screenshotted, without a
 * battle, a HUD or a presenter around it.
 *
 * It exists for `node tools/screenshot.mjs --screen=scene-leblanc-last-room
 * --rig=<name>` and for `__pyrefly.goto('scene-leblanc-last-room')`. Nothing
 * in the game depends on it; delete this file and the one `app.register` line
 * in `src/debug/api.ts` and the scene itself is unaffected.
 */

import type { Camera, Scene } from 'three';
import { Screen } from '../app/Screen.ts';
import { buildLeblancLastRoomPainted } from './leblanc-last-room-painted.ts';
import type { PaintedScene } from './demo.ts';

export class LeblancLastRoomSceneScreen extends Screen {
  readonly name = 'scene-leblanc-last-room';

  private painted: PaintedScene | null = null;

  override async enter(): Promise<void> {
    const painted = await buildLeblancLastRoomPainted(this.app.renderer.camera);
    this.painted = painted;
    this.app.renderer.applyPalette(painted.palette);
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
      // The ambush: snap wide to the establishing shot, then settle into the
      // CTB framing — mirrors `farplane-debug.ts`'s `push-in`.
      this.painted?.battleCamera.snapTo('intro');
      void this.painted?.battleCamera.moveTo('idle', 2400, 'cubicInOut');
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
      scene: 'leblanc-last-room',
      backdropPlaceholder: this.painted?.backdrop.placeholder ?? null,
      rigs: this.painted ? Object.keys(this.painted.rigs) : [],
      assets: this.painted?.assetReport ?? null,
    };
  }
}
