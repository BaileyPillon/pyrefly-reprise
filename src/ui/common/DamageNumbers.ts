import './damage-numbers.css';
import {
  bouncePosition,
  BURST_GAP_MS,
  burstSlot,
  classifyDamageEvent,
  deflectFromRects,
  familyFor,
  fanSequence,
  FAN_COLUMNS,
  FAN_STEP,
  fontSizeFor,
  LADDER_RUNGS,
  jitterX,
  lifetimeMsFor,
  nextBurstSlot,
  opacityAt,
  placeInSafeArea,
  resolveLanes,
  safeAreaFrom,
  scaleAt,
  textFor,
  type BurstState,
  type BurstTrack,
  type DamageEventInput,
  type DamageKind,
  type LaneInput,
  type NumeralRect,
} from './damageLadder.ts';

/**
 * Floating DOM damage/heal/miss numerals, per `research/visual-bible.md` §3.6.
 *
 * **This is the one implementation** (`docs/CONTRACT-CHANGES.md` decision 12:
 * the HUD mounted for a battle owns its numerals, and FFX-2 reuses this rather
 * than writing a third copy). `src/ui/ffx/DamageNumbers.ts` is a thin FFX
 * adapter over it; `src/ui/ffx2/DamageLayer.ts` is the FFX-2 one:
 *
 * ```ts
 * const numbers = new DamageNumbers({
 *   root: this.overlay,                       // any positioned container
 *   project: (id, anchor) => stageProject(id, anchor),
 *   scale: () => this.stageScale,             // HUD grid -> viewport px
 *   avoid: () => this.panelRects(),           // opaque HUD slabs to dodge
 * });
 * numbers.mount();
 * // once per frame, from the screen's update loop:
 * numbers.update(dt);
 * // per battle event:
 * const el = numbers.spawnEvent(event);
 * numbers.attachChip(event.targetId, chainChip);  // FFX-2's CHAIN xN rides the hit
 * ```
 *
 * Positions come from the injected `project(targetId, anchor)` callback rather
 * than this class knowing anything about the 3D scene — it hands back
 * **viewport (client) pixels**, which keeps this module free of Three.js so
 * the presenter/camera agent owns the world-to-screen math. Every numeral
 * re-projects its target *every frame*, so a numeral stays pinned to the
 * actor that was struck even while the battle camera is moving.
 *
 * ## Round 2: why one action no longer prints one blob
 *
 * `docs/handoff/playability-round-1.md` issue 2 caught a multi-hit piling
 * roughly eight figures on one screen point (`53-ffx2-vegnagun.png`) and an
 * AoE burying `2200` under `1850` (`50-yunalesca.png`). Four things now keep
 * them apart, and all four are pure math in `damageLadder.ts`:
 *
 * | Problem | Mechanism |
 * |---|---|
 * | hits resolved in one engine tick all appeared at once | per-target **queue**: each release is held to at least 80ms after the previous one on that target (`nextBurstSlot`) |
 * | the ladder wrapped after 5 rungs onto figures still on screen | the ladder climbs 4 rungs, then **fans** into a new column beside it (`burstSlot`) |
 * | two actors standing close projected to nearly the same x | per-target **lanes**, swept apart once per frame and re-centred (`resolveLanes`) |
 * | figures clamped to a HUD edge landed on the same coordinate | a **safe rect** (bounds minus the edge-anchored HUD bands) that a numeral is *mirrored* into before it is clamped (`safeAreaFrom` / `placeInSafeArea`) |
 *
 * Only a numeral whose target is itself buried under the chrome gets
 * `.dnum--over-hud`, which lifts it over its neighbours and adds a scrim so it
 * reads against HUD ink.
 */

/** Which point on the struck actor a numeral hangs off. Numerals want the chest. */
export type NumeralAnchor = 'head' | 'chest' | 'feet';

