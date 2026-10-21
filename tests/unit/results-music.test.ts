// @vitest-environment jsdom
/**
 * The music of the results screen (music batch 2, 2026-10-12; `src/app/screens/resultsMusic.ts`, wired in `BattleScreenFlow.showResults`).
 *
 * Bailey, 2026-10-10 23:05 EDT: "i'll go with all your recommendations even as to music and sound effects. you recommend an dchoose it please."; 2026-10-12: "I'll go with all of your
 * recommendations" (driver items 53d, 58e, 58f). This pins, for both games and for every chapter the engine knows: which cue a win and a loss play, that a withdrawal plays none, that
 * Chapter IV plays its own quiet cue under a screen that stays silent in every other way, that the victory cues are an intro plus a loop (the manifest's loop points are the body, not the
 * intro), that a defeat cue is a one-shot, that the loss's cue is asked for only after the battle screen has gone and ends when the player chooses (so it never plays over a RETRY), and
 * that the chapter run warms the loss's cue with the others. The sting rule ("only the last link stings") is `presenter-victory-seam.test.ts`'s; here only the last link reaches this screen.
 *
 * Game case: both, each game with its own cue: FFX `victory-ffx` / `defeat-ffx`, FFX-2 `victory-ffx2` / `defeat-ffx2`, and `victory-bahamut` for Chapter IV (FFX-2 only).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { chapterWarmCues } from '../../src/app/chapterMusicWarm.ts';
import { DEFEAT_CUES, DEFEAT_FADE_S, DEFEAT_OUT_S, VICTORY_FADE_S, resultsCueFor, resultsScreenSilent, startResultsMusic, type ResultsMusicPort } from '../../src/app/screens/resultsMusic.ts';
import { clampLoopPoints, parseManifest } from '../../src/audio/manifest.ts';
import { hasTrack } from '../../src/audio/tracks/index.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS, type Chapter } from '../../src/data/encounters.ts';

const REPO = join(__dirname, '..', '..'); // jsdom: import.meta.url is not a file URL here
const manifest = parseManifest(JSON.parse(readFileSync(join(REPO, 'public/audio/manifest.json'), 'utf8')));
const raw = JSON.parse(readFileSync(join(REPO, 'public/audio/manifest.json'), 'utf8')) as { music: Record<string, { oneShot?: boolean }> };
const everyChapter = (): Chapter[] => [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS];
const chapter = (id: string): Chapter => everyChapter().find((c) => c.id === id)!;

/** A fake mixer: records what is asked, tracks the cue it is heading for, and lets a test finish a pending request late. */
class FakeAudio implements ResultsMusicPort {
  requestedMusic: string | null = null;
  readonly calls: string[] = [];
  /** A request that has been made and not yet "decoded". */
  private pending: { name: string; start: () => void } | null = null;
  playing: string | null = null;

  playMusic(name: string, options?: { fade?: number }): Promise<void> {
    this.calls.push(`play ${name} fade ${options?.fade}`);
    this.requestedMusic = name;
    const id = ++this.request;
    return new Promise<void>((resolve) => {
      this.pending = {
        name,
        start: () => {
          // `AudioManager.playMusic`: a request that was superseded or cancelled while it decoded is dropped.
          if (id === this.request) this.playing = name;
          resolve();
        },
      };
    });
  }

  stopMusic(fade?: number): void {
    this.calls.push(`stop fade ${fade}`);
    this.request++; // a pending request is dropped, as `AudioManager.stopMusic` bumps the request id
    this.requestedMusic = null;
    this.playing = null;
  }

  /** The pending request finishes decoding (late, if a stop or a newer request came first). */
  finishDecoding(): void {
    this.pending?.start();
    this.pending = null;
  }

  private request = 0;
}

