/**
 * The painted battle field: one {@link PaintedActor} per live combatant, the
 * camera rigs, the VFX bank and the world->screen projection the HUD and the
 * damage numerals position themselves with.
 *
 * This is the only half of the presenter that touches Three.js. It implements
 * {@link BattleStage} from `BattlePresenterPorts.ts`, which is what keeps
 * `BattlePresenter.ts` headless and unit-testable.
 */

import { Vector3, type PerspectiveCamera, type Scene } from 'three';
import type { AnyCombatant, BattleState, CombatantId, Side } from '../battle/common/types.ts';
import { artIdFor, resolveArt, resolvePoseMap, worldHeightFor } from './BattlePresenterArt.ts';
import type { BattleStage, CameraPort, Point2, VfxPort } from './BattlePresenterPorts.ts';
import type { BattleCamera } from './BattleCamera.ts';
import { PaintedActor } from './PaintedActor.ts';
import { paintBossSilhouette, paintPlaceholderFigure } from './ProceduralArt.ts';
import { HitEffects } from './VFX.ts';
import type { SceneSlots } from '../scenes/index.ts';

export interface PaintedStageOptions {
  scene: Scene;
  camera: PerspectiveCamera;
  battleCamera: BattleCamera;
  slots: SceneSlots;
  /** The WebGL canvas, for projecting world points into CSS pixels. */
  canvas: HTMLCanvasElement;
  /** Overlay element the screen flash paints into. Optional. */
  overlayRoot?: HTMLElement | null;
  /** Rim colour handed down from the scene's light rig. */
  rim?: { color: number | string; dir: [number, number] };
}

interface StagedActor {
  actor: PaintedActor;
  side: Side;
  slot: number;
  artId: string;
  kind: 'party' | 'enemy';
}

/** Colour a VFX key plays in. Unknown keys fall through to the generic impact. */
const VFX_COLOURS: Readonly<Record<string, number>> = {
  fire: 0xff8a4a,
  ice: 0x9fe4ff,
  lightning: 0xfff08a,
  thunder: 0xfff08a,
  water: 0x6fd0ff,
  holy: 0xfff6d0,
  heal: 0x9dffc4,
  cure: 0x9dffc4,
  pyrefly: 0x9dffc4,
  slash: 0xffffff,
  impact: 0xdff0ff,
  dark: 0xb08aff,
};

export class PaintedStage implements BattleStage {
  readonly camera: CameraPort;
  readonly vfx: VfxPort;

  private readonly opts: PaintedStageOptions;
  private readonly actors = new Map<CombatantId, StagedActor>();
  private readonly hits: HitEffects;
  private readonly scratch = new Vector3();
  private flashEl: HTMLElement | null = null;

  constructor(opts: PaintedStageOptions) {
    this.opts = opts;
    this.camera = opts.battleCamera;
    this.hits = new HitEffects(
      { size: 4.2, coreColor: 0xffffff, edgeColor: 0x9fd8ff, arc: 2.45, thickness: 0.075 },
      { count: 110, speed: 6.4, life: 0.5, size: 10, bias: [0.4, 0.45, 0.2], focus: 0.5 },
      { color: 0xdff0ff, size: 3.0 },
    );
    opts.scene.add(this.hits);
    this.vfx = this.makeVfxPort();
  }

  // ------------------------------------------------------------------ staging

  /**
   * Build an actor for every combatant that is on the field right now.
   *
   * Explicitly the active party, the summoned aeon and the enemy formation —
   * **not** every combatant in the record. A bench member and a form waiting
   * off-stage are both in `state.combatants`, and staging them would pile a
   * second Wakka onto slot 0.
   */
  async stage(state: BattleState): Promise<void> {
    const ids = new Set<CombatantId>([
      ...state.activeIds,
      ...(state.aeonId ? [state.aeonId] : []),
      ...state.enemyIds,
    ]);
    // Destructible parts are separate combatants that still need drawing.
    for (const c of Object.values(state.combatants)) {
      if (c.flags.isPart && !c.flags.hidden && !c.removed) ids.add(c.id);
    }

    for (const id of [...this.actors.keys()]) {
      if (!ids.has(id)) this.removeCombatant(id);
    }

    const live = [...ids]
      .map((id) => state.combatants[id])
      .filter((c): c is AnyCombatant => !!c && !c.flags.hidden && !c.removed);
    await Promise.all(live.map((c) => this.add(c)));
  }

