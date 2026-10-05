// @vitest-environment jsdom
/**
 * Release 39.1, N1 (both games): the hidden "mark this moment" key. It records every input since the battle began, saves the record, copies a code and
 * writes one console line, and shows NOTHING on screen.
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MARK_CODE_PREFIX,
  MARK_HISTORY,
  MARK_KEY_CODE,
  MARK_MAX_INPUTS,
  MARK_STORAGE_KEY,
  decodeMark,
  encodeMark,
  fightEventCount,
  isMarkRecord,
  logHash,
  markLine,
  parseMarkInput,
  readMarks,
  sequenceHash,
  writeMark,
  type MarkRecord,
} from '../../src/app/markMoment.ts';
import { MarkRecorder, buildInfo, type MarkEnv, type MarkSource } from '../../src/app/markRecorder.ts';

const ROOT = join(__dirname, '..', '..');

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

function harness(over: Partial<MarkEnv> = {}, log: unknown[] = [], srcOver: Partial<MarkSource> = {}) {
  let clock = 1000;
  const storage = memoryStorage();
  const lines: string[] = [];
  const copied: string[] = [];
  const env: MarkEnv = {
    win: window,
    storage,
    copy: (t) => { copied.push(t); return Promise.resolve(); },
    info: (l) => void lines.push(l),
    now: () => clock,
    ...over,
  };
  const src: MarkSource = {
    chapter: 'seymour-flux',
    game: 'ffx',
    hurried: true,
    startedAt: 1000,
    seed: () => 1,
    log: () => log,
    party: () => ['tidus', 'yuna', 'kimahri'],
    phase: () => 'command:tidus',
    menu: () => false,
    settings: () => ({ textSize: 100, reduceMotion: true, musicVolume: 0.7 }),
    defaults: () => ({ textSize: 100, reduceMotion: false, musicVolume: 0.7 }),
    seenCoach: () => ['briefing'],
    ...srcOver,
  };
  const rec = new MarkRecorder(src, env);
  return { rec, storage, lines, copied, advance: (ms: number) => void (clock += ms), log };
}

const key = (type: 'keydown' | 'keyup', code: string, repeat = false) => window.dispatchEvent(new KeyboardEvent(type, { code, repeat, bubbles: true }));

describe('the record and its code', () => {
  const record: MarkRecord = {
    v: 1, chapter: 'ffx2-bahamut', game: 'ffx2', seed: 1007, sha: 'cfab29b4', bundle: 'index-DIf_suBq.js', win: [1600, 900], dpr: 1, hurried: false,
    party: ['yuna', 'rikku', 'paine'], settings: { reduceMotion: true }, seenCoach: ['briefing', 'menu'],
    at: { t: 31254, s: 212, h: 'deadbeef', hs: 'cafef00d', n: 180, phase: 'command:yuna', wall: '2026-10-05T20:00:00.000Z' },
    inputs: [
      { k: 'kd', c: 'Enter', t: 1800, s: 0 }, { k: 'ku', c: 'Enter', t: 1900, s: 0 }, { k: 'kd', c: 'ArrowDown', t: 9000, s: 14, m: 1 },
      { k: 'click', x: 811, y: 402, p: 1, t: 12000, s: 30, m: 1 }, { k: 'wheel', x: 100, y: 200, dx: 0, dy: -120, t: 12500, s: 30 }, { k: 'pad', b: 0, d: 1, t: 20000, s: 80, m: 1 },
    ],
  };

  it('round-trips through the code, with inputs, times and event counts intact', () => {
    const code = encodeMark(record);
    expect(code.startsWith(MARK_CODE_PREFIX)).toBe(true);
    expect(code).toMatch(/^PM1\.[A-Za-z0-9_-]+$/); // survives a paste: one token
    expect(decodeMark(code)).toEqual(record);
    expect(decodeMark(`  ${code}\n`)).toEqual(record);
  });

  it('keeps the truncation flag, and reads garbage as nothing (never throws)', () => {
    expect(decodeMark(encodeMark({ ...record, truncated: true }))?.truncated).toBe(true);
    for (const bad of ['', 'PM1.', 'PM1.@@@', 'PM2.abc', 'hello', `${MARK_CODE_PREFIX}${btoa('{"a":1}')}`]) expect(decodeMark(bad)).toBeNull();
    expect(isMarkRecord(null)).toBe(false);
    expect(isMarkRecord(record)).toBe(true);
  });

  it('stays short: a hundred inputs fit in a couple of kilobytes', () => {
    const many = { ...record, inputs: Array.from({ length: 100 }, (_, i) => ({ k: i % 2 ? 'ku' : 'kd', c: 'ArrowDown', t: 1000 + i * 410, s: i * 2 }) as MarkRecord['inputs'][number]) };
    expect(encodeMark(many).length).toBeLessThan(2000);
  });

  it('accepts what a person might hand the tool: a code, a record, a stored value, a localStorage export, Playwright storage state', () => {
    const stored = JSON.stringify({ marks: [{ ...record, chapter: 'older' }, record] });
    expect(parseMarkInput(encodeMark(record))).toEqual(record);
    expect(parseMarkInput(JSON.stringify(record))).toEqual(record);
    expect(parseMarkInput(stored)).toEqual(record); // the newest of the kept marks
    expect(parseMarkInput(JSON.stringify({ [MARK_STORAGE_KEY]: stored, other: 'x' }))).toEqual(record);
    expect(parseMarkInput(JSON.stringify({ cookies: [], origins: [{ origin: 'http://x', localStorage: [{ name: MARK_STORAGE_KEY, value: stored }] }] }))).toEqual(record);
    expect(parseMarkInput('not json')).toBeNull();
    expect(parseMarkInput('{}')).toBeNull();
  });

  it('hashes the engine log: the same events give the same hash, any change or reordering gives another, and only the first `upTo` count', () => {
    const log = [{ seq: 1, type: 'turn-start' }, { seq: 2, type: 'damage', amount: 41 }, { seq: 3, type: 'action-end' }];
    expect(logHash(log)).toBe(logHash(log.map((e) => ({ ...e }))));
    expect(logHash(log)).not.toBe(logHash([log[0]!, { seq: 2, type: 'damage', amount: 42 }, log[2]!]));
    expect(logHash(log)).not.toBe(logHash([log[1]!, log[0]!, log[2]!]));
    expect(logHash(log, 2)).toBe(logHash(log.slice(0, 2)));
    expect(logHash([])).toMatch(/^[0-9a-f]{8}$/);
  });

  it('hashes the same fight without its clock: ATB snapshots and the clock fields are left out, an action, target or number is not', () => {
    const at = (ms: number, ticks: number, left: number) => [
      { seq: 1, type: 'turn-start', actorId: 'paine', turn: 4, elapsedTicks: ticks },
      { seq: 2, type: 'atb', snapshot: { elapsedMs: ms, bars: [{ actorId: 'yuna', fill: ms / 10000 }] } },
      { seq: 3, type: 'status-add', targetId: 'yuna', instance: { id: 'shell', ticksRemaining: left } },
      { seq: 4, type: 'damage', targetId: 'bahamut', amount: 41 },
      { seq: 5, type: 'status-tick', actorId: 'yuna', remaining: left - 10 },
    ];
    const a = at(3989, 11969, 391358);
    const b = at(3963, 11891, 391901); // the same fight a few tens of ms apart
    expect(logHash(a)).not.toBe(logHash(b));
    expect(sequenceHash(a)).toBe(sequenceHash(b));
    // a different action in the same place is a different fight
    const c = at(3989, 11969, 391358);
    (c[3] as { amount: number }).amount = 42;
    expect(sequenceHash(c)).not.toBe(sequenceHash(a));
    const d = at(3989, 11969, 391358);
    (d[3] as { targetId: string }).targetId = 'yuna';
    expect(sequenceHash(d)).not.toBe(sequenceHash(a));
    // the first `count` events of the fight: the snapshot is not one, and a run with more of them (a slower clock) still has the same fight
    expect(sequenceHash(a, 2)).toBe(sequenceHash([a[0]!, a[2]!]));
    expect(sequenceHash([a[0]!, { type: 'atb', snapshot: {} }, { type: 'atb', snapshot: {} }, a[2]!, a[3]!], 2)).toBe(sequenceHash(a, 2));
    expect(fightEventCount(a)).toBe(4);
    expect(sequenceHash([])).toMatch(/^[0-9a-f]{8}$/);
  });

  it('keeps at most five marks, newest last, and survives a storage that refuses or holds junk', () => {
    const s = memoryStorage();
    for (let i = 0; i < MARK_HISTORY + 2; i++) writeMark(s, { ...record, seed: i });
    expect(readMarks(s).map((m) => m.seed)).toEqual([2, 3, 4, 5, 6]);
    s.data.set(MARK_STORAGE_KEY, '{oops');
    expect(readMarks(s)).toEqual([]);
    expect(writeMark(null, record)).toBe(false);
    expect(writeMark({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, record)).toBe(false);
  });
});

describe('the recorder', () => {
  it('records keys, pointer clicks, wheel turns and pad edges with the time since the battle began and the engine event count, and leaves the mark key out', () => {
    const log: unknown[] = [];
    const { rec, advance } = harness({}, log);
    rec.start();
    advance(800);
    key('keydown', 'Enter');
    advance(90);
    key('keyup', 'Enter');
    log.push({ seq: 1 }, { seq: 2 });
    advance(1400);
    key('keydown', 'ArrowDown');
    key('keydown', 'ArrowDown', true); // an auto-repeat is an input too
    key('keyup', 'ArrowDown');
    window.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch' }));
    window.dispatchEvent(new MouseEvent('click', { clientX: 320.4, clientY: 200.6, detail: 1 }));
    window.dispatchEvent(new MouseEvent('click', { clientX: 5, clientY: 5, detail: 0 })); // the click a key press makes: its key press is already there
    window.dispatchEvent(new WheelEvent('wheel', { clientX: 10, clientY: 20, deltaY: 120 }));
    key('keydown', MARK_KEY_CODE);
    key('keyup', MARK_KEY_CODE);
    rec.stop();
    expect(rec.inputs).toEqual([
      { k: 'kd', c: 'Enter', t: 800, s: 0 },
      { k: 'ku', c: 'Enter', t: 890, s: 0 },
      { k: 'kd', c: 'ArrowDown', t: 2290, s: 2 },
      { k: 'kd', c: 'ArrowDown', t: 2290, s: 2 },
      { k: 'ku', c: 'ArrowDown', t: 2290, s: 2 },
      { k: 'click', x: 320, y: 201, p: 1, t: 2290, s: 2 },
      { k: 'wheel', x: 10, y: 20, dx: 0, dy: 120, t: 2290, s: 2 },
    ]);
  });

  it('on the mark key: saves the record, copies its code, writes one console line, and returns', () => {
    const log = [{ seq: 1, type: 'turn-start' }, { seq: 2, type: 'action-start' }];
    const h = harness({}, log);
    h.rec.start();
    h.advance(5000);
    key('keydown', 'Enter');
    h.advance(2500);
    key('keydown', MARK_KEY_CODE);
    h.rec.stop();
    const saved = readMarks(h.storage);
    expect(saved).toHaveLength(1);
    const r = saved[0]!;
    expect(r).toMatchObject({ v: 1, chapter: 'seymour-flux', game: 'ffx', seed: 1, hurried: true, party: ['tidus', 'yuna', 'kimahri'], seenCoach: ['briefing'] });
    expect(r.at).toMatchObject({ t: 7500, s: 2, h: logHash(log), hs: sequenceHash(log), n: fightEventCount(log), phase: 'command:tidus' });
    expect(r.inputs).toEqual([{ k: 'kd', c: 'Enter', t: 5000, s: 2 }]);
    expect(r.win).toEqual([window.innerWidth, window.innerHeight]);
    expect(r.settings).toEqual({ reduceMotion: true }); // only what differs from the defaults
    expect(h.copied).toHaveLength(1);
    expect(decodeMark(h.copied[0]!)).toEqual(r);
    expect(h.lines).toHaveLength(1);
    expect(h.lines[0]).toBe(markLine(r, h.copied[0]!));
    expect(h.lines[0]).toContain('seymour-flux');
    expect(h.lines[0]).toContain(`code=${MARK_CODE_PREFIX}`);
  });

  it('marks an input made with a command menu waiting (m: 1) and none made without', () => {
    let menu = false;
    const h = harness({}, [], { menu: () => menu });
    h.rec.start();
    h.advance(1000);
    key('keydown', 'Enter'); // the opening: no menu yet
    menu = true;
    h.advance(1000);
    key('keydown', 'ArrowDown'); // the menu is up
    h.advance(1000);
    key('keydown', MARK_KEY_CODE);
    h.rec.stop();
    const r = readMarks(h.storage)[0]!;
    expect(r.inputs).toEqual([{ k: 'kd', c: 'Enter', t: 1000, s: 0 }, { k: 'kd', c: 'ArrowDown', t: 2000, s: 0, m: 1 }]);
    expect(decodeMark(h.copied[0]!)).toEqual(r);
  });

  it('keeps the profile as the battle began: a coach card seen or a setting changed during the fight is for the replay to do again, by its inputs', () => {
    const seen = ['briefing'];
    const settings: Record<string, unknown> = { textSize: 100, reduceMotion: false, musicVolume: 0.7 };
    const h = harness({}, [], { seenCoach: () => [...seen], settings: () => ({ ...settings }) });
    h.rec.start();
    h.advance(3000);
    seen.push('firstrun-battle'); // the coach card shown in the fight
    settings['reduceMotion'] = true; // turned on in the pause menu
    h.advance(3000);
    key('keydown', MARK_KEY_CODE);
    h.rec.stop();
    const r = readMarks(h.storage)[0]!;
    expect(r.seenCoach).toEqual(['briefing']);
    expect(r.settings).toEqual({});
  });

  it('shows nothing: not a node added to the page, not an attribute or a class changed, on the mark or on any input', () => {
    const before = document.documentElement.outerHTML;
    const h = harness();
    h.rec.start();
    key('keydown', 'Enter');
    key('keydown', MARK_KEY_CODE);
    key('keyup', MARK_KEY_CODE);
    h.rec.stop();
    expect(document.documentElement.outerHTML).toBe(before);
    const src = readFileSync(join(ROOT, 'src/app/markRecorder.ts'), 'utf8');
    expect(src).not.toMatch(/createElement|appendChild|innerHTML|\.style\.|classList|textContent|alert\(|prompt\(/);
  });

  it('skips the copy silently when the clipboard refuses or throws, and still saves and logs', async () => {
    for (const copy of [() => Promise.reject(new Error('denied')), () => { throw new Error('no gesture'); }, null]) {
      const h = harness({ copy });
      h.rec.start();
      key('keydown', MARK_KEY_CODE);
      h.rec.stop();
      await Promise.resolve();
      expect(readMarks(h.storage)).toHaveLength(1);
      expect(h.lines).toHaveLength(1);
    }
  });

  it('ignores an auto-repeat of the mark key (one press, one mark) and does nothing once stopped', () => {
    const h = harness();
    h.rec.start();
    key('keydown', MARK_KEY_CODE);
    key('keydown', MARK_KEY_CODE, true);
    key('keydown', MARK_KEY_CODE, true);
    h.rec.stop();
    key('keydown', MARK_KEY_CODE);
    key('keydown', 'Enter');
    expect(readMarks(h.storage)).toHaveLength(1);
    expect(h.rec.inputs).toEqual([]);
  });

  it('keeps the first MARK_MAX_INPUTS inputs and says so when it had to stop', () => {
    const h = harness();
    h.rec.start();
    for (let i = 0; i < MARK_MAX_INPUTS + 10; i++) key('keydown', 'ArrowRight');
    const r = h.rec.mark();
    h.rec.stop();
    expect(r.inputs).toHaveLength(MARK_MAX_INPUTS);
    expect(r.truncated).toBe(true);
  });

  it('records a pad button edge once when it goes down and once when it comes up', () => {
    const pad = { index: 0, buttons: [{ pressed: false }, { pressed: false }] };
    const frames: Array<() => void> = [];
    const fakeWin = {
      addEventListener: window.addEventListener.bind(window),
      removeEventListener: window.removeEventListener.bind(window),
      requestAnimationFrame: (f: () => void) => { frames.push(f); return frames.length; },
      cancelAnimationFrame: () => undefined,
      navigator: { getGamepads: () => [pad] },
      innerWidth: 800, innerHeight: 450, devicePixelRatio: 1,
    } as unknown as Window;
    const h = harness({ win: fakeWin });
    h.rec.start();
    const tick = () => frames.shift()?.();
    tick();
    pad.buttons[0]!.pressed = true;
    tick();
    tick();
    pad.buttons[0]!.pressed = false;
    tick();
    h.rec.stop();
    expect(h.rec.inputs.map((i) => (i.k === 'pad' ? `${i.b}:${i.d}` : i.k))).toEqual(['0:1', '0:0']);
  });
});

describe('the wiring', () => {
  it('the mark key is the backtick, bound to nothing in either game, the pause screen or the title', () => {
    expect(MARK_KEY_CODE).toBe('Backquote');
    const input = readFileSync(join(ROOT, 'src/app/Input.ts'), 'utf8');
    expect(input).not.toContain('Backquote');
    // no other raw key handler in src names it, and the abstract key map has no entry for it
    const keyMap = /const KEY_MAP[^{]*\{([\s\S]*?)\n\};/.exec(input)?.[1] ?? '';
    expect(keyMap.length).toBeGreaterThan(100);
    expect(keyMap).not.toMatch(/Backquote|Backslash/);
  });

  it('the battle screen starts the recorder when it begins and stops it when it goes; the build gives a short commit and a bundle name', () => {
    const screen = readFileSync(join(ROOT, 'src/app/screens/BattleScreen.ts'), 'utf8');
    expect(screen).toMatch(/this\.markRecorder = startMarkRecorder\(/);
    expect(screen).toMatch(/this\.markRecorder\?\.stop\(\)/);
    const b = buildInfo();
    expect(b.sha).toMatch(/^(unknown|[0-9a-f]{7,40})$/);
    expect(b.bundle.length).toBeGreaterThan(0);
  });

  it('is quiet when the console is the only channel: one info line per mark', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const h = harness({ info: (l) => console.info(l) });
    h.rec.start();
    key('keydown', MARK_KEY_CODE);
    h.rec.stop();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