describe('which cue the results screen plays (resultsCueFor)', () => {
  it('plays the chapter\'s own victory cue on a win: the fanfare of its game, and (release 61) Chapter IV\'s quieter `pause` in place of its quiet resolve `victory-bahamut` (r61-quiet-results.test.ts)', () => {
    for (const c of everyChapter()) {
      const cue = resultsCueFor(c, 'victory');
      if (c.game === 'ff7') {
        expect(cue, c.id).toBeNull();
        continue;
      }
      expect(cue?.cue, c.id).toBe(c.id === 'ffx2-bahamut' ? 'pause' : c.game === 'ffx' ? 'victory-ffx' : 'victory-ffx2');
      expect(cue?.kind).toBe('victory');
      expect(cue?.fade).toBe(VICTORY_FADE_S);
    }
  });

  it('plays one defeat cue per game on a loss, and none for FF7 (it has its own windows)', () => {
    for (const c of everyChapter()) {
      const cue = resultsCueFor(c, 'defeat');
      if (c.game === 'ff7') expect(cue, c.id).toBeNull();
      else {
        expect(cue?.cue, c.id).toBe(c.game === 'ffx' ? DEFEAT_CUES.ffx : DEFEAT_CUES.ffx2);
        expect(cue?.kind).toBe('defeat');
        expect(cue?.fade).toBe(DEFEAT_FADE_S);
      }
    }
    expect(DEFEAT_CUES).toEqual({ ffx: 'defeat-ffx', ffx2: 'defeat-ffx2' });
  });

  it('never crosses the games: an FFX chapter never gets an FFX-2 cue and the other way round (rule 14)', () => {
    for (const c of everyChapter().filter((x) => x.game !== 'ff7')) {
      for (const outcome of ['victory', 'defeat']) {
        const cue = resultsCueFor(c, outcome)?.cue ?? '';
        if (c.game === 'ffx') expect(cue, `${c.id} ${outcome}`).toMatch(/-ffx$/);
        else expect(cue, `${c.id} ${outcome}`).toMatch(/-ffx2$|^pause$/); // `pause` is Chapter IV's quiet results cue (release 61), a cue both games share
      }
    }
  });

  it('plays nothing on a withdrawal (the FFX stalemate is not a defeat) or on an outcome it does not know', () => {
    for (const c of everyChapter()) {
      expect(resultsCueFor(c, 'escape'), c.id).toBeNull();
      expect(resultsCueFor(c, 'aborted'), c.id).toBeNull();
    }
  });

  it('keeps the Chapter IV results screen silent whatever it plays, and no other listed chapter\'s', () => {
    expect(resultsScreenSilent(chapter('ffx2-bahamut'))).toBe(true);
    expect(resultsCueFor(chapter('ffx2-bahamut'), 'victory')?.cue).toBe('pause');
    expect(CHAPTERS.filter((c) => resultsScreenSilent(c)).map((c) => c.id)).toEqual(['ffx2-bahamut']);
    expect(resultsScreenSilent(chapter('ff7-guard-scorpion'))).toBe(true); // no victory cue at all
    expect(resultsScreenSilent({ ...chapter('ffx2-bahamut'), music: { scene: null, battle: null } } as Chapter)).toBe(true);
  });

  it('asks only for cues the game can play and the manifest ships', () => {
    for (const c of everyChapter()) {
      for (const outcome of ['victory', 'defeat']) {
        const cue = resultsCueFor(c, outcome)?.cue;
        if (!cue) continue;
        expect(hasTrack(cue), cue).toBe(true);
        expect(manifest.music[cue], `${cue} has no pre-render`).toBeDefined();
      }
    }
  });
});

