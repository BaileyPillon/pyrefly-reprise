/**
 * The motion sounds (`?motionsfx=`; motion program, lane "feel", step 2, 2026-10-22; Bailey: "Subtle synced sounds": a whoosh on a lunge and on a smear, a landing thud matched to the
 * squash, a cloth rustle on a cast, from the existing sound library, mixed under the music; both games, one neutral set, demo chapters only): the switch, the cue table against the
 * shipped manifest, the planner, the sink, the mixer's trim and fade, and the REAL `PaintedActor` and presenter hooks.
 */
import { readFileSync } from 'node:fs';
import { Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MOTION_BEATS,
  MOTION_CUES,
  MOTION_GAME_OVERRIDES,
  MOTION_MEASURED,
  cueAllowedFor,
  motionCue,
} from '../../src/audio/sfxV2/motionCues.ts';
import { V2_CUES } from '../../src/audio/sfxV2/cues.ts';
import { setSfxGame } from '../../src/audio/sfxV2/voicing.ts';
import { startSfxSource, shapedLength } from '../../src/audio/sfxSource.ts';
import { motionSfxOn, parseFeelKeys, resetFeelForTests, setFeelChapter, setMotionSfxOn } from '../../src/engine/feel/FeelSwitch.ts';
import { heftOfHeight, motionBeat, motionSfxSpeed, setMotionBeatSink, setMotionSfxSpeed, type MotionBeat } from '../../src/engine/feel/MotionBeats.ts';
import { BUSY_MAX, DUCK, DUCK_WINDOW_MS, MIN_GAP_MS, MIN_LAND_STRENGTH, newMotionMemory, planMotionSfx, type MotionGate } from '../../src/engine/feel/MotionSfx.ts';
import { castBeat } from '../../src/engine/feel/MotionHooks.ts';
import { installMotionSfx, motionSfxLog, playMotionBeat, resetMotionSfxForTests, setMotionSfxClock, type MotionSfxDeps } from '../../src/app/motionSfxSink.ts';
import { setPace, setPaceGame } from '../../src/engine/pace.ts';
import type { PaintedTexture } from '../../src/engine/PaintedArt.ts';

vi.mock('../../src/engine/ProceduralArt.ts', () => {
  const canvas = (): { width: number; height: number; getContext: () => null } => ({ width: 8, height: 8, getContext: () => null });
  return { noiseCanvas: canvas, radialCanvas: canvas, paintPlaceholderFigure: canvas };
});
const { PaintedActor } = await import('../../src/engine/PaintedActor.ts');

interface ManifestCue { offset: number; duration: number; game?: string }
const manifest = JSON.parse(readFileSync(new URL('../../public/audio/manifest.json', import.meta.url), 'utf8')) as {
  sfx: { cues: Record<string, ManifestCue> };
  sfxV2: { cues: Record<string, ManifestCue> };
};

const gate = (over: Partial<MotionGate> = {}): MotionGate => ({ on: true, game: 'ffx', speed: 'normal', now: 10_000, ...over });

afterEach(() => {
  resetFeelForTests();
  resetMotionSfxForTests();
  setMotionBeatSink(null);
  setMotionSfxSpeed(null);
  setSfxGame(null);
  vi.restoreAllMocks();
});

// ------------------------------------------------------------------ the switch

describe('the switch', () => {
  it('reads ?motionsfx= on and off, and ignores any other word', () => {
    expect(parseFeelKeys('?motionsfx=on').motionsfx).toBe(true);
    expect(parseFeelKeys('?motionsfx=OFF').motionsfx).toBe(false);
    expect(parseFeelKeys('?motionsfx=loud').motionsfx).toBeNull();
    expect(parseFeelKeys('').motionsfx).toBeNull();
    expect(parseFeelKeys(undefined).motionsfx).toBeNull();
  });

  it('is OFF at compile time: no key, no pack, no chapter, or only a demo chapter, is silent', () => {
    resetFeelForTests('');
    expect(motionSfxOn()).toBe(false);
    setFeelChapter('seymour-flux');
    expect(motionSfxOn()).toBe(false); // a demo chapter with nothing named: today
  });

  it('?pack=demo turns it on in Chapter I and Chapter IV only; ?motionsfx= beside the pack wins; its own key works without the pack; no key leaves any other chapter silent', () => {
    resetFeelForTests('?pack=demo');
    for (const id of ['seymour-flux', 'ffx2-bahamut']) {
      setFeelChapter(id);
      expect(motionSfxOn()).toBe(true);
    }
    setFeelChapter('yunalesca');
    expect(motionSfxOn()).toBe(false);
    resetFeelForTests('?pack=demo&motionsfx=off');
    setFeelChapter('seymour-flux');
    expect(motionSfxOn()).toBe(false); // the A/B: the demo pack with the sounds off
    resetFeelForTests('?motionsfx=on');
    setFeelChapter('ffx2-bahamut');
    expect(motionSfxOn()).toBe(true);
    setFeelChapter('braskas-final-aeon');
    expect(motionSfxOn()).toBe(false);
    setFeelChapter(null);
    expect(motionSfxOn()).toBe(false);
  });

  it('the debug setter forces it and undefined hands the address back', () => {
    resetFeelForTests('');
    setFeelChapter('seymour-flux');
    setMotionSfxOn(true);
    expect(motionSfxOn()).toBe(true);
    setMotionSfxOn(undefined);
    expect(motionSfxOn()).toBe(false);
  });
});

