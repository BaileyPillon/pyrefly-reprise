import './damage-numbers.css';
import {
  bouncePosition,
  classifyDamageEvent,
  computeHitOffset,
  deflectFromRects,
  fontSizeFor,
  jitterX,
  ladderPitch,
  lifetimeMsFor,
  opacityAt,
  scaleAt,
  textFor,
  type DamageEventInput,
  type DamageKind,
  type NumeralRect,
} from './damageLadder.ts';

/**
 * Floating DOM damage/heal/miss numerals, per `research/visual-bible.md` §3.6.
 *
 * **This is the one implementation** (`docs/CONTRACT-CHANGES.md` decision 12:
 * the HUD mounted for a battle owns its numerals, and FFX-2 reuses this rather
 * than writing a third copy). `src/ui/ffx/DamageNumbers.ts` is a thin FFX
 * adapter over it; an FFX-2 HUD mounts it the same way:
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
 * if (el) el.appendChild(chainChip);          // FFX-2's CHAIN xN rides the hit
 * ```
 *
 * Positions come from the injected `project(targetId, anchor)` callback rather
 * than this class knowing anything about the 3D scene — it hands back
 * **viewport (client) pixels**, which keeps this module free of Three.js so
 * the presenter/camera agent owns the world-to-screen math. Every numeral
 * re-projects its target *every frame*, so a numeral stays pinned to the
 * actor that was struck even while the battle camera is moving.
 *
 * Numerals stack per *target*, not per action: whatever lands on one actor in
 * the same beat climbs the ladder a rung at a time (see {@link spawn}), so an
 * FFX-2 chain does not need to track its own hit counter to stay legible — it
 * can spawn each link with `hitIndex` 0 and still get a ladder.
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
   * read every frame. A numeral that projects into one slides out to the
   * nearest free edge (see {@link deflectFromRects}).
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
 * How many rungs the ladder climbs before it wraps back to the target's chest.
 * Five rungs is about 170px at 1600x900 — a Wakka reel or a long chain would
 * otherwise walk numerals off the top of the screen (and then pile up against
 * the clamp). By the time rung 5 spawns, rung 0 is well into its fade.
 */
const LADDER_RUNGS = 5;

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
}

export class DamageNumbers {
  readonly el: HTMLElement;
  private active: ActiveNumber[] = [];
  private mounted = false;

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
   * Numerals stack per target: the rung a numeral takes is the deeper of its
   * own `hitIndex` and the number of numerals already riding that target, so a
   * multi-hit action ladders by its hit list while unrelated events that land
   * on one actor in the same beat (a MISS chasing a hit, an AoE plus a counter)
   * still step clear of each other instead of printing through.
   */
  spawn(input: DamageSpawnInput): HTMLElement | null {
    const kind = classifyDamageEvent(input);
    const hitIndex = Math.max(0, Math.floor(input.hitIndex ?? 0));
    const rung = Math.max(hitIndex, this.liveOn(input.target)) % LADDER_RUNGS;
    const ladder = computeHitOffset(rung);
    // Delay is the hit's own place in its action's list — an event that simply
    // arrived later is already late and must not be held back again.
    const delayMs = computeHitOffset(hitIndex).delayMs;
    const scale = this.scale();

    const el = document.createElement('div');
    el.className = `dnum dnum--${kind}`;
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
      delayMs,
      offsetX: ladder.dx + jitterX(),
      offsetY: ladder.dy - ladderPitch(kind) * rung,
      vx: jitterX() * 3,
      halfW: Math.max(8, el.offsetWidth / 2),
      measured: el.offsetWidth > 0,
    });
    return el;
  }

  /** Advance every numeral's motion/fade and drop the ones whose lifetime has ended. */
  update(dt: number): void {
    const dtMs = dt * 1000;
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
    const anchor = this.opts.anchor ?? 'chest';

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

      const base = this.opts.project(n.target, anchor);
      if (!base) {
        n.el.style.opacity = '0';
        survivors.push(n);
        continue;
      }

      if (!n.measured && n.el.offsetWidth > 0) {
        // Width at spawn can read 0 (the layer is not laid out yet, or the
        // numeral font has not loaded), which would let a wide figure hang off
        // the edge of the layer. Re-measure once, on the first frame it draws.
        n.halfW = Math.max(8, n.el.offsetWidth / 2);
        n.measured = true;
      }

      const bounce = bouncePosition(tMs, n.kind, n.vx);
      const raw = {
        x: base.x - layer.left + (n.offsetX + bounce.x) * scale,
        y: base.y - layer.top + (n.offsetY + bounce.y) * scale,
      };
      // The spawn pop is a transform about the glyph's own centre, so the
      // dodging/clamping has to use the popped extent or a numeral that lands
      // near an edge or a panel overhangs it for the first 0.12s.
      const pop = scaleAt(tMs, n.kind);
      const half = { w: n.halfW * pop, h: (fontSizeFor(n.kind) * scale * pop) / 2 };
      const at = deflectFromRects(raw, half, panels, bounds, 6 * scale);
      n.el.style.transform = `translate(-50%, -50%) translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px) scale(${pop.toFixed(3)})`;
      n.el.style.opacity = opacityAt(tMs, n.kind).toFixed(3);
      survivors.push(n);
    }

    this.active = survivors;
  }

  /** How many numerals are already riding `target` — the rung a new one starts from. */
  private liveOn(target: string): number {
    let n = 0;
    for (const a of this.active) if (a.target === target) n++;
    return n;
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