export interface DamageNumbersOptions {
  /**
   * Container to mount into. Optional: leave it out and place `el` yourself
   * (the FFX HUD appends it into its own unscaled overlay layer).
   */
  root?: HTMLElement;
  /** Viewport-pixel position of `targetId` this frame, or `null` if off-screen/unknown (the numeral hides until it resolves again). */
  project: (targetId: string, anchor?: NumeralAnchor) => { x: number; y: number } | null;
  /** Point on the actor to hang numerals off. Default `'chest'`. */
  anchor?: NumeralAnchor;
  /**
   * Multiplier from the HUD's authoring grid to real viewport pixels, read
   * every frame. §3.6's sizes are quoted on the 640x360 grid, so at 1600x900
   * a plain hit is `16 * 2.5 = 40px`. Default `1`.
   */
  scale?: () => number;
  /**
   * Opaque HUD panels a numeral must not end up inside, in viewport pixels,
   * read every frame. The ones anchored to a screen edge (the FFX CTB column,
   * the party-status windows, the FFX-2 boss strip) define the HUD-free safe
   * rect numerals live in; anything floating in the middle of the field is
   * dodged the old way (see {@link deflectFromRects}).
   */
  avoid?: () => readonly NumeralRect[];
  /** Extra class names for the layer element, e.g. the FFX HUD's own hook. */
  className?: string;
  /** Hard cap on simultaneous numerals, oldest dropped first. Default 48. */
  max?: number;
}

export interface DamageSpawnInput extends DamageEventInput {
  /** Combatant id the numeral tracks — resolved every frame via `project`. */
  target: string;
  /** 0-based index into this action's hit list, for the multi-hit ladder. */
  hitIndex?: number;
  /** Total hits in this action. Carried through for callers/tests; the ladder math only needs `hitIndex`. */
  hitCount?: number;
}

/** The subset of `BattleEvent` {@link DamageNumbers.spawnEvent} reads. */
export interface NumeralEventLike {
  type: string;
  targetId?: string;
  amount?: number;
  affinity?: string;
  crit?: boolean;
  hitIndex?: number;
  hitCount?: number;
  reason?: string;
}

/**
 * How far outside the safe rect (in *logical* px, scaled at use) a target may
 * stand before its numerals stop being pulled back inside and are drawn over
 * the HUD instead. Four ladder rungs: a party member whose chest sits a little
 * below the status windows still reads with the figure just above them; an
 * enemy wholly behind the CTB column does not.
 */
const SAFE_SLACK = 64;

interface ActiveNumber {
  el: HTMLElement;
  target: string;
  kind: DamageKind;
  ageMs: number;
  lifetimeMs: number;
  delayMs: number;
  /** Slot this numeral took in its target's queue, and which fan track it rides. */
  slotIndex: number;
  track: BurstTrack;
  /**
   * Fan column offset, logical px. Resolved on the first frame the target
   * projects — the fan's shape depends on the room the actor has either side —
   * and then frozen, so a figure never jumps columns mid-flight.
   */
  offsetX: number | null;
  /** Fan column this figure occupies — a column is retired as a unit when it wraps. */
  column: number;
  offsetY: number;
  vx: number;
  halfW: number;
  /** `halfW` measured once the glyph had real layout (fonts, font-size applied). */
  measured: boolean;
  /** Last value written to `.dnum--over-hud`, so the class is only touched on a change. */
  overHud: boolean;
}

