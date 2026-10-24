/**
 * THE AUDIO PASS, THE MIXER'S HALF (conference demo sound pass, 2026-10-22; decision 184). Web Audio, but only the small pieces `AudioManager` hands over: it finds the slices, this plays the layers
 * under a base cue, finds a slice's first audible sample, and schedules the dip of the music. Nothing here runs unless a {@link PassPlan} arrives with a cue, and the presenter only sends one
 * while the pass is on (`passSwitch.ts`), so with the pass off none of it is reached.
 */

import type { SpriteSlice } from '../SfxSprites.ts';
import { startSfxSource } from '../sfxSource.ts';
import { DIP_ATTACK_MS, dipTimes } from './passPlanner.ts';
import { MAX_BASE_SKIP_MS, type DipPlan, type SfxLayer } from './passTypes.ts';

/** Where a layer goes and how it finds its slice: the mixer's dry bus and hall send, and its sprites (the v2 sprite and the first bank; never a parity original). */
export interface LayerHost {
  ctx: AudioContext;
  dry: AudioNode;
  send: AudioNode | null;
  slice(key: string): SpriteSlice | null;
}

/** What one layer did, for the mixer's play log. */
export interface LayerPlay {
  key: string;
  role: string;
  volume: number;
  /** Seconds after the base's start the layer begins. */
  atS: number;
}

const onsets = new WeakMap<AudioBuffer, Map<number, number>>();

/**
 * The ms from the start of a slice to its first audible sample (-30 dB re its peak), scanned from the decoded buffer and remembered. This is what the recorded dagger hit's 168 ms of near-silence
 * looks like to the mixer: asked for at the contact, it is heard 168 ms later unless the pass starts it at this point.
 */
export function sliceOnsetMs(slice: SpriteSlice): number {
  let per = onsets.get(slice.buffer);
  if (!per) onsets.set(slice.buffer, (per = new Map()));
  const hit = per.get(slice.cue.offset);
  if (hit !== undefined) return hit;
  const rate = slice.buffer.sampleRate;
  const a = Math.floor(slice.cue.offset * rate);
  const b = Math.min(slice.buffer.length, a + Math.floor(slice.cue.duration * rate));
  const chans: Float32Array[] = [];
  for (let c = 0; c < slice.buffer.numberOfChannels; c++) chans.push(slice.buffer.getChannelData(c));
  let peak = 0;
  for (const ch of chans) for (let i = a; i < b; i++) peak = Math.max(peak, Math.abs(ch[i] ?? 0));
  const thr = peak * 10 ** (-30 / 20);
  let ms = 0;
  scan: for (let i = a; i < b; i++) {
    for (const ch of chans) {
      if (Math.abs(ch[i] ?? 0) >= thr) {
        ms = ((i - a) / rate) * 1000;
        break scan;
      }
    }
  }
  per.set(slice.cue.offset, ms);
  return ms;
}

/** The ms to cut from the start of a base cue so that its first audible sample lands where it was asked for (1 ms of the lead-in is kept: a cue never starts on its first non-zero sample). */
export function baseSkipFor(slice: SpriteSlice): number {
  return Math.min(MAX_BASE_SKIP_MS, Math.max(0, sliceOnsetMs(slice) - 1));
}

/**
 * Start the layers of a plan under a base cue. `baseLevel` is the base's own linear level (the call's volume times its trim), `baseAudibleS` the seconds from the ask to the base's first
 * audible sample (its onset less what was skipped), `delayS` the base's own delay (a phase-2 lead or a spell's landing wait). A layer whose slice has not decoded is skipped: a layer is never
 * waited for and never replaced by a synth. Never throws.
 */
export function playLayers(host: LayerHost, layers: readonly SfxLayer[], baseLevel: number, baseAudibleS: number, delayS: number): LayerPlay[] {
  const played: LayerPlay[] = [];
  for (const layer of layers) {
    try {
      const slice = host.slice(layer.key);
      if (!slice) continue;
      const level = baseLevel * layer.gain;
      const atS = baseAudibleS + Math.max(0, layer.lagMs) / 1000;
      startSfxSource(host.ctx, { dry: host.dry, send: host.send }, slice.buffer, slice, level, { pitch: layer.pitch, trimMs: layer.trimMs, fadeMs: layer.fadeMs, skipMs: layer.skipMs, pan: layer.pan }, delayS + atS, false);
      played.push({ key: layer.key, role: layer.role, volume: level, atS: delayS + atS });
    } catch {
      /* a layer that cannot play is silence, never an error */
    }
  }
  return played;
}

/**
 * Dip the music for a blow `aheadMs` away: down over {@link DIP_ATTACK_MS} starting `lead` before the blow, held to `hold` after it, back over `release`. On the dip bus only (not the duck bus, so a
 * voice line's or the pause menu's duck is untouched), scheduled on the audio clock. A dip begun while another is running replaces it from the level it has reached.
 */
export function scheduleDip(ctx: AudioContext, gain: AudioParam, aheadMs: number, plan: DipPlan): void {
  const t = dipTimes(aheadMs, plan);
  const now = ctx.currentTime;
  const floor = 10 ** (plan.depthDb / 20);
  const downAt = now + t.downAt / 1000;
  const downDone = downAt + DIP_ATTACK_MS / 1000;
  const holdEnd = Math.max(downDone, now + t.holdUntil / 1000);
  const backAt = holdEnd + plan.releaseMs / 1000;
  gain.cancelScheduledValues(now);
  const current = gain.value;
  gain.setValueAtTime(current, now);
  gain.setValueAtTime(current, downAt);
  gain.linearRampToValueAtTime(floor, downDone);
  gain.setValueAtTime(floor, holdEnd);
  gain.linearRampToValueAtTime(1, backAt);
}
