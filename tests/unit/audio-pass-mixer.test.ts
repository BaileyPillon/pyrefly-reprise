// @vitest-environment jsdom
/**
 * THE AUDIO PASS AT THE MIXER (conference demo sound pass, 2026-10-22; decision 184): what `AudioManager.playSfx` does with a pass plan, on a fake audio graph.
 *
 * Off (no address key, or no demo chapter running) a plan is ignored and the mixer starts exactly the one source it always did. On, the base starts at its first audible sample (the leading silence
 * is skipped, counted from the decoded slice), the layers start on that sample from the v2 sprite and the first bank, the big-moment thump of a covered cue still plays, a menu cue takes its family row
 * (a shorter, quieter play), a spell's landing waits for its effect's mark less the cue's own silence, and the dip is its own gain on the music path.
 * What any of it sounds like is Bailey's to judge (AGENTS.md rule 13).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { AudioManager } from '../../src/audio/AudioManager.ts';
import { parseManifest } from '../../src/audio/manifest.ts';
import { setSfxGame } from '../../src/audio/sfxV2/voicing.ts';
import { setAudioNew, setPassAddress, setPassChapter } from '../../src/audio/pass/passSwitch.ts';
import { planHit } from '../../src/audio/pass/passPlanner.ts';
import { UI_FAMILY } from '../../src/audio/pass/passRecipes.ts';
import { passLogGet } from '../../src/audio/pass/passLog.ts';
import type { PassPlan } from '../../src/audio/pass/passTypes.ts';

const RATE = 1000;
/** A decoded sprite of 4 s at 1 kHz: silent until 1.1 s, then a flat tone, so the cue at offset 1.0 s has 100 ms of silence before it speaks. */
const sprite = (): unknown => {
  const data = new Float32Array(4 * RATE);
  for (let i = 1100; i < 1500; i++) data[i] = 0.5;
  for (let i = 2000; i < 2400; i++) data[i] = 0.5; // the cue at 2.0 s speaks at once
  return { sampleRate: RATE, length: data.length, numberOfChannels: 1, getChannelData: () => data };
};

const raw = {
  version: 1,
  sampleRate: 44100,
  music: {},
  sfx: { file: 'sfx/sprite.mp3', duration: 4, cues: { 'hit-2': { offset: 2, duration: 0.4 }, chime: { offset: 2, duration: 0.4 } } },
  sfxV2: { file: 'sfx/sprite-v2.mp3', duration: 4, cues: { 'hit-gun': { offset: 1, duration: 0.5 }, fire: { offset: 2, duration: 0.4 }, 'cursor-move-x2': { offset: 2, duration: 0.4 } } },
  sfxParity: { packs: {} },
};

interface Start { when: number; offset?: number; duration?: number; gain: number; rate: number }

function mixer(game: 'ffx' | 'ffx2'): { am: AudioManager; starts: Start[]; ctxTime: { now: number } } {
  const am = new AudioManager({ useWorker: false, synthOnly: true });
  const inner = am as unknown as Record<string, unknown> & { sprites: Record<string, unknown> };
  const starts: Start[] = [];
  const ctxTime = { now: 1 };
  let lastGain = { gain: { value: 1, setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined } };
  let lastRate = { value: 1 };
  inner['ctx'] = {
    get currentTime() {
      return ctxTime.now;
    },
    createBufferSource: () => {
      const rate = { value: 1 };
      lastRate = rate;
      return { buffer: null as unknown, playbackRate: rate, connect: () => undefined, disconnect: () => undefined, onended: null, start(_w: number, o?: number, d?: number) { starts.push({ when: _w, offset: o, duration: d, gain: lastGain.gain.value, rate: lastRate.value }); } };
    },
    createGain: () => (lastGain = { gain: { value: 1, setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined }, connect: () => undefined, disconnect: () => undefined } as never),
    createStereoPanner: () => ({ pan: { value: 0 }, connect: () => undefined, disconnect: () => undefined }),
  };
  inner['sfxBus'] = {};
  inner['manifest'] = parseManifest(raw);
  inner['manifestLoad'] = Promise.resolve();
  const sprites = inner['sprites'] as { v1: unknown; v2: unknown };
  sprites.v1 = sprite();
  sprites.v2 = sprite();
  setSfxGame(game);
  return { am, starts, ctxTime };
}

