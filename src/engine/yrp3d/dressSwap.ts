/**
 * **The change of dressphere, as the skin plays it** (the hidden 3D Bahamut chapter, FFX-2 only; `./skin.ts`, `./dress.ts`). When the presenter swaps a girl's painting for the new dressphere's (`BattleStage.setArt`, from the
 * engine's `spherechange` event) the skin swaps her model for the new dressphere's. The swap is hidden behind a short white light of her own, the way the game's change is one:
 *
 * 1. **up** ({@link SWAP.up} s): her whole figure lights toward white (a smooth ramp), while the new model is fetched, parsed and cloned (the library has usually warmed it already: `./dressLib.ts`);
 * 2. **the swap**, on the first frame at the peak with the new model in hand: the old model goes and the new one stands where it stood, in the same light;
 * 3. **down** ({@link SWAP.down} s): the light falls off the new model.
 *
 * If the model is not in hand at the peak the light **holds** until it is, for at most {@link SWAP.wait} s; a model that never comes (its files are missing or did not parse) cancels the swap: the light falls and she keeps the
 * model she has. Pure timing: numbers in, numbers out, no `three`, no DOM. `./skin.ts` owns what the numbers do to a model.
 */

import type { Girl } from './dress.ts';
import type { YrpModel } from './model.ts';

/** The seconds each part takes: the light up, the light down, and the longest the peak waits for a model that is not in hand. */
export const SWAP = { up: 0.14, down: 0.3, wait: 2.5 } as const;

/**
 * What the light does to a figure at full (`./skin.ts`): `peak` is the share of full emissive it adds (a rim accent, as every glow in this chapter: `./rim.ts`), `bleach` how many times over it brightens her albedo (so the whole
 * figure goes toward white and the swap is hidden, not only her edge), and `soft` the share of both that REDUCE FLASHES leaves. This is the transformation's own light, not the capped accent a hit's flash is.
 */
export const LIGHT = { peak: 0.85, bleach: 3.5, soft: 0.3 } as const;

/** What a model source gives the skin: a fresh model of a girl in a dressphere, and the word that she wears one now. `./dressLib.ts`'s `DressLibrary` is the one the chapter uses. */
export interface DressPort {
  /** A fresh model of `girl` in `dress`, or null when there is none (the manifest has no such folder, or its files are missing or did not parse). The caller owns it. */
  model(girl: Girl, dress: string): Promise<YrpModel | null>;
  /** `girl` wears `dress` now: its neighbours on her Garment Grid are the ones a swap may ask for next. */
  wearing(girl: Girl, dress: string): void;
}

const smooth = (t: number): number => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** One swap's clock. `start`, then `ready(true)` when the new model is in hand (`false`: it will never come); `update(dt)` each frame. */
export class DressSwap {
  private phase: 'idle' | 'up' | 'hold' | 'down' = 'idle';
  private t = 0;
  private have: boolean | null = null;
  private swapped = false;

  /** True from `start` until the light has fallen. */
  get active(): boolean {
    return this.phase !== 'idle';
  }

  /** True once the swap has happened (so the light is on the new model). */
  get done(): boolean {
    return this.swapped;
  }

  start(): void {
    this.phase = 'up';
    this.t = 0;
    this.have = null;
    this.swapped = false;
  }

  /** The new model is in hand (`true`) or will never come (`false`). */
  ready(ok: boolean): void {
    if (this.phase !== 'idle') this.have = ok;
  }

  /** Advance by `dt` seconds: the light now, 0..1, and whether this is the frame to swap the models (once per swap). */
  update(dt: number): { light: number; swap: boolean } {
    if (this.phase === 'idle') return { light: 0, swap: false };
    this.t += Math.max(0, dt);
    if (this.phase === 'up') {
      if (this.t < SWAP.up) return { light: smooth(this.t / SWAP.up), swap: false };
      this.phase = 'hold';
      this.t = 0;
    }
    if (this.phase === 'hold') {
      if (this.have === true) {
        this.phase = 'down';
        this.t = 0;
        this.swapped = true;
        return { light: 1, swap: true };
      }
      if (this.have === false || this.t >= SWAP.wait) {
        this.phase = 'down'; // cancelled: the light falls off the model she has
        this.t = 0;
      } else return { light: 1, swap: false };
    }
    if (this.t >= SWAP.down) {
      this.phase = 'idle';
      return { light: 0, swap: false };
    }
    return { light: 1 - smooth(this.t / SWAP.down), swap: false };
  }
}
