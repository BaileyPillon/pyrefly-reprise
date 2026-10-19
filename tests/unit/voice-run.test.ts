/**
 * One recorded line, driven by hand: the audio clock and the wall clock are numbers the test moves. Pins the rules the dialogue box
 * relies on: a spoken line is held until its voice is done, a voice failure is never a wait, and stopping fades and fires `onEnd`
 * exactly once. Game case: both (shared plumbing).
 */
import { describe, expect, it } from 'vitest';

import { MAX_LATE_MS, VoiceRun, WATCHDOG_SLACK_MS, type RunHooks } from '../../src/audio/voice/VoiceRun.ts';
import { VOICE_TAIL_MS } from '../../src/story/voice/voicePort.ts';

class FakeParam {
  value = 1;
  ramps: Array<[number, number]> = [];
  cancelScheduledValues(): void {}
  setValueAtTime(v: number): void { this.value = v; }
  linearRampToValueAtTime(v: number, t: number): void { this.ramps.push([v, t]); }
}
class FakeGain { gain = new FakeParam(); connected = true; connect(): void {} disconnect(): void { this.connected = false; } }
class FakeSource {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  starts: Array<{ when: number; offset: number }> = [];
  stops: number[] = [];
  disconnected = false;
  connect(): void {}
  disconnect(): void { this.disconnected = true; }
  start(when: number, offset: number): void { this.starts.push({ when, offset }); }
  stop(when: number): void { this.stops.push(when); }
  end(): void { this.onended?.(); }
}

function rig(durationMs = 2000) {
  const clock = { audio: 0, wall: 1000 };
  const sources: FakeSource[] = [];
  const gains: FakeGain[] = [];
  const ctx = {
    state: 'running',
    get currentTime() { return clock.audio; },
    createBufferSource() { const s = new FakeSource(); sources.push(s); return s; },
    createGain() { const g = new FakeGain(); gains.push(g); return g; },
  };
  const events: string[] = [];
  const hooks: RunHooks = { onStart: () => events.push('start'), onEnd: (_run, why) => events.push(`end:${why}`) };
  let deliver!: (b: { duration: number } | null) => void;
  const buffer = new Promise<{ duration: number } | null>((r) => (deliver = r));
  const run = new VoiceRun('seymour-flux.pre.003', durationMs, ctx as unknown as AudioContext, {} as AudioNode, buffer as unknown as Promise<AudioBuffer | null>, hooks, () => clock.wall);
  const flush = () => new Promise<void>((r) => setTimeout(r, 0));
  return { clock, sources, gains, ctx, events, run, deliver: (b: { duration: number } | null = { duration: durationMs / 1000 }) => { deliver(b); return flush(); } };
}

describe('starting', () => {
  it('holds the line for the whole recording while the file is on its way, then plays it', async () => {
    const t = rig(2000);
    expect(t.run.state).toBe('loading');
    expect(t.run.holdMs()).toBe(2000 + VOICE_TAIL_MS);
    await t.deliver();
    expect(t.run.state).toBe('playing');
    expect(t.run.heard).toBe(true);
    expect(t.sources[0]?.starts).toEqual([{ when: 0, offset: 0 }]);
    expect(t.events).toEqual(['start']);
  });

  it('counts the hold down with the audio clock: unplayed part plus the tail', async () => {
    const t = rig(2000);
    await t.deliver();
    expect(t.run.holdMs()).toBe(2000 + VOICE_TAIL_MS);
    t.clock.audio = 1.5;
    t.clock.wall += 1500;
    expect(t.run.holdMs()).toBeCloseTo(500 + VOICE_TAIL_MS, 5);
    t.clock.audio = 2.0;
    t.clock.wall += 500;
    expect(t.run.holdMs()).toBeCloseTo(VOICE_TAIL_MS, 5);
  });

  it('counts the tail from the recording\'s own end even before the source reports it (a busy main thread)', async () => {
    const t = rig(2000);
    await t.deliver();
    t.clock.audio = 2.0;
    expect(t.run.holdMs()).toBeCloseTo(VOICE_TAIL_MS, 5);
    t.clock.audio = 2.15;
    t.clock.wall += 2150;
    expect(t.run.holdMs()).toBeCloseTo(VOICE_TAIL_MS - 150, 5);
    t.clock.audio = 2.4;
    t.clock.wall += 250;
    expect(t.run.holdMs()).toBe(0);
  });

  it('is over, and stops holding, once the tail after the last syllable has passed', async () => {
    const t = rig(2000);
    await t.deliver();
    t.clock.audio = 2.0;
    t.sources[0]?.end();
    expect(t.run.state).toBe('ended');
    expect(t.events).toEqual(['start', 'end:ended']);
    expect(t.run.holdMs()).toBeCloseTo(VOICE_TAIL_MS, 5);
    t.clock.audio = 2.1;
    expect(t.run.holdMs()).toBeCloseTo(VOICE_TAIL_MS - 100, 5);
    t.clock.audio = 2.3;
    expect(t.run.holdMs()).toBe(0);
  });
});

