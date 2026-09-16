import './damage-numbers.css';
import {
  bouncePosition,
  classifyDamageEvent,
  computeHitOffset,
  fontSizeFor,
  jitterX,
  lifetimeMsFor,
  opacityAt,
  scaleAt,
  textFor,
  type DamageEventInput,
  type DamageKind,
} from './damageLadder.ts';

/**
 * Floating DOM damage/heal/miss numerals, per `research/visual-bible.md` §3.6.
 *
 * Positions come from an injected `project(targetId)` callback rather than
 * this class knowing anything about the 3D scene — it hands back screen-space
 * pixels (relative to the same container `DamageNumbers` is mounted in), which
 * keeps this module free of Three.js so the presenter/camera agent owns the
 * actual world-to-screen math.
 */
export interface DamageNumbersOptions {
  root: HTMLElement;
  /** Screen-space pixel position of `targetId` this frame, or `null` if off-screen/unknown (the numeral hides until it resolves again). */
  project: (targetId: string) => { x: number; y: number } | null;
}

export interface DamageSpawnInput extends DamageEventInput {
  /** Combatant id the numeral tracks — resolved every frame via `project`. */
  target: string;
  /** 0-based index into this action's hit list, for the multi-hit ladder. */
  hitIndex?: number;
  /** Total hits in this action. Carried through for callers/tests; the ladder math only needs `hitIndex`. */
  hitCount?: number;
}

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
}

export class DamageNumbers {
  readonly el: HTMLElement;
  private active: ActiveNumber[] = [];
  private mounted = false;

  constructor(private readonly opts: DamageNumbersOptions) {
    this.el = document.createElement('div');
    this.el.className = 'dnum-layer';
    this.el.dataset['role'] = 'damage-numbers';
  }

  mount(): void {
    if (this.mounted) return;
    this.opts.root.appendChild(this.el);
    this.mounted = true;
  }

  unmount(): void {
    if (!this.mounted) return;
    this.el.remove();
    this.mounted = false;
    this.clear();
  }

  /** Remove every in-flight numeral immediately (screen teardown, chapter transition). */
  clear(): void {
    for (const n of this.active) n.el.remove();
    this.active = [];
  }

  get count(): number {
    return this.active.length;
  }

  /** Spawn one numeral. For a multi-hit action, call once per hit with the same `target` and an incrementing `hitIndex`. */
  spawn(input: DamageSpawnInput): void {
    const kind = classifyDamageEvent(input);
    const ladder = computeHitOffset(input.hitIndex ?? 0);

    const el = document.createElement('div');
    el.className = `dnum dnum--${kind}`;
    el.style.fontSize = `${fontSizeFor(kind)}px`;
    el.style.opacity = '0';
    el.textContent = textFor(kind, input.amount);
    this.el.appendChild(el);

    this.active.push({
      el,
      target: input.target,
      kind,
      ageMs: 0,
      lifetimeMs: lifetimeMsFor(kind),
      delayMs: ladder.delayMs,
      offsetX: ladder.dx + jitterX(),
      offsetY: ladder.dy,
      vx: jitterX() * 3,
    });
  }

  /** Advance every numeral's motion/fade and drop the ones whose lifetime has ended. */
  update(dt: number): void {
    const dtMs = dt * 1000;
    const survivors: ActiveNumber[] = [];

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

      const base = this.opts.project(n.target);
      if (!base) {
        n.el.style.opacity = '0';
        survivors.push(n);
        continue;
      }

      const bounce = bouncePosition(tMs, n.kind, n.vx);
      const x = base.x + n.offsetX + bounce.x;
      const y = base.y + n.offsetY + bounce.y;
      const scale = scaleAt(tMs, n.kind);
      n.el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      n.el.style.opacity = opacityAt(tMs, n.kind).toFixed(3);
      survivors.push(n);
    }

    this.active = survivors;
  }
}
