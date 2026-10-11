// @vitest-environment jsdom
/**
 * Bailey, 2026-10-10: "i'm playing the leblanc chapter and ... it also sounds like 2 different sound tracks are playing at once?"
 *
 * The music half of that report, pinned: walk Chapter VI and the hidden experimental Leblanc (which plays Chapter VI's cues by reference)
 * through the cue sequence the game really asks for, derived from the chapter data and its scripts rather than typed here, against the real
 * `AudioManager` and a recording context: chapter select, the pre-scene's two beds, the three acts (one theme, requested at each seam), the
 * pause and its return, the victory cue, the post-scene's hush, and the board again. At every moment: at most one track once a crossfade has
 * run, at most two during one, never three. Measured live (headless, a running context, 1600x900 and 390x844, keys and taps): the same.
 *
 * Game case: FFX-2 only for these chapters; the slot itself is shared plumbing (CHK-020), see `audio-music-slot.test.ts`.
 */
import { describe, expect, it } from 'vitest';

import { AudioManager, fadeMsToSec } from '../../src/audio/AudioManager.ts';
import { getChapter, type Chapter } from '../../src/data/encounters.ts';
import { cueForGroup } from '../../src/app/screens/BattleEncounterChain.ts';
import { findEnemyGroup } from '../../src/app/screens/BattleScreenSetup.ts';
import { setPauseMusic } from '../../src/ui/common/pauseMusic.ts';
import type { MusicStep, Step } from '../../src/story/dsl.ts';

interface Src { name: string; startAt: number | null; stopAt: number | null }

function harness() {
  const clock = { now: 10 };
  const sources: Src[] = [];
  class FakeParam {
    value = 1;
    setValueAtTime(): void {}
    exponentialRampToValueAtTime(): void {}
    linearRampToValueAtTime(): void {}
    cancelScheduledValues(): void {}
  }
  class FakeNode { connect(): void {} disconnect(): void {} }
  const ctx = {
    state: 'running',
    sampleRate: 48000,
    get currentTime(): number { return clock.now; },
    destination: new FakeNode(),
    resume: (): Promise<void> => Promise.resolve(),
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBufferSource: () => {
      const rec: Src = { name: '', startAt: null, stopAt: null };
      sources.push(rec);
      return Object.assign(new FakeNode(), {
        buffer: null as unknown, loop: false, loopStart: 0, loopEnd: 0, onended: null as unknown,
        start: (at: number) => { rec.startAt = at; },
        stop: (at = clock.now) => { rec.stopAt = rec.stopAt === null ? at : Math.min(rec.stopAt, at); },
      });
    },
  };
  const am = new AudioManager({ useWorker: false, synthOnly: true });
  const raw = am as unknown as Record<string, unknown> & { loader: Record<string, unknown> };
  raw['ctx'] = ctx;
  raw['musicBus'] = ctx.createGain();
  raw['loadManifest'] = async () => {};
  raw.loader['evict'] = () => {};
  raw.loader['load'] = async () => ({ buffer: {}, loopStart: 0, loopEnd: 1 });
  const play = async (name: string, fade: number): Promise<void> => {
    const before = sources.length;
    await am.playMusic(name, { fade });
    if (sources.length > before) sources[sources.length - 1]!.name = name;
  };
  const liveAt = (t: number): string[] =>
    sources.filter((s) => s.startAt !== null && s.startAt <= t && (s.stopAt === null || s.stopAt > t)).map((s) => s.name);
  return { am, clock, sources, play, liveAt };
}

const musicSteps = (script: readonly Step[] | undefined): MusicStep[] => (script ?? []).filter((s): s is MusicStep => s.type === 'music');

/** What the game asks of the mixer for this chapter, in order: [cue or null (stop), fade seconds, label]. */
async function cueTimeline(chapter: Chapter): Promise<Array<[string | null, number, string]>> {
  const out: Array<[string | null, number, string]> = [['chapter-select', 1.2, 'board']];
  for (const s of musicSteps(chapter.scriptsRef?.pre)) out.push([s.track, fadeMsToSec(s.fade, s.track ? 1200 : 800), 'pre-scene']);
  let group = chapter.enemyGroupRef;
  for (let link = 1; ; link++) {
    const cue = cueForGroup(chapter, group, link === 1 ? 'first' : 'next');
    if (cue.track) out.push([cue.track, fadeMsToSec(cue.fadeMs, 1200), `act ${link}`]);
    if (!group.nextGroupId) break;
    const next = await findEnemyGroup(group.nextGroupId);
    if (!next) break;
    group = next;
  }
  out.push([null, 0.6, 'battle exit']); // BattleScreen.exit: audio.stopMusic(0.6)
  if (chapter.music.victory) out.push([chapter.music.victory, 0.4, 'results']);
  for (const s of musicSteps(chapter.scriptsRef?.post)) out.push([s.track, fadeMsToSec(s.fade, s.track ? 1200 : 800), 'post-scene']);
  out.push(['chapter-select', 1.2, 'board']);
  return out;
}

describe.each(['ffx2-leblanc', 'exp-leblanc'])('%s: one music track at a time across the whole chapter', (id) => {
  const chapter = getChapter(id)!;

  it.each([
    ['unhurried (each cue settles before the next)', 20],
    ['hurried (a skip: the next cue arrives 0.4 s later, mid-crossfade)', 0.4],
  ])('%s', async (_label, gap) => {
    const h = harness();
    const timeline = await cueTimeline(chapter);
    expect(timeline.length, 'the chapter asks for music').toBeGreaterThan(5);
    const checks: Array<{ at: number; max: number; label: string }> = [];
    for (const [cue, fade, label] of timeline) {
      const at = h.clock.now;
      if (cue) await h.play(cue, fade);
      else h.am.stopMusic(fade);
      // Inside the crossfade two may sound; the third is cut at once.
      for (const dt of [0.1, fade * 0.5, fade]) checks.push({ at: at + dt, max: 2, label: `${label} +${dt.toFixed(2)}` });
      h.clock.now += gap;
      if (gap >= 5) checks.push({ at: h.clock.now - 0.5, max: 1, label: `${label} settled` });
      // The pause round trip mid-battle (BattleScreen `onPause`): the pause cue in, the battle theme back.
      if (label === 'act 2') {
        setPauseMusic(h.am, true);
        h.clock.now += gap;
        setPauseMusic(h.am, false);
        h.clock.now += gap;
        checks.push({ at: h.clock.now - 0.1, max: 2, label: 'pause round trip' });
      }
    }
    for (const c of checks) expect(h.liveAt(c.at).length, `${c.label} @${c.at.toFixed(2)}: ${h.liveAt(c.at).join(' + ')}`).toBeLessThanOrEqual(c.max);
    // Three at one instant never happens, anywhere on the timeline.
    for (let t = 10; t < h.clock.now + 5; t += 0.05) expect(h.liveAt(t).length, `t=${t.toFixed(2)}: ${h.liveAt(t).join(' + ')}`).toBeLessThanOrEqual(2);
  });

  it('the three acts ask for the one theme: Acts II and III start no new source', async () => {
    const h = harness();
    const acts = (await cueTimeline(chapter)).filter((c) => c[2].startsWith('act '));
    expect(acts.length).toBe(3);
    expect(new Set(acts.map((a) => a[0])).size, 'one battle theme across the chain').toBe(1);
    for (const [cue, fade] of acts) { await h.play(cue!, fade); h.clock.now += 30; }
    expect(h.sources.length, 'a request for the cue already playing is a no-op').toBe(1);
  });
});