export class DamageNumbers {
  readonly el: HTMLElement;
  private active: ActiveNumber[] = [];
  private mounted = false;
  /** Per-target queue state: which slot is next and when it may be released. */
  private readonly bursts = new Map<string, BurstState>();
  /**
   * The fan columns each target may open, frozen for the life of its burst.
   *
   * Which columns exist depends on the room the actor has either side of it
   * inside the safe rect, which is only known once the target has projected —
   * so this is filled in by {@link update}, not by {@link spawn}, and then held
   * still. Recomputing it per frame would let a numeral jump a whole
   * `FAN_STEP` sideways when a panning camera crossed a slot boundary.
   */
  private readonly fans = new Map<string, readonly number[]>();
  /** Elements following a numeral — FFX-2's `CHAIN xN` chip. See {@link attachChip}. */
  private readonly chips = new Map<HTMLElement, ActiveNumber>();
  /**
   * The placement context from the last {@link update}, kept so a chip can be
   * held to the same HUD-free area as the numerals it rides. Layer-local, plus
   * the layer's viewport origin to convert through. Null until the layer has
   * been laid out (jsdom, or before the first frame).
   */
  private chipArea: {
    origin: { left: number; top: number };
    safe: NumeralRect | null;
    floating: readonly NumeralRect[];
  } | null = null;
  /** Layer clock, advanced by {@link update}; the queue is paced against it. */
  private nowMs = 0;

  constructor(private readonly opts: DamageNumbersOptions) {
    this.el = document.createElement('div');
    this.el.className = opts.className ? `dnum-layer ${opts.className}` : 'dnum-layer';
    this.el.dataset['role'] = 'damage-numbers';
  }

  mount(root?: HTMLElement): void {
    const host = root ?? this.opts.root;
    if (this.mounted || !host) return;
    host.appendChild(this.el);
    this.mounted = true;
  }

  unmount(): void {
    this.clear();
    if (!this.mounted) return;
    this.el.remove();
    this.mounted = false;
  }

  /** Remove every in-flight numeral immediately (screen teardown, chapter transition). */
  clear(): void {
    for (const n of this.active) n.el.remove();
    this.active = [];
    this.bursts.clear();
    this.fans.clear();
    this.chips.clear();
  }

  get count(): number {
    return this.active.length;
  }

  /**
   * Spawn a numeral straight from a `BattleEvent`.
   *
   * Handles `damage` (including negative amounts, which are healing, and the
   * `immune` / `absorb` affinities), `heal`, `miss`, `mp-damage` and
   * `mp-heal`; returns the element so a HUD can hang its own chip off it, or
   * `null` for every other event type.
   */
  spawnEvent(event: NumeralEventLike): HTMLElement | null {
    const target = event.targetId;
    if (!target) return null;
    switch (event.type) {
      case 'damage':
        return this.spawn({
          target,
          amount: event.amount ?? 0,
          affinity: event.affinity,
          crit: event.crit === true,
          hitIndex: event.hitIndex ?? 0,
          hitCount: event.hitCount ?? 1,
        });
      case 'heal':
        return this.spawn({ target, amount: -Math.abs(event.amount ?? 0) });
      case 'mp-damage':
        return this.spawn({ target, amount: Math.abs(event.amount ?? 0), isMp: true });
      case 'mp-heal':
        return this.spawn({ target, amount: -Math.abs(event.amount ?? 0), isMp: true });
      case 'miss':
        return this.spawn({ target, hit: false });
      default:
        return null;
    }
  }