// ------------------------------------------------------------------ the cue table

describe('the cue table: the existing library, nothing new', () => {
  it('every cue is a slice the shipped manifest holds, long enough for its trim, and shaped by the mixer\'s own parameters', () => {
    for (const kind of MOTION_BEATS) {
      const c = MOTION_CUES[kind];
      const bank = c.key.startsWith('v2:') ? manifest.sfxV2.cues : manifest.sfx.cues;
      const slice = bank[c.key.replace(/^v2:/, '')];
      expect(slice, `${kind}: ${c.key}`).toBeDefined();
      const natural = (slice!.duration / c.pitch) * 1000;
      expect(c.trimMs, `${kind} trim`).toBeLessThanOrEqual(natural + 1e-6); // a trim never asks for more than the slice has
      expect(c.fadeMs).toBeGreaterThan(0); // a cut sound fades, or it clicks
      expect(c.fadeMs).toBeLessThanOrEqual(c.trimMs * 0.5);
      expect(c.peakMs).toBeLessThan(c.trimMs);
      expect(c.pitch).toBeGreaterThanOrEqual(0.5);
      expect(c.pitch).toBeLessThanOrEqual(2);
    }
  });

  it('is the one neutral set for both games (rule 14): the sources describe no motion sound, no cue is game-tagged, no override exists', () => {
    expect(MOTION_GAME_OVERRIDES).toEqual({ ffx: {}, ffx2: {} });
    for (const kind of MOTION_BEATS) {
      expect(MOTION_CUES[kind].game).toBe('both');
      expect(motionCue(kind, 'ffx')).toEqual(motionCue(kind, 'ffx2'));
      const key = MOTION_CUES[kind].key;
      if (key.startsWith('v2:')) expect(V2_CUES[key.slice(3)]?.game).toBe('both');
    }
  });

  it('a cue of the other game never plays: cueAllowedFor refuses a v2 cue tagged for the other game and a cue marked for the other game', () => {
    expect(cueAllowedFor({ ...MOTION_CUES.lunge, key: 'v2:swing-sword', game: 'both' }, 'ffx')).toBe(true);
    expect(cueAllowedFor({ ...MOTION_CUES.lunge, key: 'v2:swing-sword', game: 'both' }, 'ffx2')).toBe(false); // FFX's sword swing
    expect(cueAllowedFor({ ...MOTION_CUES.lunge, key: 'v2:swing-dagger', game: 'both' }, 'ffx')).toBe(false); // FFX-2's daggers
    expect(cueAllowedFor({ ...MOTION_CUES.lunge, game: 'ffx' }, 'ffx2')).toBe(false);
    expect(cueAllowedFor({ ...MOTION_CUES.lunge, game: 'ffx2' }, 'ffx2')).toBe(true);
    expect(cueAllowedFor(MOTION_CUES.cast, 'ffx2')).toBe(true);
  });

  it('is measured well under the hit sounds: every peak at least 6 dB under hit-sword at 0.8 (-7.1 dBFS), the lunge and dash 8 dB under its loudness (-20.1 LUFS)', () => {
    for (const kind of MOTION_BEATS) expect(MOTION_MEASURED[kind].peakDb, kind).toBeLessThanOrEqual(-13.1);
    expect(MOTION_MEASURED.lunge.momentaryLufs).toBeLessThanOrEqual(-28.1);
    expect(MOTION_MEASURED.dash.momentaryLufs).toBeLessThanOrEqual(-28.1);
    // the beats a hit can share a moment with are the quietest of all: the smear sits on a cut, the rustle on a cast
    expect(MOTION_MEASURED.smear.peakDb).toBeLessThan(MOTION_MEASURED.lunge.peakDb);
    expect(MOTION_MEASURED.cast.peakDb).toBeLessThan(MOTION_MEASURED.land.peakDb);
  });
});

