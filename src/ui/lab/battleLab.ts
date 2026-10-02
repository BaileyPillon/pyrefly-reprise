/**
 * CAMERA LAB: everything a lab battle adds to `BattleScreen`, in one place. `BattleScreen`
 * imports this module only when `cameraLabForBattle()` says the battle is a lab battle (a
 * dynamic import), so without `?camera=lab` none of it is loaded, built or called.
 *
 * What it wires:
 * - the formation, once, through the stage's own slots and pins (`labSlots`), so the
 *   presenter's homes, lunges and returns are the lab's from the first frame;
 * - the director (`src/engine/lab/LabDirector.ts`) and the camera the presenter sees;
 * - the HUD's side: the target highlight and the skill list (FFX), the menu at the hero, the chip.
 *
 * Game case (rule 14): both games, as a test; the per-game rules live in the director.
 */

import type { PerspectiveCamera } from 'three';
import type { BattleEngine } from '../../battle/common/types.ts';
import type { Chapter } from '../../data/encounters.ts';
import type { PaintedStage } from '../../engine/BattlePresenterStage.ts';
import type { BattleStage, PlaybackSpeed } from '../../engine/BattlePresenterPorts.ts';
import type { HudPort, TargetingPort } from '../../engine/HudPort.ts';
import type { BattleCamera } from '../../engine/BattleCamera.ts';
import type { SceneSlots } from '../../scenes/index.ts';
import { artIdFor } from '../../engine/BattlePresenterArt.ts';
import { SPEED_SCALE } from '../../engine/BattlePresenterUtil.ts';
import { headlineEnemy } from '../../battle/common/headlineEnemy.ts';
import { battleComfort } from '../../app/screens/battleComfort.ts';
import { LabDirector } from '../../engine/lab/LabDirector.ts';
import { labChapter } from '../../engine/lab/labChapters.ts';
import { labSession } from '../../engine/lab/LabSession.ts';
import type { LabCameraPort } from '../../engine/lab/LabTypes.ts';
import { installInkGoldStyles } from '../inkgold/index.ts';
import { LabChip } from './labChip.ts';
import { MenuAtHero } from './menuAtHero.ts';
import './lab.css';

/** The scene's slots with the lab's formation: party spots by slot, enemies pinned. */
export function labSlots(chapterId: string, slots: SceneSlots): SceneSlots {
  const ch = labChapter(chapterId);
  if (!ch) return slots;
  const party = slots.party.map((s, i) => (ch.partySlots[i] ? ([...ch.partySlots[i]!] as [number, number, number]) : s));
  return { ...slots, party, enemySpots: { ...(slots.enemySpots ?? {}), ...ch.enemyPins } };
}

export interface CameraLabHandle {
  /** The field as the presenter should see it: the painted stage, its camera now the lab's. */
  readonly stage: BattleStage;
  readonly port: LabCameraPort;
  wrapTargeting(port: TargetingPort): TargetingPort;
  fieldDt(dt: number): number;
  /** After the field has updated, before the render. */
  update(dt: number): void;
  snapshot(): Record<string, unknown>;
  dispose(): void;
}

export interface CameraLabOptions {
  chapter: Chapter;
  stage: PaintedStage;
  battleCamera: BattleCamera;
  camera: PerspectiveCamera;
  canvas: HTMLCanvasElement;
  root: HTMLElement;
  engine: BattleEngine | null;
  hud: () => HudPort | null;
  speed: () => PlaybackSpeed;
}

