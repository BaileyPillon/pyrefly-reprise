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
import { screenBox } from '../../engine/lab/labGeometry.ts';
import { labSession } from '../../engine/lab/LabSession.ts';
import type { LabCut } from '../../engine/lab/LabDirectorCore.ts';
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
  /** Before the stage's own update (release 39): the art governor is asked for the masters the shots ahead will need while its load slots are free. */
  before(dt: number): void;
  /** After the field has updated, before the render. */
  update(dt: number): void;
  snapshot(): Record<string, unknown>;
  dispose(): void;
}

/** What the art governor held for each figure drawn at the moment of a cut (release 39: the proof that the master is in place at the cut). */
interface ArtAtCut {
  /** Milliseconds on the page's clock. */
  t: number;
  shot: string;
  /** Per figure drawn: its file, the master it holds (1 to 4) and the screen pixels one texel of that master covers (above 1.04 = soft). */
  figures: Array<{ file: string; scale: number; mag: number }>;
  /** Figures on screen below the largest master that are softer than one texel per pixel at this very frame (a bigger master was there to load). */
  late: number;
  /** Figures on screen softer than one texel per pixel even from the master they hold (the 4x is the largest there is). */
  soft: number;
}

interface GovernorLike {
  governor: {
    measureFrom(cam: PerspectiveCamera): Array<{ url: string; scale: number; px1x: number; mag: number }>;
    /** The loads in flight (private in the governor; the lab only reads it: it asks in the frame a slot is free). */
    inflight?: number;
  };
}
/** The governor starts at most this many loads at once (`ArtGovernor.MAX_LOADS`). */
const GOVERNOR_SLOTS = 2;

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

  // Release 39 (the hi-res art tiers): the lab asks the art governor for the masters its close shots need before the cut; `?labart=off` turns it off.
  const anticipate = new URLSearchParams(globalThis.location?.search ?? '').get('labart') !== 'off';
  const artAtCut: ArtAtCut[] = [];
  const noteArt = (cut: LabCut): void => {
    const gov = (stage as unknown as Partial<{ art: GovernorLike }>).art?.governor;
    if (!gov) return;
    // Only the figures the shot actually shows: a painting of a figure behind the lens or off the frame is measured as hugely magnified and means nothing.
    const rig = director.rig;
    const aspect = (o.canvas.clientWidth || 16) / (o.canvas.clientHeight || 9);
    const shown = new Set<string>();
    for (const f of director.figures()) {
      const b = rig ? screenBox(rig, f, aspect) : null;
      if (!b || b.x1 < -1 || b.x0 > 1 || b.y1 < -1 || b.y0 > 1) continue;
      const c = engine.state().combatants[f.id];
      shown.add(c ? artIdFor(c) : f.id);
    }
    const folderOf = (url: string): string => url.split('/').slice(-2)[0] ?? '';
    const rows = gov.measureFrom(o.camera).filter((r) => [...shown].some((s) => folderOf(r.url) === s || folderOf(r.url).startsWith(s)));
    artAtCut.push({
      t: Math.round(performance.now()),
      shot: `${cut.shot.kind}:${cut.shot.subject ?? '-'}`,
      figures: rows.map((r) => ({ file: r.url.split('/').slice(-2).join('/'), scale: r.scale, mag: r.mag })),
      late: rows.filter((r) => r.mag > 1.04 && r.scale < 4).length,
      soft: rows.filter((r) => r.mag > 1.04).length,
    });
    if (artAtCut.length > 60) artAtCut.shift();
  };

  const director = new LabDirector({
    anticipate,
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
    before: (dt) => {
      const inflight = (): number => (stage as unknown as Partial<{ art: GovernorLike }>).art?.governor.inflight ?? 0;
      director.tickAnticipation(dt, () => inflight() < GOVERNOR_SLOTS, inflight);
    },
    update(dt: number): void {
      if (ch.game === 'ffx' && director.core.menuOpen) director.core.menuLevel(readLevel());
      const cut = director.update(dt);
      if (cut) noteArt(cut);
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
    snapshot: () => ({ ...director.snapshot(), menu: { state: menu.state, reason: menu.reason }, switches: { ...session.switches }, chapter: ch.id, artAtCut: artAtCut.slice(-60), anticipate }),
    dispose(): void {
      unsub();
      chip.dispose();
      menu.dispose();
      director.dispose();
    },
  };
}