// ------------------------------------------------------------------ the planner

describe('planMotionSfx: the gates', () => {
  it('plays nothing with the switch off, with no game, at fast or skip speed, and says why', () => {
    const m = newMotionMemory();
    expect(planMotionSfx({ kind: 'lunge' }, gate({ on: false }), m)).toEqual({ ok: false, why: 'off' });
    expect(planMotionSfx({ kind: 'lunge' }, gate({ game: null }), m)).toEqual({ ok: false, why: 'no-game' });
    expect(planMotionSfx({ kind: 'lunge' }, gate({ speed: 'fast' }), m)).toEqual({ ok: false, why: 'speed' });
    expect(planMotionSfx({ kind: 'lunge' }, gate({ speed: 'skip' }), m)).toEqual({ ok: false, why: 'speed' });
    expect(m).toEqual(newMotionMemory()); // a refusal remembers nothing
  });

  it('plays for FFX and FFX-2 alike (one neutral set)', () => {
    for (const game of ['ffx', 'ffx2'] as const) {
      const a = planMotionSfx({ kind: 'lunge', strength: 0.6, heft: 0 }, gate({ game }), newMotionMemory());
      expect(a.ok).toBe(true);
    }
    const f = planMotionSfx({ kind: 'cast' }, gate({ game: 'ffx' }), newMotionMemory());
    const g = planMotionSfx({ kind: 'cast' }, gate({ game: 'ffx2' }), newMotionMemory());
    expect(f).toEqual(g);
  });

  it('does not repeat a beat inside its gap, but another beat is free', () => {
    const m = newMotionMemory();
    expect(planMotionSfx({ kind: 'lunge' }, gate({ now: 1000 }), m).ok).toBe(true);
    expect(planMotionSfx({ kind: 'lunge' }, gate({ now: 1000 + MIN_GAP_MS.lunge - 1 }), m)).toEqual({ ok: false, why: 'too-soon' });
    expect(planMotionSfx({ kind: 'cast' }, gate({ now: 1100 }), m).ok).toBe(true);
    expect(planMotionSfx({ kind: 'lunge' }, gate({ now: 1000 + MIN_GAP_MS.lunge }), m).ok).toBe(true);
  });

  it('never starts more than three motion sounds in 300 ms (FFX-2\'s overlapping ATB)', () => {
    const m = newMotionMemory();
    const kinds = ['lunge', 'cast', 'land', 'dash', 'smear'] as const;
    const verdicts = kinds.map((kind, i) => planMotionSfx({ kind, strength: 0.8 }, gate({ now: 2000 + i * 20 }), m));
    expect(verdicts.filter((v) => v.ok)).toHaveLength(BUSY_MAX);
    expect(verdicts[BUSY_MAX]).toEqual({ ok: false, why: 'busy' });
    expect(planMotionSfx({ kind: 'dash' }, gate({ now: 2000 + 400 }), m).ok).toBe(true); // the window slid on
  });

  it('a landing smaller than a tenth of a hop is not a landing', () => {
    const m = newMotionMemory();
    expect(planMotionSfx({ kind: 'land', strength: MIN_LAND_STRENGTH - 0.01 }, gate(), m)).toEqual({ ok: false, why: 'small' });
    expect(planMotionSfx({ kind: 'land', strength: MIN_LAND_STRENGTH }, gate({ now: 5000 }), m).ok).toBe(true);
  });
});

