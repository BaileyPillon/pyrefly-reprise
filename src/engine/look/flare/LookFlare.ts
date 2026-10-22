/**
 * MEGA FLARE LANDS HARDER, the per-frame half (release 62, decision 173b; FFX-2 only; `FlareConfig.ts` says what it is). It listens for the spell layer's landing taps (`fx/spellTaps.ts`): a `megaflare` tap
 * (the special FFX-2's Bahamut draws; the tap names its target's rectangle and the milliseconds until the blast lands) starts a flare there, and each frame the strongest live flare writes the flood's and the
 * white-out's numbers into the bold pass's uniforms (`LookBoldShader`: `uFlood`, `uFloodCol`, `uWhite`). The group effect taps once per target a moment apart: taps landing within 1.6 seconds of one
 * flare are the same blast and move its centre to the mean of its targets (the party's middle, where the beam lands).
 *
 * It runs only while the bold look is on (`LookRig` installs and removes it with the look), so CLASSIC and `?look=off` get none of it, and with no flare alive the uniforms hold zero and the shader's block is
 * skipped (the frame is what it was). The clock is the rig's wall clock, not the look's own: a flare must end even where the look's clock is stopped (REDUCE MOTION).
 */
import { landListeners, type SpellLandTap } from '../../fx/spellTaps.ts';
import { flareLength, flareSpec, floodAt, whiteAt } from './FlareConfig.ts';

interface Flare {
  /** The wall-clock second the blast lands. */
  start: number;
  u: number;
  v: number;
  n: number;
}

/** Taps this close together (seconds) are one blast: the group effect taps once per girl and the girls' blows land up to about a second apart, one white-out for the lot (the first recording of this took three, half a second apart: a strobe). */
const SAME_BLAST_S = 1.6;
const MAX_FLARES = 4;

/** The uniforms this writes (the bold pass's). */
export interface FlareUniforms {
  uFlood: { value: { set(x: number, y: number, z: number, w: number): unknown } };
  uFloodCol: { value: { set(x: number, y: number, z: number): unknown } };
  uWhite: { value: number };
}

export class LookFlare {
  private flares: Flare[] = [];
  private now = 0;
  private on = false;
  private readonly listener = (tap: SpellLandTap): void => this.land(tap);
  /** For the debug API and the captures. */
  readonly stats = { flares: 0, flood: 0, white: 0, u: 0, v: 0 };

  install(): void {
    if (this.on) return;
    this.on = true;
    landListeners.add(this.listener);
  }

  remove(): void {
    this.on = false;
    landListeners.delete(this.listener);
    this.flares = [];
  }

  private land(tap: SpellLandTap): void {
    if (tap.fx !== 'megaflare' || tap.game !== 'ffx2') return; // FFX-2 only: the special is FFX-2's (the tap says which game drew it)
    const r = tap.rect;
    if (!r || tap.view.w <= 0 || tap.view.h <= 0) return;
    const u = (r.x + r.w / 2) / tap.view.w;
    const v = 1 - (r.y + r.h * 0.45) / tap.view.h;
    const start = this.now + Math.max(0, tap.ms) / 1000;
    const same = this.flares.find((f) => Math.abs(f.start - start) < SAME_BLAST_S);
    if (same) {
      same.u = (same.u * same.n + u) / (same.n + 1);
      same.v = (same.v * same.n + v) / (same.n + 1);
      same.n += 1;
      return;
    }
    this.flares.push({ start, u, v, n: 1 });
    if (this.flares.length > MAX_FLARES) this.flares.shift();
  }

  /** One frame: `now` is the rig's wall clock in seconds, `reduceFlashes` the setting. Writes the uniforms (zeros when nothing is alive). */
  update(now: number, reduceFlashes: boolean, u: FlareUniforms, gain = 1, floodGain = 1, whiteGain = 1): void {
    this.now = now;
    const spec = flareSpec(reduceFlashes);
    const life = flareLength(spec);
    this.flares = this.flares.filter((f) => now - f.start < life);
    let flood = 0;
    let white = 0;
    let at: Flare | null = null;
    for (const f of this.flares) {
      const t = now - f.start;
      const k = floodAt(t, spec.flood);
      if (k > flood) [flood, at] = [k, f];
      white = Math.max(white, whiteAt(t, spec.white));
    }
    flood *= gain * floodGain;
    white *= gain * whiteGain;
    u.uFlood.value.set(at?.u ?? 0.5, at?.v ?? 0.3, flood, spec.flood.reach);
    u.uFloodCol.value.set(spec.flood.color[0], spec.flood.color[1], spec.flood.color[2]);
    u.uWhite.value = white;
    this.stats.flares = this.flares.length;
    this.stats.flood = Math.round(flood * 1000) / 1000;
    this.stats.white = Math.round(white * 1000) / 1000;
    this.stats.u = at ? Math.round(at.u * 1000) / 1000 : 0;
    this.stats.v = at ? Math.round(at.v * 1000) / 1000 : 0;
  }

  /** The look is off: nothing alive, the uniforms at zero. */
  off(u?: FlareUniforms): void {
    this.remove();
    if (u) {
      u.uFlood.value.set(0.5, 0.3, 0, 1);
      u.uWhite.value = 0;
    }
    this.stats.flares = 0;
    this.stats.flood = 0;
    this.stats.white = 0;
  }
}
