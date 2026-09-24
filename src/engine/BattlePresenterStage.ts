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
import {
  occludersOf,
  visibleFraction,
  visibilityOf,
  worstPanelFor,
  type DepthRect,
  type ScreenRect,
} from './ScreenRects.ts';
import { TargetHighlight } from './TargetHighlight.ts';
import { HoldableCamera } from './TargetFrameHold.ts';
import { departurePoses } from './BattlePresenterDepartures.ts';
import { layProneFigures } from './ProneLay.ts';
import { anchorFor, anchorPoint, PartRings, type ParentPose, type PartAnchor } from './PartAnchors.ts';

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
}

/**
 * How much of a combatant has to be in the clear before the field stops
 * shuffling.
 *
 * A little above the 0.75 the targeting checks assert, so a figure that only
 * just passes today does not fail tomorrow on a frame where the camera has
 * eased a few pixels further in.
 */
const CLEAR_ENOUGH = 0.8;

/**
 * How much of a **targetable enemy** has to be clear of the HUD's own panels.
 *
 * The task's requirement B(1) caps panel coverage at 25%; this is 22%, so the
 * lane settles with a little margin rather than exactly on the line. Measured
 * live before this clause existed, `yu-pagoda-right` sat 36% under the turn
 * list at 1280x720 and 40% at 2000x1000 — the gold bracket, the hand and the
 * name plate all drawn beneath the queue's tiles.
 */
const PANEL_CLEAR = 0.78;