describe('planMotionSfx: the shape', () => {
  const plan = (beat: MotionBeat, over: Partial<MotionGate> = {}): ReturnType<typeof expectPlan> => expectPlan(planMotionSfx(beat, gate(over), newMotionMemory()));
  function expectPlan(a: ReturnType<typeof planMotionSfx>) {
    if (!a.ok) throw new Error(`refused: ${a.why}`);
    return a.plan;
  }

  it('asks the mixer for the table\'s cue, with its trim and fade', () => {
    for (const kind of MOTION_BEATS) {
      const p = plan({ kind, strength: 1, heft: 0 });
      expect(p.key).toBe(MOTION_CUES[kind].key);
      expect(p.kind).toBe(kind);
      expect(p.trimMs).toBeGreaterThan(0);
      expect(p.fadeMs).toBeGreaterThan(0);
      expect(p.fadeMs).toBeLessThanOrEqual(p.trimMs * 0.45 + 1);
    }
  });

  it('a bigger movement is louder: lunge, dash, smear and landing rise with strength', () => {
    for (const kind of ['lunge', 'dash', 'smear', 'land'] as const) {
      const small = plan({ kind, strength: 0.2 }).volume;
      const mid = plan({ kind, strength: 0.6 }).volume;
      const big = plan({ kind, strength: 1 }).volume;
      expect(small, kind).toBeLessThan(mid);
      expect(mid, kind).toBeLessThan(big);
    }
    expect(plan({ kind: 'lunge', strength: 1 }).volume).toBeCloseTo(MOTION_CUES.lunge.volume, 3); // strength 1, a party member: the table's measured volume
    expect(plan({ kind: 'land', strength: 1 }).volume).toBeCloseTo(MOTION_CUES.land.volume, 3);
  });

  it('a heavier body is lower and longer, and a landing is louder: a boss against a party member', () => {
    for (const kind of ['lunge', 'dash', 'land', 'cast'] as const) {
      const light = plan({ kind, strength: 0.8, heft: 0 });
      const boss = plan({ kind, strength: 0.8, heft: 1 });
      expect(boss.pitch, kind).toBeLessThan(light.pitch);
    }
    expect(plan({ kind: 'land', strength: 0.8, heft: 1 }).volume).toBeGreaterThan(plan({ kind: 'land', strength: 0.8, heft: 0 }).volume);
    expect(plan({ kind: 'lunge', heft: 1 }).trimMs).toBeGreaterThan(plan({ kind: 'lunge', heft: 0 }).trimMs);
    expect(plan({ kind: 'land', heft: 1 }).trimMs).toBeGreaterThan(plan({ kind: 'land', heft: 0 }).trimMs);
  });

  it('every planned volume and pitch stays inside what the mixer takes, however large the inputs', () => {
    for (const kind of MOTION_BEATS) {
      for (const [strength, heft] of [[-4, -4], [0, 0], [1, 1], [9, 9], [Number.NaN, Number.NaN]] as const) {
        const a = planMotionSfx({ kind, strength, heft }, gate(), newMotionMemory());
        if (!a.ok) continue; // a landing of strength 0 is refused: that is the rule
        expect(a.plan.volume).toBeGreaterThanOrEqual(0);
        expect(a.plan.volume).toBeLessThanOrEqual(1.5);
        expect(a.plan.pitch).toBeGreaterThanOrEqual(0.5);
        expect(a.plan.pitch).toBeLessThanOrEqual(2);
        expect(Number.isFinite(a.plan.delay)).toBe(true);
      }
    }
  });

  it('puts the cue\'s loudest moment on the beat: it starts atMs minus its own peak early, never before now', () => {
    const base = MOTION_CUES.lunge;
    expect(plan({ kind: 'lunge', atMs: 0 }).delay).toBe(0);
    expect(plan({ kind: 'lunge', atMs: base.peakMs - 20 }).delay).toBe(0); // the beat is nearer than the swell: it starts at once
    expect(plan({ kind: 'lunge', atMs: base.peakMs + 120, heft: 0 }).delay).toBeCloseTo(0.12, 3);
    // a lower pitch moves the peak later in the cue, so it must start earlier by the ratio
    const boss = plan({ kind: 'lunge', atMs: 400, heft: 1 });
    expect(boss.delay).toBeCloseTo((400 - base.peakMs * (base.pitch / boss.pitch)) / 1000, 3);
  });

  it('cuts a whoosh to the length of the move it belongs to', () => {
    expect(plan({ kind: 'dash', ms: 300 }).trimMs).toBeLessThanOrEqual(285);
    expect(plan({ kind: 'dash', ms: 900 }).trimMs).toBe(MOTION_CUES.dash.trimMs);
    expect(plan({ kind: 'lunge', ms: 100 }).trimMs).toBe(90);
    expect(plan({ kind: 'lunge', ms: 0 }).trimMs).toBe(MOTION_CUES.lunge.trimMs);
  });

  it('halves a smear that lands within 90 ms of a lunge or a dash (one movement, one whoosh), and leaves a later one whole', () => {
    const m = newMotionMemory();
    planMotionSfx({ kind: 'lunge' }, gate({ now: 3000 }), m);
    const near = planMotionSfx({ kind: 'smear', strength: 1 }, gate({ now: 3000 + DUCK_WINDOW_MS - 1 }), m);
    const alone = planMotionSfx({ kind: 'smear', strength: 1 }, gate({ now: 9000 }), newMotionMemory());
    if (!near.ok || !alone.ok) throw new Error('refused');
    expect(near.plan.ducked).toBe(true);
    expect(near.plan.volume).toBeCloseTo(alone.plan.volume * DUCK, 3);
    const later = planMotionSfx({ kind: 'smear', strength: 1 }, gate({ now: 3000 + 400 }), m);
    if (!later.ok) throw new Error('refused');
    expect(later.plan.ducked).toBe(false);
    expect(later.plan.volume).toBeCloseTo(alone.plan.volume, 3);
  });

  it('is a pure function of its inputs: the same beat, gate and memory plan the same sound', () => {
    const a = planMotionSfx({ kind: 'land', strength: 0.7, heft: 0.3, atMs: 40 }, gate(), newMotionMemory());
    const b = planMotionSfx({ kind: 'land', strength: 0.7, heft: 0.3, atMs: 40 }, gate(), newMotionMemory());
    expect(a).toEqual(b);
  });
});

