// @vitest-environment jsdom
/**
 * R63-PLAY, the overnight fix of the skeptic's m5 (sources that never ended; both games).
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOURCE_SLACK_MS, watchSourceEnd } from '../../src/audio/sfxSource.ts';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');
void src;
void vi;

// ------------------------------------------------------------------------------------------------ S: the sources that never ended


describe('S: a source whose context clock stopped is cut on the wall clock (the skeptic\'s m5)', () => {
  const rig = (state: 'running' | 'suspended') => {
    const ctx = { state } as { state: string };
    const calls: string[] = [];
    const source = { stop: vi.fn(() => void calls.push('stop')), disconnect: vi.fn() };
    const release = vi.fn(() => void calls.push('release'));
    return { ctx, calls, source, release };
  };

  it('a source that has not ended a second and a half after its cue is stopped and released', () => {
    vi.useFakeTimers();
    try {
      const r = rig('running');
      watchSourceEnd(r.ctx as never, r.source as never, r.release, 2.1);
      vi.advanceTimersByTime(2100 + SOURCE_SLACK_MS - 10);
      expect(r.calls).toEqual([]);
      vi.advanceTimersByTime(20);
      expect(r.calls).toEqual(['stop', 'release']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('a source that ends on time is never touched', () => {
    vi.useFakeTimers();
    try {
      const r = rig('running');
      const done = watchSourceEnd(r.ctx as never, r.source as never, r.release, 0.5);
      done(); // what \`onended\` does
      vi.advanceTimersByTime(60000);
      expect(r.calls).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('while the context is suspended (the pause) the cue is not cut; it is checked again, and cut once it runs and still has not ended', () => {
    vi.useFakeTimers();
    try {
      const r = rig('suspended');
      watchSourceEnd(r.ctx as never, r.source as never, r.release, 1, 0.2);
      vi.advanceTimersByTime(20000);
      expect(r.calls).toEqual([]);
      r.ctx.state = 'running';
      vi.advanceTimersByTime(SOURCE_SLACK_MS + 10);
      expect(r.calls).toEqual(['stop', 'release']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('the effects source and the voice run are wired to it', () => {
    expect(src('src/audio/sfxSource.ts')).toContain('watchSourceEnd(ctx, source, release, cueS, delay)');
    expect(src('src/audio/voice/VoiceRun.ts')).toContain('this.release(source, gain), (seconds + 0.005) * 1000 + 1500');
  });
});

