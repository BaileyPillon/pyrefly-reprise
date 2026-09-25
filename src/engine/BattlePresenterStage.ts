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
import type { ArrivalClock, BattleStage, Point2, VfxPort } from './BattlePresenterPorts.ts';
import { arrivalsOf, type ArrivalCleanup, type ArrivalDirectors } from './StageArrivals.ts';
import type { BattleCamera } from './BattleCamera.ts';
import { PaintedActor } from './PaintedActor.ts';
import { paintBossSilhouette, paintPlaceholderFigure } from './ProceduralArt.ts';
import { HitEffects } from './VFX.ts';
import type { SceneSlots } from '../scenes/index.ts';
import { solveFormation, type FormationMember } from './Formation.ts';
import { occludersOf, visibilityOf, type DepthRect, type ScreenRect } from './ScreenRects.ts';
import { laneFrom, relaxActorsOf, relaxField } from './StageRelax.ts';
import { TargetHighlight } from './TargetHighlight.ts';
import { HoldableCamera } from './TargetFrameHold.ts';
import { departureKindOf, departurePoses } from './BattlePresenterDepartures.ts';
import { disposeStoneShards, stoneShatter } from './StoneShards.ts';
import { layProneFigures } from './ProneLay.ts';
import { figureBloomMasked } from './BloomMask.ts';
import { anchorFor, PartRings, type ParentPose, type PartAnchor } from './PartAnchors.ts';
import * as SA from './StageAnchors.ts';

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
  /** Mid-battle entrances by combatant id. Defaults to what the scene published (`StageArrivals.ts`). */
  arrivals?: ArrivalDirectors;
}

interface StagedActor {
  actor: PaintedActor;
  side: Side;
  slot: number;
  artId: string;
  kind: 'party' | 'enemy';
  /** True for a destructible part of a larger machine (Vegnagun's leg). */
  isPart?: boolean;
  /** The machine this is a part of, when `isPart`. */
  parentId?: CombatantId;
  /** Set for a figure-less part placed on its parent (`PartAnchors.ts`); the solver never moves it. */
  anchor?: PartAnchor;
  /** Stood on its scene's `enemySpots` entry; the solver and the relaxation leave it there. */
  pinned?: boolean;
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
  /** The battle camera behind the FFX-2 target-frame hold (`TargetFrameHold.ts`, PR-0150). */
  readonly camera: HoldableCamera;
  readonly vfx: VfxPort;
  /**
   * The selection marks on the field — the accent pool and the quiet dim of
   * option B. The HUD drives it; the debug API reads it back.
   */
  readonly highlight: TargetHighlight;

  private readonly opts: PaintedStageOptions;
  private readonly actors = new Map<CombatantId, StagedActor>();
  private readonly hits: HitEffects;
  private readonly scratch = new Vector3();
  private readonly paintScratch = new Vector3();
  private readonly quad: [Vector3, Vector3, Vector3, Vector3] = [
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
  ];
  /** HUD panel rectangles that count as occluders. Published by the HUD. */
  private panels: ScreenRect[] = [];
  private flashEl: HTMLElement | null = null;
  /**
   * The state last staged from. The engines hand out their live state object,
   * so this is also where {@link arrive} finds a combatant revealed mid-fight.
   */
  private lastState: BattleState | null = null;
  private readonly arrivals: ArrivalDirectors;
  /** What each arrival left on the field, undone when that figure leaves it. */
  private readonly arrivalCleanups = new Map<CombatantId, ArrivalCleanup>();
  /** The rings a figure-less part wears on its parent (Vegnagun's Bulwarks and Redoubts, D-044). */
  private readonly partRings: PartRings;

  constructor(opts: PaintedStageOptions) {
    this.opts = opts;
    this.partRings = new PartRings(opts.scene);
    this.arrivals = opts.arrivals ?? arrivalsOf(opts.scene);
    this.highlight = new TargetHighlight({
      actor: (id) => this.actor(id),
      staged: () => this.staged(),
    });
    this.camera = new HoldableCamera(opts.battleCamera);
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
    this.lastState = state;
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
    // Only after every actor exists: the solver needs each fiend's real world
    // height, which is not known until its idle painting has loaded.
    this.applyFormation();
  }