describe('heftOfHeight', () => {
  it('is 0 for a party member, 1 for a colossus, and never leaves 0 to 1', () => {
    expect(heftOfHeight(1.8)).toBe(0);
    expect(heftOfHeight(1.2)).toBe(0);
    expect(heftOfHeight(4.4)).toBe(1);
    expect(heftOfHeight(9)).toBe(1);
    expect(heftOfHeight(Number.NaN)).toBe(0);
    expect(heftOfHeight(4.1)).toBeCloseTo(0.885, 2);
  });
});

// ------------------------------------------------------------------ the sink

function fakeDeps(over: Partial<MotionSfxDeps> = {}): { deps: MotionSfxDeps; played: Array<{ name: string; options: Record<string, unknown> }> } {
  const played: Array<{ name: string; options: Record<string, unknown> }> = [];
  const deps: MotionSfxDeps = {
    audio: { playSfx: (name, options) => void played.push({ name, options: { ...(options ?? {}) } }) },
    on: () => true,
    game: () => 'ffx',
    speed: () => 'normal',
    now: () => 5000,
    ...over,
  };
  return { deps, played };
}

describe('the sink', () => {
  it('carries a plan to playSfx as an ordinary effect: key, volume, pitch, delay, trim and fade, and logs it', () => {
    const { deps, played } = fakeDeps();
    expect(playMotionBeat({ kind: 'lunge', strength: 0.7, heft: 0, atMs: 200 }, deps)).toBe('played');
    expect(played).toHaveLength(1);
    expect(played[0]!.name).toBe('whiff');
    expect(Object.keys(played[0]!.options).sort()).toEqual(['delay', 'fadeMs', 'pitch', 'trimMs', 'volume']);
    expect(played[0]!.options['delay']).toBeCloseTo((200 - MOTION_CUES.lunge.peakMs) / 1000, 3);
    expect(motionSfxLog()).toHaveLength(1);
    expect(motionSfxLog()[0]!.result).toBe('played');
    expect(motionSfxLog()[0]!.plan?.key).toBe('whiff');
  });

  it('with the switch off it plans nothing, plays nothing and keeps nothing: the live game', () => {
    const { deps, played } = fakeDeps({ on: () => false });
    expect(playMotionBeat({ kind: 'lunge' }, deps)).toBe('off');
    expect(played).toHaveLength(0);
    expect(motionSfxLog()).toHaveLength(0);
  });

  it('logs why a beat made no sound', () => {
    const { deps } = fakeDeps({ speed: () => 'fast' });
    expect(playMotionBeat({ kind: 'cast' }, deps)).toBe('speed');
    expect(motionSfxLog().map((r) => r.result)).toEqual(['speed']);
    expect(motionSfxLog(true)).toHaveLength(1);
    expect(motionSfxLog()).toHaveLength(0);
  });

  it('a context that will not play is silence, not an error', () => {
    const { deps } = fakeDeps({ audio: { playSfx: () => { throw new Error('no context'); } } });
    expect(() => playMotionBeat({ kind: 'land', strength: 1 }, deps)).not.toThrow();
    expect(motionSfxLog()[0]!.result).toBe('error');
  });

  it('follows the stepper\'s clock, so the rate limits are simulated time', () => {
    let t = 1000;
    setMotionSfxClock(() => t);
    const { deps, played } = fakeDeps({ now: () => t });
    playMotionBeat({ kind: 'lunge' }, deps);
    t += 50;
    expect(playMotionBeat({ kind: 'lunge' }, deps)).toBe('too-soon');
    t += MIN_GAP_MS.lunge;
    expect(playMotionBeat({ kind: 'lunge' }, deps)).toBe('played');
    expect(played).toHaveLength(2);
  });
});

