/**
 * What the real mixer answers a sound ask with, for a manifest, a game and a set of loaded packs: the REAL `AudioManager.playSfx`
 * (and so `SfxSprites.pick` / `pickEvent`, `voiceKey`, the first-bank fallback and the synth) on a stub `AudioContext`, with every
 * sprite and every pack of the manifest "decoded" as a marker buffer that carries its own id. Shared by the retired-cue pin
 * (`audio-sfx-retired-answers.test.ts`) and the levels pin; the same logic runs in `tools/audio/sfx-answers-audit.mjs`.
 * Game case: both (the game is a parameter).
 */

import { AudioManager } from '../../../src/audio/AudioManager.ts';
import { parseManifest, type AudioManifest } from '../../../src/audio/manifest.ts';
import { setSfxGame } from '../../../src/audio/sfxV2/voicing.ts';
import type { FightCue } from './sfxFight.ts';

export type AnswerGame = 'ffx' | 'ffx2';

/** Where the sound came from: a parity pack cue, a v2 sprite slice, the first bank's slice, or the synth. */
export type AnswerVia = 'parity' | 'v2' | 'sprite' | 'synth' | 'covered' | 'none';

export interface Answer {
  via: AnswerVia;
  /** The cue the mixer logged as played (`v2:name` for a v2 slice, the pack cue's name for a parity one, the first-bank name). */
  played: string | null;
  /** The marker id of the buffer that played: a pack name, `v1` (first bank), `v2` (the v2 sprite) or `synth`. */
  buffer: string | null;
  /** Offset and length of the slice inside that buffer's file, seconds. */
  offset: number | null;
  duration: number | null;
  /** The play-time trim of a v2 slice (the P1 mix), dB; 0 for everything else. */
  trimDb: number;
}

export function parseAudioManifest(json: unknown): AudioManifest {
  return parseManifest(json);
}

/** Ask the real mixer for `key` (with the options the presenter gave) and read what it played. Never throws. */
export function answer(manifest: AudioManifest, game: AnswerGame, active: readonly string[], cue: Pick<FightCue, 'key' | 'events' | 'coveredBy'>): Answer {
  const am = new AudioManager({ useWorker: false, synthOnly: true });
  const inner = am as unknown as Record<string, unknown> & { sprites: { v1: unknown; v2: unknown; packs: Map<string, unknown>; active: readonly string[]; log: { via: string; played: string; covered?: boolean; trimDb?: number }[] } };
  const played: { buffer: { id?: string } | null; offset?: number; duration?: number }[] = [];
  inner['ctx'] = {
    currentTime: 1,
    sampleRate: 44100,
    createBuffer: (_ch: number, len: number) => ({ id: 'synth', length: len, getChannelData: () => new Float32Array(len) }),
    createBufferSource: () => ({ buffer: null as { id?: string } | null, playbackRate: { value: 1 }, connect: () => undefined, disconnect: () => undefined, onended: null, start(this: { buffer: { id?: string } | null }, _when: number, offset?: number, duration?: number) { played.push({ buffer: this.buffer, offset, duration }); } }),
    createGain: () => ({ gain: { value: 1 }, connect: () => undefined, disconnect: () => undefined }),
    createStereoPanner: () => ({ pan: { value: 0 }, connect: () => undefined, disconnect: () => undefined }),
  };
  inner['sfxBus'] = {};
  inner['manifest'] = manifest;
  inner['manifestLoad'] = Promise.resolve();
  inner.sprites.v1 = { id: 'v1' };
  inner.sprites.v2 = { id: 'v2' };
  for (const name of Object.keys(manifest.sfxParity?.packs ?? {})) inner.sprites.packs.set(name, { id: name });
  inner.sprites.active = active;
  setSfxGame(game);
  try {
    am.playSfx(cue.key, { volume: 1, ...(cue.events ? { events: cue.events } : {}), ...(cue.coveredBy ? { coveredBy: cue.coveredBy } : {}) });
  } catch {
    return { via: 'none', played: null, buffer: null, offset: null, duration: null, trimDb: 0 };
  } finally {
    setSfxGame(null);
  }
  const rec = inner.sprites.log[inner.sprites.log.length - 1];
  const p = played[played.length - 1];
  if (!rec) return { via: 'none', played: null, buffer: null, offset: null, duration: null, trimDb: 0 };
  return {
    via: rec.covered ? 'covered' : (rec.via as AnswerVia),
    played: rec.played,
    buffer: p?.buffer?.id ?? null,
    offset: p?.offset ?? null,
    duration: p?.duration ?? null,
    trimDb: rec.trimDb ?? 0,
  };
}

/** True for an answer that is a recorded sound (a parity original or a v2 slice) rather than the first bank or the synth. */
export const isRecording = (a: Answer): boolean => a.via === 'parity' || a.via === 'v2';