export async function attachCameraLab(o: CameraLabOptions): Promise<CameraLabHandle | null> {
  const ch = labChapter(o.chapter.id);
  if (!ch || !o.engine) return null;
  installInkGoldStyles();
  const engine = o.engine;
  const session = labSession();
  const stage = o.stage;
  const alive = (id: string): boolean => engine.state().combatants[id]?.alive !== false;
  const bossId = (): string | null => headlineEnemy(engine.state(), o.chapter.enemyGroupRef.bossId)?.id ?? null;

  const director = new LabDirector({
    chapter: ch,
    battleCamera: o.battleCamera,
    camera: o.camera,
    field: stage,
    switches: () => session.switches,
    speedScale: () => SPEED_SCALE[o.speed()],
    reduceMotion: () => battleComfort().reduceMotion,
    aspect: () => (o.canvas.clientWidth || 16) / (o.canvas.clientHeight || 9),
    bossId,
    alive,
  });

  // The formation check: the lab's slots were laid by slot, and these are who stand in them.
  const state = engine.state();
  state.activeIds.forEach((id) => {
    const c = state.combatants[id];
    const want = c ? ch.expectParty[c.slot] : undefined;
    if (c && want && want !== id) console.warn(`[camera-lab] slot ${c.slot} holds ${id}, the lab expected ${want}`);
  });
  const loaded = await director.views.load(
    state.activeIds.map((id) => ({ id, artId: state.combatants[id] ? artIdFor(state.combatants[id]!) : id, actor: stage.actor(id) })),
  );
  console.info(`[camera-lab] ${ch.id}: rear paintings for ${loaded.join(', ') || 'nobody'}`);

  // The presenter keeps the painted stage itself (summon staging and the eye-candy port key on it);
  // only its camera becomes the lab's, which lets the presenter's own framing through while the lab yields.
  Object.defineProperty(stage, 'camera', { value: director.wrapCamera(stage.camera), configurable: true, writable: true });
  const chip = new LabChip(o.root, ch.game);
  const menu = new MenuAtHero(o.root, ch.game, {
    rect: (id) => stage.projectRect(id),
    avoid: (actorId) => stage.staged().filter((id) => id !== actorId && alive(id)),
    enemies: () => stage.staged().filter((id) => stage.sideOf(id) === 'enemy' && alive(id)),
  });
  let anchorOwed = false;
  let anchoredFor: string | null = null;
  const unsub = session.onChange(() => {
    director.switchesChanged();
    anchorOwed = true;
  });

  // FFX's skill list: its breadcrumb shows one level down ("MAGIC"); the HUD reports nothing else.
  let crumb: HTMLElement | null = null;
  const readLevel = (): 'top' | 'sub' => {
    crumb ??= o.root.querySelector<HTMLElement>('.ffx-cmd-breadcrumb');
    return crumb && !crumb.hidden ? 'sub' : 'top';
  };

  const reproject = (): void => {
    // FFX's target cursor projects itself only on a change of selection; after a cut it is redrawn.
    const hud = o.hud();
    if (hud && ch.game === 'ffx' && director.core.aim) hud.setProjector((id, anchor) => stage.project(id, anchor) ?? null);
  };

  return {
    stage,
    port: director.port,
    wrapTargeting(port: TargetingPort): TargetingPort {
      return {
        ...port,
        select(sel) {
          port.select(sel);
          const first = sel?.ids[0];
          director.core.target(first ? { id: first, enemy: stage.sideOf(first) === 'enemy' } : null);
        },
      };
    },
    fieldDt: (dt) => director.fieldDt(dt),
    update(dt: number): void {
      if (ch.game === 'ffx' && director.core.menuOpen) director.core.menuLevel(readLevel());
      const cut = director.update(dt);
      // The HUD lays out only once a cut has landed: the camera is already on the new shot here
      // (snapped, matrices updated), and the browser paints after this frame's update.
      const actor = director.core.menuOpen ? director.core.menuActor : null;
      if (cut || anchorOwed || actor !== anchoredFor) {
        anchorOwed = false;
        anchoredFor = actor;
        if (actor) menu.anchor(actor, session.switches.menuAtHero);
        reproject();
      }
    },
    snapshot: () => ({ ...director.snapshot(), menu: { state: menu.state, reason: menu.reason }, switches: { ...session.switches }, chapter: ch.id }),
    dispose(): void {
      unsub();
      chip.dispose();
      menu.dispose();
      director.dispose();
    },
  };
}
