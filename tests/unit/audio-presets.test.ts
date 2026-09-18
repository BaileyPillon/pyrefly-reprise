import { describe, expect, it } from 'vitest';

import { makeStereo, crossfadeLoopSeam } from '../../src/audio/dsp/buffer.ts';
import { Hall, renderHallImpulse } from '../../src/audio/dsp/hall.ts';
import {
  PRESETS,
  PRESET_GROUPS,
  getPreset,
  groupOf,
  hasPreset,
  presetCaveats,
  presetKeyMismatches,
  seatOf,
  sendOf,
  SEATS,
} from '../../src/audio/voices/presets/index.ts';
import { getTrack, trackNames } from '../../src/audio/tracks/index.ts';

describe('sampled instrument presets', () => {
  it('has a preset for every instrument the scores actually name', () => {
    // This is the check that keeps a pre-rendered cue from quietly keeping one
    // oscillator channel. The renderer treats a miss as a hard error; this
    // test means nobody has to run the renderer to find out.
    const used = new Set<string>();
    for (const name of trackNames()) {
      for (const channel of getTrack(name).channels) used.add(channel.instrument);
    }
    const missing = [...used].filter((name) => !hasPreset(name));
    expect(missing).toEqual([]);
    expect(used.size).toBeGreaterThan(30);
  });

  it('declares a name on each preset matching its registry key', () => {
    expect(presetKeyMismatches()).toEqual([]);
  });

  it('registers each preset in exactly one group', () => {
    for (const name of Object.keys(PRESETS)) {
      expect(groupOf(name)).not.toBeNull();
    }
    const seen = new Set<string>();
    for (const group of Object.values(PRESET_GROUPS)) {
      for (const name of Object.keys(group)) {
        expect(seen.has(name), `"${name}" is registered twice`).toBe(false);
        seen.add(name);
      }
    }
  });

  it('gives every preset at least one library layer and a known seat', () => {
    for (const [name, preset] of Object.entries(PRESETS)) {
      expect(preset.layers.length, `${name} has no layers`).toBeGreaterThan(0);
      for (const layer of preset.layers) {
        expect(['salamander', 'sonatina', 'fluidr3']).toContain(layer.lib);
        // A layer with neither a patch number nor a name cannot be resolved.
        expect(
          layer.program !== undefined || layer.name !== undefined,
          `${name} has an unaddressable layer`,
        ).toBe(true);
      }
      expect(SEATS[preset.seat], `${name} sits in unknown seat "${preset.seat}"`).toBeDefined();
      expect(preset.about.length).toBeGreaterThan(10);
    }
  });

  it('states a caveat for each instrument that is an approximation', () => {
    // These three are stand-ins, and saying so in the data is what stops the
    // docs quietly claiming a spiccato section we do not have.
    const named = presetCaveats().map((c) => c.name).sort();
    expect(named).toEqual(['soprano', 'strings-short', 'taiko']);
  });

  it('throws a useful error for an unknown preset', () => {
    expect(() => getPreset('theremin')).toThrow(/No sampled preset for "theremin"/);
  });
});

describe('orchestral seating', () => {
  it('puts the sections where an audience would hear them', () => {
    // Violins left, cellos and basses right, horns back left. If this ever
    // flips, every cue's stereo image inverts at once.
    expect(seatOf('violin-1').pan).toBeLessThan(0);
    expect(seatOf('cello').pan).toBeGreaterThan(0);
    expect(seatOf('bass').pan).toBeGreaterThan(seatOf('cello').pan);
    expect(seatOf('horn').pan).toBeLessThan(0);
    expect(seatOf('piano').pan).toBe(0);
  });

  it('sends the back of the platform further into the hall than the front', () => {
    expect(sendOf(seatOf('choir'))).toBeGreaterThan(sendOf(seatOf('violin-1')));
    expect(sendOf(seatOf('organ'))).toBeGreaterThan(sendOf(seatOf('piano')));
    // A close-miked kit should be much drier than the orchestra.
    expect(sendOf(seatOf('band-kit'))).toBeLessThan(sendOf(seatOf('timpani')));
  });

  it('falls back to a neutral seat rather than throwing', () => {
    expect(seatOf('nowhere-in-particular')).toEqual({ pan: 0, depth: 0.4 });
  });

  it('keeps every send inside a sane range', () => {
    for (const name of Object.keys(SEATS)) {
      const send = sendOf(seatOf(name));
      expect(send).toBeGreaterThan(0);
      expect(send).toBeLessThanOrEqual(1);
    }
  });
});

