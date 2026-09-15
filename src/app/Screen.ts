import type { Scene, Camera } from 'three';
import type { App } from './App.ts';
import type { InputSnapshot } from './Input.ts';

/**
 * A screen owns one slice of the game: title, chapter select, prep menus, a
 * cutscene, a battle. Exactly one screen is active (the top of `App`'s stack)
 * and receives `update` / `handleInput`.
 *
 * A screen may optionally provide the 3D scene + camera to render; when it
 * returns null the previous screen's scene keeps rendering underneath, which is
 * how menus overlay a live battle diorama.
 */
export abstract class Screen {
  /** Stable identifier used by the debug API's `goto()` and by tests. */
  abstract readonly name: string;

  /** Set by App when the screen is pushed. */
  app!: App;

  /** Root element for this screen's DOM, inside #ui. Created by App. */
  root!: HTMLElement;

  /** Called once after `app` and `root` are wired, before the first update. */
  enter(): void | Promise<void> {}

  /** Called before the screen is removed. Release DOM, textures, listeners. */
  exit(): void | Promise<void> {}

  /** Called when another screen is pushed on top of this one. */
  suspend(): void {}

  /** Called when the screen above is popped and this one becomes active again. */
  resume(): void {}

  /** @param dt seconds since the last frame, clamped by App. */
  update(_dt: number): void {}

  /** Called once per frame before `update`, only while this screen is on top. */
  handleInput(_input: InputSnapshot): void {}

  /**
   * The scene/camera to draw this frame, or null to keep drawing whatever the
   * screen below provided.
   */
  render(): { scene: Scene; camera: Camera } | null {
    return null;
  }

  /** Arbitrary state for `window.__pyrefly.snapshotState()`. */
  snapshot(): Record<string, unknown> {
    return {};
  }
}