/** How far a destructible part may stray from its machine, in world units. */
const PART_LEASH = 3.2;

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
    const poses = departurePoses(c.id, art.poses); // no ko painting for Evrae's fall (D-031)
    const heights = {
      party: this.opts.slots.partyHeight ?? 1.82,
      enemy: this.opts.slots.enemyHeight ?? 4.1,
    };

    const anchor = anchorFor(this.opts.slots.partAnchors, c.id);
    const actor = await PaintedActor.create({
      name: c.id,
      ...(anchor ? anchoredActorOptions(anchor) : {}),
      // The *body's* facing, from the side — party and aeons turn toward +x,
      // enemies toward -x. Whether the painting is mirrored is a separate
      // question, answered by each pose's sidecar; art painted to the contract
      // (party faces right, enemies face left) is drawn exactly as painted.
      side: c.side === 'enemy' ? 'enemy' : c.side === 'aeon' ? 'aeon' : 'party',
      worldHeight: anchor ? anchoredHeight(anchor) : (worldHeight ?? worldHeightFor(c, heights)),
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
      shadow: anchor ? false : { radius: kind === 'party' ? 0.62 : 1.5, opacity: 0.48 },
      breathe: { amplitude: 0.016, speed: 0.4 },
      sway: { amplitude: 0.009, speed: 0.22 },
      // The turn highlight: gold under a party member, a cooler ring under a
      // fiend, so whose turn it is reads even in a screenshot.
      turnRing: {
        color: kind === 'party' ? 0xf0cf92 : 0xc8a0ff,
        radius: anchor ? anchoredRingRadius(anchor) : kind === 'party' ? 0.78 : 1.7,
        opacity: kind === 'party' ? 0.85 : 0.7,
      },
    });

    const spots = kind === 'party' ? this.opts.slots.party : this.opts.slots.enemy;
    const spot = spots[Math.min(c.slot, spots.length - 1)] ?? spots[0] ?? [0, 0, 0];
    actor.position.set(spot[0], spot[1], spot[2]);
    // Already down when the field is staged: snap to it. `immediate` is what
    // stops a party member who was KO'd before the battle opened from toppling
    // over on frame one.
    if (!c.alive && c.side === 'party') actor.setPose('ko', { immediate: true });

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
    if (staged.anchor && parent) {
      // A figure-less part aims at its anchor: the ring for 'feet', the chest point otherwise.
      const [x, y, z] = anchorPoint(staged.anchor, parent, anchor === 'feet' ? 'ring' : 'chest');
      this.scratch.set(x, y + (anchor === 'head' ? anchoredRingRadius(staged.anchor) : 0), z);
    } else if (anchor === 'chest') staged.actor.centerPoint(this.scratch);
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
      if (staged.kind !== 'enemy' || staged.anchor) continue;
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
   * Push the fiends apart until their **projected** silhouettes clear.
   *
   * {@link applyFormation} lays the lane out in world space, and world space is
   * not what the player sees. Measured live in Chapter 3, the world-space
   * layout put Braska's Final Aeon at x 2.03, z -8 and the two Yu Pagodas at
   * x 1.27 and x 3.33 — a clean spread on the ground, and on screen the aeon's
   * rectangle ran 771..1152 while the Pagodas sat at 838..989 and 1035..1176,
   * both inside it. The aeon is four units tall and three back; the Pagodas are
   * two units tall and three forward. Perspective undoes in the frame what the
   * ground plan got right.
   *
   * So finish the job against the camera. Each pass measures the real screen
   * rectangles, finds the pairs that still overlap horizontally, and pushes
   * both along **world x** by the deficit converted back through that actor's
   * own screen-pixels-per-world-unit — which is what makes a near fiend move a
   * little and a far one move a lot, exactly as it should. It converges in a
   * handful of passes and then stops.
   *
   * Runs while the field is being staged, **never while a command is live**:
   * moving enemies when the player has already opened a menu was option D's
   * idea, and Bailey did not pick it.
   *
   * Returns true only when the field is **settled**: nothing moved on this
   * call. False means "call me again" — either nothing could be measured yet
   * (no canvas), or the passes ran out before it converged. Measured live,
   * Chapter 3 needed one more call than Chapter 1 did, and a caller that
   * stopped after the camera stilled left Auron two thirds behind Tidus.
   */
  relaxFormation(passes = 14): boolean {
    const rect = this.opts.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    if (this.actors.size < 2) return true;

    const lanes = {
      // A pinned lane keeps its left edge nearly shut: that edge is the party side.
      enemy: this.opts.slots.enemyLaneX
        ? { x: [this.opts.slots.enemyLaneX[0] - 0.3, this.opts.slots.enemyLaneX[1] + 2.2] as [number, number] }
        : widen(laneFrom(this.opts.slots.enemy), 2.2),
      party: widen(laneFrom(this.opts.slots.party), 0.9),
    };

    for (let pass = 0; pass < passes; pass++) {
      const rects = this.screenRects();
      // A figure-less part has no silhouette to clear, and it must not be shoved off its anchor.
      for (const [rid, staged] of this.actors) if (staged.anchor) rects.delete(rid);
      if (rects.size < 2) return false;
      // Panels included: the lane has to be clear of the turn list and the
      // command stack, not only of the other fiends.
      const vis = visibilityOf(rects, this.panels);

      let moved = false;
      for (const [id, fraction] of vis) {
        if (fraction >= CLEAR_ENOUGH) continue;
        const mine = rects.get(id);
        if (!mine) continue;
        for (const otherId of occludersOf(id, rects)) {
          const theirs = rects.get(otherId);
          if (!theirs) continue;
          // How far they have to come apart horizontally to stop overlapping,
          // taken a third at a time so the pass converges instead of
          // oscillating between two figures shoving each other.
          const overlap =
            Math.min(mine.x + mine.w, theirs.x + theirs.w) - Math.max(mine.x, theirs.x);
          if (overlap <= 0) continue;
          const step = overlap * 0.34 + 3;
          const dir = mine.x + mine.w / 2 <= theirs.x + theirs.w / 2 ? -1 : 1;
          // A party member and a fiend: only the fiend gives way. The party
          // arc is the scene's own composition (see `applyFormation`), and
          // letting a fiend shove a party member sideways cascades down the
          // arc — measured in Chapter 3 after PR-0002 A (D-041), a Yu Pagoda
          // pushed Yuna into Auron and Auron into Tidus, walking Tidus under
          // the command stack (33% to 52% covered). Two party members, or two
          // fiends, still share the step as before.
          const mineParty = this.actors.get(id)?.kind === 'party';
          const theirsParty = this.actors.get(otherId)?.kind === 'party';
          if (mineParty !== theirsParty) {
            const fiend = mineParty ? otherId : id;
            const away = mineParty ? -dir : dir;
            if (this.nudgeIn(fiend, away * step, lanes, rect.width)) moved = true;
            continue;
          }
          if (this.nudgeIn(id, (dir * step) / 2, lanes, rect.width)) moved = true;
          if (this.nudgeIn(otherId, (-dir * step) / 2, lanes, rect.width)) moved = true;
        }
      }

      // Second clause: the HUD's own panels.
      //
      // This is the half that was written down and never ran. `occludersOf`
      // above only knows about combatants, so a fiend standing squarely under
      // the turn list matched `fraction < CLEAR_ENOUGH`, found no combatant to
      // move away from, and stayed exactly where it was. (And until
      // `solidPanelRects` landed the panel rectangles were two full-viewport
      // transparent wrappers, so *every* fiend was below the threshold and
      // none of it meant anything.)
      //
      // Enemies only, deliberately. The approved frame
      // `docs/concepts/targeting/b-ring-and-dim/s1.png` draws the command list
      // across the party's legs on purpose — measured off the mockup itself,
      // Yuna is ~48% behind it there — so the party arc is the picked look and
      // is not restaged here. Requirement B(1)'s 25% cap is about targetable
      // enemies, and that is what this enforces.
      if (this.panels.length) {
        for (const [id, mine] of rects) {
          if (this.actors.get(id)?.kind !== 'enemy') continue;
          if (visibleFraction(mine, this.panels) >= PANEL_CLEAR) continue;
          const worst = worstPanelFor(mine, this.panels);
          if (!worst) continue;
          const overlap =
            Math.min(mine.x + mine.w, worst.x + worst.w) - Math.max(mine.x, worst.x);
          if (overlap <= 0) continue;
          // Away from the panel, along the axis the lane actually allows.
          const dir = mine.x + mine.w / 2 <= worst.x + worst.w / 2 ? -1 : 1;
          if (this.nudgeIn(id, dir * (overlap * 0.4 + 3), lanes, rect.width)) moved = true;
        }
      }

      if (!moved) return true;
    }
    // Ran out of passes with figures still moving: not settled yet.
    return false;
  }

  /** {@link nudge}, into whichever lane this combatant belongs to. */
  private nudgeIn(
    id: CombatantId,
    dxPx: number,
    lanes: { enemy: { x: [number, number] }; party: { x: [number, number] } },
    canvasW: number,
  ): boolean {
    const staged = this.actors.get(id);
    if (!staged) return false;
    const lane = staged.kind === 'enemy' ? lanes.enemy : lanes.party;
    let lo = lane.x[0];
    let hi = lane.x[1];
    // A part stays on its machine. Vegnagun's leg may shuffle clear of its own
    // tail; it may not walk across the field and stand beside the party.
    const host = staged.parentId ? this.actors.get(staged.parentId) : undefined;
    if (host) {
      lo = Math.max(lo, host.actor.position.x - PART_LEASH);
      hi = Math.min(hi, host.actor.position.x + PART_LEASH);
    }
    return this.nudge(id, dxPx, lo, hi, canvasW);
  }

  /**
   * Move one actor `dxPx` screen pixels along world x, clamped to the lane.
   *
   * The conversion is measured rather than assumed: project the actor's
   * position and the same point one world unit to the right, and the distance
   * between them is this actor's own pixels-per-unit at its own depth.
   */
  private nudge(id: CombatantId, dxPx: number, xLo: number, xHi: number, canvasW: number): boolean {
    const staged = this.actors.get(id);
    if (!staged) return false;
    const here = this.scratch.copy(staged.actor.position).project(this.opts.camera).x;
    const there = new Vector3(
      staged.actor.position.x + 1,
      staged.actor.position.y,
      staged.actor.position.z,
    )
      .project(this.opts.camera).x;
    // NDC spans 2 across the canvas, so `(there - here) / 2 * width` is pixels.
    const pxPerUnit = ((there - here) / 2) * canvasW;
    if (!Number.isFinite(pxPerUnit) || Math.abs(pxPerUnit) < 1) return false;
    const want = staged.actor.position.x + dxPx / pxPerUnit;
    const next = Math.max(xLo, Math.min(xHi, want));
    if (Math.abs(next - staged.actor.position.x) < 0.01) return false;
    staged.actor.position.x = next;
    return true;
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
      const point = staged.actor.centerPoint(this.scratch.clone());
      // The bloom is sized to the figure it lands on. `HitEffects` is
      // configured once, for a boss; played unscaled on a 1.8-unit party
      // member the same quad is wider than she is tall, and with depth
      // testing off it paints straight over her (this is what turned Rikku
      // into a white blob in docs/screenshots/70/52-ffx2-bahamut.png).
      const bloom = bloomScale(staged.actor.height) * (crit ? 1.3 : 1);
      // `colour` used to be computed here and then thrown away for everything
      // except the screen flash, so every bloom was the constructor's icy
      // white regardless of element. Passing it through is what makes a heal
      // read as a green glow rather than as a white hole in the figure.
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
    if (!parent) return undefined;
    return {
      x: parent.position.x,
      y: parent.position.y,
      z: parent.position.z,
      height: parent.height,
      mirrored: parent.mirrored,
      toWorld: (u, t) => {
        const w = parent.paintPoint(u, t, this.paintScratch);
        return [w.x, w.y, w.z];
      },
    };
  }

  /**
   * Put a figure-less part where its anchor says, every frame, so the parent's
   * hop or lunge carries it. An upright ring's actor is centred on the point
   * (its selection halo draws at mid-height); a ground ring's stands on it.
   */
  private placeAnchored(id: CombatantId): void {
    const staged = this.actors.get(id);
    if (!staged?.anchor) return;
    const parent = this.parentPose(staged);
    if (!parent) return;
    const [x, y, z] = anchorPoint(staged.anchor, parent);
    const a = staged.anchor;
    const upright = a.mode === 'onParent' && !a.ring.ground;
    const lift = upright ? y - staged.actor.height * 0.5 - ANCHOR_HOVER : a.mode === 'overhead' ? y : parent.y;
    staged.actor.position.set(x, lift, z);
  }

  /** A box round the anchor; a Bulwark's runs from the foot up to its chest point. */
  private anchoredQuad(staged: StagedActor): [Vector3, Vector3, Vector3, Vector3] {
    const a = staged.anchor!;
    const p = staged.actor.position;
    const parent = this.parentPose(staged) ?? { x: p.x, y: p.y, z: p.z, height: 1 };
    const [x, y, z] = anchorPoint(a, parent, 'ring');
    const r = anchoredRingRadius(a);
    const top = a.mode === 'onParent' && a.chestPx ? anchorPoint(a, parent, 'chest')[1] + r * 0.5 : y + r;
    const bottom = a.mode === 'onParent' && a.ring.ground ? parent.y : y - r;
    this.quad[0].set(x - r, bottom, z);
    this.quad[1].set(x + r, bottom, z);
    this.quad[2].set(x + r, top, z);
    this.quad[3].set(x - r, top, z);
    return this.quad;
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
    layProneFigures([...this.actors.values()].map((s) => s.actor), this.opts.camera, this.opts.battleCamera);
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
    this.flashEl?.remove();
    this.flashEl = null;
  }
}