describe('loop seam crossfade', () => {
  /** A signal with an obvious discontinuity across the wrap. */
  function ramp(length: number): ReturnType<typeof makeStereo> {
    const buf = makeStereo(length);
    for (let i = 0; i < length; i++) {
      buf.left[i] = Math.sin(i * 0.031);
      buf.right[i] = Math.cos(i * 0.017);
    }
    return buf;
  }

  it('makes the last loop sample identical to the one before loopStart', () => {
    // That identity is the whole mechanism: after it, the wrap into loopStart
    // is the exact same transition the listener already heard entering the
    // loop the first time, so it cannot click any harder than the music does.
    const buf = ramp(4000);
    const start = 500;
    const end = 3500;
    expect(crossfadeLoopSeam(buf, start, end, 128)).toBe(true);
    expect(buf.left[end - 1]).toBe(buf.left[start - 1]);
    expect(buf.right[end - 1]).toBe(buf.right[start - 1]);
  });

  it('shrinks the step across the wrap', () => {
    const before = ramp(4000);
    const after = ramp(4000);
    const start = 500;
    const end = 3500;
    const stepBefore = Math.abs(before.left[start]! - before.left[end - 1]!);
    crossfadeLoopSeam(after, start, end, 128);
    const stepAfter = Math.abs(after.left[start]! - after.left[end - 1]!);
    expect(stepAfter).toBeLessThan(stepBefore);
  });

  it('declines when there is no run-up before loopStart to fade into', () => {
    const buf = ramp(4000);
    expect(crossfadeLoopSeam(buf, 0, 3500, 128)).toBe(false);
    expect(crossfadeLoopSeam(buf, 4, 3500, 128)).toBe(false);
  });

  it('never reaches outside the buffer', () => {
    const buf = ramp(1000);
    expect(crossfadeLoopSeam(buf, 200, 2000, 64)).toBe(false);
    for (let i = 0; i < 1000; i++) {
      expect(Number.isFinite(buf.left[i]!)).toBe(true);
    }
  });

  it('holds power steady through the fade instead of dipping', () => {
    // A linear crossfade of two uncorrelated signals loses ~3 dB in the middle,
    // which is audible as a small hole every time the loop wraps.
    const buf = makeStereo(4000);
    buf.left.fill(1);
    buf.right.fill(1);
    crossfadeLoopSeam(buf, 500, 3500, 200);
    for (let i = 3300; i < 3500; i++) {
      expect(buf.left[i]!).toBeGreaterThan(0.99);
      expect(buf.left[i]!).toBeLessThan(1.42);
    }
  });
});

describe('concert hall', () => {
  const SR = 16000;

  it('decays instead of ringing on', () => {
    const impulse = renderHallImpulse(SR, 1.2, { rt60: 0.8 });
    const head = impulse.left.slice(0, SR * 0.1).reduce((a, b) => a + Math.abs(b), 0);
    const tail = impulse.left.slice(SR * 0.9).reduce((a, b) => a + Math.abs(b), 0);
    expect(head).toBeGreaterThan(0);
    expect(tail).toBeLessThan(head);
  });

  it('produces finite samples and no runaway feedback', () => {
    const input = makeStereo(SR);
    for (let i = 0; i < SR; i++) {
      input.left[i] = Math.sin(i * 0.05);
      input.right[i] = Math.sin(i * 0.051);
    }
    const wet = new Hall(SR, { rt60: 3.5 }).render(input);
    let peak = 0;
    for (let i = 0; i < wet.left.length; i++) {
      expect(Number.isFinite(wet.left[i]!)).toBe(true);
      expect(Number.isFinite(wet.right[i]!)).toBe(true);
      peak = Math.max(peak, Math.abs(wet.left[i]!), Math.abs(wet.right[i]!));
    }
    expect(peak).toBeLessThan(8);
  });

  it('decays the top octave faster than the bottom, as a real hall does', () => {
    const impulse = renderHallImpulse(SR, 1.5, { rt60: 1.8, hfDamping: 3 });
    // Crude but sufficient: sample-to-sample motion is a proxy for high
    // frequency content, so compare it early against late in the tail.
    const motion = (from: number, to: number): number => {
      let sum = 0;
      let energy = 0;
      for (let i = from + 1; i < to; i++) {
        sum += Math.abs(impulse.left[i]! - impulse.left[i - 1]!);
        energy += Math.abs(impulse.left[i]!);
      }
      return energy > 0 ? sum / energy : 0;
    };
    expect(motion(Math.round(SR * 0.6), Math.round(SR * 0.8))).toBeLessThan(
      motion(Math.round(SR * 0.05), Math.round(SR * 0.25)),
    );
  });

  it('returns a stereo pair that is not simply two copies of one channel', () => {
    const impulse = renderHallImpulse(SR, 0.6);
    let differing = 0;
    for (let i = 0; i < impulse.left.length; i++) {
      if (Math.abs(impulse.left[i]! - impulse.right[i]!) > 1e-6) differing++;
    }
    expect(differing).toBeGreaterThan(impulse.left.length / 4);
  });
});