describe('the files: an intro plus a loop for a win, a one-shot for a loss', () => {
  it.each(['victory-ffx', 'victory-ffx2', 'victory-bahamut'])('%s opens with 6 to 9 s of fanfare (or resolve) and loops a results body of 20 to 40 s', (cue) => {
    const entry = manifest.music[cue]!;
    expect(entry.loopStart, `${cue} intro`).toBeGreaterThanOrEqual(6);
    expect(entry.loopStart, `${cue} intro`).toBeLessThanOrEqual(9);
    expect(entry.loopEnd - entry.loopStart, `${cue} body`).toBeGreaterThanOrEqual(20);
    expect(entry.loopEnd - entry.loopStart, `${cue} body`).toBeLessThanOrEqual(40);
    expect(raw.music[cue]!.oneShot, `${cue} is not a one-shot`).toBeUndefined();
    // The player always loops from the end back to the start: with the decoder's real length the points stay where the manifest put them, so the fanfare plays once and the body repeats.
    const decoded = entry.duration - 0.02; // an MP3 decode is a frame or so off
    expect(clampLoopPoints(entry, decoded)).toEqual({ loopStart: entry.loopStart, loopEnd: entry.loopEnd });
  });

  it.each(['defeat-ffx', 'defeat-ffx2'])('%s plays once: its loop is the 2 s of held silence after the cue', (cue) => {
    const entry = manifest.music[cue]!;
    expect(raw.music[cue]!.oneShot).toBe(true);
    expect(entry.loopEnd).toBe(entry.duration);
    expect(entry.loopEnd - entry.loopStart).toBeGreaterThanOrEqual(1.9);
    expect(entry.loopEnd - entry.loopStart).toBeLessThanOrEqual(2.1);
    expect(entry.loopStart, `${cue} is a cue of 6 to 8 s`).toBeGreaterThanOrEqual(6);
    expect(entry.loopStart).toBeLessThanOrEqual(8);
    const decoded = entry.duration; // the buffer's exact length, then a frame short of it
    for (const length of [decoded, decoded - 0.03, decoded + 0.03]) {
      const points = clampLoopPoints(entry, length);
      expect(points.loopStart, `${cue} loops the silence, not the cue`).toBeGreaterThanOrEqual(entry.loopStart - 0.001);
    }
  });
});

describe('the loss\'s cue and a RETRY (startResultsMusic)', () => {
  const defeat = (id: string) => resultsCueFor(chapter(id), 'defeat');

  it('asks the mixer for the cue with its short fade, FFX and FFX-2 each with its own', () => {
    for (const [id, cue] of [['seymour-flux', 'defeat-ffx'], ['ffx2-trema', 'defeat-ffx2'], ['sinspawn-gui', 'defeat-ffx'], ['exp-leblanc', 'defeat-ffx2']] as const) {
      const audio = new FakeAudio();
      startResultsMusic(audio, defeat(id));
      expect(audio.calls, id).toEqual([`play ${cue} fade ${DEFEAT_FADE_S}`]);
    }
  });

  it('takes the cue out when the player chooses while it is still sounding', () => {
    const audio = new FakeAudio();
    const handle = startResultsMusic(audio, defeat('yunalesca'));
    audio.finishDecoding();
    expect(audio.playing).toBe('defeat-ffx');
    handle.end(); // RETRY
    expect(audio.calls).toEqual([`play defeat-ffx fade ${DEFEAT_FADE_S}`, `stop fade ${DEFEAT_OUT_S}`]);
    expect(audio.playing).toBeNull();
  });

  it('never lets a cue that is still loading start over a RETRY already in motion', () => {
    const audio = new FakeAudio();
    const handle = startResultsMusic(audio, defeat('ffx2-leblanc'));
    handle.end(); // the player chose before the file came back
    audio.finishDecoding(); // ... and it arrives late
    expect(audio.playing, 'the late cue must not start').toBeNull();
    expect(audio.calls).toEqual([`play defeat-ffx2 fade ${DEFEAT_FADE_S}`, `stop fade ${DEFEAT_OUT_S}`]);
  });

  it('leaves alone whatever has been asked for since (the next fight\'s theme is not ours to stop)', () => {
    const audio = new FakeAudio();
    const handle = startResultsMusic(audio, defeat('seymour-natus'));
    audio.finishDecoding();
    void audio.playMusic('boss-seymour-natus', { fade: 1.2 }); // the retry's fight has started its theme
    handle.end();
    expect(audio.calls.filter((c) => c.startsWith('stop'))).toEqual([]);
    expect(audio.requestedMusic).toBe('boss-seymour-natus');
  });

  it('ends once: a second end() asks for nothing more', () => {
    const audio = new FakeAudio();
    const handle = startResultsMusic(audio, defeat('ffx2-ixion-djose'));
    handle.end();
    handle.end();
    expect(audio.calls.filter((c) => c.startsWith('stop'))).toHaveLength(1);
  });

  it('leaves a win\'s cue to the scene that follows, as it always was (end() stops nothing)', () => {
    const audio = new FakeAudio();
    const handle = startResultsMusic(audio, resultsCueFor(chapter('braskas-final-aeon'), 'victory'));
    audio.finishDecoding();
    handle.end();
    expect(audio.calls).toEqual([`play victory-ffx fade ${VICTORY_FADE_S}`]);
    expect(audio.playing).toBe('victory-ffx');
  });

  it('asks for nothing and stops nothing when there is no cue, and never throws when the mixer does', () => {
    const audio = new FakeAudio();
    startResultsMusic(audio, null).end();
    expect(audio.calls).toEqual([]);
    const broken: ResultsMusicPort = {
      requestedMusic: 'defeat-ffx',
      playMusic: () => {
        throw new Error('no audio context');
      },
      stopMusic: () => {
        throw new Error('no audio context');
      },
    };
    expect(() => startResultsMusic(broken, defeat('yunalesca')).end()).not.toThrow();
    const stopOnly: ResultsMusicPort = { requestedMusic: 'defeat-ffx', playMusic: () => Promise.resolve(), stopMusic: () => { throw new Error('x'); } };
    expect(() => startResultsMusic(stopOnly, defeat('yunalesca')).end()).not.toThrow();
  });
});