describe('installed: a figure\'s beat becomes a sound only in a demo chapter, for a game, at normal speed', () => {
  it('end to end through motionBeat with the real switch, game and speed getters', () => {
    const played: string[] = [];
    installMotionSfx({ playSfx: (name) => void played.push(name) });
    resetFeelForTests('?pack=demo');
    motionBeat({ kind: 'lunge' });
    expect(played).toHaveLength(0); // no chapter named yet
    setFeelChapter('seymour-flux');
    motionBeat({ kind: 'lunge' });
    expect(played).toHaveLength(0); // a chapter, but no game voice (the title and FF7 have none)
    setSfxGame('ffx');
    setMotionSfxClock(() => 10_000);
    motionBeat({ kind: 'lunge' });
    expect(played).toEqual(['whiff']);
    setMotionSfxClock(() => 20_000);
    setMotionSfxSpeed(() => 'fast');
    expect(motionSfxSpeed()).toBe('fast');
    motionBeat({ kind: 'cast' });
    expect(played).toEqual(['whiff']); // fast playback: silent
    setMotionSfxSpeed(() => 'normal');
    motionBeat({ kind: 'cast' });
    expect(played).toEqual(['whiff', 'steal-success']);
    setFeelChapter('yunalesca'); // another chapter: the pack names nothing there
    setMotionSfxClock(() => 30_000);
    motionBeat({ kind: 'lunge' });
    expect(played).toHaveLength(2);
  });

  it('a throwing sink never reaches the figure', () => {
    setMotionBeatSink(() => { throw new Error('boom'); });
    expect(() => motionBeat({ kind: 'lunge' })).not.toThrow();
  });

  it('with no sink installed a beat is nothing', () => {
    setMotionBeatSink(null);
    expect(() => motionBeat({ kind: 'land', strength: 1 })).not.toThrow();
  });
});

// ------------------------------------------------------------------ the mixer's trim and fade

interface Call { op: string; args: unknown[] }
function fakeContext(): { ctx: AudioContext; calls: Call[]; source: { playbackRate: { value: number } } } {
  const calls: Call[] = [];
  const param = (): Record<string, unknown> => ({
    value: 1,
    setValueAtTime: (...a: unknown[]) => void calls.push({ op: 'set', args: a }),
    linearRampToValueAtTime: (...a: unknown[]) => void calls.push({ op: 'ramp', args: a }),
    cancelScheduledValues: () => undefined,
  });
  const node = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({ connect: () => undefined, disconnect: () => undefined, ...extra });
  const source = node({ buffer: null, playbackRate: { value: 1 }, loop: false, loopStart: 0, loopEnd: 0, start: (...a: unknown[]) => void calls.push({ op: 'start', args: a }), stop: () => undefined, onended: null });
  const gain = node({ gain: param() });
  const panner = node({ pan: { value: 0 } });
  const ctx = { currentTime: 10, createBufferSource: () => source, createGain: () => gain, createStereoPanner: () => panner } as unknown as AudioContext;
  return { ctx, calls, source: source as unknown as { playbackRate: { value: number } } };
}
const outs = { dry: { connect: () => undefined } as unknown as AudioNode, send: null };
const slice = { cue: { offset: 4, duration: 0.446 }, buffer: {} } as unknown as import('../../src/audio/SfxSprites.ts').SpriteSlice;