  /** Add (or replace) one combatant's actor. */
  async add(c: AnyCombatant, worldHeight?: number): Promise<PaintedActor | undefined> {
    this.removeCombatant(c.id);
    const kind: 'party' | 'enemy' = c.side === 'enemy' ? 'enemy' : 'party';
    // The mapped id first, then the raw ones, so a figure whose art has not
    // been renamed yet still shows its painting instead of a silhouette.
    const art = await resolveArt([artIdFor(c), c.spriteKey, c.id], kind);
    const { artId } = art;
    const poses = departurePoses(c.id, art.poses); // D-031 Evrae
    const heights = { party: this.opts.slots.partyHeight ?? 1.82, enemy: this.opts.slots.enemyHeight ?? 4.1 };
    const own = this.opts.slots.figureHeights?.[c.id]; // a scene's per-combatant height; ring and shadow follow it
    const k = own !== undefined && !worldHeight ? own / worldHeightFor(c, heights) : 1;

    const anchor = anchorFor(this.opts.slots.partAnchors, c.id);
    const actor = await PaintedActor.create({
      name: c.id,
      ...(anchor ? SA.anchoredActorOptions(anchor) : {}),
      // The *body's* facing, from the side — party and aeons turn toward +x,
      // enemies toward -x. Whether the painting is mirrored is a separate
      // question, answered by each pose's sidecar; art painted to the contract
      // (party faces right, enemies face left) is drawn exactly as painted.
      side: c.side === 'enemy' ? 'enemy' : c.side === 'aeon' ? 'aeon' : 'party',
      worldHeight: anchor ? SA.anchoredHeight(anchor) : (worldHeight ?? own ?? worldHeightFor(c, heights)),
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
      bloomMask: figureBloomMasked(this.opts.slots.figureBloomMaskArt, artId),
      shadow: anchor ? false : { radius: (kind === 'party' ? 0.62 : 1.5) * k, opacity: 0.48 },
      breathe: { amplitude: 0.016, speed: 0.4 },
      sway: { amplitude: 0.009, speed: 0.22 },
      // The turn highlight: gold under a party member, a cooler ring under a
      // fiend, so whose turn it is reads even in a screenshot.
      turnRing: {
        color: kind === 'party' ? 0xf0cf92 : 0xc8a0ff,
        radius: anchor ? SA.anchoredRingRadius(anchor) : (kind === 'party' ? 0.78 : 1.7) * k,
        opacity: kind === 'party' ? 0.85 : 0.7,
      },
    });

    const spots = kind === 'party' ? this.opts.slots.party : this.opts.slots.enemy;
    const pin = kind === 'enemy' ? this.opts.slots.enemySpots?.[c.id] : undefined;
    const spot = pin ?? spots[Math.min(c.slot, spots.length - 1)] ?? spots[0] ?? [0, 0, 0];
    actor.position.set(spot[0], spot[1], spot[2]);
    // Already down when the field is staged: snap to it. `immediate` is what
    // stops a party member who was KO'd before the battle opened from toppling
    // over on frame one.
    // Seymour's body (D-046) is the one enemy that stays down on the field.
    if (!c.alive && (c.side === 'party' || departureKindOf(c.id) === 'body')) {
      actor.setPose('ko', { immediate: true });
      if (c.side === 'enemy') void actor.lieDown(0);
    }

    this.opts.scene.add(actor);
    this.actors.set(c.id, {
      actor,
      side: c.side,
      slot: c.slot,
      artId,
      kind,
      // A destructible part is laid out along its machine rather than given a
      // lane of its own — Vegnagun's leg is not a fourth fiend.
      ...(c.flags.isPart ? { isPart: true } : {}),
      ...(c.flags.partOf ? { parentId: c.flags.partOf } : {}),
      ...(anchor ? { anchor } : {}),
      ...(pin ? { pinned: true } : {}),
    });
    if (anchor) {
      this.partRings.add(c.id, anchor);
      this.placeAnchored(c.id);
    }
    return actor;
  }

  // ---------------------------------------------------------- BattleStage API

  actor(id: CombatantId): PaintedActor | undefined {
    return this.actors.get(id)?.actor;
  }

  sideOf(id: CombatantId): Side | undefined {
    return this.actors.get(id)?.side;
  }

  /** Which standing slot this combatant is on. See `BattleStage.slotOf`. */
  slotOf(id: CombatantId): number | undefined {
    return this.actors.get(id)?.slot;
  }

  staged(): CombatantId[] {
    const ids = [...this.actors.entries()];
    ids.sort((a, b) => rank(a[1].side) - rank(b[1].side) || a[1].slot - b[1].slot);
    return ids.map(([id]) => id);
  }