describe('the flow asks for these cues at the right moments (BattleScreenFlow.showResults)', () => {
  const source = readFileSync(join(REPO, 'src/app/screens/BattleScreenFlow.ts'), 'utf8').replace(/\r\n/g, '\n');
  const body = source.slice(source.indexOf('private async showResults('));

  it('starts a win\'s cue before the wipe, a loss\'s cue only after the results screen has replaced the battle screen, and ends it with the player\'s choice', () => {
    const win = body.indexOf("cue?.kind === 'victory' ? startResultsMusic(audio, cue)");
    const wipe = body.indexOf('await playResultsWipe(');
    const swap = body.indexOf('if (!(await swapped)) return choice;');
    const loss = body.indexOf("if (cue?.kind === 'defeat') music = startResultsMusic(audio, cue);");
    const done = body.indexOf('await screen.done;');
    const end = body.indexOf('music?.end();');
    expect(win).toBeGreaterThan(0);
    expect(win).toBeLessThan(wipe);
    expect(wipe).toBeLessThan(swap);
    expect(swap).toBeLessThan(loss); // the battle screen's exit (BattleScreen.exit stops the music) has run by then
    expect(loss).toBeLessThan(done);
    expect(done).toBeLessThan(end);
  });

  it('takes the screen\'s silence from the chapter, not from the absence of a cue', () => {
    expect(body).toContain('const silent = resultsScreenSilent(chapter);');
    expect(body).not.toContain('chapter.music.victory === undefined');
  });

  it('is the only place a victory or defeat cue is requested: the chain and the presenter never ask for one', () => {
    for (const file of ['src/app/screens/BattleEncounterChain.ts', 'src/engine/BattlePresenterBeats.ts', 'src/engine/BattlePresenter.ts']) {
      const text = readFileSync(join(REPO, file), 'utf8');
      expect(text, file).not.toMatch(/playMusic\(\s*['"`](victory|defeat)-/);
    }
  });
});

describe('the chapter run warms the loss\'s cue with the others (chapterWarmCues)', () => {
  it('lists the scene, the first fight\'s theme, the win\'s cue and last the loss\'s cue, of the chapter\'s own game only', () => {
    for (const c of CHAPTERS) {
      const cues = chapterWarmCues(c);
      expect(cues[cues.length - 1], c.id).toBe(c.game === 'ffx' ? 'defeat-ffx' : 'defeat-ffx2');
      expect(cues, c.id).toContain(resultsCueFor(c, 'victory')?.cue);
      const otherGame = c.game === 'ffx' ? /-ffx2$/ : /^(defeat|victory)-ffx$/;
      for (const cue of cues) expect(cue, `${c.id} warms another game's cue`).not.toMatch(otherGame);
    }
  });
});