afterEach(() => {
  setSfxGame(null);
  setAudioNew(null);
  setPassAddress(undefined);
  setPassChapter(undefined);
  passLogGet(true);
});

const plan = (over: Partial<PassPlan> = {}): PassPlan => ({ baseSkip: true, layers: [{ key: 'hit-2', gain: 0.5, pitch: 1, skipMs: 0, trimMs: 100, fadeMs: 40, lagMs: 3, pan: 0, role: 'texture' }, { key: 'v2:fire', gain: 0.25, pitch: 1, skipMs: 5, trimMs: 200, fadeMs: 80, lagMs: 0, pan: 0, role: 'character' }], ...over });

describe('a plan with the pass off', () => {
  it('is ignored: one source, from the start of the slice, as it always played', () => {
    setPassAddress('?pack=off');
    setPassChapter('ffx2-bahamut');
    const { am, starts } = mixer('ffx2');
    am.playSfx('v2:hit-gun', { volume: 0.8, pass: plan() });
    expect(starts).toHaveLength(1);
    expect(starts[0]!.offset).toBe(1);
    expect(starts[0]!.duration).toBe(0.5);
  });

  it('is ignored outside a demo chapter even when the address asks', () => {
    setPassAddress('?pack=demo');
    setPassChapter('yunalesca');
    const { am, starts } = mixer('ffx');
    am.playSfx('v2:hit-gun', { volume: 0.8, pass: plan() });
    expect(starts).toHaveLength(1);
  });
});