  project(id: CombatantId, anchor: 'head' | 'chest' | 'feet' = 'head'): Point2 | null {
    const staged = this.actors.get(id);
    if (!staged) return null;
    const parent = staged.anchor ? this.parentPose(staged) : undefined;
    if (staged.anchor && parent) SA.anchoredAim(staged.anchor, parent, anchor, this.scratch);
    else if (anchor === 'chest') staged.actor.centerPoint(this.scratch);
    else if (anchor === 'feet') this.scratch.copy(staged.actor.position);
    else staged.actor.headPoint(this.scratch);
    this.scratch.project(this.opts.camera);
    const rect = this.opts.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: rect.left + (this.scratch.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-this.scratch.y * 0.5 + 0.5) * rect.height,
    };
  }

  /**
   * The combatant's painted silhouette as a screen rectangle, in CSS pixels,
   * with its distance from the camera.
   *
   * Projects the four corners of the pose's **tight alpha box**
   * (`PaintedActor.contentQuad`) and takes their axis-aligned bounds, so the
   * rectangle hugs the figure instead of the padded PNG — a Yu Pagoda's plane
   * is most of a 1024-square canvas and only the middle strip of it is pagoda.
   * That is what makes a bracket scaled to this land on the fiend, and what
   * makes the 25%-coverage rule in the task mean what it says.
   *
   * Null for a combatant that is not staged, or while the canvas has no size.
   */
  projectRect(id: CombatantId): DepthRect | null {
    const staged = this.actors.get(id);
    if (!staged) return null;
    const rect = this.opts.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const corners = staged.anchor ? this.anchoredQuad(staged) : staged.actor.contentQuad(this.quad);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const c of corners) {
      c.project(this.opts.camera);
      const x = rect.left + (c.x * 0.5 + 0.5) * rect.width;
      const y = rect.top + (-c.y * 0.5 + 0.5) * rect.height;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;

    // Depth from the figure's own centre, not a corner: the corners of a plane
    // yawed 30 degrees differ by most of a unit, and a tie-break on one of them
    // flips which of two neighbours counts as "in front".
    staged.actor.centerPoint(this.scratch);
    const depth = this.scratch.distanceTo(this.opts.camera.position);

    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY, depth };
  }

  /** Every staged combatant's screen rectangle, keyed by id. */
  screenRects(): Map<CombatantId, DepthRect> {
    const out = new Map<CombatantId, DepthRect>();
    for (const id of this.actors.keys()) {
      const r = this.projectRect(id);
      if (r) out.set(id, r);
    }
    return out;
  }

  /**
   * How much of each combatant is clear **of other combatants**, 0..1.
   *
   * This is the one the x-ray fade answers to, and the separation is not
   * pedantry: fading the fiends in front of a target does nothing whatever
   * about a HUD card sitting on top of it, so triggering the fade off a
   * panel-inclusive number would fade the wrong things and still leave the
   * target hidden.
   */
  visibility(): Map<CombatantId, number> {
    return visibilityOf(this.screenRects());
  }

  /**
   * How much of each combatant is clear of *everything* — other combatants
   * **and** the HUD panels that have declared themselves ({@link setPanels}).
   *
   * The honest answer to "can the player see this fiend", and what the
   * formation is relaxed against, because a fiend standing under the turn list
   * is every bit as hidden as one standing behind the aeon. Measured live, it
   * is also how the Sensor card was caught opening squarely on top of the very
   * enemy the player had just aimed at.
   */
  visibilityInFrame(): Map<CombatantId, number> {
    return visibilityOf(this.screenRects(), this.panels);
  }

  /** Which staged combatants are covering `id`. Drives the x-ray fade. */
  occluders(id: CombatantId): CombatantId[] {
    return occludersOf(id, this.screenRects());
  }

  /**
   * HUD rectangles that cover the field — the command stack, the party-status
   * panel, the turn list. The HUD publishes them so `visibility()` counts a
   * fiend hidden behind a panel as hidden, which is the other half of "not
   * clearly visible".
   */
  setPanels(panels: readonly ScreenRect[]): void {
    this.panels = [...panels];
  }

  /**
   * Fade whatever is covering `id` down to `alpha`, and restore everything
   * else.
   *
   * The **fallback** path, not the main one: option B answers occlusion by
   * spreading the formation (see `Formation.ts`), and the x-ray fade was
   * option C's answer, which Bailey did not pick. It stays for the case the
   * layout genuinely cannot solve — Vegnagun's parts, which touch because they
   * are one machine — and for a scene whose slot table has not been re-laid
   * yet. Pass `null` to restore the field.
   */
  xray(id: CombatantId | null, alpha = 0.35): void {
    // A figure-less part is drawn on its parent's painting: fading the parent
    // to show the part would erase the very thing the ring marks (D-044).
    const anchored = id ? !!this.actors.get(id)?.anchor : false;
    const cover = id && !anchored ? new Set(this.occluders(id)) : new Set<CombatantId>();
    for (const [otherId, staged] of this.actors) {
      const wanted = cover.has(otherId) ? alpha : 1;
      if (Math.abs(staged.actor.alpha - wanted) > 0.01) void staged.actor.fadeTo(wanted, 140);
    }
  }

  /**
   * Re-lay the enemy lane so no fiend's silhouette crosses another's.
   *
   * Runs after {@link stage}, over whoever actually ended up on the field, and
   * only moves **enemies** — the party's arc is FFX's own and is not ours to
   * restage. A scene's `SceneSlots.enemy` table stays the source of the lane's
   * extent (near/far z, left/right x are read off it), so a location still
   * decides where its fiends may stand; the solver only decides where in that
   * lane each one goes. See `Formation.ts` for the rule and the game-aware
   * case (both games).
   */
  applyFormation(): void {
    const members: FormationMember[] = [];
    for (const [id, staged] of this.actors) {
      // A figure-less part stands on its parent's painting, not in the lane (D-044).
      if (staged.kind !== 'enemy' || staged.anchor || staged.pinned) continue;
      const m: FormationMember = { id, height: staged.actor.height };
      if (staged.isPart) {
        m.isPart = true;
        if (staged.parentId) m.parentId = staged.parentId;
      }
      members.push(m);
    }
    if (members.length < 2) return;

    const lane = laneFrom(this.opts.slots.enemy);
    // A scene may pin the lane's x (Chapter 6: keep the Syndicate off Paine).
    if (this.opts.slots.enemyLaneX) lane.x = [...this.opts.slots.enemyLaneX];
    for (const slot of solveFormation(members, lane)) {
      const staged = this.actors.get(slot.id);
      if (!staged) continue;
      staged.actor.position.set(slot.spot[0], slot.spot[1], slot.spot[2]);
    }
  }

  /**
   * Push the fiends apart until their **projected** silhouettes clear
   * (`StageRelax.ts`). Runs while the field is being staged, **never while a
   * command is live**: moving enemies when the player has already opened a
   * menu was option D's idea, and Bailey did not pick it.
   *
   * Returns true only when the field is **settled**: nothing moved on this
   * call. False means "call me again" — either nothing could be measured yet
   * (no canvas), or the passes ran out before it converged.
   */
  relaxFormation(passes = 14): boolean {
    const rect = this.opts.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (this.actors.size < 2) return true;
    const field = {
      actors: relaxActorsOf(this.actors),
      rects: () => this.screenRects(),
      panels: this.panels,
      camera: this.opts.camera,
      canvasW: rect.width,
      slots: this.opts.slots,
    };
    return relaxField(field, passes);
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

  /**
   * Stage a combatant revealed mid-fight and play its entrance. See
   * `BattleStage.arrive`; the scene's director, when it has one, is in
   * `StageArrivals.ts`.
   */
  async arrive(id: CombatantId, clock: ArrivalClock): Promise<PaintedActor | undefined> {
    const existing = this.actors.get(id)?.actor;
    if (existing) return existing;
    const c = this.lastState?.combatants[id];
    if (!c || c.removed) return undefined;
    const director = this.arrivals[id];
    const heights = { party: this.opts.slots.partyHeight ?? 1.82, enemy: this.opts.slots.enemyHeight ?? 4.1 };
    const actor = await this.add(c, director?.worldHeight?.(heights));
    if (!actor) return undefined;
    actor.setAlpha(0);
    if (!director) {
      await actor.fadeTo(1, clock.instant ? 0 : 520);
      return actor;
    }
    const spots = this.opts.slots.enemy;
    const cleanup = await director.play({
      ...clock,
      id,
      actor,
      other: (other) => this.actors.get(other)?.actor,
      enemySlot: (i) => (spots[i] ? [spots[i]![0], spots[i]![1], spots[i]![2]] : undefined),
      camera: this.opts.battleCamera,
      rect: (other) => this.projectRect(other),
      overlayRoot: this.opts.overlayRoot ?? null,
    });
    // Only if she is still here: a figure KO'd mid-entrance has already left.
    if (cleanup && this.actors.get(id)?.actor === actor) this.arrivalCleanups.set(id, cleanup);
    else cleanup?.();
    return actor;
  }

  removeCombatant(id: CombatantId): void {
    const undo = this.arrivalCleanups.get(id);
    this.arrivalCleanups.delete(id);
    undo?.();
    const staged = this.actors.get(id);
    if (!staged) return;
    this.actors.delete(id);
    this.partRings.remove(id);
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
      // A petrified figure breaks into stone chips, not light (`StoneShards.ts`).
      if (key === 'stone-shatter') return stoneShatter(this.opts.scene, staged.actor.position, staged.actor.height);
      const point = staged.actor.centerPoint(this.scratch.clone());
      // The bloom is sized to the figure it lands on: `HitEffects` is set up for
      // a boss, and unscaled it turned Rikku into a white blob
      // (docs/screenshots/70/52-ffx2-bahamut.png). `colour` is the element's,
      // so a heal reads as a green glow rather than a white hole in the figure.
      const bloom = bloomScale(staged.actor.height) * (crit ? 1.3 : 1);
      this.hits.flash.play(point, crit ? 320 : 260, bloom, colour);
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

  // ------------------------------------------------------- anchored parts

  /** The live parent of an anchored part, as the anchor math reads it. */
  private parentPose(staged: StagedActor): ParentPose | undefined {
    const parent = staged.parentId ? this.actors.get(staged.parentId)?.actor : undefined;
    return parent ? SA.parentPoseOf(parent, this.paintScratch) : undefined;
  }

  /** Put a figure-less part where its anchor says, every frame, so the parent's hop or lunge carries it. */
  private placeAnchored(id: CombatantId): void {
    const staged = this.actors.get(id);
    const parent = staged?.anchor ? this.parentPose(staged) : undefined;
    if (!staged?.anchor || !parent) return;
    staged.actor.position.set(...SA.anchoredSpot(staged.anchor, parent, staged.actor.height));
  }

  private anchoredQuad(staged: StagedActor): [Vector3, Vector3, Vector3, Vector3] {
    const p = staged.actor.position;
    return SA.anchoredQuad(staged.anchor!, this.parentPose(staged) ?? { x: p.x, y: p.y, z: p.z, height: 1 }, this.quad);
  }

  /** The part rings' state, for the debug surface and the tests. */
  partRingSnapshot(): ReturnType<PartRings['snapshot']> {
    return this.partRings.snapshot();
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
    for (const id of this.actors.keys()) this.placeAnchored(id);
    for (const { actor } of this.actors.values()) actor.update(dt);
    this.partRings.update(
      dt,
      (id) => {
        const staged = this.actors.get(id);
        if (!staged) return undefined;
        this.partRings.setAlive(id, this.lastState?.combatants[id]?.alive !== false);
        return this.parentPose(staged);
      },
      this.opts.camera,
    );
    const figures = [...this.actors.values()];
    const pinned = new Set(figures.filter((s) => s.pinned).map((s) => s.actor));
    layProneFigures(
      figures.map((s) => s.actor),
      this.opts.camera,
      this.opts.battleCamera,
      pinned,
    );
    this.hits.update(dt, this.opts.camera);
  }

  setPixelScale(v: number): void {
    this.hits.sparks.setPixelScale(v);
  }

  /** Everything the debug snapshot wants about the field. */
  snapshot(): Array<{
    id: string;
    side: Side;
    art: string;
    pose: string;
    placeholder: boolean;
    /** Body facing: 1 = turned toward +x, -1 = toward -x. */
    facing: 1 | -1;
    /** True when this pose's plane is being drawn flipped. */
    mirrored: boolean;
    life: string;
  }> {
    return [...this.actors.entries()].map(([id, s]) => ({
      id,
      side: s.side,
      art: s.artId,
      pose: s.actor.pose,
      placeholder: s.actor.isPlaceholder,
      facing: s.actor.facingDir,
      mirrored: s.actor.mirrored,
      life: s.actor.lifeState,
    }));
  }

  dispose(): void {
    for (const undo of this.arrivalCleanups.values()) undo();
    this.arrivalCleanups.clear();
    for (const { actor } of this.actors.values()) actor.dispose();
    this.actors.clear();
    this.partRings.dispose();
    this.hits.dispose();
    disposeStoneShards(this.opts.scene);
    this.flashEl?.remove();
    this.flashEl = null;
  }
}

function rank(side: Side): number {
  return side === 'party' ? 0 : side === 'aeon' ? 1 : 2;
}

const BOSS_HEIGHT = 4.1;

/**
 * Impact-bloom scale for a figure of `worldHeight` units.
 *
 * `HitEffects` is built with `size: 3.0`, which is tuned for the 4.1-unit boss
 * slot; a party member is 1.82. The ratio is softened (square root) rather than
 * taken straight, so a small figure still gets a bloom that reads, and it is
 * bounded at both ends so neither a destructible part nor Vegnagun produces an
 * absurd one.
 */
function bloomScale(worldHeight: number): number {
  const ratio = Math.max(0.1, worldHeight) / BOSS_HEIGHT;
  return Math.min(1.15, Math.max(0.34, Math.sqrt(ratio)));
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
