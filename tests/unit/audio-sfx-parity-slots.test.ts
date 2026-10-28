// @vitest-environment jsdom
/**
 * SFX parity, the mixer's half of the per-event slots and the phase-2 timing (both games):
 *
 * - `playSfx` with `events` consults the running chapter's packs for those names only, in order, so a stand-in
 *   that many events share never picks up another event's recording; with none recorded, the stand-in plays exactly
 *   as it always did (the v2 slice with its P1 trim, else the first-bank cue);
 * - `coveredBy` lets a stand-in stand down while the original that covers it is the one playing, and only then;
 * - `beatMs` starts a recorded original so that its peak lands on the beat, and moves nothing else;
 * - the flow slots (`playParityOnly`, `startFlow`) play only a recorded original and are silent without one;
 * - outside a chapter (the title, chapter select, FF7) none of it applies (rule 14).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AudioManager, audio } from '../../src/audio/AudioManager.ts';
import { parseManifest } from '../../src/audio/manifest.ts';
import { beatDelaySeconds, leadMs, peakLateMs, MAX_BEAT_MS } from '../../src/audio/sfxV2/beatTiming.ts';
import { FLOW_SLOTS, FLOW_STAGGER_S, NO_FLOW, flowSlotsFor, startFlow, type FlowPort } from '../../src/audio/sfxV2/flowSlots.ts';
import { parityTrimDb } from '../../src/audio/sfxV2/parityMix.ts';
import { setSfxGame } from '../../src/audio/sfxV2/voicing.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import type { App } from '../../src/app/App.ts';
import type { BattleResult } from '../../src/battle/common/types.ts';
import type { ChapterId } from '../../src/data/encounters.ts';
import { battleScreenSource } from './helpers/battleScreenSource.ts';

// ---------------------------------------------------------------- the beat

describe('beat timing: where a recorded original starts so its peak lands on the beat', () => {
  it('starts the cue beatMs - peakMs after the ask, never before it', () => {
    expect(beatDelaySeconds({ peakMs: 75 }, 255)).toBeCloseTo(0.18, 6); // the swing: peak on the strike
    expect(beatDelaySeconds({ peakMs: 255 }, 255)).toBe(0);
    expect(beatDelaySeconds({ peakMs: 385 }, 255)).toBe(0); // a swell longer than the wait starts at once
    expect(peakLateMs({ peakMs: 385 }, 255)).toBe(130); // and its peak lands that much late
    expect(peakLateMs({ peakMs: 75 }, 255)).toBe(0);
  });

  it('falls back to the first audible sample, and leaves a cue with no timing alone', () => {
    expect(leadMs({ onsetMs: 40 })).toBe(40);
    expect(leadMs({ onsetMs: 40, peakMs: 70 })).toBe(70);
    expect(leadMs({})).toBeNull();
    expect(beatDelaySeconds({ onsetMs: 40 }, 255)).toBeCloseTo(0.215, 6);
    expect(beatDelaySeconds({}, 255)).toBe(0); // nothing says where its peak is
    expect(peakLateMs({}, 255)).toBeNull();
  });

  it('moves nothing when no beat is ahead, and refuses a beat that is not one', () => {
    for (const beat of [undefined, 0, -5, Number.NaN, Number.POSITIVE_INFINITY * 0]) expect(beatDelaySeconds({ peakMs: 75 }, beat), String(beat)).toBe(0);
    expect(beatDelaySeconds({ peakMs: 0 }, 10_000)).toBeCloseTo(MAX_BEAT_MS / 1000, 6); // a beat is at most MAX_BEAT_MS ahead
    expect(peakLateMs({ peakMs: 75 }, undefined)).toBe(75); // the beat is now: the peak lands 75 ms after it
  });
});

// ---------------------------------------------------------------- the mixer

const cue = (offset: number, game: 'ffx' | 'ffx2' | 'both', timing: { onsetMs?: number; peakMs?: number } = {}) => ({ offset, duration: 0.4, game, lufs: -20, truePeakDb: -6, specRow: 'test.row', ...timing });
const raw = {
  version: 1,
  sampleRate: 44100,
  music: {},
  sfx: { file: 'sfx/sprite.mp3', duration: 10, cues: { 'hit-2': { offset: 0.05, duration: 0.3 }, 'steal-success': { offset: 1, duration: 0.3 } } },
  sfxV2: {
    file: 'sfx/sprite-v2.mp3',
    duration: 20,
    cues: { 'swing-katana': { offset: 1, duration: 0.5 }, shell: { offset: 4, duration: 0.5 }, fire: { offset: 3, duration: 0.5 }, 'hit-heavy-enemy': { offset: 5, duration: 0.5 }, 'swing-greatsword': { offset: 6, duration: 0.5 } },
  },
  sfxParity: {
    packs: {
      'ffx-core': {
        file: 'sfx/parity-ffx-core.mp3',
        duration: 9,
        cues: {
          'swing-katana': cue(0.05, 'ffx', { onsetMs: 0, peakMs: 75 }),
          fire: cue(0.6, 'ffx', { peakMs: 520 }),
          'fire-2': cue(1.2, 'ffx'),
          'encounter-shatter': cue(2, 'ffx'),
          'results-loop': cue(3, 'ffx2'),
        },
      },
      'ffx-flux': { file: 'sfx/parity-ffx-flux.mp3', duration: 3, cues: { 'swing-flux': cue(0.05, 'ffx', { peakMs: 60 }), 'flux-cleave': cue(1, 'ffx') } },
      'ffx2-core': {
        file: 'sfx/parity-ffx2-core.mp3',
        duration: 6,
        cues: { 'swing-greatsword': cue(0.05, 'ffx2', { peakMs: 70 }), 'results-loop': cue(1, 'ffx2'), 'results-ping': cue(2, 'ffx2'), 'ffx-only': cue(3, 'ffx') },
      },
      'ffx2-leblanc': { file: 'sfx/parity-ffx2-leblanc.mp3', duration: 3, cues: { 'swing-ormi': cue(0.05, 'ffx2', { peakMs: 65 }) } },
    },
  },
};

interface Played { buffer: unknown; when: number; offset?: number | undefined; duration?: number | undefined; gain: number; loop: boolean; loopStart: number; loopEnd: number; stopped: number | null }

function mixer(game: 'ffx' | 'ffx2' | null, packs: string[]): { am: AudioManager; played: Played[]; ramps: number[] } {
  const am = new AudioManager({ useWorker: false, synthOnly: true });
  const inner = am as unknown as Record<string, unknown> & { sprites: Record<string, unknown> };
  const played: Played[] = [];
  const ramps: number[] = [];
  let lastGain = { gain: { value: 1 } };
  inner['ctx'] = {
    currentTime: 1,
    createBufferSource: () => {
      const node = {
        buffer: null as unknown,
        playbackRate: { value: 1 },
        loop: false,
        loopStart: 0,
        loopEnd: 0,
        connect: () => undefined,
        disconnect: () => undefined,
        onended: null,
        stop(when: number) { rec.stopped = when; },
        start(when: number, offset?: number, duration?: number) {
          rec.buffer = node.buffer;
          rec.when = when;
          rec.offset = offset;
          rec.duration = duration;
          rec.loop = node.loop;
          rec.loopStart = node.loopStart;
          rec.loopEnd = node.loopEnd;
          rec.gain = lastGain.gain.value;
        },
      };
      const rec: Played = { buffer: null, when: -1, gain: 1, loop: false, loopStart: 0, loopEnd: 0, stopped: null };
      played.push(rec);
      return node;
    },
    createGain: () => (lastGain = { gain: { value: 1, cancelScheduledValues: () => undefined, setValueAtTime: () => undefined, linearRampToValueAtTime: (_v: number, t: number) => void ramps.push(t) }, connect: () => undefined, disconnect: () => undefined } as never),
    createStereoPanner: () => ({ pan: { value: 0 }, connect: () => undefined, disconnect: () => undefined }),
  };
  inner['sfxBus'] = {};
  inner['manifest'] = parseManifest(raw);
  inner['manifestLoad'] = Promise.resolve();
  const sprites = inner['sprites'] as { v1: unknown; v2: unknown; packs: Map<string, unknown>; active: string[] };
  sprites.v1 = { id: 'v1' };
  sprites.v2 = { id: 'v2' };
  for (const name of packs) sprites.packs.set(name, { id: name });
  sprites.active = packs;
  setSfxGame(game);
  return { am, played, ramps };
}

afterEach(() => {
  setSfxGame(null);
  audio.releaseParityPacks();
  vi.restoreAllMocks();
});

describe('events: the packs are consulted for the names asked, and nothing else', () => {
  it('plays the stand-in untouched when no original is recorded (or none is decoded)', () => {
    const { am, played } = mixer('ffx', []);
    am.playSfx('v2:swing-katana', { volume: 0.8, events: ['swing-foe'], beatMs: 255 });
    expect(played).toHaveLength(1);
    expect((played[0]!.buffer as { id: string }).id).toBe('v2');
    expect(played[0]!.offset).toBe(1);
    expect(played[0]!.gain).toBeCloseTo(0.8 * 10 ** (parityTrimDb('ffx', 'swing-katana') / 20), 6); // the stand-in's own P1 trim, if any
    expect(played[0]!.when).toBe(1); // currentTime, no delay: beatMs is only for a recorded original
    expect(am.debug().sfxLog[0]).toMatchObject({ asked: 'v2:swing-katana', played: 'v2:swing-katana', via: 'v2' });
    expect(am.debug().sfxLog[0]!.leadMs).toBeUndefined();
  });

  it('plays the first original the chain names, from the pack that holds it', () => {
    const { am, played } = mixer('ffx', ['ffx-flux', 'ffx-core']);
    am.playSfx('v2:fire', { events: ['fire-3', 'fire-2', 'fire'] });
    expect(played).toHaveLength(1);
    expect((played[0]!.buffer as { id: string }).id).toBe('ffx-core');
    expect(played[0]!.offset).toBe(1.2); // fire-2: the closest recorded tier
    expect(am.debug().sfxLog[0]).toMatchObject({ asked: 'v2:fire', played: 'fire-2', via: 'parity' });
  });

  it('keeps a stand-in many events share away from another event\'s recording', () => {
    const { am, played } = mixer('ffx', ['ffx-core']);
    // Auron's recording is `swing-katana`; a foe asks for none of it, and plays the v2 slice.
    am.playSfx('v2:swing-katana', { events: [] });
    expect((played[0]!.buffer as { id: string }).id).toBe('v2');
    // Auron asks for it by name and gets the recording.
    am.playSfx('v2:swing-katana', { events: ['swing-katana'] });
    expect((played[1]!.buffer as { id: string }).id).toBe('ffx-core');
    // A key with no events at all (a menu key) is still looked up by its own name, as before.
    am.playSfx('v2:swing-katana');
    expect((played[2]!.buffer as { id: string }).id).toBe('ffx-core');
  });

  it('never finds another game\'s original, and ignores events outside a chapter (rule 14)', () => {
    const { am, played } = mixer('ffx2', ['ffx2-core']);
    am.playSfx('v2:swing-greatsword', { events: ['ffx-only'] });
    expect((played[0]!.buffer as { id: string }).id).toBe('v2'); // an FFX cue in an FFX-2 pack is not found
    setSfxGame(null);
    am.playSfx('v2:swing-greatsword', { events: ['swing-greatsword'] });
    expect((played[1]!.buffer as { id: string }).id).toBe('v2');
    am.playSfx('hit-2', { events: ['swing-greatsword'] });
    expect((played[2]!.buffer as { id: string }).id).toBe('v1');
  });

  it('plays a first-bank stand-in\'s original too (the voice left the cue to the presenter)', () => {
    const { am, played } = mixer('ffx', ['ffx-core']);
    am.playSfx('steal-success', { events: ['fire-2'] });
    expect((played[0]!.buffer as { id: string }).id).toBe('ffx-core');
    am.playSfx('steal-success', { events: ['nothing-recorded'] });
    expect((played[1]!.buffer as { id: string }).id).toBe('v1');
  });

  it('still throws for an unknown key with nothing recorded, as it always did', () => {
    const { am } = mixer('ffx', ['ffx-core']);
    expect(() => am.playSfx('bogus', { events: [] })).toThrow(/Unknown sfx/);
    expect(() => am.playSfx('bogus')).toThrow(/Unknown sfx/);
  });
});

describe('coveredBy: a stand-in stands down while the original that covers it plays', () => {
  it('stays silent when the covering original is decoded in an active pack, and says so in the log', () => {
    const { am, played } = mixer('ffx2', ['ffx2-leblanc', 'ffx2-core']);
    am.playSfx('v2:hit-heavy-enemy', { events: ['hit-ormi'], coveredBy: ['swing-ormi'] });
    expect(played).toHaveLength(0);
    expect(am.debug().sfxLog[0]).toMatchObject({ asked: 'v2:hit-heavy-enemy', played: 'swing-ormi', via: 'parity', covered: true });
  });

  it('plays the stand-in when the covering original is not recorded, not decoded, or the pack is not active', () => {
    for (const packs of [[], ['ffx2-core']]) {
      const { am, played } = mixer('ffx2', packs);
      am.playSfx('v2:hit-heavy-enemy', { events: ['hit-ormi'], coveredBy: ['swing-ormi'] });
      expect(played, packs.join()).toHaveLength(1);
      expect((played[0]!.buffer as { id: string }).id).toBe('v2');
    }
  });

  it('plays the blow\'s own original if it has one, even when the swing\'s covers it', () => {
    const m = parseManifest({ ...raw, sfxParity: { packs: { ...raw.sfxParity.packs, 'ffx2-leblanc': { ...raw.sfxParity.packs['ffx2-leblanc'], cues: { 'swing-ormi': cue(0.05, 'ffx2'), 'hit-ormi': cue(1, 'ffx2') } } } } });
    const { am, played } = mixer('ffx2', ['ffx2-leblanc']);
    (am as unknown as { manifest: unknown }).manifest = m;
    am.playSfx('v2:hit-heavy-enemy', { events: ['hit-ormi'], coveredBy: ['swing-ormi'] });
    expect(played).toHaveLength(1);
    expect(played[0]!.offset).toBe(1);
  });

  it('does nothing outside a chapter', () => {
    const { am, played } = mixer(null, ['ffx2-leblanc']);
    am.playSfx('v2:hit-heavy-enemy', { coveredBy: ['swing-ormi'] });
    expect(played).toHaveLength(1);
  });
});

describe('beatMs: the recorded swing\'s peak lands on the strike', () => {
  it('delays a recorded original by beatMs - peakMs on top of the caller\'s own delay, and logs the lead', () => {
    const { am, played } = mixer('ffx2', ['ffx2-leblanc', 'ffx2-core']);
    am.playSfx('v2:swing-greatsword', { events: ['swing-ormi', 'swing-foe'], beatMs: 255, delay: 0.02 });
    expect(played[0]!.when).toBeCloseTo(1 + 0.02 + (255 - 65) / 1000, 6);
    expect(am.debug().sfxLog[0]).toMatchObject({ via: 'parity', played: 'swing-ormi', leadMs: 190 });
    expect(am.debug().sfxLog[0]!.t).toBeCloseTo(1 + 0.02 + 0.19, 6);
  });

  it('starts at once when the swell is longer than the wait, and when no beat was asked', () => {
    const { am, played } = mixer('ffx', ['ffx-core']);
    am.playSfx('v2:fire', { events: ['fire'], beatMs: 255 }); // peakMs 520
    am.playSfx('v2:swing-katana', { events: ['swing-katana'] }); // no beat
    am.playSfx('v2:fire', { events: ['fire-2'], beatMs: 255 }); // no timing measured
    expect(played.map((p) => p.when)).toEqual([1, 1, 1]);
  });

  it('never moves the shipped stand-ins', () => {
    const { am, played } = mixer('ffx', []);
    am.playSfx('v2:swing-katana', { events: ['swing-katana'], beatMs: 255 });
    am.playSfx('steal-success', { beatMs: 255 });
    expect(played.map((p) => p.when)).toEqual([1, 1]);
  });

  it('does not change the caller\'s volume or the original\'s level', () => {
    const { am, played } = mixer('ffx', ['ffx-core']);
    am.playSfx('v2:swing-katana', { events: ['swing-katana'], volume: 0.8, beatMs: 255 });
    expect(played[0]!.gain).toBeCloseTo(0.8, 6); // a recorded original is mastered to its own row: no P1 trim
  });
});

describe('playParityOnly: the flow sounds play a recorded original and nothing else', () => {
  it('is silent with no pack, no game, or no audio context', () => {
    const none = mixer('ffx', []);
    expect(none.am.playParityOnly(['encounter-shatter'])).toBeNull();
    expect(none.played).toHaveLength(0);
    const outside = mixer(null, ['ffx-core']);
    expect(outside.am.playParityOnly(['encounter-shatter'])).toBeNull();
    expect(new AudioManager({ useWorker: false, synthOnly: true }).playParityOnly(['encounter-shatter'])).toBeNull();
  });

  it('plays the original once from its slice, and logs it', () => {
    const { am, played } = mixer('ffx', ['ffx-core']);
    const voice = am.playParityOnly(['encounter-shatter'], { volume: 0.7 });
    expect(voice).not.toBeNull();
    expect(played[0]).toMatchObject({ offset: 2, duration: 0.4, loop: false });
    expect(played[0]!.gain).toBeCloseTo(0.7, 6);
    expect(am.debug().sfxLog[0]).toMatchObject({ asked: 'encounter-shatter', played: 'encounter-shatter', via: 'parity' });
  });

  it('loops inside the slice and fades out on stop', () => {
    const { am, played, ramps } = mixer('ffx2', ['ffx2-core']);
    const voice = am.playParityOnly(['results-loop'], { loop: true })!;
    expect(played[0]).toMatchObject({ loop: true, loopStart: 1, loopEnd: 1.4, offset: 1, duration: undefined });
    voice.stop(0.2);
    expect(ramps).toEqual([1 + 0.2]);
    expect(played[0]!.stopped).toBeCloseTo(1 + 0.2 + 0.02, 6);
  });

  it('only finds an original of the playing game', () => {
    const { am } = mixer('ffx', ['ffx-core']);
    expect(am.playParityOnly(['results-loop'])).toBeNull(); // that cue belongs to FFX-2
  });
});

// ---------------------------------------------------------------- the flow slots

describe('flow slots', () => {
  it('names the encounter\'s opening for FFX and the results tally for FFX-2, and no hook for the other game', () => {
    expect(flowSlotsFor('ffx', 'encounter-open').map((s) => s.cue)).toEqual(['encounter-shatter', 'encounter-fadein']);
    expect(flowSlotsFor('ffx2', 'results-count').map((s) => s.cue)).toEqual(['results-loop']);
    expect(flowSlotsFor('ffx2', 'results-line').map((s) => s.cue)).toEqual(['results-ping']);
    expect(flowSlotsFor('ffx2', 'encounter-open')).toEqual([]);
    expect(flowSlotsFor('ffx', 'results-count')).toEqual([]);
    expect(flowSlotsFor('ff7', 'encounter-open')).toEqual([]);
    expect(flowSlotsFor(null, 'encounter-open')).toEqual([]);
    for (const s of FLOW_SLOTS) expect(s.row.startsWith(`${s.game}.`)).toBe(true);
  });

  function port(hasPack: boolean): { port: FlowPort; calls: Array<{ events: readonly string[]; options: Record<string, unknown> | undefined }>; stops: Array<number | undefined> } {
    const calls: Array<{ events: readonly string[]; options: Record<string, unknown> | undefined }> = [];
    const stops: Array<number | undefined> = [];
    return {
      calls,
      stops,
      port: {
        playParityOnly(events, options) {
          calls.push({ events, options });
          return hasPack ? { stop: (fade) => void stops.push(fade) } : null;
        },
      },
    };
  }

  it('plays each slot of a hook, loops once, staggers repeats, and stops what it started', () => {
    const p = port(true);
    const tally = startFlow(p.port, 'ffx2', 'results-count');
    expect(p.calls).toEqual([{ events: ['results-loop'], options: { loop: true } }]);
    tally.stop(0.12);
    expect(p.stops).toEqual([0.12]);
    const lines = port(true);
    startFlow(lines.port, 'ffx2', 'results-line', 3);
    expect(lines.calls.map((c) => c.options?.['delay'])).toEqual([undefined, FLOW_STAGGER_S, 2 * FLOW_STAGGER_S]);
    expect(lines.calls.every((c) => c.events[0] === 'results-ping')).toBe(true);
    const open = port(true);
    startFlow(open.port, 'ffx', 'encounter-open');
    expect(open.calls.map((c) => c.events[0])).toEqual(['encounter-shatter', 'encounter-fadein']);
  });

  it('hands back an inert handle with no pack, no port, no slot, or a port that throws', () => {
    const none = port(false);
    expect(startFlow(none.port, 'ffx', 'encounter-open')).toBe(NO_FLOW);
    expect(startFlow(null, 'ffx', 'encounter-open')).toBe(NO_FLOW);
    expect(startFlow(none.port, 'ffx', 'results-count')).toBe(NO_FLOW);
    expect(startFlow(none.port, 'ff7', 'encounter-open')).toBe(NO_FLOW);
    const bad: FlowPort = { playParityOnly: () => { throw new Error('no audio'); } };
    expect(startFlow(bad, 'ffx', 'encounter-open')).toBe(NO_FLOW);
    expect(() => NO_FLOW.stop(0.1)).not.toThrow();
  });
});

// ---------------------------------------------------------------- the results tally

function result(outcome: BattleResult['outcome'], ap = 12): BattleResult {
  return { outcome, turns: 10, elapsedTicks: 500, elapsedMs: 60_000, ap, exp: 10, gil: 100, drops: [], overkilled: [], sphereLevelsGained: {} };
}

function results(chapterId: ChapterId, outcome: BattleResult['outcome'], silent?: boolean): { screen: ResultsScreen; root: HTMLElement } {
  const save = new SaveStore('sfx-tally-test', null);
  const screen = new ResultsScreen({ chapterId, result: result(outcome), elapsedMs: 756_000, ...(silent === undefined ? {} : { silent }) });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  return { screen, root };
}

describe('the results tally (FFX-2: a loop while the numbers count, a stinger as each line lands)', () => {
  function spy(): { calls: Array<{ events: readonly string[]; options: Record<string, unknown> | undefined }>; stops: Array<number | undefined> } {
    const calls: Array<{ events: readonly string[]; options: Record<string, unknown> | undefined }> = [];
    const stops: Array<number | undefined> = [];
    vi.spyOn(audio, 'playParityOnly').mockImplementation((events, options) => {
      calls.push({ events, options: options as Record<string, unknown> | undefined });
      return { stop: (fade) => void stops.push(fade) };
    });
    vi.spyOn(audio, 'playSfx').mockImplementation(() => undefined);
    return { calls, stops };
  }

  it('starts the loop with the victory card, ends it when the numbers land, and sounds one stinger per counted line', () => {
    const { calls, stops } = spy();
    const { screen, root } = results('ffx2-leblanc', 'victory', false);
    expect(calls.map((c) => c.events[0])).toEqual(['results-loop']);
    screen.update(0.5); // still counting
    expect(stops).toEqual([]);
    screen.update(1); // the count-up is over
    expect(stops).toEqual([0.12]);
    const pings = calls.filter((c) => c.events[0] === 'results-ping');
    expect(pings).toHaveLength(3); // EXP, AP and GIL
    screen.update(1);
    expect(calls.filter((c) => c.events[0] === 'results-ping')).toHaveLength(3); // once
    screen.exit();
    expect(stops).toEqual([0.12]);
    root.remove();
  });

  it('ends the loop when the screen is left early, with no stingers', () => {
    const { calls, stops } = spy();
    const { screen, root } = results('ffx2-leblanc', 'victory', false);
    screen.update(0.2);
    screen.exit();
    expect(stops).toEqual([0.12]);
    expect(calls.filter((c) => c.events[0] === 'results-ping')).toHaveLength(0);
    root.remove();
  });

  it('plays nothing for a defeat, a silent card, or an FFX chapter', () => {
    for (const [chapter, outcome, silent] of [['ffx2-leblanc', 'defeat', false], ['ffx2-leblanc', 'victory', true], ['seymour-flux', 'victory', false]] as const) {
      const { calls } = spy();
      const { screen, root } = results(chapter, outcome, silent);
      screen.update(2);
      screen.exit();
      expect(calls, `${chapter} ${outcome} ${silent}`).toEqual([]);
      root.remove();
      vi.restoreAllMocks();
    }
  });
});

// ---------------------------------------------------------------- the encounter opening

describe('the encounter opening (FFX: the field shatters into the fight)', () => {
  // BattleScreen needs a stage, a scene and a presenter to stand up, so the wiring is checked in its source: the opening is
  // started with the battle card and ended with the screen, and the flow table is what decides which game hears it.
  const source = battleScreenSource();

  it('starts the encounter-open slots in enter(), before the card, and stops them in exit()', () => {
    const start = source.indexOf("startFlow(audio, chapter.game, 'encounter-open')");
    const card = source.indexOf('void this.showBattleStart().then(');
    expect(start).toBeGreaterThan(0);
    expect(start).toBeLessThan(card);
    expect(source).toMatch(/this\.encounterSfx\.stop\(0\.25\);\s*this\.encounterSfx = NO_FLOW;/);
  });

  it('plays for FFX only: no slot answers FFX-2 or FF7 at that hook', () => {
    expect(flowSlotsFor('ffx', 'encounter-open')).toHaveLength(2);
    expect(flowSlotsFor('ffx2', 'encounter-open')).toHaveLength(0);
    expect(flowSlotsFor('ff7', 'encounter-open')).toHaveLength(0);
  });
});