describe('the mixer: trimMs and fadeMs (additive)', () => {
  it('shapedLength: the output length after the playback rate, and the part of the buffer it plays', () => {
    expect(shapedLength(0.446, 1, undefined)).toEqual({ out: 0.446, buffer: 0.446 });
    const s = shapedLength(0.446, 0.8, 360);
    expect(s.out).toBeCloseTo(0.36, 9);
    expect(s.buffer).toBeCloseTo(0.288, 9); // 0.36 s of output at 0.8x consumes 0.288 s of the buffer
    expect(shapedLength(0.1, 1, 360).out).toBeCloseTo(0.1, 9); // never longer than the slice
    expect(shapedLength(0.446, 0, 100).out).toBeCloseTo(0.1, 9); // a zero rate is read as 1
  });

  it('a cue with neither parameter starts exactly as it always did: the whole slice, no gain automation', () => {
    const { ctx, calls } = fakeContext();
    startSfxSource(ctx, outs, {} as AudioBuffer, slice, 0.5, { pitch: 0.9, pan: 0.2 }, 0.03, false);
    expect(calls).toEqual([{ op: 'start', args: [10.03, 4, 0.446] }]);
  });

  it('trimMs plays only that much of the slice (in output time) and fadeMs ramps the gain to silence at its end', () => {
    const { ctx, calls, source } = fakeContext();
    startSfxSource(ctx, outs, {} as AudioBuffer, slice, 0.42, { pitch: 0.8, trimMs: 360, fadeMs: 120 }, 0, false);
    expect(source.playbackRate.value).toBe(0.8);
    const set = calls.find((c) => c.op === 'set')!;
    const ramp = calls.find((c) => c.op === 'ramp')!;
    const start = calls.find((c) => c.op === 'start')!;
    expect(start.args[0]).toBe(10);
    expect(start.args[1]).toBe(4);
    expect(start.args[2] as number).toBeCloseTo(0.288, 9);
    expect(set.args[0]).toBe(0.42);
    expect(set.args[1] as number).toBeCloseTo(10 + 0.36 - 0.12, 9); // the fade begins 120 ms before the end
    expect(ramp.args[0]).toBe(0);
    expect(ramp.args[1] as number).toBeCloseTo(10 + 0.36, 9);
  });

  it('a fade longer than the sound is the sound; a looped source is never trimmed or faded; the synthesised stand-in is shaped too', () => {
    const a = fakeContext();
    startSfxSource(a.ctx, outs, {} as AudioBuffer, slice, 1, { fadeMs: 5000 }, 0, false);
    expect((a.calls.find((c) => c.op === 'set')!.args[1] as number)).toBeCloseTo(10, 9); // fades from the first sample over the whole 0.446 s
    const b = fakeContext();
    startSfxSource(b.ctx, outs, {} as AudioBuffer, slice, 1, { trimMs: 100, fadeMs: 50 }, 0, true);
    expect(b.calls.filter((c) => c.op === 'ramp')).toHaveLength(0);
    expect(b.calls.find((c) => c.op === 'start')!.args).toEqual([10, 4, undefined]);
    const c = fakeContext();
    startSfxSource(c.ctx, outs, { duration: 0.6 } as AudioBuffer, null, 1, { trimMs: 150, fadeMs: 60 }, 0, false);
    expect(c.calls.find((x) => x.op === 'start')!.args).toEqual([10, 0, 0.15]);
    expect(c.calls.find((x) => x.op === 'ramp')!.args[1] as number).toBeCloseTo(10.15, 9);
  });
});

// ------------------------------------------------------------------ the figure and the presenter

const painting = (pose: string): PaintedTexture => ({ texture: new Texture(), meta: { width: 400, height: 800, baselineY: 780, scale: 1 }, placeholder: false, url: `/art/characters/test/${pose}.png` });
function figure(worldHeight: number): InstanceType<typeof PaintedActor> {
  const actor = new PaintedActor({ name: 'yuna', worldHeight, side: 'party', life: false, interimYaw: false, breathe: false, sway: false });
  actor.adoptPoses({ idle: painting('idle') }, 'idle');
  actor.position.set(-2, 0, 0);
  return actor;
}