  /**
   * Spawn one numeral. For a multi-hit action, call once per hit with the same
   * `target` and an incrementing `hitIndex`.
   *
   * The slot a numeral takes is the deeper of its own `hitIndex` and the
   * target's running queue position, so a chain that spawns every link with
   * `hitIndex` 0 still ladders, and unrelated events landing on one actor in
   * the same beat (a MISS chasing a hit, an AoE plus a counter) still step
   * clear of each other. The queue also decides *when* the numeral appears:
   * hits that resolved in one engine tick are released 80ms apart, which is
   * the quick succession FFX shows a multi-hit in, while a presenter that
   * already paces its hits gets no extra delay at all.
   */
  spawn(input: DamageSpawnInput): HTMLElement | null {
    const kind = classifyDamageEvent(input);
    const prev = this.bursts.get(input.target);
    // A new burst re-shapes the fan: the actor may have moved (or the HUD may
    // have opened) since the last one, and the frozen sequence is only meant to
    // hold a single action's figures still.
    if (prev && this.nowMs - prev.lastSpawnMs > BURST_GAP_MS) this.fans.delete(input.target);
    const slot = nextBurstSlot(prev, this.nowMs, input.hitIndex ?? 0, {
      family: familyFor(kind),
    });
    this.bursts.set(input.target, slot.state);
    // The rung is settled here. The column's *offset* may not be: which way
    // this actor can fan needs a projection, so until the first frame has
    // placed this target the offset stays null and `update` fills it in.
    const fan = this.fans.get(input.target);
    const place = burstSlot(slot.index, kind, { ...(fan ? { fan } : {}), track: slot.track });
    const scale = this.scale();

    // The ladder wraps after `LADDER_RUNGS * columns` cells, and a long reel
    // *reaches* that wrap with the first column still on screen: the release cap
    // puts hits 10 onward at the 720ms ceiling against a 900ms life. Worse, a
    // figure that old has fallen back down its arc to near the chest, which is
    // exactly where the wrapped hit starts — a 16-hit Trigger Happy printed hit
    // 15 within 11px of hit 1.
    //
    // So a fan column is reused **as a unit**: the column about to be taken is
    // cleared of whatever is still in it first. Numerals ageing out as new ones
    // arrive is what FFX does with a long reel; stacking two on one cell is not.
    if (slot.index >= LADDER_RUNGS * (fan?.length ?? FAN_COLUMNS)) {
      for (let i = this.active.length - 1; i >= 0; i--) {
        const a = this.active[i]!;
        if (a.target !== input.target || a.column !== place.column) continue;
        a.el.remove();
        this.active.splice(i, 1);
      }
    }

    const el = document.createElement('div');
    el.className = `dnum dnum--${kind}`;
    // Who this figure belongs to and which slot of that target's burst it took.
    // Two numerals that look like they are printing through each other are
    // almost always either one target's queue restarting or two targets sharing
    // a lane, and these two attributes say which without a debugger.
    el.dataset['target'] = input.target;
    el.dataset['slot'] = String(slot.index);
    el.style.fontSize = `${(fontSizeFor(kind) * scale).toFixed(1)}px`;
    el.style.opacity = '0';
    el.textContent = textFor(kind, input.amount);
    this.el.appendChild(el);

    const max = this.opts.max ?? 48;
    while (this.active.length >= max) this.active.shift()?.el.remove();

    this.active.push({
      el,
      target: input.target,
      kind,
      ageMs: 0,
      lifetimeMs: lifetimeMsFor(kind),
      delayMs: slot.delayMs,
      slotIndex: slot.index,
      track: slot.track,
      // The fan and the lanes own horizontal separation now, so the old
      // +/-6px jitter is gone from the offset — it only survives as the
      // ballistic drift, where it reads as life rather than as noise.
      offsetX: fan ? place.dx : null,
      column: place.column,
      offsetY: place.dy,
      vx: jitterX() * 3,
      halfW: Math.max(8, el.offsetWidth / 2),
      measured: el.offsetWidth > 0,
      overHud: false,
    });
    return el;
  }

