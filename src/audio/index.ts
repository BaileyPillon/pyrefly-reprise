/**
 * Audio module barrel.
 *
 * `AudioManager` is the browser front end; everything else is platform-free
 * TypeScript that also runs in Node for offline WAV previews.
 */

export { AudioManager, audio } from './AudioManager.ts';
export type { AudioManagerOptions, PlayMusicOptions, PlaySfxOptions } from './AudioManager.ts';
export { MusicLoader } from './MusicLoader.ts';
export type { LoopedBuffer } from './MusicLoader.ts';
export { renderTrack, renderNotes } from './render.ts';
export type { RenderedTrack, RenderOptions } from './render.ts';
export { INSTRUMENTS, INSTRUMENT_NOTES, getInstrument, instrumentNames, hasInstrument } from './instruments.ts';
export { TRACKS, TRACK_BLURBS, getTrack, hasTrack, trackNames } from './tracks/index.ts';
export { SFX, SFX_ALIASES, getSfx, hasSfx, renderSfx, renderSfxBank, renderMontage, resolveSfx, sfxNames } from './sfx/index.ts';
export * from './score.ts';
