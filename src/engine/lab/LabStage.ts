/**
 * CAMERA LAB: the field as the presenter sees it in a lab battle: the painted stage itself,
 * except that its camera is the lab's (`LabCamera`), which lets the presenter's own framing
 * through only while the lab yields. Everything else is forwarded untouched.
 *
 * No `three`, no DOM: it is typed against the presenter's `BattleStage` port.
 */

import type { CombatantId } from '../../battle/common/types.ts';
import type { ActorHandle, ArrivalClock, BattleStage, CameraPort, LightingPort, Point2, VfxPort } from '../BattlePresenterPorts.ts';

export class LabStage implements BattleStage {
  constructor(
    private readonly inner: BattleStage,
    readonly camera: CameraPort,
  ) {}

  get vfx(): VfxPort {
    return this.inner.vfx;
  }

  get lighting(): LightingPort | undefined {
    return this.inner.lighting;
  }

  /** Eye-candy option C's port, which the presenter reads off the stage (`fx/c/presenterHooks.ts`). */
  get fx(): BattleStage['fx'] {
    return this.inner.fx;
  }

  actor(id: CombatantId): ActorHandle | undefined {
    return this.inner.actor(id);
  }

  sideOf(id: CombatantId): 'party' | 'enemy' | 'aeon' | undefined {
    return this.inner.sideOf(id);
  }

  staged(): CombatantId[] {
    return this.inner.staged();
  }

  project(id: CombatantId, anchor?: 'head' | 'chest' | 'feet'): Point2 | null {
    return this.inner.project(id, anchor);
  }

  setArt(id: CombatantId, artId: string): Promise<void> {
    return this.inner.setArt(id, artId);
  }

  addCombatant(id: CombatantId, opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number }): Promise<ActorHandle | undefined> {
    return this.inner.addCombatant(id, opts);
  }

  removeCombatant(id: CombatantId): void {
    this.inner.removeCombatant(id);
  }

  slotOf(id: CombatantId): number | undefined {
    return this.inner.slotOf?.(id);
  }

  arrive(id: CombatantId, clock: ArrivalClock): Promise<ActorHandle | undefined> {
    return this.inner.arrive ? this.inner.arrive(id, clock) : Promise.resolve(this.inner.actor(id));
  }

  paints(id: CombatantId, pose: string): boolean {
    return this.inner.paints?.(id, pose) === true;
  }
}