function rank(side: Side): number {
  return side === 'party' ? 0 : side === 'aeon' ? 1 : 2;
}

/**
 * The lane a scene's own enemy slots describe — its x and z extent, widened a
 * little so the solver may spread past the exact spots the table lists.
 *
 * Reading it off the table rather than hard-coding one keeps each location in
 * charge of where its fiends may stand: Dream's End's plain is wide and the
 * Farplane's is not, and a formation solver that ignored that would walk
 * figures into the backdrop.
 */
/** A lane with `pad` world units of extra room on each side. */
function widen(lane: { x: [number, number]; z: [number, number] }, pad: number): { x: [number, number] } {
  return { x: [lane.x[0] - pad, lane.x[1] + pad] };
}

function laneFrom(spots: readonly [number, number, number][]): {
  x: [number, number];
  z: [number, number];
} {
  if (!spots.length) return { x: [0.4, 5.8], z: [-1.6, -5.4] };
  const xs = spots.map((s) => s[0]);
  const zs = spots.map((s) => s[2]);
  const xLo = Math.min(...xs);
  const xHi = Math.max(...xs);
  const zLo = Math.min(...zs);
  const zHi = Math.max(...zs);
  // A one-slot table gives a degenerate lane; give it room either side rather
  // than piling every fiend on one spot.
  const padX = Math.max(1.4, (xHi - xLo) * 0.22);
  const padZ = Math.max(0.6, (zHi - zLo) * 0.12);
  return { x: [xLo - padX, xHi + padX], z: [zHi + padZ, zLo - padZ] };
}

/** The enemy-slot height `HitEffects`' bloom size was chosen against. */
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

/** The hover that turns an upright ring's selection accent into a halo (`PaintedActor.levitates`). */
const ANCHOR_HOVER = 0.06;

/** The ring radius a figure-less part is marked with. */
function anchoredRingRadius(a: PartAnchor): number {
  return a.mode === 'onParent' ? a.ring.radius : 0.9;
}

/** A figure-less actor is sized to its ring, so its accent and turn ring match it. */
function anchoredHeight(a: PartAnchor): number {
  return anchoredRingRadius(a) * 2;
}

/** The options that make a part figure-less; an upright ring hovers so its accent is a halo. */
function anchoredActorOptions(a: PartAnchor): {
  figure: false;
  castShadow: false;
  hover?: { height: number; bobAmplitude: number };
} {
  const upright = a.mode === 'onParent' && !a.ring.ground;
  return { figure: false, castShadow: false, ...(upright ? { hover: { height: ANCHOR_HOVER, bobAmplitude: 0 } } : {}) };
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