describe('a plan with the pass on', () => {
  it('starts the base at its first audible sample and lays the layers on it', () => {
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    const { am, starts } = mixer('ffx2');
    am.playSfx('v2:hit-gun', { volume: 0.8, pass: plan() });
    expect(starts).toHaveLength(3);
    const base = starts[0]!;
    expect(base.offset).toBeCloseTo(1.099, 3); // 100 ms of silence, 1 ms of lead-in kept
    expect(base.duration).toBeCloseTo(0.5 - 0.099, 3);
    const texture = starts[1]!;
    expect(texture.offset).toBeCloseTo(2, 3); // the first bank's `hit-2` cue at 2.0 s, from its start (skipMs 0)
    expect(texture.when - base.when).toBeCloseTo(0.001 + 0.003, 3); // the base is audible 1 ms in; the layer lags 3 ms more
    const accent = starts[2]!;
    expect(accent.offset).toBeCloseTo(2.005, 3); // the v2 `fire` cue, 5 ms in
    expect(accent.duration).toBeCloseTo(0.2, 3);
    const log = passLogGet().find((e) => e.kind === 'hit');
    expect(log).toMatchObject({ kind: 'hit', skipMs: 99, onsetMs: 100, layers: ['texture:hit-2', 'character:v2:fire'] });
  });

  it('records the layers in the mixer log, marked as layers', () => {
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    const { am } = mixer('ffx2');
    am.playSfx('v2:hit-gun', { volume: 0.8, pass: plan() });
    const rec = am.debug().sfxLog;
    expect(rec.filter((r) => r.layer).map((r) => `${r.layer}:${r.played}`)).toEqual(['texture:hit-2', 'character:v2:fire']);
    expect(rec[0]!.layer).toBeUndefined();
  });

  it('does not skip a base the plan leaves alone, and plays a spell landing after its effect\'s remaining wait less its own silence', () => {
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    const { am, starts } = mixer('ffx2');
    am.playSfx('v2:hit-gun', { volume: 0.8, pass: { layers: [], landingMs: 300 } });
    expect(starts).toHaveLength(1);
    expect(starts[0]!.offset).toBe(1); // no baseSkip
    expect(starts[0]!.when).toBeCloseTo(1 + 0.2, 3); // 300 ms to the mark less the cue's own 100 ms of silence
  });

  it("puts a spell landing's first audible sample on the effect's mark: the cue's lead-in is skipped and taken out of the wait", () => {
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    const { am, starts } = mixer('ffx2');
    am.playSfx('v2:hit-gun', { volume: 0.8, pass: { baseSkip: true, layers: [], landingMs: 300 } });
    expect(starts[0]!.offset).toBeCloseTo(1.099, 3); // the 100 ms of silence is not played (1 ms of lead-in kept)
    expect(starts[0]!.when + 0.001).toBeCloseTo(1 + 0.3, 3); // the first audible sample sounds 300 ms after the ask, on the mark
    am.playSfx('v2:hit-gun', { volume: 0.8, pass: { baseSkip: true, layers: [] } }); // the effect is already at its mark when the cue is asked
    expect(starts[1]!.offset).toBeCloseTo(1.099, 3);
    expect(starts[1]!.when + 0.001).toBeCloseTo(1.001, 3); // heard at the ask, not 100 ms after it
    expect(passLogGet().filter((e) => e.kind === 'hit').map((e) => [e['onsetMs'], e['skipMs'], e['audibleMs']])).toEqual([[100, 99, 1], [100, 99, 1]]);
  });

  it('plays a layer only if its slice has decoded', () => {
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    const { am, starts } = mixer('ffx2');
    (am as unknown as { sprites: { v2: unknown } }).sprites.v2 = null; // the v2 sprite is still on its way
    am.playSfx('hit-2', { volume: 0.8, pass: plan({ layers: [{ key: 'v2:fire', gain: 0.25, pitch: 1, skipMs: 5, trimMs: 200, fadeMs: 80, lagMs: 0, pan: 0, role: 'character' }] }) });
    expect(starts).toHaveLength(1); // the base only
  });

  it('plays a big blow\'s thump even when a recorded original covers the blow', () => {
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    const { am, starts } = mixer('ffx2');
    const thump = { key: 'v2:fire', gain: 0.5, pitch: 0.85, skipMs: 0, trimMs: 300, fadeMs: 200, lagMs: 0, pan: 0, role: 'thump' };
    (am as unknown as { sprites: { pickEvent: () => unknown } }).sprites.pickEvent = () => ({ name: 'cross-cleave', slice: {} }); // the covering original is "playing"
    am.playSfx('v2:hit-gun', { volume: 0.8, events: [], coveredBy: ['cross-cleave'], pass: { layers: [thump], big: 'boss' } });
    expect(starts).toHaveLength(1);
    expect(starts[0]!.rate).toBeCloseTo(0.85, 3);
  });

  it('gives a menu cue its family row: quieter, shorter, faded', () => {
    setPassAddress('?audio=new');
    setPassChapter('ffx2-bahamut');
    const { am, starts } = mixer('ffx2');
    am.playSfx('cursor-move');
    expect(starts).toHaveLength(1);
    expect(starts[0]!.duration).toBeLessThanOrEqual(UI_FAMILY.ffx2['cursor-move']!.trimMs / 1000 + 1e-6);
    expect(passLogGet().some((e) => e.kind === 'ui')).toBe(true);
  });
});

describe('the planner and the mixer agree', () => {
  it('a Rikku blow plans a body, an accent and a base that starts on its sample', () => {
    const p = planHit({ game: 'ffx2', actorSide: 'party', actorId: 'rikku', weapon: 'dagger', physical: true, crit: false, abilityId: null, hitIndex: 0, hitCount: 1, commandKind: 'attack' })!;
    expect(p.baseSkip).toBe(true);
    expect(p.layers.map((l) => l.role)).toEqual(['body', 'character']);
  });
});
