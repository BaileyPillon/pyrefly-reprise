import './damage-numbers.css';
import {
  bouncePosition,
  burstSlot,
  classifyDamageEvent,
  deflectFromRects,
  fontSizeFor,
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
  offsetX: number;
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
    const slot = nextBurstSlot(this.bursts.get(input.target), this.nowMs, input.hitIndex ?? 0);
    this.bursts.set(input.target, slot.state);
    const place = burstSlot(slot.index, kind);
    const scale = this.scale();

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
      // The fan and the lanes own horizontal separation now, so the old
      // +/-6px jitter is gone from the offset — it only survives as the
      // ballistic drift, where it reads as life rather than as noise.
      offsetX: place.dx,
      offsetY: place.dy,
      vx: jitterX() * 3,
      halfW: Math.max(8, el.offsetWidth / 2),
      measured: el.offsetWidth > 0,
      overHud: false,
    });
    return el;
  }

  /**
   * Hang an extra element off the newest live numeral for `target`, so it
   * rides that figure for the rest of its flight.
   *
   * This is how FFX-2's `CHAIN xN` tag stops being a separate popup parked at
   * a fixed offset from the enemy while the damage figure it belongs to floats
   * away from it. The chip becomes a child of the numeral, pinned to its
   * top-right corner, and inherits its motion, its pop and its fade.
   *
   * Returns `false` (and leaves the element exactly where it was) when the
   * target has no live numeral — a chain tick that arrives without a hit, or
   * after the figure has already faded, still shows as a free-floating chip.
   */
  attachChip(target: string, chip: HTMLElement): boolean {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const n = this.active[i]!;
      if (n.target !== target) continue;
      chip.classList.add('dnum__chip');
      // Cleared every call, not just on the first: the FFX-2 HUD re-positions
      // the same chip element on every chain tick, and a stale `left`/`top`
      // would drag it back out of the numeral's corner.
      chip.style.left = '';
      chip.style.top = '';
      // Re-appending a node restarts its CSS animation, so only move it if it
      // is not already riding this numeral.
      if (chip.parentElement !== n.el) n.el.appendChild(chip);
      return true;
    }
    return false;
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

    // Project each distinct target once, then hand the anchors to the lane
    // solver so two actors who project to nearly the same x get their own
    // column of figures instead of interleaving.
    const points = new Map<string, { x: number; y: number } | null>();
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
      const p = points.get(n.target);
      if (!p || n.ageMs < n.delayMs) continue;
      const want = n.halfW + Math.abs(n.offsetX) * scale;
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
    const lanes = resolveLanes([...laneInputs.values()], 10 * scale);

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
      const offset = { x: (n.offsetX + bounce.x) * scale, y: (n.offsetY + bounce.y) * scale };

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
      }
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
