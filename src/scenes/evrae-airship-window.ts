/**
 * **A window that changes shape after the battle has bound (the second check's M1, 2026-10-04; FFX only).**
 *
 * Game case: FFX only [AGENTS.md rule 14]. Chapter VIII's Evrae is the only fight whose stage depends on the window's shape
 * (`evrae-airship-aspect.ts`); the range director binds one of these for that fight alone, on a desktop-shaped window, and for
 * nothing else (not Sin's Fins, not Chapter XVIII's face, not the phone, and no FFX-2 chapter).
 *
 * The director read the aspect once, at the bind, so a window that changed shape mid-fight (a fullscreen toggle on a 16:10
 * laptop, a dragged edge, a docked panel) kept the stand-back it had: 1440x790 resized to 1440x900 put 1,030 px of the coil inside
 * the turn rail's rect for the rest of the fight. This is the game's own resize path, `resize` on the window (the renderer and
 * every HUD listen to the same event), turned into one signal: the window has changed shape and then held still, so read the
 * aspect again. The read waits on frame time (the director's `update`), so a dragged edge or a toggle's few events cost one read,
 * and a test can step it. What the director does with the read (the rigs at once, the camera only between beats) is `restand` there.
 *
 * Also here: the two reads of the window the director makes (`onPhone`, `viewportAspect`), moved out of it unchanged to keep
 * that file under the house 400 lines.
 */

import { PHONE_BATTLE_QUERY } from '../ui/common/phoneBattle.ts';
import { NEAR_ASPECT_REF } from './evrae-airship-aspect.ts';

/** True when the phone battle HUD takes this window (read at each bind); false with no window (a test). */
export function onPhone(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.(PHONE_BATTLE_QUERY).matches === true;
}

/** The window's aspect, width over height; 16:9 with no window (a test), the stage NEAR's rigs are authored for. */
export function viewportAspect(): number {
  return typeof window !== 'undefined' && window.innerWidth > 0 && window.innerHeight > 0 ? window.innerWidth / window.innerHeight : NEAR_ASPECT_REF;
}

/**
 * Seconds a window must hold one shape before the stand-back follows it. A dragged edge's `resize` events come every frame, far
 * inside it, so a drag is one read. Short on purpose: a menu opens about a second after the last one closes, and the mix needs a
 * calm frame to plan the new base before it does, so a resize in the beat between them has to be read early (measured with 0.3 s: a
 * resize 0.9 s after a command was confirmed was read after the next menu had opened, and that menu kept the old stand-back).
 */
export const WINDOW_SETTLE_S = 0.1;

export class WindowShape {
  /** Frame-time seconds since the window's last `resize`; null while none waits to be read. */
  private since: number | null = null;
  private readonly onResize = (): void => {
    this.since = 0;
  };

  constructor() {
    // `?.`: a test's window stand-in (and a headless run, with no window at all) has nothing to listen on.
    if (typeof window !== 'undefined') window.addEventListener?.('resize', this.onResize, { passive: true });
  }

  /** Bind (`on`) or let go of (`!on`) the watch the director holds: one per director, never two. */
  static follow(held: WindowShape | null, on: boolean): WindowShape | null {
    if (on) return held ?? new WindowShape();
    held?.dispose();
    return null;
  }

  /** True once a `resize` has held still for {@link WINDOW_SETTLE_S}; it stays true until {@link read}. @param dt seconds */
  settled(dt: number): boolean {
    if (this.since === null) return false;
    this.since += dt;
    return this.since >= WINDOW_SETTLE_S;
  }

  /** The aspect has been read: wait for the next `resize`. */
  read(): void {
    this.since = null;
  }

  dispose(): void {
    if (typeof window !== 'undefined') window.removeEventListener?.('resize', this.onResize);
  }
}
