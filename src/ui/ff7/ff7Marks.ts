/**
 * Marks drawn over the scene (FF7 only): damage numerals and the yellow ready
 * triangle over the fighter whose command window is open
 * (`docs/plans/ff7-hud-faithful-a-spec.md` §3.5, §3.6, §5.8, §5.10).
 *
 * Numerals are white with a near-black edge, green for recovery, "Miss" for a
 * whiff [spec §5.10; verified: S1 + 3 stills]. Their motion is our estimate
 * until the in-game check: pop in with a small drop and bounce (250 ms), hold,
 * gone at 1 s. Several hits on one target step up and to the right. Time runs
 * only through {@link Ff7Marks.update}.
 */

import type { CombatantId } from '../../battle/common/types.ts';
import { damageSvg, triangleSvg } from './ff7Art.ts';
import { px, text } from './ff7Draw.ts';
import type { Ff7Geometry } from './ff7Geometry.ts';
import { TEXT, TRIANGLE } from './ff7Tokens.ts';

/** Seconds a numeral stays up [our estimate]. */
export const NUMERAL_SECONDS = 1.0;
/** Seconds of the pop, drop and bounce [our estimate]. */
const BOUNCE_SECONDS = 0.25;

interface Numeral {
  id: number;
  target: CombatantId;
  value: string;
  heal: boolean;
  hitIndex: number;
  age: number;
}

export type Projector = (id: CombatantId, anchor?: 'head' | 'chest' | 'feet') => { x: number; y: number } | null;

export class Ff7Marks {
  private numerals: Numeral[] = [];
  private seq = 0;
  private ready: CombatantId | null = null;

  constructor(private readonly layer: HTMLElement, private readonly geometry: () => Ff7Geometry, private readonly project: () => Projector | null) {}

  /** A damage (positive) or recovery (`heal`) numeral, or "Miss" (`value` = 'Miss'). */
  add(target: CombatantId, value: string, heal: boolean, hitIndex = 0): void {
    this.numerals.push({ id: ++this.seq, target, value, heal, hitIndex, age: 0 });
    this.render();
  }

  /** The fighter the ready triangle hangs over, or null. */
  setReady(id: CombatantId | null): void {
    if (this.ready === id) return;
    this.ready = id;
    this.render();
  }

  get readyId(): CombatantId | null {
    return this.ready;
  }

  get count(): number {
    return this.numerals.length;
  }

  update(dt: number): void {
    if (!this.numerals.length) return;
    for (const n of this.numerals) n.age += dt;
    const before = this.numerals.length;
    this.numerals = this.numerals.filter((n) => n.age < NUMERAL_SECONDS);
    if (this.numerals.length !== before || this.numerals.some((n) => n.age - dt < BOUNCE_SECONDS)) this.render();
  }

  clear(): void {
    this.numerals = [];
    this.ready = null;
    this.render();
  }

  render(): void {
    const g = this.geometry();
    const project = this.project();
    let h = '';
    if (this.ready && project) {
      const p = project(this.ready, 'head');
      if (p) {
        const t = g.tri;
        h += `<div class="ff7-tri-wrap" data-ready="${this.ready}" style="left:${px(p.x - t.w / 2)};top:${px(p.y - t.h - 2 * g.s)};width:${px(t.w)};height:${px(t.h)}">${triangleSvg(t.w, t.h, TRIANGLE)}</div>`;
      }
    }
    // FF7 draws numbers over the figure in the scene, never over the windows: the anchor stays at
    // least one numeral height above the band (and a phone's command window) [spec §3.6; the review's item 2].
    const ceiling = Math.min(g.bandL.y, g.bandR.y, g.mode === 'phone' ? g.cmd.r.y : Infinity) - 1.5 * g.dmgCap;
    for (const n of this.numerals) {
      const p = project?.(n.target, 'chest');
      if (!p) continue;
      h += this.numeralHtml(g, n, { x: p.x, y: Math.min(p.y, ceiling) });
    }
    this.layer.innerHTML = h;
  }

  private numeralHtml(g: Ff7Geometry, n: Numeral, p: { x: number; y: number }): string {
    // Drop from 1.5 u above, overshoot 1 u, settle: our estimate of the motion.
    const t = Math.min(1, n.age / BOUNCE_SECONDS);
    const lift = t < 0.6 ? (1 - t / 0.6) * -1.5 : Math.sin(((t - 0.6) / 0.4) * Math.PI) * 1.0;
    const dx = n.hitIndex * 6 * g.s;
    const dy = lift * g.s - n.hitIndex * 6 * g.s;
    const fill = n.heal ? TEXT.heal : '#FFFFFF';
    if (!/^\d+$/.test(n.value)) {
      return `<div class="ff7-dmg" data-dmg="${n.id}" style="left:0;top:0">` +
        text({ x: 0, y: 0 }, p.x + dx, p.y + dy, g.dmgCap * 0.8, n.value, { color: fill, outline: g.s, align: 'c' }) + '</div>';
    }
    const d = damageSvg(n.value, g.dmgCap, g.s, fill);
    return `<div class="ff7-dmg" data-dmg="${n.id}" data-value="${n.value}" style="left:${px(p.x + dx - d.width / 2)};top:${px(p.y + dy - d.height / 2)}">${d.svg}</div>`;
  }
}