  /** Add (or replace) one combatant's actor. */
  async add(c: AnyCombatant): Promise<PaintedActor | undefined> {
    this.removeCombatant(c.id);
    const kind: 'party' | 'enemy' = c.side === 'enemy' ? 'enemy' : 'party';
    // The mapped id first, then the raw ones, so a figure whose art has not
    // been renamed yet still shows its painting instead of a silhouette.
    const { artId, poses } = await resolveArt([artIdFor(c), c.spriteKey, c.id], kind);
    const heights = {
      party: this.opts.slots.partyHeight ?? 1.82,
      enemy: this.opts.slots.enemyHeight ?? 4.1,
    };

    const actor = await PaintedActor.create({
      name: c.id,
      facing: kind === 'party' ? 1 : -1,
      worldHeight: worldHeightFor(c, heights),
      crossfadeMs: kind === 'party' ? 120 : 140,
      poses,
      placeholder:
        kind === 'party'
          ? (): HTMLCanvasElement => paintPlaceholderFigure({ seed: hash(c.id), tint: '#6a7386' })
          : (): HTMLCanvasElement => paintBossSilhouette({ seed: hash(c.id) }),
      placeholderBaseline: kind === 'party' ? 0.965 : 0.985,
      matte: { mode: 'auto' },
      rim: this.opts.rim
        ? { color: this.opts.rim.color, strength: 0.8, dir: this.opts.rim.dir, width: 3.4 }
        : { strength: 0.7 },
      groundShade: 0.24,
      shadow: { radius: kind === 'party' ? 0.62 : 1.5, opacity: 0.48 },
      breathe: { amplitude: 0.016, speed: 0.4 },
      sway: { amplitude: 0.009, speed: 0.22 },
    });

    const spots = kind === 'party' ? this.opts.slots.party : this.opts.slots.enemy;
    const spot = spots[Math.min(c.slot, spots.length - 1)] ?? spots[0] ?? [0, 0, 0];
    actor.position.set(spot[0], spot[1], spot[2]);
    if (!c.alive && c.side === 'party') actor.setPose('ko');

    this.opts.scene.add(actor);
    this.actors.set(c.id, { actor, side: c.side, slot: c.slot, artId, kind });
    return actor;
  }

  // ---------------------------------------------------------- BattleStage API

  actor(id: CombatantId): PaintedActor | undefined {
    return this.actors.get(id)?.actor;
  }

  sideOf(id: CombatantId): Side | undefined {
    return this.actors.get(id)?.side;
  }

  staged(): CombatantId[] {
    const ids = [...this.actors.entries()];
    ids.sort((a, b) => rank(a[1].side) - rank(b[1].side) || a[1].slot - b[1].slot);
    return ids.map(([id]) => id);
  }

