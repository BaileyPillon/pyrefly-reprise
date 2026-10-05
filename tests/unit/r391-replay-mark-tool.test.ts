/**
 * Release 39.1, N1: `tools/replay-mark.mjs` replays a marked moment. The browser part is proved by the real run (docs/handoff/r391-smaller.md); this pins the
 * pure pacing and parsing, and that the tool refuses what is not a mark.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isDue, keyForPlaywright, orderedInputs, parseArgs, windowFromSize } from '../../tools/replay-mark.mjs';
import { MARK_KEY_CODE } from '../../src/app/markMoment.ts';

const ROOT = join(__dirname, '..', '..');

describe('the arguments', () => {
  it('reads --name=value, --flag and the first plain argument as the input', () => {
    const a = parseArgs(['PM1.abc', '--url=http://127.0.0.1:5173/', '--reduce-motion', '--size=1600x900', 'ignored']);
    expect(a.input).toBe('PM1.abc');
    expect(a.flags).toEqual({ url: 'http://127.0.0.1:5173/', 'reduce-motion': true, size: '1600x900' });
    expect(parseArgs(['--help']).input).toBeNull();
  });

  it('reads a window size, and nothing else', () => {
    expect(windowFromSize('2560x1080')).toEqual([2560, 1080]);
    expect(windowFromSize(' 390x844 ')).toEqual([390, 844]);
    for (const bad of ['', undefined, '1600', '1600*900', 'axb', '9x9']) expect(windowFromSize(bad)).toBeNull();
  });
});

describe('the pacing: an input waits for its time and for the engine to have played what the player had seen', () => {
  it('is due when the clock has reached it (a few ms early is fine) and the engine has at least its event count', () => {
    const want = { t: 5000, s: 12 };
    expect(isDue(want, { elapsed: 5000, seq: 12 })).toBe(true);
    expect(isDue(want, { elapsed: 4990, seq: 12 })).toBe(true); // inside the slack
    expect(isDue(want, { elapsed: 4900, seq: 12 })).toBe(false); // too early
    expect(isDue(want, { elapsed: 9000, seq: 11 })).toBe(false); // the fight has not caught up: a slower machine waits
    expect(isDue(want, { elapsed: 9000, seq: 40 })).toBe(true); // ahead of the record is fine
    expect(isDue({ t: 100, s: 0 }, { elapsed: 0, seq: 0 }, 150)).toBe(true);
    // an input made with a command menu waiting is sent once the menu is up again, however late the machine; one made with none is not held for it
    expect(isDue({ t: 5000, s: 12, m: 1 }, { elapsed: 9000, seq: 40, menu: false })).toBe(false);
    expect(isDue({ t: 5000, s: 12, m: 1 }, { elapsed: 9000, seq: 40, menu: true })).toBe(true);
    expect(isDue({ t: 5000, s: 12 }, { elapsed: 9000, seq: 40, menu: false })).toBe(true);
    expect(isDue({ t: 5000, s: 12, m: 1 }, { elapsed: 4900, seq: 40, menu: true })).toBe(false); // the time still counts
  });

  it('keeps the inputs in the order they were made, and the keys by their own names', () => {
    const inputs = [
      { k: 'kd', c: 'Enter', t: 300, s: 0 },
      { k: 'ku', c: 'Enter', t: 300, s: 0 },
      { k: 'kd', c: 'ArrowDown', t: 100, s: 0 },
    ] as const;
    expect(orderedInputs({ inputs: [...inputs] }).map((i) => `${i.k}:${'c' in i ? i.c : ''}`)).toEqual(['kd:ArrowDown', 'kd:Enter', 'ku:Enter']);
    expect(keyForPlaywright('KeyW')).toBe('KeyW');
    expect(MARK_KEY_CODE).toBe('Backquote');
  });
});

describe('the command line', () => {
  const run = (...args: string[]) => spawnSync(process.execPath, [join(ROOT, 'tools', 'replay-mark.mjs'), ...args], { encoding: 'utf8', timeout: 60000 });

  it('refuses what is not a mark, without starting a browser', () => {
    const r = run('this is not a mark');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/not a mark/);
  });

  it('prints its usage with no input', () => {
    const r = run();
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/usage: node tools\/replay-mark\.mjs/);
  });
});
