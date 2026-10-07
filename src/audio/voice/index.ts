/**
 * The game's one voice director, wired to the one mixer.
 *
 * `voice` is what screens import: the dialogue box gets it as its `VoicePort`, a chapter run begins and ends it
 * (`app/voiceChapter.ts`), the pause overlay pauses it, the options screen stops it when the switch goes off. The network and
 * decoder are the browser's `fetch` and the live context's `decodeAudioData`; a failure of either is a `null`, never a throw.
 *
 * A hidden tab pauses the voice (it would otherwise talk to nobody while the frame loop sleeps) and a visible one resumes it.
 */

import { audio } from '../AudioManager.ts';
import { resolveAudioUrl } from '../manifest.ts';
import { VoiceBank } from './VoiceBank.ts';
import { VoiceDirector } from './VoiceDirector.ts';

export { VoiceDirector, VOICE_DUCK_GAIN, VOICE_DUCK_ATTACK_S, VOICE_DUCK_RELEASE_S, VOICE_DUCK_HOLD_MS, scriptKeys } from './VoiceDirector.ts';
export type { VoiceHost, VoiceClock, PlayLog } from './VoiceDirector.ts';
export { VoiceBank, VOICE_CACHE_BYTES } from './VoiceBank.ts';
export { VoiceRun, MAX_LATE_MS, WATCHDOG_SLACK_MS } from './VoiceRun.ts';

const url = (path: string): string => resolveAudioUrl(audio.audioBaseUrl, path);

const bank = new VoiceBank<AudioBuffer>({
  async fetchJson(path) {
    try {
      const res = await fetch(url(path));
      return res.ok ? await res.json() : null;
    } catch {
      return null; // no file, or an HTML fallback page that is not JSON
    }
  },
  async fetchBytes(path) {
    try {
      const res = await fetch(url(path));
      return res.ok ? await res.arrayBuffer() : null;
    } catch {
      return null;
    }
  },
  async decode(bytes) {
    const ctx = audio.context;
    if (!ctx) return null;
    try {
      return await ctx.decodeAudioData(bytes);
    } catch {
      return null;
    }
  },
});

export const voice = new VoiceDirector(audio, bank, {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
});

audio.setVoiceDebug(() => voice.debug());

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => voice.setPaused(document.hidden, 'hidden'));
}