  project(id: CombatantId): Point2 | null {
    const staged = this.actors.get(id);
    if (!staged) return null;
    staged.actor.headPoint(this.scratch);
    this.scratch.project(this.opts.camera);
    const rect = this.opts.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: rect.left + (this.scratch.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-this.scratch.y * 0.5 + 0.5) * rect.height,
    };
  }

  /** Swap a combatant's painting in place — form change, spherechange. */
  async setArt(id: CombatantId, artId: string): Promise<void> {
    const staged = this.actors.get(id);
    if (!staged || staged.artId === artId) return;
    staged.artId = artId;
    await staged.actor.loadPoses(await resolvePoseMap(artId, staged.kind), 'idle');
  }

  async addCombatant(
    id: CombatantId,
    opts: { artId: string; side: 'party' | 'enemy' | 'aeon'; slot: number },
  ): Promise<PaintedActor | undefined> {
    const stub = {
      id,
      name: id,
      side: opts.side,
      spriteKey: opts.artId,
      slot: opts.slot,
      alive: true,
      removed: false,
      flags: {},
    } as unknown as AnyCombatant;
    return this.add(stub);
  }

  removeCombatant(id: CombatantId): void {
    const staged = this.actors.get(id);
    if (!staged) return;
    this.actors.delete(id);
    staged.actor.dispose();
  }

  // ------------------------------------------------------------------ effects

  private makeVfxPort(): VfxPort {
    const impactAt = async (
      at: CombatantId | 'screen',
      key: string,
      crit: boolean,
    ): Promise<void> => {
      const colour = VFX_COLOURS[key] ?? VFX_COLOURS['impact']!;
      if (at === 'screen') {
        this.screenFlash(`#${colour.toString(16).padStart(6, '0')}`, 220);
        return;
      }
      const staged = this.actors.get(at);
      if (!staged) return;
      const point = staged.actor.centerPoint(this.scratch.clone());
      this.hits.flash.play(point, crit ? 320 : 260, crit ? 1.4 : 1.0);
      this.hits.sparks.emit(point, crit ? 1.35 : 1);
      if (key === 'slash' || key === 'impact') {
        await this.hits.slash.play(point, 300, -0.62);
      }
    };

    return {
      play: (key, at) => impactAt(at, key, false),
      impact: (at, o) => impactAt(at, o?.element && o.element !== 'none' ? o.element : 'slash', o?.crit === true),
      screenFlash: (colour, ms) => this.screenFlash(colour, ms),
    };
  }

  /** A full-screen colour wash. No-ops when the screen gave us no overlay. */
  screenFlash(colour = '#ffffff', ms = 220): void {
    const root = this.opts.overlayRoot;
    if (!root || typeof document === 'undefined') return;
    if (!this.flashEl) {
      const el = document.createElement('div');
      el.className = 'battle-screen-flash';
      el.style.cssText =
        'position:absolute;inset:0;pointer-events:none;opacity:0;z-index:40;mix-blend-mode:screen';
      root.appendChild(el);
      this.flashEl = el;
    }
    const el = this.flashEl;
    el.style.background = colour;
    el.style.transition = 'none';
    el.style.opacity = '1';
    // Next frame, so the browser sees the 1 -> 0 transition.
    requestAnimationFrame(() => {
      el.style.transition = `opacity ${ms}ms ease-out`;
      el.style.opacity = '0';
    });
  }

  /** @param dt seconds. Drive from the screen's update loop. */
  update(dt: number): void {
    for (const { actor } of this.actors.values()) actor.update(dt);
    this.hits.update(dt, this.opts.camera);
  }

  setPixelScale(v: number): void {
    this.hits.sparks.setPixelScale(v);
  }

  /** Everything the debug snapshot wants about the field. */
  snapshot(): Array<{ id: string; side: Side; art: string; pose: string; placeholder: boolean }> {
    return [...this.actors.entries()].map(([id, s]) => ({
      id,
      side: s.side,
      art: s.artId,
      pose: s.actor.pose,
      placeholder: s.actor.isPlaceholder,
    }));
  }

  dispose(): void {
    for (const { actor } of this.actors.values()) actor.dispose();
    this.actors.clear();
    this.hits.dispose();
    this.flashEl?.remove();
    this.flashEl = null;
  }
}

function rank(side: Side): number {
  return side === 'party' ? 0 : side === 'aeon' ? 1 : 2;
}

/** Stable per-id seed so a placeholder figure looks the same every boot. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 997;
}
