/**
 * PR-0214 (round 13, R13G-03): resuming a scoreless scene (Chapter I's
 * pre-scene is "Wind only", `music(null)`) left the `pause` cue playing at
 * full gain until the script's next cue. The remembered cue there is `null`,
 * and "nothing was playing" has to come back as silence.
 *
 * Game case: both (shared audio plumbing; the cutscene and battle screens of
 * both games call `setPauseMusic`).
 */
import { describe, expect, it } from 'vitest';

import { PAUSE_CUE, setPauseMusic, type PauseMusicPort } from '../../src/ui/common/pauseMusic.ts';

function fakeAudio(playing: string | null): PauseMusicPort & { log: string[] } {
  const port = {
    currentMusic: playing,
    log: [] as string[],
    playMusic(name: string) {
      port.log.push(`play:${name}`);
      port.currentMusic = name;
      return Promise.resolve();
    },
    stopMusic() {
      port.log.push('stop');
      port.currentMusic = null;
    },
  };
  return port;
}

describe('PR-0214: the pause cue gives way to what was there before, silence included', () => {
  it('a silent scene: pause, resume, and the music stops (current = null)', () => {
    const audio = fakeAudio(null);
    setPauseMusic(audio, true);
    expect(audio.currentMusic).toBe(PAUSE_CUE);
    setPauseMusic(audio, false);
    expect(audio.log).toEqual([`play:${PAUSE_CUE}`, 'stop']);
    expect(audio.currentMusic).toBeNull();
  });

  it('a battle or the Ch V pre-scene still gets its own cue back', () => {
    for (const cue of ['boss-seymour', 'scene-bevelle-underground']) {
      const audio = fakeAudio(cue);
      setPauseMusic(audio, true);
      setPauseMusic(audio, false);
      expect(audio.log).toEqual([`play:${PAUSE_CUE}`, `play:${cue}`]);
      expect(audio.currentMusic).toBe(cue);
    }
  });

  it('a resume with no pause before it touches nothing', () => {
    const audio = fakeAudio('boss-jecht');
    setPauseMusic(audio, false);
    expect(audio.log).toEqual([]);
    expect(audio.currentMusic).toBe('boss-jecht');
  });

  it('resuming twice stops only once', () => {
    const audio = fakeAudio(null);
    setPauseMusic(audio, true);
    setPauseMusic(audio, false);
    setPauseMusic(audio, false);
    expect(audio.log).toEqual([`play:${PAUSE_CUE}`, 'stop']);
  });
});