describe('a voice failure is never a wait', () => {
  it('a file that never decodes ends as failed:missing and holds nothing', async () => {
    const t = rig();
    await t.deliver(null);
    expect(t.run.state).toBe('failed');
    expect(t.run.failReason).toBe('missing');
    expect(t.run.heard).toBe(false);
    expect(t.run.holdMs()).toBe(0);
    expect(t.events).toEqual(['end:failed:missing']);
  });

  it('a file that lands too late is dropped rather than started a second into the line', async () => {
    const t = rig();
    t.clock.wall += MAX_LATE_MS + 1;
    await t.deliver();
    expect(t.run.failReason).toBe('late');
    expect(t.sources).toHaveLength(0);
  });

  it('stops holding the moment the loading time runs out, even if nothing ever arrives', () => {
    const t = rig();
    expect(t.run.holdMs()).toBeGreaterThan(0);
    t.clock.wall += MAX_LATE_MS + 1;
    expect(t.run.holdMs()).toBe(0);
    expect(t.run.state).toBe('failed');
  });

  it('a context that is not running when the file arrives, or stops mid-line, fails the run', async () => {
    const asleep = rig();
    asleep.ctx.state = 'suspended';
    await asleep.deliver();
    expect(asleep.run.failReason).toBe('suspended');

    const t = rig();
    await t.deliver();
    t.ctx.state = 'suspended';
    expect(t.run.holdMs()).toBe(0);
    expect(t.run.state).toBe('failed');
    expect(t.events).toEqual(['start', 'end:failed:suspended']);
  });

  it('a stalled audio clock cannot hold a line forever (the wall-clock watchdog)', async () => {
    const t = rig(2000);
    await t.deliver();
    t.clock.wall += 2000 + WATCHDOG_SLACK_MS + 1; // the audio clock never moved
    expect(t.run.holdMs()).toBe(0);
    expect(t.run.failReason).toBe('stalled');
  });
});

describe('stopping', () => {
  it('fades out over the asked time, fires onEnd once, and holds nothing from then on', async () => {
    const t = rig();
    await t.deliver();
    t.clock.audio = 0.5;
    t.run.stop(60);
    expect(t.run.state).toBe('stopped');
    expect(t.gains[0]?.gain.ramps).toEqual([[0, 0.5 + 0.06]]);
    expect(t.sources[0]?.stops[0]).toBeCloseTo(0.565, 5);
    expect(t.run.holdMs()).toBe(0);
    t.run.stop(60); // twice is harmless
    t.sources[0]?.end(); // the faded source reports its end: no second onEnd
    expect(t.events).toEqual(['start', 'end:stopped']);
    expect(t.sources[0]?.disconnected).toBe(true);
  });

  it('a run stopped while its file is loading never starts when the file arrives', async () => {
    const t = rig();
    t.run.stop();
    expect(t.events).toEqual(['end:stopped']);
    await t.deliver();
    expect(t.sources).toHaveLength(0);
    expect(t.run.heard).toBe(false);
  });
});

describe('pausing', () => {
  it('freezes where it is, keeps the hold, and resumes from the same place on a fresh source', async () => {
    const t = rig(2000);
    await t.deliver();
    t.clock.audio = 0.8;
    t.run.pause();
    expect(t.run.state).toBe('paused');
    expect(t.run.holdMs()).toBeCloseTo(1200 + VOICE_TAIL_MS, 5);
    t.clock.audio = 5; // the menu stays open a long while: the line does not move
    expect(t.run.holdMs()).toBeCloseTo(1200 + VOICE_TAIL_MS, 5);
    t.run.resume();
    expect(t.run.state).toBe('playing');
    expect(t.sources).toHaveLength(2);
    expect(t.sources[1]?.starts[0]?.offset).toBeCloseTo(0.8, 5);
    expect(t.events).toEqual(['start', 'start']); // the music is ducked again on resume
    t.clock.audio = 5.5;
    expect(t.run.holdMs()).toBeCloseTo(700 + VOICE_TAIL_MS, 5);
  });

  it('paused while the file is still on its way: it does not start behind the menu, and starts when the menu closes', async () => {
    const t = rig(2000);
    t.run.pause();
    await t.deliver();
    expect(t.sources).toHaveLength(0);
    expect(t.run.state).toBe('paused');
    expect(t.run.heard).toBe(false);
    expect(t.run.holdMs()).toBe(2000 + VOICE_TAIL_MS); // still held for its voice, which has not been heard yet
    t.run.resume();
    expect(t.run.state).toBe('playing');
    expect(t.sources[0]?.starts).toEqual([{ when: 0, offset: 0 }]);
    expect(t.events).toEqual(['start']);
  });

  it('resumed before the file arrives: nothing was held back', async () => {
    const t = rig(2000);
    t.run.pause();
    t.run.resume();
    await t.deliver();
    expect(t.run.state).toBe('playing');
  });

  it('a late end from the paused source does not end the run', async () => {
    const t = rig(2000);
    await t.deliver();
    t.run.pause();
    t.sources[0]?.end();
    expect(t.run.state).toBe('paused');
    expect(t.events).toEqual(['start']);
  });
});
