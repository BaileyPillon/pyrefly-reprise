/**
 * CAMERA LAB: the paintings' side of the shots.
 *
 * - **Rear three-quarter paintings** (the perspectives round's candidates, `public/mock-art/`)
 *   load once at battle start as one extra pose per party figure, sized by their own sidecar
 *   (`scale`, `baselineY`), declared to face the way the body faces so they are never mirrored.
 * - **Front or rear per figure per shot**, chosen on each cut from where the lens stands against
 *   the way the figure faces (`labGeometry.viewFor`); a figure without a rear painting (VIEWS
 *   off, a spherechanged girl, an aeon) keeps its front one.
 * - **Square to the lens.** Every frame of a lab battle each figure's plane is turned to face
 *   the camera (the outer group's yaw; the interim turn is set to 0), so no figure is ever seen
 *   edge-on. The lunge rides the same group, so it reads across the frame.
 *
 * Three-side (actors are `three` objects); nothing here runs outside a lab battle.
 */

import type { PerspectiveCamera } from 'three';
import type { PaintedActor } from '../PaintedActor.ts';
import { loadPainted, type PaintedTexture } from '../PaintedArt.ts';
import type { LabChapter } from './labChapters.ts';

/** The pose name a rear painting is loaded under. */
export const LAB_REAR_POSE = 'lab-rear34';

interface Loaded {
  artId: string;
  tex: PaintedTexture;
}

function blank(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 4;
  return c;
}

export class PaintingViews {
  private readonly loaded = new Map<string, Loaded>();
  /** Each combatant's art id right now (FFX-2: the girl plus her dressphere). */
  private readonly artNow = new Map<string, string>();
  private readonly turned = new Set<PaintedActor>();
  private readonly base: string;

  constructor(private readonly chapter: LabChapter, base = import.meta.env.BASE_URL) {
    this.base = base.endsWith('/') ? base : `${base}/`;
  }

  /** Load the rear painting for each party figure whose art has one. Never rejects. */
  async load(figures: ReadonlyArray<{ id: string; artId: string; actor: PaintedActor | undefined }>): Promise<string[]> {
    const done: string[] = [];
    await Promise.all(
      figures.map(async ({ id, artId, actor }) => {
        this.artNow.set(id, artId);
        const rear = this.chapter.rears[artId];
        if (!rear || !actor) return;
        try {
          const tex = await loadPainted(`${this.base}${rear.path}`, blank, undefined, { mode: 'auto' }, false);
          if (tex.placeholder) {
            console.warn(`[camera-lab] no rear painting at ${rear.path}; ${id} keeps its front one`);
            return;
          }
          // Declared to face the way the body faces: never mirrored (chiral subjects stay right).
          tex.meta = { ...tex.meta, facing: actor.facingDir === 1 ? 'right' : 'left' };
          actor.adoptPoses({ [LAB_REAR_POSE]: tex }, actor.pose);
          this.loaded.set(id, { artId, tex });
          done.push(id);
        } catch (err) {
          console.warn(`[camera-lab] rear painting for ${id} failed`, err);
        }
      }),
    );
    return done;
  }

  /** A figure's painting set changed (an FFX-2 spherechange). */
  artChanged(id: string, artId: string, actor: PaintedActor | undefined): void {
    this.artNow.set(id, artId);
    if (!this.hasRear(id)) actor?.setViewPose(null);
  }

  /** True when this combatant's current art has a loaded rear painting. */
  hasRear(id: string): boolean {
    const l = this.loaded.get(id);
    return !!l && l.artId === (this.artNow.get(id) ?? l.artId);
  }

  /** Show the rear (true) or front (false) painting. */
  show(id: string, actor: PaintedActor | undefined, rear: boolean): void {
    if (!actor) return;
    actor.setViewPose(rear && this.hasRear(id) ? LAB_REAR_POSE : null);
  }

  /** Turn every figure's plane square to the lens (call each frame, after the camera has moved). */
  faceLens(actors: Iterable<PaintedActor>, camera: PerspectiveCamera): void {
    const cx = camera.position.x;
    const cz = camera.position.z;
    for (const a of actors) {
      if (!this.turned.has(a)) {
        a.setInterimYaw(0);
        this.turned.add(a);
      }
      a.rotation.y = Math.atan2(cx - a.position.x, cz - a.position.z);
    }
  }

  /** Free the rear textures (the actors do not own them). */
  dispose(): void {
    for (const { tex } of this.loaded.values()) tex.texture.dispose();
    this.loaded.clear();
    this.turned.clear();
  }
}