  /**
   * Make an extra element follow the newest live numeral for `target`, so it
   * travels with that figure for the rest of its flight.
   *
   * This is how FFX-2's `CHAIN xN` tag stops being a separate popup parked at
   * a fixed offset from the enemy while the damage figure it belongs to floats
   * away from it. {@link update} re-writes the chip's `left`/`top` every frame
   * from the numeral's live box, and clears the pairing when that numeral dies.
   *
   * The chip stays **where its owner put it in the DOM**. Parenting it into the
   * numeral is the obvious implementation and it is wrong: `.dnum` paints its
   * figure with `-webkit-background-clip: text`, which clips the element's
   * entire subtree to the glyph's shape, so a chip pinned past the numeral's
   * edge was clipped away to nothing while every DOM assertion about it passed.
   * Following from outside also leaves the chip's own stylesheet — which is the
   * FFX-2 HUD's, not this task's — applying exactly as its author wrote it.
   *
   * Returns `false` (and leaves the element exactly where it was) when the
   * target has no live numeral — a chain tick that arrives without a hit, or
   * after the figure has already faded, still shows as a free-floating chip.
   */
  attachChip(target: string, chip: HTMLElement): boolean {
    let newest: ActiveNumber | null = null;
    let visible: ActiveNumber | null = null;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const n = this.active[i]!;
      if (n.target !== target) continue;
      newest ??= n;
      // Prefer a figure the player can actually see: the newest numeral on a
      // target is very often one the queue is still holding back by a stagger,
      // and a chip parked on an invisible figure reads as a chip that jumped.
      if (Number(n.el.style.opacity) > 0) {
        visible = n;
        break;
      }
    }
    const n = visible ?? newest;
    if (!n) return false;
    chip.classList.add('dnum__chip');
    this.chips.set(chip, n);
    // Place it now rather than waiting for the next frame, so a chip that
    // appears between two updates does not flash at its old coordinates.
    this.placeChip(chip, n);
    return true;
  }

  /**
   * The fan column offset for a slot, or `null` while this target's fan shape
   * is still unknown (it needs a projection — see {@link fans}).
   */
  private resolveColumn(n: ActiveNumber): void {
    if (n.offsetX !== null) return;
    const fan = this.fans.get(n.target);
    if (!fan) return;
    const place = burstSlot(n.slotIndex, n.kind, { fan, track: n.track });
    n.offsetX = place.dx;
    n.column = place.column;
  }

  /** Put `chip` on `n`'s current box, in the chip's own offset parent's space. */
  private placeChip(chip: HTMLElement, n: ActiveNumber): void {
    const box = n.el.getBoundingClientRect();
    if (box.width === 0 && box.height === 0) return;
    // The chip is not inside the numeral, and not necessarily inside the layer
    // either, so go through viewport coordinates rather than assuming a shared
    // origin.
    const host = (chip.offsetParent as HTMLElement | null) ?? chip.parentElement;
    const origin = host ? host.getBoundingClientRect() : { left: 0, top: 0 };
    // `.ffx2-chain-chip` centres itself on its own `left`/`top` with a
    // `translate(-50%, -50%)`. The first version aimed at the ridden figure's
    // *top*-right corner — which is exactly where the ladder puts the next rung,
    // because a multi-hit climbs up and drifts right (§2.2). In
    // `r2-ffx2-chain-chip.png` as first captured, `CHAIN x1.30` is half hidden
    // behind the `674` sitting a rung above the `600` it was riding.
    //
    // "Below the ridden figure" is *not* the fix, and the unit test for this
    // caught it: `attachChip` pairs with the newest **visible** figure, and
    // during a stagger that is often a low rung with later hits still to appear
    // above it — but also with earlier, lower rungs still live below it. There
    // is no guaranteed-empty cell adjacent to one figure.
    //
    // So the two coordinates are taken from different places, which is what
    // makes this both clear and still "riding":
    //
    //   x  from the ridden figure, so the chip drifts with its own column;
    //   y  from the bottom of the **whole burst** on that target, so it sits
    //      under every live rung and can collide with none of them.
    //
    // The group rises together as the numerals climb, so the chip rises with
    // the hit it belongs to rather than being parked at a fixed offset from the
    // enemy — which was the point of §2.7 — while never landing on a numeral.
    let bottom = box.bottom;
    for (const other of this.active) {
      if (other.target !== n.target) continue;
      const b = other.el.getBoundingClientRect();
      if (b.width === 0 && b.height === 0) continue;
      if (b.bottom > bottom) bottom = b.bottom;
    }
    // A chip that has not been laid out yet measures 0 and simply lands on the
    // corner; the next frame corrects it once it has a box.
    const chipBox = chip.getBoundingClientRect();
    let cx = box.right + chipBox.width / 2;
    let cy = bottom + chipBox.height / 2;

    // Then the same HUD-free treatment the numerals get. Without it the fix
    // above just trades one collision for another: pushing the chip clear of
    // the burst moved it right and down, and in `r2-ffx2-chain-chip.png` as
    // recaptured it landed across the FFX-2 command stack's `WHITE MAGIC` row.
    // The chip is a numeral-sized thing sitting on the field and has to dodge
    // the same chrome. Clamping (not mirroring): a chip belongs beside its
    // burst, and flipping it to the far side of the enemy would read as a
    // different enemy's chain.
    const area = this.chipArea;
    if (area && chipBox.width > 0 && chipBox.height > 0) {
      const half = { w: chipBox.width / 2, h: chipBox.height / 2 };
      const local = { x: cx - area.origin.left, y: cy - area.origin.top };
      // `deflectFromRects` clamps to `bounds` itself, so handing it the safe
      // rect does both jobs in the right order — a push out of a floating panel
      // cannot land outside the safe area, and a clamp cannot push it back into
      // a panel.
      const room = area.safe;
      const fits = !room || (room.right - room.left > half.w * 2 && room.bottom - room.top > half.h * 2);
      const placed = deflectFromRects(local, half, area.floating, fits ? room : null);
      cx = placed.x + area.origin.left;
      cy = placed.y + area.origin.top;
    }

    chip.style.left = `${(cx - origin.left).toFixed(1)}px`;
    chip.style.top = `${(cy - origin.top).toFixed(1)}px`;
    // Only the position is written. The chip's own fade and hold timer are its
    // owner's (`FFX2BattleHud.showChain`), and a chip is meant to outlive the
    // single figure it happens to be sitting on.
  }

  /** Move every registered chip onto its numeral, dropping pairings that have died. */
  private updateChips(): void {
    if (this.chips.size === 0) return;
    for (const [chip, n] of this.chips) {
      if (!n.el.isConnected || !chip.isConnected) {
        // The figure faded (or the HUD took its chip away): stop writing to it
        // and leave it wherever it was, which is what the HUD's own hide timer
        // expects to be removing.
        this.chips.delete(chip);
        continue;
      }
      this.placeChip(chip, n);
    }
  }

  /** Advance every numeral's motion/fade and drop the ones whose lifetime has ended. */
  update(dt: number): void {
    const dtMs = dt * 1000;
    this.nowMs += dtMs;
    const survivors: ActiveNumber[] = [];
    // One layout read per frame, shared by every numeral: the layer's own box
    // turns the projector's viewport pixels into layer-local ones (they are
    // only the same while the layer happens to sit at 0,0) and doubles as the
    // bounds a deflected numeral has to stay inside.
    const layer = this.el.getBoundingClientRect();
    // jsdom (and a layer that has not been laid out yet) reports a 0x0 box;
    // clamping into that would stack every numeral on the origin, so skip the
    // bounds entirely until the layer has real pixels.
    const bounds: NumeralRect | null =
      layer.width > 0 && layer.height > 0
        ? { left: 0, top: 0, right: layer.width, bottom: layer.height }
        : null;
    const panels = this.panels(layer);
    const scale = this.scale();
    const anchorPoint = this.opts.anchor ?? 'chest';

    // The HUD-free rectangle, and whatever panels float *inside* it (the
    // command stack over the field, a sensor card) which still need dodging.
    const safe = bounds ? safeAreaFrom(bounds, panels) : null;
    const floating = safe ? panels.filter((p) => overlapsRect(p, safe)) : panels;
    // A chip is a numeral-sized thing sitting on the field, so it dodges the
    // same chrome. Cached rather than recomputed per chip: `placeChip` runs
    // inside this frame's placement pass and must not re-read layout.
    this.chipArea = bounds ? { origin: { left: layer.left, top: layer.top }, safe, floating } : null;

    // Project each distinct target once, then hand the anchors to the lane
    // solver so two actors who project to nearly the same x get their own
    // column of figures instead of interleaving.
    const points = new Map<string, { x: number; y: number } | null>();
    /** Widest glyph riding each target, layer px — the pad the fan has to fit. */
    const widest = new Map<string, number>();
    const laneInputs = new Map<string, LaneInput>();
    // How much room each target's whole burst needs around its anchor. The
    // placement below pulls the anchor in by this rather than clamping each
    // figure, which is what keeps a fan a fan when its actor stands under the
    // chrome.
    const groups = new Map<string, { w: number; h: number }>();
    for (const n of this.active) {
      // Width is re-read here and nowhere else: this pass writes no styles, so
      // the layout flushed by the `getBoundingClientRect` above still holds and
      // every read is free. (Measuring inside the placement loop below, which
      // writes a transform per numeral, would invalidate layout on every
      // iteration and thrash.) Re-reading every frame rather than once also
      // catches the numeral font finishing its load after the glyph spawned,
      // which used to leave a wide figure with a stale half-width overhanging
      // the edge it was clamped to.
      if (n.el.offsetWidth > 0) {
        n.halfW = Math.max(8, n.el.offsetWidth / 2);
        n.measured = true;
      }
      if (!points.has(n.target)) {
        const p = this.opts.project(n.target, anchorPoint);
        points.set(n.target, p ? { x: p.x - layer.left, y: p.y - layer.top } : null);
      }
      widest.set(n.target, Math.max(widest.get(n.target) ?? 0, n.halfW));
    }

    // With the anchors known, settle each target's fan *shape* — which columns
    // it may open, and on which side. An actor near a margin opens only into
    // the room it has, rather than opening symmetrically and having the far
    // columns reflected back onto the near ones by `placeInSafeArea`, which is
    // bunching dressed up as fanning. Frozen for the burst, so nothing jumps.
    for (const [target, p] of points) {
      if (!p || this.fans.has(target)) continue;
      const pad = widest.get(target) ?? 0;
      this.fans.set(
        target,
        fanSequence(
          safe
            ? { left: (p.x - pad - safe.left) / scale, right: (safe.right - pad - p.x) / scale }
            : null,
        ),
      );
    }

    for (const n of this.active) {
      // Now that this target has a fan, give the figure its column — once, and
      // *before* the delay gate below. A numeral crosses from held-back to
      // visible inside the placement loop further down, which has already run
      // past this pass; resolving the column only for figures that are visible
      // *now* left each hit drawing its first frame at column 0, on top of the
      // hit before it.
      this.resolveColumn(n);
      const p = points.get(n.target);
      if (!p || n.ageMs < n.delayMs) continue;
      const offsetX = n.offsetX ?? 0;
      // What this target asks the lane solver for is the glyph plus **at most
      // one fan step**, not the fan's full reach. A target three columns deep
      // reaches ~2 steps either side, and demanding all of it as exclusive room
      // is not satisfiable: seven such targets want 3,900px of a 1,600px frame,
      // and the greedy sweep answers an impossible demand by posting anchors a
      // thousand pixels off the edge. Neighbouring fans may reach over each
      // other — their figures are on different rungs and on different clocks,
      // which is what keeps them apart — but no two *anchors* may coincide.
      const want = n.halfW + Math.min(Math.abs(offsetX), FAN_STEP) * scale;
      const seen = laneInputs.get(n.target);
      if (!seen) laneInputs.set(n.target, { id: n.target, x: p.x, halfWidth: want });
      else seen.halfWidth = Math.max(seen.halfWidth, want);
      const tall = (fontSizeFor(n.kind) * scale) / 2 + Math.abs(n.offsetY) * scale;
      const box = groups.get(n.target);
      if (!box) groups.set(n.target, { w: want, h: tall });
      else {
        box.w = Math.max(box.w, want);
        box.h = Math.max(box.h, tall);
      }
    }
    // The lanes get the safe rect's width to fit inside and a cap of one fan
    // step on how far any one of them may travel. `FAN_STEP` < `SAFE_SLACK`,
    // so a lane push can never on its own carry an anchor far enough out of
    // the safe rect for `placeInSafeArea` to call it buried under the HUD.
    const lanes = resolveLanes([...laneInputs.values()], 10 * scale, {
      ...(safe ? { bounds: { left: safe.left, right: safe.right } } : {}),
      maxShift: FAN_STEP * scale,
    });

    for (const n of this.active) {
      n.ageMs += dtMs;
      const tMs = n.ageMs - n.delayMs;

      if (tMs < 0) {
        n.el.style.opacity = '0';
        survivors.push(n);
        continue;
      }
      if (tMs >= n.lifetimeMs) {
        n.el.remove();
        continue;
      }

      const base = points.get(n.target) ?? null;
      if (!base) {
        n.el.style.opacity = '0';
        survivors.push(n);
        continue;
      }

      const bounce = bouncePosition(tMs, n.kind, n.vx);
      // The spawn pop is a transform about the glyph's own centre, so the
      // dodging/clamping has to use the popped extent or a numeral that lands
      // near an edge or a panel overhangs it for the first 0.12s.
      const pop = scaleAt(tMs, n.kind);
      const half = { w: n.halfW * pop, h: (fontSizeFor(n.kind) * scale * pop) / 2 };
      const anchor = { x: base.x + (lanes.get(n.target) ?? 0), y: base.y };
      const offset = { x: ((n.offsetX ?? 0) + bounce.x) * scale, y: (n.offsetY + bounce.y) * scale };

      const placed = placeInSafeArea(
        anchor,
        offset,
        half,
        safe,
        SAFE_SLACK * scale,
        groups.get(n.target),
      );
      let at = { x: placed.x, y: placed.y };
      if (placed.overHud) {
        // The target is under the chrome: keep the figure on its actor and on
        // screen, and let the class below lift it clear of the HUD instead.
        at = deflectFromRects(at, half, [], bounds, 0);
      } else if (floating.length > 0) {
        at = deflectFromRects(at, half, floating, safe ?? bounds, 6 * scale);
      }

      if (placed.overHud !== n.overHud) {
        n.el.classList.toggle('dnum--over-hud', placed.overHud);
        n.overHud = placed.overHud;
      }
      n.el.style.transform = `translate(-50%, -50%) translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px) scale(${pop.toFixed(3)})`;
      n.el.style.opacity = opacityAt(tMs, n.kind).toFixed(3);
      survivors.push(n);
    }

    this.active = survivors;
    // After the placement pass, so a chip reads this frame's box rather than
    // trailing the figure it belongs to by one frame.
    this.updateChips();
    this.pruneBursts();
  }

  /** How many numerals are already riding `target`. */
  private liveOn(target: string): number {
    let n = 0;
    for (const a of this.active) if (a.target === target) n++;
    return n;
  }

  /** Forget queue state for targets that have been quiet and have nothing on screen. */
  private pruneBursts(): void {
    for (const [target, state] of this.bursts) {
      if (this.nowMs - state.lastSpawnMs > 2000 && this.liveOn(target) === 0) {
        this.bursts.delete(target);
        this.fans.delete(target);
      }
    }
    // A fan can outlive its queue (the layer was cleared of numerals without a
    // spawn following), and a stale one would shape the next burst around where
    // the actor used to stand.
    for (const target of this.fans.keys()) {
      if (!this.bursts.has(target) && this.liveOn(target) === 0) this.fans.delete(target);
    }
  }

  private scale(): number {
    const s = this.opts.scale?.() ?? 1;
    return Number.isFinite(s) && s > 0 ? s : 1;
  }

  /** The avoid rects, translated from viewport pixels into layer-local ones. */
  private panels(layer: DOMRect): NumeralRect[] {
    const raw = this.opts.avoid?.() ?? [];
    const out: NumeralRect[] = [];
    for (const r of raw) {
      if (r.right <= r.left || r.bottom <= r.top) continue;
      out.push({
        left: r.left - layer.left,
        top: r.top - layer.top,
        right: r.right - layer.left,
        bottom: r.bottom - layer.top,
      });
    }
    return out;
  }
}

/** True when two rects share any area at all. */
function overlapsRect(a: NumeralRect, b: NumeralRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