describe('the real PaintedActor reports its own beats', () => {
  let beats: MotionBeat[];
  beforeEach(() => {
    beats = [];
    setMotionBeatSink((b) => void beats.push(b));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    setPaceGame('other');
    setPace('current');
  });
  afterEach(() => setPace('steady'));

  it('a lunge reports itself when it begins: its reach, how heavy the body is, the step\'s fastest frame and the move\'s own length', () => {
    const a = figure(1.8);
    for (let i = 0; i < 3; i++) a.update(1 / 60);
    void a.lunge(1.4, 440);
    expect(beats).toHaveLength(1);
    expect(beats[0]!.kind).toBe('lunge');
    expect(beats[0]!.strength).toBeCloseTo(1.4 / 2.4, 9);
    expect(beats[0]!.heft).toBe(0);
    expect(beats[0]!.atMs).toBeCloseTo(440 * 0.19, 9);
    expect(beats[0]!.ms).toBe(440);
  });

  it('a boss is heavy: the same lunge from a 4.1 unit figure carries a heft near 0.88', () => {
    const boss = figure(4.1);
    void boss.lunge(2.4, 440);
    expect(beats[0]!.heft).toBeCloseTo(heftOfHeight(4.1), 9);
    expect(beats[0]!.strength).toBe(1);
  });

  it('a hop reports a landing when it comes down, not before, sized by its height against the figure', async () => {
    const a = figure(1.8);
    for (let i = 0; i < 3; i++) a.update(1 / 60);
    const done = a.hop(0.42, 200);
    for (let i = 0; i < 6; i++) a.update(1 / 60); // 100 ms: still in the air
    await Promise.resolve();
    expect(beats.filter((b) => b.kind === 'land')).toHaveLength(0);
    for (let i = 0; i < 12; i++) a.update(1 / 60);
    await done;
    const land = beats.filter((b) => b.kind === 'land');
    expect(land).toHaveLength(1);
    expect(land[0]!.strength).toBeCloseTo(0.42 / (1.8 * 0.33), 9);
    expect(land[0]!.heft).toBe(0);
  });

  it('a hop that is killed (the actor is disposed mid-air) never lands: no thud, and the promise still settles', async () => {
    const a = figure(1.8);
    for (let i = 0; i < 3; i++) a.update(1 / 60);
    const done = a.hop(0.42, 400);
    for (let i = 0; i < 6; i++) a.update(1 / 60);
    a.dispose();
    await done; // a killed tween resolves its promise (Tween.onKilled), so the presenter is never parked
    expect(beats.filter((b) => b.kind === 'land')).toHaveLength(0);
  });

  it('with no sink installed a lunge and a hop are exactly what they were', async () => {
    setMotionBeatSink(null);
    const a = figure(1.8);
    const run = a.lunge(1, 200);
    const hop = a.hop(0.3, 100);
    for (let i = 0; i < 30; i++) a.update(1 / 60);
    await hop;
    void run;
    expect(beats).toHaveLength(0);
  });
});

describe('the presenter reports a cast', () => {
  it('castBeat names the acting figure\'s heft from its height (a boss rustles lower)', () => {
    const beats: MotionBeat[] = [];
    setMotionBeatSink((b) => void beats.push(b));
    const ctx = (h: number): never => ({ actingId: 'x', stage: { actor: () => ({ headPoint: () => ({ x: 0, y: h, z: 0 }), position: { x: 0, y: 0, z: 0 } }) } }) as never;
    castBeat(ctx(1.8));
    castBeat(ctx(4.4));
    expect(beats.map((b) => [b.kind, b.heft])).toEqual([['cast', 0], ['cast', 1]]);
  });

  it('a stage with no actor, or one that throws, is a party member\'s rustle, not a failure', () => {
    const beats: MotionBeat[] = [];
    setMotionBeatSink((b) => void beats.push(b));
    castBeat({ actingId: null, stage: { actor: () => undefined } } as never);
    castBeat({ actingId: 'x', stage: { actor: () => { throw new Error('no stage'); } } } as never);
    expect(beats.map((b) => b.heft)).toEqual([0, 0]);
  });

  it('playCue(ctx, "cast") reports the beat before it asks for the cast cue; any other cue does not', async () => {
    const { playCue } = await import('../../src/engine/BattlePresenterSfx.ts');
    const beats: MotionBeat[] = [];
    setMotionBeatSink((b) => void beats.push(b));
    const played: string[] = [];
    const ctx = { actingId: null, stage: { actor: () => undefined }, deps: { audio: { playSfx: (k: string) => void played.push(k) } } } as never;
    playCue(ctx, 'cast', { volume: 0.7 });
    playCue(ctx, 'attack', { volume: 0.8 });
    expect(beats.map((b) => b.kind)).toEqual(['cast']);
    expect(played).toHaveLength(2); // the presenter's own cues still play, unchanged
  });
});
