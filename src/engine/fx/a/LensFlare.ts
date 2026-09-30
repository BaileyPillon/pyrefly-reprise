/**
 * Option A8, a lens flare when a big spell lands, drawn in the renderer's overlay (no bloom, no
 * tilt) and so under the DOM HUD, with the spell atlas's own `glow`, `spark4` and `disc` tiles.
 *
 * Game case (rule 14):
 * - **FFX**: an anamorphic horizontal gold streak (`#FFD98A`) with a white core, across most
 *   of the frame, and three ghost discs mirrored through the frame centre; a 600 ms envelope,
 *   peak 0.8 (CTB calm).
 * - **FFX-2**: a four-point `spark4` star with three pink ghosts (`#F7B6D9`); 450 ms, peak 0.85
 *   (the ATB pace).
 * The `flare` dial scales the peak and the size.
 * Big spells: the `-aga` tier, Holy, Flare, Spiral Cut, Mega Flare, Aerospark.
 * REDUCE FLASHES: peak 0.35 and no ghosts. Phone tier: no ghosts. Off under Reduce motion and
 * Low effects (the controller never starts one).
 */

import type { WebGLRenderer } from 'three';
import { FxBatch } from '../../spellfx/FxBatch.ts';
import { FxDrawList, type FxItem, type FxTile } from '../../spellfx/FxDrawList.ts';
import { DEFAULT_FLASH_PARAMS } from '../../spellfx/SpellFxParams.ts';
import type { SpellLandTap } from '../spellTaps.ts';
import { hex3 } from './sceneLooks.ts';

interface Flare {
  x: number;
  y: number;
  /** Seconds until the peak (counts down), then seconds since it. */
  t: number;
  game: 'ffx' | 'ffx2';
  peak: number;
  ghosts: boolean;
  /** The `flare` dial: size multiplier. */
  scale: number;
}

const BIG = /(aga$|holy|flare|spiral|aerospark|ultima)/i;

/** Is this landing a big spell (the flare's trigger)? */
export function isBigSpell(tap: Pick<SpellLandTap, 'fx' | 'abilityId'>): boolean {
  if (tap.fx === 'spiral' || tap.fx === 'megaflare') return true;
  return !!tap.abilityId && BIG.test(tap.abilityId);
}

const GOLD = hex3('#ffd98a');
const PINK = hex3('#f7b6d9');
const WHITE: [number, number, number] = [1, 0.98, 0.94];

export class LensFlare {
  private readonly flares: Flare[] = [];
  private readonly batch = new FxBatch();
  private view = { w: 1600, h: 900 };
  /** Actions already flared (one flare per action on multi-target spells). */
  private lastKey = '';
  private lastAt = -1;

  /** A landing: start a flare timed to the blow, if it is a big spell. */
  land(tap: SpellLandTap, opts: { reduceFlashes: boolean; ghosts: boolean; now: number; scale?: number }): void {
    if (!isBigSpell(tap) || !tap.rect || tap.game === 'ff7') return;
    const key = `${tap.fx}:${tap.abilityId ?? ''}`;
    if (key === this.lastKey && opts.now - this.lastAt < 1.2) return;
    this.lastKey = key;
    this.lastAt = opts.now;
    this.view = tap.view;
    const game = tap.game;
    const scale = Math.max(0, opts.scale ?? 1);
    const base = Math.min(1.2, (game === 'ffx' ? 0.8 : 0.85) * scale);
    this.flares.push({
      x: tap.rect.x + tap.rect.w / 2,
      y: tap.rect.y + tap.rect.h * 0.42,
      t: -Math.max(0, tap.ms) / 1000,
      game,
      peak: opts.reduceFlashes ? 0.35 : base,
      ghosts: opts.ghosts && !opts.reduceFlashes,
      scale: Math.min(1.6, Math.max(0.3, scale)),
    });
  }

  /** @param dt seconds (0 while frozen) */
  update(dt: number): void {
    for (const f of this.flares) f.t += dt;
    for (let i = this.flares.length - 1; i >= 0; i--) {
      const f = this.flares[i]!;
      if (f.t > (f.game === 'ffx' ? 0.6 : 0.45) + 0.1) this.flares.splice(i, 1);
    }
  }

  get active(): boolean {
    return this.flares.length > 0;
  }

  private envelope(f: Flare): number {
    if (f.t < -0.06) return 0;
    if (f.t < 0) return (f.t + 0.06) / 0.06;
    const dur = f.game === 'ffx' ? 0.6 : 0.45;
    return Math.max(0, Math.exp((-3.2 * f.t) / dur) - 0.04 * (f.t / dur));
  }

  render(renderer: WebGLRenderer): void {
    if (!this.flares.length) return;
    const list = new FxDrawList('ffx', 1, DEFAULT_FLASH_PARAMS);
    const { w: W, h: H } = this.view;
    const k0 = Math.max(0.45, Math.min(1.5, Math.min(W / 1600, H / 900)));
    const item = (tile: FxTile, x: number, y: number, w: number, h: number, col: readonly [number, number, number], a: number, rot = 0): FxItem => ({
      layer: 1,
      shape: 0,
      tile,
      x,
      y,
      w,
      h,
      rot,
      col,
      a,
      p: [0, 0, 0, 0],
    });
    for (const f of this.flares) {
      const e = this.envelope(f) * f.peak;
      const k = k0 * f.scale;
      if (e <= 0.003) continue;
      const cx = W / 2;
      const cy = H / 2;
      if (f.game === 'ffx') {
        list.items.push(item('glow', f.x, f.y, 2600 * k * (0.8 + 0.2 * e), 44 * k, GOLD, e * 0.9));
        list.items.push(item('glow', f.x, f.y, 1300 * k, 10 * k, WHITE, e));
        list.items.push(item('glow', f.x, f.y, 190 * k, 190 * k, GOLD, e * 0.32));
      } else {
        const s = 480 * k * (0.75 + 0.25 * e);
        list.items.push(item('spark4', f.x, f.y, s, s, PINK, e));
        list.items.push(item('spark4', f.x, f.y, s * 0.55, s * 0.55, WHITE, e * 0.9, Math.PI / 4));
        list.items.push(item('glow', f.x, f.y, 180 * k, 180 * k, PINK, e * 0.32));
      }
      if (f.ghosts) {
        const tint = f.game === 'ffx' ? GOLD : PINK;
        const ghost: Array<[number, number, number]> = [
          [0.45, 90, 0.26],
          [0.85, 160, 0.16],
          [1.35, 60, 0.3],
        ];
        for (const [s, size, a] of ghost) {
          const gx = cx + (cx - f.x) * s;
          const gy = cy + (cy - f.y) * s;
          list.items.push(item('disc', gx, gy, size * k, size * k, tint, e * a, f.game === 'ffx2' ? Math.PI / 6 : 0));
        }
      }
    }
    if (!list.items.length) return;
    this.batch.set(list, W, H);
    this.batch.render(renderer);
  }

  clear(): void {
    this.flares.length = 0;
  }

  dispose(): void {
    this.batch.dispose();
  }
}
